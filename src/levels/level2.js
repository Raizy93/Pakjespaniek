// Wereld 1 – Level 2: Hoge Daken
//
// Nieuw in dit level: hoogteverschillen. Het level is hoger dan het scherm; de camera
// volgt ook omhoog en omlaag. Opbouw (zie level-design-skill: eerst veilig oefenen,
// dan uitdagen):
//   1. trapje van daken omhoog (klimmen leren)           → schoorsteen 1–2
//   2. grote sprong omlaag + lift omhoog                   → schoorsteen 3
//   3. planken naar de kerktoren, het hoogste punt         → schoorsteen 4
//   4. afdalen over glad ijs + rijdend plankje             → schoorsteen 5–6
//   5. tweede lift naar de hoogste daken, daarna de finale → schoorsteen 7–8
//
// Alle maten in wereld-pixels; "top" is de y van het loopvlak (kleiner = hoger).
// Onderaan wordt alles 280 px omlaag geschoven: ruimte boven de hoogste daken voor de opdracht.
import { shiftLevelY } from './levelUtils.js';

const level = {
  id: 'w1-l2',
  name: 'Hoge Daken',
  world: 'Wereld 1',
  number: 2,
  tagline: 'Klim omhoog en kijk niet naar beneden!',
  // leerlijn: erbij komen vijfden en het geheel (3/3, 10/10 … = 100%)
  learning: {
    title: 'Erbij: vijfden en het geheel',
    groups: ['/2', '/4', '/5', '/10'],
    maxPerGroup: 4,
  },
  width: 10100,
  height: 1260,
  spawn: { x: 150 },

  buildings: [
    { x: 0, w: 640, top: 1080, wall: 'brick', roof: 'tiles' },
    { x: 640, w: 220, top: 980, wall: 'plaster', roof: 'tiles' },
    { x: 860, w: 220, top: 880, wall: 'stone', roof: 'snow' },
    { x: 1080, w: 520, top: 800, wall: 'brick', roof: 'tiles' },
    { x: 1700, w: 300, top: 760, wall: 'plaster', roof: 'tiles' },
    { x: 2000, w: 240, top: 640, wall: 'stone', roof: 'tiles' },
    { x: 2240, w: 460, top: 560, wall: 'brick', roof: 'snow' },
    { x: 2780, w: 360, top: 900, wall: 'plaster', roof: 'tiles' },
    { x: 3370, w: 430, top: 520, wall: 'stone', roof: 'snow' },
    { x: 4310, w: 300, top: 400, wall: 'brick', roof: 'tiles' },
    { x: 4610, w: 220, top: 300, wall: 'stone', roof: 'tiles' },
    { x: 4830, w: 480, top: 420, wall: 'plaster', roof: 'snow' },
    { x: 5400, w: 400, top: 560, wall: 'brick', roof: 'ice' },
    { x: 5800, w: 260, top: 700, wall: 'stone', roof: 'tiles' },
    { x: 6060, w: 520, top: 820, wall: 'plaster', roof: 'tiles' },
    { x: 7020, w: 300, top: 760, wall: 'brick', roof: 'tiles' },
    { x: 7320, w: 240, top: 640, wall: 'stone', roof: 'snow' },
    { x: 7560, w: 520, top: 540, wall: 'plaster', roof: 'tiles' },
    { x: 8310, w: 540, top: 280, wall: 'stone', roof: 'snow' },
    { x: 8850, w: 260, top: 400, wall: 'brick', roof: 'tiles' },
    { x: 9110, w: 260, top: 520, wall: 'plaster', roof: 'tiles' },
    { x: 9370, w: 730, top: 640, wall: 'brick', roof: 'snow' },
  ],

  platforms: [
    // lift 1: van het lage dak omhoog naar schoorsteen 3
    { type: 'mover', x: 3160, y: 880, w: 180, to: { x: 3160, y: 560 }, speed: 85 },
    // planken naar de kerktoren
    { type: 'plank', x: 3870, y: 480, w: 150 },
    { type: 'swing', x: 4090, y: 440, w: 150 },
    // rijdend plankje over de brede steeg
    { type: 'mover', x: 6640, y: 800, w: 140, to: { x: 6880, y: 800 }, speed: 105 },
    // lift 2: naar de allerhoogste daken
    { type: 'mover', x: 8100, y: 520, w: 180, to: { x: 8100, y: 300 }, speed: 80 },
  ],

  props: [
    { type: 'lantern', x: 90, solid: false },
    { type: 'sack', x: 420, solid: false },
    { type: 'lantern', x: 1150, solid: false },
    { type: 'crate', x: 1200 },
    { type: 'lantern', x: 2300, solid: false },
    { type: 'lantern', x: 2840, solid: false },
    { type: 'lantern', x: 3440, solid: false },
    { type: 'barrels', x: 4460 },
    { type: 'lantern', x: 4890, solid: false },
    { type: 'lantern', x: 6120, solid: false },
    { type: 'sack', x: 7100, solid: false },
    { type: 'lantern', x: 7620, solid: false },
    { type: 'lantern', x: 8400, solid: false },
    { type: 'crate', x: 8700 },
    { type: 'lantern', x: 9420, solid: false },
    { type: 'sack', x: 9820, solid: false },
  ],

  chimneys: [1300, 2450, 3560, 5050, 6280, 7780, 8540, 9600],

  checkpoints: [1720, 3420, 6100, 8360],

  signs: [
    { x: 260, text: 'Hoge Daken!\nKlim omhoog' },
    { x: 2860, text: 'Wacht op\nde lift!' },
    { x: 5480, text: 'Pas op:\nglad ijs!' },
    { x: 9480, text: 'Bijna bij\nde finish!' },
  ],

  pepernoten: [
    [300, 1020], [520, 1020],
    [750, 920], [970, 820],
    [1150, 740], [1500, 740],
    [1650, 690],
    [1850, 700], [2120, 580],
    [2300, 500], [2650, 500],
    [2850, 840], [3020, 840],
    [3250, 500],
    [3450, 460], [3750, 460],
    [3945, 420], [4165, 380],
    [4380, 340], [4720, 240],
    [4900, 360], [5250, 360],
    [5500, 500], [5700, 500],
    [5930, 640],
    [6150, 760], [6500, 760],
    [6700, 740], [6800, 740], [6900, 740],
    [7100, 700], [7440, 580],
    [7620, 480], [8000, 480],
    [8200, 260],
    [8420, 220], [8800, 220],
    [8980, 340], [9240, 460],
    [9450, 580], [9850, 580],
  ],

  finish: { x: 9950 },
};

export default shiftLevelY(level, 280);
