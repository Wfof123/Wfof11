/* ============================================================
   ДОПОЛНИТЕЛЬНЫЕ МИНИ-ИГРЫ (24)
   ============================================================ */

/* Хелпер: таймер на 20 секунд с очками */
function timedRound(api, seconds, onEnd) {
  let left = seconds, running = true, sc = 0;
  const render = () => api.score(sc + ' · ' + left + 'с');
  render();
  api.every(1000, () => {
    if (!running) return;
    left--; render();
    if (left <= 0) { running = false; onEnd(sc); }
  });
  return {
    add(n) { sc += n; render(); api.bump(); },
    sub(n) { sc = Math.max(0, sc - n); render(); },
    get score() { return sc; },
    get running() { return running; },
    stop() { running = false; },
    render
  };
}

/* ---------- 53. Нажми зелёные ---------- */
reg('tapgreen', { name: 'Нажми зелёные', icon: '🟢', cat: 'Реакция', desc: 'Только зелёные квадраты', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(4,1fr)';
  wrap.style.width = '300px';
  stage.appendChild(wrap);
  let round = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function refresh() {
    wrap.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const green = Math.random() < .4;
      const c = api.el('div', 'g-cell');
      c.style.cssText = 'height:62px;border-radius:12px;transition:transform .1s;' +
        (green ? 'background:rgba(52,199,89,.28)' : 'background:rgba(255,59,48,.16)');
      c.onclick = () => {
        if (!round.running) return;
        if (green) { round.add(1); c.style.transform = 'scale(.85)'; setTimeout(() => c.remove(), 110); }
        else { round.sub(1); c.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 220 }); }
      };
      wrap.appendChild(c);
    }
  }
  api.every(900, () => { if (round.running) refresh(); });
  refresh();
  api.controls(api.btn('Заново', () => { closeGame(); openGame('tapgreen'); }, true));
});

/* ---------- 54. Посчитай точки ---------- */
reg('countdots', { name: 'Посчитай точки', icon: '🔵', cat: 'Реакция', desc: 'Сколько точек на поле?', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)' }, (stage, api) => {
  const box = api.el('div', 'g-card');
  box.style.cssText += ';width:260px;height:200px;position:relative;padding:0;overflow:hidden';
  stage.appendChild(box);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  let answer, r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function round2() {
    box.innerHTML = '';
    answer = 3 + api.rnd(12);
    for (let i = 0; i < answer; i++) {
      const d = api.el('div');
      const s = 12 + api.rnd(10);
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:#0071e3;` +
        `left:${8 + api.rnd(230)}px;top:${8 + api.rnd(170)}px;opacity:.8`;
      box.appendChild(d);
    }
    const opts = new Set([answer]);
    while (opts.size < 4) opts.add(3 + api.rnd(12));
    row.innerHTML = '';
    api.shuffle([...opts]).forEach(v => {
      const b = api.btn(String(v), () => {
        if (!r.running) return;
        if (v === answer) { r.add(1); round2(); } else r.sub(1);
      }, true);
      b.style.minWidth = '56px';
      row.appendChild(b);
    });
  }
  round2();
});

/* ---------- 55. Лишнее слово ---------- */
reg('oddword', { name: 'Лишнее слово', icon: '🔤', cat: 'Логика', desc: 'Кто не из компании?', grad: 'linear-gradient(135deg,#f6d365,#fda085)' }, (stage, api) => {
  const SETS = [
    ['яблоко', 'груша', 'слива', 'морковь'],
    ['собака', 'кошка', 'волк', 'стол'],
    ['Москва', 'Париж', 'Лондон', 'Волга'],
    ['красный', 'синий', 'зелёный', 'круглый'],
    ['бежать', 'прыгать', 'летать', 'камень'],
    ['скрипка', 'гитара', 'рояль', 'молоток'],
    ['январь', 'март', 'июль', 'понедельник'],
    ['молоко', 'кефир', 'сыр', 'хлеб'],
    ['автобус', 'трамвай', 'метро', 'самолёт'],
    ['роза', 'тюльпан', 'ромашка', 'берёза']
  ];
  const prompt = api.el('div', 'g-prompt', 'Что лишнее?');
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  let r = timedRound(api, 25, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    const set = api.pick(SETS);
    row.innerHTML = '';
    api.shuffle(set).forEach(w => {
      const b = api.btn(w, () => {
        if (!r.running) return;
        if (w === set[3]) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '92px';
      row.appendChild(b);
    });
  }
  next();
});

/* ---------- 56. Напечатай слово ---------- */
reg('typefast', { name: 'Напечатай', icon: '⌨️', cat: 'Реакция', desc: 'Успей набрать слово', grad: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' }, (stage, api) => {
  const WORDS = ['кот', 'дом', 'луна', 'сок', 'море', 'свет', 'рука', 'звезда', 'город', 'окно', 'поле', 'ветер', 'камень', 'облако'];
  const prompt = api.el('div', 'g-prompt', '');
  stage.appendChild(prompt);
  const inp = api.el('input');
  inp.type = 'text';
  inp.style.cssText = 'padding:12px 16px;border-radius:12px;border:1px solid rgba(0,0,0,.12);' +
    'font-size:17px;width:220px;text-align:center;font-family:inherit;outline:none';
  stage.appendChild(inp);

  let word, r = timedRound(api, 25, (sc) => api.overlay('⏱️', 'Время', 'Слов: ' + sc, () => { }));

  function next() {
    word = api.pick(WORDS);
    prompt.textContent = word;
    inp.value = '';
    inp.focus();
  }
  inp.addEventListener('input', () => {
    if (!r.running) return;
    if (inp.value.trim().toLowerCase() === word) { r.add(1); next(); }
    else if (inp.value.length >= word.length) r.sub(1);
  });
  next();
  api.hint('Печатай слово в поле. Ошибка на последней букве — минус очко.');
});

/* ---------- 57. Числа по порядку ---------- */
reg('sortnum', { name: 'По порядку', icon: '🔢', cat: 'Логика', desc: 'Нажимай числа от меньшего', grad: 'linear-gradient(135deg,#d4fc79,#96e6a1)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(4,1fr)';
  wrap.style.width = '300px';
  stage.appendChild(wrap);
  let nums, nextVal, r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function round2() {
    const count = 12;
    nums = api.shuffle(Array.from({ length: count }, (_, i) => i + 1));
    nextVal = 1;
    wrap.innerHTML = '';
    nums.forEach(n => {
      const c = api.el('div', 'g-cell', String(n));
      c.style.height = '58px'; c.style.fontSize = '17px';
      c.onclick = () => {
        if (!r.running) return;
        if (n === nextVal) {
          c.classList.add('done'); c.style.pointerEvents = 'none';
          nextVal++; r.add(1);
          if (nextVal > count) round2();
        } else r.sub(1);
      };
      wrap.appendChild(c);
    });
  }
  round2();
});

/* ---------- 58. Найди одинаковые ---------- */
reg('sameemoji', { name: 'Найди пару', icon: '👯', cat: 'Реакция', desc: 'Два одинаковых символа', grad: 'linear-gradient(135deg,#f093fb,#f5576c)' }, (stage, api) => {
  const POOL = ['circle', 'square', 'triangle', 'diamond', 'star', 'hex', 'moon', 'sun', 'bolt', 'drop', 'leaf', 'flower', 'heart', 'plus', 'cross', 'ring'];
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(4,1fr)';
  wrap.style.width = '300px';
  stage.appendChild(wrap);
  let r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function round2() {
    const pair = api.pick(POOL);
    const rest = api.shuffle(POOL.filter(e => e !== pair));
    const list = api.shuffle([pair, pair, ...rest.slice(0, 14)]);
    wrap.innerHTML = '';
    list.forEach(e => {
      const c = api.el('div', 'g-cell');
      c.style.cssText = 'height:62px;padding:10px';
      c.innerHTML = shapeSVG(e);
      c.onclick = () => {
        if (!r.running) return;
        if (e === pair) { r.add(1); round2(); } else r.sub(1);
      };
      wrap.appendChild(c);
    });
  }
  round2();
  api.hint('Нажми на любой из двух одинаковых символов.');
});

/* ---------- 59. Останови таймер ---------- */
reg('stoptimer', { name: 'Стоп-таймер', icon: '⏱️', cat: 'Реакция', desc: 'Останови ровно на 10.00', grad: 'linear-gradient(135deg,#fccb90,#d57eeb)' }, (stage, api) => {
  const disp = api.el('div', 'g-prompt', '0.00');
  disp.style.fontSize = '52px';
  stage.appendChild(disp);
  const res = api.el('div', 'g-stat', 'Нажми «Старт»');
  stage.appendChild(res);

  let t0 = 0, raf = null, running = false, best = null;

  function start() {
    if (running) return;
    running = true; t0 = performance.now(); best = null;
    res.textContent = 'Жми стоп на 10.00';
    tick();
  }
  function tick() {
    if (!running) return;
    disp.textContent = ((performance.now() - t0) / 1000).toFixed(2);
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (!running) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    const v = (performance.now() - t0) / 1000;
    disp.textContent = v.toFixed(2);
    const diff = Math.abs(v - 10);
    best = diff;
    res.textContent = diff < .05 ? 'Идеально! 🎯' : diff < .2 ? 'Очень близко: ' + diff.toFixed(2) + ' с' : 'Мимо на ' + diff.toFixed(2) + ' с';
    api.score(diff.toFixed(2) + ' с');
    if (diff < .05) api.confetti();
  }
  const startBtn = api.btn('Старт', start);
  api.controls(startBtn, api.btn('Стоп', stop, true));
  api.onCleanup(() => { running = false; if (raf) cancelAnimationFrame(raf); });
});

/* ---------- 60. Сколько букв ---------- */
reg('lettercount', { name: 'Сколько букв', icon: '🔡', cat: 'Логика', desc: 'Посчитай буквы в слове', grad: 'linear-gradient(135deg,#89f7fe,#66a6ff)' }, (stage, api) => {
  const WORDS = ['кот', 'молоко', 'собака', 'телефон', 'дерево', 'яблоко', 'космос', 'учитель', 'музыка', 'книга', 'дорога', 'звезда'];
  const prompt = api.el('div', 'g-prompt', '');
  prompt.style.fontSize = '30px';
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let word, r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    word = api.pick(WORDS);
    prompt.textContent = word;
    const correct = word.length;
    const opts = new Set([correct]);
    while (opts.size < 4) opts.add(2 + api.rnd(10));
    row.innerHTML = '';
    api.shuffle([...opts]).forEach(v => {
      const b = api.btn(String(v), () => {
        if (!r.running) return;
        if (v === correct) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '54px';
      row.appendChild(b);
    });
  }
  next();
});

/* ---------- 61. Собери слово ---------- */
reg('wordscramble', { name: 'Собери слово', icon: '🧩', cat: 'Головоломка', desc: 'Буквы перепутались', grad: 'linear-gradient(135deg,#c471f5,#fa71cd)' }, (stage, api) => {
  const WORDS = ['кот', 'дом', 'луна', 'море', 'свет', 'рука', 'окно', 'поле', 'ветер', 'камень', 'облако', 'звезда', 'музыка', 'книга'];
  const prompt = api.el('div', 'g-prompt', '');
  prompt.style.letterSpacing = '.35em';
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  let word, answer, picks;

  function init() {
    word = api.pick(WORDS);
    answer = word.split('');
    picks = [];
    prompt.textContent = '';
    render();
  }
  function render() {
    prompt.textContent = picks.join('') || '…';
    row.innerHTML = '';
    const letters = api.shuffle(word.split(''));
    letters.forEach((ch, i) => {
      const b = api.btn(ch, () => {
        picks.push(ch);
        if (picks.length === answer.length) {
          if (picks.join('') === word) { api.confetti(); api.overlay('🎉', 'Собрано!', word, init); }
          else { prompt.textContent = picks.join('') + ' ✗'; setTimeout(() => { picks = []; render(); }, 600); return; }
        }
        render();
      }, true);
      b.style.minWidth = '44px'; b.style.fontSize = '18px';
      row.appendChild(b);
    });
  }
  init();
  api.hint('Нажимай буквы по порядку. «Заново» — новое слово.');
  api.controls(api.btn('Заново', init, true));
});

/* ---------- 62. Столицы ---------- */
reg('capital', { name: 'Столицы', icon: '🌍', cat: 'Логика', desc: 'Столица страны', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)' }, (stage, api) => {
  const DATA = [
    ['Франция', 'Париж', ['Лондон', 'Берлин', 'Рим']],
    ['Япония', 'Токио', ['Пекин', 'Сеул', 'Бангкок']],
    ['Италия', 'Рим', ['Мадрид', 'Париж', 'Афины']],
    ['Испания', 'Мадрид', ['Лиссабон', 'Рим', 'Париж']],
    ['Германия', 'Берлин', ['Мюнхен', 'Вена', 'Прага']],
    ['Канада', 'Оттава', ['Торонто', 'Монреаль', 'Ванкувер']],
    ['Австралия', 'Канберра', ['Сидней', 'Мельбурн', 'Перт']],
    ['Бразилия', 'Бразилиа', ['Рио', 'Сан-Паулу', 'Сальвадор']],
    ['Египет', 'Каир', ['Александрия', 'Луксор', 'Гиза']],
    ['Норвегия', 'Осло', ['Берген', 'Стокгольм', 'Копенгаген']]
  ];
  const prompt = api.el('div', 'g-prompt', '');
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let r = timedRound(api, 25, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    const [country, cap, wrong] = api.pick(DATA);
    prompt.textContent = 'Столица: ' + country;
    row.innerHTML = '';
    api.shuffle([cap, ...wrong]).forEach(c => {
      const b = api.btn(c, () => {
        if (!r.running) return;
        if (c === cap) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '96px';
      row.appendChild(b);
    });
  }
  next();
});

/* ---------- 63. Простое число? ---------- */
reg('primecheck', { name: 'Простое?', icon: '🔍', cat: 'Логика', desc: 'Делится только на себя?', grad: 'linear-gradient(135deg,#232526,#414345)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  prompt.style.fontSize = '48px';
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  const isPrime = (n) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  };
  let n, r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() { n = 2 + api.rnd(58); prompt.textContent = n; }
  function answer(yes) {
    if (!r.running) return;
    if (yes === isPrime(n)) { r.add(1); next(); } else r.sub(1);
  }
  api.controls(api.btn('Простое', () => answer(true)), api.btn('Составное', () => answer(false), true));
  next();
});

/* ---------- 64. Двоичные биты ---------- */
reg('bitclick', { name: 'Собери число', icon: '🔌', cat: 'Головоломка', desc: 'Включи биты — получи число', grad: 'linear-gradient(135deg,#667eea,#764ba2)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  const val = api.el('div', 'g-stat', '0');
  stage.appendChild(val);

  const BITS = [64, 32, 16, 8, 4, 2, 1];
  let target, bits;

  function init() {
    target = 1 + api.rnd(127);
    bits = BITS.map(() => false);
    prompt.textContent = 'Собери ' + target;
    render();
  }
  function render() {
    row.innerHTML = '';
    BITS.forEach((b, i) => {
      const btn = api.btn(String(b), () => {
        bits[i] = !bits[i];
        render();
        const sum = BITS.reduce((a, v, k) => a + (bits[k] ? v : 0), 0);
        if (sum === target) { api.confetti(); api.overlay('🎯', 'Верно!', target + ' = ' + BITS.filter((v, k) => bits[k]).join(' + '), init); }
      }, !bits[i]);
      btn.style.minWidth = '44px';
      btn.style.opacity = bits[i] ? '1' : '.45';
      row.appendChild(btn);
    });
    val.textContent = BITS.reduce((a, v, k) => a + (bits[k] ? v : 0), 0);
    api.score(BITS.reduce((a, v, k) => a + (bits[k] ? v : 0), 0) + '/' + target);
  }
  init();
});

/* ---------- 65. Самое длинное слово ---------- */
reg('longestword', { name: 'Самое длинное', icon: '📏', cat: 'Логика', desc: 'Выбери длинное слово', grad: 'linear-gradient(135deg,#a8edea,#fed6e3)' }, (stage, api) => {
  const WORDS = ['кот', 'солнце', 'дом', 'библиотека', 'рука', 'университет', 'сок', 'путешествие', 'море', 'электричество',
                 'лес', 'программирование', 'мир', 'конституция', 'свет', 'достопримечательность'];
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    const set = api.shuffle(WORDS).slice(0, 4);
    const longest = set.reduce((a, b) => b.length > a.length ? b : a, '');
    row.innerHTML = '';
    set.forEach(w => {
      const b = api.btn(w, () => {
        if (!r.running) return;
        if (w === longest) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '92px'; b.style.fontSize = '13px';
      row.appendChild(b);
    });
  }
  next();
});

/* ---------- 66. Запомни цвет ---------- */
reg('colorcode', { name: 'Запомни цвет', icon: '🎨', cat: 'Логика', desc: 'Какой был цвет?', grad: 'linear-gradient(135deg,#fa709a,#fee140)' }, (stage, api) => {
  const COLORS = [
    { n: 'красный', c: '#ff3b30' }, { n: 'зелёный', c: '#34c759' },
    { n: 'синий', c: '#0071e3' }, { n: 'жёлтый', c: '#ffcc00' },
    { n: 'фиолетовый', c: '#af7aff' }, { n: 'оранжевый', c: '#ff9500' }
  ];
  const swatch = api.el('div', 'g-card');
  swatch.style.cssText += ';width:180px;height:120px;padding:0;margin:0 auto;transition:background .2s';
  stage.appendChild(swatch);
  const prompt = api.el('div', 'g-prompt', 'Смотри…');
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  let cur, r = timedRound(api, 30, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));
  let phase = 'show';

  function next() {
    phase = 'show';
    cur = api.pick(COLORS);
    swatch.style.background = cur.c;
    prompt.textContent = 'Смотри…';
    row.innerHTML = '';
    setTimeout(() => {
      swatch.style.background = 'rgba(0,0,0,.05)';
      prompt.textContent = 'Какой цвет был?';
      phase = 'ask';
      row.innerHTML = '';
      api.shuffle(COLORS).slice(0, 4).concat(COLORS.filter(c => c.n === cur.n)).filter((v, i, a) => a.findIndex(x => x.n === v.n) === i).slice(0, 4).forEach(c => {
        const b = api.btn(c.n, () => {
          if (!r.running || phase !== 'ask') return;
          if (c.n === cur.n) { r.add(1); next(); } else r.sub(1);
        }, true);
        b.style.minWidth = '92px';
        row.appendChild(b);
      });
    }, 900);
  }
  next();
});

/* ---------- 67. Повтори ритм ---------- */
reg('taprhythm', { name: 'Ритм', icon: '🥁', cat: 'Реакция', desc: 'Повтори удары', grad: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' }, (stage, api) => {
  const pad = api.el('div', 'g-card');
  pad.style.cssText += ';width:140px;height:140px;border-radius:50%;margin:0 auto;display:flex;' +
    'align-items:center;justify-content:center;font-size:46px;cursor:pointer;user-select:none';
  pad.textContent = '\u266A';
  stage.appendChild(pad);
  const status = api.el('div', 'g-prompt', 'Нажми «Играть»');
  stage.appendChild(status);

  let seq, input, playing, level;

  function play() {
    if (!seq) return;
    playing = true;
    status.textContent = 'Слушай…';
    let i = 0;
    const step = () => {
      if (!seq) return;
      if (i >= seq.length) { playing = false; input = 0; status.textContent = 'Повтори: ' + seq.length + ' ударов'; return; }
      if (seq[i]) {
        pad.animate([{ transform: 'scale(1)' }, { transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 180 });
        pad.style.background = 'rgba(0,113,227,.25)';
        setTimeout(() => pad.style.background = '', 140);
      }
      i++;
      setTimeout(step, 320);
    };
    setTimeout(step, 400);
  }
  function start() {
    level = 1; seq = []; input = 0;
    addLevel();
  }
  function addLevel() {
    seq = Array.from({ length: 3 + level }, () => Math.random() < .55 ? 1 : 0);
    if (!seq.some(Boolean)) seq[0] = 1;
    api.score('уровень ' + level);
    play();
  }
  pad.onclick = () => {
    if (playing || !seq) return;
    const expected = seq.filter(Boolean).length;
    input++;
    pad.animate([{ transform: 'scale(1)' }, { transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 150 });
    if (input >= expected) {
      level++;
      api.bump();
      status.textContent = 'Верно!';
      setTimeout(addLevel, 500);
    }
  };
  api.controls(api.btn('Играть', start));
  api.onCleanup(() => { seq = null; playing = true; });
});

/* ---------- 68. Угадай сумму ---------- */
reg('diceguess', { name: 'Угадай сумму', icon: '🎲', cat: 'Удача', desc: 'Сумма двух кубиков', grad: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', 'Выбери сумму');
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  const dice = api.el('div', 'g-row');
  stage.appendChild(dice);
  let coins = 50, guess = null, busy = false;

  const opts = [];
  for (let s = 2; s <= 12; s++) opts.push(s);
  api.shuffle(opts).forEach(s => {
    const b = api.btn(String(s), () => { if (busy) return; guess = s; roll(); }, true);
    b.style.minWidth = '44px';
    row.appendChild(b);
  });

  function roll() {
    busy = true;
    let n = 0;
    const iv = setInterval(() => {
      dice.innerHTML = '';
      dice.appendChild(api.el('div', 'g-big', String(1 + api.rnd(6))));
      dice.appendChild(api.el('div', 'g-big', String(1 + api.rnd(6))));
      if (++n > 8) {
        clearInterval(iv);
        const a = 1 + api.rnd(6), b = 1 + api.rnd(6), sum = a + b;
        dice.innerHTML = '';
        dice.appendChild(api.el('div', 'g-big', String(a)));
        dice.appendChild(api.el('div', 'g-big', String(b)));
        const win = sum === guess ? (sum === 7 ? 40 : 20) : -10;
        coins = Math.max(0, coins + win);
        prompt.textContent = 'Выпало ' + sum + ' · ' + (win > 0 ? '+' + win : win);
        api.score(coins);
        if (win > 0) { api.bump(); if (sum === 7) api.confetti(); }
        busy = false;
        if (coins <= 0) api.overlay('💸', 'Всё', 'Монеты кончились', () => { coins = 50; api.score(coins); prompt.textContent = 'Выбери сумму'; });
      }
    }, 70);
    api.onCleanup(() => clearInterval(iv));
  }
  api.score(coins);
  api.hint('7 приносит +40, любая другая угаданная сумма +20, промах −10.');
});

/* ---------- 69. Зеркальная буква ---------- */
reg('mirrorletter', { name: 'Зеркало', icon: '🪞', cat: 'Логика', desc: 'Какая буква отражена?', grad: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)' }, (stage, api) => {
  const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т'];
  const prompt = api.el('div', 'g-prompt', '');
  prompt.style.fontSize = '64px';
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let cur, r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    cur = api.pick(LETTERS);
    prompt.textContent = cur;
    prompt.style.transform = 'scaleX(-1)';
    const opts = new Set([cur]);
    while (opts.size < 4) opts.add(api.pick(LETTERS));
    row.innerHTML = '';
    api.shuffle([...opts]).forEach(ch => {
      const b = api.btn(ch, () => {
        if (!r.running) return;
        if (ch === cur) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '56px'; b.style.fontSize = '20px';
      row.appendChild(b);
    });
  }
  next();
  api.hint('Буква показана зеркально. Выбери, что это за буква.');
});

/* ---------- 70. Какая фигура больше ---------- */
reg('biggerbox', { name: 'Кто больше', icon: '⬛', cat: 'Логика', desc: 'Сравни площадь фигур', grad: 'linear-gradient(135deg,#d4fc79,#96e6a1)' }, (stage, api) => {
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  const prompt = api.el('div', 'g-prompt', 'Какая фигура больше?');
  stage.insertBefore(prompt, row);
  let r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    const a = 40 + api.rnd(80);
    let b = 40 + api.rnd(80);
    while (Math.abs(a - b) < 8) b = 40 + api.rnd(80);
    row.innerHTML = '';
    [a, b].forEach((size, i) => {
      const box = api.el('div');
      box.style.cssText = `width:${size}px;height:${size}px;border-radius:12px;cursor:pointer;` +
        `background:linear-gradient(135deg,#0071e3,#5856d6);transition:transform .15s`;
      box.onclick = () => {
        if (!r.running) return;
        const bigger = Math.max(a, b);
        if (size === bigger) { r.add(1); next(); } else r.sub(1);
      };
      row.appendChild(box);
    });
  }
  next();
});

/* ---------- 71. Останови стрелку ---------- */
reg('spintarget', { name: 'Стрелка', icon: '🧭', cat: 'Реакция', desc: 'Попади в зелёный сектор', grad: 'linear-gradient(135deg,#00c7be,#30d158)' }, (stage, api) => {
  const c = api.canvas(260, 260);
  c.style.cssText = 'border-radius:50%;background:rgba(0,0,0,.03);max-width:100%';
  const ctx = c.getContext('2d');
  stage.appendChild(c);
  const res = api.el('div', 'g-prompt', 'Нажми «Крутить»');
  stage.appendChild(res);

  const R = 130;
  let angle = 0, speed = 0, spinning = false, target = 0, raf = null, hits = 0, tries = 0;

  function draw() {
    ctx.clearRect(0, 0, 260, 260);
    // Зелёный сектор ±18°
    ctx.beginPath(); ctx.moveTo(R, R);
    ctx.arc(R, R, R - 8, target - .32, target + .32);
    ctx.closePath(); ctx.fillStyle = 'rgba(52,199,89,.35)'; ctx.fill();
    // Стрелка
    ctx.save(); ctx.translate(R, R); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, -R + 18); ctx.lineTo(-11, 0); ctx.lineTo(11, 0); ctx.closePath();
    ctx.fillStyle = '#1d1d1f'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(R, R, 8, 0, Math.PI * 2); ctx.fillStyle = '#1d1d1f'; ctx.fill();
  }
  function spin() {
    if (spinning) return;
    spinning = true;
    target = Math.random() * Math.PI * 2;
    speed = .38 + Math.random() * .22;
    tries++;
    res.textContent = 'Жми «Стоп»!';
    tick();
  }
  function tick() {
    if (!spinning) return;
    angle += speed;
    draw();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (!spinning) return;
    spinning = false;
    if (raf) cancelAnimationFrame(raf);
    let d = Math.abs(((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - ((target % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
    if (d > Math.PI) d = Math.PI * 2 - d;
    if (d < .32) { hits++; api.confetti(); res.textContent = 'В точку! ' + hits + '/' + tries; api.bump(); }
    else res.textContent = 'Мимо. ' + hits + '/' + tries;
    api.score(hits + '/' + tries);
    target = Math.random() * Math.PI * 2;
    draw();
  }
  draw();
  api.controls(api.btn('Крутить', spin), api.btn('Стоп', stop, true));
  api.onCleanup(() => { spinning = false; if (raf) cancelAnimationFrame(raf); });
});

/* ---------- 72. Цепочка примеров ---------- */
reg('mathchain', { name: 'Цепочка', icon: '➗', cat: 'Логика', desc: 'Продолжи цепочку', grad: 'linear-gradient(135deg,#ffecd2,#fcb69f)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let r = timedRound(api, 25, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    const start = 1 + api.rnd(20);
    const d = 2 + api.rnd(7);
    const seq = [start, start + d, start + 2 * d, start + 3 * d];
    prompt.textContent = seq.join(' → ') + ' → ?';
    const correct = start + 4 * d;
    const opts = new Set([correct]);
    while (opts.size < 4) opts.add(correct + (api.rnd(11) - 5));
    row.innerHTML = '';
    api.shuffle([...opts]).forEach(v => {
      const b = api.btn(String(v), () => {
        if (!r.running) return;
        if (v === correct) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '56px';
      row.appendChild(b);
    });
  }
  next();
});

/* ---------- 73. Найди символ ---------- */
reg('findsymbol', { name: 'Найди символ', icon: '🔎', cat: 'Реакция', desc: 'Один символ отличается', grad: 'linear-gradient(135deg,#f093fb,#f5576c)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(5,1fr)';
  wrap.style.width = '320px';
  stage.appendChild(wrap);
  let r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  const PAIRS = [['●', '○'], ['▲', '△'], ['■', '□'], ['◆', '◇'], ['★', '☆'], ['✚', '✛'], ['♥', '♡'], ['♦', '♢']];

  function next() {
    const [base, odd] = api.pick(PAIRS);
    const total = 20;
    const idx = api.rnd(total);
    wrap.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const c = api.el('div', 'g-cell', i === idx ? odd : base);
      c.style.height = '56px'; c.style.fontSize = '24px';
      c.onclick = () => {
        if (!r.running) return;
        if (i === idx) { r.add(1); next(); } else r.sub(1);
      };
      wrap.appendChild(c);
    }
  }
  next();
});

/* ---------- 74. Чётных больше? ---------- */
reg('evencount', { name: 'Чётных больше', icon: '🔢', cat: 'Логика', desc: 'Чётных или нечётных?', grad: 'linear-gradient(135deg,#89f7fe,#66a6ff)' }, (stage, api) => {
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  const prompt = api.el('div', 'g-prompt', '');
  stage.insertBefore(prompt, row);
  let r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    const nums = Array.from({ length: 9 }, () => 1 + api.rnd(50));
    let even = 0, odd = 0;
    nums.forEach(n => n % 2 === 0 ? even++ : odd++);
    if (even === odd) nums[0] += 1, (nums[0] % 2 === 0 ? even++ : odd++), (nums[0] - 1) % 2 === 0 ? even-- : odd--;
    prompt.textContent = nums.join('  ');
    row.innerHTML = '';
    [['Чётных', even > odd], ['Нечётных', odd > even]].forEach(([label, ok]) => {
      const b = api.btn(label, () => {
        if (!r.running) return;
        if (ok) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '110px';
      row.appendChild(b);
    });
  }
  next();
});

/* ---------- 75. Попади в цель ---------- */
reg('aimclick', { name: 'Попади в цель', icon: '🎯', cat: 'Реакция', desc: 'Кликай по мишеням', grad: 'linear-gradient(135deg,#f85032,#e73827)' }, (stage, api) => {
  const box = api.el('div', 'g-card');
  box.style.cssText += ';width:300px;height:240px;position:relative;padding:0;overflow:hidden';
  stage.appendChild(box);
  let score = 0, missed = 0, timer = null, t0 = 0;

  function spawn() {
    if (timer) return;
    t0 = performance.now();
    tick();
  }
  function tick() {
    if (performance.now() - t0 > 25000) { end(); return; }
    box.innerHTML = '';
    const d = api.el('div');
    const s = 46;
    d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;cursor:pointer;` +
      `background:radial-gradient(circle,#ff3b30 30%,#fff 30%,#fff 50%,#ff3b30 50%);` +
      `left:${10 + api.rnd(240)}px;top:${10 + api.rnd(180)}px;animation:bounceIn .25s ease`;
    d.onclick = (e) => { e.stopPropagation(); score++; api.score(score); api.bump(); clearTimeout(timer); timer = null; setTimeout(spawn, 180); };
    box.appendChild(d);
    timer = setTimeout(() => { timer = null; missed++; tick(); }, 1100);
  }
  function end() {
    clearTimeout(timer); timer = null;
    api.overlay('🎯', 'Готово', 'Попаданий: ' + score + ' · промахов: ' + missed, () => { score = 0; missed = 0; api.score('0'); spawn(); });
  }
  box.onclick = () => { missed++; };
  spawn();
  api.onCleanup(() => { clearTimeout(timer); });
  api.hint('25 секунд. Промах мимо мишени считается промахом.');
});

/* ---------- 76. Угадай эмодзи ---------- */
reg('emojiquiz', { name: 'Угадай иконку', icon: '🧩', cat: 'Логика', desc: 'Узнай что за символ', grad: 'linear-gradient(135deg,#f6d365,#fda085)' }, (stage, api) => {
  const DATA = [
    { svg: 'heart', answer: 'Сердце', wrong: ['Луна', 'Капля', 'Звезда'] },
    { svg: 'drop', answer: 'Капля', wrong: ['Сердце', 'Огонь', 'Лист'] },
    { svg: 'star', answer: 'Звезда', wrong: ['Квадрат', 'Круг', 'Плюс'] },
    { svg: 'moon', answer: 'Луна', wrong: ['Капля', 'Круг', 'Сердце'] },
    { svg: 'leaf', answer: 'Лист', wrong: ['Капля', 'Квадрат', 'Луна'] },
    { svg: 'sun', answer: 'Солнце', wrong: ['Звезда', 'Луна', 'Круг'] },
    { svg: 'heart', answer: 'Сердце', wrong: ['Огонь', 'Капля', 'Звезда'] },
    { svg: 'plus', answer: 'Плюс', wrong: ['Квадрат', 'Крест', 'Круг'] },
    { svg: 'circle', answer: 'Круг', wrong: ['Квадрат', 'Звезда', 'Крест'] },
    { svg: 'square', answer: 'Квадрат', wrong: ['Круг', 'Плюс', 'Крест'] },
    { svg: 'fire', answer: 'Огонь', wrong: ['Капля', 'Сердце', 'Лист'] },
    { svg: 'target', answer: 'Мишень', wrong: ['Круг', 'Квадрат', 'Звезда'] },
    { svg: 'bolt', answer: 'Молния', wrong: ['Огонь', 'Звезда', 'Лист'] },
    { svg: 'flag', answer: 'Флаг', wrong: ['Лист', 'Капля', 'Огонь'] }
  ];
  const prompt = api.el('div', 'g-prompt', '');
  prompt.style.fontSize = '58px';
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let r = timedRound(api, 20, (sc) => api.overlay('⏱️', 'Время', 'Очков: ' + sc, () => { }));

  function next() {
    const item = api.pick(DATA);
    const answer = item.answer;
    prompt.innerHTML = ic(item.svg);
    const wrong = api.shuffle(DATA.filter(d => d.answer !== answer)).slice(0, 3).map(d => d.answer);
    row.innerHTML = '';
    api.shuffle([answer, ...wrong]).forEach(w => {
      const b = api.btn(w, () => {
        if (!r.running) return;
        if (w === answer) { r.add(1); next(); } else r.sub(1);
      }, true);
      b.style.minWidth = '92px';
      row.appendChild(b);
    });
  }
  next();
});
