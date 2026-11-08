// Speelbaar personage: Piet, getekend als low-poly 3D-cartoon.
// Elke animatieframe is een "pose" (hoeken van ledematen); drawPiet tekent de pose.
import { poly, shade, facetPoly, facetCircle, rgba } from './lowpoly.js';

export const PIET_FRAME = { w: 96, h: 132, foot: 126 };

const C = {
  hat: '#6d2fb0',
  band: '#f2b632',
  feather: '#ffd23f',
  skin: '#dca27c',
  hair: '#3b2416',
  jacket: '#6b2fa6',
  trim: '#f2b632',
  collar: '#f6f3ff',
  pants: '#e27b2c',
  pantsDark: '#b65619',
  shoe: '#2a2238',
  glove: '#221c33',
  eye: '#1d1630',
  mouth: '#7a2a2a',
};

const rad = (d) => (d * Math.PI) / 180;

// Ledemaat van punt A in richting `ang` (0 = recht omlaag, + = naar voren/rechts)
function limb(ctx, ax, ay, ang, len, wA, wB, color) {
  const a = rad(ang);
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const bx = ax + dx * len;
  const by = ay + dy * len;
  const px = dy;
  const py = -dx;
  const p1 = [ax + (px * wA) / 2, ay + (py * wA) / 2];
  const p2 = [bx + (px * wB) / 2, by + (py * wB) / 2];
  const p3 = [bx - (px * wB) / 2, by - (py * wB) / 2];
  const p4 = [ax - (px * wA) / 2, ay - (py * wA) / 2];
  // twee helften: één kant in het licht, één in de schaduw
  poly(ctx, [p1, p2, [bx, by], [ax, ay]], shade(color, -0.12), shade(color, -0.12), 0.5);
  poly(ctx, [[ax, ay], [bx, by], p3, p4], shade(color, 0.1), shade(color, 0.1), 0.5);
  facetCircle(ctx, ax, ay, wA / 2, wA / 2, color, { sides: 6, light: 0.18 });
  return [bx, by];
}

function rot(pts, cx, cy, deg) {
  const a = rad(deg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

function leg(ctx, hx, hy, thigh, knee, dark) {
  const k = dark ? -0.18 : 0;
  const kneeP = limb(ctx, hx, hy, thigh, 18, 16, 12, shade(C.pants, k));
  const shinAng = thigh - knee;
  const ankle = limb(ctx, kneeP[0], kneeP[1], shinAng, 15, 11, 9, shade(C.pants, k - 0.06));
  // streep op de broek
  ctx.save();
  ctx.globalAlpha = 0.55;
  limb(ctx, (hx + kneeP[0]) / 2, (hy + kneeP[1]) / 2 - 2, thigh, 3, 14, 12, C.pantsDark);
  ctx.restore();
  // schoen (wijst naar voren)
  const shoe = rot([[-5, -3], [9, -3], [13, 1], [12, 5], [-6, 5]], ankle[0], ankle[1], shinAng * -0.35);
  facetPoly(ctx, shoe, shade(C.shoe, k), { cell: 6, light: 0.25 });
  poly(ctx, [shoe[0], shoe[1], shoe[2]], rgba('#ffffff', 0.12));
}

function arm(ctx, sx, sy, ang, elbow, dark) {
  const k = dark ? -0.22 : 0;
  const elb = limb(ctx, sx, sy, ang, 13, 11, 9, shade(C.jacket, k));
  const hand = limb(ctx, elb[0], elb[1], ang + elbow, 11, 9, 8, shade(C.jacket, k - 0.05));
  // gouden manchet
  facetCircle(ctx, hand[0], hand[1], 5, 5, shade(C.trim, k), { sides: 6 });
  facetCircle(ctx, hand[0] + Math.sin(rad(ang + elbow)) * 3, hand[1] + Math.cos(rad(ang + elbow)) * 3, 5, 5, shade(C.glove, k), { sides: 7, light: 0.3 });
  return hand;
}

function head(ctx, hx, hy, pose) {
  // haar achter
  facetPoly(ctx, [[hx - 15, hy - 6], [hx - 4, hy - 13], [hx + 2, hy - 4], [hx - 4, hy + 8], [hx - 14, hy + 6]], C.hair, { cell: 6 });
  // hoofd
  facetCircle(ctx, hx, hy, 15, 15.5, C.skin, { sides: 9, light: 0.2, rot: 0.2 });
  // oor
  facetCircle(ctx, hx - 6, hy + 2, 3.5, 4.5, shade(C.skin, -0.1), { sides: 6 });
  // bakkebaard / haar voor het oor
  poly(ctx, [[hx - 13, hy - 6], [hx - 6, hy - 9], [hx - 8, hy - 1], [hx - 12, hy + 1]], C.hair);
  // wang
  ctx.fillStyle = rgba('#ff7a7a', 0.28);
  ctx.beginPath();
  ctx.ellipse(hx + 11, hy + 5, 3.5, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // neus
  poly(ctx, [[hx + 13, hy - 1], [hx + 17, hy + 3], [hx + 13, hy + 4]], shade(C.skin, -0.08));
  // ogen
  const eyes = [[hx + 4, hy - 1, 0.85], [hx + 11.5, hy - 1, 1]];
  for (const [ex, ey, s] of eyes) {
    if (pose.eyes === 'closed') {
      ctx.strokeStyle = C.eye;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex - 2.5 * s, ey + 1);
      ctx.lineTo(ex + 2.5 * s, ey + 1);
      ctx.stroke();
    } else if (pose.eyes === 'happy') {
      ctx.strokeStyle = C.eye;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(ex, ey + 2, 2.6 * s, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 2.7 * s, 3.6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.eye;
      ctx.beginPath();
      ctx.ellipse(ex + 0.8, ey + 0.4, 1.7 * s, 2.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 0.4, ey - 1.4, 1.1, 1.1);
    }
  }
  // wenkbrauwen
  ctx.strokeStyle = C.hair;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(hx + 1.5, hy - 6);
  ctx.lineTo(hx + 6, hy - 6.8);
  ctx.moveTo(hx + 9.5, hy - 6.8);
  ctx.lineTo(hx + 14, hy - 6);
  ctx.stroke();
  // mond
  if (pose.mouth === 'open') {
    ctx.fillStyle = C.mouth;
    ctx.beginPath();
    ctx.ellipse(hx + 9, hy + 8, 3.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e86a6a';
    ctx.beginPath();
    ctx.ellipse(hx + 9, hy + 9.2, 2, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = C.mouth;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(hx + 9, hy + 5, 3.6, Math.PI * 0.2, Math.PI * 0.85);
    ctx.stroke();
  }

  // muts (baret) met gouden band
  const hatPts = [[-18, -8], [-15, -17], [-4, -24], [10, -24], [21, -18], [22, -10], [4, -6]].map(([x, y]) => [hx + x, hy + y]);
  // veer (achter de muts, zwaait iets mee)
  const fs = pose.feather ?? 0;
  const feather = rot([[0, 0], [-10, -9], [-22, -14], [-30, -13], [-22, -7], [-9, -1]], hx - 9, hy - 17, fs);
  facetPoly(ctx, feather, C.feather, { cell: 5, light: 0.3, variance: 0.08 });
  ctx.strokeStyle = shade(C.feather, -0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(feather[0][0], feather[0][1]);
  ctx.lineTo(feather[3][0], feather[3][1]);
  ctx.stroke();
  facetPoly(ctx, hatPts, C.hat, { cell: 7, light: 0.3, variance: 0.07, seed: 11 });
  poly(ctx, [[hx - 18, hy - 8], [hx + 22, hy - 10], [hx + 22, hy - 6.5], [hx - 17, hy - 4.5]], C.band, shade(C.band, -0.2), 0.8);
  // knoopje op de muts
  facetCircle(ctx, hx + 3, hy - 24, 2.4, 2.4, C.band, { sides: 6 });
}

/** Tekent Piet in een frame waarvan de linkerbovenhoek (ox, oy) is. */
export function drawPiet(ctx, ox, oy, pose = {}) {
  const p = {
    bob: 0, lean: 0, sx: 1, sy: 1,
    legF: 6, kneeF: 0, legB: -4, kneeB: 0,
    armF: -8, elbowF: 20, armB: 8, elbowB: 20,
    eyes: 'open', mouth: 'smile', feather: 0,
    ...pose,
  };
  const { w, foot } = PIET_FRAME;
  const cx = ox + w / 2 - 2;
  const fy = oy + foot;
  ctx.save();
  // squash & stretch vanaf de voeten
  ctx.translate(cx, fy);
  ctx.scale(p.sx, p.sy);
  ctx.translate(-cx, -fy);

  // schaduw onder de voeten
  ctx.fillStyle = 'rgba(5,8,25,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx + 2, fy + 3, 17, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const hipY = fy - 36 + p.bob;
  const toWorld = (lx, ly) => {
    const a = rad(p.lean);
    return [cx + lx * Math.cos(a) - ly * Math.sin(a), hipY + lx * Math.sin(a) + ly * Math.cos(a)];
  };

  // achterste arm en been (donkerder)
  const shB = toWorld(-6, -24);
  arm(ctx, shB[0], shB[1], p.armB, p.elbowB, true);
  leg(ctx, cx - 3, hipY, p.legB, p.kneeB, true);

  // romp (jasje) met zoom
  const torso = [[-14, 6], [-12, -4], [-12, -27], [11, -28], [13, -4], [15, 6]].map(([x, y]) => toWorld(x, y));
  facetPoly(ctx, torso, C.jacket, { cell: 8, light: 0.28, variance: 0.06, seed: 5 });
  // gouden bies onderaan en voorsluiting
  poly(ctx, [toWorld(-14, 6), toWorld(15, 6), toWorld(14, 2), toWorld(-13, 2)], C.trim, shade(C.trim, -0.2), 0.6);
  poly(ctx, [toWorld(5, -26), toWorld(8, -26), toWorld(9, 3), toWorld(6, 3)], shade(C.trim, -0.05));
  for (const by of [-19, -12, -5]) {
    const b = toWorld(3, by);
    facetCircle(ctx, b[0], b[1], 1.8, 1.8, '#ffe08a', { sides: 6 });
  }

  // voorste been
  leg(ctx, cx + 4, hipY, p.legF, p.kneeF, false);

  // kraag (witte plooikraag)
  const nk = toWorld(0, -28);
  const ruff = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = i % 2 ? 0.75 : 1;
    ruff.push([nk[0] + Math.cos(a) * 15 * r, nk[1] + Math.sin(a) * 5.5 * r]);
  }
  facetPoly(ctx, ruff, C.collar, { cell: 6, light: 0.25 });

  // hoofd
  const hd = toWorld(3, -43);
  head(ctx, hd[0], hd[1], p);

  // voorste arm (na het hoofd, zodat juichende armen er goed overheen liggen)
  const shF = toWorld(7, -24);
  arm(ctx, shF[0], shF[1], p.armF, p.elbowF, false);

  ctx.restore();
}

/** Alle animaties als lijsten van poses. */
export function pietAnimations() {
  const idle = [0, -0.5, -1, -1.5, -1, -0.5].map((bob, i) => ({
    bob, armF: -8 + bob * 2, armB: 8 - bob * 2, feather: bob * 3, eyes: i === 4 ? 'closed' : 'open',
  }));

  const run = [];
  for (let i = 0; i < 8; i++) {
    const ph = (i / 8) * Math.PI * 2;
    const s = Math.sin(ph);
    run.push({
      lean: 10,
      bob: -3.5 * (1 - Math.abs(s)) + 1,
      legF: 40 * s, kneeF: 10 + 60 * Math.max(0, -s),
      legB: -40 * s, kneeB: 10 + 60 * Math.max(0, s),
      armF: -48 * s + 5, elbowF: 70, armB: 48 * s - 5, elbowB: 70,
      feather: -8 + 6 * s,
    });
  }

  const jump = [
    { lean: 4, sy: 1.07, sx: 0.95, legF: 45, kneeF: 70, legB: -15, kneeB: 35, armF: 150, elbowF: 20, armB: -40, elbowB: 30, feather: -14, mouth: 'open' },
    { lean: 4, sy: 1.04, sx: 0.97, legF: 40, kneeF: 65, legB: -10, kneeB: 30, armF: 160, elbowF: 15, armB: -50, elbowB: 30, feather: -10, mouth: 'open' },
  ];
  const fall = [
    { lean: 2, legF: 18, kneeF: 18, legB: -12, kneeB: 28, armF: 118, elbowF: 15, armB: -118, elbowB: -15, feather: 12, mouth: 'open' },
    { lean: 2, legF: 14, kneeF: 22, legB: -8, kneeB: 24, armF: 104, elbowF: 25, armB: -104, elbowB: -25, feather: 18, mouth: 'open' },
  ];
  const land = [
    { sy: 0.82, sx: 1.13, bob: 3, legF: 32, kneeF: 72, legB: -22, kneeB: 48, armF: 35, elbowF: 30, armB: -35, elbowB: 30, feather: 14 },
    { sy: 0.93, sx: 1.05, bob: 1, legF: 15, kneeF: 30, legB: -10, kneeB: 20, armF: 15, elbowF: 25, armB: -15, elbowB: 25, feather: 6 },
  ];
  const stance = { legF: 22, kneeF: 12, legB: -16, kneeB: 14 };
  const deliver = [
    { ...stance, lean: -6, armF: -110, elbowF: 40, armB: 20, feather: 6 },
    { ...stance, lean: -9, armF: -150, elbowF: 30, armB: 30, feather: 10 },
    { ...stance, lean: 10, armF: 125, elbowF: 5, armB: -30, feather: -10, mouth: 'open' },
    { ...stance, lean: 9, armF: 95, elbowF: 10, armB: -25, feather: -8, mouth: 'open' },
    { ...stance, lean: 4, armF: 40, elbowF: 25, armB: -10, feather: -2 },
  ];
  const celebrate = [
    { bob: -4, armF: 165, elbowF: -10, armB: -165, elbowB: 10, eyes: 'happy', mouth: 'open', legF: 8, legB: -6 },
    { bob: -12, sy: 1.05, sx: 0.96, armF: 172, elbowF: 10, armB: -172, elbowB: -10, eyes: 'happy', mouth: 'open', legF: 30, kneeF: 50, legB: -20, kneeB: 40, feather: -10 },
    { bob: -6, armF: 160, elbowF: -20, armB: -160, elbowB: 20, eyes: 'happy', mouth: 'open', legF: 12, kneeF: 15, legB: -10, kneeB: 12, feather: 8 },
    { bob: 0, sy: 0.94, sx: 1.04, armF: 150, elbowF: 10, armB: -150, elbowB: -10, eyes: 'happy', mouth: 'open', legF: 8, legB: -6 },
  ];
  return { idle, run, jump, fall, land, deliver, celebrate };
}
