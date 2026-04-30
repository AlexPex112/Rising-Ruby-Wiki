const POKEAPI  = 'https://pokeapi.co/api/v2/pokemon/';
const SPECAPI  = 'https://pokeapi.co/api/v2/pokemon-species/';

function chunkFile(num) {
  if (num <= 145) return 'data/pokemon-rr-1.json';
  if (num <= 290) return 'data/pokemon-rr-2.json';
  if (num <= 435) return 'data/pokemon-rr-3.json';
  if (num <= 580) return 'data/pokemon-rr-4.json';
  return 'data/pokemon-rr-5.json';
}

const STAT_COLORS = {
  hp: '#ff5959', attack: '#f5ac78', defense: '#fae078',
  'special-attack': '#9db7f5', 'special-defense': '#a7db8d', speed: '#fa92b2'
};
const STAT_MAX = { hp:255, attack:190, defense:230, 'special-attack':194, 'special-defense':230, speed:200 };

function typeBadge(t) { return `<span class="type-badge type-${t.toLowerCase()}">${cap(t)}</span>`; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
function rrBadge(tip) { return `<span class="rr-badge" title="${tip||'Changed in RR'}">RR</span>`; }

function statBar(name, val) {
  const max   = STAT_MAX[name] || 255;
  const pct   = Math.min(100, Math.round(val / max * 100));
  const color = STAT_COLORS[name] || '#aaa';
  const label = name === 'special-attack' ? 'Sp. Atk'
              : name === 'special-defense' ? 'Sp. Def'
              : cap(name);
  return `<div class="stat-row">
    <span class="stat-name">${label}</span>
    <span class="stat-val">${val}</span>
    <div class="stat-bar-bg"><div class="stat-bar" style="width:${pct}%;background:${color}"></div></div>
  </div>`;
}

function renderEvoChain(chain) {
  const steps = [];
  function walk(node) {
    steps.push(node.species);
    if (node.evolves_to && node.evolves_to.length > 0) node.evolves_to.forEach(walk);
  }
  walk(chain);
  if (steps.length <= 1) return '';
  return steps.map(sp => {
    const n = sp.url.match(/\/(\d+)\/$/)[1];
    return `<a href="pokemon.html?id=${n}" style="text-align:center;text-decoration:none;color:var(--text)">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png" style="width:56px;height:56px;image-rendering:pixelated;display:block;margin:0 auto 2px">
      <span style="font-size:0.82rem">${cap(sp.name)}</span></a>`;
  }).join(`<span style="color:var(--muted);font-size:1.2rem;align-self:center;padding:0 6px">→</span>`);
}

function moveFlag(flag) {
  if (flag === '**') return `<span class="flag-illegal" title="Illegal outside RR">✦✦</span>`;
  if (flag === '*')  return `<span class="flag-star"    title="Not normally by level-up">✦</span>`;
  return '';
}

function prevNextNav(num) {
  const prev = num > 1   ? `<a href="pokemon.html?id=${num-1}" style="color:var(--muted);font-size:0.85rem">← #${String(num-1).padStart(3,'0')}</a>` : '<span></span>';
  const next = num < 721 ? `<a href="pokemon.html?id=${num+1}" style="color:var(--muted);font-size:0.85rem">#${String(num+1).padStart(3,'0')} →</a>` : '<span></span>';
  return `<div style="display:flex;justify-content:space-between;margin-bottom:1rem">${prev}<a href="pokedex.html" style="font-size:0.85rem">← Pokédex</a>${next}</div>`;
}

function abRow(label, ab) {
  if (!ab) return '';
  const flag = ab.rrFlag ? rrBadge(ab.rrFlag === '**' ? 'Illegal outside RR' : 'Modified in RR') : '';
  return `<div class="stat-row"><span class="stat-name" style="width:70px;color:var(--muted)">${label}</span><span>${ab.name}${flag}</span></div>`;
}

async function init() {
  const loading = document.getElementById('loadingMsg');
  const errEl   = document.getElementById('errorMsg');
  const content = document.getElementById('content');

  const params   = new URLSearchParams(location.search);
  const idParam  = params.get('id') || '1';

  let apiData, rrData, speciesData, evoData, num;

  try {
    const apiRes = await fetch(POKEAPI + idParam.toLowerCase());
    if (!apiRes.ok) throw new Error(`Pokémon "${idParam}" not found.`);
    apiData = await apiRes.json();
    num = apiData.id;

    const chunk = await fetch(chunkFile(num)).then(r => r.json());
    rrData = chunk[num] || chunk[String(num)];

    speciesData = await fetch(SPECAPI + num).then(r => r.json());

    const evoRes = await fetch(speciesData.evolution_chain.url).then(r => r.json());
    evoData = evoRes.chain;
  } catch(e) {
    loading.style.display = 'none';
    errEl.style.display = '';
    errEl.textContent = 'Error: ' + e.message;
    return;
  }

  document.title = `${cap(apiData.name)} — Rising Ruby Wiki`;

  let types = apiData.types.map(t => t.type.name);
  let typeNote = '';
  if (rrData && rrData.type_change) {
    const rrTypes = rrData.type_change.split('/').map(s => s.trim());
    typeNote = `<div style="font-size:0.78rem;color:var(--accent);margin-top:4px">⚠ Type changed in RR (vanilla: ${types.map(cap).join('/')})</div>`;
    types = rrTypes;
  }

  const flavor = speciesData.flavor_text_entries
    .filter(f => f.language.name === 'en')
    .pop()?.flavor_text.replace(/\f|\n/g, ' ') || '';

  const bst = apiData.stats.reduce((s, x) => s + x.base_stat, 0);

  let ab1 = apiData.abilities.find(a => a.slot === 1);
  let ab2 = apiData.abilities.find(a => a.slot === 2);
  let abH = apiData.abilities.find(a => a.is_hidden);
  if (ab1) ab1 = { name: cap(ab1.ability.name.replace(/-/g,' ')) };
  if (ab2) ab2 = { name: cap(ab2.ability.name.replace(/-/g,' ')) };
  if (abH) abH = { name: cap(abH.ability.name.replace(/-/g,' ')) };

  if (rrData) {
    if (rrData.ability1) ab1 = { name: rrData.ability1.replace(/ \*+$/,''), rrFlag: rrData.ability1.match(/(\*+)$/)?.[1] };
    if (rrData.ability2) ab2 = { name: rrData.ability2.replace(/ \*+$/,''), rrFlag: rrData.ability2.match(/(\*+)$/)?.[1] };
  }

  const evoHtml = renderEvoChain(evoData);

  let learnsetHtml = '';
  if (rrData && rrData.levelup_moves && rrData.levelup_moves.length > 0) {
    const half = Math.ceil(rrData.levelup_moves.length / 2);
    const col1 = rrData.levelup_moves.slice(0, half);
    const col2 = rrData.levelup_moves.slice(half);
    function moveTableCol(moves) {
      return `<table class="moves-table" style="font-size:0.85rem">
        <thead><tr><th style="width:40px;text-align:center">Lv.</th><th>Move</th></tr></thead>
        <tbody>${moves.map(m=>`<tr><td style="text-align:center;color:var(--muted)">${m.level}</td><td>${m.move} ${moveFlag(m.flags||'')}</td></tr>`).join('')}</tbody>
      </table>`;
    }
    learnsetHtml = `<div class="stat-block" style="grid-column:1/-1">
      <h3>Level-Up Moves <span style="font-weight:400;color:var(--muted);font-size:0.75rem;text-transform:none">(Rising Ruby)</span></h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem">
        ${moveTableCol(col1)}${moveTableCol(col2)}
      </div>
      <p style="margin-top:0.5rem;font-size:0.75rem;color:var(--muted)">✦ = from egg/TM/tutor &nbsp;|&nbsp; ✦✦ = illegal outside RR</p>
    </div>`;
  }

  const genus = speciesData.genera?.find(g => g.language.name === 'en')?.genus || '';

  content.innerHTML = `
    ${prevNextNav(num)}
    <div class="poke-header">
      <div class="poke-sprite-box">
        <img id="mainSprite" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png" alt="${cap(apiData.name)}">
        <div style="margin-top:0.5rem">
          <button onclick="toggleShiny()" style="background:var(--card);border:1px solid var(--border);color:var(--text);padding:4px 12px;border-radius:4px;cursor:pointer;font-size:0.8rem">✨ Shiny</button>
        </div>
      </div>
      <div class="poke-info">
        <div class="poke-num">#${String(num).padStart(3,'0')} &middot; ${genus}</div>
        <h1>${cap(apiData.name)}</h1>
        <div style="margin:0.4rem 0">${types.map(typeBadge).join('')}</div>
        ${typeNote}
        ${rrData?.location ? `<div class="location">📍 ${rrData.location}</div>` : ''}
        <p style="color:var(--muted);font-size:0.85rem;margin-top:0.6rem;max-width:480px;font-style:italic">${flavor}</p>
        <div style="display:flex;gap:1.5rem;margin-top:0.75rem;font-size:0.85rem;color:var(--muted)">
          <span>Height: <strong style="color:var(--text)">${(apiData.height/10).toFixed(1)} m</strong></span>
          <span>Weight: <strong style="color:var(--text)">${(apiData.weight/10).toFixed(1)} kg</strong></span>
          <span>Base Exp: <strong style="color:var(--text)">${apiData.base_experience||'—'}</strong></span>
        </div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-block">
        <h3>Base Stats <span style="font-weight:400;color:var(--muted);font-size:0.75rem;text-transform:none">BST ${bst}</span></h3>
        ${apiData.stats.map(s => statBar(s.stat.name, s.base_stat)).join('')}
      </div>
      <div class="stat-block">
        <h3>Abilities</h3>
        ${abRow('Ability 1', ab1)}
        ${abRow('Ability 2', ab2)}
        ${abRow('Hidden', abH)}
        <h3 style="margin-top:1rem">Evolution Chain</h3>
        ${evoHtml
          ? `<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-top:0.5rem">${evoHtml}</div>`
          : '<span style="color:var(--muted);font-size:0.85rem">Does not evolve</span>'}
      </div>
      ${learnsetHtml}
    </div>
  `;

  loading.style.display = 'none';
  content.style.display = '';
}

function toggleShiny() {
  const img = document.getElementById('mainSprite');
  const isShiny = img.src.includes('/shiny/');
  const num = new URLSearchParams(location.search).get('id') || '1';
  img.src = isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${num}.png`;
}

init();