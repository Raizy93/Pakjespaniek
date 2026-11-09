// Centrale afstelling van de game. Alle "gevoel"-waarden staan hier,
// zodat ze op één plek getuned kunnen worden.

export const VIEW = {
  width: 1280,
  height: 720,
};

export const FONT = 'Fredoka, "Trebuchet MS", Arial, sans-serif';

// Spronggevoel afgeleid van hoogte + tijd (zie platformer-skill):
// gravity = 2h / t², jumpVelocity = 2h / t
const JUMP_HEIGHT = 175; // px, volle sprong
const TIME_TO_APEX = 0.4; // s

export const PLAYER = {
  runSpeed: 330,
  groundAccel: 3600, // px/s² – topsnelheid in ~0,09 s
  groundDecel: 3000,
  airAccel: 2300,
  airDecel: 1100,
  iceAccel: 700,
  iceDecel: 260,
  gravity: (2 * JUMP_HEIGHT) / (TIME_TO_APEX * TIME_TO_APEX),
  jumpVelocity: (2 * JUMP_HEIGHT) / TIME_TO_APEX,
  fallGravityMult: 1.7,
  apexHangMult: 0.55,
  apexThreshold: 70, // |vy| waaronder de sprong even "hangt"
  jumpCutMult: 0.45, // loslaten tijdens stijgen = korte sprong
  maxFallSpeed: 980,
  coyoteTime: 0.1,
  jumpBuffer: 0.13,
  body: { width: 34, height: 74 },
  killY: 800, // onder deze y: gevallen → checkpoint
};

// Level-metrics: hiermee worden gaten en hoogteverschillen gevalideerd.
export const METRICS = {
  jumpHeight: JUMP_HEIGHT,
  maxGap: 225, // ongeveer de maximale sprongafstand op gelijke hoogte
  safeGap: 170, // comfortabel haalbaar voor kinderen
  maxStepUp: 135, // comfortabele maximale stap omhoog
  maxRisingGapEffort: 165, // gat + stijging samen (vergevingsgezind voor groep 7–8)
};

export const CAMERA = {
  deadzoneX: 40,
  lookAhead: 150,
  smoothing: 7, // hoger = strakker (exponentieel, framerate-onafhankelijk)
  lookAheadSmoothing: 2.5,
  playerScreenX: 0.38, // waar Piet ongeveer staat (fractie van schermbreedte)
  // Verticaal (hoge levels): volgt de hoogte van het dak waar Piet op staat, niet elke sprong
  groundScreenY: 0.7, // waar het loopvlak op het scherm komt (fractie van schermhoogte)
  verticalSmoothing: 3.2,
  fallFollowMargin: 140, // valt Piet verder dan dit onder het loopvlak, dan volgt de camera direct
};

export const SCORING = {
  pointsPerDelivery: 10,
  pointsPerPepernoot: 1,
  // Sterren puur op basis van direct-goed beantwoorde opdrachten
  stars(firstTryCorrect, total) {
    if (total <= 0) return 0;
    if (firstTryCorrect >= total) return 3;
    if (firstTryCorrect >= total - 2) return 2; // 6–7 bij 8 opdrachten
    if (firstTryCorrect >= total - 4) return 1; // 4–5 bij 8 opdrachten
    return 0;
  },
};

export const COLORS = {
  night: 0x0b1433,
  navy: 0x1b2552,
  navyLight: 0x2a3878,
  purple: 0x6b2fa6,
  red: 0xc8322f,
  terracotta: 0xb4553a,
  gold: 0xf2b632,
  orange: 0xff9a3c,
  snow: 0xf4f7ff,
  green: 0x3fbf5a,
  cream: 0xfff3d6,
};

// CSS-varianten voor tekst
export const CSS = {
  white: '#ffffff',
  cream: '#fff3d6',
  gold: '#f2b632',
  goldLight: '#ffd66b',
  navy: '#1b2552',
  navyDark: '#0b1433',
  red: '#c8322f',
  green: '#3fbf5a',
  muted: '#aab4e0',
};
