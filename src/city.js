// Plano de la ciudad-colegio (módulo puro: lo usan el cliente y el servidor)
//
//   z=-57 ═══════════════════════════════════════════  (calle norte)
//          [farm]   [past]   [future]  [circus]
//   z=-19 ═══════════════════════════════════════════
//          [hero]   [   COLEGIO CENTRAL   ]  [jungle]
//   z= 19 ═══════════════════════════════════════════
//          [haunted][treasure][market] [stadium]
//   z= 57 ═══════════════════════════════════════════  (calle sur)
//        x=-76   -38      0       38      76
import { ZONES, zoneAt } from './content.js';

export const ROADS_X = [-76, -38, 0, 38, 76];
export const ROADS_Z = [-57, -19, 19, 57];
export const ROAD_HALF = 4;
export const BLOCK_HALF = 15;
export const HX = 88; export const HZ = 69; // medio ancho/fondo de la isla
export const WALK = { x: 84, z: 65 };
export const CAMPUS = { id: 'campus', pos: [0, 0], face: [0, 1], hx: 34, hz: 15 };
export const SPAWN = [0, 7];

export const BLOCKS = [
  ...ZONES.map((z) => ({ x: z.pos[0], z: z.pos[1], hx: BLOCK_HALF, hz: BLOCK_HALF, zone: z })),
  { x: 0, z: 0, hx: CAMPUS.hx, hz: CAMPUS.hz, zone: null },
];
export const onBlock = (x, z) => BLOCKS.some((b) => Math.abs(x - b.x) < b.hx && Math.abs(z - b.z) < b.hz);
export const inCampus = (x, z) => Math.abs(x) < CAMPUS.hx - 1 && Math.abs(z) < CAMPUS.hz - 1;
// el tramo de x=0 entre z=-19 y z=19 no existe: ahí está el colegio
const roadMissing = (rx, z) => rx === 0 && z > -19 && z < 19;

// ---------- grafo de calles ----------
const nodes = [];
for (const x of ROADS_X) for (const z of ROADS_Z) nodes.push([x, z]);
const idx = (x, z) => nodes.findIndex((n) => n[0] === x && n[1] === z);
const adj = nodes.map(() => []);
const link = (a, b) => { const d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); adj[a].push([b, d]); adj[b].push([a, d]); };
for (const z of ROADS_Z) for (let i = 0; i < ROADS_X.length - 1; i++) link(idx(ROADS_X[i], z), idx(ROADS_X[i + 1], z));
for (const x of ROADS_X) for (let i = 0; i < ROADS_Z.length - 1; i++) if (!(x === 0 && ROADS_Z[i] === -19)) link(idx(x, ROADS_Z[i]), idx(x, ROADS_Z[i + 1]));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function segEnds(pt) {
  const [x, z] = pt;
  if (ROADS_Z.includes(z)) {
    let i = 0; while (i < ROADS_X.length - 2 && x > ROADS_X[i + 1]) i++;
    return [idx(ROADS_X[i], z), idx(ROADS_X[i + 1], z)];
  }
  let i = 0; while (i < ROADS_Z.length - 2 && z > ROADS_Z[i + 1]) i++;
  return [idx(x, ROADS_Z[i]), idx(x, ROADS_Z[i + 1])];
}
export function nearestRoad(x, z) {
  let best = null; let bd = Infinity;
  for (const rz of ROADS_Z) { const p = [clamp(x, ROADS_X[0], ROADS_X[4]), rz]; const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd) { bd = d; best = p; } }
  for (const rx of ROADS_X) {
    let pz = clamp(z, ROADS_Z[0], ROADS_Z[3]);
    if (roadMissing(rx, pz)) continue;
    const d = Math.hypot(rx - x, pz - z); if (d < bd) { bd = d; best = [rx, pz]; }
  }
  return best;
}
function sameSegment(a, b) {
  const ea = segEnds(a); const eb = segEnds(b);
  return (ea[0] === eb[0] && ea[1] === eb[1]);
}
function roadPath(a, b) {
  if (sameSegment(a, b)) return [];
  const ea = segEnds(a); const eb = segEnds(b);
  const dist = nodes.map(() => Infinity); const prev = nodes.map(() => -1); const done = new Set();
  for (const e of ea) dist[e] = Math.hypot(nodes[e][0] - a[0], nodes[e][1] - a[1]);
  for (;;) {
    let u = -1; for (let i = 0; i < nodes.length; i++) if (!done.has(i) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    done.add(u);
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  let end = eb[0];
  const tail = (e) => dist[e] + Math.hypot(nodes[e][0] - b[0], nodes[e][1] - b[1]);
  if (tail(eb[1]) < tail(end)) end = eb[1];
  const out = []; for (let v = end; v >= 0; v = prev[v]) out.unshift([...nodes[v]]);
  return out;
}

// puntos de una parcela (aula o colegio) según hacia dónde mira su puerta
export function plotPoints(p) {
  const [x, z] = p.pos; const [fx, fz] = p.face;
  const at = (d) => [x + fx * d, z + fz * d];
  // manzana de 30 (medio = 15) + media calzada (4) = el eje de la calle está a 19 del centro
  return { pad: at(p.id === 'campus' ? 7 : 2), front: at(8), door: at(BLOCK_HALF + 0.5), road: at(BLOCK_HALF + ROAD_HALF) };
}

// ruta peatonal: salir por la puerta de donde estoy → calles → entrar por la puerta del destino
export function planRoute(x, z, dest, final = null) {
  const pts = [];
  const here = zoneAt(x, z) || (inCampus(x, z) ? CAMPUS : null);
  const to = plotPoints(dest);
  if (here && here.id === dest.id) return [final || to.pad];
  let start;
  if (here) {
    const h = plotPoints(here);
    pts.push(h.front, h.door, h.road);
    start = h.road;
  } else {
    start = nearestRoad(x, z);
    pts.push(start);
  }
  pts.push(...roadPath(start, to.road));
  pts.push(to.road, to.door, to.front, final || to.pad);
  return pts;
}
