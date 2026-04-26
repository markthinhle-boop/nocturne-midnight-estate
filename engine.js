// ============================================================
// NOCTURNE: MIDNIGHT ESTATE — engine.js
// KB v4.0 Final · New plot locked March 2026
// Nocturne Studios LLC · MMXXVI
// FIXED TRUTH: Killer = Surgeon (Dr. Edmund Voss, Seal operative)
// Ashworth was murdered. He did NOT choose his death.
// Callum Grey = unwitting Seal asset. Magnus Fell = The Architect.
// Train → Gate → Foyer: LOCKED. Do not modify.
// ============================================================

'use strict';

// ── CONFIG ─────────────────────────────────────────────────
const NocturneConfig = {
  PRICE_ESTATE: 3.99,
  APP_ID: "com.nocturnostudios.midnightestate",
  VERSION: "1.0.0",
};
// PRICE_SCENARIO does not exist. Never add it.

// ASSET_BASE — hardcoded for dev server subpath
// Dev: localhost:3001/nocturne-midnight-estate/ → assets at /nocturne-midnight-estate/assets/
// Production: update to './' or '/' before build
const ASSET_BASE = "/nocturne-midnight-estate/assets/";

// ── FIXED TRUTH ────────────────────────────────────────────
// KB v4.0 — new plot locked March 2026
// Killer: The Surgeon — Dr. Edmund Voss. Seal operative embedded in Compact 4 years.
// Murder: Physical push from balcony at 7:45PM pre-assembly.
//         Body moved within Ballroom to lectern. Hand placed deliberately pointing at Register.
//         Surgeon's mask fell on balcony. He retrieved spare from room. Rejoined assembly.
// Ashworth intent: To REVEAL the manufactured betrayal at the Rite. NOT to die.
//                  He did not choose his death. He did not know the Surgeon was
//                  in the building. He was killed before he could speak.
// Player role: Callum Grey — unwitting Seal asset. Recruited by Magnus Fell
//              through the Uninvited. Investigator positioned to be managed.
// The Seal: The controlling organization above both Estate and Compact.
//           Led by Magnus Fell — The Architect. 700 years of unbroken succession.
//           Never acts directly. Creates conditions. Lets human nature do the rest.
const FIXED_TRUTH = {
  killer: "surgeon",
  player_role: "unwitting-seal-asset", // NOT courier — Callum is an investigator, not a delivery mechanism
  ashworth_choice: false, // Ashworth did NOT choose his death. Old plot. Locked out.
  ashworth_intent: "revelation", // He intended to reveal the manufactured betrayal
  seal_operative: true, // The Surgeon is a Seal operative
  seal_leader: "magnus-fell", // The Architect
};

// ── ACCUSABLE CHARACTERS ───────────────────────────────────
const ACCUSABLE_CHARACTERS = [
  "pemberton-hale", "steward", "crane",
  "baron", "surgeon", "northcott", "ashworth"
];

// ── GAME SETTINGS ──────────────────────────────────────────
const gameSettings = {
  rank: "envoy",       // aspirant | envoy | cavalier
  difficulty: "discerning", // observant | discerning | ruthless
  hapticsEnabled: false,
  paidTierUnlocked: false,
};

// ── GAMESTATE ──────────────────────────────────────────────
const gameState = {
  // TOKEN: NOT in foyer or gallery. Found on ballroom floor near body.
  // DO NOT seed ashworth-seal here. ballroom ashworth-seal-obj is the pickup.
  inventory: [],
  dropped_items: {},       // roomId → [itemIds]
  selectedItem: null,
  currentRoom: "foyer",
  paidTierUnlocked: false,
  prologueActive: false,    // PROLOGUE — true from train end until post-Hale paywall clears
  tunnelFound: false,
  tunnelEntranceUsed: null, // "hedge" | "cellar" | "both"
  compactAccessible: false,
  compactEvidenceFound: false,
  compactCaseAssembled: false,
  sealRecordFound: false,
  vaultDoorOpen: false,
  vaultOpen: false,
  hedgeGapFound: false,
  hedgeGapItems: 0,
  investigation_closed: false,

  // Room state
  rooms: {
    // ── TRAIN SEQUENCE (pre-Estate) ──
    "train-compartment": { state: "undiscovered", completed: false },
    "train-dining":      { state: "undiscovered", completed: false },
    "train-rear":        { state: "undiscovered", completed: false },
    // ── ESTATE ──
    "foyer":           { state: "visited",      completed: false },
    "gallery":         { state: "undiscovered",  completed: false },
    "study":           { state: "undiscovered",  completed: false },
    "archive-path":    { state: "undiscovered",  completed: false },
    "balcony":         { state: "undiscovered",  completed: false },
    "terrace":         { state: "undiscovered",  completed: false },
    "ballroom":        { state: "undiscovered",  completed: false },
    "antechamber":     { state: "undiscovered",  completed: false },
    "stage":           { state: "undiscovered",  completed: false },
    "library":         { state: "undiscovered",  completed: false },
    "physicians":      { state: "undiscovered",  completed: false },
    "smoking":         { state: "undiscovered",  completed: false },
    "vault":           { state: "undiscovered",  completed: false },
    "wine-cellar":     { state: "undiscovered",  completed: false },
    "tunnel-passage":  { state: "undiscovered",  completed: false },
    "maids-quarters":  { state: "undiscovered",  completed: false },
    "groundskeeper-cottage": { state: "undiscovered", completed: false },
    // ── EAST WING (past study) ──
    "map-room":        { state: "undiscovered",  completed: false },
    "dining-room":     { state: "undiscovered",  completed: false },
    "trophy-room":     { state: "undiscovered",  completed: false },
    "billiard-room":   { state: "undiscovered",  completed: false },
    "weapons-room":    { state: "undiscovered",  completed: false },
    "conservatory":    { state: "undiscovered",  completed: false },
    "c1-arrival":      { state: "undiscovered",  completed: false },
    "c3-original":     { state: "undiscovered",  completed: false },
    "c5-correspondence":{ state: "undiscovered", completed: false },
    "c6-tunnel":       { state: "undiscovered",  completed: false },
    "c7-study":        { state: "undiscovered",  completed: false },
    "c8-gallery":      { state: "undiscovered",  completed: false },
  },

  // Object interaction
  object_taps:      {},   // objectId → count
  item_taps:        {},   // itemId → examine depth count
  examined_objects: [],
  hotspots_pulsed:  {},   // roomId → bool (NO PULSE — removed v6)
  essential_left:   {},   // objectId → bool

  // Puzzle
  puzzle_fail_counts:  {},  // puzzleId → count
  puzzle_states:       {},
  puzzle_cooldown_active: {},
  puzzles_solved:      [],  // puzzleIds

  // Combination
  fired_chains: [],

  // Characters
  characters: {},           // populated by characters.js
  char_dialogue_complete: {},

  // Stage
  stage_evidence: { motive: null, means: null, moment: null, accomplice: null, record: null },

  // Deception
  deceptions_remaining: 3,

  // Eavesdrop
  deceptions_remaining: 3,

  // Verdict tracker
  verdictTracker: {
    deceptions_used: 0,
    deceptions_effective: 0,
    deceptions_wasted: 0,
    deceptions_required_used: false,
    innocents_exposed: [],
    all_evidence_examined: false,
    puzzles_attempted: 0,
    puzzles_solved_clean: 0,
    puzzles_solved_hinted: 0,
    puzzles_walked_through: [],
    puzzle_walkthroughs_taken: 0,
    counsel_tier1_used: 0,
    counsel_tier2_used: 0,
    counsel_tier3_used: 0,
    tunnel_found: false,
    tunnel_entrance_used: null,
    compact_investigated: false,
    conspiracy_named: false,      // internal — deep ending reached, feeds NIS THE PICTURE
    rooms_completed: 0,
    characters_fully_questioned: 0,
    accusation_attempts: 0,
    first_accusation_correct: false,
    correct_on_attempt: null,
    evidence_strength: null,
    wrong_accusations: [],
    accused_target: null,
    session_start: null,  // set at gate completion
    session_duration_ms: 0,
    credibility_strikes: 0,
    credibility_state: "clean",
    rank: null,
    // ── NIS SCORING FIELDS ─────────────────────────────────
    techniques_used_per_char: {},
    technique_switches: 0,
    pressure_on_cooperative: 0,
    optimal_technique_used: 0,
    suboptimal_technique_used: 0,
    deceptions_before_question: 0,
    deceptions_after_question: 0,
    dialogue_nodes_unlocked: 0,
    dialogue_nodes_total: 120,
    suspects_investigated: [],
    evidence_trails_followed: 0,
    compact_chars_questioned: 0,
    silence_waits_used: 0,
    silence_fills_triggered: 0,
    silence_tells_triggered: 0,
  },

  // Credibility
  credibility_strikes: 0,
  credibility_state: "clean", // clean | noted | compromised | discredited

  // Compact thresholds
  envoy_timing_confirmed: false,
  heir_operation_confirmed: false,
  sovereign_above_threshold: false,
  bond_reconstruction_progress: 0,

  // Franchise record
  franchise_record: null,

  // Node inventory — granted investigation nodes
  node_inventory: {},
    _stageGateAttempts: {},
    _missedTimelines: {},
    _cranePuzzleUnlocked: false,
    _verdictDepth: 'surface',
};

// ── ROOM ADJACENCY ─────────────────────────────────────────
const ROOM_ADJACENCY = {
  // ── TRAIN ──────────────────────────────────────────────────
  "train-compartment":  ["train-dining"],
  "train-dining":       ["train-compartment", "train-rear"],
  "train-rear":         ["train-dining"],
  // ── ESTATE ─────────────────────────────────────────────────
  "foyer":             ["gallery", "study"],
  "gallery":           ["foyer", "terrace"],
  "study":             ["foyer", "map-room"],
  "terrace":           ["gallery", "ballroom", "maids-quarters", "groundskeeper-cottage"],
  "maids-quarters":    ["terrace"],
  "groundskeeper-cottage": ["terrace"],
  // Ballroom free-tier hub. Balcony + Stage hang off as free branches (Stage still gate-locked by accusation flow).
  // Antechamber is the last free-tier room — paywall triggers on exits south of Antechamber.
  "ballroom":          ["terrace", "balcony", "stage", "antechamber"],
  "balcony":           ["ballroom"],
  "stage":             ["ballroom"],
  "antechamber":       ["ballroom", "library", "physicians"],
  // ── PAID TIER — south of Antechamber ──
  // Antechamber → Library + Physicians (row 1)
  // Library → Smoking (inner col, south)
  // Physicians → Archive (outer col, south)
  // Smoking ↔ Archive (horizontal cross-link)
  // Smoking → Vault → Wine Cellar (deepest spine)
  "library":           ["antechamber", "smoking"],
  "physicians":        ["antechamber", "archive-path"],
  "smoking":           ["library", "archive-path", "vault"],
  "archive-path":      ["physicians", "smoking"],
  "vault":             ["smoking", "wine-cellar"],
  // Secret — NO adjacency. Wine cellar is the only Compact entrance.
  "wine-cellar":       ["vault"],
  "tunnel-passage":    [],
  // ── EAST WING — symmetric 2×3 grid attached to Study by a corridor ──
  // Study → Map Room → Dining Room (row 1, chains east)
  // Map Room → Trophy Room → Armory (inner column, chains south)
  // Dining Room → Billiard Room → Glasshouse (outer column, chains south)
  // Armory ↔ Glasshouse (loop close at far south)
  "map-room":          ["study", "dining-room", "trophy-room"],
  "dining-room":       ["map-room", "billiard-room"],
  "trophy-room":       ["map-room", "weapons-room"],
  "billiard-room":     ["dining-room", "conservatory"],
  "weapons-room":      ["trophy-room", "conservatory"],
  "conservatory":      ["billiard-room", "weapons-room"],
  // Compact — all open simultaneously on tunnel arrival
  "c6-tunnel":         ["c1-arrival","wine-cellar"],
  "c1-arrival":        ["c6-tunnel","c7-study","c3-original","c5-correspondence","c8-gallery"],
  "c3-original":       ["c1-arrival","c5-correspondence"],
  "c5-correspondence": ["c1-arrival","c3-original"],
  "c7-study":          ["c1-arrival","c8-gallery"],
  "c8-gallery":        ["c1-arrival","c7-study"],
};

// ── ITEMS CONSTANT ─────────────────────────────────────────
const ITEMS = {
  "ashworth-seal": {
    name: "Wax Seal",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "surgeon",
    category: "token",
    examine_1: "A wax seal. Left on the coat rack ledge in the Foyer. Not dropped — placed deliberately.",
    examine_2: "The impression is precise. Institutional. Not an Estate seal — the design is different. Someone left this here tonight.",
    examine_3: "The wax is still soft. Used tonight. Someone pressed this seal before the Rite began and left it where the investigation would find it.",
    examine_4: "The seal impression matches the wax on Archive Case 3. The same instrument sealed that case and left this impression in the Foyer. Both acts happened tonight.",
  },
  "estate-flower": {
    name: "Estate Flower",
    is_droppable: true,
    is_deception_item: true,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
  },
  "curators-note": {
    name: "Curator's Note",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
  },
  "burned-fragments": {
    name: "Burned Document Fragments",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "surgeon",
    examine_1: "Three documents. Burned in the Study fireplace. The ash is still warm.",
    examine_2: "Whoever burned these came back. The Study was locked between seven and seven-fifteen. The burning happened before the Rite.",
    examine_3: "Three documents. Not one. Someone had time to be thorough. The Study was the last room they needed to clear before the evening began.",
  },
  "estate-charter-vol3": {
    name: "Estate Charter Vol.3",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "Floor to ceiling. Estate Charter volumes. Every spine identical.",
    examine_2: "Volume three is slightly out of alignment. Someone has removed it recently.",
    examine_3: "The charter establishes the founding conditions of the Bond system. This volume covers the period forty years ago. Whatever was established then is still in effect tonight.",
  },
  "unsigned-letter": {
    name: "Unsigned Letter",
    is_droppable: true,
    is_deception_item: true,
    is_essential: true,
    pedestal_category: [],
    accusation_target: "surgeon",
    examine_1: "A letter on Estate paper. No signature. The handwriting is deliberate. Someone chose their words carefully.",
    examine_2: "It was written for a specific reader. The register of it — the assumptions about what the reader already knows — suggests someone who knew you. Or knew of you.",
    examine_3: "You have read this letter twice. The second time you noticed it was addressed to you. The first time you read it as if it had been written for someone else. That is also information.",
    examine_4: "The last line. You have read past it twice without stopping. 'The last case you closed was not yours to close. Come to this house and find what is actually true. You will know it when you see it because it will be the thing you were not supposed to find.' He knew. Before tonight. Before this house. Before the investigation began. He knew what had been done to you and he chose you because of it. Not despite it. Because of it. A man who has been used once and doesn't know it is the only person the people who used him cannot fully control the second time.",
  },
  "barons-incomplete-file": {
    name: "Baron's Incomplete File",
    is_droppable: true,
    is_deception_item: true,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "A file beside the Baron's chair. Incomplete.",
    examine_2: "Three pages have been removed. The cut edges are clean. This was done deliberately, not in haste.",
    examine_3: "The remaining pages establish the Baron's identity before the Estate. The missing pages establish what came before that. He removed them before tonight.",
  },
  "writing-case-evidence": {
    name: "Writing Case Evidence",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: ["means"],
    accusation_target: "pemberton-hale",
    examine_1: "A writing case. Monogrammed. The Viscount's. Found open in the Antechamber.",
    examine_2: "The case contains Estate paper, two pens, and a seal. The seal matches the impression on the unsigned letter in Archive Case 3.",
    examine_3: "The writing case places the means of the unsigned letter in the Viscount's hands. He was in the Antechamber with the materials required to write correspondence he then placed in the archive under another name.",
  },
  "gloves-evidence": {
    name: "Gloves Evidence",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: ["means"],
    accusation_target: "pemberton-hale",
    examine_1: "A pair of gloves. The Viscount's. Left on the Antechamber table.",
    examine_2: "He removed them at supper and replaced them after. The departure from his usual habit was noted.",
    examine_3: "The gloves went back on after supper. Whatever he handled in those thirty minutes, he handled wearing gloves.",
  },
  "warning-note": {
    name: "Warning Note",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "A note in the Library. Left on the reading table. Not Greaves's hand.",
    examine_2: "Two sentences. The first names the archive. The second names a time. Seven-twenty.",
    examine_3: "Someone left a note in the Library for a reader they expected to be there at seven-twenty. Whoever left it knew where Greaves would be before Greaves did.",
  },
  "debt-record": {
    name: "Debt Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: ["motive"],
    accusation_target: "pemberton-hale",
    examine_1: "A record of a significant debt. The Viscount's name. A date three years ago. An amount that would have ended his position at the Estate.",
    examine_2: "The debt was settled. The record does not say how. The creditor is listed as an arrangement — not a name, not an institution.",
    examine_3: "The Viscount needed something resolved. Whatever he gave in exchange is the answer to why he spent eighteen months preparing for tonight.",
  },
  "bond-record-volume": {
    name: "Bond Record Volume",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "A volume from the Library shelves. Bond records. Forty years of Estate arrangements.",
    examine_2: "One record has been marked. A small crease in the upper right corner of a page — the kind made deliberately, not accidentally.",
    examine_3: "The creased page documents an arrangement from forty years ago that was never formally closed. The arrangement involves two names. One of them is on the Register tonight.",
  },
  "barons-real-origins": {
    name: "Baron's Real Origins",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: ["motive"],
    accusation_target: "baron",
    examine_1: "Papers on the card table. The Baron's handwriting. Three years of informal correspondence.",
    examine_2: "Names, dates, amounts. All of it pointing in one direction — an organisation on the other side of a garden wall.",
    examine_3: "The Baron has been an information source for the Compact for three years. This is not allegation — it is his own correspondence, in his own hand, in his own room.",
  },
  "ashworths-sunday-letter": {
    name: "Ashworth's Sunday Letter",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "A letter. Ashworth's hand. A Sunday. Three months ago. Addressed to no one named.",
    examine_2: "The tone is different from his formal correspondence. Personal. Careful. He is warning someone without saying he is warning them.",
    examine_3: "The letter was never sent. The Baron has it. He has had it for three months. Ashworth wrote a warning and the person he wrote it to kept it rather than acting on it.",
  },
  "appointment-book": {
    name: "Appointment Book",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["means", "moment"],
    accusation_target: "crane",
    examine_1: "Dr. Crane's appointment book. Open to tonight's date. One entry — the Estate availability call.",
    examine_2: "The original pencil entry was for seven o'clock. The ink entry moves the appointment to seven-fifteen. The bag was packed before she arrived.",
    examine_3: "She arrived forty-five minutes before the ink entry says she was supposed to. The appointment book shows the change in her own hand. She knew what the evening required before she arrived.",
  },
  "curators-document": {
    name: "Curator's Document",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "A document in the Curator's hand. A record of a private meeting. Six months ago. Not in any official Estate log.",
    examine_2: "The meeting was between the Curator and Lord Ashworth. The subject is described as a physician concern. Ashworth requested that the Compact's medical operative be reviewed. The Curator noted the request.",
    examine_3: "Ashworth warned him directly, six months ago. He told the Curator that the physician inside the Compact was not who he appeared to be. The Curator thanked him for his concern and took no action. He filed the meeting as a physician concern and returned to other matters.",
  },
  "arrangement-files": {
    name: "17 Arrangement Files",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "Seventeen files. The Vault filing cabinet. Each one a separate arrangement between the Estate and an external party.",
    examine_2: "Sixteen of them are fully documented. The seventeenth has no timestamp and two signatures that do not match the names printed above them.",
    examine_3: "The seventeenth arrangement was backdated. Someone added it to the filing cabinet and made it look like it had always been there. The paper stock gives it away.",
  },
  "steward-bond": {
    name: "Steward's Bond Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["motive", "means"],
    accusation_target: "steward",
    examine_1: "A Bond document. Eight years old. The Steward's signature at the bottom.",
    examine_2: "The Bond is an estate service agreement on its face. In the margin, in a different hand, added after signing, are three operational instructions.",
    examine_3: "The Steward signed a Bond he did not fully understand and then counter-signed three amendments he understood completely. The corridor position at seven fifty-eight is the third amendment.",
  },
  // ── SEALED INCIDENT RECORD ──────────────────────────────────
  // Found in the archive. A record Ashworth had sealed fourteen years ago.
  // No names. Just a date, a location, a notation.
  // Wrong-path player finds it and understands what the Steward has been carrying.
  // Correct-path player eventually understands: Ashworth sealed it himself.
  // He made the decision. He lived with it. Tonight was his attempt to make it mean something.
  "sealed-incident-record": {
    name: "Sealed Incident Record",
    is_droppable: true,
    is_deception_item: true,
    is_essential: false,
    pedestal_category: ["motive"],
    accusation_target: "steward",
    examine_1: "A sealed document in the archive. Fourteen years old. The seal is Lord Ashworth's personal mark — not the Estate seal. Personal. Deliberate.",
    examine_2: "Inside: a date. A location. A single notation. 'Closed by family arrangement.' No names. No details. The specific absence of names in an Estate document is itself information.",
    examine_3: "Fourteen years ago something happened that Lord Ashworth decided would not be recorded. He sealed the record himself with his personal mark — not the Estate seal. The Steward's name is not in this document. The Steward has been in this building every day for fourteen years.",
    examine_4: "The location noted is the approach road to the east wing. The date is a Tuesday in late autumn. The document records no name, no family, no detail of what occurred. It records only: 'Closed by family arrangement.' The arrangement was Lord Ashworth's. The family whose child is unnamed in this document — that is what fourteen years of silence looks like when it has been formalised.",
  },

  "ashworths-last-note": {
    name: "Ashworth's Last Note",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "A note on the mantelpiece. Tonight's date at the top. Lord Ashworth's hand.",
    examine_2: "Addressed to no one. The last paragraph is precise. He knew this evening would be his last opportunity.",
    examine_3: "He did not know he would die. He knew he would not have another Rite to say what needed to be said. He wrote this note as a record, not a farewell.",
  },
  "seal-placement-record": {
    name: "Seal Placement Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["record"],
    accusation_target: "surgeon",
    examine_1: "A document from the Compact's correspondence archive. Not their hand. A different organisation's formatting — precise, institutional, no names.",
  },

  // Puzzle result items
  "compact-placement-record": {
    name: "Compact Placement Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["motive"],
    accusation_target: "surgeon",
    examine_1: "A Compact internal record. The physician was placed inside their structure four years ago. The authorisation did not come from the Sovereign.",
    examine_2: "The Compact accepted a physician they believed was their own operative. The authorising mark at the bottom is a different seal entirely — not the Sovereign's, not the Compact's founding mark.",
    examine_3: "Someone placed the Surgeon inside the Compact as an asset, then gave the Compact no reason to question his loyalty. For four years he was inside both organisations simultaneously. Neither knew. This is the record of the arrangement that made tonight possible.",
  },
  "register-licensing-extract": {
    name: "Register — Licensing Extract",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["motive"],
    accusation_target: "surgeon",
    examine_1: "A licensing extract from the Compact's register. Three revenue arrangements. All authorised within the last eighteen months.",
    examine_2: "Ashworth's name appears on two of them as the authorising signatory. Both were blocked at his position — he had authority to pass them and chose not to.",
    examine_3: "The blocking arrangements were worth years of operational revenue to the organisations behind them. Ashworth's removal as an authority resolved a specific financial obstruction that his continued presence made permanent. This is the record of what his death was worth to whoever needed those arrangements cleared.",
  },

  // northcott-arrival-log removed — use northcott-notebook (correct item with examine text)
  "case-3-wrapper": {
    name: "Archive Case 3 — Original Wrapper",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: "surgeon",
  },
  "operational-brief": {
    name: "Operational Brief",
    is_droppable: true,
    is_deception_item: true,
    is_essential: true,
    pedestal_category: ["means"],
    accusation_target: "surgeon",
    examine_1: "A document found in the Archive. Not Estate formatting. The margins are clean. The language is precise without being formal.",
    examine_2: "It outlines placement parameters for a physician inside the Compact's structure. Access to the Estate. Duration. The Rite is referenced as a timing anchor.",
    examine_3: "The brief was written for someone who already knew their role. It reads less like an instruction and more like a confirmation — you will do this, at this time, using this access. Someone wrote it for a man who had already agreed.",
  },
  // ── BALCONY PLOT ITEMS ──────────────────────────────────
  "surgeons-mask": {
    name: "The Surgeon's Mask",
    is_droppable: true,
    is_deception_item: true,
    is_essential: true,
    pedestal_category: ["means"],
    accusation_target: "surgeon",
    examine_1: "A formal Estate mask. The one that fell on the balcony at seven forty-five — reconstructed from the physical trace at the railing and the plain mask that replaced it. The design is specific. Not standard issue. Someone had this made.",
    examine_2: "The inner banding carries an impressed mark. A personal commission. Not Estate standard — this was made for one person specifically.",
    examine_3: "The impression matches the Compact physician's commission record. This is his mask. It fell here. He did not retrieve it.",
  },
  "plain-mask": {
    name: "Plain Mask",
    is_droppable: true,
    is_deception_item: true,
    is_essential: true,
    pedestal_category: [],
    accusation_target: "surgeon",
    examine_1: "A formal mask. No signature mark. No impressed detail. It carries nothing that identifies its wearer.",
    examine_2: "Estate masks are individually commissioned. Every member's mask carries a maker's mark. This one carries nothing. It was not commissioned through the Estate.",
    examine_3: "It was brought from outside. Whoever wore this into the Ballroom at seven fifty-two had planned for the need of an anonymous face.",
  },
  "balcony-case": {
    name: "Medical Bag",
    is_droppable: true,
    is_deception_item: true,
    is_essential: false,
    pedestal_category: ["means"],
    accusation_target: "crane",
    examine_1: "A medical bag on the balcony floor. Dr. Crane's initials on the clasp.",
    examine_2: "The case was left here. Not placed — left. There is a difference. Someone left in a hurry and did not come back for it.",
    examine_3: "The case was on this floor at seven-oh-five. Forty minutes before Lord Ashworth reached the railing. A physician does not leave her case on a balcony floor by accident. She left it here because she knew she would need to come back to this room, and she did not want to be seen arriving with it.",
  },
  "surgeons-licensing-record": {
    name: "Licensing Review Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["motive"],
    accusation_target: "surgeon",
    examine_1: "A licensing board record. Thirty years old. Three senior board members listed. One of them is Lord Ashworth.",
    examine_2: "The determination revoked a physician's credentials. The decision was final. No appeal was permitted. The board chair signed the closing determination.",
    examine_3: "Lord Ashworth chaired the review. He signed the determination. He had authority to return the finding. He chose not to. The physician named in this record is not Edmund Voss. The physician who has been in this building since seven-oh-three is.",
  },
  "rite-programme": {
    name: "Rite Programme",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: ["moment"],
    accusation_target: "surgeon",
    examine_1: "The Rite programme. Tonight's order of ceremony. Printed this afternoon.",
    examine_2: "The programme lists the opening sequence. The assembly gathers at seven forty-five. The first reading begins at eight o'clock. The candles dim for the invocation.",
    examine_3: "A handwritten annotation in the margin. Ashworth's hand. 'He will not wait for the ceremony. He will use the assembly window. 7:45.' Ashworth knew. He came anyway.",
  },
  "surgeons-motive-confirmed": {
    name: "Motive Confirmed — The Surgeon",
    is_droppable: false,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["motive"],
    accusation_target: "surgeon",
    examine_1: "A licensing board record thirty years old. Burned fragments from the Study fireplace. Both carry the same thread — Lord Ashworth's name, and a physician whose career he ended.",
    examine_2: "Ashworth chaired the board that revoked the credentials. The determination was final. No appeal permitted. The physician named in that record built a new identity and spent four years inside the Compact — the organisation Ashworth was about to expose tonight.",
    examine_3: "He did not need thirty years to plan it. He needed one window — the Register open, the assembly present, his identity about to be surfaced. He burned the documents that would have named him, and then he used the window the Rite gave him.",
  },


  // ── CRANE PLANNING LETTER ──────────────────────────────────
  // The accomplice pedestal item. Fourth pedestal.
  // Written by Crane six weeks before tonight.
  // A murder plan the writer never expected to be used.
  "surgeon-crane-conspiracy-letter": {
    name: "Surgeon-Crane Conspiracy Letter",
    is_droppable: false,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["accomplice"],
    accusation_target: "crane",
    examine_1: "A letter in Dr. Crane's hand. Dated six weeks ago. Estate paper. Clinical precision — the register of someone writing a procedure not a correspondence.",
    examine_2: "It describes the balcony level. The timing of the assembly. The three minutes before the Rite begins when the railing position is unoccupied. The specific moment Lord Ashworth would be alone there. As he had been for forty years.",
    examine_3: "She wrote this six weeks before tonight. She described the exact window in which Lord Ashworth died. In her hand. With a date. She wrote it down because she did not think it would matter. It mattered.",
  },

  // ── VIVIENNE WITNESS TESTIMONY ──────────────────────────
  // Produced when vivienne_push_witnessed node fires.
  // The only moment evidence for the Surgeon. Hardest item to earn.
  "witness-testimony-vivienne": {
    name: "Witness Testimony",
    is_droppable: false,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "surgeon",
    examine_1: "One sentence. Written in the investigator's hand at the moment it was spoken. Present tense. From a witness on the terrace at seven forty-five.",
    examine_2: "One man pushed another man off that balcony. That is what she saw. That is what she has known since seven forty-five. That is what she did not say until tonight.",
  },

  // Compact items
  "original-agreement": {
    name: "Original Agreement",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
  },
  "keystone-rubbing": {
    name: "Keystone Rubbing",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
  },
  "conspirator-letters": {
    name: "Conspirator Letters",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
  },
  "unsealed-letter": {
    name: "Unsealed Letter to Ashworth",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
  },
  "witness-testimony": {
    name: "Witness Testimony",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
  },
  "planning-document": {
    name: "Planning Document",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
  },

  "buried-bonds-comparison": {
    name: "Buried Bonds Comparison",
    is_droppable: true,
    is_deception_item: false,
    is_essential: false,
    pedestal_category: [],
    accusation_target: null,
  },
  // ── COLLECTIBLE PROPS ─────────────────────────────────────
  // Non-furniture items player can pick up strategically
  // foyer-flowers removed — use estate-flower (correct item with room object and deception use)
  "guest-book": {
    name: "Guest Book",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["moment"], accusation_target: "surgeon",
    examine_1: "The Rite guest book. Signatures and arrival times. One entry has been removed — the page torn cleanly at the binding.",
    examine_2: "The tear is recent. Tonight. The surrounding entries are undisturbed.",
    examine_3: "The missing entry corresponds to the seven-oh-three arrival. Someone came back and removed it. The guest book and Northcott's notebook now point at the same gap in the record.",
  },
  "archive-filing-notes": {
    name: "Archive Filing Notes",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: [], accusation_target: null,
    examine_1: "Filing notes from the archive. Miss Voss's handwriting. A record of what was logged in and out of Case 3.",
    examine_2: "Three entries. Two normal. The third notes a discrepancy in the seal — the wax colour does not match. She flagged it and received no response.",
    examine_3: "She noticed the seal was wrong and no one acted on it. Someone above her in the chain decided the investigation should not proceed.",
  },
  "leather-document-roll": {
    name: "Leather Document Roll",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: [], accusation_target: null,
    examine_1: "A leather roll. Sealed with wax from the same source as the Case 3 wrapper.",
    examine_2: "The roll contains a single document — a transfer order for Case 3's contents, dated six weeks ago.",
    examine_3: "The transfer order leads to a room that does not exist in the Estate's floor plan. Someone created a paper trail for Case 3 that leads nowhere. That is the point of it.",
  },
  "voss-notes": {
    name: "Miss Voss's Notes",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["moment"], accusation_target: "voss",
    examine_1: "Miss Voss's personal notes. A different notebook from the archive log. Kept in her coat pocket.",
    examine_2: "Three entries. The first names a face — wrong credentials, correct documents. The second names a time — seven PM, thirty-five minutes after she noticed. The third is a single word: waited.",
    examine_3: "She saw the wrong face on the correct credentials and waited thirty-five minutes before reporting it. The word waited is underlined twice. She was deciding something during those thirty-five minutes.",
  },
  "lady-ashworth-letter": {
    name: "Lady Ashworth's Letter",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["motive"], accusation_target: "ashworth",
    examine_1: "A letter on the writing desk. Not Ashworth's hand. Feminine. Written six weeks ago.",
    examine_2: "Lady Ashworth's writing. She is telling Edmund she knows what he is planning. She is asking him not to proceed.",
    examine_3: "He kept it on the desk. He did not act on her request. She knew he would not. She came tonight anyway. She knew six weeks before tonight that he was walking into something he would not walk out of.",
  },
  // ── COMPACT KEEPSAKE ──────────────────────────────────────
  // Found in Ashworth's private correspondence drawer in the study.
  // Personal. Intimate. Not his. Not Estate issue.
  // Wrong-path player reads: evidence of the arrangement Lady Ashworth knew about.
  // Correct-path player eventually understands: irrelevant to the murder.
  // Lady Ashworth's recognition when shown is grief not guilt.
  "compact-keepsake": {
    name: "Personal Keepsake",
    is_droppable: true,
    is_deception_item: true,
    is_essential: false,
    pedestal_category: ["motive"],
    accusation_target: "ashworth",
    examine_1: "A small object in Ashworth's private correspondence drawer. Not Estate issue. Not institutional. Personal. Left between two letters that are clearly professional.",
    examine_2: "The origin is not local. A different region entirely. Someone brought this from somewhere specific and left it here deliberately, or Ashworth kept it deliberately. Both possibilities have the same implication.",
    examine_3: "Forty years of marriage. This drawer. This object between these letters. Lady Ashworth has a key to this study and has had access whenever she chose. Whether she knew this was here is a question the object cannot answer. Her face when she sees it will.",
  },

  "lady-ashworths-key": {
    name: "Lady Ashworth's Key",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["means"], accusation_target: "ashworth",
    examine_1: "A key on the mantelpiece. Not Ashworth's. The initials on the fob are not his.",
    examine_2: "The initials are hers. Lady Ashworth has a key to this study. She has had access whenever she chose.",
    examine_3: "The key has been used recently. The lock oil is fresh. She was in this room before the Rite began. She had access to everything in this study before anyone else arrived tonight.",
  },
  "candle-request-note": {
    name: "Candle Request Note",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["moment"], accusation_target: "ashworth",
    examine_1: "A slip of paper on the card table. Tonight's date. A request for both sets of candelabras to be changed.",
    examine_2: "Lady Ashworth's hand. The time is written at the top — seven-oh-five this evening. Before the Rite. Before anyone was called.",
    examine_3: "She made the request in writing and kept a copy. At seven-oh-five she was in the Foyer making written requests as if she already understood the record would matter.",
  },
  "northcott-placement-letter": {
    name: "Northcott's Placement Letter",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["motive"], accusation_target: "northcott",
    examine_1: "A sealed envelope behind the invitation stand. Addressed to Northcott. Ashworth's hand.",
    examine_2: "Six weeks ago. Ashworth wrote to Northcott directly. He told him where to stand, what to record, which door to watch.",
    examine_3: "Ashworth placed Northcott here deliberately and told him arrivals would matter. The question the letter raises is whether Northcott understood what he was being positioned to witness.",
  },
  "northcott-arrival-record": {
    name: "Northcott's Arrival Record",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["means", "moment"], accusation_target: "northcott",
    examine_1: "A leather-bound record on the card table. Every arrival tonight. Precise handwriting.",
    examine_2: "He controls what is in this record. He also controls what is not. The 7:03PM entry is circled. Nothing else is.",
    examine_3: "He circled one entry and left everything else unmarked. Every decision about this record is his. The circled entry is the only arrival that cannot be accounted for by anyone else in the building.",
  },
  "baron-compact-channel": {
    name: "Baron's Compact Channel",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["means"], accusation_target: "baron",
    examine_1: "A notebook beside the Baron's chair. Columns of names. Dates. Contact references.",
    examine_2: "The entries stop three months ago. The last entry is a specific request — timing, room access, corridor coverage.",
    examine_3: "The Baron provided corridor access and timing information through his Compact contact channel. He gave whoever asked the building's blind spots — which corridors were unmonitored and when. The last entry describes the operational parameters of tonight. He did not ask why they needed to know.",
  },
  "baron-study-observation": {
    name: "Baron's Study Observation",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["moment"], accusation_target: "baron",
    examine_1: "A notepad on the windowsill. The Baron's hand. Two lines.",
    examine_2: "Seven-oh-five PM. Study. The name is not written. The time is. He noted it the way someone notes something they intend to forget.",
    examine_3: "He saw someone leave the study at seven-oh-five and wrote the time but not the name. He did not report it. He watched someone leave the room where Lord Ashworth would die thirty-five minutes later and decided that was not his problem.",
  },
  "ballroom-programme": {
    name: "Rite Programme",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["moment"], accusation_target: null,
    examine_1: "The Rite programme. Tonight's order of ceremony. Printed this afternoon.",
    examine_2: "The programme lists seven participants. Lord Ashworth is marked with a notation in the margin — a symbol not in the printed legend.",
    examine_3: "The notation was added by hand after the programme was printed. Someone knew before tonight began that Lord Ashworth's participation would end differently from the others.",
  },
  // ── CANDLE IRON ─────────────────────────────────────────────
  // The staged misdirection weapon. Placed near Ashworth's head by the Surgeon.
  // Makes blunt force the obvious conclusion. Five wrong suspects all had access.
  // Wrong-path players build cases around this. Correct-path players eventually
  // realise it was staged — Vivienne confirms it was not there at seven o'clock.
  "candle-iron": {
    name: "Candle Iron",
    is_droppable: true,
    is_deception_item: true,
    is_essential: true,
    pedestal_category: ["means"],
    accusation_target: null,
    examine_1: "A candle iron from the ballroom candelabra. Found near Lord Ashworth's head. The base is heavy — cast iron. It would not need much force.",
    examine_2: "The wick is still in the holder. The iron was separated from the candle deliberately — this was removed and placed, not knocked over. Someone carried it here.",
    examine_3: "The iron was not here at seven o'clock. The maid set the candles before the assembly and the holder was intact. It arrived between seven and eight. Someone brought it and placed it deliberately near the body.",
    examine_4: "There is no blood on the iron. No hair. No tissue. Whatever it was placed here to suggest — it did not do what it was placed here to suggest. The body shows no evidence of blunt force. The candle iron is a statement about what the investigator should conclude. It is not evidence of what happened.",
  },
  "lectern-pen": {
    name: "Fountain Pen",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["means", "moment"], accusation_target: "pemberton-hale",
    examine_1: "A fountain pen. Left on the lectern in the ballroom. Not the Viscount's pen — but the ink matches.",
    examine_2: "The pen was used tonight. The Register shows a fresh entry made at eight-oh-four — three minutes after Lord Ashworth fell.",
    examine_3: "Someone used this pen to make an entry in the Register after Lord Ashworth died. The ink matches the Viscount's case. The pen places him at the lectern at eight-oh-four.",
  },
  "terrace-garden-map": {
    name: "Garden Map",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["moment"], accusation_target: null,
    examine_1: "A garden map. Found on the terrace table. Not Estate issue — the cartography style is different.",
    examine_2: "One path is marked in pencil. The route runs from the garden entrance to the wine cellar access point, avoiding every lit path.",
    examine_3: "The map was left here. Not lost — left. The pencil route is the path used by whoever arrived at seven-oh-three without being seen.",
  },
  "ashtray": {
    name: "Crystal Ashtray",
    is_droppable: true, is_deception_item: false, is_essential: false,
    pedestal_category: ["moment"], accusation_target: "baron",
    examine_1: "A crystal ashtray on the card table. One cigarette. Unfinished.",
    examine_2: "The ash is long. He lit it and did not smoke it. He was thinking, not smoking.",
    examine_3: "The cigarette went out on its own. He lit it when something happened and then forgot to smoke it. The timing of the cigarette and the timing of the murder are the same.",
  },
  "smoking-letters": {
    name: "Baron's Correspondence",
    is_droppable: true, is_deception_item: true, is_essential: false,
    pedestal_category: ["motive", "means"], accusation_target: "baron",
    examine_1: "A bundle of correspondence on the side cabinet. Three years of letters.",
    examine_2: "The tone changes exactly eighteen months ago. What began as information exchange becomes instruction.",
    examine_3: "The Baron stopped being a source and became an asset. He did not notice when it happened. That is the design.",
  },
  "study-decanter": {
    name: "Crystal Decanter",
    is_droppable: true, is_deception_item: true, is_essential: false,
    examine_1: "A crystal decanter on the writing desk. The level is lower than a full pour.",
    examine_2: "One glass has been used. One has not. The used glass is on Lord Ashworth's side of the desk.",
    examine_3: "Two people were in this study tonight — one who used the glass and one who did not. The unused glass is closest to the door.",
    pedestal_category: [], accusation_target: null,
  },
  // ph-document-case removed — Todd on train, PH has no foyer presence
  // ── NEW ITEMS — KB v4.0 ──────────────────────────────────
  // Northcott's arrival notebook — contains Surgeon's 7:03PM entry
  // One hour before the Surgeon claimed to have arrived.
  "northcott-notebook": {
    name: "Northcott's Arrival Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "surgeon",
    examine_1: "A small leather-bound notebook. Meticulous entries. Every arrival tonight recorded in precise handwriting.",
    examine_2: "7:03PM. One entry is circled twice. A face not clearly seen. A route through the garden that most members don't use. An hour before the Surgeon claimed to have arrived.",
    examine_3: "The 7:03PM entry is the only one without a name attached. Northcott saw a face he didn't recognize. He circled it because something about it didn't fit the guest list.",
  },
  // Safe combination — produced by Witness Map puzzle in c8-gallery
  // Unlocks the Vault safe containing Ashworth's evidence + Callum's Bond
  "safe-combination": {
    name: "Safe Combination",
    is_droppable: false, // Never dropped — it's knowledge not an object
    is_deception_item: false,
    is_essential: true,
    pedestal_category: [],
    accusation_target: null,
    examine_1: "Four observations. Four witnesses. Four moments that together form the sequence.",
    examine_2: "The Witness Map produced this. Two perspectives — Estate testimony and Compact records — that neither side could see alone. Combined, they point to one position. One time. One person.",
  },
  // ── WRONG-PATH PUZZLE OUTPUT ITEMS ──────────────────────────
  "ph-register-connection": {
    name: "Register Connection",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "pemberton-hale",
    examine_1: "A comparison of the seal impression on the writing case and the unsigned letter. The match is exact. The same seal produced both.",
    examine_2: "Pemberton-Hale placed an unsigned letter on the Estate stand tonight. The case in the Antechamber is his. The seal that closed his correspondence is the seal on the letter. He wrote it. He did not sign it. He left it where the Register would have sent it.",
    examine_3: "A man who writes a letter and does not sign it has already decided what it will be used for. The letter is not correspondence. It is a record of intent.",
  },
  "crane-premeditation-record": {
    name: "Premeditation Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["motive"],
    accusation_target: "crane",
    examine_1: "The appointment book moved forward forty-five minutes. The bag packed before the call. Both items from the same hand, the same evening, the same preparation.",
    examine_2: "A physician who adjusts her appointment in her own book before she is summoned knows she will be summoned. A physician who leaves her bag on a balcony floor at seven-oh-five knows she will need to return to that balcony. The preparation preceded the event.",
    examine_3: "The medical case was on the balcony floor before Lord Ashworth reached the railing. The appointment was moved before the Rite began. She was not responding to tonight. She was ready for it.",
  },
  "baron-operational-record": {
    name: "Operational Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "baron",
    examine_1: "The Baron's correspondence bundle and the channel notebook. Both end on the same date. The same day. The same cessation.",
    examine_2: "Three years of letters. Three years of channel entries. Both stop three months ago. The last channel entry is a specific operational request — timing, access, the Rite evening. The last letter acknowledges receipt of that request. Both documents close the same day the questions became too operational.",
    examine_3: "He said he stopped because the questions changed. The documents say he stopped the day after he confirmed the request. The window the last entry describes is tonight.",
  },
  "steward-fourteen-year-record": {
    name: "Fourteen Year Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "steward",
    examine_1: "The Bond and the sealed incident record, placed together. The margin annotation on the Bond matches the hand that sealed the incident fourteen years before.",
    examine_2: "Lord Ashworth sealed the incident on a Tuesday afternoon fourteen years ago. Eight years later the Bond arrived — drafted in language close enough to Estate procedure to pass. The Steward signed it. He signed it because a man who has watched something buried does not have the standing to refuse the person who buried it.",
    examine_3: "He covered the corridor at seven fifty-eight. He signed the Bond eight years ago. He arrived at the approach road fourteen years ago and found Clara. Three moments. The same man. He did not push anyone. He covered a corridor. He has been deciding ever since whether that is enough.",
  },
  "ashworth-affair-correspondence": {
    name: "Affair Correspondence",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["motive"],
    accusation_target: "ashworth",
    examine_1: "Lady Ashworth's letter and the compact keepsake, read together. The letter knows the object. The object is from a specific region. The letter addresses someone from that region.",
    examine_2: "She wrote to C. The keepsake came from C. Edmund kept both in the same drawer. She knew about the arrangement for fourteen months. She did not remove the keepsake. She wrote a letter instead. She came tonight to hear Edmund name both in the Register.",
    examine_3: "A woman who knows about an arrangement for fourteen months and does not act is not passive. She is waiting for the right moment. The Register, open, in front of every senior member — that was the moment. He did not reach it.",
  },
  "northcott-gap-record": {
    name: "Gap Record",
    is_droppable: true,
    is_deception_item: false,
    is_essential: true,
    pedestal_category: ["moment"],
    accusation_target: "northcott",
    examine_1: "The placement letter and the arrival record, side by side. Ashworth placed him at the Foyer specifically. The record shows two gaps.",
    examine_2: "Lord Ashworth wrote to Northcott six weeks ago and told him where to stand, which door to watch, which times to record. Tonight the record has two absences — seven-fifteen and seven fifty-five. Both fall inside the window. The man who was placed to keep the record is the only person whose record has gaps.",
    examine_3: "He was positioned to witness. He left his position twice during the only window that matters. The placement letter tells you he knew exactly what his position required. The arrival record tells you he abandoned it.",
  },

};

// ── COMBINATION CHAINS ─────────────────────────────────────
const COMBINATION_CHAINS = [
  {
    // Balcony Reconstruction — the mask Hatch gave him + the staged candle iron
    // Gate: ALL three Surgeon timeline nodes — hardest unlock in the game.
    // The mask is the nail. The player earns it only after the full Surgeon timeline.
    id: "cipher-trigger",
    item_a: "plain-mask", item_b: "candle-iron", item_c: null,
    triggers_puzzle: true, puzzle_type: "balcony-reconstruction",
    result_item: "surgeons-mask",
    locked_hint: "The timeline is not yet complete.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['greaves_maskless_witness'] && ni['surgeon_admits_balcony_level'] && ni['vivienne_push_witnessed']);
    },
    discovery_text_single: "A plain mask and a staged candle iron. Both placed deliberately. One to replace what was lost. One to mislead.",
    discovery_text_double: "The mask Hatch gave him at seven forty-eight. The candle iron placed near the body to suggest a weapon that was never used. Two objects. One man who needed three minutes to undo what had just happened on the balcony.",
    discovery_type: "surgeon_chain_1",
  },

  {
    // Motive Reconstruction — licensing record + burned fragments = thirty-year motive
    // Puzzle: player reconstructs the burned document fragments to reveal
    // the connection between the licensing board and Ashworth's signature.
    id: "motive-reconstruction-trigger",
    item_a: "surgeons-licensing-record", item_b: "burned-fragments", item_c: null,
    triggers_puzzle: true, puzzle_type: "motive-reconstruction",
    result_item: "surgeons-motive-confirmed",
    locked_hint: "The timeline is not yet clear.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['greaves_maskless_witness']);
    },
    discovery_text_single: "A licensing record and burned document fragments. Both names lead to the same moment thirty years ago.",
    discovery_text_double: "The licensing board record and the fragments of what he burned in Ashworth's study. Ashworth's name is in the record. The study is where he burned them. The reconstruction will close the gap between them.",
    discovery_type: "surgeon_motive_chain",
  },
  {
    // Bond Reconstruction — Compact placement confirmed
    id: "bond-reconstruction-trigger",
    item_a: "planning-document", item_b: "steward-bond", item_c: null,
    triggers_puzzle: true, puzzle_type: "bond-reconstruction",
    result_item: "compact-placement-record",
    locked_hint: "Talk to the Curator or Miss Voss.",
    condition: () => {
      const v = gameState.char_dialogue_complete['voss'] || {};
      const c = gameState.char_dialogue_complete['curator'] || {};
      return !!(v['Q2'] || c['Q5']);
    },
    discovery_text_single: "Two documents. Related.",
    discovery_text_double: "The planning document and the Bond record share a handwriting element. The reconstruction will show the chain of authority that placed the Surgeon inside the Compact.",
    discovery_type: "surgeon_chain_3",
  },


  {
    id: "ink-comparison-trigger",
    item_a: "buried-bonds-comparison", item_b: "steward-bond", item_c: null,
    triggers_puzzle: true, puzzle_type: "ink-comparison", result_item: null,
    locked_hint: "Talk to the Steward about the corridor.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['steward_corridor_758'] && ni['bond_coerced_signed']);
    },
    discovery_text_double: "Two documents. Same period. The ink tells a different story than the words.",
    discovery_type: "bond_forgery",
  },

  {
    // Witness Map — deep history puzzle. Location: c8-gallery.
    // Gate: Heir Branch B complete — HB1 (original agreement) + HB2 (burned fragments)
    // The puzzle itself tests full knowledge of both organisations' history.
    // No item inputs — triggered by dialogue completion in the Heir's branch.
    id: "witness-map-trigger",
    item_a: null, item_b: null, item_c: null,
    triggers_puzzle: true, puzzle_type: "witness-map", result_item: "safe-combination",
    locked_hint: "Speak to the Heir.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['heir_wants_callums_independent_findings']);
    },
    discovery_text_double: "The founding. The corruption. The fabrication. The separation. Four moments across twelve hundred years. You have been in both organisations tonight. You are the only person who has seen both halves of the same history.",
    discovery_type: "witness_map",
  },
  {
    // PH — writing case seal matches unsigned letter
    id: "ph-register-trigger",
    item_a: "writing-case-evidence", item_b: "unsigned-letter", item_c: null,
    triggers_puzzle: true, puzzle_type: "seal-match",
    result_item: "ph-register-connection",
    locked_hint: "Talk to Pemberton-Hale about the Register.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['register_altered_ph'] && ni['ph_false_timeline_ballroom']);
    },
    discovery_text_single: "A writing case and an unsigned letter. The seal that closed one produced the other.",
    discovery_text_double: "Pemberton-Hale's writing case sits in the Antechamber. The unsigned letter sits in the Foyer. The seal impression on the case is the seal on the letter. He wrote it. He left it. He did not sign it because he expected someone else to act on it.",
    discovery_type: "ph_wrongpath",
    puzzle_content: {
      instruction: 'Identify the seal that matches.',
    },
  },
  {
    // Crane — appointment book + balcony case = premeditation
    id: "crane-premeditation-trigger",
    item_a: "appointment-book", item_b: "balcony-case", item_c: null,
    triggers_puzzle: true, puzzle_type: "motive-reconstruction",
    result_item: "crane-premeditation-record",
    locked_hint: "Talk to Dr. Crane about her visits.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['craneBalconyAdmission'] && ni['crane_first_visit_ashworth_alive']);
    },
    discovery_text_single: "An appointment book and a medical bag. The times do not match the story.",
    discovery_text_double: "The appointment book was amended in her own hand before she was called. The bag was on the balcony floor at seven-oh-five — forty minutes before Lord Ashworth fell. She did not leave in a hurry. She left the bag deliberately. She knew she would need to come back.",
    discovery_type: "crane_wrongpath",
    puzzle_content: {
      events: [
        { id: 1, text: 'Dr. Crane receives the Estate availability call.' },
        { id: 2, text: 'The appointment book entry is amended — moved forty-five minutes earlier. In her own hand.' },
        { id: 3, text: 'The medical bag is placed on the balcony floor.' },
        { id: 4, text: 'Dr. Crane arrives at the physicians room. The bag is already gone.' },
        { id: 5, text: 'Lord Ashworth reaches the balcony railing.' },
        { id: 6, text: 'The medical bag is found. The clasp bears her initials.' },
      ],
      correct: [1, 2, 3, 4, 5, 6],
    },
  },
  {
    // Baron — smoking letters + compact channel = operational window
    id: "baron-operational-trigger",
    item_a: "smoking-letters", item_b: "baron-compact-channel", item_c: null,
    triggers_puzzle: true, puzzle_type: "correspondence-thread",
    result_item: "baron-operational-record",
    locked_hint: "Talk to the Baron about when his arrangement ended.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['baron_watched_outcome'] && ni['baron_compact_arrangement']);
    },
    discovery_text_single: "Three years of letters and three years of channel entries. Both stop the same day.",
    discovery_text_double: "The correspondence bundle and the channel notebook end on the same date. The last channel entry names a specific operational window. The last letter confirms receipt. He said he stopped because the questions changed. The documents say he stopped the day he confirmed what they were building toward.",
    discovery_type: "baron_wrongpath",
    puzzle_content: {
      letters: [
        { id: 1, date: 'Three years ago', excerpt: 'Initial contact. Information in exchange for financial arrangement. Transactional.' },
        { id: 2, date: 'Two years ago', excerpt: 'The questions change character. Access rather than information.' },
        { id: 3, date: 'Eighteen months ago', excerpt: 'The tone shifts. What began as exchange becomes instruction.' },
        { id: 4, date: 'Six months ago', excerpt: 'Specific operational request. Timing. Room access. Corridor coverage.' },
        { id: 5, date: 'Three months ago', excerpt: 'Receipt confirmed. Last letter. Last channel entry. Same day.' },
        { id: 6, date: 'Tonight', excerpt: 'The window the last entry describes. The Rite.' },
      ],
      correct: [1, 2, 3, 4, 5, 6],
    },
  },
  {
    // Steward — bond + sealed incident = same authority
    id: "steward-coercion-trigger",
    item_a: "steward-bond", item_b: "sealed-incident-record", item_c: null,
    triggers_puzzle: true, puzzle_type: "bond-reconstruction",
    result_item: "steward-fourteen-year-record",
    locked_hint: "Talk to the Steward about the Bond.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['steward_granddaughter_record'] && ni['steward_corridor_758']);
    },
    discovery_text_single: "A Bond and a sealed incident record. The same hand appears in both.",
    discovery_text_double: "The margin annotation on the Bond matches the notation on the sealed incident record. Lord Ashworth sealed the incident on a Tuesday afternoon fourteen years ago. Six years later the Bond arrived at the Steward's door. A man who watched something buried and said nothing does not refuse the person who buried it.",
    discovery_type: "steward_wrongpath",
    puzzle_content: {
      labels: [
        'The approach road. A Tuesday in late autumn. Clara. Closed by family arrangement.',
        'The incident sealed. Lord Ashworth\'s personal mark. No names recorded. No details.',
        'The Bond drafted six years later. Estate administrative language on its face.',
        'The Bond signed. The Steward\'s signature. He did not read it carefully enough.',
        'Margin annotation added after signing. The same hand that sealed the incident.',
      ],
      correct_order: [1, 2, 3, 4, 5],
    },
  },
  {
    // Lady Ashworth — letter + compact keepsake = affair documented
    id: "ashworth-affair-trigger",
    item_a: "lady-ashworth-letter", item_b: "compact-keepsake", item_c: null,
    triggers_puzzle: true, puzzle_type: "correspondence-thread",
    result_item: "ashworth-affair-correspondence",
    locked_hint: "Talk to Lady Ashworth about what she knew.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['ashworth_affair_letter_unsent'] && ni['ashworth_told_her_about_arrangement']);
    },
    discovery_text_single: "A letter and a keepsake. She was writing to the person who left this object.",
    discovery_text_double: "Lady Ashworth's letter is addressed to C. The keepsake in the drawer came from a specific region. The letter knows the region. She has known for fourteen months. She came tonight to hear it named. Edmund did not reach the naming.",
    discovery_type: "ashworth_wrongpath",
    puzzle_content: {
      letters: [
        { id: 1, date: 'Fourteen months ago', excerpt: 'Edmund tells her. Not everything. Enough. She listens without speaking.' },
        { id: 2, date: 'Twelve months ago', excerpt: 'The keepsake appears in the drawer. Left by someone. Not Edmund.' },
        { id: 3, date: 'Six weeks ago', excerpt: 'Edmund tells her he intends to present evidence at the Rite. She asks him not to proceed.' },
        { id: 4, date: 'Six weeks ago — the same evening', excerpt: 'She writes a letter. Addressed to C. She does not send it.' },
        { id: 5, date: 'Tonight', excerpt: 'She arrives without a mask. She came to hear Edmund name it. He did not reach the Register.' },
        { id: 6, date: 'Tonight — after eight', excerpt: 'The letter and the keepsake remain in the drawer. Both addressed to the same person.' },
      ],
      correct: [1, 2, 3, 4, 5, 6],
    },
  },
  {
    // Northcott — placement letter + arrival record = gaps in window
    id: "northcott-gap-trigger",
    item_a: "northcott-placement-letter", item_b: "northcott-arrival-record", item_c: null,
    triggers_puzzle: true, puzzle_type: "motive-reconstruction",
    result_item: "northcott-gap-record",
    locked_hint: "Talk to Northcott about his position tonight.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['northcott_two_absences'] && ni['northcott_placed_by_ashworth']);
    },
    discovery_text_single: "A placement letter and an arrival record. The record has gaps the letter says should not exist.",
    discovery_text_double: "Lord Ashworth placed Northcott at the Foyer specifically. The arrival record has two gaps: seven-fifteen and seven fifty-five. Both fall inside the window. The man who was positioned to keep the complete record is the only person whose record is incomplete.",
    discovery_type: "northcott_wrongpath",
    puzzle_content: {
      events: [
        { id: 1, text: 'Lord Ashworth writes to Northcott. Specific position. Specific instructions. Six weeks before the Rite.' },
        { id: 2, text: 'Northcott takes his position at the Foyer. The arrival record begins.' },
        { id: 3, text: 'Seven-fifteen. The record has a gap. Northcott is not at his position.' },
        { id: 4, text: 'The record resumes. Entries continue as before. Nothing noted.' },
        { id: 5, text: 'Seven fifty-five. A second gap. Northcott is not at his position.' },
        { id: 6, text: 'Lord Ashworth falls from the balcony. The window is seven forty-five to seven forty-eight.' },
      ],
      correct: [1, 2, 3, 4, 5, 6],
    },
  },

  // ── CROSS-CONTAMINATION CHAINS ────────────────────────────
  // These produce no items — only narrative pivots and node grants.
  // Each chain tells the WRONG story convincingly before dismantling it.
  // Discovery texts are written to feel like genuine conclusions.
  // They are not hints. They are wrong chapters.

  {
    // CHAPTER ONE — PH as the scene's first story.
    // Candle iron (staged means) + lectern pen (PH's implement at the Register).
    // The scene says: no prints, heavy iron, PH's pen at the lectern, dead hand pointing.
    // This is what the crime scene says before testimony corrects it.
    id: "scene-read-ph",
    item_a: "candle-iron", item_b: "lectern-pen", item_c: null,
    triggers_puzzle: false, result_item: null,
    locked_hint: "Examine the Register and the candelabra first.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['register_altered_ph']);
    },
    discovery_text_double: "The candle iron and the pen from the lectern. The iron is near Lord Ashworth's head. Heavy enough. No fingerprints — but Pemberton-Hale wore gloves tonight and took them off once. The ink on the pen matches his writing case. The dead hand is pointing at the Register he spent eight years adjusting. A man with motive, a means that explains no prints, and a dead hand naming his work.",
    discovery_type: "scene_read_ph",
    grants_node: "scene_reads_as_ph",
  },

  {
    // CHAPTER TWO — Baron as the second story.
    // Candle iron + baron-study-observation: he saw someone leave the study at 7:05.
    // He knew the corridor. He knew the timing. His Compact channel gave them blind spots.
    // The cigarette went out at 7:45. He was watching when it happened.
    id: "scene-read-baron",
    item_a: "candle-iron", item_b: "baron-study-observation", item_c: null,
    triggers_puzzle: false, result_item: null,
    locked_hint: "Talk to the Baron about what he saw at seven-oh-five.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['baron_705_observation'] && ni['baron_crane_visit_715']);
    },
    discovery_text_double: "The candle iron and the observation note from the Baron's windowsill. He saw someone leave the study at seven-oh-five and wrote the time but not the name. He was at the terrace window at seven forty-five when his cigarette went out on its own. His Compact channel described which corridors were unmonitored and when — which positions an unobserved person could use to reach the Ballroom. The iron required someone who knew which route was clear. The Baron's channel described exactly that route.",
    discovery_type: "scene_read_baron",
    grants_node: "scene_reads_as_baron",
  },

  {
    // CHAPTER THREE — Steward as the third story.
    // Candle iron + steward-bond: the corridor at 7:58 was covered under obligation.
    // The staging happened during the Steward's corridor window.
    // The Bond has operational instructions in the margin — corridor, timing, specific.
    id: "scene-read-steward",
    item_a: "candle-iron", item_b: "steward-bond", item_c: null,
    triggers_puzzle: false, result_item: null,
    locked_hint: "Talk to the Steward about the south corridor.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['steward_corridor_758'] && ni['bond_coerced_signed']);
    },
    discovery_text_double: "The candle iron and the Steward's Bond. The third amendment in the margin describes a specific position at a specific time — south corridor, seven fifty-eight. That corridor connects to the Ballroom approach. The Bond did not ask him to understand why. It asked him to clear a path and be in a position. He was in that position. The candle iron was in the Ballroom. Someone moved through the corridor he cleared to reach it.",
    discovery_type: "scene_read_steward",
    grants_node: "scene_reads_as_steward",
  },

  {
    // CHAPTER FOUR — Northcott as the fourth story.
    // Plain mask + northcott-arrival-record: the masked figure at 7:49 Vivienne sees
    // aligns with a gap in his record. He controls what goes in and out of the record.
    // A man who circles one entry and leaves gaps in two others is not a neutral witness.
    id: "scene-read-northcott",
    item_a: "plain-mask", item_b: "northcott-arrival-record", item_c: null,
    triggers_puzzle: false, result_item: null,
    locked_hint: "Talk to Northcott about the gaps in his record.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['northcott_two_absences'] && ni['northcott_placed_by_ashworth']);
    },
    discovery_text_double: "The plain mask and the arrival record. Northcott controls what the record shows. He circled one entry and left two gaps unmarked — seven-fifteen and seven fifty-five. The masked figure Vivienne saw at seven forty-nine was wearing a plain mask with no commission mark. The seven fifty-five gap puts Northcott unaccounted for near that window. Lord Ashworth placed him in the Foyer specifically — to keep the complete record. A man positioned to record every arrival is also positioned to control what the record omits.",
    discovery_type: "scene_read_northcott",
    grants_node: "scene_reads_as_northcott",
  },

  {
    // CHAPTER FIVE — Lady Ashworth as the fifth story.
    // Candle-request-note + estate-flower: she knew, she prepared, she had access.
    // She changed both sets of candles — which moved the candle iron's original position.
    // She had Ashworth's key. She was the last person to speak to him.
    id: "scene-read-ashworth",
    item_a: "candle-request-note", item_b: "estate-flower", item_c: null,
    triggers_puzzle: false, result_item: null,
    locked_hint: "Talk to Lady Ashworth about the candles and what she knew.",
    condition: () => {
      const ni = gameState.node_inventory || {};
      return !!(ni['ashworth_told_her_about_arrangement'] && ni['ashworth_planned_revelation']);
    },
    discovery_text_double: "The candle request note and the estate flower. She changed both sets of candelabras at seven-oh-five — before the Rite, before anyone else arrived. That change moved the candle iron from its ceremonial position in the Ballroom. The flower was found in the study. She had Ashworth's key. She knew he was in danger six weeks before tonight and came anyway. A woman who moves the iron, enters the study, and knows the evening will end badly is a woman who prepared for something.",
    discovery_type: "scene_read_ashworth",
    grants_node: "scene_reads_as_ashworth",
  },

    {
    id: "ink-reveal-trigger",
    item_a: "curators-note", item_b: "operational-brief", item_c: null,
    triggers_puzzle: true, puzzle_type: "ink-reveal", result_item: null,
    locked_hint: "The operational brief belongs to the Compact. Reach the other side first.",
    condition: () => {
      return !!(gameState.compactEvidenceFound || gameState.tunnelFound);
    },
    discovery_text_single: "Two documents. Estate and Compact. There is something in the margin of the operational brief.",
    discovery_text_double: "The Curator's arrangement note and the Compact's operational brief. Both reference the same investigator. The margin annotation on the brief is not in the Envoy's hand. It is in a third hand. Someone else has read this document.",
    discovery_type: "uninvited_annotation",
    grants_node: "uninvited_annotation_found",
  },
];

// ── ROOM OBJECTS CONSTANT ──────────────────────────────────
const ROOM_OBJECTS = {

  "balcony-railing-obj": {
    room: "balcony",
    tap_1: "The railing has a direct line of sight to the terrace below.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false,
    slow_drag: false, max_depth: 1,
    hotspot: { left: 30, top: 55, width: 40, height: 8 },
  },
  "balcony-case-obj": {
    room: "balcony",
    tap_1: "A medical bag on the balcony floor.",
    item_id: "balcony-case", item_at_depth: 1, is_essential: false, is_deception_item: false,
    slow_drag: false, max_depth: 1,
    hotspot: { left: 62.1, top: 75.5, width: 6.1, height: 3.8 },
  },
  "vault-panel": {
    room: "vault",
    tap_1: "A stone panel in the left wall. The seam is too clean. The surrounding wall has centuries of settling — this section does not.",
    tap_2: "The panel moves on a concealed mechanism. It was built into the vault when the vault was built.",
    item_at_depth: null, item_id: null, is_essential: false, is_deception_item: false, slow_drag: false,
    max_depth: 2, hotspot: { left: 34.9, top: 48.3, width: 14.1, height: 2.6 },
  },
  "vault-bookshelf-safe": {
    room: "vault",
    tap_1: "Floor to ceiling. Bond records, arrangement files, forty years of Estate decisions. Every spine identical. This is where the Estate keeps what it has decided about people.",
    tap_2: "One section is different. The books don\'t sit flush. The shelf doesn\'t quite meet the wall. Someone has been here recently — the dust pattern is wrong.",
    tap_3: "A brass plate behind the third shelf from the left. Four positions. The combination is not written anywhere in this building. It was assembled from four witnesses who were never in the same room.",
    item_at_depth: null, item_id: null, is_essential: true, is_deception_item: false, slow_drag: false,
    requires_item_for_depth_3: "safe-combination",
    max_depth: 3, hotspot: { left: 76.6, top: 43.8, width: 18.1, height: 3.9 },
  },
  "tunnel-door": {
    room: "wine-cellar", tap_1: "A door in the stone wall. No handle.",
    item_at_depth: null, item_id: null, is_essential: false, is_deception_item: false, slow_drag: false,
    max_depth: 1, hotspot: { left: 61.6, top: 32.1, width: 10.3, height: 8.8 },
  },

  // ── BILLIARD ROOM ──────────────────────────────────────────
  "billiard-table-obj": {
    room: "billiard-room",
    tap_1: "The table is set mid-game.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false,
    slow_drag: false, max_depth: 1,
    hotspot: { left: 18, top: 33, width: 42, height: 32 },
  },

  // ── LIBRARY ────────────────────────────────────────────────
  "chess-board-obj": {
    room: "library",
    tap_1: "A chess board mid-game. Greaves has been working through a position.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false,
    slow_drag: false, max_depth: 1,
    hotspot: { left: 5, top: 30, width: 40, height: 50 },
  },

  // ── FOYER ──────────────────────────────────────────────────
  "estate-flower-obj": {
    room: "foyer",
    tap_1: "A white flower. Left on the card table. Not dropped — placed. This morning, before any of this.",
    tap_2: "Lady Ashworth leaves flowers. It is a habit. This one was left for Edmund.",
    tap_3: "The stem is clean. The petals have not wilted. It has been here less than twelve hours.",
    item_id: "estate-flower", item_at_depth: 1, is_essential: false, is_deception_item: true, slow_drag: false, max_depth: 3,
    hotspot: { left: 64.1, top: 52.8, width: 3.7, height: 3.1 },
  },
  "curators-note-obj": {
    room: "foyer",
    tap_1: "A note on the invitation stand. Formal handwriting. Brief.",
    tap_2: "The Curator's hand. You have seen enough of his correspondence to know it.",
    tap_3: "It was left before the Rite. He knew where you would stand when you arrived.",
    item_id: "curators-note", item_at_depth: 1, is_essential: true, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 77.8, top: 52.8, width: 4.8, height: 3.3 },
  },
  "ashworth-seal-obj": {
    room: "ballroom",
    tap_1: "Something on the floor near the body. Small. Wax. Not dropped — placed.",
    tap_2: "A personal seal. The impression is yours. Your initial. Your mark. You have not been to this building before tonight.",
    tap_3: "Ashworth's hand is pointing at it. He placed it here before the Rite began. He knew you would be the one to find it.",
    item_id: "ashworth-seal", item_at_depth: 1, is_essential: true, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 74.5, top: 81.5, width: 5.2, height: 4.5 },
  },
  "northcott-log-obj": {
    room: "foyer",
    tap_1: "Northcott's notebook. Open to tonight's entries. Precise handwriting.",
    tap_2: "One entry is circled twice. 7:03PM. An arrival through the garden. Face not recorded.",
    tap_3: "The 7:03PM entry is the earliest arrival tonight. It precedes every member who signed in at the gate.",
    item_id: "northcott-notebook", item_at_depth: 1, is_essential: true, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 13, top: 52.2, width: 4, height: 4 },
  },
  "candle-request-obj": {
    room: "foyer",
    tap_1: "A slip of paper on the card table. Tonight's date. A request for both candelabra sets to be changed.",
    tap_2: "Lady Ashworth's hand. The time is written at the top — seven-oh-five this evening. Before the Rite.",
    tap_3: "She made the request in writing and kept a copy. She ensured the record existed.",
    item_id: "candle-request-note", item_at_depth: 3, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 72, top: 52.8, width: 3.5, height: 3.2 },
  },
  "unsigned-letter-obj": {
    room: "foyer",
    tap_1: "A letter on the invitation stand. No envelope. No seal. Left here deliberately — not delivered, placed.",
    tap_2: "Estate paper. The handwriting is deliberate. Someone chose every word carefully before they wrote it.",
    tap_3: "It was written for a specific reader. The assumptions it makes about what the reader already knows — that register belongs to someone who knew you. Or knew of you.",
    tap_4: "The last line. You have read past it twice without stopping. 'The last case you closed was not yours to close. Come to this house and find what is actually true. You will know it when you see it because it will be the thing you were not supposed to find.' He knew. Before tonight. Before this house. He chose you because of what was done to you. Not despite it. Because of it.",
    item_id: "unsigned-letter", item_at_depth: 1, is_essential: true, is_deception_item: true,
    slow_drag: false, max_depth: 4,
    hotspot: { left: 19, top: 52.3, width: 4.5, height: 3.5 },
  },
  "northcott-arrival-obj": {
    room: "foyer",
    tap_1: "A leather-bound record on the card table. Every arrival tonight. Precise handwriting.",
    tap_2: "He controls what is in this record. He also controls what is not. The 7:03PM entry is circled. Nothing else is.",
    tap_3: "A man who controls the arrival record and circles one entry is either a reliable witness or a very careful one. The distinction matters.",
    item_id: "northcott-arrival-record", item_at_depth: 3, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 26.6, top: 52.1, width: 4, height: 4 },
  },
  "northcott-placement-obj": {
    room: "antechamber",
    tap_1: "A sealed envelope behind the invitation stand. Addressed to Northcott. Ashworth's hand.",
    tap_2: "Six weeks ago. Ashworth wrote to Northcott directly. He told him where to stand, what to record, which door to watch.",
    tap_3: "He was placed here deliberately. He knew what tonight required before tonight arrived.",
    item_id: "northcott-placement-letter", item_at_depth: 3, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 13.7, top: 65.5, width: 4, height: 4 },
  },

  // ── GALLERY ────────────────────────────────────────────────
  "guest-book-obj": {
    room: "gallery",
    tap_1: "The guest book. Open to tonight's entries. Every member signed in.",
    tap_2: "One signature is different from the others. The ink is slightly fresher.",
    tap_3: "The entry is in the correct place in the sequence. The handwriting is not the person it claims to be.",
    item_id: "guest-book", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 70, top: 46.5, width: 4, height: 4 },
  },

  // ── STUDY ──────────────────────────────────────────────────
  "fireplace-obj": {
    room: "study",
    tap_1: "The fireplace is warm. Something was burned here within the last two hours.",
    tap_2: "Drag slowly — the fragments have not fully burned.",
    item_id: "burned-fragments", item_at_depth: 2, is_essential: true, is_deception_item: false, slow_drag: true,
    slow_drag_text: "Drag slowly through the ash.",
    max_depth: 2, hotspot: { left:-27.5, top:48.6, width:9.6, height:2.4 },
  },
  "bookcase-obj": {
    room: "study",
    tap_1: "Floor to ceiling. Estate Charter volumes. Every spine identical.",
    tap_2: "Volume three is slightly out of alignment. Someone has removed it recently.",
    tap_3: "The charter establishes the founding conditions of the Bond system. This volume covers the period forty years ago.",
    item_id: "estate-charter-vol3", item_at_depth: 2, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:99.7, top:36, width:4, height:4 },
  },
  "decanter-obj": {
    room: "study",
    tap_1: "A crystal decanter on the writing desk. The level is lower than a full pour.",
    tap_2: "One glass has been used. One has not. The used glass is on Lord Ashworth's side of the desk.",
    tap_3: "The decanter was opened tonight. The stopper is not fully replaced.",
    item_id: "study-decanter", item_at_depth: 1, is_essential: false, is_deception_item: true, slow_drag: false, max_depth: 3,
    hotspot: { left:113.7, top:70.2, width:7.3, height:4.5 },
  },
  "ashworths-last-note-obj": {
    room: "study",
    tap_1: "A note on the mantelpiece. Tonight's date at the top. Lord Ashworth's hand.",
    tap_2: "Addressed to no one. The last paragraph is precise. He knew this evening would be his last opportunity.",
    tap_3: "He did not know he would die. He knew he would not have another Rite to say what needed to be said.",
    item_id: "ashworths-last-note", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:163.3, top:76.4, width:4, height:4 },
  },

  // ── WRONG-PATH PHYSICAL EVIDENCE ──────────────────────────────
  // These objects corroborate wrong-path cases. Each one is a real
  // observation that the wrong-path player maps onto their suspect.
  // None of them prove murder. All of them feel like they do.

  // Lady Ashworth — garden bench beneath the balcony
  // Hatch saw her there at 7:40. Two minutes standing directly below
  // where Ashworth would fall five minutes later.
  // Wrong-path player reads: she was positioning herself.
  // Correct-path player eventually understands: she goes there every evening.
  // It is where she and Edmund used to sit before he stopped coming down.
  "garden-bench-obj": {
    room: "terrace",
    tap_1: "A stone bench at the garden edge. Below the balcony level. Something was left on it.",
    tap_2: "A folded handkerchief. Estate monogram — not his initials. Hers. Lady Ashworth was sitting here.",
    tap_3: "The position is directly below the balcony railing. A person sitting here at seven-forty would have been standing beneath the exact point where Lord Ashworth fell five minutes later. The handkerchief was not there at seven-thirty. It was there at eight-oh-two.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false,
    slow_drag: false, max_depth: 3,
    hotspot: { left: 15, top: 70, width: 8, height: 6 },
  },

  // Northcott — candelabra observation note
  // He noted the candelabra in his record at 7:30 and 7:40 — intact both times.
  // Wrong-path player reads: he was checking it was still there before he used it.
  // Correct-path player understands: he notes everything. It's what he does.
  "northcott-candelabra-note-obj": {
    room: "ballroom",
    tap_1: "A notation in the ballroom log. Northcott's hand. Time: 7:30. Time: 7:40. The same object noted twice.",
    tap_2: "The candelabra base. Noted intact at seven-thirty. Noted intact at seven-forty. The same object. Ten minutes apart. He was watching it.",
    tap_3: "A man who notes the same object twice in ten minutes is either very thorough or very specific. The candelabra iron was found near the body at eight-oh-two. Northcott noted it twice before it moved. He did not note it a third time.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false,
    slow_drag: false, max_depth: 3,
    hotspot: { left: 55, top: 65, width: 7, height: 5 },
  },
  "rite-programme-obj": {
    room: "study",
    tap_1: "The Rite programme on the writing desk. Tonight's order of ceremony.",
    tap_2: "Someone has written in the margin. Ashworth's hand. A single line beside the seven forty-five entry.",
    tap_3: "The annotation is precise. He wrote it before the Rite began, in this room. He knew the seven forty-five window would be used. He came anyway.",
    item_id: "rite-programme", item_at_depth: 2, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:66.8, top:41.2, width:4, height:4 },
  },
  "compact-keepsake-obj": {
    room: "study",
    tap_1: "A private correspondence drawer in the writing desk. Locked. The lock is small — not the estate lock. Personal.",
    tap_2: "The drawer is unlocked from the inside. Someone opened it tonight. Inside — two letters, institutional. And between them, something that does not belong to any institutional correspondence.",
    tap_3: "An object from elsewhere. Kept between forty years of professional correspondence in a locked personal drawer. Lady Ashworth has a key to this study. The question is not whether she knew this was here. The question is how long she has known.",
    item_id: "compact-keepsake", item_at_depth: 3, is_essential: false, is_deception_item: true,
    slow_drag: false, max_depth: 3,
    hotspot: { left:138.7, top:46.9, width:6, height:4 },
  },
  "lady-key-obj": {
    room: "study",
    tap_1: "A key on the mantelpiece. Not Ashworth's. The initials on the fob are not his.",
    tap_2: "The initials are hers. Lady Ashworth has a key to this study. She has had access whenever she chose.",
    tap_3: "The key has been used recently. The lock oil is fresh. She was in this room before the Rite began.",
    item_id: "lady-ashworths-key", item_at_depth: 3, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:132.4, top:73.5, width:4, height:4 },
  },
  "lady-letter-obj": {
    room: "library",
    tap_1: "A letter on the reading table. Not Ashworth's hand. Feminine. Written six weeks ago.",
    tap_2: "Lady Ashworth's writing. She is telling Edmund she knows what he is planning. She is asking him not to proceed.",
    tap_3: "He kept it. He did not act on her request. She knew he would not. She came tonight anyway.",
    item_id: "lady-ashworth-letter", item_at_depth: 3, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 3.6, top: 60.2, width: 4, height: 4 },
  },

  // ── ARCHIVE PATH ───────────────────────────────────────────
  "sealed-incident-obj": {
    room: "archive-path",
    tap_1: "A sealed case at the back of the archive. Not numbered. Not logged. Fourteen years of dust on the seal.",
    tap_2: "Lord Ashworth's personal mark. Not the Estate seal. He sealed this himself. Whatever is inside was his decision to contain.",
    tap_3: "The seal is intact. No one has opened this since Ashworth sealed it fourteen years ago. The specific thing he chose not to record is inside. A date. A location. A notation about a family arrangement. No names.",
    item_id: "sealed-incident-record", item_at_depth: 4, is_essential: false, is_deception_item: true,
    tap_4: "The location is the approach road to the east wing. A Tuesday in late autumn. A child. The document contains no name. The Steward has been in this building every day for fourteen years.",
    hotspot: { left: 85, top: 35, width: 5, height: 5 },
  },
  "archive-case-3": {
    room: "archive-path",
    tap_1: "Archive Case 3. Third from the left. The seal is broken.",
    tap_2: "The seal was broken from the inside — someone with a key, not a tool. This was opened by someone who had authorised access.",
    tap_3: "The document inside is gone. What remains is the impression in the lining — the weight of something pharmaceutical.",
    item_id: "unsigned-letter", item_at_depth: 1, is_essential: true, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:14.9, top:34, width:4, height:4 },
  },
  "case-3-wrapper-obj": {
    room: "archive-path",
    tap_1: "The original wrapper from Archive Case 3. Left on the floor beside the case.",
    tap_2: "A delivery timestamp. Six months ago. The bearer name is redacted. The destination is not.",
    tap_3: "The wrapper confirms the document was placed, not filed. Someone used the archive as a dead drop.",
    item_id: "case-3-wrapper", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:25.9, top:47.6, width:4, height:4 },
  },
  "voss-notes-obj": {
    room: "archive-path",
    tap_1: "Miss Voss's working notes. Six years of observations. Precise, unsparing.",
    tap_2: "Three entries are circled. Each one documents an irregularity she reported to the Curator. Each one was not acted on.",
    tap_3: "The most recent entry is from tonight. She noticed the broken seal at seven o'clock. She decided to wait and see who came back for it.",
    item_id: "voss-notes", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:7.2, top:66.5, width:4, height:4 },
  },
  "archive-filing-notes-obj": {
    room: "archive-path",
    tap_1: "Archive filing notes. Six years of accession records.",
    tap_2: "One entry from six months ago is in a different hand. The case number matches Case 3.",
    tap_3: "The filing note was added after the delivery. Someone documented the placement and did not use the standard hand.",
    item_id: "archive-filing-notes", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:2.9, top:31.1, width:4, height:4 },
  },
  "leather-document-roll-obj": {
    room: "archive-path",
    tap_1: "A leather document roll on the filing shelf. Sealed.",
    tap_2: "The seal is intact. It has not been opened. Someone placed it here and left it.",
    tap_3: "The exterior marking is a date from forty years ago. Whatever is inside has been waiting a long time.",
    item_id: "leather-document-roll", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:6.3, top:48.2, width:4, height:4 },
  },

  // ── LECTERN ────────────────────────────────────────────────
  "lectern-pen-obj": {
    room: "ballroom",
    tap_1: "A fountain pen on the right lectern. Estate issue. Used tonight.",
    tap_2: "The nib has been cleaned but not thoroughly. The ink matches the Register entries.",
    tap_3: "The wear pattern on the grip is specific — a left-handed writer. The Register entries were made right-handed.",
    item_id: "lectern-pen", item_at_depth: 1, is_essential: false, is_deception_item: true, slow_drag: false, max_depth: 3,
    hotspot: { left: 82.5, top: 81.9, width: 5.5, height: 3.6 },
  },

  // ── TERRACE ────────────────────────────────────────────────
  "terrace-sightline-obj": {
    room: "terrace",
    tap_1: "Stone flagging. The terrace runs the full width of the house. The balcony above is directly visible from here.",
    tap_2: "The balcony railing is unobstructed from this position. A person standing here at any point during the evening would have had a clear view of anyone at that railing.",
    tap_3: "The terrace faces the balcony directly. The distance is close enough that a person below would recognise what they were seeing. There is no position on this terrace from which the railing is not visible.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false,
    slow_drag: false, max_depth: 3,
    hotspot: { left: 40, top: 60, width: 20, height: 10 },
  },
  "terrace-map-obj": {
    room: "terrace",
    tap_1: "A garden map on the stone table. The Estate grounds. Every path marked.",
    tap_2: "One path is marked in a different hand. The hedge path. It ends at a gap that is not on the official map.",
    tap_3: "The gap in the hedge leads to the east gate. Someone has been using this route regularly. The path is worn.",
    item_id: "terrace-garden-map", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 1.9, top: 62.0, width: 4, height: 4 },
  },

  // ── BALLROOM ───────────────────────────────────────────────
  "ballroom-programme-obj": {
    room: "ballroom",
    tap_1: "Tonight's Rite programme. Dropped near the entry.",
    tap_2: "The order of proceedings is standard. One name is listed twice — once as presenter, once as witness.",
    tap_3: "The same name appears in both roles. That is irregular. The Rite does not permit a member to serve both functions.",
    item_id: "ballroom-programme", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 91.8, top: 81.6, width: 5.5, height: 4 },
  },
  "candle-iron-obj": {
    room: "ballroom",
    tap_1: "Something near Lord Ashworth's head. A candle iron — the cast iron base from the candelabra. Heavy. It should not be here.",
    tap_2: "The iron is separate from its candle. The wick is still in the holder. This was removed deliberately, not knocked over. Someone carried it and placed it here.",
    tap_3: "No blood. No hair. No tissue. Whatever this was placed here to suggest — it did not do what it was placed here to suggest. The body shows no evidence of blunt force. The candle iron is a staged conclusion.",
    tap_4: "The maid set the candles before the assembly. The holder was intact at seven o'clock. This iron arrived between seven and eight. Someone placed it here after Ashworth was already dead. The question is why.",
    item_id: "candle-iron", item_at_depth: 1, is_essential: true, is_deception_item: true,
    slow_drag: false, max_depth: 4,
    hotspot: { left: 38, top: 72, width: 6, height: 4 },
  },

  // ── ANTECHAMBER ────────────────────────────────────────────
  "writing-case-obj": {
    room: "antechamber",
    tap_1: "A leather writing case on the table. Estate monogram. Pemberton-Hale's.",
    tap_2: "The case is open. One sheet has been removed. The torn edge matches the unsigned letter found in the archive.",
    tap_3: "The paper weight and watermark are identical. The same hand. The same case. The same night.",
    item_id: "writing-case-evidence", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:4.9, top:66, width:4, height:4 },
  },
  "gloves-obj": {
    room: "antechamber",
    tap_1: "Formal gloves on the chair beside Pemberton-Hale.",
    tap_2: "The right index fingertip shows specific wear — consistent with pen grip over time. He writes with these on.",
    tap_3: "The wear is old. This is a habit, not tonight. He wears gloves when he writes things he does not want traced.",
    item_id: "gloves-evidence", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:86, top:65.6, width:4, height:4 },
  },

  // ── LIBRARY ────────────────────────────────────────────────
  "bond-record-vol-obj": {
    room: "library",
    tap_1: "A Bond record volume on the left shelves. Forty years of Estate obligations.",
    tap_2: "One entry is marked with a small pencil notation in the margin. Not the archivist's hand.",
    tap_3: "The notation is a date. Three months before the Rite. Someone was tracking this entry specifically.",
    item_id: "bond-record-volume", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:13.7, top:59.2, width:4, height:4 },
  },
  "warning-note-obj": {
    room: "library",
    tap_1: "A sealed note inside the chess notation book. Two sentences. No signature.",
    tap_2: "Be in the Library from seven. Do not leave before the Gavel.",
    tap_3: "The handwriting is the Curator's. Greaves has been here all evening because someone who knew tonight would matter told him to be.",
    item_id: "warning-note", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 95, top: 66.3, width: 4, height: 4 },
  },
  "debt-record-obj": {
    room: "library",
    tap_1: "A debt record on the table beside the chess set.",
    tap_2: "Greaves's name. A significant amount. The repayment column is empty — not unpaid, but discharged. Written off.",
    tap_3: "The discharge notation is in Ashworth's hand. Seven years ago. Greaves has been honouring this debt in service ever since.",
    item_id: "debt-record", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:89.3, top:61.2, width:4, height:4 },
  },

  // ── PHYSICIANS ─────────────────────────────────────────────
  "appointment-book-obj": {
    room: "physicians",
    tap_1: "Dr. Crane's appointment book on the examination table.",
    tap_2: "One entry is in a different ink. A private consultation three months ago. The name is in notation — not the patient's real name.",
    tap_3: "The notation resolves to a specific patient file. The same file appears in the Compact's medical channel records — a consultation that passed through an arrangement the Curator set up six months ago.",
    item_id: "appointment-book", item_at_depth: 1, is_essential: true, is_deception_item: true, slow_drag: false, max_depth: 3,
    hotspot: { left: 33.3, top: 59.8, width: 4, height: 4 },
  },
  "curators-document-obj": {
    room: "physicians",
    tap_1: "A formal document beside the medical bag. The Curator's seal at the bottom.",
    tap_2: "A record of a private meeting. Six months ago. Lord Ashworth and the Curator. The subject is listed as physician concern.",
    tap_3: "Ashworth warned him directly that the Compact's medical operative was not who he appeared. The Curator thanked him and took no action. He filed it. He returned to other matters.",
    item_id: "curators-document", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 53, top: 58.7, width: 4, height: 4 },
  },
  // ── SMOKING ────────────────────────────────────────────────
  "vault-door-obj": {
    room: "smoking",
    tap_1: "A door at the far end of the room. Heavy. No handle visible. A brass recess where a seal would sit.",
    tap_2: "The recess matches something in your inventory. This is what it was made for.",
    tap_3: "The seal fits. The mechanism responds.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false, slow_drag: false,
    max_depth: 3, tap_3_event: "vaultDoorTap",
    hotspot: { left:82.2, top:26.1, width:6.8, height:4.2 },
  },
  "baron-papers-obj": {
    room: "smoking",
    tap_1: "Papers on the card table. The Baron's handwriting.",
    tap_2: "Three years of informal correspondence. Names, dates, amounts. All of it pointing in one direction.",
    tap_3: "The Baron has been an information source for an organisation on the other side of a garden wall for three years. These papers are the record of that arrangement.",
    item_id: "barons-real-origins", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:36.4, top:43.1, width:4, height:4 },
  },
  "ashtray-obj": {
    room: "smoking",
    tap_1: "A crystal ashtray on the card table. One cigarette. Unfinished.",
    tap_2: "The ash is long. He lit it and did not smoke it. He was thinking, not smoking.",
    tap_3: "The cigarette went out on its own. He has been in this room since before eight o'clock. He has not moved.",
    item_id: "ashtray", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 73.3, top: 68, width: 4, height: 4 },
  },
  "correspondence-obj": {
    room: "smoking",
    tap_1: "A letter on the card table. Ashworth's hand. A Sunday. Three months ago.",
    tap_2: "The tone is different from his formal correspondence. Personal. Careful. He is warning someone without saying he is warning them.",
    tap_3: "The letter was never sent. The Baron has it. He has had it for three months and did not act on what it implied.",
    item_id: "ashworths-sunday-letter", item_at_depth: 1, is_essential: false, is_deception_item: true, slow_drag: false, max_depth: 3,
    hotspot: { left:19.6, top:42.7, width:4, height:4 },
  },
  "barons-file-obj": {
    room: "smoking",
    tap_1: "A file beside the Baron's chair. Incomplete.",
    tap_2: "Three pages have been removed. The cut edges are clean. This was done deliberately, not in haste.",
    tap_3: "The remaining pages establish the Baron's identity before the Estate. The missing pages establish what came before that.",
    item_id: "barons-incomplete-file", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left:16.2, top:63.5, width:4, height:4 },
  },
  "smoking-letters-obj": {
    room: "smoking",
    tap_1: "A bundle of correspondence on the side cabinet. Three years of letters.",
    tap_2: "The tone changes exactly eighteen months ago. What began as information exchange becomes instruction.",
    tap_3: "The Baron stopped being a source and became an asset. He did not notice when it happened. That is the design.",
    item_id: "smoking-letters", item_at_depth: 1, is_essential: false, is_deception_item: true, slow_drag: false, max_depth: 3,
    hotspot: { left:6.7, top:42.7, width:4, height:4 },
  },
  "baron-channel-obj": {
    room: "archive-path",
    tap_1: "A notebook in the archive. Columns of names. Dates. Contact references.",
    tap_2: "The entries stop three months ago. The last entry is a specific request — timing, room access, corridor coverage.",
    tap_3: "The Baron provided corridor access and timing information through a Compact contact channel. The last entry describes which corridors were unmonitored and when. He gave someone the map of the building's blind spots.",
    item_id: "baron-compact-channel", item_at_depth: 3, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 15.3, top: 62.2, width: 4, height: 4 },
  },
  "baron-window-obj": {
    room: "library",
    tap_1: "A notepad on the reading table. Not Greaves's hand. Two lines.",
    tap_2: "Seven-oh-five PM. Study. The name is not written. The time is.",
    tap_3: "Someone saw who left the study at seven-oh-five and wrote the time but not the name. The notepad was left in the Library.",
    item_id: "baron-study-observation", item_at_depth: 3, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 0, top: 34.6, width: 4, height: 4 },
  },

  // ── VAULT ──────────────────────────────────────────────────
  "arrangement-files-obj": {
    room: "vault",
    tap_1: "Seventeen arrangement files on the central table. Each one identical.",
    tap_2: "Seventeen Bonds. Seventeen members. Every arrangement the Estate has entered into in the past eleven years.",
    tap_3: "One file is thicker than the others. The additional pages are not in the Estate's standard format.",
    item_id: "arrangement-files", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 5.5, top: 55.3, width: 4, height: 4 },
  },
  "steward-bond-obj": {
    room: "vault",
    tap_1: "A Bond document on the upper right shelf. Not filed with the others.",
    tap_2: "The Steward's name. Two seals at the bottom — one Estate gold, one darker and unfamiliar.",
    tap_3: "He signed something eight years ago that he did not fully read. The second seal is not the Estate's. It has never been the Estate's.",
    item_id: "steward-bond", item_at_depth: 1, is_essential: true, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 36.9, top: 62.3, width: 8.4, height: 4.1 },
  },
  "surgeons-licensing-record-obj": {
    room: "vault",
    tap_1: "A document behind the arrangement files. Older than the others. A different paper stock.",
    tap_2: "A licensing board determination. Thirty years old. Three senior board members listed at the top. The chair's signature at the bottom.",
    tap_3: "Lord Ashworth's signature. He chaired the review that ended a physician's career thirty years ago. He kept a copy. He was building a record — not just of the Compact, but of the man inside it.",
    item_id: "surgeons-licensing-record", item_at_depth: 2, is_essential: true, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 12, top: 62, width: 5, height: 4 },
  },

  // ── WINE CELLAR ────────────────────────────────────────────



  // ── COMPACT ────────────────────────────────────────────────
  // (no interactive objects — Compact rooms are character and atmosphere only)
  "buried-bonds-obj": {
    room: "vault",
    tap_1: "A document on the lower shelf. Forty years of Bond records side by side.",
    tap_2: "Two columns. One Estate-issued. One from an external authority. The handwriting in the margin is the same across both.",
    tap_3: "Someone has been comparing these Bond records for years. The comparison was placed here for the investigation — whoever assembled this knew the Vault was where it would matter.",
    item_id: "buried-bonds-comparison", item_at_depth: 1, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 70.1, top: 62, width: 4, height: 4 },
  },

  "testimonies-wall-obj": {
    room: "library",
    tap_1: "A bound collection on the reading table. Witness accounts — four of them. No names. Dates only.",
    tap_2: "Four accounts from four people who were never in the same room. Each describes one moment of the same evening from a different position.",
    tap_3: "The accounts do not overlap. Together they describe something none of them could see alone. Someone assembled these specifically for tonight.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 86.5, top: 32.4, width: 11.9, height: 4.4 },
  },
  "planning-document-obj": {
    room: "archive-path",
    tap_1: "A document filed between the standard archive cases. Out of place — the paper stock is different.",
    tap_2: "Eight months of operational planning. Two handwriting styles — body text and margin corrections.",
    tap_3: "The margin corrections are more precise than the body text. Whoever corrected this understood the operational detail better than whoever planned it. This was placed here to be found.",
    item_id: null, item_at_depth: null, is_essential: false, is_deception_item: false, slow_drag: false, max_depth: 3,
    hotspot: { left: 26.2, top: 36.9, width: 4, height: 4 },
  },

  "hatch-plain-mask-obj": {
    room: "groundskeeper-cottage",
    tap_1: "Wall hooks beside the tools. Something hanging that does not belong. A mask. Plain. Unmarked. Not estate-issued.",
    tap_2: "A formal mask without the impressed detail of an estate piece. Hung among groundskeeping tools. Someone left this here. Someone who needed it for one specific evening and returned it after.",
    item_id: "plain-mask", item_at_depth: 2, is_essential: true, is_deception_item: false,
    slow_drag: false, max_depth: 2,
    hotspot: { left: 58, top: 18, width: 18, height: 25 },
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  },
};


// ── NOCTURNE ENGINE (event bus) ──────────────────────────────
const NocturneEngine = {
  _listeners: {},
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  },
};


// ── HAPTICS ────────────────────────────────────────────────
function haptic(pattern) {
  if (!gameSettings.hapticsEnabled) return;
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ── CLOCK ──────────────────────────────────────────────────
function getHourWindow() {
  const h = new Date().getHours();
  if (h >= 6  && h < 9)  return "early_morning";
  if (h >= 9  && h < 17) return "day";
  if (h >= 17 && h < 20) return "golden_hour";
  if (h >= 20 && h < 23) return "evening";
  if (h >= 23 || h < 2)  return "late";
  return "deep_night";
}

// ── INVENTORY ──────────────────────────────────────────────
function inventoryLimit() {
  return 15; // Fixed — difficulty removed
}

function inventoryFull() {
  return gameState.inventory.length >= inventoryLimit();
}

function hasItem(itemId) {
  return gameState.inventory.includes(itemId);
}

function collectItem(itemId) {
  if (gameState.inventory.includes(itemId)) return;
  if (ITEMS[itemId] && !ITEMS[itemId].is_droppable) {
    // Cannot collect non-droppable items (they're already in inventory)
    return;
  }
  // Remove from dropped_items if present
  for (const roomId of Object.keys(gameState.dropped_items)) {
    const idx = gameState.dropped_items[roomId].indexOf(itemId);
    if (idx !== -1) {
      gameState.dropped_items[roomId].splice(idx, 1);
      NocturneEngine.emit("mapUpdate", { roomId });
    }
  }
  gameState.inventory.push(itemId);
  haptic([20]);

  // Special flags
  if (itemId === "seal-placement-record") {
    gameState.sealRecordFound = true;
    NocturneEngine.emit("sealRecordFound", {});
  }
  // Clear essential glow
  const obj = Object.values(ROOM_OBJECTS).find(o => o.item_id === itemId);
  if (obj && obj.is_essential) clearEssentialGlow(itemId);

  NocturneEngine.emit("itemCollected", { itemId });
  NocturneEngine.emit("inventoryChanged", { inventory: gameState.inventory });
  checkRoomCompletion(gameState.currentRoom);
  saveGame();
}

function dropItem(itemId) {
  if (!ITEMS[itemId] || !ITEMS[itemId].is_droppable) return;
  const idx = gameState.inventory.indexOf(itemId);
  if (idx !== -1) gameState.inventory.splice(idx, 1);

  // Find the item's original room from ROOM_OBJECTS
  let originalRoom = null;
  for (const [objId, obj] of Object.entries(ROOM_OBJECTS)) {
    if (obj.item_id === itemId) { originalRoom = obj.room; break; }
  }

  // Drop back to original room if player is there, otherwise current room
  const room = (originalRoom && gameState.currentRoom === originalRoom)
    ? originalRoom
    : gameState.currentRoom;

  if (!gameState.dropped_items[room]) gameState.dropped_items[room] = [];
  if (!gameState.dropped_items[room].includes(itemId)) {
    gameState.dropped_items[room].push(itemId);
  }
  NocturneEngine.emit("itemDropped", { itemId, roomId: room });
  NocturneEngine.emit("inventoryChanged", { inventory: gameState.inventory });
  NocturneEngine.emit("mapUpdate", { roomId: room });
  saveGame();
}

// ── OBJECT INTERACTION ─────────────────────────────────────
function getObjectMaxDepth(obj) {
  // max_depth is now a flat number — difficulty removed
  if (typeof obj.max_depth === 'number') return obj.max_depth;
  // Legacy object shape — return scalar default
  if (obj.max_depth && typeof obj.max_depth === 'object') return obj.max_depth.observant || 1;
  return 1;
}

function tapObject(objectId, tapX, tapY) {
  const obj = ROOM_OBJECTS[objectId];
  if (!obj) return;

  if (!gameState.examined_objects.includes(objectId)) {
    gameState.examined_objects.push(objectId);
  }

  // billiard-table-obj — launches standalone billiards mini-game
  if (objectId === 'billiard-table-obj') {
    if (typeof window.openBilliards === 'function') {
      window.openBilliards();
    } else {
      showToast('Billiards script not loaded. Add <script src="%PUBLIC_URL%/billiards.js"></script> to index.html.');
      console.error('[billiards] window.openBilliards is undefined — billiards.js is not loaded');
    }
    return;
  }

  // chess-board-obj — launches standalone chess game vs Greaves
  if (objectId === 'chess-board-obj') {
    if (typeof window.openChess === 'function') {
      window.openChess();
    } else {
      showToast('Chess script not loaded. Add <script src="chess.js"></script> to index.html.');
      console.error('[chess] window.openChess is undefined — chess.js is not loaded');
    }
    return;
  }

  // vault-door-obj — seal required, fires tapVaultDoor directly
  if (objectId === 'vault-door-obj') {
    if (!hasItem('ashworth-seal')) {
      showToast('The recess requires a personal seal.');
      return;
    }
    tapVaultDoor();
    return;
  }

  // vault-panel — tap opens examine panel; closing it auto-triggers descent (see closeExaminePanel in ui.js)
  if (objectId === 'vault-panel') {
    if (gameState._cellarMomentFired) return; // already descended — ignore re-taps
    NocturneEngine.emit('openExaminePanel', { objectId, tapX, tapY });
    return;
  }

  // tunnel-door — fires tunnel directly; no examine panel
  if (objectId === 'tunnel-door') {
    if (gameState.tunnelFound) {
      // Return visit — navigate directly
      navigateTo('c6-tunnel');
      if (typeof renderCurrentRoom === 'function') renderCurrentRoom();
      if (typeof renderRoomNav === 'function') renderRoomNav();
    } else {
      NocturneEngine.emit('tunnelDoorOpens', {});
      NocturneEngine.emit('tunnelEntered', {});
    }
    return;
  }

  // vault-bookshelf-safe — depth 3 calls tapVaultSafe()
  if (objectId === 'vault-bookshelf-safe') {
    const taps = gameState.object_taps[objectId] || 0;
    if (taps >= 2) {
      // At depth 3 — attempt to open safe
      tapVaultSafe();
      return;
    }
    // Depth 1 or 2 — show examine text normally
    NocturneEngine.emit("openExaminePanel", { objectId, tapX, tapY });
    return;
  }

  // tap_3_event
  if (obj.tap_3_event) {
    const taps = gameState.object_taps[objectId] || 0;
    if (taps >= 2 && !gameState.fired_chains.includes(obj.tap_3_event)) {
      gameState.fired_chains.push(obj.tap_3_event);
      NocturneEngine.emit(obj.tap_3_event, { objectId });
    }
  }
  // tap_2_event
  if (obj.tap_2_event) {
    const taps = gameState.object_taps[objectId] || 0;
    if (taps >= 1 && !gameState.fired_chains.includes(obj.tap_2_event)) {
      gameState.fired_chains.push(obj.tap_2_event);
      NocturneEngine.emit(obj.tap_2_event, { objectId });
    }
  }

  // Slow drag — drag mechanic
  if (obj.slow_drag) {
    NocturneEngine.emit("openSlowDrag", { objectId });
    return;
  }

  if (!obj.item_id) {
    NocturneEngine.emit("openExaminePanel", { objectId, tapX, tapY });
    return;
  }

  showTapPopup(objectId, tapX, tapY);
  checkRoomCompletion(gameState.currentRoom);
}

function showTapPopup(objectId, tapX, tapY) {
  const obj = ROOM_OBJECTS[objectId];
  const alreadyHave = obj.item_id && hasItem(obj.item_id);
  NocturneEngine.emit("showPopup", { objectId, tapX, tapY, alreadyHave });
}

function handlePickUp(itemId) {
  if (!inventoryFull()) {
    collectItem(itemId);
    NocturneEngine.emit("itemEmergeAnimation", { itemId });
  } else {
    openInlineDropSelector(itemId);
  }
}

function handleKeep(itemId) {
  if (!inventoryFull()) {
    collectItem(itemId);
    NocturneEngine.emit("itemEmergeAnimation", { itemId });
    NocturneEngine.emit("closeExaminePanel", {});
  } else {
    openInlineDropSelector(itemId);
  }
}

function openInlineDropSelector(incomingItemId) {
  NocturneEngine.emit("openInlineDropSelector", {
    incomingItemId,
    currentInventory: [...gameState.inventory],
  });
}

function executeInlineDrop(dropItemId, incomingItemId) {
  dropItem(dropItemId);
  collectItem(incomingItemId);
  NocturneEngine.emit("itemEmergeAnimation", { itemId: incomingItemId });
  NocturneEngine.emit("closeInlineDropSelector", {});
  NocturneEngine.emit("closeExaminePanel", {});
}

// ── ESSENTIAL GLOW ─────────────────────────────────────────
function markHotspotEssentialLeft(objectId) {
  gameState.essential_left[objectId] = true;
  NocturneEngine.emit("essentialGlowOn", { objectId });
}

function clearEssentialGlow(objectId) {
  delete gameState.essential_left[objectId];
  NocturneEngine.emit("essentialGlowOff", { objectId });
}

// ── ROOM NAVIGATION ────────────────────────────────────────
function navigateTo(roomId) {
  // PROLOGUE GATE — replaces old PAID_ROOMS check.
  // Old paid-spine paywall is gone; new gate is post-Hale only.
  if (gameState.prologueActive && typeof isPrologueRoomAccessible === 'function') {
    if (!isPrologueRoomAccessible(roomId)) {
      if (typeof showToast === 'function') showToast('That room is not accessible.');
      return;
    }
  }
  const hour = getHourWindow();
  const prevRoom = gameState.currentRoom;
  if (prevRoom && prevRoom !== roomId) {
    NocturneEngine.emit("roomLeft", { roomId: prevRoom });
  }
  gameState.currentRoom = roomId;
  visitRoom(roomId);
  NocturneEngine.emit("roomEntered", { roomId, hourWindow: hour });
  checkDroppedItemTray(roomId);
  saveGame();
}

function visitRoom(roomId) {
  if (!gameState.rooms[roomId]) return;
  gameState.rooms[roomId].state = "visited";
  NocturneEngine.emit("roomVisited", { roomId });
  (ROOM_ADJACENCY[roomId] || []).forEach(adj => discoverRoom(adj));
  // ashworth-seal seeding removed — now a physical foyer pickup (ashworth-seal-obj)
}

function discoverRoom(roomId) {
  if (!gameState.rooms[roomId]) return;
  if (roomId === 'vault' && !gameState.vaultDoorOpen) return; // hidden until seal used
  if (gameState.rooms[roomId].state === "undiscovered") {
    gameState.rooms[roomId].state = "adjacent";
    NocturneEngine.emit("roomDiscovered", { roomId });
  }
}

function revealSecretRoom(roomId) {
  if (!gameState.rooms[roomId]) return;
  gameState.rooms[roomId].state = "visited";
  NocturneEngine.emit("secretRoomRevealed", { roomId });
}

function completeRoom(roomId) {
  if (!gameState.rooms[roomId]) return;
  gameState.rooms[roomId].completed = true;
  gameState.rooms[roomId].state = "completed";
  gameState.verdictTracker.rooms_completed++;
  NocturneEngine.emit("roomCompleted", { roomId });
}

const ROOM_ESSENTIAL_OBJECTS = {
  'vault':                ['vault-bookshelf-safe','steward-bond-obj','surgeons-licensing-record-obj'],
  'foyer':               ['curators-note-obj','northcott-log-obj','unsigned-letter-obj'],
  'ballroom':            ['ashworth-seal-obj','candle-iron-obj'],
  'study':               ['fireplace-obj'],
  'archive-path':        ['archive-case-3'],
  'physicians':          ['appointment-book-obj'],
  'groundskeeper-cottage': ['hatch-plain-mask-obj'],
};

function checkRoomCompletion(roomId) {
  const required = ROOM_ESSENTIAL_OBJECTS[roomId] || [];
  const allExamined = required.every(id => gameState.examined_objects.includes(id));
  if (allExamined && !gameState.rooms[roomId]?.completed) {
    completeRoom(roomId);
  }
}

function checkDroppedItemTray(roomId) {
  const dropped = gameState.dropped_items[roomId] || [];
  if (dropped.length > 0) {
    NocturneEngine.emit("showDropTray", { roomId, items: dropped });
  }
}

// ── HEDGE GAP ──────────────────────────────────────────────
function checkHedgeGapTrigger() {
  // Hedge path removed. Only entrance to Compact is via wine-cellar tunnel door.
  // This function is a no-op.
}

// ── VAULT DOOR TAP — from smoking room hotspot ─────────────
NocturneEngine.on('vaultDoorTap', () => {
  tapVaultDoor();
});

// ── VAULT PANEL TAP — DEV, restore slow_drag before launch ──
NocturneEngine.on('vaultPanelTap', () => {
  NocturneEngine.emit('closeExaminePanel', {});
  setTimeout(() => completeVaultPanelDrag(), 300);
});

// ── WINE CELLAR FIRST ENTRY ─────────────────────────────────
NocturneEngine.on('roomEntered', ({ roomId }) => {
  if (roomId === 'wine-cellar' && !gameState._cellarMomentFired) {
    gameState._cellarMomentFired = true;
    NocturneEngine.emit('momentReveal', {
      type: 'wine-cellar',
      text: "Stone stairs descend into cold air. The panel has moved exactly far enough. Not an accident. This was built to move.\n\nOn the rack beside the entrance — a folded slip of paper. Not placed accidentally. Placed deliberately, at the height where an investigator would see it while deciding whether to proceed.\n\nOne line. No signature.\n\n'The investigator will find the tunnel before he finds the cellar door. He usually does.'\n\nPresent tense. Written before tonight. Already true.\n\nYou have been in this building for over an hour. You have been managed for longer than that. The tunnel was not discovered. It was left open. The investigation you have been conducting was anticipated before it began.\n\nThe stairs descend. The cold air comes up. Whatever is down there was prepared for you specifically.\n\nYou can go back.\n\nYou won't.",
      haptic: [10, 10, 10, 10, 30],
      screenDim: true,
    });
  }
});
function tapVaultDoor() {
  // Door: token only
  if (hasItem("ashworth-seal")) {
    gameState.vaultDoorOpen = true;
    discoverRoom('vault'); // now visible in nav
    haptic([60, 40, 100]);
    // Player interiority — the key you've been carrying
    NocturneEngine.emit("momentReveal", {
      type: "vault-door",
      text: "You have been carrying the key to this room since the ballroom. You did not know what it opened. That is the correct version of events. It does not make you less responsible for what it opens.",
      haptic: [],
      screenDim: false,
    });
    NocturneEngine.emit("vaultDoorOpened", {});
    NocturneEngine.emit("navigateAllowed", { roomId: "vault" });
  } else {
    NocturneEngine.emit("vaultDoorLocked", { message: "The mechanism requires a personal seal." });
  }
}

function tapVaultFileCase() {
  // Lore object only — the safe (vault-bookshelf-safe) handles vaultOpen
  NocturneEngine.emit("momentReveal", {
    type: "vault-file-case",
    text: "The impression in the brass is still soft. Your seal. Your mark. Left here before you knew what this building was. The case holds the Compact's record of what you were positioned to be. You have been carrying this arrangement since before tonight.",
    haptic: [20],
    screenDim: false,
  });
}

// ── VAULT SAFE ─────────────────────────────────────────────
function tapVaultSafe() {
  if (!gameState.vaultDoorOpen) {
    NocturneEngine.emit("vaultSafeLocked", { message: "The Vault door must be opened first." });
    return;
  }
  if (!hasItem("safe-combination")) {
    NocturneEngine.emit("vaultSafeLocked", {
      message: "Four positions. The combination is not in this room. It was assembled from four witnesses who were never in the same room."
    });
    return;
  }
  if (gameState.vaultOpen) {
    // Already open — just emit so UI can re-show contents
    NocturneEngine.emit("vaultSafeAlreadyOpen", {});
    return;
  }

  // Safe opens
  gameState.vaultOpen = true;
  haptic([20, 40, 20, 100]);

  NocturneEngine.emit("momentReveal", {
    type: "vault-safe-open",
    text: "The third shelf from the left. The brass plate takes the combination without resistance — it was designed for this specific moment by someone who expected you to arrive at it. The shelf swings out. Cold air. Stone behind it. Two documents. Lord Ashworth placed the first. Someone else placed the second. Both were waiting for tonight.",
    haptic: [],
    screenDim: true,
  });

  NocturneEngine.emit("vaultOpened", {});
  NocturneEngine.emit("activateFourthPedestal", { label: "THE RECORD" });

  // Release safe contents — seal placement record is the deep ending item
  if (!gameState.inventory.includes("seal-placement-record")) {
    produceResultItem("seal-placement-record");
  }

  saveGame();
}

// ── VAULT PANEL ────────────────────────────────────────────
function completeVaultPanelDrag() {
  revealSecretRoom("wine-cellar");
  haptic([0]); // silence is the sensation
  NocturneEngine.emit("vaultPanelOpen", {});
  // Navigate directly — roomEntered fires the cold air moment on first entry
  navigateTo("wine-cellar");
  if (typeof renderCurrentRoom === 'function') renderCurrentRoom();
  if (typeof renderRoomNav === 'function') renderRoomNav();
}

// ── TUNNEL DOOR ────────────────────────────────────────────
function tapTunnelDoor() {
  NocturneEngine.emit("tunnelDoorOpens", {});
  NocturneEngine.emit("tunnelEntered", {}); // sound trigger
}

// ── COMPACT ────────────────────────────────────────────────
function arriveAtCompact(entrance) {
  gameState.tunnelFound = true;
  gameState.tunnelEntranceUsed = entrance;
  gameState.compactAccessible = true;
  gameState.verdictTracker.tunnel_found = true;
  gameState.verdictTracker.tunnel_entrance_used = entrance;

  // Layer 1 — entry: tunnel mouth + arrival room (where Archivist plays piano)
  visitRoom('c6-tunnel');
  visitRoom('c1-arrival');
  // Layer 2 — only rooms directly adjacent to c1-arrival on the map
  discoverRoom('c7-study');
  // c3-original is NOT adjacent to arrival — surfaces when portraits is entered
  // Layer 3 (register, agreement, correspondence) surface when layer 2 entered
  // Layer 4 (gallery, reckoning) surface when layer 3 entered — earned, not given

  NocturneEngine.emit("compactUnlocked", { entrance });
  NocturneEngine.emit("mapRevealCompact", {});
  saveGame();
}

// ── COMBINATION SYSTEM ─────────────────────────────────────
function tapInventoryItem(itemId) {
  // First tap — select
  if (!gameState.selectedItem) {
    gameState.selectedItem = itemId;
    NocturneEngine.emit("itemSelected", { itemId });
    return;
  }
  // Second tap on same item — open examine panel
  if (gameState.selectedItem === itemId) {
    gameState.selectedItem = null;
    openItemExaminePanel(itemId);
    return;
  }
  // Second tap on different item — attempt combine
  const itemA = gameState.selectedItem;
  const itemB = itemId;
  gameState.selectedItem = null;
  attemptCombine(itemA, itemB, null);
}

function openItemExaminePanel(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;

  // Track item examine depth
  const taps = gameState.item_taps[itemId] || 0;
  const maxDepth = getItemExamineMaxDepth(item, itemId);
  const depthKey = `examine_${Math.min(taps + 1, maxDepth)}`;
  const text = item[depthKey] || item.examine_1 || item.name;
  const hasMore = (taps + 1) < maxDepth;

  gameState.item_taps[itemId] = taps + 1;

  NocturneEngine.emit("openItemExaminePanel", { itemId, text, hasMore, taps: taps + 1 });
}

function getItemExamineMaxDepth(item, itemId) {
  let d = 0;
  while (item[`examine_${d + 1}`]) d++;
  // Token depth 4 only when enabled
  if (false) { // ashworth-seal depth gate removed — difficulty removed
    d = Math.min(d, 3);
  }
  return Math.max(d, 1);
}

function attemptCombine(itemA, itemB, itemC) {
  const result = attemptCombineWithStatus(itemA, itemB, itemC);
  if (result.status === 'no_match') NocturneEngine.emit("combinationFailed", { itemA, itemB });
}

function attemptCombineWithStatus(itemA, itemB, itemC) {
  const chain = findCombinationChain(itemA, itemB, itemC);
  if (!chain) return { status: 'no_match' };

  // Check condition gate — return hint message for UI
  if (chain.condition && !chain.condition()) {
    return { status: 'locked', hint: chain.locked_hint || 'Investigate further to unlock.' };
  }

  fireFullDiscovery(chain, itemA, itemB, itemC);
  return { status: 'fired' };
}
function findCombinationChain(itemA, itemB, itemC) {
  return COMBINATION_CHAINS.find(chain => {
    if (gameState.fired_chains.includes(chain.id)) return false;
    const matchAB = (chain.item_a === itemA && chain.item_b === itemB) ||
                    (chain.item_a === itemB && chain.item_b === itemA);
    const matchC = !chain.item_c || chain.item_c === itemC;
    return matchAB && matchC;
  }) || null;
}

function fireFullDiscovery(chain, itemA, itemB, itemC) {
  gameState.fired_chains.push(chain.id);
  if (chain.triggers_puzzle) {
    NocturneEngine.emit("openPuzzle", { puzzleType: chain.puzzle_type, chain });
    return;
  }
  const text = itemC ? chain.discovery_text_triple
             : itemB ? chain.discovery_text_double
             : chain.discovery_text_single;
  NocturneEngine.emit("discoveryFired", { itemA, itemB, itemC, result_item: chain.result_item, text });
  if (chain.result_item) produceResultItem(chain.result_item);
  if (chain.discovery_type) trackEvidenceDiscovery(chain.discovery_type);
  if (chain.grants_node) {
    if (!gameState.node_inventory) gameState.node_inventory = {};
    gameState.node_inventory[chain.grants_node] = true;
    NocturneEngine.emit('nodeMarked', { nodeId: chain.grants_node, charId: null });
  }
}

function produceResultItem(itemId) {
  if (inventoryFull()) {
    const room = gameState.currentRoom;
    if (!gameState.dropped_items[room]) gameState.dropped_items[room] = [];
    gameState.dropped_items[room].push(itemId);
    NocturneEngine.emit("resultItemDropped", { itemId, roomId: room });
    NocturneEngine.emit("mapUpdate", { roomId: room });
  } else {
    collectItem(itemId);
  }
}

// ── PUZZLE SYSTEM ──────────────────────────────────────────
function puzzleFailed(puzzleId) {
  if (!gameState.puzzle_fail_counts[puzzleId]) gameState.puzzle_fail_counts[puzzleId] = 0;
  gameState.puzzle_fail_counts[puzzleId]++;
  gameState.verdictTracker.puzzles_attempted++;
  const fails = gameState.puzzle_fail_counts[puzzleId];

  if (fails === 3) NocturneEngine.emit("puzzleHint", { puzzleId, tier: 1 });
  if (fails === 5) NocturneEngine.emit("puzzleHint", { puzzleId, tier: 2 });
  if (fails === 7) NocturneEngine.emit("showWalkthroughButton", { puzzleId });

  const cooldown = 0; // Fixed — no cooldown, difficulty removed
  if (cooldown > 0) {
    gameState.puzzle_cooldown_active[puzzleId] = Date.now() + cooldown;
    NocturneEngine.emit("puzzleCooldown", { puzzleId, duration: cooldown });
  }
}

function puzzleSolved(puzzleId, resultItem) {
  gameState.puzzles_solved.push(puzzleId);
  const fails = gameState.puzzle_fail_counts[puzzleId] || 0;
  if (fails <= 2) gameState.verdictTracker.puzzles_solved_clean++;
  else gameState.verdictTracker.puzzles_solved_hinted++;

  if (resultItem) produceResultItem(resultItem);

  // Register licensing extract: only after bond-reconstruction
  if (puzzleId === "bond-reconstruction") {
    gameState.compactCaseAssembled = true;
    NocturneEngine.emit("compactCaseAssembled", {});
  }

  // Witness Map — safe combination assembled. Point player back to the Vault.
  if (puzzleId === "witness-map") {
    NocturneEngine.emit("momentReveal", {
      type: "safe-combination-found",
      text: "Four observations. Four positions. The same mark in four different hands across four different moments of the same evening. The Witness Map produced one thing — a sequence. You know where it belongs. The Vault. The bookshelf that doesn't sit flush. Ashworth placed something there before the Rite began. He expected you to arrive at it.",
      haptic: [20, 10, 20],
      screenDim: false,
    });
  }

  // Ink Reveal — Uninvited's annotation found.
  if (puzzleId === "ink-reveal") {
    gameState.grants_nodes = gameState.grants_nodes || [];
    if (!gameState.grants_nodes.includes("uninvited_annotation_found")) {
      gameState.grants_nodes.push("uninvited_annotation_found");
    }
    NocturneEngine.emit("momentReveal", {
      type: "uninvited-annotation",
      text: "The annotation is in the margin of the operational brief. Visible at fifteen degrees. Not the Envoy's hand. A third hand. Three years of notes in the same margin. The most recent: 'Asset confirmed. Investigation will proceed as designed. Manage the outcome.' You have been the outcome since before you arrived.",
      haptic: [10, 10, 10, 30],
      screenDim: false,
    });
  }

  haptic([40, 20, 40]);
  NocturneEngine.emit("puzzleSolved", { puzzleId, resultItem });
  saveGame();
}

// ── VIVIENNE WITNESS — produces moment evidence ─────────────
// When Vivienne Branch C fires and vivienne_push_witnessed is granted,
// produce witness-testimony-vivienne into inventory.
// This is the only moment evidence for the Surgeon conviction.
// ── SURGEON-CRANE CONSPIRACY LETTER PUZZLE THRESHOLD ──────────
// Fires when player has answered all 5 Surgeon + 4 Crane
// timeline_critical questions (9 unique grants_node values).
// Both arcs at maximum depth. The plan and the execution.
const CRANE_LETTER_NODES = [
  // Surgeon — 5 TC questions → 4 unique nodes
  'surgeon_committed_745_south_corridor',
  'surgeon_admits_balcony_level',
  'surgeon_confronted_with_three_items',
  'surgeon_on_balcony_challenged',
  // Crane — 4 TC questions → 4 unique nodes
  'crane_arrived_at_call',
  'crane_first_visit_ashworth_alive',
  'crane_said_yes',
  'crane_floor_clear_705',
];

function _checkCraneLetterThreshold() {
  const ni = gameState.node_inventory || {};
  const allMet = CRANE_LETTER_NODES.every(n => ni[n] === true);
  if (!allMet) return;
  // Already unlocked — don't fire twice
  if (gameState._cranePuzzleUnlocked) return;
  gameState._cranePuzzleUnlocked = true;
  saveGame();
  // Notify player puzzle is available
  NocturneEngine.emit('momentReveal', {
    type: 'crane-letter-available',
    text: "Two arcs. One physician who planned. One physician who executed. Neither had the complete picture. You are the only person in this building who does. The letter is assembling itself.",
    haptic: [20, 10, 20, 10, 60],
    screenDim: true,
  });
  // Emit puzzle unlock — UI can show puzzle available indicator
  NocturneEngine.emit('puzzleUnlocked', { puzzleType: 'surgeon-crane-conspiracy-letter' });
  NocturneEngine.emit('activateAccomplicePedestal', {});
}

// ── TIMELINE CONTRADICTION MAP ────────────────────────────
// When a true timeline node is granted, the times listed here
// are added to gameState.discredited_times.
// Board renders those times with red strikethrough.
const CONTRADICTION_MAP = {
  // Surgeon — false: "south corridor at 7:45"
  // Cracked by: greaves_maskless_witness (unmasked on terrace stairs at 7:48)
  'greaves_maskless_witness':            ['7:45 PM'],

  // Surgeon — false: "south corridor at 8:01"
  // Cracked by: SC1 (placed on balcony, not south corridor)
  'surgeon_on_balcony_challenged':       ['8:01 PM', '8:00 PM'],

  // PH — false: "Ballroom from seven"
  // Cracked by: ph_steward_corridor (at lectern 7:40, corridor 7:44)
  'ph_steward_corridor':                 ['7:00 PM'],

  // Steward — false: "Gallery at 7:58"
  // Cracked by: steward_corridor_758 (south corridor not gallery)
  'steward_corridor_758':                ['7:58 PM'],

  // Baron — false: "Smoking Room all evening"
  // Cracked by: baron_705_observation (at window 7:44-7:49)
  'baron_705_observation':               ['7:44 PM', '7:45 PM', '7:46 PM', '7:47 PM', '7:48 PM', '7:49 PM'],

  // Lady Ashworth — false: "arrived at seven"
  // Cracked by: ashworth_planned_revelation (garden at 7:40)
  'ashworth_planned_revelation':         ['7:00 PM'],

  // Northcott — false: "at post in foyer"
  // Cracked by: surgeon_contact_refused (came to cottage 7:35)
  'surgeon_contact_refused':             ['7:35 PM'],

  // Crane — false: "no upstairs visit at 7:05" / "only one visit"
  // Cracked by: crane_first_visit_ashworth_alive + crane_floor_clear_705
  'crane_first_visit_ashworth_alive':    ['7:05 PM'],
  'crane_floor_clear_705':              ['7:05 PM'],

  // Vivienne push — false romantic reading cracked
  // Cracked by: vivienne_push_witnessed
  'vivienne_push_witnessed':             [],
};

function _applyContradictions(nodeId) {
  const times = CONTRADICTION_MAP[nodeId];
  if (!times || times.length === 0) return;
  if (!gameState.discredited_times) gameState.discredited_times = [];
  times.forEach(t => {
    if (!gameState.discredited_times.includes(t)) {
      gameState.discredited_times.push(t);
    }
  });
  saveGame();
}

NocturneEngine.on('nodeMarked', ({ nodeId }) => {
  // nodeMarked fires from characters.js and interrogation.js askQuestion()
  // Write to node_inventory (belt-and-suspenders — characters.js also writes it)
  if (gameState.node_inventory && nodeId) {
    gameState.node_inventory[nodeId] = true;
  }
  // Apply timeline contradictions — discredit false times
  _applyContradictions(nodeId);
  // Check all thresholds
  _checkCraneLetterThreshold();
  // Re-emit as nodeGranted for any other listeners
  NocturneEngine.emit('nodeGranted', { nodeId });
});

NocturneEngine.on('nodeGranted', ({ nodeId }) => {
  // Check crane letter threshold on every node grant
  _checkCraneLetterThreshold();

  if (nodeId === 'vivienne_push_witnessed') {
    if (!gameState.inventory.includes('witness-testimony-vivienne') &&
        !Object.values(gameState.dropped_items || {}).some(arr => arr.includes('witness-testimony-vivienne'))) {
      produceResultItem('witness-testimony-vivienne');
      haptic([20, 10, 20, 10, 40]);
      NocturneEngine.emit('momentReveal', {
        type: 'witness-testimony',
        text: "One sentence. Present tense. From a witness on the terrace at seven forty-five who has been carrying it since the moment it happened and has just put it down. You now have what the investigation required.",
        haptic: [],
        screenDim: false,
      });
    }
  }
});


// Fires when player examines:
//   (a) Steward Bond at depth 3 — two seals, outside co-signer
//   (b) Hedge path stone marker at depth 2 — same mark, tunnel entrance nearby
// Either discovery activates the fourth pedestal.
// The tunnel is not revealed. The hunger is.
NocturneEngine.on('secondSealFound', ({ objectId }) => {
  if (gameState.compactEvidenceFound) return; // already found
  gameState.compactEvidenceFound = true;

  // Moment reveal — only vault path remains (steward-bond at depth 3)
  NocturneEngine.emit('momentReveal', {
    type: 'second-seal',
    text: "Two seals. The Estate's — and one other. This Bond was co-signed by someone outside this building six years ago. They have their own seal. Their own authority. Their own arrangement with the Steward. They are not on any guest list tonight.",
    haptic: [20, 10, 20],
  });

  saveGame();
});

function takeWalkthrough(puzzleId) {
  gameState.verdictTracker.puzzle_walkthroughs_taken++;
  gameState.verdictTracker.puzzles_walked_through.push(puzzleId);
  NocturneEngine.emit("walkthroughTaken", { puzzleId });
}

// ── DECEPTION SYSTEM ───────────────────────────────────────
function getSurgeonMaxDepth() {
  const required = ["cipher-trigger", "bond-reconstruction-trigger"];
  const allSolved = required.every(id => gameState.puzzles_solved.includes(id));
  return allSolved ? 4 : 3;
}

function fireDeception(charId, itemId) {
  if (gameState.deceptions_remaining <= 0) return;
  const isCompact = charId.startsWith("c-") || ["sovereign","heir","envoy","archivist"].includes(charId);
  // Capture composure BEFORE the hit — used for fracture-window check after deception resolves
  const _charStateBefore = gameState.characters[charId] || {};
  const _composureBefore = _charStateBefore.composure !== undefined ? _charStateBefore.composure : 100;
  // NOTE: deceptions_remaining decrement deferred to end of function — slot may be preserved if fracture-window hit
  gameState.verdictTracker.deceptions_used++;

  const DECEPTION_TABLE = {
    "steward": {
      "estate-flower":  { response: "Impossible — the cabinet is locked.", is_effective: true, composure_effect: -15 },
      "curators-note":  { response: "That document doesn't — the Curator would never — I see.", is_effective: true, composure_effect: -15 },
      "unsigned-letter": { response: "Where did you find that.", is_effective: true, composure_effect: -20 },
      "bond-record-volume": { response: "I have read that volume. The Estate keeps a copy in the Library. Members consult it. I have consulted it many times.", is_effective: false, composure_effect: 0 },
    },
    "curator": {
      "barons-incomplete-file": { response: "No signatures in that file.", is_effective: true, composure_effect: -10 },
      "burned-fragments": { response: "Those were not supposed to remain.", is_effective: true, composure_effect: -15 },
      "unsigned-letter": { response: "That went into Case 3 two months ago.", is_effective: true, composure_effect: -12 },
    },
    "northcott": {
      "estate-flower":  { response: "That's — how did you get into the Vault already?", is_effective: true, composure_effect: -20 },
      "northcott-notebook": { response: "You shouldn't have that. That's my personal record.", is_effective: true, composure_effect: -25 },
      "northcott-placement-letter": { response: "He placed me. He told me where to stand. I didn't ask why. I didn't ask why for six weeks.", is_effective: true, composure_effect: -18 },
      "compact-placement-record": { response: "Yes. I am in that record. Ashworth placed many of us. The Estate has placed members at posts for two centuries. That document is not unusual.", is_effective: false, composure_effect: 0 },
    },
    "pemberton-hale": {
      "unsigned-letter": { response: "That letter isn't about me.", is_effective: true, composure_effect: -25 },
      "writing-case-evidence": { response: "I keep my writing case with me. Always.", is_effective: true, composure_effect: -15 },
      "gloves-evidence": { response: "I wear gloves to most Estate events.", is_effective: false, composure_effect: 0 },
    },
    "crane": {
      "operational-brief": { response: "That document describes an arrangement I was not part of. My name is not in it.", is_effective: false, composure_effect: 0 },
      "appointment-book": { response: "Those entries are standard notation.", is_effective: true, composure_effect: -15 },
      "balcony-case": { response: "I left everything on the balcony exactly as I found it. I did not move the case.", is_effective: true, composure_effect: -18 },
    },
    "ashworth": {
      "estate-flower": { response: "The flower was mine. I left it for Edmund before the mingle began. Before anyone arrived. Before —", is_effective: true, composure_effect: -8 },
      "compact-keepsake": { response: "She looks at it for a long time. Not at you. At it. Something in her face closes. \"I knew that was there.\" She says it very quietly. \"I have known for some time.\" A pause. \"I did not touch it. I did not remove it.\" Another pause. \"That was my decision. It was not a simple decision.\"", is_effective: true, composure_effect: -20 },
      "candle-request-note": { response: "I requested those candles three weeks ago. I requested candles for every Estate event for fourteen months. That note is signed by me because the candle order required a signature. I did not handle the iron. I did not place anything on the balcony.", is_effective: false, composure_effect: -3 },
    },
    "baron": {
      "ashworths-sunday-letter": { response: "Yes. And now I'm not.", is_effective: true, composure_effect: -30 },
      "smoking-letters": { response: "Three years. And then it changed.", is_effective: true, composure_effect: -20 },
      "ashtray": { response: "I set it down. I had something to decide.", is_effective: false, composure_effect: -5 },
    },
    "greaves": {
      "warning-note": { response: "Ashworth sent that to me directly. He wanted me in that room.", is_effective: true, composure_effect: -15 },
      "debt-record": { response: "That record is accurate. I knew what I owed.", is_effective: true, composure_effect: -10 },
      "bond-record-volume": { response: "I've read that volume. Three times.", is_effective: false, composure_effect: 0 },
    },
    "voss": {
      "unsigned-letter": { response: "The delivery log has your name on it. Not mine.", is_effective: true, composure_effect: -12 },
      "voss-notes": { response: "Those are my private notes. How —", is_effective: true, composure_effect: -20 },
      "leather-document-roll": { response: "That was in Case 1. It was sealed.", is_effective: true, composure_effect: -15 },
    },
    "surgeon": {
      "surgeons-mask": { response: "That belongs to me.", is_effective: true, composure_effect: -15 },
      "plain-mask": { response: "Every member brings their own formal mask.", is_effective: false, composure_effect: 0 },
      "surgeons-licensing-record": { response: "That record is thirty years old.", is_effective: true, composure_effect: -20 },
      "operational-brief": { response: "That document is accurate.", is_effective: true, composure_effect: -5 },
    },
    "uninvited": {
      // Inversion mechanic — corrections arrive too smoothly.
      // He knows the accurate version without being told. That is the tell.
      // No composure damage. No credibility strike. He reveals himself instead.
      "estate-flower":          { response: '"That flower was moved from the study at seven-fifteen. You found it in the Foyer. I know the order you examined things." A pause. "I was watching before you arrived."', is_effective: true, composure_effect: 0 },
      "unsigned-letter":        { response: '"You found that before you spoke to Pemberton-Hale." He says it without looking at the letter. "Third room you examined. You were moving faster than most." He is not asking.', is_effective: true, composure_effect: 0 },
      "barons-incomplete-file": { response: '"The Baron\'s file has been incomplete for eleven years. You found the gap in the first pass." A pause. "Most investigators take three visits to notice that." He says it with something that is almost professional appreciation.', is_effective: true, composure_effect: 0 },
      "operational-brief":      { response: '"That document was placed for you to find." He says it without inflection. "Not by me. By someone who understood what you would do when you found it." A pause. "They were right about you."', is_effective: true, composure_effect: 0 },
      "smoking-letters":        { response: '"You read those in the wrong order." He says it before you finish presenting them. "The third letter explains the first. You will need to read it again." He says nothing about how he knows the order you read them.', is_effective: true, composure_effect: 0 },
      "study-decanter":         { response: '"Lady Ashworth touched that at seven-twelve." He says it the way someone says a thing they noted at the time and filed. "Before supper. You are the second person to examine it tonight." He does not say who the first was.', is_effective: true, composure_effect: 0 },
      "lectern-pen":            { response: '"That pen was used twice tonight." He looks at it. "Once before the Rite. Once during." A pause. "You have been assuming it was used once. That assumption has been shaping your questions."', is_effective: true, composure_effect: 0 },
      "appointment-book":       { response: '"You found the entry on page forty-three." He does not touch it. "You spent forty seconds on that page. Longer than any other." A pause. "The entry you were looking at is not the most important one on that page."', is_effective: true, composure_effect: 0 },
      "ashworths-sunday-letter":{ response: '"Lord Ashworth wrote that three months ago." He says it with the precision of someone who read it when it was written. "The date in the corner is the postmark. The date he wrote it is different." He says nothing about how he knows when it was written.', is_effective: true, composure_effect: 0 },
      "_any":                   { response: '"You are showing me something to see what I do with it." A pause. The correction arrives before you expect it. "I already know what that is. I know when you found it. I know what you thought when you found it." He says it without heat. "That is not a deduction. That is observation."', is_effective: true, composure_effect: 0 },
    },
  };

  // Uninvited: inversion mechanic — corrections arrive too smoothly
  // No composure damage. No credibility strike. He reveals himself instead.
  if (charId === "uninvited") {
    const uninvitedTable = DECEPTION_TABLE["uninvited"];
    const uninvitedEntry = uninvitedTable[itemId] || uninvitedTable["_any"];
    NocturneEngine.emit("deceptionResponse", { charId, itemId, text: uninvitedEntry.response, is_effective: true });
    // No deceptions_used increment — showing evidence to Uninvited costs nothing
    // No composure effect — inversion mechanic
    haptic([30, 20, 30]);
    saveGame();
    return;
  }

  const charDeceptions = DECEPTION_TABLE[charId] || {};
  const deception = charDeceptions[itemId];
  const isEffective = isCompact ? true : (deception ? deception.is_effective : false);

  if (isEffective) {
    gameState.verdictTracker.deceptions_effective++;
    if (charId === "pemberton-hale" && itemId === "unsigned-letter") {
      gameState.characters["pemberton-hale"] = gameState.characters["pemberton-hale"] || {};
      gameState.characters["pemberton-hale"].required_deception_used = true;
    }
  } else {
    gameState.verdictTracker.deceptions_wasted++;
    credibilityStrike();
    if (!ACCUSABLE_CHARACTERS.includes(charId) || ["crane","greaves","northcott"].includes(charId)) {
      if (!gameState.verdictTracker.innocents_exposed.includes(charId)) {
        gameState.verdictTracker.innocents_exposed.push(charId);
      }
    }
  }

  const response = deception ? deception.response : "That is not what I said.";
  const composureEffect = (deception && deception.composure_effect) ? deception.composure_effect : (isEffective ? -10 : 0);
  NocturneEngine.emit("deceptionResponse", { charId, itemId, text: response, is_effective: isEffective });
  if (composureEffect !== 0) {
    const charState = gameState.characters[charId] || {};
    const current = charState.composure !== undefined ? charState.composure : 100;
    charState.composure = Math.max(0, current + composureEffect);
    gameState.characters[charId] = charState;
    if (typeof updateComposureState === 'function') updateComposureState(charId);
  }
  // ── FRACTURE WINDOW CHECK ─────────────────────────────────────
  // If the deception was effective AND composure (before the hit) was in this character's
  // fracture window, the slot is preserved AND a depth-gating node is granted.
  // Otherwise the slot consumes normally.
  const FRACTURE_WINDOWS = {
    "surgeon":         { min: 43, max: 50 },  // narrow band — hardest to hit
    "crane":           { min: 45, max: 55 },
    "pemberton-hale":  { min: 50, max: 60 },  // breaks early
    "baron":           { min: 30, max: 40 },  // long descent (floor 20)
    "steward":         { min: 35, max: 45 },
    "ashworth":        { min: 45, max: 55 },
    "northcott":       { min: 40, max: 50 },
  };
  const _window = FRACTURE_WINDOWS[charId];
  const _inFractureWindow = !!_window && _composureBefore >= _window.min && _composureBefore <= _window.max;
  const _slotPreserved = isEffective && _inFractureWindow && !isCompact;

  if (_slotPreserved) {
    // Grant the fracture-window node — gates a deep question for this character
    const _fractureNode = charId.replace(/-/g, "_") + "_lie_caught_in_fracture_window";
    if (typeof window !== "undefined" && typeof window._markNode === "function") {
      window._markNode(_fractureNode);
    }
    if (gameState.node_inventory) gameState.node_inventory[_fractureNode] = true;
    NocturneEngine.emit("nodeMarked", { nodeId: _fractureNode, charId: charId });
    NocturneEngine.emit("deceptionFracture", { charId, itemId, composureBefore: _composureBefore, fractureWindow: _window });
    haptic([100, 40, 100, 40, 200, 40, 100]);  // distinctive fracture haptic
  } else {
    // Slot burns
    gameState.deceptions_remaining--;
  }
  NocturneEngine.emit('deceptionUsed', { slotsRemaining: gameState.deceptions_remaining, preserved: _slotPreserved });

  if (!_slotPreserved) {
    haptic(isEffective ? [100, 40, 100, 40, 200] : [10, 5, 10, 5, 10]);
  }
  saveGame();
}

// ── CREDIBILITY ────────────────────────────────────────────
function credibilityStrike() {
  gameState.credibility_strikes++;
  gameState.verdictTracker.credibility_strikes++;
  if (gameState.credibility_strikes === 1) gameState.credibility_state = "noted";
  if (gameState.credibility_strikes === 2) gameState.credibility_state = "compromised";
  if (gameState.credibility_strikes >= 3) gameState.credibility_state = "discredited";
  gameState.verdictTracker.credibility_state = gameState.credibility_state;
  haptic([10, 5, 10, 5, 10]);
  NocturneEngine.emit("credibilityChanged", { state: gameState.credibility_state, strikes: gameState.credibility_strikes });
}

// ── STAGE / ACCUSATION ─────────────────────────────────────

// ── TIMELINE GATE MESSAGES ─────────────────────────────────
// Two-stage Estate voice. Gender-correct. Never names what is missing.
// Stage 1: timeline not assembled — evidence names suspect, record does not place them.
// Stage 2: partial timeline — record places them somewhere, not at the act.
const TIMELINE_GATE_MESSAGES = {
  "surgeon": {
    none:    "The evidence names a man. The record does not yet place him.",
    partial: "The record places him on the stairs. It does not place him at the railing.",
  },
  "crane": {
    none:    "The evidence names a woman. The record does not yet place her.",
    partial: "The record places her on the balcony. It does not place her at the moment of death.",
  },
  "pemberton-hale": {
    none:    "The evidence names a man. The record does not yet place him.",
    partial: "The record places him at the Register. It does not place him at the body.",
  },
  "steward": {
    none:    "The evidence names a man. The record does not yet place him.",
    partial: "The record places him in the corridor. It does not account for the moment.",
  },
  "baron": {
    none:    "The evidence names a man. The record does not yet place him.",
    partial: "The record places him at the window. It does not place him at the act.",
  },
  "ashworth": {
    none:    "The evidence names a woman. The record does not yet place her.",
    partial: "The record places her in the building. It does not place her at the act.",
  },
  "northcott": {
    none:    "The evidence names a man. The record does not yet place him.",
    partial: "The record places him at the door. It does not account for the window.",
  },
};

// ── TIMELINE NODE REQUIREMENTS ─────────────────────────────
// New plot. Push from balcony at 7:45. No 7:03 as spine.
// Surgeon: three required nodes — Greaves sees maskless figure,
//          Vivienne witnesses push, Surgeon gap named by himself.
// All others: their own deep branch nodes as timeline gates.
const TIMELINES = {
  "surgeon": {
    required: [
      "greaves_maskless_witness",      // Greaves GB3 — unmasked figure, base of stairs, running, 7:48
      "surgeon_admits_balcony_level",  // Surgeon Q5 — places himself at balcony level, mentions sightlines
      "vivienne_push_witnessed",       // Vivienne Branch C — one sentence, present tense
    ],
    partial_threshold: 1,
  },
  "crane": {
    required: [
      "crane_first_visit_ashworth_alive",   // Crane Q3 — floor clear at 7:05
      "crane_said_nothing_after_discovery", // Crane Q7 — sequence confirmed
      "crane_two_reasons",                  // Crane Branch B CB3 — cannot separate
    ],
    partial_threshold: 1,
  },
  "pemberton-hale": {
    required: [
      "ph_altered_register_for_clause_not_self", // PH Branch A PA3
      "register_altered_ph",                      // PH Q3 — detectable
      "ph_steward_corridor",                      // Steward Q10 confirms corridor
    ],
    partial_threshold: 1,
  },
  "steward": {
    required: [
      "steward_corridor_758",               // Steward BA3 — corridor at 7:58
      "bond_coerced_signed",                // Steward Q6 — Bond under conditions
      "steward_route_past_physicians_room", // Baron Branch B BB2 — never takes that route
    ],
    partial_threshold: 1,
  },
  "baron": {
    required: [
      "baron_705_observation",     // Baron Q4b — saw someone leave study at 7:05
      "baron_crane_visit_715",     // Baron Q3 — Crane came at 7:15
      "baron_compact_arrangement", // Baron Branch A BAR_A2
    ],
    partial_threshold: 1,
  },
  "ashworth": {
    required: [
      "ashworth_planned_revelation",      // Lady Ashworth Branch A BA2
      "crane_first_visit_ashworth_alive", // Crane Q3 — he was well at 7:05
      "lady_ashworth_wrong_mask_752",     // Lady Ashworth mask branch AM2
    ],
    partial_threshold: 1,
  },
  "northcott": {
    required: [
      "northcott_placed_by_ashworth", // Northcott Q2 — Ashworth knew his name
      "northcott_two_absences",       // Northcott interrogation — two gaps in foyer log
      "surgeon_contact_refused",      // Surgeon Branch A SA3
    ],
    partial_threshold: 1,
  },
};

function _checkTimeline(accused) {
  try {
    const ni = gameState.node_inventory || {};
    const spec = TIMELINES[accused];
    if (!spec) return { complete: true, stage: "complete" };
    const met = spec.required.filter(n => ni[n] === true);
    if (met.length === spec.required.length) {
      return { complete: true, stage: "complete" };
    }
    if (met.length >= spec.partial_threshold) {
      return { complete: false, stage: "partial" };
    }
    return { complete: false, stage: "none" };
  } catch(e) {
    return { complete: true, stage: "complete" };
  }
}

function filterInventoryForPedestal(pedestalId) {
  const categoryMap = {
    "motive":     ["motive"],
    "means":      ["means"],
    "moment":     ["moment"],
    "accomplice": ["accomplice"],
    "record":     ["record"],
  };
  const validCategories = categoryMap[pedestalId] || [];
  return gameState.inventory.filter(itemId => {
    const item = ITEMS[itemId];
    if (!item) return false;
    const cats = Array.isArray(item.pedestal_category) ? item.pedestal_category : [item.pedestal_category];
    return cats.some(c => validCategories.includes(c)) &&
           ACCUSABLE_CHARACTERS.includes(item.accusation_target);
  });
}

function placeEvidenceOnPedestal(pedestalId, itemId) {
  const prev = gameState.stage_evidence[pedestalId];
  if (prev && prev !== itemId) {
    if (!gameState.inventory.includes(prev)) gameState.inventory.push(prev);
  }
  gameState.inventory = gameState.inventory.filter(id => id !== itemId);
  gameState.stage_evidence[pedestalId] = itemId;
  NocturneEngine.emit("pedestalFilled", { pedestalId, itemId });
  NocturneEngine.emit("inventoryUpdated", {});
  checkAllPedestalsFilled();
}

function checkAllPedestalsFilled() {
  // Core three always required
  const required = ["motive", "means", "moment"];
  const allFilled = required.every(p => gameState.stage_evidence[p]);
  if (!allFilled) return;

  // MOM must be unanimous
  const targets = required.map(p => {
    const item = ITEMS[gameState.stage_evidence[p]];
    return item && item.accusation_target;
  }).filter(Boolean);

  const allSame = targets.length === 3 && targets.every(t => t === targets[0]);
  if (!allSame) {
    NocturneEngine.emit("pedestalsFilledMixed", {});
    return;
  }

  const accused = targets[0];
  const timelineResult = _checkTimeline(accused);

  if (!timelineResult.complete) {
    const messages = TIMELINE_GATE_MESSAGES[accused] || {
      none:    "The evidence names a suspect. The record does not yet place them.",
      partial: "The record places them at the scene. It does not account for the moment.",
    };
    const message = timelineResult.stage === "partial"
      ? messages.partial
      : messages.none;
    NocturneEngine.emit("stageGateBlocked", { accused, reason: "timeline", message });
    return;
  }

  // Three verdict depths only:
  // surface        = Surgeon alone (3 pedestals)
  // deep_human     = Surgeon + Crane (accomplice pedestal filled)
  // deep_political = Surgeon + Crane + Seal record (both filled)
  // Record without accomplice is ignored — Crane must be named before the Seal can be.
  const accompliceItem = gameState.stage_evidence.accomplice
    ? ITEMS[gameState.stage_evidence.accomplice] : null;
  const recordItem = gameState.stage_evidence.record
    ? ITEMS[gameState.stage_evidence.record] : null;

  const accompliceFilled = !!(accompliceItem && accompliceItem.accusation_target === "crane");
  const recordFilled     = !!(recordItem && recordItem.pedestal_category &&
    (Array.isArray(recordItem.pedestal_category)
      ? recordItem.pedestal_category.includes("record")
      : recordItem.pedestal_category === "record"));

  if (accompliceFilled && recordFilled) {
    gameState._verdictDepth = "deep_political";
  } else if (accompliceFilled) {
    gameState._verdictDepth = "deep_human";
  } else {
    gameState._verdictDepth = "surface";
  }

  NocturneEngine.emit("allPedestalsFilled", {});
}

// ── REQUIRED EVIDENCE GATES ───────────────────────────────
const REQUIRED_EVIDENCE = {
  "surgeon":        { motive: ["surgeons-motive-confirmed"], means: ["surgeons-mask"], moment: ["witness-testimony-vivienne"], record: ["seal-placement-record"] },
  "pemberton-hale": { motive: ["debt-record"], means: ["writing-case-evidence","gloves-evidence","lectern-pen","candle-iron"], moment: ["ph-register-connection","lectern-pen","ashworth-seal","northcott-notebook"] },
  "crane":          { motive: ["crane-premeditation-record","appointment-book"], means: ["balcony-case","surgeons-mask","candle-iron"], moment: ["appointment-book","northcott-notebook"] },
  "baron":          { motive: ["barons-real-origins","smoking-letters"], means: ["baron-compact-channel","candle-iron"], moment: ["baron-operational-record","baron-study-observation","ashtray"] },
  "steward":        { motive: ["steward-bond","sealed-incident-record"], means: ["steward-bond","candle-iron"], moment: ["steward-fourteen-year-record","steward-bond"] },
  "ashworth":       { motive: ["ashworth-affair-correspondence","lady-ashworth-letter","compact-keepsake"], means: ["lady-ashworths-key"], moment: ["candle-request-note","estate-flower"] },
  "northcott":      { motive: ["northcott-placement-letter"], means: ["northcott-arrival-record","northcott-notebook","candle-iron"], moment: ["northcott-gap-record","northcott-arrival-record","northcott-notebook"] },
};
window.REQUIRED_EVIDENCE = REQUIRED_EVIDENCE;

function resolveAccusation() {
  if (gameState.investigation_closed) return;
  gameState.verdictTracker.accusation_attempts++;

  const motive  = gameState.stage_evidence.motive;
  const means   = gameState.stage_evidence.means;
  const moment  = gameState.stage_evidence.moment;

  const placedItems = [motive, means, moment].filter(Boolean);

  // Count targets across all three pedestals
  const targetCounts = {};
  placedItems.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item || !item.accusation_target) return;
    targetCounts[item.accusation_target] = (targetCounts[item.accusation_target] || 0) + 1;
  });

  // Primary accused = target all three pedestals point at (gate enforces unanimity)
  const accused = Object.entries(targetCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || null;

  const correctKiller = accused === "surgeon";
  const deepEnding    = gameState.vaultOpen && gameState.tunnelFound;

  gameState.verdictTracker.accused_target = accused;

  // ── OUTCOME 1 — Correct (surface or deep) ──────────────────
  if (correctKiller) {
    gameState.verdictTracker.first_accusation_correct = true;
    gameState.verdictTracker.correct_on_attempt = gameState.verdictTracker.accusation_attempts;
    if (deepEnding) {
      gameState.verdictTracker.conspiracy_named = true;
      gameState.investigation_closed = true;
      haptic([300]);
      NocturneEngine.emit("accusationCorrect", { deep: true });
    } else {
      gameState.investigation_closed = true;
      haptic([200]);
      NocturneEngine.emit("accusationCorrect", { deep: false });
    }
    deliverVerdict();
    return;
  }

  // ── OUTCOME 2 — Wrong suspect — one shot, final ─────────────
  gameState.verdictTracker.wrong_accusations.push(accused);
  gameState.investigation_closed = true;
  gameState._verdictDepth = 'wrong';
  gameState._wrongAccused = accused;
  const wrongKey = "wrong_" + accused;
  const wrongString = VERDICT_STRINGS[wrongKey] || VERDICT_STRINGS.wrong;
  NocturneEngine.emit("accusationWrongFinal", { accused, verdictString: wrongString });
  // deliverVerdict is called by ui.js handleAccusationWrongFinal after momentReveal completes
}

// ── VERDICT ────────────────────────────────────────────────
// resolveVerdictTone removed — replaced by computeNISScore() + resolveVerdictOutcome()

// ── VERDICT OUTCOME STRINGS (locked) ──────────────────────
// Four correct verdict depths based on pedestals filled.
// Wrong verdicts per suspect — each names what was missed.
const VERDICT_STRINGS = {
  // ── SURFACE CORRECT — Surgeon alone — teases conspiracy only ─
  surface: "The Estate has its verdict.\n\nDr. Edmund Voss. The Surgeon. He arrived at seven-oh-three through the garden entrance, seventeen minutes before he claimed, at the edge of the mingle window when no one had yet thought to note that a physician had already solved the room. He went upstairs at some point before the assembly convened. He was on the balcony at seven forty-five. Lord Ashworth was there. The railing was there. And a man who had spent four years learning exactly how to be useful, exactly where to stand, exactly when to act — was there too.\n\nHe pushed him. The mask dropped in the struggle. He took three minutes — three minutes that no one in that Ballroom thought to account for — to drag the body to the lectern, to place the dead hand at the Register pointing at a man who had altered entries but killed no one, to stage the candle iron with his sleeve so it would look like the means and leave no prints. Then he ran. Maskless, across the terrace, to the groundskeeper's cottage, where a man named Thomas Hatch gave him a plain spare mask without asking why a physician needed one at seven forty-eight on the night Lord Ashworth died.\n\nHe rejoined the assembly. Composed. Helpful. The most useful man in the building.\n\nThe Estate has accepted the evidence. Dr. Voss is excommunicated. The record will carry his name.\n\nWhat the record will not carry is the answer to a simpler question: who sent him here? He did not decide this alone. A man who spent four years embedded in an organisation he did not choose, waiting for a specific instruction, does not arrive four years later having given himself that instruction.\n\nSomething sent him. Something that knew Lord Ashworth would be on that balcony at that railing on that night, and found that knowledge useful.\n\nThe killer is named. The investigation is closed. Whether the investigation is complete is a different question, and the Estate has chosen not to ask it.",

  // ── DEEP HUMAN — Surgeon + Crane — teases tunnel only ────────
  deep_human: "The Estate has two names before it.\n\nDr. Edmund Voss — the Surgeon — pushed Lord Ashworth from the balcony at seven forty-five. He staged the scene in three minutes flat. He obtained a replacement mask from the groundskeeper at seven forty-eight and rejoined the assembly as if he had never left it. He is the killer. The record will carry his name in full.\n\nDr. Harriet Crane is the second name, and the second name is harder.\n\nSix weeks before tonight, she wrote a document. It was precise, as she is precise about everything — the timing of a balcony visit, the floor plan of the level above the assembly hall, the window in which a man might be at a railing he had occupied at every Rite for eleven years. She wrote it because she was asked and because she believed the asking was legitimate. She wrote it because she is a physician and physicians think in windows and timing and the geometry of access. She did not write it to kill anyone. She wrote it because the Surgeon asked her clinical questions in the voice of a man solving a hypothetical, and she answered in the voice of a woman who had never once considered that a man she trusted would use her precision as a blueprint.\n\nShe was wrong about him. She knew she was wrong about him at eight-oh-one, when she went back upstairs and found his mask on the balcony floor, and said nothing. Not to protect him. To protect herself. That distinction exists. The Estate will decide how much it matters.\n\nBoth names are on the record. The killer and the woman whose expertise made the killing geometrically possible. He used her without her knowledge. She covered his evidence without his asking. Neither had the complete picture. The investigation does.\n\nWhat lies beyond the Vault is not in this record.",

  // ── DEEP POLITICAL — Surgeon + Crane + THE RECORD (all 5) ───
  deep_political: "The Estate asked for one name. The investigation found the truth.\n\nDr. Edmund Voss pushed Lord Ashworth from the balcony at seven forty-five. He is the killer. The Estate will record his name in full, and it will mean something, because this investigation earned the right to make it mean something.\n\nDr. Harriet Crane is named beside him. Six weeks before tonight she wrote a document — precise, clinical, devastating in retrospect — that described the geometry of access to the balcony level, the timing of Lord Ashworth's presence at the railing, the window in which a man could act and not be seen. She wrote it for a colleague she trusted. She answered his questions honestly because she is always honest about clinical matters. She said nothing after eight-oh-one because she found his mask and understood what she had done and could not say it without destroying herself. She is not a killer. She is something more complicated than a killer: she is the person whose expertise was used against her, whose silence compounded it, and who spent the whole evening waiting to be asked questions she had already decided to answer.\n\nBoth are named. The record will carry them together. That is correct.\n\nBut this investigation did not stop at the Stage. It found a tunnel. It found a building behind the hedge that has been keeping records for forty years. It found four people who have been waiting — not for justice exactly, but for someone to arrive who would keep going after the first true thing. The Sovereign. The Heir. The Envoy. The Archivist. Four people who had the complete picture of how tonight was arranged and not the authority to deliver it to the Estate themselves.\n\nAnd in a safe in the Vault — in a document assembled over four years by a man who knew he was in danger and came to the Rite anyway — the answer to the only question that matters: who sent the Surgeon here?\n\nThe Seal. An organisation that has existed for seven hundred years. That separated the Estate and the Compact forty-three years ago using fabricated evidence and a woman inside the Compact who has never been named. That placed an operative inside the Compact four years ago when Ashworth and the Sovereign's correspondence became too dangerous to allow. That gave the order. The Surgeon received it.\n\nThe Surgeon did not decide this. He was an instrument. A precise, patient, four-year instrument, and he is named on this record because being an instrument does not exempt a man from what his hands did on a balcony at seven forty-five.\n\nLord Ashworth built this investigation. He positioned Northcott to keep the arrival record. He arranged for Greaves to be the unimpeachable library witness. He corresponded with the Sovereign for years to assemble the proof. He placed his own Bond document in the Compact register. He came to the Rite knowing the Surgeon might act, and he came anyway, because the alternative was another decade of the Seal running both organisations from behind the wall they built.\n\nHe did not survive to deliver the verdict. The investigation did it for him.\n\nThe killer is named. The accomplice is named. The organisation is named. The manufactured betrayal is named. Forty-three years of a lie that kept two organisations apart is now on record beside the name of the man who was killed to keep it buried.\n\nThat is the complete account.\n\nThe mountains are north. The Monastery is older than the Seal believes.",

  // ── WRONG VERDICTS ───────────────────────────────────────────

  "wrong_pemberton-hale": "The Estate has excommunicated Viscount Pemberton-Hale.\n\nHe deserves some of this. Let the record be precise about which parts.\n\nHe altered the Register. Eighteen months ago, with the careful hand of a man who had been planning his own protection for longer than that, he added an immunity clause to a chain of instruction he wanted no legal proximity to. He did it with Estate paper, with Estate ink, at a desk that belonged to the organisation he was simultaneously betraying and sheltering inside. When the Curator noticed the alterations at seven forty-two and chose to let the Rite expose them rather than intervene quietly, Pemberton-Hale did not know that. He thought his work was hidden. It was detectable. Those are not the same thing, and the Curator's choice of the word 'detectable' — offered to a physician at seven forty-two as if in passing — was not an accident.\n\nHe was in the Antechamber before the Rite. He positioned the mirror himself. He spent twenty minutes watching the corridor through it with the patience of a man who expected something to happen and wanted to see it arrive. He had his writing case. He had his gloves. He had eight years of accumulated grievance and the particular stillness of someone who has finally decided that waiting is over.\n\nAll of this is real. The investigation is not wrong about any of it.\n\nIt is wrong about one thing. One critical, irrecoverable thing.\n\nAt seven forty-five, Viscount Pemberton-Hale was twelve feet from Lord Ashworth in the Ballroom. He was waiting for a scandal, not a murder. The scandal he was waiting for was himself. The balcony above the Ballroom was occupied by someone else — someone who had arrived at this Estate before the assembly convened, with a purpose the Viscount knew nothing about.\n\nHe was guilty of preparing. He was guilty of covering. He was guilty of standing twelve feet from a dying man and looking at a mirror instead of looking up.\n\nHe was not guilty of the push.\n\nThe investigation named the man who altered the Record. It did not name the person who was on that balcony. That person is still in this building. The record is closed and they are comfortable.\n\nNot everyone in this building tonight is accounted for.",

  "wrong_crane": "The Estate has excommunicated Dr. Harriet Crane.\n\nShe will not protest this. She has had since eight-oh-one to decide how she feels about it, and the feeling she has settled on is something in the neighbourhood of: she earned parts of it and the parts she did not earn are her fault too, in the specific way that silence after the fact is always your fault even when speech would have destroyed you.\n\nHere is what she did.\n\nShe went upstairs at seven-oh-five. She noted that the balcony floor was clear. Lord Ashworth was alive and at his study. She came back downstairs. She visited the Baron at seven-fifteen — a professional courtesy, the kind she extends to members she is mildly concerned about and does not want to alarm. She prepared her medical bag before the Rite began, which is either excellent preparation or advance knowledge, and she has spent the evening being precise about the fact that those two things are not the same.\n\nAt six weeks before tonight she wrote a document. A colleague asked her clinical questions about the balcony level — access, timing, the geometry of the railing, the window during which the assembly would be empty above. She answered them. She answered them with the full precision of twenty years of surgical practice, because she was asked in a professional register and she had no reason then — she had every reason now — to understand what the questions were for.\n\nAfter eight-oh-one she went back upstairs. She found a mask on the balcony floor. She recognised it. She said nothing. She came downstairs and opened her bag and pronounced Lord Ashworth in the careful language of a physician who has decided that honesty about some things does not require honesty about all things.\n\nThe investigation found the document she wrote. It found the mask she found. It found a physician who mapped the geometry of a murder six weeks before it happened, who was in the building before she claimed, who found the evidence and chose silence.\n\nShe knew this verdict was possible. She is not surprised by it. The investigation found what she left. It did not find what she found — and what she found, she kept.\n\nNot everyone in this building tonight is accounted for.",

  "wrong_baron": "The Estate has excommunicated the Baron.\n\nHe is furious about this. Not in the way of a man who is innocent — in the way of a man who is guilty of exactly what he is guilty of, no more, and has just been charged with something categorically worse.\n\nHere is what he did.\n\nFor three years he provided information to an organisation on the other side of a garden wall he claimed never to have looked at. He was paid in the Compact's particular currency — access, protection, the quiet acknowledgment that certain of his interests were being considered by people who had been considering such interests for forty years. He refused the Duke's Claim eight times because eight times Ashworth offered him something the Compact had already arranged to give him. He was working both sides of a wall he was pretending didn't exist. He knew it. Ashworth knew it. The Compact knew it. The Baron has spent years being very comfortable with everyone knowing things that no one was saying.\n\nAt seven-oh-five he noted movement near the study. He did not ask. At seven-fifteen Dr. Crane visited him in the Smoking Room, which told him something, though he would not say what it told him. At seven forty-four he lit a cigarette. At seven forty-five the cigarette went out on its own — not because it burned down, because his hand stopped moving — because something above the terrace took his attention and the cigarette went out in his hand while he decided whether what he had just noticed was what he thought it was.\n\nHe decided it probably was.\n\nHe put the cigarette down. He did not pick it up again. He sat in that room until eight-oh-one and he decided that Lord Ashworth was capable of managing his own dangers, which is the sentence a man uses when he has decided that someone else's danger is not his responsibility and he would like to believe this without quite believing it.\n\nHe was wrong. He has known he was wrong since eight-oh-one.\n\nHe was in the Smoking Room. His information gave certain parties a map of this building that they would not otherwise have had. He contributed to the conditions of tonight. He did not commit the act.\n\nThe investigation named the man who knew and stayed seated. It did not name the person who acted. That person is still in this building. The Baron is not satisfied with this verdict. He is the only person in the room who has earned the right to that dissatisfaction.\n\nNot everyone in this building tonight is accounted for.",

  "wrong_steward": "The Estate has excommunicated the Steward.\n\nHe will say: yes, sir. He has been saying yes, sir for fourteen years to a dead man and he will say it to this record too.\n\nThe investigation found Clara. That is not nothing. That is the thing buried deepest in this building tonight, and the investigation found it. A nine-year-old girl on the approach road on a Tuesday afternoon. The son riding reckless. The Steward arriving after. Lord Ashworth arriving twenty minutes later, looking at what the Steward was looking at, and saying: this will be handled. The Curator sealed the record that afternoon. The son was sent abroad within the week. The Steward remained.\n\nHe remained for fourteen years. He changed the candles and recorded the arrivals and straightened the portraits and looked at Lord Ashworth every morning and knew exactly what Lord Ashworth had decided on a Tuesday afternoon fourteen years ago, and said nothing, because there was no institution in this building that would have heard him.\n\nThe investigation is right that he had motive. It is right that the motive was real and earned and fourteen years deep. It is right that when the Bond gave him a role in whatever was going to happen tonight, he did not refuse. He covered the corridor. He has not pretended otherwise.\n\nIt is wrong about one thing.\n\nHe did not know what was moving through the corridor. The Bond gave him a position and a time and no explanation, the way it had always given him positions and times and no explanations, and he took the position because he had wanted Ashworth dead for fourteen years and because wanting something and being offered an adjacent thing are different, and because a man who has been silent for fourteen years does not always know the difference between an act of agency and an act of compliance.\n\nHe was chosen because of Clara. Not in spite of her. Whoever wrote that Bond knew what a fourteen-year-old grief looks like. They knew it could be made to stand in a corridor at seven fifty-eight without asking questions. They used his grief as a mechanism. They handed him a position in someone else's plan and let him believe it was the one thing he could finally do.\n\nHe was the door. He did not know what the door was for. The investigation named the door and closed the record.\n\nClara was not named in the sealed record. She is not named in this one either. The person who used her grief as an instrument is still in this building. The Steward covered a corridor for them without knowing whose corridor it was.\n\nNot everyone in this building tonight is accounted for.",

  "wrong_ashworth": "The Estate has excommunicated Lady Miriam Ashworth.\n\nShe knew what was in the Register. Not only the institutional entry — the personal one. Her husband had been conducting an arrangement for fourteen months. She had known for most of that time. Six weeks ago he told her he intended to name it aloud at the Rite, in front of every senior member of the Society, and enter it into the permanent record.\n\nHe was going to read his own affair into the Register. Because he believed the record should account for everything. Including this.\n\nShe wrote him a letter asking him not to. He did not change his position. She came tonight anyway.\n\nThe investigation has considered what it means for a woman to know this — to write that letter and watch him discard it, to arrive tonight and take up a position in this building that touched every room that mattered. She had a key to his study. She changed both sets of candelabras before the assembly convened — a request she made in writing and kept a copy of, as if she already knew the record would matter. She was the last person to speak to him before the Rite began.\n\nThe investigation cannot prove she acted. It can prove she knew. It can prove she prepared. It can prove that a woman who had every reason to prevent this evening from proceeding as her husband intended was present at every point where it could have been prevented.\n\nThat is not enough. The Estate has decided it is enough.\n\nShe loved a man who believed the record should account for everything. She disagreed about whether that included this. She came tonight. The Register did not reach the naming. She is the only person in this building who knows whether that is a relief or a tragedy.\n\nNot everyone in this building tonight is accounted for.",

  "wrong_northcott": "The Estate has excommunicated Cavalier Northcott.\n\nNorthcott arrived at seven o'clock. He was not a member before tonight. Lord Ashworth placed him in the Foyer six weeks ago, handed him a notebook, and said: arrivals matter, keep them precisely, circle anything that seems wrong. He did not say what wrong would look like. Northcott has spent six weeks trying to develop a sense for it.\n\nHe developed the sense. The seven-oh-three entry is circled because it was wrong — someone arrived at the edge of the mingle window, moving toward the study and the balcony above it. Northcott circled it because Lord Ashworth told him to circle things that seemed wrong and this seemed very wrong and he had no authority to do anything except circle it and wait for someone to ask.\n\nHe waited. He told you everything the moment you asked. He gave you the notebook with the circled entry. He told you which direction the figure moved. He told you the time to the minute. He told you that the Estate had arrangements he was not always permitted to discuss but that tonight felt like an exception.\n\nThe investigation took his record and built a case from it that names the man who kept the record instead of the person the record was kept about.\n\nNorthcott did not arrive at seven-oh-three. He arrived at seven, at the foyer, and took up his post. His handwriting is in the seven-oh-three entry because he wrote what he saw, not because he was there. A man who came through that gate would not have circled his own arrival. A man who came through that gate would not have handed that notebook to an investigator and said: here, start here, this is the most important line.\n\nLord Ashworth placed him in the Foyer because he needed a witness who could not be accused of involvement. The Estate has found a way around that. It has taken the most important record in this building and used it to excommunicate the person who kept it faithfully.\n\nThe seven-oh-three entry is circled in a notebook that is now part of a closed record. The person it describes is still in this building. They have been in this building all evening, watching the investigation read their own arrival time and name someone else.\n\nThe record shows a name. The name is wrong. The notebook knows the difference, and the notebook will not be consulted again.\n\nNot everyone in this building tonight is accounted for.",
};

function resolveVerdictOutcome() {
  const depth = gameState._verdictDepth;
  if (depth === 'wrong')         return 'wrong_' + (gameState._wrongAccused || '');
  if (depth === "deep_political") return "deep_political";
  if (depth === "deep_human")    return "deep_human";
  return "surface";
}

function deliverVerdict() {
  const outcome = resolveVerdictOutcome();
  const verdictString = VERDICT_STRINGS[outcome] || VERDICT_STRINGS[outcome.replace(/^wrong_.*/, 'wrong')] || '';
  gameState.verdictTracker.session_duration_ms = Date.now() - gameState.verdictTracker.session_start;
  // Emit verdict UI — NIS score arrives separately via nisComputed event
  // after franchiseRecordWritten → behavioral_logger → nis.js chain
  NocturneEngine.emit("verdictDelivery", {
    outcome,
    verdictString,
    nis: null, // populated by nisComputed event 14s later
  });
  haptic([300]);
  writeFranchiseRecord(outcome);
}

// ── FRANCHISE RECORD ───────────────────────────────────────
function writeFranchiseRecord(outcome) {
  const vt = gameState.verdictTracker;

  gameState.franchise_record = {
    episode: 1,
    verdict_outcome: outcome,
    conspiracy_found: vt.conspiracy_named,
    tunnel_entrance: vt.tunnel_entrance_used,
    session_duration_ms: vt.session_duration_ms,
    tunnel_first_crossing_complete: gameState.tunnelFound,
  };

  try {
    localStorage.setItem("nocturne_franchise_record", JSON.stringify(gameState.franchise_record));
  } catch(e) {}

  NocturneEngine.emit("franchiseRecordWritten", { record: gameState.franchise_record });
}

// ── VERDICT TRACKER HOOKS ──────────────────────────────────
function trackDeception(charId, itemId, isEffective) {
  // Called inline by fireDeception
}
function trackDyingClue(decoded) {
  // dying_clue fields removed — not used in verdict resolution
}
function trackEvidenceDiscovery(type) {
  if (type.startsWith("compact")) gameState.verdictTracker.compact_investigated = true;
}
function trackTunnelFound(entrance) {
  gameState.verdictTracker.tunnel_found = true;
  gameState.verdictTracker.tunnel_entrance_used = entrance;
}
function trackRoomCompleted() { gameState.verdictTracker.rooms_completed++; }
function trackCharacterFullyQuestioned() { gameState.verdictTracker.characters_fully_questioned++; }

// ── SAVE / LOAD ────────────────────────────────────────────
const PERSIST_FIELDS = [
  "inventory","dropped_items","object_taps","item_taps","hotspots_pulsed","essential_left",
  "puzzle_fail_counts","puzzle_states","fired_chains","verdictTracker","examined_objects",
  "char_dialogue_complete","stage_evidence","franchise_record","rooms","currentRoom",
  "node_inventory",
  "_stageGateAttempts",
  "_missedTimelines",
  "_cranePuzzleUnlocked",
  "discredited_times",
  "tunnelFound","tunnelEntranceUsed","compactAccessible","compactEvidenceFound",
  "compactCaseAssembled","sealRecordFound","vaultDoorOpen","vaultOpen",
  "hedgeGapFound","hedgeGapItems","investigation_closed",
  "credibility_strikes","credibility_state","deceptions_remaining",
  "_seenReturnHint","_cellarMomentFired",
];

function saveGame() {
  try {
    const save = {};
    PERSIST_FIELDS.forEach(f => { save[f] = gameState[f]; });
    save._settings = {}; // rank and difficulty removed
    localStorage.setItem("nocturne_save", JSON.stringify(save));
  } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem("nocturne_save");
    if (!raw) return false;
    const save = JSON.parse(raw);
    PERSIST_FIELDS.forEach(f => { if (save[f] !== undefined) gameState[f] = save[f]; });
    if (save._settings) {
      gameSettings.rank = save._settings.rank || "envoy";
      // difficulty not loaded — removed
    }
    // ashworth-seal re-seeding removed — now physical foyer pickup, persists normally in inventory
    return true;
  } catch(e) { return false; }
}

function newGame() {
  // Reset state but keep settings
  const rank = gameSettings.rank;
  // difficulty removed
  Object.assign(gameState, {
    inventory: [],  // ashworth-seal is a foyer pickup, not auto-seeded
    dropped_items: {}, object_taps: {}, item_taps: {}, examined_objects: [],
    hotspots_pulsed: {}, essential_left: {}, puzzle_fail_counts: {},
    puzzle_states: {}, puzzle_cooldown_active: {}, puzzles_solved: [],
    fired_chains: [], characters: {}, char_dialogue_complete: {},
    stage_evidence: { motive: null, means: null, moment: null, accomplice: null, record: null },
    deceptions_remaining: 3,
    investigation_closed: false, sealRecordFound: false,
    vaultDoorOpen: false, vaultOpen: false, hedgeGapFound: false,
    hedgeGapItems: 0,  tunnelFound: false,
    tunnelEntranceUsed: null, compactAccessible: false,
    compactEvidenceFound: false, compactCaseAssembled: false,
    currentRoom: "foyer", credibility_strikes: 0, credibility_state: "clean",
    selectedItem: null, franchise_record: null,
    _seenReturnHint: false,
    last_talked_to: null, pivot_bonus: {},
    node_inventory: {},
    _stageGateAttempts: {},
    discredited_times: [],
    paidTierUnlocked: false,
    prologueActive: true,   // PROLOGUE — fresh game starts in pre-murder mingle
  });
  // Fully reset verdictTracker — every field
  gameState.verdictTracker = {
    deceptions_used: 0, deceptions_effective: 0, deceptions_wasted: 0,
    deceptions_required_used: false, innocents_exposed: [],
    all_evidence_examined: false, puzzles_attempted: 0,
    puzzles_solved_clean: 0, puzzles_solved_hinted: 0,
    puzzles_walked_through: [], puzzle_walkthroughs_taken: 0,
    counsel_tier1_used: 0, counsel_tier2_used: 0, counsel_tier3_used: 0,
    tunnel_found: false, tunnel_entrance_used: null,
    compact_investigated: false, conspiracy_named: false,
    rooms_completed: 0, characters_fully_questioned: 0, accusation_attempts: 0,
    first_accusation_correct: false, correct_on_attempt: null,
    evidence_strength: null, wrong_accusations: [],
    accused_target: null, session_start: null, session_duration_ms: 0,
    credibility_strikes: 0, credibility_state: "clean", rank: null,
    techniques_used_per_char: {}, technique_switches: 0,
    pressure_on_cooperative: 0, optimal_technique_used: 0, suboptimal_technique_used: 0,
    deceptions_before_question: 0, deceptions_after_question: 0,
    dialogue_nodes_unlocked: 0, dialogue_nodes_total: 120,
    suspects_investigated: [], evidence_trails_followed: 0,
    compact_chars_questioned: 0, silence_waits_used: 0,
    silence_fills_triggered: 0, silence_tells_triggered: 0,
  };
  // Reset rooms
  Object.keys(gameState.rooms).forEach(r => {
    gameState.rooms[r] = { state: "undiscovered", completed: false };
  });
  gameState.rooms["foyer"].state = "visited";
  gameSettings.rank = rank;
  // difficulty not restored
  saveGame();
}

// ── INIT ───────────────────────────────────────────────────
function initEngine() {
  const loaded = loadGame();
  if (!loaded) newGame();
  gameState.verdictTracker.rank = gameSettings.rank;
  // difficulty not tracked
  NocturneEngine.emit("engineReady", { loaded });
}

// ── DEV SHORTCUT — remove before launch ───────────────────
// In browser console type: localStorage.setItem('devRoom','foyer'); location.reload();
NocturneEngine.on('engineReady', () => {
  const devRoom = localStorage.getItem('devRoom');
  if (devRoom) {
    localStorage.removeItem('devRoom');
    // Apply any dev flags (e.g. skip tunnel, unlock vault)
    const devFlags = localStorage.getItem('devFlags');
    if (devFlags) {
      localStorage.removeItem('devFlags');
      try {
        const flags = JSON.parse(devFlags);
        Object.assign(gameState, flags);
      } catch(e) {}
    }
    // Full conversation reset — wipe char dialogue so questions are fresh
    gameState.char_dialogue_complete = {};
    gameState.characters = {};
    gameState._recoveryCount = {};
    gameState._techniqueSwitched = {};
    gameState._cognitiveLoadUsed = {};
    setTimeout(() => {
      if (typeof navigateTo === 'function') {
        // If landing in a compact room, fire arriveAtCompact first to set up state + map
        if (devRoom.startsWith('c') && typeof arriveAtCompact === 'function') {
          arriveAtCompact('cellar');
        }
        navigateTo(devRoom);
        if (typeof renderCurrentRoom === 'function') renderCurrentRoom();
        if (typeof renderRoomNav === 'function') renderRoomNav();
      }
    }, 500);
  }
});

// Expose globals
window.NocturneEngine = NocturneEngine;
window.NocturneConfig = NocturneConfig;
window.gameState = gameState;
window.gameSettings = gameSettings;
window.ITEMS = ITEMS;
window.ROOM_OBJECTS = ROOM_OBJECTS;
window.COMBINATION_CHAINS = COMBINATION_CHAINS;
window.ROOM_ADJACENCY = ROOM_ADJACENCY;
window.ACCUSABLE_CHARACTERS = ACCUSABLE_CHARACTERS;
window.FIXED_TRUTH = FIXED_TRUTH;
window.ASSET_BASE = ASSET_BASE;

// Functions
window.initEngine = initEngine;
window.newGame = newGame;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.haptic = haptic;
window.getHourWindow = getHourWindow;
window.navigateTo = navigateTo;
window.tapObject = tapObject;
window.handleKeep = handleKeep;
window.handlePickUp = handlePickUp;
window.dropItem = dropItem;
window.collectItem = collectItem;
window.hasItem = hasItem;
window.inventoryFull = inventoryFull;
window.inventoryLimit = inventoryLimit;
window.openInlineDropSelector = openInlineDropSelector;
window.executeInlineDrop = executeInlineDrop;
window.tapInventoryItem = tapInventoryItem;
window.openItemExaminePanel = openItemExaminePanel;
window.attemptCombine = attemptCombine;
window.filterInventoryForPedestal = filterInventoryForPedestal;
window.placeEvidenceOnPedestal = placeEvidenceOnPedestal;
// ── STAGE GATE BLOCKED ────────────────────────────────────
// Fires when MOM is assembled but timeline is not confirmed.
// Progressive messages — each attempt gives slightly more direction.
// Never names the missing witness. Points toward the terrace.
NocturneEngine.on("stageGateBlocked", ({ accused, reason, message }) => {
  if (typeof showToast !== "function") return;

  // Track attempt count per accused
  if (!gameState._stageGateAttempts) gameState._stageGateAttempts = {};
  const attempts = (gameState._stageGateAttempts[accused] || 0) + 1;
  gameState._stageGateAttempts[accused] = attempts;

  // Progressive messages for Surgeon specifically
  // Other suspects use the standard message from the event
  if (accused === 'surgeon') {
    if (attempts === 1) {
      showToast(message || "The evidence names a man. The record does not yet place him.");
    } else if (attempts === 2) {
      showToast("The record requires a witness who places him at the railing. The terrace faces the balcony directly.");
    } else {
      showToast("Someone was on the terrace at seven forty-five. The terrace faces the balcony without obstruction.");
    }
  } else {
    showToast(message || "The case is assembled. The timeline is not.");
  }
});

window.resolveAccusation = resolveAccusation;
window.deliverVerdict = deliverVerdict;
window.resolveVerdictOutcome = resolveVerdictOutcome;
window.puzzleSolved = puzzleSolved;
window.puzzleFailed = puzzleFailed;
window.takeWalkthrough = takeWalkthrough;
window.fireDeception = fireDeception;
window.credibilityStrike = credibilityStrike;
window.getSurgeonMaxDepth = getSurgeonMaxDepth;
window.tapVaultDoor = tapVaultDoor;
window.tapVaultFileCase = tapVaultFileCase;
window.tapVaultSafe     = tapVaultSafe;
window.completeVaultPanelDrag = completeVaultPanelDrag;
window.tapTunnelDoor = tapTunnelDoor;
window.arriveAtCompact = arriveAtCompact;
window.revealSecretRoom = revealSecretRoom;
window.visitRoom = visitRoom;
window.checkRoomCompletion = checkRoomCompletion;
window.checkHedgeGapTrigger = checkHedgeGapTrigger;
window.markHotspotEssentialLeft = markHotspotEssentialLeft;
window.clearEssentialGlow = clearEssentialGlow;
window.trackDyingClue = trackDyingClue;
window.trackTunnelFound = trackTunnelFound;
window.VERDICT_STRINGS = VERDICT_STRINGS;
window.writeFranchiseRecord = writeFranchiseRecord;
