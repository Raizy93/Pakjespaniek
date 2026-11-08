// Lokale opslag, alleen voor instellingen en de beste score per level.
// Alles in try/catch: in iframes of privévensters kan opslag geblokkeerd zijn.
const KEY = 'pakjespaniek.v1';

const DEFAULTS = {
  settings: { music: true, sfx: true },
  best: {}, // levelId → { stars, points }
};

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...data, settings: { ...DEFAULTS.settings, ...(data.settings || {}) } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let cache = read();

function write() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* opslag niet beschikbaar: instellingen gelden alleen deze sessie */
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
