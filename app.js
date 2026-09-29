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
  { match: /run|jog/i, units: [['km', 5], ['mi', 3], ['minutes', 30]] },
  { match: /walk|step|hike/i, units: [['steps', 8000], ['km', 5], ['mi', 3], ['minutes', 30]] },
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
    ${all ? `<div class="icon-grid">${Object.keys(ICONS).filter(n => !n.startsWith('ui-')).map(btn).join('')}</div>` : ''}
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

// ---- Schedules, pauses, streaks ----
// h.schedule: missing/{ type: 'daily' } | { type: 'days', days: [0-6, Monday = 0] } | { type: 'weekly', times: N }
// h.pauses: [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' | null }]; to null = paused right now. Paused days never count as missed.
// h.archived: 'YYYY-MM-DD' when finished; hidden everywhere but Settings, history kept.
const fmtDay = (d, opts) => new Date(d * 864e5).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });
const dayNum = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const keyOf = n => new Date(n * 864e5).toISOString().slice(0, 10);
const todayNum = () => dayNum(ymd(daysAgo(0)));
const weekdayOf = n => (new Date(n * 864e5).getUTCDay() + 6) % 7;
const weekStart = n => n - weekdayOf(n);
const sched = h => h.schedule || { type: 'daily' };
const startOf = h => Math.min(dayNum(h.created || ymd(daysAgo(0))), ...h.done.map(dayNum));
const isPausedOn = (h, n) => (h.pauses || []).some(p => n >= dayNum(p.from) && (!p.to || n <= dayNum(p.to)));
const isPaused = h => (h.pauses || []).some(p => !p.to);
const isActive = h => !h.archived && !isPaused(h);
const isDueOn = (h, n) => sched(h).type !== 'days' || sched(h).days.includes(weekdayOf(n));
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function scheduleText(h) {
  const s = sched(h);
  if (s.type === 'weekly') return `${s.times}× a week`;
  if (s.type === 'days') return s.days.length === 7 ? 'Every day' : s.days.slice().sort().map(d => DAY_SHORT[d]).join(' · ');
  return 'Every day';
}
// Check-offs so far in the week containing day n (for "X times a week" habits).
function weekCount(h, n) {
  const w = weekStart(n);
  return h.done.filter(k => { const d = dayNum(k); return d >= w && d < w + 7; }).length;
}
// Days of the week around n that the habit is running (not before it started, not paused). Scales weekly targets.
function activeDaysInWeek(h, n, start) {
  let a = 0;
  for (let d = weekStart(n); d < weekStart(n) + 7; d++) if (d >= start && !isPausedOn(h, d)) a++;
  return a;
}
const weeklyTarget = (h, n, start) => Math.ceil(sched(h).times * activeDaysInWeek(h, n, start) / 7);

// Current and best streak. Daily / specific-day habits count due days (rest days and paused days are skipped,
// today only counts once it's done); weekly habits count weeks that hit the target (this week only once it's hit).
function streaks(h) {
  const today = todayNum(), start = startOf(h), set = new Set(h.done.map(dayNum));
  let run = 0, best = 0;
  if (sched(h).type === 'weekly') {
    for (let w = weekStart(start); w <= today; w += 7) {
      const target = weeklyTarget(h, w, start);
      if (!target) continue;
      const count = weekCount(h, w);
      if (count >= target) best = Math.max(best, ++run);
      else if (w !== weekStart(today)) run = 0;
    }
    return { current: run, best, unit: 'week' };
  }
  for (let d = start; d <= today; d++) {
    if (isPausedOn(h, d) || !isDueOn(h, d)) continue;
    if (set.has(d)) best = Math.max(best, ++run);
    else if (d !== today) run = 0;
  }
  return { current: run, best, unit: 'day' };
}
const streak = h => streaks(h).current;
const streakLabel = h => { const s = streaks(h); return s.current ? `🔥 ${s.current}${s.unit === 'week' ? ' wk' : ''}` : ''; };

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// Tap runs onTap; holding ~0.5s without moving runs onHold. Swiping cancels both.
// While a finger is down the node gets .pressing, so the ring visibly "charges up" toward the hold.
function pressable(node, onTap, onHold) {
  let timer, sx, sy, held = false;
  const release = () => { clearTimeout(timer); node.classList.remove('pressing'); };
  node.addEventListener('pointerdown', e => {
    held = false; sx = e.clientX; sy = e.clientY;
    node.classList.add('pressing');
    timer = setTimeout(() => { held = true; release(); if (navigator.vibrate) navigator.vibrate(20); onHold(); }, 500);
  });
  node.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) release(); });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) node.addEventListener(t, release);
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
  const tn = todayNum();
  const shown = state.habits.filter(isActive);
  // "Due today": daily habits, specific-day habits scheduled today, weekly habits whose target isn't met yet
  // (or that were checked off today).
  const due = shown.filter(h => {
    const t = sched(h).type;
    if (t === 'days') return isDueOn(h, tn) || h.done.includes(today);
    if (t === 'weekly') return h.done.includes(today) || weekCount(h, tn) < weeklyTarget(h, tn, startOf(h));
    return true;
  });
  const doneCount = due.filter(h => h.done.includes(today)).length;
  $('progress').textContent = shown.length ? `${doneCount} of ${due.length} done · hold to edit` : '';
  renderBackupNudge();

  const keep = currentPage();
  pagesEl.replaceChildren();

  if (!shown.length) {
    const p = el('div', 'page empty', state.habits.length ? 'All your habits are paused or finished. Open ⚙ Settings to bring one back.' : 'Tap + to add your first habit.');
    pagesEl.append(p);
  }
  for (let start = 0; start < shown.length; start += PER_PAGE) {
    const page = el('div', 'page');
    for (const h of shown.slice(start, start + PER_PAGE)) {
      const doneToday = h.done.includes(today);
      const type = sched(h).type;
      // Weekly habits fill the ring over the week and count as done once the target is hit;
      // the others are done when checked off today.
      let p = doneToday ? 100 : 0, done = doneToday, sub = '';
      if (type === 'weekly') {
        const target = weeklyTarget(h, tn, startOf(h)) || 1, count = weekCount(h, tn);
        p = Math.min(100, count / target * 100); done = count >= target;
        sub = `${count}/${target} this week`;
      } else if (type === 'days' && !isDueOn(h, tn) && !doneToday) {
        sub = 'Rest day';
      }
      // The habit just tapped starts in its old state so the ring can animate to the new one.
      const animate = h.id === justToggled;
      const cell = el('button', 'habit');
      const setState = (pp, dd) => { cell.style.setProperty('--p', pp); cell.classList.toggle('done', dd); cell.classList.toggle('part', pp > 0 && pp < 100); };
      if (animate) {
        const before = type === 'weekly' ? Math.min(100, (weekCount(h, tn) + (doneToday ? -1 : 1)) / (weeklyTarget(h, tn, startOf(h)) || 1) * 100) : 100 - p;
        setState(before, before >= 100);
        requestAnimationFrame(() => requestAnimationFrame(() => setState(p, done)));
      } else setState(p, done);
      if (sub === 'Rest day') cell.classList.add('rest');
      cell.setAttribute('aria-label', `${h.name}, ${done ? 'done' : 'not done'}${sub ? ', ' + sub : ''}`);
      const ring = el('span', 'ring');
      ring.innerHTML = '<svg class="prog" viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="48"/><circle class="arc" cx="50" cy="50" r="48" pathLength="100"/></svg>';
      ring.insertAdjacentHTML('beforeend', faceHTML(h));
      ring.append(el('span', 'ok', '✓'));
      const label = el('span', 'label');
      label.append(el('span', 'n', h.name));
      const info = [sub, h.unit ? `${fmt(h.goal)} ${h.unit}` : '', streakLabel(h)].filter(Boolean).join(' · ');
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

// ---- Animated overlays ----
// Unhide, then add .open once the closed state has rendered so the CSS transition runs;
// on hide, remove .open and only set hidden after the transition has played.
const MOTION_MS = 340;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function showAnimated(node) {
  clearTimeout(node.hideTimer);
  node.hidden = false;
  node.getBoundingClientRect();
  node.classList.add('open');
}
function hideAnimated(node) {
  node.classList.remove('open');
  node.hideTimer = setTimeout(() => { node.hidden = true; }, reducedMotion() ? 0 : MOTION_MS);
}

// ---- Bottom sheet ----
// peek: a slim bar over an undimmed screen (used by the color picker).
function openSheet(html, bind, { peek = false } = {}) {
  const sheet = $('sheet');
  sheet.classList.toggle('peek', peek);
  sheet.querySelector('.panel').innerHTML = html;
  showAnimated(sheet);
  bind(sheet.querySelector('.panel'));
}
// onSheetClose runs once when the sheet goes away (e.g. to undo a color preview).
let onSheetClose = null;
function closeSheet() {
  hideAnimated($('sheet'));
  if (onSheetClose) { const f = onSheetClose; onSheetClose = null; f(); }
}
$('sheet').onclick = e => { if (e.target.id === 'sheet') closeSheet(); };

// "How often": every day, specific weekdays, or N times a week. onChange gets the new schedule.
function schedulePicker(box, s, onChange) {
  const cur = s || { type: 'daily' };
  const seg = (t, label) => `<button class="chip${cur.type === t ? ' sel' : ''}" data-t="${t}">${label}</button>`;
  box.innerHTML = `
    <div class="field">How often</div>
    <div class="chips">${seg('daily', 'Every day')}${seg('days', 'Specific days')}${seg('weekly', 'Times a week')}</div>
    ${cur.type === 'days' ? `<div class="weekdays">${DAY_LETTERS.map((l, i) => `<button class="wd${cur.days.includes(i) ? ' on' : ''}" data-d="${i}" aria-label="${DAY_SHORT[i]}">${l}</button>`).join('')}</div>` : ''}
    ${cur.type === 'weekly' ? `<div class="stepper"><button class="chip" data-step="-1" aria-label="Fewer">−</button><b>${cur.times}× a week</b><button class="chip" data-step="1" aria-label="More">+</button></div>` : ''}`;
  const set = v => { onChange(v); schedulePicker(box, v, onChange); };
  box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
    const t = b.dataset.t;
    set(t === 'days' ? { type: 'days', days: cur.type === 'days' ? cur.days : [0, 2, 4] }
      : t === 'weekly' ? { type: 'weekly', times: cur.type === 'weekly' ? cur.times : 3 } : { type: 'daily' });
  });
  box.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    const d = +b.dataset.d, days = cur.days.includes(d) ? cur.days.filter(x => x !== d) : [...cur.days, d];
    if (days.length) set({ type: 'days', days: days.sort((a, c) => a - c) });
  });
  box.querySelectorAll('[data-step]').forEach(b => b.onclick = () => set({ type: 'weekly', times: Math.min(6, Math.max(1, cur.times + +b.dataset.step)) }));
}
const setSchedule = (h, v) => { if (v.type === 'daily') delete h.schedule; else h.schedule = v; };

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  showAnimated(t);
  clearTimeout(t.timer);
  t.timer = setTimeout(() => hideAnimated(t), 2600);
}

// Name, how often, then optionally an icon and a goal in some unit (e.g. 2 L). Suggestions follow the name as you type.
function openAddSheet() {
  const pick = { mode: 'none', goal: '', unit: '', auto: true, face: {}, schedule: { type: 'daily' } };
  openSheet(`
    <h2>New habit</h2>
    <label class="field">Name<span class="goal"><input id="hname" maxlength="40" placeholder="e.g. Drink water" autocomplete="off"></span></label>
    <div id="freq"></div>
    <div id="emo"></div>
    <div id="opts"></div>
    <div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="primary" id="save">Add habit</button></div>
  `, () => {});
  schedulePicker($('freq'), pick.schedule, v => { pick.schedule = v; });
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
      <label class="field">Goal
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
  $('save').onclick = () => {
    const n = name.value.trim();
    if (!n) return name.focus();
    const last = state.habits[state.habits.length - 1];
    const h = { id: 'h_' + Date.now().toString(36), name: n, created: ymd(daysAgo(0)), done: [],
      color: last ? (last.color + 1) % PALETTE.length : 0 };
    setFace(h, pick.face);
    setSchedule(h, pick.schedule);
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
    goToPage(Math.floor((state.habits.filter(isActive).length - 1) / PER_PAGE));
  };
  drawOpts();
  drawEmoji();
  // No auto-focus: on iPhone the keyboard would pop up mid-slide and jolt the sheet. It opens when the name is tapped.
}
$('add').onclick = openAddSheet;

// A slim bar with a swipeable row of colors; the home screen stays visible and previews each tap.
// Done keeps the color; Cancel or tapping the screen above goes back to the previous one.
function openThemeSheet() {
  let pick = themeIndex;
  openSheet(`
    <div class="peek-top"><button class="link" id="cancel">Cancel</button><b id="theme-name">${THEMES[pick][0]}</b><button class="link strong" id="close">Done</button></div>
    <div class="themes">${THEMES.map(([n, a, b, c, light], i) =>
      `<button class="swatch${i === pick ? ' sel' : ''}${light ? ' light' : ''}" data-i="${i}" aria-label="${n}" style="background:linear-gradient(160deg, ${a}, ${b}, ${c})"></button>`).join('')}</div>
  `, panel => {
    panel.querySelectorAll('.swatch').forEach(b => b.onclick = () => {
      pick = +b.dataset.i;
      applyTheme(pick);
      panel.querySelector('.swatch.sel').classList.remove('sel');
      b.classList.add('sel');
      $('theme-name').textContent = THEMES[pick][0];
    });
    panel.querySelector('.swatch.sel').scrollIntoView({ block: 'nearest', inline: 'center' });
    onSheetClose = () => applyTheme(themeIndex);
    $('cancel').onclick = closeSheet;
    $('close').onclick = () => {
      themeIndex = pick;
      try { localStorage.setItem(THEME_KEY, themeIndex); } catch {}
      closeSheet();
    };
  }, { peek: true });
}


// Holding a circle: pause / finish / delete, rename, change how often, fix any of the past year's days, change the icon.
const HISTORY_DAYS = 365;
function openEditSheet(h) {
  const color = PALETTE[h.color % PALETTE.length];
  const streakText = () => {
    const { current, unit } = streaks(h);
    return `${scheduleText(h)}${h.unit ? ` · ${fmt(h.goal)} ${esc(h.unit)}` : ''} · ${current ? `🔥 ${current} ${unit} streak` : 'No streak yet'}`;
  };
  // Oldest on the left, today on the far right; a month label marks the 1st and the first chip.
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => daysAgo(HISTORY_DAYS - 1 - i)).map((d, i) => {
    const key = ymd(d);
    const month = i === 0 || d.getDate() === 1 ? d.toLocaleDateString(undefined, { month: 'short' }) : '';
    return `<button class="day${h.done.includes(key) ? ' on' : ''}${isDueOn(h, dayNum(key)) ? '' : ' rest'}" data-day="${key}"><i>${month}</i>${d.toLocaleDateString(undefined, { weekday: 'short' })}<b>${d.getDate()}</b></button>`;
  }).join('');
  openSheet(`
    <div class="title-row"><span id="edit-emoji" class="face">${h.icon || h.emoji ? faceHTML(h) : ''}</span>
      <input id="rename" class="title-input" maxlength="40" value="${esc(h.name)}" aria-label="Habit name" autocomplete="off" enterkeyhint="done"><span class="pen" aria-hidden="true">✎</span></div>
    <p class="sub" id="edit-streak">${streakText()}</p>
    <div class="top-actions">
      <button class="act" id="pause">${iconSvg('ui-pause')}<span>Pause</span></button>
      <button class="act" id="finish">${iconSvg('ui-archive')}<span>Finish</span></button>
      <button class="act danger" id="del">${iconSvg('trash')}<span>Delete</span></button>
    </div>
    <div id="freq"></div>
    <p class="sub">Tap a day to mark it done or not done. Swipe for earlier days.</p>
    <div class="days" style="--c:${color}">${days}</div>
    <div id="emo"></div>
    <div class="actions"><button class="primary" id="close">Done</button></div>
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

    schedulePicker($('freq'), sched(h), v => {
      setSchedule(h, v);
      save();
      $('edit-streak').innerHTML = streakText();
      strip.querySelectorAll('.day').forEach(b => b.classList.toggle('rest', !isDueOn(h, dayNum(b.dataset.day))));
    });

    $('close').onclick = () => { commit(); closeSheet(); };
    $('pause').onclick = () => {
      commit();
      pauseHabit(h);
      closeSheet();
      toast(`"${h.name}" paused. Resume it in ⚙ Settings.`);
    };
    $('finish').onclick = () => {
      if (!confirm(`Finish "${h.name}"? It's hidden but keeps its history, and you can restore it in Settings.`)) return;
      commit();
      h.archived = ymd(daysAgo(0));
      closeSheet();
      save();
      toast(`"${h.name}" finished. Nice work.`);
    };
    $('del').onclick = () => {
      if (confirm(`Delete "${h.name}" and its history? This can't be undone.`)) {
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
const longestStreak = h => streaks(h).best;
const RANGES = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year'], ['all', 'All time'], ['custom', 'Custom dates…']];
// Day = today; Week / Month / Year = the last 7 / 30 / 365 days; custom = { from, to } picked on a calendar.
const statsView = { habit: 'all', range: 'month', custom: null };
const yearOf = n => new Date(n * 864e5).getUTCFullYear();
const monthOf = n => new Date(n * 864e5).getUTCMonth();
const dateOf = n => new Date(n * 864e5).getUTCDate();
const WINDOW = { day: 1, week: 7, month: 30, year: 365 };

function period(range, earliest) {
  const t = todayNum(), md = { month: 'short', day: 'numeric' };
  const span = (f, l) => `${fmtDay(f, { ...md, year: yearOf(f) === yearOf(l) ? undefined : 'numeric' })} – ${fmtDay(l, md)}${yearOf(l) === yearOf(t) ? '' : ', ' + yearOf(l)}`;
  if (range === 'day') return { from: t, to: t, label: `Today · ${fmtDay(t, { weekday: 'long', ...md })}` };
  if (WINDOW[range]) {
    const f = t - WINDOW[range] + 1;
    return { from: f, to: t, label: `Last ${WINDOW[range]} days · ${span(Math.max(f, earliest), t)}` };
  }
  if (range === 'custom' && statsView.custom) {
    const { from, to } = statsView.custom;
    return { from, to, label: from === to ? fmtDay(from, { weekday: 'long', ...md, year: 'numeric' }) : span(from, to) };
  }
  return { from: earliest, to: t, label: `All time · since ${fmtDay(earliest, { ...md, year: 'numeric' })}` };
}

// A big scrollable calendar: tap a start date, then an end date (the days between light up), then Apply.
// Only dates from the first habit up to today can be picked.
function openRangePicker(earliest, onApply, onCancel) {
  const t = todayNum();
  let from = statsView.custom ? statsView.custom.from : null, to = statsView.custom ? statsView.custom.to : null;
  const months = [];
  for (let y = yearOf(earliest), m = monthOf(earliest); Date.UTC(y, m, 1) / 864e5 <= t; m++) {
    if (m > 11) { m = 0; y++; }
    months.push([y, m]);
  }
  const md = { month: 'short', day: 'numeric', year: 'numeric' };
  openSheet(`
    <h2>Custom dates</h2>
    <p class="sub" id="rp-sum"></p>
    <div class="pcal-wrap">${months.map(([y, m]) => {
      const f = Date.UTC(y, m, 1) / 864e5, n = dateOf(Date.UTC(y, m + 1, 0) / 864e5);
      const cells = Array.from({ length: weekdayOf(f) }, () => '<span></span>').concat(Array.from({ length: n }, (_, i) => {
        const d = f + i, ok = d >= earliest && d <= t;
        return `<button class="pd${d === t ? ' today' : ''}" data-d="${d}"${ok ? '' : ' disabled'}>${i + 1}</button>`;
      }));
      return `<div class="pm"><h4>${fmtDay(f, { month: 'long', year: 'numeric' })}</h4>
        <div class="pgrid">${DAY_LETTERS.map(l => `<i>${l}</i>`).join('')}${cells.join('')}</div></div>`;
    }).join('')}</div>
    <div class="actions sticky"><button class="ghost" id="rp-cancel">Cancel</button><button class="primary" id="rp-apply">Apply</button></div>
  `, panel => {
    const paint = () => {
      panel.querySelectorAll('.pd[data-d]').forEach(b => {
        const d = +b.dataset.d;
        b.classList.toggle('sel', d === from || d === to);
        b.classList.toggle('inrange', from != null && to != null && d > from && d < to);
      });
      $('rp-sum').textContent = from == null ? 'Tap a start date.'
        : to == null ? `From ${fmtDay(from, md)}. Now tap an end date (or Apply for just that day).`
        : `${fmtDay(from, md)} – ${fmtDay(to, md)} · ${to - from + 1} days`;
      $('rp-apply').disabled = from == null;
    };
    panel.querySelectorAll('.pd[data-d]').forEach(b => b.onclick = () => {
      const d = +b.dataset.d;
      if (from == null || to != null) { from = d; to = null; }
      else if (d < from) { to = from; from = d; }
      else to = d;
      paint();
    });
    onSheetClose = onCancel;
    $('rp-cancel').onclick = closeSheet;
    $('rp-apply').onclick = () => { onSheetClose = null; closeSheet(); onApply({ from, to: to ?? from }); };
    paint();
    // Open on the start date's month, or the current month.
    const target = panel.querySelector(`.pd[data-d="${from ?? t}"]`);
    if (target) panel.scrollTop = target.closest('.pm').offsetTop - 60;
  });
}

// Per day, how many check-offs were expected ("possible") and made ("done") across the habits.
// Rest days and paused days expect nothing. A weekly habit expects target/7 a day and only its first
// `target` check-offs in a week count, so bonus sessions can't push the rate past 100%.
function computeStats(habits, fromDay, toDay) {
  const today = todayNum();
  const earliest = Math.min(...habits.map(startOf));
  const from = Math.max(fromDay, earliest), to = Math.min(toDay, today);
  const days = [];
  let done = 0, possible = 0;
  const weekday = Array.from({ length: 7 }, () => ({ done: 0, possible: 0 }));
  const info = habits.map(h => ({ h, start: startOf(h), set: new Set(h.done.map(dayNum)), weekly: sched(h).type === 'weekly', used: new Map() }));
  for (let d = from; d <= to; d++) {
    let dd = 0, dp = 0;
    for (const x of info) {
      const { h, start, set } = x;
      if (d < start || isPausedOn(h, d)) continue;
      const hit = set.has(d);
      if (x.weekly) {
        const target = weeklyTarget(h, d, start), active = activeDaysInWeek(h, d, start);
        if (d === today && !hit) continue;
        dp += active ? target / active : 0;
        if (hit) {
          const w = weekStart(d), used = x.used.get(w) ?? h.done.filter(k => { const n = dayNum(k); return n >= w && n < d; }).length;
          x.used.set(w, used + 1);
          if (used < target) dd++;
        }
      } else {
        if (!isDueOn(h, d)) continue;
        if (d === today && !hit) continue;
        dp++; if (hit) dd++;
      }
    }
    const wd = weekdayOf(d);
    weekday[wd].done += dd; weekday[wd].possible += dp;
    done += dd; possible += dp;
    days.push({ d, key: keyOf(d), done: dd, possible: dp });
  }
  return { days, done, possible, weekday, from, to, today };
}

// Weekly habits make 'possible' fractional, and doing a week's sessions early can briefly beat it: cap at 100%.
const pct = (a, b) => b ? Math.min(100, Math.round(a / b * 100)) : 0;
const rnd = n => Math.round(n);

// Trend points: the week shows each day's rate; longer ranges use a 7-day rolling rate so the line
// moves like a stock chart instead of jumping between 0% and 100%.
// The completion line, stock-chart style: one point per day across the whole period, smoothed with a
// rolling average whose length grows with the period (Week: none, Month: 7 days, Year / All time: 30 days),
// so dragging along it moves smoothly from day to day. Labels along the bottom mark evenly spaced dates.
function trendLine(sel, st, range) {
  const span = st.to - st.from + 1;
  const win = range === 'week' ? 1 : range === 'month' ? 7 : range === 'year' ? 30
    : span > 120 ? 30 : span > 21 ? 7 : 1;
  const ext = computeStats(sel, st.from - win + 1, st.to);
  const days = ext.days;
  const withYear = yearOf(st.from) !== yearOf(st.to) || yearOf(st.to) !== yearOf(todayNum());
  // On long views, skip the first week after the very first habit: one or two days of history make a fake cliff.
  const warmup = span > 62 ? Math.min(...sel.map(startOf)) + 6 : -Infinity;
  const points = [];
  days.forEach((x, i) => {
    if (x.d < st.from || x.d < warmup) return;
    let dn = 0, ps = 0;
    for (let j = Math.max(0, i - win + 1); j <= i; j++) { dn += days[j].done; ps += days[j].possible; }
    const date = fmtDay(x.d, { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
    points.push({ d: x.d, label: date, v: ps ? Math.min(100, dn / ps * 100) : null,
      tip: ps ? `${date}: ${pct(dn, ps)}%${win > 1 ? '' : ` (${rnd(dn)} of ${rnd(ps)})`}` : `${date}: nothing to do` });
  });
  // 2 labels for short periods, up to 5 for long ones; months ("Jan 26") once it's longer than ~2 months.
  const n = points.length, ticks = n <= 7 ? 2 : n <= 31 ? 3 : 5;
  const tick = d => span > 62 ? fmtDay(d, { month: 'short', ...(withYear ? { year: 'numeric' } : {}) }) : fmtDay(d, { month: 'short', day: 'numeric' });
  const labels = n ? Array.from({ length: ticks }, (_, k) => {
    const d = points[Math.round(k * (n - 1) / (ticks - 1))].d;
    return d === todayNum() ? 'Today' : tick(d);
  }) : [];
  return { points, labels, title: win > 1 ? `Completion · ${win}-day average` : 'Completion · each day' };
}

// Today hour by hour: how much of today's habits was done by each hour, up to now. Check-offs without a
// saved time count from now.
function dayProgress(due, key) {
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  const mins = due.filter(h => h.done.includes(key)).map(h => (h.times && h.times[key] != null ? h.times[key] : nowMin));
  return Array.from({ length: 25 }, (_, hr) => {
    if (hr * 60 > nowMin + 60) return { v: null, tip: '' };
    const n = mins.filter(m => m < hr * 60).length;
    return { label: `By ${hourName(hr)} · ${n} of ${due.length} done`, v: due.length ? n / due.length * 100 : null, tip: `By ${hourName(hr)}: ${n} of ${due.length} done (${pct(n, due.length)}%)` };
  });
}

function lineChart(points, xLabels, yLabels = ['100%', '50%', '0%'], { baseline = null, clean = false } = {}) {
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
  return `<div class="lchart${yLabels.some(Boolean) ? '' : ' noy'}${clean ? ' clean' : ''}">
    <div class="readout" aria-live="polite">${lastI >= 0 ? esc(points[lastI].tip) : 'No data yet'}</div>
    <div class="lplot">
      <div class="grid">${yLabels.map(l => `<span>${l}</span>`).join('')}</div>
      <div class="lsvg">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
          <path d="${area}" fill="url(#${gid})"/>
          ${baseline != null ? `<line x1="0" x2="${W}" y1="${y(baseline).toFixed(1)}" y2="${y(baseline).toFixed(1)}" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="1 5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : ''}
          <path d="${line}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="xhair" hidden></span><span class="xdot" hidden></span>
      </div>
    </div>
    <div class="xlabels">${xLabels.map(l => `<span>${esc(l)}</span>`).join('')}</div>
  </div>`;
}

// Drag or tap across the line to read any day.
function bindLineChart(root, points, onScrub) {
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
    if (p.tip) out.textContent = p.tip;
    if (onScrub && p.v != null) onScrub(p);
  };
  box.addEventListener('pointerdown', e => { box.setPointerCapture(e.pointerId); at(e); });
  box.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || box.hasPointerCapture(e.pointerId)) at(e); });
  if (onScrub) {
    const end = () => { hair.hidden = true; dot.hidden = true; onScrub(null); };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') end(); });
  }
}

// Check-offs per hour across the selected habits and range, smoothed over 3 hours (wrapping at midnight).
const hourName = h => `${h % 12 || 12} ${h % 24 < 12 ? 'AM' : 'PM'}`;
function timeOfDay(habits, from, to) {
  const counts = Array(24).fill(0);
  let total = 0;
  for (const h of habits) for (const [key, min] of Object.entries(h.times || {})) {
    if (dayNum(key) < from || dayNum(key) > to || !h.done.includes(key)) continue;
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
        <button class="bar" data-tip="${esc(b.long)}: ${b.possible ? `${pct(b.done, b.possible)}% (${rnd(b.done)} of ${rnd(b.possible)})` : 'nothing to do yet'}">
          <span class="fill${b.possible ? '' : ' none'}" style="height:${b.possible ? Math.max(2, pct(b.done, b.possible)) : 0}%"></span>
          <span class="tick">${esc(b.short)}</span>
        </button>`).join('')}
      </div>
    </div>
  </div>`;
}


function openStats() {
  const view = $('stats');
  const habits = state.habits.filter(h => !h.archived);
  if (!habits.length) {
    view.innerHTML = `<div class="stats-in"><div class="stats-top"><button class="round" id="stats-close" aria-label="Back">‹</button><h1>Stats</h1></div>
      <p class="stats-empty">Add a habit to see your stats.</p></div>`;
    $('stats-close').onclick = closeStats;
    showAnimated(view);
    return;
  }
  if (!habits.some(h => h.id === statsView.habit)) statsView.habit = 'all';

  // Slide 0 is "All habits" (a row of mini rings that drifts when there are more than 5), then one slide per habit.
  const drift = habits.length > 5;
  const minis = habits.map(h => `<span class="mini">${faceHTML(h)}</span>`).join('');
  view.innerHTML = `<div class="stats-in">
      <div class="stats-top">
        <button class="round" id="stats-close" aria-label="Back">‹</button><h1>Stats</h1>
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
  showAnimated(view);
  view.scrollTop = 0;
  car.scrollTo({ left: start * car.clientWidth, behavior: 'instant' });
  markDots(start);
  car.addEventListener('scroll', () => {
    const i = idxOf();
    markDots(i);
    const id = i === 0 ? 'all' : habits[i - 1] && habits[i - 1].id;
    if (id && id !== statsView.habit) { statsView.habit = id; drawBody(); }
  }, { passive: true });

  $('stats-close').onclick = closeStats;
  drawBody();
}


function pickCustom(prev) {
  const habits = state.habits.filter(h => !h.archived);
  const earliest = Math.min(...habits.map(startOf));
  openRangePicker(earliest, r => { statsView.custom = r; statsView.range = 'custom'; drawBody(); },
    () => { if (!statsView.custom) statsView.range = prev; drawBody(); });
}

function drawBody() {
  const habits = state.habits.filter(h => !h.archived);
  const one = habits.find(h => h.id === statsView.habit);
  const sel = one ? [one] : habits;
  const earliest = Math.min(...sel.map(startOf)), today = todayNum();
  const range = statsView.range;
  const p = period(range, earliest);
  const st = computeStats(sel, p.from, p.to);


  const wk = h => sched(h).type === 'weekly' ? '<small> wk</small>' : '';
  // A single day counts everything that was due that day, today included ("0 of 3 done" beats "0 of 0").
  const dayDue = range === 'day' ? sel.filter(h => p.from >= startOf(h) && !isPausedOn(h, p.from)
    && (h.done.includes(keyOf(p.from)) || (sched(h).type !== 'weekly' && isDueOn(h, p.from)))) : [];
  const dayDone = dayDue.filter(h => h.done.includes(keyOf(p.from))).length;
  const [doneN, possibleN] = range === 'day' ? [dayDone, dayDue.length] : [st.done, st.possible];
  const nums = one ? [
    [`${rnd(doneN)}<small>/${rnd(possibleN)}</small>`, sched(one).type === 'weekly' ? 'check-offs' : 'days done'],
    [one.done.length, 'all-time total'],
    [`${streak(one)}${wk(one)}`, 'current streak'],
    [`${longestStreak(one)}${wk(one)}`, 'longest streak'],
  ] : (() => {
    const best = habits.map(h => [longestStreak(h), h]).sort((a, b) => b[0] - a[0])[0];
    return [
      [`${rnd(doneN)}<small>/${rnd(possibleN)}</small>`, 'check-offs'],
      [`${best[0]}${best[0] ? wk(best[1]) : ''}`, `best streak${best[0] ? `<span class="who">${best[1].icon ? `<span class="wi">${iconSvg(best[1].icon)}</span>` : best[1].emoji ? esc(best[1].emoji) + ' ' : ''}${esc(best[1].name)}</span>` : ''}`],
    ];
  })();
  const numsHTML = `<div class="nums" style="grid-template-columns:repeat(${nums.length === 4 ? 2 : nums.length}, 1fr)">${nums.map(([v, k]) => `<div class="num"><div class="nv">${v}</div><div class="nk">${k}</div></div>`).join('')}</div>`;

  const body = $('stats-body');
  const bindBars = () => {
    const bc = body.querySelector('.bchart'), out = bc.querySelector('.readout');
    bc.querySelectorAll('.bar').forEach(bar => {
      const show = () => { bc.querySelectorAll('.bar.on').forEach(o => o.classList.remove('on')); bar.classList.add('on'); out.textContent = bar.dataset.tip; };
      bar.onclick = show;
      bar.onpointerenter = e => { if (e.pointerType === 'mouse') show(); };
    });
    return bc;
  };
  const todNoteFor = tod => tod.total
    ? `Usually around <b>${hourName(tod.peak)}</b> · ${tod.total} timed check-off${tod.total === 1 ? '' : 's'}.`
    : 'Times are saved from now on when you tap a circle, so this fills in as you go.';

  const isDay = range === 'day';
  const cs = isDay ? computeStats(sel, weekStart(p.from), weekStart(p.from) + 6) : st;   // day-of-week bars' period
  const trend = isDay ? { points: dayProgress(dayDue, keyOf(p.from)), labels: ['12a', '6a', '12p', '6p', '12a'], title: 'Today, hour by hour' } : trendLine(sel, st, range);
  const pts = trend.points.some(x => x.v != null) ? trend.points : [];
  const xLabels = trend.labels;

  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const wd = cs.weekday.map((w, i) => ({ ...w, short: names[i][0], long: isDay ? fmtDay(cs.from + i, { weekday: 'long', month: 'short', day: 'numeric' }) : names[i] }));
  const ranked = wd.filter(w => w.possible).sort((a, c) => pct(c.done, c.possible) - pct(a.done, a.possible));
  const wdNote = ranked.length > 1
    ? `Best on <b>${ranked[0].long}s</b> (${pct(ranked[0].done, ranked[0].possible)}%), weakest on <b>${ranked[ranked.length - 1].long}s</b> (${pct(ranked[ranked.length - 1].done, ranked[ranked.length - 1].possible)}%).`
    : 'Keep going to see which days work best.';

  const tod = isDay ? timeOfDay(sel, p.from, p.from) : timeOfDay(sel, st.from, st.to);
  const todNote = isDay ? (tod.total ? `Around <b>${hourName(tod.peak)}</b> today.` : 'Nothing checked off yet today.') : todNoteFor(tod);

  // Robinhood-style header: the big number is the period's completion; dragging the chart shows each point
  // instead, with how far it is from where the line started. Lifting the finger snaps back.
  const drawn = pts.filter(x => x.v != null);
  const startV = drawn.length ? drawn[0].v : null, endV = drawn.length ? drawn[drawn.length - 1].v : null;
  const SINCE = { day: 'today', week: 'past week', month: 'past month', year: 'past year', all: 'all time', custom: 'in this range' };
  const change = (v, when) => {
    if (isDay) return when;
    const dlt = Math.round(v - startV);
    return `<span class="chg">${dlt > 0 ? '▲' : dlt < 0 ? '▼' : '•'} ${Math.abs(dlt)}%</span> ${when}`;
  };
  const idleSub = isDay ? `${dayDone} of ${dayDue.length} done today` : drawn.length > 1 ? change(endV, SINCE[range]) : esc(p.label);
  const PILLS = [['day', '1D'], ['week', '1W'], ['month', '1M'], ['year', '1Y'], ['all', 'ALL'], ['custom', 'Custom']];
  body.innerHTML = `
    <div class="rh">
      <div class="rh-val" id="rh-val">${pct(doneN, possibleN)}%</div>
      <div class="rh-sub" id="rh-sub">${idleSub}</div>
      ${pts.length ? lineChart(pts, xLabels, ['', '', ''], { baseline: isDay ? null : startV, clean: true }) : `<p class="note">${isDay ? 'Nothing due today.' : 'Nothing to show for this period yet.'}</p>`}
      <div class="rh-periods">${PILLS.map(([k, l]) => `<button class="${range === k ? 'sel' : ''}" data-r="${k}">${l}</button>`).join('')}</div>
      <p class="rh-range">${esc(p.label)}</p>
    </div>
    <hr class="sep">
    ${numsHTML}
    <hr class="sep">
    <div class="duo">
      <div><h3>Day of the week</h3>${barChart(wd)}<p class="note">${isDay ? `${fmtDay(cs.from, { month: 'short', day: 'numeric' })} – ${fmtDay(cs.from + 6, { month: 'short', day: 'numeric' })}` : wdNote}</p></div>
      <div id="tod"><h3>Time of day</h3>${lineChart(tod.points, ['12a', '6a', '12p', '6p', '12a'], ['', '', ''])}<p class="note">${todNote}</p></div>
    </div>`;
  body.querySelectorAll('.rh-periods [data-r]').forEach(b => b.onclick = () => {
    const r = b.dataset.r;
    if (r === 'custom') pickCustom(range);          // also re-opens the calendar when Custom is already on
    else { statsView.range = r; drawBody(); }
  });
  if (pts.length) bindLineChart(body.querySelector('.rh .lchart'), pts, pt => {
    $('rh-val').textContent = `${pct(pt ? pt.v : doneN, pt ? 100 : possibleN)}%`;
    $('rh-sub').innerHTML = pt ? (isDay ? esc(pt.label) : change(pt.v, esc(pt.label))) : idleSub;
  });
  bindLineChart($('tod').querySelector('.lchart'), tod.points);
  $('tod').querySelector('.readout').textContent = tod.total ? tod.points[tod.peak].tip : isDay ? 'No times today' : 'No times yet';
  const bc = bindBars();
  if (isDay) {
    // Point the week bars at today.
    const bar = bc.querySelectorAll('.bar')[p.from - cs.from];
    bar.classList.add('on'); bc.querySelector('.readout').textContent = bar.dataset.tip;
  }
}
function closeStats() { hideAnimated($('stats')); }
$('stats-btn').onclick = openStats;
// Toolbar icons use the same one-color set as the habits, so they follow the theme's text color.
$('stats-btn').insertAdjacentHTML('afterbegin', iconSvg('chart-line-up'));
$('settings').innerHTML = iconSvg('ui-gear-six');

// Pausing starts an open-ended pause today; resuming closes it yesterday (or drops it if it started today).
function pauseHabit(h) {
  (h.pauses = h.pauses || []).push({ from: ymd(daysAgo(0)), to: null });
  save();
}
function resumeHabit(h) {
  const p = (h.pauses || []).find(x => !x.to);
  if (!p) return;
  if (p.from === ymd(daysAgo(0))) h.pauses = h.pauses.filter(x => x !== p);
  else p.to = ymd(daysAgo(1));
  if (!h.pauses.length) delete h.pauses;
  save();
}

// Days since the last export, counted from the first habit if there's never been one.
function daysSinceBackup() {
  if (!state.habits.length) return 0;
  const ref = state.lastBackup ? dayNum(state.lastBackup) : Math.min(...state.habits.map(startOf));
  return todayNum() - ref;
}
function backupText() {
  if (!state.lastBackup) return 'Never backed up.';
  const n = daysSinceBackup();
  return `Last backup: ${n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`}.`;
}
function renderBackupNudge() { $('nudge').hidden = daysSinceBackup() < 14; }

// Drag rows of `list` by their .grip. The dragged row follows the finger, the rows it passes slide out of
// the way, and dragging near the top/bottom of `scroller` scrolls it. onDrop gets the ids in their new order.
function dragToReorder(list, scroller, onDrop) {
  list.querySelectorAll('.grip').forEach(grip => grip.addEventListener('pointerdown', e => {
    e.preventDefault();
    const row = grip.closest('.srow'), rows = [...list.querySelectorAll('.srow')];
    const from = rows.indexOf(row), step = row.offsetHeight;
    const y0 = e.clientY, s0 = scroller.scrollTop;
    let to = from, lastY = e.clientY, raf = 0;
    grip.setPointerCapture(e.pointerId);
    row.classList.add('dragging');
    list.classList.add('sorting');
    if (navigator.vibrate) navigator.vibrate(15);

    const layout = () => {
      const dy = lastY - y0 + (scroller.scrollTop - s0);
      row.style.transform = `translateY(${dy}px)`;
      to = Math.max(0, Math.min(rows.length - 1, from + Math.round(dy / step)));
      rows.forEach((r, i) => {
        if (r === row) return;
        const shift = from < to && i > from && i <= to ? -step : from > to && i >= to && i < from ? step : 0;
        r.style.transform = shift ? `translateY(${shift}px)` : '';
      });
    };
    // Keep scrolling while the finger rests near an edge.
    const edgeScroll = () => {
      const box = scroller.getBoundingClientRect();
      const v = lastY < box.top + 70 ? -8 : lastY > box.bottom - 70 ? 8 : 0;
      if (v) { scroller.scrollTop += v; layout(); }
      raf = requestAnimationFrame(edgeScroll);
    };
    raf = requestAnimationFrame(edgeScroll);

    const onMove = ev => { lastY = ev.clientY; layout(); };
    const onEnd = () => {
      cancelAnimationFrame(raf);
      grip.removeEventListener('pointermove', onMove);
      grip.removeEventListener('pointerup', onEnd);
      grip.removeEventListener('pointercancel', onEnd);
      list.classList.remove('sorting');
      const ids = rows.map(r => r.dataset.id);
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      onDrop(ids);
    };
    grip.addEventListener('pointermove', onMove);
    grip.addEventListener('pointerup', onEnd);
    grip.addEventListener('pointercancel', onEnd);
  }));
}

function openSettings() {
  const draw = () => {
    const panelEl = $('sheet').querySelector('.panel'), keep = panelEl.scrollTop;
    const active = state.habits.filter(isActive);
    const paused = state.habits.filter(h => !h.archived && isPaused(h));
    const finished = state.habits.filter(h => h.archived);
    const GRIP = '<svg viewBox="0 0 12 20" aria-hidden="true"><circle cx="3" cy="4" r="1.8"/><circle cx="9" cy="4" r="1.8"/><circle cx="3" cy="10" r="1.8"/><circle cx="9" cy="10" r="1.8"/><circle cx="3" cy="16" r="1.8"/><circle cx="9" cy="16" r="1.8"/></svg>';
    const row = (h, btns, drag) => `<div class="srow"${drag ? ` data-id="${h.id}"` : ''}>${drag ? `<span class="grip" aria-label="Drag to reorder ${esc(h.name)}">${GRIP}</span>` : ''}<span class="sface">${faceHTML(h)}</span><span class="sname">${esc(h.name)}<small>${scheduleText(h)}</small></span>${btns}</div>`;
    openSheet(`
      <h2>Settings</h2>
      <button class="srow tap" id="colors"><span class="sface">${iconSvg('palette')}</span><span class="sname">Colors<small>${THEMES[themeIndex][0]}</small></span><span class="chev">›</span></button>
      <h3 class="sh">Order</h3>
      ${active.length > 1 ? '<p class="sub hint">Drag ⠿ to move, or use the arrows.</p>' : ''}
      ${active.length ? '<div class="order">' + active.map((h, i) => row(h, `<button class="mini-btn" data-up="${h.id}"${i ? '' : ' disabled'} aria-label="Move ${esc(h.name)} up">${iconSvg('ui-caret-up')}</button><button class="mini-btn" data-down="${h.id}"${i < active.length - 1 ? '' : ' disabled'} aria-label="Move ${esc(h.name)} down">${iconSvg('ui-caret-down')}</button>`, true)).join('') + '</div>' : '<p class="sub">No active habits.</p>'}
      ${paused.length ? '<h3 class="sh">Paused</h3>' + paused.map(h => row(h, `<button class="chip" data-resume="${h.id}">Resume</button>`)).join('') : ''}
      ${finished.length ? '<h3 class="sh">Finished</h3>' + finished.map(h => row(h, `<button class="chip" data-restore="${h.id}">Restore</button><button class="mini-btn danger" data-delete="${h.id}" aria-label="Delete ${esc(h.name)}">${iconSvg('trash')}</button>`)).join('') : ''}
      <h3 class="sh">Backup</h3>
      <p class="sub">Your habits are saved only on this phone. Export a backup file now and then (save it to Files or iCloud) so you never lose them. ${backupText()}</p>
      <div class="actions"><button class="ghost" id="import">${iconSvg('ui-upload-simple')}Import</button><button class="primary" id="export">${iconSvg('ui-download-simple')}Export</button></div>
      <div class="actions done-row"><button class="ghost" id="close">Done</button></div>
      <div class="links">Version 32</div>
    `, panel => {
      panel.scrollTop = keep;
      const byId = id => state.habits.find(h => h.id === id);
      // Swap with the neighbouring active habit in the stored order (paused/finished ones keep their place).
      const move = (h, dir) => {
        const list = state.habits.filter(isActive), j = list.indexOf(h) + dir;
        if (j < 0 || j >= list.length) return;
        const a = state.habits.indexOf(h), b = state.habits.indexOf(list[j]);
        [state.habits[a], state.habits[b]] = [state.habits[b], state.habits[a]];
        save(); draw();
      };
      // Put the active habits in a new order; paused/finished ones keep their slots in the stored list.
      const reorder = ids => {
        const slots = state.habits.map((x, i) => isActive(x) ? i : -1).filter(i => i >= 0);
        ids.map(byId).forEach((x, k) => { state.habits[slots[k]] = x; });
        save(); draw();
      };
      const order = panel.querySelector('.order');
      if (order) dragToReorder(order, panel, reorder);
      panel.querySelectorAll('[data-up]').forEach(b => b.onclick = () => move(byId(b.dataset.up), -1));
      panel.querySelectorAll('[data-down]').forEach(b => b.onclick = () => move(byId(b.dataset.down), 1));
      panel.querySelectorAll('[data-resume]').forEach(b => b.onclick = () => { resumeHabit(byId(b.dataset.resume)); draw(); });
      panel.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => { delete byId(b.dataset.restore).archived; save(); draw(); });
      panel.querySelectorAll('[data-delete]').forEach(b => b.onclick = () => {
        const h = byId(b.dataset.delete);
        if (confirm(`Delete "${h.name}" and its history? This can't be undone.`)) { state.habits = state.habits.filter(x => x !== h); save(); draw(); }
      });
      $('colors').onclick = openThemeSheet;
      $('export').onclick = () => { exportData(); draw(); };
      $('import').onclick = () => $('file').click();
      $('close').onclick = closeSheet;
    });
  };
  draw();
}
$('settings').onclick = openSettings;
$('nudge').onclick = openSettings;

function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = `habits-${ymd(daysAgo(0))}.json`;
  a.click();
  state.lastBackup = ymd(daysAgo(0));
  save();
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
// Ask the browser to keep this site's storage instead of clearing it when space runs low.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

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
