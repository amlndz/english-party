// Minimapa + mapa grande ampliable con todas las lecciones
import { ZONES, ZONE_BY_ID, zoneAt as zoneOf } from './content.js';
import { HX, HZ, ROADS_X, ROADS_Z, ROAD_HALF, CAMPUS } from './city.js';
import { store } from './store.js';
import { sfx } from './audio.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function mapScale(W, H) { return Math.min(W / (2 * HX * 1.04), H / (2 * HZ * 1.04)); }

export function drawMap(ctx, W, H, me, { labels = false, hover = null } = {}) {
  const s = mapScale(W, H);
  const X = (x) => W / 2 + x * s; const Y = (z) => H / 2 + z * s;
  ctx.clearRect(0, 0, W, H);
  // isla + asfalto
  ctx.fillStyle = '#8fe38a'; rr(ctx, X(-HX), Y(-HZ), 2 * HX * s, 2 * HZ * s, 10 * s); ctx.fill();
  ctx.lineWidth = Math.max(2, s * 1.2); ctx.strokeStyle = '#ff5fae'; ctx.stroke();
  const ax = ROADS_X[4] + ROAD_HALF; const az = ROADS_Z[3] + ROAD_HALF;
  ctx.fillStyle = '#6d6a8c'; rr(ctx, X(-ax), Y(-az), 2 * ax * s, 2 * az * s, 6 * s); ctx.fill();
  // líneas de carril
  if (labels) {
    ctx.strokeStyle = 'rgba(255,210,63,.7)'; ctx.lineWidth = Math.max(1, s * 0.3); ctx.setLineDash([s * 2, s * 2]);
    for (const z of ROADS_Z) { ctx.beginPath(); ctx.moveTo(X(ROADS_X[0]), Y(z)); ctx.lineTo(X(ROADS_X[4]), Y(z)); ctx.stroke(); }
    for (const x of ROADS_X) { ctx.beginPath(); ctx.moveTo(X(x), Y(ROADS_Z[0])); ctx.lineTo(X(x), Y(x === 0 ? -19 : ROADS_Z[3])); if (x === 0) { ctx.moveTo(X(0), Y(19)); ctx.lineTo(X(0), Y(ROADS_Z[3])); } ctx.stroke(); }
    ctx.setLineDash([]);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // colegio
  ctx.fillStyle = '#efe9ff'; rr(ctx, X(-CAMPUS.hx), Y(-CAMPUS.hz), 2 * CAMPUS.hx * s, 2 * CAMPUS.hz * s, 2 * s); ctx.fill();
  ctx.fillStyle = '#bfeaa6'; rr(ctx, X(-CAMPUS.hx + 1.5), Y(-CAMPUS.hz + 1.5), (2 * CAMPUS.hx - 3) * s, (2 * CAMPUS.hz - 3) * s, 2 * s); ctx.fill();
  ctx.fillStyle = '#ff9f8f'; rr(ctx, X(-22), Y(-12.5), 44 * s, 8 * s, s); ctx.fill();
  ctx.font = `${Math.round(9 * s)}px sans-serif`; ctx.fillText('🏫', X(0), Y(3));
  if (labels) {
    ctx.font = `900 ${Math.round(3.4 * s)}px Nunito, sans-serif`; ctx.fillStyle = '#2a1a5e';
    ctx.fillText('ENGLISH PARTY SCHOOL', X(0), Y(10.5));
  }
  // aulas
  for (const z of ZONES) {
    const [zx, zz] = z.pos;
    const hot = store.zone === z.id || hover === z.id;
    ctx.fillStyle = '#efe9ff'; rr(ctx, X(zx - 15), Y(zz - 15), 30 * s, 30 * s, 2 * s); ctx.fill();
    ctx.globalAlpha = hot ? 1 : 0.85;
    ctx.fillStyle = z.color; rr(ctx, X(zx - 13.5), Y(zz - 13.5), 27 * s, 27 * s, 2 * s); ctx.fill();
    ctx.globalAlpha = 1;
    if (hot) { ctx.lineWidth = Math.max(2, s * 0.9); ctx.strokeStyle = '#fff'; ctx.stroke(); }
    // puerta
    ctx.fillStyle = '#ffd23f';
    const [fx, fz] = z.face;
    ctx.beginPath(); ctx.arc(X(zx + fx * 14.5), Y(zz + fz * 14.5), Math.max(2, s * 1.6), 0, 7); ctx.fill();
    ctx.font = `${Math.round(12 * s)}px sans-serif`; ctx.fillStyle = '#000';
    ctx.fillText(z.emoji, X(zx), Y(zz - (labels ? 3 * s / s : 0)));
    if (labels) {
      ctx.font = `800 ${Math.round(3.6 * s)}px Nunito, sans-serif`;
      const tw = ctx.measureText(z.short).width + 14;
      ctx.fillStyle = 'rgba(42,26,94,.92)';
      rr(ctx, X(zx) - tw / 2, Y(zz + 6), tw, 5.6 * s, 3 * s); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(z.short, X(zx), Y(zz + 8.8));
    }
  }
  const dot = Math.max(3.5, s * 1.4);
  for (const p of store.players.values()) {
    ctx.fillStyle = p.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = dot * 0.4;
    ctx.beginPath(); ctx.arc(X(p.x), Y(p.z), dot, 0, 7); ctx.fill(); ctx.stroke();
  }
  // ruta en curso
  if (me.route?.length) {
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = Math.max(2, s * 0.8); ctx.setLineDash([s * 1.5, s * 1.2]);
    ctx.beginPath(); ctx.moveTo(X(me.pos.x), Y(me.pos.z)); for (const w of me.route) ctx.lineTo(X(w.x), Y(w.z)); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.save();
  ctx.translate(X(me.pos.x), Y(me.pos.z));
  ctx.rotate(-me.ry + Math.PI);
  const k = dot * 2;
  ctx.fillStyle = store.profile?.color || '#fff'; ctx.strokeStyle = '#2a1a5e'; ctx.lineWidth = dot * 0.55;
  ctx.beginPath(); ctx.moveTo(0, -k); ctx.lineTo(k * 0.7, k * 0.7); ctx.lineTo(-k * 0.7, k * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function initBigMap({ me, onGo }) {
  const el = document.getElementById('bigmap');
  const canvas = el.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const list = el.querySelector('.map-list');
  let hover = null; let timer = 0;

  const renderList = () => {
    list.innerHTML = ZONES.map((z) => {
      const n = [...store.players.values()].filter((p) => p.zone === z.id).length;
      return `<div class="ml ${hover === z.id ? 'hot' : ''} ${store.zone === z.id ? 'here' : ''}" data-id="${z.id}" style="--c:${z.color}">
        <span class="ml-e">${z.emoji}</span>
        <span class="ml-t"><b>${esc(z.short)}</b><small>${esc(z.name)}${n ? ` · 👥 ${n}` : ''}</small></span>
        ${store.zone === z.id ? '<span class="ml-here">Estás aquí</span>' : '<button type="button" class="btn btn-primary ml-go">Ir ▶</button>'}
      </div>`;
    }).join('');
  };
  const draw = () => drawMap(ctx, canvas.width, canvas.height, me, { labels: true, hover });
  const zoneAt = (ev) => {
    const r = canvas.getBoundingClientRect();
    const W = canvas.width; const H = canvas.height; const s = mapScale(W, H);
    const x = ((ev.clientX - r.left) / r.width * W - W / 2) / s;
    const z = ((ev.clientY - r.top) / r.height * H - H / 2) / s;
    return zoneOf(x, z)?.id || null;
  };
  canvas.addEventListener('pointermove', (e) => { const h = zoneAt(e); if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : 'default'; renderList(); draw(); } });
  canvas.addEventListener('click', (e) => { const h = zoneAt(e); if (h) go(h); });
  list.addEventListener('pointerover', (e) => { const r = e.target.closest('.ml'); const h = r?.dataset.id || null; if (h !== hover) { hover = h; draw(); } });
  list.addEventListener('click', (e) => { const b = e.target.closest('.ml-go'); if (b) go(b.closest('.ml').dataset.id); });

  const close = () => { el.hidden = true; store.uiOpen = false; clearInterval(timer); store.emit('overlay'); };
  const go = (id) => { if (store.zone === id) return; sfx('win'); close(); onGo(id); store.emit('toast', `🧭 De camino a ${ZONE_BY_ID[id].name}…`); };
  el.querySelector('.map-close').onclick = close;
  el.addEventListener('pointerdown', (e) => { if (e.target === el) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) close(); });

  return {
    open() {
      if (store.uiOpen) return;
      store.uiOpen = true; el.hidden = false; sfx('whoosh');
      renderList(); draw();
      clearInterval(timer); timer = setInterval(() => { draw(); }, 120);
      store.emit('overlay');
    },
    toggle() { if (!el.hidden) close(); else this.open(); },
    get isOpen() { return !el.hidden; },
  };
}
