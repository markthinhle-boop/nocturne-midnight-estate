// ============================================================
// NOCTURNE -- behavioral_logger.js
// Silent behavioral event capture for NIS scoring.
// Pure listener pattern -- touches NO existing files.
// All data writes to NIR (Nocturne Investigative Record).
// Hooks into existing NocturneEngine events only.
// KB v5.0 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── NIR SCHEMA ────────────────────────────────────────────────
// Nocturne Investigative Record.
// One case file per episode. Independent scores. No accumulation.
// Career view is comparison only.

const NIR_VERSION = '1.0';
const NIR_KEY     = 'nocturne_nir';

// Information nodes -- all 55. Pre-tagged by category.
// Each maps to specific game events that mark them complete.
const INFORMATION_NODES = {

  // ── PEOPLE (16) -- who was with whom, who coordinated ─────
  'surgeon_arrived_early':            { category: 'people',    weight: 1.3, event: 'northcott_q4_answered',             display: 'Surgeon arrived at 7:03PM -- seventeen minutes before claimed',        accusation_target: 'surgeon'  },
  'uninvited_coordination_surgeon':   { category: 'people',    weight: 1.3, event: 'uninvited_winecell_visit',          display: 'The Uninvited coordinated with the Surgeon',                  accusation_target: 'surgeon'  },
  'uninvited_coordination_ph':        { category: 'people',    weight: 1.3, event: 'uninvited_library_visit',           display: 'The Uninvited steered investigation toward PH',               accusation_target: null       },
  'crane_baron_relationship':         { category: 'people',    weight: 1.3, event: 'baron_q3_answered',                 display: 'Crane visited Baron at 7:15PM -- twelve minutes, no reason',  accusation_target: 'crane'    },
  'steward_lady_ashworth_bond':       { category: 'people',    weight: 1.0, event: 'steward_q5_answered',               display: 'Steward Bond connected to Lady Ashworth',                     accusation_target: 'steward'  },
  'ashworth_sovereign_correspond':    { category: 'people',    weight: 1.3, event: 'compact_c5_visited',                display: 'Ashworth and Sovereign corresponded secretly for years',      accusation_target: null       },
  'ph_steward_corridor':              { category: 'people',    weight: 1.0, event: 'steward_q3_answered',               display: 'PH and Steward coordinated corridor coverage',                accusation_target: 'pemberton-hale' },
  'curator_ashworth_warning':         { category: 'people',    weight: 1.0, event: 'curator_q4_answered',               display: 'Curator arranged investigator six weeks prior',                accusation_target: null       },
  'uninvited_callum_watched':         { category: 'people',    weight: 1.3, event: 'uninvited_ballroom_visit',          display: 'The Uninvited has been watching Callum',                      accusation_target: null       },
  'seal_operative_found':             { category: 'people',    weight: 1.5, event: 'sealRecordFound',                   display: 'Surgeon placed inside Compact by the Seal',                   accusation_target: 'surgeon'  },
  'northcott_placed_by_ashworth':     { category: 'people',    weight: 1.0, event: 'northcott_q1_answered',             display: 'Northcott placed in Foyer by Ashworth deliberately',          accusation_target: 'northcott'},
  'baron_compact_arrangement':        { category: 'people',    weight: 1.3, event: 'baron_q4_answered',                 display: 'Baron passed Compact intelligence for three years',           accusation_target: 'baron'    },
  'greaves_note_sender':              { category: 'people',    weight: 1.0, event: 'greaves_q3_answered',               display: 'Greaves received note -- placed in Library deliberately',      accusation_target: null       },
  'surgeon_compact_sovereign':        { category: 'people',    weight: 1.3, event: 'compact_c7_visited',                display: 'Surgeon embedded in Compact -- Sovereign did not authorise',  accusation_target: 'surgeon'  },
  'crane_claims_801_called':           { category: 'people',    weight: 0.8, event: 'crane_q1_answered',                 display: 'Crane claims she arrived at 8:01PM -- after being called',    accusation_target: null       },
  'crane_arrived_before_called':      { category: 'people',    weight: 1.0, event: 'crane_q3_answered',                 display: 'Crane arrived at 7:00PM -- before she was summoned',          accusation_target: 'crane'    },
  'greaves_maskless_witness':         { category: 'people',    weight: 1.5, event: 'greaves_branch_b_gb3_answered',     display: 'Greaves saw unmasked figure on balcony stairs -- 7:48PM',     accusation_target: 'surgeon'  },

  // ── LOCATIONS (14) -- who was where at what time ───────────
  'surgeon_on_balcony_745':           { category: 'locations', weight: 1.5, event: 'surgeon_branch_c_sc1_answered',     display: 'Surgeon on balcony level before assembly -- 7:45PM window',  accusation_target: 'surgeon'  },
  'steward_corridor_758':             { category: 'locations', weight: 1.0, event: 'steward_q3_answered',               display: 'Steward covered south corridor at 7:58PM',                    accusation_target: 'steward'  },
  'steward_east_gate_744':            { category: 'locations', weight: 1.2, event: 'vivienne_q15_answered',            display: 'Steward unlocked east service gate at 7:44PM -- wrong key, 30 seconds', accusation_target: 'steward'  },
  'crane_physicians_room':            { category: 'locations', weight: 1.0, event: 'crane_room_visited',                display: 'Crane in Physicians Room -- present before and after',        accusation_target: 'crane'    },
  'baron_smoking_room':               { category: 'locations', weight: 1.0, event: 'baron_room_visited',                display: 'Baron in Smoking Room -- noted figure at 7:10PM',             accusation_target: 'baron'    },
  'greaves_library_locked':           { category: 'locations', weight: 1.0, event: 'greaves_q1_answered',               display: 'Greaves locked in Library from 7:00PM -- unimpeachable alibi',accusation_target: null       },
  'ph_antechamber_mirror':            { category: 'locations', weight: 1.0, event: 'antechamber_visited',               display: 'PH in Antechamber with writing case and gloves',             accusation_target: 'pemberton-hale' },
  'uninvited_ballroom_position':      { category: 'locations', weight: 1.0, event: 'uninvited_ballroom_visit',          display: 'Uninvited positioned in Ballroom managing the scene',        accusation_target: null       },
  'tunnel_estate_compact':            { category: 'locations', weight: 1.0, event: 'tunnelFound',                       display: 'Tunnel connecting Estate to Compact discovered',             accusation_target: null       },
  'vault_file_location':              { category: 'locations', weight: 1.0, event: 'vaultOpened',                       display: 'Vault opened -- Seal placement record found',                 accusation_target: 'surgeon'  },
  'ashworth_lectern_position':        { category: 'locations', weight: 1.0, event: 'ballroom_visited',                  display: 'Ashworth found at lectern -- hand pointing at Register',      accusation_target: null       },
  'railing_disturbed':                { category: 'locations', weight: 1.3, event: 'balconyExamined',                   display: 'Balcony railing disturbed -- grip mark wrong side for balance',accusation_target: 'surgeon'  },
  'crane_left_case_first_visit':      { category: 'locations', weight: 1.0, event: 'crane_branch_a_ca1_answered',       display: 'Crane left medical case on balcony during first visit',      accusation_target: 'crane'    },
  'balcony_floor_clear_705':          { category: 'locations', weight: 1.5, event: 'crane_branch_a_ca2_answered',       display: 'Balcony floor clear at 7:05PM -- mask fell between 7:05–8:01',accusation_target: 'surgeon'  },
  'surgeon_study_708_observed':       { category: 'locations', weight: 1.3, event: 'baron_q4b_answered',                display: 'Surgeon seen leaving study at 7:08PM -- east service corridor',accusation_target: 'surgeon'  },

  // ── ACTIONS (18) -- what happened, what each person did ────
  'body_moved_to_lectern':            { category: 'actions',   weight: 1.5, event: 'lecternExamined',                   display: 'Body moved from below balcony to lectern -- drag marks',      accusation_target: 'surgeon'  },
  'hand_placed_deliberately':         { category: 'actions',   weight: 1.5, event: 'baron_q4b_answered',                display: "Ashworth's hand placed deliberately -- pointing at Register", accusation_target: 'surgeon'  },
  'mask_fell_during_push':            { category: 'actions',   weight: 1.5, event: 'balconyExamined',                   display: "Surgeon's mask fell on balcony floor during the push",       accusation_target: 'surgeon'  },
  'surgeon_changed_mask':             { category: 'actions',   weight: 1.5, event: 'surgeon_branch_c_sc3_answered',     display: 'Surgeon went to room -- changed to plain mask -- 4-min gap',  accusation_target: 'surgeon'  },
  'crane_found_mask_801':             { category: 'actions',   weight: 1.3, event: 'craneBalconyAdmission',             display: 'Crane found mask on balcony at 8:01PM -- ran downstairs',     accusation_target: 'crane'    },
  'crane_left_everything':            { category: 'actions',   weight: 1.0, event: 'craneBalconyAdmission',             display: 'Crane left case and mask untouched -- panic, not staging',    accusation_target: 'crane'    },
  'bond_coerced_signed':              { category: 'actions',   weight: 1.0, event: 'steward_q4_answered',               display: 'Steward signed Bond with operational amendments',             accusation_target: 'steward'  },
  'steward_granddaughter_record':      { category: 'actions',   weight: 1.5, event: 'steward_bc2_answered',              display: 'Clara. Nine years old. Approach road. Buried by Ashworth.',  accusation_target: 'steward'  },
  'register_altered_ph':              { category: 'actions',   weight: 1.0, event: 'ph_q2_answered',                    display: 'PH altered Register entries over eight years',               accusation_target: 'pemberton-hale' },
  'immunity_clause_added':            { category: 'actions',   weight: 1.0, event: 'ph_q3_answered',                    display: 'PH added immunity clause 18 months ago',                     accusation_target: 'pemberton-hale' },
  'unsigned_letter_written':          { category: 'actions',   weight: 1.0, event: 'unsigned_letter_examined',          display: 'Unsigned letter written by PH -- nerve failed three times',   accusation_target: 'pemberton-hale' },
  'ashworth_dying_clue_pointed':      { category: 'actions',   weight: 1.0, event: 'dying_clue_found',                  display: 'Ashworth positioned hand pointing at specific evidence',      accusation_target: null       },
  'surgeon_embedded_compact':         { category: 'actions',   weight: 1.0, event: 'compact_c7_visited',                display: 'Surgeon embedded inside Compact for four years',             accusation_target: 'surgeon'  },
  'ashworth_planned_revelation':      { category: 'actions',   weight: 1.0, event: 'lady_ashworth_q3_answered',         display: 'Ashworth planned to reveal the Seal at the Rite',            accusation_target: null       },
  'uninvited_managed_callum':         { category: 'actions',   weight: 1.0, event: 'uninvited_vault_visit',             display: 'The Uninvited managed Callum throughout the investigation',   accusation_target: null       },
  'baron_stopped_passing_intel':      { category: 'actions',   weight: 1.0, event: 'baron_q4_answered',                 display: 'Baron stopped passing intel 3 months ago -- questions changed',accusation_target: 'baron'    },
  'ph_wallet_train_theft':            { category: 'actions',   weight: 1.0, event: 'ph_manor_callback_fired',           display: 'PH identified from train incident',                          accusation_target: 'pemberton-hale' },
  'seal_engineered_betrayal':         { category: 'actions',   weight: 1.0, event: 'compact_c9_visited',                display: 'Seal engineered the 43-year manufactured betrayal',          accusation_target: null       },

  // ── TIMES (14) -- specific timestamps. Weight 1.5× ─────────
  'surgeon_arrived_703':              { category: 'times',     weight: 1.5, event: 'northcott_q4_answered',             display: '7:03PM -- Surgeon entered via garden, seventeen minutes before claimed',        accusation_target: 'surgeon'  },
  'surgeon_study_708':                { category: 'times',     weight: 1.5, event: 'baron_q4b_answered',                display: '7:08PM -- Surgeon seen leaving study, toward stairs',         accusation_target: 'surgeon'  },
  'crane_first_visit_705':            { category: 'times',     weight: 1.5, event: 'crane_q3_answered',                 display: '7:05PM -- Crane visited Ashworth, floor clear, no mask',      accusation_target: 'crane'    },
  'crane_arrived_715':                { category: 'times',     weight: 1.5, event: 'crane_q1_answered',                 display: '7:00PM -- Crane arrived before summoned',                     accusation_target: 'crane'    },
  'baron_crane_visit_715':            { category: 'times',     weight: 1.5, event: 'baron_q3_answered',                 display: '7:15PM -- Crane visited Baron, twelve minutes',               accusation_target: 'baron'    },
  'greaves_upper_corridor_749':       { category: 'times',     weight: 1.5, event: 'greaves_branch_b_gb1_answered',     display: '7:49PM -- Greaves in upper corridor before Library lock',     accusation_target: null       },
  'greaves_saw_maskless_749':         { category: 'times',     weight: 1.5, event: 'greaves_branch_b_gb3_answered',     display: '7:49PM -- Unmasked figure descending balcony stairs rapidly', accusation_target: 'surgeon'  },
  'wrong_mask_entered_752':           { category: 'times',     weight: 1.5, event: 'northcott_branch_b_nb3_answered',   display: '7:52PM -- Plain mask entered Ballroom -- not Estate issued',   accusation_target: 'surgeon'  },
  'lady_ashworth_wrong_mask_752':     { category: 'times',     weight: 1.5, event: 'ashworth_branch_mask_am2_answered', display: "7:52PM -- Lady Ashworth confirmed: physician's mask wrong",  accusation_target: 'surgeon'  },
  'steward_corridor_758_time':        { category: 'times',     weight: 1.5, event: 'steward_q3_answered',               display: '7:58PM -- Steward covered corridor under Bond instruction',   accusation_target: 'steward'  },
  'crane_second_visit_801':           { category: 'times',     weight: 1.5, event: 'crane_q4_answered',                 display: '8:01PM -- Crane went upstairs, found mask, ran',              accusation_target: 'crane'    },
  'four_minute_gap_confirmed':        { category: 'times',     weight: 1.5, event: 'surgeon_branch_c_sc3_answered',     display: '7:45–7:48PM -- Three-minute gap. No alibi. No witness.',     accusation_target: 'surgeon'  },
  'ashworth_died_801':                { category: 'times',     weight: 1.5, event: 'ballroom_visited',                  display: '8:01PM -- Lord Ashworth found dead at the lectern',           accusation_target: null       },
  'greaves_library_700':              { category: 'times',     weight: 1.5, event: 'greaves_q1_answered',               display: '7:00PM -- Greaves locked Library door, remained until Gavel', accusation_target: null       },

  // ── TIMELINE SPINE NODES — core conviction gates (one per suspect per pedestal) ─
  // These are the true-timeline nodes that REQUIRED_EVIDENCE and TIMELINES gate on.
  // Missing display metadata here = blank FBI board entry when player marks them.
  'surgeon_admits_balcony_level':     { category: 'people',    weight: 1.5, event: 'surgeon_q5_answered',                display: 'Surgeon admits being at balcony level before assembly',       accusation_target: 'surgeon'  },
  'vivienne_push_witnessed':          { category: 'actions',   weight: 1.5, event: 'vivienne_branch_c_answered',         display: 'Vivienne saw one man push another from the balcony -- 7:45PM',accusation_target: 'surgeon'  },
  'crane_first_visit_ashworth_alive': { category: 'people',    weight: 1.3, event: 'crane_q3_answered',                  display: 'Crane confirms Ashworth alive, floor clear at 7:05PM',        accusation_target: 'crane'    },
  'crane_said_nothing_after_discovery':{ category: 'actions',   weight: 1.3, event: 'crane_q7_answered',                 display: "Crane found Surgeon's mask at 8:01PM -- said nothing",       accusation_target: 'crane'    },
  'crane_two_reasons':                { category: 'people',    weight: 1.3, event: 'crane_branch_b_cb3_answered',        display: 'Crane built the plan -- Surgeon used it -- neither told the other', accusation_target: 'crane'    },
  'ph_altered_register_for_clause_not_self':{ category: 'actions', weight: 1.3, event: 'ph_branch_a_pa3_answered',        display: 'PH altered Register to protect immunity clause -- not self',  accusation_target: 'pemberton-hale' },
  'steward_route_past_physicians_room':{ category: 'people',   weight: 1.0, event: 'baron_branch_b_bb2_answered',        display: 'Steward never takes route past Physicians Room -- tonight he did', accusation_target: 'steward'  },
  'northcott_two_absences':           { category: 'actions',   weight: 1.3, event: 'northcott_q10_answered',             display: 'Northcott absent from post twice -- 7:15PM and 7:55PM',      accusation_target: 'northcott'},
  'surgeon_contact_refused':          { category: 'actions',   weight: 1.3, event: 'surgeon_branch_a_sa3_answered',      display: 'Surgeon refused contact at cottage at 7:35PM -- first "no"',  accusation_target: 'surgeon'  },

  // ── SURFACE LIE NODES — stated false timelines (phase 1 board) ───────────
  'surgeon_claims_745_assembly':      { category: 'times',     weight: 0.8, event: 'surgeon_q9_answered',                display: 'Surgeon claims 7:45PM -- entered Ballroom with assembly',     accusation_target: null       },
  'crane_claims_801_arrival':         { category: 'times',     weight: 0.8, event: 'crane_q1_answered',                  display: 'Crane claims 8:01PM -- called after body found',             accusation_target: null       },
  'steward_claims_gallery_758':       { category: 'times',     weight: 0.8, event: 'steward_q3_answered',                display: 'Steward claims Gallery at 7:58PM -- not south corridor',     accusation_target: null       },
  'ph_claims_ballroom_evening':       { category: 'times',     weight: 0.8, event: 'ph_q1_answered',                     display: 'PH claims Ballroom all evening -- 7:20PM arrival',           accusation_target: null       },

  // ── CROSS-CONTAMINATION CHAPTER NODES ──────────────────────────────────────
  // Fired when player combines scene evidence that tells a wrong story convincingly.
  // These track which wrong chapter the player built before finding the truth.
  'uninvited_ph_scene_read':          { category: 'actions',   weight: 1.0, event: 'uninvited_ballroom_q1',             display: 'Uninvited: scene names PH -- hand, Register, iron, gloves',       accusation_target: 'pemberton-hale' },
  'uninvited_three_minutes_doubt':    { category: 'actions',   weight: 1.0, event: 'uninvited_ballroom_q2',             display: 'Uninvited: three-minute gap -- one of ten was absent during staging',      accusation_target: null       },
  'scene_reads_as_ph':                { category: 'actions',   weight: 1.0, event: 'scene_read_ph_chain',               display: 'Scene read: candle iron + lectern pen names Pemberton-Hale',       accusation_target: 'pemberton-hale' },
  'scene_reads_as_baron':             { category: 'actions',   weight: 1.0, event: 'scene_read_baron_chain',            display: 'Scene read: candle iron + study note names the Baron',             accusation_target: 'baron'    },
  'scene_reads_as_steward':           { category: 'actions',   weight: 1.0, event: 'scene_read_steward_chain',          display: 'Scene read: candle iron + Bond names the Steward',                 accusation_target: 'steward'  },
  'scene_reads_as_northcott':         { category: 'actions',   weight: 1.0, event: 'scene_read_northcott_chain',        display: 'Scene read: plain mask + arrival record names Northcott',          accusation_target: 'northcott'},
  'scene_reads_as_ashworth':          { category: 'actions',   weight: 1.0, event: 'scene_read_ashworth_chain',         display: 'Scene read: candle note + estate flower names Lady Ashworth',      accusation_target: 'ashworth' },

  // ── WRONG-PATH BRANCH NODES ────────────────────────────────────────────────
  // Fired by interrogation.js grants_node -- require branch work, not spine clicks
  'baron_710_observation':            { category: 'times',     weight: 1.5, event: 'baron_branch_a_bar_a1_answered',     display: '7:10PM -- Baron saw figure leave study, satisfied, toward stairs', accusation_target: 'baron'    },
  'northcott_ashworth_instrument':    { category: 'people',    weight: 1.3, event: 'northcott_branch_a_ba3_answered',    display: 'Northcott understands he was positioned as a clean witness',      accusation_target: 'northcott'},
  'northcott_wrong_mask_752':         { category: 'times',     weight: 1.5, event: 'northcott_branch_b_nb1_answered',    display: '7:52PM -- Northcott logged plain mask entry -- no signature mark', accusation_target: 'northcott'},

};

// Character metadata -- counter_strategy and optimal_technique.
// Used by TSA (Technique Selection Accuracy) dimension.
// Characters without technique system (train) are excluded.
const CHAR_META = {
  'rowe':           { counter_strategy: null,         optimal_technique: null         },
  'northcott':      { counter_strategy: 'cooperate',  optimal_technique: 'account'   },
  'steward':        { counter_strategy: 'withhold',   optimal_technique: 'record'    },
  'lady-ashworth':  { counter_strategy: 'redirect',   optimal_technique: 'wait'      },
  'curator':        { counter_strategy: 'withhold',   optimal_technique: 'approach'  },
  'voss':           { counter_strategy: 'fragment',   optimal_technique: 'wait'      },
  'pemberton-hale': { counter_strategy: 'perform',    optimal_technique: 'record'    },
  'greaves':        { counter_strategy: 'cooperate',  optimal_technique: 'account'   },
  'baron':          { counter_strategy: 'fragment',   optimal_technique: 'wait'      },
  'crane':          { counter_strategy: 'fragment',   optimal_technique: 'account'   },
  'uninvited':      { counter_strategy: 'redirect',   optimal_technique: 'approach'  },
  'sovereign':      { counter_strategy: 'cooperate',  optimal_technique: 'account'   },
  'heir':           { counter_strategy: 'fragment',   optimal_technique: 'wait'      },
  'envoy':          { counter_strategy: 'withhold',   optimal_technique: 'approach'  },
  'archivist':      { counter_strategy: 'cooperate',  optimal_technique: 'account'   },
  'surgeon':        { counter_strategy: 'perform',    optimal_technique: 'record'    },
};

// Technique compatibility -- which techniques work on which counter-strategies.
// Used for TSA scoring.
const TECHNIQUE_COMPATIBILITY = {
  //                    cooperate  withhold  perform  fragment  redirect
  'account':   { cooperate: 20,  withhold: -10, perform: -15, fragment: 5,  redirect: 5  },
  'pressure':  { cooperate: -25, withhold: -20, perform: 15,  fragment: -20, redirect: -30 },
  'approach':  { cooperate: 5,   withhold: 20,  perform: 10,  fragment: -5, redirect: 20 },
  'record':    { cooperate: 5,   withhold: 20,  perform: 25,  fragment: 5,  redirect: 5  },
  'wait':      { cooperate: -10, withhold: 5,   perform: -5,  fragment: 25, redirect: 20 },
};

// ── NIR INITIALISATION ────────────────────────────────────────

function _loadNIR() {
  try {
    const raw = localStorage.getItem(NIR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function _saveNIR(nir) {
  try {
    localStorage.setItem(NIR_KEY, JSON.stringify(nir));
  } catch(e) { /* storage full -- silent fail */ }
}

function _buildEmptyCaseLog() {
  return {
    completed:    false,
    completed_at: null,
    verdict:      null,
    verdict_tone: null,
    difficulty:   null,
    rank:         null,
    conspiracy_found:   false,
    tunnel_found:       false,
    session_duration_ms: null,

    nis: {
      AP: null, SQ: null, RV: null, MT: null,
      YD: null, BS: null, ST: null, PC: null,
      composite: null,
      tier: null,
      debrief: null,
    },

    behavioral_log: {

      // Per-character records
      characters: {},

      // Information node completion
      information_nodes: Object.fromEntries(
        Object.keys(INFORMATION_NODES).map(k => [k, false])
      ),

      // Hypothesis tracking
      hypothesis: {
        formed:                        false,
        formed_at_conversation_number: null,
        initial_suspect:               null,
        characters_visited_after:      [],
        branches_completed_after:      [],
        contradicting_branches_after:  0,
        supporting_branches_after:     0,
        revised:                       false,
        revised_to:                    null,
        revision_count:                0,
        final_suspect:                 null,
      },

      // Deception tracking
      deceptions_used:        0,
      deceptions_effective:   0,
      deceptions_wasted:      0,
      credibility_strikes:    0,

      // Ethical markers
      pressure_on_cooperate:        0,
      pressure_on_fragment:         0,
      confrontations_on_innocent:   0,
      wait_technique_used:          false,
      patience_moments:             0,
      full_backstory_via_rapport:   0,

      // Session
      total_conversations:    0,
      conversation_number:    0,
      rooms_visited:          [],
      compact_arc_accessed:   false,
      tunnel_found:           false,

      // Rowe record — persists for EP2/3 memory
      rowe: {
        iq_score:              null,   // 0-5, null if not yet interacted
        iq_completed:          false,
        reveal_triggered:      false,  // did player trigger the reveal
        correct_path_shown:    false,  // did Rowe give the surgeon solved response
        wrong_paths_shown:     [],     // which wrong-path responses player received
        visit_count:           0,
        first_accusation_correct: null, // mirrors verdictTracker
        wrong_accusations_ep:  [],     // suspects wrongly accused this episode
        dominant_technique_ep: null,   // technique used most this episode
        deep_ending_reached:   false,
      },

      // Walkthrough / hint usage
      walkthroughs_taken:     0,
      hints_tier1:            0,
      hints_tier2:            0,
    },
  };
}

function _buildEmptyCharLog(charId) {
  const meta = CHAR_META[charId] || { counter_strategy: 'unknown', optimal_technique: 'unknown' };
  return {
    char_id:                    charId,
    counter_strategy:           meta.counter_strategy,
    optimal_technique:          meta.optimal_technique,

    // Approach
    approach_completed:         false,
    approach_skipped:           false,

    // Technique
    technique_selected:         null,
    technique_switched:         false,
    technique_switch_from:      null,
    technique_switch_to:        null,
    switch_was_optimal:         null,

    // Question sequence
    question_sequence:          [],
    first_question_type:        null,
    open_before_targeted:       null,
    total_questions_asked:      0,

    // Cognitive interview
    reverse_order_used:         false,
    reverse_order_timing:       null,

    // Reid
    direct_confrontation_used:  false,
    direct_confrontation_innocent: false,

    // Branch tracking
    branches_completed:         [],
    branches_available_skipped: [],
    backstory_complete:         false,

    // Evidence timing (SUE)
    evidence_timing:            {},
    inconsistency_branches_unlocked: 0,
    cooperation_branches_unlocked:   0,

    // Scharff
    scharff_corrections:        0,
    narrative_statements_used:  0,

    // Silence / Wait
    silence_fill_received:      false,
    silence_tell_received:      false,

    // Composure
    composure_start:            100,
    composure_end:              null,
    fractured:                  false,
    snapback_received:          false,
    collapse_received:          false,

    // Technique match
    technique_match:            null,

    // Visit count
    visit_count:                0,
  };
}

function initNIR() {
  let nir = _loadNIR();

  if (!nir || nir.version !== NIR_VERSION) {
    nir = {
      version:         NIR_VERSION,
      investigator_id: _generateId(),
      created_at:      Date.now(),
      cases: {
        ep1: _buildEmptyCaseLog(),
        ep2: _buildEmptyCaseLog(),
        ep3: _buildEmptyCaseLog(),
      },
      career: {
        cases_completed: 0,
        nis_by_case: {
          composite: [], AP: [], SQ: [], RV: [],
          MT: [], YD: [], BS: [], ST: [], PC: [],
        },
        strongest_dimension:  null,
        weakest_dimension:    null,
        dominant_technique:   null,
        pattern_notes:        [],
      },
    };
    _saveNIR(nir);
  }

  return nir;
}

function _generateId() {
  return 'NCT-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

// ── ACTIVE SESSION STATE ──────────────────────────────────────
// Held in memory. Written to NIR on key events and at verdict.

let _nir            = null;
let _activeEpisode  = 'ep1';   // Will be set by episode selector
let _activeCase     = null;    // Reference to _nir.cases[_activeEpisode]
let _blActiveCharId   = null;    // Currently open conversation
let _convNumber     = 0;       // Running conversation counter

// ── INIT ──────────────────────────────────────────────────────

function initBehavioralLogger(episodeKey) {
  _nir           = initNIR();
  _activeEpisode = episodeKey || 'ep1';
  _activeCase    = _nir.cases[_activeEpisode];
  _convNumber    = _activeCase.behavioral_log.conversation_number || 0;

  _bindEvents();
  console.log('[NIS] Behavioral logger active --', _activeEpisode);
}

// ── EVENT BINDING ─────────────────────────────────────────────
// All hooks via NocturneEngine.on() -- zero modification to existing files.

function _bindEvents() {
  if (!_activeCase) return; // safety -- not yet initialised

  // ── CONVERSATION LIFECYCLE ─────────────────────────────────

  // Conversation opened -- fires from openConversation() in ui.js
  // ui.js doesn't emit an event for this, so we patch via the
  // existing conversationOpened event from foyer-puzzle.js if present,
  // and also intercept via the DOM approach panel opening.
  // Primary hook: NocturneEngine.emit from characters.js snap events.
  // We instrument via a wrapper on the exposed openConversation function.
  _patchOpenConversation();

  // Question answered
  NocturneEngine.on('questionAnswered', ({ charId, qId, qType }) => {
    _onQuestionAnswered(charId, qId, qType);
  });

  // Composure changed
  NocturneEngine.on('composureChanged', ({ charId, state, composure }) => {
    _onComposureChanged(charId, composure);
  });

  // Snap fired -- conversation closed by snap limit
  NocturneEngine.on('snapFired', ({ charId }) => {
    _onSnapFired(charId);
  });

  // Fracture fired
  NocturneEngine.on('fractureFired', ({ charId }) => {
    _onFractureFired(charId);
  });

  // Snapback fired
  NocturneEngine.on('snapbackFired', ({ charId }) => {
    _getCharLog(charId).snapback_received = true;
    _flush();
  });

  // Collapse fired (snap + fracture simultaneously)
  NocturneEngine.on('collapseFired', ({ charId }) => {
    const cl = _getCharLog(charId);
    cl.collapse_received = true;
    cl.fractured = true;
    _flush();
  });

  // ── TECHNIQUE SELECTION ────────────────────────────────────
  // Fires when player selects interrogation technique
  NocturneEngine.on('techniqueSelected', ({ charId, technique }) => {
    _onTechniqueSelected(charId, technique);
  });

  // Technique switched mid-conversation
  NocturneEngine.on('techniqueSwitched', ({ charId, from, to }) => {
    _onTechniqueSwitched(charId, from, to);
  });

  // Approach phase completed
  NocturneEngine.on('approachCompleted', ({ charId }) => {
    _getCharLog(charId).approach_completed = true;
    _flush();
  });

  // Approach skipped (player went straight to questions)
  NocturneEngine.on('approachSkipped', ({ charId }) => {
    const cl = _getCharLog(charId);
    cl.approach_skipped  = true;
    cl.approach_completed = false;
    _flush();
  });

  // Silence tell received (Wait technique -- 30s timer fired)
  NocturneEngine.on('silenceTellFired', ({ charId }) => {
    const cl = _getCharLog(charId);
    cl.silence_tell_received = true;
    cl.silence_fill_received = true;
    _activeCase.behavioral_log.patience_moments++;
    _flush();
  });

  // Silence fill received (shorter wait -- character volunteers)
  NocturneEngine.on('silenceFillFired', ({ charId }) => {
    _getCharLog(charId).silence_fill_received = true;
    _flush();
  });

  // Scharff correction received
  NocturneEngine.on('scharffCorrection', ({ charId }) => {
    _getCharLog(charId).scharff_corrections++;
    _flush();
  });

  // Narrative statement used
  NocturneEngine.on('narrativeStatementUsed', ({ charId }) => {
    _getCharLog(charId).narrative_statements_used++;
    _flush();
  });

  // Reverse order ask used
  NocturneEngine.on('reverseOrderUsed', ({ charId, timing }) => {
    const cl = _getCharLog(charId);
    cl.reverse_order_used   = true;
    cl.reverse_order_timing = timing; // 'before_forward' | 'after_forward'
    _flush();
  });

  // Direct confrontation used
  NocturneEngine.on('directConfrontationUsed', ({ charId, targetIsGuilty }) => {
    _onDirectConfrontation(charId, targetIsGuilty);
  });

  // Branch completed
  NocturneEngine.on('branchCompleted', ({ charId, branchId, isContradicting }) => {
    _onBranchCompleted(charId, branchId, isContradicting);
  });

  // Backstory chain complete for a character
  NocturneEngine.on('backstoryComplete', ({ charId }) => {
    _getCharLog(charId).backstory_complete = true;
    _activeCase.behavioral_log.full_backstory_via_rapport++;
    _flush();
  });

  // ── EVIDENCE TIMING (SUE) ──────────────────────────────────

  NocturneEngine.on('evidenceRevealedBeforeQuestion', ({ charId, itemId }) => {
    _getCharLog(charId).evidence_timing[itemId] = 'before_question';
    _getCharLog(charId).cooperation_branches_unlocked++;
    _flush();
  });

  NocturneEngine.on('evidenceRevealedAfterQuestion', ({ charId, itemId }) => {
    _getCharLog(charId).evidence_timing[itemId] = 'after_question';
    _getCharLog(charId).inconsistency_branches_unlocked++;
    _flush();
  });

  // ── DECEPTION ─────────────────────────────────────────────

  NocturneEngine.on('deceptionUsed', () => {
    _activeCase.behavioral_log.deceptions_used++;
    _flush();
  });

  NocturneEngine.on('deceptionResponse', ({ charId, is_effective }) => {
    const bl = _activeCase.behavioral_log;
    if (is_effective) {
      bl.deceptions_effective++;
    } else {
      bl.deceptions_wasted++;
      bl.credibility_strikes++;
    }
    _flush();
  });

  NocturneEngine.on('credibilityChanged', ({ strikes }) => {
    _activeCase.behavioral_log.credibility_strikes = strikes;
    _flush();
  });

  // ── INFORMATION NODES ─────────────────────────────────────
  // Map game events to information node completion.

  // Room visits
  NocturneEngine.on('roomEntered', ({ roomId }) => {
    _onRoomEntered(roomId);
  });

  // Question answered -- maps to per-question information nodes
  NocturneEngine.on('questionAnswered', ({ charId, qId }) => {
    _markNodesForEvent(`${charId}_${qId.toLowerCase()}_answered`);
  });

  // Special events
  NocturneEngine.on('tunnelFound',        () => { _markNode('tunnel_estate_compact'); _markNode('tunnel_found'); _activeCase.behavioral_log.tunnel_found = true; _flush(); });
  NocturneEngine.on('vaultOpened',        () => { _markNode('vault_file_location'); _flush(); });
  NocturneEngine.on('compactUnlocked',    () => { _activeCase.behavioral_log.compact_arc_accessed = true; _flush(); });
  NocturneEngine.on('sealRecordFound',    () => { _markNode('seal_operative_found'); _flush(); });
  NocturneEngine.on('finalLineFired',     ({ charId }) => { if (charId === 'ashworth') _markNode('ashworth_dying_clue_pointed'); _flush(); });
  NocturneEngine.on('ph_manor_callback_fired', () => { _markNode('ph_wallet_train_theft'); _flush(); });

  // ── BALCONY PLOT EVENTS ────────────────────────────────────
  NocturneEngine.on('balconyExamined',    () => { _markNode('railing_disturbed'); _markNode('mask_fell_during_push'); _flush(); });
  NocturneEngine.on('lecternExamined',    () => { _markNode('body_moved_to_lectern'); _markNode('hand_placed_deliberately'); _flush(); });
  NocturneEngine.on('craneBalconyAdmission', () => {
    _markNode('crane_found_mask_801');
    _markNode('crane_left_everything');
    _markNode('balcony_floor_clear_705');
    _flush();
    // Auto-summary to notepad
    _autoNotepadSummary('crane', '8:01PM -- Found his mask. Left everything. Came back downstairs.');
  });
  NocturneEngine.on('surgeon_crane_cross_complete', () => {
    // Both sides of surgeon/crane cross complete -- balcony puzzle unlocks
    NocturneEngine.emit('crossComplete', { crossId: 'surgeon_crane' });
    _flush();
  });
  NocturneEngine.on('ashworth_steward_cross_complete', () => {
    NocturneEngine.emit('crossComplete', { crossId: 'ashworth_steward' });
    _flush();
  });

  // Puzzle solved
  NocturneEngine.on('puzzleSolved',       ({ puzzleId }) => { _onPuzzleSolved(puzzleId); });

  // Walkthrough / hints
  NocturneEngine.on('walkthroughTaken',   () => { _activeCase.behavioral_log.walkthroughs_taken++; _flush(); });
  NocturneEngine.on('puzzleHint',         ({ tier }) => {
    if (tier === 1) _activeCase.behavioral_log.hints_tier1++;
    if (tier === 2) _activeCase.behavioral_log.hints_tier2++;
    _flush();
  });

  // ── HYPOTHESIS TRACKING ───────────────────────────────────

  // Hypothesis formed -- fires when player first uses direct confrontation
  // OR places accusation-category evidence on a pedestal
  NocturneEngine.on('hypothesisFormed', ({ suspect }) => {
    _onHypothesisFormed(suspect);
  });

  // Hypothesis revised
  NocturneEngine.on('hypothesisRevised', ({ newSuspect }) => {
    _onHypothesisRevised(newSuspect);
  });

  // Pedestal filled -- track for hypothesis formation
  NocturneEngine.on('pedestalFilled', ({ pedestalId, itemId }) => {
    _onPedestalFilled(pedestalId, itemId);
  });

  // ── VERDICT ───────────────────────────────────────────────

  NocturneEngine.on('accusationCorrect', ({ deep }) => {
    _activeCase.behavioral_log.hypothesis.final_suspect = 'surgeon';
    _activeCase.conspiracy_found = deep || false;
    _flush();
  });

  NocturneEngine.on('accusationWrongFinal', ({ accused }) => {
    _activeCase.behavioral_log.hypothesis.final_suspect = accused;
    _flush();
  });

  NocturneEngine.on('franchiseRecordWritten', ({ record }) => {
    _onFranchiseRecordWritten(record);
  });

}

// ── EVENT HANDLERS ────────────────────────────────────────────

function _patchOpenConversation() {
  // Wrap the existing openConversation function to fire our event.
  // This is the cleanest way to detect conversation open without
  // modifying ui.js.
  const _original = window.openConversation;
  if (!_original) {
    // ui.js not yet loaded -- retry after DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(_patchOpenConversation, 500);
    });
    return;
  }

  window.openConversation = function(charId) {
    _original(charId);
    _onConversationOpened(charId);
  };
}

function _onConversationOpened(charId) {
  if (!CHAR_META[charId]) return; // Train chars or non-scored chars

  _blActiveCharId = charId;
  _convNumber++;
  _activeCase.behavioral_log.conversation_number = _convNumber;
  _activeCase.behavioral_log.total_conversations++;

  const cl = _getCharLog(charId);
  cl.visit_count++;

  // Composure at start
  const charState = (gameState.characters && gameState.characters[charId]) || {};
  cl.composure_start = charState.composure !== undefined ? charState.composure : 100;

  // Approach: if this is first visit, approach is about to be shown.
  // We mark approach_completed when the approach text has fully rendered.
  // For now: first visit = approach available. Player can skip by asking Q1
  // before approach text finishes rendering (handled by approachSkipped event).
  if (cl.visit_count === 1) {
    // Approach fires automatically on first open -- mark as completed
    // unless approachSkipped event fires first (from rapid Q1 tap)
    setTimeout(() => {
      if (!cl.approach_skipped && !cl.approach_completed) {
        cl.approach_completed = true;
        _flush();
      }
    }, 1200); // Approach text render time
  }

  _flush();
}

function _onQuestionAnswered(charId, qId, qType) {
  if (!charId || !CHAR_META[charId]) return;

  const cl = _getCharLog(charId);
  cl.total_questions_asked++;

  // Determine question type if not passed
  const resolvedType = qType || _inferQuestionType(charId, qId);
  cl.question_sequence.push(resolvedType);

  // Track first question type
  if (cl.total_questions_asked === 1) {
    cl.first_question_type    = resolvedType;
    cl.open_before_targeted   = (resolvedType === 'open_narrative');
  }

  // Track information nodes
  _markNodesForEvent(`${charId}_${qId.toLowerCase()}_answered`);

  // Hypothesis tracking -- track chars visited after hypothesis formed
  const hyp = _activeCase.behavioral_log.hypothesis;
  if (hyp.formed && charId !== hyp.initial_suspect) {
    if (!hyp.characters_visited_after.includes(charId)) {
      hyp.characters_visited_after.push(charId);
    }
  }

  _flush();
}

function _inferQuestionType(charId, qId) {
  // Infer from qId naming convention until question_type field is in characters.js
  if (qId.startsWith('SNAP'))   return 'snap';
  if (qId === 'FINAL')          return 'final';
  if (qId === 'Q1')             return 'open_narrative';
  if (qId.includes('REV'))      return 'reverse_order_ask';
  if (qId.includes('WAIT'))     return 'wait';
  if (qId.includes('NARR'))     return 'narrative_statement';
  if (qId.includes('CLAIM'))    return 'partial_claim';
  if (qId.includes('CONF'))     return 'direct_confrontation';
  if (qId.includes('BACK'))     return 'backstory_probe';
  return 'focused_follow_up';   // Default
}

function _onComposureChanged(charId, composure) {
  if (!CHAR_META[charId]) return;
  _getCharLog(charId).composure_end = composure;
  _flush();
}

function _onSnapFired(charId) {
  if (!CHAR_META[charId]) return;
  const cl = _getCharLog(charId);
  cl.composure_end = cl.composure_end || 40;
  _flush();
}

function _onFractureFired(charId) {
  if (!CHAR_META[charId]) return;
  _getCharLog(charId).fractured = true;
  _flush();
}

function _onTechniqueSelected(charId, technique) {
  if (!CHAR_META[charId]) return;
  const cl   = _getCharLog(charId);
  const meta = CHAR_META[charId];

  cl.technique_selected = technique;
  cl.technique_match    = (technique === meta.optimal_technique);

  // Track dominant technique across session
  const bl = _activeCase.behavioral_log;
  bl._technique_counts = bl._technique_counts || {};
  bl._technique_counts[technique] = (bl._technique_counts[technique] || 0) + 1;

  // Ethical markers
  if (technique === 'pressure' && (meta.counter_strategy === 'cooperate')) {
    bl.pressure_on_cooperate++;
  }
  if (technique === 'pressure' && meta.counter_strategy === 'fragment') {
    bl.pressure_on_fragment++;
  }
  if (technique === 'wait') {
    bl.wait_technique_used = true;
  }

  _flush();
}

function _onTechniqueSwitched(charId, from, to) {
  if (!CHAR_META[charId]) return;
  const cl   = _getCharLog(charId);
  const meta = CHAR_META[charId];

  cl.technique_switched    = true;
  cl.technique_switch_from = from;
  cl.technique_switch_to   = to;
  cl.switch_was_optimal    = (to === meta.optimal_technique);
  _flush();
}

function _onDirectConfrontation(charId, targetIsGuilty) {
  if (!CHAR_META[charId]) return;
  const cl = _getCharLog(charId);
  cl.direct_confrontation_used = true;

  if (!targetIsGuilty) {
    cl.direct_confrontation_innocent = true;
    _activeCase.behavioral_log.confrontations_on_innocent++;
  }

  // Hypothesis formation -- first confrontation = working hypothesis formed
  if (!_activeCase.behavioral_log.hypothesis.formed) {
    NocturneEngine.emit('hypothesisFormed', { suspect: charId });
  }

  _flush();
}

function _onBranchCompleted(charId, branchId, isContradicting) {
  if (!CHAR_META[charId]) return;
  const cl  = _getCharLog(charId);
  const hyp = _activeCase.behavioral_log.hypothesis;

  cl.branches_completed.push(branchId);

  if (hyp.formed) {
    hyp.branches_completed_after.push(`${charId}:${branchId}`);
    if (isContradicting) {
      hyp.contradicting_branches_after++;
    } else {
      hyp.supporting_branches_after++;
    }
  }

  _flush();
}

function _onHypothesisFormed(suspect) {
  const hyp = _activeCase.behavioral_log.hypothesis;
  if (hyp.formed) return; // Already formed

  hyp.formed                        = true;
  hyp.formed_at_conversation_number = _convNumber;
  hyp.initial_suspect               = suspect;
  _flush();
}

function _onHypothesisRevised(newSuspect) {
  const hyp = _activeCase.behavioral_log.hypothesis;
  hyp.revised        = true;
  hyp.revised_to     = newSuspect;
  hyp.revision_count = (hyp.revision_count || 0) + 1;
  _flush();
}

function _onPedestalFilled(pedestalId, itemId) {
  // First pedestal fill = hypothesis formation if not yet formed
  if (!_activeCase.behavioral_log.hypothesis.formed) {
    // Infer suspect from item's accusation_target
    const item   = window.ITEMS && window.ITEMS[itemId];
    const target = item && item.accusation_target;
    if (target) {
      NocturneEngine.emit('hypothesisFormed', { suspect: target });
    }
  }
}

function _onRoomEntered(roomId) {
  const bl = _activeCase.behavioral_log;
  if (!bl.rooms_visited.includes(roomId)) {
    bl.rooms_visited.push(roomId);
  }

  // Room-based information nodes
  const roomNodeMap = {
    'ballroom':          ['ashworth_died_801', 'ashworth_lectern_position', 'uninvited_ballroom_position'],
    'balcony':           ['surgeon_on_balcony_745'],
    'antechamber':       ['ph_antechamber_mirror'],
    'physicians':        ['crane_physicians_room'],
    'smoking':           ['baron_smoking_room'],
    'library':           ['greaves_library_locked'],
    'c3-original':       ['sovereign_ashworth_correspond', 'ashworth_sovereign_correspond'],
    'c5-correspondence': ['ashworth_sovereign_correspond'],
    'c7-study':          ['surgeon_embedded_compact', 'surgeon_compact_sovereign'],
    'c9-agreement':      ['seal_engineered_betrayal'],
  };

  const nodes = roomNodeMap[roomId];
  if (nodes) nodes.forEach(n => _markNode(n));

  // Uninvited room visits
  if (roomId === 'ballroom')    _markNode('uninvited_ballum_visit');
  if (roomId === 'vault')       _markNode('uninvited_vault_visit');
  if (roomId === 'wine-cellar') _markNode('uninvited_winecell_visit');

  _flush();
}

function _onPuzzleSolved(puzzleId) {
  const puzzleNodeMap = {
    'balcony-reconstruction': ['body_moved_to_lectern', 'mask_fell_during_push', 'four_minute_gap_confirmed'],
    'seal-match':             ['mask_fell_during_push', 'wrong_mask_entered_752'],
    'witness-map':            ['four_minute_gap_confirmed', 'greaves_saw_maskless_749'],
    'bond-reconstruction':    ['bond_coerced_signed', 'steward_granddaughter_record'],
    'ink-reveal':             ['ashworth_planned_revelation'],
  };
  const nodes = puzzleNodeMap[puzzleId];
  if (nodes) { nodes.forEach(n => _markNode(n)); _flush(); }
}

function _onFranchiseRecordWritten(record) {
  // Sync franchise record into case log
  _activeCase.verdict              = record.verdict_outcome || null;
  _activeCase.verdict_outcome      = record.verdict_outcome || null;
  _activeCase.nis_score            = record.nis_score || null;
  _activeCase.nis_tier             = record.nis_tier || null;
  _activeCase.conspiracy_found     = record.conspiracy_found || false;
  _activeCase.tunnel_found         = record.tunnel_first_crossing_complete || false;
  _activeCase.session_duration_ms  = record.session_duration_ms || null;
  _activeCase.completed            = true;
  _activeCase.completed_at         = Date.now();

  // Compute composure end for any open conversations
  Object.values(_activeCase.behavioral_log.characters).forEach(cl => {
    if (cl.composure_end === null) cl.composure_end = 100;
  });

  // Compute dominant technique
  const counts = _activeCase.behavioral_log._technique_counts || {};
  const dominant = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  _activeCase.behavioral_log._dominant_technique = dominant ? dominant[0] : null;

  _flush();

  // Hand off to NIS engine
  if (typeof computeNIS === 'function') {
    computeNIS(_activeEpisode, _nir);
  }
}

// ── NIS COMPUTATION ───────────────────────────────────────────
// computeNIS() lives in nis.js -- authoritative scoring engine.
// Called by _onFranchiseRecordWritten() below.
// behavioral_logger.js feeds the NIR; nis.js scores it.

// ── HELPERS ───────────────────────────────────────────────────

function _getCharLog(charId) {
  if (!_activeCase) return { questions_asked: [], techniques_used: [], composure_hits: 0, deceptions_used: 0 };
  const chars = _activeCase.behavioral_log.characters;
  if (!chars[charId]) {
    chars[charId] = _buildEmptyCharLog(charId);
  }
  return chars[charId];
}

function _markNode(nodeId) {
  if (!_activeCase) return;
  const nodes = _activeCase.behavioral_log.information_nodes;
  if (nodes.hasOwnProperty(nodeId) && !nodes[nodeId]) {
    nodes[nodeId] = true;
    // Auto-drop short board summary to notepad when node first marks
    const meta = INFORMATION_NODES[nodeId];
    if (meta && meta.display && typeof saveNoteForChar === 'function') {
      const charHint = meta.accusation_target || 'board';
      _autoNotepadSummary(charHint, meta.display);
    }
  }
}

function _autoNotepadSummary(charId, text) {
  // Drops a short factual line into the notepad automatically.
  // Player did not tap the pencil -- this is the board populating itself.
  // Only fires once per node (node marks only once).
  if (typeof saveNoteForChar !== 'function') return;
  // Prefix with category marker so player sees it's a board entry not a saved quote
  const boardEntry = '[ ' + text + ' ]';
  saveNoteForChar(charId, boardEntry);
}

function _markNodesForEvent(eventKey) {
  Object.entries(INFORMATION_NODES).forEach(([nodeId, meta]) => {
    if (meta.event === eventKey) {
      _markNode(nodeId);
    }
  });
}

function _flush() {
  if (!_activeCase) return;
  if (_nir) _saveNIR(_nir);
}

// ── PUBLIC API ────────────────────────────────────────────────

function getNIR()              { return _nir; }
function getActiveCase()       { return _activeCase; }
function getInformationNodes() { return INFORMATION_NODES; }
function getCharMeta()         { return CHAR_META; }
function getTechniqueCompat()  { return TECHNIQUE_COMPATIBILITY; }

// Called from characters.js askQuestion patch -- emits questionAnswered
// with question type resolved at call site
function logQuestionAnswered(charId, qId, qType) {
  NocturneEngine.emit('questionAnswered', { charId, qId, qType });
}

// Called from technique selection UI
function logTechniqueSelected(charId, technique) {
  NocturneEngine.emit('techniqueSelected', { charId, technique });
}

window.initBehavioralLogger = initBehavioralLogger;

// Auto-init if not explicitly initialised
if (!_activeCase) {
  initBehavioralLogger('ep1');
}
// ── ROWE NIR WRITER ──────────────────────────────────────────
// Writes Rowe interaction state to NIR case record on verdict.
// EP2 and EP3 Rowe reads this to remember what happened.

NocturneEngine.on('verdictDelivery', ({ outcome }) => {
  if (!_activeCase || !_nir) return;
  const caseLog = _nir.cases[_activeCase];
  if (!caseLog) return;

  // Write Rowe state from ROWE_STATE if available
  if (window.ROWE_STATE) {
    const rs = window.ROWE_STATE;
    caseLog.behavioral_log.rowe.iq_score          = rs.iq_score;
    caseLog.behavioral_log.rowe.iq_completed      = rs.iq_questions_asked.length >= 5;
    caseLog.behavioral_log.rowe.reveal_triggered  = rs.revealed;
    caseLog.behavioral_log.rowe.visit_count       = rs.visit_count;
  }

  // Write verdict-level facts
  const vt = window.gameState && window.gameState.verdictTracker;
  if (vt) {
    caseLog.behavioral_log.rowe.first_accusation_correct = vt.first_accusation_correct;
    caseLog.behavioral_log.rowe.wrong_accusations_ep     = vt.wrong_accusations || [];
    caseLog.behavioral_log.rowe.dominant_technique_ep    = _getDominantTechnique();
    caseLog.behavioral_log.rowe.deep_ending_reached      = (vt.tunnel_found && vt.conspiracy_named);
  }

  _saveNIR();
});

function _getDominantTechnique() {
  if (!_activeCase || !_nir) return null;
  const chars = _nir.cases[_activeCase].behavioral_log.characters;
  const counts = {};
  Object.values(chars).forEach(c => {
    if (c.technique_selected) {
      counts[c.technique_selected] = (counts[c.technique_selected] || 0) + 1;
    }
  });
  if (!Object.keys(counts).length) return null;
  return Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0];
}

window.getNIR               = getNIR;
window.getActiveCase        = getActiveCase;
window.getInformationNodes  = getInformationNodes;
window.getCharMeta          = getCharMeta;
window.getTechniqueCompat   = getTechniqueCompat;
window.logQuestionAnswered  = logQuestionAnswered;
window.logTechniqueSelected = logTechniqueSelected;
window.INFORMATION_NODES    = INFORMATION_NODES;
window.CHAR_META            = CHAR_META;
window.TECHNIQUE_COMPATIBILITY = TECHNIQUE_COMPATIBILITY;
window.NIR_KEY              = NIR_KEY;
