// English Party — servidor multijugador (WebSocket) + estáticos de /dist
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { ZONES as ZONE_LIST, ZONE_BY_ID, zoneAt as zoneOf } from './src/content.js';
import { planRoute } from './src/city.js';
import { fullSentence, cleanSpeech } from './src/sentences.js';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT) || 3001;
const DIST = path.resolve('dist');
const ZONES = Object.fromEntries(ZONE_LIST.map((z) => [z.id, z.pos]));
const ZONE_R = 13;
const QUESTIONS_PER_MATCH = 9;
const EMOTES = ['👋', '🎉', '😂', '❤️', '🔥', '🤔'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };

// ---------- estáticos (modo producción: npm run build && npm start) ----------
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

const wss = new WebSocketServer({ server, path: '/ws' });

let nextId = 1;
const players = new Map();
const live = Object.fromEntries(Object.keys(ZONES).map((z) => [z, new Map()]));
const boards = {};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const COLORS = ['#ff4fb4', '#ff7a2f', '#ffd23f', '#7ee36b', '#2fd4a7', '#3fb6ff', '#6b6bff', '#b06bff', '#ff5a5a'];
const SEED = ['Kiki', 'Leo99', 'Ana_B', 'Tomás', 'Zoe', 'NachoBean', 'Marta', 'JellyJoe', 'Iris', 'Pablo_EN'];
for (const z of Object.keys(ZONES)) {
  boards[z] = SEED.map((name) => ({ name, color: pick(COLORS), score: Math.round(rand(380, 1250) / 5) * 5 }))
    .sort((a, b) => b.score - a.score).slice(0, 8);
}

const clean = (s) => String(s || 'Bean').replace(/[<>&"]/g, '').trim().slice(0, 14) || 'Bean';
const cleanColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#ff4fb4');
const num = (v, lim = 70) => Math.max(-lim, Math.min(lim, Number(v) || 0));

const zoneAt = (x, z) => zoneOf(x, z)?.id || null;
function send(ws, msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function broadcast(msg) {
  const s = JSON.stringify(msg);
  for (const p of players.values()) if (p.ws && p.ws.readyState === 1) p.ws.send(s);
}
function pushScore(zone, entry) {
  const b = boards[zone];
  const ex = b.find((e) => e.name === entry.name);
  if (ex) { if (entry.score > ex.score) { ex.score = entry.score; ex.color = entry.color; } } else b.push(entry);
  b.sort((a, c) => c.score - a.score);
  boards[zone] = b.slice(0, 15);
  broadcast({ type: 'board', zone, board: boards[zone] });
}
const liveList = (zone) => [...live[zone].entries()].map(([id, e]) => ({ id, ...e }));
const sendLive = (zone) => broadcast({ type: 'live', zone, entries: liveList(zone) });

wss.on('connection', (ws) => {
  const id = 'p' + nextId++;
  let p = null;
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.type !== 'hello' && !p) return;
    const zone = ZONES[m.zone] ? m.zone : null;
    switch (m.type) {
      case 'hello':
        p = { id, ws, name: clean(m.name), color: cleanColor(m.color), acc: String(m.acc || 'none').slice(0, 12), skin: String(m.skin || 'none').slice(0, 12), x: 0, z: 10, ry: 0, m: 0, zone: null };
        players.set(id, p);
        send(ws, { type: 'welcome', id, boards });
        for (const z of Object.keys(ZONES)) send(ws, { type: 'live', zone: z, entries: liveList(z) });
        break;
      case 'st':
        p.x = num(m.x); p.z = num(m.z); p.ry = Number(m.ry) || 0; p.m = m.m ? 1 : 0; p.y = num(m.y, 5);
        p.zone = zoneAt(p.x, p.z);
        break;
      case 'cjoin':
        if (!zone) return;
        live[zone].set(id, { name: p.name, color: p.color, score: 0, progress: 0, done: false, bot: false });
        sendLive(zone);
        break;
      case 'cscore': {
        const e = zone && live[zone].get(id);
        if (!e) return;
        e.score = Math.max(0, Math.round(num(m.score, 99999)));
        e.progress = Math.min(QUESTIONS_PER_MATCH, Math.round(num(m.progress, 99)));
        sendLive(zone);
        break;
      }
      case 'cfinish': {
        if (!zone) return;
        const score = Math.max(0, Math.round(num(m.score, 99999)));
        const e = live[zone].get(id);
        if (e) { e.score = score; e.progress = QUESTIONS_PER_MATCH; e.done = true; }
        pushScore(zone, { name: p.name, color: p.color, score });
        const rank = boards[zone].findIndex((b) => b.name === p.name && b.score === score) + 1;
        send(ws, { type: 'ranked', zone, rank, score });
        sendLive(zone);
        setTimeout(() => { if (live[zone].get(id) === e) { live[zone].delete(id); sendLive(zone); } }, 10000);
        break;
      }
      case 'cleave':
        if (zone && live[zone].delete(id)) sendLive(zone);
        break;
      case 'look':
        p.color = cleanColor(m.color); p.acc = String(m.acc || 'none').slice(0, 12); p.skin = String(m.skin || 'none').slice(0, 12);
        break;
      case 'emote':
        if (EMOTES.includes(m.e)) broadcast({ type: 'emote', id, e: m.e });
        break;
    }
  });
  ws.on('close', () => {
    players.delete(id);
    for (const z of Object.keys(ZONES)) if (live[z].delete(id)) sendLive(z);
  });
});

// ---------- bots: para que la POC se sienta viva aunque estés solo ----------
const BOTS = [
  { name: 'Luna', color: '#ff5fa2', acc: 'crown' },
  { name: 'Max_UK', color: '#3fa9ff', acc: 'tophat' },
  { name: 'PixelPete', color: '#7cdc4a', acc: 'party' },
  { name: 'Sofi', color: '#ffb02e', acc: 'bunny' },
  { name: 'RoboRita', color: '#b06bff', acc: 'halo' },
  { name: 'NinjaNoa', color: '#24243a', acc: 'none', skin: 'ninja' },
  { name: 'CaptainJo', color: '#ff7a2f', acc: 'none', skin: 'pirate' },
  { name: 'Drako', color: '#4fd06a', acc: 'none', skin: 'dragon' },
];
function zoneSpot(zid) {
  const { pos: [cx, cz], face: [fx, fz] } = ZONE_BY_ID[zid];
  const fwd = rand(1, 8); const side = rand(-6, 6);
  return [cx + fx * fwd - fz * side, cz + fz * fwd + fx * side];
}
function botRoute(b) {
  const zid = pick(Object.keys(ZONES).filter((z) => z !== b.home));
  b.route = planRoute(b.x, b.z, ZONE_BY_ID[zid], zoneSpot(zid));
  b.home = zid;
}
for (const def of BOTS) {
  const id = 'b' + nextId++;
  const home = pick(Object.keys(ZONES));
  const [x, z] = zoneSpot(home);
  const b = { id, bot: true, skin: 'none', ...def, x, z, ry: 0, m: 0, zone: null, home, route: [], wait: rand(2, 10), comp: null };
  players.set(id, b);
}
function botCompete(b, dt) {
  const c = b.comp;
  c.t -= dt;
  if (c.t > 0) return;
  c.t = rand(2.5, 6);
  const e = live[c.zone].get(b.id);
  if (!e) { b.comp = null; return; }
  e.progress++;
  if (Math.random() < 0.72) e.score += 100 + Math.round(rand(0, 50));
  if (e.progress === 3 || e.progress === 6) e.score = Math.max(0, e.score + pick([200, 100, 50, -50, -100, 150, 0]));
  if (e.progress >= QUESTIONS_PER_MATCH) {
    e.done = true;
    pushScore(c.zone, { name: b.name, color: b.color, score: e.score });
    const zone = c.zone;
    setTimeout(() => { if (live[zone].get(b.id) === e) { live[zone].delete(b.id); sendLive(zone); } }, 8000);
    b.comp = null; b.wait = rand(3, 8);
  }
  sendLive(c.zone);
}
function updateBot(b, dt) {
  b.zone = zoneAt(b.x, b.z);
  if (b.comp) { b.m = 0; botCompete(b, dt); return; }
  if (b.wait > 0) {
    b.m = 0; b.wait -= dt;
    if (b.wait <= 0 && b.zone && Math.random() < 0.55) {
      b.comp = { zone: b.zone, t: rand(2, 4) };
      live[b.zone].set(b.id, { name: b.name, color: b.color, score: 0, progress: 0, done: false, bot: true });
      sendLive(b.zone);
    }
    return;
  }
  if (!b.route.length) botRoute(b);
  const [tx, tz] = b.route[0];
  const dx = tx - b.x; const dz = tz - b.z; const d = Math.hypot(dx, dz);
  if (d < 0.4) { b.route.shift(); if (!b.route.length) b.wait = rand(8, 22); return; }
  const sp = Math.min(d, 4.2 * dt);
  b.x += (dx / d) * sp; b.z += (dz / d) * sp; b.ry = Math.atan2(dx, dz); b.m = 1;
}

const r2 = (v) => Math.round(v * 100) / 100;
setInterval(() => {
  for (const p of players.values()) if (p.bot) updateBot(p, 0.1);
  const snap = [...players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, acc: p.acc, skin: p.skin || 'none', x: r2(p.x), z: r2(p.z), y: r2(p.y || 0), ry: r2(p.ry), m: p.m, zone: p.zone, bot: !!p.bot }));
  broadcast({ type: 'snap', players: snap });
}, 100);

server.listen(PORT, () => console.log(`🎉 English Party server en http://localhost:${PORT}  (ws: /ws)`));
