// Koppeling tussen spelmomenten en de audiobestanden in de map /audio.
//
// file   – bestandsnaam zonder extensie (in /audio)
// gain   – volume van dit bestand (1 = origineel). Afgestemd op gemeten luidheid.
// vary   – kleine willekeurige toonhoogte-variatie, zodat herhalingen niet robotisch klinken
// mono   – maximaal één tegelijk (een nieuwe stopt de vorige)
//
// Staat een moment hier niet in (of ontbreekt het bestand), dan speelt de game
// het ingebouwde, zelf gesynthetiseerde geluid.

export const SFX = {
  jump: { file: 'player_jump', gain: 0.45, vary: 0.05, mono: true },
  land: { file: 'player_land', gain: 0.5, vary: 0.06, mono: true },
  fall: { file: 'player_fall', gain: 0.6 },
  respawn: { file: 'player_spawn', gain: 0.55 },
  pepernoot: { file: 'pepernoot_collect', gain: 0.6, vary: 0.04 },
  checkpoint: { file: 'checkpoint', gain: 0.7 },
  open: { file: 'chimney_open', gain: 2.4 }, // opdracht bij schoorsteen gaat open (bestand is zacht)
  giftSelect: { file: 'gift_select', gain: 1.4, mono: true }, // ander cadeau aangewezen
  throw: { file: 'gift_throw', gain: 0.85 }, // cadeau vliegt naar de schoorsteen
  deliver: { file: 'gift_delivered', gain: 1.0 }, // cadeau valt in de schoorsteen
  correct: { file: 'answer_good', gain: 0.7 },
  wrong: { file: 'answer_wrong', gain: 0.6 },
  finish: { file: 'level_completed', gain: 0.8 },
  star: { file: 'star_earned', gain: 0.7, vary: 0.03 },
  click: { file: 'menu_click', gain: 0.6, mono: true },
};

// Muziek per scherm. Het volume is bewust laag: de muziek mag niet afleiden van het rekenen.
export const MUSIC = {
  menu: { file: 'menu_music', gain: 0.3 },
  game: { file: 'gameplay_music', gain: 0.24 },
  results: { file: 'results_music', gain: 0.3 },
};

export const MUSIC_DUCK = 0.35; // muziekvolume tijdens een opdracht (fractie)
export const MUSIC_FADE = 0.8; // seconden overgang tussen muzieknummers
