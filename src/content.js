// Contenido de las aulas. Tipos de pregunta:
//  choose: elegir la palabra del hueco      { t, q, opts, a }
//  type:   escribir la forma correcta        { t, q, hint, a:[aceptadas] }
//  drag:   arrastrar palabras a los huecos   { t, q, bank, a:[en orden] }
//  order:  ordenar la frase                  { t, words, p }

export const ZONES = [
  {
    id: 'past',
    name: 'Castle of the Past',
    short: 'Past Simple',
    emoji: '🏰',
    pos: [-19, -38],
    face: [0, 1],
    color: '#8b6cff',
    grad: 'linear-gradient(135deg,#4b2bb8 0%,#8b5cff 55%,#ff8fd8 100%)',
    topic: 'Pasado simple: regulares, irregulares, did / didn’t, was / were',
    board: ['PAST SIMPLE', 'go → went', 'fight → fought', 'play → played', 'Did you…? / I didn’t…'],
    theory: [
      {
        title: '¿Qué es el Past Simple?',
        body: `<p>Lo usamos para <b>acciones terminadas</b> en un momento concreto del pasado.</p>
          <p class="pill-row"><span>yesterday</span><span>last week</span><span>two years ago</span><span>in 1066</span><span>when I was a child</span></p>`,
        ex: ['The knight fought the dragon yesterday.', 'We visited the castle last summer.', 'The king lived here five hundred years ago.'],
      },
      {
        title: 'Verbos regulares: + ed',
        body: `<table><tr><th>Regla</th><th>Ejemplo</th></tr>
          <tr><td>Normal → <b>+ed</b></td><td>play → play<b>ed</b></td></tr>
          <tr><td>Acaba en -e → <b>+d</b></td><td>live → live<b>d</b></td></tr>
          <tr><td>Consonante + y → <b>-ied</b></td><td>cry → cr<b>ied</b></td></tr>
          <tr><td>CVC corto → dobla</td><td>stop → sto<b>pped</b></td></tr></table>
          <p>🔊 La <b>-ed</b> suena de 3 formas: /t/ walk<b>ed</b>, /d/ play<b>ed</b>, /ɪd/ want<b>ed</b>.</p>`,
        ex: ['The jester played the lute.', 'The baby dragon cried all night.', 'The blacksmith stopped working at midnight.', 'The guards wanted more bread.'],
      },
      {
        title: 'Verbos irregulares',
        body: `<p>No siguen la regla: ¡hay que aprenderlos! Los más típicos del castillo:</p>
          <div class="verb-grid">
          <span>go → <b>went</b></span><span>fight → <b>fought</b></span><span>eat → <b>ate</b></span><span>see → <b>saw</b></span>
          <span>ride → <b>rode</b></span><span>fly → <b>flew</b></span><span>win → <b>won</b></span><span>build → <b>built</b></span>
          <span>sing → <b>sang</b></span><span>take → <b>took</b></span><span>buy → <b>bought</b></span><span>catch → <b>caught</b></span></div>`,
        ex: ['The princess rode her horse to the village.', 'The dragon flew over the mountains.', 'I saw a ghost in the tower!'],
      },
      {
        title: 'Negativas y preguntas: did',
        body: `<p>Usamos <b>did / didn’t</b> + verbo en <b>forma base</b> (¡sin -ed!).</p>
          <table><tr><td>➖</td><td>The king <b>didn’t eat</b> the soup.</td></tr>
          <tr><td>❓</td><td><b>Did</b> the dragon <b>fly</b> away?</td></tr>
          <tr><td>💬</td><td>Yes, it <b>did</b>. / No, it <b>didn’t</b>.</td></tr></table>
          <p class="warn">❌ He didn’t <s>went</s> → ✅ He didn’t <b>go</b></p>`,
        ex: ['The soldiers did not find the treasure.', 'Did the wizard cast a spell?', 'Yes, he did.'],
      },
      {
        title: 'Was / Were',
        body: `<table><tr><th>Sujeto</th><th>Pasado de “to be”</th></tr>
          <tr><td>I / he / she / it</td><td><b>was</b></td></tr>
          <tr><td>you / we / they</td><td><b>were</b></td></tr></table>`,
        ex: ['The knights were very brave.', 'The queen was in the tower.', 'Were you at the tournament?'],
      },
    ],
    questions: [
      { t: 'choose', q: 'Yesterday the knight ___ the dragon.', opts: ['fought', 'fight', 'fighted', 'fights'], a: 'fought', tip: 'fight → fought (irregular).' },
      { t: 'type', q: 'The king ___ a huge feast last night.', hint: 'eat', a: ['ate'], tip: 'eat → ate (irregular).' },
      { t: 'type', q: 'The princess ___ her horse to the village.', hint: 'ride', a: ['rode'], tip: 'ride → rode (irregular).' },
      { t: 'choose', q: 'The soldiers ___ not find the treasure.', opts: ['did', 'does', 'were', 'was'], a: 'did', tip: 'Negativa en pasado: did not + verbo base.' },
      { t: 'choose', q: '___ the wizard cast a spell yesterday?', opts: ['Did', 'Does', 'Was', 'Do'], a: 'Did', tip: 'Pregunta en pasado: Did + sujeto + verbo base.' },
      { t: 'order', words: 'They built the castle many years ago', p: '.', tip: 'Sujeto + verbo en pasado + complemento + expresión de tiempo.' },
      { t: 'type', q: 'The jester ___ the lute for the queen.', hint: 'play', a: ['played'], tip: 'Regular: play → played.' },
      { t: 'type', q: 'The dragon ___ over the mountains.', hint: 'fly', a: ['flew'], tip: 'fly → flew (irregular).' },
      { t: 'choose', q: 'The knights ___ very brave.', opts: ['were', 'was', 'are', 'be'], a: 'were', tip: 'They → were.' },
      { t: 'drag', q: 'Last winter the villagers ___ wood and ___ a big fire.', bank: ['chopped', 'made', 'chop', 'maked', 'did'], a: ['chopped', 'made'], tip: 'chop → chopped (dobla la p), make → made.' },
      { t: 'choose', q: 'She didn’t ___ the letter from the king.', opts: ['receive', 'received', 'receives', 'receiving'], a: 'receive', tip: 'Después de didn’t, el verbo va en forma base.' },
      { t: 'type', q: 'The blacksmith ___ working at midnight.', hint: 'stop', a: ['stopped'], tip: 'CVC corto: stop → stopped.' },
      { t: 'type', q: 'The baby dragon ___ all night.', hint: 'cry', a: ['cried'], tip: 'Consonante + y → ied: cry → cried.' },
      { t: 'choose', q: 'I ___ a ghost in the tower last night!', opts: ['saw', 'seen', 'see', 'seed'], a: 'saw', tip: 'see → saw (seen es participio).' },
      { t: 'order', words: 'Did the knight win the tournament', p: '?', tip: 'Did + sujeto + verbo base + complemento?' },
      { t: 'drag', q: 'The queen ___ a beautiful song and everybody ___.', bank: ['sang', 'clapped', 'sung', 'clap', 'singed'], a: ['sang', 'clapped'], tip: 'sing → sang; clap → clapped.' },
    ],
  },
  {
    id: 'future',
    name: 'Robot Lab 3000',
    short: 'Future',
    emoji: '🤖',
    pos: [19, -38],
    face: [0, 1],
    color: '#22d3ee',
    grad: 'linear-gradient(135deg,#0b1d5c 0%,#1e5bff 50%,#22e6d6 100%)',
    topic: 'Futuro: will, won’t y be going to',
    board: ['FUTURE', 'will + verb', 'won’t = will not', 'be going to + verb', 'Will you…?'],
    theory: [
      {
        title: 'Will + verbo',
        body: `<p>Para <b>predicciones</b>, <b>decisiones espontáneas</b> y <b>promesas</b>.</p>
          <table><tr><td>🔮 Predicción</td><td>Robots <b>will cook</b> our dinner.</td></tr>
          <tr><td>⚡ Decisión ahora</td><td>I’m thirsty. — I<b>’ll get</b> you some water!</td></tr>
          <tr><td>🤝 Promesa</td><td>I <b>won’t forget</b> your birthday.</td></tr></table>`,
        ex: ['In 2050, robots will clean our homes.', 'I will help you!', 'I promise I won’t be late.'],
      },
      {
        title: 'Be going to + verbo',
        body: `<p>Para <b>planes ya decididos</b> y cosas que <b>vemos venir</b> (evidencias).</p>
          <table><tr><td>📅 Plan</td><td>I<b>’m going to build</b> a rocket.</td></tr>
          <tr><td>👀 Evidencia</td><td>Look at those clouds! It<b>’s going to rain</b>.</td></tr></table>
          <p>Ojo: <b>am / is / are</b> según el sujeto.</p>`,
        ex: ['We are going to build a rocket.', 'She is going to visit the space station.', 'Look out! The robot is going to fall!'],
      },
      {
        title: 'Negativas y preguntas',
        body: `<table><tr><td>➖</td><td>We <b>won’t</b> travel by car. / He <b>isn’t going to</b> come.</td></tr>
          <tr><td>❓</td><td><b>Will</b> you help me? — Yes, I <b>will</b>.</td></tr>
          <tr><td>❓</td><td><b>Are</b> you <b>going to</b> play? — No, I’m <b>not</b>.</td></tr></table>`,
        ex: ['Will you help me fix this robot?', 'We won’t travel by car in the future.', 'Are you going to play tonight?'],
      },
      {
        title: 'Expresiones de futuro',
        body: `<p class="pill-row"><span>tomorrow</span><span>tonight</span><span>next week</span><span>soon</span><span>in 2050</span><span>one day</span></p>`,
        ex: ['My robot will be ready next week.', 'People will live on Mars one day.'],
      },
    ],
    questions: [
      { t: 'choose', q: 'In 2050, robots ___ our homes.', opts: ['will clean', 'cleaned', 'cleans', 'cleaning'], a: 'will clean', tip: 'Predicción → will + verbo.' },
      { t: 'type', q: 'Look at those dark clouds! It ___.', hint: 'rain', a: ['is going to rain', "'s going to rain"], tip: 'Evidencia que vemos → be going to.' },
      { t: 'choose', q: 'I’m thirsty. — I ___ get you some water!', opts: ['’ll', 'am going', 'will to', 'going'], a: '’ll', tip: 'Decisión espontánea → ’ll (will).' },
      { t: 'choose', q: 'Robots ___ never feel tired.', opts: ['will', 'are', 'going', 'does'], a: 'will', tip: 'Predicción general → will.' },
      { t: 'type', q: 'We ___ by car in the future; we’ll fly!', hint: 'not / travel', a: ["won't travel", 'will not travel'], tip: 'Negativa: won’t + verbo.' },
      { t: 'order', words: 'People will live on Mars one day', p: '.', tip: 'Sujeto + will + verbo + complemento.' },
      { t: 'choose', q: '___ you help me fix this robot tomorrow?', opts: ['Will', 'Are', 'Do', 'Did'], a: 'Will', tip: 'Pregunta: Will + sujeto + verbo?' },
      { t: 'choose', q: 'She has bought a ticket. She ___ visit the space station.', opts: ['is going to', 'will to', 'going', 'goes to'], a: 'is going to', tip: 'Plan decidido → be going to.' },
      { t: 'drag', q: 'Tomorrow the robot ___ ___ the dishes.', bank: ['will', 'wash', 'washed', 'going', 'does'], a: ['will', 'wash'], tip: 'will + verbo base.' },
      { t: 'type', q: 'My robot ___ ready next week.', hint: 'be', a: ['will be', "'ll be"], tip: 'Futuro de to be: will be.' },
      { t: 'choose', q: 'I promise I ___ forget your birthday.', opts: ['won’t', 'don’t', 'didn’t', 'am not'], a: 'won’t', tip: 'Promesa negativa → won’t.' },
      { t: 'order', words: 'We are going to build a rocket', p: '.', tip: 'Sujeto + am/is/are + going to + verbo.' },
      { t: 'choose', q: 'What ___ you do after school tomorrow?', opts: ['will', 'did', 'does', 'was'], a: 'will', tip: 'What + will + sujeto + verbo?' },
      { t: 'drag', q: 'I ___ ___ to learn coding next year.', bank: ['am', 'going', 'will', 'go', 'is'], a: ['am', 'going'], tip: 'I am going to + verbo.' },
      { t: 'type', q: 'The spaceship ___ at 9 pm tonight.', hint: 'arrive', a: ['will arrive', 'is going to arrive', "'ll arrive"], tip: 'will + verbo base.' },
    ],
  },
  {
    id: 'treasure',
    name: 'Treasure Island',
    short: 'Possessives',
    emoji: '💰',
    pos: [-19, 38],
    face: [0, -1],
    color: '#ffb020',
    grad: 'linear-gradient(135deg,#a3410a 0%,#ff9d1c 50%,#ffe066 100%)',
    topic: 'Posesivos: ’s / s’, my-mine, whose',
    board: ['POSSESSIVES', "the pirate's hat", "the pirates' ship", 'my → mine', 'Whose is this?'],
    theory: [
      {
        title: '’s: el dueño es uno',
        body: `<p>Añadimos <b>’s</b> al dueño: <b>the captain’s</b> parrot = el loro del capitán.</p>
          <p>Con nombres igual: <b>Jack’s</b> sword, <b>Anna’s</b> map.</p>`,
        ex: ['This is the captain’s parrot.', 'That is Jack’s sword.', 'It’s the queen’s crown.'],
      },
      {
        title: 's’: muchos dueños',
        body: `<p>Plural acabado en -s → solo apóstrofo: <b>the pirates’</b> ship.</p>
          <p>Plural irregular → <b>’s</b>: <b>children’s</b>, <b>men’s</b>, <b>women’s</b>.</p>`,
        ex: ['These are the pirates’ swords.', 'The children’s toys are in the cabin.', 'The men’s room is full of gold.'],
      },
      {
        title: 'Adjetivos vs pronombres',
        body: `<table><tr><th>Adjetivo (+ nombre)</th><th>Pronombre (solo)</th></tr>
          <tr><td>my map</td><td>mine</td></tr><tr><td>your map</td><td>yours</td></tr>
          <tr><td>his map</td><td>his</td></tr><tr><td>her map</td><td>hers</td></tr>
          <tr><td>its flag</td><td>—</td></tr><tr><td>our map</td><td>ours</td></tr>
          <tr><td>their map</td><td>theirs</td></tr></table>`,
        ex: ['This is my map. It’s mine!', 'That gold is hers.', 'We found our treasure. It’s ours!'],
      },
      {
        title: 'Whose? y trampas típicas',
        body: `<p><b>Whose</b> pregunta por el dueño: <b>Whose</b> chest is this? — It’s Jack’s.</p>
          <p class="warn"><b>whose</b> (de quién) ≠ <b>who’s</b> (who is)<br><b>its</b> (su) ≠ <b>it’s</b> (it is)</p>`,
        ex: ['Whose sword is this?', 'It’s Jack’s.', 'The ship lost its flag in the storm.'],
      },
    ],
    questions: [
      { t: 'choose', q: '🦜 This is ___ parrot. (the captain)', opts: ['the captain’s', 'the captains', 'the captain', 'captain’s the'], a: 'the captain’s', tip: 'Un dueño → ’s.' },
      { t: 'choose', q: 'Whose 👑 is this? — It’s the ___.', opts: ['queen’s', 'queens', 'queen', 'queens’'], a: 'queen’s', tip: 'Un dueño → queen’s.' },
      { t: 'choose', q: '⚔️ These are the ___ swords. (many pirates)', opts: ['pirates’', 'pirate’s', 'pirates', 'pirates’s'], a: 'pirates’', tip: 'Plural en -s → solo apóstrofo: pirates’.' },
      { t: 'type', q: 'This treasure map belongs to me. It’s ___.', hint: 'I', a: ['mine'], tip: 'Pronombre posesivo de I → mine.' },
      { t: 'choose', q: 'The ship lost ___ flag in the storm.', opts: ['its', 'it’s', 'his', 'it'], a: 'its', tip: 'its = su (de una cosa). it’s = it is.' },
      { t: 'type', q: 'That gold belongs to Anna. It’s ___.', hint: 'she', a: ['hers'], tip: 'she → her → hers.' },
      { t: 'choose', q: '___ chest is this? — It’s Jack’s.', opts: ['Whose', 'Who’s', 'Who', 'Which’s'], a: 'Whose', tip: 'De quién → Whose.' },
      { t: 'drag', q: 'The ___ toys are in the ___ cabin.', bank: ['children’s', 'captain’s', 'childrens’', 'captains', 'childs’'], a: ['children’s', 'captain’s'], tip: 'children (irregular) → children’s; un capitán → captain’s.' },
      { t: 'choose', q: 'We found ___ treasure! It’s ours!', opts: ['our', 'ours', 'us', 'we'], a: 'our', tip: 'Antes de un nombre → adjetivo: our.' },
      { t: 'type', q: 'Is this hook yours? — No, it’s not ___.', hint: 'I', a: ['mine'], tip: 'I → mine.' },
      { t: 'order', words: 'Whose sword is this', p: '?', tip: 'Whose + nombre + is + this?' },
      { t: 'choose', q: 'Those are ___ coins, not yours.', opts: ['their', 'theirs', 'they', 'them'], a: 'their', tip: 'Antes de un nombre → their.' },
      { t: 'choose', q: '🦜 This parrot is ___. (Tom)', opts: ['Tom’s', 'Toms', 'Tom', 'Toms’'], a: 'Tom’s', tip: 'Nombre propio → Tom’s.' },
      { t: 'type', q: 'These jewels belong to us. They’re ___.', hint: 'we', a: ['ours'], tip: 'we → our → ours.' },
      { t: 'choose', q: 'The ___ room is full of gold. (the men)', opts: ['men’s', 'mens’', 'mans’', 'men'], a: 'men’s', tip: 'Plural irregular → men’s.' },
    ],
  },
  {
    id: 'market',
    name: 'This & That Market',
    short: 'Demonstratives',
    emoji: '🍎',
    pos: [19, 38],
    face: [0, -1],
    color: '#ff6b6b',
    grad: 'linear-gradient(135deg,#b3133b 0%,#ff5f6d 50%,#ffc371 100%)',
    topic: 'Demostrativos: this, these, that, those',
    board: ['THIS / THAT', '👇 this apple', '👇 these apples', '👉 that apple', '👉 those apples'],
    theory: [
      {
        title: 'Cerca o lejos, uno o varios',
        body: `<table><tr><th></th><th>Singular</th><th>Plural</th></tr>
          <tr><td>👇 Cerca</td><td><b>this</b></td><td><b>these</b></td></tr>
          <tr><td>👉 Lejos</td><td><b>that</b></td><td><b>those</b></td></tr></table>`,
        ex: ['This apple is delicious.', 'These strawberries are sweet.', 'Look at that balloon!', 'Those mountains are beautiful.'],
      },
      {
        title: 'Truco para no fallar',
        body: `<p><b>this → these</b> (la i se “estira”) · <b>that → those</b></p>
          <p>Mira el nombre: ¿singular o plural? Luego, ¿lo puedo tocar 👇 o está allí 👉?</p>`,
        ex: ['How much is this hat?', 'Can I have these oranges?', 'Who is that man?'],
      },
      {
        title: 'This one / that one',
        body: `<p>Para no repetir el nombre: <b>I want this one, not that one.</b></p>
          <p><b>That</b> también se usa para cosas que ya pasaron: <b>That was</b> a great film!</p>`,
        ex: ['I want this one, not that one.', 'That was a great idea!'],
      },
    ],
    questions: [
      { t: 'choose', q: '👇 ___ apple is delicious.', opts: ['This', 'These', 'That', 'Those'], a: 'This', tip: 'Cerca + singular → this.' },
      { t: 'choose', q: '👉 Look at ___ balloons over there!', opts: ['those', 'these', 'this', 'that'], a: 'those', tip: 'Lejos + plural → those.' },
      { t: 'choose', q: '👇 ___ strawberries are sweet.', opts: ['These', 'This', 'Those', 'That'], a: 'These', tip: 'Cerca + plural → these.' },
      { t: 'choose', q: '👉 Is ___ your bike over there?', opts: ['that', 'those', 'these', 'this'], a: 'that', tip: 'Lejos + singular → that.' },
      { t: 'type', q: '👇 I love ___ shoes I’m wearing.', hint: 'cerca, plural', a: ['these'], tip: 'Cerca + plural → these.' },
      { t: 'type', q: '👉 Who is ___ man next to the fruit stall?', hint: 'lejos, singular', a: ['that'], tip: 'Lejos + singular → that.' },
      { t: 'drag', q: '___ bananas here are cheaper than ___ bananas over there.', bank: ['These', 'those', 'This', 'that'], a: ['These', 'those'], tip: 'Aquí + plural → these; allí + plural → those.' },
      { t: 'order', words: 'Can I have these oranges', p: '?', tip: 'Can + sujeto + verbo + these + nombre?' },
      { t: 'choose', q: '👇 How much is ___ hat?', opts: ['this', 'these', 'those', 'them'], a: 'this', tip: 'Cerca + singular → this.' },
      { t: 'type', q: '👉 ___ mountains far away are beautiful.', hint: 'lejos, plural', a: ['those'], tip: 'Lejos + plural → those.' },
      { t: 'choose', q: '🎬 ___ was a great film yesterday!', opts: ['That', 'These', 'Those', 'This'], a: 'That', tip: 'Algo ya terminado → that.' },
      { t: 'order', words: 'I want this one not that one', p: '.', tip: 'this one / that one para no repetir.' },
    ],
  },
  {
    id: 'farm',
    name: 'Sunny Farm',
    short: 'Present Simple',
    emoji: '🐄',
    pos: [-57, -38],
    face: [0, 1],
    color: '#5fcf4a',
    grad: 'linear-gradient(135deg,#2f7f2f 0%,#6fd957 55%,#ffe066 100%)',
    topic: 'Presente simple: rutinas, la -s de he/she/it, do / does',
    board: ['PRESENT SIMPLE', 'I milk the cows', 'She milks the cows', 'Do you…? / He doesn’t…'],
    theory: [
      {
        title: 'Rutinas y verdades',
        body: `<p>Para <b>hábitos</b>, <b>rutinas</b> y cosas que <b>siempre son verdad</b>.</p>
          <p class="pill-row"><span>always</span><span>usually</span><span>often</span><span>sometimes</span><span>never</span><span>every day</span></p>`,
        ex: ['The farmer gets up at five every day.', 'Cows eat grass.', 'I always feed the chickens.'],
      },
      {
        title: 'La -s de he / she / it',
        body: `<table><tr><th>Sujeto</th><th>Verbo</th></tr>
          <tr><td>I / you / we / they</td><td>work</td></tr><tr><td>he / she / it</td><td>work<b>s</b></td></tr></table>
          <p>go → go<b>es</b> · watch → watch<b>es</b> · fly → fl<b>ies</b> · have → <b>has</b></p>`,
        ex: ['She feeds the pigs.', 'The dog watches the sheep.', 'My uncle has a tractor.'],
      },
      {
        title: 'Negativas y preguntas: do / does',
        body: `<table><tr><td>➖</td><td>I <b>don’t</b> drive. / He <b>doesn’t</b> drive.</td></tr>
          <tr><td>❓</td><td><b>Do</b> you like eggs? / <b>Does</b> she like eggs?</td></tr></table>
          <p class="warn">Con does/doesn’t el verbo <b>pierde la -s</b>: ❌ He doesn’t <s>drives</s></p>`,
        ex: ['He doesn’t drive the tractor.', 'Do you like eggs?', 'Does the cow give milk? Yes, it does.'],
      },
    ],
    questions: [
      { t: 'choose', q: 'The farmer ___ up at five every morning.', opts: ['gets', 'get', 'getting', 'is get'], a: 'gets', tip: 'he/she/it → verbo + s.' },
      { t: 'type', q: 'My sister ___ the chickens every day.', hint: 'feed', a: ['feeds'], tip: 'she → feeds.' },
      { t: 'choose', q: 'Cows ___ grass.', opts: ['eat', 'eats', 'eating', 'is eat'], a: 'eat', tip: 'Plural (they) → sin -s.' },
      { t: 'type', q: 'The dog ___ the sheep all day.', hint: 'watch', a: ['watches'], tip: 'Acaba en -ch → -es.' },
      { t: 'choose', q: '___ your uncle have a tractor?', opts: ['Does', 'Do', 'Is', 'Has'], a: 'Does', tip: 'he/she/it → Does…?' },
      { t: 'choose', q: 'Pigs ___ fly!', opts: ['don’t', 'doesn’t', 'aren’t', 'not'], a: 'don’t', tip: 'they → don’t.' },
      { t: 'drag', q: 'She ___ coffee but she ___ tea.', bank: ['drinks', 'doesn’t drink', 'drink', 'don’t drink'], a: ['drinks', 'doesn’t drink'], tip: 'Afirmativa con -s; negativa: doesn’t + base.' },
      { t: 'order', words: 'We always feed the horses at seven', p: '.', tip: 'El adverbio de frecuencia va antes del verbo.' },
      { t: 'type', q: 'The bird ___ to the barn every evening.', hint: 'fly', a: ['flies'], tip: 'Consonante + y → -ies.' },
      { t: 'order', words: 'Does the farmer grow carrots', p: '?', tip: 'Does + sujeto + verbo base?' },
      { t: 'choose', q: 'I ___ go to the farm on Sundays.', opts: ['usually', 'usual', 'am usually', 'usualy'], a: 'usually', tip: 'Adverbio de frecuencia antes del verbo.' },
    ],
  },
  {
    id: 'circus',
    name: 'Circus Right Now',
    short: 'Present Continuous',
    emoji: '🎪',
    pos: [57, -38],
    face: [0, 1],
    color: '#ff4f8b',
    grad: 'linear-gradient(135deg,#b3135f 0%,#ff4f8b 50%,#ffd23f 100%)',
    topic: 'Presente continuo: am / is / are + -ing (lo que pasa ahora)',
    board: ['PRESENT CONTINUOUS', 'I am juggling', 'She is flying', 'Are you…?'],
    theory: [
      {
        title: 'Lo que pasa AHORA',
        body: `<p><b>am / is / are + verbo-ing</b> para acciones que están pasando en este momento.</p>
          <p class="pill-row"><span>now</span><span>right now</span><span>at the moment</span><span>Look!</span><span>Listen!</span></p>`,
        ex: ['Look! The clown is juggling.', 'The lions are sleeping now.', 'I am watching the show.'],
      },
      {
        title: 'Cómo se forma el -ing',
        body: `<table><tr><td>Normal</td><td>play → play<b>ing</b></td></tr>
          <tr><td>Acaba en -e</td><td>ride → rid<b>ing</b></td></tr>
          <tr><td>CVC corto</td><td>run → ru<b>nning</b>, swim → swi<b>mming</b></td></tr>
          <tr><td>-ie → -ying</td><td>lie → l<b>ying</b></td></tr></table>`,
        ex: ['The acrobat is running.', 'The children are smiling.', 'The seal is swimming.'],
      },
      {
        title: 'Negativas, preguntas… y vs. presente simple',
        body: `<table><tr><td>➖</td><td>The elephant <b>isn’t</b> dancing.</td></tr>
          <tr><td>❓</td><td><b>Are</b> you having fun? — Yes, I <b>am</b>!</td></tr>
          <tr><td>🔁 / ⏱️</td><td>Every day he <b>juggles</b>, but now he <b>is riding</b> a unicycle.</td></tr></table>`,
        ex: ['The elephant isn’t dancing.', 'Are you having fun?', 'Every day he juggles, but now he is riding a unicycle.'],
      },
    ],
    questions: [
      { t: 'choose', q: 'Look! The clown ___ five balls.', opts: ['is juggling', 'juggles', 'juggling', 'are juggling'], a: 'is juggling', tip: 'Look! → algo que pasa ahora.' },
      { t: 'type', q: 'The lions ___ right now. Shh!', hint: 'sleep', a: ['are sleeping', "'re sleeping"], tip: 'they → are + -ing.' },
      { t: 'choose', q: 'I ___ watching the show.', opts: ['am', 'is', 'are', 'be'], a: 'am', tip: 'I → am.' },
      { t: 'type', q: 'The acrobat ___ on the rope at the moment.', hint: 'run', a: ['is running', "'s running"], tip: 'run → running (dobla la n).' },
      { t: 'choose', q: '___ you having fun? — Yes, I am!', opts: ['Are', 'Do', 'Is', 'Am'], a: 'Are', tip: 'Pregunta: Are + you + -ing?' },
      { t: 'drag', q: 'The elephant ___ ___, it is sleeping.', bank: ['isn’t', 'dancing', 'dance', 'doesn’t', 'aren’t'], a: ['isn’t', 'dancing'], tip: 'isn’t + -ing.' },
      { t: 'order', words: 'The children are laughing at the clown', p: '.', tip: 'Sujeto + are + -ing + complemento.' },
      { t: 'choose', q: 'Listen! Somebody ___ the drums.', opts: ['is playing', 'plays', 'play', 'playing'], a: 'is playing', tip: 'Listen! → ahora.' },
      { t: 'type', q: 'We ___ popcorn now.', hint: 'eat', a: ['are eating', "'re eating"], tip: 'we → are eating.' },
      { t: 'choose', q: 'Every day he juggles, but now he ___ a unicycle.', opts: ['is riding', 'rides', 'riding', 'ride'], a: 'is riding', tip: 'now → presente continuo.' },
      { t: 'order', words: 'Is the magician wearing a hat', p: '?', tip: 'Is + sujeto + -ing?' },
    ],
  },
  {
    id: 'stadium',
    name: 'Champions Stadium',
    short: 'Comparatives',
    emoji: '🏆',
    pos: [57, 38],
    face: [0, -1],
    color: '#3fb6ff',
    grad: 'linear-gradient(135deg,#0a4fa3 0%,#3fb6ff 50%,#7ee36b 100%)',
    topic: 'Comparativos y superlativos: -er / -est, more / most, than',
    board: ['COMPARE!', 'fast → faster → fastest', 'good → better → best', 'more exciting than'],
    theory: [
      {
        title: 'Adjetivos cortos: -er / the -est',
        body: `<table><tr><th>Adjetivo</th><th>Comparativo</th><th>Superlativo</th></tr>
          <tr><td>fast</td><td>fast<b>er</b></td><td>the fast<b>est</b></td></tr>
          <tr><td>big</td><td>bi<b>gger</b></td><td>the bi<b>ggest</b></td></tr>
          <tr><td>happy</td><td>happ<b>ier</b></td><td>the happ<b>iest</b></td></tr>
          <tr><td>nice</td><td>nice<b>r</b></td><td>the nice<b>st</b></td></tr></table>`,
        ex: ['Max is faster than Leo.', 'Luna is the fastest runner.', 'The stadium is bigger than the gym.'],
      },
      {
        title: 'Adjetivos largos: more / the most',
        body: `<p>exciting → <b>more</b> exciting → <b>the most</b> exciting</p><p>Comparativo + <b>than</b> · Superlativo con <b>the</b></p>`,
        ex: ['Football is more popular than golf.', 'This is the most exciting match!'],
      },
      {
        title: 'Irregulares',
        body: `<table><tr><td>good</td><td><b>better</b></td><td>the <b>best</b></td></tr>
          <tr><td>bad</td><td><b>worse</b></td><td>the <b>worst</b></td></tr>
          <tr><td>far</td><td><b>further</b></td><td>the <b>furthest</b></td></tr></table>`,
        ex: ['Our team is better than yours.', 'That was the worst game ever!'],
      },
    ],
    questions: [
      { t: 'choose', q: 'A cheetah is ___ than a horse.', opts: ['faster', 'fastest', 'more fast', 'the faster'], a: 'faster', tip: 'Corto + than → -er.' },
      { t: 'type', q: 'Luna is the ___ runner in the team.', hint: 'fast', a: ['fastest'], tip: 'the + -est.' },
      { t: 'choose', q: 'Football is ___ popular than golf.', opts: ['more', 'most', 'the most', 'much'], a: 'more', tip: 'Largo → more … than.' },
      { t: 'type', q: 'Our team is ___ than yours!', hint: 'good', a: ['better'], tip: 'good → better.' },
      { t: 'choose', q: 'That was the ___ game ever. We lost 10-0!', opts: ['worst', 'worse', 'baddest', 'most bad'], a: 'worst', tip: 'bad → worse → the worst.' },
      { t: 'type', q: 'The stadium is ___ than the gym.', hint: 'big', a: ['bigger'], tip: 'big → bigger (dobla la g).' },
      { t: 'drag', q: 'This match is ___ exciting ___ the last one.', bank: ['more', 'than', 'most', 'that', 'then'], a: ['more', 'than'], tip: 'more + adjetivo + than.' },
      { t: 'order', words: 'She is the best player in the world', p: '.', tip: 'the best = superlativo de good.' },
      { t: 'choose', q: 'Which is the ___ sport in the world?', opts: ['most popular', 'more popular', 'popularest', 'popular'], a: 'most popular', tip: 'the most + largo.' },
      { t: 'type', q: 'I am ___ today than yesterday. We won!', hint: 'happy', a: ['happier'], tip: '-y → -ier.' },
      { t: 'order', words: 'Is basketball easier than tennis', p: '?', tip: 'easy → easier + than.' },
    ],
  },
  {
    id: 'haunted',
    name: 'Haunted House',
    short: 'Prepositions',
    emoji: '👻',
    pos: [-57, 38],
    face: [0, -1],
    color: '#a06bff',
    grad: 'linear-gradient(135deg,#1d0b3a 0%,#5b2a9e 50%,#a06bff 100%)',
    topic: 'Preposiciones de lugar: in, on, under, behind, next to, between…',
    board: ['WHERE IS THE GHOST?', 'in · on · under', 'behind · next to', 'between · in front of'],
    theory: [
      {
        title: 'Las básicas',
        body: `<table><tr><td>📦 <b>in</b></td><td>dentro</td></tr><tr><td>🪑 <b>on</b></td><td>encima (tocando)</td></tr><tr><td>🛏️ <b>under</b></td><td>debajo</td></tr></table>`,
        ex: ['The ghost is in the box.', 'The pumpkin is on the table.', 'The cat is under the bed.'],
      },
      {
        title: 'Alrededor de algo',
        body: `<table><tr><td><b>behind</b></td><td>detrás</td></tr><tr><td><b>in front of</b></td><td>delante</td></tr>
          <tr><td><b>next to</b></td><td>al lado</td></tr><tr><td><b>between</b></td><td>entre (dos cosas)</td></tr><tr><td><b>opposite</b></td><td>enfrente</td></tr></table>`,
        ex: ['The ghost is behind the door.', 'The witch is next to the window.', 'The bat is between the two candles.'],
      },
      {
        title: 'Where is / Where are?',
        body: `<p><b>Where is</b> + singular · <b>Where are</b> + plural</p>`,
        ex: ['Where is the ghost? It’s under the stairs.', 'Where are the bats? They’re in the tower.'],
      },
    ],
    questions: [
      { t: 'choose', q: '👻📦 The ghost is ___ the box. (dentro)', opts: ['in', 'on', 'under', 'between'], a: 'in', tip: 'Dentro → in.' },
      { t: 'choose', q: 'The pumpkin is ___ the table. (encima)', opts: ['on', 'in', 'under', 'behind'], a: 'on', tip: 'Encima tocando → on.' },
      { t: 'choose', q: 'The cat is hiding ___ the bed. (debajo)', opts: ['under', 'on', 'in', 'between'], a: 'under', tip: 'Debajo → under.' },
      { t: 'type', q: 'The bat is ___ the two candles.', hint: 'entre', a: ['between'], tip: 'Entre dos → between.' },
      { t: 'type', q: 'The witch is standing ___ the window.', hint: 'al lado de', a: ['next to'], tip: 'Al lado → next to.' },
      { t: 'choose', q: 'Boo! The ghost is ___ the door. (detrás)', opts: ['behind', 'in front of', 'on', 'between'], a: 'behind', tip: 'Detrás → behind.' },
      { t: 'drag', q: 'The spider is ___ the wall and the skeleton is ___ the cupboard.', bank: ['on', 'in', 'under', 'next', 'of'], a: ['on', 'in'], tip: 'En la pared → on; dentro del armario → in.' },
      { t: 'order', words: 'The ghost is in front of the house', p: '.', tip: 'in front of = delante de.' },
      { t: 'choose', q: '___ are the bats? — They’re in the tower.', opts: ['Where', 'What', 'Who', 'When'], a: 'Where', tip: 'Lugar → Where.' },
      { t: 'type', q: 'The broom is ___ the stairs.', hint: 'debajo', a: ['under'], tip: 'Debajo → under.' },
      { t: 'order', words: 'Where is the black cat', p: '?', tip: 'Where is + singular?' },
    ],
  },
  {
    id: 'jungle',
    name: 'Jungle Explorers',
    short: 'Present Perfect',
    emoji: '🗺️',
    pos: [57, 0],
    face: [-1, 0],
    color: '#2fbf71',
    grad: 'linear-gradient(135deg,#0b5c3b 0%,#2fbf71 50%,#d4f27a 100%)',
    topic: 'Present perfect: have / has + participio, ever, never, already, yet',
    board: ['PRESENT PERFECT', 'I have seen a tiger', 'She has found gold', 'Have you ever…?'],
    theory: [
      {
        title: 'have / has + participio',
        body: `<p>Para <b>experiencias</b> o cosas que han pasado <b>sin decir cuándo</b>.</p>
          <table><tr><td>I / you / we / they</td><td><b>have</b> (’ve) seen</td></tr><tr><td>he / she / it</td><td><b>has</b> (’s) seen</td></tr></table>`,
        ex: ['I have seen a jaguar.', 'She has climbed the temple.', 'We have found a map!'],
      },
      {
        title: 'Participios',
        body: `<p>Regulares = <b>-ed</b> (visit → visited). Irregulares típicos:</p>
          <div class="verb-grid"><span>see → <b>seen</b></span><span>eat → <b>eaten</b></span><span>go → <b>been/gone</b></span><span>find → <b>found</b></span>
          <span>swim → <b>swum</b></span><span>take → <b>taken</b></span><span>be → <b>been</b></span><span>do → <b>done</b></span></div>`,
        ex: ['The explorers have taken a lot of photos.', 'He has never swum in a river.'],
      },
      {
        title: 'ever / never · already / yet',
        body: `<table><tr><td><b>ever</b></td><td>¿alguna vez? Have you <b>ever</b> seen a snake?</td></tr>
          <tr><td><b>never</b></td><td>nunca: I have <b>never</b> been there.</td></tr>
          <tr><td><b>already</b></td><td>ya (afirmativa)</td></tr><tr><td><b>yet</b></td><td>ya / todavía (preguntas y negativas, al final)</td></tr></table>`,
        ex: ['Have you ever seen a snake?', 'We have already found the temple.', 'I haven’t eaten yet.'],
      },
    ],
    questions: [
      { t: 'choose', q: 'I ___ seen a real jaguar!', opts: ['have', 'has', 'am', 'did'], a: 'have', tip: 'I → have + participio.' },
      { t: 'type', q: 'She ___ the temple three times.', hint: 'climb', a: ['has climbed', "'s climbed"], tip: 'she → has + -ed.' },
      { t: 'choose', q: 'Have you ___ eaten a spider?', opts: ['ever', 'never', 'yet', 'already'], a: 'ever', tip: 'Pregunta de experiencia → ever.' },
      { t: 'type', q: 'We have ___ the secret map!', hint: 'find', a: ['found'], tip: 'find → found.' },
      { t: 'choose', q: 'He ___ never swum in a river.', opts: ['has', 'have', 'is', 'did'], a: 'has', tip: 'he → has.' },
      { t: 'choose', q: 'Have you found the treasure ___?', opts: ['yet', 'already', 'ever', 'since'], a: 'yet', tip: 'yet al final de preguntas.' },
      { t: 'drag', q: 'We have ___ seen the waterfall, but we haven’t seen the volcano ___.', bank: ['already', 'yet', 'ever', 'never'], a: ['already', 'yet'], tip: 'already en afirmativa, yet en negativa.' },
      { t: 'order', words: 'Have you ever seen a snake', p: '?', tip: 'Have + sujeto + ever + participio?' },
      { t: 'type', q: 'They ___ lunch yet.', hint: 'not / eat', a: ["haven't eaten", 'have not eaten'], tip: 'haven’t + participio.' },
      { t: 'choose', q: 'The explorers have ___ a lot of photos.', opts: ['taken', 'took', 'take', 'taked'], a: 'taken', tip: 'take → took → taken.' },
      { t: 'order', words: 'I have never been to the Amazon', p: '.', tip: 'never va entre have y el participio.' },
    ],
  },
  {
    id: 'hero',
    name: 'Superhero HQ',
    short: 'Can / Can’t',
    emoji: '🦸',
    pos: [-57, 0],
    face: [1, 0],
    color: '#ff7a2f',
    grad: 'linear-gradient(135deg,#a3170a 0%,#ff5a2f 50%,#ffd23f 100%)',
    topic: 'Can / can’t: habilidades, permiso, peticiones y could',
    board: ['CAN / CAN’T', 'I can fly', 'He can’t swim', 'Can you…?'],
    theory: [
      {
        title: 'Habilidades',
        body: `<p><b>can + verbo base</b>. Igual para todos: sin -s y sin <i>to</i>.</p>
          <p class="warn">❌ He can <s>flies</s> · ❌ can <s>to fly</s> → ✅ He <b>can fly</b></p>`,
        ex: ['Captain Bean can fly.', 'I can run very fast.', 'She can’t swim.'],
      },
      {
        title: 'Preguntas, permiso y peticiones',
        body: `<table><tr><td>❓</td><td><b>Can</b> you lift a car? — Yes, I <b>can</b>. / No, I <b>can’t</b>.</td></tr>
          <tr><td>🙋 Permiso</td><td><b>Can I</b> go to the training room?</td></tr><tr><td>🙏 Petición</td><td><b>Can you</b> help me, please?</td></tr></table>`,
        ex: ['Can you lift a car?', 'Can I go to the training room?', 'Can you help me, please?'],
      },
      {
        title: 'Could = podía',
        body: `<p>Pasado de can: <b>could / couldn’t</b>.</p>`,
        ex: ['When I was five, I could swim.', 'Yesterday I couldn’t fly. I was tired!'],
      },
    ],
    questions: [
      { t: 'choose', q: 'Captain Bean ___ fly very high.', opts: ['can', 'cans', 'can to', 'is can'], a: 'can', tip: 'can no cambia.' },
      { t: 'choose', q: 'She can ___ through walls.', opts: ['walk', 'walks', 'to walk', 'walking'], a: 'walk', tip: 'can + verbo base.' },
      { t: 'type', q: 'Penguins ___ fly, but they can swim.', hint: 'no pueden', a: ["can't", 'cannot'], tip: 'can’t = cannot.' },
      { t: 'choose', q: '___ you lift a car? — No, I can’t!', opts: ['Can', 'Do', 'Are', 'Does'], a: 'Can', tip: 'Pregunta: Can + sujeto + verbo?' },
      { t: 'drag', q: 'I ___ run fast, but I ___ fly.', bank: ['can', 'can’t', 'cans', 'to'], a: ['can', 'can’t'], tip: 'but → contraste.' },
      { t: 'order', words: 'Can you help me please', p: '?', tip: 'Petición: Can you…?' },
      { t: 'type', q: 'When I was five, I ___ swim.', hint: 'podía', a: ['could'], tip: 'Pasado de can → could.' },
      { t: 'choose', q: 'Can I go to the training room? — Yes, you ___.', opts: ['can', 'do', 'are', 'does'], a: 'can', tip: 'Respuesta corta: Yes, you can.' },
      { t: 'order', words: 'My robot can speak five languages', p: '.', tip: 'Sujeto + can + verbo.' },
      { t: 'type', q: 'Spider-Bean ___ climb walls.', hint: 'puede', a: ['can'], tip: 'can + verbo base.' },
    ],
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));
export const ZONE_RADIUS = 13; // radio útil para la decoración de cada aula
export const ZONE_HALF = 14; // la parcela de cada aula es un cuadrado de 28x28
export const inZone = (z, x, zz) => Math.abs(x - z.pos[0]) < ZONE_HALF && Math.abs(zz - z.pos[1]) < ZONE_HALF;
export const zoneAt = (x, zz) => ZONES.find((z) => inZone(z, x, zz)) || null;
