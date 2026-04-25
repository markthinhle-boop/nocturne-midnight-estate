// ============================================================
// NOCTURNE — prologue.js
// Free-tier pre-murder mingle. 7:00–7:15PM (narrative).
// Foyer arrival → mingle → Rowe in billiard-room → cinematic →
// post-murder ballroom → Hale interrogation → paywall.
//
// ARCHITECTURE: prologue patches the existing CHARACTERS data
// store with prologue intros + Tier 1 dialogue, sets is_compact
// to bypass the technique selector, and routes through the same
// openConversation() pipeline used post-paywall. Same UI, same
// portrait, same notepad/board/map. Only the dialogue content
// differs. On paywall success, originals are restored.
//
// Paid: drop into foyer, post-paywall engine takes over.
// Declined: bounce to train-screen, infinite loop.
// KB v10-final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── STATE ──────────────────────────────────────────────────
window.PROLOGUE_STATE = {
  active:                false,
  phase:                 'mingle',
  rowe_duel_done:        false,
  cinematic_armed:       false,
  cinematic_played:      false,
  hale_dialogue_opened:  false,
  hale_dialogue_closed:  false,
  patches_applied:       false,
  _originals:            {},
};

// ── ROOM ACCESS ────────────────────────────────────────────
const PROLOGUE_FREE_ROOMS = [
  'foyer','gallery','study','terrace','maids-quarters','groundskeeper-cottage',
  'map-room','dining-room','trophy-room','billiard-room','weapons-room','conservatory'
];

// ── PROLOGUE NPC ROOMS ─────────────────────────────────────
window.PROLOGUE_NPC_POSITIONS = {
  'foyer':                  ['curator'],
  'gallery':                ['steward','crane'],
  'study':                  [],
  'terrace':                ['baron'],
  'maids-quarters':         ['vivienne'],
  'groundskeeper-cottage':  ['hatch'],
  'map-room':               ['surgeon'],
  'dining-room':            ['greaves'],
  'trophy-room':            ['pemberton-hale'],
  'billiard-room':          ['rowe'],
  'weapons-room':           ['northcott'],
  'conservatory':           ['ashworth'],
};

// ── TIER 1 DIALOGUE PATCHES ─────────────────────────────────
// Each entry replaces the character's dialogue/intro/room for the
// prologue. Schema matches CHARACTERS schema so existing renderQuestions
// and askQuestion work as-is. No gates on these questions.
// Rowe is NOT patched — his existing engine (intro→FUNNEL→duel) handles him.
const PROLOGUE_PATCHES = {

  'curator': {
    room: 'foyer',
    intro: 'He is in the Foyer when you enter, unmasked, hands clasped behind his back. He inclines his head a fraction — the precise fraction owed to a guest of the house. He has been waiting for you.',
    dialogue: {
      'Q1': { question: 'You were expecting me.',          type: 'choice', response: '"The Estate was. I am one of the Estate\'s instruments tonight. Lord Ashworth thought it appropriate that you be received by someone whose role this evening is largely ceremonial. The ceremony precedes the Rite. The Rite begins at eight."' },
      'Q2': { question: 'What should I do until then?',     type: 'choice', response: '"Anything that is not the Ballroom. The Ballroom is closed until the assembly convenes. The grounds are open. The guests are masked. You are not. That is intentional. It is the only courtesy the Estate offers a first-time visitor before the Rite."' },
      'Q3': { question: 'What kind of man is Lord Ashworth?', type: 'choice', response: '"Lord Ashworth has run this Estate for forty years. He keeps records that most institutions would prefer did not exist. Tonight he will open the Black Register during the Rite. The Register has not been opened in public in living memory. That should tell you what kind of evening this is."' },
      'Q4': { question: 'Anything else I should know?',     type: 'choice', response: '"The Rite at eight. The Ballroom at eight. Until then — the manor is yours, within the limits I have already described. Welcome to the Estate, Mr. Grey."' },
    },
  },

  'northcott': {
    room: 'weapons-room',
    intro: 'A young man in the armory, in front of the mounted sabres, hands behind his back. He is not masked — he is staff-rank tonight, or close enough to it. A leather-bound notebook is tucked under his arm.',
    dialogue: {
      'Q1': { question: 'Admiring the swords?',           type: 'choice', response: '"I am being told something by them. I have not yet decided what. Lord Ashworth asked me to be on the grounds tonight and to keep a notebook. He did not say I had to be in any particular room. I find the room that has decorative weapons usefully clarifies what one is doing here."' },
      'Q2': { question: 'What\'s the notebook for?',       type: 'choice', response: '"Arrivals. Lord Ashworth gave it to me six weeks ago. He said: write everyone down, write the time exact, circle anything that seems wrong. I have been wondering what wrong looks like ever since. I will be in the Foyer once the assembly draws closer. Until then I am here."' },
      'Q3': { question: 'What\'s Lord Ashworth like?',     type: 'choice', response: '"Precise. He speaks the way people write contracts. Every word means what it means and not more. Six weeks ago he told me to keep the notebook. He did not tell me why. I have learned that when Ashworth does not tell you something, it is because you will understand it when the time comes."' },
    },
  },

  'steward': {
    room: 'gallery',
    intro: 'A man in the Portrait Gallery, masked, adjusting a candle that does not need adjusting. He turns when you enter — slowly, as a man who has been listening to the floorboards.',
    dialogue: {
      'Q1': { question: 'Quiet evening so far.',           type: 'choice', response: '"It will not stay quiet. The Rite is at eight. They are all here already, most of them. They are waiting to be looked at. They have been waiting six weeks."' },
      'Q2': { question: 'You know the Estate well?',       type: 'choice', response: '"Long enough. I have been here a number of years. I do not count them."' },
      'Q3': { question: 'What kind of man is Lord Ashworth?', type: 'choice', response: '"Lord Ashworth runs the Estate the way estates are run. He keeps records. He makes decisions. Tonight he will open the Black Register at the Rite. I am told it will be memorable. I do not ask what that means."' },
      'Q4': { question: 'Have a good evening.',            type: 'choice', response: '"I will have the evening I am given. Good evening."' },
    },
  },

  'baron': {
    room: 'terrace',
    intro: 'A man on the terrace, his back to the door, smoking. The mask is a heavy carnival piece — feathered, expensive, of a kind that draws attention by trying not to.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Is it." Not a question. He does not turn. "It is an evening. I will reserve judgment until I have seen more of it."' },
      'Q2': { question: 'You don\'t enjoy these things.',  type: 'choice', response: '"I enjoy things that do not require me to wear a face I did not select." A short exhale. "The Rite is at eight. Until then I am declining to participate in the smaller rite of pretending to enjoy the larger one."' },
      'Q3': { question: 'What should I know about Lord Ashworth?', type: 'choice', response: '"Ashworth is meticulous. He has been preparing for tonight\'s Rite for six years. When a man spends six years preparing to say something in public, it is usually because what he intends to say is either very true or very dangerous." A pause. "In Ashworth\'s case it is both."' },
    },
  },

  'ashworth': {
    room: 'conservatory',
    intro: 'A woman in the conservatory, masked. She is holding a letter. She does not appear to be reading it. She does not put it down.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Good evening." She folds the letter once. "The assembly is gathering. The Rite begins at eight."' },
      'Q2': { question: 'Are you waiting for someone?',    type: 'choice', response: '"I am waiting for the Rite." A pause. "I have been waiting for some time."' },
      'Q3': { question: 'Enjoying the party?',             type: 'choice', response: 'A small pause. "I do not attend these things for enjoyment." She looks at the glass panels. "I attend them because they are meant to be attended."' },
    },
  },

  'crane': {
    room: 'gallery',
    intro: 'A woman in the Gallery, masked, examining one of the portraits with focused attention.',
    dialogue: {
      'Q1': { question: 'A friend of yours?',              type: 'choice', response: '"None of these are. I am examining the brushwork. The painters of two centuries ago worked with unusual precision."' },
      'Q2': { question: 'You attend the Rite often?',      type: 'choice', response: '"I attend in a professional capacity. Lord Ashworth is meticulous. The Society is generally well-managed."' },
      'Q3': { question: 'See you at the Rite.',            type: 'choice', response: 'A small nod. "Eight o\'clock. The portraits will still be here afterward."' },
    },
  },

  'vivienne': {
    room: 'maids-quarters',
    intro: 'A woman at the back of the Estate, smoothing her apron. She does not stop when you enter. She does not bow.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Bonsoir." A glance, then back to the apron. "You are the one Lord Ashworth has been waiting for."' },
      'Q2': { question: 'He told you about me?',           type: 'choice', response: '"He told no one. The house tells. I have been here some years. The house is generous with what it tells me. Other houses are not so generous. I prefer this one."' },
      'Q3': { question: 'I\'ll let you work.',              type: 'choice', response: '"Merci. Eight o\'clock the Rite. After eight o\'clock — the house will tell more. It always does."' },
    },
  },

  'hatch': {
    room: 'groundskeeper-cottage',
    intro: 'A man at the door of a cottage. Tools on the wall behind him. He was expecting someone — possibly not you, but someone.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: 'He nods. "Mr. Grey. Lord Ashworth said a man named Grey would arrive on the train tonight. He did not say much else. He is sparing with what he says."' },
      'Q2': { question: 'Have you seen anything unusual?', type: 'choice', response: '"Not yet. I am keeping watch. Lord Ashworth asked me to. He did not say what for. He said I would know it when I saw it. I have not yet seen it."' },
      'Q3': { question: 'I\'ll come back if I need anything.', type: 'choice', response: '"You will know where to find me. The cottage is open tonight. It is open most nights, but tonight it is open with intention."' },
    },
  },

  'surgeon': {
    room: 'map-room',
    intro: 'A man in the Map Room, masked, examining a chart pinned open on the desk. He looks up at the right moment — the precise moment — when you enter.',
    dialogue: {
      'Q1': { question: 'Studying maps?',                  type: 'choice', response: '"A habit. I find geography clarifies certain questions. Forgive the abstraction."' },
      'Q2': { question: 'You\'re a member?',               type: 'choice', response: '"Affiliated. I attend out of courtesy and the chance to see colleagues I do not see often."' },
      'Q3': { question: 'Until eight, then.',              type: 'choice', response: '"Until eight. Enjoy the evening. The maps will be here when you return — should you return."' },
    },
  },

  'greaves': {
    room: 'dining-room',
    intro: 'A man at the long dining table, alone, masked. A drink, a book, and a chair pulled out as though he has been considering whether to sit at it for some time.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Mr. Grey. The Estate said you would arrive tonight. I am pleased the train was on time. Trains in this part of the country are not reliably so."' },
      'Q2': { question: 'You\'re not at the Rite yet?',    type: 'choice', response: '"I do not gather before the gathering. I find pre-Rite mingling unproductive. I will be elsewhere until the assembly is called. The Estate knows where to find me."' },
      'Q3': { question: 'See you at eight.',               type: 'choice', response: '"Eight o\'clock. Good evening."' },
    },
  },

  'pemberton-hale': {
    room: 'trophy-room',
    intro: 'A masked man in the Trophy Room, examining a glass case with his back to the door. He turns slowly, in the manner of someone who heard you coming long before you arrived.',
    dialogue: {
      'Q1': { question: 'Quiet in here.',                  type: 'choice', response: '"It is. The Trophy Room is quiet because the trophies are the most honest people in the Estate. They were what they were and are no longer pretending to be otherwise."' },
      'Q2': { question: 'You\'re a member of the Society?', type: 'choice', response: '"I am. There are ranks within the Society. The Society notices the differences. I have noticed that the Society notices."' },
      'Q3': { question: 'Until the Rite.',                 type: 'choice', response: '"Until the Rite. Eight o\'clock. I will be nearby from quarter to. I have my reasons. They are my own."' },
    },
  },
};

// ── PATCH APPLICATION ──────────────────────────────────────
function _applyPatches() {
  if (PROLOGUE_STATE.patches_applied) return;
  if (!window.CHARACTERS) {
    console.warn('[prologue] CHARACTERS not loaded yet');
    return;
  }
  Object.entries(PROLOGUE_PATCHES).forEach(([charId, patch]) => {
    const c = window.CHARACTERS[charId];
    if (!c) {
      console.warn('[prologue] No CHARACTERS entry for', charId);
      return;
    }
    PROLOGUE_STATE._originals[charId] = {
      dialogue:         c.dialogue,
      intro:            c.intro,
      room:             c.room,
      is_compact:       c.is_compact,
      surface_dialogue: c.surface_dialogue,
      surface_gate:     c.surface_gate,
      dialogue_limit:   c.dialogue_limit,
      snap_count:       c.snap_count,
      snap_limit:       c.snap_limit,
      composure:        c.composure,
      composure_state:  c.composure_state,
      deceptions:       c.deceptions,
    };
    c.dialogue         = patch.dialogue;
    c.intro            = patch.intro;
    c.room             = patch.room;
    c.is_compact       = true;
    c.surface_dialogue = undefined;
    c.surface_gate     = undefined;
    c.dialogue_limit   = 99;
    c.snap_limit       = 0;
    c.snap_count       = 0;
    c.composure        = 100;
    c.composure_state  = 'normal';
    c.deceptions       = undefined;
    if (gameState.char_dialogue_complete) {
      gameState.char_dialogue_complete[charId] = {};
    }
  });
  PROLOGUE_STATE.patches_applied = true;
}

function _restorePatches() {
  if (!PROLOGUE_STATE.patches_applied) return;
  Object.entries(PROLOGUE_STATE._originals).forEach(([charId, orig]) => {
    const c = window.CHARACTERS[charId];
    if (!c) return;
    c.dialogue         = orig.dialogue;
    c.intro            = orig.intro;
    c.room             = orig.room;
    c.is_compact       = orig.is_compact;
    c.surface_dialogue = orig.surface_dialogue;
    c.surface_gate     = orig.surface_gate;
    c.dialogue_limit   = orig.dialogue_limit;
    c.snap_count       = orig.snap_count;
    c.snap_limit       = orig.snap_limit;
    c.composure        = orig.composure;
    c.composure_state  = orig.composure_state;
    c.deceptions       = orig.deceptions;
    if (gameState.char_dialogue_complete) {
      gameState.char_dialogue_complete[charId] = {};
    }
  });
  PROLOGUE_STATE._originals = {};
  PROLOGUE_STATE.patches_applied = false;
}

// ── ACCESS GATE (called from engine.navigateTo) ────────────
window.isPrologueRoomAccessible = function(roomId) {
  if (!PROLOGUE_STATE.active) return true;

  if (PROLOGUE_STATE.phase === 'mingle' || PROLOGUE_STATE.phase === 'awaiting_cinematic') {
    return PROLOGUE_FREE_ROOMS.includes(roomId);
  }

  if (PROLOGUE_STATE.phase === 'post_murder' || PROLOGUE_STATE.phase === 'awaiting_paywall') {
    if (roomId === 'ballroom' || roomId === 'antechamber') return true;
    if (PROLOGUE_FREE_ROOMS.includes(roomId)) return true;
    return false;
  }

  return true;
};

// ── ENTRY POINT ────────────────────────────────────────────
window.startPrologue = function() {
  PROLOGUE_STATE.active            = true;
  PROLOGUE_STATE.phase             = 'mingle';
  PROLOGUE_STATE.rowe_duel_done    = false;
  PROLOGUE_STATE.cinematic_armed   = false;
  PROLOGUE_STATE.cinematic_played  = false;
  PROLOGUE_STATE.hale_dialogue_opened = false;
  PROLOGUE_STATE.hale_dialogue_closed = false;
  gameState.prologueActive         = true;

  // Hide board UI during prologue — board is post-paywall only
  // 1. Hide board HUD icon (next to notepad icon)
  setTimeout(() => {
    const hudIcon = document.getElementById('board-hud-icon');
    if (hudIcon) hudIcon.style.display = 'none';
  }, 100);
  // 2. Hide board button inside notepad (runs when notepad opens)
  setTimeout(() => {
    const npBtn = document.getElementById('np-board-btn');
    if (npBtn) npBtn.style.display = 'none';
  }, 100);

  // Clear stale progress from any prior save state — prologue is always fresh.
  // _applyPatches will further wipe per-character dialogue history for patched chars.
  gameState.char_dialogue_complete = {};
  gameState.examined_objects       = [];
  gameState.inventory              = [];
  gameState.fired_chains           = [];
  gameState.node_inventory         = {};
  gameState.dropped_items          = {};
  gameState.object_taps            = {};
  gameState.item_taps              = {};
  gameState.hotspots_pulsed        = {};
  gameState.essential_left         = {};
  gameState.puzzles_solved         = [];
  gameState.puzzle_states          = {};
  gameState.characters             = {};
  gameState.deceptions_remaining   = 3;
  gameState.investigation_closed   = false;
  gameState.last_talked_to         = null;

  _applyPatches();
  if (typeof window.rebuildCharCards === 'function') {
    window.rebuildCharCards();
  }

  if (typeof navigateTo === 'function') {
    navigateTo('foyer');
  }
  if (typeof saveGame === 'function') saveGame();
};

// ── HALE PAYWALL TRIGGER ───────────────────────────────────
// Paywall fires when player leaves the antechamber post-cinematic.
// They can talk to Hale freely, close his dialogue, walk around,
// re-open him — paywall doesn't fire until they actually exit the room.
NocturneEngine.on('roomLeft', function(payload) {
  if (!PROLOGUE_STATE.active) return;
  if (PROLOGUE_STATE.phase !== 'post_murder' && PROLOGUE_STATE.phase !== 'awaiting_paywall') return;
  if (!payload || payload.roomId !== 'antechamber') return;
  // Only fire if player has actually entered Hale's dialogue at least once
  const haleAnswered = (gameState.char_dialogue_complete || {})['pemberton-hale'];
  const hasTalkedToHale = haleAnswered && Object.keys(haleAnswered).length > 0;
  if (!hasTalkedToHale) return;
  if (PROLOGUE_STATE.hale_dialogue_closed) return;
  PROLOGUE_STATE.hale_dialogue_closed = true;
  PROLOGUE_STATE.phase = 'awaiting_paywall';
  setTimeout(_firePaywall, 600);
});

// ── ROWE DUEL COMPLETION → ARM CINEMATIC ───────────────────
NocturneEngine.on('roweDuelComplete', function() {
  if (!PROLOGUE_STATE.active) return;
  if (PROLOGUE_STATE.phase !== 'mingle') return;
  PROLOGUE_STATE.rowe_duel_done   = true;
  PROLOGUE_STATE.cinematic_armed  = true;
  PROLOGUE_STATE.phase            = 'awaiting_cinematic';
});

// ── ROOM TRANSITION → FIRE CINEMATIC IF ARMED ──────────────
NocturneEngine.on('roomEntered', function(payload) {
  if (!PROLOGUE_STATE.active) return;
  if (!PROLOGUE_STATE.cinematic_armed) return;
  if (PROLOGUE_STATE.cinematic_played) return;
  if (PROLOGUE_STATE.phase !== 'awaiting_cinematic') return;

  PROLOGUE_STATE.cinematic_armed = false;
  PROLOGUE_STATE.phase           = 'cinematic';
  setTimeout(_playMurderCinematic, 200);
});

// ── CINEMATIC (TEXT PLACEHOLDER) ───────────────────────────
function _playMurderCinematic() {
  PROLOGUE_STATE.cinematic_played = true;

  let overlay = document.getElementById('prologue-cinematic');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'prologue-cinematic';
  overlay.style.cssText = [
    'position:fixed','top:0','left:0','right:0','bottom:0',
    'background:#000','z-index:99999',
    'display:flex','align-items:center','justify-content:center',
    'flex-direction:column','padding:40px','text-align:center',
    'opacity:0','transition:opacity 1.2s ease',
    'color:#d4c5a0','font-family:Georgia,serif',
  ].join(';');

  const time = document.createElement('div');
  time.style.cssText = 'font-size:14px;letter-spacing:0.4em;color:#8a7a5c;margin-bottom:32px;text-transform:uppercase;';
  time.textContent = '— 8:01 PM —';
  overlay.appendChild(time);

  const line1 = document.createElement('div');
  line1.style.cssText = 'font-size:18px;line-height:1.8;max-width:560px;margin-bottom:24px;font-style:italic;';
  line1.textContent = '[ Placeholder — murder scene at the Ballroom. ]';
  overlay.appendChild(line1);

  const line2 = document.createElement('div');
  line2.style.cssText = 'font-size:15px;line-height:1.7;max-width:560px;color:#a89878;';
  line2.textContent = 'The Rite was supposed to begin at eight. Something else began first.';
  overlay.appendChild(line2);

  const line3 = document.createElement('div');
  line3.style.cssText = 'margin-top:48px;font-size:11px;letter-spacing:0.3em;color:#6a5d44;text-transform:uppercase;';
  line3.textContent = 'Tap to continue';
  overlay.appendChild(line3);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  let advanced = false;
  const advance = function() {
    if (advanced) return;
    advanced = true;
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      _onCinematicComplete();
    }, 1200);
  };
  overlay.addEventListener('click', advance);
  setTimeout(advance, 8000);
}

function _onCinematicComplete() {
  PROLOGUE_STATE.phase = 'post_murder';
  // Restore originals NOW so post-murder ballroom + Hale show real interrogation content.
  // The paywall is the gate, not the dialogue change. Hale's full post-paywall interrogation
  // is the FIRST taste of the real game. Then paywall when player leaves the antechamber.
  _restorePatches();
  // Reposition NPCs to post-paywall positions (Hale → antechamber, Curator → archive-path, etc.)
  if (typeof window.rebuildCharCards === 'function') {
    window.rebuildCharCards();
  }
  if (typeof navigateTo === 'function') navigateTo('ballroom');
  if (typeof saveGame === 'function') saveGame();
}

// ── PAYWALL TRIGGER ────────────────────────────────────────
function _firePaywall() {
  const reflection = document.getElementById('paywall-curator-text');
  if (reflection) {
    reflection.textContent =
      'You have seen the body. You have heard the man in the Antechamber. You have noticed what he wanted you to notice and you have noticed one or two things he did not. The investigation does not end here. It begins here. The Estate has set a price for the truth.';
  }
  if (typeof openPaywall === 'function') openPaywall();
}

// ── PAYWALL OUTCOMES ───────────────────────────────────────
window.onProloguePaywallSuccess = function() {
  PROLOGUE_STATE.active   = false;
  PROLOGUE_STATE.phase    = 'complete';
  gameState.prologueActive = false;
  
  // Restore board UI post-paywall
  setTimeout(() => {
    const hudIcon = document.getElementById('board-hud-icon');
    if (hudIcon) hudIcon.style.display = 'flex';
    const npBtn = document.getElementById('np-board-btn');
    if (npBtn) npBtn.style.display = 'block';
  }, 100);
  
  _restorePatches();
  if (typeof window.rebuildCharCards === 'function') {
    window.rebuildCharCards();
  }
  if (typeof navigateTo === 'function') navigateTo('foyer');
  if (typeof saveGame === 'function') saveGame();
};

window.onProloguePaywallDecline = function() {
  _restorePatches();
  PROLOGUE_STATE.active = false;
  PROLOGUE_STATE.phase  = 'mingle';
  PROLOGUE_STATE.rowe_duel_done   = false;
  PROLOGUE_STATE.cinematic_armed  = false;
  PROLOGUE_STATE.cinematic_played = false;
  PROLOGUE_STATE.hale_dialogue_opened = false;
  PROLOGUE_STATE.hale_dialogue_closed = false;
  gameState.prologueActive = false;

  const gameScreen = document.getElementById('screen-game');
  if (gameScreen) gameScreen.classList.remove('active');
  if (typeof startTrainSequence === 'function') {
    startTrainSequence();
  }
};

// ── INIT ───────────────────────────────────────────────────
window.initPrologue = function() {};

// Compatibility stub — old code path; route to real openConversation
window.openPrologueDialogue = function(charId) {
  if (typeof window.openConversation === 'function') {
    window.openConversation(charId);
  }
};
