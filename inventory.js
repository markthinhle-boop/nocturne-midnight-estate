// ============================================================
// NOCTURNE — inventory.js
// Bond Map, combination UI, DROP button
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// Bond Map line weights: 1/2/3px based on connection strength
const BOND_MAP_CONNECTIONS = [
  { from: 'burned-fragments',       to: 'surgeons-motive-confirmed', weight: 3 },
  { from: 'surgeons-licensing-record', to: 'surgeons-motive-confirmed', weight: 3 },
  { from: 'planning-document',      to: 'compact-placement-record',  weight: 3 },
  { from: 'steward-bond',           to: 'compact-placement-record',  weight: 2 },
];

function openInventory() {
  renderInventoryGrid();
  document.getElementById('inventory-panel').classList.add('open');
}

function closeInventory() {
  document.getElementById('inventory-panel').classList.remove('open');
  gameState.selectedItem = null;
  NocturneEngine.emit('itemDeselected', {});
}

function renderInventoryGrid() {
  const grid = document.getElementById('inventory-grid');
  const hint = document.getElementById('combine-hint');
  if (!grid) return;
  grid.innerHTML = '';

  const inv = gameState.inventory;
  if (inv.length === 0) {
    grid.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:var(--text-dim);">Nothing collected yet.</div>';
    if (hint) hint.style.display = 'none';
    return;
  }

  if (hint) hint.style.display = inv.length > 1 ? 'block' : 'none';

  inv.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item) return;

    const row = document.createElement('div');
    row.className = 'inv-item' + (gameState.selectedItem === itemId ? ' selected' : '');
    row.dataset.itemId = itemId;

    // Item visual
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'width:40px;height:40px;flex-shrink:0;margin-right:12px;display:flex;align-items:center;justify-content:center;';
    const img = document.createElement('img');
    img.src = (typeof getItemAsset === 'function') ? getItemAsset(itemId) : '';
    img.style.cssText = 'width:36px;height:36px;object-fit:contain;';
    img.onerror = () => { imgWrap.style.background = 'var(--bg-surface)'; img.style.display = 'none'; };
    imgWrap.appendChild(img);

    const nameEl = document.createElement('div');
    nameEl.className = 'inv-name';
    nameEl.textContent = item.name;

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:10px;color:var(--text-dim);margin-top:2px;';
    if (item.is_deception_item) meta.textContent = 'Can be shown as evidence';

    const nameWrap = document.createElement('div');
    nameWrap.style.cssText = 'flex:1;';
    nameWrap.appendChild(nameEl);
    nameWrap.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'inv-actions';

    if (item.is_droppable) {
      const dropBtn = document.createElement('button');
      dropBtn.className = 'inv-action-btn drop-btn';
      dropBtn.textContent = 'DROP';
      dropBtn.onclick = (e) => {
        e.stopPropagation();
        dropItem(itemId);
        renderInventoryGrid();
        updateInventoryCounter();
      };
      actions.appendChild(dropBtn);
    } else {
      // Token — not droppable
      const lockEl = document.createElement('span');
      lockEl.style.cssText = 'font-size:10px;color:var(--gold-dim);letter-spacing:0.1em;';
      lockEl.textContent = '— token';
      actions.appendChild(lockEl);
    }

    row.appendChild(imgWrap);
    row.appendChild(nameWrap);
    row.appendChild(actions);

    row.onclick = () => handleInventoryItemTap(itemId, row);
    grid.appendChild(row);
  });

  // Bond map if 3+ items
  if (inv.length >= 3) {
    renderBondMap(grid, inv);
  }
}

function handleInventoryItemTap(itemId, rowEl) {
  tapInventoryItem(itemId);

  // Update selection visual
  document.querySelectorAll('.inv-item').forEach(r => r.classList.remove('selected'));
  if (gameState.selectedItem === itemId) {
    rowEl.classList.add('selected');
    showCombineHint(itemId);
  }
}

function showCombineHint(itemId) {
  const hint = document.getElementById('combine-hint');
  if (hint) {
    hint.textContent = gameState.selectedItem
      ? `${ITEMS[itemId]?.name || itemId} selected. Tap another item to combine.`
      : 'Tap two items to combine.';
    hint.style.display = 'block';
  }
}

function renderBondMap(container, inventory) {
  const relevant = BOND_MAP_CONNECTIONS.filter(c =>
    inventory.includes(c.from) && inventory.includes(c.to)
  );
  if (relevant.length === 0) return;

  const mapDiv = document.createElement('div');
  mapDiv.style.cssText = 'margin:12px 20px;padding:12px;border:1px solid var(--border);';

  const label = document.createElement('div');
  label.style.cssText = 'font-size:10px;color:var(--gold-dim);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;';
  label.textContent = 'Evidence Connections';
  mapDiv.appendChild(label);

  relevant.forEach(conn => {
    const line = document.createElement('div');
    line.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:11px;color:var(--cream-dim);';
    const fromItem = ITEMS[conn.from];
    const toItem   = ITEMS[conn.to];
    const weight   = conn.weight;
    const lineEl   = document.createElement('div');
    lineEl.style.cssText = `flex:1;height:${weight}px;background:var(--gold-dim);opacity:0.6;`;
    line.innerHTML = `<span style="min-width:90px;">${fromItem?.name || conn.from}</span>`;
    line.appendChild(lineEl);
    line.innerHTML += `<span style="min-width:90px;text-align:right;">${toItem?.name || conn.to}</span>`;
    mapDiv.appendChild(line);
  });

  container.appendChild(mapDiv);
}

// Wire to engine
NocturneEngine.on('itemSelected', ({ itemId }) => {
  document.querySelectorAll('.inv-item').forEach(r => {
    r.classList.toggle('selected', r.dataset.itemId === itemId);
  });
});

NocturneEngine.on('itemDeselected', () => {
  document.querySelectorAll('.inv-item').forEach(r => r.classList.remove('selected'));
  const hint = document.getElementById('combine-hint');
  if (hint) hint.textContent = 'Tap two items to combine.';
});

NocturneEngine.on('combinationFailed', () => {
  // Brief shake on inventory items
  document.querySelectorAll('.inv-item.selected').forEach(r => {
    r.style.animation = 'none';
    void r.offsetWidth;
    r.style.animation = 'inv-shake 300ms ease';
  });
});

// Add shake animation
(function() {
  const s = document.createElement('style');
  s.textContent = '@keyframes inv-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }';
  document.head.appendChild(s);
})();

// Override the ui.js openInventory/closeInventory with these versions
window.openInventory = openInventory;
window.closeInventory = closeInventory;
window.renderInventoryGrid = renderInventoryGrid;
