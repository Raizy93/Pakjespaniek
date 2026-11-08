# Pakjespaniek! – De Grote Dakenrace

Educatieve Sinterklaas-platformgame voor groep 7–8, gemaakt voor
[MeesterDanny.com](https://www.meesterdanny.com).

De leerling kiest of die als **Piet** of als **Sinterklaas** over de daken van het
Sinterklaasdorp rent. Bij elke schoorsteen wordt een cadeautje bezorgd door de juiste
rekenopdracht op te lossen. Beide personages lopen en springen precies hetzelfde.

**Leerdoel (versie 1):** Ik kan veelvoorkomende breuken omzetten naar procenten.

## Spelen

| Toets | Actie |
|---|---|
| A / D of ← → | Lopen |
| Spatie / ↑ / W | Springen (lang indrukken = hoger) |
| E | Opdracht openen bij een schoorsteen |
| 1, 2, 3 (of ← → + Enter, of klikken) | Antwoordcadeau kiezen |
| Esc | Pauzemenu |

Sterren hangen alleen af van het aantal opdrachten dat **direct goed** is:
8 → ★★★, 6–7 → ★★, 4–5 → ★, 0–3 → geen ster.

## Lokaal starten

Benodigd: [Node.js](https://nodejs.org) 20 of nieuwer.

```bash
npm install
npm run dev
```

Open daarna <http://localhost:5173>.

Handige ontwikkel-URL's (alleen in `npm run dev`):

- `?play` – direct het level starten (`?play&char=sint` als Sinterklaas)
- `?preview` – alle assets op ware grootte bekijken
- `?debug` – physics-botsingsvakken tonen
- `?play&bot` – een testbot speelt het hele level met echte toetsaanslagen (log in `window.botLog`).
  In de console stapt `await botSim(9000)` de game zelf vooruit, ook als het tabblad niet zichtbaar is.

Controle van vragen, sterrenberekening en de haalbaarheid van het level (zonder browser):

```bash
npm run check
```

## Productiebuild

```bash
npm run build
```

De map `dist/` bevat dan een complete statische website (relatieve paden, geen server
of database nodig). Testen kan met `npm run preview`.

## Op MeesterDanny.com (JouwWeb) zetten

JouwWeb kan zelf geen losse webapp-bestanden hosten. Zet daarom de inhoud van `dist/` op een
gratis statische host en sluit die in met een iframe:

1. Upload de inhoud van `dist/` naar bijvoorbeeld **GitHub Pages**, **Netlify** of **itch.io**
   (als HTML5-game). Je krijgt een adres zoals `https://jouwnaam.github.io/pakjespaniek/`.
2. Voeg in JouwWeb een blok **HTML / Embed-code** toe met:

```html
<div style="position:relative;width:100%;max-width:1280px;aspect-ratio:16/9;margin:0 auto;">
  <iframe src="https://JOUW-ADRES-HIER/"
          title="Pakjespaniek! – De Grote Dakenrace"
          style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px;"
          allow="autoplay; fullscreen"
          allowfullscreen></iframe>
</div>
```

De game schaalt automatisch mee (16:9). Leerlingen klikken eenmaal in de game. Daarna werkt
het toetsenbord en scrollt de pagina niet mee met de pijltjestoetsen.

## Projectstructuur

```
src/
  main.js                  Phaser-configuratie en opstarten
  config/gameConfig.js     alle afstelling (spronggevoel, camera, scores)
  scenes/                  Boot, Menu, Game, Hud, Pause, Results (+ AssetPreview)
  entities/Player.js       character controller (voor elk personage)
  characters/registry.js   speelbare personages (Piet, Sinterklaas)
  entities/Chimney.js      schoorsteen met 3 toestanden + poort
  levels/level1.js         leveldata (puur data)
  levels/LevelBuilder.js   bouwt de wereld uit leveldata
  levels/validateLevel.js  controleert of gaten en hoogtes haalbaar zijn
  education/banks/         vragenbanken (één bestand per leerdoel)
  education/registry.js    overzicht van leerdoelen
  education/QuestionBank.js  validatie + willekeurige speelronde
  education/ResultsTracker.js  leerresultaten, sterren, fouten
  ui/                      knoppen, teksten, quizpaneel
  assets/                  low-poly tekencode voor alle sprites
  systems/                 audio, opslag (instellingen + beste score), events
```

### Een nieuw leerdoel toevoegen

1. Kopieer `src/education/banks/breukenProcenten.js` naar een nieuw bestand, bijvoorbeeld
   `werkwoordspelling.js`.
2. Pas `id`, `title`, `goal`, `instruction` en de vragen aan. Antwoorden zijn gewone
   tekst, dus woorden kunnen ook (`['wordt', 'word', 'wort']`). Een prompt is een lijst
   met tekst en optioneel breuken: `['Hij ', '…', ' morgen jarig.']`.
3. Registreer het bestand in `src/education/registry.js`.
4. Draai `npm run check`: elke vraag moet precies 3 verschillende antwoorden hebben,
   waarvan precies één juist.

### Een nieuw personage toevoegen

Alle personages delen één skelet met poses en hitbox (`src/assets/characterRig.js`).
Maak een tekenfunctie zoals `src/assets/sint.js`, registreer die in
`src/characters/registry.js` en zet de id in `CHARACTER_ORDER`. Het keuzescherm,
de animaties (`<id>-run` enz.) en de grote portretten worden automatisch gemaakt.

### Een nieuw level toevoegen

Maak een nieuw bestand naast `level1.js` met dezelfde opbouw en voeg het toe aan `LEVELS`
in `src/scenes/GameScene.js`. `npm run check` kan het level dan valideren.

## Verantwoording

- Graphics: zelf gemaakt in code (low-poly Canvas-tekeningen), geen externe afbeeldingen.
- Geluid en muziek: zelf gesynthetiseerd met de Web Audio API (eigen compositie).
- Lettertype: Fredoka (SIL Open Font License), lokaal meegeleverd via `@fontsource/fredoka`.
- Engine: [Phaser 3](https://phaser.io) (MIT-licentie).
