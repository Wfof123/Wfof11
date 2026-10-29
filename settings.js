/* ============================================================
   ЗВУК: короткие синтезированные сигналы без внешних файлов.
   WebAudio создаётся по первому жесту пользователя — иначе браузер
   блокирует автозапуск.
   ============================================================ */

const SFX = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;
  let volume = 0.5;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume * 0.35;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
    if (typeof MUSIC !== 'undefined' && MUSIC) MUSIC.unlock();
  }

  function tone({ freq = 440, type = 'sine', dur = 0.12, gain = 1, slide = 0, delay = 0 }) {
    if (!enabled) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.14, gain = 0.5, hp = 800, delay = 0 }) {
    if (!enabled) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = hp;
    const g = c.createGain(); g.gain.value = gain;
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(t0);
  }

  const api = {
    unlock,
    /* уже созданный контекст без побочного создания: до первого жеста
       браузер всё равно не даст звучать, а предупреждения в консоли лишние */
    get existing() { return ctx; },
    get on() { return enabled; },
    set on(v) { enabled = !!v; },
    get volume() { return volume; },
    set volume(v) { volume = Math.max(0, Math.min(1, v)); if (master) master.gain.value = volume * 0.35; },

    tap() { tone({ freq: 620, type: 'triangle', dur: 0.05, gain: 0.18 }); },
    click() { tone({ freq: 420, type: 'square', dur: 0.035, gain: 0.12 }); },
    /* мягкий тик при наведении — почти неслышный, но меню оживает */
    hover() { tone({ freq: 1180, type: 'sine', dur: 0.028, gain: 0.045 }); },
    /* переключение вкладки-фильтра */
    tab() { tone({ freq: 520, type: 'triangle', dur: 0.05, gain: 0.14, slide: 180 }); },
    /* набор в поиске */
    type() { tone({ freq: 1500, type: 'square', dur: 0.02, gain: 0.05 }); },
    /* открытие и закрытие модалки */
    open() { tone({ freq: 380, type: 'sine', dur: 0.12, gain: 0.14, slide: 260 }); noise({ dur: 0.09, gain: 0.05, hp: 2400 }); },
    close() { tone({ freq: 520, type: 'sine', dur: 0.11, gain: 0.12, slide: -240 }); },
    score() { tone({ freq: 660, type: 'sine', dur: 0.09, gain: 0.22 }); tone({ freq: 990, dur: 0.1, gain: 0.16, delay: 0.06 }); },
    good() { tone({ freq: 523, type: 'sine', dur: 0.1, gain: 0.2 }); tone({ freq: 784, dur: 0.12, gain: 0.18, delay: 0.07 }); tone({ freq: 1046, dur: 0.16, gain: 0.14, delay: 0.15 }); },
    bad() { tone({ freq: 220, type: 'sawtooth', dur: 0.16, gain: 0.2, slide: -110 }); },
    pop() { noise({ dur: 0.08, gain: 0.3, hp: 1200 }); tone({ freq: 900, type: 'sine', dur: 0.06, gain: 0.12, slide: 400 }); },
    flip() { noise({ dur: 0.12, gain: 0.18, hp: 2000 }); tone({ freq: 1200, type: 'triangle', dur: 0.08, gain: 0.1, slide: -500 }); },
    roll() { for (let i = 0; i < 4; i++) noise({ dur: 0.05, gain: 0.14, hp: 1600, delay: i * 0.05 }); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.2, delay: i * 0.09 }));
    },
    lose() {
      [392, 330, 262].forEach((f, i) =>
        tone({ freq: f, type: 'sine', dur: 0.2, gain: 0.18, delay: i * 0.11 }));
    },
    level() {
      [523, 659, 784, 1046, 1318].forEach((f, i) =>
        tone({ freq: f, type: 'triangle', dur: 0.16, gain: 0.22, delay: i * 0.07 }));
    },
    ticket() { tone({ freq: 880, type: 'square', dur: 0.07, gain: 0.14 }); tone({ freq: 1320, dur: 0.09, gain: 0.1, delay: 0.05 }); }
  };
  return api;
})();

/* ============================================================
   МУЗЫКА: зацикленный чиптюн-секвенсор, который играет только в меню.
   Никаких mp3 — всё синтезируется на лету, поэтому весит ноль байт.
   ============================================================ */
const MUSIC = (() => {
  const TEMPO = 100;
  const STEP = 60 / TEMPO / 2;          /* восьмая доля */
  const LEN = 32;

  const N = {
    A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
    A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
    A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
  };

  /* Am — F — C — G: четыре такта по восемь восьмых */
  const BASS = ['A2', 0, 'A2', 0, 'E3', 0, 'A2', 0,
                'F3', 0, 'F3', 0, 'C4', 0, 'F3', 0,
                'C3', 0, 'C3', 0, 'G3', 0, 'C3', 0,
                'G3', 0, 'G3', 0, 'D4', 0, 'G3', 0];

  const LEAD = ['A4', 0, 'C5', 'E5', 0, 'D5', 'C5', 0,
                'F4', 0, 'A4', 'C5', 0, 'A4', 'G4', 0,
                'E4', 0, 'G4', 'C5', 0, 'D5', 'C5', 0,
                'D4', 0, 'E4', 'G4', 0, 'E4', 'D4', 0];

  let gain = null;
  let timer = null;
  let step = 0;
  let nextTime = 0;
  let playing = false;
  let wantOn = false;
  let vol = 0.34;

  function ctx() {
    const c = SFX.existing;
    if (!c) return null;
    if (c.state === 'suspended') c.resume();
    return c;
  }

  function bus(c) {
    if (gain) return gain;
    gain = c.createGain();
    gain.gain.value = 0;
    gain.connect(c.destination);
    return gain;
  }

  function voice(c, freq, t, dur, type, level) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus(c));
    o.start(t); o.stop(t + dur + 0.03);
  }

  function hat(c, t) {
    const len = Math.floor(c.sampleRate * 0.04);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6200;
    const g = c.createGain(); g.gain.value = 0.05;
    src.connect(hp); hp.connect(g); g.connect(bus(c));
    src.start(t);
  }

  function schedule(i, t) {
    const c = ctx();
    if (!c) return;
    const bass = BASS[i];
    if (bass) voice(c, N[bass], t, STEP * 1.7, 'triangle', 0.16);

    const lead = LEAD[i];
    if (lead) {
      voice(c, N[lead], t, STEP * 0.9, 'square', 0.075);
      /* эхо на три шага позже — даёт ощущение пространства */
      voice(c, N[lead], t + STEP * 3, STEP * 0.8, 'sine', 0.028);
    }

    if (i % 2 === 1) hat(c, t);
    /* редкая искорка сверху, чтобы петля не приедалась */
    if (i === 6) voice(c, N.A5, t, STEP * 0.6, 'sine', 0.03);
    if (i === 22) voice(c, N.E5, t, STEP * 0.6, 'sine', 0.03);
  }

  function pump() {
    const c = ctx();
    if (!c) return;
    while (nextTime < c.currentTime + 0.22) {
      schedule(step, nextTime);
      nextTime += STEP;
      step = (step + 1) % LEN;
    }
  }

  function start() {
    wantOn = true;
    if (playing) return;
    const c = ctx();
    if (!c) return;
    if (c.state === 'suspended') { c.resume(); }
    bus(c);
    gain.gain.cancelScheduledValues(c.currentTime);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), c.currentTime);
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.9);
    nextTime = c.currentTime + 0.12;
    step = 0;
    playing = true;
    clearInterval(timer);
    timer = setInterval(pump, 45);
    pump();
  }

  function stop() {
    wantOn = false;
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    timer = null;
    const c = ctx();
    if (c && gain) {
      gain.gain.cancelScheduledValues(c.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.5);
    }
  }

  return {
    get playing() { return playing; },
    get volume() { return vol; },
    set volume(v) {
      vol = Math.max(0, Math.min(1, v)) * 0.55;
      const c = ctx();
      if (c && gain && playing) gain.gain.setTargetAtTime(vol, c.currentTime, 0.15);
    },
    start,
    stop,
    unlock() { if (wantOn && !playing) start(); },
    /* вызывается при входе/выходе из игры */
    sync(inGame) {
      if (inGame) stop();
      else if (typeof SET !== 'undefined' && SET.music) start();
      else stop();
    }
  };
})();

/* ============================================================
   НАСТРОЙКИ
   ============================================================ */
const SETTINGS_KEY = 'pg_settings_v1';
let SET = {
  sound: true,
  volume: 0.5,
  music: true,
  musicVol: 0.4,
  wide: true,
  anim: true,
  hints: true,
  reduceFx: false
};

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (s && typeof s === 'object') SET = Object.assign(SET, s);
  } catch (e) { }
  SFX.on = SET.sound;
  SFX.volume = SET.volume;
  MUSIC.volume = SET.musicVol;
  return SET;
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET)); } catch (e) { }
}

function inGameView() {
  const v = document.getElementById('game-view');
  return !!(v && v.classList.contains('active'));
}

function renderMusicBtn() {
  const b = document.getElementById('hud-music');
  if (!b) return;
  const on = !!SET.music;
  b.classList.toggle('off', !on);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.title = on ? 'Музыка включена' : 'Музыка выключена';
}

function applySettings() {
  document.body.classList.toggle('no-anim', !SET.anim || SET.reduceFx);
  SFX.on = SET.sound;
  SFX.volume = SET.volume;
  MUSIC.volume = SET.musicVol;
  renderMusicBtn();
  if (!inGameView()) MUSIC.sync(false);
}

/* ---------- звуки интерфейса ----------
   Один делегированный слушатель на весь документ: карточки и фильтры
   пересоздаются, навешивать на каждую заново — лишняя работа. */
let hoverAt = 0;
let typeAt = 0;

function bindUiSounds() {
  document.addEventListener('pointerover', (e) => {
    if (!SET.sound) return;
    const t = e.target.closest('.card,.chip,.nav-btn,.theme-btn,.hud-level,.hud-tickets,.ps-level,.ps-quests,.ps-tickets,.skin,.quest-btn,.game-btn,.set-row,.junk-item,.footer-dot,.back-btn,.game-help-btn');
    if (!t || t.contains(e.relatedTarget)) return;
    const now = performance.now();
    if (now - hoverAt < 80) return;
    hoverAt = now;
    SFX.hover();
  }, { passive: true });

  document.addEventListener('input', (e) => {
    if (!SET.sound || e.target.id !== 'search') return;
    const now = performance.now();
    if (now - typeAt < 55) return;
    typeAt = now;
    SFX.type();
  }, { passive: true });
}

/* ---------- модалка настроек ---------- */
function openSettings() {
  const row = (id, label, note, on) => `
    <label class="set-row" for="${id}">
      <span class="set-txt"><b>${label}</b><span>${note}</span></span>
      <span class="set-switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i></i></span>
    </label>`;

  openModal(`
    <div class="modal-head">
      <span class="modal-kicker">настройки</span>
      <h2>Как тебе удобнее</h2>
      <p>Всё сохраняется в этом браузере. Можно менять в любой момент.</p>
    </div>

    <div class="set-group">
      <span class="modal-sub">звук</span>
      ${row('set-sound', 'Звуки', 'клики, победы, кубики', SET.sound)}
      <label class="set-row" for="set-volume">
        <span class="set-txt"><b>Громкость звуков</b><span>${Math.round(SET.volume * 100)}%</span></span>
        <input class="set-range" type="range" id="set-volume" min="0" max="100" value="${Math.round(SET.volume * 100)}">
      </label>
      ${row('set-music', 'Музыка', 'чиптюн в меню, в играх тишина', SET.music)}
      <label class="set-row" for="set-music-vol">
        <span class="set-txt"><b>Громкость музыки</b><span>${Math.round(SET.musicVol * 100)}%</span></span>
        <input class="set-range" type="range" id="set-music-vol" min="0" max="100" value="${Math.round(SET.musicVol * 100)}">
      </label>
    </div>

    <div class="set-group">
      <span class="modal-sub">игра</span>
      ${row('set-wide', 'Широкий экран', 'игры открываются на весь экран', SET.wide)}
      ${row('set-anim', 'Анимации', '3D, конфетти, переходы', SET.anim)}
      ${row('set-hints', 'Подсказки «?»', 'тултипы на карточках', SET.hints)}
      ${row('set-reduce', 'Меньше эффектов', 'спокойный режим для глаз', SET.reduceFx)}
    </div>

    <div class="set-group">
      <span class="modal-sub">оформление</span>
      <div class="set-themes">
        ${THEMES.map(t => `<button class="set-theme${P.theme === t.id ? ' on' : ''}" data-set-theme="${t.id}">
          <b>${t.n}</b><span>${t.d}</span></button>`).join('')}
      </div>
    </div>

    <div class="modal-actions">
      <button class="game-btn" id="set-close">готово</button>
    </div>
    <button class="reset-link" id="set-reset">сбросить прогресс</button>
  `, 'settings-modal');

  const snd = document.getElementById('set-sound');
  const vol = document.getElementById('set-volume');
  const mus = document.getElementById('set-music');
  const mvol = document.getElementById('set-music-vol');
  const wide = document.getElementById('set-wide');
  const anim = document.getElementById('set-anim');
  const hints = document.getElementById('set-hints');
  const reduce = document.getElementById('set-reduce');

  if (snd) snd.onchange = () => {
    SET.sound = snd.checked; SFX.unlock(); SFX.on = SET.sound;
    if (SET.sound) SFX.good();
    saveSettings(); applySettings();
  };
  if (vol) vol.oninput = () => {
    SET.volume = vol.value / 100;
    SFX.volume = SET.volume;
    const lab = vol.parentElement.querySelector('.set-txt span');
    if (lab) lab.textContent = Math.round(SET.volume * 100) + '%';
    saveSettings();
  };
  if (vol) vol.onchange = () => { SFX.tap(); };
  if (mus) mus.onchange = () => {
    SET.music = mus.checked;
    saveSettings(); applySettings();
    if (SET.music) SFX.tab(); else SFX.close();
  };
  if (mvol) mvol.oninput = () => {
    SET.musicVol = mvol.value / 100;
    MUSIC.volume = SET.musicVol;
    const lab = mvol.parentElement.querySelector('.set-txt span');
    if (lab) lab.textContent = Math.round(SET.musicVol * 100) + '%';
    saveSettings();
  };
  if (wide) wide.onchange = () => { SET.wide = wide.checked; saveSettings(); };
  if (anim) anim.onchange = () => { SET.anim = anim.checked; saveSettings(); applySettings(); };
  if (hints) hints.onchange = () => { SET.hints = hints.checked; saveSettings(); };
  if (reduce) reduce.onchange = () => { SET.reduceFx = reduce.checked; saveSettings(); applySettings(); };

  $$('#modal-body [data-set-theme]').forEach(b => {
    b.onclick = () => { setTheme(b.dataset.setTheme); openSettings(); };
  });

  const c = document.getElementById('set-close');
  if (c) c.onclick = closeModal;
  const r = document.getElementById('set-reset');
  if (r) r.onclick = () => {
    if (!confirm('Сбросить весь прогресс: уровни, билетики, скины?')) return;
    P = defaultState();
    applySkin();
    document.documentElement.dataset.theme = P.theme;
    renderThemeSwitch();
    saveState(); renderHUD(); renderPanel();
    closeModal();
    toast('прогресс сброшен', 2400);
  };
}

/* ---------- кнопка музыки в шапке ---------- */
(function bindMusicBtn() {
  const b = document.getElementById('hud-music');
  if (!b) return;
  b.onclick = () => {
    SET.music = !SET.music;
    saveSettings();
    applySettings();
    if (SET.music) { SFX.unlock(); SFX.tab(); }
    else { SFX.close(); toast('музыка выключена', 1600); }
  };
  renderMusicBtn();
})();

/* Первый жест пользователя разблокирует WebAudio и запускает музыку. */
(function firstGesture() {
  const kick = () => {
    SFX.unlock();
    if (SET.music && !inGameView()) MUSIC.start();
    removeEventListener('pointerdown', kick);
    removeEventListener('keydown', kick);
  };
  addEventListener('pointerdown', kick, { once: true });
  addEventListener('keydown', kick, { once: true });
})();

bindUiSounds();
