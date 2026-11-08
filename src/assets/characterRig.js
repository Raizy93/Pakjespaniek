// Gedeeld "skelet" voor alle speelbare personages.
// Alle personages gebruiken hetzelfde frame, dezelfde poses en dezelfde hitbox,
// zodat ze precies even goed lopen en springen. Alleen het uiterlijk verschilt.
import { poly, shade, facetCircle } from './lowpoly.js';

// Frameformaat van één animatieframe; de voeten staan op y = foot.
export const CHAR_FRAME = { w: 104, h: 150, foot: 144 };

export const rad = (d) => (d * Math.PI) / 180;

// Ledemaat van punt A in richting `ang` (0 = recht omlaag, + = naar voren/rechts)
export function limb(ctx, ax, ay, ang, len, wA, wB, color) {
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

export function rot(pts, cx, cy, deg) {
  const a = rad(deg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}

/** Standaardwaarden van een pose (alle hoeken in graden). */
export function withDefaults(pose) {
  return {
    bob: 0, lean: 0, sx: 1, sy: 1,
    legF: 6, kneeF: 0, legB: -4, kneeB: 0,
    armF: -8, elbowF: 20, armB: 8, elbowB: 20,
    eyes: 'open', mouth: 'smile', feather: 0, cape: 0,
    ...pose,
  };
}

/** Alle animaties als lijsten van poses (gedeeld door alle personages). */
export function characterPoses() {
  const idle = [0, -0.5, -1, -1.5, -1, -0.5].map((bob, i) => ({
    bob, armF: -8 + bob * 2, armB: 8 - bob * 2, feather: bob * 3, cape: 0.05 - bob * 0.03, eyes: i === 4 ? 'closed' : 'open',
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
      cape: 0.75 + 0.2 * Math.sin(ph * 2),
    });
  }

  const jump = [
    { lean: 4, sy: 1.07, sx: 0.95, legF: 45, kneeF: 70, legB: -15, kneeB: 35, armF: 150, elbowF: 20, armB: -40, elbowB: 30, feather: -14, mouth: 'open', cape: 0.5 },
    { lean: 4, sy: 1.04, sx: 0.97, legF: 40, kneeF: 65, legB: -10, kneeB: 30, armF: 160, elbowF: 15, armB: -50, elbowB: 30, feather: -10, mouth: 'open', cape: 0.6 },
  ];
  const fall = [
    { lean: 2, legF: 18, kneeF: 18, legB: -12, kneeB: 28, armF: 118, elbowF: 15, armB: -118, elbowB: -15, feather: 12, mouth: 'open', cape: 0.95 },
    { lean: 2, legF: 14, kneeF: 22, legB: -8, kneeB: 24, armF: 104, elbowF: 25, armB: -104, elbowB: -25, feather: 18, mouth: 'open', cape: 1 },
  ];
  const land = [
    { sy: 0.82, sx: 1.13, bob: 3, legF: 32, kneeF: 72, legB: -22, kneeB: 48, armF: 35, elbowF: 30, armB: -35, elbowB: 30, feather: 14, cape: 0.2 },
    { sy: 0.93, sx: 1.05, bob: 1, legF: 15, kneeF: 30, legB: -10, kneeB: 20, armF: 15, elbowF: 25, armB: -15, elbowB: 25, feather: 6, cape: 0.1 },
  ];
  const stance = { legF: 22, kneeF: 12, legB: -16, kneeB: 14 };
  const deliver = [
    { ...stance, lean: -6, armF: -110, elbowF: 40, armB: 20, feather: 6, cape: 0.15 },
    { ...stance, lean: -9, armF: -150, elbowF: 30, armB: 30, feather: 10, cape: 0.1 },
    { ...stance, lean: 10, armF: 125, elbowF: 5, armB: -30, feather: -10, mouth: 'open', cape: 0.45 },
    { ...stance, lean: 9, armF: 95, elbowF: 10, armB: -25, feather: -8, mouth: 'open', cape: 0.35 },
    { ...stance, lean: 4, armF: 40, elbowF: 25, armB: -10, feather: -2, cape: 0.2 },
  ];
  const celebrate = [
    { bob: -4, armF: 165, elbowF: -10, armB: -165, elbowB: 10, eyes: 'happy', mouth: 'open', legF: 8, legB: -6, cape: 0.2 },
    { bob: -12, sy: 1.05, sx: 0.96, armF: 172, elbowF: 10, armB: -172, elbowB: -10, eyes: 'happy', mouth: 'open', legF: 30, kneeF: 50, legB: -20, kneeB: 40, feather: -10, cape: 0.45 },
    { bob: -6, armF: 160, elbowF: -20, armB: -160, elbowB: 20, eyes: 'happy', mouth: 'open', legF: 12, kneeF: 15, legB: -10, kneeB: 12, feather: 8, cape: 0.3 },
    { bob: 0, sy: 0.94, sx: 1.04, armF: 150, elbowF: 10, armB: -150, elbowB: -10, eyes: 'happy', mouth: 'open', legF: 8, legB: -6, cape: 0.15 },
  ];
  return { idle, run, jump, fall, land, deliver, celebrate };
}
