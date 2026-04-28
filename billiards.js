/* ============================================================================
 * NOCTURNE: MIDNIGHT ESTATE — BILLIARDS
 * Standard 8-ball solids/stripes. Solo practice OR vs Alistair.
 * Canvas 2D, mobile-safe, realistic-ish physics.
 * Mount: tap billiard-table object in Billiard Room → openBilliards()
 * ========================================================================= */
(function () {
  'use strict';

  // ---------- Table geometry (internal units, scaled at render) -----------
  const TABLE_W = 800;            // internal width (playfield + rails)
  const TABLE_H = 400;
  const RAIL = 22;                // rail thickness
  const PLAY_X0 = RAIL;
  const PLAY_Y0 = RAIL;
  const PLAY_X1 = TABLE_W - RAIL;
  const PLAY_Y1 = TABLE_H - RAIL;
  const PLAY_W = PLAY_X1 - PLAY_X0;
  const PLAY_H = PLAY_Y1 - PLAY_Y0;

  const BALL_R = 10;
  const POCKET_R = 18;
  const POCKET_CAPTURE_R = 16;    // how close a ball center must be to drop

  const POCKETS = [
    { x: PLAY_X0 + 6,         y: PLAY_Y0 + 6 },         // TL
    { x: TABLE_W / 2,         y: PLAY_Y0 - 2 },         // TM
    { x: PLAY_X1 - 6,         y: PLAY_Y0 + 6 },         // TR
    { x: PLAY_X0 + 6,         y: PLAY_Y1 - 6 },         // BL
    { x: TABLE_W / 2,         y: PLAY_Y1 + 2 },         // BM
    { x: PLAY_X1 - 6,         y: PLAY_Y1 - 6 }          // BR
  ];

  // =========================================================================
  // TRUE PHYSICS ENGINE — derived from real-world billiard physics
  // =========================================================================
  // Unit system: 1 unit = 3.175mm, 60fps
  // Ball radius = 10 units (31.75mm, real = 28.5mm — close enough)
  // Speeds: 4..26 units/frame = 0.76..5.0 m/s (realistic pool range)

  // Cloth friction coefficients (WPA Simonis 860 cloth, tournament grade)
  // Unit calibration: 1 unit = 3.175mm, 1 frame = 1/60s
  // Velocity: 1 unit/frame = 0.1905 m/s
  // Acceleration: 1 unit/frame² = 11.43 m/s²
  // GRAVITY = 9.81 / 11.43 = 0.858 units/frame²
  const GRAVITY   = 0.858;   // g in units/frame² (correctly calibrated)
  const MU_SLIDE  = 0.18;    // kinetic friction (sliding) — standard cloth
  const MU_ROLL   = 0.068;   // rolling friction — gives ~5s stop at 2.9 m/s (realistic)
  const MU_SPIN   = 0.12;    // torsional spin friction

  // Ball-ball collision
  const E_BALL    = 0.96;   // coefficient of restitution (phenolic resin, WPA spec)
  const THROW_MU  = 0.06;   // friction at ball-ball contact causing throw/spin transfer

  // Cushion (rubber rail profile K-66 WPA spec)
  const E_CUSHION = 0.72;   // coefficient of restitution at rail
  const MU_CUSHION = 0.14;  // friction at cushion face (causes spin reversal and throw)
  const CUSHION_HEIGHT_RATIO = 0.635; // ratio of contact height to ball radius (affects spin transfer)

  const BALL_MASS = 1.0;    // normalized — all balls equal mass
  const BALL_I    = 0.4;    // moment of inertia factor (solid sphere = 2/5 * m * r²)
                            // for angular velocity calcs: I = BALL_I * BALL_MASS * BALL_R²

  const MIN_SPEED = 0.03;   // stop threshold (units/frame)
  const MIN_SPIN  = 0.001;  // spin stop threshold (rad/frame)
  const SUBSTEPS  = 4;      // sub-steps per frame (4 prevents tunneling up to break speed)

  // ---------- Ball data ----------------------------------------------------
  // 0 = cue. 1-7 solids, 8 = eight ball, 9-15 stripes.
  // ============================================================
  // SNOOKER — Victorian-era billiards (invented 1875)
  // ============================================================
  // Ball numbering:
  //   0  = cue ball (white)
  //   1-15 = reds (all worth 1 point)
  //   16 = yellow (2pts), 17 = green (3pts), 18 = brown (4pts)
  //   19 = blue (5pts), 20 = pink (6pts), 21 = black (7pts)
  // Total maximum break: 147 (15×8 + 2+3+4+5+6+7 = 120+27 = 147)

  const SNOOKER_RED_IDS   = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  const SNOOKER_COLOUR_IDS = [16,17,18,19,20,21];  // in ascending point order
  const SNOOKER_POINTS = {
    0:0, 1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1,11:1,12:1,13:1,14:1,15:1,
    16:2, 17:3, 18:4, 19:5, 20:6, 21:7
  };
  const SNOOKER_COLOUR_NAMES = { 16:'Yellow', 17:'Green', 18:'Brown', 19:'Blue', 20:'Pink', 21:'Black' };

  // Spot positions for the 6 colours (in table coordinates, portrait: tx = vertical)
  // Standard snooker table: black near top rail (far), then pink, blue (mid), brown/green/yellow near bottom rail (near)
  // In our portrait layout: tx small = far end (top screen), tx large = near end (near player)
  const COLOUR_SPOTS = {
    16: { x: PLAY_X0 + PLAY_W * 0.88, y: TABLE_H / 2 + 60 },   // yellow (near, right)
    17: { x: PLAY_X0 + PLAY_W * 0.88, y: TABLE_H / 2 - 60 },   // green (near, left)
    18: { x: PLAY_X0 + PLAY_W * 0.88, y: TABLE_H / 2 },         // brown (near, centre)
    19: { x: PLAY_X0 + PLAY_W * 0.50, y: TABLE_H / 2 },         // blue (mid)
    20: { x: PLAY_X0 + PLAY_W * 0.32, y: TABLE_H / 2 },         // pink (near apex)
    21: { x: PLAY_X0 + PLAY_W * 0.16, y: TABLE_H / 2 }          // black (far end)
  };

  const BALL_COLORS = {
    0:  '#f5f0e8',  // cue: white
    1:  '#c0392b', 2:  '#c0392b', 3:  '#c0392b', 4:  '#c0392b', 5:  '#c0392b',
    6:  '#c0392b', 7:  '#c0392b', 8:  '#c0392b', 9:  '#c0392b', 10: '#c0392b',
    11: '#c0392b', 12: '#c0392b', 13: '#c0392b', 14: '#c0392b', 15: '#c0392b',
    16: '#f0d020',  // yellow
    17: '#1a6b2e',  // green
    18: '#7b3a10',  // brown
    19: '#1a4fa0',  // blue
    20: '#d4548a',  // pink
    21: '#111111'   // black
  };

  function ballType(n) {
    if (n === 0) return 'cue';
    if (n >= 1 && n <= 15) return 'red';
    return 'colour';
  }

  // ---------- Dialogue: Alistair, 100+ unique lines -----------------------
  // Categories trigger based on game state. Each category has many lines.
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
    playerBreak: [
      "Break it. Let's see what you do with chaos.",
      "Hit it like you mean it, Grey.",
      "The break tells you everything. Go on.",
      "Don't think. Not yet.",
      "Firm strike. Centre ball. Unless you'd prefer theatrics."
    ],
    alistairBreak: [
      "Watch the shoulder. That's where power actually comes from.",
      "This one's for the room, not for you.",
      "I've broken this rack a thousand times. It never gets old.",
      "Pay attention. You might learn something."
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
    safety: [
      "A safety. Interesting choice.",
      "You're playing defence. I respect it. Briefly.",
      "Hiding behind my ball. Bold.",
      "Safeties are confessions. What are you afraid of?"
    ],
    contemplative: [
      "This table's seen things.",
      "I learned pool from a man who lost at it. He was better at that than winning.",
      "A good cue is like a good question. Neither one jabs.",
      "Ashworth never played. Said it was undignified. He was wrong about a lot of things.",
      "The trick is to see the next shot before you take this one.",
      "Patience, Grey. The table rewards it. So does this house."
    ],
    trashTalk: [
      "Are you going to shoot, or are you courting it?",
      "The ball won't move if you think at it.",
      "Take the shot. Or concede. Either would speed things along.",
      "If you stand there any longer I'll pour another drink.",
      "The cloth is bleeding from boredom."
    ],
    turnPromptPlayer: [
      "Your shot.",
      "Go on, then.",
      "The table is yours.",
      "Take it.",
      "Whenever you're ready."
    ],
    illegalBreak: [
      "That break doesn't count. Four balls to a cushion, minimum.",
      "Illegal break. The rack is yours to break again.",
      "No. Four balls must reach a rail. Try again."
    ],
    threeFoulLoss: [
      "Three fouls, Grey. The frame is mine by rule.",
      "Three consecutive fouls. You've lost the frame. WPA rule.",
      "Three in a row. The table concedes on your behalf."
    ],
    twoFoulWarning: [
      "Two fouls in a row. One more and the frame is mine.",
      "That's two consecutive fouls. The next one ends it.",
      "Two. I'm counting. You should be too."
    ],
    safetyDeclared: [
      "A safety. Honest of you to say so.",
      "Playing safe. Noted.",
      "A tactical retreat. I can respect that.",
      "Safety play. Let's see where you leave me."
    ],
    safetyUndeclared: [
      "You didn't declare that a safety. Foul.",
      "That looked like a safety to me. It needed to be declared.",
      "Playing safe without declaring it — that's a foul."
    ],
    shotClockFoul: [
      "The clock ran out, Grey. Ball in hand for me.",
      "Forty-five seconds is generous. My ball.",
      "Time's up. I'll take it from here.",
      "The clock has spoken. Ball in hand."
    ],
    bank: [
      "One cushion. Let's see if the rail cooperates.",
      "A bank. Riskier, but the angle is there.",
      "Off the rail. Old trick.",
      "I'll take the long way around."
    ],
    lagWon: [
      "Your lag. The break is yours.",
      "Closer to the rail. You break.",
      "The lag goes to you. Make it count."
    ],
    lagLost: [
      "My lag. I'll break.",
      "Closer. The break is mine.",
      "I'll take the break. Thank you for the courtesy."
    ]
  };

  function pickLine(cat) {
    const arr = DIALOGUE[cat];
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- Game state ---------------------------------------------------
  let state = null;
  let scaleFactor = 1;
  let shotStartTime = 0;
  // canvas, ctx, modal, rafId declared in v3 rendering section

  function newGame(mode) {
    state = {
      mode: mode,
      balls: makeRack(),
      // Shot input
      aimX: PLAY_X0 + PLAY_W * 0.28,
      aimY: TABLE_H / 2,
      power: 0.5,
      pullBack: 0,
      spinX: 0, spinY: 0,
      // Turn
      turn: 'player',
      gamePhase: 'aiming',
      // Snooker scoring
      scores: { player: 0, alistair: 0 },
      // Snooker sequence state
      redsLeft: 15,             // reds remaining on table
      coloursPhase: false,      // true when reds are all cleared, potting colours in order
      nextColour: 16,           // during colours phase: next colour to pot (16-21)
      ballOn: 'red',            // 'red' | colour id (16-21) — what must be potted next
      // Foul tracking
      consecutiveFouls: { player: 0, alistair: 0 },
      foulValue: 0,             // pending foul points this shot
      intentionalSafety: false,
      // Shot tracking
      firstContact: null,
      pocketedThisShot: [],
      _cueTouchedCushion: 0,
      _ballsToCushion: 0,
      _isBreakShot: false,
      shotClockStart: null,
      shotClockLimit: 45000,
      shotClockExpired: false,
      // Ball in hand
      ballInHand: false,
      // Game over
      winner: null,
      loseReason: null,
      // AI
      playerStats: { shotsTaken:0, shotsMissed:0, ballsSunk:0, scratches:0, skill:0.5 },
      // Dialogue
      dialogue: '',
      dialogueTimer: 0,
      // UI
      calledPocket: null,
      showCallPocket: false,
      showHelp: false
    };

    state.shotClockStart = performance.now();
    setTimeout(() => say(mode === 'vs' ? 'preMatch' : null), 100);
  }

  function _makeBall(id, n, x, y) {
    return { id, n, x, y, vx:0, vy:0, wx:0, wy:0, spinX:0, spinY:0, inPlay:true, pocketed:false, _spotted:false };
  }

  function makeRack() {
    const balls = [];
    // Cue ball — placed at baulk (near end, player side)
    balls.push(_makeBall(0, 0, PLAY_X0 + PLAY_W * 0.82, TABLE_H / 2));

    // 15 reds in a triangle — apex near the pink spot, triangle pointing toward the black
    // In portrait: reds cluster near top (far end, small tx)
    const apexX = PLAY_X0 + PLAY_W * 0.28;
    const apexY = TABLE_H / 2;
    const sp = BALL_R * 2 + 2.0;  // spacing: small gap prevents overlap cascade on break
    // Triangle rows (portrait: rows go along tx axis = vertically toward far end)
    // Row 0 (apex): 1 ball, Row 1: 2 balls, ..., Row 4: 5 balls
    let id = 1;
    for (let row = 0; row < 5; row++) {
      const count = row + 1;
      const rowX = apexX - row * sp * 0.866;  // move toward far end (smaller tx)
      const rowY0 = apexY - (count - 1) * sp / 2;
      for (let i = 0; i < count; i++) {
        balls.push(_makeBall(id, id, rowX, rowY0 + i * sp));
        id++;
      }
    }

    // 6 colours on their spots
    for (const [n, spot] of Object.entries(COLOUR_SPOTS)) {
      balls.push(_makeBall(balls.length, parseInt(n), spot.x, spot.y));
    }

    return balls;
  }

  // Spot a colour back to its designated position after being legally pocketed
  function spotColour(n) {
    const b = state.balls.find(b => b.n === n);
    if (!b) return;
    const spot = COLOUR_SPOTS[n];
    if (!spot) return;
    // If spot is occupied, find nearest free spot on the long axis toward black
    let sx = spot.x, sy = spot.y;
    const occupied = state.balls.some(ob => ob.inPlay && ob !== b && Math.hypot(ob.x - sx, ob.y - sy) < BALL_R * 2 + 1);
    if (occupied) {
      // Move toward black (lower tx) until free
      sx = spot.x - BALL_R * 2.2;
      while (state.balls.some(ob => ob.inPlay && ob !== b && Math.hypot(ob.x - sx, ob.y - sy) < BALL_R * 2 + 1) && sx > PLAY_X0 + BALL_R) {
        sx -= BALL_R * 2.2;
      }
    }
    b.x = sx; b.y = sy;
    b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0; b.spinX = 0; b.spinY = 0;
    b.inPlay = true; b.pocketed = false;
  }

  // ---------- Shot / physics ----------------------------------------------
  function takeShot() {
    if (state.gamePhase !== 'aiming') return;
    const cue = state.balls[0];
    if (!cue.inPlay) return;
    state._cueTouchedCushion = 0;
    state._ballsToCushion = 0;
    state.shotClockExpired = false;
    // Sound: cue strike (break vs normal shot)
    const isBreak = state.balls.filter(b => b.inPlay && b.n !== 0).length === 15;
    if (isBreak) {
      state._isBreakShot = true;
      sndBreak(state.power);
    } else {
      state._isBreakShot = false;
      sndCueStrike(state.power);
    }

    const dx = state.aimX - cue.x;
    const dy = state.aimY - cue.y;
    const d = Math.hypot(dx, dy) || 1;
    const power = state.power;
    const speed = 4 + power * 26;      // base speed (units/frame) — higher for better break spread
    const ux = dx / d, uy = dy / d;    // unit vector in shot direction
    cue.vx = ux * speed;
    cue.vy = uy * speed;

    // True initial spin from player input (state.spinX, state.spinY = -1..1):
    // spinY (-1=back, +1=top): sets in-plane angular velocity wx/wy
    // spinX (-1=left, +1=right): sets torsional spin (sidespin, causes masse curve)
    //
    // Maximum spin = BALL_I * max angular rate. For phenolic resin balls,
    // a skilled player can impart about 1/3 of translational speed as spin speed.
    // wx, wy are in-plane angular velocities (rad/frame).
    // Rolling wy = -vx/BALL_R, wx = vy/BALL_R (rolling condition).
    // Back spin: wy = +vx/BALL_R * spinFrac (opposite to rolling), wx similarly.
    const MAX_SPIN_FRAC = 0.45;  // max spin as fraction of rolling speed
    const spinFrac = state.spinY * MAX_SPIN_FRAC;  // -0.45 (back) to +0.45 (top)
    // Rolling wy = -vx/R, wx = vy/R. Add spin offset:
    //   full back spin: wy = +vx/R (opposite rolling), +spinFrac flips it
    //   full top spin:  wy = -vx/R * (1 + extra)
    cue.wx = (uy * speed / BALL_R) + state.spinY * (speed / BALL_R) * MAX_SPIN_FRAC * uy;
    cue.wy = (-ux * speed / BALL_R) + state.spinY * (speed / BALL_R) * MAX_SPIN_FRAC * (-ux);
    // Side spin (torsional) — causes masse curve mid-roll and throw at contact
    cue.spinX = state.spinX * 8;  // torsional angular velocity (rad/frame)
    cue.spinY = 0;  // spinY input now handled via wx/wy above

    state.firstContact = null;
    state.pocketedThisShot = [];
    state.gamePhase = 'simulating';
    shotStartTime = performance.now();
    state.playerStats.shotsTaken += state.turn === 'player' ? 1 : 0;
  }

  function step() {
    // Run SUBSTEPS sub-steps per frame to prevent tunneling at high speeds.
    for (let sub = 0; sub < SUBSTEPS; sub++) {
      _physicsSubstep();
    }

    // Pocket capture with jaw geometry (once per frame after all sub-steps)
    const balls = state.balls;
    for (const b of balls) {
      if (!b.inPlay || b._pocketing) continue;
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const p = POCKETS[pi];
        const dist = Math.hypot(b.x - p.x, b.y - p.y);
        if (dist < POCKET_CAPTURE_R) {
          // Clean drop — ball fully inside pocket mouth
          b.inPlay = false;
          b.pocketed = true;
          b.vx = 0; b.vy = 0;
          b.pocketedAt = p;
          state.pocketedThisShot.push(b);
          if (b.n === 0) sndScratch(); else sndPocket();
          break;
        } else if (dist < POCKET_CAPTURE_R + BALL_R * 1.4) {
          // Jaw zone — ball is near the pocket edge.
          // Determine if ball has enough angle/speed to rattle in or bounce out.
          const jawResult = _pocketJaw(b, p, pi);
          if (jawResult === 'in') {
            b.inPlay = false;
            b.pocketed = true;
            b.vx = 0; b.vy = 0;
            b.pocketedAt = p;
            state.pocketedThisShot.push(b);
            if (b.n === 0) sndScratch(); else sndPocket();
            break;
          } else if (jawResult === 'rattle') {
            // Ball deflects off the jaw lip — play a hard cushion sound
            sndCushion(Math.hypot(b.vx, b.vy) * 1.5);
          }
          // 'miss' — no action, ball continues rolling past
        }
      }
    }

    // Stop condition
    let allStopped = true;
    let _totalSpeed = 0;
    for (const b of balls) {
      if (!b.inPlay) continue;
      const _sp = Math.hypot(b.vx, b.vy);
      _totalSpeed += _sp;
      if (_sp > MIN_SPEED) allStopped = false;
    }
    if (_totalSpeed > 0.5) sndCloth(_totalSpeed);

    const elapsed = performance.now() - shotStartTime;
    if (elapsed > 14000) allStopped = true;
    if (allStopped) resolveShot();
  }

  // Pocket jaw geometry helper.
  // Returns 'in' (ball drops), 'rattle' (deflects off jaw), or 'miss' (rolls past).
  // Corner pockets have two jaw lips at 90°. Side pockets have two lips at 180° (straight wall).
  function _pocketJaw(b, pocket, pocketIdx) {
    const dx = b.x - pocket.x;
    const dy = b.y - pocket.y;
    const dist = Math.hypot(dx, dy);
    const speed = Math.hypot(b.vx, b.vy);
    // Direction ball is travelling relative to pocket center
    const vToCenter = (b.vx * (-dx) + b.vy * (-dy)) / (dist * speed + 0.0001);
    // If ball is moving generally toward center, it tends to drop
    if (vToCenter > 0.55) return 'in';
    // Corner pockets (indices 0,1,2,3 — TL,TR,BL,BR) have tighter jaws
    const isCorner = (pocketIdx !== 1 && pocketIdx !== 4);  // TM and BM are side pockets
    const jawTolerance = isCorner ? 0.3 : 0.5;  // corner pockets rattle more
    if (vToCenter > jawTolerance) {
      // Borderline — check speed. Fast balls rattle more, slow ones trickle in.
      if (speed > 6) {
        // High speed near miss — deflect off the jaw
        // Reflect velocity off the jaw face (approximate: normal = from pocket center to ball)
        const nx = dx / dist;
        const ny = dy / dist;
        const vn = b.vx * nx + b.vy * ny;
        b.vx -= 1.6 * vn * nx;
        b.vy -= 1.6 * vn * ny;
        b.vx *= 0.65;
        b.vy *= 0.65;
        return 'rattle';
      }
      return 'in';  // slow ball trickles in despite marginal angle
    }
    return 'miss';
  }

  // =========================================================================
  // TRUE PHYSICS ENGINE — _physicsSubstep()
  //
  // Based on real billiard dynamics:
  //   Coriolis & Alcock (1835), Marlow (1994), Leckie & Pickering (1987)
  //   WPA Official Equipment Specifications (K-66 cushion profile)
  //
  // Each ball has:
  //   vx, vy          — linear velocity (units/frame)
  //   spinX, spinY    — angular velocity components (rad/frame)
  //                     spinX = sidespin (topspin/backspin around Y axis)
  //                     spinY = topspin/backspin (around X axis, affects Y velocity)
  //   wx, wy          — angular velocity projected to table plane (for rolling calc)
  //                     rolling condition: vx = -wy * BALL_R, vy = wx * BALL_R
  // =========================================================================
  function _physicsSubstep() {
    const balls = state.balls;
    const dt = 1 / SUBSTEPS;

    for (const b of balls) {
      if (!b.inPlay) continue;

      // ---- Ball motion state ----
      // Slip velocity at contact patch with cloth:
      // v_slip_x = vx - (-b.wy * BALL_R) = vx + b.wy * BALL_R
      // v_slip_y = vy - (b.wx * BALL_R)  = vy - b.wx * BALL_R
      // Rolling condition: slip_x = 0, slip_y = 0

      const slipX = b.vx + (b.wy || 0) * BALL_R;
      const slipY = b.vy - (b.wx || 0) * BALL_R;
      const slipSpd = Math.hypot(slipX, slipY);
      const isSliding = slipSpd > MIN_SPEED * 2;

      if (isSliding) {
        // SLIDING PHASE: kinetic friction decelerates both linear and angular velocity.
        // Friction force direction: opposite to slip velocity.
        const slipUx = slipX / slipSpd;
        const slipUy = slipY / slipSpd;
        const fricForce = MU_SLIDE * GRAVITY;  // units/frame²

        // Linear deceleration from cloth friction
        b.vx -= fricForce * slipUx * dt;
        b.vy -= fricForce * slipUy * dt;

        // Angular acceleration from cloth friction torque
        // Torque = friction_force × contact_point_radius (= BALL_R)
        // ΔΩ = Torque / I = (F × R) / (BALL_I × m × R²) = F / (BALL_I × m × R)
        const angAcc = fricForce / (BALL_I * BALL_MASS * BALL_R);
        b.wx = (b.wx || 0) + slipUy * angAcc * dt;   // wx driven by Y-slip
        b.wy = (b.wy || 0) - slipUx * angAcc * dt;   // wy driven by X-slip

      } else {
        // ROLLING PHASE: only rolling friction (much lower).
        // Rolling friction decelerates both linear and angular velocity together.
        const spd = Math.hypot(b.vx, b.vy);
        if (spd > MIN_SPEED) {
          const rollFric = MU_ROLL * GRAVITY;
          const ux = b.vx / spd, uy = b.vy / spd;
          b.vx -= rollFric * ux * dt;
          b.vy -= rollFric * uy * dt;
          // Keep angular velocity consistent with rolling
          b.wx = b.vy / BALL_R;
          b.wy = -b.vx / BALL_R;
        } else {
          b.vx = 0; b.vy = 0;
          b.wx = 0; b.wy = 0;
        }
      }

      // ---- Torsional spin (spin around vertical axis = sidespin for curve) ----
      // spinX is our "sidespin" — decays from cloth torsional drag.
      // It creates lateral force via interaction with the cloth surface normal.
      if (Math.abs(b.spinX) > MIN_SPIN) {
        const spd = Math.hypot(b.vx, b.vy);
        if (spd > MIN_SPEED && b.n === 0) {
          // Masse effect: sidespin creates curvature
          // Lateral force ∝ spinX × |v| × MU_SPIN
          const vux = b.vx / spd, vuy = b.vy / spd;
          // Perpendicular to velocity direction: (-vuy, vux)
          const curvAcc = b.spinX * MU_SPIN * GRAVITY;
          b.vx += (-vuy) * curvAcc * dt;
          b.vy += (vux) * curvAcc * dt;
        }
        // Torsional friction decays sidespin
        const torsDecay = MU_SPIN * GRAVITY / (BALL_I * BALL_MASS * BALL_R);
        const dSpin = torsDecay * dt;
        if (Math.abs(b.spinX) > dSpin) b.spinX -= Math.sign(b.spinX) * dSpin;
        else b.spinX = 0;
      }

      // Integrate position
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Hard stop
      if (Math.hypot(b.vx, b.vy) < MIN_SPEED) { b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0; }
    }

    // ---- Cushion collisions ----
    for (const b of balls) {
      if (!b.inPlay) continue;

      // For each rail, compute the full cushion response:
      // Normal component: reversed with E_CUSHION restitution
      // Tangential component: modified by MU_CUSHION (friction at cushion face)
      // Spin: modified by contact geometry (K-66 profile contact height)
      // Contact height h = CUSHION_HEIGHT_RATIO × BALL_R above table surface
      // This means the impulse has a moment arm that affects spin.

      function _cushionBounce(b, isXWall, wallCoord, inward) {
        // inward: +1 means wall is on the negative side (push positive), -1 means positive side
        const vn = isXWall ? b.vx : b.vy;    // normal velocity component
        const vt = isXWall ? b.vy : b.vx;    // tangential velocity component
        const spdN = Math.abs(vn);
        if (spdN < MIN_SPEED) return;

        // Normal impulse
        const Jn = -(1 + E_CUSHION) * vn;    // impulse magnitude (per unit mass)

        // Friction at cushion face:
        // Slip speed at cushion contact = vt + spin contribution
        // Spin contribution at contact height h: ω_spin × h
        const h = CUSHION_HEIGHT_RATIO * BALL_R;
        const spinAtContact = isXWall ? (b.wx || 0) * h : (b.wy || 0) * h;
        const slipT = vt + spinAtContact;
        const maxFricImpulse = MU_CUSHION * Math.abs(Jn);
        const fricImpulse = Math.max(-maxFricImpulse, Math.min(maxFricImpulse, -slipT));

        // Apply to velocity
        if (isXWall) {
          b.vx += Jn;
          b.vy += fricImpulse;
          // Spin update from normal impulse (contact point above table):
          // ΔΩx = (Jn × h) / I_ball  (vertical axis spin from horizontal impulse)
          const dWx = (fricImpulse * h) / (BALL_I * BALL_MASS * BALL_R * BALL_R);
          b.wx = (b.wx || 0) + dWx;
          // Sidespin from tangential cushion friction
          b.spinX = (b.spinX || 0) - fricImpulse / (BALL_I * BALL_MASS * BALL_R) * 0.6;
        } else {
          b.vy += Jn;
          b.vx += fricImpulse;
          const dWy = (fricImpulse * h) / (BALL_I * BALL_MASS * BALL_R * BALL_R);
          b.wy = (b.wy || 0) + dWy;
          b.spinX = (b.spinX || 0) - fricImpulse / (BALL_I * BALL_MASS * BALL_R) * 0.6;
        }

        // Speed-dependent angle correction (rubber squish at high impact speed)
        const squish = Math.min(0.10, (spdN - 8) * 0.012);
        if (squish > 0) {
          if (isXWall) b.vy *= (1 - squish);
          else b.vx *= (1 - squish);
        }

        sndCushion(spdN);
        if (b.n === 0) state._cueTouchedCushion = (state._cueTouchedCushion || 0) + 1;
      }

      if (b.x < PLAY_X0 + BALL_R) { b.x = PLAY_X0 + BALL_R; _cushionBounce(b, true, PLAY_X0, 1); }
      if (b.x > PLAY_X1 - BALL_R) { b.x = PLAY_X1 - BALL_R; _cushionBounce(b, true, PLAY_X1, -1); }
      if (b.y < PLAY_Y0 + BALL_R) { b.y = PLAY_Y0 + BALL_R; _cushionBounce(b, false, PLAY_Y0, 1); }
      if (b.y > PLAY_Y1 - BALL_R) { b.y = PLAY_Y1 - BALL_R; _cushionBounce(b, false, PLAY_Y1, -1); }
    }

    // ---- Ball-ball collisions ----
    // Full impulse-based model with friction at contact point.
    // Handles throw, spin transfer, stun shots, and correct cut-angle deflection.
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (!a.inPlay) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (!b.inPlay) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minD = BALL_R * 2;
        if (distSq >= minD * minD || distSq === 0) continue;

        const dist = Math.sqrt(distSq);

        // Record first contact for foul checking
        if (a.n === 0 && state.firstContact === null) state.firstContact = b.n;
        if (b.n === 0 && state.firstContact === null) state.firstContact = a.n;

        // Collision normal (from a → b)
        const nx = dx / dist;
        const ny = dy / dist;
        // Tangent (perpendicular, left of normal)
        const tx = -ny;
        const ty = nx;

        // Positional correction — push apart to eliminate overlap
        const overlap = (minD - dist) * 0.5;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // Relative velocity at contact point
        // Contact point is at BALL_R from each center, on the collision normal
        // Angular velocity contributes: v_contact = v_cm + ω × r_contact
        // For 2D: ω × r = (ω_z) × (r_x, r_y) = ω_z × r × (tangent)
        // We use wx, wy for in-plane angular velocity, spinX for topspin/side
        const avx = a.vx - (a.wy || 0) * BALL_R * ny;
        const avy = a.vy + (a.wx || 0) * BALL_R * nx;  // wrong sign — fix below
        const bvx = b.vx - (b.wy || 0) * BALL_R * ny;
        const bvy = b.vy + (b.wx || 0) * BALL_R * nx;

        // Relative velocity at contact
        const rvx = avx - bvx;
        const rvy = avy - bvy;

        // Normal component of relative velocity
        const rvn = rvx * nx + rvy * ny;
        if (rvn > 0) continue;  // already separating

        // ---- Normal impulse (elastic collision with restitution) ----
        // Jn = -(1 + e) * rvn / (1/ma + 1/mb) = -(1 + e) * rvn / 2 (equal mass)
        const Jn = -(1 + E_BALL) * rvn / 2;

        // ---- Tangential impulse (friction — causes throw and spin transfer) ----
        const rvt = rvx * tx + rvy * ty;  // tangential relative velocity
        // Maximum friction impulse (Coulomb friction)
        const maxJt = THROW_MU * Math.abs(Jn);
        const Jt = Math.max(-maxJt, Math.min(maxJt, -rvt / 2));

        // Apply normal impulse to linear velocities
        a.vx += (Jn * nx + Jt * tx);
        a.vy += (Jn * ny + Jt * ty);
        b.vx -= (Jn * nx + Jt * tx);
        b.vy -= (Jn * ny + Jt * ty);

        // ---- Spin transfer from tangential impulse ----
        // Torque = Jt × BALL_R, ΔΩ = Torque / I
        const dOmega = Jt * BALL_R / (BALL_I * BALL_MASS * BALL_R * BALL_R);
        // For ball a: torque around the contact normal creates spin
        a.wx = (a.wx || 0) + dOmega * ny;
        a.wy = (a.wy || 0) - dOmega * nx;
        b.wx = (b.wx || 0) - dOmega * ny;
        b.wy = (b.wy || 0) + dOmega * nx;

        // ---- Cue ball spin interaction (English effects) ----
        if (a.n === 0 || b.n === 0) {
          const cue = a.n === 0 ? a : b;
          const obj = a.n === 0 ? b : a;
          const sign = a.n === 0 ? 1 : -1;

          // STUN SHOT: if cue ball has zero spin at contact, it stops dead
          // (or nearly so). Slip velocity at contact = 0 → no spin transfer → stun.
          const cueSlipX = cue.vx + (cue.wy || 0) * BALL_R;
          const cueSlipY = cue.vy - (cue.wx || 0) * BALL_R;
          const cueSlipSpd = Math.hypot(cueSlipX, cueSlipY);

          if (cueSlipSpd < 0.8) {
            // Near-stun condition: cue ball stops near contact point
            // The normal impulse handles velocity transfer correctly.
            // Just zero out any residual tangential velocity of cue ball after collision.
            const cueVt = cue.vx * tx + cue.vy * ty;
            cue.vx -= cueVt * tx * 0.92;
            cue.vy -= cueVt * ty * 0.92;
          }

          // THROW: sidespin on cue ball deflects object ball slightly
          // (already partially captured in Jt, but spinX adds extra)
          const throwExtra = (cue.spinX || 0) * THROW_MU * 0.5;
          obj.vx += throwExtra * tx * sign;
          obj.vy += throwExtra * ty * sign;
          cue.spinX = (cue.spinX || 0) * 0.25;  // spin partially transferred to throw

          // FOLLOW / DRAW: cue ball topspin/backspin (wx/wy) carries through
          // after collision and continues affecting cue ball path.
          // This is captured naturally by the rolling physics above — no extra code needed.
        }

        sndBallCollide(Math.abs(Jn) * 6);
      }
    }
  }


  function resolveShot() {
    // Drill mode — physics only, no rules
    if (state.mode === 'drill') {
      state.gamePhase = 'aiming';
      state.firstContact = null;
      return;
    }

    const pocketed = state.pocketedThisShot;
    const shooter = state.turn;
    const cueScratched = pocketed.some(b => b.n === 0);

    // ============================================================
    // SNOOKER RULES ENGINE
    // ============================================================

    // Shot clock expiry
    if (state.shotClockExpired && shooter === 'player') {
      say('shotClockFoul');
      _awardFoul(shooter, 4);
      state.turn = other(shooter);
      state.ballInHand = true;
      state.gamePhase = 'aiming';
      state.shotClockStart = performance.now();
      state.shotClockExpired = false;
      updateAISkill();
      setTimeout(alistairMove, 900 + Math.random() * 800);
      return;
    }

    // What was the ball-on this shot?
    const ballOn = state.ballOn;
    const redsPotted    = pocketed.filter(b => b.n >= 1 && b.n <= 15);
    const coloursPotted = pocketed.filter(b => b.n >= 16 && b.n <= 21);
    const anyPotted     = pocketed.filter(b => b.n !== 0);

    // Determine if shot was legal
    let foul = false;
    let foulValue = 4;  // minimum foul value in snooker

    // No contact at all
    if (state.firstContact === null) { foul = true; foulValue = Math.max(foulValue, 4); }

    // Cue ball scratched
    if (cueScratched) { foul = true; foulValue = Math.max(foulValue, SNOOKER_POINTS[ballOn === 'red' ? 1 : ballOn] || 4); }

    // Wrong first contact
    if (!foul && state.firstContact !== null) {
      if (ballOn === 'red') {
        // Must hit a red first
        if (state.firstContact < 1 || state.firstContact > 15) {
          foul = true;
          foulValue = Math.max(foulValue, SNOOKER_POINTS[state.firstContact] || 4);
        }
      } else {
        // Must hit the specific colour (or any colour if none specified and no reds left)
        if (state.firstContact !== ballOn) {
          foul = true;
          foulValue = Math.max(foulValue, SNOOKER_POINTS[ballOn] || 4, SNOOKER_POINTS[state.firstContact] || 4);
        }
      }
    }

    // No ball reached cushion after last contact (snooker foul — must send something to rail or pot)
    if (!foul && anyPotted.length === 0 && state._cueTouchedCushion === 0) {
      foul = true;
    }

    // Handle foul
    if (foul) {
      _awardFoul(shooter, foulValue);
      // Cue ball replaced if scratched
      if (cueScratched) _replaceCueBall();
      // Any incorrectly pocketed balls get spotted back
      for (const b of anyPotted) {
        if (b.n >= 16 && b.n <= 21) spotColour(b.n);
        else if (b.n >= 1 && b.n <= 15) _spotRed(b);
      }
      // Three consecutive fouls
      state.consecutiveFouls[shooter] = (state.consecutiveFouls[shooter] || 0) + 1;
      state.consecutiveFouls[other(shooter)] = 0;
      if (state.consecutiveFouls[shooter] >= 3 && state.mode === 'vs') {
        say('threeFoulLoss');
        endGame(other(shooter), 'Three consecutive fouls');
        return;
      }
      if (state.consecutiveFouls[shooter] === 2 && state.mode === 'vs' && shooter === 'player') {
        say('twoFoulWarning');
      }
      if (state.mode === 'vs') say('scratchPlayer');
      _nextTurn(other(shooter), true);
      return;
    }

    // Legal shot
    state.consecutiveFouls[shooter] = 0;

    // Score any legally potted balls
    let scored = 0;
    let continueTurn = false;

    if (!state.coloursPhase) {
      // ---- REDS PHASE ----
      if (ballOn === 'red') {
        // Potted reds: score each
        for (const r of redsPotted) {
          state.scores[shooter] += 1;
          scored++;
          state.redsLeft--;
        }
        // Also score any colours potted WITH the reds (allowed bonus, but they get spotted)
        for (const c of coloursPotted) {
          state.scores[shooter] += SNOOKER_POINTS[c.n];
          spotColour(c.n);
        }
        if (redsPotted.length > 0) {
          // Now must pot a colour — transition ball-on to colour choice
          state.ballOn = _chooseColourOn();
          continueTurn = true;
        }
      } else {
        // ballOn is a colour — must pot that colour
        const potted = coloursPotted.find(b => b.n === ballOn);
        if (potted) {
          state.scores[shooter] += SNOOKER_POINTS[potted.n];
          scored++;
          // Spot the colour back (reds still on table)
          spotColour(potted.n);
          // Next ball-on is red again (unless no reds left)
          if (state.redsLeft > 0) {
            state.ballOn = 'red';
            continueTurn = true;
          } else {
            // No reds — transition to colours phase
            state.coloursPhase = true;
            state.nextColour = 16;
            state.ballOn = 16;
            continueTurn = true;
          }
        }
        // If potted the wrong colour when on a colour — foul (already handled above)
      }
    } else {
      // ---- COLOURS PHASE ----
      // Must pot colours in order: yellow(16), green(17), brown(18), blue(19), pink(20), black(21)
      const potted = coloursPotted.find(b => b.n === state.nextColour);
      if (potted) {
        state.scores[shooter] += SNOOKER_POINTS[potted.n];
        scored++;
        // During colours phase, colours are NOT respotted
        state.nextColour++;
        if (state.nextColour > 21) {
          // All colours potted — frame over
          _checkFrameEnd();
          return;
        }
        state.ballOn = state.nextColour;
        continueTurn = true;
      }
    }

    // Player stats
    if (shooter === 'player') {
      if (scored === 0) state.playerStats.shotsMissed++;
      state.playerStats.ballsSunk += scored;
    }

    // Dialogue
    if (state.mode === 'vs') {
      if (shooter === 'player') {
        if (scored > 0 && SNOOKER_POINTS[anyPotted[0]?.n] >= 5) say('goodShotPlayer');
        else if (scored > 0) say('sunkPlayerBall');
        else say('missedPlayer');
      } else {
        if (scored > 0) say('goodShotAlistair');
        else say('missedAlistair');
      }
    }

    // Check if frame should end (e.g. someone is too far behind to win)
    if (_checkFrameEnd()) return;

    _nextTurn(continueTurn && scored > 0 ? shooter : other(shooter), false);
  }

  function _awardFoul(shooter, value) {
    // Opponent receives foul points
    const opp = other(shooter);
    state.scores[opp] += value;
    state.foulValue = value;
  }

  function _replaceCueBall() {
    const cue = state.balls[0];
    cue.inPlay = true; cue.pocketed = false;
    // Place in D (baulk area — near end of table in portrait, behind baulk line)
    cue.x = PLAY_X0 + PLAY_W * 0.82;
    cue.y = TABLE_H / 2;
    cue.vx = 0; cue.vy = 0; cue.wx = 0; cue.wy = 0; cue.spinX = 0; cue.spinY = 0;
    state.ballInHand = true;
  }

  function _spotRed(b) {
    // Re-spot a red near the pink or centre if needed
    b.x = PLAY_X0 + PLAY_W * 0.32;
    b.y = TABLE_H / 2;
    b.inPlay = true; b.pocketed = false;
    b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0;
  }

  function _chooseColourOn() {
    // Player can choose any colour when on a colour after reds phase
    // For AI: pick highest value available. For player: default to black (highest)
    if (state.turn === 'alistair') {
      // Pick highest value colour that is on the table
      for (let n = 21; n >= 16; n--) {
        const b = state.balls.find(b => b.n === n && b.inPlay);
        if (b) return n;
      }
    }
    // Player gets to choose — default to black for max points
    for (let n = 21; n >= 16; n--) {
      const b = state.balls.find(b => b.n === n && b.inPlay);
      if (b) return n;
    }
    return 19;  // fallback: blue
  }

  function _checkFrameEnd() {
    // Frame ends when all balls are off the table, or one player can't possibly catch up
    const allPocketed = state.balls.every(b => !b.inPlay || b.n === 0);
    if (allPocketed) {
      if (state.scores.player > state.scores.alistair) endGame('player', 'Frame complete');
      else if (state.scores.alistair > state.scores.player) endGame('alistair', 'Frame complete');
      else endGame(null, 'Frame tied — replay');
      return true;
    }
    // Snooker snooker: if the trailing player can't win even if they pot everything remaining
    const remaining = state.balls.filter(b => b.inPlay && b.n !== 0)
      .reduce((s, b) => s + (SNOOKER_POINTS[b.n] || 0), 0);
    const pScores = state.scores.player, aScores = state.scores.alistair;
    if (state.mode === 'vs') {
      if (pScores > aScores + remaining) { endGame('player', 'Opponent cannot catch up'); return true; }
      if (aScores > pScores + remaining) { endGame('alistair', 'Opponent cannot catch up'); return true; }
    }
    return false;
  }

  function _nextTurn(who, ballInHand) {
    state.turn = who;
    state.ballInHand = ballInHand;
    state.gamePhase = 'aiming';
    state.shotClockStart = performance.now();
    state.shotClockExpired = false;
    state.firstContact = null;
    state.pocketedThisShot = [];
    state._cueTouchedCushion = 0;
    state._ballsToCushion = 0;
    state.intentionalSafety = false;
    if (state.mode === 'vs' && who === 'alistair') {
      setTimeout(alistairMove, 900 + Math.random() * 800);
    }
  }


  function other(t) { return t === 'player' ? 'alistair' : 'player'; }

  // ---- Snooker helpers ----
  function redsRemaining() {
    return state.balls.filter(b => b.n >= 1 && b.n <= 15 && b.inPlay).length;
  }

  function coloursRemaining() {
    return state.balls.filter(b => b.n >= 16 && b.n <= 21 && b.inPlay);
  }

  let endGameHook = null;

  function endGame(winner, reason) {
    state.gamePhase = 'gameover';
    state.winner = winner;
    state.loseReason = reason;
    if (state.mode === 'vs') {
      if (winner === 'player') say('playerWonEight');
      else if (winner === 'alistair') say('alistairWonEight');
    }
    if (endGameHook) endGameHook(winner, reason);
  }

  function updateAISkill() {
    const p = state.playerStats;
    if (p.shotsTaken < 3) return;
    const missRate = p.shotsMissed / p.shotsTaken;
    const scratchRate = p.scratches / p.shotsTaken;
    p.skill = Math.max(0.1, Math.min(0.9, 1 - missRate * 0.6 - scratchRate * 0.3));
  }

  // ---- Snooker AI ----
  function alistairMove() {
    if (state.gamePhase !== 'aiming' || state.turn !== 'alistair') return;
    const cue = state.balls[0];
    const playerSkill = state.playerStats.skill;
    const aiSkill = Math.max(0.3, Math.min(0.95, playerSkill + 0.2));
    const noise = (1 - aiSkill) * 50;

    // Determine ball-on candidates
    let candidates = [];
    if (!state.coloursPhase) {
      if (state.ballOn === 'red') {
        candidates = state.balls.filter(b => b.n >= 1 && b.n <= 15 && b.inPlay);
      } else {
        const targetColour = state.balls.find(b => b.n === state.ballOn && b.inPlay);
        if (targetColour) candidates = [targetColour];
      }
    } else {
      const target = state.balls.find(b => b.n === state.nextColour && b.inPlay);
      if (target) candidates = [target];
    }

    if (candidates.length === 0) {
      // No valid ball — play safe
      state.aimX = cue.x + (Math.random() - 0.5) * 300;
      state.aimY = cue.y + (Math.random() - 0.5) * 100;
      state.power = 0.25;
      setTimeout(() => takeShot(), 800);
      return;
    }

    // Score all direct shots
    let best = null;
    for (const ball of candidates) {
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const p = POCKETS[pi];
        const score = scoreShot(cue, ball, p);
        const posScore = _positionScore(cue, ball, p, candidates);
        const total = score + posScore * 0.25;
        if (!best || total > best.score) {
          best = { ball, pocket: p, pi, score: total, type: 'direct' };
        }
      }
    }

    // Try banks if best direct is poor
    if (!best || best.score < -200) {
      const bank = _findBankShot(cue, candidates, aiSkill);
      if (bank && bank.score > (best ? best.score : -9999)) best = bank;
    }

    // Safety if all shots poor
    if (!best || best.score < -400) {
      _alistairSafety(cue, candidates);
      return;
    }

    // Execute
    let targetX, targetY;
    if (best.type === 'bank') {
      targetX = best.railX + (Math.random() - 0.5) * noise * 0.7;
      targetY = best.railY + (Math.random() - 0.5) * noise * 0.7;
    } else {
      const ghost = ghostBall(best.ball, best.pocket);
      targetX = ghost.x + (Math.random() - 0.5) * noise;
      targetY = ghost.y + (Math.random() - 0.5) * noise;
    }

    state.aimX = targetX;
    state.aimY = targetY;
    state.power = best.type === 'bank' ? 0.55 + Math.random() * 0.3 : 0.45 + Math.random() * 0.3 + aiSkill * 0.1;
    state.spinX = 0;
    state.spinY = (Math.random() - 0.5) * 0.1;

    // Snooker-appropriate dialogue
    const lead = state.scores.alistair - state.scores.player;
    if (best.ball.n >= 16 && SNOOKER_POINTS[best.ball.n] >= 5) say('alistairEightApproach');
    else if (lead < -10) say('playerLeading');
    else if (lead > 15) say('alistairLeading');
    else if (best.type === 'bank') say('bank');
    else if (Math.random() < 0.15) say('contemplative');

    setTimeout(() => takeShot(), 700 + Math.random() * 500);
  }

  function countGroup(who) {
    // In snooker: return score for 'who'
    return state.scores ? (state.scores[who] || 0) : 0;
  }

  function ghostBall(target, pocket) {
    const dx = target.x - pocket.x;
    const dy = target.y - pocket.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    return { x: target.x + ux * BALL_R * 2, y: target.y + uy * BALL_R * 2 };
  }

  function scoreShot(cue, ball, pocket) {
    const ghost = ghostBall(ball, pocket);
    // Line from cue through ghost to pocket — check for obstructions
    let score = 0;
    const cueToBall = Math.hypot(ghost.x - cue.x, ghost.y - cue.y);
    const ballToPocket = Math.hypot(pocket.x - ball.x, pocket.y - ball.y);
    // Prefer shorter shots and bigger pockets
    score -= cueToBall * 0.3;
    score -= ballToPocket * 0.5;
    // Bonus for high-value balls
    score += (SNOOKER_POINTS[ball.n] || 1) * 20;
    // Check for obstructions (rough: other balls blocking the line)
    for (const ob of state.balls) {
      if (!ob.inPlay || ob === ball || ob.n === 0) continue;
      if (_lineBlockedByBall(cue.x, cue.y, ghost.x, ghost.y, ob.x, ob.y)) score -= 200;
      if (_lineBlockedByBall(ball.x, ball.y, pocket.x, pocket.y, ob.x, ob.y)) score -= 150;
    }
    return score;
  }

  function _lineBlockedByBall(x1, y1, x2, y2, bx, by) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx/len, uy = dy/len;
    const t = (bx - x1) * ux + (by - y1) * uy;
    if (t < BALL_R || t > len - BALL_R) return false;
    const px = x1 + ux * t, py = y1 + uy * t;
    return Math.hypot(px - bx, py - by) < BALL_R * 2 + 2;
  }

  function _positionScore(cue, ball, pocket, candidates) {
    if (!candidates || candidates.length <= 1) return 0;
    const ghost = ghostBall(ball, pocket);
    // Estimate cue ball deflection direction after contact (rough 90deg from shot line)
    const bToP = { x: pocket.x - ball.x, y: pocket.y - ball.y };
    const bLen = Math.hypot(bToP.x, bToP.y) || 1;
    const perpX = -bToP.y / bLen, perpY = bToP.x / bLen;
    const estX = ball.x + perpX * 80, estY = ball.y + perpY * 80;
    let minDist = 9999;
    for (const c of candidates) {
      if (c === ball) continue;
      minDist = Math.min(minDist, Math.hypot(estX - c.x, estY - c.y));
    }
    return Math.max(0, 300 - minDist);
  }

  function _findBankShot(cue, candidates, aiSkill) {
    let best = null;
    for (const ball of candidates) {
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const p = POCKETS[pi];
        const banks = _computeBankPoints(cue, ball, p);
        for (const bank of banks) {
          if (!bank) continue;
          const score = -Math.hypot(bank.railX - cue.x, bank.railY - cue.y) * 0.4
                      - Math.hypot(bank.railX - bank.ghostX, bank.railY - bank.ghostY) * 0.5
                      + aiSkill * 50;
          if (!best || score > best.score) {
            best = { ball, pocket: p, pi, score, type: 'bank', ...bank };
          }
        }
      }
    }
    return best;
  }

  function _computeBankPoints(cue, ball, pocket) {
    const ghost = ghostBall(ball, pocket);
    const banks = [];
    const rails = [
      { axis: 'x', val: PLAY_X0 + BALL_R },
      { axis: 'x', val: PLAY_X1 - BALL_R },
      { axis: 'y', val: PLAY_Y0 + BALL_R },
      { axis: 'y', val: PLAY_Y1 - BALL_R }
    ];
    for (const rail of rails) {
      if (rail.axis === 'x') {
        const mirrorX = 2 * rail.val - ghost.x;
        const t = (rail.val - cue.x) / ((mirrorX - cue.x) || 0.0001);
        if (t <= 0 || t >= 1) continue;
        const railY = cue.y + t * (ghost.y - cue.y);
        if (railY < PLAY_Y0 || railY > PLAY_Y1) continue;
        banks.push({ railX: rail.val, railY, ghostX: ghost.x, ghostY: ghost.y });
      } else {
        const mirrorY = 2 * rail.val - ghost.y;
        const t = (rail.val - cue.y) / ((mirrorY - cue.y) || 0.0001);
        if (t <= 0 || t >= 1) continue;
        const railX = cue.x + t * (ghost.x - cue.x);
        if (railX < PLAY_X0 || railX > PLAY_X1) continue;
        banks.push({ railX, railY: rail.val, ghostX: ghost.x, ghostY: ghost.y });
      }
    }
    return banks;
  }

  function _alistairSafety(cue, candidates) {
    if (candidates.length > 0) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      state.aimX = target.x;
      state.aimY = target.y;
      state.power = 0.2 + Math.random() * 0.15;
      state.spinX = 0;
      state.spinY = -0.4;
      state.intentionalSafety = true;
      say('safety');
    } else {
      state.aimX = PLAY_X0 + PLAY_W * 0.2;
      state.aimY = TABLE_H / 2;
      state.power = 0.2;
    }
    setTimeout(() => takeShot(), 700 + Math.random() * 400);
  }


  function pointToSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const len = C * C + D * D;
    const t = len ? Math.max(0, Math.min(1, dot / len)) : 0;
    const xx = x1 + C * t, yy = y1 + D * t;
    return Math.hypot(px - xx, py - yy);
  }

  // ---------- Dialogue display --------------------------------------------
  function say(cat) {
    if (!cat) return;
    const line = pickLine(cat);
    if (!line) return;
    state.dialogue = line;
    state.dialogueTimer = 320;
  }
  // ============================================================================
  //  POOL v3 — 2.5D portrait rendering + input + screens
  // ============================================================================

  // ---------- Audio engine ------------------------------------------------
  // Clean, professional snooker sounds. Phenolic resin balls on slate.
  // Design principle: ONE sound per event, fast attack, fast decay, no mud.

  let _ac = null, _masterGain = null, _compressor = null, _audioReady = false;
  const _lastSoundAt = {};

  function _cooldown(key, ms) {
    const now = performance.now();
    if (_lastSoundAt[key] && now - _lastSoundAt[key] < ms) return false;
    _lastSoundAt[key] = now;
    return true;
  }

  function _initAudio() {
    if (_audioReady) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      _ac = new AC();
      // Master compressor — keeps everything clean, prevents clipping on break
      _compressor = _ac.createDynamicsCompressor();
      _compressor.threshold.value = -18;
      _compressor.knee.value = 6;
      _compressor.ratio.value = 4;
      _compressor.attack.value = 0.003;
      _compressor.release.value = 0.15;
      _masterGain = _ac.createGain();
      _masterGain.gain.value = 0.65;
      _masterGain.connect(_compressor);
      _compressor.connect(_ac.destination);
      _audioReady = true;
      return true;
    } catch (e) { return false; }
  }

  function _resumeAudio() {
    if (_ac && _ac.state === 'suspended') _ac.resume();
  }

  function _now() { return _ac.currentTime; }

  // Core primitive: one-shot percussive click/impact.
  // Models an impulse excitation into a resonant body.
  // freq = resonant frequency, decay = how fast it rings down, vol = peak volume.
  function _click(freq, decay, vol, t) {
    if (!_ac) return;
    const osc = _ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, t);          // start sharp, ring down
    osc.frequency.exponentialRampToValueAtTime(freq, t + decay * 0.15);
    const g = _ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.001);       // instant attack
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g); g.connect(_masterGain);
    osc.start(t); osc.stop(t + decay + 0.01);
  }

  // Noise burst: thud/rumble. Short, filtered, fast decay.
  function _thud(freqCenter, bw, decay, vol, t) {
    if (!_ac) return;
    const sr = _ac.sampleRate;
    const len = Math.ceil(sr * decay);
    const buf = _ac.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = _ac.createBufferSource();
    src.buffer = buf;
    const lpf = _ac.createBiquadFilter();
    lpf.type = 'bandpass';
    lpf.frequency.value = freqCenter;
    lpf.Q.value = freqCenter / (bw || freqCenter);
    const g = _ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(lpf); lpf.connect(g); g.connect(_masterGain);
    src.start(t); src.stop(t + decay);
  }

  // ---- Sound events ----

  // Cue tip strikes cue ball — clean leather-on-phenolic "tack"
  function sndCueStrike(power) {
    if (!_initAudio()) return;
    _resumeAudio();
    const t = _now() + 0.015;
    const p = Math.max(0.15, power);
    // Primary click — cue tip impact
    _click(1800, 0.04 + p * 0.02, 0.4 + p * 0.35, t);
    // Low body — cue shaft thump, scales with power
    _thud(280, 200, 0.06 + p * 0.04, 0.2 + p * 0.25, t);
  }

  // Ball-ball collision — phenolic resin "clack", clean, single hit
  function sndBallCollide(speed) {
    if (!_initAudio()) return;
    if (!_cooldown('ball', 60)) return;
    const vol = Math.min(0.75, 0.12 + speed * 0.022);
    const t = _now() + 0.015;
    // Phenolic resin snooker balls resonate around 2400-2800 Hz
    // Single dominant frequency — no detuning, no secondary tone, just the clack
    _click(2500 + Math.random() * 300, 0.035, vol, t);
  }

  // Ball hits cushion — muted rubber thud, no sustain
  function sndCushion(speed) {
    if (!_initAudio()) return;
    if (!_cooldown('cushion', 70)) return;
    const vol = Math.min(0.55, 0.08 + speed * 0.018);
    const t = _now() + 0.015;
    // K-66 rubber: low frequency thud, very short
    _thud(220, 180, 0.07, vol, t);
  }

  // Ball drops into pocket — hollow rumble then settle
  function sndPocket() {
    if (!_initAudio()) return;
    const t = _now() + 0.015;
    _thud(400, 300, 0.08, 0.35, t);           // roll into pocket
    _click(180, 0.25, 0.45, t + 0.07);        // drop impact — low resonant thud
    _thud(120, 100, 0.3, 0.2, t + 0.14);      // settle
  }

  // Cue ball scratch — same as pocket but with a flat wrong-note
  function sndScratch() {
    if (!_initAudio()) return;
    const t = _now() + 0.015;
    _thud(400, 300, 0.08, 0.35, t);
    _click(180, 0.25, 0.4, t + 0.07);
    // Short dissonant note — "mistake" signal
    _click(290, 0.4, 0.15, t + 0.18);
  }

  // Break shot — cue strike + immediate cascade handled by ball-ball collisions
  function sndBreak(power) {
    if (!_initAudio()) return;
    _resumeAudio();
    const t = _now() + 0.015;
    const p = Math.max(0.5, power);
    // Heavier cue impact for the break
    _click(1600, 0.055, 0.55 + p * 0.3, t);
    _thud(320, 250, 0.09, 0.35 + p * 0.2, t);
  }

  // Win sting — simple rising 3-note phrase
  function sndWin() {
    if (!_initAudio()) return;
    const t = _now() + 0.08;
    [523, 659, 784].forEach((f, i) => _click(f, 0.4, 0.22, t + i * 0.13));
  }

  // Lose sting — falling minor phrase
  function sndLose() {
    if (!_initAudio()) return;
    const t = _now() + 0.08;
    [440, 370, 330].forEach((f, i) => _click(f, 0.4, 0.18, t + i * 0.15));
  }

  // Cloth roll — suppress entirely, too distracting
  function sndCloth(_totalSpeed) {}

  // ---------- Layout & projection -----------------------------------------
  //
  // The table internal coordinate system is unchanged from the working v1:
  //   tx ∈ [0, TABLE_W]  (long axis)
  //   ty ∈ [0, TABLE_H]  (short axis)
  //
  // On portrait orientation, we rotate the view 90° so the long axis runs vertically:
  //   tx → screen_y (low tx = far/top of screen, high tx = near/bottom)
  //   ty → screen_x (low ty = left, high ty = right)
  //
  // 2.5D effect: gentle vertical foreshortening — the far end (top of screen) is
  // rendered slightly narrower than the near end. Implemented by computing a
  // per-row scale factor: rows near the top compress horizontally by ~12%.
  //
  // No camera, no perspective math — just a tilt-effect via lerp scaling.

  const TILT_FAR_SCALE = 0.86;  // far end is 86% as wide as near end
  // const TILT_FAR_SCALE = 1.0;  // disable tilt for pure top-down

  const view = {
    portrait: true,
    boardX: 0, boardY: 0,
    boardW: 0, boardH: 0,         // outer playable rectangle on screen
    pxPerUnit: 1,                 // base scale (top of table = pxPerUnit * TILT_FAR_SCALE)
    isReady: false
  };

  // Compute layout based on canvas size. Called every frame.
  function computeView() {
    const W = canvas.width;
    const H = canvas.height;
    view.portrait = true;  // always portrait — long axis runs vertically on all screens

    const topReserve = 84;
    const bottomReserve = 110;
    const availW = W - 24;
    const availH = H - topReserve - bottomReserve;
    const sByW = availW / TABLE_H;   // short axis fills width
    const sByH = availH / TABLE_W;   // long axis fills height
    view.pxPerUnit = Math.min(sByW, sByH);
    view.boardW = TABLE_H * view.pxPerUnit;
    view.boardH = TABLE_W * view.pxPerUnit;
    view.boardX = (W - view.boardW) / 2;
    view.boardY = topReserve + (availH - view.boardH) / 2;
    view.isReady = true;
  }

  // Apply tilt: a row at fraction f from the far edge (0 at far, 1 at near)
  // gets horizontal scale = TILT_FAR_SCALE + (1 - TILT_FAR_SCALE) * f.
  function tiltScaleAt(fAxisFromFar) {
    return TILT_FAR_SCALE + (1 - TILT_FAR_SCALE) * fAxisFromFar;
  }

  // Project a table-space point (tx, ty) → screen (x, y).
  // In portrait: tx is vertical (small=top=far), ty is horizontal.
  // In landscape: tx is horizontal (small=left), ty is vertical.
  function tableToScreen(tx, ty) {
    if (view.portrait) {
      // Vertical position from tx: 0 → top (far), TABLE_W → bottom (near)
      const fFromFar = tx / TABLE_W;          // 0..1, 0 = far, 1 = near
      const screenY = view.boardY + fFromFar * view.boardH;
      // Horizontal width compresses with distance:
      const tilt = tiltScaleAt(fFromFar);
      const halfBoardW = view.boardW / 2;
      const cx = view.boardX + halfBoardW;    // center column on screen
      // ty=0 → left rail (cx - halfBoardW * tilt)
      // ty=TABLE_H → right rail (cx + halfBoardW * tilt)
      const offset = (ty / TABLE_H - 0.5) * 2;  // -1..1
      const screenX = cx + offset * halfBoardW * tilt;
      return { x: screenX, y: screenY, tilt };
    }
    // Landscape: simple linear scaling.
    return {
      x: view.boardX + tx * view.pxPerUnit,
      y: view.boardY + ty * view.pxPerUnit,
      tilt: 1
    };
  }

  // Inverse: screen → table coordinates (for input).
  function screenToTable(sx, sy) {
    if (view.portrait) {
      const fFromFar = (sy - view.boardY) / view.boardH;
      if (fFromFar < -0.05 || fFromFar > 1.05) return { x: -1, y: -1 };
      const tx = fFromFar * TABLE_W;
      const tilt = tiltScaleAt(Math.max(0, Math.min(1, fFromFar)));
      const halfBoardW = view.boardW / 2;
      const cx = view.boardX + halfBoardW;
      const offset = (sx - cx) / (halfBoardW * tilt);  // -1..1 if on table
      const ty = (offset / 2 + 0.5) * TABLE_H;
      return { x: tx, y: ty };
    }
    return {
      x: (sx - view.boardX) / view.pxPerUnit,
      y: (sy - view.boardY) / view.pxPerUnit
    };
  }

  // Effective px-per-unit at a given table position (for ball size, etc).
  function unitScaleAt(tx, ty) {
    if (view.portrait) {
      const fFromFar = tx / TABLE_W;
      // X-axis scale shrinks with distance, Y-axis is constant. Average for round shapes.
      const tilt = tiltScaleAt(fFromFar);
      return view.pxPerUnit * (1 + tilt) / 2;
    }
    return view.pxPerUnit;
  }
  // ---------- Rendering ----------------------------------------------------

  function render() {
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    computeView();

    // Background
    const bg = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    bg.addColorStop(0, '#1a0e07');
    bg.addColorStop(1, '#050201');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawTable();
    drawRackTriangle();
    drawBalls();
    drawAimAndStick();

    drawTopBar();
    drawDialogueBubble();
    drawHUD();
    drawCallPocketOverlay();
    drawGameOverOverlay();
    drawScreenOverlay();
  }

  // ---------- Table -------------------------------------------------------
  function drawTable() {
    // Outer table frame: walnut. Use 4 trapezoidal segments around the playfield.
    // Compute corners of:
    //   outer rect: (0,0) (TABLE_W,0) (TABLE_W,TABLE_H) (0,TABLE_H)  — projected
    //   playfield rect: (RAIL,RAIL) (TABLE_W-RAIL,RAIL) etc.
    const oc = [
      tableToScreen(0, 0),
      tableToScreen(TABLE_W, 0),
      tableToScreen(TABLE_W, TABLE_H),
      tableToScreen(0, TABLE_H)
    ];
    const pc = [
      tableToScreen(PLAY_X0, PLAY_Y0),
      tableToScreen(PLAY_X1, PLAY_Y0),
      tableToScreen(PLAY_X1, PLAY_Y1),
      tableToScreen(PLAY_X0, PLAY_Y1)
    ];

    // Drop shadow under the table
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.moveTo(oc[0].x - 12, oc[0].y - 6);
    ctx.lineTo(oc[1].x + 12, oc[1].y - 6);
    ctx.lineTo(oc[2].x + 18, oc[2].y + 14);
    ctx.lineTo(oc[3].x - 18, oc[3].y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Walnut frame (outer trapezoid - inner trapezoid via even-odd)
    ctx.save();
    const frameGrad = ctx.createLinearGradient(0, oc[0].y, 0, oc[2].y);
    frameGrad.addColorStop(0, '#2a1405');
    frameGrad.addColorStop(0.5, '#4a220c');
    frameGrad.addColorStop(1, '#3a1a08');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.moveTo(oc[0].x, oc[0].y);
    ctx.lineTo(oc[1].x, oc[1].y);
    ctx.lineTo(oc[2].x, oc[2].y);
    ctx.lineTo(oc[3].x, oc[3].y);
    ctx.closePath();
    ctx.moveTo(pc[0].x, pc[0].y);
    ctx.lineTo(pc[3].x, pc[3].y);
    ctx.lineTo(pc[2].x, pc[2].y);
    ctx.lineTo(pc[1].x, pc[1].y);
    ctx.closePath();
    ctx.fill('evenodd');

    // Brass inner-rail trim
    ctx.strokeStyle = 'rgba(210,170,90,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pc[0].x, pc[0].y);
    ctx.lineTo(pc[1].x, pc[1].y);
    ctx.lineTo(pc[2].x, pc[2].y);
    ctx.lineTo(pc[3].x, pc[3].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Felt — clip to playfield trapezoid
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pc[0].x, pc[0].y);
    ctx.lineTo(pc[1].x, pc[1].y);
    ctx.lineTo(pc[2].x, pc[2].y);
    ctx.lineTo(pc[3].x, pc[3].y);
    ctx.closePath();
    ctx.clip();

    const minX = Math.min(pc[0].x, pc[3].x) - 4;
    const maxX = Math.max(pc[1].x, pc[2].x) + 4;
    const minY = pc[0].y - 2;
    const maxY = pc[2].y + 2;

    // Base felt
    ctx.fillStyle = '#6b1a0c';
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

    // Lamp glow at center
    const center = tableToScreen(TABLE_W/2, TABLE_H/2);
    const glow = ctx.createRadialGradient(
      center.x, center.y, 30,
      center.x, center.y, Math.max(maxX - minX, maxY - minY) * 0.55
    );
    glow.addColorStop(0,   'rgba(255, 200, 130, 0.30)');
    glow.addColorStop(0.5, 'rgba(180, 100,  50, 0.10)');
    glow.addColorStop(1,   'rgba(20, 8, 4, 0.5)');
    ctx.fillStyle = glow;
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

    // Felt grain — very subtle horizontal lines
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 30; i++) {
      const ty = (i + 0.5) * (TABLE_H / 30);
      const a = tableToScreen(0, ty);
      const b = tableToScreen(TABLE_W, ty);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();

    // Pockets — drawn AFTER felt so they're visible
    drawPockets();
  }

  function drawPockets() {
    const pocketRadius = 28;  // table units — outer mouth
    for (const p of POCKETS) {
      const c = tableToScreen(p.x, p.y);
      const u = unitScaleAt(p.x, p.y);
      const r = pocketRadius * u;

      ctx.save();
      // Brass bezel ring
      ctx.fillStyle = '#2a1806';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, r * 1.15, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(210,170,90,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Pocket interior — black well
      const wellGrad = ctx.createRadialGradient(c.x, c.y - r * 0.2, 1, c.x, c.y, r);
      wellGrad.addColorStop(0, '#0a0402');
      wellGrad.addColorStop(1, '#000');
      ctx.fillStyle = wellGrad;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, r, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Rack triangle (shown pre-break, dims once shot taken) -------
  function drawRackTriangle() {
    if (!state) return;
    // Only show before break (all 15 balls still in play, no shot taken yet)
    const ballsInPlay = state.balls.filter(b => b.inPlay && b.n !== 0).length;
    if (ballsInPlay < 15 || state.gamePhase === 'simulating') return;
    if (state.pocketedThisShot && state.pocketedThisShot.length > 0) return;
    // Only show before the first shot (shotsTaken == 0)
    if (state.playerStats.shotsTaken > 0) return;

    // Find approximate rack center (foot spot) — bottom 28% of table in portrait
    const foot = tableToScreen(PLAY_X0 + PLAY_W * 0.28, TABLE_H / 2);
    const rackR = BALL_R * BALL_VISUAL_MULT * unitScaleAt(PLAY_X0 + PLAY_W * 0.22, TABLE_H / 2) * 3.2;

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    // Equilateral triangle around rack center
    const rowH = rackR * 0.86;
    // Triangle vertices (rough bounding triangle for 5-row rack)
    ctx.beginPath();
    ctx.moveTo(foot.x, foot.y - rowH * 2);          // apex (top)
    ctx.lineTo(foot.x - rackR * 2, foot.y + rowH * 2); // bottom-left
    ctx.lineTo(foot.x + rackR * 2, foot.y + rowH * 2); // bottom-right
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ---------- Balls -------------------------------------------------------
  // Balls rendered larger than physics radius for visibility.
  const BALL_VISUAL_MULT = 1.7;  // visual radius = BALL_R × this

  function drawBalls() {
    if (!state) return;
    // Sort balls by tx (depth) — far balls drawn first, near balls last (so they overlap correctly).
    const list = state.balls.filter(b => b.inPlay).slice();
    if (view.portrait) list.sort((a, b) => a.x - b.x);
    else list.sort((a, b) => a.y - b.y);

    // Shadows in a separate pass first (so no ball's shadow lands on another ball).
    for (const b of list) drawBallShadow(b);
    for (const b of list) drawBall3D(b);
  }

  function drawBallShadow(b) {
    const c = tableToScreen(b.x, b.y);
    const u = unitScaleAt(b.x, b.y);
    const r = BALL_R * BALL_VISUAL_MULT * u;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(c.x + r * 0.12, c.y + r * 0.18, r * 1.05, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBall3D(b) {
    const c = tableToScreen(b.x, b.y);
    const u = unitScaleAt(b.x, b.y);
    const r = BALL_R * BALL_VISUAL_MULT * u;
    const color = BALL_COLORS[b.n];

    ctx.save();
    // Base sphere — radial gradient highlight upper-left, shadow lower-right
    const grad = ctx.createRadialGradient(
      c.x - r * 0.35, c.y - r * 0.4, r * 0.1,
      c.x, c.y, r
    );
    grad.addColorStop(0,   _lighten(color, 0.55));
    grad.addColorStop(0.4, color);
    grad.addColorStop(1,   _darken(color, 0.6));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();

    // No stripe bands in snooker

    // Snooker ball markings:
    // Reds (1-15): no number, just a clean red sphere
    // Colours (16-21): small white dot with initial letter
    // Cue ball (0): no marking
    if (b.n >= 16 && b.n <= 21) {
      // Colour ball — white circle with initial
      const label = { 16:'Y', 17:'G', 18:'Br', 19:'B', 20:'P', 21:'Bk' }[b.n] || '';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, r * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = 'bold ' + Math.floor(r * 0.58) + 'px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, c.x, c.y + 0.5);
    }

    // Specular highlight
    const spec = ctx.createRadialGradient(
      c.x - r * 0.4, c.y - r * 0.45, 0,
      c.x - r * 0.4, c.y - r * 0.45, r * 0.55
    );
    spec.addColorStop(0,   'rgba(255,255,255,0.85)');
    spec.addColorStop(0.4, 'rgba(255,255,255,0.2)');
    spec.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Rim
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r - 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    b._screen = { x: c.x, y: c.y, r };
  }

  function _lighten(hex, amt) {
    const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return hex;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), bl = parseInt(m[3], 16);
    const lr = Math.min(255, Math.round(r + (255 - r) * amt));
    const lg = Math.min(255, Math.round(g + (255 - g) * amt));
    const lb = Math.min(255, Math.round(bl + (255 - bl) * amt));
    return `rgb(${lr},${lg},${lb})`;
  }
  function _darken(hex, amt) {
    const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return hex;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), bl = parseInt(m[3], 16);
    const lr = Math.round(r * (1 - amt));
    const lg = Math.round(g * (1 - amt));
    const lb = Math.round(bl * (1 - amt));
    return `rgb(${lr},${lg},${lb})`;
  }

  // ---------- Ghost ball computation ----------------------------------------
  // Find the first object ball the cue ball would hit along the aim line.
  // Returns ghost position (where cue ball center would be at contact) + deflection.
  function _computeGhostBall(cue, ux, uy) {
    let bestT = 9999;
    let bestBall = null;
    const minD = BALL_R * 2;
    for (const b of state.balls) {
      if (!b.inPlay || b.n === 0) continue;
      // Distance from aim line to ball center
      const dx = b.x - cue.x;
      const dy = b.y - cue.y;
      // Project onto aim direction
      const t = dx * ux + dy * uy;
      if (t < BALL_R) continue;  // behind or too close
      // Perpendicular distance
      const px = cue.x + ux * t - b.x;
      const py = cue.y + uy * t - b.y;
      const perp = Math.hypot(px, py);
      if (perp < minD) {
        // Contact offset along aim line
        const hitT = t - Math.sqrt(Math.max(0, minD * minD - perp * perp));
        if (hitT < bestT && hitT > 0) {
          bestT = hitT;
          bestBall = b;
        }
      }
    }
    if (!bestBall) return null;
    // Ghost ball position = where cue ball center is at contact
    const ghostX = cue.x + ux * bestT;
    const ghostY = cue.y + uy * bestT;
    // Deflection direction of object ball = from ghost center to object ball center
    const ddx = bestBall.x - ghostX;
    const ddy = bestBall.y - ghostY;
    const ddLen = Math.hypot(ddx, ddy) || 1;
    return {
      ghostX, ghostY,
      targetX: bestBall.x, targetY: bestBall.y,
      defX: ddx / ddLen, defY: ddy / ddLen
    };
  }

  // ---------- Cue stick & aim line ----------------------------------------
  function drawAimAndStick() {
    if (!state || state.gamePhase !== 'aiming') return;
    if (state.turn !== 'player' || state.ballInHand) return;
    if (state.showCallPocket) return;
    const cue = state.balls[0];
    if (!cue.inPlay) return;

    const cs = tableToScreen(cue.x, cue.y);
    const u = unitScaleAt(cue.x, cue.y);

    // Aim direction: from cue ball toward (state.aimX, state.aimY)
    const dx = state.aimX - cue.x;
    const dy = state.aimY - cue.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;

    // Projected aim line endpoint — extend ~600 table units
    const aimEnd = tableToScreen(cue.x + ux * 600, cue.y + uy * 600);

    // Ghost ball — find first object ball along aim line and show contact point
    const ghostResult = _computeGhostBall(cue, ux, uy);

    ctx.save();
    if (ghostResult) {
      // Aim line from cue ball to ghost ball contact point
      const gcs = tableToScreen(ghostResult.ghostX, ghostResult.ghostY);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.setLineDash([5, 7]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cs.x, cs.y);
      ctx.lineTo(gcs.x, gcs.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // Ghost ball outline at contact position
      const gu = unitScaleAt(ghostResult.ghostX, ghostResult.ghostY);
      const gr = BALL_R * BALL_VISUAL_MULT * gu;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(gcs.x, gcs.y, gr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Object ball deflection line (where it will go after contact)
      const defEnd = tableToScreen(
        ghostResult.targetX + ghostResult.defX * 200,
        ghostResult.targetY + ghostResult.defY * 200
      );
      ctx.strokeStyle = 'rgba(255,220,100,0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(tableToScreen(ghostResult.targetX, ghostResult.targetY).x,
                 tableToScreen(ghostResult.targetX, ghostResult.targetY).y);
      ctx.lineTo(defEnd.x, defEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // No object ball — full aim line
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.setLineDash([5, 7]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cs.x, cs.y);
      ctx.lineTo(aimEnd.x, aimEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Cue stick rendered behind cue ball, in screen-space.
    // Direction in screen: from cue point AWAY from aim end.
    const sdx = cs.x - aimEnd.x;
    const sdy = cs.y - aimEnd.y;
    const sd = Math.hypot(sdx, sdy) || 1;
    const sux = sdx / sd, suy = sdy / sd;

    // Pull-back offset (visual)
    const pullBack = (state.pullBack || 0) * u;
    const ballR = BALL_R * BALL_VISUAL_MULT * u;
    const tipGap = ballR + 4 + pullBack;

    const tipX = cs.x + sux * tipGap;
    const tipY = cs.y + suy * tipGap;

    const stickLen = 160 * u;
    const ferruleLen = 8 * u;
    const wrapLen = 30 * u;
    const buttLen = 24 * u;

    function pt(distFromTip) {
      return { x: tipX + sux * distFromTip, y: tipY + suy * distFromTip };
    }

    // Shadow
    const tail = pt(stickLen);
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 5 * u;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(tipX + 2, tipY + 3);
    ctx.lineTo(tail.x + 2, tail.y + 3);
    ctx.stroke();
    ctx.restore();

    // Ferrule
    const ferruleEnd = pt(ferruleLen);
    ctx.strokeStyle = '#f5ecd7';
    ctx.lineWidth = 3.6 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(ferruleEnd.x, ferruleEnd.y);
    ctx.stroke();

    // Maple shaft
    const shaftEnd = pt(stickLen - wrapLen - buttLen);
    ctx.strokeStyle = '#d4a868';
    ctx.lineWidth = 3.8 * u;
    ctx.beginPath();
    ctx.moveTo(ferruleEnd.x, ferruleEnd.y);
    ctx.lineTo(shaftEnd.x, shaftEnd.y);
    ctx.stroke();

    // Specular along shaft top
    ctx.strokeStyle = 'rgba(255,235,180,0.45)';
    ctx.lineWidth = 0.8 * u;
    ctx.beginPath();
    // Perpendicular offset in screen space — rotate (sux, suy) 90°
    const px_off = -suy * 1.2 * u;
    const py_off = sux * 1.2 * u;
    ctx.moveTo(ferruleEnd.x + px_off, ferruleEnd.y + py_off);
    ctx.lineTo(shaftEnd.x + px_off, shaftEnd.y + py_off);
    ctx.stroke();

    // Leather wrap
    const wrapEnd = pt(stickLen - buttLen);
    ctx.strokeStyle = '#3a1f10';
    ctx.lineWidth = 4.2 * u;
    ctx.beginPath();
    ctx.moveTo(shaftEnd.x, shaftEnd.y);
    ctx.lineTo(wrapEnd.x, wrapEnd.y);
    ctx.stroke();

    // Wrap stitching
    ctx.strokeStyle = 'rgba(150,110,60,0.5)';
    ctx.lineWidth = 0.6 * u;
    for (let s = 0; s < 6; s++) {
      const sp = pt(stickLen - buttLen - wrapLen + (s + 0.5) * (wrapLen / 6));
      ctx.beginPath();
      ctx.moveTo(sp.x - suy * 2.5 * u, sp.y + sux * 2.5 * u);
      ctx.lineTo(sp.x + suy * 2.5 * u, sp.y - sux * 2.5 * u);
      ctx.stroke();
    }

    // Butt
    const buttEnd = pt(stickLen);
    ctx.strokeStyle = '#1a0e06';
    ctx.lineWidth = 4.6 * u;
    ctx.beginPath();
    ctx.moveTo(wrapEnd.x, wrapEnd.y);
    ctx.lineTo(buttEnd.x, buttEnd.y);
    ctx.stroke();

    // Brass ring
    ctx.fillStyle = '#d9a679';
    ctx.beginPath();
    ctx.arc(wrapEnd.x, wrapEnd.y, 2.2 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // ---------- Top bar, dialogue, HUD --------------------------------------

  function drawTopBar() {
    if (!state) return;
    const W = canvas.width;
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.88)';
    ctx.fillRect(0, 0, W, 32);

    if (state.mode === 'vs' && match) {
      ctx.fillStyle = '#e8dcc3';
      ctx.font = 'italic 11px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const turnLabel = state.turn === 'player'
        ? 'YOUR TURN'
        : (state.gamePhase === 'simulating' ? 'ALISTAIR SHOOTING…' : 'ALISTAIR THINKING…');
      ctx.fillText('Bo' + match.format + '  ·  ' + turnLabel, 10, 16);
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.fillStyle = '#f5ecd7';
      ctx.fillText(match.playerFrames + '  —  ' + match.alistairFrames, W / 2, 17);
      // Snooker scores (current frame)
      ctx.font = '10px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c9b98a';
      const sc = state.scores || { player: 0, alistair: 0 };
      const ballOnLabel = state.coloursPhase
        ? (SNOOKER_COLOUR_NAMES[state.nextColour] || '')
        : (state.ballOn === 'red' ? 'RED' : (SNOOKER_COLOUR_NAMES[state.ballOn] || ''));
      ctx.fillText('ON: ' + ballOnLabel + '   ' + sc.player + ' – ' + sc.alistair, W - 10, 16);
    } else if (state.mode === 'solo') {
      const sc = state.scores || { player: 0, alistair: 0 };
      ctx.fillStyle = '#e8dcc3';
      ctx.font = 'italic 11px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('SOLO  ·  SCORE: ' + sc.player, 10, 16);
      ctx.textAlign = 'center';
      const ballOnLabel = state.coloursPhase
        ? (SNOOKER_COLOUR_NAMES[state.nextColour] || '')
        : (state.ballOn === 'red' ? 'RED' : (SNOOKER_COLOUR_NAMES[state.ballOn] || ''));
      ctx.fillStyle = '#f7c948';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.fillText('ON: ' + ballOnLabel, W / 2, 16);
    }
    ctx.restore();
  }

  function drawDialogueBubble() {
    if (!state || state.mode !== 'vs') return;
    if (!state.dialogue || state.dialogueTimer <= 0) return;
    const W = canvas.width;
    const boxY = 38;
    const boxH = 44;
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.92)';
    ctx.strokeStyle = 'rgba(210,170,110,0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, 8, boxY, W - 16, boxH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ebdab3';
    ctx.font = 'italic bold 10px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ALISTAIR', 16, boxY + 4);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '12px Georgia, serif';
    const lines = wrapText(state.dialogue, W - 32);
    for (let i = 0; i < lines.length && i < 2; i++) {
      ctx.fillText(lines[i], 16, boxY + 18 + i * 14);
    }
    ctx.restore();
    state.dialogueTimer--;
  }

  // HUD: SHOOT button (bottom-left), power slider (right edge), spin ball (bottom-right)
  const hud = {};

  function drawHUD() {
    if (!state) return;
    if (state.gamePhase !== 'aiming' || state.turn !== 'player') return;
    if (state.ballInHand || state.showCallPocket) return;
    const W = canvas.width;
    const H = canvas.height;

    // SHOOT + SAFE stacked vertically, bottom-left
    const btnW = Math.min(130, W * 0.30);
    const btnH = 46;
    const btnX = 12;
    const shootY = H - btnH * 2 - 14 - 6;
    const safeY2 = shootY + btnH + 6;

    // SHOOT
    ctx.save();
    ctx.fillStyle = '#7c2a1a';
    roundRect(ctx, btnX, shootY, btnW, btnH, 7); ctx.fill();
    ctx.strokeStyle = '#d9a679'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#f5ecd7'; ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', btnX + btnW / 2, shootY + btnH / 2);
    ctx.restore();
    hud.shoot = { x: btnX, y: shootY, w: btnW, h: btnH };

    // SAFE
    ctx.save();
    ctx.fillStyle = state.intentionalSafety ? '#1a4a1a' : '#2a2a18';
    roundRect(ctx, btnX, safeY2, btnW, btnH, 7); ctx.fill();
    ctx.strokeStyle = state.intentionalSafety ? '#6adc6a' : '#8a8a4a';
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = state.intentionalSafety ? '#6adc6a' : '#c9b98a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(state.intentionalSafety ? '✓ SAFE' : 'SAFETY', btnX + btnW / 2, safeY2 + btnH / 2);
    ctx.restore();
    hud.safe = { x: btnX, y: safeY2, w: btnW, h: btnH };
    const btnY = safeY2;  // reference for spin placement

    // Power slider — right edge
    const pw = 28;
    const ph = Math.min(220, H * 0.4);
    const px = W - pw - 14;
    const py = H - ph - 16;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, px, py, pw, ph, 5);
    ctx.fill();
    const fillH = ph * (state.power || 0);
    const pg = ctx.createLinearGradient(0, py + ph, 0, py);
    pg.addColorStop(0, '#f7c948');
    pg.addColorStop(1, '#c0392b');
    ctx.fillStyle = pg;
    ctx.fillRect(px, py + ph - fillH, pw, fillH);
    ctx.strokeStyle = '#8a6b2e';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('POWER', px + pw / 2, py - 4);
    ctx.restore();
    hud.power = { x: px, y: py, w: pw, h: ph };

    // Shot clock — only in VS mode, only during player's turn
    if (state.mode === 'vs' && state.shotClockStart) {
      const elapsed = performance.now() - state.shotClockStart;
      const remaining = Math.max(0, state.shotClockLimit - elapsed);
      const secs = Math.ceil(remaining / 1000);
      const fraction = remaining / state.shotClockLimit;
      const clockX = btnX + btnW + 14;
      const clockY = btnY;
      const clockW = 52;
      const clockH = btnH;

      // Background
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      roundRect(ctx, clockX, clockY, clockW, clockH, 6);
      ctx.fill();

      // Arc indicator (shrinks as time runs out)
      const cx2 = clockX + clockW / 2;
      const cy2 = clockY + clockH / 2;
      const arcR = 18;
      ctx.strokeStyle = '#2a1206';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx2, cy2, arcR, 0, Math.PI * 2);
      ctx.stroke();
      // Remaining arc — red when < 10s, amber < 20s, green otherwise
      const arcColor = fraction < 0.22 ? '#c0392b' : fraction < 0.44 ? '#f7c948' : '#4ade80';
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx2, cy2, arcR, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
      ctx.stroke();

      // Number
      ctx.fillStyle = fraction < 0.22 ? '#c0392b' : '#f5ecd7';
      ctx.font = 'bold ' + (secs < 10 ? '20' : '16') + 'px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(secs), cx2, cy2 + 1);
      ctx.restore();

      // Trigger foul when clock expires (only player's turn)
      if (remaining <= 0 && !state.shotClockExpired && state.turn === 'player') {
        state.shotClockExpired = true;
        // Auto-take shot with minimal power (just to trigger resolveShot → clock foul path)
        state.power = 0;
        setTimeout(() => {
          if (state && state.shotClockExpired) resolveShot();
        }, 200);
      }
    }

    // Spin ball — to the right of the shoot/safe stack, vertically centered between them
    const sr = 26;
    const scx = btnX + btnW + 18 + sr;
    const scy = shootY + btnH + 3;  // vertically between the two buttons
    if (scx + sr < px - 8) {
      ctx.save();
      ctx.fillStyle = '#f8f1dc';
      ctx.beginPath();
      ctx.arc(scx, scy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a1f10';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // Spin dot
      const dotX = scx + (state.spinX || 0) * (sr - 5);
      const dotY = scy - (state.spinY || 0) * (sr - 5);
      ctx.fillStyle = '#7c2a1a';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9b98a';
      ctx.font = '9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPIN', scx, scy + sr + 12);
      ctx.restore();
      hud.spin = { x: scx - sr, y: scy - sr, w: sr * 2, h: sr * 2, cx: scx, cy: scy, r: sr };
    } else {
      hud.spin = null;
    }
  }

  function drawCallPocketOverlay() {
    // Not used in snooker (no called pocket requirement)
  }

  function drawGameOverOverlay() {
    if (!state || state.gamePhase !== 'gameover') return;
    const W = canvas.width, H = canvas.height;
    const sc = state.scores || { player: 0, alistair: 0 };
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,2,0.88)';
    ctx.fillRect(0, 0, W, H);
    let title;
    if (state.mode === 'vs') {
      title = state.winner === 'player' ? 'YOU WIN THE FRAME' : state.winner === 'alistair' ? 'ALISTAIR WINS' : 'FRAME TIED';
    } else {
      title = 'FRAME COMPLETE';
    }
    ctx.fillStyle = state.winner === 'player' ? '#f7c948' : '#ebdab3';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = 'italic bold 22px Georgia, serif';
    ctx.fillText(title, W / 2, H / 2 - 44);
    // Snooker scores
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText(sc.player + '  –  ' + sc.alistair, W / 2, H / 2 + 10);
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('YOU       ALISTAIR', W / 2, H / 2 + 28);
    if (state.loseReason) {
      ctx.font = 'italic 11px Georgia, serif';
      ctx.fillStyle = '#8a6b2e';
      ctx.fillText(state.loseReason, W / 2, H / 2 + 50);
    }
    ctx.fillStyle = '#f7c948';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('Tap to continue', W / 2, H / 2 + 72);
    ctx.restore();
  }

  // ---------- Screens (mode select, format select, interstitial, match end) ----
  let screenState = 'modeSelect';   // 'modeSelect' | 'formatSelect' | 'game' | 'interstitial' | 'matchEnd'
  const screens = {};

  function drawScreenOverlay() {
    if (screenState === 'modeSelect') drawModeSelect();
    else if (screenState === 'soloHub') drawSoloHub();
    else if (screenState === 'formatSelect') drawFormatSelect();
    else if (screenState === 'interstitial') drawInterstitial();
    else if (screenState === 'matchEnd') drawMatchEnd();
    else if (screenState === 'tutorialMenu') drawTutorialMenu();
    else if (screenState === 'tutorialReader') drawTutorialReader();
    else if (screenState === 'tutorialDrills') drawTutorialDrillMenu();
  }

  function _screenBg() {
    const W = canvas.width, H = canvas.height;
    const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    g.addColorStop(0, '#2a1206');
    g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function _stackButtons(startY, btns) {
    const W = canvas.width, H = canvas.height;
    const cw = Math.min(300, W - 36);
    const cx = W / 2 - cw / 2;
    const bh = 70, gap = 10;
    const total = btns.length * bh + (btns.length - 1) * gap;
    const avail = H - 50 - startY;
    let y = avail > total ? startY + (avail - total) / 2 : startY;
    const out = {};
    for (const b of btns) {
      ctx.fillStyle = b.primary ? '#4a1808' : '#2a1206';
      roundRect(ctx, cx, y, cw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = b.primary ? '#d9a679' : '#8a6b2e';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f5ecd7';
      ctx.font = 'bold 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(b.title, W / 2, y + 28);
      if (b.subtitle) {
        ctx.fillStyle = '#c9b98a';
        ctx.font = 'italic 11px Georgia, serif';
        ctx.fillText(b.subtitle, W / 2, y + 50);
      }
      out[b.key] = { x: cx, y, w: cw, h: bh };
      y += bh + gap;
    }
    return out;
  }

  function drawModeSelect() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 22px Georgia, serif';
    const tY = Math.max(56, H * 0.10);
    ctx.fillText('THE SNOOKER TABLE', W / 2, tY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('The gentleman\'s game. Invented 1875. Still unforgiving.', W / 2, tY + 22);
    screens.mode = _stackButtons(tY + 42, [
      { key: 'solo', title: 'SOLO SNOOKER', subtitle: 'Practice, learn, and drill.', primary: true },
      { key: 'vs',   title: 'CHALLENGE ALISTAIR', subtitle: 'Loser owes a truthful answer.', primary: true },
      { key: 'exit', title: 'LEAVE THE TABLE', subtitle: null, primary: false }
    ]);
  }

  function drawSoloHub() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 22px Georgia, serif';
    const tY = Math.max(56, H * 0.10);
    ctx.fillText('SOLO SNOOKER', W / 2, tY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('Play a frame, or study the game.', W / 2, tY + 22);
    screens.soloHub = _stackButtons(tY + 42, [
      { key: 'play',    title: 'PLAY A FRAME',    subtitle: 'Rack up and practise your break.', primary: true },
      { key: 'tutorial', title: 'TUTORIAL & DRILLS', subtitle: 'Rules, shots, strategy, lingo. Learn everything.', primary: true },
      { key: 'back',    title: '← BACK',          subtitle: null, primary: false }
    ]);
  }

  function drawFormatSelect() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 20px Georgia, serif';
    const tY = Math.max(54, H * 0.10);
    ctx.fillText('CHOOSE YOUR STAKES', W / 2, tY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText("Alistair will remember what you taught him.", W / 2, tY + 22);
    screens.format = _stackButtons(tY + 42, [
      { key: 'bo3', title: 'BEST OF 3', subtitle: 'First to 2. Quick.', primary: true },
      { key: 'bo5', title: 'BEST OF 5', subtitle: 'First to 3. The proper match.', primary: true },
      { key: 'bo7', title: 'BEST OF 7', subtitle: 'First to 4. Test of endurance.', primary: true },
      { key: 'back', title: '← BACK', subtitle: null, primary: false }
    ]);
  }

  function drawInterstitial() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 18px Georgia, serif';
    const tY = Math.max(50, H * 0.08);
    ctx.fillText('BETWEEN FRAMES', W / 2, tY);
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerFrames + '  —  ' + match.alistairFrames, W / 2, tY + 56);
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('YOU         ALISTAIR', W / 2, tY + 76);

    const notesTop = tY + 110;
    ctx.font = 'italic bold 13px Georgia, serif';
    ctx.fillStyle = '#d9a679';
    ctx.fillText("ALISTAIR'S NOTES ON YOU", W / 2, notesTop);
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#e8dcc3';
    ctx.textAlign = 'left';
    const notes = match.interstitialNotes || generateNotes();
    match.interstitialNotes = notes;
    let ny = notesTop + 22;
    for (const n of notes.slice(0, 6)) {
      const lines = wrapText(n, W - 40);
      for (const l of lines) { ctx.fillText(l, 20, ny); ny += 16; }
      ny += 4;
    }

    const cw = Math.min(240, W - 40);
    const ch = 48;
    const cxb = W / 2 - cw / 2;
    const cyb = H - ch - 18;
    ctx.fillStyle = '#4a1808';
    roundRect(ctx, cxb, cyb, cw, ch, 6);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RACK THE NEXT FRAME', W / 2, cyb + ch / 2);
    screens.interstitial = { continue: { x: cxb, y: cyb, w: cw, h: ch } };
  }

  function drawMatchEnd() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    const playerWon = match.playerFrames > match.alistairFrames;
    ctx.fillStyle = playerWon ? '#f7c948' : '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 24px Georgia, serif';
    const tY = Math.max(60, H * 0.10);
    ctx.fillText(playerWon ? 'YOU WIN THE MATCH' : 'ALISTAIR WINS', W / 2, tY);
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerFrames + '  —  ' + match.alistairFrames, W / 2, tY + 54);

    const notesTop = tY + 100;
    ctx.fillStyle = '#d9a679';
    ctx.font = 'italic bold 12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText("ALISTAIR'S READ", 24, notesTop);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = 'italic 12px Georgia, serif';
    let ny = notesTop + 22;
    const notes = generateNotes().slice(0, 4);
    for (const n of notes) {
      const lines = wrapText(n, W - 48);
      for (const l of lines) { ctx.fillText(l, 24, ny); ny += 16; }
      ny += 4;
    }

    const bw = Math.min(150, (W - 56) / 2);
    const bh = 44;
    const gap = 14;
    const bx0 = W / 2 - (bw * 2 + gap) / 2;
    const by = H - bh - 18;
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
    screens.matchEnd = {
      rematch: { x: bx0, y: by, w: bw, h: bh },
      menu:    { x: bx1, y: by, w: bw, h: bh }
    };
  }

  // ---------- Match state, voice zones, dossier ---------------------------
  const STORAGE_KEY = 'nocturne_alistair_dossier_v1';
  let match = null;

  function loadDossier() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return newDossier();
      return Object.assign(newDossier(), JSON.parse(raw));
    } catch (e) { return newDossier(); }
  }

  function saveDossier(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) {}
  }

  function newDossier() {
    return {
      matchesPlayed: 0, matchesWon: 0, matchesLost: 0,
      framesPlayed: 0, framesWon: 0, framesLost: 0,
      shotsAttempted: 0, shotsMade: 0,
      ballsLeftStreak: 0,         // tracks # in groups for missed shots
      breakAttempts: 0, breakBalls: 0,    // balls sunk on break
      cutShots: 0, cutMisses: 0,
      banks: 0, bankMisses: 0,
      scratches: 0,
      tendsToOverhitWeak: 0,       // 0..1 inferred
      eightBallChokes: 0,          // misses on 8 in match-deciding frames
      lifetimeNote: null
    };
  }

  function newMatch(format) {
    const toWin = Math.ceil(format / 2);
    match = {
      format: format,
      toWin: toWin,
      playerFrames: 0,
      alistairFrames: 0,
      composure: 0.85,
      momentum: 0,
      tilt: 0,
      confidence: 0.6,
      dossier: loadDossier(),
      interstitialNotes: null,
      framesLog: []
    };
    match.dossier.matchesPlayed++;
    saveDossier(match.dossier);
  }

  function startNextFrame() {
    match.interstitialNotes = null;
    newGame('vs');
  }

  function voiceZone() {
    if (!match) return 'neutral';
    if (match.tilt > 0.6) return 'tilted';
    if (match.confidence > 0.7) return 'confident';
    if (match.confidence < 0.3) return 'losing';
    return 'tense';
  }

  function sayAdaptive(category) {
    // Pick from category but adjust selection based on voice zone if needed
    say(category);
  }

  // Update psych on shot result. Called after resolveShot.
  function updatePsych(shooter, outcome) {
    if (!match) return;
    if (outcome.wasFoul) {
      if (shooter === 'player') {
        match.momentum = Math.max(-1, match.momentum - 0.2);
        match.confidence = Math.max(0, match.confidence - 0.1);
      } else {
        match.momentum = Math.min(1, match.momentum + 0.2);
        match.composure = Math.min(1, match.composure + 0.05);
      }
    }
    if (outcome.sunkOwn) {
      if (shooter === 'player') {
        match.momentum = Math.min(1, match.momentum + 0.15);
        match.confidence = Math.min(1, match.confidence + 0.08);
        match.tilt = Math.max(0, match.tilt - 0.05);
      } else {
        match.composure = Math.min(1, match.composure + 0.08);
      }
    }
    if (outcome.frameWon) {
      if (shooter === 'player') {
        match.confidence = Math.min(1, match.confidence + 0.2);
        match.composure = Math.min(1, match.composure + 0.1);
      } else {
        match.confidence = Math.max(0, match.confidence - 0.15);
        match.composure = Math.max(0, match.composure - 0.05);
        match.tilt = Math.min(1, match.tilt + 0.15);
      }
    }
  }

  // Update dossier on a shot result
  function updateDossierOnShot(shooter, info) {
    if (!match || shooter !== 'player') return;
    const d = match.dossier;
    d.shotsAttempted++;
    if (info.sunkOwn) d.shotsMade++;
    if (info.wasFoul && info.foulType === 'scratch') d.scratches++;
    if (info.wasBreak) {
      d.breakAttempts++;
      d.breakBalls += info.breakBallsSunk || 0;
    }
    saveDossier(d);
  }

  function generateNotes() {
    if (!match) return [];
    const d = match.dossier;
    const notes = [];

    if (d.shotsAttempted < 6 || match.framesLog.length === 0) {
      notes.push('"I am still observing. Take your time."');
      return notes;
    }

    const accuracy = d.shotsMade / Math.max(1, d.shotsAttempted);
    if (accuracy > 0.6) notes.push('"You make most of your shots. I noticed."');
    else if (accuracy < 0.35) notes.push('"You miss more than you sink. The pattern is clear."');

    if (d.scratches > d.framesPlayed * 0.5 && d.framesPlayed >= 2) {
      notes.push('"You scratch often. The cue ball does not always do what you tell it."');
    }

    if (d.breakAttempts >= 2) {
      const avgBreak = d.breakBalls / d.breakAttempts;
      if (avgBreak >= 1.5) notes.push('"Your break is solid. You start games well."');
      else if (avgBreak < 0.5) notes.push('"Your break is soft. You leave the table cluttered."');
    }

    if (match.tilt > 0.5) {
      notes.push('"You are tilted right now. I can see it in your shot selection."');
    }
    if (match.momentum < -0.3) {
      notes.push('"You have lost your rhythm. It happens. Recover when you are ready."');
    }
    if (match.confidence > 0.75) {
      notes.push('"You are playing well today. I am paying attention."');
    }

    if (d.matchesPlayed >= 3) {
      const winRate = d.matchesWon / d.matchesPlayed;
      if (winRate > 0.6) notes.push('"You have won ' + d.matchesWon + ' of our ' + d.matchesPlayed + ' matches. I am revising my approach."');
      else if (winRate < 0.3) notes.push('"You have lost ' + d.matchesLost + ' of ' + d.matchesPlayed + '. You keep coming back. I respect that."');
    }

    if (notes.length === 0) {
      notes.push('"You are an interesting player to read. I am still learning."');
    }
    return notes;
  }

  // ---------- Frame end → match logic -------------------------------------
  // Hook into the existing endGame so when a frame ends in vs mode we update
  // match state and route to interstitial / match-end.
  // We patch by wrapping endGame.
  // Wire endGame hook (defined in keep block) to handle match progression.
  endGameHook = function(winner, reason) {
    if (!state || state.mode !== 'vs' || !match) return;
    match.dossier.framesPlayed++;
    if (winner === 'player') match.dossier.framesWon++;
    else match.dossier.framesLost++;
    saveDossier(match.dossier);

    if (winner === 'player') match.playerFrames++;
    else match.alistairFrames++;

    updatePsych(winner, { frameWon: true });

    if (match.playerFrames >= match.toWin) {
      match.dossier.matchesWon++;
      saveDossier(match.dossier);
      setTimeout(() => { screenState = 'matchEnd'; }, 1500);
      return;
    }
    if (match.alistairFrames >= match.toWin) {
      match.dossier.matchesLost++;
      saveDossier(match.dossier);
      setTimeout(() => { screenState = 'matchEnd'; }, 1500);
      return;
    }
    setTimeout(() => { screenState = 'interstitial'; }, 1500);
  };

  // ---------- Input -------------------------------------------------------
  let powerDragging = false, spinDragging = false;
  let pullingBack = false;
  let draggingHandle = false;

  // ---------- Lag for break -----------------------------------------------
  // Both players simultaneously shoot their cue ball from head string to far rail
  // and back. Closest to near rail (without touching it) wins the break.
  const LAG_HEAD_X = PLAY_X0 + PLAY_W * 0.75;  // where lag balls start (near player)
  const lagState = {
    active: false,
    playerBall:  null,  // { x, y, vx, vy, stopped, finalDist }
    alistairBall: null,
    playerPower: 0.6,
    playerShot: false,
    alistairShot: false,
    winner: null,        // 'player' | 'alistair'
    phase: 'aim',        // 'aim' | 'slide' | 'result'
    resultTimer: 0
  };
  let pullStartCueX = 0, pullStartCueY = 0;
  const PULL_GRAB_RADIUS = 70;
  const PULL_MIN_FIRE = 25;
  const PULL_MAX = 220;

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
    _initAudio();
    _resumeAudio();
    const p = getEventPoint(e);

    // Lag for break input
    if (lagState.active) {
      if (lagState.phase === 'result') { finishLag(); return; }
      if (lagState.phase === 'aim') {
        if (lagState._shootBtn && hitRect(p.x, p.y, lagState._shootBtn)) {
          shootLag(); return;
        }
        if (lagState._powerBar && hitRect(p.x, p.y, lagState._powerBar)) {
          const pb = lagState._powerBar;
          lagState.playerPower = Math.max(0, Math.min(1, (pb.y + pb.h - p.y) / pb.h));
          return;
        }
      }
      return;
    }

    // Screen routing
    if (screenState === 'modeSelect') {
      const r = screens.mode || {};
      if (hitRect(p.x, p.y, r.solo)) { screenState = 'soloHub'; return; }
      if (hitRect(p.x, p.y, r.vs))   { screenState = 'formatSelect'; return; }
      if (hitRect(p.x, p.y, r.exit)) { closeBilliards(); return; }
      return;
    }
    if (screenState === 'soloHub') {
      const r = screens.soloHub || {};
      if (hitRect(p.x, p.y, r.play))     { newGame('solo'); screenState = 'game'; return; }
      if (hitRect(p.x, p.y, r.tutorial)) { screenState = 'tutorialMenu'; return; }
      if (hitRect(p.x, p.y, r.back))     { screenState = 'modeSelect'; return; }
      return;
    }
    if (screenState === 'tutorialMenu') {
      const r = screens.tutorial || {};
      if (hitRect(p.x, p.y, r.quickStart)) {
        tutorial.section = 'quickStart'; tutorial.page = 0;
        screenState = 'tutorialReader';
        return;
      }
      if (hitRect(p.x, p.y, r.manual)) {
        tutorial.section = 'shots'; tutorial.page = 0;
        screenState = 'tutorialReader';
        return;
      }
      if (hitRect(p.x, p.y, r.drills)) { screenState = 'tutorialDrills'; return; }
      if (hitRect(p.x, p.y, r.back))   { screenState = 'modeSelect'; return; }
      return;
    }
    if (screenState === 'tutorialReader') {
      if (hitRect(p.x, p.y, screens.readerPrev)) {
        if (tutorial.page > 0) tutorial.page--;
        else {
          // Go to previous section's last page
          const i = tutorial.sectionList.indexOf(tutorial.section);
          if (i > 0) {
            tutorial.section = tutorial.sectionList[i - 1];
            tutorial.page = TUTORIAL_PAGES[tutorial.section].length - 1;
          }
        }
        return;
      }
      if (hitRect(p.x, p.y, screens.readerNext)) {
        const sectionPages = TUTORIAL_PAGES[tutorial.section];
        if (tutorial.page < sectionPages.length - 1) tutorial.page++;
        else {
          // Advance to next section
          const i = tutorial.sectionList.indexOf(tutorial.section);
          if (i < tutorial.sectionList.length - 1) {
            tutorial.section = tutorial.sectionList[i + 1];
            tutorial.page = 0;
          }
        }
        return;
      }
      if (hitRect(p.x, p.y, screens.readerMenu)) {
        screenState = 'tutorialMenu';
        return;
      }
      return;
    }
    if (screenState === 'tutorialDrills') {
      const r = screens.drills || {};
      for (const key of Object.keys(DRILLS)) {
        if (hitRect(p.x, p.y, r[key])) {
          startDrill(key);
          return;
        }
      }
      if (hitRect(p.x, p.y, r.back)) { screenState = 'tutorialMenu'; return; }
      return;
    }
    if (screenState === 'drill' && state) {
      // If drill result is showing, tap retries
      if (state.drillResult) {
        startDrill(state.drillKey);
        return;
      }
      // EXIT DRILL button
      if (hud.exitDrill && hitRect(p.x, p.y, hud.exitDrill)) {
        state = null;
        screenState = 'tutorialDrills';
        return;
      }
      // Otherwise fall through to normal game input below
    }
    if (screenState === 'formatSelect') {
      const r = screens.format || {};
      if (hitRect(p.x, p.y, r.bo3)) { newMatch(3); screenState = 'game'; startLag(); return; }
      if (hitRect(p.x, p.y, r.bo5)) { newMatch(5); screenState = 'game'; startLag(); return; }
      if (hitRect(p.x, p.y, r.bo7)) { newMatch(7); screenState = 'game'; startLag(); return; }
      if (hitRect(p.x, p.y, r.back)) { screenState = 'modeSelect'; return; }
      return;
    }
    if (screenState === 'interstitial') {
      const r = screens.interstitial || {};
      if (hitRect(p.x, p.y, r.continue)) { startNextFrame(); screenState = 'game'; }
      return;
    }
    if (screenState === 'matchEnd') {
      const r = screens.matchEnd || {};
      if (hitRect(p.x, p.y, r.rematch)) { newMatch(match.format); screenState = 'game'; startLag(); return; }
      if (hitRect(p.x, p.y, r.menu))    { match = null; state = null; screenState = 'modeSelect'; return; }
      return;
    }

    if (!state) return;

    if (state.gamePhase === 'gameover') {
      // Solo mode → just rack again. Vs mode → endGame already handled match transition.
      if (state.mode === 'solo') newGame('solo');
      return;
    }

    if (state.gamePhase !== 'aiming' || state.turn !== 'player') return;

    // Call pocket
    if (state.showCallPocket) {
      const tp = screenToTable(p.x, p.y);
      let nearest = -1, nd = 99999;
      for (let i = 0; i < POCKETS.length; i++) {
        const d = Math.hypot(tp.x - POCKETS[i].x, tp.y - POCKETS[i].y);
        if (d < nd) { nd = d; nearest = i; }
      }
      if (nd < 80) {
        state.calledPocket = nearest;
        state.showCallPocket = false;
        setTimeout(takeShot, 200);
      }
      return;
    }

    // SHOOT button
    if (hitRect(p.x, p.y, hud.shoot)) { takeShot(); return; }

    // SAFE button — toggle safety declaration
    if (hitRect(p.x, p.y, hud.safe)) {
      state.intentionalSafety = !state.intentionalSafety;
      if (state.intentionalSafety && state.mode === 'vs') say('safetyDeclared');
      return;
    }

    // Power slider
    if (hitRect(p.x, p.y, hud.power)) { powerDragging = true; updatePowerFromY(p.y); return; }

    // Spin ball
    if (hud.spin && hitRect(p.x, p.y, hud.spin)) {
      spinDragging = true;
      updateSpin(p.x, p.y, hud.spin.cx, hud.spin.cy);
      return;
    }

    // Ball-in-hand placement
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

    // Pull-back from cue ball?
    const cue = state.balls[0];
    if (cue && cue.inPlay) {
      const tp = screenToTable(p.x, p.y);
      const d = Math.hypot(tp.x - cue.x, tp.y - cue.y);
      if (d < PULL_GRAB_RADIUS) {
        pullingBack = true;
        pullStartCueX = cue.x;
        pullStartCueY = cue.y;
        state.pullBack = 0;
        if (d > 1) {
          state.aimX = cue.x - (tp.x - cue.x) * 5;
          state.aimY = cue.y - (tp.y - cue.y) * 5;
        }
        return;
      }
    }

    // Otherwise: drag the cue handle to rotate aim.
    // Any touch on the table that isn't a cue-ball grab starts handle drag mode.
    // Moving the pointer rotates the cue around the cue ball.
    draggingHandle = true;
  }

  function onPointerMove(e) {
    if (e.cancelable) e.preventDefault();
    const p = getEventPoint(e);
    // Lag power slider
    if (lagState.active && lagState.phase === 'aim' && lagState._powerBar) {
      if (hitRect(p.x, p.y, lagState._powerBar)) {
        const pb = lagState._powerBar;
        lagState.playerPower = Math.max(0, Math.min(1, (pb.y + pb.h - p.y) / pb.h));
        return;
      }
    }
    if (!state) return;
    if (powerDragging) { updatePowerFromY(p.y); return; }
    if (spinDragging && hud.spin) {
      updateSpin(p.x, p.y, hud.spin.cx, hud.spin.cy);
      return;
    }
    if (pullingBack) {
      const tp = screenToTable(p.x, p.y);
      const dx = tp.x - pullStartCueX;
      const dy = tp.y - pullStartCueY;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        const ux = -dx / dist;
        const uy = -dy / dist;
        state.aimX = pullStartCueX + ux * 300;
        state.aimY = pullStartCueY + uy * 300;
      }
      state.pullBack = Math.min(dist, PULL_MAX);
      state.power = Math.min(1, dist / PULL_MAX);
      return;
    }
    if (draggingHandle && state.gamePhase === 'aiming' && state.turn === 'player' && !state.ballInHand && !state.showCallPocket) {
      // Pointer position in table space — cue aims AWAY from pointer (handle drag).
      // Direction: from current pointer → through cue ball → sets aim on the other side.
      const cue = state.balls[0];
      if (cue && cue.inPlay) {
        const tp = screenToTable(p.x, p.y);
        if (tp.x >= 0) {
          const dx = cue.x - tp.x;
          const dy = cue.y - tp.y;
          const d = Math.hypot(dx, dy);
          if (d > 1) {
            // Aim extends from cue ball in the direction AWAY from the handle
            state.aimX = cue.x + (dx / d) * 300;
            state.aimY = cue.y + (dy / d) * 300;
          }
        }
      }
    }
  }

  function onPointerUp() {
    powerDragging = false;
    spinDragging = false;
    draggingHandle = false;
    if (pullingBack) {
      const pulled = state.pullBack || 0;
      pullingBack = false;
      if (pulled >= PULL_MIN_FIRE) {
        animateCueStrike(() => { state.pullBack = 0; takeShot(); });
      } else {
        state.pullBack = 0;
      }
    }
  }

  function animateCueStrike(onComplete) {
    if (!state) { onComplete && onComplete(); return; }
    const start = state.pullBack || 0;
    const t0 = performance.now();
    const dur = 140;
    function frame() {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const eased = t * t * t;
      state.pullBack = start * (1 - eased);
      if (t < 1) requestAnimationFrame(frame);
      else onComplete && onComplete();
    }
    frame();
  }

  function updatePowerFromY(y) {
    if (!hud.power) return;
    const pb = hud.power;
    const t = Math.max(0, Math.min(1, (pb.y + pb.h - y) / pb.h));
    state.power = t;
  }

  function updateSpin(x, y, cx, cy) {
    const dx = x - cx;
    const dy = y - cy;
    const r = (hud.spin && hud.spin.r) || 26;
    const sx = Math.max(-1, Math.min(1, dx / (r - 5)));
    const sy = Math.max(-1, Math.min(1, -dy / (r - 5)));
    state.spinX = sx;
    state.spinY = sy;
  }

  // ---------- Lag for break — logic + rendering ---------------------------
  function startLag() {
    lagState.active = true;
    lagState.phase = 'aim';
    lagState.playerShot = false;
    lagState.alistairShot = false;
    lagState.winner = null;
    lagState.resultTimer = 0;
    lagState.gameMode = 'vs';
    lagState._shootBtn = null;
    lagState._powerBar = null;
    // Reset balls to baulk line (near end, large x)
    lagState.playerBall   = { x: PLAY_X0 + PLAY_W * 0.80, y: PLAY_Y0 + PLAY_H * 0.35, vx: 0, stopped: false, finalDist: null };
    lagState.alistairBall = { x: PLAY_X0 + PLAY_W * 0.80, y: PLAY_Y0 + PLAY_H * 0.65, vx: 0, stopped: false, finalDist: null };
    lagState.playerPower = 0.65;
    // Alistair auto-shoots after 1.2s regardless
    setTimeout(() => {
      if (!lagState.active) return;
      if (!lagState.alistairShot) {
        lagState.alistairBall.vx = -(6 + Math.random() * 8);
        lagState.alistairShot = true;
      }
      if (lagState.playerShot) lagState.phase = 'slide';
    }, 1200);
  }

  function shootLag() {
    if (!lagState.active || lagState.phase !== 'aim' || lagState.playerShot) return;
    // Player shoots — ball travels toward far rail (negative x direction)
    lagState.playerBall.vx = -(6 + lagState.playerPower * 8);
    lagState.playerShot = true;
    // If Alistair already shot, start physics immediately
    if (lagState.alistairShot) {
      lagState.phase = 'slide';
    } else {
      // Alistair shoots immediately after player
      lagState.alistairBall.vx = -(6 + Math.random() * 8);
      lagState.alistairShot = true;
      lagState.phase = 'slide';
    }
  }

  function stepLag() {
    if (!lagState.active || lagState.phase !== 'slide') return;
    // Simple 1D physics for lag balls along the x axis
    // Far rail = PLAY_X0 + BALL_R (low x), near rail = PLAY_X1 - BALL_R (high x)
    const FAR  = PLAY_X0 + BALL_R;
    const NEAR = PLAY_X1 - BALL_R;
    const FRIC = 0.978;   // friction per frame — ball stops in ~3s
    const E    = 0.70;    // cushion restitution

    for (const b of [lagState.playerBall, lagState.alistairBall]) {
      if (b.stopped) continue;
      b.x += b.vx;
      b.vx *= FRIC;
      // Bounce off far rail
      if (b.x < FAR) {
        b.x = FAR;
        b.vx = Math.abs(b.vx) * E;  // now positive — heading back
      }
      // Overshot near rail — disqualified
      if (b.x > NEAR) {
        b.x = NEAR;
        b.stopped = true;
        b.finalDist = 9999;  // over
      }
      // Stopped — any ball slow enough counts, wherever it is
      if (Math.abs(b.vx) < 0.12) {
        b.stopped = true;
        // finalDist = distance from near rail (baulk line where they started)
        // Smaller = closer to near rail = better lag
        // If ball is past baulk (overshot on return), disqualify
        if (b.x > NEAR) {
          b.finalDist = 9999;
        } else {
          b.finalDist = NEAR - b.x;
        }
      }
    }

    // Both stopped — pick winner
    if (lagState.playerBall.stopped && lagState.alistairBall.stopped) {
      const pd = lagState.playerBall.finalDist;
      const ad = lagState.alistairBall.finalDist;
      // Lower finalDist = closer to near rail = wins
      if (pd === 9999 && ad === 9999) lagState.winner = Math.random() < 0.5 ? 'player' : 'alistair';
      else if (pd === 9999) lagState.winner = 'alistair';
      else if (ad === 9999) lagState.winner = 'player';
      else lagState.winner = pd < ad ? 'player' : 'alistair';
      lagState.phase = 'result';
      lagState.resultTimer = 200;
    }
  }

  function drawLag() {
    if (!lagState.active) return;
    const W = canvas.width, H = canvas.height;
    computeView();
    // Background + table
    const bg = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    bg.addColorStop(0, '#1a0e07'); bg.addColorStop(1, '#050201');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawTable();

    // Head string line (baulk line where balls start)
    const baulkX = PLAY_X0 + PLAY_W * 0.80;
    const hsA = tableToScreen(baulkX, PLAY_Y0);
    const hsB = tableToScreen(baulkX, PLAY_Y1);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,220,100,0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(hsA.x, hsA.y); ctx.lineTo(hsB.x, hsB.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c9b98a'; ctx.font = '9px Georgia, serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('BAULK LINE', hsA.x - 4, hsA.y + 2);
    ctx.restore();

    // Draw both lag balls
    for (const [ball, label, col] of [
      [lagState.playerBall,  'YOU',      '#f5f0e8'],
      [lagState.alistairBall,'ALISTAIR', '#222222']
    ]) {
      const s = tableToScreen(ball.x, ball.y);
      const u = unitScaleAt(ball.x, ball.y);
      const r = BALL_R * BALL_VISUAL_MULT * u;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath(); ctx.arc(s.x + 1.5, s.y + 2.5, r, 0, Math.PI*2); ctx.fill();
      // Ball gradient
      const g = ctx.createRadialGradient(s.x - r*0.35, s.y - r*0.4, r*0.08, s.x, s.y, r);
      if (col === '#f5f0e8') {
        g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c0b090');
      } else {
        g.addColorStop(0, '#555'); g.addColorStop(1, '#000');
      }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
      // Label
      ctx.fillStyle = '#e8dcc3'; ctx.font = '10px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(label, s.x, s.y + r + 13);
      // Distance if stopped
      if (ball.stopped && ball.finalDist !== null) {
        ctx.fillStyle = '#f7c948'; ctx.font = 'bold 10px Georgia, serif';
        ctx.fillText(ball.finalDist >= 9999 ? 'OVER' : Math.round(ball.finalDist) + 'u', s.x, s.y + r + 25);
      }
    }

    // Top bar
    ctx.fillStyle = 'rgba(20,12,8,0.9)'; ctx.fillRect(0, 0, W, 32);
    ctx.fillStyle = '#f5ecd7'; ctx.font = 'italic bold 14px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('LAG FOR BREAK', W/2, 16);

    if (lagState.phase === 'aim') {
      // Instructions
      ctx.fillStyle = '#c9b98a'; ctx.font = 'italic 11px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Closest to the baulk line wins. Both balls travel to the far cushion and back.', W/2, H - 14);

      // Power slider
      const pw = 32, ph = Math.min(180, H * 0.33);
      const px = W - pw - 14, py = H - ph - 70;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, px, py, pw, ph, 5); ctx.fill();
      const fh = ph * lagState.playerPower;
      const pg = ctx.createLinearGradient(0, py + ph, 0, py);
      pg.addColorStop(0, '#f7c948'); pg.addColorStop(1, '#c0392b');
      ctx.fillStyle = pg; ctx.fillRect(px + 2, py + ph - fh, pw - 4, fh);
      ctx.strokeStyle = '#8a6b2e'; ctx.lineWidth = 1; ctx.strokeRect(px, py, pw, ph);
      ctx.fillStyle = '#c9b98a'; ctx.font = '9px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('POWER', px + pw/2, py - 4);
      lagState._powerBar = { x: px, y: py, w: pw, h: ph };

      // LAG button
      const bw = Math.min(150, W * 0.36), bh = 52;
      const bx = 14, by = H - bh - 14;
      ctx.fillStyle = lagState.playerShot ? '#2a2a18' : '#7c2a1a';
      roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
      ctx.strokeStyle = '#d9a679'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = lagState.playerShot ? '#888' : '#f5ecd7';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lagState.playerShot ? 'SHOT' : 'LAG!', bx + bw/2, by + bh/2);
      lagState._shootBtn = { x: bx, y: by, w: bw, h: bh };
    }

    if (lagState.phase === 'result') {
      const won = lagState.winner === 'player';
      ctx.fillStyle = 'rgba(10,5,2,0.85)';
      ctx.fillRect(0, H/2 - 76, W, 152);
      ctx.fillStyle = won ? '#f7c948' : '#ebdab3';
      ctx.font = 'italic bold 22px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(won ? 'YOU WIN THE LAG' : 'ALISTAIR WINS', W/2, H/2 - 28);
      ctx.fillStyle = '#c9b98a'; ctx.font = '14px Georgia, serif';
      ctx.fillText(won ? 'You break first.' : 'Alistair breaks.', W/2, H/2 + 8);
      ctx.fillStyle = '#8a6b2e'; ctx.font = 'italic 11px Georgia, serif';
      ctx.fillText('Tap anywhere to continue', W/2, H/2 + 44);
      lagState.resultTimer--;
      if (lagState.resultTimer <= 0 && lagState.active) finishLag();
    }
  }

  function finishLag() {
    if (!lagState.active) return;
    lagState.active = false;
    const playerBreaks = lagState.winner === 'player';
    state = null;
    newGame('vs');
    screenState = 'game';
    if (!playerBreaks) {
      state.turn = 'alistair';
      state._alistairScheduled = false;
      setTimeout(() => {
        if (state && state.turn === 'alistair' && state.gamePhase === 'aiming') alistairMove();
      }, 1200);
    }
  }



  // ============================================================================
  // TUTORIAL & DRILLS
  // ============================================================================

  // ---------- Reference manual content ------------------------------------
  // Pages organized by section. Each page = title + body paragraphs.
  // Bodies use \n for paragraph breaks, ¶ for bullet items.
  const TUTORIAL_PAGES = {

    quickStart: [
      { title: 'WHAT IS SNOOKER?', body:
        "Snooker was invented in 1875 by British Army officers stationed in Jabalpur, India. " +
        "By the 1880s it had spread to gentlemen's clubs across England. It remains the definitive " +
        "Victorian billiard game — and the one played in establishments like this.\n\n" +
        "The name came from military slang for an inexperienced officer. When a veteran missed an easy " +
        "shot, his colleague called him a snooker. The game stuck. The name stuck with it.\n\n" +
        "You play on a table with six pockets, a white cue ball, 15 red balls, and 6 coloured balls. " +
        "Points are scored by potting balls in the correct sequence. The player with the highest score " +
        "when all balls are cleared wins the frame."
      },
      { title: 'THE BALLS & THEIR VALUES', body:
        "There are 22 balls in play.\n\n" +
        "REDS (×15): 1 point each. Plain crimson. Potted alternately with colours.\n\n" +
        "THE COLOURS — each has a designated spot on the table:\n" +
        "¶ Yellow (Y) — 2 points — baulk line, right\n" +
        "¶ Green (G) — 3 points — baulk line, left\n" +
        "¶ Brown (Br) — 4 points — baulk line, centre\n" +
        "¶ Blue (B) — 5 points — centre of table\n" +
        "¶ Pink (P) — 6 points — just below the red triangle\n" +
        "¶ Black (Bk) — 7 points — top of the table\n\n" +
        "Maximum single break: 147 (pot every red with black, then all colours in sequence)."
      },
      { title: 'THE SEQUENCE OF PLAY', body:
        "REDS PHASE: you must alternate potting reds and colours.\n\n" +
        "¶ Pot a red (1pt) → now pot any colour of your choice\n" +
        "¶ Pot a colour → the colour is re-spotted. Now pot another red.\n" +
        "¶ Continue until all 15 reds are cleared.\n\n" +
        "COLOURS PHASE: once all reds are gone, pot the colours in ascending value order:\n" +
        "Yellow → Green → Brown → Blue → Pink → Black\n\n" +
        "In the colours phase, colours are NOT re-spotted after potting. They stay down.\n\n" +
        "WINNING: highest score when the black is finally potted wins the frame."
      },
      { title: 'FOULS & PENALTIES', body:
        "A foul ends your turn and awards points to your opponent. Minimum foul value: 4 points. " +
        "The penalty is always the higher of 4 or the value of the ball-on (or ball struck).\n\n" +
        "FOULS include:\n" +
        "¶ Potting the cue ball (scratch) — opponent gets cue ball in hand in the D\n" +
        "¶ Hitting the wrong ball first\n" +
        "¶ Failing to hit any ball\n" +
        "¶ No ball reaching a cushion after contact (and none potted)\n" +
        "¶ Potting a colour when red is the ball-on\n" +
        "¶ Potting the wrong colour in the colours phase\n\n" +
        "THREE CONSECUTIVE FOULS: loss of frame. You are warned after the second."
      },
      { title: 'CONTROLS', body:
        "AIM: drag the cue handle anywhere on the table to rotate the cue around the cue ball.\n\n" +
        "PULL-BACK: press near the cue ball and drag away to load power. Release to fire.\n\n" +
        "POWER: the slider on the right edge controls shot force.\n\n" +
        "SPIN: the white ball at the bottom shows where the cue tip will strike.\n" +
        "¶ Dot UP = top spin (follow) — cue ball continues forward\n" +
        "¶ Dot DOWN = back spin (draw/screw) — cue ball comes back\n" +
        "¶ Dot LEFT/RIGHT = side spin (english) — curves cue ball off cushions\n\n" +
        "SHOOT button fires the shot. SAFETY button declares an intentional safety before shooting."
      }
    ],

    shots: [
      { title: 'THE PLAIN BALL STROKE', body:
        "Striking the cue ball dead centre — no spin of any kind.\n\n" +
        "On a straight shot, the cue ball transfers nearly all its energy to the object ball and " +
        "stops at the contact point (the stun, or stop shot).\n\n" +
        "On a cut shot (hitting the object ball at an angle), the cue ball deflects at 90° from " +
        "the line joining the two ball centres at contact. This is the fundamental angle of snooker " +
        "geometry that all position play is built on.\n\n" +
        "Spin dial: centred. This is the foundation. Master plain ball before applying spin."
      },
      { title: 'TOP SPIN (FOLLOW)', body:
        "Strike the cue ball ABOVE centre. The cue ball is spinning forward before it contacts " +
        "the object ball.\n\n" +
        "After contact, the cue ball continues rolling forward — following the object ball. How far " +
        "it travels depends on how much top spin was applied and at what speed.\n\n" +
        "Use for: getting position on the next red or colour by running the cue ball through the " +
        "pack, or following to a pocket for an in-off.\n\n" +
        "Spin dial: UP. The further up, the more follow."
      },
      { title: 'SCREW (DRAW / BACK SPIN)', body:
        "Strike the cue ball BELOW centre. One of the most important shots in snooker.\n\n" +
        "After striking the object ball, the cue ball reverses direction — screwing back toward you. " +
        "Distance of the screw depends on the amount of back spin and the pace of the shot.\n\n" +
        "The screw shot is essential for getting position when the natural angle would leave you " +
        "out of position.\n\n" +
        "Common use: red near the top cushion — screw back to the baulk colours.\n\n" +
        "Spin dial: DOWN. Firm stroke required — soft shots lose spin before contact."
      },
      { title: 'SIDE (ENGLISH)', body:
        "Strike the cue ball left or right of centre. Primarily used to alter the angle of " +
        "rebound off cushions, not to make balls deviate on their path to the object ball.\n\n" +
        "Running side (same direction as cue ball travel): opens the angle off the cushion.\n" +
        "Check side (opposite direction): closes the angle.\n\n" +
        "Side also causes THROW at the object ball — a slight deflection of the object ball's " +
        "path due to friction at contact. Advanced players compensate for this.\n\n" +
        "Use sparingly. Side is a precision tool, not a default. It complicates the shot."
      },
      { title: 'THE STUN SHOT', body:
        "A perfectly central strike on a straight shot sends the cue ball dead at contact. " +
        "The cue ball has zero angular velocity — it is sliding, not rolling. At the moment of " +
        "contact, it stops exactly where the object ball was.\n\n" +
        "This is called a stun, or stop shot. It is perhaps the most useful shot in snooker " +
        "for controlling position because it keeps the cue ball close to the contact area.\n\n" +
        "Slight stun (fractional back spin): the cue ball comes back a short distance. " +
        "Used when position requires the cue ball to drift behind the contact point.\n\n" +
        "Spin dial: centred or very slightly below. Precise."
      },
      { title: 'THE STUN RUN-THROUGH', body:
        "A shot where slight top spin is applied on a cut shot, causing the cue ball to " +
        "run through the natural 90° angle and continue slightly forward.\n\n" +
        "Essential for position play. The plain ball 90° angle rarely leaves you on the " +
        "next ball. The stun run-through lets you adjust that angle by a few degrees in either " +
        "direction.\n\n" +
        "The key is pace. Same spin amount at different speeds produces different run-through " +
        "distances. Speed control is what separates a good snooker player from a great one."
      },
      { title: 'THE LONG POT', body:
        "Potting a ball from long range — across the full length of the table.\n\n" +
        "The technical challenge: small errors in aim are magnified by distance. A 1° error at " +
        "3 feet is 1 inch at 12 feet.\n\n" +
        "Technique: slow stroke, follow through completely, head still. Plain ball or slight " +
        "top spin to maintain contact. Avoid side spin on long pots.\n\n" +
        "Position after: the cue ball typically ends up deep in the table — plan which ball " +
        "you need to be on next before committing to the long pot."
      },
      { title: 'CUSHION PLAY', body:
        "Sending the cue ball off one or more cushions to reach the object ball (a kick), " +
        "or sending an object ball off a cushion to reach a pocket (a plant off the cushion).\n\n" +
        "Mirror principle: the angle of incidence equals the angle of reflection. To predict " +
        "where a ball will go after hitting a cushion, reflect its path across the cushion line.\n\n" +
        "Side spin modifies this. Running side opens the angle. Check side closes it. " +
        "Tournament players calculate cushion angles with side routinely.\n\n" +
        "At high speed, rubber compression narrows the rebound angle slightly."
      },
      { title: 'THE SNOOKER', body:
        "Leaving the cue ball in a position where the opponent has no direct line to the ball-on — " +
        "hidden behind one of the other colours.\n\n" +
        "A well-played snooker forces the opponent to play a kick (off one or more cushions) to " +
        "reach the ball-on. If they miss, you receive penalty points. If they play safe, they may " +
        "re-snooker you — a prolonged safety battle is called a snooker war.\n\n" +
        "The best snookers hide the cue ball completely behind a ball of higher value than " +
        "the ball-on, maximising the foul penalty."
      },
      { title: 'THE PLANT', body:
        "Striking ball A so it hits and pockets ball B.\n\n" +
        "Frozen plant (balls touching): the line through the two touching balls determines " +
        "exactly where ball B will go. If that line points at a pocket — take it.\n\n" +
        "Gap plant: the gap between the balls must be calculated. The smaller the gap, the more " +
        "predictable the outcome. Large gaps require skill and experience to read correctly.\n\n" +
        "Plants are only legal when ball A is the ball-on or a red (when red is the ball-on)."
      }
    ],

    strategy: [
      { title: 'THE ART OF BREAKS', body:
        "A break is a sequence of consecutive pots in a single visit.\n\n" +
        "Building a break requires three things in equal measure: potting ability, positional " +
        "play, and reading the table three shots ahead.\n\n" +
        "Beginners focus on the next pot. Intermediate players plan two shots. Professionals " +
        "plan the route to clear the table before they play the first ball.\n\n" +
        "The key question before every shot: where will the cue ball be, and what ball will I " +
        "be on next?"
      },
      { title: 'WORKING THE ANGLES', body:
        "Every shot has a natural angle — the path the cue ball takes after potting the object " +
        "ball with plain ball (no spin).\n\n" +
        "The cue ball deflects at 90° from the line of centres at contact. This is fixed physics. " +
        "Your job is to use spin and pace to adjust that angle into your planned position.\n\n" +
        "¶ Top spin: angles forward past 90°\n" +
        "¶ Back spin: angles back before 90°\n" +
        "¶ Stun: stays at contact point (straight shot) or deflects at 90° (cut shot)\n" +
        "¶ Side spin: modifies cushion rebound for position via the cushion"
      },
      { title: 'COLOUR SELECTION', body:
        "After potting a red, you may pot any colour. This decision defines your break.\n\n" +
        "Always pot the black (7) if you have the angle. The difference between a 50-break and " +
        "a 100-break is often just consistently choosing black over pink.\n\n" +
        "But position matters more than value. A pink you can pot with perfect position on the " +
        "next red is worth more than a black that leaves you nowhere.\n\n" +
        "Rule of thumb: choose the colour that leaves you on a red that leaves you on another " +
        "colour. Think three balls ahead, not one."
      },
      { title: 'RED SELECTION', body:
        "With 15 reds on the table, which red you choose defines your break.\n\n" +
        "¶ Choose reds that are accessible — not frozen against cushions or other balls\n" +
        "¶ Choose reds whose potting leaves the cue ball near the colours\n" +
        "¶ Clear tight clusters early when you have a long break going\n" +
        "¶ Leave easy reds in safe positions for recovery shots\n\n" +
        "The last few reds are the most important. If you can leave yourself on the black " +
        "after the final red, you are in a strong position to clear the colours."
      },
      { title: 'SAFETY PLAY', body:
        "When no pot is available or the risk is too high, play safe.\n\n" +
        "A good safety leaves the cue ball behind a colour, with the ball-on hidden or " +
        "difficult to reach without cannoning off other balls.\n\n" +
        "Use the SAFETY button to declare before shooting. In WPBSA rules, a safety does not " +
        "legally require declaration — the referee judges intent. The declaration here is a " +
        "courtesy that affects how Alistair responds.\n\n" +
        "The four standard safeties:\n" +
        "¶ Send the ball-on to the cushion and leave the cue ball tight to another ball\n" +
        "¶ Play the cue ball to the baulk cushion, leaving nothing on\n" +
        "¶ Tuck the cue ball behind a colour\n" +
        "¶ Send the red down to the baulk area while leaving the cue in the reds"
      },
      { title: 'SNOOKERING', body:
        "Deliberately leaving the cue ball so the opponent cannot directly hit the ball-on.\n\n" +
        "Best situations to attempt a snooker:\n" +
        "¶ When you're behind on the scoreboard — penalty points are free scoring\n" +
        "¶ When you need a specific number of snookers to win\n" +
        "¶ When the table layout naturally invites a snooker\n\n" +
        "Count the snookers needed: if you need 43 points and only 35 remain on the table, " +
        "you need at least one snooker worth 4+ points plus all remaining balls."
      },
      { title: 'THE COLOURS PHASE', body:
        "Clearing the colours in sequence (yellow through black) is where frames are often won " +
        "and lost. The positions are fixed and known in advance — each colour goes to a specific " +
        "pocket that you choose, but the cue ball must travel predictable routes between them.\n\n" +
        "Key: coming off the green (3pts) onto the brown (4), then the brown onto the blue. " +
        "The blue-to-pink and pink-to-black angles are the most practised positions in the game.\n\n" +
        "Tournament players have these three positions memorised. The rest of the frame is " +
        "improvisation. The colours clearance is choreography."
      },
      { title: 'READING THE SCORE', body:
        "Always know the scoreboard. It changes everything.\n\n" +
        "If you're 40 ahead with 27 points left, take risks — your opponent needs snookers.\n" +
        "If you're 20 behind with 35 on the table, you need to build — stop taking low percentage pots.\n\n" +
        "Count what's left: reds × 8 (one red plus black for each) plus all six colours. " +
        "This gives the maximum available points. If you need more than that number, you need " +
        "snookers — calculate how many."
      }
    ],

    lingo: [
      { title: 'POTTING TERMS', body:
        "BALL-ON: the ball the player must legally contact first.\n\n" +
        "BREAK: a sequence of consecutive pots in one visit.\n\n" +
        "CANNON: the cue ball striking two object balls.\n\n" +
        "CLEARANCE: potting all remaining balls in one visit.\n\n" +
        "COLOUR: any of the six non-red balls (yellow through black).\n\n" +
        "FRAME: a single game of snooker from break to final black.\n\n" +
        "IN-OFF: potting the cue ball into a pocket (a foul).\n\n" +
        "PLANT: using one object ball to knock another into a pocket.\n\n" +
        "POT: legally sending an object ball into a pocket."
      },
      { title: 'SPIN TERMS', body:
        "BACK SPIN: striking below centre, causing the cue ball to reverse after contact. Also called screw or draw.\n\n" +
        "CHECK SIDE: side spin in the opposite direction to the cue ball's path, closing the cushion angle.\n\n" +
        "ENGLISH: side spin (sidespin). Alters cushion angles.\n\n" +
        "FOLLOW: top spin — cue ball continues forward after contact.\n\n" +
        "RUNNING SIDE: side spin in the same direction as travel, opening the cushion angle.\n\n" +
        "SCREW: back spin. The cue ball reverses after contact.\n\n" +
        "SIDE: spin around the vertical axis (left or right of centre).\n\n" +
        "STUN: the cue ball stops dead at contact. Also: stun run-through, stun screw."
      },
      { title: 'SAFETY & POSITIONAL TERMS', body:
        "BAULK: the end of the table near the D, where the cue ball is placed after a foul.\n\n" +
        "D (THE D): the semi-circle at the baulk end. Cue ball placed inside after a foul.\n\n" +
        "KICK: a shot where the cue ball bounces off one or more cushions to reach the ball-on. Used when snookered.\n\n" +
        "SAFETY: a shot where the player does not intend to pot a ball, playing to leave a difficult position.\n\n" +
        "SNOOKER: a position where the cue ball is hidden behind another ball, making direct contact with the ball-on impossible.\n\n" +
        "SNOOKERED: unable to hit the ball-on directly.\n\n" +
        "SPOT: the designated position for each colour ball on the table."
      },
      { title: 'SCORING TERMS', body:
        "CENTURY: a break of 100 or more points. Career-defining in club play.\n\n" +
        "CLEARANCE: potting all balls from a given point in one visit.\n\n" +
        "COLOURS CLEARANCE: potting all six colours in sequence without missing.\n\n" +
        "FOUL: an illegal shot. Awards points (minimum 4) to the opponent.\n\n" +
        "FREE BALL: after a foul, if the opponent is snookered on all reds, they may nominate any ball as a free ball.\n\n" +
        "MAXIMUM BREAK: 147 — potting all 15 reds each with the black, then all six colours. Rarely achieved.\n\n" +
        "PENALTY: points awarded to the opponent after a foul. Minimum 4."
      },
      { title: 'POSITIONAL LINGO', body:
        "ANGLE (THE ANGLE): the degree of cut on a shot. 'Needing an angle' means wanting the cue ball to deflect, not go straight.\n\n" +
        "DEAD BALL: a plant where the line through the two balls goes exactly to the pocket.\n\n" +
        "DEEP SCREW: extreme back spin, used for maximum reverse distance.\n\n" +
        "GETTING POSITION: leaving the cue ball in a good position for the next shot.\n\n" +
        "NATURAL ANGLE: the cue ball path after a plain-ball shot — no spin adjustment.\n\n" +
        "PACE: the speed of the shot. Pace control is critical — same spin at different paces produces very different positions.\n\n" +
        "THIN: striking the object ball on its very edge. Low transfer of energy, unpredictable position."
      }
    ],

    rulebook: [
      { title: 'WORLD SNOOKER — OVERVIEW', body:
        "The rules of snooker are governed by the World Professional Billiards and Snooker " +
        "Association (WPBSA) and the Billiards and Snooker Control Council (BSCC), established " +
        "in England in 1919.\n\n" +
        "Tournament snooker is played as a best-of-frames match. The World Snooker Championship " +
        "final is best of 35 frames. First-round matches are typically best of 11 or 19.\n\n" +
        "This table implements the principal WPBSA rules as applicable to single-frame play."
      },
      { title: 'THE BREAK', body:
        "The opening player strikes the cue ball from within the D (baulk semi-circle) at the " +
        "15 reds.\n\n" +
        "LEGAL BREAK: the cue ball must contact at least one red, and either a ball must be potted " +
        "or the cue ball or a red must reach a cushion after contact.\n\n" +
        "If the break is illegal: the opponent may accept the table as left, or ask the original " +
        "player to break again.\n\n" +
        "The break is decided by a lag (closest to baulk cushion without touching it wins choice). " +
        "Some events flip a coin. The winner may break or concede the break."
      },
      { title: 'BALL-ON & SEQUENCE', body:
        "The ball-on is the ball or balls the player must legally contact first.\n\n" +
        "WHEN RED IS BALL-ON: any red may be struck first. A colour potted alongside a red legally " +
        "scores its value but is re-spotted. After potting at least one red, the ball-on becomes " +
        "any colour.\n\n" +
        "WHEN A COLOUR IS BALL-ON: the player must contact that colour first and may only pot that " +
        "colour legally. If they pot it, the colour is re-spotted and the ball-on reverts to red.\n\n" +
        "COLOURS PHASE: after the last red is potted (with its colour), the ball-on becomes yellow, " +
        "then green, brown, blue, pink, and black in sequence. Colours are NOT re-spotted."
      },
      { title: 'FOULS & VALUES', body:
        "FOUL VALUES — the penalty is the higher of 4 points or the value of:\n" +
        "¶ The ball-on\n" +
        "¶ The ball first struck\n" +
        "¶ The ball potted (if pocketed illegally)\n\n" +
        "So hitting black (7) when on red = 7 point foul (not 4).\n\n" +
        "SPECIFIC FOULS:\n" +
        "¶ In-off (cue ball potted): minimum 4, or value of ball-on\n" +
        "¶ Hit wrong ball first: value of ball wrongly hit or ball-on, whichever higher\n" +
        "¶ No contact: minimum 4\n" +
        "¶ Ball off table: value of that ball (minimum 4)\n" +
        "¶ No ball reaching cushion after last contact: minimum 4\n" +
        "¶ Two shots with one stroke (push shot): minimum 4"
      },
      { title: 'FREE BALL', body:
        "After a foul, if the cue ball is so positioned that the player is snookered on ALL " +
        "remaining reds (or ball-on if in colours phase), the referee calls a FREE BALL.\n\n" +
        "The incoming player nominates any ball as a substitute for the ball-on. That nominated " +
        "ball scores the value of the ball-on if potted, and the player continues their turn.\n\n" +
        "The nominated ball is treated as the ball-on in all respects for that shot only.\n\n" +
        "If a red is the ball-on and the free ball (a colour) is potted, it counts as 1 red " +
        "and is re-spotted. The ball-on then becomes any colour, as normal. The player must " +
        "then pot a colour to continue their break — the sequence resumes as usual after the free ball."
      },
      { title: 'THE MISS RULE', body:
        "If a player fails to hit the ball-on and the referee decides they did not make a " +
        "genuine attempt to do so, a MISS is called.\n\n" +
        "In addition to the foul penalty, the opponent may request that the balls be replaced to " +
        "their original positions and the offending player must play the shot again.\n\n" +
        "The miss rule was introduced to prevent deliberate foul play as a safety tactic. It is " +
        "strictly enforced in professional play.\n\n" +
        "Note: the three-consecutive-fouls rule (loss of frame) is a separate rule from the " +
        "miss rule, and applies across the whole frame, not just a single position."
      },
      { title: 'THE SHOT CLOCK', body:
        "Professional snooker uses a shot clock in select WST events — 60 seconds per shot. " +
        "Major championships (the Crucible, Masters, UK Championship) do not use a shot clock.\n\n" +
        "This table uses 45 seconds per shot — a league format standard used in English club " +
        "snooker. It creates genuine pressure without being punitive.\n\n" +
        "Clock expiry is a foul: 4 penalty points minimum, opponent receives ball-in-hand in the D."
      },
      { title: 'EQUIPMENT STANDARDS', body:
        "TABLE: 12 feet x 6 feet (full-size WPBSA standard). The playing surface is 11ft 8.5in x 5ft 10in.\n\n" +
        "BALLS: phenolic resin, 52.5mm diameter (2-1/16 inch), 141-147g. Historically: composition balls, " +
        "then celluloid (introduced 1920s), then phenolic resin.\n\n" +
        "CLOTH: Hainsworth Smart or Strachan 6811 (tournament standard). Nap runs from baulk end " +
        "to top cushion — affects the roll of the ball.\n\n" +
        "CUE: typically 57–58 inches, 16–21oz. Ash or maple shaft, leather tip 9–10mm diameter. " +
        "In Victorian era: straight ash cues, no extensions."
      },
      { title: 'CONDUCT & ETIQUETTE', body:
        "Victorian snooker was a gentleman's game. Its conduct norms persist in professional play.\n\n" +
        "¶ Do not move or cause disturbance while opponent is at the table\n" +
        "¶ Concede graciously when you cannot win — 'giving up the frame' is customary when the " +
        "deficit is insurmountable\n" +
        "¶ Applaud good breaks from your opponent\n" +
        "¶ Do not question the referee\n" +
        "¶ Declare safety before playing one — in Victorian club play this was a point of honour\n\n" +
        "The greatest players are not those who never feel pressure. They are those who " +
        "perform despite it. That is the whole of it."
      }
    ],

    psychology: [
      { title: 'THE MENTAL GAME', body:
        "Snooker is the most psychological of all cue sports. A frame can last two hours. " +
        "Concentration lapses. Pressure builds. One missed pot from 70 points ahead can " +
        "unravel an entire session.\n\n" +
        "The mental game in snooker is not about confidence alone — it is about sustained " +
        "concentration over a long period. You must be present on every single shot, not just " +
        "the important ones.\n\n" +
        "The shot you are playing is always the most important shot of the frame. " +
        "There is no such thing as an easy pot."
      },
      { title: 'PRE-SHOT ROUTINE', body:
        "Every professional has one. It is the single most important mental tool in the game.\n\n" +
        "A routine creates a ritual that bypasses conscious thought at the moment of execution. " +
        "You decide before you get down — then you execute without deciding again.\n\n" +
        "Standard routine: assess position from standing → decide the shot and target position → " +
        "get down → line up → two or three practice strokes → pause → execute.\n\n" +
        "Do not change your shot after you are down. If you are unsure, stand up and start the " +
        "routine again. Changing mid-stroke is the single biggest cause of misses at all levels."
      },
      { title: 'PRESSURE AND NERVES', body:
        "The last red with black, 30 behind. The final pink for the frame. These shots are won " +
        "or lost before you bend down.\n\n" +
        "The physical sensations of pressure — tightening grip, rushed stroke, altered breathing " +
        "— are not signs of weakness. They are natural responses to high stakes. They become " +
        "problems only when you fight them.\n\n" +
        "The technique: acknowledge the feeling, breathe deliberately, slow the routine. " +
        "The pot does not know it is important. Your body does. Manage the body; the pot follows."
      },
      { title: 'PLAYING SAFE', body:
        "Many players at amateur level feel that playing safe is a failure. This is wrong.\n\n" +
        "A well-executed safety that forces your opponent into a difficult position is worth " +
        "as much as a pot. A missed pot from a risky position is worth nothing and may gift " +
        "your opponent a break.\n\n" +
        "At the professional level, safety battles are studied as carefully as break-building. " +
        "The player who wins the safety exchange — forcing the other into an error — has won " +
        "something for nothing.\n\n" +
        "Ask yourself before every pot: what happens if I miss? If the answer is bad, consider safety."
      },
      { title: 'CONCENTRATION', body:
        "A century break requires potting approximately 20 balls without interruption. " +
        "In a best-of-25 match, you may play 200 shots or more.\n\n" +
        "Each requires full attention. This is the discipline of snooker.\n\n" +
        "The concentration technique used by most professionals: think only about the ball " +
        "you are playing. Not the scoreboard. Not the previous miss. Not the crowd. " +
        "Just this red, this angle, this pace.\n\n" +
        "Between shots: allow your mind to relax. Conserve concentration. The drain of " +
        "sustained focus is real. Manage it."
      }
    ]
  };

  const tutorial = {
    section: 'quickStart',   // current section key
    page: 0,                 // current page index within section
    sectionList: ['quickStart', 'shots', 'strategy', 'lingo', 'rulebook', 'psychology'],
    sectionTitles: {
      quickStart: 'QUICK START',
      shots: 'THE SHOTS',
      strategy: 'STRATEGY & BREAKS',
      lingo: 'LINGO & TERMS',
      rulebook: 'TOURNAMENT RULES',
      psychology: 'THE MENTAL GAME'
    },
    drillKey: null,          // current active drill name
    drillResult: null,       // 'success' | 'fail' | null
    drillAttempts: 0,
    drillSuccesses: 0
  };

  // Drill definitions — each describes a ball setup and a goal
  const DRILLS = {
    stunShot: {
      name: 'THE STUN SHOT',
      description: 'Strike centre cue ball on a straight shot. Cue ball must stop dead at the contact point.',
      hint: 'Spin dial centred exactly. Medium pace. The ball must not continue forward.',
      setup: function() {
        return [
          _makeBall(0, 0, PLAY_X0 + PLAY_W * 0.82, TABLE_H / 2),
          _makeBall(1, 1, PLAY_X0 + PLAY_W * 0.55, TABLE_H / 2)
        ];
      },
      checkSuccess: function(state) {
        const red = state.balls.find(b => b.n === 1);
        const cue = state.balls[0];
        if (!red || !red.pocketed) return null;
        if (!cue.inPlay) return 'fail';
        const origX = PLAY_X0 + PLAY_W * 0.55;
        return Math.hypot(cue.x - origX, cue.y - TABLE_H / 2) < 55 ? 'success' : 'fail';
      }
    },
    screwShot: {
      name: 'THE SCREW SHOT',
      description: 'Back spin — pot the red and draw the cue ball back at least 80 units toward you.',
      hint: 'Spin dial DOWN. Strike firmly. The cue ball must reverse after contact.',
      setup: function() {
        return [
          _makeBall(0, 0, PLAY_X0 + PLAY_W * 0.82, TABLE_H / 2),
          _makeBall(1, 1, PLAY_X0 + PLAY_W * 0.55, TABLE_H / 2)
        ];
      },
      checkSuccess: function(state) {
        const red = state.balls.find(b => b.n === 1);
        const cue = state.balls[0];
        if (!red || !red.pocketed) return null;
        if (!cue.inPlay) return 'fail';
        const origX = PLAY_X0 + PLAY_W * 0.55;
        return cue.x > origX + 50 ? 'success' : 'fail';
      }
    },
    followShot: {
      name: 'TOP SPIN (FOLLOW)',
      description: 'Top spin — pot the red and run the cue ball forward at least 80 units past the contact point.',
      hint: 'Spin dial UP. Medium-firm pace. Cue ball must continue through after potting.',
      setup: function() {
        return [
          _makeBall(0, 0, PLAY_X0 + PLAY_W * 0.82, TABLE_H / 2),
          _makeBall(1, 1, PLAY_X0 + PLAY_W * 0.55, TABLE_H / 2)
        ];
      },
      checkSuccess: function(state) {
        const red = state.balls.find(b => b.n === 1);
        const cue = state.balls[0];
        if (!red || !red.pocketed) return null;
        if (!cue.inPlay) return 'fail';
        const origX = PLAY_X0 + PLAY_W * 0.55;
        return cue.x < origX - 55 ? 'success' : 'fail';
      }
    },
    cutRed: {
      name: 'CUT RED TO POCKET',
      description: 'Cut the red into the side pocket on a 30-degree angle. No scratch.',
      hint: 'Aim slightly off-centre of the red. Observe the 90-degree deflection rule.',
      setup: function() {
        return [
          _makeBall(0, 0, PLAY_X0 + PLAY_W * 0.55, TABLE_H / 2 + 80),
          _makeBall(1, 1, PLAY_X0 + PLAY_W * 0.40, TABLE_H / 2)
        ];
      },
      checkSuccess: function(state) {
        const red = state.balls.find(b => b.n === 1);
        const cue = state.balls[0];
        if (!red || !red.pocketed) return null;
        return cue.inPlay ? 'success' : 'fail';
      }
    },
    redWithBlack: {
      name: 'RED THEN BLACK',
      description: 'Pot the red, then get position on the black. Cue ball must end within 120 units of the black spot.',
      hint: 'Think position first. Where will the cue ball end up? Plan your spin and pace accordingly.',
      setup: function() {
        return [
          _makeBall(0, 0, PLAY_X0 + PLAY_W * 0.75, TABLE_H / 2 + 40),
          _makeBall(1, 1, PLAY_X0 + PLAY_W * 0.50, TABLE_H / 2 + 60),
          _makeBall(2, 21, COLOUR_SPOTS[21].x, COLOUR_SPOTS[21].y)  // black on spot
        ];
      },
      checkSuccess: function(state) {
        const red = state.balls.find(b => b.n === 1);
        const black = state.balls.find(b => b.n === 21);
        const cue = state.balls[0];
        if (!red || !red.pocketed) return null;
        if (!cue.inPlay || !black || !black.inPlay) return 'fail';
        const distToBlack = Math.hypot(cue.x - black.x, cue.y - black.y);
        return distToBlack < 140 ? 'success' : 'fail';
      }
    },
    cushionKick: {
      name: 'CUSHION KICK',
      description: 'The red is hidden. Play the cue ball off one cushion to hit it. Cue ball must contact the red.',
      hint: 'Reflect the red position across the cushion. Aim at the mirror point on the rail.',
      setup: function() {
        return [
          _makeBall(0, 0, PLAY_X0 + PLAY_W * 0.75, TABLE_H / 2 + 80),
          _makeBall(1, 1, PLAY_X0 + PLAY_W * 0.30, TABLE_H * 0.25)
        ];
      },
      checkSuccess: function(state) {
        if (state.firstContact === 1) return 'success';
        if (state.gamePhase === 'aiming' && state.pocketedThisShot.length === 0 && state.firstContact === null) return null;
        return state.firstContact === 1 ? 'success' : 'fail';
      }
    }
  };

  // ---------- Tutorial screen rendering -----------------------------------
  function drawTutorialMenu() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 22px Georgia, serif';
    const tY = Math.max(56, H * 0.10);
    ctx.fillText('LEARN SNOOKER', W / 2, tY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('The Victorian gentleman\'s game. Learn it properly.', W / 2, tY + 22);
    screens.tutorial = _stackButtons(tY + 42, [
      { key: 'quickStart', title: 'QUICK START', subtitle: 'The game in five pages. Play immediately.', primary: true },
      { key: 'manual',     title: 'FULL REFERENCE', subtitle: 'Shots, strategy, lingo, tournament rules.', primary: true },
      { key: 'drills',     title: 'PRACTICE DRILLS', subtitle: 'Stun, screw, follow, plants. Interactive.', primary: true },
      { key: 'back',       title: '← BACK', subtitle: null, primary: false }
    ]);
  }

  function drawTutorialReader() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    const sectionPages = TUTORIAL_PAGES[tutorial.section] || [];
    const page = sectionPages[tutorial.page] || { title: '', body: '' };

    // Top: section name
    ctx.fillStyle = '#d9a679';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const sectTitle = tutorial.sectionTitles[tutorial.section];
    ctx.fillText(sectTitle, W / 2, 28);

    // Page title
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'italic bold 18px Georgia, serif';
    const titleY = 60;
    ctx.fillText(page.title, W / 2, titleY);

    // Page indicator
    ctx.fillStyle = '#8a6b2e';
    ctx.font = '10px Georgia, serif';
    ctx.fillText((tutorial.page + 1) + ' / ' + sectionPages.length, W / 2, titleY + 18);

    // Body — paragraphs and bullets
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '12px Georgia, serif';
    ctx.textAlign = 'left';
    const bodyY0 = titleY + 40;
    const bodyMax = H - 110;
    const margin = 22;
    const wrapW = W - margin * 2;
    let y = bodyY0;
    const paragraphs = page.body.split('\n\n');
    for (const para of paragraphs) {
      const isBullet = para.startsWith('¶');
      // Handle bullet inline (each bullet on its own line)
      const bulletLines = para.split('¶').filter(s => s.trim());
      if (isBullet || para.includes('¶')) {
        for (const bp of bulletLines) {
          const bullet = bp.trim();
          if (!bullet) continue;
          // Draw bullet marker
          ctx.fillStyle = '#d9a679';
          ctx.fillText('•', margin, y);
          ctx.fillStyle = '#e8dcc3';
          const lines = wrapText(bullet, wrapW - 14);
          for (const l of lines) {
            if (y > bodyMax) { y = bodyMax + 30; break; }
            ctx.fillText(l, margin + 14, y);
            y += 16;
          }
          y += 4;
        }
      } else {
        const lines = wrapText(para, wrapW);
        for (const l of lines) {
          if (y > bodyMax) { y = bodyMax + 30; break; }
          ctx.fillText(l, margin, y);
          y += 16;
        }
        y += 8;
      }
      if (y > bodyMax) break;
    }

    // Navigation buttons at bottom
    const btnH = 44;
    const btnY = H - btnH - 14;
    const btnW = (W - 60) / 3;

    // PREV
    const prevX = 16;
    ctx.fillStyle = tutorial.page > 0 ? '#2a1206' : '#1a0a04';
    roundRect(ctx, prevX, btnY, btnW, btnH, 6); ctx.fill();
    ctx.strokeStyle = tutorial.page > 0 ? '#8a6b2e' : '#3a1f10';
    ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = tutorial.page > 0 ? '#c9b98a' : '#5a4a2a';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('← PREV', prevX + btnW/2, btnY + btnH/2);
    screens.readerPrev = { x: prevX, y: btnY, w: btnW, h: btnH };

    // SECTION (jump to next section or menu)
    const secX = prevX + btnW + 12;
    ctx.fillStyle = '#4a1808';
    roundRect(ctx, secX, btnY, btnW, btnH, 6); ctx.fill();
    ctx.strokeStyle = '#d9a679'; ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText('MENU', secX + btnW/2, btnY + btnH/2);
    screens.readerMenu = { x: secX, y: btnY, w: btnW, h: btnH };

    // NEXT
    const nextX = secX + btnW + 12;
    const hasNext = tutorial.page < sectionPages.length - 1 ||
                    tutorial.sectionList.indexOf(tutorial.section) < tutorial.sectionList.length - 1;
    ctx.fillStyle = hasNext ? '#2a1206' : '#1a0a04';
    roundRect(ctx, nextX, btnY, btnW, btnH, 6); ctx.fill();
    ctx.strokeStyle = hasNext ? '#8a6b2e' : '#3a1f10'; ctx.stroke();
    ctx.fillStyle = hasNext ? '#c9b98a' : '#5a4a2a';
    ctx.fillText('NEXT →', nextX + btnW/2, btnY + btnH/2);
    screens.readerNext = { x: nextX, y: btnY, w: btnW, h: btnH };
  }

  function drawTutorialDrillMenu() {
    _screenBg();
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 20px Georgia, serif';
    const tY = Math.max(50, H * 0.08);
    ctx.fillText('DRILL PRACTICE', W / 2, tY);
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('Each drill isolates one essential snooker technique.', W / 2, tY + 20);

    const drillKeys = Object.keys(DRILLS);
    const buttons = drillKeys.map(k => ({
      key: k,
      title: DRILLS[k].name,
      subtitle: DRILLS[k].description.slice(0, 60) + (DRILLS[k].description.length > 60 ? '...' : ''),
      primary: true
    }));
    buttons.push({ key: 'back', title: '← BACK', subtitle: null, primary: false });
    screens.drills = _stackButtons(tY + 42, buttons);
  }

  // Drill HUD — shows drill name + description + result
  function drawDrillHUD() {
    if (!state || !state.drillKey) return;
    const drill = DRILLS[state.drillKey];
    if (!drill) return;
    const W = canvas.width, H = canvas.height;

    // Top banner with drill info
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.92)';
    ctx.fillRect(0, 32, W, 84);
    ctx.fillStyle = '#d9a679';
    ctx.font = 'italic bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(drill.name, W / 2, 38);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '10px Georgia, serif';
    const descLines = wrapText(drill.description, W - 24);
    let descY = 56;
    for (const l of descLines.slice(0, 3)) {
      ctx.fillText(l, W / 2, descY);
      descY += 12;
    }
    // Hint in italic
    ctx.fillStyle = '#c9b98a';
    ctx.font = 'italic 10px Georgia, serif';
    ctx.fillText('HINT: ' + drill.hint, W / 2, descY + 4);

    // Attempts counter top-right
    ctx.fillStyle = '#f7c948';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(tutorial.drillSuccesses + ' / ' + tutorial.drillAttempts, W - 10, 16);
    ctx.restore();

    // Result overlay
    if (state.drillResult) {
      ctx.save();
      ctx.fillStyle = 'rgba(10,5,2,0.85)';
      ctx.fillRect(0, H/2 - 60, W, 120);
      const isSuccess = state.drillResult === 'success';
      ctx.fillStyle = isSuccess ? '#6adc6a' : '#c0392b';
      ctx.font = 'italic bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isSuccess ? '✓  WELL DONE' : '✗  TRY AGAIN', W/2, H/2 - 12);
      ctx.fillStyle = '#c9b98a';
      ctx.font = '12px Georgia, serif';
      ctx.fillText('Tap to retry', W/2, H/2 + 18);
      ctx.restore();
    }

    // EXIT DRILL button bottom-right (replaces normal SAFE button)
    if (!state.drillResult) {
      const exitW = 90, exitH = 32;
      const exitX = W - exitW - 10;
      const exitY = H - exitH - 10;
      ctx.save();
      ctx.fillStyle = 'rgba(40,20,10,0.85)';
      roundRect(ctx, exitX, exitY, exitW, exitH, 5); ctx.fill();
      ctx.strokeStyle = '#8a6b2e'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#c9b98a';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('EXIT DRILL', exitX + exitW/2, exitY + exitH/2);
      hud.exitDrill = { x: exitX, y: exitY, w: exitW, h: exitH };
      ctx.restore();
    }
  }

  function startDrill(drillKey) {
    const drill = DRILLS[drillKey];
    if (!drill) return;
    tutorial.drillKey = drillKey;
    tutorial.drillResult = null;
    tutorial.drillAttempts++;
    state = {
      mode: 'drill',
      drillKey: drillKey,
      drillResult: null,
      balls: drill.setup(),
      aimX: PLAY_X0 + PLAY_W * 0.28,
      aimY: TABLE_H / 2,
      power: 0.5,
      pullBack: 0,
      spinX: 0, spinY: 0,
      turn: 'player',
      gamePhase: 'aiming',
      openTable: true,
      pocketedThisShot: [],
      firstContact: null,
      _cueTouchedCushion: 0,
      _ballsToCushion: 0,
      shotClockStart: null,
      shotClockLimit: 999999,
      shotClockExpired: false,
      consecutiveFouls: { player: 0, alistair: 0 },
      intentionalSafety: false,
      playerStats: { shotsTaken: 0, shotsMissed: 0, ballsSunk: 0, scratches: 0, skill: 0.5 },
      ballInHand: false,
      calledPocket: null,
      showCallPocket: false,
      dialogue: '',
      dialogueTimer: 0
    };
    screenState = 'drill';
  }

  function checkDrillResult() {
    if (!state || state.mode !== 'drill') return;
    const drill = DRILLS[state.drillKey];
    if (!drill) return;
    const result = drill.checkSuccess(state);
    if (result) {
      state.drillResult = result;
      if (result === 'success') tutorial.drillSuccesses++;
      // Reset shot data for next attempt
      state.pocketedThisShot = [];
    }
  }

  // ---------- Loop --------------------------------------------------------
  function loop() {
    if (!canvas) return;
    if (lagState.active) {
      stepLag();
      drawLag();
    } else if (screenState === 'modeSelect' || screenState === 'formatSelect' ||
               screenState === 'soloHub' || screenState === 'tutorialMenu' ||
               screenState === 'tutorialReader' || screenState === 'tutorialDrills') {
      computeView();
      drawScreenOverlay();
    } else if (screenState === 'interstitial' || screenState === 'matchEnd') {
      drawScreenOverlay();
    } else if (screenState === 'drill' && state) {
      if (state.gamePhase === 'simulating') step();
      // Check drill result after balls stop
      if (state.gamePhase === 'aiming' && !state.drillResult) {
        checkDrillResult();
      }
      render();
      // Drill HUD overlays normal UI
      drawDrillHUD();
    } else if (state) {
      if (state.gamePhase === 'simulating') step();
      if (state.mode === 'vs' && state.turn === 'alistair' && state.gamePhase === 'aiming') {
        if (!state._alistairScheduled) {
          state._alistairScheduled = true;
          setTimeout(() => {
            state._alistairScheduled = false;
            if (state && state.turn === 'alistair' && state.gamePhase === 'aiming') alistairMove();
          }, 1200 + Math.random() * 600);
        }
      }
      render();
    } else {
      screenState = 'modeSelect';
    }
    rafId = requestAnimationFrame(loop);
  }

  // ---------- Helpers shared with rendering -------------------------------
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
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------- Open / Close / Module bootstrap -----------------------------
  let canvas = null, ctx = null, modal = null, rafId = null;

  function openBilliards() {
    if (modal) return;
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(ellipse at center,#1a0e07 0%,#0a0503 50%,#000 100%);overflow:hidden;touch-action:none;';

    const close = document.createElement('button');
    close.textContent = '× CLOSE';
    close.style.cssText = 'position:absolute;top:8px;right:8px;background:rgba(40,20,10,0.85);color:#ebdab3;border:1px solid #8a6b2e;padding:6px 12px;font-family:Georgia,serif;font-size:12px;cursor:pointer;z-index:2;border-radius:4px;';
    close.addEventListener('click', closeBilliards);
    close.addEventListener('touchend', (e) => { e.preventDefault(); closeBilliards(); });

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
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
    canvas.width = w;
    canvas.height = h;
  }

  function closeBilliards() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
    canvas = null;
    ctx = null;
    state = null;
    screenState = 'modeSelect';
    powerDragging = spinDragging = pullingBack = draggingHandle = false;
    window.removeEventListener('resize', fitCanvas);
    window.removeEventListener('orientationchange', fitCanvas);
  }

  window.openBilliards = openBilliards;
  window.closeBilliards = closeBilliards;
})();
