import Phaser from 'phaser';
import { VIEW, CAMERA, SCORING } from '../config/gameConfig.js';
import { getLevel } from '../levels/index.js';
import LevelBuilder from '../levels/LevelBuilder.js';
import Player from '../entities/Player.js';
import Chimney, { CHIMNEY_STATE } from '../entities/Chimney.js';
import QuizPanel from '../ui/QuizPanel.js';
import { getBank } from '../education/registry.js';
import { createRound } from '../education/QuestionBank.js';
import ResultsTracker from '../education/ResultsTracker.js';
import { AudioManager } from '../systems/AudioManager.js';
import { bus, EV } from '../systems/events.js';
import { makeText } from '../ui/text.js';
import { getCharacter } from '../characters/registry.js';
import { Storage } from '../systems/storage.js';

const STATE = { PLAY: 'play', QUIZ: 'quiz', DELIVER: 'deliver', RESPAWN: 'respawn', FINISH: 'finish' };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data = {}) {
    this.level = getLevel(data.levelId);
    this.killY = this.level.height + 80; // onder de onderkant van het level: gevallen
    this.bank = getBank(data.bankId);
    this.character = getCharacter(data.character ?? Storage.settings.character);
    this.state = STATE.PLAY;
    this.activeChimney = null;
    this.quiz = null;
    this.lastGateHint = 0;
  }

  create() {
    const L = this.level;
    const W = VIEW.width;
    this.physics.world.setBounds(0, 0, L.width, L.height + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.physics.resume();

    this.createBackground();
    this.world = new LevelBuilder(this, L).build();

    // vragen: willekeurige volgorde en antwoordposities per ronde
    const round = createRound(this.bank, L.chimneys.length);
    this.tracker = new ResultsTracker(L.chimneys.length);
    this.tracker.pepernotenTotal = L.pepernoten.length;

    this.chimneys = L.chimneys.map((x, i) => new Chimney(this, {
      x, roofY: this.world.roofYAt(x), index: i, question: round[i], solids: this.world.solids,
    }));

    // speler
    const spawnY = this.world.roofYAt(L.spawn.x);
    this.checkpoint = { x: L.spawn.x, y: spawnY };
    this.player = new Player(this, L.spawn.x, spawnY - 2, this.character.id);
    this.player.on('jump', () => AudioManager.play('jump'));
    this.player.on('land', (vy) => this.onLand(vy));

    // botsingen
    this.physics.add.collider(this.player, this.world.solids, (pl, solid) => this.onSolidContact(solid));
    for (const m of this.world.movers) this.physics.add.collider(this.player, m, () => { this.player.surface = 'normal'; });
    this.physics.add.overlap(this.player, this.world.pepernoten, (pl, p) => this.collectPepernoot(p));

    // effecten
    this.dust = this.add.particles(0, 0, 'puff', {
      speedX: { min: -90, max: 90 }, speedY: { min: -40, max: -10 }, scale: { start: 0.25, end: 0.05 },
      alpha: { start: 0.6, end: 0 }, lifespan: 380, emitting: false,
    }).setDepth(49);
    this.sparkles = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 220 }, scale: { start: 0.9, end: 0 }, lifespan: 650, rotate: { min: 0, max: 360 },
      emitting: false, gravityY: 200,
    }).setDepth(70);

    // camera (eigen volg-logica: deadzone, look-ahead, exponentieel smoothen)
    const cam = this.cameras.main;
    cam.setBounds(0, 0, L.width, L.height);
    this.camFocusX = this.player.x;
    this.camLook = CAMERA.lookAhead;
    cam.scrollX = Phaser.Math.Clamp(this.player.x + this.camLook - W / 2, 0, L.width - W);
    this.camGroundY = spawnY;
    cam.scrollY = this.cameraYFor(spawnY);
    cam.fadeIn(350, 7, 13, 36);
    this.showLevelTitle();

    this.createInput();

    // HUD
    this.scene.launch('Hud');
    this.time.delayedCall(10, () => {
      bus.emit(EV.PEPERNOTEN, 0, L.pepernoten.length);
      bus.emit(EV.DELIVERED, 0, L.chimneys.length);
    });
    this.onPauseRequest = () => this.openPause();
    bus.on(EV.PAUSE_REQUEST, this.onPauseRequest);
    const onResume = () => { this.resumedAt = performance.now(); };
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => {
      this.events.off('resume', onResume);
      bus.off(EV.PAUSE_REQUEST, this.onPauseRequest);
      AudioManager.duck(false);
    });

    // decoratieve vogels
    this.time.addEvent({ delay: 7000, loop: true, callback: () => this.spawnBird() });
    this.spawnBird();

    AudioManager.playMusic('game');
    this.time.delayedCall(250, () => AudioManager.play('respawn')); // Piet/Sint verschijnt
    if (import.meta.env.DEV) window.__scene = this;
  }

  // ------------------------------------------------------------------ achtergrond
  createBackground() {
    const W = VIEW.width;
    this.add.image(0, 0, 'sky').setOrigin(0).setScrollFactor(0).setDepth(-100);
    this.moon = this.add.image(1010, 130, 'moon').setScrollFactor(0).setDepth(-95);
    this.clouds = [
      { key: 'cloud1', x: 200, y: 90, f: 0.06, v: 6 },
      { key: 'cloud3', x: 700, y: 170, f: 0.09, v: 9 },
      { key: 'cloud2', x: 1150, y: 60, f: 0.05, v: 5 },
      { key: 'cloud1', x: 1650, y: 210, f: 0.11, v: 7 },
    ].map((c) => ({ ...c, img: this.add.image(c.x, c.y, c.key).setScrollFactor(0).setDepth(-94).setAlpha(0.85), off: 0 }));
    this.farTown = this.add.tileSprite(0, 720 - 300 - 90, W, 300, 'far_town').setOrigin(0).setScrollFactor(0).setDepth(-90);
    this.midTown = this.add.tileSprite(0, 720 - 380 + 30, W, 380, 'mid_town').setOrigin(0).setScrollFactor(0).setDepth(-80);
    this.fog = this.add.tileSprite(0, 720 - 200, W, 200, 'alley_fog').setOrigin(0).setScrollFactor(0).setDepth(-70);
    // onder de mist: donkere steegjes (zichtbaar als de camera in hoge levels omlaag kijkt)
    this.alleyDark = this.add.rectangle(0, 720, W, 720, 0x050816).setOrigin(0).setScrollFactor(0).setDepth(-69);
  }

  updateBackground(dt) {
    const cam = this.cameras.main;
    const sx = cam.scrollX;
    this.farTown.tilePositionX = sx * 0.12;
    this.midTown.tilePositionX = sx * 0.3;
    this.moon.x = 1010 - sx * 0.01;
    // hoge levels: hoe hoger de camera, hoe verder de dorpslagen zakken (verticale parallax)
    const above = (this.level.height - VIEW.height) - cam.scrollY; // 0 = camera onderaan
    this.farTown.y = 720 - 300 - 90 + above * 0.2;
    this.midTown.y = 720 - 380 + 30 + above * 0.45;
    this.fog.y = 720 - 200 + above;
    this.alleyDark.y = 720 + above;
    const span = VIEW.width + 400;
    for (const c of this.clouds) {
      c.off += c.v * dt;
      let x = (c.x - sx * c.f - c.off) % span;
      if (x < -200) x += span;
      c.img.x = x;
    }
  }

  spawnBird() {
    if (this.state === STATE.FINISH) return;
    const cam = this.cameras.main;
    const y = cam.scrollY + Phaser.Math.Between(150, 300);
    const bird = this.add.sprite(cam.scrollX + VIEW.width + 60, y, 'bird_up').setDepth(5).setScale(0.8).play('bird-flap');
    bird.setFlipX(true);
    this.tweens.add({
      targets: bird, x: cam.scrollX - 200, y: y + Phaser.Math.Between(-60, 40), duration: 9000,
      onComplete: () => bird.destroy(),
    });
  }

  // ------------------------------------------------------------------ input
  createInput() {
    const kb = this.input.keyboard;
    this.keys = kb.addKeys('LEFT,RIGHT,UP,W,A,D,SPACE,E,ESC');
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    kb.on('keydown-ESC', () => this.openPause());
    kb.on('keydown', () => AudioManager.unlock());
    this.input.on('pointerdown', () => AudioManager.unlock());
  }

  readInput() {
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;
    const U = Phaser.Input.Keyboard.JustUp;
    // JustDown/JustUp altijd uitlezen, zodat oude drukken niet later "naschieten"
    const pressed = [J(k.SPACE), J(k.UP), J(k.W)].some(Boolean);
    const released = [U(k.SPACE), U(k.UP), U(k.W)].some(Boolean);
    const interact = J(k.E);
    return {
      left: k.LEFT.isDown || k.A.isDown,
      right: k.RIGHT.isDown || k.D.isDown,
      jumpDown: k.SPACE.isDown || k.UP.isDown || k.W.isDown,
      jumpPressed: pressed,
      jumpReleased: released,
      interact,
    };
  }

  // ------------------------------------------------------------------ loop
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const input = this.readInput();
    this.world.updateMovers(dt);

    if (this.state === STATE.PLAY) {
      this.tracker.timeMs += delta;
      this.player.update(dt, input);
      this.updateChimneyProximity(input);
      this.updateCheckpoints();
      this.checkFinish();
      if (this.player.y > this.killY) this.fallRespawn();
    } else if (this.state === STATE.QUIZ || this.state === STATE.DELIVER) {
      this.tracker.timeMs += delta;
      this.player.update(dt, { left: false, right: false, jumpDown: false, jumpPressed: false, jumpReleased: false });
    } else if (this.state === STATE.FINISH) {
      this.player.update(dt, { left: false, right: false, jumpDown: false, jumpPressed: false, jumpReleased: false });
    }

    if (this.state !== STATE.QUIZ && this.state !== STATE.DELIVER) this.updateCamera(dt);
    this.updateBackground(dt);
  }

  updateCamera(dt) {
    const cam = this.cameras.main;
    const p = this.player;
    const targetLook = p.facing * CAMERA.lookAhead;
    this.camLook += (targetLook - this.camLook) * (1 - Math.exp(-CAMERA.lookAheadSmoothing * dt));
    const dx = p.x - this.camFocusX;
    if (Math.abs(dx) > CAMERA.deadzoneX) this.camFocusX += dx - Math.sign(dx) * CAMERA.deadzoneX;
    const desired = Phaser.Math.Clamp(this.camFocusX + this.camLook - VIEW.width / 2, 0, this.level.width - VIEW.width);
    cam.scrollX += (desired - cam.scrollX) * (1 - Math.exp(-CAMERA.smoothing * dt));

    // verticaal: alleen bijstellen op de hoogte van het loopvlak (geen gewiebel bij elke sprong);
    // bij een diepe val direct meegaan zodat Piet in beeld blijft
    if (p.onFloor) this.camGroundY = p.y;
    else if (p.y > this.camGroundY + CAMERA.fallFollowMargin) this.camGroundY = p.y - CAMERA.fallFollowMargin;
    else if (p.y < this.camGroundY - 260) this.camGroundY = p.y + 260; // hoog op een lift
    const targetY = this.cameraYFor(this.camGroundY);
    cam.scrollY += (targetY - cam.scrollY) * (1 - Math.exp(-CAMERA.verticalSmoothing * dt));
  }

  /** Camera-y waarbij een loopvlak op hoogte `groundY` op de vaste schermhoogte komt. */
  cameraYFor(groundY) {
    return Phaser.Math.Clamp(groundY - VIEW.height * CAMERA.groundScreenY, 0, Math.max(0, this.level.height - VIEW.height));
  }

  showLevelTitle() {
    const L = this.level;
    const c = this.add.container(VIEW.width / 2, 210).setScrollFactor(0).setDepth(900).setAlpha(0);
    const ribbon = this.add.image(0, 0, 'logo_ribbon').setScale(0.62, 0.55);
    const t = makeText(this, 0, -14, L.name, { size: 44, weight: '700', color: '#ffffff', stroke: '#5a1010', strokeThickness: 7 }).setAngle(-2);
    const s = makeText(this, 0, 36, `${L.world} · Level ${L.number}`, { size: 22, weight: '600', color: '#ffd66b', stroke: '#3a0a0a', strokeThickness: 5 }).setAngle(-2);
    c.add([ribbon, t, s]);
    this.tweens.add({ targets: c, alpha: 1, y: 190, duration: 450, delay: 300, ease: 'Back.Out' });
    this.tweens.add({ targets: c, alpha: 0, y: 170, duration: 500, delay: 2300, onComplete: () => c.destroy() });
  }

  // ------------------------------------------------------------------ wereld-interactie
  onSolidContact(solid) {
    const gate = solid.getData('gate');
    if (gate) {
      if (this.time.now - this.lastGateHint > 2200) {
        this.lastGateHint = this.time.now;
        AudioManager.play('blocked');
        this.floatText(gate.gateX - 20, gate.roofY - 170, 'Eerst het cadeau\nbezorgen! (E)', '#fff3d6', '#7a1d1d');
      }
      return;
    }
    if (this.player.body.touching.down || this.player.body.blocked.down) this.player.surface = solid.getData('surface') ?? 'normal';
  }

  onLand(vy) {
    AudioManager.play('land');
    this.dust.emitParticleAt(this.player.x, this.player.y, Phaser.Math.Clamp(Math.round(vy / 120), 3, 9));
  }

  collectPepernoot(p) {
    if (!p.active) return;
    p.disableBody(true, false);
    this.tweens.killTweensOf(p);
    this.tweens.add({ targets: p, y: p.y - 40, scale: 1.5, alpha: 0, duration: 300, ease: 'Quad.Out', onComplete: () => p.destroy() });
    this.sparkles.emitParticleAt(p.x, p.y, 5);
    this.tracker.pepernoten += 1;
    AudioManager.play('pepernoot');
    bus.emit(EV.PEPERNOTEN, this.tracker.pepernoten, this.tracker.pepernotenTotal);
  }

  updateChimneyProximity(input) {
    let near = null;
    for (const c of this.chimneys) {
      const isNear = c.state === CHIMNEY_STATE.OPEN && c.isNear(this.player) && this.player.onFloor;
      c.setIndicator(isNear);
      if (isNear) near = c;
      // een schoorsteen bereiken telt als checkpoint
      if (c.isNear(this.player) && this.player.onFloor && this.checkpoint.x < c.x - 40) {
        this.checkpoint = { x: c.x - 40, y: c.roofY };
      }
    }
    if (near && input.interact) this.startQuiz(near);
  }

  updateCheckpoints() {
    for (const cp of this.world.checkpoints) {
      if (!cp.active && this.player.x > cp.x && this.player.onFloor && Math.abs(this.player.y - cp.y) < 30) {
        cp.active = true;
        cp.img.setTexture('checkpoint_on');
        this.tweens.add({ targets: cp.img, scaleY: { from: 0.7, to: 1 }, duration: 400, ease: 'Back.Out' });
        this.sparkles.emitParticleAt(cp.x + 20, cp.y - 100, 10);
        AudioManager.play('checkpoint');
        bus.emit(EV.TOAST, 'Checkpoint!');
        if (cp.x > this.checkpoint.x) this.checkpoint = { x: cp.x, y: cp.y };
      }
    }
  }

  fallRespawn() {
    this.state = STATE.RESPAWN;
    AudioManager.play('fall');
    const cam = this.cameras.main;
    cam.fadeOut(220, 7, 13, 36);
    cam.once('camerafadeoutcomplete', () => {
      this.player.respawn(this.checkpoint.x, this.checkpoint.y - 2);
      this.camFocusX = this.player.x;
      cam.scrollX = Phaser.Math.Clamp(this.player.x + this.camLook - VIEW.width / 2, 0, this.level.width - VIEW.width);
      this.camGroundY = this.checkpoint.y;
      cam.scrollY = this.cameraYFor(this.checkpoint.y);
      cam.fadeIn(260, 7, 13, 36);
      AudioManager.play('respawn');
      bus.emit(EV.TOAST, 'Oeps! Terug naar het checkpoint.');
      this.state = STATE.PLAY;
    });
  }

  // ------------------------------------------------------------------ opdracht
  startQuiz(chimney) {
    this.state = STATE.QUIZ;
    this.activeChimney = chimney;
    this.player.freeze(true);
    this.player.face(chimney.x >= this.player.x ? 1 : -1);
    this.physics.pause();
    chimney.activate();
    this.tracker.startQuestion(chimney.question);
    AudioManager.play('open');
    AudioManager.duck(true);
    bus.emit(EV.QUIZ_STATE, true);

    // camera centreert de schoorsteen
    const cam = this.cameras.main;
    const target = Phaser.Math.Clamp(chimney.x - VIEW.width / 2, 0, this.level.width - VIEW.width);
    // dak van de schoorsteen op dezelfde schermhoogte als in level 1 (ruimte voor ballon en cadeaus)
    const targetY = Phaser.Math.Clamp(chimney.roofY - 540, 0, Math.max(0, this.level.height - VIEW.height));
    this.tweens.add({
      targets: cam, scrollX: target, scrollY: targetY, duration: 380, ease: 'Sine.InOut',
      onComplete: () => {
        if (this.state !== STATE.QUIZ) return;
        this.quiz = new QuizPanel(this, {
          bank: this.bank,
          question: chimney.question,
          anchorX: chimney.x - target,
          onAnswer: (i) => this.onAnswer(i),
        });
      },
    });
  }

  onAnswer(i) {
    const q = this.activeChimney.question;
    const ok = this.tracker.answer(q, q.answers[i]);
    if (!ok) {
      AudioManager.play('wrong');
      this.quiz.markWrong(i);
      return;
    }
    this.state = STATE.DELIVER;
    AudioManager.play('correct');
    const chimney = this.activeChimney;
    const cam = this.cameras.main;
    this.player.playDeliver();
    this.quiz.playCorrect(i, { x: chimney.opening.x - cam.scrollX, y: chimney.opening.y - cam.scrollY }, () => {
      AudioManager.play('deliver');
      // pufje rook + sterretjes uit de schoorsteen
      for (let n = 0; n < 6; n++) {
        const puff = this.add.image(chimney.x + Phaser.Math.Between(-14, 14), chimney.top, 'puff').setDepth(26).setScale(0.3).setAlpha(0.8);
        this.tweens.add({ targets: puff, y: chimney.top - Phaser.Math.Between(40, 90), x: puff.x + Phaser.Math.Between(-30, 30), scale: 0.9, alpha: 0, duration: 700, ease: 'Quad.Out', onComplete: () => puff.destroy() });
      }
      this.sparkles.emitParticleAt(chimney.x, chimney.top, 16);
      chimney.complete();
      this.floatText(chimney.x, chimney.top - 30, `+${SCORING.pointsPerDelivery}`, '#ffd66b', '#5a3a05');
      bus.emit(EV.DELIVERED, this.tracker.delivered, this.chimneys.length);
      this.quiz.close();
      this.quiz = null;
      this.time.delayedCall(450, () => this.endQuiz());
    });
  }

  endQuiz() {
    this.activeChimney = null;
    this.physics.resume();
    this.player.freeze(false);
    AudioManager.duck(false);
    bus.emit(EV.QUIZ_STATE, false);
    this.camFocusX = this.player.x;
    this.camLook = (this.cameras.main.scrollX + VIEW.width / 2) - this.player.x;
    const done = this.tracker.delivered;
    if (done < this.chimneys.length) bus.emit(EV.TOAST, `Nog ${this.chimneys.length - done} te gaan!`);
    else bus.emit(EV.TOAST, 'Alle cadeautjes bezorgd! Op naar de finish!');
    this.state = STATE.PLAY;
  }

  floatText(x, y, str, color, stroke) {
    const t = makeText(this, x, y, str, { size: 24, color, weight: '700', stroke, strokeThickness: 5 }).setDepth(80);
    this.tweens.add({ targets: t, y: y - 50, alpha: { from: 1, to: 0 }, duration: 1500, ease: 'Quad.Out', onComplete: () => t.destroy() });
  }

  // ------------------------------------------------------------------ finish
  checkFinish() {
    if (this.player.x < this.world.finishX + 10 || !this.player.onFloor) return;
    if (this.tracker.delivered < this.chimneys.length) return; // kan niet, de poorten voorkomen dit
    this.state = STATE.FINISH;
    this.player.body.setVelocityX(0);
    this.player.face(1);
    this.player.celebrate();
    AudioManager.play('finish');
    AudioManager.duck(true);
    this.tweens.add({ targets: this.world.finishFlag, scaleX: { from: 1, to: 1.08 }, duration: 200, yoyo: true, repeat: 3 });

    const colors = [0xd63a32, 0x2f6fd6, 0x8a3fd0, 0xf2b632, 0x3fbf5a];
    const cam = this.cameras.main;
    const confetti = this.add.particles(0, 0, 'confetti', {
      x: { min: cam.scrollX, max: cam.scrollX + VIEW.width }, y: cam.scrollY - 20,
      speedY: { min: 120, max: 260 }, speedX: { min: -60, max: 60 }, rotate: { min: 0, max: 360 },
      lifespan: 4000, quantity: 3, frequency: 40, tint: colors, scale: { min: 0.8, max: 1.4 },
    }).setDepth(90);
    this.time.delayedCall(1600, () => confetti.stop());

    this.time.delayedCall(2600, () => {
      const summary = this.tracker.summary();
      this.cameras.main.fadeOut(400, 7, 13, 36);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        AudioManager.duck(false);
        this.scene.stop('Hud');
        this.scene.start('Results', { summary, levelId: this.level.id, levelName: this.level.name, bankId: this.bank.id, character: this.character.id });
      });
    });
  }

  // ------------------------------------------------------------------ pauze
  openPause() {
    if (this.state === STATE.FINISH || this.state === STATE.RESPAWN || !this.scene.isActive()) return;
    // dezelfde Esc-druk die de pauze sloot, mag hem niet meteen weer openen
    if (performance.now() - (this.resumedAt ?? 0) < 250) return;
    AudioManager.play('click');
    this.scene.pause();
    this.scene.launch('Pause', { bankId: this.bank.id, levelId: this.level.id, character: this.character.id });
  }
}
