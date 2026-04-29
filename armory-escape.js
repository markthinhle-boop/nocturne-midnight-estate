/* ============================================================================
 * NOCTURNE: MIDNIGHT ESTATE — THE ARMOURY
 * Escape room. Single file. Transparent overlay on manor room image.
 *
 * OBJECTIVE: Callum is locked in. Find the key. Unjam the door lock
 *            with the dress sword. Escape.
 *
 * PUZZLE CHAIN:
 *   1. EXAMINE door       → locked + jammed mechanism noted
 *   2. EXAMINE swords     → plaques show names + years (out of order on rack)
 *   3. EXAMINE cabinet    → pinned note: "The order of acquisition is the order of the house"
 *   4. SEQUENCE           → tap 4 swords chronologically → hidden panel opens → KEY
 *   5. EXAMINE mantle     → faint diagram shows candle position
 *   6. CANDLE             → drag to brass stud 3 → shadow points to first charge
 *   7. EXAMINE coat arms  → "By precedence of founding" below shield
 *   8. COAT OF ARMS       → tap 3 charges in correct order → glass case unlocks
 *   9. CASE               → 3-stage open → dress sword + "The blade serves twice"
 *  10. DOOR               → use sword on jammed mechanism → use key → ESCAPE
 *
 * MODES:
 *   prologue  — Northcott present, dry wit, never gives answer, hints after 40s idle
 *   free      — Northcott absent, his notebook on the writing table
 *   paid      — Silent. No notebook. Same puzzles. No mercy.
 *
 * Mount: openArmory(scrollX) — transparent overlay, inherits room scroll
 * ============================================================================ */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* =========================================================================
   * HAPTICS — navigator.vibrate, graceful degradation
   * ======================================================================= */
  const HAP = {
    // Short tap — UI interaction
    tap:       () => { try { navigator.vibrate && navigator.vibrate(8); } catch(e){} },
    // Light — examine, pick up
    light:     () => { try { navigator.vibrate && navigator.vibrate(18); } catch(e){} },
    // Medium — wrong answer, panel click
    medium:    () => { try { navigator.vibrate && navigator.vibrate([20,10,20]); } catch(e){} },
    // Heavy — sequence complete, arms solved, lock mechanism
    heavy:     () => { try { navigator.vibrate && navigator.vibrate([30,15,30,15,30]); } catch(e){} },
    // Rumble — case opening, door unjam
    rumble:    () => { try { navigator.vibrate && navigator.vibrate([40,20,40,20,60]); } catch(e){} },
    // Escape — long triumphant pattern
    escape:    () => { try { navigator.vibrate && navigator.vibrate([20,10,20,10,20,40,80]); } catch(e){} },
    // Wrong — sharp double thud
    wrong:     () => { try { navigator.vibrate && navigator.vibrate([30,20,30]); } catch(e){} },
    // Discovery — two pulses
    discovery: () => { try { navigator.vibrate && navigator.vibrate([15,30,40]); } catch(e){} },
    // Candle snap — single soft pulse
    candle:    () => { try { navigator.vibrate && navigator.vibrate(12); } catch(e){} },
    // Case stage complete — satisfying click
    caseClick: () => { try { navigator.vibrate && navigator.vibrate([25,15,15]); } catch(e){} },
  };

  /* =========================================================================
   * MODE
   * ======================================================================= */
  function detectMode() {
    const gs = window.gameState || {};
    if (gs.chapter === 'prologue') return 'prologue';
    if (gs.paidTierUnlocked === true) return 'paid';
    return 'free';
  }

  /* =========================================================================
   * SEEDED PRNG — solutions randomised per session
   * ======================================================================= */
  function makePRNG(seed) {
    let s = seed | 0;
    return function () {
      s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* =========================================================================
   * SWORD DATA — fixed names + dates, order on rack is always visual
   * Chronological order varies per session (shuffled rack positions)
   * ======================================================================= */
  const SWORD_DATA = [
    { id: 'sword_a', name: 'Dress Sword',       year: 1847, color: '#7a7088' },
    { id: 'sword_b', name: 'Cavalry Sabre',     year: 1856, color: '#6a6878' },
    { id: 'sword_c', name: 'Presentation Foil', year: 1871, color: '#807888' },
    { id: 'sword_d', name: 'Naval Cutlass',     year: 1889, color: '#686880' },
  ];
  // Chronological order is always a→b→c→d (by year)
  // But on the rack they appear in a shuffled visual order
  // rackOrder[i] = index into SWORD_DATA of the sword at rack position i
  function generateRackOrder(r) {
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }

  /* =========================================================================
   * COAT OF ARMS — three charges, order varies per session
   * ======================================================================= */
  const CHARGES = [
    { id: 'lion',  name: 'Lion Rampant', symbol: '♞', founded: 1 }, // oldest
    { id: 'cross', name: 'Cross Flory',  symbol: '✛', founded: 2 },
    { id: 'star',  name: 'Star of Eight',symbol: '✦', founded: 3 }, // newest
  ];
  // Correct tap order is always by founding: lion → cross → star
  // But their visual positions on the shield are shuffled
  function generateShieldPositions(r) {
    const pos = [0, 1, 2];
    for (let i = 2; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pos[i], pos[j]] = [pos[j], pos[i]]; }
    return pos; // pos[i] = which charge is at shield position i (left/centre/right)
  }

  /* =========================================================================
   * CANDLE — which of 5 brass studs is the correct position
   * ======================================================================= */
  function generateCandlePos(r) { return 2; } // always stud 3 (0-indexed 2) — matches faint diagram clue

  /* =========================================================================
   * CASE — 3 gesture stages in random order
   * ======================================================================= */
  const GESTURES = ['rotate', 'slide', 'press'];
  function generateCaseGestures(r) {
    // Always rotate → slide → press
    // Rotate releases the perimeter seal
    // Slide exposes the latch beneath the glass panel
    // Press springs the latch
    // This order makes mechanical sense and is discoverable
    return ['rotate', 'slide', 'press'];
  }

  /* =========================================================================
   * STATE
   * ======================================================================= */
  function createState() {
    const mode = detectMode();
    const seed = Date.now() & 0x7fffffff;
    const r = makePRNG(seed);
    const rackOrder = generateRackOrder(r);
    const shieldPos = generateShieldPositions(r);
    const candlePos = generateCandlePos(r);
    const caseGestures = generateCaseGestures(r);

    return {
      mode, seed,
      sol: { rackOrder, shieldPos, candlePos, caseGestures },

      // Puzzle states
      examined: {},          // hotspot id → true
      inv: [],               // item ids: 'key', 'sword'
      doorJammed: true,      // true until sword used on lock mechanism
      escaped: false,

      puzzles: {
        sequence: { solved: false, tapped: [], panelOpen: false },
        candle:   { solved: false, pos: 0 },   // current stud position
        arms:     { solved: false, tapped: [], caseUnlocked: false },
        case:     { solved: false, stage: 0 },
        door:     { solved: false },
      },

      // UI state
      phase: 'intro',        // intro | play | summary
      startTime: Date.now(),
      escapeTime: null,

      // Northcott
      _dlgLines: [],
      _hintCool: 0,

      // Runtime (not saved)
      _dlg: '', _dlgT: 0, _dlgF: 0,
      _sel: null,
      _hotspots: [], _invRects: [], _hudRects: {},
      _nbRects: {}, _nbOpen: false, _nbPage: 0,
      _notifyQ: [],
    };
  }

  const SAVE_KEY = 'nocturne_armoury_v1';
  function saveState(s) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        mode: s.mode, seed: s.seed, sol: s.sol,
        examined: s.examined, inv: s.inv,
        doorJammed: s.doorJammed, escaped: s.escaped,
        puzzles: s.puzzles, phase: s.phase,
        startTime: s.startTime, escapeTime: s.escapeTime,
      }));
    } catch (e) {}
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (d.mode !== detectMode()) return null;
      return d;
    } catch (e) { return null; }
  }
  function restoreState(d) {
    const s = createState();
    // Deep-merge puzzles to avoid missing keys if schema changed
    const safePuzzles = {
      sequence: { solved:false, tapped:[], panelOpen:false },
      candle:   { solved:false, pos:0 },
      arms:     { solved:false, tapped:[], caseUnlocked:false },
      case:     { solved:false, stage:0 },
      door:     { solved:false },
    };
    if (d.puzzles) {
      Object.keys(safePuzzles).forEach(k => {
        if (d.puzzles[k]) Object.assign(safePuzzles[k], d.puzzles[k]);
      });
    }
    Object.assign(s, {
      seed: d.seed, sol: d.sol || s.sol,
      examined: d.examined || {}, inv: d.inv || [],
      doorJammed: d.doorJammed !== undefined ? d.doorJammed : true,
      escaped: !!d.escaped,
      puzzles: safePuzzles,
      phase: d.phase === 'summary' ? 'play' : (d.phase || 'play'),
      startTime: d.startTime || Date.now(),
      escapeTime: d.escapeTime || null,
    });
    // Reset any active mid-puzzle state — puzzles restart cleanly on restore
    s.puzzles.sequence.tapped = s.puzzles.sequence.solved ? [] : (d.puzzles&&d.puzzles.sequence&&d.puzzles.sequence.tapped)||[];
    s.puzzles.arms.tapped = s.puzzles.arms.solved ? [] : (d.puzzles&&d.puzzles.arms&&d.puzzles.arms.tapped)||[];
    s.puzzles.case.stage = s.puzzles.case.solved ? 0 : (d.puzzles&&d.puzzles.case&&d.puzzles.case.stage)||0;
    return s;
  }

  function hasItem(s, id) { return s.inv.includes(id); }
  function addItem(s, id) { if (!hasItem(s, id)) { s.inv.push(id); } }

  function notify(s, text, type) {
    s._notifyQ = s._notifyQ.filter(n => n.type !== type || type === 'examine');
    s._notifyQ.push({ text, timer: 260, type: type || 'examine' });
  }

  /* =========================================================================
   * NORTHCOTT DIALOGUE
   * ======================================================================= */
  const NLG = {
    intro: [
      "The door locked behind you. I noticed it before you did.",
      "Both of us, then. I was here first, for what that is worth. Which is very little at present.",
      "Locked in an armoury with a man who investigates things for a living. I am choosing to find that reassuring.",
      "I have done a preliminary survey. There are four swords, one fireplace, one locked case, and no obvious exits. You are welcome.",
    ],
    door_examine: [
      "Double-sided iron lock. The mechanism is jammed — something is blocking the tumbler from the inside. The key, wherever it is, will not help you yet.",
      "The lock is seized. There are two problems: finding the key, and clearing whatever is jamming the mechanism. I would suggest treating them as separate questions.",
      "I tried the door before you arrived. It is thoroughly locked and the mechanism is fouled. Something slim needs to go in there before any key will turn.",
    ],
    sword_examine_nodates: [
      "The swords have plaques beneath the mounts. Small, but the engraving is clear. I would read them if I were trying to get out of a locked room.",
      "Each mount has a plaque. Four swords, four plaques. The information is there if you look for it.",
      "Someone went to the trouble of labelling these. That is usually a signal that the labels matter.",
    ],
    sword_examine_dates: [
      "Four swords. Four acquisition years. The years are not in the order the swords are mounted. Someone arranged them this way deliberately — the note in the cabinet tells you what the correct order is.",
      "The swords have been on that rack since before either of us was born. Someone put them in that order. The question is what order they should be in. The cabinet has an opinion on the matter.",
      "You have the years. You have the note from the cabinet. The sequence is not complicated once you have both.",
    ],
    cabinet_note: [
      "The order of acquisition is the order of the house. That is pinned at eye level. Whoever left that wanted it found.",
      "Acquisition order. The house was built on a principle of precedence. The swords follow the same logic.",
      "Someone pinned that note deliberately. They expected someone to be in this room looking for exactly that information. I find that slightly unsettling.",
    ],
    sequence_wrong: [
      "The swords have been on that rack since before either of us was born. Someone put them in that order. It was not the order you just tried.",
      "Wrong sequence. The years are on the plaques. Oldest acquisition first — the note was explicit.",
      "Not that order. I would re-read the plaques rather than guess. Guessing is how we stay in this room.",
    ],
    sequence_solved: [
      "The wall just moved. I have been standing next to that panel for the last ten minutes and had no idea it was there.",
      "A hidden panel. Whoever built this room had considerably more going on than I assumed. There is something inside.",
      "There. The key is in there. There is also a note — read the note before you assume anything.",
    ],
    key_found: [
      "The note said for the lock, not the door. I found that distinction interesting at the time. I find it considerably more interesting now.",
      "You have the key. You cannot use it yet. The note explains why with unusual precision for a piece of paper hidden in a wall.",
      "For the lock, not the door. Someone who understood this mechanism left that note. I would take it seriously.",
    ],
    mantle_examine: [
      "There are marks scratched into the mantle wood near the left candelabra. Very old, very deliberate. Someone was trying to leave information without making it obvious.",
      "The mantle has a diagram scratched into it. Faint — you would miss it without looking closely. Five positions marked, one indicated with an arrow.",
      "I noticed those scratches when we first came in. I assumed they were damage. They are not damage.",
    ],
    candle_wrong: [
      "The shadow is not forming anything legible. That is not the position.",
      "Wrong stud. The scratched diagram on the mantle shows the correct one — it is fairly specific.",
      "The shadow needs to fall on the coat of arms at the right angle. That position does not achieve it.",
    ],
    candle_correct: [
      "The shadow is pointing directly at one of the charges. That is not coincidence. Remember which one — the shield will ask you to be precise about the order.",
      "There. That charge is the first in sequence. The inscription under the shield will tell you the principle that determines the rest.",
      "The shadow resolved. One charge illuminated. That is the first. Now the coat of arms needs the remaining two in the correct order — the shield has an inscription.",
    ],
    arms_examine: [
      "There is an inscription below the shield. Very small, slightly worn — but legible. It states the principle. The candle showed you where to start.",
      "By precedence of founding. That is what the inscription says. The candle showed you the first charge. The principle tells you how to find the remaining two.",
      "Three charges, one sequence, one principle stated in writing beneath the shield. The candle did half the work. The inscription does the rest.",
    ],
    arms_wrong: [
      "That is not the correct charge. The candle shadow showed you the first one — begin there, not somewhere else.",
      "Wrong. Precedence of founding. The candle identified the founding precedence — follow from there.",
      "Incorrect. The sequence resets. The shadow pointed to one specific charge. Start with that one.",
    ],
    arms_solved: [
      "Forty years. Whatever is in that case, Ashworth did not want it found easily. You found it with a candle and a coat of arms. I suspect he underestimated the people he was keeping out.",
      "The case just responded to that sequence. Three charges in founding order. Someone very methodical designed this room.",
      "The case is unlocked. Whatever is inside has not been touched in forty years. Go carefully.",
    ],
    case_examine: [
      "It is a layered mechanism — not one lock but three sequential stages. Each stage is physically different. Pay attention to what each one is asking for rather than forcing anything.",
      "Three stages. The case will show you what each one requires. It responds to the correct gesture — wrong approach and it resets the stage.",
      "I have been looking at that case since we arrived. The mechanism is elegant. Rotate, slide, press — in some order. The case will make clear which is which.",
    ],
    case_solved: [
      "The dress sword. And the inscription on the base — the blade serves twice. I think I understand the door now.",
      "Forty years in a locked case. Look at the inscription on the base of the case, not just the sword. The blade serves twice. Read that carefully.",
      "Take the sword. The blade is the solution to the jam — the tip fits the lock mechanism. Someone planned this room very thoroughly.",
    ],
    sword_on_door: [
      "The tip fits the mechanism exactly. That is not accident — this sword was made for this lock.",
      "Slowly. The tumbler is shifting. Whatever was blocking it is clearing.",
      "The jam is gone. The key will turn now. We are nearly out.",
    ],
    escaped: [
      "I will say this — you are methodical when the situation demands it. Slow, but methodical.",
      "The door is open. I am going to pretend I was not concerned at any point.",
      "Well. That was a room. Shall we not do that again.",
      "After you, Grey. You earned it. I merely supervised.",
    ],
    // ── IDLE HINTS — fire after 40s idle, never give the answer ────────────
    idle_door: [
      "You have tried the handle. There is more information available if you examine the door properly rather than just pulling it.",
    ],
    idle_sequence: [
      "The swords have been standing there for the duration of this conversation. Each one has a plaque. The cabinet has a note. I am not going to connect those two observations for you.",
      "Four swords. A note that specifies an ordering principle. I am watching you not use either of those things and it is taking considerable restraint.",
    ],
    idle_candle: [
      "The mantle has a scratched diagram. The candelabra sits in a brass stud. There are four other brass studs. The diagram shows a preference. I will leave that there.",
    ],
    idle_arms: [
      "The candle shadow identified one charge. The shield has an inscription explaining the principle. You have both pieces of information. I am curious what you are waiting for.",
    ],
    idle_case: [
      "The case has three stages. Each stage is a different physical action. The mechanism shows you which one it is waiting for. Looking at it more closely tends to help.",
    ],
    idle_door_unjam: [
      "You have a sword. You have a key. The note in the case said the blade serves twice. The door has a jammed mechanism. I am going to stop talking now.",
    ],
    // ── RED HERRING REACTIONS ───────────────────────────────────────────────
    herring_fireplace: [
      "It is a fireplace, Grey. I have examined it thoroughly on the grounds that I had nothing else to do. It is emphatically just a fireplace.",
      "The fireplace is not the solution to anything. I checked.",
      "Whatever you are looking for, it is not up the chimney.",
    ],
    herring_portrait: [
      "The portrait is interesting. The man is holding a dress sword with the tip inserted into what appears to be a lock mechanism. I noticed that immediately and am now watching to see if you do.",
      "Look at what he is holding. Look at how he is holding it. The painter put that detail there deliberately.",
      "The portrait is a clue of sorts. The dress sword in his hands — look at the tip, and where it is.",
    ],
    yield: [
      "Come back when you are ready. The room will wait. The door will remain locked, which is inconvenient but consistent.",
      "The door will be just as locked when you return. I find that thought less comforting than I should.",
      "I will still be here. That is not a threat. It is just the situation.",
      "Take your time. One of us is not going anywhere.",
    ],
  };

  function pickLine(s, key) {
    const pool = NLG[key];
    if (!pool || !pool.length) return null;
    const delivered = s._dlgLines;
    const avail = pool.filter(l => !delivered.includes(l));
    const src = avail.length ? avail : pool;
    const line = src[Math.floor(Math.random() * src.length)];
    if (!delivered.includes(line)) delivered.push(line);
    return line;
  }

  function northcottSay(s, key) {
    if (s.mode !== 'prologue') return null;
    return pickLine(s, key);
  }

  // Hint system tracks what player has examined to contextualise hints
  // First hint fires at 35s idle, subsequent hints at 55s cooldown
  // Paid mode: silent always
  function tickHints(s, frames) {
    if (s.mode !== 'prologue') return null;
    if (s._hintCool > 0) { s._hintCool--; return null; }
    const FIRST_HINT = 60 * 35;  // 35 seconds
    const HINT_COOL  = 60 * 55;  // 55 seconds between hints
    if (frames < FIRST_HINT) return null;

    const p = s.puzzles;
    let key = null;

    // Priority: hint about the most recent unsolved puzzle the player
    // has shown awareness of — not just the next in chain
    if (!s.examined['door']) {
      key = 'idle_door';
    } else if (!p.sequence.solved) {
      // Has player found the cabinet note? If not, nudge toward it
      if (!s.examined['cabinet_note'] && s.examined['blade_0']) {
        key = 'idle_sequence'; // knows about swords but not the note
      } else if (s.examined['cabinet_note']) {
        key = 'idle_sequence'; // has the note, still not solved
      } else {
        key = 'idle_sequence'; // hasn't examined anything useful
      }
    } else if (!p.candle.solved) {
      // Has player found the mantle diagram?
      if (!s.examined['mantle']) {
        key = 'idle_candle'; // hasn't found the diagram yet
      } else {
        key = 'idle_candle'; // has diagram, hasn't solved candle
      }
    } else if (!p.arms.solved) {
      key = 'idle_arms';
    } else if (!p.case.solved) {
      key = 'idle_case';
    } else if (!p.door.solved) {
      key = 'idle_door_unjam';
    }

    if (!key) return null;
    s._hintCool = HINT_COOL;
    return northcottSay(s, key);
  }

  /* =========================================================================
   * COLOURS
   * ======================================================================= */
  const C = {
    gold: '#c9a84c', goldDim: '#6a5520', goldBright: '#e8d8a8',
    cream: '#f0e8d8', creamDim: '#8a8070',
    green: '#4a9a4a', greenDim: '#1a3a1a',
    red: '#9a3020', amber: '#c87820',
    panel: 'rgba(8,5,10,0.97)', overlay: 'rgba(0,0,0,0.84)',
    invBg: 'rgba(6,4,8,0.97)',
  };

  /* =========================================================================
   * AUDIO
   * ======================================================================= */
  let _ac = null, _mg = null;
  function aInit() {
    if (_ac) return;
    try { _ac = new (window.AudioContext || window.webkitAudioContext)(); _mg = _ac.createGain(); _mg.gain.value = 0.6; _mg.connect(_ac.destination); } catch (e) { _ac = null; }
  }
  function aResume() { if (_ac && _ac.state === 'suspended') _ac.resume(); }
  function _n() { return _ac ? _ac.currentTime : 0; }
  function _osc(type, freq, t, dur, gain) {
    if (!_ac) return;
    const o = _ac.createOscillator(), g = _ac.createGain();
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(_mg);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function _noise(t, dur, gain, fq) {
    if (!_ac) return;
    const buf = _ac.createBuffer(1, _ac.sampleRate * dur, _ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = _ac.createBufferSource(), flt = _ac.createBiquadFilter(), g = _ac.createGain();
    src.buffer = buf; flt.type = 'bandpass'; flt.frequency.value = fq || 800;
    src.connect(flt); flt.connect(g); g.connect(_mg);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t); src.stop(t + dur + 0.05);
  }
  const SND = {
    // Generic tap
    tap:        () => { const t=_n(); _noise(t,0.05,0.20,400); _osc('sine',160,t,0.07,0.09); },
    // Material-specific taps
    tapWood:    () => { const t=_n(); _noise(t,0.07,0.22,280); _osc('sine',140,t,0.06,0.12); },  // door, cabinet, mantle
    tapBrass:   () => { const t=_n(); _osc('triangle',1100,t,0.18,0.16); _noise(t,0.04,0.10,1800); }, // lock, studs, case rings
    tapStone:   () => { const t=_n(); _noise(t,0.09,0.25,180); _osc('sine',95,t,0.06,0.14); },   // fireplace, floor
    tapGlass:   () => { const t=_n(); _osc('sine',1480,t,0.35,0.14); _osc('sine',2200,t+0.02,0.22,0.06); }, // case glass
    tapCanvas:  () => { const t=_n(); _noise(t,0.06,0.12,800); _osc('sine',380,t,0.04,0.06); },  // portrait
    // Actions
    examine:    () => { const t=_n(); _noise(t,0.08,0.12,600); },
    blade:      () => { const t=_n(); _osc('triangle',880,t,0.7,0.22); _noise(t,0.05,0.14,2200); },
    wrong:      () => { const t=_n(); _osc('sawtooth',110,t,0.35,0.22); _noise(t,0.18,0.14,180); },
    correct:    () => { const t=_n(); [523,659,784].forEach((f,i)=>_osc('sine',f,t+i*0.10,0.6,0.12)); },
    panel:      () => { const t=_n(); _osc('sawtooth',140,t,0.6,0.20); _noise(t,0.4,0.10,300); _osc('sine',220,t+0.3,0.4,0.08); },
    candle:     () => { const t=_n(); _noise(t,0.10,0.06,280); },
    shadow:     () => { const t=_n(); _osc('sine',110,t,1.1,0.12); _noise(t,0.28,0.05,190); },
    armsTap:    () => { const t=_n(); _osc('sine',660,t,0.35,0.16); _noise(t,0.04,0.10,1200); },
    armsOpen:   () => { const t=_n(); [329,415,523].forEach((f,i)=>_osc('sine',f,t+i*0.08,1.2,0.13)); },
    // Case stages — each gesture has its own sound
    caseRotate: () => { const t=_n(); _noise(t,0.12,0.14,900); _osc('triangle',380,t,0.15,0.10); },
    caseSlide:  () => { const t=_n(); _noise(t,0.20,0.12,550); _osc('sine',240,t,0.08,0.08); },
    casePress:  () => { if(!_ac)return; const t=_n(); const o=_ac.createOscillator(),g=_ac.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(310,t+0.4); o.connect(g); g.connect(_mg); g.gain.setValueAtTime(0.14,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.4); o.start(t); o.stop(t+0.45); _noise(t,0.4,0.07,380); },
    caseOpen:   () => { const t=_n(); [261,329,392,523].forEach((f,i)=>_osc('sine',f,t+i*0.06,2.0,0.11)); _noise(t,0.5,0.11,580); },
    unjam:      () => { const t=_n(); _noise(t,0.6,0.20,420); _osc('sine',200,t+0.3,0.5,0.13); _noise(t+0.5,0.15,0.08,600); },
    doorOpen:   () => { const t=_n(); _noise(t,0.8,0.22,220); _osc('sine',140,t,0.12,0.14); _osc('sine',180,t+0.4,0.6,0.10); },
    escape:     () => { const t=_n(); [392,523,659,784,1047].forEach((f,i)=>_osc('sine',f,t+i*0.12,1.5,0.10)); },
    northcott:  () => { const t=_n(); _noise(t,0.07,0.04,1700); },
    pickup:     () => { const t=_n(); _osc('sine',880,t,0.35,0.13); _osc('sine',1320,t+0.06,0.28,0.08); },
    discovery:  () => { const t=_n(); _osc('sine',440,t,0.8,0.08); _osc('sine',554,t+0.1,0.7,0.06); _osc('sine',659,t+0.2,0.6,0.05); },
  };

  /* =========================================================================
   * RENDER HELPERS
   * ======================================================================= */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function _hit(px, py, r) { return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
  function wrapTxt(ctx, text, maxW, font) {
    ctx.font = font || 'italic 13px Georgia,serif';
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  }

  // Image layout — 2:1 image fills screen width, anchored to top of play area
  const INV_H = 62;
  function imgLayout(W, H) {
    const imgW = W, imgH = W / 2.0;
    const imgX = 0, imgY = Math.max(0, (H - INV_H - imgH) / 2);
    return { imgX, imgY, imgW, imgH };
  }
  function imgToScreen(xf, yf, L) {
    return { x: L.imgX + xf * L.imgW, y: L.imgY + yf * L.imgH };
  }

  /* =========================================================================
   * HOTSPOT DEFINITIONS
   * All positions in image fractions (image = 1536x768, 2:1)
   * ======================================================================= */
  // Door is far left — added as leftmost hotspot
  // Rack swords are positions mapped to the 4 blade rows in the image
  // Image prop map (approximate fractions):
  //   Door:            xf 0.00-0.04  yf 0.15-0.85  (implied, left edge)
  //   Sword rack:      xf 0.01-0.22  yf 0.05-0.85
  //   Blade rows:      yf 0.12, 0.30, 0.46, 0.60
  //   Cabinet (base):  xf 0.00-0.04  yf 0.75-0.88
  //   Hidden panel:    xf 0.23-0.31  yf 0.28-0.72
  //   Left candelabra: xf 0.37-0.44  yf 0.14-0.35
  //   Coat of arms:    xf 0.39-0.61  yf 0.00-0.26
  //   Fireplace:       xf 0.34-0.66  yf 0.28-0.88
  //   Mantle:          xf 0.34-0.66  yf 0.26-0.38
  //   Portrait:        xf 0.72-0.89  yf 0.04-0.50
  //   Glass case:      xf 0.78-0.98  yf 0.48-0.76
  //   Writing table:   xf 0.70-1.00  yf 0.60-0.88

  function buildHotspots(s) {
    const L = _layout;
    if (!L) return [];

    // All xf/yf fractions mapped exactly to nocturne-room-weapons-bg.png (1536×768)
    // Door is implied off-screen left — player pans left to find it.
    // Image at 2:1 fills screen width; at default zoom left edge starts at screen left.

    const hs = [
      // ── DOOR — far left wall, implied. Hotspot at leftmost edge ──────────
      {
        id: 'door', label: 'Door',
        xf: -0.05, yf: 0.10, wf: 0.06, hf: 0.80,
        onTap: (s) => _tapDoor(s),
        pulse: !s.escaped,
      },

      // ── SWORD CABINET + RACK ─────────────────────────────────────────────
      // Cabinet occupies x 0.00–0.22 of image
      // 5 blade rows visible; we use top 4 (rows at y 0.08, 0.28, 0.45, 0.60)
      { id: 'rack_0', label: 'Dress Sword',
        xf: 0.01, yf: 0.06, wf: 0.20, hf: 0.14,
        onTap: (s) => _tapRackBlade(s, 0), pulse: !s.puzzles.sequence.solved },
      { id: 'rack_1', label: 'Cavalry Sabre',
        xf: 0.01, yf: 0.25, wf: 0.20, hf: 0.14,
        onTap: (s) => _tapRackBlade(s, 1), pulse: !s.puzzles.sequence.solved },
      { id: 'rack_2', label: 'Presentation Foil',
        xf: 0.01, yf: 0.42, wf: 0.20, hf: 0.14,
        onTap: (s) => _tapRackBlade(s, 2), pulse: !s.puzzles.sequence.solved },
      { id: 'rack_3', label: 'Naval Cutlass',
        xf: 0.01, yf: 0.57, wf: 0.20, hf: 0.14,
        onTap: (s) => _tapRackBlade(s, 3), pulse: !s.puzzles.sequence.solved },

      // Cabinet base — note pinned inside
      { id: 'cabinet_note', label: 'Cabinet Note',
        xf: 0.01, yf: 0.74, wf: 0.14, hf: 0.14,
        onTap: (s) => _tapCabinetNote(s),
        gate: () => s.mode!=='paid' || [0,1,2,3].filter(i=>s.examined['blade_'+i]).length>=2,
        gateMsg: "The base of the cabinet. Nothing is immediately visible.",
        pulse: !s.examined['cabinet_note'] && !s.puzzles.sequence.solved && s.mode!=='paid' },

      // ── HIDDEN PANEL — dark strip between cabinet and fireplace ──────────
      { id: 'hidden_panel', label: 'Wall Panel',
        xf: 0.22, yf: 0.24, wf: 0.10, hf: 0.52,
        onTap: (s) => _tapPanel(s),
        pulse: s.puzzles.sequence.solved && !s.puzzles.sequence.panelOpen },

      // ── MANTLE — examine for diagram clue ────────────────────────────────
      { id: 'mantle', label: 'Mantle',
        xf: 0.32, yf: 0.27, wf: 0.36, hf: 0.10,
        onTap: (s) => _tapMantle(s),
        pulse: s.puzzles.sequence.solved && !s.examined['mantle'] },

      // ── LEFT CANDELABRA — draggable ───────────────────────────────────────
      { id: 'candle', label: 'Candelabra',
        xf: 0.345, yf: 0.14, wf: 0.06, hf: 0.14,
        onTap: (s) => _openPuzzle('candle'),
        gate: () => s.examined['mantle'],
        gateMsg: "The candelabra sits in a brass stud on the mantle. There are others.",
        pulse: s.examined['mantle'] && !s.puzzles.candle.solved },

      // ── COAT OF ARMS — above fireplace ────────────────────────────────────
      { id: 'coat_of_arms', label: 'Coat of Arms',
        xf: 0.38, yf: 0.00, wf: 0.24, hf: 0.28,
        onTap: (s) => _openPuzzle('arms'),
        gate: () => s.puzzles.candle.solved,
        gateMsg: "The Ashworth coat of arms. Three charges on the shield. The order is not obvious.",
        pulse: s.puzzles.candle.solved && !s.puzzles.arms.solved },

      // ── FIREPLACE — examine only (red herring) ────────────────────────────
      { id: 'fireplace', label: 'Fireplace',
        xf: 0.32, yf: 0.30, wf: 0.36, hf: 0.58,
        onTap: (s) => {
          s.examined['fireplace']=true;
          notify(s,"The fire is low. The grate is cast iron — ornate, heavy. The ash below is old. There is nothing here that helps you.",'examine');
          const l=northcottSay(s,'herring_fireplace');if(l)_dlg(s,l);
        }},

      // ── PORTRAIT — right wall (red herring / clue) ───────────────────────
      { id: 'portrait', label: 'Portrait',
        xf: 0.71, yf: 0.03, wf: 0.17, hf: 0.50,
        onTap: (s) => _tapPortrait(s) },

      // ── GLASS CASE — far right on table ──────────────────────────────────
      { id: 'glass_case', label: 'Glass Case',
        xf: 0.77, yf: 0.49, wf: 0.21, hf: 0.26,
        onTap: (s) => _openPuzzle('case'),
        gate: () => s.puzzles.arms.solved,
        gateMsg: "A sealed mahogany and brass display case. The lock is integrated — no keyhole. Something else controls it.",
        pulse: s.puzzles.arms.solved && !s.puzzles.case.solved },

      // ── WRITING TABLE ─────────────────────────────────────────────────────
      { id: 'writing_table', label: 'Writing Table',
        xf: 0.70, yf: 0.64, wf: 0.16, hf: 0.22,
        onTap: (s) => _tapTable(s),
        modeOnly: ['free', 'paid'] },

      // ── FALSE KEY DRAWER (paid only) ──────────────────────────────────────
      { id: 'false_key_drawer', label: 'Locked Drawer',
        xf: 0.74, yf: 0.70, wf: 0.08, hf: 0.06,
        modeOnly: ['paid'],
        onTap: (s) => {
          s.examined['false_key_drawer']=true;
          if(!s._drawerOpen){
            s._drawerOpen=true;
            notify(s,"The drawer opens. Inside: a wax impression — the shape of a key mould. The original key is not here. There is also a folded card.",'item');
            HAP.light();
          } else if(!s._cardRead){
            s._cardRead=true;
            notify(s,"The card reads: \"The key to this room has never existed. The room opens from the inside.\" It is unsigned.",'examine');
          } else {
            notify(s,"An empty drawer with a wax key mould and an unhelpful card.",'examine');
          }
        },
        pulse: !s.examined['false_key_drawer'] && s.mode==='paid' },
    ];

    return hs;  }

  /* =========================================================================
   * HOTSPOT TAP HANDLERS
   * ======================================================================= */
  function _tapDoor(s) {
    s.examined['door'] = true;
    SND.tapWood(); HAP.tap();

    if (s.escaped) { notify(s, "The door is open.", 'examine'); return; }

    // Paid mode — Northcott left a note on the floor. One time only.
    if (s.mode === 'paid' && !s.examined['northcott_floor_note']) {
      s.examined['northcott_floor_note'] = true;
      s._discovery = 'northcott_floor_note';
      s._discoveryFade = 0;
      HAP.discovery();
      return;
    }

    if (!s.puzzles.door.solved && hasItem(s, 'key') && !s.doorJammed) {
      // Use key — escape
      s.puzzles.door.solved = true;
      s.escaped = true;
      s.escapeTime = Date.now();
      SND.doorOpen(); HAP.escape(); setTimeout(()=>SND.escape(), 800);
      const l = northcottSay(s, 'escaped'); if (l) _dlg(s, l);
      setTimeout(() => { if (_state) _state.phase = 'summary'; }, 2000);
      return;
    }

    if (hasItem(s, 'sword') && s.doorJammed) {
      // Use sword to unjam
      s.doorJammed = false;
      SND.unjam(); HAP.rumble();
      notify(s, "The blade fits the mechanism. A grinding resistance — then it clears. The jam is gone.", 'item');
      const l = northcottSay(s, 'sword_on_door'); if (l) _dlg(s, l);
      return;
    }

    if (hasItem(s, 'key') && s.doorJammed) {
      notify(s, "The key fits the lock but the mechanism is jammed. Something is blocking the tumbler from the inside. The key alone will not do it.", 'examine');
      const l = northcottSay(s, 'door_examine'); if (l) _dlg(s, l);
      return;
    }

    if (!s.examined['door']) {
      const l = northcottSay(s, 'door_examine'); if (l) _dlg(s, l);
    }
    notify(s, "Double-sided iron lock. The keyhole is clear. The mechanism is jammed — something is blocking the tumbler from the inside. The key alone will not open it.", 'examine');
    SND.examine();
  }

  function _tapRackBlade(s, rackPos) {
    const swordIdx = s.sol.rackOrder[rackPos];
    const sword = SWORD_DATA[swordIdx];
    const id = 'blade_' + rackPos;
    s.examined[id] = true;
    SND.blade();
    // Paid: Presentation Foil year is smudged — shows 187? not 1871
    const displayYear = (s.mode === 'paid' && sword.id === 'sword_c')
      ? '187—' : sword.year;

    // In sequence puzzle mode, tap routes to sequence logic
    if (!s.puzzles.sequence.solved) {
      // Sequence tap
      const tapped = s.puzzles.sequence.tapped;
      if (tapped.includes(rackPos)) {
        notify(s, `${sword.name} (${sword.year}). Already in sequence.`, 'examine');
        return;
      }
      // Check if correct next in chronological order
      // Chronological order: tap rackPos values such that their swordIdx years are ascending
      const chronoOrder = _getChronoOrder(s);
      const expected = chronoOrder[tapped.length];
      if (rackPos === expected) {
        tapped.push(rackPos);
        SND.blade(); HAP.light();
        if (s.mode !== 'paid') notify(s, `${sword.name} — ${displayYear}. (${tapped.length} of 4)`, 'item');
        if (tapped.length === 4) {
          s.puzzles.sequence.solved = true;
          SND.correct();
          const l = northcottSay(s, 'sequence_solved'); if (l) _dlg(s, l);
          notify(s, "The sequence is correct. Something clicks behind the wall.", 'item');
        }
      } else {
        s.puzzles.sequence.tapped = [];
        SND.wrong();
        if (s.mode !== 'paid') notify(s, `${sword.name} — ${displayYear}. Wrong order. Sequence reset.`, 'examine');
        const l = northcottSay(s, 'sequence_wrong'); if (l) _dlg(s, l);
      }
      return;
    }

    // After solved — examine only
    const allExamined = [0,1,2,3].every(i => s.examined['blade_'+i]);
    const hintLine = allExamined
      ? northcottSay(s, 'sword_examine_dates')
      : northcottSay(s, 'sword_examine_nodates');
    notify(s, `${sword.name}. Acquired ${sword.year}. The plaque beneath the mount is small but legible.`, 'examine');
    if (hintLine && !s.puzzles.sequence.solved) _dlg(s, hintLine);
  }

  function _getChronoOrder(s) {
    // Returns array of rack positions in chronological order (oldest first)
    return [0, 1, 2, 3]
      .sort((a, b) => SWORD_DATA[s.sol.rackOrder[a]].year - SWORD_DATA[s.sol.rackOrder[b]].year);
  }

  function _tapCabinetNote(s) {
    s.examined['cabinet_note'] = true;
    SND.tapWood();
    if (s.mode === 'paid') {
      // Water damage obscures two words — player must infer
      notify(s, 'A note pinned inside the cabinet. The ink is water-damaged. Legible: "The order of ░░░░░░░░░░ is the order of the ░░░░░." The missing words are not recoverable.', 'examine');
    } else {
      notify(s, '"The order of acquisition is the order of the house." A note pinned inside the cabinet. The ink is old.', 'examine');
      const l = northcottSay(s, 'cabinet_note'); if (l) _dlg(s, l);
    }
  }

  function _tapPanel(s) {
    if (!s.puzzles.sequence.solved) {
      notify(s, "Dark walnut panelling. One section has a hairline gap running around it — almost invisible. It does not move.", 'examine');
      return;
    }
    if (s.puzzles.sequence.panelOpen) {
      if (!hasItem(s, 'key')) {
        notify(s, "The panel is open. The key is inside on a hook, with a small card: \"For the lock. Not the door.\"", 'examine');
        return;
      }
      notify(s, "The panel is open.", 'examine');
      return;
    }
    // Open panel — sequence just solved
    s.puzzles.sequence.panelOpen = true;
    SND.panel(); HAP.medium();
    notify(s, "The panel swings open. Inside: an iron key on a hook. A small card reads: \"For the lock. Not the door.\"", 'item');
    addItem(s, 'key');
    SND.pickup(); HAP.light();
    const l = northcottSay(s, 'key_found'); if (l) _dlg(s, l);
  }

  function _tapMantle(s) {
    s.examined['mantle'] = true;
    SND.tapWood();
    if (s.mode === 'paid') {
      // Two marks indicated — only one is correct (stud 3, index 2)
      notify(s, "The mantle wood is very old. Near the left side: a diagram scratched into the surface, almost invisible. Five marks in a row. Two of them are indicated — a small arrow and a small cross. The arrow points to the third mark. The cross is on the fifth.", 'examine');
    } else {
      notify(s, "The mantle wood is old. Near the left side, barely visible: a small diagram scratched into the surface. Five marks in a row, with an arrow pointing to the third. Someone wanted that remembered.", 'examine');
      const l = northcottSay(s, 'mantle_examine'); if (l) _dlg(s, l);
    }
  }

  function _tapPortrait(s) {
    s.examined['portrait'] = true;
    SND.tapCanvas();
    // Portrait is a red herring that becomes a clue — Northcott reacts
    const l=northcottSay(s,'herring_portrait');if(l)_dlg(s,l);
    if (!s.puzzles.case.solved) {
      if (s.mode === 'paid') {
        notify(s, "A formal portrait. A man in dark military dress. Below it, where a name-plaque might be, someone has written in pencil: 1-8-4-7. The man is holding a dress sword. His grip is unusual — the blade tip is directed toward something.", 'examine');
      } else {
        notify(s, "A formal portrait. A man in dark military dress — unnamed, the plaque removed. He is holding a dress sword. Look at his hands. Look at where the blade tip is pointed.", 'examine');
      }
    } else {
      notify(s, "The man in the portrait. Holding the same sword. Tip in the lock mechanism. The painter put that detail in deliberately. Someone knew what the sword was for.", 'examine');
    }
  }

  function _tapTable(s) {
    s.examined['writing_table'] = true;
    SND.examine();
    if (s.mode === 'free') {
      s._nbOpen = true; s._nbPage = 0;
    } else {
      notify(s, "A writing table. A rectangular impression in the dust — the size of a notebook. Something was here recently. It is gone now.", 'examine');
    }
  }

  /* =========================================================================
   * PUZZLE OVERLAYS
   * ======================================================================= */

  /* ── CANDLE PUZZLE ──────────────────────────────────────────────────────── */
  const STUD_POSITIONS = [0.10, 0.25, 0.50, 0.70, 0.85]; // x fractions within mantle
  let CP = { drag: false, dragOX: 0, flick: 0 };

  function cpRender(ctx, W, H, s) {
    CP.flick += 0.08;
    const pw = Math.min(W * 0.94, 560), ph = Math.min(H * 0.74, 430), px = W/2-pw/2, py = H/2-ph/2;
    ctx.fillStyle = C.overlay; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = C.panel; rr(ctx,px,py,pw,ph,8); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; rr(ctx,px,py,pw,ph,8); ctx.stroke();

    ctx.fillStyle = C.gold; ctx.font = 'italic 15px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Slide the candelabra along the mantle', W/2, py+28);

    // Wall/shadow zone (upper portion)
    const wallY = py+42, wallH = ph*0.42, wallX = px+20, wallW = pw-40;
    ctx.fillStyle = 'rgba(22,12,8,0.75)'; ctx.fillRect(wallX, wallY, wallW, wallH);
    ctx.strokeStyle = '#3a2018'; ctx.lineWidth = 1; ctx.strokeRect(wallX, wallY, wallW, wallH);

    // Coat of arms silhouette on wall
    const armsX = wallX + wallW*0.28, armsW = wallW*0.44, armsY = wallY+8, armsH = wallH-16;
    ctx.fillStyle = 'rgba(30,18,10,0.8)';
    ctx.beginPath();
    ctx.moveTo(armsX, armsY); ctx.lineTo(armsX+armsW, armsY);
    ctx.lineTo(armsX+armsW, armsY+armsH*0.65);
    ctx.lineTo(armsX+armsW/2, armsY+armsH);
    ctx.lineTo(armsX, armsY+armsH*0.65); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 1; ctx.stroke();

    // Shadow cast — at correct position, arm shadow points to charge
    const correct = s.puzzles.candle.pos === s.sol.candlePos;
    if (correct) {
      // Shadow arm pointing from candle position toward first charge position
      const shieldPos = s.sol.shieldPos;
      const firstChargeShieldIdx = shieldPos.indexOf(0); // lion = founded 0
      const chargeFrac = (firstChargeShieldIdx + 0.5) / 3;
      const chargeX = armsX + armsW * chargeFrac;
      const chargeY = armsY + armsH * 0.50;
      const candleScreenX = wallX + wallW * STUD_POSITIONS[s.puzzles.candle.pos];

      // Shadow line
      ctx.strokeStyle = `rgba(200,160,60,0.55)`; ctx.lineWidth = 2;
      ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(candleScreenX, wallY + wallH); ctx.lineTo(chargeX, chargeY); ctx.stroke();
      ctx.setLineDash([]);

      // Illuminated charge
      ctx.save(); ctx.globalAlpha = 0.85;
      ctx.fillStyle = C.goldBright; ctx.font = `bold ${armsH*0.32}px Georgia,serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(CHARGES[0].symbol, chargeX, chargeY); // always lion first
      ctx.font = '10px Georgia,serif'; ctx.globalAlpha = 0.7;
      ctx.fillText(CHARGES[0].name, chargeX, chargeY + armsH*0.22);
      ctx.restore();

      SND.shadow();
    } else {
      // Show faint charges
      [0,1,2].forEach(ci => {
        const shieldIdx = s.sol.shieldPos.indexOf(ci);
        const cFrac = (shieldIdx + 0.5) / 3;
        const chX = armsX + armsW * cFrac, chY = armsY + armsH * 0.50;
        ctx.globalAlpha = 0.14; ctx.fillStyle = C.creamDim;
        ctx.font = `${armsH*0.28}px Georgia,serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(CHARGES[ci].symbol, chX, chY); ctx.globalAlpha = 1;
      });
    }

    // Mantle
    const mantleY = py + ph*0.60, mantleX = px+20, mantleW = pw-40;
    ctx.fillStyle = '#2a1a0e'; ctx.fillRect(mantleX, mantleY-6, mantleW, 12);
    ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 1; ctx.strokeRect(mantleX, mantleY-6, mantleW, 12);

    // 5 brass studs
    STUD_POSITIONS.forEach((nx, i) => {
      const sx = mantleX + mantleW * nx;
      ctx.fillStyle = i === s.puzzles.candle.pos ? C.gold : '#6a4a20';
      ctx.beginPath(); ctx.arc(sx, mantleY, 8, 0, TAU); ctx.fill();
      ctx.strokeStyle = i === s.puzzles.candle.pos ? C.goldBright : '#3a2810'; ctx.lineWidth = 1; ctx.stroke();
      // Stud number
      ctx.fillStyle = i === s.puzzles.candle.pos ? '#0a0808' : '#2a1a0a';
      ctx.font = 'bold 8px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i+1, sx, mantleY);
    });

    // Candle at current position
    const cX = mantleX + mantleW * STUD_POSITIONS[s.puzzles.candle.pos];
    const fl = Math.sin(CP.flick * 3.7) * 1.5;
    _drawCandleAt(ctx, cX, mantleY-6, fl, CP.drag);

    // Status text
    const statusLine = correct
      ? `The shadow falls on "${CHARGES[0].name}" — the first charge. Move to record.`
      : 'Drag the candelabra between the brass studs. Watch the shadow.';
    ctx.fillStyle = correct ? C.amber : C.creamDim;
    ctx.font = 'italic 11px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(statusLine, W/2, py+ph-32);

    // Confirm button when correct
    let confirmR = null;
    if (correct && !s.puzzles.candle.solved) {
      ctx.fillStyle = 'rgba(28,46,14,0.92)'; rr(ctx, W/2-65, py+ph-22, 130, 30, 4); ctx.fill();
      ctx.strokeStyle = C.green; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.green; ctx.font = 'bold 11px Georgia,serif'; ctx.textBaseline = 'middle';
      ctx.fillText('MARK POSITION', W/2, py+ph-7);
      confirmR = { x: W/2-65, y: py+ph-22, w: 130, h: 30 };
    }

    ctx.fillStyle = C.goldDim; ctx.font = '11px Georgia,serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('✕ CLOSE', px+pw-12, py+16);

    s._cpR = {
      panel: {x:px,y:py,w:pw,h:ph},
      close: {x:px+pw-80,y:py,w:80,h:28},
      candle: {x:cX-22,y:mantleY-52,w:44,h:60},
      mantle: {x:mantleX,y:mantleY-6,w:mantleW,h:12},
      confirmR,
    };
  }

  function _drawCandleAt(ctx, x, y, flicker, dragging) {
    ctx.fillStyle = '#d4c4a0'; ctx.fillRect(x-5,y-38,10,38);
    ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x,y-38); ctx.lineTo(x,y-44); ctx.stroke();
    ctx.save(); ctx.translate(x, y-46+flicker);
    const fl = ctx.createRadialGradient(0,0,0,0,-5,11);
    fl.addColorStop(0,'rgba(255,220,80,0.92)'); fl.addColorStop(1,'rgba(220,80,10,0)');
    ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(0,2); ctx.bezierCurveTo(-6,-5,-4,-16,0,-20); ctx.bezierCurveTo(4,-16,6,-5,0,2); ctx.fill();
    ctx.restore();
    // Glow
    const g = ctx.createRadialGradient(x,y-28,0,x,y-28,36);
    g.addColorStop(0,'rgba(200,130,40,0.11)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y-28,36,0,TAU); ctx.fill();
    // Base
    ctx.fillStyle = dragging ? C.goldDim : '#3a2a18';
    ctx.beginPath(); ctx.ellipse(x,y+3,14,5,0,0,TAU); ctx.fill();
  }

  function cpDown(px, py, s) {
    const r = s._cpR; if (!r) return false;
    if (_hit(px,py,r.close)) { _closePuzzle(); return true; }
    if (r.confirmR && _hit(px,py,r.confirmR)) {
      s.puzzles.candle.solved = true;
      if (s.mode !== 'paid') notify(s, "Position marked. The shadow points to the first charge.", 'item');
      const l = northcottSay(s, 'candle_correct'); if (l) _dlg(s, l);
      SND.correct();
      setTimeout(() => _closePuzzle(), 1100);
      return true;
    }
    if (_hit(px,py,r.candle) || _hit(px,py,r.mantle)) { CP.drag = true; CP.dragOX = px; SND.candle(); return true; }
    return false;
  }
  function cpMove(px, py, s) {
    if (!CP.drag || !s._cpR) return;
    const r = s._cpR;
    const nx = clamp((px - r.mantle.x) / r.mantle.w, 0, 1);
    let near = 0, nearD = Infinity;
    STUD_POSITIONS.forEach((p,i) => { const d = Math.abs(nx-p); if(d<nearD){nearD=d;near=i;} });
    if (near !== s.puzzles.candle.pos) { s.puzzles.candle.pos = near; SND.candle(); }
  }
  function cpUp() { CP.drag = false; }

  /* ── COAT OF ARMS PUZZLE ────────────────────────────────────────────────── */
  let AP = { animT: 0, wrongFlash: 0 };

  function apRender(ctx, W, H, s) {
    AP.animT += 0.03; if(AP.wrongFlash>0) AP.wrongFlash--;
    const pw = Math.min(W*0.86,480), ph = Math.min(H*0.70,420), px = W/2-pw/2, py = H/2-ph/2;
    ctx.fillStyle = C.overlay; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = C.panel; rr(ctx,px,py,pw,ph,8); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; rr(ctx,px,py,pw,ph,8); ctx.stroke();
    if(AP.wrongFlash>0){ctx.fillStyle=`rgba(100,20,20,${AP.wrongFlash/30*0.26})`;ctx.fillRect(px,py,pw,ph);}

    ctx.fillStyle = C.gold; ctx.font = 'italic 15px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('The Ashworth Coat of Arms', W/2, py+28);

    // Shield
    const sCx = W/2, sCy = py+ph*0.44, sH = ph*0.50;
    ctx.fillStyle = 'rgba(18,10,6,0.88)';
    ctx.beginPath();
    ctx.moveTo(sCx-sH*0.52,sCy-sH*0.50); ctx.lineTo(sCx+sH*0.52,sCy-sH*0.50);
    ctx.lineTo(sCx+sH*0.52,sCy+sH*0.08); ctx.lineTo(sCx,sCy+sH*0.50);
    ctx.lineTo(sCx-sH*0.52,sCy+sH*0.08); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.goldDim; ctx.lineWidth = 2; ctx.stroke();

    // "By precedence of founding" inscription below shield
    ctx.fillStyle = C.goldDim; ctx.font = 'italic 10px Georgia,serif';
    ctx.fillText('"By precedence of founding"', W/2, sCy+sH*0.52+18);

    // Three charges in shuffled visual positions
    const tapped = s.puzzles.arms.tapped;
    s._apR = { close:{x:px+pw-80,y:py,w:80,h:28}, charges:[] };

    [0,1,2].forEach(visualPos => {
      const chargeIdx = s.sol.shieldPos[visualPos]; // which charge is at this visual position
      const charge = CHARGES[chargeIdx];
      const chX = sCx - sH*0.36 + visualPos*sH*0.36;
      const chY = sCy;
      const cR = sH*0.14;
      const isTapped = tapped.includes(chargeIdx);
      const tapOrd = tapped.indexOf(chargeIdx);
      const isFirst = chargeIdx === 0 && s.puzzles.candle.solved; // lion = first, revealed by candle
      const isNext = tapped.length > 0 && chargeIdx === 1 && tapped.includes(0); // cross after lion

      ctx.beginPath(); ctx.arc(chX,chY,cR,0,TAU);
      ctx.fillStyle = isTapped ? 'rgba(18,48,18,0.7)' : (isFirst && !isTapped ? 'rgba(48,32,6,0.6)' : 'rgba(14,9,18,0.7)');
      ctx.fill();
      ctx.strokeStyle = isTapped ? C.green : (isFirst && !isTapped ? C.amber : C.goldDim);
      ctx.lineWidth = isTapped ? 2.5 : (isFirst ? 1.5 : 1); ctx.stroke();

      ctx.fillStyle = isTapped ? C.green : (isFirst ? C.amber : C.goldDim);
      ctx.font = `${cR*0.8}px Georgia,serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(charge.symbol, chX, chY);

      ctx.fillStyle = isTapped ? C.green : C.creamDim;
      ctx.font = '9px Georgia,serif'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(charge.name, chX, chY+cR+14);

      if(isTapped){ctx.fillStyle=C.green;ctx.font='bold 12px Georgia,serif';ctx.textBaseline='middle';ctx.fillText(tapOrd+1,chX,chY);}

      // Pulse if next expected
      if(!isTapped && ((tapped.length===0 && chargeIdx===0) || (tapped.length===1 && chargeIdx===1) || (tapped.length===2 && chargeIdx===2))){
        const p = 0.4+0.4*Math.sin(AP.animT*3);
        ctx.strokeStyle=C.gold; ctx.lineWidth=1; ctx.globalAlpha=p*0.45;
        ctx.beginPath(); ctx.arc(chX,chY,cR+9,0,TAU); ctx.stroke(); ctx.globalAlpha=1;
      }

      s._apR.charges.push({x:chX-cR,y:chY-cR,w:cR*2,h:cR*2,chargeIdx});
    });

    const prog = tapped.length;
    ctx.fillStyle = prog>0?C.amber:C.creamDim; ctx.font='italic 11px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillText(
      s.puzzles.arms.solved ? 'Correct. The case is unlocked.' :
      prog===0 ? 'Tap the charges in order of precedence — oldest founding first.' :
      `${prog} of 3 — continue`,
      W/2, py+ph-14);

    ctx.fillStyle=C.goldDim; ctx.font='11px Georgia,serif'; ctx.textAlign='right'; ctx.fillText('✕ CLOSE',px+pw-12,py+16);
  }

  function apDown(px, py, s) {
    const r = s._apR; if(!r) return false;
    if(_hit(px,py,r.close)){_closePuzzle();return true;}
    for(const ch of(r.charges||[])){
      if(_hit(px,py,ch)){
        const tapped=s.puzzles.arms.tapped;
        if(tapped.includes(ch.chargeIdx))return true;
        SND.armsTap();
        // Correct order is always 0 (lion) → 1 (cross) → 2 (star)
        if(ch.chargeIdx===tapped.length){
          tapped.push(ch.chargeIdx);
          if(tapped.length===3){
            s.puzzles.arms.solved=true; SND.armsOpen(); HAP.heavy();
            if(s.mode!=='paid') notify(s,'The charges are correct. The case responds — a faint click from across the room.','item');
            const l=northcottSay(s,'arms_solved');if(l)_dlg(s,l);
            setTimeout(()=>_closePuzzle(),1200);
          }
        } else {
          s.puzzles.arms.tapped=[]; AP.wrongFlash=28; SND.wrong(); HAP.wrong();
          if(s.mode!=='paid') notify(s,'Wrong charge. The sequence resets.','examine');
          const l=northcottSay(s,'arms_wrong');if(l)_dlg(s,l);
        }
        return true;
      }
    }
    return false;
  }

  /* ── CASE PUZZLE ─────────────────────────────────────────────────────────── */
  const SWORD_INSCRIPTION = "Presented in recognition of service rendered.\nThe bearer did not seek distinction.\nDistinction found him regardless.\n\nThe blade serves twice.\n\nSociety of Night  ·  Est. MDCCCXLVII\n\nReceived by C. Grey";

  let CSP = { stage:0, animT:0, drag:false, dsX:0, rotA:0, slideX:0, pressT:0, stepAnim:0 };
  function cspOpen(s) { CSP.stage=s.puzzles.case.stage||0; CSP.animT=0; CSP.drag=false; CSP.rotA=0; CSP.slideX=0; CSP.pressT=0; CSP.stepAnim=0; }
  function cspRender(ctx, W, H, s) {
    CSP.animT+=0.025; if(CSP.stepAnim>0)CSP.stepAnim--;
    const pw=Math.min(W*0.90,460),ph=Math.min(H*0.72,440),px=W/2-pw/2,py=H/2-ph/2;
    ctx.fillStyle=C.overlay;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=C.panel;rr(ctx,px,py,pw,ph,8);ctx.fill();
    ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;rr(ctx,px,py,pw,ph,8);ctx.stroke();

    if(s.puzzles.case.solved){_cspSolved(ctx,W,H,px,py,pw,ph,s);return;}

    const stages=s.sol.caseGestures;
    stages.forEach((_,i)=>{
      const dx=W/2-((stages.length-1)*26)/2+i*26,dy=py+18;
      ctx.beginPath();ctx.arc(dx,dy,7,0,TAU);
      ctx.fillStyle=i<CSP.stage?C.green:(i===CSP.stage?C.gold:'#2a2830');ctx.fill();
    });

    const g=stages[CSP.stage],names={rotate:'Rotate the outer ring',slide:'Slide the glass panel',press:'Press the central boss'};
    ctx.fillStyle=C.gold;ctx.font='italic 16px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(names[g]||g,W/2,py+44);
    if(CSP.stepAnim>0){ctx.fillStyle=`rgba(50,100,50,${CSP.stepAnim/30*0.24})`;ctx.fillRect(px,py,pw,ph);}

    const cCx=W/2,cCy=py+ph*0.50,cW=pw*0.55,cH=ph*0.38;
    if(g==='rotate')_cspRotate(ctx,cCx,cCy,cW,cH);
    else if(g==='slide')_cspSlide(ctx,cCx,cCy,cW,cH);
    else _cspPress(ctx,cCx,cCy,cW,cH);

    const hints={rotate:'The outer ring seals the case. Drag in a circle to break the seal.',slide:'The glass panel slides. Drag it right to expose the latch beneath.',press:'The central boss springs the latch. Press and hold it down.'};
    ctx.fillStyle=C.creamDim;ctx.font='italic 11px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(hints[g]||'',W/2,py+ph-14);
    ctx.fillStyle=C.goldDim;ctx.font='11px Georgia,serif';ctx.textAlign='right';ctx.fillText('✕ CLOSE',px+pw-12,py+16);

    s._cspR={close:{x:px+pw-80,y:py,w:80,h:28},interact:{x:cCx-cW/2-20,y:cCy-cH/2-20,w:cW+40,h:cH+40}};
  }
  function _cspRotate(ctx,cx,cy,cw,ch){
    const r=Math.min(cw,ch)*0.45;
    // Outer track
    ctx.strokeStyle='#2a2530';ctx.lineWidth=22;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
    // Grip texture — 12 knurled segments
    for(let i=0;i<12;i++){
      const a=(i/12)*TAU;
      const lit=Math.abs(Math.sin((a-CSP.rotA)*6))*0.6;
      ctx.strokeStyle=`rgba(80,70,90,${0.4+lit*0.5})`;ctx.lineWidth=18;
      ctx.beginPath();ctx.arc(cx,cy,r,a+0.05,a+(TAU/12)-0.05);ctx.stroke();
    }
    // Active arc
    ctx.strokeStyle=C.gold;ctx.lineWidth=5;
    ctx.beginPath();ctx.arc(cx,cy,r,CSP.rotA-0.35,CSP.rotA+0.35);ctx.stroke();
    // 12 notch marks
    for(let i=0;i<12;i++){
      const a=(i/12)*TAU+CSP.rotA;
      const atSnap=Math.abs((CSP.rotA%(TAU/12)))<0.08;
      ctx.strokeStyle=atSnap&&i===0?C.gold:C.goldDim;ctx.lineWidth=atSnap&&i===0?2.5:1.5;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(r-14),cy+Math.sin(a)*(r-14));ctx.lineTo(cx+Math.cos(a)*(r+14),cy+Math.sin(a)*(r+14));ctx.stroke();
    }
    // Inner box
    ctx.fillStyle='#14101a';rr(ctx,cx-cw*0.26,cy-ch*0.26,cw*0.52,ch*0.52,4);ctx.fill();
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=1;ctx.stroke();
    // Rotation indicator
    const pct=Math.round(Math.abs(CSP.rotA)/TAU*100);
    ctx.fillStyle=pct>85?C.gold:C.goldDim;
    ctx.font=`bold ${pct>85?13:11}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(pct>85?'RELEASE':`${pct}%`,cx,cy);
    // Resistance feel — add visual spring effect near threshold
    if(pct>70){
      ctx.strokeStyle=`rgba(200,160,50,${(pct-70)/30*0.4})`;ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(cx,cy,r+18,0,TAU);ctx.stroke();
    }
  }
  function _cspSlide(ctx,cx,cy,cw,ch){
    ctx.fillStyle='#1a1218';rr(ctx,cx-cw*0.48,cy-ch*0.18,cw*0.96,ch*0.36,4);ctx.fill();ctx.strokeStyle=C.goldDim;ctx.lineWidth=1;ctx.stroke();
    ctx.strokeStyle='#0e0c12';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-cw*0.44,cy);ctx.lineTo(cx+cw*0.44,cy);ctx.stroke();
    const pX=cx-cw*0.35+CSP.slideX*cw*0.65;
    ctx.fillStyle='#3c3848';rr(ctx,pX-28,cy-ch*0.14,56,ch*0.28,3);ctx.fill();ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=C.goldDim;ctx.font='18px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('→',pX+36,cy);
    ctx.strokeStyle=C.green;ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(cx+cw*0.32,cy-ch*0.18);ctx.lineTo(cx+cw*0.32,cy+ch*0.18);ctx.stroke();ctx.setLineDash([]);
  }
  function _cspPress(ctx,cx,cy,cw,ch){
    const r=Math.min(cw,ch)*0.32;
    if(CSP.pressT>0){const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.5);g.addColorStop(0,`rgba(200,160,50,${CSP.pressT*0.17})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r*1.5,0,TAU);ctx.fill();}
    ctx.fillStyle=CSP.pressT>0?C.amber:'#2a2830';ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill();
    ctx.strokeStyle=CSP.pressT>0?C.gold:C.goldDim;ctx.lineWidth=CSP.pressT>0?2.5:1.5;ctx.stroke();
    if(CSP.pressT>0){ctx.strokeStyle=C.gold;ctx.lineWidth=6;ctx.beginPath();ctx.arc(cx,cy,r+10,-Math.PI/2,-Math.PI/2+CSP.pressT*TAU);ctx.stroke();}
    ctx.fillStyle=CSP.pressT>0.5?C.gold:C.goldDim;ctx.font=`${r*0.7}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⚜',cx,cy);
  }
  function _cspSolved(ctx,W,H,px,py,pw,ph,s){
    ctx.fillStyle=C.gold;ctx.font='italic bold 20px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText('The case is open.',W/2,py+40);
    const sx=W/2,sl=ph*0.28,sy=py+ph*0.44;
    ctx.strokeStyle=C.gold;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,sy-sl/2);ctx.lineTo(sx,sy+sl/2);ctx.stroke();
    ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(sx-sl*0.22,sy-sl*0.04);ctx.lineTo(sx+sl*0.22,sy-sl*0.04);ctx.stroke();
    ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(sx,sy+sl/2+5,4,0,TAU);ctx.fill();
    let iy = py+ph*0.64;
    SWORD_INSCRIPTION.split('\n').forEach((ln,i) => {
      const isCallum = ln==='Received by C. Grey';
      ctx.fillStyle = isCallum ? C.goldBright : C.goldDim;
      ctx.font = isCallum ? 'italic bold 11px Georgia,serif' : 'italic 10px Georgia,serif';
      ctx.textAlign='center';ctx.textBaseline='alphabetic';
      if(ln!=='')ctx.fillText(ln,W/2,iy);
      iy+=ln===''?8:14;
    });
    ctx.fillStyle=C.goldDim;ctx.font='11px Georgia,serif';ctx.textAlign='right';ctx.fillText('✕ CLOSE',px+pw-12,py+16);
    s._cspR={close:{x:px+pw-80,y:py,w:80,h:28}};
  }
  function cspDown(px,py,W,H,s){
    const r=s._cspR;if(!r)return false;
    if(_hit(px,py,r.close)){_closePuzzle();return true;}
    if(s.puzzles.case.solved)return false;
    if(_hit(px,py,r.interact)){CSP.drag=true;CSP.dsX=px;return true;}
    return false;
  }
  function cspMove(px,py,W,H,s){
    if(!CSP.drag||s.puzzles.case.solved)return;
    const g=s.sol.caseGestures[CSP.stage],cCx=W/2,cCy=H/2+20;
    if(g==='rotate'){CSP.rotA=Math.atan2(py-cCy,px-cCx);if(Math.abs(CSP.rotA)/TAU>0.9)_cspStep(s);}
    else if(g==='slide'){const r=s._cspR;CSP.slideX=clamp((px-CSP.dsX)/(r.interact?r.interact.w*0.6:200),0,1);if(CSP.slideX>0.88)_cspStep(s);}
  }
  function cspUp(){CSP.drag=false;}
  function cspPressStart(px,py,s){
    const r=s._cspR;return r&&r.interact&&_hit(px,py,r.interact)&&s.sol.caseGestures[CSP.stage]==='press';
  }
  let _pressing=false;
  function cspPressTick(s,holding){
    if(!holding){CSP.pressT=Math.max(0,CSP.pressT-0.04);return;}
    if(s.sol.caseGestures[CSP.stage]!=='press')return;
    CSP.pressT=Math.min(1,CSP.pressT+0.018);if(CSP.pressT>=1)_cspStep(s);
  }
  function _cspStep(s){
    CSP.stage++;s.puzzles.case.stage=CSP.stage;CSP.stepAnim=30; HAP.caseClick(); const _stageG=s.sol.caseGestures[CSP.stage-1]; if(_stageG==='rotate')SND.caseRotate(); else if(_stageG==='slide')SND.caseSlide(); else SND.casePress();
    CSP.rotA=0;CSP.slideX=0;CSP.pressT=0;CSP.drag=false;
    if(CSP.stage>=s.sol.caseGestures.length){
      s.puzzles.case.solved=true;addItem(s,'sword');SND.caseOpen();HAP.rumble();
      s._discovery='blade_serves_twice';s._discoveryFade=0;HAP.discovery();
      const l=northcottSay(s,'case_solved');if(l)_dlg(s,l);
    }
  }

  /* =========================================================================
   * PUZZLE ROUTING
   * ======================================================================= */
  let _activePuzzle = null;

  function _openPuzzle(id) {
    _activePuzzle = id;
    // Enable canvas touch interception for puzzle overlay
    if (_canvas) {
      _canvas.style.pointerEvents = 'auto';
      _canvas.style.touchAction   = 'none';
      _canvas.addEventListener('mousedown',  _onDown);
      _canvas.addEventListener('mousemove',  _onMove);
      _canvas.addEventListener('mouseup',    _onUp);
      _canvas.addEventListener('touchstart', _onDown, { passive: false });
      _canvas.addEventListener('touchmove',  _onMove, { passive: false });
      _canvas.addEventListener('touchend',   _onUp,   { passive: false });
    }
    if (id === 'case' && _state) cspOpen(_state);
    _framesSince = 0;
    SND.tap();
  }
  function _closePuzzle() {
    _activePuzzle = null; _pressing = false; _framesSince = 0;
    // Return canvas to passthrough so manor can pan again
    if (_canvas) {
      _canvas.style.pointerEvents = 'none';
      _canvas.style.touchAction   = '';
      _canvas.removeEventListener('mousedown',  _onDown);
      _canvas.removeEventListener('mousemove',  _onMove);
      _canvas.removeEventListener('mouseup',    _onUp);
      _canvas.removeEventListener('touchstart', _onDown);
      _canvas.removeEventListener('touchmove',  _onMove);
      _canvas.removeEventListener('touchend',   _onUp);
    }
  }

  function puzzleDown(e, px, py, W, H, s) {
    if (!_activePuzzle) return false;
    if (_activePuzzle === 'candle')  return cpDown(px, py, s);
    if (_activePuzzle === 'arms')    return apDown(px, py, s);
    if (_activePuzzle === 'case') {
      if (cspPressStart(px, py, s)) _pressing = true;
      return cspDown(px, py, W, H, s);
    }
    return false;
  }
  function puzzleMove(e, px, py, W, H, s) {
    if (!_activePuzzle) return;
    if (_activePuzzle === 'candle') cpMove(px, py, s);
    if (_activePuzzle === 'case')   cspMove(px, py, W, H, s);
  }
  function puzzleUp(e, px, py, s) {
    if (!_activePuzzle) return;
    _pressing = false;
    if (_activePuzzle === 'candle') cpUp();
    if (_activePuzzle === 'case')   cspUp();
  }
  function puzzleRender(ctx, W, H, s) {
    if (!_activePuzzle) return;
    if (_activePuzzle === 'candle') cpRender(ctx, W, H, s);
    if (_activePuzzle === 'arms')   apRender(ctx, W, H, s);
    if (_activePuzzle === 'case')   cspRender(ctx, W, H, s);
  }

  /* =========================================================================
   * OVERLAY RENDERING — drawn on transparent canvas over room image
   * ======================================================================= */
  let _layout = null;

  function _getLiveScrollX() {
    // Read actual pixel offset of room bg from screen left edge
    if (typeof window.getArmoryScrollX === 'function') return window.getArmoryScrollX();
    // Fallback: read bg element directly
    const roomId = (window.gameState && window.gameState.currentRoom) || '';
    const room = document.getElementById('room-' + roomId);
    const bg = room ? room.querySelector('.room-bg') : null;
    if (bg) { const r = bg.getBoundingClientRect(); return Math.max(0, -r.left); }
    return 0;
  }

  function renderOverlay(ctx, W, H, s, animT) {
    // Read live scroll position each frame — room may be panning
    s._scrollX = _getLiveScrollX();
    _layout = imgLayout(W, H);
    const L = _layout;

    // ── Fireplace — multi-layer realistic flicker ──────────────────────────
    const fx=L.imgX+L.imgW*0.500, fy=L.imgY+L.imgH*0.72, fr=L.imgH*0.22;
    // Paid: fire is lower — room feels colder
    const _fireMult = (s && s.mode==='paid') ? 0.45 : 1.0;
    const flk1=(0.08+0.05*Math.sin(animT*7.3)+0.02*Math.sin(animT*17.1))*_fireMult;
    const flk2=(0.05+0.03*Math.sin(animT*11.7+1.2))*_fireMult;
    // Core heat
    const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,fr*0.4);
    fg.addColorStop(0,`rgba(255,180,50,${flk1*1.4})`); fg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fg; ctx.fillRect(fx-fr*0.4,fy-fr*0.4,fr*0.8,fr*0.8);
    // Outer glow
    const fg2=ctx.createRadialGradient(fx,fy,0,fx,fy,fr);
    fg2.addColorStop(0,`rgba(220,100,20,${flk1})`); fg2.addColorStop(0.5,`rgba(160,60,10,${flk2})`); fg2.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fg2; ctx.fillRect(fx-fr,fy-fr,fr*2,fr*2);
    // Light cast on ceiling
    const fc=ctx.createRadialGradient(fx,L.imgY,0,fx,L.imgY,L.imgW*0.3);
    fc.addColorStop(0,`rgba(180,80,20,${flk1*0.12})`); fc.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fc; ctx.fillRect(L.imgX,L.imgY,L.imgW,L.imgH*0.15);

    // ── Candle flames — animated on image candelabras ────────────────────
    [[0.390,0.165],[0.610,0.165]].forEach(([xf,yf],ci)=>{
      const cx=L.imgX+L.imgW*xf, cy=L.imgY+L.imgH*yf;
      const fl=Math.sin(animT*(3.7+ci*1.3)+ci*2.1)*1.8;
      // Flame body
      ctx.save(); ctx.translate(cx, cy+fl);
      const fg3=ctx.createRadialGradient(0,0,0,0,-L.imgH*0.022,L.imgH*0.028);
      fg3.addColorStop(0,`rgba(255,230,100,${0.70+0.15*Math.sin(animT*5.1+ci)})`);
      fg3.addColorStop(0.6,'rgba(255,120,20,0.4)'); fg3.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=fg3;
      ctx.beginPath(); ctx.moveTo(0,L.imgH*0.010);
      ctx.bezierCurveTo(-L.imgH*0.006,-L.imgH*0.008,-L.imgH*0.004,-L.imgH*0.025,0,-L.imgH*0.030);
      ctx.bezierCurveTo(L.imgH*0.004,-L.imgH*0.025,L.imgH*0.006,-L.imgH*0.008,0,L.imgH*0.010);
      ctx.fill(); ctx.restore();
      // Halo
      const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,L.imgH*0.07);
      const _candleMult=(s&&s.mode==='paid')?0.35:1.0;
      gr.addColorStop(0,`rgba(255,200,80,${(0.10+0.04*Math.sin(animT*4.1+ci))*_candleMult})`); gr.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(cx,cy,L.imgH*0.07,0,TAU); ctx.fill();
    });

    // ── Dust motes — subtle particle layer ──────────────────────────────
    ctx.save();
    for(let d=0;d<8;d++){
      const dx=L.imgX+L.imgW*(0.15+0.70*((Math.sin(animT*0.3+d*1.7)*0.5+0.5)));
      const dy=L.imgY+L.imgH*(0.10+0.60*((Math.sin(animT*0.2+d*2.3)*0.5+0.5)));
      const alpha=0.04+0.03*Math.sin(animT*1.1+d*0.9);
      ctx.fillStyle=`rgba(220,200,160,${alpha})`;
      ctx.beginPath(); ctx.arc(dx,dy,1.2,0,TAU); ctx.fill();
    }
    ctx.restore();

    // Hidden panel glow (sequence solved)
    if(s.puzzles.sequence.solved&&!s.escaped){
      const ppx=L.imgX+L.imgW*0.23, ppy=L.imgY+L.imgH*0.28, ppw=L.imgW*0.09, pph=L.imgH*0.44;
      const alpha=s.puzzles.sequence.panelOpen?0.22+0.08*Math.sin(animT*1.5):0.10+0.05*Math.sin(animT*2);
      ctx.strokeStyle=`rgba(74,154,74,${alpha})`; ctx.lineWidth=2; ctx.strokeRect(ppx,ppy,ppw,pph);
      if(s.puzzles.sequence.panelOpen){ctx.fillStyle=`rgba(74,154,74,${alpha*0.28})`; ctx.fillRect(ppx,ppy,ppw,pph);}
    }

    // Arms shimmer (candle solved, arms not yet)
    if(s.puzzles.candle.solved&&!s.puzzles.arms.solved){
      const ax=L.imgX+L.imgW*0.39, ay=L.imgY+L.imgH*0.00, aw=L.imgW*0.22, ah=L.imgH*0.27;
      const alpha=0.07+0.05*Math.sin(animT*1.8);
      ctx.strokeStyle=`rgba(200,160,50,${alpha})`; ctx.lineWidth=2; ctx.strokeRect(ax,ay,aw,ah);
    }

    // Door glow — pulsing to draw attention if key in inventory
    if(hasItem(s,'key')&&!s.escaped){
      const dx=L.imgX, dy=L.imgY+L.imgH*0.15, dw=L.imgW*0.038, dh=L.imgH*0.68;
      const alpha=0.12+0.08*Math.sin(animT*2.2);
      ctx.strokeStyle=`rgba(200,160,50,${alpha})`; ctx.lineWidth=2; ctx.strokeRect(dx,dy,dw,dh);
      const gr=ctx.createRadialGradient(dx+dw/2,dy+dh/2,0,dx+dw/2,dy+dh/2,dw*2);
      gr.addColorStop(0,`rgba(200,160,50,${alpha*0.4})`); gr.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gr; ctx.fillRect(dx,dy,dw*4,dh);
    }

    // Room state changes — visual feedback on the actual room
    _drawRoomStateChanges(ctx, L, s, animT);

    // Northcott speaks via dialogue text only — no silhouette drawn

    // Hotspot markers
    _drawHotspots(ctx, W, H, L, s, animT);

    // Dialogue
    if(s.mode==='prologue'&&s._dlg&&s._dlgF>0) _drawDialogue(ctx,W,H,s);

    // Inventory
    _drawInventory(ctx,W,H,s);

    // Notifications
    _drawNotifications(ctx,W,H,s);

    // HUD
    _drawHUD(ctx,W,H,s);
    // Tutorial (prologue + free, first session only)
    if(s.mode!=='paid'&&!_tutorialDone) _drawTutorial(ctx,W,H);
  }

  function _drawRoomStateChanges(ctx, L, s, animT) {
    // ── Panel state ─────────────────────────────────────────────────────
    if (s.puzzles.sequence.panelOpen) {
      // Panel open — dark void + green edge light
      const px=L.imgX+L.imgW*0.232, py=L.imgY+L.imgH*0.285;
      const pw=L.imgW*0.082, ph=L.imgH*0.430;
      // Dark interior of panel void
      ctx.fillStyle='rgba(4,2,6,0.85)'; ctx.fillRect(px,py,pw,ph);
      // Green edge glow — panel is open
      ctx.strokeStyle=`rgba(74,154,74,${0.55+0.15*Math.sin(animT*1.8)})`; ctx.lineWidth=2;
      ctx.strokeRect(px,py,pw,ph);
      // Interior detail — key hook visible if key not taken
      if(!hasItem(s,'key')){
        const kx=px+pw*0.50, ky=py+ph*0.32;
        ctx.fillStyle=`rgba(180,140,60,${0.7+0.15*Math.sin(animT*2.2)})`;
        ctx.beginPath(); ctx.arc(kx,ky,6,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(200,160,80,0.8)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(kx,ky); ctx.lineTo(kx,ky+18); ctx.stroke();
      }
    }

    // ── Case state — gold glow when unlocked ────────────────────────────
    if(s.puzzles.arms.solved && !s.puzzles.case.solved){
      const cx=L.imgX+L.imgW*0.78, cy=L.imgY+L.imgH*0.48;
      const cw=L.imgW*0.20, ch=L.imgH*0.27;
      const alpha=0.18+0.10*Math.sin(animT*2.8);
      ctx.strokeStyle=`rgba(200,160,50,${alpha})`; ctx.lineWidth=2.5;
      ctx.strokeRect(cx,cy,cw,ch);
      const g=ctx.createRadialGradient(cx+cw/2,cy+ch/2,0,cx+cw/2,cy+ch/2,cw*0.6);
      g.addColorStop(0,`rgba(200,160,50,${alpha*0.4})`); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(cx,cy,cw,ch);
    }

    // ── Case open — sword visible inside ────────────────────────────────
    if(s.puzzles.case.solved){
      const cx=L.imgX+L.imgW*0.78, cy=L.imgY+L.imgH*0.48;
      const cw=L.imgW*0.20, ch=L.imgH*0.27;
      ctx.fillStyle='rgba(10,8,4,0.55)'; ctx.fillRect(cx,cy,cw,ch*0.3);
      const sx=cx+cw*0.50, sy=cy+ch*0.18, sl=ch*0.65;
      ctx.strokeStyle=`rgba(200,170,80,0.82)`; ctx.lineWidth=3; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx,sy+sl); ctx.stroke();
      ctx.lineWidth=7;
      ctx.beginPath(); ctx.moveTo(sx-cw*0.16,sy+sl*0.28); ctx.lineTo(sx+cw*0.16,sy+sl*0.28); ctx.stroke();
    }

    // ── Door state — crack of light when unjammed ───────────────────────
    if(!s.doorJammed && !s.escaped && hasItem(s,'key')){
      const dx=L.imgX, dy=L.imgY+L.imgH*0.15, dh=L.imgH*0.68;
      const glow=ctx.createLinearGradient(dx,0,dx+L.imgW*0.06,0);
      glow.addColorStop(0,`rgba(200,180,120,${0.18+0.06*Math.sin(animT*3)})`);
      glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=glow; ctx.fillRect(dx,dy,L.imgW*0.06,dh);
    }

    // ── Escaped — door open wide, bright daylight ────────────────────────
    if(s.escaped){
      const dx=L.imgX, dy=L.imgY, dh=L.imgH;
      const g=ctx.createLinearGradient(dx,0,dx+L.imgW*0.18,0);
      g.addColorStop(0,'rgba(220,200,160,0.45)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(dx,dy,L.imgW*0.18,dh);
    }

    // ── Discovery overlay — "the blade serves twice" ─────────────────────
    if(s._discovery && s._discoveryFade !== undefined){
      s._discoveryFade=Math.min(1,s._discoveryFade+0.03);
      const W=ctx.canvas.width, H=ctx.canvas.height;
      const pw=Math.min(W*0.80,380), ph=180, px=W/2-pw/2, py=H/2-ph/2;
      ctx.globalAlpha=s._discoveryFade*0.96;
      ctx.fillStyle='rgba(6,4,8,0.98)'; rr(ctx,px,py,pw,ph,6); ctx.fill();
      ctx.strokeStyle='#c9a84c'; ctx.lineWidth=1.5; rr(ctx,px,py,pw,ph,6); ctx.stroke();
      const dc=_discoveryContent(s._discovery)||{label:'',lines:[],sub:[],cta:'[ TAP ]'};
      ctx.fillStyle='#6a5520'; ctx.font='italic 9px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText(dc.label,W/2,py+20);
      ctx.strokeStyle='#6a5520'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(px+24,py+28); ctx.lineTo(px+pw-24,py+28); ctx.stroke();
      ctx.fillStyle='#e8d8a8'; ctx.font='italic bold 15px Georgia,serif';
      let dy2=py+56; dc.lines.forEach(ln=>{if(ln===''){dy2+=8;return;}ctx.fillText(ln,W/2,dy2);dy2+=22;});
      ctx.fillStyle='#8a8070'; ctx.font='italic 11px Georgia,serif';
      dc.sub.forEach((ln,i)=>ctx.fillText(ln,W/2,dy2+8+i*18));
      ctx.fillStyle='#c9a84c'; ctx.font='bold 11px Georgia,serif';
      ctx.fillText(dc.cta,W/2,py+148);
      ctx.globalAlpha=1;
      // Hit rect for dismiss
      s._discoveryRect={x:px,y:py,w:pw,h:ph};
      SND.discovery && SND.discovery();
    }
  }

  // Separate discovery content by type
  function _discoveryContent(type) {
    if (type === 'blade_serves_twice') return {
      label: 'INSCRIPTION — BASE OF CASE',
      lines: ['"The blade serves twice."'],
      sub: ['The dress sword is in your inventory.', 'The door lock mechanism is still jammed.'],
      cta: '[ TAP TO CONTINUE ]',
    };
    if (type === 'northcott_floor_note') return {
      label: 'NOTE — FLOOR, NEAR THE DOOR',
      lines: ['"I got out.', '', '— N"'],
      sub: ['The handwriting is precise.', 'He left nothing else.'],
      cta: '[ TAP TO CONTINUE ]',
    };
    return null;
  }

  // Patch _drawRoomStateChanges to use content function
  // (already renders generically — this is for future extensibility)
  function _noop() {
  }

  function _drawNorthcott(ctx, L, animT) {
    const nx=L.imgX+L.imgW*0.960, ny=L.imgY+L.imgH*0.22, nh=L.imgH*0.58;
    const sc=nh*0.006, br=Math.sin(animT*0.8)*1.5;
    ctx.save(); ctx.translate(0,br); ctx.fillStyle='#c8b890'; ctx.globalAlpha=0.50;
    ctx.beginPath();ctx.arc(nx,ny+nh*0.08,9*sc,0,TAU);ctx.fill();
    ctx.beginPath();ctx.moveTo(nx-6*sc,ny+nh*0.17);ctx.lineTo(nx+6*sc,ny+nh*0.17);ctx.lineTo(nx+7*sc,ny+nh*0.56);ctx.lineTo(nx-7*sc,ny+nh*0.56);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c8b890';ctx.lineWidth=4*sc;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(nx-6*sc,ny+nh*0.24);ctx.lineTo(nx-14*sc,ny+nh*0.40);ctx.stroke();
    ctx.beginPath();ctx.moveTo(nx+6*sc,ny+nh*0.24);ctx.lineTo(nx+12*sc,ny+nh*0.34);ctx.stroke();
    ctx.lineWidth=5*sc;
    ctx.beginPath();ctx.moveTo(nx-2*sc,ny+nh*0.56);ctx.lineTo(nx-3*sc,ny+nh*0.88);ctx.stroke();
    ctx.beginPath();ctx.moveTo(nx+2*sc,ny+nh*0.56);ctx.lineTo(nx+3*sc,ny+nh*0.88);ctx.stroke();
    ctx.globalAlpha=1;
    ctx.fillStyle=C.goldDim;ctx.font='9px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText('NORTHCOTT',nx,ny+nh+12);
    ctx.restore();
  }

  function _drawHotspots(ctx, W, H, L, s, animT) {
    s._hotspots = [];
    const hs = buildHotspots(s);
    hs.forEach(h => {
      if (h.modeOnly && !h.modeOnly.includes(s.mode)) return;
      const sp = imgToScreen(h.xf, h.yf, L);
      const sw = h.wf * L.imgW, sh = h.hf * L.imgH;
      const rx = sp.x, ry = sp.y;
      s._hotspots.push({ ...h, rx, ry, sw, sh });

      // Pulses: paid = none. Door = never (player pans to find it). Others = after door examined.
      const canPulse = s.mode !== 'paid' && h.id !== 'door' && s.examined['door'];
      if (h.pulse && canPulse) {
        const p = 0.08 + 0.05 * Math.sin(Date.now() / 700 + h.xf * 9);
        ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.globalAlpha = p;
        ctx.strokeRect(rx, ry, sw, sh); ctx.globalAlpha = 1;
      }
    });
  }

  function _drawDialogue(ctx, W, H, s) {
    const fade=s._dlgF, padX=W*0.06, maxW=W*0.86;
    const lines=wrapTxt(ctx,'"'+s._dlg+'"',maxW);
    const lineH=18, totalH=lines.length*lineH+32, dy=H-INV_H-totalH-8;
    ctx.globalAlpha=fade;
    ctx.fillStyle='rgba(8,5,12,0.93)';ctx.fillRect(padX-10,dy-8,maxW+20,totalH);
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=1;ctx.strokeRect(padX-10,dy-8,maxW+20,totalH);
    ctx.fillStyle=C.cream;ctx.font='italic 13px Georgia,serif';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    lines.forEach((ln,i)=>ctx.fillText(ln,padX,dy+i*lineH+12));
    ctx.fillStyle=C.goldDim;ctx.font='italic 10px Georgia,serif';ctx.fillText('— Northcott',padX,dy+lines.length*lineH+18);
    ctx.globalAlpha=1;
  }

  const INV_SLOT = 52;
  function _drawInventory(ctx, W, H, s) {
    const invY=H-INV_H;
    ctx.fillStyle='rgba(6,4,8,0.97)';ctx.fillRect(0,invY,W,INV_H);
    ctx.strokeStyle='#2a2030';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,invY);ctx.lineTo(W,invY);ctx.stroke();
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(0,invY+1);ctx.lineTo(W,invY+1);ctx.stroke();
    const slotY=invY+(INV_H-INV_SLOT)/2;
    const ICONS={key:'⊕',sword:'✛'}, NAMES={key:'Iron Key',sword:'Dress Sword'};
    s._invRects=[];
    s.inv.forEach((id,i)=>{
      const sx=10+i*(INV_SLOT+6), isSel=s._sel===id;
      ctx.fillStyle=isSel?'rgba(60,40,10,0.9)':'rgba(20,15,25,0.9)';ctx.fillRect(sx,slotY,INV_SLOT,INV_SLOT);
      ctx.strokeStyle=isSel?C.gold:C.goldDim;ctx.lineWidth=isSel?1.5:0.5;ctx.strokeRect(sx,slotY,INV_SLOT,INV_SLOT);
      ctx.fillStyle=isSel?C.gold:C.creamDim;ctx.font=(isSel?'bold ':'')+' 20px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(ICONS[id]||'?',sx+INV_SLOT/2,slotY+INV_SLOT/2-6);
      ctx.fillStyle=isSel?C.gold:C.creamDim;ctx.font='8px Georgia,serif';ctx.textBaseline='alphabetic';
      ctx.fillText(NAMES[id]||id,sx+INV_SLOT/2,slotY+INV_SLOT-4);
      s._invRects.push({id,x:sx,y:slotY,w:INV_SLOT,h:INV_SLOT});
    });
    // Puzzle progress
    const solved=[s.puzzles.sequence,s.puzzles.candle,s.puzzles.arms,s.puzzles.case,s.puzzles.door].filter(p=>p.solved).length;
    ctx.fillStyle=C.goldDim;ctx.font='italic 10px Georgia,serif';ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(s.escaped?'ESCAPED':hasItem(s,'key')?'KEY FOUND':'IN THE ARMOURY',W-12,invY+INV_H/2);
  }

  function _drawNotifications(ctx, W, H, s) {
    s._notifyQ.forEach((n,i)=>{
      const fade=Math.min(1,n.timer/30),ny=H-INV_H-38-i*30,nw=Math.min(W*0.74,360),nx=W/2-nw/2;
      ctx.globalAlpha=fade;
      ctx.fillStyle=n.type==='item'?'rgba(18,44,12,0.95)':n.type==='examine'?'rgba(12,8,18,0.92)':'rgba(10,7,14,0.90)';
      ctx.fillRect(nx,ny-11,nw,26);
      ctx.strokeStyle=n.type==='item'?C.green:C.goldDim;ctx.lineWidth=0.5;ctx.strokeRect(nx,ny-11,nw,26);
      ctx.fillStyle=n.type==='item'?C.green:C.cream;ctx.font='italic 11px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(n.text,W/2,ny+2);ctx.globalAlpha=1;
    });
    s._notifyQ=s._notifyQ.map(n=>({...n,timer:n.timer-1})).filter(n=>n.timer>0);
  }

  function _drawHUD(ctx, W, H, s) {
    ctx.fillStyle='rgba(8,5,12,0.74)';ctx.fillRect(8,8,62,24);
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=0.5;ctx.strokeRect(8,8,62,24);
    ctx.fillStyle=C.creamDim;ctx.font='10px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('YIELD',39,20);
    s._hudRects={yield:{x:8,y:8,w:62,h:24}};
  }

  /* =========================================================================
   * TUTORIAL — fires once on first tap after intro dismissed
   * Only in prologue and free tier — paid players get nothing
   * ======================================================================= */
  let _tutorialDone = false;
  let _tutorialFade = 0, _tutorialTimer = 0;
  const TUTORIAL_STEPS = [
    { icon: '👆', text: 'Tap objects to examine them.' },
    { icon: '🔍', text: 'Some objects reveal clues. Read everything.' },
    { icon: '🎒', text: 'Items go to your inventory below. Tap to select, then tap a target to use.' },
    { icon: '🚪', text: 'Get out.' },
  ];
  let _tutStep = 0;

  function _drawTutorial(ctx, W, H) {
    if (_tutorialDone || _tutStep >= TUTORIAL_STEPS.length) { _tutorialDone = true; return; }
    _tutorialFade = Math.min(1, _tutorialFade + 0.04);
    _tutorialTimer++;
    if (_tutorialTimer > 180) { // auto advance after 3 seconds
      _tutStep++;
      _tutorialTimer = 0;
      if (_tutStep >= TUTORIAL_STEPS.length) { _tutorialDone = true; return; }
    }
    const step = TUTORIAL_STEPS[_tutStep];
    const pw = Math.min(W * 0.72, 300), ph = 72, px = W/2-pw/2, py = H - INV_H - ph - 52;
    ctx.globalAlpha = _tutorialFade * (1 - Math.max(0, (_tutorialTimer - 150) / 30));
    ctx.fillStyle = 'rgba(8,5,12,0.94)'; rr(ctx, px, py, pw, ph, 6); ctx.fill();
    ctx.strokeStyle = C.goldDim; ctx.lineWidth = 1; rr(ctx, px, py, pw, ph, 6); ctx.stroke();
    ctx.fillStyle = C.cream; ctx.font = '22px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(step.icon, px + 36, py + ph/2);
    ctx.fillStyle = C.creamDim; ctx.font = 'italic 12px Georgia,serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const lines = wrapTxt(ctx, step.text, pw - 56, 'italic 12px Georgia,serif');
    lines.forEach((ln, i) => ctx.fillText(ln, px + 58, py + ph/2 - (lines.length-1)*9 + i*18));
    // Progress dots
    TUTORIAL_STEPS.forEach((_, i) => {
      ctx.beginPath(); ctx.arc(px + pw/2 - (TUTORIAL_STEPS.length-1)*8 + i*16, py+ph-8, 3, 0, TAU);
      ctx.fillStyle = i === _tutStep ? C.gold : C.goldDim; ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* =========================================================================
   * INTRO SCREEN
   * ======================================================================= */
  let _introFade=0, _introRects={};
  function _drawIntro(ctx, W, H) {
    _introFade=Math.min(1,_introFade+0.022);
    ctx.fillStyle=`rgba(4,2,6,${_introFade*0.90})`;ctx.fillRect(0,0,W,H);
    const pw=Math.min(W*0.82,400),ph=Math.min(H*0.58,340),px=W/2-pw/2,py=H/2-ph/2;
    ctx.globalAlpha=_introFade;
    ctx.fillStyle='rgba(8,5,10,0.97)';rr(ctx,px,py,pw,ph,6);ctx.fill();
    ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;rr(ctx,px,py,pw,ph,6);ctx.stroke();
    ctx.fillStyle=C.goldDim;ctx.font='italic 10px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText('THE ARMOURY',W/2,py+26);
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(px+28,py+36);ctx.lineTo(px+pw-28,py+36);ctx.stroke();
    const lines=[
      "The door has locked behind you.",
      "","Somewhere in this room is the key.",
      "","The door has two obstacles.",
      "The room will show you both.",
      "","Find them. Get out.",
    ];
    ctx.fillStyle=C.cream;ctx.font='italic 13px Georgia,serif';
    let ty=py+54;
    lines.forEach(ln=>{if(ln===''){ty+=8;return;}ctx.fillText(ln,W/2,ty);ty+=20;});
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(px+28,ty+4);ctx.lineTo(px+pw-28,ty+4);ctx.stroke();
    const eW=110,eH=34,eX=W/2-eW-8,eY=ty+16;
    ctx.fillStyle='rgba(48,28,8,0.94)';rr(ctx,eX,eY,eW,eH,4);ctx.fill();
    ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;rr(ctx,eX,eY,eW,eH,4);ctx.stroke();
    ctx.fillStyle=C.cream;ctx.font='bold 12px Georgia,serif';ctx.textBaseline='middle';ctx.fillText('ATTEMPT',eX+eW/2,eY+eH/2);
    _introRects.enter={x:eX,y:eY,w:eW,h:eH};
    const lW=110,lH=34,lX=W/2+8,lY=eY;
    ctx.fillStyle='rgba(18,12,8,0.84)';rr(ctx,lX,lY,lW,lH,4);ctx.fill();
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=1;rr(ctx,lX,lY,lW,lH,4);ctx.stroke();
    ctx.fillStyle=C.creamDim;ctx.font='12px Georgia,serif';ctx.fillText('LEAVE',lX+lW/2,lY+lH/2);
    _introRects.leave={x:lX,y:lY,w:lW,h:lH};
    ctx.globalAlpha=1;
  }

  /* =========================================================================
   * SUMMARY SCREEN
   * ======================================================================= */
  let _summaryFade=0, _summaryClose=null;
  function _drawSummary(ctx, W, H, s) {
    _summaryFade=Math.min(1,_summaryFade+0.030);
    ctx.fillStyle=`rgba(4,2,6,${_summaryFade*0.86})`;ctx.fillRect(0,0,W,H);
    const pw=Math.min(W*0.88,460),ph=Math.min(H*0.80,500),px=W/2-pw/2,py=H/2-ph/2;
    ctx.globalAlpha=_summaryFade;
    ctx.fillStyle='rgba(8,5,10,0.97)';rr(ctx,px,py,pw,ph,8);ctx.fill();
    ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;rr(ctx,px,py,pw,ph,8);ctx.stroke();

    const title=s.escaped?'ESCAPED — THE ARMOURY':'THE ARMOURY — ABANDONED';
    ctx.fillStyle=s.escaped?C.gold:C.creamDim;ctx.font='italic bold 16px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText(title,W/2,py+32);
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(px+24,py+44);ctx.lineTo(px+pw-24,py+44);ctx.stroke();

    // Time
    const elapsed=s.escapeTime?Math.floor((s.escapeTime-s.startTime)/1000):Math.floor((Date.now()-s.startTime)/1000);
    const mins=Math.floor(elapsed/60),secs=elapsed%60;
    ctx.fillStyle=C.creamDim;ctx.font='italic 11px Georgia,serif';
    ctx.fillText(s.escaped?`Escaped in ${mins}:${secs.toString().padStart(2,'0')}`:`Time: ${mins}:${secs.toString().padStart(2,'0')}`,W/2,py+62);

    // Steps
    const steps=[
      {label:'Sword Sequence',solved:s.puzzles.sequence.solved},
      {label:'Hidden Panel — Key Found',solved:hasItem(s,'key')},
      {label:'Candle Shadow',solved:s.puzzles.candle.solved},
      {label:'Coat of Arms',solved:s.puzzles.arms.solved},
      {label:'Glass Case — Sword Found',solved:hasItem(s,'sword')},
      {label:'Door — Escaped',solved:s.escaped},
    ];
    let listY=py+82;
    steps.forEach(step=>{
      ctx.fillStyle=step.solved?C.green:'#3a3038';
      ctx.font=step.solved?'bold 12px Georgia,serif':'12px Georgia,serif';
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
      ctx.fillText((step.solved?'✓  ':'○  ')+step.label,px+36,listY);
      listY+=24;
    });

    listY+=8;
    ctx.strokeStyle=C.goldDim;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(px+24,listY);ctx.lineTo(px+pw-24,listY);ctx.stroke();
    listY+=16;

    // Northcott closing line
    const nLine=s.escaped
      ? (s.mode==='paid'
          ? '"I got out. You got out. The room kept its secrets regardless." — N, written on the floor'
          : '"I will say this — you are slow, but you get there." — Northcott')
      : (s.mode==='paid'
          ? '"The room is patient. So is the door." — N'
          : '"The door will still be locked when you return." — Northcott');
    ctx.fillStyle=C.creamDim;ctx.font='italic 12px Georgia,serif';ctx.textAlign='center';
    const nLines=wrapTxt(ctx,nLine,pw-56);
    nLines.forEach((ln,i)=>ctx.fillText(ln,W/2,listY+i*18));
    listY+=nLines.length*18+12;

    // Inscription on escape
    if(s.escaped){
      ctx.strokeStyle=C.goldDim;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(px+24,listY);ctx.lineTo(px+pw-24,listY);ctx.stroke();
      listY+=12;
      SWORD_INSCRIPTION.split('\n').forEach(ln=>{
        const isCallum=ln==='Received by C. Grey';
        ctx.fillStyle=isCallum?C.goldBright:C.goldDim;
        ctx.font=isCallum?'italic bold 11px Georgia,serif':'italic 10px Georgia,serif';
        ctx.textAlign='center';ctx.textBaseline='alphabetic';
        if(ln!=='')ctx.fillText(ln,W/2,listY);
        listY+=ln===''?7:13;
      });
    }

    // Close button
    const btnW=160,btnH=38,btnX=W/2-btnW/2,btnY=py+ph-52;
    ctx.fillStyle='rgba(48,28,8,0.94)';rr(ctx,btnX,btnY,btnW,btnH,5);ctx.fill();
    ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;rr(ctx,btnX,btnY,btnW,btnH,5);ctx.stroke();
    ctx.fillStyle=C.cream;ctx.font='bold 12px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('LEAVE THE ARMOURY',W/2,btnY+btnH/2);
    _summaryClose={x:btnX,y:btnY,w:btnW,h:btnH};
    ctx.globalAlpha=1;
  }

  /* =========================================================================
   * NOTEBOOK OVERLAY (free tier)
   * ======================================================================= */
  const NB_PAGES=[
    {title:'Cover',text:"A small leather notebook.\nThe initials C.N. are stamped on the front."},
    {title:'6:14PM',text:"The Armoury.\n\nFour swords on the rack. I counted them\nagainst the estate inventory. All present.\n\nThere is a note pinned inside the cabinet\nat the base. The ink is old.\n\nThe swords have years on the plaques\nbeneath each mount. Not in order."},
    {title:'6:21PM',text:"The mantle has marks scratched into the\nwood near the left candelabra.\n\nFive positions. An arrow points to the\nthird from the left.\n\nI did not move the candelabra.\nI was not asked to."},
    {title:'6:28PM',text:"The coat of arms above the fireplace.\n\n\"By precedence of founding\" is written\nbelow the shield. Very small.\n\nThree charges. I know the founding order.\nI did not tap them.\n\nI was not asked to."},
    {title:'6:35PM',text:"The glass case on the writing table.\n\nSealed. The note on the base reads:\n\"The blade serves twice.\"\n\nI found that interesting.\n\nI have left everything as I found it."},
  ];
  function _renderNotebook(ctx, W, H, s) {
    const pw=Math.min(W*0.88,400),ph=Math.min(H*0.68,360),px=W/2-pw/2,py=H/2-ph/2;
    ctx.fillStyle='rgba(0,0,0,0.84)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#c4b890';ctx.fillRect(px,py,pw,ph);ctx.strokeStyle='#8a7840';ctx.lineWidth=1;ctx.strokeRect(px,py,pw,ph);
    ctx.fillStyle='#a09060';ctx.fillRect(px,py,18,ph);
    const pg=NB_PAGES[s._nbPage]||NB_PAGES[0];
    ctx.fillStyle='#5a4020';ctx.font='bold 11px Georgia,serif';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    ctx.fillText(pg.title,px+28,py+22);
    ctx.strokeStyle='#a09060';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(px+28,py+30);ctx.lineTo(px+pw-12,py+30);ctx.stroke();
    ctx.fillStyle='#3a2810';ctx.font='12px Georgia,serif';
    pg.text.split('\n').forEach((ln,i)=>ctx.fillText(ln,px+28,py+46+i*17));
    ctx.fillStyle='#8a7040';ctx.font='10px Georgia,serif';ctx.textAlign='center';
    ctx.fillText(`${s._nbPage+1} / ${NB_PAGES.length}`,px+pw/2,py+ph-8);
    s._nbRects={};
    if(s._nbPage>0){ctx.fillStyle='#5a4020';ctx.font='13px Georgia,serif';ctx.textAlign='left';ctx.fillText('‹',px+28,py+ph-8);s._nbRects.prev={x:px+20,y:py+ph-22,w:30,h:20};}
    if(s._nbPage<NB_PAGES.length-1){ctx.fillStyle='#5a4020';ctx.font='13px Georgia,serif';ctx.textAlign='right';ctx.fillText('›',px+pw-16,py+ph-8);s._nbRects.next={x:px+pw-46,y:py+ph-22,w:30,h:20};}
    ctx.fillStyle='#5a4020';ctx.font='13px Georgia,serif';ctx.textAlign='right';ctx.fillText('✕',px+pw-10,py+18);
    s._nbRects.close={x:px+pw-28,y:py,w:28,h:26};
  }

  /* =========================================================================
   * DIALOGUE HELPER
   * ======================================================================= */
  function _dlg(s, text) {
    if (!s || !text) return;
    s._dlg = text; s._dlgT = 340; s._dlgF = 1;
    SND.northcott();
  }

  /* =========================================================================
   * MAIN LOOP
   * ======================================================================= */
  let _canvas=null,_ctx=null,_modal=null,_raf=null,_state=null;
  let _pDown=false,_pdX=0,_pdY=0,_pdT=0;
  let _framesSince=0,_animT=0;

  function _fit(){if(!_canvas)return;_canvas.width=Math.floor(window.innerWidth);_canvas.height=Math.floor(window.innerHeight);}

  function _loop(){
    if(!_canvas||!_state)return;
    const s=_state; _animT+=0.025; _framesSince++;

    // Dialogue fade
    if(s._dlgT>0){s._dlgT--;s._dlgF=s._dlgT>60?1:s._dlgT/60;}

    // Case press hold
    if(_activePuzzle==='case')cspPressTick(s,_pressing);

    // Northcott hints (prologue idle)
    if(!_activePuzzle&&s.phase==='play'){const h=tickHints(s,_framesSince);if(h){_dlg(s,h);_framesSince=0;}}

    // Autosave
    if(Math.floor(_animT*40)%300===0)saveState(s);

    // Render
    _ctx.clearRect(0,0,_canvas.width,_canvas.height);

    // Discovery overlay dismiss
    if(s._discovery&&s._discoveryRect){
      const p2=_gP(e);
      if(p2.x>=s._discoveryRect.x&&p2.x<=s._discoveryRect.x+s._discoveryRect.w&&
         p2.y>=s._discoveryRect.y&&p2.y<=s._discoveryRect.y+s._discoveryRect.h){
        s._discovery=null;s._discoveryFade=0;s._discoveryRect=null;
        notify(s,'Use the sword tip on the door lock mechanism to clear the jam.','item');
        return;
      }
    }

    // Enable canvas pointer-events only when overlay needs interaction
    if(_canvas){
      const needsPointer=s.phase==='intro'||s.phase==='summary'||!!_activePuzzle||s._nbOpen||!!s._discovery;
      const pe=needsPointer?'auto':'none';
      if(_canvas.style.pointerEvents!==pe){
        _canvas.style.pointerEvents=pe;
        _canvas.style.touchAction=needsPointer?'none':'';
      }
    }
    if(s.phase==='intro'){
      _drawIntro(_ctx,_canvas.width,_canvas.height);
    } else if(s.phase==='play'){
      renderOverlay(_ctx,_canvas.width,_canvas.height,s,_animT);
      puzzleRender(_ctx,_canvas.width,_canvas.height,s);
      if(s._nbOpen)_renderNotebook(_ctx,_canvas.width,_canvas.height,s);
      if(s._discovery){}// handled in renderOverlay
    } else if(s.phase==='summary'){
      _drawSummary(_ctx,_canvas.width,_canvas.height,s);
    }

    _raf=requestAnimationFrame(_loop);
  }

  /* =========================================================================
   * INPUT
   * ======================================================================= */
  function _gP(e){
    const r=_canvas.getBoundingClientRect();let cx,cy;
    if(e.touches&&e.touches.length){cx=e.touches[0].clientX;cy=e.touches[0].clientY;}
    else if(e.changedTouches&&e.changedTouches.length){cx=e.changedTouches[0].clientX;cy=e.changedTouches[0].clientY;}
    else{cx=e.clientX;cy=e.clientY;}
    return{x:(cx-r.left)*(_canvas.width/r.width),y:(cy-r.top)*(_canvas.height/r.height)};
  }

  function _onDown(e){
    // Only initialise audio — don't prevent default (manor handles pan/pinch)
    aInit();aResume();
    const p=_gP(e);_pdX=p.x;_pdY=p.y;_pdT=Date.now();_pDown=true;_framesSince=0;
    const s=_state;if(!s)return;

    // Discovery overlay — needs pointer-events back on canvas temporarily
    if(s._discovery&&s._discoveryRect){
      if(p.x>=s._discoveryRect.x&&p.x<=s._discoveryRect.x+s._discoveryRect.w&&
         p.y>=s._discoveryRect.y&&p.y<=s._discoveryRect.y+s._discoveryRect.h){
        s._discovery=null;s._discoveryFade=0;s._discoveryRect=null;
        notify(s,'Use the sword tip on the door lock mechanism to clear the jam.','item');
      }
      return;
    }

    // Intro / summary — full intercept
    if(s.phase==='intro'){
      if(_hit(p.x,p.y,_introRects.enter)){
        s.phase='play';_introFade=0;
        // Fade Northcott portrait out — he speaks via dialogue boxes during the game
        const nc=document.getElementById('char-northcott');
        if(nc){
          nc.style.transition='opacity 1.2s ease';
          nc.style.opacity='0';
          nc.style.pointerEvents='none';
        }
      }
      else if(_hit(p.x,p.y,_introRects.leave)){closeArmory();}
      return;
    }
    if(s.phase==='summary'){
      if(_summaryClose&&_hit(p.x,p.y,_summaryClose))closeArmory();
      return;
    }

    // Notebook overlay
    if(s._nbOpen){
      const nr=s._nbRects||{};
      if(_hit(p.x,p.y,nr.close)){s._nbOpen=false;}
      else if(_hit(p.x,p.y,nr.prev)){s._nbPage=Math.max(0,s._nbPage-1);}
      else if(_hit(p.x,p.y,nr.next)){s._nbPage=Math.min(NB_PAGES.length-1,s._nbPage+1);}
      return;
    }

    // Active puzzle — intercept (puzzle fills screen)
    if(_activePuzzle){
      puzzleDown(e,p.x,p.y,_canvas.width,_canvas.height,s);
      if(_activePuzzle==='case'&&cspPressStart(p.x,p.y,s))_pressing=true;
      return;
    }

    // HUD yield — intercept only if tapped
    if(s._hudRects&&_hit(p.x,p.y,s._hudRects.yield)){_yield(s);return;}

    // Inventory tap
    if(s._invRects){
      for(const ir of s._invRects){
        if(_hit(p.x,p.y,ir)){s._sel=s._sel===ir.id?null:ir.id;SND.tap();return;}
      }
    }
    // Otherwise: fall through — manor handles pan/pinch on rooms-container
  }

  function _onMove(e){
    // Only handle if puzzle active — manor handles everything else
    if(!_pDown||!_state||_state._nbOpen||_state.phase!=='play')return;
    if(!_activePuzzle)return;
    const p=_gP(e);
    _framesSince=0;
    puzzleMove(e,p.x,p.y,_canvas.width,_canvas.height,_state);
  }

  function _onUp(e){
    const p=_gP(e);_pressing=false;
    if(!_state||_state.phase!=='play'){_pDown=false;return;}
    if(_state._nbOpen){_pDown=false;return;}
    if(_activePuzzle){puzzleUp(e,p.x,p.y,_state);_pDown=false;return;}
    // Tap = short duration + small movement — hotspot interaction
    const dx=Math.abs(p.x-_pdX),dy=Math.abs(p.y-_pdY),dt=Date.now()-_pdT;
    if(dx<18&&dy<18&&dt<380)_tap(p.x,p.y,_state);
    _pDown=false;
  }

  function _tap(tx,ty,s){
    _framesSince=0;
    if(s._hotspots){
      for(const h of s._hotspots){
        if(tx>=h.rx&&tx<=h.rx+h.sw&&ty>=h.ry&&ty<=h.ry+h.sh){
          _tapHotspot(h,s);return;
        }
      }
    }
    s._sel=null;
  }

  function _tapHotspot(h, s) {
    SND.tap();

    // Gate check
    if(h.gate&&!h.gate(s)){
      notify(s,h.gateMsg||'Not accessible yet.','examine');return;
    }

    // Custom tap handler
    if(h.onTap){h.onTap(s);return;}

    // Puzzle trigger
    if(h.puzzle){_openPuzzle(h.puzzle);return;}

    // Examine
    if(h.examineText)notify(s,h.examineText,'examine');
  }

  function _yield(s){
    _closePuzzle();s._nbOpen=false;
    const l=northcottSay(s,'yield');if(l)_dlg(s,l);
    saveState(s);
    setTimeout(()=>{if(_state)_state.phase='summary';},s.mode==='prologue'?1800:400);
  }

  /* =========================================================================
   * OPEN / CLOSE
   * ======================================================================= */
  function openArmory(initScrollX) {
    if(_modal)return;
    const saved=loadState();
    _modal=document.createElement('div');
    _modal.style.cssText='position:fixed;inset:0;z-index:9999;background:transparent;overflow:hidden;pointer-events:none;user-select:none;-webkit-user-select:none;';
    _canvas=document.createElement('canvas');
    _canvas.style.cssText='display:block;width:100%;height:100%;background:transparent;pointer-events:none;';
    _modal.appendChild(_canvas);document.body.appendChild(_modal);
    _ctx=_canvas.getContext('2d');_fit();
    window.addEventListener('resize',_fit);window.addEventListener('orientationchange',_fit);
    // Touch/mouse goes to rooms-container (manor pan/zoom) during exploration.
    // We only intercept document-level touchend for tap detection.
    document.addEventListener('mousedown',  _onDown, true);
    document.addEventListener('mouseup',    _onUp,   true);
    document.addEventListener('touchstart', _onDown, { capture:true, passive:true });
    document.addEventListener('touchend',   _onUp,   { capture:true, passive:true });

    _state=saved?restoreState(saved):createState();
    _state._scrollX=initScrollX||0;
    _state._dlg='';_state._dlgT=0;_state._dlgF=0;_state._sel=null;
    _state._hotspots=[];_state._invRects=[];_state._hudRects={};_state._nbRects={};
    _state._nbOpen=false;_state._nbPage=0;
    _activePuzzle=null;_animT=0;_framesSince=0;_pressing=false;
    _introFade=0;_introRects={};_summaryFade=0;_summaryClose=null;
    _tutorialDone=!!saved;_tutorialFade=0;_tutorialTimer=0;_tutStep=0;

    if(saved&&saved.phase!=='intro')_state.phase='play';

    if(_state.mode==='prologue'&&_state.phase==='play'){
      setTimeout(()=>{if(_state)_dlg(_state,northcottSay(_state,'intro')||'');},900);
    }

    _loop();
  }

  function closeArmory(){
    window._armoryClosedAt = Date.now(); // suppress re-open from same tap
    // Restore Northcott portrait — fade back in at his last prologue dialogue state
    const nc=document.getElementById('char-northcott');
    if(nc){
      nc.style.transition='opacity 0.8s ease';
      nc.style.opacity='1';
      nc.style.pointerEvents='';
    }
    if(_raf)cancelAnimationFrame(_raf);_raf=null;
    if(_modal&&_modal.parentNode)_modal.parentNode.removeChild(_modal);
    _modal=null;_canvas=null;_ctx=null;_state=null;_activePuzzle=null;
    _pDown=false;_pressing=false;
    window.removeEventListener('resize',_fit);window.removeEventListener('orientationchange',_fit);
    document.removeEventListener('mousedown',  _onDown, true);
    document.removeEventListener('mouseup',    _onUp,   true);
    document.removeEventListener('touchstart', _onDown, true);
    document.removeEventListener('touchend',   _onUp,   true);
  }

  window.openArmory=openArmory;
  window.closeArmory=closeArmory;

}());
