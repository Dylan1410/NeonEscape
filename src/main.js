window.onload = function () {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#1A1A2E',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 800 },
                debug: false
            }
        },
      scene: [Scene_Menu, Scene_Nivel1, Scene_Nivel2, Scene_Nivel3],
        pixelArt: true
    };

    new Phaser.Game(config);
};
