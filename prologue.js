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
  'gallery':                ['crane','greaves'],
  'study':                  ['baron'],
  'terrace':                ['vivienne','hatch'],
  'maids-quarters':         [],
  'groundskeeper-cottage':  [],
  'map-room':               ['surgeon'],
  'dining-room':            ['steward'],
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

  // ── THE CURATOR ─────────────────────────────────────────────────
  // Unmasked. Ceremonial. Dry. Carries the lore weight.
  'curator': {
    room: 'foyer',
    intro: 'He stands in the Foyer, unmasked, hands folded behind his back. The Estate has had a Curator for longer than most of its members have been alive, and he has the bearing of a man who is on familiar terms with that fact. He inclines his head a precise, ceremonial fraction as you cross the threshold.\n\n"Mr. Grey." He says it the way one notes a delivery has arrived on schedule. "The Estate was expecting you. Come in. You are six minutes early, which speaks rather well of you."',
    dialogue: {
      'Q1': { question: 'You were expecting me.',          type: 'choice', response: '"The Estate was. The Estate is generally expecting someone. Tonight it happens to be you." A small, dry pause. "Lord Ashworth thought it appropriate that a first-time visitor be received by someone whose duties this evening are largely ceremonial. I am the ceremonial part. The Rite is the rest. The Rite begins at eight. Until then I am, broadly speaking, decorative."' },
      'Q2': { question: 'What is the Rite, exactly?',      type: 'choice', response: '"A ceremony. Tonight, a particular ceremony." He pauses, choosing words. "Lord Ashworth will open the Black Register before the assembled membership. The Register has not been opened in public in living memory. Most of the people in this building tonight have been preparing for that fact for some time. A few of them have been preparing in ways the Register itself will eventually describe."' },
      'Q3': { question: 'What kind of man is Lord Ashworth?', type: 'choice', response: '"Meticulous. He has run this Estate for forty years and has, in that time, declined to misplace anything — a record, a name, a debt." Another pause. "He has been preparing for tonight for six years. When a man spends six years preparing to say a thing in public, what he intends to say is usually either very true or very dangerous. In Lord Ashworth\'s case it tends to be both. That is the work of the evening."' },
      'Q4': { question: 'Why am I not wearing a mask?',    type: 'choice', response: '"Because you are not yet a member. The mask is a courtesy the Estate extends to those it has reason to conceal. Tonight, the Estate has reason to conceal nearly everyone. You may take some comfort in being the exception, or you may not. Most people, in my experience, do not."' },
      'Q5': { question: 'Where should I go until eight?',  type: 'choice', response: '"Anywhere that is not the Ballroom. The Ballroom is closed until the assembly convenes. The grounds are open. The guests are masked, and they will not, as a rule, introduce themselves. Try not to read this as rudeness. Read it as architecture." A measured nod. "Welcome to the Estate, Mr. Grey."' },
    },
  },

  // ── NORTHCOTT (masked) ──────────────────────────────────────────
  // Earnest, precise, six weeks in. Notebook present, no role/title revealed.
  'northcott': {
    room: 'weapons-room',
    intro: 'A young masked figure stands before the mounted sabres with the upright posture of a man who has been told to be somewhere and has decided to be there exactly. A leather-bound notebook is tucked under one arm. He looks up sharply when you enter — caught between a polite nod and an outright salute, and committing fully to neither.',
    dialogue: {
      'Q1': { question: 'Admiring the swords?',           type: 'choice', response: '"They are decorative. None of them have an edge. I have checked." A small pause, as if catching himself. "Not for any reason. I am told it is appropriate to know the building one is asked to be in. I am — being thorough about it."' },
      'Q2': { question: 'What\'s the notebook for?',       type: 'choice', response: '"Notes." He says it, then appears to find this insufficient. "I have been asked to keep a record this evening. Times, mostly. I am to record anything that strikes me as wrong. I have spent the last six weeks attempting to determine what wrong looks like in advance and have made very little progress."' },
      'Q3': { question: 'You don\'t sound certain you should be here.', type: 'choice', response: '"I have been told I have the right temperament." He glances at the notebook. "I am still attempting to identify which temperament that was. The man who told me did not specify, and he is not the sort one asks twice."' },
      'Q4': { question: 'See you at the Rite.',            type: 'choice', response: '"Eight o\'clock. The Ballroom. I will be in the Foyer by then — that is part of the arrangement." A short, careful pause. "Please excuse the notebook. I am told it is conspicuous. I am told a great many things."' },
    },
  },

  // ── THE STEWARD (masked) ────────────────────────────────────────
  // Fourteen years. Sir. Hands behind back. The candelabra fraction.
  'steward': {
    room: 'dining-room',
    intro: 'A masked figure stands by the long table, adjusting a candelabra by a fraction so small it cannot be necessary. He turns when you enter — slowly, in the manner of a man who has heard you approach and has chosen the pace of his turn carefully.',
    dialogue: {
      'Q1': { question: 'Quiet so far.',                   type: 'choice', response: '"It will not remain so, sir. The assembly has nearly arrived. Most of them are already in the building. The remainder will be along shortly." He inclines his head a fraction. "After eight, the evening will arrange itself."' },
      'Q2': { question: 'You\'ve been here a long time.',  type: 'choice', response: '"Long enough, sir. The house has not required me to count." A pause that does not require him to elaborate. He does not elaborate.' },
      'Q3': { question: 'What\'s the Rite like?',          type: 'choice', response: '"A formal occasion, sir. Lord Ashworth will open the Black Register. It is the centerpiece of the evening." A measured pause. "I am told tonight\'s reading will be memorable. I am not in a position to know what is meant by that, and I have learned not to inquire."' },
      'Q4': { question: 'Have a good evening.',            type: 'choice', response: '"I will have the evening I am given, sir. Good evening." He returns to the candelabra. The fraction it required is still being attended to.' },
    },
  },

  // ── THE BARON (masked) ──────────────────────────────────────────
  // Bored. Cigar. Never first to speak. Knives Out wit.
  'baron': {
    room: 'study',
    intro: 'A masked figure stands by the fireplace with his back half-turned to the door. Cigar smoke trails in a thin blue line toward the ceiling, where it seems to be in no particular hurry. The mask is heavy — feathered, expensive, the kind that announces itself by trying not to. He does not turn when you enter.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Is it." Not a question. A small exhale of smoke. "I am withholding judgment until the evening produces evidence one way or the other. So far it has produced cigars and small talk, which is not, by my count, sufficient."' },
      'Q2': { question: 'Not enjoying yourself?',          type: 'choice', response: '"I have a personal objection to wearing a face I did not choose, in a room arranged by men I did not invite, on the schedule of a clock I do not own." A pause, dry. "Apart from that, the evening is going beautifully."' },
      'Q3': { question: 'What should I know about Lord Ashworth?', type: 'choice', response: '"Ashworth is meticulous. He has been preparing for tonight for six years. When a man spends six years preparing to say a thing in public, what he means to say is generally either very true or very dangerous." Another exhale. "Ashworth tends to manage both. It is one of his less endearing qualities."' },
      'Q4': { question: 'Looking forward to the Rite?',    type: 'choice', response: '"I am looking forward to its conclusion. The Rite begins at eight. Anything worth attending happens after the formal part is over and the Estate stops pretending it is doing anything other than precisely what it is doing." He does not turn. "Until then, I am here. Approximately."' },
    },
  },

  // ── LADY ASHWORTH (masked) ──────────────────────────────────────
  // Letter in hand. Past tense. Tired.
  'ashworth': {
    room: 'conservatory',
    intro: 'A masked woman stands among the glass and the trailing greenery, a folded letter held between gloved fingers. She is not reading it. She does not appear to have been reading it for some time. The conservatory lamps catch the edge of the paper without seeming to interest her.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Good evening." She folds the letter once, neatly, along a crease that has been folded a great many times before. "The assembly is gathering. I gather one is meant to gather with it."' },
      'Q2': { question: 'Are you waiting for someone?',    type: 'choice', response: '"I am waiting for eight o\'clock." A pause. "I have been waiting for some time. Eight o\'clock has been very stubborn about arriving."' },
      'Q3': { question: 'The Rite must be important to you.', type: 'choice', response: '"It is a Rite. They are all important. Tonight\'s is — particular." She looks toward the glass panels. "Some men prepare a speech. Others prepare a building, an audience, an evening. I am told there is a difference. I am still waiting to be persuaded by it."' },
      'Q4': { question: 'I\'ll leave you to it.',          type: 'choice', response: '"Thank you." She does not look up. "Eight o\'clock will be along. It always is, eventually."' },
    },
  },

  // ── CRANE (masked) ──────────────────────────────────────────────
  // Examining a portrait closely. Clinical curiosity. Sharp.
  'crane': {
    room: 'gallery',
    intro: 'A masked woman stands close to one of the portraits — closer than the gallery convention suggests, near enough that the lamp picks up a glint at her cuff. She is examining the brushwork with the focused, slightly impatient attention of a person accustomed to looking at things that cannot look back.',
    dialogue: {
      'Q1': { question: 'A friend of yours?',              type: 'choice', response: '"None of them are. I am examining the technique. The painters of two centuries ago worked with a precision that has since gone out of fashion, along with a great deal of other useful behaviour."' },
      'Q2': { question: 'You attend these often?',         type: 'choice', response: '"When my attendance serves a purpose. The Estate is generally well-managed. Lord Ashworth is meticulous. I find that comforting in the same way one finds a sharpened instrument comforting — the comfort comes from the precision, not from the instrument itself."' },
      'Q3': { question: 'What do you make of tonight?',    type: 'choice', response: '"I make very little of it yet. The Rite begins at eight. Until then I am examining a portrait. The portrait, fortunately, has no opinions about the evening. Several of the people behind me cannot say the same."' },
      'Q4': { question: 'See you at the Rite.',            type: 'choice', response: '"Eight o\'clock. The portraits will still be here afterward, which is more than can reliably be said for some of the company."' },
    },
  },

  // ── VIVIENNE (masked) ───────────────────────────────────────────
  // French. Sees everything. Plays at the moment.
  'vivienne': {
    room: 'terrace',
    intro: 'A masked woman stands at the terrace balustrade, half-turned away from the lamps, watching the dark of the gardens with an attention that does not match the casual angle of her shoulders. She does not turn when you arrive. She has heard you. She is choosing the moment.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Bonsoir." A small smile, audible if not visible behind the mask. "You are the one without a mask. That is interesting. The Estate is doing it on purpose. The Estate does most things on purpose, in my experience."' },
      'Q2': { question: 'You know the Estate well?',       type: 'choice', response: '"I know what the Estate tells me. The Estate is generous with what it tells, if one is patient and asks the right rooms. I have found this house to be a great deal more talkative than its owner."' },
      'Q3': { question: 'Why are you on the terrace?',     type: 'choice', response: '"The Foyer is full of men explaining the Rite to one another. The Drawing Room is full of women pretending not to listen. The terrace is full of nothing, which I prefer." A pause. "Also it is cooler. The masks are warm. No one mentions this. Everyone is too dignified."' },
      'Q4': { question: 'I\'ll let you enjoy it.',         type: 'choice', response: '"Merci. Eight o\'clock the Rite. After eight o\'clock — well. Houses tell more after eight o\'clock. They cannot help themselves."' },
    },
  },

  // ── HATCH (masked) ──────────────────────────────────────────────
  // Thirty years on the grounds. Notes the time. Old habit.
  'hatch': {
    room: 'terrace',
    intro: 'A masked man stands at the far end of the terrace, near the low wall that drops to the gardens. He is unhurried. He is not waiting for anyone in particular, but if someone were going to come along, this is the angle he would have chosen for it. A small set of tools rests on the stone beside him.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Mr. Grey." A small nod. "Lord Ashworth said a man named Grey would arrive on the seven o\'clock train. He did not say much else. He is sparing with what he says, particularly when he has spent six weeks deciding to say it."' },
      'Q2': { question: 'You\'re not in the assembly.',    type: 'choice', response: '"Not tonight. The grounds want attending to. The grounds always want attending to." A pause. "There are rooms in this house I am not required to be in. I tend to use that as guidance."' },
      'Q3': { question: 'What time is the Rite?',          type: 'choice', response: '"Eight o\'clock. Lord Ashworth will open the Black Register." Another small nod. "After that, the evening will go where the evening goes. I will be on the terrace. I will note the time of things. Old habit."' },
      'Q4': { question: 'Quiet evening so far.',           type: 'choice', response: '"It is. The quiet ones are the ones I remember most clearly afterward." He does not elaborate. He returns his attention to the gardens, where there is, at present, nothing in particular to attend to.' },
    },
  },

  // ── THE SURGEON (masked) ────────────────────────────────────────
  // Warm. Helpful. Too helpful. Already noticing the rooms.
  'surgeon': {
    room: 'map-room',
    intro: 'A masked figure leans over the map-room table, gloved fingers tracing a coastline that has been redrawn at least twice in the last century. He looks up the moment you enter, as if he has been mildly looking forward to the interruption. His attention is warm. That is the first thing one notices about him.',
    dialogue: {
      'Q1': { question: 'Planning a journey?',             type: 'choice', response: '"Studying an old one. These maps predate the modern borders by some distance. Whole countries have been politely renamed since this one was drafted." A small, precise smile, audible in the voice. "I find the changes instructive. People are very confident about borders until one shows them an older map."' },
      'Q2': { question: 'You collect maps?',               type: 'choice', response: '"I read them. Collecting implies one keeps them, and I do not, generally, keep things." He sets the magnifier down with the small care of someone who has handled more delicate instruments than this. "I have an interest in the spaces I am asked to be in. Lord Ashworth maintains a remarkable collection. One does not encounter this room twice in a lifetime."' },
      'Q3': { question: 'Have you been here before?',      type: 'choice', response: '"Tonight is my first formal evening at the Estate." A pause that does not feel like hesitation. "I walked the building when I arrived. I like to understand a house before I am asked to spend an evening in it. Old habit. The hands like to know where the doors are." He says it warmly. He says everything warmly.' },
      'Q4': { question: 'Looking forward to the Rite?',    type: 'choice', response: '"I am looking forward to it with what I would call professional interest." Another small smile. "Lord Ashworth has prepared something significant. I have been told it will be memorable. I prefer to arrive at memorable evenings already paying attention. It saves a great deal of effort later on."' },
    },
  },

  // ── GREAVES (masked) ────────────────────────────────────────────
  // Detached. Treats the evening as observed phenomenon. Dry.
  'greaves': {
    room: 'gallery',
    intro: 'A masked figure stands before a portrait of Lord Ashworth, head tilted at the small judicial angle of a man comparing the painted version against the original. He does not turn at your approach. He has, however, registered it — the line of his shoulders adjusts a fraction without acknowledgement.',
    dialogue: {
      'Q1': { question: 'A good likeness.',                type: 'choice', response: '"It was, fifteen years ago. The painter was competent. The subject has aged in the meantime, as subjects tend to. The painting has not, which gives it a small but persistent advantage in any direct comparison."' },
      'Q2': { question: 'You know him well?',              type: 'choice', response: '"Long enough to recognise the work, sufficient to attend the Rite, insufficient to be surprised by anything that happens in it." A small, observational pause. "Lord Ashworth has been preparing for tonight for six years. I have learned, in the course of an unremarkable life, to take six-year preparations seriously. Three years one might dismiss. Four is excessive. Six is a position."' },
      'Q3': { question: 'You don\'t sound entertained.',   type: 'choice', response: '"I am being entertained at precisely the level the evening is currently providing, which is to say, modestly. The Rite is at eight. Most of the interesting behaviour in this building waits until then to identify itself. Until it does, I am admiring a portrait. The portrait, mercifully, makes no demands."' },
      'Q4': { question: 'See you at eight.',               type: 'choice', response: '"The Ballroom. Eight o\'clock. I shall be there in the capacity of an attentive observer. It is the capacity I am best suited to. I have never been quite suited to anything else."' },
    },
  },

  // ── PEMBERTON-HALE (masked) ─────────────────────────────────────
  // Composed. Formal. Volunteers Routine without being asked.
  'pemberton-hale': {
    room: 'trophy-room',
    intro: 'A tall masked figure stands among the cases and mounted heads with the faintly bored attention of a man inventorying a room he already knows the contents of. His gloved hands are clasped behind his back. He turns at your approach with the smooth rotation of a man who has practised turning at approaches.',
    dialogue: {
      'Q1': { question: 'Quite a collection.',             type: 'choice', response: '"It is. None of it earned, of course. Lord Ashworth does not hunt. The pieces were acquired — most through estate sales, a few through the Society itself. They are decorative. The Estate is fond of decoration that communicates something." A precise pause. "Routine, by the standards of houses of this kind."' },
      'Q2': { question: 'What do they communicate?',       type: 'choice', response: '"Continuity. Means. The particular confidence of an institution that expects to outlast its current occupants by a margin." A small, formal half-smile, audible in the voice. "The Estate has been making this kind of statement for two centuries. It tends to make it well."' },
      'Q3': { question: 'You\'re here for the Rite, then.', type: 'choice', response: '"Everyone here is here for the Rite. Lord Ashworth will open the Black Register at eight o\'clock. The Register is the Estate\'s permanent record. Whatever is read into it tonight becomes — formally — part of the Estate." He chooses the formality of the phrase carefully. "It is, by the standards of the Society, a significant evening."' },
      'Q4': { question: 'You sound prepared.',             type: 'choice', response: '"I prefer to be prepared. The unprepared find these evenings rather longer than the prepared do. It is one of the small mercies of attending to one\'s affairs in advance."' },
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
