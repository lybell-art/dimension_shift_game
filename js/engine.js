let mainMenu, ingameUI;

let world, ball, isLoaded=false;
let myShader;

let font;
let logo, btnTexture, btnPressedTexture, 
	golfBg, rbtnTexture, rbtnPressedTexture, rbtnlockedTexture,
	typoCong, typoOver, golfballTexture, woodboxTexture, grassTexture,
	cartoonwaterTexture;

const UP="up";
const DOWN="down";
const CENTERX="centerX";
const CENTERY="centerY";
const AIR=0;
const WALL=1;
const START_POINT=2;
const GOAL_POINT=3;
const SAND=4;
const WATER=5;

const INTRO=0;
const GAMEPLAY=1;
const SELECT_MAP=2;
const GAME_OVER=3;

let scene = 0;
let level, unlock;
let attempt=0, parScore;
let buttonClickSound, swingSound, tadaSound, failSound;
let isCustomLevel = false;

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
function between(a, min, max)
{
	return min <= a && a<=max;
}
function collideSquereToCircle(sx, sy, sw, sh, cx, cy, cr)
{
	let ex = sx + sw;
	let ey = sy + sh;
	let h = between(cx, sx, ex);
	let v = between(cy, sy, ey);
	if(h && v) return true;
	else if(h || v)
	{
		let h2= between(cx, sx-cr, ex+cr);
		let v2 = between(cy, sy-cr, ey+cr);
		return h2 || v2;
	}
	else
	{
		let dx = Math.sign(cx - (sx + sw / 2));
		let dy = Math.sign(cy - (sy + sh / 2));
		let ppx= dx == -1 ? sx : ex;
		let ppy= dy == -1 ? sy : ey;
		return (cx - ppx) * (cx - ppx) + (cy - ppy) * (cy - ppy) < cr*cr;
	}
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
		this.startFace = 0;

		this.r = 0; // rotation degree(for animation)
		this.nextFace= 0; // next facing - for rotating stage
		this.rotateDir=0; // rotation direction
		this.canRotate=true;
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
		this.startFace = (typeof(json.startY) === "number") ? json.facing : 0;
		this.face = this.startFace;
		this.bounding = this.getBound(this.face);
		if(this.startX == -1 || this.startY == -1)
		{
			this.getStartPos(true);
		}
		this.r=this.face * 90;
	}
	//calling stage rotation
	rotate(direction)
	{
		if(!this.canRotate) return;
		this.rotateDir=direction;
		this.nextFace=cycle(this.nextFace, direction, 4);
	}

	resetFacing()
	{
		this.face = this.startFace;
		this.r=this.face * 90;
	}

	extractFaceFeature(_x, _y, face)
	{
		let x, z, depthDir;
		switch(face)
		{
			case 0:x=_x; z=this.column-1; depthDir=-1; break;
			case 1:x=0; z=_x; depthDir=1; break;
			case 2:x=this.column-1-_x; z=0; depthDir=1; break;
			case 3:x=this.column-1; z=this.column-1-_x; depthDir=-1; break;
		}

		let res=0;
		for(let k=0; k<Math.ceil(this.column/2); k++)
		{
			let cell=this.cells[x][_y][z];
			if(cell !== AIR)
			{
				res=cell;
				break;
			}
			if(face % 2 == 0) z += depthDir;
			else x +=depthDir;
		}
		return res;
	}

	checkBallOverlap(ball, _face=null)
	{
		let epsilon = 0.0001;
		let topLeft = {x : ball.x - ball.radius, y : ball.y - ball.radius - epsilon};
		let topRight = {x : ball.x - ball.radius, y : ball.y + ball.radius - epsilon};
		let bottomLeft = {x : ball.x + ball.radius, y : ball.y - ball.radius - epsilon};
		let bottomRight = {x : ball.x + ball.radius, y : ball.y + ball.radius - epsilon};

		let tlGrid = this.getGrid(topLeft.x, topLeft.y);
		let brGrid = this.getGrid(bottomRight.x, bottomRight.y);

		let s = ( brGrid[0]-tlGrid[0] )*2 + ( brGrid[1]-tlGrid[1] );

		let face = _face === null ? this.face : _face;
		switch(s)
		{
			case 0:
				let fe = this.extractFaceFeature(tlGrid[0], tlGrid[1], face);
				return [fe];
			case 1:
			case 2:
				let fe1 = this.extractFaceFeature(tlGrid[0], tlGrid[1], face);
				let fe2 = this.extractFaceFeature(brGrid[0], brGrid[1], face);
				return [fe1, fe2];
			case 3:
				let fes = [[0,0],[0,0]], res = [];
				fes[0][0] = this.extractFaceFeature(tlGrid[0], tlGrid[1], face);
				fes[0][1] = this.extractFaceFeature(brGrid[0], tlGrid[1], face);
				fes[1][0] = this.extractFaceFeature(tlGrid[0], brGrid[1], face);
				fes[1][1] = this.extractFaceFeature(brGrid[0], brGrid[1], face);

				let llx = this.getCellBound(tlGrid[0], tlGrid[1], LEFT);
				let lly = this.getCellBound(tlGrid[0], tlGrid[1], UP);
				let cw = this.cellWidth;
				for(let i=0;i<2;i++)
				{
					for(let j=0;j<2;j++)
					{
						let isCollide = collideSquereToCircle(llx + i*cw, lly + j*cw, cw, cw, ball.x, ball.y, ball.radius);
						if(isCollide)
						{
							res.push(fes[j][i]);
						}
					}
				}
				return res;
		}
	}

	checkBallOverlapNext(ball, _face=null)
	{
		let face = _face === null ? this.nextFace : _face;
		let cond=(f) => f != AIR && f != START_POINT && f != GOAL_POINT;

		let overlapData = this.checkBallOverlap(ball, face);
		for(let i=0;i<overlapData.length; i++)
		{
			if(cond(overlapData[i])) return true;
		}
		return false;
	}

	//animation stage rotation
	operate(ball)
	{
		if(this.rotateDir != 0)
		{
			this.r = cycle(this.r, this.rotateDir * 5, 360);
			if(this.r ==this.nextFace * 90) //if rotating animation is ended
			{
				let res = this.checkBallOverlapNext(ball);
				if(res && this.canRotate)
				{
					this.rotateDir *= -1;
					this.nextFace = this.face;
					this.canRotate = false;
				}
				else
				{
					this.rotateDir = 0;
					this.face = this.nextFace;
					this.bounding=this.getBound();
					this.canRotate=true;
					ball.initDrop();
				}
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
		x=constrain(Math.floor(x/this.cellWidth), 0, this.column);
		y=constrain(Math.floor(y/this.cellWidth), 0, this.row);
		return [x,y];
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
		return mode == START_POINT || mode == GOAL_POINT;
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
						if(this.bounding[i][j] == START_POINT)
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
					if(cell !== AIR)
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
					if(currentCell == AIR) continue;
					switch(currentCell)
					{
/*						case WALL:
							if(y == this.row -1) texture(grassTexture);
							else texture(woodboxTexture);
							break;
						case START_POINT:fill(0,255,0); break;
						case GOAL_POINT:fill(255,255,0); break;
						case SAND:fill("#a18d6c"); break;
						case WATER:texture(cartoonwaterTexture); break;*/
						case WALL:
							if(y == this.row -1) fill(255,0,255,0);
							else fill(0,255,255,0);
							break;
						case START_POINT:fill(0,255,0); break;
						case GOAL_POINT:fill(255,255,0); break;
						case SAND:fill("#a18d6c"); break;
						case WATER:fill(0,0,255,0); break;
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
		this.dir=new p5.Vector();
		this.radius = 10;
		this.isMoving=false;
		this.applyGravity=true;
		this.isLaunchStart=false;

		this.preMouse=new p5.Vector();
		this.controlVector=new p5.Vector();
		this.tempPos=[0,0];
		this.isTrapped=false;
		this.trappedFrame=-1;
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
		this.y=map.getCellBound(map.startX, map.startY, DOWN) - this.radius;
		this.dir.mult(0);
		this.isMoving=false;
		this.applyGravity=true;
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
			if(map.bounding[i][gridX] == WALL) return map.getCellBound(gridX, i, UP);
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
		let epsilon = 0.0001;

		let dirXSign = Math.sign(this.dir.x);
		let dirYSign = Math.sign(this.dir.y);
		let pre_grid_x = map.getGrid(prepos.x + dirXSign*this.radius, prepos.y);
		let cur_grid_x = map.getGrid(this.pos.x + dirXSign*this.radius, this.pos.y);

		let pre_grid_y = map.getGrid(prepos.x, prepos.y + dirYSign*this.radius  - epsilon);
		let cur_grid_y = map.getGrid(this.pos.x, this.pos.y + dirYSign*this.radius);

		let gridDistX = cur_grid_x[0]-pre_grid_x[0];
		let gridDistY = cur_grid_y[1]-pre_grid_y[1];

		let touchedX=map.bounding[cur_grid_x[1]][cur_grid_x[0]];
		let touchedY=map.bounding[cur_grid_y[1]][cur_grid_y[0]];

		let touchedV=map.bounding[cur_grid_y[1]][cur_grid_x[0]];

		
		if(touchedX == WALL)
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
		if(touchedY == WALL)
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
		if(touchedX == AIR && touchedY == AIR && touchedV == WALL)
		{
			this.dir.x *= -0.9;
			this.dir.y *= -0.9;
		}
		
		let ground = this.checkNearestGround(map);
		if(collidedH)
		{
			this.dir.y *= 0.85;
			this.dir.x *= 0.95;
			
			//임계점 이하일 때 중력 적용 안 함
			if (Math.abs(this.pos.y - ground) <= this.gravityMag*5 + this.radius && Math.abs(this.dir.y) <= this.gravityMag*5){
				this.applyGravity = false;
				this.dir.y = 0;
				this.pos.y = ground - this.radius;
			}
			else this.applyGravity = true;

			if(this.isGoalReached(map)) return "goal";
		}
		if(collidedV)
		{
			this.dir.x *=0.85;
			this.dir.y *= 0.95;
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
			if((ground - this.radius) - this.y > 0) this.applyGravity=true;

			if(this.isGoalReached(map)) return "goal";
		}
		//수중 항력 계산
		if(this.isInWater(map))
		{
			let density=0.1;
			let dirMag=this.dir.magSq();
			dirMag *= -0.5 * density;
			let dragga = this.dir.copy();
			dragga.setMag(dirMag);
			this.dir.add(dragga);
		}

		return this.getCollision(map);
	}

	prepareLaunch(x, y)
	{
		this.preMouse.set(x,y);
		this.isLaunchStart = true;
	}

	control(x, y)
	{
		const maxMag= 8;
		this.controlVector.set(this.preMouse.x-x, this.preMouse.y-y);
		this.controlVector.mult(maxMag / 200);
		if(this.controlVector.mag() > maxMag) this.controlVector.setMag(maxMag);
	}

	launch()
	{
		let mag=this.controlVector.mag();
		this.isLaunchStart = false;
		if(mag >= 1)
		{
			this.dir.set(this.controlVector);
			this.isMoving=true;
			this.applyGravity=true;
			swingSound.play();
			attempt ++;
			return true;
		}
		return false;
	}

	//moving ball
	move(isRotating, map)
	{
		if(this.isMoving)
		{
			if(!isRotating && this.applyGravity)
			{
				if(this.isInWater(map)) this.dir.y += 0.5 * this.gravity;
				else this.dir.y += this.gravity;
			}
			let prePos=this.pos.copy();
			let realDir=this.dir.copy();
			if(isRotating) realDir.mult(0.1);
			this.pos.add(realDir);
			let status = this.checkBound(prePos, realDir, map);
			switch(status)
			{
				case "missed":
					this.isMoving=false;
					this.applyGravity=false;
					let gridPos = map.getGrid(this.x, this.y);
					this.tempPos[0] = map.getCellBound(gridPos[0], gridPos[1], CENTERX);
					this.tempPos[1] = map.getCellBound(gridPos[0], gridPos[1], DOWN) - this.radius - 3;
					this.trappedFrame = 120;
					this.isTrapped=true;
					attempt ++;

					break;
				case "goal":
					this.isMoving=false;
					this.applyGravity=false;

					scene = GAME_OVER;
					tadaSound.play();
					unlock = 0;
					console.log(mapButtons)
					if(level < 10){
						if(mapButtons[level].locked){
							unlock = 1;
							mapButtons[level].unlock();
						}
					}
					break;
			}
		}
		if(isGameover()){
			scene = GAME_OVER;
			failSound.play();
		}
	}

	initDrop()
	{
		this.isMoving=true;
		this.applyGravity=true;
	}
	resurrection()
	{
		this.x=this.tempPos[0];
		this.y=this.tempPos[1];
	}

	checkBasicCollision(map, n)
	{
		let res=false;
		let gridPos = map.getGrid(this.x, this.y);
		res = (map.bounding[gridPos[1]][gridPos[0]] == n);
		return res;
	}
	isGoalReached(map)
	{
		return this.checkBasicCollision(map, GOAL_POINT);
	}
	isInWater(map)
	{
		return this.checkBasicCollision(map, WATER);
	}
	getCollision(map)
	{
		let collideData = map.checkBallOverlap(this);

		for(let i=0;i<collideData.length;i++)
		{
			if(collideData[i] == SAND) return "missed";
		}
		return "idle";
	}
	
	renderControlTrace()
	{
		let mag=this.controlVector.mag();
		mag = Math.round(mag);
		let newX = this.x;
		let newY = this.y;
		fill(255, 80);
		for(let i=mag;i>0;i--)
		{
			newX += this.controlVector.x * 2;
			newY += this.controlVector.y * 2;
			circle(newX, newY, i);
			newY += this.gravity * 2;
		}
	}

	renderTrapped()
	{
		let alpha;
		if(this.trappedFrame >= 60)
		{
			alpha=(this.trappedFrame - 60) /60 * 255;
			fill(255, alpha);
//			tint(255, alpha);
		}
		else
		{
			alpha = (this.trappedFrame % 20 < 10) ? 255 : 0;
			fill(255, alpha);
//			tint(255, alpha);
		}

		if(this.trappedFrame == 60) this.resurrection();
//		noTint();
		this.trappedFrame--;
		if(this.trappedFrame < 0)
		{
			this.trappedFrame = -1;
			this.isTrapped = false;
		}
	}

	//rendering ball
	render()
	{
		push();
		noStroke();
		translate(0,0,980);
		if(this.isLaunchStart) this.renderControlTrace();
		if(this.isTrapped) this.renderTrapped();
		else fill("#ffffff");
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
	if(world.canRotate) fill(0,0,0,70);
	else fill(255,0,0,70);
	plane(width, height);
	pop();
}

function loadLevel(level)
{
	isLoaded=false;
	fetchLevelData(level, function(json){
		world.loadLevel(json);
		ball.initialize(world);
		isLoaded=true;
		attempt=0; parScore=json.par;});
}

function loadCustomLevel(file)
{
    if(file.type != "application/json")
    {
    	alert("Invalid File! Import .json file.");
    	return false;
    }
    isLoaded = false;
    scene = GAMEPLAY;
    let reader = new FileReader();
    reader.onload = function(event)
    {
    	let data = event.target.result;
    	data = JSON.parse(data.replace(/u'(?=[^:]+')/g, "'"));
    	world.loadLevel(data);
		ball.initialize(world);
		isLoaded=true;
		attempt=0; parScore= typeof(data.par) === "number" ? data.par : 3 ;
    }
    reader.readAsText(file);
}

function restartLevel()
{
	world.resetFacing();
	ball.initialize(world);
	attempt=0;;
}

function getScore()
{
	return attempt - parScore;
}

function isGameover()
{
	return attempt > parScore * 3;
}

function preload()
{
	myShader = loadShader("shader/shader.vert", "shader/shader.frag");

	font = loadFont("essets/fonts/Pacifico-Regular.ttf");

	logo = loadImage("essets/images/logo.png");

	golfballTexture = loadImage("essets/images/golfball.jpg");
	woodboxTexture = loadImage("essets/images/woodbox.png");
	grassTexture = loadImage("essets/images/grass_texture.png");
	cartoonwaterTexture = loadImage("essets/images/cartoonwater.jpg");

	btnTexture = loadImage("essets/images/button.png");
	btnPressedTexture = loadImage("essets/images/button_pressed.png");
	rbtnTexture = loadImage("essets/images/round_button.png");
	rbtnPressedTexture = loadImage("essets/images/round_button_pressed.png");
	rbtnlockedTexture = loadImage("essets/images/round_button_locked.png");

	typoCong = loadImage("essets/images/typo_cong.png");
	typoOver = loadImage("essets/images/typo_over.png");

	buttonClickSound = loadSound("essets/sounds/button_click.wav");
	swingSound = loadSound("essets/sounds/swing.wav");
	tadaSound = loadSound("essets/sounds/tada.wav");
	failSound = loadSound("essets/sounds/fail.wav");

	golfBg = loadImage("essets/images/golf_bg.jpg")
}

function setup()
{
	frameRate(60);
	createCanvas(windowWidth,windowHeight, WEBGL);
	ingameUI = createGraphics(windowWidth, windowHeight);
	ortho(-width/2, width/2, -height/2, height/2, -2000, 2000);
	world=new cubeSpace();
	ball=new ballPlayer();
	strokeWeight(3);

	setupIntro();
	setupGameOver();
	setupMapSelection();
}

function draw()
{
	switch(scene){
		case INTRO:
			drawIntro();
			overlayGUI();
			break;
		case GAMEPLAY:
			background("#75d4ff");
			if(isLoaded) {
				ingame();
				drawIngameUI();
				overlayGUI();
			}
			else
			{
				if(level >= 1) loadLevel(level);
			}
			break;
		case GAME_OVER:
			drawGameOver();
			overlayGUI();
			break;
		case SELECT_MAP:
			drawMapSelection();
			overlayGUI();
			break;
	}
	
}

function overlayGUI(){
	push();
	texture(ingameUI);
	noStroke();
	translate(0, 0, 1000);
	plane(windowWidth, windowHeight);
	pop();
}

function shaderUniforms()
{
	myShader.setUniform("tGrassTexture", grassTexture);
	myShader.setUniform("tBoxTexture", woodboxTexture);
	myShader.setUniform("tWaterTexture", cartoonwaterTexture);
}

function ingame()
{
	orbitControl();
	shaderUniforms();
	let isRotating=false;
	isRotating = world.operate(ball);
	if(ball.isLaunchStart && mouseIsPressed) ball.control(mouseX, mouseY);
	ball.move(isRotating, world);
	world.render();
	if(isRotating) drawOverlay();
	ball.render();
}

function keyPressed() {
	if(!ball.isTrapped && scene == GAMEPLAY)
	{
		if (keyCode === LEFT_ARROW || keyCode === 65) { //A
			world.rotate(1);
		} else if (keyCode === RIGHT_ARROW || keyCode === 68) { //D
			world.rotate(-1);
		}
		else if(keyCode == 82){ //R
			restartLevel();
		}
	}
}

function mousePressed()
{
	if(!ball.isLaunchStart && !ball.isMoving && !ball.isTrapped && scene == GAMEPLAY)
	{
		ball.prepareLaunch(mouseX, mouseY);
	}
}

function mouseReleased()
{
	if(ball.isLaunchStart && scene == GAMEPLAY)
	{
		ball.launch();
	}
}

function windowResized()
{
	resizeCanvas(windowWidth, windowHeight, false);
	ortho(-width/2, width/2, -height/2, height/2, -2000, 2000);
}
