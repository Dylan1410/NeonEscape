class Scene_Nivel3 extends Phaser.Scene {
    constructor() {
        super({ key: 'Scene_Nivel3' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#160A18');
        this.add.text(400, 160, 'NIVEL 3', {
            fontFamily: 'Arial',
            fontSize: '44px',
            color: '#FF2A6D',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(400, 235, 'Kael - Nucleo de Laboratorios', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        this.add.text(400, 305, 'Escena reservada para el combate con disparo tactico.', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFD6E7',
            align: 'center',
            wordWrap: { width: 520 }
        }).setOrigin(0.5);

        this.createButton(400, 420, 'Volver al menu', () => this.scene.start('Scene_Menu'));
    }

    createButton(x, y, label, action) {
        const button = this.add.rectangle(x, y, 210, 48, 0x1A1A2E, 0.96).setStrokeStyle(2, 0xFF2A6D, 0.9);
        this.add.text(x, y, label, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setFillStyle(0x3A203C, 1));
        button.on('pointerout', () => button.setFillStyle(0x1A1A2E, 0.96));
        button.on('pointerdown', action);
    }
}
