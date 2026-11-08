// Speelbaar personage: Sinterklaas, in dezelfde low-poly stijl als Piet.
// Gebruikt het gedeelde skelet (characterRig), dus dezelfde poses en hitbox.
import { poly, shade, facetPoly, facetCircle, rgba } from './lowpoly.js';
import { CHAR_FRAME, rad, limb, rot, withDefaults, characterPoses } from './characterRig.js';

const C = {
  mitre: '#d3382f',
  gold: '#f2b632',
  goldDark: '#b07a14',
  skin: '#f0c09a',
  nose: '#ee9783',
  beard: '#f7f5f2',
  hair: '#ece9ee',
  robe: '#f1e2c0',
  sleeve: '#eddcb6',
  cape: '#c92f28',
  capeInner: '#7e1a1a',
  belt: '#6b3d1e',
  boot: '#4a2c1a',
  eye: '#1d1630',
  mouth: '#6a2222',
};

const dir = (ang) => [Math.sin(rad(ang)), Math.cos(rad(ang))];

function leg(ctx, hx, hy, thigh, knee, dark) {
  const k = dark ? -0.16 : 0;
  const kneeP = limb(ctx, hx, hy, thigh, 18, 15, 12, shade(C.robe, k - 0.05));
  const shinAng = thigh - knee;
  const ankle = limb(ctx, kneeP[0], kneeP[1], shinAng, 15, 11, 9, shade(C.robe, k - 0.1));
  // laars
  const boot = rot([[-6, -6], [8, -5], [13, 0], [13, 5], [-6, 5]], ankle[0], ankle[1], shinAng * -0.35);
  facetPoly(ctx, boot, shade(C.boot, k), { cell: 6, light: 0.3 });
  poly(ctx, [boot[0], boot[1], boot[2]], rgba('#ffffff', 0.12));
}

function armGeometry(sx, sy, ang, elbow) {
  const [dx1, dy1] = dir(ang);
  const elb = [sx + dx1 * 13, sy + dy1 * 13];
  const [dx2, dy2] = dir(ang + elbow);
  return { elb, hand: [elb[0] + dx2 * 11, elb[1] + dy2 * 11], foreAng: ang + elbow };
}

function arm(ctx, sx, sy, ang, elbow, dark) {
  const k = dark ? -0.2 : 0;
  const elb = limb(ctx, sx, sy, ang, 13, 12, 10, shade(C.sleeve, k));
  const hand = limb(ctx, elb[0], elb[1], ang + elbow, 11, 10, 9, shade(C.sleeve, k - 0.05));
  facetCircle(ctx, hand[0], hand[1], 5.5, 5.5, shade(C.gold, k), { sides: 6 });
  const [dx, dy] = dir(ang + elbow);
  facetCircle(ctx, hand[0] + dx * 3.5, hand[1] + dy * 3.5, 5, 5, shade(C.skin, k), { sides: 7, light: 0.3 });
}

/** Gouden staf met krul; `up` = lengte boven de hand. */
function staff(ctx, hand, tilt, up, facingSign = 1) {
  const a = rad(tilt);
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const top = [hand[0] + ux * up, hand[1] + uy * up];
  const bottom = [hand[0] - ux * 30, hand[1] - uy * 30];
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.goldDark;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(bottom[0], bottom[1]);
  ctx.lineTo(top[0], top[1]);
  ctx.stroke();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3.6;
  ctx.stroke();
  ctx.strokeStyle = rgba('#fff3c0', 0.8);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bottom[0] - 1, bottom[1]);
  ctx.lineTo(top[0] - 1, top[1]);
  ctx.stroke();

  // krul (spiraal, als veelhoek voor de low-poly look)
  const px = -uy * facingSign;
  const py = ux * facingSign;
  const c = [top[0] + px * 7 + ux * 6, top[1] + py * 7 + uy * 6];
  const pts = [top];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const ang = Math.atan2(top[1] - c[1], top[0] - c[0]) + t * Math.PI * 1.7 * facingSign;
    const r = 7.5 - t * 4.5;
    pts.push([c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r]);
  }
  for (const [w, col] of [[6, C.goldDark], [3.6, C.gold]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
  }
  facetCircle(ctx, top[0], top[1], 3.4, 3.4, C.gold, { sides: 6 });
  facetCircle(ctx, hand[0] + ux * 16, hand[1] + uy * 16, 3, 3, C.gold, { sides: 6 });
}

function head(ctx, hx, hy, pose) {
  // wit haar achter het hoofd
  facetPoly(ctx, [[hx - 15, hy - 6], [hx - 5, hy - 12], [hx + 1, hy - 2], [hx - 3, hy + 12], [hx - 14, hy + 9]], C.hair, { cell: 6, light: 0.25 });
  facetCircle(ctx, hx, hy, 14.5, 15, C.skin, { sides: 9, light: 0.2, rot: 0.2 });
  facetCircle(ctx, hx - 6, hy + 2, 3.4, 4.4, shade(C.skin, -0.1), { sides: 6 });
  ctx.fillStyle = rgba('#ff7a7a', 0.3);
  ctx.beginPath();
  ctx.ellipse(hx + 11, hy + 3, 3.4, 2.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ogen
  for (const [ex, ey, s] of [[hx + 4, hy - 2, 0.85], [hx + 11.5, hy - 2, 1]]) {
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
      ctx.arc(ex, ey + 2, 2.5 * s, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 2.6 * s, 3.3 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.eye;
      ctx.beginPath();
      ctx.ellipse(ex + 0.8, ey + 0.4, 1.6 * s, 2.3 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 0.4, ey - 1.3, 1.1, 1.1);
    }
  }
  // borstelige witte wenkbrauwen
  poly(ctx, [[hx + 0.5, hy - 6.5], [hx + 7, hy - 9], [hx + 7.5, hy - 6.5], [hx + 1, hy - 4.8]], C.hair, shade(C.hair, -0.2), 0.6);
  poly(ctx, [[hx + 9, hy - 8.5], [hx + 15.5, hy - 7], [hx + 15, hy - 4.8], [hx + 9, hy - 6]], C.hair, shade(C.hair, -0.2), 0.6);

  // baard
  const beard = [[hx - 9, hy + 1], [hx - 3, hy + 7], [hx + 3, hy + 6], [hx + 10, hy + 7], [hx + 17, hy + 4],
    [hx + 18, hy + 13], [hx + 14, hy + 24], [hx + 7, hy + 31], [hx - 1, hy + 28], [hx - 7, hy + 19]];
  facetPoly(ctx, beard, C.beard, { cell: 6, light: 0.3, variance: 0.05, seed: 3 });
  poly(ctx, [[hx + 2, hy + 18], [hx + 9, hy + 27], [hx + 7, hy + 31], [hx - 1, hy + 28]], rgba('#b9b4c8', 0.35));
  // mond
  if (pose.mouth === 'open') {
    ctx.fillStyle = C.mouth;
    ctx.beginPath();
    ctx.ellipse(hx + 11, hy + 10.5, 3, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // snor
  facetPoly(ctx, [[hx + 4, hy + 6], [hx + 10, hy + 3.5], [hx + 12, hy + 7], [hx + 7, hy + 9.5], [hx + 2, hy + 9]], C.beard, { cell: 4, light: 0.35 });
  facetPoly(ctx, [[hx + 12, hy + 3.5], [hx + 18, hy + 5], [hx + 20, hy + 9], [hx + 15, hy + 8.5]], C.beard, { cell: 4, light: 0.35 });
  // neus
  facetCircle(ctx, hx + 13, hy + 2, 3.4, 3, C.nose, { sides: 7, light: 0.3 });

  // mijter
  const P = (x, y) => [hx + x, hy + y];
  const mitre = [P(-15, -6), P(17, -7), P(18, -29), P(3, -47), P(-13, -29)];
  facetPoly(ctx, mitre, C.mitre, { cell: 8, light: 0.3, variance: 0.06, seed: 21 });
  // gouden randen
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(...P(-14, -8));
  ctx.lineTo(...P(-12.5, -29));
  ctx.lineTo(...P(3, -46));
  ctx.lineTo(...P(17.5, -29));
  ctx.lineTo(...P(16.5, -8));
  ctx.stroke();
  // middenband en hoofdband
  poly(ctx, [P(0, -10), P(6, -10), P(6, -40), P(3, -45), P(0, -40)], C.gold, shade(C.gold, -0.25), 0.8);
  poly(ctx, [P(-15, -6), P(17, -7), P(17, -13), P(-15, -12)], C.gold, shade(C.gold, -0.25), 0.8);
  poly(ctx, [P(-13, -28), P(18, -29), P(18, -25), P(-13, -24)], C.gold, shade(C.gold, -0.25), 0.8);
  // glimmend steentje
  facetCircle(ctx, hx + 3, hy - 18, 2.6, 2.6, '#c8322f', { sides: 6, light: 0.4 });
}

/** Tekent Sinterklaas in een frame waarvan de linkerbovenhoek (ox, oy) is. */
export function drawSint(ctx, ox, oy, pose = {}) {
  const p = withDefaults(pose);
  const { w, foot } = CHAR_FRAME;
  const cx = ox + w / 2 - 2;
  const fy = oy + foot;
  ctx.save();
  ctx.translate(cx, fy);
  ctx.scale(p.sx, p.sy);
  ctx.translate(-cx, -fy);

  ctx.fillStyle = 'rgba(5,8,25,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx + 2, fy + 3, 19, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();

  const hipY = fy - 36 + p.bob;
  const toWorld = (lx, ly) => {
    const a = rad(p.lean);
    return [cx + lx * Math.cos(a) - ly * Math.sin(a), hipY + lx * Math.sin(a) + ly * Math.cos(a)];
  };

  // --- cape (achter alles, wappert naar achteren bij snelheid)
  const k = p.cape;
  const capeBack = [cx - 20 - k * 20, fy - 4 - k * 30];
  const capeMid = [cx - 8 - k * 12, fy - 2 - k * 12];
  const cape = [toWorld(-11, -29), toWorld(9, -29), toWorld(12, 0), capeMid, capeBack, toWorld(-17, -12)];
  facetPoly(ctx, cape, C.capeInner, { cell: 10, light: 0.15, seed: 4 });
  facetPoly(ctx, [toWorld(-11, -29), toWorld(2, -30), capeMid, capeBack, toWorld(-17, -12)], C.cape, { cell: 10, light: 0.3, variance: 0.05, seed: 6 });
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(...toWorld(-11, -29));
  ctx.lineTo(...toWorld(-17, -12));
  ctx.lineTo(...capeBack);
  ctx.lineTo(...capeMid);
  ctx.stroke();

  // --- achterste arm en been
  const shB = toWorld(-7, -24);
  arm(ctx, shB[0], shB[1], p.armB, p.elbowB, true);
  leg(ctx, cx - 3, hipY, p.legB, p.kneeB, true);
  leg(ctx, cx + 4, hipY, p.legF, p.kneeF, false);

  // --- gewaad (lang, tot over de knieën; zoom beweegt mee met de benen)
  const hemB = toWorld(-17 + p.legB * 0.18, 23);
  const hemF = toWorld(18 + p.legF * 0.18, 23);
  const robe = [toWorld(-12, -28), toWorld(11, -29), toWorld(14, -6), hemF, toWorld(1, 25), hemB, toWorld(-13, -6)];
  facetPoly(ctx, robe, C.robe, { cell: 8, light: 0.28, variance: 0.05, seed: 8 });
  // cape-rand die over de voorkant valt
  poly(ctx, [toWorld(5, -29), toWorld(11, -29), toWorld(15, -6), hemF, toWorld(13, 23)], C.cape, shade(C.cape, -0.3), 0.6);
  poly(ctx, [toWorld(5, -29), toWorld(7.5, -29), toWorld(11, 23), toWorld(13, 23)], C.gold);
  // riem met gesp
  poly(ctx, [toWorld(-13, -8), toWorld(14, -8), toWorld(14, -3), toWorld(-13, -3)], C.belt, shade(C.belt, -0.3), 0.6);
  const bk = toWorld(4, -5.5);
  poly(ctx, [[bk[0] - 3.5, bk[1] - 3.5], [bk[0] + 3.5, bk[1] - 3.5], [bk[0] + 3.5, bk[1] + 3.5], [bk[0] - 3.5, bk[1] + 3.5]], C.gold, C.goldDark, 1);

  // --- staf (achter het hoofd langs), dan hoofd, dan de hand die de staf vasthoudt
  const shF = toWorld(7, -24);
  const g = armGeometry(shF[0], shF[1], p.armF, p.elbowF);
  const tilt = (p.staffTilt ?? 6 + p.armF * 0.12) + p.lean * 0.5;
  // staf nooit buiten het frame laten steken
  const maxUp = (g.hand[1] - (oy + 6)) / Math.max(0.3, Math.cos(rad(tilt))) - 10;
  staff(ctx, g.hand, tilt, Math.max(24, Math.min(80, maxUp)));

  const hd = toWorld(3, -43);
  head(ctx, hd[0], hd[1], p);

  arm(ctx, shF[0], shF[1], p.armF, p.elbowF, false);

  ctx.restore();
}

/** Sint gebruikt de gedeelde poses; bij bezorgen gooit hij met de andere hand (staf blijft vast). */
export function sintPoses() {
  const poses = characterPoses();
  // staf wat naar voren houden, weg van het gezicht
  for (const name of ['idle', 'run', 'land']) {
    poses[name] = poses[name].map((q) => ({ ...q, armF: (q.armF ?? -8) * 0.5 + 34, elbowF: -14 }));
  }
  poses.deliver = poses.deliver.map((d) => ({
    ...d, armB: d.armF, elbowB: d.elbowF, armF: 18, elbowF: 35, staffTilt: 4,
  }));
  // juichen: staf schuin naar voren omhoog, zodat het gezicht vrij blijft
  poses.celebrate = poses.celebrate.map((c, i) => ({ ...c, armF: [132, 140, 128, 124][i], elbowF: -25, staffTilt: 18 + i * 3 }));
  return poses;
}
