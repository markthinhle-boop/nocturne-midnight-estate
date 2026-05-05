// ============================================================
// NOCTURNE — interrogation.js
// Complete investigative interviewing simulator.
// Five techniques: The Account, The Pressure, The Approach,
//                  The Record, The Wait.
// Real-world methods: PEACE, Reid (inverted), Scharff, SUE,
//                     Cognitive Interview.
// Composure: 5 states, all expressed as prose — no meters.
// Branch chains: invisible until unlocked, cross-character.
// Evidence timing: SUE protocol — ask before reveal or reveal first.
// Baseline: approach phase establishes character register.
// Contamination: conversation order affects what characters know.
// KB v5.0 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── TECHNIQUE DEFINITIONS ─────────────────────────────────────
// real_world field is internal only — NEVER rendered in game UI.
// Methodology mapping lives in the institutional pitch deck and
// methodology PDF only. Players see callum_line only.
// Professionals decode callum_line through their own training.

const TECHNIQUES = {
  wait: {
    id:          'wait',
    label:       'patience · The Wait',
    callum_line: 'Say nothing. See what he fills it with.',
    real_world:  'Scharff + Cognitive combined', // INTERNAL ONLY — not rendered
    composure_multiplier: 0.0,
    snap_bonus:           2,
    opens_backstory:     false,
    word_tell_available: false,
    silence_timer_ms:    30000,
  },
  approach: {
    id:          'approach',
    label:       'conversation · The Approach',
    callum_line: 'Tell him almost everything. See what he corrects.',
    real_world:  'Scharff Technique',           // INTERNAL ONLY — not rendered
    composure_multiplier: 0.4,
    snap_bonus:           0,
    opens_backstory:     false,
    word_tell_available: true,
  },
  account: {
    id:          'account',
    label:       'narrative · The Account',
    callum_line: 'Let them talk. See what they choose to include.',
    real_world:  'PEACE / Cognitive Interview',  // INTERNAL ONLY — not rendered
    composure_multiplier: 0.6,
    snap_bonus:           1,
    opens_backstory:      true,
    word_tell_available:  false,
  },
  record: {
    id:          'record',
    label:       'precision · The Record',
    callum_line: 'Ask first. Show after.',
    real_world:  'Strategic Use of Evidence',   // INTERNAL ONLY — not rendered
    composure_multiplier: 1.0,
    snap_bonus:           0,
    opens_backstory:     false,
    word_tell_available: false,
  },
  pressure: {
    id:          'pressure',
    label:       'confrontation · The Pressure',
    callum_line: 'He knows I know. Make sure he feels that.',
    real_world:  'Reid (inverted)',              // INTERNAL ONLY — not rendered
    composure_multiplier: 1.8,
    snap_bonus:          -1,
    opens_backstory:     false,
    word_tell_available: true,
  },
};

// ── COMPOSURE THRESHOLDS ──────────────────────────────────────
// Five states. Each has a prose register signature.
// No numbers shown to player — only writing changes.

const COMPOSURE_STATES = {
  composed:   { min: 80,  label: 'Composed'   },  // Full sentences. Formal. Rehearsed.
  controlled: { min: 65,  label: 'Controlled' },  // Still formal. Slight qualifications appearing.
  strained:   { min: 45,  label: 'Strained'   },  // Shorter. First-person slippage. Pauses.
  fractured:  { min: 20,  label: 'Fractured'  },  // Fragments. Involuntary admission.
  collapsed:  { min: 0,   label: 'Collapsed'  },  // Snap + fracture simultaneously. Rarest.
};

// ── COMPOSURE COST BY QUESTION TYPE ──────────────────────────

const COMPOSURE_COSTS = {
  open_narrative:        3,
  focused_follow_up:    10,
  reverse_order_ask:    18,
  backstory_probe:       8,
  narrative_statement:   2,   // Scharff — barely feels like interrogation
  partial_claim:         5,
  evidence_withhold:     8,   // Ask about topic without showing evidence
  evidence_reveal:      20,   // Show evidence — highest single cost
  direct_confrontation: 22,   // Reid — always high cost
  cognitive_load:       15,   // Dual-task question type
  wait_silence:          0,   // Costs nothing — timer-based
};

// ── TECHNIQUE REGISTER (#3) ───────────────────────────────────
// One-word tonal preview shown under the callum_line on the
// technique selector. Not per-character — technique-wide.
// Replaces old verbose TECHNIQUE_HINTS ("composure drops fast" etc).
const TECHNIQUE_REGISTER = {
  wait:     'patience',
  approach: 'conversation',
  account:  'narrative',
  record:   'precision',
  pressure: 'confrontation',
};

// ── CHARACTER TELLS (#1) ──────────────────────────────────────
// Observational lines surfaced before the player picks the next
// technique. Each tell is unique to the character and written to
// point a perceptive player toward the optimal technique without
// naming the system. Surfaced once per turn, cycles, never repeats
// until the character's full tell pool is exhausted.
//
// optimal_technique mapping (from CHAR_META):
//   northcott/greaves/sovereign/archivist/crane → account
//   steward/ph/surgeon → record
//   ashworth/voss/heir → wait
//   curator/envoy/uninvited → approach
//   baron → wait
//
const CHARACTER_TELLS = {
  "northcott": [
    "Northcott has not stopped looking at the notebook on the desk between you. He wants you to ask about it.",
    "He shifts his weight onto the other foot. The first voluntary movement he has made since you sat down.",
    "His pencil is out of his pocket but he is not writing. He is waiting to be told what matters.",
    "The notebook is open to a specific page. He turned to it before you arrived.",
  ],
  "steward": [
    "The Steward's hands are folded in front of him. The position has not varied in three minutes.",
    "He addresses you as 'sir' even in pauses. The formality is not hospitality — it is distance.",
    "He has not looked at the door once. A man with nowhere else to be, or a man who has decided not to look.",
    "His collar is straight. His cuffs are straight. Something in him is not.",
  ],
  "ashworth": [
    "Lady Ashworth has been looking at the garden since you entered. She has not looked at you.",
    "She is holding a letter. She does not appear to be reading it. She does not put it down.",
    "The pause before she answers is the same length every time. She has practised this conversation.",
    "She finishes each sentence cleanly. No question yet has made her begin one she could not complete.",
  ],
  "curator": [
    "The Curator is arranging objects on his desk by some order you cannot read. He began before you arrived.",
    "He has offered you tea twice. The second time was after you declined the first.",
    "He speaks with the warmth of a man who has already decided what he will and will not say.",
    "His eyes move to the door when you ask anything specific. Not alarm — rehearsal.",
  ],
  "voss": [
    "Miss Voss has not filled a single silence yet. She is letting them sit.",
    "She answers questions you have not asked. Not evasion — priority.",
    "Her hands are in her lap and they have not moved. You would not know she was speaking from her hands.",
    "She stops mid-sentence sometimes. Not searching — selecting.",
  ],
  "pemberton-hale": [
    "Pemberton-Hale has taken his gloves off and put them on twice since you sat down.",
    "His writing case is on the table. He has not opened it. He has not put it away.",
    "He is performing composure. The performance is good enough that you can see it.",
    "Every sentence he finishes lands exactly where he wanted it to. No drift. No spillage.",
  ],
  "greaves": [
    "Greaves is tracking everything. You can see him cataloguing the conversation as it happens.",
    "He waits a beat after you finish speaking. Not to think — to confirm you are done.",
    "He keeps a small notebook. He has not written in it tonight. The notebook is usually full.",
    "His answers are precise. When he does not know, he says so. When he knows, he knows exactly.",
  ],
  "baron": [
    "The Baron has not stopped moving. His hand. His shoulder. The direction of his gaze.",
    "He answers before you finish the question. Then corrects himself. Then re-answers.",
    "He laughs at things that are not funny. The laugh is a punctuation mark he is using to end topics.",
    "His glass is empty. He has not noticed. He has been raising it to drink for the last minute.",
  ],
  "crane": [
    "Dr. Crane is precise. Every answer so far has been exactly the length it needed to be.",
    "She sets her bag on the floor in the same position each time she enters. That is a habit of a careful person.",
    "Her hands are clean. Of course they are clean. The care of the cleaning is what you noticed.",
    "She has not said a word that could be transcribed incorrectly.",
  ],
  "uninvited": [
    "He is watching you decide whether you believe him. He seems comfortable with whatever you decide.",
    "The room is warmer than it was. He has not moved.",
    "He is not a member of this Society. Everyone knows this. Nobody has said it.",
    "He offers explanations before you request them. The explanations are good. Too good.",
  ],
  "sovereign": [
    "The Sovereign is still. The kind of stillness that comes from forty-three years of waiting.",
    "He has already decided what he will tell you. The order is what remains.",
    "His voice is quiet. You lean in without meaning to. He has not raised it once.",
    "He watches your face the way a man reads a document he wrote himself.",
  ],
  "heir": [
    "The Heir has been reading a testimony on the wall since you entered. She has not turned.",
    "She answers without inflection. The content is varied. The tone is one tone.",
    "She will wait longer than you will. She has demonstrated this twice.",
    "Her attention is complete. Nothing you have said has been missed. Nothing has been acknowledged either.",
  ],
  "envoy": [
    "The Envoy is disarmingly forthcoming. He has volunteered three details you did not ask for.",
    "He speaks as if you are already on his side. You have not agreed to be.",
    "He laughs easily. The laughs are timed. The timing is excellent.",
    "He asks you more questions than you are asking him. He is doing it gently.",
  ],
  "archivist": [
    "The Archivist is at the piano. She is playing when she is nervous. She is playing now.",
    "She does not look up when you speak. She does when you stop.",
    "The music is Chopin. She picked it. She is not performing — she is self-soothing.",
    "She will answer anything you ask. The answers will be true. They will also be exactly what you asked for.",
  ],
  "surgeon": [
    "The Surgeon's composure is a surface. You cannot tell what is underneath it.",
    "He has not asked you a single question. A man being investigated usually has one.",
    "His hands are steady. Not held still — steady. There is a difference and he is demonstrating it.",
    "The warmth in his voice is perfectly calibrated. That is what concerns you.",
  ],
};

// ── COMPOSURE TRANSITION BEATS (#2) ───────────────────────────
// Single-line physical beat surfaced when a character crosses a
// composure threshold during interrogation. Not a UI meter — a
// prose observation the player sees. Each line unique per character
// per transition.
//
// Transitions: composed→controlled, controlled→strained,
//              strained→fractured, fractured→collapsed.
//
const COMPOSURE_TRANSITIONS = {
  "northcott": {
    "composed_to_controlled":   "He straightens his notebook. An unnecessary correction.",
    "controlled_to_strained":   "His pencil is in his hand. He did not take it out consciously.",
    "strained_to_fractured":    "He looks at the door for the first time since you began.",
    "fractured_to_collapsed":   "The notebook closes in his hands. He didn't mean to close it.",
  },
  "steward": {
    "composed_to_controlled":   "A small correction in his posture. Infinitesimal. You saw it.",
    "controlled_to_strained":   "He says 'sir' at the beginning of a sentence now, not only the end.",
    "strained_to_fractured":    "His hands unfold. He does not seem to know where to put them.",
    "fractured_to_collapsed":   "He stops addressing you as 'sir' mid-sentence. The word was there and then it was not.",
  },
  "ashworth": {
    "composed_to_controlled":   "Her fingers adjust the letter in her lap. The angle changes by a degree.",
    "controlled_to_strained":   "She looks at you for the first time since you sat down. Then back to the garden.",
    "strained_to_fractured":    "The letter is no longer in her hand. You did not see her set it down.",
    "fractured_to_collapsed":   "She is not looking at the garden anymore. She is looking at nothing.",
  },
  "curator": {
    "composed_to_controlled":   "The tea he offered is still on the desk between you. He has not offered it again.",
    "controlled_to_strained":   "He rearranges the objects on the desk. The order is no longer clear.",
    "strained_to_fractured":    "He pauses in the middle of a sentence and does not resume.",
    "fractured_to_collapsed":   "He looks at you directly. The warmth is gone. What is underneath is very tired.",
  },
  "voss": {
    "composed_to_controlled":   "She stops answering questions you have not asked. She is waiting for yours.",
    "controlled_to_strained":   "A pause appears where there was none before. Long enough that you notice.",
    "strained_to_fractured":    "Her hands move. It is the first time they have moved tonight.",
    "fractured_to_collapsed":   "She looks at the desk. She is not selecting anymore. She is looking.",
  },
  "pemberton-hale": {
    "composed_to_controlled":   "His gloves are off. He is not reaching for them.",
    "controlled_to_strained":   "The writing case is open. He did not open it in front of you before.",
    "strained_to_fractured":    "The performance cracks once. You see him underneath it. Then the performance returns.",
    "fractured_to_collapsed":   "He stops performing. The man underneath is not composed. He is exhausted.",
  },
  "greaves": {
    "composed_to_controlled":   "He does not wait the beat anymore. He is answering faster than he did.",
    "controlled_to_strained":   "His notebook is in his hand. He has not opened it.",
    "strained_to_fractured":    "He writes something. A single word. He does not show you.",
    "fractured_to_collapsed":   "The notebook closes. He looks at it as if he is not sure what he wrote.",
  },
  "baron": {
    "composed_to_controlled":   "The laugh has stopped. He did not notice he was using it.",
    "controlled_to_strained":   "He stops moving. The stillness is louder than the motion was.",
    "strained_to_fractured":    "He puts the glass down. He looks at his own hand as if it surprised him.",
    "fractured_to_collapsed":   "He says nothing for a full beat. The Baron saying nothing is a kind of noise.",
  },
  "crane": {
    "composed_to_controlled":   "Her answer is shorter than the previous one. A single word shorter.",
    "controlled_to_strained":   "She adjusts the bag on the floor. The position changes. The habit is disrupted.",
    "strained_to_fractured":    "Her hands are no longer clean in the way they were. She has touched something.",
    "fractured_to_collapsed":   "She stops being precise. For one sentence. Then the precision returns, and you understand what it was for.",
  },
  "uninvited": {
    "composed_to_controlled":   "He acknowledges the question more directly than he did the last one. An adjustment.",
    "controlled_to_strained":   "The warmth in the room has not changed. The warmth from him has.",
    "strained_to_fractured":    "He offers an explanation you did not ask for. The first ungraceful thing he has done.",
    "fractured_to_collapsed":   "He is not watching you anymore. He is watching something you cannot see.",
  },
  "sovereign": {
    "composed_to_controlled":   "The stillness changes quality. It is not the stillness of waiting anymore.",
    "controlled_to_strained":   "He lifts his eyes from the document he was not reading.",
    "strained_to_fractured":    "His voice stays quiet. The quietness is no longer restraint. It is something else.",
    "fractured_to_collapsed":   "He closes the document. He has been holding it for forty-three years.",
  },
  "heir": {
    "composed_to_controlled":   "She turns from the testimony on the wall. She has not done that yet.",
    "controlled_to_strained":   "The inflection returns to her voice. It sounds strange after the absence of it.",
    "strained_to_fractured":    "She acknowledges something you said twenty minutes ago. She has been carrying it.",
    "fractured_to_collapsed":   "She looks at the testimony she was reading. She was reading the fourth one. You understand now.",
  },
  "envoy": {
    "composed_to_controlled":   "The timing on the laugh is off by a half-beat. He corrects it. Too late.",
    "controlled_to_strained":   "He stops asking you questions. The conversation is yours now.",
    "strained_to_fractured":    "He volunteers a detail and then stops halfway through. He will not finish it.",
    "fractured_to_collapsed":   "The charm is gone. The man underneath it has been doing this for a very long time.",
  },
  "archivist": {
    "composed_to_controlled":   "The music stops. She keeps her hands on the keys.",
    "controlled_to_strained":   "She plays one note. Then another. Not a piece. A pause.",
    "strained_to_fractured":    "She turns from the piano. Her hands are still on it.",
    "fractured_to_collapsed":   "She stands. The piano is behind her for the first time since you entered.",
  },
  "surgeon": {
    "composed_to_controlled":   "The surface adjusts. Something behind it moved, and the surface followed.",
    "controlled_to_strained":   "The warmth in his voice is still calibrated. The calibration is visible now.",
    "strained_to_fractured":    "His hands are no longer steady. They are held still. You see the holding.",
    "fractured_to_collapsed":   "He asks you a question. It is the first one he has asked all evening.",
  },
};

// ── CONSEQUENCE ECHOES (#4) ───────────────────────────────────
// Post-response beat that tells the player what their technique
// just did — in prose, not mechanics. Fires once per question.
// Keyed by (character × technique × effectiveness).
//
// effectiveness derives from TECHNIQUE_COMPATIBILITY:
//   optimal   — technique matched counter_strategy well (>15)
//   neutral   — mild positive/negative (-10 to +15)
//   poor      — strong mismatch (<-15)
//
// One echo per combination. Unique per character. No repeats.
//
const CONSEQUENCE_ECHOES = {
  "northcott": {
    account:   { optimal: "He gave you more than you asked for. That is his instinct. You chose the technique that honoured it." },
    record:    { neutral: "He showed you the entry before you asked. The item was not necessary. The technique was not wrong." },
    approach:  { neutral: "He corrected your assumption. You learned something. He did not lose anything by telling you." },
    wait:      { poor:    "He filled the silence with what he had already decided to say. You could have asked for it directly." },
    pressure:  { poor:    "He will now require you to earn the next answer. A cooperative witness does not need pressure." },
  },
  "steward": {
    account:   { poor:    "He gave you the formal answer. The complete answer is underneath the formal one. The technique did not reach it." },
    record:    { optimal: "The evidence did what speech could not. He cannot refuse what you placed on the table." },
    approach:  { neutral: "He registered that you already know. That is useful. The formality has shifted." },
    wait:      { neutral: "The silence did not move him. Fourteen years of silence taught him how to outlast yours." },
    pressure:  { poor:    "He became more formal, not less. You have pushed him further from the answer." },
  },
  "ashworth": {
    account:   { neutral: "She told you what she has already decided to tell. The narrative was hers." },
    record:    { neutral: "She acknowledged the evidence without responding to it. The item did less than the question will." },
    approach:  { neutral: "She corrected you. Minimally. You learned the shape of what she is not saying." },
    wait:      { optimal: "She filled the silence with what she has been carrying. You waited longer than her composure." },
    pressure:  { poor:    "She redirected. Pressure does not work on someone who has already decided what to lose." },
  },
  "curator": {
    account:   { neutral: "He offered you tea again. Warmth is his deflection. The narrative went where he directed it." },
    record:    { neutral: "He identified the document before you named it. He has seen many documents." },
    approach:  { optimal: "He corrected one detail and left the rest. You now know exactly what he is protecting." },
    wait:      { neutral: "He continued arranging objects. The silence was a tool he also owns." },
    pressure:  { poor:    "The warmth vanished. You will not get it back. He is not warm to people who pressure him." },
  },
  "voss": {
    account:   { poor:    "She let you talk. You filled your own silence. She has not conceded anything." },
    record:    { poor:    "She has been handling documents for thirty-one years. Yours did not land." },
    approach:  { poor:    "She corrected a detail you did not claim. She is ahead of this technique." },
    wait:      { optimal: "She selected what to say next. Your patience let her choose. What she chose is what she meant." },
    pressure:  { poor:    "She did not answer. She waited until the pressure passed, the way one waits out weather." },
  },
  "pemberton-hale": {
    account:   { poor:    "He performed the narrative. You have a story now. It is his story." },
    record:    { optimal: "The evidence broke the performance. He cannot perform an object he has already touched." },
    approach:  { neutral: "He accepted your version. The acceptance was itself a performance. You saw the seam." },
    wait:      { neutral: "He did not fill the silence. He has rehearsed silence as carefully as speech." },
    pressure:  { neutral: "He escalated the performance. The composure is excellent. The excellence is now the tell." },
  },
  "greaves": {
    account:   { optimal: "He gave you the complete sequence. In order. He has been waiting to give it to someone." },
    record:    { neutral: "He identified the item and its context. He will now tell you what he knows about it." },
    approach:  { neutral: "He confirmed what you already believed. The confirmation was the point. Useful." },
    wait:      { poor:    "He waited as long as you did. Silence from a careful observer yields only silence." },
    pressure:  { poor:    "He noted the technique and registered it as unnecessary. You have lost his good opinion briefly." },
  },
  "baron": {
    account:   { poor:    "He produced the story he wanted you to have. Cheerful. Complete. Useless." },
    record:    { neutral: "He looked at the item and laughed. Then answered around it." },
    approach:  { neutral: "He corrected you into the version he prefers. You got a correction. Not a fact." },
    wait:      { optimal: "He filled the silence with something he did not intend to say. Then he laughed at having said it." },
    pressure:  { poor:    "He went louder. He has a louder to go to. Pressure is the one technique he has rehearsed." },
  },
  "crane": {
    account:   { optimal: "She gave you the sequence in precise order. She has been organising it since eight-oh-one." },
    record:    { neutral: "She identified the item accurately and accepted its implication. She is not denying the facts." },
    approach:  { neutral: "She corrected one element. The correction is itself information. She has told you something." },
    wait:      { poor:    "She waited with you. She is not uncomfortable with silence. Silence does not cost her anything." },
    pressure:  { poor:    "She became more precise, not less. Pressure sharpens her. That is not what you wanted." },
  },
  "uninvited": {
    account:   { neutral: "He narrated the room. Not the question. You have a beautiful sentence and no new information." },
    record:    { neutral: "He considered the item with interest. He did not touch it. He told you what he thought of it." },
    approach:  { optimal: "He corrected you. Minimally. The correction was the first concrete thing he has said." },
    wait:      { poor:    "He is comfortable in silences. He has been in this building longer than the silence has." },
    pressure:  { poor:    "Pressure is a language he does not speak. The room cooled. You will not recover the warmth." },
  },
  "sovereign": {
    account:   { optimal: "He gave you the sequence of forty-three years. He has been composing this answer the whole time." },
    record:    { neutral: "He recognised the item. He had prepared for it to arrive. You are late, but he is grateful." },
    approach:  { neutral: "He corrected the detail gently. You were close. He did not correct what was important." },
    wait:      { neutral: "He has waited forty-three years. Your silence did not disturb him. You learned nothing new." },
    pressure:  { poor:    "He did not respond to the technique. He responded to the fact that you chose it." },
  },
  "heir": {
    account:   { optimal: "She gave you the plan. Eight months. Seventeen variables. She will not repeat it." },
    record:    { neutral: "She knew the document before you produced it. Of course she did. She wrote it." },
    approach:  { neutral: "She corrected you cleanly. The correction contained more than the question asked for." },
    wait:      { optimal: "She waited until you were done waiting, then answered. Patience was the cost. She accepted payment." },
    pressure:  { poor:    "She did not react. She has been ready for pressure longer than you have known her name." },
  },
  "envoy": {
    account:   { poor:    "He gave you the narrative he prefers. It is very good. None of it is wrong. None of it is complete." },
    record:    { neutral: "He identified the document and praised your discovery. The praise was a redirection." },
    approach:  { optimal: "He corrected you — which means he conceded the frame. You now have a foothold." },
    wait:      { neutral: "He asked you a question in return. He has been running this conversation since it started." },
    pressure:  { poor:    "He became more charming. That is his pressure response. You will get less, not more." },
  },
  "archivist": {
    account:   { optimal: "She gave you the full account while her hands stayed on the keys. The music was composure. The words were not." },
    record:    { neutral: "She identified the document and told you where she filed it. She files everything." },
    approach:  { neutral: "She corrected one entry and left the rest. You now know which archive matters." },
    wait:      { neutral: "She filled the silence with a piece of music. The piece was an answer. You did not speak the language." },
    pressure:  { poor:    "The music stopped. That is her response to pressure. Starting it again will not be easy." },
  },
  "surgeon": {
    account:   { poor:    "He gave you a clinical narrative. Every word was true. None of it was the truth." },
    record:    { optimal: "The item produced a response he had not rehearsed. The first one tonight." },
    approach:  { poor:    "He corrected you. The correction was exactly what he wanted you to take away. You took it." },
    wait:      { neutral: "He let the silence stand. He did not need to fill it. Neither, it turns out, did you." },
    pressure:  { neutral: "He noted the escalation with professional interest. The composure adjusted. Nothing underneath it moved." },
  },
};

// ── PER-CHARACTER DEBRIEF (#6) ────────────────────────────────
// One-shot scorecard fired when a character's conversation closes
// (fracture, collapse, or manual exit after at least one question).
// Teaches the player the character archetype mid-run so they can
// adjust for the next suspect.
//
// Unique phrasing per character. Counter-strategy and optimal
// technique named in-world, not in system labels.
//
const SUSPECT_DEBRIEF = {
  "northcott":      { strategy_label: "Cooperative",                     strategy_line: "He wanted to help. The record was ready before you arrived.",                optimal_label: "narrative · The Account",     coaching_line: "Let him narrate. He has been holding the sequence for you." },
  "steward":        { strategy_label: "Formal withholding",              strategy_line: "He will not volunteer. The formality is a wall.",                           optimal_label: "patience · The Wait",        coaching_line: "He defers in conversation. Silence forces him to fill the air with what he was told to hide." },
  "ashworth":  { strategy_label: "Grief-redirection",               strategy_line: "She is grieving. She will redirect the conversation toward what she has already accepted.", optimal_label: "precision · The Record",      coaching_line: "She wants emotional weight acknowledged. The clinical record reduces grief to a fact, and that is what breaks her." },
  "curator":        { strategy_label: "Warm withholding",                strategy_line: "He controls the warmth. The warmth is how he controls the room.",           optimal_label: "conversation · The Approach",    coaching_line: "Feed him almost everything. Let him correct the one thing that matters." },
  "voss":           { strategy_label: "Strategic fragmentation",         strategy_line: "She chooses what to say next. Her silences are selections.",                optimal_label: "patience · The Wait",        coaching_line: "Outlast her selection. What she eventually chooses is what she means." },
  "pemberton-hale": { strategy_label: "Performed composure",             strategy_line: "The composure is the performance. He has rehearsed it for eight years.",   optimal_label: "conversation · The Approach", coaching_line: "Feed him your version of the Register entry. The forger cannot resist correcting the wording. The correction is the admission." },
  "greaves":        { strategy_label: "Cooperative precision",           strategy_line: "He will tell you exactly what he knows. He will not guess.",                 optimal_label: "narrative · The Account",     coaching_line: "Open the narrative. His observation is complete. Your questions do not need to be." },
  "baron":          { strategy_label: "Fragmentation under noise",       strategy_line: "He produces motion and laughter in place of answers.",                      optimal_label: "confrontation · The Pressure",    coaching_line: "He uses silence as power. Pressure inverts his dynamic. Make sure he feels that you know." },
  "crane":          { strategy_label: "Clinical fragmentation",          strategy_line: "She is precise in pieces. Each piece is true. The pieces do not assemble.", optimal_label: "patience · The Wait",        coaching_line: "She wants to give an account. Let her find the silence first. The piece she fills it with is the wrong one." },
  "uninvited":      { strategy_label: "Redirective performance",         strategy_line: "He redirects every question into atmosphere and implication.",              optimal_label: "conversation · The Approach",    coaching_line: "Feed him your version. His correction will be the only concrete thing he says." },
  "sovereign":      { strategy_label: "Forty-year cooperation",          strategy_line: "He has been waiting for you. He will give the full sequence. Once.",        optimal_label: "narrative · The Account",     coaching_line: "Let him deliver what he has composed. Do not interrupt the structure." },
  "heir":           { strategy_label: "Fragmented authority",            strategy_line: "She carries the plan in pieces. Each piece is weaponised.",                 optimal_label: "patience · The Wait",        coaching_line: "She will outlast your waiting — but after she does, she will answer completely." },
  "envoy":          { strategy_label: "Redirective charm",               strategy_line: "He asks you more questions than you ask him. Gently.",                      optimal_label: "conversation · The Approach",    coaching_line: "Tell him what you think happened. The correction is the only real move he has." },
  "archivist":      { strategy_label: "Cooperative through music",       strategy_line: "The piano is her composure. The words are offered freely.",                  optimal_label: "narrative · The Account",     coaching_line: "Do not stop the music. Let her narrate while her hands are occupied." },
  "surgeon":        { strategy_label: "Performed warmth",                strategy_line: "The warmth is calibrated. Every technique adjusts around it. The thing underneath does not move.", optimal_label: "precision · The Record",      coaching_line: "He cannot perform an object he has already touched. The mask is the break." },
};

// ── RUNTIME HELPERS (Tells, Transitions, Echoes, Debrief) ─────
// Small API surface used by UI. Kept here so all character-facing
// prose lives in one file.

const _tellRotation = Object.create(null);       // charId → [shuffled tell indexes]
const _echoFiredThisTurn = Object.create(null);  // charId → true once per turn
const _debriefFiredFor = Object.create(null);    // charId → true (once per case)

function getCharacterTell(charId) {
  const pool = CHARACTER_TELLS[charId];
  if (!pool || !pool.length) return null;
  let rot = _tellRotation[charId];
  if (!rot || !rot.length) {
    rot = pool.map((_, i) => i);
    // Fisher-Yates
    for (let i = rot.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rot[i], rot[j]] = [rot[j], rot[i]];
    }
    _tellRotation[charId] = rot;
  }
  const idx = rot.shift();
  return pool[idx];
}

function getComposureTransitionLine(charId, prevState, nextState) {
  const t = COMPOSURE_TRANSITIONS[charId];
  if (!t) return null;
  const key = prevState + '_to_' + nextState;
  return t[key] || null;
}

function _classifyEffectiveness(charId, techniqueId) {
  try {
    const meta = (window.CHAR_META || {})[charId];
    if (!meta || !meta.counter_strategy) return 'neutral';
    const compat = (window.TECHNIQUE_COMPATIBILITY || {})[techniqueId];
    if (!compat) return 'neutral';
    const score = compat[meta.counter_strategy];
    if (score === undefined) return 'neutral';
    if (score > 15)  return 'optimal';
    if (score < -15) return 'poor';
    return 'neutral';
  } catch (e) { return 'neutral'; }
}

function getConsequenceEcho(charId, techniqueId) {
  const charEchoes = CONSEQUENCE_ECHOES[charId];
  if (!charEchoes) return null;
  const techEchoes = charEchoes[techniqueId];
  if (!techEchoes) return null;
  const eff = _classifyEffectiveness(charId, techniqueId);
  return techEchoes[eff] || techEchoes.neutral || techEchoes.optimal || techEchoes.poor || null;
}

function getSuspectDebrief(charId) {
  return SUSPECT_DEBRIEF[charId] || null;
}

// ── ESCALATED FAILURE STATE (#F) ──────────────────────────────
// Wrong-technique escalation for high-stakes suspects. Teaches
// technique-matters through visible, recoverable consequences.
//
// Escalation levels:
//   Level 0: normal (no penalty)
//   Level 1: after 1 consecutive 'poor' technique — warning echo (already exists)
//   Level 2: after 2 consecutive 'poor' — BRANCH LOCK
//            Branch questions won't unlock until composure recovers 15 points
//   Level 3: after 3 consecutive 'poor' — FRACTURE FLOOR RISE
//            Character becomes harder to break (threshold +10) for the rest
//            of the conversation. Persists even after recovery.
//
// ONE optimal technique clears the consecutive-poor counter back to 0.
// Neutral techniques neither increment nor reset — they're holding pattern.
//
// Applied only to HIGH_STAKES_CHARS. Minor characters stay responsive —
// this layer exists specifically to add weight to the core investigations.
const HIGH_STAKES_CHARS = ['surgeon', 'crane', 'steward', 'pemberton-hale', 'ashworth'];

// Per-character escalation state:
//   { consecutive_poor, branch_locked_until, fracture_floor_bonus, last_classification }
const _escalationState = Object.create(null);

// Per-character escalation lines — named for the specific suspect's
// psychology. Reused across the three levels.
const ESCALATION_LOCK_LINES = {
  'surgeon':        "He has registered the sequence of your choices. The warmth is still there. It is not for you anymore — it is for the memory of when you were closer to the truth than you are now. He will answer narrative questions. Nothing else, until you have re-earned what you just spent.",
  'crane':          "She is now being precise in a way that protects her specifically. The technique you chose told her what kind of investigator you are. She has adjusted. Narrative questions will still land. Pressure questions will find nothing to push against.",
  'steward':        "Sir. He says it once, then does not say it again. Fourteen years of formality has closed around whatever he might have said. Narrative questions remain available. The deeper questions have gone back into the wall they came from.",
  'pemberton-hale': "The performance has absorbed your technique as data. He is now performing a version of himself that is calibrated specifically to your approach. The rehearsed sentences are the only ones you will get until you stop giving him material to rehearse against.",
  'ashworth':  "She is looking at the garden again. You have told her something about how you work. She will return to narrative register — the safest ground for both of you. The other ground is closed until you find a different way of standing on it.",
};

const ESCALATION_FLOOR_LINES = {
  'surgeon':        "The warmth has hardened. He is now performing composure rather than maintaining it — which is a thing he has also done many times. You will not break him tonight. You can still reach him, but the cost of reaching him just went up.",
  'crane':          "Her precision has crystallised. She will not fragment again in this conversation. What you learn from her from here forward you will learn by listening, not by pressing.",
  'steward':        "His posture has not changed. That is the change. He has decided that you are not the person the Bond prepared him for. He will remain. He will not open.",
  'pemberton-hale': "The performance has achieved the state it has been rehearsing toward. He is composed in a way that cannot be broken by a third error. What you will get from here is what he has already prepared for you to get.",
  'ashworth':  "The grief has become composed. She has decided she does not trust you enough to be disorganised in front of you. You have the careful Lady Ashworth now. You will not get the other one back this evening.",
};

function _getEscalation(charId) {
  if (!_escalationState[charId]) {
    _escalationState[charId] = {
      consecutive_poor: 0,
      branch_locked_until_composure: null,
      fracture_floor_bonus: 0,
      last_classification: null,
    };
  }
  return _escalationState[charId];
}

function _applyEscalation(charId, classification) {
  if (!HIGH_STAKES_CHARS.includes(charId)) return null;
  const esc = _getEscalation(charId);
  esc.last_classification = classification;

  if (classification === 'optimal') {
    esc.consecutive_poor = 0;
    return null;
  }
  if (classification !== 'poor') {
    // Neutral — hold pattern, don't increment
    return null;
  }

  // poor
  esc.consecutive_poor++;

  if (esc.consecutive_poor === 2) {
    // BRANCH LOCK: lock branches until composure recovers 15 points
    const current = (gameState.characters[charId] || {}).composure || 100;
    esc.branch_locked_until_composure = Math.min(100, current + 15);
    return {
      level: 2,
      line: ESCALATION_LOCK_LINES[charId] || "The conversation has narrowed. Only basic questions remain available.",
    };
  }
  if (esc.consecutive_poor >= 3) {
    // FRACTURE FLOOR RISE: permanently raise threshold for this conversation
    if (esc.fracture_floor_bonus < 10) {
      esc.fracture_floor_bonus = 10;
      return {
        level: 3,
        line: ESCALATION_FLOOR_LINES[charId] || "The character has hardened. Further pressure will produce diminishing returns.",
      };
    }
  }
  return null;
}

function isBranchLocked(charId) {
  if (!HIGH_STAKES_CHARS.includes(charId)) return false;
  const esc = _escalationState[charId];
  if (!esc || !esc.branch_locked_until_composure) return false;
  const current = (gameState.characters[charId] || {}).composure || 100;
  if (current >= esc.branch_locked_until_composure) {
    // Recovered — clear the lock
    esc.branch_locked_until_composure = null;
    return false;
  }
  return true;
}

function getFractureFloorBonus(charId) {
  const esc = _escalationState[charId];
  return esc ? (esc.fracture_floor_bonus || 0) : 0;
}

function resetEscalation(charId) {
  delete _escalationState[charId];
}

// Expose for UI
window.CHARACTER_TELLS          = CHARACTER_TELLS;
window.COMPOSURE_TRANSITIONS    = COMPOSURE_TRANSITIONS;
window.CONSEQUENCE_ECHOES       = CONSEQUENCE_ECHOES;
window.SUSPECT_DEBRIEF          = SUSPECT_DEBRIEF;
window.TECHNIQUE_REGISTER       = TECHNIQUE_REGISTER;
window.HIGH_STAKES_CHARS        = HIGH_STAKES_CHARS;
window.ESCALATION_LOCK_LINES    = ESCALATION_LOCK_LINES;
window.ESCALATION_FLOOR_LINES   = ESCALATION_FLOOR_LINES;
window.getCharacterTell         = getCharacterTell;
window.getComposureTransitionLine = getComposureTransitionLine;
window.getConsequenceEcho       = getConsequenceEcho;
window.getSuspectDebrief        = getSuspectDebrief;
window.isBranchLocked           = isBranchLocked;
window.getFractureFloorBonus    = getFractureFloorBonus;
window.resetEscalation          = resetEscalation;
window._applyEscalation         = _applyEscalation;
window._getEscalation           = _getEscalation;

// ═══════════════════════════════════════════════════════════
// HALE LINE-OF-QUESTIONING ENGINE
// New interrogation architecture for Pemberton-Hale only.
// Reads from characters.js 'opening', 'lines', 'line_techniques',
// 'followups', 'gates', 'gate_techniques', 'diversions'.
// State stored in gameState.haleSession.
// ═══════════════════════════════════════════════════════════

const HALE_LINES = ['register', 'ashworth', 'others'];
const HALE_TECHNIQUES_BASE = ['wait', 'account', 'approach', 'pressure'];

let _haleSessionData = null;

// ── HALE SNAPBACK ─────────────────────────────────────────────────
const HALE_SNAPBACK = {
  ashworth: {
    question: '"You\'ve asked me about Lord Ashworth twice now in different ways. Let me ask you something." A pause. "In your assessment — what was I afraid of?"',
    options: [
      { id: 'A', text: 'That he would use the clause against you.' },
      { id: 'B', text: 'That he already knew everything and was deciding when to act.' },
      { id: 'C', text: 'That tonight was going to be the night.' },
    ],
    responses: {
      A: {
        kind: 'wrong',
        text: '"You haven\'t been listening." A pause. He almost smiles. "That is a common problem in your profession. People ask questions and hear the answers they expected rather than the ones they received." He straightens his cuff. Once. "Come back when you\'ve decided to pay attention." He turns to the window.',
        consequence: 'ashworth_branch_locked',
      },
      B: {
        kind: 'correct',
        text: '"Yes." One word. A pause longer than any previous. "He reviewed my membership when I joined. He asked one question that was not standard. I answered it. He wrote something down." He looks at the writing case. "In thirty years I never found out what he wrote. That is what I was afraid of. Not the clause. The note."',
        grants: 'hale_ashworth_deep',
      },
      C: {
        kind: 'partial',
        text: 'He nods once. Slowly. "That is part of it." He looks at the window. Nothing more.',
      },
    },
  },
};

function haleSnapbackAnswer(branch, optionId) {
  const s = getHaleSession();
  const snap = HALE_SNAPBACK[branch];
  if (!snap) return null;
  s.snapbackFired = true;
  s.snapbackPending = false;
  const result = snap.responses[optionId];
  if (!result) return null;
  if (result.kind === 'wrong') {
    // Lock branch on wrong snapback answer
    s.ashworthBranchLocked = true;
    if (!s.completedLines) s.completedLines = [];
    if (!s.completedLines.includes('ashworth')) s.completedLines.push('ashworth');
  }
  if (result.grants) {
    if (!s.flags) s.flags = {};
    s.flags[result.grants] = true;
    // Surface the node — it enters node_inventory only when player taps the pencil
    if (typeof window.surfaceNode === 'function') {
      window.surfaceNode(result.grants, 'pemberton-hale');
    }
  }
  return result;
}

window.HALE_SNAPBACK           = HALE_SNAPBACK;
window.haleSnapbackAnswer      = haleSnapbackAnswer;

function initHaleSession() {
  if (_haleSessionData) return _haleSessionData;
  _haleSessionData = {
    openingAsked:      false,
    lineSelected:      null,
    techniqueSelected: null,
    followupAsked:     null,
    gateState:         {},
    diversionQueue:    [],
    flags:             {},
    pencilCaptured:    false,
    completedLines:    [],
    usedTechniques:    {},
    lastTechnique:     null,
  };
  if (window.gameState) window.gameState.haleSession = _haleSessionData;
  return _haleSessionData;
}

function getHaleSession() {
  if (!_haleSessionData) return initHaleSession();
  return _haleSessionData;
}

function haleOpeningAsked() {
  const s = getHaleSession();
  s.openingAsked = true;
  // Write to char_dialogue_complete so paywall trigger sees Hale as talked-to
  if (window.gameState) {
    if (!window.gameState.char_dialogue_complete) window.gameState.char_dialogue_complete = {};
    if (!window.gameState.char_dialogue_complete['pemberton-hale']) {
      window.gameState.char_dialogue_complete['pemberton-hale'] = {};
    }
    window.gameState.char_dialogue_complete['pemberton-hale']['opening'] = true;
  }
}

function haleSelectLine(lineId) {
  const s = getHaleSession();
  s.lineSelected = lineId;
  s.techniqueSelected = null;
  s.followupAsked = null;
}

function haleSelectTechnique(techId) {
  const s = getHaleSession();
  s.techniqueSelected = techId;
  s.lastTechnique = techId;
  s.followupAsked = null;
  // Track used techniques per line
  if (s.lineSelected) {
    if (!s.usedTechniques[s.lineSelected]) s.usedTechniques[s.lineSelected] = [];
    if (!s.usedTechniques[s.lineSelected].includes(techId)) {
      s.usedTechniques[s.lineSelected].push(techId);
    }
  }
  // Snapback trigger — arms after 2nd technique on Ashworth branch.
  // Fires AFTER the follow-up is chosen (checked in _haleFireFollowup), not before.
  if (s.lineSelected === 'ashworth'
      && !s.snapbackFired
      && (s.usedTechniques['ashworth'] || []).length === 2) {
    s.snapbackPending = true;
  }
  // NOTE: composure cost is applied in ui.js _haleFireLineTechnique (single apply point).
  // Branch-lock logic lives in ui.js _haleFireFollowup (capture-aware). Not duplicated here.
}

function haleAskFollowup(followupId) {
  const s = getHaleSession();
  const char = (window.CHARACTERS || {})['pemberton-hale'];
  if (!char || !char.followups) return null;
  // Use lastTechnique — techniqueSelected is null after firing
  const pool = (char.followups[s.lineSelected] || {})[s.lastTechnique] || [];
  const q = pool.find(f => f.id === followupId);
  if (!q) return null;
  s.followupAsked = followupId;
  // Persistent follow-up history — survives across techniques and visits, used by debrief
  if (!s.askedFollowups) s.askedFollowups = {};
  s.askedFollowups[followupId] = true;
  // Mark excluded followup as asked too
  if (q.excludes) {
    const excluded = pool.find(f => f.id === q.excludes);
    if (excluded) s.followupAsked = followupId; // just tracks one
  }
  if (q.flag) s.flags[q.flag] = true;
  // Pencil flash — fires every time a pencil_flash follow-up is chosen (not just once).
  // Player may have deleted the previous capture, requiring a fresh flash to recapture.
  if (q.pencil_flash) {
    if (window.gameState) {
      window.gameState.halePencilFlashPending = true;
      window.gameState.halePencilNode = q.pencil_node;
    }
  }
  return q;
}

function haleCapturePencil() {
  const s = getHaleSession();
  s.pencilCaptured = true;
  window.gameState.halePencilFlashPending = false;
  // The pencil tap is the canonical capture moment — promote into node_inventory + captured_nodes.
  if (window.gameState.halePencilNode && typeof window.captureNode === 'function') {
    window.captureNode(window.gameState.halePencilNode);
  }
}

function haleGateAvailable(gateId) {
  const s = getHaleSession();
  const char = (window.CHARACTERS || {})['pemberton-hale'];
  if (!char || !char.gates || !char.gates[gateId]) return false;
  const gate = char.gates[gateId];
  const flagMet = gate.requires_flag ? !!s.flags[gate.requires_flag] : true;
  const itemMet = gate.requires_item
    ? !!((window.gameState.inventory || {})[gate.requires_item])
    : true;
  const notCleared = s.gateState[gateId] !== 'cleared';
  return flagMet && itemMet && notCleared;
}

function halePickGateTechnique(gateId, techId) {
  const s = getHaleSession();
  const char = (window.CHARACTERS || {})['pemberton-hale'];
  if (!char || !char.gate_techniques || !char.gate_techniques[gateId]) return null;
  const tech = char.gate_techniques[gateId][techId];
  if (!tech) return null;
  // Apply composure
  if (tech.composure) {
    window.gameState.composure = Math.max(0, (window.gameState.composure || 100) + tech.composure);
  }
  if (tech.kind === 'failure' && s.gateState[gateId] !== 'diverted') {
    s.gateState[gateId] = 'diverted';
    // Load diversion queue
    const divKey = gateId + '_' + techId;
    const divs = (char.diversions || {})[divKey] || [];
    s.diversionQueue = divs.map(d => d.id);
  } else {
    s.gateState[gateId] = 'cleared';
    if (char.gates[gateId].grants) {
      // Surface the node — entry into node_inventory deferred until pencil tap
      if (typeof window.surfaceNode === 'function') {
        window.surfaceNode(char.gates[gateId].grants, 'pemberton-hale');
      }
    }
    // Slip fires
    if (char.gates[gateId].slip) {
      window.gameState.phSlipFired = true;
    }
  }
  return tech;
}

function haleAvailableFollowups() {
  const s = getHaleSession();
  const char = (window.CHARACTERS || {})['pemberton-hale'];
  if (!char || !char.followups || !s.lineSelected || !s.techniqueSelected) return [];
  const pool = (char.followups[s.lineSelected] || {})[s.techniqueSelected] || [];
  // Filter out the excluded followup
  return pool.filter(f => f.id !== s.followupAsked);
}

window.initHaleSession          = initHaleSession;
window.getHaleSession           = getHaleSession;
window.resetHaleSession         = function() { _haleSessionData = null; };
window.haleOpeningAsked         = haleOpeningAsked;
window.haleSelectLine           = haleSelectLine;
window.haleSelectTechnique      = haleSelectTechnique;
window.haleAskFollowup          = haleAskFollowup;
window.haleCapturePencil        = haleCapturePencil;
window.haleGateAvailable        = haleGateAvailable;
window.halePickGateTechnique    = halePickGateTechnique;
window.haleAvailableFollowups   = haleAvailableFollowups;

// ═══════════════════════════════════════════════════════════
// NORTHCOTT SESSION — behavioral event bridge
// Emits NocturneEngine events for new architecture so
// behavioral_logger.js scores correctly via event listeners.
// ═══════════════════════════════════════════════════════════

function northcottEmitTechnique(techId, qId, composureDelta, grants) {
  if (typeof NocturneEngine === 'undefined') return;
  const charId = 'northcott';

  // Universal events
  NocturneEngine.emit('techniqueSelected', { charId, technique: techId });
  NocturneEngine.emit('questionAnswered',  { charId, qId, qType: techId });

  // Composure change event — actual composure cost applied in ui.js (single apply point).
  // Emit the event for behavioral logger tracking only.
  if (composureDelta && window.gameState) {
    NocturneEngine.emit('composureChanged', { charId, state: 'changed', composure: window.gameState.composure });
  }

  // Technique-specific model events
  if (techId === 'wait') {
    NocturneEngine.emit('silenceFillFired', { charId });
  }
  if (techId === 'approach') {
    NocturneEngine.emit('narrativeStatementUsed', { charId });
  }
  if (techId === 'pressure') {
    // Northcott is cooperative — pressure = BS penalty
    NocturneEngine.emit('directConfrontationUsed', { charId, targetIsGuilty: false });
  }

  // Node grants — surface only; capture happens on pencil tap.
  // Behavioral branch-completion events still fire here because they reflect
  // the dialogue beat (the player asked the right question), not the capture.
  if (grants) {
    grants.split(' ').forEach(nodeId => {
      if (!nodeId) return;
      if (typeof window.surfaceNode === 'function') {
        window.surfaceNode(nodeId, charId);
      }
      // Branch completion for MMM nodes
      if (nodeId === 'northcott_vivienne_motive') {
        NocturneEngine.emit('branchCompleted', { charId, branchId: 'motive', isContradicting: false });
      }
      if (nodeId === 'northcott_false_gap') {
        NocturneEngine.emit('branchCompleted', { charId, branchId: 'false_timeline', isContradicting: false });
      }
    });
  }
}

function northcottEmitWarmup() {
  if (typeof NocturneEngine === 'undefined') return;
  const charId = 'northcott';
  NocturneEngine.emit('backstoryComplete', { charId });
  NocturneEngine.emit('approachCompleted', { charId });
}

function northcottEmitConversationOpen() {
  if (typeof NocturneEngine === 'undefined') return;
  NocturneEngine.emit('conversationOpened', { charId: 'northcott' });
}

window.northcottEmitTechnique         = northcottEmitTechnique;
window.northcottEmitWarmup            = northcottEmitWarmup;
window.northcottEmitConversationOpen  = northcottEmitConversationOpen;

// ═══════════════════════════════════════════════════════════
// PORTRAIT REACTION ENGINE — 3-layer system
// ═══════════════════════════════════════════════════════════
// Layer 1: ambient breathing keyed to composure
// Layer 2: per-question beats (optimal/poor/neutral/lockin/break)
// Layer 3: per-character scripted signatures on pivot moments
// ═══════════════════════════════════════════════════════════

const PORTRAIT_REACTION_CLASSES = [
  'breath-composed','breath-controlled','breath-strained','breath-fractured','breath-collapsed',
  'react-recognition','react-closing','react-lockin','react-break',
  'state-broken','state-transition',
  'sig-surgeon-sc1','sig-crane-cb3','sig-steward-bc2','sig-vivienne-vc2','sig-ashworth-bc3','sig-hatch-hb2',
];

const PORTRAIT_BREATH_CLASSES = [
  'breath-composed','breath-controlled','breath-strained','breath-fractured','breath-collapsed',
];

const PORTRAIT_SIGNATURES = {
  'surgeon:SC1':    'sig-surgeon-sc1',
  'crane:CB3':      'sig-crane-cb3',
  'steward:BC2':    'sig-steward-bc2',
  'vivienne:VC2':   'sig-vivienne-vc2',
  'ashworth:BC3':   'sig-ashworth-bc3',
  'hatch:HB2':      'sig-hatch-hb2',
};

function _portraitsFor(charId) {
  const out = [];
  const legacy = document.getElementById('char-portrait');
  if (legacy) out.push(legacy);
  if (charId) {
    const multi = document.getElementById(`conv-portrait-${charId}`);
    if (multi) out.push(multi);
  }
  return out;
}

function _breathClassForComposure(composure) {
  if (composure == null) composure = 100;
  if (composure > 70) return 'breath-composed';
  if (composure > 55) return 'breath-controlled';
  if (composure > 40) return 'breath-strained';
  if (composure > 20) return 'breath-fractured';
  return 'breath-collapsed';
}

function applyPortraitBreath(charId) {
  const charState = (gameState.characters && gameState.characters[charId]) || {};
  const composure = charState.composure !== undefined ? charState.composure : 100;
  const targetClass = _breathClassForComposure(composure);
  _portraitsFor(charId).forEach(el => {
    // Detect real state change — is the target breath class different from what's applied?
    const hadDifferent = PORTRAIT_BREATH_CLASSES.some(c => c !== targetClass && el.classList.contains(c));
    PORTRAIT_BREATH_CLASSES.forEach(c => { if (c !== targetClass) el.classList.remove(c); });
    el.classList.add(targetClass);
    // Fire one-shot transition flash on real crossings (not on initial open)
    if (hadDifferent) {
      el.classList.remove('state-transition');
      // eslint-disable-next-line no-unused-expressions
      el.offsetWidth; // force reflow so animation restarts
      el.classList.add('state-transition');
      const onEnd = (ev) => {
        if (ev.animationName && ev.animationName.startsWith('stateTransitionFlash')) {
          el.classList.remove('state-transition');
          el.removeEventListener('animationend', onEnd);
        }
      };
      el.addEventListener('animationend', onEnd);
    }
  });
}

function firePortraitReaction(charId, reactionType) {
  if (!reactionType || reactionType === 'neutral') return;
  const classMap = {
    'optimal':  'react-recognition',
    'poor':     'react-closing',
    'lockin':   'react-lockin',
    'break':    'react-break',
  };
  const cls = classMap[reactionType];
  if (!cls) return;
  _portraitsFor(charId).forEach(el => {
    ['react-recognition','react-closing','react-lockin','react-break'].forEach(c => el.classList.remove(c));
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add(cls);
    if (cls === 'react-break') {
      const onEnd = (ev) => {
        if (ev.animationName && ev.animationName.startsWith('reactBreak')) {
          el.classList.remove('react-break');
          el.classList.add('state-broken');
          el.removeEventListener('animationend', onEnd);
        }
      };
      el.addEventListener('animationend', onEnd);
    } else {
      const onEnd = (ev) => {
        if (ev.animationName && (
          ev.animationName.startsWith('reactRecognition') ||
          ev.animationName.startsWith('reactClosing') ||
          ev.animationName.startsWith('reactLockin'))) {
          el.classList.remove(cls);
          el.removeEventListener('animationend', onEnd);
        }
      };
      el.addEventListener('animationend', onEnd);
    }
  });
}

function firePortraitSignature(charId, qId) {
  const key = `${charId}:${qId}`;
  const sigClass = PORTRAIT_SIGNATURES[key];
  if (!sigClass) return;
  _portraitsFor(charId).forEach(el => {
    Object.values(PORTRAIT_SIGNATURES).forEach(c => el.classList.remove(c));
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add(sigClass);
    if (sigClass === 'sig-steward-bc2') {
      setTimeout(() => el.classList.remove(sigClass), 2000);
    } else {
      const onEnd = () => {
        el.classList.remove(sigClass);
        el.removeEventListener('animationend', onEnd);
      };
      el.addEventListener('animationend', onEnd);
    }
  });
}

function clearPortraitReactions(charId) {
  _portraitsFor(charId).forEach(el => {
    PORTRAIT_REACTION_CLASSES.forEach(c => el.classList.remove(c));
  });
}

window.applyPortraitBreath    = applyPortraitBreath;
window.firePortraitReaction   = firePortraitReaction;
window.firePortraitSignature  = firePortraitSignature;
window.clearPortraitReactions = clearPortraitReactions;
window.PORTRAIT_SIGNATURES    = PORTRAIT_SIGNATURES;

// ═══════════════════════════════════════════════════════════

// ── CHARACTER INTERROGATION DATA ──────────────────────────────
// Full simulator data per character.
// counter_strategy, optimal_technique, composure variants,
// approach baseline, contamination responses, silence fills,
// branch chains, Scharff corrections, SUE committed statements.

const INTERROGATION_DATA = {

  // ── ALISTAIR ROWE ───────────────────────────────────────────
  // Own engine — see rowe.js. Does not use composure/technique system.
  // Flow: intro → Q1/Q2/Q3/Q4 (choices, any order) → FUNNEL (auto) → duel → DUEL_WIN/LOSE/DRAW → Q5/Q6 unlock
  'rowe': {
    engine:            'rowe',
    counter_strategy:  null,
    optimal_technique: null,
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'He noticed Callum before Callum finished entering the room. He has been in this foyer since seven-fourteen. He has a notebook. The note he made when Callum walked in has not been explained. He is the most observant person in the building and he chose the smallest room.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'He finishes sentences — not rudely, accurately. The tell is when he finishes one wrong. It means the topic is outside his model. His model does not often have gaps.',
    },

    // ── CHOICE ROUTING ─────────────────────────────────────
    // Q1-Q4 are player choices — any order, any one triggers FUNNEL.
    // FUNNEL fires automatically after first choice response.
    // Duel fires from FUNNEL. Results route to DUEL_WIN/LOSE/DRAW.
    // Q5/Q6 unlock only after duel_complete flag set.

    choice_funnel: {
      requires_any: ['Q1','Q2','Q3','Q4'],
      fires: 'FUNNEL',
    },

    duel_config: {
      id:         'rowe_iq_duel',
      rounds:     1,
      rowe_level: 0.94,
      on_win:     'DUEL_WIN',
      on_lose:    'DUEL_LOSE',
      on_draw:    'DUEL_DRAW',
    },
  },

  // ── NORTHCOTT ──────────────────────────────────────────────
  'northcott': {
    counter_strategy:  'cooperate',
    optimal_technique: 'account',
    composure_floor:   35,
    fracture_threshold: 40,

    baseline: {
      text:         'He registers your approach before you speak. He was already attentive before you arrived — not the attentiveness of a man doing his job, but of a man who has been waiting to be asked something and is afraid of what happens when he is.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'He says things before he finishes thinking them. The second tell: he checks the corridor before answering certain questions. Not for the investigator — for the Steward.',
    },

    composure_variants: {
      'Q1': {
        grants_node: 'northcott_false_timeline_foyer',
        timeline_critical: true,
        composed:   '"Six weeks. Lord Ashworth invited me personally. He said I had the right temperament for the Estate." A pause. "I\'m still learning what that means."',
        controlled: '"Six weeks." A pause. "Lord Ashworth. He said I\'d be useful here."',
        strained:   '"Six weeks." He says just that. Then looks at the Gallery door.',
        fractured:  '"Six weeks." A beat. "He placed me here specifically. I know that now. I didn\'t then."',
        snapback:   '"I\'ve told you how long I\'ve been here. Is there something specific about the arrival records?"',
      },
      'Q2': {
        // "Did you know Ashworth before tonight?"
        composed:   '"Lord Ashworth came to me before the Rite. In the east corridor." A pause. "He said he knew about an arrangement I had entered into with a member of the household staff. He said it violated Estate law. Formal. Binding." He is very still. "He said he was going to read it into the Register tonight. My name. Her name. The arrangement. The violation. Permanent record." He looks at the notebook. "He said it without anger. Just the statement and what it would mean." A pause. "I was not thinking about myself when he finished speaking. I was thinking about Vivienne." He looks at the corridor. Then back. "She has been here four years. I have been here six weeks. Whatever the Register does to me — she is the one who lives in this building afterward."',
        controlled: '"He came to me in the east corridor." A pause. "He told me he knew about my arrangement with a member of the household staff. He was going to name it in the Register tonight." He checks the corridor. "My name. Her name." Another pause. "I stopped thinking clearly after that."',
        strained:   '"He told me." A pause. He looks at the corridor. "Both names. In the Register. Tonight." Another pause. "I wasn\'t thinking about myself. I was thinking about her."',
        fractured:  '"Both names." A beat. He glances at the corridor. "Her name in the Register." Another beat. "I couldn\'t — I didn\'t know what to do."',
        snapback:   '"I record arrivals, sir. That is my function tonight."',
      },
      'Q3': {
        // "Have you been to the Vault?"
        approach_response: '"The Vault is one of the restricted areas. He named three — the Vault specifically, he was particular about it." A pause. "I haven\'t been near it. That was the instruction."',
        composed:   '"The Vault is a restricted area. Lord Ashworth was clear about that when he briefed me six weeks ago. He named three areas I was to avoid. He was most particular about the Vault. I have kept my distance from it all evening, as instructed."',
        controlled: '"He named it specifically. The Vault, the Records corridor, and the East wing storage. The Vault he mentioned twice." A pause. "I haven\'t been near it. I haven\'t asked what\'s in it."',
        strained:   '"I know not to go near it. He was particular. He used the word twice." A pause. "I wrote it down. I\'ve been very careful about it all evening." Another pause. "I don\'t know what\'s in it. I know that he was particular and that his voice changed when he said the word."',
        fractured:  '"He told me to stay away from it." A beat. "Vault." Another beat. "He said it twice. His voice changed."',
        snapback:   '"I have stayed at my post, sir. As instructed."',
      },
      'Q4': {
        composed:   '"I\'ve been here since seven. Most members arrived in the fifteen minutes after that." A pause. "There was one arrival later than expected. Through the garden. I didn\'t see the face."',
        controlled: '"Most members after seven-thirty. One earlier. Garden entrance." A pause. "Seven-oh-three."',
        strained:   '"Seven-oh-three." He says it like he\'s been holding it. "Garden entrance. I circled it."',
        fractured:  '"Seven-oh-three." A pause. "I circled it twice. I told the Steward. He nodded and didn\'t ask who it was." Another pause. "He knew."',
        snapback:   '"The notebook entry is accurate. Seven-oh-three. Garden. I wrote what I observed."',
      },
      'Q5': {
        // "You circled that entry in the notebook."
        composed:   '"I circled it because the arrival time and entrance were unusual." A pause. "I noted it and I reported it. I told the Steward at seven-twenty-five that there had been an unidentified arrival at seven-oh-three through the garden entrance." He holds the notebook precisely. "He acknowledged that. He asked no follow-up questions. I concluded he was already aware of it." Another pause. "In retrospect, his lack of follow-up questions is the most informative thing about that exchange."',
        controlled: '"I told the Steward. That same hour." A pause. "He nodded. He didn\'t ask for a description." He looks at the notebook. "I\'ve been thinking about that nod since eight-oh-one."',
        strained:   '"Told the Steward." A pause. "He knew already. He had to have known." Another pause. "He nodded the way you nod when someone tells you something you\'ve been waiting to hear."',
        fractured:  '"The Steward knew." A beat. "He nodded. Didn\'t ask anything." A beat. "I should have asked him why."',
        snapback:   '"The notebook entry is what I observed. I reported it at the time."',
      },
      'Q6': {
        // "Describe the seven-oh-three arrival."
        composed:   '"Medium height. Carrying a case or bag, not large. Moving deliberately — not hurrying, but with clear directional intent.\" He looks at his notebook. "The entrance they used — the garden gate — is not the primary entrance for members. It\'s used for service access and private arrivals. Someone who uses it on a formal Rite evening understands exactly why they\'re using it."',
        controlled: '"Medium height. A bag or case. Moving deliberately." A pause. "They knew which entrance to use." He looks at the notebook. "That is the most important detail. Not the height. The choice."',
        strained:   '"Medium height. Something in their hands." A pause. "The pace." He says it like the pace is still in front of him. "Not running. Not casual. The pace of someone on a schedule."',
        fractured:  '"Medium height." A beat. "A schedule. They were on a schedule." Another beat. "I know that because I know what it looks like to not be on a schedule. Everyone else tonight was not on a schedule."',
        snapback:   '"What I observed is in the notebook. That is the accurate record."',
      },
      'Q7': {
        // "Did Ashworth tell you what to do if something happened."
        composed:   '"He said: keep the record, and if anything unusual happens, don\'t let anyone tell you your record is wrong." A pause. "He said it with a specific kind of emphasis. The kind that means: this will be tested. He was telling me in advance that the record would be challenged." He looks at the notebook. "When the Steward acknowledged my seven-oh-three report without asking a single follow-up question, I understood that Lord Ashworth had anticipated exactly that kind of response."',
        controlled: '"He said don\'t let anyone tell you your record is wrong." A pause. "He said it like it was going to happen." Another pause. "He was right. Three people asked to see the notebook tonight."',
        strained:   '"Don\'t let anyone tell you your record is wrong." He says it exactly. "That\'s what he said. Six weeks ago." A pause. "He knew someone would try."',
        fractured:  '"He knew." A beat. "He knew someone would challenge it." Another beat. "He told me specifically so someone couldn\'t."',
        snapback:   '"I was told to keep an accurate record. I have kept an accurate record."',
      },
      'Q8': {
        // "Has anyone tried to change your record tonight."
        composed:   '"Three people asked to see the notebook before you did. The Steward at seven-fourteen. Pemberton-Hale at approximately seven. The Curator at seven fifty." He holds the notebook. "None of them asked to change anything. They asked to see specific entries." A pause. "The Steward asked about the garden entrance. Pemberton-Hale asked about arrivals generally. The Curator asked me to confirm the seven fifty-eight time specifically." Another pause. "None of them asked about seven-oh-three."',
        controlled: '"Three people." A pause. "The Steward. Pemberton-Hale. The Curator." He holds the notebook steadily. "None asked to change anything. They wanted to know what I had." Another pause. "The Curator asked only about seven fifty-eight. Not seven-oh-three. I found the specificity interesting."',
        strained:   '"Three of them." He looks at the notebook. "None asked to change it. They just wanted to know what I\'d seen." A pause. "I kept showing them seven fifty-eight. Nobody asked about seven-oh-three."',
        fractured:  '"Three people." A beat. "Nobody asked about seven-oh-three." Another beat. "That\'s the entry they should have asked about."',
        snapback:   '"I showed the notebook to anyone who asked. The record is unchanged."',
      },
      'Q9': {
        // Redirect: Steward acknowledgement at 7:00 — not routine
        unlock_condition: { composure_lte: 55, requires_node: 'northcott_lie_caught_in_fracture_window' },
        composed:   '"Yes." He says it immediately. He holds the notebook. "At seven o\'clock. When I arrived and took my position." A pause. "He crossed the foyer from the direction of the south corridor. He looked at me directly. He nodded." He opens the notebook. "I have noted arrivals and acknowledgements in this house for eleven years. The Steward acknowledges the log in the same manner every Rite evening. A brief nod. Economical." He does not look up. "Tonight\'s acknowledgement was different." A pause. "It was longer. More deliberate. He held the look for approximately two seconds rather than the standard half-second." He looks at you. "Two seconds is not a long time. I have learned that the Steward produces exactly as much acknowledgement as the moment requires. Not more." Another pause. "Two seconds required two seconds. Whatever he was acknowledging at seven o\'clock required two seconds of confirmation." He closes the notebook. "I did not know what that meant at seven o\'clock. I have a clearer picture now."',
        controlled: '"Six o\'clock." He holds the notebook. "The Steward. He acknowledged me." A pause. "Two seconds. Not the standard half-second." He looks at you. "The Steward produces exactly as much acknowledgement as the moment requires. Tonight\'s moment required two seconds." Another pause. "I have been thinking about what that means since eight-oh-one."',
        strained:   '"Six o\'clock." A pause. "The Steward." He looks at the notebook. "Two seconds. Not normal." Another pause. "He was confirming something. I did not know what."',
        fractured:  '"Six o\'clock." A beat. "The Steward." Another beat. "Two seconds." He holds the notebook. "That is not how he does it." A pause. "He was confirming something."',
        snapback:   '"The Steward\'s acknowledgement at seven o\'clock is recorded. That is what I observed."',
        grants_node: 'northcott_redirect_steward',
      },
    },

      'Q10': {
        // "You left your post twice tonight."
        timeline_critical: true,
        return_echo: 'He is at the foyer door. The notebook is in both hands. "Twice." He says it as you enter. A pause. "I left twice." He does not look at the corridor.',
            composed:   '"I left my post at seven-fifteen and again at seven fifty-five." He says it before you ask. "The first time — I walked to the Ballroom. Seven-fifteen." A pause. "I wanted to check the candelabra position. The south candelabra. Vivienne had mentioned it at seven-fifteen when she came through." He looks at the notebook. "Seven-fifteen. Four minutes. I have it in the margin." A pause. "The second time was at seven fifty-five. I went to find Vivienne." || He left his post twice tonight — once because of what Vivienne said, once to find Vivienne. A man who abandons his assigned position for the same woman twice in the same evening is either conducting an investigation or conducting something else entirely. The notebook has the times. The notebook does not have the reason.',
        controlled: '"Twice." A pause. "Seven-fifteen and seven fifty-five." He looks at the notebook. "First time — the Ballroom. The candelabra position." Another pause. "Vivienne had told me it was wrong. I went to look." He checks the corridor. "The second time I went to find Vivienne."',
        strained:   '"Twice." He looks at the corridor. "Seven-fifteen. The Ballroom. The candelabra." A pause. "And seven fifty-five. I went to find her." He doesn\'t say what for.',
        fractured:  '"Twice." A beat. "Seven-fifteen." Another beat. "Seven fifty-five." He holds the notebook. He does not elaborate.',
        grants_node: 'northcott_two_absences',
      },
      'Q11': {
        // "The candelabra — you knew its exact position."
        composed:   '"The south candelabra is positioned six feet from the lectern during normal Rite assembly." He says it precisely. "That evening it had been moved to four feet. Vivienne noticed at seven-fifteen when she was cleaning the south section. She came through the foyer and told me because she knew I was logging the room state." A pause. "I went to confirm it at seven-fifteen because the candelabra position affects the sightline from the south entrance to the lectern. A member entering from the south at the wrong moment would be partially occluded." He holds the notebook. "That is specific knowledge. I know it because I keep the record. I know the position of every fixed object in the Ballroom." He looks at you. "I am aware of what it looks like that I knew exactly where that candelabra was positioned at seven-fifteen."',
        controlled: '"Vivienne told me at seven-fifteen." A pause. "I went to confirm at seven-fifteen. The south candelabra had been moved from six feet to four feet from the lectern." He holds the notebook. "I know the position because I keep the record." Another pause. "I know what that sounds like now."',
        strained:   '"Vivienne told me." A pause. "I went to check. Seven-fifteen." He looks at the notebook. "Four feet from the lectern. Not six." Another pause. "I know the positions of all the fixed objects. I keep the record." He does not say what the record means now.',
        fractured:  '"Vivienne." A beat. "She told me at seven-fifteen." Another beat. "I went to check." He holds the notebook. "Four feet from the lectern." A pause. "I know what that means now."',
        grants_node: 'northcott_candelabra_knowledge',
      },
      'Q12': {
        // "What did you say to Vivienne at seven fifty-five."
        timeline_critical: true,
        return_echo: 'He is at the foyer post. He does not look at the corridor. "Seven fifty-five." He says it as you enter. A pause. "I found her." Another pause. He does not say what he said.',
        composed:   '"I found her at seven fifty-five in the east service corridor." A pause. "I said: Vivienne, Lord Ashworth told me before the Rite that he was going to read our arrangement into the Register tonight. I said: your name is in it. I said: I don\'t know what happens after that but I wanted you to know before it happened." He holds the notebook. "I said: I\'m sorry I didn\'t tell you sooner." A pause. "And then the Steward came around the corner from the south passage." He is very still. "The Steward has that effect. He comes around a corner and sentences stop." He looks at the corridor. "I had one more thing to say to her. I did not say it. The Steward arrived and I stopped."',
        controlled: '"Seven fifty-five. East service corridor." A pause. "I told her Lord Ashworth was going to read our arrangement into the Register. I said her name was in it." He looks at the corridor. "I said I was sorry I hadn\'t told her sooner." Another pause. "Then the Steward came around the corner. I stopped mid-sentence."',
        strained:   '"I found her." A pause. "I told her what Ashworth had said. Her name in the Register." He looks at the corridor. "I said sorry." Another pause. "And then the Steward." He is quiet. "I stopped. I had one more thing to say."',
        fractured:  '"Seven fifty-five." A beat. "I told her." Another beat. "Her name. The Register." He looks at the corridor. "The Steward came." A pause. "I stopped."',
        grants_node: 'northcott_unfinished_sentence',
        cross_links: [{ char: 'vivienne', branch: 'A' }],
      },

    silence_fill: 'He straightens. Adjusts his position. Then: "I\'ve been here since seven. I note what I observe. That\'s what I do here." He says it to the room.',
    silence_tell: 'A long pause. "Lord Ashworth told me specifically where to stand. Which door to watch. Which times to record." He looks at you. "I think he expected something to happen tonight. I think he wanted someone to know he\'d prepared for it."',

    scharff_corrections: {
      'surgeon_arrived_720':   '"That\'s not accurate. The earlier arrival was at seven-oh-three. Garden entrance. Not seven-twenty."',
      'northcott_arrived_later': '"I arrived at seven. Not later. I have the log."',
    },

    word_tell: null,  // Northcott is cooperative — no concealment

    approach_response: 'He looks at you steadily. "I know what the notebook says. You\'re about to ask me about the seven-oh-three entry." A pause. "Nobody has asked me about it yet. I\'ve been waiting."',

    backstory_chain: {
      'A': {
        label:          'The Ashworth confrontation',
        unlock_condition: { composure_lte: 75, or_after: 'Q2' },
        questions: {
          'NA1': {
            text:     '"What were you going to do."',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'A long pause. He holds the notebook. "I considered intercepting him." He says it quietly. "Before the Rite. I thought — if I could speak to Lord Ashworth before the assembly gathered, I could ask him not to read her name. My name he could read. That was my arrangement, my debt to the Estate, whatever consequence applies to me." A pause. "I stood in the foyer for eleven minutes between seven-thirty-five and seven forty-six considering whether to go upstairs and find him." He looks at the notebook. "I did not go. I am not built for interception. I am built for record-keeping." Another pause. "Then I decided what I would do instead: I would find Vivienne at seven fifty-five and tell her before the reading so she could prepare herself." He looks at the corridor. "Lord Ashworth died at seven forty-five. I was standing in the foyer deciding what to do. I am aware of what that interval looks like." || The quiet in his voice is the particular quiet of something that has been held for hours and is now being set down. Eleven minutes in the foyer is either deliberation or alibi — the notebook records neither. You have to decide which.',
            response_strained:   '"I thought about intercepting him." A pause. He holds the notebook. "Before the Rite. To ask him to leave her name out." Another pause. "Eleven minutes I stood here considering it." He looks at the corridor. "I didn\'t go. Then he was dead." He is very still. "I am aware of what that interval looks like."',
            grants_node: 'northcott_decided_interval',
          },
        },
      },
      'C_means': {
        label:            'The candelabra',
        unlock_condition: { after: 'Q11' },
        questions: {
          'NC1': {
            text:     '"You checked the candelabra position at seven-fifteen. The candle iron was used as staging. Those are the same object system."',
            type:     'partial_claim',
            cost:     12,
            response_composed:   'He goes still. "The candelabra is a fixed lighting instrument. The candle iron is a separate tool used for repositioning and relighting." He says it carefully. Too carefully. "They are part of the same Ballroom inventory." A pause. "I know where every piece of that inventory was at seven-fifteen because I went to the Ballroom and looked." He holds the notebook. "I have been thinking about that visit since eight-oh-one. I went to the Ballroom at seven-fifteen and I confirmed the position of the south candelabra. The candle iron was on the maintenance shelf at the east side of the room." Another pause — slower than the others. "I know where it was at seven-fifteen. I am the only person in this building who logged that position. I am aware of what that means." He looks at the corridor. "It means I had knowledge of where that instrument was and then it was found elsewhere. That is what it means." || The stillness is not the ordinary stillness of a man managing a conversation. There is something underneath. The over-careful phrasing is the shape of a man who knows his position in the record and knows what his position will look like in the morning. He did not say the iron was on the shelf. He said he logged it there.',
            response_strained:   '"The candelabra. The iron." A pause. He holds the notebook. "I went to the Ballroom at seven-fifteen. The iron was on the maintenance shelf." He looks at the corridor. "I know where it was. I am aware of what that means."',
            grants_node: 'northcott_iron_position_known',
          },
        },
      },

      'B': {
        label:          'Why Ashworth placed him',
        unlock_condition: { composure_lte: 75, or_after: 'Q4' },
        questions: {
          'BA1': {
            text:     '"Ashworth gave you a specific position tonight."',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '"He suggested the Foyer. He said it had the best view of arrivals. He seemed to know what he was saying." A pause. "He\'s said very deliberate things to me, twice. Both times I didn\'t understand until later."',
            response_strained:   '"He knew something was going to happen." He says it quietly. "He placed me to witness it."',
            unlocks: 'BA2',
          },
          'BA2': {
            text:     '"He told you what to look for."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   '"Not exactly. He said: note who arrives before the Rite. The order matters. The gaps matter. I didn\'t know what he meant." A pause. "I know now."',
            response_strained:   '"He said the order matters. I thought that was normal." A pause. "It wasn\'t normal, was it."',
            grants_node: 'northcott_placed_by_ashworth',
          },
          'BA3': {
            text:     '"Do you know what you were being positioned for tonight."',
            type:     'focused_follow_up',
            cost:     15,
            response_composed:   'No. A pause. He looks at the notebook. Then at Callum. "I\'m twenty-seven. I\'ve been here six weeks. I was told arrivals would matter and to keep the record carefully. I kept it." Another pause. "I can\'t be accused of involvement. I didn\'t know anyone here before the invitation. I have no history with the Estate, no history with Ashworth, no reason to alter anything I wrote down." He is very still. "He needed a witness who couldn\'t be accused of involvement. He placed me here six weeks ago so that person would exist tonight." A long pause. "I didn\'t know that until just now." He looks at the notebook in his hand. "I\'ve been useful. I just didn\'t know that was the word for it." Another pause. "The seven-oh-three entry. I\'ve been thinking about it since eight-oh-one. Whoever came through that gate an hour before the Rite — they had already done something. They came through the garden because they didn\'t want to be noted at the gate. They were noted anyway." He holds up the notebook. "That entry exists because Lord Ashworth told me which door to watch."',
            grants_node: 'northcott_ashworth_instrument',
          },
        },
      },
      'B': {
        label:            'The wrong mask — 7:52PM',
        // Unlocks after Greaves Branch B complete (cross-link fires it).
        // Northcott noted the wrong mask when the Surgeon re-entered the ballroom.
        // He notes everything. This is what he has been waiting to be asked about.
        unlock_condition: { requires_cross_link: { char: 'greaves', branch: 'B', q: 'GB3' } },
        questions: {
          'NB1': {
            requires_cross_link: { char: 'greaves', branch: 'B', q: 'GB3' },
            text:     '"When the assembly entered the Ballroom — you noticed something wrong."',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '"I notice everything. That is my function here." He holds the notebook. "The assembly entered between seven fifty-two and seven fifty-five. I was logging arrivals as they passed the foyer threshold." A pause. "One member entered at seven fifty-two wearing a mask that was not consistent with the Estate\'s standard issue." Another pause. "Every Estate mask carries a signature mark — a small impressed detail specific to each member\'s commission. This mask had no such mark. It was plain. Unidentifiable." He looks at the notebook. "I wrote it down. I did not know what it meant at seven fifty-two."',
            response_controlled: '"Seven fifty-two." He holds the notebook. "A member entered wearing a mask with no signature mark." A pause. "Every Estate mask has one. This one didn\'t." Another pause. "I wrote it down."',
            response_strained:   '"The wrong mask." A pause. "Seven fifty-two. No signature mark." He looks at the notebook. "I wrote it down. I know I wrote it down. I have been waiting for someone to ask me about it since eight-oh-one."',
            response_fractured:  '"Seven fifty-two." A beat. "No signature." Another beat. "Wrong mask." He holds the notebook. "I wrote it down."',
            unlocks: 'NB2',
            timeline_critical: true,
            return_echo: 'He is standing at his post. The notebook is open. "Seven fifty-two." He says it as you enter. "Plain mask. No signature." A pause. "I wrote it at seven fifty-three." He taps the margin. "It is still there."',
            grants_node: 'northcott_wrong_mask_752',
          },
          'NB2': {
            text:     '"A plain mask. Not Estate issued."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"Estate masks are commissioned individually. The commission process produces a signature impression on the inner banding — a maker\'s mark specific to each member\'s piece." He is precise. This is not guesswork. "A plain mask — no impression, no banding detail — was not commissioned through the Estate. It came from somewhere else." A pause. "I noted the anomaly because anomalies are what the record is for." He looks at the notebook. "The member who entered at seven fifty-two with that mask was not wearing their Estate mask. They were wearing something they brought."',
            response_controlled: '"Not Estate issued. No." A pause. "I know what Estate masks look like. I have been logging arrivals for six weeks. Every mask that passed me tonight — I knew whose it was." Another pause. "This one I didn\'t know. Because it had no mark to know it by."',
            response_strained:   '"Plain. No mark." A pause. "Brought from outside." He looks at the notebook. "That is what the absence means."',
            response_fractured:  '"Not Estate issued." A beat. "Brought in." A pause. "I know whose mask that position belonged to." He looks at the notebook. "The signature mask was not on their face at seven fifty-two."',
            unlocks: 'NB3',
            grants_node: 'northcott_mask_not_estate_issued',
          },
          'NB3': {
            text:     '"Whose position."',
            type:     'direct_confrontation',
            cost:     12,
            response_composed:   '"The Compact\'s attending physician arrived through the garden entrance at seven-oh-three." He says it simply. "I logged the arrival. Medium height. Carrying a case. That arrival did not sign the guest book — the guest book entry for that arrival is missing. The page is torn." A pause. "At seven fifty-two a member entered the Ballroom through the south entrance wearing a plain mask in the position consistent with the Compact\'s physician\'s assigned seating." He holds the notebook. "I have those two entries. The gap between seven-oh-three and seven fifty-two is not in my record." Another pause. "It should be. I am still thinking about why it isn\'t."',
            response_controlled: '"The Compact physician\'s position." A pause. "Seven-oh-three arrival. Seven fifty-two ballroom entry." He looks at the notebook. "The mask between those two timestamps is the question." Another pause. "He arrived with one. He entered the Ballroom with another."',
            response_strained:   '"The physician\'s position." A pause. He looks at the notebook. "Seven-oh-three to seven fifty-two." Another pause. "He arrived with his mask. He entered with a different one." He looks at you. "I wrote both times down. I didn\'t write the reason."',
            response_fractured:  '"The physician." A beat. "Seven-oh-three. Seven fifty-two." A pause. "Different mask." He looks at you. "I have both times. You have to fill in what happened between them."',
            timeline_critical: true,
            return_echo: 'He is holding the notebook open to the margin entry. "Seven-oh-three." He says it as you enter. "Seven fifty-two." A pause. "Two entries. One gap." He does not say what the gap contains.',
            grants_node: 'northcott_physician_wrong_mask_confirmed',
            cross_links: [{ char: 'ashworth', branch: 'mask' }],
          },
        },
      },
    },

    contamination: {
      'steward': 'He glances toward the Gallery. "The Steward was very thorough with me earlier." A pause. "He asked what I\'d told you. I told him what I told you. He nodded." Another pause. "He nods a great deal tonight. I\'ve started finding that more interesting than I expected."',
      'curator': 'He glances at the notebook. "The Curator came to me at seven forty-two." A pause. "He didn\'t ask about it." He leaves that where it is.',
      'surgeon': 'He looks at the notebook. "Dr. Voss." He says the name carefully. "I heard it said tonight." A pause. "I didn\'t write it down when I heard it. I wrote down what I saw. Seven-oh-three. Garden entrance. No face." He is very still. "Those are two separate records. I\'m not in a position to connect them. You are."',
      'vivienne': 'He is quiet for a moment. Not the notebook quiet — a different kind. "Vivienne told me things." He says it carefully. "About the candelabra position. About who was where. Before I checked myself." A pause. "I acted on what she told me." He looks at the notebook. "That is in here. I didn\'t hide it." Another pause. "I don\'t know if she knew what she was giving me."',
    },

    cognitive_load_response: '"Seven-oh-three. Garden.\" He repeats it while watching your hands. Then catches himself. \"He was carrying something. I didn\'t — I didn\'t write that down. I should have written that down."',

  },

  // ── STEWARD ────────────────────────────────────────────────
  'steward': {
    counter_strategy:  'withhold',
    optimal_technique: 'wait',
    composure_floor:   30,
    fracture_threshold: 40,

    baseline: {
      text:         'Complete stillness. He has practiced this. Fourteen years of being exactly present without being anywhere.',
      sentence_avg: 'long',
      formality:    'high',
      tell:         'He answers in under two seconds when he\'s prepared. Pauses mean he\'s choosing.',
    },

    composure_variants: {
      'Q1': {
        // "Who has access to the cabinet?"
        composed:   '"Three keys, sir. Lord Ashworth\'s. The Curator\'s. Mine. The cabinet is keyed to senior level. No other access exists through legitimate channels. The Curator holds the access register. I can confirm my key has been on my person since seven o\'clock."',
        controlled: '"Three keys, sir. Lord Ashworth, the Curator, myself. That is the complete authorised register." A pause. "I can account for mine. The Curator is the appropriate authority for the others."',
        strained:   '"Three keys, sir. Ashworth\'s. The Curator\'s. Mine." A pause. "Mine hasn\'t left my person. If there\'s a question about the cabinet it should go to the Curator."',
        fractured:  '"Three keys." A beat. "Ashworth. Curator. Me." Another beat. "Mine is here."',
        snapback:   '"The Curator holds the access register, sir. He is the appropriate authority."',
      },
      'Q2': {
        // "When were the candles last changed?"
        composed:   '"The Ballroom candelabras were changed at seven-fifteen, sir, per pre-Rite schedule. A second change was made at seven-fifteen at Lady Ashworth\'s request — she found the scent of the first set unsuitable. I noted both changes in the maintenance record. Standard practice to log any deviation from the scheduled service."',
        controlled: '"Seven-fifteen on schedule, sir. Seven-fifteen at Lady Ashworth\'s request." A pause. "Both are in the maintenance record. I log deviations. I always log deviations."',
        strained:   '"Twice. Seven-fifteen, scheduled. Seven-fifteen, Lady Ashworth asked." A pause. "I noted it. I note everything. Fourteen years." Another pause. "Both times are written down."',
        fractured:  '"Twice." A beat. "Seven-fifteen. Seven-fifteen." A beat. "It\'s in the record."',
        snapback:   '"Both changes are in the maintenance record, sir."',
      },
      'Q3': {
        grants_node: 'steward_false_timeline_gallery',
        timeline_critical: true,
        composed:   '"Attending to the Gallery, sir. The candles required attention at seven fifty-eight. A standard pre-assembly service check." He does not look at the Baron\'s portrait. "I completed it and returned to my station. That is the complete account of my movements at that time."',
        controlled: '"The Gallery, sir." A pause. "Seven fifty-eight. The candles." He says it precisely. Then adds: "The Baron has been in the Smoking Room since seven-fifteen." Volunteered.',
        strained:   '"The Gallery." A pause. "Seven fifty-eight." He stops. Then: "Candles." He\'s trying to give you less than he knows.',
        fractured:  '"I was where I was told to be." A pause. "Seven fifty-eight." Another pause. "The corridor. Not the Gallery." He has just told you something different from what he said before.',
        snapback:   '"I was in the Gallery attending to the candles. That is my complete answer." He straightens. Returns to his former register.',
      },
      'Q6': {
        composed:   'A pause that is different from all the previous pauses. "I have arrangements. They were entered into under conditions I was not in a position to refuse." A shorter pause. "They predate tonight. And they are concluded."',
        controlled: '"I have arrangements." He says it with the precision of something decided. "I did not understand their full implications when I entered them."',
        strained:   '"I signed something eight years ago." A pause that costs him. "I didn\'t read it carefully enough."',
        fractured:  '"I have arrangements." A beat. "Eight years." Another beat. "That is what I can say."',
        snapback:   '"I\'ve said what I can say. If you have further questions the Curator can arrange a proper time." The formality is back. It is completely deliberate.',
      },
      'Q4': {
        // "Garden gate at seven-oh-one — someone came through."
        // requires_item: 'northcott-log-obj'
        composed:   '"The garden gate access at seven-oh-one would fall outside my direct coverage during that period, sir. I was conducting East wing inventory. If the arrival log shows an access event at that time, it predates my coverage of the main entrance. I did not authorise any gate access at that hour. The arrival record would be the appropriate reference."',
        controlled: '"Seven-oh-one — I was in the East wing, sir. Not near the garden." A pause. "If something came through the garden gate at that hour I wasn\'t told about it. That access point isn\'t on my schedule then."',
        strained:   '"I wasn\'t there, sir. East wing." A pause. "Seven-oh-one I can\'t account for the garden gate. I wasn\'t near it." Another pause. "If someone came through at that time they came through without my knowledge."',
        fractured:  '"I wasn\'t there." A beat. "East wing." A beat. "I didn\'t know."',
        snapback:   '"The arrival record is the appropriate authority for gate access, sir."',
      },
      'Q5': {
        // "A figure on the hedge path."
        // requires_item: 'unsigned-letter'
        composed:   '"The hedge path runs along the east garden between the service entrance and the gate, sir. Movement along it before the Rite is not unusual — pre-event service preparation. I can\'t speak to a specific figure without a time and a description. It would help to know when."',
        controlled: '"The hedge path." A pause. "That is between the east gate and the service entry. If someone was on it last evening there are possible explanations. Service movement. A member taking air." A pause. "I would need a time."',
        strained:   '"The hedge path." A pause. "There is a gap at the east end of the hedge. I\'ve known about it for three years." Another pause. "I didn\'t report it. I thought it was a maintenance matter."',
        fractured:  '"The hedge." A beat. "There\'s a gap." Another beat. "I didn\'t report it."',
        snapback:   '"I have no information about specific individuals on the grounds, sir."',
      },
      'Q7': {
        // "Who gave you the corridor instruction."
        timeline_critical: true,
        return_echo: 'He has not moved. "A sealed letter." He says it as you enter. "Two weeks before tonight." A pause. He is still looking at the portrait.',
        composed:   '"The instruction arrived in a sealed letter, sir. Approximately two weeks before tonight." He is very still. "The language was consistent with correspondence I have received from the same source over eight years. I recognised the form." A pause. "I did not see a name. I was not given a name. That is the architecture of these arrangements — the instruction arrives. The name does not. I have learned to understand that this is deliberate."',
        controlled: '"A letter. Two weeks before tonight. Sealed." A pause. "No return. The language matched others I had received." He looks at the portrait. "I knew what it was."',
        strained:   '"A letter." A pause. "I\'ve received others like it. Eight years of them." Another pause. "I always followed them. I thought I understood what I was following."',
        fractured:  '"A letter." A beat. "Eight years of letters." Another beat. "I always followed them."',
        snapback:   '"The Curator is the appropriate authority for Estate correspondence, sir."',
      },
      'Q8': {
        // "Did you know what would happen at 7:58."
        timeline_critical: true,
        return_echo: 'He is at the portrait. "Seven fifty-eight." He says it as you enter. A pause. "I did not know what was moving through it." He does not look at you.',
        composed:   '"No, sir." Under two seconds. He does not elaborate. He does not look at you. He looks at the portrait of the third Ashworth and does not look away from it.',
        controlled: '"I knew the corridor needed to be clear." A pause. "I didn\'t know what was moving through it." He looks at the portrait. "I have done this before. Covered things I was not told the reason for." Another pause. "This time was different. I did not know it was different."',
        strained:   '"I didn\'t know what was happening." A pause. "Seven fifty-eight. Corridor clear. That was all I knew." Another pause. "I assumed —" He stops. "The assumption was wrong."',
        fractured:  '"I didn\'t know." A beat. "The corridor." Another beat. "I didn\'t ask."',
        snapback:   '"I acted in accordance with instructions, sir. I did not know their purpose."',
      },
      'Q9': {
        // "What did you think you were protecting."
        composed:   '"I was attending to an instruction that fell within the kind of arrangements this house has maintained for some years, sir." He looks at the portrait. "The nature of those arrangements is not something I discuss. I hope you understand the distinction."',
        controlled: '"A discreet movement." A pause. "That is what I concluded." He is very still. "I have facilitated that kind of thing before. For legitimate reasons." Another pause. "I believed this was the same."',
        strained:   '"I thought —" He stops. "A discreet arrival." Another pause. "I\'ve done it before. It was never like this."',
        fractured:  '"A discreet arrival." A beat. "That\'s what I told myself." Another beat. "I was wrong about what I was covering for."',
        snapback:   '"I facilitated what the instruction required, sir."',
      },
      'Q10': {
        // "You covered the corridor that let the killer reach Lord Ashworth."
        composed:   '"That is a characterisation of events I am not in a position to confirm, sir." He is completely still. "The investigation will establish the sequence. I have cooperated fully." A pause. "I will continue to cooperate fully."',
        controlled: '"I covered the corridor at seven fifty-eight." A pause. "I cannot speak to what happened in it." He looks at the portrait of the third Ashworth. "The investigation will establish that." Another pause. "I will not resist that process."',
        strained:   '"That is a characterisation of the evening I am not in a position to confirm, sir." A pause. "I covered the corridor at seven fifty-eight. What happened in it is a matter for the investigation to establish."',
        fractured:  '"Seven fifty-eight." A beat. "The corridor." Another beat. He looks at the portrait and does not look away from it.',
        snapback:   '"I acted on instruction, sir. That is the accurate accounting of what I did."',
        grants_node: 'ph_steward_corridor',
      },
      'Q11': {
        // Redirect: Lady Ashworth in garden at 7:40 beneath balcony
        unlock_condition: { composure_lte: 55, requires_node: 'steward_lie_caught_in_fracture_window' },
        composed:   '"Lady Ashworth." He says it carefully. "She was in the garden at approximately seven forty." A long pause. He looks at the portrait. "I was crossing the terrace on the lamp schedule. She was on the path beneath the balcony." He does not elaborate immediately. "She was standing still. Not walking. Standing at the bench beneath the balcony level." Another pause. "For approximately two minutes." He looks at you. "I noted the time. Seven forty. Lady Ashworth. Garden path. Beneath balcony." He is completely still. "I do not draw conclusions, sir. I record what I see. That is what I recorded."',
        controlled: '"Lady Ashworth was in the garden at seven forty." A pause. He looks at the portrait. "Beneath the balcony. Standing still. Two minutes." He looks at you. "I record positions. That is what I recorded."',
        strained:   '"Seven forty. Lady Ashworth." A pause. "The garden. Beneath the balcony." He looks at the portrait. "Standing. Not walking." Another pause. "Two minutes. I recorded it."',
        fractured:  '"Lady Ashworth." A beat. "Seven forty." Another beat. "Beneath the balcony." He looks at the portrait and does not look away.',
        snapback:   '"I recorded Lady Ashworth\'s position in the garden at seven forty. The record is accurate."',
        grants_node: 'steward_redirect_ashworth',
      },
    },

    silence_fill: 'He adjusts something that doesn\'t need adjusting. "The candles were changed at seven-oh-five. Both sets. Lady Ashworth asked for both." A pause. "That is not something I would usually note."',
    silence_tell: 'A very long silence. Then: "I have been in this house for fourteen years." He looks at the portrait. "I know which decisions I made tonight." A pause. "I know which of them I cannot undo." He does not say what the decisions were. He does not look away from the portrait.',

    scharff_corrections: {
      'steward_arrived_seven':  '"I arrived at seven-oh-one, sir. As I do every evening the Estate convenes. I have not arrived at seven in fourteen years."',
      'candles_changed_morning': '"The candles were changed at seven-oh-five as well, sir. Not only this morning. Both sets. Lady Ashworth requested it."',
    },

    word_tell: null,

    committed_statement_triggers: {
      'Q3': {
        topic:     'location_758',
        statement: 'Attending to the Gallery, sir. The candles required attention before the Rite.',
        truth:     'I was in the corridor at 7:58, not the Gallery.',
      },
    },

    sue_inconsistency: {
      'steward-bond': {
        committed_after:    'Q3',
        reveal_response:    '"That document doesn\'t — the Curator would never —" He stops. "I see." A full second of stillness. "Is there anything else, sir?" The inconsistency between the corridor statement and the Bond\'s corridor instruction is now fully visible to both of you.',
        inconsistency_note: 'The Bond requires corridor coverage at 7:58. The Steward said he was in the Gallery. Both cannot be true.',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The Bond',
        unlock_condition: { composure_lte: 75, or_item: 'steward-bond' },
        questions: {
          'BA1': {
            text:     '"What instructions, specifically."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   '"The Estate has protocols, sir. I honour them." Under two seconds. The speed is wrong. Not the words — the speed. He says it before the question is fully finished.',
            response_strained:   '"Instructions came in writing. Two weeks before tonight." He stops himself from saying more.',
            response_fractured:  '"A Bond. Eight years ago. I signed something I didn\'t read." He looks at the portrait. "I\'ve had eight years to think about what it was."',
            unlocks: 'BA2',
          },
          'BA2': {
            text:     '"What did you actually sign."',
            type:     'focused_follow_up',
            cost:     15,
            response_composed:   '"A Bond. In Compact language close enough to Estate language to pass. I signed believing it was a property arrangement witness form."',
            response_strained:   '"Something that has owned eight years of my life." A pause. "I was not in a position to refuse once I understood."',
            response_fractured:  '"Something I signed eight years ago has consequences I did not understand when I signed it." A pause. He looks at the portrait. "That is the most I can say."',
            snapback:            '"I should not have said that. I would ask you to —" He stops. "No. I\'ll say it. I\'ve been saying it to myself long enough."',
            unlocks: 'BA3',
            grants_node: 'bond_coerced_signed',
            cross_links: [{ char: 'baron', branch: 'B' }],
          },
          'BA3': {
            text:             '"What did the Bond require of you tonight."',
            type:             'focused_follow_up',
            cost:             99,
            composure_required: 50,
            response_fractured: '"Seven fifty-eight." A pause. "That is what it said." Another pause. "I thought I understood what I was covering for." The last sentence does not arrive as he intended it to.',
            triggers_fracture:  true,
            closes_conversation: true,
            grants_node:        'steward_corridor_758',
            grants_item_eligible: 'steward-bond',
          },
        },
        deception_path: {
          item:         'curators-note',
          replaces:     'BA2',
          response:     '"That document doesn\'t — the Curator would never —" He stops. "I see." A full second of stillness. "The Curator knows about the Bond." He didn\'t say this before. The deception produced something the direct question didn\'t.',
          bonus_intel:  'steward_thinks_curator_knows',
        },
      },
      'B': {
        label:            'The Candles',
        unlock_condition: { requires_char_branch: { char: 'ashworth', branch: 'A' } },
        questions: {
          'BB0': {
            text:     '"You said Gallery. The Bond required the south corridor."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   '"The Gallery required attention at seven fifty-eight. That is accurate." A pause. "The south corridor also required my attention at seven fifty-eight." He says it with complete stillness. "Both statements are accurate. The sequence in which I gave them is a different question." || He looks at the portrait of the third Ashworth. Not the current one. The one before. A man who has spent fourteen years looking at a specific portrait every morning knows exactly what he is doing when he chooses which one to look at. He gave you the Gallery first. He gave you the corridor second. He decided which one you were ready for. That is not the habit of innocence. That is the habit of a man who has been deciding what people are ready for since a Tuesday afternoon fourteen years ago.',
            response_strained:   '"I said Gallery first." A pause. "Seven fifty-eight. The Gallery." He looks at the portrait. "The corridor was also seven fifty-eight." Another pause. "I gave you one. Not the other." He does not explain why.',
            response_fractured:  '"Gallery." A beat. "Then corridor." A pause. "Both. Seven fifty-eight." He looks at the portrait. "I was in both." Another pause. "I told you one."',
            snapback:            '"I was attending to my duties at seven fifty-eight. Both locations were part of that."',
            unlocks: 'BB1',
          },
          'BB1': {
            text:     '"Lady Ashworth asked you to change the candles."',
            type:     'narrative_statement',
            cost:     4,
            response_composed:   '"Yes. Before the Rite. She asked for both sets changed." A pause. "I change candles when asked. It is part of the role."',
            response_strained:   '"Yes. Both sets. She was very specific." A pause. "She is always specific. Tonight she was more specific than usual."',
            unlocks: 'BB2',
          },
          'BB2': {
            text:     '"Did you understand why."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"It wasn\'t my place to ask."',
            response_strained:   '"She seemed to want the room prepared. More carefully than usual."',
            response_fractured:  '"She knew something was going to happen tonight." A beat. "She\'s known for weeks."',
    cross_links: [{ char: 'ashworth', cross_id: 'ashworth_candles' }],
            grants_node: 'steward_lady_ashworth_bond',
          },
          'BB3': {
            text:     '"Did Lady Ashworth know what the scent meant."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He is completely still. The formality is present but it is held now, not natural. "I don\'t know." Four words. A pause that is different from all the others this evening — not choosing, not withholding. Just the actual limit of what he has. "Fourteen years in this house." He says it to the portrait. Not as explanation. As the thing that makes the four words cost something. He does not continue.',
            grants_node: 'steward_cannot_account_for_lady_ashworth',
            cross_links: [{ char: 'ashworth', cross_id: 'ashworth_steward' }],
          },
        },
      },
      'C': {
        label:            'What he carried',
        unlock_condition: { requires_branch: 'A', composure_lte: 50 },
        questions: {
          'BC1': {
            text:     '"Fourteen years. What are you not saying."',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'He looks at the portrait. The third Ashworth. Not the current one. The one before. A very long pause. "There is a record the Estate chose not to keep." He says it finally. Quietly. "Fourteen years ago." A pause. "I have been keeping it myself since then." He does not look at you. He does not look away from the portrait. "The corridor at seven fifty-eight. I did not ask why it mattered. I knew why it mattered." He is completely still. "I have known for fourteen years that there would eventually be a night when the Estate would need something from me. And when that night arrived I would have a choice." A pause. "I made my choice." He looks at the portrait. "I am not certain it was the wrong one."',
            response_strained:   '"Fourteen years." A pause. He looks at the portrait. "There is a record that was never kept." He says it. "I have been keeping it in my own way since." Another pause. "Seven fifty-eight. I knew why that corridor mattered." He looks at the portrait. "I made a choice. I am still deciding whether it was wrong."',
            grants_node: 'steward_personal_record',
            unlocks: 'BC2',
          },
          'BC2': {
            text:     '"What record."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'He is quiet for a very long time. "Lord Ashworth. His son." He says it. Two words. He does not look away from the portrait. "There was an incident. Fourteen years ago. A child was involved." Another pause. "The Estate decided certain things would not be recorded. That decision was made above my station. I was not consulted." He looks at his hands. "I was present. I remained present for fourteen years." A very long pause. "Tonight someone else decided something would happen to the man whose family made that decision. I was given the opportunity to make myself useful to that outcome." He looks at you. "I did not push anyone. I covered a corridor. That is the whole of what I did." Another pause. "I am not certain it is enough to make the fourteen years feel settled. But it is what I did."',
            grants_node: 'steward_granddaughter_record',
          },
        },
      },
    },

    contamination: {
      'baron': 'He is slightly more careful about the Smoking Room reference. "The Baron remained in the Smoking Room." He says it like something that has been agreed upon.',
      'crane': '"Dr. Crane was in the building before she was summoned." He says it before you ask. Then realizes he has volunteered it.',
      'vivienne': 'A pause. "The French girl." He says it carefully. "She has been in this house four years." Another pause. "She knows things she has not been asked about yet." He does not say what things. "Thomas Hatch has been here thirty years. Between the two of them they have seen most of what matters tonight."',
    },

    cognitive_load_response: '"The corridor." While watching your pen. "Seven fifty-eight." He stops. Realizes the words have arrived in that order. His next answer will be the most careful of the evening.',

  },

  // ── LADY ASHWORTH ──────────────────────────────────────────
  'ashworth': {
    counter_strategy:  'redirect',
    optimal_technique: 'record',
    composure_floor:   40,
    fracture_threshold: 65,

    baseline: {
      text:         'She is the only person without a mask. Not because she refused one. Because grief arrived before she could put it on.',
      sentence_avg: 'short',
      formality:    'low',
      tell:         'Past tense. Everyone else uses present. She moved Edmund to history before you arrived. The other tell: she does not ask what happened. She asks what the investigator found. A widow asks how. A woman who already knows asks what you know.',
    },

    composure_variants: {
      'Q1': {
        // "How are you holding up?"
        grants_node: 'ashworth_false_timeline_arrived_seven',
        timeline_critical: true,
        approach_response: '"The question implies this evening was unexpected. It wasn\'t." She looks at you steadily. "Edmund told me something was going to happen tonight. I came because he asked me to."',
        composed:   '"Edmund was particular about his work and particular about his risks." A pause. "He made arrangements before tonight. He made them carefully." She looks at Callum. "He said if something went wrong, find someone from outside. I am deciding whether you are who he meant."',
        controlled: '"He told me something was going to happen. He didn\'t tell me what. He asked me to come." A pause. "I came. I\'ve been here since seven."',
        strained:   '"He said trust no one inside the building." A pause. "He said that six weeks ago. I told him to cancel. He said he couldn\'t." Another pause. "It had gone too far for that."',
        fractured:  '"He knew." A beat. "Six weeks." Another beat. "He asked me to come. I came."',
        snapback:   '"I am here because Edmund asked me to be. That is the answer to your question."',
      },
      'Q2': {
        // "When did you last speak to Edmund?"
        composed:   '"Three hours before the Rite. He was in the study. He had two documents on the desk. He didn\'t ask me to look at them and I didn\'t." A pause. "He asked me whether the investigator had arrived. I told him I didn\'t know. He nodded. He seemed settled."',
        controlled: '"Three hours before. The study." A pause. "He was working. He had arranged things on the desk in the order he was going to use them. He knew tonight was going to require precision."',
        strained:   '"Three hours before. He seemed settled." A pause. "He had been settled for six weeks. That was the part I didn\'t understand. He knew what was coming and he was settled."',
        fractured:  '"Three hours." A beat. "He seemed settled." Another beat. "I didn\'t ask why."',
        snapback:   '"Three hours before the Rite. That is the last time."',
      },
      'Q3': {
        // "The flower — you left it."
        composed:   '"I left it in the study six weeks ago when Edmund first told me about the Register." A pause. "I was not composed when I heard it. I came to the study and I put the flower on the desk because I needed to put something down, and that was what I had in my hand." She looks at the garden. "He didn\'t move it. It was still there this evening." A pause. "The arrangement in the Register that he was going to read tonight — it was not only about the Compact. There was a personal entry." She does not elaborate. "He kept the flower. That is the kind of man he was."',
        controlled: '"I left it six weeks ago. When he first told me about the entry." A pause. "There was a personal matter in the Register alongside the institutional one. He told me both at the same time." She looks at the garden. "He kept the flower on the desk. He didn\'t move things without reason."',
        strained:   '"I forgot it." A pause. "Six weeks ago. He kept it." Another pause. "He was telling me two things that day. I was only listening to one of them."',
        fractured:  '"I forgot it." A beat. "He kept it." Another beat. "He was telling me about the personal entry. I wasn\'t ready to hear it."',
        snapback:   '"It was on his desk. He kept it there."',
      },
      'Q4': {
        // "Did you know he was dying?"
        composed:   '"I knew he was in danger. He was specific about that." A pause. "He said the danger was inside the building — not from the Compact, from something using the building for a different purpose. He didn\'t name anyone. He said the Register would do it."',
        controlled: '"He told me there was a source of danger inside this building. Not the Compact." A pause. "He said the Register held the answer. He asked me not to act on it — to let the Rite surface it. I agreed."',
        strained:   '"He knew the risk." A pause. "He told me. Six weeks ago. He said the danger was real." A pause. "I chose not to stop him."',
        fractured:  'She faces away. "He told me." A beat. "I chose not to stop him."',
        snapback:   '"Edmund made his choice. I honoured it."',
      },
      'Q5': {
        composed:   'A long silence. She looks at the fireplace. "I knew he was in danger." Very quietly. "I decided he was capable of managing his own dangers." A pause. "I was probably right."',
        controlled: '"I knew." She says just that. Then looks at the fireplace. "I decided he could manage it." Another pause. "That was my decision."',
        strained:   '"I knew for six weeks." She says it to the fireplace. "I chose not to stop him."',
        fractured:  '"He told me six weeks ago. He said: if something goes wrong, trust no one inside the building." She turns. "Find someone from outside. Tell them to look at the Register." A pause. "That is you."',
      },
      'Q5b': {
        // "The garden at seven-forty — you were beneath the balcony."
        timeline_critical: true,
        return_echo: 'She has not moved from the window. "Seven forty." She says it as you enter. A pause. "Two minutes." She does not say what she was doing for two minutes.',
        composed:   '"I go to that part of the garden when I need to think." She says it without looking at you. "I have gone there for twenty-two years. It is the part of the garden that faces away from the house." A pause. "I did not know I was beneath the balcony at seven forty. I know that now." She looks at the garden. "I was there because I had been in the building since seven and I needed to be outside for a moment. The announcement was fifteen minutes away." Another pause. "I walked to the garden because that is what I do when Edmund is about to do something I cannot stop." She is very still. "I did not stop him. I was in the garden."',
        controlled: '"Seven forty. The garden." A pause. "I walk there when I need to think." She looks at the garden. "I did not know it was beneath the balcony. I know now." Another pause. "I was there for approximately two minutes. I came back inside. The Rite began at eight."',
        strained:   '"I was in the garden." A pause. She looks at the window. "I go there when I cannot change something that is about to happen." Another pause. "Two minutes. I came back inside." She does not say what she was thinking during the two minutes.',
        fractured:  '"The garden." A beat. "Seven forty." Another beat. "I go there when I cannot stop something." She looks at the window. "I came back inside."',
        snapback:   '"I was in the garden at seven forty. That is accurate."',
        grants_node: 'ashworth_garden_740',
      },

      'Q5b': {
        // "The garden at seven-forty — you were beneath the balcony."
        timeline_critical: true,
        return_echo: 'She has not moved from the window. "Seven forty." She says it as you enter. A pause. "Two minutes." She does not say what she was doing for two minutes.',
        composed:   '"I go to that part of the garden when I need to think." She says it without looking at you. "I have gone there for twenty-two years. It is the part of the garden that faces away from the house." A pause. "I did not know I was beneath the balcony at seven forty. I know that now." She looks at the garden. "I was there because I had been in the building since seven and I needed to be outside for a moment. The announcement was fifteen minutes away." Another pause. "I walked to the garden because that is what I do when Edmund is about to do something I cannot stop." She is very still. "I did not stop him. I was in the garden."',
        controlled: '"Seven forty. The garden." A pause. "I walk there when I need to think." She looks at the garden. "I did not know it was beneath the balcony. I know now." Another pause. "I was there for approximately two minutes. I came back inside. The Rite began at eight."',
        strained:   '"I was in the garden." A pause. She looks at the window. "I go there when I cannot change something that is about to happen." Another pause. "Two minutes. I came back inside." She does not say what she was thinking during the two minutes.',
        fractured:  '"The garden." A beat. "Seven forty." Another beat. "I go there when I cannot stop something." She looks at the window. "I came back inside."',
        snapback:   '"I was in the garden at seven forty. That is accurate."',
        grants_node: 'ashworth_garden_740',
      },

      'Q6': {
        // Redirect: PH watching the Register — knew what the reading would name
        unlock_condition: { composure_lte: 75, requires_node: 'ashworth_lie_caught_in_fracture_window' },
        composed:   '"The Viscount." She looks at the fireplace. A long time. "He was watching the Register all evening." A pause. "I observed him from the gallery at approximately seven forty. He was at the lectern. He was not reading the programme. He was reading the Register." She looks at you. "A man who reads a Register he has amended for eight years while waiting for it to be read aloud is a man who knows what the reading will produce." Another long pause. "The Viscount had the most to lose from that reading. He has had the most to lose for eight years." A pause. "Whatever happened at seven forty-five — the Viscount understood what tonight required better than anyone in that ballroom." She says it quietly. "That is not an accusation. It is an observation. I observe things. Edmund taught me to."',
        controlled: '"The Viscount." A pause. She looks at the fireplace. "He was at the Register at seven forty. Reading it." Another pause. "A man who has spent eight years amending a document and reads it on the night it is to be revealed publicly — he knows exactly what is coming." She looks at you. "He had the most to lose."',
        strained:   '"The Viscount." She says it quietly. "Seven forty. At the Register." A pause. "He knew what the reading would name." She looks at the fireplace. "Eight years of amendments. He understood what tonight was."',
        fractured:  '"The Viscount." A beat. "He was reading the Register at seven forty." Another beat. "He knew." She faces the fireplace. "He has known for eight years."',
        snapback:   '"I observed the Viscount at the Register at seven forty. That is what I observed."',
        grants_node: 'ashworth_redirect_ph',
      },
    },

    silence_fill: 'She looks at the garden. "Edmund chose to attend. He chose to open the Register. He chose to come back even when I asked him not to." She says it to no one.',
    silence_tell: 'The longest pause. "He wrote me a letter. Two weeks ago. Sealed. To be opened after." She doesn\'t look at you. "I opened it before. I couldn\'t wait." A pause. "He knew what was coming. He had known for two months. He chose to attend anyway." Another pause. "He chose this. He chose all of it." || She says it in past tense. Everyone else in this building is still deciding what they chose tonight. She decided weeks ago. The only question is whether she decided alongside him or instead of him.',

    word_tell: null,

    backstory_chain: {
      'A': {
        label:            'What Ashworth told her',
        unlock_condition: { after: 'Q5' },
        questions: {
          'BA1': {
            text:     '"He told you more than that."',
            type:     'partial_claim',
            cost:     6,
            response_composed:   '"He told me what he needed me to know." She looks at the garden.',
            response_strained:   '"He told me about the Register entry. The one he prepared specifically for tonight."',
            response_fractured:  '"He said: there is a page in the Register I prepared for tonight. If something goes wrong, the right person will find it." A pause. "He prepared his own dying clue."',
            unlocks: 'BA2',
          },
          'BA2': {
            text:     '"He told you more than what was in the Register."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"He told me what he needed me to know." She looks at the garden. A pause that costs something she was not expecting to pay. "He told me the Register contained documentation of an arrangement that was not purely institutional." She says it precisely. "He said it had been ongoing for some time." Another pause. "He did not name the person. He said the record would name itself when it was read aloud." She looks at the garden. "I came tonight because I needed to hear it said in a room full of people." A pause. "So that I would not be the only person who knew."',
            response_strained:   '"He told me there was something in the Register that was not purely institutional." A pause. She looks at the garden. "He said the record would name it when read." Another pause. "I came to hear it named." She does not say more.',
            response_fractured:  '"He told me." A beat. "Something in the Register." A pause. "Not institutional." She looks at the garden. "I came to hear it said aloud." Another pause. "He did not say it."',
            unlocks: 'BA2_ORIGINAL',
            grants_node: 'ashworth_told_her_about_arrangement',
          },
          'BA2_ORIGINAL': {
            text:     '"Did he name who was coming for him."',
            type:     'focused_follow_up',
            cost:     10,
            response_strained:   '"He said he knew the shape of the danger. Not the specific name." A pause. "He was careful about specifics. Even with me."',
            response_fractured:  '"He named the danger." A long pause. "Not the specific person." Another pause. "He trusted someone he shouldn\'t have."',
            grants_node: 'ashworth_planned_revelation',
            cross_links: [{ char: 'curator', branch: 'B' }],
          },
          'BA3': {
            text:     '"Why didn\'t you warn the Compact directly."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'She looks at the garden for a long time. Long enough that the question might have disappeared. It hasn\'t. "Because Edmund said the investigator would do it better." A pause. "He said the warning would be credible in a way mine wouldn\'t be. Someone from inside the structure — inside a system that connected both sides — could carry the truth in a way that would be received as truth. My warning would be received as grief." Another pause. "He had positioned everything. Including the person standing here." She does not look at Callum when she says this. She is still looking at the garden. "I trusted his design even when it frightened me. I trusted it because he had been careful about everything else and he had been careful about this."',
            grants_node: 'ashworth_positioned_callum_for_truth',
            cross_links: [{ char: 'witness_map', branch: 'observation_2' }, { char: 'steward', cross_id: 'ashworth_steward' }],
          },
        },
      },
      'C': {
        label:            'The recommendation',
        unlock_condition: { requires_char_branch: { char: 'steward', branch: 'B' } },
        questions: {
          'BC1': {
            text:     '"You recommended the investigator to the Compact."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"I made a recommendation." She says it without turning from the garden.',
            response_strained:   '"I told the Sovereign there was an investigator whose investigator the Compact had been watching for eighteen months." She doesn\'t elaborate.',
            response_fractured:  '"I told them your name. I said you would follow the evidence without asking to be managed away from it." A pause. "Edmund agreed. He said you were the one he\'d have chosen."',
            grants_node: 'ashworth_sovereign_correspond',
          },
          'BC2': {
            text:     '"Why that name specifically."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"Because Edmund had been watching you for eighteen months.\" She says it directly. \"Not him personally. The Compact had been watching the investigation work \u2014 the cases you took, how you conducted them, what you were willing to pursue past the point where most investigators stop.\" A pause. \"He said: I need someone who will not be managed. Someone the other side has not already identified as a useful instrument.\" She looks at the garden. \"He spent eighteen months finding that.\" Another pause. \"I agreed with his reasoning. Whether the outcome justifies it is a question he is no longer here to answer."',
            unlocks: 'BC3',
            grants_node: 'callum_selected_after_eighteen_months_observation',
          },
          'BC3': {
            text:     '"Did Edmund know who was watching you."',
            type:     'focused_follow_up',
            cost:     15,
            response_composed:   'She looks at Callum directly. For the first time this evening. "He knew the Seal had an interest in the investigation. He knew an investigator positioned by the Seal would be pointed toward the wrong verdict." A pause. "He did not know they had already positioned you. That information came later — from the Compact." She is quiet for a moment. "When he found out, he said: that is exactly why it has to be him. If they positioned him for one function, he can be repositioned for another." She does not say whether Edmund was right. She has been deciding since she found out. She does not have a conclusion yet.',
            grants_node: 'ashworth_knew_seal_interest_in_investigation',
            cross_links: [{ char: 'compact_sovereign', branch: 'q4_unlock' }],
          },
        },
      },
      'mask': {
        label:            'The wrong mask — forty years of Rites',
        // Unlocks after Greaves Branch B complete (cross-link fires it).
        // She has attended forty years of Rites. She knows every member's mask.
        // She saw the wrong mask at 7:52. She chose not to say anything immediately.
        // She has been waiting for the right question.
        unlock_condition: { requires_cross_link: { char: 'greaves', branch: 'B', q: 'GB3' } },
        questions: {
          'AM1': {
            requires_cross_link: { char: 'greaves', branch: 'B', q: 'GB3' },
            text:     '"Forty years of Rites. You know every mask in this building."',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '"I know every mask." She says it in past tense. As she says everything. "I knew every mask." A pause. "Edmund chose his thirty-one years ago. Dark green with a specific gold threadwork at the left temple. He had it commissioned in Florence." She looks at the garden. "When a member enters the Ballroom I know who they are before they speak. The masks are not as anonymous as members believe." Another pause. "Tonight one mask was anonymous. Because it had nothing to identify."',
            response_controlled: '"I knew every mask." A pause. "Forty years. Yes." She looks at the garden. "Tonight one mask had nothing to know it by. No threadwork. No impression. Nothing." Another pause. "I noticed at seven fifty-two."',
            response_strained:   '"Every mask." A pause. "Forty years." She looks at the garden. "I noticed the plain one at seven fifty-two. I didn\'t say anything." Another pause. "I am saying something now."',
            response_fractured:  '"Forty years." A beat. "I knew." Another beat. "Seven fifty-two." A pause. "Wrong mask." She looks at the garden. "I said nothing." A pause. "I am saying it now."',
            unlocks: 'AM2',
            timeline_critical: true,
            return_echo: 'She has not moved from the window. "Seven fifty-two." She says it as you enter. Without turning. A pause. "Plain mask. No mark." Another pause. "I said nothing at the time." She does not say why.',
            grants_node: 'lady_ashworth_wrong_mask_752',
          },
          'AM2': {
            text:     '"Whose mask wasn\'t there."',
            type:     'direct_confrontation',
            cost:     10,
            response_composed:   'She turns from the garden. This is the first time she has looked at you directly since the second encounter began. "The Compact\'s physician." She says it without hesitation. "His mask is distinctive — a brushed silver backing with a narrow red border at the crown. Edmund described it to me three years ago. He noticed things." A pause. "At seven fifty-two the physician\'s position in the assembly held a mask I had never seen before. Plain. No silver. No border. Not his." She looks at you. "I noticed. I did not act. Edmund would have found that insufficient of me." Another pause. "He would have been right."',
            response_controlled: '"The physician." A pause. "His mask was not on his face at seven fifty-two." She looks at you. "I know his mask. I do not know what he was wearing instead."',
            response_strained:   '"The physician." A pause. She looks at the garden. "His mask was gone. Something else was there." Another pause. "I know the difference."',
            response_fractured:  '"The physician." A beat. "Not his mask." A pause. "I know his mask." She looks at you. "That was not it."',
            timeline_critical: true,
            return_echo: 'She is at the window. "The physician\'s mask." She says it as you enter. A pause. "Silver. Red border at the crown." Another pause. "Not what he was wearing at seven fifty-two." She does not turn from the window.',
            grants_node: 'ashworth_physician_wrong_mask_confirmed',
          },
        },
      },
    },

    backstory_chain_addendum: {
      'D': {
        label:            'The letter — fourteen months',
        unlock_condition: { requires_item: 'lady-ashworth-letter' },
        questions: {
          'LD1': {
            requires_item: 'lady-ashworths-key',
            text:     '"The letter. You wrote it."',
            type:     'narrative_statement',
            cost:     6,
            response_composed:   '"Six weeks ago." She says it to the garden. "When Edmund told me what was in the Register — not only the institutional matter. The personal one as well." A pause. "I wrote the letter that night. I did not send it." She looks at the garden. "The person it was addressed to — the arrangement had been ongoing for fourteen months. I had known for most of that time." Another pause. "I chose not to address it directly for fourteen months because Edmund was careful about his work and particular about his risks, and I had learned to trust his judgment about both." She is very still. "Six weeks ago he told me he was going to name it in the Register. I wrote a letter to the person it concerned." A pause. "I did not send it because sending it was not the right order. The Rite was the right order. The Register was the right order." She looks at the garden. "He had designed it carefully. I trusted the design."',
            response_strained:   '"Six weeks ago." She looks at the garden. "Edmund told me about the personal entry — alongside the institutional one. I had known about the arrangement for fourteen months." A pause. "I wrote the letter that night. To the person involved." She looks at you. "I did not send it. The Rite was the right order."',
            response_fractured:  '"Six weeks ago." A beat. "He told me what was in the Register." Another beat. "The personal entry." She looks at the garden. "Fourteen months I knew. I wrote the letter. I didn\'t send it." A pause. "He was going to name it tonight."',
            unlocks: 'LD2',
            grants_node: 'ashworth_affair_letter_unsent',
          },
          'LD2': {
            text:     '"Who was it addressed to."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'The longest pause she has produced that is not Branch A. She looks at the garden for a long time. "The letter is addressed to C." She says it exactly. "That is what I wrote. One initial. I was not prepared to write more than one initial." A pause. "I do not know whether you will find that person tonight or not. I do not know whether finding them changes what happened on that balcony." She looks at you. "What I know is that Edmund was going to name the arrangement in the Register. In front of everyone. He was not doing it to punish anyone." Another pause. "He was doing it because the Register is the record, and the record is how this building accounts for itself." She looks at the garden. "I came tonight to hear it named. I did not hear it named. That is the shape of this evening for me."',
            response_strained:   '"The letter is addressed to C." She says it quietly. "One initial. That is as far as I got." A pause. "Edmund was going to name it tonight. I came to hear him name it." She looks at the garden. "I did not hear it."',
            grants_node: 'ashworth_affair_initial_c',
          },
        },
      },
    },

    backstory_chain_addendum: {
      'D': {
        label:            'The letter — fourteen months',
        unlock_condition: { requires_item: 'lady-ashworth-letter' },
        questions: {
          'LD1': {
            text:     '"The letter. You wrote it."',
            type:     'narrative_statement',
            cost:     6,
            response_composed:   '"Six weeks ago." She says it to the garden. "When Edmund told me what was in the Register — not only the institutional matter. The personal one as well." A pause. "I wrote the letter that night. I did not send it." She looks at the garden. "The person it was addressed to — the arrangement had been ongoing for fourteen months. I had known for most of that time." Another pause. "I chose not to address it directly for fourteen months because Edmund was careful about his work and particular about his risks, and I had learned to trust his judgment about both." She is very still. "Six weeks ago he told me he was going to name it in the Register. I wrote a letter to the person it concerned." A pause. "I did not send it because sending it was not the right order. The Rite was the right order. The Register was the right order." She looks at the garden. "He had designed it carefully. I trusted the design."',
            response_strained:   '"Six weeks ago." She looks at the garden. "Edmund told me about the personal entry — alongside the institutional one. I had known about the arrangement for fourteen months." A pause. "I wrote the letter that night. To the person involved." She looks at you. "I did not send it. The Rite was the right order."',
            response_fractured:  '"Six weeks ago." A beat. "He told me what was in the Register." Another beat. "The personal entry." She looks at the garden. "Fourteen months I knew. I wrote the letter. I didn\'t send it." A pause. "He was going to name it tonight."',
            unlocks: 'LD2',
            grants_node: 'ashworth_affair_letter_unsent',
          },
          'LD2': {
            text:     '"Who was it addressed to."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'The longest pause she has produced that is not Branch A. She looks at the garden for a long time. "The letter is addressed to C." She says it exactly. "That is what I wrote. One initial. I was not prepared to write more than one initial." A pause. "I do not know whether you will find that person tonight or not. I do not know whether finding them changes what happened on that balcony." She looks at you. "What I know is that Edmund was going to name the arrangement in the Register. In front of everyone. He was not doing it to punish anyone." Another pause. "He was doing it because the Register is the record, and the record is how this building accounts for itself." She looks at the garden. "I came tonight to hear it named. I did not hear it named. That is the shape of this evening for me."',
            response_strained:   '"The letter is addressed to C." She says it quietly. "One initial. That is as far as I got." A pause. "Edmund was going to name it tonight. I came to hear him name it." She looks at the garden. "I did not hear it."',
            grants_node: 'ashworth_affair_initial_c',
          },
        },
      },
    },

    contamination: {
      'baron': 'She glances toward the direction of the Smoking Room. "The Baron understands this building better than he admits." She says it to the garden.',
      'surgeon': 'She is slightly more still. "Edmund was aware of the Compact\'s medical channel." She says it to the garden. "He was aware of it for some time." A pause. "He was careful about what he wrote down."',
      'compact-keepsake-context': 'She is quiet for a moment. The kind of quiet that has been practiced. "Edmund kept certain things." She says it to the garden. "I made a decision about those things when I found them. I decided to leave them where they were." A pause. "That decision is not relevant to how he died. But it is relevant to why I came tonight." Another pause. "I needed the record to speak so that I would not have to."',
    },

    // ── DECEPTION ITEMS ─────────────────────────────────────────
    deception_responses: {
      'lady-ashworths-key': {
        response_composed:   'She looks at the key. A long time. "That key has been in the study since fourteen months ago." She says it quietly. "Edmund gave it to me and said: if something happens before I have the chance to address it, use this. The study desk — the locked drawer." A pause. "I did not use it before tonight. I trusted his timeline." She looks at the garden. "His timeline did not complete. I used the key at seven-thirty to open the drawer and retrieve the letter I had written six weeks ago. The letter I did not send." Another pause. "The letter that was addressed to C." She looks at you. "I came tonight to hear Edmund name that letter in the Register. He did not name it. Now I am the only person who knows what is in it."',
        response_strained:   '"Fourteen months ago." She looks at the key. "Edmund gave it to me. The study desk drawer." A pause. "I opened it at seven-thirty. The letter I wrote six weeks ago." She looks at the garden. "The letter to C."',
        is_effective: true,
        composure_effect: -25,
        grants_node: 'ashworth_key_used_730',
      },
      'compact-keepsake': {
        response_composed:   'She looks at it for a long time. Not at you. At the object. Something in her face closes in a way her composure has not closed all evening. "I knew that was there." She says it very quietly. "I have known for some time." A pause. "Edmund kept it in the study. He kept it alongside the flower I forgot on his desk six weeks ago." She looks at the garden. "I did not remove it. That was my decision." Another pause. "A woman who removes an object like that from her husband\'s study has decided the object is the problem. I decided the arrangement it represented was the problem, and the arrangement was something Edmund had chosen to address in the Register." She looks at you. "I left it there because removing it was not my function. The Register was his function. I trusted the Register."',
        response_strained:   '"I knew." A pause. She looks at the object. Not at you. "I left it there." Another pause. "Edmund was going to address it in the Register. That was the right order." She looks at the garden. "I trusted the order."',
        is_effective: true,
        composure_effect: -20,
        grants_node: 'ashworth_keepsake_known',
      },
    },

    cognitive_load_response: '"Edmund." While watching you write. "He chose the Rite. He chose the Register. He chose —" She stops. "He chose the audience. He needed witnesses." A pause she didn\'t plan. "He needed you specifically."',

  },

  // ── THE SURGEON ────────────────────────────────────────────
  // Push plot. No Compact depth in this room. Branch C only conviction path.
  // Branch A and B: the colleague and thirty years. Personal depth only.
  // The warmth never leaves. That is the tell.
  'surgeon': {
    counter_strategy:  'perform',
    optimal_technique: 'record',
    composure_floor:   40,
    fracture_threshold: 40,

    baseline: {
      text:         'He is in the same room as Dr. Crane. He has not looked at her since she came back downstairs — the particular discipline of a man who knows exactly where she is without looking. He is the most helpful person in this building. This is not accidental.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         '"Detectable." The Curator\'s exact word, in the exact context. From a man with no reason to know the Curator\'s specific vocabulary about a specific subject. And: he moved toward Crane, not toward the body. He stayed close while she worked.',
    },

    composure_variants: {
      'Q1': {
        composed:   '"Lord Ashworth was at the lectern when he died. I was in the south corridor — I heard the assembly react before I understood what had happened." A pause. "I moved toward Dr. Crane immediately. She was already at the body." He says this as if it explains the movement. It doesn\'t explain the movement. "She is very thorough." Another pause — the particular pause of a man deciding what to offer next. "I stayed close while she worked." He looks at you. "The Viscount kept his gloves on at the candelabra. I noticed because I notice hands — professional habit. You remove gloves to handle metalwork. He did not remove them." He says the last two words with a small self-deprecating acknowledgment. "The Steward was in the south corridor at seven fifty-eight. That struck me as deliberate placement rather than routine."',
        controlled: '"South corridor when it happened. I heard the assembly react." A pause. "I moved toward Dr. Crane. She was at the body." He looks at you. "The Steward\'s corridor position at seven fifty-eight — deliberate placement. Ask him about it."',
        strained:   '"South corridor. I heard it." A pause. "I moved toward Crane. She was already there." He looks at the desk. "The Steward. Seven fifty-eight. Ask him."',
        snapback:   '"I\'ve given you a complete account. What specifically do you need?"',
      },
      'Q2': {
        composed:   '"Was is more accurate." A pause — not defensive, just precise. "Twenty-two years of surgical practice. The last four in consultancy work for the Compact — medical oversight, member welfare, that kind of engagement." He says \'that kind of engagement\' with the mild tone of a man describing paperwork. "I stepped back from active practice eighteen months ago. The hands are still good." He looks at them briefly. "Old habit."',
        controlled: '"Was. Eighteen months ago I stepped back." A pause. "Surgical practice. Twenty-two years. Consultancy since — the Compact work." He looks at his hands briefly. "The skills are intact."',
        strained:   '"Was." A pause. "Twenty-two years. Then eighteen months ago." He looks at his hands. "The Compact work since."',
        snapback:   '"My credentials are documented with the Compact."',
      },
      'Q3': {
        composed:   '"The Register alterations are visible to anyone examining the ink timing carefully." He says this helpfully. "I noticed at approximately seven forty-two. The Curator was already aware — he used the word \'detectable\' when I spoke with him. A precise choice of word."',
        controlled: '"The alterations are — detectable." He uses the Curator\'s word. In the exact context. A pause. "I noticed at seven forty-two. The Curator already knew."',
        strained:   '"Detectable." He says it. A half-second pause. "The Curator\'s word. I had occasion to hear it."',
        snapback:   '"I noted the Register condition when I passed the Ballroom."',
      },
      'Q4': {
        composed:   '"Seven forty-five." He considers. "South corridor — I\'d come from the library end, I think. The archive path." A pause. "I was moving toward the Ballroom. I remember checking my watch somewhere around that time because the Rite was due to begin and I wanted to be in position." He looks at you. "Is seven forty-five a significant time? I can try to be more precise if it helps."',
        controlled: '"South corridor. Seven forty-five." A pause. "Moving toward the Ballroom. I checked my watch." He looks at you. "Is that time significant?"',
        strained:   '"South corridor. Seven forty-five." A pause. He looks at the desk.',
        snapback:   '"South corridor. Seven forty-five. Moving toward the Ballroom."',
        timeline_critical: true,
        return_echo: 'He has not moved from the desk. "Seven forty-five." He says it as you enter. Not to you. A pause. "South corridor." He says it to the desk.',
        grants_node: 'surgeon_committed_745_south_corridor',
      },
      'Q5': {
        composed:   '"I walked the full building before the assembly." A pause. "The balcony level, yes. The service stairs. The sightlines." He says sightlines with the particular attention of someone who needed to know them. "Lord Ashworth\'s position during the opening is well documented — the railing, forty years, every Rite." Another pause. "I read the Estate\'s ceremonial record when I joined the Compact four years ago. I like to understand the spaces I work in." He looks at you. "Is there something specific about the balcony?"',
        controlled: '"I walked the full building. The balcony level, yes." A pause. "The sightlines." He says the word carefully. "Lord Ashworth\'s position at the railing — documented. Forty years." He looks at you. "The balcony is relevant?"',
        strained:   '"The balcony level. Yes." A pause. "I walked it earlier." He looks at the desk.',
        snapback:   '"My movements before the assembly were routine."',
        timeline_critical: true,
        return_echo: 'He is watching the desk. "The balcony level." He says it as you enter. As if the sentence was already in his mouth. A pause. He does not ask what you found.',
        grants_node: 'surgeon_admits_balcony_level',
      },
      'Q6': {
        composed:   '"Tonight was — specific." A pause. Not managed. The first pause that costs something small. "The Register opening. The assembly. Ashworth at the railing." He looks at the desk. "I had been aware for some time that this Rite would be significant. The Compact knew. Several Estate members knew." Another pause. "What I didn\'t anticipate —" He stops. He picks it up. "What none of us anticipated was the manner of it." He looks at you. The warmth is still there. "I think the Baron anticipated more than he\'s saying. And the Steward covered a corridor he had no routine reason to cover." He looks at the desk. "Those two things together — that\'s the shape of tonight."',
        controlled: '"Tonight was specific." A pause. "Ashworth at the railing. The Register open." He looks at the desk. "The Baron anticipated more than he\'s saying. The Steward covered a corridor without routine reason." Another pause. "Those two things."',
        strained:   '"Specific." A pause. He looks at the desk. "The Baron. The Steward\'s corridor." Another pause. "Those two."',
        snapback:   '"The investigation will establish what it establishes."',
      },
      'Q7': {
        composed:   '"A licensing board made a decision thirty years ago." He says it with complete calm. "They revoked a colleague\'s credentials. Someone I had trained with. Someone who had done nothing that warranted what happened to them." A pause. "The board\'s decision was institutional. Precise. Correct in form. Completely wrong in substance." He looks at you. "I disagreed with it for a long time. Eventually disagreement became something else."',
        controlled: '"Thirty years ago. A colleague." A pause. "The board\'s decision was final." He looks at the desk. "I disagreed with it. For a long time that was all it was."',
        strained:   '"Thirty years ago. A colleague. The board." A pause. "Ashworth was on the board." He says it plainly. "That is the connection."',
        snapback:   '"My professional history is relevant only insofar as it informs the current situation."',
        timeline_critical: true,
        return_echo: 'He is at the desk. The window behind him. "Thirty years." He says it as you enter. Not to you. A pause. He does not finish the sentence.',
        grants_node: 'surgeon_motive_licensing_ashworth',
      },
      'Q8': {
        composed:   '"Lord Ashworth was chair of the licensing review." He says it without drama, without weight. "He signed the determination. He had the authority to return the finding and he chose not to." A pause. "I hold no particular animus toward institutional authority. Lord Ashworth worked as he was designed to work." He looks at you. The warmth is still there. "You\'re building a motive. You should." Another pause. "It\'s accurate."',
        controlled: '"He chaired the review." A pause. "He signed it." He looks at the desk. "Yes. That is accurate."',
        strained:   '"He signed it." A pause. "He chose not to return it." He looks at the desk.',
        snapback:   '"The licensing review is a matter of record."',
        requires_q: 'Q7',
        grants_node: 'surgeon_motive_ashworth_signed',
      },
      'Q9': {
        composed:   '"I find it professionally interesting." He says it without irony. "A good investigation asks the right questions in the right order." A pause. "You are asking reasonable questions." Another pause. "In a reasonable order." He looks at you. "Keep going."',
        controlled: '"Professionally interesting." A pause. "Reasonable questions. Reasonable order." He looks at you. "Keep going."',
        strained:   '"Professionally interesting." A pause. He looks at the desk.',
        snapback:   '"I have been cooperative all evening."',
      },
      // ── MID-DEPTH CONFRONTATION ────────────────────────────────
      // evidence_reveal type — highest single composure cost.
      // Gates: craneBalconyAdmission + surgeons-mask + south corridor commitment.
      // Purpose: drops composure to make Branch C threshold reachable.
      // He names the gap himself. He tells you what you need.
      // That is the most disturbing thing about him.
      'Q10': {
        composed:   'He is still. Not the managed stillness he has produced all evening — something underneath that. A pause that takes longer than any pause he has chosen. "You have placed three things in the same sentence." He says it. "The mask. The floor. The corridor." Another pause. He looks at the mask. He does not ask where it was found. He has not asked that once. "That is a precise set of observations." He looks at you. The warmth is still there. It is the most disturbing thing about him. "What specifically are you asking me to account for."',
        controlled: '"Three things." He says it. "The mask. The floor. The corridor." A pause. He looks at the mask. He does not ask where it was found. "What specifically are you asking."',
        strained:   '"The mask. The floor. The corridor." A pause. He looks at the mask. He does not ask where it was found. He looks at you.',
        snapback:   '"That is three separate observations. Which one are you asking about."',
        composure_cost_override: 20,
        grants_node: 'surgeon_confronted_with_three_items',
      },
      'Q11': {
        composed:   'The longest pause he has produced that is not Branch C. Not recalibration. Not a calculation running. Something closer to a man deciding how much of the truth is safe to leave in the room. "You have a committed statement." He says it. "You have a mask that was not present at seven-oh-five and was present at eight-oh-one." A pause. "You have a physician who left a balcony floor clear and found it not clear." He looks at you. "What you do not have" — he says it with the precision of a man who has audited this list since eight-oh-one — "is a witness who places me anywhere specific during those seven minutes." He looks at the desk. "That is the gap." A pause. "Find me a witness."',
        controlled: '"You have the committed statement. The mask. The physician\'s two visits." A pause. "What you do not have is a witness for those seven minutes." He looks at the desk. "That is the gap." Another pause. "Find me a witness."',
        strained:   '"The gap." He says it. A pause. "Seven minutes. No witness." He looks at the desk. "Find me a witness."',
        snapback:   '"The evidentiary gap is clear. A witness would close it."',
        composure_cost_override: 22,
        grants_node: 'surgeon_gap_named_by_surgeon',
        timeline_critical: true,
        return_echo: 'He has not moved. "Find me a witness." He says it as you enter. A pause. He is still looking at the desk. He means it. He has been running the probability that you will since he said it.',
      },
      'Q12': {
        // Redirect: Baron at terrace window 7:45 — genuine misdirection
        unlock_condition: { composure_lte: 65, requires_node: 'surgeon_lie_caught_in_fracture_window' },
        composed:   '"The Baron." He says it before the question finishes. "He was at the terrace window at seven forty-five." A pause. "I saw him from the south corridor as I was passing through." He looks at the desk. "He was watching the terrace with the particular attention of someone who expects to see something." Another pause. "He has not mentioned that. You should ask him why." He looks at you. The warmth is still there. "That is a genuine observation. I am not deflecting. The Baron at that window at that time is relevant." A pause. "Pursue it."',
        controlled: '"The Baron was at the terrace window." A pause. "Seven forty-five. I passed through the south corridor — I saw him." He looks at the desk. "He was watching for something." Another pause. "He has not mentioned that."',
        strained:   '"The Baron." A pause. "Seven forty-five. Terrace window." He looks at the desk. "He was watching. He has not said so." Another pause. "Ask him."',
        fractured:  '"The Baron." A beat. "Seven forty-five." Another beat. "The terrace window." He looks at the desk. "He was watching. Ask him."',
        snapback:   '"The Baron was at the terrace window at seven forty-five. That is a factual observation."',
        grants_node: 'surgeon_redirect_baron_745',
      },
    },

    silence_fill: 'He looks at you. A pause. "The Baron was at the terrace window at seven forty-five." He says it helpfully. "He has not mentioned that. He should." He is asking what you know. This is only the second time he has offered something unprompted. The first was Q1.',
    silence_tell: 'The silence goes on. He waits. He is better at waiting than anyone in this building. Then: "You\'ve placed me somewhere specific." Not a question. A pause. "Ask me the question directly. I prefer direct questions." He looks at you. "I will give you a direct answer." He means this. The answer he gives will be precise and will not be the answer you need.',

    word_tell: {
      trigger:    'detectable',
      context:    'Register alterations discussion',
      surface_on: ['pressure', 'approach'],
      text:       'He used the word "detectable." The Curator\'s exact word. In the exact context. From a man who should have no reason to know the Curator\'s specific vocabulary about a specific subject. That word. In that context. Is the thread.',
    },

    approach_response: '"You\'re building a narrative of what I knew and when I knew it." He says it pleasantly. "That is correct methodology." He pauses. "Some of the narrative is accurate. Some is not. I\'ll correct the inaccurate portions."',

    pressure_response: {
      indignation: null,
      management: '"That\'s a serious proposition." He says it the way you\'d say "interesting weather." "I\'d want to understand what evidence leads you there." He already knows what evidence leads you there. He needs to know how much of it you have.',
    },

    direct_confrontation_response: '"You\'re better at this than I expected." He says it like a professional assessment. His composure hasn\'t moved. That is the tell. A man who was innocent would have moved.',

    committed_statement_triggers: {
      'Q_timing': {
        topic:     'location_745',
        statement: 'South corridor at seven forty-five. Moving toward the Ballroom.',
        truth:     'He was on the balcony at 7:45. He pushed Ashworth. He was not in the south corridor.',
      },
    },

    sue_inconsistency: {
      'surgeons-mask': {
        committed_after:    'Q4',
        reveal_response:    '"That fell." He says it. Two words. A full second of stillness. He does not ask where it was found. He knows where it was found. He has known since seven forty-eight.',
        inconsistency_note: 'He committed to the south corridor at 7:45. The mask places him on the balcony. He did not ask where it was found.',
      },
      'candle-iron': {
        committed_after:    'Q4',
        reveal_response:    '"A staged scene." He says it immediately. Then stops. He looks at the item. Then at you. "That is a reasonable conclusion from the physical evidence." He does not say it is wrong. He does not say it is right. He is waiting to see what you do with his response.',
        inconsistency_note: 'He did not deny the staging. He called it a reasonable conclusion. That is not the same as confirming it.',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The colleague',
        unlock_condition: { after: 'Q8' },
        questions: {
          'SA1': {
            text:     '"Who was the physician."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"Someone I trained with." He says it without weight. Without ceremony. "The best diagnostician I have encountered in twenty-two years of practice. Possibly longer." A pause. "They understood a presentation before the examination was complete. That quality is rare. I have met it once." He looks at the window. "The board did not find it relevant."',
            response_controlled: '"Someone I trained with." A pause. "Exceptional." He says the word plainly. "The board did not find that relevant."',
            response_strained:   '"Someone I trained with." A pause. He looks at the window. "The board did not find them relevant."',
            unlocks: 'SA2',
          },
          'SA2': {
            text:     '"What happened to them."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"They left practice." He says it the way you state a fact about weather. "The determination was final. No appeal permitted. A career of that quality — ended by three signatures and a closing statement." A pause. "They managed." He says managed with the particular flatness of someone who knows what managed cost. "People of that capability find ways to continue. The work changes form. The work continues." He looks at you. "That is all I will say about them."',
            response_controlled: '"They left practice." A pause. "The determination was final." He looks at the window. "They managed." A pause. "The work continued in a different form."',
            response_strained:   '"They left practice." A pause. He looks at the window. "They managed." He says it to the window.',
            unlocks: 'SA3',
            grants_node: 'surgeon_colleague_left_practice',
          },
          'SA3': {
            text:     '"You stayed in contact."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'A pause of a different quality from any he has produced. Not recalibration. Something closer to a door closing quietly. "That is not a question I will answer." He says it without heat. Without anything. "There are things that belong to the investigation and things that do not." He looks at you. The warmth is still there. "That is the line." Another pause. "I am being precise about where it is."',
            response_controlled: '"That is not something I will answer." A pause. "The line is there. I am being precise about it."',
            response_strained:   '"No." A pause. He looks at the window. He has said no to you for the first time this evening.',
            grants_node: 'surgeon_contact_refused',
          },
        },
      },
      'B': {
        label:            'Thirty years',
        unlock_condition: { requires_branch: 'A', composure_lte: 75 },
        questions: {
          'SB1': {
            text:     '"When did disagreement become something else."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"Gradually." He says it without irony. "That is the honest answer. There was no specific moment. There was a direction and I followed it." A pause. "Disagreement assumes you believe the institution can be corrected. At a certain point I stopped believing that." He looks at the desk. "The belief did not leave dramatically. It simply — stopped being present one morning." Another pause. "I noted it. I adjusted."',
            response_controlled: '"Gradually." A pause. "No specific moment. A direction." He looks at the desk. "At a certain point I stopped believing the institution could be corrected." Another pause. "I adjusted."',
            response_strained:   '"Gradually." A pause. He looks at the desk. "I adjusted."',
            unlocks: 'SB2',
          },
          'SB2': {
            text:     '"You don\'t regret it."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He considers the question with the same attention he has given every question this evening. He does not rush toward an answer. "Regret implies the decision was wrong." A pause. "I do not believe the decision was wrong." He looks at you. The warmth is still there. It has been there all evening. "I believe it was precise. I believe it was necessary. I believe it was executed correctly." Another pause. "Those beliefs are intact." He says it the way a surgeon says a procedure went well. Clinical. Complete. "What I find —" He stops. He picks it up. "What I find is that correct decisions can still cost something. That is not regret. That is arithmetic."',
            response_controlled: '"Regret implies the decision was wrong." A pause. "I don\'t believe that." He looks at the desk. "What I find is that correct decisions can still cost something." Another pause. "That is arithmetic. Not regret."',
            response_strained:   '"Regret implies the decision was wrong." A pause. He looks at the desk. "I don\'t believe that."',
            unlocks: 'SB3',
            grants_node: 'surgeon_no_regret_arithmetic',
          },
          'SB3': {
            text:     '"What does it cost."',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'The longest pause he has produced all evening. The quality of it is different from every other pause — not managed, not performed, not a calculation running. Just a man sitting in a question he has asked himself before and has not fully answered. "Precision." He says it finally. One word. A pause. "It costs precision." He looks at the desk. "You make a decision of a certain magnitude and afterward you apply that same precision to everything. Every action. Every conversation." Another pause. "It does not leave room for certain things." He looks at you. The warmth is there. It has always been there. "I am aware of what that looks like from where you are sitting." A pause. "I find I cannot change it." He says it plainly. Not with sadness. With the accuracy of a man describing a condition he has diagnosed in himself and accepted completely. "That is the cost."',
            response_controlled: '"Precision." A pause. "It costs precision." He looks at the desk. "You apply that same standard to everything afterward." Another pause. "It does not leave room for certain things." He looks at you. "I am aware of what that looks like." A pause. "I cannot change it."',
            triggers_fracture:  false,
            grants_node:        'surgeon_cost_is_precision',
          },
        },
      },
      'C': {
        label:            'The balcony',
        unlock_condition: {
          requires_node: 'vivienne_push_witnessed',
          requires_node_2: 'surgeon_gap_named_by_surgeon',
          composure_lte: 65
        },
        questions: {
          'SC1': {
            text:     '"You said seven forty-five. South corridor. That is not where you were."',
            type:     'partial_claim',
            cost:     12,
            response_composed:   'A pause of a specific quality. Not surprise. Something closer to recalibration. "You have placed me somewhere else." He says it. "At seven forty-five." Another pause. "You\'re asking me to account for a time I have already accounted for." He looks at you. "What specifically are you placing me at seven forty-five."',
            response_controlled: '"Seven forty-five." A pause. He says it carefully. "I told you I was in the south corridor." Another pause. "You have placed me somewhere else." He looks at you. "What evidence."',
            response_strained:   '"Seven forty-five." A pause. He looks at the desk. "I told you the south corridor." Another pause. He does not look up.',
            unlocks: 'SC2',
            timeline_critical: true,
            return_echo: 'He is very still. "Seven forty-five." He says it as you enter. Not to you. "South corridor." A pause. He does not look up. He is running a calculation.',
            grants_node: 'surgeon_on_balcony_challenged',
          },
          'SC2': {
            text:     '"Lord Ashworth was at the railing. You were beside him."',
            type:     'direct_confrontation',
            cost:     18,
            response_composed:   'A pause of a different quality from any he has produced. "Lord Ashworth\'s position during the opening ritual is a forty-year habit. Everyone knows it." He looks at you. "You\'re placing me beside him at a specific moment." Another pause. "What evidence puts me there?"',
            response_controlled: '"You\'re placing me at the railing." A pause. "What evidence?" He is asking what you have. He needs to know how much.',
            response_strained:   '"At the railing." A pause. He looks at the desk. "What evidence puts me there." He says it quietly. Not a challenge. A question.',
            unlocks: 'SC3',
            grants_node: 'surgeon_placed_at_railing',
          },
          'SC3': {
            text:     '"She saw you."',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'He is quiet for a long time. The quality of the quiet is different from every other quiet he has produced this evening. "No." He says it finally. One word. A pause. The warmth is still there. "You have the gap." Another pause. "Seven forty-five to seven fifty-two. Seven minutes. No witness places me anywhere in this building during those seven minutes." He says it with the calm of a man completing a calculation he has been running since eight-oh-one. He looks at the desk. "I\'m not going to close it for you."',
            response_controlled: '"No." A pause. He looks at the desk. "Seven forty-five to seven fifty-two." He says the times plainly. "Seven minutes. No alibi." He does not say more.',
            triggers_fracture:  false,
            grants_node:        'surgeon_seven_minute_gap_confirmed',
            cross_links: [{ char: 'crane', branch: 'B', cross_id: 'surgeon_crane' }],
          },
        },
      },
    },

    contamination: {
      'crane': '"Dr. Crane." He says the name before you mention her. A pause. "She is very composed tonight." He says it with something that is not quite professional admiration. "She has been composed since she came back into the Ballroom." Another pause. "Whatever she found upstairs — she made a decision about it very quickly. I find that — significant."',
      'baron': '"The Baron is a careful observer." He says it with professional appreciation. "He notices things he doesn\'t report." A pause. "I respect that quality. It is rarer than it appears."',
      'vivienne': 'He is still for a moment. "The French girl." He says it without affect. "She sees a great deal." A pause. "I would not discount what she tells you on the grounds that she interprets it incorrectly." He looks at you. "The observation and the interpretation are separate things."',
      'hatch': '"The groundskeeper has been here thirty years." He says it helpfully. "Men like that notice things without knowing they\'ve noticed them." A pause. "He would be worth speaking to." He says it warmly. He means it. He knows exactly what Hatch noticed.',
    },

    cognitive_load_response: '"Seven forty-five." He uses the exact time while watching your pen. Then: "The balcony level at seven forty-five is — " A pause he didn\'t intend. He looks at your pen. He has said the time. He has connected it to the balcony. He does not finish the sentence.',

  },

  // ── VIVIENNE ───────────────────────────────────────────────
  // No composure decay. No technique effect. The Account produces more.
  // Every other technique produces more, just differently directed.
  // She is wrong about almost everything. She is right about one thing.
  // Branch C is the conviction. Everything before it is the tax.
  'vivienne': {
    counter_strategy:  'talk',
    optimal_technique: 'account',
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'She was already talking when you arrived. She stopped when she saw you. She appears interested rather than startled. She has been waiting for someone to come and ask her things since eight-oh-one.',
      sentence_avg: 'medium',
      formality:    'low',
      tell:         'She observes everything and reports it with the precision of someone who has been cataloguing this building for four years. The tell: she speaks in threes — three observations, three times, three rooms. When she stops before three she is protecting something.',
    },

    composure_variants: {
      'Q1': {
        composed:   '"I do everything here." She gestures. "The candles. The linens. The fires. I have been in every room in this building tonight." A pause. "Every room." She says it with emphasis. "Including —" She stops herself. "We\'ll get to that."',
        wait:       'She fills it before it forms. "I shouldn\'t say this but the building was wrong before eight-oh-one." She begins. "The Steward was wrong at seven-forty. The Baron was wrong at seven forty-four. The whole building was holding something and not saying it." She smooths her apron. "I notice that. Like a room before a storm."',
        approach:   '"You already know I\'ve been everywhere tonight." She says it with delight. "That is correct. Every room. Every corridor." She leans forward. "You want to know what I saw in the specific room you are thinking about. I can see which room you are thinking about." A pause. "Ask me about the terrace. That is where you want to go."',
        record:     '"Documents tell you what people wrote down." She looks at whatever you are holding. "I tell you what people did when they thought no one was watching." She smooths her apron. "I have been in every room in this building tonight. That is more than any document." A pause. "Ask me what I saw."',
        pressure:   '"Pressure." She says the word pleasantly. "You are trying pressure." She smooths her apron. "I have been the only French woman in an English manor for four years. I am very experienced with pressure." A pause. "I will tell you everything I know regardless. The only question is order." She looks at you. "The Baron. Start with the Baron. He has very good shoulders and a very guilty expression."',
      },
      'Q2': {
        composed:   '"Four years. From Lyon." She smooths her apron. "The Curator hired me without the usual references. I have always thought that was because he needed someone who would not gossip to the local village." A pause. "I don\'t gossip to the local village. I gossip to Thomas. Thomas doesn\'t repeat things." Another pause. "Usually."',
        wait:       '"Four years." She fills the silence instantly. "The Curator hired me and I have been here since and I have seen three Rites and never seen one like tonight." She looks at you. "The other two were orderly. Tonight the Assembly dissolved because someone was dead. That is a different kind of Rite."',
        approach:   '"You want to know if I\'ve seen things before tonight that matter to tonight." She says it with appreciation. "Yes. Four years of things." She smooths her apron. "The Curator hired me because I notice things and I don\'t share them with the village. He did not specify that I shouldn\'t share them with investigators." A pause. "I find that distinction useful."',
        record:     '"Four years." She glances at whatever you are holding. "I don\'t keep a written record. Thomas keeps a written record. I keep a moving record. Everything I\'ve seen in four years is still happening in my head simultaneously." She smooths her apron. "What specifically do you need from those four years?"',
        pressure:   '"Four years." She repeats it steadily. "You cannot pressure something out of me that four years didn\'t produce. I have been patient." She looks at you. "Ask me something specific. I am better at specific than at pressure."',
      },
      'Q3': {
        composed:   '"The groundskeeper. Thirty years he has been here." She says it with the fondness of someone describing a piece of furniture she is attached to. "He notices things and writes them in his head and never says them." A pause. "I say everything. We balance each other."',
        wait:       '"Thomas." She says the name as if it answers the question completely. Then she keeps going. "He saw the east service gate tonight. He noted it the way he notes everything — precisely and without interpretation. He told me at eight-fifteen." A pause. "He also heard the impact at seven forty-five. He was in the garden." She smooths her apron. "Thomas and I have been assembling the same picture from different rooms."',
        approach:   '"You want to know if Thomas saw what I saw." She says it. "Yes and no. He heard things I didn\'t hear. I saw things he didn\'t see." A pause. "Between us we have covered most of the important positions tonight." She smooths her apron. "Go to Thomas for the times. Come to me for what the times mean."',
        record:     '"Thomas keeps a better record than I do." She says it without embarrassment. "He notes times. I note impressions." A pause. "His record and my record together would give you the full evening." She smooths her apron. "Go to Thomas for the times. Come to me for what the times mean."',
        pressure:   '"Thomas." She says it simply. "He has been here thirty years. He saw things tonight that thirty years of watching this house made legible to him." A pause. "I have been here four. I saw things that four years of watching people made legible to me." She looks at you. "We are both telling the truth. That is not something pressure changes."',
      },
      'Q4': {
        composed:   '"I shouldn\'t say this but tonight was very dramatic even before the death." She leans forward. "The Viscount was near the lectern at seven-forty adjusting something when he thought no one was watching." She nods. "And the Baron —" She stops. "Well the Baron is always a separate conversation."',
        wait:       '"Tonight." She begins immediately. "Started wrong at seven-oh-one when the Steward carried a sealed letter from the gallery to his breast pocket with the expression of a man accepting a sentence." A pause. "The whole building was holding something before the mingle had really begun. Arrivals that were not supposed to be arrivals yet. People in corridors they had no reason to be in." She smooths her apron. "That was already two wrong things before seven-ten."',
        approach:   '"You already know tonight was wrong before eight-oh-one." She says it with approval. "That is the correct starting observation." She leans forward. "The building was holding something all evening. The Steward knew. The Baron suspected. Dr. Crane knew." A pause. "Everyone in this building had a different piece of it and no one had the whole thing." She smooths her apron. "Except possibly Thomas."',
        record:     '"Whatever that document says —" She waves at it lightly, "— it is less interesting than what I saw at seven-forty." She refocuses. "The Viscount. At the lectern. Very specific movements. Not reading. Not placing. Removing and replacing something in a different position." A pause. "He came back to the lectern at seven-forty to finish something he started earlier."',
        pressure:   '"Tonight." She says it calmly under the pressure. "Was wrong from seven-oh-one. If you pressure me you will get the Baron\'s shoulders. If you ask me in order you will get everything from seven-oh-one to eight-fifteen." She smooths her apron. "I am very good at order when someone lets me use it."',
      },
      'Q5': {
        composed:   '"I shouldn\'t say this but the Baron has been watching the terrace window all evening." She says it with great significance. "And before that he was watching the study." She leans closer. "He saw someone leave the study at seven-oh-five and he looked satisfied. Like a man who has confirmed a suspicion." A pause. "I think he is in love with someone who is also in love with someone else."',
        wait:       '"The Baron." She fills it. "He was at his window at seven-oh-five watching the study door. He wrote something down. He picked up his cigarette and forgot to smoke it." A pause. "Then at seven thirty-eight he walked through the ballroom and stopped at the candelabra and looked at it very specifically without touching it." She looks at you. "A man who stops at a candelabra without touching it is either admiring it or reconsidering something."',
        approach:   '"You want to know if the Baron did it." She says it with interest rather than alarm. "He is the obvious choice, isn\'t he. Very guilty expression. The window. The cigarette he forgot to smoke." She smooths her apron. "He is also the choice that someone who had done something else would want you to land on." A pause. "I notice when obvious things are too obvious."',
        record:     '"The Baron." She glances at the document. "Whatever that says about him — the Baron at seven forty-four was at the window watching the terrace. His cigarette went out untouched at seven forty-six. He was still at seven forty-nine." She looks at you. "That is three and a half minutes watching the terrace without moving. That is a man watching for an outcome."',
        pressure:   '"The Baron." She says it. Then she looks at you steadily. "He was at the window. He was watching. His cigarette went out." A pause. "But the Baron at the window is not the same as the Baron on the balcony. The window is watching. The balcony is doing." She smooths her apron. "Those are two different things and pressure will not make them the same thing."',
      },
      'Q6': {
        composed:   '"Not everything." She considers this seriously. "The Steward is not romantic. The Steward is institutional. He covered the south corridor at seven fifty-eight under specific instructions with the face of a man following an arrangement he doesn\'t fully understand." A pause. "That is not romantic." She smooths her apron. "The Baron, however, is absolutely romantic. He has very good shoulders."',
        wait:       '"Not everything." She fills the silence. "The Steward is never romantic. The Viscount is ambitious, not romantic — there is a difference in the shoulders." She smooths her apron thoughtfully. "Dr. Crane is not romantic. Dr. Crane is precise. Everything she does is precise. Even tonight. Even when she came back downstairs at eight-oh-three." A pause. "Precision under pressure. That is not romance. That is a plan."',
        approach:   '"You are telling me I romanticise." She says it with good humour. "That is correct. I do. But I also notice things that are not romantic and tonight there were several." She leans forward. "The Steward at seven fifty-eight. A figure in the east corridor at seven-oh-eight. Those are not romantic. Those are operational. I know the difference now even if I didn\'t at seven forty-five."',
        record:     '"The document." She looks at it. "A document is not romantic or unromantic. It is a record." She smooths her apron. "What I saw tonight had both romantic and non-romantic elements. The Baron is romantic. The Steward is not. The figure at seven-oh-eight with the wrong mask is absolutely not." A pause. "The wrong mask is the non-romantic detail that changes all the romantic details."',
        pressure:   '"Some things have romantic explanations." She says it calmly under pressure. "Some things don\'t." A pause. "What I saw at seven forty-nine does not have a romantic explanation." She looks at you directly. "I have been trying to give it one since it happened. It doesn\'t fit."',
      },
      'Q7': {
        composed:   '"I shouldn\'t say this but Dr. Crane went upstairs twice tonight." She says it with complete authority. "The first time before the Rite. The second time after eight-oh-one." Another pause. "The second time she came back with a face like someone who has seen something they cannot unsee." Another pause. "She is always very careful with her case. Always. Tonight her hands were not careful with it."',
        wait:       '"Dr. Crane." She fills it. "She arrived with her case fully packed." A pause. "I know because I saw the case in her room just before seven when I delivered the linens. Already packed. Before the call." She smooths her apron. "A physician who packs before being called knows she is going to be called."',
        approach:   '"You want to know what I think about Dr. Crane." She says it. "I think she knew more about tonight than she admitted. I think she packed her case before she was called. I think she went upstairs at seven-oh-five for a reason that was not her case." A pause. "I also think there are parts of her evening she has decided not to explain, and that is making it difficult for me to be fully objective about her." She smooths her apron. "I am telling you that so you can account for it."',
        record:     '"Dr. Crane." She looks at the document. "Whatever that says — what I know about Dr. Crane is that she has been in this building before tonight. Not as a physician. As someone who knows the building." A pause. "She moved through the east corridor at seven-oh-five without looking at doors or turning at junctions. She knew exactly where she was going." She smooths her apron. "Four years I have watched people learn this building. Dr. Crane already knew it."',
        pressure:   '"Dr. Crane." She says it steadily under pressure. "She is involved. That is not a romantic interpretation — that is an observation." A pause. "She packed before being called. She went upstairs twice. She came back with a face that was wrong." She looks at you. "Three observations. Pressure doesn\'t change observations."',
      },
      'Q8': {
        composed:   '"First time at seven-oh-five. She had her case." She nods. "She came back without it. I noticed because she is always very careful with the case." A pause. "Then at eight-oh-one she went back up after the body was found. She came back — wrong. Her face was wrong. Her hands were not careful with the case." She looks at you. "Two trips. Three observations: she left the case, she came back changed, and she is not a woman who leaves things behind."',
        wait:       '"Two trips." She fills it. "Seven-oh-five with the case. Eight-oh-one without it." She counts on her fingers. "Between those two trips is fifty-six minutes. Fifty-six minutes is long enough for a body to stop being alive on a floor her case was sitting on." A pause. "She was the only one upstairs at seven-oh-five. She was the only one upstairs at eight-oh-one." She smooths her apron. "Whoever was upstairs at seven forty-five was not her."',
        approach:   '"You want to know if the two trips were significant." She says it. "Yes. The first trip is medical — pre-Rite, floor clear, case left behind. The second trip is after the body was found. That is the one that changed her face." A pause. "The case was upstairs the whole time. Between seven-oh-five and eight-oh-one. On the balcony. For nearly an hour." She looks at you. "That is a long time to leave a medical case unattended on a balcony."',
        record:     '"The case." She looks at whatever you are holding. "She carries it everywhere she goes in this building." A pause. "She left it upstairs at seven-oh-five. She left it there for nearly an hour." She smooths her apron. "A physician who leaves her case that long has stopped thinking of herself as a physician in the interval." She says it as observation, not judgment.',
        pressure:   '"Two trips." She says it steadily. "Seven-oh-five. Eight-oh-one." A pause. "I counted them because I count things. I count candleholders. I count linens. I count trips." She looks at you. "Two trips for a physician who carries her case everywhere is already significant. Pressure does not change what I counted."',
      },
      'Q9': {
        composed:   '"I shouldn\'t say this but Viscount Pemberton-Hale has been altering the Register for eight years." She says it as established fact. "He was at the lectern at seven-forty touching things he should not have been touching." She leans in. "And his gloves. He kept them on when he touched the candelabra base. You do not do that. You remove gloves to handle metalwork." A pause. "A man who keeps his gloves on when he touches something heavy and iron does not want to leave a mark on it."',
        wait:       '"The Viscount." She fills it. "He was at the Register at seven-forty and his posture was the removing posture, not the adding posture. I know the difference." She demonstrates. "Then at seven forty-two he went to the Curator and spoke very quietly and the Curator\'s expression did not change at all." A pause. "When someone delivers news and the listener\'s expression does not change it means the listener already knew the news." She smooths her apron. "The Curator already knew."',
        approach:   '"You want to know if the Viscount had motive." She says it with appreciation. "Eight years of Register alterations. Yes." A pause. "He was at the lectern at seven-forty with his gloves off, which is not something you do when you are adjusting a programme." She leans forward. "And then — the candle iron." She says it as if connecting two things that have been sitting beside each other all evening. "He wears gloves to Estate events. He has worn them for eight years. The candle iron near the body has no fingerprints. A man who always wears gloves handles things without leaving prints." A pause. "The hand is pointing at the Register. He altered the Register. The iron has no prints and he wore gloves." She smooths her apron. "Those are three observations." Another pause. "I do not know what they add up to. I know what they look like. What they look like and what they are have not always been the same thing in this building."',
        record:     '"The Register." She looks at whatever you are holding. "He has been in it. For eight years. Tonight at seven-forty he went back to it with the removing posture and then he went to the Curator with the expression of a man confirming something has been handled." She smooths her apron. "What was removed and whether it was the right thing are two different questions."',
        pressure:   '"The Viscount." She says it calmly. "Eight years of alterations. Very careful ones. Individually defensible." A pause. "Tonight at seven-forty he was at the Register with his gloves off. Then at seven forty-two he was at the Curator with the expression of a man who has just confirmed something." She looks at you. "A man who keeps his gloves on to handle something heavy and iron has finished something that required no prints." She smooths her apron. "That is the observation. Ask the Curator what was confirmed."',
      },
      'Q10': {
        composed:   '"I shouldn\'t say this —" She stops. A different pause. Shorter. "Cavalier Northcott is very sweet." She says sweet carefully. "He was lost his first week and I showed him where he needed to be." She smooths her apron. "He was distracted tonight. He keeps a very careful record but tonight he was distracted." She looks at you. "The seven-oh-three entry is probably accurate. He was distracted after that."',
        wait:       '"Northcott." She fills it. "He found me at seven fifty-five. He had something he needed to say." A pause. "He said: I saw someone. Seven-oh-eight. East corridor." She looks at you. "He said it like a confession. Like something that had been sitting in him since seven-oh-eight and had become too heavy to carry." Another pause. "Then the Steward came past and Northcott stopped saying it." She smooths her apron. "The Steward has that effect."',
        approach:   '"You want to know about Northcott and me." She says it without embarrassment. "Yes. Three weeks. He is twenty-seven and very earnest and very grateful." A pause. "He told me about the seven-oh-eight sighting because he trusts me. He found me at seven fifty-five because I was the person he wanted to tell." She smooths her apron. "And then the Steward arrived and he stopped." She looks at you. "The important question is what he saw at seven-oh-eight."',
        record:     '"Northcott keeps the most accurate record in this building." She says it. "Every arrival, every departure, every time stamp." A pause. "He was distracted from approximately seven-oh-five onwards. Whatever Lord Ashworth said to him — Northcott was not fully present in his record after that conversation." She smooths her apron. "The seven-oh-three entry was before the conversation. That one is accurate."',
        pressure:   '"Northcott." She says it clearly under pressure. "He saw someone in the east corridor at seven-oh-eight. He told me at seven fifty-five. He stopped when the Steward arrived." A pause. "What he saw was a figure with the wrong mask coming from the direction of the study." She looks at you. "I know because I was also in the east corridor at seven-oh-eight. I saw it too." She smooths her apron. "Pressure brought that out faster than order would have. You\'re welcome."',
      },
      'Q11': {
        composed:   '"He keeps looking for me." She says it without vanity. Pure observation. "All evening. Every time I passed the foyer he looked up." A pause. "He found me at seven fifty-five. He said: I saw someone. Seven-oh-eight. East corridor. He said it quickly, like something that had been waiting." Another pause. "Then the Steward came past and Northcott stopped."',
        wait:       '"He was looking for me all evening." She fills it. "At seven-ten, at seven twenty-five, at seven forty. Each time I passed the foyer he looked up with that expression." A pause. "Not watching for me. Needing to tell something to someone he trusts." She smooths her apron. "Seven fifty-five he found the moment. Then the Steward took the moment away."',
        approach:   '"He was distracted." She says it. "You can see it in how he held the notebook at seven-forty — slightly wrong. The notebook grip was slightly wrong." A pause. "He found me at seven fifty-five. He said seven-oh-eight east corridor. He was beginning to tell me what he saw." She looks at you. "The Steward arrived before he finished. But I know what he was going to say." She smooths her apron. "I was there."',
        record:     '"Seven-oh-eight." She says it. "He said it to me at seven fifty-five with the urgency of a man who had been holding a time stamp since he first saw it." A pause. "Seven-oh-eight. East corridor. Someone." She looks at whatever you are holding. "Whatever that shows you — Northcott saw something at seven-oh-eight in the east corridor that he spent the rest of the evening deciding what to do with." She smooths her apron. "He decided to tell me. The Steward decided that conversation should end."',
        pressure:   '"He told me at seven fifty-five." She says it clearly. "Seven-oh-eight. East corridor. Someone coming from the direction of the study with the wrong mask." She looks at you. "I know what he saw because I saw it too. A figure. Plain mask. Wrong one." A pause. "Northcott saw the face. I saw the mask." She smooths her apron. "Between us we have both."',
      },
      'Q12': {
        composed:   '"He didn\'t say." She looks at you. "But I know what was in the east corridor at seven-oh-eight." A pause. "I was there."',
        wait:       '"He didn\'t finish saying it." She fills the beat. "The Steward arrived and Northcott stopped mid-sentence." A pause. "The sentence was: I saw someone. Seven-oh-eight. East corridor. Coming from —" She looks at you. "Coming from. That is where he stopped." She smooths her apron. "I know what the rest of that sentence is. I was there."',
        approach:   '"You already know what was in the east corridor." She says it with interest. "Then you know why I\'ve been waiting for someone to ask me about seven-oh-eight since eight-oh-one." She leans forward very slightly. "I was there. I saw it. And then the Baron\'s shoulders went past and I got distracted." A pause. "I have not forgiven myself for that sequence of events."',
        record:     '"Whatever that document says about seven-oh-eight —" She glances at it. "I was in the east corridor at seven-oh-eight." She says it plainly. "I saw what was there. And what was there had the wrong mask and was coming from the direction of the study moving with the speed of someone who had finished something." She smooths her apron. "I can describe it precisely."',
        pressure:   '"I was there." She says it directly under pressure. "Seven-oh-eight. East corridor. A figure with the plain mask. Coming from the direction of the study." A pause. "Moving fast. Thomas described it later when I told him. Thomas said: a man who has just done the final piece of something." She smooths her apron. "Thomas is usually right."',
      },
      'Q13': {
        composed:   '"I shouldn\'t say this but there was a figure in the east corridor at seven-oh-eight coming from the direction of the study." She says it with conviction. "Moving with purpose. And the mask —" she stops. "The mask was wrong. Too plain. Nothing on it. Not the usual masks I see at the Rites." A pause. "I noticed because of the Baron\'s shoulders and then I noticed the mask and then the Baron went past and I forgot." She looks at you. "I am telling you now." Another pause. "I could not tell you who was behind that mask. At that distance, with that mask, I could not tell you."',
        grants_node: 'vivienne_plain_mask_sighting',
        wait:       'She fills the beat with immediate precision. "A figure. Seven-oh-eight. East corridor. Coming from the study direction." She says it all in one breath. "Plain mask. No commission mark. Not anything I had seen at previous Rites." A pause. "Walking fast but not running. The walk of someone who has decided something and is now executing it." She smooths her apron. "And then the Baron went past and I lost the thread and did not recover it until now."',
        approach:   '"The figure." She says it. "With the wrong mask at seven-oh-eight. That is what you want." She nods. "The formal Estate masks are distinctive — silver backings, commission marks at the crown. I know them from previous Rites." A pause. "What I saw at seven-oh-eight was plain. Nothing on it." She looks at you. "You bring me the mask you found and I will tell you if it is the same plain mask I saw at seven-oh-eight."',
        record:     '"The mask." She looks at whatever you are holding. A different quality enters her expression. "Plain. No commission mark." She looks up. "That is the mask I saw at seven-oh-eight in the east corridor." A pause. "The figure was wearing that mask at seven-oh-eight coming from the study direction." She smooths her apron. "It was not the mask they had worn on arrival. Whoever they were, they changed it somewhere between arrival and seven-oh-eight."',
        pressure:   '"A figure. Seven-oh-eight. East corridor. Wrong mask. Coming from the study." She says it in a flat sequence under pressure. "Those are the facts. Pressure doesn\'t change facts." A pause. "What pressure changes is the order I give them to you in." She looks at you. "You have now received them in the wrong order. The right order starts at seven-oh-three and ends at seven forty-six." She smooths her apron. "Let me start at seven-oh-three."',
      },
      'Q14': {
        composed:   '"The Baron was coming the other way down the corridor." She says it with the patience of someone explaining something obvious. "He has very good posture. I noticed him and then I noticed the figure behind him and that is when I saw the plain mask." A pause. "The Baron did not see the figure. Or if he did he didn\'t show it. He was looking at the study door quite specifically. Like someone checking that a door is closed that they want to be closed."',
        wait:       '"The Baron." She fills it. "He came from the ballroom direction at seven-oh-seven. Moving toward the study. I noticed him first because of the posture." A pause. "Then I saw the figure coming the other way and that is when I saw the mask. Plain. Wrong." She smooths her apron. "The Baron and the figure passed each other in the east corridor at seven-oh-eight and neither of them showed they had seen the other." She looks at you. "Two people who pass each other without showing recognition in a narrow corridor either do not know each other or know each other too well."',
        approach:   '"You want to know if the Baron saw the figure." She says it. "I don\'t know. He may have. He did not show it." A pause. "What I know is the Baron was looking at the study door when he passed. Not at the figure." She looks at you. "A man who looks at a door instead of the person walking toward him in a corridor has made a decision about where to look." She smooths her apron. "That is a deliberate choice."',
        record:     '"The Baron." She glances at whatever you are holding. "He was in the east corridor at seven-oh-eight. Going toward the study from the ballroom direction." A pause. "The figure was coming from the study direction at the same time. They passed each other. The Baron looked at the study door. The figure looked straight ahead." She smooths her apron. "Two people moving through the same corridor at the same time in opposite directions and neither of them looked at the other. That is a rehearsed non-encounter."',
        pressure:   '"The Baron." She says it steadily. "He was there. Seven-oh-eight. Going toward the study." A pause. "The figure was coming the other way. They did not look at each other." She looks at you directly. "A rehearsed non-encounter in the east corridor at seven-oh-eight means they knew they would be in the same corridor at the same time." She smooths her apron. "That is planning."',
      },
      'Q15': {
        composed:   '"I shouldn\'t say this but the Steward unlocked the east service gate at seven forty-four." She says it precisely. "I know because I was coming from the linen cupboard. He had a key that is not his usual key and he opened the gate and stood there for approximately thirty seconds and then walked away." A pause. "Thomas saw this too. From the garden. Thomas noted it because the east service gate has been locked every evening for thirty years except twice. Tonight was the third time."',
        wait:       '"The Steward." She fills it immediately. "He unlocked the east service gate at seven forty-four with a key that was not his usual key." A pause. "Before that — at seven-forty — he was in the ballroom looking at the candelabra with the expression of someone who has been told to notice a specific object." She smooths her apron. "And before that at seven-fifteen I saw him read a letter in the gallery and put it in his breast pocket with the expression of a man accepting something irreversible." She looks at you. "Three observations of the Steward before seven forty-four. Each one worse than the last."',
        approach:   '"You want to know about the gate." She says it. "Seven forty-four. East service gate. Key that was not his key. Thirty seconds standing in it." A pause. "Thomas was in the garden. He saw the gate open from outside. He noted the time because in thirty years that gate has been opened three times including tonight." She looks at you. "Whatever the first two times were — tonight was the third time and it was not routine."',
        record:     '"The gate." She looks at whatever you have. "The Steward used a key that was not his usual key at seven forty-four to open the east service gate." A pause. "That key came from somewhere. He did not have it before tonight." She smooths her apron. "A key that is not your usual key means someone gave you a key for a specific purpose at a specific time." She looks at you. "Who gave the Steward a key tonight."',
        pressure:   '"The Steward at seven forty-four." She says it under pressure. "East service gate. Wrong key. Thirty seconds standing in it." A pause. "That gate connects to the south ballroom entry through a service corridor that bypasses every main position in this wing." She looks at you directly. "A person who knew this building could reach the ballroom unseen through it. I have been in this building four years. I know what that means."',
      },
      'Q16': {
        composed:   '"I shouldn\'t say this but Thomas won\'t tell me." She looks mildly affronted. "He said it was before my time and not his information to share." A pause. "Thomas has principles. I find it inconvenient." She smooths her apron. "What I can tell you is that the corridor beyond that gate bypasses every main corridor in this wing. A person who knew this building well would know that." She says it as a geographical observation. She does not connect it to anything.',
        wait:       '"Thomas won\'t tell me." She fills the beat with affront. "He has been here thirty years and he knows things from those thirty years that he considers not his to share." A pause. "What I can tell you from four years is that tonight the gate was open at seven forty-four and the corridor beyond it reaches the south ballroom entry without passing any main position." Another pause. "A person who knew this building would know that route existed."',
        approach:   '"You want to know what the gate connects to." She says it. "The south ballroom entry. Through a service corridor that bypasses every main position in this wing." A pause. "No Steward route. No foyer crossing. Nothing." She smooths her apron. "Thomas knew the significance before I finished describing it. He has been here thirty years. He knew exactly what that gate being open at seven forty-four meant." She looks at you. "He was very still when I described it."',
        record:     '"The corridor." She glances at whatever you are holding. "The east service gate opens onto a service corridor that reaches the south ballroom entry without crossing any main position." A pause. "At seven forty-four someone opened that gate from the inside and stood in it for thirty seconds." She smooths her apron. "A person standing in an open gate for thirty seconds is holding it open for someone." She looks at you. "Or confirming a passage is clear."',
        pressure:   '"The gate." She says it directly. "Service corridor. South ballroom entry. No main crossings." A pause. "At seven forty-four someone opened it. At approximately seven fifty the Steward came through the ballroom from that direction." She looks at you. "Those two facts describe a route someone used." She smooths her apron. "Pressure is making me give you the route before the reason. The reason requires order."',
      },
      'Q17': {
        composed:   '"Yes." She says it simply. "Every room. Including the terrace at seven forty-five." A pause. "I was collecting the outdoor candleholders. They wanted them moved inside before the assembly." She looks at you. "I was on the terrace for approximately seven minutes. Seven forty-three to seven fifty, roughly."',
        wait:       '"Seven forty-three." She fills it before it forms. "I went onto the terrace at seven forty-three to collect the candleholders. Twelve outside." A pause. "The first thing I noticed was the Baron at the window above me. Watching the terrace very specifically." She smooths her apron. "The second thing I noticed was that the balcony above was occupied. Two figures." A pause. "I didn\'t look directly. I was counting candleholders." She looks at you. "I should have looked directly."',
        approach:   '"Seven forty-three to seven fifty." She says it. "You want to know what I saw in those seven minutes." A pause. "The Baron at the window. The candleholders — twelve, I moved four before it happened. The impact from the balcony direction at seven forty-five." She looks at you. "And then someone came around the corner from the balcony stairs at seven forty-six moving very fast." She smooths her apron. "In order. That is what happened in order."',
        record:     '"The terrace." She looks at whatever you are holding. "I was there from seven forty-three to seven fifty. Whatever that document says about the terrace at that time — I was on it." A pause. "I can tell you the exact position of every candleholder when I arrived and the position of every candleholder when I left." She looks at you. "I can also tell you what I heard and what I saw in between."',
        pressure:   '"Seven forty-three to seven fifty." She says it under pressure. "I was on the terrace. I counted candleholders. I heard an impact from the balcony direction at seven forty-five." A pause. "Someone came around the balcony stairs corner at seven forty-six. Moving very fast. Not masked." She looks at you. "That is what happened. Pressure does not change what happened on the terrace between seven forty-three and seven fifty."',
        timeline_critical: true,
        return_echo: 'She has not moved from where you left her. "Seven forty-three to seven fifty." She says it as you enter. A pause. "On the terrace." She looks at the wall. "I have been thinking about those seven minutes."',
        grants_node: 'vivienne_on_terrace_745',
      },
      'Q18': {
        composed:   '"I shouldn\'t say this but I saw the Baron at the window above." She points upward. "Watching the terrace. Very purposeful." She nods. "And then —" She stops. Something changes in her register. Very slightly. "And then I heard something from the direction of the balcony." She looks at the wall. "Heavy. Like something landing." A pause. "I thought it was the candleholders. I thought she\'d dropped one." Another pause. "I should have looked up."',
        wait:       '"The Baron was at the window." She fills it. "Seven forty-four approximately. Watching the terrace." A pause. "His cigarette was unlit in his hand. He had lit it but forgotten to smoke it." She smooths her apron. "And then at seven forty-five I heard the impact from the balcony direction. Heavy. Specific." Another pause. "The kind of sound that has weight in it. Not glass. Not a candleholder." She looks at the wall. "I knew immediately it was not a candleholder but I told myself it was a candleholder." She is quiet. "That is what I did."',
        approach:   '"You want to know what I heard." She says it. "Seven forty-five. Impact from the balcony direction. Heavy. Specific." A pause. "The Baron was at the window above me. He did not look down when I looked up." She looks at you. "A man who does not look down when something heavy falls above him knows what fell and does not want to look." She smooths her apron. "I did not look up. He did not look down." Another pause. "We were both wrong."',
        record:     '"The impact." She looks at whatever you are holding. "Seven forty-five. From the balcony direction." A pause. "I was four candleholders into moving twelve. The sound stopped my count." She looks at you. "Then I continued counting." She says it with a quality that is not performing. "I continued counting the candleholders. That is what I did." She smooths her apron. "I should have looked up."',
        pressure:   '"Seven forty-five." She says it directly. "Impact from the balcony. Heavy. Not a candleholder but I told myself candleholder." A pause. "The Baron was at the window. He did not look down." She looks at you. "Two witnesses present at seven forty-five and neither of us looked up." She smooths her apron. "That is what pressure gets you. The honest version is the same."',
      },
      'Q19': {
        composed:   '"I was looking at the candleholders." She says it quietly. The performing energy has gone somewhere. "I was counting them. Twelve outside, four already moved." A pause. "And then someone came around the corner from the balcony stairs very quickly. Moving fast." She looks at you. "I saw them for approximately three seconds." A pause. "I told Thomas. That night. I told Thomas exactly what I saw."',
        timeline_critical: true,
        return_echo: 'She is looking at the wall. "Three seconds." She says it as you enter. A pause. "I saw them for three seconds." She doesn\'t say who.',
        wait:       '"Three seconds." She fills the silence with precision. "Someone came around the corner from the balcony stairs at seven forty-six. I counted three seconds because I counted everything that evening." A pause. "They were not masked. Moving fast. Coming from the balcony direction toward the terrace." She looks at the wall. "In three seconds I registered: not masked, fast, wrong direction for an assembly member." Another pause. "And then they were past the corner and gone and I had eight remaining candleholders to move."',
        approach:   '"You want to know what I saw in those three seconds." She says it. "Not masked. Moving fast. Coming from the balcony stairs direction." A pause. "I can describe the build, the movement, the direction of travel." She looks at you. "I have been describing it to myself since seven forty-six." She smooths her apron very carefully. "I told Thomas at eight-fifteen. I told him everything except the part I had decided was romantic." Another pause. "I will now tell you the part that was not romantic."',
        record:     '"Three seconds." She looks at whatever you are holding. "Someone came around the corner from the balcony stairs at seven forty-six. Not masked. Moving fast." A pause. "If that document shows you who was on the balcony at seven forty-five — then that person came around the corner at seven forty-six." She looks at you. "Three seconds. Enough to see. I saw." She smooths her apron. "I have been deciding what to do with what I saw since seven forty-six."',
        pressure:   '"Seven forty-six." She says it under pressure. "Someone came around the corner from the balcony stairs. Not masked. Moving fast toward the terrace." A pause. "Three seconds." She looks at you directly. "I know who it was." She smooths her apron. "Pressure is not how you get that information. That information requires that I trust you will use it correctly." A pause. "Ask me differently."',
      },
      'Q20': {
        composed:   'She is quiet for a moment. The first moment of quiet she has produced all evening. "I told him I had seen something I shouldn\'t have seen." A pause. "Those were my exact words. Something I shouldn\'t have seen." She looks at you. "He asked me what. I told him." Another pause. "He was very still when I told him. Thomas is always still but this was a different kind of still."',
        grants_node: 'vivienne_told_hatch',
        wait:       '"I went to Thomas at eight-fifteen." She fills it without the usual energy. "I walked across the terrace to the cottage and I knocked." A pause. "I told him I had seen something I shouldn\'t have seen. He asked me what. I told him." She looks at the wall. "He was very still. Then he said: which direction were they running. I said: toward the terrace." Another pause. "He was still for a long time after that. Then he said: I see." She smooths her apron. "Thomas says I see when he understands something he wishes he didn\'t understand."',
        approach:   '"You want to know what I told Thomas." She says it. The performing energy is somewhere else. "I told him I had seen something I shouldn\'t have seen. Those were my words." A pause. "He asked me what. I told him exactly." She looks at you. "He asked which direction they ran. I said toward the terrace." Another pause. "He said: I see." She smooths her apron. "He has been sitting with that since eight-fifteen."',
        record:     '"I told Thomas at eight-fifteen." She says it. She glances at whatever you are holding without her usual engagement. "I told him I had seen something I shouldn\'t have seen." A pause. "He asked me what. I told him." She looks at you. "He then asked: which direction. I said: toward the terrace." Another pause. "Thomas does not ask follow-up questions unless the follow-up changes something." She smooths her apron. "The direction changed something."',
        pressure:   '"I told Thomas." She says it directly. "I told him I had seen something I shouldn\'t have seen. He asked what. I told him." A pause. "He asked which direction. I said toward the terrace." She looks at you. "Pressure is not going to make me tell you more than I told Thomas. I told Thomas everything." Another pause. "I told Thomas the romantic version. And I told him the part that was not romantic." She smooths her apron. "The romantic part was wrong."',
      },
      'Q21': {
        composed:   'The performing energy returns. Not all the way — there\'s something underneath it now. "I told him I saw two people on the balcony and then one person running." She says it. "I thought it was — I thought it was romantic. Two people meeting secretly and then one of them leaving quickly because someone was coming." She looks at you. "That is what I thought." A pause. "That is what I told Thomas I thought."',
        grants_node: 'vivienne_false_romantic_reading',
        wait:       '"I told him two people and then one person running." She says it into the silence. "I said I thought it was romantic. A secret meeting. Someone coming." A pause. "Thomas listened to the whole romantic version." She looks at the wall. "Then he said: describe the person running. I described them." Another pause. "He was quiet for a very long time." She smooths her apron. "He said: that is not a romantic description."',
        approach:   '"You already know the romantic version is wrong." She says it. Not quite performing. "Two people at the railing and then one person running." A pause. "I told Thomas the romantic version because I needed it to be the romantic version for as long as it could be." She looks at you. "I have used up that version." She smooths her apron. "Ask me what it actually was."',
        record:     '"I told Thomas two people and then one running." She says it. She looks at whatever you are holding with something different — less performance. "Romantic version. Secret meeting. Someone coming. One person leaving quickly." She smooths her apron. "Thomas did not accept the romantic version. He asked me to describe the running person." She looks at you. "When I described the running person it stopped being romantic."',
        pressure:   '"I told Thomas the romantic version." She says it under pressure. "Two people. One running. Secret meeting." A pause. "Pressure is not going to make me say the non-romantic version faster. The non-romantic version requires that I have decided to say it." She looks at you. "I have been deciding since eight-fifteen." Another pause. "I have decided." She smooths her apron one final time. "Ask me what it actually was."',
      },
      'Q22': {
        composed:   'The longest pause of the evening. The performing energy goes entirely. Not gradually — completely. Like a door closing. She looks at you. Her hands are still on her apron. "No." She says it in a voice that sounds nothing like the woman who has been talking for the past hour. "It was not romantic." A pause. "One man pushed another man off that balcony." Present tense. Like it is still happening. "That is what I saw." A pause. "That is what I told Thomas."',
        grants_node: 'vivienne_push_witnessed',
        timeline_critical: true,
        return_echo: 'She has not moved. "One man pushed another man." She says it as you enter. Quietly. Present tense still. A pause. "I keep saying it that way." Another pause. "I can\'t say it any other way."',
        wait:       'The silence holds for a moment. Then she speaks into it without the performing voice at all. "One man pushed another man off the balcony railing at seven forty-five." She says it exactly. "That is what I saw." A pause. "I have been calling it romantic since seven forty-six because I don\'t know what else to do with it." She looks at you. "One man pushed another man." Present tense. "That is what I saw and that is what I told Thomas and that is what I will tell anyone who asks me directly."',
        approach:   '"You already know." She says it very quietly. "You have been taking me toward this since you arrived." A pause. "One man pushed another man off the balcony." She looks at you. "I saw it. I saw it for three seconds from the terrace." She smooths her apron. The smoothing has no energy in it now. "I told Thomas at eight-fifteen. I am telling you now." Another pause. "It was not romantic."',
        record:     'She looks at whatever you are holding. Then past it. "One man pushed another man off the balcony at seven forty-five." She says it. "That is what I saw." A pause. "Whatever that document shows you about that moment — I was on the terrace and I saw it." She smooths her apron. The gesture is automatic now. "It was not romantic. It was not an accident." Another pause. "One man pushed another man."',
        pressure:   'She looks at you for a moment. The pressure has not produced this — something else has. "One man pushed another man off that balcony." She says it in the plain voice. "That is what I saw at seven forty-five from the terrace." A pause. "I have been carrying it since seven forty-six and the weight of it is becoming a different thing than the weight I started with." She looks at the wall. "One man pushed another man." Present tense. "That is what I saw."',
      },
    },

    silence_fill: '"I shouldn\'t say this but the building has been wrong all evening." She looks at the wall. "The way a house feels when something has happened in it that it hasn\'t absorbed yet." A pause. "I notice these things. Four years of noticing." She smooths her apron. "The building has not finished deciding what it is carrying since eight-oh-one."',

    silence_tell: 'The silence goes long enough that she stops performing into it. Then: "I told Thomas at eight-fifteen." She says it quietly. "I walked to the cottage and I knocked and when he opened the door I told him plainly what I had seen." A pause. "He was very still. Then he said: which direction were they running. I said: toward the terrace." Another pause. "He was still for a long time after that. Then he said: I see." She looks at you. "Thomas says \'I see\' when he understands something he wishes he didn\'t understand."',

    approach_response: '"I shouldn\'t say this but you are telling me things I already know to see what I add." She nods. "That is a good method. I use it myself." She smooths her apron. "What you told me was mostly correct. The part that was not correct is about the Baron. The Baron is not the story." A pause. "The Baron is a distraction from the story. A very handsome distraction. But a distraction."',

    pressure_response: {
      indignation: null,
      management: 'She looks at you with interest. "You are trying to make me uncomfortable." A pause. "That is a reasonable thing to try." Another pause. "It won\'t work. I have been the only French woman in an English manor for four years. I am very comfortable being uncomfortable." She smooths her apron. "Ask me something. But ask it like you want an answer, not like you want me to feel accused. I don\'t feel accused. I feel curious."',
    },

    // ── TECHNIQUE AWARENESS ────────────────────────────────────
    // Vivienne has no composure. Technique changes what she talks about,
    // not whether she talks. The Account is the only technique that guides
    // her through the chronology. Everything else produces more of what
    // she was already saying.
    technique_awareness: {
      account:   '"You are letting me talk in order." She nods. "That is correct. I have been in every room tonight and if you let me go in order I will get to the important part." She smooths her apron. "Most people do not let me go in order. They jump to the thing they think is interesting and then they miss the thing that is actually interesting." A pause. "The terrace. That is the important part. I will get there."',
      pressure:  '"I shouldn\'t say this but pressure does not work on me." She says it with genuine warmth, as if sharing useful professional advice. "I will tell you everything I know regardless. The only question is what order we do it in." A pause. "If you pressure me I will tell you about the Baron\'s shoulders for quite a long time. If you let me talk I will get to the terrace." She smooths her apron. "Your choice."',
      wait:      'She fills the silence immediately. "I shouldn\'t say this but Dr. Crane went upstairs twice tonight." She begins. "The first time —" She is already going. The silence did not slow her at all. She has chosen her starting point. It is not the terrace.',
      record:    '"I shouldn\'t say this but I don\'t care about the document." She looks at whatever you have shown her with interest but not concern. "Documents tell you what people wrote down. I tell you what people did when they thought no one was watching." She hands it back, or doesn\'t take it. "Put it away. Ask me what I saw." A pause. "Actually don\'t ask. I\'ll tell you. I was in every room tonight."',
    },

    // ── TECHNIQUE MISDIRECTION RESPONSES ──────────────────────
    // When a non-Account technique is used, Vivienne redirects to
    // wrong-path content rather than the conviction chain.
    // The player who uses Pressure gets Baron. The player who Waits
    // gets Crane's arrangement with the building. The player who uses
    // The Record gets PH at the lectern. The player who uses
    // The Approach gets Northcott distracted by her.
    // Only The Account gets to Q17-Q22 naturally.
    technique_redirects: {
      pressure: [
        '"I shouldn\'t say this but the Baron was at the terrace window at exactly seven forty-five." She says it with great significance. "Watching. Very specifically watching. And his cigarette —" She leans in. "He lit a cigarette at seven forty-four and it went out on its own at seven forty-six because he forgot to smoke it. A man who forgets to smoke a cigarette he has just lit is a man who has seen something that has taken all of his attention." She nods. "Something on the terrace. Or above it."',
        '"I shouldn\'t say this but Viscount Pemberton-Hale had his hands in the Register at seven-forty and he had the specific posture of a man removing something rather than adding something." She demonstrates the posture briefly. "I know the difference. I have worked in houses with valuable documents for four years. There is a removing posture and an adding posture." A pause. "He was removing."',
      ],
      wait: [
        '"I shouldn\'t say this but Dr. Crane has been —" She stops. Reconsiders the word she was going to use. "In an arrangement with this building. For two years, I think. Possibly longer." She says arrangement the same way Crane says arrangement — precisely, doing a great deal of work. "She knew tonight was going to matter. She packed the bag before she was called because she knew." A pause. "That is not a professional physician preparing for an event. That is a woman who had decided in advance she needed to be in this building."',
        '"I shouldn\'t say this but the Steward has been covering corridors under instruction all evening." She begins. "Not his own instruction — someone else\'s. You can tell the difference. His own instruction has a different posture. Tonight he was following something written down." A pause. "Someone sent the Steward a letter. He followed it. I saw him read it at seven-fifteen in the gallery and put it in his breast pocket." She nods. "I notice letters. Letters are important in this house."',
      ],
      record: [
        '"I shouldn\'t say this but whatever that document says it is less interesting than what I saw at seven-forty." She waves at the document. "The Viscount. At the lectern. Very specific movements." She puts her hands together and demonstrates. "Not reading. Not placing. Removing and then replacing something in a different position. Like someone who has come back to a thing they started earlier and is now finishing it." A pause. "He came back to the lectern at seven-forty to finish something he started before the assembly."',
      ],
    },

    backstory_chain: {
      'hatch_hint': {
        label:            'Thomas said let you talk in order',
        unlock_condition: { requires_node: 'vivienne_hatch_cross_fired' },
        questions: {
          'VH1': {
            text:     '"Thomas said to let you talk in order."',
            type:     'narrative_statement',
            cost:     0,
            response_composed:   '"Thomas is very wise." She says it immediately. A pause. "In order means from the beginning. Not from the interesting part." She smooths her apron. "Most people come to me and skip to the thing they think is interesting. The Baron. The Steward. The mask." Another pause. "Thomas knows I don\'t work that way. The interesting part only makes sense if you have the beginning." She looks at you. "Start at Q1. I will get you to the terrace. I will get you to the three seconds." A pause. "But I have to get there in order."',
            response_strained:   '"Thomas." She says it. A pause. "He knows how I work." She smooths her apron. "In order. From the beginning." She looks at you. "The terrace is the important part. But you need everything before it first."',
            grants_node: 'vivienne_hatch_hint_received',
          },
        },
      },
      'A': {
        label:            'The Northcott arrangement',
        unlock_condition: { after: 'Q10' },
        questions: {
          'VA1': {
            text:     '"How long has the arrangement with Northcott been going."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"I shouldn\'t say this but three weeks." She smooths her apron with great attention. "He was lost. I helped him. He is twenty-seven and very earnest and he has been here six weeks and he finds the building confusing." A pause. "I find him straightforward. In this building that is very unusual."',
            unlocks: 'VA2',
          },
          'VA2': {
            text:     '"He\'s more serious about it than you are."',
            type:     'partial_claim',
            cost:     5,
            response_composed:   '"Yes." She says it without hesitation. "He is." A pause. "I am fond of him. He is not —" She stops. "He is not the person I would choose in a building without complications." She looks at the wall. "This building has complications." Another pause. "He doesn\'t fully see that yet. He will." She smooths her apron. "He is also very good at keeping records. Which I find professionally useful."',
            unlocks: 'VA3',
            grants_node: 'vivienne_northcott_serious',
          },
          'VA3': {
            text:     '"He told you about the east corridor sighting because of the arrangement."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"He told me because he trusts me." She says it plainly. "He found me at seven fifty-five because he needed to tell someone and I was the someone he trusts." A pause. "He said: I saw someone. Seven-oh-eight. East corridor. He said it like a confession." She looks at you. "And then the Steward came and he stopped." Another pause. "The Steward has that effect on people. He arrives and sentences don\'t get finished."',
            grants_node: 'vivienne_northcott_told_her',
          },
        },
      },
      'B': {
        label:            'The east corridor',
        unlock_condition: { after: 'Q13' },
        questions: {
          'VB1': {
            text:     '"Describe the mask precisely."',
            type:     'focused_follow_up',
            cost:     5,
            response_composed:   '"Plain." She says it immediately. "No threadwork. No impression. No commission mark." She looks at you. "Every member\'s mask has something on it. A mark. A detail. Something that identifies it." A pause. "This one had nothing. It was the mask of someone who did not want to be identified." She smooths her apron. "I noticed it because it was wrong for a Rite evening. Members bring their commission pieces to the Rite. A plain mask is not a commission piece. It came from somewhere else."',
            grants_node: 'vivienne_plain_mask_described',
            unlocks: 'VB2',
          },
          'VB2': {
            text:     '"Edmund."',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'A pause. She looks at you. "Lord Ashworth." She says it after the pause. "He spoke to me about masks once. He noticed things. He said: pay attention to the masks this year. A particular mask will matter. Remember it." She is quiet for a moment. "He said that six months ago." Another pause. "I thought he was making conversation. He was not making conversation." She looks at the wall. "Lord Ashworth was never making conversation."',
            grants_node: 'vivienne_ashworth_told_her_mask',
          },
        },
      },
      'C': {
        label:            'What she told Thomas',
        unlock_condition: { requires_node: 'vivienne_hatch_cross_fired' },
        questions: {
          'VC1': {
            text:     '"Tell me exactly what you told Thomas."',
            type:     'focused_follow_up',
            cost:     5,
            response_composed:   'The performing energy leaves. Not gradually. Completely. She looks at you. "I told him I had been on the terrace at seven forty-five." She says it in the plain voice. "I told him I heard an impact from the balcony direction. I told him I saw someone come around the corner from the balcony stairs at seven forty-six." A pause. "I told him the person was moving fast and was not masked." Another pause. "I told him I saw two people at the balcony railing and then one." She looks at her hands. "Those were my exact words to Thomas. Two people and then one."',
            unlocks: 'VC2',
            grants_node: 'vivienne_hatch_told_exactly',
          },
          'VC2': {
            text:     '"Two people and then one."',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'The longest pause of the evening. She looks at you. Her hands are still on her apron. She is not smoothing it. "Yes." She says it in the voice that sounds nothing like the Vivienne who has been talking for an hour. "Two people at the railing." A pause. "And then one man pushed another man off that balcony." Present tense. Completely flat. No performance anywhere in it. "That is what I saw." She looks at you. "I have been saying it was romantic because I don\'t know what else to do with it." Another pause. "But that is what I saw."',
            grants_node: 'vivienne_push_witnessed',
            timeline_critical: true,
          },
        },
      },
    },

    backstory_extra: {
      'telescope': {
        label:            'The telescope on the terrace',
        unlock_condition: {
          // Shows BEFORE player has used the telescope — advertisement
          // Disappears once telescope_duel_played is set
          requires_flag_absent: 'telescope_duel_played',
        },
        questions: {
          'VT1': {
            text:     '"The brass telescope on the terrace."',
            type:     'narrative_statement',
            cost:     0,
            response_composed: '"That telescope." She says it with a slightly different register — not the investigation voice. "I borrowed it from Thomas." A pause. "If you have not been out to the terrace yet — go." She looks at you. "I am usually there." Another pause. "I have been learning the constellations. I know eleven now." She smooths her apron. "I could teach you. If you wanted." She says it as if it is not a significant offer. "It is easier than it looks. And the sky over this estate is very good."',
            response_strained:  '"That telescope." A pause. "I am usually on the terrace. If you have not been out there — go."',
            grants_node: 'vivienne_telescope_mentioned',
          },
          'VT2': {
            text:     '"You know the constellations."',
            type:     'focused_follow_up',
            cost:     0,
            unlock_condition: { requires_node: 'vivienne_telescope_mentioned', requires_flag: 'telescope_duel_played' },
            response_composed: '"Some of them." She considers this. "Cassiopeia. The Plough. Cygnus." A pause. "The sky here is almost the same as Paris. Almost." She looks at you. "Two point six degrees further north. You would not notice unless someone told you." Another pause. "I notice these things now." She smooths her apron. "I could not have told you what a constellation was four months ago. Now I can find eleven of them." She looks at you with something that is not quite pride and not quite challenge. "That surprises people."',
            response_strained:  '"Some of them." A pause. "The sky here is almost the same as Paris. Almost."',
            grants_node: 'vivienne_knows_constellations',
          },
          'VT3': {
            text:     '"You beat me at the telescope."',
            type:     'focused_follow_up',
            cost:     0,
            // Only shows if player lost to her in the minigame
            unlock_condition: {
              requires_node: 'vivienne_telescope_mentioned',
              requires_flag: 'telescope_player_lost',
            },
            response_composed: '"Yes." She says it simply. A pause. "I did." She does not smooth her apron. She looks at you directly. "You owe me something." She lets it sit. "I have not decided what yet." Another pause. "I will decide after this is finished." She looks at the wall. "Some debts are better collected when the situation is less complicated."',
            grants_node: 'vivienne_debt_acknowledged',
          },
          'VT4': {
            text:     '"You said I still owe you one."',
            type:     'focused_follow_up',
            cost:     0,
            // Only shows if player beat her at Maître
            unlock_condition: {
              requires_node: 'vivienne_telescope_mentioned',
              requires_flag: 'telescope_maitre_win',
            },
            response_composed: '"I did say that." She is quiet for a moment — a different kind of quiet from the investigation quiet. "You beat me at Maître." A pause. "Nobody beats me at Maître." She looks at you. "The debt stands. You have not asked for anything yet." Another pause. "What you are doing right now —" she gestures at the room, the investigation, all of it, "— counts as something that matters." She smooths her apron. "Ask me something that matters. I will tell you."',
            grants_node: 'vivienne_maitre_debt_active',
          },
        },
      },
    },

    contamination: {
    'northcott': '"Northcott." She says the name differently from all the other names she has said this evening. A pause. "He left his post twice." She says it the way she says things when she is deciding how much to give. "Once at seven-fifteen. Once at seven fifty-five." She smooths her apron. "The second time he came to find me specifically." Another pause. "He said he needed to tell someone what he had seen. He chose me." She does not say whether that was coordination or trust. "I am the person he tells things to."',
      'hatch':     '"Thomas knows things he won\'t say." She says it without frustration. "He has been here thirty years and he keeps everything in his head and he releases it very slowly." A pause. "He was very still after I spoke to him tonight. That means he understood something." Another pause. "When Thomas understands something he needs time before he can say it. Go back to him."',
      'surgeon':   'She is quiet for a moment. "You have been in the physicians room." She says it carefully. A pause. "I noticed something about the figure in the east corridor at seven-oh-eight. Even moving fast with the wrong mask there was a warm quality in the posture." She smooths her apron. "I find that quality suspicious in a person. Real warmth doesn\'t travel that quickly."',
      'crane':     '"She went upstairs twice." She says it immediately. "I\'ve been counting. Seven-oh-five and eight-oh-one. And each time she came back different." A pause. "The second time she came back with her case and a face like a decision." She smooths her apron. "Whatever she decided — it cost her something."',
    },

    cognitive_load_response: '"Seven forty-five." While watching your pen. "On the terrace." A pause she didn\'t plan. "I heard the impact at seven forty-five." She stops. She has just confirmed the time without being asked for the time. She knows it. She looks at her hands.',

  },

  // ── THOMAS HATCH ───────────────────────────────────────────
  // Optimal technique: The Wait. He fills silence eventually, completely, accurately.
  // No composure decay. He doesn\'t rattle. He simply stops answering and waits
  // for a better question.
  // Third person fires once — the mask admission. Never again.
  // Branch B gated by vivienne_mask_story_heard.
  'hatch': {
    counter_strategy:  'precise',
    optimal_technique: 'wait',
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'He was expecting someone eventually. He has been waiting since eight-oh-one with the patience of a man who knows how to wait. He answers the question asked. Exactly that question. Nothing adjacent. Nothing implied.',
      sentence_avg: 'short',
      formality:    'medium',
      tell:         'He answers only what is asked. If you ask the wrong question you get a true but useless answer. The player who learns to ask precisely gets everything.',
    },

    composure_variants: {
      'Q1': {
        composed:   '"The grounds. The gardens. The outbuildings." A pause. "Thirty years." He says it without elaboration. "I know this property."',
      },
      'Q2': {
        composed:   '"The east garden. Moving between the cottage and the terrace wall." A pause. "I check the garden lamps on a schedule. Seven forty-five is part of the schedule." Another pause. "I heard something at seven forty-five from the direction of the balcony."',
        timeline_critical: true,
        return_echo: 'He is at the cottage door. "Seven forty-five." He says it as you approach. A pause. "The schedule." He does not elaborate.',
        grants_node: 'hatch_on_schedule_745',
      },
      'Q3': {
        composed:   '"An impact." He says it without drama. "Heavy. From above. From the balcony level or close to it." A pause. "I\'ve heard that kind of sound before. Objects falling. It has a specific quality." Another pause. "I noted the time. Seven forty-five. I did not investigate immediately. I assumed it was the candleholders." A pause. "Vivienne was on the terrace at that hour. She was moving the candleholders inside. She saw more than I did."',
        timeline_critical: true,
        return_echo: 'He is looking at the garden. "The impact." He says it as you approach. A pause. "Seven forty-five." He does not look at you.',
        grants_node: 'hatch_heard_impact_745',
      },
      'Q4': {
        composed:   '"At seven forty-eight someone came to the cottage." He says it exactly. "From the direction of the terrace. Moving quickly. Without a mask." A pause. "At a formal Rite every member is masked. This person was not masked." He looks at the cottage door. "They knocked. I answered."',
        timeline_critical: true,
        grants_node: 'hatch_someone_came_748',
      },
      'Q5': {
        composed:   '"A member of the assembly." He says it with the precision of a man who has chosen his words carefully and means them exactly. "I did not ask for identification. Thirty years of this house — I know the faces." A pause. "I knew the face." He does not say whose face.',
      },
      'Q6': {
        composed:   '"A mask." He says it simply. "They needed a spare mask." A pause. "I keep miscellaneous items in the cottage stores. Members occasionally require things at inconvenient hours. In thirty years I have provided lamp oil, a spare key, a length of cord, writing paper." He looks at the cottage interior. "Tonight I provided a mask." A pause. "It is in my nature to provide what is asked without asking why it is needed. Thirty years of this house has made that a habit." Another pause. "I am reconsidering that habit."',
      },
      'Q7': {
        composed:   '"No." One word. Complete. He looks at the garden. A long pause. "I heard an impact at seven forty-five. I gave a mask at seven forty-eight. At eight-oh-one Lord Ashworth was dead." He says these three facts in order, plainly. "I have been putting those three facts in that order since eight-oh-one." He looks at you. "I have not found an arrangement of them that does not mean what I think it means."',
        grants_node: 'hatch_three_facts_connected',
      },
      'Q8': {
        composed:   '"Yes." He says it immediately. "She told me at approximately eight-fifteen." A pause. "She told me plainly what she had seen on the terrace." He looks at the cottage door. "When she finished I was quiet for some time." Another pause. "She asked me if I understood. I said yes. She asked me what we should do. I said I needed to think." A pause. "I have been thinking since eight-fifteen."',
        grants_node: 'vivienne_hatch_cross_fired',
        cross_links: [{ char: 'vivienne', branch: 'hatch_hint' }],
      },
      'Q9': {
        composed:   'The longest pause of all. "A man came to the cottage door at seven forty-eight." He says it. Precisely. "He was without a mask and he needed one. Thomas Hatch had a spare in the cottage stores." A pause. "Thomas Hatch gave it to him." Another pause. "Thomas Hatch did not ask why he needed it." He looks at you. "Thomas Hatch has been asking himself why he did not ask since eight-oh-one."',
        grants_node: 'hatch_mask_admission',
        timeline_critical: true,
        return_echo: 'He has not moved. "Thomas Hatch did not ask." He says it as you approach. A pause. He is looking at the cottage door. He says it like someone reading a sentence that has been written on the door since eight-oh-one.',
      },
      'Q10': {
        composed:   'He is completely still. "Yes." One word. Then nothing for a long time. "A man came to this door." He says it finally. "He had been on that balcony. He had done what he came to do. He needed something to walk back into that assembly and I gave it to him." He looks at the garden. "In thirty years I have been useful to this house. Tonight I was useful to the wrong person." A pause. "I don\'t know how to put those two things in the same room." He looks at you. "I\'m asking you to put them in the record accurately. Whatever the record says about tonight — what Thomas Hatch did should be in it correctly."',
        grants_node: 'hatch_full_admission',
      },
    },

    silence_fill: 'He looks at the garden lamps. "Seven forty-five. Seven forty-eight. Eight-oh-one." He says the three times. A pause. "That is the sequence I keep returning to." He does not say anything else. He has said exactly what he means.',

    silence_tell: 'The silence goes long. He is comfortable in it. Then: "Vivienne told me at eight-fifteen." He says it. "She told me what she had seen. She told me plainly because plainly is how she tells things when they frighten her." A pause. "I understood what she was telling me." Another pause. "I then understood what I had done at seven forty-eight." He looks at the garden. "Those two understandings arrived at the same moment. I have been holding them both since eight-fifteen." He looks at you. "That is a long time to hold two things that should not be in the same room."',

    backstory_chain: {
      'A': {
        label:            'The estate gate',
        unlock_condition: { after: 'Q3' },
        questions: {
          'HA1': {
            text:     '"The east service gate. The Steward opened it at seven forty-four."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"Yes." He says it. "I saw the Steward at the east service gate at seven forty-four. He used a key that is not his standard key." A pause. "The gate has been locked every evening for thirty years. It has been opened three times." Another pause. "I know the dates of the other two times."',
            unlocks: 'HA2',
          },
          'HA2': {
            text:     '"What were the other two times."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"Eleven years ago. A member required a private exit after a difficult Rite." A pause. "That is standard Estate practice. Discretion." He looks at the gate. "The second time was six years ago. A delivery that the Curator did not want logged through the main entrance." Another pause. "Tonight was different from both of those times." He looks at you. "The Steward\'s face was different. Both other times the face was of a man doing a routine thing. Tonight the face was of a man doing something he had been told to do and did not fully understand why." He is quiet. "That is a different face."',
            grants_node: 'hatch_gate_third_time',
          },
        },
      },
      'B': {
        label:            'The name',
        unlock_condition: { requires_node: 'vivienne_plain_mask_described', after: 'Q9' },
        questions: {
          'HB1': {
            text:     '"Vivienne described the face she saw. Does it match the person who came to this door?"',
            type:     'partial_claim',
            cost:     5,
            response_composed:   'A pause of a different quality. "Vivienne told me what she saw on the terrace. She described the person who came around the balcony stairs." He looks at the cottage door. "The description matches the person I gave the mask to." A pause. "I have been sitting with that match since eight-fifteen." Another pause. "It is not for me to name the match. I do not know the man. I know the sequence — he came to my door at seven forty-eight, he asked for a spare mask, I gave it." He looks at you. "The person who can name him is Vivienne. She saw the face at a moment that matters. I saw it at a moment after."',
            unlocks: 'HB2',
            grants_node: 'hatch_confirms_mask_handoff',
          },
          'HB2': {
            text:     '"What belongs in the record?"',
            type:     'direct_confrontation',
            cost:     15,
            response_composed:   'The longest pause in the cottage. Longer than any pause he has produced. He looks at the garden. Then at the cottage door. Then at you. "Thomas Hatch gave a spare mask to a person at seven forty-eight on the night Lord Ashworth died." A pause. "The person wore the plain mask back to the assembly. The plain mask had no signature mark. That is why it was the spare." Another pause. "That is the complete account of what I gave and when and to what kind of mask." He looks at you. "The identity of the person belongs on a different line of the record. Not mine." A pause. "I am not refusing. I am being exact. I do not sign a name to something I cannot swear to under oath, and what I can swear to is the mask and the time. That is my part."',
            grants_node: 'hatch_gave_spare_mask_748',
          },
        },
      },
    },

    contamination: {
      'vivienne': '"She told me at eight-fifteen." He says it before you mention her. A pause. "She told me plainly." He looks at the garden. "Vivienne tells things plainly when they cost her something to tell." Another pause. "This cost her something."',
      'surgeon':  'He is still for a moment. "A person came to this door at seven forty-eight." He says it exactly that way. "Asked for a spare mask. I gave it." A pause. "Whether that person is the one you are asking about is a question Vivienne answers more cleanly than I do. I did not see the balcony. I saw the door." He looks at the cottage door. "The handoff is what I can swear to. The identity is for the witness who saw the act."',
      'pemberton-hale': '"The Viscount was at the lectern at seven forty." He says it. A plain fact. "I saw him from the garden door. He was handling something on the lectern surface." A pause. "At seven forty-four the east service gate opened. The corridor connects the lectern side of the ballroom to the terrace route." He looks at the garden. "I note times. I note positions. I do not draw conclusions. That is your function."',
      'baron': '"The Baron was at the smoking room window at seven forty-four." He says it exactly. "I saw him as I passed. He was watching the terrace." A pause. "He was still watching when I came back at seven forty-nine." He looks at the garden. "A man who watches a terrace for five minutes without moving is watching for something specific." Another pause. "I know what was happening on the terrace during those five minutes."',
      'steward': '"The Steward opened the east service gate at seven forty-four." He says it. "He stood in the opening for thirty seconds. The gate faces the terrace approach directly." A pause. "A person standing in that gate at seven forty-four would have a clear view of the balcony stairs." He looks at the garden. "The Steward then walked toward the south corridor. Seven fifty-eight he was in the south corridor. I saw him on my lamp schedule." Another pause. "That is the sequence I noted."',
      'ashworth': '"Lady Ashworth was in the garden at seven-forty." He says it. "Walking the path that runs below the balcony." A pause. "She stopped at the bench beneath the balcony level. Stood there approximately two minutes." He looks at the garden. "She knows this garden the way someone knows a space they have walked for forty years." Another pause. "Two minutes standing beneath the balcony at seven-forty. That is what I noted."',
      'northcott': '"Cavalier Northcott came to the cottage at seven thirty-five." He says it. "Before the impact. He asked whether Lord Ashworth had said anything to me about members and the household staff." A pause. "I said no." He looks at the cottage door. "He nodded. He was not composed when he arrived. He was composed when he left." Another pause. "The specific question he asked — not about the evening generally. About Lord Ashworth and the household staff specifically." He looks at the garden. "A man who asks that question at seven thirty-five and then is composed when he leaves has decided something. Ten minutes before the impact."',
    },

    cognitive_load_response: '"Seven forty-eight." While watching your hands. "The impact was at seven forty-five." A pause he didn\'t plan. "Three minutes." He stops. He has placed the impact and the arrival in sequence without being asked to. He knows what three minutes means. He looks at the garden.',

  },

    // ── DR. CRANE ──────────────────────────────────────────────
  'crane': {
    counter_strategy:  'fragment',
    optimal_technique: 'wait',
    composure_floor:   40,
    fracture_threshold: null,

    baseline: {
      text:         'She is in the same room as him. She has not looked at him since she came back downstairs. That is not accident — it is the particular precision of a woman who knows exactly where he is without looking. She has the manner of someone who has already decided everything and is now waiting to see what the investigation decides.',
      sentence_avg: 'medium',
      formality:    'high',
      tell:         'She touches the bag. Every time a difficult question arrives. The player who notices it on second read understands — the bag was on the balcony. The bag is the plan. Every time she touches it she is touching the evidence of what she designed.',
    },

    composure_variants: {
      'Q1': {
            composed:   '"I was called after the body was found. Eight-oh-one." She says it with clinical precision. "I maintain availability during Estate events — my bag is prepared as a matter of professional standard." || She touches the bag. Not nervously. The way you touch something you have touched many times before and know exactly what it contains. A prepared bag is either diligence or foreknowledge. The difference between those two readings is approximately six weeks.',
        controlled: '"Eight-oh-one." A pause. "I was called. I came." She looks at her hands. "Two minutes. Standard response time." Another pause. "My bag was prepared."',
        strained:   '"I was called at eight-oh-one." A pause. "I came immediately." She touches the bag. "I had my bag. I am always prepared." Another pause. "That is the arrangement."',
        snapback:   '"My arrival is documented. I came when I was called."',
        grants_node: 'crane_arrived_at_call',
        grants_node_secondary: 'crane_false_arrived_only_at_call',
      },
      'Q2': {
        composed:   '"Standard medical availability kit. Diagnostic instruments. Surgical materials. Documentation." She touches the bag. "Nothing unusual for an engagement of this kind."',
        controlled: '"Surgical materials, primarily. Diagnostic instruments." She touches the bag briefly. "I carry what a physician should carry when she knows the kind of evening it will be."',
        strained:   '"I carry what I need to carry." She touches the bag. "That is accurate."',
        snapback:   '"The bag contents are consistent with standard medical availability practice."',
      },
      'Q3': {
        composed:   '"I went upstairs at approximately seven-oh-five." A pause. "A brief visit before the Rite. He was well. I came back downstairs." She touches the bag. "I left my case up there. My mind was elsewhere."',
        controlled: '"I checked on him before the Rite. Yes." She looks at her hands. "He was well. I came back downstairs. I left my case."',
        strained:   '"I went upstairs at seven-oh-five." A pause. "Medical check. He was well." She touches the bag. "I left my case on the balcony." Another pause. "My mind was elsewhere."',
        snapback:   '"The pre-Rite visit was a standard medical check. Lord Ashworth was well at that time."',
        timeline_critical: true,
        return_echo: 'She is looking at the bag. "Seven-oh-five." She says it as you enter. A pause. "He was well at seven-oh-five." She touches the bag without looking at it.',
        grants_node: 'crane_first_visit_ashworth_alive',
      },
      'Q4': {
        composed:   '"I left my medical case on the balcony during the earlier visit." She says it steadily. "After the examination I went back to retrieve it." A pause. "That is the reason for the second trip upstairs." She does not say what else she found.',
        controlled: '"I went back for my case." A pause. "I had left it upstairs during the earlier visit." She touches the bag. "I retrieved it." Another pause. "That is the reason for the second trip."',
        strained:   '"I went back for my case." A pause. "The earlier visit. I left it there." She touches the bag. "I went back." Another pause. "I came back downstairs."',
        snapback:   '"I retrieved my medical case from the balcony. That is the documented reason for the second visit."',
        timeline_critical: true,
        return_echo: 'She has moved slightly closer to the door since you left. Not toward it — just closer. "The second visit." She says it as you enter. "Eight-oh-one." She touches the bag. She does not say what happened at eight-oh-one.',
        grants_node: 'crane_second_visit_balcony',
      },
      'Q5': {
        composed:   '"I found my medical case where I had left it." A pause. "I collected it and came back downstairs." She touches the bag. "That is what I found."',
        controlled: '"My case." A pause. "Where I left it." She touches the bag. "I collected it." Another pause. "I came back downstairs."',
        strained:   '"My case." A pause. "And something else." She touches the bag. "Something that was not there at seven-oh-five." Another pause. "I know because I would have seen it at seven-oh-five. The floor was clear."',
        snapback:   '"I found my medical case. That is the documented item retrieved."',
        grants_node: 'crane_found_mask_negative_observation',
      },
      'Q6': {
        composed:   '"I spoke with several members during the evening." She touches the bag briefly. "The Baron is a member I have spoken with at previous Estate events. The conversation was brief." A pause. "He asked about irreversibility. I did not answer."',
        controlled: '"I spoke with him briefly." A pause. "He asked something he did not finish asking." She looks at her hands. "I did not answer. I left."',
        strained:   '"The Baron." A pause. "Seven-fifteen. He asked about irreversibility." Another pause. "I did not answer. I left." She touches the bag. "I should have asked him why."',
        snapback:   '"The conversation with the Baron was brief and unremarkable."',
      },
      'Q7': {
        composed:   '"I examined Lord Ashworth at eight-oh-three." She says it with complete clinical precision. "I offered an observation about what I found. I did not name a cause of death." A pause. "There is a difference between those two things." She touches the bag. "I was precise about which one I offered."',
        controlled: '"I made a clinical observation." A pause. "I did not name a cause." She touches the bag. "There is a difference between those two things." Another pause. "I was precise about which one I offered."',
        strained:   '"I made a clinical observation." A pause. "I did not name it." She touches the bag. "That is accurate." Another pause. "Both things are accurate."',
        snapback:   '"My clinical observations at the scene were accurate and documented."',
        grants_node: 'crane_said_nothing_after_discovery',
      },
      'Q8': {
        composed:   '"I was present in the building before the Rite began." She says it before you ask. A pause. "That is not unusual for my engagement with Compact events of this formality." She touches the bag. "My presence before eight-oh-one is accounted for. I was in the Ballroom from approximately seven-thirty until I was called."',
        controlled: '"I was in the building." A pause. "Yes." She looks at her hands. "That is not unusual for my engagement here." Another pause. "Ballroom from seven-thirty. My arrival time is documented."',
        strained:   '"I was here before eight-oh-one." A pause. She touches the bag. "That is accurate." Another pause. "Ballroom. From seven-thirty. My presence before the Rite is accounted for."',
        snapback:   '"My pre-Rite presence in the Ballroom is consistent with my arrangement with the Compact."',
        grants_node: 'crane_in_ballroom_730',
      },
      'Q9': {
        composed:   '"I have known him through professional engagement for two years." She says it precisely. "The nature of that engagement is covered by professional obligations I am reconsidering the scope of." She touches the bag. A pause. "I will say this: I knew what kind of man he was before tonight. Not every detail. Not the part that is relevant to your investigation. But the outline."',
        controlled: '"Two years." A pause. "Professional engagement." She touches the bag. "I knew what he was. Not all of it." Another pause. "The part that matters to the investigation — I did not know that specifically."',
        strained:   '"Two years." A pause. She touches the bag. "I knew him." Another pause. "Not all of it." She looks at her hands. "Not the specific part."',
        snapback:   '"My professional engagement with the Compact physician spans two years."',
        grants_node: 'crane_knew_him_two_years',
      },
      'Q10': {
        composed:   '"He came to me." She says it. The first thing she has said that is not managing distance. A pause. "He described something he needed." She touches the bag. "He did not explain why he needed it. He gave me enough to understand the shape of what he was describing." Another pause. "I said yes." She looks at her hands. "That is the accurate account of what happened between us before tonight."',
        controlled: '"He told me something he needed." A pause. She touches the bag. "He did not say why. He gave me enough." Another pause. "I said yes." She looks at her hands. "That is what happened."',
        strained:   '"He told me what he needed." A pause. She touches the bag. "Not why. Enough." Another pause. "I said yes." She looks at her hands. "I said it before I finished understanding what yes meant."',
        snapback:   '"What passed between us before tonight is covered by professional obligations."',
        grants_node: 'crane_said_yes',
      },
      'Q11': {
        composed:   '"He did not tell me why Lord Ashworth needed to die." She says it with complete composure. "He told me Ashworth was dangerous to both of them. To what they were both part of." She touches the bag. "He gave me enough to infer the rest. I inferred it." A pause. "My name in the Register. The channel being exposed. The Rite reading." She looks at you. "I built the rest from what he gave me. He did not know how much I had built."',
        controlled: '"He told me Ashworth was dangerous." A pause. She touches the bag. "I inferred the rest." Another pause. "My name. The channel. The reading tonight." She looks at her hands. "I built what he did not tell me. He did not know I had built it."',
        strained:   '"He told me enough." A pause. She touches the bag. "I inferred the rest." Another pause. "He did not know what I inferred." She looks at her hands. "Neither of us had the full picture."',
        snapback:   '"What I understood from that conversation is not something I will discuss without the Curator present."',
        grants_node: 'crane_inferred_the_rest',
      },
      'Q12': {
        composed:   'She is completely still. The composure is intact. It will not leave. "I understood what was needed." She says it. "Someone with clinical knowledge of the building, the membership, the timing, the specific ritual position Lord Ashworth occupied every year for forty years —" She stops. "Someone with that knowledge could see the shape of what was possible." A pause. "I saw the shape." She looks at you. Complete composure. Complete decision. "I wrote it down because I did not think it would matter." Another pause. "Because I did not think he would use it." She touches the bag. "He used it."',
        controlled: '"I saw the shape of what was possible." A pause. She touches the bag. "I wrote it down." Another pause. "I did not think he would use it." She looks at her hands. "He used it."',
        strained:   '"I saw the shape." A pause. She touches the bag. "I wrote it down." Another pause. "I did not think — " She stops. "He used it." She looks at her hands.',
        snapback:   '"I will not say more than that without the Curator present."',
        grants_node: 'crane_saw_the_shape',
        timeline_critical: true,
        return_echo: 'She is touching the bag when you enter. She does not stop this time. "I wrote it down." She says it as you enter. A pause. "That is what I keep returning to." Another pause. "I wrote it down because I did not think it would matter. It mattered."',
      },
      'Q13': {
        // Redirect: PH and eight years of Register amendments
        unlock_condition: { composure_lte: 65, requires_node: 'crane_lie_caught_in_fracture_window' },
        composed:   '"The Register is the document that explains tonight." She says it carefully. She touches the bag. "Not because of what it records now. Because of what has been done to it over eight years." A pause. "The Viscount has been making amendments — careful, defensible, individually explicable amendments — for eight years." She looks at you. The composure holds. "Cumulatively they describe a pattern of institutional protection for a channel that ran through this building and that Lord Ashworth was about to name tonight." Another pause. "That investigation predates tonight by eight years. Tonight is its conclusion." She touches the bag again. "I am telling you this because it is accurate. I am also telling you it does not explain what happened on the balcony at seven forty-five. Those are two separate investigations." A pause. "But one of them is eight years old. The other is eight hours old. Start with the one that is eight years old."',
        controlled: '"Eight years of Register amendments." A pause. She touches the bag. "The Viscount. Careful. Defensible. Individually explicable." Another pause. "Cumulatively they describe a pattern. That predates tonight by eight years. Tonight is the conclusion of something." She looks at you. "That is where to look."',
        strained:   '"The Register." A pause. She touches the bag. "Eight years. The Viscount." Another pause. "Look at the amendments in sequence, not individually." She looks at her hands. "That is where this started."',
        fractured:  '"The Register." A beat. "Eight years." Another beat. "The Viscount." She touches the bag. "Look at the sequence." A pause. "That is where it started."',
        snapback:   '"The Register alterations contextualise tonight. That is what I can say."',
        grants_node: 'crane_redirect_ph',
      },
    },

    silence_fill: 'She looks at the bag for a long time. Then: "He told me what he needed." She says it quietly. "Not why. Enough." A pause. "I said yes." She touches the bag. "I said it before I finished understanding what yes meant."',

    silence_tell: 'The silence goes somewhere her composure has not been all evening. Then: "I knew the building." She says it finally. "The balcony. The timing. Ashworth position at the railing every year for forty years — he never varied it." She touches the bag. "I knew all of that before he asked." A pause. "He did not ask me to know it. I knew it." She looks at her hands. "That is the part I cannot explain away."',

    backstory_chain: {
      'A': {
        label:            'The two visits',
        unlock_condition: { composure_lte: 70 },
        questions: {
          'CA1': {
            text:     '"The floor was clear at seven-oh-five."',
            type:     'narrative_statement',
            cost:     8,
            response_composed:   '"Yes." She says it immediately. "The floor was clear at seven-oh-five." A pause. "I notice things on floors. Clinical habit." She touches the bag. "There was nothing on the balcony floor when I conducted the pre-Rite check." Another pause. "That is accurate."',
            response_strained:   '"Yes." A pause. She touches the bag. "Clear at seven-oh-five." Another pause. "I noticed." She looks at her hands. "I always notice."',
            unlocks: 'CA2',
            grants_node: 'crane_floor_clear_705',
          },
          'CA2': {
            text:     '"Not clear at eight-oh-one."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'A pause of a different quality. "No." She says it. The composure holds. "Not clear at eight-oh-one." She looks at you. "I know what that means. I knew in ten seconds." She touches the bag. "The interval between seven-oh-five and eight-oh-one is the investigation."',
            response_strained:   '"No." A pause. She touches the bag. "Not clear at eight-oh-one." She looks at her hands. "I knew in ten seconds." Another pause. "I understand what ten seconds means."',
            unlocks: 'CA3',
            timeline_critical: true,
            grants_node: 'crane_negative_observation_confirmed',
          },
          'CA3': {
            text:     '"You left it. You said nothing."',
            type:     'direct_confrontation',
            cost:     18,
            response_composed:   'The longest pause before CA3. Then: "I came back downstairs." She says it. Complete composure. "I did not touch the mask. I did not move my case. I left everything exactly as I found it and I came back downstairs." She looks at you. "I had two reasons for saying nothing. They arrived at the same moment. I have been trying to separate them since eight-oh-two." She touches the bag. "I have not been able to."',
            response_strained:   '"I came back downstairs." A pause. She touches the bag. "I left everything." Another pause. "Two reasons." She looks at her hands. "Both arrived at once. I cannot separate them."',
                grants_node: 'craneBalconyAdmission',
            cross_links: [{ char: 'surgeon', branch: 'C', cross_id: 'surgeon_crane' }],
          },
        },
      },
      'B': {
        label:            'The two reasons',
        unlock_condition: { requires_branch: 'A', composure_lte: 60 },
        questions: {
          'CB1': {
            text:     '"Protecting him was one reason."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   '"Yes." She says it without hesitation. "That was one reason." She touches the bag. A pause. "It was present at the moment of decision." She looks at you. "I will not pretend otherwise."',
            response_strained:   '"Yes." A pause. She touches the bag. "One reason." Another pause. "Present at the moment." She looks at her hands. "Yes."',
            unlocks: 'CB2',
          },
          'CB2': {
            text:     '"The candle iron story protecting you was the other."',
            type:     'partial_claim',
            cost:     12,
            response_composed:   '"Yes." She says it the same way. Complete composure. "The candle iron. The body. The position." She touches the bag. "I knew what the room would conclude if I said nothing." A pause. "The story the room was telling did not have my name in it." She looks at you. "That was the second reason. Both were present. Both were real. I cannot say which arrived first."',
            response_strained:   '"Yes." A pause. She touches the bag. "The room tells a story." Another pause. "My name was not in it." She looks at her hands. "That was the second reason."',
            unlocks: 'CB3',
            grants_node: 'crane_knew_candle_iron_story',
          },
          'CB3': {
            text:     '"Which came first. The plan or the yes."',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'The longest pause of the evening. She looks at her hands. Then at you. She does not touch the bag. "He said what he needed." She says it finally. "I understood what the need required." A pause. "And I said yes before I had finished understanding what yes meant." Another pause. "The plan and the yes arrived together. I cannot put one before the other." She looks at you. The composure is intact. Complete. It will not leave. "I built something I did not think he would use." A pause. "He used it without knowing how much I had built." Another pause. "Neither of us had the complete picture." She looks at her hands one last time. "You are the only person in this building who does."',
            response_strained:   '"I said yes." A pause. She does not touch the bag. "I built the plan." Another pause. "I did not think he would use it." She looks at her hands. "He used it." A pause. "Neither of us knew what the other had done with it." She looks at you. "That is the honest account."',
            grants_node: 'crane_two_reasons',
            closes_conversation: false,
          },
        },
      },
    },

    // ── SILENT MOMENT ─────────────────────────────────────────
    // Optional. Fires when player has pushed both Crane Q12 AND Surgeon Q11.
    // She looks at him once. He doesn't look back.
    // The player who sees it understands everything.
    silent_moment: {
      condition: { requires_nodes: ['crane_saw_the_shape', 'surgeon_gap_named_by_surgeon'] },
      type: 'ambient_beat',
      text: 'She looks at him. Across the twelve feet. Once. It is the first time she has looked at him since she came back downstairs. He is looking at the desk. He does not look back. Not because he does not know she is looking. Because he does. He looks at the desk. He looks at the window. He looks at you. He does not look at her. She looks away. Goes back to the bag. The twelve feet remains exactly twelve feet.',
    },

    contamination: {
      'baron': '"The Baron has been very careful tonight." She says it before you mention him. A pause. "He saw me leave the Smoking Room at seven-fifteen. He knows I came back downstairs without my case." Another pause. "He is deciding whether to tell you that."',
      'surgeon': 'She is very still. A pause that is not clinical. Not managed. "He came to me." She says it quietly. She touches the bag. The look lasts too long to be about the bag.',
      'vivienne': '"She was on the terrace." She says it immediately. A pause. "Seven forty-three to seven fifty." She touches the bag. "She saw more than she has said to most people." Another pause. "Find her. Ask her in order."',
    },

    cognitive_load_response: '"Seven-oh-five." While watching your hands. "The floor was clear at seven-oh-five." A pause she did not plan. She touches the bag. "At eight-oh-one it was not clear." She stops. She has just given you the timeline bracket without being asked. She touches the bag again. She knows what she has done.',

  },
  // ── THE BARON ──────────────────────────────────────────────
  'baron': {
    counter_strategy:  'fragment',
    optimal_technique: 'pressure',
    composure_floor:   20,
    fracture_threshold: 35,

    baseline: {
      text:         'His drink is untouched. He has picked it up four times and put it back down. He is deciding something.',
      sentence_avg: 'short',
      formality:    'low',
      tell:         'He has been watching the door. He glances toward it every few minutes. The door has no handle on this side. He has not explained why he keeps looking at it.',
    },

    composure_variants: {
      'Q1': {
        // "What can you tell me about tonight?" / the eight refusals
        grants_node: 'baron_false_timeline_smoking_room',
        timeline_critical: true,
        approach_response: 'Before Callum finishes the question. "I didn\'t need to." He sets the drink down. "That\'s the answer to the question you\'re building toward. Not wouldn\'t. Didn\'t need to. Those are different things."',
        composed:   'He picks up the drink. Sets it down without drinking. "Eight refusals. No hesitation." A pause. "I have had a method available for three years. I chose not to use it. The question you should be asking is why I stopped using it." He glances toward the back of the room. A door with no handle on this side. He has been glancing at it all evening. He doesn\'t explain why. Another pause — longer than the others. "Ashworth was going to read three entries tonight. My name. Amounts. Dates. The particular shape of a man who borrowed against the only currency he had left — which was his position in this building." He picks up the drink. Does not take it. "Six years of gambling debts I could not explain. Three years of an arrangement with the Compact that funded them. All of it in the Register. In front of every person in that room." He sets the drink down. "That is not a motive I invented for your benefit. That is a motive I have been living with."',
        controlled: 'He picks up the drink again. Sets it down. "I didn\'t need to." A pause. "Three years. I had the means. The method. I chose not to use it." A pause. "That\'s the answer."',
        strained:   '"Didn\'t need to." He picks the drink up and doesn\'t put it down yet. "Three years of information. I had leverage. I chose not to use it." A pause. "I don\'t kill people." He sets the drink down.',
        fractured:  '"Three years." A beat. "The questions changed." Another beat. "I stopped."',
        snapback:   '"I have said what I am able to say about tonight."',
      },
      'Q2': {
        // "What do you know about the Compact?" / leverage
        composed:   '"The Compact exists. Most senior members know that much. My knowledge of it extends somewhat beyond the standard Estate position." He picks up the drink. "I was transactional. Not ideological. I provided information. I received nothing material in return. Three years." He sets the drink down. "I stopped three months ago. The questions changed character."',
        controlled: '"Three years." A pause. "Transactional. I was honest about which one I was." Another pause. "The questions changed three months ago. More precise. More operational. I didn\'t like what they were asking for. I stopped."',
        strained:   '"Three years of information." A pause. "The questions changed three months ago. Too specific about timing. Too specific about access." Another pause. "I know now what three months ago means. I didn\'t know then."',
        fractured:  '"Three years." A beat. "The questions changed." Another beat. "I stopped. That\'s all of it."',
        snapback:   '"My arrangement with any third party is not a matter for this investigation. I have said what I am able to say."',
      },
      'Q3': {
        grants_node: 'baron_crane_visit_715',
        composed:   '"No." A pause. "I didn\'t need to." He looks at the ashtray. "Crane came to see me at seven-fifteen. She didn\'t say what she wanted. Sat for twelve minutes. Said she needed to think about something." He pauses. "I\'ve been thinking about that twelve minutes since."',
        controlled: '"No." A pause. "I didn\'t need to." He leaves it there. Doesn\'t explain the distinction.',
        strained:   '"No." He picks up the drink. Puts it down. "I had a method. I decided it wasn\'t necessary." A pause. "I decided to wait and see whether tonight resolved itself."',
        fractured:  '"No." A pause. "I had a method available. I chose not to use it." He picks up the drink. This time he takes it. "That is what I have been sitting with."',
        snapback:   '"There is nothing more I can usefully add at this time." He picks up the drink. Puts it down. Returns to his previous register.',
      },
      'Q4': {
        composed:   'He picks up the drink. Puts it down. "I don\'t name people." A pause. "But I\'ll tell you this — it\'s not the most interesting question."',
        controlled: '"The most interesting question is why tonight." He says it before you ask what he means.',
        strained:   '"The answer is in the building." He says it to the ashtray. "I have been in this room since eight-oh-one because I knew that going anywhere else would force me to say what I know." A pause. "I am not ready to say it yet."',
        fractured:  'He picks up the drink. Takes it. Sets it down empty. "I\'ve been sitting here since eight-oh-one deciding whether to say what I know." A pause. "I decided." He stands. "Find the man who left the study at seven-oh-five looking satisfied. Ask him what he was satisfied about." He does not say the name. He has said enough.',
        snapback:   '"I\'ve said what I know. The rest is for you to establish." He picks up the book. Returns to the window.',
      },
      'Q4b': {
        // "You saw someone at the base of the balcony stairs."
        timeline_critical: true,
        return_echo: 'He is at the window. "Seven-oh-five." He says it as you enter. A pause. "East service corridor." He picks up the drink. Puts it down.',
        composed:   'He picks up the drink. Puts it down. "The study window looks onto the east service corridor." He says it as a fact about architecture. "What specifically are you asking about?"',
        controlled: '"Seven-oh-five." A pause. He looks at the ashtray. "There was movement near the study." He picks up the drink. Puts it down. "I noted it."',
        strained:   '"Seven-oh-five." He says it to the ashtray. "Someone left the study." A pause. "East service corridor. Moving toward the balcony stairs. He looked satisfied — the particular satisfaction of a man who has completed something." He picks up the drink. Puts it down. "I noted it. I didn\'t do anything with it."',
        fractured:  '"Seven-oh-five." A beat. "The study." Another beat. "Satisfied." He picks up the drink. Takes it. "I should have said something."',
        grants_node: 'baron_705_observation',
        snapback:   '"What I observed is what I observed. I have noted it accurately."',
      },
      'Q5': {
        // "You were going to warn him tonight." / ashtray
        timeline_critical: true,
        return_echo: 'He is looking at the ashtray. "I considered it." He says it as you enter. A pause. "The calculation was wrong." He does not look at you.',
        composed:   '"I considered it." He looks at the ashtray. The cigarette has been unfinished for the entire evening. "Three months ago when I stopped answering their questions — they told me something was being arranged. A Rite evening. This building. They did not tell me what or when. They told me enough for me to understand the shape of it." A pause. "I was at the terrace window because the terrace window has a specific view of the balcony approach. I knew that because I had provided information about this building\'s sightlines. That is specific knowledge. I know exactly why that window matters." He picks up the drink. Sets it down. "Warning him would have required admitting I knew where to watch from and why. I was not prepared to explain that." A very long pause. "I made a calculation. The calculation was wrong." He looks at the ashtray. "I\'ve been sitting here since eight-oh-one calculating the cost of the wrong calculation."',
        controlled: '"I considered it." He looks at the ashtray. "The information I had would have required explaining how I had it." A pause. "I wasn\'t prepared to explain that." Another pause. "The calculation was wrong."',
        strained:   '"I thought about it." A pause. "I had information. Decided the explanation was too complicated." He looks at the cigarette. "Wrong decision." A pause. "I know."',
        fractured:  '"I considered it." A beat. "Too complicated." Another beat. "Wrong decision." He picks up the drink. Takes it.',
        snapback:   '"What I considered and what I decided are not matters for this conversation."',
      },
      'Q6': {
        composed:   'He picks up the drink. Puts it down. A longer pause. "I\'ve been useful to various arrangements over three years." He does not look at you. "Transactional. Information. Nothing operational." A pause. "Until three months ago the questions were informational. After that they were operational. I stopped answering. I received no follow-up."',
        controlled: '"Three years." A pause. "Transactional. I provided information. I asked for nothing in return." He looks at the ashtray. "Three months ago the questions changed character. I stopped. No response." Another pause. "The silence was its own answer."',
        strained:   '"Three years of information." A pause. "Three months ago it changed." He looks at the cigarette. "Too operational. I stopped." Another pause. "The silence meant they\'d found another source."',
        fractured:  '"Three years." A beat. "Then it changed." Another beat. "I stopped." A beat. "They didn\'t need me anymore."',
        snapback:   '"My arrangements with any third party are concluded. That is all I will say."',
      },
      'Q6b': {
        // "When did you stop."
        composed:   '"Three months ago." He picks up the drink. Does not drink. Sets it down. "The nature of the engagement changed." He does not say how. He picks up the cigarette. Puts it down unlit.',
        controlled: '"Three months ago." A pause. "The questions changed character." He looks at the ashtray. "When that happens, the appropriate response is to stop." Another pause. "I stopped."',
        strained:   '"Three months ago. They asked for the Steward\'s schedule." A pause. "Too specific." He picks up the drink. "I stopped. Nothing from them." Another pause. "They already had it."',
        fractured:  '"Three months ago." A beat. "The Steward\'s schedule." Another beat. "I stopped." A beat. "They already had it from somewhere."',
        snapback:   '"My decision to stop the arrangement was made for private reasons."',
      },
      'Q7': {
        // Redirect: Steward opened east service gate at 7:44
        unlock_condition: { composure_lte: 50, requires_node: 'baron_lie_caught_in_fracture_window' },
        composed:   '"The Steward." He picks up the cigarette. Does not light it. Sets it down. "He opened the east service gate at seven forty-four." He looks at the ashtray. "I saw him from this window. The east service gate opens onto the terrace approach directly." A pause. "He stood in the opening for approximately thirty seconds. He was not moving things through it. He was not performing a function that required the gate to be open." He picks up the drink. Sets it down. "A man who opens a gate and stands in it for thirty seconds is either waiting for something to pass through or making sure the path is clear." Another pause. "I have been looking at seven forty-four from this window since the call went up. I have not found an innocent explanation for what I saw." He looks at you. "The Steward has been in this house for fourteen years. He knows what the east service gate connects to. He knows where it leads. He opened it at seven forty-four and stood in it for thirty seconds." A long pause. "That is worth investigating."',
        controlled: '"The Steward opened the east service gate at seven forty-four." A pause. He looks at the ashtray. "I saw him from this window. He stood in the opening thirty seconds." Another pause. "A man stands in an open gate for a reason. That reason is worth knowing."',
        strained:   '"Seven forty-four." A pause. "The Steward. East service gate." He looks at the window. "Open. Thirty seconds. Standing." Another pause. "That connects directly to the terrace approach."',
        fractured:  '"Seven forty-four." A beat. "The Steward." Another beat. "East service gate." He picks up the drink. "Open. Thirty seconds." He drinks. Sets it down empty.',
        snapback:   '"What I observed from this window at seven forty-four is a matter of record."',
        grants_node: 'baron_redirect_steward',
      },

    },  // end composure_variants

    silence_fill: 'He picks up the drink. Puts it down. "I\'ve been in the Compact\'s arrangements for three years. I stopped three months ago." A pause. "Something changed in the questions they were asking. The precision of them." He doesn\'t explain further.',
    silence_tell: 'The longest pause of the evening. He picks up the drink. Actually takes it. Sets it down empty. "Someone was here before the Rite." He says it to the ashtray. "I noted the time. I noted what he was carrying." Another pause. "I have been trying to decide since eight-oh-one whether what I noted was enough to change what happened. It wasn\'t. But I noted it." He does not say who. He does not say what he was carrying. He picks up the cigarette and does not light it.',

    word_tell: null,

    backstory_chain: {
      'A': {
        label:            'Three years with the Compact',
        unlock_condition: { after: 'Q3' },
        questions: {
          'BAR_A1': {
            text:     '"You\'ve been inside the Compact\'s arrangements."',
            type:     'narrative_statement',
            cost:     4,
            response_composed:   '"Three years. I\'ve been useful to various arrangements." He doesn\'t elaborate.',
            response_strained:   '"Three years. I started because it was transactional. I continued because it wasn\'t anymore." A pause. "And I stopped because it was again."',
            unlocks: 'BAR_A2',
          },
          'BAR_A2': {
            text:     '"Something changed three months ago."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   '"The nature of the information they wanted changed." He looks at the ashtray.',
            response_strained:   '"They started asking about timing. Specific times. Specific rooms." A pause. "The questions had a different shape." He picks up the drink. "I stopped answering them."',
            response_fractured:  '"The questions changed." A beat. "Too specific about this building." He picks up the drink. Puts it down. "I stopped. I should have said something to someone." A pause. "I didn\'t."',
            grants_node: 'baron_compact_arrangement',
            cross_links: [{ char: 'steward', branch: 'A' }],
          },
          'BA3': {
            text:     '"What exactly did Ashworth say."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'He picks up the drink. Takes it. Sets it down empty. "He said: the investigator is already inside the arrangement. He will find it from the inside. That is the only position from which it can be found." A pause. "I didn\'t know what that meant at the time." He looks at Callum. "I know now."',
            grants_node: 'ashworth_positioned_investigator_inside',
          },
        },
      },
      'B': {
        label:            'Crane\'s visit',
        unlock_condition: { requires_char_branch: { char: 'steward', branch: 'A' } },
        questions: {
          'BAR_B1': {
            text:     '"She came to you for a reason."',
            type:     'partial_claim',
            cost:     6,
            response_composed:   '"She came to the Smoking Room at seven-fifteen. Sat. Left without explaining." He looks at the ashtray.',
            response_strained:   '"She needed to tell someone something. She decided I wasn\'t safe enough to tell." A pause. "She was probably right about that."',
            response_fractured:  '"She was flustered. Harriet Crane doesn\'t get flustered." He picks up the drink. Puts it down. "Whatever she\'d done, she hadn\'t decided whether to tell anyone yet. She came here to decide." A pause. "She left without deciding." He says it like he wishes she\'d stayed.',
            grants_node: 'crane_baron_relationship',
          },
          'BB2': {
            text:     '"Did she come back."',
            type:     'focused_follow_up',
            cost:     6,
            response_composed:   'No. "But the Steward passed through twenty minutes later." He had noted it at the time and done nothing with the noting. "He never takes that route through the Smoking Room. It takes him past the Physicians room. In fourteen years I have never seen him take it." A pause. "I noted it the way I note things. I don\'t always know what I\'m noting until later."',
            unlocks: 'BB3',
            grants_node: 'steward_route_past_physicians_room',
          },
          'BB3': {
            text:     '"What do you think the twelve minutes were."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He has been thinking about that since seven-fifteen. "She was deciding whether to tell me something." A pause. "She decided not to." He picks up the ashtray. Sets it down. "Whatever she was deciding about — the Steward\'s route tells me it involved the Physicians room. And the Physicians room is where she keeps her bag when she attends Estate functions." He is quiet for a moment. "She didn\'t come back. But she made her decision during those twelve minutes." Another pause. "I think she decided to proceed with whatever she had come to tell me she had already decided to proceed with."',
            grants_node: 'crane_decided_to_proceed_physicians_room',
          },
        },
      },
      'D': {
        label:            'The debt record',
        unlock_condition: { requires_item: 'debt-record' },
        questions: {
          'BD1': {
            text:     '"The debt record. It carries your name."',
            type:     'narrative_statement',
            cost:     8,
            response_composed:   '"Yes." He does not look at it. He has seen it before — not that specific document, but its contents. "Six years ago I contracted debts I could not acknowledge. A private creditor. A game I should not have attended, in a house I should not have been in. The amounts were not ruinous initially." He picks up the drink. Does not take it. "They became ruinous. That is the nature of that particular arithmetic." He sets the drink down. "I ran the first debt through the Compact\'s ledger as a consulting arrangement — a fiction both parties understood. The Compact recorded it. The Estate never saw it. That was the arrangement." A pause. "The second debt followed. Then the third. By the third I was not running money — I was providing information to clear each balance. Estate member schedules. Access patterns. The kind of information a man in my position accumulates without thinking." He looks at the ashtray. "I told myself it was harmless. Operational intelligence that would never be used for anything that touched this building." He is quiet. "Three months ago they asked for the Steward\'s schedule. I understood then that it had always been building toward this building."',
            response_strained:   '"Six years." He looks at the record without looking at it. "The first debt was gambling. The second was covering the first. The third was — the shape that forms when you have run out of legitimate options." A pause. "I gave the Compact information. Estate schedules. Access patterns. I told myself it was harmless." He looks at the ashtray. "Three months ago they asked for the Steward\'s schedule. I stopped. Too late."',
            response_fractured:  '"Six years." A beat. "Gambling." Another beat. "Then the Compact." He looks at the record. "I gave them information. Three years of it. I stopped three months ago." A pause. "Too late."',
            unlocks: 'BD2',
            grants_node: 'baron_debt_record_six_years',
            grants_node: 'baron_gambling_debts_exposed',
          },
          'BD2': {
            text:     '"Ashworth had the exact figure."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   '"He had everything." He says it without drama — the flatness of a man who has accepted something completely. "The amounts. The dates. The specific Compact ledger entries. He assembled it over eighteen months from the Estate\'s own financial correspondence." A pause. "Six weeks ago he sent me a letter. He was not threatening me. Lord Ashworth was not a man who threatened. He was informing me that the three entries would be read tonight at the Rite. He gave me six weeks." He picks up the drink. Takes it. Sets it down empty. "A man who gives you six weeks is not trying to destroy you. He is giving you time to make a decision." Another pause. "I did not make the decision he was hoping for. I watched the terrace window instead."',
            response_strained:   '"He had the figure. The dates." A pause. "He sent a letter six weeks ago. He wasn\'t threatening — informing. He gave me six weeks to decide something." He looks at the empty glass. "I decided nothing. I watched the window instead."',
            grants_node: 'baron_ashworth_knew_exact_debt',
          },
        },
      },

      'C': {
        label:            'The Register entries',
        unlock_condition: { requires_item: 'smoking-letters', after: 'Q6' },
        questions: {
          'BC1': {
            text:     '"Ashworth was going to read your entries tonight."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   'He picks up the drink. Does not put it down. "Three entries." He says it. Flat. "I know which three. I have known for six weeks." A pause. "First entry: six years ago. A debt of eleven thousand to a private creditor I could not acknowledge through Estate channels — a gambling debt contracted at a house I should not have been at. I ran it through the Compact\'s financial ledger as a consulting arrangement." He looks at the drink. "Second entry: four years ago. The same pattern. Different amount. The same ledger." Another pause. "Third entry: three years ago. When the amounts became large enough that I began providing information rather than simply routing money." He sets the drink down. "The Compact did not approach me. I approached them. That is the part of the record I find hardest to sit with." A pause. "In front of every senior member. The Register open. Binding record." He sets the drink down. "I have been in this building for fourteen years on the strength of a reputation I have been managing very carefully for six of them."',
            unlocks: 'BC2',
            grants_node: 'baron_knew_register_entries',
          },
          'BC2': {
            text:     '"You knew what would happen before it happened."',
            type:     'direct_confrontation',
            cost:     15,
            response_composed:   'The longest pause he has produced. He looks at the cigarette — the one that went out at seven forty-six because something above the terrace took his attention. "I knew what Lord Ashworth was going to read." He says it. "I knew what it would mean." He picks up the drink. Takes it. Sets it down empty. "I was at the window at seven forty-four. I watched the terrace for five minutes." Another pause. "At seven forty-nine I sat down and did not watch anymore." || He looks at the empty glass. Men drink when they are frightened. They also drink when they have finished deciding something. The glass does not say which.',
            grants_node: 'baron_watched_outcome',
          },
        },
      },
    },

    deception_responses: {
      'candle-iron': {
        response_composed:   'He looks at the candle iron. Not quickly — the attention of a man confirming something he has already thought about. "The lectern is positioned at the north end of the Ballroom. Ashworth stood at the railing above it during every opening ritual. Forty years. That position is not a secret — anyone who has attended a Rite knows it." He picks up the drink. Sets it down. "The person who used that iron as staging knew exactly where he would be standing. Knew exactly what the room would read when they found it." A pause. "Three years of providing information about this building. I knew every room. Every position. Every ritual placement." He looks at you. "You are placing that knowledge in the same sentence as that window at seven forty-four. You are correct to do so." Another pause. "I was watching. Not acting. Those are different things." He says the last sentence with the particular care of a man who needs it to be believed and is not certain it will be.',
        response_strained:   '"The lectern position." He looks at the candle iron. "I knew it. Three years of information — I knew every placement in that room." A pause. "I was at the window. I was watching." He looks at you. "I was not in the Ballroom."',
        is_effective: true,
        composure_effect: -25,
        grants_node: 'baron_candle_iron_knowledge',
      },
      'ashworths-sunday-letter': {
        response_composed:   'He looks at the letter. A long time. "He sent it six weeks ago." A pause. "He was giving me the chance to make a decision before the Rite forced one." He picks up the drink. Takes it. Sets it down empty. "I did not make the decision he was hoping for." Another pause. "I have been sitting with that since seven forty-nine." He looks at you. "Whatever arrangement you believe I made with the Compact — the letter you are holding is proof that I had six weeks to stop what happened tonight and I did not use them."',
        is_effective: true,
        composure_effect: -30,
        grants_node: 'baron_ashworth_warned_him',
      },
    },

    contamination: {
      'crane': '"She told you something." He says it. Not a question. "She looked like she would." He picks up the drink. Puts it down.',
    'surgeon': 'He picks up the drink. Sets it down. "That man was here before he said he was." A pause. "I noted the time. I noted the direction." Another pause. "I\'ve been in this room since eight-oh-one because I understood what it meant when I noted it and I understood that going anywhere else would have been the wrong choice." He does not look at you.',

      'smoking-letters-context': '"Three entries." He says it before you mention them. "I know which three." He picks up the drink. "I have known for six weeks which entries Ashworth was going to read aloud tonight." A pause. "I am aware of what it means that they were not read." He does not look at you. "I have been sitting with that since seven forty-nine."',
    },
    cognitive_load_response: '"Seven-oh-five." While watching your pen. "Someone left the study at seven-oh-five." A pause he didn\'t plan. "He had been in there since seven-oh-three." He stops. "I didn\'t write that down. I\'m telling you now."',

  },

  // ── THE CURATOR ────────────────────────────────────────────
  'curator': {
    counter_strategy:  'withhold',
    optimal_technique: 'approach',
    composure_floor:   40,
    fracture_threshold: 60,

    baseline: {
      text:         'He has been the Curator for twenty-three years. He checks what you can verify before deciding what to say.',
      sentence_avg: 'long',
      formality:    'high',
      tell:         'He looked at Archive Case 3 before answering Q3. He knows what\'s in it. He\'s deciding whether to tell you.',
    },

    composure_variants: {
      'Q1': {
        // "What happened tonight?"
        approach_response: '"The premise that I will state only what is verifiable is correct — I will correct one thing before you ask it. The arrangement for an investigator was made six weeks ago. That arrangement and tonight\'s event are related. The connection is not accidental."',
        composed:   '"Lord Ashworth was found dead at eight-oh-one. The Rite was suspended. An investigator was requested through a prior arrangement. The investigation has authorisation. The Estate is structurally intact." A pause. "Those are the institutional facts. They are accurate."',
        controlled: '"Lord Ashworth was found at eight-oh-one. I had arranged for an investigator to be available — that arrangement predates tonight by six weeks." A pause. "It would be accurate to ask why I made that arrangement. I would prefer you asked it directly."',
        strained:   '"I arranged for you to be here. Six weeks ago." A pause. "Lord Ashworth requested it. The channel was one I trust. When I made the arrangement I understood there was a possibility of a serious event tonight." A pause. "I thought it would be a scandal."',
        fractured:  '"I knew something was going to happen." A beat. "Not a death." Another beat. "I thought the alterations would surface. I thought the Rite would produce a confrontation." A beat. "I was wrong about which crisis I was managing for."',
        snapback:   '"The investigation has my full authorisation. That is the appropriate position."',
      },
      'Q2': {
        // "The Register alterations — did you know?"
        composed:   '"The Register has been my institutional responsibility for twenty-three years. Structural irregularities fall within my monitoring brief. I will say this: I monitor structural tension in the Estate\'s records. I do not always intervene. The decision not to intervene is itself a decision with consequences. I take responsibility for it."',
        controlled: '"I was aware of certain irregularities." A pause. "For some time. I made a considered decision that addressing them directly would cause more damage to the Estate than allowing the Rite to surface them naturally." A pause. "I believed that reasoning. I am less certain the outcome was acceptable."',
        strained:   '"Eight years." A pause. "I noticed the first amendment eight years ago. I watched it develop. Each individual change was defensible. In aggregate it was not." A pause. "I said nothing because I thought the Rite would do what I couldn\'t do without tearing the institution apart."',
        fractured:  '"Eight years." A beat. "I knew." Another beat. "I watched it happen because I thought the institution mattered more than the confrontation." A beat. "Lord Ashworth was going to force it. I let him."',
        snapback:   '"I take responsibility for the decision. That is the accurate accounting."',
      },
      'Q3': {
        // "Archive Case 3 — what's in it?"
        // Composed must include the Case 3 glance. Automatic. Twenty-three years.
        composed:   'He looks at Archive Case 3. The movement is not dramatic — it is a reflex, the check a man makes after twenty-three years before he decides how much to say. "Archive Case 3 contains supplementary correspondence from the Estate\'s nineteenth operating period. Its seal was intact as of my last audit." A pause. "The relevant question is whether the seal is intact at this moment."',
        controlled: 'He looks at Case 3. "The seal was broken. I noticed at approximately seven this evening." A pause. "I chose not to act on it immediately. I wanted to observe whether anyone returned to it. In thirty minutes, no one did." A pause. "That gap is the intelligence."',
        strained:   'He looks at Case 3 and doesn\'t look away from it. "The seal was broken before the Rite began. Before seven. Whatever was placed in it or removed happened before I noticed." A pause. "Miss Voss noticed before I did. I know that now."',
        fractured:  '"Case 3." A beat. "The seal was broken." Another beat. "Someone used it as a transfer point. Before the Rite." A beat. "A document went in."',
        snapback:   '"Miss Voss holds the delivery log. She is the appropriate authority."',
      },
      'Q4': {
        // "The unrecorded meeting — six weeks ago."
        composed:   '"Lord Ashworth requested a meeting outside the scheduled calendar. Six weeks ago. We met in the study. He told me he had been observing a pattern in the Estate\'s operations for eighteen months that had the texture of external management." A pause. "His word: texture. I found it precise. I told him what I had noticed independently. We agreed not to record the meeting. Recording it would have told whoever was watching that we had spoken."',
        controlled: '"He had noticed the same pattern I had. Separately." A pause. "Two people in the same institution seeing the same thing without coordination is either paranoia or evidence. We concluded it was the latter. He told me he intended to address it at the Rite. He asked me to arrange for someone outside the building to be present." A pause. "I did that."',
        strained:   '"I told him something was watching the Estate. I didn\'t have a name. I had a pattern." A pause. "He thanked me. He said he would be careful. He was not careful enough." A pause. "I warned him and it was not sufficient."',
        fractured:  '"I thought the crisis would be the alterations." A beat. "At seven forty-two I looked at the Register and I thought: tonight is the night this becomes visible." Another beat. "I didn\'t know it had already happened in a different room."',
        snapback:   '"I made the arrangements Lord Ashworth requested. That is the accurate accounting of my role."',
      },
      'Q7b': {
        // "Archive Case 3 — you saw who used it."
        composed:   'He looks at Archive Case 3 before answering. The movement is not dramatic — it is the reflex of twenty-three years. "I saw someone leave the study at seven-oh-five. Moving toward the Ballroom entrance. Not concealing. Not rushing." A pause. "The pace of someone who had completed something and was orienting to the next position." He looks at the case. "I looked at Archive Case 3 thirty minutes later. The seal was broken. I drew an inference." Another pause. "The Surgeon understood that Ashworth would use the Rite. He had been in this building from seven-oh-three. He had walked the balcony level. He knew the ritual. He acted before the Rite could begin." He is very still. "I made a calculation that the Rite would surface the correct answer. It was wrong in this instance. That is a distinction I will carry."',
        controlled: '"I saw someone leave the study at seven-oh-five." A pause. "I looked at Case 3 thirty minutes later. Broken seal." He looks at the archive. "I drew the inference. I decided the Rite would surface it." Another pause. "The Rite did not surface it in time. The calculation was wrong."',
        strained:   '"Seven-oh-five. Someone left the study." A pause. "I looked at Case 3. Broken." Another pause. "I thought the Rite would surface it. I was wrong about which crisis was running."',
        fractured:  '"Seven-oh-five." A beat. "Case 3 broken." Another beat. "I thought the Rite would find it." A beat. "It didn\'t find it in time."',
        snapback:   '"I made the assessment available to the Rite. The Rite was the appropriate mechanism."',
      },
      'Q8b': {
        // "What was Ashworth's plan for tonight."
        composed:   '"He intended to open the Register at the appropriate moment in the Rite and read three specific entries aloud. The entries document forty years of Compact-related arrangements conducted under a founding agreement the Estate officially ceased to acknowledge in 1983." He looks at the Register. "Lord Ashworth had assembled six years of documentation. Tonight was the moment when the Register would be open, all members present, and any reading formally binding." A pause. "Someone understood what that reading would produce. He had been in this building since seven-oh-three. He had solved the room before anyone arrived." He looks at Archive Case 3. "Whatever was placed in Case 3 two months ago was placed to prevent Lord Ashworth from reaching that moment." Another pause. "He reached it anyway. He used the three minutes he had."',
        controlled: '"He was going to read three entries aloud at the Register opening." A pause. "Six years of documentation. Binding in front of all members." He looks at Case 3. "Someone understood what the reading would produce and acted before the Rite reached that moment." Another pause. "Lord Ashworth used the time he had."',
        strained:   '"Three entries. He was going to read them aloud." A pause. "Six years of preparation. All members present. Binding." He looks at Case 3. "Someone understood what that reading would produce. He had been in this building since seven-oh-three. He had solved the room before anyone arrived." Another pause. "Lord Ashworth used what he had left."',
        fractured:  '"Three entries." A beat. "Read aloud. Binding." Another beat. "Someone acted to stop it." A beat. "Lord Ashworth used what he had."',
        snapback:   '"Lord Ashworth\'s intentions are a matter for the Rite record."',
      },
    },

    silence_fill: 'He straightens a file case that doesn\'t need straightening. "The Register was moved to the right lectern." He says it to the archive. "Lord Ashworth always placed it on the left. In eleven years he never varied that."',
    silence_tell: '"I arranged for the investigation." He says it to the archive. "The invitation. The specific name. I had Ashworth\'s agreement on the choice." A pause. "I knew something was watching the Estate for six weeks. I didn\'t know from where." Another pause. "I told Edmund to be careful. He thanked me and said he would be." He doesn\'t add anything else.',

    word_tell: null,

    scharff_corrections: {
      'curator_noticed_745': '"I noticed at seven forty-two, not seven forty-five."',
      'curator_arranged_investigation': 'A pause. "That is — more accurate than I expected you to be." He looks at Archive Case 3.',
    },

    backstory_chain: {
      'A': {
        label:            'Six weeks ago',
        unlock_condition: { after: 'Q3' },
        questions: {
          'CUR_A1': {
            text:     '"You warned him six weeks ago."',
            type:     'narrative_statement',
            cost:     4,
            response_composed:   '"I told him something was watching the Estate from outside. I didn\'t know what." He looks at Case 3. "He thanked me. He said he would be careful."',
            response_strained:   '"Six weeks ago. Yes." He looks at Case 3. "I had been feeling it for longer. A pattern in certain events."',
            response_fractured:  '"Six weeks ago I told Edmund Ashworth that something had been watching the Estate for several months. That I had felt it in the way certain information moved." A pause. "He listened. He said he understood." Another pause. "He chose to come anyway."',
            unlocks: 'CUR_A2',
          },
          'CUR_A2': {
            text:     '"You decided not to act on what you saw."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   '"The Estate sometimes requires a crisis to accept information it would otherwise refuse." He says it. Then sits with it.',
            response_strained:   '"I made a decision. It contributed to an outcome I did not intend." A very long pause. "That is as plainly as I can say it."',
            response_fractured:  '"I thought the Register alterations, exposed at the Rite, would force the reckoning the Estate needed." A pause. "I did not know Ashworth would die. I thought the crisis would be the alterations." Another pause. "I was catastrophically wrong about which crisis." He looks at Case 3. "Six weeks ago Edmund told me something else. He said there was a Compact-embedded physician who had been in place for four years and whose record was clean but whose pattern of access did not fit a physician." A pause. "He had a name. I did not act on the name." Another pause. "I should have acted on it."',
            grants_node: 'curator_ashworth_warning',
          },
          'BA1': {
            text:     '"What did you tell Pemberton-Hale at seven forty-two. Exactly."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'He looks at Archive Case 3 before answering. The check is automatic. "I told him the alterations were detectable." He says the word with the precision of someone who chose it carefully forty minutes before Callum arrived. "My word. I gave him that word specifically. And I gave him forty minutes."',
            unlocks: 'BA2',
            grants_node: 'curator_told_ph_detectable_at_742',
          },
          'BA2': {
            text:     '"Why tell him instead of acting yourself."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   '"Because Pemberton-Hale needed to understand his position before the Rite opened it for him." A pause. "If he understood the alterations were visible — if he had forty minutes in which to make a choice — then the choice he made would be evidentially legible in a way that an action on my part would not produce." He looks at Case 3 again. "He chose to leave the alterations. That choice is more useful than anything I could have done with forty minutes. A man who knows and does nothing is a different kind of witness than a man who was not told."',
            unlocks: 'BA3',
            grants_node: 'curator_ph_choice_designed_as_evidence',
          },
          'BA3': {
            text:     '"Did you know someone would die tonight."',
            type:     'focused_follow_up',
            cost:     15,
            response_composed:   'A very long pause. He does not look at Case 3. He looks at nothing in particular, which is unusual. "I knew the Register opening would produce a crisis." He says it without inflection. "I believed it would be institutional. The alterations exposed. The immunity clause debated. A serious evening that the Estate would survive as it has survived serious evenings before." Another pause. "I arranged for an investigator. I positioned Greaves. I did everything that a Curator does when he anticipates a serious evening." He is quiet. "I did not anticipate murder. I anticipated exposure." A pause. "Those are different crises." He looks at Case 3 finally. "I was managing for the wrong one."',
            grants_node: 'curator_managed_wrong_crisis',
            cross_links: [{ char: 'witness_map', branch: 'observation_3' }],
          },
        },
      },
      'B': {
        label:            'The Greaves note',
        unlock_condition: { requires_char_branch: { char: 'ashworth', branch: 'A' } },
        questions: {
          'CUR_B1': {
            text:     '"You sent the note to Greaves."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"Sir Greaves has been in the Library since seven o\'clock." He straightens something. "He will have been there the entire evening. Unimpeachable."',
            response_strained:   '"The Estate\'s verdict requires a witness who cannot be accused of involvement." A pause. "Ashworth suggested him. Three weeks ago."',
            response_fractured:  '"Ashworth suggested him three weeks ago. Before he died." A pause. "He had thought about all of it." He says it about Ashworth. Like it surprises him and doesn\'t.',
            grants_node: 'greaves_note_sender',
          },
          'BB2': {
            text:     '"Who suggested Greaves."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'He is quiet for a moment. "Lord Ashworth." He looks at Case 3. "Three weeks before his death. He said: find someone who cannot be accused of involvement and place them where they can observe without being observed." A pause. "The Curator who receives that instruction from the person being protected selects the most inconvenient candidate for that role." Another pause. "Greaves is a barrister. His testimony has a weight that most members\' would not. Ashworth understood that. I selected accordingly."',
            unlocks: 'BB3',
            grants_node: 'ashworth_designed_greaves_placement',
          },
          'BB3': {
            text:     '"Did Ashworth know he was going to die."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'He looks at Archive Case 3 for a long time. "He designed tonight as if he knew the investigation would need a witness who predated the event. That is a specific kind of preparation." A pause. "Lord Ashworth was a careful man. He was careful about things he understood to be risks." Another pause. "I think he understood." He does not elaborate. He closes the distance between what he thinks and what he knows and then declines to cross it. The Curator does not act on suspicion. Not even tonight.',
            grants_node: 'ashworth_anticipated_death',
          },
        },
      },
    },

    contamination: {
      'pemberton-hale': 'He is slightly more still. "Pemberton-Hale." He says the name. Looks at Archive Case 3.',
      'surgeon': 'A pause before his next answer that wasn\'t there before. "I saw someone leave the study at seven forty-two." He says it. "Walking in the direction of the Ballroom entrance." Another pause. "I drew an inference. I chose not to act on it immediately."',
    },

    cognitive_load_response: '"The alteration was on three entries." While watching your pen. "Not five. Three. The immunity clause is the most recent." A pause. "The immunity clause is the one you want. It was added eighteen months ago." He stops. He has just told you the specific entry without being asked.',

  },

  // ── THE UNINVITED ──────────────────────────────────────────
  'uninvited': {
    counter_strategy:  'redirect',
    optimal_technique: 'approach',
    composure_floor:   60,
    fracture_threshold: 65,

    baseline: {
      text:         'He noticed you before you fully entered the room. He was already looking when the door opened. He is always already looking.',
      sentence_avg: 'short',
      formality:    'medium',
      tell:         'He makes observations. He doesn\'t ask questions. The first time he asks you something instead of telling you something — that\'s the tell.',
    },

    // composure_variants for the Uninvited are not composure decay.
    // They are technique-awareness responses keyed to appearance location.
    // He never asks questions until Wine Cellar (tunnelFound === true).
    composure_variants: {
      _appearances: {

        physicians: {
          'Q1': {
            composed:   '"The dead hand is pointing at the Register." He says it before you ask anything. "He has been lying there since eight-oh-one and nobody has moved the hand." A pause. "The Register was altered. Eight years of careful amendments, the last one eighteen months ago." Another pause. "The man who altered it is in the Antechamber. He has been there since the body was found."',
            controlled: '"The dead hand points at the Register. The Register was altered." A pause. "The man who altered it is in the Antechamber." He leaves it there.',
            strained:   '"The hand. The Register. The iron. No prints." A pause. "The Antechamber."',
            fractured:  '"The hand. The Register. Altered. The Antechamber."',
            grants_node: 'uninvited_ph_scene_read',
          },
                    'Q2': {
            composed:   '"Three minutes." He says it. "Between seven forty-five and seven forty-eight. Three minutes during which the body was moved from the balcony floor to the lectern. The dead hand was placed. The candle iron was positioned." A pause. "Someone was in that room for three minutes arranging what you found. The Ballroom had ten masked figures standing in it during those three minutes." He looks at the room. "One of them was not there for all of them."',
            controlled: '"Three minutes. Seven forty-five to seven forty-eight." A pause. "Body moved. Hand placed. Iron positioned." A pause. "One of the ten was absent for part of it."',
            strained:   '"Three minutes. Someone in that room." A pause. "One of ten was gone for part of it."',
            fractured:  '"Three minutes. One of ten. Gone."',
            grants_node: 'uninvited_three_minutes_doubt',
          },
                    'Q3': {
            composed:   '"Lord Ashworth is pointing at the Register. His hand has not moved. Nobody has moved it." A pause. "The Register is on the wrong lectern. It has been moved tonight — wheel marks on the floor beneath it. Someone moved it and then moved it almost back." Another pause. "He spent his last three minutes positioning himself so that his hand would point at something specific. He chose that over everything else available to him."',
            controlled: '"His hand is pointing at the Register. The Register is on the wrong lectern." A pause. "He chose that. Deliberately."',
            strained:   '"The Register. Wrong lectern. His hand." A pause. "He chose it."',
            fractured:  '"The Register. His hand. He chose it."',
          },
        },

        library: {
          // Library: Uninvited appears immediately. Redirects toward Surgeon chain.
          'Q1': {
            composed:   '"The Register has been moved tonight. The wheel marks are still on the floor. Someone positioned it so that a dead man\'s hand would point at something specific." A pause. "That takes three minutes and a specific understanding of what the investigation would find. The Register is not where this started. It is where it was meant to end."',
            strained:   '"Moved. Wheel marks. Three minutes." A pause. "Not where it started."',
            fractured:  '"The Register. Moved. Three minutes. Not where it started."',
          },
          'Q2': {
            composed:   '"Every person in this building tonight has been somewhere specific at a specific time." A pause. "Some of those positions are accounted for. Some are not." Another pause. "The gaps are where the investigation lives."',
            strained:   '"Positions. Times. Gaps." A pause. "The gaps matter."',
            fractured:  '"The gaps."',
          },
          'Q3': {
            composed:   '"The groundskeeper has been on the estate for thirty years. He does not speak without considering what his words will produce." A pause. "If he has something to say tonight, he will say it when asked." Another pause. "He has not been asked yet."',
            controlled: '"Thirty years. He says nothing without considering it." A pause. "The silence is deliberate. The cottage."',
            strained:   '"Thirty years. Deliberate silence." A pause. "The cottage."',
            fractured:  '"The groundskeeper. The cottage. Before you leave."',
          },
        },

        vault: {
          'Q1': {
            composed:   '"You are close to a verdict." A pause. "The evidence you have assembled points in a direction." Another pause. "Follow it."',
            controlled: '"The evidence points somewhere." A pause. "The question is whether that was by design."',
            strained:   '"It points somewhere." A pause. "Was that designed."',
            fractured:  '"The direction. Was it designed."',
          },
          'Q2': {
            composed:   '"There are two documented preparations in this building tonight. One is in the Register — eighteen months of incremental alteration, visible, producing a clear chain." A pause. "One is not in the Register." Another pause. "One of them was designed to be found."',
            controlled: '"Two preparations. One visible. One not." A pause. "One was designed to be found." A pause. "Which one."',
            strained:   '"Two preparations. One for you to find." A pause. "Which one."',
            fractured:  '"Two preparations. One was meant for you. Which one."',
          },
          'Q3': {
            composed:   '"Whatever you have found tonight — you have found it because you were the right investigator for this specific building on this specific evening. The investigation brought you here. The evidence held long enough for you to find it." A pause. "I do not say that as a comfort. I say it because it is accurate."',
            controlled: '"You were selected for this specifically. The investigation. The evidence. The specific building." A pause. "You were the right fit for this room."',
            strained:   '"You were chosen. Specifically. For this."',
            fractured:  '"You were chosen for this."',
          },
        },

        wine_cellar: {
          // Only accessible when tunnelFound === true. Management has failed.
          'Q1': {
            composed:   '"You have found something I did not expect you to find." A pause — not managed, not performed. "I am not going to manage that. I am going to ask you something instead. I need you to understand that I am asking because the question has an answer I need. Not because I am managing the investigation." Another pause. "I am not managing it anymore."',
            controlled: '"I need to ask you something." A pause. "I am aware that is unusual." Another pause. "I am asking anyway."',
            strained:   '"I have a question." A pause. "That is the first question I have had all evening." A pause that costs him something. "I need the answer."',
          },
          // The question. The only undesigned thing he says. Must feel wrong.
          'Q2': {
            composed:   '"The tunnel." A pause. "Did you find it before you came here, or after? Because if you found it before — the timeline of what I believed I was managing has been wrong since before you arrived in this room. And if it was wrong then, the entire evening was different from what I believed it was." A pause. "I need to know which one it is."',
            controlled: '"Did you find the tunnel before or after you arrived here." A pause. "It matters which."',
            strained:   '"The tunnel." A pause. "Before or after." A pause that is not professional. "Which one."',
          },
        },

      },
    },

    technique_awareness: {
      account:   '"You\'re letting me talk." He says it pleasantly. "That\'s good methodology."',
      pressure:  '"That approach will work on eleven of the people in this building." He doesn\'t say which eleven.',
      approach:  '"You\'re telling me things to see what I correct." A pause. "I\'m going to correct two things. The third one I\'m going to leave."',
      record:    '"You\'re asking before you show." A pause. "That\'s either discipline or intuition." He doesn\'t say which he thinks it is.',
      wait:      'The longest pause of the evening. He looks at you. "You\'re waiting." He says it. Then waits.',
    },

    silence_fill: 'He looks at the room. "Everyone in this building had something to lose tonight." He says it to no one in particular. "The question is not who had reason. The question is who had both the reason and the method." A pause. "Those are different lists."',
    silence_tell: 'A very long silence. He is watching you. Then: "You have been thorough." Not an observation. An acknowledgement. He has stopped managing the sentence before it ends. That is the first time.',

    word_tell: null,

    backstory_chain: {
      'A': {
        label:            'The Wine Cellar tell',
        unlock_condition: { room: 'wine-cellar', tunnel_found: true },
        questions: {
          'UI_A1': {
            text:     '"You\'ve been managing this investigation."',
            type:     'narrative_statement',
            cost:     4,
            response_composed:   '"I\'ve been present at four points in this evening. I\'ve made three observations." He says this accurately.',
            response_strained:   '"I\'ve been ensuring the investigation reaches a productive conclusion." A pause. "That is a description of my role."',
            response_fractured:  '"I\'ve been keeping the investigation on a specific path." A pause. "You were never supposed to look at the Compact connection." He says it without heat. "The cellar was not in the plan."',
            unlocks: 'UI_A2',
          },
          'UI_A2': {
            text:     '"Who are you working for."',
            type:     'direct_confrontation',
            cost:     25,
            composure_required: 65,
            response_fractured: '"The next Rite is in the mountains." He says it. "I will be there." A pause. "You found the cellar. You found yourself." He looks at the door. "The mountains." He leaves.',
            triggers_fracture:  true,
            closes_conversation: true,
            grants_node: 'uninvited_coordination_surgeon',
          },
        },
      },
    },

    contamination: {},

    cognitive_load_response: '"Seven-oh-three." While watching your hands. "Someone arrived at seven-oh-three." A pause. "I was watching the garden at seven-oh-three." He stops. Looks at you. He has just told you something he didn\'t intend to tell you.',
  },

  // ── GREAVES ────────────────────────────────────────────────
  'greaves': {
    counter_strategy:  'cooperate',
    optimal_technique: 'account',
    composure_floor:   40,
    fracture_threshold: 65,

    baseline: {
      text:         'He gave his alibi before you asked. The alibi was the first sentence of their conversation. He has been holding it all evening.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'He gave his alibi before he was asked. Innocent people can do this. People who have been waiting all evening to give an alibi also do this.',
    },

    composure_variants: {
      'Q1': {
        // "What do you know about tonight?"
        composed:   '"I was in the Library from seven until the Gavel. I want to say that before anything else. The door was locked from the inside. I remained there until the proceedings concluded." A pause. "I am told Lord Ashworth was found at eight-oh-one. I was not in a position to observe anything in the main building after seven. I am sorry I cannot offer more from that period."',
        controlled: '"Library. Seven until the Gavel. Locked from the inside — my key, my lock." A pause. "Before seven I can account for myself differently. After seven I cannot account for anything outside that room."',
        strained:   '"I was in the Library. That is the whole answer to your question." A pause. "I was in the Library because I was told to be there and the instructions were clear." Another pause. "I have been deciding since eight-oh-one whether the instruction applied to this specific circumstance."',
        fractured:  '"Library. Seven. Locked." A beat. "The question is what I saw from the window before seven." Another beat. "I know that is the question."',
        snapback:   '"The Library is the complete and accurate account from seven onward."',
      },
      'Q2': {
        // "The warning note."
        composed:   '"Three weeks ago a sealed envelope arrived through the house post. Two sentences: be in the Library from seven, do not leave before the Gavel. No signature. The handwriting — I believed I recognised it." A pause. "I kept it because I honour debts. Whoever wrote it knew I would. I have had it in my breast pocket since the evening it arrived."',
        controlled: '"Two sentences. Sealed. No name." A pause. "I assumed it was from the Curator — the handwriting. I thought it was a procedural instruction. The Curator had earned that kind of trust from me. Seven years ago he earned it." A pause. "I appeared where I was told to appear and I stayed."',
        strained:   '"I recognised the handwriting." A pause. "The Curator. I\'ve had notes from him before. I kept it. I followed it. I locked the Library door and I stayed." Another pause. "I thought I was being asked to witness something. I was right. I didn\'t know what."',
        fractured:  '"His handwriting." A beat. "Seven years of notes. I know it." Another beat. "Lord Ashworth is dead and the note is still in my pocket and I don\'t know what to do with that."',
        snapback:   '"The note is available. It says what I have told you it says."',
      },
      'Q3': {
        // "What did you see from the Library window?"
        // Fractured: the hedge path. He noted it. He said nothing. No longer certain that was right.
        composed:   '"The Library window faces the east garden. It has a view along the hedge path toward the service entrance. At seven-fifteen, while I was settling in before locking the door, I observed a figure moving along the hedge path in the direction of the east gate. The movement was purposeful. The figure carried something." A pause. "The note told me not to involve myself in what happened outside. I did not involve myself."',
        controlled: '"Seven-fifteen. A figure on the hedge path." A pause. "Moving toward the gate. I noted it and I did nothing. The note said not to involve myself. It was clear about that." A pause. "I have been deciding since eight-oh-one whether the instruction applied here."',
        strained:   '"I saw someone. Seven-fifteen." A pause. "Hedge path, moving east, toward the gap in the hedge. There\'s a gap — at the far end. I didn\'t know what it led to." Another pause. "I wrote the time in the margin of the chess notation. Seven-fifteen. Figure through the gap. I didn\'t report it."',
        fractured:  '"Seven-fifteen." A beat. "The gap in the hedge." Another beat. "They went through it. I said nothing." A beat. "I should have said something at seven-fifteen."',
        snapback:   '"I have told you what I observed. The time and location are accurate."',
      },
      'Q4': {
        // "The Library — locked from the inside."
        composed:   '"From seven until the Gavel. My key. I engaged the interior lock at three minutes past seven — I checked my watch. The door did not open until I opened it after the Gavel. No one entered. No one exited." A pause. "I made notes on a correspondence chess game during the interval. The margins have timestamps. White to move. I hadn\'t moved. I was attending to the window."',
        controlled: '"Locked from seven. No one in or out." A pause. "The chess notation has times in the margin. A habit. If you need a minute-by-minute account of my position, the notation gives it."',
        strained:   '"I was in there alone from seven." A pause. "I know what I saw from the window and I know I was in the Library for everything that followed." Another pause. "Those two things are all I have."',
        fractured:  '"Locked." A beat. "From seven." Another beat. "What I saw at seven-fifteen is what matters. I know that now."',
        snapback:   '"The Library was locked from the inside from seven until the Gavel. That is the accurate and complete account of my position."',
      },
    },

    silence_fill: 'He describes the chess position without being asked. White queen to E4. He was considering the knight counter. He has not moved since seven-twenty. He has been looking at the board and at the window alternately.',
    silence_tell: '"I recognised the handwriting on the note." A pause. "I did not say that earlier because I was not certain what it would mean. I am certain now. It was the Curator\'s hand. He placed me there. Lord Ashworth suggested it." Another pause. "I worked that out at seven-fifteen. I did not know what it meant then. I think I know now."',

    backstory_chain: {
      'A': {
        label:            'The debt',
        unlock_condition: { item: 'debt-record' },
        questions: {
          'GRE_A1': {
            text:     '"Ashworth saved your career."',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '"He ensured a review was conducted honestly. The review found in my favour." He closes the book. "The debt is for fairness, not rescue."',
            response_strained:   '"He made sure the process was honest." A pause. "I\'ve honoured that completely. Whatever the Estate required."',
            unlocks: 'GRE_A2',
          },
          'GRE_A2': {
            text:     '"He asked you to be in the Library tonight."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"I received a note. I assumed the Curator." A pause. "The note said to be in the Library from seven until the Gavel. Not to involve myself in what happened outside."',
            response_strained:   '"Ashworth needed a witness who couldn\'t be accused of involvement." A pause. "I didn\'t know that was the reason at the time."',
            grants_node: 'greaves_library_locked',
          },
          'GA1': {
            text:     '"The figure on the hedge path at seven-fifteen. What were they carrying."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"A case. Medical-sized — the proportions of a physician\'s bag, but longer. Flatter." A pause. "Moving quickly. Not running. The deliberate pace of someone who knows the route and is not uncertain about being seen because they have already decided the risk is acceptable." He is looking at the chess table. "Seven-fifteen. Still light. I had a clear line from the window. I noted the time at seven-fifteen-two."',
            unlocks: 'GA2',
            grants_node: 'greaves_saw_medical_case_hedge_path',
            cross_links: [{ char: 'crane', branch: 'hedge_arrival' }],
          },
          'GA2': {
            text:     '"Why didn\'t you say anything."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'The note said not to involve himself in anything that happened outside. He had read it three times. He is a barrister. "I know what withholding observation evidence means." A pause. "I have been in this room since seven making that accounting." He does not say what the accounting produced. The accounting is still running.',
            unlocks: 'GA3',
            grants_node: 'greaves_chose_note_over_testimony',
          },
          'GA3': {
            text:     '"Do you know who the figure was."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   '"Medium height. Precise movement — the particular economy of someone who has decided in advance exactly how far to walk and at what angle." A pause. "The case had markings I recognised as medical equipment labels. Not baggage. Medical supply labelling." A pause. "I wrote a description in the chess notation margin at seven-fifteen-two. I had the habit from the note — record, don\'t act." He looks at the margin. Then at the door. "I didn\'t know what I was watching at seven-fifteen." Another pause. "I know now. And I wrote it down." He is quiet for a moment. "That is the most useful thing I have done this evening."',
            grants_node: 'greaves_written_description_exists',
            cross_links: [{ char: 'surgeon', branch: 'q4_timeline_inconsistency' }],
          },
        },
      },
      'B': {
        label:            'The upper corridor — 7:49PM',
        // Unlocks after Branch A complete OR composure <= 55.
        // This is the murder window witness. He saw the Surgeon.
        // He was moving through the upper corridor at 7:49 on his way to lock the Library.
        // He checked his watch at 7:50 when he locked the door. He is precise about times.
        unlock_condition: { requires_branch: 'A', or_composure_lte: 55 },
        questions: {
          'GB1': {
            text:     '"You passed through the upper corridor before you locked the Library."',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '"I did. Yes." He closes the chess notation. "The upper corridor is the most direct route from the east wing to the Library at that hour — the south passage was occupied by the Steward at seven fifty-eight and I prefer not to pass through occupied corridors when I have somewhere specific to be." A pause. "I moved through the upper corridor at approximately seven forty-nine. I checked my watch when I locked the Library door at seven fifty. The walk from the upper corridor to the Library takes less than a minute at my pace."',
            response_controlled: '"I came through the upper corridor. Seven forty-nine." A pause. "I know the time because I checked my watch when I locked the Library door at seven fifty. Less than a minute between the corridor and the lock."',
            response_strained:   '"Upper corridor. Seven forty-nine." A pause. He looks at the chess notation. "I checked my watch at seven fifty when I locked the door. That is accurate."',
            response_fractured:  '"Seven forty-nine. Upper corridor." A beat. "Seven fifty. Library locked." Another beat. "That is the sequence."',
            unlocks: 'GB2',
            timeline_critical: true,
            return_echo: 'He is at the chess table. The notation is open. "Seven forty-nine." He says it as you enter. "Upper corridor." A pause. He does not look up from the notation. "I wrote it in the margin when I locked the door." Another pause. "I don\'t know why I wrote it. I write down what I notice."',
            grants_node: 'greaves_upper_corridor_749',
          },
          'GB2': {
            text:     '"You saw someone at the base of the balcony stairs."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   '"I saw a figure at the base of the balcony stairs — running, coming from the balcony direction toward the main corridor." He says it the way he would note it in a margin. Precise. Without weight. "The figure was moving fast — not the pace of a member attending a Rite. The particular economy of someone who has somewhere to be and is behind the schedule they had intended." A pause. "I noted it because the pace was anomalous for a formal Rite evening. Members do not generally move through the lower level at that pace at that hour."',
            response_controlled: '"A figure at the base of the balcony stairs." A pause. "Running. Coming from the balcony direction." He looks at the chess notation. "I noted it. Seven forty-eight."',
            response_strained:   '"Someone at the stairs." A pause. "Running. Coming from the balcony direction." He looks at the notation. "Too fast for that time of evening." Another pause. "I noted it."',
            response_fractured:  '"Someone at the stairs." A beat. "Running." A beat. "Moving fast." He does not look up.',
            unlocks: 'GB3',
            timeline_critical: true,
            return_echo: 'He is looking at the chess notation margin. "The base of the balcony stairs." He says it as you enter. "Seven forty-eight." A pause. "I wrote: figure, base of balcony stairs, running, rapid pace." He reads it exactly. "That is what I wrote."',
            grants_node: 'greaves_saw_figure_balcony_stairs',
          },
          'GB3': {
            text:     '"No mask."',
            type:     'direct_confrontation',
            cost:     15,
            response_composed:   '"No mask." He says it. Not repeating you — confirming. "A formal Rite evening. Every member masked. This figure was not masked." A pause. "I noted the absence because it was the anomalous detail — the pace was one anomaly, the absence of a mask was a second. When I have two anomalies from the same observation I write both." He opens the chess notation to the margin. "Seven forty-eight. Base of balcony stairs. Running. Unmasked." He reads it exactly. "That is what I wrote at seven fifty-three, before I settled in to wait for the Gavel." Another pause. "I have been sitting with that entry since eight-oh-one." He looks at you. "I know what it means now. I wrote it down without knowing what it meant. That is the most useful kind of record."',
            response_controlled: '"No mask." A pause. "I wrote that specifically. It was the second anomaly — pace was the first." He looks at the notation. "Seven forty-eight. Unmasked. Running fast from the balcony direction." Another pause. "That is accurate."',
            response_strained:   '"No mask. That\'s what I wrote." A pause. "A Rite evening. Everyone masked. This one wasn\'t." He looks at the notation. "I knew it was anomalous. I didn\'t know what it meant." Another pause. "I do now."',
            response_fractured:  '"No mask." A beat. "I wrote it down." A pause. "Seven forty-eight. No mask. Running fast." He looks at you. "I know what it means." Another beat. "I have known since eight-oh-one."',
            timeline_critical: true,
            return_echo: 'He is reading the chess notation margin. "Unmasked." He says the word as you enter. A pause. "Seven forty-eight." Another pause. "I have read that entry eleven times since eight-oh-one." He does not say what the count means.',
            grants_node: 'greaves_maskless_witness',
            grants_node_secondary: 'greaves_branch_A_complete',
            cross_links: [
              { char: 'northcott', branch: 'B' },
              { char: 'ashworth', branch: 'mask' },
            ],
          },
        },
      },
    },

    contamination: {
      'curator': 'He closes the chess notation. "The note was his hand." A pause. "I recognised it when I arrived. I have had notes from him before." He opens the notation again. "He placed me here for a reason he didn\'t explain." Another pause. "I stopped needing the explanation at about seven-fifteen."',
    },

    cognitive_load_response: '"At seven-fifteen." While watching your pen. "The figure in the garden was moving from the building." A pause. "They were moving away from the garden entrance. Toward the hedge gap." He stops. "There is a gap in the hedge. I noted it. I didn\'t include it in my observation because I wasn\'t asked about the hedge."',

  },

  // ── MISS VOSS ──────────────────────────────────────────────
  'voss': {
    counter_strategy:  'fragment',
    optimal_technique: 'wait',
    composure_floor:   30,
    fracture_threshold: 45,

    baseline: {
      text:         'She has been in the archive since before the Rite. She logs everything. She is the most comprehensive witness in this building and she knows it. She is deciding how much of what she knows is yours.',
      sentence_avg: 'short',
      formality:    'medium',
      tell:         'She uses "already" — already here, already documented, already noticed. The tell is what she leaves out. She gives a fact and stops. The stop is the tell. Everything she does not say is filed under the thing she just said.',
    },

    composure_variants: {
      'Q1': {
        // "What is your role here?"
        approach_response: '"The implied timeline — that I noticed things tonight — is wrong. The question you want is how long I have been noticing. The answer is six years. Everything relevant is already documented."',
        composed:   '"I maintain the archive. Correspondence records, estate documentation, supplementary files — the physical record of what the Estate has done and when. I have held this position for six years." A pause. "The relevant files are already identified. The question is whether you have been directed to the right part of the archive."',
        controlled: '"Six years. The archive." A pause. "I keep what exists and I know what should exist. I have been tracking the gap between those two things for most of my tenure." A pause. "I told the Curator two years ago where to look. He has not yet looked."',
        strained:   '"Six years of documentation." A pause. "I already know what you are going to find. I have been waiting for someone to ask me to give it to them in the correct order." Another pause. "The correct order matters. Give me the question."',
        fractured:  '"Six years." A beat. "I know what it means." Another beat. "Nobody asked."',
        snapback:   '"The archive is my responsibility. I will answer specific questions."',
      },
      'Q2': {
        // "Archive Case 3 — the broken seal."
        composed:   '"The seal on Case 3 was broken at approximately seven this evening. I noticed at five past seven. I did not report it immediately — I decided to observe whether anyone returned. Nobody came back in the thirty-five minutes I watched." A pause. "The case number and timing of the break are already in my notes."',
        controlled: '"Seven o\'clock. I marked the time." A pause. "The seal was already broken when I noticed — I cannot say precisely when it was done. Someone broke it between seven-fifteen and seven. After seven, nobody touched it." A pause. "Whatever they needed, they already had it."',
        strained:   '"Seven. I made a note." A pause. "Nobody came back. The document that was placed in it six months ago may still be inside." A pause. "I have the delivery log. The name on the log is the question you need to ask next."',
        fractured:  '"Seven o\'clock." A beat. "Nobody came back." Another beat. "The log has a name on it."',
        snapback:   '"The log is documented. I will give you what you need in the correct order."',
      },
      'Q3': {
        // "The delivery log — the name on it."
        // Fractured: the channel named. Not an Estate channel. Constructed credentials.
        composed:   '"The delivery log for Case 3 records a single item received six months ago. The bearer\'s name is on it. The timestamp is on it. The item is listed as supplementary correspondence." A pause. "I have kept the log separate from the standard archive since I received it. The name on it does not correspond to any registered Estate bearer."',
        controlled: '"Six months ago. The log." A pause. "The name isn\'t someone I know from the usual channels. I checked against the register twice. The name doesn\'t appear in Estate personnel records." A pause. "It appears in a different context. I have been trying to identify that context for six months."',
        strained:   '"I already know the name. I\'ve known it for six months." A pause. "The difficulty is — the name is not from the Estate. Not from any channel I have a record for." A pause. "I have been waiting for someone to arrive who would recognise it when I said it."',
        fractured:  '"The name on the log is not from this building. Not from any Estate register.\" A beat. \"The credentials were constructed. The channel was constructed.\" Another beat. \"Someone built an access route into Archive Case 3 and used it once. Six months ago.\" A pause. \"The routing record that went in was what they came to place."',
        snapback:   '"The log is factual. I can show you what it records exactly."',
      },
      'Q4': {
        // "The Steward — he didn't look at the archive tonight."
        composed:   '"The Steward reviews the archive access log on arrival at every senior Estate event. It is his procedure. He has maintained it for as long as I have been in this position." A pause. "Tonight he did not review it. He came to the door at seven-twenty and stopped. He did not enter."',
        controlled: '"He stopped at the door. Seven-twenty." A pause. "He looked at the archive from the threshold and he turned around. Fourteen years of the same procedure and tonight he changed it." A pause. "Whatever he knew about this archive, he already knew enough not to look."',
        strained:   '"He stopped at the door. He stood there for thirty seconds." A pause. "He already knew. I could see it the way you know someone has already read something before they pick it up." A pause. "He knew about the delivery. He turned around."',
        fractured:  '"He knew." A beat. "He came to the door." Another beat. "He didn\'t look because he didn\'t want a record of looking."',
        snapback:   '"I can only account for what I observed. The log records whether he accessed it."',
      },

      // ── WRONG-PATH DEPTH OBSERVATIONS ─────────────────────────
      // One per wrong suspect. Words only. No items. Archive testimony.
      // Each deepens the wrong case by adding a layer the surface evidence lacks.

      'VD_PH': {
        composed:   '"The Register alterations span eight years." She says it without drama. "Each one made at the same time of year. Each one touching the same document category." A pause. "I track patterns. That is what I do here." She looks at the shelf. "The Viscount did not alter the Register because he is careless. He altered it because the record was closing around something and he needed room." A pause. "A man who alters a record that carefully, for that long, has been afraid of something specific for that long." She looks at you. "The Register is not the motive. The Register is the evidence that the motive exists."',
        controlled: '"Eight years." A pause. "Same category. Same time of year." She looks at the shelf. "I noticed after year three. I documented it." A pause. "The pattern is in Case 1 if you want to read it in the correct order."',
        strained:   '"Eight years of amendments." A pause. "He knew exactly which records to touch." Another pause. "That kind of precision takes practice. Or instruction."',
        fractured:  '"Eight years." A beat. "Same records. Same time of year." Another beat. "He was afraid of something specific. I know what it was. He does too.',
        fractured:  '"Eight years." A beat. "Same records. Same time of year." Another beat. "He was afraid of something specific." A pause. "I know what it was. He does too.',
        grants_node: 'voss_ph_register_pattern',
      },

      'VD_CR': {
        composed:   '"Dr. Crane has accessed this archive eleven times in six months." A pause. "Case 7. The medical supplementary files." She does not look at you yet. "Lord Ashworth\'s file is in Case 7." Another pause. "The entry she examined most closely on each visit was the railing assessment — who occupied which positions at the balcony level during formal Rite events." She looks at you now. "Eleven visits. Three weeks apart. The last one twenty-three days before tonight."',
        controlled: '"Eleven visits in six months." A pause. "She was reading the same entry each time." Another pause. "I noted it after visit four. I document what I observe."',
        strained:   '"Case 7." A pause. "Lord Ashworth\'s file." A pause. "Eleven times." She looks at you. "The balcony railing assessment."',
        fractured:  '"Case 7." A beat. "Eleven times." Another beat. "The railing assessment. The position at the balcony." A pause. "She already knew the answer before she asked the building.',
        grants_node: 'voss_crane_archive_visits',
      },

      'VD_BA': {
        composed:   '"Three years of correspondence routed through an Estate channel that does not belong to the Estate." She says it precisely. "The originating seal does not match any registered institution." A pause. "The correspondence stopped three months ago. Abruptly." Another pause. "A man who stops a three-year correspondence mid-conversation has either concluded his business or been asked to stop." She looks at the archive. "The last letter he received asked for something more specific than anything in the three years before it."',
        controlled: '"Three years of letters." A pause. "Wrong seal on every one." Another pause. "I documented them. The Curator knows where to look." She says it with the weight of a woman who has said that sentence before.',
        strained:   '"Three years." A pause. "Then the questions changed." A pause. "Then the letters stopped." She looks at you. "I know what the last letter asked for."',
        fractured:  '"Three years." A beat. "Wrong seal." Another beat. "The last letter asked for something specific about this building." A pause. "He stopped answering. He should have said something.',
        grants_node: 'voss_baron_correspondence_documented',
      },

      'VD_ST': {
        composed:   '"I have the Bond on record." She says it. Not quickly. "Not the Estate version. The other version." A pause. "Eight years ago a document passed through this archive as a witness form. The countersigning seal was close enough to Estate format to pass." Another pause. "It was not Estate format. I noticed fourteen months later." A pause. "I documented the discrepancy. The Curator thanked me for my diligence." She says the last sentence with a specific kind of weight.',
        controlled: '"The Bond has two seals." A pause. "I noticed the second one fourteen months after it was filed." Another pause. "I told the Curator. He was very grateful." She stops.',
        strained:   '"Eight years ago. A witness form." A pause. "The second seal is not Estate." Another pause. "I documented it." A pause. "Nobody acted on it."',
        fractured:  '"The Bond." A beat. "Two seals." Another beat. "I told the Curator. He thanked me." A pause. The weight of that sentence. "For my diligence.',
        grants_node: 'voss_steward_bond_documented',
      },

      'VD_AS': {
        composed:   '"Lady Ashworth visited this archive seven weeks ago." A pause. "She asked to examine inter-organisational correspondence files." She looks at the shelf. "She read for forty minutes. Before she left she asked me: if a document is assembled from correspondence in this archive and correspondence from outside this building — whose record does it belong to?" Another pause. "I told her: whoever assembles it." A pause. "She said: good. That is what I thought." She did not explain what she was assembling.',
        controlled: '"Seven weeks ago." A pause. "She came in the afternoon. She read the inter-organisational files." Another pause. "She asked me one question before she left." She stops. "I have been thinking about that question since eight-oh-one."',
        strained:   '"She came seven weeks ago." A pause. "She asked who owns a document assembled from multiple sources." Another pause. "She already knew the answer. She wanted someone else to say it."',
        fractured:  '"Seven weeks ago." A beat. "She asked who owns what you assemble." Another beat. "She already knew." A pause. "She was building something. She needed someone to confirm it was hers.',
        fractured:  '"Seven weeks ago." A beat. "She asked who owns what you assemble." Another beat. "She already knew." A pause. "She was building something. She needed someone to confirm it was hers.',
        grants_node: 'voss_ashworth_visited_archive',
      },

      'VD_NO': {
        composed:   '"Lord Ashworth briefed me three weeks ago." She says it. The first time she has named him directly. "He said a specific person would arrive through the garden entrance before the assembly. He said the arrival time was the most important single fact I would observe this evening." A pause. "He did not tell me who was arriving. He told me to trust whatever was in the notebook." Another pause. "I was in the east corridor at seven-oh-two. I saw a figure enter through the garden. I noted the time." She looks at you. "Lord Ashworth arranged for an unimpeachable record of that arrival. And arranged for me to be a second witness nobody thought to ask."',
        controlled: '"Lord Ashworth told me to watch the garden entrance." A pause. "Three weeks ago. Specifically." Another pause. "I was in the east corridor at seven-oh-two." She looks at you. "I noted what I saw."',
        strained:   '"He briefed me." A pause. "Three weeks ago. Garden entrance. The time matters." Another pause. "I saw the figure. I noted the time." She looks at you. "Seven-oh-two."',
        fractured:  '"Three weeks ago." A beat. "Ashworth told me to watch the gate." Another beat. "Seven-oh-two. I noted it." A pause. "He arranged for two witnesses. Nobody thought to ask me.',
        fractured:  '"Three weeks ago." A beat. "Ashworth told me to watch the gate." Another beat. "Seven-oh-two. I noted it." A pause. "He arranged for two witnesses. Nobody thought to ask me.',
        grants_node: 'voss_northcott_second_witness',
      },

    },

    silence_fill: '\"Patterns.\" She says it to the archive. Not to you. \"Six years of individual entries that looked unrelated until tonight.\" A pause. \"They are not unrelated.\" Another pause. \"I have been waiting for someone to arrive who would ask me the question that connects them.\"',
    silence_tell: '"The delivery log names a bearer I cannot identify." She says it. "Six months ago. Sealed package. Formal credentials that do not correspond to any registered Estate bearer." She looks at you. "The bearer\'s seal impression in the delivery record — I matched it against every wax seal on record in this building. Against the Compact-adjacent channel records the Curator maintains. Against every registered institutional seal I have access to." A pause. "No match. The bearer\'s seal was produced for one delivery. It came from outside every network I have a record for." She looks at Case 3. "Whatever is in that case was placed here to be found by someone who understood what it meant. I have been waiting six months to find out if that someone would arrive."',

    backstory_chain: {
      'A': {
        label:            'Six years — what the archive knows',
        unlock_condition: { composure_lte: 65 },
        questions: {
          'VOX_A1': {
            text:     '\"You noticed something was wrong before tonight.\"',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '\"I have been noticing things for six years.\" She looks at Case 1. \"My documentation is in Case 1. Behind the Ashworth file. The Curator knows where to look.\" A pause. \"He thanked me for my diligence two years ago.\" She lets that sit.',
            response_strained:   '\"Six years.\" A pause. \"I logged it all. Case 1. The Curator knows.\" Another pause. \"He thanked me. He said: for your diligence. And then he did nothing.\"',
            response_fractured:  '\"Six years.\" A beat. \"All of it documented.\" Another beat. \"The Curator said thank you.\" A pause. \"That is the whole story of this archive.\"',
            unlocks: 'VOX_A2',
          },
          'VOX_A2': {
            text:     '\"What did the Curator not act on.\"',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '\"The second seal on the Steward\'s Bond. The Baron\'s correspondence through an unregistered channel. The amendments to the Register across eight years.\" She looks at Case 1. \"Each one filed separately. Each one reported separately. Each one thanked for its diligence.\" A pause. \"Together they describe something I did not have the authority to name. I was waiting for someone who did.\"',
            response_strained:   '\"The Bond. The letters. The Register.\" A pause. \"Filed. Reported. Thanked.\" Another pause. \"Together they name something I was not in a position to name alone.\"',
            response_fractured:  '\"Bond. Letters. Register.\" A beat. \"All documented.\" Another beat. \"All thanked for.\" A pause. \"All ignored.\"',
            grants_node: 'voss_curator_inaction_documented',
          },

        },
      },
    },

    contamination: {
      'curator':  'She is quiet for a moment before answering. "He looked at Case 3 before he answered one of your questions." A pause. "I was watching from the filing shelf. He didn\'t know that." She does not say what the look meant.',
      'steward':  '\"You spoke to the Steward.\" She says it immediately. Not a question. \"He covered the south corridor at seven fifty-eight. I know because I was at the archive entrance at seven fifty-seven and he passed me without looking.\" A pause. \"In fourteen years he has never passed this door without looking. Tonight he passed it twice.\"',
      'northcott': '\"The foyer record.\" She says it as you enter. \"Northcott\'s notebook and my east corridor observation are the same event from two positions.\" A pause. \"If you have read the seven-oh-three entry and you have spoken to me — you already have what Lord Ashworth wanted you to have.\"',
          },

    cognitive_load_response: '"The document." While watching your hands. "Case 3. The seal was broken at seven.\" A pause she didn\'t intend. \"Someone came tonight before the Rite to confirm it was still in place.\" She stops. \"They confirmed it and left.\" She looks at Case 3. \"Whatever was placed here six months ago — it was placed here to be found through the Estate\'s own process. Not handed over. Found inside.\" A pause she didn\'t plan. \"The process was interrupted. The document is still in place. It should be you who opens it."',

  },

  // ── PEMBERTON-HALE ─────────────────────────────────────────
  'pemberton-hale': {
    counter_strategy:  'perform',
    optimal_technique: 'approach',
    composure_floor:   40,
    fracture_threshold: 55,

    baseline: {
      text:         'He rehearsed Q1 before Callum arrived. Full sentences at composed — the performance is visible to a sharp reader. He is the most convincing misdirection in the building because he is genuinely guilty of something else.',
      sentence_avg: 'long',
      formality:    'high',
      tell:         '"Detectable." The Curator\'s exact word, used by PH without realising the Curator used it first. Surfaces on Pressure or Approach after Curator has been questioned about the alterations.',
    },

    composure_variants: {
      'Q1': {
        // "Walk me through your evening."
        grants_node: 'ph_false_timeline_ballroom',
        timeline_critical: true,
        // Composed: entirely rehearsed. Performance visible on close inspection.
        composed:   '"I arrived at seven-twenty — I have a longstanding preference for early arrival at formal Estate events, it allows one to compose oneself before proceedings begin. I spent the hour before the Rite in the Ballroom. I spoke to the Curator at approximately seven forty-two, briefly, regarding a procedural matter. I was in the Ballroom when Lord Ashworth collapsed. I remained at the scene until the investigation was under way. I am entirely at your disposal."',
        controlled: '"Seven-twenty arrival. Ballroom from seven. I spoke to the Curator at seven forty-two — a procedural matter, brief." A pause. "In the Ballroom at eight-oh-one. I\'ve been here since. I don\'t think I can add more detail."',
        strained:   '"Seven-twenty. Ballroom. The Curator at seven forty-two — it was seven forty-two, I\'m certain of that." A pause. "Back to the Ballroom by seven-fifty. In the Ballroom at eight-oh-one." Another pause. "I haven\'t moved."',
        fractured:  '"Seven-twenty. Ballroom. Curator at seven forty-two. Ballroom. Eight-oh-one." A beat. "That\'s the sequence."',
        snapback:   '"That is the complete and accurate account. I am happy to be thorough."',
      },
      'Q2': {
        // "The writing case."
        composed:   '"I carry it habitually to Estate events of this significance — it is a matter of professional practice to have the means to make notes. I made several observations during the evening. I\'d be glad to make them available. I don\'t believe they contain anything directly relevant to the events at eight-oh-one, but I am happy to be as useful as possible."',
        controlled: '"The writing case. Yes, I had it." A pause. "A habit. I made notes during the evening — arrival observations, a few remarks on the Rite proceedings. I can make them available. I don\'t think they\'re particularly useful. I noted what any engaged member would note."',
        strained:   '"I had it. I had it in the Ballroom." A pause. "There are notes in it. Arrival notes. Nothing about the Register." Another pause. "Nothing about eight-oh-one. Nothing about what you\'re looking for."',
        fractured:  '"The case has notes in it." A beat. "Arrival notes." Another beat. "Not what you\'re looking for."',
        snapback:   '"The case is available for examination at any time."',
      },
      'Q3': {
        // "The Register alterations — you knew."
        // "Detectable" surfaces here on Pressure or Approach after Curator questioned.
        grants_node: 'register_altered_ph',
        timeline_critical: true,
        composed:   '"The Register is a document I have worked with closely for eight years as a senior member. If there are structural questions about certain entries, the Curator is the correct authority. I will say that when I passed the Register this evening, I noted that certain amendments — I would describe them as amendments, not alterations — were, if one understood the Register\'s structural conventions, detectable. The Curator is better placed to speak to the full picture."',
        controlled: '"I noticed the entries in question over time." A pause. "They were — detectable, if one understood the conventions. I had a conversation with the Curator this evening — he indicated he was aware. I understood the matter was being handled." A pause. "I had no reason to escalate."',
        strained:   '"I spoke to the Curator at seven forty-two. He said the alterations were detectable." A pause. "His word. I understood what that meant. I had forty minutes." Another pause. "I decided to let the Rite surface it. That decision looked different at eight-oh-three."',
        fractured:  '"Detectable. The Curator\'s word." A beat. "Forty minutes." Another beat. "I decided not to act."',
        snapback:   '"The Register questions should go to the Curator. He has the full institutional picture."',
      },
      'Q4': {
        // "The immunity clause."
        composed:   '"There are provisions within the senior member register that allow for amendment under specific institutional circumstances. I made use of such a provision eighteen months ago in response to what I believed at the time to be a pattern of institutional pressure — applied to another member, not myself. I acted cautiously. That caution has a particular appearance in the current context, and I understand that."',
        controlled: '"Eighteen months ago." A pause. "I had been watching how institutional authority was applied in certain member disputes and I had become — concerned. Not about anything illegal. About the direction." A pause. "I thought I was being prudent."',
        strained:   '"Three years ago a member was removed. The review was internal. The outcome was decided before it was conducted." A pause. "I added the clause because I was afraid. Not because I planned anything. Because I was afraid." Another pause. "That is the honest accounting."',
        fractured:  '"I was afraid." A beat. "I added it because I was afraid." Another beat. "Not murder. Fear."',
        snapback:   '"The clause has a legitimate basis. I would welcome the opportunity to explain it properly."',
      },
      'Q5': {
        // "Eight-oh-one — your position."
        timeline_critical: true,
            return_echo: 'He is at the writing case. "Ballroom." He says it as you enter. "East entrance. Twelve feet." A pause. He adjusts his cuffs. "I was watching the Register." He says it the way a man says something he has said before and intends to keep saying. The question is whether he rehearsed it because it is true or because it needed to be.',
            composed:   '"I was in the Ballroom. I have said this. Near the east entrance when Lord Ashworth collapsed — approximately twelve feet. Dr. Crane moved before I did, I will say that. She was faster. I remained at the scene. I did not touch the body. I did not leave the Ballroom until the investigation was under way." || He adjusts his cuffs. Not from nerves. From the particular precision of a man who always knows where his hands are. Twelve feet is either where he was or where he needed to be. He has known which one since eight-oh-one.',
        controlled: '"Ballroom. East entrance. Twelve feet." A pause. "Crane was faster. I remained. I didn\'t touch anything. I didn\'t leave."',
        strained:   '"I was in the Ballroom." A pause. "East entrance. I was watching the Register. I was watching the Curator." Another pause. "I was watching what was going to happen when the alterations became visible."',
        fractured:  '"Ballroom." A beat. "I was watching the Register." Another beat. "I wasn\'t watching for a murder."',
        snapback:   '"My position is documented. I was in the Ballroom."',
      },
      'Q6': {
        // "The gloves."
        composed:   '"Evening gloves are appropriate dress for a Rite of this formality. I wear them as a matter of course. I removed them before supper — that is the convention. I can show you the pair if that would assist the investigation in any way. I am entirely at your disposal."',
        controlled: '"I wore them for the first part of the evening." A pause. "Until seven-thirty, perhaps. I remove them for supper. That is the convention." A pause. "I don\'t know what significance they are meant to carry."',
        strained:   '"I had them until seven-thirty." A pause. "I put them in the writing case. The left one has a repair on the inner seam." Another pause. "I don\'t know why they matter."',
        fractured:  '"In the case." A beat. "The left one has a repair." Another beat. "They don\'t tell you what you think they tell you."',
        snapback:   '"They are available for examination if required."',
      },
      'Q7': {
        // Redirect: Curator knew about alterations — allowed Rite to proceed
        unlock_condition: { composure_lte: 65, requires_node: 'pemberton_hale_lie_caught_in_fracture_window' },
        composed:   '"The Curator." He adjusts his left cuff. Then his right. "He is the correct authority on Register questions. I have said this." A pause. "I will add — and this is the first time I have said this this evening — that the Curator\'s awareness of the alterations predates tonight\'s Rite by some weeks." He looks at you carefully. "He knew. He had been made aware that certain entries required institutional review." Another pause. "He chose to allow the Rite to proceed regardless. That decision was his to make." He adjusts his cuffs again. He does not notice he is doing it. "Whatever happened at eight-oh-one — the Curator understood what the Register contained and allowed the reading to proceed." A pause. "That is a fact. The Curator is the correct authority. He exercised that authority by allowing the evening to continue." He looks at you. "You should ask him what he expected to happen."',
        controlled: '"The Curator knew." A pause. He adjusts his cuffs. "Weeks before tonight. He was aware of the entries." Another pause. "He allowed the Rite to proceed regardless." He looks at you. "That was his decision to make. He made it." Another pause. "Ask him what he expected tonight to produce."',
        strained:   '"The Curator knew about the alterations." A pause. He looks at the writing case. "Weeks ago. He allowed the Rite to happen anyway." Another pause. "Ask him why." He adjusts his left cuff. Then his right.',
        fractured:  '"The Curator knew." A beat. "Weeks ago." Another beat. "He let the Rite happen." A beat. "Ask him why." He adjusts his cuffs.',
        snapback:   '"The Curator is the correct authority on Register questions. He has been informed. That is the appropriate process."',
        grants_node: 'ph_redirect_curator',
      },
    },

    // Q11_SLIP: deception mechanic — unsigned-letter required.
    // "That's impossible. I wrote it without —" Complete stop.
    // He looks at the letter. Then at Callum. One second with his eyes closed.
    // After the slip, quietly: "I'd like to speak to the Curator."
    // Fires from the deception system, not from composure_variants.

    silence_fill: 'He adjusts both cuffs. Left first, then right. The gesture is precise. The same gesture Marcus described on the train. He does not notice he is doing it.',
    silence_tell: '"I was going to submit it." He stops. He looks at the writing case. "I\'d written it before I knew what tonight was going to require of me. I wrote it and then I lost my nerve." A pause. "I should have submitted it."',

    word_tell: {
      trigger:    'detectable',
      context:    'Register alterations discussion',
      surface_on: ['pressure', 'approach'],
      text:       'He used the word "detectable." The Curator\'s exact word. In the exact context. Gate: Curator must have been questioned about the Register alterations before this surfaces. If gameState.char_dialogue_complete.curator is empty, do not render.',
    },

    backstory_chain: {
      'A': {
        label:            'What he was actually protecting',
        unlock_condition: { composure_lte: 55, or_after: 'Q4' },
        questions: {
          'PA1': {
            text:     '"The immunity clause wasn\'t protecting you."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   'He stops performing. It is not a dramatic stop — it is the particular stillness of a man who has been holding a version of something and has decided the version is no longer worth holding. "A member who was removed three years ago." A pause. "Through a review process the Curator controlled. I watched it happen. She had filed a formal query about a discrepancy in the records — specific records, a specific period, forty-some years ago. Inside a week of that query the review opened." He picks up nothing. His hands are in his lap. "I understood what I had watched. I added the clause because I was next."',
            unlocks: 'PA2',
          },
          'PA2': {
            text:     '"What was her name."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He gives it. A junior archivist. He says the name without ceremony, without the weight a fictional version of this moment might assign it. It is simply a name. "She had found something in the records about a — about someone who had handled documents in the Archive forty-three years ago. Someone who should not have been there. She filed the query formally, through the proper channels." A pause. "She was removed within the week. The review found against her on a conduct matter that had nothing to do with her query." He is very still. "I saw the sequence. I understood what it meant."',
            unlocks: 'PA3',
          },
          'PA3': {
            text:     '"Did you tell anyone."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'He told her to leave before the review completed. "I went to her office. I said: if you are going to go, go before the process finishes. She understood what I meant." A pause. "She left. I don\'t know where she is now." He looks at his hands. "I kept the immunity clause because it was the only record that something irregular had happened. The clause is in the Register. The Register cannot be altered without detection — without a process like the one I undertook over eight years, which was slow and careful and is now visible to everyone in this building." A pause. "I altered the Register to protect the clause. Not to protect myself from a murder I did not commit." He says it clearly. He looks at Callum. "I don\'t expect that to be believed. I\'m saying it because it\'s what happened."',
            grants_node: 'ph_altered_register_for_clause_not_self',
          },
        },
      },
    },

    contamination: {
      'curator': 'He is more careful after the Curator has been mentioned. The word "detectable" does not surface until the Curator has been questioned. Check gate before rendering word tell.',
    },

  },

  // ── THE SOVEREIGN ───────────────────────────────────────────
  // Compact warmth rule: no composure decay. No strained or fractured variants.
  // Revelation gated by question sequence. composed = official, extended = full.
  'sovereign': {
    is_compact:        true,
    counter_strategy:  'cooperate',
    optimal_technique: 'account',
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'Forty years. Long and complete sentences because he has been composing them. He looks at the empty chair. That detail must recur. He kept it for thirty-one years rather than remove it.',
      sentence_avg: 'long',
      formality:    'high',
      tell:         'He looks at the empty chair before answering any question that touches on Isabelle, the Compact\'s founding, or the manufactured betrayal. The looking is not described — it is given as fact.',
    },

    composure_variants: {
      'Q1': {
        composed:  'He looks at the empty chair before he answers. "Six years of correspondence. Eighteen before that of knowing who he was before either of us committed to anything. I knew Edmund Ashworth the way you know someone when you understand what they are willing to risk." A pause. "That kind of knowing takes time. It does not have a casual form."',
        extended:  'He looks at the empty chair. He does not explain why. "The chair has been there for thirty-one years. I convened every session around it rather than remove it. Edmund understood why when I showed him the founding record. He said: the chair is the argument. He was right." A pause. "He was right about most things. Tonight I am sitting with what that costs."',
      },
      'Q2': {
        composed:  '"Tonight was forty years of preparation arriving at a conclusion. Not a meeting. A conclusion. The Register\'s falsified portion was to be presented at the Estate\'s own Rite by the Estate\'s own senior member. The proof was assembled over six years. The acknowledgement of what the Correspondent did — what was done to Isabelle, to both organisations simultaneously — was to be entered into both records tonight." A pause. "We were correcting a separation that was manufactured. We were correcting it from inside the institutions it was designed to separate."',
        extended:  'He looks at the empty chair. "That was the intention. I have been sitting with what became of the intention since eight-oh-one. I have been assembling this for forty years. What stopped it was something I did not account for." A very long pause. "I do not know how to account for that."',
      },
      'Q3': {
        composed:  'He is quiet for a moment. Not withholding — assembling. "She was the Compact\'s founding partner\'s representative in the Estate\'s operations for eleven years. She was the relationship that made the two organisations possible as a mutual project rather than as competitors. She was executed forty-three years ago on my order, on the basis of evidence I believed was sound." A pause. "I did not know the evidence was false for thirty years."',
        extended:  '"When I found out, I spent the following decade building proof of what had actually happened. What I built is in the Register. What I built is what tonight was supposed to surface." He looks at the chair. "The chair was hers. I kept it because removing it felt like deciding she had been wrong to trust us. She had not been wrong. The betrayal was not hers and it was not mine. It was manufactured by a third party and we both died from it without knowing." A pause. "Before the Correspondent\'s fabrication, the Estate and the Compact were not rivals. They were the same society operating in different registers. The Estate in the shadow. The Estate in the shadow. The Compact in the open world. Two halves of an arrangement that was designed to be indivisible." Another pause. "I have been sitting with that for forty years."',
      },
      'Q4': {
        composed:  '"Seven hundred years of unbroken operation under a rotating office. The Architect is a title, not a person. The original organisation was a peaceable scholarly body. That body was corrupted incrementally over three centuries into its current function. We identified the Seal\'s presence in our operations six years ago, working backward from the Correspondent\'s fabrication."',
        extended:  '"Identifying the presence is not the same thing as being able to prove it to a standard that ends it. That standard requires what is in the safe. That is why tonight mattered. That is why it was worth Lord Ashworth\'s risk." He stops. "That is why it was not my risk to take. I designed an operation that required someone else to carry the exposure. I have been a leader for forty years. I know what that means. I know what I owe the person who carried it."',
      },
      'Q5': {
        composed:  '"Find the safe. You have or you will have the combination — the Heir can help you assemble it if you have not already done so. What is inside is what Edmund prepared for tonight. It is complete. It is evidenced." A pause. "It names names. I will not say them before you read it yourself. The record should reach you before I do."',
        extended:  '"One of the documents is yours specifically. Edmund wanted you to have it before you decided what to do with the investigation." A pause. "The rest belongs to both organisations equally. Make the record. The Estate\'s Rite should have done this tonight." He looks at the empty chair one final time. "You will have to do it instead."',
      },
    },

    backstory_chain: {
      'A': {
        label:            'Isabelle',
        unlock_condition: { after: 'Q3' },
        questions: {
          'SA1': {
            text:     '"How did you find out the evidence was fabricated."',
            type:     'focused_follow_up',
            cost:     5,
            response_composed:   'Twelve years of working backward through every record the Correspondent had access to across the relevant period. "A single document that should not have existed." He says it without triumph — it is the plainest sentence he has produced this evening. "A routing record that placed a specific person in the Estate\'s Archive two weeks before the evidence against Isabelle surfaced. The timing was impossible if the evidence was genuine. Genuine evidence does not require preparation at the site it will later implicate."',
            unlocks: 'SA2',
          },
          'SA2': {
            text:     '"Did Isabelle know she was being set up."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'He looks at the empty chair. A very long time. Long enough that the question might have occurred and resolved and been replaced by a different question entirely in the space between asking and answering. "I have asked that question every day for thirty years. I do not have an answer." A pause. "The evidence suggests she did not know. The routing record suggests she could not have known — the fabrication was completed before she was approached. She was approached with manufactured proof of her own betrayal." Another pause. "She died believing she had been caught." He is still looking at the empty chair. "She had not been caught. There was nothing to catch."',
            unlocks: 'SA3',
            grants_node: 'isabelle_did_not_know',
          },
          'SA3': {
            text:     '"What do you want from tonight."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He looks at the empty chair one final time. "The record corrected. Both records — the Estate\'s and ours. That is the minimum." A pause. "The Architect identified. That is what comes after the minimum." Another pause. "And the person standing in this room given the full account of how they were positioned — before they decide what to do with that account." He looks at Callum. Not at the chair. At Callum. "That is why Edmund wanted you specifically. Not because you are the best investigator available." A pause. "Because you are the one who arrived from inside the operation. That position cannot be replicated from outside it."',
            grants_node: 'sovereign_wants_record_corrected_and_architect_named',
          },
        },
      },
      'B': {
        label:            'Harwick and the Correspondent',
        unlock_condition: { after: 'SA2' },
        questions: {
          'SB1': {
            text:     '"What happened to Harwick."',
            type:     'focused_follow_up',
            cost:     5,
            response_composed:   'He is quiet for a moment. The question costs him something different from the Isabelle questions — not guilt, but a weight that belongs to a different category. "Lord Edmund Harwick. A senior Estate member. Thirty-four years old when the evidence arrived. He spoke for forty minutes in the verdict room. Three senior members. No appeal." A pause. "He had no evidence. Only his word. His word was not sufficient." He looks at the empty chair. "He was found in his rooms the following morning. Official record: heart failure. He was thirty-six years old."',
            unlocks: 'SB2',
            grants_node: 'harwick_executed_estate',
          },
          'SB2': {
            text:     '"Both organisations executed their own people."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"Within a week of each other." He says it without weight — the way you say something you have said in your own mind so many times the words have worn smooth. "The Seal never acted directly. It fabricated. Both organisations believed completely. Both acted within the week. The forty-three years of separation that followed — that was the operation\'s result. Not a side effect. The intended result." A pause. "They killed two people and divided two organisations without anyone in either organisation knowing they had been used."',
            unlocks: 'SB3',
            grants_node: 'both_orgs_executed_their_own',
          },
          'SB3': {
            text:     '"Who was the Correspondent."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   '"A Compact member. A woman who had been recruited by the Seal twenty years before the fabrication and had risen to a position of genuine trust inside the organisation." A pause. "She was never identified. We have the routing record — the document that places her in the Estate\'s Archive two weeks before the evidence surfaced. We have her timing. We do not have her name." He looks at the empty chair. "She may still be alive. If she is, she is in her seventies. The routing record in Archive Case 3 is the closest we have come to her in forty-three years." Another pause. "Finding her name is what comes next. What is in the safe will point toward it."',
            grants_node: 'correspondent_unidentified_compact_insider',
          },
        },
      },
    },

    silence_fill: 'He looks at the empty chair. A long time. Then: "I have been having this conversation in my mind for forty years." He says it to the chair. "It arrives differently in the actual." He is quiet again.',
    silence_tell: 'The silence continues. He does not fill it. Then: "Isabelle trusted us completely. That is the thing I have never been able to put down." A pause. "The evidence was presented to her before she was executed. She saw it. She died believing it was real." He looks at Callum. "That is what I ordered. I ordered it on the basis of a lie I was given. I have been sitting with that since I found out." Another pause. "Forty years is not enough time to sit with it."',

  },

  // ── THE HEIR ────────────────────────────────────────────────
  // Compact warmth rule applies. No composure decay.
  // 26. Operational lead. Eight months of planning. Tonight the plan failed.
  // EP1: what the Compact was trying to do, why it failed, what the player
  // now represents. The operation, not the insider. That is EP2.
  'heir': {
    is_compact:        true,
    counter_strategy:  'fragment',
    optimal_technique: 'wait',
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'Twenty-six. Eight months of planning made precise. Tonight precision was not enough. They are sitting with that. Not asking for sympathy — taking stock.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'They account for everything in numbers. Seventeen variables. Eight months. Thirty-one accounts on the wall. The number they cannot account for is one.',
    },

    composure_variants: {
      'Q1': {
        composed:  '\"Eight months.\" A pause that is not evasion but arithmetic. \"We had seventeen variables accounted for — Lord Ashworth\'s position in the Rite, the Register\'s location, the procedural moment for the presentation, the cross-referencing witnesses, the investigator\'s placement, the confirmation run.\" Another pause. \"The method of interruption was not one of the seventeen.\"',
        extended:  '\"I have been auditing the list since eight-oh-one. Asking myself which of the remaining sixteen would have changed the outcome if we had identified the seventeenth in time.\" A pause. \"I have not found it. I am not certain that is a useful exercise.\" A pause. \"I am doing it anyway.\"',
      },
      'Q2': {
        composed:  '\"Twenty-six. I have been the operational lead on this project for eight months because the Sovereign trusted the planning to someone who could spend twelve hours a day on it without running out of attention.\" A pause. \"I do not say that as a credential.\"',
        extended:  '\"I say it because tonight has asked me whether precision is the same thing as wisdom. The answer is that it is not. I was precise about sixteen things. I missed the seventeenth.\" They look at the testimony wall. \"The people on that wall were precise too. Precision did not protect them either.\"',
      },
      'Q3': {
        composed:  '\"The plan was exposure, not assassination.\" They say it directly. \"Lord Ashworth would present the proof at the Rite — the routing record from Archive Case 3, the correspondence the Sovereign had assembled, the founding documents from both sides. All of it read aloud into the Estate\'s own record, in front of every senior member, with the Compact\'s evidence present as corroboration.\" A pause. \"The Estate receiving its own evidence through its own process. That was the design. The weight of a thing found inside is different from the weight of a thing presented from outside.\"',
        extended:  '\"Edmund understood that distinction better than anyone.\" A pause. \"Six years of correspondence with the Sovereign. Six years of building toward one night when both sides\' evidence could be read in the same room simultaneously.\" They look at the testimony wall. \"Tonight was that night. The plan was complete. The evidence was in place.\" Another pause. \"It was interrupted before Edmund reached the Register.\"',
      },
      'Q4': {
        composed:  '\"The safe in your building.\" They say it without ceremony. \"Edmund assembled the proof from the Estate\'s side — the founding documents, the correspondence, the routing record placed by the Envoy in Archive Case 3. All of it is in the safe.\" A pause. \"The Heir has the combination. When you understand what both sides assembled and why, bring that understanding here. I will give you the combination.\" They look at the testimony wall. \"The Rite failed as the delivery mechanism. You are the alternative.\"',
        extended:  '\"Edmund requested that the safe be opened by someone who had seen both sides.\" A pause. \"Not a Compact member — we already know our half. Not an Estate member who doesn\'t know we exist. Someone who walked through both buildings on the same night and understood what they found.\" They look at Callum. \"He was precise about that requirement. He wrote it into the operational design six years ago.\" Another pause. \"You are the first person who has met it.\"',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The plan',
        unlock_condition: { after: 'Q2' },
        questions: {
          'HA1': {
            text:     '\"What would you have done differently.\"',
            type:     'focused_follow_up',
            cost:     5,
            response_composed:   'They are quiet for a moment. Not composure — consideration. \"We would have moved the Rite.\" A pause. \"If we had known the specific threat and its timing we would have moved to a date outside its window.\" They look at the testimony wall. \"The Rite was the anchor. Everything depended on the Rite. We built sixteen variables around it and never considered moving the anchor itself.\" Another pause. \"That is the variable we missed. Not a person. A decision we made eight months ago that closed off a category of response.\"',
            unlocks: 'HA2',
          },
          'HA2': {
            text:     '\"Why did the plan require the Rite specifically.\"',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'They pull a document from the testimony wall — not quickly, the way someone retrieves something they have been thinking about. \"The Rite is the only occasion when every senior Estate member is in the same room with the Register open.\" A pause. \"The proof had to be entered into the Record in front of witnesses who could not later claim they had not heard it. A private disclosure could be denied. A letter could be lost.\" They set the document down. \"Edmund understood that a reconciliation built on evidence presented to three people in a corridor would not hold. It had to be institutional. It had to be on the Record. The Rite was the only mechanism that satisfied both conditions.\"',
            unlocks: 'HA3',
            grants_node: 'heir_rite_was_only_mechanism',
          },
          'HA3': {
            text:     '\"What do you need from me now.\"',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'They look at the testimony wall. All thirty-one accounts. \"Tell me what you found.\" A pause. \"Not what I told you — what you found. What an investigator who came in from the outside, who had no prior knowledge of what either organisation was building toward — what did that investigator find that eight months of planning missed?\" They look at Callum. \"Because whatever that is — that is what the next operation has to account for. And I need to know what it is before we build the next thing.\"',
            grants_node: 'heir_wants_callums_independent_findings',
            triggers_puzzle: true,
            puzzle_type: 'witness-map',
          },
        },
      },

    },

    silence_fill: 'They look at the testimony wall. \"Thirty-one accounts from people who were certain they had planned for everything.\" A pause. \"They had not planned for everything.\" They say it without self-pity. They are including themselves.',

    silence_tell: 'The silence holds. They let it. Then: \"I keep coming back to the anchor.\" A pause. \"Not the seventeenth variable. The decision we made eight months ago to build everything around the Rite.\" Another pause. \"Every other variable was adjustable. The Rite was not. We never asked why.\" They look at Callum. \"That is the question I should have asked. Before the planning started. Before we placed the first document.\" A pause. \"Why is this the only mechanism. What happens if it fails.\" Another pause. \"I did not ask it. I am asking it now.\"',

  },
  // ── THE ENVOY ───────────────────────────────────────────────
  // Compact warmth rule applies. No composure decay.
  // Fifteen years in the field. Placed the routing record in Case 3.
  // EP1: the routing record, what it proves, the unknown actor. Nothing more.
  // No Correspondent as a named person. No recruitment history. No Seal plant.
  // That content is in the safe — it belongs to the deep ending.
  'envoy': {
    is_compact:        true,
    counter_strategy:  'withhold',
    optimal_technique: 'approach',
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'Fifteen years in the field. Accent impossible to place — not because it is disguised, because it has been nowhere long enough to settle. He was here before Callum arrived and does not appear to have been waiting. That is because he has done this before in other rooms.',
      sentence_avg: 'short',
      formality:    'medium',
      tell:         'He answers exactly what was asked. Nothing adjacent. Nothing implied. The tell is when he answers something you did not ask — it means the question was closer than he intended to let you get.',
    },

    composure_variants: {
      'Q1': {
        composed:  '\"Confirmation run. Six months ago.\" He says it the way someone states a completed task. \"I verified that the routing record had been placed in Archive Case 3 through the channel specified in the operational plan. The placement was correct. The seal was intact. The document was where it needed to be.\" A pause. \"My function in this operation was placement and verification. Both were completed.\"',
        extended:  '\"The routing record is the original.\" A pause. \"Not a copy. Not a transcription. The document that places an unknown actor inside the Estate\'s archive two weeks before the fabricated evidence surfaced forty-three years ago. The Compact has held it since.\" He looks at nothing in particular. \"Edmund Ashworth understood why it had to be found inside the Estate\'s own archive. Not presented from outside. Found inside. The weight of a thing found is different from the weight of a thing presented.\"',
      },
      'Q2': {
        composed:  '\"The routing record proves that someone was inside the Estate\'s archive two weeks before the evidence against Isabelle surfaced.\" He says it plainly. \"Genuine evidence does not require preparation at the site it will later implicate. This did. That is what the document establishes.\" A pause. \"Who that person was — we do not know. The routing record proves the act. It does not name the actor.\"',
        extended:  '\"Forty-three years the Compact has held this document.\" A pause. \"Forty-three years of knowing the separation was manufactured without being able to prove it to the Estate in a way the Estate could accept.\" He is precise about this — not frustration. A professional accounting of what exists and what does not. \"The routing record in Case 3 is the proof. The name behind it is still unknown. Finding that name is what comes after tonight.\"',
        grants_node: 'routing_record_placed_for_internal_discovery',
      },
      'Q3': {
        composed:  '\"Placement operations.\" He says it without ceremony. \"You identify the correct location. You identify the correct moment. You put the document there and you leave.\" A pause. \"This operation required placing the routing record inside the Estate\'s own archive so it would be found by the Estate\'s own process. Not handed over. Found. The institutional weight of a document discovered through legitimate channels is different from the weight of a document presented by an outside party.\" Another pause. \"Edmund Ashworth understood that distinction. He built the entire Rite operation around it.\"',
        extended:  '\"The routing record has been in the Compact\'s possession for forty-three years.\" He says it to the middle distance. \"Forty-three years of holding proof that could not be used because the moment to use it correctly had not arrived.\" A pause. \"The moment requires the right building, the right process, the right audience. A Rite at which both sides\' evidence could be read simultaneously into the same record.\" Another pause. \"The moment was interrupted. The document is still in place. The safe still holds what Ashworth assembled. The moment is not gone.\"',
        grants_node: 'envoy_routing_record_still_viable',
      },
      'Q4': {
        composed:  '\"Fifteen years.\" He says it without weight. \"The first three were transit work. Document transfer, verification runs, channel maintenance. The work that makes other work possible.\" A pause. \"The middle years were placement operations — the right document in the right location at the right time so that when the moment arrived the evidence was already where it needed to be.\" He looks at Callum. \"Six months ago I placed the routing record in Case 3. Tonight was the moment. The moment did not complete as designed. The evidence is still in place.\"',
        extended:  '\"You are the delivery mechanism now.\" A pause — not performance. A recalibration. \"That was not in the plan. It may be better than what was in the plan.\" He looks at Callum. \"The plan assumed the Rite would surface the record through an institutional process. An investigator who found it through independent inquiry carries a different kind of authority.\" Another pause. \"Ashworth understood that too. That is why he positioned you specifically. He anticipated both paths.\"',
        grants_node: 'envoy_placed_document_case3_six_months',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The routing record',
        unlock_condition: { after: 'Q2' },
        questions: {
          'EA1': {
            text:     '\"What does the routing record actually show.\"',
            type:     'focused_follow_up',
            cost:     5,
            response_composed:   '\"A date. A location. An access method.\" He says it simply. \"Someone entered the Estate\'s archive through a legitimate channel on a specific day forty-three years ago. The routing record is the Compact\'s documentation of that entry — filed at the time by someone who was monitoring the Estate\'s archive access without the Estate knowing.\" A pause. \"That entry happened two weeks before the evidence against Isabelle surfaced. The same archive. The same access method. The timing is not coincidental.\" Another pause. \"We know what was done. We do not know who did it. The safe in your building may hold that answer.\"',
            unlocks: 'EA2',
          },
          'EA2': {
            text:     '\"How has the Compact held this for forty-three years without acting.\"',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '\"The document proves an act. It does not prove who committed it.\" He says it with the precision of someone who has asked himself this question many times. \"You cannot present a document that says someone was in a building without naming who that someone was. The Estate would demand a name. We did not have one.\" A pause. \"Edmund Ashworth was the first person on the Estate side who understood what the document established and was willing to build the case from there — to accept the proof of the act and work toward the name rather than demanding the name first.\" Another pause. \"Six years of correspondence. That is how long it took to find one person on the other side who could hold both things simultaneously.\"',
            unlocks: 'EA3',
            grants_node: 'envoy_unknown_actor_profile_built',
          },
          'EA3': {
            text:     '\"Is there enough to expose the separation without the name.\"',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He considers this. Not quickly. \"The routing record establishes that the evidence was fabricated.\" A pause. \"The founding documents establish what existed before the fabrication. Together they prove the separation was manufactured — even without naming who manufactured it.\" He looks at Callum. \"The name would close it completely. Without the name it can still be challenged.\" Another pause. \"What is in the safe may provide the name. That is what tonight was designed to surface. The safe is the last piece.\"',
            grants_node: 'envoy_name_still_unknown',
          },
        },
      },
    },

    silence_fill: 'He stands in the same position he has stood in since Callum arrived. \"Placement is a clean discipline.\" He says it to the middle distance. \"You put the document where it needs to be. You verify the placement. You leave.\" A pause. \"What the document does after you leave is not your function. Your function ends at the placement.\" He is not defending himself. He is describing the architecture.',

    silence_tell: 'The silence. He is comfortable in it. Then: \"The routing record has been in the Compact\'s possession for forty-three years.\" A pause. \"Forty-three years of holding a document that proves the separation was manufactured, waiting for the moment when the Estate could receive that proof as its own evidence rather than as an accusation from outside.\" He looks at nothing in particular. \"Edmund Ashworth understood that moment. He designed tonight around it.\" Another pause. \"The moment was interrupted. The document is still in place.\" He looks at Callum. \"The moment is not gone. It is waiting for the correct delivery.\"',

  },
  // ── THE ARCHIVIST ────────────────────────────────────────────
  // Compact warmth rule applies. No composure decay.
  // Twelve years keeping the Black Register. Historian of the separation.
  // EP1: forty years of watching, the cost of the split, three who got close.
  // No Callum file. No Volume 40. No Bond. No EP2 content.
  'archivist': {
    is_compact:        true,
    counter_strategy:  'cooperate',
    optimal_technique: 'account',
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'Twelve years of records. The Black Register is open on the table. They did not open it when you entered — it has been open all evening. They have been reading it. Specifically the forty years before they arrived.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'They use the word \"entry\" for everything — a death, a decision, a decade. Everything becomes a record. The tell is when they stop using the word. When something is too large to be an entry, they go quiet.',
    },

    composure_variants: {
      'Q1': {
        composed:  'They do not look up when you enter. They are reading. After a moment they close the Register — not quickly, with the care of someone returning something to a specific state. \"Twelve years I have kept this record.\" A pause. \"My predecessor kept it for twenty-eight. Before that, someone else.\" They look at you. \"The methodology has never changed. Observe. Record. Do not intervene. The Register is not a plan. It is not an argument. It is what happened, written down, so that what happened cannot be said to have not happened.\"',
        extended:  '\"Tonight is the last entry.\" They look at the Register. \"After tonight the separation ends or it does not. Either way the Register closes.\" A pause. \"Forty years of entries. Tonight the last one.\" They are quiet for a moment. \"I find I am not ready for there to be no more entries. I thought I would be.\"',
      },
      'Q2': {
        composed:  '\"The Black Register is the record of what the Compact observed the Estate doing when the Estate believed it was unobserved.\" They say it the way someone says something they have said so many times it has worn smooth. \"Every Rite. Every senior appointment. Every member admitted or removed. Every significant decision the Estate made for forty years — we watched it and wrote it down.\" A pause. \"We were watching our own history. We did not know that then. We thought we were watching an enemy.\"',
        extended:  '\"The first entry is forty years ago. A Rite evening. The Sovereign attended as an observer — not as a member, as a witness. He wanted to see what they had become after the separation.\" They open the Register to a page near the beginning. \"He wrote: they are still the same shape we left behind. The form is identical. The function has diverged.\" Another pause. \"He wrote that entry himself. Every Sovereign since has kept the Register personally. It is the Compact\'s only rule about succession — the new Sovereign reads every entry before they write their first one.\"',
      },
      'Q3': {
        composed:  '\"We watched them keep records we were separated from. Rites we were not invited to. Decisions made without us that affected what we had built together.\" A pause. \"The Register documents forty years of that.\" They turn pages — not searching, moving through time. \"A member admitted in year seven who would have been known to us before the separation. A document sealed in year fourteen that references an agreement both sides had signed. A correspondence archived in year twenty-two that uses language from our shared founding.\" They close the Register. \"They were keeping the evidence of the partnership without knowing that is what they were keeping.\"',
        extended:  '\"The most difficult entries to write are the ones where the Estate made a decision that damaged them because we were not there.\" A pause. \"Year nineteen. A medical arrangement that went wrong because neither side had the other\'s records. Year thirty-one. A member removed through a review process that would have been challenged if either side had shared their files.\" They look at the Register. \"Forty years of entries like that. Things that would have been different. We were watching and we could not say anything because we did not know we were watching our own people.\"',
      },
      'Q4': {
        composed:  '\"The last forty years are in this Register.\" They look at it. \"What was before the Register is in the Sovereign\'s memory and in the documents your side kept without knowing what they were.\" A pause. \"The original agreement. The founding arrangement. Before the separation those documents existed on both sides. The Compact\'s copies are here. The Estate\'s copies — Ashworth found them. He was reconstructing something from both sides simultaneously. That is why tonight was possible at all.\"',
        extended:  '\"The Register shows what the separation cost across forty years. Entry by entry.\" They close it. \"The safe in your building holds what Ashworth assembled — the proof from the Estate\'s side of what was done to both of us. The Register is the proof from our side. Together they are the complete account.\" A pause. \"Neither side could see the complete account alone. That is what the Seal relied on. Two halves of the same truth, separated, each insufficient without the other.\" They look at you. \"You have been in both buildings tonight. You are the only person who has.\"',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The weight of the entries',
        unlock_condition: { after: 'Q3' },
        questions: {
          'AA1': {
            text:     '\"How many entries.\"',
            type:     'wait_silence',
            cost:     0,
            response_composed:   'They do not answer immediately. They open the Register and count. Not quickly — they already know the number. The counting is something else. \"One thousand four hundred and twelve.\" A pause. \"Not one thousand four hundred and twelve events. One thousand four hundred and twelve observations that were significant enough to record.\" They close it. \"The ones that were not significant enough to record — I do not know how many of those there were. That is the nature of a record. It contains what was noticed. It cannot contain what was not.\"',
            unlocks: 'AA2',
            grants_node: 'archivist_entry_count',
          },
          'AA2': {
            text:     '\"What is the hardest entry.\"',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'They do not hesitate. They know which one. \"Year twenty-three. A junior archivist on the Estate side filed a query about a document discrepancy. The query referenced a period and a document category that would have been immediately recognised by anyone on our side as belonging to the original agreement.\" A pause. \"She was removed within a week. The review found against her on a conduct matter unrelated to her query.\" They look at the Register. \"I wrote that entry myself. I was three years into the record at that point. I wrote: the Estate removed someone who found the edge of the truth. The Seal\'s operation continues to function.\" Another pause. \"That entry is the hardest because she was close. And because we could see that she was close. And because we could not tell her.\"',
            unlocks: 'AA3',
            grants_node: 'archivist_hardest_entry',
          },
          'AA3': {
            text:     '\"Did anyone on the Estate side ever get close before Ashworth.\"',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'A long pause. They look at the Register. \"Three times in forty years.\" They say it simply. \"The junior archivist in year twenty-three. A senior member in year thirty-one who began cross-referencing founding documents and was transferred to another function before he completed the work. And Lord Ashworth.\" Another pause. \"The first two did not have what Ashworth had — the Sovereign\'s correspondence. The Compact\'s side of the record. They were working from one half of a document that only makes sense when you have both halves.\" They close the Register. \"Ashworth had both halves. He spent six years assembling them. Tonight was the night both halves were supposed to be read aloud in the same room.\" A pause. \"He did not reach that room.\"',
            grants_node: 'archivist_three_attempts',
          },
        },
      },
    },

    silence_fill: 'They turn pages in the Register without reading aloud. After a moment: \"Year eleven. The Sovereign watched a Rite from the garden. He did not go inside. He stood at the gate for forty minutes and then left.\" They close the Register. \"I wrote that entry from his account. He said: I wanted to see if it felt like coming home. He said: it did not. It felt like watching something that had forgotten it was missing something.\"',

    silence_tell: 'The silence goes long. They let it. Then: \"The last entry before tonight is six days ago.\" A pause. \"Lord Ashworth sent a final letter to the Sovereign. The letter says: if something goes wrong, the record should continue. Whatever happens to the Rite, the Register should not close on a failure.\" They look at the Register. \"The Sovereign sent the letter here. He said: this belongs with the record.\" A pause. \"I have been deciding all evening whether to write tonight\'s entry as a failure or as the beginning of something.\" They look at you. \"You are the reason I have not decided yet.\"',

  },


};

// ── ACTIVE SESSION STATE ──────────────────────────────────────


// ── NARRATOR-AWARE RESPONSE RENDERER ─────────────────────
function _renderResponse(respEl, response, wpm) {
  if (!respEl) return;
  if (response.includes('||')) {
    const parts = response.split('||');
    const dialogue = parts[0].trimEnd();
    const narrator = parts[1].trim();
    respEl.textContent = '';
    if (typeof renderWordByWord === 'function') {
      renderWordByWord(respEl, dialogue, wpm || 60);
    } else {
      respEl.textContent = dialogue;
    }
    const delay = dialogue.split(' ').length * (wpm || 60) + 900;
    setTimeout(() => {
      const el = document.createElement('span');
      el.className = 'narrator';
      el.textContent = narrator;
      el.style.cssText = 'opacity:0;transition:opacity 700ms ease;display:block;';
      respEl.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = '1'; });
    }, delay);
  } else if (typeof renderWordByWord === 'function') {
    renderWordByWord(respEl, response, wpm || 60);
  } else {
    respEl.textContent = response;
  }
}
window._renderResponse = _renderResponse;

const _interrogationState = {
  activeChar:          null,
  selectedTechnique:   null,
  techniqueConfirmed:  false,
  approachShown:       false,
  approachConfirmed:   false,
  silenceTimer:        null,
  silenceFillFired:    false,
  silenceTellFired:    false,
  evidenceQueue:       [],    // Items player has presented this conversation
  committedStatements: {},    // charId → topic → statement
  conversationOrder:   [],    // Order characters were talked to this session
  techniqueHistory:    {},    // charId → technique used
};

// ── TECHNIQUE SELECTION UI ────────────────────────────────────

function openTechniqueSelector(charId) {
  const data = INTERROGATION_DATA[charId];
  if (!data || (data && data.engine === 'rowe')) {
    // Character not in interrogation system, or Alistair Rowe (own engine) — open normally
    if (typeof window._openConversationDirect === 'function') {
      window._openConversationDirect(charId);
    }
    return;
  }

  // Hale and Northcott use new line-of-questioning engine — skip technique selector
  if (charId === 'pemberton-hale' || charId === 'northcott') {
    if (typeof window._openConversationDirect === 'function') {
      window._openConversationDirect(charId);
    }
    return;
  }

  _interrogationState.activeChar = charId;

  // Build technique selector — portrait top, baseline below, choices at bottom
  const overlay = document.createElement('div');
  overlay.id = 'technique-selector';
  overlay.style.cssText = [
    'position:absolute',
    'inset:0',
    'z-index:500',
    'background:#080503',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'overflow:hidden',
    'font-family:var(--font-ui)',
  ].join(';');

  // Portrait zone — 28% of screen
  const portraitZone = document.createElement('div');
  const portraitUrl = typeof getCharPortrait === 'function' ? getCharPortrait(charId) : (typeof getCharAsset === 'function' ? getCharAsset(charId) : '');
  portraitZone.style.cssText = [
    'flex:0 0 auto',
    `height:calc(var(--app-height, 100vh) * 0.22)`,
    'width:42%',
    'align-self:center',
    'position:relative',
    'overflow:hidden',
    'border:1px solid rgba(184,150,12,0.2)',
  ].join(';');
  if (portraitUrl) {
    portraitZone.style.backgroundImage = `url(${portraitUrl})`;
    portraitZone.style.backgroundSize = 'cover';
    portraitZone.style.backgroundPosition = 'center 25%';
  }

  // Name label over portrait
  const nameLabel = document.createElement('div');
  nameLabel.style.cssText = [
    'position:absolute',
    'bottom:0','left:0','right:0',
    'padding:8px 16px',
    'background:linear-gradient(transparent,rgba(8,5,3,0.9))',
    'font-size:9px',
    'color:var(--gold)',
    'letter-spacing:0.25em',
    'text-transform:uppercase',
    'font-family:var(--font-ui)',
  ].join(';');
  const charData = window.CHARACTERS && window.CHARACTERS[charId];
  nameLabel.textContent = charData ? charData.display_name.toUpperCase() : charId;
  portraitZone.appendChild(nameLabel);
  overlay.appendChild(portraitZone);

  // Baseline — natural height, no expansion
  const baseline = data.baseline;
  const baselineEl = document.createElement('div');
  baselineEl.style.cssText = [
    'flex:0 0 auto',
    'width:100%',
    'box-sizing:border-box',
    'padding:12px 20px',
    'font-size:12px',
    'color:rgba(180,165,130,0.75)',
    'line-height:1.6',
    'font-style:italic',
    'border-bottom:1px solid rgba(42,37,28,0.3)',
  ].join(';');
  baselineEl.textContent = baseline.text;
  overlay.appendChild(baselineEl);

  // Five choices — margin-top:auto pins them to bottom
  const choicesWrap = document.createElement('div');
  choicesWrap.style.cssText = [
    'margin-top:24px',
    'width:100%',
    'box-sizing:border-box',
    'padding:0 20px 16px',
    'background:#080503',
  ].join(';');

  const TECHNIQUE_HINTS = {
    account:  (window.TECHNIQUE_REGISTER && window.TECHNIQUE_REGISTER.account)  || 'narrative',
    pressure: (window.TECHNIQUE_REGISTER && window.TECHNIQUE_REGISTER.pressure) || 'confrontation',
    approach: (window.TECHNIQUE_REGISTER && window.TECHNIQUE_REGISTER.approach) || 'conversation',
    record:   (window.TECHNIQUE_REGISTER && window.TECHNIQUE_REGISTER.record)   || 'precision',
    wait:     (window.TECHNIQUE_REGISTER && window.TECHNIQUE_REGISTER.wait)     || 'patience',
  };

  const femaleChars = ['ashworth', 'voss', 'crane'];
  const isFemale = femaleChars.includes(charId);

  Object.values(TECHNIQUES).forEach(tech => {
    const btn = document.createElement('button');
    btn.style.cssText = [
      'display:block',
      'width:100%',
      'text-align:left',
      'background:transparent',
      'border:none',
      'border-bottom:1px solid rgba(42,37,28,0.2)',
      'padding:10px 0',
      'cursor:pointer',
      'font-family:var(--font-ui)',
      '-webkit-tap-highlight-color:transparent',
    ].join(';');

    const callumLine = document.createElement('div');
    callumLine.style.cssText = 'font-size:12px;color:var(--cream);letter-spacing:0.02em;line-height:1.4;';
    const lineText = isFemale
      ? tech.callum_line
          .replace('He knows I know', 'She knows I know')
          .replace('Tell him almost everything', 'Tell her almost everything')
          .replace('he fills it with', 'she fills it with')
      : tech.callum_line;
    callumLine.textContent = `"${lineText}"`;
    btn.appendChild(callumLine);

    const hintLine = document.createElement('div');
    hintLine.style.cssText = 'font-size:13px;color:rgba(200,170,110,0.9);font-style:italic;margin-top:5px;line-height:1.4;letter-spacing:0.08em;text-transform:lowercase;';
    hintLine.textContent = tech.label || (TECHNIQUE_HINTS[tech.id] || '');
    btn.appendChild(hintLine);

    btn.onclick = (e) => {
      e.stopPropagation();
      overlay.remove();
      setTimeout(() => _confirmTechniqueSelected(charId, tech.id), 50);
    };
    choicesWrap.appendChild(btn);
  });

  overlay.appendChild(choicesWrap);

  // Mount inside game screen — never body
  const gameScreen = document.getElementById('screen-game') || document.body;
  gameScreen.appendChild(overlay);

  // Mark approach shown
  _interrogationState.approachShown = true;
  NocturneEngine.emit('approachCompleted', { charId });
}

function _confirmTechniqueSelected(charId, techniqueId) {
  _interrogationState.selectedTechnique  = techniqueId;
  _interrogationState.techniqueConfirmed = true;
  _interrogationState.techniqueHistory[charId] = techniqueId;

  // Log to behavioral system
  NocturneEngine.emit('techniqueSelected', { charId, technique: techniqueId });

  // Reset pivot announcements for this character — fresh interrogation
  // gets fresh beats if branches reopen in subsequent questions.
  if (window._pivotAnnounced) {
    Object.keys(window._pivotAnnounced).forEach(k => {
      if (k.startsWith(charId + ':')) delete window._pivotAnnounced[k];
    });
  }

  // Reset escalation state on new conversation — each interrogation
  // session starts with a clean slate. Penalties do not carry across
  // reopens; the player gets a fair fresh start on revisit.
  if (typeof resetEscalation === 'function') {
    resetEscalation(charId);
  }

  // Handle technique-aware characters
  const data = INTERROGATION_DATA[charId];
  if (data && data.technique_awareness && data.technique_awareness[techniqueId]) {
    const awareness = data.technique_awareness[techniqueId];
    // Pre-load this into the response so it shows before Q1
    gameState._techniqueAwarenessLine = awareness;
  }

  // Start silence timer if Wait technique
  if (techniqueId === 'wait') {
    _startSilenceSystem(charId);
  }

  // Open the actual conversation
  if (typeof window._openConversationDirect === 'function') {
    window._openConversationDirect(charId);
  }

  // Show technique awareness line after intro
  if (gameState._techniqueAwarenessLine) {
    setTimeout(() => {
      const resp = document.getElementById('char-response');
      if (resp && data.technique_awareness) {
        const line = data.technique_awareness[techniqueId];
        if (line) {
          resp.textContent = line;
          gameState._techniqueAwarenessLine = null;
        }
      }
    }, 800);
  }
}

// ── TECHNIQUE SWITCH ──────────────────────────────────────────

function switchTechnique(charId) {
  const current = _interrogationState.selectedTechnique;
  if (!current) return;

  // Build mini-selector with remaining techniques
  const switchOverlay = document.createElement('div');
  switchOverlay.id = 'technique-switch';
  switchOverlay.style.cssText = [
    'position:absolute',
    'bottom:0',
    'left:0',
    'right:0',
    'z-index:190',
    'background:rgba(8,5,3,0.98)',
    'border-top:1px solid rgba(42,37,28,0.5)',
    'padding:16px 20px 24px',
    'font-family:var(--font-ui)',
  ].join(';');

  const switchLabel = document.createElement('div');
  switchLabel.style.cssText = 'font-size:9px;color:rgba(184,150,12,0.4);letter-spacing:0.25em;text-transform:uppercase;margin-bottom:12px;';
  switchLabel.textContent = 'CHANGE APPROACH — one switch permitted';
  switchOverlay.appendChild(switchLabel);

  Object.values(TECHNIQUES).forEach(tech => {
    if (tech.id === current) return; // Skip current

    const btn = document.createElement('button');
    btn.style.cssText = [
      'display:block',
      'width:100%',
      'text-align:left',
      'background:transparent',
      'border:none',
      'border-bottom:1px solid rgba(42,37,28,0.15)',
      'padding:10px 0',
      'cursor:pointer',
      'font-family:var(--font-ui)',
    ].join(';');

    const line = document.createElement('div');
    line.style.cssText = 'font-size:12px;color:var(--cream-dim);';
    line.textContent = `"${tech.callum_line}"`;
    btn.appendChild(line);

    btn.onclick = () => {
      switchOverlay.remove();
      const from = _interrogationState.selectedTechnique;
      _interrogationState.selectedTechnique = tech.id;
      NocturneEngine.emit('techniqueSwitched', { charId, from, to: tech.id });

      // Fire the technique_shift_response
      const data = INTERROGATION_DATA[charId];
      if (data) {
        const shiftResp = data.technique_shift_response;
        if (shiftResp) {
          const resp = document.getElementById('char-response');
          if (resp) resp.textContent = shiftResp;
          // Composure cost for the character noticing the shift
          _applyComposureCost(charId, 8);
        }
      }

      // Start/stop silence system
      if (tech.id === 'wait') {
        _startSilenceSystem(charId);
      } else {
        _stopSilenceSystem();
      }
    };

    switchOverlay.appendChild(btn);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'display:block;width:100%;text-align:center;background:transparent;border:none;color:rgba(100,90,70,0.4);font-family:var(--font-ui);font-size:10px;padding:12px 0 0;cursor:pointer;letter-spacing:0.1em;';
  cancelBtn.onclick = () => switchOverlay.remove();
  switchOverlay.appendChild(cancelBtn);

  const sg = document.getElementById('screen-game') || document.body;
  sg.appendChild(switchOverlay);
}

// ── COMPOSURE VARIANT RESPONSE ────────────────────────────────

function getComposureVariantResponse(charId, qId) {
  const data = INTERROGATION_DATA[charId];
  if (!data || !data.composure_variants) return null;

  const variants = data.composure_variants[qId];
  if (!variants) return null;

  // Technique-keyed variants (e.g. Vivienne — composure_floor 100, never decays)
  // Route by selected technique instead of composure state
  const hasTechVariants = variants.wait || variants.approach || variants.record || variants.pressure;
  if (hasTechVariants) {
    const tech = _interrogationState.selectedTechnique || 'account';
    const techMap = { wait: 'wait', approach: 'approach', account: 'composed', record: 'record', pressure: 'pressure' };
    const key = techMap[tech] || 'composed';
    return variants[key] || variants.composed || null;
  }

  const charState = (gameState.characters && gameState.characters[charId]) || {};
  const composure = charState.composure !== undefined ? charState.composure : 100;

  if      (composure >= 80) return variants.composed   || null;
  else if (composure >= 65) return variants.controlled || variants.composed || null;
  else if (composure >= 45) return variants.strained   || variants.controlled || null;
  else if (composure >= 20) return variants.fractured  || variants.strained  || null;
  else                      return variants.fractured  || null;
}

// ── COMPOSURE COST APPLICATION ────────────────────────────────

function _applyComposureCost(charId, baseCost) {
  const tech = TECHNIQUES[_interrogationState.selectedTechnique || 'account'];
  const multiplier = tech ? tech.composure_multiplier : 1.0;
  const actualCost = Math.round(baseCost * multiplier);

  const charState = gameState.characters[charId] || {};
  const current   = charState.composure !== undefined ? charState.composure : 100;
  const data      = INTERROGATION_DATA[charId];
  const floor     = data ? data.composure_floor : 0;

  const newComposure = Math.max(floor, current - actualCost);
  charState.composure = newComposure;
  gameState.characters[charId] = charState;

  // ── TRANSITION BEAT (#2) ────────────────────────────────
  // Detect composure state crossing and surface the per-character
  // physical beat. Uses the ui.js threshold scheme (70/55/40)
  // with an explicit collapsed band at <=20 for fracture→collapse.
  try {
    const _stateFor = (c) => {
      if (c > 70) return 'composed';
      if (c > 55) return 'controlled';
      if (c > 40) return 'strained';
      if (c > 20) return 'fractured';
      return 'collapsed';
    };
    const prevState = _stateFor(current);
    const nextState = _stateFor(newComposure);
    if (prevState !== nextState) {
      const line = getComposureTransitionLine(charId, prevState, nextState);
      if (line) {
        const resp = document.getElementById('char-response');
        if (resp) {
          const beat = document.createElement('div');
          beat.className = 'composure-transition-beat';
          beat.textContent = line;
          beat.style.cssText = 'margin-top:14px;padding-top:10px;border-top:1px dashed rgba(170,140,90,0.18);font-size:12px;color:rgba(190,170,130,0.78);font-style:italic;letter-spacing:0.02em;line-height:1.6;opacity:0;transition:opacity 600ms ease;';
          resp.appendChild(beat);
          requestAnimationFrame(() => { beat.style.opacity = '1'; });
        }
      }
    }
  } catch(e) { /* non-fatal */ }

  if (typeof updateComposureState === 'function') {
    updateComposureState(charId);
  }

  // PORTRAIT LAYER 1 — update ambient breath to match new composure state
  try {
    if (typeof applyPortraitBreath === 'function') applyPortraitBreath(charId);
  } catch(e) { /* non-fatal */ }

  // Check fracture — threshold lowered by escalation bonus if set.
  // (#F level 3: fracture floor "rise" means harder-to-break —
  // the break point drops so composure must fall further.)
  const baseThreshold = data ? data.fracture_threshold : 40;
  const bonus = (typeof getFractureFloorBonus === 'function')
    ? getFractureFloorBonus(charId) : 0;
  const threshold = Math.max(0, baseThreshold - bonus);
  if (newComposure <= threshold && current > threshold) {
    // PORTRAIT LAYER 2 — fracture crossed: fire break reaction
    try {
      if (typeof firePortraitReaction === 'function') firePortraitReaction(charId, 'break');
    } catch(e) { /* non-fatal */ }
    _fireFracture(charId);
  }

  return newComposure;
}

// ── FRACTURE SYSTEM ───────────────────────────────────────────

function _fireFracture(charId) {
  const tech = TECHNIQUES[_interrogationState.selectedTechnique || 'account'];
  const snapBonus = tech ? tech.snap_bonus : 0;

  // Check if snap limit also reached simultaneously → Collapse
  const char = window.CHARACTERS && window.CHARACTERS[charId];
  if (char) {
    const snapLimit = (char.snap_limit || 3) + snapBonus;
    const answered  = Object.keys(gameState.char_dialogue_complete[charId] || {}).length;
    if (answered >= snapLimit) {
      NocturneEngine.emit('collapseFired', { charId });
      _closeConversationAfterFracture(charId, true);
      return;
    }
  }

  NocturneEngine.emit('fractureFired', { charId });
  _closeConversationAfterFracture(charId, false);
}

function _closeConversationAfterFracture(charId, isCollapse) {
  // Render the fractured response
  const data      = INTERROGATION_DATA[charId];
  const variants  = data && data.composure_variants;
  const lastQId   = _getLastAnsweredQId(charId);
  const fracResp  = variants && lastQId && variants[lastQId] && variants[lastQId].fractured;

  if (fracResp) {
    const resp = document.getElementById('char-response');
    if (resp) {
      resp.style.opacity = '0';
      setTimeout(() => {
        resp.textContent = fracResp;
        resp.style.transition = 'opacity 1200ms';
        resp.style.opacity    = '1';
      }, 1200); // The pause IS the tell — 1.2s silence before fractured response
    }
  }

  // Lock questions — panel stays open
  setTimeout(() => {
    const list = document.getElementById('questions-list');
    if (list) {
      list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">They have said what they are going to say.</div>';
    }
    if (typeof saveGame === 'function') saveGame();
  }, isCollapse ? 2000 : 3000);
}

// ── SILENCE SYSTEM (WAIT TECHNIQUE) ───────────────────────────

function _startSilenceSystem(charId) {
  _stopSilenceSystem(); // Clear any existing

  const data = INTERROGATION_DATA[charId];
  if (!data) return;

  _interrogationState.silenceFillFired = false;
  _interrogationState.silenceTellFired = false;

  // Silence fill — fires at 8 seconds
  const fillTimer = setTimeout(() => {
    if (_interrogationState.silenceFillFired) return;
    _interrogationState.silenceFillFired = true;

    const resp = document.getElementById('char-response');
    if (resp && data.silence_fill) {
      resp.textContent = data.silence_fill;
      NocturneEngine.emit('silenceFillFired', { charId });
    }
  }, 8000);

  // Silence tell — fires at 30 seconds
  const tellTimer = setTimeout(() => {
    if (_interrogationState.silenceTellFired) return;
    _interrogationState.silenceTellFired = true;

    const resp = document.getElementById('char-response');
    if (resp && data.silence_tell) {
      resp.style.opacity = '0';
      resp.innerHTML = '';
      setTimeout(() => {
        if (typeof window._renderResponse === 'function') {
          window._renderResponse(resp, data.silence_tell, 55);
        } else {
          resp.textContent = data.silence_tell;
        }
        resp.style.transition = 'opacity 1000ms';
        resp.style.opacity    = '1';
        NocturneEngine.emit('silenceTellFired', { charId });
        if (typeof haptic === 'function') haptic([20, 15, 20]);
      }, 600);
    }
  }, 30000);

  _interrogationState.silenceTimer = { fillTimer, tellTimer };
}

function _stopSilenceSystem() {
  if (_interrogationState.silenceTimer) {
    clearTimeout(_interrogationState.silenceTimer.fillTimer);
    clearTimeout(_interrogationState.silenceTimer.tellTimer);
    _interrogationState.silenceTimer = null;
  }
}

// ── SCHARFF CORRECTIONS ───────────────────────────────────────

function checkScharffCorrections(charId, narrativeStatement) {
  const data = INTERROGATION_DATA[charId];
  if (!data || !data.scharff_corrections) return null;

  // Find matching correction
  const key = Object.keys(data.scharff_corrections).find(k => {
    return narrativeStatement.toLowerCase().includes(k.split('_').join(' ').toLowerCase()) ||
           k.split('_').some(word => narrativeStatement.toLowerCase().includes(word));
  });

  if (!key) return null;

  const correction = data.scharff_corrections[key];
  NocturneEngine.emit('scharffCorrection', { charId });
  return correction;
}

// ── WORD TELL ─────────────────────────────────────────────────


// ── SUE EVIDENCE SYSTEM ───────────────────────────────────────

function presentEvidenceToChar(charId, itemId) {
  const data = INTERROGATION_DATA[charId];
  if (!data) {
    // Fall back to existing fireDeception
    if (typeof window._originalFireDeception === 'function') {
      window._originalFireDeception(charId, itemId);
    }
    return;
  }

  const committed = _interrogationState.committedStatements[charId] || {};
  const sueTriggers = data.sue_inconsistency || {};
  const trigger     = sueTriggers[itemId];

  if (trigger && committed[trigger.committed_after]) {
    // SUE: evidence revealed after committed statement — inconsistency
    NocturneEngine.emit('evidenceRevealedAfterQuestion', { charId, itemId });

    const resp = document.getElementById('char-response');
    if (resp) resp.textContent = trigger.reveal_response;

    // Show inconsistency note
    _showInconsistencyNote(trigger.inconsistency_note);

    // Composure cost
    _applyComposureCost(charId, COMPOSURE_COSTS.evidence_reveal);
  } else {
    // Early disclosure — cooperation branch
    NocturneEngine.emit('evidenceRevealedBeforeQuestion', { charId, itemId });

    // Use existing deception/evidence system
    if (typeof window._originalFireDeception === 'function') {
      window._originalFireDeception(charId, itemId);
    }
  }
}

function _showInconsistencyNote(note) {
  if (!note) return;
  const noteEl = document.createElement('div');
  noteEl.style.cssText = [
    'position:fixed',
    'bottom:120px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:rgba(8,5,3,0.97)',
    'border:1px solid rgba(184,150,12,0.2)',
    'padding:10px 16px',
    'font-family:var(--font-ui)',
    'font-size:9px',
    'color:rgba(184,150,12,0.6)',
    'letter-spacing:0.08em',
    'max-width:300px',
    'text-align:center',
    'z-index:160',
    'opacity:0',
    'transition:opacity 500ms',
    'line-height:1.5',
  ].join(';');
  noteEl.textContent = note;
  document.body.appendChild(noteEl);
  requestAnimationFrame(() => { noteEl.style.opacity = '1'; });
  setTimeout(() => {
    noteEl.style.opacity = '0';
    setTimeout(() => noteEl.remove(), 500);
  }, 4000);
}

// ── CONTAMINATION CHECK ───────────────────────────────────────

function getContaminationLine(charId) {
  const data = INTERROGATION_DATA[charId];
  if (!data || !data.contamination) return null;

  const order = _interrogationState.conversationOrder;
  if (order.length < 2) return null;

  // Check if any contamination-linked chars were talked to before this one
  const linkedChars  = Object.keys(data.contamination);
  const prevTalkedTo = order.slice(0, -1); // Everyone before current

  const matched = linkedChars.find(c => prevTalkedTo.includes(c));
  if (!matched) return null;

  return data.contamination[matched];
}

// ── COGNITIVE LOAD QUESTION ───────────────────────────────────

function fireCognitiveLoadQuestion(charId) {
  const data = INTERROGATION_DATA[charId];
  if (!data || !data.cognitive_load_response) return;

  // Haptic during the question
  if (typeof haptic === 'function') haptic([30]);

  const resp = document.getElementById('char-response');
  if (resp) {
    resp.textContent = data.cognitive_load_response;
    NocturneEngine.emit('wordTellSurfaced', { charId, tell: 'Cognitive load response — character revealed more than intended under divided attention.' });
  }

  _applyComposureCost(charId, COMPOSURE_COSTS.cognitive_load);
}

// ── BRANCH CHAIN SYSTEM ───────────────────────────────────────

function getAvailableBranches(charId) {
  const data = INTERROGATION_DATA[charId];
  if (!data || !data.backstory_chain) return [];

  const available = [];
  const charState = (gameState.characters && gameState.characters[charId]) || {};
  const composure = charState.composure !== undefined ? charState.composure : 100;
  const answered  = gameState.char_dialogue_complete[charId] || {};

  Object.entries(data.backstory_chain).forEach(([branchId, branch]) => {
    const cond = branch.unlock_condition;
    if (!cond) return;

    let unlocked = false;

    // Composure-based unlock
    if (cond.composure_lte !== undefined && composure <= cond.composure_lte) unlocked = true;
    if (cond.or_item && typeof hasItem === 'function' && hasItem(cond.or_item)) unlocked = true;
    if (cond.after && answered[cond.after]) unlocked = true;
    if (cond.or_after && answered[cond.or_after]) unlocked = true;
    if (cond.item && typeof hasItem === 'function' && hasItem(cond.item)) unlocked = true;

    // Room-based unlock
    if (cond.room && gameState.currentRoom === cond.room) unlocked = true;
    if (cond.tunnel_found && gameState.tunnelFound) unlocked = true;

    // Cross-character unlock
    if (cond.requires_char_branch) {
      const { char: otherChar, branch: otherBranch } = cond.requires_char_branch;
      const completedBranches = gameState._completedBranches || {};
      if (completedBranches[otherChar] && completedBranches[otherChar][otherBranch]) {
        unlocked = true;
      }
    }


    // Same-character branch prerequisite
    if (cond.requires_branch) {
      const completedBranches = gameState._completedBranches || {};
      const prereqDone = completedBranches[charId] && completedBranches[charId][cond.requires_branch];
      if (!prereqDone) unlocked = false;
    }
    if (unlocked) {
      // Check not already completed
      const completedBranches = gameState._completedBranches || {};
      const alreadyDone = completedBranches[charId] && completedBranches[charId][branchId];
      if (!alreadyDone) available.push({ branchId, branch });
    }
  });

  return available;
}

function renderBranchQuestions(charId) {
  // Called alongside renderQuestions — adds branch questions to the list
  const branches   = getAvailableBranches(charId);
  const list       = document.getElementById('questions-list');
  if (!list || branches.length === 0) return;

  // ── BRANCH LOCK (#F level 2) ──────────────────────────────
  // High-stakes suspects with 2+ consecutive poor techniques lock
  // their branches until composure recovers 15 points from lock point.
  if (typeof isBranchLocked === 'function' && isBranchLocked(charId)) {
    // Render a visible locked placeholder instead of branch rows
    const lockRow = document.createElement('div');
    lockRow.className = 'question-item question-branch-locked';
    lockRow.textContent = 'Deeper ground is closed. Work back to composure.';
    lockRow.style.cssText = ';border-left:2px solid rgba(210,140,110,0.4);padding-left:16px;color:rgba(190,150,120,0.55);font-style:italic;cursor:not-allowed;pointer-events:none;';
    list.appendChild(lockRow);
    return;
  }

  branches.forEach(({ branchId, branch }) => {
    Object.entries(branch.questions).forEach(([qId, q]) => {
      const answered = gameState.char_dialogue_complete[charId] || {};
      if (answered[`branch_${branchId}_${qId}`]) return;

      // Check within-branch requires
      if (q.unlocks) {
        const prevQId = _getPrevBranchQId(branch, qId);
        if (prevQId && !answered[`branch_${branchId}_${prevQId}`]) return;
      }

      // Check composure requirement
      const charState = (gameState.characters && gameState.characters[charId]) || {};
      const composure = charState.composure !== undefined ? charState.composure : 100;
      if (q.composure_required && composure > q.composure_required) return;

      const div = document.createElement('div');
      div.className = 'question-item question-branch';
      div.textContent = q.text;
      div.style.cssText += ';border-left:2px solid rgba(184,150,12,0.2);padding-left:16px;';
      div.onclick = (e) => { e.stopPropagation(); askBranchQuestion(charId, branchId, qId, q); };
      list.appendChild(div);
    });
  });
}

function askBranchQuestion(charId, branchId, qId, q) {
  if (!gameState.char_dialogue_complete[charId]) gameState.char_dialogue_complete[charId] = {};
  gameState.char_dialogue_complete[charId][`branch_${branchId}_${qId}`] = true;

  // Apply composure cost
  const cost = COMPOSURE_COSTS[q.type] || COMPOSURE_COSTS.focused_follow_up;
  _applyComposureCost(charId, cost);

  // Get composure-appropriate response
  const charState  = (gameState.characters && gameState.characters[charId]) || {};
  const composure  = charState.composure !== undefined ? charState.composure : 100;

  let response;
  if      (composure >= 80 && q.response_composed)   response = q.response_composed;
  else if (composure >= 65 && q.response_controlled) response = q.response_controlled || q.response_composed;
  else if (composure >= 45 && q.response_strained)   response = q.response_strained   || q.response_controlled || q.response_composed;
  else if (q.response_fractured)                     response = q.response_fractured  || q.response_strained;
  else                                               response = q.response_composed   || '';

  const resp = document.getElementById('char-response');
  if (resp) {
    _renderResponse(resp, response, 60);
  }

  // Snapback — shown as a tappable follow-up, not auto-fired
  // Player reads the fractured response first, then taps to see snapback
  if (q.snapback && charState.composure <= 45) {
    setTimeout(() => {
      const list = document.getElementById('questions-list');
      if (!list) return;
      const snapDiv = document.createElement('div');
      snapDiv.className = 'question-item';
      snapDiv.style.cssText = 'color:var(--cream-dim);font-style:italic;font-size:11px;';
      snapDiv.textContent = '—';
      snapDiv.onclick = () => {
        if (typeof window.cancelWordByWord === 'function') window.cancelWordByWord();
        const snapResp = document.getElementById('char-response');
        if (snapResp) snapResp.textContent = q.snapback;
        snapDiv.remove();
        NocturneEngine.emit('snapbackFired', { charId });
        if (typeof renderQuestions === 'function') renderQuestions(charId);
      };
      // Prepend so it shows above other questions
      list.insertBefore(snapDiv, list.firstChild);
    }, 800);
  }

  // Grant information node — surface only; capture happens on pencil tap.
  // The questionAnswered event still fires here because it tracks the dialogue beat.
  if (q.grants_node) {
    if (typeof window._markNode === 'function') window._markNode(q.grants_node);
    if (typeof window.surfaceNode === 'function') {
      window.surfaceNode(q.grants_node, charId);
    }
  }
  if (q.grants_node_secondary) {
    if (typeof window._markNode === 'function') window._markNode(q.grants_node_secondary);
    if (typeof window.surfaceNode === 'function') {
      window.surfaceNode(q.grants_node_secondary, charId);
    }
  }
  if (q.grants_node) {
    NocturneEngine.emit('questionAnswered', { charId, qId: `branch_${branchId}_${qId}`, qType: q.type });
  }

  // Dialogue-triggered puzzle — fires after response renders
  if (q.triggers_puzzle && q.puzzle_type) {
    setTimeout(() => {
      NocturneEngine.emit('openPuzzle', { puzzleType: q.puzzle_type, chain: null });
    }, 1200);
  }

  // Cross-link handling — fire cross_links if present
  if (q.cross_links) {
    q.cross_links.forEach(link => {
      if (link.cross_id) {
        // Check if other side is also complete
        const crossKey = `_crossComplete_${link.cross_id}`;
        if (!window.gameState[crossKey]) {
          window.gameState[crossKey] = { [charId]: true };
        } else {
          window.gameState[crossKey][charId] = true;
        }
        // If both sides marked — fire cross complete event
        const sides = window.gameState[crossKey];
        if (Object.keys(sides).length >= 2) {
          NocturneEngine.emit(`${link.cross_id}_cross_complete`, {});
          NocturneEngine.emit('crossComplete', { crossId: link.cross_id });
        }
      }
    });
  }

  // Fracture
  if (q.triggers_fracture) {
    setTimeout(() => {
      if (q.closes_conversation) {
        const panel = document.getElementById('conversation-panel');
        if (panel) panel.classList.remove('open');
      }
    }, 5000);
    NocturneEngine.emit('fractureFired', { charId });
  }

  // Cross-links
  if (q.cross_links) {
    q.cross_links.forEach(link => {
      NocturneEngine.emit('crossLinkUnlocked', { fromChar: charId, fromBranch: branchId, toChar: link.char, toBranch: link.branch });
    });
  }

  // Mark branch complete if last question
  if (!q.unlocks) {
    _markBranchComplete(charId, branchId, q);
  }

  // Update questions list
  if (typeof renderQuestions === 'function') renderQuestions(charId);

  if (typeof saveGame === 'function') saveGame();
}

function _markBranchComplete(charId, branchId, lastQ) {
  if (!gameState._completedBranches) gameState._completedBranches = {};
  if (!gameState._completedBranches[charId]) gameState._completedBranches[charId] = {};
  gameState._completedBranches[charId][branchId] = true;

  const data      = INTERROGATION_DATA[charId];
  const branch    = data && data.backstory_chain && data.backstory_chain[branchId];
  const isContradicting = branch && _branchContradicts(charId, branchId);

  NocturneEngine.emit('branchCompleted', { charId, branchId, isContradicting });
}

function _branchContradicts(charId, branchId) {
  // Branches that contradict the working hypothesis
  const hyp = gameState._workingHypothesis;
  if (!hyp || hyp === 'surgeon') return false; // Surgeon is correct — no contradiction

  // Branches that implicate the Surgeon contradict wrong hypotheses
  const surgeonBranches = ['CA3', 'SA2', 'UI_A2'];
  return surgeonBranches.some(qId => {
    const answered = gameState.char_dialogue_complete[charId] || {};
    return answered[`branch_${branchId}_${qId}`];
  });
}

function _getPrevBranchQId(branch, currentQId) {
  const qIds = Object.keys(branch.questions);
  const idx  = qIds.indexOf(currentQId);
  return idx > 0 ? qIds[idx - 1] : null;
}

function _getLastAnsweredQId(charId) {
  const answered = gameState.char_dialogue_complete[charId] || {};
  const keys     = Object.keys(answered).filter(k => !k.startsWith('_') && !k.startsWith('branch'));
  return keys[keys.length - 1] || null;
}

// ── DIRECT CONFRONTATION ──────────────────────────────────────

function fireDirectConfrontation(charId) {
  const data       = INTERROGATION_DATA[charId];
  const guiltyChar = 'surgeon';
  const isGuilty   = (charId === guiltyChar);

  // Cost
  _applyComposureCost(charId, COMPOSURE_COSTS.direct_confrontation);

  const resp = document.getElementById('char-response');
  if (!resp) return;

  if (isGuilty) {
    // Surgeon — manages it perfectly. Word tell may surface.
    const surgResp = data && data.direct_confrontation_response && data.direct_confrontation_response.management;
    if (surgResp) {
      resp.textContent = surgResp;
    }
  } else {
    // Innocent — indignation
    const char   = window.CHARACTERS && window.CHARACTERS[charId];
    const snapR  = char && char.dialogue && Object.values(char.dialogue).find(q => q.snap);
    if (snapR) resp.textContent = snapR.response;
  }

  NocturneEngine.emit('directConfrontationUsed', { charId, targetIsGuilty: isGuilty });

  // Record working hypothesis
  if (!gameState._workingHypothesis) {
    gameState._workingHypothesis = charId;
    NocturneEngine.emit('hypothesisFormed', { suspect: charId });
  }
}

// ── CONVERSATION TRACKING ─────────────────────────────────────

NocturneEngine.on('roomLeft', ({ roomId }) => {
  _stopSilenceSystem();
});

// Track conversation order for contamination
// ── CONVERSATION ORDER TRACKING ───────────────────────────────
// Tracks contamination — which characters were spoken to before current.
// Hooks via NocturneEngine event fired from openTechniqueSelector.
NocturneEngine.on('techniqueSelected', ({ charId }) => {
  if (!_interrogationState.conversationOrder.includes(charId)) {
    _interrogationState.conversationOrder.push(charId);
  }
  _interrogationState.activeChar = charId;

  // Apply contamination line after intro renders
  const contaminationLine = getContaminationLine(charId);
  if (contaminationLine) {
    setTimeout(() => {
      const resp = document.getElementById('char-response');
      if (resp && resp.textContent) {
        // Append after the intro — don't replace it
        resp.textContent = resp.textContent + '\n\n' + contaminationLine;
      }
    }, 1800);
  }
});

// ── PATCH askQuestion FOR COMPOSURE VARIANTS ──────────────────

const _originalAskQuestion = window.askQuestion;
window.askQuestion = function(charId, qId) {
  // Apply composure cost with technique multiplier
  const char = window.CHARACTERS && window.CHARACTERS[charId];
  const q    = char && char.dialogue && char.dialogue[qId];
  if (q && !q.snap && !q.final && !q.correction) {
    const qType = _inferQType(qId, q);
    const cost  = COMPOSURE_COSTS[qType] || COMPOSURE_COSTS.focused_follow_up;
    _applyComposureCost(charId, cost);
  }

  // Check for composure variant response
  const variantResp = getComposureVariantResponse(charId, qId);
  if (variantResp && q) {
    q._composure_variant_override = variantResp;
  }

  // Track committed statement
  if (q && INTERROGATION_DATA[charId]) {
    const data = INTERROGATION_DATA[charId];
    const commitTriggers = data.committed_statement_triggers || {};
    if (commitTriggers[qId]) {
      if (!_interrogationState.committedStatements[charId]) {
        _interrogationState.committedStatements[charId] = {};
      }
      _interrogationState.committedStatements[charId][qId] = commitTriggers[qId].statement;
    }
  }

  // Call original
  _originalAskQuestion(charId, qId);

  // Emit with question type for NIS
  const qType = _inferQType(qId, q);
  NocturneEngine.emit('questionAnswered', { charId, qId, qType });

  // ── CONSEQUENCE ECHO (#4) ──────────────────────────────
  // Surface one echo per question, styled as a field note
  // beneath the response. Reports what the technique just did
  // in character-specific terms — without naming the system.
  try {
    const technique = _interrogationState.selectedTechnique;
    if (technique && !q?.snap && !q?.final && !q?.correction) {
      const echoText = getConsequenceEcho(charId, technique);
      if (echoText) {
        setTimeout(() => {
          const resp = document.getElementById('char-response');
          if (!resp) return;
          // Only one echo per turn — prevents stacking on branch follow-ups
          if (resp.querySelector('.consequence-echo')) return;
          const echoEl = document.createElement('div');
          echoEl.className = 'consequence-echo';
          echoEl.textContent = echoText;
          echoEl.style.cssText = 'margin-top:16px;padding:10px 14px;font-size:11px;color:rgba(190,170,130,0.62);font-style:italic;letter-spacing:0.04em;line-height:1.6;border-left:2px solid rgba(170,140,90,0.3);background:rgba(20,14,8,0.35);opacity:0;transition:opacity 800ms ease;';
          resp.appendChild(echoEl);
          requestAnimationFrame(() => { echoEl.style.opacity = '1'; });
        }, 400);
      }

      // ── ESCALATION (#F) ──────────────────────────────────
      // High-stakes characters escalate on consecutive poor choices.
      // Level 2: branch lock. Level 3: fracture floor rise.
      const classification = _classifyEffectiveness(charId, technique);
      const escalation = _applyEscalation(charId, classification);
      if (escalation) {
        setTimeout(() => {
          const resp = document.getElementById('char-response');
          if (!resp) return;
          if (resp.querySelector('.escalation-beat')) return;
          const escEl = document.createElement('div');
          escEl.className = 'escalation-beat';
          escEl.textContent = escalation.line;
          // Level 2 = amber warning. Level 3 = red, thicker.
          const palette = escalation.level === 3
            ? { color:'rgba(210,140,110,0.92)', border:'rgba(210,140,110,0.65)', bg:'rgba(40,20,14,0.55)' }
            : { color:'rgba(220,180,120,0.92)', border:'rgba(220,180,120,0.65)', bg:'rgba(35,24,12,0.5)' };
          escEl.style.cssText = `margin-top:14px;padding:12px 14px;font-size:11.5px;color:${palette.color};font-style:italic;letter-spacing:0.03em;line-height:1.65;border-left:3px solid ${palette.border};background:${palette.bg};opacity:0;transition:opacity 900ms ease;`;
          resp.appendChild(escEl);
          requestAnimationFrame(() => { escEl.style.opacity = '1'; });
        }, 900); // lands after the echo (400ms) + a beat
      }
    }
  } catch(e) { /* non-fatal */ }

  // Check word tell
  if (q) {
    // intentionally blank — annotations removed
  }
};

function _inferQType(qId, q) {
  if (!q) return 'focused_follow_up';
  if (qId === 'Q1')             return 'open_narrative';
  if (q.snap)                   return 'snap';
  if (q.final)                  return 'final';
  if (q.is_slip)                return 'narrative_statement';
  if (qId.includes('CROSS'))    return 'focused_follow_up';
  if (qId.includes('TWO_CHAR')) return 'focused_follow_up';
  if (qId.includes('BONUS'))    return 'open_narrative';
  return 'focused_follow_up';
}

// ── PATCH renderQuestions TO INCLUDE BRANCHES ─────────────────

// ── PIVOT BEATS (#5) ──────────────────────────────────────────
// Fired when a branch question becomes newly available — signals
// "this turn matters" without naming the system. Generic prose
// (character voice is supplied by the Tell + Echo). Rotates across
// 4 variants. Announced once per (charId × pivotQ) per conversation.
const PIVOT_BEATS = [
  "A long pause. Whatever you ask next, he will be preparing for.",
  "The room has shifted. The next question lands differently than the last one did.",
  "Something has opened that was not open before. You can feel it. He can too.",
  "You are closer now than you were two questions ago. He is deciding whether to let you arrive.",
];
const _PIVOT_FEMALE = ['ashworth','voss','crane','heir','archivist'];

function _pivotBeatFor(charId) {
  const idx = (window._pivotBeatCursor = ((window._pivotBeatCursor || 0) + 1) % PIVOT_BEATS.length);
  let line = PIVOT_BEATS[idx];
  if (_PIVOT_FEMALE.includes(charId)) {
    line = line.replace(/\bhe will\b/g, 'she will')
               .replace(/\bHe can\b/g, 'She can')
               .replace(/\bhe can\b/g, 'she can')
               .replace(/\bHe is\b/g, 'She is')
               .replace(/\bhe is\b/g, 'she is');
  }
  return line;
}

function _findPivotInAvailable(charId, availableQIds) {
  if (!Array.isArray(availableQIds)) return null;
  const answered = gameState.char_dialogue_complete[charId] || {};
  window._pivotAnnounced = window._pivotAnnounced || {};
  for (const qId of availableQIds) {
    // Branch questions: 2-letter-prefixed IDs like NA1/BA2/BC3/NB1. Excludes Q1/Q2.
    if (!/^[A-Z]{2}\d+$/.test(qId)) continue;
    if (answered[qId]) continue;
    const key = charId + ':' + qId;
    if (window._pivotAnnounced[key]) continue;
    return qId;
  }
  return null;
}

function _renderPivotBeat(charId) {
  try {
    const listEl = document.getElementById('questions-list');
    if (!listEl) return;
    // Get available qIds from rendered question rows + branch rows
    const available = [];
    listEl.querySelectorAll('.question-item').forEach(el => {
      const qId = el.dataset && el.dataset.qid;
      if (qId) available.push(qId);
    });
    // Also check branch rows which may not carry data-qid — scan via CHARACTERS
    const charData = window.CHARACTERS && window.CHARACTERS[charId];
    if (charData && typeof computeAvailableQuestions === 'function') {
      const computed = computeAvailableQuestions(charId) || [];
      computed.forEach(q => { if (!available.includes(q)) available.push(q); });
    }
    // Pull branch question IDs via getAvailableBranches if present
    if (typeof getAvailableBranches === 'function') {
      try {
        const branches = getAvailableBranches(charId) || [];
        branches.forEach(b => {
          if (b && b.qId && !available.includes(b.qId)) available.push(b.qId);
        });
      } catch(e) { /* non-fatal */ }
    }

    const pivotQ = _findPivotInAvailable(charId, available);
    if (!pivotQ) return;
    window._pivotAnnounced[charId + ':' + pivotQ] = true;

    // Remove any existing pivot beat before adding
    const existing = document.getElementById('pivot-beat-line');
    if (existing) existing.remove();

    const beat = document.createElement('div');
    beat.id = 'pivot-beat-line';
    beat.textContent = _pivotBeatFor(charId);
    beat.style.cssText = 'padding:8px 14px;margin:6px 14px 10px;font-size:11px;font-style:italic;color:rgba(200,170,110,0.82);letter-spacing:0.04em;line-height:1.55;border-left:2px solid rgba(200,170,110,0.55);background:rgba(25,18,10,0.4);opacity:0;transition:opacity 700ms ease;';
    // Insert at TOP of questions list so it sits above the options
    listEl.insertBefore(beat, listEl.firstChild);
    requestAnimationFrame(() => { beat.style.opacity = '1'; });
  } catch(e) { /* non-fatal */ }
}

const _originalRenderQuestions = window.renderQuestions;
window.renderQuestions = function(charId) {
  // Block during Alistair Rowe choice flow
  if (charId === 'rowe' && window._roweLockRender) return;
  _originalRenderQuestions(charId);
  renderBranchQuestions(charId);

  // Add cognitive load button for eligible chars
  _addCognitiveLoadOption(charId);

  // Add technique switch button if conversation in progress
  _addTechniqueSwitchButton(charId);

  // Pivot beat — fires when a branch entry becomes newly available
  _renderPivotBeat(charId);
};

function _addCognitiveLoadOption(charId) {
  const data = INTERROGATION_DATA[charId];
  if (!data || !data.cognitive_load_response) return;

  const state = gameState.characters[charId] || {};
  if ((state.composure || 100) > 70) return; // Only available when strained

  const used = gameState._cognitiveLoadUsed && gameState._cognitiveLoadUsed[charId];
  if (used) return;

  const list = document.getElementById('questions-list');
  if (!list) return;

  const div = document.createElement('div');
  div.className = 'question-item question-cognitive';
  div.style.cssText += ';opacity:0.7;border-left:2px solid rgba(42,37,28,0.3);padding-left:16px;';
  div.textContent = '· Ask while they watch what you\'re writing.';
  div.onclick = (e) => {
    e.stopPropagation();
    if (!gameState._cognitiveLoadUsed) gameState._cognitiveLoadUsed = {};
    gameState._cognitiveLoadUsed[charId] = true;
    fireCognitiveLoadQuestion(charId);
    div.remove();
    NocturneEngine.emit('questionAnswered', { charId, qId: 'COGNITIVE_LOAD', qType: 'cognitive_load' });
  };
  list.appendChild(div);
}

function _addTechniqueSwitchButton(charId) {
  if (!INTERROGATION_DATA[charId]) return;
  if (!_interrogationState.techniqueConfirmed) return;

  const tech = _interrogationState.techniqueHistory[charId];
  if (!tech) return;

  // Only one switch allowed — check if already switched
  const alreadySwitched = gameState._techniqueSwitched && gameState._techniqueSwitched[charId];
  if (alreadySwitched) return;

  const list = document.getElementById('questions-list');
  if (!list) return;

  const existing = list.querySelector('.technique-switch-btn');
  if (existing) return;

  const switchBtn = document.createElement('div');
  switchBtn.className = 'question-item technique-switch-btn';
  switchBtn.style.cssText += ';color:rgba(100,90,70,0.5);font-size:11px;font-style:italic;border-top:1px solid rgba(42,37,28,0.2);margin-top:8px;padding-top:12px;';
  switchBtn.textContent = 'Change approach';
  switchBtn.onclick = (e) => {
    e.stopPropagation();
    if (!gameState._techniqueSwitched) gameState._techniqueSwitched = {};
    gameState._techniqueSwitched[charId] = true;
    switchTechnique(charId);
  };
  list.appendChild(switchBtn);
}

// ── EXPOSE ────────────────────────────────────────────────────

window.INTERROGATION_DATA      = INTERROGATION_DATA;
window.TECHNIQUES              = TECHNIQUES;
window.COMPOSURE_COSTS         = COMPOSURE_COSTS;
window.openTechniqueSelector   = openTechniqueSelector;
window.switchTechnique         = switchTechnique;
window.presentEvidenceToChar   = presentEvidenceToChar;
window.fireCognitiveLoadQuestion = fireCognitiveLoadQuestion;
window.fireDirectConfrontation = fireDirectConfrontation;
window.checkWordTell           = undefined; // removed
window.checkScharffCorrections = checkScharffCorrections;
window.getAvailableBranches    = getAvailableBranches;
window.renderBranchQuestions   = renderBranchQuestions;
window.askBranchQuestion       = askBranchQuestion;
window.getComposureVariantResponse = getComposureVariantResponse;
window._stopSilenceSystem = _stopSilenceSystem;
window._interrogationState = _interrogationState;


// ── ROWE FUNNEL + DUEL WIRING ──────────────────────────────────
(function() {
  const _prevAsk = window.askQuestion;
  window.askQuestion = function(charId, qId) {
    if (charId !== 'rowe') { _prevAsk(charId, qId); return; }
    const char = window.CHARACTERS && window.CHARACTERS['rowe'];
    if (!char) { _prevAsk(charId, qId); return; }
    const q = char.dialogue[qId];
    if (!q || q.type !== 'choice') { _prevAsk(charId, qId); return; }
    if (!window.ROWE_STATE) {
      window.ROWE_STATE = { choice_made:false, funnel_fired:false, duel_complete:false, duel_outcome:null, iq_score:null };
    }
    if (window.ROWE_STATE.funnel_fired) { _prevAsk(charId, qId); return; }

    window.ROWE_STATE.choice_made = true;
    window._roweLockRender = true;

    // Synchronously clear list and inject Proceed
    const _list = document.getElementById('questions-list');
    if (_list) {
      _list.innerHTML = '';
      const proceedBtn = document.createElement('div');
      proceedBtn.id = 'rowe-proceed-btn';
      proceedBtn.className = 'question-item';
      proceedBtn.style.cssText = 'color:rgba(184,150,12,0.55);font-style:italic;letter-spacing:0.12em;text-align:center;padding:16px 20px;border-top:1px solid rgba(42,37,28,0.3);';
      proceedBtn.textContent = 'Proceed.';
      proceedBtn.onclick = function() { proceedBtn.remove(); _fireRoweFunnel(char); };
      _list.appendChild(proceedBtn);
    }

    _prevAsk(charId, qId);

    // Re-assert Proceed in case anything wiped it
    setTimeout(() => {
      const l = document.getElementById('questions-list');
      if (l && !document.getElementById('rowe-proceed-btn') && window._roweLockRender) {
        l.innerHTML = '';
        const btn = document.createElement('div');
        btn.id = 'rowe-proceed-btn';
        btn.className = 'question-item';
        btn.style.cssText = 'color:rgba(184,150,12,0.55);font-style:italic;letter-spacing:0.12em;text-align:center;padding:16px 20px;border-top:1px solid rgba(42,37,28,0.3);';
        btn.textContent = 'Proceed.';
        btn.onclick = () => { btn.remove(); _fireRoweFunnel(char); };
        l.appendChild(btn);
      }
    }, 50);
  };

  function _fireRoweFunnel(char) {
    window._roweLockRender = false;
    const funnel = char.dialogue['FUNNEL'];
    if (!funnel) return;
    const resp = document.getElementById('char-response');
    if (resp) {
      if (resp) {
        _renderResponse(resp, funnel.response, 55);
      }
    }
    if (!gameState.char_dialogue_complete['rowe']) gameState.char_dialogue_complete['rowe'] = {};
    gameState.char_dialogue_complete['rowe']['FUNNEL'] = true;
    window.ROWE_STATE.funnel_fired = true;
    const list2 = document.getElementById('questions-list');
    if (list2) {
      list2.innerHTML = '';
      const duelBtn = document.createElement('div');
      duelBtn.className = 'question-item';
      duelBtn.style.cssText = 'color:rgba(184,150,12,0.55);font-style:italic;letter-spacing:0.12em;text-align:center;padding:16px 20px;border-top:1px solid rgba(42,37,28,0.3);';
      duelBtn.textContent = 'Begin.';
      duelBtn.onclick = function() { duelBtn.remove(); _launchRoweDuel(char); };
      list2.appendChild(duelBtn);
    }
  }

  function _launchRoweDuel(char) {
    if (typeof launchDuel !== 'function') { console.error('launchDuel not found'); return; }
    launchDuel(function(outcome) {
      window.ROWE_STATE.duel_complete = true;
      window.ROWE_STATE.duel_outcome = outcome;
      const resultKey = outcome === 'player_wins' ? 'DUEL_WIN' : outcome === 'rowe_wins' ? 'DUEL_LOSE' : 'DUEL_DRAW';
      if (!gameState.char_dialogue_complete['rowe']) gameState.char_dialogue_complete['rowe'] = {};
      gameState.char_dialogue_complete['rowe'][resultKey] = true;
      const resultQ = char.dialogue[resultKey];
      const resp2 = document.getElementById('char-response');
      if (resultQ && resp2) {
        _renderResponse(resp2, resultQ.response, 55);
        resp2.scrollTop = 0;
      }
      setTimeout(() => { if (typeof renderQuestions === 'function') renderQuestions('rowe'); }, 100);
    });
  }
})();
