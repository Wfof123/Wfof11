/* ============================================================
   ЯДРО: реестр игр, роутинг, общие утилиты, пасхалки
   ============================================================ */

const GAMES = {};
const GAME_ORDER = [];

let currentGame = null;

function reg(id, meta, mount) {
  GAMES[id] = Object.assign({ id }, meta, { mount });
  GAME_ORDER.push(id);
}

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Векторные фигуры вместо эмодзи ---------- */
const SHAPES = {
  circle: '<circle cx="16" cy="16" r="11"/>',
  ring: '<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="4.5"/>',
  square: '<rect x="6" y="6" width="20" height="20" rx="3"/>',
  squareOpen: '<rect x="6.5" y="6.5" width="19" height="19" rx="3"/>',
  triangle: '<path d="M16 5l11 20H5z"/>',
  triangleOpen: '<path d="M16 6.5l9.5 18h-19z"/>',
  diamond: '<path d="M16 4l12 12-12 12L4 16z"/>',
  diamondOpen: '<path d="M16 6l10 10-10 10L6 16z"/>',
  star: '<path d="M16 4l3.6 8.2 8.9.8-6.7 6 2 8.7-7.8-4.6-7.8 4.6 2-8.7-6.7-6 8.9-.8z"/>',
  starOpen: '<path d="M16 5.5l3.2 7.3 7.9.7-6 5.3 1.8 7.7-6.9-4.1-6.9 4.1 1.8-7.7-6-5.3 7.9-.7z"/>',
  plus: '<path d="M16 6v20M6 16h20"/>',
  cross: '<path d="M8 8l16 16M24 8L8 24"/>',
  heart: '<path d="M16 27S5 20.5 5 13.8A6.3 6.3 0 0 1 16 9.5 6.3 6.3 0 0 1 27 13.8C27 20.5 16 27 16 27z"/>',
  heartOpen: '<path d="M16 25.5S6 19.4 6 13.8a5.6 5.6 0 0 1 10-3.2 5.6 5.6 0 0 1 10 3.2c0 5.6-10 11.7-10 11.7z"/>',
  hex: '<path d="M16 4l10 6v12l-10 6-10-6V10z"/>',
  hexOpen: '<path d="M16 6l8.5 5v10L16 26l-8.5-5V11z"/>',
  moon: '<path d="M20 5a12 12 0 1 0 7 21A13 13 0 0 1 20 5z"/>',
  sun: '<circle cx="16" cy="16" r="7"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3"/>',
  bolt: '<path d="M18 4L8 18h6l-2 10 12-15h-7z"/>',
  drop: '<path d="M16 4c6 8 9 11 9 15a9 9 0 0 1-18 0c0-4 3-7 9-15z"/>',
  leaf: '<path d="M6 26C6 14 13 7 26 6c1 13-6 20-20 20z"/><path d="M6 26l12-12"/>',
  flower: '<circle cx="16" cy="16" r="4"/><path d="M16 12V6M16 20v6M12 16H6M20 16h6M10.5 10.5L7 7M21.5 21.5L25 25M21.5 10.5L25 7M10.5 21.5L7 25"/>'
};
const SHAPE_KEYS = Object.keys(SHAPES);

/* Уникальная фигура для пары «одинаковые карточки» */
function shapeSVG(key, color) {
  const body = SHAPES[key] || SHAPES.circle;
  return `<svg viewBox="0 0 32 32" fill="none" stroke="${color || 'currentColor'}"
    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
    style="width:100%;height:100%;max-width:60%;max-height:60%">${body}</svg>`;
}

/* ---------- Иконки игрового контента (вместо эмодзи) ---------- */
const ICONS = {
  /* кости */
  d1: '<rect x="5" y="5" width="22" height="22" rx="5"/><circle cx="16" cy="16" r="2.2" fill="currentColor"/>',
  d2: '<rect x="5" y="5" width="22" height="22" rx="5"/><circle cx="11" cy="11" r="2.2" fill="currentColor"/><circle cx="21" cy="21" r="2.2" fill="currentColor"/>',
  d3: '<rect x="5" y="5" width="22" height="22" rx="5"/><circle cx="11" cy="11" r="2.2" fill="currentColor"/><circle cx="16" cy="16" r="2.2" fill="currentColor"/><circle cx="21" cy="21" r="2.2" fill="currentColor"/>',
  d4: '<rect x="5" y="5" width="22" height="22" rx="5"/><circle cx="11" cy="11" r="2.2" fill="currentColor"/><circle cx="21" cy="11" r="2.2" fill="currentColor"/><circle cx="11" cy="21" r="2.2" fill="currentColor"/><circle cx="21" cy="21" r="2.2" fill="currentColor"/>',
  d5: '<rect x="5" y="5" width="22" height="22" rx="5"/><circle cx="11" cy="11" r="2.2" fill="currentColor"/><circle cx="21" cy="11" r="2.2" fill="currentColor"/><circle cx="16" cy="16" r="2.2" fill="currentColor"/><circle cx="11" cy="21" r="2.2" fill="currentColor"/><circle cx="21" cy="21" r="2.2" fill="currentColor"/>',
  d6: '<rect x="5" y="5" width="22" height="22" rx="5"/><circle cx="11" cy="10" r="2.2" fill="currentColor"/><circle cx="21" cy="10" r="2.2" fill="currentColor"/><circle cx="11" cy="16" r="2.2" fill="currentColor"/><circle cx="21" cy="16" r="2.2" fill="currentColor"/><circle cx="11" cy="22" r="2.2" fill="currentColor"/><circle cx="21" cy="22" r="2.2" fill="currentColor"/>',

  /* монеты */
  heads: '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6"/><path d="M16 12v8"/>',
  tails: '<circle cx="16" cy="16" r="11"/><path d="M11 16l5-5 5 5-5 5z"/>',

  /* слоты */
  cherry: '<circle cx="11" cy="21" r="5"/><circle cx="21" cy="21" r="5"/><path d="M11 16c0-6 3-9 7-10M21 16c0-4-1-7-3-9"/>',
  lemon: '<ellipse cx="16" cy="17" rx="9" ry="11"/><path d="M16 6v4M11 8l2 3M21 8l-2 3"/>',
  bell: '<path d="M9 21V15a7 7 0 0 1 14 0v6z"/><path d="M7 21h18M14 25h4"/>',
  gem: '<path d="M9 6h14l5 8-12 14L4 14z"/><path d="M9 6l7 8 7-8M4 14h24"/>',
  clover: '<path d="M16 16a4 4 0 1 1 4-4 4 4 0 1 1 0 8 4 4 0 1 1-4 4 4 4 0 1 1-8 0 4 4 0 1 1 0-8 4 4 0 1 1 4-4z"/><path d="M16 16v9"/>',

  /* RPS */
  rock: '<path d="M7 20l3-9 6-3 7 4 2 8-6 5-8-1z"/><path d="M10 11l5 4 5-3"/>',
  paper: '<rect x="7" y="5" width="18" height="22" rx="2"/><path d="M11 11h10M11 16h10M11 21h6"/>',
  scissors: '<circle cx="9" cy="22" r="3.2"/><circle cx="21" cy="22" r="3.2"/><path d="M11 20L22 6M21 20L10 6"/>',

  /* прочее */
  fire: '<path d="M16 4c5 7 9 9 9 15a9 9 0 0 1-18 0c0-4 3-7 5-10 1 3 2 4 4 2 1-2 0-5 0-7z"/>',
  warm: '<circle cx="16" cy="16" r="10"/><path d="M16 21v-5l3 3"/>',
  cold: '<path d="M16 4v24M6 10l20 12M26 10L6 22"/>',
  check: '<path d="M7 17l6 6 12-14"/>',
  cat: '<path d="M9 12L8 6l5 3h6l5-3-1 6v6a7 7 0 0 1-14 0z"/><circle cx="13" cy="14" r="1.4" fill="currentColor"/><circle cx="19" cy="14" r="1.4" fill="currentColor"/>',
  paw: '<ellipse cx="16" cy="20" rx="6" ry="5"/><circle cx="9" cy="13" r="2.4"/><circle cx="14" cy="9" r="2.4"/><circle cx="20" cy="10" r="2.4"/><circle cx="24" cy="14" r="2.2"/>',
  target: '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="1.8" fill="currentColor"/>',
  trophy: '<path d="M10 5h12v7a6 6 0 0 1-12 0z"/><path d="M10 7H6v2a4 4 0 0 0 4 4M22 7h4v2a4 4 0 0 1-4 4"/><path d="M16 18v5M11 27h10"/>',
  timer: '<circle cx="16" cy="17" r="10"/><path d="M16 11v6l4 3M12 4h8"/>',
  skull: '<path d="M8 14a8 8 0 1 1 16 0c0 4-2 5-2 7h-12c0-2-2-3-2-7z"/><circle cx="13" cy="14" r="1.8" fill="currentColor"/><circle cx="19" cy="14" r="1.8" fill="currentColor"/><path d="M13 21v4M19 21v4"/>',
  bolt: '<path d="M18 4L8 18h6l-2 10 12-15h-7z"/>',
  money: '<rect x="3" y="9" width="26" height="14" rx="3"/><circle cx="16" cy="16" r="4"/><path d="M8 16h.01M24 16h.01"/>',
  wave: '<path d="M4 20c4 0 4-8 8-8s4 8 8 8 4-8 8-8"/>',
  star: '<path d="M16 4l3.6 8.2 8.9.8-6.7 6 2 8.7-7.8-4.6-7.8 4.6 2-8.7-6.7-6 8.9-.8z"/>',
  sparkle: '<path d="M16 4v10M16 22v6M4 16h10M22 16h6M8 8l5 5M19 19l5 5M24 8l-5 5M13 19l-5 5"/>',
  mask: '<path d="M6 12c0-4 4-6 10-6s10 2 10 6-4 12-10 12S6 16 6 12z"/><circle cx="12" cy="13" r="1.6" fill="currentColor"/><circle cx="20" cy="13" r="1.6" fill="currentColor"/>',
  arrowUp: '<path d="M16 26V6M8 14l8-8 8 8"/>',
  arrowDown: '<path d="M16 6v20M8 18l8 8 8-8"/>',
  arrowLeft: '<path d="M26 16H6M14 8l-8 8 8 8"/>',
  arrowRight: '<path d="M6 16h20M18 8l8 8-8 8"/>',
  bulb: '<path d="M16 4a10 10 0 0 0-10 10c0 5 4 7 4 10h12c0-3 4-5 4-10A10 10 0 0 0 16 4z"/><path d="M12 27h8"/>',
  eye: '<path d="M4 16c5-6 8-8 12-8s7 2 12 8c-5 6-8 8-12 8s-7-2-12-8z"/><circle cx="16" cy="16" r="4"/>',
  clock: '<circle cx="16" cy="16" r="11"/><path d="M16 9v8l5 3"/>',
  music: '<path d="M13 24V8l12-3v16"/><circle cx="9" cy="24" r="4"/><circle cx="21" cy="21" r="4"/>',
  heart: '<path d="M16 27S5 20.5 5 13.8A6.3 6.3 0 0 1 16 9.5 6.3 6.3 0 0 1 27 13.8C27 20.5 16 27 16 27z"/>',
  drop: '<path d="M16 4c6 8 9 11 9 15a9 9 0 0 1-18 0c0-4 3-7 9-15z"/>',
  leaf: '<path d="M6 26C6 14 13 7 26 6c1 13-6 20-20 20z"/><path d="M6 26l12-12"/>',
  flower: '<circle cx="16" cy="16" r="4"/><path d="M16 12V6M16 20v6M12 16H6M20 16h6M10.5 10.5L7 7M21.5 21.5L25 25M21.5 10.5L25 7M10.5 21.5L7 25"/>',
  moon: '<path d="M20 5a12 12 0 1 0 7 21A13 13 0 0 1 20 5z"/>',
  sun: '<circle cx="16" cy="16" r="7"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3"/>',
  circle: '<circle cx="16" cy="16" r="11"/>',
  square: '<rect x="6" y="6" width="20" height="20" rx="3"/>',
  triangle: '<path d="M16 5l11 20H5z"/>',
  diamond: '<path d="M16 4l12 12-12 12L4 16z"/>',
  hex: '<path d="M16 4l10 6v12l-10 6-10-6V10z"/>',
  plus: '<path d="M16 6v20M6 16h20"/>',
  cross: '<path d="M8 8l16 16M24 8L8 24"/>',
  flag: '<path d="M8 4v24M8 5h14l-3 5 3 5H8"/>',
  bomb: '<path d="M16 4c4 0 6 4 6 8 0 3-2 5-2 8h-8c0-3-2-5-2-8 0-4 2-8 6-8z"/><path d="M14 4l-2-3M18 4l2-3M16 1v3"/><circle cx="13" cy="13" r="1.4" fill="currentColor"/><circle cx="19" cy="13" r="1.4" fill="currentColor"/><path d="M13 20h6"/>',
  drum: '<ellipse cx="16" cy="16" rx="10" ry="11"/><path d="M6 16c0 6 4.5 9 10 9s10-3 10-9M10 10l-2-2M22 10l2-2M12 8v2M20 8v2"/>',
  box: '<rect x="8" y="8" width="16" height="16" rx="2"/>',
};

function ic(name, cls) {
  const body = ICONS[name] || ICONS.circle;
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"${cls ? ` class="${cls}"` : ''}>${body}</svg>`;
}



/* ============================================================
   ИЛЛЮСТРАЦИИ ОБЛОЖЕК — плоский неон-лайн, стабильно по id
   ============================================================ */

const CAT_PALETTE = {
  'Аркада': { a: '#ff7a59', b: '#ffb59e', base: '#150e0c', glow: 'rgba(255,122,89,.20)' },
  'Головоломка': { a: '#6ea8ff', b: '#a9c8ff', base: '#0b101a', glow: 'rgba(110,168,255,.20)' },
  'Логика': { a: '#4fe3a1', b: '#9bf3c9', base: '#08130f', glow: 'rgba(79,227,161,.18)' },
  'Удача': { a: '#ffcc4d', b: '#ffe29a', base: '#151107', glow: 'rgba(255,204,77,.20)' },
  'Реакция': { a: '#d98cff', b: '#eec2ff', base: '#120c16', glow: 'rgba(217,140,255,.18)' }
};

/* Светлые оформления требуют своих фонов обложек, иначе карточки выглядят чужими */
const COVER_TINT = {
  kids: { base: '#eaf4ff', glowAlpha: .16, darken: 0.16 },
  paper: { base: '#efe5d0', glowAlpha: .13, darken: 0.42 }
};

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
/* Смешение двух цветов — для градиентов «хвост → голова» у игровых объектов */
function mix(hex1, hex2, t) {
  const a = parseInt(hex1.slice(1), 16), b = parseInt(hex2.slice(1), 16);
  const f = (sh) => Math.round(((a >> sh) & 255) + (((b >> sh) & 255) - ((a >> sh) & 255)) * t);
  return '#' + [16, 8, 0].map(sh => f(sh).toString(16).padStart(2, '0')).join('');
}

function paletteFor(cat) {
  const base = CAT_PALETTE[cat] || CAT_PALETTE['Аркада'];
  const theme = document.documentElement.dataset.theme || 'modern';
  const tint = COVER_TINT[theme];
  if (!tint) return base;
  return {
    a: shade(base.a, -tint.darken),
    b: shade(base.b, -tint.darken * 0.55),
    base: tint.base,
    glow: rgba(base.a, tint.glowAlpha)
  };
}

/* Каждый мотив рисуется в 200×120. Стиль: линии + заливка, без эмодзи. */
const MOTIFS = {
  snake: (c) => `
    <path d="M46 88h44a14 14 0 0 0 0-28H60a14 14 0 0 1 0-28h44" fill="none" stroke="${c.a}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="108" cy="32" r="4" fill="${c.a}"/>
    <rect x="46" y="76" width="14" height="14" rx="4" fill="${c.b}" opacity=".55"/>`,

  bird: (c) => `
    <path d="M62 66a20 20 0 0 1 20-20h10l12-9 2 13 12 5-12 6-2 13-12-9H82a20 20 0 0 1-20-9z" fill="${c.a}" opacity=".9"/>
    <circle cx="86" cy="58" r="3" fill="${c.base}"/>
    <path d="M40 96h120" stroke="${c.b}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
    <path d="M40 96h120" stroke="${c.a}" stroke-width="2" stroke-dasharray="6 8" stroke-linecap="round" opacity=".7"/>`,

  blocks: (c) => `
    <rect x="34" y="24" width="40" height="14" rx="5" fill="${c.a}"/>
    <rect x="34" y="46" width="40" height="14" rx="5" fill="${c.a}" opacity=".75"/>
    <rect x="34" y="68" width="40" height="14" rx="5" fill="${c.a}" opacity=".5"/>
    <rect x="88" y="24" width="52" height="14" rx="5" fill="${c.b}" opacity=".85"/>
    <rect x="88" y="46" width="34" height="14" rx="5" fill="${c.b}" opacity=".55"/>
    <rect x="152" y="24" width="16" height="58" rx="5" fill="${c.a}" opacity=".35"/>`,

  paddle: (c) => `
    <rect x="30" y="38" width="9" height="44" rx="4.5" fill="${c.a}"/>
    <rect x="161" y="38" width="9" height="44" rx="4.5" fill="${c.a}"/>
    <circle cx="100" cy="60" r="9" fill="${c.b}"/>
    <path d="M100 60L56 44M100 60l44-16" stroke="${c.b}" stroke-width="1.6" stroke-dasharray="4 5" opacity=".55"/>
    <path d="M30 90h140" stroke="${c.a}" stroke-width="2" stroke-dasharray="8 8" opacity=".4"/>`,

  runner: (c) => `
    <circle cx="100" cy="30" r="8" fill="${c.a}"/>
    <path d="M100 40v24M100 48l-15 11M100 48l15-7M100 64l-13 24M100 64l14 24" stroke="${c.a}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M28 98h144" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
    <rect x="126" y="74" width="16" height="16" rx="4" fill="${c.b}" opacity=".45"/>
    <rect x="150" y="58" width="16" height="16" rx="4" fill="${c.b}" opacity=".3"/>`,

  cup: (c) => `
    <path d="M62 34h58l-7 46a10 10 0 0 1-10 9H79a10 10 0 0 1-10-9z" fill="none" stroke="${c.a}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M120 44h12a10 10 0 0 1 0 20h-9" fill="none" stroke="${c.a}" stroke-width="5"/>
    <circle cx="80" cy="24" r="4" fill="${c.b}"/>
    <circle cx="98" cy="18" r="3" fill="${c.b}" opacity=".7"/>
    <circle cx="112" cy="26" r="3.4" fill="${c.b}" opacity=".5"/>`,

  asteroid: (c) => `
    <path d="M100 26l22 8 12 22-8 24-26 12-24-12-8-24 12-22z" fill="none" stroke="${c.a}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="88" cy="54" r="6" fill="none" stroke="${c.b}" stroke-width="2.4"/>
    <circle cx="112" cy="70" r="4" fill="none" stroke="${c.b}" stroke-width="2.2"/>
    <path d="M30 34l12 8M158 82l12 6M34 88l10-6M164 36l-10 8" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,

  stack: (c) => `
    <rect x="52" y="82" width="96" height="15" rx="5" fill="${c.a}" opacity=".45"/>
    <rect x="66" y="62" width="68" height="15" rx="5" fill="${c.a}" opacity=".68"/>
    <rect x="80" y="42" width="40" height="15" rx="5" fill="${c.a}"/>
    <rect x="92" y="24" width="16" height="12" rx="4" fill="${c.b}"/>
    <path d="M100 14v6M96 18l4 4 4-4" stroke="${c.b}" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  hammer: (c) => `
    <path d="M54 88l34-34" stroke="${c.a}" stroke-width="8" stroke-linecap="round"/>
    <rect x="74" y="30" width="34" height="20" rx="6" transform="rotate(45 91 40)" fill="${c.a}"/>
    <circle cx="132" cy="74" r="15" fill="none" stroke="${c.b}" stroke-width="3"/>
    <path d="M34 98h34M50 90v16" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,

  bubble: (c) => `
    <circle cx="76" cy="52" r="24" fill="none" stroke="${c.a}" stroke-width="4"/>
    <circle cx="124" cy="70" r="16" fill="none" stroke="${c.a}" stroke-width="3.4" opacity=".8"/>
    <circle cx="112" cy="34" r="10" fill="none" stroke="${c.b}" stroke-width="3"/>
    <circle cx="146" cy="42" r="6" fill="none" stroke="${c.b}" stroke-width="2.4" opacity=".7"/>
    <path d="M66 42a12 12 0 0 1 8-6" stroke="${c.b}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,

  grid: (c) => `
    <rect x="42" y="22" width="116" height="76" rx="10" fill="none" stroke="${c.a}" stroke-width="4"/>
    <path d="M81 22v76M119 22v76M42 47h116M42 72h116" stroke="${c.b}" stroke-width="2" opacity=".55"/>
    <rect x="81" y="47" width="38" height="25" fill="${c.a}" opacity=".28"/>`,

  card: (c) => `
    <rect x="62" y="24" width="56" height="76" rx="9" transform="rotate(-10 90 62)" fill="none" stroke="${c.b}" stroke-width="3" opacity=".6"/>
    <rect x="82" y="26" width="56" height="76" rx="9" transform="rotate(7 110 64)" fill="none" stroke="${c.a}" stroke-width="4"/>
    <path d="M110 48l5 12 13 1.6-10 8.4 3 12.4-11-7-11 7 3-12.4-10-8.4 13-1.6z" fill="${c.a}" opacity=".85"/>`,

  dice: (c) => `
    <rect x="46" y="26" width="54" height="54" rx="13" transform="rotate(-9 73 53)" fill="none" stroke="${c.a}" stroke-width="4"/>
    <rect x="104" y="46" width="50" height="50" rx="13" transform="rotate(10 129 71)" fill="none" stroke="${c.b}" stroke-width="4"/>
    <circle cx="64" cy="42" r="3.6" fill="${c.a}"/>
    <circle cx="84" cy="64" r="3.6" fill="${c.a}"/>
    <circle cx="120" cy="60" r="3.4" fill="${c.b}"/>
    <circle cx="140" cy="84" r="3.4" fill="${c.b}"/>`,

  bulb: (c) => `
    <path d="M100 22c-17 0-30 13-30 29 0 12 8 19 11 27h38c3-8 11-15 11-27 0-16-13-29-30-29z" fill="none" stroke="${c.a}" stroke-width="4.4"/>
    <path d="M86 86h28M91 95h18" stroke="${c.b}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M100 40v18M92 48l8-8 8 8" stroke="${c.b}" stroke-width="2.8" stroke-linecap="round" fill="none"/>`,

  key: (c) => `
    <circle cx="74" cy="50" r="20" fill="none" stroke="${c.a}" stroke-width="5"/>
    <circle cx="74" cy="50" r="6.5" fill="none" stroke="${c.b}" stroke-width="2.4"/>
    <path d="M88 64l36 36M112 88l11-11M126 102l11-11" stroke="${c.a}" stroke-width="5" stroke-linecap="round"/>`,

  eye: (c) => `
    <path d="M36 62c22-24 42-32 64-32s42 8 64 32c-22 24-42 32-64 32s-42-8-64-32z" fill="none" stroke="${c.a}" stroke-width="4.2"/>
    <circle cx="100" cy="62" r="16" fill="none" stroke="${c.b}" stroke-width="3.2"/>
    <circle cx="100" cy="62" r="6.5" fill="${c.a}"/>
    <path d="M46 30l-6-6M154 30l6-6" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,

  clock: (c) => `
    <circle cx="100" cy="60" r="36" fill="none" stroke="${c.a}" stroke-width="4.4"/>
    <path d="M100 38v23l17 11" stroke="${c.b}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
    <circle cx="100" cy="60" r="3.6" fill="${c.b}"/>
    <path d="M100 14v8M100 98v8M54 60h-8M154 60h-8" stroke="${c.b}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`,

  music: (c) => `
    <path d="M78 82V34l46-10v48" fill="none" stroke="${c.a}" stroke-width="4.4" stroke-linejoin="round"/>
    <ellipse cx="68" cy="84" rx="13" ry="9.5" fill="${c.a}" opacity=".85"/>
    <ellipse cx="114" cy="74" rx="13" ry="9.5" fill="${c.a}" opacity=".85"/>
    <path d="M46 26v18M38 34h16" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,

  arrow: (c) => `
    <path d="M44 60h100" stroke="${c.a}" stroke-width="7" stroke-linecap="round"/>
    <path d="M124 38l22 22-22 22" fill="none" stroke="${c.a}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M44 42v36" stroke="${c.b}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,

  maze: (c) => `
    <path d="M40 24h120v72H40zM40 48h32v48M72 24v24h44v24h-30v24h74" fill="none" stroke="${c.a}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="152" cy="34" r="5" fill="${c.b}"/>`,

  fish: (c) => `
    <path d="M56 60c16-18 38-24 56-15 9 4 14 11 16 15-2 4-7 11-16 15-18 9-40 3-56-15z" fill="none" stroke="${c.a}" stroke-width="4.2"/>
    <path d="M128 60l26-16v32z" fill="none" stroke="${c.b}" stroke-width="3.6" stroke-linejoin="round"/>
    <circle cx="78" cy="54" r="3.4" fill="${c.a}"/>
    <path d="M46 88c8-4 12-4 20 0M40 96c10-4 16-4 26 0" stroke="${c.b}" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".6"/>`,

  house: (c) => `
    <path d="M56 60l44-32 44 32v40H56z" fill="none" stroke="${c.a}" stroke-width="4.4" stroke-linejoin="round"/>
    <path d="M86 100V74h28v26" fill="none" stroke="${c.b}" stroke-width="3.4"/>
    <path d="M112 46V28h14v26" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="68" y="72" width="12" height="12" rx="2" fill="${c.a}" opacity=".45"/>`,

  star: (c) => `
    <path d="M100 22l12 27 29 3-22 20 7 29-26-15-26 15 7-29-22-20 29-3z" fill="${c.a}" opacity=".9"/>
    <path d="M100 22l12 27 29 3-22 20 7 29-26-15-26 15 7-29-22-20 29-3z" fill="none" stroke="${c.b}" stroke-width="1.6" opacity=".6"/>`,

  flame: (c) => `
    <path d="M100 22c16 20 28 28 28 46a28 28 0 1 1-56 0c0-12 8-20 13-30 3 10 9 13 13 5 3-7 2-14 2-21z" fill="${c.a}" opacity=".85"/>
    <path d="M100 62c6 8 10 11 10 18a10 10 0 0 1-20 0c0-7 5-11 10-18z" fill="${c.base}" opacity=".65"/>`,

  shield: (c) => `
    <path d="M100 22l36 12v30c0 24-17 36-36 42-19-6-36-18-36-42V34z" fill="none" stroke="${c.a}" stroke-width="4.4" stroke-linejoin="round"/>
    <path d="M84 62l13 13 22-25" fill="none" stroke="${c.b}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>`,

  chart: (c) => `
    <path d="M40 92V28M40 92h124" stroke="${c.b}" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <path d="M56 78l26-24 22 14 32-38" fill="none" stroke="${c.a}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="136" cy="30" r="6" fill="${c.a}"/>
    <path d="M136 30h18v18" stroke="${c.a}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".6"/>`,

  coin: (c) => `
    <ellipse cx="100" cy="58" rx="34" ry="34" fill="none" stroke="${c.a}" stroke-width="4.4"/>
    <ellipse cx="100" cy="58" rx="24" ry="24" fill="none" stroke="${c.b}" stroke-width="2.4" opacity=".65"/>
    <path d="M100 44v28M92 50h12a7 7 0 0 1 0 14H92" fill="none" stroke="${c.a}" stroke-width="3.4" stroke-linecap="round"/>`,

  target: (c) => `
    <circle cx="100" cy="60" r="36" fill="none" stroke="${c.a}" stroke-width="4" opacity=".55"/>
    <circle cx="100" cy="60" r="23" fill="none" stroke="${c.a}" stroke-width="4" opacity=".8"/>
    <circle cx="100" cy="60" r="10" fill="${c.a}"/>
    <path d="M100 60l42-26M136 30h14v14" stroke="${c.b}" stroke-width="3" stroke-linecap="round" fill="none"/>`,

  gear: (c) => `
    <circle cx="100" cy="60" r="17" fill="none" stroke="${c.a}" stroke-width="4.4"/>
    <circle cx="100" cy="60" r="6" fill="${c.b}"/>
    <g stroke="${c.a}" stroke-width="4.4" stroke-linecap="round">
      <path d="M100 30v-8M100 98v-8M70 60h-8M138 60h-8"/>
      <path d="M79 39l-6-6M127 87l-6-6M121 39l6-6M73 87l6-6"/>
    </g>`,

  layers: (c) => `
    <path d="M100 26l46 22-46 22-46-22z" fill="${c.a}" opacity=".85"/>
    <path d="M54 62l46 22 46-22" fill="none" stroke="${c.b}" stroke-width="3.6" stroke-linejoin="round" opacity=".85"/>
    <path d="M54 82l46 22 46-22" fill="none" stroke="${c.b}" stroke-width="3.6" stroke-linejoin="round" opacity=".5"/>`,

  meteor: (c) => `
    <path d="M132 26l-30 30" stroke="${c.b}" stroke-width="3" stroke-dasharray="6 7" opacity=".55"/>
    <path d="M126 20l-26 26" stroke="${c.a}" stroke-width="2" stroke-dasharray="4 8" opacity=".4"/>
    <circle cx="136" cy="70" r="22" fill="none" stroke="${c.a}" stroke-width="4.4"/>
    <circle cx="130" cy="64" r="5" fill="${c.a}" opacity=".55"/>
    <circle cx="144" cy="78" r="3.4" fill="${c.a}" opacity=".4"/>`,
  jump: (c) => `
    <path d="M100 96V40" stroke="${c.a}" stroke-width="5" stroke-linecap="round"/>
    <path d="M78 60l22-26 22 26" fill="none" stroke="${c.a}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="46" y="90" width="34" height="10" rx="5" fill="${c.b}" opacity=".55"/>
    <rect x="122" y="76" width="34" height="10" rx="5" fill="${c.b}" opacity=".35"/>`,
  memorycards: (c) => `
    <rect x="52" y="26" width="44" height="64" rx="8" transform="rotate(-8 74 58)" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="88" y="28" width="44" height="64" rx="8" transform="rotate(6 110 60)" fill="${c.a}" opacity=".18" stroke="${c.a}" stroke-width="3.4"/>
    <circle cx="110" cy="60" r="9" fill="${c.a}"/>`,
  slidetiles: (c) => `
    <rect x="44" y="20" width="112" height="80" rx="10" fill="none" stroke="${c.b}" stroke-width="2.6" opacity=".45"/>
    <g fill="${c.b}" opacity=".5">
      <rect x="52" y="28" width="28" height="28" rx="6"/><rect x="86" y="28" width="28" height="28" rx="6"/>
      <rect x="120" y="28" width="28" height="28" rx="6"/><rect x="52" y="64" width="28" height="28" rx="6"/>
      <rect x="120" y="64" width="28" height="28" rx="6"/>
    </g>
    <rect x="86" y="64" width="28" height="28" rx="6" fill="${c.a}" opacity=".85"/>`,
  sudoku: (c) => `
    <rect x="46" y="16" width="108" height="88" rx="8" fill="none" stroke="${c.a}" stroke-width="3.4"/>
    <path d="M100 16v88M46 60h108" stroke="${c.b}" stroke-width="2.2" opacity=".65"/>
    <circle cx="73" cy="38" r="4.2" fill="${c.a}"/><circle cx="127" cy="38" r="4.2" fill="${c.b}"/>
    <circle cx="73" cy="82" r="4.2" fill="${c.b}"/><circle cx="127" cy="82" r="4.2" fill="${c.a}"/>`,
  mine: (c) => `
    <circle cx="100" cy="62" r="24" fill="none" stroke="${c.a}" stroke-width="4"/>
    <circle cx="100" cy="62" r="8" fill="${c.a}" opacity=".65"/>
    <g stroke="${c.b}" stroke-width="3" stroke-linecap="round">
      <path d="M100 32V20M100 92v12M70 62H58M142 62h-12M79 41l-8-8M121 83l8 8M121 41l8-8M79 83l-8 8"/>
    </g>`,
  xo: (c) => `
    <path d="M74 18v84M126 18v84M40 50h120M40 80h120" stroke="${c.b}" stroke-width="2.6" opacity=".4"/>
    <path d="M50 28l20 20M70 28L50 48" stroke="${c.a}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="100" cy="65" r="10" fill="none" stroke="${c.a}" stroke-width="4.5"/>
    <path d="M132 82l20 20M152 82l-20 20" stroke="${c.a}" stroke-width="4.5" stroke-linecap="round"/>`,
  anagram: (c) => `
    <rect x="38" y="40" width="28" height="38" rx="6" transform="rotate(-12 52 59)" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="70" y="46" width="28" height="38" rx="6" transform="rotate(9 84 65)" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="104" y="36" width="28" height="38" rx="6" fill="${c.a}" opacity=".85"/>
    <rect x="132" y="46" width="28" height="38" rx="6" transform="rotate(-7 146 65)" fill="none" stroke="${c.b}" stroke-width="3"/>`,
  countbars: (c) => `
    <rect x="40" y="72" width="18" height="24" rx="4" fill="${c.a}" opacity=".45"/>
    <rect x="66" y="56" width="18" height="40" rx="4" fill="${c.a}" opacity=".7"/>
    <rect x="92" y="36" width="18" height="60" rx="4" fill="${c.a}"/>
    <rect x="118" y="64" width="18" height="32" rx="4" fill="${c.b}" opacity=".8"/>
    <rect x="144" y="48" width="18" height="48" rx="4" fill="${c.b}"/>`,
  hanoi: (c) => `
    <path d="M44 94h112" stroke="${c.b}" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="52" y="80" width="46" height="10" rx="5" fill="${c.a}"/>
    <rect x="58" y="68" width="34" height="10" rx="5" fill="${c.a}" opacity=".75"/>
    <rect x="64" y="56" width="22" height="10" rx="5" fill="${c.a}" opacity=".5"/>
    <path d="M140 42v50" stroke="${c.b}" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="126" y="80" width="28" height="10" rx="5" fill="${c.b}" opacity=".45"/>`,
  oddgrid: (c) => `
    <g fill="${c.b}" opacity=".5">
      <rect x="44" y="24" width="22" height="22" rx="4"/><rect x="74" y="24" width="22" height="22" rx="4"/><rect x="104" y="24" width="22" height="22" rx="4"/>
      <rect x="44" y="54" width="22" height="22" rx="4"/><rect x="104" y="54" width="22" height="22" rx="4"/>
      <rect x="44" y="84" width="22" height="22" rx="4"/><rect x="74" y="84" width="22" height="22" rx="4"/><rect x="104" y="84" width="22" height="22" rx="4"/>
    </g>
    <rect x="74" y="54" width="22" height="22" rx="4" fill="${c.a}" transform="rotate(45 85 65)"/>`,
  simon: (c) => `
    <circle cx="100" cy="60" r="34" fill="none" stroke="${c.b}" stroke-width="3"/>
    <path d="M100 60V26a34 34 0 0 1 34 34z" fill="${c.a}" opacity=".85"/>
    <path d="M100 60h34a34 34 0 0 1-34 34z" fill="${c.a}" opacity=".42"/>
    <path d="M100 60v34a34 34 0 0 1-34-34z" fill="${c.a}" opacity=".2"/>
    <circle cx="100" cy="60" r="7" fill="${c.base}" stroke="${c.b}" stroke-width="2.4"/>`,
  tubes: (c) => `
    <g fill="none" stroke="${c.b}" stroke-width="3">
      <path d="M56 24v58a10 10 0 0 0 20 0V24z"/><path d="M96 24v58a10 10 0 0 0 20 0V24z"/><path d="M136 24v58a10 10 0 0 0 20 0V24z"/>
    </g>
    <path d="M56 62v20a10 10 0 0 0 20 0V62z" fill="${c.a}" opacity=".85"/>
    <path d="M136 46v36a10 10 0 0 0 20 0V46z" fill="${c.a}" opacity=".4"/>`,
  pairs: (c) => `
    <rect x="46" y="28" width="42" height="58" rx="7" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="112" y="28" width="42" height="58" rx="7" fill="none" stroke="${c.b}" stroke-width="3"/>
    <circle cx="67" cy="57" r="10" fill="${c.a}"/><circle cx="133" cy="57" r="10" fill="${c.a}"/>
    <path d="M96 57h16" stroke="${c.b}" stroke-width="2" stroke-dasharray="3 4"/>`,
  dotseq: (c) => `
    <circle cx="46" cy="60" r="5" fill="${c.a}"/><circle cx="72" cy="60" r="7" fill="${c.a}"/>
    <circle cx="100" cy="60" r="9" fill="${c.a}"/><circle cx="132" cy="60" r="11" fill="${c.a}"/>
    <circle cx="162" cy="60" r="13" fill="none" stroke="${c.b}" stroke-width="3" stroke-dasharray="4 5"/>`,
  evenodd: (c) => `
    <circle cx="54" cy="42" r="13" fill="${c.a}"/>
    <rect x="84" y="29" width="26" height="26" rx="5" fill="none" stroke="${c.b}" stroke-width="3.4"/>
    <circle cx="132" cy="42" r="13" fill="${c.a}" opacity=".5"/>
    <rect x="41" y="70" width="26" height="26" rx="5" fill="none" stroke="${c.b}" stroke-width="3.4"/>
    <circle cx="97" cy="83" r="13" fill="${c.a}"/>
    <rect x="119" y="70" width="26" height="26" rx="5" fill="none" stroke="${c.b}" stroke-width="3.4"/>`,
  mirror: (c) => `
    <path d="M100 18v84" stroke="${c.b}" stroke-width="2" stroke-dasharray="5 6" opacity=".7"/>
    <path d="M86 32L52 60l34 28z" fill="${c.a}" opacity=".8"/>
    <path d="M114 32l34 28-34 28z" fill="none" stroke="${c.a}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="100" cy="60" r="4" fill="${c.b}"/>`,
  spot: (c) => `
    <g fill="${c.b}" opacity=".42">
      <circle cx="58" cy="32" r="8"/><circle cx="92" cy="32" r="8"/><circle cx="126" cy="32" r="8"/><circle cx="156" cy="32" r="8"/>
      <circle cx="58" cy="62" r="8"/><circle cx="126" cy="62" r="8"/><circle cx="156" cy="62" r="8"/>
      <circle cx="58" cy="92" r="8"/><circle cx="92" cy="92" r="8"/><circle cx="126" cy="92" r="8"/><circle cx="156" cy="92" r="8"/>
    </g>
    <circle cx="92" cy="62" r="8" fill="${c.a}"/>`,
  digits: (c) => `
    <g stroke="${c.a}" stroke-width="4" fill="none" stroke-linecap="round">
      <path d="M46 38h18M55 38v30"/><path d="M84 38h16l-16 30h16"/><path d="M118 38h16v15h-16v15h16"/>
    </g>
    <circle cx="158" cy="66" r="8" fill="${c.b}"/>`,
  arrows4: (c) => `
    <g stroke="${c.a}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M100 32V16M92 22l8-8 8 8"/><path d="M100 88v16M92 98l8 8 8-8"/>
      <path d="M64 60H48M58 52l-8 8 8 8"/><path d="M136 60h16M142 52l8 8-8 8"/>
    </g>
    <circle cx="100" cy="60" r="9" fill="none" stroke="${c.b}" stroke-width="2.6"/>`,
  fill: (c) => `
    <rect x="44" y="22" width="112" height="76" rx="10" fill="none" stroke="${c.b}" stroke-width="3"/>
    <path d="M44 56h56v42H44z" fill="${c.a}" opacity=".72"/>
    <path d="M100 22h56v34h-56z" fill="${c.a}" opacity=".32"/>
    <circle cx="128" cy="78" r="8" fill="${c.a}"/>`,
  binary: (c) => `
    <ellipse cx="64" cy="60" rx="14" ry="19" fill="none" stroke="${c.a}" stroke-width="4"/>
    <path d="M126 41v38" stroke="${c.a}" stroke-width="4.4" stroke-linecap="round"/>
    <g fill="${c.b}" opacity=".5">
      <rect x="92" y="26" width="14" height="14" rx="3"/><rect x="92" y="53" width="14" height="14" rx="3"/><rect x="92" y="80" width="14" height="14" rx="3"/>
    </g>`,
  roman: (c) => `
    <g stroke="${c.a}" stroke-width="4" stroke-linecap="round">
      <path d="M56 34v52M72 34v52"/><path d="M96 86V34l24 52V34"/>
    </g>
    <path d="M44 96h112" stroke="${c.b}" stroke-width="2.4" opacity=".45"/>`,
  stroop: (c) => `
    <rect x="34" y="30" width="56" height="12" rx="6" fill="${c.a}"/>
    <rect x="34" y="54" width="76" height="12" rx="6" fill="${c.b}" opacity=".8"/>
    <rect x="34" y="78" width="44" height="12" rx="6" fill="${c.a}" opacity=".5"/>
    <circle cx="150" cy="38" r="14" fill="none" stroke="${c.b}" stroke-width="4"/>
    <circle cx="150" cy="82" r="10" fill="${c.a}" opacity=".7"/>`,
  sums: (c) => `
    <rect x="36" y="32" width="46" height="54" rx="8" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="118" y="32" width="46" height="54" rx="8" fill="none" stroke="${c.b}" stroke-width="3"/>
    <path d="M88 59h24M100 47v24" stroke="${c.a}" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M48 48h22M48 60h16M48 72h22" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
    <path d="M130 48h22M130 60h16M130 72h22" stroke="${c.b}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
  slots: (c) => `
    <rect x="34" y="32" width="132" height="56" rx="10" fill="none" stroke="${c.b}" stroke-width="3"/>
    <path d="M78 32v56M122 32v56" stroke="${c.b}" stroke-width="2.2" opacity=".55"/>
    <circle cx="56" cy="60" r="10" fill="${c.a}"/>
    <path d="M100 48l5 12 13 1-10 9 3 12-11-7-11 7 3-12-10-9 13-1z" fill="${c.a}" opacity=".9"/>
    <circle cx="144" cy="60" r="10" fill="none" stroke="${c.a}" stroke-width="3.4"/>`,
  wheel: (c) => `
    <circle cx="100" cy="60" r="34" fill="none" stroke="${c.b}" stroke-width="3.4"/>
    <g stroke="${c.a}" stroke-width="2.2" opacity=".6">
      <path d="M100 26v68M66 60h68M76 36l48 48M124 36l-48 48"/>
    </g>
    <circle cx="100" cy="60" r="7" fill="${c.a}"/>`,
  question: (c) => `
    <circle cx="100" cy="60" r="36" fill="none" stroke="${c.b}" stroke-width="3.2" opacity=".55"/>
    <path d="M86 46a14 14 0 1 1 20 12c-4 3-6 5-6 11" fill="none" stroke="${c.a}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="84" r="4" fill="${c.a}"/>`,
  updown: (c) => `
    <path d="M76 96V34M64 46l12-12 12 12" fill="none" stroke="${c.a}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M124 24v62M112 74l12 12 12-12" fill="none" stroke="${c.b}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  ticket: (c) => `
    <path d="M34 40h132v10a9 9 0 0 0 0 18v10H34V68a9 9 0 0 0 0-18z" fill="none" stroke="${c.a}" stroke-width="3.4"/>
    <path d="M100 44v32" stroke="${c.b}" stroke-width="2.4" stroke-dasharray="4 5"/>
    <circle cx="64" cy="59" r="8" fill="${c.b}" opacity=".5"/>`,
  scratch: (c) => `
    <rect x="46" y="20" width="108" height="78" rx="10" fill="none" stroke="${c.b}" stroke-width="3"/>
    <path d="M56 32h88M56 48h60M56 64h88M56 80h44" stroke="${c.b}" stroke-width="6" stroke-linecap="round" opacity=".22"/>
    <path d="M84 42l32 32M116 42l-32 32" stroke="${c.a}" stroke-width="5" stroke-linecap="round"/>`,
  roulette: (c) => `
    <circle cx="100" cy="60" r="34" fill="none" stroke="${c.b}" stroke-width="3.2"/>
    <path d="M100 60V26a34 34 0 0 1 29 17z" fill="${c.a}" opacity=".5"/>
    <path d="M100 60l29 17a34 34 0 0 1-29 17z" fill="${c.a}" opacity=".26"/>
    <circle cx="100" cy="60" r="6" fill="${c.b}"/>
    <circle cx="126" cy="40" r="5" fill="${c.a}"/>`,
  plinko: (c) => `
    <g fill="${c.b}" opacity=".5">
      <circle cx="70" cy="40" r="4"/><circle cx="100" cy="40" r="4"/><circle cx="130" cy="40" r="4"/>
      <circle cx="85" cy="60" r="4"/><circle cx="115" cy="60" r="4"/>
      <circle cx="70" cy="80" r="4"/><circle cx="100" cy="80" r="4"/><circle cx="130" cy="80" r="4"/>
    </g>
    <circle cx="100" cy="20" r="8" fill="${c.a}"/>
    <path d="M88 24l-8 20M112 24l8 20" stroke="${c.a}" stroke-width="2" stroke-dasharray="3 4" opacity=".65"/>`,
  crash: (c) => `
    <path d="M34 32h30l14 18 16-10 18 26 12-8 26 22" fill="none" stroke="${c.a}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M34 92h132" stroke="${c.b}" stroke-width="2.4" opacity=".4"/>
    <circle cx="170" cy="82" r="5" fill="${c.b}"/>`,
  greens: (c) => `
    <g fill="${c.b}" opacity=".3">
      <rect x="40" y="20" width="26" height="26" rx="5"/><rect x="74" y="20" width="26" height="26" rx="5"/><rect x="108" y="20" width="26" height="26" rx="5"/><rect x="142" y="20" width="26" height="26" rx="5"/>
      <rect x="40" y="54" width="26" height="26" rx="5"/><rect x="108" y="54" width="26" height="26" rx="5"/>
      <rect x="40" y="88" width="26" height="26" rx="5"/><rect x="74" y="88" width="26" height="26" rx="5"/><rect x="142" y="88" width="26" height="26" rx="5"/>
    </g>
    <rect x="74" y="54" width="26" height="26" rx="5" fill="${c.a}"/>
    <rect x="108" y="88" width="26" height="26" rx="5" fill="${c.a}" opacity=".75"/>`,
  dotcount: (c) => `
    <g fill="${c.a}">
      <circle cx="60" cy="36" r="6"/><circle cx="90" cy="30" r="6"/><circle cx="120" cy="40" r="6"/><circle cx="148" cy="28" r="6"/>
      <circle cx="52" cy="66" r="6"/><circle cx="82" cy="60" r="6"/><circle cx="112" cy="72" r="6"/><circle cx="142" cy="62" r="6"/>
      <circle cx="66" cy="94" r="6"/><circle cx="100" cy="90" r="6"/>
    </g>
    <circle cx="132" cy="94" r="11" fill="none" stroke="${c.b}" stroke-width="3"/>`,
  wordlist: (c) => `
    <rect x="34" y="24" width="118" height="10" rx="5" fill="${c.b}" opacity=".32"/>
    <rect x="34" y="46" width="132" height="10" rx="5" fill="${c.a}"/>
    <rect x="34" y="68" width="96" height="10" rx="5" fill="${c.b}" opacity=".32"/>
    <path d="M140 90l7 7 14-16" stroke="${c.a}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  keyboard: (c) => `
    <rect x="34" y="38" width="132" height="46" rx="9" fill="none" stroke="${c.b}" stroke-width="3"/>
    <g fill="${c.a}" opacity=".8">
      <rect x="44" y="48" width="12" height="10" rx="2"/><rect x="60" y="48" width="12" height="10" rx="2"/>
      <rect x="76" y="48" width="12" height="10" rx="2"/><rect x="92" y="48" width="12" height="10" rx="2"/>
      <rect x="108" y="48" width="12" height="10" rx="2"/><rect x="124" y="48" width="12" height="10" rx="2"/>
    </g>
    <rect x="60" y="64" width="60" height="10" rx="3" fill="${c.b}" opacity=".45"/>`,
  sortbars: (c) => `
    <rect x="38" y="74" width="16" height="24" rx="4" fill="${c.b}" opacity=".45"/>
    <rect x="62" y="60" width="16" height="38" rx="4" fill="${c.b}" opacity=".45"/>
    <rect x="86" y="46" width="16" height="52" rx="4" fill="${c.b}" opacity=".45"/>
    <rect x="110" y="32" width="16" height="66" rx="4" fill="${c.a}"/>
    <rect x="134" y="20" width="16" height="78" rx="4" fill="${c.a}" opacity=".72"/>`,
  sametiles: (c) => `
    <rect x="40" y="22" width="30" height="30" rx="6" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="78" y="22" width="30" height="30" rx="6" fill="${c.a}" opacity=".85"/>
    <rect x="116" y="22" width="30" height="30" rx="6" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="40" y="60" width="30" height="30" rx="6" fill="${c.a}" opacity=".85"/>
    <rect x="78" y="60" width="30" height="30" rx="6" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="116" y="60" width="30" height="30" rx="6" fill="${c.a}" opacity=".85"/>`,
  stopwatch: (c) => `
    <circle cx="100" cy="66" r="30" fill="none" stroke="${c.a}" stroke-width="3.6"/>
    <path d="M100 66V48M100 66l14 9" stroke="${c.b}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M88 24h24M100 24v12" stroke="${c.b}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M136 42l8-8" stroke="${c.a}" stroke-width="3" stroke-linecap="round"/>`,
  letters: (c) => `
    <rect x="36" y="32" width="34" height="48" rx="8" fill="none" stroke="${c.b}" stroke-width="3"/>
    <rect x="80" y="32" width="34" height="48" rx="8" fill="${c.a}" opacity=".8"/>
    <rect x="124" y="32" width="34" height="48" rx="8" fill="none" stroke="${c.b}" stroke-width="3"/>
    <path d="M45 46h16M45 56h12M45 66h16" stroke="${c.a}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M89 46h16M89 56h12M89 66h16" stroke="${c.base}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M133 46h16M133 56h12M133 66h16" stroke="${c.a}" stroke-width="2.4" stroke-linecap="round"/>`,
  scramble: (c) => `
    <path d="M40 40h34l16 22h30" stroke="${c.a}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M40 80h22l26-18h24" stroke="${c.b}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".65"/>
    <circle cx="142" cy="62" r="9" fill="${c.a}"/>
    <circle cx="142" cy="40" r="5" fill="${c.b}" opacity=".55"/>`,
  prime: (c) => `
    <g fill="${c.b}" opacity=".3">
      <circle cx="56" cy="34" r="7"/><circle cx="84" cy="34" r="7"/><circle cx="112" cy="34" r="7"/><circle cx="140" cy="34" r="7"/>
      <circle cx="56" cy="62" r="7"/><circle cx="84" cy="62" r="7"/><circle cx="112" cy="62" r="7"/><circle cx="140" cy="62" r="7"/>
      <circle cx="56" cy="90" r="7"/><circle cx="84" cy="90" r="7"/><circle cx="112" cy="90" r="7"/><circle cx="140" cy="90" r="7"/>
    </g>
    <circle cx="84" cy="34" r="7" fill="${c.a}"/><circle cx="112" cy="62" r="7" fill="${c.a}"/><circle cx="56" cy="90" r="7" fill="${c.a}"/>`,
  bits: (c) => `
    <g fill="none" stroke="${c.b}" stroke-width="3">
      <rect x="44" y="32" width="30" height="16" rx="8"/><rect x="44" y="60" width="30" height="16" rx="8"/><rect x="44" y="88" width="30" height="16" rx="8"/>
    </g>
    <circle cx="66" cy="40" r="6" fill="${c.a}"/><circle cx="52" cy="68" r="6" fill="${c.b}" opacity=".45"/><circle cx="66" cy="96" r="6" fill="${c.a}"/>
    <path d="M92 40h44M92 68h30M92 96h54" stroke="${c.a}" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`,
  ruler: (c) => `
    <rect x="34" y="44" width="132" height="32" rx="6" fill="none" stroke="${c.b}" stroke-width="3"/>
    <g stroke="${c.a}" stroke-width="2.6" stroke-linecap="round">
      <path d="M52 44v12M70 44v20M88 44v12M106 44v20M124 44v12M142 44v20"/>
    </g>`,
  palette: (c) => `
    <path d="M100 26c-22 0-38 15-38 34s16 34 38 34c6 0 10-4 10-9 0-3-2-5-2-8 0-4 3-6 7-6h7c9 0 16-7 16-16 0-16-17-29-38-29z" fill="none" stroke="${c.b}" stroke-width="3.2"/>
    <circle cx="82" cy="46" r="6" fill="${c.a}"/>
    <circle cx="112" cy="42" r="6" fill="${c.a}" opacity=".62"/>
    <circle cx="78" cy="72" r="6" fill="${c.a}" opacity=".38"/>`,
  rhythm: (c) => `
    <g stroke="${c.a}" stroke-width="4" stroke-linecap="round">
      <path d="M44 60v-14M64 60v-30M84 60v-20M104 60v-38M124 60v-24M144 60v-12"/>
    </g>
    <path d="M36 76h128" stroke="${c.b}" stroke-width="2.4" opacity=".45"/>`,
  dicepair: (c) => `
    <rect x="42" y="30" width="52" height="52" rx="12" transform="rotate(-8 68 56)" fill="none" stroke="${c.a}" stroke-width="3.6"/>
    <rect x="106" y="40" width="52" height="52" rx="12" transform="rotate(9 132 66)" fill="none" stroke="${c.b}" stroke-width="3.6"/>
    <circle cx="58" cy="44" r="3.4" fill="${c.a}"/><circle cx="80" cy="66" r="3.4" fill="${c.a}"/>
    <circle cx="120" cy="54" r="3.2" fill="${c.b}"/><circle cx="142" cy="78" r="3.2" fill="${c.b}"/>`,
  mirrorletter: (c) => `
    <path d="M100 18v84" stroke="${c.b}" stroke-width="2" stroke-dasharray="5 6" opacity=".65"/>
    <path d="M86 30H64L50 60l14 30h22z" fill="${c.a}" opacity=".8"/>
    <path d="M114 30h22l14 30-14 30h-22z" fill="none" stroke="${c.b}" stroke-width="3.2"/>`,
  boxes: (c) => `
    <rect x="40" y="36" width="52" height="44" rx="8" fill="${c.a}" opacity=".8"/>
    <rect x="108" y="24" width="52" height="68" rx="8" fill="none" stroke="${c.b}" stroke-width="3.4"/>
    <path d="M96 58h8" stroke="${c.b}" stroke-width="2.4" stroke-dasharray="2 3"/>`,
  arrowtarget: (c) => `
    <circle cx="122" cy="68" r="26" fill="none" stroke="${c.b}" stroke-width="3.2" opacity=".65"/>
    <circle cx="122" cy="68" r="12" fill="${c.a}" opacity=".22"/>
    <path d="M44 28l60 30" stroke="${c.a}" stroke-width="5" stroke-linecap="round"/>
    <path d="M96 54l10 6-11 5z" fill="${c.a}"/>
    <circle cx="122" cy="68" r="4.5" fill="${c.a}"/>`,
  chain: (c) => `
    <g fill="none" stroke="${c.a}" stroke-width="4">
      <rect x="38" y="44" width="40" height="24" rx="12"/><rect x="68" y="44" width="40" height="24" rx="12"/>
    </g>
    <rect x="108" y="52" width="38" height="22" rx="11" fill="none" stroke="${c.b}" stroke-width="3.4"/>
    <path d="M150 63h16" stroke="${c.b}" stroke-width="2.6" stroke-dasharray="3 4"/>`,
  symbols: (c) => `
    <g stroke="${c.b}" stroke-width="3" fill="none" stroke-linejoin="round">
      <circle cx="64" cy="38" r="11"/><rect x="112" y="27" width="24" height="24" rx="4"/>
      <path d="M64 74l11 20H53z"/><path d="M124 72l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/>
    </g>
    <circle cx="64" cy="38" r="11" fill="${c.a}" stroke="none" opacity=".65"/>`,
  tally: (c) => `
    <g stroke="${c.a}" stroke-width="4" stroke-linecap="round">
      <path d="M52 34v52M72 34v52M92 34v52M112 34v52"/>
    </g>
    <path d="M42 72l80-28" stroke="${c.b}" stroke-width="4" stroke-linecap="round"/>
    <path d="M136 50v36M148 50v36" stroke="${c.b}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`,
  crosshair: (c) => `
    <circle cx="100" cy="60" r="30" fill="none" stroke="${c.b}" stroke-width="3.2"/>
    <path d="M100 18v22M100 80v22M58 60h22M120 60h22" stroke="${c.a}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="100" cy="60" r="5" fill="${c.a}"/>`,
  icons: (c) => `
    <g stroke="${c.b}" stroke-width="3" fill="none" stroke-linejoin="round">
      <circle cx="66" cy="38" r="12"/><rect x="112" y="26" width="24" height="24" rx="4"/>
      <path d="M66 74l12 22H54z"/><path d="M124 72l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/>
    </g>
    <circle cx="66" cy="38" r="12" fill="${c.a}" stroke="none" opacity=".6"/>`,
};

const MOTIF_KEYS = Object.keys(MOTIFS);

const MOTIF_FOR = {
  snake: 'snake', flappy: 'bird', breakout: 'blocks', pong: 'paddle',
  runner: 'runner', catcher: 'cup', dodge: 'meteor', jumper: 'jump',
  asteroids: 'asteroid', stacker: 'stack', whackamole: 'hammer', bubbles: 'bubble',
  game2048: 'layers', memory: 'memorycards', sliding: 'slidetiles', sudoku: 'sudoku',
  minesweeper: 'mine', tictactoe: 'xo', math: 'bulb', anagram: 'anagram',
  wordcount: 'countbars', hanoi: 'hanoi', oddone: 'oddgrid', simon: 'simon',
  sortcolors: 'tubes', findpair: 'pairs', reaction: 'clock', sequence: 'dotseq',
  evenodd: 'evenodd', compare: 'chart', palindrome: 'mirror', spotdiff: 'spot',
  clicker: 'target', finddigit: 'digits', arrows: 'arrows4', filler: 'fill',
  binary: 'binary', roman: 'roman', stroop: 'stroop', pairmatch: 'sums',
  dice: 'dice', coin: 'coin', slots: 'slots', wheel: 'wheel',
  guessnum: 'question', rps: 'shield', higherlower: 'updown', lottery: 'ticket',
  scratch: 'scratch', roulette: 'roulette', plinko: 'plinko', crash: 'crash',
  tapgreen: 'greens', countdots: 'dotcount', oddword: 'wordlist', typefast: 'keyboard',
  sortnum: 'sortbars', sameemoji: 'sametiles', stoptimer: 'stopwatch', lettercount: 'letters',
  wordscramble: 'scramble', capital: 'house', primecheck: 'prime', bitclick: 'bits',
  longestword: 'ruler', colorcode: 'palette', taprhythm: 'rhythm', diceguess: 'dicepair',
  mirrorletter: 'mirrorletter', biggerbox: 'boxes', spintarget: 'arrowtarget', mathchain: 'chain',
  findsymbol: 'symbols', evencount: 'tally', aimclick: 'crosshair', emojiquiz: 'icons',
  secretcat: 'fish'
};


/* Мягкая сетка/шум под иллюстрацией */
function backdrop(seed, pal) {
  const rnd = seeded(seed);
  let out = `<rect width="200" height="120" fill="${pal.base}"/>`;
  out += `<ellipse cx="${(60 + rnd() * 90).toFixed(0)}" cy="${(20 + rnd() * 50).toFixed(0)}" rx="${(70 + rnd() * 50).toFixed(0)}" ry="${(45 + rnd() * 30).toFixed(0)}" fill="${pal.glow}"/>`;
  // тонкие линии-«скан»
  for (let i = 0; i < 3; i++) {
    const y = (18 + rnd() * 84).toFixed(1);
    out += `<path d="M0 ${y}h200" stroke="${pal.a}" stroke-width="0.8" opacity=".10"/>`;
  }
  // точки
  for (let i = 0; i < 12; i++) {
    out += `<circle cx="${(8 + rnd() * 184).toFixed(0)}" cy="${(8 + rnd() * 104).toFixed(0)}" r="${(0.9 + rnd() * 1.3).toFixed(1)}" fill="${pal.a}" opacity="${(0.10 + rnd() * 0.18).toFixed(2)}"/>`;
  }
  return out;
}

function coverSVG(id, cat) {
  const pal = paletteFor(cat);
  const seed = hashStr(id);
  const key = MOTIF_FOR[id] || MOTIF_KEYS[seed % MOTIF_KEYS.length];
  const motif = (MOTIFS[key] || MOTIFS.star)(pal);
  // лёгкая вариация оттенка и поворота, чтобы одинаковые мотивы не выглядели клонами
  const hue = ((seed % 41) - 20);
  const rot = (((seed >> 3) % 9) - 4);
  const sc = 0.94 + ((seed >> 7) % 13) / 100;
  return `<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${backdrop(seed, pal)}
    <g opacity=".97" style="filter:hue-rotate(${hue}deg)"
       transform="translate(100 60) rotate(${rot}) scale(${sc.toFixed(2)}) translate(-100 -60)">${motif}</g>
    <rect width="200" height="120" fill="url(#fade-${id})" opacity=".5"/>
    <defs>
      <linearGradient id="fade-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${pal.base}" stop-opacity="0"/>
        <stop offset="1" stop-color="${pal.base}" stop-opacity=".6"/>
      </linearGradient>
    </defs>
  </svg>`;
}

/* Иконки предметов мусора (линия) */const JUNK_ICON = {
  sock: '<path d="M14 10h8v12a6 6 0 0 1-12 0v-4h4"/><path d="M18 22h6"/>',
  spoon: '<path d="M16 8a4 4 0 0 1 4 4c0 3-2 5-4 5s-4-2-4-5a4 4 0 0 1 4-4z"/><path d="M16 17v9"/>',
  rock: '<path d="M8 22l3-9 7-3 6 5-1 7-8 3z"/>',
  clip: '<path d="M20 14l-7 7a4 4 0 0 1-6-6l8-8a3 3 0 0 1 4 4l-8 8a1.5 1.5 0 0 1-2-2l7-7"/>',
  leaf: '<path d="M9 24c0-8 5-13 13-14 1 8-5 14-13 14z"/><path d="M9 24l8-8"/>',
  roll: '<rect x="10" y="8" width="12" height="16" rx="3"/><path d="M10 13h12M10 19h12"/>',
  battery: '<rect x="7" y="10" width="18" height="11" rx="3"/><path d="M25 14v3"/><path d="M12 13v5"/>',
  cable: '<path d="M8 8v6a4 4 0 0 0 8 0V8"/><path d="M16 14h4a5 5 0 0 1 5 5v3"/>',
  cup: '<path d="M9 9h13l-2 12a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3z"/><path d="M9 13h13"/>',
  plaster: '<rect x="6" y="13" width="20" height="8" rx="4" transform="rotate(-20 16 17)"/><circle cx="16" cy="17" r="1.6"/>',
  bolt: '<path d="M14 7l-4 10h5l-3 10 10-12h-5l3-8z"/>',
  statue: '<path d="M16 6l5 8-2 2v6h-6v-6l-2-2z"/><path d="M10 24h12"/>',
  key: '<circle cx="10" cy="14" r="4"/><path d="M14 14h11M21 14v4M25 14v3"/>',
  floppy: '<rect x="6" y="8" width="20" height="18" rx="2"/><rect x="11" y="8" width="10" height="7"/><rect x="10" y="18" width="12" height="6"/>',
  tape: '<rect x="5" y="10" width="22" height="13" rx="3"/><circle cx="11" cy="16.5" r="3"/><circle cx="21" cy="16.5" r="3"/>',
  compass: '<circle cx="16" cy="16" r="10"/><path d="M12 20l3-6 5-2-3 6z"/>',
  phone: '<rect x="6" y="11" width="20" height="13" rx="3"/><circle cx="16" cy="17.5" r="4"/><path d="M9 8h14"/>',
  coin: '<circle cx="16" cy="16" r="9"/><path d="M16 11v10M13 13h5a2.5 2.5 0 0 1 0 5h-5"/>',
  vase: '<path d="M12 8h8l-1 4a9 9 0 0 1 3 7 4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4 9 9 0 0 1 3-7z"/>',
  glass: '<path d="M11 7l3 9 3-9z"/><path d="M14 16v7"/><path d="M10 24h8"/>',
  candle: '<rect x="12" y="12" width="8" height="12" rx="2"/><path d="M16 12V8"/><path d="M16 5l2 3h-4z"/>',
  crown: '<path d="M7 22l1-10 5 4 3-6 3 6 5-4 1 10z"/>',
  clover: '<path d="M16 16a4 4 0 1 1 4-4 4 4 0 1 1 0 8 4 4 0 1 1-4 4 4 4 0 1 1-8 0 4 4 0 1 1 0-8 4 4 0 1 1 4-4z"/><path d="M16 16v8"/>',
  fish: '<path d="M8 16c4-6 12-7 16-2 2 2 2 4 0 6-4 5-12 4-16-2z"/><path d="M24 16l4-4v8z"/><circle cx="13" cy="14.5" r="1"/>'
};

/* ============================================================
   РОУТИНГ
   ============================================================ */
function boot() {
  if (typeof progressInit === 'function') progressInit();
  renderFilters();
  renderGrid();
  bindSearch();
  bindJunk();
  bindRipple();
  bindTilt();
  bindCursor();
  bindReveal();
  bindSecrets();
  applyNight(savedNight());
  addEventListener('resize', () => {
    const view = $('#game-view');
    if (view && view.classList.contains('wide')) {
      fitStage();
      const c = $('#game-stage canvas');
      if (c) fitCanvas(c, true);
    }
  });
}

function goHome() { closeGame(); }

function openGame(id) {
  const g = GAMES[id];
  if (!g) return;
  closeGame();

  $('#home').style.display = 'none';
  $('#game-title').textContent = g.name;
  setScore('');
  const view = $('#game-view');
  view.classList.add('active');
  const stage = $('#game-stage');
  stage.innerHTML = '';

  const api = makeApi(stage);
  try {
    const extra = g.mount(stage, api);
    currentGame = {
      id,
      cleanup: () => {
        api._cleanups.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
        if (typeof extra === 'function') { try { extra(); } catch (e) { console.error(e); } }
      }
    };
  } catch (err) {
    stage.innerHTML = '<p class="g-hint">Не запустилось: ' + esc(err.message) + '</p>';
    console.error(err);
    currentGame = { id, cleanup: () => api._cleanups.forEach(fn => { try { fn(); } catch (e) { } }) };
  }
  const hb = $('#game-help-btn');
  if (hb) hb.onclick = () => openHelp(id);
  /* По умолчанию игра открывается на весь экран — на телефоне и ПК это
     главный сценарий, узкое поле в центре смотрелось потерянно. */
  setWide(typeof SET !== 'undefined' ? SET.wide : true);
  const wb = $('#game-wide-btn');
  if (wb) wb.onclick = () => setWide(!$('#game-view').classList.contains('wide'));
  if (typeof SFX === 'function' || (typeof SFX !== 'undefined' && SFX)) SFX.unlock();
  if (typeof MUSIC !== 'undefined' && MUSIC) MUSIC.sync(true);
  trackPlayed(id);
  if (typeof progressPlay === 'function') progressPlay(id);
  refreshCards();
}

/* Широкий режим: игра занимает почти весь экран без перезапуска */
function setWide(on) {
  const view = $('#game-view');
  const wb = $('#game-wide-btn');
  if (!view) return;
  view.classList.toggle('wide', !!on);
  if (wb) {
    wb.classList.toggle('on', !!on);
    wb.title = on ? 'Вернуть обычный размер' : 'Развернуть на весь экран';
  }
  /* --board — сторона квадрата поля: меньшая из доступных.
     Считаем сразу, иначе первый кадр рисуется в старом размере. */
  fitStage();
  requestAnimationFrame(() => {
    fitStage();
    const c = $('#game-stage canvas');
    if (c) fitCanvas(c, !!on);
  });
}

/* Пересчёт размера игрового поля под текущее окно.
   --board — сторона квадрата: меньшее из доступных. Высоту, которую
   занимают кнопки и подписи, измеряем по факту, а не угадываем.
   Экранные контролы (крестовина, ряд кнопок, стик) тоже учитываем:
   в ландшафте они иначе выдавливают поле за пределы экрана. */
function stageExtras(stage, skip) {
  const row = getComputedStyle(stage).flexDirection === 'row';
  let h = 0, w = 0;
  stage.querySelectorAll(':scope > .game-controls, :scope > .g-prompt, :scope > .g-hint, :scope > .g-stat, :scope > .g-dpad, :scope > .g-pad, :scope > .g-stick')
    .forEach(n => {
      if (n === skip) return;
      const r = n.getBoundingClientRect();
      if (!r.height && !r.width) return;
      if (row) w += r.width + 12; else h += r.height + 8;
    });
  return { h, w };
}

function fitStage() {
  const view = $('#game-view');
  if (!view) return;
  if (!view.classList.contains('wide')) { view.style.removeProperty('--board'); return; }
  const body = $('.game-body');
  const stage = $('#game-stage');
  if (!body || !stage) return;
  const cs = getComputedStyle(body);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const extra = stageExtras(stage, null);
  const w = body.clientWidth - padX - extra.w;
  const h = body.clientHeight - padY - extra.h;
  const side = Math.max(160, Math.min(w, h));
  view.style.setProperty('--board', Math.round(side) + 'px');
}

function fitCanvas(c, wide) {
  if (!c._base) c._base = { w: c.width, h: c.height };
  if (!wide) {
    c.style.width = '';
    c.style.height = '';
    return;
  }
  const body = $('.game-body');
  const stage = $('#game-stage');
  if (!body || !stage) return;
  const cs = getComputedStyle(body);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const extra = stageExtras(stage, c);
  const availW = Math.max(160, body.clientWidth - padX - extra.w);
  const availH = Math.max(160, body.clientHeight - padY - extra.h);
  const ratio = c._base.w / c._base.h;
  let w = availW, h = w / ratio;
  if (h > availH) { h = availH; w = h * ratio; }
  c.style.width = Math.round(w) + 'px';
  c.style.height = Math.round(h) + 'px';
}

function closeGame() {
  if (currentGame && typeof currentGame.cleanup === 'function') {
    try { currentGame.cleanup(); } catch (e) { console.error(e); }
  }
  currentGame = null;
  $$('.game-view').forEach(v => v.classList.remove('active'));
  const home = $('#home');
  if (home) home.style.display = '';
  const stage = $('#game-stage');
  if (stage) stage.innerHTML = '';
  if (typeof MUSIC !== 'undefined' && MUSIC) MUSIC.sync(false);
  if (typeof progressLeave === 'function') progressLeave();
  refreshCards();
}

/* Обновляем отметки «сыграно» без пересоздания карточек */
function refreshCards() {
  if (typeof P === 'undefined' || !P) return;
  $$('.card').forEach(card => {
    const on = P.unique.includes(card.dataset.id);
    card.classList.toggle('played', on);
    const marker = card.querySelector('.card-marker');
    if (on && marker) marker.remove();
  });
}

/* ---------- Подсказки у карточек ----------
   Делегирование на document: карточки пересоздаются при поиске/фильтре,
   а навесанные на них слушатели оставляли тултип «залипшим» до перезагрузки. */
let tipTimer = null;
let tipFor = null;
let tipBound = false;

function hideTip() {
  clearTimeout(tipTimer);
  tipFor = null;
  const tip = $('#tip');
  if (tip) tip.classList.remove('show');
}

function showTip(btn) {
  const tip = $('#tip');
  if (!tip || !btn || !btn.isConnected) return;
  const id = btn.dataset.help;
  const help = (typeof gameHelp === 'function') ? gameHelp(id) : { h: '' };
  tip.innerHTML = '<b>что делать</b>' + esc(help.h);
  tip.classList.add('show');
  const r = btn.getBoundingClientRect();
  const w = Math.min(270, innerWidth - 24);
  tip.style.width = w + 'px';
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(12, Math.min(innerWidth - w - 12, left));
  let top = r.bottom + 10;
  const th = tip.offsetHeight || 90;
  if (top + th > innerHeight - 12) top = Math.max(12, r.top - th - 10);
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
  tipFor = btn;
}

function bindHelp() {
  if (tipBound) return;
  tipBound = true;

  document.addEventListener('mouseover', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-help]') : null;
    if (btn === tipFor) return;
    clearTimeout(tipTimer);
    if (!btn) { hideTip(); return; }
    tipTimer = setTimeout(() => showTip(btn), 140);
  });

  document.addEventListener('mouseout', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-help]') : null;
    if (!btn) return;
    if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
    hideTip();
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-help]') : null;
    if (!btn) return;
    e.stopPropagation();
    e.preventDefault();
    hideTip();
    openHelp(btn.dataset.help);
  }, true);

  document.addEventListener('focusin', (e) => {
    const btn = e.target.closest ? e.target.closest('[data-help]') : null;
    if (btn) showTip(btn); else hideTip();
  });
  document.addEventListener('focusout', hideTip);

  /* любое движение страницы/размер окна делает прежние координаты неверными */
  addEventListener('scroll', hideTip, { passive: true, capture: true });
  addEventListener('resize', hideTip);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });
}

/* ---------- API игры ---------- */
function makeApi(stage) {
  const api = {
    stage,
    el(tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    },
    score(v) { setScore(v); },
    bump() { bumpScore(); },
    pal() { return skinPalette(); },
    overlay(emoji, title, text, onClose) { showOverlay(emoji, title, text, onClose); },
    confetti,
    rnd: (n) => Math.floor(Math.random() * n),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    canvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      stage.appendChild(c);
      return c;
    },
    btn(label, onClick, secondary) {
      const b = document.createElement('button');
      b.className = 'game-btn' + (secondary ? ' secondary' : '');
      b.textContent = label;
      b.onclick = onClick;
      return b;
    },
    controls(...nodes) {
      const row = api.el('div', 'game-controls');
      nodes.forEach(n => n && row.appendChild(n));
      stage.appendChild(row);
      return row;
    },
    hint(text) {
      const p = api.el('p', 'g-hint', text);
      stage.appendChild(p);
      return p;
    },
    keys(handler) {
      const fn = (e) => handler(e);
      document.addEventListener('keydown', fn);
      api._cleanups.push(() => document.removeEventListener('keydown', fn));
      return fn;
    },
    /* ---------- ввод: мышь и палец одинаково ----------
       pointer-события покрывают оба случая, поэтому отдельные touch-
       обработчики не нужны. Координаты сразу пересчитываются в систему
       канваса (0..W, 0..H), чтобы игры не думали о масштабе. */
    ptr(c, handlers) {
      const toLocal = (e) => {
        const r = c.getBoundingClientRect();
        return {
          x: (e.clientX - r.left) * (c.width / r.width),
          y: (e.clientY - r.top) * (c.height / r.height),
          cx: e.clientX - r.left,
          cy: e.clientY - r.top,
          w: r.width, h: r.height
        };
      };
      const down = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        try { c.setPointerCapture && c.setPointerCapture(e.pointerId); } catch (_) { }
        handlers.down && handlers.down(toLocal(e), e);
      };
      const move = (e) => { handlers.move && handlers.move(toLocal(e), e); };
      const up = (e) => { handlers.up && handlers.up(toLocal(e), e); };
      c.addEventListener('pointerdown', down);
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
      api._cleanups.push(() => {
        c.removeEventListener('pointerdown', down);
        c.removeEventListener('pointermove', move);
        c.removeEventListener('pointerup', up);
        c.removeEventListener('pointercancel', up);
      });
      return { toLocal };
    },
    /* Свайп по канвасу: dir — 'U' | 'D' | 'L' | 'R' */
    swipe(c, handler, minDist) {
      let sx = 0, sy = 0, active = false;
      const min = minDist || 24;
      api.ptr(c, {
        down(p) { sx = p.cx; sy = p.cy; active = true; },
        up(p) {
          if (!active) return;
          active = false;
          const dx = p.cx - sx, dy = p.cy - sy;
          if (Math.abs(dx) < min && Math.abs(dy) < min) return;
          handler(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
        }
      });
    },
    /* Тап по канвасу — координаты в пикселях канваса */
    tap(c, handler) {
      let sx = 0, sy = 0;
      api.ptr(c, {
        down(p) { sx = p.cx; sy = p.cy; },
        up(p) {
          if (Math.hypot(p.cx - sx, p.cy - sy) > 18) return;
          handler(p);
        }
      });
    },
    /* Экранная крестовина. onDir(dir) получает 'U','D','L','R',
       onEnd() — когда палец отпущен (для плавного торможения). */
    dpad(onDir, onEnd) {
      const wrap = api.el('div', 'g-dpad');
      const mk = (dir, cls, svg) => {
        const b = api.el('button', 'g-dpad-btn ' + cls);
        b.type = 'button';
        b.setAttribute('aria-label', dir);
        b.innerHTML = svg;
        let held = false;
        const press = (e) => {
          e.preventDefault();
          if (held) return;
          held = true;
          b.classList.add('on');
          onDir(dir);
        };
        const release = () => {
          if (!held) return;
          held = false;
          b.classList.remove('on');
          onEnd && onEnd(dir);
        };
        b.addEventListener('pointerdown', press);
        b.addEventListener('pointerup', release);
        b.addEventListener('pointercancel', release);
        b.addEventListener('pointerleave', release);
        wrap.appendChild(b);
      };
      const arrow = (d) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
      mk('U', 'up', arrow('M12 19V5M5 12l7-7 7 7'));
      mk('L', 'left', arrow('M19 12H5M12 5l-7 7 7 7'));
      mk('R', 'right', arrow('M5 12h14M12 5l7 7-7 7'));
      mk('D', 'down', arrow('M12 5v14M5 12l7 7 7-7'));
      stage.appendChild(wrap);
      return wrap;
    },
    /* Ряд экранных кнопок: [{label|svg, onDown, onUp, wide}] */
    padButtons(list) {
      const row = api.el('div', 'g-pad');
      list.forEach(cfg => {
        const b = api.el('button', 'g-pad-btn' + (cfg.wide ? ' wide' : ''));
        b.type = 'button';
        b.innerHTML = cfg.svg || cfg.label;
        let held = false;
        const down = (e) => {
          e.preventDefault();
          if (held) return;
          held = true;
          b.classList.add('on');
          cfg.onDown && cfg.onDown();
        };
        const up = () => {
          if (!held) return;
          held = false;
          b.classList.remove('on');
          cfg.onUp && cfg.onUp();
        };
        b.addEventListener('pointerdown', down);
        b.addEventListener('pointerup', up);
        b.addEventListener('pointercancel', up);
        b.addEventListener('pointerleave', up);
        row.appendChild(b);
      });
      stage.appendChild(row);
      return row;
    },
    /* Виртуальный стик: onMove(dx, dy) в диапазоне -1..1 */
    stick(onMove, onEnd) {
      const pad = api.el('div', 'g-stick');
      const knob = api.el('div', 'g-stick-knob');
      pad.appendChild(knob);
      let id = null, cx = 0, cy = 0, R = 46;
      const start = (e) => {
        if (id !== null) return;
        e.preventDefault();
        id = e.pointerId;
        const r = pad.getBoundingClientRect();
        R = r.width / 2 - 16;
        cx = r.left + r.width / 2;
        cy = r.top + r.height / 2;
        try { pad.setPointerCapture && pad.setPointerCapture(e.pointerId); } catch (_) { }
        move(e);
      };
      const move = (e) => {
        if (id !== e.pointerId) return;
        let dx = e.clientX - cx, dy = e.clientY - cy;
        const d = Math.hypot(dx, dy);
        if (d > R) { dx = dx / d * R; dy = dy / d * R; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        onMove(dx / R, dy / R);
      };
      const end = (e) => {
        if (id !== e.pointerId) return;
        id = null;
        knob.style.transform = '';
        onEnd && onEnd();
      };
      pad.addEventListener('pointerdown', start);
      pad.addEventListener('pointermove', move);
      pad.addEventListener('pointerup', end);
      pad.addEventListener('pointercancel', end);
      stage.appendChild(pad);
      return pad;
    },
    isTouch() {
      return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    },
    every(ms, fn) {
      const id = setInterval(fn, ms);
      api._cleanups.push(() => clearInterval(id));
      return id;
    },
    loop(fn) {
      let raf = null, alive = true;
      const tick = (t) => { if (!alive) return; fn(t); raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      const stop = () => { alive = false; if (raf) cancelAnimationFrame(raf); };
      api._cleanups.push(stop);
      return { stop };
    },
    _cleanups: [],
    onCleanup(fn) { api._cleanups.push(fn); }
  };
  return api;
}

/* ============================================================
   ПАЛИТРА СКИНА ДЛЯ CANVAS-ИГР
   Игровые объекты (змейка, мяч, ракетка, пузыри…) берут цвета из
   выбранного скина, а не из жёсткой константы.
   ============================================================ */
const SKIN_PALETTE = {
  emerald: { a: '#c6ff3d', b: '#4dd4ff', dark: '#12200a', sky: ['#1a2b10', '#0d1508'] },
  sunset: { a: '#ff8a5c', b: '#ffcc4d', dark: '#2a1508', sky: ['#3a1d10', '#1c0d08'] },
  ocean: { a: '#4dd4ff', b: '#8f9dff', dark: '#08202a', sky: ['#0c2036', '#07121f'] },
  mint: { a: '#5fe8b0', b: '#a8ffe0', dark: '#08281e', sky: ['#0c2a20', '#071a14'] },
  cherry: { a: '#ff6f9c', b: '#ffb3c9', dark: '#2a0c18', sky: ['#33101f', '#1a0810'] },
  gold: { a: '#ffcf4d', b: '#ffe9a8', dark: '#2a2008', sky: ['#33260c', '#1c1406'] },
  lavender: { a: '#c9a4ff', b: '#e8d6ff', dark: '#1c1030', sky: ['#241640', '#140a24'] }
};

/* Палитра скина с учётом оформления.
   В современной теме игровое поле тёмное, чтобы канвас не «выжигал» глаз
   белым прямоугольником на тёмной странице. В детской и бумажной — светлое. */
function skinPalette() {
  const key = (typeof P !== 'undefined' && P && P.skin) ? P.skin : 'emerald';
  const base = SKIN_PALETTE[key] || SKIN_PALETTE.emerald;
  const theme = document.documentElement.dataset.theme || 'modern';

  if (theme === 'modern') {
    return {
      theme, a: base.a, b: base.b,
      ink: '#e8ecf3',
      paper: '#0d0f14',
      field: '#12151c',
      line: 'rgba(255,255,255,.08)',
      sky: ['#0d1017', '#161a22']
    };
  }
  if (theme === 'kids') {
    return {
      theme,
      a: shade(base.a, -0.2), b: shade(base.b, -0.12),
      ink: '#0d1f38', paper: '#ffffff', field: '#eaf4ff',
      line: 'rgba(23,58,110,.14)',
      sky: ['#dff1ff', '#eaf7ff']
    };
  }
  return {
    theme,
    a: base.a, b: base.b,
    ink: '#e8ecf3', paper: '#0d0f14', field: '#12151c',
    line: 'rgba(255,255,255,.08)',
    sky: ['#0d1017', '#161a22']
  };
}

/* ============================================================
   ПОРЯДОК В КАТАЛОГЕ
   Сначала игры, в которые интересно играть дольше минуты: там есть
   анимация, прогресс и понятная цель. Простые «на один клик» — ниже,
   чтобы каталог не начинался со случайных заглушек.
   ============================================================ */
const GAME_TIER = {
  /* 3 — самые проработанные */
  snake: 3, breakout: 3, runner: 3, game2048: 3, memory: 3, minesweeper: 3,
  sudoku: 3, tictactoe: 3, hanoi: 3, simon: 3, sortcolors: 3, findpair: 3,
  flappy: 3, asteroids: 3, stacker: 3, sliding: 3, bubbles: 3, catcher: 3,
  pong: 3, jumper: 3, dodge: 3, whackamole: 3,

  /* 2 — хорошие, с раундами */
  reaction: 2, sequence: 2, evenodd: 2, compare: 2, palindrome: 2, spotdiff: 2,
  clicker: 2, finddigit: 2, arrows: 2, filler: 2, binary: 2, roman: 2,
  stroop: 2, pairmatch: 2, math: 2, anagram: 2, wordcount: 2, oddone: 2,
  dice: 2, coin: 2, slots: 2, wheel: 2, guessnum: 2, rps: 2, higherlower: 2,
  lottery: 2, scratch: 2, roulette: 2, plinko: 2, crash: 2,
  tapgreen: 2, countdots: 2, oddword: 2, typefast: 2, sortnum: 2, sameemoji: 2,
  stoptimer: 2, lettercount: 2, wordscramble: 2, capital: 2, primecheck: 2,
  bitclick: 2, longestword: 2, colorcode: 2, taprhythm: 2, diceguess: 2,
  mirrorletter: 2, biggerbox: 2, spintarget: 2, mathchain: 2, findsymbol: 2,
  evencount: 2, aimclick: 2, emojiquiz: 2,

  secretcat: 0
};

function gameTier(id) {
  return GAME_TIER[id] === undefined ? 1 : GAME_TIER[id];
}

/* ============================================================
   КАТАЛОГ
   ============================================================ */
let activeFilter = 'Все';
let searchQuery = '';

function renderFilters() {
  const cats = ['Все', ...new Set(GAME_ORDER.filter(id => !GAMES[id].hidden).map(id => GAMES[id].cat))];
  const box = $('#filters');
  box.innerHTML = '';
  cats.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'chip' + (c === activeFilter ? ' active' : '');
    b.textContent = c === 'Все' ? 'все' : c;
    b.style.animation = `fadeUp .35s ${(i * .035).toFixed(2)}s both`;
    b.onclick = () => {
      activeFilter = c;
      if (typeof SFX !== 'undefined') SFX.tab();
      renderFilters(); renderGrid();
    };
    box.appendChild(b);
  });
}

function renderGrid() {
  const grid = $('#grid');
  grid.innerHTML = '';
  const q = searchQuery.toLowerCase().trim();
  const list = GAME_ORDER.filter(id => {
    const g = GAMES[id];
    if (g.hidden) return false;
    const okCat = activeFilter === 'Все' || g.cat === activeFilter;
    const okQ = !q || g.name.toLowerCase().includes(q) || (g.desc || '').toLowerCase().includes(q);
    return okCat && okQ;
  });

  /* В общем списке сначала самые проработанные, внутри группы — по алфавиту.
     В конкретной категории сохраняем порядок автора: там он осмысленный. */
  if (activeFilter === 'Все' && !q) {
    list.sort((a, b) => {
      const ta = gameTier(a), tb = gameTier(b);
      if (ta !== tb) return tb - ta;
      return GAMES[a].name.localeCompare(GAMES[b].name, 'ru');
    });
  }

  const played = (typeof P !== 'undefined' && P) ? P.unique : [];

  list.forEach((id, i) => {
    const g = GAMES[id];
    const isPlayed = played.includes(id);
    const card = document.createElement('div');
    card.className = 'card' + (isPlayed ? ' played' : '');
    card.dataset.cat = g.cat;
    card.dataset.id = id;
    card.style.setProperty('--d', Math.min(i * 0.016, 0.42) + 's');
    card.innerHTML = `
      <div class="card-visual">${coverSVG(id, g.cat)}</div>
      ${isPlayed ? '' : '<span class="card-marker">новая</span>'}
      <button class="card-help" type="button" aria-label="Как играть: ${esc(g.name)}" data-help="${id}">
        <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11"/><path d="M13 13a3 3 0 1 1 4 2.8c-.8.4-1 .9-1 1.7"/><circle cx="16" cy="22" r="1.2" fill="currentColor"/></svg>
      </button>
      <div class="card-info">
        <h3>${esc(g.name)}</h3>
        <p>${esc(g.desc || '')}</p>
        <span class="tag">${esc(g.cat)}</span>
      </div>
      <div class="card-progress"><i></i></div>`;
    card.onclick = (e) => {
      if (e.target.closest('[data-help]')) return;
      openGame(id);
    };
    grid.appendChild(card);
  });

  bindHelp();

  const empty = $('#empty-hint');
  if (empty) empty.hidden = list.length > 0;
  bindTilt();
}

/* Обложки зависят от темы: перерисовываем их без пересборки сетки */
function refreshCovers() {
  $('.card').forEach(card => {
    const id = card.dataset.id;
    const g = GAMES[id];
    const v = card.querySelector('.card-visual');
    if (v && g) v.innerHTML = coverSVG(id, g.cat);
  });
}

function bindSearch() {
  const inp = $('#search');
  if (!inp) return;
  let t = null;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { searchQuery = inp.value; renderGrid(); }, 110);
  });
}

/* ---------- Очки ---------- */
function setScore(v) {
  const el = $('#game-score');
  if (!el) return;
  el.textContent = v == null ? '' : v;
}
function bumpScore() {
  const el = $('#game-score');
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
  if (typeof SFX !== 'undefined') SFX.score();
}

/* ---------- Оверлей ---------- */
let overlayCb = null;

/* Эмодзи в оверлее заменяем на вектор, чтобы интерфейс не выглядел «смайликовым» */
const OVERLAY_ICON = {
  '🎉': '<path d="M6 26l7-18 11 11z"/><path d="M22 5v4M20 7h4M27 12l-3 2M14 4l1 3M4 12l3 1"/>',
  '🏆': '<path d="M10 5h12v7a6 6 0 0 1-12 0z"/><path d="M10 7H6v2a4 4 0 0 0 4 4M22 7h4v2a4 4 0 0 1-4 4"/><path d="M16 18v5M11 27h10"/>',
  '⏱️': '<circle cx="16" cy="17" r="10"/><path d="M16 11v6l4 3M12 4h8"/>',
  '💀': '<path d="M8 14a8 8 0 1 1 16 0c0 4-2 5-2 7h-12c0-2-2-3-2-7z"/><circle cx="13" cy="14" r="1.8"/><circle cx="19" cy="14" r="1.8"/><path d="M13 21v4M19 21v4"/>',
  '💥': '<path d="M16 3l3 8 8-4-4 8 8 3-8 3 4 8-8-4-3 8-3-8-8 4 4-8-8-3 8-3-4-8 8 4z"/>',
  '🎯': '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="1.6"/>',
  '😅': '<circle cx="16" cy="16" r="11"/><path d="M11 14h.01M21 14h.01M11 20c2 2 8 2 10 0"/>',
  '💸': '<rect x="3" y="9" width="26" height="14" rx="3"/><circle cx="16" cy="16" r="4"/><path d="M8 16h.01M24 16h.01"/>',
  '🙈': '<circle cx="16" cy="16" r="11"/><path d="M10 14c1.5-1.5 3.5-1.5 5 0M17 14c1.5-1.5 3.5-1.5 5 0M11 21c3 1.5 7 1.5 10 0"/>',
  '🐈': '<path d="M9 12l-1-6 5 3h6l5-3-1 6v6a7 7 0 0 1-14 0z"/><circle cx="13" cy="14" r="1.4"/><circle cx="19" cy="14" r="1.4"/>',
  '🃏': '<rect x="6" y="4" width="16" height="22" rx="3"/><path d="M12 10l4 5-4 5-4-5z"/>',
  '🎲': '<rect x="4" y="4" width="24" height="24" rx="6"/><circle cx="11" cy="11" r="1.6"/><circle cx="21" cy="21" r="1.6"/><circle cx="16" cy="16" r="1.6"/>',
  '🎡': '<circle cx="16" cy="16" r="11"/><path d="M16 5v22M5 16h22M8 8l16 16M24 8L8 24"/>',
  '⚡': '<path d="M18 3L7 18h6l-2 11 12-16h-7z"/>',
  '🔮': '<path d="M16 5l9 9-9 9-9-9z"/><path d="M9 24h14"/>',
  '🪙': '<circle cx="16" cy="16" r="11"/><path d="M16 9v14M13 12h5a3 3 0 0 1 0 6h-5"/>',
  '📈': '<path d="M4 26V6M4 26h24"/><path d="M8 21l6-6 5 4 7-9"/>',
  '🤝': '<path d="M4 17l5-5 6 5 3-2 8 7-4 5-7-4-5 3-6-6z"/>',
  '👆': '<path d="M13 14V6a2.5 2.5 0 0 1 5 0v9"/><path d="M18 15V9a2.5 2.5 0 0 1 5 0v11a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8v-4a2.5 2.5 0 0 1 5 0v3"/>',
  '🤔': '<circle cx="16" cy="16" r="11"/><path d="M12 13a4 4 0 1 1 5 3.7c-.9.4-1.2 1-1.2 1.9"/><circle cx="16" cy="23" r="1.2" fill="currentColor"/>',
  '😶': '<circle cx="16" cy="16" r="11"/><path d="M11 13h2M19 13h2M12 21h8"/>'
};
function overlayIcon(emoji) {
  const body = OVERLAY_ICON[emoji] || OVERLAY_ICON['🎉'];
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

function showOverlay(emoji, title, text, onClose) {
  $('#overlay-emoji').innerHTML = overlayIcon(emoji);
  $('#overlay-title').textContent = title;
  $('#overlay-text').textContent = text;
  const xp = $('#overlay-xp');
  const won = /побед|выигр|успех|открыт|наш|собрал|реш|готов|забран|верно|угадал/i.test(title);
  const lost = /проигр|промах|кончен|вышло|попал|упал|взрыв|бах|нет/i.test(title);
  if (xp) {
    const gain = won ? 12 : 7;
    xp.innerHTML = `<b>+${gain}</b> опыта за раунд`;
    xp.className = 'overlay-xp' + (won ? ' win' : '');
    if (typeof progressRound === 'function') progressRound();
  }
  if (typeof SFX !== 'undefined') { if (won) SFX.win(); else if (lost) SFX.lose(); }
  overlayCb = onClose || null;
  $('#overlay').classList.add('active');
}
function hideOverlay() {
  $('#overlay').classList.remove('active');
  const cb = overlayCb;
  overlayCb = null;
  if (cb) cb();
}

/* ---------- Конфетти ---------- */
function confetti(n) {
  const c = $('#confetti');
  if (!c) return;
  c.width = innerWidth; c.height = innerHeight;
  c.style.display = 'block';
  const ctx = c.getContext('2d');
  const colors = ['#c6ff3d', '#4dd4ff', '#ff7a59', '#ffcc4d', '#d98cff', '#ffffff'];
  const count = n || 120;
  const P = Array.from({ length: count }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * .3,
    w: 3 + Math.random() * 5, h: 6 + Math.random() * 8,
    c: colors[Math.random() * colors.length | 0],
    vy: 2 + Math.random() * 4.5, vx: -2 + Math.random() * 4,
    rot: Math.random() * 360, vr: -9 + Math.random() * 18,
    wob: Math.random() * 6
  }));
  let t = 0;
  (function loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    t++;
    P.forEach(p => {
      p.y += p.vy; p.x += p.vx + Math.sin((t + p.wob) / 18) * .8; p.vy += .03; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.max(0, 1 - t / 250);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t < 240) requestAnimationFrame(loop);
    else { ctx.clearRect(0, 0, c.width, c.height); c.style.display = 'none'; }
  })();
}

/* ---------- Ripple ---------- */
function bindRipple() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.game-btn, .nav button, .chip, .back-btn, .hud-tickets, .theme-btn');
    if (!b) return;
    if (typeof SFX !== 'undefined') SFX.tap();
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = b.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.1;
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size / 2) + 'px';
    r.style.top = (e.clientY - rect.top - size / 2) + 'px';
    b.appendChild(r);
    setTimeout(() => r.remove(), 620);
  });
}

/* ---------- 3D-наклон ---------- */
function bindTilt() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('.card').forEach(card => {
    if (card._tiltBound) return;
    card._tiltBound = true;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      card.style.transform =
        `perspective(900px) rotateY(${(px * 7).toFixed(2)}deg) rotateX(${(-py * 7).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ---------- Курсор: светящийся след ---------- */
function bindCursor() {
  const c = $('#cursor');
  if (!c) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(pointer: fine)').matches) return;
  c.width = innerWidth; c.height = innerHeight;
  const ctx = c.getContext('2d');
  const pts = [];
  addEventListener('mousemove', (e) => {
    pts.push({ x: e.clientX, y: e.clientY, life: 1, r: 3 + Math.random() * 5 });
    if (pts.length > 26) pts.shift();
  }, { passive: true });
  addEventListener('resize', () => { c.width = innerWidth; c.height = innerHeight; });
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.life *= .92;
      ctx.globalAlpha = p.life * .30;
      ctx.fillStyle = '#c6ff3d';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  })();
}

/* ---------- Reveal ---------- */
function bindReveal() {
  const targets = $$('.ad-slot, .junk, .footer');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: .1 });
  targets.forEach(t => { t.classList.add('reveal'); io.observe(t); });
}

/* ============================================================
   МУСОРНЫЙ ДРОП
   ============================================================ */
const JUNK = [
  { i: 'sock', n: 'Один носок', r: 'common' },
  { i: 'spoon', n: 'Погнутая ложка', r: 'common' },
  { i: 'rock', n: 'Просто камень', r: 'common' },
  { i: 'clip', n: 'Скрепка', r: 'common' },
  { i: 'leaf', n: 'Сухой лист', r: 'common' },
  { i: 'roll', n: 'Втулка от бумаги', r: 'common' },
  { i: 'battery', n: 'Севшая батарейка', r: 'common' },
  { i: 'cable', n: 'Кабель без устройства', r: 'common' },
  { i: 'cup', n: 'Стаканчик', r: 'common' },
  { i: 'plaster', n: 'Использованный пластырь', r: 'common' },
  { i: 'bolt', n: 'Болт без гайки', r: 'common' },
  { i: 'statue', n: 'Статуэтка', r: 'rare' },
  { i: 'key', n: 'Ключ от неизвестного', r: 'rare' },
  { i: 'floppy', n: 'Дискета 1.44 МБ', r: 'rare' },
  { i: 'tape', n: 'Кассета без плёнки', r: 'rare' },
  { i: 'compass', n: 'Компас без стрелки', r: 'rare' },
  { i: 'phone', n: 'Дисковый телефон', r: 'rare' },
  { i: 'coin', n: 'Монета несуществующей страны', r: 'epic' },
  { i: 'vase', n: 'Амфора', r: 'epic' },
  { i: 'glass', n: 'Стекляшка', r: 'epic' },
  { i: 'candle', n: 'Свеча без фитиля', r: 'epic' },
  { i: 'crown', n: 'Корона из фольги', r: 'legendary' },
  { i: 'clover', n: 'Четырёхлистник', r: 'legendary' },
  { i: 'fish', n: 'Золотая рыбка (резиновая)', r: 'legendary' }
];
const RARITY_W = { common: 62, rare: 25, epic: 10, legendary: 3 };
const RARITY_NAME = { common: 'обычный', rare: 'редкий', epic: 'эпический', legendary: 'легендарный' };

function junkSVG(key) {
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${JUNK_ICON[key] || JUNK_ICON.rock}</svg>`;
}

let junkCount = 0;
const junkHistory = [];

function bindJunk() {
  const btn = $('#junk-btn');
  if (!btn) return;
  const item = $('#junk-item');
  const name = $('#junk-name');
  const rar = $('#junk-rarity');
  const log = $('#junk-log');

  function rollRarity() {
    if (junkCount > 0 && junkCount % 17 === 0) return 'legendary';
    const total = Object.values(RARITY_W).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [r, w] of Object.entries(RARITY_W)) {
      roll -= w;
      if (roll <= 0) return r;
    }
    return 'common';
  }

  btn.onclick = () => {
    junkCount++;
    const rarity = rollRarity();
    const pool = JUNK.filter(j => j.r === rarity);
    const pick = pool[Math.floor(Math.random() * pool.length)];

    item.innerHTML = junkSVG(pick.i);
    item.classList.remove('rolling');
    void item.offsetWidth;
    item.classList.add('rolling');
    name.textContent = pick.n;
    rar.textContent = RARITY_NAME[rarity];
    rar.className = 'junk-rarity ' + rarity;

    junkHistory.unshift(pick.i);
    if (junkHistory.length > 14) junkHistory.pop();
    log.innerHTML = junkHistory.map(k => `<span>${junkSVG(k)}</span>`).join('');

    if (rarity === 'legendary') confetti(150);

    if (junkCount === 10) toast('десять предметов. коллекция растёт.');
    if (junkCount === 50) toast('пятьдесят дропов. упорно.');
    if (junkCount === 100) { toast('сто. вот это настойчивость.'); confetti(200); }
  };
}

/* ============================================================
   ПАСХАЛКИ
   ============================================================ */
const FLAVOR = [
  'тут ничего нет. правда.',
  'эта точка ничего не делает. но кликать приятно.',
  'ты нашёл пустоту. поздравляю.',
  'ладно, признаюсь: я просто люблю, когда кликают.',
  'если ты это читаешь — ты любопытный. это хорошо.'
];

let toastTimer = null;
function toast(msg, ms) {
  const el = $('#secret-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2800);
}

function savedNight() {
  try { return localStorage.getItem('pg_night') === '1'; } catch (e) { return false; }
}
function applyNight(on) {
  document.body.classList.toggle('night', !!on);
  const b = $('#night-btn');
  if (b) b.textContent = on ? '☀' : '☾';
  try { localStorage.setItem('pg_night', on ? '1' : '0'); } catch (e) { }
}

const PLAYED = new Set();
function trackPlayed(id) {
  const before = PLAYED.size;
  PLAYED.add(id);
  if (PLAYED.size !== before) {
    if (PLAYED.size === 25) toast('25 разных игр открыто.');
    if (PLAYED.size === 50) toast('50 игр. ты почти всё видел.');
    if (PLAYED.size === 76) { toast('все 76. уважение.'); confetti(220); }
  }
}

function bindSecrets() {
  /* Konami → хаос */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kIdx = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === KONAMI[kIdx]) {
      kIdx++;
      if (kIdx === KONAMI.length) {
        kIdx = 0;
        document.body.classList.toggle('chaos');
        toast(document.body.classList.contains('chaos')
          ? '↑↑↓↓←→←→BA — хаос включён'
          : 'хаос выключен.');
        confetti(80);
      }
    } else {
      kIdx = (e.key === KONAMI[0]) ? 1 : 0;
    }
  });

  /* Семь кликов по логотипу → секретная игра */
  const logo = $('#logo');
  let logoClicks = 0, logoTimer = null;
  if (logo) {
    logo.onclick = () => {
      logoClicks++;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(() => logoClicks = 0, 1500);
      logo.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 260 });
      if (logoClicks === 7) {
        logoClicks = 0;
        toast('нашёл. открываю…', 1600);
        setTimeout(() => openGame('secretcat'), 650);
      } else if (logoClicks >= 4) {
        toast(['ещё…', 'ещё чуть-чуть…', 'почти.'][logoClicks - 4], 1100);
      }
    };
  }

  /* Точки в футере */
  const d1 = $('#dot1'), d2 = $('#dot2');
  if (d1) d1.onclick = () => toast(FLAVOR[Math.floor(Math.random() * FLAVOR.length)]);
  if (d2) {
    let n = 0;
    d2.onclick = () => {
      n++;
      if (n === 3) { applyNight(!document.body.classList.contains('night')); toast('тьма. как тебе?'); n = 0; }
      else toast('ещё ' + (3 - n) + '…');
    };
  }

  const nb = $('#night-btn');
  if (nb) nb.onclick = () => applyNight(!document.body.classList.contains('night'));

  /* Двойной клик по заголовку */
  const title = $('.hero-title');
  if (title) {
    title.addEventListener('dblclick', () => {
      confetti(90);
      title.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }],
        { duration: 480 }
      );
      toast('ну и зачем ты это сделал? …мне нравится.');
    });
  }

  /* Поиск-пасхалки */
  const search = $('#search');
  if (search) {
    let t = null;
    search.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const v = search.value.trim().toLowerCase();
        if (v === '42') toast('правильный ответ.');
        if (v === 'koda') toast('привет, тот кто это собрал.');
        if (v === 'мусор') toast('мусорный дроп ниже. иди дропай.');
        if (v === 'кот' || v === 'cat') toast('кот спрятан в логотипе. семь кликов.');
        if (v === 'смысл жизни') toast('42. пожалуйста.');
      }, 700);
    });
  }

  /* Бейдж «76» */
  const badge = $('.logo-badge');
  if (badge) {
    let b = 0;
    badge.onclick = (e) => {
      e.stopPropagation();
      b++;
      badge.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 300 });
      if (b === 5) { toast('да, их реально 76.'); b = 0; }
      else toast('их 76. не веришь — посчитай.');
    };
  }

  /* Оверлей */
  const ob = $('#overlay-btn');
  if (ob) ob.onclick = hideOverlay;
  const ov = $('#overlay');
  if (ov) ov.addEventListener('click', (e) => { if (e.target.id === 'overlay') hideOverlay(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('#overlay').classList.contains('active')) hideOverlay();
      else if ($('#game-view').classList.contains('active')) closeGame();
    }
  });
}

/* ============================================================
   СЕКРЕТНАЯ ИГРА
   ============================================================ */
reg('secretcat', {
  name: 'Найди кота',
  cat: 'Логика',
  desc: 'Секретная игра. Кот спрятался на поле 8×8',
  hidden: true
}, (stage, api) => {
  const N = 8;
  const wrap = api.el('div', 'g-grid');
  wrap.style.gridTemplateColumns = `repeat(${N},1fr)`;
  wrap.style.width = '320px';
  stage.appendChild(wrap);
  const status = api.el('div', 'g-prompt', 'Кот где-то здесь');
  stage.appendChild(status);

  let cat, tries, over;

  function init() {
    cat = { r: api.rnd(N), c: api.rnd(N) };
    tries = 0; over = false;
    status.textContent = 'Кот где-то здесь. 5 попыток.';
    api.score('0/5');
    wrap.innerHTML = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = api.el('div', 'g-cell');
      cell.style.cssText = 'height:38px;font-size:16px';
      cell.onclick = () => {
        if (over) return;
        tries++;
        api.score(tries + '/5');
        const dr = Math.abs(r - cat.r), dc = Math.abs(c - cat.c);
        if (dr === 0 && dc === 0) {
          over = true;
          cell.textContent = '🐈';
          cell.style.background = 'rgba(198,255,61,.2)';
          api.confetti();
          api.overlay('🐈', 'Нашёл!', 'Кот был тут. Попыток: ' + tries, init);
          return;
        }
        cell.textContent = dr + dc <= 2 ? '🔥' : dr + dc <= 4 ? '🌡' : '❄';
        cell.classList.add('done');
        if (tries >= 5) {
          over = true;
          api.overlay('🙈', 'Убежал', 'Кот сидел в ' + (cat.r + 1) + ' ряду, ' + (cat.c + 1) + ' колонке', init);
        }
      };
      wrap.appendChild(cell);
    }
  }
  init();
  api.hint('🔥 — горячо, 🌡 — тепло, ❄ — холодно.');
  api.controls(api.btn('Заново', init, true));
});
