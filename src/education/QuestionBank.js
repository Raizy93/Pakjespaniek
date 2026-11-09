// Logica rond vragenbanken: validatie en een willekeurige speelronde.
// Bevat geen Phaser-code, zodat het los te testen is (zie scripts/check-data.mjs).
//
// Een vraag heeft óf een vaste lijst `answers` (precies 3, met `correct` erin),
// óf `correct` + `distractors` (minstens 2); dan worden per ronde 2 foute
// antwoorden willekeurig gekozen.

const norm = (a) => String(a).trim().toLowerCase();

export function validateBank(bank) {
  const errors = [];
  const ids = new Set();
  if (!bank || !Array.isArray(bank.questions)) {
    return ['Vragenbank heeft geen lijst met vragen.'];
  }
  for (const q of bank.questions) {
    const where = `vraag ${q.id ?? '(zonder id)'}`;
    if (!q.id) errors.push(`${where}: ontbrekende id`);
    if (ids.has(q.id)) errors.push(`${where}: dubbele id`);
    ids.add(q.id);
    if (!Array.isArray(q.prompt) || q.prompt.length === 0) errors.push(`${where}: lege prompt`);
    if (typeof q.text !== 'string' || !q.text) errors.push(`${where}: ontbrekende platte tekst`);
    if (typeof q.correct !== 'string' || !q.correct) errors.push(`${where}: ontbrekend juist antwoord`);

    if (Array.isArray(q.answers)) {
      if (q.answers.length !== 3) errors.push(`${where}: moet precies 3 antwoorden hebben`);
      const normalized = q.answers.map(norm);
      if (new Set(normalized).size !== normalized.length) errors.push(`${where}: dubbele antwoorden`);
      const hits = q.answers.filter((a) => a === q.correct).length;
      if (hits !== 1) errors.push(`${where}: juiste antwoord komt ${hits}× voor (moet 1× zijn)`);
    } else if (Array.isArray(q.distractors)) {
      if (q.distractors.length < 2) errors.push(`${where}: minstens 2 foute antwoorden nodig`);
      const normalized = q.distractors.map(norm);
      if (new Set(normalized).size !== normalized.length) errors.push(`${where}: dubbele foute antwoorden`);
      if (normalized.includes(norm(q.correct))) errors.push(`${where}: juiste antwoord staat tussen de foute`);
    } else {
      errors.push(`${where}: geen answers of distractors`);
    }
  }
  return errors;
}

export function shuffle(list, random = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Kiest `n` items zonder teruglegging; item i heeft gewicht 1/(i+1) (eerste = sterkste). */
export function weightedPick(list, n, random = Math.random) {
  const pool = list.map((item, i) => ({ item, w: 1 / (i + 1) }));
  const out = [];
  while (out.length < n && pool.length) {
    let r = random() * pool.reduce((s, p) => s + p.w, 0);
    let idx = 0;
    while (idx < pool.length - 1 && r >= pool[idx].w) {
      r -= pool[idx].w;
      idx++;
    }
    out.push(pool.splice(idx, 1)[0].item);
  }
  return out;
}

/**
 * Kiest `count` vragen voor een ronde: willekeurig, zonder twee vragen met
 * hetzelfde antwoord, en (indien ingesteld) hooguit `maxPerGroup` per groep.
 */
function pickQuestions(bank, count, random) {
  const maxPerGroup = bank.maxPerGroup ?? Infinity;
  // gewogen husselen: een vraag met `weight` < 1 komt minder vaak vooraan (Efraimidis–Spirakis)
  const pool = bank.questions
    .map((q) => ({ q, key: Math.pow(random(), 1 / (q.weight ?? 1)) }))
    .sort((a, b) => b.key - a.key)
    .map((e) => e.q);
  const picked = [];
  const answersUsed = new Set();
  const perGroup = new Map();
  for (const q of pool) {
    if (picked.length >= count) break;
    const key = q.value !== undefined ? String(Math.round(q.value * 1000)) : norm(q.correct);
    const g = q.group ?? '';
    if (answersUsed.has(key) || (perGroup.get(g) ?? 0) >= maxPerGroup) continue;
    picked.push(q);
    answersUsed.add(key);
    perGroup.set(g, (perGroup.get(g) ?? 0) + 1);
  }
  // te strenge regels voor deze bank? vul dan aan met de rest
  for (const q of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(q)) picked.push(q);
  }
  return picked;
}

/**
 * Maakt een speelronde: vragen in willekeurige volgorde, per vraag 3 antwoorden
 * (bij distractors: 2 willekeurig gekozen foute) in willekeurige volgorde.
 * Het juiste antwoord blijft expliciet bewaard (correctIndex + correct).
 */
export function createRound(bank, count, random = Math.random) {
  const errors = validateBank(bank);
  if (errors.length) {
    throw new Error(`Vragenbank "${bank?.id}" is ongeldig:\n${errors.join('\n')}`);
  }
  return pickQuestions(bank, count, random).map((q) => {
    const options = q.answers ?? [q.correct, ...weightedPick(q.distractors, 2, random)];
    const answers = shuffle(options, random);
    return {
      id: q.id,
      prompt: q.prompt,
      text: q.text,
      answers,
      correct: q.correct,
      correctIndex: answers.indexOf(q.correct),
      explanation: q.explanation ?? '',
    };
  });
}
