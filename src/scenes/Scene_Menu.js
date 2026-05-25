class Scene_Menu extends Phaser.Scene {
    constructor() {
        super({ key: 'Scene_Menu' });
    }

    preload() {
        this.load.audio('gamemenu_loop', 'assets/audio/GameMenu_loop.wav');
        this.load.audio('menu_select', 'assets/audio/menu_select.wav');
    }

    create() {
        this.startMenuMusic();
        this.cameras.main.setBackgroundColor('#120B22');

        this.add.rectangle(400, 300, 800, 600, 0x120B22);
        this.add.rectangle(400, 96, 800, 120, 0x071A2E, 0.9);
        this.add.rectangle(400, 96, 760, 4, 0x00F5FF, 0.65);
        this.add.rectangle(400, 154, 640, 3, 0xFF2A6D, 0.55);

        this.add.text(400, 44, 'NEON ESCAPE', {
            fontFamily: 'Arial',
            fontSize: '42px',
            color: '#00F5FF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 94, 'Tres sujetos ciberneticos escapan del complejo Aethelgard antes de la purga central.', {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: '#FFFFFF',
            align: 'center',
            wordWrap: { width: 680 }
        }).setOrigin(0.5);

        this.createCharacterCard(92, 190, 'JOLT', 'Doble salto', 'Sabotaje industrial', 0xFFCC00, 'Nivel 1');
        this.createCharacterCard(306, 190, 'DASH', 'Impulso horizontal', 'Ruta optima de escape', 0x00F5FF, 'Nivel 2');
        this.createCharacterCard(520, 190, 'KAEL', 'Disparo tactico', 'Neutralizar defensas', 0xFF2A6D, 'Nivel 3');

        this.add.text(400, 382, 'Seleccion de nivel', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#FFE66D',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const unlockedLevel = this.getUnlockedLevel();
        this.createLevelButton(170, 452, 1, 'Sector de Ensamblaje', unlockedLevel >= 1);
        this.createLevelButton(400, 452, 2, 'Corredor de Contramedidas', unlockedLevel >= 2);
        this.createLevelButton(630, 452, 3, 'Nucleo de Laboratorios', unlockedLevel >= 3);

        this.add.text(400, 552, 'Completa un nivel para desbloquear el siguiente.', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#B9C7FF'
        }).setOrigin(0.5);

        this.createGlitchEffect();
    }

    createCharacterCard(x, y, name, ability, motivation, color, levelLabel) {
        this.add.rectangle(x + 88, y + 78, 176, 156, 0x1A1A2E, 0.94).setStrokeStyle(2, color, 0.75);
        this.add.circle(x + 38, y + 42, 26, color, 0.85).setStrokeStyle(2, 0xFFFFFF, 0.8);
        this.add.rectangle(x + 38, y + 42, 34, 8, 0x111111, 0.65);
        this.add.text(x + 84, y + 28, name, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        this.add.text(x + 84, y + 58, ability, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: `#${color.toString(16).padStart(6, '0')}`
        });
        this.add.text(x + 18, y + 94, motivation, {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#DCE5FF',
            wordWrap: { width: 140 }
        });
        this.add.text(x + 18, y + 134, levelLabel, {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#FFE66D'
        });
    }

    createLevelButton(x, y, level, title, unlocked) {
        const fill = unlocked ? 0x182A3D : 0x1E1E2E;
        const stroke = unlocked ? 0x00F5FF : 0x555566;
        const button = this.add.rectangle(x, y, 196, 74, fill, 0.96).setStrokeStyle(2, stroke, 0.9);

        this.add.text(x, y - 16, `Nivel ${level}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: unlocked ? '#FFFFFF' : '#8A8A99',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(x, y + 12, unlocked ? title : 'Bloqueado', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: unlocked ? '#B9C7FF' : '#777788',
            align: 'center',
            wordWrap: { width: 160 }
        }).setOrigin(0.5);

        if (!unlocked) {
            this.add.text(x + 74, y - 28, 'LOCK', {
                fontFamily: 'Arial',
                fontSize: '10px',
                color: '#FF2A6D'
            }).setOrigin(0.5);
            return;
        }

        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setFillStyle(0x203C54, 1));
        button.on('pointerout', () => button.setFillStyle(fill, 0.96));
        button.on('pointerdown', () => this.selectLevel(level));
    }

    startMenuMusic() {
        if (this.menuMusic) {
            this.menuMusic.stop();
        }

        this.menuMusic = this.sound.add('gamemenu_loop', {
            loop: true,
            volume: 0.45
        });
        this.menuMusic.play();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopMenuMusic();
        });
    }

    stopMenuMusic() {
        if (this.menuMusic) {
            this.menuMusic.stop();
            this.menuMusic.destroy();
            this.menuMusic = null;
        }
    }

    selectLevel(level) {
        this.sound.play('menu_select', { volume: 0.7 });
        this.stopMenuMusic();
        this.time.delayedCall(150, () => {
            this.scene.start(`Scene_Nivel${level}`);
        });
    }

    createGlitchEffect() {
        this.glitchOverlay = this.add.graphics();
        this.glitchOverlay.setDepth(1000);
        this.glitchOverlay.setVisible(false);

        this.glitchTitleCyan = this.add.text(400, 44, 'NEON ESCAPE', {
            fontFamily: 'Arial',
            fontSize: '42px',
            color: '#00F5FF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1001).setVisible(false);

        this.glitchTitlePink = this.add.text(400, 44, 'NEON ESCAPE', {
            fontFamily: 'Arial',
            fontSize: '42px',
            color: '#FF2A6D',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1001).setVisible(false);

        this.time.addEvent({
            delay: 4000,
            loop: true,
            callback: () => this.playMenuGlitch()
        });

        this.time.delayedCall(120, () => this.playMenuGlitch());
    }

    playMenuGlitch() {
        this.glitchOverlay.setVisible(true);
        this.glitchTitleCyan.setVisible(true);
        this.glitchTitlePink.setVisible(true);

        let pulses = 0;
        this.time.addEvent({
            delay: 45,
            repeat: 7,
            callback: () => {
                pulses++;
                this.glitchOverlay.clear();

                for (let i = 0; i < 12; i++) {
                    const y = Phaser.Math.Between(0, 590);
                    const h = Phaser.Math.Between(2, 10);
                    const color = i % 2 === 0 ? 0x00F5FF : 0xFF2A6D;
                    this.glitchOverlay.fillStyle(color, Phaser.Math.FloatBetween(0.12, 0.32));
                    this.glitchOverlay.fillRect(
                        Phaser.Math.Between(-40, 40),
                        y,
                        800 + Phaser.Math.Between(20, 90),
                        h
                    );
                }

                this.glitchTitleCyan.setPosition(400 + Phaser.Math.Between(-10, 10), 44 + Phaser.Math.Between(-3, 3));
                this.glitchTitlePink.setPosition(400 + Phaser.Math.Between(-10, 10), 44 + Phaser.Math.Between(-3, 3));
                this.cameras.main.setScroll(Phaser.Math.Between(-5, 5), Phaser.Math.Between(-3, 3));

                if (pulses >= 8) {
                    this.clearMenuGlitch();
                }
            }
        });
    }

    clearMenuGlitch() {
        this.glitchOverlay.clear();
        this.glitchOverlay.setVisible(false);
        this.glitchTitleCyan.setVisible(false);
        this.glitchTitlePink.setVisible(false);
        this.cameras.main.setScroll(0, 0);
    }

    getUnlockedLevel() {
        const saved = Number(localStorage.getItem('neonEscapeUnlockedLevel') || 1);
        return Phaser.Math.Clamp(saved, 1, 3);
    }
}
