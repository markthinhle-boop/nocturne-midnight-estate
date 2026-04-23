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
  let shotStartTime = 0;
  // canvas, ctx, modal, rafId declared in v2 rendering section below

  // Layout state (3D perspective) — computed per frame in render()
  // Populated with: cornerScreen[4], tableScale, perspectiveM, inversePerspectiveM

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

  // ==========================================================================
  // v2 RENDERING + INPUT — pseudo-3D table, drag-cue-ball aiming, large balls
  // ==========================================================================

  // ---------- 3D Projection ------------------------------------------------
  // We place the table in a world coordinate system with origin at table center,
  // table lying in the XZ plane (Y is up). The camera sits in front of and above
  // the table, looking down at a ~25° tilt, and projects to screen.
  //
  // World: table spans x ∈ [-TW/2..+TW/2], z ∈ [-TH/2..+TH/2], Y=0 (surface)
  // Where TW = TABLE_W, TH = TABLE_H (internal units)
  //
  // Projection params updated per frame in computeLayout3D():
  //   cam.tiltRad, cam.eyeHeight, cam.distance, cam.focal, cam.screenCx, cam.screenCy

  const cam = {
    tiltRad: 0,        // table tilted back around world X axis
    eyeHeight: 0,      // camera height above table center (world Y)
    distance: 0,       // camera Z distance from table center
    focal: 0,          // focal length for perspective projection
    screenCx: 0,       // screen center X
    screenCy: 0,       // screen center Y
    scale: 1           // master scale for all screen output
  };

  // Table corners in world space: [-TW/2, 0, +TH/2] (front-left near camera), etc.
  // After projection, these 4 corners define the on-screen trapezoid.

  // Project world (wx, wy, wz) → screen (sx, sy). wy=0 for ball/pocket positions.
  function projectWorld(wx, wy, wz) {
    // 1. Rotate around world X axis by tiltRad (tilt the table back)
    //    Input: (wx, wy, wz). After tilt: y' = wy*cos - wz*sin, z' = wy*sin + wz*cos
    const c = Math.cos(cam.tiltRad), s = Math.sin(cam.tiltRad);
    const ry = wy * c - wz * s;
    const rz = wy * s + wz * c;
    // 2. Translate so camera sits at origin, looking down +Z: camera is at (0, eyeHeight, -distance)
    //    So in camera frame: x_c = wx, y_c = ry - eyeHeight, z_c = rz + distance
    const xc = wx;
    const yc = ry - cam.eyeHeight;
    const zc = rz + cam.distance;
    // 3. Perspective projection
    const f = cam.focal / Math.max(0.0001, zc);
    const sx = cam.screenCx + xc * f;
    const sy = cam.screenCy + yc * f;
    return { x: sx, y: sy, depth: zc, scale: f };
  }

  // Table-space (tx, ty) — game coordinates where tx∈[0,TABLE_W], ty∈[0,TABLE_H]
  // — mapped to world (wx, 0, wz).
  function tableToWorld(tx, ty) {
    // Table center is at world origin.
    return { x: tx - TABLE_W / 2, y: 0, z: ty - TABLE_H / 2 };
  }

  // Inverse mapping: screen pixel → table coordinate (for input).
  // We ray-cast from camera through the screen point, intersect with table plane (y=0).
  function screenToTable(sx, sy) {
    // Undo the screen-space translation/scale
    const xc_over_f = (sx - cam.screenCx);  // = xc * f, so xc/zc = this / cam.focal
    const yc_over_f = (sy - cam.screenCy);
    // Ray direction in camera frame: (xc_over_f/focal, yc_over_f/focal, 1)
    const rdx = xc_over_f / cam.focal;
    const rdy = yc_over_f / cam.focal;
    const rdz = 1;
    // Camera origin in camera frame is (0,0,0); ray = origin + t*dir.
    // In world frame (before camera translation): camera was at (0, eyeHeight, -distance).
    // A point P_cam = (xc, yc, zc) corresponds to P_world_tilted = (xc, yc + eyeHeight, zc - distance)
    // Then un-tilt: P_world = rotateX(-tiltRad) * P_world_tilted
    // We want to find t such that the resulting world Y = 0.
    //
    // Simplification: walk along the ray and pick t where un-tilted y = 0.
    // Let P(t) = (rdx*t, rdy*t + eyeHeight, rdz*t - distance) (in pre-tilt world frame)
    // Un-tilt: world_y = (rdy*t + eyeHeight) * cos(tiltRad) - (rdz*t - distance) * (-sin(tiltRad))
    //                  = (rdy*t + eyeHeight) * cos + (rdz*t - distance) * sin
    // Wait — rotation was applied IN projection, so undo it in reverse order:
    //   projected went: world → tilt → translate. Inverse: translate back → un-tilt.
    //
    // Actually simplest: compute world_y as a linear function of t, solve for t where it = 0.
    // In camera frame P = (rdx*t, rdy*t, rdz*t). Add camera position in world-tilted: (0, eyeHeight, -distance)
    //   P_tilted_world = (rdx*t, rdy*t + eyeHeight, rdz*t - distance)
    // Un-tilt (rotate by -tiltRad around X): y_world = y_tilted*cos + z_tilted*sin
    //                                         z_world = -y_tilted*sin + z_tilted*cos
    // Solve y_world = 0:
    //   (rdy*t + eyeHeight) * cos(tilt) + (rdz*t - distance) * sin(tilt) = 0
    //   t * (rdy*cos + rdz*sin) = -eyeHeight*cos + distance*sin
    //   t = (distance*sin - eyeHeight*cos) / (rdy*cos + rdz*sin)
    const c = Math.cos(cam.tiltRad), s = Math.sin(cam.tiltRad);
    const denom = rdy * c + rdz * s;
    if (Math.abs(denom) < 1e-6) return { x: -1, y: -1 };
    const t = (cam.distance * s - cam.eyeHeight * c) / denom;
    if (t <= 0) return { x: -1, y: -1 };
    // Compute world point
    const xt = rdx * t;
    const yt = rdy * t + cam.eyeHeight;
    const zt = rdz * t - cam.distance;
    const worldZ = -yt * s + zt * c;
    // Now worldX = xt (rotation around X doesn't change X), worldZ as above
    const worldX = xt;
    // Convert back to table coords
    const tx = worldX + TABLE_W / 2;
    const ty = worldZ + TABLE_H / 2;
    return { x: tx, y: ty };
  }

  function computeLayout3D() {
    const W = canvas.width;
    const H = canvas.height;
    // Reserve: top 80 for dialogue/score, bottom 120 for controls, small side padding.
    const topReserve = 80;
    const bottomReserve = 120;
    const availW = W - 24;
    const availH = H - topReserve - bottomReserve;

    // Pick a tilt and distance that make the table fill the available area.
    // Tilt angle (stronger on portrait, lighter on landscape so you don't see too much rail).
    const portrait = H > W;
    cam.tiltRad = portrait ? (28 * Math.PI / 180) : (22 * Math.PI / 180);

    // Camera looks at the center of the table. Place camera so the projected
    // table roughly fits availW × availH.
    // Simple approach: pick a "scale" such that TABLE_W fits in availW at the far edge.
    // Perspective makes far edge slightly narrower; we want near edge ≤ availW.
    // Use a heuristic: baseScale = availW / TABLE_W * 0.95
    const baseScale = Math.min(availW / TABLE_W, availH / (TABLE_H * Math.cos(cam.tiltRad)));
    // Focal length controls perspective strength. Higher focal = less exaggerated.
    cam.focal = 900;
    // Distance: derived from focal so that a 1-unit-wide object at table center
    // projects at baseScale pixels wide.
    //   screen_width_at_z = focal / z; want this to equal baseScale
    //   z = focal / baseScale  (this is the Z of the table center in camera frame)
    cam.distance = cam.focal / baseScale;
    // Eye height: raise camera so tilt shows the top rail. Rough rule: h = tan(tilt) * distance * 0.25
    cam.eyeHeight = cam.distance * Math.tan(cam.tiltRad) * 0.25;

    // Screen center — biased slightly downward because we reserve top space for UI
    cam.screenCx = W / 2;
    cam.screenCy = topReserve + availH / 2;
    cam.scale = baseScale;
  }

  // ---------- Rendering ----------------------------------------------------

  function render() {
    if (!ctx || !state) return;
    const W = canvas.width;
    const H = canvas.height;

    // Background — warm candlelit darkness
    const bg = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    bg.addColorStop(0, '#1a0e07');
    bg.addColorStop(1, '#050201');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    computeLayout3D();

    drawTable3D();
    drawPocketsTop();  // separate pass for pocket dark wells so balls can occlude them properly
    drawBallShadows();
    drawBallsSorted();
    drawAimLine();
    drawCalledPocketMarker();

    drawTopBar();
    drawDialogueBubble();
    drawControlsBottom();
    drawCallPocketPrompt();
    drawGameOverOverlay();
  }

  // Table rendering: a tilted trapezoid in 3D, plus raised rails as thin 3D blocks.
  function drawTable3D() {
    // Compute the 4 corners of the playfield in world space (at y=0)
    const corners = [
      projectWorld(-TABLE_W/2, 0, -TABLE_H/2),   // far-left  (upper-left on screen)
      projectWorld( TABLE_W/2, 0, -TABLE_H/2),   // far-right (upper-right)
      projectWorld( TABLE_W/2, 0,  TABLE_H/2),   // near-right (lower-right)
      projectWorld(-TABLE_W/2, 0,  TABLE_H/2)    // near-left (lower-left)
    ];

    // Table body (rails extending down) — draw the side walls for depth.
    // For simplicity: draw an extruded box beneath the table top.
    const railHeight = 22;
    const bottomCorners = [
      projectWorld(-TABLE_W/2, -railHeight, -TABLE_H/2),
      projectWorld( TABLE_W/2, -railHeight, -TABLE_H/2),
      projectWorld( TABLE_W/2, -railHeight,  TABLE_H/2),
      projectWorld(-TABLE_W/2, -railHeight,  TABLE_H/2)
    ];

    // Shadow on the ground beneath the table
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(bottomCorners[0].x - 14, bottomCorners[0].y + 4);
    ctx.lineTo(bottomCorners[1].x + 14, bottomCorners[1].y + 4);
    ctx.lineTo(bottomCorners[2].x + 20, bottomCorners[2].y + 14);
    ctx.lineTo(bottomCorners[3].x - 20, bottomCorners[3].y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Front rail side (visible as a brown band beneath the near edge)
    ctx.save();
    const sideGrad = ctx.createLinearGradient(0, corners[2].y, 0, bottomCorners[2].y);
    sideGrad.addColorStop(0, '#3a1c08');
    sideGrad.addColorStop(1, '#1a0a03');
    ctx.fillStyle = sideGrad;
    ctx.beginPath();
    ctx.moveTo(corners[3].x, corners[3].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(bottomCorners[2].x, bottomCorners[2].y);
    ctx.lineTo(bottomCorners[3].x, bottomCorners[3].y);
    ctx.closePath();
    ctx.fill();
    // Left and right side walls (partial visibility)
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.lineTo(bottomCorners[3].x, bottomCorners[3].y);
    ctx.lineTo(bottomCorners[0].x, bottomCorners[0].y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(bottomCorners[2].x, bottomCorners[2].y);
    ctx.lineTo(bottomCorners[1].x, bottomCorners[1].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw the rail surface (top of the walnut frame, around the playfield)
    const railInset = 30;  // table internal units — rail thickness in world
    const playCorners = [
      projectWorld(-TABLE_W/2 + railInset, 0, -TABLE_H/2 + railInset),
      projectWorld( TABLE_W/2 - railInset, 0, -TABLE_H/2 + railInset),
      projectWorld( TABLE_W/2 - railInset, 0,  TABLE_H/2 - railInset),
      projectWorld(-TABLE_W/2 + railInset, 0,  TABLE_H/2 - railInset)
    ];

    // Fill the rail ring (outer trapezoid minus inner trapezoid)
    ctx.save();
    const railGrad = ctx.createLinearGradient(corners[0].x, corners[0].y, corners[2].x, corners[2].y);
    railGrad.addColorStop(0, '#2a1408');
    railGrad.addColorStop(0.5, '#4a2410');
    railGrad.addColorStop(1, '#201008');
    ctx.fillStyle = railGrad;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
    ctx.moveTo(playCorners[0].x, playCorners[0].y);
    ctx.lineTo(playCorners[3].x, playCorners[3].y);
    ctx.lineTo(playCorners[2].x, playCorners[2].y);
    ctx.lineTo(playCorners[1].x, playCorners[1].y);
    ctx.closePath();
    ctx.fill('evenodd');

    // Brass trim on inner rail edge
    ctx.strokeStyle = 'rgba(210,170,90,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(playCorners[0].x, playCorners[0].y);
    ctx.lineTo(playCorners[1].x, playCorners[1].y);
    ctx.lineTo(playCorners[2].x, playCorners[2].y);
    ctx.lineTo(playCorners[3].x, playCorners[3].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Felt (playfield) — crimson with lamp glow
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(playCorners[0].x, playCorners[0].y);
    ctx.lineTo(playCorners[1].x, playCorners[1].y);
    ctx.lineTo(playCorners[2].x, playCorners[2].y);
    ctx.lineTo(playCorners[3].x, playCorners[3].y);
    ctx.closePath();
    ctx.clip();

    // Base felt color
    ctx.fillStyle = '#6b1a0c';
    const minX = Math.min(playCorners[0].x, playCorners[3].x);
    const maxX = Math.max(playCorners[1].x, playCorners[2].x);
    const minY = playCorners[0].y;
    const maxY = playCorners[2].y;
    ctx.fillRect(minX - 20, minY - 20, maxX - minX + 40, maxY - minY + 40);

    // Lamp glow overhead (project center + glow radius)
    const center = projectWorld(0, 0, 0);
    const glow = ctx.createRadialGradient(
      center.x, center.y, 20,
      center.x, center.y, Math.max(maxX - minX, maxY - minY) * 0.55
    );
    glow.addColorStop(0,   'rgba(255, 200, 130, 0.35)');
    glow.addColorStop(0.4, 'rgba(200, 120,  60, 0.15)');
    glow.addColorStop(1,   'rgba(20, 8, 4, 0.5)');
    ctx.fillStyle = glow;
    ctx.fillRect(minX - 20, minY - 20, maxX - minX + 40, maxY - minY + 40);
    ctx.restore();
  }

  // Draw pocket wells (black circles) on top of felt. Balls drawn AFTER this so they sit inside.
  function drawPocketsTop() {
    const pocketWorldR = 28;  // table-space radius of the pocket mouth
    for (const p of POCKETS) {
      const world = tableToWorld(p.x, p.y);
      const c = projectWorld(world.x, 0, world.z);
      const rx = pocketWorldR * c.scale;
      const ry = rx * Math.cos(cam.tiltRad);  // foreshortened vertical
      // Brass bezel ring
      ctx.save();
      ctx.fillStyle = '#2a1806';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(210,170,90,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Well (black interior)
      const wellGrad = ctx.createRadialGradient(c.x, c.y - ry * 0.2, 1, c.x, c.y, rx);
      wellGrad.addColorStop(0, '#0a0402');
      wellGrad.addColorStop(1, '#000');
      ctx.fillStyle = wellGrad;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Shadows drawn in a separate pass on the felt, under all balls (so none shadow over another).
  function drawBallShadows() {
    for (const b of state.balls) {
      if (!b.inPlay) continue;
      const world = tableToWorld(b.x, b.y);
      // Offset shadow slightly forward (+z) and in world-down direction
      const sp = projectWorld(world.x + 2, -0.5, world.z + 3);
      const rx = BALL_R_WORLD * sp.scale;
      const ry = rx * Math.cos(cam.tiltRad);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y + 2, rx * 1.1, ry * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // World-space ball radius — we render balls larger than the logical BALL_R so they're visible.
  const BALL_R_WORLD = 18;   // was 10 — scaled up for visibility

  // Sort balls by depth so nearer balls draw over farther ones (correct 3D occlusion).
  function drawBallsSorted() {
    const list = state.balls.filter(b => b.inPlay).map(b => {
      const w = tableToWorld(b.x, b.y);
      return { ball: b, world: w };
    });
    // Depth = camera-space z AFTER tilt. Higher z = farther.
    const c = Math.cos(cam.tiltRad), s = Math.sin(cam.tiltRad);
    for (const item of list) {
      const rz = item.world.y * s + item.world.z * c;
      item.depth = rz + cam.distance;
    }
    list.sort((a, b) => b.depth - a.depth);  // far → near
    for (const item of list) {
      drawBall3D(item.ball, item.world);
    }
  }

  // Draw a single ball as a 3D-shaded sphere.
  function drawBall3D(b, world) {
    const surface = projectWorld(world.x, 0, world.z);            // center of ball on felt
    const top = projectWorld(world.x, BALL_R_WORLD, world.z);     // top of ball
    // Visual radius: average of surface and top screen distance, to approximate sphere.
    const rScreen = Math.max(6, Math.hypot(top.x - surface.x, top.y - surface.y) * 0.85 + BALL_R_WORLD * surface.scale * 0.6);
    // Ball center on screen — midway between surface and top for a believable look
    const cx = (surface.x + top.x) / 2;
    const cy = (surface.y + top.y) / 2;

    const color = BALL_COLORS[b.n];

    ctx.save();
    // Base shaded sphere — radial gradient from upper-left highlight to lower-right shadow
    const base = ctx.createRadialGradient(
      cx - rScreen * 0.35, cy - rScreen * 0.4, rScreen * 0.1,
      cx, cy, rScreen
    );
    base.addColorStop(0,   lighten(color, 0.55));
    base.addColorStop(0.4, color);
    base.addColorStop(1,   darken(color, 0.6));
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.arc(cx, cy, rScreen, 0, Math.PI * 2);
    ctx.fill();

    // Stripe band for 9-15
    if (b.n >= 9 && b.n <= 15) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rScreen, 0, Math.PI * 2);
      ctx.clip();
      const bandGrad = ctx.createRadialGradient(
        cx - rScreen * 0.35, cy - rScreen * 0.4, rScreen * 0.1,
        cx, cy, rScreen
      );
      bandGrad.addColorStop(0, '#ffffff');
      bandGrad.addColorStop(0.6, '#e8dcc3');
      bandGrad.addColorStop(1, '#9e8a62');
      ctx.fillStyle = bandGrad;
      ctx.fillRect(cx - rScreen, cy - rScreen * 0.42, rScreen * 2, rScreen * 0.84);
      ctx.restore();
    }

    // Number badge
    if (b.n !== 0) {
      ctx.fillStyle = '#f8f1dc';
      ctx.beginPath();
      ctx.arc(cx, cy, rScreen * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.font = 'bold ' + Math.floor(rScreen * 0.7) + 'px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.n), cx, cy + 0.5);
    }

    // Specular highlight
    const spec = ctx.createRadialGradient(
      cx - rScreen * 0.4, cy - rScreen * 0.45, 0,
      cx - rScreen * 0.4, cy - rScreen * 0.45, rScreen * 0.55
    );
    spec.addColorStop(0,   'rgba(255,255,255,0.8)');
    spec.addColorStop(0.4, 'rgba(255,255,255,0.2)');
    spec.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(cx, cy, rScreen, 0, Math.PI * 2);
    ctx.fill();

    // Rim darkening
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, rScreen - 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Store for hit testing
    b._screen = { x: cx, y: cy, r: rScreen };
  }

  // ---------- Aim line -----------------------------------------------------
  function drawAimLine() {
    if (state.gamePhase !== 'aiming') return;
    if (state.turn !== 'player') return;
    if (state.ballInHand) return;
    const cue = state.balls[0];
    if (!cue.inPlay) return;

    // Aim direction in table space
    const dx = state.aimX - cue.x;
    const dy = state.aimY - cue.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.1) return;
    const ux = dx / d, uy = dy / d;

    // Extend line from cue ball toward aim point, in table space, projected
    const startWorld = tableToWorld(cue.x + ux * BALL_R, cue.y + uy * BALL_R);
    const endWorld = tableToWorld(cue.x + ux * 600, cue.y + uy * 600);
    const start = projectWorld(startWorld.x, BALL_R_WORLD * 0.3, startWorld.z);
    const end = projectWorld(endWorld.x, BALL_R_WORLD * 0.3, endWorld.z);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cue stick rendered behind cue ball (opposite direction)
    const stickBackWorld = tableToWorld(cue.x - ux * (BALL_R * 2 + state.power * 40 + 20), cue.y - uy * (BALL_R * 2 + state.power * 40 + 20));
    const stickTipWorld = tableToWorld(cue.x - ux * BALL_R, cue.y - uy * BALL_R);
    const stickBack = projectWorld(stickBackWorld.x, BALL_R_WORLD * 0.6, stickBackWorld.z);
    const stickTip = projectWorld(stickTipWorld.x, BALL_R_WORLD * 0.6, stickTipWorld.z);
    const stickFarWorld = tableToWorld(cue.x - ux * (BALL_R * 2 + state.power * 40 + 180), cue.y - uy * (BALL_R * 2 + state.power * 40 + 180));
    const stickFar = projectWorld(stickFarWorld.x, BALL_R_WORLD * 0.6, stickFarWorld.z);
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(stickTip.x, stickTip.y);
    ctx.lineTo(stickFar.x, stickFar.y);
    ctx.stroke();
    // Cue tip
    ctx.strokeStyle = '#c9b98a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(stickTip.x, stickTip.y);
    ctx.lineTo(stickBack.x, stickBack.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawCalledPocketMarker() {
    if (state.calledPocket == null) return;
    const p = POCKETS[state.calledPocket];
    const world = tableToWorld(p.x, p.y);
    const c = projectWorld(world.x, 0, world.z);
    ctx.save();
    ctx.strokeStyle = '#f7c948';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 26 * c.scale, 26 * c.scale * Math.cos(cam.tiltRad), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Top bar (score) + dialogue bubble at top --------------------
  function drawTopBar() {
    const W = canvas.width;
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.85)';
    ctx.fillRect(0, 0, W, 28);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '11px Georgia, serif';
    ctx.textBaseline = 'middle';
    if (state.mode === 'vs' && match) {
      ctx.textAlign = 'left';
      ctx.fillText('Bo' + match.format + '  ·  ' + (state.turn === 'player' ? 'YOUR TURN' : (state.gamePhase === 'simulating' ? 'ALISTAIR SHOOTING…' : 'ALISTAIR THINKING…')), 10, 14);
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.fillStyle = '#f5ecd7';
      ctx.fillText(match.playerFrames + ' — ' + match.alistairFrames, W / 2, 15);
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c9b98a';
      const grp = state.openTable ? 'OPEN' : (state.playerGroup || '').toUpperCase() + ' vs ' + (state.alistairGroup || '').toUpperCase();
      ctx.fillText(grp, W - 10, 14);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e8dcc3';
      ctx.fillText('PRACTICE', W / 2, 14);
    }
    ctx.restore();
  }

  function drawDialogueBubble() {
    if (state.mode !== 'vs') return;
    if (!state.dialogue || state.dialogueTimer <= 0) return;
    const W = canvas.width;
    const boxY = 34;
    const boxH = 44;
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.92)';
    ctx.strokeStyle = 'rgba(210,170,110,0.6)';
    ctx.lineWidth = 1;
    roundRectBilliards(ctx, 8, boxY, W - 16, boxH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ebdab3';
    ctx.font = 'italic bold 10px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ALISTAIR', 18, boxY + 4);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '12px Georgia, serif';
    const lines = wrapTextBilliards(ctx, state.dialogue, W - 36);
    for (let i = 0; i < lines.length && i < 2; i++) {
      ctx.fillText(lines[i], 18, boxY + 18 + i * 14);
    }
    ctx.restore();
    state.dialogueTimer--;
  }

  // ---------- Bottom controls ---------------------------------------------
  // SHOOT button left, power slider vertical right, close button top-right.
  const hudLayout = {};

  function drawControlsBottom() {
    if (state.gamePhase !== 'aiming') return;
    if (state.turn !== 'player' || state.ballInHand) return;
    if (state.showCallPocket) return;
    const W = canvas.width;
    const H = canvas.height;

    // SHOOT button (big, bottom-left)
    const sw = Math.min(180, W * 0.4);
    const sh = 60;
    const sx = 16;
    const sy = H - sh - 20;
    ctx.save();
    ctx.fillStyle = '#7c2a1a';
    roundRectBilliards(ctx, sx, sy, sw, sh, 8);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', sx + sw / 2, sy + sh / 2);
    ctx.restore();
    hudLayout.shootBtn = { x: sx, y: sy, w: sw, h: sh };

    // Power slider (vertical, right edge)
    const pbw = 32;
    const pbh = Math.min(220, H * 0.42);
    const pbx = W - pbw - 16;
    const pby = H - pbh - 20;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRectBilliards(ctx, pbx, pby, pbw, pbh, 6);
    ctx.fill();
    const fillH = pbh * state.power;
    const pg = ctx.createLinearGradient(0, pby + pbh, 0, pby);
    pg.addColorStop(0, '#f7c948');
    pg.addColorStop(1, '#c0392b');
    ctx.fillStyle = pg;
    ctx.fillRect(pbx, pby + pbh - fillH, pbw, fillH);
    ctx.strokeStyle = '#8a6b2e';
    ctx.lineWidth = 1;
    ctx.strokeRect(pbx, pby, pbw, pbh);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('POWER', pbx + pbw / 2, pby - 4);
    ctx.restore();
    hudLayout.powerBar = { x: pbx, y: pby, w: pbw, h: pbh };
  }

  function drawCallPocketPrompt() {
    if (!state.showCallPocket) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f7c948';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAP A POCKET TO CALL YOUR 8-BALL SHOT', W / 2, 60);
    for (let i = 0; i < POCKETS.length; i++) {
      const p = POCKETS[i];
      const world = tableToWorld(p.x, p.y);
      const c = projectWorld(world.x, 0, world.z);
      ctx.strokeStyle = '#f7c948';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 28 * c.scale, 28 * c.scale * Math.cos(cam.tiltRad), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGameOverOverlay() {
    if (state.gamePhase !== 'gameover') return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(10,6,4,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Georgia, serif';
    const title = state.mode === 'vs'
      ? (state.winner === 'player' ? 'YOU WIN THE FRAME' : 'ALISTAIR WINS THE FRAME')
      : 'RACK COMPLETE';
    ctx.fillText(title, W / 2, H / 2 - 30);
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText(state.loseReason || '', W / 2, H / 2);
    ctx.fillStyle = '#f7c948';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('Tap to continue', W / 2, H / 2 + 30);
    ctx.restore();
  }

  // ---------- Helpers ------------------------------------------------------
  function roundRectBilliards(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function wrapTextBilliards(cc, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (cc.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------- Input --------------------------------------------------------
  let dragMode = null;   // 'aim' | 'power' | null
  let lastPointerX = 0, lastPointerY = 0;

  function getEventPoint(e) {
    const rect = canvas.getBoundingClientRect();
    let cx, cy;
    if (e.touches && e.touches.length) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    else if (e.changedTouches && e.changedTouches.length) { cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY; }
    else { cx = e.clientX; cy = e.clientY; }
    return {
      x: (cx - rect.left) * (canvas.width / rect.width),
      y: (cy - rect.top) * (canvas.height / rect.height)
    };
  }

  function hitRect(x, y, r) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

  function onPointerDown(e) {
    if (e.cancelable) e.preventDefault();
    unlockAudio();
    const p = getEventPoint(e);
    lastPointerX = p.x; lastPointerY = p.y;

    // Mode select / format select / interstitial / match end handled by screen dispatch
    if (screenRouter_onDown(p)) return;
    if (!state) return;

    if (state.gamePhase === 'gameover') {
      newGame(state.mode);
      return;
    }

    // Call pocket
    if (state.showCallPocket) {
      const tp = screenToTable(p.x, p.y);
      let nearest = -1, nd = 9999;
      for (let i = 0; i < POCKETS.length; i++) {
        const d = Math.hypot(tp.x - POCKETS[i].x, tp.y - POCKETS[i].y);
        if (d < nd) { nd = d; nearest = i; }
      }
      if (nd < 60) {
        state.calledPocket = nearest;
        state.showCallPocket = false;
        setTimeout(takeShot, 150);
      }
      return;
    }

    if (state.gamePhase !== 'aiming' || state.turn !== 'player') return;

    // Ball-in-hand: tap to place cue ball
    if (state.ballInHand) {
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
        }
      }
      return;
    }

    // SHOOT button
    if (hitRect(p.x, p.y, hudLayout.shootBtn)) {
      takeShot();
      return;
    }

    // Power slider
    if (hitRect(p.x, p.y, hudLayout.powerBar)) {
      dragMode = 'power';
      updatePowerFromY(p.y);
      return;
    }

    // Otherwise: aim — track drag to rotate aim around cue ball
    dragMode = 'aim';
    updateAimFromPointer(p);
  }

  function onPointerMove(e) {
    if (!state || !dragMode) return;
    if (e.cancelable) e.preventDefault();
    const p = getEventPoint(e);
    if (dragMode === 'power') updatePowerFromY(p.y);
    else if (dragMode === 'aim') updateAimFromPointer(p);
  }

  function onPointerUp() { dragMode = null; }

  function updatePowerFromY(y) {
    if (!hudLayout.powerBar) return;
    const pb = hudLayout.powerBar;
    const t = Math.max(0, Math.min(1, (pb.y + pb.h - y) / pb.h));
    state.power = t;
  }

  function updateAimFromPointer(p) {
    // Tap point in table space becomes the aim target; direction = (aim - cue).
    const tp = screenToTable(p.x, p.y);
    if (tp.x < 0 || tp.y < 0) return;
    state.aimX = tp.x;
    state.aimY = tp.y;
  }

  // ---------- Screens (mode, format, interstitial, match end) -------------
  // Simple stacked-button screens. Reuses structure from old code.
  const screenRouter = { mode: null, format: null, interstitial: null, matchEnd: null };
  let screenState = 'modeSelect';   // 'modeSelect' | 'formatSelect' | 'game' | 'interstitial' | 'matchEnd'

  function drawScreens() {
    if (screenState === 'modeSelect') drawModeSelect();
    else if (screenState === 'formatSelect') drawFormatSelect();
    else if (screenState === 'interstitial') drawInterstitial();
    else if (screenState === 'matchEnd') drawMatchEnd();
  }

  function screenBg() {
    const W = canvas.width, H = canvas.height;
    const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    g.addColorStop(0, '#2a1206'); g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function stackButtons(startY, btns) {
    const W = canvas.width, H = canvas.height;
    const cw = Math.min(320, W - 40);
    const cx = W / 2 - cw / 2;
    const bh = 62, gap = 12;
    const total = btns.length * bh + (btns.length - 1) * gap;
    const avail = H - 40 - startY;
    let y = avail > total ? startY + (avail - total) / 2 : startY;
    const rs = {};
    for (const b of btns) {
      ctx.fillStyle = b.primary ? '#4a1808' : '#2a1206';
      roundRectBilliards(ctx, cx, y, cw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = b.primary ? '#d9a679' : '#8a6b2e';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f5ecd7';
      ctx.font = 'bold 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(b.title, W / 2, y + 26);
      if (b.subtitle) {
        ctx.fillStyle = '#c9b98a';
        ctx.font = 'italic 11px Georgia, serif';
        ctx.fillText(b.subtitle, W / 2, y + 45);
      }
      rs[b.key] = { x: cx, y, w: cw, h: bh };
      y += bh + gap;
    }
    return rs;
  }

  function drawModeSelect() {
    screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3'; ctx.textAlign = 'center';
    ctx.font = 'italic bold 22px Georgia, serif';
    const titleY = Math.max(60, H * 0.13);
    ctx.fillText('THE BILLIARD TABLE', W / 2, titleY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('The felt is honest. Most things in this house are not.', W / 2, titleY + 24);
    screenRouter.mode = stackButtons(titleY + 50, [
      { key: 'solo', title: 'SOLO PRACTICE', subtitle: 'Rack. Break. Play at your own pace.', primary: true },
      { key: 'vs',   title: 'CHALLENGE ALISTAIR', subtitle: 'Loser owes a truthful answer.', primary: true },
      { key: 'exit', title: 'LEAVE THE TABLE', subtitle: null, primary: false }
    ]);
  }

  function drawFormatSelect() {
    screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3'; ctx.textAlign = 'center';
    ctx.font = 'italic bold 20px Georgia, serif';
    const titleY = Math.max(60, H * 0.12);
    ctx.fillText('CHOOSE YOUR STAKES', W / 2, titleY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('Alistair will remember what you taught him.', W / 2, titleY + 22);
    screenRouter.format = stackButtons(titleY + 48, [
      { key: 'bo3', title: 'BEST OF 3', subtitle: 'First to 2. Quick.', primary: true },
      { key: 'bo5', title: 'BEST OF 5', subtitle: 'First to 3. The proper match.', primary: true },
      { key: 'bo7', title: 'BEST OF 7', subtitle: 'First to 4. Test of endurance.', primary: true },
      { key: 'back', title: '← BACK', subtitle: null, primary: false }
    ]);
  }

  function drawInterstitial() {
    screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3'; ctx.textAlign = 'center';
    ctx.font = 'italic bold 18px Georgia, serif';
    const titleY = Math.max(50, H * 0.10);
    ctx.fillText('BETWEEN FRAMES', W / 2, titleY);
    ctx.font = 'bold 40px Georgia, serif'; ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerFrames + '  —  ' + match.alistairFrames, W / 2, titleY + 56);
    ctx.font = 'italic 11px Georgia, serif'; ctx.fillStyle = '#c9b98a';
    ctx.fillText('YOU         ALISTAIR', W / 2, titleY + 76);

    const notesTop = titleY + 110;
    ctx.font = 'italic bold 13px Georgia, serif';
    ctx.fillStyle = '#d9a679';
    ctx.fillText("ALISTAIR'S NOTES ON YOU", W / 2, notesTop);
    ctx.font = '12px Georgia, serif'; ctx.fillStyle = '#e8dcc3';
    ctx.textAlign = 'left';
    const notes = match.interstitialNotes || generateNotes();
    match.interstitialNotes = notes;
    let ny = notesTop + 22;
    for (const n of notes.slice(0, 6)) {
      const lines = wrapTextBilliards(ctx, n, W - 40);
      for (const l of lines) { ctx.fillText(l, 20, ny); ny += 16; }
      ny += 4;
    }

    const cw = Math.min(240, W - 40);
    const ch = 48;
    const cxb = W / 2 - cw / 2;
    const cyb = H - 80;
    ctx.fillStyle = '#4a1808';
    roundRectBilliards(ctx, cxb, cyb, cw, ch, 6); ctx.fill();
    ctx.strokeStyle = '#d9a679'; ctx.stroke();
    ctx.fillStyle = '#f5ecd7'; ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('RACK THE NEXT FRAME', W / 2, cyb + ch / 2);
    screenRouter.interstitial = { continue: { x: cxb, y: cyb, w: cw, h: ch } };
  }

  function drawMatchEnd() {
    screenBg();
    const W = canvas.width, H = canvas.height;
    const playerWon = match.playerFrames > match.alistairFrames;
    ctx.fillStyle = playerWon ? '#f7c948' : '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 24px Georgia, serif';
    const titleY = Math.max(60, H * 0.12);
    ctx.fillText(playerWon ? 'YOU WIN THE MATCH' : 'ALISTAIR WINS', W / 2, titleY);
    ctx.font = 'bold 40px Georgia, serif'; ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerFrames + '  —  ' + match.alistairFrames, W / 2, titleY + 56);

    const notes = generateNotes().slice(0, 3);
    let ny = titleY + 110;
    ctx.fillStyle = '#d9a679'; ctx.font = 'italic bold 12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText("ALISTAIR'S READ", 24, ny);
    ny += 22;
    ctx.fillStyle = '#e8dcc3'; ctx.font = 'italic 12px Georgia, serif';
    for (const n of notes) {
      const lines = wrapTextBilliards(ctx, n, W - 48);
      for (const l of lines) { ctx.fillText(l, 24, ny); ny += 16; }
      ny += 4;
    }

    const bw = Math.min(160, (W - 60) / 2), bh = 44, gap = 16;
    const bx0 = W / 2 - (bw * 2 + gap) / 2;
    const by = H - bh - 20;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a1808';
    roundRectBilliards(ctx, bx0, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#d9a679'; ctx.stroke();
    ctx.fillStyle = '#f5ecd7'; ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('REMATCH', bx0 + bw / 2, by + bh / 2);
    const bx1 = bx0 + bw + gap;
    ctx.fillStyle = '#2a1206';
    roundRectBilliards(ctx, bx1, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#8a6b2e'; ctx.stroke();
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('MAIN MENU', bx1 + bw / 2, by + bh / 2);
    screenRouter.matchEnd = {
      rematch: { x: bx0, y: by, w: bw, h: bh },
      menu:    { x: bx1, y: by, w: bw, h: bh }
    };
  }

  // Screen tap router — returns true if the tap was consumed by a screen.
  function screenRouter_onDown(p) {
    if (screenState === 'modeSelect') {
      const r = screenRouter.mode;
      if (!r) return true;
      if (hitRect(p.x, p.y, r.solo)) { screenState = 'game'; newGame('solo'); return true; }
      if (hitRect(p.x, p.y, r.vs))   { screenState = 'formatSelect'; return true; }
      if (hitRect(p.x, p.y, r.exit)) { closeBilliards(); return true; }
      return true;
    }
    if (screenState === 'formatSelect') {
      const r = screenRouter.format;
      if (!r) return true;
      if (hitRect(p.x, p.y, r.bo3)) { newMatch(3); newGame('vs'); screenState = 'game'; return true; }
      if (hitRect(p.x, p.y, r.bo5)) { newMatch(5); newGame('vs'); screenState = 'game'; return true; }
      if (hitRect(p.x, p.y, r.bo7)) { newMatch(7); newGame('vs'); screenState = 'game'; return true; }
      if (hitRect(p.x, p.y, r.back)) { screenState = 'modeSelect'; return true; }
      return true;
    }
    if (screenState === 'interstitial') {
      const r = screenRouter.interstitial;
      if (!r || hitRect(p.x, p.y, r.continue)) {
        startNextFrame();
        screenState = 'game';
        return true;
      }
      return true;
    }
    if (screenState === 'matchEnd') {
      const r = screenRouter.matchEnd;
      if (!r) return true;
      if (hitRect(p.x, p.y, r.rematch)) { newMatch(match.format); newGame('vs'); screenState = 'game'; return true; }
      if (hitRect(p.x, p.y, r.menu))    { match = null; state = null; screenState = 'modeSelect'; return true; }
      return true;
    }
    return false;  // not on a screen — in-game, handle normally
  }

  // Hook endGame state transitions back into screenState
  // (The existing endGame sets state.gamePhase to 'interstitial' or 'matchend')
  function syncScreenFromState() {
    if (!state) return;
    if (state.gamePhase === 'interstitial' && screenState !== 'interstitial') screenState = 'interstitial';
    if (state.gamePhase === 'matchend' && screenState !== 'matchEnd') screenState = 'matchEnd';
  }

  // ---------- Loop ---------------------------------------------------------
  function loop() {
    if (!canvas) return;
    if (screenState === 'modeSelect' || screenState === 'formatSelect') {
      drawScreens();
    } else if (state) {
      syncScreenFromState();
      if (screenState === 'interstitial' || screenState === 'matchEnd') {
        drawScreens();
      } else {
        if (state.gamePhase === 'simulating') step();
        if (state.mode === 'vs' && state.turn === 'alistair' && state.gamePhase === 'aiming' &&
            state._alistairTurnStart && performance.now() - state._alistairTurnStart > 4000) {
          state._alistairTurnStart = 0;
          alistairMove();
        }
        render();
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  // ---------- Open / Close -------------------------------------------------
  let canvas = null, ctx = null, modal = null, rafId = null;

  function openBilliards() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'nocturne-billiards';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(ellipse at center,#1a0e07 0%,#0a0503 50%,#000 100%);overflow:hidden;touch-action:none;display:flex;';

    const close = document.createElement('button');
    close.textContent = '× CLOSE';
    close.style.cssText = 'position:absolute;top:10px;right:10px;background:rgba(40,20,10,0.85);color:#ebdab3;border:1px solid #8a6b2e;padding:6px 12px;font-family:Georgia,serif;font-size:12px;cursor:pointer;z-index:2;border-radius:4px;';
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

    screenState = 'modeSelect';
    state = null;
    match = null;

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
    canvas.width = w; canvas.height = h;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  }

  function closeBilliards() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null; canvas = null; ctx = null; state = null;
    screenState = 'modeSelect';
    dragMode = null;
    window.removeEventListener('resize', fitCanvas);
    window.removeEventListener('orientationchange', fitCanvas);
  }

  window.openBilliards = openBilliards;
  window.closeBilliards = closeBilliards;

})();
