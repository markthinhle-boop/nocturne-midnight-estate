// ============================================================
// NOCTURNE — board.js
// Investigation Board — cork wall, pins, red strings
// Full-screen. Drag to pan. Pinch to zoom.
// Reads live gameState — builds itself as player investigates.
// KB v10 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── CONSTANTS ──────────────────────────────────────────────
const BOARD_W = 1100;
const BOARD_H = 520;

// Character positions on the board — fixed layout
const CHAR_POSITIONS = {
  // SUSPECTS — 7 across, 140px spacing, CARD_W=110
  'northcott':      { x: 20,   y: 30  },
  'pemberton-hale': { x: 160,  y: 30  },
  'steward':        { x: 300,  y: 30  },
  'baron':          { x: 440,  y: 30  },
  'ashworth':       { x: 580,  y: 30  },
  'crane':          { x: 720,  y: 30  },
  'surgeon':        { x: 860,  y: 30  },
  // WITNESSES — second row
  'greaves':        { x: 20,   y: 210 },
  'curator':        { x: 160,  y: 210 },
  'voss':           { x: 300,  y: 210 },
  'vivienne':       { x: 440,  y: 210 },
  'hatch':          { x: 580,  y: 210 },
  'uninvited':      { x: 720,  y: 210 },
  // COMPACT — post-tunnel
  'sovereign':      { x: 20,   y: 390 },
  'heir':           { x: 160,  y: 390 },
  'envoy':          { x: 300,  y: 390 },
  'archivist':      { x: 440,  y: 390 },
};

// ── TIMELINE FROM NOTEPAD ──────────────────────────────────
// Parse saved notes for time references — only what player recorded

// Numeric: 5:47 PM, 8:01PM, 7:42 pm
const TIME_PATTERN_NUM = /\b([5-9]|1[0-2]):[0-5][0-9]\s*(?:PM|AM|pm|am)\b/g;

// Word-based times — "seven o'clock", "eight-oh-one", "half past six" etc
const WORD_TIME_MAP = {
  'five forty-seven':   '5:47 PM',
  'five-forty-seven':   '5:47 PM',
  'six o\'clock':       '6:00 PM',
  'six-fifteen':        '6:15 PM',
  'six fifteen':        '6:15 PM',
  'six-thirty':         '6:30 PM',
  'six thirty':         '6:30 PM',
  'six forty-five':     '6:45 PM',
  'six-forty-five':     '6:45 PM',
  'seven o\'clock':     '7:00 PM',
  'seven-oh-two':       '7:02 PM',
  'seven oh two':       '7:02 PM',
  'seven forty-two':    '7:42 PM',
  'seven-forty-two':    '7:42 PM',
  'seven forty-three':  '7:43 PM',
  'seven-forty-three':  '7:43 PM',
  'seven forty-four':   '7:44 PM',
  'seven-forty-four':   '7:44 PM',
  'seven forty-five':   '7:45 PM',
  'seven-forty-five':   '7:45 PM',
  'seven forty-six':    '7:46 PM',
  'seven-forty-six':    '7:46 PM',
  'seven forty-seven':  '7:47 PM',
  'seven-forty-seven':  '7:47 PM',
  'seven forty-eight':  '7:48 PM',
  'seven-forty-eight':  '7:48 PM',
  'seven forty-nine':   '7:49 PM',
  'seven-forty-nine':   '7:49 PM',
  'seven fifty':        '7:50 PM',
  'seven-fifty':        '7:50 PM',
  'seven fifty-two':    '7:52 PM',
  'seven-fifty-two':    '7:52 PM',
  'seven fifty-three':  '7:53 PM',
  'seven-fifty-three':  '7:53 PM',
  'seven fifty-eight':  '7:58 PM',
  'seven-fifty-eight':  '7:58 PM',
  'eight o\'clock':     '8:00 PM',
  'eight-oh-one':       '8:01 PM',
  'eight oh one':       '8:01 PM',
  'eight-oh-four':      '8:04 PM',
  'eight oh four':      '8:04 PM',
  'half past six':      '6:30 PM',
  'half past seven':    '7:30 PM',
  'quarter past seven': '7:15 PM',
  'three minutes past': '8:04 PM',
  'the gavel':          '8:01 PM',
  'the rite':           '8:00 PM',
};

function _extractTimes(text) {
  const found = []; // { timeStr, index }
  const lower = text.toLowerCase();

  // Numeric matches
  let m;
  const rNum = new RegExp(TIME_PATTERN_NUM.source, 'gi');
  while ((m = rNum.exec(text)) !== null) {
    found.push({ timeStr: m[0].trim(), index: m.index });
  }

  // Word matches
  Object.entries(WORD_TIME_MAP).forEach(([phrase, timeStr]) => {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      // Don't duplicate if already captured a numeric time very close by
      const alreadyCovered = found.some(f => Math.abs(f.index - idx) < 20);
      if (!alreadyCovered) {
        found.push({ timeStr, index: idx, phrase });
      }
    }
  });

  return found;
}

function _getTimelineFromNotepad() {
  const notes = window.gameState && window.gameState.notepad;
  if (!notes) return [];

  const events = [];
  const seen = new Set();

  Object.entries(notes).forEach(([charId, charNotes]) => {
    if (!Array.isArray(charNotes)) return;
    charNotes.forEach(note => {
      const text = note.text || '';
      const times = _extractTimes(text);

      times.forEach(({ timeStr, index, phrase }) => {
        const key = timeStr.toLowerCase().replace(/\s/g, '');
        if (seen.has(key)) return;
        seen.add(key);

        // Context: text around the match
        const searchStr = phrase || timeStr;
        const idx = phrase
          ? text.toLowerCase().indexOf(phrase)
          : index;
        const after = text.slice(idx + searchStr.length, idx + searchStr.length + 70)
          .replace(/^\W+/, '').split(/[.!?]/)[0].trim();
        const before = text.slice(Math.max(0, idx - 40), idx)
          .split(/[.!?]/).pop().trim();
        const context = (before + ' ' + timeStr + ' ' + after).trim().slice(0, 80);

        events.push({
          time:      timeStr,
          context,
          charId,
          noteId:    note.id,
          timestamp: note.timestamp,
        });
      });
    });
  });

  // Sort chronologically
  events.sort((a, b) => {
    const toMins = t => {
      const clean = t.replace(/\s/g, '').toUpperCase();
      const m = clean.match(/^(\d+):(\d+)(AM|PM)$/);
      if (!m) return 0;
      let h = parseInt(m[1]);
      const min = parseInt(m[2]);
      const isPM = m[3] === 'PM';
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return h * 60 + min;
    };
    return toMins(a.time) - toMins(b.time);
  });

  return events;
}

// String connections — only between characters player has talked to
// and who have a known relationship. Drawn dynamically.
const CHAR_CONNECTIONS = [
  // ── SURGEON connections ─────────────────────────────────────
  // Surgeon ↔ Crane — Crane admits the channel (protects him / candle iron story)
  { from: 'surgeon', to: 'crane',
    color: '#c9a84c', label: 'channel',
    node: 'crane_two_reasons' },

  // Surgeon → Railing — confirmed at balcony level (internal, shown as self-loop label)
  // Handled by timeline panel, not a string

  // ── CRANE connections ───────────────────────────────────────
  // Crane → Baron — Crane admits she knows the Baron's visit at 6:30
  { from: 'crane', to: 'baron',
    color: '#8a6a3a', label: '6:30',
    node: 'crane_baron_relationship' },

  // ── PEMBERTON-HALE connections ──────────────────────────────
  // PH → Curator — PH names the 7:42 conversation with Curator
  { from: 'pemberton-hale', to: 'curator',
    color: '#cc3333', label: '7:42',
    node: 'ph_redirect_curator' },

  // PH → Steward — PH admits Steward covered the corridor at 7:58
  { from: 'pemberton-hale', to: 'steward',
    color: '#8a6a3a', label: '7:58',
    node: 'ph_steward_corridor' },

  // ── STEWARD connections ─────────────────────────────────────
  // Steward → Baron — Steward admits the Bond/Baron arrangement
  { from: 'steward', to: 'baron',
    color: '#8a6a3a', label: 'bond',
    node: 'steward_corridor_758' },

  // Steward → Lady Ashworth — Steward names the Lady Ashworth bond obligation
  { from: 'steward', to: 'ashworth',
    color: '#8a6a3a', label: 'bond',
    node: 'steward_lady_ashworth_bond' },

  // ── BARON connections ───────────────────────────────────────
  // Baron → Crane — Baron names Crane's 6:30 visit to Ashworth
  { from: 'baron', to: 'crane',
    color: '#8a6a3a', label: '6:30',
    node: 'baron_crane_visit_630' },

  // Baron → Sovereign — Baron admits the Compact arrangement
  { from: 'baron', to: 'sovereign',
    color: '#6a8fa8', label: 'inside contact',
    node: 'baron_compact_arrangement' },

  // Baron → Surgeon (balcony observation at 6:15)
  { from: 'baron', to: 'surgeon',
    color: '#8a6a3a', label: '6:15',
    node: 'baron_615_observation' },

  // ── LADY ASHWORTH connections ───────────────────────────────
  // Lady Ashworth → PH — Ashworth redirects to PH (Register)
  { from: 'ashworth', to: 'pemberton-hale',
    color: '#8a6a3a', label: 'Register',
    node: 'ashworth_redirect_ph' },

  // Lady Ashworth → Surgeon — she knew Edmund's plan
  { from: 'ashworth', to: 'surgeon',
    color: '#cc3333', label: 'knew',
    node: 'ashworth_planned_revelation' },

  // ── NORTHCOTT connections ───────────────────────────────────
  // Northcott → Steward — Northcott names the 6:00 corridor
  { from: 'northcott', to: 'steward',
    color: '#8a6a3a', label: '6:00',
    node: 'northcott_redirect_steward' },

  // Northcott → PH — Northcott names the circled entry pointing at PH
  { from: 'northcott', to: 'pemberton-hale',
    color: '#8a6a3a', label: 'circled entry',
    node: 'northcott_placed_by_ashworth' },

  // Northcott → Surgeon — wrong mask at 7:52
  { from: 'northcott', to: 'surgeon',
    color: '#cc3333', label: '7:52',
    node: 'northcott_wrong_mask_752' },

  // ── WITNESS connections ─────────────────────────────────────
  // Vivienne ↔ Hatch — cross-reference fires
  { from: 'vivienne', to: 'hatch',
    color: '#8a6a3a', label: '8:15',
    node: 'vivienne_hatch_cross_fired' },

  // Hatch → Surgeon — mask exchange at 7:48 (earned after surgeon gap named)
  { from: 'hatch', to: 'surgeon',
    color: '#cc3333', label: '7:48',
    node: 'surgeon_admits_balcony_level' },

  // ── COMPACT connections ─────────────────────────────────────
  // Sovereign → Surgeon — operative placed inside Compact
  { from: 'sovereign', to: 'surgeon',
    color: '#6a8fa8', label: 'placed',
    node: 'baron_compact_arrangement' },

  // Sovereign ↔ Envoy / Heir ↔ Envoy
  { from: 'sovereign', to: 'envoy',
    color: '#c9a84c', label: 'operational',
    node: 'heir_wants_callums_independent_findings' },

  { from: 'heir', to: 'envoy',
    color: '#c9a84c', label: 'correspondence',
    node: 'heir_wants_callums_independent_findings' },

  // Voss ↔ Curator
  { from: 'voss', to: 'curator',
    color: '#8a6a3a', label: 'archive',
    node: 'voss_compact_link' },
];
// MOM string colours
const MOM_COLORS = {
  motive:  '#c9a84c',  // gold
  means:   '#cc3333',  // red
  moment:  '#6a8fa8',  // steel blue
  record:  '#7a9a6a',  // sage green
};

// ── SUSPECT PATHS — paired slots: true + array of false nodes ──
const SUSPECT_PATHS = {
  'surgeon': {
    slots: [
      { label: 'BALCONY LEVEL — BEFORE THE RITE',
        true_node: 'surgeon_admits_balcony_level',
        false_nodes: [] },
      { label: 'THE WITNESS — 7:45',
        true_node: 'vivienne_push_witnessed',
        false_nodes: ['surgeon_committed_745_south_corridor', 'surgeon_false_corridor_745', 'vivienne_false_romantic_reading'] },
      { label: 'MASKLESS — 7:48',
        true_node: 'greaves_maskless_witness',
        false_nodes: ['surgeon_false_no_gap', 'surgeon_redirect_baron_745'] },
    ],
  },
  'crane': {
    slots: [
      { label: 'THE FIRST VISIT — 6:15',
        true_node: 'crane_first_visit_ashworth_alive',
        false_nodes: ['crane_false_one_visit_only', 'crane_false_no_615'] },
      { label: 'FLOOR CLEAR — 6:15',
        true_node: 'crane_floor_clear_615',
        false_nodes: ['crane_false_no_615', 'crane_false_one_visit_only'] },
      { label: 'WHAT SHE FOUND',
        true_node: 'crane_said_nothing_after_discovery',
        false_nodes: ['crane_redirect_ph'] },
      { label: 'TWO REASONS',
        true_node: 'crane_two_reasons',
        false_nodes: ['crane_false_one_reason'] },
    ],
  },
  'pemberton-hale': {
    slots: [
      { label: 'THE IMMUNITY CLAUSE',
        true_node: 'ph_altered_register_for_clause_not_self',
        false_nodes: ['ph_false_timeline_ballroom', 'ph_false_standard_amendments'] },
      { label: 'THE ALTERATION',
        true_node: 'register_altered_ph',
        false_nodes: ['ph_false_register_untouched', 'ph_redirect_curator'] },
      { label: 'THE CORRIDOR — 7:58',
        true_node: 'ph_steward_corridor',
        false_nodes: ['steward_false_timeline_gallery'] },
    ],
  },
  'steward': {
    slots: [
      { label: 'THE BOND — FOURTEEN YEARS AGO',
        true_node: 'bond_coerced_signed',
        false_nodes: ['steward_false_bond_protocol', 'steward_redirect_ashworth'] },
      { label: 'THE INCIDENT — CLARA',
        true_node: 'steward_granddaughter_record',
        false_nodes: ['steward_personal_record'] },
      { label: 'THE ROUTE — 7:55',
        true_node: 'steward_route_past_physicians_room',
        false_nodes: [] },
      { label: 'THE CORRIDOR — 7:58',
        true_node: 'steward_corridor_758',
        false_nodes: ['steward_false_timeline_gallery', 'steward_false_gallery_vivienne'] },
    ],
  },
  'baron': {
    slots: [
      { label: 'THE SIGHTING — 6:15',
        true_node: 'baron_615_observation',
        false_nodes: ['baron_false_timeline_smoking_room', 'baron_false_no_615_sighting'] },
      { label: "CRANE'S VISIT — 6:30",
        true_node: 'baron_crane_visit_630',
        false_nodes: ['baron_false_crane_no_visit', 'baron_false_crane_brief'] },
      { label: 'THE ARRANGEMENT',
        true_node: 'baron_compact_arrangement',
        false_nodes: ['baron_false_personal_debts'] },
      { label: 'THE CANDLE IRON — 7:45',
        true_node: 'baron_candle_iron_knowledge',
        false_nodes: ['baron_redirect_steward'] },
    ],
  },
  'ashworth': {
    slots: [
      { label: 'THE PHYSICIAN — 6:15',
        true_node: 'crane_first_visit_ashworth_alive',
        false_nodes: ['ashworth_false_crane_not_upstairs'] },
      { label: 'SHE KNEW THE PLAN',
        true_node: 'ashworth_planned_revelation',
        false_nodes: ['ashworth_false_timeline_arrived_seven'] },
      { label: 'SHE TOLD HIM NOT TO',
        true_node: 'ashworth_told_her_about_arrangement',
        false_nodes: ['ashworth_redirect_ph'] },
      { label: 'THE WRONG MASK — 7:52',
        true_node: 'lady_ashworth_wrong_mask_752',
        false_nodes: ['ashworth_false_mask_normal'] },
    ],
  },
  'northcott': {
    slots: [
      { label: 'PLACED BY ASHWORTH',
        true_node: 'northcott_placed_by_ashworth',
        false_nodes: ['northcott_false_timeline_foyer', 'northcott_false_routine_post'] },
      { label: 'TWO ABSENCES',
        true_node: 'northcott_two_absences',
        false_nodes: ['northcott_false_all_masked_749', 'northcott_redirect_steward'] },
      { label: 'THE UNMASKED FIGURE',
        true_node: 'greaves_maskless_witness',
        false_nodes: ['northcott_false_all_masked_749'] },
      { label: 'CONTACT REFUSED',
        true_node: 'surgeon_contact_refused',
        false_nodes: ['northcott_false_surgeon_open', 'northcott_false_no_contact'] },
    ],
  },
};
// ── STATE ──────────────────────────────────────────────────
let _boardOpen     = false;
let _boardBuilt    = false;
let _panX          = 0;
let _panY          = 0;
let _scale         = 1;
let _dragging      = false;
let _dragStartX    = 0;
let _dragStartY    = 0;
let _pinchDist     = null;
let _scaleStart    = 1;
let _nodePositions = {}; // id → { x, y, w, h } for string endpoints

// ── ASSET BASE ─────────────────────────────────────────────
function _assetBase() {
  return (typeof ASSET_BASE !== 'undefined') ? ASSET_BASE : './assets/';
}

// ── PORTRAIT URL ───────────────────────────────────────────
const PORTRAIT_MAP = {
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

function _portrait(charId) {
  const path = PORTRAIT_MAP[charId];
  return path ? _assetBase() + path : null;
}

// ── DISPLAY NAME ───────────────────────────────────────────
function _name(charId) {
  const chars = Object.assign(
    {},
    window.CHARACTERS || {},
    window.COMPACT_CHARACTERS || {}
  );
  const c = chars[charId];
  return c ? (c.display_name || c.name || charId) : charId;
}

// ── WHAT'S BEEN DISCOVERED ─────────────────────────────────
function _talkedTo(charId) {
  const dc = window.gameState && window.gameState.char_dialogue_complete;
  return dc && dc[charId] && Object.keys(dc[charId]).some(k => k !== '_complete');
}

function _hasItem(itemId) {
  return window.gameState && window.gameState.inventory &&
         window.gameState.inventory.includes(itemId);
}

function _examined(objId) {
  return window.gameState && window.gameState.examined_objects &&
         window.gameState.examined_objects.includes(objId);
}

function _connectionVisible(conn) {
  // Both must be talked to
  const hasFrom = CHAR_POSITIONS[conn.from] ? _talkedTo(conn.from) : false;
  const hasTo   = CHAR_POSITIONS[conn.to]   ? _talkedTo(conn.to)   : false;
  if (!hasFrom || !hasTo) return false;
  // If connection has a node requirement — that node must be in player's inventory
  if (conn.node) {
    const ni = (window.gameState && window.gameState.node_inventory) || {};
    return !!ni[conn.node];
  }
  return true;
}

// ── MOM ITEMS ON BOARD ─────────────────────────────────────
function _getMOMItems() {
  const gs = window.gameState;
  if (!gs) return [];
  const items = [];
  const inv = gs.inventory || [];
  const ITEMS = window.ITEMS || {};
  inv.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item) return;
    const cats = item.pedestal_category || [];
    const target = item.accusation_target;
    cats.forEach(cat => {
      items.push({ itemId, cat, target, name: item.name || itemId });
    });
  });
  return items;
}

// ── OPEN / CLOSE ───────────────────────────────────────────
function openBoard() {
  _boardOpen = true;
  const panel = document.getElementById('board-panel');
  if (!panel) return;
  panel.style.display = 'flex';
  panel.style.pointerEvents = 'all';
  panel.style.background = '#3d2e1a';
  panel.style.backgroundImage = [
    'radial-gradient(ellipse at 20% 30%, rgba(160,120,60,0.25) 0%, transparent 50%)',
    'radial-gradient(ellipse at 80% 70%, rgba(100,70,30,0.2) 0%, transparent 50%)',
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 5px)',
  ].join(',');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.classList.add('visible');
      _buildBoard();
      _centerBoard();
    });
  });
  if (typeof haptic === 'function') haptic([30]);
}

function closeBoard() {
  _boardOpen = false;
  const panel = document.getElementById('board-panel');
  if (!panel) return;
  panel.classList.remove('visible');
  panel.style.pointerEvents = 'none';
  setTimeout(() => { panel.style.display = 'none'; }, 300);
}

// ── CENTER BOARD ───────────────────────────────────────────
function _centerBoard() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;

  // Mobile: smaller scale so character row fits within screen width
  // Desktop: slightly larger
  if (isMobile) {
    // Scale so BOARD_W fits within viewport with some padding
    _scale = Math.min(0.42, (vw - 24) / BOARD_W);
  } else {
    _scale = 0.65;
  }

  // Center horizontally, drop slightly from top so header clears
  _panX = (vw - BOARD_W * _scale) / 2;
  _panY = isMobile ? vh * 0.06 : vh * 0.08;
  _applyTransform();
}

// ── APPLY TRANSFORM ────────────────────────────────────────
function _applyTransform() {
  const canvas = document.getElementById('board-canvas');
  if (!canvas) return;
  canvas.style.transform = `translate(${_panX}px, ${_panY}px) scale(${_scale})`;
  canvas.style.transformOrigin = '0 0';
}

// ── TIMELINE TAB STATE ────────────────────────────────────
let _activeTimelineChar = null;

// ── BUILD BOARD ────────────────────────────────────────────
function _buildBoard() {
  const canvas = document.getElementById('board-canvas');
  if (!canvas) return;
  canvas.innerHTML = '';
  _nodePositions = {};

  // ── Cork texture
  const cork = document.createElement('div');
  cork.style.cssText = [
    'position:absolute', 'inset:0',
    'background:repeating-linear-gradient(45deg,rgba(140,100,50,0.03) 0px,rgba(140,100,50,0.03) 2px,transparent 2px,transparent 8px),repeating-linear-gradient(-45deg,rgba(100,70,30,0.02) 0px,rgba(100,70,30,0.02) 2px,transparent 2px,transparent 12px)',
    'pointer-events:none', 'z-index:0',
  ].join(';');
  canvas.appendChild(cork);

  const compactChars = ['sovereign','heir','envoy','archivist'];
  const tunnelFound = window.gameState && window.gameState.tunnelFound;
  const ACCUSABLE = ['surgeon','crane','pemberton-hale','steward','baron','ashworth','northcott'];

  // ── Section label — suspects row
  _addLabel(canvas, 'SUSPECTS', 20, 18);
  _addLabel(canvas, 'WITNESSES', 20, 198);

  // ── Character pins — all in their positions
  const NON_BOARD_CHARS = ['uninvited']; // Uninvited has no portrait pin on the board
  Object.keys(CHAR_POSITIONS).forEach(charId => {
    if (!_talkedTo(charId)) return;
    if (compactChars.includes(charId) && !tunnelFound) return;
    if (NON_BOARD_CHARS.includes(charId)) return;
    const pos = CHAR_POSITIONS[charId];
    _addCharPin(canvas, charId, pos.x, pos.y);
  });

  // ── Strings between characters (drawn before timeline panel)
  _addStrings(canvas);

  // ── Timeline panel — below active suspect portrait
  _addTimelinePanel(canvas);

  // ── MOM evidence items
  _addMOMItems(canvas);

  // ── MOM convergence check
  _checkMOMConvergence(canvas);

  // ── Timeline gate message
  _updateGateMessage();


}

// ── SECTION LABEL ──────────────────────────────────────────
function _addLabel(canvas, text, x, y) {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:absolute',
    `left:${x}px`, `top:${y}px`,
    'font-size:8px', 'letter-spacing:0.35em',
    'color:rgba(180,155,90,0.3)', 'text-transform:uppercase',
    'pointer-events:none', 'white-space:nowrap',
  ].join(';');
  el.textContent = text;
  canvas.appendChild(el);
}

// ── TIMELINE HORIZONTAL LINE ────────────────────────────────
function _addTimelineLine(canvas) {
  const line = document.createElement('div');
  line.style.cssText = [
    'position:absolute',
    'left:200px', 'right:100px',
    'top:820px', 'height:1px',
    'background:linear-gradient(to right,transparent,rgba(180,155,90,0.2) 5%,rgba(180,155,90,0.2) 95%,transparent)',
    'pointer-events:none',
  ].join(';');
  canvas.appendChild(line);
}

// ── STABLE HASH FOR CONSISTENT ROTATIONS ──────────────────
function _stableHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}
function _stableRotation(seed) {
  // Returns a value between -2.5 and 2.5 degrees — consistent per seed
  const h = _stableHash(String(seed));
  return ((h % 500) / 100) - 2.5;
}

// ── CHARACTER PIN ───────────────────────────────────────────
const CARD_W = 100;
const CARD_H = 130;
// On mobile at 0.4 scale, CARD_W=110 renders as ~44px — fine.
// The board canvas dimensions stay fixed; scale handles mobile sizing.

function _addCharPin(canvas, charId, x, y) {
  const card = document.createElement('div');
  card.id = `board-char-${charId}`;
  card.style.cssText = [
    'position:absolute',
    `left:${x}px`, `top:${y}px`,
    `width:${CARD_W}px`,
    'display:flex', 'flex-direction:column', 'align-items:center',
    'cursor:pointer',
    `transform:rotate(${_stableRotation(charId)}deg)`,
    'transition:transform 150ms',
    'z-index:2',
  ].join(';');

  // Pin head
  const pin = document.createElement('div');
  pin.style.cssText = [
    'width:10px', 'height:10px', 'border-radius:50%',
    'background:radial-gradient(circle at 35% 35%,#e8c060,#8a6020)',
    'box-shadow:0 1px 3px rgba(0,0,0,0.6)',
    'margin-bottom:4px', 'flex-shrink:0',
    'z-index:3',
  ].join(';');

  // Photo card
  const photo = document.createElement('div');
  const portraitUrl = _portrait(charId);
  photo.style.cssText = [
    `width:${CARD_W}px`, 'height:120px',
    'background:#1a1510',
    'border:2px solid rgba(200,180,130,0.4)',
    'box-shadow:2px 3px 8px rgba(0,0,0,0.7),inset 0 0 20px rgba(0,0,0,0.3)',
    portraitUrl ? `background-image:url(${portraitUrl});background-size:cover;background-position:center top` : '',
    'position:relative', 'overflow:hidden',
  ].join(';');

  // Accusable suspects — gold border on photo card
  const ACCUSABLE = ['surgeon','crane','pemberton-hale','steward','baron','ashworth','northcott'];
  if (ACCUSABLE.includes(charId)) {
    photo.style.border = '2px solid rgba(201,168,76,0.7)';
    photo.style.boxShadow = '2px 3px 8px rgba(0,0,0,0.7),0 0 8px rgba(201,168,76,0.2),inset 0 0 20px rgba(0,0,0,0.3)';
  }

  // Name tag below photo
  const nameTag = document.createElement('div');
  nameTag.style.cssText = [
    `width:${CARD_W}px`,
    'background:rgba(240,230,200,0.92)',
    'padding:4px 6px',
    'font-size:8px', 'letter-spacing:0.12em',
    'color:#1a1208', 'text-align:center',
    'text-transform:uppercase',
    ACCUSABLE.includes(charId) ? 'border:1px solid rgba(201,168,76,0.6)' : 'border:1px solid rgba(180,155,90,0.4)',
    'border-top:none',
    'box-shadow:0 2px 4px rgba(0,0,0,0.5)',
  ].join(';');
  nameTag.textContent = _name(charId).toUpperCase();

  card.appendChild(pin);
  card.appendChild(photo);
  card.appendChild(nameTag);
  canvas.appendChild(card);

  // Register node centre for strings
  const cx = x + CARD_W / 2;
  const cy = y + 60; // middle of photo
  _nodePositions[charId] = { x: cx, y: cy };

  const isActive = _activeTimelineChar === charId;

  if (isActive && ACCUSABLE.includes(charId)) {
    card.style.transform = 'rotate(0deg)';
    card.style.zIndex = '5';
    photo.style.border = '2px solid rgba(201,168,76,1)';
    photo.style.boxShadow = '2px 3px 8px rgba(0,0,0,0.7),0 0 14px rgba(201,168,76,0.5),inset 0 0 20px rgba(0,0,0,0.3)';
    nameTag.style.background = 'rgba(201,168,76,0.18)';
    nameTag.style.color = '#c9a84c';
  }

  if (ACCUSABLE.includes(charId)) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      _activeTimelineChar = charId;
      _buildBoard();
    });
  }

  card.addEventListener('mouseenter', () => {
    if (_activeTimelineChar !== charId) {
      card.style.transform = `rotate(0deg) translateY(-4px) scale(1.05)`;
      card.style.zIndex = '10';
    }
  });
  card.addEventListener('mouseleave', () => {
    if (_activeTimelineChar !== charId) {
      card.style.transform = `rotate(${_stableRotation(charId)}deg)`;
      card.style.zIndex = '2';
    }
  });
}

// ── EVENT PIN ──────────────────────────────────────────────
function _addEventPin(canvas, evt) {
  const card = document.createElement('div');
  card.id = evt.id;
  card.style.cssText = [
    'position:absolute',
    `left:${evt.x}px`, `top:${evt.y - 60}px`,
    'width:150px',
    'display:flex', 'flex-direction:column', 'align-items:center',
    'z-index:2',
    `transform:rotate(${(Math.random() - 0.5) * 2}deg)`,
  ].join(';');

  // Pin
  const pin = document.createElement('div');
  pin.style.cssText = [
    'width:8px', 'height:8px', 'border-radius:50%',
    'background:radial-gradient(circle at 35% 35%,#cc4444,#881111)',
    'box-shadow:0 1px 3px rgba(0,0,0,0.6)',
    'margin-bottom:3px',
  ].join(';');

  // Index card
  const noteCard = document.createElement('div');
  noteCard.style.cssText = [
    'width:150px',
    'background:rgba(245,238,218,0.92)',
    'border:1px solid rgba(180,155,90,0.5)',
    'box-shadow:2px 2px 6px rgba(0,0,0,0.6)',
    'padding:8px 10px',
    // Lined paper effect
    'background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent 18px,rgba(100,120,180,0.15) 18px,rgba(100,120,180,0.15) 19px)',
  ].join(';');

  const timeEl = document.createElement('div');
  timeEl.style.cssText = 'font-size:9px;letter-spacing:0.15em;color:#8a6020;font-weight:bold;margin-bottom:4px;';
  timeEl.textContent = evt.time;

  const labelEl = document.createElement('div');
  labelEl.style.cssText = 'font-size:9px;line-height:1.5;color:#2a1e0a;letter-spacing:0.02em;';
  labelEl.textContent = evt.label;

  // Check if this time has been discredited by a contradicting true node
  const discredited = window.gameState &&
    window.gameState.discredited_times &&
    window.gameState.discredited_times.some(dt => {
      // Normalize both times for comparison — strip spaces, uppercase
      const norm = t => t.replace(/\s/g, '').toUpperCase();
      return norm(dt) === norm(evt.time);
    });

  if (discredited) {
    // Red strikethrough — false timeline cracked
    noteCard.style.opacity = '0.55';
    noteCard.style.borderTop = '3px solid rgba(180,50,50,0.8)';

    const strikeWrap = document.createElement('div');
    strikeWrap.style.cssText = [
      'position:absolute', 'inset:0',
      'pointer-events:none',
      'display:flex', 'align-items:center',
    ].join(';');
    const strike = document.createElement('div');
    strike.style.cssText = [
      'width:100%', 'height:1.5px',
      'background:rgba(180,50,50,0.75)',
      'position:absolute',
    ].join(';');
    strikeWrap.appendChild(strike);
    noteCard.style.position = 'relative';
    noteCard.appendChild(strikeWrap);

    // Small ✗ marker top-right
    const xMark = document.createElement('div');
    xMark.style.cssText = [
      'position:absolute', 'top:3px', 'right:5px',
      'font-size:9px', 'color:rgba(180,50,50,0.85)',
      'pointer-events:none', 'line-height:1',
    ].join(';');
    xMark.textContent = '✕';
    noteCard.appendChild(xMark);

    timeEl.style.color = 'rgba(180,50,50,0.7)';
    labelEl.style.color = 'rgba(80,50,50,0.7)';
  }

  noteCard.appendChild(timeEl);
  noteCard.appendChild(labelEl);
  card.appendChild(pin);
  card.appendChild(noteCard);
  canvas.appendChild(card);

  _nodePositions[evt.id] = { x: evt.x + 75, y: evt.y };
}

// ── NODE INFO MAP ───────────────────────────────────────────
const NODE_INFO = {
  'greaves_maskless_witness':                { label: 'Unmasked figure running past the balcony stairs at 7:48.',              source: 'Greaves — Library' },
  'surgeon_committed_745_south_corridor':    { label: 'Claims south corridor at 7:45. Not the balcony.',                 source: 'Surgeon — Physicians Room' },
  'surgeon_admits_balcony_level':            { label: '"The balcony level, yes. The sightlines." Places himself there before the Rite.',  source: 'Surgeon — Physicians Room' },
  'vivienne_push_witnessed':                 { label: '"One man pushed another man off that balcony."',                  source: "Vivienne — Maid's Quarters" },
  'crane_first_visit_ashworth_alive':        { label: 'Went upstairs at 6:15. Lord Ashworth was well. Left her case.',  source: 'Crane — Physicians Room' },
  'crane_said_nothing_after_discovery':      { label: 'Found the mask at 8:01. Said nothing. Came back downstairs.',    source: 'Crane — Physicians Room' },
  'crane_two_reasons':                       { label: 'Protecting him. The candle iron story protecting her.',           source: 'Crane — Physicians Room' },
  'ph_altered_register_for_clause_not_self': { label: 'Added immunity clause for another member. Fear, not murder.',    source: 'Pemberton-Hale — Antechamber' },
  'ph_false_timeline_ballroom':              { label: 'Claims Ballroom from 7:00. Watching the Register.',              source: 'Pemberton-Hale — Antechamber' },
  'register_altered_ph':                     { label: 'Entries detectable. His own word.',                              source: 'Pemberton-Hale — Antechamber' },
  'ph_steward_corridor':                     { label: 'Steward covered the corridor at 7:58. Lectern to terrace.',      source: 'Steward — Gallery' },
  'steward_corridor_758':                    { label: 'South corridor at 7:58. Bond instruction. He covered it.',       source: 'Steward — Gallery' },
  'steward_false_timeline_gallery':          { label: 'Claims Gallery at 7:58.',                                        source: 'Steward — Gallery' },
  'bond_coerced_signed':                     { label: 'Signed believing it was a property form. Eight years.',          source: 'Steward — Gallery' },
  'steward_route_past_physicians_room':      { label: 'Baron saw him pass the physicians room at 7:58.',                source: 'Baron — Smoking Room' },
  'baron_615_observation':                   { label: 'Saw someone leave the study at 6:15. Satisfied.',                source: 'Baron — Smoking Room' },
  'baron_false_timeline_smoking_room':       { label: 'Claims Smoking Room all evening.',                               source: 'Baron — Smoking Room' },
  'baron_crane_visit_630':                   { label: 'Crane came at 6:30. Twelve minutes. Needed to think.',           source: 'Baron — Smoking Room' },
  'baron_compact_arrangement':               { label: 'Three entries in the Register. Debts through Compact channel.',  source: 'Baron — Smoking Room' },
  'ashworth_planned_revelation':             { label: 'She knew. Came to hear it named aloud in a full room.',          source: 'Lady Ashworth — Study' },
  'ashworth_false_timeline_arrived_seven':   { label: 'Claims arrived at seven. Garden at 7:40.',                       source: 'Lady Ashworth — Study' },
  'lady_ashworth_wrong_mask_752':            { label: 'She noticed the wrong mask at 7:52. Said nothing.',              source: 'Lady Ashworth — Study' },
  'northcott_placed_by_ashworth':            { label: 'Ashworth knew his name. Placed deliberately.',                   source: 'Northcott — Foyer' },
  'northcott_false_timeline_foyer':          { label: 'Claims at post in foyer all evening.',                           source: 'Northcott — Foyer' },
  'surgeon_contact_refused':                 { label: 'Surgeon refused to say if he stayed in contact. That is the line.', source: 'Surgeon — Physicians Room' },
  // Surgeon false
  'surgeon_false_corridor_745':              { label: 'Seen in assembly at 7:45 — masked, beside Curator.',              source: "Vivienne — Maid's Quarters" },
  'surgeon_false_no_gap':                    { label: 'Continuously in the ballroom from 7:55 until 8:01.',              source: "Vivienne — Maid's Quarters" },
  'surgeon_redirect_baron_745':              { label: 'Baron was at the terrace window at 7:45. Has not mentioned it.',  source: 'Surgeon — Physicians Room' },
  // Crane false
  'crane_false_no_615':                      { label: 'No upstairs visit logged at 6:15. Stayed on ground floor.',       source: 'Northcott — Foyer' },
  'crane_false_one_reason':                  { label: 'One reason given: her medical case. Professional duty only.',     source: "Vivienne — Maid's Quarters" },
  'crane_false_one_visit_only':              { label: 'Only one upstairs visit logged — arrival at 5:43.',               source: 'Northcott — Foyer' },
  'crane_redirect_ph':                       { label: 'The Register alterations are the story. Eight years of amendments.', source: 'Crane — Physicians Room' },
  // PH false
  'ph_false_standard_amendments':            { label: 'Told the Curator: standard procedural entries. Nothing requiring review.', source: "Vivienne — Maid's Quarters" },
  'ph_false_register_untouched':             { label: 'At the Register at 7:40 — examining, not writing.',               source: 'Northcott — Foyer' },
  'ph_redirect_curator':                     { label: 'The Curator knew about the alterations weeks before. Allowed the Rite to proceed.', source: 'Pemberton-Hale — Antechamber' },
  // Steward false
  'steward_false_gallery_vivienne':          { label: 'At the gallery entrance at 7:58. Facing in. Not moving.',         source: "Vivienne — Maid's Quarters" },
  'steward_false_bond_protocol':             { label: 'Told her: I was in the gallery at the time. If anyone asks.',     source: "Vivienne — Maid's Quarters" },
  'steward_redirect_ashworth':              { label: 'Lady Ashworth in garden at 7:40. Beneath the balcony. Two minutes.', source: 'Steward — Gallery' },
  // Baron false
  'baron_false_no_615_sighting':             { label: 'In his chair in the smoking room at 6:15. Untouched drink.',      source: "Vivienne — Maid's Quarters" },
  'baron_false_crane_no_visit':              { label: 'No movement toward smoking room logged at 6:30. Door stayed closed.', source: 'Northcott — Foyer' },
  'baron_false_crane_brief':                 { label: 'No visitor entry for Crane at 6:30 in the arrival log.',          source: 'Northcott — Foyer' },
  'baron_false_personal_debts':              { label: 'Told the Archivist: three entries are personal. Nothing institutional.', source: "Vivienne — Maid's Quarters" },
  'baron_redirect_steward':                  { label: 'Steward opened east service gate at 7:44. Stood in it 30 seconds.', source: 'Baron — Smoking Room' },
  // Ashworth false
  'ashworth_false_crane_not_upstairs':       { label: 'Did not see Crane go upstairs before the assembly.',              source: "Vivienne — Maid's Quarters" },
  'ashworth_false_mask_normal':              { label: 'Lady Ashworth was watching the lectern at 7:52. Not the physician.', source: "Vivienne — Maid's Quarters" },
  'ashworth_redirect_ph':                    { label: 'The Viscount was reading the Register at 7:40. He knew what the reading would name.', source: 'Lady Ashworth — Study' },
  // Northcott false
  'northcott_false_routine_post':            { label: 'Northcott at his station. Passed him twice during the evening.',  source: "Vivienne — Maid's Quarters" },
  'northcott_false_all_masked_749':          { label: 'Saw a figure on balcony stairs at 7:49 — they were masked.',     source: "Vivienne — Maid's Quarters" },
  'northcott_false_no_contact':              { label: 'Did not see physician and Crane speak or acknowledge each other.', source: "Vivienne — Maid's Quarters" },
  'northcott_redirect_steward':              { label: 'Steward acknowledged him at 6:00 — two seconds, not routine.',   source: 'Northcott — Foyer' },
  'northcott_false_surgeon_open':            { label: 'Compact physician answered every question. Cooperative all evening.', source: 'Northcott — Foyer' },
  // True nodes added
  'crane_floor_clear_615':                   { label: 'Balcony floor was clear at 6:15. No mask present when she left.',  source: 'Crane — Physicians Room' },
  'steward_granddaughter_record':            { label: 'Clara. Nine years old. He knows exactly why he covered that corridor.',  source: 'Steward — Gallery' },
  'baron_candle_iron_knowledge':             { label: 'Baron knew the iron was missing before anyone named it.',          source: 'Baron — Smoking Room' },
  'ashworth_told_her_about_arrangement':     { label: 'He told her about the arrangement. She asked him not to proceed.', source: 'Lady Ashworth — Study' },
  'northcott_two_absences':                  { label: 'Two gaps in his foyer log — 7:35 and 7:49. He explains both.',    source: 'Northcott — Foyer' },
  // False nodes added
  'vivienne_false_romantic_reading':         { label: 'What she saw at 7:49 has a romantic explanation. Probably.',      source: "Vivienne — Maid's Quarters" },
  'steward_personal_record':                 { label: 'The sealed record is personal. He has never asked what it contains.', source: 'Steward — Gallery' },
};

function _getNodeInfo(nodeId) {
  return NODE_INFO[nodeId] || { label: nodeId, source: '' };
}

// ── TIMELINE PANEL — tabbed single-suspect ──────────────────
function _addTimelinePanel(canvas) {
  const ACCUSABLE = ['surgeon','crane','pemberton-hale','steward','baron','ashworth','northcott'];
  const nodes = _getInfoNodes();
  const dc = (window.gameState && window.gameState.char_dialogue_complete) || {};

  const available = ACCUSABLE.filter(c => _talkedTo(c));
  if (available.length === 0) return;

  if (!_activeTimelineChar || !available.includes(_activeTimelineChar)) {
    let best = available[0], bestCount = 0;
    available.forEach(c => {
      const count = dc[c] ? Object.keys(dc[c]).length : 0;
      if (count > bestCount) { bestCount = count; best = c; }
    });
    _activeTimelineChar = best;
  }

  const path = SUSPECT_PATHS[_activeTimelineChar];
  if (!path || !path.slots) return;

  // ── Layout constants ─────────────────────────────────────────
  const LINE_Y      = 420;   // y position of the horizontal wire
  const LINE_LEFT   = 20;
  const LINE_RIGHT  = 1060;
  const SLOT_COUNT  = path.slots.length;
  const SLOT_SPACING = (LINE_RIGHT - LINE_LEFT) / (SLOT_COUNT + 1);  // auto-spaces 3 or 4

  // ── Suspect label above line ──────────────────────────────────
  const nameLabel = document.createElement('div');
  nameLabel.style.cssText = [
    'position:absolute',
    `left:${LINE_LEFT}px`,
    `top:${LINE_Y - 22}px`,
    'font-family:var(--font-ui,sans-serif)',
    'font-size:8px', 'letter-spacing:0.3em', 'text-transform:uppercase',
    'color:rgba(201,168,76,0.5)',
  ].join(';');
  nameLabel.textContent = _name(_activeTimelineChar).toUpperCase() + ' — TIMELINE';
  canvas.appendChild(nameLabel);

  // ── Horizontal wire ───────────────────────────────────────────
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = [
    'position:absolute', 'inset:0',
    `width:${BOARD_W}px`, `height:${BOARD_H}px`,
    'pointer-events:none', 'z-index:3', 'overflow:visible',
  ].join(';');

  // Main horizontal line
  const wire = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  wire.setAttribute('x1', LINE_LEFT);
  wire.setAttribute('y1', LINE_Y);
  wire.setAttribute('x2', LINE_RIGHT);
  wire.setAttribute('y2', LINE_Y);
  wire.setAttribute('stroke', 'rgba(180,155,90,0.25)');
  wire.setAttribute('stroke-width', '1.5');
  wire.setAttribute('stroke-dasharray', '4,4');
  svg.appendChild(wire);

  path.slots.forEach((slot, i) => {
    const x = LINE_LEFT + SLOT_SPACING * (i + 1);
    const hasTrue  = !!nodes[slot.true_node];
    const collectedFalse = (slot.false_nodes || []).filter(n => nodes[n]);
    const hasFalse = collectedFalse.length > 0;
    const found = hasTrue || hasFalse;

    // Pin circle on the wire
    const pinColor = hasTrue ? 'rgba(201,168,76,0.9)' : hasFalse ? 'rgba(180,80,80,0.8)' : 'rgba(100,85,55,0.5)';
    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pin.setAttribute('cx', x);
    pin.setAttribute('cy', LINE_Y);
    pin.setAttribute('r', found ? '7' : '5');
    pin.setAttribute('fill', found ? pinColor : 'none');
    pin.setAttribute('stroke', pinColor);
    pin.setAttribute('stroke-width', '1.5');
    svg.appendChild(pin);

    // Vertical drop line from pin to testimony
    const dropLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dropLine.setAttribute('x1', x);
    dropLine.setAttribute('y1', LINE_Y + (found ? 7 : 5));
    dropLine.setAttribute('x2', x);
    dropLine.setAttribute('y2', LINE_Y + 28);
    dropLine.setAttribute('stroke', pinColor);
    dropLine.setAttribute('stroke-width', '1');
    dropLine.setAttribute('opacity', '0.4');
    svg.appendChild(dropLine);

    // Slot labels removed — no hints above pins

    // Testimony text below wire
    const textY = LINE_Y + 36;

    if (!found) {
      // Empty — just a dim dash
      const emptyEl = document.createElement('div');
      emptyEl.style.cssText = [
        'position:absolute',
        `left:${x - 80}px`,
        `top:${textY}px`,
        'width:160px', 'text-align:center',
        'font-family:var(--font-ui,sans-serif)',
        'font-size:8px', 'color:rgba(120,100,60,0.25)',
        'font-style:italic',
      ].join(';');
      emptyEl.textContent = '—';
      canvas.appendChild(emptyEl);
    } else {
      const mainNode = hasTrue ? slot.true_node : collectedFalse[0];
      const info = _getNodeInfo(mainNode);

      // Main testimony
      const testimonyEl = document.createElement('div');
      testimonyEl.style.cssText = [
        'position:absolute',
        `left:${x - 110}px`,
        `top:${textY}px`,
        'width:220px', 'text-align:center',
        'font-family:var(--font),Georgia,serif',
        'font-size:10px', 'line-height:1.55',
        `color:${hasTrue ? 'rgba(210,195,165,0.85)' : 'rgba(180,100,100,0.75)'}`,
      ].join(';');
      testimonyEl.textContent = info.label;
      canvas.appendChild(testimonyEl);

      // Source
      const sourceEl = document.createElement('div');
      sourceEl.style.cssText = [
        'position:absolute',
        `left:${x - 110}px`,
        `top:${textY + 44}px`,
        'width:220px', 'text-align:center',
        'font-family:var(--font-ui,sans-serif)',
        'font-size:7px', 'letter-spacing:0.15em', 'text-transform:uppercase',
        'color:rgba(180,155,90,0.35)',
      ].join(';');
      sourceEl.textContent = info.source;
      canvas.appendChild(sourceEl);

      // False nodes below — strikethrough
      if (hasFalse && hasTrue) {
        collectedFalse.forEach((falseNode, fi) => {
          const falseInfo = _getNodeInfo(falseNode);
          const falseEl = document.createElement('div');
          falseEl.style.cssText = [
            'position:absolute',
            `left:${x - 110}px`,
            `top:${textY + 70 + fi * 40}px`,
            'width:220px', 'text-align:center',
            'font-family:var(--font),Georgia,serif',
            'font-size:9px', 'line-height:1.5',
            'color:rgba(180,80,80,0.55)',
            'text-decoration:line-through',
            'text-decoration-color:rgba(180,50,50,0.4)',
          ].join(';');
          falseEl.textContent = falseInfo.label;
          canvas.appendChild(falseEl);
        });
      }
    }
  });

  canvas.appendChild(svg);
}
function _addMOMItems(canvas) {
  const momItems = _getMOMItems();
  if (momItems.length === 0) return;

  // MOM items — pinned in evidence row, left to right
  // Active suspect's items full opacity, others dimmed
  const EVIDENCE_TOP = 900;
  const ITEM_W = 140;
  const ITEM_GAP = 20;
  const START_X = 60;

  // Separate active and other items — active first
  const activeItems = momItems.filter(item => !_activeTimelineChar || item.target === _activeTimelineChar);
  const otherItems  = momItems.filter(item => _activeTimelineChar && item.target !== _activeTimelineChar);
  const ordered = [...activeItems, ...otherItems];

  // Section label
  if (momItems.length > 0) {
    const evidLabel = document.createElement('div');
    evidLabel.style.cssText = [
      'position:absolute',
      `left:${START_X}px`, `top:${EVIDENCE_TOP - 22}px`,
      'font-family:var(--font-ui,sans-serif)',
      'font-size:8px', 'letter-spacing:0.3em', 'text-transform:uppercase',
      'color:rgba(180,155,90,0.35)',
    ].join(';');
    evidLabel.textContent = 'EVIDENCE';
    canvas.appendChild(evidLabel);
  }

  ordered.forEach((item, i) => {
    const itemX = START_X + i * (ITEM_W + ITEM_GAP);
    const itemY = EVIDENCE_TOP;
    const isActiveItem = !_activeTimelineChar || item.target === _activeTimelineChar;
    const color = isActiveItem ? (MOM_COLORS[item.cat] || '#888') : 'rgba(120,100,60,0.3)';

    const card = document.createElement('div');
    card.id = `board-item-${item.itemId}`;
    card.style.cssText = [
      'position:absolute',
      `left:${itemX}px`, `top:${itemY}px`,
      `width:${ITEM_W}px`,
      'display:flex', 'flex-direction:column', 'align-items:center',
      'z-index:2',
      `transform:rotate(${_stableRotation(item.itemId)}deg)`,
      `opacity:${isActiveItem ? '1' : '0.2'}`,
      'transition:opacity 300ms',
    ].join(';');

    const pin = document.createElement('div');
    pin.style.cssText = [
      'width:8px', 'height:8px', 'border-radius:50%',
      `background:${color}`,
      'box-shadow:0 1px 3px rgba(0,0,0,0.6)',
      'margin-bottom:3px',
    ].join(';');

    // FBI index card — cream/aged paper, ruled lines, handwritten feel
    const rot = _stableRotation(item.itemId);
    const noteCard = document.createElement('div');
    noteCard.style.cssText = [
      `width:${ITEM_W}px`,
      'min-height:90px',
      // Aged paper texture via gradient
      'background:linear-gradient(180deg,#f5eed8 0%,#f0e8cc 100%)',
      // Subtle paper grain
      'background-image:repeating-linear-gradient(transparent,transparent 18px,rgba(160,130,60,0.08) 18px,rgba(160,130,60,0.08) 19px),linear-gradient(180deg,#f5eed8 0%,#f0e8cc 100%)',
      'border:none',
      // Torn-edge shadow bottom
      'box-shadow:1px 2px 0 rgba(0,0,0,0.15),2px 4px 8px rgba(0,0,0,0.55),-1px -1px 0 rgba(200,180,120,0.3)',
      'padding:8px 10px 10px',
      'position:relative',
      'overflow:hidden',
    ].join(';');

    // Red margin line — left edge like a real index card
    const margin = document.createElement('div');
    margin.style.cssText = [
      'position:absolute', 'left:22px', 'top:0', 'bottom:0',
      'width:1px',
      'background:rgba(200,60,60,0.35)',
    ].join(';');
    noteCard.appendChild(margin);

    // MOM category stamp — top right corner, colored dot + tiny label
    const stamp = document.createElement('div');
    stamp.style.cssText = [
      'position:absolute', 'top:5px', 'right:7px',
      'display:flex', 'align-items:center', 'gap:3px',
    ].join(';');
    const stampDot = document.createElement('div');
    stampDot.style.cssText = `width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 3px ${color};flex-shrink:0;`;
    const stampLabel = document.createElement('div');
    stampLabel.style.cssText = 'font-size:6px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(80,50,10,0.5);';
    stampLabel.textContent = (item.cat || '').toUpperCase();
    stamp.appendChild(stampDot);
    stamp.appendChild(stampLabel);
    noteCard.appendChild(stamp);

    // Item name — handwritten-feel font, left of margin line pushed in
    const nameEl = document.createElement('div');
    nameEl.style.cssText = [
      'font-size:10px', 'line-height:1.45',
      'color:#1a1208',
      'font-family:Georgia,serif',
      'font-style:italic',
      'padding-left:28px',  // right of red margin
      'margin-top:2px',
      'padding-right:4px',
      'word-break:break-word',
    ].join(';');
    nameEl.textContent = item.name || item.itemId;
    noteCard.appendChild(nameEl);

    // Case number / ID — bottom left, typewriter feel
    const caseNum = document.createElement('div');
    caseNum.style.cssText = [
      'position:absolute', 'bottom:5px', 'left:26px',
      'font-size:7px', 'letter-spacing:0.1em',
      'color:rgba(80,50,10,0.3)',
      'font-family:monospace',
      'text-transform:uppercase',
    ].join(';');
    caseNum.textContent = item.itemId.replace(/-/g,' ').toUpperCase();
    noteCard.appendChild(caseNum);

    card.appendChild(pin);
    card.appendChild(noteCard);
    canvas.appendChild(card);

    // Register for string drawing
    _nodePositions[`item-${item.itemId}`] = { x: itemX + ITEM_W / 2, y: itemY + 8 };
  });
}
function _addStrings(canvas) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = [
    'position:absolute', 'inset:0',
    `width:${BOARD_W}px`, `height:${BOARD_H}px`,
    'pointer-events:none', 'z-index:1',
    'overflow:visible',
  ].join(';');

  // Character-to-character strings removed

  // MOM item → accused character strings
  const momItems = _getMOMItems();
  momItems.forEach(item => {
    const from = _nodePositions[`item-${item.itemId}`];
    const to   = item.target && _nodePositions[item.target];
    if (!from || !to) return;
    const isActiveStr = !_activeTimelineChar || item.target === _activeTimelineChar;
    const color = isActiveStr ? (MOM_COLORS[item.cat] || '#888') : 'rgba(120,100,60,0.15)';
    _drawString(svg, from.x, from.y, to.x, to.y, color, isActiveStr ? item.cat : null, false);  // arc down
  });

  canvas.appendChild(svg);
}

function _drawString(svg, x1, y1, x2, y2, color, label, arcUp) {
  // FBI corkboard string — arcs UP by default for char-to-char connections
  // to avoid crossing through portrait cards
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const mx = (x1 + x2) / 2;
  // Arc up above portraits (negative = up), proportional to distance
  const arcDir = arcUp === false ? 1 : -1;
  const sag = arcDir * Math.min(80, dist * 0.18 + 20);
  const my = (y1 + y2) / 2 + sag;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('fill', 'none');
  path.setAttribute('opacity', '0.65');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  // Label at midpoint
  if (label) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', mx);
    text.setAttribute('y', my - 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '8');
    text.setAttribute('opacity', '0.7');
    text.setAttribute('letter-spacing', '1');
    text.textContent = label.toUpperCase();
    svg.appendChild(text);
  }
}

// ── GATE MESSAGE ───────────────────────────────────────────
function _updateGateMessage() {
  let msg = document.getElementById('board-gate-msg');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'board-gate-msg';
    msg.style.cssText = [
      'position:fixed', 'bottom:44px', 'left:50%',
      'transform:translateX(-50%)',
      'z-index:10',
      'font-size:9px', 'letter-spacing:0.2em',
      'text-transform:uppercase',
      'pointer-events:none', 'white-space:nowrap',
      'transition:color 400ms, opacity 400ms',
      'opacity:0',
    ].join(';');
    const panel = document.getElementById('board-panel');
    if (panel) panel.appendChild(msg);
  }

  const gs = window.gameState;
  if (!gs) return;
  const se = gs.stage_evidence || {};
  const targets = [se.motive, se.means, se.moment].filter(Boolean);
  if (targets.length < 3) { msg.style.opacity = '0'; return; }
  const allSame = targets.every(t => t === targets[0]);
  if (!allSame) { msg.style.opacity = '0'; return; }

  const target = targets[0];
  const nodes = _getInfoNodes();
  const path = SUSPECT_PATHS[target];
  const timelineComplete = path && path.timeline.every(n => nodes[n]);
  const hasFalseNodes = path && path.false_nodes && path.false_nodes.some(n => nodes[n]);

  if (timelineComplete) {
    msg.textContent = 'Case assembled. Stage open.';
    msg.style.color = 'rgba(201,168,76,0.9)';
  } else if (hasFalseNodes) {
    msg.textContent = 'Case assembled. The timeline requires more investigation.';
    msg.style.color = 'rgba(180,155,90,0.6)';
  } else {
    msg.textContent = 'Case assembled. The timeline is incomplete.';
    msg.style.color = 'rgba(180,155,90,0.6)';
  }
  msg.style.opacity = '1';
}

function _getInfoNodes() {
  // A node is "found" on the board ONLY if:
  // 1. It fired in node_inventory (player got the dialogue), AND
  // 2. The player has written something in the notepad for that character
  //    that contains key words from the node's label.
  //
  // This means the board reflects what the player has recorded — not what
  // fired automatically. Player must capture it in the notepad.

  const combined = {};

  try {
    const ni = window.gameState && window.gameState.node_inventory;
    if (!ni) return combined;

    // Get all notepad text per character
    const notepad = (window.gameState && window.gameState.notepad) || {};
    const notepadTextByChar = {};
    Object.entries(notepad).forEach(([charId, notes]) => {
      if (!Array.isArray(notes)) return;
      notepadTextByChar[charId] = notes.map(n => (n.text || '').toLowerCase()).join(' ');
    });

    // Full notepad text across all chars
    const allNotepadText = Object.values(notepadTextByChar).join(' ');

    // For each node in NODE_INFO — check if node fired AND notepad has evidence
    Object.keys(NODE_INFO).forEach(nodeId => {
      if (!ni[nodeId]) return; // must have fired in dialogue

      const info = NODE_INFO[nodeId];
      const label = (info.label || '').toLowerCase();
      const source = (info.source || '').toLowerCase();

      // Extract key words from label — times, names, significant nouns
      // Check if any key words appear in the player's notepad
      const keyWords = _extractNodeKeywords(label, source);
      const captured = keyWords.some(kw => allNotepadText.includes(kw));

      if (captured) {
        combined[nodeId] = true;
      }
    });

    // Also check behavioral logger NIR
    try {
      const nir = JSON.parse(localStorage.getItem('nocturne_nir') || '{}');
      const nodes = nir.cases && nir.cases.ep1 &&
                    nir.cases.ep1.behavioral_log &&
                    nir.cases.ep1.behavioral_log.information_nodes;
      if (nodes) {
        Object.keys(nodes).forEach(nodeId => {
          if (combined[nodeId]) return; // already found via notepad
          if (!NODE_INFO[nodeId]) return;
          const info = NODE_INFO[nodeId];
          const label = (info.label || '').toLowerCase();
          const source = (info.source || '').toLowerCase();
          const keyWords = _extractNodeKeywords(label, source);
          const captured = keyWords.some(kw => allNotepadText.includes(kw));
          if (captured) combined[nodeId] = true;
        });
      }
    } catch(e) {}

  } catch(e) {}
  return combined;
}

function _extractNodeKeywords(label, source) {
  // Extract meaningful keywords from a node label that the player
  // would naturally write when taking notes on that testimony.
  const keywords = [];

  // Times — any time reference
  const times = label.match(/\d+:\d+|six-fifteen|seven forty|eight o'clock|6:15|7:45|7:48|8:01/gi);
  if (times) times.forEach(t => keywords.push(t.toLowerCase()));

  // Character names
  ['surgeon','crane','greaves','northcott','steward','baron','ashworth','vivienne','hatch',
   'pemberton','curator','voss','uninvited'].forEach(name => {
    if (label.includes(name) || source.includes(name)) keywords.push(name);
  });

  // Key nouns — 4+ letter words that are specific
  const words = label.split(/\W+/).filter(w => w.length >= 4);
  const stopWords = new Set(['that','this','with','from','have','been','were','they','them',
    'their','when','what','where','also','into','then','than','more','some','only','very',
    'just','over','after','before','found','said','came','went','left','does','does',
    'tells','named','shows','knows','room','floor','time','both','each','once','back']);
  words.forEach(w => {
    if (!stopWords.has(w.toLowerCase())) keywords.push(w.toLowerCase());
  });

  return [...new Set(keywords)].filter(k => k.length >= 3);
}

// ── MOM CONVERGENCE ────────────────────────────────────────
function _checkMOMConvergence(canvas) {
  const gs = window.gameState;
  if (!gs) return;

  const se = gs.stage_evidence || {};
  const targets = [se.motive, se.means, se.moment].filter(Boolean);
  if (targets.length < 3) return;

  const allSame = targets.every(t => t === targets[0]);
  if (!allSame) return;

  const target = targets[0];
  const pos = _nodePositions[target];
  if (!pos) return;

  // Glow ring around the accused portrait
  const glow = document.createElement('div');
  glow.style.cssText = [
    'position:absolute',
    `left:${pos.x - 70}px`,
    `top:${pos.y - 80}px`,
    'width:140px', 'height:140px',
    'border-radius:4px',
    'box-shadow:0 0 0 2px rgba(201,168,76,0.8),0 0 30px rgba(201,168,76,0.4),0 0 60px rgba(201,168,76,0.15)',
    'pointer-events:none', 'z-index:5',
    'animation:board-glow-pulse 2s ease-in-out infinite',
  ].join(';');
  canvas.appendChild(glow);

  // Convergence label
  const label = document.createElement('div');
  label.style.cssText = [
    'position:absolute',
    `left:${pos.x - 80}px`,
    `top:${pos.y + 75}px`,
    'width:160px', 'text-align:center',
    'font-size:7px', 'letter-spacing:0.25em',
    'color:rgba(201,168,76,0.9)', 'text-transform:uppercase',
    'pointer-events:none', 'z-index:5',
  ].join(';');
  // Show verdict depth if known
  const depth = window.gameState && window.gameState._verdictDepth;
  if (depth === 'deep_human' || depth === 'deep_political' || depth === 'deepest') {
    label.textContent = 'Case Complete — Further depth available';
  } else {
    label.textContent = 'Case Complete';
  }
  canvas.appendChild(label);
}

// ── TOUCH / MOUSE INTERACTION ──────────────────────────────
function _initInteraction() {
  const panel = document.getElementById('board-panel');
  if (!panel) return;

  // Mouse drag
  panel.addEventListener('mousedown', e => {
    if (e.target.closest('#board-close-btn')) return;
    _dragging   = true;
    _dragStartX = e.clientX - _panX;
    _dragStartY = e.clientY - _panY;
    panel.style.cursor = 'grabbing';
  });

  panel.addEventListener('mousemove', e => {
    if (!_dragging) return;
    _panX = e.clientX - _dragStartX;
    _panY = e.clientY - _dragStartY;
    _applyTransform();
  });

  panel.addEventListener('mouseup', () => {
    _dragging = false;
    panel.style.cursor = 'grab';
  });

  // Touch drag + pinch zoom
  panel.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      _dragging   = true;
      _dragStartX = e.touches[0].clientX - _panX;
      _dragStartY = e.touches[0].clientY - _panY;
    } else if (e.touches.length === 2) {
      _dragging  = false;
      _pinchDist = _getTouchDist(e.touches);
      _scaleStart = _scale;
    }
  }, { passive: true });

  panel.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && _dragging) {
      _panX = e.touches[0].clientX - _dragStartX;
      _panY = e.touches[0].clientY - _dragStartY;
      _applyTransform();
    } else if (e.touches.length === 2 && _pinchDist !== null) {
      const dist = _getTouchDist(e.touches);
      const ratio = dist / _pinchDist;
      _scale = Math.min(2.0, Math.max(0.35, _scaleStart * ratio));
      _applyTransform();
    }
  }, { passive: true });

  panel.addEventListener('touchend', () => {
    _dragging  = false;
    _pinchDist = null;
  }, { passive: true });

  // Mouse wheel zoom
  panel.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    _scale = Math.min(2.0, Math.max(0.35, _scale * delta));
    _applyTransform();
  }, { passive: false });
}

function _getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── BUILD PANEL ────────────────────────────────────────────
function _buildBoardPanel() {
  if (document.getElementById('board-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'board-panel';
  panel.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9998',
    'display:none', 'overflow:hidden',
    'opacity:0', 'transition:opacity 300ms ease',
    'cursor:grab',
    'pointer-events:none',
  ].join(';');

  // Fix background-image as a single value
  panel.style.background = '#3d2e1a';
  panel.style.backgroundImage = [
    'radial-gradient(ellipse at 20% 30%, rgba(160,120,60,0.25) 0%, transparent 50%)',
    'radial-gradient(ellipse at 80% 70%, rgba(100,70,30,0.2) 0%, transparent 50%)',
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 5px)',
  ].join(',');

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.id = 'board-close-btn';
  closeBtn.style.cssText = [
    'position:fixed', 'top:16px', 'right:16px',
    'z-index:10',
    'background:rgba(20,14,6,0.85)',
    'border:1px solid rgba(180,155,90,0.4)',
    'border-radius:4px',
    'color:#c9a84c', 'font-size:20px',
    'cursor:pointer', 'padding:4px 12px 6px',
    'line-height:1',
  ].join(';');
  closeBtn.textContent = '×';
  closeBtn.onclick = closeBoard;

  // Notepad shortcut button
  const notepadBtn = document.createElement('button');
  notepadBtn.id = 'board-notepad-btn';
  notepadBtn.style.cssText = [
    'position:fixed', 'top:16px', 'right:64px',
    'z-index:10',
    'background:rgba(20,14,6,0.85)',
    'border:1px solid rgba(180,155,90,0.4)',
    'border-radius:4px',
    'color:#c9a84c',
    'font-size:9px', 'letter-spacing:0.2em',
    'text-transform:uppercase',
    'cursor:pointer', 'padding:7px 12px',
    'line-height:1',
  ].join(';');
  notepadBtn.textContent = 'NOTES';
  notepadBtn.onclick = () => {
    closeBoard();
    if (typeof openNotepad === 'function') openNotepad();
  };

  // Header label
  const header = document.createElement('div');
  header.style.cssText = [
    'position:fixed', 'top:20px', 'left:50%',
    'transform:translateX(-50%)',
    'z-index:10',
    'font-size:9px', 'letter-spacing:0.32em',
    'color:rgba(201,168,76,0.6)', 'text-transform:uppercase',
    'pointer-events:none',
  ].join(';');
  header.textContent = 'INVESTIGATION BOARD';

  // Hint
  const hint = document.createElement('div');
  hint.style.cssText = [
    'position:fixed', 'bottom:20px', 'left:50%',
    'transform:translateX(-50%)',
    'z-index:10',
    'font-size:8px', 'letter-spacing:0.2em',
    'color:rgba(180,155,90,0.35)', 'text-transform:uppercase',
    'pointer-events:none', 'white-space:nowrap',
  ].join(';');
  hint.textContent = 'DRAG TO NAVIGATE · PINCH TO ZOOM';

  // Canvas — the actual board
  const canvas = document.createElement('div');
  canvas.id = 'board-canvas';
  canvas.style.cssText = [
    'position:absolute',
    `width:${BOARD_W}px`, `height:${BOARD_H}px`,
    'transform-origin:0 0',
    'will-change:transform',
  ].join(';');

  panel.appendChild(canvas);
  panel.appendChild(closeBtn);
  panel.appendChild(notepadBtn);
  panel.appendChild(header);
  panel.appendChild(hint);

  // Inject keyframes
  if (!document.getElementById('board-styles')) {
    const style = document.createElement('style');
    style.id = 'board-styles';
    style.textContent = `
      #board-panel.visible { opacity: 1 !important; }
      @keyframes board-glow-pulse {
        0%, 100% { box-shadow: 0 0 0 2px rgba(201,168,76,0.8), 0 0 30px rgba(201,168,76,0.4), 0 0 60px rgba(201,168,76,0.15); }
        50%       { box-shadow: 0 0 0 2px rgba(201,168,76,1.0), 0 0 50px rgba(201,168,76,0.6), 0 0 90px rgba(201,168,76,0.25); }
      }
    `;
    document.head.appendChild(style);
  }

  const appEl = document.getElementById('app') || document.body;
  appEl.appendChild(panel);

  _initInteraction();
}

// ── REFRESH — called when gameState changes ─────────────────
function refreshBoard() {
  if (!_boardOpen) return;
  _buildBoard();
}

// ── INIT ───────────────────────────────────────────────────
// ── TIMELINE MAP ──────────────────────────────────────────────────────────────
// Replica of the in-game estate map on the cork board.
// Shows where each suspect has been placed by discovered nodes.
// Scrollable time scrubber — 6:00PM to 8:30PM.
// Only shows what the player has earned through dialogue.

const TIMELINE_MAP_ROOMS = {
  'foyer':                  { x: 144, y: 18,  w: 72,  h: 38 },
  'gallery':                { x: 80,  y: 88,  w: 80,  h: 38 },
  'study':                  { x: 200, y: 88,  w: 80,  h: 38 },
  'archive-path':           { x: 80,  y: 148, w: 80,  h: 38 },
  'terrace':                { x: 138, y: 208, w: 76,  h: 34 },
  'groundskeeper-cottage':  { x: 54,  y: 208, w: 76,  h: 34 },
  'maids-quarters':         { x: 230, y: 208, w: 76,  h: 34 },
  'ballroom':               { x: 112, y: 268, w: 136, h: 48 },
  'antechamber':            { x: 36,  y: 348, w: 80,  h: 38 },
  'stage':                  { x: 144, y: 348, w: 72,  h: 38 },
  'library':                { x: 244, y: 348, w: 80,  h: 38 },
  'physicians':             { x: 36,  y: 418, w: 80,  h: 38 },
  'smoking':                { x: 144, y: 418, w: 72,  h: 38 },
  'vault':                  { x: 144, y: 478, w: 72,  h: 38 },
  'balcony':                { x: 200, y: 148, w: 80,  h: 38 },
};

// Node → { suspect, room, timeMin (minutes from 6:00PM), verified }
// timeMin: 6:00=0, 6:15=15, 6:30=30, 7:00=60, 7:45=105, 7:48=108, 7:52=112, 7:54=114, 7:58=118, 8:00=120, 8:01=121
// verified: true = confirmed position, false = claimed/lie
const TIMELINE_PLACEMENTS = [
  // SURGEON
  { node: 'surgeon_committed_745_south_corridor', suspect: 'surgeon',        room: 'gallery',    timeMin: 105, verified: false },
  { node: 'surgeon_admits_balcony_level',          suspect: 'surgeon',        room: 'balcony',    timeMin: 75,  verified: true  },
  { node: 'greaves_maskless_witness',              suspect: 'surgeon',        room: 'terrace',    timeMin: 108, verified: true  },
  { node: 'surgeon_contact_refused',               suspect: 'surgeon',        room: 'physicians', timeMin: 121, verified: true  },

  // CRANE
  { node: 'crane_first_visit_ashworth_alive',      suspect: 'crane',          room: 'study',      timeMin: 15,  verified: true  },
  { node: 'crane_floor_clear_615',                 suspect: 'crane',          room: 'physicians', timeMin: 15,  verified: true  },
  { node: 'crane_said_nothing_after_discovery',    suspect: 'crane',          room: 'balcony',    timeMin: 121, verified: true  },
  { node: 'crane_two_reasons',                     suspect: 'crane',          room: 'physicians', timeMin: 125, verified: true  },

  // PEMBERTON-HALE
  { node: 'ph_false_timeline_ballroom',            suspect: 'pemberton-hale', room: 'ballroom',   timeMin: 60,  verified: false },
  { node: 'ph_altered_register_for_clause_not_self', suspect: 'pemberton-hale', room: 'antechamber', timeMin: 90, verified: true },
  { node: 'ph_steward_corridor',                   suspect: 'pemberton-hale', room: 'antechamber', timeMin: 118, verified: true },

  // STEWARD
  { node: 'steward_false_timeline_gallery',        suspect: 'steward',        room: 'gallery',    timeMin: 118, verified: false },
  { node: 'steward_corridor_758',                  suspect: 'steward',        room: 'gallery',    timeMin: 118, verified: true  },
  { node: 'steward_route_past_physicians_room',    suspect: 'steward',        room: 'physicians', timeMin: 115, verified: true  },

  // BARON
  { node: 'baron_false_timeline_smoking_room',     suspect: 'baron',          room: 'smoking',    timeMin: 105, verified: false },
  { node: 'baron_615_observation',                 suspect: 'baron',          room: 'study',      timeMin: 15,  verified: true  },
  { node: 'baron_crane_visit_630',                 suspect: 'baron',          room: 'smoking',    timeMin: 30,  verified: true  },
  { node: 'baron_compact_arrangement',             suspect: 'baron',          room: 'smoking',    timeMin: 60,  verified: true  },

  // LADY ASHWORTH
  { node: 'ashworth_false_timeline_arrived_seven', suspect: 'ashworth',       room: 'ballroom',   timeMin: 60,  verified: false },
  { node: 'ashworth_garden_740',                   suspect: 'ashworth',       room: 'terrace',    timeMin: 100, verified: true  },
  { node: 'lady_ashworth_wrong_mask_752',          suspect: 'ashworth',       room: 'ballroom',   timeMin: 112, verified: true  },
  { node: 'ashworth_planned_revelation',           suspect: 'ashworth',       room: 'study',      timeMin: 80,  verified: true  },

  // NORTHCOTT
  { node: 'northcott_false_timeline_foyer',        suspect: 'northcott',      room: 'foyer',      timeMin: 105, verified: false },
  { node: 'northcott_placed_by_ashworth',          suspect: 'northcott',      room: 'foyer',      timeMin: 0,   verified: true  },
  { node: 'northcott_two_absences',                suspect: 'northcott',      room: 'ballroom',   timeMin: 75,  verified: true  },
  { node: 'northcott_wrong_mask_752',              suspect: 'northcott',       room: 'ballroom',  timeMin: 112, verified: true  },

  // GREAVES (witness)
  { node: 'greaves_maskless_witness',              suspect: 'greaves',        room: 'gallery',    timeMin: 108, verified: true  },

  // HATCH (witness)
  { node: 'vivienne_hatch_cross_fired',            suspect: 'hatch',          room: 'groundskeeper-cottage', timeMin: 108, verified: true },
];

// Suspect colors for pins
const SUSPECT_PIN_COLORS = {
  'surgeon':        '#cc3333',
  'crane':          '#6a8fa8',
  'pemberton-hale': '#c9a84c',
  'steward':        '#8a9a6a',
  'baron':          '#a06a3a',
  'ashworth':       '#9a6a8a',
  'northcott':      '#6a7a8a',
  'greaves':        '#8a8070',
  'hatch':          '#7a6a50',
};

// Convert minutes from 6:00PM to display string
function _timeLabel(mins) {
  const h = Math.floor(mins / 60) + 18; // 18 = 6PM in 24h
  const m = mins % 60;
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2,'0')} PM`;
}

function _addTimelineMap(canvas) {
  const ni = (window.gameState && window.gameState.node_inventory) || {};

  // Check if any notepad entries exist at all
  const notePadEntries = _getTimelineFromNotepad();
  // Always render the map — pins appear as notepad is filled in

  // ── Layout ────────────────────────────────────────────────
  const MAP_X     = 60;    // left edge of map on canvas
  const MAP_Y     = 520;   // top of map
  const MAP_SCALE = 1.6;   // scale up from 360 viewBox
  const MAP_W     = 360 * MAP_SCALE;
  const MAP_H     = 640 * MAP_SCALE;

  const SCRUB_Y   = MAP_Y + MAP_H + 32;
  const SCRUB_X   = MAP_X;
  const SCRUB_W   = MAP_W;

  const TIME_MIN  = 0;    // 6:00 PM
  const TIME_MAX  = 150;  // 8:30 PM

  // State
  let currentTime = 105; // default to 7:45 — the key window

  // ── Section label ─────────────────────────────────────────
  const mapLabel = document.createElement('div');
  mapLabel.style.cssText = [
    'position:absolute',
    `left:${MAP_X}px`, `top:${MAP_Y - 22}px`,
    'font-family:var(--font-ui,sans-serif)',
    'font-size:8px', 'letter-spacing:0.3em', 'text-transform:uppercase',
    'color:rgba(180,155,90,0.35)',
  ].join(';');
  mapLabel.textContent = 'WHEREABOUTS';
  canvas.appendChild(mapLabel);

  // ── Map SVG — rooms ───────────────────────────────────────
  const mapSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mapSvg.style.cssText = [
    'position:absolute',
    `left:${MAP_X}px`, `top:${MAP_Y}px`,
    `width:${MAP_W}px`, `height:${MAP_H}px`,
  ].join(';');
  mapSvg.setAttribute('viewBox', '0 0 360 640');

  // Draw room outlines
  Object.entries(TIMELINE_MAP_ROOMS).forEach(([roomId, r]) => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', r.x);
    rect.setAttribute('y', r.y);
    rect.setAttribute('width', r.w);
    rect.setAttribute('height', r.h);
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', 'rgba(20,16,8,0.6)');
    rect.setAttribute('stroke', 'rgba(180,155,90,0.2)');
    rect.setAttribute('stroke-width', '1');
    mapSvg.appendChild(rect);

    // Room label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', r.x + r.w / 2);
    text.setAttribute('y', r.y + r.h / 2 + 3);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'rgba(180,155,90,0.25)');
    text.setAttribute('font-size', '6');
    text.setAttribute('font-family', 'var(--font-ui,sans-serif)');
    text.setAttribute('letter-spacing', '0.5');
    text.textContent = roomId.replace(/-/g,' ').toUpperCase();
    mapSvg.appendChild(text);
  });

  // Pin group — updated on scrub
  const pinGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pinGroup.id = 'timeline-map-pins';
  mapSvg.appendChild(pinGroup);

  canvas.appendChild(mapSvg);

  // ── Time scrubber ─────────────────────────────────────────
  const scrubContainer = document.createElement('div');
  scrubContainer.style.cssText = [
    'position:absolute',
    `left:${SCRUB_X}px`, `top:${SCRUB_Y}px`,
    `width:${SCRUB_W}px`,
  ].join(';');

  // Time label
  const timeLabel = document.createElement('div');
  timeLabel.style.cssText = [
    'font-family:var(--font-ui,sans-serif)',
    'font-size:9px', 'letter-spacing:0.25em', 'text-transform:uppercase',
    'color:rgba(201,168,76,0.7)',
    'text-align:center', 'margin-bottom:8px',
  ].join(';');
  timeLabel.textContent = _timeLabel(currentTime);
  scrubContainer.appendChild(timeLabel);

  // Scrubber track
  const track = document.createElement('div');
  track.style.cssText = [
    'position:relative', 'height:2px',
    'background:rgba(180,155,90,0.15)',
    'border-radius:1px', 'cursor:pointer',
  ].join(';');

  // Key time markers
  const KEY_TIMES = [0, 15, 30, 60, 75, 105, 108, 112, 118, 120, 121, 150];
  KEY_TIMES.forEach(t => {
    const pct = (t - TIME_MIN) / (TIME_MAX - TIME_MIN) * 100;
    const marker = document.createElement('div');
    marker.style.cssText = [
      'position:absolute',
      `left:${pct}%`, 'top:-3px',
      'width:1px', 'height:8px',
      'background:rgba(180,155,90,0.25)',
      'transform:translateX(-50%)',
    ].join(';');
    track.appendChild(marker);

    // Label for key times
    if ([0, 60, 105, 108, 120, 150].includes(t)) {
      const lbl = document.createElement('div');
      lbl.style.cssText = [
        'position:absolute',
        `left:${pct}%`, 'top:10px',
        'font-family:var(--font-ui,sans-serif)',
        'font-size:6px', 'letter-spacing:0.1em',
        'color:rgba(180,155,90,0.3)',
        'transform:translateX(-50%)',
        'white-space:nowrap',
      ].join(';');
      lbl.textContent = _timeLabel(t);
      track.appendChild(lbl);
    }
  });

  // Scrubber handle
  const handle = document.createElement('div');
  const initPct = (currentTime - TIME_MIN) / (TIME_MAX - TIME_MIN) * 100;
  handle.style.cssText = [
    'position:absolute',
    `left:${initPct}%`, 'top:-5px',
    'width:12px', 'height:12px',
    'border-radius:50%',
    'background:rgba(201,168,76,0.9)',
    'box-shadow:0 0 6px rgba(201,168,76,0.4)',
    'transform:translateX(-50%)',
    'cursor:grab', 'z-index:2',
  ].join(';');
  track.appendChild(handle);
  scrubContainer.appendChild(track);
  canvas.appendChild(scrubContainer);

  // ── Pin render function — driven by notepad captures ────────
  // Player must write the time in the notepad to place the pin.
  // We match notepad-captured times against TIMELINE_PLACEMENTS.
  // Only placements whose time matches a notepad entry AND whose
  // node is in node_inventory (confirmed through dialogue) get a solid pin.
  // Notepad time only (no node yet) = dashed unverified pin.

  function timeToMins(timeStr) {
    const clean = timeStr.replace(/\s/g,'').toUpperCase();
    const m = clean.match(/^(\d+):(\d+)(AM|PM)$/);
    if (!m) return -1;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (m[3]==='PM' && h!==12) h+=12;
    if (m[3]==='AM' && h===12) h=0;
    return (h-18)*60 + min; // minutes from 6PM
  }

  function renderPins(timeMin) {
    pinGroup.innerHTML = '';

    // Get notepad-captured times
    const noteTimes = _getTimelineFromNotepad(); // [{time, charId, context}]
    const ni = (window.gameState && window.gameState.node_inventory) || {};

    // Build set of notepad-captured minutes
    const capturedMins = new Set();
    noteTimes.forEach(e => {
      const m = timeToMins(e.time);
      if (m >= 0) capturedMins.add(m);
    });

    // For each placement — only show if notepad has captured a time within ±8 min
    const roomOccupancy = {};

    TIMELINE_PLACEMENTS.forEach(p => {
      // Must have notepad entry near this time
      let notepadHit = false;
      capturedMins.forEach(capturedMin => {
        if (Math.abs(capturedMin - p.timeMin) <= 8) notepadHit = true;
      });
      if (!notepadHit) return;

      // Must be near the scrubber time
      if (Math.abs(p.timeMin - timeMin) > 15) return;

      // verified = notepad captured AND node confirmed in dialogue
      const verified = !!ni[p.node];

      if (!roomOccupancy[p.room]) roomOccupancy[p.room] = [];
      roomOccupancy[p.room].push({ ...p, verified });
    });

    Object.entries(roomOccupancy).forEach(([roomId, placements]) => {
      const room = TIMELINE_MAP_ROOMS[roomId];
      if (!room) return;
      placements.forEach((p, i) => {
        const color = SUSPECT_PIN_COLORS[p.suspect] || '#888';
        const cx = room.x + (room.w / (placements.length + 1)) * (i + 1);
        const cy = room.y + room.h / 2;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', p.verified ? color : 'none');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('opacity', p.verified ? '0.9' : '0.4');
        pinGroup.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', p.verified ? 'rgba(10,8,4,0.9)' : color);
        text.setAttribute('font-size', '5');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-family', 'var(--font-ui,sans-serif)');
        text.textContent = _name(p.suspect).split(' ').pop()[0].toUpperCase();
        pinGroup.appendChild(text);

        if (!p.verified) {
          const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', '7');
          ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', color);
          ring.setAttribute('stroke-width', '1'); ring.setAttribute('stroke-dasharray', '2,2');
          ring.setAttribute('opacity', '0.35');
          pinGroup.appendChild(ring);
        }
      });
    });
  }

  renderPins(currentTime);

  // ── Scrubber interaction ──────────────────────────────────
  let dragging = false;

  function scrubTo(clientX) {
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    currentTime = Math.round(TIME_MIN + pct * (TIME_MAX - TIME_MIN));
    handle.style.left = (pct * 100) + '%';
    timeLabel.textContent = _timeLabel(currentTime);
    renderPins(currentTime);
  }

  handle.addEventListener('pointerdown', e => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    handle.style.cursor = 'grabbing';
  });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    scrubTo(e.clientX);
  });
  handle.addEventListener('pointerup', () => {
    dragging = false;
    handle.style.cursor = 'grab';
  });
  track.addEventListener('click', e => scrubTo(e.clientX));
}

function initBoard() {
  _buildBoardPanel();
  _injectBoardHudIcon();

  // Refresh board on key state changes
  if (window.NocturneEngine) {
    NocturneEngine.on('itemCollected',     refreshBoard);
    NocturneEngine.on('itemDropped',       refreshBoard);
    NocturneEngine.on('inventoryChanged',  refreshBoard);
    NocturneEngine.on('stageChanged',      () => {
      if (_boardOpen) {
        _buildBoard();           // full rebuild on stage change
        _updateGateMessage();    // ensure gate message reflects new evidence
      }
    });
    NocturneEngine.on('nodeMarked',        refreshBoard);
    NocturneEngine.on('questionAnswered',  refreshBoard);
    NocturneEngine.on('crossComplete',     refreshBoard);
  }
}

// ── HUD ICON ──────────────────────────────────────────────
function _injectBoardHudIcon() {
  const _doInject = () => {
    if (document.getElementById('board-hud-icon')) return;

    // Find the notepad icon and insert after it
    const notepadIcon = document.getElementById('np-hud-icon');
    if (!notepadIcon) return;

    const btn = document.createElement('div');
    btn.id = 'board-hud-icon';
    btn.title = 'Investigation Board';
    btn.style.cssText = [
      'display:flex', 'align-items:center', 'justify-content:center',
      'width:32px', 'height:32px',
      'color:var(--cream-dim,#b8a98a)',
      'cursor:pointer', 'opacity:0.7',
      'transition:opacity 200ms,color 200ms',
      'flex-shrink:0', 'margin-left:4px',
    ].join(';');

    btn.innerHTML = `<svg width="16" height="15" viewBox="0 0 16 15" fill="none">
      <rect x="1" y="1" width="14" height="13" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/>
      <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" stroke-width="0.8"/>
      <circle cx="4" cy="3" r="0.8" fill="currentColor"/>
      <circle cx="7" cy="3" r="0.8" fill="currentColor"/>
      <circle cx="10" cy="3" r="0.8" fill="currentColor"/>
      <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="0.7" stroke-linecap="round"/>
      <line x1="4" y1="10.5" x2="9" y2="10.5" stroke="currentColor" stroke-width="0.7" stroke-linecap="round"/>
    </svg>`;

    btn.addEventListener('mouseover',  () => { btn.style.opacity = '1'; btn.style.color = 'var(--gold,#c9a84c)'; });
    btn.addEventListener('mouseout',   () => { btn.style.opacity = '0.7'; btn.style.color = 'var(--cream-dim,#b8a98a)'; });
    btn.addEventListener('click', openBoard);

    notepadIcon.insertAdjacentElement('afterend', btn);
  };

  _doInject();
  if (window.NocturneEngine) NocturneEngine.on('roomEntered', _doInject);
  setTimeout(_doInject, 500);
  setTimeout(_doInject, 1500);
  setTimeout(_doInject, 3000);
}

// ── EXPOSE ─────────────────────────────────────────────────
window.initBoard    = initBoard;
window.openBoard    = openBoard;
window.closeBoard   = closeBoard;
window.refreshBoard = refreshBoard;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoard);
} else {
  initBoard();
}
