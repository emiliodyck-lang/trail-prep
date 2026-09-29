const KEY = 'habits.v1';
const PER_PAGE = 6;
const PALETTE = ['#ff6b6b', '#f59f00', '#12b886', '#4c6ef5', '#845ef7', '#e64980'];
const $ = id => document.getElementById(id);

// Background gradients: [name, top, middle, bottom, light?]. Light ones switch text and icons to dark.
// Picked with the 🎨 button, remembered per device by index, so only ever append to this list.
const THEMES = [
  ['Violet', '#5b7cfa', '#9b5de5', '#e05cb5'],
  ['Sunset', '#ff8a4c', '#ff4f7b', '#c2409b'],
  ['Ocean', '#2f6fe4', '#1596c9', '#12a88a'],
  ['Forest', '#11865f', '#2f9e44', '#7a9a12'],
  ['Night', '#262463', '#4a3fc4', '#8b3fd9'],
  ['Black', '#2e2e33', '#1c1c20', '#0b0b0d'],
  ['Graphite', '#6b7280', '#4b5563', '#2f3742'],
  ['Silver', '#f4f5f7', '#d8dbe0', '#aeb4bd', true],
  ['Blue', '#4f8df9', '#2563eb', '#1d44c4'],
  ['Navy', '#27408b', '#1e3380', '#111c47'],
  ['Sky', '#7dd3fc', '#38bdf8', '#0ea5e9', true],
  ['Teal', '#2dd4bf', '#14b8a6', '#0f766e'],
  ['Mint', '#a7f3d0', '#6ee7b7', '#34d399', true],
  ['Green', '#4ade80', '#16a34a', '#166534'],
  ['Lemon', '#fef08a', '#fde047', '#facc15', true],
  ['Gold', '#fcd34d', '#f59e0b', '#d97706', true],
  ['Orange', '#fdba74', '#f97316', '#c2410c'],
  ['Red', '#f87171', '#dc2626', '#991b1b'],
  ['Pink', '#f472b6', '#db2777', '#9d174d'],
  ['Bubblegum', '#fce7f3', '#fbcfe8', '#f9a8d4', true],
  ['Purple', '#c084fc', '#9333ea', '#581c87'],
  ['Lavender', '#ede9fe', '#ddd6fe', '#c4b5fd', true],
  ['Peach', '#ffe4d6', '#fecaca', '#fda4af', true],
  ['Aurora', '#22d3ee', '#8b5cf6', '#ec4899'],
  ['Tropical', '#fbbf24', '#f43f5e', '#8b5cf6'],
];
const THEME_KEY = 'habits.theme';
function applyTheme(i) {
  const [, a, b, c, light] = THEMES[i] || THEMES[0];
  const st = document.body.style;
  st.setProperty('--g1', a); st.setProperty('--g2', b); st.setProperty('--g3', c);
  st.setProperty('--fg', light ? '30,27,46' : '255,255,255');
  st.setProperty('--sil', light ? 'brightness(0) invert(.12)' : 'brightness(0) invert(1)');
  document.querySelector('meta[name=theme-color]').content = a;
}
let themeIndex = 0;
try { themeIndex = +localStorage.getItem(THEME_KEY) || 0; } catch {}
if (!THEMES[themeIndex]) themeIndex = 0;
applyTheme(themeIndex);

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const fmt = n => String(Math.round(n * 100) / 100);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Keyword -> suggested units as [unit, default daily goal].
const PRESETS = [
  { match: /water|hydrat/i, units: [['L', 2], ['oz', 64], ['glasses', 8], ['ml', 2000]] },
  { match: /read|book/i, units: [['pages', 10], ['minutes', 20]] },
  { match: /walk|run|jog|step|hike/i, units: [['steps', 8000], ['km', 5], ['mi', 3], ['minutes', 30]] },
  { match: /push.?up|sit.?up|squat|pull.?up|burpee/i, units: [['reps', 50]] },
  { match: /sleep/i, units: [['hours', 8]] },
  { match: /meditat|stretch|study|practi|exercise|workout|yoga|journal|plank/i, units: [['minutes', 15]] },
];

// Keyword -> suggested icons (names in ICONS, see icons.js). First match wins; DEFAULT_ICONS when nothing matches.
const ICON_SUGGEST = [
  [/water|hydrat/i, ['drop', 'm-water_drop', 'drop-half', 'm-local_drink', 'drop-simple', 'm-water_full', 'm-glass_cup']],
  [/coffee/i, ['coffee', 'm-local_cafe', 'coffee-bean', 'm-coffee']],
  [/\btea\b/i, ['tea-bag', 'm-emoji_food_beverage', 'coffee']],
  [/smok|vape|cigar/i, ['cigarette-slash', 'm-smoke_free', 'prohibit', 'm-smoking_rooms', 'cigarette']],
  [/alcohol|beer|wine|sober|drink/i, ['prohibit', 'm-no_drinks', 'beer-bottle', 'm-wine_bar', 'wine', 'm-sports_bar', 'pint-glass', 'm-liquor', 'champagne']],
  [/read|book/i, ['book-open', 'm-menu_book', 'books', 'm-auto_stories', 'book', 'm-local_library', 'book-bookmark']],
  [/dog/i, ['dog', 'm-pets', 'paw-print']],
  [/\bcats?\b/i, ['cat', 'm-pets', 'paw-print']],
  [/run|jog/i, ['person-simple-run', 'm-sprint', 'sneaker-move', 'm-directions_run', 'sneaker']],
  [/hike|mountain|climb/i, ['person-simple-hike', 'm-hiking', 'mountains', 'm-nordic_walking', 'boot', 'tree-evergreen']],
  [/camp/i, ['tent', 'campfire', 'mountains']],
  [/ski\b|skiing/i, ['person-simple-ski', 'm-downhill_skiing', 'snowflake', 'mountains']],
  [/snowboard/i, ['person-simple-snowboard', 'm-snowboarding', 'snowflake']],
  [/walk|step/i, ['person-simple-walk', 'm-directions_walk', 'footprints', 'm-nordic_walking', 'sneaker', 'm-footprint']],
  [/bike|cycl/i, ['person-simple-bike', 'm-directions_bike', 'bicycle', 'm-pedal_bike']],
  [/swim/i, ['person-simple-swim', 'm-pool', 'swimming-pool', 'm-scuba_diving']],
  [/meditat|mindful|breath|calm/i, ['flower-lotus', 'm-self_improvement', 'person-simple-tai-chi', 'm-spa', 'yin-yang', 'peace', 'leaf']],
  [/yoga|stretch/i, ['person-simple-tai-chi', 'm-self_improvement', 'person-arms-spread', 'm-sports_gymnastics', 'flower-lotus', 'm-accessibility_new']],
  [/sleep|bed|nap/i, ['bed', 'm-bedtime', 'moon-stars', 'm-king_bed', 'bell-z', 'm-hotel', 'cloud-moon', 'm-dark_mode', 'moon']],
  [/wake|early|alarm|morning/i, ['alarm', 'm-alarm', 'sun', 'm-wb_sunny', 'clock', 'm-light_mode']],
  [/gym|workout|exercise|lift|push.?up|pull.?up|squat|sit.?up|plank|burpee|train/i, ['barbell', 'm-fitness_center', 'heartbeat', 'm-exercise', 'fire', 'm-sports_gymnastics', 'lightning', 'm-sports_martial_arts']],
  [/soccer/i, ['soccer-ball', 'm-sports_soccer']], [/basketball/i, ['basketball', 'm-sports_basketball', 'court-basketball']], [/tennis|padel|squash|badminton/i, ['racquet', 'm-sports_tennis', 'tennis-ball']],
  [/golf/i, ['golf', 'm-sports_golf']], [/box/i, ['boxing-glove', 'm-sports_mma', 'hand-fist', 'm-sports_martial_arts']], [/hockey/i, ['hockey', 'm-sports_hockey']], [/cricket/i, ['cricket', 'm-sports_cricket']], [/bowl/i, ['bowling-ball']],
  [/game|gaming|playstation|xbox|nintendo/i, ['game-controller', 'm-sports_esports', 'joystick', 'm-extension', 'puzzle-piece', 'dice-five']],
  [/puzzle|chess|sudoku/i, ['puzzle-piece', 'm-chess', 'brain', 'm-extension']],
  [/movie|film|watch/i, ['film-slate', 'm-movie', 'popcorn', 'm-theater_comedy', 'television-simple']],
  [/knit|crochet|sew/i, ['yarn', 'scissors']],
  [/lego|build/i, ['lego', 'puzzle-piece']],
  [/guitar/i, ['guitar', 'm-music_note', 'music-notes']],
  [/piano/i, ['piano-keys', 'm-piano', 'music-notes']],
  [/music|sing|practi/i, ['music-notes', 'm-music_note', 'microphone-stage', 'm-mic', 'microphone', 'm-headphones', 'headphones', 'metronome', 'vinyl-record']],
  [/journal|write|diary/i, ['notebook', 'm-edit_note', 'pen-nib', 'm-history_edu', 'feather', 'm-stylus', 'pencil-simple', 'm-draw', 'note']],
  [/study|learn|homework|school|class|exam/i, ['graduation-cap', 'm-school', 'student', 'm-psychology', 'exam', 'm-local_library', 'brain', 'calculator', 'highlighter']],
  [/work|job|office|career/i, ['briefcase', 'm-work', 'laptop', 'kanban', 'presentation-chart']],
  [/news/i, ['newspaper']],
  [/science|research/i, ['flask', 'microscope', 'atom']],
  [/language|spanish|french|german|english|duolingo/i, ['translate', 'm-translate', 'globe', 'chat-circle']],
  [/code|program/i, ['code', 'm-code', 'terminal-window', 'm-computer', 'laptop', 'keyboard', 'robot']],
  [/vitamin|pill|medic/i, ['pill', 'm-medication', 'prescription', 'm-pill', 'first-aid-kit', 'm-vaccines', 'syringe']],
  [/doctor|health|blood|pressure/i, ['stethoscope', 'm-monitor_heart', 'heartbeat', 'm-cardiology', 'heart-half', 'm-healing', 'thermometer']],
  [/sugar|sweet|candy|junk|fast food|snack/i, ['prohibit', 'm-no_food', 'cookie', 'm-cookie', 'cake', 'm-cake', 'ice-cream', 'm-icecream', 'popsicle']],
  [/fruit|veg|salad|healthy|eat/i, ['carrot', 'm-nutrition', 'avocado', 'm-grocery', 'orange', 'cherries', 'pepper', 'bowl-food']],
  [/fish|protein/i, ['fish', 'egg', 'shrimp']],
  [/cook|meal|lunch|dinner|breakfast|bake/i, ['chef-hat', 'm-skillet', 'cooking-pot', 'm-restaurant', 'oven', 'm-lunch_dining', 'fork-knife', 'm-ramen_dining', 'bowl-steam']],
  [/phone|screen|social|scroll|tiktok|instagram/i, ['device-mobile-slash', 'm-mobile_off', 'device-mobile', 'm-tv_off', 'television']],
  [/teeth|tooth|floss|brush|dent/i, ['toothbrush', 'm-dentistry', 'tooth', 'sparkle']],
  [/skin|face|shower|bath|hair/i, ['shower', 'm-shower', 'bathtub', 'm-bathtub', 'towel', 'm-soap', 'hand-soap', 'm-face', 'hair-dryer']],
  [/outfit|clothes|dress/i, ['t-shirt', 'm-apparel', 'dress', 'm-iron', 'sock', 'high-heel']],
  [/clean|tidy|laundry|dishes|chore/i, ['broom', 'm-cleaning_services', 'spray-bottle', 'm-local_laundry_service', 'washing-machine', 'm-vacuum', 'trash', 'm-mop', 'toilet']],
  [/recycl/i, ['recycle', 'm-recycling']],
  [/shop|grocer/i, ['shopping-cart', 'm-shopping_cart', 'basket']],
  [/plant|garden/i, ['potted-plant', 'm-potted_plant', 'plant', 'm-local_florist', 'flower-tulip', 'm-grass', 'shovel', 'flower']],
  [/pray|church|bible|god|quran|mosque|torah|faith/i, ['hands-praying', 'm-church', 'cross', 'm-mosque', 'church', 'm-synagogue', 'star-and-crescent', 'm-temple_hindu', 'mosque']],
  [/call|family|mom|dad|friend|text|social/i, ['phone-call', 'm-call', 'users-three', 'm-family_restroom', 'hand-waving', 'm-groups', 'chats', 'm-diversity_3', 'heart']],
  [/kid|baby|parent/i, ['baby', 'm-stroller', 'baby-carriage', 'm-family_restroom', 'heart']],
  [/save|money|budget|spend|invest/i, ['piggy-bank', 'm-savings', 'coins', 'm-account_balance_wallet', 'wallet', 'm-payments', 'currency-dollar', 'm-trending_up', 'trend-up']],
  [/draw|paint|art/i, ['paint-brush', 'm-palette', 'palette', 'm-brush', 'paint-brush-broad', 'm-draw', 'pencil-ruler']],
  [/photo/i, ['camera', 'm-photo_camera']],
  [/weigh|scale/i, ['scales', 'm-monitor_weight']],
  [/outside|fresh air|\bsun|nature/i, ['sun', 'm-park', 'sun-horizon', 'm-forest', 'tree', 'm-nature_people', 'park', 'm-eco', 'leaf']],
  [/travel|trip/i, ['suitcase-rolling', 'm-flight', 'airplane', 'm-luggage', 'map-trifold', 'compass']],
  [/grateful|gratitude|happy|smile|mood|feel/i, ['smiley', 'm-sentiment_very_satisfied', 'smiley-wink', 'm-mood', 'smiley-meh', 'm-volunteer_activism', 'hands-clapping', 'm-favorite', 'hand-heart']],
  [/rabbit|bunny/i, ['rabbit', 'm-cruelty_free']], [/pet|horse/i, ['paw-print', 'm-pets', 'horse', 'bone']],
];
const DEFAULT_ICONS = ['star', 'check-circle', 'target', 'fire', 'heart', 'lightning'];
const suggestIcons = name => (ICON_SUGGEST.find(([re]) => re.test(name)) || [, DEFAULT_ICONS])[1];
const iconSvg = name => `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${ICONS[name]}</svg>`;
const firstGrapheme = str => {
  const t = str.trim();
  if (!t) return '';
  return window.Intl && Intl.Segmenter ? [...new Intl.Segmenter().segment(t)][0].segment : [...t][0];
};

// What sits inside a habit's ring: its icon, else a custom emoji (white silhouette), else its first letter.
const faceHTML = h => h.icon && ICONS[h.icon] ? `<span class="ic">${iconSvg(h.icon)}</span>`
  : h.emoji ? `<span class="e">${esc(h.emoji)}</span>`
  : `<span class="i">${esc(firstGrapheme(h.name).toUpperCase())}</span>`;

// Emojis the old picker suggested, mapped to the icon that replaces them.
const EMOJI_TO_ICON = {
  '💧': 'drop', '🥤': 'drop-half', '🚰': 'drop-simple', '🧊': 'drop-simple', '📚': 'books', '📖': 'book-open', '🤓': 'book-open',
  '🐕': 'dog', '🦮': 'dog', '🏃': 'person-simple-run', '👟': 'sneaker', '🏅': 'medal', '🚶': 'person-simple-walk', '🥾': 'boot',
  '🌳': 'tree', '🚴': 'person-simple-bike', '🚲': 'bicycle', '🏊': 'person-simple-swim', '🌊': 'drop', '🧘': 'flower-lotus',
  '🕯': 'sparkle', '🌿': 'leaf', '🤸': 'person-simple-tai-chi', '😴': 'bed', '🛌': 'bed', '🌙': 'moon', '💪': 'barbell',
  '🏋': 'barbell', '🔥': 'fire', '🎸': 'guitar', '🎶': 'music-notes', '🎹': 'piano-keys', '🎵': 'music-note', '🎤': 'microphone',
  '✍': 'pencil-simple', '📓': 'notebook', '🖊': 'pen', '📝': 'note', '🎓': 'graduation-cap', '🧠': 'brain', '🗣': 'chat-circle',
  '🌍': 'globe', '🦉': 'bird', '💻': 'laptop', '⌨': 'keyboard', '💊': 'pill', '🥦': 'carrot', '🍎': 'orange-slice', '🥗': 'bowl-food',
  '🍳': 'cooking-pot', '🥘': 'bowl-steam', '☕': 'coffee', '🍬': 'cookie', '🚫': 'prohibit', '🍺': 'beer-bottle', '🚭': 'cigarette-slash',
  '📵': 'device-mobile-slash', '📱': 'device-mobile', '🦷': 'tooth', '🪥': 'toothbrush', '🧴': 'hand-soap', '✨': 'sparkle', '🧹': 'broom',
  '🧽': 'sparkle', '🪴': 'potted-plant', '🌱': 'plant', '🙏': 'hands-praying', '✝': 'cross', '📞': 'phone-call', '❤': 'heart',
  '💰': 'coins', '🐷': 'piggy-bank', '⭐': 'star', '✅': 'check-circle', '🎯': 'target',
};

// Renders "no icon / suggested icons / all icons / your own emoji" into box.
// onPick({ icon }) or onPick({ emoji }) or onPick({}) to clear.
function iconPicker(box, name, h, onPick) {
  const cur = h.icon || '';
  const options = [...new Set([...(cur ? [cur] : []), ...suggestIcons(name)])].filter(n => ICONS[n]);
  const all = box.dataset.all === '1';
  const btn = n => `<button class="chip ico${n === cur ? ' sel' : ''}" data-icon="${n}" aria-label="${n.replace(/^m-/, '').replace(/[-_]/g, ' ')}">${iconSvg(n)}</button>`;
  box.innerHTML = `
    <div class="field">Icon (optional)</div>
    <div class="chips icons">
      <button class="chip${cur || h.emoji ? '' : ' sel'}" data-none="1">None</button>
      ${options.map(btn).join('')}
      <button class="chip" data-all="1">${all ? 'Fewer' : 'All icons'}</button>
    </div>
    ${all ? `<div class="icon-grid">${Object.keys(ICONS).map(btn).join('')}</div>` : ''}
    <label class="field own-row">Or your own emoji
      <input class="own" maxlength="8" placeholder="${h.emoji ? esc(h.emoji) : 'e.g. 🎮'}" aria-label="Type your own emoji">
    </label>`;
  box.querySelectorAll('[data-icon]').forEach(b => b.onclick = () => onPick({ icon: b.dataset.icon }));
  box.querySelector('[data-none]').onclick = () => onPick({});
  box.querySelector('[data-all]').onclick = () => { box.dataset.all = all ? '' : '1'; iconPicker(box, name, h, onPick); };
  const own = box.querySelector('.own');
  own.oninput = () => { const e = firstGrapheme(own.value); if (e) onPick({ emoji: e }); };
}
const setFace = (h, f) => { delete h.icon; delete h.emoji; if (f.icon) h.icon = f.icon; if (f.emoji) h.emoji = f.emoji; };

let state = load();

function load() {
  let s;
  try { s = JSON.parse(localStorage.getItem(KEY)) || { habits: [] }; }
  catch { s = { habits: [] }; }
  s.habits.forEach((h, i) => {
    // Older versions logged partial amounts per day; a day counts as done if the goal was reached.
    if (h.log) {
      h.done = Object.keys(h.log).filter(d => h.log[d] >= h.goal);
      delete h.log; delete h.type; delete h.step;
    }
    h.done = h.done || [];
    if (h.color == null) h.color = i % PALETTE.length;
    if (h.emoji && !h.icon) {
      const icon = EMOJI_TO_ICON[h.emoji.replace(/\uFE0F/g, '')];
      if (icon) { h.icon = icon; delete h.emoji; }
    }
  });
  return s;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  render();
}

// Checking off today also records the time (minutes after midnight) for the time-of-day chart.
// Backfilled days have no time: we don't know when they happened.
function toggle(h, date) {
  const i = h.done.indexOf(date);
  if (i === -1) {
    h.done.push(date);
    if (date === ymd(daysAgo(0))) { const now = new Date(); (h.times = h.times || {})[date] = now.getHours() * 60 + now.getMinutes(); }
  } else {
    h.done.splice(i, 1);
    if (h.times) delete h.times[date];
  }
  if (navigator.vibrate) navigator.vibrate(10);
  save();
}

// Consecutive done days ending today, or ending yesterday if today isn't logged yet.
function streak(h) {
  const set = new Set(h.done);
  let n = 0, i = set.has(ymd(daysAgo(0))) ? 0 : 1;
  while (set.has(ymd(daysAgo(i)))) { n++; i++; }
  return n;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// Tap runs onTap; holding ~0.5s without moving runs onHold. Swiping cancels both.
function pressable(node, onTap, onHold) {
  let timer, sx, sy, held = false;
  node.addEventListener('pointerdown', e => {
    held = false; sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(20); onHold(); }, 500);
  });
  node.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clearTimeout(timer); });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) node.addEventListener(t, () => clearTimeout(timer));
  node.addEventListener('click', () => { if (!held) onTap(); });
  node.addEventListener('contextmenu', e => e.preventDefault());
}

let justToggled = null;
const pagesEl = $('pages');
const currentPage = () => Math.round(pagesEl.scrollLeft / (pagesEl.clientWidth || 1));
function goToPage(i) { pagesEl.scrollTo({ left: i * pagesEl.clientWidth, behavior: 'instant' }); updateDots(); }

function render() {
  const today = ymd(daysAgo(0));
  $('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const total = state.habits.length;
  const doneCount = state.habits.filter(h => h.done.includes(today)).length;
  $('progress').textContent = total ? `${doneCount} of ${total} done · hold a circle to edit` : '';

  const shown = state.habits;
  const keep = currentPage();
  pagesEl.replaceChildren();

  if (!shown.length) {
    const p = el('div', 'page empty', 'Tap + to add your first habit.');
    pagesEl.append(p);
  }
  for (let start = 0; start < shown.length; start += PER_PAGE) {
    const page = el('div', 'page');
    for (const h of shown.slice(start, start + PER_PAGE)) {
      const done = h.done.includes(today);
      // The habit just tapped starts in its old state so the ring can animate to the new one.
      const animate = h.id === justToggled;
      const cell = el('button', 'habit' + (done !== animate ? ' done' : ''));
      if (animate) requestAnimationFrame(() => requestAnimationFrame(() => cell.classList.toggle('done', done)));
      cell.setAttribute('aria-label', `${h.name}, ${done ? 'done' : 'not done'}`);
      const ring = el('span', 'ring');
      ring.innerHTML = '<svg class="prog" viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="48"/><circle class="arc" cx="50" cy="50" r="48" pathLength="100"/></svg>';
      ring.insertAdjacentHTML('beforeend', faceHTML(h));
      ring.append(el('span', 'ok', '✓'));
      const label = el('span', 'label');
      label.append(el('span', 'n', h.name));
      const s = streak(h);
      const info = [h.unit ? `${fmt(h.goal)} ${h.unit}` : '', s ? `🔥 ${s}` : ''].filter(Boolean).join(' · ');
      if (info) label.append(el('span', 'g', info));
      cell.append(ring, label);
      pressable(cell, () => { justToggled = h.id; toggle(h, today); justToggled = null; }, () => openEditSheet(h));
      page.append(cell);
    }
    pagesEl.append(page);
  }

  const count = pagesEl.children.length;
  $('dots').replaceChildren(...(count > 1 ? Array.from({ length: count }, () => el('span')) : []));
  goToPage(Math.min(keep, count - 1));
  updateDots();
}

function updateDots() {
  const i = currentPage();
  [...$('dots').children].forEach((d, j) => d.classList.toggle('on', i === j));
}
pagesEl.addEventListener('scroll', updateDots, { passive: true });

// ---- Bottom sheet ----
function openSheet(html, bind) {
  const sheet = $('sheet');
  sheet.querySelector('.panel').innerHTML = html;
  sheet.hidden = false;
  bind(sheet.querySelector('.panel'));
}
function closeSheet() { $('sheet').hidden = true; }
$('sheet').onclick = e => { if (e.target.id === 'sheet') closeSheet(); };

// Name, then optionally a daily goal in some unit (e.g. 2 L). Suggested units follow the name as you type.
function openAddSheet() {
  const pick = { mode: 'none', goal: '', unit: '', auto: true, face: {} };
  openSheet(`
    <h2>New habit</h2>
    <label class="field">Name<span class="goal"><input id="hname" maxlength="40" placeholder="e.g. Drink water" autocomplete="off"></span></label>
    <div id="emo"></div>
    <div id="opts"></div>
    <div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="primary" id="save">Add habit</button></div>
    <div class="links">Backup: <button id="export">Export</button> · <button id="import">Import</button> · version 19</div>
  `, () => {});
  const name = $('hname');
  const drawEmoji = () => iconPicker($('emo'), name.value, pick.face, f => { pick.face = f; drawEmoji(); });
  const unitsFor = n => (PRESETS.find(p => p.match.test(n)) || { units: [] }).units;

  // Only the unit chips and goal field redraw, so the name box keeps focus and the keyboard stays up.
  const drawOpts = focusId => {
    const units = unitsFor(name.value);
    const chip = (mode, label) => `<button class="chip${pick.mode === mode ? ' sel' : ''}" data-mode="${esc(mode)}">${esc(label)}</button>`;
    $('opts').innerHTML = `
      <div class="chips">
        ${chip('none', 'No unit')}
        ${units.map(u => chip(u[0], u[0])).join('')}
        ${chip('other', 'Other unit…')}
      </div>
      ${pick.mode === 'none' ? '' : `
      <label class="field">Daily goal
        <span class="goal">
          <input id="goal" type="text" inputmode="decimal" autocomplete="off" value="${esc(String(pick.goal))}" placeholder="e.g. 10">
          ${pick.mode === 'other'
            ? `<input id="unit" placeholder="unit, e.g. cups" maxlength="12" value="${esc(pick.unit)}">`
            : `<span class="unit">${esc(pick.mode)}</span>`}
        </span>
      </label>`}`;
    const goal = $('goal'), unit = $('unit');
    if (goal) goal.oninput = () => { pick.goal = goal.value; };
    if (unit) unit.oninput = () => { pick.unit = unit.value; };
    $('opts').querySelectorAll('.chip').forEach(b => b.onclick = () => {
      pick.auto = false;
      pick.mode = b.dataset.mode;
      const u = units.find(u => u[0] === pick.mode);
      pick.goal = u ? u[1] : '';
      drawOpts(pick.mode === 'other' ? 'unit' : !u && pick.mode !== 'none' ? 'goal' : null);
    });
    const f = focusId && $(focusId);
    if (f) f.focus();
  };

  name.oninput = () => {
    // Until the user picks a unit themselves, follow the name's suggestion.
    if (pick.auto) {
      const first = unitsFor(name.value)[0];
      pick.mode = first ? first[0] : 'none';
      pick.goal = first ? first[1] : '';
    }
    drawOpts();
    drawEmoji();
  };
  $('cancel').onclick = closeSheet;
  $('export').onclick = exportData;
  $('import').onclick = () => $('file').click();
  $('save').onclick = () => {
    const n = name.value.trim();
    if (!n) return name.focus();
    const last = state.habits[state.habits.length - 1];
    const h = { id: 'h_' + Date.now().toString(36), name: n, created: ymd(daysAgo(0)), done: [],
      color: last ? (last.color + 1) % PALETTE.length : 0 };
    setFace(h, pick.face);
    if (pick.mode !== 'none') {
      const g = parseFloat(String(pick.goal).replace(',', '.'));
      const u = pick.mode === 'other' ? pick.unit.trim() : pick.mode;
      if (!(g > 0)) return $('goal').focus();
      if (!u) return $('unit').focus();
      Object.assign(h, { unit: u, goal: g });
    }
    state.habits.push(h);
    closeSheet();
    save();
    goToPage(Math.floor((state.habits.length - 1) / PER_PAGE));
  };
  drawOpts();
  drawEmoji();
  name.focus();
}
$('add').onclick = openAddSheet;

function openThemeSheet() {
  const draw = () => openSheet(`
    <h2>Colors</h2>
    <p class="sub">${THEMES[themeIndex][0]}</p>
    <div class="themes">${THEMES.map(([n, a, b, c, light], i) =>
      `<button class="swatch${i === themeIndex ? ' sel' : ''}${light ? ' light' : ''}" data-i="${i}" aria-label="${n}" style="background:linear-gradient(160deg, ${a}, ${b}, ${c})"></button>`).join('')}</div>
    <div class="actions"><button class="primary" id="close">Done</button></div>
  `, panel => {
    panel.querySelectorAll('.swatch').forEach(b => b.onclick = () => {
      themeIndex = +b.dataset.i;
      applyTheme(themeIndex);
      try { localStorage.setItem(THEME_KEY, themeIndex); } catch {}
      draw();
    });
    $('close').onclick = closeSheet;
  });
  draw();
}
$('theme').onclick = openThemeSheet;

// Holding a circle: rename, fix any of the past year's days, change the icon, or delete.
const HISTORY_DAYS = 365;
function openEditSheet(h) {
  const color = PALETTE[h.color % PALETTE.length];
  const streakText = () => {
    const n = streak(h);
    return `${h.unit ? `${fmt(h.goal)} ${esc(h.unit)} a day · ` : ''}${n ? `🔥 ${n} day streak` : 'No streak yet'}`;
  };
  // Oldest on the left, today on the far right; a month label marks the 1st and the first chip.
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => daysAgo(HISTORY_DAYS - 1 - i)).map((d, i) => {
    const key = ymd(d);
    const month = i === 0 || d.getDate() === 1 ? d.toLocaleDateString(undefined, { month: 'short' }) : '';
    return `<button class="day${h.done.includes(key) ? ' on' : ''}" data-day="${key}"><i>${month}</i>${d.toLocaleDateString(undefined, { weekday: 'short' })}<b>${d.getDate()}</b></button>`;
  }).join('');
  openSheet(`
    <div class="title-row"><span id="edit-emoji" class="face">${h.icon || h.emoji ? faceHTML(h) : ''}</span>
      <input id="rename" class="title-input" maxlength="40" value="${esc(h.name)}" aria-label="Habit name" autocomplete="off" enterkeyhint="done"><span class="pen" aria-hidden="true">✎</span></div>
    <p class="sub" id="edit-streak">${streakText()}</p>
    <p class="sub">Tap a day to mark it done or not done. Swipe for earlier days.</p>
    <div class="days" style="--c:${color}">${days}</div>
    <div id="emo"></div>
    <div class="actions"><button class="danger" id="del">Delete</button><button class="primary" id="close">Done</button></div>
  `, panel => {
    const strip = panel.querySelector('.days');
    strip.scrollLeft = strip.scrollWidth;
    // Update just the tapped chip so the strip keeps its scroll position.
    strip.onclick = e => {
      const b = e.target.closest('.day');
      if (!b) return;
      toggle(h, b.dataset.day);
      b.classList.toggle('on', h.done.includes(b.dataset.day));
      $('edit-streak').innerHTML = streakText();
    };

    const rename = $('rename');
    const commit = () => {
      const n = rename.value.trim();
      if (n && n !== h.name) { h.name = n; save(); }
      rename.value = h.name;
    };
    rename.onchange = commit;
    rename.onkeydown = e => { if (e.key === 'Enter') rename.blur(); };

    const drawEmoji = () => iconPicker($('emo'), h.name, h, f => {
      setFace(h, f);
      $('edit-emoji').innerHTML = h.icon || h.emoji ? faceHTML(h) : '';
      save();
      drawEmoji();
    });
    drawEmoji();

    $('close').onclick = () => { commit(); closeSheet(); };
    $('del').onclick = () => {
      if (confirm(`Delete "${h.name}" and its history?`)) {
        state.habits = state.habits.filter(x => x !== h);
        closeSheet();
        save();
      }
    };
  });
}

// ---- Stats ----
// A day counts toward a habit from the day it was created (or its earliest logged day, if backfilled).
// Today only counts once it's done, so the rate doesn't drop every morning.
const dayNum = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const keyOf = n => new Date(n * 864e5).toISOString().slice(0, 10);
const startOf = h => Math.min(dayNum(h.created || ymd(daysAgo(0))), ...h.done.map(dayNum));
function longestStreak(h) {
  const days = [...new Set(h.done.map(dayNum))].sort((a, b) => a - b);
  let best = 0, run = 0;
  days.forEach((d, i) => { run = i && d === days[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); });
  return best;
}
const RANGES = [['week', 'Week', 7, 'last 7 days'], ['month', 'Month', 30, 'last 30 days'], ['year', 'Year', 365, 'last 12 months'], ['all', 'All time', 0, 'all time']];
const statsView = { habit: 'all', range: 'month' };

function computeStats(habits, range) {
  const today = dayNum(ymd(daysAgo(0)));
  const earliest = Math.min(...habits.map(startOf));
  const len = RANGES.find(r => r[0] === range)[2];
  const from = len ? Math.max(today - len + 1, earliest) : earliest;
  const days = [];
  let done = 0, possible = 0, perfect = 0;
  const weekday = Array.from({ length: 7 }, () => ({ done: 0, possible: 0 }));
  for (let d = from; d <= today; d++) {
    const key = keyOf(d);
    let dd = 0, dp = 0;
    for (const h of habits) {
      if (d < startOf(h)) continue;
      const hit = h.done.includes(key);
      if (d === today && !hit) continue;
      dp++; if (hit) dd++;
    }
    const wd = (new Date(d * 864e5).getUTCDay() + 6) % 7; // Monday = 0
    weekday[wd].done += dd; weekday[wd].possible += dp;
    if (dp && dd === dp && (d !== today || dp === habits.filter(h => d >= startOf(h)).length)) perfect++;
    done += dd; possible += dp;
    days.push({ d, key, done: dd, possible: dp });
  }
  return { days, done, possible, perfect, weekday, from, today };
}

const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const fmtDay = (d, opts) => new Date(d * 864e5).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });

// Trend points: the week shows each day's rate; longer ranges use a 7-day rolling rate so the line
// moves like a stock chart instead of jumping between 0% and 100%.
function trendPoints(st, range) {
  const win = range === 'week' ? 1 : 7;
  return st.days.map((x, i) => {
    let dn = 0, ps = 0;
    for (let j = Math.max(0, i - win + 1); j <= i; j++) { dn += st.days[j].done; ps += st.days[j].possible; }
    const date = fmtDay(x.d, { weekday: 'short', month: 'short', day: 'numeric', year: range === 'all' || range === 'year' ? 'numeric' : undefined });
    return { v: ps ? dn / ps * 100 : null,
      tip: ps ? `${date}: ${Math.round(dn / ps * 100)}%${win > 1 ? ' (last 7 days)' : ` (${dn} of ${ps})`}` : `${date}: nothing to do yet` };
  });
}

function lineChart(points, xLabels, yLabels = ['100%', '50%', '0%']) {
  const W = 300, H = 120, n = points.length;
  const x = i => n === 1 ? W / 2 : i / (n - 1) * W, y = v => H - v / 100 * H;
  let line = '', pen = false;
  points.forEach((p, i) => {
    if (p.v == null) { pen = false; return; }
    line += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`; pen = true;
  });
  // Area under each unbroken segment.
  const segs = []; let cur = [];
  points.forEach((p, i) => { if (p.v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push(i); });
  if (cur.length) segs.push(cur);
  const area = segs.map(sg => `M${x(sg[0]).toFixed(1)},${H}` + sg.map(i => `L${x(i).toFixed(1)},${y(points[i].v).toFixed(1)}`).join('') + `L${x(sg[sg.length - 1]).toFixed(1)},${H}Z`).join('');
  const lastI = points.map(p => p.v != null).lastIndexOf(true);
  const gid = 'lg' + (++lineChart.n || (lineChart.n = 1));
  return `<div class="lchart${yLabels.some(Boolean) ? '' : ' noy'}">
    <div class="readout" aria-live="polite">${lastI >= 0 ? esc(points[lastI].tip) : 'No data yet'}</div>
    <div class="lplot">
      <div class="grid">${yLabels.map(l => `<span>${l}</span>`).join('')}</div>
      <div class="lsvg">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
          <path d="${area}" fill="url(#${gid})"/>
          <path d="${line}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="xhair" hidden></span><span class="xdot" hidden></span>
      </div>
    </div>
    <div class="xlabels">${xLabels.map(l => `<span>${esc(l)}</span>`).join('')}</div>
  </div>`;
}

// Drag or tap across the line to read any day.
function bindLineChart(root, points) {
  const box = root.querySelector('.lsvg'), out = root.querySelector('.readout');
  const hair = root.querySelector('.xhair'), dot = root.querySelector('.xdot');
  const n = points.length;
  const at = e => {
    const r = box.getBoundingClientRect();
    let i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (n - 1));
    const p = points[i];
    const left = n === 1 ? 50 : i / (n - 1) * 100;
    hair.hidden = false; hair.style.left = left + '%';
    dot.hidden = p.v == null; if (p.v != null) { dot.style.left = left + '%'; dot.style.top = (100 - p.v) + '%'; }
    out.textContent = p.tip;
  };
  box.addEventListener('pointerdown', e => { box.setPointerCapture(e.pointerId); at(e); });
  box.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || box.hasPointerCapture(e.pointerId)) at(e); });
}

// Check-offs per hour across the selected habits and range, smoothed over 3 hours (wrapping at midnight).
const hourName = h => `${h % 12 || 12} ${h % 24 < 12 ? 'AM' : 'PM'}`;
function timeOfDay(habits, from) {
  const counts = Array(24).fill(0);
  let total = 0;
  for (const h of habits) for (const [key, min] of Object.entries(h.times || {})) {
    if (dayNum(key) < from || !h.done.includes(key)) continue;
    counts[Math.floor(min / 60) % 24]++; total++;
  }
  const smooth = counts.map((_, i) => (counts[(i + 23) % 24] + 2 * counts[i] + counts[(i + 1) % 24]) / 4);
  const max = Math.max(...smooth);
  const points = Array.from({ length: 25 }, (_, i) => {
    const hr = i % 24;
    return { v: total ? smooth[hr] / max * 100 : null, tip: `${hourName(hr)}–${hourName(hr + 1)}: ${counts[hr]} check-off${counts[hr] === 1 ? '' : 's'}` };
  });
  const peak = counts.indexOf(Math.max(...counts));
  return { points, total, peak };
}

function barChart(items) {
  return `<div class="bchart">
    <div class="readout" aria-live="polite">Tap a bar for details</div>
    <div class="plot">
      <div class="grid"><span>100%</span><span>50%</span><span>0%</span></div>
      <div class="bars">${items.map(b => `
        <button class="bar" data-tip="${esc(b.long)}: ${b.possible ? `${pct(b.done, b.possible)}% (${b.done} of ${b.possible})` : 'nothing to do yet'}">
          <span class="fill${b.possible ? '' : ' none'}" style="height:${b.possible ? Math.max(2, pct(b.done, b.possible)) : 0}%"></span>
          <span class="tick">${esc(b.short)}</span>
        </button>`).join('')}
      </div>
    </div>
  </div>`;
}


function openStats() {
  const view = $('stats');
  const habits = state.habits;
  if (!habits.length) {
    view.innerHTML = `<div class="stats-in"><div class="stats-top"><button class="round" id="stats-close" aria-label="Back">‹</button><h1>Stats</h1></div>
      <p class="stats-empty">Add a habit to see your stats.</p></div>`;
    $('stats-close').onclick = closeStats;
    view.hidden = false;
    return;
  }
  if (!habits.some(h => h.id === statsView.habit)) statsView.habit = 'all';

  // Slide 0 is "All habits" (a row of mini rings that drifts when there are more than 5), then one slide per habit.
  const drift = habits.length > 5;
  const minis = habits.map(h => `<span class="mini">${faceHTML(h)}</span>`).join('');
  view.innerHTML = `<div class="stats-in">
      <div class="stats-top">
        <button class="round" id="stats-close" aria-label="Back">‹</button><h1>Stats</h1>
        <label class="range">
          <select id="range" aria-label="Time range">${RANGES.map(([k, label]) => `<option value="${k}"${statsView.range === k ? ' selected' : ''}>${label}</option>`).join('')}</select>
        </label>
      </div>
    </div>
    <div class="carousel" id="carousel">
      <div class="slide">
        <div class="minis${drift ? ' drift' : ''}"><div class="track" style="--n:${habits.length}">${minis}${drift ? minis : ''}</div></div>
        <div class="slide-name">All habits</div>
      </div>
      ${habits.map(h => `<div class="slide"><span class="big">${faceHTML(h)}</span><div class="slide-name">${esc(h.name)}</div></div>`).join('')}
    </div>
    <div class="dots sdots" id="sdots">${['all', ...habits].map(() => '<span></span>').join('')}</div>
    <div class="stats-in"><hr class="sep"><div id="stats-body"></div></div>`;

  const car = $('carousel');
  const idxOf = () => Math.round(car.scrollLeft / (car.clientWidth || 1));
  const markDots = i => [...$('sdots').children].forEach((d, j) => d.classList.toggle('on', i === j));
  const start = statsView.habit === 'all' ? 0 : habits.findIndex(h => h.id === statsView.habit) + 1;
  view.hidden = false;
  view.scrollTop = 0;
  car.scrollTo({ left: start * car.clientWidth, behavior: 'instant' });
  markDots(start);
  car.addEventListener('scroll', () => {
    const i = idxOf();
    markDots(i);
    const id = i === 0 ? 'all' : habits[i - 1] && habits[i - 1].id;
    if (id && id !== statsView.habit) { statsView.habit = id; drawBody(); }
  }, { passive: true });

  $('range').onchange = e => { statsView.range = e.target.value; drawBody(); };
  $('stats-close').onclick = closeStats;
  drawBody();
}

function drawBody() {
  const habits = state.habits;
  const one = habits.find(h => h.id === statsView.habit);
  const st = computeStats(one ? [one] : habits, statsView.range);
  const range = RANGES.find(r => r[0] === statsView.range);

  const nums = one ? [
    [`${pct(st.done, st.possible)}%`, 'completion'],
    [`${st.done}<small>/${st.possible}</small>`, 'days done'],
    [one.done.length, 'all-time total'],
    [streak(one), 'current streak'],
    [longestStreak(one), 'longest streak'],
  ] : (() => {
    const best = habits.map(h => [longestStreak(h), h]).sort((a, b) => b[0] - a[0])[0];
    return [
      [`${pct(st.done, st.possible)}%`, 'completion'],
      [`${st.done}<small>/${st.possible}</small>`, 'check-offs'],
      [best[0], `best streak${best[0] ? `<span class="who">${best[1].icon ? `<span class="wi">${iconSvg(best[1].icon)}</span>` : best[1].emoji ? esc(best[1].emoji) + ' ' : ''}${esc(best[1].name)}</span>` : ''}`],
    ];
  })();

  const pts = trendPoints(st, statsView.range);
  const yr = statsView.range === 'all' || statsView.range === 'year' ? { year: 'numeric' } : {};
  const first = fmtDay(st.from, { month: 'short', day: 'numeric', ...yr }), last = 'Today';

  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const wd = st.weekday.map((w, i) => ({ ...w, short: names[i][0], long: names[i] }));
  const ranked = wd.filter(w => w.possible).sort((a, c) => pct(c.done, c.possible) - pct(a.done, a.possible));
  const wdNote = ranked.length > 1
    ? `Best on <b>${ranked[0].long}s</b> (${pct(ranked[0].done, ranked[0].possible)}%), weakest on <b>${ranked[ranked.length - 1].long}s</b> (${pct(ranked[ranked.length - 1].done, ranked[ranked.length - 1].possible)}%).`
    : 'Keep going to see which days work best.';

  const tod = timeOfDay(one ? [one] : habits, st.from);
  const todNote = tod.total
    ? `Usually around <b>${hourName(tod.peak)}</b> · ${tod.total} timed check-off${tod.total === 1 ? '' : 's'}.`
    : 'Times are saved from now on when you tap a circle, so this fills in as you go.';

  const body = $('stats-body');
  body.innerHTML = `
    <p class="range-note">${range[3][0].toUpperCase() + range[3].slice(1)}</p>
    <div class="nums">${nums.map(([v, k]) => `<div class="num"><div class="nv">${v}</div><div class="nk">${k}</div></div>`).join('')}</div>
    <hr class="sep">
    <h3>${statsView.range === 'week' ? 'Each day' : 'Trend · 7-day average'}</h3>
    ${lineChart(pts, [first, last])}
    <hr class="sep">
    <div class="duo">
      <div><h3>Day of the week</h3>${barChart(wd)}<p class="note">${wdNote}</p></div>
      <div id="tod"><h3>Time of day</h3>${lineChart(tod.points, ['12a', '6a', '12p', '6p', '12a'], ['', '', ''])}<p class="note">${todNote}</p></div>
    </div>`;
  bindLineChart(body.querySelector('.lchart'), pts);
  bindLineChart($('tod').querySelector('.lchart'), tod.points);
  $('tod').querySelector('.readout').textContent = tod.total ? tod.points[tod.peak].tip : 'No times yet';
  const bc = body.querySelector('.bchart'), out = bc.querySelector('.readout');
  bc.querySelectorAll('.bar').forEach(bar => {
    const show = () => { bc.querySelectorAll('.bar.on').forEach(o => o.classList.remove('on')); bar.classList.add('on'); out.textContent = bar.dataset.tip; };
    bar.onclick = show;
    bar.onpointerenter = e => { if (e.pointerType === 'mouse') show(); };
  });
}
function closeStats() { $('stats').hidden = true; }
$('stats-btn').onclick = openStats;
// Toolbar icons use the same one-color set as the habits, so they follow the theme's text color.
$('stats-btn').insertAdjacentHTML('afterbegin', iconSvg('chart-line-up'));
$('theme').innerHTML = iconSvg('palette');

function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = `habits-${ymd(daysAgo(0))}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
$('file').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.habits)) throw new Error('bad file');
    if (confirm('Replace current habits with the imported file?')) {
      localStorage.setItem(KEY, JSON.stringify(data));
      state = load();
      closeSheet();
      save();
    }
  } catch { alert('That file is not a valid habits export.'); }
  e.target.value = '';
};

// Re-render when the app comes back to the foreground so "today" rolls over at midnight.
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
window.addEventListener('resize', () => goToPage(currentPage()));

// Always check the server for a new sw.js, and reload once when a new version takes over,
// so a deploy shows up on the next open instead of waiting on stale caches.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
render();
