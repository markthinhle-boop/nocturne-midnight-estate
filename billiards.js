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
  const BALL_COLORS = {
    0: '#f5ecd7',   // cue
    1: '#f7c948',   // yellow
    2: '#2e5cb8',   // blue
    3: '#c0392b',   // red
    4: '#6c3483',   // purple
    5: '#d35400',   // orange
    6: '#196f3d',   // green
    7: '#7b241c',   // maroon
    8: '#111111',   // eight
    9: '#f7c948',
    10: '#2e5cb8',
    11: '#c0392b',
    12: '#6c3483',
    13: '#d35400',
    14: '#196f3d',
    15: '#7b241c'
  };

  function ballType(n) {
    if (n === 0) return 'cue';
    if (n === 8) return 'eight';
    if (n >= 1 && n <= 7) return 'solid';
    return 'stripe';
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
      mode: mode,                 // 'solo' | 'vs'
      balls: makeRack(),
      // Shot input
      aimX: PLAY_X0 + PLAY_W * 0.28,   // aims toward rack at top of portrait
      aimY: TABLE_H / 2,
      power: 0.5,                 // 0..1
      spinX: 0,                   // -1..1  (side english)
      spinY: 0,                   // -1..1  (top/back)
      // Turn / rules
      turn: 'player',             // 'player' | 'alistair'
      playerGroup: null,          // 'solid' | 'stripe' | null (open table)
      alistairGroup: null,
      openTable: true,
      ballInHand: false,
      gamePhase: 'aiming',        // 'aiming' | 'simulating' | 'gameover' | 'lag'
      firstContact: null,         // first ball cue hit this shot
      pocketedThisShot: [],
      _cueTouchedCushion: 0,
      _ballsToCushion: 0,
      shotClockStart: null,
      shotClockLimit: 45000,
      shotClockExpired: false,
      consecutiveFouls: { player: 0, alistair: 0 },  // 3 consecutive fouls = loss (WPA rule)
      intentionalSafety: false,    // player declared a safety this shot
      winner: null,
      loseReason: null,
      // AI adaptation
      playerStats: {
        shotsTaken: 0,
        shotsMissed: 0,
        ballsSunk: 0,
        scratches: 0,
        skill: 0.5                // 0..1, drives Alistair's aim noise
      },
      // Called pocket (8-ball only)
      calledPocket: null,
      showCallPocket: false,
      // Dialogue
      dialogue: pickLine('preMatch'),
      dialogueTimer: 0,
      // UI
      showHelp: false
    };

    // Place cue ball at "head spot"
    state.balls[0].x = PLAY_X0 + PLAY_W * 0.75;  // bottom of portrait table
    state.balls[0].y = TABLE_H / 2;

    state.shotClockStart = performance.now();
    setTimeout(() => say(mode === 'vs' ? 'preMatch' : null), 100);
  }

  function makeRack() {
    const balls = [];
    // Cue
    balls.push({ id: 0, n: 0, x: 0, y: 0, vx: 0, vy: 0, wx: 0, wy: 0, spinX: 0, spinY: 0, inPlay: true, pocketed: false });
    // Rack triangle at foot spot
    const foot = { x: PLAY_X0 + PLAY_W * 0.28, y: TABLE_H / 2 };  // top of portrait table
    // Standard 8-ball rack: apex, mixed rows, 8 in middle of 3rd row.
    const order = [
      [1],
      [9, 2],
      [3, 8, 10],
      [11, 4, 5, 12],
      [6, 13, 7, 14, 15]
    ];
    const dx = BALL_R * 2 * 0.866 + 0.4;  // horizontal spacing (cos 30)
    const dy = BALL_R * 2 + 0.4;          // vertical spacing
    for (let row = 0; row < order.length; row++) {
      const rowBalls = order[row];
      const rowX = foot.x + row * dx;
      const rowY0 = foot.y - ((rowBalls.length - 1) * dy) / 2;
      for (let i = 0; i < rowBalls.length; i++) {
        balls.push({
          id: balls.length,
          n: rowBalls[i],
          x: rowX,
          y: rowY0 + i * dy,
          vx: 0, vy: 0, wx: 0, wy: 0, spinX: 0, spinY: 0,
          inPlay: true,
          pocketed: false
        });
      }
    }
    return balls;
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

    // 8-ball: if player is on eight, require called pocket
    if (state.turn === 'player' && isOnEight('player') && !state.calledPocket) {
      state.showCallPocket = true;
      render();
      return;
    }

    const dx = state.aimX - cue.x;
    const dy = state.aimY - cue.y;
    const d = Math.hypot(dx, dy) || 1;
    const power = state.power;
    const speed = 4 + power * 22;      // base speed (units/frame)
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
    const pocketed = state.pocketedThisShot;
    const shooter = state.turn;
    const cueBall = state.balls[0];
    const cueScratched = pocketed.some(b => b.n === 0);
    const eightSunk = pocketed.some(b => b.n === 8);

    // Assign groups on first legal pot (not cue, not 8)
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

    // Legal break check (WPA rule: cue ball must contact rack AND 4 balls to cushion or a ball pocketed)
    const isBreakShot = state._isBreakShot;
    if (isBreakShot) {
      const ballsToRail = state._ballsToCushion || 0;
      const ballsPocketed = pocketed.filter(b => b.n !== 0).length;
      if (ballsToRail < 4 && ballsPocketed === 0 && !cueScratched) {
        // Illegal break — rerack, player breaks again (or opponent can choose)
        if (state.mode === 'vs') say('illegalBreak');
        // For now: just treat as foul / re-break option handled by ball-in-hand
      }
      state._isBreakShot = false;
    }

    // Shot clock expiry — if player ran out of time, it's a foul
    if (state.shotClockExpired && shooter === 'player') {
      if (state.mode === 'vs') say('shotClockFoul');
      // Force foul: give ball-in-hand to Alistair
      state.turn = 'alistair';
      state.ballInHand = true;
      state.gamePhase = 'aiming';
      state.shotClockStart = performance.now();
      state.shotClockExpired = false;
      updateAISkill();
      setTimeout(alistairMove, 900 + Math.random() * 800);
      return;
    }

    // 8-ball rules
    if (eightSunk) {
      const shooterOnEight = isOnEight(shooter);
      if (!shooterOnEight) {
        // Pocketed 8 early → shooter loses
        endGame(other(shooter), 'Early eight ball');
        return;
      }
      if (cueScratched) {
        endGame(other(shooter), 'Cue scratch on eight');
        return;
      }
      // On eight, called pocket only matters for player (AI always auto-calls its pocket correctly when legal)
      if (shooter === 'player') {
        const eight = pocketed.find(b => b.n === 8);
        if (state.calledPocket && eight.pocketedAt) {
          const called = POCKETS[state.calledPocket];
          if (Math.hypot(eight.pocketedAt.x - called.x, eight.pocketedAt.y - called.y) > 5) {
            endGame('alistair', 'Wrong pocket on eight');
            return;
          }
        }
      }
      endGame(shooter, 'Eight ball sunk legally');
      return;
    }

    // Determine if shooter pocketed their own color
    const shooterGroup = shooter === 'player' ? state.playerGroup : state.alistairGroup;
    let sankOwn = false;
    let sankOpp = false;
    for (const b of pocketed) {
      if (b.n === 0 || b.n === 8) continue;
      const t = ballType(b.n);
      if (state.openTable) sankOwn = true;
      else if (t === shooterGroup) sankOwn = true;
      else sankOpp = true;
    }

    // Handle scratches and fouls
    let foul = false;
    if (cueScratched) foul = true;
    if (state.firstContact == null) foul = true;        // no contact
    if (!state.openTable && shooterGroup) {
      // First contact must be own group (unless on 8)
      if (state.firstContact != null) {
        const onEight = isOnEight(shooter);
        if (onEight && state.firstContact !== 8) foul = true;
        if (!onEight && state.firstContact === 8) foul = true;
        if (!onEight && state.firstContact !== 8) {
          const t = ballType(state.firstContact);
          if (t !== shooterGroup) foul = true;
        }
      }
    }

    // Three-foul rule (WPA): three consecutive fouls = loss of frame
    if (foul) {
      state.consecutiveFouls[shooter] = (state.consecutiveFouls[shooter] || 0) + 1;
      state.consecutiveFouls[other(shooter)] = 0;  // opponent's streak resets
      if (state.consecutiveFouls[shooter] >= 3 && state.mode === 'vs') {
        say('threeFoulLoss');
        endGame(other(shooter), shooter + ' committed three consecutive fouls');
        return;
      }
      if (state.consecutiveFouls[shooter] === 2 && state.mode === 'vs' && shooter === 'player') {
        say('twoFoulWarning');
      }
    } else {
      state.consecutiveFouls[shooter] = 0;  // legal shot resets streak
    }

    if (shooter === 'player') {
      if (!sankOwn) state.playerStats.shotsMissed++;
      state.playerStats.ballsSunk += pocketed.filter(b => b.n !== 0).length;
      if (cueScratched) state.playerStats.scratches++;
    }

    // Reset cue ball if scratched
    if (cueScratched) {
      cueBall.inPlay = true;
      cueBall.pocketed = false;
      cueBall.x = PLAY_X0 + PLAY_W * 0.75;
      cueBall.y = TABLE_H / 2;
      cueBall.vx = 0; cueBall.vy = 0;
      cueBall.wx = 0; cueBall.wy = 0;
      cueBall.spinX = 0; cueBall.spinY = 0;
    }

    // Dialogue & turn transition
    if (state.mode === 'vs') {
      if (shooter === 'player') {
        if (cueScratched) say('scratchPlayer');
        else if (sankOpp) say('sunkOpponentBall');
        else if (sankOwn) say('sunkPlayerBall');
        else if (pocketed.length === 0) say(foul ? 'missedPlayer' : 'missedPlayer');
        else say('goodShotPlayer');
      } else {
        if (cueScratched) say('scratchAlistair');
        else if (sankOwn) say('goodShotAlistair');
        else say('missedAlistair');
      }
    }

    state.calledPocket = null;
    state.showCallPocket = false;
    state.intentionalSafety = false;  // reset safety declaration for next shot

    // Continue turn if sank own and no foul
    const continueTurn = sankOwn && !foul;
    if (!continueTurn) {
      state.turn = other(shooter);
      state.ballInHand = foul;
    } else {
      state.ballInHand = false;
    }

    // Update AI skill estimate based on player stats
    updateAISkill();

    state.gamePhase = 'aiming';
    state.shotClockStart = performance.now();
    state.shotClockExpired = false;
    state._cueTouchedCushion = 0;
    state._ballsToCushion = 0;

    // If AI turn, schedule move
    if (state.mode === 'vs' && state.turn === 'alistair' && state.gamePhase === 'aiming') {
      setTimeout(alistairMove, 900 + Math.random() * 800);
    }
  }

  function other(t) { return t === 'player' ? 'alistair' : 'player'; }

  function isOnEight(who) {
    const group = who === 'player' ? state.playerGroup : state.alistairGroup;
    if (!group) return false;
    // All of shooter's group must be off the table
    for (const b of state.balls) {
      if (b.n === 0 || b.n === 8) continue;
      if (ballType(b.n) === group && b.inPlay) return false;
    }
    return true;
  }

  let endGameHook = null;  // optional callback: (winner, reason) => void

  function endGame(winner, reason) {
    state.gamePhase = 'gameover';
    state.winner = winner;
    state.loseReason = reason;
    if (state.mode === 'vs') {
      if (winner === 'player') say(reason.includes('Early') || reason.includes('Wrong') || reason.includes('scratch') ? 'alistairLostEight' : 'playerWonEight');
      else say(reason.includes('Eight ball sunk') ? 'alistairWonEight' : 'playerLostEight');
    }
    if (winner === 'player') sndWin(); else sndLose();
    if (endGameHook) endGameHook(winner, reason);
  }

  // ---------- Adaptive AI --------------------------------------------------
  function updateAISkill() {
    const p = state.playerStats;
    if (p.shotsTaken < 2) return;
    const missRate = p.shotsMissed / p.shotsTaken;
    const scratchRate = p.scratches / p.shotsTaken;
    // skill 0 = terrible, 1 = great. Roughly inverse of miss rate, penalised by scratches.
    const s = Math.max(0, Math.min(1, 1 - missRate - scratchRate * 0.3));
    p.skill = p.skill * 0.6 + s * 0.4;
  }

  function alistairMove() {
    if (state.gamePhase !== 'aiming') return;
    if (state.turn !== 'alistair') return;

    const cue = state.balls[0];
    const onEight = isOnEight('alistair');
    const playerSkill = state.playerStats.skill;
    const aiSkill = Math.max(0.3, Math.min(0.95, playerSkill + 0.2));
    const noise = (1 - aiSkill) * 55;

    // Build candidate list
    let candidates = [];
    for (const b of state.balls) {
      if (!b.inPlay || b.n === 0) continue;
      if (onEight && b.n !== 8) continue;
      if (!onEight && b.n === 8) continue;
      if (!onEight && !state.openTable && state.alistairGroup && ballType(b.n) !== state.alistairGroup) continue;
      if (state.openTable && b.n === 8) continue;
      candidates.push(b);
    }
    if (candidates.length === 0) {
      for (const b of state.balls) if (b.inPlay && b.n !== 0) candidates.push(b);
    }

    // Score direct shots
    let best = null;
    for (const ball of candidates) {
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const p = POCKETS[pi];
        const score = scoreShot(cue, ball, p);
        // Position bonus: after potting, how close is cue to next target ball?
        const posScore = _positionScore(cue, ball, p, candidates);
        const totalScore = score + posScore * 0.3;
        if (!best || totalScore > best.score) best = { ball, pocket: p, pi, score: totalScore, type: 'direct' };
      }
    }

    // Bank shots: if best direct shot is poor, try one-cushion banks
    const BANK_THRESHOLD = -200;
    if (!best || best.score < BANK_THRESHOLD) {
      const bankShot = _findBankShot(cue, candidates, aiSkill);
      if (bankShot && bankShot.score > (best ? best.score : -9999)) {
        best = bankShot;
      }
    }

    // Safety play: if all shots are very poor, play a safe
    const SAFETY_THRESHOLD = -400;
    const shouldPlaySafe = (!best || best.score < SAFETY_THRESHOLD) && aiSkill > 0.45 && !onEight;
    if (shouldPlaySafe) {
      _alistairSafety(cue, candidates);
      return;
    }

    // Execute best shot
    let targetX, targetY;
    if (best && best.score > -1000) {
      if (best.type === 'bank') {
        // Aim at cushion point for bank
        targetX = best.railX + (Math.random() - 0.5) * noise * 0.7;
        targetY = best.railY + (Math.random() - 0.5) * noise * 0.7;
      } else {
        const ghost = ghostBall(best.ball, best.pocket);
        targetX = ghost.x + (Math.random() - 0.5) * noise;
        targetY = ghost.y + (Math.random() - 0.5) * noise;
      }
      if (onEight) state.calledPocket = best.pi;
    } else {
      targetX = cue.x + (Math.random() - 0.5) * 400;
      targetY = cue.y + (Math.random() - 0.5) * 200;
    }

    state.aimX = targetX;
    state.aimY = targetY;
    // Power: direct shots get moderate power; bank shots need more; safety gets less
    state.power = best && best.type === 'bank'
      ? 0.6 + Math.random() * 0.25
      : 0.5 + Math.random() * 0.25 + aiSkill * 0.1;
    state.spinX = 0;
    state.spinY = (Math.random() - 0.5) * 0.15;  // slight random back/top spin

    // Position play dialogue
    const myBalls = countGroup('alistair');
    const yourBalls = countGroup('player');
    if (onEight) say('alistairEightApproach');
    else if (myBalls < yourBalls) say('playerLeading');
    else if (yourBalls < myBalls && Math.random() < 0.4) say('alistairLeading');
    else if (best && best.type === 'bank' && Math.random() < 0.5) say('bank');
    else if (Math.random() < 0.2) say('contemplative');

    setTimeout(() => takeShot(), 600 + Math.random() * 400);
  }

  // Position score: reward shots where cue ball ends near the next target
  function _positionScore(cue, ball, pocket, candidates) {
    if (candidates.length <= 1) return 0;
    // Estimate cue ball position after shot — rough: cue continues past ghost ball
    const ghost = ghostBall(ball, pocket);
    const dx = cue.x - ghost.x;
    const dy = cue.y - ghost.y;
    const d = Math.hypot(dx, dy) || 1;
    // Cue ball deflects ~90° from shot direction at equal-mass collision
    // Simplified: estimate cue continues perpendicular to ghost→ball line
    const bToP = { x: pocket.x - ball.x, y: pocket.y - ball.y };
    const bLen = Math.hypot(bToP.x, bToP.y) || 1;
    const perpX = -bToP.y / bLen;
    const perpY = bToP.x / bLen;
    const estimatedCueX = ball.x + perpX * 80;
    const estimatedCueY = ball.y + perpY * 80;
    // Find distance to nearest next candidate
    let minDist = 9999;
    for (const c of candidates) {
      if (c === ball) continue;
      minDist = Math.min(minDist, Math.hypot(estimatedCueX - c.x, estimatedCueY - c.y));
    }
    return Math.max(0, 300 - minDist);  // closer = higher score
  }

  // One-cushion bank shot: bounce off a rail to reach ball→pocket
  function _findBankShot(cue, candidates, aiSkill) {
    let best = null;
    for (const ball of candidates) {
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const p = POCKETS[pi];
        // Try reflecting cue ball aim off each rail
        const banks = _computeBankPoints(cue, ball, p);
        for (const bank of banks) {
          if (!bank) continue;
          // Score: penalize complexity, reward clear path
          const distCueToBounce = Math.hypot(bank.railX - cue.x, bank.railY - cue.y);
          const distBounceToGhost = Math.hypot(bank.railX - bank.ghostX, bank.railY - bank.ghostY);
          const score = -distCueToBounce * 0.4 - distBounceToGhost * 0.5 + aiSkill * 50;
          if (!best || score > best.score) {
            best = { ball, pocket: p, pi, score, type: 'bank', ...bank };
          }
        }
      }
    }
    return best;
  }

  // Compute rail bounce points for a bank shot (cue → rail → ghost ball position)
  function _computeBankPoints(cue, ball, pocket) {
    const ghost = ghostBall(ball, pocket);
    const banks = [];
    // Try all 4 rails
    const rails = [
      { axis: 'x', val: PLAY_X0 + BALL_R, name: 'left' },
      { axis: 'x', val: PLAY_X1 - BALL_R, name: 'right' },
      { axis: 'y', val: PLAY_Y0 + BALL_R, name: 'top' },
      { axis: 'y', val: PLAY_Y1 - BALL_R, name: 'bottom' }
    ];
    for (const rail of rails) {
      let bankPt;
      if (rail.axis === 'x') {
        // Reflect ghost.x across the rail, find intersection on the rail from cue
        const mirrorX = 2 * rail.val - ghost.x;
        const t = (rail.val - cue.x) / (mirrorX - cue.x + 0.0001);
        if (t <= 0 || t >= 1) continue;
        const railY = cue.y + t * (ghost.y - cue.y);
        if (railY < PLAY_Y0 || railY > PLAY_Y1) continue;
        bankPt = { railX: rail.val, railY, ghostX: ghost.x, ghostY: ghost.y };
      } else {
        const mirrorY = 2 * rail.val - ghost.y;
        const t = (rail.val - cue.y) / (mirrorY - cue.y + 0.0001);
        if (t <= 0 || t >= 1) continue;
        const railX = cue.x + t * (ghost.x - cue.x);
        if (railX < PLAY_X0 || railX > PLAY_X1) continue;
        bankPt = { railX, railY: rail.val, ghostX: ghost.x, ghostY: ghost.y };
      }
      banks.push(bankPt);
    }
    return banks;
  }

  // Safety play: Alistair plays a defensive shot
  function _alistairSafety(cue, candidates) {
    // Goal: hide cue ball behind one of player's balls, or leave it as far from
    // player's balls as possible.
    const playerGroup = state.playerGroup;
    const playerBalls = state.balls.filter(b => b.inPlay && b.n !== 0 && b.n !== 8 &&
      (state.openTable || ballType(b.n) === playerGroup));
    // Hit own ball gently toward a rail, send cue to far end of table
    if (candidates.length > 0) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const ghost = ghostBall(target, POCKETS[0]); // arbitrary pocket
      state.aimX = target.x;
      state.aimY = target.y;
      state.power = 0.2 + Math.random() * 0.2;  // gentle
      state.spinX = (Math.random() - 0.5) * 0.3;
      state.spinY = -0.4;  // slight back spin to slow cue after contact
      state.intentionalSafety = true;
      say('safety');
    } else {
      // No target — roll cue to far rail
      state.aimX = PLAY_X0 + PLAY_W * 0.2;
      state.aimY = TABLE_H / 2;
      state.power = 0.25;
    }
    setTimeout(() => takeShot(), 700 + Math.random() * 500);
  }

  function countGroup(who) {
    const g = who === 'player' ? state.playerGroup : state.alistairGroup;
    if (!g) return 7;
    let c = 0;
    for (const b of state.balls) if (b.inPlay && b.n !== 0 && b.n !== 8 && ballType(b.n) === g) c++;
    return c;
  }

  function ghostBall(target, pocket) {
    // Position cue ball should contact ball at, to drive target toward pocket.
    const tx = target.x;
    const ty = target.y;
    const px = pocket.x;
    const py = pocket.y;
    const dx = tx - px;
    const dy = ty - py;
    const d = Math.hypot(dx, dy) || 1;
    return {
      x: tx + (dx / d) * BALL_R * 2,
      y: ty + (dy / d) * BALL_R * 2
    };
  }

  function scoreShot(cue, ball, pocket) {
    // Higher is better. Penalise blocked paths and bad angles.
    const ghost = ghostBall(ball, pocket);
    // Angle between cue→ghost and ball→pocket
    const v1x = ghost.x - cue.x;
    const v1y = ghost.y - cue.y;
    const v2x = pocket.x - ball.x;
    const v2y = pocket.y - ball.y;
    const d1 = Math.hypot(v1x, v1y) || 1;
    const d2 = Math.hypot(v2x, v2y) || 1;
    const cos = (v1x * v2x + v1y * v2y) / (d1 * d2);
    if (cos < 0.2) return -1000;       // impossible cut
    // Check blockers between cue and ghost
    for (const b of state.balls) {
      if (!b.inPlay) continue;
      if (b.id === ball.id || b.n === 0) continue;
      const dist = pointToSegment(b.x, b.y, cue.x, cue.y, ghost.x, ghost.y);
      if (dist < BALL_R * 1.8) return -500;
    }
    // Prefer closer balls and cleaner angles
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
  // All sounds synthesized via Web Audio API. No external files.
  // Mobile-compatible: AudioContext created on first user gesture (pointer down).

  let _ac = null;          // AudioContext
  let _masterGain = null;  // master gain node
  let _audioReady = false;

  // Cooldown timestamps to prevent sound spam from physics loop
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
      _masterGain = _ac.createGain();
      _masterGain.gain.value = 0.7;
      _masterGain.connect(_ac.destination);
      _audioReady = true;
      return true;
    } catch (e) { return false; }
  }

  function _resumeAudio() {
    if (_ac && _ac.state === 'suspended') _ac.resume();
  }

  // Core synthesis helpers
  function _now() { return _ac.currentTime; }

  // Gain envelope: attack/decay/sustain/release
  function _envelope(gainNode, t, a, d, s, r, peak) {
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.linearRampToValueAtTime(peak, t + a);
    gainNode.gain.linearRampToValueAtTime(s * peak, t + a + d);
    gainNode.gain.setValueAtTime(s * peak, t + a + d);
    gainNode.gain.linearRampToValueAtTime(0.0001, t + a + d + r);
  }

  // Filtered noise burst (cushion, scratch, cloth)
  function _noise(durationSec, freqLo, freqHi, vol, t) {
    if (!_ac) return;
    const bufSize = Math.ceil(_ac.sampleRate * durationSec);
    const buf = _ac.createBuffer(1, bufSize, _ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = _ac.createBufferSource();
    src.buffer = buf;
    const bpf = _ac.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = (freqLo + freqHi) / 2;
    bpf.Q.value = (freqLo + freqHi) / (2 * (freqHi - freqLo));
    const g = _ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
    src.connect(bpf);
    bpf.connect(g);
    g.connect(_masterGain);
    src.start(t);
    src.stop(t + durationSec);
  }

  function _tone(freq, durationSec, vol, t, type) {
    if (!_ac) return;
    const osc = _ac.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const g = _ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
    osc.connect(g);
    g.connect(_masterGain);
    osc.start(t);
    osc.stop(t + durationSec + 0.01);
  }

  function _toneSweep(freqStart, freqEnd, durationSec, vol, t, type) {
    if (!_ac) return;
    const osc = _ac.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.linearRampToValueAtTime(freqEnd, t + durationSec);
    const g = _ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
    osc.connect(g);
    g.connect(_masterGain);
    osc.start(t);
    osc.stop(t + durationSec + 0.01);
  }

  // ---- Sound events ----

  // Cue strikes the cue ball. power 0..1.
  function sndCueStrike(power) {
    if (!_initAudio()) return;
    _resumeAudio();
    const t = _now() + 0.01;
    const p = Math.max(0.2, power);
    // Sharp click: noise burst with high-freq bias + short tone
    _noise(0.04, 800, 6000, 0.5 + p * 0.5, t);
    // Thump component — mid-freq body of the impact
    _noise(0.08, 200, 800, 0.3 + p * 0.4, t);
    // Cue tip squeak — very short high tone
    _toneSweep(4200, 2800, 0.025, 0.15 + p * 0.2, t, 'sawtooth');
  }

  // Ball-ball collision. speed = relative impact velocity (0..40ish).
  function sndBallCollide(speed) {
    if (!_initAudio()) return;
    if (!_cooldown('ball', 30)) return;
    const vol = Math.min(0.8, 0.15 + speed * 0.018);
    const t = _now() + 0.005;
    // Ivory clack — two short sine tones, slightly detuned (two balls)
    _tone(2100 + Math.random() * 200, 0.05, vol, t);
    _tone(2300 + Math.random() * 200, 0.04, vol * 0.8, t + 0.005);
    // Mid body for heavier hits
    if (speed > 8) _noise(0.06, 400, 1800, vol * 0.4, t);
  }

  // Ball hits cushion. speed = impact speed.
  function sndCushion(speed) {
    if (!_initAudio()) return;
    if (!_cooldown('cushion', 40)) return;
    const vol = Math.min(0.7, 0.1 + speed * 0.02);
    const t = _now() + 0.005;
    // Low muted thud
    _noise(0.1, 120, 600, vol, t);
    // Slight resonance of the rubber cushion
    _toneSweep(320, 180, 0.08, vol * 0.35, t, 'sine');
  }

  // Ball drops into pocket (not the cue ball).
  function sndPocket() {
    if (!_initAudio()) return;
    const t = _now() + 0.01;
    // Short rolling rumble as ball tumbles into pocket
    _noise(0.12, 200, 900, 0.4, t);
    // Drop thud at the end — satisfying low impact
    _noise(0.18, 60, 300, 0.55, t + 0.10);
    // High click as ball hits the bottom
    _tone(1400, 0.04, 0.25, t + 0.10);
    // Settling: very low fade out
    _noise(0.3, 40, 200, 0.2, t + 0.22);
  }

  // Cue ball scratches — plop + dissonant sting.
  function sndScratch() {
    if (!_initAudio()) return;
    const t = _now() + 0.01;
    // Pocket drop
    _noise(0.12, 200, 900, 0.38, t);
    _noise(0.15, 60, 280, 0.5, t + 0.10);
    // Dissonant sting — "oh no" feel
    _tone(320, 0.3, 0.2, t + 0.12, 'triangle');
    _tone(302, 0.3, 0.2, t + 0.14, 'triangle');
  }

  // Cloth drag — quiet rolling sound as balls decelerate. totalSpeed = sum of all ball speeds.
  function sndCloth(totalSpeed) {
    if (!_initAudio()) return;
    if (!_cooldown('cloth', 80)) return;
    if (totalSpeed < 3) return;
    const vol = Math.min(0.12, totalSpeed * 0.002);
    const t = _now();
    _noise(0.1, 80, 400, vol, t);
  }

  // Win sting — short rising musical phrase.
  function sndWin() {
    if (!_initAudio()) return;
    const t = _now() + 0.1;
    // C major arpeggio: C5, E5, G5, C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      _tone(f, 0.22, 0.25, t + i * 0.12, 'sine');
      _tone(f * 2, 0.12, 0.08, t + i * 0.12, 'sine');  // octave shimmer
    });
    // Final chord sustain
    _tone(523, 0.6, 0.15, t + notes.length * 0.12, 'sine');
    _tone(659, 0.6, 0.12, t + notes.length * 0.12, 'sine');
    _tone(784, 0.6, 0.12, t + notes.length * 0.12, 'sine');
  }

  // Lose sting — falling minor phrase.
  function sndLose() {
    if (!_initAudio()) return;
    const t = _now() + 0.1;
    // A minor descent: A4, F4, E4, A3
    const notes = [440, 349, 330, 220];
    notes.forEach((f, i) => {
      _tone(f, 0.28, 0.2, t + i * 0.14, 'triangle');
    });
    // Low sustain note
    _tone(220, 0.7, 0.18, t + notes.length * 0.14, 'sine');
  }

  // Break shot — heavy version of cue strike.
  function sndBreak(power) {
    if (!_initAudio()) return;
    _resumeAudio();
    const t = _now() + 0.01;
    const p = Math.max(0.5, power);
    _noise(0.06, 600, 8000, 0.7, t);
    _noise(0.12, 150, 700, 0.6, t);
    _toneSweep(5000, 2000, 0.04, 0.3, t, 'sawtooth');
  }

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
    const rackR = BALL_R * BALL_VISUAL_MULT * unitScaleAt(PLAY_X0 + PLAY_W * 0.28, TABLE_H / 2) * 2.5;

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

    // Stripe band (9-15)
    if (b.n >= 9 && b.n <= 15) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.clip();
      const bg = ctx.createRadialGradient(
        c.x - r * 0.35, c.y - r * 0.4, r * 0.1,
        c.x, c.y, r
      );
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(0.6, '#e8dcc3');
      bg.addColorStop(1, '#9e8a62');
      ctx.fillStyle = bg;
      ctx.fillRect(c.x - r, c.y - r * 0.42, r * 2, r * 0.84);
      ctx.restore();
    }

    // Number badge
    if (b.n !== 0) {
      ctx.fillStyle = '#f8f1dc';
      ctx.beginPath();
      ctx.arc(c.x, c.y, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.font = 'bold ' + Math.floor(r * 0.7) + 'px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.n), c.x, c.y + 0.5);
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
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#c9b98a';
      const grp = state.openTable
        ? 'OPEN'
        : (state.playerGroup || '').toUpperCase() + ' vs ' + (state.alistairGroup || '').toUpperCase();
      ctx.fillText(grp, W - 10, 16);
    } else {
      ctx.fillStyle = '#e8dcc3';
      ctx.font = 'italic 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SOLO PRACTICE', W / 2, 16);
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

    // SHOOT button — bottom-left
    const btnW = Math.min(140, W * 0.33);
    const btnH = 52;
    const btnX = 14;
    const btnY = H - btnH - 16;
    ctx.save();
    ctx.fillStyle = '#7c2a1a';
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();
    hud.shoot = { x: btnX, y: btnY, w: btnW, h: btnH };

    // SAFE button — next to SHOOT (declare intentional safety before shooting)
    const safeW = Math.min(100, W * 0.22);
    const safeX = btnX + btnW + 8;
    const safeH = btnH;
    const safeY = btnY;
    ctx.save();
    ctx.fillStyle = state.intentionalSafety ? '#1a4a1a' : '#2a2a18';
    roundRect(ctx, safeX, safeY, safeW, safeH, 8);
    ctx.fill();
    ctx.strokeStyle = state.intentionalSafety ? '#6adc6a' : '#8a8a4a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = state.intentionalSafety ? '#6adc6a' : '#c9b98a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.intentionalSafety ? '✓ SAFE' : 'SAFETY', safeX + safeW / 2, safeY + safeH / 2);
    ctx.restore();
    hud.safe = { x: safeX, y: safeY, w: safeW, h: safeH };

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

    // Spin ball — small circle in middle-bottom showing where the cue tip will strike.
    const sr = 26;
    const scx = btnX + btnW + 18 + sr;
    const scy = btnY + btnH / 2;
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
    if (!state || !state.showCallPocket) return;
    const W = canvas.width, H = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,2,0.65)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f7c948';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAP A POCKET FOR YOUR 8-BALL SHOT', W / 2, 60);
    for (const p of POCKETS) {
      const c = tableToScreen(p.x, p.y);
      const u = unitScaleAt(p.x, p.y);
      ctx.strokeStyle = '#f7c948';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 30 * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGameOverOverlay() {
    if (!state || state.gamePhase !== 'gameover') return;
    const W = canvas.width, H = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,2,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Georgia, serif';
    let title;
    if (state.mode === 'vs') {
      title = state.winner === 'player' ? 'YOU WIN THE FRAME' : 'ALISTAIR WINS THE FRAME';
    } else {
      title = 'RACK COMPLETE';
    }
    ctx.fillText(title, W / 2, H / 2 - 30);
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    if (state.loseReason) ctx.fillText(state.loseReason, W / 2, H / 2);
    ctx.fillStyle = '#f7c948';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('Tap to continue', W / 2, H / 2 + 32);
    ctx.restore();
  }

  // ---------- Screens (mode select, format select, interstitial, match end) ----
  let screenState = 'modeSelect';   // 'modeSelect' | 'formatSelect' | 'game' | 'interstitial' | 'matchEnd'
  const screens = {};

  function drawScreenOverlay() {
    if (screenState === 'modeSelect') drawModeSelect();
    else if (screenState === 'formatSelect') drawFormatSelect();
    else if (screenState === 'interstitial') drawInterstitial();
    else if (screenState === 'matchEnd') drawMatchEnd();
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
    ctx.fillText('THE BILLIARD TABLE', W / 2, tY);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('The felt is honest. Most things in this house are not.', W / 2, tY + 22);
    screens.mode = _stackButtons(tY + 42, [
      { key: 'solo', title: 'SOLO PRACTICE', subtitle: 'Rack. Break. Play at your own pace.', primary: true },
      { key: 'vs',   title: 'CHALLENGE ALISTAIR', subtitle: 'Loser owes a truthful answer.', primary: true },
      { key: 'exit', title: 'LEAVE THE TABLE', subtitle: null, primary: false }
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
      if (hitRect(p.x, p.y, r.solo)) { newGame('solo'); screenState = 'game'; return; }
      if (hitRect(p.x, p.y, r.vs))   { screenState = 'formatSelect'; return; }
      if (hitRect(p.x, p.y, r.exit)) { closeBilliards(); return; }
      return;
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
    // Player cue ball at left half, alistair at right half of head string
    lagState.playerBall  = { x: LAG_HEAD_X, y: PLAY_Y0 + PLAY_H * 0.35, vx: 0, vy: 0, stopped: false, finalDist: null };
    lagState.alistairBall = { x: LAG_HEAD_X, y: PLAY_Y0 + PLAY_H * 0.65, vx: 0, vy: 0, stopped: false, finalDist: null };
    lagState.playerPower = 0.6;
    // Alistair shoots automatically after 0.8s
    setTimeout(() => {
      if (lagState.active && lagState.phase === 'aim') {
        const p = 0.5 + Math.random() * 0.35;  // Alistair's lag power
        lagState.alistairBall.vx = -(1 + p * 18);  // shoot toward far rail (low tx = top of portrait)
        lagState.alistairShot = true;
        if (lagState.playerShot) lagState.phase = 'slide';
      }
    }, 800 + Math.random() * 400);
  }

  function shootLag() {
    if (!lagState.active || lagState.phase !== 'aim' || lagState.playerShot) return;
    lagState.playerBall.vx = -(1 + lagState.playerPower * 18);
    lagState.playerShot = true;
    if (lagState.alistairShot) lagState.phase = 'slide';
    // Alistair shoots too if not yet
    if (!lagState.alistairShot) {
      const p = 0.5 + Math.random() * 0.35;
      lagState.alistairBall.vx = -(1 + p * 18);
      lagState.alistairShot = true;
      lagState.phase = 'slide';
    }
  }

  function stepLag() {
    if (!lagState.active || lagState.phase !== 'slide') return;
    const DT = 1;
    for (const b of [lagState.playerBall, lagState.alistairBall]) {
      if (b.stopped) continue;
      b.x += b.vx * DT;
      b.vx *= 0.984;
      // Bounce off far rail (low x = top of portrait)
      if (b.x < PLAY_X0 + BALL_R) {
        b.x = PLAY_X0 + BALL_R;
        b.vx = -b.vx * 0.72;
      }
      // Stop if near starting end or too slow
      if (Math.abs(b.vx) < 0.06) {
        b.stopped = true;
        // Final distance from near rail (high x = near side)
        b.finalDist = PLAY_X1 - BALL_R - b.x;
        // Penalty if touched near rail (overshot — went past start)
        if (b.x > PLAY_X1 - BALL_R) {
          b.x = PLAY_X1 - BALL_R;
          b.finalDist = 9999;  // disqualified
        }
      }
    }
    // Both stopped — determine winner
    if (lagState.playerBall.stopped && lagState.alistairBall.stopped) {
      const pd = lagState.playerBall.finalDist;
      const ad = lagState.alistairBall.finalDist;
      lagState.winner = pd < ad ? 'player' : 'alistair';
      lagState.phase = 'result';
      lagState.resultTimer = 180;  // frames to show result
      if (lagState.winner === 'player') say('lagWon'); else say('lagLost');
    }
  }

  function drawLag() {
    if (!lagState.active) return;
    const W = canvas.width, H = canvas.height;
    computeView();

    // Background
    const bg = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    bg.addColorStop(0, '#1a0e07'); bg.addColorStop(1, '#050201');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawTable();

    // Draw head string line (dashed)
    const hsLeft  = tableToScreen(LAG_HEAD_X, PLAY_Y0);
    const hsRight = tableToScreen(LAG_HEAD_X, PLAY_Y1);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,220,100,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(hsLeft.x, hsLeft.y);
    ctx.lineTo(hsRight.x, hsRight.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw both lag balls as simple spheres
    for (const [ball, label, color] of [
      [lagState.playerBall, 'YOU', '#f8f1dc'],
      [lagState.alistairBall, 'ALISTAIR', '#1a0e06']
    ]) {
      const s = tableToScreen(ball.x, ball.y);
      const u = unitScaleAt(ball.x, ball.y);
      const r = BALL_R * BALL_VISUAL_MULT * u;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(s.x + r * 0.1, s.y + r * 0.18, r * 1.0, 0, Math.PI * 2);
      ctx.fill();
      // Ball
      const g = ctx.createRadialGradient(s.x - r*0.35, s.y - r*0.4, r*0.1, s.x, s.y, r);
      g.addColorStop(0, color === '#f8f1dc' ? '#fff' : '#4a3020');
      g.addColorStop(1, color === '#f8f1dc' ? '#c9b98a' : '#000');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Label
      ctx.fillStyle = '#e8dcc3';
      ctx.font = '10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, s.x, s.y + r + 12);
      // Final dist label if stopped
      if (ball.stopped && ball.finalDist !== null) {
        const distStr = ball.finalDist >= 9999 ? 'OVER!' : Math.round(ball.finalDist) + 'u';
        ctx.fillStyle = '#f7c948';
        ctx.font = 'bold 11px Georgia, serif';
        ctx.fillText(distStr, s.x, s.y + r + 24);
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(20,12,8,0.88)';
    ctx.fillRect(0, 0, W, 32);
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'italic bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('LAG FOR BREAK', W / 2, 21);

    if (lagState.phase === 'aim') {
      // Power slider for player's lag shot
      const pw = 28, ph = Math.min(200, H * 0.38);
      const px = W - pw - 14, py = H - ph - 80;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      roundRect(ctx, px, py, pw, ph, 5); ctx.fill();
      const fh = ph * lagState.playerPower;
      const pg = ctx.createLinearGradient(0, py + ph, 0, py);
      pg.addColorStop(0, '#f7c948'); pg.addColorStop(1, '#c0392b');
      ctx.fillStyle = pg; ctx.fillRect(px, py + ph - fh, pw, fh);
      ctx.strokeStyle = '#8a6b2e'; ctx.lineWidth = 1; ctx.strokeRect(px, py, pw, ph);
      ctx.fillStyle = '#c9b98a'; ctx.font = '9px Georgia, serif';
      ctx.textAlign = 'center'; ctx.fillText('POWER', px + pw/2, py - 4);

      // SHOOT button
      const sw = Math.min(160, W * 0.38), sh = 52;
      const sx = 14, sy = H - sh - 16;
      ctx.fillStyle = lagState.playerShot ? '#2a2a18' : '#7c2a1a';
      roundRect(ctx, sx, sy, sw, sh, 8); ctx.fill();
      ctx.strokeStyle = '#d9a679'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#f5ecd7'; ctx.font = 'bold 17px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lagState.playerShot ? 'SHOT!' : 'LAG!', sx + sw/2, sy + sh/2);
      lagState._shootBtn = { x: sx, y: sy, w: sw, h: sh };
      lagState._powerBar = { x: px, y: py, w: pw, h: ph };

      ctx.fillStyle = '#c9b98a'; ctx.font = 'italic 12px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Closest to the near rail wins the break', W/2, H - 12);
    }

    if (lagState.phase === 'result') {
      lagState.resultTimer--;
      const won = lagState.winner === 'player';
      ctx.fillStyle = 'rgba(10,5,2,0.82)';
      ctx.fillRect(0, H/2 - 70, W, 140);
      ctx.fillStyle = won ? '#f7c948' : '#ebdab3';
      ctx.font = 'italic bold 22px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(won ? 'YOU WIN THE LAG' : 'ALISTAIR WINS THE LAG', W/2, H/2 - 24);
      ctx.fillStyle = '#c9b98a'; ctx.font = '13px Georgia, serif';
      ctx.fillText(won ? 'You break.' : 'Alistair breaks.', W/2, H/2 + 12);
      ctx.fillStyle = '#8a6b2e'; ctx.font = '11px Georgia, serif';
      ctx.fillText('Tap to continue', W/2, H/2 + 40);
      if (lagState.resultTimer <= 0) {
        // Auto-advance
        finishLag();
      }
    }
  }

  function finishLag() {
    if (!lagState.active) return;
    lagState.active = false;
    const playerBreaks = lagState.winner === 'player';
    // Start actual game
    newGame(state ? state.mode : 'vs');
    if (!playerBreaks) {
      // Alistair breaks
      state.turn = 'alistair';
      setTimeout(alistairMove, 1000);
    }
    // else player breaks — state.turn is already 'player'
  }

  // ---------- Loop --------------------------------------------------------
  function loop() {
    if (!canvas) return;
    if (lagState.active) {
      stepLag();
      drawLag();
    } else if (screenState === 'modeSelect' || screenState === 'formatSelect') {
      computeView();
      drawScreenOverlay();
    } else if (screenState === 'interstitial' || screenState === 'matchEnd') {
      drawScreenOverlay();
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
