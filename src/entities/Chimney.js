import Phaser from 'phaser';
import { makeText } from '../ui/text.js';

export const CHIMNEY_STATE = { OPEN: 'open', ACTIVE: 'active', DONE: 'done' };

/**
 * Een interactieve schoorsteen op een dak, met een poort erachter die
 * pas opengaat als het cadeau bezorgd is (zo kan geen schoorsteen worden overgeslagen).
 */
export default class Chimney {
  constructor(scene, { x, roofY, index, question, solids }) {
    this.scene = scene;
    this.x = x;
    this.roofY = roofY;
    this.index = index;
    this.question = question;
    this.state = CHIMNEY_STATE.OPEN;

    this.sprite = scene.add.image(x, roofY + 4, 'chimney').setOrigin(0.5, 1).setDepth(20);
    this.top = roofY + 4 - this.sprite.height;
    this.opening = { x, y: this.top + 8 };

    // warme gloed die bij "actief" oplicht
    this.glow = scene.add.image(x, this.top + 10, 'glow').setTint(0xffb84a).setScale(1.2).setAlpha(0).setDepth(19).setBlendMode(Phaser.BlendModes.ADD);

    // rook
    this.smoke = scene.add.particles(x, this.top + 2, 'puff', {
      speedY: { min: -38, max: -24 },
      speedX: { min: -6, max: 14 },
      scale: { start: 0.3, end: 0.95 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 2600,
      frequency: 420,
      rotate: { min: 0, max: 360 },
    }).setDepth(18);

    // nummerbordje
    this.number = makeText(scene, x, roofY - 34, String(index + 1), {
      size: 20, color: '#fff3d6', weight: '700', stroke: '#5a1f12', strokeThickness: 4,
    }).setDepth(21);

    // interactie-indicator ("E")
    this.indicator = scene.add.container(x, this.top - 46).setDepth(60).setAlpha(0);
    const cap = scene.add.image(0, 0, 'keycap').setScale(0.95);
    const e = makeText(scene, 0, -4, 'E', { size: 30, color: '#1b2552', weight: '700' });
    const hint = makeText(scene, 0, 44, 'bezorgen', { size: 18, color: '#fff3d6', weight: '600', stroke: '#0b1433', strokeThickness: 4 });
    this.indicator.add([cap, e, hint]);
    scene.tweens.add({ targets: this.indicator, y: this.top - 54, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.indicatorShown = false;

    // poort achter de schoorsteen
    const gx = x + 110;
    this.gateX = gx;
    this.gateBeam = scene.add.image(gx, roofY, 'gate_beam').setOrigin(0.5, 1).setDisplaySize(46, 360).setDepth(22).setAlpha(0.65);
    scene.tweens.add({ targets: this.gateBeam, alpha: 0.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.gatePost = scene.add.image(gx + 8, roofY + 2, 'gate_post').setOrigin(0.5, 1).setDepth(23);
    this.gateBar = scene.add.image(gx + 8, roofY - 62, 'gate_bar').setOrigin(0.06, 0.5).setDepth(23).setAngle(0);
    this.gateBody = scene.add.zone(gx, roofY - 360, 24, 720);
    this.gateBody.setOrigin(0.5, 0);
    scene.physics.add.existing(this.gateBody, true);
    this.gateBody.setData('gate', this);
    solids.add(this.gateBody);
  }

  isNear(player) {
    return Math.abs(player.x - this.x) < 95 && Math.abs(player.y - this.roofY) < 24;
  }

  setIndicator(show) {
    if (show === this.indicatorShown) return;
    this.indicatorShown = show;
    this.scene.tweens.add({ targets: this.indicator, alpha: show ? 1 : 0, scale: show ? 1 : 0.8, duration: 180, ease: 'Back.Out' });
  }

  activate() {
    this.state = CHIMNEY_STATE.ACTIVE;
    this.setIndicator(false);
    this.scene.tweens.add({ targets: this.glow, alpha: 0.8, duration: 300 });
  }

  deactivate() {
    if (this.state === CHIMNEY_STATE.ACTIVE) this.state = CHIMNEY_STATE.OPEN;
    this.scene.tweens.add({ targets: this.glow, alpha: 0, duration: 300 });
  }

  complete() {
    this.state = CHIMNEY_STATE.DONE;
    this.setIndicator(false);
    this.scene.tweens.add({ targets: this.glow, alpha: 0, duration: 600 });
    this.smoke.frequency = 900;
    // groen vinkje
    this.badge = this.scene.add.image(this.x, this.top + 52, 'check_badge').setDepth(24).setScale(0);
    this.scene.tweens.add({ targets: this.badge, scale: 0.9, duration: 420, ease: 'Back.Out' });
    // poort open
    this.scene.tweens.add({ targets: this.gateBar, angle: -88, duration: 650, ease: 'Back.Out' });
    this.scene.tweens.killTweensOf(this.gateBeam);
    this.scene.tweens.add({ targets: this.gateBeam, alpha: 0, duration: 500 });
    this.gateBody.body.enable = false;
  }
}
