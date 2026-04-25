// ============================================================
// NOCTURNE — prologue.js
// Free-tier pre-murder mingle. 7:00–7:15PM (narrative).
// Foyer arrival → mingle → Rowe in billiard-room → cinematic →
// post-murder ballroom → Hale interrogation → paywall.
// Paid: drop into foyer, post-paywall engine takes over.
// Declined: bounce to train-screen, infinite loop.
// KB v10-final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── STATE ──────────────────────────────────────────────────
window.PROLOGUE_STATE = {
  active:                false, // true once startPrologue fires
  phase:                 'mingle', // 'mingle' | 'awaiting_cinematic' | 'cinematic' | 'post_murder' | 'awaiting_paywall' | 'complete'
  rowe_duel_done:        false,
  cinematic_armed:       false, // armed after rowe duel; fires on next room transition
  cinematic_played:      false,
  hale_dialogue_opened:  false,
  hale_dialogue_closed:  false,
  npc_dialogue_complete: {},    // { charId: { Q1: true, Q2: true, ... } }
};

// ── ROOM ACCESS ────────────────────────────────────────────
const PROLOGUE_FREE_ROOMS = [
  'foyer','gallery','study','terrace','maids-quarters','groundskeeper-cottage',
  'map-room','dining-room','trophy-room','billiard-room','weapons-room','conservatory'
];

const PROLOGUE_LOCKED_ROOMS = [
  'ballroom','balcony','stage','antechamber',
  'library','physicians','smoking','archive-path','vault','wine-cellar'
];

// ── NPC PLACEMENT (PROLOGUE ONLY) ──────────────────────────
// Curator → foyer (greeter). Rowe → billiard-room (the duel).
// Surgeon → map-room (per Mark's call — reason TBD later).
// Voss is a SEPARATE character from the Surgeon. Voss is NOT placed in prologue.
// Lord Ashworth is alive and masked at the party (he is killed during the cinematic).
// Lady Ashworth is masked among the guests — only Rowe is unmasked.
window.PROLOGUE_NPC_POSITIONS = {
  'foyer':                  ['curator'],
  'gallery':                ['steward','crane'],
  'study':                  ['ashworth'],
  'terrace':                ['lady-ashworth','baron'],
  'maids-quarters':         ['vivienne'],
  'groundskeeper-cottage':  ['hatch'],
  'map-room':               ['surgeon'],
  'dining-room':            ['greaves'],
  'trophy-room':            ['pemberton-hale'],
  'billiard-room':          ['rowe'],
  'weapons-room':           ['northcott'],
  'conservatory':           [],
};

// ── TIER 1 DIALOGUE TREES ──────────────────────────────────
// 3–4 questions per NPC. Pre-murder small talk. No interrogation content.
// Lord Ashworth is alive — these are pleasantries before the Rite.
// Every reply is short, in-character, and contains zero spoilers about
// the plot or who killed whom.
const PROLOGUE_DIALOGUE = {
  'curator': {
    name: 'The Curator',
    intro: 'He is waiting in the Foyer. He inclines his head a fraction when you enter — the precise fraction owed to a guest of the house.',
    questions: {
      Q1: { q: 'You were expecting me.', a: '"The Estate was. I am one of the Estate\'s instruments tonight. Lord Ashworth thought it appropriate that you be received by someone whose role tonight is largely ceremonial. The ceremony precedes the Rite. The Rite begins at eight."' },
      Q2: { q: 'What should I do until then?',     a: '"Anything that is not the Ballroom. The Ballroom is closed until the assembly convenes. The grounds are open. The guests are masked. You are not. That is intentional. It is the only courtesy the Estate offers a first-time visitor before the Rite."' },
      Q3: { q: 'Who am I looking for, exactly?',   a: '"You are looking for nothing. You are being looked at by everyone. Mr. Rowe is in the Billiard Room. Of the guests tonight he is the only one who is not masked. The Estate makes one such exception per Rite. Lord Ashworth thought you should know that the exception, this evening, is Mr. Rowe."' },
      Q4: { q: 'Anything else I should know?',     a: '"The Rite at eight. The Ballroom at eight. Until then — the manor is yours, within the limits I have already described. Welcome to the Estate, Mr. Grey."' },
    },
  },

  'northcott': {
    name: 'Cavalier Northcott',
    intro: 'A young man in the armory, in front of the mounted sabres, hands behind his back. He is not masked — he is staff-rank tonight, or close enough to it. A leather-bound notebook is tucked under his arm.',
    questions: {
      Q1: { q: 'Admiring the swords?',         a: '"I am being told something by them. I have not yet decided what. Lord Ashworth asked me to be on the grounds tonight and to keep a notebook. He did not say I had to be in any particular room. I find the room that has decorative weapons usefully clarifies what one is doing here."' },
      Q2: { q: 'What\'s the notebook for?',    a: '"Arrivals. Lord Ashworth gave it to me six weeks ago. He said: write everyone down, write the time exact, circle anything that seems wrong. I have been wondering what wrong looks like ever since. I will be in the Foyer once the assembly draws closer. Until then I am here."' },
      Q3: { q: 'You\'re not a member?',        a: '"Not before tonight. Tonight I am being inducted in some fashion that has not been fully explained to me. I find this is consistent with most of my dealings with this Estate."' },
    },
  },

  'steward': {
    name: 'The Steward',
    intro: 'He is in the Portrait Gallery, adjusting a candle that does not need adjusting. He turns when you enter — slowly, as a man who has been listening to the floorboards.',
    questions: {
      Q1: { q: 'Quiet evening so far.',        a: '"It will not stay quiet. The Rite is at eight. They are all here already, most of them. They are waiting to be looked at. They have been waiting six weeks."' },
      Q2: { q: 'How long have you served here?', a: '"Long enough. Fourteen years. I do not count past that. There is no reason to."' },
      Q3: { q: 'You\'re polishing candles.',   a: 'A small smile that does not reach. "I do not polish candles. I check that they will burn evenly. The Estate notices small failures more readily than large ones. I have learned to be where the small failures begin."' },
      Q4: { q: 'Have a good evening.',         a: '"I will have the evening I am given. Good evening, Mr. Grey."' },
    },
  },

  'ashworth': {
    name: 'Lord Ashworth',
    intro: 'He is in his study. He is alive. He is masked — a heavy carved mask, formal, the Lord of the Rite. He turns the mask toward you and lifts it for a moment so you see him fully.',
    questions: {
      Q1: { q: 'Lord Ashworth.',                a: 'He nods. "Mr. Grey. Welcome. I will not detain you. I have one or two arrangements still to make before the Rite. We will speak properly afterward — I have set aside time for it."' },
      Q2: { q: 'Why am I here?',                a: 'He pauses with the mask half-lifted. Then lowers it back into place. "We will speak afterward. That is my preference and my answer. The Rite first."' },
      Q3: { q: 'You seem distracted.',          a: 'A long look through the mask. "I am where I expected to be. That is not the same thing as being unworried. Forgive me — the night requires attention I cannot give to conversation. Eight o\'clock, Mr. Grey."' },
    },
  },

  'lady-ashworth': {
    name: 'A masked figure on the terrace',
    intro: 'A figure on the terrace, alone, looking out at the garden. The mask is silver, simple, worn by someone who knows how to wear it. She does not turn when you approach.',
    questions: {
      Q1: { q: 'Cold out here.',               a: '"Yes." She does not look at you. "The garden is the only room of the Estate that does not pretend to be something else."' },
      Q2: { q: 'Are you a member?',            a: '"I am married to the Estate. That is a different category. The Society has a word for it. I do not use the word."' },
      Q3: { q: 'Will you be at the Rite?',     a: '"I will be where I am expected to be. I always am." A pause. "The Rite begins at eight. I will see you there, Mr. Grey."' },
    },
  },

  'baron': {
    name: 'A masked figure with a cigarette',
    intro: 'A man on the terrace, his back to the door, smoking. The mask is a heavy carnival piece — feathered, expensive, of a kind that draws attention by trying not to.',
    questions: {
      Q1: { q: 'Good evening.',                 a: '"Is it." Not a question. He does not turn. "It is an evening. I will reserve judgment until I have seen more of it."' },
      Q2: { q: 'You don\'t enjoy these things.', a: '"I enjoy things that do not require me to wear a face I did not select." A short exhale. "The Rite is at eight. Until then I am declining to participate in the smaller rite of pretending to enjoy the larger one."' },
      Q3: { q: 'Fair enough.',                  a: 'He raises the cigarette in a small salute without turning. "Fair enough. Good evening, Mr. Grey."' },
    },
  },

  'crane': {
    name: 'A masked physician',
    intro: 'A woman in the Gallery, in a plain mask of the kind issued to professional members rather than personal guests. She is examining one of the portraits with a clinical attentiveness.',
    questions: {
      Q1: { q: 'A friend of yours?',            a: '"None of these are. I am examining the brushwork. The physicians of two centuries ago painted unusually well. I find this is not coincidence."' },
      Q2: { q: 'You\'re a physician?',          a: '"I am. Estate-affiliated. I attend the Rite in a professional capacity. There is usually no need. Lord Ashworth is meticulous about health, and the Society is generally healthy."' },
      Q3: { q: 'See you at the Rite.',          a: 'A small nod. "Eight o\'clock, Mr. Grey. The portraits will still be here afterward."' },
    },
  },

  'vivienne': {
    name: 'Vivienne Leclair',
    intro: 'A maid at the back of the Estate, smoothing her apron at the door. She does not stop when you enter. She does not bow.',
    questions: {
      Q1: { q: 'Good evening.',                 a: '"Bonsoir." A glance, then back to the apron. "You are the one Lord Ashworth has been waiting for."' },
      Q2: { q: 'He told you about me?',         a: '"He told no one. The house tells. I have been here four years. The house is generous with what it tells me. Other houses are not so generous. I prefer this one."' },
      Q3: { q: 'I\'ll let you work.',           a: '"Merci. Eight o\'clock the Rite. After eight o\'clock — the house will tell more. It always does."' },
    },
  },

  'hatch': {
    name: 'Thomas Hatch',
    intro: 'An older man at the door of his cottage. Tools on the wall behind him. He was expecting someone — possibly not you, but someone.',
    questions: {
      Q1: { q: 'Mr. Hatch.',                    a: 'He nods. "Mr. Grey. Lord Ashworth said a man named Grey would arrive on the train tonight. He did not say much else. He is sparing with what he says, even to me, and I have been here thirty years."' },
      Q2: { q: 'Have you seen anything unusual?', a: '"Not yet. I am keeping watch. Lord Ashworth asked me to. He did not say what for. He said I would know it when I saw it. I have not yet seen it."' },
      Q3: { q: 'I\'ll come back if I need anything.', a: '"You will know where to find me. The cottage is open tonight. It is open most nights, but tonight it is open with intention."' },
    },
  },

  'surgeon': {
    name: 'A masked physician with maps',
    intro: 'A man in the Map Room, masked, examining a chart pinned open on the desk. He looks up at the right moment — the precise moment — when you enter.',
    questions: {
      Q1: { q: 'Studying maps?',                a: '"A professional habit. I find geography clarifies questions that medicine alone cannot answer. Forgive the abstraction. I am told I have a tendency toward it."' },
      Q2: { q: 'You\'re a member?',             a: '"I am affiliated. The Estate keeps me on retainer. Tonight is largely ceremonial — there is rarely call for a physician at a Rite. I attend out of courtesy and the chance to see colleagues I do not see often."' },
      Q3: { q: 'Until eight, then.',            a: '"Until eight. Enjoy the evening, Mr. Grey. The maps will be here when you return — should you return."' },
    },
  },

  'greaves': {
    name: 'Sir Greaves',
    intro: 'An older gentleman at the long dining table, alone, with a drink and a book and a chair pulled out as though he has been considering whether to sit at it for some time.',
    questions: {
      Q1: { q: 'Sir Greaves.',                  a: '"Mr. Grey. The Estate said you would arrive tonight. I am pleased the train was on time. Trains in this part of the country are not reliably so."' },
      Q2: { q: 'You\'re not at the Rite yet?',   a: '"I do not gather before the gathering. I find pre-Rite mingling unproductive. I will be in the Library until the assembly is called. I always am. The Estate knows where to find me."' },
      Q3: { q: 'See you at eight.',             a: '"Eight o\'clock. I will be where I am usually. Good evening."' },
    },
  },

  'pemberton-hale': {
    name: 'Viscount Pemberton-Hale',
    intro: 'A masked man in the Trophy Room, examining a glass case with his back to the door. He turns slowly, in the manner of someone who heard you coming long before you arrived.',
    questions: {
      Q1: { q: 'Quiet in here.',                a: '"It is. The Trophy Room is quiet because the trophies are the most honest people in the Estate. They were what they were and are no longer pretending to be otherwise."' },
      Q2: { q: 'You\'re a member of the Society?', a: '"I am a Viscount of the Society. There is a difference. The Society notices the difference. I have noticed that the Society notices."' },
      Q3: { q: 'Until the Rite.',               a: '"Until the Rite. Eight o\'clock. I will be in the Antechamber from quarter to. The Antechamber is where I prefer to be before formal occasions. I have my reasons. They are my own."' },
    },
  },
};

// ── ACCESS GATE (called from engine.navigateTo) ────────────
window.isPrologueRoomAccessible = function(roomId) {
  if (!PROLOGUE_STATE.active) return true;

  // Phase: mingle — only free rooms, ballroom/balcony/stage/antechamber/paid all locked
  if (PROLOGUE_STATE.phase === 'mingle' || PROLOGUE_STATE.phase === 'awaiting_cinematic') {
    return PROLOGUE_FREE_ROOMS.includes(roomId);
  }

  // Phase: post_murder — ballroom + antechamber unlocked, balcony/stage/paid still locked
  if (PROLOGUE_STATE.phase === 'post_murder' || PROLOGUE_STATE.phase === 'awaiting_paywall') {
    if (roomId === 'ballroom' || roomId === 'antechamber') return true;
    if (PROLOGUE_FREE_ROOMS.includes(roomId)) return true;
    return false; // balcony, stage, paid spine all locked until paywall clears
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
  PROLOGUE_STATE.npc_dialogue_complete = {};
  gameState.prologueActive         = true;

  // Drop player into foyer
  if (typeof navigateTo === 'function') {
    navigateTo('foyer');
  }
  if (typeof saveGame === 'function') saveGame();
};

// ── DIALOGUE PANEL (shallow, bypasses interrogation engine) ─
window.openPrologueDialogue = function(charId) {
  // Rowe is special — let his existing engine handle him (intro→FUNNEL→duel)
  if (charId === 'rowe') return;

  const data = PROLOGUE_DIALOGUE[charId];
  if (!data) return;

  // Build a minimal panel — uses the same conversation-panel element as the
  // post-paywall interrogation system, but with our own renderer.
  const panel = document.getElementById('conversation-panel');
  if (!panel) return;

  const answered = PROLOGUE_STATE.npc_dialogue_complete[charId] || {};

  // Ensure container exists
  let container = panel.querySelector('.prologue-dialogue-container');
  if (!container) {
    panel.innerHTML = '';
    container = document.createElement('div');
    container.className = 'prologue-dialogue-container';
    container.style.cssText = 'padding:20px;color:var(--cream);max-height:80vh;overflow-y:auto;';
    panel.appendChild(container);
  }

  function render() {
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'font-size:13px;color:var(--gold);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;';
    header.textContent = data.name;
    container.appendChild(header);

    // Intro
    const intro = document.createElement('div');
    intro.style.cssText = 'font-size:14px;color:var(--cream);line-height:1.6;margin-bottom:16px;font-style:italic;';
    intro.textContent = data.intro;
    container.appendChild(intro);

    // Question/answer log (already-answered)
    Object.keys(data.questions).forEach(qKey => {
      if (answered[qKey]) {
        const qaBlock = document.createElement('div');
        qaBlock.style.cssText = 'margin-bottom:14px;border-left:2px solid var(--gold-dim);padding-left:12px;';
        const qLine = document.createElement('div');
        qLine.style.cssText = 'font-size:12px;color:var(--cream-dim);margin-bottom:4px;';
        qLine.textContent = '— ' + data.questions[qKey].q;
        qaBlock.appendChild(qLine);
        const aLine = document.createElement('div');
        aLine.style.cssText = 'font-size:13px;color:var(--cream);line-height:1.5;';
        aLine.textContent = data.questions[qKey].a;
        qaBlock.appendChild(aLine);
        container.appendChild(qaBlock);
      }
    });

    // Available questions (buttons)
    const remaining = Object.keys(data.questions).filter(qKey => !answered[qKey]);
    if (remaining.length > 0) {
      const qList = document.createElement('div');
      qList.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:8px;';
      remaining.forEach(qKey => {
        const btn = document.createElement('button');
        btn.style.cssText = 'background:transparent;border:1px solid var(--gold-dim);color:var(--cream);padding:10px 14px;text-align:left;font-size:13px;cursor:pointer;font-family:inherit;';
        btn.textContent = data.questions[qKey].q;
        btn.onclick = function() {
          answered[qKey] = true;
          PROLOGUE_STATE.npc_dialogue_complete[charId] = answered;
          render();
        };
        qList.appendChild(btn);
      });
      container.appendChild(qList);
    }

    // Close button
    const closeRow = document.createElement('div');
    closeRow.style.cssText = 'margin-top:20px;text-align:center;';
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:transparent;border:1px solid var(--gold);color:var(--gold);padding:8px 24px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;font-family:inherit;';
    closeBtn.textContent = 'Step away';
    closeBtn.onclick = function() {
      panel.classList.remove('open');
      panel.innerHTML = '';
      // If this was Hale (pemberton-hale) AND we are post-murder, fire paywall
      if (charId === 'pemberton-hale'
          && (PROLOGUE_STATE.phase === 'post_murder' || PROLOGUE_STATE.phase === 'awaiting_paywall')
          && !PROLOGUE_STATE.hale_dialogue_closed) {
        PROLOGUE_STATE.hale_dialogue_closed = true;
        PROLOGUE_STATE.phase = 'awaiting_paywall';
        setTimeout(_firePaywall, 600);
      }
    };
    closeRow.appendChild(closeBtn);
    container.appendChild(closeRow);
  }

  // Mark Hale as having been opened in post-murder phase
  if (charId === 'pemberton-hale'
      && (PROLOGUE_STATE.phase === 'post_murder' || PROLOGUE_STATE.phase === 'awaiting_paywall')) {
    PROLOGUE_STATE.hale_dialogue_opened = true;
  }

  panel.classList.add('open');
  render();
};

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

  // Player just left billiard-room. Fire cinematic.
  PROLOGUE_STATE.cinematic_armed = false;
  PROLOGUE_STATE.phase           = 'cinematic';
  setTimeout(_playMurderCinematic, 200);
});

// ── CINEMATIC (TEXT PLACEHOLDER) ───────────────────────────
function _playMurderCinematic() {
  PROLOGUE_STATE.cinematic_played = true;

  // Build full-screen overlay
  let overlay = document.getElementById('prologue-cinematic');
  if (!overlay) {
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
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = '';

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

  // Fade in
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  // Tap or auto-advance
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
  setTimeout(advance, 8000); // auto-advance after 8s
}

function _onCinematicComplete() {
  PROLOGUE_STATE.phase = 'post_murder';

  // Force navigate to ballroom (which is now accessible via gate)
  if (typeof navigateTo === 'function') navigateTo('ballroom');
  if (typeof saveGame === 'function') saveGame();
}

// ── PAYWALL TRIGGER (after Hale dialogue closes) ───────────
function _firePaywall() {
  // Update curator reflection text for the post-Hale moment
  const reflection = document.getElementById('paywall-curator-text');
  if (reflection) {
    reflection.textContent =
      'You have seen the body. You have heard the man in the Antechamber. You have noticed what he wanted you to notice and you have noticed one or two things he did not. The investigation does not end here. It begins here. The Estate has set a price for the truth.';
  }
  if (typeof openPaywall === 'function') openPaywall();
}

// ── PAYWALL OUTCOMES ───────────────────────────────────────
// handlePurchase() and closePaywall() are overridden in ui.js to call
// the prologue handlers below when PROLOGUE_STATE.active is true.

window.onProloguePaywallSuccess = function() {
  PROLOGUE_STATE.active   = false;
  PROLOGUE_STATE.phase    = 'complete';
  gameState.prologueActive = false;
  // Drop player into foyer; existing post-paywall engine takes over
  if (typeof navigateTo === 'function') navigateTo('foyer');
  if (typeof saveGame === 'function') saveGame();
};

window.onProloguePaywallDecline = function() {
  // Bounce to train-screen, infinite loop until paid
  // Reset prologue state to fresh — they have to mingle again on return
  PROLOGUE_STATE.active = false;
  PROLOGUE_STATE.phase  = 'mingle';
  PROLOGUE_STATE.rowe_duel_done   = false;
  PROLOGUE_STATE.cinematic_armed  = false;
  PROLOGUE_STATE.cinematic_played = false;
  PROLOGUE_STATE.hale_dialogue_opened = false;
  PROLOGUE_STATE.hale_dialogue_closed = false;
  PROLOGUE_STATE.npc_dialogue_complete = {};
  gameState.prologueActive = false;

  // Hide game screen, show train, restart train sequence
  const gameScreen = document.getElementById('screen-game');
  if (gameScreen) gameScreen.classList.remove('active');
  if (typeof startTrainSequence === 'function') {
    startTrainSequence();
  }
};

// ── INIT (called by engine on game boot) ───────────────────
window.initPrologue = function() {
  // No-op — startPrologue is the actual entry called when train completes.
  // This exists so engine.js can probe for prologue presence.
};
