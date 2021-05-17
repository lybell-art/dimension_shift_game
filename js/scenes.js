var button;

function setupIntro(){
    button = new Clickable()
    button.locate(20, 20);        //Position Button
    button.textFont = font;
    button.onPress = function(){  //When myButton is pressed
      this.color = "#AAAAFF";       //Change button color
      alert("Yay!");
      scene = 1;                //Show an alert message
    }
    button.onHover = function(){
        console.log("hover")
    }
}

function intro(){
	button.draw();
}

function drawIngameUI(){
    let s = 'Current Score: ' + score;
    ingameUI.clear();
    ingameUI.image(logo, windowWidth/2 - logo.width/3, 100, logo.width/1.5, logo.height/1.5);

    ingameUI.textFont(font)
    ingameUI.textSize(17)
    ingameUI.textAlign(CENTER, CENTER);
    ingameUI.text(s, windowWidth/2, 100 + logo.height/1.5 + 20);
    // ingameUI.background(random(255));
}