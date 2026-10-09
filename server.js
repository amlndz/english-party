// English Party — servidor multijugador (WebSocket) + estáticos de /dist
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { ZONES as ZONE_LIST } from './src/content.js';
import { createGame } from './src/game.js';
import { fullSentence, cleanSpeech } from './src/sentences.js';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT) || 3001;
const DIST = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };

// ---------- voz neuronal (Kokoro) ----------
const VOICES = ['bf_emma', 'bm_george', 'af_heart', 'am_michael'];
// TTS=off desactiva la voz neuronal (p. ej. en hostings con poca RAM): el cliente usa la voz del navegador
const TTS_ON = !/^(off|0|false|no)$/i.test(process.env.TTS || '');
const TTS_DIR = path.resolve('.tts-cache');
fs.mkdirSync(TTS_DIR, { recursive: true });
let ttsModel = null;
const getTTS = () => (ttsModel ||= import('kokoro-js').then(({ KokoroTTS }) =>
  KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' })));
const ttsMem = new Map(); // key -> Promise<Buffer>
const pending = new Map(); // key -> job aún en cola
const queues = { high: [], low: [] };
let working = false;
async function pump() {
  if (working) return;
  working = true;
  while (queues.high.length || queues.low.length) {
    const job = queues.high.shift() || queues.low.shift();
    if (job.done) continue;
    job.done = true; pending.delete(job.key);
    try {
      const tts = await getTTS();
      const audio = await tts.generate(job.text, { voice: job.voice, speed: 0.92 });
      const buf = Buffer.from(audio.toWav());
      fs.writeFileSync(job.file, buf);
      job.resolve(buf);
    } catch (e) { job.reject(e); }
  }
  working = false;
}
function synth(text, voice, prio = 'high') {
  const key = crypto.createHash('sha1').update(voice + '|' + text).digest('hex');
  const queued = pending.get(key);
  if (queued && prio === 'high' && queued.prio === 'low') { queued.prio = 'high'; queues.high.push(queued); } // se adelanta
  if (ttsMem.has(key)) return ttsMem.get(key);
  const file = path.join(TTS_DIR, key + '.wav');
  let job;
  if (fs.existsSync(file)) job = Promise.resolve(fs.readFileSync(file));
  else {
    job = new Promise((resolve, reject) => {
      const j = { key, text, voice, file, prio, resolve, reject, done: false };
      pending.set(key, j); queues[prio].push(j); pump();
    });
  }
  ttsMem.set(key, job);
  job.catch(() => ttsMem.delete(key));
  return job;
}
// pre-genera todas las frases del contenido en segundo plano
function warmup() {
  const texts = new Set();
  for (const z of ZONE_LIST) {
    for (const t of z.theory) for (const e of t.ex) texts.add(cleanSpeech(e));
    for (const q of z.questions) texts.add(cleanSpeech(fullSentence(q)));
  }
  const t0 = Date.now();
  Promise.all([...texts].map((t) => synth(t, VOICES[0], 'low').catch(() => null)))
    .then(() => console.log(`🔊 ${texts.size} frases listas con voz neuronal (${Math.round((Date.now() - t0) / 1000)}s)`));
}
if (TTS_ON) getTTS().then(() => { console.log('🔊 Modelo de voz cargado'); warmup(); }).catch((e) => console.warn('⚠️ Voz neuronal no disponible:', e.message));
else console.log('🔇 Voz neuronal desactivada (TTS=off): se usará la voz del navegador');

// ---------- HTTP: voz + estáticos de /dist (modo producción: npm run build && npm start) ----------
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/tts/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ enabled: TTS_ON }));
  }
  if (req.url.startsWith('/api/tts')) {
    if (!TTS_ON) { res.writeHead(503); return res.end('TTS desactivado'); }
    const u = new URL(req.url, 'http://x');
    const text = cleanSpeech(u.searchParams.get('t') || '');
    const voice = VOICES.includes(u.searchParams.get('v')) ? u.searchParams.get('v') : VOICES[0];
    if (!text) { res.writeHead(400); return res.end(); }
    try {
      const buf = await synth(text, voice);
      res.writeHead(200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'public, max-age=31536000' });
      return res.end(buf);
    } catch (e) { res.writeHead(503); return res.end(String(e.message)); }
  }
  let p = path.join(DIST, decodeURIComponent((req.url || '/').split('?')[0]));
  if (!p.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end('Usa "npm run dev" o ejecuta "npm run build" antes de "npm start".'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

// ---------- multijugador: puente WebSocket ↔ lógica de juego (src/game.js) ----------
const game = createGame();
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  const id = game.connect((msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); });
  ws.on('message', (raw) => { let m; try { m = JSON.parse(raw); } catch { return; } game.message(id, m); });
  ws.on('close', () => game.disconnect(id));
});

server.listen(PORT, () => console.log(`🎉 English Party server en http://localhost:${PORT}  (ws: /ws)`));
