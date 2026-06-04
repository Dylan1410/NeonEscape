class Scene_Game extends Phaser.Scene{
constructor(){
super("Scene_Game");
}

preload(){

this.load.image("player","assets/images/player.png");
this.load.image("enemy","assets/images/enemy.png");
this.load.image("energy","assets/images/energy.png");

this.load.audio("collect","assets/audio/collect.wav");
this.load.audio("hit","assets/audio/hit.wav");
}

create(){

this.score = 0;
this.vidas = 3;
this.itemsRestantes = 5;

this.add.rectangle(450,300,900,600,0x101d35);

this.player = this.physics.add.sprite(100,100,"player");
this.player.setCollideWorldBounds(true);

this.cursors = this.input.keyboard.createCursorKeys();

this.items = this.physics.add.group();

for(let i=0;i<5;i++){
const item = this.items.create(
Phaser.Math.Between(100,800),
Phaser.Math.Between(100,500),
"energy"
);
item.setScale(0.7);
}

this.enemies = this.physics.add.group();

for(let i=0;i<3;i++){
const enemy = this.enemies.create(
Phaser.Math.Between(200,800),
Phaser.Math.Between(100,500),
"enemy"
);

enemy.setVelocity(
Phaser.Math.Between(-150,150),
Phaser.Math.Between(-150,150)
);

enemy.setBounce(1);
enemy.setCollideWorldBounds(true);
}

this.physics.add.overlap(
this.player,
this.items,
this.collectItem,
null,
this
);

this.physics.add.overlap(
this.player,
this.enemies,
this.hitEnemy,
null,
this
);

this.scoreText = this.add.text(20,20,"Puntos: 0",{
fontSize:"24px",
color:"#ffffff"
});

}

update(){

const speed = 220;

this.player.setVelocity(0);

if(this.cursors.left.isDown){
this.player.setVelocityX(-speed);
}

if(this.cursors.right.isDown){
this.player.setVelocityX(speed);
}

if(this.cursors.up.isDown){
this.player.setVelocityY(-speed);
}

if(this.cursors.down.isDown){
this.player.setVelocityY(speed);
}

}

collectItem(player,item){

this.sound.play("collect");

item.destroy();

this.score += 10;
this.itemsRestantes--;

this.scoreText.setText("Puntos: " + this.score);

if(this.itemsRestantes <= 0){

this.scene.start("Scene_End",{
victoria:true,
score:this.score
});

}

}

hitEnemy(){

this.sound.play("hit");

this.vidas--;

if(this.vidas <= 0){

this.scene.start("Scene_End",{
victoria:false,
score:this.score
});

}

}

}
