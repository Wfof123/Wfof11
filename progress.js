/* ============================================================
   ПРОГРЕСС: опыт, уровни, билетики, квесты, скины, темы
   ============================================================ */
const PROGRESS_KEY = 'pg_progress_v2';
const RING_LEN = 100.53;

const TICKET_SVG = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v3a4 4 0 0 0 0 8v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a4 4 0 0 0 0-8z"/><path d="M16 8v3M16 15v2M16 20v4"/></svg>';

/* ---------- скины ---------- */
const SKINS = {
  emerald: { n: 'Изумруд', c: '#c6ff3d', c2: '#4dd4ff', price: 0, note: 'то, с чего всё началось' },
  sunset: { n: 'Закат', c: '#ff8a5c', c2: '#ffcc4d', price: 6, note: 'тёплый и медленный' },
  ocean: { n: 'Океан', c: '#4dd4ff', c2: '#8f9dff', price: 8, note: 'холодный и глубокий' },
  mint: { n: 'Мята', c: '#5fe8b0', c2: '#a8ffe0', price: 9, note: 'свежий, как утро' },
  cherry: { n: 'Вишня', c: '#ff6f9c', c2: '#ffb3c9', price: 10, note: 'сладкий акцент' },
  gold: { n: 'Золото', c: '#ffcf4d', c2: '#ffe9a8', price: 12, note: 'для тех, кто дошёл' },
  lavender: { n: 'Лаванда', c: '#c9a4ff', c2: '#e8d6ff', price: 14, note: 'тихий вечер' }
};

const LEVEL_SKINS = { 3: 'sunset', 6: 'ocean', 9: 'cherry', 12: 'gold', 15: 'lavender' };
/* скины и рамки, открытые за уровни, лежат в P.skins / P.frames */

const THEMES = [
  { id: 'modern', n: 'Современный', d: 'тёмный, тихий' },
  { id: 'kids', n: 'Детский', d: 'яркий, крупный' }
];

/* ---------- задания ---------- */
const DAILY_POOL = [
  { id: 'warmup', t: 'Сыграй 3 раунда', ev: 'rounds', goal: 3, r: 2 },
  { id: 'six', t: 'Сыграй 6 раундов', ev: 'rounds', goal: 6, r: 3 },
  { id: 'newplaces', t: 'Открой 2 новые игры', ev: 'newgames', goal: 2, r: 3 },
  { id: 'variety', t: 'Поиграй в 4 разные игры', ev: 'games', goal: 4, r: 3 },
  { id: 'explorer', t: 'Открой 5 игр за день', ev: 'plays', goal: 5, r: 2 },
  { id: 'junk3', t: 'Сделай 3 дропа мусора', ev: 'drops', goal: 3, r: 2 },
  { id: 'deep', t: 'Проведи в играх 5 минут', ev: 'seconds', goal: 300, r: 3 }
];

const PATH = [
  { id: 'p_first', t: 'Первая игра', ev: 'unique', goal: 1, r: 1 },
  { id: 'p_ten', t: '10 разных игр', ev: 'unique', goal: 10, r: 3 },
  { id: 'p_thirty', t: '30 разных игр', ev: 'unique', goal: 30, r: 5 },
  { id: 'p_all', t: 'Все 76 игр', ev: 'unique', goal: 76, r: 12 },
  { id: 'p_rounds', t: '50 раундов', ev: 'rounds', goal: 50, r: 5 },
  { id: 'p_drops', t: '25 дропов мусора', ev: 'drops', goal: 25, r: 4 },
  { id: 'p_lvl5', t: 'Уровень 5', ev: 'level', goal: 5, r: 4 },
  { id: 'p_lvl10', t: 'Уровень 10', ev: 'level', goal: 10, r: 8 }
];

let P = null;
let session = { id: null, start: 0 };
let saveTimer = null;
let onbStep = 0;

/* ---------- состояние ---------- */
function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function emptyDaily() {
  return { date: todayKey(), plays: 0, rounds: 0, drops: 0, seconds: 0, games: [], newgames: 0, claimed: [], noted: [] };
}
function defaultState() {
  return {
    v: 2, xp: 0, level: 1, tickets: 3, ticketsEarned: 3,
    unique: [], games: {}, stats: { plays: 0, rounds: 0, drops: 0, seconds: 0 },
    daily: emptyDaily(), skins: ['emerald'], skin: 'emerald', theme: 'modern',
    frames: [], frame: '', pathClaimed: [], onboarded: false, welcomed: false,
    streak: 0, bestStreak: 0
  };
}

function loadState() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null'); } catch (e) { s = null; }
  const d = defaultState();
  if (!s || typeof s !== 'object') return d;
  const out = Object.assign(d, s);
  out.stats = Object.assign({ plays: 0, rounds: 0, drops: 0, seconds: 0 }, s.stats || {});
  out.daily = Object.assign(emptyDaily(), s.daily || {});
  out.skins = Array.isArray(s.skins) ? s.skins.filter(k => SKINS[k]) : ['emerald'];
  if (!out.skins.includes('emerald')) out.skins.unshift('emerald');
  if (!SKINS[out.skin] || !out.skins.includes(out.skin)) out.skin = 'emerald';
  /* бумажная тема убрана: у тех, кто её выбирал, остаётся современная */
  if (!THEMES.some(t => t.id === out.theme)) out.theme = 'modern';
  out.unique = Array.isArray(s.unique) ? s.unique.filter(id => GAMES[id] && !GAMES[id].hidden) : [];
  out.pathClaimed = Array.isArray(s.pathClaimed) ? s.pathClaimed : [];
  out.frames = Array.isArray(s.frames) ? s.frames.filter(k => FRAMES[k]) : [];
  if (out.frame && !out.frames.includes(out.frame)) out.frame = '';
  out.daily.claimed = Array.isArray(out.daily.claimed) ? out.daily.claimed : [];
  out.daily.noted = Array.isArray(out.daily.noted) ? out.daily.noted : [];
  out.daily.games = Array.isArray(out.daily.games) ? out.daily.games : [];
  out.level = Math.max(1, Math.min(99, out.level | 0));
  out.tickets = Math.max(0, out.tickets | 0);
  out.xp = Math.max(0, out.xp | 0);
  return out;
}

function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(P)); } catch (e) { }
  }, 350);
}

function dayDiff(a, b) {
  const da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

function rollDay() {
  const t = todayKey();
  if (P.daily.date === t) return;
  const prev = P.daily.date;
  if (prev) {
    const diff = dayDiff(prev, t);
    if (diff === 1) P.streak = (P.streak || 0) + 1;
    else if (diff > 1) P.streak = 1;
    P.bestStreak = Math.max(P.bestStreak || 0, P.streak || 0);
  }
  P.daily = emptyDaily();
  saveState();
}

/* ---------- опыт и уровни ---------- */
function xpNeed(level) { return 70 + (level - 1) * 40; }
function levelTickets(level) { return 2 + Math.floor(level / 3); }

/* ---------- награды за уровни ----------
   Каждый уровень даёт билетики (их число растёт), а «вехи» — ещё и
   конкретный приз: скин, рамку профиля или крупную пачку билетиков.
   Таблица показывается в профиле, чтобы было видно, к чему идёшь. */
const LEVEL_REWARDS = [
  { lv: 2, kind: 'skin', key: 'sunset', t: 'скин «Закат»' },
  { lv: 3, kind: 'frame', key: 'bronze', t: 'рамка «Бронза»' },
  { lv: 5, kind: 'skin', key: 'ocean', t: 'скин «Океан»' },
  { lv: 6, kind: 'frame', key: 'silver', t: 'рамка «Серебро»' },
  { lv: 8, kind: 'skin', key: 'mint', t: 'скин «Мята»' },
  { lv: 9, kind: 'frame', key: 'gold', t: 'рамка «Золото»' },
  { lv: 11, kind: 'skin', key: 'cherry', t: 'скин «Вишня»' },
  { lv: 13, kind: 'frame', key: 'neon', t: 'рамка «Неон»' },
  { lv: 15, kind: 'skin', key: 'gold', t: 'скин «Золото»' },
  { lv: 18, kind: 'frame', key: 'legend', t: 'рамка «Легенда»' },
  { lv: 20, kind: 'skin', key: 'lavender', t: 'скин «Лаванда»' },
  { lv: 25, kind: 'bonus', t: '+25 билетиков' }
];

const FRAMES = {
  bronze: { n: 'Бронза', c: '#c98a4b', c2: '#8a5a2b' },
  silver: { n: 'Серебро', c: '#c9d3dd', c2: '#8d9aa8' },
  gold: { n: 'Золото', c: '#ffcf4d', c2: '#c99a1f' },
  neon: { n: 'Неон', c: '#4dd4ff', c2: '#c6ff3d' },
  legend: { n: 'Легенда', c: '#c9a4ff', c2: '#ff6f9c' }
};

/* билетики за уровень: базовая ставка + бонус на вехах */
function levelBonusTickets(level) {
  if (level % 25 === 0) return 25;
  if (level % 10 === 0) return 10;
  if (level % 5 === 0) return 5;
  return 0;
}

function rewardsForLevel(level) {
  return LEVEL_REWARDS.filter(r => r.lv === level);
}

const LEVEL_TITLES = [
  [1, 'новичок'], [3, 'заглянул'], [5, 'постоянный'], [8, 'знаток'], [11, 'бывалый'],
  [14, 'мастер'], [18, 'легенда'], [25, 'свой человек']
];
function levelTitle(level) {
  let t = LEVEL_TITLES[0][1];
  for (const [lv, name] of LEVEL_TITLES) if (level >= lv) t = name;
  return t;
}

function addXP(n) {
  if (!n) return;
  P.xp += n;
  let ups = 0;
  while (P.xp >= xpNeed(P.level) && P.level < 99) {
    P.xp -= xpNeed(P.level);
    P.level++;
    ups++;
    levelReward(P.level);
  }
  if (ups) levelUpFx();
  touch();
}

function levelReward(level) {
  const t = levelTickets(level) + levelBonusTickets(level);
  grantTickets(t);
  const got = [];
  rewardsForLevel(level).forEach(r => {
    if (r.kind === 'skin') {
      if (SKINS[r.key] && !P.skins.includes(r.key)) { P.skins.push(r.key); got.push(r.t); }
    } else if (r.kind === 'frame') {
      if (FRAMES[r.key] && !P.frames.includes(r.key)) { P.frames.push(r.key); got.push(r.t); }
    } else if (r.kind === 'bonus') {
      const extra = parseInt(String(r.t).replace(/\D+/g, ''), 10) || 0;
      if (extra) { grantTickets(extra); got.push(r.t); }
    }
  });
  const extra = got.length ? ' · ' + got.join(' · ') : '';
  toast('уровень ' + level + ' · +' + t + ' билетика' + extra, 3600);
  showLevelReward(level, t, got);
}

/* Карточка «новый уровень»: видно, что именно дали и что будет дальше */
function showLevelReward(level, tickets, got) {
  if (typeof openModal !== 'function') return;
  const next = LEVEL_REWARDS.filter(r => r.lv > level).sort((a, b) => a.lv - b.lv)[0];
  openModal(`
    <div class="lvl-card">
      <div class="lvl-badge">${level}</div>
      <span class="modal-kicker">новый уровень</span>
      <h2>${levelTitle(level)}</h2>
      <div class="lvl-prizes">
        <div class="lvl-prize">
          <span class="lvl-prize-ico">${TICKET_SVG}</span>
          <b>+${tickets}</b>
          <span>билетиков</span>
        </div>
        ${got.map(g => `<div class="lvl-prize"><span class="lvl-prize-ico">★</span><b>${esc(g)}</b></div>`).join('')}
      </div>
      ${next ? `<p class="lvl-next">на ${next.lv} уровне — ${esc(next.t)}</p>` : '<p class="lvl-next">дальше только билетики и уважение</p>'}
      <div class="modal-actions">
        <button class="game-btn" id="lvl-ok">продолжить</button>
        <button class="game-btn secondary" id="lvl-prof">все награды</button>
      </div>
    </div>
  `, 'level-modal');
  const ok = document.getElementById('lvl-ok');
  const prof = document.getElementById('lvl-prof');
  if (ok) ok.onclick = closeModal;
  if (prof) prof.onclick = openProfile;
}

function levelUpFx() {
  confetti(150);
  document.body.classList.add('levelup');
  setTimeout(() => document.body.classList.remove('levelup'), 1400);
}

function grantTickets(n) {
  P.tickets += n;
  P.ticketsEarned += n;
}

/* ---------- события ---------- */
function sessionAdd() {
  if (!session.id) return;
  const now = Date.now();
  const sec = Math.min(600, Math.floor((now - session.start) / 1000));
  if (sec > 0) {
    session.start = now;
    P.daily.seconds += sec;
    P.stats.seconds += sec;
  }
}

function progressPlay(id) {
  const g = GAMES[id];
  if (!g) return;
  rollDay();
  sessionAdd();
  session.id = id;
  session.start = Date.now();

  P.daily.plays++;
  P.stats.plays++;
  const first = !P.unique.includes(id);
  if (first) { P.unique.push(id); P.daily.newgames++; }
  if (!P.daily.games.includes(id)) P.daily.games.push(id);

  const rec = P.games[id] || (P.games[id] = { plays: 0, lastAt: 0 });
  rec.plays++;
  const fresh = Date.now() - (rec.lastAt || 0) > 20 * 60 * 1000;
  rec.lastAt = Date.now();

  if (fresh) addXP(first ? 25 : 6);
  if (first && !g.hidden) toast('новая игра · +25 опыта', 2000);
  checkQuests();
  touch();
}

function progressRound() {
  const now = Date.now();
  if (progressRound._last && now - progressRound._last < 2500) return;
  progressRound._last = now;
  rollDay();
  sessionAdd();
  P.daily.rounds++;
  P.stats.rounds++;
  addXP(12);
  checkQuests();
  touch();
}

function progressJunk() {
  rollDay();
  P.daily.drops++;
  P.stats.drops++;
  addXP(4);
  checkQuests();
  touch();
}

function progressLeave() {
  sessionAdd();
  /* долгая сессия в игре без оверлеев тоже считается раундом */
  if (session.id && session.start && Date.now() - session.start > 45000) progressRound();
  session.id = null;
  touch();
}

function touch() {
  saveState();
  renderHUD();
  renderPanel();
}

/* ---------- квесты ---------- */
function questValue(ev) {
  switch (ev) {
    case 'rounds': return P.daily.rounds;
    case 'drops': return P.daily.drops;
    case 'newgames': return P.daily.newgames;
    case 'games': return P.daily.games.length;
    case 'seconds': return P.daily.seconds;
    case 'plays': return P.daily.plays;
    case 'unique': return P.unique.length;
    case 'level': return P.level;
    default: return 0;
  }
}

function dailyQuests() {
  const rnd = seeded(hashStr('daily-' + P.daily.date));
  const arr = DAILY_POOL.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr.slice(0, 3);
}

function checkQuests() {
  const ready = [];
  dailyQuests().forEach(q => {
    if (P.daily.claimed.includes(q.id) || P.daily.noted.includes(q.id)) return;
    if (questValue(q.ev) >= q.goal) {
      P.daily.noted.push(q.id);
      ready.push(q.t.toLowerCase());
    }
  });
  PATH.forEach(q => {
    if (P.pathClaimed.includes(q.id) || P.daily.noted.includes(q.id)) return;
    if (questValue(q.ev) >= q.goal) {
      P.daily.noted.push(q.id);
      ready.push(q.t.toLowerCase());
    }
  });
  if (ready.length) toast('задание готово: ' + ready[0], 2600);
}

function claimDaily(id) {
  const q = dailyQuests().find(x => x.id === id);
  if (!q || P.daily.claimed.includes(id)) return;
  if (questValue(q.ev) < q.goal) return;
  P.daily.claimed.push(id);
  grantTickets(q.r);
  toast('+' + q.r + ' билетика', 2200);
  saveState();
  renderHUD();
  renderPanel();
  openQuests();
}

function claimPath(id) {
  const q = PATH.find(x => x.id === id);
  if (!q || P.pathClaimed.includes(id)) return;
  if (questValue(q.ev) < q.goal) return;
  P.pathClaimed.push(id);
  grantTickets(q.r);
  toast('+' + q.r + ' билетика', 2200);
  saveState();
  renderHUD();
  renderPanel();
  openQuests();
}

/* ---------- скины и темы ---------- */
function applySkin() {
  const s = SKINS[P.skin] || SKINS.emerald;
  const r = document.documentElement.style;
  r.setProperty('--accent', s.c);
  r.setProperty('--accent2', s.c2);
  document.body.dataset.skin = P.skin;
  document.documentElement.dataset.skin = P.skin;
}

function setSkin(key) {
  if (!P.skins.includes(key)) return;
  P.skin = key;
  applySkin();
  saveState();
  openShop();
}

/* Рамка профиля: цветное кольцо вокруг аватара в шапке */
function applyFrame() {
  const f = FRAMES[P.frame];
  const r = document.documentElement.style;
  if (f) {
    r.setProperty('--frame', f.c);
    r.setProperty('--frame2', f.c2);
    document.documentElement.dataset.frame = P.frame;
  } else {
    r.removeProperty('--frame');
    r.removeProperty('--frame2');
    delete document.documentElement.dataset.frame;
  }
}

function setFrame(key) {
  if (!P.frames.includes(key)) return;
  P.frame = key;
  applyFrame();
  saveState();
  openProfile();
}

function buySkin(key) {
  const s = SKINS[key];
  if (!s) return;
  if (P.skins.includes(key)) { setSkin(key); return; }
  if (P.tickets < s.price) {
    toast('не хватает ' + (s.price - P.tickets) + ' билетика', 2400);
    return;
  }
  P.tickets -= s.price;
  P.skins.push(key);
  P.skin = key;
  applySkin();
  saveState();
  confetti(80);
  toast('скин «' + s.n + '» открыт', 2400);
  renderHUD();
  renderPanel();
  openShop();
}

function setTheme(name) {
  if (!THEMES.some(t => t.id === name)) return;
  if (P.theme === name) return;
  /* Вуаль закрывает экран, под ней меняем палитру и перерисовываем обложки,
     затем открываем. Один opacity-transition вместо transition на каждом
     элементе страницы — именно это давало лаги при смене оформления. */
  const veil = document.getElementById('theme-veil');
  const apply = () => {
    P.theme = name;
    document.documentElement.dataset.theme = name;
    renderThemeSwitch();
    if (typeof hideTip === 'function') hideTip();
    if (typeof refreshCovers === 'function') refreshCovers();
    saveState();
  };
  if (!veil) { apply(); return; }
  if (themeSwitch.busy) return;
  themeSwitch.busy = true;
  veil.classList.add('on');
  setTimeout(() => {
    apply();
    /* кадр на «прогретую» палитру, иначе открытие вуальи покажет старый фон */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      veil.classList.remove('on');
      setTimeout(() => { themeSwitch.busy = false; }, 200);
    }));
  }, 170);
}

const themeSwitch = { busy: false };

function renderThemeSwitch() {
  $$('.theme-btn').forEach(b => {
    const on = b.dataset.theme === P.theme;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* ---------- отрисовка HUD ---------- */
function renderHUD() {
  if (!P) return;
  const need = xpNeed(P.level);
  const pct = Math.max(0, Math.min(100, P.xp / need * 100));
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('hud-lvl', P.level);
  set('hud-tickets-num', P.tickets);
  set('hud-xp-label', levelTitle(P.level));
  set('pp-level', P.level);
  const ring = document.getElementById('hud-ring');
  if (ring) ring.style.strokeDashoffset = (RING_LEN * (1 - pct / 100)).toFixed(2);

  let ready = 0;
  dailyQuests().forEach(q => {
    if (!P.daily.claimed.includes(q.id) && questValue(q.ev) >= q.goal) ready++;
  });
  PATH.forEach(q => {
    if (!P.pathClaimed.includes(q.id) && questValue(q.ev) >= q.goal) ready++;
  });
  const badge = document.getElementById('hud-quests-badge');
  if (badge) {
    badge.textContent = ready;
    badge.hidden = ready === 0;
  }
  document.body.dataset.level = String(P.level);
}

function renderPanel() {
  if (!P) return;
  const need = xpNeed(P.level);
  const pct = Math.max(0, Math.min(100, P.xp / need * 100));
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('pp-level', P.level);
  set('pp-xp-text', P.xp + ' / ' + need + ' опыта');
  set('pp-tickets', P.tickets);
  set('pp-streak', P.streak || 0);
  const bar = document.getElementById('pp-xp-bar');
  if (bar) bar.style.width = pct.toFixed(1) + '%';
  const ring = document.getElementById('pp-ring-fill');
  if (ring) ring.style.strokeDashoffset = (RING_LEN * (1 - pct / 100)).toFixed(2);

  const box = document.getElementById('pp-quests');
  if (!box) return;
  box.innerHTML = dailyQuests().map(q => {
    const cur = Math.min(questValue(q.ev), q.goal);
    const done = P.daily.claimed.includes(q.id);
    const ready = !done && cur >= q.goal;
    const w = Math.round(cur / q.goal * 100);
    return `<div class="pp-quest${done ? ' done' : ''}${ready ? ' ready' : ''}" data-q="${q.id}">
      <div class="ppq-top">
        <span class="ppq-name">${esc(q.t)}</span>
        <span class="ppq-r">+${q.r}</span>
      </div>
      <div class="ppq-bar"><i style="width:${done ? 100 : w}%"></i></div>
      <div class="ppq-foot">
        <span>${done ? 'получено' : cur + ' / ' + q.goal}</span>
        ${ready ? '<button class="ppq-claim" data-claim="' + q.id + '">забрать</button>' : ''}
      </div>
    </div>`;
  }).join('');

  $$('#pp-quests .ppq-claim').forEach(b => {
    b.onclick = (e) => { e.stopPropagation(); claimDaily(b.dataset.claim); };
  });
}

/* ---------- модалка ---------- */
function openModal(html, cls) {
  const m = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  if (!m || !body) return;
  const wasOpen = m.classList.contains('open');
  body.innerHTML = html;
  m.className = 'modal open' + (cls ? ' ' + cls : '');
  document.body.classList.add('modal-open');
  const card = m.querySelector('.modal-card');
  if (card) {
    card.scrollTop = 0;
    /* 3D-въезд проигрывается заново и при смене содержимого */
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
  }
  if (!wasOpen && typeof SFX !== 'undefined') SFX.open();
}
function closeModal() {
  const m = document.getElementById('modal');
  if (!m || !m.classList.contains('open') || m.classList.contains('closing')) return;
  m.classList.add('closing');
  document.body.classList.remove('modal-open');
  if (typeof SFX !== 'undefined') SFX.close();
  setTimeout(() => {
    if (m.classList.contains('closing')) m.className = 'modal';
  }, 260);
}
function bindModal() {
  const m = document.getElementById('modal');
  if (!m) return;
  m.addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  const c = document.getElementById('modal-close');
  if (c) c.onclick = closeModal;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && m.classList.contains('open')) closeModal();
  });
}

/* ---------- профиль ---------- */
function openProfile() {
  const need = xpNeed(P.level);
  const pct = Math.round(P.xp / need * 100);
  const mins = Math.round(P.stats.seconds / 60);
  const next = LEVEL_REWARDS.filter(r => r.lv > P.level).sort((a, b) => a.lv - b.lv)[0];
  const frame = FRAMES[P.frame];
  const rewards = LEVEL_REWARDS.map(r => {
    const done = r.lv <= P.level;
    const near = r.lv === P.level + 1;
    return `<div class="lvl-row${done ? ' done' : ''}${near ? ' near' : ''}">
      <span class="lvl-row-lv">${r.lv}</span>
      <span class="lvl-row-t">${esc(r.t)}</span>
      <span class="lvl-row-s">${done ? 'получено' : near ? 'следующий' : 'закрыто'}</span>
    </div>`;
  }).join('');
  openModal(`
    <div class="modal-head">
      <span class="modal-kicker">профиль</span>
      <h2>Уровень ${P.level}</h2>
      <p>Опыт капается за раунды и новые игры. Уровень не сгорает.</p>
    </div>
    <div class="prof-level${frame ? ' has-frame' : ''}" style="${frame ? `--fr:${frame.c};--fr2:${frame.c2}` : ''}">
      <div class="prof-ring">
        <svg viewBox="0 0 40 40">
          <circle class="ring-bg" cx="20" cy="20" r="16"/>
          <circle class="ring-fill" id="prof-ring-fill" cx="20" cy="20" r="16"
            style="stroke-dashoffset:${(RING_LEN * (1 - pct / 100)).toFixed(2)}"/>
        </svg>
        <b>${P.level}</b>
      </div>
      <div class="prof-meta">
        <div class="prof-xp">${P.xp} / ${need} опыта</div>
        <div class="prof-bar"><i style="width:${pct}%"></i></div>
        <div class="prof-hint">${frame ? 'рамка «' + frame.n + '»' : 'рамка откроется на 3 уровне'}</div>
      </div>
    </div>
    <div class="prof-grid">
      <div><b>${P.unique.length}</b><span>игр открыто</span></div>
      <div><b>${P.stats.rounds}</b><span>раундов</span></div>
      <div><b>${P.stats.drops}</b><span>дропов</span></div>
      <div><b>${mins}</b><span>минут в играх</span></div>
      <div><b>${P.streak || 0}</b><span>дней подряд</span></div>
      <div><b>${P.ticketsEarned}</b><span>билетиков всего</span></div>
    </div>
    <div class="prof-rewards">
      <span class="help-label">награды за уровни</span>
      <p class="prof-next">${next ? 'следующий приз на ' + next.lv + ' уровне — ' + esc(next.t) : 'все вехи пройдены, дальше билетики за каждый уровень'}</p>
      <div class="lvl-list">${rewards}</div>
    </div>
    <div class="modal-actions">
      <button class="game-btn" id="prof-quests">квесты</button>
      <button class="game-btn secondary" id="prof-shop">скины</button>
    </div>
  `, 'profile-modal');
  const q = document.getElementById('prof-quests');
  const s = document.getElementById('prof-shop');
  if (q) q.onclick = openQuests;
  if (s) s.onclick = openShop;
}

/* ---------- квесты ---------- */
function questRow(q, claimed, kind) {
  const cur = Math.min(questValue(q.ev), q.goal);
  const ready = !claimed && cur >= q.goal;
  const w = Math.round(cur / q.goal * 100);
  const fmt = (v) => q.ev === 'seconds' ? Math.floor(v / 60) + ' мин' : String(v);
  return `<div class="quest${claimed ? ' done' : ''}${ready ? ' ready' : ''}">
    <div class="quest-ico">${ready ? '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l6 6 12-14"/></svg>' : TICKET_SVG}</div>
    <div class="quest-body">
      <div class="quest-name">${esc(q.t)}</div>
      <div class="quest-bar"><i style="width:${claimed ? 100 : w}%"></i></div>
      <div class="quest-foot"><span>${claimed ? 'получено' : fmt(cur) + ' / ' + fmt(q.goal)}</span><span class="quest-r">+${q.r}</span></div>
    </div>
    <button class="quest-btn${ready ? ' on' : ''}" data-claim="${q.id}" data-kind="${kind}" ${ready ? '' : 'disabled'}>
      ${claimed ? '✓' : ready ? 'забрать' : '…'}
    </button>
  </div>`;
}

function openQuests() {
  const daily = dailyQuests().map(q => questRow(q, P.daily.claimed.includes(q.id), 'daily')).join('');
  const path = PATH.map(q => questRow(q, P.pathClaimed.includes(q.id), 'path')).join('');
  openModal(`
    <div class="modal-head">
      <span class="modal-kicker">задания</span>
      <h2>Квесты</h2>
      <p>Три задания обновляются каждый день. «Путь» — надолго, его не сбросить.</p>
    </div>
    <div class="tickets-line">${TICKET_SVG}<b>${P.tickets}</b><span>билетиков</span></div>
    <h3 class="modal-sub">сегодня</h3>
    <div class="quest-list">${daily}</div>
    <h3 class="modal-sub">путь</h3>
    <div class="quest-list">${path}</div>
    <div class="modal-actions">
      <button class="game-btn" id="q-shop">магазин скинов</button>
      <button class="game-btn secondary" id="q-close">закрыть</button>
    </div>
  `, 'quests-modal');
  $$('#modal-body .quest-btn').forEach(b => {
    b.onclick = () => {
      if (b.dataset.kind === 'daily') claimDaily(b.dataset.claim);
      else claimPath(b.dataset.claim);
    };
  });
  const s = document.getElementById('q-shop');
  const c = document.getElementById('q-close');
  if (s) s.onclick = openShop;
  if (c) c.onclick = closeModal;
}

/* ---------- магазин ---------- */
function openShop() {
  const cards = Object.keys(SKINS).map(k => {
    const s = SKINS[k];
    const owned = P.skins.includes(k);
    const active = P.skin === k;
    let btn;
    if (active) btn = '<button class="skin-btn on" disabled>выбран</button>';
    else if (owned) btn = `<button class="skin-btn" data-pick="${k}">выбрать</button>`;
    else btn = `<button class="skin-btn buy" data-buy="${k}" ${P.tickets < s.price ? 'disabled' : ''}>${TICKET_SVG}<b>${s.price}</b></button>`;
    return `<div class="skin${active ? ' active' : ''}${owned ? ' owned' : ''}">
      <div class="skin-swatch" style="--a:${s.c};--b:${s.c2}">
        <i></i><i></i><i></i>
      </div>
      <div class="skin-meta">
        <b>${s.n}</b>
        <span>${owned ? s.note : 'закрыт'}</span>
      </div>
      ${btn}
    </div>`;
  }).join('');

  const frameCards = Object.keys(FRAMES).map(k => {
    const f = FRAMES[k];
    const owned = P.frames.includes(k);
    const active = P.frame === k;
    const lv = (LEVEL_REWARDS.find(r => r.kind === 'frame' && r.key === k) || {}).lv;
    let btn;
    if (active) btn = '<button class="skin-btn on" disabled>выбрана</button>';
    else if (owned) btn = `<button class="skin-btn" data-frame="${k}">выбрать</button>`;
    else btn = `<button class="skin-btn" disabled>${lv ? 'с ' + lv + ' ур.' : 'закрыта'}</button>`;
    return `<div class="skin${active ? ' active' : ''}${owned ? ' owned' : ''}">
      <div class="skin-swatch frame-swatch" style="--a:${f.c};--b:${f.c2}">
        <i></i>
      </div>
      <div class="skin-meta">
        <b>${f.n}</b>
        <span>${owned ? 'рамка профиля' : lv ? 'за уровень ' + lv : 'закрыта'}</span>
      </div>
      ${btn}
    </div>`;
  }).join('');

  openModal(`
    <div class="modal-head">
      <span class="modal-kicker">магазин</span>
      <h2>Скины и рамки</h2>
      <p>Скины меняют акцент сайта, рамки — кольцо вокруг уровня. Работают в обоих оформлениях.</p>
    </div>
    <div class="tickets-line">${TICKET_SVG}<b>${P.tickets}</b><span>билетиков</span></div>
    <h3 class="modal-sub">скины</h3>
    <div class="skin-grid">${cards}</div>
    <h3 class="modal-sub">рамки</h3>
    <div class="skin-grid">${frameCards}</div>
    <p class="shop-note">Билетики дают за уровни и квесты. Скины и рамки за уровни открываются сами.</p>
    <div class="modal-actions">
      <button class="game-btn" id="shop-quests">квесты</button>
      <button class="game-btn secondary" id="shop-close">закрыть</button>
    </div>
    <button class="reset-link" id="shop-reset">сбросить прогресс</button>
  `, 'shop-modal');

  document.querySelectorAll('#modal-body [data-pick]').forEach(b => b.onclick = () => setSkin(b.dataset.pick));
  document.querySelectorAll('#modal-body [data-buy]').forEach(b => b.onclick = () => buySkin(b.dataset.buy));
  document.querySelectorAll('#modal-body [data-frame]').forEach(b => b.onclick = () => setFrame(b.dataset.frame));
  const q = document.getElementById('shop-quests');
  const c = document.getElementById('shop-close');
  if (q) q.onclick = openQuests;
  if (c) c.onclick = closeModal;
  const r = document.getElementById('shop-reset');
  if (r) r.onclick = () => {
    if (!confirm('Сбросить весь прогресс: уровни, билетики, скины?')) return;
    P = defaultState();
    applySkin();
    applyFrame();
    document.documentElement.dataset.theme = P.theme;
    renderThemeSwitch();
    saveState();
    renderHUD();
    renderPanel();
    closeModal();
    toast('прогресс сброшен', 2400);
  };
}

/* ---------- помощь ---------- */
function openHelp(id) {
  const g = GAMES[id];
  if (!g) return;
  const help = gameHelp(id);
  openModal(`
    <div class="modal-head">
      <span class="modal-kicker">${esc(g.cat)}</span>
      <h2>${esc(g.name)}</h2>
      <p>${esc(g.desc || '')}</p>
    </div>
    <div class="help-block">
      <span class="help-label">что делать</span>
      <p>${esc(help.h)}</p>
    </div>
    <div class="help-block">
      <span class="help-label">управление</span>
      <p>${esc(help.k)}</p>
    </div>
    <div class="help-block tip">
      <span class="help-label">совет</span>
      <p>${esc(help.t)}</p>
    </div>
    <div class="modal-actions">
      <button class="game-btn" id="help-play">играть</button>
      <button class="game-btn secondary" id="help-ok">понятно</button>
    </div>
  `, 'help-modal');
  const play = document.getElementById('help-play');
  const ok = document.getElementById('help-ok');
  if (play) play.onclick = () => { closeModal(); openGame(id); };
  if (ok) ok.onclick = closeModal;
}

/* ---------- обучение ---------- */
const ONB = [
  {
    icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="10" height="18" rx="2"/><rect x="18" y="7" width="10" height="18" rx="2"/><path d="M8 12h2M22 12h2"/></svg>',
    title: '76 игр, одна вкладка',
    text: 'Выбирай карточку и играй сразу. Ничего скачивать и регистрировать не нужно. Всё работает и на телефоне.'
  },
  {
    icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4l3.6 8.2 8.9.8-6.7 6 2 8.7-7.8-4.6-7.8 4.6 2-8.7-6.7-6 8.9-.8z"/></svg>',
    title: 'Опыт и уровни',
    text: 'Каждый раунд даёт опыт. Новый уровень приносит билетики, а некоторые уровни — скины. Уровень не сгорает.'
  },
  {
    icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v3a4 4 0 0 0 0 8v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a4 4 0 0 0 0-8z"/><path d="M16 8v3M16 15v2M16 20v4"/></svg>',
    title: 'Квесты и билетики',
    text: 'Три задания каждый день. Выполнил — забрал билетики. Билетики тратятся в магазине скинов.'
  },
  {
    icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="11"/><circle cx="11" cy="12" r="1.6" fill="currentColor"/><circle cx="21" cy="12" r="1.6" fill="currentColor"/><circle cx="11" cy="20" r="1.6" fill="currentColor"/><circle cx="21" cy="20" r="1.6" fill="currentColor"/></svg>',
    title: 'Два оформления',
    text: 'Современный — тёмный и тихий, детский — яркий и крупный. Переключаются кнопкой в шапке или в настройках. Внутри каждой темы работают любые скины.'
  }
];

function openOnboarding() {
  onbStep = 0;
  renderOnb();
}

function renderOnb() {
  const s = ONB[onbStep];
  const last = onbStep === ONB.length - 1;
  const dots = ONB.map((_, i) => `<i class="${i === onbStep ? 'on' : ''}"></i>`).join('');
  openModal(`
    <div class="onb">
      <div class="onb-art">${s.icon}</div>
      <span class="modal-kicker">знакомство · ${onbStep + 1} из ${ONB.length}</span>
      <h2>${s.title}</h2>
      <p>${s.text}</p>
      <div class="onb-dots">${dots}</div>
      <div class="modal-actions">
        ${onbStep > 0 ? '<button class="game-btn secondary" id="onb-back">назад</button>' : ''}
        <button class="game-btn" id="onb-next">${last ? 'начать играть' : 'дальше'}</button>
      </div>
      <button class="onb-skip" id="onb-skip">пропустить обучение</button>
    </div>
  `, 'onb-modal');
  const next = document.getElementById('onb-next');
  const back = document.getElementById('onb-back');
  const skip = document.getElementById('onb-skip');
  if (next) next.onclick = () => {
    if (last) finishOnboarding();
    else { onbStep++; renderOnb(); }
  };
  if (back) back.onclick = () => { onbStep = Math.max(0, onbStep - 1); renderOnb(); };
  if (skip) skip.onclick = finishOnboarding;
}

function finishOnboarding() {
  P.onboarded = true;
  if (!P.welcomed) {
    P.welcomed = true;
    grantTickets(3);
    toast('добро пожаловать · +3 билетика', 3200);
  }
  saveState();
  renderHUD();
  renderPanel();
  closeModal();
}

function maybeOnboarding() {
  if (P.onboarded) return;
  setTimeout(() => { if (!P.onboarded) openOnboarding(); }, 1100);
}

/* ---------- запуск ---------- */
function bindHud() {
  const bind = (id, fn) => { const e = document.getElementById(id); if (e) e.onclick = fn; };
  bind('hud-level', openProfile);
  bind('hud-tickets', openShop);
  bind('hud-quests', openQuests);
  bind('hud-settings', openSettings);
  bind('pp-shop-btn', openShop);
  bind('pp-all-quests', openQuests);
  bind('pp-profile', openProfile);
  bind('hud-onboard', openOnboarding);
  $$('.theme-btn').forEach(b => b.onclick = () => setTheme(b.dataset.theme));
}

function progressInit() {
  if (typeof loadSettings === 'function') { loadSettings(); applySettings(); }
  P = loadState();
  rollDay();
  applySkin();
  applyFrame();
  document.documentElement.dataset.theme = P.theme;
  bindHud();
  bindModal();
  renderThemeSwitch();
  renderHUD();
  renderPanel();
  setInterval(() => { if (session.id) { sessionAdd(); touch(); } }, 20000);
  maybeOnboarding();
  checkQuests();
}
