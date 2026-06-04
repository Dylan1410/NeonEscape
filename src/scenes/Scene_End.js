class Scene_End extends Phaser.Scene{
constructor(){
super("Scene_End");
}

init(data){
this.victoria = data.victoria;
this.score = data.score;
}

create(){

this.add.rectangle(450,300,900,600,0x050816);

const texto = this.victoria ? "VICTORIA" : "GAME OVER";

this.add.text(450,180,texto,{
fontSize:"52px",
color:"#00ffcc"
}).setOrigin(0.5);

this.add.text(450,300,"Puntaje: " + this.score,{
fontSize:"30px",
color:"#ffffff"
}).setOrigin(0.5);

const btn = this.add.text(450,450,"VOLVER AL MENU",{
fontSize:"28px",
backgroundColor:"#008cff",
padding:{x:20,y:10}
}).setOrigin(0.5).setInteractive();

btn.on("pointerdown",()=>{
this.scene.start("Scene_Menu");
});

}
}
