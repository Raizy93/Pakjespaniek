// Audio via de Web Audio API.
//
// Bestanden uit de map /audio (zie src/config/audioConfig.js) worden gebruikt
// waar ze beschikbaar zijn; anders valt de game terug op ingebouwde,
// gesynthetiseerde geluiden.
//
// Bussen:  master ← music ← { muziekbestanden, synthMusic }
//                 ← sfx   ← { effectbestanden, synthSfx }
// Instellingen schakelen de bussen; tijdens een opdracht zakt de muziek (ducking).
import { Storage } from './storage.js';
import { SFX, MUSIC, MUSIC_DUCK, MUSIC_FADE } from '../config/audioConfig.js';

// Alle audiobestanden in /audio; Vite zet ze mee in de build (met eigen URL).
const FILE_URLS = Object.fromEntries(
  Object.entries(import.meta.glob('../../audio/*.{mp3,ogg,wav,m4a}', { eager: true, query: '?url', import: 'default' }))
    .map(([path, url]) => [path.split('/').pop().replace(/\.[^.]+$/, ''), url]),
);

const SYNTH_MUSIC_LEVEL = 0.16;
const SYNTH_SFX_LEVEL = 0.55;

// Origineel deuntje (C-groot, speelse speeldoos), 16 maten van 8 achtsten.
// Wordt alleen gebruikt als er geen muziekbestand is.
const _ = null;
const MELODY = [
  [76, 79, 84, 79, 76, _, 74, 72], [69, 72, 76, 81, 79, _, 76, _],
  [77, 81, 84, 81, 79, 77, 76, 74], [74, _, 79, _, 71, _, 74, _],
  [76, 79, 84, 88, 86, 84, 83, 79], [81, _, 76, _, 72, 76, 81, _],
  [77, 76, 74, 77, 81, 79, 77, 74], [79, _, _, _, 71, 74, 79, _],
  [81, _, 84, _, 81, 79, 77, _], [79, _, 83, _, 86, _, 83, _],
  [79, 76, 71, 76, 79, _, 83, _], [84, 83, 81, 76, 72, _, 76, _],
  [77, 81, 84, _, 89, _, 84, 81], [79, 83, 86, _, 83, _, 79, _],
  [88, _, 84, _, 79, _, 76, _], [72, _, _, _, _, _, _, _],
];
const BASS = [48, 45, 41, 43, 48, 45, 38, 43, 41, 43, 40, 45, 41, 43, 48, 48];
const BPM = 100;

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

class AudioManagerClass {
  constructor() {
    this.ctx = null;
    this.musicOn = Storage.settings.music;
    this.sfxOn = Storage.settings.sfx;
    this.ducked = false;
    this.raw = new Map(); // bestandsnaam → Promise<ArrayBuffer|null>
    this.buffers = new Map(); // bestandsnaam → AudioBuffer
    this.monoVoices = new Map(); // sfx-naam → lopende bron
    this.wantedTrack = null; // 'menu' | 'game' | 'results'
    this.current = null; // { track, src, gain } of { track, synth: true }
  }

  /** Begint direct met downloaden (zonder AudioContext); decoderen gebeurt na de eerste klik. */
  preload() {
    const files = new Set([...Object.values(SFX), ...Object.values(MUSIC)].map((e) => e.file));
    for (const name of files) {
      const url = FILE_URLS[name];
      if (!url || this.raw.has(name)) continue;
      this.raw.set(name, fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
    }
  }

  hasFile(name) {
    return Boolean(FILE_URLS[name]);
  }

  /** Moet vanuit een gebruikersactie worden aangeroepen (browserbeleid). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -8;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicTarget();
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxOn ? 1 : 0;
      this.sfxBus.connect(this.master);
      this.synthMusic = this.ctx.createGain();
      this.synthMusic.gain.value = SYNTH_MUSIC_LEVEL;
      this.synthMusic.connect(this.musicBus);
      this.synthSfx = this.ctx.createGain();
      this.synthSfx.gain.value = SYNTH_SFX_LEVEL;
      this.synthSfx.connect(this.sfxBus);
      this.noise = this.makeNoise();
      this.decodeAll();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.wantedTrack && !this.current) this.playMusic(this.wantedTrack);
  }

  decodeAll() {
    this.preload();
    for (const [name, promise] of this.raw) {
      promise
        .then((ab) => (ab ? this.ctx.decodeAudioData(ab) : null))
        .then((buf) => {
          if (!buf) return;
          this.buffers.set(name, buf);
          // muziek die al gevraagd werd en op dit bestand wachtte, nu starten
          const wanted = this.wantedTrack && MUSIC[this.wantedTrack];
          if (wanted?.file === name && !this.current) this.playMusic(this.wantedTrack);
        })
        .catch(() => {});
    }
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 1;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  setMusic(on) {
    this.musicOn = on;
    Storage.setSetting('music', on);
    this.applyMusicGain();
  }

  setSfx(on) {
    this.sfxOn = on;
    Storage.setSetting('sfx', on);
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.05);
  }

  musicTarget() {
    return this.musicOn ? (this.ducked ? MUSIC_DUCK : 1) : 0;
  }

  applyMusicGain() {
    if (!this.musicBus) return;
    this.musicBus.gain.setTargetAtTime(this.musicTarget(), this.ctx.currentTime, 0.25);
  }

  duck(on) {
    this.ducked = on;
    this.applyMusicGain();
  }

  // ------------------------------------------------------------ muziek
  /** Speelt de muziek voor een scherm ('menu' | 'game' | 'results') met een zachte overgang. */
  playMusic(track) {
    this.wantedTrack = track;
    if (!this.ctx) return; // start na de eerste klik/toets (unlock)
    if (this.current?.track === track) return;
    const entry = MUSIC[track];
    const buf = entry && this.buffers.get(entry.file);
    const waiting = Boolean(entry && this.hasFile(entry.file) && !buf);
    this.fadeOutCurrent();
    if (buf) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(entry.gain, t + MUSIC_FADE);
      src.connect(gain).connect(this.musicBus);
      src.start(t);
      this.current = { track, src, gain };
    } else if (!waiting) {
      // geen bestand voor dit scherm: ingebouwd deuntje
      this.startSynthMusic();
      this.current = { track, synth: true };
    }
    // waiting: bestand wordt nog gedecodeerd; decodeAll start het zodra het klaar is
  }

  fadeOutCurrent() {
    const cur = this.current;
    if (!cur) return;
    if (cur.synth) this.stopSynthMusic();
    else {
      const t = this.ctx.currentTime;
      cur.gain.gain.cancelScheduledValues(t);
      cur.gain.gain.setValueAtTime(Math.max(0.0001, cur.gain.gain.value), t);
      cur.gain.gain.exponentialRampToValueAtTime(0.0001, t + MUSIC_FADE);
      cur.src.stop(t + MUSIC_FADE + 0.05);
    }
    this.current = null;
  }

  stopMusic() {
    this.wantedTrack = null;
    if (this.ctx) this.fadeOutCurrent();
  }

  startSynthMusic() {
    if (this.timer) return;
    const eighth = 60 / BPM / 2;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => {
      if (!this.ctx) return;
      // bij een achtergrondtabblad niet "inhalen"
      if (this.nextTime < this.ctx.currentTime - 0.5) this.nextTime = this.ctx.currentTime + 0.05;
      while (this.nextTime < this.ctx.currentTime + 0.2) {
        this.scheduleStep(this.step, this.nextTime, eighth);
        this.nextTime += eighth;
        this.step = (this.step + 1) % (MELODY.length * 8);
      }
    }, 40);
  }

  stopSynthMusic() {
    clearInterval(this.timer);
    this.timer = null;
  }

  // ------------------------------------------------------------ effecten
  /** Speelt een spelmoment: eerst het audiobestand, anders het ingebouwde geluid. */
  play(name) {
    if (!this.ctx || !this.sfxOn) return;
    const entry = SFX[name];
    if (entry && this.hasFile(entry.file)) {
      const buf = this.buffers.get(entry.file);
      if (buf) this.playBuffer(name, buf, entry);
      return; // bestand bestaat maar is nog niet klaar: even stil, geen dubbel geluid
    }
    this.playSynth(name);
  }

  playBuffer(name, buf, { gain = 1, vary = 0, mono = false }) {
    if (mono) {
      const prev = this.monoVoices.get(name);
      if (prev) {
        try {
          prev.stop();
        } catch {
          /* al gestopt */
        }
      }
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    if (vary) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * vary;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.sfxBus);
    src.start();
    if (mono) {
      this.monoVoices.set(name, src);
      src.onended = () => {
        if (this.monoVoices.get(name) === src) this.monoVoices.delete(name);
      };
    }
  }

  scheduleStep(step, t, eighth) {
    const bar = Math.floor(step / 8);
    const pos = step % 8;
    const note = MELODY[bar][pos];
    if (note) this.musicBox(midiToHz(note), t, eighth * 2.2);
    if (pos === 0 || pos === 4) this.bassNote(midiToHz(BASS[bar] - (pos === 4 ? 0 : 0)), t, eighth * 3.5);
    if (pos % 2 === 1) this.bell(t, 0.025);
  }

  musicBox(freq, t, dur) {
    const c = this.ctx;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    o2.type = 'sine';
    o2.frequency.value = freq * 2;
    const g2 = c.createGain();
    g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(this.synthMusic);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }

  bassNote(freq, t, dur) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.38, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.synthMusic);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  bell(t, vol) {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    src.connect(f).connect(g).connect(this.synthMusic);
    src.start(t, Math.random() * 0.5, 0.1);
  }

  // ------------------------------------------------------------ effecten
  tone(freq, dur, { type = 'sine', vol = 0.4, slide = 0, delay = 0, attack = 0.005 } = {}) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.synthSfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noiseBurst(dur, { vol = 0.3, from = 800, to = 200, type = 'lowpass', delay = 0 } = {}) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.synthSfx);
    src.start(t, Math.random() * 0.4, dur + 0.05);
  }

  playSynth(name) {
    if (!this.ctx || !this.sfxOn) return;
    const v = 1 + (Math.random() - 0.5) * 0.08; // kleine variatie
    switch (name) {
      case 'jump':
        this.tone(330 * v, 0.16, { type: 'square', vol: 0.09, slide: 260 });
        break;
      case 'land':
        this.noiseBurst(0.09, { vol: 0.22, from: 600, to: 120 });
        break;
      case 'pepernoot':
        this.tone(1318 * v, 0.12, { type: 'triangle', vol: 0.22 });
        this.tone(1760 * v, 0.18, { type: 'triangle', vol: 0.2, delay: 0.06 });
        break;
      case 'deliver':
        this.noiseBurst(0.35, { vol: 0.25, from: 2500, to: 300, type: 'bandpass' });
        this.tone(220, 0.18, { type: 'sine', vol: 0.3, slide: -120, delay: 0.3 });
        break;
      case 'correct':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, { type: 'triangle', vol: 0.22, delay: i * 0.08 }));
        break;
      case 'wrong':
        this.tone(330, 0.16, { type: 'sine', vol: 0.28, slide: -40 });
        this.tone(247, 0.26, { type: 'sine', vol: 0.28, slide: -30, delay: 0.14 });
        break;
      case 'select':
        this.tone(880, 0.06, { type: 'triangle', vol: 0.15 });
        break;
      case 'click':
        this.tone(660, 0.07, { type: 'triangle', vol: 0.18 });
        break;
      case 'open':
        this.tone(523, 0.12, { type: 'triangle', vol: 0.18 });
        this.tone(784, 0.16, { type: 'triangle', vol: 0.18, delay: 0.07 });
        break;
      case 'checkpoint':
        this.tone(587, 0.12, { type: 'triangle', vol: 0.18 });
        this.tone(880, 0.2, { type: 'triangle', vol: 0.18, delay: 0.09 });
        break;
      case 'blocked':
        this.tone(196, 0.14, { type: 'triangle', vol: 0.18 });
        break;
      case 'respawn':
        this.tone(392, 0.25, { type: 'sine', vol: 0.2, slide: 300 });
        break;
      case 'gate':
        this.noiseBurst(0.25, { vol: 0.12, from: 3000, to: 6000, type: 'highpass' });
        this.tone(1047, 0.25, { type: 'triangle', vol: 0.14, delay: 0.05 });
        break;
      case 'finish':
        [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, i === 5 ? 0.6 : 0.2, { type: 'triangle', vol: 0.24, delay: i * 0.12 }));
        break;
      case 'star':
        this.tone(1047 * v, 0.3, { type: 'triangle', vol: 0.22 });
        this.tone(1568 * v, 0.35, { type: 'sine', vol: 0.12, delay: 0.05 });
        break;
      default:
        break;
    }
  }
}

export const AudioManager = new AudioManagerClass();
