import Phaser from 'phaser';
import { PLAYER } from '../config/gameConfig.js';
import { CHAR_FRAME } from '../assets/characterRig.js';

const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

/**
 * Piet – de character controller.
 * Arcade Physics doet botsingen; snelheid en zwaartekracht worden hier per frame
 * bepaald voor een strak spronggevoel (zie platformer-skill).
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, characterId = 'piet') {
    super(scene, x, y, characterId, 'idle_0');
    this.characterId = characterId;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, CHAR_FRAME.foot / CHAR_FRAME.h);
    const { width, height } = PLAYER.body;
    this.body.setSize(width, height);
    this.body.setOffset((CHAR_FRAME.w - width) / 2, CHAR_FRAME.foot - height);
    this.body.setMaxVelocity(1200, PLAYER.maxFallSpeed);
    this.setCollideWorldBounds(true);
    this.setDepth(50);

    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;
    this.wasOnFloor = false;
    this.prevVy = 0;
    this.surface = 'normal';
    this.frozen = false;
    this.locked = false; // tijdens bezorg-/juichanimatie
    this.landTimer = 0;
    this.facing = 1;
  }

  get onFloor() {
    return this.body.blocked.down || this.body.touching.down;
  }

  /** Animatiesleutel voor dit personage, bijv. 'sint-run'. */
  anim(name) {
    return `${this.characterId}-${name}`;
  }

  /** input: { left, right, jumpDown, jumpPressed, jumpReleased }; wind: duw in px/s (+ = naar rechts) */
  update(dt, input, wind = 0) {
    const b = this.body;
    const onFloor = this.onFloor;

    if (this.frozen) {
      b.setVelocityX(0);
      b.setGravityY(PLAYER.gravity);
      this.wasOnFloor = onFloor;
      return;
    }

    // --- timers voor coyote time en jump buffer
    if (onFloor) this.coyote = PLAYER.coyoteTime;
    else this.coyote -= dt;
    if (input.jumpPressed) this.buffer = PLAYER.jumpBuffer;
    else this.buffer -= dt;

    // --- horizontaal: acceleratie en vertraging (glad op ijs)
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const ice = onFloor && this.surface === 'ice';
    const vx = b.velocity.x;
    let rate;
    if (dir !== 0) {
      const turning = Math.sign(vx) !== 0 && Math.sign(vx) !== dir;
      if (ice) rate = PLAYER.iceAccel * (turning ? 1.4 : 1);
      else if (onFloor) rate = PLAYER.groundAccel + (turning ? PLAYER.groundDecel : 0);
      else rate = PLAYER.airAccel;
    } else {
      rate = ice ? PLAYER.iceDecel : onFloor ? PLAYER.groundDecel : PLAYER.airDecel;
    }
    // wind verschuift de doelsnelheid: tegenwind remt en duwt terug, rugwind versnelt
    // (stilstaand duwt de wind zachter, zodat je niet zomaar van een rand waait)
    const push = dir === 0 ? wind * 0.35 : wind;
    b.setVelocityX(approach(vx, dir * PLAYER.runSpeed + push, rate * dt));
    this.inputDir = dir;
    if (dir !== 0) {
      this.facing = dir;
      this.setFlipX(dir < 0);
    }

    // --- springen (buffer + coyote), daarna beide timers verbruiken
    if (this.buffer > 0 && this.coyote > 0) {
      b.setVelocityY(-PLAYER.jumpVelocity);
      this.buffer = 0;
      this.coyote = 0;
      this.jumping = true;
      this.emit('jump');
    }
    // variabele spronghoogte: loslaten tijdens stijgen kort de sprong af
    if (input.jumpReleased && this.jumping && b.velocity.y < 0) {
      b.setVelocityY(b.velocity.y * PLAYER.jumpCutMult);
      this.jumping = false;
    }
    if (b.velocity.y >= 0) this.jumping = false;

    // --- asymmetrische zwaartekracht + "hang" in het hoogste punt
    let g = PLAYER.gravity;
    if (b.velocity.y > 0) g *= PLAYER.fallGravityMult;
    if (!onFloor && Math.abs(b.velocity.y) < PLAYER.apexThreshold && input.jumpDown) g *= PLAYER.apexHangMult;
    b.setGravityY(g);

    // --- landen
    if (onFloor && !this.wasOnFloor && this.prevVy > 260) {
      this.landTimer = 0.12;
      this.emit('land', this.prevVy);
    }
    this.landTimer -= dt;
    this.wasOnFloor = onFloor;
    this.prevVy = b.velocity.y;

    this.updateAnimation(onFloor);
  }

  updateAnimation(onFloor) {
    if (this.locked) return;
    const vx = Math.abs(this.body.velocity.x);
    if (!onFloor) {
      this.play(this.body.velocity.y < 0 ? this.anim('jump') : this.anim('fall'), true);
    } else if (this.landTimer > 0) {
      this.play(this.anim('land'), true);
    } else if (vx > 25 && (this.inputDir !== 0 || vx > 80)) {
      this.play(this.anim('run'), true);
      this.anims.timeScale = Phaser.Math.Clamp(vx / 300, 0.6, 1.2);
      return;
    } else {
      this.play(this.anim('idle'), true);
    }
    this.anims.timeScale = 1;
  }

  freeze(on) {
    this.frozen = on;
    if (on) {
      this.body.setVelocity(0, Math.max(0, this.body.velocity.y));
      this.buffer = 0;
      if (!this.locked) this.play(this.anim('idle'), true);
    }
  }

  face(dir) {
    this.facing = dir;
    this.setFlipX(dir < 0);
  }

  playDeliver(onDone) {
    this.locked = true;
    this.anims.timeScale = 1;
    this.play(this.anim('deliver'));
    this.once(`animationcomplete-${this.anim('deliver')}`, () => {
      this.locked = false;
      onDone?.();
    });
  }

  celebrate() {
    this.locked = true;
    this.anims.timeScale = 1;
    this.play(this.anim('celebrate'));
  }

  respawn(x, y) {
    this.body.reset(x, y);
    this.body.setVelocity(0, 0);
    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;
    this.prevVy = 0;
    this.locked = false;
    this.play(this.anim('idle'));
    this.setAlpha(1);
    this.scene.tweens.add({ targets: this, alpha: { from: 0.2, to: 1 }, duration: 120, repeat: 3, yoyo: false });
  }
}
