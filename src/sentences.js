// Frases de cada pregunta (módulo puro, lo usan cliente y servidor)
export function answers(q) {
  if (q.t === 'order') return q.words.split(' ');
  if (q.t === 'type') return [q.a[0]];
  if (q.t === 'choose') return [q.a];
  return q.a;
}
export function fullSentence(q) {
  if (q.t === 'order') return q.words + (q.p || '.');
  const ans = answers(q); let i = 0;
  return q.q.replace(/___/g, () => ans[i++] ?? '');
}
// texto que se manda al sintetizador (sin emojis ni pistas entre paréntesis)
export function cleanSpeech(text) {
  return String(text).replace(/\p{Extended_Pictographic}/gu, '').replace(/️/g, '').replace(/\(.*?\)/g, '')
    .replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().slice(0, 240);
}
