const CHUNK_FILES = [
  'data/pokemon-rr-1.json',
  'data/pokemon-rr-2.json',
  'data/pokemon-rr-3.json',
  'data/pokemon-rr-4.json',
  'data/pokemon-rr-5.json'
];

const POKEAPI = 'https://pokeapi.co/api/v2/pokemon/';
const SPRITE   = n => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;

let allPokemon = {};
let apiCache   = {};
let rows       = [];

async function loadChunks() {
  const results = await Promise.all(CHUNK_FILES.map(f => fetch(f).then(r => r.json())));
  results.forEach(chunk => Object.assign(allPokemon, chunk));
}

function typeBadge(t) {
  return `<span class="type-badge type-${t.toLowerCase()}">${t}</span>`;
}

function rrBadge() {
  return `<span class="rr-badge">RR</span>`;
}

function buildRow(num, rr) {
  const tr = document.createElement('tr');
  tr.dataset.num  = num;
  tr.dataset.name = rr.name.toLowerCase();
  tr.dataset.rr   = (rr.ability2 || rr.type_change || rr.location) ? '1' : '0';

  const spriteUrl = SPRITE(num);
  const location  = rr.location || '—';

  let ab = '';
  if (rr.ability1) ab += rr.ability1;
  if (rr.ability2) ab += (ab ? ' / ' : '') + rr.ability2.replace(' **','<sup title="Illegal outside RR">✦</sup>').replace(' *','<sup>*</sup>');

  const nameDisplay = rr.name.charAt(0) + rr.name.slice(1).toLowerCase();
  const hasRRChange = rr.type_change || rr.ability2;

  tr.innerHTML = `
    <td class="num">#${String(num).padStart(3,'0')}</td>
    <td class="sprite"><img src="${spriteUrl}" alt="${rr.name}" loading="lazy"></td>
    <td><a class="poke-name" href="pokemon.html?id=${num}">${nameDisplay}${hasRRChange ? rrBadge() : ''}</a></td>
    <td class="types-cell" data-num="${num}"><span class="type-badge" style="background:var(--border)">…</span></td>
    <td style="font-size:0.85rem; color:var(--muted)">${location}</td>
    <td style="font-size:0.82rem; color:var(--muted)">${ab}</td>
  `;
  return tr;
}

function observeTypes() {
  const cells = document.querySelectorAll('.types-cell[data-num]');
  const io = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const cell = entry.target;
      const num  = cell.dataset.num;
      io.unobserve(cell);
      delete cell.dataset.num;
      try {
        if (!apiCache[num]) {
          const r = await fetch(POKEAPI + num);
          apiCache[num] = await r.json();
        }
        const types = apiCache[num].types.map(t => t.type.name);
        const rrData = allPokemon[num];
        let displayTypes = types;
        if (rrData && rrData.type_change) {
          displayTypes = rrData.type_change.split('/').map(s => s.trim());
        }
        cell.innerHTML = displayTypes.map(t => typeBadge(t.charAt(0).toUpperCase()+t.slice(1))).join(' ');
      } catch(e) {
        cell.innerHTML = '—';
      }
    }
  }, { rootMargin: '200px' });
  cells.forEach(c => io.observe(c));
}

function filterTable() {
  const q     = document.getElementById('search').value.toLowerCase().trim();
  const type  = document.getElementById('typeFilter').value.toLowerCase();
  const rrOnly= document.getElementById('rrFilter').value === 'rr';
  let visible = 0;
  rows.forEach(tr => {
    const name = tr.dataset.name;
    const num  = tr.dataset.num.toString();
    const isRR = tr.dataset.rr === '1';
    const matchQ    = !q || name.includes(q) || num.includes(q);
    const matchType = !type || tr.querySelector('.types-cell')?.textContent.toLowerCase().includes(type);
    const matchRR   = !rrOnly || isRR;
    const show = matchQ && matchType && matchRR;
    tr.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  document.getElementById('count').textContent = `${visible} Pokémon`;
}

async function init() {
  const loading = document.getElementById('loadingMsg');
  const errEl   = document.getElementById('errorMsg');
  const table   = document.getElementById('pokedexTable');
  const tbody   = document.getElementById('pokedexBody');

  try {
    await loadChunks();
    const nums = Object.keys(allPokemon).sort((a,b) => +a - +b);
    const frag = document.createDocumentFragment();
    nums.forEach(num => {
      const tr = buildRow(+num, allPokemon[num]);
      rows.push(tr);
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
    loading.style.display = 'none';
    table.style.display = '';
    document.getElementById('count').textContent = `${nums.length} Pokémon`;
    observeTypes();
  } catch(e) {
    loading.style.display = 'none';
    errEl.style.display = '';
    errEl.textContent = 'Failed to load Pokédex data: ' + e.message;
  }
}

init();