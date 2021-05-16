let world, ball;
let myShader;

function cycle(n, p, c)
{
	let v=n+p;
	return v-Math.floor(v/c)*c;
}
function flip(x, axis)
{
	let dist=x-axis;
	return axis - dist;
}

class cubeSpace
{
	constructor()
	{
		this.row=10; // number Y
		this.column=10; // number X
		this.cellWidth=50;
		this.level = 0;
		this.cells=[];
		this.bounding=[];
		this.face = 0;
		this.r = 0;
		this.nextFace= 0;
		this.rotateDir=0;
	}
	get width()
	{
		return this.column * this.cellWidth;
	}
	get height()
	{
		return this.row * this.cellWidth;
	}
	get upperBound()
	{
		return -this.height /2;
	}
	get lowerBound()
	{
		return this.height/2;
	}
	get leftBound()
	{
		return -this.width /2;
	}
	get rightBound()
	{
		return this.width/2;
	}
	rotate(direction)
	{
		this.rotateDir=direction;
		this.nextFace=cycle(this.nextFace, direction, 4);
	}
	operate()
	{
		if(this.rotateDir != 0)
		{
			this.r = cycle(this.r, this.rotateDir * 5, 360);
			if(this.r ==this.nextFace * 90)
			{
				this.rotateDir = 0;
				this.face = this.nextFace;
			}
			return true;
		}
		return false;
	}
	getGrid(_x, _y)
	{
		let x = _x - this.leftBound;
		let y = _y - this.upperBound;
		return [Math.floor(x/this.cellWidth), Math.floor(y/this.cellWidth)];
	}
	isStartEndPoint(mode)
	{
		return mode == 2 || mode == 3;
	}
	render()
	{
		push();
		stroke(25);
		noFill();
		rotateY(this.r / 180 * PI);
		strokeWeight(3);
		box(this.width, this.height, this.width);
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
						  -(this.cellWidth * y - this.height / 2 + this.cellWidth/2), 
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

class ballPlayer
{
	constructor()
	{
		this.pos=new p5.Vector();
		this.dir=p5.Vector.random2D();
		this.dir.mult(5);
		this.radius = 10;
		this.isMoving=true;
		this.applyGravity=true;
	}
	get gravityMag()
	{
		return 0.2;
	}
	get gravity()
	{
		return -this.gravityMag;
	}
	get x()
	{
		return this.pos.x;
	}
	get y()
	{
		return this.pos.y;
	}
	checkNearestGround(map, pos = null)
	{
		let target = (pos === null) ? this.pos.copy() : pos;
		return map.upperBound;
	}
	checkBound(prepos, predir, map)
	{
		let collided = false;
		if(this.pos.y - this.radius < map.upperBound)
		{
			this.pos.y = flip(this.pos.y, map.upperBound + this.radius);
			this.dir.y = Math.abs(this.dir.y);
			collided = true;
		}
		else if(this.pos.y + this.radius > map.lowerBound)
		{
			this.pos.y = flip(this.pos.y, map.lowerBound - this.radius);
			this.dir.y = -Math.abs(this.dir.y);
			collided = true;
		}
		if(this.pos.x - this.radius < map.leftBound)
		{
			this.pos.x = flip(this.pos.x, map.leftBound + this.radius);
			this.dir.x = Math.abs(this.dir.x);
			collided = true;
		}
		else if(this.pos.x + this.radius > map.rightBound)
		{
			this.pos.x = flip(this.pos.x, map.rightBound - this.radius);
			this.dir.x = -Math.abs(this.dir.x);
			collided = true;
		}
		if(collided)
		{
			this.dir.mult(0.9);
			
			let ground = this.checkNearestGround(map);
			console.log(ground, Math.abs(this.pos.y - ground), this.gravityMag + this.radius, Math.abs(this.dir.y) );
			if (Math.abs(this.pos.y - ground) <= this.gravityMag*3 + this.radius && Math.abs(this.dir.y) <= this.gravityMag*3){
				this.applyGravity = false;
				this.dir.y = 0;
				this.pos.y = ground  + this.radius;
			}
			else this.applyGravity = true;
		}
		if(!this.applyGravity)
		{
			if(Math.abs(this.dir.x) < 0.4){
				this.dir.x = 0;
				this.isMoving = false;
			}
		}
	}
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
	myShader = loadShader("../shader/shader.vert", "../shader/shader.frag");
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
	orbitControl();
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
