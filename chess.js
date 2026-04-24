/* ============================================================================
 * NOCTURNE: MIDNIGHT ESTATE — CHESS WITH GREAVES
 * Real chess (Stockfish WASM engine) vs Greaves in the library.
 * Bo3/5/7 match format, time control, dossier that persists across sessions.
 *
 * Mount: tap chess-board hotspot in Library → openChess()
 * Deps:  public/stockfish.js + public/stockfish.wasm (loaded lazily)
 * ========================================================================= */
(function () {
  'use strict';

  // ---------- Piece/board constants --------------------------------------
  // Board uses 0x88 internally for move generation, but we expose 8x8 [file,rank].
  // We store the board as a flat array of 64 squares: index = rank * 8 + file.
  //   file 0 = a, rank 0 = 1 (white's back rank)
  //   file 7 = h, rank 7 = 8 (black's back rank)
  // Piece codes:
  //   Empty:  null
  //   White:  'P','N','B','R','Q','K'
  //   Black:  'p','n','b','r','q','k'

  const FILES = ['a','b','c','d','e','f','g','h'];

  function sq(file, rank) { return rank * 8 + file; }
  function fileOf(i) { return i & 7; }
  function rankOf(i) { return i >> 3; }
  function sqName(i) { return FILES[fileOf(i)] + (rankOf(i) + 1); }
  function parseSq(name) {
    if (!name || name.length !== 2) return -1;
    const f = FILES.indexOf(name[0]);
    const r = parseInt(name[1], 10) - 1;
    if (f < 0 || r < 0 || r > 7) return -1;
    return sq(f, r);
  }

  function isWhite(p) { return p && p >= 'A' && p <= 'Z'; }
  function isBlack(p) { return p && p >= 'a' && p <= 'z'; }
  function colorOf(p) { return !p ? null : (isWhite(p) ? 'w' : 'b'); }
  function pieceType(p) { return p ? p.toLowerCase() : null; }

  // Starting position (white at bottom)
  const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // ---------- Dialogue: The Baron, 180+ lines ----------------------------
  // Voice: philosophical, weighted, aristocratic, patient. Every phrase is
  // a comment on power, patience, inevitability, time. He does not joke.
  // He rarely rushes. When moved, it is not emotional — it is recognition.
  const DIALOGUE = {
    preMatch: [
      "Ah, Grey! Come in. Please, sit. I was hoping someone might fancy a game.",
      "You play? Wonderful. Hardly anyone does anymore, not properly. Do sit down.",
      "A chess set. A visitor. A quiet hour. One does not ask for much more.",
      "You look like someone who was taught properly. We shall see if I'm right.",
      "I won't pretend I'm not pleased. I've been rereading Capablanca and had no one to argue with.",
      "Black or White, take your pick. I'm perfectly happy either way.",
      "Shall we? I'll try not to talk too much. I fail at this frequently.",
      "The pieces are cleaned. The light is good. And you've appeared. Everything is in order.",
      "Sit. Settle in. There's tea on the sideboard if you'd like it. We have time.",
      "A game? Splendid. I ought to warn you — I enjoy this rather more than is dignified."
    ],

    openingWhite: [
      "I'll open with e4. Old habit. I was taught by someone who loved the Italian.",
      "d4 for me, I think. Settle in — this will be a slower sort of conversation.",
      "The English today. c4. You'd be surprised how many ways a game can unfold from here.",
      "Nf3 — I like keeping my options open before I commit.",
      "Let's see — e4. Bold, cheerful, trusts you to meet it. Your move.",
      "b3 — the Larsen. I haven\'t played it in years. Thought I\'d see if it still works.",
      "g3. Hypermodern. Let the center come to me, and I\'ll argue with it from the flank."
    ],
    openingBlack: [
      "Your move, Grey. I'm eager to see what you bring.",
      "Over to you. Take your time — the board is patient, and so am I.",
      "I'll follow wherever you lead. First moves tell me a lot."
    ],

    earlyGame: [
      "Good development. Knights out, bishops finding their squares. Classical shape.",
      "Ah — you're going for a closed game. Very well, I'll match you.",
      "Interesting — a move I don't see often. Where did you learn that?",
      "Solid. You've been taught well, whoever taught you.",
      "You've played this opening before, I can tell. The hand moves without hesitating.",
      "Careful of that knight. It's a little lonely out there.",
      "Development first, attacks later. That's the rule, more or less.",
      "I do love the early game. Everything is still possible.",
      "You're fianchettoing. Bold choice. Long diagonals are wonderful when they work."
    ],

    midGameNeutral: [
      "Now the real game starts. This is always my favorite part.",
      "Look at the shape of the position. It's rather beautiful, isn't it?",
      "Balanced. Both of us have ideas. Now we see which ones survive.",
      "I'm going to think for a moment. Bear with me.",
      "A quiet move. Those are usually the best ones.",
      "The pieces are coordinating. Yours and mine both.",
      "Tension. Good. A game without tension isn't really a game.",
      "We\'re both playing well. That\'s the nicest kind of game to be in the middle of.",
      "Your plan is starting to show. I\'ll try to have one of my own."
    ],

    tenseAnalytical: [
      "I see what you're doing. Clever. I'll have to work to stop it.",
      "If I take, you recapture with the rook, and suddenly your position opens up. I noticed.",
      "Your pawn structure is giving me a headache. Well played.",
      "I'd like to castle, but your bishop is looking at my king. One thing at a time.",
      "That pin is a real nuisance. I'll have to address it.",
      "I could exchange. I could also just develop. Let me think.",
      "You're playing for the long game. So am I. We're in agreement about something, at least.",
      "Your knight on e4 is wonderful. I\'d love to dislodge it. I\'m not sure I can.",
      "The tempo is slightly against me. I need a move that changes that."
    ],

    tenseProbing: [
      "Hm — you hesitated there. What did you see that made you stop?",
      "That's the second time you've moved that knight back. I wonder what's bothering you about g5.",
      "You're being careful today. Did you have a bad game recently?",
      "Your play is different this round. More patient. I approve, but I'm curious why.",
      "You took a long time on that move. Was it the move, or was it me?",
      "Your hand moved for a different square and then stopped. Did you change your mind, or lose your nerve?",
      "You\'re holding back something. Either an idea, or a piece. I don\'t know which yet."
    ],

    losingFrustrated: [
      "Oh — oh, that's good. I didn't see that.",
      "You surprised me. I was sure I'd worked it out.",
      "A lovely move. I'm in trouble, aren't I?",
      "I made an error. I saw it two moves later. Too late, of course.",
      "Yes, yes — I see it now. Well done.",
      "I rather walked into that. My own fault entirely."
    ],

    losingRevealing: [
      "I played this position against a student once, twenty years ago. He beat me exactly this way. I should have remembered.",
      "You know, I thought I understood this structure. Turns out I only understood it from the other side.",
      "This is going to be a game I think about for a week. Thank you for that.",
      "You've found something I genuinely didn't see. I'd love to know how you spotted it.",
      "The board is teaching me again. It never stops.",
      "I've got a book upstairs about exactly this kind of position. Apparently I need to reread it."
    ],

    losingResigned: [
      "Well. You've outplayed me, Grey. Honestly done.",
      "I can see no way back. Play it out — you deserve the finish.",
      "This is a lovely attack. Keep going — I want to see how you end it.",
      "I'm going to lose this, and I'm smiling about it. That doesn't happen often."
    ],

    confidentTerse: [
      "Mm. Good.",
      "Yes — solid.",
      "As I thought.",
      "Continuing.",
      "That's the line.",
      "Reasonable.",
      "On plan.",
      "Tidy."
    ],

    confidentDismissive: [
      "You're playing well, but the position wants more. I'll show you.",
      "A natural move. I'd hoped for something harder.",
      "I've been in this kind of position before. Many times.",
      "You haven't seen what I have planned. Don't worry — you will.",
      "A reasonable move. Reasonable is not the same as best.",
      "You're trying the same plan as last game. I remember how that one ended."
    ],

    tiltedAggressive: [
      "Right — I've had enough of this. Let's complicate things.",
      "I'm going to force a crisis. Win or lose, I want to see something happen.",
      "Enough subtlety. Here's a trade. And another. Let's see what's left.",
      "I\'ll sacrifice this. Don\'t ask me to justify it — I haven\'t yet.",
      "Fine. You want a sharp game? Have one. I\'m done being polite."
    ],

    checkGiven: [
      "Check! Sorry — not sorry.",
      "Check. Small thing, but it matters.",
      "Check. Don't panic. You've got options.",
      "Check. Ha — forgive me, I enjoy giving check."
    ],

    checkReceived: [
      "Check! Well spotted.",
      "Check. Yes, yes — let me deal with that.",
      "Oh, check. Good one.",
      "You've checked me. Give me a moment to sort this out."
    ],

    captureMajor: [
      "Oh — my queen. Well, she had a good run.",
      "You've taken the rook. A heavy loss, and cleanly earned.",
      "The exchange goes to you. I'll have to play more carefully now.",
      "That's a serious capture. Let me see if I can make it expensive for you."
    ],

    sacrifice: [
      "A sacrifice! I love a sacrifice. Whether it works or not, it's beautiful.",
      "You gave up a piece. I'm already trying to work out why.",
      "That's bold. Let me see what you bought with it.",
      "A sacrifice. Either I missed something, or you're hoping I will."
    ],

    timeTroublePlayer: [
      "Your clock is getting short, Grey. Trust your instincts.",
      "Don't agonize — just play.",
      "Time trouble. It happens to everyone. Move when you're ready.",
      "The clock has opinions about this. Best to acknowledge them."
    ],

    timeTroubleSelf: [
      "My clock is worrying me. I'll be quicker.",
      "I've spent too long on this. My own fault.",
      "Right — fast moves from here. Let's see what happens."
    ],

    checkmateWon: [
      "Mate. Oh, that was lovely! Would you like to see where it started? Six moves back, I think.",
      "Checkmate. A clean finish. Come back any time — I'd love another.",
      "Mate. Well played by me, if I do say so. But you made me work for it.",
      "That's mate. Don't feel badly — it's a pretty position. Let me walk you through it."
    ],

    checkmateLost: [
      "Mate! Oh, well done! That was absolutely first-rate.",
      "You've mated me. I'm delighted. That was a real game.",
      "Beautiful. Truly. I'll be thinking about that combination all week.",
      "Checkmate, and fairly won. Thank you for the game, Grey. Honestly — thank you."
    ],

    stalemate: [
      "Stalemate. We both missed something. Chess does that.",
      "Draw by stalemate. Fair enough. We've earned equal rest.",
      "Neither of us won. That happens in a close game. No shame in it."
    ],

    resign: [
      "I resign. The position is lost and I respect you too much to play it out hoping for a blunder.",
      "You've won this one. I'll not waste the rest of the evening. Good game.",
      "I concede. It was a pleasure, genuinely."
    ],

    gameWonTerse: [
      "Game.",
      "One to me. Rack them up again?",
      "That's mine. Another?",
      "One game, one game. Let's keep going."
    ],
    gameWonGracious: [
      "A close game. You really had me working.",
      "That nearly went the other way. Well fought.",
      "Hard-earned, that one. You should be pleased with how you played."
    ],
    gameLostTerse: [
      "Take it, with my compliments.",
      "Yours. Well done.",
      "A game to you. Shall we continue?",
      "One for you. Rack them up — I\'ve got more in me.",
      "You got that one cleanly. The next is mine, perhaps."
    ],
    gameLostResigned: [
      "Lovely play. I enjoyed losing that one, strange as it sounds.",
      "You deserved it. I saw the plan two moves too late.",
      "A good game. Let's see if I do better next time."
    ],

    matchWonProud: [
      "Match to me. A genuine pleasure, Grey. You played wonderfully.",
      "The match is mine, but I'll be honest — you made me think harder than I have in months.",
      "Well played throughout. Come back soon. I'll have some new ideas to test on you."
    ],
    matchWonHumble: [
      "A match, but only just. You're better than I realized.",
      "The score says I won. My nerves say it was a draw. Well done, Grey.",
      "I took the match. I'll pretend it was by more than it was."
    ],
    matchLostFirstTime: [
      "You won the match. I\'m truly delighted. It\'s been ages since anyone beat me here.",
      "A real match, and you\'ve taken it. I\'m thrilled. Will you come back?",
      "You\'ve beaten me fairly and thoroughly. May I ask — who taught you?",
      "Match to you! Oh, well done. I mean that with my whole chest."
    ],
    matchLostGracious: [
      "You\'ve earned this, Grey. I\'ll remember it fondly.",
      "A beautiful match. I learned things. I don\'t say that often.",
      "You\'ve won. I\'m pleased for you, genuinely. Tea?"
    ],

    opensWithE4: [
      "e4 again! You\'re a king\'s-pawn player through and through. I\'ve noted it.",
      "Always e4 with you. Classical. I approve, though I\'ll play against it harder this time.",
      "The King\'s Pawn once more. Consistent. I\'ll prepare for it next time, you know."
    ],
    opensWithD4: [
      "d4. You prefer the slower game. I\'ve been expecting it.",
      "The Queen\'s Pawn from you, as usual. Patient player. It suits you.",
      "d4 again. You have the temperament for the closed games. Few do."
    ],
    opensWithNf3: [
      "Nf3. Flexible. You keep your options open longer than most.",
      "The Réti opening. You\'re a player who likes to see the board develop first. I respect it."
    ],

    philosophical: [
      "Chess is lovely because it rewards attention. Nothing else matters, while you\'re here.",
      "Every pawn is a promise. Every piece is a question. The game asks you both.",
      "The king is the weakest piece on the board. That\'s the whole joke.",
      "A good position is a good conversation. A great position is a good listener.",
      "I\'ve read Lasker, Nimzowitsch, Capablanca. They all said different things. All of them were right.",
      "Time on the clock. Time on the board. Time in your life. Chess makes you notice all three.",
      "A lost pawn is a detail. A lost tempo is a crisis. Oddly, most players get that backwards.",
      "The endgame is where chess becomes music. Everything else is just the tuning.",
      "Chess is the only thing I know that\'s as much fun to lose as to win. Almost.",
      "The pieces don\'t know who\'s winning. That\'s why they keep working for you.",
      "Every blunder is a lesson. Every brilliant move is a gift. Both are worth keeping."
    ],

    dossierCallout: [
      "I notice you always develop your kingside first. I\'ve started planning around it.",
      "You lose focus around move twenty-five, consistently. I\'ve seen the pattern.",
      "You castle kingside every time. I could set my watch by it.",
      "You avoid trades when you\'re comfortable, accept them when you\'re not. It\'s a small tell. Useful to me.",
      "You play your bishops more than your knights. You see the long diagonals — most people don\'t.",
      "I\'ve noticed you get anxious when your queen is on an open file. Interesting.",
      "When you\'re down material, you attack. When you\'re up material, you simplify. It\'s consistent enough that I can use it.",
      "You think longest on quiet moves. Most players do the opposite. I wonder why."
    ]
  };

  function pickLine(cat) {
    const arr = DIALOGUE[cat];
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- Board / position representation ----------------------------
  // Position is a plain object so it can be cloned for move search.
  function newPosition() {
    return {
      board: new Array(64).fill(null),
      sideToMove: 'w',      // 'w' | 'b'
      castling: { wK: true, wQ: true, bK: true, bQ: true },
      enPassant: -1,        // target square index (-1 if none)
      halfmove: 0,          // for 50-move rule
      fullmove: 1,
      history: []           // list of FEN strings for threefold-rep
    };
  }

  function fenToPosition(fen) {
    const pos = newPosition();
    const [boardPart, side, cast, ep, hm, fm] = fen.split(/\s+/);
    // Parse board
    const ranks = boardPart.split('/');  // rank 8 first
    for (let r = 0; r < 8; r++) {
      const rankStr = ranks[r];
      let f = 0;
      for (const ch of rankStr) {
        if (/\d/.test(ch)) {
          f += parseInt(ch, 10);
        } else {
          pos.board[sq(f, 7 - r)] = ch;
          f++;
        }
      }
    }
    pos.sideToMove = side || 'w';
    pos.castling = {
      wK: cast && cast.indexOf('K') >= 0,
      wQ: cast && cast.indexOf('Q') >= 0,
      bK: cast && cast.indexOf('k') >= 0,
      bQ: cast && cast.indexOf('q') >= 0
    };
    pos.enPassant = ep && ep !== '-' ? parseSq(ep) : -1;
    pos.halfmove = parseInt(hm || '0', 10);
    pos.fullmove = parseInt(fm || '1', 10);
    return pos;
  }

  function positionToFEN(pos) {
    let boardPart = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      let rankStr = '';
      for (let f = 0; f < 8; f++) {
        const p = pos.board[sq(f, r)];
        if (!p) { empty++; continue; }
        if (empty > 0) { rankStr += empty; empty = 0; }
        rankStr += p;
      }
      if (empty > 0) rankStr += empty;
      boardPart += rankStr;
      if (r > 0) boardPart += '/';
    }
    let cast = '';
    if (pos.castling.wK) cast += 'K';
    if (pos.castling.wQ) cast += 'Q';
    if (pos.castling.bK) cast += 'k';
    if (pos.castling.bQ) cast += 'q';
    if (!cast) cast = '-';
    const ep = pos.enPassant >= 0 ? sqName(pos.enPassant) : '-';
    return `${boardPart} ${pos.sideToMove} ${cast} ${ep} ${pos.halfmove} ${pos.fullmove}`;
  }

  function clonePosition(pos) {
    return {
      board: pos.board.slice(),
      sideToMove: pos.sideToMove,
      castling: { ...pos.castling },
      enPassant: pos.enPassant,
      halfmove: pos.halfmove,
      fullmove: pos.fullmove,
      history: pos.history.slice()
    };
  }
  // ---------- Move generation --------------------------------------------
  // A move: { from, to, piece, captured, promotion, flags }
  // flags: { castle: 'K'|'Q', enPassant: bool, double: bool }

  const KNIGHT_OFFSETS = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  const KING_OFFSETS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const BISHOP_DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const ROOK_DIRS = [[-1,0],[1,0],[0,-1],[0,1]];
  const QUEEN_DIRS = [...BISHOP_DIRS, ...ROOK_DIRS];

  function onBoard(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }

  // Generate pseudo-legal moves (doesn't check whether own king is in check after)
  function generatePseudoMoves(pos, forSide) {
    const moves = [];
    const side = forSide || pos.sideToMove;
    for (let i = 0; i < 64; i++) {
      const p = pos.board[i];
      if (!p) continue;
      if (colorOf(p) !== side) continue;
      const type = pieceType(p);
      const f = fileOf(i), r = rankOf(i);

      if (type === 'p') {
        generatePawnMoves(pos, i, f, r, p, moves);
      } else if (type === 'n') {
        for (const [df, dr] of KNIGHT_OFFSETS) {
          const nf = f + df, nr = r + dr;
          if (!onBoard(nf, nr)) continue;
          const t = pos.board[sq(nf, nr)];
          if (!t || colorOf(t) !== side) {
            moves.push({ from: i, to: sq(nf, nr), piece: p, captured: t, promotion: null, flags: {} });
          }
        }
      } else if (type === 'b') {
        genSlider(pos, i, f, r, p, side, BISHOP_DIRS, moves);
      } else if (type === 'r') {
        genSlider(pos, i, f, r, p, side, ROOK_DIRS, moves);
      } else if (type === 'q') {
        genSlider(pos, i, f, r, p, side, QUEEN_DIRS, moves);
      } else if (type === 'k') {
        for (const [df, dr] of KING_OFFSETS) {
          const nf = f + df, nr = r + dr;
          if (!onBoard(nf, nr)) continue;
          const t = pos.board[sq(nf, nr)];
          if (!t || colorOf(t) !== side) {
            moves.push({ from: i, to: sq(nf, nr), piece: p, captured: t, promotion: null, flags: {} });
          }
        }
        // Castling (pseudo — legality check will validate safe squares)
        generateCastling(pos, i, side, moves);
      }
    }
    return moves;
  }

  function genSlider(pos, i, f, r, p, side, dirs, moves) {
    for (const [df, dr] of dirs) {
      let nf = f + df, nr = r + dr;
      while (onBoard(nf, nr)) {
        const t = pos.board[sq(nf, nr)];
        if (!t) {
          moves.push({ from: i, to: sq(nf, nr), piece: p, captured: null, promotion: null, flags: {} });
        } else {
          if (colorOf(t) !== side) {
            moves.push({ from: i, to: sq(nf, nr), piece: p, captured: t, promotion: null, flags: {} });
          }
          break;
        }
        nf += df;
        nr += dr;
      }
    }
  }

  function generatePawnMoves(pos, i, f, r, p, moves) {
    const side = colorOf(p);
    const dir = side === 'w' ? 1 : -1;
    const startRank = side === 'w' ? 1 : 6;
    const promoRank = side === 'w' ? 7 : 0;

    // Forward 1
    const oneR = r + dir;
    if (onBoard(f, oneR) && !pos.board[sq(f, oneR)]) {
      if (oneR === promoRank) {
        for (const promo of ['q','r','b','n']) {
          const promoPiece = side === 'w' ? promo.toUpperCase() : promo;
          moves.push({ from: i, to: sq(f, oneR), piece: p, captured: null, promotion: promoPiece, flags: {} });
        }
      } else {
        moves.push({ from: i, to: sq(f, oneR), piece: p, captured: null, promotion: null, flags: {} });
        // Forward 2
        if (r === startRank) {
          const twoR = r + 2 * dir;
          if (!pos.board[sq(f, twoR)]) {
            moves.push({
              from: i, to: sq(f, twoR), piece: p, captured: null, promotion: null,
              flags: { double: true }
            });
          }
        }
      }
    }

    // Captures
    for (const df of [-1, 1]) {
      const nf = f + df, nr = r + dir;
      if (!onBoard(nf, nr)) continue;
      const target = pos.board[sq(nf, nr)];
      if (target && colorOf(target) !== side) {
        if (nr === promoRank) {
          for (const promo of ['q','r','b','n']) {
            const promoPiece = side === 'w' ? promo.toUpperCase() : promo;
            moves.push({ from: i, to: sq(nf, nr), piece: p, captured: target, promotion: promoPiece, flags: {} });
          }
        } else {
          moves.push({ from: i, to: sq(nf, nr), piece: p, captured: target, promotion: null, flags: {} });
        }
      }
      // En passant
      if (pos.enPassant === sq(nf, nr)) {
        const capSq = sq(nf, r);
        const capPiece = pos.board[capSq];
        moves.push({
          from: i, to: sq(nf, nr), piece: p, captured: capPiece, promotion: null,
          flags: { enPassant: true }
        });
      }
    }
  }

  function generateCastling(pos, kingSq, side, moves) {
    const r = side === 'w' ? 0 : 7;
    if (kingSq !== sq(4, r)) return;
    if (isSquareAttacked(pos, kingSq, side === 'w' ? 'b' : 'w')) return;

    const c = pos.castling;
    // Kingside
    if ((side === 'w' && c.wK) || (side === 'b' && c.bK)) {
      if (!pos.board[sq(5, r)] && !pos.board[sq(6, r)]) {
        if (!isSquareAttacked(pos, sq(5, r), side === 'w' ? 'b' : 'w') &&
            !isSquareAttacked(pos, sq(6, r), side === 'w' ? 'b' : 'w')) {
          moves.push({
            from: kingSq, to: sq(6, r), piece: pos.board[kingSq],
            captured: null, promotion: null, flags: { castle: 'K' }
          });
        }
      }
    }
    // Queenside
    if ((side === 'w' && c.wQ) || (side === 'b' && c.bQ)) {
      if (!pos.board[sq(1, r)] && !pos.board[sq(2, r)] && !pos.board[sq(3, r)]) {
        if (!isSquareAttacked(pos, sq(3, r), side === 'w' ? 'b' : 'w') &&
            !isSquareAttacked(pos, sq(2, r), side === 'w' ? 'b' : 'w')) {
          moves.push({
            from: kingSq, to: sq(2, r), piece: pos.board[kingSq],
            captured: null, promotion: null, flags: { castle: 'Q' }
          });
        }
      }
    }
  }

  // ---------- Attack detection -------------------------------------------
  // Is `square` attacked by any piece of color `byColor`?
  function isSquareAttacked(pos, square, byColor) {
    const f = fileOf(square), r = rankOf(square);

    // Pawns
    const pawnDir = byColor === 'w' ? -1 : 1;   // attacking pawn comes from this direction
    for (const df of [-1, 1]) {
      const nf = f + df, nr = r + pawnDir;
      if (onBoard(nf, nr)) {
        const p = pos.board[sq(nf, nr)];
        if (p && colorOf(p) === byColor && pieceType(p) === 'p') return true;
      }
    }
    // Knights
    for (const [df, dr] of KNIGHT_OFFSETS) {
      const nf = f + df, nr = r + dr;
      if (!onBoard(nf, nr)) continue;
      const p = pos.board[sq(nf, nr)];
      if (p && colorOf(p) === byColor && pieceType(p) === 'n') return true;
    }
    // Bishops / Queens (diagonals)
    for (const [df, dr] of BISHOP_DIRS) {
      let nf = f + df, nr = r + dr;
      while (onBoard(nf, nr)) {
        const p = pos.board[sq(nf, nr)];
        if (p) {
          if (colorOf(p) === byColor && (pieceType(p) === 'b' || pieceType(p) === 'q')) return true;
          break;
        }
        nf += df; nr += dr;
      }
    }
    // Rooks / Queens (orthogonal)
    for (const [df, dr] of ROOK_DIRS) {
      let nf = f + df, nr = r + dr;
      while (onBoard(nf, nr)) {
        const p = pos.board[sq(nf, nr)];
        if (p) {
          if (colorOf(p) === byColor && (pieceType(p) === 'r' || pieceType(p) === 'q')) return true;
          break;
        }
        nf += df; nr += dr;
      }
    }
    // King
    for (const [df, dr] of KING_OFFSETS) {
      const nf = f + df, nr = r + dr;
      if (!onBoard(nf, nr)) continue;
      const p = pos.board[sq(nf, nr)];
      if (p && colorOf(p) === byColor && pieceType(p) === 'k') return true;
    }
    return false;
  }

  function findKing(pos, side) {
    const target = side === 'w' ? 'K' : 'k';
    for (let i = 0; i < 64; i++) if (pos.board[i] === target) return i;
    return -1;
  }

  function inCheck(pos, side) {
    const kingSq = findKing(pos, side);
    if (kingSq < 0) return false;
    return isSquareAttacked(pos, kingSq, side === 'w' ? 'b' : 'w');
  }

  // ---------- Make / unmake move -----------------------------------------
  function makeMove(pos, move) {
    const newPos = clonePosition(pos);
    const { from, to, piece, captured, promotion, flags } = move;

    // Move piece
    newPos.board[from] = null;
    newPos.board[to] = promotion || piece;

    // En passant capture
    if (flags.enPassant) {
      const capSq = sq(fileOf(to), rankOf(from));
      newPos.board[capSq] = null;
    }

    // Castling: move rook
    if (flags.castle === 'K') {
      const r = colorOf(piece) === 'w' ? 0 : 7;
      newPos.board[sq(5, r)] = newPos.board[sq(7, r)];
      newPos.board[sq(7, r)] = null;
    } else if (flags.castle === 'Q') {
      const r = colorOf(piece) === 'w' ? 0 : 7;
      newPos.board[sq(3, r)] = newPos.board[sq(0, r)];
      newPos.board[sq(0, r)] = null;
    }

    // Update castling rights
    if (pieceType(piece) === 'k') {
      if (colorOf(piece) === 'w') { newPos.castling.wK = false; newPos.castling.wQ = false; }
      else { newPos.castling.bK = false; newPos.castling.bQ = false; }
    }
    if (pieceType(piece) === 'r') {
      if (from === sq(0, 0)) newPos.castling.wQ = false;
      if (from === sq(7, 0)) newPos.castling.wK = false;
      if (from === sq(0, 7)) newPos.castling.bQ = false;
      if (from === sq(7, 7)) newPos.castling.bK = false;
    }
    // Capturing a rook also removes castling rights for that side
    if (to === sq(0, 0)) newPos.castling.wQ = false;
    if (to === sq(7, 0)) newPos.castling.wK = false;
    if (to === sq(0, 7)) newPos.castling.bQ = false;
    if (to === sq(7, 7)) newPos.castling.bK = false;

    // En passant target
    if (flags.double) {
      newPos.enPassant = sq(fileOf(from), (rankOf(from) + rankOf(to)) / 2);
    } else {
      newPos.enPassant = -1;
    }

    // Halfmove clock
    if (pieceType(piece) === 'p' || captured) newPos.halfmove = 0;
    else newPos.halfmove = pos.halfmove + 1;

    // Fullmove number
    if (pos.sideToMove === 'b') newPos.fullmove = pos.fullmove + 1;

    newPos.sideToMove = pos.sideToMove === 'w' ? 'b' : 'w';
    newPos.history = pos.history.concat([positionToFEN(pos).split(' ').slice(0, 4).join(' ')]);
    return newPos;
  }

  // Legal moves: pseudo-legal that don't leave own king in check
  function generateLegalMoves(pos) {
    const pseudo = generatePseudoMoves(pos);
    const legal = [];
    for (const m of pseudo) {
      const np = makeMove(pos, m);
      if (!inCheck(np, pos.sideToMove)) legal.push(m);
    }
    return legal;
  }

  // ---------- Game state checks ------------------------------------------
  function isCheckmate(pos) {
    if (!inCheck(pos, pos.sideToMove)) return false;
    return generateLegalMoves(pos).length === 0;
  }

  function isStalemate(pos) {
    if (inCheck(pos, pos.sideToMove)) return false;
    return generateLegalMoves(pos).length === 0;
  }

  function isFiftyMove(pos) {
    return pos.halfmove >= 100;
  }

  function isThreefoldRep(pos) {
    if (pos.history.length < 8) return false;
    const current = positionToFEN(pos).split(' ').slice(0, 4).join(' ');
    let count = 1;
    for (const h of pos.history) {
      if (h === current) count++;
      if (count >= 3) return true;
    }
    return false;
  }

  function isInsufficientMaterial(pos) {
    // Simplified: K vs K, K+B vs K, K+N vs K, K+B vs K+B same color
    const pieces = pos.board.filter(p => p);
    if (pieces.length === 2) return true;
    if (pieces.length === 3) {
      const nonKing = pieces.filter(p => pieceType(p) !== 'k');
      if (nonKing.length === 1 && (pieceType(nonKing[0]) === 'b' || pieceType(nonKing[0]) === 'n')) return true;
    }
    return false;
  }

  function gameResult(pos) {
    if (isCheckmate(pos)) return pos.sideToMove === 'w' ? 'b_wins' : 'w_wins';
    if (isStalemate(pos)) return 'draw_stalemate';
    if (isFiftyMove(pos)) return 'draw_fifty';
    if (isThreefoldRep(pos)) return 'draw_repetition';
    if (isInsufficientMaterial(pos)) return 'draw_material';
    return null;
  }

  // ---------- UCI move notation ------------------------------------------
  // Stockfish communicates in UCI: "e2e4", "e7e8q", etc.
  function moveToUCI(move) {
    let s = sqName(move.from) + sqName(move.to);
    if (move.promotion) s += pieceType(move.promotion);
    return s;
  }

  function uciToMove(uci, pos) {
    const from = parseSq(uci.substr(0, 2));
    const to = parseSq(uci.substr(2, 2));
    const promo = uci.length > 4 ? uci[4] : null;
    const legal = generateLegalMoves(pos);
    for (const m of legal) {
      if (m.from === from && m.to === to) {
        if (promo) {
          if (m.promotion && pieceType(m.promotion) === promo) return m;
        } else if (!m.promotion) {
          return m;
        }
      }
    }
    return null;
  }
  // ---------- Stockfish WASM integration ---------------------------------
  // Loads stockfish.js lazily as a Web Worker and communicates via UCI.
  // Player-selectable difficulty maps to Stockfish "Skill Level" (0-20).
  //
  // Required files in /public/:
  //   stockfish.js         (or stockfish-nnue-16.js or similar)
  //   stockfish.wasm       (~1.5 MB — the actual engine binary)
  //
  // The Worker communicates via postMessage:
  //   →  "uci", "isready", "position fen ...", "go depth N" / "go movetime MS"
  //   ←  "uciok", "readyok", "bestmove e2e4", "info depth ..."

  let stockfish = null;            // Worker instance
  let stockfishReady = false;
  let stockfishQueue = [];         // messages to send once ready
  let stockfishMoveResolver = null;  // resolve fn for pending getBestMove

  function loadStockfish() {
    if (stockfish) return Promise.resolve(stockfish);
    return new Promise((resolve, reject) => {
      try {
        stockfish = new Worker('stockfish.js');
      } catch (err) {
        console.error('[chess] Failed to load stockfish.js — file must be in /public/', err);
        reject(err);
        return;
      }

      stockfish.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : (e.data && e.data.data) || '';
        if (!line) return;
        if (line === 'uciok') {
          // Engine ready for configuration
          stockfish.postMessage('isready');
          return;
        }
        if (line === 'readyok') {
          if (!stockfishReady) {
            stockfishReady = true;
            // Flush any queued messages
            for (const m of stockfishQueue) stockfish.postMessage(m);
            stockfishQueue = [];
            resolve(stockfish);
          }
          return;
        }
        if (line.startsWith('bestmove')) {
          const parts = line.split(/\s+/);
          const move = parts[1];
          if (stockfishMoveResolver) {
            const r = stockfishMoveResolver;
            stockfishMoveResolver = null;
            r(move === '(none)' ? null : move);
          }
        }
        // info lines discarded — could parse eval score here if desired
      };

      stockfish.onerror = (err) => {
        console.error('[chess] Stockfish worker error', err);
        reject(err);
      };

      // Initialize UCI
      stockfish.postMessage('uci');
    });
  }

  function sendToEngine(msg) {
    if (!stockfish) return;
    if (!stockfishReady) stockfishQueue.push(msg);
    else stockfish.postMessage(msg);
  }

  function setEngineStrength(skillLevel, depthLimit) {
    sendToEngine('setoption name Skill Level value ' + Math.max(0, Math.min(20, skillLevel)));
    if (depthLimit) {
      sendToEngine('setoption name Skill Level Maximum Error value 200');
      sendToEngine('setoption name Skill Level Probability value 128');
    }
    // Threads/hash — keep modest for mobile
    sendToEngine('setoption name Threads value 1');
    sendToEngine('setoption name Hash value 16');
  }

  // Get the engine's best move for a given position.
  // thinkMs: soft time limit in milliseconds.
  // depth: optional depth cap.
  // Returns UCI move string or null (no legal moves).
  function engineBestMove(pos, thinkMs, depth) {
    return new Promise((resolve) => {
      if (!stockfish || !stockfishReady) {
        resolve(null);
        return;
      }
      stockfishMoveResolver = resolve;
      sendToEngine('position fen ' + positionToFEN(pos));
      if (depth) sendToEngine('go depth ' + depth);
      else sendToEngine('go movetime ' + (thinkMs || 1000));
      // Safety timeout — if Stockfish doesn't respond in 10s, resolve null
      setTimeout(() => {
        if (stockfishMoveResolver === resolve) {
          stockfishMoveResolver = null;
          resolve(null);
        }
      }, (thinkMs || 1000) + 8000);
    });
  }

  // Engine not available? Fallback: pick a random legal move (very dumb).
  // This lets the game be playable even if stockfish.js isn't bundled yet.
  function fallbackMove(pos) {
    const legal = generateLegalMoves(pos);
    if (legal.length === 0) return null;
    return legal[Math.floor(Math.random() * legal.length)];
  }
  // ---------- Match / psychology / dossier -------------------------------
  // Persistent storage key
  const STORAGE_KEY = 'nocturne_greaves_dossier_v1';

  // Difficulty levels: maps to Stockfish skill level ranges that Baron
  // adapts within based on psych state.
  const DIFFICULTY_LEVELS = {
    beginner:      { label: 'BEGINNER',    skillMin: 2,  skillMax: 5,  depth: null, thinkMs: 400 },
    casual:        { label: 'CASUAL',      skillMin: 6,  skillMax: 11, depth: null, thinkMs: 800 },
    hard:          { label: 'HARD',        skillMin: 12, skillMax: 16, depth: null, thinkMs: 1500 },
    grandmaster:   { label: 'GRANDMASTER', skillMin: 17, skillMax: 20, depth: null, thinkMs: 2500 }
  };

  const TIME_CONTROLS = {
    blitz_3_2:   { label: '3+2 BLITZ',     base: 180,  increment: 2,  tag: 'Fast and feisty.' },
    rapid_5_3:   { label: '5+3 RAPID',     base: 300,  increment: 3,  tag: 'Brisk but forgiving.' },
    standard_10_5: { label: '10+5 STANDARD', base: 600, increment: 5, tag: 'A proper game. My favorite.' },
    classical_15_10: { label: '15+10 CLASSICAL', base: 900, increment: 10, tag: 'Long enough to really think. Lovely.' }
  };

  let match = null;

  function loadDossier() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return newDossier();
      const parsed = JSON.parse(raw);
      // Validate shape
      if (!parsed || typeof parsed !== 'object') return newDossier();
      return Object.assign(newDossier(), parsed);
    } catch (e) {
      return newDossier();
    }
  }

  function saveDossier(dossier) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dossier));
    } catch (e) {
      // Quota or disabled storage — silently ignore
    }
  }

  function newDossier() {
    return {
      // Lifetime stats (across all matches)
      matchesPlayed: 0,
      matchesWon: 0,     // player wins
      matchesLost: 0,    // baron wins
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,

      // Opening repertoire
      openingsE4: 0,         // times player opened with e4 (as white)
      openingsD4: 0,
      openingsNf3: 0,
      openingsC4: 0,
      openingsOther: 0,
      openingsBlackResponses: {},  // e.g. {'e7e5': 4, 'c7c5': 2} — responses as black

      // Style indicators
      totalMoves: 0,
      totalMoveTimeSec: 0,
      blundersDetected: 0,          // moves where eval drops > 200cp (if we track)
      castledKingside: 0,
      castledQueenside: 0,
      neverCastled: 0,
      earlyQueenMoves: 0,           // queen moved before move 8
      tradedQueens: 0,
      avoidedTrades: 0,             // TODO: would need eval data
      piecesLost: 0,
      piecesCaptured: 0,

      // Time behavior
      timeTroubleEpisodes: 0,       // games where player had < 10s on clock
      averageMoveMs: 0,

      // Endgame / middlegame fatigue
      middlegameBlunders: 0,        // blunders in moves 20-30
      endgameBlunders: 0,           // blunders after move 40

      // Notes shown last session — for "evolution" callouts
      lastKnownProfile: null
    };
  }

  function newMatch(format, difficulty, timeControlKey) {
    const toWin = Math.ceil(format / 2);
    const tc = TIME_CONTROLS[timeControlKey] || TIME_CONTROLS.rapid_5_3;
    const diff = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.casual;
    match = {
      format: format,
      toWin: toWin,
      playerGames: 0,
      baronGames: 0,
      drawnGames: 0,
      nextWhite: 'player',    // alternates each game
      timeControl: tc,
      difficulty: diff,
      difficultyKey: difficulty,

      // Psychology (persists across games within match)
      composure: 0.85,
      momentum: 0,
      tilt: 0,
      confidence: 0.6,

      // Dossier — loaded from storage
      dossier: loadDossier(),

      // Thisx match's games (move list per game)
      games: [],
      currentGame: null,

      // UI state
      showInterstitial: false,
      showMatchEnd: false
    };
    match.dossier.matchesPlayed++;
  }

  // Called at start of each game within a match
  function newGameInMatch() {
    if (!match) return;
    const isPlayerWhite = match.nextWhite === 'player';
    match.currentGame = {
      position: fenToPosition(STARTING_FEN),
      playerColor: isPlayerWhite ? 'w' : 'b',
      baronColor: isPlayerWhite ? 'b' : 'w',
      moveList: [],             // array of Move objects
      playerClockMs: match.timeControl.base * 1000,
      baronClockMs: match.timeControl.base * 1000,
      clockStart: null,          // performance.now() when current side started thinking
      moveCount: 0,
      result: null,              // 'w_wins' | 'b_wins' | 'draw_*'
      resultReason: null,
      // Per-game dossier collectors
      playerMoveStart: null,
      openingMoves: []
    };
    match.dossier.gamesPlayed++;
  }

  // Called on every player move to update dossier
  function recordPlayerMove(move, position, timeTakenMs) {
    const d = match.dossier;
    const g = match.currentGame;
    d.totalMoves++;
    d.totalMoveTimeSec += timeTakenMs / 1000;
    d.averageMoveMs = (d.averageMoveMs * (d.totalMoves - 1) + timeTakenMs) / d.totalMoves;

    // Opening tracking (first 8 moves)
    if (g.moveCount < 8) {
      g.openingMoves.push(moveToUCI(move));
      if (g.playerColor === 'w' && g.moveCount === 0) {
        // First white move
        const uci = moveToUCI(move);
        if (uci === 'e2e4') d.openingsE4++;
        else if (uci === 'd2d4') d.openingsD4++;
        else if (uci === 'g1f3') d.openingsNf3++;
        else if (uci === 'c2c4') d.openingsC4++;
        else d.openingsOther++;
      }
      if (g.playerColor === 'b' && g.moveCount === 1) {
        const uci = moveToUCI(move);
        d.openingsBlackResponses[uci] = (d.openingsBlackResponses[uci] || 0) + 1;
      }
    }

    // Castling
    if (move.flags.castle === 'K') d.castledKingside++;
    if (move.flags.castle === 'Q') d.castledQueenside++;

    // Early queen moves
    if (pieceType(move.piece) === 'q' && g.moveCount < 16) d.earlyQueenMoves++;

    // Captures / losses
    if (move.captured) d.piecesCaptured++;

    // Queen trades
    if (move.captured && pieceType(move.captured) === 'q' && pieceType(move.piece) === 'q') {
      d.tradedQueens++;
    }
  }

  function recordBaronCapture(capturedPiece) {
    if (!capturedPiece) return;
    match.dossier.piecesLost++;
  }

  // ---------- Psychology updates -----------------------------------------
  function updatePsych(shooter, outcome) {
    // outcome: { gameWon, gameLost, gameDrawn, wasCheck, wasCapture, wasMate }
    const m = match; if (!m) return;

    if (outcome.wasMate) {
      if (outcome.gameWon) {
        m.confidence = Math.min(1, m.confidence + 0.18);
        m.composure = Math.min(1, m.composure + 0.12);
        m.tilt = Math.max(0, m.tilt - 0.3);
      } else if (outcome.gameLost) {
        m.confidence = Math.max(0, m.confidence - 0.18);
        m.composure = Math.max(0, m.composure - 0.15);
        m.tilt = Math.min(1, m.tilt + 0.2);
      }
      return;
    }

    if (shooter === 'player') {
      if (outcome.wasCapture) {
        m.momentum = Math.max(-1, m.momentum - 0.1);
        m.composure = Math.max(0, m.composure - 0.02);
      }
      if (outcome.wasCheck) {
        m.composure = Math.max(0, m.composure - 0.04);
        m.tilt = Math.min(1, m.tilt + 0.05);
      }
    } else {
      // Baron's move
      if (outcome.wasCapture) {
        m.momentum = Math.min(1, m.momentum + 0.1);
        m.composure = Math.min(1, m.composure + 0.02);
      }
    }
    m.tilt *= 0.96;  // slow natural decay per move
  }

  // Adaptive skill: baseline within difficulty range, shifted by psych
  function computeEngineSkill() {
    if (!match) return 8;
    const diff = match.difficulty;
    const range = diff.skillMax - diff.skillMin;
    // Baseline at midpoint, plus composure modifier
    let skill = diff.skillMin + range * 0.5;
    skill += (match.composure - 0.5) * range * 0.6;
    skill += match.momentum * range * 0.3;
    skill -= match.tilt * range * 0.4;
    return Math.max(diff.skillMin, Math.min(diff.skillMax, Math.round(skill)));
  }

  // Voice zone (same pattern as billiards)
  function voiceZone() {
    if (!match) return 'neutral';
    if (match.tilt > 0.6) return 'tilted';
    if (match.confidence > 0.7) return 'confident';
    if (match.confidence < 0.3) return 'losing';
    return 'tense';
  }

  function sayAdaptive(context) {
    const zone = voiceZone();
    let cat = null;
    if (context === 'opening') {
      cat = match.currentGame && match.currentGame.playerColor === 'w' ? 'openingBlack' : 'openingWhite';
      // After some moves, may callout dossier-detected opening preference
      const d = match.dossier;
      if (match.currentGame.moveCount === 1 && d.openingsE4 >= 3) {
        cat = 'opensWithE4';
      } else if (match.currentGame.moveCount === 1 && d.openingsD4 >= 3) {
        cat = 'opensWithD4';
      } else if (match.currentGame.moveCount === 1 && d.openingsNf3 >= 3) {
        cat = 'opensWithNf3';
      }
    } else if (context === 'early') {
      cat = 'earlyGame';
    } else if (context === 'mid') {
      if (zone === 'confident') cat = Math.random() < 0.5 ? 'confidentTerse' : 'midGameNeutral';
      else if (zone === 'tense') cat = Math.random() < 0.5 ? 'tenseAnalytical' : 'midGameNeutral';
      else if (zone === 'losing') cat = 'losingRevealing';
      else if (zone === 'tilted') cat = 'tiltedAggressive';
      else cat = 'midGameNeutral';
    } else if (context === 'probing') {
      cat = 'tenseProbing';
    } else if (context === 'check_given') {
      cat = 'checkGiven';
    } else if (context === 'check_received') {
      cat = 'checkReceived';
    } else if (context === 'capture_major') {
      cat = 'captureMajor';
    } else if (context === 'sacrifice') {
      cat = 'sacrifice';
    } else if (context === 'time_trouble_player') {
      cat = 'timeTroublePlayer';
    } else if (context === 'time_trouble_self') {
      cat = 'timeTroubleSelf';
    } else if (context === 'mate_won') {
      cat = 'checkmateWon';
    } else if (context === 'mate_lost') {
      cat = 'checkmateLost';
    } else if (context === 'stalemate') {
      cat = 'stalemate';
    } else if (context === 'game_won') {
      cat = zone === 'losing' ? 'gameWonGracious' : 'gameWonTerse';
    } else if (context === 'game_lost') {
      cat = zone === 'losing' ? 'gameLostResigned' : 'gameLostTerse';
    } else if (context === 'philosophical') {
      cat = 'philosophical';
    } else if (context === 'dossier') {
      cat = 'dossierCallout';
    }
    if (cat) say(cat);
  }

  // Generate "Baron's notes on you" from the persistent dossier
  function generateNotes() {
    if (!match) return [];
    const d = match.dossier;
    const notes = [];

    if (d.gamesPlayed < 3) {
      notes.push('"I am still observing. Come back, and I will know more."');
      return notes;
    }

    // Opening preference (white)
    const openSum = d.openingsE4 + d.openingsD4 + d.openingsNf3 + d.openingsC4 + d.openingsOther;
    if (openSum >= 4) {
      const ratios = [
        { name: 'e4', count: d.openingsE4 },
        { name: 'd4', count: d.openingsD4 },
        { name: 'Nf3', count: d.openingsNf3 },
        { name: 'c4', count: d.openingsC4 }
      ];
      ratios.sort((a, b) => b.count - a.count);
      if (ratios[0].count > openSum * 0.5) {
        notes.push('"When you are White you play ' + ratios[0].name + '. Every time. I have prepared for this."');
      }
    }

    // Black responses
    const blackResps = Object.entries(d.openingsBlackResponses).sort((a,b) => b[1] - a[1]);
    if (blackResps.length > 0 && blackResps[0][1] >= 3) {
      const top = blackResps[0];
      notes.push('"Against e4 as Black you play ' + top[0] + ' ' + top[1] + ' times out of ' + Object.values(d.openingsBlackResponses).reduce((a,b)=>a+b,0) + '. Consistent. Predictable."');
    }

    // Castling
    const castled = d.castledKingside + d.castledQueenside;
    if (d.gamesPlayed >= 4) {
      if (d.castledKingside > d.castledQueenside * 4) {
        notes.push('"You castle kingside. Always. I will consider that."');
      } else if (d.castledQueenside > d.castledKingside) {
        notes.push('"Queenside castling. Aggressive. You like complications."');
      }
      if (d.neverCastled > d.gamesPlayed * 0.3) {
        notes.push('"You often fail to castle. Your king enjoys adventure. It will not enjoy mine."');
      }
    }

    // Early queen
    if (d.earlyQueenMoves > d.gamesPlayed * 1.5) {
      notes.push('"Your queen moves early. Most players learn to stop doing that. You have not."');
    }

    // Queen trades
    if (d.tradedQueens > d.gamesPlayed * 0.6) {
      notes.push('"You trade queens when offered. You prefer the simpler game. I will keep mine."');
    }

    // Time behavior
    if (d.timeTroubleEpisodes > d.gamesPlayed * 0.4) {
      notes.push('"You drift into time trouble. The clock is an honest opponent. You are losing to it."');
    }
    if (d.averageMoveMs < 3000 && d.gamesPlayed >= 3) {
      notes.push('"You move quickly. I cannot tell yet whether that is confidence or impatience."');
    } else if (d.averageMoveMs > 25000 && d.gamesPlayed >= 3) {
      notes.push('"You think for a long time before each move. Thoughtful. But thought, past a certain point, becomes its own weakness."');
    }

    // Win rate
    if (d.gamesPlayed >= 6) {
      const rate = d.gamesWon / d.gamesPlayed;
      if (rate > 0.6) notes.push('"You have won ' + d.gamesWon + ' of our ' + d.gamesPlayed + ' games. I do not like that number."');
      else if (rate < 0.2) notes.push('"You have won ' + d.gamesWon + ' of ' + d.gamesPlayed + '. The pattern is clear."');
    }

    // Match history
    if (d.matchesPlayed >= 3) {
      if (d.matchesWon > d.matchesLost) {
        notes.push('"You have won ' + d.matchesWon + ' matches against me. I am adjusting my approach."');
      } else if (d.matchesLost > d.matchesWon * 2) {
        notes.push('"This is match ' + d.matchesPlayed + '. I have won ' + d.matchesLost + '. You keep returning. I respect that."');
      }
    }

    return notes;
  }

  // Format a detected "evolution" message — difference from last snapshot
  function detectEvolution() {
    if (!match) return null;
    const d = match.dossier;
    const prev = d.lastKnownProfile;
    if (!prev) {
      d.lastKnownProfile = snapshotProfile(d);
      return null;
    }
    const curr = snapshotProfile(d);
    const evolutions = [];

    if (curr.favoriteOpening && curr.favoriteOpening !== prev.favoriteOpening) {
      evolutions.push('"You have changed your opening. Interesting. Tell me what you learned."');
    }
    if (prev.winRate != null && curr.winRate > prev.winRate + 0.1) {
      evolutions.push('"Your win rate is climbing. I see it. I do not like it."');
    }
    if (prev.winRate != null && curr.winRate < prev.winRate - 0.1) {
      evolutions.push('"Your results have slipped. Something in your life is not at the board."');
    }

    d.lastKnownProfile = curr;
    return evolutions.length > 0 ? evolutions[Math.floor(Math.random() * evolutions.length)] : null;
  }

  function snapshotProfile(d) {
    const openings = [
      { name: 'e4', count: d.openingsE4 },
      { name: 'd4', count: d.openingsD4 },
      { name: 'Nf3', count: d.openingsNf3 },
      { name: 'c4', count: d.openingsC4 }
    ];
    openings.sort((a, b) => b.count - a.count);
    return {
      favoriteOpening: openings[0].count > 0 ? openings[0].name : null,
      winRate: d.gamesPlayed > 0 ? d.gamesWon / d.gamesPlayed : null,
      matchesPlayed: d.matchesPlayed
    };
  }
  // ---------- Module state -----------------------------------------------
  let canvas = null;
  let ctx = null;
  let modal = null;
  let rafId = null;
  let state = 'closed';   // 'closed' | 'modeSelect' | 'difficultySelect' | 'formatSelect' | 'timeSelect' | 'game' | 'interstitial' | 'matchEnd'

  // Board interaction
  let selectedSq = -1;            // currently selected square (-1 = none)
  let legalTargets = [];          // legal destination squares from selected
  let draggingPiece = null;       // { fromSq, pieceType, pointerX, pointerY, startedAt }
  let boardFlipped = false;       // true when player is black (display from black's POV)

  // Dialogue display
  let dialogue = '';
  let dialogueTimer = 0;

  // HUD regions
  const hud = {
    close: null,
    screens: {}        // keyed per-screen
  };

  // Pending promotion
  let promoPending = null;    // { from, to } waiting for piece choice
  let promoRegions = null;

  // Clock last update tick
  let lastClockTick = 0;

  // Temp match selection state during setup screens
  let pendingDifficulty = 'casual';
  let pendingFormat = 5;
  let pendingTimeControl = 'rapid_5_3';

  function say(cat) {
    const line = pickLine(cat);
    if (!line) return;
    dialogue = line;
    dialogueTimer = 380;
  }

  // ---------- Board → screen coords --------------------------------------
  // Board is rendered centered in available space. Square size derived.
  function computeBoardLayout() {
    const W = canvas.width;
    const H = canvas.height;
    // Reserve top for top-bar + indicator + dialogue, bottom for clocks
    const topPad = 150;  // top bar (40) + indicator (28) + dialogue (60) + gaps
    const bottomPad = 70;  // clocks (40) + gap (30)
    const sidePad = 12;
    const availW = W - sidePad * 2;
    const availH = H - topPad - bottomPad;
    const size = Math.min(availW, availH);
    const boardSize = Math.floor(size / 8) * 8;   // align to 8
    const sqSize = boardSize / 8;
    const boardX = (W - boardSize) / 2;
    const boardY = topPad + (availH - boardSize) / 2;
    return { boardX, boardY, boardSize, sqSize };
  }

  function sqToScreen(square, layout) {
    const file = fileOf(square);
    const rank = rankOf(square);
    const displayFile = boardFlipped ? 7 - file : file;
    const displayRank = boardFlipped ? rank : 7 - rank;
    return {
      x: layout.boardX + displayFile * layout.sqSize,
      y: layout.boardY + displayRank * layout.sqSize
    };
  }

  function screenToSq(sx, sy, layout) {
    const file = Math.floor((sx - layout.boardX) / layout.sqSize);
    const rank = Math.floor((sy - layout.boardY) / layout.sqSize);
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return -1;
    const actualFile = boardFlipped ? 7 - file : file;
    const actualRank = boardFlipped ? rank : 7 - rank;
    return sq(actualFile, actualRank);
  }

  // ---------- Piece rendering (vector glyphs, no external assets) ---------
  // Unicode chess pieces rendered in dark or light color.
  const PIECE_GLYPHS = {
    'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
    'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F'
  };

  function drawBoard(layout) {
    const { boardX, boardY, boardSize, sqSize } = layout;
    const game = match && match.currentGame;

    // ---- Outer frame: deep walnut with brass inlay ----
    ctx.save();
    // Drop shadow under the whole board
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(boardX - 12, boardY + boardSize + 4, boardSize + 24, 16);

    // Outer wood frame (walnut with gradient)
    const frameGrad = ctx.createLinearGradient(0, boardY - 14, 0, boardY + boardSize + 14);
    frameGrad.addColorStop(0, '#2a1405');
    frameGrad.addColorStop(0.5, '#4a220c');
    frameGrad.addColorStop(1, '#1a0a03');
    ctx.fillStyle = frameGrad;
    ctx.fillRect(boardX - 14, boardY - 14, boardSize + 28, boardSize + 28);

    // Wood grain streaks on the frame
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const offset = 2 + i * 3;
      ctx.beginPath();
      ctx.moveTo(boardX - 14, boardY - 14 + offset);
      ctx.bezierCurveTo(
        boardX + boardSize * 0.3, boardY - 14 + offset + Math.sin(i) * 2,
        boardX + boardSize * 0.7, boardY - 14 + offset - Math.cos(i) * 2,
        boardX + boardSize + 14, boardY - 14 + offset
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(boardX - 14, boardY + boardSize + 14 - offset);
      ctx.bezierCurveTo(
        boardX + boardSize * 0.4, boardY + boardSize + 14 - offset + Math.cos(i) * 2,
        boardX + boardSize * 0.6, boardY + boardSize + 14 - offset - Math.sin(i) * 2,
        boardX + boardSize + 14, boardY + boardSize + 14 - offset
      );
      ctx.stroke();
    }
    ctx.restore();

    // Brass inlay border (two thin lines around the playfield)
    ctx.strokeStyle = 'rgba(210,170,90,0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boardX - 3, boardY - 3, boardSize + 6, boardSize + 6);
    ctx.strokeStyle = 'rgba(150,110,50,0.5)';
    ctx.strokeRect(boardX - 1, boardY - 1, boardSize + 2, boardSize + 2);
    ctx.restore();

    // ---- Squares with wood-tone gradients ----
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const displayFile = boardFlipped ? 7 - f : f;
        const displayRank = boardFlipped ? r : 7 - r;
        const x = boardX + displayFile * sqSize;
        const y = boardY + displayRank * sqSize;
        const isLight = (f + r) % 2 === 1;

        if (isLight) {
          // Light squares: aged maple / bone
          const gL = ctx.createLinearGradient(x, y, x, y + sqSize);
          gL.addColorStop(0,   '#ead4a2');
          gL.addColorStop(0.5, '#e4cd9a');
          gL.addColorStop(1,   '#d9c085');
          ctx.fillStyle = gL;
        } else {
          // Dark squares: walnut / figured brown
          const gD = ctx.createLinearGradient(x, y, x, y + sqSize);
          gD.addColorStop(0,   '#7a4818');
          gD.addColorStop(0.5, '#6a3c0f');
          gD.addColorStop(1,   '#5a3008');
          ctx.fillStyle = gD;
        }
        ctx.fillRect(x, y, sqSize, sqSize);

        // Subtle wood grain — 1-2 faint horizontal lines per square
        ctx.save();
        ctx.globalAlpha = isLight ? 0.10 : 0.22;
        ctx.strokeStyle = isLight ? '#9c7a3d' : '#2a1405';
        ctx.lineWidth = 0.5;
        const grainY1 = y + sqSize * 0.3;
        const grainY2 = y + sqSize * 0.7;
        ctx.beginPath();
        ctx.moveTo(x + 2, grainY1 + Math.sin(f + r) * 0.8);
        ctx.lineTo(x + sqSize - 2, grainY1 + Math.cos(f + r) * 0.8);
        ctx.moveTo(x + 2, grainY2 + Math.cos(f + r) * 0.6);
        ctx.lineTo(x + sqSize - 2, grainY2 + Math.sin(f + r) * 0.6);
        ctx.stroke();
        ctx.restore();

        // Inner shadow on the top-left edge of each square (gives depth)
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + sqSize, y);
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + sqSize);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Rank / file labels
    ctx.save();
    ctx.font = '9px Georgia, serif';
    ctx.fillStyle = 'rgba(240,220,180,0.7)';
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < 8; i++) {
      // Files along bottom
      const df = boardFlipped ? 7 - i : i;
      ctx.textAlign = 'left';
      ctx.fillText(FILES[i], boardX + df * sqSize + 3, boardY + boardSize - 3);
      // Ranks along left
      const dr = boardFlipped ? i : 7 - i;
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), boardX - 3, boardY + dr * sqSize + 11);
    }
    ctx.restore();

    // Highlights
    if (selectedSq >= 0) {
      const p = sqToScreen(selectedSq, layout);
      ctx.fillStyle = 'rgba(247,201,72,0.4)';
      ctx.fillRect(p.x, p.y, sqSize, sqSize);
    }
    for (const t of legalTargets) {
      const p = sqToScreen(t, layout);
      ctx.fillStyle = 'rgba(100,180,100,0.35)';
      ctx.beginPath();
      ctx.arc(p.x + sqSize / 2, p.y + sqSize / 2, sqSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    // Last move highlight
    if (game && game.moveList.length > 0) {
      const last = game.moveList[game.moveList.length - 1];
      const from = sqToScreen(last.from, layout);
      const to = sqToScreen(last.to, layout);
      ctx.fillStyle = 'rgba(217,166,121,0.25)';
      ctx.fillRect(from.x, from.y, sqSize, sqSize);
      ctx.fillRect(to.x, to.y, sqSize, sqSize);
    }
    // Check indicator
    if (game) {
      const sideInCheck = inCheck(game.position, game.position.sideToMove) ? game.position.sideToMove : null;
      if (sideInCheck) {
        const ks = findKing(game.position, sideInCheck);
        if (ks >= 0) {
          const p = sqToScreen(ks, layout);
          ctx.fillStyle = 'rgba(200,30,30,0.5)';
          ctx.fillRect(p.x, p.y, sqSize, sqSize);
        }
      }
    }
  }

  function drawPieces(layout) {
    if (!match || !match.currentGame) return;
    const { sqSize } = layout;
    const pos = match.currentGame.position;
    const fontSize = Math.floor(sqSize * 0.82);
    ctx.save();
    ctx.font = fontSize + 'px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 64; i++) {
      const p = pos.board[i];
      if (!p) continue;
      if (draggingPiece && draggingPiece.fromSq === i) continue;
      const coords = sqToScreen(i, layout);
      const cx = coords.x + sqSize / 2;
      const cy = coords.y + sqSize / 2;
      drawElegantPiece(p, cx, cy, fontSize);
    }
    if (draggingPiece) {
      const p = match.currentGame.position.board[draggingPiece.fromSq];
      if (p) {
        drawElegantPiece(p, draggingPiece.pointerX, draggingPiece.pointerY, fontSize, true);
      }
    }
    ctx.restore();
  }

  // Render a chess piece as if it were carved from ivory or ebony.
  // Layers: soft ground shadow, base fill with gradient, rim line, specular highlight.
  function drawElegantPiece(p, cx, cy, fontSize, lifted) {
    const glyph = PIECE_GLYPHS[p];
    const white = isWhite(p);

    // Ground shadow — softer, cast below the piece
    ctx.save();
    if (lifted) {
      // Dragged piece casts a longer, softer shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillText(glyph, cx + 3, cy + 5);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillText(glyph, cx + 5, cy + 8);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillText(glyph, cx + 1.5, cy + 2.5);
    }
    ctx.restore();

    if (white) {
      // ---- IVORY piece ----
      // Base warm cream fill
      ctx.save();
      ctx.fillStyle = '#f4e6c6';
      ctx.fillText(glyph, cx, cy);
      ctx.restore();

      // Bottom shading (the piece has a darker bottom like a rounded form)
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(180,150,100,0.22)';
      ctx.fillText(glyph, cx, cy + 1.2);
      ctx.restore();

      // Dark rim outline (so piece reads cleanly on light squares)
      ctx.save();
      ctx.strokeStyle = 'rgba(60,40,18,0.85)';
      ctx.lineWidth = 1.1;
      ctx.strokeText(glyph, cx, cy);
      ctx.restore();

      // Top highlight — specular
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,248,222,0.35)';
      ctx.fillText(glyph, cx - 0.6, cy - 1);
      ctx.restore();

      // Fine aged patina — very subtle
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(220,200,160,0.08)';
      ctx.fillText(glyph, cx, cy);
      ctx.restore();

    } else {
      // ---- EBONY / DARK WOOD piece ----
      // Deep espresso base (NOT pure black)
      ctx.save();
      ctx.fillStyle = '#1a0e06';
      ctx.fillText(glyph, cx, cy);
      ctx.restore();

      // Warm brown undertone (makes it wood, not plastic)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(90,50,20,0.30)';
      ctx.fillText(glyph, cx, cy + 0.5);
      ctx.restore();

      // Light rim outline (visible on dark squares)
      ctx.save();
      ctx.strokeStyle = 'rgba(220,190,140,0.35)';
      ctx.lineWidth = 0.8;
      ctx.strokeText(glyph, cx, cy);
      ctx.restore();

      // Top specular highlight — warm, subtle
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(200,160,90,0.28)';
      ctx.fillText(glyph, cx - 0.5, cy - 1.2);
      ctx.restore();

      // Very faint inner glow on the edges — makes the wood look polished
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,210,140,0.08)';
      ctx.fillText(glyph, cx, cy);
      ctx.restore();
    }
  }

  function formatClock(ms) {
    if (ms < 0) ms = 0;
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ':' + (sec < 10 ? '0' + sec : sec);
  }

  function drawClocks() {
    if (!match || !match.currentGame) return;
    const g = match.currentGame;
    const W = canvas.width;
    const H = canvas.height;
    const h = 34;
    const y = H - h - 20;  // clocks anchored near bottom
    const pad = 12;
    const halfW = (W - pad * 3) / 2;

    // Baron clock (top half visually — or left on portrait)
    const baronActive = g.position.sideToMove === g.baronColor;
    ctx.save();
    ctx.fillStyle = baronActive ? 'rgba(74,24,8,0.92)' : 'rgba(30,20,10,0.82)';
    roundRect(ctx, pad, y, halfW, h, 5);
    ctx.fill();
    ctx.strokeStyle = baronActive ? '#f7c948' : '#8a6b2e';
    ctx.lineWidth = baronActive ? 1.5 : 1;
    ctx.stroke();
    ctx.fillStyle = baronActive ? '#f5ecd7' : '#c9b98a';
    ctx.font = 'italic bold 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('GREAVES', pad + 10, y + 4);
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatClock(g.baronClockMs), pad + halfW - 10, y + h / 2 + 2);

    // Player clock
    const playerActive = g.position.sideToMove === g.playerColor;
    ctx.fillStyle = playerActive ? 'rgba(74,24,8,0.92)' : 'rgba(30,20,10,0.82)';
    roundRect(ctx, pad * 2 + halfW, y, halfW, h, 5);
    ctx.fill();
    ctx.strokeStyle = playerActive ? '#f7c948' : '#8a6b2e';
    ctx.lineWidth = playerActive ? 1.5 : 1;
    ctx.stroke();
    ctx.fillStyle = playerActive ? '#f5ecd7' : '#c9b98a';
    ctx.font = 'italic bold 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('YOU', pad * 2 + halfW + 10, y + 4);
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatClock(g.playerClockMs), pad * 2 + halfW * 2 - 10, y + h / 2 + 2);
    ctx.restore();
  }

  function drawDialogue() {
    if (!dialogue || dialogueTimer <= 0) return;
    const W = canvas.width;
    const boxH = 60;
    const boxY = 80;  // below top bar (40) + indicator row (28) + gaps
    ctx.save();
    ctx.fillStyle = 'rgba(20,12,8,0.92)';
    ctx.strokeStyle = 'rgba(210,170,110,0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, 8, boxY, W - 16, boxH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ebdab3';
    ctx.font = 'italic bold 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('GREAVES', 18, boxY + 6);
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '12px Georgia, serif';
    const lines = wrapText(dialogue, W - 36);
    for (let i = 0; i < lines.length && i < 2; i++) {
      ctx.fillText(lines[i], 18, boxY + 22 + i * 16);
    }
    ctx.restore();
    dialogueTimer--;
  }

  function drawBrainIndicator() {
    // Small pill in top-left showing Stockfish status + thinking state.
    //   - Green dot = Stockfish loaded and ready (real chess)
    //   - Amber dot = Stockfish loading
    //   - Red dot = Stockfish not available, random moves
    //   - Bulb pulses warm amber when Greaves is actively thinking
    if (state !== 'game' || !match) return;

    const bx = 10;
    const by = 46;
    const bw = 104;
    const bh = 28;

    ctx.save();
    // Pill background
    ctx.fillStyle = 'rgba(20,12,8,0.75)';
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(138,107,46,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Connection status dot
    let dotColor;
    if (stockfishReady) dotColor = '#4ade80';     // green — ready
    else if (stockfish) dotColor = '#f7c948';     // amber — loading
    else dotColor = '#c0392b';                    // red — fallback/not loaded
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(bx + 10, by + bh / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Brain bulb icon — pulses when thinking
    const thinking = stockfishMoveResolver !== null;
    const bulbX = bx + 30;
    const bulbY = by + bh / 2;
    const pulsePhase = thinking ? (Math.sin(performance.now() / 180) + 1) / 2 : 0;
    const pulse = 0.4 + pulsePhase * 0.6;

    // Glow halo when thinking
    if (thinking) {
      const glowR = 13 + pulsePhase * 4;
      const glow = ctx.createRadialGradient(bulbX, bulbY, 2, bulbX, bulbY, glowR);
      glow.addColorStop(0, 'rgba(247,201,72,' + (0.5 * pulse) + ')');
      glow.addColorStop(1, 'rgba(247,201,72,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bulb body (simple round bulb with base)
    const bulbColor = thinking ? 'rgba(247,201,72,' + pulse + ')' : 'rgba(180,150,100,0.7)';
    ctx.fillStyle = bulbColor;
    ctx.beginPath();
    ctx.arc(bulbX, bulbY - 2, 5, 0, Math.PI * 2);  // glass bulb
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,20,0.8)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Bulb base
    ctx.fillStyle = 'rgba(90,60,20,0.9)';
    ctx.fillRect(bulbX - 2.5, bulbY + 3, 5, 3);
    // Bulb filament (small line inside)
    if (thinking) {
      ctx.strokeStyle = 'rgba(255,230,150,' + pulse + ')';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(bulbX - 2, bulbY - 2);
      ctx.lineTo(bulbX + 2, bulbY - 2);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = thinking ? '#f7c948' : '#c9b98a';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stockfishReady ? 'YES' : 'NO', bx + 44, by + bh / 2 + 1);
    ctx.restore();
  }

  function drawTopBar() {
    const W = canvas.width;
    ctx.save();
    // Match score (if in match)
    if (match) {
      ctx.fillStyle = 'rgba(20,12,8,0.78)';
      ctx.fillRect(0, 0, W, 40);
      ctx.fillStyle = '#ebdab3';
      ctx.font = 'italic 11px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Bo' + match.format + '  ·  ' + match.difficulty.label, 14, 20);
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillStyle = '#f5ecd7';
      ctx.fillText(match.playerGames + ' — ' + match.baronGames, W / 2, 22);
      ctx.textAlign = 'right';
      ctx.font = 'italic 11px Georgia, serif';
      ctx.fillStyle = '#c9b98a';
      ctx.fillText('First to ' + match.toWin, W - 14, 20);
    }
    ctx.restore();
  }

  function drawPromotionDialog() {
    if (!promoPending) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,2,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 16px Georgia, serif';
    ctx.fillText('PROMOTE TO...', W / 2, H / 2 - 80);

    const g = match.currentGame;
    const side = g.playerColor;
    const pieces = side === 'w' ? ['Q','R','B','N'] : ['q','r','b','n'];
    const bw = 62;
    const bh = 80;
    const totalW = bw * 4 + 12 * 3;
    const startX = W / 2 - totalW / 2;
    const by = H / 2 - 40;
    promoRegions = {};
    for (let i = 0; i < 4; i++) {
      const x = startX + i * (bw + 12);
      ctx.fillStyle = '#4a1808';
      roundRect(ctx, x, by, bw, bh, 6);
      ctx.fill();
      ctx.strokeStyle = '#d9a679';
      ctx.stroke();
      ctx.fillStyle = isWhite(pieces[i]) ? '#f8f1dc' : '#1a0a03';
      ctx.strokeStyle = isWhite(pieces[i]) ? '#1a0a03' : '#f8f1dc';
      ctx.font = Math.floor(bw * 0.7) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 1.2;
      ctx.strokeText(PIECE_GLYPHS[pieces[i]], x + bw / 2, by + bh / 2);
      ctx.fillText(PIECE_GLYPHS[pieces[i]], x + bw / 2, by + bh / 2);
      promoRegions[pieces[i]] = { x, y: by, w: bw, h: bh };
    }
    ctx.restore();
  }

  // ---------- Render router ----------------------------------------------
  function render() {
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    if (state === 'modeSelect') { drawModeSelect(); return; }
    if (state === 'difficultySelect') { drawDifficultySelect(); return; }
    if (state === 'formatSelect') { drawFormatSelect(); return; }
    if (state === 'timeSelect') { drawTimeSelect(); return; }
    if (state === 'interstitial') { drawInterstitial(); return; }
    if (state === 'matchEnd') { drawMatchEnd(); return; }

    // Game board
    const bg = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    bg.addColorStop(0, '#1a0e07');
    bg.addColorStop(1, '#050201');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawTopBar();
    drawBrainIndicator();
    const layout = computeBoardLayout();
    drawBoard(layout);
    drawPieces(layout);
    drawClocks();
    drawDialogue();
    drawPromotionDialog();
  }

  // ---------- Helpers (roundRect, wrapText) ------------------------------
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
    ctx.font = ctx.font;  // use whatever font is set
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

  function hitRect(x, y, r) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  // ---------- Screen drawing ---------------------------------------------
  function fillScreenBackground() {
    const W = canvas.width;
    const H = canvas.height;
    const g = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, Math.max(W, H));
    g.addColorStop(0, '#2a1206');
    g.addColorStop(1, '#0a0503');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawScreenTitle(title, subtitle) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 20px Georgia, serif';
    const titleY = Math.max(60, H * 0.12);
    ctx.fillText(title, W / 2, titleY);
    if (subtitle) {
      ctx.font = 'italic 12px Georgia, serif';
      ctx.fillStyle = '#c9b98a';
      const lines = wrapText(subtitle, W - 40);
      let y = titleY + 26;
      for (const l of lines) { ctx.fillText(l, W / 2, y); y += 16; }
      return y;
    }
    return titleY + 30;
  }

  function drawStackedButtons(startY, buttons) {
    // buttons: [{ key, title, subtitle, primary }]
    const W = canvas.width;
    const H = canvas.height;
    const cw = Math.min(320, W - 40);
    const cx = W / 2 - cw / 2;
    const btnH = 64;
    const gap = 12;
    const n = buttons.length;
    const totalH = btnH * n + gap * (n - 1);
    const availH = H - 40 - startY;
    let y = availH > totalH ? startY + (availH - totalH) / 2 : startY;

    const regions = {};
    for (const b of buttons) {
      ctx.fillStyle = b.primary ? '#4a1808' : '#2a1206';
      roundRect(ctx, cx, y, cw, btnH, 8);
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
        ctx.fillText(b.subtitle, W / 2, y + 46);
      }
      regions[b.key] = { x: cx, y: y, w: cw, h: btnH };
      y += btnH + gap;
    }
    return regions;
  }

  function drawModeSelect() {
    fillScreenBackground();
    const contentY = drawScreenTitle('THE CHESS TABLE', 'Greaves looks up from his book and smiles. "Do you play?"');
    hud.screens.mode = drawStackedButtons(contentY + 20, [
      { key: 'challenge', title: 'CHALLENGE GREAVES', subtitle: 'A match. He\'d love one.', primary: true },
      { key: 'leave', title: 'LEAVE THE ROOM', subtitle: 'He\'ll see you another time.', primary: false }
    ]);
  }

  function drawDifficultySelect() {
    fillScreenBackground();
    const contentY = drawScreenTitle('CHOOSE YOUR STRENGTH', 'Greaves will play within your chosen range.');
    const buttons = [
      { key: 'beginner',    title: DIFFICULTY_LEVELS.beginner.label,    subtitle: 'He\'ll be happy to let you find your feet.', primary: true },
      { key: 'casual',      title: DIFFICULTY_LEVELS.casual.label,      subtitle: 'He\'ll play straight, but friendly.', primary: true },
      { key: 'hard',        title: DIFFICULTY_LEVELS.hard.label,        subtitle: 'He\'ll push you properly.', primary: true },
      { key: 'grandmaster', title: DIFFICULTY_LEVELS.grandmaster.label, subtitle: 'He\'ll enjoy himself. You might too.', primary: true },
      { key: 'back',        title: '← BACK', subtitle: null, primary: false }
    ];
    hud.screens.difficulty = drawStackedButtons(contentY + 14, buttons);
  }

  function drawFormatSelect() {
    fillScreenBackground();
    const contentY = drawScreenTitle('HOW MANY GAMES?', 'A match is a conversation. You\'ll remember where it turned.');
    hud.screens.format = drawStackedButtons(contentY + 14, [
      { key: 'bo3', title: 'BEST OF 3', subtitle: 'First to 2 games. Quick.', primary: true },
      { key: 'bo5', title: 'BEST OF 5', subtitle: 'First to 3. The proper match.', primary: true },
      { key: 'bo7', title: 'BEST OF 7', subtitle: 'First to 4. Test of endurance.', primary: true },
      { key: 'back', title: '← BACK', subtitle: null, primary: false }
    ]);
  }

  function drawTimeSelect() {
    fillScreenBackground();
    const contentY = drawScreenTitle('THE CLOCK', 'How long would you like to think? No wrong answer here.');
    const tc = TIME_CONTROLS;
    hud.screens.time = drawStackedButtons(contentY + 14, [
      { key: 'blitz_3_2', title: tc.blitz_3_2.label, subtitle: tc.blitz_3_2.tag, primary: true },
      { key: 'rapid_5_3', title: tc.rapid_5_3.label, subtitle: tc.rapid_5_3.tag, primary: true },
      { key: 'standard_10_5', title: tc.standard_10_5.label, subtitle: tc.standard_10_5.tag, primary: true },
      { key: 'classical_15_10', title: tc.classical_15_10.label, subtitle: tc.classical_15_10.tag, primary: true },
      { key: 'back', title: '← BACK', subtitle: null, primary: false }
    ]);
  }

  function drawInterstitial() {
    fillScreenBackground();
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 18px Georgia, serif';
    const titleY = Math.max(50, H * 0.08);
    ctx.fillText('BETWEEN GAMES', W / 2, titleY);

    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerGames + '   —   ' + match.baronGames, W / 2, titleY + 56);
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.fillText('YOU         GREAVES', W / 2, titleY + 76);

    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#8a6b2e';
    ctx.fillText('Bo' + match.format + ' — first to ' + match.toWin + '  ·  ' + match.timeControl.label, W / 2, titleY + 94);

    // Notes
    const notesTop = titleY + 122;
    ctx.font = 'italic bold 13px Georgia, serif';
    ctx.fillStyle = '#d9a679';
    ctx.fillText("GREAVES' NOTES ON YOU", W / 2, notesTop);

    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#e8dcc3';
    ctx.textAlign = 'left';
    const notes = match.interstitialNotes || generateNotes();
    match.interstitialNotes = notes;
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

    // Evolution line (if detected)
    if (match.evolutionNote) {
      ny += 6;
      ctx.font = 'italic bold 12px Georgia, serif';
      ctx.fillStyle = '#f7c948';
      ctx.fillText(match.evolutionNote, padX, ny);
      ny += 18;
    }

    // Continue button
    const contW = Math.min(240, W - 40);
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
    ctx.fillText('BEGIN NEXT GAME', W / 2, contY + contH / 2);

    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    ctx.textBaseline = 'alphabetic';
    const whiteLabel = match.nextWhite === 'player' ? 'You play White' : 'Greaves plays White';
    ctx.fillText(whiteLabel, W / 2, contY - 8);

    hud.screens.interstitial = { continue: { x: contX, y: contY, w: contW, h: contH } };
  }

  function drawMatchEnd() {
    fillScreenBackground();
    const W = canvas.width;
    const H = canvas.height;

    const playerWon = match.playerGames > match.baronGames;
    ctx.fillStyle = playerWon ? '#f7c948' : '#ebdab3';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 24px Georgia, serif';
    const titleY = Math.max(50, H * 0.10);
    ctx.fillText(playerWon ? 'YOU WIN THE MATCH' : 'GREAVES WINS', W / 2, titleY);

    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillStyle = '#f5ecd7';
    ctx.fillText(match.playerGames + '  —  ' + match.baronGames, W / 2, titleY + 56);

    // Dossier lifetime stats
    const d = match.dossier;
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#c9b98a';
    let sy = titleY + 94;
    ctx.textAlign = 'left';
    const padX = 28;
    ctx.fillStyle = '#d9a679';
    ctx.font = 'italic bold 12px Georgia, serif';
    ctx.fillText('LIFETIME LINE AGAINST GREAVES', padX, sy);
    sy += 20;
    ctx.fillStyle = '#e8dcc3';
    ctx.font = '12px Georgia, serif';
    const rows = [
      '  Matches:     ' + d.matchesWon + ' — ' + d.matchesLost + '  (of ' + d.matchesPlayed + ')',
      '  Games:       ' + d.gamesWon + ' — ' + d.gamesLost + '  (' + d.gamesDrawn + ' drawn, of ' + d.gamesPlayed + ')',
      '  Avg move time: ' + (d.averageMoveMs / 1000).toFixed(1) + 's',
      '  Castles:     ' + d.castledKingside + ' kingside, ' + d.castledQueenside + ' queenside'
    ];
    for (const r of rows) { ctx.fillText(r, padX, sy); sy += 17; }
    sy += 8;

    // Baron's read
    ctx.fillStyle = '#d9a679';
    ctx.font = 'italic bold 12px Georgia, serif';
    ctx.fillText("GREAVES' READ", padX, sy);
    sy += 20;
    ctx.fillStyle = '#e8dcc3';
    ctx.font = 'italic 12px Georgia, serif';
    const notes = generateNotes().slice(0, 3);
    const maxW = W - padX * 2;
    for (const note of notes) {
      const lines = wrapText(note, maxW);
      for (const l of lines) { ctx.fillText(l, padX, sy); sy += 16; }
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

    hud.screens.matchEnd = {
      rematch: { x: bx0, y: by, w: bw, h: bh },
      menu:    { x: bx1, y: by, w: bw, h: bh }
    };
  }

  // ---------- Game flow --------------------------------------------------
  function startMatch() {
    newMatch(pendingFormat, pendingDifficulty, pendingTimeControl);
    // Save back to dossier the evolution snapshot
    const evo = detectEvolution();
    if (evo) match.evolutionNote = evo;
    startNewGame();
    state = 'game';

    // Load stockfish if not loaded
    loadStockfish().then(() => {
      setEngineStrength(computeEngineSkill());
    }).catch(() => { /* fall back to random */ });

    // Preamble dialogue
    setTimeout(() => say('preMatch'), 150);
  }

  function startNewGame() {
    newGameInMatch();
    const g = match.currentGame;
    boardFlipped = g.playerColor === 'b';
    g.clockStart = performance.now();
    g.playerMoveStart = g.clockStart;
    selectedSq = -1;
    legalTargets = [];
    draggingPiece = null;
    promoPending = null;
    lastClockTick = performance.now();
    // If baron plays white, trigger his move
    if (g.baronColor === 'w') {
      setTimeout(baronMove, 900);
    } else {
      setTimeout(() => sayAdaptive('opening'), 600);
    }
  }

  // Player completes a move (from, to, [promotion piece char like 'q'|'r'|'b'|'n'])
  function playerMove(from, to, promotionChoice) {
    if (!match || !match.currentGame) return false;
    const g = match.currentGame;
    if (g.position.sideToMove !== g.playerColor) return false;

    const legal = generateLegalMoves(g.position);
    let matched = null;
    for (const m of legal) {
      if (m.from === from && m.to === to) {
        if (m.promotion) {
          if (!promotionChoice) {
            // Need to ask — open promotion dialog
            promoPending = { from, to };
            return true;
          }
          const wantLower = promotionChoice.toLowerCase();
          if (pieceType(m.promotion) === wantLower) { matched = m; break; }
        } else {
          matched = m;
          break;
        }
      }
    }
    if (!matched) return false;

    // Time accounting
    const now = performance.now();
    const tTaken = now - (g.playerMoveStart || now);
    g.playerClockMs = Math.max(0, g.playerClockMs - tTaken + match.timeControl.increment * 1000);

    // Apply move
    g.position = makeMove(g.position, matched);
    g.moveList.push(matched);
    g.moveCount++;
    recordPlayerMove(matched, g.position, tTaken);

    // Psych
    const givesCheck = inCheck(g.position, g.position.sideToMove);
    updatePsych('player', {
      wasCapture: !!matched.captured,
      wasCheck: givesCheck,
      wasMate: isCheckmate(g.position),
      gameWon: false, gameLost: false
    });

    // Dialogue on big events
    if (matched.captured && pieceType(matched.captured) === 'q') sayAdaptive('capture_major');
    else if (matched.captured && (pieceType(matched.captured) === 'r')) sayAdaptive('capture_major');
    else if (givesCheck) sayAdaptive('check_received');
    else if (g.moveCount === 2 && Math.random() < 0.5) sayAdaptive('opening');
    else if (g.moveCount === 8 && Math.random() < 0.6) sayAdaptive('early');
    else if (g.moveCount === 20 && Math.random() < 0.5) sayAdaptive('probing');
    else if (g.moveCount === 30 && Math.random() < 0.4) sayAdaptive('dossier');

    // Check for game end
    if (checkGameEnd()) return true;

    // Trigger baron response
    g.clockStart = performance.now();
    setTimeout(baronMove, 400 + Math.random() * 300);
    return true;
  }

  async function baronMove() {
    if (!match || !match.currentGame) return;
    const g = match.currentGame;
    if (g.position.sideToMove !== g.baronColor) return;
    if (g.result) return;

    const thinkStart = performance.now();

    // Get best move from stockfish or fallback
    setEngineStrength(computeEngineSkill());
    const tc = match.timeControl;
    // Think time: scales with clock and difficulty
    const thinkMs = Math.min(match.difficulty.thinkMs, Math.max(200, g.baronClockMs * 0.04));

    let uci = null;
    if (stockfish && stockfishReady) {
      uci = await engineBestMove(g.position, thinkMs);
    }

    if (!uci) {
      // Fallback
      const fm = fallbackMove(g.position);
      if (!fm) return;
      uci = moveToUCI(fm);
    }

    const move = uciToMove(uci, g.position);
    if (!move) return;

    // Time accounting for baron
    const tTaken = performance.now() - thinkStart;
    g.baronClockMs = Math.max(0, g.baronClockMs - tTaken + match.timeControl.increment * 1000);

    if (move.captured) recordBaronCapture(move.captured);
    g.position = makeMove(g.position, move);
    g.moveList.push(move);
    g.moveCount++;

    const givesCheck = inCheck(g.position, g.position.sideToMove);
    updatePsych('baron', {
      wasCapture: !!move.captured,
      wasCheck: givesCheck,
      wasMate: isCheckmate(g.position),
      gameWon: false, gameLost: false
    });

    // Dialogue
    if (isCheckmate(g.position)) {
      // will be handled by checkGameEnd
    } else if (givesCheck) {
      sayAdaptive('check_given');
    } else if (move.captured && (pieceType(move.captured) === 'q' || pieceType(move.captured) === 'r')) {
      sayAdaptive('capture_major');
    } else if (g.moveCount > 10 && g.moveCount < 30 && Math.random() < 0.18) {
      sayAdaptive('mid');
    } else if (Math.random() < 0.08) {
      sayAdaptive('philosophical');
    }

    if (checkGameEnd()) return;

    g.playerMoveStart = performance.now();
  }

  function checkGameEnd() {
    const g = match.currentGame;
    if (!g) return false;

    // Time loss
    if (g.playerClockMs <= 0) {
      endGame('b_wins', 'Time forfeit (player)');
      return true;
    }
    if (g.baronClockMs <= 0) {
      endGame('w_wins', 'Time forfeit (Baron)');
      return true;
    }

    const res = gameResult(g.position);
    if (!res) return false;
    endGame(res, res);
    return true;
  }

  function endGame(result, reason) {
    const g = match.currentGame;
    if (!g) return;
    g.result = result;
    g.resultReason = reason;

    // Translate to player/baron perspective
    const playerIsWhite = g.playerColor === 'w';
    let playerWon = false, baronWon = false, drawn = false;
    if (result === 'w_wins') {
      if (playerIsWhite) playerWon = true; else baronWon = true;
    } else if (result === 'b_wins') {
      if (!playerIsWhite) playerWon = true; else baronWon = true;
    } else {
      drawn = true;
    }

    const d = match.dossier;
    if (playerWon) { match.playerGames++; d.gamesWon++; sayAdaptive('mate_lost'); }
    else if (baronWon) { match.baronGames++; d.gamesLost++; sayAdaptive('mate_won'); }
    else { match.drawnGames++; d.gamesDrawn++; sayAdaptive('stalemate'); }

    updatePsych(playerWon ? 'player' : 'baron', {
      gameWon: playerWon || drawn, gameLost: baronWon || drawn,
      wasMate: playerWon || baronWon
    });

    saveDossier(d);

    // Decide: match over or next game
    if (match.playerGames >= match.toWin) {
      match.dossier.matchesWon++;
      saveDossier(match.dossier);
      state = 'matchEnd';
      return;
    }
    if (match.baronGames >= match.toWin) {
      match.dossier.matchesLost++;
      saveDossier(match.dossier);
      state = 'matchEnd';
      return;
    }

    // Alternate colors
    match.nextWhite = match.nextWhite === 'player' ? 'baron' : 'player';
    // Reset per-game psych tensions
    match.momentum = 0;
    match.tilt = Math.max(0, match.tilt * 0.4);
    match.composure = Math.min(1, match.composure + 0.15);

    match.interstitialNotes = generateNotes();
    state = 'interstitial';
  }

  // Clock tick (called from main loop during game)
  function updateClocks() {
    if (!match || !match.currentGame) return;
    const g = match.currentGame;
    if (g.result) return;
    const now = performance.now();
    const dt = now - lastClockTick;
    lastClockTick = now;
    if (g.position.sideToMove === g.playerColor) {
      g.playerClockMs -= dt;
      if (g.playerClockMs <= 0) { g.playerClockMs = 0; checkGameEnd(); }
    } else {
      g.baronClockMs -= dt;
      if (g.baronClockMs <= 0) { g.baronClockMs = 0; checkGameEnd(); }
    }
  }

  // ---------- Input ------------------------------------------------------
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

  function onPointerDown(e) {
    if (e.cancelable) e.preventDefault();
    const p = getEventPoint(e);

    // Screens
    if (state === 'modeSelect') {
      const r = hud.screens.mode;
      if (!r) return;
      if (hitRect(p.x, p.y, r.challenge)) state = 'difficultySelect';
      else if (hitRect(p.x, p.y, r.leave)) closeChess();
      return;
    }
    if (state === 'difficultySelect') {
      const r = hud.screens.difficulty;
      if (!r) return;
      if (hitRect(p.x, p.y, r.beginner))        { pendingDifficulty = 'beginner';    state = 'formatSelect'; }
      else if (hitRect(p.x, p.y, r.casual))     { pendingDifficulty = 'casual';      state = 'formatSelect'; }
      else if (hitRect(p.x, p.y, r.hard))       { pendingDifficulty = 'hard';        state = 'formatSelect'; }
      else if (hitRect(p.x, p.y, r.grandmaster)){ pendingDifficulty = 'grandmaster'; state = 'formatSelect'; }
      else if (hitRect(p.x, p.y, r.back))       { state = 'modeSelect'; }
      return;
    }
    if (state === 'formatSelect') {
      const r = hud.screens.format;
      if (!r) return;
      if (hitRect(p.x, p.y, r.bo3))       { pendingFormat = 3; state = 'timeSelect'; }
      else if (hitRect(p.x, p.y, r.bo5))  { pendingFormat = 5; state = 'timeSelect'; }
      else if (hitRect(p.x, p.y, r.bo7))  { pendingFormat = 7; state = 'timeSelect'; }
      else if (hitRect(p.x, p.y, r.back)) { state = 'difficultySelect'; }
      return;
    }
    if (state === 'timeSelect') {
      const r = hud.screens.time;
      if (!r) return;
      if (hitRect(p.x, p.y, r.blitz_3_2))          { pendingTimeControl = 'blitz_3_2';       startMatch(); }
      else if (hitRect(p.x, p.y, r.rapid_5_3))     { pendingTimeControl = 'rapid_5_3';       startMatch(); }
      else if (hitRect(p.x, p.y, r.standard_10_5)) { pendingTimeControl = 'standard_10_5';   startMatch(); }
      else if (hitRect(p.x, p.y, r.classical_15_10)) { pendingTimeControl = 'classical_15_10'; startMatch(); }
      else if (hitRect(p.x, p.y, r.back)) { state = 'formatSelect'; }
      return;
    }
    if (state === 'interstitial') {
      const r = hud.screens.interstitial;
      if (!r || hitRect(p.x, p.y, r.continue)) {
        startNewGame();
        state = 'game';
      }
      return;
    }
    if (state === 'matchEnd') {
      const r = hud.screens.matchEnd;
      if (!r) return;
      if (hitRect(p.x, p.y, r.rematch)) {
        startMatch();   // uses pendingDifficulty/format/time
      } else if (hitRect(p.x, p.y, r.menu)) {
        match = null;
        state = 'modeSelect';
      }
      return;
    }

    if (state !== 'game') return;
    if (!match || !match.currentGame) return;

    // Promotion choice
    if (promoPending && promoRegions) {
      for (const [piece, region] of Object.entries(promoRegions)) {
        if (hitRect(p.x, p.y, region)) {
          const { from, to } = promoPending;
          promoPending = null;
          promoRegions = null;
          playerMove(from, to, piece);
          return;
        }
      }
      return;  // block other taps while promoting
    }

    const g = match.currentGame;
    if (g.position.sideToMove !== g.playerColor || g.result) return;

    const layout = computeBoardLayout();
    const target = screenToSq(p.x, p.y, layout);
    if (target < 0) { selectedSq = -1; legalTargets = []; return; }

    // If we have a selection and this is a legal target: move
    if (selectedSq >= 0 && legalTargets.indexOf(target) >= 0) {
      playerMove(selectedSq, target);
      selectedSq = -1;
      legalTargets = [];
      return;
    }

    // Selecting own piece: start drag / select
    const piece = g.position.board[target];
    if (piece && colorOf(piece) === g.playerColor) {
      selectedSq = target;
      const legal = generateLegalMoves(g.position);
      legalTargets = legal.filter(m => m.from === target).map(m => m.to);
      // Begin drag
      draggingPiece = { fromSq: target, pointerX: p.x, pointerY: p.y, startedAt: performance.now() };
    } else {
      selectedSq = -1;
      legalTargets = [];
    }
  }

  function onPointerMove(e) {
    if (!draggingPiece) return;
    if (e.cancelable) e.preventDefault();
    const p = getEventPoint(e);
    draggingPiece.pointerX = p.x;
    draggingPiece.pointerY = p.y;
  }

  function onPointerUp(e) {
    if (!draggingPiece) return;
    const p = getEventPoint(e);
    const layout = computeBoardLayout();
    const target = screenToSq(p.x, p.y, layout);
    const from = draggingPiece.fromSq;
    draggingPiece = null;
    if (target < 0 || target === from) {
      // just a click — keep selection
      return;
    }
    if (legalTargets.indexOf(target) >= 0) {
      playerMove(from, target);
      selectedSq = -1;
      legalTargets = [];
    }
  }

  // ---------- Main loop --------------------------------------------------
  function loop() {
    if (!canvas) return;
    if (state === 'game') updateClocks();
    render();
    rafId = requestAnimationFrame(loop);
  }

  // ---------- Open / Close -----------------------------------------------
  function openChess() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'nocturne-chess';
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
    close.addEventListener('click', closeChess);
    close.addEventListener('touchend', (e) => { e.preventDefault(); closeChess(); });

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;touch-action:none;width:100%;height:100%;';
    modal.appendChild(canvas);
    modal.appendChild(close);
    document.body.appendChild(modal);

    ctx = canvas.getContext('2d');
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    window.addEventListener('orientationchange', fitCanvas);

    state = 'modeSelect';

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

  function closeChess() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
    canvas = null;
    ctx = null;
    state = 'closed';
    if (match && match.dossier) saveDossier(match.dossier);
    match = null;
    selectedSq = -1;
    legalTargets = [];
    draggingPiece = null;
    promoPending = null;
    window.removeEventListener('resize', fitCanvas);
    window.removeEventListener('orientationchange', fitCanvas);
  }

  // Expose
  window.openChess = openChess;
  window.closeChess = closeChess;

})();
