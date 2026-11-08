// Logica rond vragenbanken: validatie en een willekeurige speelronde.
// Bevat geen Phaser-code, zodat het los te testen is (zie scripts/check-data.mjs).

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
    if (!Array.isArray(q.answers) || q.answers.length !== 3) {
      errors.push(`${where}: moet precies 3 antwoorden hebben`);
      continue;
    }
    const normalized = q.answers.map((a) => String(a).trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length) errors.push(`${where}: dubbele antwoorden`);
    const hits = q.answers.filter((a) => a === q.correct).length;
    if (hits !== 1) errors.push(`${where}: juiste antwoord komt ${hits}× voor (moet 1× zijn)`);
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

/**
 * Maakt een speelronde: vragen in willekeurige volgorde, en per vraag
 * de antwoorden in willekeurige volgorde. Het juiste antwoord blijft
 * expliciet bewaard (correctIndex + correct).
 */
export function createRound(bank, count, random = Math.random) {
  const errors = validateBank(bank);
  if (errors.length) {
    throw new Error(`Vragenbank "${bank?.id}" is ongeldig:\n${errors.join('\n')}`);
  }
  const picked = shuffle(bank.questions, random).slice(0, count);
  return picked.map((q) => {
    const answers = shuffle(q.answers, random);
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
