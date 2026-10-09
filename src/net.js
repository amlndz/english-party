// Cliente WebSocket con reconexión
import { store } from './store.js';

class Net {
  constructor() { this.ws = null; this.handlers = {}; this.profile = null; }
  connect(profile) {
    this.profile = profile;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws = ws;
    ws.onopen = () => { store.online = true; store.emit('online', true); this.send('hello', this.profile); };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      (this.handlers[m.type] || []).forEach((f) => f(m));
    };
    ws.onclose = () => {
      store.online = false; store.emit('online', false);
      setTimeout(() => this.connect(this.profile), 2500);
    };
  }
  send(type, data = {}) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ type, ...data })); }
  on(type, f) { (this.handlers[type] ||= []).push(f); }
}
export const net = new Net();
