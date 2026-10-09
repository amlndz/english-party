import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import './style.css';
import { createBean } from './bean.js';
import { buildWorld, groundHeight } from './world.js';
import { WALK, SPAWN as SPAWN_PT, planRoute } from './city.js';
import { ZONE_BY_ID, zoneAt } from './content.js';
import { initShop } from './shop.js';
import { initBigMap, drawMap } from './map.js';
import { net } from './net.js';
import { store } from './store.js';
import { initUI, confetti } from './ui.js';

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.id = 'gl';
app.prepend(renderer.domElement);

const labels = new CSS2DRenderer();
labels.setSize(innerWidth, innerHeight);
labels.domElement.className = 'labels';
app.insertBefore(labels.domElement, renderer.domElement.nextSibling);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 1200);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight);
});

try { await Promise.race([document.fonts.load('64px "Titan One"'), new Promise((r) => setTimeout(r, 2500))]); } catch { /* fuentes del sistema */ }
await document.fonts.load('800 40px "Nunito"').catch(() => {});

const world = buildWorld(scene, renderer);

// ---------- jugador ----------
function nameTag(name, color, me = false) {
  const div = document.createElement('div');
  div.className = 'nametag' + (me ? ' me' : '');
  div.innerHTML = `<span class="nt-dot" style="background:${color}"></span><span class="nt-name"></span>`;
  div.querySelector('.nt-name').textContent = name;
  const bubble = document.createElement('div'); bubble.className = 'bubble';
  div.prepend(bubble);
  const obj = new CSS2DObject(div);
  obj.position.set(0, 2.75, 0);
  return { obj, div, bubble };
}
function showEmote(tag, e) {
  tag.bubble.textContent = e;
  tag.bubble.classList.remove('pop'); void tag.bubble.offsetWidth; tag.bubble.classList.add('pop');
}

const SPAWN = new THREE.Vector3(SPAWN_PT[0], 0, SPAWN_PT[1]);
const me = { bean: createBean({}), pos: SPAWN.clone(), ry: 0, y: 0, vy: 0, air: 0, speed: 0, target: null, route: [], stuck: 0, tag: null };
me.bean.root.position.copy(me.pos);
scene.add(me.bean.root);

let mode = 'creator';
const CAM_DEFAULT = { pitch: 0.66, dist: 20 };
const cam = { yaw: 0, goalYaw: null, pitch: CAM_DEFAULT.pitch, dist: CAM_DEFAULT.dist, target: new THREE.Vector3(SPAWN_PT[0], 1, SPAWN_PT[1]) };
const zoneYaw = (id) => { const f = ZONE_BY_ID[id]?.face; return f ? Math.atan2(f[0], f[1]) : 0; };
function resetCamera() { cam.goalYaw = zoneYaw(store.zone); cam.pitch = CAM_DEFAULT.pitch; cam.dist = CAM_DEFAULT.dist; }

// ---------- jugadores remotos ----------
const remotes = new Map();
function syncRemotes(list) {
  const seen = new Set();
  for (const p of list) {
    if (p.id === store.myId) continue;
    seen.add(p.id);
    let r = remotes.get(p.id);
    if (!r) {
      const bean = createBean({ color: p.color, acc: p.acc, skin: p.skin });
      bean.root.position.set(p.x, groundHeight(p.x, p.z), p.z);
      const tag = nameTag(p.name, p.color);
      bean.root.add(tag.obj);
      scene.add(bean.root);
      r = { bean, tag, tx: p.x, tz: p.z, ty: 0, ry: p.ry, speed: 0 };
      remotes.set(p.id, r);
    }
    const lk = r.bean.look;
    if (lk.color !== p.color || lk.acc !== p.acc || lk.skin !== (p.skin || 'none')) r.bean.setLook({ color: p.color, acc: p.acc, skin: p.skin || 'none' });
    r.tx = p.x; r.tz = p.z; r.ty = p.y || 0; r.try = p.ry; r.m = p.m;
    store.players.set(p.id, p);
  }
  for (const [id, r] of remotes) {
    if (!seen.has(id)) {
      r.tag.obj.removeFromParent(); r.tag.div.remove();
      scene.remove(r.bean.root); remotes.delete(id); store.players.delete(id);
    }
  }
}

// ---------- red ----------
net.on('welcome', (m) => { store.myId = m.id; store.boards = m.boards; for (const z of Object.keys(m.boards)) store.emit('board', z); });
net.on('snap', (m) => { syncRemotes(m.players); store.emit('presence'); ui.presence(); });
net.on('live', (m) => { store.live[m.zone] = m.entries; store.emit('live', m.zone); });
net.on('board', (m) => { store.boards[m.zone] = m.board; store.emit('board', m.zone); });
net.on('ranked', (m) => store.emit('ranked', m));
net.on('emote', (m) => { if (m.id !== store.myId) { const r = remotes.get(m.id); if (r) showEmote(r.tag, m.e); } });

// ---------- silueta "rayos X": tu personaje se ve a través de lo que lo tapa ----------
const xray = new THREE.MeshBasicMaterial({
  color: '#ffffff', transparent: true, opacity: 0, fog: false,
  depthFunc: THREE.GreaterDepth, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
});
const XRAY_LAYER = 1;
function markXray() { me.bean.root.traverse((o) => { if (o.isMesh) o.layers.enable(XRAY_LAYER); }); }
// solo se activa si algo del escenario se interpone entre la cámara y el personaje
const occluders = [];
scene.traverse((o) => {
  if (!o.isMesh || o.isSprite) return;
  for (let q = o; q; q = q.parent) if (q === me.bean.root) return; // tu propio muñeco no cuenta
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  if (o.geometry.boundingSphere.radius > 300) return; // cielo
  const mt = Array.isArray(o.material) ? o.material[0] : o.material;
  if (mt.transparent && mt.opacity < 0.5) return; // haces de luz, cristales
  occluders.push(o);
});
const occRay = new THREE.Raycaster();
const occTarget = new THREE.Vector3();
let occluded = false; let occFrame = 0;
function checkOcclusion() {
  if (++occFrame % 5) return;
  occluded = false;
  for (const h of [0.9, 1.9]) {
    occTarget.set(me.pos.x, me.y + me.air + h, me.pos.z);
    const dir = occTarget.clone().sub(camera.position);
    const dist = dir.length();
    occRay.set(camera.position, dir.normalize());
    occRay.far = dist - 0.8;
    if (occRay.intersectObjects(occluders, false).length) { occluded = true; return; }
  }
}
function renderXray() {
  checkOcclusion();
  xray.opacity += ((occluded ? 0.55 : 0) - xray.opacity) * 0.2;
  if (xray.opacity < 0.02) return;
  xray.color.set(me.bean.look.skin !== 'none' ? '#ffffff' : me.bean.look.color).lerp(new THREE.Color('#ffffff'), 0.35);
  const fog = scene.fog;
  renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;
  scene.fog = null; scene.overrideMaterial = xray; camera.layers.set(XRAY_LAYER);
  renderer.render(scene, camera);
  camera.layers.set(0); scene.overrideMaterial = null; scene.fog = fog;
  renderer.autoClear = true; renderer.shadowMap.autoUpdate = true;
}

// ---------- UI ----------
const ui = initUI({
  onPreview(p) { me.bean.setLook(p); markXray(); },
  onStart(p) {
    store.profile = p;
    me.bean.setLook(p);
    markXray();
    me.tag = nameTag(p.name, p.color, true);
    me.bean.root.add(me.tag.obj);
    mode = 'play';
    net.connect(p);
  },
  onEmote(e) { if (me.tag) showEmote(me.tag, e); net.send('emote', { e }); },
  onGo: (id) => goTo(id),
});
ui.showCreator();

// ---------- tienda + mapa ----------
const shop = initShop({
  getLook: () => ({ color: store.profile.color, acc: store.profile.acc || 'none', skin: store.profile.skin || 'none' }),
  onLook(look) {
    Object.assign(store.profile, look);
    me.bean.setLook(look); markXray();
    me.tag.div.querySelector('.nt-dot').style.background = look.color;
    ui.saveProfile(look);
    net.send('look', look);
  },
  spend: (n) => ui.addPoints(-n),
  confetti,
});
function goTo(id) {
  me.target = null;
  me.route = planRoute(me.pos.x, me.pos.z, ZONE_BY_ID[id]).map(([x, z]) => new THREE.Vector3(x, 0, z));
  me.stuck = 0;
}
const bigmap = initBigMap({ me, onGo: goTo });
if (import.meta.env.DEV) window.__game = { me, store, goTo, cam };
document.getElementById('btn-shop').onclick = () => shop.open();
document.getElementById('btn-map').onclick = () => bigmap.open();
document.getElementById('minimap').onclick = () => bigmap.open();
document.getElementById('btn-cam').onclick = () => resetCamera();

// ---------- input ----------
const keys = {};
const typing = () => /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
const blocked = () => mode !== 'play' || store.uiOpen || typing();
addEventListener('keydown', (e) => {
  if (typing()) return;
  if (e.code === 'KeyM' && bigmap.isOpen) { bigmap.toggle(); return; }
  keys[e.code] = true;
  if (blocked()) return;
  if (e.code === 'Space') { e.preventDefault(); if (me.air <= 0.001) me.vy = 9; }
  if (e.code === 'KeyE' && store.zone) ui.openZone(store.zone);
  else if (e.code === 'KeyE' && store.atSchool) ui.openSchool();
  if (e.code === 'KeyM') bigmap.open();
  if (e.code === 'KeyT') shop.open();
  if (e.code === 'KeyC') resetCamera();
  const n = { Digit1: '👋', Digit2: '🎉', Digit3: '😂', Digit4: '❤️' }[e.code];
  if (n) { showEmote(me.tag, n); net.send('emote', { e: n }); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const marker = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.7, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
marker.rotation.x = -Math.PI / 2;
scene.add(marker);
let drag = null;
renderer.domElement.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: false, btn: e.button }; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x; const dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
  if (drag.moved && mode === 'play') {
    cam.yaw -= dx * 0.006; cam.goalYaw = null;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.004, 0.3, 1.35);
    drag.x = e.clientX; drag.y = e.clientY;
  }
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (drag && !drag.moved && mode === 'play' && !store.uiOpen && drag.btn === 0) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3();
    if (ray.ray.intersectPlane(plane, hit) && Math.hypot(hit.x, hit.z) < WALK_R) {
      me.target = hit;
      marker.position.set(hit.x, groundHeight(hit.x, hit.z) + 0.05, hit.z);
      marker.material.opacity = 1; marker.scale.setScalar(1.4);
    }
  }
  drag = null;
});
renderer.domElement.addEventListener('wheel', (e) => { if (mode === 'play') cam.dist = THREE.MathUtils.clamp(cam.dist + e.deltaY * 0.02, 9, 40); }, { passive: true });
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- update ----------
const SPEED = 7.5;
const angLerp = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
let sendT = 0;

function updateMe(dt) {
  const mv = new THREE.Vector2();
  if (!blocked()) {
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    if (f || r) {
      me.target = null; me.route = [];
      mv.set(-Math.sin(cam.yaw) * f + Math.cos(cam.yaw) * r, -Math.cos(cam.yaw) * f - Math.sin(cam.yaw) * r);
    }
  }
  if (!me.target && me.route.length && !store.uiOpen && !(mv.x || mv.y)) {
    const wp = me.route[0];
    mv.set(wp.x - me.pos.x, wp.z - me.pos.z);
    if (mv.length() < 0.7) { me.route.shift(); me.stuck = 0; }
  }
  if (me.target && !store.uiOpen) {
    mv.set(me.target.x - me.pos.x, me.target.z - me.pos.z);
    if (mv.length() < 0.35) { me.target = null; mv.set(0, 0); }
  }
  let moving = mv.lengthSq() > 0;
  if (moving) {
    mv.normalize();
    const px = me.pos.x; const pz = me.pos.z;
    me.pos.x += mv.x * SPEED * dt; me.pos.z += mv.y * SPEED * dt;
    const bx = me.pos.x; const bz = me.pos.z;
    world.collide(me.pos, 0.5, me.air);
    const nx = me.pos.x - bx; const nz = me.pos.z - bz; const nl = Math.hypot(nx, nz);
    if (nl > 1e-4) {
      // deslizar alrededor del obstáculo en vez de quedarse pegado
      const ux = nx / nl; const uz = nz / nl;
      const side = Math.sign(mv.x * -uz + mv.y * ux) || 1;
      me.pos.x += -uz * side * SPEED * dt * 0.6; me.pos.z += ux * side * SPEED * dt * 0.6;
      world.collide(me.pos, 0.5, me.air);
    }
    me.pos.x = THREE.MathUtils.clamp(me.pos.x, -WALK.x, WALK.x);
    me.pos.z = THREE.MathUtils.clamp(me.pos.z, -WALK.z, WALK.z);
    me.ry = angLerp(me.ry, Math.atan2(mv.x, mv.y), Math.min(1, dt * 12));
    // si nos atascamos contra algo con click-to-move, paramos
    if (me.target && Math.hypot(me.pos.x - px, me.pos.z - pz) < SPEED * dt * 0.1) me.target = null;
    if (me.route.length && Math.hypot(me.pos.x - px, me.pos.z - pz) < SPEED * dt * 0.3) { me.stuck += dt; if (me.stuck > 0.6) { me.route.shift(); me.stuck = 0; } }
  }
  me.speed = moving ? 1 : 0;
  // salto
  me.vy -= 26 * dt;
  me.air = Math.max(0, me.air + me.vy * dt);
  if (me.air === 0) me.vy = 0;
  me.y += (groundHeight(me.pos.x, me.pos.z) - me.y) * Math.min(1, dt * 15);
  me.bean.root.position.set(me.pos.x, me.y + me.air, me.pos.z);
  me.bean.root.rotation.y = me.ry;

  // zona
  const zone = zoneAt(me.pos.x, me.pos.z)?.id || null;
  // puerta del colegio (escalinata del edificio central)
  const atSchool = Math.abs(me.pos.x) < 4 && me.pos.z > -4.8 && me.pos.z < -0.8;
  if (atSchool !== !!store.atSchool) { store.atSchool = atSchool; ui.presence(); if (atSchool) ui.toast('🏫 Puerta del colegio: pulsa E para ver tu roadmap'); }
  if (zone !== store.zone) {
    store.zone = zone; ui.setZone(zone);
    // encuadra el aula: cámara del lado del centro de la isla mirando hacia los edificios
    if (zone) cam.goalYaw = zoneYaw(zone);
  }

  sendT += dt;
  if (sendT > 0.1) { sendT = 0; net.send('st', { x: me.pos.x, z: me.pos.z, y: me.air, ry: me.ry, m: moving ? 1 : 0 }); }
}

function updateRemotes(dt, t) {
  for (const r of remotes.values()) {
    const p = r.bean.root.position;
    const k = Math.min(1, dt * 8);
    const dx = r.tx - p.x; const dz = r.tz - p.z;
    p.x += dx * k; p.z += dz * k;
    world.collide(p, 0.45, r.ty);
    p.y = groundHeight(p.x, p.z) + r.ty;
    r.bean.root.rotation.y = angLerp(r.bean.root.rotation.y, r.try ?? 0, Math.min(1, dt * 10));
    r.bean.animate(dt, r.m ? 1 : 0, t, r.ty);
  }
}

const tmp = new THREE.Vector3();
function updateCamera(dt, t) {
  if (mode === 'creator') {
    // primer plano para el creador; el bean se queda a la izquierda del panel
    // escritorio: bean a la izquierda del panel; móvil/vertical: bean arriba, panel abajo
    const wide = innerWidth > 800;
    const side = wide ? 1.4 : 0;
    const lookY = wide ? 1.15 : -1.1;
    me.bean.root.rotation.y = Math.sin(t * 0.6) * 0.5;
    camera.position.set(me.pos.x + side, wide ? 2.0 : 2.6, me.pos.z + (wide ? 5.6 : 8.5));
    camera.lookAt(me.pos.x + side, lookY, me.pos.z);
    cam.target.set(me.pos.x + side, 1.15, me.pos.z);
    return;
  }
  if (cam.goalYaw !== null) {
    cam.yaw = angLerp(cam.yaw, cam.goalYaw, Math.min(1, dt * 2.2));
    if (Math.abs(Math.sin((cam.goalYaw - cam.yaw) / 2)) < 0.005) cam.goalYaw = null;
  }
  tmp.set(me.pos.x, me.y + 1.2, me.pos.z);
  cam.target.lerp(tmp, Math.min(1, dt * 6));
  const cp = Math.cos(cam.pitch);
  const want = new THREE.Vector3(
    cam.target.x + Math.sin(cam.yaw) * cp * cam.dist,
    cam.target.y + Math.sin(cam.pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * cp * cam.dist,
  );
  camera.position.lerp(want, Math.min(1, dt * 4));
  camera.lookAt(cam.target);
}

// ---------- minimapa ----------
const mm = document.getElementById('minimap');
const mctx = mm.getContext('2d');
const drawMinimap = () => drawMap(mctx, mm.width, mm.height, me);

// ---------- loop ----------
const clock = new THREE.Clock();
let t = 0; let frame = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt; frame++;
  if (mode === 'play') updateMe(dt);
  me.bean.animate(dt, me.speed, t, me.air);
  updateRemotes(dt, t);
  world.update(t, me.pos, camera.position, dt, [...remotes.values()].map((r) => r.bean.root.position));
  marker.material.opacity = Math.max(0, marker.material.opacity - dt * 1.6);
  marker.scale.setScalar(Math.max(0.6, marker.scale.x - dt));
  updateCamera(dt, t);
  renderer.render(scene, camera);
  if (mode === 'play') renderXray();
  labels.render(scene, camera);
  if (mode === 'play' && frame % 4 === 0) drawMinimap();
  requestAnimationFrame(tick);
}
tick();
