// UI-assets in dezelfde low-poly stijl: panelen, knoppen, ballonnen, sterren.
import { shade, rgba, poly, facetPoly, facetCircle, chamferPts, canvasTexture, radialGlow } from './lowpoly.js';

const UI = {
  panel: '#1d2858',
  panelDeep: '#141c44',
  gold: '#f2b632',
  goldDark: '#a8761a',
  cream: '#fff3d6',
  red: '#c8322f',
  green: '#35a852',
  navyBtn: '#2c3a80',
};

/** Paneel met gouden rand. variant: 'navy' | 'cream' */
export function panelKey(scene, w, h, variant = 'navy') {
  w = Math.round(w);
  h = Math.round(h);
  const key = `panel_${variant}_${w}x${h}`;
  canvasTexture(scene, key, w, h, (ctx) => {
    const c = 14;
    ctx.fillStyle = 'rgba(3,6,20,0.45)';
    poly(ctx, chamferPts(6, 8, w - 8, h - 8, c), 'rgba(3,6,20,0.45)');
    if (variant === 'cream') {
      facetPoly(ctx, chamferPts(0, 0, w - 6, h - 6, c), UI.cream, { cell: 40, light: 0.08, variance: 0.025, seed: w + h });
      poly(ctx, chamferPts(3, 3, w - 12, h - 12, c - 2), null, '#d9b46a', 3);
    } else {
      facetPoly(ctx, chamferPts(0, 0, w - 6, h - 6, c), UI.gold, { cell: 30, light: 0.3, seed: 3 });
      facetPoly(ctx, chamferPts(5, 5, w - 16, h - 16, c - 3), UI.panel, { cell: 46, light: 0.18, variance: 0.04, seed: w * 3 + h });
      poly(ctx, chamferPts(9, 9, w - 24, h - 24, c - 5), null, rgba('#8fa2ff', 0.18), 1.5);
    }
  });
  return key;
}

/** Knop in drie toestanden (normaal / hover / ingedrukt) als losse textures. */
export function buttonKeys(scene, w, h, variant = 'red') {
  w = Math.round(w);
  h = Math.round(h);
  const base = { red: UI.red, gold: UI.gold, navy: UI.navyBtn, green: UI.green }[variant] ?? UI.red;
  const make = (state) => {
    const key = `btn_${variant}_${w}x${h}_${state}`;
    canvasTexture(scene, key, w, h + 8, (ctx) => {
      const press = state === 'down' ? 4 : 0;
      const lift = state === 'hover' ? 0.08 : 0;
      const c = Math.min(14, h / 3);
      poly(ctx, chamferPts(0, 8, w, h, c), 'rgba(3,6,20,0.45)');
      poly(ctx, chamferPts(0, 6, w, h - 2, c), shade(base, -0.45));
      facetPoly(ctx, chamferPts(0, press, w, h - 6, c), shade(base, lift), { cell: 22, light: 0.32, variance: 0.04, seed: w + h });
      // bovenste glans
      poly(ctx, [[c, press + 3], [w - c, press + 3], [w - c - 6, press + 8], [c + 6, press + 8]], rgba('#ffffff', 0.28));
      poly(ctx, chamferPts(1, press + 1, w - 2, h - 8, c), null, rgba(shade(base, 0.5), 1), 1.5);
    });
    return key;
  };
  return { normal: make('normal'), hover: make('hover'), down: make('down') };
}

/** Tekstballon met staartje onder (voor de opdracht bij de schoorsteen). */
export function bubbleKey(scene, w, h) {
  const key = `bubble_${w}x${h}`;
  canvasTexture(scene, key, w, h + 22, (ctx) => {
    const c = 16;
    poly(ctx, chamferPts(4, 6, w - 6, h - 4, c), 'rgba(3,6,20,0.35)');
    const body = chamferPts(0, 0, w - 6, h - 6, c);
    poly(ctx, [[w / 2 - 18, h - 8], [w / 2 + 14, h - 8], [w / 2 - 6, h + 20]], '#d9b46a');
    facetPoly(ctx, body, '#d9b46a', { cell: 30, light: 0.2 });
    facetPoly(ctx, chamferPts(4, 4, w - 14, h - 14, c - 3), UI.cream, { cell: 36, light: 0.07, variance: 0.02, seed: 4 });
    poly(ctx, [[w / 2 - 14, h - 12], [w / 2 + 10, h - 12], [w / 2 - 5, h + 13]], UI.cream);
  });
  return key;
}

export function makeUiArt(scene) {
  canvasTexture(scene, 'keycap', 58, 60, (ctx) => {
    poly(ctx, chamferPts(2, 8, 54, 50, 9), '#8f8aa8');
    facetPoly(ctx, chamferPts(2, 2, 54, 48, 9), '#f4f2fb', { cell: 14, light: 0.2, seed: 2 });
    poly(ctx, chamferPts(8, 6, 42, 36, 6), null, rgba('#b8b4cc', 1), 1.5);
  });

  canvasTexture(scene, 'keycap_wide', 150, 60, (ctx) => {
    poly(ctx, chamferPts(2, 8, 146, 50, 9), '#8f8aa8');
    facetPoly(ctx, chamferPts(2, 2, 146, 48, 9), '#f4f2fb', { cell: 18, light: 0.2, seed: 3 });
    poly(ctx, chamferPts(8, 6, 134, 36, 6), null, rgba('#b8b4cc', 1), 1.5);
  });

  const star = (key, full) =>
    canvasTexture(scene, key, 96, 92, (ctx) => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 44 : 19;
        pts.push([48 + Math.cos(a) * r, 48 + Math.sin(a) * r]);
      }
      if (full) radialGlow(ctx, 48, 48, 46, '#ffd66b', 0.35);
      // facetten vanuit het midden
      for (let i = 0; i < 10; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % 10];
        const lit = i < 5 ? 0.18 : -0.12;
        poly(ctx, [[48, 48], p1, p2], full ? shade(UI.gold, lit + (i % 2 ? 0.08 : 0)) : shade('#2a3466', lit * 0.5));
      }
      poly(ctx, pts, null, full ? shade(UI.gold, -0.35) : '#4a5591', 2);
    });
  star('star_full', true);
  star('star_empty', false);

  const toggle = (key, on) =>
    canvasTexture(scene, key, 104, 52, (ctx) => {
      poly(ctx, chamferPts(2, 6, 100, 44, 16), 'rgba(3,6,20,0.45)');
      facetPoly(ctx, chamferPts(2, 2, 100, 44, 16), on ? UI.green : '#3a4270', { cell: 14, light: 0.25, seed: 5 });
      facetCircle(ctx, on ? 78 : 26, 24, 17, 17, '#f4f2fb', { sides: 9, light: 0.25 });
    });
  toggle('toggle_on', true);
  toggle('toggle_off', false);

  canvasTexture(scene, 'btn_pause', 64, 66, (ctx) => {
    poly(ctx, chamferPts(2, 6, 60, 58, 12), 'rgba(3,6,20,0.45)');
    facetPoly(ctx, chamferPts(2, 2, 60, 58, 12), UI.gold, { cell: 14, light: 0.3 });
    facetPoly(ctx, chamferPts(6, 6, 52, 50, 9), UI.panel, { cell: 16, light: 0.2 });
    poly(ctx, chamferPts(21, 18, 8, 26, 2), '#f4f2fb');
    poly(ctx, chamferPts(36, 18, 8, 26, 2), '#f4f2fb');
  });

  // hud-plaatje (pil met gouden rand)
  canvasTexture(scene, 'hud_pill', 200, 64, (ctx) => {
    poly(ctx, chamferPts(2, 6, 196, 56, 18), 'rgba(3,6,20,0.45)');
    facetPoly(ctx, chamferPts(0, 0, 196, 56, 18), UI.gold, { cell: 20, light: 0.3, seed: 2 });
    facetPoly(ctx, chamferPts(4, 4, 188, 48, 15), '#18214d', { cell: 24, light: 0.18, seed: 9 });
  });

  // logo-lint (rood met gouden randen, zoals op de asset sheet)
  canvasTexture(scene, 'logo_ribbon', 760, 210, (ctx) => {
    const tilt = (x) => -0.07 * (x - 380);
    const P = (x, y) => [x, y + tilt(x) + 30];
    // gevouwen uiteinden
    facetPoly(ctx, [P(20, 70), P(90, 60), P(90, 150), P(20, 160), P(48, 115)], '#8e1f1f', { cell: 14, seed: 2 });
    facetPoly(ctx, [P(740, 60), P(670, 50), P(670, 140), P(740, 150), P(712, 105)], '#8e1f1f', { cell: 14, seed: 3 });
    const band = [P(70, 30), P(690, 20), P(700, 140), P(60, 152)];
    facetPoly(ctx, band.map(([x, y]) => [x, y - 6]), UI.gold, { cell: 20, light: 0.3, seed: 4 });
    facetPoly(ctx, [P(76, 30), P(684, 20), P(692, 132), P(68, 144)], '#d63a32', { cell: 26, light: 0.28, variance: 0.05, seed: 5 });
    poly(ctx, [P(76, 30), P(684, 20), P(684, 30), P(76, 40)], rgba('#ffffff', 0.18));
  });

  canvasTexture(scene, 'logo_sub', 460, 74, (ctx) => {
    facetPoly(ctx, [[0, 18], [30, 10], [430, 4], [460, 14], [452, 60], [420, 70], [30, 66], [8, 58]], '#ffd34d', { cell: 18, light: 0.3, seed: 8 });
    poly(ctx, [[0, 18], [30, 10], [430, 4], [460, 14], [452, 60], [420, 70], [30, 66], [8, 58]], null, '#a8761a', 3);
  });

  // klein cadeau-icoon voor de HUD
  canvasTexture(scene, 'icon_gift', 44, 44, (ctx) => {
    facetPoly(ctx, chamferPts(5, 16, 34, 26, 3), '#d63a32', { cell: 8, light: 0.3 });
    facetPoly(ctx, chamferPts(2, 10, 40, 10, 2), '#e85a4f', { cell: 8, light: 0.3 });
    poly(ctx, [[19, 10], [25, 10], [25, 42], [19, 42]], UI.gold);
    facetPoly(ctx, [[22, 11], [10, 0], [7, 7], [13, 11]], UI.gold, { cell: 4 });
    facetPoly(ctx, [[22, 11], [34, 0], [37, 7], [31, 11]], UI.gold, { cell: 4 });
  });

  canvasTexture(scene, 'vignette', 320, 180, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, 'rgba(4,7,22,0)');
    g.addColorStop(1, 'rgba(4,7,22,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
