import Phaser from 'phaser';
import { generateAllTextures } from '../assets/TextureFactory.js';
import { VIEW, FONT } from '../config/gameConfig.js';

// Genereert alle assets en start daarna het hoofdmenu (of de assetpreview met ?preview).
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const { width, height } = VIEW;
    this.cameras.main.setBackgroundColor('#0b1433');
    const label = this.add.text(width / 2, height / 2, 'Pakjespaniek! wordt ingepakt…', {
      fontFamily: FONT, fontSize: '28px', color: '#f2b632', resolution: 2,
    }).setOrigin(0.5);

    // één frame laten renderen zodat het laadbericht zichtbaar is
    this.time.delayedCall(30, () => {
      generateAllTextures(this);
      label.destroy();
      const params = new URLSearchParams(window.location.search);
      const dev = import.meta.env.DEV;
      if (dev && params.has('preview')) this.scene.start('AssetPreview');
      else if (dev && params.has('play')) this.scene.start('Game');
      else this.scene.start('Menu');
    });
  }
}
