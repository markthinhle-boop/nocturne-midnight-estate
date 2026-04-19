// ============================================================
// NOCTURNE — compact-characters.js
// Compact characters: Surgeon depth gate, probe/prove thresholds.
// Deception inversion: ALL Compact deceptions effective.
// credibilityStrike() NEVER fires in Compact.
// KB v4.0 — new plot locked March 2026
// Compact warmth rule: never add decay, deflection, or composure mechanics.
// The Compact characters have been waiting forty years to tell someone
// the truth. They are not obstacles. They are the truth.
// Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// Compact deception inversion — ALL effective, correct version given
function handleCompactDeception(charId, itemId) {
  if (gameState.deceptions_remaining <= 0) return;
  gameState.deceptions_remaining--;
  gameState.verdictTracker.deceptions_used++;
  gameState.verdictTracker.deceptions_effective++;
  // Never credibilityStrike() in Compact
  NocturneEngine.emit('deceptionUsed', { slotsRemaining: gameState.deceptions_remaining });

  const char = window.CHARACTERS && window.CHARACTERS[charId];
  if (!char || !char.is_compact) return;

  const deceptions = char.deceptions || {};
  const specific = deceptions[itemId];
  const fallback = deceptions['_any'];

  let response;
  if (specific) {
    response = specific.response;
  } else if (fallback) {
    response = fallback.response_prefix + ' ' + (specific?.response || 'The correct document is here.');
  } else {
    response = 'That is not quite right. The correct version is here.';
  }

  const resp = document.getElementById('char-response');
  if (resp) {
    // Word-by-word for Compact too
    if (typeof renderWordByWord === 'function') {
      renderWordByWord(resp, response, 60);
    } else {
      resp.textContent = response;
    }
  }

  // Portrait recoil — even in Compact, character reacts
  if (typeof _animatePortrait === 'function') _animatePortrait(charId, 'deception-recoil');

  NocturneEngine.emit('deceptionResponse', { charId, itemId, text: response, is_effective: true });
  haptic([50, 30, 50]);
  saveGame();
}

// Override fireDeception for Compact characters
const _originalFireDeception = window.fireDeception;
window.fireDeception = function(charId, itemId) {
  const char = window.CHARACTERS && window.CHARACTERS[charId];
  if (char && char.is_compact) {
    handleCompactDeception(charId, itemId);
    return;
  }
  _originalFireDeception(charId, itemId);
};

// Probe/Prove threshold system (Section XLV)
// Below threshold: character probes — asks questions back
// Above threshold: character proves — gives full information
const COMPACT_THRESHOLDS = {
  'sovereign':  { threshold: 3, probe_response: 'He looks at you steadily. "What evidence brought you to that conclusion?"' },
  'heir':       { threshold: 4, probe_response: '"I want to understand what you found before I tell you what we planned." A pause. "Walk me through it."' },
  'envoy':      { threshold: 2, probe_response: '"You\'re close." He doesn\'t say how close.' },
  'archivist':  { threshold: 3, probe_response: '"The answer is in this room. Which shelf have you looked at so far?"' },
  'surgeon':    { threshold: 3, probe_response: '"You\'ve found part of it." A pause. "Which part?"' },
};

function checkCompactThreshold(charId) {
  const spec = COMPACT_THRESHOLDS[charId];
  if (!spec) return true; // no threshold — always above
  const answered = Object.keys(gameState.char_dialogue_complete[charId] || {}).filter(k => !k.startsWith('_')).length;
  return answered >= spec.threshold;
}

window.checkCompactThreshold = checkCompactThreshold;
window.handleCompactDeception = handleCompactDeception;
window.COMPACT_THRESHOLDS = COMPACT_THRESHOLDS;
