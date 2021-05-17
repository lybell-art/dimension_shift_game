let selectMap, importMap;
let mapButtons = [];
let toMenu, retry, nextMap, back;
function setupIntro(){
    selectMap = new WoodenSquareButton("Select Map", windowWidth/2 - btnTexture.width/2, 500);     
    selectMap.manualOnRelease = function(){
        scene = SELECT_MAP;
    }

    importMap = new WoodenSquareButton("Import Map", windowWidth/2 - btnTexture.width/2, 600);
    
    ingameUI.noStroke();
}

function drawIntro(){
    ingameUI.clear();
    drawGolfBG();
    ingameUI.image(logo, windowWidth/2 - logo.width/2, 175, logo.width, logo.height);

	selectMap.draw(ingameUI);
    importMap.draw(ingameUI);
}

function setupMapSelection(){
    for(let i = 0; i < 10; i++){
        mapButtons.push(new WoodenRoundButton(i + 1, 
            (i % 5) * 110 + windowWidth / 2 - 275,
            Math.floor(i / 5)* 110 + 425))
    }
    
    back =  new WoodenSquareButton("Back to Menu", windowWidth/2 - btnTexture.width/2, 800);
    back.manualOnRelease = function(){
        scene = INTRO;
    }
}

function drawMapSelection(){
    ingameUI.clear();
    drawGolfBG();
    ingameUI.image(logo, windowWidth/2 - logo.width/3, 200, logo.width/1.5, logo.height/1.5);

    for(let i = 0; i < 10; i++){
        mapButtons[i].draw(ingameUI);
    }

    back.draw(ingameUI);
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
    nextMap.manualOnRelease = function(){
        level += 1;
        isLoaded = false;
        scene = GAMEPLAY;
    }
}

function drawGameOver(){
    ingameUI.clear();
    drawGolfBG();

    if(isGameover()){
        ingameUI.image(typoOver, windowWidth/2 - typoCong.width/2, 200);
    }
    else{
        ingameUI.image(typoCong, windowWidth/2 - typoCong.width/2, 200);

        let s = 'Your Score: ' + (parScore - attempt);

        ingameUI.textFont(font)
        ingameUI.textSize(30)
        ingameUI.fill(0);
        ingameUI.textAlign(CENTER, CENTER);
        ingameUI.text(s, windowWidth/2, 350);

        if(level < 10){
            if(unlock){
                s = 'Level ' + (level + 1) + ' unlocked!';
                ingameUI.text(s, windowWidth/2, 400);
            }
            nextMap.draw(ingameUI);
        }
    }

    toMenu.draw(ingameUI);
    retry.draw(ingameUI);
}

function drawGolfBG(){
    ingameUI.image(golfBg, 
        windowWidth/2 - golfBg.width/2 + (mouseX - windowWidth/2) * 0.05, 
        windowHeight/2 - golfBg.height/2 + (mouseY - windowHeight/2) * 0.05 );
    ingameUI.fill(255, 255, 255, 100);
    ingameUI.rect(150, 50, windowWidth - 300, windowHeight - 100, 20);
}

function drawIngameUI(){
    let s = 'Current Score: ' + (parScore-attempt);
    ingameUI.clear();
    ingameUI.image(logo, windowWidth/2 - logo.width/3, 100, logo.width/1.5, logo.height/1.5);

    ingameUI.textFont(font)
    ingameUI.fill(255, 255, 255);
    ingameUI.textSize(17)
    ingameUI.textAlign(CENTER, CENTER);
    ingameUI.text(s, windowWidth/2, 100 + logo.height/1.5 + 20);

    // ingameUI.background(random(255));
}