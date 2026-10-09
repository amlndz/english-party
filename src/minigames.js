// Minijuegos de bonus: cajas misteriosas y trile de vasos
import { sfx } from './audio.js';
import { shuffle } from './quiz.js';

const fmt = (v) => (v > 0 ? `+${v}` : `${v}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function mysteryBoxes(el, onDone) {
  const values = shuffle([200, 100, 50, -50, -100]);
  const colors = ['#ff4fb4', '#ffd23f', '#3fb6ff', '#7ee36b', '#b06bff'];
  el.innerHTML = `
    <div class="mg">
      <div class="mg-title">🎁 ¡Caja misteriosa!</div>
      <div class="mg-sub">Elige 1 de 5. Puede darte puntos… o quitártelos 😈</div>
      <div class="boxes">${values.map((_, i) => `
        <button class="mbox" style="--c:${colors[i]};--d:${i * 0.12}s" type="button">
          <span class="lid"></span><span class="ribbon"></span><span class="mq">?</span><span class="val"></span>
        </button>`).join('')}</div>
      <div class="mg-result"></div>
    </div>`;
  const boxes = [...el.querySelectorAll('.mbox')];
  let picked = false;
  boxes.forEach((b, i) => b.addEventListener('click', async () => {
    if (picked) return; picked = true;
    sfx('click');
    boxes.forEach((x) => { x.disabled = true; });
    b.classList.add('shake');
    await wait(700);
    b.classList.remove('shake');
    const v = values[i];
    b.classList.add('open', v >= 0 ? 'good' : 'bad', 'chosen');
    b.querySelector('.val').textContent = fmt(v);
    sfx(v >= 0 ? 'win' : 'bad');
    await wait(700);
    boxes.forEach((x, j) => { if (j !== i) { x.classList.add('open', 'faded'); x.querySelector('.val').textContent = fmt(values[j]); } });
    el.querySelector('.mg-result').innerHTML = `
      <div class="mg-big ${v >= 0 ? 'good' : 'bad'}">${fmt(v)} puntos</div>
      <button class="btn btn-primary" type="button">Continuar ▶</button>`;
    el.querySelector('.mg-result button').onclick = () => onDone(v);
  }));
}

export function cupGame(el, onDone) {
  const items = shuffle([{ k: 'gold', v: 150, e: '⭐' }, { k: 'bomb', v: -100, e: '💣' }, { k: 'none', v: 0, e: '' }]);
  el.innerHTML = `
    <div class="mg">
      <div class="mg-title">🥤 ¡El trile!</div>
      <div class="mg-sub">Sigue la <b>bola dorada ⭐ (+150)</b> y evita la <b>bomba 💣 (−100)</b></div>
      <div class="cups">${items.map((it, i) => `
        <div class="cupw" data-i="${i}" style="left:calc(${i} * var(--slot))">
          <div class="ball ${it.k}">${it.e}</div>
          <button class="cup up" type="button" disabled><span class="cup-rim"></span></button>
        </div>`).join('')}</div>
      <div class="mg-result"><div class="mg-status">Memoriza…</div></div>
    </div>`;
  const wraps = [...el.querySelectorAll('.cupw')];
  const cups = wraps.map((w) => w.querySelector('.cup'));
  const slots = [0, 1, 2]; // slots[i] = posición del vaso i
  const status = el.querySelector('.mg-status');
  const place = (dur) => wraps.forEach((w, i) => { w.style.transitionDuration = `${dur}ms`; w.style.left = `calc(${slots[i]} * var(--slot))`; });

  (async () => {
    await wait(1700);
    cups.forEach((c) => c.classList.remove('up'));
    sfx('pop');
    await wait(600);
    status.textContent = '¡Atento! 👀';
    let dur = 520;
    for (let s = 0; s < 8; s++) {
      const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 2); if (b >= a) b++;
      [slots[a], slots[b]] = [slots[b], slots[a]];
      wraps[a].classList.add('front'); wraps[b].classList.remove('front');
      place(dur); sfx('whoosh');
      await wait(dur + 60);
      wraps[a].classList.remove('front');
      dur = Math.max(260, dur - 40);
    }
    status.textContent = '¿Dónde está la bola dorada? Toca un vaso';
    cups.forEach((c) => { c.disabled = false; });
    let picked = false;
    cups.forEach((c, i) => c.addEventListener('click', async () => {
      if (picked) return; picked = true;
      cups.forEach((x) => { x.disabled = true; });
      c.classList.add('up'); wraps[i].classList.add('chosen');
      const it = items[i];
      sfx(it.v > 0 ? 'win' : it.v < 0 ? 'bad' : 'click');
      await wait(800);
      cups.forEach((x) => x.classList.add('up'));
      const msg = it.k === 'gold' ? '¡La seguiste! 🎯' : it.k === 'bomb' ? '¡BOOM! Te tocó la bomba 💥' : 'Vaso vacío… ¡ni ganas ni pierdes!';
      el.querySelector('.mg-result').innerHTML = `
        <div class="mg-status">${msg}</div>
        <div class="mg-big ${it.v > 0 ? 'good' : it.v < 0 ? 'bad' : ''}">${fmt(it.v)} puntos</div>
        <button class="btn btn-primary" type="button">Continuar ▶</button>`;
      el.querySelector('.mg-result button').onclick = () => onDone(it.v);
    }));
  })();
}
