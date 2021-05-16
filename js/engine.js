let world, ball, isLoaded=false;
let myShader;
const UP="up";
const DOWN="down";
const CENTERX="centerX";
const CENTERY="centerY";

function fetchLevelData(level, callback)
{
	fetch("map/levels.json").then(res => res.json() ).then(json => callback(json[level - 1]));
}


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
		this.startX = 0; // ball's start x position
		this.startY = 0; // ball's start y position

		this.r = 0; // rotation degree(for animation)
		this.nextFace= 0; // next facing - for rotating stage
		this.rotateDir=0; // rotation direction
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
	//load data
	loadLevel(json)
	{
		console.log(json);
		this.level = json.level;
		this.row = json.row;
		this.column = json.column;
		this.cells = json.cells;
		this.startX = (typeof(json.startX) === "number") ? json.startX : -1;
		this.startY = (typeof(json.startY) === "number") ? json.startY : -1;
		this.face = (typeof(json.startY) === "number") ? json.facing : 0;
		this.bounding = this.getBound(this.face);
		if(this.startX == -1 || this.startY == -1)
		{
			this.getStartPos(true);
		}
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
	getCellBound(_x, _y, direction)
	{
		let halfHeight=height/2;
		switch(direction){
			case LEFT:
				return _x * this.cellWidth + this.leftBound;
			case RIGHT:
				return (_x+1) * this.cellWidth + this.leftBound;
			case UP:
				return (_y) * this.cellWidth + this.upperBound;
			case DOWN:
				return (_y+1) * this.cellWidth + this.upperBound;
			case CENTERX:
				return (_x+0.5) * this.cellWidth + this.leftBound;
			case CENTERY:
				return (_y+0.5) * this.cellWidth + this.upperBound;
		}
	}
	
	//start:2, end:3
	isStartEndPoint(mode)
	{
		return mode == 2 || mode == 3;
	}
	
	getStartPos(initialize = false)
	{
		let res;
		if(initialize)
		{
			let isFound=false;
			for(let p=0; p<4; p+=2)
			{
				this.face = p;
				this.bounding = this.getBound(p);
				for(let i=0;i<this.row; i++)
				{
					for(let j=0;j<this.column;j++)
					{
						if(this.bounding[i][j] == 2)
						{
							res={x:j, y:i};
							this.startX = j;
							this.startY = i;
							isFound=true;
							break;
						}
					}
					if(isFound) break;
				}
				if(isFound) break;
			}
		}
		else{
			res={x:this.startX, y:this.startY};
		}
		console.log(res);
		return res;
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
		for(let i=0;i<this.row;i++)
		{
			res.push([]);
			for(let j=0;j<this.column;j++) res[i].push(0);
		}

		for(let i=0; i<this.column; i++)
		{
			for(let j=0; j<this.row; j++)	
			{
				zz=(face % 2 == 0)?z:x;
				for(let k=0; k<Math.ceil(this.column/2); k++)
				{
					let cell=(face % 2 == 0) ? this.cells[xx][j][zz] : this.cells[zz][j][xx];
					if(cell !== 0)
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
		for(let x=0; x<this.column; x++)
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
						  this.cellWidth * y - this.height / 2 + this.cellWidth/2, 
						  this.cellWidth * z - this.width / 2 + this.cellWidth/2 );
					if( this.isStartEndPoint(currentCell) ) sphere(this.cellWidth / 3);
					else box(this.cellWidth);
					pop();
				}
			}
		}
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
		return this.gravityMag;
	}
	
	//position getter
	get x(){
		return this.pos.x;
	}
	get y(){
		return this.pos.y;
	}
	set x(_x){
		this.pos.x = _x;
	}
	set y(_y){
		this.pos.y = _y;
	}

	//initialize
	initialize(map)
	{
		this.x=map.getCellBound(map.startX, map.startY, CENTERX);
		this.y=map.getCellBound(map.startX, map.startY, DOWN) - this.radius - 10;
		console.log(this.x, this.y);
	}
	
	//nearest ground checking
	checkNearestGround(map, pos = null)
	{
		let target = (pos === null) ? this.pos.copy() : pos;
		let posGrid= map.getGrid(this.x, this.y);
		let gridX = posGrid[0], gridY = posGrid[1];
		let i;
		for(i=gridY; i<map.row; i++)
		{
			if(map.bounding[i][gridX] == 1) return map.getCellBound(gridX, i, UP);
		}
		return map.lowerBound;
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

		//cell bound checking
		let dirXSign = Math.sign(this.dir.x);
		let dirYSign = Math.sign(this.dir.y);
		let pre_grid_x = map.getGrid(prepos.x + dirXSign*this.radius, prepos.y);
		let cur_grid_x = map.getGrid(this.pos.x + dirXSign*this.radius, this.pos.y);

		let pre_grid_y = map.getGrid(prepos.x, prepos.y + dirYSign*this.radius);
		let cur_grid_y = map.getGrid(this.pos.x, this.pos.y + dirYSign*this.radius);

		let gridDistX = cur_grid_x[0]-pre_grid_x[0];
		let gridDistY = cur_grid_y[1]-pre_grid_y[1];

		let touchedX=map.bounding[cur_grid_x[1]][cur_grid_x[0]];
		let touchedY=map.bounding[cur_grid_y[1]][cur_grid_y[0]];
		
		if(touchedX == 1)
		{
			if(gridDistX > 0)
			{
				this.pos.x = flip(this.pos.x, map.getCellBound(cur_grid_x[0], cur_grid_x[1], LEFT) - this.radius);
				this.dir.x = -Math.abs(this.dir.x);
				collidedV = true;
			}
			else if(gridDistX < 0)
			{
				this.pos.x = flip(this.pos.x, map.getCellBound(cur_grid_x[0], cur_grid_x[1], RIGHT) + this.radius);
				this.dir.x = Math.abs(this.dir.x);
				collidedV = true;
			}
		}
		if(touchedY == 1)
		{
			if(gridDistY > 0)
			{
				this.pos.y = flip(this.pos.y, map.getCellBound(cur_grid_y[0], cur_grid_y[1], UP) - this.radius);
				this.dir.y = -Math.abs(this.dir.y);
				collidedH = true;
			}
			else if(gridDistY < 0)
			{
				this.pos.y = flip(this.pos.y, map.getCellBound(cur_grid_y[0], cur_grid_y[1], DOWN) + this.radius);
				this.dir.y = Math.abs(this.dir.y);
				collidedH = true;
			}
		}
		
		if(collidedH)
		{
			this.dir.y *= 0.9;
			this.dir.x *= 0.96;
			
			//임계점 이하일 때 중력 적용 안 함
			let ground = this.checkNearestGround(map);
			if (Math.abs(this.pos.y - ground) <= this.gravityMag*5 + this.radius && Math.abs(this.dir.y) <= this.gravityMag*5){
				this.applyGravity = false;
				this.dir.y = 0;
				this.pos.y = ground - this.radius;
			}
			else this.applyGravity = true;
		}
		if(collidedV)
		{
			this.dir.x *=0.9;
			this.dir.y *= 0.96;
		}
		
		//중력 적용 안 할 때-x축 방향으로만 움직임
		if(!this.applyGravity)
		{
			this.dir.x *= 0.95; //마찰력 적용
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

function loadLevel(level)
{
	isLoaded=false;
	fetchLevelData(level, function(json){
		world.loadLevel(json);
		ball.initialize(world);
		isLoaded=true;});
}

function preload()
{
	myShader = loadShader("shader/shader.vert", "shader/shader.frag");
}

function setup()
{
	frameRate(60);
	createCanvas(windowWidth,windowHeight,WEBGL);
	ortho(-width/2, width/2, -height/2, height/2, -2000, 2000);
	world=new cubeSpace();
	ball=new ballPlayer();
	strokeWeight(3);
	loadLevel(1);
//	fill(255);	
}

function draw()
{
	background(255);
	orbitControl();
	if(isLoaded) ingame();
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
		world.rotate(1);
	} else if (keyCode === RIGHT_ARROW) {
		world.rotate(-1);
	}
}

function windowResized()
{
	resizeCanvas(windowWidth, windowHeight, false);
	ortho(-width/2, width/2, height/2, -height/2, -2000, 2000);
}
