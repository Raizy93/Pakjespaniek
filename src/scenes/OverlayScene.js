import Phaser from 'phaser';
import { VIEW } from '../config/gameConfig.js';
import { makeText } from '../ui/text.js';
import { AudioManager } from '../systems/AudioManager.js';

/**
 * Laag die boven alle schermen ligt: de knop voor volledig scherm (rechtsboven).
 * De sneltoets F staat in main.js (moet direct in het toetsenbord-event van de browser).
 * Is volledig scherm niet mogelijk (bijv. iframe zonder allowfullscreen, of iPhone),
 * dan wordt de knop niet getoond.
 */
export default class OverlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Overlay', active: false });
  }

  create() {
    if (!this.scale.fullscreen.available) return;
    // zelfde formaat en hoogte als de pauzeknop in de HUD, met de sneltoets eronder
    const x = VIEW.width - 52;
    const y = 54;
    this.btn = this.add.image(x, y, 'btn_fullscreen').setInteractive({ useHandCursor: true });
    this.tip = makeText(this, x, y + 44, 'F', { size: 15, weight: '600', color: '#aab4e0', stroke: '#0b1433', strokeThickness: 3 });

    this.btn.on('pointerover', () => this.tweens.add({ targets: this.btn, scale: 1.08, duration: 120 }));
    this.btn.on('pointerout', () => this.tweens.add({ targets: this.btn, scale: 1, duration: 120 }));
    // pointerup verwerkt Phaser direct in het klik-event: dat mag van de browser
    this.btn.on('pointerup', () => {
      AudioManager.unlock();
      AudioManager.play('click');
      this.scale.toggleFullscreen();
    });

    const update = () => {
      const on = this.scale.isFullscreen;
      this.btn.setTexture(on ? 'btn_fullscreen_exit' : 'btn_fullscreen');
    };
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, update);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, update);
    this.events.once('shutdown', () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, update);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, update);
    });
  }
}
