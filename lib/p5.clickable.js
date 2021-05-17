//Determines if the mouse was pressed on the previous frame
var cl_mouseWasPressed = false;
//Last hovered button
var cl_lastHovered = null;
//Last pressed button
var cl_lastClicked = null;
//All created buttons
var cl_clickables = [];

//This function is what makes the magic happen and should be ran after
//each draw cycle.
p5.prototype.runGUI = function () {
	for (i = 0; i < cl_clickables.length; ++i) {
		if (cl_lastHovered != cl_clickables[i])
			cl_clickables[i].onOutside();
	}
	if (cl_lastHovered != null) {
		if (cl_lastClicked != cl_lastHovered) {
			cl_lastHovered.onHover();
		}
	}
	if (!cl_mouseWasPressed && cl_lastClicked != null) {
		cl_lastClicked.onPress();
	}
	if (cl_mouseWasPressed && !mouseIsPressed && cl_lastClicked != null) {
		if (cl_lastClicked == cl_lastHovered) {
			cl_lastClicked.onRelease();
		}
		cl_lastClicked = null;
	}
	cl_lastHovered = null;
	cl_mouseWasPressed = mouseIsPressed;
}

p5.prototype.registerMethod('post', p5.prototype.runGUI);

//This function is used to get the bounding size of a
//string of text for use in the 'textScaled' property
function getTextBounds(m, font, size) {
	let txt = document.createElement("span");
	document.body.appendChild(txt);

	txt.style.font = font;
	txt.style.fontSize = size + "px";
	txt.style.height = 'auto';
	txt.style.width = 'auto';
	txt.style.position = 'absolute';
	txt.style.whiteSpace = 'no-wrap';
	txt.innerHTML = m;

	let width = Math.ceil(txt.clientWidth);
	let height = Math.ceil(txt.clientHeight);
	document.body.removeChild(txt);
	return [width, height];
}

//Button Class
function Clickable(s= "Press me", x = 0, y = 0) {
	this.x = x;			//X position of the clickable
	this.y = y;			//Y position of the clickable
	this.width = 100;		//Width of the clickable
	this.height = 50;		//Height of the clickable
	this.color = "#FFFFFF";		//Background color of the clickable
	this.cornerRadius = 10;		//Corner radius of the clickable
	this.strokeWeight = 2;		//Stroke width of the clickable
	this.stroke = "#000000";	//Border color of the clickable
	this.text = s;		//Text of the clickable
	this.textColor = "#000000";	//Color for the text shown
	this.textSize = 12;		//Size for the text shown
	this.textFont = "sans-serif";	//Font for the text shown
	this.textScaled = false;     //Scale the text with the size of the clickable
	
	// image options
	this.image = null; // image object from p5loadimage()
	this.tint = null; // tint image using color
	this.noTint = true; // default to disable tinting
	this.filter = null; // filter effect

	this.updateTextSize = function () {
		if (this.textScaled) {
			for (let i = this.height; i > 0; i--) {
				if (getTextBounds(this.text, this.textFont, i)[0] <= this.width && getTextBounds(this.text, this.textFont, i)[1] <= this.height) {
					console.log("textbounds: " + getTextBounds(this.text, this.font, i));
					console.log("boxsize: " + this.width + ", " + this.height);
					this.textSize = i / 2;
					break;
				}
			}
		}
	}
	this.updateTextSize();

	this.onHover = function () {
		//This function is ran when the clickable is hovered but not
		//pressed.
	}

	this.onOutside = function () {
		//This function is ran when the clickable is NOT hovered.
	}

	this.onPress = function () {
		//This fucking is ran when the clickable is pressed.
	}

	this.onRelease = function () {
		//This funcion is ran when the cursor was pressed and then
		//released inside the clickable. If it was pressed inside and
		//then released outside this won't work.
	}

	this.locate = function (x, y) {
		this.x = x;
		this.y = y;
	}

	this.resize = function (w, h) {
		this.width = w;
		this.height = h;
		this.updateTextSize();
	}

	this.drawImage = function(graphics){
		graphics.image(this.image, this.x, this.y, this.width, this.height);
		if(this.tint && !this.noTint){
			graphics.tint(this.tint)
		} else {
			graphics.noTint();
		}
		if(this.filter){
			graphics.filter(this.filter);
		}
	}

	this.draw = function (graphics) {
		graphics.push();
		graphics.fill(this.color);
		graphics.stroke(this.stroke);
		graphics.strokeWeight(this.strokeWeight);
		graphics.rect(this.x, this.y, this.width, this.height, this.cornerRadius);
		graphics.fill(this.textColor);
		graphics.noStroke();
		if(this.image){
			this.drawImage(graphics);
		}
		graphics.textAlign(CENTER, CENTER);
		graphics.textSize(this.textSize);
		graphics.textFont(this.textFont);
		graphics.text(this.text, this.x + this.width / 2 , this.y + this.height / 2.5);
		if (mouseX >= this.x && mouseY >= this.y
			&& mouseX < this.x + this.width && mouseY < this.y + this.height) {
			cl_lastHovered = this;
			if (mouseIsPressed && !cl_mouseWasPressed)
				cl_lastClicked = this;
		}
		graphics.pop();
	}

	cl_clickables.push(this);
}