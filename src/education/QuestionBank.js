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
 * Filtert de vragen van een bank volgens een leerlijn-spec (per level):
 *   groups      – toegestane groepen (bijv. ['/2', '/4', '/10']); weglaten = alle
 *   excludeTags – vragen met één van deze tags overslaan (bijv. ['geheel'])
 */
export function questionsForSpec(bank, spec = {}) {
  return bank.questions.filter((q) => {
    if (spec.groups && !spec.groups.includes(q.group)) return false;
    if (spec.excludeTags && (q.tags ?? []).some((t) => spec.excludeTags.includes(t))) return false;
    return true;
  });
}

/**
 * Kiest `count` vragen uit `pool`: gewogen willekeurig, zonder twee vragen met
 * hetzelfde antwoord, en hooguit `maxPerGroup` per groep. `state` wordt gedeeld
 * tussen soorten vragen, zodat die regels voor de hele ronde gelden.
 */
function pickQuestions(pool, count, random, maxPerGroup, state) {
  // gewogen husselen: een vraag met `weight` < 1 komt minder vaak vooraan (Efraimidis–Spirakis)
  const ordered = pool
    .map((q) => ({ q, key: Math.pow(random(), 1 / (q.weight ?? 1)) }))
    .sort((a, b) => b.key - a.key)
    .map((e) => e.q);
  const picked = [];
  for (const q of ordered) {
    if (picked.length >= count) break;
    const key = q.value !== undefined ? String(Math.round(q.value * 1000)) : norm(q.correct);
    const g = q.group ?? '';
    if (state.answersUsed.has(key) || (state.perGroup.get(g) ?? 0) >= maxPerGroup) continue;
    picked.push(q);
    state.answersUsed.add(key);
    state.perGroup.set(g, (state.perGroup.get(g) ?? 0) + 1);
  }
  return picked;
}

/**
 * Maakt een speelronde: vragen in willekeurige volgorde, per vraag 3 antwoorden
 * (bij distractors: 2 gekozen foute) in willekeurige volgorde.
 * Het juiste antwoord blijft expliciet bewaard (correctIndex + correct).
 *
 * spec (optioneel, per level): groups, excludeTags, maxPerGroup en
 * mix – aantal vragen per soort, bijv. { forward: 5, reverse: 3 }.
 * Zonder mix worden alleen gewone vragen (soort 'forward') gebruikt.
 */
export function createRound(bank, count, random = Math.random, spec = {}) {
  const errors = validateBank(bank);
  if (errors.length) {
    throw new Error(`Vragenbank "${bank?.id}" is ongeldig:\n${errors.join('\n')}`);
  }
  const pool = questionsForSpec(bank, spec);
  const maxPerGroup = spec.maxPerGroup ?? bank.maxPerGroup ?? Infinity;
  const mix = spec.mix ?? { forward: count };
  const state = { answersUsed: new Set(), perGroup: new Map() };
  let picked = [];
  for (const [kind, n] of Object.entries(mix)) {
    picked.push(...pickQuestions(pool.filter((q) => (q.kind ?? 'forward') === kind), n, random, maxPerGroup, state));
  }
  // te strenge regels voor deze pool? vul dan aan, eerst zonder groepslimiet
  if (picked.length < count) {
    const rest = pool.filter((q) => !picked.includes(q) && Object.keys(mix).includes(q.kind ?? 'forward'));
    picked.push(...pickQuestions(rest, count - picked.length, random, Infinity, state));
  }
  picked = shuffle(picked, random).slice(0, count);

  return picked.map((q) => {
    const options = q.answers ?? [q.correct, ...weightedPick(q.distractors, 2, random)];
    const answers = shuffle(options, random);
    return {
      id: q.id,
      kind: q.kind ?? 'forward',
      instruction: q.instruction ?? null,
      prompt: q.prompt,
      text: q.text,
      answers,
      correct: q.correct,
      correctIndex: answers.indexOf(q.correct),
      explanation: q.explanation ?? '',
    };
  });
}
