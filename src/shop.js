// Tienda: desbloquea accesorios y skins con los ⭐ ganados
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBean } from './bean.js';
import { store, storage } from './store.js';
import { sfx } from './audio.js';

export const SKINS = [
  { id: 'chef', e: '👨‍🍳', n: 'Chef', price: 250 },
  { id: 'pirate', e: '🏴‍☠️', n: 'Pirata', price: 350 },
  { id: 'ninja', e: '🥷', n: 'Ninja', price: 450 },
  { id: 'wizard', e: '🧙', n: 'Mago', price: 500 },
  { id: 'knight', e: '🛡️', n: 'Caballero', price: 600 },
  { id: 'astronaut', e: '👩‍🚀', n: 'Astronauta', price: 700 },
  { id: 'samurai', e: '⛩️', n: 'Samurái', price: 800 },
  { id: 'dragon', e: '🐉', n: 'Dragón', price: 1200 },
];
export const ACCS = [
  { id: 'party', e: '🥳', n: 'Gorro fiesta', price: 60 },
  { id: 'sunglasses', e: '🕶️', n: 'Gafas de sol', price: 90 },
  { id: 'cap', e: '🧢', n: 'Gorra', price: 120 },
  { id: 'bunny', e: '🐰', n: 'Orejas conejo', price: 150 },
  { id: 'tophat', e: '🎩', n: 'Chistera', price: 200 },
  { id: 'crown', e: '👑', n: 'Corona', price: 300 },
  { id: 'halo', e: '😇', n: 'Halo', price: 400 },
];
export const COLORS = ['#ff4fb4', '#ff7a2f', '#ffd23f', '#7ee36b', '#2fd4a7', '#3fb6ff', '#6b6bff', '#b06bff', '#ff5a5a', '#f4f1ff'];

export const owned = new Set(storage.get('ep-owned', []));
export const isOwned = (id) => id === 'none' || owned.has(id);

const $ = (s, r = document) => r.querySelector(s);

export function initShop({ getLook, onLook, spend, confetti }) {
  const el = $('#shop');
  const grid = $('.shop-grid', el);
  let tab = 'skin';
  let preview = null; // look que se está previsualizando

  // ---- vista previa 3D ----
  const canvas = $('.shop-preview canvas', el);
  let renderer = null; let scene; let camera; let bean; let raf = 0;
  const initGL = () => {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 1.5, 5.6);
    camera.lookAt(0, 1.15, 0);
    scene.add(new THREE.HemisphereLight('#e6dcff', '#ffcfa8', 1.0));
    const d = new THREE.DirectionalLight('#ffffff', 2.0); d.position.set(3, 5, 4); scene.add(d);
    const r = new THREE.DirectionalLight('#ff8fe0', 1.2); r.position.set(-4, 2, -3); scene.add(r);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.3, 40), new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: 0.4 }));
    ped.position.y = -0.15; scene.add(ped);
    bean = createBean(getLook());
    scene.add(bean.root);
  };
  const loop = (t0) => {
    const w = canvas.clientWidth; const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const t = t0 / 1000;
    bean.root.rotation.y = Math.sin(t * 0.7) * 0.9;
    bean.animate(0.016, 0, t, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  const showLook = (look) => { bean.setLook(look); };

  const items = () => (tab === 'skin' ? SKINS : ACCS);
  const render = () => {
    const look = getLook();
    $('.shop-pts', el).textContent = `⭐ ${store.points}`;
    el.querySelectorAll('.shop-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const cur = tab === 'skin' ? look.skin : look.acc;
    grid.innerHTML = items().map((it) => {
      const have = isOwned(it.id);
      const on = cur === it.id;
      const can = store.points >= it.price;
      const btn = on ? '<span class="sh-btn on">✓ Puesto</span>'
        : have ? '<span class="sh-btn equip">Ponerse</span>'
          : `<span class="sh-btn buy ${can ? '' : 'poor'}">⭐ ${it.price}</span>`;
      return `<button type="button" class="sh-item ${have ? 'have' : 'locked'} ${on ? 'on' : ''}" data-id="${it.id}">
        <span class="sh-e">${it.e}</span>${have ? '' : '<span class="sh-lock">🔒</span>'}
        <b>${it.n}</b>${btn}</button>`;
    }).join('');
    const hint = tab === 'acc' && look.skin !== 'none' ? '<p class="sh-note">Con una skin puesta los accesorios de cabeza no se ven.</p>' : '';
    grid.insertAdjacentHTML('beforeend', hint);
    $('.shop-colors', el).innerHTML = COLORS.map((c) => `<button type="button" class="sw ${look.color === c ? 'on' : ''}" style="--c:${c}" data-c="${c}"></button>`).join('');
  };

  grid.addEventListener('pointerover', (e) => {
    const b = e.target.closest('.sh-item'); if (!b) return;
    const look = getLook();
    preview = tab === 'skin' ? { ...look, skin: b.dataset.id } : { ...look, acc: b.dataset.id, skin: 'none' };
    showLook(preview);
  });
  grid.addEventListener('pointerleave', () => { preview = null; showLook(getLook()); });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.sh-item'); if (!b) return;
    const it = items().find((x) => x.id === b.dataset.id);
    const look = getLook();
    const key = tab === 'skin' ? 'skin' : 'acc';
    if (look[key] === it.id) { onLook({ ...look, [key]: 'none' }); sfx('click'); }
    else if (isOwned(it.id)) { onLook({ ...look, [key]: it.id, ...(key === 'acc' ? { skin: 'none' } : {}) }); sfx('pop'); }
    else if (store.points >= it.price) {
      spend(it.price);
      owned.add(it.id); storage.set('ep-owned', [...owned]);
      onLook({ ...look, [key]: it.id, ...(key === 'acc' ? { skin: 'none' } : {}) });
      sfx('win'); confetti();
      b.classList.add('bought');
    } else {
      sfx('bad');
      b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
      flash(`Te faltan ${it.price - store.points} ⭐. ¡Practica o compite en las aulas!`);
      return;
    }
    showLook(getLook());
    render();
  });
  el.querySelector('.shop-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { tab = b.dataset.tab; sfx('click'); render(); } });
  $('.shop-colors', el).addEventListener('click', (e) => {
    const b = e.target.closest('.sw'); if (!b) return;
    onLook({ ...getLook(), color: b.dataset.c }); sfx('pop'); showLook(getLook()); render();
  });
  const flash = (msg) => { const n = $('.shop-msg', el); n.textContent = msg; n.classList.add('show'); clearTimeout(n._h); n._h = setTimeout(() => n.classList.remove('show'), 2400); };

  const close = () => { el.hidden = true; store.uiOpen = false; cancelAnimationFrame(raf); store.emit('overlay'); };
  $('.shop-close', el).onclick = close;
  el.addEventListener('pointerdown', (e) => { if (e.target === el) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) close(); });

  return {
    open() {
      if (store.uiOpen) return;
      store.uiOpen = true; el.hidden = false; sfx('whoosh');
      if (!renderer) initGL();
      showLook(getLook()); render();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      store.emit('overlay');
    },
  };
}
