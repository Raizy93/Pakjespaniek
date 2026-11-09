// Controleert vragenbanken, sterrenberekening en leveldata zonder browser.
// Gebruik: npm run check
import { BANKS } from '../src/education/registry.js';
import { parsePercent } from '../src/education/banks/breukenProcenten.js';
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
const ROUND = 8;
for (const bank of Object.values(BANKS)) {
  const errors = validateBank(bank);
  check(errors.length === 0, `Vragenbank "${bank.id}" is geldig (${bank.questions.length} vragen) ${errors.length ? '\n  ' + errors.join('\n  ') : ''}`);

  // Rekenkundige controle voor breuk → procent-vragen
  let arithmeticOk = true;
  let distractorsOk = true;
  let explanationOk = true;
  for (const q of bank.questions) {
    const frac = q.prompt.find((p) => typeof p === 'object' && p.frac);
    if (!frac) continue;
    const [t, n] = frac.frac;
    const expected = (t / n) * 100;
    // juist = exacte waarde, afgerond op één decimaal (1/3 → 33,3%; 2/3 → 66,7%)
    if (Math.abs(parsePercent(q.correct) - Math.round(expected * 10) / 10) > 1e-9) {
      arithmeticOk = false;
      console.error(`  ${q.id}: ${t}/${n} ≠ ${q.correct}`);
    }
    const wrong = q.answers ? q.answers.filter((a) => a !== q.correct) : q.distractors;
    const bad = wrong.filter((a) => Math.abs(parsePercent(a) - expected) < 3.9 || parsePercent(a) <= 0 || parsePercent(a) >= 100);
    if (bad.length || wrong.length < 2) {
      distractorsOk = false;
      console.error(`  ${q.id}: verdachte foute antwoorden ${bad.join(', ')}`);
    }
    if (q.explanation && !q.explanation.includes(q.correct)) {
      explanationOk = false;
      console.error(`  ${q.id}: uitleg noemt ${q.correct} niet`);
    }
  }
  check(arithmeticOk, 'Alle juiste antwoorden kloppen rekenkundig');
  check(distractorsOk, 'Alle foute antwoorden zijn echt fout (≥ 4 procentpunt verschil, tussen 0 en 100%)');
  check(explanationOk, 'Elke uitleg noemt het juiste antwoord');

  // Willekeur en regels per ronde
  const positions = new Set();
  const orders = new Set();
  const seenQuestions = new Set();
  const answerSets = new Set();
  let roundsOk = true;
  for (let i = 0; i < 500; i++) {
    const round = createRound(bank, ROUND);
    orders.add(round.map((q) => q.id).join(','));
    const values = new Set();
    const perGroup = new Map();
    for (const q of round) {
      seenQuestions.add(q.id);
      answerSets.add(`${q.id}:${[...q.answers].sort().join('|')}`);
      positions.add(q.correctIndex);
      const src = bank.questions.find((b) => b.id === q.id);
      if (q.answers.length !== 3 || new Set(q.answers).size !== 3) roundsOk = false;
      if (q.answers[q.correctIndex] !== q.correct || q.answers.filter((a) => a === q.correct).length !== 1) roundsOk = false;
      values.add(q.correct);
      perGroup.set(src.group, (perGroup.get(src.group) ?? 0) + 1);
    }
    if (round.length !== ROUND || values.size !== ROUND) roundsOk = false;
    if ([...perGroup.values()].some((c) => c > (bank.maxPerGroup ?? Infinity))) roundsOk = false;
  }
  check(roundsOk, `500 rondes: steeds ${ROUND} vragen, 3 verschillende antwoorden, precies 1 juist, geen dubbele antwoorden, max ${bank.maxPerGroup} per noemer`);
  check(positions.size === 3, 'Juiste antwoord komt op alle 3 posities voor');
  check(orders.size > 450, `Vragen worden willekeurig gekozen (${orders.size} verschillende rondes van 500)`);
  check(seenQuestions.size === bank.questions.length, `Alle ${bank.questions.length} breuken komen voor (${seenQuestions.size} gezien)`);
  check(answerSets.size > bank.questions.length, `Foute antwoorden variëren per ronde (${answerSets.size} combinaties)`);
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
