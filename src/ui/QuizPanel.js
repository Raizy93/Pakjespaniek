import Phaser from 'phaser';
import { bubbleKey } from '../assets/uiArt.js';
import { makeText, makePrompt } from './text.js';
import { VIEW } from '../config/gameConfig.js';
import { AudioManager } from '../systems/AudioManager.js';

const GIFT_COLORS = ['blue', 'red', 'purple'];
const DEPTH = 1000;

/**
 * De opdracht boven de schoorsteen: tekstballon + drie antwoordcadeautjes.
 * Staat in schermcoördinaten (scrollFactor 0); de camera staat stil tijdens de opdracht.
 */
export default class QuizPanel {
  constructor(scene, { bank, question, anchorX, onAnswer }) {
    this.scene = scene;
    this.question = question;
    this.onAnswer = onAnswer;
    this.locked = false;
    this.selected = 1;
    this.disabled = new Set();
    this.objects = [];

    const cx = Phaser.Math.Clamp(anchorX, 300, VIEW.width - 300);
    this.cx = cx;

    // lichte verduistering zodat de opdracht opvalt, maar de wereld zichtbaar blijft
    this.dim = this.track(scene.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(VIEW.width, VIEW.height).setScrollFactor(0).setDepth(DEPTH - 1).setAlpha(0));
    scene.tweens.add({ targets: this.dim, alpha: 0.75, duration: 250 });

    // tekstballon
    const bw = 470;
    const bh = 150;
    this.bubble = this.track(scene.add.container(cx, 18).setScrollFactor(0).setDepth(DEPTH));
    const bImg = scene.add.image(0, 0, bubbleKey(scene, bw, bh)).setOrigin(0.5, 0);
    const instr = makeText(scene, 0, 26, bank.instruction ?? 'Kies het juiste cadeau', { size: 20, color: '#5a4a7a', weight: '600' });
    const prompt = makePrompt(scene, question.prompt, 0, 88, { size: 56, color: '#1b2552' });
    this.bubble.add([bImg, instr, prompt]);
    this.bubble.setScale(0.6).setAlpha(0);
    scene.tweens.add({ targets: this.bubble, scale: 1, alpha: 1, duration: 300, ease: 'Back.Out' });

    // feedbackregel (verschijnt bij een fout antwoord)
    this.feedback = this.track(makeText(scene, cx, 196, '', {
      size: 22, color: '#ffffff', weight: '700', stroke: '#7a1d1d', strokeThickness: 5,
    }).setScrollFactor(0).setDepth(DEPTH).setAlpha(0));

    // cadeautjes
    const spacing = 182;
    const gy = 292;
    this.gifts = question.answers.map((answer, i) => {
      const x = cx + (i - 1) * spacing;
      const c = scene.add.container(x, gy + 40).setScrollFactor(0).setDepth(DEPTH).setAlpha(0);
      const ring = scene.add.image(0, 6, 'glow').setTint(0xffd66b).setScale(1.9).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      const img = scene.add.image(0, 0, `gift_${GIFT_COLORS[i]}`).setScale(0.9);
      const label = makeText(scene, 1, 18, answer, {
        size: answer.length > 4 ? 30 : 36, color: '#ffffff', weight: '700', stroke: '#0b1433', strokeThickness: 5,
      });
      const key = scene.add.image(-50, -42, 'keycap').setScale(0.62);
      const keyText = makeText(scene, -50, -45, String(i + 1), { size: 22, color: '#1b2552', weight: '700' });
      c.add([ring, img, label, key, keyText]);
      c.setSize(120, 124);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerover', () => this.select(i));
      c.on('pointerup', () => this.choose(i));
      scene.tweens.add({ targets: c, y: gy, alpha: 1, duration: 320, delay: 120 + i * 90, ease: 'Back.Out' });
      const gift = { c, ring, img, label, x, y: gy, answer, index: i };
      gift.bob = scene.tweens.add({ targets: img, y: -5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 200 });
      this.objects.push(c);
      return gift;
    });

    // bedieningshint onderaan, uit de buurt van Piet en de schoorsteen
    this.hint = this.track(scene.add.container(VIEW.width / 2, VIEW.height - 34).setScrollFactor(0).setDepth(DEPTH).setAlpha(0));
    const hintText = makeText(scene, 0, 0, 'Kies met  1  2  3   ·   of  ← →  en  Enter   ·   of klik op een cadeau', {
      size: 19, color: '#fff3d6', weight: '600',
    });
    const hintBg = scene.add.rectangle(0, 0, hintText.width + 44, 40, 0x0b1433, 0.82).setStrokeStyle(2, 0xf2b632, 0.7);
    this.hint.add([hintBg, hintText]);
    scene.tweens.add({ targets: this.hint, alpha: 1, duration: 400, delay: 400 });

    this.select(1, false);

    this.keyHandler = (e) => this.onKey(e);
    scene.input.keyboard.on('keydown', this.keyHandler);
  }

  track(o) {
    this.objects.push(o);
    return o;
  }

  onKey(e) {
    if (this.locked) return;
    const map = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };
    if (e.code in map) this.choose(map[e.code]);
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveSelection(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveSelection(1);
    else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') this.choose(this.selected);
  }

  moveSelection(dir) {
    let i = this.selected;
    for (let n = 0; n < 3; n++) {
      i = (i + dir + 3) % 3;
      if (!this.disabled.has(i)) break;
    }
    this.select(i);
  }

  select(i, sound = true) {
    if (this.locked || this.disabled.has(i)) return;
    if (sound && i !== this.selected) AudioManager.play('select');
    this.selected = i;
    this.gifts.forEach((g, gi) => {
      const on = gi === i;
      this.scene.tweens.add({ targets: g.ring, alpha: on ? 0.55 : 0, duration: 150 });
      this.scene.tweens.add({ targets: g.c, scale: on ? 1.08 : 1, duration: 160, ease: 'Back.Out' });
    });
  }

  choose(i) {
    if (this.locked || this.disabled.has(i)) return;
    this.select(i, false);
    this.onAnswer(i);
  }

  /** Fout antwoord: cadeau schudt, wordt grijs en kan niet opnieuw gekozen worden. */
  markWrong(i) {
    const g = this.gifts[i];
    this.disabled.add(i);
    this.scene.tweens.add({ targets: g.c, x: { from: g.x - 12, to: g.x }, duration: 360, ease: 'Elastic.Out', easeParams: [1.2, 0.3] });
    g.img.setTint(0x6a6f8f);
    g.label.setAlpha(0.45);
    g.ring.setAlpha(0);
    g.c.setScale(0.92);
    g.c.disableInteractive();
    const cross = this.scene.add.image(36, -38, 'cross_badge').setScale(0);
    g.c.add(cross);
    this.scene.tweens.add({ targets: cross, scale: 0.75, duration: 300, ease: 'Back.Out' });

    const lines = ['Nog niet goed. Probeer het nog eens!', 'Bijna! Kijk nog eens goed.', 'Denk rustig na en kies opnieuw.'];
    this.feedback.setText(lines[(this.disabled.size - 1) % lines.length]);
    this.scene.tweens.killTweensOf(this.feedback);
    this.feedback.setAlpha(1).setScale(0.8);
    this.scene.tweens.add({ targets: this.feedback, scale: 1, duration: 260, ease: 'Back.Out' });

    // selectie naar een ander, nog beschikbaar cadeau
    if (this.disabled.has(this.selected)) this.moveSelection(1);
  }

  /** Goed antwoord: andere cadeaus verdwijnen, het gekozen cadeau vliegt naar de schoorsteen. */
  playCorrect(i, target, onArrive) {
    this.locked = true;
    const g = this.gifts[i];
    g.bob?.stop();
    this.feedback.setText('Goed zo!').setStroke('#1d6b2f', 5).setAlpha(1);
    this.gifts.forEach((o, oi) => {
      if (oi !== i) this.scene.tweens.add({ targets: o.c, alpha: 0, scale: 0.7, duration: 250 });
    });
    g.label.setAlpha(1);
    this.scene.tweens.add({ targets: g.ring, alpha: 0.9, duration: 120 });
    this.scene.tweens.add({ targets: [this.hint], alpha: 0, duration: 200 });

    // korte "pop", daarna een boog naar de schoorsteen
    this.scene.tweens.add({
      targets: g.c, scale: 1.18, duration: 160, ease: 'Back.Out',
      onComplete: () => {
        const sx = g.c.x;
        const sy = g.c.y;
        const ctrl = { x: (sx + target.x) / 2, y: Math.min(sy, target.y) - 120 };
        const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(sx, sy), new Phaser.Math.Vector2(ctrl.x, ctrl.y), new Phaser.Math.Vector2(target.x, target.y));
        const tmp = new Phaser.Math.Vector2();
        this.scene.tweens.addCounter({
          from: 0, to: 1, duration: 520, ease: 'Sine.In', delay: 160,
          onUpdate: (tw) => {
            const t = tw.getValue();
            curve.getPoint(t, tmp);
            g.c.setPosition(tmp.x, tmp.y);
            g.c.setScale(1.18 - 0.9 * t);
            g.c.setAngle(t * 25);
          },
          onComplete: () => {
            g.c.setVisible(false);
            onArrive?.();
          },
        });
      },
    });
  }

  close() {
    this.scene.input.keyboard.off('keydown', this.keyHandler);
    this.scene.tweens.add({
      targets: this.objects.filter((o) => o.visible !== false),
      alpha: 0, duration: 260,
      onComplete: () => this.objects.forEach((o) => o.destroy()),
    });
  }
}
