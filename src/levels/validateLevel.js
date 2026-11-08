import { METRICS } from '../config/gameConfig.js';

// Controleert of een level haalbaar is met de sprong-metrics van Piet.
// Movers tellen als één oppervlak over hun hele bereik (de speler kan wachten).
export function validateLevel(level) {
  const errors = [];
  const surfaces = [];

  for (const b of level.buildings) {
    surfaces.push({ name: `huis@${b.x}`, left: b.x, right: b.x + b.w, topHigh: b.top, topLow: b.top });
  }
  for (const p of level.platforms) {
    const to = p.to ?? { x: p.x, y: p.y };
    surfaces.push({
      name: `${p.type}@${p.x}`,
      left: Math.min(p.x, to.x),
      right: Math.max(p.x, to.x) + p.w,
      topHigh: Math.min(p.y, to.y), // hoogste stand (kleinste y)
      topLow: Math.max(p.y, to.y), // laagste stand
    });
  }
  surfaces.sort((a, b) => a.left - b.left);

  for (let i = 0; i < surfaces.length - 1; i++) {
    const cur = surfaces[i];
    const next = surfaces[i + 1];
    const gap = next.left - cur.right;
    if (gap > METRICS.safeGap) errors.push(`Gat van ${gap}px tussen ${cur.name} en ${next.name} is te breed (max ${METRICS.safeGap})`);
    // Stap omhoog: vanaf het hoogste punt van cur naar het laagste haalbare punt van next
    const rise = cur.topHigh - next.topLow;
    if (rise > METRICS.maxStepUp) errors.push(`Stap omhoog van ${rise}px naar ${next.name} is te hoog (max ${METRICS.maxStepUp})`);
    if (gap < -1) errors.push(`${cur.name} en ${next.name} overlappen`);
    // omhoog springen over een gat is lastiger: stijging telt mee
    // gunstigste stand bij movers: huidig oppervlak zo hoog mogelijk, doel zo laag mogelijk
    const effort = gap + Math.max(0, cur.topHigh - next.topLow);
    if (gap > 0 && effort > METRICS.maxRisingGapEffort) {
      errors.push(`Gat ${gap}px + stijging naar ${next.name} is te lastig (${effort} > ${METRICS.maxRisingGapEffort})`);
    }
  }

  const buildingAt = (x) => level.buildings.find((b) => x >= b.x && x <= b.x + b.w);
  level.chimneys.forEach((x, i) => {
    const b = buildingAt(x);
    if (!b) errors.push(`Schoorsteen ${i + 1} (x=${x}) staat niet op een dak`);
    else if (!buildingAt(x + 110) || buildingAt(x + 110) !== b) errors.push(`Schoorsteen ${i + 1}: geen ruimte voor de poort op hetzelfde dak`);
  });
  const sorted = [...level.chimneys].sort((a, b) => a - b);
  if (sorted.some((x, i) => x !== level.chimneys[i])) errors.push('Schoorstenen staan niet op volgorde');
  if (!buildingAt(level.finish.x)) errors.push('Finish staat niet op een dak');
  if (level.finish.x <= sorted[sorted.length - 1] + 110) errors.push('Finish ligt vóór de laatste poort');
  for (const x of level.checkpoints) if (!buildingAt(x)) errors.push(`Checkpoint x=${x} staat niet op een dak`);
  if (!buildingAt(level.spawn.x)) errors.push('Startpunt staat niet op een dak');

  return errors;
}
