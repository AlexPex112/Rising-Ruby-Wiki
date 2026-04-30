async function init() {
  const loading = document.getElementById('loadingMsg');
  const content = document.getElementById('content');
  const data = await fetch('data/moves.json').then(r => r.json());
  loading.style.display = 'none';

  const rows = data.map(m => {
    const changes = m.changes.map(c =>
      `<div style="font-size:0.82rem"><span style="color:var(--muted);display:inline-block;width:90px">${c.stat}</span> <span style="color:var(--accent2)">${c.value}</span></div>`
    ).join('');
    return `<tr><td style="font-weight:600">${m.move}</td><td>${changes}</td></tr>`;
  }).join('');

  content.innerHTML = `<table class="moves-table">
    <thead><tr><th style="width:160px">Move</th><th>Changes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}
init();