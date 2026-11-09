import Phaser from 'phaser';
import { VIEW } from '../config/gameConfig.js';
import { panelKey } from '../assets/uiArt.js';
import Button, { FocusGroup } from '../ui/Button.js';
import { makeText, makePrompt, formatTime } from '../ui/text.js';
import { AudioManager } from '../systems/AudioManager.js';
import { Storage } from '../systems/storage.js';
import { getLevel, nextLevel } from '../levels/index.js';

export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  init(data) {
    this.summary = data.summary;
    this.levelId = data.levelId;
    this.bankId = data.bankId;
    this.levelName = data.levelName;
    this.character = data.character ?? 'piet';
  }

  create() {
    const { width: W, height: H } = VIEW;
    const s = this.summary;
    const level = getLevel(this.levelId);
    const next = nextLevel(this.levelId);
    const nextWasLocked = next && !Storage.getBest(level.id);
    const isRecord = Storage.submitResult(this.levelId, { stars: s.stars, points: s.points });

    this.add.image(0, 0, 'sky').setOrigin(0);
    this.add.image(1100, 120, 'moon').setScale(0.8);
    this.add.tileSprite(0, H - 300 - 60, W, 300, 'far_town').setOrigin(0);
    this.add.tileSprite(0, H - 380 + 70, W, 380, 'mid_town').setOrigin(0).setAlpha(0.9);
    this.add.tileSprite(0, H - 200, W, 200, 'alley_fog').setOrigin(0);

    // titel
    const ribbon = this.add.image(W / 2, 78, 'logo_ribbon').setScale(0.78, 0.72);
    const title = makeText(this, W / 2, 68, 'Bezorging voltooid!', { size: 54, weight: '700', color: '#ffffff', stroke: '#5a1010', strokeThickness: 8 }).setAngle(-2.5);
    const sub = makeText(this, W / 2, 138, `Level ${level.number} · ${level.name}`, { size: 22, weight: '600', color: '#ffd66b', stroke: '#0b1433', strokeThickness: 5 });
    [ribbon, title, sub].forEach((o) => {
      o.setAlpha(0).y -= 30;
      this.tweens.add({ targets: o, alpha: 1, y: o.y + 30, duration: 450, ease: 'Back.Out' });
    });

    // het gekozen personage juicht
    const hero = this.add.image(185, H - 120, `${this.character}_big_cheer`).setOrigin(0.5, 1).setScale(0.78);
    this.tweens.add({ targets: hero, y: H - 136, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // nieuw level vrijgespeeld?
    if (nextWasLocked) {
      const c = this.add.container(185, 200).setAlpha(0);
      c.add(this.add.image(0, 0, panelKey(this, 250, 70, 'cream')));
      c.add(makeText(this, 0, -12, 'Nieuw level open!', { size: 22, weight: '700', color: '#7a1d1d' }));
      c.add(makeText(this, 0, 14, `Level ${next.number}: ${next.name}`, { size: 17, weight: '600', color: '#3a2205' }));
      this.tweens.add({ targets: c, alpha: 1, y: 214, duration: 500, delay: 1600, ease: 'Back.Out', onStart: () => AudioManager.play('checkpoint') });
    }

    // paneel met resultaten
    const px = W / 2 + 40;
    const panel = this.add.container(px, 392);
    panel.add(this.add.image(0, 0, panelKey(this, 640, 470)));

    // sterren
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const sx = (i - 1) * 104;
      const sy = i === 1 ? -170 : -156;
      panel.add(this.add.image(sx, sy, 'star_empty').setScale(i === 1 ? 1.05 : 0.92));
      const st = this.add.image(sx, sy, 'star_full').setScale(0).setAngle(-30);
      panel.add(st);
      stars.push({ st, target: i === 1 ? 1.05 : 0.92 });
    }
    stars.slice(0, s.stars).forEach(({ st, target }, i) => {
      this.tweens.add({
        targets: st, scale: target, angle: 0, duration: 420, delay: 600 + i * 380, ease: 'Back.Out',
        onStart: () => AudioManager.play('star'),
      });
    });
    const starText = ['Blijf oefenen, je kunt het!', 'Goed bezig!', 'Heel goed gedaan!', 'Fantastisch! Alles direct goed!'][s.stars];
    panel.add(makeText(this, 0, -96, starText, { size: 24, weight: '700', color: '#f2b632' }));

    const rows = [
      ['Bezorgde cadeautjes', `${s.delivered} / ${s.totalTasks}`],
      ['Direct goed beantwoord', `${s.firstTryCorrect} / ${s.totalTasks}`],
      ['Fouten', `${s.wrongAnswers}`],
      ['Pepernoten', `${s.pepernoten} / ${s.pepernotenTotal}`],
      ['Speeltijd', formatTime(s.timeMs)],
      ['Punten', `${s.points}`],
    ];
    rows.forEach(([label, value], i) => {
      const y = -52 + i * 38;
      if (i % 2 === 0) panel.add(this.add.rectangle(0, y, 540, 34, 0xffffff, 0.05));
      panel.add(makeText(this, -250, y, label, { size: 22, weight: '500', color: '#dfe4ff', origin: [0, 0.5] }));
      const v = makeText(this, 250, y, value, { size: 24, weight: '700', color: i === 5 ? '#ffd66b' : '#ffffff', origin: [1, 0.5] });
      panel.add(v);
    });
    if (isRecord && s.stars > 0) {
      const badge = makeText(this, 200, -200, 'Nieuw record!', { size: 20, weight: '700', color: '#3a1d05' });
      const bg = this.add.image(200, -200, panelKey(this, 170, 44, 'cream'));
      panel.add([bg, badge]);
      this.tweens.add({ targets: [bg, badge], angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    panel.setAlpha(0).setScale(0.92);
    this.tweens.add({ targets: panel, alpha: 1, scale: 1, duration: 400, delay: 200, ease: 'Back.Out' });

    // knoppen
    const by = H - 46;
    const go = (levelId) => this.scene.start('Game', { bankId: this.bankId, levelId, character: this.character });
    const specs = [
      { label: 'Opnieuw', width: 190, variant: 'red', onClick: () => go(this.levelId) },
      next && { label: 'Volgende level', width: 236, variant: 'green', onClick: () => go(next.id), focus: true },
      { label: 'Levelkaart', width: 190, variant: 'navy', onClick: () => this.scene.start('Levels', { character: this.character, bankId: this.bankId, levelId: next?.id ?? this.levelId }) },
      s.mistakes.length && { label: `Fouten (${s.mistakes.length})`, width: 170, variant: 'gold', onClick: () => this.openMistakes() },
    ].filter(Boolean);
    // knoppen naast elkaar, gecentreerd onder het paneel
    const gap = 14;
    const total = specs.reduce((sum, b) => sum + b.width, 0) + gap * (specs.length - 1);
    let bx = px - total / 2;
    const buttons = specs.map((b) => {
      const btn = new Button(this, bx + b.width / 2, by, b.label, { width: b.width, height: 58, variant: b.variant, size: 22, onClick: b.onClick });
      bx += b.width + gap;
      return btn;
    });
    this.focus = new FocusGroup(this, buttons, { horizontal: true });
    const focusIndex = specs.findIndex((b) => b.focus);
    if (focusIndex > 0) this.focus.focus(focusIndex, false);
    this.input.keyboard.on('keydown-ESC', () => this.closeMistakes());
    this.cameras.main.fadeIn(400, 7, 13, 36);
    AudioManager.playMusic('results');
  }

  openMistakes() {
    if (this.modal) return;
    const { width: W, height: H } = VIEW;
    const list = this.summary.mistakes;
    this.focus.active = false;
    const shade = this.add.rectangle(0, 0, W, H, 0x050a1e, 0.7).setOrigin(0).setInteractive().setDepth(100);
    const rowH = list.length > 5 ? 58 : 76;
    const ph = 190 + list.length * rowH;
    const c = this.add.container(W / 2, H / 2).setDepth(101);
    c.add(this.add.image(0, 0, panelKey(this, 1020, ph)));
    c.add(makeText(this, 0, -ph / 2 + 44, 'Terugkijken: deze waren lastig', { size: 32, weight: '700', color: '#f2b632' }));
    const top = -ph / 2 + 104;
    list.forEach((m, i) => {
      const y = top + i * rowH;
      c.add(this.add.rectangle(0, y, 940, rowH - 8, 0xffffff, 0.06));
      const prompt = makePrompt(this, m.prompt, -380, y, { size: 30, color: '#ffffff' });
      c.add(prompt);
      c.add(makeText(this, -270, y - 13, `Jouw eerste antwoord: ${m.given}`, { size: 18, weight: '500', color: '#ffb3a8', origin: [0, 0.5] }));
      c.add(makeText(this, -270, y + 13, `Goed antwoord: ${m.correct}`, { size: 21, weight: '700', color: '#9ff0b0', origin: [0, 0.5] }));
      if (m.explanation) {
        c.add(makeText(this, 0, y, m.explanation, { size: 19, weight: '500', color: '#fff3d6', origin: [0, 0.5], wrap: 380, align: 'left' }));
      }
      c.add(this.add.image(430, y, 'check_badge').setScale(0.6));
    });
    const close = new Button(this, 0, ph / 2 - 48, 'Terug', { width: 200, height: 54, variant: 'red', size: 24, onClick: () => this.closeMistakes() });
    c.add(close);
    this.modalFocus = new FocusGroup(this, [close]);
    c.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    this.modal = { shade, c };
  }

  closeMistakes() {
    if (!this.modal) return;
    this.modalFocus.destroy();
    this.modal.shade.destroy();
    this.modal.c.destroy();
    this.modal = null;
    this.time.delayedCall(50, () => { this.focus.active = true; });
  }
}
