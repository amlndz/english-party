// Estado compartido + mini event-bus
export const store = {
  profile: null,
  myId: null,
  players: new Map(), // otros jugadores (snapshot del servidor)
  live: {}, // zona -> entries de competición en vivo
  boards: {}, // zona -> ranking
  zone: null,
  uiOpen: false,
  online: false,
  points: 0,
  _l: {},
  on(e, f) { (this._l[e] ||= []).push(f); return () => { this._l[e] = this._l[e].filter((x) => x !== f); }; },
  emit(e, d) { (this._l[e] || []).forEach((f) => f(d)); },
};

export const storage = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin storage */ } },
};
