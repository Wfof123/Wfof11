/* ============================================================
   УДАЧА И АЗАРТ (12 игр)
   ============================================================ */

/* ---------- 41. Кости ---------- */
reg('dice', { name: 'Кости', cat: 'Удача', desc: 'Брось два кубика' }, (stage, api) => {
  const row = api.el('div', 'g-row g-dice-row');
  const d1 = api.el('div', 'g-card g-die');
  const d2 = api.el('div', 'g-card g-die');
  [d1, d2].forEach(d => {
    d.innerHTML = ic('d1');
    row.appendChild(d);
  });
  stage.appendChild(row);
  const res = api.el('div', 'g-prompt', '—');
  stage.appendChild(res);

  let rolling = false, rolls = 0, best = 0;

  function setFace(el, n) { el.innerHTML = ic('d' + n); }

  /* Бросок: кубики подпрыгивают, крутятся в 3D и «падают» с отскоком.
     Класс снимается после анимации, чтобы следующий бросок проиграл её заново. */
  function toss(el, delay) {
    el.classList.remove('toss');
    void el.offsetWidth;
    el.style.animationDelay = delay + 'ms';
    el.classList.add('toss');
  }

  function roll() {
    if (rolling) return;
    rolling = true; rolls++;
    api.score(rolls + ' бросков');
    toss(d1, 0); toss(d2, 90);
    res.textContent = '…';
    res.classList.add('rolling');
    let ticks = 0;
    const iv = setInterval(() => {
      setFace(d1, 1 + api.rnd(6));
      setFace(d2, 1 + api.rnd(6));
      ticks++;
      if (ticks > 9) {
        clearInterval(iv);
        const a = 1 + api.rnd(6), b = 1 + api.rnd(6);
        setFace(d1, a); setFace(d2, b);
        const sum = a + b;
        res.textContent = sum;
        res.classList.remove('rolling');
        res.classList.add('landed');
        setTimeout(() => res.classList.remove('landed'), 420);
        best = Math.max(best, sum);
        api.score('макс ' + best);
        api.bump();
        if (sum === 12) { api.confetti(); api.overlay('🎉', 'Две шестёрки!', 'Вероятность 1 к 36', () => { }); }
        rolling = false;
      }
    }, 70);
    api.onCleanup(() => clearInterval(iv));
  }
  api.controls(api.btn('Бросить', roll));
  api.hint('Сумма двух кубиков от 2 до 12.');
});

/* ---------- 42. Монетка ---------- */
reg('coin', { name: 'Монетка', cat: 'Удача', desc: 'Орёл или решка' }, (stage, api) => {
  const coin = api.el('div', 'g-card g-coin');
  coin.innerHTML = ic('heads');
  stage.appendChild(coin);
  const res = api.el('div', 'g-prompt', '—');
  stage.appendChild(res);
  const stats = api.el('div', 'g-stat', 'Орёл 0 · Решка 0');
  stage.appendChild(stats);

  let heads = 0, tails = 0, flipping = false;

  function flip() {
    if (flipping) return;
    flipping = true;
    const isHeads = Math.random() < .5;
    /* подброс: монета улетает вверх, крутится и возвращается гранью */
    coin.classList.remove('flip'); void coin.offsetWidth;
    coin.classList.add('flip');
    res.textContent = '…';
    let n = 0;
    const iv = setInterval(() => {
      coin.innerHTML = ic(n % 2 ? 'heads' : 'tails');
      n++;
      if (n > 9) {
        clearInterval(iv);
        coin.innerHTML = ic(isHeads ? 'heads' : 'tails');
        res.textContent = isHeads ? 'Орёл' : 'Решка';
        res.classList.remove('landed'); void res.offsetWidth; res.classList.add('landed');
        isHeads ? heads++ : tails++;
        stats.textContent = 'Орёл ' + heads + ' · Решка ' + tails;
        api.score(heads + ':' + tails);
        api.bump();
        flipping = false;
      }
    }, 65);
    api.onCleanup(() => clearInterval(iv));
  }
  api.controls(api.btn('Подбросить', flip));
});

/* ---------- 43. Слоты ---------- */
reg('slots', { name: 'Слоты', cat: 'Удача', desc: 'Собери три одинаковых' }, (stage, api) => {
  const SYM = ['cherry', 'lemon', 'bell', 'gem', 'star', 'clover'];
  const PAY = { cherry: 60, lemon: 60, bell: 60, clover: 60, star: 120, gem: 200 };
  const row = api.el('div', 'g-row');
  const reels = [0, 1, 2].map(() => {
    const r = api.el('div', 'g-card g-reel');
    r.innerHTML = ic('cherry');
    row.appendChild(r);
    return r;
  });
  stage.appendChild(row);
  const res = api.el('div', 'g-prompt', 'Крути!');
  stage.appendChild(res);

  let spinning = false, coins = 100;

  function spin() {
    if (spinning) return;
    if (coins <= 0) {
      api.overlay('💸', 'Всё проиграно', 'Монеты закончились. Начни заново.',
        () => { coins = 100; api.score(coins); res.textContent = 'Крути!'; });
      return;
    }
    spinning = true;
    coins -= 10;
    api.score(coins);
    if (typeof SFX !== 'undefined') SFX.roll();
    const finals = reels.map(() => api.pick(SYM));
    reels.forEach(r => { r.classList.remove('landed'); r.classList.add('spinning'); });
    res.classList.add('rolling');
    res.textContent = 'Крутим…';
    let ticks = 0;
    const iv = setInterval(() => {
      reels.forEach(r => r.innerHTML = ic(api.pick(SYM)));
      ticks++;
      if (ticks > 14) {
        clearInterval(iv);
        /* барабаны останавливаются по очереди — так заметнее момент удачи */
        reels.forEach((r, i) => {
          setTimeout(() => {
            r.innerHTML = ic(finals[i]);
            r.classList.remove('spinning');
            r.classList.add('landed');
            if (typeof SFX !== 'undefined') SFX.flip();
            if (i === reels.length - 1) finish();
          }, i * 150);
        });
      }
    }, 70);
    api.onCleanup(() => clearInterval(iv));

    function finish() {
      const [a, b, c] = finals;
      let win = 0;
      if (a === b && b === c) win = PAY[a] || 60;
      else if (a === b || b === c || a === c) win = 20;
      coins += win;
      api.score(coins);
      res.classList.remove('rolling');
      res.classList.add('landed');
      res.textContent = win ? 'Выигрыш +' + win : 'Мимо';
      if (win) { api.bump(); if (typeof SFX !== 'undefined') SFX.good(); }
      else if (typeof SFX !== 'undefined') SFX.bad();
      if (win >= 120) api.confetti();
      setTimeout(() => res.classList.remove('landed'), 500);
      spinning = false;
    }
  }
  api.controls(api.btn('Крутить −10', spin));
  api.score(coins);
  api.hint('Три в ряд: вишня, лимон, колокол, клевер — 60 · звезда — 120 · алмаз — 200. Пара даёт 20.');
});

/* ---------- 44. Колесо фортуны ---------- */
reg('wheel', { name: 'Колесо', cat: 'Удача', desc: 'Крути и забирай приз' }, (stage, api) => {
  const SEG = [
    { t: '10', c: '#ff7a59' }, { t: '50', c: '#ffcc4d' }, { t: '0', c: '#4a5160' },
    { t: '100', c: '#c6ff3d' }, { t: '5', c: '#4dd4ff' }, { t: '250', c: '#d98cff' },
    { t: '0', c: '#39404d' }, { t: '25', c: '#6ee7b7' }
  ];
  const c = api.canvas(280, 280);
  c.style.cssText = 'border-radius:50%;cursor:pointer;background:transparent';
  const ctx = c.getContext('2d');
  const R = 140, N = SEG.length, step = Math.PI * 2 / N;
  let angle = 0, spinning = false;

  function draw() {
    ctx.clearRect(0, 0, 280, 280);
    SEG.forEach((s, i) => {
      const a0 = angle + i * step, a1 = a0 + step;
      ctx.beginPath(); ctx.moveTo(R, R); ctx.arc(R, R, R - 4, a0, a1); ctx.closePath();
      ctx.fillStyle = s.c; ctx.fill();
      ctx.strokeStyle = 'rgba(8,9,12,.55)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save();
      ctx.translate(R, R); ctx.rotate(a0 + step / 2);
      ctx.fillStyle = '#08090c'; ctx.font = 'bold 17px Inter, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(s.t, R - 16, 0);
      ctx.restore();
    });
    ctx.beginPath(); ctx.arc(R, R, 27, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0f14'; ctx.fill();
    ctx.strokeStyle = 'rgba(198,255,61,.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#c6ff3d'; ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SPIN', R, R);
  }
  draw();

  function spin() {
    if (spinning) return;
    spinning = true;
    const total = Math.PI * 2 * (3 + Math.random() * 2) + Math.random() * Math.PI * 2;
    const start = angle, t0 = performance.now(), dur = 2600;
    const stepFn = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      angle = start + total * e;
      draw();
      if (p < 1) requestAnimationFrame(stepFn);
      else {
        spinning = false;
        const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(((Math.PI * 2 - norm) % (Math.PI * 2)) / step) % N;
        const prize = SEG[idx].t;
        api.score(prize);
        api.bump();
        if (+prize >= 100) api.confetti();
        api.overlay('🎡', 'Приз: ' + prize, +prize >= 100 ? 'Крупный улов' : 'Неплохо', () => { });
      }
    };
    requestAnimationFrame(stepFn);
  }
  c.onclick = spin;
  api.controls(api.btn('Крутить', spin));
});

/* ---------- 45. Угадай число ---------- */
reg('guessnum', { name: 'Угадай число', cat: 'Удача', desc: 'От 1 до 100 за 7 попыток' }, (stage, api) => {
  const prompt = api.el('div', 'g-prompt', 'Загадал число от 1 до 100');
  stage.appendChild(prompt);
  const inp = api.el('input');
  inp.type = 'number'; inp.min = '1'; inp.max = '100';
  inp.style.cssText = 'padding:12px 16px;border-radius:12px;border:1px solid var(--stroke2);' +
    'background:rgba(255,255,255,.04);color:var(--text);font-size:17px;width:130px;' +
    'text-align:center;font-family:inherit;outline:none';
  stage.appendChild(inp);

  let secret, tries, over;

  function init() {
    secret = 1 + api.rnd(100);
    tries = 0; over = false;
    prompt.textContent = 'Загадал число от 1 до 100';
    api.score('0/7');
    inp.value = ''; inp.disabled = false;
  }
  function check() {
    if (over) return;
    const v = parseInt(inp.value, 10);
    if (!v || v < 1 || v > 100) { prompt.textContent = 'Введи число от 1 до 100'; return; }
    tries++;
    api.score(tries + '/7');
    if (v === secret) {
      over = true;
      api.confetti();
      api.overlay('🎯', 'Угадал!', 'Число ' + secret + ' · попыток: ' + tries, init);
      return;
    }
    if (tries >= 7) {
      over = true;
      api.overlay('💀', 'Попытки кончились', 'Было загадано ' + secret, init);
      return;
    }
    prompt.textContent = v < secret ? v + ' — больше' : v + ' — меньше';
    inp.value = ''; inp.focus();
  }
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  api.controls(api.btn('Проверить', check), api.btn('Заново', init, true));
  init();
});

/* ---------- 46. Камень-ножницы-бумага ---------- */
reg('rps', { name: 'Камень-ножницы', cat: 'Удача', desc: 'Классика на троих' }, (stage, api) => {
  const MOVES = [
    { k: 'rock', n: 'Камень' },
    { k: 'paper', n: 'Бумага' },
    { k: 'scissors', n: 'Ножницы' }
  ];
  const row = api.el('div', 'g-row');
  const you = api.el('div', 'g-card');
  const cpu = api.el('div', 'g-card');
  [you, cpu].forEach(d => {
    d.style.cssText += ';width:88px;height:88px;display:flex;align-items:center;justify-content:center;' +
      'padding:18px;color:var(--accent)';
    d.innerHTML = ic('circle');
  });
  const vs = api.el('div', 'g-prompt', 'vs');
  vs.style.fontSize = '15px'; vs.style.minWidth = '30px';
  row.appendChild(you); row.appendChild(vs); row.appendChild(cpu);
  stage.appendChild(row);
  const res = api.el('div', 'g-prompt', 'Выбери ход');
  stage.appendChild(res);

  let w = 0, l = 0, d = 0, busy = false;

  function play(mv) {
    if (busy) return;
    busy = true;
    you.innerHTML = ic(mv.k);
    let n = 0;
    const iv = setInterval(() => {
      cpu.innerHTML = ic(api.pick(MOVES).k);
      if (++n > 6) {
        clearInterval(iv);
        const cm = api.pick(MOVES);
        cpu.innerHTML = ic(cm.k);
        let out;
        if (cm.k === mv.k) { d++; out = 'Ничья'; }
        else if (
          (mv.k === 'rock' && cm.k === 'scissors') ||
          (mv.k === 'paper' && cm.k === 'rock') ||
          (mv.k === 'scissors' && cm.k === 'paper')
        ) { w++; out = 'Победа'; api.bump(); }
        else { l++; out = 'Проиграл'; }
        res.textContent = out + ' · ' + w + '/' + l + '/' + d;
        api.score(w + ':' + l);
        busy = false;
      }
    }, 80);
    api.onCleanup(() => clearInterval(iv));
  }
  const btns = MOVES.map(m => api.btn(m.n, () => play(m)));
  btns.forEach(b => b.style.minWidth = '104px');
  api.controls(...btns);
  api.hint('Счёт: победы / поражения / ничьи');
});

/* ---------- 47. Больше-меньше ---------- */
reg('higherlower', { name: 'Больше-меньше', cat: 'Удача', desc: 'Угадай следующую карту' }, (stage, api) => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const NAMES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const card = api.el('div', 'g-card g-playing-card');
  stage.appendChild(card);
  const res = api.el('div', 'g-prompt', '—');
  stage.appendChild(res);

  let cur, streak = 0, best = 0, busy = false;

  function drawCard() {
    const v = api.rnd(13);
    return { v, s: api.pick(SUITS), n: NAMES[v] };
  }
  function show(c) {
    card.textContent = c.n + c.s;
    card.classList.toggle('red', c.s === '♥' || c.s === '♦');
  }
  function flipTo(c) {
    card.classList.add('flipping');
    setTimeout(() => {
      show(c);
      card.classList.remove('flipping');
      card.classList.add('dealt');
      setTimeout(() => card.classList.remove('dealt'), 400);
    }, 180);
  }
  function init() {
    cur = drawCard(); show(cur); streak = 0; res.textContent = 'Больше или меньше?';
    api.score('0');
  }
  function guess(higher) {
    if (busy) return;
    busy = true;
    if (typeof SFX !== 'undefined') SFX.flip();
    const nx = drawCard();
    const ok = higher ? nx.v > cur.v : nx.v < cur.v;
    const tie = nx.v === cur.v;
    flipTo(nx);
    setTimeout(() => {
      if (tie) { res.textContent = 'Равно — ничья, серия сохранена'; }
      else if (ok) {
        streak++; best = Math.max(best, streak);
        res.textContent = 'Верно. Серия ' + streak;
        api.bump();
        if (typeof SFX !== 'undefined') SFX.good();
      } else {
        res.textContent = 'Не угадал. Серия сброшена';
        streak = 0;
        if (typeof SFX !== 'undefined') SFX.bad();
      }
      api.score('серия ' + streak + ' · рекорд ' + best);
      cur = nx;
      busy = false;
      if (streak > 0 && streak % 5 === 0) api.confetti();
    }, 460);
  }
  api.controls(
    api.btn('Больше', () => guess(true)),
    api.btn('Меньше', () => guess(false), true)
  );
  init();
});

/* ---------- 48. Лотерея ---------- */
reg('lottery', { name: 'Лотерея', cat: 'Удача', desc: '6 из 49' }, (stage, api) => {
  const wrap = api.el('div', 'g-row');
  wrap.style.maxWidth = '340px';
  stage.appendChild(wrap);
  const res = api.el('div', 'g-prompt', 'Твой билет');
  stage.appendChild(res);

  let ticket = [], drawn = [], busy = false;

  function renderBalls(list, container, highlight) {
    container.innerHTML = '';
    list.forEach(n => {
      const b = api.el('div', 'g-ball' + (highlight && highlight.has(n) ? ' hit' : ''), String(n));
      container.appendChild(b);
    });
  }
  function newTicket() {
    const pool = Array.from({ length: 49 }, (_, i) => i + 1);
    ticket = api.shuffle(pool).slice(0, 6).sort((a, b) => a - b);
    drawn = []; busy = false;
    res.textContent = 'Твой билет';
    renderBalls(ticket, wrap, null);
    api.score('—');
    drawBtn.disabled = false;
  }
  function draw() {
    if (busy || drawn.length) return;
    busy = true;
    if (typeof SFX !== 'undefined') SFX.roll();
    const pool = Array.from({ length: 49 }, (_, i) => i + 1);
    const out = api.shuffle(pool).slice(0, 6).sort((a, b) => a - b);
    let i = 0;
    const iv = setInterval(() => {
      drawn.push(out[i]);
      renderBalls(ticket, wrap, new Set(drawn));
      if (typeof SFX !== 'undefined') SFX.flip();
      i++;
      if (i >= 6) {
        clearInterval(iv);
        const hits = ticket.filter(n => out.includes(n)).length;
        res.textContent = 'Совпало ' + hits + ' из 6 · выпало ' + out.join(', ');
        api.score(hits + '/6');
        if (hits >= 3) { api.confetti(); api.bump(); }
        busy = false;
      }
    }, 300);
    api.onCleanup(() => clearInterval(iv));
  }
  const drawBtn = api.btn('Розыгрыш', draw);
  api.controls(drawBtn, api.btn('Новый билет', newTicket, true));
  newTicket();
});

/* ---------- 49. Скретч-карта ---------- */
reg('scratch', { name: 'Скретч-карта', cat: 'Удача', desc: 'Сотри 9 клеток — найди приз' }, (stage, api) => {
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = 'repeat(3,1fr)';
  wrap.style.width = '260px';
  stage.appendChild(wrap);
  const res = api.el('div', 'g-prompt', 'Сотри клетки');
  stage.appendChild(res);

  const PRIZES = ['gem', 'star', 'clover', 'money', 'trophy', 'cross', 'cross', 'cross', 'cross'];
  let opened = 0;

  function init() {
    const layout = api.shuffle(PRIZES);
    opened = 0;
    wrap.innerHTML = '';
    layout.forEach((p, idx) => {
      const cell = api.el('div', 'g-cell g-scratch');
      cell.style.animationDelay = (idx * .04) + 's';
      cell.innerHTML = ic('circle');
      let done = false;
      cell.onclick = () => {
        if (done) return;
        done = true;
        cell.classList.toggle('done', p !== 'cross');
        cell.innerHTML = ic(p);
        opened++;
        if (p !== 'cross') {
          api.bump();
          if (typeof SFX !== 'undefined') SFX.pop();
          if (p === 'gem') { api.confetti(); api.overlay('🎉', 'Алмаз', 'Джекпот среди мусора', init); return; }
        } else if (typeof SFX !== 'undefined') SFX.click();
        if (opened === 9) {
          const prize = layout.filter(x => x !== 'cross').length;
          res.textContent = 'Призов найдено: ' + prize;
          api.score(prize);
        }
      };
      wrap.appendChild(cell);
    });
    res.textContent = 'Сотри клетки';
    api.score('0');
  }
  api.controls(api.btn('Новая карта', init, true));
  init();
});

/* ---------- 50. Рулетка ---------- */
reg('roulette', { name: 'Рулетка', cat: 'Удача', desc: 'Один шанс из шести' }, (stage, api) => {
  const wrap = api.el('div', 'g-row');
  stage.appendChild(wrap);
  const res = api.el('div', 'g-prompt', 'Нажми на камору');
  stage.appendChild(res);

  let bullet, shots, over;

  function init() {
    bullet = api.rnd(6);
    shots = 0; over = false;
    wrap.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const c = api.el('div', 'g-cell g-chamber');
      c.innerHTML = ic('circle');
      c.onclick = () => shoot(i, c);
      wrap.appendChild(c);
    }
    res.textContent = 'Нажми на камору';
    api.score('0/6');
  }
  function shoot(i, c) {
    if (over || c.dataset.used) return;
    c.dataset.used = '1';
    shots++;
    api.score(shots + '/6');
    if (i === bullet) {
      over = true;
      c.classList.add('boom');
      c.innerHTML = ic('sparkle');
      if (typeof SFX !== 'undefined') SFX.bad();
      api.overlay('💥', 'Бах', 'Попался на ' + shots + '-й каморе', init);
    } else {
      c.classList.add('done');
      c.innerHTML = ic('check');
      res.textContent = 'Щёлк. Пусто. Осталось ' + (6 - shots);
      if (typeof SFX !== 'undefined') SFX.click();
      if (shots === 6) { over = true; api.confetti(); api.overlay('😅', 'Невероятно', 'Все шесть пустых', init); }
    }
  }
  api.controls(api.btn('Заново', init, true));
  init();
});

/* ---------- 51. Плинко ---------- */
reg('plinko', { name: 'Плинко', cat: 'Удача', desc: 'Урони шарик и поймай множитель' }, (stage, api) => {
  const W = 300, H = 320;
  const c = api.canvas(W, H);
  c.style.cssText = 'max-width:100%;background:#0b0d11';
  const ctx = c.getContext('2d');
  stage.appendChild(c);
  const res = api.el('div', 'g-prompt', 'Брось шарик');
  stage.appendChild(res);

  const SLOTS = [10, 3, 1, 0, 1, 3, 10];
  const ROWS = 7, PEG_R = 4, BALL_R = 7;
  const pegs = [];
  for (let r = 0; r < ROWS; r++) {
    const cols = r + 2;
    const pad = W / (cols + 1);
    for (let i = 0; i < cols; i++) pegs.push({ x: pad * (i + 1), y: 40 + r * 36 });
  }
  let ball = null, score = 0, running = false;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const slotW = W / SLOTS.length;
    SLOTS.forEach((v, i) => {
      ctx.fillStyle = v >= 10 ? 'rgba(255,122,89,.18)' : v >= 3 ? 'rgba(255,204,77,.16)' : 'rgba(198,255,61,.14)';
      ctx.fillRect(i * slotW + 2, H - 34, slotW - 4, 30);
      ctx.fillStyle = v >= 10 ? '#ff9a80' : v >= 3 ? '#ffd166' : '#c6ff3d';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('×' + v, i * slotW + slotW / 2, H - 18);
    });
    pegs.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
    });
    if (ball) {
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#c6ff3d'; ctx.fill();
      ctx.strokeStyle = 'rgba(8,9,12,.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function drop() {
    if (running) return;
    running = true;
    ball = { x: W / 2, y: 14, vx: (Math.random() - .5) * 2, vy: 0 };
    res.textContent = 'Летит…';
  }

  function step() {
    if (!ball) return;
    ball.vy = Math.min(ball.vy + .42, 9);
    ball.x += ball.vx;
    ball.y += ball.vy;

    pegs.forEach(p => {
      const dx = ball.x - p.x, dy = ball.y - p.y;
      const d = Math.hypot(dx, dy);
      const min = PEG_R + BALL_R;
      if (d < min && d > 0) {
        const nx = dx / d, ny = dy / d;
        ball.x = p.x + nx * min;
        ball.y = p.y + ny * min;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 1.7 * dot * nx;
        ball.vy -= 1.7 * dot * ny;
        ball.vx += (Math.random() - .5) * 1.1;
      }
    });
    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) * .7; }
    if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx) * .7; }

    if (ball.y > H - 40) {
      const slotW = W / SLOTS.length;
      const idx = Math.max(0, Math.min(SLOTS.length - 1, Math.floor(ball.x / slotW)));
      const mult = SLOTS[idx];
      score += mult;
      api.score('очки ' + score);
      res.textContent = mult ? '×' + mult + ' · всего ' + score : 'Мимо · всего ' + score;
      if (mult >= 10) { api.bump(); api.confetti(); }
      ball = null; running = false;
    }
    draw();
  }

  draw();
  api.loop(step);
  api.controls(api.btn('Бросить', drop));
});

/* ---------- 52. Крэш ---------- */
reg('crash', { name: 'Крэш', cat: 'Удача', desc: 'Забери до краха' }, (stage, api) => {
  const mult = api.el('div', 'g-prompt', '1.00×');
  mult.style.fontSize = '56px';
  stage.appendChild(mult);
  const status = api.el('div', 'g-stat', 'Нажми «Старт»');
  stage.appendChild(status);

  let running = false, value = 1, cash = 0, raf = null, t0 = 0, crashAt = 1;

  function start() {
    if (running) return;
    running = true; value = 1;
    crashAt = 1 + Math.random() * Math.random() * 8;
    t0 = performance.now();
    status.textContent = 'Растёт… забери вовремя';
    startBtn.disabled = true;
    cashBtn.disabled = false;
    tick();
  }
  function tick() {
    if (!running) return;
    const dt = (performance.now() - t0) / 1000;
    value = 1 + Math.pow(dt, 1.6) * .9;
    mult.textContent = value.toFixed(2) + '×';
    if (value >= crashAt) {
      running = false;
      mult.textContent = 'крах ' + crashAt.toFixed(2) + '×';
      mult.style.color = 'var(--warn)';
      status.textContent = 'Крах. Ты не успел';
      startBtn.disabled = false;
      cashBtn.disabled = true;
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  function cashOut() {
    if (!running) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    cash += Math.round(value * 10);
    api.score('банк ' + cash);
    api.bump();
    status.textContent = 'Забрал на ' + value.toFixed(2) + '× → +' + Math.round(value * 10);
    mult.textContent = value.toFixed(2) + '×';
    startBtn.disabled = false;
    cashBtn.disabled = true;
    if (value >= 5) api.confetti();
  }
  const startBtn = api.btn('Старт', start);
  const cashBtn = api.btn('Забрать', cashOut, true);
  cashBtn.disabled = true;
  api.controls(startBtn, cashBtn);
  api.onCleanup(() => { if (raf) cancelAnimationFrame(raf); });
  api.hint('Множитель растёт. Чем дольше ждёшь — тем больше риск.');
});
