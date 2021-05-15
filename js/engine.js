let world, ball;

function cycle(n, p, c)
{
	let v=n+p;
	return v-Math.floor(v/c)*c;
}

class cubeSpace
{
	constructor()
	{
		this.size=500;
		this.level = 0;
		this.bounding=[];
		this.face = 0;
		this.r = 0;
		this.nextFace= 0;
		this.rotateDir=0;
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
		rotateY(this.r / 180 * PI);
		box(this.size);
	}
}

class ballPlayer
{
	constructor()
	{
		this.pos=new p5.Vector();
		this.dir=new p5.Vector.random2D();
		this.isMoving=true;
	}
	checkBound()
	{
	}
	move(isRotating)
	{
		if(this.isMoving)
		{
			let realDir=this.dir.copy();
			if(isRotating) realDir.mult(0.1);
			this.pos.add(realDir);
		}
	}
	render()
	{
		push();
		circle(this.pos.x, this.pos.y,10);
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
	world=new cubeSpace(500);
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
	ball.move(isRotating);
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
