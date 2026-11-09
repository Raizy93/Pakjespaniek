import Phaser from 'phaser';
import { FONT } from '../config/gameConfig.js';

/** Tekst met vaste huisstijl (scherp door resolution 2). */
export function makeText(scene, x, y, str, opts = {}) {
  const {
    size = 24, color = '#ffffff', weight = '600', stroke = null, strokeThickness = 0,
    align = 'center', origin = 0.5, shadow = false, wrap = 0, lineSpacing = 4,
  } = opts;
  const style = {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: weight,
    color,
    align,
    resolution: 2,
    lineSpacing,
  };
  if (stroke) {
    style.stroke = stroke;
    style.strokeThickness = strokeThickness || Math.max(2, Math.round(size / 7));
  }
  if (wrap) style.wordWrap = { width: wrap, useAdvancedWrap: true };
  const t = scene.add.text(x, y, str, style);
  if (Array.isArray(origin)) t.setOrigin(origin[0], origin[1]);
  else t.setOrigin(origin);
  if (shadow) t.setShadow(0, 3, 'rgba(3,6,20,0.6)', 4, true, true);
  return t;
}

/**
 * Zet een vraag-prompt neer: tekstdelen en gestapelde breuken naast elkaar,
 * gecentreerd rond (x, y). Geeft een container terug.
 */
export function makePrompt(scene, parts, x, y, { size = 52, color = '#1b2552', stroke = null } = {}) {
  const outline = stroke ? { stroke, strokeThickness: Math.max(3, Math.round(size / 9)) } : {};
  const c = scene.add.container(x, y);
  const items = [];
  let width = 0;
  for (const part of parts) {
    if (typeof part === 'string') {
      const t = makeText(scene, 0, 0, part, { size, color, weight: '700', origin: [0, 0.5], ...outline });
      items.push({ obj: [t], w: t.width });
      width += t.width;
    } else if (part.frac) {
      const fs = Math.round(size * 0.68);
      const num = makeText(scene, 0, -fs * 0.62, String(part.frac[0]), { size: fs, color, weight: '700', ...outline });
      const den = makeText(scene, 0, fs * 0.66, String(part.frac[1]), { size: fs, color, weight: '700', ...outline });
      const w = Math.max(num.width, den.width) + 14;
      const bar = scene.add.rectangle(0, 0, w, Math.max(3, size / 14), Phaser.Display.Color.HexStringToColor(color).color);
      if (stroke) bar.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(stroke).color);
      items.push({ obj: [num, den, bar], w, center: true });
      width += w + 6;
    }
  }
  let cx = -width / 2;
  for (const it of items) {
    for (const o of it.obj) {
      if (it.center) o.x = cx + it.w / 2;
      else o.x = cx;
      c.add(o);
    }
    cx += it.w + (it.center ? 6 : 0);
  }
  c.promptWidth = width;
  return c;
}

export function formatTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
