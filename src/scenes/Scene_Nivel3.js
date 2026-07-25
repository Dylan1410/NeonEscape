class Scene_Nivel3 extends Phaser.Scene {
    constructor() {
        super({ key: 'Scene_Nivel3' });
    }

    preload() {
        this.load.spritesheet('kael_idle', 'assets/images/kael/kaelIdle_strip.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('kael_run', 'assets/images/kael/kaelRun_strip.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('kael_jump', 'assets/images/kael/kaelJump_strip.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('kael_shoot', 'assets/images/kael/kaelShoot_strip.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('kael_death', 'assets/images/kael/kaelDeath_strip.png', { frameWidth: 32, frameHeight: 32 });

        this.load.image('drone', 'assets/images/enemies/drone.png');
        this.load.image('turret', 'assets/images/enemies/turret.png');
        this.load.image('bullet', 'assets/images/fx/bullet.png');
        this.load.spritesheet('explosion', 'assets/images/fx/explosion_strip.png', { frameWidth: 32, frameHeight: 32 });

        this.load.image('portal_lab', 'assets/images/environment/lab_portal.png');

        // Mejoras 7 y 8: audio del nivel (musica + SFX de combate)
        this.load.audio('n3_bgm', 'assets/audio/bgm.wav');
        this.load.audio('n3_shoot', 'assets/audio/menu_select.wav');
        this.load.audio('n3_hit', 'assets/audio/hit.wav');
        this.load.audio('n3_win', 'assets/audio/win.wav');
        this.load.audio('n3_lose', 'assets/audio/lose.wav');
    }

    create() {
        this.cameras.main.setBackgroundColor('#120616');

        this.score = 0;
        this.totalDrones = 5;
        this.playerHealth = 3;
        this.canShoot = true;
        this.isDead = false;
        this.isInvulnerable = false;
        this.levelCompleted = false;
        this.isPaused = false;

        // Mejora 7: musica de nivel con fade-in
        this.startLevelMusic();

        this.createBackground();

        this.add.text(400, 25, 'NIVEL 3 - NÚCLEO DE LABORATORIOS', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#FF2A6D'
        }).setOrigin(0.5).setDepth(10);

        this.infoText = this.add.text(20, 50, 'Vida: 3 | Drones eliminados: 0/5', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFFFFF'
        }).setDepth(10);

        this.helpText = this.add.text(20, 75, 'Objetivo: elimina 5 drones y entra al portal | ESPACIO = disparar | ESC = pausa', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#00F5FF'
        }).setDepth(10);

        this.platforms = this.physics.add.staticGroup();

        this.createPlatform(400, 570, 800, 40);
        this.createPlatform(155, 475, 250, 24);
        this.createPlatform(445, 410, 230, 24);
        this.createPlatform(690, 340, 210, 24);
        this.createPlatform(365, 285, 210, 24);
        this.createPlatform(625, 215, 180, 24);
        this.createPlatform(145, 220, 170, 24);

        this.player = this.physics.add.sprite(80, 505, 'kael_idle');
        this.player.setScale(1.9);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(18, 28);
        this.player.body.setOffset(7, 4);

        this.physics.add.collider(this.player, this.platforms);

        this.createAnimations();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyShoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();

        this.createDrone(250, 430, 170, 340);
        this.createDrone(520, 365, 440, 610);
        this.createDrone(700, 295, 620, 760);
        this.createDrone(155, 175, 90, 240);
        this.createDrone(590, 175, 520, 700);

        this.createTurret(625, 525, 'left');
        this.createTurret(720, 295, 'left');
        this.createTurret(610, 170, 'left');
        this.createTurret(150, 430, 'right');

        this.portal = this.physics.add.staticSprite(750, 525, 'portal_lab');
        this.portal.setScale(2.2);
        this.portal.body.setSize(24, 40);
        this.portal.body.setOffset(4, 0);
        this.portal.refreshBody();
        this.portal.setTint(0x555555);

        this.portalText = this.add.text(610, 455, 'Portal bloqueado', {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#FF2A6D'
        }).setDepth(10);

        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.damagePlayer, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.damagePlayerByBullet, null, this);
        this.physics.add.overlap(this.player, this.portal, this.finishLevel, null, this);

        this.time.addEvent({
            delay: 1050,
            callback: this.turretsShoot,
            callbackScope: this,
            loop: true
        });

        this.input.keyboard.on('keydown-R', () => this.scene.restart());
        this.input.keyboard.on('keydown-M', () => this.scene.start('Scene_Menu'));
    }

    update() {
        // Mejora 9: pausa con ESC
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey) && !this.isDead && !this.levelCompleted) {
            this.togglePause();
        }

        if (this.isPaused) return;

        if (this.isDead || this.levelCompleted) return;

        let speed = 190;
        this.player.setVelocityX(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true;
            if (this.player.body.touching.down) this.player.anims.play('kael_run_anim', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.flipX = false;
            if (this.player.body.touching.down) this.player.anims.play('kael_run_anim', true);
        } else {
            if (this.player.body.touching.down) this.player.anims.play('kael_idle_anim', true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.player.body.touching.down) {
            this.player.setVelocityY(-520); // mayor altura para alcanzar todas las plataformas
        }

        if (!this.player.body.touching.down) {
            this.player.anims.play('kael_jump_anim', true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyShoot)) {
            this.shoot();
        }

        this.moveEnemies();
        this.cleanBullets();
    }

    createBackground() {
        for (let x = 0; x < 800; x += 64) {
            for (let y = 110; y < 600; y += 64) {
                let panel = this.add.rectangle(x + 32, y + 32, 60, 60, 0x20112A, 0.55);
                panel.setStrokeStyle(1, 0x3A1A4D, 0.7);
            }
        }

        for (let x = 80; x < 800; x += 160) {
            let light = this.add.rectangle(x, 335, 8, 440, 0x00F5FF, 0.16);
            this.tweens.add({ targets: light, alpha: 0.04, duration: 900, yoyo: true, repeat: -1 });

            let warning = this.add.rectangle(x + 25, 335, 4, 440, 0xFF2A6D, 0.12);
            this.tweens.add({ targets: warning, alpha: 0.03, duration: 1200, yoyo: true, repeat: -1 });
        }

        this.add.rectangle(400, 100, 790, 14, 0xFF2A6D, 0.75);
        this.add.rectangle(400, 120, 790, 8, 0x00F5FF, 0.55);
        this.add.rectangle(400, 145, 790, 6, 0xFFD300, 0.35);

        for (let x = 40; x < 790; x += 95) {
            this.add.rectangle(x, 130, 55, 8, 0x3B3B5C, 1);
            this.add.rectangle(x, 138, 20, 20, 0x101020, 1);

            let smallLight = this.add.rectangle(x, 142, 10, 12, 0x00F5FF, 0.35);
            this.tweens.add({ targets: smallLight, alpha: 0.08, duration: 700, yoyo: true, repeat: -1 });
        }

        this.add.text(400, 110, 'AETHELGARD LAB CORE', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setAlpha(0.55);

        this.add.circle(400, 345, 38, 0x00F5FF, 0.08);
        let reactor = this.add.circle(400, 345, 22, 0xFF2A6D, 0.18);

        this.tweens.add({
            targets: reactor,
            scale: 1.4,
            alpha: 0.05,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    createAnimations() {
        if (this.anims.exists('kael_idle_anim')) return;

        this.anims.create({
            key: 'kael_idle_anim',
            frames: this.anims.generateFrameNumbers('kael_idle', { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'kael_run_anim',
            frames: this.anims.generateFrameNumbers('kael_run', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'kael_jump_anim',
            frames: this.anims.generateFrameNumbers('kael_jump', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'kael_shoot_anim',
            frames: this.anims.generateFrameNumbers('kael_shoot', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'kael_death_anim',
            frames: this.anims.generateFrameNumbers('kael_death', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'explosion_anim',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });
    }

    createPlatform(x, y, width, height) {
        let platform = this.add.rectangle(x, y, width, height, 0x2E2E5E);
        platform.setStrokeStyle(2, 0x00F5FF);

        this.add.rectangle(x, y - height / 2 + 3, width - 8, 4, 0xFF2A6D, 0.7);

        this.physics.add.existing(platform, true);
        this.platforms.add(platform);
    }

    createDrone(x, y, minX, maxX) {
        let drone = this.physics.add.sprite(x, y, 'drone');

        drone.setScale(2.4);
        drone.body.allowGravity = false;
        drone.setImmovable(true);
        drone.body.setSize(26, 28); // hitbox mas alto: disparos y contacto mas tolerantes

        drone.startY = y;
        drone.minX = minX;
        drone.maxX = maxX;
        drone.speed = 1.6;
        drone.enemyType = 'drone';

        this.enemies.add(drone);
    }

    createTurret(x, y, direction) {
        let turret = this.physics.add.sprite(x, y, 'turret');

        turret.setScale(2.2);
        turret.body.allowGravity = false;
        turret.setImmovable(true);
        turret.body.setSize(28, 30); // hitbox mas amplio para acertar y para el contacto

        turret.enemyType = 'turret';
        turret.shootDirection = direction;

        this.enemies.add(turret);
    }

    moveEnemies() {
        this.enemies.children.iterate((enemy) => {
            if (!enemy) return;

            if (enemy.enemyType === 'drone') {
                enemy.x += enemy.speed;

                if (enemy.x >= enemy.maxX) {
                    enemy.speed = -1.6;
                    enemy.flipX = true;
                }

                if (enemy.x <= enemy.minX) {
                    enemy.speed = 1.6;
                    enemy.flipX = false;
                }

                enemy.y = enemy.startY + Math.sin(this.time.now / 200) * 4;
            }
        });
    }

    shoot() {
        if (!this.canShoot) return;

        this.canShoot = false;
        this.sound.play('n3_shoot', { volume: 0.35 });
        this.player.anims.play('kael_shoot_anim', true);

        let direction = this.player.flipX ? -1 : 1;

        let bullet = this.physics.add.sprite(
            this.player.x + direction * 34,
            this.player.y - 3,
            'bullet'
        );

        // Agregar al grupo ANTES de fijar la velocidad: al agregarlo, el grupo
        // puede resetear la velocidad, por eso setVelocityX debe ir al final.
        this.bullets.add(bullet);

        bullet.setScale(1.5);
        bullet.body.allowGravity = false;
        if (direction === -1) bullet.flipX = true;
        bullet.setVelocityX(560 * direction);

        this.time.delayedCall(260, () => {
            this.canShoot = true;
        });
    }

    turretsShoot() {
        if (this.isDead || this.levelCompleted || this.isPaused) return;

        this.enemies.children.iterate((enemy) => {
            if (!enemy || enemy.enemyType !== 'turret') return;

            let direction = enemy.shootDirection === 'left' ? -1 : 1;

            let bullet = this.physics.add.sprite(
                enemy.x + direction * 25,
                enemy.y - 2,
                'bullet'
            );

            this.enemyBullets.add(bullet);

            bullet.setScale(1.2);
            bullet.setTint(0x00F5FF);
            bullet.body.allowGravity = false;
            if (direction === -1) bullet.flipX = true;
            bullet.setVelocityX(360 * direction);
        });
    }

    hitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;

        bullet.destroy();

        this.sound.play('n3_hit', { volume: 0.5 });

        let boom = this.add.sprite(enemy.x, enemy.y, 'explosion');
        boom.setScale(1.8);
        boom.play('explosion_anim');

        boom.on('animationcomplete', () => boom.destroy());

        if (enemy.enemyType === 'drone') {
            this.score++;
        }

        enemy.destroy();

        this.infoText.setText('Vida: ' + this.playerHealth + ' | Drones eliminados: ' + this.score + '/5');

        if (this.score >= this.totalDrones) {
            this.portalText.setText('Portal desbloqueado');
            this.portalText.setColor('#39FF14');
            this.portal.clearTint();

            this.cameras.main.flash(250, 57, 255, 20);

            let alert = this.add.text(400, 170, 'ACCESO AL PORTAL HABILITADO', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#39FF14'
            }).setOrigin(0.5).setDepth(30);

            this.tweens.add({
                targets: alert,
                alpha: 0,
                y: 145,
                duration: 1600,
                onComplete: () => alert.destroy()
            });

            this.tweens.add({
                targets: this.portal,
                scale: 2.6,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    damagePlayer(player, enemy) {
        if (this.isInvulnerable || this.isDead || this.levelCompleted) return;

        this.playerHealth--;

        this.infoText.setText('Vida: ' + this.playerHealth + ' | Drones eliminados: ' + this.score + '/5');

        this.isInvulnerable = true;
        this.player.setTint(0xff0000);
        this.cameras.main.shake(140, 0.006);

        this.time.delayedCall(900, () => {
            this.isInvulnerable = false;
            this.player.clearTint();
        });

        if (this.playerHealth <= 0) {
            this.defeat();
        }
    }

    damagePlayerByBullet(player, bullet) {
        if (bullet && bullet.active) bullet.destroy();
        this.damagePlayer(player, bullet);
    }

    cleanBullets() {
        this.bullets.children.iterate((bullet) => {
            if (bullet && (bullet.x < -50 || bullet.x > 850)) bullet.destroy();
        });

        this.enemyBullets.children.iterate((bullet) => {
            if (bullet && (bullet.x < -50 || bullet.x > 850)) bullet.destroy();
        });
    }

    finishLevel() {
        if (this.score < this.totalDrones || this.levelCompleted) return;

        this.levelCompleted = true;
        localStorage.setItem('neonEscapeUnlockedLevel', '3');

        this.stopLevelMusic();
        this.sound.play('n3_win', { volume: 0.6 });

        this.add.rectangle(400, 300, 520, 150, 0x000000, 0.75).setDepth(20);

        this.add.text(400, 275, '¡NIVEL 3 COMPLETADO!', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#39FF14'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(400, 325, 'Kael neutralizó el núcleo de laboratorios', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(21);

        this.physics.pause();

        this.time.delayedCall(2200, () => {
            this.scene.start('Scene_Menu');
        });
    }

    defeat() {
        this.isDead = true;
        this.stopLevelMusic();
        this.sound.play('n3_lose', { volume: 0.6 });
        this.player.anims.play('kael_death_anim', true);
        this.physics.pause();

        this.add.rectangle(400, 300, 540, 160, 0x000000, 0.78).setDepth(20);

        this.add.text(400, 270, 'KAEL HA SIDO DERROTADO', {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#FF2A6D'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(400, 320, 'Presiona R para reiniciar o M para menú', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(21);
    }

    // ========== MUSICA (Mejora 7) ==========
    startLevelMusic() {
        if (this.levelMusic) {
            this.levelMusic.stop();
        }

        this.levelMusic = this.sound.add('n3_bgm', { loop: true, volume: 0 });
        this.levelMusic.play();
        this.tweens.add({ targets: this.levelMusic, volume: 0.4, duration: 800 });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopLevelMusic());
    }

    stopLevelMusic() {
        if (!this.levelMusic) return;

        const music = this.levelMusic;
        this.levelMusic = null;

        this.tweens.add({
            targets: music,
            volume: 0,
            duration: 400,
            onComplete: () => {
                music.stop();
                music.destroy();
            }
        });
    }

    // ========== PAUSA (Mejora 9) ==========
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
            this.levelMusic.setVolume(0.15);
        }

        this.createPauseOverlay();
    }

    resumeLevel() {
        this.isPaused = false;
        this.physics.resume();

        if (this.levelMusic) {
            this.levelMusic.setVolume(0.4);
        }

        this.destroyPauseOverlay();
    }

    createPauseOverlay() {
        if (this.pauseOverlay) return;

        this.pauseOverlay = this.add.container(0, 0).setDepth(2000).setScrollFactor(0);
        const shade = this.add.rectangle(400, 300, 800, 600, 0x050711, 0.68);
        const panel = this.add.rectangle(400, 300, 430, 270, 0x1A1A2E, 0.96).setStrokeStyle(3, 0xFF2A6D, 0.95);
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
        this.pauseOverlay.add(this.createPauseButton(400, 340, 'Reiniciar', () => this.scene.restart()));
        this.pauseOverlay.add(this.createPauseButton(540, 340, 'Menu', () => {
            this.stopLevelMusic();
            this.scene.start('Scene_Menu');
        }));
    }

    createPauseButton(x, y, label, action) {
        const container = this.add.container(0, 0);
        const button = this.add.rectangle(x, y, 118, 42, 0x071A2E, 0.98).setStrokeStyle(2, 0x00F5FF, 0.9);
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
}