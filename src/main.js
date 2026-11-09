import Phaser from 'phaser';
// alleen de Latijnse tekenset (bevat alle Nederlandse tekens)
import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import './style.css';

import { VIEW } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HudScene from './scenes/HudScene.js';
import PauseScene from './scenes/PauseScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import AssetPreviewScene from './scenes/AssetPreviewScene.js';
import OverlayScene from './scenes/OverlayScene.js';
import { AudioManager } from './systems/AudioManager.js';

// audiobestanden alvast downloaden; afspelen kan pas na de eerste klik of toets
AudioManager.preload();

async function start() {
  // Wacht op het lettertype, zodat alle teksten meteen goed gemeten worden.
  try {
    await Promise.race([
      Promise.all(['400', '600', '700'].map((w) => document.fonts.load(`${w} 32px Fredoka`))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* val terug op systeemlettertype */
  }

  const params = new URLSearchParams(window.location.search);
  const debug = params.has('debug');
  if (import.meta.env.DEV && params.has('shot')) document.body.classList.add('shot');
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: VIEW.width,
    height: VIEW.height,
    backgroundColor: '#0b1433',
    pixelArt: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      // vast element voor volledig scherm (anders verplaatst Phaser het canvas naar een nieuw div,
      // wat bij een tweede poging een HierarchyRequestError geeft)
      fullscreenTarget: 'game',
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug, tileBias: 32 },
    },
    input: { keyboard: { target: window } },
    disableContextMenu: true,
    // OverlayScene als laatste: ligt boven alle andere schermen (knop volledig scherm)
    scene: [BootScene, MenuScene, LevelSelectScene, GameScene, HudScene, PauseScene, ResultsScene, ...(import.meta.env.DEV ? [AssetPreviewScene] : []), OverlayScene],
  });

  // Sneltoets F: volledig scherm aan/uit. Bewust in het browser-event zelf (niet via Phaser),
  // want browsers staan volledig scherm alleen toe direct vanuit een toetsdruk of klik.
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyF' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!game.scale.fullscreen.available) return;
    AudioManager.unlock();
    game.scale.toggleFullscreen();
  });

  // Focus naar de game (belangrijk binnen een iframe op MeesterDanny.com)
  const focus = () => {
    window.focus();
    document.getElementById('game')?.focus({ preventScroll: true });
  };
  window.addEventListener('pointerdown', focus);
  focus();

  if (import.meta.env.DEV) {
    window.__pakjes = game;
    window.__audio = AudioManager;
    if (params.has('bot')) {
      const wrongOn = (params.get('bot') || '0,3').split(',').filter(Boolean).map(Number);
      import('./dev/bot.js').then(({ startBot }) => setTimeout(() => startBot(game, wrongOn), 1500));
    }
  }
}

start();
