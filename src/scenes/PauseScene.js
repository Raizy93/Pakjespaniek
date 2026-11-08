import Phaser from 'phaser';
import { VIEW } from '../config/gameConfig.js';
import { panelKey } from '../assets/uiArt.js';
import Button, { FocusGroup } from '../ui/Button.js';
import { makeText } from '../ui/text.js';
import { AudioManager } from '../systems/AudioManager.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.data_ = data ?? {};
  }

  create() {
    const { width: W, height: H } = VIEW;
    this.add.rectangle(0, 0, W, H, 0x050a1e, 0.6).setOrigin(0).setInteractive();
    const panel = this.add.container(W / 2, H / 2);
    panel.add(this.add.image(0, 0, panelKey(this, 460, 470)));
    panel.add(makeText(this, 0, -190, 'Pauze', { size: 46, weight: '700', color: '#f2b632', stroke: '#3a2205', strokeThickness: 6 }));

    const resume = () => {
      this.scene.resume('Game');
      this.scene.stop();
    };
    const buttons = [
      new Button(this, 0, -100, 'Verder spelen', { width: 320, height: 60, variant: 'red', onClick: resume }),
      new Button(this, 0, -24, 'Opnieuw beginnen', { width: 320, height: 56, variant: 'navy', size: 24, onClick: () => {
        this.scene.stop('Hud');
        this.scene.stop('Game');
        this.scene.start('Game', this.data_);
      } }),
      new Button(this, 0, 46, this.musicLabel(), { width: 320, height: 56, variant: 'navy', size: 24, onClick: () => {
        AudioManager.setMusic(!AudioManager.musicOn);
        buttons[2].setLabel(this.musicLabel());
      } }),
      new Button(this, 0, 116, this.sfxLabel(), { width: 320, height: 56, variant: 'navy', size: 24, onClick: () => {
        AudioManager.setSfx(!AudioManager.sfxOn);
        buttons[3].setLabel(this.sfxLabel());
      } }),
      new Button(this, 0, 186, 'Naar hoofdmenu', { width: 320, height: 56, variant: 'gold', size: 24, onClick: () => {
        this.scene.stop('Hud');
        this.scene.stop('Game');
        this.scene.start('Menu');
      } }),
    ];
    panel.add(buttons);
    this.focus = new FocusGroup(this, buttons);

    panel.setScale(0.85).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });

    this.input.keyboard.once('keydown-ESC', resume);
  }

  musicLabel() {
    return `Muziek: ${AudioManager.musicOn ? 'aan' : 'uit'}`;
  }

  sfxLabel() {
    return `Geluidseffecten: ${AudioManager.sfxOn ? 'aan' : 'uit'}`;
  }
}
