// ============================================================
// NOCTURNE — ambient.js
// Living environment: rain, candle flicker, new room flash.
// Character portrait animations: speaking bob, composure decay,
// snap-back, deception recoil, peak moment bespoke animations.
// KB v6 Final · Section XIII · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── CANDLE ROOMS ───────────────────────────────────────────
// Three variants, never sync
const CANDLE_ROOMS = {
  'gallery':    'candle-room',
  'study':      'candle-room-2',
  'ballroom':   'candle-room',
  'vault':      'candle-room-3',
  'library':    'candle-room-2',
  'smoking':    'candle-room-3',
  'antechamber':'candle-room',
};

// ── RAIN ROOMS ─────────────────────────────────────────────
// 1-in-3 probability rolled fresh on each terrace entry.
// window._terraceRaining is the single source of truth — set here,
// read by manor.js for telescope hotspot gating.
const RAIN_ROOMS = ['terrace'];
let _rainActive = false;
let _rainDrops = [];

// ── NEW ROOM TRACKING ──────────────────────────────────────
const _newlyDiscovered = new Set();

// ── INIT ───────────────────────────────────────────────────
function initAmbient() {
  _buildRainOverlay();
  _checkRain();

  NocturneEngine.on('roomEntered', ({ roomId }) => {
    // Reset rain decision when entering any room (re-rolls on terrace entry)
    if (!RAIN_ROOMS.includes(roomId)) window._terraceRaining = undefined;
    _applyRoomAmbient(roomId);
  });

  NocturneEngine.on('roomDiscovered', ({ roomId }) => {
    _newlyDiscovered.add(roomId);
    // Flash the nav button when it appears
    setTimeout(() => _flashNewRoomBtn(roomId), 100);
  });

  NocturneEngine.on('questionAnswered', ({ charId }) => {
    _animatePortrait(charId, 'speaking');
    setTimeout(() => _stopSpeaking(charId), 2000);
  });

  NocturneEngine.on('composureChanged', ({ charId, state }) => {
    _onComposureChange(charId, state);
  });

  NocturneEngine.on('snapBackFired', ({ charId }) => {
    _animatePortrait(charId, 'snap-lurch');
  });

  NocturneEngine.on('deceptionEffective', ({ charId }) => {
    _animatePortrait(charId, 'deception-recoil');
  });

  NocturneEngine.on('finalLineFired', ({ charId }) => {
    if (charId === 'ashworth') {
      _animatePortrait(charId, 'turned-away');
    } else {
      _animatePortrait(charId, 'final-pullback');
    }
  });

  // Peak moment bespoke animations
  NocturneEngine.on('surgeonQ3Shown', () => {
    _animatePortrait('surgeon', 'turn-away');
  });

  NocturneEngine.on('uninvitedMaskRecognition', () => {
    setTimeout(() => _animatePortrait('uninvited', 'uninvited-creep'), 1000);
  });

  NocturneEngine.on('sovereignElaraStory', () => {
    _animatePortrait('sovereign', 'elara-desaturate');
  });

  // Tap ripple on any hotspot
  document.addEventListener('click', _handleTapRipple);

  // Question gold flash
  document.addEventListener('click', e => {
    if (e.target.classList.contains('question-item')) {
      e.target.classList.add('asked');
      setTimeout(() => e.target.classList.remove('asked'), 200);
    }
  });
}

// ── ROOM AMBIENT ───────────────────────────────────────────
function _applyRoomAmbient(roomId) {
  // Rain — always resolve BEFORE any early returns so it stops when leaving terrace
  if (RAIN_ROOMS.includes(roomId)) {
    const isRaining = Math.random() < 0.333;
    window._terraceRaining = isRaining;
    if (isRaining) {
      _startRain();
      setTimeout(() => {
        const hs = document.getElementById('hs-terrace-telescope-obj');
        if (hs) hs.remove();
      }, 300);
    } else {
      window._terraceRaining = false;
      _stopRain();
    }
  } else {
    window._terraceRaining = false;
    if (_rainActive) _stopRain();
  }

  // Apply candle flicker to room bg
  const roomEl = document.getElementById(`room-${roomId}`);
  if (!roomEl) return;
  const bg = roomEl.querySelector('.room-bg');
  if (!bg) return;

  bg.classList.remove('candle-room', 'candle-room-2', 'candle-room-3');
  const candleClass = CANDLE_ROOMS[roomId];
  if (candleClass) bg.classList.add(candleClass);
}

// ── RAIN ───────────────────────────────────────────────────
function _buildRainOverlay() {
  let overlay = document.getElementById('rain-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rain-overlay';
    const gameScreen = document.getElementById('screen-game');
    if (gameScreen) gameScreen.appendChild(overlay);
  }

  // Build 40 raindrops
  for (let i = 0; i < 40; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    const left = Math.random() * 110 - 5;
    const duration = 0.6 + Math.random() * 0.8;
    const delay = Math.random() * 2;
    const height = 15 + Math.random() * 25;
    drop.style.cssText = `left:${left}%;height:${height}px;animation-duration:${duration}s;animation-delay:-${delay}s;`;
    overlay.appendChild(drop);
    _rainDrops.push(drop);
  }
}

function _startRain() {
  _rainActive = true;
  const overlay = document.getElementById('rain-overlay');
  if (overlay) {
    overlay.classList.add('active');
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
  }
}

function _stopRain() {
  _rainActive = false;
  const overlay = document.getElementById('rain-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.display = 'none';
    overlay.style.opacity = '0';
  }
}

function _checkRain() {
  const roomId = gameState.currentRoom;
  if (RAIN_ROOMS.includes(roomId)) {
    // Only roll once per room visit — if already decided, honour it
    if (window._terraceRaining === true) {
      if (!_rainActive) _startRain();
    } else if (window._terraceRaining === false) {
      if (_rainActive) _stopRain();
    } else {
      // First time — roll
      const isRaining = Math.random() < 0.333;
      window._terraceRaining = isRaining;
      if (isRaining) _startRain(); else _stopRain();
    }
  } else {
    window._terraceRaining = undefined;
    if (_rainActive) _stopRain();
  }
}

function _isAfterSevenThirty() {
  const hour = getHourWindow();
  return ['evening', 'late', 'deep_night'].includes(hour);
}

// ── NEW ROOM FLASH ──────────────────────────────────────────
function _flashNewRoomBtn(roomId) {
  // Find the nav button for this room
  const nav = document.getElementById('room-nav');
  if (!nav) return;
  nav.querySelectorAll('.room-nav-btn').forEach(btn => {
    if (btn.textContent.trim().toLowerCase().includes(_shortName(roomId))) {
      btn.classList.add('newly-discovered');
      setTimeout(() => btn.classList.remove('newly-discovered'), 4000);
    }
  });
}

function _shortName(roomId) {
  const names = {
    'foyer':'foyer','gallery':'gallery','study':'study','archive-path':'archive',
    'lectern':'lectern','terrace':'terrace','ballroom':'ballroom',
    'antechamber':'antechamber','stage':'stage','library':'library',
    'physicians':'physicians','smoking':'smoking','vault':'vault',
    'wine-cellar':'wine','hedge-path':'hedge','tunnel-passage':'tunnel',
    'c1-arrival':'arrival','c2-portraits':'portraits','c3-original':'original',
    'c4-register':'register','c5-correspondence':'correspond',
    'c6-tunnel':'tunnel','c7-study':'study','c8-gallery':'gallery',
    'c9-agreement':'agreement','c10-reckoning':'reckoning',
  };
  return (names[roomId] || roomId).toLowerCase();
}

// Also wire to renderRoomNav so newly-discovered class applies on render
NocturneEngine.on('roomEntered', () => {
  setTimeout(() => {
    const nav = document.getElementById('room-nav');
    if (!nav) return;
    nav.querySelectorAll('.room-nav-btn').forEach(btn => {
      const text = btn.textContent.trim().toLowerCase();
      const matchedRoom = Object.keys(_shortName).find ? null :
        Object.entries({
          'gallery':'gallery','study':'study','archive-path':'archive',
          'lectern':'lectern','terrace':'terrace','ballroom':'ballroom',
          'antechamber':'antechamber','library':'library',
          'physicians':'physicians','smoking':'smoking','vault':'vault',
          'wine-cellar':'wine',
        }).find(([id, name]) => text.includes(name) && _newlyDiscovered.has(id));
      if (matchedRoom) {
        btn.classList.add('newly-discovered');
        _newlyDiscovered.delete(matchedRoom[0]);
        setTimeout(() => btn.classList.remove('newly-discovered'), 4000);
      }
    });
  }, 150);
});

// ── CHARACTER PORTRAIT ANIMATIONS ─────────────────────────
function _animatePortrait(charId, animClass) {
  const portrait = document.getElementById('conv-portrait-' + (window._activeCharId || ''));
  if (!portrait) return;

  // Only animate if this character is currently shown
  const currentChar = document.getElementById('char-name')?.textContent;
  const char = window.CHARACTERS && window.CHARACTERS[charId];
  if (char && currentChar !== char.display_name) return;

  // Remove any one-shot animation classes
  const oneShots = ['speaking','composure-cracking','snap-lurch','deception-recoil',
                    'turned-away','turn-away','uninvited-creep','elara-desaturate','final-pullback'];

  // Permanent classes stay
  const permanent = ['composure-broken','turn-away','turned-away','uninvited-creep',
                     'elara-desaturate','final-pullback'];

  if (!permanent.includes(animClass)) {
    portrait.classList.remove(...oneShots.filter(c => !permanent.includes(c)));
  }

  portrait.classList.add(animClass);

  // Remove non-permanent after animation
  if (!permanent.includes(animClass)) {
    const duration = {
      'speaking': 0, // removed by _stopSpeaking
      'composure-cracking': 300,
      'snap-lurch': 300,
      'deception-recoil': 230,
    }[animClass] || 1000;

    if (duration > 0) {
      setTimeout(() => portrait.classList.remove(animClass), duration);
    }
  }
}

function _stopSpeaking(charId) {
  const portrait = document.getElementById('conv-portrait-' + (window._activeCharId || ''));
  if (!portrait) return;
  portrait.classList.remove('speaking');
}

function _onComposureChange(charId, state) {
  const portrait = document.getElementById('conv-portrait-' + (window._activeCharId || ''));
  if (!portrait) return;
  const char = window.CHARACTERS && window.CHARACTERS[charId];
  if (!char) return;
  const currentChar = document.getElementById('char-name')?.textContent;
  if (currentChar !== char.display_name) return;

  portrait.classList.remove('composure-cracking', 'composure-broken');
  if (state === 'cracking') {
    _animatePortrait(charId, 'composure-cracking');
  } else if (state === 'broken' || state === 'shattered') {
    portrait.classList.add('composure-broken');
  }

  // Update panel border
  const panel = document.getElementById('conversation-panel');
  if (panel) {
    panel.className = panel.className.replace(/composure-\w+/, '');
    panel.classList.add(`composure-${state}`);
  }
}

// ── TAP RIPPLE ─────────────────────────────────────────────
function _handleTapRipple(e) {
  // Only on hotspots
  if (!e.target.closest('.hotspot') && !e.target.classList.contains('hotspot')) return;
  const ripple = document.createElement('div');
  ripple.className = 'tap-ripple';
  ripple.style.left = `${e.clientX}px`;
  ripple.style.top  = `${e.clientY}px`;
  document.body.appendChild(ripple);
  setTimeout(() => { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 220);
}

// ── PH SLIP ANIMATION ──────────────────────────────────────
// Freeze portrait mid-bob, then snap to idle
function animatePHSlip() {
  const portrait = document.getElementById('conv-portrait-' + (window._activeCharId || ''));
  if (!portrait) return;
  portrait.classList.remove('speaking');
  // Frozen — no class, just holds position
  portrait.style.transform = 'translateY(-3px)';
  setTimeout(() => {
    portrait.style.transform = '';
    portrait.style.transition = 'transform 100ms ease-in';
  }, 800);
}

// ── BARON DIRECT LOOK ─────────────────────────────────────
// Rotates from offset to facing forward, then slowly back
function animateBaronDirectLook() {
  const portrait = document.getElementById('conv-portrait-' + (window._activeCharId || ''));
  if (!portrait) return;
  portrait.style.transition = 'transform 300ms ease-out';
  portrait.style.transform = 'rotate(0deg)';
  setTimeout(() => {
    portrait.style.transition = 'transform 600ms ease-in';
    portrait.style.transform = 'rotate(-5deg)';
  }, 1500);
}

// ── WORD BY WORD RESPONSE ─────────────────────────────────
function renderWordByWord(el, text, msPerWord) {
  if (!el) return;
  const sentences = text.split('. ');
  const firstSentence = sentences[0] + (sentences.length > 1 ? '.' : '');
  const rest = sentences.slice(1).join('. ');

  el.textContent = '';
  const words = firstSentence.split(' ');
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += (i > 0 ? ' ' : '') + words[i];
    i++;
    if (i >= words.length) {
      clearInterval(interval);
      if (rest) {
        setTimeout(() => {
          el.textContent = firstSentence + ' ' + rest;
        }, 200);
      }
    }
  }, msPerWord || 60);
}

// ── EXPOSE ─────────────────────────────────────────────────
window.initAmbient         = initAmbient;
window.renderWordByWord    = renderWordByWord;
window.animatePHSlip       = animatePHSlip;
window.animateBaronDirectLook = animateBaronDirectLook;
window._animatePortrait    = _animatePortrait;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAmbient);
} else {
  initAmbient();
}

// ══════════════════════════════════════════════════════════
// WORLD CLASS AMBIENCE — Light bloom, dust, shaft, shadows
// Single warm source. Upper left. Never bright. Never sterile.
// ══════════════════════════════════════════════════════════

// Rooms that get window light shaft — evening or earlier only
const SHAFT_ROOMS = ['foyer','gallery','study','library'];

// Rooms with fireplace heat shimmer
const HEAT_ROOMS = ['study','library','smoking'];

// Rooms that are fully interior — no shaft
const NO_SHAFT_ROOMS = ['vault','wine-cellar','tunnel-passage','hedge-path',
  'c1-arrival','c2-portraits','c3-original','c4-register','c5-correspondence',
  'c6-tunnel','c7-study','c8-gallery','c9-agreement','c10-reckoning'];

function initWorldAmbience() {
  const gameScreen = document.getElementById('screen-game');
  if (!gameScreen) return;

  // Build persistent layers — move between rooms
  _createLayer('lantern-bloom',  gameScreen);
  _createLayer('dust-layer',     gameScreen);
  _createLayer('light-shaft',    gameScreen);
  _createLayer('shadow-layer',   gameScreen);
  _createLayer('vignette-layer', gameScreen);
  _createLayer('heat-shimmer',   gameScreen);
  _createLayer('deep-night-overlay', gameScreen);

  _buildDustMotes();
  _applyWorldAmbience(gameState.currentRoom);

  NocturneEngine.on('roomEntered', ({ roomId }) => {
    _applyWorldAmbience(roomId);
  });
}

function _createLayer(id, parent) {
  if (document.getElementById(id)) return;
  const el = document.createElement('div');
  el.id = id;
  parent.appendChild(el);
}

function _buildDustMotes() {
  const layer = document.getElementById('dust-layer');
  if (!layer) return;
  // 12 motes — different sizes, positions, speeds, delays
  for (let i = 0; i < 12; i++) {
    const mote = document.createElement('div');
    mote.className = 'dust-mote';
    const size = 1 + Math.random() * 2;
    const left = 5 + Math.random() * 55; // cluster in left half — near lantern
    const top  = 20 + Math.random() * 60;
    const duration = 12 + Math.random() * 18;
    const delay = Math.random() * 15;
    mote.style.cssText = `
      width:${size}px;height:${size}px;
      left:${left}%;top:${top}%;
      animation-duration:${duration}s;
      animation-delay:-${delay}s;
    `;
    layer.appendChild(mote);
  }
}

function _applyWorldAmbience(roomId) {
  const hour = typeof getHourWindow === 'function' ? getHourWindow() : 'evening';
  const isNight = ['late','deep_night'].includes(hour);
  const isDeepNight = hour === 'deep_night';
  const isCompact = roomId && roomId.startsWith('c');
  const hasShaft = SHAFT_ROOMS.includes(roomId) && !isNight && !isCompact;
  const hasHeat = HEAT_ROOMS.includes(roomId);

  // Light shaft — only when interior light makes sense
  const shaft = document.getElementById('light-shaft');
  if (shaft) shaft.style.display = hasShaft ? 'block' : 'none';

  // Heat shimmer — fireplace rooms
  const heat = document.getElementById('heat-shimmer');
  if (heat) heat.classList.toggle('active', hasHeat);

  // Deep night overlay
  const night = document.getElementById('deep-night-overlay');
  if (night) night.classList.toggle('active', isDeepNight);

  // Lantern bloom — dimmer at deep night, warmer in compact
  const bloom = document.getElementById('lantern-bloom');
  if (bloom) {
    if (isDeepNight) bloom.style.opacity = '0.4';
    else if (isCompact) bloom.style.opacity = '1.3';
    else bloom.style.opacity = '1';
  }

  // Dust motes — reduced at night
  const dust = document.getElementById('dust-layer');
  if (dust) dust.style.opacity = isDeepNight ? '0.3' : isNight ? '0.6' : '1';

  // Shadow layer — heavier in vault/cellar
  const shadow = document.getElementById('shadow-layer');
  if (shadow) {
    if (['vault','wine-cellar','smoking'].includes(roomId)) {
      shadow.style.opacity = '1.5';
    } else {
      shadow.style.opacity = '1';
    }
  }

  // Vignette — tightest in deep night and compact
  const vignette = document.getElementById('vignette-layer');
  if (vignette) {
    if (isDeepNight) {
      vignette.style.background = 'radial-gradient(ellipse at 50% 40%,transparent 20%,rgba(10,10,10,0.4) 55%,rgba(10,10,10,0.75) 100%)';
    } else if (isCompact) {
      vignette.style.background = 'radial-gradient(ellipse at 50% 40%,transparent 40%,rgba(8,5,2,0.2) 65%,rgba(8,5,2,0.5) 100%)';
    } else {
      vignette.style.background = 'radial-gradient(ellipse at 50% 40%,transparent 35%,rgba(10,10,10,0.25) 65%,rgba(10,10,10,0.55) 100%)';
    }
  }
}

// Wire into existing initAmbient
const _origInitAmbient = window.initAmbient;
window.initAmbient = function() {
  if (_origInitAmbient) _origInitAmbient();
  initWorldAmbience();
};
