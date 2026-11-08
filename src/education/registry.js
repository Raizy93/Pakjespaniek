// Overzicht van beschikbare leerdoelen. Later kan het hoofdmenu hieruit
// een keuzelijst tonen; voor versie 1 is er één leerdoel actief.
import breukenProcenten from './banks/breukenProcenten.js';

export const BANKS = {
  [breukenProcenten.id]: breukenProcenten,
};

export const DEFAULT_BANK_ID = breukenProcenten.id;

export function getBank(id = DEFAULT_BANK_ID) {
  return BANKS[id] ?? BANKS[DEFAULT_BANK_ID];
}
