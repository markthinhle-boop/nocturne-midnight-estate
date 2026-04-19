// ============================================================
// NOCTURNE — tunnel.js
// First visit: 15 seconds. Non-negotiable. No skip.
// Subsequent visits: tunnel screen shows, no timer. Tap to continue.
// Chopin Op.55 No.1 fires on Compact arrival.
// KB v6 Final · Section XLVI · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

const TUNNEL_DURATION_FIRST  = 15000; // 15 seconds. First time only.
const TUNNEL_DURATION_RETURN = 0;     // Instant.

// Tunnel text passages
const TUNNEL_PASSAGES = [
  "Old stone. A single lantern on a hook, warm and recently used.",
  "The passage connects two houses built around something older than either.",
  "Sixty steps. The stone is dry. The air changes at the midpoint.",
  "The lantern casts one shadow. It belongs to you.",
  "The passage does not record which direction you are travelling. It simply connects.",
];

let _chopinPlayed = false;

function initTunnel() {
  NocturneEngine.on('tunnelDoorOpens', () => {
    startTunnel('cellar');
  });
  NocturneEngine.on('hedgeGapFound', () => {
    // Hedge path tunnel entrance handled separately
  });
}

function startTunnel(entrance) {
  if (!gameState.tunnelFound) {
    initiateFirstTunnelCrossing(entrance);
  } else {
    initiateReturnTunnelCrossing(entrance);
  }
}

function initiateFirstTunnelCrossing(entrance) {
  const screen = document.getElementById('tunnel-screen');
  if (!screen) return;

  // Disable ALL taps — no skipping
  document.getElementById('app').style.pointerEvents = 'none';
  screen.style.pointerEvents = 'none';

  screen.classList.add('active');
  setTimeout(() => screen.classList.add('warming'), 500);

  if (typeof startTunnelMusic === 'function') startTunnelMusic();

  haptic([10, 15, 20, 25, 30]);
  setTimeout(() => haptic([0]), 5000);

  // 5 passages over 15 seconds — one every 3 seconds
  let passageIndex = 0;
  const passageEl = document.getElementById('tunnel-description');
  if (passageEl) passageEl.textContent = TUNNEL_PASSAGES[0];

  const passageInterval = setInterval(() => {
    passageIndex++;
    if (passageIndex < TUNNEL_PASSAGES.length && passageEl) {
      passageEl.style.opacity = '0';
      setTimeout(() => {
        passageEl.textContent = TUNNEL_PASSAGES[passageIndex];
        passageEl.style.opacity = '1';
      }, 400);
    }
  }, 3000);

  // After 15 seconds — cross
  setTimeout(() => {
    clearInterval(passageInterval);
    completeTunnelCrossing(entrance, true);
  }, TUNNEL_DURATION_FIRST);
}

function initiateReturnTunnelCrossing(entrance) {
  // Show tunnel screen with last passage — tap to continue
  const screen = document.getElementById('tunnel-screen');
  if (!screen) {
    completeTunnelCrossing(entrance, false);
    return;
  }

  screen.classList.add('active');
  const passageEl = document.getElementById('tunnel-description');
  if (passageEl) passageEl.textContent = TUNNEL_PASSAGES[TUNNEL_PASSAGES.length - 1];

  // Tap anywhere to cross
  const onTap = () => {
    screen.removeEventListener('click', onTap);
    document.getElementById('app').removeEventListener('click', onTap);
    completeTunnelCrossing(entrance, false);
  };
  setTimeout(() => {
    screen.addEventListener('click', onTap);
  }, 300);
}

function completeTunnelCrossing(entrance, isFirst) {
  if (isFirst) {
    gameState.tunnel_first_crossing_complete = true;
    gameState.tunnel_first_crossing_timestamp = Date.now();
    gameState.franchise_record = gameState.franchise_record || {};
    gameState.franchise_record.tunnel_first_crossing = true;
    trackTunnelFound(entrance);
  }

  // Arrive at Compact — opens all 10 rooms
  arriveAtCompact(entrance);

  // Unlock tunnel mouth on map — both ends
  NocturneEngine.emit('tunnelMouthUnlocked', { entrance });

  // Re-enable taps
  document.getElementById('app').style.pointerEvents = 'all';

  // Hide tunnel screen
  const screen = document.getElementById('tunnel-screen');
  if (screen) {
    screen.classList.remove('active');
    screen.classList.remove('warming');
  }

  // First visit → Archivist at piano (c1-arrival)
  // Return visit → tunnel mouth (c6-tunnel)
  navigateTo('c6-tunnel');
  if (typeof renderCurrentRoom === 'function') renderCurrentRoom();
  if (typeof initMapUI === 'function') initMapUI();

  // Chopin fires on first arrival only
  if (isFirst && !_chopinPlayed) {
    _chopinPlayed = true;
    setTimeout(() => startChopinOnArrival(), 500);
  }

  saveGame();
}

function startChopinOnArrival() {
  if (typeof window.NocturneSound !== 'undefined' && window.NocturneSound.playChopin) {
    window.NocturneSound.playChopin();
  }
}

function startTunnelMusic() {
  if (typeof window.NocturneSound !== 'undefined' && window.NocturneSound.playTunnelTransition) {
    window.NocturneSound.playTunnelTransition();
  }
}

// Fast travel between tunnel mouths
function tunnelFastTravel(from) {
  if (!gameState.tunnelFound) return;
  const dest = from === 'estate' ? 'c6-tunnel' : 'wine-cellar';
  navigateTo(dest);
  if (typeof renderCurrentRoom === 'function') renderCurrentRoom();
}

window.initTunnel = initTunnel;
window.startTunnel = startTunnel;
window.tunnelFastTravel = tunnelFastTravel;
window.TUNNEL_DURATION_FIRST = TUNNEL_DURATION_FIRST;
