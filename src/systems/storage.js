// Lokale opslag: instellingen en de beste score per level (= voortgang).
// Alles in try/catch: in iframes of privévensters kan opslag geblokkeerd zijn.
//
// Schema (zie save-systems-skill): elke opslag heeft een `version`. Bij het laden
// worden oudere versies bijgewerkt en wordt alles gevalideerd, zodat een kapotte of
// oude opslag het spel nooit laat vastlopen.
const KEY = 'pakjespaniek.v1';
const VERSION = 1;

const DEFAULTS = {
  version: VERSION,
  settings: { music: true, sfx: true, character: 'piet' },
  best: {}, // levelId → { stars, points }; een level met een score is uitgespeeld
};

// v0 (zonder versienummer) → v1: zelfde vorm, alleen het versienummer erbij
const MIGRATIONS = {
  0: (d) => d,
};

function validate(data) {
  const out = structuredClone(DEFAULTS);
  const s = data.settings ?? {};
  if (typeof s.music === 'boolean') out.settings.music = s.music;
  if (typeof s.sfx === 'boolean') out.settings.sfx = s.sfx;
  if (typeof s.character === 'string') out.settings.character = s.character;
  for (const [id, b] of Object.entries(data.best ?? {})) {
    const stars = Number(b?.stars);
    const points = Number(b?.points);
    if (Number.isInteger(stars) && stars >= 0 && stars <= 3 && Number.isFinite(points) && points >= 0) {
      out.best[id] = { stars, points };
    }
  }
  return out;
}

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    let data = JSON.parse(raw);
    let v = Number.isInteger(data.version) ? data.version : 0;
    if (v > VERSION) return validate(data); // opslag van een nieuwere versie: lezen wat kan
    while (v < VERSION) data = MIGRATIONS[v++](data);
    return validate(data);
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let cache = read();

function write() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...cache, version: VERSION }));
  } catch {
    /* opslag niet beschikbaar: voortgang geldt alleen deze sessie */
  }
}

export const Storage = {
  get settings() {
    return cache.settings;
  },
  setSetting(name, value) {
    cache.settings[name] = value;
    write();
  },
  getBest(levelId) {
    return cache.best[levelId] ?? null;
  },
  /** @returns {boolean} true als dit een nieuw record is */
  submitResult(levelId, { stars, points }) {
    const prev = cache.best[levelId];
    const better = !prev || stars > prev.stars || (stars === prev.stars && points > prev.points);
    if (better) {
      cache.best[levelId] = { stars, points };
      write();
    }
    return better;
  },
};

/**
 * Voortgang over een lijst levels: een level is open als het het eerste is
 * of als het vorige level is uitgespeeld (ongeacht het aantal sterren).
 */
export function levelProgress(levels) {
  return levels.map((level, i) => ({
    level,
    best: Storage.getBest(level.id),
    unlocked: i === 0 || Boolean(Storage.getBest(levels[i - 1].id)),
  }));
}

export function totalStars(levels) {
  return levels.reduce((sum, l) => sum + (Storage.getBest(l.id)?.stars ?? 0), 0);
}
