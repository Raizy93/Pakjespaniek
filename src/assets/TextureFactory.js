// Assetbeheer: genereert alle textures en animaties één keer bij het opstarten.
// Er worden geen afbeeldingsbestanden geladen – alles is code-gegenereerd
// (snel laden, scherp, en geen licentievragen).
import { makeBackground, makeProps, makeGifts } from './worldArt.js';
import { makeUiArt } from './uiArt.js';
import { drawPiet, pietAnimations, PIET_FRAME } from './piet.js';

const ANIM_SPEC = {
  idle: { rate: 6, repeat: -1 },
  run: { rate: 15, repeat: -1 },
  jump: { rate: 8, repeat: -1 },
  fall: { rate: 8, repeat: -1 },
  land: { rate: 14, repeat: 0 },
  deliver: { rate: 14, repeat: 0 },
  celebrate: { rate: 8, repeat: -1 },
};

export function generateAllTextures(scene) {
  makeBackground(scene);
  makeProps(scene);
  makeGifts(scene);
  makeUiArt(scene);
  makePiet(scene);
}

function makePiet(scene) {
  if (scene.textures.exists('piet')) return;
  const anims = pietAnimations();
  const frames = [];
  for (const [name, poses] of Object.entries(anims)) poses.forEach((pose, i) => frames.push({ name: `${name}_${i}`, pose }));
  const cols = 10;
  const { w, h } = PIET_FRAME;
  const rows = Math.ceil(frames.length / cols);
  const tex = scene.textures.createCanvas('piet', cols * w, rows * h);
  const ctx = tex.getContext();
  frames.forEach((f, i) => {
    const x = (i % cols) * w;
    const y = Math.floor(i / cols) * h;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawPiet(ctx, x, y, f.pose);
    ctx.restore();
    tex.add(f.name, 0, x, y, w, h);
  });
  tex.refresh();

  for (const [name, poses] of Object.entries(anims)) {
    const spec = ANIM_SPEC[name];
    scene.anims.create({
      key: `piet-${name}`,
      frames: poses.map((_, i) => ({ key: 'piet', frame: `${name}_${i}` })),
      frameRate: spec.rate,
      repeat: spec.repeat,
    });
  }

  // Grote, scherpe versies voor menu en resultatenscherm
  const big = (key, pose) => {
    const t = scene.textures.createCanvas(key, w * 2.5, h * 2.5);
    const c = t.getContext();
    c.scale(2.5, 2.5);
    drawPiet(c, 0, 0, pose);
    t.refresh();
  };
  big('piet_big', anims.idle[0]);
  big('piet_big_cheer', anims.celebrate[1]);
  big('piet_big_throw', anims.deliver[2]);

  scene.anims.create({ key: 'bird-flap', frames: [{ key: 'bird_up' }, { key: 'bird_down' }], frameRate: 6, repeat: -1 });
}
