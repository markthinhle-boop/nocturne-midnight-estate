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

  const FRICTION = 0.988;         // per-frame velocity decay
  const MIN_SPEED = 0.06;         // below this, ball stops
  const CUSHION_DAMP = 0.78;      // velocity retained after cushion bounce
  const BALL_RESTITUTION = 0.96;  // ball-ball collision elasticity
  const SPIN_FRICTION = 0.94;     // spin decay per frame
  const SPIN_TO_VEL = 0.12;       // how strongly spin curves a rolling ball

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
      aimX: PLAY_X1 - 100,
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
      gamePhase: 'aiming',        // 'aiming' | 'simulating' | 'gameover'
      firstContact: null,         // first ball cue hit this shot
      pocketedThisShot: [],
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
    state.balls[0].x = PLAY_X0 + PLAY_W * 0.25;
    state.balls[0].y = TABLE_H / 2;

    setTimeout(() => say(mode === 'vs' ? 'preMatch' : null), 100);
  }

  function makeRack() {
    const balls = [];
    // Cue
    balls.push({ id: 0, n: 0, x: 0, y: 0, vx: 0, vy: 0, spinX: 0, spinY: 0, inPlay: true, pocketed: false });
    // Rack triangle at foot spot
    const foot = { x: PLAY_X0 + PLAY_W * 0.72, y: TABLE_H / 2 };
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
          vx: 0, vy: 0, spinX: 0, spinY: 0,
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
    // Sound: cue strike (break vs normal shot)
    const isBreak = !state.pocketedThisShot || state.pocketedThisShot.length === 0;
    if (isBreak && state.balls.filter(b => b.inPlay && b.n !== 0).length === 15) {
      sndBreak(state.power);
    } else {
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
    const speed = 4 + power * 22;      // base speed
    cue.vx = (dx / d) * speed;
    cue.vy = (dy / d) * speed;
    // spin becomes lateral/longitudinal after collision
    cue.spinX = state.spinX * 6;
    cue.spinY = state.spinY * 6;

    state.firstContact = null;
    state.pocketedThisShot = [];
    state.gamePhase = 'simulating';
    shotStartTime = performance.now();
    state.playerStats.shotsTaken += state.turn === 'player' ? 1 : 0;
  }

  function step() {
    const balls = state.balls;

    // Integrate
    for (const b of balls) {
      if (!b.inPlay) continue;
      b.x += b.vx;
      b.y += b.vy;
      // Spin influence on direction (slight curve while rolling)
      b.vx += b.spinX * SPIN_TO_VEL * 0.05;
      b.vy += b.spinY * SPIN_TO_VEL * 0.05;
      // Friction
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.spinX *= SPIN_FRICTION;
      b.spinY *= SPIN_FRICTION;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp < MIN_SPEED) { b.vx = 0; b.vy = 0; }
    }

    // Cushions
    for (const b of balls) {
      if (!b.inPlay) continue;
      if (b.x < PLAY_X0 + BALL_R) { b.x = PLAY_X0 + BALL_R; const _cs1 = Math.abs(b.vx); b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; sndCushion(_cs1); }
      if (b.x > PLAY_X1 - BALL_R) { b.x = PLAY_X1 - BALL_R; const _cs2 = Math.abs(b.vx); b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; sndCushion(_cs2); }
      if (b.y < PLAY_Y0 + BALL_R) { b.y = PLAY_Y0 + BALL_R; const _cs3 = Math.abs(b.vy); b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; sndCushion(_cs3); }
      if (b.y > PLAY_Y1 - BALL_R) { b.y = PLAY_Y1 - BALL_R; const _cs4 = Math.abs(b.vy); b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; sndCushion(_cs4); }
    }

    // Ball-ball collisions
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
          // record first contact for foul checking
          if (a.n === 0 && state.firstContact === null) state.firstContact = b.n;
          if (b.n === 0 && state.firstContact === null) state.firstContact = a.n;
          // positional correction
          const overlap = (minD - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          // velocity along normal
          const avn = a.vx * nx + a.vy * ny;
          const bvn = b.vx * nx + b.vy * ny;
          const p = (avn - bvn) * BALL_RESTITUTION;
          a.vx -= p * nx;
          a.vy -= p * ny;
          b.vx += p * nx;
          b.vy += p * ny;
          sndBallCollide(Math.abs(p) * 8);
          // spin transfer on cue ball (English)
          if (a.n === 0) {
            b.vx += a.spinX * 0.4;
            b.vy += a.spinY * 0.4;
            a.spinX *= 0.3;
            a.spinY *= 0.3;
          }
          if (b.n === 0) {
            a.vx += b.spinX * 0.4;
            a.vy += b.spinY * 0.4;
            b.spinX *= 0.3;
            b.spinY *= 0.3;
          }
        }
      }
    }

    // Pocket capture
    for (const b of balls) {
      if (!b.inPlay) continue;
      for (const p of POCKETS) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        if (Math.hypot(dx, dy) < POCKET_CAPTURE_R) {
          b.inPlay = false;
          b.pocketed = true;
          b.vx = 0; b.vy = 0;
          b.pocketedAt = p;
          state.pocketedThisShot.push(b);
          if (b.n === 0) sndScratch(); else sndPocket();
          break;
        }
      }
    }

    // Stop condition: all balls at rest
    let allStopped = true;
    let _totalSpeed = 0;
    for (const b of balls) {
      if (!b.inPlay) continue;
      const _sp = Math.hypot(b.vx, b.vy);
      _totalSpeed += _sp;
      if (_sp > MIN_SPEED) allStopped = false;
    }
    if (_totalSpeed > 0.5) sndCloth(_totalSpeed);

    // Safety timeout
    const elapsed = performance.now() - shotStartTime;
    if (elapsed > 12000) allStopped = true;

    if (allStopped) resolveShot();
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

    if (shooter === 'player') {
      if (!sankOwn) state.playerStats.shotsMissed++;
      state.playerStats.ballsSunk += pocketed.filter(b => b.n !== 0).length;
      if (cueScratched) state.playerStats.scratches++;
    }

    // Reset cue ball if scratched
    if (cueScratched) {
      cueBall.inPlay = true;
      cueBall.pocketed = false;
      cueBall.x = PLAY_X0 + PLAY_W * 0.25;
      cueBall.y = TABLE_H / 2;
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

    // Pick target ball — prefer own group, or any if open table, or 8 if on eight
    const cue = state.balls[0];
    const onEight = isOnEight('alistair');
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
      // Fallback — just hit any ball
      for (const b of state.balls) if (b.inPlay && b.n !== 0) candidates.push(b);
    }

    // For each candidate, find best pocket
    let best = null;
    for (const ball of candidates) {
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const p = POCKETS[pi];
        const score = scoreShot(cue, ball, p);
        if (!best || score > best.score) best = { ball, pocket: p, pi, score };
      }
    }

    // Skill-based noise: worse player → more noise (Alistair adapts to NOT steamroll weak players)
    const playerSkill = state.playerStats.skill;
    // Alistair targets ~player skill + 0.2, clamped. So a weak player gets a slightly-better Alistair, not a lethal one.
    const aiSkill = Math.max(0.3, Math.min(0.95, playerSkill + 0.2));
    const noise = (1 - aiSkill) * 60;  // pixel offset on aim

    // Aim at computed ghost-ball position
    let targetX, targetY;
    if (best && best.score > -1000) {
      const ghost = ghostBall(best.ball, best.pocket);
      targetX = ghost.x + (Math.random() - 0.5) * noise;
      targetY = ghost.y + (Math.random() - 0.5) * noise;
      if (onEight) state.calledPocket = best.pi;
    } else {
      // Defensive random
      targetX = cue.x + (Math.random() - 0.5) * 400;
      targetY = cue.y + (Math.random() - 0.5) * 200;
    }

    state.aimX = targetX;
    state.aimY = targetY;
    state.power = 0.55 + Math.random() * 0.25 + aiSkill * 0.1;
    state.spinX = 0;
    state.spinY = 0;

    // Dialogue — sharpness based on state
    const myBalls = countGroup('alistair');
    const yourBalls = countGroup('player');
    if (onEight) say('alistairEightApproach');
    else if (myBalls < yourBalls) say('playerLeading');
    else if (yourBalls < myBalls && Math.random() < 0.4) say('alistairLeading');
    else if (Math.random() < 0.2) say('contemplative');

    setTimeout(() => takeShot(), 600 + Math.random() * 400);
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
    view.portrait = H > W;

    // Reserve top space for top bar + dialogue, bottom for HUD.
    const topReserve = 84;
    const bottomReserve = 110;

    if (view.portrait) {
      // Long axis (TABLE_W=800) runs vertically. Short axis (TABLE_H=400) runs horizontally.
      // We need to fit (TABLE_W vertically) and (TABLE_H * TILT_FAR_SCALE horizontally at the top, full at the bottom).
      const availW = W - 24;
      const availH = H - topReserve - bottomReserve;
      // Bounded by both axes:
      const sByW = availW / TABLE_H;            // px per table-unit if width is the limiter
      const sByH = availH / TABLE_W;            // px per table-unit if height is the limiter
      view.pxPerUnit = Math.min(sByW, sByH);
      view.boardW = TABLE_H * view.pxPerUnit;   // short axis on screen = horizontal
      view.boardH = TABLE_W * view.pxPerUnit;   // long axis on screen = vertical
      view.boardX = (W - view.boardW) / 2;
      view.boardY = topReserve + (availH - view.boardH) / 2;
    } else {
      // Landscape: long axis horizontal, short axis vertical (default orientation)
      const availW = W - 24;
      const availH = H - topReserve - bottomReserve;
      const sByW = availW / TABLE_W;
      const sByH = availH / TABLE_H;
      view.pxPerUnit = Math.min(sByW, sByH);
      view.boardW = TABLE_W * view.pxPerUnit;
      view.boardH = TABLE_H * view.pxPerUnit;
      view.boardX = (W - view.boardW) / 2;
      view.boardY = topReserve + (availH - view.boardH) / 2;
    }
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

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.setLineDash([5, 7]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cs.x, cs.y);
    ctx.lineTo(aimEnd.x, aimEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);
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
    const btnW = Math.min(160, W * 0.38);
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
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();
    hud.shoot = { x: btnX, y: btnY, w: btnW, h: btnH };

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
      if (hitRect(p.x, p.y, r.bo3)) { newMatch(3); newGame('vs'); screenState = 'game'; return; }
      if (hitRect(p.x, p.y, r.bo5)) { newMatch(5); newGame('vs'); screenState = 'game'; return; }
      if (hitRect(p.x, p.y, r.bo7)) { newMatch(7); newGame('vs'); screenState = 'game'; return; }
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
      if (hitRect(p.x, p.y, r.rematch)) { newMatch(match.format); newGame('vs'); screenState = 'game'; return; }
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

    // Otherwise: tap-to-aim
    const tp = screenToTable(p.x, p.y);
    if (tp.x >= 0) {
      state.aimX = tp.x;
      state.aimY = tp.y;
    }
  }

  function onPointerMove(e) {
    if (!state) return;
    if (e.cancelable) e.preventDefault();
    const p = getEventPoint(e);

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
    if (state.gamePhase === 'aiming' && state.turn === 'player' && !state.ballInHand && !state.showCallPocket) {
      const tp = screenToTable(p.x, p.y);
      if (tp.x >= 0) {
        state.aimX = tp.x;
        state.aimY = tp.y;
      }
    }
  }

  function onPointerUp() {
    powerDragging = false;
    spinDragging = false;
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

  // ---------- Loop --------------------------------------------------------
  function loop() {
    if (!canvas) return;
    if (screenState === 'modeSelect' || screenState === 'formatSelect') {
      computeView();
      drawScreenOverlay();
    } else if (screenState === 'interstitial' || screenState === 'matchEnd') {
      drawScreenOverlay();
    } else if (state) {
      if (state.gamePhase === 'simulating') step();
      // Trigger Alistair's move if it's their turn and aiming phase
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
      // No state, no screen — default to mode select
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
    powerDragging = spinDragging = pullingBack = false;
    window.removeEventListener('resize', fitCanvas);
    window.removeEventListener('orientationchange', fitCanvas);
  }

  window.openBilliards = openBilliards;
  window.closeBilliards = closeBilliards;
})();
