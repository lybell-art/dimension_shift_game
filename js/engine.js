let world, ball;

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
		this.width=500;
		this.height=500;
		this.level = 0;
		this.bounding=[];
		this.face = 0;
		this.r = 0;
		this.nextFace= 0;
		this.rotateDir=0;
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
	render()
	{
		push();
		rotateY(this.r / 180 * PI);
		box(this.width, this.height, this.width);
		pop();
	}
}

class ballPlayer
{
	constructor()
	{
		this.pos=new p5.Vector();
		this.dir=p5.Vector.random2D();
		this.radius = 5;
		this.isMoving=true;
	}
	get gravity()
	{
		return 1;
	}
	get x()
	{
		return this.pos.x;
	}
	get y()
	{
		return this.pos.y;
	}
	checkBound(prepos, predir, map)
	{
		let collided = false;
		if(this.pos.y - this.radius < map.upperBound)
		{
			this.pos.y = flip(this.pos.y, map.upperBound);
			this.dir.y = Math.abs(this.dir.y);
			collided = true;
		}
		else if(this.pos.y + this.radius > map.lowerBound)
		{
			this.pos.y = flip(this.pos.y, map.lowerBound);
			this.dir.y = -Math.abs(this.dir.y);
			collided = true;
		}
		if(this.pos.x - this.radius < map.leftBound)
		{
			this.pos.y = flip(this.pos.x, map.leftBound);
			this.dir.y = Math.abs(this.dir.x);
			collided = true;
		}
		else if(this.pos.x + this.radius > map.rightBound)
		{
			this.pos.x = flip(this.pos.x, map.rightBound);
			this.dir.x = -Math.abs(this.dir.x);
			collided = true;
		}
		if(collided)
		{
			this.dir.mult(0.9);
		}
	}
	move(isRotating, map)
	{
		if(this.isMoving)
		{
			this.dir.y += this.gravity;
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
		circle(this.x, this.y, this.radius * 2);
		pop();
	}
}

function drawOverlay()
{
	push();
	translate(0,0,-300);
	fill(0,0,0,70);
	plane(width, height);
	pop();
}

function setup()
{
	frameRate(60);
	createCanvas(windowWidth,windowHeight,WEBGL);
	ortho();
	world=new cubeSpace();
	ball=new ballPlayer();
	fill(255);
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
