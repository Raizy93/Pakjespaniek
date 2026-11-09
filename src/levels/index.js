// Alle levels op volgorde. Een nieuw level toevoegen = bestand maken en hier opnemen.
import level1 from './level1.js';
import level2 from './level2.js';

export const LEVELS = [level1, level2];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

export function nextLevel(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 ? LEVELS[i + 1] ?? null : null;
}
