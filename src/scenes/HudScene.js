import Phaser from 'phaser';
import { VIEW } from '../config/gameConfig.js';
import { bus, EV } from '../systems/events.js';
import { makeText } from '../ui/text.js';

// HUD: pepernoten (links), schoorstenen (midden), pauzeknop (rechts).
// Reageert alleen op events; leest de spelstatus niet elk frame uit.
export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    const W = VIEW.width;

    // links: pepernoten
    this.add.image(28, 22, 'hud_pill').setOrigin(0).setScale(0.82, 0.95);
    this.pepIcon = this.add.image(62, 52, 'pepernoot').setScale(1.15);
    this.pepText = makeText(this, 88, 50, '× 0', { size: 28, weight: '700', origin: [0, 0.5], color: '#fff3d6' });

    // midden: schoorstenen
    this.centerPill = this.add.image(W / 2, 22, 'hud_pill').setOrigin(0.5, 0).setScale(0.95, 0.95);
    this.giftIcon = this.add.image(W / 2 - 48, 50, 'icon_gift').setScale(0.95);
    this.delText = makeText(this, W / 2 + 16, 50, '0 / 8', { size: 30, weight: '700', color: '#ffffff' });

    // rechts: pauze
    this.pauseBtn = this.add.image(W - 56, 54, 'btn_pause').setInteractive({ useHandCursor: true });
    this.pauseBtn.on('pointerover', () => this.tweens.add({ targets: this.pauseBtn, scale: 1.08, duration: 120 }));
    this.pauseBtn.on('pointerout', () => this.tweens.add({ targets: this.pauseBtn, scale: 1, duration: 120 }));
    this.pauseBtn.on('pointerup', () => bus.emit(EV.PAUSE_REQUEST));
    makeText(this, W - 56, 98, 'Esc', { size: 15, weight: '600', color: '#aab4e0' });

    this.toast = makeText(this, W / 2, 112, '', { size: 24, weight: '700', color: '#fff3d6', stroke: '#0b1433', strokeThickness: 6 }).setAlpha(0);

    const onPep = (n, total) => {
      this.pepText.setText(`× ${n}`);
      if (n > 0) this.pop(this.pepIcon, 1.15);
    };
    const onDel = (n, total) => {
      this.delText.setText(`${n} / ${total}`);
      if (n > 0) {
        this.pop(this.giftIcon, 0.95);
        this.pop(this.delText, 1);
      }
    };
    const onToast = (text) => this.showToast(text);
    // tijdens een opdracht maakt de middelste teller plaats voor de tekstballon
    const onQuiz = (active) => {
      if (active) {
        this.tweens.killTweensOf(this.toast);
        this.toast.setAlpha(0);
      }
      this.tweens.add({ targets: [this.centerPill, this.giftIcon, this.delText], alpha: active ? 0 : 1, duration: 200 });
    };
    bus.on(EV.PEPERNOTEN, onPep);
    bus.on(EV.DELIVERED, onDel);
    bus.on(EV.TOAST, onToast);
    bus.on(EV.QUIZ_STATE, onQuiz);
    this.events.once('shutdown', () => {
      bus.off(EV.PEPERNOTEN, onPep);
      bus.off(EV.DELIVERED, onDel);
      bus.off(EV.TOAST, onToast);
      bus.off(EV.QUIZ_STATE, onQuiz);
    });
  }

  pop(obj, base) {
    this.tweens.killTweensOf(obj);
    obj.setScale(base * 1.35);
    this.tweens.add({ targets: obj, scale: base, duration: 260, ease: 'Back.Out' });
  }

  showToast(text) {
    this.tweens.killTweensOf(this.toast);
    this.toast.setText(text).setAlpha(0).setY(124);
    this.tweens.add({ targets: this.toast, alpha: 1, y: 116, duration: 220, ease: 'Quad.Out' });
    this.tweens.add({ targets: this.toast, alpha: 0, duration: 400, delay: 1900 });
  }
}
