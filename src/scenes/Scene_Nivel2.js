class Scene_Nivel2 extends Phaser.Scene {
    constructor() {
        super({ key: 'Scene_Nivel2' });
    }

    preload() {
        this.load.image('tiles_cyberpunk', 'assets/images/tileset_cyberpunk.png');
        this.load.tilemapTiledJSON('mapa_nivel2', 'assets/tilemaps/nivel2.json');
        this.load.audio('nivel1_loop', 'assets/audio/nivel1_loop.wav');
        // Mejora 5: SFX reales existentes (se eliminaron speed_boost.wav y joltDash_strip.png inexistentes)
        this.load.audio('sfx_dash', 'assets/audio/menu_select.wav');
        this.load.audio('sfx_hit', 'assets/audio/hit.wav');
        this.load.spritesheet('jolt_idle', 'assets/images/jolt/joltIdle_strip.png', { frameWidth: 96, frameHeight: 96 });
        this.load.spritesheet('jolt_run', 'assets/images/jolt/joltRun_strip.png', { frameWidth: 96, frameHeight: 96 });
        this.load.spritesheet('jolt_jump', 'assets/images/jolt/joltJump_strip.png', { frameWidth: 96, frameHeight: 96 });
        this.load.spritesheet('jolt_death', 'assets/images/jolt/joltDeath_strip.png', { frameWidth: 96, frameHeight: 96 });
    }

    create() {
        const map = this.make.tilemap({ key: 'mapa_nivel2' });
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

        this.capaPlataformas = capaPlataformas;
        this.spikeTileIds = [982, 983];
        this.mapHeight = map.heightInPixels;
        this.levelFinished = false;
        this.levelTime = 45;
        this.collectiblesNeeded = 3;
        this.collectiblesFound = 0;
        this.isPaused = false;
        
        // Variables de super velocidad (DASH)
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDuration = 0.12; // 120 milésimas de segundo
        this.dashSpeed = 650;
        this.canDash = true;
        
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

        this.physics.add.collider(this.player, capaPlataformas);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // ========== PINCHOS (tiles 982 y 983) ==========
        this.createSpikes(capaPlataformas);

        this.createGoal(map.widthInPixels);
        this.createHud();
        this.createCollectibles();
        this.createDashPickups();

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // DASH con ESPACIO
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.menuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this.nextKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Temporizador
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.levelFinished || this.isPaused) return;

                this.levelTime--;
                this.timeText.setText(`Tiempo: ${this.levelTime}`);

                if (this.levelTime <= 0) {
                    this.failLevel('Tiempo agotado');
                }
            }
        });
        
        // Indicador visual de dash
        this.createDashIndicator();
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
                this.scene.start('Scene_Nivel3');
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

        // Actualizar cooldown del dash
        if (this.dashCooldown > 0) {
            this.dashCooldown -= this.game.loop.delta / 1000;
            if (this.dashCooldown <= 0) {
                this.canDash = true;
                this.updateDashIndicator(true);
            }
        }

        // Si está en dash, no procesar movimiento normal
        if (this.isDashing) {
            this.dashDuration -= this.game.loop.delta / 1000;
            if (this.dashDuration <= 0) {
                this.endDash();
            }
            return;
        }

        // Movimiento normal
        let moveInput = false;
        
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-210);
            this.player.setFlipX(true);
            moveInput = true;
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(210);
            this.player.setFlipX(false);
            moveInput = true;
        } else {
            this.player.body.setVelocityX(0);
        }

        // DASH con ESPACIO
        if (Phaser.Input.Keyboard.JustDown(this.dashKey) && this.canDash && !this.isDashing) {
            this.activateDash();
        }

        // SOLO UN SALTO (sin doble salto)
        const isGrounded = this.player.body.blocked.down;
        const justJumped = Phaser.Input.Keyboard.JustDown(this.cursors.up);

        if (justJumped && isGrounded) {
            this.player.body.setVelocityY(-285);
        }

        this.updateJoltAnimation(isGrounded, moveInput);

        this.checkSpikeTiles();

        if (this.player.body.bottom >= this.mapHeight - 2) {
            this.failLevel('TE CONSUMIO EL ABISMO');
        }
    }

    // ========== DASH ==========
    activateDash() {
        this.isDashing = true;
        this.canDash = false;
        this.dashCooldown = 3.5; // recarga lenta: obliga a usar los pickups de energia
        this.dashDuration = 0.12; // 120 milésimas de segundo
        
        const direction = this.player.flipX ? -1 : 1;
        
        this.player.body.setVelocityX(this.dashSpeed * direction);
        this.player.body.setVelocityY(0);
        
        // Efectos visuales
        this.player.setTint(0x00F5FF);
        this.cameras.main.shake(60, 0.008);
        this.createDashTrail();
        
        this.sound.play('sfx_dash', { volume: 0.5 });

        this.updateDashIndicator(false);
    }
    
    endDash() {
        this.isDashing = false;
        this.player.clearTint();
        
        const currentVelX = this.player.body.velocity.x;
        this.player.body.setVelocityX(currentVelX * 0.4);
    }
    
    createDashTrail() {
        for (let i = 0; i < 5; i++) {
            const trail = this.add.rectangle(
                this.player.x - (this.player.flipX ? -20 : 20) * i,
                this.player.y + 8,
                12,
                12,
                0x00F5FF,
                0.6 - i * 0.1
            );
            
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 120,
                onComplete: () => trail.destroy()
            });
        }
    }
    
    createDashIndicator() {
        this.dashIndicatorBg = this.add.rectangle(16, 98, 120, 32, 0x000000, 0.7);
        this.dashIndicatorBg.setScrollFactor(0);
        
        this.dashIndicator = this.add.rectangle(24, 100, 24, 24, 0x00F5FF, 0.9);
        this.dashIndicator.setScrollFactor(0);
        
        this.dashText = this.add.text(56, 96, 'DASH', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#00F5FF',
            fontStyle: 'bold'
        });
        this.dashText.setScrollFactor(0);
        
        this.dashStatusText = this.add.text(56, 114, 'LISTO', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#00FF88'
        });
        this.dashStatusText.setScrollFactor(0);
        
        this.updateDashIndicator(true);
    }
    
    updateDashIndicator(available) {
        if (!this.dashIndicator) return;
        
        if (available) {
            this.dashIndicator.setFillStyle(0x00F5FF, 0.9);
            this.dashStatusText.setText('LISTO');
            this.dashStatusText.setColor('#00FF88');
            
            this.tweens.add({
                targets: this.dashIndicator,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 300,
                yoyo: true,
                repeat: 2
            });
        } else {
            this.dashIndicator.setFillStyle(0xFF2A6D, 0.6);
            this.dashStatusText.setText('RECARGANDO');
            this.dashStatusText.setColor('#FF6666');
        }
    }

    // ========== PINCHOS ==========
    createSpikes(capaPlataformas) {
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 40; x++) {
                const tile = capaPlataformas.getTileAt(x, y);
                if (tile && this.spikeTileIds.includes(tile.index)) {
                    // Efecto visual de peligro
                    const dangerGlow = this.add.rectangle(
                        x * 32 + 16,
                        y * 32 + 16,
                        26,
                        26,
                        0xFF2A6D,
                        0.4
                    );
                    
                    this.tweens.add({
                        targets: dangerGlow,
                        alpha: 0.15,
                        duration: 250,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        }
    }

    checkSpikeTiles() {
        if (!this.player?.body?.blocked.down || !this.capaPlataformas) return;

        const body = this.player.body;
        const footY = body.bottom + 1;
        const footXs = [
            body.left + 3,
            body.center.x,
            body.right - 3
        ];

        const isOnSpike = footXs.some(x => {
            const tile = this.capaPlataformas.getTileAtWorldXY(x, footY);
            return tile && this.spikeTileIds.includes(tile.index);
        });

        if (isOnSpike) {
            // Mejora 6: impacto audiovisual al morir en pinchos
            this.sound.play('sfx_hit', { volume: 0.6 });
            this.cameras.main.flash(250, 255, 42, 109);
            this.failLevel('PINCHOS MORTALES');
        }
    }

    // ========== DASH PICKUPS ==========
    createDashPickups() {
        this.dashPickups = this.physics.add.staticGroup();
        
        const dashPickupPositions = [
            { x: 304, y: 288 },
            { x: 624, y: 288 },
            { x: 944, y: 288 }
        ];
        
        dashPickupPositions.forEach(pos => {
            this.createDashPickup(pos.x, pos.y);
        });
        
        this.physics.add.overlap(this.player, this.dashPickups, (player, pickup) => {
            this.collectDashPickup(pickup);
        });
    }
    
    createDashPickup(x, y) {
        // Colocados directamente en coordenadas del mundo (sin container) para que
        // el cuerpo de fisica estatico quede donde se ve el icono y el overlap funcione.
        const glow = this.add.ellipse(x, y, 28, 28, 0x00F5FF, 0.35);
        const icon = this.add.text(x, y, '⚡', {
            fontSize: '16px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        const core = this.add.rectangle(x, y, 14, 14, 0x00F5FF, 0.95);

        this.physics.add.existing(core, true);
        core.body.setCircle(16, -9, -9); // hitbox generoso centrado en el icono
        core.parts = [glow, icon, core];
        this.dashPickups.add(core);

        // Flotar solo los visuales; el cuerpo estatico permanece fijo para el overlap.
        this.tweens.add({
            targets: [glow, icon],
            y: y - 6,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: icon,
            angle: 360,
            duration: 1000,
            repeat: -1
        });
    }
    
    collectDashPickup(pickup) {
        if (!pickup.active) return;
        
        pickup.body.enable = false;
        pickup.setActive(false);
        
        this.canDash = true;
        this.dashCooldown = 0;
        this.updateDashIndicator(true);
        
        this.tweens.add({
            targets: pickup.parts,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => pickup.parts.forEach(part => part.destroy())
        });

        this.showPickupMessage('¡DASH RECARGADO!');
    }
    
    showPickupMessage(message) {
        const msg = this.add.text(400, 250, message, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00F5FF',
            fontStyle: 'bold',
            backgroundColor: '#000000AA',
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.tweens.add({
            targets: msg,
            y: 200,
            alpha: 0,
            duration: 800,
            onComplete: () => msg.destroy()
        });
    }

    // ========== ANIMACIONES ==========
    createJoltAnimations() {
        if (this.anims.exists('jolt-idle')) return;

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

    updateJoltAnimation(isGrounded, isMoving) {
        if (this.isDashing) return;
        
        if (!isGrounded) {
            this.player.play('jolt-jump', true);
            return;
        }

        if (isMoving) {
            this.player.play('jolt-run', true);
            return;
        }

        this.player.play('jolt-idle', true);
    }

    // ========== MÚSICA ==========
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

    stopLevelMusic() {
        if (this.levelMusic) {
            this.levelMusic.stop();
            this.levelMusic.destroy();
            this.levelMusic = null;
        }
    }

    // ========== PAUSA ==========
    togglePause() {
        if (this.isPaused) {
            this.resumeLevel();
        } else {
            this.pauseLevel();
        }
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
        if (this.pauseOverlay) return;

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

    // ========== OBJETIVO (PORTAL) ==========
    createGoal(mapWidth) {
        const portalX = mapWidth - 90;
        const portalY = 296; // sobre la superficie del piso (y~320)

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

        this.portalVisuals = { shadow, outerGlow, outerRing, innerRing, core, lockBar, lockDot };

        this.physics.add.overlap(this.player, this.goal, () => {
            if (this.collectiblesFound >= this.collectiblesNeeded) {
                this.completeLevel();
            } else {
                this.showPortalLockedMessage();
            }
        });
    }

    // ========== COLECTIBLES ==========
    createCollectibles() {
        this.collectibles = this.physics.add.staticGroup();

        this.createCollectible(176, 288);
        this.createCollectible(496, 288);
        this.createCollectible(816, 288);

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
        if (!collectible.active) return;

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

    // ========== HUD ==========
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

    // ========== FIN DEL NIVEL ==========
    failLevel(reason) {
        if (this.levelFinished) return;

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
        if (this.levelFinished) return;

        this.levelFinished = true;
        this.canGoNext = true;
        this.unlockLevel(3);
        this.player.body.setVelocity(0, 0);
        this.player.play('jolt-idle', true);
        this.physics.pause();
        this.statusText.setText('¡Has escapado!\nR: reiniciar   N: nivel 3   M: menu');
        this.statusText.setVisible(true);
        this.createEndButton(180, 394, 'Reiniciar', () => {
            this.stopLevelMusic();
            this.scene.restart();
        });
        this.createEndButton(400, 394, 'Nivel 3', () => {
            this.stopLevelMusic();
            this.scene.start('Scene_Nivel3');
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
