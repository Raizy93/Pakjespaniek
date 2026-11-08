import Phaser from 'phaser';

// Gedeelde event-bus tussen de spelscène en de HUD (event-gedreven HUD,
// geen polling). Event-namen staan hier als constanten.
export const bus = new Phaser.Events.EventEmitter();

export const EV = {
  PEPERNOTEN: 'hud:pepernoten', // (count, total)
  DELIVERED: 'hud:delivered', // (count, total)
  TOAST: 'hud:toast', // (text, color?)
  PAUSE_REQUEST: 'game:pause-request',
  QUIZ_STATE: 'game:quiz', // (active)
};
