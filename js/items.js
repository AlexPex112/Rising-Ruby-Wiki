async function init() {
  const loading = document.getElementById('loadingMsg');
  const content = document.getElementById('content');
  const data = await fetch('data/items.json').then(r => r.json());
  loading.style.display = 'none';

  let html = '';

  html += `<div class="route-section">
    <h3>Evolution Item Usability Changes</h3>
    <p style="color:var(--muted);font-size:0.87rem;margin-bottom:0.75rem">
      These items can now be <strong>used directly</strong> like an evolution stone.
    </p>
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
      ${data.usability_changes.map(i => `<span style="background:var(--card);border:1px solid var(--border);padding:3px 10px;border-radius:4px;font-size:0.85rem">${i}</span>`).join('')}
    </div>
  </div>`;

  html += `<div class="route-section">
    <h3>Price Changes</h3>
    <table class="moves-table">
      <thead><tr><th>Item</th><th>Old Price</th><th>New Price</th></tr></thead>
      <tbody>${data.price_changes.map(p => `<tr>
        <td>${p.item}</td>
        <td style="color:var(--muted)">${p.old}</td>
        <td style="color:var(--accent2);font-weight:600">${p.new}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;

  html += `<div class="route-section">
    <h3>Shop Inventories</h3>
    <table class="moves-table">
      <thead><tr><th>Location</th><th>Inventory</th></tr></thead>
      <tbody>${data.shop_inventories.map(s => `<tr>
        <td style="font-weight:600;white-space:nowrap;color:var(--accent2)">${s.location}</td>
        <td style="font-size:0.83rem;color:var(--muted)">${s.inventory}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;

  content.innerHTML = html;
}
init();