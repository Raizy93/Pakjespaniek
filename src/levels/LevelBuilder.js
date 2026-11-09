import Phaser from 'phaser';
import { makeBuildingTexture, makePlatformTexture, ROOF_OVERHANG, ROOF_PAD } from '../assets/worldArt.js';
import { makeText } from '../ui/text.js';

const BODY_BELOW = 300; // gebouwen lopen door tot onder de onderkant van het level

/** Bouwt de spelwereld op uit leveldata. Bevat geen spelregels. */
export default class LevelBuilder {
  constructor(scene, level) {
    this.scene = scene;
    this.level = level;
    this.solids = scene.physics.add.staticGroup();
    this.movers = [];
    this.lanternGlows = [];
    this.checkpoints = [];
    this.signs = [];
    this.crumbles = [];
    this.windZones = [];
    this.windClock = 0;
  }

  build() {
    this.buildBuildings();
    this.buildPlatforms();
    this.buildWind();
    this.buildProps();
    this.buildPepernoten();
    this.buildCheckpoints();
    this.buildSigns();
    this.buildFinish();
    return this;
  }

  roofYAt(x) {
    const b = this.level.buildings.find((bb) => x >= bb.x && x <= bb.x + bb.w);
    return b ? b.top : null;
  }

  surfaceAt(x) {
    const b = this.level.buildings.find((bb) => x >= bb.x && x <= bb.x + bb.w);
    return b?.roof === 'ice' ? 'ice' : 'normal';
  }

  addSolid(x, y, w, h, { surface = 'normal', oneWay = false } = {}) {
    const z = this.scene.add.zone(x, y, w, h).setOrigin(0);
    this.scene.physics.add.existing(z, true);
    z.setData('surface', surface);
    if (oneWay) {
      z.body.checkCollision.down = false;
      z.body.checkCollision.left = false;
      z.body.checkCollision.right = false;
    }
    this.solids.add(z);
    return z;
  }

  buildBuildings() {
    this.level.buildings.forEach((b, i) => {
      const tex = makeBuildingTexture(this.scene, `${this.level.id}_b${i}`, b, 100 + i * 17, this.level.height);
      this.scene.add.image(b.x - ROOF_OVERHANG, b.top - ROOF_PAD, tex.key).setOrigin(0).setDepth(10);
      this.addSolid(b.x, b.top, b.w, this.level.height - b.top + BODY_BELOW, { surface: b.roof === 'ice' ? 'ice' : 'normal' });
    });
  }

  buildPlatforms() {
    for (const p of this.level.platforms) {
      const key = makePlatformTexture(this.scene, { mover: 'mover', crumble: 'crumble' }[p.type] ?? 'plank', p.w);
      if (p.type === 'crumble') {
        // afbrokkelende dakpannen: zakken weg kort nadat je erop staat, komen later terug
        const img = this.scene.add.image(p.x, p.y - 2, key).setOrigin(0).setDepth(30);
        const zone = this.addSolid(p.x, p.y, p.w, 18, { oneWay: true });
        const c = { zone, img, x: p.x, y: p.y - 2, state: 'idle' };
        zone.setData('crumble', c);
        this.crumbles.push(c);
      } else if (p.type === 'mover') {
        const img = this.scene.physics.add.image(p.x, p.y, key).setOrigin(0).setDepth(30);
        img.body.setAllowGravity(false);
        img.body.setImmovable(true);
        img.body.setSize(p.w, 20).setOffset(0, 0);
        img.body.checkCollision.down = false;
        img.body.checkCollision.left = false;
        img.body.checkCollision.right = false;
        img.body.friction.x = 1;
        const from = { x: p.x, y: p.y };
        const to = p.to;
        const len = Math.hypot(to.x - from.x, to.y - from.y);
        // korte pauze aan de uiteinden: een rustig moment om op of af te stappen
        const pause = p.pause ?? (to.x === from.x ? 0.8 : 0.4);
        img.setData('mover', { from, to, speed: p.speed, dirX: (to.x - from.x) / len, dirY: (to.y - from.y) / len, sign: 1, len, pause, wait: 0 });
        img.body.setVelocity(img.getData('mover').dirX * p.speed, img.getData('mover').dirY * p.speed);
        this.movers.push(img);
      } else {
        if (p.type === 'swing') {
          // touwen naar boven
          const g = this.scene.add.graphics().setDepth(29);
          g.lineStyle(3, 0x8a6a3a, 1);
          for (const rx of [p.x + 10, p.x + p.w - 10]) g.lineBetween(rx, p.y + 4, rx, -20);
          g.lineStyle(1, 0xc49a5a, 0.8);
          for (const rx of [p.x + 9, p.x + p.w - 11]) g.lineBetween(rx, p.y + 4, rx, -20);
        }
        this.scene.add.image(p.x, p.y, key).setOrigin(0).setDepth(30);
        this.addSolid(p.x, p.y, p.w, 18, { oneWay: true });
      }
    }
  }

  buildProps() {
    for (const prop of this.level.props) {
      const top = this.roofYAt(prop.x);
      if (top === null) continue;
      if (prop.type === 'crate') {
        this.scene.add.image(prop.x, top + 1, 'crate').setOrigin(0.5, 1).setDepth(25);
        this.addSolid(prop.x - 32, top - 63, 64, 64);
      } else if (prop.type === 'barrels') {
        this.scene.add.image(prop.x, top + 1, 'barrels').setOrigin(0.5, 1).setDepth(25);
        this.addSolid(prop.x - 54, top - 60, 108, 60);
        this.addSolid(prop.x - 27, top - 118, 54, 58);
      } else if (prop.type === 'lantern') {
        this.scene.add.image(prop.x, top + 2, 'lantern').setOrigin(0.5, 1).setDepth(15);
        const glow = this.scene.add.image(prop.x, top - 112, 'glow').setTint(0xffa23c).setScale(1.5).setAlpha(0.55).setDepth(14).setBlendMode(Phaser.BlendModes.ADD);
        this.scene.tweens.add({ targets: glow, alpha: 0.38, scale: 1.4, duration: 1200 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        this.lanternGlows.push(glow);
      } else if (prop.type === 'sack') {
        this.scene.add.image(prop.x, top + 2, 'sack').setOrigin(0.5, 1).setDepth(15);
      }
    }
  }

  buildPepernoten() {
    this.pepernoten = this.scene.physics.add.staticGroup();
    for (const [x, y] of this.level.pepernoten) {
      const p = this.pepernoten.create(x, y, 'pepernoot');
      p.setDepth(40);
      p.body.setCircle(14, 3, 2);
      p.refreshBody();
      // zacht zweven (alleen visueel: body blijft staan)
      this.scene.tweens.add({ targets: p, y: y - 6, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Math.random() * 600 });
    }
  }

  buildCheckpoints() {
    for (const x of this.level.checkpoints) {
      const top = this.roofYAt(x);
      const img = this.scene.add.image(x, top + 2, 'checkpoint_off').setOrigin(0.2, 1).setDepth(16);
      this.checkpoints.push({ x, y: top, img, active: false });
    }
  }

  buildSigns() {
    for (const s of this.level.signs) {
      const top = this.roofYAt(s.x);
      if (top === null) continue;
      this.scene.add.image(s.x, top + 2, 'sign_board').setOrigin(0.5, 1).setScale(0.82).setDepth(15);
      // midden van het bord: texture-y 43 van 120, geschaald 0,82
      makeText(this.scene, s.x, top + 2 - 120 * 0.82 + 43 * 0.82, s.text, {
        size: 19, color: '#fff3d6', weight: '700', stroke: '#4a2a12', strokeThickness: 4, lineSpacing: 0,
      }).setDepth(16);
    }
  }

  buildFinish() {
    const { x } = this.level.finish;
    const top = this.roofYAt(x);
    this.finishFlag = this.scene.add.image(x, top + 2, 'finish_flag').setOrigin(0.1, 1).setDepth(16);
    this.scene.add.image(x - 90, top + 2, 'arrow_sign').setOrigin(0.5, 1).setScale(0.7).setDepth(15);
    makeText(this.scene, x - 96, top - 72, 'FINISH', { size: 17, color: '#fff3d6', weight: '700', stroke: '#4a2a12', strokeThickness: 4 }).setDepth(16);
    this.finishX = x;
    this.finishY = top;
  }

  // ------------------------------------------------------------------ wind
  /**
   * Windzones: { x, w, force (px/s, + = naar rechts), on, off, phase, yMin, yMax }.
   * De wind waait in vlagen (on seconden aan, off uit). Een windzak en windstrepen
   * kondigen een vlaag ~0,8 s van tevoren aan (game-feel: telegraferen).
   */
  buildWind() {
    for (const w of this.level.wind ?? []) {
      const dir = Math.sign(w.force);
      const top = this.roofYAt(w.x + 30) ?? this.level.height - 200;
      const poleX = dir > 0 ? w.x + 40 : w.x + w.w - 40;
      const poleTop = (this.roofYAt(poleX) ?? top) - 150;
      this.scene.add.image(poleX, poleTop, 'windsock_pole').setOrigin(0.5, 0).setDepth(14);
      const sock = this.scene.add.image(poleX, poleTop + 8, 'windsock').setOrigin(0.04, 0.5).setDepth(15).setFlipX(dir < 0);
      if (dir < 0) sock.setOrigin(0.96, 0.5);
      const yMin = w.yMin ?? 120;
      const yMax = w.yMax ?? this.level.height - 60;
      const streaks = this.scene.add.particles(0, 0, 'streak', {
        x: { min: w.x, max: w.x + w.w }, y: { min: yMin, max: yMax },
        speedX: { min: dir * 650, max: dir * 850 }, speedY: { min: -20, max: 20 },
        scaleX: { min: 0.8, max: 2 }, alpha: { start: 0.65, end: 0 }, lifespan: 700,
        frequency: 45, quantity: 2, emitting: false,
      }).setDepth(60);
      this.windZones.push({ ...w, on: w.on ?? 2.4, off: w.off ?? 2.0, phase: w.phase ?? 0, dir, sock, streaks, strength: 0, active: false, prewarn: false });
    }
  }

  /** Huidige windkracht (px/s) op positie x. */
  windAt(x) {
    for (const z of this.windZones) if (x >= z.x && x <= z.x + z.w) return z.force * z.strength;
    return 0;
  }

  /** @returns {object|null} de zone waarin net een vlaag begint (voor geluid) */
  updateWind(dt, running) {
    if (running) this.windClock += dt;
    let gust = null;
    for (const z of this.windZones) {
      const cycle = z.on + z.off;
      const t = (((this.windClock + z.phase) % cycle) + cycle) % cycle;
      const active = t < z.on;
      if (active && !z.active) gust = z;
      z.active = active;
      z.prewarn = !active && cycle - t < 0.8;
      const target = active ? 1 : 0;
      z.strength += (target - z.strength) * Math.min(1, dt / 0.3);
      // windzak: hangt slap, of staat strak in de wind (met wat gefladder)
      const flutter = Math.sin(this.windClock * 22) * 4 * z.strength;
      z.sock.setAngle(((1 - z.strength) * 75 + flutter) * z.dir);
      z.streaks.emitting = running && (z.strength > 0.25 || z.prewarn);
      z.streaks.frequency = z.prewarn && !active ? 160 : 45;
    }
    return gust;
  }

  // ------------------------------------------------------------------ brokkelpannen
  /** @returns {boolean} true als de dakpannen nu gaan brokkelen */
  triggerCrumble(c) {
    if (c.state !== 'idle') return false;
    c.state = 'shaking';
    const scene = this.scene;
    scene.tweens.add({ targets: c.img, x: { from: c.x - 2, to: c.x + 2 }, duration: 50, yoyo: true, repeat: 4 });
    scene.time.delayedCall(480, () => {
      c.state = 'gone';
      c.zone.body.enable = false;
      scene.tweens.add({ targets: c.img, y: c.y + 90, alpha: 0, angle: 8, duration: 450, ease: 'Quad.In' });
    });
    scene.time.delayedCall(3200, () => {
      c.zone.body.enable = true;
      c.img.setPosition(c.x, c.y).setAngle(0);
      scene.tweens.add({ targets: c.img, alpha: 1, duration: 300, onComplete: () => { c.state = 'idle'; } });
    });
    return true;
  }

  /** Movers heen en weer laten bewegen, met een korte pauze aan elk uiteinde. */
  updateMovers(dt = 1 / 60) {
    if (this.scene.physics.world.isPaused) return;
    for (const m of this.movers) {
      const d = m.getData('mover');
      if (d.wait > 0) {
        d.wait -= dt;
        m.body.setVelocity(0, 0);
        continue;
      }
      const px = m.x - d.from.x;
      const py = m.y - d.from.y;
      const along = px * d.dirX + py * d.dirY;
      if ((d.sign > 0 && along >= d.len) || (d.sign < 0 && along <= 0)) {
        d.sign = -d.sign;
        d.wait = d.pause;
        m.body.setVelocity(0, 0);
        continue;
      }
      m.body.setVelocity(d.dirX * d.speed * d.sign, d.dirY * d.speed * d.sign);
    }
  }
}
