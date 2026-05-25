class Scene_Nivel2 extends Phaser.Scene {
    constructor() {
        super({ key: 'Scene_Nivel2' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#071A2E');
        this.add.text(400, 150, 'NIVEL 2', {
            fontFamily: 'Arial',
            fontSize: '44px',
            color: '#00F5FF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(400, 225, 'Dash - Corredor de Contramedidas', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        this.add.text(400, 292, 'Este nivel queda preparado para implementar la habilidad de dash.', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#B9C7FF',
            align: 'center',
            wordWrap: { width: 560 }
        }).setOrigin(0.5);

        this.createButton(270, 410, 'Menu', () => this.scene.start('Scene_Menu'));
        this.createButton(530, 410, 'Desbloquear nivel 3', () => {
            localStorage.setItem('neonEscapeUnlockedLevel', '3');
            this.scene.start('Scene_Menu');
        });
    }

    createButton(x, y, label, action) {
        const button = this.add.rectangle(x, y, 210, 48, 0x1A1A2E, 0.96).setStrokeStyle(2, 0x00F5FF, 0.9);
        this.add.text(x, y, label, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setFillStyle(0x203C54, 1));
        button.on('pointerout', () => button.setFillStyle(0x1A1A2E, 0.96));
        button.on('pointerdown', action);
    }
}
