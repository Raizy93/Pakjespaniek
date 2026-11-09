/**
 * Schuift een heel level verticaal op en maakt het even veel hoger.
 * Handig om bovenin ruimte te maken (bijv. voor de opdracht boven een hoge schoorsteen)
 * zonder alle getallen in het levelbestand te hoeven aanpassen.
 */
export function shiftLevelY(level, dy) {
  return {
    ...level,
    height: level.height + dy,
    buildings: level.buildings.map((b) => ({ ...b, top: b.top + dy })),
    platforms: level.platforms.map((p) => ({ ...p, y: p.y + dy, ...(p.to ? { to: { ...p.to, y: p.to.y + dy } } : {}) })),
    pepernoten: level.pepernoten.map(([x, y]) => [x, y + dy]),
  };
}
