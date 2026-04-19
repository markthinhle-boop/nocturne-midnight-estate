// ============================================================
// NOCTURNE — compact.js
// 10 Compact rooms. Archivist at piano. Chopin on first visit.
// register-licensing-extract ONLY after bond-reconstruction solved.
// KB v4.0 — new plot locked March 2026
// The Compact: shadow org descended from Brother Caspian's eleven.
// Has been keeping the Black Register for 40 years.
// The Sovereign ordered Isabelle Voss executed 43 years ago
// based on fabricated evidence from The Correspondent (Seal asset).
// Both organizations killed their own innocent members.
// The Seal engineered it. Neither organization ever knew.
// Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

function initCompact() {
  NocturneEngine.on('compactUnlocked', ({ entrance }) => {
    // All 10 rooms already opened by arriveAtCompact() in engine.js
  });

}

// Compact room descriptions — KB v4.0 locked
// Voice rule applies: declarative, no source cited, trust the reader.
// Compact warmth rule: never add decay, deflection, or composure mechanics.
const COMPACT_ROOM_DESCRIPTIONS = {
  "c1-arrival":    "A list of names. Ashworth's is at the bottom. Tonight's date is written at the top in a hand that knew the date before it was known by the Estate. A grand piano in the centre of the room. The Archivist is playing. They play when they are nervous. They will not say they are nervous.",
  "c3-original":   "He has been in this room every day for thirty-one years. Not out of habit. Out of something that stopped having a name after the first decade.",
  "c5-correspondence": "Forty years of letters. Ashworth's stop after year five. The gap where they should be is filled with copies of his Estate correspondence — the Compact's version of the same period, showing what the official record omitted. Someone spent years making the absence visible.",
  "c6-tunnel":     "Old stone. A lantern on a hook. The passage opens here into something that was built to be a room and never named as one.",
  "c7-study":      "The Surgeon's desk. Documents laid out in order. He has gone to visit his colleague again.",
  "c8-gallery":    "Thirty-one testimonies framed like portraits. No names on any of them. Sources redacted. The Heir knows every account by its date. They can recite the fourth testimony from memory. They have not decided whether that makes what happened necessary or whether it makes them complicit in deciding it was necessary.",
};

window.initCompact = initCompact;
window.COMPACT_ROOM_DESCRIPTIONS = COMPACT_ROOM_DESCRIPTIONS;
