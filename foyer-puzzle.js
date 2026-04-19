// ============================================================
// NOCTURNE — foyer-puzzle.js
// Flow: narrator (tap) → curator text (tap) → timer + password
// Nothing auto-advances. Player controls every step.
// Password: SHREWSBURY.
// Hints escalate at 3 and 5 wrong attempts.
// Map locked until puzzle solved.
// KB v10 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

const RITE_PASSWORD = 'SHREWSBURY';
const RITE_TIMER_MS = 5 * 60 * 1000;

const WRONG_LINES = [
  'The Estate does not recognise that.',
  'He heard you. He is choosing not to respond.',
  'That is not what was said on the train.',
  'Wrong town entirely.',
  'The gate remains exactly where it was.',
];

const HINT_LINE_3 = 'The answer arrived before you did. The leather case by the coat rack \u2014 someone left it there deliberately. Or didn\u2019t.';
const HINT_LINE_5 = 'The luggage tag on that case. Read it carefully. Then think about who got off the train before you reached the Estate.';

let _wrongCount    = 0;
let _timerInterval = null;
let _timerRemaining = RITE_TIMER_MS;
let _puzzleActive  = false;
let _puzzleSolved  = false;

// ── INIT ──────────────────────────────────────────────────
function initFoyerPuzzle() {
  _applyMapLock();

  NocturneEngine.on('roomEntered', ({ roomId }) => {
    if (roomId !== 'foyer') return;

    if (_puzzleSolved || gameState.foyerPuzzleSolved) {
      setTimeout(() => {
        if (typeof _syncCharCards === 'function') _syncCharCards('foyer');
      }, 300);
      return;
    }

    setTimeout(() => _step1_narrator(), 700);
  });
}

// ── NAV LOCK — covers Gallery tab and all nav buttons ──────
function _applyMapLock() {
  function _doLock() {
    const nav = document.getElementById('room-nav');
    if (!nav) { setTimeout(_doLock, 200); return; }
    if (_puzzleSolved || gameState.foyerPuzzleSolved) { _unlockMap(); return; }

    if (!document.getElementById('foyer-nav-lock')) {
      const lock = document.createElement('div');
      lock.id = 'foyer-nav-lock';
      lock.style.cssText = [
        'position:absolute',
        'inset:0',
        'z-index:50',
        'background:rgba(8,5,3,0.85)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'cursor:default',
      ].join(';');

      const msg = document.createElement('div');
      msg.style.cssText = [
        'font-size:9px',
        'color:rgba(184,150,12,0.5)',
        'letter-spacing:0.2em',
        'text-transform:uppercase',
        'font-family:var(--font-ui)',
      ].join(';');
      msg.textContent = '\uD83D\uDD12  The Rite is not yet complete';
      lock.appendChild(msg);

      lock.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof showToast === 'function') {
          showToast('\u201cNot yet.\u201d The Curator does not look up.');
        }
      });

      nav.style.position = 'relative';
      nav.appendChild(lock);
    }
  }
  _doLock();

  // Re-apply on nav rebuilds (renderRoomNav clears innerHTML)
  NocturneEngine.on('roomNavRendered', _doLock);
}

function _unlockMap() {
  const lock = document.getElementById('foyer-nav-lock');
  if (lock) lock.remove();
}

// ── STEP 1 — Narrator, tap to advance ─────────────────────
function _step1_narrator() {
  if (_puzzleSolved || gameState.foyerPuzzleSolved) return;

  const panel  = document.getElementById('room-description');
  const textEl = document.getElementById('room-description-text');
  if (!panel || !textEl) return;

  const foyerDesc = window.ROOM_DESCRIPTIONS && window.ROOM_DESCRIPTIONS['foyer'];
  if (foyerDesc) textEl.textContent = foyerDesc;

  const stale = document.getElementById('foyer-tap-hint');
  if (stale) stale.remove();

  const tapHint = document.createElement('div');
  tapHint.id = 'foyer-tap-hint';
  tapHint.style.cssText = [
    'margin-top:16px',
    'font-size:9px',
    'color:rgba(100,90,70,0.5)',
    'letter-spacing:0.2em',
    'text-transform:uppercase',
    'font-family:var(--font-ui)',
    'text-align:center',
  ].join(';');
  tapHint.textContent = 'tap to continue';
  textEl.appendChild(tapHint);

  panel.classList.remove('visible');
  setTimeout(() => panel.classList.add('visible'), 50);

  function _onTap(e) {
    e.stopPropagation();
    panel.removeEventListener('click', _onTap);
    tapHint.remove();
    panel.classList.remove('visible');
    setTimeout(() => _step2_curator(), 400);
  }
  panel.addEventListener('click', _onTap);
}

// ── STEP 2 — Go straight to puzzle bar; foyer is explorable ─
function _step2_curator() {
  if (_puzzleSolved || gameState.foyerPuzzleSolved) return;
  _step3_puzzle();
}

// ── STEP 3 — Timer + password bar (inline on foyer) ──────
function _step3_puzzle() {
  if (_puzzleActive || _puzzleSolved || gameState.foyerPuzzleSolved) return;
  _puzzleActive   = true;
  _wrongCount     = 0;
  _buildPuzzleUI();
  _injectNorthcottHint();
}

// ── PUZZLE UI — thin bar pinned above room-nav ─────────────
function _buildPuzzleUI() {
  const existing = document.getElementById('foyer-puzzle-overlay');
  if (existing) existing.remove();

  // Measure actual nav height so bar sits flush above it
  const nav = document.getElementById('room-nav');
  const navH = nav ? nav.getBoundingClientRect().height : 80;

  const bar = document.createElement('div');
  bar.id = 'foyer-puzzle-overlay';
  bar.style.cssText = [
    'position:absolute',
    `bottom:${Math.round(navH)}px`,
    'left:0','right:0',
    'z-index:40',
    'background:rgba(8,5,3,0.97)',
    'border-top:1px solid rgba(184,150,12,0.18)',
    'padding:10px 16px 12px',
    'box-sizing:border-box',
  ].join(';');

  // Label row
  const labelRow = document.createElement('div');
  labelRow.style.cssText = 'margin-bottom:6px;';
  const lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:8px;color:rgba(100,90,70,0.45);letter-spacing:0.18em;font-family:var(--font-ui);text-transform:uppercase;';
  lbl.textContent = 'THE RITE';
  labelRow.appendChild(lbl);
  bar.appendChild(labelRow);

  // Input row
  const inputRow = document.createElement('div');
  inputRow.style.cssText = 'display:flex;gap:8px;align-items:center;';

  const input = document.createElement('input');
  input.id = 'foyer-password-input';
  input.type = 'text';
  input.placeholder = 'ENTER THE RITE PASSWORD';
  input.autocomplete = 'off';
  input.autocorrect = 'off';
  input.autocapitalize = 'characters';
  input.spellcheck = false;
  input.style.cssText = [
    'flex:1',
    'background:transparent',
    'border:none',
    'border-bottom:1px solid rgba(184,150,12,0.25)',
    'color:var(--cream)',
    'font-family:var(--font-ui)',
    'font-size:12px',
    'letter-spacing:0.15em',
    'text-transform:uppercase',
    'padding:5px 0',
    'outline:none',
    'min-width:0',
  ].join(';');

  const btn = document.createElement('button');
  btn.textContent = 'ENTER';
  btn.style.cssText = [
    'border:1px solid rgba(184,150,12,0.3)',
    'background:transparent',
    'color:var(--gold-dim)',
    'font-family:var(--font-ui)',
    'font-size:9px',
    'letter-spacing:0.2em',
    'padding:6px 14px',
    'cursor:pointer',
    'flex-shrink:0',
  ].join(';');
  btn.onclick = () => _attempt(input.value);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') _attempt(input.value); });

  inputRow.appendChild(input);
  inputRow.appendChild(btn);
  bar.appendChild(inputRow);

  // Feedback line
  const fb = document.createElement('div');
  fb.id = 'foyer-feedback';
  fb.style.cssText = [
    'margin-top:5px',
    'min-height:14px',
    'font-size:10px',
    'color:rgba(180,80,60,0.9)',
    'font-family:var(--font-ui)',
    'letter-spacing:0.05em',
    'opacity:0',
    'transition:opacity 300ms',
    'font-style:italic',
  ].join(';');
  bar.appendChild(fb);

  const container = document.getElementById('screen-game') || document.getElementById('app') || document.body;
  // Temporarily allow bar to be visible within the game screen
  if (container.id === 'screen-game') container.style.overflow = 'visible';
  container.appendChild(bar);
}

// ── TIMER ──────────────────────────────────────────────────
function _startTimer() {
  const start = Date.now();
  _timerInterval = setInterval(() => {
    _timerRemaining = Math.max(0, RITE_TIMER_MS - (Date.now() - start));
    const m = Math.floor(_timerRemaining / 60000);
    const s = Math.floor((_timerRemaining % 60000) / 1000);
    const txt = document.getElementById('foyer-timer-text');
    if (txt) txt.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    const bar = document.getElementById('foyer-timer-bar');
    if (bar) {
      const pct = _timerRemaining / RITE_TIMER_MS;
      bar.style.opacity = String(0.3 + pct * 0.7);
      bar.style.background = _timerRemaining < 60000
        ? 'rgba(180,60,40,0.85)'
        : 'var(--gold-dim)';
    }
    if (_timerRemaining <= 0) _timerFail();
  }, 250);
}

function _clearTimer() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
}

// ── ATTEMPT ────────────────────────────────────────────────
function _attempt(value) {
  if ((value || '').trim().toUpperCase() === RITE_PASSWORD) {
    _success();
    return;
  }

  _wrongCount++;
  const inp = document.getElementById('foyer-password-input');
  if (inp) { inp.value = ''; inp.focus(); }
  if (typeof haptic === 'function') haptic([60, 30, 60]);

  let line;
  if (_wrongCount === 3) {
    line = HINT_LINE_3;
  } else if (_wrongCount === 5) {
    line = HINT_LINE_5;
  } else {
    line = WRONG_LINES[(_wrongCount - 1) % WRONG_LINES.length];
  }

  const isHint = (_wrongCount === 3 || _wrongCount === 5);
  const fb = document.getElementById('foyer-feedback');
  if (fb) {
    fb.style.color = isHint ? 'rgba(184,150,12,0.8)' : 'rgba(180,80,60,0.9)';
    fb.style.opacity = '0';
    fb.textContent = line;
    requestAnimationFrame(() => { fb.style.opacity = '1'; });
    setTimeout(() => { fb.style.opacity = '0'; }, isHint ? 5000 : 2200);
  }
}

// ── SUCCESS ────────────────────────────────────────────────
function _success() {
  _clearTimer();
  _puzzleSolved = true;
  _puzzleActive = false;
  gameState.foyerPuzzleSolved = true;
  saveGame();

  const el = document.getElementById('foyer-puzzle-overlay');
  if (el) {
    el.style.transition = 'opacity 600ms ease';
    el.style.opacity = '0';
    setTimeout(() => {
      el.remove();
      const sg = document.getElementById('screen-game');
      if (sg) sg.style.overflow = '';
    }, 650);
  }

  _unlockMap();

  setTimeout(() => {
    const resp  = document.getElementById('char-response');
    const name  = document.getElementById('char-name');
    const panel = document.getElementById('conversation-panel');
    if (resp && name && panel) {
      name.textContent = 'The Curator';
      resp.textContent = '\u201cShrewsbury.\u201d He says it the way someone says a word they expected to hear. \u201cThe Estate is open to you.\u201d He steps aside. Northcott straightens.';
      panel.classList.add('open');
      setTimeout(() => panel.classList.remove('open'), 4500);
    }
  }, 700);

  if (typeof haptic === 'function') haptic([80, 40, 80]);
  NocturneEngine.emit('foyerPuzzleSolved', {});

  setTimeout(() => {
    if (typeof _syncCharCards === 'function') _syncCharCards('foyer');
  }, 800);
}

// ── FAIL ───────────────────────────────────────────────────
function _timerFail() {
  _clearTimer();
  _puzzleActive = false;

  const el = document.getElementById('foyer-puzzle-overlay');
  if (el) el.remove();
  const sg = document.getElementById('screen-game');
  if (sg) sg.style.overflow = '';

  const textEl = document.getElementById('room-description-text');
  const panel  = document.getElementById('room-description');
  if (textEl) textEl.textContent = '\u201cThe Estate has noted your hesitation. You were not ready.\u201d The gate closes behind you.';
  if (panel) panel.classList.add('visible');

  setTimeout(() => {
    if (panel) panel.classList.remove('visible');
    gameState.foyerPuzzleSolved = false;
    _puzzleSolved = false;
    _wrongCount   = 0;
    if (typeof startTrainSequence === 'function') startTrainSequence();
  }, 3000);
}

// ── NORTHCOTT HINT QUESTION ────────────────────────────────
let _northcottHintWired = false;
function _injectNorthcottHint() {
  if (_northcottHintWired) return;
  _northcottHintWired = true;

  NocturneEngine.on('conversationOpened', ({ charId }) => {
    if (charId !== 'northcott' || !_puzzleActive) return;
    setTimeout(() => {
      const list = document.getElementById('questions-list');
      if (!list || document.getElementById('northcott-hint-q')) return;
      const item = document.createElement('div');
      item.id = 'northcott-hint-q';
      item.className = 'question-item';
      item.style.cssText = 'padding:12px 20px;font-size:13px;color:var(--cream-dim);border-bottom:1px solid rgba(42,37,28,0.25);cursor:pointer;letter-spacing:0.02em;';
      item.textContent = '\u201cThe Rite password. You always remember it?\u201d';
      item.onclick = () => {
        const resp = document.getElementById('char-response');
        if (resp) resp.textContent = '\u201cAlways.\u201d A pause. \u201cSimple trick. It\u2019s the last town on the line before the Estate gates. I say it to myself on the train every time I make the journey.\u201d He looks at you for a moment. \u201cWhoever you sat with on the way here \u2014 they got off at the same stop. Most people don\u2019t notice that.\u201d';
        item.style.opacity = '0.4';
        item.style.pointerEvents = 'none';
      };
      list.insertBefore(item, list.firstChild);
    }, 300);
  });
}

// ── SKIP IF ALREADY SOLVED ─────────────────────────────────
NocturneEngine.on('engineReady', () => {
  if (gameState.foyerPuzzleSolved) {
    _puzzleSolved = true;
    _unlockMap();
  }
});

window.initFoyerPuzzle  = initFoyerPuzzle;
window.resetFoyerPuzzle = () => {
  _puzzleSolved       = false;
  _puzzleActive       = false;
  _northcottHintWired = false;
  _wrongCount         = 0;
  gameState.foyerPuzzleSolved = false;
  _clearTimer();
  _applyMapLock();
  ['foyer-puzzle-overlay', 'foyer-curator-overlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
};
