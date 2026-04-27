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
  let canvas = null;
  let ctx = null;
  let modal = null;
  let scaleFactor = 1;
  let rafId = null;
  let shotStartTime = 0;

  function newGame(mode) {
    state = {
      mode: mode,                 // 'solo' | 'vs'
      balls: makeRack(),
      // Shot input
      aimX: PLAY_X1 - 100,
      aimY: TABLE_H / 2,
      power: 0.5,                 // 0..1
      pullBack: 0,                // visual stick pull-back distance (table units), 0 when not pulling
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
      if (b.x < PLAY_X0 + BALL_R) { b.x = PLAY_X0 + BALL_R; b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; }
      if (b.x > PLAY_X1 - BALL_R) { b.x = PLAY_X1 - BALL_R; b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; }
      if (b.y < PLAY_Y0 + BALL_R) { b.y = PLAY_Y0 + BALL_R; b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; }
      if (b.y > PLAY_Y1 - BALL_R) { b.y = PLAY_Y1 - BALL_R; b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; }
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
          break;
        }
      }
    }

    // Stop condition: all balls at rest
    let allStopped = true;
    for (const b of balls) {
      if (!b.inPlay) continue;
      if (Math.abs(b.vx) > MIN_SPEED || Math.abs(b.vy) > MIN_SPEED) { allStopped = false; break; }
    }

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

  function endGame(winner, reason) {
    state.gamePhase = 'gameover';
    state.winner = winner;
    state.loseReason = reason;
    if (state.mode === 'vs') {
      if (winner === 'player') say(reason.includes('Early') || reason.includes('Wrong') || reason.includes('scratch') ? 'alistairLostEight' : 'playerWonEight');
      else say(reason.includes('Eight ball sunk') ? 'alistairWonEight' : 'playerLostEight');
    }
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
    state.dialogueTimer = 260;
    render();
  }

  // ---------- Rendering ----------------------------------------------------
  function render() {
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Compute scale to fit TABLE_W x TABLE_H in canvas
    const sx = W / TABLE_W;
    const sy = H / TABLE_H;
    scaleFactor = Math.min(sx, sy);
    const ox = (W - TABLE_W * scaleFactor) / 2;
    const oy = (H - TABLE_H * scaleFactor) / 2;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scaleFactor, scaleFactor);

    // Felt
    const grad = ctx.createRadialGradient(TABLE_W/2, TABLE_H/2, 40, TABLE_W/2, TABLE_H/2, TABLE_W/1.2);
    grad.addColorStop(0, '#7c2a1a');
    grad.addColorStop(1, '#4a1808');
    ctx.fillStyle = grad;
    ctx.fillRect(PLAY_X0, PLAY_Y0, PLAY_W, PLAY_H);

    // Rails
    ctx.fillStyle = '#2a1206';
    ctx.fillRect(0, 0, TABLE_W, RAIL);
    ctx.fillRect(0, TABLE_H - RAIL, TABLE_W, RAIL);
    ctx.fillRect(0, 0, RAIL, TABLE_H);
    ctx.fillRect(TABLE_W - RAIL, 0, RAIL, TABLE_H);

    // Pockets
    for (const p of POCKETS) {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // Balls (shadows first)
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

    // Aim line (only during aiming, player turn)
    if (state.gamePhase === 'aiming' && state.turn === 'player' && state.mode !== 'demo') {
      const cue = state.balls[0];
      if (cue.inPlay) {
        // Aim line — dashed, projects from cue ball toward aim point
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(state.aimX, state.aimY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cue stick — elegant maple/leather/tip rendering
        const dx = state.aimX - cue.x;
        const dy = state.aimY - cue.y;
        const d = Math.hypot(dx, dy) || 1;
        const ux = dx / d, uy = dy / d;

        // Pull-back: when player is dragging, stick pulls back from cue ball.
        // pullBack is a separate visual offset from "back" (which is power-driven).
        const pullDist = state.pullBack || 0;        // current drag pull-back in table units
        const back = BALL_R + 4 + pullDist;          // gap between cue ball tip and stick tip
        const len = 160;                              // stick length
        const ferruleLen = 8;                         // white ferrule below tip
        const wrapLen = 30;                           // leather wrap section
        const buttLen = 24;                           // black butt cap

        // Stick is rendered in 4 segments along the line BEHIND the cue ball:
        //   tip (white ferrule) → maple shaft → leather wrap → black butt
        // We render BACK along (-ux, -uy) direction.
        const tipX = cue.x - ux * back;
        const tipY = cue.y - uy * back;

        // Position helper: distance from tip along stick
        function stickPt(distFromTip) {
          return { x: tipX - ux * distFromTip, y: tipY - uy * distFromTip };
        }

        // Shadow under stick
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(tipX + 1.5, tipY + 2.5);
        const tail = stickPt(len);
        ctx.lineTo(tail.x + 1.5, tail.y + 2.5);
        ctx.stroke();
        ctx.restore();

        // Tip (white ferrule, very short)
        const ferruleEnd = stickPt(ferruleLen);
        ctx.strokeStyle = '#f5ecd7';
        ctx.lineWidth = 3.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(ferruleEnd.x, ferruleEnd.y);
        ctx.stroke();

        // Maple shaft — light wood with subtle gradient
        const shaftEnd = stickPt(len - wrapLen - buttLen);
        const shaftGrad = ctx.createLinearGradient(ferruleEnd.x, ferruleEnd.y - 3, ferruleEnd.x, ferruleEnd.y + 3);
        shaftGrad.addColorStop(0, '#e8c890');
        shaftGrad.addColorStop(0.5, '#d4a868');
        shaftGrad.addColorStop(1, '#9a7438');
        ctx.strokeStyle = shaftGrad;
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(ferruleEnd.x, ferruleEnd.y);
        ctx.lineTo(shaftEnd.x, shaftEnd.y);
        ctx.stroke();

        // Leather wrap — darker, slightly thicker
        const wrapEnd = stickPt(len - buttLen);
        ctx.strokeStyle = '#3a1f10';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(shaftEnd.x, shaftEnd.y);
        ctx.lineTo(wrapEnd.x, wrapEnd.y);
        ctx.stroke();
        // Wrap stitching detail (cross-hatch lines)
        ctx.strokeStyle = 'rgba(150,110,60,0.5)';
        ctx.lineWidth = 0.6;
        for (let s = 0; s < 6; s++) {
          const sp = stickPt(len - buttLen - wrapLen + (s + 0.5) * (wrapLen / 6));
          ctx.beginPath();
          ctx.moveTo(sp.x - uy * 2.5, sp.y + ux * 2.5);
          ctx.lineTo(sp.x + uy * 2.5, sp.y - ux * 2.5);
          ctx.stroke();
        }

        // Butt cap — black with brass ring
        const buttEnd = stickPt(len);
        ctx.strokeStyle = '#1a0e06';
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.moveTo(wrapEnd.x, wrapEnd.y);
        ctx.lineTo(buttEnd.x, buttEnd.y);
        ctx.stroke();
        // Brass ring at wrap/butt junction
        ctx.fillStyle = '#d9a679';
        ctx.beginPath();
        ctx.arc(wrapEnd.x, wrapEnd.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Highlight along the top of the shaft (specular)
        ctx.strokeStyle = 'rgba(255,235,180,0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(ferruleEnd.x - uy * 1, ferruleEnd.y + ux * 1);
        ctx.lineTo(shaftEnd.x - uy * 1, shaftEnd.y + ux * 1);
        ctx.stroke();
      }
    }

    // Called pocket marker
    if (state.calledPocket != null) {
      const p = POCKETS[state.calledPocket];
      ctx.strokeStyle = '#f7c948';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // ---------- Overlay UI (in screen space) -------------------------------
    drawOverlay();
  }

  function drawBall(b) {
    const c = BALL_COLORS[b.n];
    ctx.save();
    // Base color
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    if (b.n >= 9 && b.n <= 15) {
      // Stripe: white band top and bottom
      ctx.fillStyle = '#f5ecd7';
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, Math.PI * 0.85, Math.PI * 0.15, true);
      ctx.arc(b.x, b.y, BALL_R, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.closePath();
      // Simpler: draw two caps
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#f5ecd7';
      ctx.fillRect(b.x - BALL_R, b.y - BALL_R, BALL_R * 2, BALL_R * 0.45);
      ctx.fillRect(b.x - BALL_R, b.y + BALL_R * 0.55, BALL_R * 2, BALL_R * 0.45);
    }
    // Number circle
    if (b.n !== 0) {
      ctx.fillStyle = '#f5ecd7';
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.n), b.x, b.y + 1);
    }
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(b.x - BALL_R * 0.35, b.y - BALL_R * 0.35, BALL_R * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawOverlay() {
    // Dialogue bubble (vs mode)
    if (state.mode === 'vs' && state.dialogue && state.dialogueTimer > 0) {
      const W = canvas.width;
      const text = state.dialogue;
      ctx.save();
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const maxW = Math.min(W - 24, 380);
      const lines = wrapText(text, maxW - 20);
      const boxH = 12 + lines.length * 17;
      const boxW = maxW;
      const bx = 12;
      const by = 12;
      ctx.fillStyle = 'rgba(20,12,8,0.82)';
      ctx.strokeStyle = 'rgba(210,170,110,0.55)';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ebdab3';
      ctx.font = 'italic bold 11px Georgia, serif';
      ctx.fillText('ALISTAIR', bx + 10, by + 4);
      ctx.fillStyle = '#e8dcc3';
      ctx.font = '13px Georgia, serif';
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], bx + 10, by + 20 + i * 17);
      }
      ctx.restore();
      state.dialogueTimer--;
    }

    // Turn indicator + groups
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    ctx.font = '12px Georgia, serif';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(20,12,8,0.78)';
    ctx.fillRect(0, H - 28, W, 28);
    ctx.fillStyle = '#e8dcc3';
    ctx.textAlign = 'left';
    const turnLabel = state.mode === 'vs'
      ? (state.turn === 'player' ? 'YOUR TURN' : 'ALISTAIR')
      : 'PRACTICE';
    ctx.fillText(turnLabel, 10, H - 9);
    if (!state.openTable) {
      const pg = state.playerGroup ? state.playerGroup.toUpperCase() : '';
      const ag = state.alistairGroup ? state.alistairGroup.toUpperCase() : '';
      ctx.textAlign = 'center';
      ctx.fillText(`You: ${pg}   |   Alistair: ${ag}`, W / 2, H - 9);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText('OPEN TABLE', W / 2, H - 9);
    }
    if (state.ballInHand && state.turn === 'player') {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f7c948';
      ctx.fillText('BALL IN HAND — tap to place cue ball', W - 10, H - 9);
    }
    ctx.restore();

    // Call pocket prompt
    if (state.showCallPocket) {
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,8,0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f7c948';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('TAP A POCKET TO CALL YOUR EIGHT-BALL SHOT', canvas.width / 2, canvas.height / 2);
      // Highlight pockets
      ctx.translate((canvas.width - TABLE_W * scaleFactor) / 2, (canvas.height - TABLE_H * scaleFactor) / 2);
      ctx.scale(scaleFactor, scaleFactor);
      for (const p of POCKETS) {
        ctx.strokeStyle = '#f7c948';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_R + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Game over
    if (state.gamePhase === 'gameover') {
      ctx.save();
      ctx.fillStyle = 'rgba(10,6,4,0.88)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ebdab3';
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px Georgia, serif';
      const title = state.mode === 'vs'
        ? (state.winner === 'player' ? 'YOU WIN' : 'ALISTAIR WINS')
        : 'RACK COMPLETE';
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = 'italic 13px Georgia, serif';
      ctx.fillStyle = '#c9b98a';
      ctx.fillText(state.loseReason || '', canvas.width / 2, canvas.height / 2 + 6);
      ctx.fillStyle = '#f7c948';
      ctx.font = '12px Georgia, serif';
      ctx.fillText('Tap to play again  ·  Long-press to exit', canvas.width / 2, canvas.height / 2 + 34);
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
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
  function canvasToTable(x, y) {
    const W = canvas.width;
    const H = canvas.height;
    const sx = W / TABLE_W;
    const sy = H / TABLE_H;
    const s = Math.min(sx, sy);
    const ox = (W - TABLE_W * s) / 2;
    const oy = (H - TABLE_H * s) / 2;
    return { x: (x - ox) / s, y: (y - oy) / s };
  }

  // Cue strike animation — thrust the stick forward, then fire.
  // Plays the visual loaded-shot animation: pullBack → 0 over ~140ms, then callback.
  function animateCueStrike(onComplete) {
    if (!state) { onComplete && onComplete(); return; }
    const start = state.pullBack || 0;
    const duration = 140;  // ms
    const t0 = performance.now();
    function frame() {
      const now = performance.now();
      const t = Math.min(1, (now - t0) / duration);
      // Ease-in cubic — slow start, fast strike
      const eased = t * t * t;
      state.pullBack = start * (1 - eased);
      render();
      if (t < 1) requestAnimationFrame(frame);
      else onComplete && onComplete();
    }
    frame();
  }

  let powerDragging = false;
  let spinDragging = false;
  let pressTimer = null;

  // Drag-pull-back state — used for the "draw the bowstring" cue control.
  // When the player presses near the cue ball, we enter pullingBack mode:
  //   - direction of pull (from cue ball outward) sets aim (cue will travel OPPOSITE)
  //   - distance of pull sets power
  //   - release fires the shot
  let pullingBack = false;
  let pullStartCueX = 0, pullStartCueY = 0;  // cue ball position at start
  const PULL_GRAB_RADIUS = 70;  // table units — must press within this of cue ball
  const PULL_MIN_FIRE = 25;      // table units — minimum pull to actually fire on release
  const PULL_MAX = 220;          // table units — pull distance that maps to power=1.0

  function bindInput() {
    const pointerDown = (e) => {
      if (!state) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      const pt = canvasToTable(x, y);

      // Game over → restart
      if (state.gamePhase === 'gameover') {
        newGame(state.mode);
        render();
        return;
      }

      // Call pocket
      if (state.showCallPocket) {
        let nearest = -1, nd = 999;
        for (let i = 0; i < POCKETS.length; i++) {
          const d = Math.hypot(pt.x - POCKETS[i].x, pt.y - POCKETS[i].y);
          if (d < nd) { nd = d; nearest = i; }
        }
        if (nd < POCKET_R + 30) {
          state.calledPocket = nearest;
          state.showCallPocket = false;
          render();
          setTimeout(takeShot, 150);
        }
        return;
      }

      // Ball in hand placement
      if (state.ballInHand && state.turn === 'player' && state.gamePhase === 'aiming') {
        if (pt.x > PLAY_X0 + BALL_R && pt.x < PLAY_X1 - BALL_R &&
            pt.y > PLAY_Y0 + BALL_R && pt.y < PLAY_Y1 - BALL_R) {
          // Check not overlapping another ball
          let ok = true;
          for (const b of state.balls) {
            if (!b.inPlay || b.n === 0) continue;
            if (Math.hypot(pt.x - b.x, pt.y - b.y) < BALL_R * 2 + 1) { ok = false; break; }
          }
          if (ok) {
            const cue = state.balls[0];
            cue.x = pt.x;
            cue.y = pt.y;
            state.ballInHand = false;
            render();
            return;
          }
        }
      }

      if (state.gamePhase !== 'aiming' || state.turn !== 'player') return;

      // Power slider region (right edge)
      if (x > canvas.width - 60) {
        powerDragging = true;
        updatePowerFromY(y);
        return;
      }
      // Spin region (bottom-right ball overlay)
      const spinCx = canvas.width - 90;
      const spinCy = canvas.height - 90;
      if (Math.hypot(x - spinCx, y - spinCy) < 32) {
        spinDragging = true;
        updateSpin(x, y, spinCx, spinCy);
        return;
      }

      // Check: did the player press NEAR the cue ball? If so, start drag-pull-back.
      const cueBall = state.balls[0];
      if (cueBall && cueBall.inPlay) {
        const distToCue = Math.hypot(pt.x - cueBall.x, pt.y - cueBall.y);
        if (distToCue < PULL_GRAB_RADIUS) {
          pullingBack = true;
          pullStartCueX = cueBall.x;
          pullStartCueY = cueBall.y;
          state.pullBack = 0;
          // Set initial aim: cue will travel OPPOSITE to where the player pressed.
          // i.e., player pressed behind the cue ball relative to target → cue goes toward target.
          if (distToCue > 1) {
            state.aimX = cueBall.x - (pt.x - cueBall.x) * 5;  // mirror & extend
            state.aimY = cueBall.y - (pt.y - cueBall.y) * 5;
          }
          render();
          return;
        }
      }

      // Otherwise: tap-to-aim (existing behavior)
      state.aimX = pt.x;
      state.aimY = pt.y;
      render();
    };

    const pointerMove = (e) => {
      if (!state) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      if (powerDragging) { updatePowerFromY(y); return; }
      if (spinDragging) {
        updateSpin(x, y, canvas.width - 90, canvas.height - 90);
        return;
      }
      // Pull-back drag — finger pulled away from cue ball
      if (pullingBack) {
        const pt = canvasToTable(x, y);
        const dx = pt.x - pullStartCueX;
        const dy = pt.y - pullStartCueY;
        const pullDist = Math.hypot(dx, dy);
        if (pullDist > 0.5) {
          // Aim direction: mirror across cue ball.
          // Whatever side of the cue ball the finger is on, the shot goes the OTHER side.
          // We extend the aim point far away so direction is stable even at small pull distances.
          const ux = -dx / pullDist;  // unit vector pointing AWAY from finger (toward shot direction)
          const uy = -dy / pullDist;
          state.aimX = pullStartCueX + ux * 300;
          state.aimY = pullStartCueY + uy * 300;
        }
        // Pull-back visual offset = clamped pull distance
        state.pullBack = Math.min(pullDist, PULL_MAX);
        // Power = how far we've pulled, 0..1
        state.power = Math.min(1, pullDist / PULL_MAX);
        render();
        return;
      }
      if (state.gamePhase === 'aiming' && state.turn === 'player' && !state.ballInHand && !state.showCallPocket) {
        const pt = canvasToTable(x, y);
        state.aimX = pt.x;
        state.aimY = pt.y;
        render();
      }
    };

    const pointerUp = () => {
      powerDragging = false;
      spinDragging = false;
      // Pull-back release — fire if pulled past minimum, else cancel
      if (pullingBack) {
        const pulled = state.pullBack || 0;
        pullingBack = false;
        if (pulled >= PULL_MIN_FIRE) {
          // Animate the cue stick snapping forward into the cue ball, then take shot.
          animateCueStrike(() => {
            state.pullBack = 0;
            takeShot();
          });
        } else {
          // Cancel — pulled too short, just reset visual
          state.pullBack = 0;
          render();
        }
      }
    };

    canvas.addEventListener('mousedown', pointerDown);
    canvas.addEventListener('mousemove', pointerMove);
    canvas.addEventListener('mouseup', pointerUp);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); pointerDown(e); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); pointerMove(e); }, { passive: false });
    canvas.addEventListener('touchend', pointerUp);
  }

  function updatePowerFromY(y) {
    const top = 40;
    const bot = canvas.height - 50;
    const t = Math.max(0, Math.min(1, (bot - y) / (bot - top)));
    state.power = t;
    render();
  }

  function updateSpin(x, y, cx, cy) {
    const dx = (x - cx) / 28;
    const dy = (y - cy) / 28;
    const d = Math.hypot(dx, dy);
    const clamped = d > 1 ? 1 / d : 1;
    state.spinX = dx * clamped;
    state.spinY = dy * clamped;
    render();
  }

  // ---------- HUD controls drawing (power bar, spin, shoot) ---------------
  function drawHUD() {
    if (!state || state.gamePhase !== 'aiming' || state.turn !== 'player') return;
    ctx.save();
    // Power bar
    const bx = canvas.width - 50;
    const by = 40;
    const bw = 22;
    const bh = canvas.height - 100;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx, by, bw, bh);
    const fillH = bh * state.power;
    const pg = ctx.createLinearGradient(bx, by + bh - fillH, bx, by + bh);
    pg.addColorStop(0, '#f7c948');
    pg.addColorStop(1, '#c0392b');
    ctx.fillStyle = pg;
    ctx.fillRect(bx, by + bh - fillH, bw, fillH);
    ctx.strokeStyle = '#8a6b2e';
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('POWER', bx + bw / 2, by - 6);

    // Spin ball
    const cx = canvas.width - 90;
    const cy = canvas.height - 90;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6b2e';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(cx + state.spinX * 20, cy + state.spinY * 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', cx, cy - 40);

    // Shoot button
    const shootW = 100, shootH = 40;
    const sx = 20;
    const sy = canvas.height - 70;
    ctx.fillStyle = '#7c2a1a';
    roundRect(ctx, sx, sy, shootW, shootH, 6);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', sx + shootW / 2, sy + shootH / 2);

    state._shootBtn = { x: sx, y: sy, w: shootW, h: shootH };
    ctx.restore();
  }

  // Extend input to detect shoot button and mode buttons
  const origBind = bindInput;
  bindInput = function () {
    origBind();
    canvas.addEventListener('mousedown', onHudTap);
    canvas.addEventListener('touchstart', onHudTap, { passive: false });
  };

  function onHudTap(e) {
    if (!state) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    // Shoot button
    const sb = state._shootBtn;
    if (sb && x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
      if (state.gamePhase === 'aiming' && state.turn === 'player' && !state.ballInHand) {
        takeShot();
      }
    }
  }

  // ---------- Main loop ----------------------------------------------------
  function loop() {
    if (!state) return;
    if (state.gamePhase === 'simulating') {
      step();
    }
    render();
    drawHUD();
    rafId = requestAnimationFrame(loop);
  }

  // ---------- Mode select screen ------------------------------------------
  function drawModeSelect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background
    const g = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 40, canvas.width/2, canvas.height/2, canvas.width);
    g.addColorStop(0, '#2a1206');
    g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 22px Georgia, serif';
    ctx.fillText('THE BILLIARD TABLE', canvas.width / 2, 52);
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('The felt is honest. Most things in this house are not.', canvas.width / 2, 78);

    const W = canvas.width;
    const H = canvas.height;
    const cw = Math.min(280, W - 60);
    const cx = W / 2 - cw / 2;
    const btnH = 72;
    const smallH = 44;
    const gap = 10;

    // Stack 3 buttons centered vertically in available space below the subtitle (~90px)
    const totalStack = btnH + gap + btnH + gap + smallH;
    const stackTop = 90 + Math.max(0, (H - 90 - totalStack - 20) / 2);
    const soloY = stackTop;
    const vsY = soloY + btnH + gap;
    const exitY = vsY + btnH + gap;

    // Solo button
    ctx.fillStyle = '#4a1808';
    roundRect(ctx, cx, soloY, cw, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('SOLO PRACTICE', W / 2, soloY + 28);
    ctx.fillStyle = '#c9b98a';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillText('Rack. Break. Play at your own pace.', W / 2, soloY + 50);

    // Vs Alistair
    ctx.fillStyle = '#4a1808';
    roundRect(ctx, cx, vsY, cw, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#d9a679';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd7';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('CHALLENGE ALISTAIR', W / 2, vsY + 28);
    ctx.fillStyle = '#c9b98a';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillText('A game, then. Loser owes a truthful answer.', W / 2, vsY + 50);

    // Exit
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.strokeStyle = '#8a6b2e';
    roundRect(ctx, cx, exitY, cw, smallH, 6);
    ctx.stroke();
    ctx.fillStyle = '#c9b98a';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('LEAVE THE TABLE', W / 2, exitY + 28);

    modeSelectRegions = {
      solo: { x: cx, y: soloY, w: cw, h: btnH },
      vs:   { x: cx, y: vsY,   w: cw, h: btnH },
      exit: { x: cx, y: exitY, w: cw, h: smallH }
    };
  }

  let modeSelectRegions = null;
  let modeSelectActive = false;

  function hitRegion(x, y, r) {
    return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function onModeSelectTap(e) {
    if (!modeSelectActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    if (hitRegion(x, y, modeSelectRegions.solo)) {
      modeSelectActive = false;
      newGame('solo');
      loop();
      return;
    }
    if (hitRegion(x, y, modeSelectRegions.vs)) {
      modeSelectActive = false;
      newGame('vs');
      loop();
      return;
    }
    if (hitRegion(x, y, modeSelectRegions.exit)) {
      closeBilliards();
    }
  }

  // ---------- Public: open / close ----------------------------------------
  function openBilliards() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'nocturne-billiards';
    modal.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9999',
      'background:rgba(5,3,2,0.96)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column'
    ].join(';');

    // Close button
    const close = document.createElement('button');
    close.textContent = '× CLOSE';
    close.style.cssText = [
      'position:absolute',
      'top:12px',
      'right:12px',
      'background:rgba(40,20,10,0.8)',
      'color:#ebdab3',
      'border:1px solid #8a6b2e',
      'padding:6px 12px',
      'font-family:Georgia, serif',
      'font-size:12px',
      'cursor:pointer',
      'z-index:2'
    ].join(';');
    close.addEventListener('click', closeBilliards);

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;max-width:100vw;max-height:100vh;touch-action:none';
    modal.appendChild(canvas);
    modal.appendChild(close);
    document.body.appendChild(modal);

    fitCanvas();
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', fitCanvas);

    // Mode select
    modeSelectActive = true;
    drawModeSelect();
    canvas.addEventListener('mousedown', onModeSelectTap);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onModeSelectTap(e); }, { passive: false });

    // Main input
    bindInput();
  }

  function fitCanvas() {
    if (!canvas) return;
    const maxW = Math.min(window.innerWidth - 16, 900);
    const maxH = Math.min(window.innerHeight - 16, 500);
    // Keep aspect close to 2:1
    let w = maxW;
    let h = w / 2;
    if (h > maxH) { h = maxH; w = h * 2; }
    canvas.width = Math.floor(w);
    canvas.height = Math.floor(h);
    if (modeSelectActive) drawModeSelect();
    else if (state) render();
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
    window.removeEventListener('resize', fitCanvas);
  }

  // Expose
  window.openBilliards = openBilliards;
  window.closeBilliards = closeBilliards;

})();
