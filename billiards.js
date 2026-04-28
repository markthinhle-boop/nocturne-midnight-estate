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
  // Real PCM samples decoded into AudioBuffers — clean, no synthesis artifacts.
  // Cooldown prevents spam on break. Compressor prevents clipping.

  let _ac = null, _masterGain = null, _compressor = null, _audioReady = false;
  let _buffers = {};
  const _lastSoundAt = {};

  // Pre-generated audio samples (WAV base64)
  const _SND = {
    ballHit: 'data:audio/wav;base64,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',
    cueHit: 'data:audio/wav;base64,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EQAOAAoABgACAP//+//3//P/8P/t/+r/5//l/+L/4f/g/9//3v/f/9//4P/i/+T/5v/o/+v/7v/y//X/+f/8/wAABAAHAAoADgARABQAFgAYABoAHAAdAB4AHgAeAB4AHQAcABsAGQAXABUAEgAQAA0ACQAGAAMA///8//j/9f/y/+//7f/q/+j/5v/l/+T/5P/j/+P/5P/l/+b/6P/q/+z/7v/x//P/9v/5//z///8CAAUACAALAA4AEAASABUAFgAYABkAGgAaABsAGgAaABkAGAAWABQAEgAQAA4ACwAIAAUAAgD///z/+f/3//T/8v/w/+7/7P/q/+n/6P/o/+j/6P/o/+n/6v/r/+z/7v/w//L/9P/3//n//P///wEABAAHAAkADAAOABAAEgATABUAFgAWABcAFwAXABYAFgAUABMAEgAQAA4ADAAJAAcABQACAAAA/f/7//n/9v/0//L/8f/v/+7/7f/s/+v/6//r/+v/7P/s/+3/7//w//L/9P/2//j/+v/8////AQAEAAYACAAKAAwADgAPABEAEgASABMAEwAUABMAEwASABIAEAAPAA4ADAAKAAgABwAEAAIAAAD+//z/+v/4//b/9P/z//L/8P/v/+//7v/u/+7/7v/u/+//8P/x//L/9P/1//f/+f/7//3///8BAAMABQAHAAgACgALAA0ADgAPABAAEAARABEAEQAQABAADwAOAA0ADAALAAkACAAGAAQAAgAAAP///f/7//n/+P/2//X/9P/y//L/8f/x//D/8P/w//H/8f/y//P/9P/1//f/+P/6//v//f///wAAAgAEAAUABwAIAAoACwAMAA0ADQAOAA4ADwAPAA4ADgANAA0ADAALAAkACAAHAAUABAACAAAA///9//z/+v/5//j/9v/1//X/9P/z//P/8//z//P/8//z//T/9f/2//f/+P/5//r//P/9////AAACAAMABAAGAAcACAAJAAoACwAMAAwADAANAA0ADAAMAAwACwAKAAkACAAHAAYABQADAAIAAQD///7//f/7//r/+f/4//f/9v/2//X/9f/1//T/9P/1//X/9v/2//f/+P/5//r/+//8//3///8=',
    breakHit: 'data:audio/wav;base64,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FQAQAAwACAAEAP//+//3//P/7v/q/+f/4//f/9z/2f/X/9T/0v/R/9D/z//O/87/zv/P/9D/0f/T/9X/1//a/93/4P/j/+f/6//u//L/9v/6//7/AgAGAAoADgASABUAGQAcAB8AIgAkACYAKAAqACsALAAtAC4ALgAtAC0ALAArACkAKAAlACMAIAAeABoAFwAUABAADAAJAAUAAQD9//n/9v/y/+7/6//o/+X/4v/g/93/2//a/9j/1//W/9b/1v/W/9b/1//Y/9n/2//c/97/4f/j/+b/6f/s/+//8v/1//n//P8AAAMABwAKAA0AEQAUABcAGQAcAB4AIAAiACQAJQAmACcAKAAoACgAJwAnACYAJAAjACEAHwAdABoAGAAVABIADwAMAAkABQACAP///P/5//b/8//w/+3/6v/o/+b/5P/i/+D/3//e/93/3P/c/9v/3P/c/93/3v/f/+D/4v/k/+b/6P/q/+3/8P/y//X/+P/7//7/AgAFAAgACwANABAAEwAVABcAGQAbAB0AHgAgACAAIQAiACIAIgAiACEAIAAfAB4AHQAbABoAGAAVABMAEQAOAAwACQAGAAQAAQD+//v/+f/2//P/8f/v/+z/6v/o/+f/5f/k/+L/4v/h/+D/4P/g/+H/4f/i/+P/5P/l/+f/6f/r/+3/7//x//P/9v/4//v//v8AAAMABQAIAAoADAAPABEAEwAVABYAGAAZABoAGwAcAB0AHQAdAB0AHQAcABwAGwAaABkAFwAVABQAEgAQAA4ACwAJAAcABAACAP///f/7//j/9v/0//L/8P/u/+z/6//p/+j/5//m/+b/5f/l/+X/5f/l/+b/5//o/+n/6v/r/+3/7v/w//L/9P/2//j/+v/9////AQADAAUACAAKAAwADgAPABEAEwAUABUAFgAXABgAGQAZABkAGQAZABkAGAAYABcAFgAUABMAEgAQAA4ADAALAAkABwAFAAIAAAD+//z/+v/4//b/9f/z//H/8P/u/+3/7P/r/+r/6v/p/+n/6f/p/+n/6f/q/+r/6//s/+3/7//w//H/8//1//b/+P/6//z//v8AAAIABAAGAAgACQALAA0ADgAPABEAEgATABQAFAAVABUAFgAWABYAFQAVABQAFAATABIAEQAQAA4ADQAMAAoACAAHAAUAAwABAAAA/v/8//r/+f/3//b/9P/z//H/8P/v/+7/7v/t/+z/7P/s/+z/7P/s/+3/7f/u/+//7//x//L/8//0//b/9//5//r//P/+////AQADAAQABgAHAAkACgALAA0ADgAPABAAEAARABIAEgASABMAEwATABIAEgARABEAEAAPAA4ADQAMAAsACQAIAAcABQADAAIAAAD///3//P/6//n/+P/2//X/9P/z//L/8f/w//D/7//v/+//7//v/+//7//w//D/8f/x//L/8//0//X/9v/4//n/+v/8//3///8AAAEAAwAEAAUABwAIAAkACgALAAwADQAOAA8ADwAQABAAEAAQABAAEAAQAA8ADwAOAA0ADQAMAAsACgAJAAcABgAFAAQAAgABAAAA/v/9//z/+//5//j/9//2//X/9P/0//P/8v/y//L/8f/x//H/8f/x//L/8v/y//P/9P/0//X/9v/3//j/+f/7//z//f/+////AQACAAMABAAFAAYACAAJAAkACgALAAwADAANAA0ADQAOAA4ADgAOAA4ADQANAAwADAALAAoACgAJAAgABwAGAAUABAADAAEAAAD///7//f/8//v/+v/5//j/9//2//b/9f/0//T/9P/z//P/8//z//P/8//0//T/9f/1//b/9v/3//j/+f/6//v//P/9//7///8AAAEAAgADAAQABQAGAAcACAAIAAkACgAKAAsACwALAAwADAAMAAwADAAMAAsACwAKAAoACQAJAAgABwAGAAYABQAEAAMAAgABAAAA///+//3//P/7//r/+f/5//j/9//3//b/9v/2//X/9f/1//X/9f/1//X/9v/2//b/9//4//j/+f/6//r/+//8//3//v///wAAAAABAAIAAwAEAAUABgAGAAcACAAIAAkACQAJAAoACgAKAAoACgAKAAoACgAKAAkACQAIAAgABwAGAAYABQAEAAQAAwACAAEAAAD//////v/9//z/+//7//r/+f/5//j/+P/3//f/9//3//f/9//3//f/9//3//f/+P/4//j/+f/5//r/+//7//z//f/+//7///8=',
    cushion: 'data:audio/wav;base64,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nQCjAKgArQCzALgAvQDCAMYAywDPANMA2ADbAN8A4wDmAOkA7QDvAPIA9QD3APkA/AD+AP8AAQECAQMBBAEFAQYBBgEHAQcBBwEHAQYBBgEFAQQBAwECAQAB/wD9APsA+QD3APUA8gDwAO0A6gDnAOQA4ADdANkA1QDRAM0AyQDFAMEAvAC4ALMArgCpAKQAnwCaAJUAkACKAIUAfwB6AHQAbgBoAGMAXQBXAFEASwBFAD8AOQAzAC0AJwAhABsAFQAPAAkAAwD9//f/8f/r/+X/4P/a/9T/zv/J/8P/vv+4/7P/rv+o/6P/nv+Z/5T/kP+L/4b/gv99/3n/df9x/23/af9l/2L/Xv9b/1f/VP9R/07/TP9J/0b/RP9C/0D/Pv88/zr/Of83/zb/Nf80/zP/Mv8x/zH/Mf8w/zD/Mf8x/zH/Mv8y/zP/NP81/zb/N/85/zr/PP8+/0D/Qv9E/0b/Sf9L/07/UP9T/1b/Wf9c/1//Y/9m/2r/bf9x/3X/eP98/4D/hP+I/43/kf+V/5n/nv+i/6f/q/+w/7T/uf++/8L/x//M/9D/1f/a/9//4//o/+3/8v/3//v/AAAFAAkADgATABcAHAAgACUAKQAuADIANgA7AD8AQwBHAEsATwBTAFcAWwBeAGIAZQBpAGwAbwBzAHYAeQB8AH4AgQCEAIYAiQCLAI0AkACSAJQAlQCXAJkAmgCcAJ0AngCfAKAAoQCiAKIAowCjAKQApACkAKQApACkAKMAowCiAKEAoQCgAJ8AngCdAJsAmgCZAJcAlQCUAJIAkACOAIwAigCHAIUAgwCAAH0AewB4AHUAcgBwAG0AagBmAGMAYABdAFoAVgBTAE8ATABIAEUAQQA+ADoANgAzAC8AKwAnACQAIAAcABgAFQARAA0ACQAGAAIA/v/6//f/8//v/+z/6P/l/+H/3v/a/9f/0//Q/83/yf/G/8P/wP+9/7r/t/+0/7H/r/+s/6n/p/+k/6L/n/+d/5v/mf+X/5X/k/+R/4//jv+M/4v/if+I/4f/hv+F/4T/g/+C/4H/gf+A/4D/f/9//3//f/9//3//f/9//3//gP+A/4H/gf+C/4P/hP+F/4b/h/+I/4n/i/+M/47/j/+R/5L/lP+W/5j/mv+c/57/oP+i/6T/p/+p/6v/rv+w/7P/tf+4/7v/vf/A/8P/xv/I/8v/zv/R/9T/1//a/9z/3//i/+X/6P/r/+7/8f/0//f/+v/9/wAAAwAGAAkADAAPABEAFAAXABoAHQAfACIAJQAnACoALAAvADEANAA2ADgAOwA9AD8AQQBDAEYARwBJAEsATQBPAFEAUgBUAFUAVwBYAFoAWwBcAF0AXgBfAGAAYQBiAGMAYwBkAGQAZQBlAGYAZgBmAGYAZgBmAGYAZgBmAGUAZQBlAGQAZABjAGIAYgBhAGAAXwBeAF0AXABbAFoAWABXAFYAVABTAFEAUABOAE0ASwBJAEcARgBEAEIAQAA+ADwAOgA4ADYANAAxAC8ALQArACkAJgAkACIAIAAdABsAGQAWABQAEgAPAA0ACwAIAAYAAwABAP///f/6//j/9v/z//H/7//t/+v/6P/m/+T/4v/g/97/3P/a/9j/1v/U/9L/0f/P/83/zP/K/8j/x//F/8T/wv/B/8D/vv+9/7z/u/+6/7n/uP+3/7b/tf+0/7T/s/+y/7L/sf+x/7H/sP+w/7D/r/+v/6//r/+v/6//sP+w/7D/sP+x/7H/sf+y/7P/s/+0/7T/tf+2/7f/uP+5/7r/u/+8/73/vv+//8D/wv/D/8T/xv/H/8j/yv/L/83/zv/Q/9H/0//V/9b/2P/a/9z/3f/f/+H/4//k/+b/6P/q/+z/7v/v//H/8//1//f/+f/6//z//v8AAAIABAAFAAcACQALAA0ADgAQABIAEwAVABcAGAAaABwAHQAfACAAIgAjACUAJgAnACkAKgArAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOQA6ADsAOwA8AD0APQA9AD4APgA/AD8APwA/AEAAQABAAEAAQABAAEAAPwA/AD8APwA/AD4APgA9AD0APAA8ADsAOwA6ADkAOQA4ADcANgA2ADUANAAzADIAMQAwAC8ALgAtACsAKgApACgAJwAlACQAIwAhACAAHwAdABwAGwAZABgAFwAVABQAEgARAA8ADgAMAAsACQAIAAcABQAEAAIAAQD///7//P/7//r/+P/3//X/9P/z//H/8P/v/+3/7P/r/+r/6P/n/+b/5f/k/+L/4f/g/9//3v/d/9z/2//a/9r/2f/Y/9f/1v/W/9X/1P/U/9P/0v/S/9H/0f/Q/9D/0P/P/8//z//O/87/zv/O/87/zv/O/87/zv/O/87/zv/O/87/z//P/8//z//Q/9D/0P/R/9H/0v/S/9P/1P/U/9X/1f/W/9f/2P/Y/9n/2v/b/9z/3P/d/97/3//g/+H/4v/j/+T/5f/m/+f/6P/p/+r/6//t/+7/7//w//H/8v/z//T/9v/3//j/+f/6//v//f/+////AAABAAIAAwAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAZABoAGwAcAB0AHQAeAB8AHwAgACEAIQAiACIAIwAjACQAJAAlACUAJQAmACYAJgAnACcAJwAnACcAKAAoACgAKAAoACgAKAAoACgAJwAnACcAJwAnACcAJgAmACYAJQAlACUAJAAkACMAIwAiACIAIQAhACAAIAAfAB4AHgAdABwAHAAbABoAGgAZABgAFwAXABYAFQAUABMAEgASABEAEAAPAA4ADQAMAAsACgAKAAkACAAHAAYABQAEAAMAAgABAAAAAAD///7//f/8//v/+v/5//n/+P/3//b/9f/0//T/8//y//H/8P/w/+//7v/u/+3/7P/s/+v/6v/q/+n/6f/o/+j/5//m/+b/5v/l/+X/5P/k/+T/4//j/+P/4v/i/+L/4v/h/+H/4f/h/+H/4f/h/+H/4f/h/+H/4f/h/+H/4f/h/+H/4f/h/+L/4v/i/+L/4//j/+P/5P/k/+T/5f/l/+X/5v/m/+f/5//o/+j/6f/p/+r/6v/r/+v/7P/t/+3/7v/v/+//8P/w//H/8v/y//P/9P/1//X/9v/3//f/+P/5//r/+v/7//z//P/9//7//////wAAAQABAAIAAwAEAAQABQAGAAYABwAIAAgACQAKAAoACwALAAwADQANAA4ADgAPAA8AEAAQABEAEQASABIAEwATABQAFAAUABUAFQAVABYAFgAWABcAFwAXABcAGAAYABgAGAAYABgAGAAZABkAGQAZABkAGQAZABkAGQAZABkAGQAYABgAGAAYABgAGAAYABcAFwAXABcAFgAWABYAFQAVABUAFAAUABQAEwATABMAEgASABEAEQAQABAADwAPAA8ADgA=',
    pocket: 'data:audio/wav;base64,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nP+k/8r/of+y/7//xP/O/4L/2f+o/6v/Z//a/0b/av+h/3X/a/90/2H/jv90/0X/eP+K/2r/xf9F/4T/W/9o/0L/Lf9o/xz/PP+j/5z/XP91/1//pf+m/xH/SP95/2v/JP9J/xv/PP9V/5L/A/8h/xj/Tf84/yv/KP9P//X+gP8P/1H/Gv8j/17/E/9n/4X/R/8I/3r/dP9J/0v/Ff9c/wb/7/46/+j+I/8V/wj/IP8d/3z/Gv8g/0f/cv8+/1n/9P4B/3P/Q/9x/2//Af8z/+T+TP8U/+j+Rv/u/uv+Yf9Z//3+Af9q/zP/A////nf/9v77/mz/eP9F/4P/E/8F/zn/Nv9j/wP/Sf9t/1f/f/92/3T/XP9L/0T/Nv8b/5P/d/9J/07/Tv8z/zL/cP90/1n/i/9r/zb/fv9b/6j/ff9V/7f/p/9h/5z/xP+t/3H/xv+T/1//e/9a/6T/zf/Z/7//uP/A/3T/b/+M/4j/5v93/7z/mP/j/4P/ev/m/7X/AADy/9L/xv/X/+n/jf/p/47/AgCR/6T/EwDZ/+D/AADO/8v/q//G/7j/z/8zABAAwf80AAgA8/8BAOf/AAAgAPj/AgDT/woABQANANz/VAA5AFoAUwAoACQATABgAPH/IQAtAEAAYQBbAEUABwAKAFMANgBqAHMAawAMADkAKgCJAE4AJQBNAEwAlQAiAG8APQB0ADQAkgA0AFsAkgCRAEYApgCNAIgAgQCXAIkApgCsAEcAnwBbAHQAcwBuAIYAVADGAKAAvgBxAKQAggBqANIA0QB5ALcAiwDHAJQAaADgAGQAbQDKAJ4AbgDMAOYAvwC5ALwA4QCVANIA1ACEAHkAeQB6AJIAegDPAOgA1wDjAKQApACjALkA3QB8AJgAxgDTAM0A0QDSAMUAvgC/AO0AwwCdAI0AwACuAIcAjQCMALcArADFAHcAzwCsALAArgDYAN8AyADBAIsAyAC2AIAA0gB8ANAAcACGAIIAmQCtAGkA2QCQAGgAxwB9AGQAwACtAKEAjACxAIAAiwCMAHcAWACpAGMAogBtAL0AngCsAEoAagCQAG4AVQBWAIQAkwCmAEQAPAA9AHoAVwCTAHIAcABlAF8AVQCRAH4AcQBoAHcAUAAnAEsANgBTAFAAWQA8ADoAPwBFAGgAPQAeAFYAVwAzAPz//v9KADoAKgAsACUAOQACAE0A6f/6//n/JQAtACkAHQA+AOr/PgDV/93/EgAcAOv/yP8PABEA+v/x/wkA8//1/7P/4//U/wAAvv+6//z/8f/V/+j/CADg//P/s/+Z/7r/xv+7/7T/0f/e/9f/xf/n/+P/4f+4/9//wf+J/5X/sv+e/5r/of+b/9D/rf+b/2r/v//K/8f/t/+1/5f/sP+d/4n/Xf95/6H/oP+c/6D/tP9v/7T/ef+g/3r/eP94/1//cv+h/0j/eP+e/0b/Vf91/2//nv91/17/Tv+T/0n/ev9W/1r/ff85/2X/UP9//3f/df9m/1D/Zv9F/33/Zv9C/2v/Vv93/4D/UP96/3X/ev+S/2n/hP+J/0//Z/99/1H/Qf97/13/Tf84/z//bP+C/1f/k/9w/3b/Vf9P/2T/h/9J/0v/gf9L/5r/WP9v/1H/cf+R/1z/mP+a/2X/iv9N/1//jv96/2n/lP9u/3X/jP9o/3H/bP9r/1P/ef+W/3D/n/9b/3j/kf9+/43/of+1/6v/j/+s/7n/cf+M/4f/r/9w/3j/ev+f/8P/sv92/4z/qP+E/6T/mv+6/9v/tf+Q/4r/m/+b/7//6f/C/7n/pf/a/8L/yv/a/9//vf/0/6X/9P+3//X/sP+r/9j/wf/J/+P/uv/s/8H/wP8DAA8ADgDG/9j/6v8GAPD/yf8XABwA7//+//f/8P/s/x0AFQAlAAUA9v8JABYAEAAmAAAAPAAaACYABQAWAAEAOQAJAAUAUQAVADUALwAZADwAMQAjADQAOgBSABYAOwAuADEAGwBAAGkAKQAuADwALAAlAGUARgAtAEUAXAB4AEsAVABUAEYAYgBBAEQAVgCIAGIAYQB6AHsAbwCQAIIAiABrAHEAegB7AHMAXQB0AJYATACJAG0AXwBSAGcAUgBoAFcAmwCkAJwAYwBrAJEAjgCSAKYAkQBwAJkAYQCWAIEAhwBrAKEAhgBfAH0AkQB2AJsAmQCJAK8AmACTAG8AgQB4AJIAmgCpAKsAdgBtAKAAhACJAJ4AoQCjAJAAoQB4AKIAdgBgAIgAjACrAKMAcgBmAGgAbwCLAH0ApgCWAHgAdwCDAF0AewCcAHUAlQB4AHcAoQCRAIoAbwCRAGcAkACRAHEAcABYAHwAiwBKAIsAbABwAFgAggB/AGcAfwBQAFcARACAAEUARgA5AEsAdQBoAGAAXwBhAHcAdQB0AFMAOQAoAEoASwBAAF8AKwAmAC0AUQBVAFEAGwArAEcANgAjABIAUgBJAA8ANAAjABEANAAGADsAPwAMAB8ALAAaAPr/GwAFAPz/IgARAAEA+//7/x8AFQAhACgAFwDs/w0AGQAVAPP//P/6/+P/5f/m/+D//P8KANr/1f///wMA+f/t/+r/4P8BAPj/3P/M/83/6//y/73/0P/O//b/xf/s/8v/0v/B/8T/4f/h/9f/1P+5/6b/t//E/53/w//E/7n/qP+y/8n/wf+7/8P/zf+2/7r/yv+r/7v/lP+T/7T/kP/B/7D/vv+7/7P/iv+T/43/i/+6/7D/of+K/37/qP+f/5j/rv+0/4P/hv90/4P/if+Y/6L/iP+f/53/jv+M/6X/dP+X/6H/if96/3X/ev9v/5//ev9y/5v/lv+K/3r/lP95/4P/k/+E/6f/mv+A/4z/nv93/6X/hv97/5n/hv+h/37/p/+D/5r/gf+G/3j/dv+m/4D/oP90/6T/e/+W/3v/rP+S/4v/q/8=',
    scratch: 'data:audio/wav;base64,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',
    win: 'data:audio/wav;base64,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',
    lose: 'data:audio/wav;base64,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',
  };

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
      _compressor = _ac.createDynamicsCompressor();
      _compressor.threshold.value = -14;
      _compressor.knee.value = 4;
      _compressor.ratio.value = 5;
      _compressor.attack.value = 0.002;
      _compressor.release.value = 0.1;
      _masterGain = _ac.createGain();
      _masterGain.gain.value = 0.75;
      _masterGain.connect(_compressor);
      _compressor.connect(_ac.destination);
      // Decode all samples
      for (const [key, dataUrl] of Object.entries(_SND)) {
        const b64 = dataUrl.split(',')[1];
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        _ac.decodeAudioData(bytes.buffer).then(buf => { _buffers[key] = buf; }).catch(() => {});
      }
      _audioReady = true;
      return true;
    } catch (e) { return false; }
  }

  function _resumeAudio() {
    if (_ac && _ac.state === 'suspended') _ac.resume();
  }

  function _now() { return _ac ? _ac.currentTime : 0; }

  function _play(key, vol, rate) {
    if (!_ac || !_buffers[key]) return;
    const src = _ac.createBufferSource();
    src.buffer = _buffers[key];
    src.playbackRate.value = rate || 1.0;
    const g = _ac.createGain();
    g.gain.value = Math.max(0, Math.min(2, vol || 1));
    src.connect(g);
    g.connect(_masterGain);
    src.start(_ac.currentTime + 0.01);
  }

  // ---- Sound events ----

  function sndCueStrike(power) {
    if (!_initAudio()) return;
    _resumeAudio();
    const p = Math.max(0.2, power);
    _play('cueHit', 0.5 + p * 0.7, 0.9 + p * 0.2);
  }

  function sndBallCollide(speed) {
    if (!_initAudio()) return;
    if (!_cooldown('ball', 55)) return;
    const vol = Math.min(1.0, 0.15 + speed * 0.025);
    // Pitch scales slightly with impact speed — harder hit = brighter clack
    const rate = 0.85 + Math.min(speed / 30, 0.4);
    _play('ballHit', vol, rate);
  }

  function sndCushion(speed) {
    if (!_initAudio()) return;
    if (!_cooldown('cushion', 70)) return;
    const vol = Math.min(0.7, 0.1 + speed * 0.02);
    _play('cushion', vol, 0.9 + Math.random() * 0.2);
  }

  function sndPocket() {
    if (!_initAudio()) return;
    _play('pocket', 0.85, 1.0);
  }

  function sndScratch() {
    if (!_initAudio()) return;
    _play('scratch', 0.8, 1.0);
  }

  function sndBreak(power) {
    if (!_initAudio()) return;
    _resumeAudio();
    const p = Math.max(0.5, power);
    _play('breakHit', 0.6 + p * 0.5, 0.9 + p * 0.15);
  }

  function sndWin() {
    if (!_initAudio()) return;
    _play('win', 0.7, 1.0);
  }

  function sndLose() {
    if (!_initAudio()) return;
    _play('lose', 0.6, 1.0);
  }

  function sndCloth(_totalSpeed) {}  // suppressed

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
