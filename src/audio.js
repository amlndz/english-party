// Pronunciación: voz neuronal (Kokoro, generada y cacheada en el servidor) con la voz del navegador de reserva
import { cleanSpeech } from './sentences.js';

export const VOICES = [
  { id: 'bf_emma', n: 'Emma 🇬🇧' }, { id: 'bm_george', n: 'George 🇬🇧' },
  { id: 'af_heart', n: 'Heart 🇺🇸' }, { id: 'am_michael', n: 'Michael 🇺🇸' },
];
let voiceId = (() => { try { return localStorage.getItem('ep-voice') || 'bf_emma'; } catch { return 'bf_emma'; } })();
export const getVoice = () => voiceId;
export function setVoice(id) { voiceId = id; try { localStorage.setItem('ep-voice', id); } catch { /* sin storage */ } }

const cache = new Map();
function fetchAudio(text) {
  const t = cleanSpeech(text);
  if (!t) return Promise.resolve(null);
  const key = voiceId + '|' + t;
  if (!cache.has(key)) {
    const p = fetch(`/api/tts?v=${voiceId}&t=${encodeURIComponent(t)}`)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? URL.createObjectURL(b) : null))
      .catch(() => null);
    cache.set(key, p);
    p.then((u) => { if (!u) cache.delete(key); });
  }
  return cache.get(key);
}
export const prefetch = (text) => { fetchAudio(text); };

let browserVoice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  browserVoice = vs.find((v) => /en-GB/i.test(v.lang) && /Google|Daniel|Serena|Kate|Arthur|Martha/i.test(v.name))
    || vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function browserSpeak(text, rate) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(cleanSpeech(text));
  u.lang = browserVoice?.lang || 'en-GB';
  if (browserVoice) u.voice = browserVoice;
  u.rate = rate;
  speechSynthesis.speak(u);
}

let current = null; let token = 0;
export async function speak(text, rate = 0.92) {
  const my = ++token;
  current?.pause();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const url = await Promise.race([fetchAudio(text), new Promise((r) => setTimeout(() => r('slow'), 5000))]);
  if (my !== token) return;
  if (url && url !== 'slow') {
    current = new Audio(url);
    current.play().catch(() => browserSpeak(text, rate));
    return;
  }
  browserSpeak(text, rate);
}
export function stopSpeaking() { token++; current?.pause(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }

let ctx = null;
const NOTES = {
  ok: [[660, 0], [880, 0.09], [1320, 0.18]],
  bad: [[300, 0], [220, 0.12]],
  click: [[900, 0]],
  pop: [[500, 0], [1000, 0.05]],
  win: [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.3], [1318, 0.42]],
  tick: [[1200, 0]],
  whoosh: [[200, 0], [400, 0.05], [800, 0.1]],
};
export function sfx(kind) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    for (const [f, d] of NOTES[kind] || []) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + d);
      g.gain.exponentialRampToValueAtTime(kind === 'tick' ? 0.05 : 0.14, now + d + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + d + (kind === 'win' ? 0.35 : 0.18));
      o.connect(g).connect(ctx.destination);
      o.start(now + d); o.stop(now + d + 0.4);
    }
  } catch { /* sin audio */ }
}
