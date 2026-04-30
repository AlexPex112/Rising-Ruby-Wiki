let allAreas = {};
let areaCards = [];

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

function isBoss(name) {
  const n = name.toLowerCase();
  return BOSS_KEYWORDS.some(k => n.includes(k));
}

function pokemonSpriteLink(p) {
  const slug = p.name.toLowerCase().replace(/[éÉ]/g,'e').replace(/[^a-z0-9-]/g,'').trim();
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slug}.png`;
  return `<a href="pokemon.html?id=${encodeURIComponent(p.name)}" class="enc-poke" title="${p.name}${p.rare?' (5%)':''}">
    <img src="${spriteUrl}" onerror="this.style.display='none'" loading="lazy">
    <span>${p.name}${p.rare?'<sup style="color:var(--accent2)">5%</sup>':''}</span>
  </a>`;
}

function buildTrainerCard(t) {
  const boss = isBoss(t.name);
  const pokeHtml = t.pokemon.map(p => {
    const slug = p.name.toLowerCase().replace(/[éÉ]/g,'e').replace(/[^a-z0-9-]/g,'').trim();
    const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slug}.png`;
    return `<div class="trainer-poke">
      <img src="${sprite}" onerror="this.style.display='none'" loading="lazy">
      <span>${p.name}${p.level?'<br><small>Lv.'+p.level+'</small>':''}</span>
    </div>`;
  }).join('');

  if (boss) {
    return `<div class="boss-card">
      <div class="boss-header">
        <span class="boss-icon">⚔️</span>
        <div>
          <div class="boss-name">${t.name}</div>
          <div style="color:var(--muted);font-size:0.75rem">Trainer #${t.id}</div>
        </div>
      </div>
      <div class="trainer-pokemon-grid">${pokeHtml}</div>
    </div>`;
  } else {
    return `<div class="trainer-row">
      <span class="trainer-id">${t.id}</span>
      <span class="trainer-name">${t.name}</span>
      <div class="trainer-pokemon-inline">${pokeHtml}</div>
    </div>`;
  }
}

function buildAreaCard(areaName, area) {
  const hasEnc = area.encounters && area.encounters.length > 0;
  const hasTr  = area.trainers   && area.trainers.length > 0;
  if (!hasEnc && !hasTr) return null;

  const div = document.createElement('div');
  div.className = 'route-section';
  div.dataset.name = areaName.toLowerCase();

  let html = `<h2 class="area-title">${areaName}</h2>`;

  if (hasEnc) {
    html += `<h3>Wild Encounters</h3>`;
    area.encounters.forEach(e => {
      const icon = METHOD_ICONS[e.method] || '•';
      html += `<div class="enc-method-row">
        <div class="enc-method-label">${icon} ${e.method} <span style="color:var(--muted);font-size:0.78rem">${e.level}</span></div>
        <div class="enc-sprites">${e.pokemon.map(pokemonSpriteLink).join('')}</div>
      </div>`;
    });
  }

  if (hasTr) {
    const bosses  = area.trainers.filter(t => isBoss(t.name));
    const regular = area.trainers.filter(t => !isBoss(t.name));
    if (bosses.length > 0) {
      html += `<h3 style="margin-top:1rem">Boss Trainers</h3>${bosses.map(buildTrainerCard).join('')}`;
    }
    if (regular.length > 0) {
      html += `<h3 style="margin-top:1rem">Trainers</h3><div class="trainer-list">${regular.map(buildTrainerCard).join('')}</div>`;
    }
  }

  div.innerHTML = html;
  return div;
}

function filterAreas() {
  const q = document.getElementById('areaSearch').value.toLowerCase().trim();
  let vis = 0;
  areaCards.forEach(({div}) => {
    const show = !q || div.dataset.name.includes(q);
    div.style.display = show ? '' : 'none';
    if (show) vis++;
  });
  document.getElementById('areaCount').textContent = `${vis} areas`;
}

async function init() {
  const loading = document.getElementById('loadingMsg');
  const list    = document.getElementById('areaList');
  try {
    allAreas = await fetch('data/encounters.json').then(r => r.json());
    const frag = document.createDocumentFragment();
    Object.entries(allAreas).forEach(([name, area]) => {
      const card = buildAreaCard(name, area);
      if (card) { areaCards.push({div: card}); frag.appendChild(card); }
    });
    list.appendChild(frag);
    loading.style.display = 'none';
    document.getElementById('areaCount').textContent = `${areaCards.length} areas`;
  } catch(e) {
    loading.textContent = 'Failed to load: ' + e.message;
  }
}
init();