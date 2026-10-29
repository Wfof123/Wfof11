/* ============================================================
   ГОЛОВОЛОМКИ (14 игр)
   ============================================================ */

/* ---------- 13. 2048 ---------- */
reg('game2048', { name: '2048', icon: '🔢', cat: 'Головоломка', desc: 'Соединяй числа до 2048', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)' }, (stage, api) => {
  const grid = api.el('div', 'g-tiles');
  stage.appendChild(grid);
  let g, score, mergedSet;

  function reset() {
    g = Array(4).fill(null).map(() => Array(4).fill(0));
    score = 0; mergedSet = new Set();
    api.score(0);
    add(); add(); render();
  }
  function add() {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!g[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[api.rnd(empty.length)];
    g[r][c] = Math.random() < .9 ? 2 : 4;
  }
  function collapse(line) {
    const arr = line.filter(v => v);
    let gained = 0, merged = false;
    for (let i = 0; i < arr.length - 1; i++)
      if (arr[i] === arr[i + 1]) { arr[i] *= 2; gained += arr[i]; merged = true; arr.splice(i + 1, 1); }
    while (arr.length < 4) arr.push(0);
    return { arr, gained, merged };
  }
  function coord(dir, i, j) {
    if (dir === 'L') return i + ',' + j;
    if (dir === 'R') return i + ',' + (3 - j);
    if (dir === 'U') return j + ',' + i;
    return (3 - j) + ',' + i;
  }
  function setAt(dir, i, j, v) {
    if (dir === 'L') g[i][j] = v;
    if (dir === 'R') g[i][3 - j] = v;
    if (dir === 'U') g[j][i] = v;
    if (dir === 'D') g[3 - j][i] = v;
  }
  function move(dir) {
    const before = JSON.stringify(g);
    mergedSet = new Set();
    let gained = 0;
    for (let i = 0; i < 4; i++) {
      const line = [];
      for (let j = 0; j < 4; j++) {
        if (dir === 'L') line.push(g[i][j]);
        if (dir === 'R') line.push(g[i][3 - j]);
        if (dir === 'U') line.push(g[j][i]);
        if (dir === 'D') line.push(g[3 - j][i]);
      }
      const res = collapse(line);
      gained += res.gained;
      const nz = line.filter(v => v);
      let k = 0;
      for (let j = 0; j < 4; j++) {
        if (!res.arr[j]) continue;
        if (k + 1 < nz.length && nz[k] === nz[k + 1] && res.arr[j] === nz[k] * 2) {
          mergedSet.add(coord(dir, i, j)); k += 2;
        } else k++;
      }
      for (let j = 0; j < 4; j++) setAt(dir, i, j, res.arr[j]);
    }
    if (JSON.stringify(g) !== before) {
      score += gained; api.score(score); api.bump();
      add(); render(); check();
    }
  }
  function render() {
    grid.innerHTML = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = g[r][c];
      const t = api.el('div', 'g-tile', v || '');
      t.dataset.val = v || 0;
      if (v && mergedSet.has(r + ',' + c)) t.classList.add('merged');
      grid.appendChild(t);
    }
  }
  function check() {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (g[r][c] === 2048) { api.confetti(); api.overlay('🏆', '2048!', 'Ты собрал 2048', () => reset()); return; }
      if (!g[r][c]) return;
      if (c < 3 && g[r][c] === g[r][c + 1]) return;
      if (r < 3 && g[r][c] === g[r + 1][c]) return;
    }
    api.overlay('💀', 'Ходов нет', 'Счёт: ' + score, () => reset());
  }
  api.controls(api.btn('Новая игра', reset, true));
  api.keys(e => {
    const map = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  });
  api.swipe(grid, move, 18);
  api.dpad(move);
  reset();
});

/* ---------- 14. Мемори ---------- */
reg('memory', { name: 'Мемори', icon: '🧠', cat: 'Головоломка', desc: 'Найди все пары карточек', grad: 'linear-gradient(135deg,#f093fb,#f5576c)' }, (stage, api) => {
  const SHAPES_LIST = ['circle', 'star', 'triangle', 'heart', 'hex', 'diamond', 'bolt', 'drop'];
  const grid = api.el('div', 'memory-grid');
  grid.style.gridTemplateColumns = 'repeat(4,1fr)';
  stage.appendChild(grid);

  let flipped = [], matched = 0, moves = 0, locked = false;

  function init() {
    flipped = []; matched = 0; moves = 0; locked = false;
    api.score('0 ходов');
    const pairs = api.shuffle([...SHAPES_LIST, ...SHAPES_LIST]);
    grid.innerHTML = '';
    pairs.forEach((shape, i) => {
      const card = api.el('div', 'memory-card deal');
      card.style.animationDelay = (i * .045) + 's';
      card.addEventListener('animationend', (e) => {
        if (e.target === card) card.classList.remove('deal');
      });
      card.innerHTML = `<div class="memory-inner">
        <div class="memory-face front">?</div>
        <div class="memory-face back">${shapeSVG(shape)}</div>
      </div>`;
      card.onclick = () => flip(card, shape);
      grid.appendChild(card);
    });
  }
  function flip(card, shape) {
    if (locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    flipped.push({ card, shape });
    if (flipped.length < 2) return;

    moves++;
    api.score(moves + ' ходов'); api.bump();
    locked = true;
    const [a, b] = flipped;

    if (a.shape === b.shape) {
      setTimeout(() => {
        a.card.classList.add('matched');
        b.card.classList.add('matched');
        matched++;
        flipped = []; locked = false;
        if (matched === SHAPES_LIST.length) {
          api.confetti();
          setTimeout(() => api.overlay('🎉', 'Победа!', 'Все пары за ' + moves + ' ходов', () => init()), 350);
        }
      }, 420);
    } else {
      setTimeout(() => { a.card.classList.add('shake'); b.card.classList.add('shake'); }, 420);
      setTimeout(() => {
        a.card.classList.remove('flipped', 'shake');
        b.card.classList.remove('flipped', 'shake');
        flipped = []; locked = false;
      }, 980);
    }
  }
  api.controls(api.btn('Новая игра', init, true));
  init();
});

/* ---------- 15. Пятнашки ---------- */
reg('sliding', { name: 'Пятнашки', icon: '🔀', cat: 'Головоломка', desc: 'Расставь числа по порядку', grad: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(4,1fr)';
  wrap.style.width = '320px';
  stage.appendChild(wrap);

  let tiles, moves, cells;

  function solved(a) { return a.every((v, i) => v === (i + 1) % 16); }

  function init() {
    tiles = [...Array(15).keys()].map(i => i + 1).concat(0);
    // Перемешиваем гарантированно решаемым способом — случайными ходами
    let empty = 15;
    for (let k = 0; k < 200; k++) {
      const nb = neighbors(empty);
      const pick = nb[api.rnd(nb.length)];
      [tiles[empty], tiles[pick]] = [tiles[pick], tiles[empty]];
      empty = pick;
    }
    moves = 0; api.score('0 ходов');
    render();
  }
  function neighbors(i) {
    const r = Math.floor(i / 4), c = i % 4, out = [];
    if (r > 0) out.push(i - 4);
    if (r < 3) out.push(i + 4);
    if (c > 0) out.push(i - 1);
    if (c < 3) out.push(i + 1);
    return out;
  }
  function render() {
    wrap.innerHTML = '';
    cells = tiles.map((v, i) => {
      const cell = api.el('div', 'g-cell', v || '');
      cell.style.height = '74px';
      if (!v) { cell.style.background = 'transparent'; cell.style.cursor = 'default'; }
      cell.onclick = () => tryMove(i);
      wrap.appendChild(cell);
      return cell;
    });
  }
  function tryMove(i) {
    const e = tiles.indexOf(0);
    if (!neighbors(e).includes(i)) return;
    [tiles[e], tiles[i]] = [tiles[i], tiles[e]];
    moves++; api.score(moves + ' ходов'); api.bump();
    render();
    if (solved(tiles)) {
      api.confetti();
      setTimeout(() => api.overlay('🏆', 'Собрано!', 'За ' + moves + ' ходов', () => init()), 250);
    }
  }
  api.controls(api.btn('Перемешать', init, true));
  init();
});

/* ---------- 16. Судоку 4×4 ---------- */
reg('sudoku', { name: 'Судоку 4×4', icon: '🔲', cat: 'Головоломка', desc: 'Мини-судоку с цифрами 1–4', grad: 'linear-gradient(135deg,#84fab0,#8fd3f4)' }, (stage, api) => {
  // Базовые решения 4x4
  const SOLUTIONS = [
    [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
    [[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]],
    [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]]
  ];
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(4,1fr)';
  wrap.style.width = '300px';
  stage.appendChild(wrap);

  let sol, puzzle, board, sel;

  function init() {
    sol = SOLUTIONS[api.rnd(SOLUTIONS.length)];
    puzzle = sol.map(r => r.slice());
    // Убираем 8 клеток
    let removed = 0;
    while (removed < 8) {
      const r = api.rnd(4), c = api.rnd(4);
      if (puzzle[r][c] !== 0) { puzzle[r][c] = 0; removed++; }
    }
    board = puzzle.map(r => r.slice());
    sel = null;
    render();
  }
  function render() {
    wrap.innerHTML = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = board[r][c];
      const cell = api.el('div', 'g-cell', v || '');
      cell.style.height = '72px';
      cell.style.fontSize = '26px';
      const fixed = puzzle[r][c] !== 0;
      if (fixed) {
        cell.style.background = 'rgba(0,0,0,.09)';
        cell.style.fontWeight = '800';
        cell.style.cursor = 'default';
      } else {
        cell.onclick = () => { sel = [r, c]; markSel(r, c); };
        if (v && v !== sol[r][c]) cell.style.color = '#ff3b30';
      }
      if (sel && sel[0] === r && sel[1] === c) cell.classList.add('sel');
      // Границы блоков 2×2
      cell.style.borderRight = (c === 1) ? '2px solid rgba(0,0,0,.18)' : '';
      cell.style.borderBottom = (r === 1) ? '2px solid rgba(0,0,0,.18)' : '';
      wrap.appendChild(cell);
    }
  }
  function markSel() { render(); }
  const digits = api.el('div', 'g-row');
  [1, 2, 3, 4].forEach(n => {
    const b = api.btn(String(n), () => {
      if (!sel) return;
      const [r, c] = sel;
      board[r][c] = n;
      render();
      checkWin();
    }, true);
    b.style.minWidth = '52px';
    digits.appendChild(b);
  });
  const clear = api.btn('Стереть', () => {
    if (!sel) return;
    const [r, c] = sel;
    board[r][c] = 0;
    render();
  }, true);
  digits.appendChild(clear);
  stage.appendChild(digits);

  function checkWin() {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (board[r][c] !== sol[r][c]) return;
    api.confetti();
    api.overlay('🏆', 'Решено!', 'Судоку собрано', () => init());
  }
  api.controls(api.btn('Новая игра', init, true));
  init();
});

/* ---------- 17. Сапёр ---------- */
reg('minesweeper', { name: 'Сапёр', icon: '💣', cat: 'Головоломка', desc: 'Открой все клетки без мин', grad: 'linear-gradient(135deg,#667eea,#764ba2)' }, (stage, api) => {
  const N = 6, MINES = 6;
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = `repeat(${N},1fr)`;
  wrap.style.width = '300px';
  stage.appendChild(wrap);

  let cells, opened, flags, dead, pressT = null;

  function init() {
    cells = Array.from({ length: N * N }, () => ({ mine: false, open: false, flag: false, near: 0 }));
    let placed = 0;
    while (placed < MINES) {
      const i = api.rnd(N * N);
      if (!cells[i].mine) { cells[i].mine = true; placed++; }
    }
    for (let i = 0; i < N * N; i++) cells[i].near = nb(i).filter(j => cells[j].mine).length;
    opened = 0; flags = 0; dead = false;
    api.score('0/' + (N * N - MINES));
    render();
  }
  function nb(i) {
    const r = Math.floor(i / N), c = i % N, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push(nr * N + nc);
    }
    return out;
  }
  function render() {
    wrap.innerHTML = '';
    cells.forEach((cell, i) => {
      const el = api.el('div', 'g-cell');
      el.style.height = '48px';
      el.style.fontSize = '16px';
      if (cell.open) {
        el.style.background = 'rgba(0,0,0,.03)';
        el.style.cursor = 'default';
        if (cell.mine) { el.textContent = '💣'; el.style.background = 'rgba(255,59,48,.2)'; }
        else if (cell.near) {
          el.textContent = cell.near;
          const colors = ['', '#0071e3', '#34c759', '#ff9500', '#ff3b30', '#af7aff', '#8b0000', '#1d1d1f', '#666'];
          el.style.color = colors[cell.near];
        }
      } else {
        el.style.background = 'rgba(0,113,227,.1)';
        if (cell.flag) el.textContent = '🚩';
      }
      el.oncontextmenu = (e) => { e.preventDefault(); flag(i); };
      // долгое нажатие ставит флажок: на телефоне правой кнопки нет
      let longPressed = false;
      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        longPressed = false;
        clearTimeout(pressT);
        pressT = setTimeout(() => { pressT = null; longPressed = true; flag(i); }, 420);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
        el.addEventListener(ev, () => { clearTimeout(pressT); pressT = null; }));
      el.onclick = () => {
        if (longPressed) { longPressed = false; return; }
        open(i);
      };
      wrap.appendChild(el);
    });
  }
  function open(i) {
    if (dead || cells[i].open || cells[i].flag) return;
    const cell = cells[i];
    cell.open = true;
    if (cell.mine) {
      dead = true;
      cells.forEach(c => { if (c.mine) c.open = true; });
      render();
      api.overlay('💥', 'Взрыв', 'Наткнулся на мину', () => init());
      return;
    }
    opened++;
    if (!cell.near) nb(i).forEach(j => { if (!cells[j].open) open(j); });
    api.score(opened + '/' + (N * N - MINES));
    render();
    if (opened === N * N - MINES) {
      api.confetti();
      api.overlay('🏆', 'Победа!', 'Все мины обойдены', () => init());
    }
  }
  function flag(i) {
    if (dead || cells[i].open) return;
    cells[i].flag = !cells[i].flag;
    flags += cells[i].flag ? 1 : -1;
    render();
  }
  api.hint('Тап — открыть · долгое нажатие — флажок');
  api.controls(api.btn('Новая игра', init, true));
  init();
});

/* ---------- 18. Крестики-нолики ---------- */
reg('tictactoe', { name: 'Крестики-нолики', icon: '⭕', cat: 'Головоломка', desc: 'Против умного соперника', grad: 'linear-gradient(135deg,#ffecd2,#fcb69f)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(3,1fr)';
  wrap.style.width = '270px';
  stage.appendChild(wrap);

  let board, done, turn;

  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  function winner(b) {
    for (const [a, x, c] of LINES) if (b[a] && b[a] === b[x] && b[a] === b[c]) return b[a];
    return b.every(v => v) ? 'draw' : null;
  }
  function init() {
    board = Array(9).fill('');
    done = false; turn = 'X';
    api.score('Твой ход');
    render();
  }
  function render() {
    wrap.innerHTML = '';
    board.forEach((v, i) => {
      const cell = api.el('div', 'g-cell', v);
      cell.style.height = '80px';
      cell.style.fontSize = '34px';
      cell.style.fontWeight = '800';
      if (v === 'X') cell.style.color = '#0071e3';
      if (v === 'O') cell.style.color = '#ff3b30';
      if (!v && !done) cell.onclick = () => play(i);
      wrap.appendChild(cell);
    });
  }
  function play(i) {
    if (done || board[i] || turn !== 'X') return;
    board[i] = 'X';
    render();
    const w = winner(board);
    if (w) return finish(w);
    turn = 'O';
    api.score('Ход соперника');
    setTimeout(() => aiMove(), 260);
  }
  function aiMove() {
    if (done) return;
    // Минимакс без рекурсии на победу/блокировку, иначе центр/угол
    const empt = board.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    let move = null;
    for (const i of empt) { board[i] = 'O'; if (winner(board) === 'O') move = i; board[i] = ''; }
    if (move === null) for (const i of empt) { board[i] = 'X'; if (winner(board) === 'X') move = i; board[i] = ''; }
    if (move === null && !board[4]) move = 4;
    if (move === null) {
      const corners = [0, 2, 6, 8].filter(i => !board[i]);
      move = corners.length ? api.pick(corners) : api.pick(empt);
    }
    board[move] = 'O';
    render();
    const w = winner(board);
    if (w) return finish(w);
    turn = 'X';
    api.score('Твой ход');
  }
  function finish(w) {
    done = true;
    if (w === 'X') { api.confetti(); api.overlay('🏆', 'Ты победил!', 'Отличная игра', () => init()); }
    else if (w === 'O') api.overlay('💀', 'Проиграл', 'Соперник оказался хитрее', () => init());
    else api.overlay('🤝', 'Ничья', 'Равная игра', () => init());
  }
  api.controls(api.btn('Новая игра', init, true));
  init();
});

/* ---------- 19. Быстрая математика ---------- */
reg('math', { name: 'Быстрая математика', icon: '➗', cat: 'Головоломка', desc: 'Реши пример за 3 секунды', grad: 'linear-gradient(135deg,#5ee7df,#b490ca)' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', '');
  const row = api.el('div', 'g-row');
  const timerBar = api.el('div');
  timerBar.style.cssText = 'width:100%;max-width:300px;height:6px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden';
  const fill = api.el('div');
  fill.style.cssText = 'height:100%;width:100%;background:var(--accent);transition:width .1s linear';
  timerBar.appendChild(fill);
  stage.appendChild(timerBar);
  stage.appendChild(prompt);
  stage.appendChild(row);

  let answer, score, timeLeft, running, opts;

  function gen() {
    const a = 1 + api.rnd(20), b = 1 + api.rnd(20);
    const ops = ['+', '-', '×'];
    const op = api.pick(ops);
    let res;
    if (op === '+') res = a + b;
    if (op === '-') { const hi = Math.max(a, b), lo = Math.min(a, b); return { text: hi + ' − ' + lo, res: hi - lo }; }
    if (op === '×') { const x = 2 + api.rnd(9), y = 2 + api.rnd(9); return { text: x + ' × ' + y, res: x * y }; }
    return { text: a + ' ' + op + ' ' + b, res };
  }
  function next() {
    const q = gen();
    answer = q.res;
    prompt.textContent = q.text + ' = ?';
    // 4 варианта
    const set = new Set([answer]);
    while (set.size < 4) {
      const delta = [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10][api.rnd(10)];
      const v = answer + delta;
      if (v !== answer && v >= 0) set.add(v);
    }
    opts = api.shuffle([...set]);
    row.innerHTML = '';
    opts.forEach(v => {
      const b = api.btn(String(v), () => choose(v), true);
      b.style.minWidth = '64px';
      row.appendChild(b);
    });
  }
  function start() {
    score = 0; timeLeft = 30; running = true;
    api.score('0 · 30с');
    next();
    startBtn.disabled = true;
  }
  function choose(v) {
    if (!running) return;
    if (v === answer) { score++; api.bump(); }
    else { score = Math.max(0, score - 1); }
    api.score(score + ' · ' + timeLeft + 'с');
    next();
  }
  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);
  api.hint('Выбери правильный ответ. За ошибку — минус очко.');

  api.every(100, () => {
    if (!running) { fill.style.width = '100%'; return; }
    timeLeft -= .1;
    fill.style.width = Math.max(0, (timeLeft / 30) * 100) + '%';
    fill.style.background = timeLeft < 8 ? '#ff3b30' : 'var(--accent)';
    if (timeLeft <= 0) {
      running = false;
      startBtn.disabled = false;
      api.score(score + ' · 0с');
      const fin = score;
      api.overlay('⏱️', 'Время вышло', 'Правильных ответов: ' + fin, () => { });
    }
  });
});

/* ---------- 20. Анаграммы ---------- */
reg('anagram', { name: 'Анаграммы', icon: '🔤', cat: 'Головоломка', desc: 'Собери слово из букв', grad: 'linear-gradient(135deg,#fdcbf1,#e6dee9)' }, (stage, api) => {
  const WORDS = ['КОТ', 'ДОМ', 'СОН', 'ЛЕС', 'МИР', 'СЫР', 'НОС', 'РАК', 'ЛУК', 'СОК',
                 'ЗИМА', 'ВЕСНА', 'ЛЕТО', 'ОСЕНЬ', 'КНИГА', 'СТОЛ', 'ОКНО', 'ДВЕРЬ', 'МОРЕ', 'ПОЛЕ'];
  const prompt = api.el('div', 'g-prompt', '');
  const slots = api.el('div', 'g-row');
  const letters = api.el('div', 'g-row');
  stage.appendChild(prompt); stage.appendChild(slots); stage.appendChild(letters);

  let word, cur, score;

  function init() {
    score = 0; api.score('0');
    newWord();
  }
  function newWord() {
    word = api.pick(WORDS);
    cur = '';
    prompt.textContent = 'Собери слово: ' + word.length + ' букв';
    render();
  }
  function render() {
    slots.innerHTML = '';
    for (let i = 0; i < word.length; i++) {
      const s = api.el('div', 'g-cell', cur[i] || '');
      s.style.width = '46px'; s.style.height = '54px'; s.style.fontSize = '22px';
      if (cur[i]) s.classList.add('sel');
      slots.appendChild(s);
    }
    letters.innerHTML = '';
    api.shuffle(word.split('')).forEach(ch => {
      const b = api.btn(ch, () => {
        if (cur.length < word.length) { cur += ch; render(); check(); }
      }, true);
      b.style.minWidth = '46px'; b.style.padding = '11px 12px';
      letters.appendChild(b);
    });
    const del = api.btn('⌫', () => { cur = cur.slice(0, -1); render(); }, true);
    del.style.minWidth = '52px';
    letters.appendChild(del);
  }
  function check() {
    if (cur.length !== word.length) return;
    if (cur === word) {
      score++; api.score(score); api.bump(); api.bump();
      cur = '';
      setTimeout(() => { newWord(); }, 260);
    } else {
      slots.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 240 });
      setTimeout(() => { cur = ''; render(); }, 260);
    }
  }
  api.controls(api.btn('Пропустить', () => { cur = ''; newWord(); }, true));
  init();
});

/* ---------- 21. Счётчик слов ---------- */
reg('wordcount', { name: 'Счётчик', icon: '📝', cat: 'Головоломка', desc: 'Сколько слов в тексте?', grad: 'linear-gradient(135deg,#d4fc79,#96e6a1)' }, (stage, api) => {
  const SENTENCES = [
    'Быстрая лиса прыгает через ленивую собаку',
    'Утро красит нежным светом стены древнего Кремля',
    'Мороз и солнце день чудесный ещё ты дремлешь друг прелестный',
    'Я помню чудное мгновенье передо мной явилась ты',
    'В лесу родилась ёлочка в лесу она росла',
    'Все счастливые семьи похожи друг на друга',
    'Мы в ответе за тех кого приручили',
    'Краткость сестра таланта',
    'Знание сила а сила есть ума не надо',
    'Тише едешь дальше будешь'
  ];
  const text = api.el('div', 'g-card');
  text.style.fontSize = '15px'; text.style.lineHeight = '1.6';
  const prompt = api.el('div', 'g-prompt', 'Сколько слов?');
  const row = api.el('div', 'g-row');
  stage.appendChild(prompt); stage.appendChild(text); stage.appendChild(row);

  let answer, score;

  function init() { score = 0; api.score('0'); next(); }
  function next() {
    const s = api.pick(SENTENCES);
    text.textContent = '«' + s + '»';
    answer = s.split(/\s+/).length;
    const set = new Set([answer]);
    while (set.size < 4) {
      const v = answer + (api.rnd(5) - 2);
      if (v > 0) set.add(v);
    }
    row.innerHTML = '';
    api.shuffle([...set]).forEach(v => {
      const b = api.btn(String(v), () => {
        if (v === answer) { score++; api.score(score); api.bump(); api.confetti(); }
        next();
      }, true);
      b.style.minWidth = '58px';
      row.appendChild(b);
    });
  }
  api.controls(api.btn('Пропустить', next, true));
  init();
});

/* ---------- 22. Ханойская башня ---------- */
reg('hanoi', { name: 'Ханойская башня', icon: '🗼', cat: 'Головоломка', desc: 'Перенеси диски на другой стержень', grad: 'linear-gradient(135deg,#fccb90,#d57eeb)' }, (stage, api) => {
  const N = 3;
  const wrap = api.el('div', 'g-row');
  wrap.style.alignItems = 'flex-end';
  wrap.style.gap = '22px';
  stage.appendChild(wrap);

  let pegs, sel, moves;

  function init() {
    pegs = [[3, 2, 1], [], []]; // сверху — меньший диск
    sel = null; moves = 0;
    api.score('0 ходов');
    render();
  }
  function render() {
    wrap.innerHTML = '';
    pegs.forEach((peg, pi) => {
      const col = api.el('div');
      col.style.cssText = 'display:flex;flex-direction:column-reverse;align-items:center;gap:4px;' +
        'min-height:130px;width:96px;cursor:pointer;padding:6px;border-radius:12px;transition:background .2s';
      if (sel === pi) col.style.background = 'rgba(0,113,227,.1)';
      col.onclick = () => tap(pi);
      for (let k = 0; k < N; k++) {
        const d = peg[k];
        const bar = api.el('div');
        const w = d ? 20 + d * 18 : 90;
        bar.style.cssText = `width:${w}px;height:18px;border-radius:6px;transition:all .2s;` +
          `background:${d ? `hsl(${210 + d * 40},70%,62%)` : 'transparent'}`;
        col.appendChild(bar);
      }
      const label = api.el('div', '', 'Стержень ' + (pi + 1));
      label.style.cssText = 'font-size:11px;color:var(--text2);margin-top:6px';
      col.appendChild(label);
      wrap.appendChild(col);
    });
  }
  function tap(pi) {
    if (sel === null) {
      if (!pegs[pi].length) return;
      sel = pi;
    } else if (sel === pi) {
      sel = null;
    } else {
      const from = pegs[sel], to = pegs[pi];
      const disk = from[from.length - 1];
      const top = to[to.length - 1];
      if (!top || disk < top) {
        from.pop(); to.push(disk);
        moves++; api.score(moves + ' ходов'); api.bump();
        sel = null;
        if (pegs[2].length === N) {
          api.confetti();
          api.overlay('🏆', 'Башня собрана!', 'За ' + moves + ' ходов (минимум 7)', () => init());
        }
      } else {
        sel = null;
      }
    }
    render();
  }
  api.hint('Клик по стержню — взять/положить. Меньший диск нельзя класть на больший.');
  api.controls(api.btn('Сброс', init, true));
  init();
});

/* ---------- 23. Найди лишнее ---------- */
reg('oddone', { name: 'Найди лишнее', icon: '🔍', cat: 'Головоломка', desc: 'Один символ отличается', grad: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(4,1fr)';
  wrap.style.width = '300px';
  stage.appendChild(wrap);

  let score, target, level;

  function init() { score = 0; level = 3; api.score('0'); round(); }
  function round() {
    const size = Math.min(6, 3 + Math.floor(score / 3));
    const total = size * size;
    const base = '●';
    const odd = '○';
    target = api.rnd(total);
    wrap.style.gridTemplateColumns = `repeat(${size},1fr)`;
    wrap.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const cell = api.el('div', 'g-cell', i === target ? odd : base);
      cell.style.height = Math.round(280 / size) + 'px';
      cell.style.fontSize = Math.max(14, 30 - size * 2) + 'px';
      cell.style.color = i === target ? '#ff3b30' : 'rgba(0,0,0,.28)';
      cell.onclick = () => {
        if (i === target) { score++; api.score(score); api.bump(); round(); }
        else { cell.animate([{ background: 'rgba(255,59,48,.3)' }, { background: 'rgba(0,0,0,.05)' }], { duration: 400 }); }
      };
      wrap.appendChild(cell);
    }
  }
  api.hint('Найди символ, который отличается от остальных.');
  init();
});

/* ---------- 24. Симон ---------- */
reg('simon', { name: 'Симон', icon: '🎵', cat: 'Головоломка', desc: 'Повтори последовательность', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)' }, (stage, api) => {
  const pad = api.el('div', 'simon-pad');
  stage.appendChild(pad);
  const status = api.el('div', 'g-hint', 'Нажми «Играть»');
  stage.appendChild(status);

  const btns = [0, 1, 2, 3].map(i => {
    const b = api.el('button', 'simon-btn');
    b.dataset.i = i;
    pad.appendChild(b);
    return b;
  });

  let seq, input, playing, score;

  function lit(i, ms) {
    return new Promise(res => {
      btns[i].classList.add('lit');
      setTimeout(() => { btns[i].classList.remove('lit'); setTimeout(res, 110); }, ms);
    });
  }
  function playSeq() {
    if (!seq) return;
    playing = true;
    status.textContent = 'Смотри…';
    let i = 0;
    const step = () => {
      if (!seq) return;
      if (i >= seq.length) {
        playing = false;
        status.textContent = 'Повтори!';
        input = [];
        return;
      }
      lit(seq[i], 380).then(() => { if (!seq) return; i++; setTimeout(step, 120); });
    };
    setTimeout(step, 300);
  }
  function start() {
    seq = []; input = []; score = 0; api.score(0);
    next();
  }
  function next() {
    seq.push(api.rnd(4));
    api.score(seq.length - 1);
    playSeq();
  }
  btns.forEach((b, i) => {
    b.onclick = () => {
      if (playing || !seq) return;
      lit(i, 200);
      input.push(i);
      const idx = input.length - 1;
      if (input[idx] !== seq[idx]) {
        playing = true;
        status.textContent = 'Ошибка!';
        const fin = seq.length - 1;
        setTimeout(() => api.overlay('💀', 'Не туда', 'Повторил ' + fin + ' шагов', () => { seq = null; status.textContent = 'Нажми «Играть»'; }), 400);
        return;
      }
      if (input.length === seq.length) {
        status.textContent = 'Верно!';
        setTimeout(next, 500);
      }
    };
  });
  api.controls(api.btn('Играть', start));
  api.onCleanup(() => { seq = null; playing = true; });
});

/* ---------- 25. Вода и песок ---------- */
reg('sortcolors', { name: 'Сортировка', icon: '🧪', cat: 'Головоломка', desc: 'Разложи цвета по пробиркам', grad: 'linear-gradient(135deg,#a8edea,#fed6e3)' }, (stage, api) => {
  const COLORS = ['#ff3b30', '#34c759', '#0071e3', '#ffcc00'];
  const PER = 3;
  const wrap = api.el('div', 'g-row');
  wrap.style.alignItems = 'flex-end';
  stage.appendChild(wrap);

  let tubes, sel, moves;

  function init() {
    const all = [];
    COLORS.forEach(c => { for (let i = 0; i < PER; i++) all.push(c); });
    tubes = [[], [], [], [], []];
    api.shuffle(all).forEach((c, i) => tubes[i % 4].push(c));
    sel = null; moves = 0;
    api.score('0 ходов');
    render();
  }
  function solved() {
    return tubes.every(t => t.length === 0 ||
      (t.length === PER && t.every(c => c === t[0])));
  }
  function render() {
    wrap.innerHTML = '';
    tubes.forEach((t, ti) => {
      const tube = api.el('div');
      tube.style.cssText = 'width:52px;height:140px;border:2px solid rgba(0,0,0,.12);' +
        'border-radius:0 0 22px 22px;display:flex;flex-direction:column-reverse;justify-content:flex-start;' +
        'gap:3px;padding:5px;cursor:pointer;background:rgba(255,255,255,.6);transition:all .2s';
      if (sel === ti) tube.style.cssText += ';transform:translateY(-14px);box-shadow:0 8px 20px rgba(0,113,227,.3)';
      t.forEach(c => {
        const seg = api.el('div');
        seg.style.cssText = `height:36px;border-radius:8px;background:${c};transition:all .2s`;
        tube.appendChild(seg);
      });
      tube.onclick = () => tap(ti);
      wrap.appendChild(tube);
    });
  }
  function tap(ti) {
    if (sel === null) {
      if (!tubes[ti].length) return;
      sel = ti;
    } else if (sel === ti) {
      sel = null;
    } else {
      const from = tubes[sel], to = tubes[ti];
      const c = from[from.length - 1];
      const top = to[to.length - 1];
      if (to.length < PER && (!top || top === c)) {
        from.pop(); to.push(c);
        moves++; api.score(moves + ' ходов'); api.bump();
        sel = null;
        if (solved()) {
          api.confetti();
          api.overlay('🏆', 'Отсортировано!', 'За ' + moves + ' ходов', () => init());
        }
      } else {
        sel = null;
      }
    }
    render();
  }
  api.hint('Переливай верхний цвет в другой пробирку. Полный набор одного цвета — готово.');
  api.controls(api.btn('Сброс', init, true));
  init();
});

/* ---------- 26. Найди пару ---------- */
reg('findpair', { name: 'Найди пару', icon: '🃏', cat: 'Головоломка', desc: 'Открой две одинаковые карты', grad: 'linear-gradient(135deg,#c471f5,#fa71cd)' }, (stage, api) => {
  const SET = ['sun', 'moon', 'flower', 'leaf', 'drop', 'bolt'];
  const grid = api.el('div', 'memory-grid');
  grid.style.gridTemplateColumns = 'repeat(4,1fr)';
  grid.style.maxWidth = '300px';
  stage.appendChild(grid);

  let cards, open, pairs, moves, locked;

  function init() {
    cards = api.shuffle([...SET, ...SET]).map(e => ({ e, open: false, done: false }));
    open = []; pairs = 0; moves = 0; locked = false;
    api.score('0');
    grid.innerHTML = '';
    cards.forEach((c, i) => {
      const card = api.el('div', 'memory-card deal');
      card.style.animationDelay = (i * .04) + 's';
      card.addEventListener('animationend', (e) => {
        if (e.target === card) card.classList.remove('deal');
      });
      card.innerHTML = `<div class="memory-inner">
        <div class="memory-face front">?</div>
        <div class="memory-face back">${shapeSVG(c.e)}</div>
      </div>`;
      card.onclick = () => flip(card, c);
      grid.appendChild(card);
    });
  }
  function flip(card, c) {
    if (locked || c.done || c.open) return;
    c.open = true;
    card.classList.add('flipped');
    open.push({ card, c });
    if (open.length < 2) return;

    moves++; locked = true;
    const [a, b] = open;
    if (a.c.e === b.c.e) {
      setTimeout(() => {
        a.card.classList.add('matched');
        b.card.classList.add('matched');
        a.c.done = b.c.done = true;
        a.c.open = b.c.open = false;
        open = []; pairs++; locked = false;
        api.score(pairs + '/' + SET.length); api.bump();
        if (pairs === SET.length) {
          api.confetti();
          setTimeout(() => api.overlay('🎉', 'Всё найдено', 'Ходов: ' + moves, init), 320);
        }
      }, 400);
    } else {
      setTimeout(() => { a.card.classList.add('shake'); b.card.classList.add('shake'); }, 380);
      setTimeout(() => {
        a.card.classList.remove('flipped', 'shake');
        b.card.classList.remove('flipped', 'shake');
        a.c.open = b.c.open = false;
        open = []; locked = false;
      }, 950);
    }
  }
  api.controls(api.btn('Новая', init, true));
  init();
});
