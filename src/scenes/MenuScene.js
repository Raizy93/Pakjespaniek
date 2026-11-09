import Phaser from 'phaser';
import { VIEW } from '../config/gameConfig.js';
import { panelKey } from '../assets/uiArt.js';
import { makeBuildingTexture } from '../assets/worldArt.js';
import Button, { FocusGroup } from '../ui/Button.js';
import { makeText } from '../ui/text.js';
import { AudioManager } from '../systems/AudioManager.js';
import { Storage } from '../systems/storage.js';
import { getBank, DEFAULT_BANK_ID } from '../education/registry.js';
import { LEVELS } from '../levels/index.js';
import { totalStars } from '../systems/storage.js';
import { CHAR_FRAME } from '../assets/characterRig.js';
import { CHARACTERS, CHARACTER_ORDER, getCharacter } from '../characters/registry.js';
import CharacterCard from '../ui/CharacterCard.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width: W, height: H } = VIEW;
    this.bankId = DEFAULT_BANK_ID;
    const bank = getBank(this.bankId);
    this.scroll = 0;

    // --- sfeervolle achtergrond (langzaam scrollend dorp)
    this.add.image(0, 0, 'sky').setOrigin(0);
    this.add.image(1060, 140, 'moon').setScale(1.1);
    this.cloudA = this.add.image(250, 120, 'cloud1').setAlpha(0.85);
    this.cloudB = this.add.image(900, 230, 'cloud3').setAlpha(0.7);
    this.far = this.add.tileSprite(0, H - 300 - 90, W, 300, 'far_town').setOrigin(0);
    this.mid = this.add.tileSprite(0, H - 380 + 40, W, 380, 'mid_town').setOrigin(0);
    this.add.tileSprite(0, H - 200, W, 200, 'alley_fog').setOrigin(0);

    // voorgronddaken
    const roofs = [
      { x: -20, w: 380, top: 560, wall: 'brick', roof: 'tiles' },
      { x: 930, w: 380, top: 590, wall: 'plaster', roof: 'snow' },
    ];
    roofs.forEach((b, i) => {
      const t = makeBuildingTexture(this, `menu_b${i}`, b, 500 + i);
      this.add.image(b.x - 10, b.top - 40, t.key).setOrigin(0);
    });
    this.add.image(250, 562, 'chimney').setOrigin(0.5, 1);
    this.add.particles(250, 446, 'puff', {
      speedY: { min: -36, max: -22 }, speedX: { min: -4, max: 12 }, scale: { start: 0.3, end: 1 },
      alpha: { start: 0.4, end: 0 }, lifespan: 2800, frequency: 500,
    });
    this.add.image(1080, 592, 'sack').setOrigin(0.5, 1).setScale(1.2);
    this.add.image(1180, 592, 'lantern').setOrigin(0.5, 1);
    const glow = this.add.image(1180, 480, 'glow').setTint(0xffa23c).setScale(1.6).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.32, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Piet en Sinterklaas op de daken
    const footOrigin = CHAR_FRAME.foot / CHAR_FRAME.h;
    const piet = this.add.image(120, 564, 'piet_big').setOrigin(0.5, footOrigin).setScale(0.62);
    const sint = this.add.image(990, 594, 'sint_big').setOrigin(0.5, footOrigin).setScale(0.62).setFlipX(true);
    this.tweens.add({ targets: piet, scaleY: 0.63, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: sint, scaleY: 0.63, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 300 });

    // --- logo
    const logo = this.add.container(W / 2, 112);
    const ribbon = this.add.image(0, 0, 'logo_ribbon').setScale(0.92);
    const title = makeText(this, 0, -12, 'Pakjespaniek!', {
      size: 92, weight: '700', color: '#ffffff', stroke: '#5a1010', strokeThickness: 10,
    });
    title.setShadow(0, 6, 'rgba(40,5,5,0.55)', 0, true, true);
    title.setAngle(-3);
    const sub = this.add.image(10, 76, 'logo_sub').setScale(0.82);
    const subText = makeText(this, 10, 72, 'De Grote Dakenrace', { size: 34, weight: '700', color: '#3a1d05' }).setAngle(-1.5);
    const giftIcon = this.add.image(318, -62, 'gift_red').setScale(0.55).setAngle(12);
    logo.add([ribbon, title, sub, subText, giftIcon]);
    logo.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: logo, scale: 1, alpha: 1, duration: 600, ease: 'Back.Out' });
    this.tweens.add({ targets: giftIcon, angle: 4, y: -70, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // --- leerdoel
    const chip = this.add.container(W / 2, 258);
    chip.add(this.add.image(0, 0, panelKey(this, 560, 74, 'navy')));
    chip.add(makeText(this, 0, -14, `Leerdoel: ${bank.title}`, { size: 24, weight: '700', color: '#f2b632' }));
    chip.add(makeText(this, 0, 15, bank.goal, { size: 17, weight: '400', color: '#dfe4ff' }));

    // --- knoppen
    const stars = totalStars(LEVELS);
    const buttons = [
      new Button(this, W / 2, 352, 'Spelen', { width: 320, height: 72, variant: 'red', size: 36, onClick: () => this.openCharacterSelect() }),
      new Button(this, W / 2, 436, 'Speluitleg', { width: 280, height: 58, variant: 'navy', size: 26, onClick: () => this.openHowTo() }),
      new Button(this, W / 2, 506, 'Instellingen', { width: 280, height: 58, variant: 'navy', size: 26, onClick: () => this.openSettings() }),
    ];
    this.focus = new FocusGroup(this, buttons);
    this.menuButtons = buttons;

    if (stars > 0) {
      // totaal verdiende sterren over alle levels
      const bx = W / 2 + 232;
      makeText(this, bx, 334, 'Sterren', { size: 16, weight: '600', color: '#aab4e0' });
      this.add.image(bx - 26, 364, 'star_full').setScale(0.34);
      makeText(this, bx + 14, 364, `${stars}/${LEVELS.length * 3}`, { size: 22, weight: '700', color: '#fff3d6' });
    }

    // --- footer
    const site = makeText(this, W / 2 - 120, H - 26, 'www.meesterdanny.com', { size: 18, weight: '600', color: '#c9d1ff' })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => window.open('https://www.meesterdanny.com', '_blank', 'noopener'));
    makeText(this, W / 2 + 10, H - 26, '·', { size: 18, color: '#7f89c0' });
    makeText(this, W / 2 + 130, H - 26, 'Instagram: meester.danny', { size: 18, weight: '600', color: '#c9d1ff' })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => window.open('https://www.instagram.com/meester.danny/', '_blank', 'noopener'));
    site.on('pointerover', () => site.setColor('#ffffff')).on('pointerout', () => site.setColor('#c9d1ff'));

    makeText(this, W / 2, H - 52, `${bank.groups} · Gebruik het toetsenbord of de muis`, { size: 15, weight: '400', color: '#8790c4' });

    this.modal = null;
    this.input.keyboard.on('keydown-ESC', () => this.closeModal());
    this.input.keyboard.on('keydown', () => AudioManager.unlock());
    this.input.on('pointerdown', () => AudioManager.unlock());
    this.cameras.main.fadeIn(300, 7, 13, 36);
    AudioManager.playMusic('menu');
  }

  update(time, delta) {
    this.scroll += delta * 0.02;
    this.far.tilePositionX = this.scroll * 0.4;
    this.mid.tilePositionX = this.scroll;
    this.cloudA.x = ((250 - this.scroll * 0.3) % 1600 + 1600) % 1600 - 200;
    this.cloudB.x = ((900 - this.scroll * 0.2) % 1600 + 1600) % 1600 - 200;
  }

  startGame(characterId) {
    AudioManager.unlock();
    this.focus.active = false;
    if (this.modalFocus) this.modalFocus.active = false;
    this.cameras.main.fadeOut(300, 7, 13, 36);
    // na de personagekeuze naar de levelkaart
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Levels', { bankId: this.bankId, character: characterId }));
  }

  /** Personagekeuze: Piet of Sinterklaas (keuze wordt onthouden). */
  openCharacterSelect() {
    const last = getCharacter(Storage.settings.character).id;
    this.openModal('Met wie ga je bezorgen?', 760, 560, (c) => {
      const cards = CHARACTER_ORDER.map((id, i) => {
        const card = new CharacterCard(this, (i - (CHARACTER_ORDER.length - 1) / 2) * 330, 0, CHARACTERS[id], {
          onClick: () => {
            Storage.setSetting('character', id);
            this.startGame(id);
          },
        });
        card.setScale(0.96);
        c.add(card);
        return card;
      });
      return cards;
    }, { horizontal: true, focusIndex: Math.max(0, CHARACTER_ORDER.indexOf(last)) });
  }

  // ------------------------------------------------------------ modals
  openModal(title, w, h, build, { horizontal = false, focusIndex = null } = {}) {
    this.closeModal();
    const { width: W, height: H } = VIEW;
    this.focus.active = false;
    const shade = this.add.rectangle(0, 0, W, H, 0x050a1e, 0.65).setOrigin(0).setInteractive().setDepth(100);
    const c = this.add.container(W / 2, H / 2).setDepth(101);
    c.add(this.add.image(0, 0, panelKey(this, w, h)));
    c.add(makeText(this, 0, -h / 2 + 48, title, { size: 38, weight: '700', color: '#f2b632', stroke: '#3a2205', strokeThickness: 6 }));
    const extraButtons = build(c) ?? [];
    const close = new Button(this, 0, h / 2 - 52, 'Terug', { width: 200, height: 54, variant: 'red', size: 24, onClick: () => this.closeModal() });
    c.add(close);
    this.modalFocus = new FocusGroup(this, [...extraButtons, close], { horizontal });
    this.modalFocus.focus(focusIndex ?? extraButtons.length, false);
    c.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    this.modal = { shade, c };
  }

  closeModal() {
    if (!this.modal) return;
    this.modalFocus?.destroy();
    this.modalFocus = null;
    this.modal.shade.destroy();
    this.modal.c.destroy();
    this.modal = null;
    this.time.delayedCall(50, () => { this.focus.active = true; });
  }

  openHowTo() {
    this.openModal('Speluitleg', 900, 600, (c) => {
      const row = (y, keys, text) => {
        let x = -380;
        for (const k of keys) {
          const wide = k.length > 2;
          const img = this.add.image(x + (wide ? 75 : 29), y, wide ? 'keycap_wide' : 'keycap').setScale(0.82);
          const t = makeText(this, img.x, y - 3, k, { size: wide ? 20 : 22, weight: '700', color: '#1b2552' });
          c.add([img, t]);
          x += wide ? 132 : 52;
        }
        c.add(makeText(this, -40, y, text, { size: 22, weight: '600', color: '#ffffff', origin: [0, 0.5] }));
      };
      row(-180, ['A', 'D', '←', '→'], 'Lopen naar links en rechts');
      row(-118, ['Spatie', '↑'], 'Springen (lang drukken = hoger)');
      row(-56, ['E'], 'Opdracht openen bij een schoorsteen');
      row(6, ['1', '2', '3'], 'Kies het cadeau met het goede antwoord');
      row(68, ['Esc', 'F'], 'Pauze  ·  F = volledig scherm');

      c.add(this.add.image(-330, 160, 'chimney').setScale(0.7));
      c.add(this.add.image(-250, 150, 'gift_blue').setScale(0.42));
      c.add(this.add.image(-190, 150, 'pepernoot').setScale(1.2));
      c.add(makeText(this, -150, 150,
        'Bezorg bij alle 8 schoorstenen het juiste cadeautje.\nDirect goed = sterren!  8 → ★★★   6–7 → ★★   4–5 → ★\nPepernoten zijn extra bonuspunten.', {
          size: 20, weight: '500', color: '#dfe4ff', origin: [0, 0.5], align: 'left', lineSpacing: 6,
        }));
      return [];
    });
  }

  openSettings() {
    this.openModal('Instellingen', 560, 380, (c) => {
      const makeToggle = (y, label, get, set) => {
        c.add(makeText(this, -180, y, label, { size: 26, weight: '600', origin: [0, 0.5] }));
        const b = new Button(this, 150, y, get() ? 'Aan' : 'Uit', {
          width: 120, height: 52, variant: get() ? 'green' : 'navy', size: 24,
          onClick: () => {
            set(!get());
            b.setLabel(get() ? 'Aan' : 'Uit');
            b.setVariant(get() ? 'green' : 'navy');
          },
        });
        c.add(b);
        return b;
      };
      const m = makeToggle(-50, 'Muziek', () => AudioManager.musicOn, (v) => AudioManager.setMusic(v));
      const s = makeToggle(30, 'Geluidseffecten', () => AudioManager.sfxOn, (v) => { AudioManager.setSfx(v); if (v) AudioManager.play('pepernoot'); });
      return [m, s];
    });
  }
}
