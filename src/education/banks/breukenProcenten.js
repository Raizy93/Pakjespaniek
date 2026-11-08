// Vragenbank: Breuken → procenten (groep 7–8)
//
// Formaat (algemeen, niet alleen voor getallen):
//   id       – unieke vraag-ID
//   prompt   – lijst van onderdelen: gewone tekst (string) of { frac: [teller, noemer] }
//   text     – platte-tekstversie van de vraag (voor het foutenoverzicht en schermlezers)
//   answers  – precies drie antwoordteksten (strings, dus ook geschikt voor woorden)
//   correct  – het juiste antwoord, letterlijk gelijk aan één van de answers
//
// Nieuwe leerdoelen (tafels, deelsommen, kommagetallen, werkwoordspelling …)
// voeg je toe als nieuw bestand in deze map en registreer je in ../registry.js.

export default {
  id: 'breuken-procenten',
  title: 'Breuken en procenten',
  goal: 'Ik kan veelvoorkomende breuken omzetten naar procenten.',
  groups: 'Groep 7–8',
  instruction: 'Welk cadeau hoort bij deze breuk?',
  // explanation (optioneel) verschijnt bij het terugkijken van fouten
  questions: [
    { id: 'bp-01', prompt: [{ frac: [1, 2] }, ' = … %'], text: '1/2 = …%', answers: ['25%', '50%', '75%'], correct: '50%', explanation: 'De helft van 100% is 50%.' },
    { id: 'bp-02', prompt: [{ frac: [1, 4] }, ' = … %'], text: '1/4 = …%', answers: ['20%', '25%', '50%'], correct: '25%', explanation: '1/4 = 25/100, dus 25%.' },
    { id: 'bp-03', prompt: [{ frac: [3, 4] }, ' = … %'], text: '3/4 = …%', answers: ['75%', '50%', '80%'], correct: '75%', explanation: '3/4 = 3 × 25% = 75%.' },
    { id: 'bp-04', prompt: [{ frac: [1, 5] }, ' = … %'], text: '1/5 = …%', answers: ['10%', '25%', '20%'], correct: '20%', explanation: '1/5 = 20/100, dus 20%.' },
    { id: 'bp-05', prompt: [{ frac: [2, 5] }, ' = … %'], text: '2/5 = …%', answers: ['40%', '20%', '60%'], correct: '40%', explanation: '2/5 = 2 × 20% = 40%.' },
    { id: 'bp-06', prompt: [{ frac: [1, 8] }, ' = … %'], text: '1/8 = …%', answers: ['12,5%', '25%', '20%'], correct: '12,5%', explanation: '1/8 is de helft van 1/4: de helft van 25% = 12,5%.' },
    { id: 'bp-07', prompt: [{ frac: [3, 8] }, ' = … %'], text: '3/8 = …%', answers: ['25%', '37,5%', '75%'], correct: '37,5%', explanation: '3/8 = 3 × 12,5% = 37,5%.' },
    { id: 'bp-08', prompt: [{ frac: [3, 5] }, ' = … %'], text: '3/5 = …%', answers: ['40%', '60%', '80%'], correct: '60%', explanation: '3/5 = 3 × 20% = 60%.' },
  ],
};
