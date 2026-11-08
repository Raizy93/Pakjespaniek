// Overzicht van speelbare personages. Een nieuw personage toevoegen:
// teken het met de gedeelde rig (src/assets/characterRig.js) en registreer het hier.
import { drawPiet } from '../assets/piet.js';
import { drawSint, sintPoses } from '../assets/sint.js';
import { characterPoses } from '../assets/characterRig.js';

export const CHARACTERS = {
  piet: {
    id: 'piet',
    name: 'Piet',
    tagline: 'Vrolijke pakjesbezorger',
    draw: drawPiet,
    poses: characterPoses,
  },
  sint: {
    id: 'sint',
    name: 'Sinterklaas',
    tagline: 'De Sint bezorgt zelf!',
    draw: drawSint,
    poses: sintPoses,
  },
};

export const CHARACTER_ORDER = ['piet', 'sint'];
export const DEFAULT_CHARACTER = 'piet';

export function getCharacter(id) {
  return CHARACTERS[id] ?? CHARACTERS[DEFAULT_CHARACTER];
}
