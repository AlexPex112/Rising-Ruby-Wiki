async function init() {
  const loading = document.getElementById('loadingMsg');
  const content = document.getElementById('content');
  const data = await fetch('data/evolutions.json').then(r => r.json());
  loading.style.display = 'none';

  function table(headers, rows) {
    let h = headers.map(h => `<th>${h}</th>`).join('');
    let r = rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table class="moves-table" style="margin-bottom:1.5rem"><thead><tr>${h}</tr></thead><tbody>${r}</tbody></table>`;
  }

  let html = '';

  html += `<h2 style="color:var(--accent2);font-size:1rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem">Trade Evolutions</h2>`;
  html += `<p style="color:var(--muted);font-size:0.85rem;margin-bottom:.75rem">Friendship (220+) or level up instead of trading.</p>`;
  html += table(['#','From','To','New Method'],
    data.trade_evolutions.map(e => [String(e.num).padStart(3,'0'), e.from, e.to, e.method]));

  html += `<h2 style="color:var(--accent2);font-size:1rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem">Trade with Item Evolutions</h2>`;
  html += `<p style="color:var(--muted);font-size:0.85rem;margin-bottom:.75rem">Use the held item directly like an evolution stone.</p>`;
  html += table(['#','From','To','Method','Item Location'],
    data.trade_item_evolutions.map(e => [
      String(e.num).padStart(3,'0'), e.from, e.to, e.method,
      `<span style="color:var(--accent2)">${e.item_location}</span>`
    ]));

  html += `<h2 style="color:var(--accent2);font-size:1rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem">Trade with Pokémon Evolutions</h2>`;
  html += table(['#','From','To','New Method'],
    data.trade_with_pokemon_evolutions.map(e => [String(e.num).padStart(3,'0'), e.from, e.to, e.method]));

  html += `<h2 style="color:var(--accent2);font-size:1rem;text-transform:uppercase;letter-spacing:.06em;margin:1.25rem 0 .5rem">Level Adjustments (51 Pokémon)</h2>`;
  html += `<p style="color:var(--muted);font-size:0.85rem;margin-bottom:.75rem">Mainly Unova Pokémon reduced to match RR's pace.</p>`;
  html += table(['#','From','To','Old Level','New Level','Diff'],
    data.level_adjustments.map(e => [
      String(e.num).padStart(3,'0'), e.from, e.to,
      `<span style="color:var(--muted)">${e.old_level}</span>`,
      `<strong style="color:var(--accent2)">${e.new_level}</strong>`,
      `<span style="color:var(--accent)">${e.diff}</span>`
    ]));

  content.innerHTML = html;
}
init();