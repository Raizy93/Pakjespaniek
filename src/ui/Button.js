import Phaser from 'phaser';
import { buttonKeys } from '../assets/uiArt.js';
import { makeText } from './text.js';
import { AudioManager } from '../systems/AudioManager.js';

/**
 * Low-poly knop met hover-, druk- en focustoestand.
 * Werkt met muis én toetsenbord (via FocusGroup).
 */
export default class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, label, { width = 300, height = 64, variant = 'red', size = 28, icon = null, onClick = () => {} } = {}) {
    super(scene, x, y);
    this.btnW = width;
    this.btnH = height;
    this.keys = buttonKeys(scene, width, height, variant);
    this.onClick = onClick;
    this.enabled = true;

    this.ring = scene.add.image(0, 2, 'glow').setDisplaySize(width + 70, height + 60).setTint(0xffd66b).setAlpha(0);
    this.bg = scene.add.image(0, 0, this.keys.normal);
    this.label = makeText(scene, icon ? 18 : 0, -3, label, {
      size, color: variant === 'gold' ? '#3a2205' : '#ffffff', weight: '700',
      stroke: variant === 'gold' ? null : 'rgba(40,10,30,0.55)', strokeThickness: 3,
    });
    this.add([this.ring, this.bg, this.label]);
    if (icon) {
      this.icon = scene.add.image(-this.label.width / 2 - 8, -3, icon).setDisplaySize(height * 0.55, height * 0.55);
      this.add(this.icon);
    }
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.hover(true));
    this.on('pointerout', () => {
      this.hover(false);
      this.bg.setTexture(this.keys.normal);
      this.label.y = -3;
    });
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      this.bg.setTexture(this.keys.down);
      this.label.y = 1;
    });
    this.on('pointerup', () => {
      if (!this.enabled) return;
      this.bg.setTexture(this.keys.hover);
      this.label.y = -3;
      this.press();
    });
    scene.add.existing(this);
  }

  hover(on) {
    if (!this.enabled) return;
    this.bg.setTexture(on ? this.keys.hover : this.keys.normal);
    this.scene.tweens.add({ targets: this, scale: on ? 1.04 : 1, duration: 120, ease: 'Back.Out' });
  }

  setFocus(on) {
    this.focused = on;
    this.scene.tweens.killTweensOf(this.ring);
    if (on) {
      this.ring.setAlpha(0.55);
      this.scene.tweens.add({ targets: this.ring, alpha: 0.25, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else this.ring.setAlpha(0);
    this.hover(on);
  }

  setLabel(text) {
    this.label.setText(text);
  }

  setVariant(variant) {
    this.keys = buttonKeys(this.scene, this.btnW, this.btnH, variant);
    this.bg.setTexture(this.focused ? this.keys.hover : this.keys.normal);
  }

  press() {
    if (!this.enabled) return;
    AudioManager.unlock();
    AudioManager.play('click');
    this.scene.tweens.add({ targets: this, scale: { from: 0.94, to: this.focused ? 1.04 : 1 }, duration: 160, ease: 'Back.Out' });
    this.onClick();
  }
}

/** Toetsenbordnavigatie over een lijst knoppen (↑ ↓ ← → / W S, Enter/Spatie). */
export class FocusGroup {
  constructor(scene, buttons = [], { horizontal = false } = {}) {
    this.scene = scene;
    this.buttons = buttons;
    this.index = 0;
    this.active = true;
    this.horizontal = horizontal;
    this.handler = (e) => this.onKey(e);
    scene.input.keyboard.on('keydown', this.handler);
    scene.events.once('shutdown', () => this.destroy());
    buttons.forEach((b, i) => b.on('pointerover', () => this.focus(i, false)));
    if (buttons.length) this.focus(0, false);
  }

  setButtons(buttons) {
    this.buttons.forEach((b) => b.setFocus?.(false));
    this.buttons = buttons;
    buttons.forEach((b, i) => b.on('pointerover', () => this.focus(i, false)));
    this.index = 0;
    if (buttons.length) this.focus(0, false);
  }

  focus(i, sound = true) {
    if (!this.buttons.length) return;
    this.buttons[this.index]?.setFocus(false);
    this.index = (i + this.buttons.length) % this.buttons.length;
    this.buttons[this.index].setFocus(true);
    if (sound) AudioManager.play('select');
  }

  onKey(e) {
    if (!this.active || !this.buttons.length) return;
    const k = e.code;
    const next = this.horizontal ? ['ArrowRight', 'KeyD'] : ['ArrowDown', 'KeyS'];
    const prev = this.horizontal ? ['ArrowLeft', 'KeyA'] : ['ArrowUp', 'KeyW'];
    if (next.includes(k)) this.focus(this.index + 1);
    else if (prev.includes(k)) this.focus(this.index - 1);
    else if (k === 'Enter' || k === 'Space' || k === 'NumpadEnter') {
      AudioManager.unlock();
      this.buttons[this.index].press();
    }
  }

  destroy() {
    this.scene.input.keyboard?.off('keydown', this.handler);
  }
}
