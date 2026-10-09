// Progreso del alumno por aula (se guarda en el navegador)
import { storage } from './store.js';

const KEY = 'ep-progress';
const data = storage.get(KEY, {});
export const PASS = 0.7;
export const EXAM_Q = 12;

// Ruta de aprendizaje recomendada
export const ROADMAP = [
  { level: 'A1', title: 'Primeros pasos', zones: ['market', 'farm', 'hero', 'treasure'] },
  { level: 'A2', title: 'Ya me defiendo', zones: ['circus', 'haunted', 'past', 'stadium'] },
  { level: 'B1', title: 'Nivel aventurero', zones: ['future', 'jungle'] },
];

export const progress = {
  get: (id) => data[id] || {},
  update(id, patch) { data[id] = { ...this.get(id), ...patch }; storage.set(KEY, data); },
  theory(id) { this.update(id, { theory: true }); },
  practice(id, ok, total) { this.update(id, { practiceBest: Math.max(this.get(id).practiceBest || 0, ok / total) }); },
  compete(id, score) { this.update(id, { competeBest: Math.max(this.get(id).competeBest || 0, score) }); },
  exam(id, pct) {
    const p = this.get(id); const first = !p.passed && pct >= PASS;
    this.update(id, { examBest: Math.max(p.examBest || 0, pct), passed: p.passed || pct >= PASS, examTries: (p.examTries || 0) + 1 });
    return first;
  },
  stars(id) { const p = this.get(id); return (p.theory ? 1 : 0) + ((p.practiceBest || 0) >= 0.75 ? 1 : 0) + (p.passed ? 1 : 0); },
  mastered(id) { const p = this.get(id); return !!(p.theory && p.passed); },
  status(id) { const p = this.get(id); return this.mastered(id) ? 'mastered' : Object.keys(p).length ? 'progress' : 'new'; },
  next() { for (const l of ROADMAP) for (const z of l.zones) if (!this.mastered(z)) return z; return null; },
  count() { return ROADMAP.flatMap((l) => l.zones).filter((z) => this.mastered(z)).length; },
};
