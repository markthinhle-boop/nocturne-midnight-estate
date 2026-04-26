// ============================================================
// NOCTURNE — manor.js
// Verified asset maps from GitHub markthinhle-boop/nocturne-midnight-estate
// Prop system: examine-only furniture. Curator insults if placed on pedestal.
// Room descriptions WORD FOR WORD from KB v6 Section XI.
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

const _shownRoomDescriptions = new Set();

// ── VERIFIED ASSET MAPS ────────────────────────────────────

const ROOM_ASSET_MAP = {
  // ── TRAIN ──────────────────────────────────────────────────
  'train-compartment':  'room/nocturne-room-train-compartment-bg.jpg',
  'train-dining':       'room/nocturne-room-train-dining-bg.jpg',
  'train-rear':         'room/nocturne-room-train-rear-bg.jpg',
  // ── ESTATE ─────────────────────────────────────────────────
  'foyer':             'room/nocturne-room-foyer-bg.png',
  'gate':              'room/nocturne-room-gate-bg.jpg',
  'gate-closed':       'room/nocturne-room-gate-closed-bg.jpg',
  'gallery':           'room/nocturne-room-gallery-bg.png',
  'study':             'room/nocturne-room-study-bg.png',
  'archive-path':      'room/nocturne-room-archive-path-bg.png',
  'balcony':           'room/nocturne-room-balcony-bg.png',
  'terrace':           'room/nocturne-room-terrace-bg.png',
  'ballroom':          'room/nocturne-room-ballroom-bg.png',
  'antechamber':       'room/nocturne-room-antechamber-bg.jpg',
  'stage':             'room/nocturne-room-stage-bg.jpg',
  'library':           'room/nocturne-room-library-bg.png',
  'physicians':        'room/nocturne-room-physicians-bg.png',
  'smoking':           'room/nocturne-room-smoking-bg.jpg',
  'vault':             'room/nocturne-room-vault-bg.jpg',
  'wine-cellar':       'room/nocturne-room-wine-cellar-bg.jpg',
  'maids-quarters':    'room/nocturne-room-maids-quarters-bg.png',
  'groundskeeper-cottage': 'room/nocturne-room-groundskeeper-cottage-bg.png',
  // ── EAST WING (past the study) ─────────────────────────────
  'map-room':          'room/nocturne-room-map-bg.png',
  'dining-room':       'room/nocturne-dining-room-bg.png',
  'trophy-room':       'room/nocturne-room-trophy-bg.png',
  'billiard-room':     'room/nocturne-room-billiard-bg.png',
  'weapons-room':      'room/nocturne-room-weapons-bg.png',
  'conservatory':      'room/nocturne-conservatory-bg.png',
  'c1-arrival':        'room/nocturne-room-c1-antechamber.png',
  'c2-portraits':      'room/nocturne-room-c2-portraits-bg.jpg',
  'c3-original':       'room/nocturne-room-c3-original-bg.jpg',
  'c4-register':       'room/nocturne-room-c4-register-bg.jpg',
  'c5-correspondence': 'room/nocturne-room-c5-correspondence-bg.jpg',
  'c6-tunnel':         'room/nocturne-room-c6-tunnel-bg.jpg',
  'c7-study':          'room/nocturne-room-c7-study-bg.jpg',
  'c8-gallery':        'room/nocturne-room-c8-gallery-bg.jpg',
  'c9-agreement':      'room/nocturne-room-c9-agreement-bg.jpg',
  'c10-reckoning':     'room/nocturne-room-c10-reckoning-bg.png',
  'tunnel-passage':    'room/nocturne-room-c6-tunnel-bg.jpg',
};

const CHAR_ASSET_MAP = {
  // ── TRAIN ─────────────────────────────────────────────────
  'elliot':         'characters/nocturne-char-elliot-closed-bg.jpg',
  'marcus':         'characters/nocturne-char-marcus-closed-bg.jpg',
  'todd':           'characters/nocturne-char-todd-closed-bg.png',
  // ── ESTATE ───────────────────────────────────────────────
  'rowe':           'characters/nocturne-char-rowe-portrait.png',
  'northcott':      'characters/nocturne-char-northcott-portrait.png',
  'steward':        'characters/nocturne-char-steward-portrait.png',
  'ashworth':       'characters/nocturne-char-lady-ashworth-normal.png',
  'curator':        'characters/nocturne-char-curator-normal.png',
  'voss':           'characters/nocturne-char-voss-portrait.png',
  'pemberton-hale': 'characters/nocturne-char-ph-portrait.png',
  'greaves':        'characters/nocturne-char-greaves-portrait.png',
  'baron':          'characters/nocturne-char-baron-portrait.png',
  'crane':          'characters/nocturne-char-crane-portrait.png',
  'uninvited':      'characters/nocturne-char-uninvited-portrait.png',
  'sovereign':      'characters/nocturne-char-sovereign-portrait.png',
  'heir':           'characters/nocturne-char-heir-portrait.png',
  'envoy':          'characters/nocturne-char-envoy-portrait.png',
  'archivist':      'characters/nocturne-char-archivist-portrait.png',
  'surgeon':        'characters/nocturne-char-surgeon-portrait.png',
  'vivienne':       'characters/nocturne-char-vivienne-portrait.png',
  'hatch':          'characters/nocturne-char-hatch-portrait.png',
};

const ITEM_ASSET_MAP = {
  'ashworth-seal':              'items/nocturne-item-ashworth-seal.png',
  'estate-flower':              'items/nocturne-item-estate-flower.png',
  'unsigned-letter':            'items/nocturne-item-unsigned-letter.png',
  'operational-brief':          'items/nocturne-item-operational-brief.png',
  'seal-placement-record':      'items/nocturne-item-seal-placement-record.png',
  'weight-discrepancy-record':  'items/nocturne-item-weight-discrepancy-record.png',
  'compact-operative-roles':    'items/nocturne-item-compact-operative-roles.png',
  'register-licensing-extract': 'items/nocturne-item-register-licensing-extract.png',
};

const PUZZLE_ASSET_MAP = {
  'cipher':               'puzzles/nocturne-puzzle-cipher.png',
  'seal-match':           'puzzles/nocturne-puzzle-seal-fragments.png',
  'bond-reconstruction':  'puzzles/nocturne-puzzle-bond-complete.png',
  'chronology':           'puzzles/nocturne-puzzle-chronology.png',
  'bilateral-seal':       'puzzles/nocturne-puzzle-seal-compact.png',
  'ink-comparison':       'puzzles/nocturne-puzzle-ink-comparison.png',
  'correspondence-thread':'puzzles/nocturne-puzzle-correspondence-thread.png',
  'witness-map':          'puzzles/nocturne-puzzle-witness-map.png',
  'estate-handwriting':   'puzzles/nocturne-puzzle-seal-backing.png',
};

// Props: examine-only. Never collectible. Curator insults if placed on pedestal.
const PROP_ASSET_MAP = {
  'painting':              'props/nocturne-prop-foyer-painting.png',
  'card-table':            'props/nocturne-prop-foyer-card-table.png',
  'invitation-stand':      'props/nocturne-prop-foyer-invitation-stand.png',
  'portrait-1':            'props/nocturne-prop-gallery-portrait-row.png',
  'portrait-2':            'props/nocturne-prop-gallery-portrait-row.png',
  'portrait-3':            'props/nocturne-prop-gallery-portrait-row.png',
  'portrait-4':            'props/nocturne-prop-gallery-portrait-row.png',
  'portrait-5':            'props/nocturne-prop-gallery-portrait-row.png',
  'side-table':            'props/nocturne-prop-gallery-side-table.png',
  'wall-sconce':           'props/nocturne-prop-gallery-candelabra.png',
  'writing-desk':          'props/nocturne-prop-study-desk.png',
  'second-chair':          'props/nocturne-prop-study-second-chair.png',
  'study-clock':           'props/nocturne-prop-study-clock.png',
  'decanter':              'props/nocturne-prop-study-decanter.png',
  'register':              'props/nocturne-prop-lectern-pen.png',
  'wheel-marks':           'props/nocturne-prop-lectern-seal-stamp.png',
  'iron-table':            'props/nocturne-prop-terrace-stone-table.png',
  'balustrade':            'props/nocturne-prop-terrace-candle-holder.png',
  'dragged-marks':         'props/nocturne-prop-terrace-garden-map.png',
  'body':                  'props/nocturne-prop-ballroom-gavel.png',
  'gavel':                 'props/nocturne-prop-ballroom-gavel.png',
  'register-position':     'props/nocturne-prop-ballroom-mask-stand.png',
  'antechamber-mirror':    'props/nocturne-prop-antechamber-mirror.png',
  'chess-set':             'props/nocturne-prop-library-book-open.png',
  'library-decanter':      'props/nocturne-prop-library-decanter.png',
  'ashtray':               'props/nocturne-prop-smoking-ashtray.png',
  'correspondence':        'props/nocturne-prop-smoking-correspondence.png',
  'card-table-smoking':    'props/nocturne-prop-smoking-decanter-baron.png',
  'counting-marks':        'props/nocturne-prop-cellar-wine-bottles.png',
  'tunnel-door':           'props/nocturne-prop-cellar-tunnel-door.png',
  'empty-chair':           'props/nocturne-prop-compact-empty-chair.png',
  // Collectible props
  'foyer-flowers-obj':     'props/nocturne-prop-foyer-flowers.png',
  'guest-book-obj':        'props/nocturne-prop-gallery-guest-book.png',
  'ballroom-programme-obj':'props/nocturne-prop-ballroom-programme.png',
  'lectern-pen-obj':       'props/nocturne-prop-lectern-pen.png',
  'terrace-map-obj':       'props/nocturne-prop-terrace-garden-map.png',
  'ashtray-obj':           'props/nocturne-prop-smoking-ashtray.png',
  'smoking-letters-obj':   'props/nocturne-prop-smoking-correspondence.png',
  'study-decanter-obj':    'props/nocturne-prop-study-decanter.png',
  'vault-file-case':       'props/nocturne-prop-vault-token-plate.png',
};

// ── CURATOR INSULTS — word for word from KB Section XXII ──
// null = complete silence (repeat placement)
const CURATOR_INSULTS = {
  'estate-flower':     '"They\'re flowers."',
  'card-table':        '"You\'ve placed a card table on the evidence pedestal. Take a moment."',
  'painting':          '"A faceless painting. Your case rests on a faceless painting."',
  'invitation-stand':  '"An empty stand. You\'ve presented an empty stand."',
  'portrait-1':        '"Portraits. You\'re accusing portraits."',
  'portrait-2':        '"Portraits. You\'re accusing portraits."',
  'portrait-3':        '"Portraits. You\'re accusing portraits."',
  'portrait-4':        '"Portraits. You\'re accusing portraits."',
  'portrait-5':        '"Portraits. You\'re accusing portraits."',
  'wall-sconce':       '"A candelabra. Three arms. Zero culpability."',
  'side-table':        '"It\'s a table. A small one."',
  'writing-desk':      '"An empty desk. You\'ve presented furniture."',
  'fireplace':         '"The fireplace burned things. It did not kill anyone."',
  'bookcase':          '"Books. You\'ve presented books."',
  'second-chair':      '"A chair. Someone sat in it. This is not remarkable."',
  'study-clock':       '"The clock tells time. It has done nothing else tonight."',
  'decanter':          '"You\'ve brought me a drink."',
  'register':          '"The pen wrote the last entry. It did not cause it."',
  'wheel-marks':       '"A stamp. For stamping things. Not for murder."',
  'iron-table':        '"You\'re accusing outdoor furniture."',
  'balustrade':        '"You\'ve presented a glove. One glove. With no hand in it."',
  'dragged-marks':     '"The grounds did not kill Lord Ashworth."',
  'body':              '"The victim is not the perpetrator. Usually."',
  'gavel':             '"The gavel called the Rite to order. That is its only crime."',
  'register-position': '"A table. With glasses on it."',
  'antechamber-mirror':'"It\'s a mirror. It reflects. That\'s all it does."',
  'chess-set':         '"A book about land law. Interesting reading. Not a weapon."',
  'library-decanter':  '"Someone brought Greaves a drink. You\'ve brought me the same one."',
  'medical-bag':       '"A locked case. You don\'t know what\'s in it. Neither does this pedestal."',
  'ashtray':           '"Two cigarettes. Neither of them killed anyone."',
  'correspondence':    '"Three years of correspondence. None of it addressed to the pedestal."',
  'card-table-smoking':'"Untouched brandy. You\'re presenting untouched brandy."',
  'counting-marks':    '"Bottles. The wine has been replaced with documents. The documents are not this."',
  'tunnel-door':       '"You\'ve presented a door. The door leads somewhere. It did not kill anyone."',
  'empty-chair':       '"An empty chair. Kept for eleven years. Still not guilty."',
  // Wrong pedestal (right item, wrong category)
  '_wrong_pedestal':   '"Evidence is not the same as understanding. The Estate judges both."',
};

// Track repeats for silence
const _pedesatalPlacements = {};

// ── PEDESTAL INTERCEPT ─────────────────────────────────────
function placeEvidenceWithCheck(pedestalId, itemId) {
  const item = ITEMS[itemId];

  // Is it a prop (no ITEMS entry or no pedestal_category)?
  const isProp = !item || !item.pedestal_category || item.pedestal_category.length === 0;

  // Is it the right category for this pedestal?
  const categoryMap = { motive:['motive'], means:['means'], moment:['moment'], record:['record'] };
  const validCats = categoryMap[pedestalId] || [];
  const itemCats = item ? (Array.isArray(item.pedestal_category) ? item.pedestal_category : [item.pedestal_category]) : [];
  const isWrongCategory = !isProp && !itemCats.some(c => validCats.includes(c));

  if (isProp || isWrongCategory) {
    // Place on pedestal briefly
    gameState.stage_evidence[pedestalId] = itemId;
    if (typeof updateStagePedestals === 'function') updateStagePedestals();

    // 1.5 second pause then return
    setTimeout(() => {
      gameState.stage_evidence[pedestalId] = null;
      if (typeof updateStagePedestals === 'function') updateStagePedestals();

      const key = `${itemId}:${pedestalId}`;
      const isRepeat = _pedesatalPlacements[key];
      _pedesatalPlacements[key] = true;

      if (isRepeat) return; // Complete silence

      const insult = isProp
        ? (CURATOR_INSULTS[itemId] || CURATOR_INSULTS['_wrong_pedestal'])
        : CURATOR_INSULTS['_wrong_pedestal'];

      if (!insult) return;

      const lineEl = document.getElementById('stage-curator-line');
      if (lineEl) {
        const original = lineEl.textContent;
        lineEl.textContent = insult;
        lineEl.style.color = 'var(--cream)';
        setTimeout(() => {
          lineEl.textContent = original;
          lineEl.style.color = '';
        }, 3000);
      }
    }, 1500);

    return;
  }

  // Correct — place it
  placeEvidenceOnPedestal(pedestalId, itemId);
}

// ── ROOM DESCRIPTIONS — WORD FOR WORD ─────────────────────
const ROOM_DESCRIPTIONS = {
  // ── TRAIN — no description overlay shown during train sequence ──
  // These are here for reference only. Train UI suppresses the room description panel.
  "train-compartment": "",
  "train-dining":      "",
  "train-rear":        "",
  // ── ESTATE ──────────────────────────────────────────────────
  "foyer":         "The gate attendant said nothing when he let you through. That was the first thing.\n\nThe Foyer is larger than it needs to be. The flowers are white. They belong in the study.\n\nThe painting at the top of the stairs has a frame built for a portrait. The subject has been replaced with something that refuses to be looked at directly.\n\nOne of the doors at the end has a handle that has been used recently. You can tell by the light on the metal.\n\nYou have the distinct impression the room was arranged for you specifically. Which either means you are very welcome. Or that someone very much wants you to feel that way. Tonight those two things may not be different.",

  "gallery":       "The Portrait Gallery contains five men who wanted to be remembered and one woman who wasn't asked. The frames are heavy. The light is not quite enough.\n\nBoth sets of candles are fresh. The guest book records every arrival. The Steward's handwriting.",

  "study":         "Lord Ashworth's private study. The desk is bare. The fireplace is warm.\n\nThe second chair faces the door. You notice this before you notice why you notice it.",

  "archive-path":  "The Archive is the only part of the Estate that smells like work. Filing cases. Leather spines. The faint chemical note of old paper.\n\nArchive Case 3 is the third from the left. The seal is broken. These two facts are in the wrong order.\n\nSomeone has been here recently and left in a hurry, or left carefully, which are two very different things that look identical from the outside.",

  "balcony":       "A mezzanine level above the Ballroom. The railing runs the length of the upper floor. The floor below is visible from here.",

  "terrace":       "Iron chairs. Wet stone. The manor behind you, lit from within.\n\nA glass door at the far end with the Staircase beyond it and, if you look carefully, Sir Greaves on the other side of the glass, watching the door from the inside as you watch it from the outside.\n\nNeither of you waves.",

  "ballroom":      "The Rite was supposed to be the most important thing that happened tonight. It has been demoted.\n\nLord Edmund Ashworth is at the Register lectern with the expression of a man who has made his final point. His right hand is pointing at something. Nobody has moved it. Nobody is quite ready to decide what it means.\n\nTen masked figures stand in various arrangements of shock. The shock is real. What varies is what they are shocked about.",

  "antechamber":   "Pemberton-Hale is here because here is where people go when they want to be seen waiting. He has been in this room for twenty minutes. He has a writing case and gloves and the expression of a man who has been patient for eight years and found it was worth it.\n\nThe mirror is positioned to show the corridor. He positioned it. He has been watching the corridor, through the mirror, for twenty minutes, with the patience of someone who knew what was coming and wanted to see it arrive.",

  "stage":         "The Stage is the only room in the Estate with nothing in it. One chair. Three evidence pedestals. A ceiling that is slightly too high.\n\nIn a society built on performance, the room for judgment contains only what you brought into it.",

  "library":       "Sir Greaves has been in this room since seven o'clock. He would like you to know this. He mentioned it before you asked.\n\nThe chess set is mid-game. White to move. Greaves plays white. He has not moved.\n\nThe Library is the kind of room that belongs to a man who reads not for pleasure but for advantage. Everything on the shelves is useful. The chair faces the door.",

  "physicians":    "A physician's room. Small. The kind of room that makes two people aware of each other.",

  "smoking":       "The Baron is here because there is nowhere else to go when you know who did it and cannot say so without explaining how you know.\n\nA card table set for two. One hand dealt. The second player's chair has not moved. The Baron's has.\n\nHis drink is untouched. He has picked it up four times and put it back down. He is deciding something. He has been deciding it since 8:01.",

  "vault":         "The Vault is the room that everyone in this Estate has been managing their relationship with for eleven years. Some of them put things in it. Some of them would like things taken out.\n\nThe wine rack is against the far wall. The floor beside it — the strip that would be exposed if it moved — has a different quality of dust. Older. Undisturbed. The floor around it is clean.\n\nOne of them killed a man to stop it being opened. It is open now.",

  "wine-cellar":   "The Wine Cellar is below the Vault, which is below the truth, which is below everything Ashworth built in forty years and two of his associates spent six of those years protecting.\n\nThe Uninvited is already here. He turns when he hears you on the stairs. He doesn't look surprised. He doesn't look like a man who gets surprised.",
  "maids-quarters": "A room at the back of the Estate that the Estate does not think about. Stone walls. An iron bed. A single candle. The uniform is pressed and hanging on the hook by the door.\n\nVivienne Leclair has been in this house for four years. She has been watching it for longer than that.\n\nShe is smoothing her apron when you enter. She does not stop.",

  "groundskeeper-cottage": "Thomas Hatch has been here thirty years. The cottage shows it — not in damage but in the particular order of a man who knows exactly where everything is and has never needed to think about it.\n\nTools on the wall. A table. A lantern. The window faces the garden and the terrace beyond it and the balcony above that.\n\nHe is at the door when you arrive. He was expecting someone eventually.",

  "map-room":      "A cartography study. Wall maps of territories Ashworth did business in and several he did not. A globe older than the country it was made in.\n\nOne map is pinned open.",

  "dining-room":   "The long table is set for forty. Nobody sat here tonight. The candles are lit anyway — tall tapers, fresh, burning down with the measured patience of a room that was never intended to be used.\n\nTwo places at the head have napkins folded differently from the rest. The Steward's hand, or someone imitating it.\n\nThe food was prepared. The food was never served. Someone decided, late in the afternoon, that dinner would not happen tonight. That decision was not announced.",

  "trophy-room":   "The Estate's private museum. Glass cases. Antlered heads. A mounted bird on the mantle with a yellowed label in Ashworth's handwriting. A leather armchair positioned to face the fire and nothing else.\n\nMost of these specimens were acquired legally. Most.",

  "billiard-room": "The table is set mid-game. Colored balls clustered at one end. Two cues laid across the felt — one chalked, one not.\n\nThe bar cabinet at the back is locked. The key is not on its hook. The decanters behind the glass are half-full in a pattern that suggests regular use by the same two hands.\n\nThe portraits watch the table. None of them watch the door.",

  "weapons-room":  "An armory kept as decoration. Flintlocks mounted in pairs along the panelling. Two cavalry sabres crossed above the fireplace. Candelabras burning on both cabinets — fresh tapers, recently lit, too many for the room's actual use.\n\nThe muskets are decorative. The swords are not.",

  "conservatory":  "Glass roof. Iron frame. The candles in the wall sconces are lit but the room is cold — the glass leaks heat the way the Estate leaks information.\n\nA small iron table with two chairs, pulled close. The seat of one is still warm. The seat of the other is not, and was not.\n\nBeyond the glass, the garden is dark. You can see your own reflection in the panels above, and behind it, faintly, the silhouette of someone who is not in the room with you. Then the candle gutters and the silhouette is yours after all. Probably.",

  "tunnel-passage":"Old stone. A single lantern on a hook, warm and recently used. The passage connects two houses built around something older than either.",
  "c1-arrival":    "A list of names. Ashworth's is at the bottom. Tonight's date is written at the top in a hand that knew the date before it was known by the Estate. A grand piano in the centre of the room. The Archivist is playing. They play when they are nervous. They will not say they are nervous.",
  "c2-portraits":  "Hooks on the walls. Nothing hung. The Compact does not keep portraits. Every hook is the same size. Every hook is empty. The uniformity is not accident — it is argument.",
  "c3-original":   "He has been in this room every day. Not out of habit. Out of something that stopped having a name after the first decade.",
  "c4-register":   "Forty years of records the Estate did not know were being kept. The Archivist opens the relevant volume without looking up the page number. They have been waiting for someone to ask for this page for twelve years. Their hands are very steady.",
  "c5-correspondence": "Forty years of letters. Ashworth's stop after year five. The gap where they should be is filled with copies of his Estate correspondence — the Compact's version of the same period, showing what the official record omitted. Someone spent years making the absence visible.",
  "c6-tunnel":     "Old stone. A lantern on a hook. The passage opens here into something that was built to be a room and never named as one.",
  "c7-study":      "The Surgeon's desk. Documents laid out in order. He has gone to visit his colleague again.",
  "c8-gallery":    "Thirty-one testimonies framed like portraits. No names on any of them. Sources redacted. The Heir knows every account by its date. She can recite the fourth testimony from memory. She has not decided whether that makes what happened necessary or whether it makes her complicit in deciding it was necessary.",
  "c9-agreement":  "Two chairs. The marks where two people have sat many times, in the same positions, across a table. One set of marks is older. The other is recent — the Heir has been sitting in this room every evening for eight months, reading the original agreement, making sure she still believed in it. She stopped coming three weeks ago.",
  "c10-reckoning": "Ten chairs in a circle. The full Compact has never assembled. Every sovereign in forty years has convened nine or fewer. There is always one chair that belongs to someone who declined, or died, or was not invited. Tonight that chair belongs to Ashworth. His name is not on it. It doesn't need to be.",

};

// ── CHARACTER DATA ─────────────────────────────────────────
const CHARACTER_AVAILABILITY = {
  "rowe":           ["early_morning","day","golden_hour","evening","late","deep_night"],
  "northcott":      ["early_morning","day","golden_hour","evening","late","deep_night"],
  "steward":        ["early_morning","day","golden_hour","evening","late","deep_night"],
  "ashworth":       ["early_morning","day","golden_hour","evening","late","deep_night"],
  "curator":        ["early_morning","day","golden_hour","evening","late","deep_night"],
  "voss":           ["early_morning","day","golden_hour","evening","late","deep_night"],
  "pemberton-hale": ["early_morning","day","golden_hour","evening","late","deep_night"],
  "greaves":        ["early_morning","day","golden_hour","evening","late","deep_night"],
  "baron":          ["early_morning","day","golden_hour","evening","late","deep_night"],
  "crane":          ["early_morning","day","golden_hour","evening","late","deep_night"],
  "uninvited":      ["early_morning","day","golden_hour","evening","late","deep_night"],
  "sovereign":      ["early_morning","day","golden_hour","evening","late","deep_night"],
  "heir":           ["early_morning","day","golden_hour","evening","late","deep_night"],
  "envoy":          ["early_morning","day","golden_hour","evening","late","deep_night"],
  "archivist":      ["early_morning","day","golden_hour","evening","late","deep_night"],
  "surgeon":        ["early_morning","day","golden_hour","evening","late","deep_night"],
  "vivienne":       ["early_morning","day","golden_hour","evening","late","deep_night"],
  "hatch":          ["early_morning","day","golden_hour","evening","late","deep_night"],
};

const CHARACTER_POSITIONS = {
  // ── TRAIN ──────────────────────────────────────────────────
  "train-compartment": ["elliot"],
  "train-dining":      ["marcus", "todd"],
  // ── ESTATE ─────────────────────────────────────────────────
  "foyer":        ["northcott", "rowe"],
  "gallery":      ["steward"],
  "study":        ["ashworth"],
  "archive-path": ["curator","voss"],
  "terrace":      ["ashworth"],
  "ballroom":     ["curator"],
  "antechamber":  ["pemberton-hale"],
  "library":      ["greaves"],
  "smoking":      ["baron"],
  "physicians":   ["crane","surgeon","uninvited"],
  "vault":        [],
  "wine-cellar":  [],
  "maids-quarters":    ["vivienne"],
  "groundskeeper-cottage": ["hatch"],
  // ── EAST WING (past study, no NPCs) ────────────────────────
  "map-room":          [],
  "dining-room":       [],
  "trophy-room":       [],
  "billiard-room":     [],
  "weapons-room":      [],
  "conservatory":      [],
  // ── COMPACT ────────────────────────────────────────────────
  "c1-arrival":        ["archivist"],
  "c3-original":       ["sovereign"],
  "c4-register":       ["archivist"],
  "c5-correspondence": ["envoy"],
  "c6-tunnel":         ["envoy"],
  "c7-study":          [],
  "c8-gallery":        ["heir"],
  "c9-agreement":      ["heir"],
  "c10-reckoning":     ["sovereign"],
};

// ── ASSET HELPERS ──────────────────────────────────────────
function getRoomBg(roomId)      { const f = ROOM_ASSET_MAP[roomId];  return f ? `${ASSET_BASE}${f}` : ''; }
function getCharPortrait(charId){ const f = CHAR_ASSET_MAP[charId];  return f ? `${ASSET_BASE}${f}` : ''; }
function getItemThumb(itemId)   { const f = ITEM_ASSET_MAP[itemId];  return f ? `${ASSET_BASE}${f}` : `${ASSET_BASE}items/nocturne-item-${itemId}.png`; }
function getPropThumb(objectId) { const f = PROP_ASSET_MAP[objectId];return f ? `${ASSET_BASE}${f}` : ''; }
function getPuzzleImg(type)     { const f = PUZZLE_ASSET_MAP[type];  return f ? `${ASSET_BASE}${f}` : ''; }

// ── INIT ───────────────────────────────────────────────────
function initRooms() {
  const container = document.getElementById('rooms-container');
  if (!container) return;

  const allRooms = [
    // Train
    'train-compartment','train-dining','train-rear',
    // Estate
    'foyer','gallery','study','archive-path','terrace',
    'maids-quarters','groundskeeper-cottage',
    // East wing (past study)
    'map-room','dining-room','trophy-room','billiard-room','weapons-room','conservatory',
    'ballroom','balcony','antechamber','stage','library','physicians','smoking','vault',
    'wine-cellar','tunnel-passage',
    'c1-arrival','c2-portraits','c3-original','c4-register','c5-correspondence',
    'c6-tunnel','c7-study','c8-gallery','c9-agreement','c10-reckoning'
  ];

  allRooms.forEach(roomId => {
    const room = document.createElement('div');
    room.className = 'room' + (roomId === 'foyer' ? ' active' : '');
    room.id = `room-${roomId}`;
    if (roomId.startsWith('c')) room.classList.add('compact-room');

    const bg = document.createElement('div');
    bg.className = 'room-bg';
    const bgUrl = getRoomBg(roomId);
    if (bgUrl) bg.style.backgroundImage = `url(${bgUrl})`;
    room.appendChild(bg);

    const vignette = document.createElement('div');
    vignette.className = 'room-vignette';
    room.appendChild(vignette);

    const dust = document.createElement('div');
    dust.className = 'room-dust';
    room.appendChild(dust);

    const hl = document.createElement('div');
    hl.className = 'hotspot-layer';
    hl.id = `hotspots-${roomId}`;
    room.appendChild(hl);

    const cl = document.createElement('div');
    cl.className = 'char-layer';
    cl.id = `chars-${roomId}`;
    room.appendChild(cl);

    container.appendChild(room);
  });

  _buildHotspots();
  _buildCharDots();

  // Override pedestal placement with prop-aware version
  window.placeEvidenceOnPedestal = placeEvidenceWithCheck;

  // Wire ROOM_DESCRIPTIONS for ui.js
  window.ROOM_DESCRIPTIONS = ROOM_DESCRIPTIONS;

  NocturneEngine.on('roomEntered', ({ roomId }) => {
    renderCurrentRoom();
    updateCharacterDots(roomId);

    // Entering any Compact room — kill any Estate conversation panel state
    if (roomId.startsWith('c')) {
      const panel = document.getElementById('conversation-panel');
      if (panel) panel.classList.remove('open');
      const zone = document.getElementById('conv-portrait-zone');
      if (zone) zone.innerHTML = '';
      document.querySelectorAll('.estate-portrait-zone').forEach(z => {
        z.style.visibility = '';
        z.style.pointerEvents = '';
      });
    }

    // Dismiss any lingering room description from previous room
    const prevPanel = document.getElementById('room-description');
    if (prevPanel) prevPanel.classList.remove('visible');

    // Staggered entry pulse — each hotspot pulses once, offset by index
    // The room acknowledges you arrived. Then silence.
    setTimeout(() => {
      const layer = document.getElementById(`hotspots-${roomId}`);
      if (!layer) return;
      const hotspots = layer.querySelectorAll('.hotspot');
      hotspots.forEach((hs, i) => {
        setTimeout(() => {
          hs.classList.add('entry-pulse');
          setTimeout(() => hs.classList.remove('entry-pulse'), 450);
        }, i * 120); // 120ms between each — they cascade across the room
      });
    }, 600); // wait for room bg fade

    // Show room description — first visit only
    const desc = ROOM_DESCRIPTIONS[roomId];
    if (desc && !_shownRoomDescriptions.has(roomId)) {
      _shownRoomDescriptions.add(roomId);
      const el = document.getElementById('room-description-text');
      const panel = document.getElementById('room-description');
      if (el) el.textContent = desc;
      if (panel) {
        // Always strip any leftover hints and clone panel to kill stale listeners
        panel.querySelectorAll('.narrator-hint').forEach(h => h.remove());
        const freshPanel = panel.cloneNode(true);
        panel.parentNode.replaceChild(freshPanel, panel);
        const activePanel = document.getElementById('room-description');

        activePanel.classList.remove('visible');
        setTimeout(() => activePanel.classList.add('visible'), 400);

        // All rooms: tap-to-dismiss, no auto-dismiss
        const hint = document.createElement('div');
        hint.className = 'narrator-hint';
        hint.style.cssText = 'text-align:center;font-size:9px;letter-spacing:0.25em;color:var(--gold-dim);opacity:0.6;margin-top:12px;text-transform:uppercase;';
        hint.textContent = 'TAP TO CONTINUE';
        activePanel.appendChild(hint);
        const dismissPanel = () => {
          activePanel.classList.remove('visible');
          hint.remove();
        };
        activePanel.addEventListener('click', dismissPanel, { once: true });
        activePanel.addEventListener('touchstart', dismissPanel, { once: true });
      }
    }
  });

  renderCurrentRoom();
}

function _buildHotspots() {
  const THUMB_ROOMS = new Set(['study']);

  Object.entries(ROOM_OBJECTS).forEach(([objectId, obj]) => {
    const layer = document.getElementById(`hotspots-${obj.room}`);
    if (!layer) return;
    const hs = document.createElement('div');
    hs.className = 'hotspot';
    hs.id = `hs-${objectId}`;
    hs.style.cssText = `left:${obj.hotspot.left}%;top:${obj.hotspot.top}%;width:${obj.hotspot.width}%;height:${obj.hotspot.height}%;`;

    if (THUMB_ROOMS.has(obj.room) && obj.item_id) {
      hs.classList.add('no-star', 'item-thumb-hotspot');
      const img = document.createElement('img');
      img.src = getItemThumb(obj.item_id);
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));';
      img.onerror = () => { img.style.display = 'none'; };
      hs.appendChild(img);
    }

    if (gameState.essential_left[objectId]) hs.classList.add('essential-left');
    hs.addEventListener('click', e => {
      e.stopPropagation();
      const r = hs.getBoundingClientRect();
      _onHotspotTap(objectId, r.left + r.width / 2, r.top);
    });
    layer.appendChild(hs);
  });
}

function _onHotspotTap(objectId, tapX, tapY) {
  // tunnel-door: bypass tapObject entirely — launch tunnel directly
  if (objectId === 'tunnel-door') {
    NocturneEngine.emit('tunnelDoorOpens', {});
    NocturneEngine.emit('tunnelEntered', {});
    return;
  }
  tapObject(objectId, tapX, tapY);
}

function _buildCharDots() {
  // Build per-room character zones — one zone per room, inside the room div
  // Mirrors train portrait zone: centred, full-width, portrait cards with active state
  // PROLOGUE: while gameState.prologueActive, use PROLOGUE_NPC_POSITIONS instead.
  const POSITIONS_SOURCE = (gameState.prologueActive && window.PROLOGUE_NPC_POSITIONS)
    ? window.PROLOGUE_NPC_POSITIONS
    : CHARACTER_POSITIONS;
  Object.entries(POSITIONS_SOURCE).forEach(([roomId, chars]) => {
    if (roomId.startsWith('train-')) return; // train handles its own
    const roomEl = document.getElementById(`room-${roomId}`);
    if (!roomEl) return;

    // One portrait zone per room
    let zone = document.getElementById(`char-zone-${roomId}`);
    if (!zone) {
      zone = document.createElement('div');
      zone.id = `char-zone-${roomId}`;
      zone.className = 'estate-portrait-zone';
      // PROLOGUE — z-index lift so card sits above hotspot layer (clicks register).
      // Do NOT touch position — stylesheet anchors zone bottom-center via absolute positioning.
      zone.style.zIndex = '50';
      roomEl.appendChild(zone);
    }

    chars.forEach((charId, idx) => {
      if (document.getElementById(`char-${charId}`)) return;

      const portraitUrl = getCharPortrait(charId);
      const charData    = window.CHARACTERS && window.CHARACTERS[charId];
      const displayName = (charData?.display_name || charId).toUpperCase();

      const card = document.createElement('div');
      card.className = 'train-npc-card' + (chars.length === 1 ? ' active' : (idx === 0 ? ' active' : ' inactive'));
      card.id = `char-${charId}`;
      card.dataset.room = roomId;

      const portrait = document.createElement('div');
      portrait.className = 'train-npc-portrait';
      if (portraitUrl) portrait.style.backgroundImage = `url(${portraitUrl})`;
      card.appendChild(portrait);

      const blend = document.createElement('div');
      blend.className = 'train-npc-blend';
      card.appendChild(blend);

      const textArea = document.createElement('div');
      textArea.className = 'train-npc-text';

      const nameEl = document.createElement('div');
      nameEl.className = 'train-npc-name';
      nameEl.textContent = displayName;
      textArea.appendChild(nameEl);
      card.appendChild(textArea);

      if (chars.length > 1) {
        const hint = document.createElement('div');
        hint.className = 'train-npc-tap-hint';
        hint.textContent = 'Tap';
        card.appendChild(hint);
      }

      card.addEventListener('click', e => {
        e.stopPropagation();
        // Multi-char room: set active/inactive
        if (chars.length > 1) {
          chars.forEach(cId => {
            const c = document.getElementById(`char-${cId}`);
            if (!c) return;
            c.className = 'train-npc-card ' + (cId === charId ? 'active' : 'inactive');
          });
        }
        _onCharTap(charId, roomId);
      });

      zone.appendChild(card);
    });
  });

  NocturneEngine.on('roomEntered', ({ roomId }) => _syncCharZones(roomId));
  _syncCharZones(gameState.currentRoom);

  // Uninvited appears on first click/tap in his rooms
  // Player takes in the room first — body, hand, chandelier — then he fades in
  let _uninvitedClickListener = null;

  // Expose listener clear so ui.js can kill it on early dismiss
  window._uninvitedClearListener = function() {
    if (_uninvitedClickListener) {
      document.removeEventListener('click', _uninvitedClickListener, true);
      _uninvitedClickListener = null;
    }
  };

  const ALL_UNINVITED_ROOMS = ['physicians', 'library', 'vault', 'wine-cellar'];

  function _isUninvitedGateOpen(roomId) {
    if (roomId === 'vault')       return !!gameState.vaultOpen;
    if (roomId === 'wine-cellar') return !!gameState.tunnelFound;
    if (roomId === 'physicians')  return !!gameState._curatorBallroomDone;
    return true;
  }

  function _uninvitedHasUndelivered(roomId) {
    const answered = (gameState.char_dialogue_complete || {})['uninvited'] || {};
    const appearanceKey = roomId === 'wine-cellar' ? 'wine_cellar' : roomId;
    const data = window.INTERROGATION_DATA && window.INTERROGATION_DATA['uninvited'];
    if (!data) return false;
    const block = data.composure_variants?._appearances?.[appearanceKey];
    if (!block) return false;
    const qKeys = Object.keys(block).filter(k => k.startsWith('Q'));
    if (answered[roomId + '_dismissed']) return false;
    return qKeys.some(k => !answered[roomId + '_' + k]);
  }

  let _uninvitedPendingTimer = null;

  function _armUninvitedClickListener(roomId) {
    // Clear any existing listener first
    if (_uninvitedClickListener) {
      document.removeEventListener('click', _uninvitedClickListener, true);
      _uninvitedClickListener = null;
    }
    _uninvitedClickListener = function(e) {
      // Ignore taps on the conversation panel itself — don't self-trigger
      const panel = document.getElementById('conversation-panel');
      if (panel && panel.contains(e.target)) return;
      // Confirm still in same room and gate still open
      if (gameState.currentRoom !== roomId) return;
      if (!_isUninvitedGateOpen(roomId)) return;
      if (!_uninvitedHasUndelivered(roomId)) return;
      if (panel && panel.classList.contains('open')) return;
      // Fire — remove listener first so it only fires once
      document.removeEventListener('click', _uninvitedClickListener, true);
      _uninvitedClickListener = null;
      _uninvitedEncounter(roomId);
    };
    document.addEventListener('click', _uninvitedClickListener, true);
  }

  // When vault opens or tunnel found — re-check if Uninvited should appear
  function _tryUninvitedForCurrentRoom() {
    const roomId = gameState.currentRoom;
    if (!ALL_UNINVITED_ROOMS.includes(roomId)) return;
    if (!_isUninvitedGateOpen(roomId)) return;
    if (!_uninvitedHasUndelivered(roomId)) return;
    const panel = document.getElementById('conversation-panel');
    if (panel && panel.classList.contains('open')) return;
    if (_uninvitedClickListener) return; // already armed
    _armUninvitedClickListener(roomId);
  }

  NocturneEngine.on('vaultOpened', () => {
    _tryUninvitedForCurrentRoom();
  });
  NocturneEngine.on('tunnelDoorOpens', () => {
    setTimeout(() => {
        _tryUninvitedForCurrentRoom();
    }, 200);
  });

  NocturneEngine.on('roomEntered', ({ roomId }) => {
    // Cancel any pending timer from previous room
    if (_uninvitedPendingTimer) { clearTimeout(_uninvitedPendingTimer); _uninvitedPendingTimer = null; }
    // Clear any stale click listener from previous room
    if (_uninvitedClickListener) {
      document.removeEventListener('click', _uninvitedClickListener, true);
      _uninvitedClickListener = null;
    }

    // PROLOGUE — Uninvited never arms during prologue. He arrives with the body post-cinematic,
    // and only after Hale + paywall when his ballroom rooms become reachable.
    if (gameState.prologueActive) return;

    if (!ALL_UNINVITED_ROOMS.includes(roomId)) return;
    if (!_isUninvitedGateOpen(roomId)) return;
    if (!_uninvitedHasUndelivered(roomId)) return;

    // Library: Uninvited appears immediately — he's already there when you arrive
    // All other rooms: wait for first tap
    if (roomId === 'library') {
      _uninvitedPendingTimer = setTimeout(() => {
        _uninvitedPendingTimer = null;
        if (gameState.currentRoom !== 'library') return;
        if (!_uninvitedHasUndelivered('library')) return;
        const panel = document.getElementById('conversation-panel');
        if (panel && panel.classList.contains('open')) return;
        _uninvitedEncounter('library');
      }, 1200);
    } else {
      _armUninvitedClickListener(roomId);
    }
  });
}

// Rebuild character placements without re-registering event listeners.
// Called when prologue ends (post-cinematic / paywall success) so NPCs
// reposition from PROLOGUE_NPC_POSITIONS to CHARACTER_POSITIONS.
function _rebuildCharCards() {
  // Wipe existing NPC cards (built by us — identified by class + data-room).
  // CRITICAL: do NOT use a loose [id^="char-"] selector — that matches #char-response
  // (the conversation panel's response div) and breaks the panel.
  document.querySelectorAll('.estate-portrait-zone .train-npc-card[data-room]').forEach(el => {
    el.remove();
  });
  // Empty all zones (keep the zone divs themselves so any CSS keyed off them still applies)
  document.querySelectorAll('.estate-portrait-zone').forEach(zone => {
    zone.innerHTML = '';
  });

  // Re-place from current source
  const POSITIONS_SOURCE = (gameState.prologueActive && window.PROLOGUE_NPC_POSITIONS)
    ? window.PROLOGUE_NPC_POSITIONS
    : CHARACTER_POSITIONS;

  Object.entries(POSITIONS_SOURCE).forEach(([roomId, chars]) => {
    if (roomId.startsWith('train-')) return;
    const roomEl = document.getElementById(`room-${roomId}`);
    if (!roomEl) return;

    let zone = document.getElementById(`char-zone-${roomId}`);
    if (!zone) {
      zone = document.createElement('div');
      zone.id = `char-zone-${roomId}`;
      zone.className = 'estate-portrait-zone';
      zone.style.zIndex = '50';
      roomEl.appendChild(zone);
    }

    chars.forEach((charId, idx) => {
      if (document.getElementById(`char-${charId}`)) return;

      const portraitUrl = getCharPortrait(charId);
      const charData    = window.CHARACTERS && window.CHARACTERS[charId];
      const displayName = (charData?.display_name || charId).toUpperCase();

      const card = document.createElement('div');
      card.className = 'train-npc-card' + (chars.length === 1 ? ' active' : (idx === 0 ? ' active' : ' inactive'));
      card.id = `char-${charId}`;
      card.dataset.room = roomId;

      const portrait = document.createElement('div');
      portrait.className = 'train-npc-portrait';
      if (portraitUrl) portrait.style.backgroundImage = `url(${portraitUrl})`;
      card.appendChild(portrait);

      const blend = document.createElement('div');
      blend.className = 'train-npc-blend';
      card.appendChild(blend);

      const textArea = document.createElement('div');
      textArea.className = 'train-npc-text';
      const nameEl = document.createElement('div');
      nameEl.className = 'train-npc-name';
      nameEl.textContent = displayName;
      textArea.appendChild(nameEl);
      card.appendChild(textArea);

      if (chars.length > 1) {
        const hint = document.createElement('div');
        hint.className = 'train-npc-tap-hint';
        hint.textContent = 'Tap';
        card.appendChild(hint);
      }

      card.addEventListener('click', e => {
        e.stopPropagation();
        if (chars.length > 1) {
          chars.forEach(cId => {
            const c = document.getElementById(`char-${cId}`);
            if (!c) return;
            c.className = 'train-npc-card ' + (cId === charId ? 'active' : 'inactive');
          });
        }
        _onCharTap(charId, roomId);
      });

      zone.appendChild(card);
    });
  });

  // Re-show only current room's zone
  if (typeof _syncCharZones === 'function') {
    _syncCharZones(gameState.currentRoom);
  }
}
window.rebuildCharCards = _rebuildCharCards;

function _syncCharZones(roomId) {
  // Hide all estate portrait zones
  document.querySelectorAll('.estate-portrait-zone').forEach(z => {
    z.style.display = 'none';
  });
  // Uninvited rooms: zone is shown only when encounter opens (_uninvitedEncounter sets conv-portrait-zone).
  // Don't show passively — the card blocks hotspots behind it.
  // vault/wine-cellar have NO regular chars — Uninvited only, don't show zone
  // ballroom now has Curator — show zone normally
  // library has Greaves — show zone normally (Uninvited handles himself separately)
  const UNINVITED_ONLY_ROOMS = ['vault', 'wine-cellar'];
  if (UNINVITED_ONLY_ROOMS.includes(roomId)) return;
  // Show only the current room's zone
  const zone = document.getElementById(`char-zone-${roomId}`);
  if (zone) zone.style.display = 'flex';
}


function _onCharTap(charId, roomId) {
  // PROLOGUE — Uninvited cannot fire pre-murder. He arrives with the body.
  if (gameState.prologueActive && charId === 'uninvited') {
    showToast('No one else is here right now.');
    return;
  }

  if (charId === 'curator' && roomId === 'ballroom') {
    _curatorBallroomEncounter();
    return;
  }

  if (charId === 'uninvited') {
    if (roomId === 'physicians') { _uninvitedEncounter(roomId); return; }
    if (roomId === 'library')  { _uninvitedEncounter(roomId); return; }
    if (roomId === 'vault') {
      if (!gameState.vaultOpen) { showToast('No one else is here right now.'); return; }
      _uninvitedEncounter(roomId); return;
    }
    if (roomId === 'wine-cellar') {
      if (!gameState.tunnelFound) { showToast('No one else is here right now.'); return; }
      _uninvitedEncounter(roomId); return;
    }
    showToast('No one else is here right now.');
    return;
  }
  const avail = CHARACTER_AVAILABILITY[charId] || [];
  if (typeof openConversation === 'function') openConversation(charId);
}

function _getUninvitedComposureVariant() {
  const tech = gameState._uninvitedTechnique || 'composed';
  const map = { account: 'composed', pressure: 'strained', approach: 'controlled', record: 'controlled', wait: 'fractured' };
  return map[tech] || 'composed';
}

function _curatorBallroomEncounter() {
  // Only fires once — if already dismissed, dot is gone
  if (gameState._curatorBallroomDone) return;

  const LINES = [
    { label: 'Mr. Grey.', text: '"Mr. Grey." He says it without turning from the room. "Lord Ashworth arranged for someone from outside. Someone who would follow the evidence without asking to be managed away from it." A pause. "That arrangement is now active. The investigation is yours."' },
    { label: 'The Register.', text: '"The Register is where it has always been. The body has not been moved. Nobody has moved anything." A pause. "That is either professional discipline or collective shock. Possibly both." He looks at the room. "You will find that the evidence has been arranged to suggest something specific. I would encourage you to consider whether it was arranged by the crime or by the criminal."' },
    { label: '—', text: 'He looks at you for the first time. "I will be in the Archive." A pause — the specific pause of a man who has said what he came to say and has no interest in adding to it. "That is where I will be when you need me." He steps back. The portrait fades.' },
  ];

  let _lineIndex = 0;
  const _dismissKey = '_curatorBallroomDone';

  const panel = document.getElementById('conversation-panel');
  const respEl = document.getElementById('char-response');
  const listEl = document.getElementById('questions-list');
  if (!panel || !respEl || !listEl) return;

  panel.style.display = '';
  panel.classList.add('open');

  // Portrait — same pattern as Uninvited
  const portraitUrl = (typeof getCharAsset === 'function') ? getCharAsset('curator') : '';
  const zone = document.getElementById('conv-portrait-zone');
  if (zone) {
    zone.innerHTML = '';
    zone.style.display = '';
    if (portraitUrl) {
      const card = document.createElement('div');
      card.className = 'train-npc-card active';
      const portrait = document.createElement('div');
      portrait.className = 'train-npc-portrait';
      portrait.style.backgroundImage = 'url(' + portraitUrl + ')';
      card.appendChild(portrait);
      const blend = document.createElement('div');
      blend.className = 'train-npc-blend';
      card.appendChild(blend);
      const textArea = document.createElement('div');
      textArea.className = 'train-npc-text';
      const nameEl = document.createElement('div');
      nameEl.className = 'train-npc-name';
      nameEl.textContent = 'THE CURATOR';
      textArea.appendChild(nameEl);
      card.appendChild(textArea);
      zone.appendChild(card);
    }
    // Fade in
    zone.style.opacity = '0';
    zone.style.transition = 'opacity 800ms ease';
    setTimeout(() => { zone.style.opacity = '1'; }, 50);
  }

  document.querySelectorAll('.estate-portrait-zone').forEach(z => {
    z.style.visibility = 'hidden';
    z.style.pointerEvents = 'none';
  });

  function _renderLine() {
    const line = LINES[_lineIndex];
    if (!line) return;

    if (typeof renderWordByWord === 'function') {
      renderWordByWord(respEl, line.text, 50);
    } else {
      respEl.textContent = line.text;
    }

    listEl.innerHTML = '';

    const isLast = _lineIndex === LINES.length - 1;
    const btn = document.createElement('div');
    btn.className = 'question-item';
    btn.style.cssText = isLast ? 'color:var(--gold-dim);font-style:italic;' : '';
    btn.textContent = isLast ? '—' : LINES[_lineIndex + 1] ? LINES[_lineIndex].label : '—';

    btn.onclick = () => {
      _lineIndex++;
      if (_lineIndex >= LINES.length) {
        // Last line done — fade out portrait, close panel, remove dot
        if (zone) {
          zone.style.transition = 'opacity 600ms ease';
          zone.style.opacity = '0';
        }
        setTimeout(() => {
          panel.classList.remove('open');
          document.querySelectorAll('.estate-portrait-zone').forEach(z => {
            z.style.visibility = '';
            z.style.pointerEvents = '';
          });
          // Remove curator dot from ballroom
          const dot = document.getElementById('char-curator');
          if (dot) dot.style.display = 'none';
          gameState._curatorBallroomDone = true;
          if (typeof saveGame === 'function') saveGame();
        }, 650);
        return;
      }
      setTimeout(_renderLine, 150);
    };

    setTimeout(() => {
      listEl.innerHTML = '';
      listEl.appendChild(btn);
    }, 600);
  }

  respEl.textContent = '';
  setTimeout(_renderLine, 200);
}

function _closeUninvitedEncounter(roomId) {
  const panel = document.getElementById("conversation-panel");
  if (panel) panel.classList.remove("open");
  document.querySelectorAll(".estate-portrait-zone").forEach(z => { z.style.visibility = ""; z.style.pointerEvents = ""; });
  // Kill click listener — dismissed encounter must never re-arm
  if (typeof window._uninvitedClearListener === 'function') window._uninvitedClearListener();
  if (roomId) {
    if (!gameState.char_dialogue_complete["uninvited"]) gameState.char_dialogue_complete["uninvited"] = {};
    gameState.char_dialogue_complete["uninvited"][roomId + "_dismissed"] = true;
  }
  saveGame();
}

function _uninvitedEncounter(roomId) {
  // PROLOGUE — Uninvited does not appear pre-murder. He arrives with the body.
  if (gameState.prologueActive) return;
  const data = window.INTERROGATION_DATA && window.INTERROGATION_DATA['uninvited'];
  if (!data) return;
  const appearances = data.composure_variants && data.composure_variants._appearances;
  if (!appearances) return;

  const appearanceKey = roomId === 'wine-cellar' ? 'wine_cellar' : roomId;
  const block = appearances[appearanceKey];
  if (!block) return;

  if (!gameState.char_dialogue_complete['uninvited']) gameState.char_dialogue_complete['uninvited'] = {};
  const answered = gameState.char_dialogue_complete['uninvited'];

  const qKeys = Object.keys(block).filter(k => k.startsWith('Q'));
  const nextQ  = qKeys.find(k => !answered[roomId + '_' + k]);

  const panel = document.getElementById('conversation-panel');
  const respEl = document.getElementById('char-response');
  const listEl = document.getElementById('questions-list');
  if (!panel || !respEl || !listEl) return;

  panel.style.display = '';
  panel.classList.add('open');

  // Portrait
  const portraitUrl = (typeof getCharPortrait === 'function') ? getCharPortrait('uninvited') : '';
  const zone = document.getElementById('conv-portrait-zone');
  if (zone) {
    zone.innerHTML = '';
    zone.style.display = '';
    if (portraitUrl) {
      const card = document.createElement('div');
      card.className = 'train-npc-card active';
      const portrait = document.createElement('div');
      portrait.className = 'train-npc-portrait';
      portrait.style.backgroundImage = 'url(' + portraitUrl + ')';
      card.appendChild(portrait);
      const blend = document.createElement('div');
      blend.className = 'train-npc-blend';
      card.appendChild(blend);
      const textArea = document.createElement('div');
      textArea.className = 'train-npc-text';
      const nameEl = document.createElement('div');
      nameEl.className = 'train-npc-name';
      nameEl.textContent = 'THE UNINVITED';
      textArea.appendChild(nameEl);
      card.appendChild(textArea);
      zone.appendChild(card);
    }
  }

  document.querySelectorAll('.estate-portrait-zone').forEach(z => {
    z.style.visibility = 'hidden';
    z.style.pointerEvents = 'none';
  });

  // Fade in conv-portrait-zone on first appearance in this room
  const anyAnsweredAlready = Object.keys(gameState.char_dialogue_complete['uninvited'] || {}).some(k => k.startsWith(roomId));
  if (!anyAnsweredAlready && zone) {
    zone.style.opacity = '0';
    zone.style.transition = 'opacity 800ms ease';
    setTimeout(() => { zone.style.opacity = '1'; }, 50);
  }

  if (!nextQ) {
    // All observations delivered — show leave prompt, player dismisses
    respEl.textContent = data.silence_fill || 'He has said what he came to say.';
    listEl.innerHTML = '';
    const leaveDiv = document.createElement('div');
    leaveDiv.style.cssText = 'padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;cursor:pointer;';
    leaveDiv.textContent = 'He leaves.';
    leaveDiv.onclick = () => {
      _closeUninvitedEncounter(roomId);
    };
    listEl.appendChild(leaveDiv);
    return;
  }

  // Show baseline on first observation in this appearance
  const anyAnswered = qKeys.some(k => answered[roomId + '_' + k]);
  if (!anyAnswered) {
    respEl.textContent = data.baseline.text;
  }

  // Observation tap labels
  const LABELS = {
    physicians:  { Q1: 'Lady Ashworth.', Q2: 'Northcott.', Q3: 'The Register.' },
    library:     { Q1: 'The Register.', Q2: 'The Library.', Q3: 'The investigation.' },
    vault:       { Q1: 'The candidates.', Q2: 'The Register chain.', Q3: 'Why you are here.' },
    wine_cellar: { Q1: 'You found something.', Q2: 'A question.' },
  };
  const label = (LABELS[appearanceKey] && LABELS[appearanceKey][nextQ]) || 'Continue.';

  listEl.innerHTML = '';
  const variant = _getUninvitedComposureVariant();

  const qDiv = document.createElement('div');
  qDiv.className = 'question-item';
  qDiv.textContent = label;
  qDiv.onclick = () => {
    const qData    = block[nextQ];
    const response = qData[variant] || qData['composed'] || Object.values(qData)[0];

    if (response.includes('||')) {
      const parts = response.split('||');
      const dialogue = parts[0].trimEnd();
      const narrator = parts[1].trim();
      respEl.innerHTML = '';
      if (typeof renderWordByWord === 'function') {
        renderWordByWord(respEl, dialogue, 55);
      } else {
        respEl.textContent = dialogue;
      }
      const narratorDelay = dialogue.split(' ').length * 55 + 800;
      setTimeout(() => {
        const narratorEl = document.createElement('span');
        narratorEl.className = 'narrator';
        narratorEl.textContent = narrator;
        narratorEl.style.opacity = '0';
        narratorEl.style.transition = 'opacity 600ms ease';
        respEl.appendChild(narratorEl);
        setTimeout(() => { narratorEl.style.opacity = '1'; }, 50);
      }, narratorDelay);
    } else if (typeof renderWordByWord === 'function') {
      renderWordByWord(respEl, response, 55);
    } else {
      respEl.textContent = response;
    }

    answered[roomId + '_' + nextQ] = true;
    saveGame();

    // Show "Continue" after response — player controls pacing, no auto-advance
    setTimeout(() => {
      const continueDiv = document.createElement('div');
      continueDiv.className = 'question-item';
      continueDiv.style.cssText = 'color:var(--gold-dim);font-style:italic;';
      continueDiv.textContent = '—';
      continueDiv.onclick = () => _uninvitedEncounter(roomId);
      listEl.innerHTML = '';
      listEl.appendChild(continueDiv);
    }, 800);
  };
  listEl.appendChild(qDiv);
}

function updateCharacterDots(roomId) {
  const hw = getHourWindow();
  const POSITIONS_SOURCE = (gameState.prologueActive && window.PROLOGUE_NPC_POSITIONS)
    ? window.PROLOGUE_NPC_POSITIONS
    : CHARACTER_POSITIONS;
  (POSITIONS_SOURCE[roomId] || []).forEach(charId => {
    const dot = document.getElementById(`char-${charId}`);
    if (!dot) return;
    dot.classList.toggle('clock-gated', !(CHARACTER_AVAILABILITY[charId] || []).includes(hw));
    dot.classList.toggle('exhausted', !!gameState.char_dialogue_complete[charId]?._complete);
  });
}

function handleMapRoomTap(roomId) {
  const room = gameState.rooms[roomId];
  if (!room || room.state === 'undiscovered') return;

  // Already here
  if (roomId === gameState.currentRoom) { closeMap(); return; }

  // No teleportation — must be adjacent
  const adjacent = (window.ROOM_ADJACENCY && ROOM_ADJACENCY[gameState.currentRoom]) || [];
  if (!adjacent.includes(roomId)) return; // silent — map is reference only

  // Must have examined current room before leaving
  const essentials = (window.ROOM_ESSENTIAL_OBJECTS && ROOM_ESSENTIAL_OBJECTS[gameState.currentRoom]) || [];
  const canLeave = essentials.filter(id => gameState.examined_objects.includes(id)).length >= 1
    || essentials.length === 0
    || gameState.rooms[gameState.currentRoom]?.completed;
  if (!canLeave) return; // silent — nav tabs will show "Examine the room"

  // Old paid-spine paywall gate removed. New gate (prologue, post-Hale) lives in navigateTo.
  closeMap();
  if (roomId === 'stage') { openStage(); return; }
  navigateTo(roomId);
  renderCurrentRoom();
  renderRoomNav();
}

function renderCurrentRoom() {
  document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
  const cur = document.getElementById(`room-${gameState.currentRoom}`);
  if (cur) {
    cur.classList.add('active');
    const bg = cur.querySelector('.room-bg');
    if (bg) {
      bg.classList.remove('parallax-enter');
      void bg.offsetWidth;
      bg.classList.add('parallax-enter');
      bg.addEventListener('animationend', () => bg.classList.remove('parallax-enter'), { once: true });
    }
  }
  if (typeof updateCurrentRoomOnMap === 'function') updateCurrentRoomOnMap();
  updateInventoryCounter();
}

// Expose everything
window.initRooms = initRooms;

// ── UNINVITED TECHNIQUE INTERCEPT ─────────────────────────
// The Uninvited is not in CHARACTERS so _openConversationDirect bails.
// We intercept after technique is selected and route to _uninvitedEncounter.
NocturneEngine.on('techniqueSelected', ({ charId, technique }) => {
  if (charId !== 'uninvited') return;
  gameState._uninvitedTechnique = technique;
  // _openConversationDirect will be called next by interrogation.js
  // Override it for this one call
  const original = window._openConversationDirect;
  window._openConversationDirect = function(id) {
    if (id === 'uninvited') {
      window._openConversationDirect = original; // restore immediately
      _uninvitedEncounter(gameState.currentRoom);
    } else {
      window._openConversationDirect = original;
      original(id);
    }
  };
});
window.renderCurrentRoom = renderCurrentRoom;
window.updateCharacterDots = updateCharacterDots;
window.handleMapRoomTap = handleMapRoomTap;
window.getRoomBg = getRoomBg;
window.getCharPortrait = getCharPortrait;
window.getItemThumb = getItemThumb;
window.getPropThumb = getPropThumb;
window.getPuzzleImg = getPuzzleImg;

// ── ASSET PRELOADER ────────────────────────────────────────
function _preloadAssets() {
  const priority = [
    'foyer','ballroom','study','antechamber','gallery','library',
    'smoking','physicians','terrace','balcony','archive-path',
    'vault','wine-cellar','maids-quarters','groundskeeper-cottage',
    'map-room','dining-room','trophy-room','billiard-room','weapons-room','conservatory',
    'stage','tunnel-passage',
    'c1-arrival','c2-portraits','c3-original','c4-register',
    'c5-correspondence','c6-tunnel','c7-study','c8-gallery',
    'c9-agreement','c10-reckoning',
  ];
  let i = 0;
  function _next() {
    if (i >= priority.length) return;
    const url = getRoomBg(priority[i++]);
    if (!url) { _next(); return; }
    const img = new Image();
    img.onload = img.onerror = _next;
    img.src = url;
  }
  setTimeout(_next, 800);
}
window._preloadAssets = _preloadAssets;

// ── PER-ROOM PARALLAX CONFIG ───────────────────────────────
// All room backgrounds are 2:1 panoramic.
// x = computed at runtime (appW/2). y = max vertical travel px.
const ROOM_PARALLAX = {
  'foyer':                 { y: 0 },
  'study':                 { y: 20 },
  'ballroom':              { y: 10 },
  'library':               { y: 20 },
  'gallery':               { y: 15 },
  'antechamber':           { y: 15 },
  'smoking':               { y: 15 },
  'physicians':            { y: 15 },
  'vault':                 { y: 10 },
  'archive-path':          { y: 10 },
  'balcony':               { y: 25 },
  'terrace':               { y: 25 },
  'wine-cellar':           { y: 15 },
  'tunnel-passage':        { y: 20 },
  'maids-quarters':        { y: 15 },
  'groundskeeper-cottage': { y: 15 },
  'map-room':              { y: 15 },
  'dining-room':           { y: 15 },
  'trophy-room':           { y: 15 },
  'billiard-room':         { y: 15 },
  'weapons-room':          { y: 15 },
  'conservatory':          { y: 20 },
  '_default':              { y: 0 },
};

// ── GYROSCOPE + PINCH ZOOM ────────────────────────────────
(function _initGyroParallax() {
  if (typeof DeviceOrientationEvent === 'undefined') return;

  let _targetX = 0, _targetY = 0;
  let _curX = 0, _curY = 0;
  let _scale = 1, _pinchStartDist = 0, _pinchStartScale = 1;
  let _pinchOriginX = 0, _pinchOriginY = 0;
  let _translateX = 0, _translateY = 0;
  const MIN_SCALE = 1, MAX_SCALE = 2.5;
  const LERP = 0.09;

  let _isDragging  = false;
  let _dragStartX  = 0;
  let _dragBaseX   = 0;
  let _velX        = 0;
  let _lastDragX   = 0;
  let _gyroOffsetX = 0; // gyro contribution, updated when not dragging
  let _edgeHit     = 0; // -1 = at left edge fired, +1 = right edge fired, 0 = clear

  function _lerp(a, b, t) { return a + (b - a) * t; }

  function _getConfig() {
    const room = (window.gameState && window.gameState.currentRoom) || '';
    const cfg  = Object.assign({}, ROOM_PARALLAX[room] || ROOM_PARALLAX['_default']);
    // bg is now 2:1 aspect-ratio sized to container height, centered via translate(-50%,-50%).
    // Pannable range is (bgWidth - containerWidth) / 2 in each direction.
    const bg = _getBg();
    if (bg) {
      const bgRect = bg.getBoundingClientRect();
      const parent = bg.parentElement;
      const parentW = parent ? parent.getBoundingClientRect().width : window.innerWidth;
      cfg.x = Math.max(0, Math.floor((bgRect.width - parentW) / 2));
    } else {
      const appW = Math.min(window.innerWidth, 430);
      cfg.x = Math.floor(appW / 2);
    }
    return cfg;
  }

  function _getBg() {
    const roomId = (window.gameState && window.gameState.currentRoom) || '';
    const cur = document.getElementById(`room-${roomId}`);
    return cur ? cur.querySelector('.room-bg') : null;
  }

  function _applyTransform() {
    const bg = _getBg();
    if (!bg) return;
    const cfg = _getConfig();

    // bg is top:50% left:50% with translate(-50%,-50%) centering in CSS.
    // Our JS transform overrides CSS, so we re-apply the -50%,-50% as the base,
    // then add pan offsets (_curX, _curY) and scale on top.
    // _curX = 0       → center of room (foyer: arch, stairs)
    // _curX = +cfg.x  → left edge (foyer: coat hooks)
    // _curX = -cfg.x  → right edge (foyer: mirror)
    const tx = _curX + _translateX;
    const ty = _curY + _translateY;

    bg.style.transformOrigin = 'center center';
    bg.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${_scale})`;

    // Dynamic vignette — shift center opposite to pan direction for peripheral fade.
    // tx positive = looking left (image slid right) → darken right side → vignette center shifts left.
    // Range: 35%–65% (subtle).
    const roomId = (window.gameState && window.gameState.currentRoom) || '';
    const roomEl = document.getElementById(`room-${roomId}`);
    if (roomEl) {
      const v = roomEl.querySelector('.room-vignette');
      if (v && cfg.x > 0) {
        const panRatio = Math.max(-1, Math.min(1, tx / cfg.x));
        const vignPct  = 50 - panRatio * 15; // 35%..65%
        v.style.setProperty('--vign-x', vignPct.toFixed(1) + '%');
      }
    }

    // Haptic pulse at edges — fires once per edge-hit, clears when pulled away.
    if (cfg.x > 0 && _isDragging && typeof navigator !== 'undefined' && navigator.vibrate) {
      const atRight = _curX >= cfg.x - 0.5;
      const atLeft  = _curX <= -cfg.x + 0.5;
      if (atLeft && _edgeHit !== -1)      { navigator.vibrate(10); _edgeHit = -1; }
      else if (atRight && _edgeHit !== 1) { navigator.vibrate(10); _edgeHit = 1; }
      else if (!atLeft && !atRight)       { _edgeHit = 0; }
    }

    if (roomEl) {
      const hl = roomEl.querySelector('.hotspot-layer');
      if (hl) {
        hl.style.transformOrigin = 'center center';
        hl.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${_scale})`;
      }
    }
  }

  function _tick() {
    const cfg = _getConfig();
    _curX = _lerp(_curX, _targetX, LERP);
    _curY = _lerp(_curY, _targetY, LERP);
    const cx = Math.max(-cfg.x * _scale, Math.min(cfg.x * _scale, _curX));
    const cy = Math.max(-cfg.y * _scale, Math.min(cfg.y * _scale, _curY));
    _curX = cx; _curY = cy;
    _applyTransform();
    requestAnimationFrame(_tick);
  }

  function _onOrientation(e) {
    if (_isDragging) return; // drag has control — gyro stands down
    const cfg = _getConfig();
    const gamma = Math.max(-45, Math.min(45, e.gamma || 0));
    const beta  = Math.max(-45, Math.min(45, (e.beta || 0) - 45));
    _gyroOffsetX = (gamma / 45) * cfg.x * 0.25;
    // Gyro sets target relative to current drag-held position
    _targetX = Math.max(-cfg.x, Math.min(cfg.x, _dragBaseX + _gyroOffsetX));
    _targetY = -(beta / 45) * cfg.y;
  }

  function _pinchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function _pinchMid(e) {
    return {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
  }

  function _initPinch() {
    const container = document.getElementById('rooms-container') || document.body;

    container.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        _isDragging = true;
        _dragStartX = e.touches[0].clientX;
        _dragBaseX  = _targetX; // lock current position as base
        _lastDragX  = _dragStartX;
        _velX       = 0;
      }
      if (e.touches.length === 2) {
        _isDragging      = false;
        _pinchStartDist  = _pinchDist(e);
        _pinchStartScale = _scale;
        const mid = _pinchMid(e);
        _pinchOriginX = mid.x - window.innerWidth  / 2;
        _pinchOriginY = mid.y - window.innerHeight / 2;
      }
    }, { passive: true });

    container.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist       = _pinchDist(e);
        const ratio      = dist / _pinchStartDist;
        const newScale   = Math.max(MIN_SCALE, Math.min(MAX_SCALE, _pinchStartScale * ratio));
        const scaleDelta = newScale - _pinchStartScale;
        _translateX = -_pinchOriginX * scaleDelta;
        _translateY = -_pinchOriginY * scaleDelta;
        _scale = newScale;
        _applyTransform();
        return;
      }
      if (_isDragging && e.touches.length === 1) {
        const cfg  = _getConfig();
        const dx   = e.touches[0].clientX - _dragStartX;
        _velX      = e.touches[0].clientX - _lastDragX;
        _lastDragX = e.touches[0].clientX;
        _targetX   = Math.max(-cfg.x, Math.min(cfg.x, _dragBaseX + dx * 2.2));
      }
    }, { passive: false });

    container.addEventListener('touchend', e => {
      if (e.touches.length < 2 && _scale < 1.05) {
        _scale = 1; _translateX = 0; _translateY = 0;
        _applyTransform();
      }
      if (_isDragging) {
        _isDragging = false;
        // Apply inertia then hold — gyro resumes from this position
        const cfg = _getConfig();
        _dragBaseX = Math.max(-cfg.x, Math.min(cfg.x, _targetX + _velX * 3));
        _targetX   = _dragBaseX;
        _velX      = 0;
      }
    }, { passive: true });
  }

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    document.addEventListener('touchend', function _req() {
      DeviceOrientationEvent.requestPermission().then(state => {
        if (state === 'granted') window.addEventListener('deviceorientation', _onOrientation);
      }).catch(() => {});
      document.removeEventListener('touchend', _req);
    }, { once: true });
  } else {
    window.addEventListener('deviceorientation', _onOrientation);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initPinch);
  } else {
    setTimeout(_initPinch, 500);
  }

  requestAnimationFrame(_tick);
})();
window.ROOM_DESCRIPTIONS = ROOM_DESCRIPTIONS;
window.CURATOR_INSULTS = CURATOR_INSULTS;
window.CHARACTER_POSITIONS = CHARACTER_POSITIONS;
window.CHARACTER_AVAILABILITY = CHARACTER_AVAILABILITY;
window.PROP_ASSET_MAP = PROP_ASSET_MAP;
window.ITEM_ASSET_MAP = ITEM_ASSET_MAP;
window.ROOM_ASSET_MAP = ROOM_ASSET_MAP;
window.CHAR_ASSET_MAP = CHAR_ASSET_MAP;
window.PUZZLE_ASSET_MAP = PUZZLE_ASSET_MAP;

// Characters sharing a room — for multi-portrait layout
const ROOM_CHARACTERS = {
  'foyer':        ['northcott'],
  'gallery':      ['steward'],
  'study':        ['ashworth'],
  'archive-path': ['curator', 'voss'],
  'antechamber':  ['pemberton-hale'],
  'library':      ['greaves', 'uninvited'],
  'physicians':   ['crane', 'surgeon', 'uninvited'],
  'smoking':      ['baron'],
  'ballroom':     ['curator'],
  'vault':        ['uninvited'],
  'wine-cellar':  ['uninvited'],
  'c3-original':  ['sovereign'],
  'c6-tunnel':    ['envoy'],
  'c4-register':  ['archivist'],
  'c7-study':     [],
  'c8-gallery':   ['heir'],
};
window.ROOM_CHARACTERS = ROOM_CHARACTERS;
window.closeUninvitedEncounter = function(roomId) {
  const r = roomId || (window.gameState && gameState.currentRoom) || null;
  _closeUninvitedEncounter(r);
};


