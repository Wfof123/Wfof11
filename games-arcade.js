/* ============================================================
   АРКАДЫ (12 игр)
   ============================================================ */

/* ---------- 1. Змейка ---------- */
reg('snake', { name: 'Змейка', icon: '🐍', cat: 'Аркада', desc: 'Классика в минимализме', grad: 'linear-gradient(135deg,#667eea,#764ba2)' }, (stage, api) => {
  const S = 18, G = 20, W = G * S;
  const c = api.canvas(W, W), ctx = c.getContext('2d');
  let snake, dir, food, score, alive, parts, foodT;

  function placeFood() {
    do { food = { x: api.rnd(G), y: api.rnd(G) }; }
    while (snake.some(s => s.x === food.x && s.y === food.y));
  }
  function burst(x, y) {
    for (let i = 0; i < 12; i++) parts.push({
      x: x * S + S / 2, y: y * S + S / 2, vx: -3 + Math.random() * 6,
      vy: -3 + Math.random() * 6, life: 26, c: i % 2 ? '#ff3b30' : '#ff9500'
    });
  }
  function draw() {
    const pal = api.pal();
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, W);
    ctx.fillStyle = 'rgba(0,0,0,.04)';
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) ctx.fillRect(i * S + 1, j * S + 1, 2, 2);
    foodT += .2;
    const sc = 1 + Math.sin(foodT) * .12;
    ctx.save(); ctx.translate(food.x * S + S / 2, food.y * S + S / 2); ctx.scale(sc, sc);
    ctx.shadowColor = rgba(pal.a, .6); ctx.shadowBlur = 14;
    ctx.fillStyle = pal.a; ctx.beginPath(); ctx.arc(0, 0, S / 2 - 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    snake.forEach((s, i) => {
      const t = i / Math.max(snake.length - 1, 1);
      ctx.fillStyle = mix(pal.b, pal.a, 1 - t);
      if (i === 0) { ctx.shadowColor = rgba(pal.a, .6); ctx.shadowBlur = 12; } else ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.roundRect(s.x * S + 1, s.y * S + 1, S - 2, S - 2, i === 0 ? 7 : 5); ctx.fill();
    });
    ctx.shadowBlur = 0;
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .15; p.life--; });
    parts = parts.filter(p => p.life > 0);
    parts.forEach(p => {
      ctx.globalAlpha = p.life / 26; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  function reset() {
    snake = [{ x: 10, y: 10 }]; dir = { x: 1, y: 0 }; score = 0; alive = false; parts = []; foodT = 0;
    placeFood(); api.score(0); draw();
  }
  function step() {
    if (!alive) return;
    const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (h.x < 0 || h.x >= G || h.y < 0 || h.y >= G || snake.some(s => s.x === h.x && s.y === h.y)) {
      alive = false;
      api.overlay('💀', 'Игра окончена', 'Очков: ' + score, () => reset());
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) { score++; api.score(score); api.bump(); burst(h.x, h.y); placeFood(); }
    else snake.pop();
    draw();
  }
  api.controls(api.btn('Играть', () => { if (!alive) { reset(); alive = true; } }));
  api.every(120, step);
  function turn(d) {
    if (!alive) return;
    if (d === 'U' && dir.y !== 1) dir = { x: 0, y: -1 };
    if (d === 'D' && dir.y !== -1) dir = { x: 0, y: 1 };
    if (d === 'L' && dir.x !== 1) dir = { x: -1, y: 0 };
    if (d === 'R' && dir.x !== -1) dir = { x: 1, y: 0 };
  }
  api.keys(e => {
    const map = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R' };
    if (map[e.key]) { e.preventDefault(); turn(map[e.key]); }
  });
  /* на телефоне — свайп по полю и крестовина под ним */
  api.swipe(c, turn, 20);
  api.dpad(turn);
  reset();
});

/* ---------- 2. Полёт ---------- */
reg('flappy', { name: 'Полёт', icon: '🐦', cat: 'Аркада', desc: 'Летай между препятствиями', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)' }, (stage, api) => {
  const W = 360, H = 460;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  const GRAVITY = .45, JUMP = -7.5, PW = 52, GAP = 145, SPEED = 2.2;
  let bird, pipes, score, frame, started, alive, clouds, parts;

  function reset() {
    bird = { x: 80, y: H / 2, vy: 0, r: 12, rot: 0 };
    pipes = []; score = 0; frame = 0; started = false; alive = false; parts = [];
    clouds = Array.from({ length: 4 }, () => ({
      x: Math.random() * W, y: Math.random() * H * .45,
      s: 18 + Math.random() * 26, v: .15 + Math.random() * .25
    }));
    api.score(0);
  }
  function draw() {
    const pal = api.pal();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky[0]); g.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(pal.paper, .7);
    clouds.forEach(cl => {
      if (started && alive) cl.x -= cl.v;
      if (cl.x < -cl.s * 2) cl.x = W + cl.s * 2;
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, cl.s, 0, Math.PI * 2);
      ctx.arc(cl.x + cl.s, cl.y + 5, cl.s * .8, 0, Math.PI * 2);
      ctx.arc(cl.x - cl.s, cl.y + 5, cl.s * .7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = pal.a;
    pipes.forEach(p => {
      ctx.beginPath(); ctx.roundRect(p.x, 0, PW, p.top, [0, 0, 8, 8]); ctx.fill();
      ctx.beginPath(); ctx.roundRect(p.x, H - p.bottom, PW, p.bottom, [8, 8, 0, 0]); ctx.fill();
      ctx.beginPath(); ctx.roundRect(p.x - 4, p.top - 16, PW + 8, 16, 6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(p.x - 4, H - p.bottom, PW + 8, 16, 6); ctx.fill();
    });
    if (started && alive && bird.vy < 2) parts.push({
      x: bird.x - 8, y: bird.y + 4, vx: -1.4, vy: Math.random() - .5, life: 16
    });
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    parts = parts.filter(p => p.life > 0);
    parts.forEach(p => {
      ctx.globalAlpha = p.life / 16; ctx.fillStyle = rgba(pal.b, .6);
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
    ctx.fillStyle = pal.b; ctx.beginPath(); ctx.arc(0, 0, bird.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.paper; ctx.beginPath(); ctx.arc(5, -3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.arc(7, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal.a; ctx.beginPath(); ctx.ellipse(-4, 2, 8, 5, -.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    ctx.font = 'bold 46px -apple-system,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(score, W / 2, 58);
    if (!started) {
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.font = '15px -apple-system,sans-serif';
      ctx.fillText('Тап или пробел — взмах', W / 2, H / 2 + 42);
    }
  }
  function tick() {
    if (alive) {
      bird.vy += GRAVITY; bird.y += bird.vy;
      bird.rot = Math.max(-.5, Math.min(1.2, bird.vy * .08));
      frame++;
      if (frame % 88 === 0) {
        const top = 40 + Math.random() * (H - GAP - 90);
        pipes.push({ x: W, top, bottom: H - top - GAP, passed: false });
      }
      for (const p of pipes) {
        p.x -= SPEED;
        if (!p.passed && p.x + PW < bird.x - bird.r) {
          p.passed = true; score++; api.score(score); api.bump();
        }
        const hit = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PW &&
          (bird.y - bird.r < p.top || bird.y + bird.r > H - p.bottom);
        if (bird.y - bird.r < 0 || bird.y + bird.r > H || hit) {
          alive = false;
          const fin = score;
          setTimeout(() => api.overlay('💀', 'Разбился', 'Счёт: ' + fin, () => reset()), 120);
          break;
        }
      }
      pipes = pipes.filter(p => p.x > -PW);
    }
    draw();
  }
  function flap() {
    if (!alive) { reset(); started = true; alive = true; return; }
    bird.vy = JUMP;
  }
  api.controls(api.btn('Играть', flap));
  api.tap(c, flap);
  api.keys(e => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } });
  api.loop(tick);
  reset();
});

/* ---------- 3. Арканоид ---------- */
reg('breakout', { name: 'Арканоид', icon: '⬜', cat: 'Аркада', desc: 'Разбей все кирпичи', grad: 'linear-gradient(135deg,#f093fb,#f5576c)' }, (stage, api) => {
  const W = 400, H = 360;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  const COLS = 8, ROWS = 5, BW = W / COLS, BH = 18;
  let px, ball, bricks, score, alive, vx, vy;

  function reset() {
    px = W / 2; ball = { x: W / 2, y: H - 60, r: 7 }; vx = 3.2; vy = -3.4;
    bricks = [];
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++)
      bricks.push({ x: col * BW, y: 40 + r * BH, alive: true, hue: r });
    score = 0; alive = false; api.score(0);
  }
  function draw() {
    const pal = api.pal();
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, H);
    bricks.forEach(b => {
      if (!b.alive) return;
      /* кирпичи — градиент от акцента к вторичному цвету скина */
      ctx.fillStyle = mix(pal.a, pal.b, b.hue / Math.max(ROWS - 1, 1));
      ctx.beginPath(); ctx.roundRect(b.x + 2, b.y + 2, BW - 4, BH - 4, 4); ctx.fill();
    });
    ctx.fillStyle = pal.ink;
    ctx.beginPath(); ctx.roundRect(px - 34, H - 20, 68, 9, 5); ctx.fill();
    ctx.fillStyle = pal.b;
    ctx.shadowColor = rgba(pal.b, .6); ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(pal.ink, .15); ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(score, W / 2, 28);
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .35); ctx.font = '14px sans-serif';
      ctx.fillText('Пробел или тап — старт · ← → или палец', W / 2, H / 2 + 30);
    }
  }
  function tick() {
    if (alive) {
      ball.x += vx; ball.y += vy;
      if (ball.x < ball.r || ball.x > W - ball.r) vx = -vx;
      if (ball.y < ball.r) vy = -vy;
      if (ball.y > H - 30 && ball.y < H - 10 && Math.abs(ball.x - px) < 38) {
        vy = -Math.abs(vy); vx += (ball.x - px) * .05;
      }
      if (ball.y > H) {
        alive = false;
        api.overlay('💀', 'Промах', 'Разбито кирпичей: ' + score, () => reset());
      }
      bricks.forEach(b => {
        if (!b.alive) return;
        if (ball.x > b.x && ball.x < b.x + BW && ball.y > b.y && ball.y < b.y + BH) {
          b.alive = false; vy = -vy; score++; api.score(score); api.bump();
        }
      });
      if (bricks.every(b => !b.alive)) {
        alive = false; api.confetti();
        api.overlay('🏆', 'Победа!', 'Все кирпичи разбиты', () => reset());
      }
    }
    draw();
  }
  api.controls(api.btn('Играть', () => { if (!alive) { reset(); alive = true; } }));
  api.keys(e => {
    if (e.key === 'ArrowLeft') { px = Math.max(38, px - 26); e.preventDefault(); }
    if (e.key === 'ArrowRight') { px = Math.min(W - 38, px + 26); e.preventDefault(); }
  });
  api.ptr(c, {
    move(p) { px = Math.max(38, Math.min(W - 38, p.x)); },
    down(p) { px = Math.max(38, Math.min(W - 38, p.x)); }
  });
  api.padButtons([
    { label: '◀', onDown: () => { px = Math.max(38, px - 34); }, onUp: () => { } },
    { label: '▶', onDown: () => { px = Math.min(W - 38, px + 34); }, onUp: () => { } }
  ]);
  api.loop(tick);
  reset();
});

/* ---------- 4. Пинг-понг ---------- */
reg('pong', { name: 'Пинг-понг', icon: '🎯', cat: 'Аркада', desc: 'Отбей мяч сопернику', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)' }, (stage, api) => {
  const W = 400, H = 300;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let py, ay, ball, me, ai, alive;

  function reset() {
    py = H / 2; ay = H / 2; ball = { x: W / 2, y: H / 2, vx: 4, vy: 2.6 };
    me = 0; ai = 0; alive = false; api.score('0 : 0');
  }
  function draw() {
    const pal = api.pal();
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, H);
    ctx.setLineDash([8, 10]); ctx.strokeStyle = rgba(pal.ink, .12); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = pal.a;
    ctx.beginPath(); ctx.roundRect(12, py - 32, 9, 64, 5); ctx.fill();
    ctx.fillStyle = pal.dark;
    ctx.beginPath(); ctx.roundRect(W - 21, ay - 32, 9, 64, 5); ctx.fill();
    ctx.fillStyle = pal.b;
    ctx.shadowColor = rgba(pal.b, .55); ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(pal.ink, .2); ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(me, W / 2 - 50, 42); ctx.fillText(ai, W / 2 + 50, 42);
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .35); ctx.font = '14px sans-serif';
      ctx.fillText('Пробел или тап — старт · ↑ ↓ или палец', W / 2, H / 2 + 50);
    }
  }
  function tick() {
    if (alive) {
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.y < 8 || ball.y > H - 8) ball.vy = -ball.vy;
      // AI следит за мячом с ограничением скорости
      if (ay < ball.y - 4) ay = Math.min(H - 34, ay + 3.1);
      else if (ay > ball.y + 4) ay = Math.max(34, ay - 3.1);
      // Отбивание
      if (ball.x < 24 && ball.x > 12 && Math.abs(ball.y - py) < 34) {
        ball.vx = Math.abs(ball.vx) * 1.03; ball.vy += (ball.y - py) * .06;
      }
      if (ball.x > W - 24 && ball.x < W - 12 && Math.abs(ball.y - ay) < 34) {
        ball.vx = -Math.abs(ball.vx) * 1.03; ball.vy += (ball.y - ay) * .06;
      }
      if (ball.x < 0) { ai++; ball = { x: W / 2, y: H / 2, vx: 4, vy: 2.6 }; api.score(me + ' : ' + ai); api.bump(); }
      if (ball.x > W) { me++; ball = { x: W / 2, y: H / 2, vx: -4, vy: 2.6 }; api.score(me + ' : ' + ai); api.bump(); }
      if (me >= 5 || ai >= 5) {
        alive = false;
        const win = me >= 5;
        if (win) api.confetti();
        api.overlay(win ? '🏆' : '💀', win ? 'Победа!' : 'Проигрыш', 'Счёт ' + me + ' : ' + ai, () => reset());
      }
    }
    draw();
  }
  api.controls(api.btn('Играть', () => { if (!alive) { reset(); alive = true; } }));
  api.keys(e => {
    if (e.key === 'ArrowUp') { py = Math.max(34, py - 28); e.preventDefault(); }
    if (e.key === 'ArrowDown') { py = Math.min(H - 34, py + 28); e.preventDefault(); }
  });
  api.ptr(c, {
    move(p) { py = Math.max(34, Math.min(H - 34, p.y)); },
    down(p) { py = Math.max(34, Math.min(H - 34, p.y)); }
  });
  api.padButtons([
    { label: '▲', onDown: () => { py = Math.max(34, py - 34); }, onUp: () => { } },
    { label: '▼', onDown: () => { py = Math.min(H - 34, py + 34); }, onUp: () => { } }
  ]);
  api.loop(tick);
  reset();
});

/* ---------- 5. Бегун ---------- */
reg('runner', { name: 'Бегун', icon: '🏃', cat: 'Аркада', desc: 'Прыгай через препятствия', grad: 'linear-gradient(135deg,#fa709a,#fee140)' }, (stage, api) => {
  const W = 420, H = 240, GROUND = H - 46;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let py, vy, obs, score, alive, speed, frame;

  function reset() {
    py = 0; vy = 0; obs = []; score = 0; alive = false; speed = 4.4; frame = 0; api.score(0);
  }
  function draw() {
    const pal = api.pal();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky[0]); g.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(pal.ink, .06); ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = rgba(pal.ink, .1);
    for (let i = 0; i < 20; i++) ctx.fillRect((i * 60 - (frame * speed) % 60), GROUND + 12, 30, 3);
    ctx.fillStyle = pal.ink;
    const y = GROUND - 34 - py;
    ctx.beginPath(); ctx.roundRect(60, y, 26, 34, 8); ctx.fill();
    ctx.fillStyle = pal.paper; ctx.beginPath(); ctx.arc(73, y + 11, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,59,48,.85)';
    obs.forEach(o => {
      ctx.beginPath(); ctx.roundRect(o.x, GROUND - o.h, 20, o.h, 4); ctx.fill();
    });
    ctx.fillStyle = rgba(pal.ink, .2); ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(score, 14, 34);
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .35); ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Пробел — прыжок', W / 2, H / 2 + 40);
    }
  }
  function tick() {
    if (alive) {
      frame++;
      vy += .85; py -= vy;
      if (py <= 0) { py = 0; vy = 0; }
      if (frame % 78 === 0) obs.push({ x: W, h: 24 + Math.random() * 26 });
      obs.forEach(o => o.x -= speed);
      obs = obs.filter(o => o.x > -30);
      for (const o of obs) {
        if (o.x < 86 && o.x + 20 > 60 && py < o.h) {
          alive = false;
          const fin = score;
          api.overlay('💀', 'Споткнулся', 'Счёт: ' + fin, () => reset());
          break;
        }
      }
      obs.forEach(o => { if (!o.scored && o.x + 20 < 60) { o.scored = true; score++; api.score(score); } });
      speed += .0008;
    }
    draw();
  }
  function jump() {
    if (!alive) { reset(); alive = true; return; }
    if (py === 0) vy = 11;
  }
  api.controls(api.btn('Прыжок', jump));
  api.keys(e => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } });
  /* тап по полю — прыжок, самый естественный жест на телефоне */
  api.tap(c, jump);
  api.loop(tick);
  reset();
});

/* ---------- 6. Ловец ---------- */
reg('catcher', { name: 'Ловец', icon: '🪣', cat: 'Аркада', desc: 'Лови хорошее, избегай плохого', grad: 'linear-gradient(135deg,#30cfd0,#330867)' }, (stage, api) => {
  const W = 380, H = 380;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let bx, items, score, lives, alive, frame;

  function reset() {
    bx = W / 2; items = []; score = 0; lives = 3; alive = false; frame = 0; api.score('0 ♥♥♥');
  }
  function draw() {
    const pal = api.pal();
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, H);
    /* корзина в цвете скина */
    ctx.fillStyle = pal.a;
    ctx.shadowColor = rgba(pal.a, .5); ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.roundRect(bx - 34, H - 34, 68, 14, 7); ctx.fill();
    ctx.shadowBlur = 0;
    /* предметы рисуем вектором: эмодзи в canvas выглядят по-разному в каждом браузере */
    items.forEach(it => {
      if (it.bad) {
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath(); ctx.arc(it.x, it.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba(pal.ink, .55); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(it.x + 5, it.y - 8); ctx.lineTo(it.x + 10, it.y - 14); ctx.stroke();
      } else {
        ctx.fillStyle = pal.b;
        ctx.beginPath(); ctx.arc(it.x, it.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba(pal.a, .9);
        ctx.beginPath(); ctx.arc(it.x - 3, it.y - 3, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.fillStyle = rgba(pal.ink, .18); ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(score, 14, 30);
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .35); ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('← → или палец · пробел/тап — старт', W / 2, H / 2);
    }
  }
  function tick() {
    if (alive) {
      frame++;
      if (frame % 34 === 0) items.push({
        x: 26 + Math.random() * (W - 52), y: -20,
        v: 2.4 + Math.random() * 1.8, bad: Math.random() < .28
      });
      items.forEach(it => it.y += it.v);
      for (const it of items) {
        if (it.y > H - 46 && it.y < H - 20 && Math.abs(it.x - bx) < 40) {
          it.dead = true;
          if (it.bad) { lives--; }
          else { score += 10; api.score(score + ' ' + '♥'.repeat(Math.max(lives, 0))); api.bump(); }
        } else if (it.y > H + 20) {
          it.dead = true;
          if (!it.bad) { lives--; }
        }
      }
      items = items.filter(it => !it.dead);
      if (lives <= 0) {
        alive = false;
        const fin = score;
        api.overlay('💀', 'Игра окончена', 'Очков: ' + fin, () => reset());
      }
      api.score(score + ' ' + '♥'.repeat(Math.max(lives, 0)));
    }
    draw();
  }
  api.controls(api.btn('Играть', () => { if (!alive) { reset(); alive = true; } }));
  api.keys(e => {
    if (e.key === 'ArrowLeft') { bx = Math.max(40, bx - 26); e.preventDefault(); }
    if (e.key === 'ArrowRight') { bx = Math.min(W - 40, bx + 26); e.preventDefault(); }
    if (e.key === ' ' && !alive) { reset(); alive = true; e.preventDefault(); }
  });
  api.ptr(c, {
    move(p) { bx = Math.max(40, Math.min(W - 40, p.x)); },
    down(p) { if (!alive) { reset(); alive = true; } bx = Math.max(40, Math.min(W - 40, p.x)); }
  });
  api.padButtons([
    { label: '◀', onDown: () => { bx = Math.max(40, bx - 34); }, onUp: () => { } },
    { label: '▶', onDown: () => { bx = Math.min(W - 40, bx + 34); }, onUp: () => { } }
  ]);
  api.loop(tick);
  reset();
});

/* ---------- 7. Уклонение ---------- */
reg('dodge', { name: 'Уклонение', icon: '🛡️', cat: 'Аркада', desc: 'Убегай от падающих блоков', grad: 'linear-gradient(135deg,#ee9ca7,#ffdde1)' }, (stage, api) => {
  const W = 340, H = 340, R = 11;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let px, py, blocks, t, alive;

  function reset() {
    px = W / 2; py = H - 40; blocks = []; t = 0; alive = false; api.score('0.0 с');
  }
  function draw() {
    const pal = api.pal();
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, H);
    /* преграды остаются «красными» — это сигнал опасности, а не стиль */
    ctx.fillStyle = 'rgba(255,59,48,.85)';
    blocks.forEach(b => { ctx.beginPath(); ctx.roundRect(b.x, b.y, b.s, b.s, 4); ctx.fill(); });
    ctx.fillStyle = pal.a;
    ctx.shadowColor = rgba(pal.a, .55); ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(pal.paper, .75);
    ctx.beginPath(); ctx.arc(px - 3, py - 3, 4, 0, Math.PI * 2); ctx.fill();
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .35); ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('WASD / стрелки · пробел — старт', W / 2, H / 2);
    }
  }
  function tick() {
    if (alive) {
      t += 1 / 60;
      api.score(t.toFixed(1) + ' с');
      if (Math.random() < .045) blocks.push({
        x: Math.random() * (W - 26), y: -26, s: 18 + Math.random() * 12,
        v: 2.2 + Math.random() * 2.6 + t * .05
      });
      blocks.forEach(b => b.y += b.v);
      blocks = blocks.filter(b => b.y < H + 40);
      for (const b of blocks) {
        if (px + R > b.x && px - R < b.x + b.s && py + R > b.y && py - R < b.y + b.s) {
          alive = false;
          const fin = t.toFixed(1);
          api.overlay('💀', 'Попался', 'Продержался ' + fin + ' с', () => reset());
          break;
        }
      }
    }
    draw();
  }
  api.controls(api.btn('Играть', () => { if (!alive) { reset(); alive = true; } }));
  api.keys(e => {
    if (!alive) { if (e.key === ' ') { reset(); alive = true; e.preventDefault(); } return; }
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { px = Math.max(R, px - 20); e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { px = Math.min(W - R, px + 20); e.preventDefault(); }
    if (k === 'arrowup' || k === 'w') { py = Math.max(R, py - 20); e.preventDefault(); }
    if (k === 'arrowdown' || k === 's') { py = Math.min(H - R, py + 20); e.preventDefault(); }
  });
  /* палец ведёт шарик напрямую — на телефоне это точнее крестовины */
  api.ptr(c, {
    move(p) {
      if (!alive) return;
      px = Math.max(R, Math.min(W - R, p.x));
      py = Math.max(R, Math.min(H - R, p.y));
    },
    down(p) {
      if (!alive) { reset(); alive = true; }
      px = Math.max(R, Math.min(W - R, p.x));
      py = Math.max(R, Math.min(H - R, p.y));
    }
  });
  api.stick((dx, dy) => {
    if (!alive) return;
    px = Math.max(R, Math.min(W - R, px + dx * 4.2));
    py = Math.max(R, Math.min(H - R, py + dy * 4.2));
  });
  api.loop(tick);
  reset();
});

/* ---------- 8. Прыгун ---------- */
reg('jumper', { name: 'Прыгун', icon: '🦘', cat: 'Аркада', desc: 'Прыгай всё выше', grad: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)' }, (stage, api) => {
  const W = 320, H = 400;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let plats, px, py, vy, best, alive, camY;

  function reset() {
    plats = [{ x: W / 2 - 45, y: H - 40, w: 90 }];
    for (let i = 1; i < 8; i++) plats.push({
      x: Math.random() * (W - 80), y: H - 40 - i * 62, w: 70 + Math.random() * 30
    });
    px = W / 2; py = H - 52; vy = 0; best = 0; alive = false; camY = 0;
    api.score('0 м');
  }
  function draw() {
    const pal = api.pal();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky[0]); g.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pal.dark;
    plats.forEach(p => {
      const y = p.y + camY;
      if (y > H + 30 || y < -30) return;
      ctx.beginPath(); ctx.roundRect(p.x, y, p.w, 11, 6); ctx.fill();
    });
    const sy = py + camY;
    ctx.fillStyle = pal.a;
    ctx.shadowColor = rgba(pal.a, .55); ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(px, sy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = pal.ink;
    ctx.beginPath(); ctx.arc(px + 4, sy - 3, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(best + ' м', 14, 32);
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('← → двигаться · пробел — прыжок', W / 2, H / 2);
    }
  }
  function tick() {
    if (alive) {
      vy += .62; py += vy;
      // Камера следует за игроком вверх
      if (py < 150) { const d = 150 - py; py += d; plats.forEach(p => p.y += d); best += Math.round(d / 4); }
      if (py > H) {
        alive = false;
        const fin = best;
        api.overlay('💀', 'Упал', 'Высота: ' + fin + ' м', () => reset());
      }
      // Приземление
      for (const p of plats) {
        if (vy > 0 && px > p.x - 10 && px < p.x + p.w + 10 &&
            py + 12 > p.y && py + 12 < p.y + 14) {
          py = p.y - 12; vy = -11.5;
        }
      }
      // Поднимаем платформы, ушедшие вниз
      plats = plats.filter(p => p.y < H + 80);
      while (plats.length < 8) {
        const top = Math.min(...plats.map(p => p.y));
        plats.push({ x: Math.random() * (W - 80), y: top - 62, w: 70 + Math.random() * 30 });
      }
      api.score(best + ' м');
    }
    draw();
  }
  function jump() {
    if (!alive) { reset(); alive = true; vy = -11.5; return; }
    vy = -11.5;
  }
  api.controls(api.btn('Прыжок', jump));
  api.keys(e => {
    if (!alive) { if (e.key === ' ') { jump(); e.preventDefault(); } return; }
    if (e.key === 'ArrowLeft') { px = Math.max(14, px - 22); e.preventDefault(); }
    if (e.key === 'ArrowRight') { px = Math.min(W - 14, px + 22); e.preventDefault(); }
    if (e.key === ' ') { jump(); e.preventDefault(); }
  });
  /* тап — прыжок; палец влево/вправо от центра — смещение */
  api.tap(c, (p) => {
    if (!alive) { jump(); return; }
    if (p.cx < p.w * .35) px = Math.max(14, px - 26);
    else if (p.cx > p.w * .65) px = Math.min(W - 14, px + 26);
    else jump();
  });
  api.stick((dx) => {
    if (!alive) return;
    px = Math.max(14, Math.min(W - 14, px + dx * 4));
  });
  api.loop(tick);
  reset();
});

/* ---------- 9. Астероиды ---------- */
reg('asteroids', { name: 'Астероиды', icon: '☄️', cat: 'Аркада', desc: 'Стреляй по камням', grad: 'linear-gradient(135deg,#232526,#414345)' }, (stage, api) => {
  const W = 380, H = 380;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let ship, rocks, bullets, score, alive, frame;

  function reset() {
    ship = { x: W / 2, y: H - 40 };
    rocks = []; bullets = []; score = 0; alive = false; frame = 0; api.score(0);
  }
  function draw() {
    const pal = api.pal();
    const dark = pal.theme === 'modern' ? '#0f1720' : pal.sky[0];
    ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pal.theme === 'modern' ? 'rgba(255,255,255,.5)' : rgba(pal.ink, .35);
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % W, y = (i * 53 + frame * .2) % H;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.fillStyle = pal.theme === 'modern' ? '#9aa5b1' : pal.dark;
    rocks.forEach(r => {
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = pal.a;
    bullets.forEach(b => { ctx.fillRect(b.x - 1.5, b.y - 6, 3, 12); });
    ctx.fillStyle = pal.b;
    ctx.shadowColor = rgba(pal.b, .7); ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - 14);
    ctx.lineTo(ship.x - 11, ship.y + 10);
    ctx.lineTo(ship.x + 11, ship.y + 10);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = pal.theme === 'modern' ? 'rgba(255,255,255,.85)' : rgba(pal.ink, .6);
    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(score, 14, 30);
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .45); ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('← → или палец · пробел/тап — выстрел', W / 2, H / 2);
    }
  }
  function tick() {
    if (alive) {
      frame++;
      if (frame % 46 === 0) rocks.push({
        x: 30 + Math.random() * (W - 60), y: -20, r: 12 + Math.random() * 12,
        v: 1.3 + Math.random() * 1.7
      });
      rocks.forEach(r => r.y += r.v);
      bullets.forEach(b => b.y -= 8);
      bullets = bullets.filter(b => b.y > -10);
      // Попадания
      rocks.forEach(r => {
        for (const b of bullets) {
          if (Math.hypot(b.x - r.x, b.y - r.y) < r.r + 4) {
            r.dead = true; b.dead = true; score += 10; api.score(score); api.bump();
          }
        }
      });
      rocks = rocks.filter(r => !r.dead && r.y < H + 40);
      bullets = bullets.filter(b => !b.dead);
      // Столкновение с кораблём
      for (const r of rocks) {
        if (Math.hypot(r.x - ship.x, r.y - ship.y) < r.r + 12) {
          alive = false;
          const fin = score;
          api.overlay('💀', 'Уничтожен', 'Очков: ' + fin, () => reset());
          break;
        }
      }
    }
    draw();
  }
  function shoot() {
    if (!alive) { reset(); alive = true; return; }
    bullets.push({ x: ship.x, y: ship.y - 14 });
  }
  api.controls(api.btn('Играть', shoot));
  api.keys(e => {
    if (!alive) { if (e.key === ' ') { shoot(); e.preventDefault(); } return; }
    if (e.key === 'ArrowLeft') { ship.x = Math.max(16, ship.x - 22); e.preventDefault(); }
    if (e.key === 'ArrowRight') { ship.x = Math.min(W - 16, ship.x + 22); e.preventDefault(); }
    if (e.key === ' ') { shoot(); e.preventDefault(); }
  });
  /* корабль летит за пальцем, тап по другой половине — выстрел */
  api.ptr(c, {
    move(p) { if (alive) ship.x = Math.max(16, Math.min(W - 16, p.x)); },
    down(p) {
      if (!alive) { shoot(); return; }
      ship.x = Math.max(16, Math.min(W - 16, p.x));
      shoot();
    }
  });
  api.padButtons([
    { label: '◀', onDown: () => { ship.x = Math.max(16, ship.x - 30); }, onUp: () => { } },
    { label: 'Огонь', wide: true, onDown: shoot, onUp: () => { } },
    { label: '▶', onDown: () => { ship.x = Math.min(W - 16, ship.x + 30); }, onUp: () => { } }
  ]);
  api.loop(tick);
  reset();
});

/* ---------- 10. Башня ---------- */
reg('stacker', { name: 'Башня', icon: '🏗️', cat: 'Аркада', desc: 'Строй ровную башню', grad: 'linear-gradient(135deg,#ff9a9e,#fecfef)' }, (stage, api) => {
  const W = 320, H = 400;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let blocks, cur, dir, score, alive, speed;

  function reset() {
    blocks = [{ x: W / 2 - 60, y: H - 30, w: 120 }];
    cur = { x: 0, y: H - 60, w: 120 };
    dir = 1; score = 0; alive = false; speed = 3; api.score(0);
  }
  function draw() {
    const pal = api.pal();
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, H);
    blocks.forEach((b, i) => {
      ctx.fillStyle = mix(pal.a, pal.b, i / Math.max(blocks.length, 6));
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, 26, 6); ctx.fill();
    });
    if (alive) {
      ctx.fillStyle = pal.b;
      ctx.shadowColor = rgba(pal.b, .6); ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.roundRect(cur.x, cur.y, cur.w, 26, 6); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = rgba(pal.ink, .18); ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(score, 14, 32);
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .35); ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Пробел — поставить блок', W / 2, H / 2);
    }
  }
  function tick() {
    if (alive) {
      cur.x += dir * speed;
      if (cur.x < 0) { cur.x = 0; dir = 1; }
      if (cur.x + cur.w > W) { cur.x = W - cur.w; dir = -1; }
    }
    draw();
  }
  function drop() {
    if (!alive) { reset(); alive = true; return; }
    const prev = blocks[blocks.length - 1];
    const left = Math.max(cur.x, prev.x);
    const right = Math.min(cur.x + cur.w, prev.x + prev.w);
    const w = right - left;
    if (w <= 0) {
      alive = false;
      const fin = score;
      api.overlay('💀', 'Промах', 'Высота: ' + fin, () => reset());
      return;
    }
    blocks.push({ x: left, y: prev.y - 30, w });
    score++; api.score(score); api.bump();
    if (blocks.length > 12) {
      // Прокрутка вниз
      blocks.forEach(b => b.y += 30);
      blocks.shift();
    }
    cur = { x: 0, y: blocks[blocks.length - 1].y - 30, w };
    dir = 1; speed = Math.min(9, 3 + score * .22);
  }
  api.controls(api.btn('Поставить', drop));
  api.keys(e => { if (e.key === ' ') { e.preventDefault(); drop(); } });
  api.loop(tick);
  reset();
});

/* ---------- 11. Крот ---------- */
reg('whackamole', { name: 'Крот', icon: '🐹', cat: 'Аркада', desc: 'Успей стукнуть крота', grad: 'linear-gradient(135deg,#f6d365,#fda085)' }, (stage, api) => {
  const SIZE = 3;
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = `repeat(${SIZE},1fr)`;
  wrap.style.width = '300px';
  const cells = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = api.el('div', 'g-cell');
    cell.style.height = '90px';
    cell.style.fontSize = '34px';
    cell.textContent = '';
    wrap.appendChild(cell);
    cells.push(cell);
  }
  stage.appendChild(wrap);

  let score = 0, timeLeft = 30, active = -1, running = false;

  function clearAll() { cells.forEach(c => { c.textContent = ''; c.classList.remove('done'); }); }

  function pop() {
    if (!running) return;
    if (active >= 0) cells[active].textContent = '';
    active = api.rnd(cells.length);
    cells[active].textContent = '🐭';
  }

  const startBtn = api.btn('Играть', start);
  api.controls(startBtn);

  function start() {
    if (running) return;
    score = 0; timeLeft = 30; running = true; active = -1;
    api.score('0 · 30с');
    clearAll();
    pop();
    startBtn.disabled = true;
  }
  function end() {
    running = false;
    startBtn.disabled = false;
    clearAll();
    api.overlay('⏱️', 'Время вышло', 'Ты поймал ' + score + ' кротов', () => { });
  }
  cells.forEach((cell, i) => {
    cell.onclick = () => {
      if (!running || i !== active) return;
      score++; api.score(score + ' · ' + timeLeft + 'с'); api.bump();
      cell.classList.add('done');
      cell.textContent = '✖';
      active = -1;
      setTimeout(() => { cell.textContent = ''; cell.classList.remove('done'); }, 180);
      setTimeout(pop, 240);
    };
  });
  api.every(1100, pop);
  api.every(1000, () => {
    if (!running) return;
    timeLeft--;
    api.score(score + ' · ' + timeLeft + 'с');
    if (timeLeft <= 0) end();
  });
});

/* ---------- 12. Пузыри ---------- */
reg('bubbles', { name: 'Пузыри', icon: '🔵', cat: 'Аркада', desc: 'Лопай пузыри тапом', grad: 'linear-gradient(135deg,#89f7fe,#66a6ff)' }, (stage, api) => {
  const W = 360, H = 360;
  const c = api.canvas(W, H), ctx = c.getContext('2d');
  let bubbles, score, alive, frame, misses;

  function reset() {
    bubbles = []; score = 0; alive = false; frame = 0; misses = 0; api.score('0 · промахов 0');
  }
  function draw() {
    const pal = api.pal();
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, W, H);
    bubbles.forEach(b => {
      /* пузыри строятся из двух цветов скина: середина светлая, край — акцент */
      const grd = ctx.createRadialGradient(b.x - b.r * .3, b.y - b.r * .3, b.r * .1, b.x, b.y, b.r);
      grd.addColorStop(0, rgba(pal.paper, .95));
      grd.addColorStop(0.55, rgba(b.warm ? pal.a : pal.b, .55));
      grd.addColorStop(1, rgba(b.warm ? pal.b : pal.a, .85));
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(pal.paper, .9); ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.fillStyle = rgba(pal.ink, .18); ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(score, 14, 30);
    if (!alive) {
      ctx.fillStyle = rgba(pal.ink, .35); ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Тап по пузырю · пробел — старт', W / 2, H / 2);
    }
  }
  function tick() {
    if (alive) {
      frame++;
      if (frame % 26 === 0) bubbles.push({
        x: 30 + Math.random() * (W - 60), y: H + 20,
        r: 14 + Math.random() * 16, v: 1 + Math.random() * 1.4,
        warm: Math.random() < .5, wob: Math.random() * 6.28
      });
      bubbles.forEach(b => { b.y -= b.v; b.wob += .06; b.x += Math.sin(b.wob) * .5; });
      bubbles = bubbles.filter(b => b.y > -30);
    }
    draw();
  }
  function pop(p) {
    if (!alive) { reset(); alive = true; return; }
    const x = p.x, y = p.y;
    let hit = false;
    bubbles.forEach(b => {
      if (!b.dead && Math.hypot(b.x - x, b.y - y) < b.r + 6) {
        b.dead = true; hit = true; score += Math.max(1, Math.round(30 / b.r)); api.score(score);
        api.bump();
        if (typeof SFX !== 'undefined') SFX.pop();
      }
    });
    if (!hit) { misses++; }
    bubbles = bubbles.filter(b => !b.dead);
    api.score(score);
  }
  api.tap(c, pop);
  api.controls(api.btn('Играть', () => { if (!alive) { reset(); alive = true; } }));
  api.keys(e => { if (e.key === ' ' && !alive) { reset(); alive = true; e.preventDefault(); } });
  api.loop(tick);
  reset();
});
