// Wereld-assets: achtergrond, gebouwen, schoorstenen, props en verzamelitems.
import {
  rng, shade, mix, rgba, poly, facetRect, facetPoly, facetCircle, radialGlow, canvasTexture, chamferPts,
} from './lowpoly.js';

const PAL = {
  skyTop: '#070d26',
  skyMid: '#16235a',
  skyLow: '#2c3a7c',
  far: '#18224f',
  mid: '#25306a',
  midRoof: '#2f2c5c',
  windowWarm: '#ffcf5a',
  windowHot: '#ff9a3c',
  windowDark: '#1a2044',
  brick: '#8a412c',
  plaster: '#5d6994',
  stone: '#6c6680',
  tile: '#c8322f',
  snow: '#eef3ff',
  ice: '#9fd8f5',
  wood: '#9a6537',
  gold: '#f2b632',
};

// ---------------------------------------------------------------- achtergrond
export function makeBackground(scene) {
  canvasTexture(scene, 'sky', 1280, 720, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, PAL.skyTop);
    g.addColorStop(0.55, PAL.skyMid);
    g.addColorStop(1, PAL.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // grote, zachte facetten in de lucht voor de low-poly sfeer
    const r = rng(42);
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h * 0.7;
      const s = 80 + r() * 160;
      poly(ctx, [[x, y], [x + s, y + s * 0.3 * r()], [x + s * 0.4 * r(), y + s * 0.7]], r() > 0.5 ? '#5a6cc0' : '#0a1030');
    }
    ctx.globalAlpha = 1;
    // sterren
    for (let i = 0; i < 140; i++) {
      const x = r() * w;
      const y = r() * h * 0.62;
      const s = r() < 0.12 ? 2.2 : r() * 1.3 + 0.5;
      ctx.fillStyle = rgba('#ffffff', 0.35 + r() * 0.6);
      if (s > 2) {
        poly(ctx, [[x, y - s * 2], [x + s * 0.6, y], [x, y + s * 2], [x - s * 0.6, y]], rgba('#fff6d8', 0.9));
        poly(ctx, [[x - s * 2, y], [x, y - s * 0.6], [x + s * 2, y], [x, y + s * 0.6]], rgba('#fff6d8', 0.9));
      } else {
        ctx.fillRect(x, y, s, s);
      }
    }
  });

  canvasTexture(scene, 'moon', 300, 300, (ctx) => {
    radialGlow(ctx, 150, 150, 150, '#fff2b0', 0.35);
    facetCircle(ctx, 150, 150, 74, 74, '#f8e9a6', { sides: 14, light: 0.16, variance: 0.04, seed: 9 });
    // kraters
    const cr = [[128, 128, 13], [172, 160, 10], [140, 182, 8], [176, 118, 6], [118, 165, 5]];
    for (const [x, y, s] of cr) facetCircle(ctx, x, y, s, s * 0.9, '#e4cf86', { sides: 7, light: -0.2, seed: x });
  });

  const cloud = (key, w, h, seed) =>
    canvasTexture(scene, key, w, h, (ctx) => {
      const r = rng(seed);
      const base = h * 0.78;
      const bumps = [];
      const n = 5 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const bx = w * 0.1 + t * w * 0.8;
        const by = base - (Math.sin(t * Math.PI) * h * 0.5 + r() * h * 0.15);
        bumps.push([bx, by]);
      }
      const pts = [[w * 0.04, base], ...bumps, [w * 0.96, base]];
      facetPoly(ctx, [...pts, [w * 0.85, h * 0.95], [w * 0.15, h * 0.95]], '#33417f', { cell: 22, light: 0.3, variance: 0.06, seed });
      // maanlicht-rand bovenop
      ctx.strokeStyle = rgba('#aab8ff', 0.45);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.stroke();
    });
  cloud('cloud1', 320, 120, 3);
  cloud('cloud2', 240, 96, 8);
  cloud('cloud3', 380, 130, 15);

  // verre dorpssilhouet (naadloos herhaalbaar)
  canvasTexture(scene, 'far_town', 1280, 300, (ctx, w, h) => {
    const r = rng(77);
    let x = 0;
    while (x < w) {
      const hw = Math.min(40 + r() * 70, w - x);
      const hh = 70 + r() * 110;
      const top = h - hh;
      const type = r();
      const pts = [[x, h], [x, top + 20]];
      if (type < 0.4) pts.push([x + hw / 2, top - 22]);
      else if (type < 0.7) pts.push([x + hw * 0.2, top + 5], [x + hw * 0.2, top - 6], [x + hw * 0.8, top - 6], [x + hw * 0.8, top + 5]);
      else pts.push([x + hw * 0.5, top]);
      pts.push([x + hw, top + 20], [x + hw, h]);
      poly(ctx, pts, shade(PAL.far, (r() - 0.5) * 0.12));
      for (let wy = top + 30; wy < h - 20; wy += 22) {
        for (let wx = x + 8; wx < x + hw - 10; wx += 16) {
          if (r() < 0.22) {
            ctx.fillStyle = rgba(PAL.windowWarm, 0.5 + r() * 0.4);
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }
      x += hw;
    }
    // kerktoren
    const cx = 640;
    poly(ctx, [[cx - 26, h], [cx - 26, 110], [cx + 26, 110], [cx + 26, h]], shade(PAL.far, 0.04));
    poly(ctx, [[cx - 30, 112], [cx, 20], [cx + 30, 112]], shade(PAL.far, 0.08));
    poly(ctx, [[cx - 2, 20], [cx - 2, 0], [cx + 2, 0], [cx + 2, 20]], shade(PAL.far, 0.1));
    ctx.fillStyle = rgba(PAL.windowWarm, 0.85);
    ctx.beginPath();
    ctx.arc(cx, 150, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  // middenlaag met trapgevels en klokgevels
  canvasTexture(scene, 'mid_town', 1280, 380, (ctx, w, h) => {
    const r = rng(1234);
    let x = 0;
    let i = 0;
    while (x < w - 10) {
      let hw = 90 + r() * 80;
      if (w - x - hw < 90) hw = w - x;
      const hh = 150 + r() * 130;
      drawBackHouse(ctx, x, hw, h, hh, i % 3, r, PAL.mid, 0.8);
      x += hw;
      i++;
    }
  });

  // mist/donkerte in steegjes tussen de huizen
  canvasTexture(scene, 'alley_fog', 64, 200, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(8,12,34,0)');
    g.addColorStop(0.6, 'rgba(8,12,34,0.75)');
    g.addColorStop(1, 'rgba(5,8,22,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

// Achtergrondhuis met een Hollandse gevel (0 = trapgevel, 1 = klokgevel, 2 = puntdak)
function drawBackHouse(ctx, x, w, ground, h, type, r, color, windowChance) {
  const top = ground - h;
  const col = shade(color, (r() - 0.5) * 0.16);
  let outline;
  if (type === 0) {
    const steps = 3;
    const sw = w / (steps * 2 + 1);
    outline = [[x, ground], [x, top + 40]];
    for (let s = 0; s < steps; s++) outline.push([x + sw * s, top + 40 - s * 16], [x + sw * (s + 1), top + 40 - s * 16]);
    outline.push([x + sw * steps, top - 10], [x + w - sw * steps, top - 10]);
    for (let s = steps - 1; s >= 0; s--) outline.push([x + w - sw * (s + 1), top + 40 - s * 16], [x + w - sw * s, top + 40 - s * 16]);
    outline.push([x + w, top + 40], [x + w, ground]);
  } else if (type === 1) {
    outline = [[x, ground], [x, top + 40], [x + w * 0.15, top + 30], [x + w * 0.22, top + 5], [x + w * 0.35, top - 12], [x + w * 0.5, top - 18], [x + w * 0.65, top - 12], [x + w * 0.78, top + 5], [x + w * 0.85, top + 30], [x + w, top + 40], [x + w, ground]];
  } else {
    outline = [[x, ground], [x, top + 40], [x + w / 2, top - 30], [x + w, top + 40], [x + w, ground]];
  }
  facetPoly(ctx, outline, col, { cell: 30, light: 0.18, variance: 0.05, seed: Math.floor(r() * 1000) });
  if (type === 2) {
    // sneeuw op het puntdak
    poly(ctx, [[x - 2, top + 42], [x + w / 2, top - 32], [x + w + 2, top + 42], [x + w - 10, top + 40], [x + w / 2, top - 18], [x + 10, top + 40]], rgba(PAL.snow, 0.75));
  } else {
    poly(ctx, [[x + w * 0.3, top - 8], [x + w * 0.7, top - 8], [x + w * 0.68, top - 2], [x + w * 0.32, top - 2]], rgba(PAL.snow, 0.6));
  }
  // rechterzijkant donkerder voor diepte
  ctx.fillStyle = 'rgba(5,8,25,0.25)';
  ctx.fillRect(x + w - 8, top + 40, 8, ground - top - 40);
  // ramen
  for (let wy = top + 58; wy < ground - 40; wy += 48) {
    for (let wx = x + 16; wx < x + w - 30; wx += 34) {
      const lit = r() < windowChance * 0.55;
      ctx.fillStyle = lit ? PAL.windowWarm : shade(PAL.windowDark, 0.05);
      ctx.fillRect(wx, wy, 16, 24);
      if (lit) {
        ctx.fillStyle = rgba(PAL.windowHot, 0.5);
        ctx.fillRect(wx, wy + 12, 16, 12);
      }
      ctx.fillStyle = rgba('#0b1233', 0.6);
      ctx.fillRect(wx + 7, wy, 2, 24);
      ctx.fillRect(wx, wy + 11, 16, 2);
    }
  }
}

// ---------------------------------------------------------------- gebouwen
const WALL = { brick: PAL.brick, plaster: PAL.plaster, stone: PAL.stone };
export const ROOF_OVERHANG = 10;
export const ROOF_PAD = 40; // ruimte boven het loopvlak in de texture

export function makeBuildingTexture(scene, key, b, seed, worldHeight = 720) {
  const w = b.w + ROOF_OVERHANG * 2;
  const h = worldHeight - b.top + ROOF_PAD + 20;
  return canvasTexture(scene, key, w, h, (ctx) => {
    const r = rng(seed);
    const fx = ROOF_OVERHANG;
    const fy = ROOF_PAD; // loopvlak
    const fw = b.w;
    const fh = h - fy;
    const wall = WALL[b.wall] ?? PAL.brick;
    facetRect(ctx, fx, fy, fw, fh, wall, { cell: 34, light: 0.18, variance: 0.05, seed });

    // muurtextuur
    ctx.save();
    if (b.wall === 'brick') {
      ctx.strokeStyle = rgba('#2a0f08', 0.28);
      ctx.lineWidth = 1;
      for (let y = fy + 30, row = 0; y < h; y += 13, row++) {
        ctx.beginPath();
        ctx.moveTo(fx, y);
        ctx.lineTo(fx + fw, y);
        ctx.stroke();
        for (let x = fx + (row % 2 ? 14 : 0); x < fx + fw; x += 28) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 13);
          ctx.stroke();
        }
      }
    } else if (b.wall === 'stone') {
      ctx.strokeStyle = rgba('#14101e', 0.3);
      for (let y = fy + 30, row = 0; y < h; y += 30, row++) {
        ctx.beginPath();
        ctx.moveTo(fx, y);
        ctx.lineTo(fx + fw, y);
        ctx.stroke();
        for (let x = fx + (row % 2 ? 26 : 0); x < fx + fw; x += 52) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 30);
          ctx.stroke();
        }
      }
    } else {
      // gepleisterd: hoekstenen
      for (let y = fy + 28; y < h; y += 26) {
        const k = ((y / 26) | 0) % 2 ? 18 : 26;
        poly(ctx, chamferPts(fx, y, k, 22, 2), shade(wall, 0.18));
        poly(ctx, chamferPts(fx + fw - k, y, k, 22, 2), shade(wall, 0.05));
      }
    }
    ctx.restore();

    // ramen in een raster
    const cols = Math.max(1, Math.floor((fw - 40) / 110));
    const spacing = fw / cols;
    for (let wy = fy + 62; wy < h - 70; wy += 120) {
      for (let c = 0; c < cols; c++) {
        const wx = fx + spacing * (c + 0.5) - 22;
        drawWindow(ctx, wx, wy, 44, 60, r() < 0.62, r);
      }
    }

    // kroonlijst onder het dak
    facetRect(ctx, fx - 4, fy + 14, fw + 8, 12, shade(wall, 0.25), { cell: 14, light: 0.3, seed: seed + 1 });
    ctx.fillStyle = 'rgba(5,8,25,0.35)';
    ctx.fillRect(fx, fy + 26, fw, 5);

    // diepte: lichte linkerrand, donkere rechterzijde
    ctx.fillStyle = rgba('#ffffff', 0.08);
    ctx.fillRect(fx, fy + 20, 4, fh);
    const sg = ctx.createLinearGradient(fx + fw - 26, 0, fx + fw, 0);
    sg.addColorStop(0, 'rgba(5,8,25,0)');
    sg.addColorStop(1, 'rgba(5,8,25,0.5)');
    ctx.fillStyle = sg;
    ctx.fillRect(fx + fw - 26, fy + 20, 26, fh);

    // dakrand
    drawRoofCap(ctx, b.roof, 0, fy, w, seed);
  });
}

function drawWindow(ctx, x, y, w, h, lit, r) {
  if (lit) radialGlow(ctx, x + w / 2, y + h / 2, 60, PAL.windowHot, 0.22);
  // kozijn
  poly(ctx, chamferPts(x - 4, y - 4, w + 8, h + 8, 3), '#e8e1d2', shade('#e8e1d2', -0.3), 1);
  if (lit) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#ffe08a');
    g.addColorStop(1, PAL.windowHot);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // facet-glans
    poly(ctx, [[x, y], [x + w * 0.6, y], [x, y + h * 0.5]], rgba('#fff6d0', 0.35));
  } else {
    ctx.fillStyle = PAL.windowDark;
    ctx.fillRect(x, y, w, h);
    poly(ctx, [[x + w * 0.2, y], [x + w * 0.55, y], [x, y + h * 0.6], [x, y + h * 0.25]], rgba('#8fa2ff', 0.18));
  }
  // roeden
  ctx.fillStyle = '#e8e1d2';
  ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
  ctx.fillRect(x, y + h * 0.45, w, 3);
  // vensterbank
  poly(ctx, [[x - 7, y + h + 3], [x + w + 7, y + h + 3], [x + w + 4, y + h + 9], [x - 4, y + h + 9]], '#cfc6b4');
  // luiken bij sommige ramen
  if (r() < 0.35) {
    const lc = r() < 0.5 ? '#2f6b4a' : '#8c2a2a';
    for (const sx of [x - 16, x + w + 4]) {
      facetRect(ctx, sx, y, 12, h, lc, { cell: 8, seed: Math.floor(sx) });
      ctx.fillStyle = rgba('#000000', 0.25);
      for (let ly = y + 6; ly < y + h; ly += 8) ctx.fillRect(sx + 2, ly, 8, 2);
    }
  }
}

function drawRoofCap(ctx, roof, x, y, w, seed) {
  const r = rng(seed + 99);
  if (roof === 'tiles') {
    // rij dakpannen
    facetRect(ctx, x, y - 2, w, 24, shade(PAL.tile, -0.25), { cell: 12, seed });
    const tw = 20;
    for (let row = 0; row < 2; row++) {
      for (let tx = x + (row ? tw / 2 : 0) - tw / 2; tx < x + w; tx += tw) {
        const ty = y - 2 + row * 11;
        const pts = [[tx, ty], [tx + tw, ty], [tx + tw, ty + 9], [tx + tw * 0.75, ty + 13], [tx + tw * 0.25, ty + 13], [tx, ty + 9]];
        const l = (r() - 0.5) * 0.12 + (row ? -0.08 : 0.06);
        poly(ctx, pts, shade(PAL.tile, l), shade(PAL.tile, -0.35), 1);
        poly(ctx, [[tx + 2, ty + 1], [tx + tw * 0.5, ty + 1], [tx + 2, ty + 7]], rgba('#ff9a8a', 0.35));
      }
    }
    // nok/loopvlak-highlight
    ctx.fillStyle = shade(PAL.tile, 0.25);
    ctx.fillRect(x, y - 3, w, 3);
  } else if (roof === 'snow' || roof === 'ice') {
    const base = roof === 'snow' ? PAL.snow : PAL.ice;
    facetRect(ctx, x + 4, y + 6, w - 8, 14, '#8a8aa0', { cell: 14, seed });
    const pts = [[x, y + 10]];
    for (let sx = x; sx <= x + w; sx += 16) pts.push([sx, y - 4 - r() * 3]);
    pts.push([x + w, y + 10]);
    for (let sx = x + w; sx >= x; sx -= 18) pts.push([sx, y + 10 + r() * 6]);
    facetPoly(ctx, pts, base, { cell: 12, light: 0.2, variance: 0.04, seed: seed + 3 });
    // ijspegels
    for (let sx = x + 12; sx < x + w - 10; sx += 22 + r() * 30) {
      const l = 8 + r() * 14;
      poly(ctx, [[sx, y + 12], [sx + 6, y + 12], [sx + 3, y + 12 + l]], rgba(roof === 'ice' ? '#d8f3ff' : '#ffffff', 0.9));
    }
    if (roof === 'ice') {
      // glanzende strepen = glad
      ctx.strokeStyle = rgba('#ffffff', 0.85);
      ctx.lineWidth = 2;
      for (let sx = x + 20; sx < x + w - 30; sx += 70) {
        ctx.beginPath();
        ctx.moveTo(sx, y + 3);
        ctx.lineTo(sx + 26, y);
        ctx.stroke();
      }
    }
  }
}

// ---------------------------------------------------------------- props
export function makeProps(scene) {
  // schoorsteen
  canvasTexture(scene, 'chimney', 84, 124, (ctx) => {
    facetRect(ctx, 10, 18, 64, 106, PAL.brick, { cell: 14, light: 0.25, seed: 4 });
    ctx.strokeStyle = rgba('#2a0f08', 0.35);
    for (let y = 30, row = 0; y < 124; y += 12, row++) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(74, y);
      ctx.stroke();
      for (let x = 10 + (row % 2 ? 10 : 0); x < 74; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 12);
        ctx.stroke();
      }
    }
    const sg = ctx.createLinearGradient(54, 0, 74, 0);
    sg.addColorStop(0, 'rgba(5,8,25,0)');
    sg.addColorStop(1, 'rgba(5,8,25,0.45)');
    ctx.fillStyle = sg;
    ctx.fillRect(54, 18, 20, 106);
    // kap
    facetPoly(ctx, chamferPts(2, 2, 80, 20, 3), '#9e98ac', { cell: 10, light: 0.3, seed: 5, edge: '#5a5468' });
    // opening
    poly(ctx, [[14, 6], [70, 6], [66, 13], [18, 13]], '#120a14');
  });

  canvasTexture(scene, 'check_badge', 52, 52, (ctx) => {
    facetCircle(ctx, 26, 26, 24, 24, '#2c8a43', { sides: 10, light: 0.1 });
    facetCircle(ctx, 26, 26, 20, 20, '#3fbf5a', { sides: 10, light: 0.25 });
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(15, 27);
    ctx.lineTo(23, 35);
    ctx.lineTo(38, 18);
    ctx.stroke();
  });

  canvasTexture(scene, 'cross_badge', 52, 52, (ctx) => {
    facetCircle(ctx, 26, 26, 24, 24, '#8e1f1f', { sides: 10, light: 0.1 });
    facetCircle(ctx, 26, 26, 20, 20, '#d9443a', { sides: 10, light: 0.25 });
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(18, 18);
    ctx.lineTo(34, 34);
    ctx.moveTo(34, 18);
    ctx.lineTo(18, 34);
    ctx.stroke();
  });

  canvasTexture(scene, 'crate', 70, 76, (ctx) => {
    // bovenvlak (3D)
    facetPoly(ctx, [[3, 12], [12, 2], [70, 2], [67, 12]], shade(PAL.wood, 0.25), { cell: 10, seed: 2 });
    facetRect(ctx, 3, 12, 64, 64, PAL.wood, { cell: 12, light: 0.25, seed: 3 });
    // zijvlak
    poly(ctx, [[67, 12], [70, 2], [70, 66], [67, 76]], shade(PAL.wood, -0.35));
    ctx.strokeStyle = shade(PAL.wood, -0.4);
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 14, 60, 60);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(9, 18);
    ctx.lineTo(61, 70);
    ctx.stroke();
    ctx.strokeStyle = shade(PAL.wood, 0.15);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(60, 68);
    ctx.stroke();
  });

  const barrel = (ctx, x, y) => {
    const pts = [[x + 6, y], [x + 46, y], [x + 52, y + 14], [x + 52, y + 46], [x + 46, y + 60], [x + 6, y + 60], [x, y + 46], [x, y + 14]];
    facetPoly(ctx, pts, '#8a5a30', { cell: 10, light: 0.3, seed: x + y });
    for (const hy of [y + 10, y + 48]) {
      poly(ctx, [[x + 1, hy], [x + 51, hy], [x + 51, hy + 5], [x + 1, hy + 5]], '#4e4a5c');
    }
    ctx.strokeStyle = rgba('#2a160a', 0.35);
    for (const sx of [x + 14, x + 26, x + 38]) {
      ctx.beginPath();
      ctx.moveTo(sx, y + 2);
      ctx.lineTo(sx, y + 58);
      ctx.stroke();
    }
    poly(ctx, [[x + 6, y], [x + 46, y], [x + 42, y + 5], [x + 10, y + 5]], '#b98754');
  };
  canvasTexture(scene, 'barrels', 108, 122, (ctx) => {
    barrel(ctx, 0, 62);
    barrel(ctx, 54, 62);
    barrel(ctx, 27, 2);
  });

  canvasTexture(scene, 'sack', 74, 74, (ctx) => {
    // cadeautje dat eruit steekt
    facetRect(ctx, 26, 4, 24, 22, '#c8322f', { cell: 8, seed: 3 });
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(36, 4, 4, 22);
    facetCircle(ctx, 38, 4, 7, 4, PAL.gold, { sides: 6 });
    const pts = [[14, 22], [60, 22], [70, 50], [64, 70], [10, 70], [4, 50]];
    facetPoly(ctx, pts, '#a8774a', { cell: 10, light: 0.3, seed: 8 });
    poly(ctx, [[20, 22], [54, 22], [50, 28], [24, 28]], '#7a5232');
    ctx.strokeStyle = '#5c3b22';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 40, 18, 16);
  });

  canvasTexture(scene, 'lantern', 50, 140, (ctx) => {
    poly(ctx, [[22, 40], [28, 40], [29, 134], [21, 134]], '#2b2a3c');
    poly(ctx, [[16, 130], [34, 130], [37, 140], [13, 140]], '#3a3850');
    poly(ctx, [[26, 40], [29, 40], [29, 134], [26, 134]], '#45435c');
    // lamp
    poly(ctx, [[12, 14], [38, 14], [34, 40], [16, 40]], '#ffd36b');
    poly(ctx, [[12, 14], [25, 14], [21, 40], [16, 40]], '#ffe7a6');
    ctx.strokeStyle = '#2b2a3c';
    ctx.lineWidth = 3;
    ctx.strokeRect(13, 14, 24, 26);
    ctx.beginPath();
    ctx.moveTo(25, 14);
    ctx.lineTo(25, 40);
    ctx.stroke();
    poly(ctx, [[8, 14], [25, 2], [42, 14]], '#2b2a3c');
    poly(ctx, [[14, 40], [36, 40], [32, 46], [18, 46]], '#2b2a3c');
  });

  canvasTexture(scene, 'glow', 128, 128, (ctx) => radialGlow(ctx, 64, 64, 64, '#ffffff', 1));

  canvasTexture(scene, 'puff', 64, 64, (ctx) => {
    ctx.globalAlpha = 0.85;
    facetCircle(ctx, 32, 32, 28, 26, '#c9cfe6', { sides: 8, light: 0.3, seed: 2 });
  });

  canvasTexture(scene, 'spark', 22, 22, (ctx) => {
    poly(ctx, [[11, 0], [14, 8], [22, 11], [14, 14], [11, 22], [8, 14], [0, 11], [8, 8]], '#fff3b0');
    poly(ctx, [[11, 0], [14, 8], [11, 11], [8, 8]], '#ffffff');
  });

  canvasTexture(scene, 'confetti', 12, 8, (ctx) => {
    poly(ctx, [[0, 0], [12, 1], [11, 8], [1, 7]], '#ffffff');
  });

  canvasTexture(scene, 'pepernoot', 34, 32, (ctx) => {
    ctx.fillStyle = 'rgba(5,8,25,0.3)';
    ctx.beginPath();
    ctx.ellipse(17, 28, 13, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    facetCircle(ctx, 17, 15, 15, 13, '#b5713a', { sides: 9, light: 0.35, variance: 0.06, seed: 6 });
    facetCircle(ctx, 15, 12, 8, 6, '#cf8c50', { sides: 7, light: 0.3, seed: 4 });
    ctx.fillStyle = '#6b3a1a';
    for (const [x, y] of [[10, 17], [20, 10], [23, 19], [14, 22]]) ctx.fillRect(x, y, 2.5, 2.5);
  });

  // slagboom-poort
  canvasTexture(scene, 'gate_post', 30, 120, (ctx) => {
    facetRect(ctx, 6, 10, 18, 110, '#e8e6f0', { cell: 10, light: 0.3, seed: 2 });
    for (let y = 10; y < 120; y += 28) poly(ctx, [[6, y], [24, y], [24, y + 14], [6, y + 14]], '#c8322f');
    facetPoly(ctx, chamferPts(2, 0, 26, 14, 3), PAL.gold, { cell: 8, light: 0.3 });
  });
  canvasTexture(scene, 'gate_bar', 150, 18, (ctx) => {
    facetRect(ctx, 0, 2, 150, 14, '#f4f2fa', { cell: 10, light: 0.3, seed: 6 });
    for (let x = 0; x < 150; x += 30) poly(ctx, [[x, 2], [x + 15, 2], [x + 15, 16], [x, 16]], '#c8322f');
    facetCircle(ctx, 9, 9, 8, 8, PAL.gold, { sides: 6 });
  });
  canvasTexture(scene, 'gate_beam', 40, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,214,107,0)');
    g.addColorStop(0.5, 'rgba(255,214,107,0.55)');
    g.addColorStop(1, 'rgba(255,214,107,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,1)');
    v.addColorStop(0.3, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  });

  // checkpoint-vaandel (uit / aan)
  const banner = (key, on) =>
    canvasTexture(scene, key, 70, 140, (ctx) => {
      poly(ctx, [[8, 6], [13, 6], [13, 140], [8, 140]], '#8a6a3a');
      poly(ctx, [[2, 132], [20, 132], [22, 140], [0, 140]], '#5a4630');
      facetCircle(ctx, 10.5, 6, 5, 5, PAL.gold, { sides: 6 });
      ctx.fillRect(13, 14, 46, 4);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(13, 14, 46, 4);
      const flag = [[14, 18], [58, 18], [58, 82], [36, 70], [14, 82]];
      facetPoly(ctx, flag, on ? '#d8352f' : '#3a3f63', { cell: 10, light: 0.3, seed: 4 });
      // mijter-embleem
      const ec = on ? PAL.gold : '#5b6190';
      poly(ctx, [[26, 56], [26, 40], [36, 28], [46, 40], [46, 56]], ec);
      ctx.fillStyle = on ? '#d8352f' : '#3a3f63';
      ctx.fillRect(34.5, 36, 3, 16);
      ctx.fillRect(30, 42, 12, 3);
    });
  banner('checkpoint_off', false);
  banner('checkpoint_on', true);

  canvasTexture(scene, 'finish_flag', 110, 180, (ctx) => {
    poly(ctx, [[10, 8], [17, 8], [17, 180], [10, 180]], '#6a4a2a');
    facetCircle(ctx, 13.5, 8, 7, 7, PAL.gold, { sides: 7 });
    const cols = 6;
    const rows = 4;
    const fw = 88;
    const fh = 60;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = 17 + (c * fw) / cols;
        const wave = Math.sin(c * 0.9) * 5;
        const wave2 = Math.sin((c + 1) * 0.9) * 5;
        const y0 = 16 + (r * fh) / rows;
        const pts = [[x0, y0 + wave], [x0 + fw / cols, y0 + wave2], [x0 + fw / cols, y0 + fh / rows + wave2], [x0, y0 + fh / rows + wave]];
        const dark = (r + c) % 2 === 0;
        poly(ctx, pts, dark ? shade('#1b1b2a', c * 0.03) : shade('#f4f4fa', -c * 0.03));
      }
    }
  });

  canvasTexture(scene, 'sign_board', 250, 120, (ctx) => {
    poly(ctx, [[40, 70], [50, 70], [50, 120], [40, 120]], '#5e4026');
    poly(ctx, [[200, 70], [210, 70], [210, 120], [200, 120]], '#5e4026');
    facetPoly(ctx, chamferPts(4, 4, 242, 78, 8), '#a8743f', { cell: 16, light: 0.25, seed: 12, edge: '#5e4026', edgeWidth: 3 });
    ctx.strokeStyle = rgba('#5e4026', 0.4);
    ctx.lineWidth = 1.5;
    for (const y of [30, 56]) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(240, y);
      ctx.stroke();
    }
  });

  canvasTexture(scene, 'arrow_sign', 130, 110, (ctx) => {
    poly(ctx, [[52, 40], [62, 40], [62, 110], [52, 110]], '#5e4026');
    facetPoly(ctx, [[6, 14], [96, 14], [96, 2], [126, 30], [96, 58], [96, 46], [6, 46]], '#a8743f', { cell: 14, light: 0.3, seed: 3, edge: '#5e4026', edgeWidth: 3 });
  });

  // windzak (wijst de wind aan) en windstreep/sneeuwvlok-deeltjes
  canvasTexture(scene, 'windsock_pole', 16, 150, (ctx) => {
    poly(ctx, [[5, 6], [11, 6], [11, 150], [5, 150]], '#4a4860');
    poly(ctx, [[8, 6], [11, 6], [11, 150], [8, 150]], '#6a6884');
    facetCircle(ctx, 8, 6, 5, 5, PAL.gold, { sides: 6 });
  });
  canvasTexture(scene, 'windsock', 96, 40, (ctx) => {
    // kegel van brede ring (links, aan de paal) naar smal uiteinde (rechts)
    const seg = 4;
    for (let i = 0; i < seg; i++) {
      const x0 = 4 + i * 22;
      const x1 = x0 + 22;
      const h0 = 30 - i * 5;
      const h1 = 30 - (i + 1) * 5;
      const pts = [[x0, 20 - h0 / 2], [x1, 20 - h1 / 2], [x1, 20 + h1 / 2], [x0, 20 + h0 / 2]];
      facetPoly(ctx, pts, i % 2 ? '#f4f2fa' : '#d63a32', { cell: 8, light: 0.3, seed: i });
    }
    poly(ctx, [[2, 4], [6, 4], [6, 36], [2, 36]], PAL.gold);
  });
  canvasTexture(scene, 'streak', 96, 6, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 96, 0);
    g.addColorStop(0, 'rgba(230,240,255,0)');
    g.addColorStop(0.5, 'rgba(240,246,255,0.95)');
    g.addColorStop(1, 'rgba(230,240,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 1.5, 96, 3);
  });
  canvasTexture(scene, 'snowflake', 10, 10, (ctx) => {
    poly(ctx, [[5, 0], [7, 3], [10, 5], [7, 7], [5, 10], [3, 7], [0, 5], [3, 3]], 'rgba(244,247,255,0.95)');
  });

  // vogel (2 frames)
  const bird = (key, up) =>
    canvasTexture(scene, key, 48, 32, (ctx) => {
      facetPoly(ctx, [[6, 18], [20, 12], [36, 14], [44, 18], [36, 22], [18, 24]], '#8d86a8', { cell: 6, light: 0.3 });
      poly(ctx, [[44, 17], [48, 18], [44, 20]], '#f2b632');
      const wing = up ? [[18, 16], [30, 16], [14, 0]] : [[18, 18], [30, 18], [16, 31]];
      facetPoly(ctx, wing, '#a49dc0', { cell: 6, light: 0.3 });
      ctx.fillStyle = '#1b1630';
      ctx.fillRect(37, 15, 2, 2);
    });
  bird('bird_up', true);
  bird('bird_down', false);
}

/** Platformtexture op maat (plank, schommel of rijdend karretje). */
export function makePlatformTexture(scene, type, w) {
  const key = `plat_${type}_${w}`;
  if (type === 'crumble') {
    // losse dakpannen met barsten: zakt weg als je erop blijft staan
    canvasTexture(scene, key, w, 30, (ctx) => {
      facetRect(ctx, 0, 6, w, 16, shade(PAL.tile, -0.3), { cell: 10, seed: w + 3 });
      const tw = 22;
      for (let tx = 0; tx < w; tx += tw) {
        const pts = [[tx, 2], [tx + tw - 2, 2], [tx + tw - 2, 14], [tx + tw * 0.7, 20], [tx + tw * 0.25, 20], [tx, 14]];
        poly(ctx, pts, shade(PAL.tile, ((tx / tw) % 2 ? -0.08 : 0.06)), shade(PAL.tile, -0.4), 1);
      }
      ctx.strokeStyle = 'rgba(30,8,8,0.75)';
      ctx.lineWidth = 1.6;
      for (let cx = 14; cx < w - 6; cx += 37) {
        ctx.beginPath();
        ctx.moveTo(cx, 3);
        ctx.lineTo(cx + 5, 9);
        ctx.lineTo(cx + 1, 14);
        ctx.lineTo(cx + 7, 20);
        ctx.stroke();
      }
      ctx.fillStyle = shade(PAL.tile, 0.3);
      ctx.fillRect(0, 1, w, 2);
    });
    return key;
  }
  const h = type === 'mover' ? 40 : 26;
  canvasTexture(scene, key, w, h, (ctx) => {
    facetRect(ctx, 0, 0, w, 20, PAL.wood, { cell: 12, light: 0.3, seed: w });
    ctx.fillStyle = shade(PAL.wood, 0.3);
    ctx.fillRect(0, 0, w, 3);
    ctx.strokeStyle = rgba('#3a210c', 0.5);
    ctx.lineWidth = 1.5;
    for (let x = 30; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 2);
      ctx.lineTo(x, 20);
      ctx.stroke();
    }
    ctx.fillStyle = shade(PAL.wood, -0.45);
    ctx.fillRect(0, 17, w, 3);
    if (type === 'mover') {
      // gouden rand + wieltjes
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(0, 20, w, 4);
      for (const x of [22, w - 22]) {
        facetCircle(ctx, x, 30, 9, 9, '#3a3850', { sides: 8, light: 0.3 });
        facetCircle(ctx, x, 30, 3, 3, PAL.gold, { sides: 6 });
      }
    } else {
      for (const x of [8, w - 8]) facetCircle(ctx, x, 10, 3, 3, '#cfc6b4', { sides: 6 });
    }
  });
  return key;
}

/** Antwoordcadeautjes in drie kleuren. */
export function makeGifts(scene) {
  const colors = { blue: '#2f6fd6', red: '#d63a32', purple: '#8a3fd0' };
  for (const [name, col] of Object.entries(colors)) {
    canvasTexture(scene, `gift_${name}`, 132, 136, (ctx) => {
      ctx.fillStyle = 'rgba(5,8,25,0.35)';
      ctx.beginPath();
      ctx.ellipse(64, 128, 52, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // doos
      facetRect(ctx, 14, 52, 96, 72, col, { cell: 14, light: 0.25, variance: 0.05, seed: 4 });
      poly(ctx, [[110, 52], [120, 44], [120, 116], [110, 124]], shade(col, -0.35));
      // deksel
      facetPoly(ctx, [[8, 36], [114, 36], [124, 28], [18, 28]], shade(col, 0.25), { cell: 12, seed: 5 });
      facetRect(ctx, 8, 36, 106, 18, shade(col, 0.08), { cell: 10, light: 0.3, seed: 6 });
      poly(ctx, [[114, 36], [124, 28], [124, 46], [114, 54]], shade(col, -0.3));
      // lint
      const gold = PAL.gold;
      poly(ctx, [[54, 36], [68, 36], [68, 124], [54, 124]], gold);
      poly(ctx, [[54, 36], [60, 36], [60, 124], [54, 124]], shade(gold, 0.25));
      poly(ctx, [[60, 28], [74, 28], [68, 36], [54, 36]], shade(gold, 0.1));
      // strik
      facetPoly(ctx, [[62, 30], [36, 8], [30, 20], [40, 32]], gold, { cell: 6, light: 0.35 });
      facetPoly(ctx, [[62, 30], [90, 6], [96, 20], [84, 32]], gold, { cell: 6, light: 0.35 });
      facetCircle(ctx, 62, 30, 8, 7, shade(gold, -0.05), { sides: 7 });
      // label-vlak voor het antwoord
      poly(ctx, chamferPts(20, 66, 84, 44, 8), rgba('#0b1433', 0.55));
    });
  }
}
