let selectMap, importMap;
let toMenu, retry, nextMap;
function setupIntro(){
    selectMap = new WoodenSquareButton("Select Map", windowWidth/2 - btnTexture.width/2, 500);     
    selectMap.manualOnRelease = function(){
        scene = 1;
    }

    importMap = new WoodenSquareButton("Import Map", windowWidth/2 - btnTexture.width/2, 600);
    
    ingameUI.noStroke();
    ingameUI.fill(255, 255, 255, 100);
}

function drawIntro(){
    ingameUI.clear();
    drawGolfBG();
    ingameUI.image(logo, windowWidth/2 - logo.width/2, 200, logo.width, logo.height);

	selectMap.draw(ingameUI);
    importMap.draw(ingameUI);
}

function drawMapSelection(){
    ingameUI.clear();
    drawGolfBG();
}

function setupGameOver(){
    toMenu = new WoodenSquareButton("Back to Menu", windowWidth/2 - btnTexture.width/2, 500);
    toMenu.manualOnRelease = function(){
        scene = INTRO;
    }
    retry = new WoodenSquareButton("Try Again", windowWidth/2 - btnTexture.width/2, 600);
    retry.manualOnRelease = function(){
        restartLevel();
        scene = GAMEPLAY;
    }
    nextMap = new WoodenSquareButton("Next Map", windowWidth/2 - btnTexture.width/2, 700);
}

function drawGameOver(){
    ingameUI.clear();
    drawGolfBG();

    toMenu.draw(ingameUI);
    retry.draw(ingameUI);
    nextMap.draw(ingameUI);
}

function drawGolfBG(){
    ingameUI.image(golfBg, 
        windowWidth/2 - golfBg.width/2 + (mouseX - windowWidth/2) * 0.07, 
        windowHeight/2 - golfBg.height/2 + (mouseY - windowHeight/2) * 0.07 );
    ingameUI.rect(150, 50, windowWidth - 300, windowHeight - 100, 20);
}

function drawIngameUI(){
    let s = 'Current Score: ' + (parScore-attempt);
    ingameUI.clear();
    ingameUI.image(logo, windowWidth/2 - logo.width/3, 100, logo.width/1.5, logo.height/1.5);

    ingameUI.textFont(font)
    ingameUI.textSize(17)
    ingameUI.textAlign(CENTER, CENTER);
    ingameUI.text(s, windowWidth/2, 100 + logo.height/1.5 + 20);

    // ingameUI.background(random(255));
}