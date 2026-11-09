// Controleert vragenbanken, sterrenberekening en leveldata zonder browser.
// Gebruik: npm run check
import { BANKS } from '../src/education/registry.js';
import { parsePercent, parseFrac } from '../src/education/banks/breukenProcenten.js';
import { validateBank, createRound, questionsForSpec } from '../src/education/QuestionBank.js';
import ResultsTracker from '../src/education/ResultsTracker.js';
import { SCORING } from '../src/config/gameConfig.js';
import { LEVELS } from '../src/levels/index.js';
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
    if (q.kind === 'reverse') {
      // procent → breuk: de juiste breuk moet (afgerond) het gevraagde percentage zijn
      const pct = parsePercent(q.prompt[0].replace('=', ''));
      const val = parseFrac(q.correct);
      if (Math.abs(Math.round(val * 10) / 10 - pct) > 1e-9) {
        arithmeticOk = false;
        console.error(`  ${q.id}: ${q.correct} ≠ ${pct}%`);
      }
      const bad = q.distractors.filter((a) => {
        const v = parseFrac(a);
        return Math.abs(v - val) < 3.9 || v <= 0 || v >= 100;
      });
      if (bad.length || q.distractors.length < 2) {
        distractorsOk = false;
        console.error(`  ${q.id}: verdachte foute breuken ${bad.join(', ')}`);
      }
      if (!q.explanation.includes(q.correct)) {
        explanationOk = false;
        console.error(`  ${q.id}: uitleg noemt ${q.correct} niet`);
      }
      continue;
    }
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
  const forwardCount = bank.questions.filter((q) => (q.kind ?? 'forward') === 'forward').length;
  check(seenQuestions.size === forwardCount, `Alle ${forwardCount} gewone vragen komen voor zonder leerlijn (${seenQuestions.size} gezien)`);
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

// 4. Levels
const levelIds = new Set();
for (const level of LEVELS) {
  const levelErrors = validateLevel(level);
  const detail = levelErrors.length ? '\n  ' + levelErrors.join('\n  ') : '';
  check(levelErrors.length === 0, `Level ${level.number} "${level.name}" is haalbaar${detail}`);
  check(level.chimneys.length === 8, `Level ${level.number} heeft 8 schoorstenen`);
  check(!levelIds.has(level.id), `Level ${level.number} heeft een unieke id (${level.id})`);
  levelIds.add(level.id);

  // leerlijn van dit level: 500 rondes volgens de spec
  const spec = level.learning ?? {};
  const pool = questionsForSpec(bank, spec);
  const mix = spec.mix ?? { forward: ROUND };
  const seen = new Set();
  let ok = true;
  const problems = new Set();
  for (let i = 0; i < 500; i++) {
    const r = createRound(bank, ROUND, Math.random, spec);
    const perGroup = new Map();
    const kinds = {};
    if (r.length !== ROUND) problems.add(`ronde met ${r.length} vragen`);
    if (new Set(r.map((q) => bank.questions.find((b) => b.id === q.id).value)).size !== r.length) problems.add('dubbel antwoord in ronde');
    for (const q of r) {
      const src = bank.questions.find((b) => b.id === q.id);
      seen.add(q.id);
      kinds[q.kind] = (kinds[q.kind] ?? 0) + 1;
      perGroup.set(src.group, (perGroup.get(src.group) ?? 0) + 1);
      if (spec.groups && !spec.groups.includes(src.group)) problems.add(`noemer ${src.group} hoort niet in dit level`);
      if (spec.excludeTags && (src.tags ?? []).some((t) => spec.excludeTags.includes(t))) problems.add(`vraag ${src.id} hoort niet in dit level`);
      if (q.answers[q.correctIndex] !== q.correct || new Set(q.answers).size !== 3) problems.add(`antwoorden kloppen niet bij ${q.id}`);
    }
    if ([...perGroup.values()].some((c) => c > (spec.maxPerGroup ?? Infinity))) problems.add('te veel van één noemer');
    for (const [k, n] of Object.entries(mix)) if ((kinds[k] ?? 0) !== n) problems.add(`soort ${k}: ${kinds[k] ?? 0} i.p.v. ${n}`);
  }
  ok = problems.size === 0;
  const mixText = Object.entries(mix).map(([k, n]) => `${n} ${k === 'reverse' ? 'omgekeerd' : 'gewoon'}`).join(' + ');
  check(ok, `Level ${level.number} leerlijn "${spec.title ?? '-'}": 500 rondes kloppen (${mixText})${ok ? '' : '\n  ' + [...problems].join('\n  ')}`);
  check(seen.size === pool.filter((q) => Object.keys(mix).includes(q.kind ?? 'forward')).length, `Level ${level.number}: alle ${seen.size} vragen uit de leerlijn komen voor`);
}
check(LEVELS.every((l, i) => l.number === i + 1), "Levels staan op volgorde genummerd");

console.log(failed ? `\n${failed} controle(s) mislukt` : '\nAlle controles geslaagd');
process.exit(failed ? 1 : 0);
