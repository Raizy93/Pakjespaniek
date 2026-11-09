# Pakjespaniek! – De Grote Dakenrace

Educatieve Sinterklaas-platformgame voor groep 7–8, gemaakt voor
[MeesterDanny.com](https://www.meesterdanny.com).

De leerling kiest of die als **Piet** of als **Sinterklaas** over de daken van het
Sinterklaasdorp rent. Bij elke schoorsteen wordt een cadeautje bezorgd door de juiste
rekenopdracht op te lossen. Beide personages lopen en springen precies hetzelfde.

**Leerdoel (versie 1):** Ik kan veelvoorkomende breuken omzetten naar procenten.

Naast "breuk → procent" zijn er omgekeerde vragen ("37,5% = …/…", antwoorden als breuk),
met foute antwoorden uit denkfouten zoals 25% → 2/5 of 25% → 1/25.

De vragenpool bevat alle basale breuken met noemer 2, 3, 4, 5, 8 en 10 en hun veelvouden
(32 breuken, van 1/2 tot en met 10/10; ook het geheel, zoals 3/3 = 100%). Derden staan als kommagetal op één decimaal: 1/3 = 33,3%
en 2/3 = 66,7%. Elke speelronde kiest daar willekeurig 8 uit:
nooit twee met hetzelfde antwoord (dus niet 1/2 én 4/8) en hooguit 2 met dezelfde noemer.
Ongeveer de helft van de rondes bevat één "het geheel"-vraag (zoals 8/8 = 100%).
De foute antwoorden worden per ronde gekozen uit typische denkfouten (zoals 3/4 → 25%,
1/4 → 4% of 1/5 → 25%), en de plek van het goede antwoord is steeds anders.

## Levels

| Level | Naam | Nieuw in het spel | Rekenen (leerlijn) |
|---|---|---|---|
| 1 | Het Sinterklaasdorp | Lopen, springen, rijdende plankjes, glad ijs | Halven, kwarten en tienden |
| 2 | Hoge Daken | Klimmen, grote sprongen omlaag, liften; camera volgt ook omhoog | Erbij: vijfden en het geheel (3/3 = 100%) |
| 3 | De Winterstorm | Windvlagen (windzak en windstrepen kondigen ze aan), sneeuwstorm | Erbij: achtsten en derden |
| 4 | De Laatste Bezorging | Brokkelpannen die wegzakken, alles gecombineerd, huis van de Sint | Alles door elkaar + omgekeerd: "75% = …/…" (5 gewone + 3 omgekeerde vragen) |

De leerlijn staat per level in `learning` in het levelbestand (welke noemers, hoeveel per
noemer, en de verdeling gewone/omgekeerde vragen). De levelkaart toont wat er geoefend wordt.

Na **Spelen** kiest de leerling een personage en daarna een level op de **levelkaart**.
Een level gaat open zodra het vorige is uitgespeeld (met elk aantal sterren). De kaart toont
per level de beste sterren en het totaal. De voortgang wordt in de browser bewaard.

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

- `?play` – direct level 1 starten (`?play&level=w1-l2` voor level 2, `&char=sint` als Sinterklaas)
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

JouwWeb kan zelf geen losse webapp-bestanden hosten. De game staat daarom op **GitHub Pages**
en wordt in JouwWeb met een iframe ingesloten.

**Publiceren gaat automatisch:** bij elke push naar `main` bouwt GitHub de game
(`.github/workflows/deploy.yml`), draait eerst `npm run check`, en zet het resultaat op
<https://raizy93.github.io/Pakjespaniek/>. De voortgang zie je op GitHub onder **Actions**.

Eenmalig instellen: GitHub → repository → **Settings** → **Pages** → bij *Source* kiezen voor
**GitHub Actions**.

Voeg in JouwWeb een blok **HTML / Embed-code** toe met:

```html
<div style="position:relative;width:100%;max-width:1280px;aspect-ratio:16/9;margin:0 auto;">
  <iframe src="https://raizy93.github.io/Pakjespaniek/"
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
  levels/index.js          volgorde van alle levels
  levels/level1.js …       leveldata (puur data)
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
2. Pas `id`, `title`, `goal`, `instruction` en de vragen aan. Geef per vraag een
   `correct` antwoord en óf een vaste lijst `answers` (precies 3), óf een lijst
   `distractors` (minstens 2 foute antwoorden, sterkste eerst; per ronde worden er 2
   gekozen). Antwoorden zijn gewone tekst, dus woorden kunnen ook. Een prompt is een lijst
   met tekst en optioneel breuken: `['Hij ', '…', ' morgen jarig.']`. Met `maxPerGroup` en
   per vraag een `group` bepaal je hoeveel vragen van één soort in een ronde mogen.
3. Registreer het bestand in `src/education/registry.js`.
4. Draai `npm run check`: elke vraag moet geldige, unieke antwoorden hebben met precies
   één juist antwoord.

### Geluid en muziek

De audiobestanden staan in de map `audio/`. In `src/config/audioConfig.js` staat welk bestand
bij welk spelmoment hoort, plus het volume per bestand. Een bestand vervangen kan door een
nieuw bestand met dezelfde naam in `audio/` te zetten. Ontbreekt een bestand, dan speelt de
game automatisch het ingebouwde (zelf gesynthetiseerde) geluid.

| Bestand | Moment |
|---|---|
| `menu_music` / `gameplay_music` / `results_music` | muziek in menu / level / resultaten (zachter tijdens een opdracht) |
| `menu_click` | knop indrukken, personage kiezen |
| `player_jump` / `player_land` | springen / landen |
| `player_fall` / `player_spawn` | in een gat vallen / (opnieuw) verschijnen |
| `pepernoot_collect` | pepernoot oppakken |
| `checkpoint` | checkpoint bereikt |
| `chimney_open` | opdracht bij de schoorsteen gaat open |
| `gift_select` | ander cadeau aanwijzen |
| `answer_wrong` / `answer_good` | fout / goed antwoord |
| `gift_throw` / `gift_delivered` | cadeau gooien / cadeau valt in de schoorsteen |
| `level_completed` | finish bereikt |
| `star_earned` | ster verschijnt op het resultatenscherm |

### Een nieuw personage toevoegen

Alle personages delen één skelet met poses en hitbox (`src/assets/characterRig.js`).
Maak een tekenfunctie zoals `src/assets/sint.js`, registreer die in
`src/characters/registry.js` en zet de id in `CHARACTER_ORDER`. Het keuzescherm,
de animaties (`<id>-run` enz.) en de grote portretten worden automatisch gemaakt.

### Een nieuw level toevoegen

1. Maak een nieuw bestand naast `level2.js` met dezelfde opbouw (`id`, `name`, `number`,
   `tagline`, `width`, `height`, daken, platforms, schoorstenen, …). Een level mag hoger zijn
   dan 720 px; de camera volgt dan ook verticaal.
2. Voeg het toe aan `LEVELS` in `src/levels/index.js`. Het verschijnt dan vanzelf op de levelkaart.
3. Draai `npm run check`: die controleert of gaten en hoogtes haalbaar zijn en of er boven
   elke schoorsteen genoeg ruimte is voor de opdracht.
4. Laat de testbot het level uitspelen: `npm run dev` en open `?play&level=<id>&bot`.

## Verantwoording

- Graphics: zelf gemaakt in code (low-poly Canvas-tekeningen), geen externe afbeeldingen.
- Geluid en muziek: aangeleverde bestanden in `audio/`; terugval op zelf gesynthetiseerde
  geluiden (Web Audio API, eigen compositie).
- Lettertype: Fredoka (SIL Open Font License), lokaal meegeleverd via `@fontsource/fredoka`.
- Engine: [Phaser 3](https://phaser.io) (MIT-licentie).
