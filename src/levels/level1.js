// Wereld 1 – Level 1: Het Sinterklaasdorp
//
// Alle maten in wereld-pixels. De wereld is 720 px hoog (= schermhoogte);
// "top" is de y-coördinaat van het loopvlak van een dak.
//
// buildings  – huizen met een begaanbaar dak (wall: brick|plaster|stone, roof: tiles|snow|ice)
// platforms  – losse platforms (plank, swing, mover); movers bewegen tussen from/to
// props      – kisten en tonnen (solid) of decoratie (lantern, sack)
// chimneys   – x-positie; staat automatisch op het dak eronder
// checkpoints, signs, pepernoten, finish

export default {
  id: 'w1-l1',
  name: 'Het Sinterklaasdorp',
  world: 'Wereld 1',
  number: 1,
  tagline: 'Ren over de daken van het dorp',
  width: 11300,
  height: 720,
  spawn: { x: 150 },

  buildings: [
    { x: 0, w: 900, top: 560, wall: 'brick', roof: 'tiles' },
    { x: 1000, w: 700, top: 520, wall: 'plaster', roof: 'tiles' },
    { x: 1810, w: 390, top: 470, wall: 'brick', roof: 'snow' },
    { x: 2340, w: 560, top: 540, wall: 'stone', roof: 'tiles' },
    { x: 3400, w: 300, top: 500, wall: 'brick', roof: 'tiles' },
    { x: 3820, w: 680, top: 480, wall: 'plaster', roof: 'ice' },
    { x: 4620, w: 280, top: 560, wall: 'brick', roof: 'tiles' },
    { x: 4900, w: 350, top: 430, wall: 'stone', roof: 'snow' },
    { x: 5600, w: 600, top: 450, wall: 'plaster', roof: 'tiles' },
    { x: 6340, w: 360, top: 520, wall: 'brick', roof: 'tiles' },
    { x: 6820, w: 580, top: 490, wall: 'stone', roof: 'snow' },
    { x: 7940, w: 560, top: 440, wall: 'plaster', roof: 'snow' },
    { x: 8640, w: 310, top: 520, wall: 'brick', roof: 'ice' },
    { x: 9070, w: 630, top: 480, wall: 'stone', roof: 'tiles' },
    { x: 10150, w: 750, top: 500, wall: 'plaster', roof: 'tiles' },
    { x: 10900, w: 400, top: 540, wall: 'brick', roof: 'snow' },
  ],

  platforms: [
    { type: 'mover', x: 2950, y: 530, w: 140, to: { x: 3260, y: 530 }, speed: 115 },
    { type: 'swing', x: 5340, y: 410, w: 130 },
    { type: 'plank', x: 7470, y: 470, w: 180 },
    { type: 'mover', x: 7720, y: 420, w: 160, to: { x: 7720, y: 520 }, speed: 60 },
    { type: 'mover', x: 9740, y: 500, w: 140, to: { x: 10010, y: 500 }, speed: 115 },
  ],

  props: [
    { type: 'crate', x: 600 },
    { type: 'sack', x: 300, solid: false },
    { type: 'lantern', x: 80, solid: false },
    { type: 'lantern', x: 1250, solid: false },
    { type: 'lantern', x: 3480, solid: false },
    { type: 'crate', x: 5720 },
    { type: 'lantern', x: 5640, solid: false },
    { type: 'barrels', x: 6550 },
    { type: 'lantern', x: 7000, solid: false },
    { type: 'sack', x: 8080, solid: false },
    { type: 'lantern', x: 9150, solid: false },
    { type: 'lantern', x: 10220, solid: false },
    { type: 'sack', x: 10650, solid: false },
  ],

  chimneys: [1350, 2650, 4200, 5900, 7150, 8250, 9400, 10400],

  checkpoints: [3470, 7990, 10260],

  signs: [
    { x: 230, text: 'A / D  of  ← →\nlopen' },
    { x: 470, text: 'Spatie  of  ↑\nspringen' },
    { x: 1130, text: 'Bij de schoorsteen:\ndruk op E' },
    { x: 2840, text: 'Spring op het\nrijdende plankje!' },
    { x: 3900, text: 'Pas op:\nglad ijs!' },
    { x: 10560, text: 'Bijna bij\nde finish!' },
  ],

  pepernoten: [
    [380, 500], [600, 420], [660, 470],
    [960, 450],
    [1550, 470],
    [1770, 400], [2020, 410], [2100, 410], [2270, 420],
    [3050, 470], [3150, 470], [3250, 470],
    [3550, 440],
    [3950, 420], [4050, 420], [4400, 420],
    [4760, 500], [5050, 370], [5150, 370],
    [5405, 350],
    [5650, 390], [6100, 390],
    [6280, 420], [6550, 330],
    [6950, 430], [7300, 430],
    [7560, 410], [7800, 350],
    [8040, 380], [8450, 380],
    [8800, 460], [9025, 430],
    [9200, 420], [9600, 420],
    [9850, 440], [9950, 440], [10050, 440],
    [10600, 440],
  ],

  finish: { x: 10780 },
};
