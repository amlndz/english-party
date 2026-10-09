// Personaje "bean" estilo Fall Guys + accesorios y skins detalladas
import * as THREE from 'three';

const H = 1.9;
const LIFT = 0.15;
const TOP = H + LIFT;
const TAU = Math.PI * 2;

let bodyGeo = null;
function beanGeometry() {
  if (bodyGeo) return bodyGeo;
  const pts = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(new THREE.Vector2(Math.max(rAt(t), 0.0001), t * H));
  }
  bodyGeo = new THREE.LatheGeometry(pts, 56);
  bodyGeo.computeVertexNormals();
  return bodyGeo;
}
function rAt(t) { return 0.64 * Math.pow(Math.sin(Math.PI * t), 0.5) * (1 - 0.11 * t); }
// radio del cuerpo a una altura absoluta
export function bodyR(y) { return rAt(Math.min(1, Math.max(0, (y - LIFT) / H))); }

// ---------- materiales y texturas ----------
const mats = new Map();
const S = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o }));
  return mats.get(k);
};
const metal = (color = '#dfe4ee') => S(color, { metalness: 0.85, roughness: 0.28 });
const goldM = () => S('#ffc933', { metalness: 0.9, roughness: 0.25 });
const glow = (color, i = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i });
const texCache = new Map();
function canvasTex(key, w, h, draw, repeat = [1, 1]) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  texCache.set(key, t);
  return t;
}
const starsTex = () => canvasTex('stars', 256, 256, (g, w, h) => {
  g.fillStyle = '#5b2fd6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffd23f'; g.font = '40px sans-serif';
  for (const [x, y] of [[30, 50], [150, 30], [90, 130], [210, 150], [40, 220], [170, 230]]) g.fillText('★', x, y);
  g.fillStyle = '#c9b6ff'; for (let i = 0; i < 30; i++) g.fillRect((i * 97) % w, (i * 53) % h, 3, 3);
}, [4, 2]);
const lacingTex = () => canvasTex('lacing', 128, 128, (g, w, h) => {
  g.fillStyle = '#a3172c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#6e0d1c'; for (let y = 0; y < h; y += 32) g.fillRect(0, y + 26, w, 6);
  g.fillStyle = '#ffd23f'; for (let x = 8; x < w; x += 32) for (let y = 4; y < h; y += 32) g.fillRect(x, y, 4, 22);
}, [8, 3]);
const bellyTex = () => canvasTex('belly', 64, 128, (g, w, h) => {
  g.fillStyle = '#ffe98a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e6c25a'; for (let y = 0; y < h; y += 26) g.fillRect(0, y, w, 4);
}, [1, 1]);
const skullTex = () => canvasTex('skull', 128, 128, (g) => { g.font = '100px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('☠', 64, 70); });
const crossTex = () => canvasTex('cross', 128, 160, (g, w, h) => {
  g.fillStyle = '#2f5bd6'; g.beginPath(); g.moveTo(8, 8); g.lineTo(w - 8, 8); g.lineTo(w - 8, h * 0.55); g.quadraticCurveTo(w / 2, h, w / 2, h - 4); g.quadraticCurveTo(w / 2, h, 8, h * 0.55); g.closePath(); g.fill();
  g.fillStyle = '#ffd23f'; g.fillRect(w / 2 - 9, 24, 18, 100); g.fillRect(24, 56, w - 48, 18);
});

function m(geo, mat, x = 0, y = 0, z = 0, parent = null) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  if (parent) parent.add(o);
  return o;
}
const sph = (r, mat, x, y, z, p, ws = 18) => m(new THREE.SphereGeometry(r, ws, Math.max(8, ws * 0.7 | 0)), mat, x, y, z, p);
const cyl = (rt, rb, h, mat, x, y, z, p, seg = 20) => m(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
const boxM = (w, h, d, mat, x, y, z, p) => m(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
const cap = (r, mat, y, parent, frac = 0.5) => m(new THREE.SphereGeometry(r, 32, 16, 0, TAU, 0, Math.PI * frac), mat, 0, y, 0, parent);
const ring = (y, off, tube, mat, p) => { const t = m(new THREE.TorusGeometry(bodyR(y) + off, tube, 10, 56), mat, 0, y, 0, p); t.rotation.x = Math.PI / 2; return t; };

// "funda" que sigue la silueta del cuerpo entre dos alturas (armaduras, delantales, túnicas…)
function shell(y0, y1, mat, { off = 0.03, flare = 0, phiStart = 0, phiLength = TAU, segs = 48 } = {}) {
  const pts = []; const N = 14;
  for (let i = 0; i <= N; i++) {
    const y = y0 + ((y1 - y0) * i) / N; const k = 1 - i / N;
    pts.push(new THREE.Vector2(bodyR(y) + off + flare * k * k, y));
  }
  const geo = new THREE.LatheGeometry(pts, segs, phiStart, phiLength);
  geo.computeVertexNormals();
  const mt = mat.clone(); mt.side = THREE.DoubleSide;
  return m(geo, mt);
}
const front = (half) => ({ phiStart: -half, phiLength: half * 2 });

// ---------- objetos de mano (agarre en el origen, hoja hacia +y) ----------
function sword(len = 1.0) {
  const g = new THREE.Group();
  const blade = boxM(0.09, len, 0.025, metal('#eef2f8'), 0, 0.2 + len / 2, 0, g);
  const tip = m(new THREE.ConeGeometry(0.064, 0.16, 4), metal('#eef2f8'), 0, 0.2 + len + 0.08, 0, g); tip.scale.z = 0.3;
  void blade;
  boxM(0.42, 0.07, 0.09, goldM(), 0, 0.16, 0, g);
  cyl(0.04, 0.04, 0.26, S('#5b3a22'), 0, 0, 0, g, 8);
  sph(0.06, goldM(), 0, -0.15, 0, g, 10);
  return g;
}
function cutlass() {
  const g = new THREE.Group();
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0, 0.6, 0.05), new THREE.Vector3(0, 0.95, 0.22));
  m(new THREE.TubeGeometry(curve, 12, 0.035, 6), metal('#eef2f8'), 0, 0, 0, g).scale.x = 1.6;
  const guard = m(new THREE.TorusGeometry(0.11, 0.025, 6, 16, Math.PI * 1.2), goldM(), 0, 0.02, 0.05, g); guard.rotation.y = Math.PI / 2;
  cyl(0.035, 0.035, 0.22, S('#3a2416'), 0, 0, 0, g, 8);
  return g;
}
function spoon() {
  const g = new THREE.Group();
  const wood = S('#c98d4f', { roughness: 0.7 });
  cyl(0.03, 0.035, 0.75, wood, 0, 0.3, 0, g, 8);
  sph(0.1, wood, 0, 0.72, 0, g, 14).scale.set(1, 1.35, 0.45);
  return g;
}
function staff() {
  const g = new THREE.Group();
  const wood = S('#7a4a26', { roughness: 0.8 });
  cyl(0.04, 0.05, 2.1, wood, 0, 0.3, 0, g, 8);
  const curl = m(new THREE.TorusGeometry(0.13, 0.04, 6, 16, Math.PI * 1.4), wood, 0, 1.4, 0, g); curl.rotation.z = -0.4;
  const orb = sph(0.13, glow('#7af0ff', 2), 0, 1.42, 0, g, 16);
  const sparks = [0, 1, 2].map((i) => m(new THREE.OctahedronGeometry(0.035), glow('#fff3a0', 2), 0, 1.42, 0, g));
  return { g, orb, sparks };
}
function shield() {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshStandardMaterial({ map: crossTex(), roughness: 0.4, metalness: 0.2 }));
  face.position.z = 0.045; g.add(face);
  cyl(0.44, 0.44, 0.08, S('#2f5bd6', { roughness: 0.4 }), 0, 0, 0, g, 32).rotation.x = Math.PI / 2;
  const rimT = m(new THREE.TorusGeometry(0.43, 0.035, 8, 40), goldM(), 0, 0, 0.03, g); void rimT;
  sph(0.07, goldM(), 0, 0, 0.07, g, 10);
  return g;
}
function shuriken() {
  const sh = new THREE.Shape();
  for (let i = 0; i < 8; i++) { const r = i % 2 ? 0.05 : 0.17; const a = (i / 8) * TAU; const x = Math.cos(a) * r; const y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }); geo.center();
  return m(geo, metal('#c9d0dc'));
}

// ---------- accesorios (cabeza) ----------
function buildAccessory(id) {
  const g = new THREE.Group();
  const top = TOP;
  if (id === 'crown') {
    const band = m(new THREE.CylinderGeometry(0.3, 0.27, 0.22, 10, 1, true), goldM().clone(), 0, top - 0.04, 0, g);
    band.material.side = THREE.DoubleSide;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      m(new THREE.ConeGeometry(0.07, 0.2, 6), goldM(), Math.sin(a) * 0.29, top + 0.16, Math.cos(a) * 0.29, g);
      sph(0.04, S(['#ff3b6b', '#3bc8ff', '#7dff6b'][i % 3], { roughness: 0.1 }), Math.sin(a) * 0.3, top - 0.02, Math.cos(a) * 0.3, g, 8);
    }
  } else if (id === 'tophat') {
    cyl(0.46, 0.46, 0.05, S('#1d1a2b'), 0, top - 0.08, 0, g, 28);
    cyl(0.29, 0.3, 0.5, S('#1d1a2b'), 0, top + 0.18, 0, g, 28);
    cyl(0.305, 0.305, 0.1, S('#ff3b6b'), 0, top, 0, g, 28);
  } else if (id === 'party') {
    const cone = m(new THREE.ConeGeometry(0.28, 0.6, 20), S('#2fd4a7'), 0, top + 0.2, 0, g);
    cone.rotation.z = 0.15;
    sph(0.09, S('#ffd23f'), -0.05, top + 0.52, 0, g, 12);
  } else if (id === 'bunny') {
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      sph(1, S('#ffffff'), 0, 0, 0, ear, 16).scale.set(0.11, 0.38, 0.06);
      sph(1, S('#ff9ccf'), 0, 0, 0.03, ear, 16).scale.set(0.06, 0.28, 0.04);
      ear.position.set(s * 0.18, top + 0.2, 0);
      ear.rotation.z = -s * 0.25;
      g.add(ear);
    }
  } else if (id === 'halo') {
    const halo = m(new THREE.TorusGeometry(0.3, 0.05, 12, 32), glow('#ffe066', 1.2), 0, top + 0.3, 0, g);
    halo.rotation.x = Math.PI / 2;
    halo.name = 'halo';
  } else if (id === 'cap') {
    cap(0.43, S('#3fb6ff'), 1.78, g).scale.y = 0.75;
    const brim = m(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 20, 1, false, -Math.PI / 2, Math.PI), S('#2a8fdf'), 0, 1.86, 0.28, g);
    brim.scale.z = 1.2;
    sph(0.05, S('#2a8fdf'), 0, 2.1, 0, g, 8);
  } else if (id === 'sunglasses') {
    const black = S('#111118', { roughness: 0.05, metalness: 0.6 });
    for (const s of [-1, 1]) m(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20), black, s * 0.14, 1.52, 0.6, g).rotation.x = Math.PI / 2;
    boxM(0.12, 0.03, 0.03, black, 0, 1.55, 0.61, g);
  }
  return g;
}

// ---------- skins ----------
export const SKIN_COLORS = { ninja: '#2a2a44', dragon: '#4fd06a', astronaut: '#f4f6fb', knight: '#c9cfda' };

function buildSkin(id, rig) {
  const g = new THREE.Group();
  const attached = []; // [parent, obj] colgados de brazos/manos/piernas
  const attach = (parent, obj) => { parent.add(obj); attached.push([parent, obj]); return obj; };
  const [handL, handR] = rig.hands; const [armL, armR] = rig.arms; const [legL, legR] = rig.legs;
  const hold = (hand, obj, rx = 1.1) => { obj.rotation.x = rx; return attach(hand, obj); };
  let anim = null;
  let armOut = 0.35; let legSwing = 0.9;

  if (id === 'pirate') {
    const black = S('#1d1a2b', { roughness: 0.6 });
    cap(bodyR(1.9) + 0.06, black, 1.86, g).scale.y = 0.95;
    const brimGeo = new THREE.CylinderGeometry(0.66, bodyR(1.88) + 0.05, 0.24, 40, 1, true);
    const brim = m(brimGeo, black.clone(), 0, 1.98, 0, g); brim.material.side = THREE.DoubleSide;
    const trim = m(new THREE.TorusGeometry(0.66, 0.025, 8, 48), goldM(), 0, 2.1, 0, g); trim.rotation.x = Math.PI / 2;
    const sk = m(new THREE.PlaneGeometry(0.24, 0.24), new THREE.MeshStandardMaterial({ map: skullTex(), transparent: true, side: THREE.DoubleSide }), 0, 2.0, 0.6, g); sk.rotation.x = -0.45;
    m(new THREE.CircleGeometry(0.12, 20), S('#111118'), 0.12, 1.52, 0.6, g);
    const strap = ring(1.62, 0.02, 0.018, S('#111118'), g); strap.rotation.y = 0.35;
    g.add(shell(0.48, 1.06, S('#7a3b2e', { roughness: 0.7 }), { off: 0.03, phiStart: 0.75, phiLength: TAU - 1.5 }));
    ring(0.74, 0.05, 0.07, S('#e8323f'), g);
    for (const s of [-1, 1]) {
      const a = 0.95 + s * 0.12; const r = bodyR(0.6) + 0.09;
      const tail = boxM(0.1, 0.32, 0.03, S('#e8323f'), Math.sin(a) * r, 0.55, Math.cos(a) * r, g); tail.rotation.set(0, a, s * 0.2);
    }
    boxM(0.16, 0.12, 0.04, goldM(), 0, 0.74, bodyR(0.74) + 0.08, g);
    m(new THREE.TorusGeometry(0.06, 0.014, 6, 14), goldM(), -bodyR(1.3) - 0.01, 1.28, 0.05, g).rotation.y = Math.PI / 2;
    hold(handR, cutlass(), 1.0);
    const hook = new THREE.Group();
    cyl(0.07, 0.09, 0.12, metal('#b9c0cc'), 0, -0.05, 0, hook, 10);
    const hk = m(new THREE.TorusGeometry(0.1, 0.025, 6, 16, Math.PI * 1.3), metal('#e9eef7'), 0, -0.2, 0.06, hook); hk.rotation.y = Math.PI / 2;
    attach(handL, hook);
    // loro en el hombro
    const parrot = new THREE.Group();
    sph(0.13, S('#ff3b3b'), 0, 0, 0, parrot, 12).scale.set(0.9, 1.2, 1);
    const head = new THREE.Group(); head.position.set(0, 0.17, 0.02); parrot.add(head);
    sph(0.09, S('#ff3b3b'), 0, 0, 0, head, 12);
    sph(0.025, S('#111'), 0.06, 0.02, 0.05, head, 6); sph(0.025, S('#111'), -0.06, 0.02, 0.05, head, 6);
    const beak = m(new THREE.ConeGeometry(0.035, 0.09, 8), S('#ffd23f'), 0, -0.02, 0.1, head); beak.rotation.x = Math.PI / 2 + 0.5;
    for (const s of [-1, 1]) { const w = sph(0.08, S(s < 0 ? '#3fb6ff' : '#ffd23f'), s * 0.1, -0.02, -0.02, parrot, 10); w.scale.set(0.35, 1, 0.8); }
    const ptail = boxM(0.08, 0.22, 0.03, S('#3fb6ff'), 0, -0.2, -0.08, parrot); ptail.rotation.x = 0.5;
    parrot.position.set(-0.68, 1.36, -0.02);
    g.add(parrot);
    anim = (t) => { head.rotation.y = Math.sin(t * 1.3) * 0.6; head.rotation.x = Math.max(0, Math.sin(t * 2.7)) * 0.4; };
  } else if (id === 'ninja') {
    // máscara ninja: solo queda visible una franja del visor a la altura de los ojos
    rig.visor.scale.set(0.4, 0.13, 0.25); rig.visor.position.y = 1.51;
    g.add(shell(1.8, 1.93, S('#e8323f'), { off: 0.03 }));
    const tails = [-1, 1].map((s) => {
      const p = new THREE.Group(); p.position.set(s * 0.05, 1.87, -bodyR(1.87) - 0.02);
      boxM(0.09, 0.5, 0.02, S('#e8323f'), 0, -0.25, 0, p);
      p.rotation.set(-0.5, 0, s * 0.3); g.add(p); return p;
    });
    g.add(shell(0.68, 0.8, S('#e8323f'), { off: 0.03 }));
    // katana a la espalda
    const kat = new THREE.Group();
    cyl(0.045, 0.045, 1.15, S('#3a0d16', { roughness: 0.3 }), 0, 0, 0, kat, 10);
    cyl(0.04, 0.04, 0.32, S('#f4f1e6'), 0, 0.74, 0, kat, 10);
    cyl(0.09, 0.09, 0.03, goldM(), 0, 0.58, 0, kat, 16);
    kat.position.set(0.05, 1.05, -bodyR(1.05) - 0.06); kat.rotation.z = 0.7; g.add(kat);
    for (const a of rig.arms) attach(a, m(new THREE.TorusGeometry(0.135, 0.025, 6, 16), S('#4a4a66'), 0.02 * Math.sign(a.position.x), -0.25, 0)).rotation.x = Math.PI / 2;
    const star = shuriken(); star.position.y = -0.02; attach(handR, star);
    anim = (t, s) => { tails.forEach((p, i) => { p.rotation.x = -0.5 - 0.7 * s + Math.sin(t * 9 + i) * 0.15; }); star.rotation.z = t * 6; };
  } else if (id === 'samurai') {
    const lac = S('#a3172c', { roughness: 0.25, metalness: 0.1 });
    const lace = new THREE.MeshStandardMaterial({ map: lacingTex(), roughness: 0.4 });
    cap(0.5, lac, 1.73, g).scale.y = 0.82;
    ring(1.73, 0.05, 0.035, goldM(), g);
    for (let k = 0; k < 3; k++) {
      const neck = shell(1.38 - k * 0.12, 1.5 - k * 0.12, lace, { off: 0.12 + k * 0.05, flare: 0.04, phiStart: 0.9, phiLength: TAU - 1.8 });
      g.add(neck);
    }
    for (const s of [-1, 1]) {
      const horn = m(new THREE.TorusGeometry(0.34, 0.035, 6, 20, Math.PI * 0.55), goldM(), s * 0.13, 2.05, 0.38, g);
      horn.rotation.set(0, 0, s > 0 ? 0.2 : Math.PI - 0.2 - Math.PI * 0.55);
    }
    sph(0.08, goldM(), 0, 1.95, 0.5, g, 12);
    g.add(shell(0.52, 1.08, lace, { off: 0.04 }));
    ring(1.08, 0.05, 0.03, goldM(), g);
    g.add(shell(0.62, 0.7, S('#5b2fd6'), { off: 0.06 }));
    g.add(shell(0.22, 0.6, lace, { off: 0.07, flare: 0.15 }));
    for (const a of rig.arms) {
      const sode = new THREE.Group();
      boxM(0.36, 0.06, 0.34, lac, 0, 0.08, 0, sode);
      boxM(0.06, 0.32, 0.34, lace, Math.sign(a.position.x) * 0.18, -0.08, 0, sode);
      attach(a, sode);
    }
    const kat = new THREE.Group();
    cyl(0.04, 0.04, 1.0, S('#15121f', { roughness: 0.2 }), 0, 0, 0, kat, 10);
    cyl(0.038, 0.038, 0.28, S('#f4f1e6'), 0, 0.64, 0, kat, 10);
    cyl(0.08, 0.08, 0.03, goldM(), 0, 0.5, 0, kat, 16);
    kat.position.set(-bodyR(0.42) - 0.12, 0.42, 0.05); kat.rotation.set(1.35, 0, 0.1); g.add(kat);
    armOut = 0.6; legSwing = 0.55;
  } else if (id === 'dragon') {
    const green = S(SKIN_COLORS.dragon); const horn = S('#fff3d0', { roughness: 0.4 });
    g.add(shell(0.3, 1.12, new THREE.MeshStandardMaterial({ map: bellyTex(), roughness: 0.6 }), { off: 0.012, ...front(0.85) }));
    for (const s of [-1, 1]) {
      const h = new THREE.Group(); h.position.set(s * 0.22, 1.98, -0.05);
      cyl(0.06, 0.09, 0.22, horn, 0, 0.1, 0, h, 10);
      const tip = m(new THREE.ConeGeometry(0.06, 0.22, 10), horn, 0, 0.28, -0.04, h); tip.rotation.x = -0.6;
      h.rotation.set(-0.3, 0, -s * 0.4); g.add(h);
    }
    for (let i = 0; i < 7; i++) {
      const y = 0.45 + i * 0.25; const r = bodyR(y);
      const sp = m(new THREE.ConeGeometry(0.07 + (i % 2) * 0.02, 0.26, 4), S('#ffb02e', { roughness: 0.4 }), 0, y, -r - 0.03, g);
      sp.rotation.x = -Math.PI / 2 - 0.35;
    }
    const tail = new THREE.Group(); tail.position.set(0, 0.45, -0.5); g.add(tail);
    let prev = tail;
    const segs = [];
    for (let i = 0; i < 4; i++) {
      const sg = new THREE.Group(); sg.position.set(0, 0, i ? -0.24 : 0); prev.add(sg); prev = sg; segs.push(sg);
      const piece = cyl(0.17 - i * 0.035, 0.2 - i * 0.035, 0.28, green, 0, 0, -0.12, sg, 12); piece.rotation.x = Math.PI / 2;
    }
    const spade = m(new THREE.OctahedronGeometry(0.15), S('#ffb02e'), 0, 0.04, -0.3, prev); spade.scale.set(1, 0.4, 1.4);
    const wings = [-1, 1].map((s) => {
      const p = new THREE.Group(); p.position.set(s * 0.18, 1.3, -bodyR(1.3) - 0.02);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s * 1.05, 0.5); sh.quadraticCurveTo(s * 0.95, 0.1, s * 0.85, -0.2); sh.quadraticCurveTo(s * 0.62, -0.05, s * 0.55, -0.3); sh.quadraticCurveTo(s * 0.32, -0.12, s * 0.25, -0.38); sh.lineTo(0, -0.25);
      const w = m(new THREE.ShapeGeometry(sh, 12), new THREE.MeshStandardMaterial({ color: '#ff8fd8', side: THREE.DoubleSide, roughness: 0.55, transparent: true, opacity: 0.95 }), 0, 0, 0, p);
      for (const [ex, ey] of [[1.05, 0.5], [0.85, -0.2], [0.55, -0.3]]) {
        const len = Math.hypot(ex, ey); const bone = cyl(0.022, 0.03, len, green, (s * ex) / 2, ey / 2, 0.01, p, 6);
        bone.rotation.z = Math.atan2(ey, s * ex) - Math.PI / 2;
      }
      void w; p.rotation.y = s * 0.45; g.add(p); return p;
    });
    for (const l of rig.legs) for (const c of [-0.07, 0, 0.07]) { const cl = m(new THREE.ConeGeometry(0.03, 0.09, 6), horn, c, -0.36, 0.28, null); cl.rotation.x = Math.PI / 2; attach(l, cl); }
    const puffs = [0, 1, 2].map(() => { const p = sph(0.08, new THREE.MeshStandardMaterial({ color: '#d8d0e8', transparent: true, opacity: 0, roughness: 1 }), 0, 1.2, 0.7, g, 10); p.castShadow = false; return p; });
    anim = (t, s) => {
      const f = Math.sin(t * (4 + s * 6)) * 0.5; wings[0].rotation.y = -(0.5 + f * 0.6); wings[1].rotation.y = 0.5 + f * 0.6;
      segs.forEach((sg, i) => { sg.rotation.y = Math.sin(t * 3 - i * 0.6) * 0.25; sg.rotation.x = 0.12; });
      const ph = (t % 4) / 4;
      puffs.forEach((p, i) => { const k = Math.max(0, ph * 4 - i * 0.3); const on = k > 0 && k < 1.6; p.material.opacity = on ? 0.7 * (1 - k / 1.6) : 0; p.position.set(Math.sin(i * 2) * 0.08, 1.3 + k * 0.2, 0.7 + k * 0.5); p.scale.setScalar(0.6 + k); });
    };
  } else if (id === 'wizard') {
    const purple = new THREE.MeshStandardMaterial({ map: starsTex(), roughness: 0.6 });
    cyl(0.66, 0.66, 0.05, S('#5b2fd6'), 0, 1.9, 0, g, 32);
    ring(1.95, 0.04, 0.05, goldM(), g);
    const hat = cyl(0.12, 0.43, 0.75, purple, 0, 2.3, -0.02, g, 24);
    const tipH = new THREE.Group(); tipH.position.set(0, 2.66, -0.02); g.add(tipH);
    const tip = m(new THREE.ConeGeometry(0.12, 0.5, 20), purple, 0, 0.22, 0, tipH); void tip; tipH.rotation.x = -0.6;
    sph(0.06, glow('#ffd23f', 1.2), 0, 0.48, 0, tipH, 10);
    void hat;
    const beardPts = []; for (let i = 0; i <= 10; i++) { const k = i / 10; beardPts.push(new THREE.Vector2(0.001 + Math.sin(k * Math.PI * 0.85) * 0.33, -0.8 + k * 0.8)); }
    const beard = m(new THREE.LatheGeometry(beardPts, 20), S('#f4f1ff', { roughness: 0.9 }), 0, 1.22, 0.42, g); beard.scale.z = 0.55;
    for (const s of [-1, 1]) { const mu = sph(1, S('#f4f1ff', { roughness: 0.9 }), s * 0.12, 1.25, 0.6, g, 12); mu.scale.set(0.14, 0.06, 0.07); mu.rotation.z = s * 0.35; }
    g.add(shell(0.12, 1.08, purple, { off: 0.03, flare: 0.2 }));
    ring(1.07, 0.06, 0.06, goldM(), g);
    ring(0.7, 0.05, 0.035, goldM(), g);
    const st = staff(); hold(handR, st.g, 0.15); st.g.position.y = -0.35;
    armOut = 0.55; legSwing = 0.45;
    anim = (t) => {
      st.orb.material.emissiveIntensity = 1.6 + Math.sin(t * 4) * 0.8;
      st.sparks.forEach((sp, i) => { const a = t * 2.5 + (i * TAU) / 3; sp.position.set(Math.cos(a) * 0.25, 1.42 + Math.sin(t * 3 + i) * 0.1, Math.sin(a) * 0.25); sp.rotation.y = t * 4; });
    };
  } else if (id === 'knight') {
    const steel = metal('#e3e8f0'); const steelD = metal('#9aa3b5');
    g.add(shell(1.26, 2.02, steel, { off: 0.05 }));
    cap(bodyR(1.95) + 0.06, steel, 1.94, g).scale.y = 1.2;
    boxM(0.6, 0.07, 0.12, S('#15121f'), 0, 1.55, bodyR(1.55) + 0.06, g);
    for (let i = -2; i <= 2; i++) sph(0.018, S('#15121f'), i * 0.07, 1.42, bodyR(1.42) + 0.08, g, 6);
    boxM(0.06, 0.62, 0.05, goldM(), 0, 1.62, bodyR(1.62) + 0.09, g);
    ring(1.27, 0.06, 0.04, goldM(), g);
    const plume = new THREE.Group(); plume.position.set(0, 2.15, -0.05); g.add(plume);
    for (let i = 0; i < 4; i++) { const f = sph(1, S('#e8323f', { roughness: 0.8 }), 0, 0.12 + i * 0.03, -0.1 - i * 0.12, plume, 12); f.scale.set(0.09, 0.14, 0.16); }
    g.add(shell(0.5, 1.2, steel, { off: 0.06 }));
    ring(1.2, 0.07, 0.035, goldM(), g); ring(0.5, 0.07, 0.035, goldM(), g);
    const emb = m(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshStandardMaterial({ map: crossTex(), transparent: true }), 0, 0.88, bodyR(0.88) + 0.075, g); emb.rotation.x = -0.12;
    g.add(shell(0.2, 0.5, steelD, { off: 0.07, flare: 0.1 }));
    for (const a of rig.arms) {
      const pd = cap(0.21, steel, 0.02, null); pd.scale.y = 0.75; attach(a, pd);
      const pr = m(new THREE.TorusGeometry(0.2, 0.025, 6, 20), goldM(), 0, 0.02, 0, null); pr.rotation.x = Math.PI / 2; attach(a, pr);
      attach(a, m(new THREE.TorusGeometry(0.14, 0.04, 6, 16), steel, Math.sign(a.position.x) * 0.05, -0.38, 0, null)).rotation.x = Math.PI / 2;
    }
    for (const l of rig.legs) attach(l, cyl(0.16, 0.17, 0.2, steel, 0, -0.16, 0, null, 14));
    const cape = shell(0.3, 1.3, S('#c41e3a', { roughness: 0.7 }), { off: 0.09, flare: 0.14, phiStart: Math.PI - 1.1, phiLength: 2.2 });
    g.add(cape);
    hold(handR, sword(0.95), 0.7);
    armOut = 0.62; legSwing = 0.6;
    const sh = shield(); sh.rotation.y = -Math.PI / 2; sh.position.set(-0.1, 0.05, 0.05); attach(handL, sh);
    anim = (t, s) => { cape.rotation.x = -0.05 - s * 0.12 + Math.sin(t * 3) * 0.02; };
  } else if (id === 'astronaut') {
    const dome = sph(0.66, new THREE.MeshPhysicalMaterial({ color: '#bff3ff', transparent: true, opacity: 0.25, roughness: 0.02, metalness: 0, clearcoat: 1, depthWrite: false }), 0, 1.55, 0.02, g, 32);
    dome.castShadow = false;
    ring(1.04, 0.09, 0.07, metal('#b9c0cc'), g);
    const panel = boxM(0.42, 0.28, 0.06, S('#d5dbe6'), 0, 0.88, bodyR(0.88) + 0.02, g); panel.rotation.x = -0.1;
    const btns = ['#ff3b3b', '#ffd23f', '#3ddc84', '#3fb6ff'].map((c, i) => sph(0.035, glow(c, 1), -0.13 + i * 0.087, 0.9, bodyR(0.9) + 0.07, g, 8));
    g.add(shell(0.62, 0.7, S('#ff7a2f'), { off: 0.03 }));
    const pack = new THREE.Group(); pack.position.set(0, 1.0, -bodyR(1.0) - 0.15); g.add(pack);
    m(new THREE.BoxGeometry(0.72, 0.85, 0.3), S('#e9eef7'), 0, 0, 0, pack);
    for (const s of [-1, 1]) { cyl(0.11, 0.11, 0.75, metal('#b9c0cc'), s * 0.22, 0, -0.2, pack, 14); }
    const flames = [-1, 1].map((s) => { const f = m(new THREE.ConeGeometry(0.08, 0.3, 10), glow('#ff9a2e', 2.5), s * 0.22, -0.55, -0.2, pack); f.rotation.x = Math.PI; return f; });
    const tube = m(new THREE.TorusGeometry(0.28, 0.03, 6, 20, Math.PI), S('#9aa3b5'), 0.3, 0.3, 0.15, pack); tube.rotation.y = Math.PI / 2;
    cyl(0.015, 0.015, 0.4, S('#9aa3b5'), 0.2, 2.25, 0, g, 6);
    const bulb = sph(0.055, glow('#ff3b3b', 2), 0.2, 2.47, 0, g, 8);
    const flag = m(new THREE.PlaneGeometry(0.2, 0.13), new THREE.MeshStandardMaterial({ map: canvasTex('flag', 64, 40, (c) => { c.fillStyle = '#2f5bd6'; c.fillRect(0, 0, 64, 40); c.fillStyle = '#fff'; c.font = '28px sans-serif'; c.fillText('★', 18, 30); }) }), 0, 0.12, 0.15, null);
    flag.rotation.y = Math.PI / 2 * Math.sign(rig.arms[0].position.x); attach(armL, flag).position.set(-0.13, -0.12, 0.02);
    for (const a of rig.arms) attach(a, m(new THREE.TorusGeometry(0.14, 0.04, 6, 16), S('#ff7a2f'), Math.sign(a.position.x) * 0.05, -0.35, 0, null)).rotation.x = Math.PI / 2;
    for (const l of rig.legs) attach(l, cyl(0.17, 0.19, 0.22, S('#9aa3b5'), 0, -0.2, 0.02, null, 14));
    armOut = 0.5;
    anim = (t, s) => {
      bulb.material.emissiveIntensity = Math.sin(t * 5) > 0 ? 2.5 : 0.2;
      btns.forEach((b, i) => { b.material.emissiveIntensity = (Math.floor(t * 3) + i) % 4 === 0 ? 2 : 0.4; });
      flames.forEach((f) => { f.scale.y = s * (0.8 + Math.sin(t * 30) * 0.3); f.visible = s > 0.1; });
    };
  } else if (id === 'chef') {
    const white = S('#ffffff', { roughness: 0.75 });
    const toque = cyl(0.33, 0.3, 0.42, white, 0, 2.1, 0, g, 12); void toque;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; sph(0.2, white, Math.sin(a) * 0.2, 2.38, Math.cos(a) * 0.2, g, 14); }
    sph(0.24, white, 0, 2.45, 0, g, 14);
    for (const s of [-1, 1]) { const mu = sph(1, S('#3b2416'), s * 0.11, 1.27, 0.56, g, 12); mu.scale.set(0.13, 0.05, 0.05); mu.rotation.z = s * 0.35; }
    g.add(shell(0.5, 1.06, white, { off: 0.025 }));
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const y = 0.65 + i * 0.16; sph(0.03, S('#2a1a5e'), s * 0.12, y, bodyR(y) + 0.035, g, 8); }
    ring(1.05, 0.04, 0.07, S('#e8323f'), g);
    const knot = m(new THREE.ConeGeometry(0.1, 0.2, 4), S('#e8323f'), 0, 0.98, bodyR(0.98) + 0.07, g); knot.rotation.x = Math.PI;
    const apron = shell(0.18, 0.92, S('#f2eee6', { roughness: 0.85 }), { off: 0.06, flare: 0.05, ...front(1.0) });
    g.add(apron);
    boxM(0.3, 0.18, 0.03, S('#e9e2d4'), 0, 0.5, bodyR(0.5) + 0.1, g);
    ring(0.8, 0.07, 0.025, S('#f2eee6'), g);
    for (const s of [-1, 1]) { const st = boxM(0.05, 0.45, 0.02, S('#f2eee6'), s * 0.25, 1.12, bodyR(1.12) + 0.05, g); st.rotation.z = s * -0.2; }
    hold(handR, spoon(), 1.0);
    armOut = 0.48; legSwing = 0.7;
  }
  if (id === 'pirate') armOut = 0.45;
  if (id === 'ninja') armOut = 0.42;
  return { g, anim, armOut, legSwing, dispose() { for (const [p, o] of attached) p.remove(o); } };
}

export function createBean({ color = '#ff4fb4', acc = 'none', skin = 'none' } = {}) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);

  let userColor = color;
  // material "gomoso": capa de barniz + brillo aterciopelado
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.35, sheen: 0.25, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff') });
  inner.add(m(beanGeometry(), mat, 0, LIFT, 0));

  const visor = m(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshPhysicalMaterial({ color: '#fdfdff', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }), 0, 1.33 + LIFT, 0.33, inner);
  visor.scale.set(0.4, 0.33, 0.25);
  const eyes = new THREE.Group(); eyes.position.set(0, 1.36 + LIFT, 0); inner.add(eyes);
  for (const s of [-1, 1]) {
    const e = sph(1, S('#151022', { roughness: 0.2 }), s * 0.12, 0, 0.575, eyes, 16); e.scale.set(0.052, 0.088, 0.035);
    sph(0.018, S('#ffffff', { roughness: 0.1 }), s * 0.12 + 0.016, 0.04, 0.607, eyes, 8);
  }

  const arms = []; const hands = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.55, 1.0 + LIFT, 0);
    m(new THREE.CapsuleGeometry(0.13, 0.26, 8, 14), mat, s * 0.05, -0.22, 0, pivot);
    sph(0.155, mat, s * 0.065, -0.47, 0.02, pivot, 16);
    const anchor = new THREE.Group(); anchor.position.set(s * 0.065, -0.5, 0.06); pivot.add(anchor);
    pivot.rotation.z = s * 0.35;
    inner.add(pivot);
    arms.push(pivot); hands.push(anchor);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.22, 0.32 + LIFT, 0);
    m(new THREE.CapsuleGeometry(0.13, 0.1, 6, 12), mat, 0, -0.17, 0, pivot);
    sph(1, mat, 0, -0.33, 0.06, pivot, 16).scale.set(0.17, 0.12, 0.23);
    inner.add(pivot);
    legs.push(pivot);
  }
  const rig = { arms, hands, legs, inner, visor };

  let accId = acc; let skinId = skin;
  let accGroup = new THREE.Group();
  let skinObj = null;
  const rebuild = () => {
    inner.remove(accGroup);
    if (skinObj) { inner.remove(skinObj.g); skinObj.dispose(); skinObj = null; }
    visor.scale.set(0.4, 0.33, 0.25); visor.position.y = 1.33 + LIFT;
    if (skinId && skinId !== 'none') { skinObj = buildSkin(skinId, rig); inner.add(skinObj.g); }
    accGroup = skinObj ? new THREE.Group() : buildAccessory(accId); // las skins ya llevan su propio "gorro"
    inner.add(accGroup);
    mat.color.set(SKIN_COLORS[skinId] || userColor);
  };
  rebuild();

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 24),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.18, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  root.add(blob);

  let phase = 0;
  let speedS = 0;
  let nextBlink = 1 + Math.random() * 3;
  const api = {
    root,
    get look() { return { color: userColor, acc: accId, skin: skinId }; },
    setColor(c) { userColor = c; mat.color.set(SKIN_COLORS[skinId] || userColor); },
    setAcc(id) { if (id === accId) return; accId = id; rebuild(); },
    setSkin(id) { if (id === skinId) return; skinId = id; rebuild(); },
    setLook({ color: c, acc: a, skin: s }) {
      if (c) userColor = c;
      const changed = (a !== undefined && a !== accId) || (s !== undefined && s !== skinId);
      if (a !== undefined) accId = a;
      if (s !== undefined) skinId = s;
      if (changed) rebuild(); else mat.color.set(SKIN_COLORS[skinId] || userColor);
    },
    // speed01: 0..1, air: altura de salto (0 en el suelo)
    animate(dt, speed01, t, air = 0) {
      speedS += (speed01 - speedS) * Math.min(1, dt * 10);
      const s = speedS;
      phase += dt * (5 + 9 * s);
      const sw = Math.sin(phase);
      const legK = skinObj?.legSwing ?? 0.9; const out = skinObj?.armOut ?? 0.35;
      legs[0].rotation.x = sw * legK * s;
      legs[1].rotation.x = -sw * legK * s;
      const armUp = air > 0.05 ? 1.9 : 0;
      arms[0].rotation.x = -sw * 1.0 * s + Math.sin(t * 1.7) * 0.05 * (1 - s);
      arms[1].rotation.x = sw * 1.0 * s - Math.sin(t * 1.7) * 0.05 * (1 - s);
      arms[0].rotation.z += ((-out - armUp) - arms[0].rotation.z) * Math.min(1, dt * 12);
      arms[1].rotation.z += ((out + armUp) - arms[1].rotation.z) * Math.min(1, dt * 12);
      inner.position.y = Math.abs(Math.cos(phase)) * 0.14 * s;
      inner.rotation.z = sw * 0.09 * s;
      inner.rotation.x = 0.14 * s;
      const breath = 1 + Math.sin(t * 2.2) * 0.018 * (1 - s);
      inner.scale.set(1 / Math.sqrt(breath), breath, 1 / Math.sqrt(breath));
      blob.scale.setScalar(1 / (1 + air * 0.4));
      // parpadeo
      nextBlink -= dt;
      if (nextBlink < 0) { eyes.scale.y = Math.max(0.1, eyes.scale.y - dt * 25); if (nextBlink < -0.12) { nextBlink = 2 + Math.random() * 4; } } else eyes.scale.y = Math.min(1, eyes.scale.y + dt * 18);
      const halo = accGroup.getObjectByName('halo');
      if (halo) halo.position.y = TOP + 0.3 + Math.sin(t * 2.5) * 0.05;
      skinObj?.anim?.(t, s);
    },
  };
  root.userData.bean = api;
  return api;
}
