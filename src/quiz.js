// Motor de preguntas: choose / type / drag / order
import { speak, sfx, prefetch } from './audio.js';
import { answers, fullSentence } from './sentences.js';
import { generate } from './generators.js';

export { fullSentence };

export const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// Mezcla preguntas del banco con preguntas generadas, variando el tipo
// y evitando las frases que el jugador ha visto hace poco en esa aula.
const SEEN_MAX = 80;
const seenKey = (id) => `ep-seen-${id}`;
const loadSeen = (id) => { try { return new Set(JSON.parse(localStorage.getItem(seenKey(id)) || '[]')); } catch { return new Set(); } };
const saveSeen = (id, set) => { try { localStorage.setItem(seenKey(id), JSON.stringify([...set].slice(-SEEN_MAX))); } catch { /* sin storage */ } };

export function pickQuestions(zone, n) {
  const seen = loadSeen(zone.id);
  const bank = shuffle(zone.questions);
  const out = []; const used = new Set();
  const types = shuffle(['choose', 'type', 'drag', 'order']);
  const tplCount = new Map(); // ninguna plantilla más de 2 veces por ronda
  for (let tries = 0; out.length < n && tries < n * 40; tries++) {
    const want = types[out.length % types.length];
    let q = null;
    if (Math.random() < 0.7) q = generate(zone.id, want, new Set([...tplCount].filter(([, c]) => c >= 2).map(([t]) => t)));
    if (!q) q = bank.find((x) => x.t === want && !used.has(fullSentence(x))) || bank.find((x) => !used.has(fullSentence(x)));
    if (!q) continue;
    const key = fullSentence(q);
    if (used.has(key)) continue;
    if (seen.has(key) && tries < n * 25) continue; // las vistas hace poco, solo si no queda otra
    used.add(key); out.push(q);
    if (q.tpl) tplCount.set(q.tpl, (tplCount.get(q.tpl) || 0) + 1);
  }
  for (const k of used) { seen.delete(k); seen.add(k); }
  saveSeen(zone.id, seen);
  return out;
}

const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LABEL = {
  choose: '👆 Elige la palabra que va en el hueco',
  type: '⌨️ Escribe la forma correcta',
  drag: '✋ Arrastra las palabras a los huecos',
  order: '🧩 Ordena la frase (arrastra o toca)',
};

// silent = modo examen: no se marca si está bien o mal hasta el final
export function renderQuestion(el, q, { onAnswer, autoSpeak = true, silent = false } = {}) {
  let done = false;
  const mark = !silent;
  el.innerHTML = `
    <div class="q q-${q.t}">
      <div class="q-kind">${LABEL[q.t]}</div>
      <div class="q-sentence"></div>
      <div class="q-controls"></div>
      <div class="q-feedback" hidden></div>
    </div>`;
  prefetch(fullSentence(q));
  const sentence = el.querySelector('.q-sentence');
  const controls = el.querySelector('.q-controls');
  const feedback = el.querySelector('.q-feedback');

  const finish = (ok, timeout = false, given = '') => {
    if (done) return; done = true;
    if (silent) { sfx('pop'); el.querySelector('.q').classList.add('is-sent'); onAnswer?.(ok, given); return; }
    sfx(ok ? 'ok' : 'bad');
    el.querySelector('.q').classList.add(ok ? 'is-ok' : 'is-bad');
    const full = fullSentence(q);
    feedback.hidden = false;
    feedback.innerHTML = `
      <div class="fb-title">${ok ? '✅ ¡Correcto!' : timeout ? '⏰ ¡Se acabó el tiempo!' : '❌ ¡Casi!'}</div>
      ${q.tip ? `<div class="fb-tip">💡 ${esc(q.tip)}</div>` : ''}
      <button class="fb-listen" type="button"><span>🔊</span> <span class="fb-sent">${esc(full)}</span></button>
      <div class="fb-hint">Pulsa para escuchar la pronunciación</div>`;
    feedback.querySelector('.fb-listen').onclick = () => speak(full);
    if (autoSpeak) setTimeout(() => speak(full), 250);
    onAnswer?.(ok);
  };

  if (q.t === 'choose') {
    sentence.innerHTML = esc(q.q).replace('___', '<span class="gap">&nbsp;?&nbsp;</span>');
    const gap = sentence.querySelector('.gap');
    shuffle(q.opts).forEach((opt) => {
      const b = document.createElement('button');
      b.className = 'opt'; b.type = 'button'; b.textContent = opt;
      b.onclick = () => {
        if (done) return;
        const ok = opt === q.a;
        controls.querySelectorAll('.opt').forEach((x) => { x.disabled = true; if (mark && x.textContent === q.a) x.classList.add('right'); });
        if (mark) { if (!ok) b.classList.add('wrong'); gap.textContent = q.a; gap.classList.add(ok ? 'right' : 'fixed'); } else { b.classList.add('picked'); gap.textContent = opt; }
        finish(ok, false, opt);
      };
      controls.appendChild(b);
    });
  }

  if (q.t === 'type') {
    sentence.innerHTML = esc(q.q).replace('___', '<input class="gap-input" autocomplete="off" autocapitalize="off" spellcheck="false" />') +
      (q.hint ? ` <span class="hint">(${esc(q.hint)})</span>` : '');
    const input = sentence.querySelector('input');
    input.style.width = Math.max(5, Math.max(...q.a.map((a) => a.length)) + 2) + 'ch';
    const btn = document.createElement('button');
    btn.className = 'btn btn-check'; btn.type = 'button'; btn.textContent = silent ? 'Responder ▶' : 'Comprobar';
    controls.appendChild(btn);
    const check = () => {
      if (done || !input.value.trim()) return;
      const ok = q.a.some((a) => norm(a) === norm(input.value));
      input.disabled = true; btn.disabled = true;
      if (mark) {
        input.classList.add(ok ? 'right' : 'wrong');
        if (!ok) input.insertAdjacentHTML('afterend', `<span class="gap fixed">${esc(q.a[0])}</span>`);
      }
      finish(ok, false, input.value.trim());
    };
    btn.onclick = check;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); e.stopPropagation(); });
    setTimeout(() => input.focus(), 60);
  }

  if (q.t === 'drag' || q.t === 'order') {
    const target = answers(q);
    const bank = q.t === 'order' ? shuffle(q.words.split(' ')) : shuffle(q.bank);
    if (q.t === 'order') {
      sentence.innerHTML = target.map(() => '<span class="gap slot"></span>').join(' ') + `<span class="punct">${esc(q.p || '.')}</span>`;
    } else {
      sentence.innerHTML = esc(q.q).replace(/___/g, '<span class="gap slot"></span>');
    }
    const gaps = [...sentence.querySelectorAll('.slot')];
    const bankEl = document.createElement('div'); bankEl.className = 'bank';
    const btn = document.createElement('button'); btn.className = 'btn btn-check'; btn.type = 'button'; btn.textContent = silent ? 'Responder ▶' : 'Comprobar'; btn.disabled = true;
    controls.append(bankEl, btn);
    const chips = bank.map((w, i) => {
      const c = document.createElement('button'); c.type = 'button';
      c.className = 'chip'; c.textContent = w; c.dataset.i = i;
      bankEl.appendChild(c); return c;
    });
    const refresh = () => { btn.disabled = gaps.some((g) => !g.dataset.i); };
    const place = (chip, gap) => {
      if (!gap || done) return;
      if (gap.dataset.i) chips[gap.dataset.i].classList.remove('used');
      gap.dataset.i = chip.dataset.i; gap.textContent = chip.textContent; gap.classList.add('filled');
      chip.classList.add('used'); sfx('pop'); refresh();
    };
    gaps.forEach((g) => g.addEventListener('click', () => {
      if (done || !g.dataset.i) return;
      chips[g.dataset.i].classList.remove('used');
      delete g.dataset.i; g.textContent = ''; g.classList.remove('filled'); refresh();
    }));
    chips.forEach((chip) => chip.addEventListener('pointerdown', (e) => {
      if (done || chip.classList.contains('used')) return;
      e.preventDefault();
      const sx = e.clientX; const sy = e.clientY; let ghost = null; let hover = null;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
          ghost = chip.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); chip.classList.add('dragging');
        }
        if (ghost) {
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.slot');
          if (hover !== over) { hover?.classList.remove('over'); hover = gaps.includes(over) ? over : null; hover?.classList.add('over'); }
        }
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        hover?.classList.remove('over'); chip.classList.remove('dragging');
        if (ghost) {
          ghost.remove();
          const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.slot');
          if (gaps.includes(over)) place(chip, over);
        } else {
          place(chip, gaps.find((g) => !g.dataset.i));
        }
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    }));
    btn.onclick = () => {
      if (done) return;
      let ok = true;
      gaps.forEach((g, i) => {
        const good = norm(g.textContent) === norm(target[i]);
        if (!good) ok = false;
        if (mark) g.classList.add(good ? 'right' : 'wrong');
      });
      btn.disabled = true;
      chips.forEach((c) => { c.disabled = true; });
      if (mark && !ok) sentence.insertAdjacentHTML('afterend', `<div class="correct-line">✔ ${esc(fullSentence(q))}</div>`);
      finish(ok, false, gaps.map((g) => g.textContent).join(' '));
    };
  }

  return {
    timeout() {
      if (done) return;
      el.querySelectorAll('button, input').forEach((b) => { b.disabled = true; });
      const ans = answers(q).join(' / ');
      sentence.insertAdjacentHTML('afterend', `<div class="correct-line">✔ ${esc(q.t === 'order' ? fullSentence(q) : ans)}</div>`);
      finish(false, true);
    },
    get done() { return done; },
  };
}
