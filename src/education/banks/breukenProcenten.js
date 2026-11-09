// Vragenbank: Breuken → procenten (groep 7–8)
//
// Basale breuken: noemers 2, 3, 4, 5, 8 en 10, met alle veelvouden daarvan
// tot en met het geheel (1/4, 2/4, 3/4, 4/4 … 10/10). Elke speelronde kiest hier
// willekeurig 8 vragen uit (nooit twee met hetzelfde antwoord, dus hooguit één keer 100%).
//
// Formaat van een vraag (algemeen, niet alleen voor getallen):
//   id          – unieke vraag-ID
//   prompt      – lijst van onderdelen: tekst (string) of { frac: [teller, noemer] }
//   text        – platte-tekstversie van de vraag (foutenoverzicht)
//   correct     – het juiste antwoord (tekst)
//   distractors – mogelijke foute antwoorden (minstens 2), sterkste eerst; per ronde worden
//                 er 2 gekozen (eerdere opties hebben meer kans)
//                 (in plaats daarvan mag ook een vaste lijst `answers` van precies 3)
//   explanation – korte uitleg voor het terugkijken van fouten
//   value       – getalswaarde van het antwoord (zodat een ronde geen dubbele antwoorden krijgt)
//   group       – categorie (hier de noemer), voor variatie binnen een ronde
//   weight      – kans om gekozen te worden (1 = normaal, lager = minder vaak)

const DENOMINATORS = [2, 3, 4, 5, 8, 10];

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/** Procent als Nederlands kommagetal, op hooguit één decimaal: 50%, 12,5%, 33,3%, 66,7%. */
export function formatPercent(v) {
  const r = Math.round(v * 10) / 10;
  return `${String(r).replace('.', ',')}%`;
}

/** Leest '33,3%' / '12,5%' terug als getal (voor controles). */
export function parsePercent(s) {
  return Number(s.replace('%', '').trim().replace(',', '.'));
}

// Waarde van 1/n in procenten, als tekst voor de uitleg (derden apart, zie explanationFor)
const UNIT = { 2: '50%', 4: '25%', 5: '20%', 8: '12,5%', 10: '10%' };

const PARTS = { 2: 'helften', 3: 'derden', 4: 'kwarten', 5: 'vijfden', 8: 'achtsten', 10: 'tienden' };

function explanationFor(k, n, correct) {
  if (k === n) return `${n}/${n} = alle ${PARTS[n]} samen = het geheel = 100%.`;
  const g = gcd(k, n);
  if (g > 1) return `${k}/${n} = ${k / g}/${n / g}, dus ${correct}.`;
  if (n === 2) return 'De helft van 100% is 50%.';
  // derden: als deling uitleggen (2 × 33,3 = 66,6, dus niet via afgeronde 33,3%)
  if (n === 3) return k === 1 ? '1/3 = 100 : 3 = 33,333…, afgerond 33,3%.' : '2/3 = 200 : 3 = 66,666…, afgerond 66,7%.';
  if (n === 10) return `${k}/10 = ${k * 10}/100, dus ${correct}.`;
  if (n === 8 && k === 1) return '1/8 is de helft van 1/4: de helft van 25% = 12,5%.';
  if (k === 1) return `1/${n} = ${100 / n}/100, dus ${correct}.`;
  return `1/${n} = ${UNIT[n]}, dus ${k}/${n} = ${k} × ${UNIT[n]} = ${correct}.`;
}

/**
 * Foute antwoorden op basis van veelgemaakte denkfouten.
 * Alleen waarden tussen 0 en 100 die duidelijk (≥ 4 procentpunt) van het goede antwoord verschillen.
 */
function distractorsFor(k, n) {
  const p = (k / n) * 100;
  const cands = [];
  const add = (v) => cands.push(v);
  if (k === n) {
    add(n); // het geheel: noemer als procent, 8/8 → 8%
    add(1); // "één geheel" = 1%
  }
  add(100 - p); // complement: 3/4 → 25%
  add(p / 2); // de helft: 1/2 → 25%
  add(p * 2); // het dubbele: 1/4 → 50%
  add(((k + 1) / n) * 100); // buur-breuk
  add(((k - 1) / n) * 100);
  if ([2, 4, 8].includes(n)) {
    add(p + 25); // een kwart ernaast: 1/2 → 75%
    add(p - 25);
  }
  if (n === 10) add(k); // tiendelen als procent: 1/10 → 1%
  if (k === 1) add(n); // noemer als procent: 1/4 → 4%
  add(Number(`${k}${n}`)); // cijfers aan elkaar: 3/4 → 34%
  add(k * 10); // teller × 10: 3/4 → 30%
  const swap = { 4: 5, 5: 4, 8: 10, 10: 8, 3: 4, 2: 3 }[n]; // verwisselde noemer: 1/5 → 25%
  if (k < swap) add((k / swap) * 100);
  const seen = new Set();
  // alleen "nette" waarden (heel, x,5 of een derde): geen vreemde afrondingen als afleider
  const nice = (v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 || Math.abs(v - 100 / 3) < 1e-6 || Math.abs(v - 200 / 3) < 1e-6;
  return cands
    .filter((v) => v > 0 && v < 100 && Math.abs(v - p) >= 4 && nice(v))
    .map(formatPercent)
    .filter((s) => s !== formatPercent(p) && !seen.has(s) && seen.add(s));
}

function buildQuestions() {
  const list = [];
  for (const n of DENOMINATORS) {
    // k = n hoort er ook bij: het geheel (2/2, 3/3 … 10/10 = 100%)
    for (let k = 1; k <= n; k++) {
      const value = (k / n) * 100;
      const correct = formatPercent(value);
      list.push({
        id: `bp-${k}-${n}`,
        prompt: [{ frac: [k, n] }, ' = … %'],
        text: `${k}/${n} = …%`,
        correct,
        distractors: distractorsFor(k, n),
        explanation: explanationFor(k, n, correct),
        value,
        group: `/${n}`,
        // hele breuken (100%) wat minder vaak, zodat niet elke ronde er één heeft
        weight: k === n ? 0.22 : 1,
      });
    }
  }
  return list;
}

export default {
  id: 'breuken-procenten',
  title: 'Breuken en procenten',
  goal: 'Ik kan veelvoorkomende breuken omzetten naar procenten.',
  groups: 'Groep 7–8',
  instruction: 'Welk cadeau hoort bij deze breuk?',
  maxPerGroup: 2, // per ronde hooguit 2 breuken met dezelfde noemer
  questions: buildQuestions(),
};
