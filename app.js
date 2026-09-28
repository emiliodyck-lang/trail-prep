const KEY = 'habits.v1';
const PER_PAGE = 6;
const PALETTE = ['#ff6b6b', '#f59f00', '#12b886', '#4c6ef5', '#845ef7', '#e64980'];
const $ = id => document.getElementById(id);

// Background gradients: [top, middle, bottom]. Picked with the 🎨 button, remembered per device.
const THEMES = [
  ['Violet', '#5b7cfa', '#9b5de5', '#e05cb5'],
  ['Sunset', '#ff8a4c', '#ff4f7b', '#c2409b'],
  ['Ocean', '#2f6fe4', '#1596c9', '#12a88a'],
  ['Forest', '#11865f', '#2f9e44', '#7a9a12'],
  ['Night', '#262463', '#4a3fc4', '#8b3fd9'],
];
const THEME_KEY = 'habits.theme';
function applyTheme(i) {
  const [, a, b, c] = THEMES[i] || THEMES[0];
  const st = document.body.style;
  st.setProperty('--g1', a); st.setProperty('--g2', b); st.setProperty('--g3', c);
  document.querySelector('meta[name=theme-color]').content = a;
}
let themeIndex = 0;
try { themeIndex = +localStorage.getItem(THEME_KEY) || 0; } catch {}
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
  [/water|hydrat/i, ['drop', 'drop-half', 'drop-simple']],
  [/coffee/i, ['coffee', 'coffee-bean']],
  [/\btea\b/i, ['tea-bag', 'coffee']],
  [/smok|vape|cigar/i, ['cigarette-slash', 'prohibit', 'cigarette']],
  [/alcohol|beer|wine|sober|drink/i, ['prohibit', 'beer-bottle', 'wine', 'beer-stein']],
  [/read|book/i, ['book-open', 'books', 'book', 'book-bookmark']],
  [/dog/i, ['dog', 'paw-print']],
  [/\bcats?\b/i, ['cat', 'paw-print']],
  [/run|jog/i, ['person-simple-run', 'sneaker-move', 'sneaker']],
  [/hike/i, ['person-simple-hike', 'boot', 'tree']],
  [/walk|step/i, ['person-simple-walk', 'footprints', 'sneaker']],
  [/bike|cycl/i, ['person-simple-bike', 'bicycle']],
  [/swim/i, ['person-simple-swim', 'swimming-pool']],
  [/meditat|mindful|breath|calm/i, ['flower-lotus', 'person-simple-tai-chi', 'leaf']],
  [/yoga|stretch/i, ['person-simple-tai-chi', 'flower-lotus']],
  [/sleep|bed|nap/i, ['bed', 'moon-stars', 'moon']],
  [/wake|early|alarm|morning/i, ['alarm', 'sun', 'clock']],
  [/gym|workout|exercise|lift|push.?up|pull.?up|squat|sit.?up|plank|burpee|train/i, ['barbell', 'heartbeat', 'fire', 'lightning']],
  [/soccer/i, ['soccer-ball']], [/basketball/i, ['basketball']], [/tennis/i, ['tennis-ball']], [/golf/i, ['golf']], [/box/i, ['boxing-glove']],
  [/guitar/i, ['guitar', 'music-notes']],
  [/piano/i, ['piano-keys', 'music-notes']],
  [/music|sing|practi/i, ['music-notes', 'microphone', 'headphones']],
  [/journal|write|diary/i, ['notebook', 'pencil-simple', 'pen', 'note']],
  [/study|learn|homework|school|class/i, ['graduation-cap', 'student', 'brain', 'book-open']],
  [/language|spanish|french|german|english|duolingo/i, ['translate', 'globe', 'chat-circle']],
  [/code|program/i, ['code', 'laptop', 'keyboard']],
  [/vitamin|pill|medic/i, ['pill', 'first-aid', 'syringe']],
  [/sugar|sweet|candy|junk|fast food|snack/i, ['prohibit', 'cookie', 'cake', 'ice-cream', 'hamburger']],
  [/fruit|veg|salad|healthy|eat/i, ['carrot', 'avocado', 'orange-slice', 'bowl-food']],
  [/cook|meal|lunch|dinner|breakfast/i, ['cooking-pot', 'fork-knife', 'bowl-steam', 'egg']],
  [/phone|screen|social|scroll|tiktok|instagram/i, ['device-mobile-slash', 'device-mobile', 'television']],
  [/teeth|tooth|floss|brush|dent/i, ['tooth', 'sparkle']],
  [/skin|face|shower|bath/i, ['shower', 'bathtub', 'sparkle', 'hand-soap']],
  [/clean|tidy|laundry|dishes/i, ['broom', 'washing-machine', 'trash', 'sparkle']],
  [/plant|garden/i, ['potted-plant', 'plant', 'flower']],
  [/pray|church|bible|god/i, ['hands-praying', 'cross', 'church']],
  [/call|family|mom|dad|friend|text/i, ['phone-call', 'users', 'heart', 'chat-circle']],
  [/save|money|budget|spend|invest/i, ['piggy-bank', 'coins', 'wallet', 'chart-line-up']],
  [/draw|paint|art/i, ['paint-brush', 'palette', 'pencil-simple']],
  [/photo/i, ['camera']],
  [/weigh|scale/i, ['scales']],
  [/outside|fresh air|\bsun/i, ['sun', 'tree', 'leaf']],
  [/grateful|gratitude|happy|smile/i, ['smiley', 'heart', 'hand-heart']],
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
  '📵': 'device-mobile-slash', '📱': 'device-mobile', '🦷': 'tooth', '🪥': 'tooth', '🧴': 'hand-soap', '✨': 'sparkle', '🧹': 'broom',
  '🧽': 'sparkle', '🪴': 'potted-plant', '🌱': 'plant', '🙏': 'hands-praying', '✝': 'cross', '📞': 'phone-call', '❤': 'heart',
  '💰': 'coins', '🐷': 'piggy-bank', '⭐': 'star', '✅': 'check-circle', '🎯': 'target',
};

// Renders "no icon / suggested icons / all icons / your own emoji" into box.
// onPick({ icon }) or onPick({ emoji }) or onPick({}) to clear.
function iconPicker(box, name, h, onPick) {
  const cur = h.icon || '';
  const options = [...new Set([...(cur ? [cur] : []), ...suggestIcons(name)])].filter(n => ICONS[n]);
  const all = box.dataset.all === '1';
  const btn = n => `<button class="chip ico${n === cur ? ' sel' : ''}" data-icon="${n}" aria-label="${n.replace(/-/g, ' ')}">${iconSvg(n)}</button>`;
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

function toggle(h, date) {
  const i = h.done.indexOf(date);
  if (i === -1) h.done.push(date); else h.done.splice(i, 1);
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
    <div class="links">Backup: <button id="export">Export</button> · <button id="import">Import</button> · version 14</div>
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
    <div class="themes">${THEMES.map(([n, a, b, c], i) =>
      `<button class="swatch${i === themeIndex ? ' sel' : ''}" data-i="${i}" aria-label="${n}" style="background:linear-gradient(160deg, ${a}, ${b}, ${c})"></button>`).join('')}</div>
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
  const from = len ? today - len + 1 : earliest;
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

function lineChart(points, first, last) {
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
  return `<div class="lchart">
    <div class="readout" aria-live="polite">${lastI >= 0 ? esc(points[lastI].tip) : 'No data yet'}</div>
    <div class="lplot">
      <div class="grid"><span>100%</span><span>50%</span><span>0%</span></div>
      <div class="lsvg">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
          <path d="${area}" fill="url(#lg)"/>
          <path d="${line}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="xhair" hidden></span><span class="xdot" hidden></span>
      </div>
    </div>
    <div class="xlabels"><span>${esc(first)}</span><span>${esc(last)}</span></div>
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

  const body = $('stats-body');
  body.innerHTML = `
    <p class="range-note">${range[3][0].toUpperCase() + range[3].slice(1)}</p>
    <div class="nums">${nums.map(([v, k]) => `<div class="num"><div class="nv">${v}</div><div class="nk">${k}</div></div>`).join('')}</div>
    <hr class="sep">
    <h3>${statsView.range === 'week' ? 'Each day' : 'Trend · 7-day average'}</h3>
    ${lineChart(pts, first, last)}
    <hr class="sep">
    <h3>By day of the week</h3>
    ${barChart(wd)}
    <p class="note">${wdNote}</p>`;
  bindLineChart(body.querySelector('.lchart'), pts);
  const bc = body.querySelector('.bchart'), out = bc.querySelector('.readout');
  bc.querySelectorAll('.bar').forEach(bar => {
    const show = () => { bc.querySelectorAll('.bar.on').forEach(o => o.classList.remove('on')); bar.classList.add('on'); out.textContent = bar.dataset.tip; };
    bar.onclick = show;
    bar.onpointerenter = e => { if (e.pointerType === 'mouse') show(); };
  });
}
function closeStats() { $('stats').hidden = true; }
$('stats-btn').onclick = openStats;

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
