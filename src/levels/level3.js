// Wereld 1 – Level 3: De Winterstorm
//
// Nieuw in dit level: windvlagen. Een windzak en windstrepen kondigen een vlaag aan;
// tussen de vlagen is het even windstil. Opbouw (level-design: introduceren → oefenen → uitdagen):
//   1. rustig begin met glad ijs (bekend uit level 1)           → schoorsteen 1
//   2. eerste windzone met tegenwind op een breed, vlak stuk     → schoorsteen 2
//   3. trap omhoog en een rijdend plankje (zonder wind)          → schoorsteen 3
//   4. wind in de rug op ijs: niet te ver doorschieten!          → schoorsteen 4
//   5. planken en ijs                                            → schoorsteen 5
//   6. lange tegenwind-zone met kleine sprongen                  → schoorsteen 6–7
//   7. rijdend plankje naar de laatste schoorsteen en de finish  → schoorsteen 8

export default {
  id: 'w1-l3',
  name: 'De Winterstorm',
  world: 'Wereld 1',
  number: 3,
  tagline: 'Wacht op een windstilte en spring dan!',
  theme: 'storm',
  // leerlijn: erbij komen achtsten en derden
  learning: {
    title: 'Erbij: achtsten en derden',
    maxPerGroup: 2,
  },
  width: 10800,
  height: 980,
  spawn: { x: 150 },

  buildings: [
    { x: 0, w: 700, top: 800, wall: 'brick', roof: 'snow' },
    { x: 820, w: 520, top: 760, wall: 'plaster', roof: 'snow' },
    { x: 1460, w: 360, top: 720, wall: 'stone', roof: 'ice' },
    { x: 1820, w: 600, top: 700, wall: 'brick', roof: 'snow' },
    { x: 2520, w: 480, top: 700, wall: 'plaster', roof: 'tiles' },
    { x: 3100, w: 300, top: 640, wall: 'stone', roof: 'snow' },
    { x: 3400, w: 260, top: 540, wall: 'brick', roof: 'tiles' },
    { x: 4100, w: 560, top: 580, wall: 'plaster', roof: 'snow' },
    { x: 4760, w: 420, top: 620, wall: 'brick', roof: 'ice' },
    { x: 5300, w: 520, top: 660, wall: 'stone', roof: 'snow' },
    { x: 5920, w: 300, top: 600, wall: 'brick', roof: 'tiles' },
    { x: 6220, w: 300, top: 500, wall: 'stone', roof: 'snow' },
    // geen ijs vlak voor de tegenwind: hier moet je kunnen stilstaan en wachten
    { x: 7080, w: 560, top: 520, wall: 'plaster', roof: 'snow' },
    { x: 7740, w: 360, top: 600, wall: 'brick', roof: 'snow' },
    { x: 8200, w: 400, top: 560, wall: 'stone', roof: 'tiles' },
    { x: 8700, w: 340, top: 640, wall: 'plaster', roof: 'snow' },
    { x: 9140, w: 560, top: 600, wall: 'brick', roof: 'tiles' },
    { x: 10100, w: 700, top: 580, wall: 'stone', roof: 'snow' },
  ],

  platforms: [
    { type: 'mover', x: 3720, y: 560, w: 140, to: { x: 3960, y: 560 }, speed: 100 },
    { type: 'plank', x: 6600, y: 480, w: 160 },
    { type: 'swing', x: 6840, y: 460, w: 160 },
    { type: 'mover', x: 9740, y: 620, w: 160, to: { x: 9940, y: 620 }, speed: 100 },
  ],

  // windzones: force < 0 = tegenwind (naar links), > 0 = wind in de rug
  wind: [
    { x: 1820, w: 1180, force: -110, on: 2.2, off: 2.2 },
    { x: 4700, w: 800, force: 110, on: 2.0, off: 2.4, phase: 1 },
    { x: 7700, w: 1500, force: -120, on: 2.4, off: 2.0, phase: 0.5 },
  ],

  props: [
    { type: 'lantern', x: 80, solid: false },
    { type: 'sack', x: 520, solid: false },
    { type: 'lantern', x: 900, solid: false },
    { type: 'crate', x: 2800 },
    { type: 'lantern', x: 3160, solid: false },
    { type: 'lantern', x: 4160, solid: false },
    { type: 'lantern', x: 5360, solid: false },
    { type: 'barrels', x: 6050 },
    { type: 'lantern', x: 7140, solid: false },
    { type: 'sack', x: 8260, solid: false },
    { type: 'lantern', x: 9200, solid: false },
    { type: 'sack', x: 10560, solid: false },
  ],

  chimneys: [1100, 2200, 4380, 5600, 7300, 8400, 9400, 10350],

  checkpoints: [1880, 4150, 7120, 9180],

  signs: [
    { x: 300, text: 'De Winterstorm!\nLet op de wind' },
    { x: 1600, text: 'Tegenwind:\nwacht even!' },
    { x: 4220, text: 'Wind in de rug:\nniet te ver!' },
    { x: 7460, text: 'Lange storm:\nkleine sprongen' },
  ],

  pepernoten: [
    [300, 740], [560, 740],
    [760, 700], [1220, 700],
    [1400, 660], [1640, 660],
    [1950, 640], [2470, 620], [2700, 640], [2950, 640],
    [3050, 600], [3250, 580], [3530, 480],
    [3800, 500], [3900, 500], [4000, 500],
    [4250, 520], [4600, 520],
    [4710, 560], [4950, 560], [5240, 590], [5450, 600],
    [5870, 560], [6050, 480], [6350, 440],
    [6680, 420], [6920, 400], [7180, 460], [7500, 460],
    [7690, 540], [7900, 540], [8150, 500], [8350, 500], [8650, 560], [8850, 580], [9090, 550],
    [9300, 540], [9800, 560], [9900, 560], [10200, 520], [10600, 520],
  ],

  finish: { x: 10700 },
};
