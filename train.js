// ============================================================
// NOCTURNE — train.js
// Portrait-first layout. Dialogue on top of portrait.
// Single NPC: portrait centred. Multiple: side by side.
// KB v10 · Session 20 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── TRAIN STATE ────────────────────────────────────────────
const trainState = {
  currentCar: 'compartment',
  questionsAsked: { elliot: [], marcus: [], 'todd': [] },
  activeChar: null,
  accusationMade: false,
  correctAccusation: false,
};

// ── CAR CONFIGS ────────────────────────────────────────────
const TRAIN_CAR_CONFIG = {
  compartment: {
    time:      '5:00 PM',
    label:     'The Compartment',
    narrator:  'The train is already moving. Gold afternoon light. Your wallet and invitation card are gone. You have one person here and three questions. Choose carefully.',
    bgRoom:    'train-compartment',
    chars:     ['elliot'],
    navText:   'Move to the Dining Car',
    navCar:    'dining',
  },
  dining: {
    time:      '5:40 PM',
    label:     'The Dining Car',
    narrator:  'Gold to amber. Two men at the far table. One of them was in your compartment.',
    bgRoom:    'train-dining',
    chars:     ['marcus', 'todd'],
    navText:   'Move to the Rear Car',
    navCar:    'rear',
  },
  rear: {
    time:      '5:55 PM',
    label:     'The Rear Car',
    narrator:  '',
    bgRoom:    'train-rear',
    chars:     [],
    navText:   null,
  },
};

// ── TRAIN CHARACTERS ───────────────────────────────────────
const TRAIN_CHARS = {

  'elliot': {
    display_name: 'Elliot',
    portrait:     `${ASSET_BASE}characters/nocturne-char-elliot-closed-bg.png`,
    snap_at:      4,
    snap:         '"I\'ve told you what I know." Back to the window.',
    questions: [
      { id: 'E1', text: '"Long journey?"',                            type: 'DEFLECTING', response: '"Long enough." Back to the window.' },
      { id: 'E2', text: '"Where did you board?"',                     type: 'REVEALING',  response: '"Birmingham. Half one." He finally looks away from the window. "I watched you get on. You sat down, checked your jacket pocket — the invitation card, I assume — then put your head back and went straight out." A beat. "The man from the dining car came through about twenty minutes later. You were still asleep. He had your jacket in both hands like he was folding it. I thought you\'d asked him to." He looks at the seat between you. "I should have said something. I didn\'t."' },
      { id: 'E3', text: '"Did anyone come through?"',                  type: 'REVEALING',  response: 'He turns from the window. "About an hour ago. Well dressed. Moving like he had somewhere to be." A pause. "He stopped at your seat. I assumed you knew him."' },
      { id: 'E4', text: '"Are you going to the Manor?"',               type: 'REVEALING',  response: '"The what?" He looks at you directly. Confusion unperformed. "I\'m visiting my sister in Shrewsbury. I get off at the next stop." Frank. Unhurried.' },
      { id: 'E5', text: '"You seem distracted."',                      type: 'DEFLECTING', response: '"I\'m fine." Short. He shifts toward the window.' },
      { id: 'E6', text: '"You noticed something before I woke up."',   type: 'REVEALING',  response: 'A beat. He weighs it. "On the platform at Coventry. The man I mentioned — standing outside this compartment window. Looking in." A beat. "He already had a seat. In the dining car. I saw him there when I walked through."' },
    ],
  },

  'marcus': {
    display_name: 'Marcus',
    portrait:     `${ASSET_BASE}characters/nocturne-char-marcus-closed-bg.png`,
    snap_at:      4,
    snap:         '"I\'d like to finish my meal."',
    questions: [
      { id: 'M1', text: '"Are you two together?"',                     type: 'DEFLECTING', response: 'He says it to the menu. "We got talking at the last stop."' },
      { id: 'M2', text: '"How long has he been sitting with you?"',    type: 'REVEALING',  response: 'He sets the menu down. "Since Birmingham. He was already here when I boarded at Coventry." "He hasn\'t moved from that seat once." Flat. Honest.' },
      { id: 'M3', text: '"Did he leave the table at any point?"',      type: 'REVEALING',  response: 'He looks at his water glass. "Once. Before Coventry. He was gone about ten minutes." "He came back straightening his jacket. Both cuffs. I remember thinking it was an odd thing to do after stretching your legs."' },
      { id: 'M4', text: '"What did he tell you about himself?"',       type: 'REVEALING',  response: '"That he\'s attending a private function tonight. He knew the guest list before I asked." A pause. "He mentioned one name twice. I got the impression that person didn\'t know he was coming."' },
      { id: 'M5', text: '"You look like you want to be somewhere else."', type: 'REVEALING', response: 'He looks up for the first time. "He sat down before I\'d finished putting my bag up. Started talking before I\'d even looked at him." A beat. "People who do that usually want something. I spent two hours trying to work out what."' },
      { id: 'M6', text: '"What do you make of him?"',                  type: 'DEFLECTING', response: '"He\'s good company." Present tense. Careful.' },
    ],
  },

  'todd': {
    display_name: 'Todd',
    portrait:     `${ASSET_BASE}characters/nocturne-char-todd-train-closed-bg.png`,
    snap_at:      4,
    snap:         '"You\'ve used your questions well. Or you haven\'t." Finally drinks. "We\'ll find out at the gate."',
    questions: [
      { id: 'P1', text: '"Travelling for business?"',                  type: 'DEFLECTING', response: '"Of a kind." Returns question immediately. "And you?"' },
      { id: 'P2', text: '"You\'ve been in this car since Birmingham."', type: 'REVEALING',  response: '"Have I." Not a question. Lets beat sit. "I find the dining car more comfortable than the compartments." Adjusts right cuff. Once. Carefully.' },
      { id: 'P3', text: '"You know who else is attending tonight."',    type: 'REVEALING',  response: 'Picks up glass. Doesn\'t drink. "Most guests know the guest list. It\'s that kind of evening." Steadily. "The more interesting question is whether you know what you\'re walking into."' },
      { id: 'P4', text: '"My invitation is missing."',                  type: 'REVEALING',  response: 'Sets glass down. "Invitations go missing." Straightens both cuffs. Left then right. Unhurried. "It\'s a known risk on long journeys." Both cuffs. Same gesture Marcus described.' },
      { id: 'P5', text: '"You already knew who I was when I walked in."', type: 'REVEALING', response: 'A pause. The first real one. "You\'re on the list." Simply. The glass stays on the table.' },
      { id: 'P6', text: '"What\'s in your inside pocket?"',             type: 'DEFLECTING', response: '"The usual things." Holds eye. Doesn\'t move toward pocket. "What\'s in yours?"' },
    ],
  },
};

// ── ACCUSATION CONFIG ─────────────────────────────────────
const TRAIN_ACCUSATION = {
  suspects: ['elliot', 'marcus', 'todd'],
  correct:  'todd',
  responses: {
    'elliot':    { text: '"I told you about him." A beat. "I told you exactly what I saw and you\'re standing here pointing at me." He shakes his head once. Small. Tired. "I hope whatever\'s in that wallet wasn\'t important."', outcome: 'wrong' },
    'marcus':    { text: 'He sets the menu down slowly. "I\'ve been at this table since Coventry." Looks at the man by the window. "He hasn\'t." Picks the menu back up. "Good luck at the gate."', outcome: 'wrong' },
    'todd':  { text: '"You\'re better at this than I expected." Reaches into inside pocket. Wallet. Invitation card. Places them between you. "I wanted to see how you think. Consider it a professional courtesy." Stands. Straightens coat. "The reference number on the card. The gate attendant will know what to do with it."', outcome: 'correct' },
  },
};

// ── INIT ───────────────────────────────────────────────────
function startTrainSequence() {
  trainState.currentCar     = 'compartment';
  trainState.questionsAsked = { elliot: [], marcus: [], 'todd': [] };
  trainState.activeChar     = null;
  trainState.accusationMade    = false;
  trainState.correctAccusation = false;

  _setGameChromeVisible(false);
  document.getElementById('train-screen').style.display = 'flex';
  gameState.currentRoom = 'train-compartment';
  NocturneEngine.emit('trainSequenceStarted', {});
  _renderCar('compartment');
}

// ── RENDER CAR ─────────────────────────────────────────────
function _renderCar(carKey) {
  trainState.currentCar = carKey;
  trainState.activeChar = null;
  const cfg = TRAIN_CAR_CONFIG[carKey];

  // Background
  const bg = document.getElementById('train-bg');
  if (bg) {
    let bgUrl = typeof getRoomBg === 'function' ? getRoomBg(cfg.bgRoom) : '';
    if (!bgUrl) bgUrl = `${ASSET_BASE}room/nocturne-room-${cfg.bgRoom}-bg.jpg`;
    bg.style.backgroundImage = `url(${bgUrl})`;
  }

  // Header
  document.getElementById('train-car-label').textContent = cfg.label;

  // Narrator
  const narratorEl = document.getElementById('train-narrator');
  if (narratorEl) narratorEl.textContent = cfg.narrator || '';

  // Clear portrait zone and bottom panels
  document.getElementById('train-portrait-zone').innerHTML = '';
  document.getElementById('train-dialogue-area').textContent = '';
  document.getElementById('train-questions').innerHTML     = '';
  document.getElementById('train-nav').innerHTML           = '';

  // Rear car = accusation only — bg still loads
  if (carKey === 'rear') {
    _renderAccusation();
    return;
  }

  // Build NPC cards in portrait zone
  cfg.chars.forEach(charId => {
    const card = _buildNpcCard(charId, cfg.chars.length);
    document.getElementById('train-portrait-zone').appendChild(card);
  });

  // Activate first char
  if (cfg.chars.length > 0) _activateChar(cfg.chars[0]);

  _renderNav(cfg);
}

// ── BUILD NPC CARD ─────────────────────────────────────────
function _buildNpcCard(charId, totalChars) {
  const char = TRAIN_CHARS[charId];

  const card = document.createElement('div');
  card.className = 'train-npc-card';
  card.id = `train-card-${charId}`;
  card.onclick = () => _activateChar(charId);

  // Portrait bg
  const portrait = document.createElement('div');
  portrait.className = 'train-npc-portrait';
  portrait.style.backgroundImage = `url(${char.portrait})`;
  card.appendChild(portrait);

  // Edge blend — fades portrait into background, no hard frame
  const blend = document.createElement('div');
  blend.className = 'train-npc-blend';
  card.appendChild(blend);

  // Text area — name + dialogue on top of portrait
  const textArea = document.createElement('div');
  textArea.className = 'train-npc-text';
  textArea.id = `train-text-${charId}`;

  const name = document.createElement('div');
  name.className = 'train-npc-name';
  name.textContent = char.display_name.toUpperCase();
  textArea.appendChild(name);

  const dialogue = document.createElement('div');
  dialogue.className = 'train-npc-dialogue';
  dialogue.id = `train-dialogue-${charId}`;
  textArea.appendChild(dialogue);

  card.appendChild(textArea);

  // Mouth overlay for lip sync
  const mouthOverlay = document.createElement('div');
  mouthOverlay.className = 'mouth-overlay';
  card.appendChild(mouthOverlay);

  // Tap hint for multi-char cars
  if (totalChars > 1) {
    const hint = document.createElement('div');
    hint.className = 'train-npc-tap-hint';
    hint.id = `train-hint-${charId}`;
    hint.textContent = 'Tap';
    card.appendChild(hint);
  }

  return card;
}

// ── ACTIVATE CHARACTER ─────────────────────────────────────
function _activateChar(charId) {
  trainState.activeChar = charId;
  const cfg = TRAIN_CAR_CONFIG[trainState.currentCar];

  // Update card states
  cfg.chars.forEach(cId => {
    const card = document.getElementById(`train-card-${cId}`);
    if (!card) return;
    if (cId === charId) {
      card.classList.remove('inactive');
      card.classList.add('active');
      const hint = document.getElementById(`train-hint-${cId}`);
      if (hint) hint.style.display = 'none';
    } else {
      card.classList.remove('active');
      card.classList.add('inactive');
      const hint = document.getElementById(`train-hint-${cId}`);
      if (hint) hint.style.display = 'block';
    }
  });

  _renderQuestions(charId);
}

// ── RENDER QUESTIONS ───────────────────────────────────────
function _renderQuestions(charId) {
  const list = document.getElementById('train-questions');
  list.innerHTML = '';
  const char  = TRAIN_CHARS[charId];
  const asked = trainState.questionsAsked[charId] || [];
  const snapped = asked.length >= char.snap_at;

  if (snapped) {
    list.innerHTML = `<div class="train-questions-exhausted">${_esc(char.snap)}</div>`;
    if (!trainState.snapFired) trainState.snapFired = {};
    if (!trainState.snapFired[charId]) {
      trainState.snapFired[charId] = true;
      NocturneEngine.emit('trainSnapFired', { charId });
    }
    return;
  }

  char.questions.forEach(q => {
    if (asked.includes(q.id)) return;
    const div = document.createElement('div');
    div.className = 'train-question-item';
    div.textContent = q.text;
    div.dataset.qid = q.id;
    div.onclick = () => _askQuestion(charId, q.id);
    list.appendChild(div);
  });

  const unanswered = char.questions.filter(q => !asked.includes(q.id));
  if (unanswered.length === 0) {
    list.innerHTML = `<div class="train-questions-exhausted">The conversation has run its course.</div>`;
  }
}

// ── ASK QUESTION ───────────────────────────────────────────
function _askQuestion(charId, qId) {
  const char = TRAIN_CHARS[charId];
  const q    = char.questions.find(x => x.id === qId);
  if (!q) return;

  if (!trainState.questionsAsked[charId]) trainState.questionsAsked[charId] = [];
  trainState.questionsAsked[charId].push(qId);

  // Show response below portrait zone
  const dialogueArea = document.getElementById('train-dialogue-area');
  if (dialogueArea) {
    if (typeof renderWordByWord === 'function') {
      renderWordByWord(dialogueArea, q.response, 50);
    } else {
      dialogueArea.textContent = q.response;
    }
  }

  // Lip sync — driven by train-voice.js audio duration, not word count
  // train-voice.js listens for trainQuestionAsked and manages speaking class

  if (q.type === 'REVEALING') haptic([20]);

  NocturneEngine.emit('trainQuestionAsked', { charId, qId });

  _renderQuestions(charId);
}

// ── NAV BUTTON ─────────────────────────────────────────────
function _renderNav(cfg) {
  const nav = document.getElementById('train-nav');
  nav.innerHTML = '';
  if (!cfg.navText) return;
  const btn = document.createElement('button');
  btn.className = 'train-nav-btn';
  btn.textContent = cfg.navText;
  btn.onclick = () => {
    NocturneEngine.emit('trainSceneChanged', {});
    gameState.currentRoom = `train-${cfg.navCar}`;
    _renderCar(cfg.navCar);
  };
  nav.appendChild(btn);
}

// ── REAR CAR — ACCUSATION ──────────────────────────────────
function _renderAccusation() {
  const screen = document.getElementById('train-accusation-screen');
  screen.style.display = 'flex';

  // Always clear any previous confirm overlay
  const oldOverlay = document.getElementById('train-accusation-confirm');
  if (oldOverlay) oldOverlay.remove();

  const portContainer = document.getElementById('train-accusation-portraits');
  portContainer.innerHTML = '';

  TRAIN_ACCUSATION.suspects.forEach(charId => {
    const char = TRAIN_CHARS[charId];
    if (!char) return;

    const card = document.createElement('div');
    card.className = 'train-accuse-card';
    card.onclick = () => _makeAccusation(charId);

    const portrait = document.createElement('div');
    portrait.className = 'train-accuse-portrait';
    portrait.style.backgroundImage = `url(${char.portrait})`;
    card.appendChild(portrait);

    const gradient = document.createElement('div');
    gradient.className = 'train-accuse-gradient';
    card.appendChild(gradient);

    const name = document.createElement('div');
    name.className = 'train-accuse-name';
    name.textContent = char.display_name.toUpperCase();
    card.appendChild(name);

    portContainer.appendChild(card);
  });
}

// ── MAKE ACCUSATION ────────────────────────────────────────
function _makeAccusation(charId) {
  if (trainState.accusationMade) return;
  trainState.accusationMade = true;
  NocturneEngine.emit('trainSceneChanged', {});

  const result = TRAIN_ACCUSATION.responses[charId];
  if (!result) return;

  haptic(result.outcome === 'correct' ? [200] : [50, 30, 50]);

  NocturneEngine.emit('trainAccusationMade', { charId, outcome: result.outcome });

  let overlay = document.getElementById('train-accusation-confirm');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'train-accusation-confirm';
    document.getElementById('train-accusation-screen').appendChild(overlay);
  }

  const resultEl = document.createElement('div');
  resultEl.id = 'train-accusation-result';
  overlay.innerHTML = '';
  overlay.appendChild(resultEl);
  overlay.classList.add('visible');

  if (typeof renderWordByWord === 'function') {
    renderWordByWord(resultEl, result.text, 55);
  } else {
    resultEl.textContent = result.text;
  }

  // Show proceed button after text finishes
  const readTime = Math.max(2000, result.text.split(' ').length * 55);
  const correct  = result.outcome === 'correct';

  setTimeout(() => {
    const btn = document.createElement('button');
    btn.className   = 'train-gate-btn';
    btn.style.marginTop = '24px';
    btn.style.maxWidth  = '260px';
    btn.textContent = correct ? 'Proceed to the Estate' : 'The Gate';
    btn.onclick = () => _showGateScene(correct);
    overlay.appendChild(btn);
    if (correct) trainState.correctAccusation = true;
  }, readTime);
}

// ── GATE SCENE ─────────────────────────────────────────────
function _showGateScene(correct) {
  NocturneEngine.emit('trainSceneChanged', {});
  NocturneEngine.emit('gateSceneShown', {});
  document.getElementById('train-accusation-screen').style.display = 'none';

  const screen  = document.getElementById('train-gate-screen');
  const textEl  = document.getElementById('train-gate-text');
  const btnArea = document.getElementById('train-gate-btn-area');
  const gateBg  = document.getElementById('train-gate-bg');

  if (!screen || !textEl || !btnArea || !gateBg) {
    if (correct) _showInvitationCard();
    else trainBeginAgain();
    return;
  }

  const gateBgUrl = correct
    ? `${ASSET_BASE}room/nocturne-room-gate-bg.jpg`
    : `${ASSET_BASE}room/nocturne-room-gate-closed-bg.jpg`;
  gateBg.style.backgroundImage = `url(${gateBgUrl})`;

  // Cover everything immediately — no flash of game content
  document.getElementById('train-screen').style.display = 'none';
  const gameScreen = document.getElementById('screen-game');
  if (gameScreen) gameScreen.style.visibility = 'hidden';
  // Explicitly hide portrait zone and conversation panel
  const convPortrait = document.getElementById('conv-portrait-zone');
  if (convPortrait) convPortrait.style.display = 'none';
  const convPanel = document.getElementById('conversation-panel');
  if (convPanel) convPanel.style.display = 'none';

  // Show gate screen immediately at full opacity — black covers everything
  screen.style.opacity    = '1';
  screen.style.transition = 'none';
  screen.style.display    = 'flex';
  // Brief black hold then fade in the background image
  screen.style.background = '#0a0805';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (gameScreen) gameScreen.style.visibility = 'visible';
      screen.style.transition = 'none';
      gateBg.style.opacity = '0';
      gateBg.style.transition = 'opacity 1200ms ease';
      requestAnimationFrame(() => {
        gateBg.style.opacity = '1';
      });
    });
  });

  btnArea.innerHTML = '';

  if (correct) {
    textEl.textContent = 'Midnight Estate. The gate is open. The attendant is waiting.';
    const btn = document.createElement('button');
    btn.className   = 'train-gate-btn';
    btn.textContent = 'Present Your Invitation';
    btn.onclick = () => {
      screen.style.display = 'none';
      _showInvitationCard();
    };
    btnArea.appendChild(btn);
  } else {
    textEl.textContent = 'The gate attendant looks at you. He does not open the book. "You were not expected." He does not say it unkindly. That makes it worse.';
    const btn = document.createElement('button');
    btn.className   = 'train-gate-btn';
    btn.textContent = 'Begin Again';
    btn.onclick = () => {
      NocturneEngine.emit('gateSceneEnded', {});
      screen.style.display = 'none';
      trainBeginAgain();
    };
    btnArea.appendChild(btn);
  }
}

// ── INVITATION CARD — after correct PH accusation ──────────
function _showInvitationCard() {
  document.getElementById('train-accusation-screen').style.display = 'none';
  const screen = document.getElementById('train-invitation-screen');
  screen.style.display = 'flex';

  const input   = document.getElementById('invitation-password-input');
  const greyed  = document.getElementById('invitation-greyed-msg');
  const beginEl = document.getElementById('invitation-begin-again');

  input.style.display   = 'block';
  greyed.style.display  = 'none';
  beginEl.style.display = 'none';
  input.disabled = false;
  input.value    = '';
  input.focus();

  input.addEventListener('input', function _handler() {
    if (input.value.length === 4) {
      if (input.value === '1847') {
        input.removeEventListener('input', _handler);
        haptic([200]);
        gameState.verdictTracker.session_start = Date.now();
        // Hide everything immediately — no cutscene
        document.getElementById('train-screen').style.display = 'none';
        screen.style.opacity = '0';
        screen.style.transition = 'opacity 600ms ease';
        setTimeout(() => _endTrainSequence(), 650);
      } else {
        haptic([30, 20, 30]);
        input.value = '';
        input.style.borderBottomColor = 'rgba(200,60,60,0.6)';
        setTimeout(() => { input.style.borderBottomColor = ''; }, 800);
      }
    }
  });
}

// ── WRONG ACCUSATION — BEGIN AGAIN ────────────────────────
function _showBeginAgain() {
  const screen = document.getElementById('train-accusation-screen');
  // Add begin again button to overlay
  let overlay = document.getElementById('train-accusation-confirm');
  if (!overlay) return;
  const btn = document.createElement('button');
  btn.className = 'train-nav-btn';
  btn.style.marginTop = '24px';
  btn.textContent = 'BEGIN AGAIN';
  btn.onclick = () => trainBeginAgain();
  overlay.appendChild(btn);
}

function _gateCorrect() {
  haptic([200]);
  gameState.verdictTracker.session_start = Date.now();
  const screen = document.getElementById('train-invitation-screen');
  if (screen) { screen.style.opacity = '0'; screen.style.transition = 'opacity 1200ms ease'; }
  setTimeout(() => _endTrainSequence(), 1200);
}

function _gateWrong(input) {
  haptic([30, 20, 30]);
  input.value = '';
  input.style.borderBottomColor = 'rgba(200,60,60,0.6)';
  setTimeout(() => { input.style.borderBottomColor = ''; }, 800);
}

// ── BEGIN AGAIN ────────────────────────────────────────────
function trainBeginAgain() {
  NocturneEngine.emit('trainSceneChanged', {});
  NocturneEngine.emit('trainSequenceStarted', {});
  // Restore elements hidden during gate scene
  const convPortrait = document.getElementById('conv-portrait-zone');
  if (convPortrait) convPortrait.style.display = '';
  const convPanel = document.getElementById('conversation-panel');
  if (convPanel) convPanel.style.display = '';
  const gameScreen = document.getElementById('screen-game');
  if (gameScreen) gameScreen.style.visibility = '';
  const accScreen = document.getElementById('train-accusation-screen');
  accScreen.style.display = 'none';
  const overlay = document.getElementById('train-accusation-confirm');
  if (overlay) overlay.remove();

  const gateScreen = document.getElementById('train-gate-screen');
  if (gateScreen) gateScreen.style.display = 'none';

  const invScreen = document.getElementById('train-invitation-screen');
  if (invScreen) { invScreen.style.display = 'none'; invScreen.style.opacity = '1'; }

  document.getElementById('train-screen').style.display = 'flex';

  trainState.questionsAsked    = { elliot: [], marcus: [], 'todd': [] };
  trainState.activeChar        = null;
  trainState.accusationMade    = false;
  trainState.correctAccusation = false;

  _renderCar('compartment');
}

// ── END TRAIN ──────────────────────────────────────────────
function _endTrainSequence() {
  NocturneEngine.emit('trainSceneChanged', {});
  NocturneEngine.emit('trainSequenceEnded', {});
  document.getElementById('train-screen').style.display            = 'none';
  document.getElementById('train-invitation-screen').style.display = 'none';
  document.getElementById('train-accusation-screen').style.display = 'none';

  _setGameChromeVisible(true);

  // Investigation begins at foyer — start reset timer from here
  gameState.verdictTracker.session_start = Date.now();
  gameState.verdictTracker.session_number = (gameState.verdictTracker.session_number || 0) + 1;

  navigateTo('foyer');
  if (typeof renderCurrentRoom    === 'function') renderCurrentRoom();
  if (typeof renderRoomNav        === 'function') renderRoomNav();
  if (typeof updateInventoryCounter === 'function') updateInventoryCounter();

  saveGame();
}

// ── HELPERS ────────────────────────────────────────────────
function _setGameChromeVisible(visible) {
  const topBar  = document.getElementById('top-bar');
  const roomNav = document.getElementById('room-nav');
  if (topBar)  topBar.style.display  = visible ? '' : 'none';
  if (roomNav) roomNav.style.display = visible ? '' : 'none';
}

function _esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── SCENE CHANGE — kill audio on every transition ──────────
NocturneEngine.on('trainSceneChanged', () => {
  if (typeof stopTrainVoice === 'function') stopTrainVoice();
  // Remove speaking class from all cards immediately
  document.querySelectorAll('.train-npc-card').forEach(c => c.classList.remove('speaking'));
});

// ── EXPOSE ─────────────────────────────────────────────────
window.startTrainSequence = startTrainSequence;
window.trainBeginAgain    = trainBeginAgain;
window.TRAIN_CHARS        = TRAIN_CHARS;
window.TRAIN_ACCUSATION   = TRAIN_ACCUSATION;
// visitRoom intentionally not re-exported — engine.js owns it
