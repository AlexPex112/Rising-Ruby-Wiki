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

// Converts a Pokemon name to the slug used by PokemonDB's sprite CDN
function toSprite(name) {
  return name
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[\'\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// PokemonDB ruby-sapphire sprites - indexed by name slug, perfect for ORAS era
function spriteUrl(name) {
  const slug = toSprite(name);
  return `https://img.pokemondb.net/sprites/ruby-sapphire/normal/${slug}.png`;
}

function pokemonSpriteLink(p) {
  const url = spriteUrl(p.name);
  return `<a href="pokemon.html?id=${encodeURIComponent(p.name)}" class="enc-poke" title="${p.name}${p.rare?' (5%)':''}">
    <img src="${url}" onerror="this.src='https://img.pokemondb.net/sprites/scarlet-violet/icon/${toSprite(p.name)}.png'" loading="lazy">
    <span>${p.name}${p.rare?'<sup style="color:var(--accent2)">5%</sup>':''}</span>
  </a>`;
}

function buildTrainerCard(t) {
  const boss = isBoss(t.name);
  const pokeHtml = t.pokemon.map(p => {
    const url = spriteUrl(p.name);
    return `<div class="trainer-poke">
      <img src="${url}" onerror="this.src='https://img.pokemondb.net/sprites/scarlet-violet/icon/${toSprite(p.name)}.png'" loading="lazy">
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
      <div class="boss-team">${pokeHtml}</div>
    </div>`;
  }
  return `<div class="trainer-card">
    <div class="trainer-name">${t.name} <small style="color:var(--muted)">#${t.id}</small></div>
    <div class="trainer-team">${pokeHtml}</div>
  </div>`;
}

async function loadAreas() {
  const res = await fetch('data/encounters.json');
  allAreas = await res.json();
  areaCards = Object.keys(allAreas);
  renderList(areaCards);
}

function renderList(keys) {
  const container = document.getElementById('area-list');
  if (!container) return;
  container.innerHTML = keys.map(k => {
    const area = allAreas[k];
    const trainerCount = (area.trainers||[]).length;
    const encounterCount = (area.encounters||[]).reduce((s,e)=>s+(e.pokemon||[]).length,0);
    return `<div class="area-card" onclick="openArea('${k.replace(/'/g,"\\'")}')"
      data-name="${k.toLowerCase()}">
      <div class="area-title">${k}</div>
      <div class="area-meta">
        <span>🌿 ${encounterCount} encounters</span>
        <span>🧑 ${trainerCount} trainers</span>
      </div>
    </div>`;
  }).join('');
}

function openArea(name) {
  const area = allAreas[name];
  if (!area) return;
  const panel = document.getElementById('area-detail');
  if (!panel) return;

  let html = `<h2>${name}</h2>`;

  // Encounters
  if (area.encounters && area.encounters.length) {
    html += '<h3>Wild Encounters</h3>';
    area.encounters.forEach(enc => {
      const icon = METHOD_ICONS[enc.method] || '❓';
      html += `<div class="enc-group">
        <div class="enc-method">${icon} ${enc.method}${enc.level?' — Lv.'+enc.level:''}</div>
        <div class="enc-grid">${(enc.pokemon||[]).map(pokemonSpriteLink).join('')}</div>
      </div>`;
    });
  }

  // Trainers
  if (area.trainers && area.trainers.length) {
    html += '<h3>Trainers</h3>';
    area.trainers.forEach(t => { html += buildTrainerCard(t); });
  }

  // Rematches
  if (area.rematches && area.rematches.length) {
    html += '<h3>Rematches</h3>';
    area.rematches.forEach(t => { html += buildTrainerCard(t); });
  }

  panel.innerHTML = html;
  panel.scrollIntoView({behavior:'smooth'});
}

document.addEventListener('DOMContentLoaded', () => {
  loadAreas();
  const search = document.getElementById('area-search');
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      const filtered = areaCards.filter(k => k.toLowerCase().includes(q));
      renderList(filtered);
    });
  }
});
