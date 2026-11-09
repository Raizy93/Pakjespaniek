import Phaser from 'phaser';
import { VIEW } from '../config/gameConfig.js';
import { CHAR_FRAME } from '../assets/characterRig.js';
import { panelKey } from '../assets/uiArt.js';
import Button from '../ui/Button.js';
import { makeText } from '../ui/text.js';
import { AudioManager } from '../systems/AudioManager.js';
import { Storage, levelProgress, totalStars } from '../systems/storage.js';
import { LEVELS } from '../levels/index.js';
import { getCharacter } from '../characters/registry.js';
import { DEFAULT_BANK_ID } from '../education/registry.js';

/**
 * Levelkaart: kies een level op een pad over de daken.
 * Een level gaat open zodra het vorige is uitgespeeld; sterren tonen de beste score.
 * Bediening: ← → kiezen, Enter spelen, Esc terug (of met de muis).
 */
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('Levels');
  }

  init(data = {}) {
    this.characterId = getCharacter(data.character ?? Storage.settings.character).id;
    this.bankId = data.bankId ?? DEFAULT_BANK_ID;
    this.preferLevel = data.levelId ?? null;
    this.starting = false;
  }

  create() {
    const { width: W, height: H } = VIEW;
    this.progress = levelProgress(LEVELS);

    // achtergrond
    this.add.image(0, 0, 'sky').setOrigin(0);
    this.add.image(150, 110, 'moon').setScale(0.75);
    this.far = this.add.tileSprite(0, H - 300 - 60, W, 300, 'far_town').setOrigin(0);
    this.mid = this.add.tileSprite(0, H - 380 + 60, W, 380, 'mid_town').setOrigin(0).setAlpha(0.95);
    this.add.tileSprite(0, H - 200, W, 200, 'alley_fog').setOrigin(0);
    this.scroll = 0;

    // titel + totaal aantal sterren
    this.add.image(W / 2, 70, 'logo_ribbon').setScale(0.6, 0.55);
    makeText(this, W / 2, 62, 'Kies een level', { size: 46, weight: '700', color: '#ffffff', stroke: '#5a1010', strokeThickness: 7 }).setAngle(-2);
    const max = LEVELS.length * 3;
    this.add.image(W - 220, 52, 'hud_pill').setScale(0.9, 0.9);
    this.add.image(W - 280, 52, 'star_full').setScale(0.42);
    makeText(this, W - 200, 52, `${totalStars(LEVELS)} / ${max}`, { size: 28, weight: '700' });

    // pad met levelbordjes
    const n = LEVELS.length;
    const x0 = n === 1 ? W / 2 : 260;
    const x1 = n === 1 ? W / 2 : W - 260;
    this.nodePos = this.progress.map((_, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      // licht golvend pad; laag genoeg boven het infopaneel (naam + sterren onder het bordje)
      return { x: x0 + (x1 - x0) * t, y: 268 + Math.sin(t * Math.PI * 1.3 + 0.4) * 24 };
    });
    this.drawPath();
    this.nodes = this.progress.map((p, i) => this.makeNode(p, i));

    // het gekozen personage loopt over het pad
    this.hero = this.add.sprite(0, 0, this.characterId, 'idle_0').setOrigin(0.5, CHAR_FRAME.foot / CHAR_FRAME.h).setScale(0.9).setDepth(20);
    this.hero.play(`${this.characterId}-idle`);

    // infopaneel
    this.info = this.add.container(W / 2, 560);
    this.info.add(this.add.image(0, 0, panelKey(this, 720, 190)));
    this.infoTitle = makeText(this, -320, -62, '', { size: 32, weight: '700', color: '#f2b632', origin: [0, 0.5] });
    this.infoTag = makeText(this, -320, -26, '', { size: 20, weight: '500', color: '#dfe4ff', origin: [0, 0.5] });
    // leerlijn: wat er in dit level geoefend wordt
    this.infoLearn = makeText(this, -320, 8, '', { size: 19, weight: '600', color: '#9ff0b0', origin: [0, 0.5], wrap: 420, align: 'left' });
    this.infoStars = [0, 1, 2].map((k) => this.add.image(-300 + k * 44, 54, 'star_empty').setScale(0.4));
    this.infoBest = makeText(this, -160, 54, '', { size: 18, weight: '600', color: '#aab4e0', origin: [0, 0.5] });
    this.playBtn = new Button(this, 210, 0, 'Spelen', { width: 220, height: 70, variant: 'red', size: 34, onClick: () => this.play() });
    this.info.add([this.infoTitle, this.infoTag, this.infoLearn, this.infoBest, ...this.infoStars, this.playBtn]);

    this.backBtn = new Button(this, 110, H - 44, 'Terug', { width: 170, height: 52, variant: 'navy', size: 22, onClick: () => this.back() });

    // startselectie: gevraagd level, anders het eerste open level dat nog niet is uitgespeeld
    let start = this.progress.findIndex((p) => p.level.id === this.preferLevel && p.unlocked);
    if (start < 0) start = this.progress.findIndex((p) => p.unlocked && !p.best);
    if (start < 0) start = this.progress.length - 1;
    this.select(start, false, true);

    // toetsenbord
    this.input.keyboard.on('keydown', (e) => {
      AudioManager.unlock();
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.select(this.selected + 1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.select(this.selected - 1);
      else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') this.play();
      else if (e.code === 'Escape') this.back();
    });
    this.input.on('pointerdown', () => AudioManager.unlock());
    this.cameras.main.fadeIn(300, 7, 13, 36);
    AudioManager.playMusic('menu');
  }

  drawPath() {
    const g = this.add.graphics();
    const pts = this.nodePos;
    // gestippeld pad van bordje naar bordje; goud tot het laatste open level
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const open = this.progress[i + 1].unlocked;
      const steps = Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 22);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 30;
        g.fillStyle(open ? 0xf2b632 : 0x5b6190, open ? 0.85 : 0.5);
        g.fillCircle(x, y, open ? 5 : 4);
      }
    }
  }

  makeNode(p, i) {
    const { x, y } = this.nodePos[i];
    const c = this.add.container(x, y).setDepth(10);
    const glow = this.add.image(0, 0, 'glow').setTint(0xffd66b).setScale(2.1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    const badge = this.add.image(0, 0, p.unlocked ? 'node_open' : 'node_locked');
    c.add([glow, badge]);
    if (p.unlocked) {
      c.add(makeText(this, 0, -6, String(p.level.number), { size: 46, weight: '700', color: '#ffffff', stroke: '#5a1010', strokeThickness: 6 }));
    } else {
      c.add(this.add.image(0, -4, 'lock_icon'));
    }
    c.add(makeText(this, 0, 90, p.level.name, { size: 22, weight: '700', color: p.unlocked ? '#fff3d6' : '#8f99d0', stroke: '#0b1433', strokeThickness: 5 }));
    for (let k = 0; k < 3; k++) {
      const full = p.best && k < p.best.stars;
      c.add(this.add.image(-36 + k * 36, 124, full ? 'star_full' : 'star_empty').setScale(0.33).setAlpha(p.unlocked ? 1 : 0.4));
    }
    c.setSize(130, 130);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerup', () => {
      if (this.selected === i) this.play();
      else this.select(i);
    });
    c.glow = glow;
    return c;
  }

  select(i, sound = true, instant = false) {
    if (i < 0 || i >= this.nodes.length) return;
    const changed = i !== this.selected;
    this.selected = i;
    const p = this.progress[i];
    this.nodes.forEach((n, k) => {
      this.tweens.killTweensOf(n.glow);
      n.glow.setAlpha(k === i ? 0.55 : 0);
      if (k === i) this.tweens.add({ targets: n.glow, alpha: 0.25, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: n, scale: k === i ? 1.08 : 1, duration: 160, ease: 'Back.Out' });
    });
    if (sound && changed) AudioManager.play('click');

    // personage rent naar het bordje
    const { x, y } = this.nodePos[i];
    const tx = x;
    const ty = y - 58;
    this.tweens.killTweensOf(this.hero);
    if (instant) {
      this.hero.setPosition(tx, ty);
    } else if (changed) {
      this.hero.setFlipX(tx < this.hero.x);
      this.hero.play(`${this.characterId}-run`, true);
      this.tweens.add({
        targets: this.hero, x: tx, y: ty, duration: 520, ease: 'Sine.InOut',
        onComplete: () => this.hero.play(`${this.characterId}-idle`),
      });
    }

    // infopaneel
    this.infoTitle.setText(`Level ${p.level.number} · ${p.level.name}`);
    this.infoTag.setText(p.unlocked ? p.level.tagline ?? '' : `Speel eerst level ${p.level.number - 1} uit om dit level te openen.`);
    this.infoLearn.setText(p.level.learning?.title ? `Rekenen: ${p.level.learning.title}` : '');
    this.infoBest.setText(p.best ? `Beste: ${p.best.points} punten` : p.unlocked ? 'Nog niet gespeeld' : 'Op slot');
    this.infoStars.forEach((s, k) => s.setTexture(p.best && k < p.best.stars ? 'star_full' : 'star_empty').setAlpha(p.unlocked ? 1 : 0.4));
    this.playBtn.enabled = p.unlocked;
    this.playBtn.setAlpha(p.unlocked ? 1 : 0.45);
    this.playBtn.setFocus(p.unlocked);
  }

  play() {
    const p = this.progress[this.selected];
    if (this.starting) return;
    if (!p.unlocked) {
      AudioManager.play('blocked');
      this.tweens.add({ targets: this.nodes[this.selected], x: { from: this.nodePos[this.selected].x - 8, to: this.nodePos[this.selected].x }, duration: 300, ease: 'Elastic.Out' });
      return;
    }
    this.starting = true;
    AudioManager.play('click');
    this.hero.play(`${this.characterId}-celebrate`);
    this.cameras.main.fadeOut(350, 7, 13, 36);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', { levelId: p.level.id, character: this.characterId, bankId: this.bankId });
    });
  }

  back() {
    if (this.starting) return;
    AudioManager.play('click');
    this.scene.start('Menu');
  }

  update(time, delta) {
    this.scroll += delta * 0.015;
    this.far.tilePositionX = this.scroll * 0.4;
    this.mid.tilePositionX = this.scroll;
  }
}
