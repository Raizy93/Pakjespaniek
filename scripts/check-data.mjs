// Controleert vragenbanken, sterrenberekening en leveldata zonder browser.
// Gebruik: npm run check
import { BANKS } from '../src/education/registry.js';
import { validateBank, createRound } from '../src/education/QuestionBank.js';
import ResultsTracker from '../src/education/ResultsTracker.js';
import { SCORING } from '../src/config/gameConfig.js';
import level1 from '../src/levels/level1.js';
import { validateLevel } from '../src/levels/validateLevel.js';

let failed = 0;
const check = (cond, msg) => {
  if (!cond) {
    failed++;
    console.error('✗', msg);
  } else console.log('✓', msg);
};

// 1. Vragenbanken
for (const bank of Object.values(BANKS)) {
  const errors = validateBank(bank);
  check(errors.length === 0, `Vragenbank "${bank.id}" is geldig ${errors.length ? '\n  ' + errors.join('\n  ') : ''}`);

  // Rekenkundige controle voor breuk → procent-vragen
  for (const q of bank.questions) {
    const frac = q.prompt.find((p) => typeof p === 'object' && p.frac);
    if (!frac) continue;
    const [t, n] = frac.frac;
    const expected = (t / n) * 100;
    const given = parseFloat(q.correct.replace(',', '.').replace('%', ''));
    check(Math.abs(expected - given) < 1e-9, `${q.id}: ${t}/${n} = ${q.correct}`);
    const others = q.answers.filter((a) => a !== q.correct).map((a) => parseFloat(a.replace(',', '.')));
    check(others.every((v) => Math.abs(v - expected) > 1e-9), `${q.id}: afleiders zijn echt fout`);
    if (q.explanation) check(q.explanation.includes(q.correct), `${q.id}: uitleg noemt het juiste antwoord`);
  }

  // Willekeur: positie van juiste antwoord varieert en vragen blijven compleet
  const positions = new Set();
  const orders = new Set();
  for (let i = 0; i < 200; i++) {
    const round = createRound(bank, bank.questions.length);
    orders.add(round.map((q) => q.id).join(','));
    for (const q of round) {
      positions.add(q.correctIndex);
      if (q.answers[q.correctIndex] !== q.correct) throw new Error('correctIndex klopt niet');
    }
    if (new Set(round.map((q) => q.id)).size !== bank.questions.length) throw new Error('vraag dubbel in ronde');
  }
  check(positions.size === 3, `Juiste antwoord komt op alle 3 posities voor`);
  check(orders.size > 50, `Vraagvolgorde wordt gehusseld (${orders.size} verschillende volgordes in 200 rondes)`);
}

// 2. Sterren
const table = [[8, 3], [7, 2], [6, 2], [5, 1], [4, 1], [3, 0], [0, 0]];
for (const [n, s] of table) check(SCORING.stars(n, 8) === s, `${n} direct goed → ${s} sterren`);

// 3. ResultsTracker
const bank = Object.values(BANKS)[0];
const round = createRound(bank, 8);
const rt = new ResultsTracker(8);
round.forEach((q, i) => {
  rt.startQuestion(q);
  if (i < 2) rt.answer(q, q.answers[(q.correctIndex + 1) % 3]);
  rt.answer(q, q.correct);
});
check(rt.delivered === 8 && rt.firstTryCorrect === 6 && rt.wrongAnswers === 2, 'Tracker telt bezorgd/direct goed/fouten');
check(rt.stars === 2 && rt.mistakes.length === 2, 'Tracker: 2 sterren en 2 fouten terug te kijken');

// 4. Level
const levelErrors = validateLevel(level1);
check(levelErrors.length === 0, `Level "${level1.name}" is haalbaar ${levelErrors.length ? '\n  ' + levelErrors.join('\n  ') : ''}`);
check(level1.chimneys.length === 8, 'Level heeft 8 schoorstenen');

console.log(failed ? `\n${failed} controle(s) mislukt` : '\nAlle controles geslaagd');
process.exit(failed ? 1 : 0);
