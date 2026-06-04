class Scene_Nivel1 extends Phaser.Scene {
    constructor() {
        super({ key: 'Scene_Nivel1' });
    }

    preload() {
        this.load.image('tiles_cyberpunk', 'assets/images/tileset_cyberpunk.png');
        this.load.tilemapTiledJSON('mapa_nivel1', 'assets/tilemaps/nivel1_factory.json');
        this.load.audio('nivel1_loop', 'assets/audio/nivel1_loop.wav');
        this.load.spritesheet('jolt_idle', 'assets/images/jolt/joltIdle_strip.png', { frameWidth: 96, frameHeight: 96 });
        this.load.spritesheet('jolt_run', 'assets/images/jolt/joltRun_strip.png', { frameWidth: 96, frameHeight: 96 });
        this.load.spritesheet('jolt_jump', 'assets/images/jolt/joltJump_strip.png', { frameWidth: 96, frameHeight: 96 });
        this.load.spritesheet('jolt_death', 'assets/images/jolt/joltDeath_strip.png', { frameWidth: 96, frameHeight: 96 });
    }

    create() {
        const map = this.make.tilemap({ key: 'mapa_nivel1' });
        const tileset = map.addTilesetImage('cyberpunk_tiles', 'tiles_cyberpunk');

        if (!tileset) {
            throw new Error('No se encontro el tileset "cyberpunk_tiles" en el mapa.');
        }

        const capaFondo = map.createLayer('Fondo', tileset, 0, 0);
        const capaPlataformas = map.createLayer('Plataformas', tileset, 0, 0);

        if (!capaFondo || !capaPlataformas) {
            throw new Error('Faltan las capas "Fondo" o "Plataformas" en el mapa.');
        }

        capaPlataformas.setCollisionByExclusion([-1]);

        this.mapHeight = map.heightInPixels;
        this.levelFinished = false;
        this.levelTime = 25;
        this.collectiblesNeeded = 3;
        this.collectiblesFound = 0;
        this.isPaused = false;
        this.startLevelMusic();

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        const spawnPoint = map.findObject('ObjetosNivel', obj => obj.name === 'SpawnPoint');
        const spawnX = spawnPoint ? spawnPoint.x : 100;
        const spawnY = spawnPoint ? spawnPoint.y : 100;

        this.createJoltAnimations();

        this.player = this.add.sprite(spawnX, spawnY, 'jolt_idle', 0);
        this.player.setScale(0.58);
        this.player.play('jolt-idle');
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        const joltBodyWidth = 34;
        const joltBodyHeight = 62;
        const joltBodyOffsetX = 31;
        const joltBodyOffsetY = 10;
        this.player.body.setSize(joltBodyWidth, joltBodyHeight);
        this.player.body.setOffset(joltBodyOffsetX, joltBodyOffsetY);

        this.createMovingPlatform(capaPlataformas);
        this.physics.add.collider(this.player, capaPlataformas);
        this.physics.add.collider(this.player, this.movingPlatform);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.createGoal(map.widthInPixels);
        this.createHud();
        this.createCollectibles();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.menuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this.nextKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.jumpCount = 0;

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.levelFinished || this.isPaused) {
                    return;
                }

                this.levelTime--;
                this.timeText.setText(`Tiempo: ${this.levelTime}`);

                if (this.levelTime <= 0) {
                    this.failLevel('Tiempo agotado');
                }
            }
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey) && !this.levelFinished) {
            this.togglePause();
        }

        if (this.levelFinished) {
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.stopLevelMusic();
                this.scene.restart();
            }

            if (Phaser.Input.Keyboard.JustDown(this.menuKey)) {
                this.stopLevelMusic();
                this.scene.start('Scene_Menu');
            }

            if (this.canGoNext && Phaser.Input.Keyboard.JustDown(this.nextKey)) {
                this.stopLevelMusic();
                this.scene.start('Scene_Nivel2');
            }

            return;
        }

        if (this.isPaused) {
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.stopLevelMusic();
                this.scene.restart();
            }

            if (Phaser.Input.Keyboard.JustDown(this.menuKey)) {
                this.stopLevelMusic();
                this.scene.start('Scene_Menu');
            }

            return;
        }

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-210);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(210);
            this.player.setFlipX(false);
        } else {
            this.player.body.setVelocityX(0);
        }

        const isGrounded = this.player.body.blocked.down;
        const justJumped = Phaser.Input.Keyboard.JustDown(this.cursors.up);

        if (isGrounded && this.player.body.velocity.y >= 0) {
            this.jumpCount = 0;
        }

        if (justJumped && isGrounded) {
            this.player.body.setVelocityY(-255);
            this.jumpCount = 1;
        } else if (justJumped && this.jumpCount < 2) {
            this.player.body.setVelocityY(-315);
            this.jumpCount = 2;
        }

        this.updateJoltAnimation(isGrounded);

        this.updateMovingPlatform();

        if (this.player.body.bottom >= this.mapHeight - 2) {
            this.failLevel('TE CONSUMIO EL ABISMO');
        }
    }

    createJoltAnimations() {
        if (this.anims.exists('jolt-idle')) {
            return;
        }

        this.anims.create({
            key: 'jolt-idle',
            frames: this.anims.generateFrameNumbers('jolt_idle', { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'jolt-run',
            frames: this.anims.generateFrameNumbers('jolt_run', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'jolt-jump',
            frames: this.anims.generateFrameNumbers('jolt_jump', { start: 0, end: 11 }),
            frameRate: 14,
            repeat: -1
        });

        this.anims.create({
            key: 'jolt-death',
            frames: this.anims.generateFrameNumbers('jolt_death', { start: 0, end: 15 }),
            frameRate: 14,
            repeat: 0
        });
    }

    updateJoltAnimation(isGrounded) {
        if (!isGrounded) {
            this.player.play('jolt-jump', true);
            return;
        }

        if (Math.abs(this.player.body.velocity.x) > 5) {
            this.player.play('jolt-run', true);
            return;
        }

        this.player.play('jolt-idle', true);
    }

    createMovingPlatform(capaPlataformas) {
        const tileX = 17;
        const tileY = 8;
        const tileSize = 32;
        const width = tileSize * 2;
        const height = tileSize * 2;
        const platformTiles = [];

        for (let y = 0; y < 2; y++) {
            platformTiles[y] = [];

            for (let x = 0; x < 2; x++) {
                const tile = capaPlataformas.getTileAt(tileX + x, tileY + y);
                platformTiles[y][x] = tile ? tile.index : -1;
            }
        }

        for (let y = tileY; y <= tileY + 1; y++) {
            for (let x = tileX; x <= tileX + 1; x++) {
                capaPlataformas.removeTileAt(x, y);
            }
        }

        const startX = tileX * tileSize;
        const startY = tileY * tileSize;
        const platformMap = this.make.tilemap({
            data: platformTiles,
            tileWidth: tileSize,
            tileHeight: tileSize
        });
        const platformTileset = platformMap.addTilesetImage('cyberpunk_tiles', 'tiles_cyberpunk');
        this.movingPlatformVisual = platformMap.createLayer(0, platformTileset, startX, startY);

        this.movingPlatform = this.add.rectangle(
            startX + width / 2,
            startY + height / 2,
            width,
            height,
            0x000000,
            0
        );

        this.physics.add.existing(this.movingPlatform);
        this.movingPlatform.body.allowGravity = false;
        this.movingPlatform.body.setImmovable(true);
        this.movingPlatform.body.setVelocityX(75);

        this.movingPlatform.minX = this.movingPlatform.x - tileSize * 3;
        this.movingPlatform.maxX = this.movingPlatform.x + tileSize * 3;

        this.movingPlatformVisual.x = this.movingPlatform.x - width / 2;
        this.movingPlatformVisual.y = this.movingPlatform.y - height / 2;
    }

    startLevelMusic() {
        if (this.levelMusic) {
            this.levelMusic.stop();
        }

        this.levelMusic = this.sound.add('nivel1_loop', {
            loop: true,
            volume: 0.45
        });
        this.levelMusic.play();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopLevelMusic();
        });
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeLevel();
            return;
        }

        this.pauseLevel();
    }

    pauseLevel() {
        this.isPaused = true;
        this.physics.pause();

        if (this.levelMusic) {
            this.levelMusic.setVolume(0.18);
        }

        this.createPauseOverlay();
    }

    resumeLevel() {
        this.isPaused = false;
        this.physics.resume();

        if (this.levelMusic) {
            this.levelMusic.setVolume(0.45);
        }

        this.destroyPauseOverlay();
    }

    createPauseOverlay() {
        if (this.pauseOverlay) {
            return;
        }

        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setScrollFactor(0);
        const shade = this.add.rectangle(400, 300, 800, 600, 0x050711, 0.68);
        const panel = this.add.rectangle(400, 300, 430, 270, 0x1A1A2E, 0.96).setStrokeStyle(3, 0x00F5FF, 0.95);
        const title = this.add.text(400, 220, 'PAUSA', {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#FFE66D',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const hint = this.add.text(400, 265, 'ESC: continuar   R: reiniciar   M: menu', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#B9C7FF'
        }).setOrigin(0.5);

        this.pauseOverlay.add([shade, panel, title, hint]);
        this.pauseOverlay.add(this.createPauseButton(260, 340, 'Continuar', () => this.resumeLevel()));
        this.pauseOverlay.add(this.createPauseButton(400, 340, 'Reiniciar', () => {
            this.stopLevelMusic();
            this.scene.restart();
        }));
        this.pauseOverlay.add(this.createPauseButton(540, 340, 'Menu', () => {
            this.stopLevelMusic();
            this.scene.start('Scene_Menu');
        }));
    }

    createPauseButton(x, y, label, action) {
        const container = this.add.container(0, 0);
        const button = this.add.rectangle(x, y, 118, 42, 0x071A2E, 0.98).setStrokeStyle(2, 0xFF2A6D, 0.9);
        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setFillStyle(0x203C54, 1));
        button.on('pointerout', () => button.setFillStyle(0x071A2E, 0.98));
        button.on('pointerdown', action);

        container.add([button, text]);
        return container;
    }

    destroyPauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }

    stopLevelMusic() {
        if (this.levelMusic) {
            this.levelMusic.stop();
            this.levelMusic.destroy();
            this.levelMusic = null;
        }
    }

    updateMovingPlatform() {
        if (this.movingPlatform.x <= this.movingPlatform.minX) {
            this.movingPlatform.body.setVelocityX(75);
        } else if (this.movingPlatform.x >= this.movingPlatform.maxX) {
            this.movingPlatform.body.setVelocityX(-75);
        }

        this.movingPlatformVisual.x = this.movingPlatform.x - this.movingPlatform.width / 2;
        this.movingPlatformVisual.y = this.movingPlatform.y - this.movingPlatform.height / 2;
    }

    createGoal(mapWidth) {
        const portalX = mapWidth - 90;
        const portalY = 296;

        const shadow = this.add.ellipse(portalX, portalY + 36, 84, 20, 0x001B2E, 0.7);
        const outerGlow = this.add.ellipse(portalX, portalY, 76, 104, 0x00F5FF, 0.14);
        const outerRing = this.add.ellipse(portalX, portalY, 58, 88, 0x071A2E, 0.62);
        const innerRing = this.add.ellipse(portalX, portalY, 42, 68, 0xFFFFFF, 0.12);
        const core = this.add.ellipse(portalX, portalY, 28, 54, 0x2A184F, 0.8);
        const lockBar = this.add.rectangle(portalX, portalY, 48, 8, 0xFF2A6D, 0.9);
        const lockDot = this.add.rectangle(portalX, portalY - 18, 10, 10, 0xFFE66D, 0.95);

        outerRing.setStrokeStyle(4, 0x00F5FF, 0.95);
        innerRing.setStrokeStyle(2, 0xFFFFFF, 0.75);
        core.setStrokeStyle(2, 0xFF2A6D, 0.85);
        lockBar.setStrokeStyle(1, 0xFFFFFF, 0.8);
        lockDot.setStrokeStyle(1, 0xFFFFFF, 0.8);

        this.goal = this.add.rectangle(portalX, portalY, 42, 68, 0x00F5FF, 0);
        this.physics.add.existing(this.goal, true);

        this.tweens.add({
            targets: [outerGlow, outerRing, core],
            scaleX: 1.08,
            scaleY: 1.08,
            alpha: 0.55,
            duration: 650,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: innerRing,
            angle: 360,
            duration: 2200,
            repeat: -1
        });

        for (let i = 0; i < 7; i++) {
            const spark = this.add.rectangle(
                portalX + Phaser.Math.Between(-28, 28),
                portalY + Phaser.Math.Between(-36, 36),
                4,
                4,
                i % 2 === 0 ? 0x00F5FF : 0xFF2A6D,
                0.85
            );

            this.tweens.add({
                targets: spark,
                y: spark.y - Phaser.Math.Between(18, 42),
                alpha: 0.1,
                duration: Phaser.Math.Between(700, 1200),
                delay: i * 120,
                yoyo: true,
                repeat: -1
            });
        }

        this.portalVisuals = {
            shadow,
            outerGlow,
            outerRing,
            innerRing,
            core,
            lockBar,
            lockDot
        };

        this.physics.add.overlap(this.player, this.goal, () => {
            if (this.collectiblesFound >= this.collectiblesNeeded) {
                this.completeLevel();
                return;
            }

            this.showPortalLockedMessage();
        });
    }

    createCollectibles() {
        this.collectibles = this.physics.add.staticGroup();

        this.createCollectible(270, 226);
        this.createCollectible(575, 184);
        this.createCollectible(1040, 226);

        this.physics.add.overlap(this.player, this.collectibles, (player, collectible) => {
            this.collectCollectible(collectible);
        });
    }

    createCollectible(x, y) {
        const aura = this.add.ellipse(x, y, 34, 34, 0x00F5FF, 0.2);
        const diamond = this.add.polygon(x, y, [0, -14, 12, 0, 0, 14, -12, 0], 0xFF2A6D, 0.9);
        const core = this.add.rectangle(x, y, 8, 8, 0xFFE66D, 0.95);

        diamond.setStrokeStyle(2, 0xFFFFFF, 0.9);
        core.setAngle(45);

        this.physics.add.existing(diamond, true);
        diamond.body.setCircle(15, -3, -3);
        diamond.parts = [aura, diamond, core];
        this.collectibles.add(diamond);

        this.tweens.add({
            targets: diamond.parts,
            y: y - 8,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: [diamond, core],
            angle: 360,
            duration: 1800,
            repeat: -1
        });
    }

    collectCollectible(collectible) {
        if (!collectible.active) {
            return;
        }

        this.collectiblesFound++;
        this.collectText.setText(`Nucleos: ${this.collectiblesFound}/${this.collectiblesNeeded}`);

        collectible.body.enable = false;
        collectible.setActive(false);

        this.tweens.add({
            targets: collectible.parts,
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 180,
            onComplete: () => {
                collectible.parts.forEach(part => part.destroy());
            }
        });

        if (this.collectiblesFound >= this.collectiblesNeeded) {
            this.unlockPortal();
        }
    }

    unlockPortal() {
        this.portalVisuals.lockBar.destroy();
        this.portalVisuals.lockDot.destroy();
        this.portalVisuals.core.setFillStyle(0x6D5DFF, 0.85);
        this.portalVisuals.outerGlow.setFillStyle(0x00F5FF, 0.3);

        this.tweens.add({
            targets: [this.portalVisuals.outerGlow, this.portalVisuals.innerRing],
            scaleX: 1.18,
            scaleY: 1.18,
            duration: 320,
            yoyo: true,
            repeat: 2
        });
    }

    showPortalLockedMessage() {
        const missing = this.collectiblesNeeded - this.collectiblesFound;
        this.statusText.setText(`Faltan ${missing} nucleos`);
        this.statusText.setVisible(true);

        this.time.delayedCall(900, () => {
            if (!this.levelFinished) {
                this.statusText.setVisible(false);
            }
        });
    }

    createHud() {
        this.timeText = this.add.text(16, 14, `Tiempo: ${this.levelTime}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FFFFFF',
            backgroundColor: '#000000AA',
            padding: { x: 10, y: 6 }
        });
        this.timeText.setScrollFactor(0);

        this.collectText = this.add.text(16, 52, `Nucleos: ${this.collectiblesFound}/${this.collectiblesNeeded}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FFE66D',
            backgroundColor: '#000000AA',
            padding: { x: 10, y: 6 }
        });
        this.collectText.setScrollFactor(0);

        this.statusText = this.add.text(400, 300, '', {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#FFFFFF',
            align: 'center',
            backgroundColor: '#000000CC',
            padding: { x: 18, y: 12 }
        });
        this.statusText.setOrigin(0.5);
        this.statusText.setScrollFactor(0);
        this.statusText.setVisible(false);
    }

    failLevel(reason) {
        if (this.levelFinished) {
            return;
        }

        this.levelFinished = true;
        this.canGoNext = false;
        this.player.body.setVelocity(0, 0);
        this.player.body.enable = false;
        this.player.play('jolt-death', true);
        this.physics.pause();
        this.statusText.setText(`${reason}\nR: reiniciar   M: menu`);
        this.statusText.setVisible(true);
        this.createEndButton(280, 382, 'Reiniciar', () => {
            this.stopLevelMusic();
            this.scene.restart();
        });
        this.createEndButton(520, 382, 'Menu', () => {
            this.stopLevelMusic();
            this.scene.start('Scene_Menu');
        });
    }

    completeLevel() {
        if (this.levelFinished) {
            return;
        }

        this.levelFinished = true;
        this.canGoNext = true;
        this.unlockLevel(2);
        this.player.body.setVelocity(0, 0);
        this.player.play('jolt-idle', true);
        this.physics.pause();
        this.statusText.setText('Has escapado a tiempo\nR: reiniciar   N: nivel 2   M: menu');
        this.statusText.setVisible(true);
        this.createEndButton(180, 394, 'Reiniciar', () => {
            this.stopLevelMusic();
            this.scene.restart();
        });
        this.createEndButton(400, 394, 'Nivel 2', () => {
            this.stopLevelMusic();
            this.scene.start('Scene_Nivel2');
        });
        this.createEndButton(620, 394, 'Menu', () => {
            this.stopLevelMusic();
            this.scene.start('Scene_Menu');
        });
    }

    createEndButton(x, y, label, action) {
        const button = this.add.rectangle(x, y, 170, 44, 0x1A1A2E, 0.96)
            .setStrokeStyle(2, 0x00F5FF, 0.9)
            .setScrollFactor(0);

        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setScrollFactor(0);

        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setFillStyle(0x203C54, 1));
        button.on('pointerout', () => button.setFillStyle(0x1A1A2E, 0.96));
        button.on('pointerdown', action);

        return { button, text };
    }

    unlockLevel(level) {
        const saved = Number(localStorage.getItem('neonEscapeUnlockedLevel') || 1);

        if (level > saved) {
            localStorage.setItem('neonEscapeUnlockedLevel', String(level));
        }
    }
}
