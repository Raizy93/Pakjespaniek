// ONTWIKKELHULP – alleen in dev-modus (npm run dev) met ?bot in de URL.
// Een testbot die het level speelt met échte toetsaanslagen: lopen, springen
// bij randen/obstakels, wachten op bewegende plankjes en opdrachten beantwoorden.
//
// Twee manieren:
//   ?play&bot          – realtime (kijk mee in de browser)
//   window.botSim(n)   – stapt de game zelf n frames vooruit (1/60 s per stap),
//                        onafhankelijk van of het tabblad zichtbaar is
// Resultaten: window.botLog. Optie ?bot=0,3 → bij schoorsteen 1 en 4 eerst fout antwoorden.

const CODES = { KeyD: 68, KeyA: 65, Space: 32, KeyE: 69, Digit1: 49, Digit2: 50, Digit3: 51, Escape: 27, Enter: 13 };
const kd = (code) => window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, keyCode: CODES[code], which: CODES[code] }));
const ku = (code) => window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, keyCode: CODES[code], which: CODES[code] }));

function createBot(game, wrongOn) {
  const log = [];
  window.botLog = log;
  window.botDone = false;
  const wrong = new Set(wrongOn);
  const held = { KeyD: false, Space: false };
  const set = (c, v) => {
    if (held[c] !== v) {
      held[c] = v;
      if (v) kd(c);
      else ku(c);
    }
  };
  const pending = []; // geplande keyups [tijd, code]
  const tap = (code, now) => {
    kd(code);
    pending.push([now + 50, code]);
  };
  let jumpStart = -1e9;
  let lastQuiz = 0;
  let lastE = 0;
  let t0 = null;
  let falls = 0;
  let wasRespawn = false;
  const answered = new Map();

  function tick(now) {
    if (t0 === null) t0 = now;
    for (let i = pending.length - 1; i >= 0; i--) {
      if (now >= pending[i][0]) {
        ku(pending[i][1]);
        pending.splice(i, 1);
      }
    }
    if (window.botDone) return;
    if (game.scene.isActive('Results')) {
      set('KeyD', false);
      set('Space', false);
      log.push(`KLAAR: resultatenscherm na ${Math.round((now - t0) / 1000)} s speltijd, ${falls}× gevallen`);
      window.botDone = true;
      return;
    }
    const s = game.scene.getScene('Game');
    if (!s || !s.sys.isActive() || !s.player) return;
    const p = s.player;
    const b = p.body;

    if (s.state === 'respawn' && !wasRespawn) {
      falls++;
      log.push(`GEVALLEN bij x=${Math.round(p.x)}`);
    }
    wasRespawn = s.state === 'respawn';

    if (s.state === 'quiz') {
      set('KeyD', false);
      set('Space', false);
      if (s.quiz && now - lastQuiz > 700) {
        lastQuiz = now;
        const ch = s.activeChimney;
        const q = ch.question;
        const n = answered.get(ch.index) ?? 0;
        let idx = q.correctIndex;
        if (n === 0 && wrong.has(ch.index)) idx = (q.correctIndex + 1) % 3;
        answered.set(ch.index, n + 1);
        tap(`Digit${idx + 1}`, now);
        log.push(`schoorsteen ${ch.index + 1} (x=${ch.x}): ${q.text} → ${q.answers[idx]} (${idx === q.correctIndex ? 'goed' : 'fout'})`);
      }
      return;
    }
    if (s.state !== 'play') {
      set('KeyD', false);
      set('Space', false);
      return;
    }

    const near = s.chimneys.find((c) => c.state === 'open' && c.isNear(p) && p.onFloor);
    if (near) {
      set('KeyD', false);
      set('Space', false);
      if (Math.abs(b.velocity.x) < 40 && now - lastE > 400) {
        lastE = now;
        tap('KeyE', now);
      }
      return;
    }

    // in een sprong: spatie minstens 300 ms vasthouden (volle sprong)
    if (now - jumpStart < 700) {
      set('KeyD', true);
      set('Space', now - jumpStart < 300 || b.velocity.y < 0);
      if (now - jumpStart > 150 && p.onFloor) jumpStart = -1e9;
      return;
    }
    set('Space', false);
    if (!p.onFloor) {
      set('KeyD', true);
      return;
    }

    const surf = [
      ...s.world.solids.getChildren().filter((z) => z.body && z.body.enable && !z.getData('gate')).map((z) => ({ l: z.body.left, r: z.body.right, t: z.body.top })),
      ...s.world.movers.map((m) => ({ l: m.body.left, r: m.body.right, t: m.body.top, mover: true })),
    ];
    const cur = surf.filter((o) => Math.abs(o.t - b.bottom) < 8 && p.x >= o.l - 20 && p.x <= o.r + 20).sort((a, c) => c.r - a.r)[0];
    if (!cur) {
      set('KeyD', true);
      return;
    }
    const jump = () => {
      jumpStart = now;
      set('KeyD', true);
      set('Space', true);
    };
    const wall = surf.some((o) => o.l >= b.right - 3 && o.l <= b.right + 10 && o.t < b.bottom - 6);
    if (wall) {
      jump();
      return;
    }
    const edge = cur.r;
    const contiguous = surf.find((o) => o !== cur && Math.abs(o.l - edge) < 4 && Math.abs(o.t - cur.t) < 4);
    if (contiguous || p.x < edge - 28) {
      set('KeyD', true);
      return;
    }
    const target = surf
      .filter((o) => o !== cur && o.r > edge + 20 && o.l < edge + (o.mover ? 90 : 172) && cur.t - o.t < 110 && o.t - cur.t < 260)
      .sort((a, c) => a.l - c.l)[0];
    if (target) jump();
    else set('KeyD', p.x < edge - 14); // wachten op een plankje
  }

  return { tick, log };
}

export function startBot(game, wrongOn = [0, 3]) {
  const bot = createBot(game, wrongOn);
  const iv = setInterval(() => bot.tick(performance.now()), 16);
  window.botStop = () => {
    clearInterval(iv);
    ku('KeyD');
    ku('Space');
  };
  bot.log.push('bot gestart (realtime)');

  // Gesimuleerde run: neemt de game-loop over en stapt zelf vooruit.
  window.botSim = async (frames = 3000, { wrong = wrongOn } = {}) => {
    window.botStop();
    if (!window.__simBot) {
      window.__simBot = createBot(game, wrong);
      window.__simTime = performance.now();
      game.loop.sleep();
    }
    const sim = window.__simBot;
    const dt = 1000 / 60;
    for (let i = 0; i < frames && !window.botDone; i++) {
      window.__simTime += dt;
      sim.tick(window.__simTime);
      game.step(window.__simTime, dt);
      if (i % 600 === 599) await new Promise((r) => setTimeout(r, 0));
    }
    if (window.botDone) game.loop.wake();
    const sc = game.scene.getScene('Game');
    return { done: !!window.botDone, x: Math.round(sc?.player?.x ?? -1), log: sim.log };
  };
}
