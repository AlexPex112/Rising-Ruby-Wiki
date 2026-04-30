let allAreas = {};
let areaCards = [];

const METHOD_ICONS = {
  'Grass':'🌿','DexNav':'🔍','Horde':'👥','Surfing':'🌊',
  'Old Rod':'🎣','Good Rod':'🎣','Super Rod':'🎣',
  'Rock Smash':'🪨','Cave':'🕳️','Sand':'🏖️'
};

async function loadAreas() {
  const r = await fetch('data/encounters.json');
  allAreas = await r.json();
}

function renderPokemonList(pokemonArr) {
  return pokemonArr.map(p =>
    `<a href="pokemon.html?id=${encodeURIComponent(p.name)}" style="color:var(--text);font-size:0.85rem">${p.name}${p.rare?'<sup style="color:var(--accent2)">*5%</sup>':''}</a>`
  ).join(', ');
}

function buildAreaCard(areaName, area) {
  const hasEnc = area.encounters && area.encounters.length > 0;
  const hasTr  = area.trainers   && area.trainers.length > 0;
  if (!hasEnc && !hasTr) return null;

  const div = document.createElement('div');
  div.className = 'route-section';
  div.dataset.name = areaName.toLowerCase();

  let html = `<h2 style="font-size:1.05rem;font-weight:700;margin-bottom:0.75rem;color:var(--accent2)">${areaName}</h2>`;

  if (hasEnc) {
    html += `<h3>Wild Encounters</h3>
    <table class="encounter-table">
      <thead><tr><th>Method</th><th>Level</th><th>Pokémon</th></tr></thead>
      <tbody>`;
    area.encounters.forEach(e => {
      const icon = METHOD_ICONS[e.method] || '•';
      html += `<tr>
        <td>${icon} ${e.method}</td>
        <td style="color:var(--muted);white-space:nowrap">${e.level}</td>
        <td>${renderPokemonList(e.pokemon)}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }

  if (hasTr) {
    html += `<h3 style="margin-top:1rem">Trainers</h3>
    <table class="encounter-table">
      <thead><tr><th style="width:40px">ID</th><th>Trainer</th><th>Pokémon</th></tr></thead>
      <tbody>`;
    area.trainers.forEach(t => {
      const pokes = t.pokemon.map(p => `${p.name}${p.level?' Lv.'+p.level:''}`).join(', ');
      html += `<tr>
        <td style="color:var(--muted)">${t.id}</td>
        <td style="font-weight:500">${t.name}</td>
        <td style="font-size:0.83rem;color:var(--muted)">${pokes}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
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
    await loadAreas();
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