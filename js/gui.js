class WoodenSquareButton extends Clickable{
    constructor(s, x, y){
        super(s, x, y);

        this.textFont = font;
        this.strokeWeight = 0;
        this.image = btnTexture;
        this.height = btnTexture.height;
        this.width = btnTexture.width;
        this.textSize = 20
        this.color = color(0,0,0,0);

        this.manualOnRelease = function(){}
        this.manualOnOutside = function(){}
        this.manualOnPress = function(){}

        this.onPress = function(){
            this.image = btnPressedTexture;
            this.manualOnPress();
        }
        this.onOutside = function(){
            this.image = btnTexture;
            this.manualOnOutside();
        }
        this.onRelease = function(){
            buttonClickSound.play()
            this.manualOnRelease();
        }

    }

}

class WoodenRoundButton extends Clickable{
    constructor(index, x, y){
        super(index, x, y);
        this.level = index;
        
        this.textFont = font;
        this.strokeWeight = 0;
        this.image = rbtnTexture;
        this.locked = 0;

        if(this.level > 10){
            this.locked = 1;
            this.text = ""
            this.image = rbtnlockedTexture;
        }

        this.height = rbtnTexture.height;
        this.width = rbtnTexture.width;
        this.textSize = 37
        this.color = color(0,0,0,0);

        this.manualOnRelease = function(){}
        this.manualOnOutside = function(){}
        this.manualOnPress = function(){}

        this.onPress = function(){
            if(!this.locked){
                this.image = rbtnPressedTexture;
                this.manualOnPress();
            }
        }
        this.onOutside = function(){
            if(!this.locked){
                this.image = rbtnTexture;
                this.manualOnOutside();
            }
        }
        this.onRelease = function(){
            if(!this.locked){
                buttonClickSound.play()
                level = this.level;
                isLoaded = false;
                scene = GAMEPLAY;
                restartLevel()
            }
        }
    }

    locked(){
        return this.locked;
    }

    unlock(){
        this.locked = 0;
        this.image = rbtnTexture;
        this.text = this.level;
    }
}