// UI: creador, HUD, tarjeta de aula y modal (aprender / practicar / competir)
import { ZONES, ZONE_BY_ID } from './content.js';
import { store, storage } from './store.js';
import { net } from './net.js';
import { speak, sfx, prefetch, stopSpeaking, VOICES, getVoice, setVoice, neuralVoice, VOICE } from './audio.js';
import { renderQuestion, pickQuestions } from './quiz.js';
import { mysteryBoxes, cupGame } from './minigames.js';
import { progress, ROADMAP, PASS, EXAM_Q } from './progress.js';
import { fullSentence } from './sentences.js';

import { COLORS, isOwned } from './shop.js';
const MATCH_Q = 9;
const Q_TIME = 25;

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function randomName() {
  return pick(['Jelly', 'Turbo', 'Happy', 'Bouncy', 'Sir', 'Captain', 'Lady', 'Mega', 'Tiny', 'Wobbly']) +
    pick(['Bean', 'Knight', 'Robot', 'Pirate', 'Panda', 'Wizard', 'Noodle', 'Star']) + Math.floor(Math.random() * 90 + 10);
}
const SCHOOL_GRAD = 'linear-gradient(135deg,#4b1fb8 0%,#ff6fa8 55%,#ffd23f 100%)';
const badge = (t) => (t ? `<span class="mc-badge">${t}</span>` : '');
const starsHtml = (n) => `<span class="stars-mini">${[0, 1, 2].map((k) => `<i class="${k < n ? 'on' : ''}">★</i>`).join('')}</span>`;
const avatar = (p, size = 26) => `<span class="ava" style="--c:${p.color};width:${size}px;height:${size * 1.25}px"><i></i></span>`;

export function initUI({ onPreview, onStart, onEmote, onGo }) {
  // ---------------- creador ----------------
  const profile = { name: randomName(), color: pick(COLORS), acc: 'none', skin: 'none', ...storage.get('ep-profile', {}) };
  if (!isOwned(profile.acc)) profile.acc = 'none';
  if (!isOwned(profile.skin)) profile.skin = 'none';
  const creator = $('#creator');
  const nameIn = $('#cr-name');
  nameIn.value = profile.name;
  $('#cr-colors').innerHTML = COLORS.map((c) => `<button type="button" class="sw" style="--c:${c}" data-c="${c}" aria-label="Color ${c}"></button>`).join('');
  const syncCreator = () => {
    creator.querySelectorAll('.sw').forEach((b) => b.classList.toggle('on', b.dataset.c === profile.color));
    onPreview({ ...profile });
  };
  creator.addEventListener('click', (e) => {
    const sw = e.target.closest('.sw');
    if (sw) { profile.color = sw.dataset.c; sfx('pop'); syncCreator(); }
  });
  $('#cr-rand').onclick = () => { nameIn.value = randomName(); sfx('click'); };
  nameIn.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') $('#cr-go').click(); });
  $('#cr-go').onclick = () => {
    profile.name = nameIn.value.replace(/[<>&"]/g, '').trim().slice(0, 14) || randomName();
    storage.set('ep-profile', profile);
    sfx('win');
    document.activeElement?.blur?.();
    creator.classList.add('leaving');
    setTimeout(() => { creator.hidden = true; $('#hud').hidden = false; }, 450);
    $('#me-name').textContent = profile.name;
    $('.me-dot').style.background = profile.color;
    onStart({ ...profile });
  };

  // ---------------- HUD ----------------
  store.points = storage.get('ep-points', 0);
  const setPts = () => { $('#me-pts').textContent = `⭐ ${store.points}`; };
  setPts();
  const addPoints = (n) => {
    store.points = Math.max(0, store.points + Math.round(n)); storage.set('ep-points', store.points); setPts();
    const el = $('#me-pts'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  };
  $('.emotes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { onEmote(b.textContent); sfx('pop'); } });
  store.on('online', (on) => { $('.online').classList.toggle('off', !on); });
  store.on('toast', (m) => toast(m));
  store.on('overlay', () => renderCard());
  const toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
  };

  const inZone = (id) => [...store.players.values()].filter((p) => p.zone === id);
  const refreshOnline = () => {
    const n = store.players.size + 1;
    $('#online-count').textContent = !store.online ? 'sin conexión' : store.offlineDemo ? `${n} en la isla · demo` : `${n} online`;
  };

  // ---------------- tarjeta de aula ----------------
  const card = $('#zone-card');
  let cardKey = '';
  const renderCard = () => {
    const z = ZONE_BY_ID[store.zone];
    if (!z && store.atSchool && !store.uiOpen) {
      if (cardKey === 'school' && !card.hidden) return;
      cardKey = 'school'; card.hidden = false;
      card.style.setProperty('--g', SCHOOL_GRAD);
      card.innerHTML = `
        <div class="zc-emoji">🏫</div>
        <div class="zc-info"><div class="zc-k">Hall del colegio</div><div class="zc-t">English Party School</div>
        <div class="zc-who"><span>🗺️ Tu roadmap · ${progress.count()}/${ROADMAP.flatMap((l) => l.zones).length} aulas dominadas</span></div></div>
        <button class="btn btn-primary zc-go" type="button">Entrar <kbd>E</kbd></button>`;
      card.querySelector('.zc-go').onclick = () => openSchool();
      return;
    }
    if (!z || store.uiOpen) { card.hidden = true; cardKey = ''; return; }
    const who = inZone(z.id);
    const key = z.id + who.map((p) => p.id).join();
    if (key === cardKey && !card.hidden) return;
    cardKey = key;
    card.hidden = false;
    card.style.setProperty('--g', z.grad);
    card.innerHTML = `
      <div class="zc-emoji">${z.emoji}</div>
      <div class="zc-info">
        <div class="zc-k">${esc(z.short)}</div>
        <div class="zc-t">${esc(z.name)}</div>
        <div class="zc-who">${who.length ? `${who.slice(0, 6).map((p) => avatar(p, 16)).join('')} <span>${who.length} en el aula</span>` : '<span>Nadie más aquí… ¡aún!</span>'}</div>
      </div>
      <button class="btn btn-primary zc-go" type="button">Entrar <kbd>E</kbd></button>`;
    card.querySelector('.zc-go').onclick = () => openZone(z.id);
  };

  // ---------------- modal ----------------
  const modal = $('#modal');
  const body = $('.m-body');
  let cleanup = [];
  let session = null; // partida de competición activa
  const resetView = () => { cleanup.forEach((f) => f()); cleanup = []; stopSpeaking(); };
  const listen = (ev, f) => cleanup.push(store.on(ev, f));

  function openZone(id) {
    const z = ZONE_BY_ID[id];
    if (!z) return;
    store.uiOpen = true;
    renderCard();
    sfx('whoosh');
    modal.hidden = false;
    modal.classList.remove('closing');
    $('.modal-box').style.setProperty('--g', z.grad);
    $('.m-emoji').textContent = z.emoji;
    $('.m-kicker').textContent = z.short;
    $('.m-title').textContent = z.name;
    viewMenu(z);
  }
  function closeModal() {
    if (session) { net.send('cleave', { zone: session.zone }); session.stop(); session = null; }
    resetView();
    modal.classList.add('closing');
    setTimeout(() => { modal.hidden = true; store.uiOpen = false; renderCard(); }, 220);
  }
  $('.m-close').onclick = closeModal;
  $('.m-back').onclick = () => {
    if (session) { net.send('cleave', { zone: session.zone }); session.stop(); session = null; }
    viewMenu(ZONE_BY_ID[store.modalZone]);
  };
  modal.addEventListener('pointerdown', (e) => { if (e.target === modal) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  const renderPresence = (z) => {
    const who = inZone(z.id);
    $('.m-presence').innerHTML = who.length
      ? `${who.slice(0, 5).map((p) => avatar(p, 18)).join('')}<span>${who.length} aquí</span>` : '';
  };

  function viewMenu(z) {
    resetView();
    const pr = progress.get(z.id);
    store.modalZone = z.id;
    $('.m-back').hidden = true;
    renderPresence(z);
    listen('presence', () => renderPresence(z));
    body.innerHTML = `
      <p class="m-topic">${esc(z.topic)}</p>
      <div class="voice-row" ${VOICE ? '' : 'hidden'}><span>🔊 Voz para la pronunciación:</span>${VOICES.map((v) => `<button type="button" class="vchip ${v.id === getVoice() ? 'on' : ''}" data-v="${v.id}">${v.n}</button>`).join('')}</div>
      <div class="menu-cards four">
        <button class="mc mc-learn" type="button"><span class="mc-n">1</span>${badge(pr.theory ? '✓ Vista' : '')}<span class="mc-e">📖</span><b>Aprender teoría</b><small>Explicaciones cortas con ejemplos que puedes escuchar</small></button>
        <button class="mc mc-practice" type="button"><span class="mc-n">2</span>${badge(pr.practiceBest ? `Mejor ${Math.round(pr.practiceBest * 100)}%` : '')}<span class="mc-e">✏️</span><b>Practicar</b><small>8 preguntas sin prisa, con pistas y corrección</small></button>
        <button class="mc mc-exam" type="button"><span class="mc-n">3</span>${badge(pr.passed ? `✓ Aprobado ${Math.round(pr.examBest * 100)}%` : pr.examBest ? `Mejor ${Math.round(pr.examBest * 100)}%` : '')}<span class="mc-e">📝</span><b>Examen</b><small>${EXAM_Q} preguntas sin pistas. Apruébalo para dominar el aula</small></button>
        <button class="mc mc-compete" type="button"><span class="mc-n">4</span>${badge(pr.competeBest ? `Récord ${pr.competeBest}` : '')}<span class="mc-e">🏆</span><b>Competir</b><small>Contra la gente del aula y el ranking. ¡Con cajas y trile!</small></button>
      </div>
      <div class="mastery">${starsHtml(progress.stars(z.id))}<span>${progress.mastered(z.id) ? '🎓 ¡Aula dominada!' : 'Para dominar el aula: ver la teoría y aprobar el examen'}</span></div>`;
    neuralVoice.then((on) => { const r = body.querySelector('.voice-row'); if (r && !on) r.hidden = true; });
    body.querySelectorAll('.vchip').forEach((c) => { c.onclick = () => {
      setVoice(c.dataset.v); body.querySelectorAll('.vchip').forEach((x) => x.classList.toggle('on', x === c));
      speak('Hello! Let\'s learn English together.');
    }; });
    body.querySelector('.mc-learn').onclick = () => viewLearn(z);
    body.querySelector('.mc-practice').onclick = () => viewPractice(z);
    body.querySelector('.mc-compete').onclick = () => viewLobby(z);
    body.querySelector('.mc-exam').onclick = () => viewExam(z);
  }
  const subView = () => { resetView(); $('.m-back').hidden = false; };

  // ---------- aprender ----------
  function viewLearn(z, i = 0) {
    subView();
    const s = z.theory[i];
    const last = i === z.theory.length - 1;
    if (last) progress.theory(z.id);
    body.innerHTML = `
      <div class="learn">
        <div class="learn-card">
          <div class="learn-n">${i + 1} / ${z.theory.length}</div>
          <h3>${esc(s.title)}</h3>
          <div class="learn-body">${s.body}</div>
          <div class="learn-ex">${s.ex.map((e) => `${VOICE ? `<button type="button" class="ex" data-t="${esc(e)}"><span>🔊</span>${esc(e)}</button>` : `<div class="ex ex-static"><span>💬</span>${esc(e)}</div>`}`).join('')}</div>
        </div>
        <div class="learn-nav">
          <button class="btn btn-ghost" type="button" ${i === 0 ? 'disabled' : ''} data-go="-1">◀ Anterior</button>
          <div class="dots">${z.theory.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
          <button class="btn btn-primary" type="button" data-go="1">${last ? '¡A practicar! ✏️' : 'Siguiente ▶'}</button>
        </div>
      </div>`;
    body.querySelectorAll('.ex').forEach((b) => { prefetch(b.dataset.t); b.onclick = () => speak(b.dataset.t); });
    body.querySelector('[data-go="-1"]').onclick = () => viewLearn(z, i - 1);
    body.querySelector('[data-go="1"]').onclick = () => (last ? viewPractice(z) : viewLearn(z, i + 1));
  }

  // ---------- practicar ----------
  function viewPractice(z) {
    subView();
    const qs = pickQuestions(z, 8);
    const res = [];
    let i = 0;
    const step = () => {
      body.innerHTML = `
        <div class="practice">
          <div class="prog">${qs.map((_, k) => `<i class="${res[k] === true ? 'ok' : res[k] === false ? 'ko' : k === i ? 'cur' : ''}"></i>`).join('')}</div>
          <div class="qhost"></div>
          <div class="q-foot"></div>
        </div>`;
      renderQuestion(body.querySelector('.qhost'), qs[i], {
        onAnswer: (ok) => {
          res[i] = ok;
          if (ok) addPoints(10);
          body.querySelectorAll('.prog i')[i].className = ok ? 'ok' : 'ko';
          const foot = body.querySelector('.q-foot');
          foot.innerHTML = `<button class="btn btn-primary" type="button">${i < qs.length - 1 ? 'Siguiente ▶' : 'Ver resultado 🎉'}</button>`;
          foot.querySelector('button').onclick = () => { i++; i < qs.length ? step() : summary(); };
        },
      });
    };
    const summary = () => {
      const ok = res.filter(Boolean).length;
      progress.practice(z.id, ok, qs.length);
      const stars = ok >= 7 ? 3 : ok >= 5 ? 2 : ok >= 3 ? 1 : 0;
      if (stars >= 2) { sfx('win'); confetti(); }
      body.innerHTML = `
        <div class="summary">
          <div class="stars">${[0, 1, 2].map((k) => `<span class="${k < stars ? 'on' : ''}">★</span>`).join('')}</div>
          <h3>${ok} / ${qs.length} correctas</h3>
          <p>${stars === 3 ? '¡Brutal! Ya estás listo para competir.' : stars === 2 ? '¡Muy bien! Un poco más y lo bordas.' : 'Repasa la teoría y vuelve a intentarlo 💪'}</p>
          <p class="earned">+${ok * 10} ⭐</p>
          <div class="row">
            <button class="btn btn-ghost" type="button" data-a="learn">📖 Teoría</button>
            <button class="btn btn-ghost" type="button" data-a="again">🔁 Otra ronda</button>
            <button class="btn btn-primary" type="button" data-a="compete">🏆 Competir</button>
          </div>
        </div>`;
      body.querySelector('[data-a=learn]').onclick = () => viewLearn(z);
      body.querySelector('[data-a=again]').onclick = () => viewPractice(z);
      body.querySelector('[data-a=compete]').onclick = () => viewLobby(z);
    };
    step();
  }

  // ---------- competir ----------
  const renderLive = (el, zid) => {
    const entries = [...(store.live[zid] || [])].sort((a, b) => b.score - a.score);
    el.innerHTML = entries.length ? entries.map((e) => `
      <div class="lv ${e.id === store.myId ? 'me' : ''} ${e.done ? 'done' : ''}">
        ${avatar(e, 16)}
        <span class="lv-n">${esc(e.name)}${e.id === store.myId ? ' (tú)' : ''}${e.bot ? ' <em>bot</em>' : ''}</span>
        <span class="lv-bar"><i style="width:${(e.progress / MATCH_Q) * 100}%"></i></span>
        <b>${e.score}</b>${e.done ? '🏁' : ''}
      </div>`).join('') : '<div class="empty">Nadie compitiendo ahora mismo</div>';
  };
  const renderBoard = (el, zid, hl) => {
    const b = store.boards[zid] || [];
    el.innerHTML = b.slice(0, 10).map((e, k) => `
      <li class="${hl && e.name === hl.name && e.score === hl.score ? 'me' : ''}">
        <span class="pos">${['🥇', '🥈', '🥉'][k] || k + 1}</span>${avatar(e, 14)}<span class="bn">${esc(e.name)}</span><b>${e.score}</b>
      </li>`).join('') || '<li class="empty">Sin conexión con el servidor</li>';
  };

  function viewLobby(z) {
    subView();
    body.innerHTML = `
      <div class="lobby">
        <div class="lobby-main">
          <h3>🏆 Competición</h3>
          <ul class="rules">
            <li>❓ <b>${MATCH_Q} preguntas</b> de los 4 tipos, ${Q_TIME}s cada una</li>
            <li>✅ <b>+100</b> por acierto y hasta <b>+50</b> por rapidez</li>
            <li>🔥 Racha de aciertos: <b>+25</b> extra por cada una</li>
            <li>🎁 Tras la 3ª: <b>caja misteriosa</b> · 🥤 Tras la 6ª: <b>el trile</b></li>
            ${VOICE ? '<li>🔊 Después de cada respuesta puedes escuchar la frase</li>' : ''}
          </ul>
          <button class="btn btn-primary btn-xl start" type="button">¡Empezar partida! ▶</button>
        </div>
        <div class="lobby-side">
          <h4>👥 En el aula ahora</h4><div class="who"></div>
          <h4>⚡ Compitiendo en directo</h4><div class="live-list"></div>
          <h4>🏅 Ranking del aula</h4><ol class="board"></ol>
        </div>
      </div>`;
    const who = body.querySelector('.who');
    const drawWho = () => {
      const list = inZone(z.id);
      who.innerHTML = `<span class="chip-p me">${avatar(store.profile, 16)}${esc(store.profile.name)} (tú)</span>` +
        list.map((p) => `<span class="chip-p">${avatar(p, 16)}${esc(p.name)}</span>`).join('');
    };
    drawWho(); listen('presence', drawWho);
    renderLive(body.querySelector('.live-list'), z.id); listen('live', (zid) => zid === z.id && renderLive(body.querySelector('.live-list'), z.id));
    renderBoard(body.querySelector('.board'), z.id); listen('board', (zid) => zid === z.id && renderBoard(body.querySelector('.board'), z.id));
    body.querySelector('.start').onclick = () => playMatch(z);
  }

  async function playMatch(z) {
    subView();
    const qs = pickQuestions(z, MATCH_Q);
    let score = 0; let streak = 0; let i = 0; let timer = null; let alive = true;
    session = { zone: z.id, stop() { alive = false; clearInterval(timer); } };
    net.send('cjoin', { zone: z.id });
    body.innerHTML = `
      <div class="game">
        <div class="game-main">
          <div class="game-top">
            <span class="g-q">1 / ${MATCH_Q}</span>
            <span class="g-timer"><i></i></span>
            <span class="g-streak"></span>
            <span class="g-score">0</span>
          </div>
          <div class="g-stage"></div>
          <div class="q-foot"></div>
        </div>
        <aside class="game-side"><h4>⚡ En directo</h4><div class="live-list"></div></aside>
      </div>`;
    const stage = body.querySelector('.g-stage');
    const foot = body.querySelector('.q-foot');
    const liveEl = body.querySelector('.live-list');
    renderLive(liveEl, z.id); listen('live', (zid) => zid === z.id && renderLive(liveEl, z.id));
    const setScore = (delta) => {
      score = Math.max(0, score + delta);
      const el = body.querySelector('.g-score'); el.textContent = score;
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
      if (delta) floatDelta(body.querySelector('.game-top'), delta);
      net.send('cscore', { zone: z.id, score, progress: i });
    };

    // cuenta atrás
    for (const n of ['3', '2', '1', 'GO!']) {
      if (!alive) return;
      stage.innerHTML = `<div class="countdown">${n}</div>`;
      sfx(n === 'GO!' ? 'win' : 'tick');
      await wait(700);
    }

    const ask = () => new Promise((resolve) => {
      body.querySelector('.g-q').textContent = `${i + 1} / ${MATCH_Q}`;
      foot.innerHTML = '';
      let left = Q_TIME;
      const bar = body.querySelector('.g-timer i');
      bar.style.width = '100%'; bar.className = '';
      const q = renderQuestion(stage, qs[i], {
        onAnswer: (ok) => {
          clearInterval(timer);
          if (ok) {
            streak++;
            const pts = 100 + Math.round((left / Q_TIME) * 50) + (streak > 1 ? Math.min(100, (streak - 1) * 25) : 0);
            i++; setScore(pts);
          } else { streak = 0; i++; setScore(0); }
          body.querySelector('.g-streak').textContent = streak > 1 ? `🔥 x${streak}` : '';
          foot.innerHTML = `<button class="btn btn-primary" type="button">${i < MATCH_Q ? 'Siguiente ▶' : 'Ver resultado 🏁'}</button>`;
          foot.querySelector('button').onclick = resolve;
        },
      });
      timer = setInterval(() => {
        left = Math.max(0, left - 0.1);
        bar.style.width = `${(left / Q_TIME) * 100}%`;
        if (left < 6) bar.className = 'hot';
        if (left <= 0) { clearInterval(timer); q.timeout(); }
      }, 100);
    });
    const bonus = (fn) => new Promise((resolve) => {
      foot.innerHTML = '';
      fn(stage, (v) => { setScore(v); resolve(); });
    });

    while (i < MATCH_Q && alive) {
      await ask();
      if (!alive) return;
      if (i === 3) await bonus(mysteryBoxes);
      if (i === 6) await bonus(cupGame);
    }
    if (!alive) return;

    // resultado
    net.send('cfinish', { zone: z.id, score });
    session = null;
    addPoints(score / 5);
    progress.compete(z.id, score);
    sfx('win'); confetti();
    foot.innerHTML = '';
    body.querySelector('.game-main').innerHTML = `
      <div class="summary">
        <div class="trophy">🏆</div>
        <h3>${score} puntos</h3>
        <p class="rank">Calculando tu posición…</p>
        <p class="earned">+${Math.round(score / 5)} ⭐ para la tienda 🛍️</p>
        <ol class="board"></ol>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-a="map">🗺️ Volver al mapa</button>
          <button class="btn btn-primary" type="button" data-a="again">🔁 Revancha</button>
        </div>
      </div>`;
    const me = { name: store.profile.name, score };
    renderBoard(body.querySelector('.board'), z.id, me);
    listen('board', (zid) => zid === z.id && renderBoard(body.querySelector('.board'), z.id, me));
    listen('ranked', (m) => {
      if (m.zone !== z.id) return;
      body.querySelector('.rank').innerHTML = m.rank > 0 ? `Has quedado <b>#${m.rank}</b> en el ranking de ${esc(z.name)}` : '¡Sigue intentándolo para entrar en el top!';
    });
    if (!store.online) body.querySelector('.rank').textContent = 'Sin conexión: la puntuación no se ha subido al ranking';
    body.querySelector('[data-a=map]').onclick = closeModal;
    body.querySelector('[data-a=again]').onclick = () => playMatch(z);
  }

  // ---------- examen ----------
  function viewExam(z) {
    subView();
    const pr = progress.get(z.id);
    body.innerHTML = `
      <div class="exam-intro">
        <div class="exam-icon">📝</div>
        <h3>Examen · ${esc(z.short)}</h3>
        <ul class="rules">
          <li>❓ <b>${EXAM_Q} preguntas</b> nuevas de todos los tipos</li>
          <li>🤫 Sin pistas ni corrección hasta el final</li>
          <li>✅ Apruebas con un <b>${Math.round(PASS * 100)}%</b> · +100 ⭐ la primera vez</li>
          <li>🎓 Teoría vista + examen aprobado = <b>aula dominada</b> en tu roadmap</li>
        </ul>
        ${pr.theory ? '' : '<p class="warn">💡 Aún no has visto la teoría de esta aula. Puedes hacer el examen, pero para dominarla tendrás que verla.</p>'}
        <button class="btn btn-primary btn-xl" type="button">Empezar examen ▶</button>
      </div>`;
    body.querySelector('.btn-xl').onclick = () => runExam(z);
  }
  function runExam(z) {
    subView();
    const qs = pickQuestions(z, EXAM_Q);
    const res = [];
    const step = (i) => {
      if (i >= qs.length) return examResult(z, res);
      body.innerHTML = `
        <div class="practice exam">
          <div class="exam-top"><span class="g-q">${i + 1} / ${qs.length}</span><span class="g-timer"><i style="width:${(i / qs.length) * 100}%"></i></span><span class="exam-tag">📝 Examen</span></div>
          <div class="qhost"></div>
        </div>`;
      renderQuestion(body.querySelector('.qhost'), qs[i], {
        silent: true, autoSpeak: false,
        onAnswer: (ok, given) => { res[i] = { q: qs[i], ok, given }; setTimeout(() => step(i + 1), 420); },
      });
    };
    step(0);
  }
  function examResult(z, res) {
    const ok = res.filter((r) => r.ok).length; const pct = ok / res.length;
    const first = progress.exam(z.id, pct);
    if (first) addPoints(100);
    const pass = pct >= PASS; const mastered = progress.mastered(z.id);
    if (pass) { sfx('win'); confetti(); } else sfx('bad');
    body.innerHTML = `
      <div class="exam-result ${pass ? 'pass' : 'fail'}">
        <div class="ring" style="--p:${pct * 100}"><b>${Math.round(pct * 100)}%</b><small>${ok}/${res.length}</small></div>
        <h3>${pass ? '¡Aprobado! 🎉' : 'Casi… ¡inténtalo otra vez!'}</h3>
        <p>${mastered ? '🎓 Has <b>dominado</b> esta aula. ¡Mírala en tu roadmap del colegio!' : pass ? '📖 Te falta ver la teoría para dominar el aula.' : `Necesitas un ${Math.round(PASS * 100)}% para aprobar.`}${first ? ' <b>+100 ⭐</b>' : ''}</p>
        <div class="row">
          <button class="btn btn-ghost" type="button" data-a="menu">◀ Menú del aula</button>
          <button class="btn btn-ghost" type="button" data-a="again">🔁 Repetir examen</button>
          <button class="btn btn-primary" type="button" data-a="road">🏫 Ver mi roadmap</button>
        </div>
        <h4>Repaso</h4>
        <div class="review">${res.map((r, i) => `
          <div class="rv ${r.ok ? 'ok' : 'ko'}">
            <span class="rv-i">${r.ok ? '✅' : '❌'}</span>
            <span class="rv-t"><b>${esc(fullSentence(r.q))}</b>${r.ok ? '' : `<small>Tu respuesta: ${esc(r.given || '—')}${r.q.tip ? ` · 💡 ${esc(r.q.tip)}` : ''}</small>`}</span>
            ${VOICE ? `<button class="rv-play" type="button" data-i="${i}">🔊</button>` : ''}
          </div>`).join('')}</div>
      </div>`;
    body.querySelectorAll('.rv-play').forEach((b) => { const t = fullSentence(res[b.dataset.i].q); prefetch(t); b.onclick = () => speak(t); });
    body.querySelector('[data-a=menu]').onclick = () => viewMenu(z);
    body.querySelector('[data-a=again]').onclick = () => viewExam(z);
    body.querySelector('[data-a=road]').onclick = () => openSchool();
  }

  // ---------- colegio: roadmap ----------
  function openSchool() {
    resetView();
    if (session) { net.send('cleave', { zone: session.zone }); session.stop(); session = null; }
    store.uiOpen = true; store.modalZone = null;
    renderCard(); sfx('whoosh');
    modal.hidden = false; modal.classList.remove('closing');
    $('.modal-box').style.setProperty('--g', SCHOOL_GRAD);
    $('.m-emoji').textContent = '🏫';
    $('.m-kicker').textContent = 'Hall del colegio';
    $('.m-title').textContent = 'Tu roadmap de inglés';
    $('.m-back').hidden = true; $('.m-presence').innerHTML = '';
    const total = ROADMAP.flatMap((l) => l.zones).length; const done = progress.count();
    const next = progress.next();
    const step = (on, label) => `<span class="${on ? 'on' : ''}">${label}</span>`;
    let n = 0;
    body.innerHTML = `
      <div class="rm">
        <div class="rm-top">
          <div class="rm-count"><b>${done}</b> / ${total} aulas dominadas</div>
          <div class="rm-bar"><i style="width:${(done / total) * 100}%"></i></div>
          ${next ? `<div class="rm-next">👉 Te recomiendo seguir con <b>${ZONE_BY_ID[next].emoji} ${esc(ZONE_BY_ID[next].short)}</b><button class="btn btn-primary" type="button" data-go="${next}">Ir ▶</button></div>` : '<div class="rm-next">🏆 ¡Lo has dominado todo! Eres una leyenda de English Party.</div>'}
        </div>
        ${ROADMAP.map((lv) => {
          const lvDone = lv.zones.every((id) => progress.mastered(id));
          return `<section class="rm-level ${lvDone ? 'done' : ''}">
            <div class="rm-lv"><span class="rm-badge">${lv.level}</span><b>${esc(lv.title)}</b>${lvDone ? '<span class="rm-cert">🎓 Nivel completado</span>' : ''}</div>
            <div class="rm-path">${lv.zones.map((id) => {
              const z = ZONE_BY_ID[id]; const p = progress.get(id); const st = progress.status(id); const side = n++ % 2;
              return `<div class="rm-node ${st} ${id === next ? 'next' : ''} ${side ? 'right' : ''}" style="--c:${z.color}">
                <div class="rm-circle"><span>${z.emoji}</span>${st === 'mastered' ? '<i class="rm-check">✓</i>' : ''}</div>
                <div class="rm-info">
                  <b>${esc(z.short)}</b><small>${esc(z.name)}</small>
                  <div class="rm-stars">${starsHtml(progress.stars(id))}</div>
                  <div class="rm-steps">${step(p.theory, '📖 Teoría')}${step((p.practiceBest || 0) >= 0.75, `✏️ Práctica${p.practiceBest ? ` ${Math.round(p.practiceBest * 100)}%` : ''}`)}${step(p.passed, `📝 Examen${p.examBest ? ` ${Math.round(p.examBest * 100)}%` : ''}`)}</div>
                </div>
                <button class="btn ${id === next ? 'btn-primary' : 'btn-ghost'} rm-go" type="button" data-go="${id}">Ir ▶</button>
              </div>`;
            }).join('')}</div>
          </section>`;
        }).join('')}
      </div>`;
    body.querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => { closeModal(); onGo?.(b.dataset.go); }; });
  }

  return {
    openSchool,
    showCreator() { $('#loading').classList.add('gone'); creator.hidden = false; syncCreator(); },
    setZone(id) {
      if (id && !store.uiOpen) { const z = ZONE_BY_ID[id]; toast(`${z.emoji} Has entrado en ${z.name}`); sfx('pop'); }
      renderCard();
    },
    presence() { refreshOnline(); renderCard(); },
    openZone,
    toast,
    addPoints,
    saveProfile(p) { Object.assign(profile, p); storage.set('ep-profile', profile); $('.me-dot').style.background = profile.color; },
    get modalOpen() { return !modal.hidden; },
  };
}

function floatDelta(host, v) {
  const d = document.createElement('div');
  d.className = `delta ${v > 0 ? 'good' : v < 0 ? 'bad' : ''}`;
  d.textContent = v > 0 ? `+${v}` : v < 0 ? `${v}` : '+0';
  host.appendChild(d);
  setTimeout(() => d.remove(), 1200);
}

export function confetti() {
  const cols = ['#ff4fb4', '#ffd23f', '#3fb6ff', '#7ee36b', '#b06bff', '#ff7a2f'];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    c.style.setProperty('--x', (Math.random() - 0.5) * 300 + 'px');
    c.style.setProperty('--r', Math.random() * 900 + 'deg');
    c.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}

export { ZONES };
