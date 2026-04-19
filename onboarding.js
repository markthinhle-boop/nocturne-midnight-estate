// ============================================================
// NOCTURNE — onboarding.js
// One screen: Haptics → Train
// session_start = Date.now() on haptics confirmation.
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

function initOnboarding() {
  _bindButtons();
}

// ── OPENING SEQUENCE ───────────────────────────────────────
function startOpeningSequence() {
  showScreen('screen-studios');

  let advanced = false;
  function advanceToTitle() {
    if (advanced) return;
    advanced = true;
    showScreen('screen-title');

    let titleDone = false;
    function advanceToOnboarding() {
      if (titleDone) return;
      titleDone = true;
      showScreen('screen-onboarding');
      _showStep('step-haptics');
    }
    setTimeout(advanceToOnboarding, 2000);
    document.getElementById('screen-title').addEventListener('click', advanceToOnboarding, { once: true });
  }

  setTimeout(advanceToTitle, 1800);
  document.getElementById('screen-studios').addEventListener('click', advanceToTitle, { once: true });
}

// ── STEP NAVIGATION ────────────────────────────────────────
function _showStep(stepId) {
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  const step = document.getElementById(stepId);
  if (step) step.classList.add('active');
}

// ── HAPTICS ────────────────────────────────────────────────
function _bindButtons() {
  const yesBtn = document.getElementById('btn-haptics-yes');
  const noBtn  = document.getElementById('btn-haptics-no');
  if (yesBtn) yesBtn.addEventListener('click', () => {
    if (window.NocturneSound && window.NocturneSound.resume) window.NocturneSound.resume();
    gameSettings.hapticsEnabled = true;
    haptic([80]);
    _completeOnboarding();
  });
  if (noBtn) noBtn.addEventListener('click', () => {
    if (window.NocturneSound && window.NocturneSound.resume) window.NocturneSound.resume();
    gameSettings.hapticsEnabled = false;
    _completeOnboarding();
  });
}

function _completeOnboarding() {
  gameState.paidTierUnlocked = gameSettings.paidTierUnlocked;
  saveGame();

  showScreen('screen-game');

  if (typeof initRooms === 'function') initRooms();
  if (typeof initMapUI === 'function') initMapUI();
  if (typeof initTunnel === 'function') initTunnel();
  if (typeof initCompact === 'function') initCompact();
  if (typeof initMap === 'function') initMap();
  if (typeof initBehavioralLogger === 'function') initBehavioralLogger('ep1');

  // DEV SHORTCUT — skip train if devSkipTrain is set
  const devSkipTrain = localStorage.getItem('devSkipTrain');
  if (devSkipTrain) {
    localStorage.removeItem('devSkipTrain');
    if (typeof updateInventoryCounter === 'function') updateInventoryCounter();
    return;
  }

  if (typeof startTrainSequence === 'function') {
    startTrainSequence();
  } else {
    navigateTo('foyer');
    if (typeof renderCurrentRoom === 'function') renderCurrentRoom();
  }

  if (typeof updateInventoryCounter === 'function') updateInventoryCounter();
}

window.initOnboarding = initOnboarding;
window.startOpeningSequence = startOpeningSequence;
