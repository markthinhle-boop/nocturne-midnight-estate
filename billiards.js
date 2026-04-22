/* ============================================================================
 * NOCTURNE: MIDNIGHT ESTATE — BILLIARDS
 * Standard 8-ball solids/stripes. Solo practice OR vs Alistair.
 * Canvas 2D, mobile-safe, realistic-ish physics.
 * Portrait phones: table rotates 90° so it fills width.
 * Mount: tap billiard-table object in Billiard Room → openBilliards()
 * ========================================================================= */
(function () {
  'use strict';

  // ---------- Table geometry (internal units, scaled at render) -----------
  const TABLE_W = 800;
  const TABLE_H = 400;
  const RAIL = 32;
  const PLAY_X0 = RAIL;
  const PLAY_Y0 = RAIL;
  const PLAY_X1 = TABLE_W - RAIL;
  const PLAY_Y1 = TABLE_H - RAIL;
  const PLAY_W = PLAY_X1 - PLAY_X0;
  const PLAY_H = PLAY_Y1 - PLAY_Y0;

  const BALL_R = 10;
  const POCKET_R = 18;
  const POCKET_CAPTURE_R = 16;

  const POCKETS = [
    { x: PLAY_X0 + 6,   y: PLAY_Y0 + 6 },
    { x: TABLE_W / 2,   y: PLAY_Y0 - 2 },
    { x: PLAY_X1 - 6,   y: PLAY_Y0 + 6 },
    { x: PLAY_X0 + 6,   y: PLAY_Y1 - 6 },
    { x: TABLE_W / 2,   y: PLAY_Y1 + 2 },
    { x: PLAY_X1 - 6,   y: PLAY_Y1 - 6 }
  ];

  const FRICTION = 0.988;
  const MIN_SPEED = 0.06;
  const CUSHION_DAMP = 0.78;
  const BALL_RESTITUTION = 0.96;
  const SPIN_FRICTION = 0.94;
  const SPIN_TO_VEL = 0.12;

  const BALL_COLORS = {
    0: '#f5ecd7', 1: '#f7c948', 2: '#2e5cb8', 3: '#c0392b', 4: '#6c3483',
    5: '#d35400', 6: '#196f3d', 7: '#7b241c', 8: '#111111',
    9: '#f7c948', 10: '#2e5cb8', 11: '#c0392b', 12: '#6c3483',
    13: '#d35400', 14: '#196f3d', 15: '#7b241c'
  };

  function ballType(n) {
    if (n === 0) return 'cue';
    if (n === 8) return 'eight';
    if (n >= 1 && n <= 7) return 'solid';
    return 'stripe';
  }

  // ---------- Dialogue: Alistair, 100+ unique lines -----------------------
  const DIALOGUE = {
    preMatch: [
      "Grey. You play? Or are we about to discover something charming about you?",
      "Rack them. I'll break. Unless you insist — in which case, by all means, disappoint yourself first.",
      "A game, then. I find the table tells me more about a man than conversation does.",
      "You don't strike me as a cue man, Grey. Prove me wrong. Or right. Either is useful.",
      "One game. Loser owes the winner a truthful answer. I assume you agree to the terms.",
      "The felt is honest. Most things in this house are not.",
      "I haven't played a stranger in some time. The last one cried, I'm afraid.",
      "Rules: eight-ball, call your pocket, scratches cost you. You know the rest.",
      "Shall we keep score, or shall we pretend we aren't?",
      "Pick a cue. The lighter one sits better for beginners."
    ],
    goodShotPlayer: [
      "Hm. Tidy.",
      "Better than expected.",
      "You've done this before.",
      "I'll give you that one.",
      "Clean. I'm revising my estimate of you.",
      "Good. Don't let it go to your head.",
      "See — you have instincts. Unfortunate, but there it is.",
      "A respectable shot. Do it again.",
      "Not bad, Grey. Not bad at all.",
      "You surprise me. I don't enjoy surprise.",
      "Credit where it's owed. Next shot."
    ],
    missedPlayer: [
      "Close. The table doesn't grade on effort.",
      "A miss is information. Use it.",
      "Don't aim at the ball. Aim through it.",
      "You pulled up. Follow through or don't bother.",
      "The angle was fine. The hand was not.",
      "Not your shot. You knew that, didn't you?",
      "That's what hesitation looks like.",
      "Settle. Breathe. The ball isn't going anywhere.",
      "Too much cue. You jabbed.",
      "Better to leave it safe than to reach."
    ],
    scratchPlayer: [
      "The cue ball in a pocket. A classic.",
      "Ball in hand. I'll try not to enjoy this.",
      "You sent the wrong ball home, Grey.",
      "Generous of you. I accept.",
      "That will cost you. Everything costs something.",
      "Composure. Next time."
    ],
    sunkPlayerBall: [
      "Your colour. Keep it.",
      "That's yours. Don't waste the run.",
      "One down. You know what happens to men on runs — they forget to stop.",
      "Good pocket. Bad idea to celebrate.",
      "Now. While the table is open. Push."
    ],
    sunkOpponentBall: [
      "You just potted mine. Thank you. I was going to get to it.",
      "Helpful. Try not to do that again.",
      "A gift. Noted.",
      "You're playing my game for me now.",
      "Generous, Grey. Almost insulting."
    ],
    goodShotAlistair: [
      "Mm.",
      "There it is.",
      "Sometimes the ball does what it's told.",
      "A small pleasure.",
      "Predictable. But satisfying.",
      "That's the one."
    ],
    missedAlistair: [
      "Damn.",
      "I was reaching.",
      "Hm. That wasn't there.",
      "The felt is slower tonight.",
      "An error. They happen.",
      "Don't look smug, Grey. It's unbecoming.",
      "I misread the cushion.",
      "Careless. Won't happen twice."
    ],
    scratchAlistair: [
      "A scratch. I'm a human being after all.",
      "Ball in hand. Use it well, or don't.",
      "I walked into that. Your turn.",
      "Humiliating. Brief. Fleeting.",
      "Place it where it hurts me."
    ],
    alistairLeading: [
      "The run continues.",
      "I could do this all evening.",
      "You're running out of colours, Grey.",
      "Don't sulk. Play.",
      "The table is cooperative tonight.",
      "Another. And another. It's almost rude."
    ],
    playerLeading: [
      "You're ahead. Briefly, I imagine.",
      "A lead is a fragile thing. Hold it lightly.",
      "Enjoy it. Leads evaporate.",
      "I've been behind before. It rarely lasts.",
      "The balls don't care about the score, Grey.",
      "Sharpen up. I'm about to do the same."
    ],
    eightBallApproach: [
      "The black ball. Finally.",
      "One ball between you and a story to tell. Don't botch the story.",
      "Call your pocket. Out loud. I want to hear it.",
      "Eight ball. The whole game, in one stroke.",
      "Be careful. The black punishes pride.",
      "Now we see what you're made of."
    ],
    alistairEightApproach: [
      "My colours are done. Eight ball, then.",
      "I'll be calling the corner. Watch.",
      "One more. Try not to flinch.",
      "The black. And then we talk about what you owe me."
    ],
    playerWonEight: [
      "Well.",
      "You beat me. I'll think about that later.",
      "Credit, Grey. That was played properly.",
      "Hm. That's a first in a while.",
      "I owe you a truthful answer. Ask carefully.",
      "Good game. Don't gloat. I remember gloaters."
    ],
    playerLostEight: [
      "Early black. That's the game, I'm afraid.",
      "Wrong pocket. Wrong ball. Wrong evening.",
      "You called a pocket and delivered it elsewhere. A habit of yours?",
      "That was the loss, Grey. Rack them if you want another.",
      "Black ball in on a foul. Unfortunate.",
      "The eight doesn't forgive. Nothing here does."
    ],
    alistairWonEight: [
      "Eight ball. Corner pocket. As stated.",
      "A tidy finish. My thanks.",
      "You played well enough. You played me, though. That's the problem.",
      "Game. Rack again if you've the stomach."
    ],
    alistairLostEight: [
      "I sank the black early. That's a loss.",
      "The eight on a foul. Mine. Embarrassing.",
      "Well. You won by attrition. Still counts.",
      "A defeat. Rare. I'll take the lesson."
    ],
    contemplative: [
      "This table's seen things.",
      "I learned pool from a man who lost at it. He was better at that than winning.",
      "A good cue is like a good question. Neither one jabs.",
      "Ashworth never played. Said it was undignified. He was wrong about a lot of things.",
      "The trick is to see the next shot before you take this one.",
      "Patience, Grey. The table rewards it. So does this house."
    ],

    // ---- Adaptive voice by confidence zone ----
    confidentTerse: [
      "Mm.",
      "As expected.",
      "Predictable.",
      "Next.",
      "Keep up.",
      "Fine.",
      "Hm.",
      "Was there any doubt?",
      "Routine.",
      "The outcome was never in question."
    ],
    confidentDismissive: [
      "You're trying. I can see that. It's not enough.",
      "Your best isn't my average, Grey.",
      "This is the part where most men concede.",
      "If this is your ceiling, we'll be done in ten minutes.",
      "Nothing about this is difficult. Not for me.",
      "You're not bad. You're just not good."
    ],
    tenseAnalytical: [
      "You're leaving me the 4 in the corner. Thank you.",
      "Straight line on the 6. I'll take it.",
      "The cue ball sits awkwardly. I'll play position, not power.",
      "Two-way shot. If I miss, you're locked up.",
      "I can pot this, or I can make sure you can't. Choose for me.",
      "Angles. The table is about angles.",
      "I see four shots ahead of this one. You should try it.",
      "Tight. But workable."
    ],
    tenseProbing: [
      "You're playing differently this frame. Why?",
      "You were aggressive earlier. Now you're not.",
      "That's the second time you've avoided the bottom rail.",
      "You've stopped going for the hard cuts. Smart. Boring, but smart.",
      "Your hand is steadier than I expected. Someone taught you.",
      "I'm watching you watch me. Stop it.",
      "You hesitate before the 6. Did something happen on a 6 before?"
    ],
    losingFrustrated: [
      "No.",
      "That was mine. That was a dead ball and I missed it.",
      "This isn't the table. This is me.",
      "I'm playing like I've never held a cue before.",
      "Unacceptable.",
      "I'm going to need a moment.",
      "You're in my head now. I'll admit that."
    ],
    losingRevealing: [
      "I lost a match like this once, in Edinburgh. I don't talk about it.",
      "You remind me of someone I used to play. He beat me too.",
      "I'm not used to being behind. I don't know what my face is doing.",
      "The felt is the same temperature it always is. I'm the variable.",
      "You've found something in my game. I'm curious what it is.",
      "Everything I do now, you're expecting. That's not a good sign for me."
    ],
    losingResigned: [
      "Take the frame, Grey. You've earned it.",
      "I can feel the match slipping. It's almost peaceful.",
      "Not my night. Not my table, tonight.",
      "You play with a quiet I don't have access to right now.",
      "Whatever happens next, you've already changed the evening."
    ],
    tiltedAggressive: [
      "Fine. Let's make this faster.",
      "I'm swinging. Don't stand too close.",
      "To hell with position. I want the ball in the pocket.",
      "Enough chess. This is a fight now.",
      "You want power? Watch this."
    ],
    momentumRunning: [
      "Another.",
      "And another.",
      "I can do this until you stop watching.",
      "The run has a shape. I'm inside it.",
      "Don't interrupt me. I'm working."
    ],
    safetyPlayed: [
      "A safety. I'm not proud of it, but it's correct.",
      "Hidden. Find that if you can.",
      "You'll need a kick. Good luck.",
      "Defense is a form of respect. You've earned some.",
      "Locked up. Your move, Grey."
    ],
    breakoutAttempt: [
      "My balls are clustered. I have to break them out.",
      "This is going to look reckless. It isn't.",
      "Controlled chaos.",
      "If I don't break this cluster now, I won't get another chance."
    ],
    onEightRun: [
      "One ball. The black. Call the pocket, Grey. I'm calling mine.",
      "Bottom right. Then the handshake.",
      "I've played this pocket a thousand times. It's almost rude.",
      "The eight. The whole evening, in one stroke."
    ],
    frameWonTerse: [
      "Frame.",
      "Mine.",
      "One-nil. Rack them.",
      "Continuing.",
      "Good. That's one.",
      "Tidy frame. Next."
    ],
    frameWonGracious: [
      "Close frame, Grey. Well played.",
      "You made me work for that.",
      "Hm. That should have been yours.",
      "Closer than I'd like. Rack them.",
      "You're making me honest."
    ],
    frameLostTerse: [
      "Take it.",
      "Yours.",
      "Rack them. I'm not done.",
      "A frame. One frame. We continue.",
      "Annoying. Not conclusive."
    ],
    frameLostResigned: [
      "You deserved that one.",
      "I saw that frame getting away from me. I couldn't stop it.",
      "Take the frame. I'll be ready for the next.",
      "Well played, Grey. Genuinely."
    ],
    matchWonProud: [
      "Match. Good game, Grey.",
      "You had moments. Not enough of them.",
      "Drinks are on me. Not a reward — a consolation.",
      "A fair match. I enjoyed it more than I expected."
    ],
    matchWonHumble: [
      "That was closer than the score suggests. You're better than most.",
      "I didn't expect to sweat through that one. I did.",
      "Well played, Grey. I mean that.",
      "You've got something. Come back when you've sharpened it."
    ],
    matchLostFirstTime: [
      "Well. You won.",
      "I don't lose often. Tonight, I did.",
      "You've got the rest of the evening to enjoy that. Use it well.",
      "That's a genuine defeat. Rare. I'll sit with it.",
      "You beat me, Grey. I'll remember."
    ],
    matchLostGracious: [
      "Good match. You played the better game tonight.",
      "Hand on my shoulder, Grey. I mean it. That was earned.",
      "I owe you that truthful answer. Ask carefully.",
      "You're dangerous at this table. I should have noticed earlier."
    ]
  };

  function pickLine(cat) {
    const arr = DIALOGUE[cat];
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- Sound (WebAudio, synthesized) -------------------------------
  // Billiards sound palette: cue hit (sharp tock), ball-ball click (bright),
  // cushion thud (low), pocket drop (descending wood knock).
  let audioCtx = null;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { return null; }
    return audioCtx;
  }

  // Resume audio on first user gesture (mobile autoplay policy)
  function unlockAudio() {
    const ac = ensureAudio();
    if (ac && ac.state === 'suspended') ac.resume();
  }

  // Short tock used for cue strike / ball click. Pitch varies with velocity.
  function playClick(velocity) {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime;
    // Volume scales with impact energy
    const v = Math.max(0.05, Math.min(1, velocity / 8));
    // Bright noise burst with short band-pass
    const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.06), ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 22) * 0.6;
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400 + Math.random() * 600;
    bp.Q.value = 4;
    const g = ac.createGain();
    g.gain.value = 0.35 * v;
    src.connect(bp); bp.connect(g); g.connect(ac.destination);
    src.start(now);
    src.stop(now + 0.08);
  }

  // Low thud for cushion hits.
  function playThud(velocity) {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime;
    const v = Math.max(0.1, Math.min(1, velocity / 10));
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.3 * v, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(g); g.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Pocket drop — descending woody knock.
  function playPocket() {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(g); g.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.4);
    // Tail: a softer secondary click
    setTimeout(() => playClick(3), 180);
  }

  // ---------- Module state -------------------------------------------------
  let state = null;
  let canvas = null;
  let ctx = null;
  let modal = null;
  let rafId = null;
  let shotStartTime = 0;

  // Layout
  let viewMode = 'landscape';  // 'landscape' | 'portrait'
  let tableScale = 1;       // base fit-to-screen scale
  let tableOffsetX = 0;
  let tableOffsetY = 0;
  // User-controlled zoom (1.0 = fit, max 3.0), pan in table-space units
  let zoomLevel = 1;
  let panTX = 0;             // pan center in table space X
  let panTY = 0;             // pan center in table space Y
  let panInitialized = false;
  // Pinch state
  let pinchStartDist = 0;
  let pinchStartZoom = 1;
  let pinchCenterTable = null;  // table-space center point at pinch start

  // ---------- Match & psychology ------------------------------------------
  // match lives across multiple frames. state is one frame.
  let match = null;

  function newMatch(format) {
    // format: 3 | 5 | 7 (best-of)
    const toWin = Math.ceil(format / 2);
    match = {
      format: format,
      toWin: toWin,
      playerFrames: 0,
      alistairFrames: 0,
      breakAlternates: true,   // alternating break each frame
      nextBreaker: 'player',   // who breaks the first frame

      // Psychology (persists across frames)
      composure: 0.85,         // high = calm, low = nervy (affects aim noise)
      momentum: 0,             // -1..+1 (negative = player momentum, positive = Alistair)
      tilt: 0,                 // 0..1 (Alistair's frustration)
      confidence: 0.6,         // 0..1 (long-moving — governs voice)

      // Dossier — player read, accumulated across frames
      dossier: newDossier(),

      // UI
      showInterstitial: false,
      interstitialText: null,
      showMatchEnd: false
    };
  }

  function newDossier() {
    return {
      shotsTaken: 0,
      shotsPotted: 0,
      scratches: 0,
      totalPower: 0,             // sum of power [0..1] per shot
      cutShots: 0,               // shots with |angle| > 20°
      straightShots: 0,          // shots with |angle| <= 20°
      pocketHistory: [0,0,0,0,0,0],  // times each pocket targeted
      topHalfShots: 0,
      bottomHalfShots: 0,
      hardPots: 0,               // attempted shots rated difficulty > 0.6
      easyMisses: 0,             // missed shots rated difficulty < 0.4
      scratchedBalls: [],        // which ball numbers were on the table when scratch happened
      safetiesPlayed: 0,
      eightBallApproaches: 0,
      eightBallWins: 0,
      brokeAllClusters: false
    };
  }

  // Update psychology based on shot outcome
  function updatePsych(shooter, outcome) {
    // outcome: { sankOwn, sankOpp, scratched, foul, difficulty (0-1), wasEasy, wasHard }
    const m = match; if (!m) return;

    if (shooter === 'player') {
      // Player success → Alistair's composure drops slightly, momentum shifts against him
      if (outcome.sankOwn && !outcome.foul) {
        m.momentum = Math.max(-1, m.momentum - 0.2);
        m.composure = Math.max(0, m.composure - 0.03);
      }
      if (outcome.scratched) {
        m.momentum = Math.min(1, m.momentum + 0.15);
        m.composure = Math.min(1, m.composure + 0.05);
      }
      if (!outcome.sankOwn && !outcome.scratched) {
        // Player miss — slight Alistair confidence
        m.momentum = Math.min(1, m.momentum + 0.08);
      }
    } else {
      // Alistair's shot
      if (outcome.sankOwn && !outcome.foul) {
        m.momentum = Math.min(1, m.momentum + 0.25);
        m.composure = Math.min(1, m.composure + 0.04);
        m.tilt = Math.max(0, m.tilt - 0.15);
      }
      if (outcome.scratched) {
        m.momentum = Math.max(-1, m.momentum - 0.3);
        m.composure = Math.max(0, m.composure - 0.15);
        m.tilt = Math.min(1, m.tilt + 0.35);
      }
      if (outcome.wasEasy && !outcome.sankOwn) {
        // Missed a gimme
        m.tilt = Math.min(1, m.tilt + 0.25);
        m.composure = Math.max(0, m.composure - 0.08);
      }
      if (!outcome.sankOwn && !outcome.scratched && !outcome.wasEasy) {
        // Normal miss — slight tilt
        m.tilt = Math.min(1, m.tilt + 0.08);
      }
    }

    // Natural decay of tilt per shot (he calms down over time)
    m.tilt *= 0.92;
  }

  // Update dossier when PLAYER takes a shot
  function updateDossier(shotInfo) {
    // shotInfo: { power, firstContactBall, sankOwn, scratched, targetPocket, difficulty, angleRad, targetY }
    const d = match.dossier;
    d.shotsTaken++;
    d.totalPower += shotInfo.power;
    if (shotInfo.sankOwn) d.shotsPotted++;
    if (shotInfo.scratched) {
      d.scratches++;
      // Record which balls were on the table at scratch time
      for (const b of state.balls) {
        if (b.inPlay && b.n !== 0) d.scratchedBalls.push(b.n);
      }
    }
    // Cut vs straight
    const ang = Math.abs(shotInfo.angleRad || 0);
    if (ang > 20 * Math.PI / 180) d.cutShots++;
    else d.straightShots++;
    // Pocket
    if (shotInfo.targetPocket != null && shotInfo.targetPocket >= 0 && shotInfo.targetPocket < 6) {
      d.pocketHistory[shotInfo.targetPocket]++;
    }
    // Table half
    if (shotInfo.targetY != null) {
      if (shotInfo.targetY < TABLE_H / 2) d.topHalfShots++;
      else d.bottomHalfShots++;
    }
    // Difficulty classification
    if (shotInfo.difficulty != null) {
      if (shotInfo.difficulty > 0.6) d.hardPots++;
      if (shotInfo.difficulty < 0.4 && !shotInfo.sankOwn) d.easyMisses++;
    }
  }

  // Generate "Alistair's notes on you" — flavor text from the dossier
  function generateNotes() {
    if (!match) return [];
    const d = match.dossier;
    const notes = [];
    if (d.shotsTaken < 3) {
      notes.push('"Too early to say. I\'m watching."');
      return notes;
    }

    const potRate = d.shotsPotted / Math.max(1, d.shotsTaken);
    const avgPower = d.totalPower / Math.max(1, d.shotsTaken);
    const cutRatio = d.cutShots / Math.max(1, d.cutShots + d.straightShots);
    const riskIndex = d.hardPots / Math.max(1, d.shotsTaken);

    if (potRate > 0.55) notes.push('"You pot at ' + (potRate * 100 | 0) + '%. That\'s good. I don\'t like it."');
    else if (potRate < 0.25) notes.push('"Your pot rate is ' + (potRate * 100 | 0) + '%. That\'s not playing — that\'s hoping."');
    else notes.push('"You\'re potting at ' + (potRate * 100 | 0) + '%. Steady. Workable."');

    if (avgPower > 0.7) notes.push('"You\'re hitting hard. That\'s either confidence or panic. I\'m not sure which."');
    else if (avgPower < 0.4) notes.push('"You play soft. Touch, not force. Interesting choice."');

    if (cutRatio > 0.65) notes.push('"You favor cuts. You\'ll avoid dead-straight shots — I\'ve seen you do it twice."');
    else if (cutRatio < 0.3) notes.push('"You line up straight shots whenever you can. When I leave you an angle, you hesitate."');

    if (d.scratches >= 2) {
      const common = findMostCommon(d.scratchedBalls);
      if (common !== null) {
        notes.push('"You\'ve scratched twice on the ' + common + '. There\'s something in that ball you don\'t trust."');
      } else {
        notes.push('"' + d.scratches + ' scratches. You\'re rushing. Slow down."');
      }
    }

    // Pocket preference
    const maxPi = d.pocketHistory.indexOf(Math.max(...d.pocketHistory));
    if (d.pocketHistory[maxPi] >= 3) {
      const pName = ['top-left','top-middle','top-right','bottom-left','bottom-middle','bottom-right'][maxPi];
      notes.push('"You keep going to the ' + pName + ' pocket. If I close it off, where do you go?"');
    }

    // Table half bias
    if (d.topHalfShots > d.bottomHalfShots * 2) {
      notes.push('"You\'re playing the top half of the table. The bottom feels uncomfortable to you."');
    } else if (d.bottomHalfShots > d.topHalfShots * 2) {
      notes.push('"You stay south. The top of the table is where I\'ll leave you next."');
    }

    // Risk index
    if (riskIndex > 0.4) notes.push('"You\'ll take difficult shots. I respect that. I also exploit it."');
    else if (riskIndex < 0.15) notes.push('"You play percentages. That\'s fine, until the percentages require you to try."');

    if (d.easyMisses >= 2) {
      notes.push('"You\'ve missed shots you should have potted. Focus slipped. I noticed."');
    }

    return notes;
  }

  function findMostCommon(arr) {
    if (!arr.length) return null;
    const counts = {};
    let best = null, bestCount = 0;
    for (const v of arr) {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > bestCount) { bestCount = counts[v]; best = v; }
    }
    return bestCount >= 2 ? best : null;
  }

  // Pick voice category based on current confidence + context
  function voiceZone() {
    if (!match) return 'neutral';
    if (match.tilt > 0.6) return 'tilted';
    if (match.confidence > 0.7) return 'confident';
    if (match.confidence < 0.3) return 'losing';
    return 'tense';
  }

  function sayAdaptive(context) {
    // context: 'shotSuccess' | 'shotMiss' | 'scratch' | 'idle' | 'eight' | 'frameWon' | 'frameLost'
    const zone = voiceZone();
    let cat = null;

    if (context === 'shotSuccess') {
      if (zone === 'confident') cat = Math.random() < 0.6 ? 'confidentTerse' : 'goodShotAlistair';
      else if (zone === 'tense') cat = Math.random() < 0.5 ? 'tenseAnalytical' : 'goodShotAlistair';
      else if (zone === 'losing') cat = 'losingRevealing';
      else if (zone === 'tilted') cat = 'tiltedAggressive';
      else cat = 'goodShotAlistair';
      if (match && Math.abs(match.momentum) > 0.5 && match.momentum > 0) {
        if (Math.random() < 0.3) cat = 'momentumRunning';
      }
    } else if (context === 'shotMiss') {
      if (zone === 'tilted') cat = 'tiltedAggressive';
      else if (zone === 'losing') cat = Math.random() < 0.5 ? 'losingFrustrated' : 'losingResigned';
      else cat = 'missedAlistair';
    } else if (context === 'scratch') {
      cat = zone === 'losing' ? 'losingFrustrated' : 'scratchAlistair';
    } else if (context === 'idle') {
      if (zone === 'confident') cat = Math.random() < 0.5 ? 'confidentDismissive' : 'confidentTerse';
      else if (zone === 'tense') cat = Math.random() < 0.5 ? 'tenseProbing' : 'tenseAnalytical';
      else if (zone === 'losing') cat = 'losingRevealing';
      else cat = 'contemplative';
    } else if (context === 'eight') {
      cat = 'onEightRun';
    } else if (context === 'safety') {
      cat = 'safetyPlayed';
    } else if (context === 'breakout') {
      cat = 'breakoutAttempt';
    } else if (context === 'frameWon') {
      cat = zone === 'losing' ? 'frameWonGracious' : 'frameWonTerse';
    } else if (context === 'frameLost') {
      cat = zone === 'losing' ? 'frameLostResigned' : 'frameLostTerse';
    }
    if (cat) say(cat);
  }

  // HUD regions in SCREEN space
  let hud = {
    shootBtn: null,
    powerBar: null,
    spinBall: null,
    dialogueBox: null,
    zoomIn: null,
    zoomOut: null,
    zoomReset: null
  };

  let modeSelectRegions = null;
  let modeSelectActive = false;
  let formatSelectActive = false;
  let formatSelectRegions = null;
  let interstitialRegions = null;
  let matchEndRegions = null;

  let powerDragging = false;
  let spinDragging = false;

  function newGame(mode) {
    state = {
      mode: mode,
      balls: makeRack(),
      aimX: PLAY_X1 - 100,
      aimY: TABLE_H / 2,
      power: 0.5,
      spinX: 0, spinY: 0,
      turn: 'player',
      playerGroup: null, alistairGroup: null,
      openTable: true,
      ballInHand: false,
      gamePhase: 'aiming',
      firstContact: null,
      pocketedThisShot: [],
      winner: null, loseReason: null,
      playerStats: { shotsTaken: 0, shotsMissed: 0, ballsSunk: 0, scratches: 0, skill: 0.5 },
      calledPocket: null,
      showCallPocket: false,
      dialogue: '', dialogueTimer: 0
    };
    state.balls[0].x = PLAY_X0 + PLAY_W * 0.25;
    state.balls[0].y = TABLE_H / 2;
    if (mode === 'vs') setTimeout(() => say('preMatch'), 150);
    // Reset zoom/pan on new game
    zoomLevel = 1;
    panTX = TABLE_W / 2;
    panTY = TABLE_H / 2;
    panInitialized = true;
  }

  function makeRack() {
    const balls = [];
    balls.push({ id: 0, n: 0, x: 0, y: 0, vx: 0, vy: 0, spinX: 0, spinY: 0, inPlay: true, pocketed: false });
    const foot = { x: PLAY_X0 + PLAY_W * 0.72, y: TABLE_H / 2 };
    const order = [[1], [9, 2], [3, 8, 10], [11, 4, 5, 12], [6, 13, 7, 14, 15]];
    const dx = BALL_R * 2 * 0.866 + 0.4;
    const dy = BALL_R * 2 + 0.4;
    for (let row = 0; row < order.length; row++) {
      const rowBalls = order[row];
      const rowX = foot.x + row * dx;
      const rowY0 = foot.y - ((rowBalls.length - 1) * dy) / 2;
      for (let i = 0; i < rowBalls.length; i++) {
        balls.push({
          id: balls.length, n: rowBalls[i],
          x: rowX, y: rowY0 + i * dy,
          vx: 0, vy: 0, spinX: 0, spinY: 0,
          inPlay: true, pocketed: false
        });
      }
    }
    return balls;
  }

  // ---------- Physics ------------------------------------------------------
  function takeShot() {
    if (!state || state.gamePhase !== 'aiming') return;
    const cue = state.balls[0];
    if (!cue.inPlay) return;

    if (state.mode === 'vs' && state.turn === 'player' && isOnEight('player') &&
        state.calledPocket === null) {
      state.showCallPocket = true;
      return;
    }

    const dx = state.aimX - cue.x;
    const dy = state.aimY - cue.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = 4 + state.power * 22;
    cue.vx = (dx / d) * speed;
    cue.vy = (dy / d) * speed;
    cue.spinX = state.spinX * 6;
    cue.spinY = state.spinY * 6;

    state.firstContact = null;
    state.pocketedThisShot = [];
    state.gamePhase = 'simulating';
    shotStartTime = performance.now();
    if (state.turn === 'player') state.playerStats.shotsTaken++;
    playClick(speed);  // cue strike
  }

  function step() {
    const balls = state.balls;

    for (const b of balls) {
      if (!b.inPlay) continue;
      b.x += b.vx;
      b.y += b.vy;
      b.vx += b.spinX * SPIN_TO_VEL * 0.05;
      b.vy += b.spinY * SPIN_TO_VEL * 0.05;
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.spinX *= SPIN_FRICTION;
      b.spinY *= SPIN_FRICTION;
      if (Math.hypot(b.vx, b.vy) < MIN_SPEED) { b.vx = 0; b.vy = 0; }
    }

    for (const b of balls) {
      if (!b.inPlay) continue;
      if (b.x < PLAY_X0 + BALL_R) { const v = Math.abs(b.vx); b.x = PLAY_X0 + BALL_R; b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; if (v > 1) playThud(v); }
      if (b.x > PLAY_X1 - BALL_R) { const v = Math.abs(b.vx); b.x = PLAY_X1 - BALL_R; b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; if (v > 1) playThud(v); }
      if (b.y < PLAY_Y0 + BALL_R) { const v = Math.abs(b.vy); b.y = PLAY_Y0 + BALL_R; b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; if (v > 1) playThud(v); }
      if (b.y > PLAY_Y1 - BALL_R) { const v = Math.abs(b.vy); b.y = PLAY_Y1 - BALL_R; b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; if (v > 1) playThud(v); }
    }

    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (!a.inPlay) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (!b.inPlay) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minD = BALL_R * 2;
        if (dist > 0 && dist < minD) {
          if (a.n === 0 && state.firstContact === null) state.firstContact = b.n;
          if (b.n === 0 && state.firstContact === null) state.firstContact = a.n;
          const overlap = (minD - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const avn = a.vx * nx + a.vy * ny;
          const bvn = b.vx * nx + b.vy * ny;
          const p = (avn - bvn) * BALL_RESTITUTION;
          a.vx -= p * nx; a.vy -= p * ny;
          b.vx += p * nx; b.vy += p * ny;
          if (a.n === 0) { b.vx += a.spinX * 0.4; b.vy += a.spinY * 0.4; a.spinX *= 0.3; a.spinY *= 0.3; }
          if (b.n === 0) { a.vx += b.spinX * 0.4; a.vy += b.spinY * 0.4; b.spinX *= 0.3; b.spinY *= 0.3; }
          // Click volume based on relative normal velocity
          playClick(Math.abs(avn - bvn));
        }
      }
    }

    for (const b of balls) {
      if (!b.inPlay) continue;
      for (const p of POCKETS) {
        if (Math.hypot(b.x - p.x, b.y - p.y) < POCKET_CAPTURE_R) {
          b.inPlay = false;
          b.pocketed = true;
          b.vx = 0; b.vy = 0;
          b.pocketedAt = p;
          state.pocketedThisShot.push(b);
          playPocket();
          break;
        }
      }
    }

    // More aggressive stop: use squared magnitude; also snap-to-zero anything crawling
    let allStopped = true;
    const MIN_SQ = MIN_SPEED * MIN_SPEED;
    for (const b of balls) {
      if (!b.inPlay) continue;
      const sq = b.vx * b.vx + b.vy * b.vy;
      if (sq < MIN_SQ) { b.vx = 0; b.vy = 0; continue; }
      allStopped = false;
    }

    if (performance.now() - shotStartTime > 8000) {
      // Hard timeout — force everything to stop
      for (const b of balls) { b.vx = 0; b.vy = 0; b.spinX = 0; b.spinY = 0; }
      allStopped = true;
    }
    if (allStopped) resolveShot();
  }

  function resolveShot() {
    if (!state || state.gamePhase !== 'simulating') return;  // re-entry guard
    const pocketed = state.pocketedThisShot;
    const shooter = state.turn;
    const cueBall = state.balls[0];
    const cueScratched = pocketed.some(b => b.n === 0);
    const eightSunk = pocketed.some(b => b.n === 8);

    if (state.openTable) {
      const legalPot = pocketed.find(b => b.n !== 0 && b.n !== 8);
      if (legalPot && !cueScratched) {
        const group = ballType(legalPot.n);
        if (group === 'solid' || group === 'stripe') {
          if (shooter === 'player') {
            state.playerGroup = group;
            state.alistairGroup = group === 'solid' ? 'stripe' : 'solid';
          } else {
            state.alistairGroup = group;
            state.playerGroup = group === 'solid' ? 'stripe' : 'solid';
          }
          state.openTable = false;
        }
      }
    }

    if (eightSunk && state.mode === 'vs') {
      const shooterOnEight = isOnEight(shooter);
      if (!shooterOnEight) { endGame(other(shooter), 'Early eight ball'); return; }
      if (cueScratched) { endGame(other(shooter), 'Cue scratch on eight'); return; }
      if (shooter === 'player' && state.calledPocket !== null) {
        const eight = pocketed.find(b => b.n === 8);
        const called = POCKETS[state.calledPocket];
        if (eight && eight.pocketedAt) {
          if (Math.hypot(eight.pocketedAt.x - called.x, eight.pocketedAt.y - called.y) > 5) {
            endGame('alistair', 'Wrong pocket on eight');
            return;
          }
        }
      }
      endGame(shooter, 'Eight ball sunk legally');
      return;
    }
    // Solo: sinking the 8 when all others are cleared = rack complete; otherwise ignore
    if (eightSunk && state.mode === 'solo') {
      const anyOthersLeft = state.balls.some(b => b.inPlay && b.n !== 0 && b.n !== 8);
      if (!anyOthersLeft) { endGame('player', 'Rack cleared'); return; }
      // Early 8 in solo: respot it on the foot spot, continue playing
      const eight = state.balls.find(b => b.n === 8);
      if (eight) {
        eight.inPlay = true;
        eight.pocketed = false;
        eight.x = PLAY_X0 + PLAY_W * 0.72;
        eight.y = TABLE_H / 2;
        eight.vx = 0; eight.vy = 0;
        // Remove from pocketedThisShot list
        state.pocketedThisShot = state.pocketedThisShot.filter(b => b.n !== 8);
      }
    }

    const shooterGroup = shooter === 'player' ? state.playerGroup : state.alistairGroup;
    let sankOwn = false, sankOpp = false;
    for (const b of pocketed) {
      if (b.n === 0 || b.n === 8) continue;
      const t = ballType(b.n);
      if (state.openTable) sankOwn = true;
      else if (t === shooterGroup) sankOwn = true;
      else sankOpp = true;
    }

    let foul = false;
    if (cueScratched) foul = true;
    if (state.firstContact == null) foul = true;
    if (!state.openTable && shooterGroup && state.firstContact != null) {
      const onEight = isOnEight(shooter);
      if (onEight && state.firstContact !== 8) foul = true;
      if (!onEight && state.firstContact === 8) foul = true;
      if (!onEight && state.firstContact !== 8) {
        if (ballType(state.firstContact) !== shooterGroup) foul = true;
      }
    }

    if (shooter === 'player') {
      if (!sankOwn) state.playerStats.shotsMissed++;
      state.playerStats.ballsSunk += pocketed.filter(b => b.n !== 0).length;
      if (cueScratched) state.playerStats.scratches++;
    }

    // Dossier update (player shots only, vs mode)
    if (state.mode === 'vs' && shooter === 'player' && match) {
      // Compute shot characteristics
      const dx = state.aimX - cueBall.x;
      const dy = state.aimY - cueBall.y;
      const shotAng = Math.atan2(dy, dx);
      // Estimate target pocket by finding nearest pocket to a pocketed ball, or aim line
      let targetPocket = null;
      if (pocketed.length > 0) {
        const p = pocketed[0].pocketedAt;
        if (p) {
          for (let i = 0; i < POCKETS.length; i++) {
            if (Math.hypot(p.x - POCKETS[i].x, p.y - POCKETS[i].y) < 5) { targetPocket = i; break; }
          }
        }
      }
      // Difficulty estimate: use firstContact angle if available
      let difficulty = 0.5;
      if (state.firstContact != null) {
        // Rough heuristic: longer shots are harder
        const d = Math.hypot(state.aimX - cueBall.x, state.aimY - cueBall.y);
        difficulty = Math.min(1, d / 500);
      }
      updateDossier({
        power: state.power,
        firstContactBall: state.firstContact,
        sankOwn: sankOwn,
        scratched: cueScratched,
        targetPocket: targetPocket,
        difficulty: difficulty,
        angleRad: shotAng,
        targetY: state.aimY
      });
    }

    // Psych update (vs mode)
    if (state.mode === 'vs' && match) {
      updatePsych(shooter, {
        sankOwn: sankOwn,
        sankOpp: sankOpp,
        scratched: cueScratched,
        foul: foul,
        wasEasy: false,
        wasHard: false
      });
    }

    if (cueScratched) {
      cueBall.inPlay = true;
      cueBall.pocketed = false;
      cueBall.x = PLAY_X0 + PLAY_W * 0.25;
      cueBall.y = TABLE_H / 2;
      cueBall.vx = 0; cueBall.vy = 0;
      cueBall.spinX = 0; cueBall.spinY = 0;
    }

    if (state.mode === 'vs') {
      if (shooter === 'player') {
        if (cueScratched) say('scratchPlayer');
        else if (sankOpp) say('sunkOpponentBall');
        else if (sankOwn) say('sunkPlayerBall');
        else say('missedPlayer');
      } else {
        // Use adaptive voice for Alistair's own shots
        if (cueScratched) sayAdaptive('scratch');
        else if (sankOwn) sayAdaptive('shotSuccess');
        else sayAdaptive('shotMiss');
      }
    }

    state.calledPocket = null;
    state.showCallPocket = false;

    const continueTurn = sankOwn && !foul;
    if (state.mode === 'solo') {
      // Solo: turn always stays on player; fouls still give ball in hand for consistency
      state.turn = 'player';
      state.ballInHand = foul;
    } else if (!continueTurn) {
      state.turn = other(shooter);
      state.ballInHand = foul;
    } else {
      state.ballInHand = false;
    }

    updateAISkill();
    state.gamePhase = 'aiming';

    if (state.mode === 'vs' && state.turn === 'alistair') {
      state._alistairTurnStart = performance.now();
      setTimeout(alistairMove, 900 + Math.random() * 700);
    }
  }

  function other(t) { return t === 'player' ? 'alistair' : 'player'; }

  function isOnEight(who) {
    const group = who === 'player' ? state.playerGroup : state.alistairGroup;
    if (!group) return false;
    for (const b of state.balls) {
      if (b.n === 0 || b.n === 8) continue;
      if (ballType(b.n) === group && b.inPlay) return false;
    }
    return true;
  }

  function endGame(winner, reason) {
    state.gamePhase = 'gameover';
    state.winner = winner;
    state.loseReason = reason;

    // Solo: one-and-done
    if (state.mode !== 'vs') return;

    // Vs mode: update match state
    if (!match) return;   // safety

    if (winner === 'player') {
      match.playerFrames++;
      match.confidence = Math.max(0, match.confidence - 0.18);
      sayAdaptive('frameLost');
    } else {
      match.alistairFrames++;
      match.confidence = Math.min(1, match.confidence + 0.15);
      sayAdaptive('frameWon');
    }

    // Reset per-frame psych pressure
    match.momentum = 0;
    match.tilt = Math.max(0, match.tilt * 0.5);
    match.composure = Math.min(1, match.composure + 0.15);

    // Decide: match over, or next frame
    if (match.playerFrames >= match.toWin) {
      match.showMatchEnd = true;
      state.gamePhase = 'matchend';
      state.winner = 'player';
      // Match-lost dialogue
      setTimeout(() => {
        if (match.confidence < 0.3) say('matchLostGracious');
        else say('matchLostFirstTime');
      }, 200);
    } else if (match.alistairFrames >= match.toWin) {
      match.showMatchEnd = true;
      state.gamePhase = 'matchend';
      state.winner = 'alistair';
      setTimeout(() => {
        if (match.confidence > 0.75) say('matchWonProud');
        else say('matchWonHumble');
      }, 200);
    } else {
      // Interstitial screen with score + notes, then next frame
      match.showInterstitial = true;
      state.gamePhase = 'interstitial';
      match.interstitialNotes = generateNotes();
      // Alternate breaks
      match.nextBreaker = match.nextBreaker === 'player' ? 'alistair' : 'player';
    }
  }

  function startNextFrame() {
    if (!match) return;
    match.showInterstitial = false;
    const breaker = match.nextBreaker;
    // Rebuild state (new rack) while preserving match
    state = {
      mode: 'vs',
      balls: makeRack(),
      aimX: PLAY_X1 - 100,
      aimY: TABLE_H / 2,
      power: 0.5,
      spinX: 0, spinY: 0,
      turn: breaker,
      playerGroup: null, alistairGroup: null,
      openTable: true,
      ballInHand: false,
      gamePhase: 'aiming',
      firstContact: null,
      pocketedThisShot: [],
      winner: null, loseReason: null,
      playerStats: { shotsTaken: 0, shotsMissed: 0, ballsSunk: 0, scratches: 0,
                     skill: state && state.playerStats ? state.playerStats.skill : 0.5 },
      calledPocket: null,
      showCallPocket: false,
      dialogue: '', dialogueTimer: 0
    };
    state.balls[0].x = PLAY_X0 + PLAY_W * 0.25;
    state.balls[0].y = TABLE_H / 2;

    // Reset zoom for new frame
    zoomLevel = 1;
    panTX = TABLE_W / 2;
    panTY = TABLE_H / 2;

    // If Alistair breaks, schedule his move
    if (breaker === 'alistair') {
      state._alistairTurnStart = performance.now();
      setTimeout(alistairMove, 1200);
    }
  }

  function updateAISkill() {
    const p = state.playerStats;
    if (p.shotsTaken < 2) return;
    const missRate = p.shotsMissed / p.shotsTaken;
    const scratchRate = p.scratches / p.shotsTaken;
    const s = Math.max(0, Math.min(1, 1 - missRate - scratchRate * 0.3));
    p.skill = p.skill * 0.6 + s * 0.4;
  }

  function alistairMove() {
    if (!state || state.gamePhase !== 'aiming') return;
    if (state.turn !== 'alistair') return;
    state._alistairTurnStart = 0;

    const cue = state.balls[0];
    if (state.ballInHand) {
      // Place cue strategically — next to a candidate ball for best opening
      const myBalls = getAlistairCandidates();
      if (myBalls.length > 0) {
        // Pick the ball closest to the kitchen line, place cue near it
        const target = myBalls[0];
        cue.x = Math.max(PLAY_X0 + BALL_R + 2, Math.min(PLAY_X1 - BALL_R - 2, target.x - 60));
        cue.y = Math.max(PLAY_Y0 + BALL_R + 2, Math.min(PLAY_Y1 - BALL_R - 2, target.y));
      } else {
        cue.x = PLAY_X0 + PLAY_W * 0.25;
        cue.y = TABLE_H / 2;
      }
      state.ballInHand = false;
    }

    const plan = chooseAlistairShot();
    const playerSkill = state.playerStats.skill;
    const aiSkill = computeAISkill(playerSkill);
    // Tilt adds noise and reduces control
    const tiltNoise = match ? match.tilt * 30 : 0;
    const noise = (1 - aiSkill) * 55 + tiltNoise;

    state.aimX = plan.aimX + (Math.random() - 0.5) * noise;
    state.aimY = plan.aimY + (Math.random() - 0.5) * noise;
    state.power = plan.power;
    state.spinX = plan.spinX || 0;
    state.spinY = plan.spinY || 0;
    if (plan.calledPocket != null) state.calledPocket = plan.calledPocket;

    // Voice
    if (plan.type === 'safety') sayAdaptive('safety');
    else if (plan.type === 'breakout') sayAdaptive('breakout');
    else if (plan.type === 'eight') sayAdaptive('eight');
    else if (Math.random() < 0.35) sayAdaptive('idle');

    setTimeout(() => takeShot(), 600 + Math.random() * 500);
  }

  function computeAISkill(playerSkill) {
    // Adaptive difficulty with match-psych modifiers.
    let skill = Math.max(0.3, Math.min(0.95, playerSkill + 0.2));
    if (match) {
      // Winning → tighter aim. Losing → reveals openings for player.
      skill += (match.momentum * 0.08);
      skill += (match.composure - 0.5) * 0.1;
      skill -= match.tilt * 0.2;
    }
    return Math.max(0.25, Math.min(0.97, skill));
  }

  function getAlistairCandidates() {
    const onEight = isOnEight('alistair');
    const cands = [];
    for (const b of state.balls) {
      if (!b.inPlay || b.n === 0) continue;
      if (onEight && b.n !== 8) continue;
      if (!onEight && b.n === 8) continue;
      if (!onEight && !state.openTable && state.alistairGroup && ballType(b.n) !== state.alistairGroup) continue;
      if (state.openTable && b.n === 8) continue;
      cands.push(b);
    }
    if (cands.length === 0) {
      for (const b of state.balls) if (b.inPlay && b.n !== 0) cands.push(b);
    }
    return cands;
  }

  // ---------- Strategic shot selection -----------------------------------
  // Evaluates board state and returns a plan:
  //   { type, aimX, aimY, power, spinX, spinY, calledPocket, difficulty }
  function chooseAlistairShot() {
    const cue = state.balls[0];
    const onEight = isOnEight('alistair');
    const candidates = getAlistairCandidates();

    // 1. Enumerate all shot options
    const options = [];
    for (const ball of candidates) {
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const pk = POCKETS[pi];
        const s = scoreShot(cue, ball, pk);
        if (s > -1000) {
          const g = ghostBall(ball, pk);
          const d1 = Math.hypot(g.x - cue.x, g.y - cue.y);
          const d2 = Math.hypot(pk.x - ball.x, pk.y - ball.y);
          // Angle between cue direction and ball-to-pocket
          const v1x = g.x - cue.x, v1y = g.y - cue.y;
          const v2x = pk.x - ball.x, v2y = pk.y - ball.y;
          const cos = (v1x * v2x + v1y * v2y) / ((Math.hypot(v1x,v1y) || 1) * (Math.hypot(v2x,v2y) || 1));
          const difficulty = Math.max(0, Math.min(1, 1 - cos)) * 0.5 + Math.min(1, (d1 + d2) / 900) * 0.5;
          options.push({ ball, pocket: pk, pi, score: s, difficulty, d1, d2 });
        }
      }
    }

    // 2. On the eight — always offense, pick highest-score
    if (onEight) {
      options.sort((a, b) => b.score - a.score);
      const best = options[0];
      if (best) {
        const g = ghostBall(best.ball, best.pocket);
        return {
          type: 'eight',
          aimX: g.x, aimY: g.y,
          power: 0.55 + Math.random() * 0.15,
          calledPocket: best.pi,
          difficulty: best.difficulty
        };
      }
      // No shot — random push
      return { type: 'fallback', aimX: cue.x + 200, aimY: cue.y + 100, power: 0.5 };
    }

    // 3. Check for cluster — Alistair's own balls clumped together
    const clustered = detectCluster(getAlistairOwnBalls());
    if (clustered && Math.random() < 0.55) {
      // Try to find a shot that breaks the cluster while potting
      const cBall = clustered.ball;
      for (const opt of options) {
        if (opt.ball === cBall) {
          // Take this shot with extra power to break out
          const g = ghostBall(opt.ball, opt.pocket);
          return {
            type: 'breakout',
            aimX: g.x, aimY: g.y,
            power: Math.min(0.95, 0.65 + opt.difficulty * 0.3),
            difficulty: opt.difficulty
          };
        }
      }
    }

    // 4. Rank options by goodness (score + shot-type modifier)
    options.sort((a, b) => b.score - a.score);
    const best = options[0];

    // 5. Safety decision — if best shot is hard and match pressure is on, play safe
    const pressure = match ? (match.alistairFrames + match.playerFrames) / match.format : 0;
    const tooHard = !best || best.difficulty > 0.7;
    const shouldSafe = tooHard && (pressure > 0.3) && match && match.tilt < 0.5 && Math.random() < 0.55;
    if (shouldSafe) {
      const safety = planSafety(cue);
      if (safety) {
        match.dossier.safetiesPlayed++;
        return safety;
      }
    }

    // 6. Two-way shot — if best is medium-hard, play it with pace that leaves safety on miss
    const twoWay = best && best.difficulty > 0.4 && best.difficulty < 0.7 && Math.random() < 0.4;
    if (twoWay) {
      const g = ghostBall(best.ball, best.pocket);
      return {
        type: 'two-way',
        aimX: g.x, aimY: g.y,
        power: 0.5 + Math.random() * 0.1,   // softer = stays in place if miss
        difficulty: best.difficulty
      };
    }

    // 7. Default: pure offense — aim at ghost, choose power for position
    if (best) {
      const g = ghostBall(best.ball, best.pocket);
      // Power based on distance and whether we want position control
      const distance = best.d1 + best.d2;
      const tiltFactor = match ? match.tilt : 0;
      const basePower = 0.4 + Math.min(0.4, distance / 1200);
      return {
        type: 'offense',
        aimX: g.x, aimY: g.y,
        power: Math.min(0.95, basePower + tiltFactor * 0.3 + Math.random() * 0.1),
        difficulty: best.difficulty
      };
    }

    // 8. Nothing — defensive random
    return { type: 'fallback', aimX: cue.x + (Math.random() - 0.5) * 300, aimY: cue.y + (Math.random() - 0.5) * 200, power: 0.4 };
  }

  function getAlistairOwnBalls() {
    if (!state.alistairGroup || state.openTable) return [];
    return state.balls.filter(b => b.inPlay && b.n !== 0 && b.n !== 8 && ballType(b.n) === state.alistairGroup);
  }

  // Detect if Alistair's balls are clustered (two or more within ~40px of each other)
  function detectCluster(balls) {
    if (balls.length < 2) return null;
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const d = Math.hypot(balls[i].x - balls[j].x, balls[i].y - balls[j].y);
        if (d < 40) return { ball: balls[i], other: balls[j] };
      }
    }
    return null;
  }

  // Plan a safety shot — hit own ball lightly, leave cue ball behind an opponent ball
  function planSafety(cue) {
    const myBalls = getAlistairOwnBalls();
    if (myBalls.length === 0) return null;
    const oppBalls = state.balls.filter(b => b.inPlay && b.n !== 0 && b.n !== 8 &&
      (state.openTable || ballType(b.n) !== state.alistairGroup));
    if (oppBalls.length === 0) return null;

    // Pick an own ball to hit at low velocity
    const target = myBalls[Math.floor(Math.random() * myBalls.length)];
    // Pick an opponent ball to hide behind (farthest from cue)
    oppBalls.sort((a, b) => Math.hypot(b.x - cue.x, b.y - cue.y) - Math.hypot(a.x - cue.x, a.y - cue.y));
    const hideBehind = oppBalls[0];

    // Aim slightly past the own ball so the cue glances and rolls toward hide position
    const dx = target.x - cue.x;
    const dy = target.y - cue.y;
    const d = Math.hypot(dx, dy) || 1;
    return {
      type: 'safety',
      aimX: target.x + (dx / d) * BALL_R * 1.8,
      aimY: target.y + (dy / d) * BALL_R * 1.8,
      power: 0.18 + Math.random() * 0.1,
      difficulty: 0.5
    };
  }

  function countGroup(who) {
    const g = who === 'player' ? state.playerGroup : state.alistairGroup;
    if (!g) return 7;
    let c = 0;
    for (const b of state.balls) if (b.inPlay && b.n !== 0 && b.n !== 8 && ballType(b.n) === g) c++;
    return c;
  }

  function ghostBall(target, pocket) {
    const dx = target.x - pocket.x;
    const dy = target.y - pocket.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: target.x + (dx / d) * BALL_R * 2, y: target.y + (dy / d) * BALL_R * 2 };
  }

  function scoreShot(cue, ball, pocket) {
    const ghost = ghostBall(ball, pocket);
    const v1x = ghost.x - cue.x, v1y = ghost.y - cue.y;
    const v2x = pocket.x - ball.x, v2y = pocket.y - ball.y;
    const d1 = Math.hypot(v1x, v1y) || 1;
    const d2 = Math.hypot(v2x, v2y) || 1;
    const cos = (v1x * v2x + v1y * v2y) / (d1 * d2);
    if (cos < 0.2) return -1000;
    for (const b of state.balls) {
      if (!b.inPlay) continue;
      if (b.id === ball.id || b.n === 0) continue;
      const dist = pointToSegment(b.x, b.y, cue.x, cue.y, ghost.x, ghost.y);
      if (dist < BALL_R * 1.8) return -500;
    }
    return cos * 10 - d1 * 0.01 - d2 * 0.01;
  }

  function pointToSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const len = C * C + D * D;
    const t = len ? Math.max(0, Math.min(1, dot / len)) : 0;
    const xx = x1 + C * t, yy = y1 + D * t;
    return Math.hypot(px - xx, py - yy);
  }

  function say(cat) {
    if (!cat || !state) return;
    const line = pickLine(cat);
    if (!line) return;
    state.dialogue = line;
    state.dialogueTimer = 320;
  }

  // ---------- Coordinate mapping ------------------------------------------
  // Portrait mode: table rotated 90° CCW.
  //   Table-space (tx, ty) → screen (sx, sy):
  //     sx = offsetX + ty * scale
  //     sy = offsetY + (TABLE_W - tx) * scale    (table x-axis runs upward on screen)
  //   Screen (sx, sy) → table (tx, ty):
  //     ty = (sx - offsetX) / scale
  //     tx = TABLE_W - (sy - offsetY) / scale
  function computeLayout() {
    const W = canvas.width;
    const H = canvas.height;
    const topPad = 8;
    const bottomPad = 180;
    const sidePad = 8;
    const availW = W - sidePad * 2;
    const availH = H - topPad - bottomPad;
    // View region center on screen
    const viewCx = W / 2;
    const viewCy = topPad + availH / 2;

    let baseScale;
    if (W >= H) {
      viewMode = 'landscape';
      baseScale = Math.min(availW / TABLE_W, availH / TABLE_H);
    } else {
      viewMode = 'portrait';
      baseScale = Math.min(availW / TABLE_H, availH / TABLE_W);
    }

    if (!panInitialized) {
      panTX = TABLE_W / 2;
      panTY = TABLE_H / 2;
      panInitialized = true;
    }

    // Effective scale applies user zoom on top of fit-to-screen
    tableScale = baseScale * zoomLevel;

    // Compute offsets so that (panTX, panTY) in table-space maps to viewCenter on screen
    if (viewMode === 'landscape') {
      tableOffsetX = viewCx - panTX * tableScale;
      tableOffsetY = viewCy - panTY * tableScale;
    } else {
      // In portrait, the rotation maps table(tx,ty) -> screen(ox + ty*s, oy + (TABLE_W-tx)*s)
      // Solving for offsets so that (panTX, panTY) -> (viewCx, viewCy):
      //   viewCx = tableOffsetX + panTY * tableScale
      //   viewCy = tableOffsetY + (TABLE_W - panTX) * tableScale
      tableOffsetX = viewCx - panTY * tableScale;
      tableOffsetY = viewCy - (TABLE_W - panTX) * tableScale;
    }

    // Clamp pan so the table can't leave the visible region entirely
    clampPan(availW, availH, viewCx, viewCy);
  }

  function clampPan(availW, availH, viewCx, viewCy) {
    // Keep at least ~30% of the table visible by limiting how far panCenter can move
    // away from the true table center (TABLE_W/2, TABLE_H/2).
    // Allowable movement range depends on zoomLevel: more zoom = more allowable pan.
    const maxOffsetX = (TABLE_W / 2) * (1 - 1 / zoomLevel) + 40;
    const maxOffsetY = (TABLE_H / 2) * (1 - 1 / zoomLevel) + 40;
    panTX = Math.max(TABLE_W / 2 - maxOffsetX, Math.min(TABLE_W / 2 + maxOffsetX, panTX));
    panTY = Math.max(TABLE_H / 2 - maxOffsetY, Math.min(TABLE_H / 2 + maxOffsetY, panTY));
    // Recompute offsets after clamp
    if (viewMode === 'landscape') {
      tableOffsetX = viewCx - panTX * tableScale;
      tableOffsetY = viewCy - panTY * tableScale;
    } else {
      tableOffsetX = viewCx - panTY * tableScale;
      tableOffsetY = viewCy - (TABLE_W - panTX) * tableScale;
    }
  }

  function screenToTable(sx, sy) {
    if (viewMode === 'landscape') {
      return {
        x: (sx - tableOffsetX) / tableScale,
        y: (sy - tableOffsetY) / tableScale
      };
    }
    return {
      x: TABLE_W - (sy - tableOffsetY) / tableScale,
      y: (sx - tableOffsetX) / tableScale
    };
  }

  function tableToScreen(tx, ty) {
    if (viewMode === 'landscape') {
      return { x: tableOffsetX + tx * tableScale, y: tableOffsetY + ty * tableScale };
    }
    return { x: tableOffsetX + ty * tableScale, y: tableOffsetY + (TABLE_W - tx) * tableScale };
  }

  // ---------- Render -------------------------------------------------------
  function render() {
    if (!ctx || !state) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    computeLayout();

    ctx.save();
    if (viewMode === 'landscape') {
      ctx.translate(tableOffsetX, tableOffsetY);
      ctx.scale(tableScale, tableScale);
    } else {
      // Rotate so table-space (0,0) ends up at screen (offsetX + 0*scale, offsetY + TABLE_W*scale)
      // and table-space (TABLE_W, 0) ends up at screen (offsetX, offsetY)
      ctx.translate(tableOffsetX, tableOffsetY + TABLE_W * tableScale);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(tableScale, tableScale);
    }

    drawTable();
    drawBalls();
    drawAim();
    drawCalledPocket();

    ctx.restore();

    drawOverlay();
    drawHUD();
  }

  function drawTable() {
    // ---- Outer table body shadow (falls onto the floor) ----
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-16, TABLE_H - 6, TABLE_W + 32, 28);
    ctx.restore();

    // ---- Rail / cushion base (deep mahogany) ----
    // Draw full table block first, then carve out playfield
    const railGrad = ctx.createLinearGradient(0, 0, 0, TABLE_H);
    railGrad.addColorStop(0,   '#1a0a03');
    railGrad.addColorStop(0.3, '#3a1a08');
    railGrad.addColorStop(0.5, '#4a220c');
    railGrad.addColorStop(0.7, '#3a1a08');
    railGrad.addColorStop(1,   '#140703');
    ctx.fillStyle = railGrad;
    ctx.fillRect(0, 0, TABLE_W, TABLE_H);

    // Subtle wood grain on rails (horizontal streaks)
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      const yTop = 4 + i * 4;
      ctx.beginPath();
      ctx.moveTo(0, yTop);
      ctx.bezierCurveTo(TABLE_W * 0.3, yTop + (Math.sin(i) * 1.5), TABLE_W * 0.7, yTop - (Math.cos(i) * 1.5), TABLE_W, yTop);
      ctx.stroke();
      const yBot = TABLE_H - 4 - i * 4;
      ctx.beginPath();
      ctx.moveTo(0, yBot);
      ctx.bezierCurveTo(TABLE_W * 0.4, yBot + (Math.cos(i) * 1.5), TABLE_W * 0.6, yBot - (Math.sin(i) * 1.5), TABLE_W, yBot);
      ctx.stroke();
    }
    ctx.restore();

    // Rail highlight edges (thin brass/gold trim along inner cushion line)
    ctx.save();
    ctx.strokeStyle = 'rgba(180,140,80,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(PLAY_X0 - 1, PLAY_Y0 - 1, PLAY_W + 2, PLAY_H + 2);
    ctx.restore();

    // ---- Playfield: crimson felt with lamp glow ----
    // Base felt
    ctx.fillStyle = '#6b1a0c';
    ctx.fillRect(PLAY_X0, PLAY_Y0, PLAY_W, PLAY_H);

    // Lamp light falloff — centered warm ellipse (the hanging lamp above)
    const lampGrad = ctx.createRadialGradient(
      TABLE_W / 2, TABLE_H / 2, 30,
      TABLE_W / 2, TABLE_H / 2, TABLE_W * 0.55
    );
    lampGrad.addColorStop(0,   'rgba(255, 200, 130, 0.32)');
    lampGrad.addColorStop(0.3, 'rgba(200, 120,  60, 0.15)');
    lampGrad.addColorStop(0.7, 'rgba(40,  10,   5, 0.25)');
    lampGrad.addColorStop(1,   'rgba(10,   4,   2, 0.55)');
    ctx.fillStyle = lampGrad;
    ctx.fillRect(PLAY_X0, PLAY_Y0, PLAY_W, PLAY_H);

    // Subtle felt grain (two-direction noise via sparse lines)
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#2a0a03';
    ctx.lineWidth = 0.4;
    for (let y = PLAY_Y0 + 4; y < PLAY_Y1; y += 6) {
      ctx.beginPath();
      ctx.moveTo(PLAY_X0, y + Math.sin(y * 0.1) * 0.5);
      ctx.lineTo(PLAY_X1, y + Math.cos(y * 0.1) * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // Inner cushion bevel shadow (felt edge drops into cushion)
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PLAY_X0, PLAY_Y0);
    ctx.lineTo(PLAY_X1, PLAY_Y0);
    ctx.moveTo(PLAY_X0, PLAY_Y1);
    ctx.lineTo(PLAY_X1, PLAY_Y1);
    ctx.moveTo(PLAY_X0, PLAY_Y0);
    ctx.lineTo(PLAY_X0, PLAY_Y1);
    ctx.moveTo(PLAY_X1, PLAY_Y0);
    ctx.lineTo(PLAY_X1, PLAY_Y1);
    ctx.stroke();
    ctx.restore();

    // ---- Pockets with brass rings and dark wells ----
    for (const p of POCKETS) {
      // Outer brass ring (carved into rail)
      const ringGrad = ctx.createRadialGradient(p.x, p.y - 2, POCKET_R * 0.4, p.x, p.y, POCKET_R + 4);
      ringGrad.addColorStop(0,   '#5a3a10');
      ringGrad.addColorStop(0.6, '#3a2208');
      ringGrad.addColorStop(1,   '#1a0a02');
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R + 2, 0, Math.PI * 2);
      ctx.fill();

      // Pocket well (black)
      const wellGrad = ctx.createRadialGradient(p.x, p.y - 3, 1, p.x, p.y, POCKET_R);
      wellGrad.addColorStop(0,   '#1a0a04');
      wellGrad.addColorStop(1,   '#000');
      ctx.fillStyle = wellGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R - 2, 0, Math.PI * 2);
      ctx.fill();

      // Subtle brass rim highlight (top edge catches light)
      ctx.save();
      ctx.strokeStyle = 'rgba(210,170,90,0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.restore();
    }

    // ---- Corner diamond inlays on rails (period detail) ----
    ctx.save();
    ctx.fillStyle = 'rgba(210,170,90,0.25)';
    const diamondPositions = [
      [TABLE_W * 0.25, RAIL / 2], [TABLE_W * 0.5, RAIL / 2], [TABLE_W * 0.75, RAIL / 2],
      [TABLE_W * 0.25, TABLE_H - RAIL / 2], [TABLE_W * 0.5, TABLE_H - RAIL / 2], [TABLE_W * 0.75, TABLE_H - RAIL / 2]
    ];
    for (const [dx, dy] of diamondPositions) {
      ctx.beginPath();
      ctx.moveTo(dx, dy - 2);
      ctx.lineTo(dx + 3, dy);
      ctx.lineTo(dx, dy + 2);
      ctx.lineTo(dx - 3, dy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBalls() {
    for (const b of state.balls) {
      if (!b.inPlay) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(b.x + 2, b.y + 3, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of state.balls) {
      if (!b.inPlay) continue;
      drawBall(b);
    }
  }

  function drawBall(b) {
    ctx.save();

    // Base color with radial shading (dark edge, bright highlight)
    const base = BALL_COLORS[b.n];
    const shade = ctx.createRadialGradient(
      b.x - BALL_R * 0.4, b.y - BALL_R * 0.4, BALL_R * 0.1,
      b.x, b.y, BALL_R * 1.1
    );
    shade.addColorStop(0,   lighten(base, 0.45));
    shade.addColorStop(0.4, base);
    shade.addColorStop(1,   darken(base, 0.55));
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    // Stripe (9-15): white band across middle, colored caps preserved
    if (b.n >= 9 && b.n <= 15) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.clip();
      // White band
      const bandGrad = ctx.createRadialGradient(
        b.x - BALL_R * 0.4, b.y - BALL_R * 0.4, BALL_R * 0.1,
        b.x, b.y, BALL_R * 1.1
      );
      bandGrad.addColorStop(0,   '#ffffff');
      bandGrad.addColorStop(0.5, '#e8dcc3');
      bandGrad.addColorStop(1,   '#9e8a62');
      ctx.fillStyle = bandGrad;
      ctx.fillRect(b.x - BALL_R, b.y - BALL_R * 0.45, BALL_R * 2, BALL_R * 0.9);
      ctx.restore();
    }

    // Number badge (white disc with black number)
    if (b.n !== 0) {
      ctx.fillStyle = '#f8f1dc';
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R * 0.48, 0, Math.PI * 2);
      ctx.fill();
      // Badge inner shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.n), b.x, b.y + 0.5);
    }

    // Specular highlight (bright glint)
    const specGrad = ctx.createRadialGradient(
      b.x - BALL_R * 0.4, b.y - BALL_R * 0.4, 0,
      b.x - BALL_R * 0.4, b.y - BALL_R * 0.4, BALL_R * 0.55
    );
    specGrad.addColorStop(0,   'rgba(255,255,255,0.85)');
    specGrad.addColorStop(0.4, 'rgba(255,255,255,0.25)');
    specGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    // Rim darkening (subtle outline)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R - 0.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Color helpers for ball shading
  function hexToRgb(h) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (!m) return { r: 128, g: 128, b: 128 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }
  function lighten(h, amt) {
    const c = hexToRgb(h);
    return `rgb(${Math.min(255, c.r + (255 - c.r) * amt)|0},${Math.min(255, c.g + (255 - c.g) * amt)|0},${Math.min(255, c.b + (255 - c.b) * amt)|0})`;
  }
  function darken(h, amt) {
    const c = hexToRgb(h);
    return `rgb(${Math.max(0, c.r * (1 - amt))|0},${Math.max(0, c.g * (1 - amt))|0},${Math.max(0, c.b * (1 - amt))|0})`;
  }

  function drawAim() {
    if (state.gamePhase !== 'aiming' || state.turn !== 'player' || state.ballInHand) return;
    const cue = state.balls[0];
    if (!cue.inPlay) return;

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cue.x, cue.y);
    ctx.lineTo(state.aimX, state.aimY);
    ctx.stroke();
    ctx.setLineDash([]);

    const dx = state.aimX - cue.x;
    const dy = state.aimY - cue.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const back = 18 + (1 - state.power) * 30;
    const len = 140;
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cue.x - ux * back, cue.y - uy * back);
    ctx.lineTo(cue.x - ux * (back + len), cue.y - uy * (back + len));
    ctx.stroke();
  }

  function drawCalledPocket() {
    if (state.calledPocket == null) return;
    const p = POCKETS[state.calledPocket];
    ctx.strokeStyle = '#f7c948';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawOverlay() {
    const W = canvas.width;
    const H = canvas.height;

    // Dialogue — positioned in the bottom reserve, above controls
    const dialogueH = 64;
    const dialogueY = H - 24 - 6 - 48 - 6 - dialogueH;  // above turn bar + controls
    if (state.mode === 'vs' && state.dialogue && state.dialogueTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,8,0.90)';
      ctx.strokeStyle = 'rgba(210,170,110,0.6)';
      ctx.lineWidth = 1;
      roundRect(ctx, 8, dialogueY, W - 16, dialogueH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ebdab3';
      ctx.font = 'italic bold 11px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('ALISTAIR', 18, dialogueY + 6);
      ctx.fillStyle = '#e8dcc3';
      ctx.font = '13px Georgia, serif';
      const lines = wrapText(state.dialogue, W - 36);
      for (let i = 0; i < lines.length && i < 2; i++) {
        ctx.fillText(lines[i], 18, dialogueY + 24 + i * 17);
      }
      ctx.restore();
      state.dialogueTimer--;
      hud.dialogueBox = { x: 8, y: dialogueY, w: W - 16, h: dialogueH };
    } else {
      hud.dialogueBox = null;
    }

    // Turn indicator bar at very bottom
    const indH = 24;
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.85)';
    ctx.fillRect(0, H - indH, W, indH);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '11px Georgia, serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let turnLabel;
    if (state.mode !== 'vs') {
      turnLabel = 'PRACTICE';
    } else if (state.turn === 'player') {
      turnLabel = state.gamePhase === 'simulating' ? 'SHOT IN PLAY...' : 'YOUR TURN';
    } else {
      turnLabel = state.gamePhase === 'simulating' ? 'ALISTAIR SHOOTING...' : 'ALISTAIR THINKING...';
    }
    ctx.fillText(turnLabel, 10, H - indH / 2);
    ctx.textAlign = 'center';
    if (state.mode === 'vs' && match) {
      // Show frame score + group info
      const pg = state.playerGroup ? state.playerGroup.toUpperCase() : '';
      const ag = state.alistairGroup ? state.alistairGroup.toUpperCase() : '';
      const groupInfo = state.openTable ? 'OPEN TABLE' : `${pg}  ·  ${ag}`;
      ctx.fillText(`${match.playerFrames} — ${match.alistairFrames}   |   ${groupInfo}`, W / 2, H - indH / 2);
    } else if (!state.openTable) {
      const pg = state.playerGroup ? state.playerGroup.toUpperCase() : '';
      const ag = state.alistairGroup ? state.alistairGroup.toUpperCase() : '';
      ctx.fillText(`You: ${pg}  |  Alistair: ${ag}`, W / 2, H - indH / 2);
    } else {
      ctx.fillText('OPEN TABLE', W / 2, H - indH / 2);
    }
    if (state.ballInHand && state.turn === 'player') {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f7c948';
      ctx.fillText('BALL IN HAND', W - 10, H - indH / 2);
    }
    ctx.restore();

    // Call pocket overlay
    if (state.showCallPocket) {
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,8,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f7c948';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('TAP A POCKET TO CALL YOUR 8-BALL SHOT', W / 2, 40);
      for (let i = 0; i < POCKETS.length; i++) {
        const p = POCKETS[i];
        const s = tableToScreen(p.x, p.y);
        ctx.strokeStyle = '#f7c948';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, (POCKET_R + 6) * tableScale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Zoom controls — top-left (always visible, even for Alistair's turn so UI feels alive)
    drawZoomButtons();

    // Game over
    if (state.gamePhase === 'gameover') {
      ctx.save();
      ctx.fillStyle = 'rgba(10,6,4,0.88)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ebdab3';
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px Georgia, serif';
      const title = state.mode === 'vs'
        ? (state.winner === 'player' ? 'YOU WIN' : 'ALISTAIR WINS')
        : 'RACK COMPLETE';
      ctx.fillText(title, W / 2, H / 2 - 30);
      ctx.font = 'italic 13px Georgia, serif';
      ctx.fillStyle = '#c9b98a';
      ctx.fillText(state.loseReason || '', W / 2, H / 2);
      ctx.fillStyle = '#f7c948';
      ctx.font = '12px Georgia, serif';
      ctx.fillText('Tap to play again', W / 2, H / 2 + 30);
      ctx.restore();
    }
  }

  function drawZoomButtons() {
    const W = canvas.width;
    // Position: top-left column, below the close button
    const btnW = 40;
    const btnH = 40;
    const x = 10;
    let y = 58;  // leave room for close button at top-right

    const drawBtn = (yPos, label, disabled) => {
      ctx.save();
      ctx.fillStyle = disabled ? 'rgba(40,24,14,0.65)' : 'rgba(74,24,8,0.92)';
      roundRect(ctx, x, yPos, btnW, btnH, 6);
      ctx.fill();
      ctx.strokeStyle = disabled ? 'rgba(138,107,46,0.4)' : '#d9a679';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = disabled ? '#7a6842' : '#f5ecd7';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + btnW / 2, yPos + btnH / 2 + 1);
      ctx.restore();
      return { x: x, y: yPos, w: btnW, h: btnH };
    };

    hud.zoomIn = drawBtn(y, '+', zoomLevel >= 3);
    y += btnH + 6;
    hud.zoomOut = drawBtn(y, '−', zoomLevel <= 1);
    y += btnH + 6;
    // Reset button only visible when zoomed
    if (zoomLevel > 1.01) {
      hud.zoomReset = drawBtn(y, '⟲', false);
      // Smaller font for reset glyph
      ctx.save();
      ctx.fillStyle = '#f5ecd7';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⟲', x + btnW / 2, y + btnH / 2 + 2);
      ctx.restore();
    } else {
      hud.zoomReset = null;
    }
  }

  function drawHUD() {
    hud.shootBtn = null;
    hud.powerBar = null;
    hud.spinBall = null;
    if (!state) return;
    if (state.gamePhase === 'interstitial' || state.gamePhase === 'matchend') return;
    if (state.gamePhase !== 'aiming' || state.turn !== 'player') return;
    if (state.showCallPocket || state.ballInHand) return;

    const W = canvas.width;
    const H = canvas.height;

    // Controls sit between dialogue (if any) and turn indicator
    const ctrlH = 48;
    const ctrlTop = H - 24 - 6 - ctrlH;   // above 24px turn bar + 6px gap

    // SHOOT button — left third
    const shootW = Math.min(130, W * 0.36);
    const shootX = 10;
    const shootY = ctrlTop;
    ctx.save();
    ctx.fillStyle = '#7c2a1a';
    roundRect(ctx, shootX, shootY, shootW, ctrlH, 6);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', shootX + shootW / 2, shootY + ctrlH / 2);
    ctx.restore();
    hud.shootBtn = { x: shootX, y: shootY, w: shootW, h: ctrlH };

    // POWER bar — middle
    const spinR = 22;
    const spinCx = W - spinR - 14;
    const spinCy = shootY + ctrlH / 2;
    const pbX = shootX + shootW + 14;
    const pbY = shootY + 6;
    const pbW = Math.max(40, (spinCx - spinR - 6) - pbX - 14);
    const pbH = ctrlH - 12;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(pbX, pbY, pbW, pbH);
    const fillW = pbW * state.power;
    const pg = ctx.createLinearGradient(pbX, 0, pbX + pbW, 0);
    pg.addColorStop(0, '#f7c948');
    pg.addColorStop(1, '#c0392b');
    ctx.fillStyle = pg;
    ctx.fillRect(pbX, pbY, fillW, pbH);
    ctx.strokeStyle = '#8a6b2e';
    ctx.strokeRect(pbX, pbY, pbW, pbH);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('POWER  (drag)', pbX + pbW / 2, pbY - 2);
    ctx.restore();
    hud.powerBar = { x: pbX, y: pbY, w: pbW, h: pbH };

    // SPIN ball — right
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(spinCx, spinCy, spinR + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5ecd7';
    ctx.beginPath();
    ctx.arc(spinCx, spinCy, spinR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6b2e';
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(spinCx + state.spinX * (spinR - 4), spinCy + state.spinY * (spinR - 4), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SPIN', spinCx, spinCy - spinR - 2);
    ctx.restore();
    hud.spinBall = { cx: spinCx, cy: spinCy, r: spinR };
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function wrapText(text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    ctx.font = '13px Georgia, serif';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------- Input --------------------------------------------------------
  function getEventPoint(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else if (e.changedTouches && e.changedTouches.length) { clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
    else { clientX = e.clientX; clientY = e.clientY; }
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function hitRect(x, y, r) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  function hitCircle(x, y, c) { return c && Math.hypot(x - c.cx, y - c.cy) <= c.r; }

  function onPointerDown(e) {
    if (e.cancelable) e.preventDefault();
    unlockAudio();  // mobile audio unlock

    // Pinch detection (two touches)
    if (e.touches && e.touches.length === 2) {
      beginPinch(e);
      return;
    }

    const p = getEventPoint(e);

    // Zoom buttons — only during active game play, not during menu/interstitial/matchend
    const inPlay = state && !formatSelectActive && !modeSelectActive &&
                   state.gamePhase !== 'interstitial' && state.gamePhase !== 'matchend';
    if (inPlay) {
      if (hitRect(p.x, p.y, hud.zoomIn))    { applyZoom(zoomLevel * 1.4); return; }
      if (hitRect(p.x, p.y, hud.zoomOut))   { applyZoom(zoomLevel / 1.4); return; }
      if (hitRect(p.x, p.y, hud.zoomReset)) { applyZoom(1); panTX = TABLE_W / 2; panTY = TABLE_H / 2; return; }
    } else {
      // Clear stale regions so they can't intercept taps on overlay screens
      hud.zoomIn = null; hud.zoomOut = null; hud.zoomReset = null;
    }

    if (modeSelectActive) {
      if (!modeSelectRegions) return;
      if (hitRect(p.x, p.y, modeSelectRegions.solo)) {
        modeSelectActive = false;
        newGame('solo');
      } else if (hitRect(p.x, p.y, modeSelectRegions.vs)) {
        modeSelectActive = false;
        formatSelectActive = true;
      } else if (hitRect(p.x, p.y, modeSelectRegions.exit)) {
        closeBilliards();
      }
      return;
    }

    if (formatSelectActive) {
      if (!formatSelectRegions) return;
      if (hitRect(p.x, p.y, formatSelectRegions.bo3)) {
        formatSelectActive = false;
        newMatch(3);
        newGame('vs');
      } else if (hitRect(p.x, p.y, formatSelectRegions.bo5)) {
        formatSelectActive = false;
        newMatch(5);
        newGame('vs');
      } else if (hitRect(p.x, p.y, formatSelectRegions.bo7)) {
        formatSelectActive = false;
        newMatch(7);
        newGame('vs');
      } else if (hitRect(p.x, p.y, formatSelectRegions.back)) {
        formatSelectActive = false;
        modeSelectActive = true;
      }
      return;
    }

    if (!state) return;

    // Interstitial — tap to continue
    if (state.gamePhase === 'interstitial' && match && match.showInterstitial) {
      if (interstitialRegions && hitRect(p.x, p.y, interstitialRegions.continue)) {
        startNextFrame();
        return;
      }
      // Any tap outside the Continue button just continues too
      startNextFrame();
      return;
    }

    // Match end — tap to return to menu
    if (state.gamePhase === 'matchend') {
      if (matchEndRegions && hitRect(p.x, p.y, matchEndRegions.menu)) {
        state = null;
        match = null;
        modeSelectActive = true;
        return;
      }
      if (matchEndRegions && hitRect(p.x, p.y, matchEndRegions.rematch)) {
        const fmt = match.format;
        newMatch(fmt);
        newGame('vs');
        return;
      }
      return;
    }

    if (state.gamePhase === 'gameover') {
      newGame(state.mode);
      return;
    }

    if (state.showCallPocket) {
      const tp = screenToTable(p.x, p.y);
      let nearest = -1, nd = 9999;
      for (let i = 0; i < POCKETS.length; i++) {
        const d = Math.hypot(tp.x - POCKETS[i].x, tp.y - POCKETS[i].y);
        if (d < nd) { nd = d; nearest = i; }
      }
      if (nd < POCKET_R + 60) {
        state.calledPocket = nearest;
        state.showCallPocket = false;
        setTimeout(takeShot, 150);
      }
      return;
    }

    if (state.gamePhase === 'aiming' && state.turn === 'player' && !state.ballInHand) {
      if (hitRect(p.x, p.y, hud.shootBtn)) { takeShot(); return; }
      if (hitRect(p.x, p.y, hud.powerBar)) { powerDragging = true; updatePowerFromX(p.x); return; }
      if (hitCircle(p.x, p.y, hud.spinBall)) { spinDragging = true; updateSpin(p.x, p.y); return; }
    }

    if (state.ballInHand && state.turn === 'player' && state.gamePhase === 'aiming') {
      const tp = screenToTable(p.x, p.y);
      if (tp.x > PLAY_X0 + BALL_R && tp.x < PLAY_X1 - BALL_R &&
          tp.y > PLAY_Y0 + BALL_R && tp.y < PLAY_Y1 - BALL_R) {
        let ok = true;
        for (const b of state.balls) {
          if (!b.inPlay || b.n === 0) continue;
          if (Math.hypot(tp.x - b.x, tp.y - b.y) < BALL_R * 2 + 1) { ok = false; break; }
        }
        if (ok) {
          state.balls[0].x = tp.x;
          state.balls[0].y = tp.y;
          state.ballInHand = false;
          return;
        }
      }
    }

    if (state.gamePhase === 'aiming' && state.turn === 'player' && !state.ballInHand) {
      // Don't change aim if tap is on zoom buttons (already handled earlier)
      if (hitRect(p.x, p.y, hud.zoomIn)) return;
      if (hitRect(p.x, p.y, hud.zoomOut)) return;
      if (hitRect(p.x, p.y, hud.zoomReset)) return;
      const tp = screenToTable(p.x, p.y);
      state.aimX = tp.x;
      state.aimY = tp.y;
    }
  }

  function onPointerMove(e) {
    if (!state) return;
    // Pinch update
    if (e.touches && e.touches.length === 2 && pinchStartDist > 0) {
      if (e.cancelable) e.preventDefault();
      updatePinch(e);
      return;
    }
    if (e.cancelable && (powerDragging || spinDragging)) e.preventDefault();
    const p = getEventPoint(e);

    if (powerDragging) { updatePowerFromX(p.x); return; }
    if (spinDragging) { updateSpin(p.x, p.y); return; }

    if (state.gamePhase === 'aiming' && state.turn === 'player' &&
        !state.ballInHand && !state.showCallPocket) {
      if (hitRect(p.x, p.y, hud.shootBtn)) return;
      if (hitRect(p.x, p.y, hud.powerBar)) return;
      if (hitCircle(p.x, p.y, hud.spinBall)) return;
      if (hitRect(p.x, p.y, hud.zoomIn)) return;
      if (hitRect(p.x, p.y, hud.zoomOut)) return;
      if (hitRect(p.x, p.y, hud.zoomReset)) return;
      if (hud.dialogueBox && hitRect(p.x, p.y, hud.dialogueBox)) return;
      const tp = screenToTable(p.x, p.y);
      state.aimX = tp.x;
      state.aimY = tp.y;
    }
  }

  function onPointerUp() {
    powerDragging = false;
    spinDragging = false;
    pinchStartDist = 0;
    pinchCenterTable = null;
  }

  // ---------- Zoom / pan helpers ------------------------------------------
  function applyZoom(newZoom) {
    zoomLevel = Math.max(1, Math.min(3, newZoom));
    if (zoomLevel <= 1.01) {
      // Snap to center when fully zoomed out
      panTX = TABLE_W / 2;
      panTY = TABLE_H / 2;
    } else if (state) {
      // Center on cue ball when zooming in from 1x
      const cue = state.balls[0];
      if (cue && cue.inPlay) {
        panTX = cue.x;
        panTY = cue.y;
      }
    }
  }

  function beginPinch(e) {
    const t1 = e.touches[0], t2 = e.touches[1];
    pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    pinchStartZoom = zoomLevel;
    // Compute table-space point at pinch midpoint
    const rect = canvas.getBoundingClientRect();
    const cx = (t1.clientX + t2.clientX) / 2;
    const cy = (t1.clientY + t2.clientY) / 2;
    const sx = (cx - rect.left) * (canvas.width / rect.width);
    const sy = (cy - rect.top) * (canvas.height / rect.height);
    pinchCenterTable = screenToTable(sx, sy);
    // Cancel drags
    powerDragging = false;
    spinDragging = false;
  }

  function updatePinch(e) {
    if (!pinchStartDist || !pinchCenterTable) return;
    const t1 = e.touches[0], t2 = e.touches[1];
    const d = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const newZoom = Math.max(1, Math.min(3, pinchStartZoom * (d / pinchStartDist)));
    zoomLevel = newZoom;
    // Keep the table-space point under the finger midpoint stable
    panTX = pinchCenterTable.x;
    panTY = pinchCenterTable.y;
  }

  function updatePowerFromX(x) {
    if (!hud.powerBar) return;
    const t = Math.max(0, Math.min(1, (x - hud.powerBar.x) / hud.powerBar.w));
    state.power = t;
  }

  function updateSpin(x, y) {
    if (!hud.spinBall) return;
    const dx = (x - hud.spinBall.cx) / (hud.spinBall.r - 4);
    const dy = (y - hud.spinBall.cy) / (hud.spinBall.r - 4);
    const d = Math.hypot(dx, dy);
    const clamp = d > 1 ? 1 / d : 1;
    state.spinX = dx * clamp;
    state.spinY = dy * clamp;
  }

  // ---------- Mode select --------------------------------------------------
  function drawModeSelect() {
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    g.addColorStop(0, '#2a1206');
    g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 20px Georgia, serif';
    const titleY = Math.max(60, H * 0.14);
    ctx.fillText('THE BILLIARD TABLE', W / 2, titleY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    const tagLines = wrapText('The felt is honest. Most things in this house are not.', W - 40);
    let tagY = titleY + 28;
    for (const l of tagLines) { ctx.fillText(l, W / 2, tagY); tagY += 16; }

    // Compute button layout — always fits in available vertical space
    const cw = Math.min(300, W - 40);
    const cx = W / 2 - cw / 2;
    const btnH = 66;
    const gap = 14;
    const exitH = 40;
    const totalH = btnH * 2 + gap * 2 + exitH;
    const availTop = tagY + 20;
    const availBot = H - 30;
    const availH = availBot - availTop;
    // If cramped (tiny screen), stack anyway starting from availTop
    let stackTop;
    if (totalH > availH) {
      stackTop = availTop;
    } else {
      stackTop = availTop + (availH - totalH) / 2;
    }

    const soloY = stackTop;
    const vsY = soloY + btnH + gap;
    const exitY = vsY + btnH + gap;

    ctx.fillStyle = '#4a1808';
    roundRect(ctx, cx, soloY, cw, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('SOLO PRACTICE', W / 2, soloY + 26);
    ctx.fillStyle = '#c9b98a';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillText('Rack. Break. Play at your own pace.', W / 2, soloY + 48);

    ctx.fillStyle = '#4a1808';
    roundRect(ctx, cx, vsY, cw, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('CHALLENGE ALISTAIR', W / 2, vsY + 26);
    ctx.fillStyle = '#c9b98a';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillText('Loser owes a truthful answer.', W / 2, vsY + 48);

    ctx.strokeStyle = '#8a6b2e';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, exitY, cw, exitH);
    ctx.fillStyle = '#c9b98a';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('LEAVE THE TABLE', W / 2, exitY + exitH / 2 + 4);

    modeSelectRegions = {
      solo: { x: cx, y: soloY, w: cw, h: btnH },
      vs:   { x: cx, y: vsY,   w: cw, h: btnH },
      exit: { x: cx, y: exitY, w: cw, h: exitH }
    };
  }

  function drawFormatSelect() {
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    g.addColorStop(0, '#2a1206');
    g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 20px Georgia, serif';
    const titleY = Math.max(60, H * 0.14);
    ctx.fillText('CHOOSE YOUR STAKES', W / 2, titleY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    let tagY = titleY + 26;
    const lines = wrapText('Alistair will remember what you taught him. Choose carefully.', W - 40);
    for (const l of lines) { ctx.fillText(l, W / 2, tagY); tagY += 16; }

    const cw = Math.min(320, W - 40);
    const cx = W / 2 - cw / 2;
    const btnH = 64;
    const gap = 12;
    const backH = 40;
    const totalH = btnH * 3 + gap * 3 + backH;
    const availTop = tagY + 20;
    const availH = H - 30 - availTop;
    let y = availH > totalH ? availTop + (availH - totalH) / 2 : availTop;

    const drawFormatBtn = (yy, title, subtitle) => {
      ctx.fillStyle = '#4a1808';
      roundRect(ctx, cx, yy, cw, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = '#d9a679';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f5ecd7';
      ctx.font = 'bold 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, yy + 26);
      ctx.fillStyle = '#c9b98a';
      ctx.font = 'italic 11px Georgia, serif';
      ctx.fillText(subtitle, W / 2, yy + 46);
      return { x: cx, y: yy, w: cw, h: btnH };
    };

    const bo3 = drawFormatBtn(y, 'BEST OF 3', 'First to 2 frames. Quick.');
    y += btnH + gap;
    const bo5 = drawFormatBtn(y, 'BEST OF 5', 'First to 3 frames. The proper match.');
    y += btnH + gap;
    const bo7 = drawFormatBtn(y, 'BEST OF 7', 'First to 4 frames. Test of endurance.');
    y += btnH + gap;

    ctx.strokeStyle = '#8a6b2e';
    ctx.strokeRect(cx, y, cw, backH);
    ctx.fillStyle = '#c9b98a';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('← BACK', W / 2, y + backH / 2 + 4);

    formatSelectRegions = {
      bo3: bo3, bo5: bo5, bo7: bo7,
      back: { x: cx, y: y, w: cw, h: backH }
    };
  }

  function drawInterstitial() {
    if (!ctx || !canvas || !match) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    g.addColorStop(0, '#2a1206');
    g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 18px Georgia, serif';
    const titleY = Math.max(50, H * 0.10);
    ctx.fillText('BETWEEN FRAMES', W / 2, titleY);

    // Score display
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerFrames + '   —   ' + match.alistairFrames, W / 2, titleY + 54);
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('YOU         ALISTAIR', W / 2, titleY + 74);

    // Format label
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#8a6b2e';
    const needed = match.toWin;
    const tail = 'Best of ' + match.format + ' — first to ' + needed;
    ctx.fillText(tail, W / 2, titleY + 92);

    // "Alistair's notes on you"
    const notesTop = titleY + 120;
    ctx.font = 'italic bold 13px Georgia, serif';
    ctx.fillStyle = '#d9a679';
    ctx.fillText("ALISTAIR'S NOTES ON YOU", W / 2, notesTop);

    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#e8dcc3';
    ctx.textAlign = 'left';
    const notes = match.interstitialNotes || [];
    const padX = 22;
    let ny = notesTop + 22;
    const maxW = W - padX * 2;
    for (const note of notes.slice(0, 6)) {
      const wrapped = wrapText(note, maxW);
      for (const l of wrapped) {
        ctx.fillText(l, padX, ny);
        ny += 16;
      }
      ny += 4;
    }

    // Psych meter — Alistair's confidence bar
    const meterY = Math.min(H - 110, ny + 16);
    ctx.textAlign = 'center';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#8a6b2e';
    ctx.fillText('ALISTAIR\'S COMPOSURE', W / 2, meterY);
    const mw = Math.min(260, W - 60);
    const mx = W / 2 - mw / 2;
    const my = meterY + 8;
    const mh = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(mx, my, mw, mh);
    const conf = match.confidence;
    const fill = mw * conf;
    const gradM = ctx.createLinearGradient(mx, 0, mx + mw, 0);
    gradM.addColorStop(0, '#c0392b');
    gradM.addColorStop(1, '#f7c948');
    ctx.fillStyle = gradM;
    ctx.fillRect(mx, my, fill, mh);
    ctx.strokeStyle = '#8a6b2e';
    ctx.strokeRect(mx, my, mw, mh);

    // Continue button
    const contW = Math.min(220, W - 40);
    const contH = 48;
    const contX = W / 2 - contW / 2;
    const contY = H - 80;
    ctx.fillStyle = '#4a1808';
    roundRect(ctx, contX, contY, contW, contH, 6);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RACK THE NEXT FRAME', W / 2, contY + contH / 2);

    // Breaker indicator
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.textBaseline = 'alphabetic';
    const breakLabel = match.nextBreaker === 'player' ? 'You break' : 'Alistair breaks';
    ctx.fillText(breakLabel, W / 2, contY - 8);

    interstitialRegions = { continue: { x: contX, y: contY, w: contW, h: contH } };
  }

  function drawMatchEnd() {
    if (!ctx || !canvas || !match) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    g.addColorStop(0, '#2a1206');
    g.addColorStop(1, '#050201');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const playerWon = match.playerFrames > match.alistairFrames;
    ctx.fillStyle = playerWon ? '#f7c948' : '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 26px Georgia, serif';
    const titleY = Math.max(60, H * 0.14);
    ctx.fillText(playerWon ? 'YOU WON THE MATCH' : 'ALISTAIR WINS', W / 2, titleY);

    // Final score
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerFrames + '  —  ' + match.alistairFrames, W / 2, titleY + 64);

    // Final stats
    const d = match.dossier;
    const potRate = d.shotsTaken ? (d.shotsPotted / d.shotsTaken * 100) | 0 : 0;
    const avgPower = d.shotsTaken ? (d.totalPower / d.shotsTaken * 100) | 0 : 0;
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    let sy = titleY + 108;
    ctx.textAlign = 'left';
    const padX = 32;
    const stats = [
      'YOUR FINAL LINE',
      '  Pot rate:     ' + potRate + '%',
      '  Scratches:   ' + d.scratches,
      '  Avg power:   ' + avgPower + '%',
      '  Hard shots:  ' + d.hardPots + ' attempted',
      '  Cuts / straights:  ' + d.cutShots + ' / ' + d.straightShots,
      '  Safeties by Alistair:  ' + d.safetiesPlayed
    ];
    for (const s of stats) {
      if (s.indexOf('YOUR') === 0) { ctx.fillStyle = '#d9a679'; ctx.font = 'italic bold 12px Georgia, serif'; }
      else { ctx.fillStyle = '#e8dcc3'; ctx.font = '12px Georgia, serif'; }
      ctx.fillText(s, padX, sy);
      sy += 18;
    }
    sy += 10;

    // Alistair's closing note
    ctx.fillStyle = '#d9a679';
    ctx.font = 'italic bold 12px Georgia, serif';
    ctx.fillText("ALISTAIR'S READ", padX, sy);
    sy += 18;
    ctx.fillStyle = '#e8dcc3';
    ctx.font = 'italic 12px Georgia, serif';
    const notes = generateNotes().slice(0, 3);
    const maxW = W - padX * 2;
    for (const note of notes) {
      const lines = wrapText(note, maxW);
      for (const l of lines) {
        ctx.fillText(l, padX, sy);
        sy += 16;
      }
      sy += 4;
    }

    // Buttons
    const bw = Math.min(160, (W - 60) / 2);
    const bh = 44;
    const gap = 16;
    const totalW = bw * 2 + gap;
    const bx0 = W / 2 - totalW / 2;
    const by = H - bh - 20;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a1808';
    roundRect(ctx, bx0, by, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('REMATCH', bx0 + bw / 2, by + bh / 2);

    const bx1 = bx0 + bw + gap;
    ctx.fillStyle = '#2a1206';
    roundRect(ctx, bx1, by, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a6b2e';
    ctx.stroke();
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('MAIN MENU', bx1 + bw / 2, by + bh / 2);

    matchEndRegions = {
      rematch: { x: bx0, y: by, w: bw, h: bh },
      menu:    { x: bx1, y: by, w: bw, h: bh }
    };
  }

  // ---------- Loop ---------------------------------------------------------
  function loop() {
    if (!canvas) return;
    if (modeSelectActive) {
      drawModeSelect();
    } else if (formatSelectActive) {
      drawFormatSelect();
    } else if (state && state.gamePhase === 'interstitial') {
      drawInterstitial();
    } else if (state && state.gamePhase === 'matchend') {
      drawMatchEnd();
    } else if (state) {
      if (state.gamePhase === 'simulating') step();
      // Watchdog: if Alistair's turn has been pending too long, kick it
      if (state.mode === 'vs' && state.turn === 'alistair' &&
          state.gamePhase === 'aiming' && state._alistairTurnStart &&
          performance.now() - state._alistairTurnStart > 4000) {
        state._alistairTurnStart = 0;
        alistairMove();
      }
      render();
    }
    rafId = requestAnimationFrame(loop);
  }

  // ---------- Open / Close -------------------------------------------------
  function openBilliards() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'nocturne-billiards';
    modal.style.cssText = [
      'position:fixed','inset:0','z-index:9999',
      'background:radial-gradient(ellipse at center, #1a0e07 0%, #0a0503 50%, #000 100%)',
      'overflow:hidden','touch-action:none',
      'display:flex','align-items:stretch','justify-content:stretch'
    ].join(';');

    const close = document.createElement('button');
    close.textContent = '× CLOSE';
    close.style.cssText = [
      'position:absolute','top:10px','right:10px',
      'background:rgba(40,20,10,0.85)','color:#ebdab3',
      'border:1px solid #8a6b2e','padding:6px 12px',
      'font-family:Georgia, serif','font-size:12px',
      'cursor:pointer','z-index:2','border-radius:4px'
    ].join(';');
    close.addEventListener('click', closeBilliards);
    close.addEventListener('touchend', (e) => { e.preventDefault(); closeBilliards(); });

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;touch-action:none;width:100%;height:100%;';
    modal.appendChild(canvas);
    modal.appendChild(close);
    document.body.appendChild(modal);

    ctx = canvas.getContext('2d');
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    window.addEventListener('orientationchange', fitCanvas);

    modeSelectActive = true;

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);
    canvas.addEventListener('touchcancel', onPointerUp);

    loop();
  }

  function fitCanvas() {
    if (!canvas) return;
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  function closeBilliards() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
    canvas = null;
    ctx = null;
    state = null;
    modeSelectActive = false;
    powerDragging = false;
    spinDragging = false;
    window.removeEventListener('resize', fitCanvas);
    window.removeEventListener('orientationchange', fitCanvas);
  }

  window.openBilliards = openBilliards;
  window.closeBilliards = closeBilliards;

})();
