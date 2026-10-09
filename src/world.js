// Mundo: ciudad-colegio flotante con aulas temáticas hechas con primitivas
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ZONES, ZONE_BY_ID } from './content.js';
import { createBean } from './bean.js';
import { ROADS_X, ROADS_Z, ROAD_HALF, HX, HZ, CAMPUS, onBlock } from './city.js';

const matCache = new Map();
function M(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...opts }));
  return matCache.get(key);
}
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, shadow = true) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = shadow;
  o.receiveShadow = true;
  if (parent) parent.add(o);
  return o;
}
const box = (w, h, d, mat, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
const rbox = (w, h, d, r, mat, x, y, z, p) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, p);
const cyl = (rt, rb, h, mat, x, y, z, p, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
const sph = (r, mat, x, y, z, p, seg = 24) => mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.66 | 0)), mat, x, y, z, p);

// altura útil de vallas y muros bajos: con un salto (≈1,5) se pasan por encima
const WALL_H = 0.95;

export function groundHeight(x, z) {
  return onBlock(x, z) ? 0.25 : 0.03;
}

export function textTexture(lines, { w = 1024, h = 256, bg = '#ffffff', fg = '#2a1a5e', font = 'Titan One', size = 110, radius = 60, border = null, align = 'center' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, radius); g.fill();
    if (border) { g.lineWidth = 14; g.strokeStyle = border; g.stroke(); }
  }
  g.fillStyle = fg;
  g.textAlign = align;
  g.textBaseline = 'middle';
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((l, i) => {
    const s = i === 0 ? size : size * 0.62;
    g.font = `${s}px "${i === 0 ? font : 'Nunito'}", sans-serif`;
    if (i > 0 && font === 'Titan One') g.font = `800 ${s}px "Nunito", sans-serif`;
    const y = arr.length === 1 ? h / 2 : (h / (arr.length + 0.6)) * (i + 0.8);
    g.fillText(l, align === 'center' ? w / 2 : 50, y);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function sign(text, color, scale = 9) {
  const tex = textTexture(text, { bg: '#ffffff', fg: color, border: color });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
  s.scale.set(scale, scale / 4, 1);
  return s;
}

// ---------- decor genéricos ----------
function tree(x, z, parent, rnd) {
  const g = new THREE.Group();
  const tones = ['#7ee36b', '#5fd38a', '#ff9ccf', '#c69cff', '#9be86a'];
  const tone = tones[Math.floor(rnd() * tones.length)];
  cyl(0.22, 0.32, 1.6, M('#a8673f'), 0, 0.8, 0, g, 8);
  const s = 0.9 + rnd() * 0.6;
  sph(1.25 * s, M(tone), 0, 2.2 * s, 0, g, 16);
  sph(0.9 * s, M(tone), 0.55 * s, 2.9 * s, 0.2, g, 16);
  sph(0.8 * s, M(tone), -0.5 * s, 2.7 * s, -0.3, g, 16);
  g.position.set(x, 0, z);
  g.rotation.y = rnd() * 6;
  parent.add(g);
  return g;
}
function palm(x, z, parent, lean = 0.2) {
  const g = new THREE.Group();
  let px = 0; let py = 0;
  for (let i = 0; i < 6; i++) {
    const seg = cyl(0.26 - i * 0.02, 0.3 - i * 0.02, 0.9, M(i % 2 ? '#b07a45' : '#c48c55'), px, py + 0.45, 0, g, 10);
    seg.rotation.z = -lean * (i / 6);
    px += Math.sin(lean * (i / 6)) * 0.9; py += 0.85;
  }
  for (let i = 0; i < 6; i++) {
    const leaf = mesh(new THREE.SphereGeometry(1, 12, 8), M('#3fbf5f'), px, py + 0.1, 0, g);
    leaf.scale.set(1.6, 0.12, 0.45);
    leaf.rotation.y = (i / 6) * Math.PI * 2;
    leaf.rotation.z = -0.35;
    leaf.geometry.translate(0.9, 0, 0);
  }
  sph(0.22, M('#7a4a22'), px + 0.2, py - 0.2, 0.15, g, 10);
  sph(0.22, M('#7a4a22'), px - 0.15, py - 0.25, -0.15, g, 10);
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}
function cloud(rnd) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#d8c8ff', emissiveIntensity: 0.25 });
  const n = 4 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const s = mesh(new THREE.SphereGeometry(2 + rnd() * 2.5, 16, 12), mat, (i - n / 2) * 2.6, rnd() * 1.5, rnd() * 2, g, false);
    s.receiveShadow = false;
  }
  return g;
}
function starShape(r1 = 1, r2 = 0.45) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r; const y = Math.sin(a) * r;
    i ? sh.lineTo(x, y) : sh.moveTo(x, y);
  }
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 3 });
  g.center();
  return g;
}
function chalkboard(lines, parent, x, z, ry) {
  const g = new THREE.Group();
  const wood = M('#9a5b34');
  cyl(0.12, 0.12, 3.6, wood, -1.9, 1.8, 0, g, 8);
  cyl(0.12, 0.12, 3.6, wood, 1.9, 1.8, 0, g, 8);
  box(4.1, 2.5, 0.18, wood, 0, 2.35, -0.02, g);
  const tex = textTexture(lines, { w: 768, h: 480, bg: '#24533f', fg: '#f4f1e6', font: 'Titan One', size: 70, radius: 10 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.25), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  face.position.set(0, 2.35, 0.1);
  g.add(face);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

function stripes(a, b, n = 8, vertical = false) {
  const c = document.createElement('canvas'); c.width = 256; c.height = vertical ? 256 : 32;
  const x = c.getContext('2d');
  for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(i * (256 / n), 0, 256 / n, c.height); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- aulas ----------
function buildPast(g, C, anim) {
  const stone = M('#c9c3dc'); const stoneD = M('#a49dbf');
  const keep = box(8, 6, 6, stone, 0, 3, -7.5, g);
  for (let i = -3.5; i <= 3.5; i += 1.4) {
    box(0.7, 0.7, 0.7, stoneD, i, 6.35, -4.6, g);
    box(0.7, 0.7, 0.7, stoneD, i, 6.35, -10.4, g);
  }
  const roofs = [M('#ff5a7e'), M('#5a7dff')];
  [[-4.4, -4.6], [4.4, -4.6], [-4.4, -10.4], [4.4, -10.4]].forEach(([x, z], i) => {
    cyl(1.5, 1.65, 8, stone, x, 4, z, g);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      box(0.45, 0.5, 0.45, stoneD, x + Math.sin(a) * 1.4, 8.2, z + Math.cos(a) * 1.4, g);
    }
    cyl(0.01, 2.0, 3.2, roofs[i % 2], x, 10.0, z, g, 20);
    cyl(0.05, 0.05, 1.4, M('#555'), x, 12.2, z, g, 6);
    const flag = mesh(new THREE.PlaneGeometry(1.1, 0.6), new THREE.MeshStandardMaterial({ color: i % 2 ? '#ffd23f' : '#ff4f8b', side: THREE.DoubleSide }), x + 0.55, 12.6, z, g);
    anim.push((t) => { flag.rotation.y = Math.sin(t * 3 + i) * 0.35; });
    C.push([x, z, 1.9]);
  });
  // puerta + estandartes
  box(2.2, 3.2, 0.3, M('#6b3d22'), 0, 1.6, -4.4, g);
  cyl(1.1, 1.1, 0.3, M('#6b3d22'), 0, 3.2, -4.4, g, 24).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const ban = box(1.1, 2.4, 0.08, M(s < 0 ? '#ff4f8b' : '#5a7dff'), s * 2.6, 3.8, -4.42, g);
    box(1.1, 0.25, 0.1, M('#ffd23f'), s * 2.6, 3.1, -4.38, g);
    ban.castShadow = false;
    // antorchas
    cyl(0.08, 0.06, 0.8, M('#5b3a22'), s * 1.6, 2.3, -4.2, g, 6);
    const fire = sph(0.18, new THREE.MeshStandardMaterial({ color: '#ffb02e', emissive: '#ff6a00', emissiveIntensity: 2.5 }), s * 1.6, 2.8, -4.2, g, 10);
    anim.push((t) => { fire.scale.setScalar(1 + Math.sin(t * 13 + s) * 0.15); });
  }
  C.push([0, -7.5, 4.6], [-2.5, -7.5, 4], [2.5, -7.5, 4]);
  // espada en la roca
  const rock = mesh(new THREE.DodecahedronGeometry(1.1, 0), M('#9a93ad'), 7, 0.6, 1, g);
  rock.scale.y = 0.7;
  box(0.18, 1.8, 0.06, M('#e8edf5', { metalness: 0.8, roughness: 0.2 }), 7, 1.9, 1, g);
  box(0.8, 0.14, 0.14, M('#ffcc33', { metalness: 0.6 }), 7, 2.8, 1, g);
  cyl(0.07, 0.07, 0.45, M('#6b3d22'), 7, 3.1, 1, g, 8);
  C.push([7, 1, 1.3]);
  // muñecos de entrenamiento + paja
  for (const [x, z] of [[-6.5, 0.5], [-8, 3.5]]) {
    cyl(0.1, 0.1, 2.2, M('#7a4a22'), x, 1.1, z, g, 8);
    cyl(0.45, 0.4, 1.1, M('#e8c873'), x, 1.6, z, g, 12);
    sph(0.35, M('#e8c873'), x, 2.5, z, g, 12);
    box(1.6, 0.18, 0.18, M('#7a4a22'), x, 1.9, z, g);
    C.push([x, z, 0.7]);
  }
  const hay = cyl(0.7, 0.7, 1.2, M('#f0d27a'), -9, 0.7, -2.5, g, 16); hay.rotation.z = Math.PI / 2; C.push([-9, -2.5, 1]);
  // dragón que vuela en círculos
  const dragon = new THREE.Group();
  const green = M('#5ee07a'); const belly = M('#ffe08a');
  const body = sph(0.9, green, 0, 0, 0, dragon); body.scale.set(0.8, 0.7, 1.4);
  sph(0.55, belly, 0, -0.2, 0.3, dragon).scale.set(0.9, 0.7, 1.2);
  const neck = cyl(0.3, 0.4, 1, green, 0, 0.6, 1.1, dragon, 10); neck.rotation.x = 0.7;
  const head = sph(0.55, green, 0, 1.1, 1.7, dragon); head.scale.set(1, 0.85, 1.2);
  for (const s of [-1, 1]) {
    sph(0.12, M('#fff'), s * 0.25, 1.3, 2.15, dragon, 10);
    sph(0.06, M('#111'), s * 0.27, 1.32, 2.24, dragon, 8);
    cyl(0.01, 0.1, 0.35, M('#fff6d0'), s * 0.22, 1.65, 1.6, dragon, 6);
  }
  const tail = cyl(0.05, 0.35, 1.8, green, 0, -0.1, -1.8, dragon, 8); tail.rotation.x = -1.4;
  const wings = [];
  for (const s of [-1, 1]) {
    const wg = new THREE.Group();
    const shp = new THREE.Shape(); shp.moveTo(0, 0); shp.lineTo(2.4 * s, 0.6); shp.lineTo(1.8 * s, -0.6); shp.lineTo(0.9 * s, -0.4); shp.lineTo(0, -0.8);
    const w = new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshStandardMaterial({ color: '#ff8fd8', side: THREE.DoubleSide, roughness: 0.6 }));
    w.rotation.x = -Math.PI / 2; w.castShadow = true;
    wg.add(w); wg.position.set(s * 0.4, 0.4, 0.2);
    dragon.add(wg); wings.push(wg);
  }
  g.add(dragon);
  anim.push((t) => {
    const a = t * 0.45;
    dragon.position.set(Math.cos(a) * 9, 13 + Math.sin(t * 1.3) * 1.2, -7 + Math.sin(a) * 9);
    dragon.rotation.y = -a;
    wings[0].rotation.z = Math.sin(t * 7) * 0.6;
    wings[1].rotation.z = -Math.sin(t * 7) * 0.6;
  });
}

function buildFuture(g, C, anim) {
  const grid = new THREE.GridHelper(17, 17, '#ff4fd8', '#3df0ff');
  grid.position.y = 0.27;
  grid.material.transparent = true; grid.material.opacity = 0.55;
  g.add(grid);
  const dome = mesh(new THREE.SphereGeometry(5.5, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#7fe9ff', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3, emissive: '#1a6dff', emissiveIntensity: 0.35, depthWrite: false }), 0, 0.25, -7, g);
  dome.castShadow = false;
  const ring = mesh(new THREE.TorusGeometry(5.5, 0.25, 12, 64), new THREE.MeshStandardMaterial({ color: '#3df0ff', emissive: '#3df0ff', emissiveIntensity: 1.6 }), 0, 0.35, -7, g);
  ring.rotation.x = Math.PI / 2;
  const core = cyl(0.6, 0.6, 4, new THREE.MeshStandardMaterial({ color: '#ff4fd8', emissive: '#ff4fd8', emissiveIntensity: 1.5 }), 0, 2.2, -7, g, 16);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = mesh(new THREE.TorusGeometry(2.2 + i * 0.9, 0.09, 8, 64), new THREE.MeshStandardMaterial({ color: i % 2 ? '#ff4fd8' : '#3df0ff', emissive: i % 2 ? '#ff4fd8' : '#3df0ff', emissiveIntensity: 2 }), 0, 8.5 + i * 0.4, -7, g, false);
    rings.push(r);
  }
  anim.push((t) => {
    rings.forEach((r, i) => { r.rotation.x = t * (0.6 + i * 0.3); r.rotation.y = t * (0.4 - i * 0.2); });
    core.scale.y = 1 + Math.sin(t * 3) * 0.1;
  });
  C.push([0, -7, 5.8]);
  // robots
  const robots = [[-6, -0.5, '#e9eef7'], [6.2, -1.5, '#ffd23f']].map(([x, z, col], i) => {
    const r = new THREE.Group();
    const metal = M(col, { metalness: 0.4, roughness: 0.35 });
    box(1.4, 1.5, 1, metal, 0, 1.4, 0, r);
    box(1.1, 0.9, 0.9, metal, 0, 2.65, 0, r);
    box(0.85, 0.35, 0.05, new THREE.MeshStandardMaterial({ color: '#111', emissive: '#3df0ff', emissiveIntensity: 0.4 }), 0, 2.7, 0.46, r);
    for (const s of [-1, 1]) {
      sph(0.09, new THREE.MeshStandardMaterial({ color: '#3df0ff', emissive: '#3df0ff', emissiveIntensity: 2 }), s * 0.2, 2.7, 0.5, r, 10);
      cyl(0.13, 0.13, 0.9, M('#9aa3b5', { metalness: 0.6 }), s * 0.85, 1.4, 0, r, 8);
      cyl(0.18, 0.18, 0.6, M('#5b6378'), s * 0.35, 0.3, 0, r, 10);
    }
    cyl(0.03, 0.03, 0.6, M('#9aa3b5'), 0, 3.4, 0, r, 6);
    const bulb = sph(0.12, new THREE.MeshStandardMaterial({ color: '#ff4fd8', emissive: '#ff4fd8', emissiveIntensity: 2 }), 0, 3.75, 0, r, 10);
    r.position.set(x, 0.25, z);
    r.rotation.y = i ? -0.6 : 0.6;
    g.add(r);
    C.push([x, z, 1]);
    anim.push((t) => {
      r.children[1].rotation.y = Math.sin(t * 1.2 + i * 2) * 0.5;
      r.position.y = 0.25 + Math.abs(Math.sin(t * 2 + i)) * 0.15;
      bulb.material.emissiveIntensity = (Math.sin(t * 5 + i) > 0) ? 2.5 : 0.3;
    });
    return r;
  });
  void robots;
  // cohete
  const rocket = new THREE.Group();
  cyl(0.8, 0.8, 3.2, M('#f4f6fb', { metalness: 0.2 }), 0, 2.4, 0, rocket);
  cyl(0.01, 0.8, 1.6, M('#ff4f6b'), 0, 4.8, 0, rocket);
  sph(0.38, new THREE.MeshStandardMaterial({ color: '#3df0ff', emissive: '#1a6dff', emissiveIntensity: 0.8 }), 0, 3, 0.65, rocket, 16).scale.z = 0.4;
  for (let i = 0; i < 3; i++) {
    const f = box(0.12, 1.2, 1, M('#ff4f6b'), Math.sin((i / 3) * 6.28) * 0.85, 1.2, Math.cos((i / 3) * 6.28) * 0.85, rocket);
    f.rotation.y = (i / 3) * 6.28;
  }
  const flame = mesh(new THREE.ConeGeometry(0.5, 1.2, 16), new THREE.MeshStandardMaterial({ color: '#ffb02e', emissive: '#ff6a00', emissiveIntensity: 2.5, transparent: true, opacity: 0.85 }), 0, 0.3, 0, rocket, false);
  flame.rotation.x = Math.PI;
  rocket.position.set(8, 0.25, -6);
  g.add(rocket);
  C.push([8, -6, 1.4]);
  anim.push((t) => { rocket.position.y = 0.6 + Math.sin(t * 1.5) * 0.3; flame.scale.y = 1 + Math.sin(t * 20) * 0.2; });
  // panel holográfico
  const holo = mesh(new THREE.PlaneGeometry(3, 1.8), new THREE.MeshBasicMaterial({ map: textTexture(['WILL + VERB', 'going to · won’t'], { w: 640, h: 380, bg: 'rgba(30,140,255,0.35)', fg: '#d6fbff', size: 80, border: '#3df0ff', radius: 30 }), transparent: true, side: THREE.DoubleSide, depthWrite: false }), -7.5, 3.4, -6, g, false);
  holo.rotation.y = 0.7;
  anim.push((t) => { holo.position.y = 3.4 + Math.sin(t * 2) * 0.15; });
}

function buildTreasure(g, C, anim) {
  // Skull Rock
  const rock = M('#8e86a8');
  const skull = sph(4.2, rock, 0, 2.8, -8, g, 24); skull.scale.set(1.15, 0.95, 0.9);
  sph(2.6, rock, 0, 1.0, -6.4, g, 20).scale.set(1.2, 0.6, 0.8);
  for (const s of [-1, 1]) sph(1.05, M('#2b2140'), s * 1.5, 3.8, -4.65, g, 16).scale.z = 0.5;
  mesh(new THREE.CircleGeometry(1.3, 24, 0, Math.PI), M('#1d1530'), 0, 0.3, -4.75, g, false);
  for (let i = -2; i <= 2; i++) box(0.4, 0.5, 0.3, M('#f4efe6'), i * 0.5, 1.75, -4.4, g);
  C.push([0, -8, 5]);
  // cofres
  const chest = (x, z, ry, open) => {
    const c = new THREE.Group();
    const wood = M('#9a5b34'); const band = M('#ffcc33', { metalness: 0.6, roughness: 0.3 });
    box(1.6, 0.9, 1, wood, 0, 0.45, 0, c);
    box(1.65, 0.12, 1.05, band, 0, 0.9, 0, c);
    box(0.2, 0.95, 1.05, band, 0.5, 0.45, 0, c); box(0.2, 0.95, 1.05, band, -0.5, 0.45, 0, c);
    const lid = new THREE.Group();
    const l = mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16, 1, false, 0, Math.PI), wood, 0, 0, 0.5, lid); l.rotation.z = Math.PI / 2;
    lid.position.set(0, 0.9, -0.5);
    c.add(lid);
    if (open) {
      lid.rotation.x = -1.2;
      const glow = sph(0.65, new THREE.MeshStandardMaterial({ color: '#ffd84a', emissive: '#ffb000', emissiveIntensity: 1.4, metalness: 0.7, roughness: 0.2 }), 0, 0.85, 0, c, 16);
      glow.scale.y = 0.4;
      anim.push((t) => { glow.material.emissiveIntensity = 1.1 + Math.sin(t * 3) * 0.4; });
    }
    c.position.set(x, 0.25, z); c.rotation.y = ry;
    g.add(c); C.push([x, z, 1.1]);
  };
  chest(5, -2, -0.5, true); chest(-5.5, -3, 0.4, false); chest(7.5, 3, -1.2, false);
  // monedas
  const coinMat = M('#ffcc33', { metalness: 0.75, roughness: 0.25, emissive: '#5a3a00', emissiveIntensity: 0.3 });
  const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 16);
  for (const [cx, cz] of [[3.5, -0.5], [-3.2, -1.2], [6.2, 0.5]]) {
    for (let i = 0; i < 14; i++) {
      const c = mesh(coinGeo, coinMat, cx + (Math.random() - 0.5) * 1.4, 0.3 + Math.random() * 0.4, cz + (Math.random() - 0.5) * 1.4, g);
      c.rotation.set(Math.random(), Math.random(), Math.random());
    }
  }
  // gemas flotantes
  ['#ff3b6b', '#3bc8ff', '#7dff6b', '#c06bff'].forEach((col, i) => {
    const gem = mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.1 }), -8 + i * 1.2, 2, 1 + (i % 2), g);
    anim.push((t) => { gem.rotation.y = t * 1.5 + i; gem.position.y = 2 + Math.sin(t * 2 + i) * 0.35; });
  });
  palm(-9, -6, g, 0.35); C.push([-9, -6, 0.6]);
  palm(9.5, -5, g, -0.3); C.push([9.5, -5, 0.6]);
  palm(-10, 2, g, 0.25); C.push([-10, 2, 0.6]);
  // bandera pirata
  cyl(0.08, 0.08, 6, M('#5b3a22'), 4.5, 3, -7.5, g, 8);
  const flag = mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshStandardMaterial({ map: textTexture('☠', { w: 256, h: 160, bg: '#15121f', fg: '#fff', size: 110, radius: 4 }), side: THREE.DoubleSide }), 5.6, 5.3, -7.5, g);
  anim.push((t) => { flag.rotation.y = Math.sin(t * 2.5) * 0.25; });
  C.push([4.5, -7.5, 0.4]);
}

function buildMarket(g, C, anim) {
  const stall = (x, z, ry, cA, fruit) => {
    const s = new THREE.Group();
    const wood = M('#c08552');
    for (const [px, pz] of [[-1.6, -0.9], [1.6, -0.9], [-1.6, 0.9], [1.6, 0.9]]) cyl(0.1, 0.1, 3, wood, px, 1.5, pz, s, 8);
    box(3.4, 1, 1.6, M('#e9b27c'), 0, 0.5, 0.2, s);
    const awn = mesh(new THREE.BoxGeometry(3.8, 0.15, 2.4), new THREE.MeshStandardMaterial({ map: stripes(cA, '#ffffff'), roughness: 0.8 }), 0, 3.05, 0.1, s);
    awn.rotation.x = 0.18;
    for (let i = 0; i < 9; i++) {
      const f = fruit[i % fruit.length];
      sph(0.22, M(f), -1.2 + (i % 5) * 0.6, 1.2, -0.1 + Math.floor(i / 5) * 0.55, s, 12);
    }
    s.position.set(x, 0.25, z); s.rotation.y = ry;
    g.add(s);
    C.push([x, z, 2]);
  };
  stall(-5.5, -6, 0.5, '#ff5a7e', ['#ff3b3b', '#7dff6b']);
  stall(0, -8, 0, '#3fb6ff', ['#ffa62b', '#ffd23f']);
  stall(5.5, -6, -0.5, '#2fd4a7', ['#c06bff', '#ff6bb5']);
  // cajas
  for (const [x, z] of [[-8, -1], [8, 0], [-7.2, 0.5]]) { box(1, 0.8, 1, M('#c08552'), x, 0.65, z, g); C.push([x, z, 0.8]); }
  // globos
  const cols = ['#ff4fb4', '#ffd23f', '#3fb6ff', '#7ee36b', '#b06bff'];
  const bal = new THREE.Group();
  cols.forEach((c, i) => {
    const b = sph(0.5, M(c, { roughness: 0.25 }), Math.sin(i * 1.3) * 0.7, 4 + (i % 3) * 0.5, Math.cos(i * 1.3) * 0.5, bal, 16);
    b.scale.y = 1.15;
    const str = cyl(0.01, 0.01, 3.4, M('#ffffff'), b.position.x * 0.5, 2.3, b.position.z * 0.5, bal, 4);
    str.rotation.z = -b.position.x * 0.12;
  });
  bal.position.set(9, 0.25, -4);
  g.add(bal);
  anim.push((t) => { bal.rotation.z = Math.sin(t * 1.2) * 0.06; bal.position.y = 0.25 + Math.sin(t * 1.5) * 0.15; });
  // flechas this/that
  const arrowSign = (txt, x, z, col) => {
    cyl(0.08, 0.08, 2.2, M('#9a5b34'), x, 1.1, z, g, 8);
    const pl = mesh(new THREE.PlaneGeometry(2, 0.7), new THREE.MeshStandardMaterial({ map: textTexture(txt, { w: 512, h: 180, bg: col, fg: '#fff', size: 100, radius: 40 }), side: THREE.DoubleSide }), x, 2.3, z, g);
    pl.rotation.y = 0.2;
    C.push([x, z, 0.3]);
  };
  arrowSign('👇 THIS', 3.5, 1.5, '#ff5a7e');
  arrowSign('THAT 👉', -3.5, 1.5, '#3fb6ff');
}

function buildFarm(g, C, anim) {
  // granero
  box(7, 4.5, 6, M('#e8483f'), 0, 2.25, -7.5, g);
  const roof = cyl(3.7, 3.7, 6.4, M('#7a3b2e'), 0, 6.3, -7.5, g, 3); roof.rotation.x = -Math.PI / 2;
  box(2.6, 3.2, 0.2, M('#ffffff'), 0, 1.6, -4.45, g);
  box(2.2, 2.8, 0.22, M('#b8322b'), 0, 1.5, -4.42, g);
  for (const r of [0.85, -0.85]) { const b = box(0.18, 3.4, 0.25, M('#ffffff'), 0, 1.5, -4.38, g); b.rotation.z = r; }
  box(1.4, 1, 0.2, M('#ffffff'), 0, 5.4, -4.45, g);
  C.push([0, -7.5, 4.6], [-2.5, -7.5, 3.5], [2.5, -7.5, 3.5]);
  // silo
  cyl(1.6, 1.6, 7, M('#d5dbe6', { metalness: 0.3 }), 6, 3.5, -8, g);
  mesh(new THREE.SphereGeometry(1.65, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('#e8483f'), 6, 7, -8, g);
  C.push([6, -8, 1.9]);
  // molino
  cyl(0.7, 1.5, 6.5, M('#f4efe6'), -6.5, 3.25, -6.5, g, 12);
  cyl(0.01, 1.1, 1.4, M('#7a3b2e'), -6.5, 7.2, -6.5, g, 12);
  const blades = new THREE.Group();
  for (let i = 0; i < 4; i++) { const b = box(0.5, 3.2, 0.08, M('#ffe7b8'), 0, 1.6, 0, null); const p = new THREE.Group(); p.add(b); p.rotation.z = (i * Math.PI) / 2; blades.add(p); }
  blades.position.set(-6.5, 6, -5.6); g.add(blades);
  anim.push((t) => { blades.rotation.z = t * 1.2; });
  C.push([-6.5, -6.5, 1.6]);
  // vacas
  [[6, 0.5, 0.6], [8.5, 3.5, -0.9]].forEach(([x, z, ry], i) => {
    const cow = new THREE.Group();
    box(1.8, 1, 1, M('#ffffff'), 0, 1.2, 0, cow);
    for (const [sx, sy, sz] of [[0.4, 1.5, 0.51], [-0.5, 1.1, 0.51], [0.2, 1.0, -0.51], [-0.3, 1.5, -0.51]]) sph(0.22, M('#222'), sx, sy, sz, cow, 10).scale.z = 0.2;
    const head = new THREE.Group();
    box(0.7, 0.7, 0.75, M('#ffffff'), 0.25, 0, 0, head);
    box(0.25, 0.4, 0.6, M('#ffb3c7'), 0.62, -0.15, 0, head);
    for (const s of [-1, 1]) { cyl(0.04, 0.07, 0.3, M('#f4efe6'), 0.15, 0.45, s * 0.25, head, 6); sph(0.07, M('#111'), 0.6, 0.15, s * 0.22, head, 8); }
    head.position.set(0.9, 1.6, 0); cow.add(head);
    for (const [lx, lz] of [[0.6, 0.35], [0.6, -0.35], [-0.6, 0.35], [-0.6, -0.35]]) cyl(0.13, 0.13, 0.8, M('#ffffff'), lx, 0.4, lz, cow, 8);
    cow.position.set(x, 0.25, z); cow.rotation.y = ry; g.add(cow);
    anim.push((t) => { head.rotation.z = Math.sin(t * 1.5 + i * 2) * 0.25 - 0.15; });
    C.push([x, z, 1.2]);
  });
  // gallinas
  for (let i = 0; i < 3; i++) {
    const ch = new THREE.Group();
    sph(0.32, M('#ffffff'), 0, 0.4, 0, ch, 12);
    sph(0.2, M('#ffffff'), 0.28, 0.65, 0, ch, 10);
    cyl(0.01, 0.08, 0.15, M('#ffb02e'), 0.47, 0.63, 0, ch, 6).rotation.z = -Math.PI / 2;
    box(0.08, 0.14, 0.04, M('#ff3b3b'), 0.3, 0.86, 0, ch);
    ch.position.set(-4 - i * 1.3, 0.25, 0.5 + (i % 2)); ch.rotation.y = i * 1.7; g.add(ch);
    anim.push((t) => { ch.rotation.z = Math.max(0, Math.sin(t * 3 + i * 1.3)) * -0.6; });
  }
  // valla
  for (let x = -10; x <= -5; x += 1.25) cyl(0.08, 0.08, 1.1, M('#c08552'), x, 0.8, -2.5, g, 6);
  for (const y of [0.6, 1.05]) box(5.2, 0.1, 0.08, M('#c08552'), -7.5, y + 0.25, -2.5, g);
  C.push([-9, -2.5, 0.7], [-7.5, -2.5, 0.7], [-6, -2.5, 0.7]);
  const hay = cyl(0.7, 0.7, 1.2, M('#f0d27a'), 3.5, 0.95, -3.5, g, 16); hay.rotation.z = Math.PI / 2; C.push([3.5, -3.5, 0.9]);
}

function buildCircus(g, C, anim) {
  const tex = stripes('#ff3f6e', '#ffffff', 16, true); tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = 2;
  const tm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  cyl(5, 5, 3.6, tm, 0, 2.05, -7, g, 32);
  cyl(0.01, 5.6, 4.6, tm, 0, 6.15, -7, g, 32);
  cyl(0.06, 0.06, 1.6, M('#555'), 0, 9.2, -7, g, 6);
  const flag = mesh(new THREE.PlaneGeometry(1, 0.55), new THREE.MeshStandardMaterial({ color: '#ffd23f', side: THREE.DoubleSide }), 0.5, 9.7, -7, g);
  anim.push((t) => { flag.rotation.y = Math.sin(t * 3) * 0.4; });
  const door = mesh(new THREE.CircleGeometry(1.4, 3), M('#3a0d24'), 0, 1.15, -1.98 - 0.01, null);
  door.position.set(0, 1.2, -1.95); door.rotation.z = Math.PI / 2; g.add(door);
  const bulbs = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    bulbs.push(sph(0.12, new THREE.MeshStandardMaterial({ color: '#fff3a0', emissive: '#ffd23f', emissiveIntensity: 1.5 }), Math.sin(a) * 5.05, 3.9, -7 + Math.cos(a) * 5.05, g, 8));
  }
  anim.push((t) => bulbs.forEach((b, i) => { b.material.emissiveIntensity = (Math.floor(t * 4) + i) % 3 ? 0.3 : 2; }));
  C.push([0, -7, 5.3]);
  // trampolín + acróbata
  cyl(1.5, 1.5, 0.5, M('#3fb6ff'), 6.5, 0.5, 0, g, 24);
  cyl(1.35, 1.35, 0.52, M('#222'), 6.5, 0.52, 0, g, 24);
  const acro = createBean({ color: '#ffd23f', acc: 'party' });
  acro.root.position.set(6.5, 0.8, 0); g.add(acro.root);
  anim.push((t) => {
    const h = Math.abs(Math.sin(t * 2.2)) * 4;
    acro.root.position.y = 0.8 + h;
    acro.root.rotation.x = h > 1 ? ((t * 2.2) % Math.PI) * 2 : 0;
    acro.animate(0.016, 0, t, h);
  });
  C.push([6.5, 0, 1.7]);
  // payaso malabarista
  const clown = createBean({ color: '#ff5a5a', acc: 'tophat' });
  clown.root.position.set(-6.5, 0.25, 0.5); clown.root.rotation.y = 0.8; g.add(clown.root);
  const balls = ['#3fb6ff', '#7ee36b', '#ffd23f'].map((c) => sph(0.22, M(c, { roughness: 0.3 }), 0, 0, 0, g, 12));
  anim.push((t) => {
    clown.animate(0.016, 0, t, 0);
    balls.forEach((b, i) => { const a = t * 4 + i * 2.09; b.position.set(-6.5 + Math.cos(a) * 0.9 * 0.7, 3.2 + Math.sin(a) * 0.9, 0.5 + Math.cos(a) * 0.9 * 0.7); });
  });
  C.push([-6.5, 0.5, 0.9]);
  // tambores con pelota
  [[-8.5, -4.5, '#6b6bff'], [8.5, -5, '#2fd4a7']].forEach(([x, z, col], i) => {
    cyl(1, 1, 1.4, M(col), x, 0.95, z, g, 20);
    cyl(1.05, 1.05, 0.15, M('#ffd23f'), x, 1.65, z, g, 20);
    const ball = sph(0.9, new THREE.MeshStandardMaterial({ map: stripes('#ff3f6e', '#ffffff', 6, true), roughness: 0.4 }), x, 2.6, z, g, 20);
    anim.push((t) => { ball.rotation.y = t * (1 + i); });
    C.push([x, z, 1.2]);
  });
}

function buildStadium(g, C) {
  const track = mesh(new THREE.RingGeometry(9.6, 11.8, 72), M('#ff6b4a'), 0, 0.27, 0, g, false); track.rotation.x = -Math.PI / 2;
  const line = mesh(new THREE.RingGeometry(10.65, 10.8, 72), M('#ffffff'), 0, 0.28, 0, g, false); line.rotation.x = -Math.PI / 2;
  // podio
  [[0, 2.4, '#ffd23f', '1'], [-2.1, 1.6, '#d7dde8', '2'], [2.1, 1.1, '#e0915a', '3']].forEach(([x, h, col, n]) => {
    box(2, h, 2, M(col, { roughness: 0.4 }), x, 0.25 + h / 2, -6, g);
    const p = mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: textTexture(n, { w: 256, h: 256, bg: null, fg: '#2a1a5e', size: 200 }), transparent: true }), x, 0.25 + h / 2, -4.99, g, false);
    void p;
  });
  C.push([0, -6, 3.3]);
  // trofeo gigante
  const tro = new THREE.Group();
  const gold = M('#ffcc33', { metalness: 0.75, roughness: 0.25, emissive: '#5a3a00', emissiveIntensity: 0.4 });
  cyl(1.1, 0.45, 1.6, gold, 0, 1.6, 0, tro, 24);
  cyl(0.15, 0.15, 0.8, gold, 0, 0.5, 0, tro, 10);
  box(1, 0.3, 1, M('#5b3a22'), 0, 0.1, 0, tro);
  for (const s of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(0.45, 0.1, 8, 20), gold, s * 1.1, 1.7, 0, tro); h.rotation.y = Math.PI / 2; }
  tro.position.set(0, 2.9, -6); g.add(tro);
  // gradas con público haciendo la ola
  const heads = [];
  [['#ff5fae', 0.4], ['#3fb6ff', 1.2], ['#ffd23f', 2.0]].forEach(([col, y], k) => {
    box(15, 0.8, 1.3, M(col), 0, y, -9.6 - k * 1.3, g);
    for (let x = -6.5; x <= 6.5; x += 1.1) {
      const hd = sph(0.3, M(['#ffcf9e', '#c98a5b', '#8a5a3b', '#f4d7b8'][(x * 7 + k) & 3 & 3]), x, y + 0.75, -9.6 - k * 1.3, g, 10);
      heads.push([hd, y + 0.75, x]);
    }
  });
  g.userData.anim = (t) => heads.forEach(([h, by, x]) => { h.position.y = by + Math.max(0, Math.sin(t * 3 - x * 0.5)) * 0.5; });
  C.push([-5, -10.9, 2.2], [0, -10.9, 2.2], [5, -10.9, 2.2], [-7.5, -10.9, 1.5], [7.5, -10.9, 1.5]);
  // portería
  const white = M('#ffffff');
  cyl(0.1, 0.1, 2.2, white, 7.5, 1.35, -1.5, g, 8); cyl(0.1, 0.1, 2.2, white, 7.5, 1.35, 1.5, g, 8);
  const bar = cyl(0.1, 0.1, 3.1, white, 7.5, 2.45, 0, g, 8); bar.rotation.x = Math.PI / 2;
  const net = mesh(new THREE.PlaneGeometry(3, 2.2), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, side: THREE.DoubleSide }), 8.3, 1.35, 0, g, false); net.rotation.y = Math.PI / 2;
  C.push([7.5, -1.5, 0.4], [7.5, 1.5, 0.4]);
  sph(0.35, M('#ffffff', { roughness: 0.4 }), 5, 0.6, 3, g, 16);
  return (t) => { tro.rotation.y = t * 0.8; tro.position.y = 2.9 + Math.sin(t * 2) * 0.15; g.userData.anim(t); };
}

function buildHaunted(g, C, anim) {
  const wall = M('#5b4a7a'); const dark = M('#2b2140');
  box(7, 6, 5, wall, 0, 3.25, -7.5, g);
  const roof = cyl(0.01, 5.4, 3.4, dark, 0, 7.95, -7.5, g, 4); roof.rotation.y = Math.PI / 4;
  box(2.4, 3, 2.4, wall, 2.3, 7.5, -8, g);
  const r2 = cyl(0.01, 2, 2.4, dark, 2.3, 10.2, -8, g, 4); r2.rotation.y = Math.PI / 4;
  const winMat = new THREE.MeshStandardMaterial({ color: '#ffe066', emissive: '#ffb000', emissiveIntensity: 1.4 });
  for (const [x, y] of [[-2, 4.6], [2, 4.6], [-2, 1.9], [2.3, 7.6]]) box(1.1, 1.2, 0.1, winMat, x, y, x === 2.3 ? -6.78 : -4.98, g);
  box(1.6, 2.6, 0.1, M('#1d1530'), 0.4, 1.55, -4.97, g);
  anim.push((t) => { winMat.emissiveIntensity = Math.random() < 0.03 ? 0.2 : 1.2 + Math.sin(t * 7) * 0.2; });
  C.push([0, -7.5, 4.4], [-2.5, -7.5, 3], [2.5, -7.5, 3]);
  // fantasmas
  const ghostMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, emissive: '#b9a8ff', emissiveIntensity: 0.4 });
  const mkGhost = (s = 1) => {
    const gh = new THREE.Group();
    sph(0.7, ghostMat, 0, 0.7, 0, gh, 16);
    mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.9, 16, 1, true), ghostMat, 0, 0.25, 0, gh, false);
    for (const x of [-0.22, 0.22]) sph(0.12, M('#15121f'), x, 0.85, 0.6, gh, 8).scale.y = 1.5;
    sph(0.13, M('#15121f'), 0, 0.5, 0.64, gh, 8);
    gh.scale.setScalar(s);
    return gh;
  };
  for (let i = 0; i < 3; i++) {
    const gh = mkGhost(1); g.add(gh);
    anim.push((t) => {
      const a = t * 0.5 + i * 2.1;
      gh.position.set(Math.cos(a) * 8, 3 + Math.sin(t * 2 + i) * 0.6, -4 + Math.sin(a) * 6);
      gh.rotation.y = -a;
    });
  }
  // mesa con calabaza ENCIMA y fantasma DEBAJO
  box(2.4, 0.15, 1.4, M('#6b3d22'), 6, 1.35, 1.2, g);
  for (const [x, z] of [[-1, -0.55], [1, -0.55], [-1, 0.55], [1, 0.55]]) cyl(0.07, 0.07, 1.1, M('#6b3d22'), 6 + x, 0.8, 1.2 + z, g, 6);
  const small = mkGhost(0.45); small.position.set(6, 0.3, 1.2); g.add(small);
  anim.push((t) => { small.position.x = 6 + Math.sin(t * 1.5) * 0.5; });
  C.push([6, 1.2, 1.3]);
  // calabazas
  const pump = (x, y, z, s = 1) => {
    const p = sph(0.6 * s, new THREE.MeshStandardMaterial({ color: '#ff8a1c', emissive: '#ff5a00', emissiveIntensity: 0.35, roughness: 0.6 }), x, y + 0.45 * s, z, g, 16);
    p.scale.y = 0.75;
    cyl(0.06 * s, 0.08 * s, 0.3 * s, M('#3f8f3f'), x, y + 0.95 * s, z, g, 6);
  };
  pump(6, 1.43, 1.2, 0.6); pump(-5, 0.25, -2.5); pump(-3.8, 0.25, -3.3, 0.7); pump(4.5, 0.25, -3.8, 0.8);
  C.push([-5, -2.5, 0.7]);
  // lápidas y árboles secos
  for (const [x, z] of [[-7, 0], [-8.5, 2.3], [-5.8, 2.8]]) {
    box(0.9, 1.1, 0.25, M('#9a93ad'), x, 0.8, z, g);
    const top = cyl(0.45, 0.45, 0.25, M('#9a93ad'), x, 1.35, z, g, 16); top.rotation.x = Math.PI / 2;
    C.push([x, z, 0.6]);
  }
  for (const [x, z] of [[8, -4], [-8, -5]]) {
    cyl(0.2, 0.35, 4, M('#3a2a2a'), x, 2.2, z, g, 8);
    for (let k = 0; k < 3; k++) { const b = cyl(0.06, 0.12, 1.6, M('#3a2a2a'), x + (k - 1) * 0.5, 3.4 + k * 0.4, z, g, 6); b.rotation.z = (k - 1) * 0.9 + 0.2; }
    C.push([x, z, 0.5]);
  }
  // murciélagos
  for (let i = 0; i < 3; i++) {
    const bat = new THREE.Group();
    sph(0.18, M('#15121f'), 0, 0, 0, bat, 8);
    const wings = [-1, 1].map((s) => { const w = mesh(new THREE.ConeGeometry(0.25, 0.7, 3), M('#15121f'), s * 0.35, 0, 0, bat, false); w.rotation.z = s * Math.PI / 2; return w; });
    g.add(bat);
    anim.push((t) => {
      const a = t * 1.6 + i * 2.1;
      bat.position.set(2.3 + Math.cos(a) * 2.5, 11 + Math.sin(t * 3 + i) * 0.5, -8 + Math.sin(a) * 2.5);
      wings.forEach((w, k) => { w.rotation.x = Math.sin(t * 18) * 0.7 * (k ? 1 : -1); });
    });
  }
}

function buildJungle(g, C, anim) {
  const stone = ['#8fa66e', '#9db47a', '#a9bf86', '#b5c992'];
  [8, 6.4, 4.8, 3.2].forEach((w, k) => box(w, 1.3, w, M(stone[k]), 0, 0.9 + k * 1.3, -7.5, g));
  box(2.2, 1.8, 2.2, M('#c2d39e'), 0, 6.9, -7.5, g);
  box(1, 1.2, 0.1, M('#1d2a14'), 0, 6.6, -6.38, g);
  const ramp = box(1.6, 0.2, 6.2, M('#c8d6a6'), 0, 3.1, -4.9, g); ramp.rotation.x = 0.85;
  const eye = sph(0.35, new THREE.MeshStandardMaterial({ color: '#7dff6b', emissive: '#3dff4a', emissiveIntensity: 1.5 }), 0, 8.3, -7.5, g, 12);
  anim.push((t) => { eye.material.emissiveIntensity = 1 + Math.sin(t * 2) * 0.6; eye.position.y = 8.3 + Math.sin(t * 1.5) * 0.15; });
  C.push([0, -7.5, 4.6], [0, -4, 1]);
  // tienda de exploradores
  const tent = cyl(0.01, 2, 2.6, M('#d9c48f'), 7, 1.55, -1, g, 4); tent.rotation.y = Math.PI / 4;
  box(0.9, 1.3, 0.05, M('#5b4a2e'), 7, 0.9, 0.42, g);
  C.push([7, -1, 1.8]);
  // hoguera
  const fx = 5.5; const fz = 4;
  for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; sph(0.25, M('#8e86a8'), fx + Math.cos(a) * 0.8, 0.35, fz + Math.sin(a) * 0.8, g, 8); }
  for (const r of [0.5, -0.5]) { const l = cyl(0.12, 0.12, 1.3, M('#6b3d22'), fx, 0.4, fz, g, 6); l.rotation.set(Math.PI / 2, 0, r); }
  const flames = [0, 1, 2].map((k) => mesh(new THREE.ConeGeometry(0.3 - k * 0.07, 1 - k * 0.2, 8), new THREE.MeshStandardMaterial({ color: ['#ff6a00', '#ffb02e', '#fff3a0'][k], emissive: ['#ff3a00', '#ff8a00', '#ffd84a'][k], emissiveIntensity: 2, transparent: true, opacity: 0.9 }), fx, 0.8, fz, g, false));
  anim.push((t) => flames.forEach((f, k) => { f.scale.y = 1 + Math.sin(t * 12 + k * 2) * 0.25; f.rotation.y = t * (1 + k); }));
  C.push([fx, fz, 1.1]);
  palm(-7, -3, g, 0.3); C.push([-7, -3, 0.6]);
  palm(8.5, -6, g, -0.35); C.push([8.5, -6, 0.6]);
  palm(-8.5, 2, g, 0.2); C.push([-8.5, 2, 0.6]);
  for (const [x, z, s] of [[-5, -5.5, 1.3], [5, -5, 1.1], [-4, 3.5, 0.9], [9.5, 1.5, 1]]) {
    sph(s, M('#2f8f3f'), x, s * 0.7, z, g, 14); sph(s * 0.7, M('#3fbf5f'), x + s * 0.6, s * 0.6, z + 0.3, g, 12);
    C.push([x, z, s]);
  }
  // loro volando
  const parrot = new THREE.Group();
  sph(0.3, M('#ff3b3b'), 0, 0, 0, parrot, 10).scale.z = 1.6;
  sph(0.2, M('#ff3b3b'), 0, 0.2, 0.4, parrot, 10);
  cyl(0.01, 0.08, 0.2, M('#ffd23f'), 0, 0.15, 0.62, parrot, 6).rotation.x = Math.PI / 2;
  const pw = [-1, 1].map((s) => { const w = box(0.7, 0.05, 0.35, M(s < 0 ? '#3fb6ff' : '#ffd23f'), s * 0.45, 0.05, 0, parrot); return w; });
  g.add(parrot);
  anim.push((t) => {
    const a = t * 0.9;
    parrot.position.set(Math.cos(a) * 7, 9 + Math.sin(t * 2) * 0.8, -6 + Math.sin(a) * 5);
    parrot.rotation.y = -a;
    pw[0].rotation.z = Math.sin(t * 14) * 0.6; pw[1].rotation.z = -Math.sin(t * 14) * 0.6;
  });
}

function buildHero(g, C, anim) {
  const metal = M('#e9eef7', { metalness: 0.4, roughness: 0.3 });
  cyl(3, 3.4, 11, metal, 0, 5.75, -8, g, 32);
  const ringM = new THREE.MeshStandardMaterial({ color: '#ff7a2f', emissive: '#ff5a00', emissiveIntensity: 1.4 });
  for (const y of [3.5, 7, 10.5]) { const r = mesh(new THREE.TorusGeometry(3.15, 0.15, 8, 48), ringM, 0, y, -8, g, false); r.rotation.x = Math.PI / 2; }
  cyl(0.05, 0.1, 3, M('#9aa3b5'), 0, 12.7, -8, g, 6);
  const tip = sph(0.25, new THREE.MeshStandardMaterial({ color: '#ff3b3b', emissive: '#ff0000', emissiveIntensity: 2 }), 0, 14.3, -8, g, 10);
  anim.push((t) => { tip.material.emissiveIntensity = Math.sin(t * 4) > 0 ? 2.5 : 0.2; });
  const logo = mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshStandardMaterial({ map: textTexture('⚡', { w: 256, h: 256, bg: '#ffd23f', fg: '#ff3b3b', size: 190, radius: 128 }) }), 0, 7, -4.7, g, false);
  void logo;
  box(1.8, 2.6, 0.2, M('#2a1a5e'), 0, 1.55, -4.75, g);
  C.push([0, -8, 3.6]);
  // héroe volando con capa
  const flyer = createBean({ color: '#3fb6ff', acc: 'none' });
  const cape = mesh(new THREE.PlaneGeometry(1.1, 1.6), new THREE.MeshStandardMaterial({ color: '#ff3b3b', side: THREE.DoubleSide }), 0, 1.0, -0.62, flyer.root, false);
  cape.rotation.x = 0.15;
  const fly = new THREE.Group(); fly.add(flyer.root); flyer.root.rotation.x = Math.PI / 2.4; flyer.root.position.y = -1;
  g.add(fly);
  anim.push((t) => {
    const a = t * 0.7;
    fly.position.set(Math.cos(a) * 6.5, 9 + Math.sin(t * 2) * 0.6, -8 + Math.sin(a) * 6.5);
    fly.rotation.y = -a + Math.PI;
    cape.rotation.x = 0.3 + Math.sin(t * 10) * 0.15;
    flyer.animate(0.016, 0, t, 1);
  });
  // levantador de pesas
  const lifter = createBean({ color: '#ff7a2f', acc: 'none' });
  lifter.root.position.set(6.5, 0.25, 0.5); lifter.root.rotation.y = -0.6; g.add(lifter.root);
  const barbell = new THREE.Group();
  const bar = cyl(0.06, 0.06, 2.6, M('#9aa3b5', { metalness: 0.8 }), 0, 0, 0, barbell, 8); bar.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { const d = cyl(0.45, 0.45, 0.2, M('#2a1a5e'), s * 1.1, 0, 0, barbell, 16); d.rotation.z = Math.PI / 2; }
  barbell.position.set(6.5, 2.7, 0.5); barbell.rotation.y = -0.6; g.add(barbell);
  anim.push((t) => { const up = Math.max(0, Math.sin(t * 2)); barbell.position.y = 2.1 + up * 0.8; lifter.animate(0.016, 0, t, up > 0.3 ? 1 : 0); });
  C.push([6.5, 0.5, 1]);
  // focos
  for (const [x, z, k] of [[-7.5, -5, 0], [7.5, -6.5, 1]]) {
    cyl(0.5, 0.6, 0.6, M('#2a1a5e'), x, 0.55, z, g, 12);
    const beam = mesh(new THREE.CylinderGeometry(1.4, 0.35, 12, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }), 0, 6, 0, null, false);
    const pivot = new THREE.Group(); pivot.position.set(x, 0.8, z); pivot.add(beam); g.add(pivot);
    anim.push((t) => { pivot.rotation.z = Math.sin(t * 0.8 + k * 2) * 0.35; pivot.rotation.x = Math.cos(t * 0.6 + k) * 0.2; });
    C.push([x, z, 0.7]);
  }
  // conos de entrenamiento
  for (let i = 0; i < 4; i++) { cyl(0.05, 0.35, 0.8, M(i % 2 ? '#ff7a2f' : '#ffffff'), -6 + (i % 2) * 0.6, 0.65, -1 + i * 1.3, g, 12); }
  C.push([-5.7, 1, 1.2]);
}

const BUILDERS = { past: buildPast, future: buildFuture, treasure: buildTreasure, market: buildMarket, farm: buildFarm, circus: buildCircus, stadium: buildStadium, haunted: buildHaunted, jungle: buildJungle, hero: buildHero };
export const PLATFORM = { past: '#b6e38c', future: '#26285c', treasure: '#ffe09a', market: '#ffc8a8', farm: '#c9ef8a', circus: '#ffd6e6', stadium: '#5fcf6a', haunted: '#3a2a55', jungle: '#7fbf5f', hero: '#c9d3e6' };

// ---------- piezas de ciudad ----------
function roundedRect(hx, hz, r) {
  const s = new THREE.Shape();
  s.moveTo(-hx + r, -hz); s.lineTo(hx - r, -hz); s.quadraticCurveTo(hx, -hz, hx, -hz + r);
  s.lineTo(hx, hz - r); s.quadraticCurveTo(hx, hz, hx - r, hz); s.lineTo(-hx + r, hz);
  s.quadraticCurveTo(-hx, hz, -hx, hz - r); s.lineTo(-hx, -hz + r); s.quadraticCurveTo(-hx, -hz, -hx + r, -hz);
  return s;
}
function slab(hx, hz, r, depth, mats, y, parent) {
  const g = new THREE.ExtrudeGeometry(roundedRect(hx, hz, r), { depth, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 3, curveSegments: 10 });
  const m = new THREE.Mesh(g, mats);
  m.rotation.x = Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  parent.add(m);
  return m;
}

function buildCar(color, bus = false) {
  const g = new THREE.Group();
  const L = bus ? 7 : 3.4; const W = bus ? 2.4 : 1.9;
  rbox(W, bus ? 1.6 : 0.9, L, 0.3, M(color, { roughness: 0.35 }), 0, bus ? 1.4 : 0.85, 0, g);
  if (bus) {
    rbox(W - 0.05, 1.1, L - 0.4, 0.25, M(color, { roughness: 0.35 }), 0, 2.6, -0.1, g);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) box(0.05, 0.6, 0.9, M('#2a3a6e', { roughness: 0.1 }), s * (W / 2), 2.6, -2.6 + i * 1.25, g);
    box(W - 0.3, 0.7, 0.05, M('#2a3a6e', { roughness: 0.1 }), 0, 2.6, L / 2 - 0.3, g);
    box(W + 0.02, 0.18, L - 0.2, M('#2a1a5e'), 0, 1.75, 0, g);
    const sign = mesh(new THREE.PlaneGeometry(1.6, 0.35), new THREE.MeshBasicMaterial({ map: textTexture('SCHOOL', { w: 256, h: 64, bg: '#2a1a5e', fg: '#ffd23f', size: 44, radius: 8 }) }), 0, 3.3, L / 2 - 0.25, g, false);
    void sign;
  } else {
    rbox(1.6, 0.75, 1.8, 0.3, M('#ffffff', { roughness: 0.3 }), 0, 1.55, -0.2, g);
    box(1.62, 0.45, 1.2, M('#2a3a6e', { roughness: 0.1, metalness: 0.3 }), 0, 1.58, -0.2, g);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = cyl(0.42, 0.42, 0.35, M('#24223a'), sx * (W / 2 - 0.05), 0.42, sz * (L / 2 - 0.75), g, 16);
    w.rotation.z = Math.PI / 2;
    const hub = cyl(0.18, 0.18, 0.37, M('#e9eef7', { metalness: 0.6 }), sx * (W / 2 - 0.05), 0.42, sz * (L / 2 - 0.75), g, 10);
    hub.rotation.z = Math.PI / 2;
  }
  for (const s of [-1, 1]) {
    sph(0.15, new THREE.MeshStandardMaterial({ color: '#fff7c0', emissive: '#ffe680', emissiveIntensity: 1.5 }), s * (W / 2 - 0.35), bus ? 1.3 : 0.95, L / 2, g, 10);
    sph(0.12, new THREE.MeshStandardMaterial({ color: '#ff4040', emissive: '#ff2020', emissiveIntensity: 1 }), s * (W / 2 - 0.3), bus ? 1.3 : 0.95, -L / 2, g, 10);
  }
  return g;
}

// recorrido rectangular (sentido horario visto desde arriba) con carril a la derecha
function rectPath(hx, hz, s, lane) {
  const ax = hx - lane; const az = hz - lane;
  const per = 4 * (ax + az);
  let d = ((s % per) + per) % per;
  if (d < 2 * ax) return [-ax + d, -az, 1, 0]; d -= 2 * ax;
  if (d < 2 * az) return [ax, -az + d, 0, 1]; d -= 2 * az;
  if (d < 2 * ax) return [ax - d, az, -1, 0]; d -= 2 * ax;
  return [-ax, az - d, 0, -1];
}

function buildCampus(g, C, B, anim) {
  // edificio principal
  const brick = M('#ff9f8f'); const trim = M('#fff4e6'); const roofM = M('#7a4ee8');
  rbox(44, 9, 8, 0.4, brick, 0, 4.75, -8.5, g);
  rbox(45, 0.8, 9, 0.3, roofM, 0, 9.6, -8.5, g);
  box(44.2, 0.4, 8.2, trim, 0, 4.9, -8.5, g);
  const winMat = new THREE.MeshStandardMaterial({ color: '#9fe8ff', emissive: '#4fb6ff', emissiveIntensity: 0.35, roughness: 0.1 });
  for (let i = 0; i < 10; i++) {
    const x = -19 + i * 4.2; if (Math.abs(x) < 5) continue;
    for (const y of [2.6, 7]) { box(2.2, 2, 0.1, winMat, x, y, -4.45, g); box(2.5, 0.25, 0.3, trim, x, y - 1.15, -4.4, g); }
  }
  // torre del reloj
  rbox(8, 16, 7, 0.3, M('#ffb3a7'), 0, 8.25, -8.5, g);
  const tRoof = cyl(0.01, 6, 5, roofM, 0, 18.7, -8.5, g, 4); tRoof.rotation.y = Math.PI / 4;
  cyl(0.08, 0.08, 2, M('#ffd23f'), 0, 22.2, -8.5, g, 6);
  sph(0.35, M('#ffd23f', { metalness: 0.6, roughness: 0.3 }), 0, 23.3, -8.5, g, 12);
  const face = mesh(new THREE.CircleGeometry(2.3, 40), M('#fff8e8'), 0, 13.2, -4.94, g, false);
  void face;
  const rim = mesh(new THREE.TorusGeometry(2.3, 0.2, 8, 40), M('#ffd23f', { metalness: 0.5, roughness: 0.3 }), 0, 13.2, -4.9, g, false);
  void rim;
  const handH = new THREE.Group(); const handM = new THREE.Group();
  box(0.22, 1.2, 0.05, M('#2a1a5e'), 0, 0.6, 0, handH); box(0.14, 1.9, 0.05, M('#2a1a5e'), 0, 0.95, 0, handM);
  handH.position.set(0, 13.2, -4.85); handM.position.set(0, 13.2, -4.82); g.add(handH, handM);
  anim.push(() => { const d = new Date(); const m = d.getMinutes() + d.getSeconds() / 60; handM.rotation.z = -(m / 60) * Math.PI * 2; handH.rotation.z = -(((d.getHours() % 12) + m / 60) / 12) * Math.PI * 2; });
  // pórtico con columnas, escalones, puerta y rótulo
  for (const x of [-4.5, -1.5, 1.5, 4.5]) cyl(0.45, 0.5, 5.5, trim, x, 3, -3.6, g, 16);
  const pedi = cyl(5.6, 5.6, 1.4, trim, 0, 6.6, -3.6, g, 3); pedi.rotation.x = -Math.PI / 2; pedi.scale.z = 0.35; pedi.rotation.z = 0;
  for (let i = 0; i < 3; i++) box(11 - i * 0.6, 0.25, 1.4 - i * 0.35, trim, 0, 0.37 + i * 0.25, -2.6 - i * 0.35, g);
  box(3, 4, 0.2, M('#6b3d22'), 0, 2.5, -4.45, g);
  const signM = new THREE.MeshStandardMaterial({ map: textTexture(['ENGLISH PARTY SCHOOL'], { w: 1024, h: 160, bg: '#2a1a5e', fg: '#ffd23f', size: 92, radius: 30 }) });
  mesh(new THREE.PlaneGeometry(13, 2), signM, 0, 10.6 + 0.5, -4.3, g, false);
  B.push([-22.5, -12.6, 22.5, -4.2]);
  // asta con bandera
  cyl(0.1, 0.12, 9, M('#e9eef7', { metalness: 0.5 }), 12, 4.75, 2, g, 8);
  const flag = mesh(new THREE.PlaneGeometry(2.4, 1.5, 12, 1), new THREE.MeshStandardMaterial({ map: stripes('#ff3fa4', '#ffd23f', 6), side: THREE.DoubleSide }), 13.2, 8.4, 2, g);
  const fp = flag.geometry.attributes.position; const base = fp.array.slice();
  anim.push((t) => { for (let i = 0; i < fp.count; i++) { const x = base[i * 3]; fp.array[i * 3 + 2] = Math.sin(t * 4 + x * 2.5) * 0.18 * (x + 1.2); } fp.needsUpdate = true; });
  C.push([12, 2, 0.4]);
  // patio: suelo, bancos, árboles en maceteros, canasta
  box(30, 0.04, 12, M('#ffe9c7'), 0, 0.27, 5, g).castShadow = false;
  for (const x of [-9, 9]) {
    const b = new THREE.Group();
    rbox(3, 0.18, 0.8, 0.08, M('#c08552'), 0, 0.75, 0, b); rbox(3, 0.7, 0.15, 0.06, M('#c08552'), 0, 1.15, -0.38, b);
    for (const s of [-1, 1]) box(0.15, 0.7, 0.8, M('#4a4a6a'), s * 1.3, 0.45, 0, b);
    b.position.set(x, 0.25, 9.5); b.rotation.y = Math.PI; g.add(b);
    C.push([x - 1, 9.5, 0.6], [x + 1, 9.5, 0.6]);
  }
  for (const [x, z] of [[-17, 4], [17, 4], [-28, 8], [28, 8]]) {
    rbox(2.2, 1, 2.2, 0.2, M('#ffffff'), x, 0.75, z, g);
    cyl(0.2, 0.25, 1.6, M('#a8673f'), x, 2, z, g, 8);
    sph(1.6, M(['#7ee36b', '#ff9ccf'][(x > 0) * 1]), x, 3.6, z, g, 18);
    C.push([x, z, 1.4]);
  }
  // canasta de baloncesto
  cyl(0.12, 0.12, 4, M('#9aa3b5', { metalness: 0.5 }), 26, 2.25, -1, g, 8);
  box(1.8, 1.2, 0.1, M('#ffffff'), 26, 4.3, -0.5, g);
  const hoop = mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 20), M('#ff7a2f'), 26, 3.8, 0.1, g); hoop.rotation.x = Math.PI / 2;
  C.push([26, -1, 0.4]);
  // autobús escolar aparcado
  const bus = buildCar('#ffd23f', true); bus.position.set(-26, 0.25, -1); bus.rotation.y = 0.15; g.add(bus);
  C.push([-26, 1.5, 1.6], [-26, -1, 1.6], [-26, -3.5, 1.6]);
}

function plotWalls(g, color, half, gate, local) {
  const wall = M(color, { roughness: 0.5 }); const cap = M('#ffffff', { roughness: 0.5 });
  const seg = (x0, z0, x1, z1) => {
    const w = Math.abs(x1 - x0) || 0.5; const d = Math.abs(z1 - z0) || 0.5;
    rbox(w, 0.9, d, 0.15, wall, (x0 + x1) / 2, 0.7, (z0 + z1) / 2, g);
    rbox(w + 0.1, 0.15, d + 0.1, 0.06, cap, (x0 + x1) / 2, 1.2, (z0 + z1) / 2, g);
    local.push([Math.min(x0, x1) - (x0 === x1 ? 0.25 : 0), Math.min(z0, z1) - (z0 === z1 ? 0.25 : 0), Math.max(x0, x1) + (x0 === x1 ? 0.25 : 0), Math.max(z0, z1) + (z0 === z1 ? 0.25 : 0), WALL_H]);
  };
  seg(-half, -half, half, -half);
  seg(-half, -half, -half, half);
  seg(half, -half, half, half);
  seg(-half, half, -gate, half);
  seg(gate, half, half, half);
}

function gateArch(g, z, text, color, C) {
  for (const s of [-1, 1]) {
    rbox(0.9, 4.4, 0.9, 0.2, M(color, { roughness: 0.4 }), s * 4.7, 2.45, z, g);
    sph(0.55, M('#ffd23f', { roughness: 0.3 }), s * 4.7, 4.95, z, g, 14);
    C.push([s * 4.7, z, 0.7]);
  }
  rbox(10.2, 1.3, 0.5, 0.2, M(color, { roughness: 0.4 }), 0, 4.4, z, g);
  const tex = textTexture(text, { w: 1024, h: 128, bg: '#ffffff', fg: color, size: 76, radius: 20 });
  for (const s of [1, -1]) {
    const p = mesh(new THREE.PlaneGeometry(9.4, 1.15), new THREE.MeshStandardMaterial({ map: tex }), 0, 4.4, z + s * 0.27, g, false);
    if (s < 0) p.rotation.y = Math.PI;
  }
}

function instTrees(scene, list, C) {
  const n = list.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.28, 1.8, 8), M('#a8673f'), n);
  const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ roughness: 0.75 }), n * 2);
  const pot = new THREE.InstancedMesh(new RoundedBoxGeometry(1.6, 0.7, 1.6, 2, 0.15), M('#ffffff'), n);
  trunk.castShadow = crown.castShadow = true; crown.receiveShadow = true;
  const d = new THREE.Object3D();
  const tones = ['#7ee36b', '#5fd38a', '#ff9ccf', '#c69cff', '#9be86a', '#ffcf6b'].map((c) => new THREE.Color(c));
  list.forEach(([x, z, y0 = 0.25, s = 1], i) => {
    d.position.set(x, y0 + 0.35, z); d.scale.set(1, 1, 1); d.rotation.set(0, 0, 0); d.updateMatrix(); pot.setMatrixAt(i, d.matrix);
    d.position.set(x, y0 + 1.4, z); d.updateMatrix(); trunk.setMatrixAt(i, d.matrix);
    const c = tones[i % tones.length];
    d.position.set(x, y0 + 2.9 * s, z); d.scale.setScalar(1.3 * s); d.updateMatrix(); crown.setMatrixAt(i * 2, d.matrix); crown.setColorAt(i * 2, c);
    d.position.set(x + 0.5, y0 + 3.6 * s, z + 0.2); d.scale.setScalar(0.85 * s); d.updateMatrix(); crown.setMatrixAt(i * 2 + 1, d.matrix); crown.setColorAt(i * 2 + 1, c);
    C.push({ x, z, r: 0.9 });
  });
  scene.add(trunk, crown, pot);
}

// ---------- mundo ----------
export function buildWorld(scene, renderer) {
  const anim = [];
  const colliders = [];
  const boxes = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  if (renderer) {
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.5;
  }

  // cielo degradado
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#2a1590') }, mid: { value: new THREE.Color('#7151ff') }, bot: { value: new THREE.Color('#f2a8ff') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.8, h)) : mix(bot, mid, smoothstep(-0.35, 0.15, h)); gl_FragColor = vec4(c, 1.0); }',
  }));
  scene.add(sky);
  scene.fog = new THREE.Fog('#b58cff', 170, 520);
  const sp = []; for (let i = 0; i < 700; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(460 + Math.random() * 80); if (v.y > -40) sp.push(v.x, Math.abs(v.y), v.z); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.8, fog: false, transparent: true, opacity: 0.85 })));

  // ---- isla: losa de ciudad + capas de roca flotante ----
  const city = new THREE.Group(); scene.add(city);
  slab(HX, HZ, 10, 2.5, [M('#8fe38a'), M('#ff9ccf')], -0.5, city);
  slab(HX - 4, HZ - 4, 9, 6, [M('#ffb08a'), M('#ffb08a', { roughness: 0.95 })], -3.6, city);
  slab(HX - 14, HZ - 12, 8, 8, [M('#f59a7a'), M('#f59a7a', { roughness: 0.95 })], -10.5, city);
  slab(HX - 30, HZ - 26, 7, 10, [M('#e8876f'), M('#e8876f', { roughness: 0.95 })], -19.5, city);
  slab(HX - 52, HZ - 44, 6, 12, [M('#d9776a'), M('#d9776a', { roughness: 0.95 })], -30.5, city);
  // asfalto
  const asphalt = mesh(new THREE.ShapeGeometry(roundedRect(ROADS_X[4] + ROAD_HALF, ROADS_Z[3] + ROAD_HALF, 6)), M('#6d6a8c', { roughness: 0.9 }), 0, 0.02, 0, city, false);
  asphalt.rotation.x = -Math.PI / 2;
  // borde: barandilla hinchable
  const railM = M('#ff5fae', { roughness: 0.35 });
  for (const [x, z, len, alongX] of [[0, -HZ + 0.6, 2 * HX - 20, true], [0, HZ - 0.6, 2 * HX - 20, true], [-HX + 0.6, 0, 2 * HZ - 20, false], [HX - 0.6, 0, 2 * HZ - 20, false]]) {
    const r = cyl(0.55, 0.55, len, railM, x, 0.75, z, city, 16);
    if (alongX) r.rotation.z = Math.PI / 2; else r.rotation.x = Math.PI / 2;
  }
  for (const [x, z, a] of [[HX - 10.6, HZ - 10.6, 0], [-HX + 10.6, HZ - 10.6, Math.PI / 2], [-HX + 10.6, -HZ + 10.6, Math.PI], [HX - 10.6, -HZ + 10.6, -Math.PI / 2]]) {
    const tq = mesh(new THREE.TorusGeometry(10, 0.55, 12, 24, Math.PI / 2), railM, x, 0.75, z, city); tq.rotation.set(Math.PI / 2, 0, a);
  }
  const postGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.6, 12);
  const posts = new THREE.InstancedMesh(postGeo, new THREE.MeshStandardMaterial({ roughness: 0.35 }), 80);
  const dd = new THREE.Object3D(); let pi = 0;
  for (let i = 0; i < 80; i++) {
    const t = i / 80; const per = 2 * (2 * HX + 2 * HZ); let d = t * per; let x; let z;
    if (d < 2 * HX) { x = -HX + d; z = -HZ; } else if ((d -= 2 * HX) < 2 * HZ) { x = HX; z = -HZ + d; } else if ((d -= 2 * HZ) < 2 * HX) { x = HX - d; z = HZ; } else { d -= 2 * HX; x = -HX; z = HZ - d; }
    x = Math.max(-HX + 0.6, Math.min(HX - 0.6, x)); z = Math.max(-HZ + 0.6, Math.min(HZ - 0.6, z));
    if (Math.abs(x) > HX - 9 && Math.abs(z) > HZ - 9) continue;
    dd.position.set(x, 0.8, z); dd.updateMatrix(); posts.setMatrixAt(pi, dd.matrix); posts.setColorAt(pi, new THREE.Color(pi % 2 ? '#ffd23f' : '#3fb6ff')); pi++;
  }
  posts.count = pi; posts.castShadow = true; city.add(posts);

  // ---- marcas viales: líneas discontinuas y pasos de cebra ----
  const dashes = []; const zebra = [];
  const isNode = (x, z) => ROADS_X.includes(x) && ROADS_Z.includes(z);
  for (const z of ROADS_Z) for (let x = ROADS_X[0]; x < ROADS_X[4]; x += 3.5) if (!ROADS_X.some((rx) => Math.abs(rx - x) < 6.5)) dashes.push([x, z, 0]);
  for (const x of ROADS_X) for (let z = ROADS_Z[0]; z < ROADS_Z[3]; z += 3.5) if (!ROADS_Z.some((rz) => Math.abs(rz - z) < 6.5) && !(x === 0 && z > -19 && z < 19)) dashes.push([x, z, 1]);
  for (const x of ROADS_X) for (const z of ROADS_Z) {
    if (!isNode(x, z)) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx * 6; const nz = z + dz * 6;
      if (Math.abs(nx) > ROADS_X[4] || Math.abs(nz) > ROADS_Z[3]) continue;
      if (x === 0 && ((z === -19 && dz > 0) || (z === 19 && dz < 0))) continue;
      for (let k = -3; k <= 3; k++) zebra.push(dx ? [nx, z + k * 1.1, 1] : [x + k * 1.1, nz, 0]);
    }
  }
  const dashMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.03, 0.25), M('#ffd23f', { roughness: 0.6 }), dashes.length);
  dashes.forEach(([x, z, r], i) => { dd.position.set(x, 0.05, z); dd.rotation.set(0, r ? Math.PI / 2 : 0, 0); dd.scale.set(1, 1, 1); dd.updateMatrix(); dashMesh.setMatrixAt(i, dd.matrix); });
  const zebraMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.03, 0.55), M('#ffffff', { roughness: 0.6 }), zebra.length);
  zebra.forEach(([x, z, r], i) => { dd.position.set(x, 0.05, z); dd.rotation.set(0, r ? Math.PI / 2 : 0, 0); dd.updateMatrix(); zebraMesh.setMatrixAt(i, dd.matrix); });
  dashMesh.receiveShadow = zebraMesh.receiveShadow = true;
  city.add(dashMesh, zebraMesh);

  // ---- manzanas: acera + parcela ----
  const sidewalk = M('#efe9ff', { roughness: 0.7 });
  const blockBase = (x, z, hx, hz, col) => {
    rbox(hx * 2, 0.4, hz * 2, 0.25, sidewalk, x, 0, z, city);
    rbox(hx * 2 - 3, 0.5, hz * 2 - 3, 0.2, M(col), x, 0, z, city);
  };

  // ---- colegio central ----
  blockBase(0, 0, CAMPUS.hx, CAMPUS.hz, '#bfeaa6');
  const campus = new THREE.Group(); scene.add(campus);
  const cLocal = []; const cBoxes = [];
  buildCampus(campus, cLocal, cBoxes, anim);
  const fence = (x0, z0, x1, z1) => { const w = Math.abs(x1 - x0) || 0.4; const d = Math.abs(z1 - z0) || 0.4; rbox(w, 0.8, d, 0.15, M('#7a4ee8', { roughness: 0.5 }), (x0 + x1) / 2, 0.65, (z0 + z1) / 2, campus); boxes.push([Math.min(x0, x1) - 0.2, Math.min(z0, z1) - 0.2, Math.max(x0, x1) + 0.2, Math.max(z0, z1) + 0.2, WALL_H]); };
  fence(-32.5, -13.5, 32.5, -13.5); fence(-32.5, -13.5, -32.5, 13.5); fence(32.5, -13.5, 32.5, 13.5);
  fence(-32.5, 13.5, -6, 13.5); fence(6, 13.5, 32.5, 13.5);
  gateArch(campus, 13.5, '🏫 ENGLISH PARTY SCHOOL', '#7a4ee8', cLocal);
  for (const [x, z, r] of cLocal) colliders.push({ x, z, r });
  for (const b of cBoxes) boxes.push(b);
  const title = sign(['ENGLISH PARTY', 'walk · learn · compete'], '#ff3fa4', 13);
  title.position.set(0, 27, -8.5);
  scene.add(title);
  anim.push((t) => { title.position.y = 27 + Math.sin(t * 1.4) * 0.4; });

  // ---- aulas ----
  const zoneFx = [];
  for (const zn of ZONES) {
    blockBase(zn.pos[0], zn.pos[1], 15, 15, PLATFORM[zn.id]);
    const g = new THREE.Group();
    g.position.set(zn.pos[0], 0, zn.pos[1]);
    g.rotation.y = Math.atan2(zn.face[0], zn.face[1]);
    scene.add(g);
    const pad = mesh(new THREE.RingGeometry(2.3, 3, 48), new THREE.MeshBasicMaterial({ color: zn.color, transparent: true, opacity: 0.9, side: THREE.DoubleSide }), 0, 0.28, 2, g, false);
    pad.rotation.x = -Math.PI / 2;
    const beam = mesh(new THREE.CylinderGeometry(2.65, 2.65, 3.5, 40, 1, true), new THREE.MeshBasicMaterial({ color: zn.color, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }), 0, 2, 2, g, false);
    zoneFx.push({ pad, beam });
    const local = []; const lbox = [];
    const extra = BUILDERS[zn.id](g, local, anim);
    if (extra) anim.push(extra);
    chalkboard(zn.board, g, -9.5, 6.5, 2.3);
    local.push([-9.5, 6.5, 1.2]);
    plotWalls(g, zn.color, 13.5, 4.2, lbox);
    gateArch(g, 13.5, `${zn.emoji} ${zn.name}`, zn.color, local);
    const s = sign(`${zn.emoji} ${zn.short}`, zn.color, 9);
    s.position.set(0, 15, -6);
    g.add(s);
    anim.push((t) => { s.position.y = 15 + Math.sin(t * 1.2 + zn.pos[0]) * 0.3; });
    g.updateMatrixWorld(true);
    for (const [lx, lz, r] of local) {
      const v = new THREE.Vector3(lx, 0, lz).applyMatrix4(g.matrixWorld);
      colliders.push({ x: v.x, z: v.z, r });
    }
    for (const [x0, z0, x1, z1, h] of lbox) {
      const a = new THREE.Vector3(x0, 0, z0).applyMatrix4(g.matrixWorld); const b = new THREE.Vector3(x1, 0, z1).applyMatrix4(g.matrixWorld);
      boxes.push([Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z), h]);
    }
  }
  // campus: cajas locales ya están en coordenadas de mundo (sin rotación)
  anim.push((t) => zoneFx.forEach(({ pad, beam }, i) => {
    const k = 1 + Math.sin(t * 2.5 + i) * 0.06;
    pad.scale.set(k, k, 1);
    beam.material.opacity = 0.1 + Math.sin(t * 2.5 + i) * 0.05;
  }));

  // ---- mobiliario urbano: farolas, árboles, semáforos ----
  const lamps = []; const trees = [];
  for (const b of [...ZONES.map((z) => ({ x: z.pos[0], z: z.pos[1], hx: 15, hz: 15, f: z.face })), { x: 0, z: 0, hx: 34, hz: 15, f: [0, 1] }]) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lamps.push([b.x + sx * (b.hx - 0.8), b.z + sz * (b.hz - 0.8)]);
    // árboles en mitad de los lados que no son la puerta
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (dx === b.f[0] && dz === b.f[1]) continue;
      if (b.hx > 20 && dx === 0) { for (const ox of [-20, 0, 20]) trees.push([b.x + ox, b.z + dz * (b.hz - 0.8), 0.2, 0.75]); continue; }
      trees.push([b.x + dx * (b.hx - 0.8), b.z + dz * (b.hz - 0.8), 0.2, 0.75]);
    }
  }
  // franja verde del borde: árboles y bancos
  for (let x = -HX + 12; x <= HX - 12; x += 9) for (const z of [-HZ + 2.6, HZ - 2.6]) if (rnd() > 0.25) trees.push([x + rnd() * 2, z, 0, 0.9 + rnd() * 0.4]);
  for (let z = -HZ + 12; z <= HZ - 12; z += 9) for (const x of [-HX + 2.6, HX - 2.6]) if (rnd() > 0.25) trees.push([x, z + rnd() * 2, 0, 0.9 + rnd() * 0.4]);
  instTrees(city, trees, colliders);
  const poleM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 5, 8), M('#4a4a6a', { metalness: 0.4, roughness: 0.4 }), lamps.length);
  const headM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 14, 10), new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd27a', emissiveIntensity: 1.3 }), lamps.length);
  lamps.forEach(([x, z], i) => { dd.rotation.set(0, 0, 0); dd.scale.set(1, 1, 1); dd.position.set(x, 2.7, z); dd.updateMatrix(); poleM.setMatrixAt(i, dd.matrix); dd.position.set(x, 5.4, z); dd.updateMatrix(); headM.setMatrixAt(i, dd.matrix); colliders.push({ x, z, r: 0.3 }); });
  poleM.castShadow = true; city.add(poleM, headM);
  const lights = [];
  for (const x of [-38, 38]) for (const z of [-19, 19]) {
    const tl = new THREE.Group();
    cyl(0.12, 0.12, 4.5, M('#4a4a6a'), 0, 2.25, 0, tl, 8);
    rbox(0.7, 1.8, 0.6, 0.15, M('#2a2a3a'), 0, 4.6, 0, tl);
    const ls = ['#ff3b3b', '#ffd23f', '#3ddc84'].map((c, k) => sph(0.2, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.1 }), 0, 5.2 - k * 0.6, 0.3, tl, 10));
    tl.position.set(x + Math.sign(x) * -5.2, 0.2, z + Math.sign(z) * -5.2);
    tl.rotation.y = Math.atan2(-x, -z);
    city.add(tl); lights.push(ls);
    colliders.push({ x: tl.position.x, z: tl.position.z, r: 0.3 });
  }
  anim.push((t) => { const ph = Math.floor(t / 3) % 3; lights.forEach((ls, i) => ls.forEach((l, k) => { l.material.emissiveIntensity = ((ph + i) % 3) === k ? 2.2 : 0.08; })); });

  // ---- tráfico: coches que paran si te cruzas ----
  const cars = [];
  const carDefs = [
    { c: '#ff4f8b', hx: 76, hz: 57, s: 0, v: 9 }, { c: '#3fb6ff', hx: 76, hz: 57, s: 120, v: 8 }, { c: '#7ee36b', hx: 76, hz: 57, s: 260, v: 10 },
    { c: '#ffd23f', hx: 76, hz: 57, s: 400, v: 7, bus: true }, { c: '#b06bff', hx: 38, hz: 19, s: 0, v: 7 }, { c: '#ff7a2f', hx: 38, hz: 19, s: 110, v: 8 },
  ];
  for (const d of carDefs) { const car = buildCar(d.c, d.bus); city.add(car); cars.push({ ...d, car, speed: d.v }); }
  const updateCars = (dt, focus, others) => {
    for (const c of cars) {
      const [x, z, dx, dz] = rectPath(c.hx, c.hz, c.s, -2);
      let block = false;
      for (const p of [focus, ...others]) {
        const ox = p.x - x; const oz = p.z - z; const ahead = ox * dx + oz * dz; const side = Math.abs(ox * dz - oz * dx);
        if (ahead > 0 && ahead < (c.bus ? 7 : 5.5) && side < 2) { block = true; break; }
      }
      c.speed += ((block ? 0 : c.v) - c.speed) * Math.min(1, dt * (block ? 6 : 1.5));
      c.s += c.speed * dt;
      c.car.position.set(x, 0, z);
      c.car.rotation.y = Math.atan2(dx, dz);
    }
  };

  // ---- cielo: nubes, islitas y estrellas ----
  const floaters = [];
  for (let i = 0; i < 20; i++) {
    const c = cloud(rnd);
    const a = rnd() * Math.PI * 2; const r = 150 + rnd() * 140;
    c.position.set(Math.cos(a) * r, -30 + rnd() * 60, Math.sin(a) * r);
    c.userData = { a, r, s: 0.01 + rnd() * 0.02 };
    scene.add(c); floaters.push(c);
  }
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const r0 = 5 + rnd() * 6;
    mesh(new THREE.CylinderGeometry(r0, r0 - 0.5, 1.2, 24), M('#8fe38a'), 0, 0, 0, g, false);
    mesh(new THREE.ConeGeometry(r0 - 0.5, r0 * 1.6, 20), M('#ffb08a'), 0, -r0 * 0.8 - 0.6, 0, g, false).rotation.x = Math.PI;
    tree(0, 0, g, rnd).position.y = 0.6;
    const a = (i / 7) * Math.PI * 2 + 0.4; const r = 160 + rnd() * 60;
    g.position.set(Math.cos(a) * r, -10 + rnd() * 30, Math.sin(a) * r);
    const by = g.position.y;
    scene.add(g);
    anim.push((t) => { g.position.y = by + Math.sin(t * 0.6 + i) * 1.5; });
  }
  const sgeo = starShape();
  for (let i = 0; i < 16; i++) {
    const col = ['#ff5fd8', '#ffe14a', '#7af0ff'][i % 3];
    const st = mesh(sgeo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, roughness: 0.3 }), 0, 0, 0, scene, false);
    const a = rnd() * Math.PI * 2; const r = 130 + rnd() * 120;
    st.position.set(Math.cos(a) * r, 15 + rnd() * 50, Math.sin(a) * r);
    st.scale.setScalar(2 + rnd() * 3);
    const by = st.position.y;
    anim.push((t) => { st.rotation.y = t * 0.8 + i; st.rotation.z = Math.sin(t + i) * 0.3; st.position.y = by + Math.sin(t * 0.9 + i) * 2; });
  }

  // ---- luces ----
  scene.add(new THREE.HemisphereLight('#d9c8ff', '#ffcfa8', 1.3));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50; sc.near = 1; sc.far = 180;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const rimL = new THREE.DirectionalLight('#ff8fe0', 0.7);
  rimL.position.set(-40, 20, -40);
  scene.add(rimL);

  // colisión: círculos + cajas alineadas a ejes
  // air: altura del salto; las vallas bajas (h) no frenan si vas por encima
  function collide(p, r, air = 0) {
    for (const c of colliders) {
      const dx = p.x - c.x; const dz = p.z - c.z; const d = Math.hypot(dx, dz); const min = c.r + r;
      if (d < min && d > 1e-4) { p.x = c.x + (dx / d) * min; p.z = c.z + (dz / d) * min; }
    }
    for (const [x0, z0, x1, z1, h = Infinity] of boxes) {
      if (air > h) continue;
      if (p.x > x0 - r && p.x < x1 + r && p.z > z0 - r && p.z < z1 + r) {
        const pen = [p.x - (x0 - r), (x1 + r) - p.x, p.z - (z0 - r), (z1 + r) - p.z];
        const m = Math.min(...pen);
        if (m === pen[0]) p.x = x0 - r; else if (m === pen[1]) p.x = x1 + r; else if (m === pen[2]) p.z = z0 - r; else p.z = z1 + r;
      }
    }
  }

  return {
    colliders,
    boxes,
    collide,
    update(t, focus, camPos, dt = 0.016, others = []) {
      for (const f of anim) f(t);
      updateCars(dt, focus, others);
      if (camPos) { const d = camPos.distanceTo(title.position); title.material.opacity = Math.min(1, Math.max(0, (d - 14) / 10)); }
      for (const c of floaters) { c.userData.a += c.userData.s * 0.016; c.position.x = Math.cos(c.userData.a) * c.userData.r; c.position.z = Math.sin(c.userData.a) * c.userData.r; }
      sun.position.set(focus.x + 30, 70, focus.z + 25);
      sun.target.position.set(focus.x, 0, focus.z);
    },
  };
}
void ZONE_BY_ID;
