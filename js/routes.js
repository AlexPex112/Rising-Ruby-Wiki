const METHOD_ICONS = {
  'Grass':'🌿','DexNav':'🔍','Horde':'👥','Surfing':'🌊',
  'Old Rod':'🎣','Good Rod':'🎣','Super Rod':'🎣',
  'Rock Smash':'🪨','Cave':'🕳️','Sand':'🏖️'
};
const BOSS_KEYWORDS = [
  'gym leader','leader','elite four','champion','rival',
  'brendan','may','wally','steven','wallace','sidney','phoebe',
  'glacia','drake','roxanne','brawly','wattson','flannery',
  'norman','winona','tate','liza','juan','archie','maxie'
];

let allAreas = {};
let areaCards = [];

function isBoss(name) {
  const n = name.toLowerCase();
  return BOSS_KEYWORDS.some(k => n.includes(k));
}

function toSlug(name) {
  return name.toLowerCase()
    .replace(/♀/g,'-f').replace(/♂/g,'-m')
    .replace(/[éèê]/g,'e').replace(/[àâ]/g,'a').replace(/[ùú]/g,'u')
    .replace(/[\'\']/g,'').replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

function spriteUrl(name) {
  const slug = toSlug(name);
  return `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/regular/${slug}.png`;
}

function pokemonSpriteLink(p) {
  const url = spriteUrl(p.name);
  const safe = encodeURIComponent(p.name);
  return `<a href="pokemon.html?id=${safe}" class="enc-poke" title="${p.name}">
    <img src="${url}" onerror="this.style.opacity='0.3'" loading="lazy" alt="${p.name}" width="48" height="48">
    <span>${p.name}${p.rare ? '<sup class="rare-badge">5%</sup>' : ''}</span>
  </a>`;
}

function buildTrainerCard(t) {
  const boss = isBoss(t.name);
  const pokeHtml = (t.pokemon || []).map(p => {
    const url = spriteUrl(p.name);
    return `<div class="trainer-poke">
      <img src="${url}" onerror="this.style.opacity='0.3'" loading="lazy" alt="${p.name}" width="48" height="48">
      <span>${p.name}${p.level ? '<br><small>Lv.' + p.level + '</small>' : ''}</span>
    </div>`;
  }).join('');

  if (boss) {
    return `<div class="boss-card">
      <div class="boss-header">
        <span class="boss-icon">⚔️</span>
        <div>
          <div class="boss-name">${t.name}</div>
          <div class="boss-sub">Trainer #${t.id || '?'}</div>
        </div>
      </div>
      <div class="boss-team">${pokeHtml || '<em style="color:#aaa">No team data</em>'}</div>
    </div>`;
  }
  return `<div class="trainer-card">
    <div class="trainer-name">${t.name} <small>#${t.id || '?'}</small></div>
    <div class="trainer-team">${pokeHtml}</div>
  </div>`;
}

async function loadAreas() {
  const msg = document.getElementById('loadingMsg');

  const paths = [
    './data/encounters.json',
    'data/encounters.json',
    '../data/encounters.json'
  ];

  let data = null;
  let lastError = null;

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} at ${path}`);
      data = await res.json();
      break;
    } catch (e) {
      lastError = e;
    }
  }

  if (!data) {
    if (msg) msg.innerHTML = `<span style="color:#e74c3c">⚠ Failed to load encounters.json<br><small>${lastError?.message || 'Unknown error'}</small></span>`;
    return;
  }

  allAreas = data;
  areaCards = Object.keys(data);

  if (msg) msg.style.display = 'none';

  const cnt = document.getElementById('areaCount');
  if (cnt) cnt.textContent = areaCards.length + ' areas';

  renderList(areaCards);
}

function renderList(keys) {
  const container = document.getElementById('areaList');
  if (!container) {
    console.error('Element #areaList not found in DOM');
    return;
  }
  // Remove any open detail panel before re-rendering
  const existing = document.getElementById('areaDetail');
  if (existing) existing.remove();

  container.innerHTML = keys.map(k => {
    const area = allAreas[k] || {};
    const trainerCount = (area.trainers || []).length;
    const encCount = (area.encounters || []).reduce((s, e) => s + (e.pokemon || []).length, 0);
    const safeKey = k.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    return `<div class="area-card" onclick="openArea(\`${safeKey}\`, this)" data-name="${k.toLowerCase()}">
      <div class="area-title">${k}</div>
      <div class="area-meta">
        <span>🌿 ${encCount} pkm</span>
        <span>🧑 ${trainerCount} trainers</span>
      </div>
    </div>`;
  }).join('');
}

function openArea(name, clickedCard) {
  const area = allAreas[name];
  if (!area) return;

  // Toggle off if same card clicked again
  const existing = document.getElementById('areaDetail');
  if (existing && existing.dataset.area === name) {
    existing.remove();
    if (clickedCard) clickedCard.classList.remove('area-card--active');
    return;
  }

  // Remove previous panel and clear active state
  if (existing) {
    const prevActive = document.querySelector('.area-card--active');
    if (prevActive) prevActive.classList.remove('area-card--active');
    existing.remove();
  }

  const panel = document.createElement('div');
  panel.id = 'areaDetail';
  panel.className = 'area-detail';
  panel.dataset.area = name;

  let html = `<div class="area-detail-header">
    <h2>${name}</h2>
    <button class="close-detail" onclick="closeDetail()">✕ Close</button>
  </div>`;

  if (area.encounters && area.encounters.length) {
    html += '<h3 class="section-sub">🌿 Wild Encounters</h3>';
    area.encounters.forEach(enc => {
      const icon = METHOD_ICONS[enc.method] || '❓';
      html += `<div class="enc-group">
        <div class="enc-method">${icon} ${enc.method}${enc.level ? ' — Lv.' + enc.level : ''}</div>
        <div class="enc-grid">${(enc.pokemon || []).map(pokemonSpriteLink).join('')}</div>
      </div>`;
    });
  }

  if (area.trainers && area.trainers.length) {
    html += '<h3 class="section-sub">🧑 Trainers</h3>';
    area.trainers.forEach(t => { html += buildTrainerCard(t); });
  }

  if (area.rematches && area.rematches.length) {
    html += '<h3 class="section-sub">🔁 Rematches</h3>';
    area.rematches.forEach(t => { html += buildTrainerCard(t); });
  }

  if (!area.encounters?.length && !area.trainers?.length && !area.rematches?.length) {
    html += '<p style="padding:1rem 0;color:var(--muted)">No data available for this area.</p>';
  }

  panel.innerHTML = html;

  // Insert panel directly after the clicked card (inline), fallback to areaList append
  if (clickedCard) {
    clickedCard.classList.add('area-card--active');
    clickedCard.insertAdjacentElement('afterend', panel);
  } else {
    document.getElementById('areaList').appendChild(panel);
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeDetail() {
  const panel = document.getElementById('areaDetail');
  if (panel) panel.remove();
  const active = document.querySelector('.area-card--active');
  if (active) active.classList.remove('area-card--active');
}

function filterAreas() {
  const q = (document.getElementById('areaSearch')?.value || '').toLowerCase().trim();
  const filtered = q ? areaCards.filter(k => k.toLowerCase().includes(q)) : areaCards;
  renderList(filtered);
  const cnt = document.getElementById('areaCount');
  if (cnt) cnt.textContent = filtered.length + ' areas';
}

document.addEventListener('DOMContentLoaded', loadAreas);
