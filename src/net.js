// Conexión multijugador. Dos modos:
//  - online: WebSocket con el servidor Node (multijugador real)
//  - local:  la misma lógica de juego corre en el navegador (versión estática / sin servidor):
//            bots, competición y ranking simulados. Se activa con VITE_OFFLINE=1 al compilar
//            o automáticamente si el servidor no responde.
import { store, storage } from './store.js';

const FORCE_LOCAL = import.meta.env.VITE_OFFLINE === '1';

class Net {
  constructor() { this.ws = null; this.handlers = {}; this.profile = null; this.local = null; this.fails = 0; this.everOpen = false; }
  get isLocal() { return !!this.local; }
  connect(profile) {
    this.profile = profile;
    if (FORCE_LOCAL) { this.startLocal(); return; }
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws = ws;
    ws.onopen = () => { this.everOpen = true; this.fails = 0; store.online = true; store.emit('online', true); this.send('hello', this.profile); };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } this.dispatch(m); };
    ws.onclose = () => {
      store.online = false; store.emit('online', false);
      // si nunca hubo servidor, pasamos a modo local para que la demo funcione igual
      if (!this.everOpen && ++this.fails >= 2) { this.startLocal(); return; }
      setTimeout(() => this.connect(this.profile), 2500);
    };
  }
  async startLocal() {
    if (this.local) return;
    this.ws = null;
    const { createGame } = await import('./game.js');
    const game = createGame({ boards: storage.get('ep-boards', null), onBoards: (b) => storage.set('ep-boards', b) });
    const id = game.connect((msg) => queueMicrotask(() => this.dispatch(msg)));
    this.local = { game, id };
    store.online = true; store.offlineDemo = true; store.emit('online', true);
    this.send('hello', this.profile);
  }
  dispatch(m) { (this.handlers[m.type] || []).forEach((f) => f(m)); }
  send(type, data = {}) {
    if (this.local) { this.local.game.message(this.local.id, { type, ...data }); return; }
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ type, ...data }));
  }
  on(type, f) { (this.handlers[type] ||= []).push(f); }
}
export const net = new Net();
