import Phaser from 'phaser';
import { FONT } from '../config/gameConfig.js';
import { makeBuildingTexture, makePlatformTexture } from '../assets/worldArt.js';

// Ontwikkelhulp (index.html?preview): toont alle assets op ware grootte
// tegen de echte achtergrond, voor visuele controle.
export default class AssetPreviewScene extends Phaser.Scene {
  constructor() {
    super('AssetPreview');
  }

  create() {
    this.add.image(0, 0, 'sky').setOrigin(0);
    this.add.image(1080, 120, 'moon');
    this.add.image(300, 90, 'cloud1');
    this.add.tileSprite(0, 720 - 300 - 120, 1280, 300, 'far_town').setOrigin(0);
    this.add.tileSprite(0, 720 - 380, 1280, 380, 'mid_town').setOrigin(0);

    const b1 = makeBuildingTexture(this, 'pv_b1', { w: 300, top: 520, wall: 'brick', roof: 'tiles' }, 1);
    const b2 = makeBuildingTexture(this, 'pv_b2', { w: 260, top: 470, wall: 'plaster', roof: 'snow' }, 2);
    const b3 = makeBuildingTexture(this, 'pv_b3', { w: 260, top: 540, wall: 'stone', roof: 'ice' }, 3);
    this.add.image(20, 520 - 40, b1.key).setOrigin(0);
    this.add.image(380, 470 - 40, b2.key).setOrigin(0);
    this.add.image(700, 540 - 40, b3.key).setOrigin(0);

    const anims = ['idle', 'run', 'jump', 'fall', 'land', 'deliver', 'celebrate'];
    anims.forEach((a, i) => {
      const s = this.add.sprite(60 + i * 90, 520, 'piet').setOrigin(0.5, 110 / 116);
      s.play({ key: `piet-${a}`, repeat: -1 });
      this.add.text(60 + i * 90, 530, a, { fontFamily: FONT, fontSize: '14px' }).setOrigin(0.5, 0);
    });

    this.add.image(470, 470, 'chimney').setOrigin(0.5, 1);
    this.add.image(470, 410, 'check_badge');
    this.add.image(560, 470, 'crate').setOrigin(0.5, 1);
    this.add.image(800, 540, 'barrels').setOrigin(0.5, 1);
    this.add.image(900, 540, 'lantern').setOrigin(0.5, 1);
    this.add.image(940, 540, 'checkpoint_on').setOrigin(0.5, 1);
    this.add.image(1010, 540, 'finish_flag').setOrigin(0.5, 1);
    this.add.image(640, 470, 'sack').setOrigin(0.5, 1);
    this.add.image(700, 300, 'pepernoot');
    this.add.image(1100, 600, makePlatformTexture(this, 'mover', 140));
    this.add.image(1100, 650, makePlatformTexture(this, 'plank', 130));
    ['blue', 'red', 'purple'].forEach((c, i) => this.add.image(760 + i * 140, 250, `gift_${c}`).setScale(0.8));
    this.add.image(130, 250, 'logo_ribbon').setScale(0.35);
    this.add.image(250, 330, 'star_full');
    this.add.image(340, 330, 'star_empty');
    this.add.image(1220, 40, 'btn_pause');
    this.add.image(1180, 520, 'sign_board').setScale(0.5);
    this.add.image(560, 380, 'piet_big').setScale(0.5);
    this.add.sprite(620, 120, 'bird_up').play('bird-flap');
  }
}
