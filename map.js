// ============================================================
// NOCTURNE — map.js
// SVG map. Amber drop dots. Compact tab hidden until tunnelFound.
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

function initMap() {
  NocturneEngine.on('tunnelFound', () => {
    const tab = document.getElementById('map-tab-compact');
    if (tab) tab.classList.add('revealed');
  });
  NocturneEngine.on('compactUnlocked', () => {
    const tab = document.getElementById('map-tab-compact');
    if (tab) {
      tab.classList.add('revealed');
      tab.style.display = 'block';
    }
  });
  // Unlock tunnel mouth map nodes on both ends
  NocturneEngine.on('tunnelMouthUnlocked', () => {
    // Estate side — wine-cellar tunnel door node
    const estateNode = document.getElementById('mr-wine-cellar');
    if (estateNode) estateNode.style.display = '';
    // Compact side — c6-tunnel node
    const compactNode = document.getElementById('mr-c6-tunnel');
    if (compactNode) compactNode.style.display = '';
    // Also show tunnel-passage if it exists as a map node
    const passageNode = document.getElementById('mr-tunnel-passage');
    if (passageNode) passageNode.style.display = '';
  });
}

// Handle new room navigation dots for maids-quarters and groundskeeper-cottage
// These are standard rooms — no secret display:none, always visible once discovered
// Navigation handled by existing roomEntered/roomDiscovered engine events

window.initMap = initMap;
