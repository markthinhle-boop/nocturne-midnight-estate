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
    ]
  };

  function pickLine(cat) {
    const arr = DIALOGUE[cat];
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
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
  let tableScale = 1;
  let tableOffsetX = 0;
  let tableOffsetY = 0;

  // HUD regions in SCREEN space
  let hud = {
    shootBtn: null,
    powerBar: null,
    spinBall: null,
    dialogueBox: null
  };

  let modeSelectRegions = null;
  let modeSelectActive = false;

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

    if (state.turn === 'player' && isOnEight('player') && !state.calledPocket && state.calledPocket !== 0) {
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
      if (b.x < PLAY_X0 + BALL_R) { b.x = PLAY_X0 + BALL_R; b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; }
      if (b.x > PLAY_X1 - BALL_R) { b.x = PLAY_X1 - BALL_R; b.vx = -b.vx * CUSHION_DAMP; b.spinX *= 0.5; }
      if (b.y < PLAY_Y0 + BALL_R) { b.y = PLAY_Y0 + BALL_R; b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; }
      if (b.y > PLAY_Y1 - BALL_R) { b.y = PLAY_Y1 - BALL_R; b.vy = -b.vy * CUSHION_DAMP; b.spinY *= 0.5; }
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
          break;
        }
      }
    }

    let allStopped = true;
    for (const b of balls) {
      if (!b.inPlay) continue;
      if (Math.abs(b.vx) > MIN_SPEED || Math.abs(b.vy) > MIN_SPEED) { allStopped = false; break; }
    }

    if (performance.now() - shotStartTime > 12000) allStopped = true;
    if (allStopped) resolveShot();
  }

  function resolveShot() {
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

    if (eightSunk) {
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
        if (cueScratched) say('scratchAlistair');
        else if (sankOwn) say('goodShotAlistair');
        else say('missedAlistair');
      }
    }

    state.calledPocket = null;
    state.showCallPocket = false;

    const continueTurn = sankOwn && !foul;
    if (!continueTurn) {
      state.turn = other(shooter);
      state.ballInHand = foul;
    } else {
      state.ballInHand = false;
    }

    updateAISkill();
    state.gamePhase = 'aiming';

    if (state.mode === 'vs' && state.turn === 'alistair') {
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
    if (state.mode === 'vs') {
      if (winner === 'player') {
        if (reason.indexOf('Early') >= 0 || reason.indexOf('Wrong') >= 0 || reason.indexOf('scratch') >= 0) say('alistairLostEight');
        else say('playerWonEight');
      } else {
        if (reason.indexOf('Eight ball sunk') >= 0) say('alistairWonEight');
        else say('playerLostEight');
      }
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

    const cue = state.balls[0];
    if (state.ballInHand) {
      cue.x = PLAY_X0 + PLAY_W * 0.25;
      cue.y = TABLE_H / 2;
      state.ballInHand = false;
    }

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
      for (const b of state.balls) if (b.inPlay && b.n !== 0) candidates.push(b);
    }

    let best = null;
    for (const ball of candidates) {
      for (let pi = 0; pi < POCKETS.length; pi++) {
        const p = POCKETS[pi];
        const score = scoreShot(cue, ball, p);
        if (!best || score > best.score) best = { ball, pocket: p, pi, score };
      }
    }

    const playerSkill = state.playerStats.skill;
    const aiSkill = Math.max(0.3, Math.min(0.95, playerSkill + 0.2));
    const noise = (1 - aiSkill) * 60;

    let targetX, targetY;
    if (best && best.score > -1000) {
      const ghost = ghostBall(best.ball, best.pocket);
      targetX = ghost.x + (Math.random() - 0.5) * noise;
      targetY = ghost.y + (Math.random() - 0.5) * noise;
      if (onEight) state.calledPocket = best.pi;
    } else {
      targetX = cue.x + (Math.random() - 0.5) * 400;
      targetY = cue.y + (Math.random() - 0.5) * 200;
    }

    state.aimX = targetX;
    state.aimY = targetY;
    state.power = 0.55 + Math.random() * 0.25 + aiSkill * 0.1;
    state.spinX = 0; state.spinY = 0;

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
    const bottomPad = 180;  // dialogue (70) + controls (48) + turn bar (24) + gaps
    const sidePad = 8;

    if (W >= H) {
      viewMode = 'landscape';
      const availW = W - sidePad * 2;
      const availH = H - topPad - bottomPad;
      const sx = availW / TABLE_W;
      const sy = availH / TABLE_H;
      tableScale = Math.min(sx, sy);
      const drawW = TABLE_W * tableScale;
      const drawH = TABLE_H * tableScale;
      tableOffsetX = sidePad + (availW - drawW) / 2;
      tableOffsetY = topPad + (availH - drawH) / 2;
    } else {
      viewMode = 'portrait';
      const availW = W - sidePad * 2;
      const availH = H - topPad - bottomPad;
      // Rotated: table's long axis becomes vertical on screen
      const sx = availW / TABLE_H;       // horizontal fits TABLE_H
      const sy = availH / TABLE_W;       // vertical fits TABLE_W
      tableScale = Math.min(sx, sy);
      const drawW = TABLE_H * tableScale;
      const drawH = TABLE_W * tableScale;
      tableOffsetX = sidePad + (availW - drawW) / 2;
      tableOffsetY = topPad + (availH - drawH) / 2;
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
    const turnLabel = state.mode === 'vs'
      ? (state.turn === 'player' ? 'YOUR TURN' : 'ALISTAIR')
      : 'PRACTICE';
    ctx.fillText(turnLabel, 10, H - indH / 2);
    ctx.textAlign = 'center';
    if (!state.openTable) {
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

  function drawHUD() {
    hud.shootBtn = null;
    hud.powerBar = null;
    hud.spinBall = null;
    if (!state || state.gamePhase !== 'aiming' || state.turn !== 'player') return;
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
    const p = getEventPoint(e);

    if (modeSelectActive) {
      if (!modeSelectRegions) return;
      if (hitRect(p.x, p.y, modeSelectRegions.solo)) {
        modeSelectActive = false;
        newGame('solo');
      } else if (hitRect(p.x, p.y, modeSelectRegions.vs)) {
        modeSelectActive = false;
        newGame('vs');
      } else if (hitRect(p.x, p.y, modeSelectRegions.exit)) {
        closeBilliards();
      }
      return;
    }

    if (!state) return;

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
      const tp = screenToTable(p.x, p.y);
      state.aimX = tp.x;
      state.aimY = tp.y;
    }
  }

  function onPointerMove(e) {
    if (!state) return;
    if (e.cancelable && (powerDragging || spinDragging)) e.preventDefault();
    const p = getEventPoint(e);

    if (powerDragging) { updatePowerFromX(p.x); return; }
    if (spinDragging) { updateSpin(p.x, p.y); return; }

    if (state.gamePhase === 'aiming' && state.turn === 'player' &&
        !state.ballInHand && !state.showCallPocket) {
      if (hitRect(p.x, p.y, hud.shootBtn)) return;
      if (hitRect(p.x, p.y, hud.powerBar)) return;
      if (hitCircle(p.x, p.y, hud.spinBall)) return;
      if (hud.dialogueBox && hitRect(p.x, p.y, hud.dialogueBox)) return;
      const tp = screenToTable(p.x, p.y);
      state.aimX = tp.x;
      state.aimY = tp.y;
    }
  }

  function onPointerUp() {
    powerDragging = false;
    spinDragging = false;
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

  // ---------- Loop ---------------------------------------------------------
  function loop() {
    if (!canvas) return;
    if (modeSelectActive) {
      drawModeSelect();
    } else if (state) {
      if (state.gamePhase === 'simulating') step();
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
