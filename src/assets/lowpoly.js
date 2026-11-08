// Kleine tekenbibliotheek voor de "Low Poly Geometrical 3D"-stijl.
// Alles wordt op een Canvas 2D-context getekend en daarna als Phaser-texture
// gebruikt. Licht valt overal van linksboven (maanlicht + warme accenten).

export function rng(seed = 1) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex) {
  if (typeof hex === 'string' && hex.startsWith('rgb')) {
    return hex.match(/[\d.]+/g).slice(0, 3).map(Number);
  }
  const h = typeof hex === 'number' ? hex.toString(16).padStart(6, '0') : hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** amt > 0 lichter (naar wit), amt < 0 donkerder (naar zwart) */
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

export function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function poly(ctx, pts, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

/** Driehoekje met lichtberekening op basis van de normaal van de "facetrichting". */
function lightAt(x, y, w, h, x0, y0) {
  // 1 linksboven → 0 rechtsonder
  const nx = (x - x0) / Math.max(1, w);
  const ny = (y - y0) / Math.max(1, h);
  return 1 - (nx * 0.45 + ny * 0.55);
}

/**
 * Vult een rechthoek met een getrianguleerd raster met lichte kleurvariatie:
 * de kern van de low-poly look.
 */
export function facetRect(ctx, x, y, w, h, color, opts = {}) {
  const { cell = 26, variance = 0.07, light = 0.16, seed = 7, jitter = 0.35 } = opts;
  const rand = rng(seed);
  const cols = Math.max(1, Math.round(w / cell));
  const rows = Math.max(1, Math.round(h / cell));
  const cw = w / cols;
  const ch = h / rows;
  const pts = [];
  for (let r = 0; r <= rows; r++) {
    pts[r] = [];
    for (let c = 0; c <= cols; c++) {
      const edgeX = c === 0 || c === cols;
      const edgeY = r === 0 || r === rows;
      const jx = edgeX ? 0 : (rand() - 0.5) * cw * jitter * 2;
      const jy = edgeY ? 0 : (rand() - 0.5) * ch * jitter * 2;
      pts[r][c] = [x + c * cw + jx, y + r * ch + jy];
    }
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = pts[r][c];
      const b = pts[r][c + 1];
      const d = pts[r + 1][c];
      const e = pts[r + 1][c + 1];
      const flip = (r + c) % 2 === 0;
      const tris = flip ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
      for (const t of tris) {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
        const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const l = (lightAt(cx, cy, w, h, x, y) - 0.5) * 2 * light + (rand() - 0.5) * variance * 2;
        poly(ctx, t, shade(color, l), shade(color, l), 0.6);
      }
    }
  }
  ctx.restore();
}

/** Vult een willekeurige polygoon met facetten (via clip + facetRect). */
export function facetPoly(ctx, pts, color, opts = {}) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0;
  const h = Math.max(...ys) - y0;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();
  facetRect(ctx, x0 - 1, y0 - 1, w + 2, h + 2, color, opts);
  ctx.restore();
  if (opts.edge) poly(ctx, pts, null, opts.edge, opts.edgeWidth ?? 1.5);
}

/** Facet-cirkel/ovaal: n-hoek met radiale driehoeken, lichter linksboven. */
export function facetCircle(ctx, cx, cy, rx, ry, color, opts = {}) {
  const { sides = 10, light = 0.22, variance = 0.05, seed = 3, rot = 0 } = opts;
  const rand = rng(seed);
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  // middelpunt licht verschoven naar linksboven voor een bol effect
  const hub = [cx - rx * 0.18, cy - ry * 0.2];
  for (let i = 0; i < sides; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % sides];
    const mx = (p1[0] + p2[0]) / 2 - cx;
    const my = (p1[1] + p2[1]) / 2 - cy;
    const dir = -(mx / rx) * 0.55 - (my / ry) * 0.65; // >0 = naar het licht
    const l = dir * light + (rand() - 0.5) * variance * 2;
    poly(ctx, [hub, p1, p2], shade(color, l), shade(color, l), 0.6);
  }
  return pts;
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** Afgeschuinde rechthoek (achthoek-hoeken) = low-poly "rounded rect". */
export function chamferPts(x, y, w, h, c) {
  return [
    [x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c],
    [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c],
  ];
}

export function radialGlow(ctx, cx, cy, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.35, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

/** Maakt (of hergebruikt) een canvas-texture en roept draw(ctx) aan. */
export function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return scene.textures.get(key);
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  const ctx = tex.getContext();
  draw(ctx, w, h);
  tex.refresh();
  return tex;
}
