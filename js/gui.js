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
            this.manualOnRelease();
        }

    }

}