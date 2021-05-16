let world, ball;
let myShader;
/*
function getLevelData(level)
{
	let levelData = fetch("map/levels.json").then(response => response.json()).then(json => json[level]);
	console.log(levelData);
}*/

//util function

//cycle-원형 사이클을 리턴.
//n:원본, p:더하거나 뺄 값, c:주기
function cycle(n, p, c)
{
	let v=n+p;
	return v-Math.floor(v/c)*c;
}
//flip-axis에 대해 x를 뒤집음
function flip(x, axis)
{
	let dist=x-axis;
	return axis - dist;
}

//맵 클래스
class cubeSpace
{
	//생성자
	constructor()
	{
		this.row=10; // number Y
		this.column=10; // number X
		this.cellWidth=50; // cell's width
		this.level = 0; // current level
		this.cells=[]; // all cell's data
		this.bounding=[]; // bounding box
		this.face = 0; // current facing(0~4)
		this.r = 0; // rotation degree(for animation)
		this.nextFace= 0; // next facing - for rotating stage
		this.rotateDir=0; // rotation directio
	}
	//stage's width
	get width(){
		return this.column * this.cellWidth;
	}
	//stage's height
	get height(){
		return this.row * this.cellWidth;
	}
	//stage's bounds -idk why rendering stage is flipped:(
	get upperBound(){
		return -this.height /2;
	}
	get lowerBound(){
		return this.height/2;
	}
	get leftBound(){
		return -this.width /2;
	}
	get rightBound(){
		return this.width/2;
	}
	//calling stage rotation
	rotate(direction)
	{
		this.rotateDir=direction;
		this.nextFace=cycle(this.nextFace, direction, 4);
	}
	//animation stage rotation
	operate()
	{
		if(this.rotateDir != 0)
		{
			this.r = cycle(this.r, this.rotateDir * 5, 360);
			if(this.r ==this.nextFace * 90) //if rotating animation is ended
			{
				this.rotateDir = 0;
				this.face = this.nextFace;
				this.bounding=this.getBound();
			}
			return true;
		}
		return false;
	}
	
	//convert gloval coordinate to grid coordinate
	getGrid(_x, _y)
	{
		let x = _x - this.leftBound;
		let y = _y - this.upperBound;
		return [Math.floor(x/this.cellWidth), Math.floor(y/this.cellWidth)];
	}
	
	//start:2, end:3
	isStartEndPoint(mode)
	{
		return mode == 2 || mode == 3;
	}
	
	//get bounding box
	getBound(_face=null)
	{
		let face = _face===null ? this.face : _face;
		let x, z, slideDir, depthDir;
		//get starting point
		switch(face)
		{
			case 0:x=0; z=this.column-1; slideDir=1; depthDir=-1; break;
			case 1:x=0; z=0; slideDir=1; depthDir=1; break;
			case 2:x=this.column-1; z=0; slideDir=-1; depthDir=1; break;
			case 3:x=this.column-1; z=this.column-1; slideDir=-1; depthDir=-1; break;
		}
		
		//현재 바라보는 위치의 왼쪽 위부터 스캔합니다.
		let res=[], xx=(face % 2 == 0)?x:z, zz;
		for(let i=0; i<this.row; i++)
		{
			res.push([]);
			for(let j=0; j<this.column; j++)	
			{
				res[i].push(0);
				zz=(face % 2 == 0)?z:x;
				for(let k=0; k<Math.floor(this.column/2); k++)
				{
					let cell=this.cells[xx][j][zz];
					if(cell !== 0 && !this.isStartEndPoint(cell))
					{
						res[j][i]=cell;
						break;
					}
					zz+=depthDir;
				}
			}
			xx+=slideDir;
		}
		return res;
	}
	
	//rendering stage
	render()
	{
		push();
		
		//draw outer frage
		stroke(25);
		noFill();
		rotateY(this.r / 180 * PI);
		strokeWeight(3);
		box(this.width, this.height, this.width);
		
		//draw objects
		strokeWeight(1);
		shader(myShader);
/*		for(let x=0; x<this.column; x++)
		{
			for(let y=0;y<this.row;y++)
			{
				for(let z=0;z<this.column;z++)
				{
					let currentCell=this.cells[x][y][z];
					if(currentCell == 0) continue;
					switch(currentCell)
					{
						case 1:fill(255); break;
						case 2:fill(0,255,0); break;
						case 3:fill(255,255,0); break;
					}
					push();
					translate(this.cellWidth * x - this.width / 2 + this.cellWidth/2, 
						  -(this.cellWidth * y - this.height / 2 + this.cellWidth/2), 
						  this.cellWidth * z - this.width / 2 + this.cellWidth/2 );
					if( this.isStartEndPoint(currentCell) ) sphere(this.cellWidth / 3);
					else box(this.cellWidth);
					pop();
				}
			}
		}*/
		resetShader();
		pop();
	}
}

//플레이어 클래스
class ballPlayer
{
	//생성자
	constructor()
	{
		this.pos=new p5.Vector();
		this.dir=p5.Vector.random2D();
		this.dir.mult(5);
		this.radius = 10;
		this.isMoving=true;
		this.applyGravity=true;
	}
	
	//gravity getter
	get gravityMag(){
		return 0.2;
	}
	get gravity(){
		return -this.gravityMag;
	}
	
	//position getter
	get x(){
		return this.pos.x;
	}
	get y(){
		return this.pos.y;
	}
	
	//nearest ground checking
	checkNearestGround(map, pos = null)
	{
		let target = (pos === null) ? this.pos.copy() : pos;
		return map.upperBound;
	}
	
	//bound check&reflection
	checkBound(prepos, predir, map)
	{
		let collidedH = false, collidedV = false; //colliderH:가로선과 충돌 //colliderV:세로선과 충돌
		
		//wall bound checking
		if(this.pos.y - this.radius < map.upperBound)
		{
			this.pos.y = flip(this.pos.y, map.upperBound + this.radius);
			this.dir.y = Math.abs(this.dir.y);
			collidedH = true;
		}
		else if(this.pos.y + this.radius > map.lowerBound)
		{
			this.pos.y = flip(this.pos.y, map.lowerBound - this.radius);
			this.dir.y = -Math.abs(this.dir.y);
			collidedH = true;
		}
		if(this.pos.x - this.radius < map.leftBound)
		{
			this.pos.x = flip(this.pos.x, map.leftBound + this.radius);
			this.dir.x = Math.abs(this.dir.x);
			collidedV = true;
		}
		else if(this.pos.x + this.radius > map.rightBound)
		{
			this.pos.x = flip(this.pos.x, map.rightBound - this.radius);
			this.dir.x = -Math.abs(this.dir.x);
			collidedV = true;
		}
		let pre_grid = map.getGrid(prepos.x, prepos.y);
		let cur_grid = map.getGrid(this.pos.x, this.pos.y);
		let gridDistX = cur_grid[0]-pre_grid[0];
		let gridDistY = cur_grid[1]-pre_grid[1];
		/*
		if(map.bounding[cur_grid[0]][cur_grid[1]] == 1)
		{
			if(gridDistX > 0)
			{
				this.pos.x = flip(this.pos.x, map.leftBound + this.radius);
				this.dir.x = Math.abs(this.dir.x);
				collidedV = true;
			}
		}*/
		
		if(collidedH)
		{
			this.dir.y *= 0.9;
			
			//임계점 이하일 때 중력 적용 안 함
			let ground = this.checkNearestGround(map);
			if (Math.abs(this.pos.y - ground) <= this.gravityMag*4 + this.radius && Math.abs(this.dir.y) <= this.gravityMag*4){
				this.applyGravity = false;
				this.dir.y = 0;
				this.pos.y = ground  + this.radius;
			}
			else this.applyGravity = true;
		}
		if(collidedV)
		{
			this.dir.x *=0.9;
		}
		
		//중력 적용 안 할 때-x축 방향으로만 움직임
		if(!this.applyGravity)
		{
			//속도가 임계점 이하일 때 멈춤
			if(Math.abs(this.dir.x) < 0.4){
				this.dir.x = 0;
				this.isMoving = false;
			}
		}
	}
	
	//moving ball
	move(isRotating, map)
	{
		if(this.isMoving)
		{
			if(!isRotating && this.applyGravity) this.dir.y += this.gravity;
			let prePos=this.pos.copy();
			let realDir=this.dir.copy();
			if(isRotating) realDir.mult(0.1);
			this.pos.add(realDir);
			this.checkBound(prePos, realDir, map);
		}
	}
	
	//rendering ball
	render()
	{
		push();
		noStroke();
		fill("#24adaf");
		translate(0,0,980);
		circle(this.x, this.y, this.radius * 2);
		pop();
	}
}

//화면이 회전할 때 검은 반투명 오버레이가 생김
function drawOverlay()
{
	push();
	translate(0,0,970);
	noStroke();
	fill(0,0,0,70);
	plane(width, height);
	pop();
}

function preload()
{
	myShader = loadShader("shader/shader.vert", "shader/shader.frag");
}

function setup()
{
	frameRate(60);
	createCanvas(windowWidth,windowHeight,WEBGL);
	ortho(-width/2, width/2, height/2, -height/2, -2000, 2000);
	world=new cubeSpace();
	ball=new ballPlayer();
	strokeWeight(3);
//	fill(255);	
}

function draw()
{
	background(255);
	ingame();
}

function ingame()
{
	let isRotating=false;
	isRotating = world.operate();
	ball.move(isRotating, world);
	world.render();
	if(isRotating) drawOverlay();
	ball.render();
}

function keyPressed() {
	if (keyCode === LEFT_ARROW) {
		world.rotate(-1);
	} else if (keyCode === RIGHT_ARROW) {
		world.rotate(1);
	}
}
