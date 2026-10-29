/* ============================================================
   ЛОГИКА И РЕАКЦИЯ (14 игр)
   ============================================================ */

/* ---------- 27. Реакция ---------- */
reg('reaction', { name: 'Реакция', icon: '⚡', cat: 'Логика', desc: 'Нажми, как только зелёный', grad: 'linear-gradient(135deg,#f6d365,#fda085)' }, (stage, api) => {
  const box = api.el('div', 'g-card');
  box.style.cssText += ';height:200px;display:flex;align-items:center;justify-content:center;' +
    'cursor:pointer;font-size:20px;font-weight:700;transition:background .15s;background:rgba(255,59,48,.1);user-select:none';
  box.textContent = 'Нажми «Играть»';
  stage.appendChild(box);

  let state = 'idle', t0 = 0, timer = null, best = null;

  function start() {
    state = 'waiting';
    box.style.background = 'rgba(255,59,48,.12)';
    box.style.color = '#ff3b30';
    box.textContent = 'Жди зелёного…';
    const delay = 900 + Math.random() * 2200;
    timer = setTimeout(() => {
      state = 'ready';
      t0 = performance.now();
      box.style.background = 'rgba(52,199,89,.18)';
      box.style.color = '#248a3d';
      box.textContent = 'ЖМИ!';
    }, delay);
  }
  box.onclick = () => {
    if (state === 'idle') { start(); return; }
    if (state === 'waiting') {
      clearTimeout(timer);
      state = 'idle';
      box.style.background = 'rgba(255,59,48,.1)';
      box.style.color = '#1d1d1f';
      box.textContent = 'Рано! Нажми ещё раз';
      return;
    }
    if (state === 'ready') {
      const ms = Math.round(performance.now() - t0);
      best = best === null ? ms : Math.min(best, ms);
      state = 'idle';
      box.style.background = 'rgba(0,113,227,.1)';
      box.style.color = '#0071e3';
      box.textContent = ms + ' мс' + (best !== null ? ' · рекорд ' + best + ' мс' : '');
      api.score(ms + ' мс');
      api.bump();
    }
  };
  api.controls(api.btn('Играть', start));
  api.hint('Чем быстрее реакция — тем лучше.');
  api.onCleanup(() => clearTimeout(timer));
});

/* ---------- 28. Саймон говорит ---------- */
reg('sequence', { name: 'Память чисел', icon: '🔢', cat: 'Логика', desc: 'Повтори ряд цифр', grad: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  const row = api.el('div', 'g-row');
  stage.appendChild(prompt); stage.appendChild(row);

  let seq, input, level, showing;

  function init() { seq = ''; input = ''; level = 0; showing = false; api.score('0'); round(); }
  function round() {
    level++;
    seq += String(api.rnd(10));
    input = '';
    api.score('0/' + seq.length);
    prompt.textContent = seq;
    showing = true;
    setTimeout(() => { prompt.textContent = '•'.repeat(seq.length); showing = false; render(); }, 1200);
    render();
  }
  function render() {
    row.innerHTML = '';
    for (let d = 0; d < 10; d++) {
      const b = api.btn(String(d), () => press(String(d)), true);
      b.style.minWidth = '48px'; b.style.padding = '11px 10px';
      row.appendChild(b);
    }
  }
  function press(d) {
    if (showing) return;
    input += d;
    api.score(input.length + '/' + seq.length);
    if (!seq.startsWith(input)) {
      const fin = level - 1;
      api.overlay('💀', 'Ошибка', 'Запомнил ' + fin + ' цифр', () => init());
      return;
    }
    if (input.length === seq.length) { api.bump(); setTimeout(round, 400); }
  }
  api.controls(api.btn('Заново', init, true));
  init();
});

/* ---------- 29. Чёт или нечёт ---------- */
reg('evenodd', { name: 'Чёт или нечёт', icon: '🎲', cat: 'Логика', desc: 'Быстро определи число', grad: 'linear-gradient(135deg,#ffecd2,#fcb69f)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  const row = api.el('div', 'g-row');
  stage.appendChild(prompt); stage.appendChild(row);
  let n, score, running, timeLeft;

  function next() { n = 1 + api.rnd(99); prompt.textContent = n; }
  function start() {
    score = 0; timeLeft = 20; running = true; api.score('0 · 20с');
    next(); startBtn.disabled = true;
  }
  const startBtn = api.btn('Играть', start);
  const yes = api.btn('Чётное', () => answer(true), true);
  const no = api.btn('Нечётное', () => answer(false), true);
  api.controls(startBtn, yes, no);

  function answer(isEven) {
    if (!running) return;
    const correct = (n % 2 === 0) === isEven;
    if (correct) { score++; api.bump(); } else score = Math.max(0, score - 1);
    api.score(score + ' · ' + timeLeft + 'с');
    next();
  }
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
  prompt.textContent = '—';
});

/* ---------- 30. Сравни числа ---------- */
reg('compare', { name: 'Сравни', icon: '⚖️', cat: 'Логика', desc: 'Какое число больше?', grad: 'linear-gradient(135deg,#d4fc79,#96e6a1)' }, (stage, api) => {
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let a, b, score, timeLeft, running;

  const leftBtn = api.btn('—', () => pick('left'));
  const rightBtn = api.btn('—', () => pick('right'));
  leftBtn.style.cssText += ';font-size:26px;min-width:110px;padding:22px';
  rightBtn.style.cssText += ';font-size:26px;min-width:110px;padding:22px';
  api.controls(leftBtn, rightBtn);
  const startBtn = api.btn('Играть', start);
  stage.appendChild(startBtn);

  function next() {
    a = 1 + api.rnd(999); b = 1 + api.rnd(999);
    while (a === b) b = 1 + api.rnd(999);
    leftBtn.textContent = a; rightBtn.textContent = b;
  }
  function start() {
    score = 0; timeLeft = 20; running = true; api.score('0 · 20с');
    next(); startBtn.disabled = true;
  }
  function pick(side) {
    if (!running) return;
    const ok = side === 'left' ? a > b : b > a;
    if (ok) { score++; api.bump(); } else score = Math.max(0, score - 1);
    api.score(score + ' · ' + timeLeft + 'с');
    next();
  }
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
  next();
});

/* ---------- 31. Палиндром ---------- */
reg('palindrome', { name: 'Палиндром?', icon: '🪞', cat: 'Логика', desc: 'Читается одинаково?', grad: 'linear-gradient(135deg,#c471f5,#fa71cd)' }, (stage, api) => {
  const WORDS = ['шалаш', 'потоп', 'заказ', 'кабак', 'комок', 'топот', 'радар', 'доход',
                 'кот', 'дом', 'сок', 'мир', 'лес', 'рука', 'стол', 'книга'];
  const prompt = api.el('div', 'g-prompt', '');
  stage.appendChild(prompt);
  const yes = api.btn('Да', () => answer(true));
  const no = api.btn('Нет', () => answer(false), true);
  api.controls(yes, no);
  const startBtn = api.btn('Играть', start);
  stage.appendChild(startBtn);

  let word, score, timeLeft, running;

  function next() {
    word = api.pick(WORDS);
    prompt.textContent = word;
  }
  function start() {
    score = 0; timeLeft = 20; running = true; api.score('0 · 20с');
    next(); startBtn.disabled = true;
  }
  function answer(isPal) {
    if (!running) return;
    const real = word === word.split('').reverse().join('');
    if (isPal === real) { score++; api.bump(); } else score = Math.max(0, score - 1);
    api.score(score + ' · ' + timeLeft + 'с');
    next();
  }
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
  prompt.textContent = '—';
});

/* ---------- 32. Найди отличия ---------- */
reg('spotdiff', { name: 'Найди отличие', icon: '👀', cat: 'Логика', desc: 'Одна клетка не такая', grad: 'linear-gradient(135deg,#a8edea,#fed6e3)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.width = '320px';
  stage.appendChild(wrap);
  let score, size;

  function round() {
    size = Math.min(5, 3 + Math.floor(score / 4));
    const total = size * size;
    const target = api.rnd(total);
    wrap.style.gridTemplateColumns = `repeat(${size},1fr)`;
    wrap.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const cell = api.el('div', 'g-cell');
      cell.style.height = Math.round(300 / size) + 'px';
      cell.style.fontSize = Math.max(16, 40 - size * 4) + 'px';
      cell.style.background = i === target ? 'rgba(0,113,227,.35)' : 'rgba(0,113,227,.12)';
      cell.textContent = '●';
      cell.style.color = i === target ? '#0071e3' : 'rgba(0,113,227,.5)';
      cell.onclick = () => {
        if (i === target) { score++; api.score(score); api.bump(); round(); }
        else cell.animate([{ background: 'rgba(255,59,48,.35)' }, { background: 'rgba(0,113,227,.12)' }], { duration: 380 });
      };
      wrap.appendChild(cell);
    }
  }
  score = 0; api.score('0'); round();
  api.hint('Одна клетка чуть темнее остальных.');
});

/* ---------- 33. Быстрый клик ---------- */
reg('clicker', { name: 'Кликер', icon: '👆', cat: 'Логика', desc: 'Кликай как можно быстрее', grad: 'linear-gradient(135deg,#5ee7df,#b490ca)' }, (stage, api) => {
  const big = api.el('div', 'g-card');
  big.style.cssText += ';height:180px;display:flex;align-items:center;justify-content:center;' +
    'font-size:22px;font-weight:700;cursor:pointer;user-select:none;transition:transform .08s';
  big.textContent = 'Нажми «Играть»';
  stage.appendChild(big);

  let clicks, timeLeft, running;

  function start() {
    clicks = 0; timeLeft = 10; running = true;
    big.textContent = 'КЛИКАЙ!';
    api.score('0 · 10с');
    startBtn.disabled = true;
  }
  big.onclick = () => {
    if (!running) return;
    clicks++;
    api.score(clicks + ' · ' + timeLeft + 'с');
    big.style.transform = 'scale(.97)';
    setTimeout(() => big.style.transform = '', 60);
  };
  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(clicks + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = clicks;
      big.textContent = fin + ' кликов!';
      api.overlay('👆', 'Готово', 'Кликов за 10 секунд: ' + fin, () => { });
    }
  });
});

/* ---------- 34. Найди цифру ---------- */
reg('finddigit', { name: 'Найди цифру', icon: '🔢', cat: 'Логика', desc: 'Найди все цифры по порядку', grad: 'linear-gradient(135deg,#fccb90,#d57eeb)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(5,1fr)';
  wrap.style.width = '320px';
  stage.appendChild(wrap);

  let nums, next, t0, started;

  function init() {
    nums = api.shuffle(Array.from({ length: 20 }, (_, i) => i + 1));
    next = 1; started = false; t0 = 0;
    api.score('Найди 1');
    render();
  }
  function render() {
    wrap.innerHTML = '';
    nums.forEach(n => {
      const cell = api.el('div', 'g-cell', n);
      cell.style.height = '58px'; cell.style.fontSize = '18px';
      if (n < next) cell.classList.add('done');
      cell.onclick = () => {
        if (n !== next) {
          cell.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 200 });
          return;
        }
        if (!started) { started = true; t0 = performance.now(); }
        next++;
        api.score(next > 20 ? 'Готово!' : 'Найди ' + next);
        render();
        if (next > 20) {
          const ms = Math.round(performance.now() - t0);
          api.confetti();
          api.overlay('🏆', 'Все найдены!', 'Время: ' + (ms / 1000).toFixed(2) + ' с', () => init());
        }
      };
      wrap.appendChild(cell);
    });
  }
  api.controls(api.btn('Заново', init, true));
  init();
});

/* ---------- 35. Стрелки ---------- */
reg('arrows', { name: 'Стрелки', icon: '⬅️', cat: 'Логика', desc: 'Нажми ту же стрелку', grad: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  prompt.style.fontSize = '64px';
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  const ARROWS = ['\u2190', '\u2192', '\u2191', '\u2193'];
  let cur, score, timeLeft, running, inverted;

  const btns = ARROWS.map(a => {
    const b = api.btn(a, () => press(a), true);
    b.style.fontSize = '26px'; b.style.minWidth = '62px';
    row.appendChild(b);
    return b;
  });

  function next() {
    inverted = Math.random() < .25;
    const shown = api.pick(ARROWS);
    cur = inverted ? ARROWS[(ARROWS.indexOf(shown) + 2) % 4] : shown;
    prompt.textContent = shown;
    prompt.style.transform = inverted ? 'rotate(180deg)' : '';
  }
  function start() {
    score = 0; timeLeft = 20; running = true; api.score('0 · 20с');
    next(); startBtn.disabled = true;
  }
  function press(a) {
    if (!running) return;
    if (a === cur) { score++; api.bump(); } else score = Math.max(0, score - 1);
    api.score(score + ' · ' + timeLeft + 'с');
    next();
  }
  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
  prompt.textContent = '—';
});

/* ---------- 36. Тетрис-стакан ---------- */
reg('filler', { name: 'Заливка', icon: '🟦', cat: 'Логика', desc: 'Залей поле одним цветом', grad: 'linear-gradient(135deg,#89f7fe,#66a6ff)' }, (stage, api) => {
  const N = 6;
  const COLORS = ['#ff3b30', '#34c759', '#0071e3', '#ffcc00', '#af7aff'];
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = `repeat(${N},1fr)`;
  wrap.style.width = '300px';
  stage.appendChild(wrap);

  let grid, moves, target;

  function init() {
    grid = Array.from({ length: N }, () => Array.from({ length: N }, () => COLORS[api.rnd(COLORS.length)]));
    // Стартовая область — левый верхний угол
    moves = 0; api.score('0');
    render();
  }
  function region() {
    const seen = new Set(), stack = [[0, 0]], color = grid[0][0];
    while (stack.length) {
      const [r, c] = stack.pop();
      const k = r + ',' + c;
      if (seen.has(k)) continue;
      if (r < 0 || c < 0 || r >= N || c >= N) continue;
      if (grid[r][c] !== color) continue;
      seen.add(k);
      stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }
    return seen;
  }
  function flood(color) {
    const reg = region();
    reg.forEach(k => { const [r, c] = k.split(',').map(Number); grid[r][c] = color; });
    moves++; api.score(moves); api.bump();
    render();
    if (region().size === N * N) {
      api.confetti();
      api.overlay('🏆', 'Залито!', 'За ' + moves + ' ходов', () => init());
    }
  }
  function render() {
    wrap.innerHTML = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = api.el('div');
      cell.style.cssText = `height:44px;border-radius:8px;background:${grid[r][c]};transition:background .2s`;
      wrap.appendChild(cell);
    }
  }
  const row = api.el('div', 'g-row');
  COLORS.forEach(col => {
    const b = api.el('button');
    b.style.cssText = `width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;background:${col}`;
    b.onclick = () => flood(col);
    row.appendChild(b);
  });
  stage.appendChild(row);
  api.hint('Перекрашивай область из левого верхнего угла, пока всё не станет одного цвета.');
  init();
});

/* ---------- 37. Бинарный счёт ---------- */
reg('binary', { name: 'Двоичный счёт', icon: '💻', cat: 'Логика', desc: 'Переведи в двоичное', grad: 'linear-gradient(135deg,#232526,#414345)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  const row = api.el('div', 'g-row');
  stage.appendChild(prompt); stage.appendChild(row);

  let n, score, timeLeft, running;

  function next() {
    n = 1 + api.rnd(31);
    prompt.textContent = n + ' → ?';
    const correct = n.toString(2);
    const set = new Set([correct]);
    while (set.size < 4) {
      let v = (1 + api.rnd(31)).toString(2);
      set.add(v);
    }
    row.innerHTML = '';
    api.shuffle([...set]).forEach(v => {
      const b = api.btn(v, () => {
        if (!running) return;
        if (v === correct) { score++; api.bump(); } else score = Math.max(0, score - 1);
        api.score(score + ' · ' + timeLeft + 'с');
        next();
      }, true);
      b.style.fontFamily = 'monospace'; b.style.minWidth = '70px';
      row.appendChild(b);
    });
  }
  function start() {
    score = 0; timeLeft = 25; running = true; api.score('0 · 25с');
    next(); startBtn.disabled = true;
  }
  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
  prompt.textContent = '—';
});

/* ---------- 38. Римские цифры ---------- */
reg('roman', { name: 'Римские цифры', icon: '🏛️', cat: 'Логика', desc: 'Что это за число?', grad: 'linear-gradient(135deg,#fccb90,#d57eeb)' }, (stage, api) => {
  const MAP = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  const toRoman = (n) => {
    let s = '';
    for (const [v, r] of MAP) while (n >= v) { s += r; n -= v; }
    return s;
  };
  const prompt = api.el('div', 'g-prompt', '');
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  let n, score, timeLeft, running;

  function next() {
    n = 1 + api.rnd(19);
    prompt.textContent = toRoman(n);
    const set = new Set([n]);
    while (set.size < 4) { const v = 1 + api.rnd(19); if (v > 0) set.add(v); }
    row.innerHTML = '';
    api.shuffle([...set]).forEach(v => {
      const b = api.btn(String(v), () => {
        if (!running) return;
        if (v === n) { score++; api.bump(); } else score = Math.max(0, score - 1);
        api.score(score + ' · ' + timeLeft + 'с');
        next();
      }, true);
      b.style.minWidth = '58px';
      row.appendChild(b);
    });
  }
  function start() {
    score = 0; timeLeft = 25; running = true; api.score('0 · 25с');
    next(); startBtn.disabled = true;
  }
  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
  prompt.textContent = '—';
});

/* ---------- 39. Цвет по названию ---------- */
reg('stroop', { name: 'Цвет и слово', icon: '🌈', cat: 'Логика', desc: 'Выбери цвет чернил, не слово', grad: 'linear-gradient(135deg,#f093fb,#f5576c)' }, (stage, api) => {
  const COLORS = [
    { n: 'красный', c: '#ff3b30' },
    { n: 'зелёный', c: '#34c759' },
    { n: 'синий', c: '#0071e3' },
    { n: 'жёлтый', c: '#ffcc00' }
  ];
  const prompt = api.el('div', 'g-prompt', '');
  prompt.style.fontSize = '42px';
  stage.appendChild(prompt);
  const row = api.el('div', 'g-row');
  stage.appendChild(row);

  let ink, score, timeLeft, running;

  const btns = COLORS.map(col => {
    const b = api.btn(col.n, () => press(col), true);
    b.style.minWidth = '92px';
    row.appendChild(b);
    return b;
  });

  function next() {
    const word = api.pick(COLORS);
    ink = api.pick(COLORS);
    prompt.textContent = word.n;
    prompt.style.color = ink.c;
  }
  function start() {
    score = 0; timeLeft = 20; running = true; api.score('0 · 20с');
    next(); startBtn.disabled = true;
  }
  function press(col) {
    if (!running) return;
    if (col.n === ink.n) { score++; api.bump(); } else score = Math.max(0, score - 1);
    api.score(score + ' · ' + timeLeft + 'с');
    next();
  }
  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);
  api.hint('Выбирай цвет ЧЕРНИЛ, а не то, что написано.');
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
  prompt.textContent = '—';
});

/* ---------- 40. Равные суммы ---------- */
reg('pairmatch', { name: 'Равные суммы', icon: '🔗', cat: 'Логика', desc: 'Найди пару с равной суммой', grad: 'linear-gradient(135deg,#d4fc79,#96e6a1)' }, (stage, api) => {
  const row = api.el('div', 'g-row');
  stage.appendChild(row);
  let score, running, timeLeft, target, options;

  function start() {
    score = 0; timeLeft = 20; running = true; api.score('0 · 20с');
    next(); startBtn.disabled = true;
  }
  function next() {
    // Две «пары» с равной суммой + две с другими суммами
    const base = 4 + api.rnd(12);
    const pairs = [];
    for (let i = 0; i < 4; i++) {
      const a = 1 + api.rnd(base - 1);
      pairs.push({ a, b: base - a, sum: base });
    }
    // Одна верная пара и три неверных
    const good = 1 + api.rnd(3);
    options = pairs.map((p, i) => i === good
      ? p
      : { a: p.a, b: p.b + 1 + api.rnd(4), sum: p.a + p.b + 1 + api.rnd(4) });
    // Пересчитываем суммы после подмены
    options = options.map(p => ({ a: p.a, b: p.b, sum: p.a + p.b }));
    target = options[good].sum;
    // Гарантируем уникальность верной суммы
    let guard = 0;
    while (options.filter(p => p.sum === target).length > 1 && guard++ < 50) {
      const j = options.findIndex((p, i) => i !== good && p.sum === target);
      if (j < 0) break;
      options[j].b += 1 + api.rnd(3);
      options[j].sum = options[j].a + options[j].b;
    }
    row.innerHTML = '';
    api.shuffle(options).forEach(p => {
      const b = api.btn(p.a + ' + ' + p.b, () => choose(p.sum), true);
      b.style.fontSize = '18px'; b.style.minWidth = '96px';
      row.appendChild(b);
    });
    prompt.textContent = 'Сумма: ' + target;
  }
  function choose(sum) {
    if (!running) return;
    if (sum === target) { score++; api.bump(); } else score = Math.max(0, score - 1);
    api.score(score + ' · ' + timeLeft + 'с');
    next();
  }
  const prompt = api.el('div', 'g-prompt', '—');
  stage.insertBefore(prompt, row);
  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);
  api.hint('Нажми на выражение, сумма которого равна указанной.');
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) {
      running = false; startBtn.disabled = false;
      const fin = score;
      api.overlay('⏱️', 'Время', 'Очков: ' + fin, () => { });
    }
  });
});
