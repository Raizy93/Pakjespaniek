// Wereld 1 – Level 4: De Laatste Bezorging
//
// De finale: alles wat je geleerd hebt komt samen, plus één nieuw element:
// brokkelpannen (losse dakpannen die wegzakken als je blijft staan).
//   1. trapje omhoog                                          → schoorsteen 1
//   2. brokkelpannen introduceren boven een klein gat         → schoorsteen 2
//   3. klimmen, sprong omlaag en een lift                     → schoorsteen 3–4
//   4. tegenwind boven een gat                                → schoorsteen 5
//   5. rijdend plankje + een rij brokkelpannen                → schoorsteen 6
//   6. afdalen, tweede lift naar de hoogste daken             → schoorsteen 7
//   7. het huis van Sinterklaas: laatste schoorsteen en finish → schoorsteen 8
import { shiftLevelY } from './levelUtils.js';

const level = {
  id: 'w1-l4',
  name: 'De Laatste Bezorging',
  world: 'Wereld 1',
  number: 4,
  tagline: 'De finale: op naar het huis van de Sint!',
  theme: 'snow',
  // leerlijn: alles door elkaar, en ook omgekeerd (procent → breuk)
  learning: {
    title: 'Alles door elkaar + % → breuk',
    maxPerGroup: 2,
    mix: { forward: 5, reverse: 3 },
  },
  width: 10200,
  height: 1240,
  spawn: { x: 150 },

  buildings: [
    { x: 0, w: 640, top: 1100, wall: 'brick', roof: 'tiles' },
    { x: 640, w: 240, top: 1000, wall: 'plaster', roof: 'snow' },
    { x: 880, w: 560, top: 900, wall: 'stone', roof: 'tiles' },
    { x: 1860, w: 500, top: 840, wall: 'brick', roof: 'snow' },
    { x: 2360, w: 260, top: 720, wall: 'plaster', roof: 'tiles' },
    { x: 2620, w: 400, top: 620, wall: 'stone', roof: 'snow' },
    { x: 3100, w: 360, top: 980, wall: 'brick', roof: 'tiles' },
    { x: 3690, w: 480, top: 620, wall: 'plaster', roof: 'snow' },
    { x: 4270, w: 400, top: 640, wall: 'stone', roof: 'snow' },
    { x: 4770, w: 480, top: 620, wall: 'brick', roof: 'snow' },
    { x: 5740, w: 300, top: 600, wall: 'plaster', roof: 'tiles' },
    { x: 6610, w: 560, top: 520, wall: 'stone', roof: 'ice' },
    { x: 7170, w: 300, top: 640, wall: 'brick', roof: 'tiles' },
    { x: 7470, w: 300, top: 760, wall: 'plaster', roof: 'snow' },
    { x: 8000, w: 520, top: 460, wall: 'stone', roof: 'snow' },
    { x: 8520, w: 300, top: 580, wall: 'brick', roof: 'tiles' },
    { x: 8820, w: 260, top: 700, wall: 'plaster', roof: 'tiles' },
    // het huis van Sinterklaas
    { x: 9080, w: 1120, top: 740, wall: 'brick', roof: 'tiles' },
  ],

  platforms: [
    // brokkelpannen: breed met kleine tussenruimtes, zodat elke sprong op een pan landt
    { type: 'crumble', x: 1480, y: 880, w: 160 },
    { type: 'crumble', x: 1680, y: 860, w: 160 },
    { type: 'mover', x: 3480, y: 960, w: 180, to: { x: 3480, y: 640 }, speed: 85 },
    { type: 'mover', x: 5310, y: 640, w: 140, to: { x: 5600, y: 640 }, speed: 105 },
    { type: 'crumble', x: 6080, y: 580, w: 160 },
    { type: 'crumble', x: 6280, y: 560, w: 160 },
    { type: 'crumble', x: 6480, y: 540, w: 120 },
    { type: 'mover', x: 7790, y: 740, w: 180, to: { x: 7790, y: 480 }, speed: 80 },
  ],

  wind: [
    { x: 4170, w: 730, force: -110, on: 2.2, off: 2.2 },
  ],

  props: [
    { type: 'lantern', x: 80, solid: false },
    { type: 'lantern', x: 940, solid: false },
    { type: 'lantern', x: 1920, solid: false },
    { type: 'lantern', x: 2680, solid: false },
    { type: 'lantern', x: 3160, solid: false },
    { type: 'lantern', x: 3740, solid: false },
    { type: 'lantern', x: 4830, solid: false },
    { type: 'lantern', x: 6670, solid: false },
    { type: 'lantern', x: 8060, solid: false },
    // feestelijk huis van de Sint
    { type: 'lantern', x: 9140, solid: false },
    { type: 'sack', x: 9540, solid: false },
    { type: 'lantern', x: 9620, solid: false },
    { type: 'sack', x: 9760, solid: false },
    { type: 'lantern', x: 9840, solid: false },
    { type: 'sack', x: 10120, solid: false },
  ],

  chimneys: [1150, 2100, 2850, 3950, 5000, 6850, 8250, 9300],

  checkpoints: [1900, 3720, 6650, 8040],

  signs: [
    { x: 300, text: 'De laatste\nbezorging!' },
    { x: 990, text: 'Brokkelpannen:\nsnel doorlopen!' },
    { x: 3200, text: 'Wacht op\nde lift!' },
    { x: 9680, text: 'Huis van\nSinterklaas' },
  ],

  pepernoten: [
    [300, 1040], [520, 1040], [760, 940], [1000, 840], [1350, 840],
    [1560, 820], [1740, 800], [1950, 780], [2300, 780],
    [2480, 660], [2700, 560], [2980, 560],
    [3200, 920], [3400, 920], [3570, 580],
    [3800, 560], [4120, 560],
    [4350, 580], [4600, 580], [4850, 560], [5200, 560],
    [5380, 580], [5480, 580], [5580, 580], [5850, 540],
    [6160, 520], [6360, 500], [6540, 480],
    [6700, 460], [7100, 460], [7300, 580], [7600, 700],
    [7880, 420], [8100, 400], [8460, 400],
    [8650, 520], [8950, 640], [9200, 680], [9500, 680], [9900, 680],
  ],

  finish: { x: 10000 },
};

// 120 px extra ruimte bovenin voor de opdracht bij de hoogste schoorsteen
export default shiftLevelY(level, 120);
