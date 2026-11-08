import Phaser from 'phaser';
import { panelKey } from '../assets/uiArt.js';
import { CHAR_FRAME } from '../assets/characterRig.js';
import { makeText } from './text.js';
import { AudioManager } from '../systems/AudioManager.js';

/**
 * Kaart in het personagekeuzescherm. Werkt met muis en met FocusGroup
 * (zelfde interface als Button: setFocus / press).
 */
export default class CharacterCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, character, { width = 290, height = 370, onClick = () => {} } = {}) {
    super(scene, x, y);
    this.onClick = onClick;
    this.ring = scene.add.image(0, 0, 'glow').setDisplaySize(width + 120, height + 120).setTint(0xffd66b).setAlpha(0);
    this.bg = scene.add.image(0, 0, panelKey(scene, width, height));
    // portret staat op een klein dakje
    this.roof = scene.add.rectangle(0, 88, width - 70, 10, 0xc8322f).setStrokeStyle(2, 0x7e1a1a);
    this.portrait = scene.add.image(0, 84, `${character.id}_big`).setOrigin(0.5, CHAR_FRAME.foot / CHAR_FRAME.h).setScale(0.7);
    this.nameText = makeText(scene, 0, 122, character.name, { size: 32, weight: '700', color: '#f2b632', stroke: '#3a2205', strokeThickness: 5 });
    this.tag = makeText(scene, 0, 155, character.tagline, { size: 18, weight: '500', color: '#dfe4ff' });
    this.add([this.ring, this.bg, this.roof, this.portrait, this.nameText, this.tag]);
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerup', () => this.press());
    this.idle = scene.tweens.add({ targets: this.portrait, scaleY: 0.71, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.character = character;
    scene.add.existing(this);
  }

  setFocus(on) {
    this.focused = on;
    this.scene.tweens.killTweensOf(this.ring);
    this.scene.tweens.add({ targets: this, scale: on ? 1.05 : 0.96, duration: 160, ease: 'Back.Out' });
    if (on) {
      this.ring.setAlpha(0.5);
      this.scene.tweens.add({ targets: this.ring, alpha: 0.22, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.portrait.setTexture(`${this.character.id}_big_cheer`);
    } else {
      this.ring.setAlpha(0);
      this.portrait.setTexture(`${this.character.id}_big`);
    }
  }

  press() {
    AudioManager.unlock();
    AudioManager.play('open');
    this.onClick();
  }
}
