// Lógica del juego compartida: jugadores, bots, competición en directo y ranking.
// La usa el servidor Node (multijugador real por WebSocket) y también el navegador
// en la versión estática (modo demo sin servidor: bots y ranking simulados en local).
import { ZONES as ZONE_LIST, ZONE_BY_ID, zoneAt as zoneOf } from './content.js';
import { planRoute } from './city.js';

const ZONE_IDS = ZONE_LIST.map((z) => z.id);
const QUESTIONS_PER_MATCH = 9;
const EMOTES = ['👋', '🎉', '😂', '❤️', '🔥', '🤔'];
const COLORS = ['#ff4fb4', '#ff7a2f', '#ffd23f', '#7ee36b', '#2fd4a7', '#3fb6ff', '#6b6bff', '#b06bff', '#ff5a5a'];
const SEED = ['Kiki', 'Leo99', 'Ana_B', 'Tomás', 'Zoe', 'NachoBean', 'Marta', 'JellyJoe', 'Iris', 'Pablo_EN'];
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

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clean = (s) => String(s || 'Bean').replace(/[<>&"]/g, '').trim().slice(0, 14) || 'Bean';
const cleanColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#ff4fb4');
const cleanId = (s) => String(s || 'none').slice(0, 12);
const num = (v, lim = 100) => Math.max(-lim, Math.min(lim, Number(v) || 0));
const r2 = (v) => Math.round(v * 100) / 100;
const zoneAt = (x, z) => zoneOf(x, z)?.id || null;

// boards: ranking inicial (opcional); onBoards: se llama cuando cambia (para guardarlo)
export function createGame({ boards: savedBoards = null, onBoards = null } = {}) {
  let nextId = 1;
  const clients = new Map(); // id -> función send(msg)
  const players = new Map();
  const live = Object.fromEntries(ZONE_IDS.map((z) => [z, new Map()]));
  const boards = {};
  for (const z of ZONE_IDS) {
    boards[z] = savedBoards?.[z] || SEED.map((name) => ({ name, color: pick(COLORS), score: Math.round(rand(380, 1250) / 5) * 5 }))
      .sort((a, b) => b.score - a.score).slice(0, 8);
  }

  const send = (id, msg) => clients.get(id)?.(msg);
  const broadcast = (msg) => { for (const f of clients.values()) f(msg); };
  function pushScore(zone, entry) {
    const b = boards[zone];
    const ex = b.find((e) => e.name === entry.name);
    if (ex) { if (entry.score > ex.score) { ex.score = entry.score; ex.color = entry.color; } } else b.push(entry);
    b.sort((a, c) => c.score - a.score);
    boards[zone] = b.slice(0, 15);
    broadcast({ type: 'board', zone, board: boards[zone] });
    onBoards?.(boards);
  }
  const liveList = (zone) => [...live[zone].entries()].map(([id, e]) => ({ id, ...e }));
  const sendLive = (zone) => broadcast({ type: 'live', zone, entries: liveList(zone) });

  function message(id, m) {
    const p = players.get(id);
    if (!m || (m.type !== 'hello' && !p)) return;
    const zone = ZONE_BY_ID[m.zone] ? m.zone : null;
    switch (m.type) {
      case 'hello':
        players.set(id, { id, name: clean(m.name), color: cleanColor(m.color), acc: cleanId(m.acc), skin: cleanId(m.skin), x: 0, z: 10, ry: 0, m: 0, zone: null });
        send(id, { type: 'welcome', id, boards });
        for (const z of ZONE_IDS) send(id, { type: 'live', zone: z, entries: liveList(z) });
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
        send(id, { type: 'ranked', zone, rank, score });
        sendLive(zone);
        setTimeout(() => { if (live[zone].get(id) === e) { live[zone].delete(id); sendLive(zone); } }, 10000);
        break;
      }
      case 'cleave':
        if (zone && live[zone].delete(id)) sendLive(zone);
        break;
      case 'look':
        p.color = cleanColor(m.color); p.acc = cleanId(m.acc); p.skin = cleanId(m.skin);
        break;
      case 'emote':
        if (EMOTES.includes(m.e)) broadcast({ type: 'emote', id, e: m.e });
        break;
    }
  }

  // ---------- bots: para que el mundo se sienta vivo aunque estés solo ----------
  function zoneSpot(zid) {
    const { pos: [cx, cz], face: [fx, fz] } = ZONE_BY_ID[zid];
    const fwd = rand(1, 8); const side = rand(-6, 6);
    return [cx + fx * fwd - fz * side, cz + fz * fwd + fx * side];
  }
  function botRoute(b) {
    const zid = pick(ZONE_IDS.filter((z) => z !== b.home));
    b.route = planRoute(b.x, b.z, ZONE_BY_ID[zid], zoneSpot(zid));
    b.home = zid;
  }
  for (const def of BOTS) {
    const id = 'b' + nextId++;
    const home = pick(ZONE_IDS);
    const [x, z] = zoneSpot(home);
    players.set(id, { id, bot: true, skin: 'none', ...def, x, z, ry: 0, m: 0, zone: null, home, route: [], wait: rand(2, 10), comp: null });
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

  setInterval(() => {
    for (const p of players.values()) if (p.bot) updateBot(p, 0.1);
    const snap = [...players.values()].map((p) => ({ id: p.id, name: p.name, color: p.color, acc: p.acc, skin: p.skin || 'none', x: r2(p.x), z: r2(p.z), y: r2(p.y || 0), ry: r2(p.ry), m: p.m, zone: p.zone, bot: !!p.bot }));
    broadcast({ type: 'snap', players: snap });
  }, 100);

  return {
    connect(sendFn) { const id = 'p' + nextId++; clients.set(id, sendFn); return id; },
    message,
    disconnect(id) {
      clients.delete(id); players.delete(id);
      for (const z of ZONE_IDS) if (live[z].delete(id)) sendLive(z);
    },
  };
}
