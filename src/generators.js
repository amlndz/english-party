// Generadores de preguntas por tema: combinan vocabulario y plantillas para que
// cada ronda tenga frases distintas. Devuelven el mismo formato que content.js.
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const low = (s) => (/^(I|Jack|Anna|Tom|Luna|Max|Sir|Captain|Mount)\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const uniq = (arr) => [...new Set(arr)];
const opts = (a, ...wrong) => uniq([a, ...wrong.filter((w) => w && w !== a)]).slice(0, 4);
const words = (s) => s.split(' ').length;

// sujetos con su "persona" para concordancias
const SUBJ = {
  I: { be: 'am', pl: false, third: false, pron: 'I' },
  You: { be: 'are', pl: true, third: false, pron: 'you' },
  We: { be: 'are', pl: true, third: false, pron: 'we' },
  They: { be: 'are', pl: true, third: false, pron: 'they' },
  He: { be: 'is', pl: false, third: true, pron: 'he' },
  She: { be: 'is', pl: false, third: true, pron: 'she' },
};
const subj = (name, kind) => ({ name, ...SUBJ[kind] });
const pastBe = (s) => (s.pl ? 'were' : 'was');

// ---------------- PAST SIMPLE ----------------
const PAST_SUBJ = [subj('The knight', 'He'), subj('The queen', 'She'), subj('The king', 'He'), subj('The wizard', 'He'), subj('The princess', 'She'),
  subj('The dragon', 'He'), subj('The soldiers', 'They'), subj('My brother', 'He'), subj('We', 'We'), subj('I', 'I'), subj('The villagers', 'They'), subj('Sir Bean', 'He')];
const PAST_V = [
  ['go', 'went', ['to the castle', 'to the market', 'to the forest']], ['eat', 'ate', ['a huge pie', 'all the bread', 'a magic apple']],
  ['see', 'saw', ['a ghost', 'a dragon', 'a shooting star']], ['fight', 'fought', ['the dragon', 'a giant', 'the dark knight']],
  ['ride', 'rode', ['a white horse', 'a unicorn']], ['fly', 'flew', ['over the tower', 'to the mountains']],
  ['win', 'won', ['the tournament', 'the battle', 'a golden cup']], ['build', 'built', ['a bridge', 'a new tower']],
  ['sing', 'sang', ['a beautiful song', 'an old song']], ['take', 'took', ['the sword', 'the gold', 'the map']],
  ['buy', 'bought', ['a shield', 'a red cloak']], ['catch', 'caught', ['the thief', 'a big fish']], ['find', 'found', ['a secret door', 'the old key']],
  ['drink', 'drank', ['a strange potion', 'some water']], ['write', 'wrote', ['a letter', 'a poem']], ['break', 'broke', ['the window', 'the door']],
  ['lose', 'lost', ['the crown', 'the key']], ['make', 'made', ['a fire', 'a cake']], ['meet', 'met', ['a wizard', 'a talking cat']],
  ['play', 'played', ['the lute', 'chess']], ['visit', 'visited', ['the village', 'the old castle']], ['cook', 'cooked', ['dinner', 'a big soup']],
  ['open', 'opened', ['the gate', 'the treasure chest']], ['clean', 'cleaned', ['the armour', 'the stables']], ['watch', 'watched', ['the stars', 'the tournament']],
  ['carry', 'carried', ['the water', 'the heavy box']], ['stop', 'stopped', ['the cart', 'the thief']], ['study', 'studied', ['the old books', 'magic']],
  ['climb', 'climbed', ['the tower', 'the wall']], ['dance', 'danced', ['at the party', 'all night']],
];
const PAST_T = ['yesterday', 'last night', 'last week', 'two days ago', 'last summer', 'this morning', 'in 1066', 'a long time ago'];
const regularize = (b) => (b.endsWith('e') ? b + 'd' : b.endsWith('y') ? b.slice(0, -1) + 'ied' : b + 'ed');
const s3 = (b) => (b === 'have' ? 'has' : b === 'do' ? 'does' : b === 'go' ? 'goes' : /(s|sh|ch|x|o)$/.test(b) ? b + 'es' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ies' : b + 's');
const ing = (b) => (b === 'lie' ? 'lying' : /ie$/.test(b) ? b.slice(0, -2) + 'ying' : /[^e]e$/.test(b) ? b.slice(0, -1) + 'ing' : /^(run|swim|sit|clap|stop|get|put|cut|hop|plan|jog|shop)$/.test(b) ? b + b.slice(-1) + 'ing' : b + 'ing');

const past = {
  choose: () => {
    const s = pick(PAST_SUBJ); const [b, p, ob] = pick(PAST_V); const t = pick(PAST_T);
    const wrongP = regularize(b) === p ? b + 'ing' : regularize(b);
    return { t: 'choose', q: `${s.name} ___ ${pick(ob)} ${t}.`, opts: opts(p, b, s3(b), wrongP), a: p, tip: `${b} → ${p}. Acción terminada en el pasado (${t}).` };
  },
  type: () => {
    const s = pick(PAST_SUBJ); const [b, p, ob] = pick(PAST_V);
    return { t: 'type', q: `${s.name} ___ ${pick(ob)} ${pick(PAST_T)}.`, hint: b, a: [p], tip: `${b} → ${p}.` };
  },
  neg: () => {
    const s = pick(PAST_SUBJ); const [b, p, ob] = pick(PAST_V);
    return { t: 'choose', q: `${s.name} didn't ___ ${pick(ob)} ${pick(PAST_T)}.`, opts: opts(b, p, s3(b), ing(b)), a: b, tip: 'Después de didn’t, el verbo va en forma base.' };
  },
  question: () => {
    const s = pick(PAST_SUBJ); const [b, , ob] = pick(PAST_V);
    return { t: 'choose', q: `___ ${low(s.name)} ${b} ${pick(ob)} ${pick(PAST_T)}?`, opts: ['Did', 'Does', 'Was', 'Do'], a: 'Did', tip: 'Pregunta en pasado: Did + sujeto + verbo base.' };
  },
  wasWere: () => {
    const s = pick(PAST_SUBJ);
    return { t: 'choose', q: `${s.name} ___ ${pick(['very tired', 'in the tower', 'so happy', 'at the tournament', 'scared of the dragon'])} ${pick(PAST_T)}.`, opts: ['was', 'were', 'is', 'be'], a: pastBe(s), tip: s.pl ? 'Plural / you / we / they → were.' : 'I / he / she / it → was.' };
  },
  order: () => {
    for (;;) { const s = pick(PAST_SUBJ); const [, p, ob] = pick(PAST_V); const w = `${s.name} ${p} ${pick(ob)} ${pick(PAST_T)}`; if (words(w) <= 8) return { t: 'order', words: w, p: '.', tip: 'Sujeto + verbo en pasado + complemento + cuándo.' }; }
  },
  drag: () => {
    const s = pick(PAST_SUBJ); const [b1, p1, o1] = pick(PAST_V); let v2; do v2 = pick(PAST_V); while (v2[0] === b1);
    const [b2, p2, o2] = v2;
    return { t: 'drag', q: `${pick(PAST_T).replace(/^./, (c) => c.toUpperCase())} ${low(s.name)} ___ ${pick(o1)} and ___ ${pick(o2)}.`, bank: [p1, p2, b1, regularize(b2) === p2 ? b2 : regularize(b2)], a: [p1, p2], tip: `${b1} → ${p1}; ${b2} → ${p2}.` };
  },
};

// ---------------- FUTURE ----------------
const FUT_SUBJ = [subj('Robots', 'They'), subj('My robot', 'He'), subj('People', 'They'), subj('We', 'We'), subj('I', 'I'), subj('The astronauts', 'They'), subj('My sister', 'She'), subj('Captain Bean', 'He')];
const FUT_V = [['cook', 'dinner for everyone'], ['clean', 'our houses'], ['fly', 'to Mars'], ['build', 'a giant rocket'], ['travel', 'to the moon'], ['drive', 'flying cars'],
  ['teach', 'English at school'], ['explore', 'deep space'], ['repair', 'the spaceship'], ['visit', 'Jupiter'], ['live', 'under the sea'], ['play', 'football on the moon'], ['invent', 'a time machine']];
const FUT_T = ['tomorrow', 'next week', 'next year', 'in 2050', 'soon', 'one day', 'tonight'];
const pronOf = (s) => ({ I: 'I', you: 'You', we: 'We', they: 'They', he: 'He', she: 'She' }[s.pron]);
const future = {
  will: () => {
    const s = pick(FUT_SUBJ); const [v, ob] = pick(FUT_V);
    return { t: 'choose', q: `${cap(pick(['In 2050,', 'One day,', 'In the future,']))} ${low(s.name)} ___ ${ob}.`, opts: opts(`will ${v}`, `will ${s3(v)}`, regularize(v), `going ${v}`), a: `will ${v}`, tip: 'Predicción → will + verbo base.' };
  },
  goingTo: () => {
    const s = pick(FUT_SUBJ); const [v, ob] = pick(FUT_V); const p = pronOf(s);
    const be = SUBJ[p].be;
    return { t: 'choose', q: `${s.name} ${s.pl ? 'have' : 'has'} got the tickets. ${p} ___ ${ob}.`, opts: opts(`${be} going to ${v}`, `${be} going ${v}`, `going to ${v}`, `${be === 'is' ? 'are' : 'is'} going to ${v}`), a: `${be} going to ${v}`, tip: `Plan decidido → be going to. ${p} → ${be}.` };
  },
  neg: () => {
    const s = pick(FUT_SUBJ); const [v, ob] = pick(FUT_V);
    return { t: 'type', q: `${s.name} ___ ${ob} ${pick(FUT_T)}.`, hint: `not / ${v}`, a: [`won't ${v}`, `will not ${v}`], tip: 'won’t = will not + verbo base.' };
  },
  question: () => {
    const s = pick(FUT_SUBJ); const [v, ob] = pick(FUT_V);
    return { t: 'choose', q: `___ ${low(s.name)} ${v} ${ob} ${pick(FUT_T)}?`, opts: ['Will', 'Do', 'Did', 'Does'], a: 'Will', tip: 'Pregunta: Will + sujeto + verbo base?' };
  },
  type: () => {
    const s = pick(FUT_SUBJ); const [v, ob] = pick(FUT_V);
    return { t: 'type', q: `${s.name} ___ ${ob} ${pick(FUT_T)}.`, hint: v, a: [`will ${v}`, `'ll ${v}`], tip: 'will + verbo base.' };
  },
  order: () => { const s = pick(FUT_SUBJ); const [v, ob] = pick(FUT_V); return { t: 'order', words: `${s.name} will ${v} ${ob} ${pick(FUT_T)}`, p: '.', tip: 'Sujeto + will + verbo + complemento.' }; },
  drag: () => {
    const s = pick(FUT_SUBJ.filter((x) => !x.pl && x.name !== 'I')); const [v, ob] = pick(FUT_V);
    return { t: 'drag', q: `Look at the plan! ${s.name} ___ ___ to ${v} ${ob}.`, bank: ['is', 'going', 'will', 'are', 'go'], a: ['is', 'going'], tip: 'is going to + verbo.' };
  },
};

// ---------------- POSSESSIVES ----------------
const OWN_S = ['the captain', 'the pirate', 'the queen', 'Jack', 'Anna', 'my sister', 'the parrot', 'the king', 'Tom'];
const OWN_P = ['the pirates', 'the sailors', 'the girls', 'my parents', 'the soldiers'];
const OWN_I = [['the children', "the children's"], ['the men', "the men's"], ['the women', "the women's"], ['the people', "the people's"]];
const ITEMS = ['hat', 'sword', 'map', 'parrot', 'ship', 'boots', 'treasure chest', 'key', 'flag', 'telescope', 'gold coins'];
const PRONS = [['me', 'mine', 'my'], ['you', 'yours', 'your'], ['him', 'his', 'his'], ['her', 'hers', 'her'], ['us', 'ours', 'our'], ['them', 'theirs', 'their']];
const possessives = {
  owner: () => {
    const kind = pick(['s', 'p', 'i']); const item = pick(ITEMS);
    let base; let a; let wrong;
    if (kind === 's') { base = pick(OWN_S); a = `${base}'s`; wrong = [`${base}s'`, `${base}s`, base]; }
    else if (kind === 'p') { base = pick(OWN_P); a = `${base}'`; wrong = [`${base}'s`, base, `${base.replace(/s$/, '')}'s`]; }
    else { const [b, ap] = pick(OWN_I); base = b; a = ap; wrong = [`${b}s'`, b, `${b}'`]; }
    return { t: 'choose', q: `This is ___ ${item}. (${base})`, opts: opts(a, ...wrong), a, tip: kind === 's' ? 'Un dueño → ’s.' : kind === 'p' ? 'Plural acabado en -s → solo apóstrofo.' : 'Plural irregular → ’s.' };
  },
  pronoun: () => {
    const [obj, pro] = pick(PRONS); const item = pick(ITEMS);
    return { t: 'type', q: `This ${item} belongs to ${obj}. It's ___.`, hint: obj, a: [pro], tip: `${obj} → ${pro}.` };
  },
  adjVsPron: () => {
    const [, pro, adj] = pick(PRONS.filter((p) => p[1] !== p[2])); const item = pick(ITEMS);
    const asAdj = Math.random() < 0.5;
    return asAdj
      ? { t: 'choose', q: `That is ___ ${item}. It's ${pro}.`, opts: opts(adj, pro, adj === 'my' ? 'me' : 'it'), a: adj, tip: 'Antes de un nombre → adjetivo posesivo.' }
      : { t: 'choose', q: `That is ${adj} ${item}. It's ___.`, opts: opts(pro, adj, adj === 'my' ? 'me' : 'its'), a: pro, tip: 'Sin nombre detrás → pronombre posesivo.' };
  },
  whose: () => {
    const item = pick(ITEMS); const o = pick(OWN_S);
    return { t: 'choose', q: `___ ${item} is this? — It's ${o}'s.`, opts: ['Whose', "Who's", 'Who', 'Which'], a: 'Whose', tip: 'De quién → Whose.' };
  },
  its: () => pick([
    { t: 'choose', q: `The ship lost ___ ${pick(['flag', 'anchor', 'sail'])} in the storm.`, opts: ['its', "it's", 'his', 'it'], a: 'its', tip: 'its = su (de una cosa). it’s = it is.' },
    { t: 'choose', q: `The parrot opened ___ ${pick(['wings', 'beak', 'eyes'])}.`, opts: ['its', "it's", 'their', 'it'], a: 'its', tip: 'its = su (de una cosa o animal).' },
  ]),
  order: () => ({ t: 'order', words: `Whose ${pick(ITEMS)} is this`, p: '?', tip: 'Whose + nombre + is + this?' }),
  drag: () => {
    const o1 = pick(OWN_S); const pl = pick(['pirates', 'sailors', 'girls', 'soldiers', 'teachers']); const i1 = pick(ITEMS); let i2; do i2 = pick(ITEMS); while (i2 === i1);
    return { t: 'drag', q: `${cap(o1)}'s ${i1} is next to the ___ ${i2}. (the ${pl})`, bank: [`${pl}'`, `${pl}'s`, pl, `${pl.replace(/s$/, '')}'s`], a: [`${pl}'`], tip: 'Plural acabado en -s → apóstrofo al final.' };
  },
};

// ---------------- DEMONSTRATIVES ----------------
const NOUNS = [['apple', 'apples'], ['banana', 'bananas'], ['hat', 'hats'], ['shoe', 'shoes'], ['balloon', 'balloons'], ['orange', 'oranges'], ['book', 'books'],
  ['cake', 'cakes'], ['toy', 'toys'], ['flower', 'flowers'], ['strawberry', 'strawberries'], ['T-shirt', 'T-shirts'], ['watermelon', 'watermelons']];
const ADJ = ['delicious', 'cheap', 'beautiful', 'expensive', 'very big', 'fresh', 'too small'];
const DEM = { 'near-s': 'This', 'near-p': 'These', 'far-s': 'That', 'far-p': 'Those' };
const demonstratives = {
  choose: () => {
    const near = Math.random() < 0.5; const pl = Math.random() < 0.5; const [s, p] = pick(NOUNS); const a = DEM[`${near ? 'near' : 'far'}-${pl ? 'p' : 's'}`];
    return { t: 'choose', q: `${near ? '👇' : '👉'} ___ ${pl ? p : s} ${pl ? 'are' : 'is'} ${pick(ADJ)}${near ? '' : ' over there'}.`, opts: ['This', 'These', 'That', 'Those'], a, tip: `${near ? 'Cerca' : 'Lejos'} + ${pl ? 'plural' : 'singular'} → ${a.toLowerCase()}.` };
  },
  type: () => {
    const near = Math.random() < 0.5; const pl = Math.random() < 0.5; const [s, p] = pick(NOUNS); const a = DEM[`${near ? 'near' : 'far'}-${pl ? 'p' : 's'}`].toLowerCase();
    return { t: 'type', q: `${near ? '👇' : '👉'} How much ${pl ? 'are' : 'is'} ___ ${pl ? p : s}${near ? '' : ' over there'}?`, hint: `${near ? 'cerca' : 'lejos'}, ${pl ? 'plural' : 'singular'}`, a: [a], tip: `${near ? 'Cerca' : 'Lejos'} + ${pl ? 'plural' : 'singular'} → ${a}.` };
  },
  drag: () => {
    const [, p] = pick(NOUNS);
    return { t: 'drag', q: `___ ${p} here are ${pick(['cheaper', 'bigger', 'fresher', 'nicer'])} than ___ ${p} over there.`, bank: ['These', 'those', 'This', 'that'], a: ['These', 'those'], tip: 'Aquí + plural → these; allí + plural → those.' };
  },
  order: () => { const [s, p] = pick(NOUNS); const pl = Math.random() < 0.5; return { t: 'order', words: `Can I have ${pl ? 'these' : 'this'} ${pl ? p : s} please`, p: '?', tip: 'Can I have + this/these + nombre?' }; },
  verb: () => {
    const pl = Math.random() < 0.5; const [s, p] = pick(NOUNS);
    return { t: 'choose', q: `${pl ? 'Those' : 'That'} ${pl ? p : s} ___ ${pick(ADJ)}.`, opts: ['is', 'are', 'am', 'be'], a: pl ? 'are' : 'is', tip: pl ? 'Plural → are.' : 'Singular → is.' };
  },
};

// ---------------- PRESENT SIMPLE ----------------
const PS_SUBJ = [subj('I', 'I'), subj('You', 'You'), subj('We', 'We'), subj('They', 'They'), subj('He', 'He'), subj('She', 'She'), subj('My dad', 'He'),
  subj('The farmer', 'He'), subj('The cat', 'She'), subj('Anna', 'She'), subj('The cows', 'They'), subj('My grandparents', 'They')];
const PS_V = [['feed', 'the animals'], ['milk', 'the cows'], ['watch', 'TV'], ['go', 'to school'], ['study', 'English'], ['play', 'football'], ['wash', 'the dishes'],
  ['have', 'breakfast'], ['do', 'homework'], ['catch', 'the bus'], ['drive', 'the tractor'], ['grow', 'vegetables'], ['eat', 'apples'], ['drink', 'milk'], ['fix', 'the fence']];
const PS_T = ['every day', 'every morning', 'on Sundays', 'at seven', 'after lunch', 'in the evening'];
const ADV = ['always', 'usually', 'often', 'sometimes', 'never'];
const vform = (s, b) => (s.third ? s3(b) : b);
const presentSimple = {
  choose: () => {
    const s = pick(PS_SUBJ); const [b, ob] = pick(PS_V);
    return { t: 'choose', q: `${s.name} ___ ${ob} ${pick(PS_T)}.`, opts: opts(vform(s, b), s.third ? b : s3(b), ing(b), regularize(b)), a: vform(s, b), tip: s.third ? 'he / she / it → verbo + s.' : 'I / you / we / they → verbo sin s.' };
  },
  type: () => {
    const s = pick(PS_SUBJ.filter((x) => x.third)); const [b, ob] = pick(PS_V);
    return { t: 'type', q: `${s.name} ${pick(ADV)} ___ ${ob}.`, hint: b, a: [s3(b)], tip: `${b} → ${s3(b)} (3ª persona).` };
  },
  neg: () => {
    const s = pick(PS_SUBJ); const [b, ob] = pick(PS_V);
    return { t: 'choose', q: `${s.name} ___ ${b} ${ob} ${pick(PS_T)}.`, opts: ["don't", "doesn't", "isn't", "aren't"], a: s.third ? "doesn't" : "don't", tip: s.third ? 'he / she / it → doesn’t.' : 'I / you / we / they → don’t.' };
  },
  question: () => {
    const s = pick(PS_SUBJ.filter((x) => x.name !== 'I')); const [b, ob] = pick(PS_V);
    return { t: 'choose', q: `___ ${low(s.name)} ${b} ${ob} ${pick(PS_T)}?`, opts: ['Do', 'Does', 'Is', 'Are'], a: s.third ? 'Does' : 'Do', tip: s.third ? 'he / she / it → Does…?' : 'I / you / we / they → Do…?' };
  },
  order: () => { const s = pick(PS_SUBJ); const [b, ob] = pick(PS_V); return { t: 'order', words: `${s.name} ${pick(ADV)} ${vform(s, b)} ${ob}`, p: '.', tip: 'El adverbio de frecuencia va antes del verbo.' }; },
  drag: () => {
    const s = pick(PS_SUBJ.filter((x) => x.third)); const [b1, o1] = pick(PS_V); let v2; do v2 = pick(PS_V); while (v2[0] === b1);
    return { t: 'drag', q: `${s.name} ___ ${o1} but ${s.pron} ___ ${v2[1]}.`, bank: [s3(b1), `doesn't ${v2[0]}`, b1, `don't ${v2[0]}`], a: [s3(b1), `doesn't ${v2[0]}`], tip: 'Afirmativa con -s; negativa: doesn’t + base.' };
  },
};

// ---------------- PRESENT CONTINUOUS ----------------
const PC_SUBJ = [subj('The clown', 'He'), subj('The acrobats', 'They'), subj('I', 'I'), subj('We', 'We'), subj('The lions', 'They'), subj('The magician', 'He'),
  subj('The children', 'They'), subj('My friend', 'She'), subj('The elephant', 'She'), subj('You', 'You')];
const PC_V = [['juggle', 'five balls'], ['ride', 'a unicycle'], ['run', 'around the ring'], ['swim', 'in the pool'], ['dance', 'on the stage'], ['eat', 'popcorn'],
  ['play', 'the drums'], ['laugh', 'at the clown'], ['sit', 'in the front row'], ['fly', 'on the trapeze'], ['sleep', 'in the tent'], ['wear', 'a funny hat'], ['clap', 'their hands'], ['jump', 'through a ring']];
const PC_T = ['now', 'right now', 'at the moment'];
const presentContinuous = {
  choose: () => {
    const s = pick(PC_SUBJ); const [b, ob] = pick(PC_V); const a = `${s.be} ${ing(b)}`;
    return { t: 'choose', q: `${pick(['Look!', 'Listen!', 'Wow!'])} ${s.name} ___ ${ob}.`, opts: opts(a, vform(s, b), ing(b), `${s.be === 'is' ? 'are' : 'is'} ${ing(b)}`), a, tip: `Ahora mismo → am/is/are + -ing. ${s.name} → ${s.be}.` };
  },
  type: () => {
    const s = pick(PC_SUBJ); const [b, ob] = pick(PC_V); const be = s.be;
    const short = { am: "'m", is: "'s", are: "'re" }[be];
    return { t: 'type', q: `${s.name} ___ ${ob} ${pick(PC_T)}.`, hint: b, a: [`${be} ${ing(b)}`, `${short} ${ing(b)}`], tip: `${b} → ${ing(b)}.` };
  },
  neg: () => {
    const s = pick(PC_SUBJ.filter((x) => x.name !== 'I')); const [b, ob] = pick(PC_V); const a = s.be === 'is' ? "isn't" : "aren't";
    return { t: 'choose', q: `${s.name} ___ ${ing(b)} ${ob} ${pick(PC_T)}.`, opts: ["isn't", "aren't", "don't", "doesn't"], a, tip: `Negativa: ${a} + -ing.` };
  },
  question: () => {
    const s = pick(PC_SUBJ.filter((x) => x.name !== 'I')); const [b, ob] = pick(PC_V);
    return { t: 'choose', q: `___ ${low(s.name)} ${ing(b)} ${ob} ${pick(PC_T)}?`, opts: ['Is', 'Are', 'Do', 'Does'], a: cap(s.be), tip: 'Pregunta: Is / Are + sujeto + -ing?' };
  },
  order: () => { const s = pick(PC_SUBJ); const [b, ob] = pick(PC_V); return { t: 'order', words: `${s.name} ${s.be} ${ing(b)} ${ob} ${pick(PC_T)}`, p: '.', tip: 'Sujeto + am/is/are + -ing.' }; },
  contrast: () => {
    const s = pick(PC_SUBJ.filter((x) => x.third)); const [b1, o1] = pick(PC_V); let v2; do v2 = pick(PC_V); while (v2[0] === b1);
    return { t: 'drag', q: `Every day ${low(s.name)} ___ ${o1}, but now ${s.pron} ___ ${v2[1]}.`, bank: [s3(b1), `is ${ing(v2[0])}`, `is ${ing(b1)}`, v2[0]], a: [s3(b1), `is ${ing(v2[0])}`], tip: 'Rutina → presente simple; ahora → presente continuo.' };
  },
};

// ---------------- COMPARATIVES ----------------
const ADJS = {
  fast: ['faster', 'fastest'], tall: ['taller', 'tallest'], big: ['bigger', 'biggest'], strong: ['stronger', 'strongest'], happy: ['happier', 'happiest'],
  easy: ['easier', 'easiest'], heavy: ['heavier', 'heaviest'], hot: ['hotter', 'hottest'], old: ['older', 'oldest'], high: ['higher', 'highest'],
  good: ['better', 'best'], bad: ['worse', 'worst'], expensive: ['more expensive', 'most expensive'], exciting: ['more exciting', 'most exciting'],
  popular: ['more popular', 'most popular'], difficult: ['more difficult', 'most difficult'], dangerous: ['more dangerous', 'most dangerous'], beautiful: ['more beautiful', 'most beautiful'],
};
const PAIRS = [['A cheetah', 'a horse', 'fast'], ['An elephant', 'a mouse', 'heavy'], ['A giraffe', 'a zebra', 'tall'], ['Maths', 'art', 'difficult'], ['Football', 'golf', 'exciting'],
  ['A Ferrari', 'a bike', 'expensive'], ['Summer', 'winter', 'hot'], ['My grandad', 'my dad', 'old'], ['This test', 'the last one', 'easy'], ['Our team', 'your team', 'good'],
  ['The weather today', 'yesterday', 'bad'], ['A lion', 'a cat', 'dangerous'], ['A whale', 'a shark', 'big'], ['Max', 'Leo', 'strong'], ['Basketball', 'chess', 'popular']];
const SUPS = [['Mount Everest', 'high', 'mountain', 'the world'], ['The cheetah', 'fast', 'animal', 'the world'], ['Luna', 'fast', 'runner', 'the team'], ['Today', 'good', 'day', 'my life'],
  ['Football', 'popular', 'sport', 'Spain'], ['The blue whale', 'big', 'animal', 'the sea'], ['That', 'bad', 'film', 'the year'], ['Max', 'tall', 'player', 'the class'], ['This', 'exciting', 'match', 'the season']];
Object.assign(ADJS, { slow: ['slower', 'slowest'], small: ['smaller', 'smallest'], smart: ['smarter', 'smartest'], funny: ['funnier', 'funniest'], young: ['younger', 'youngest'] });
// animales con "puntuaciones" para que las comparaciones sean verdad
const ANIMALS = { 'a cheetah': [10, 5, 7, 4], 'an elephant': [4, 10, 6, 8], 'a mouse': [3, 1, 1, 1], 'a giraffe': [5, 8, 3, 10], 'a lion': [8, 6, 9, 5], 'a cat': [6, 2, 2, 2],
  'a horse': [9, 7, 3, 7], 'a snail': [1, 0, 0, 0], 'a dog': [7, 3, 3, 3], 'a bear': [6, 8, 9, 6], 'a rabbit': [7, 2, 1, 2], 'a crocodile': [5, 7, 10, 2], 'a tortoise': [2, 3, 1, 1] };
const ATTR = [['fast', 0, 1], ['slow', 0, -1], ['big', 1, 1], ['heavy', 1, 1], ['small', 1, -1], ['dangerous', 2, 1], ['tall', 3, 1]];
function animalPair() {
  for (;;) {
    const names = Object.keys(ANIMALS); const a = pick(names); const b = pick(names); const [adj, k, dir] = pick(ATTR);
    const d = (ANIMALS[a][k] - ANIMALS[b][k]) * dir;
    if (a !== b && d > 1) return [cap(a), b, adj];
  }
}
const PEOPLE = ['Luna', 'Max', 'Leo', 'Sofi', 'Bruno', 'My cousin', 'Our teacher', 'Captain Bean'];
const SUP_ADJ = ['tall', 'fast', 'strong', 'good', 'funny', 'young', 'old', 'smart', 'popular'];
const SUP_NOUN = ['student', 'player', 'runner', 'singer', 'dancer', 'swimmer'];
const SUP_GROUP = ['the class', 'the team', 'the school', 'the club', 'our town'];
const pairAny = () => (Math.random() < 0.65 ? animalPair() : pick(PAIRS));
const supAny = () => (Math.random() < 0.6 ? [pick(PEOPLE), pick(SUP_ADJ), pick(SUP_NOUN), pick(SUP_GROUP)] : pick(SUPS));
const isLong = (a) => ADJS[a][0].startsWith('more');
const comparatives = {
  comp: () => {
    const [A, B, adj] = pairAny(); const [c, s] = ADJS[adj];
    return { t: 'choose', q: `${A} is ___ than ${B}.`, opts: opts(c, isLong(adj) ? `most ${adj}` : s, isLong(adj) ? `${adj}er` : `more ${adj}`, adj), a: c, tip: isLong(adj) ? 'Adjetivo largo → more … than.' : `${adj} → ${c} + than.` };
  },
  compType: () => {
    let p; do p = pairAny(); while (isLong(p[2]));
    const [A, B, adj] = p; const [c] = ADJS[adj];
    return { t: 'type', q: `${A} is ___ than ${B}.`, hint: adj, a: [c], tip: `${adj} → ${c}.` };
  },
  sup: () => {
    const [X, adj, noun, place] = supAny(); const [c, s] = ADJS[adj];
    return { t: 'choose', q: `${X} is the ___ ${noun} in ${place}.`, opts: opts(s, c, isLong(adj) ? `more ${adj}` : `most ${adj}`, adj), a: s, tip: 'Superlativo: the + -est / the most.' };
  },
  supType: () => {
    let p; do p = supAny(); while (isLong(p[1]));
    const [X, adj, noun, place] = p; const [, s] = ADJS[adj];
    return { t: 'type', q: `${X} is the ___ ${noun} in ${place}.`, hint: adj, a: [s], tip: `${adj} → the ${s}.` };
  },
  drag: () => {
    const [A, B, adj] = pick(PAIRS.filter((p) => isLong(p[2])));
    return { t: 'drag', q: `${A} is ___ ${adj} ___ ${B}.`, bank: ['more', 'than', 'most', 'that', 'then'], a: ['more', 'than'], tip: 'more + adjetivo + than.' };
  },
  order: () => { const [A, B, adj] = pairAny(); return { t: 'order', words: `${A} is ${ADJS[adj][0]} than ${B}`, p: '.', tip: 'A + is + comparativo + than + B.' }; },
};

// ---------------- PREPOSITIONS ----------------
const THINGS = ['The ghost', 'The black cat', 'The pumpkin', 'The bat', 'The spider', 'The skeleton', 'The broom', 'The candle', 'The old key', "The witch's hat"];
const PLACES = ['the box', 'the table', 'the bed', 'the door', 'the stairs', 'the window', 'the chair', 'the cupboard', 'the sofa', 'the clock'];
const PREPS = [['in', 'dentro de'], ['on', 'encima de'], ['under', 'debajo de'], ['behind', 'detrás de'], ['in front of', 'delante de'], ['next to', 'al lado de']];
const prepositions = {
  choose: () => {
    const [p, es] = pick(PREPS); const th = pick(THINGS); const pl = pick(PLACES);
    const others = PREPS.map((x) => x[0]).filter((x) => x !== p).sort(() => Math.random() - 0.5);
    return { t: 'choose', q: `${th} is ___ ${pl}. (${es})`, opts: [p, ...others.slice(0, 3)], a: p, tip: `${es} → ${p}.` };
  },
  type: () => {
    const [p, es] = pick(PREPS); return { t: 'type', q: `${pick(THINGS)} is ___ ${pick(PLACES)}.`, hint: es, a: [p], tip: `${es} → ${p}.` };
  },
  between: () => {
    const a = pick(PLACES); let b; do b = pick(PLACES); while (b === a);
    return { t: 'choose', q: `${pick(THINGS)} is ___ ${a} and ${b}.`, opts: ['between', 'next', 'on', 'under'], a: 'between', tip: 'Entre dos cosas → between.' };
  },
  where: () => {
    const pl = Math.random() < 0.5;
    return { t: 'choose', q: `___ ${pl ? 'are the bats' : 'is the ghost'}? — ${pl ? "They're" : "It's"} ${pick(PREPS)[0]} ${pick(PLACES)}.`, opts: ['Where', 'What', 'Who', 'When'], a: 'Where', tip: 'Lugar → Where.' };
  },
  order: () => { const [p] = pick(PREPS); return { t: 'order', words: `${pick(THINGS)} is ${p} ${pick(PLACES)}`, p: '.', tip: 'Cosa + is + preposición + lugar.' }; },
  drag: () => {
    const [p1, e1] = pick(PREPS.slice(0, 3)); let q2; do q2 = pick(PREPS.slice(0, 3)); while (q2[0] === p1);
    return { t: 'drag', q: `${pick(THINGS)} is ___ ${pick(PLACES)} (${e1}) and ${low(pick(THINGS))} is ___ ${pick(PLACES)} (${q2[1]}).`, bank: [p1, q2[0], 'of', 'at'], a: [p1, q2[0]], tip: `${e1} → ${p1}; ${q2[1]} → ${q2[0]}.` };
  },
};

// ---------------- PRESENT PERFECT ----------------
const PP_SUBJ = [subj('I', 'I'), subj('We', 'We'), subj('The explorers', 'They'), subj('She', 'She'), subj('He', 'He'), subj('My uncle', 'He'), subj('You', 'You'), subj('Professor Bean', 'He')];
const PP_V = [['see', 'saw', 'seen', ['a jaguar', 'a giant snake', 'the waterfall']], ['eat', 'ate', 'eaten', ['a spider', 'jungle fruit']], ['find', 'found', 'found', ['the secret temple', 'an old map']],
  ['swim', 'swam', 'swum', ['in the river', 'with dolphins']], ['take', 'took', 'taken', ['a lot of photos', 'the wrong path']], ['climb', 'climbed', 'climbed', ['the pyramid', 'a volcano']],
  ['visit', 'visited', 'visited', ['the Amazon', 'the lost city']], ['write', 'wrote', 'written', ['a diary', 'a travel blog']], ['fly', 'flew', 'flown', ['in a helicopter', 'over the jungle']],
  ['ride', 'rode', 'ridden', ['an elephant', 'a camel']], ['lose', 'lost', 'lost', ['the compass', 'my hat']], ['meet', 'met', 'met', ['a famous explorer', 'a shaman']]];
const have = (s) => (s.third ? 'has' : 'have');
const presentPerfect = {
  aux: () => {
    const s = pick(PP_SUBJ); const [, , pp, ob] = pick(PP_V);
    return { t: 'choose', q: `${s.name} ___ ${pp} ${pick(ob)}.`, opts: ['have', 'has', 'am', 'did'], a: have(s), tip: s.third ? 'he / she / it → has.' : 'I / you / we / they → have.' };
  },
  participle: () => {
    const s = pick(PP_SUBJ); const [b, p, pp, ob] = pick(PP_V);
    return { t: 'choose', q: `${s.name} ${have(s)} ___ ${pick(ob)}.`, opts: opts(pp, p === pp ? ing(b) : p, b, regularize(b) === pp ? s3(b) : regularize(b)), a: pp, tip: `${b} → ${p} → ${pp}.` };
  },
  type: () => {
    const s = pick(PP_SUBJ); const [b, , pp, ob] = pick(PP_V);
    return { t: 'type', q: `${s.name} ${have(s)} ___ ${pick(ob)}.`, hint: b, a: [pp], tip: `Participio de ${b}: ${pp}.` };
  },
  ever: () => {
    const s = pick(PP_SUBJ.filter((x) => x.name !== 'I')); const [, , pp, ob] = pick(PP_V);
    return { t: 'choose', q: `${cap(have(s))} ${low(s.name)} ___ ${pp} ${pick(ob)}?`, opts: ['ever', 'never', 'yet', 'already'], a: 'ever', tip: 'Pregunta de experiencia → ever.' };
  },
  yetAlready: () => {
    const s = pick(PP_SUBJ); const [, , pp, ob] = pick(PP_V);
    return Math.random() < 0.5
      ? { t: 'choose', q: `${s.name} ${have(s)}n't ${pp} ${pick(ob)} ___.`, opts: ['yet', 'already', 'ever', 'never'], a: 'yet', tip: 'yet al final de negativas y preguntas.' }
      : { t: 'choose', q: `${s.name} ${have(s)} ___ ${pp} ${pick(ob)}!`, opts: ['already', 'yet', 'ever', 'since'], a: 'already', tip: 'already = ya, en frases afirmativas.' };
  },
  neg: () => {
    const s = pick(PP_SUBJ); const [b, , pp, ob] = pick(PP_V);
    return { t: 'type', q: `${s.name} ___ ${pick(ob)} yet.`, hint: `not / ${b}`, a: [`${have(s)}n't ${pp}`, `${have(s)} not ${pp}`], tip: `${have(s)}n't + participio.` };
  },
  order: () => { const s = pick(PP_SUBJ); const [, , pp, ob] = pick(PP_V); return { t: 'order', words: `${s.name} ${have(s)} never ${pp} ${pick(ob)}`, p: '.', tip: 'never va entre have/has y el participio.' }; },
};

// ---------------- CAN / CAN'T ----------------
const HEROES = [['Captain Bean', 'he'], ['Super Luna', 'she'], ['The robot', 'it'], ['My sister', 'she'], ['Spider-Bean', 'he'], ['I', 'I'], ['We', 'we'], ['The twins', 'they'], ['Penguins', 'they'], ['Max', 'he']];
const ABIL = ['fly', 'swim', 'run very fast', 'climb walls', 'lift a car', 'read minds', 'speak five languages', 'see in the dark', 'jump very high', 'become invisible', 'play the guitar', 'cook pasta'];
const verb0 = (a) => a.split(' ')[0];
const canCant = {
  can: () => {
    const [h] = pick(HEROES);
    return { t: 'choose', q: `${h} ___ ${pick(ABIL)}.`, opts: ['can', 'cans', 'can to', 'is can'], a: 'can', tip: 'can es igual para todos y va + verbo base.' };
  },
  base: () => {
    const [h] = pick(HEROES); const a = pick(ABIL); const v = verb0(a); const rest = a.slice(v.length);
    return { t: 'choose', q: `${h} can ___${rest}.`, opts: opts(v, s3(v), `to ${v}`, ing(v)), a: v, tip: 'can + verbo base (sin -s, sin to).' };
  },
  cant: () => {
    const [h, pr] = pick(HEROES); const a = pick(ABIL); let b; do b = pick(ABIL); while (b === a);
    return { t: 'type', q: `${h} can ${a}, but ${pr} ___ ${b}.`, hint: 'no puede', a: ["can't", 'cannot'], tip: 'can’t = cannot.' };
  },
  question: () => ({ t: 'choose', q: `___ you ${pick(ABIL)}? — ${pick(['Yes, I can!', 'No, I can’t.'])}`, opts: ['Can', 'Do', 'Are', 'Does'], a: 'Can', tip: 'Pregunta: Can + sujeto + verbo?' }),
  could: () => {
    const yes = Math.random() < 0.5;
    return { t: 'type', q: `When I was ${pick(['three', 'five', 'six', 'eight'])}, I ___ ${pick(['ride a bike', 'swim', 'read', 'tie my shoes', 'speak English', 'whistle'])}.`, hint: yes ? 'podía' : 'no podía', a: yes ? ['could'] : ["couldn't", 'could not'], tip: 'Pasado de can → could / couldn’t.' };
  },
  order: () => ({ t: 'order', words: `Can you ${pick(ABIL)}`, p: '?', tip: 'Can + you + verbo?' }),
  drag: () => {
    const a = pick(ABIL); let b; do b = pick(ABIL); while (b === a);
    return { t: 'drag', q: `I ___ ${a}, but I ___ ${b}.`, bank: ['can', 'can’t', 'cans', 'to'], a: ['can', 'can’t'], tip: 'but → contraste: can / can’t.' };
  },
};

export const GENERATORS = {
  past, future, treasure: possessives, market: demonstratives, farm: presentSimple,
  circus: presentContinuous, stadium: comparatives, haunted: prepositions, jungle: presentPerfect, hero: canCant,
};

// Devuelve una pregunta generada; si se pide un tipo, intenta una plantilla de ese tipo
export function generate(zoneId, want = null, avoid = new Set()) {
  const g = GENERATORS[zoneId];
  if (!g) return null;
  const entries = Object.entries(g).filter(([name]) => !avoid.has(name));
  const list = entries.length ? entries : Object.entries(g);
  for (let i = 0; i < 12; i++) {
    const [name, fn] = pick(list); const q = fn();
    if (!want || q.t === want) return { ...q, tpl: name };
  }
  const [name, fn] = pick(list);
  return { ...fn(), tpl: name };
}
