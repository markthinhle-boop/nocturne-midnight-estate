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
  account: {
    id:          'account',
    label:       'The Account',
    callum_line: 'Let them talk. See what they choose to include.',
    real_world:  'PEACE / Cognitive Interview',  // INTERNAL ONLY — not rendered
    composure_multiplier: 0.6,
    snap_bonus:           1,
    opens_backstory:      true,
    word_tell_available:  false,
  },
  pressure: {
    id:          'pressure',
    label:       'The Pressure',
    callum_line: 'He knows I know. Make sure he feels that.',
    real_world:  'Reid (inverted)',              // INTERNAL ONLY — not rendered
    composure_multiplier: 1.8,
    snap_bonus:          -1,
    opens_backstory:     false,
    word_tell_available: true,
  },
  approach: {
    id:          'approach',
    label:       'The Approach',
    callum_line: 'Tell him almost everything. See what he corrects.',
    real_world:  'Scharff Technique',           // INTERNAL ONLY — not rendered
    composure_multiplier: 0.4,
    snap_bonus:           0,
    opens_backstory:     false,
    word_tell_available: true,
  },
  record: {
    id:          'record',
    label:       'The Record',
    callum_line: 'Ask first. Show after.',
    real_world:  'Strategic Use of Evidence',   // INTERNAL ONLY — not rendered
    composure_multiplier: 1.0,
    snap_bonus:           0,
    opens_backstory:     false,
    word_tell_available: false,
  },
  wait: {
    id:          'wait',
    label:       'The Wait',
    callum_line: 'Say nothing. See what he fills it with.',
    real_world:  'Scharff + Cognitive combined', // INTERNAL ONLY — not rendered
    composure_multiplier: 0.0,
    snap_bonus:           2,
    opens_backstory:     false,
    word_tell_available: false,
    silence_timer_ms:    30000,
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

// ── CHARACTER INTERROGATION DATA ──────────────────────────────
// Full simulator data per character.
// counter_strategy, optimal_technique, composure variants,
// approach baseline, contamination responses, silence fills,
// branch chains, Scharff corrections, SUE committed statements.

const INTERROGATION_DATA = {

  // ── NORTHCOTT ──────────────────────────────────────────────
  'northcott': {
    counter_strategy:  'cooperate',
    optimal_technique: 'account',
    composure_floor:   35,
    fracture_threshold: 40,

    baseline: {
      text:         'He registers your approach before you speak. Already attentive. Already slightly anxious to be useful.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'He says things before he finishes thinking them.',
    },

    composure_variants: {
      'Q1': {
        composed:   '"Six weeks. Lord Ashworth invited me personally. He said I had the right temperament for the Estate." A pause. "I\'m still learning what that means."',
        controlled: '"Six weeks." A pause. "Lord Ashworth. He said I\'d be useful here."',
        strained:   '"Six weeks." He says just that. Then looks at the Gallery door.',
        fractured:  '"Six weeks." A beat. "He placed me here specifically. I know that now. I didn\'t then."',
        snapback:   '"I\'ve told you how long I\'ve been here. Is there something specific about the arrival records?"',
      },
      'Q2': {
        // "Did you know Ashworth before tonight?"
        composed:   '"Lord Ashworth came to me six weeks ago, before the season began. He asked me to keep the arrival record tonight. He said it mattered — he used that word. He was specific about which arrivals and which times. I didn\'t ask why. He knew my name before I gave it."',
        controlled: '"Six weeks ago. He found me in the East corridor. He knew my name already. He said arrivals tonight would matter. He said that twice." A pause. "I wrote it in the margin before I understood what it meant."',
        strained:   '"He picked me specifically. He came to where I was standing and he knew me. The Steward was nearby. I told the Steward about it afterward." A pause. "The Steward nodded. He didn\'t ask any questions. Just nodded. I keep coming back to that."',
        fractured:  '"Six weeks ago. He knew my name." A beat. "The Steward nodded when I told him. Didn\'t ask anything." Another beat. "Just nodded."',
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
        composed:   '"I\'ve been here since six. Most members arrived after seven-thirty." A pause. "There was one arrival earlier. Through the garden. I didn\'t see the face."',
        controlled: '"Most members after seven-thirty. One earlier. Garden entrance." A pause. "Five forty-seven."',
        strained:   '"Five forty-seven." He says it like he\'s been holding it. "Garden entrance. I circled it."',
        fractured:  '"Five forty-seven." A pause. "I circled it twice. I told the Steward. He nodded and didn\'t ask who it was." Another pause. "He knew."',
        snapback:   '"The notebook entry is accurate. Five forty-seven. Garden. I wrote what I observed."',
      },
    },

    silence_fill: 'He straightens. Adjusts his position. Then: "I\'ve been here since six. I note what I observe. That\'s what I do here." He says it to the room.',
    silence_tell: 'A long pause. "Lord Ashworth told me specifically where to stand. Which door to watch. Which times to record." He looks at you. "I think he expected something to happen tonight. I think he wanted someone to know he\'d prepared for it."',

    scharff_corrections: {
      'surgeon_arrived_645':   '"That\'s not accurate. The earlier arrival was at five forty-seven. Garden entrance. Not six forty-five."',
      'northcott_arrived_seven': '"I arrived at six. Not seven. I have the log."',
    },

    word_tell: null,  // Northcott is cooperative — no concealment

    approach_response: 'He looks at you steadily. "I know what the notebook says. You\'re about to ask me about the five forty-seven entry." A pause. "Nobody has asked me about it yet. I\'ve been waiting."',

    backstory_chain: {
      'A': {
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
            response_composed:   'No. A pause. He looks at the notebook. Then at Callum. "I\'m twenty-seven. I\'ve been here six weeks. I was told arrivals would matter and to keep the record carefully. I kept it." Another pause. "I can\'t be accused of involvement. I didn\'t know anyone here before the invitation. I have no history with the Estate, no history with Ashworth, no reason to alter anything I wrote down." He is very still. "He needed a witness who couldn\'t be accused of involvement. He placed me here six weeks ago so that person would exist tonight." A long pause. "I didn\'t know that until just now." He looks at the notebook in his hand. "I\'ve been useful. I just didn\'t know that was the word for it."',
            grants_node: 'northcott_ashworth_instrument',
          },
        },
      },
    },

    contamination: {
      'steward': 'He glances toward the Gallery. "The Steward was very thorough with me earlier." A pause. "He asked what I\'d told you. I told him what I told you. He nodded." Another pause. "He nods a great deal tonight. I\'ve started finding that more interesting than I expected."',
      'curator': 'He is slightly more careful with his next answer. "The Curator spoke to me at seven forty-two." A beat. "He didn\'t ask about the notebook. I found that interesting."',
    },

    cognitive_load_response: '"Five forty-seven. Garden.\" He repeats it while watching your hands. Then catches himself. \"He was carrying something. I didn\'t — I didn\'t write that down. I should have written that down."',

  },

  // ── STEWARD ────────────────────────────────────────────────
  'steward': {
    counter_strategy:  'withhold',
    optimal_technique: 'record',
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
        composed:   '"The Ballroom candelabras were changed at six-thirty, sir, per pre-Rite schedule. A second change was made at seven-fifteen at Lady Ashworth\'s request — she found the scent of the first set unsuitable. I noted both changes in the maintenance record. Standard practice to log any deviation from the scheduled service."',
        controlled: '"Six-thirty on schedule, sir. Seven-fifteen at Lady Ashworth\'s request." A pause. "Both are in the maintenance record. I log deviations. I always log deviations."',
        strained:   '"Twice. Six-thirty, scheduled. Seven-fifteen, Lady Ashworth asked." A pause. "I noted it. I note everything. Fourteen years." Another pause. "Both times are written down."',
        fractured:  '"Twice." A beat. "Six-thirty. Seven-fifteen." A beat. "It\'s in the record."',
        snapback:   '"Both changes are in the maintenance record, sir."',
      },
      'Q3': {
        composed:   'A half-beat pause. "Attending to the Gallery, sir. The candles required attention before the Rite." He does not look at the Baron\'s portrait.',
        controlled: '"The Gallery, sir." A pause. "The candles." He says it precisely. Then adds: "The Baron has been in the Smoking Room since seven-fifteen." Volunteered.',
        strained:   '"The Gallery." A pause. "Seven fifty-eight." He stops. Then: "Candles." He\'s trying to give you less than he knows.',
        fractured:  '"I was where I was told to be." A pause. "Seven fifty-eight." Another pause. "The corridor. Not the Gallery." He has just told you something different from what he said before.',
        snapback:   '"I was in the Gallery attending to the candles. That is my complete answer." He straightens. Returns to his former register.',
      },
      'Q6': {
        composed:   'A pause that is different from all the previous pauses. "I have arrangements. They were entered into under conditions I was not in a position to refuse." A shorter pause. "They predate tonight. And they are concluded."',
        controlled: '"I have arrangements." He says it with the precision of something decided. "I did not understand their full implications when I entered them."',
        strained:   '"I signed something eight years ago." A pause that costs him. "I didn\'t read it carefully enough."',
        fractured:  '"I signed a Bond. Compact language. I didn\'t know what I was signing." A pause. "I covered the corridor because it told me to. I didn\'t know anyone was going to die." Another pause. "I didn\'t know."',
        snapback:   '"I\'ve said what I can say. If you have further questions the Curator can arrange a proper time." The formality is back. It is completely deliberate.',
      },
      'Q4': {
        // "Garden gate at five forty-five — someone came through."
        // requires_item: 'northcott-log-obj'
        composed:   '"The garden gate access at five forty-five would fall outside my direct coverage during that period, sir. I was conducting East wing inventory. If the arrival log shows an access event at that time, it predates my coverage of the main entrance. I did not authorise any gate access at that hour. The arrival record would be the appropriate reference."',
        controlled: '"Five forty-five — I was in the East wing, sir. Not near the garden." A pause. "If something came through the garden gate at that hour I wasn\'t told about it. That access point isn\'t on my schedule then."',
        strained:   '"I wasn\'t there, sir. East wing." A pause. "Five forty-five I can\'t account for the garden gate. I wasn\'t near it." Another pause. "If someone came through at that time they came through without my knowledge."',
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
    },

    silence_fill: 'He adjusts something that doesn\'t need adjusting. "The candles were changed at six-fifteen. Both sets. Lady Ashworth asked for both." A pause. "That is not something I would usually note."',
    silence_tell: 'A very long silence. Then: "The instructions came in writing. Two weeks ago. They told me to cover the corridor at seven fifty-eight. They told me not to discuss it." He looks at the portrait. "They didn\'t tell me why. I assumed the Register alterations." A pause. "That was a significant misunderstanding on my part."',

    scharff_corrections: {
      'steward_arrived_seven':  '"I arrived at five-thirty, sir. As I do every evening the Estate convenes. I have not arrived at seven in fourteen years."',
      'candles_changed_morning': '"The candles were changed at six-fifteen as well, sir. Not only this morning. Both sets. Lady Ashworth requested it."',
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
            response_fractured:  '"I signed something and didn\'t read it carefully enough and a man I served for fourteen years is dead because I covered a corridor I was told to cover." A longer pause. "That is the complete answer."',
            snapback:            '"I should not have said that. I would ask you to —" He stops. "No. I\'ll say it. I\'ve been saying it to myself long enough."',
            unlocks: 'BA3',
            cross_links: [{ char: 'baron', branch: 'B' }],
          },
          'BA3': {
            text:             '"What did the Bond require of you tonight."',
            type:             'focused_follow_up',
            cost:             99,
            composure_required: 50,
            response_fractured: '"Cover the corridor. Seven fifty-eight." A pause. "I thought it was about Pemberton-Hale\'s Register alterations. Protecting the Estate from embarrassment." Another pause. "I did not know anyone was going to die." The last sentence arrives twice. "I did not know."',
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
            cross_links: [{ char: 'ashworth', branch: 'C' }],
            grants_node: 'steward_lady_ashworth_bond',
          },
          'BB3': {
            text:     '"Did Lady Ashworth know what the scent meant."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He is completely still. The formality is present but it is held now, not natural. "I don\'t know." Four words. He does not follow them with anything. He does not qualify them or reach for an institutional framework around them. He simply does not know. It is the most honest thing he says all evening.',
            grants_node: 'steward_cannot_account_for_lady_ashworth',
          },
        },
      },
    },

    contamination: {
      'baron': 'He is slightly more careful about the Smoking Room reference. "The Baron remained in the Smoking Room." He says it like something that has been agreed upon.',
      'crane': '"Dr. Crane was in the building before she was summoned." He says it before you ask. Then realizes he\'s volunteered it.',
    },

    cognitive_load_response: '"The corridor." While watching your pen. "Seven fifty-eight. The Bond specified seven fifty-eight." He stops. Realizes what he said. His next answer will be the most careful of the evening.',

  },

  // ── LADY ASHWORTH ──────────────────────────────────────────
  'ashworth': {
    counter_strategy:  'redirect',
    optimal_technique: 'wait',
    composure_floor:   60,
    fracture_threshold: 65,

    baseline: {
      text:         'She is the only person without a mask. Not because she refused one. Because grief arrived before she could put it on.',
      sentence_avg: 'short',
      formality:    'low',
      tell:         'Past tense. Everyone else uses present. She moved Edmund to history before you arrived.',
    },

    composure_variants: {
      'Q1': {
        // "How are you holding up?"
        approach_response: '"The question implies this evening was unexpected. It wasn\'t." She looks at him steadily. "Edmund told me something was going to happen tonight. I came because he asked me to."',
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
        composed:   '"I left it in the study six weeks ago when Edmund first told me about the Register. I didn\'t mean to leave it. I put it on the desk when I came in and I was too occupied to take it when I left." A pause. "He didn\'t move it. It was still there this evening. That is the kind of man he was."',
        controlled: '"I left it six weeks ago. When he first told me." A pause. "He kept it on the desk. He didn\'t move things without reason."',
        strained:   '"I forgot it." A pause. "Six weeks ago. He kept it." Another pause. "I didn\'t ask him why."',
        fractured:  '"I forgot it." A beat. "He kept it." Another beat. "I noticed it tonight."',
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
    },

    silence_fill: 'She looks at the garden. "Edmund chose to attend. He chose to open the Register. He chose to come back even when I asked him not to." She says it to no one.',
    silence_tell: 'The longest pause. "He wrote me a letter. Two weeks ago. Sealed. To be opened after." She doesn\'t look at you. "I opened it before. I couldn\'t wait." A pause. "He knew the Surgeon\'s name. He had it for two months. He chose to attend anyway." Another pause. "He chose this. He chose all of it."',

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
            text:     '"Did he name who was coming for him."',
            type:     'focused_follow_up',
            cost:     10,
            response_strained:   '"He said he knew the shape of the danger. Not the specific name." A pause. "He was careful about specifics. Even with me."',
            response_fractured:  '"He named the Compact connection. Not the specific operative." A long pause. "He trusted them. He shouldn\'t have."',
            grants_node: 'ashworth_planned_revelation',
            cross_links: [{ char: 'curator', branch: 'B' }],
          },
          'BA3': {
            text:     '"Why didn\'t you warn the Compact directly."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   'She looks at the garden for a long time. Long enough that the question might have disappeared. It hasn\'t. "Because Edmund said the investigator would do it better." A pause. "He said the warning would be credible in a way mine wouldn\'t be. Someone from inside the structure — inside a system that connected both sides — could carry the truth in a way that would be received as truth. My warning would be received as grief." Another pause. "He had positioned everything. Including the person standing here." She does not look at Callum when she says this. She is still looking at the garden. "I trusted his design even when it frightened me. I trusted it because he had been careful about everything else and he had been careful about this."',
            grants_node: 'ashworth_positioned_callum_for_truth',
            cross_links: [{ char: 'witness_map', branch: 'observation_2' }],
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
            response_strained:   '"I told the Sovereign there was an investigator whose wound had the right shape." She doesn\'t elaborate.',
            response_fractured:  '"I told them your name. I told them what Ashworth had taken from your family. I said you would follow the evidence without asking to be protected from it." A pause. "Edmund agreed. He said you were the one he\'d have chosen."',
            grants_node: 'ashworth_sovereign_correspond',
          },
          'BC2': {
            text:     '"Why that name specifically."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"Because of the prior case." She says it directly. "Because someone who destroyed an innocent person through error — and who spent a year understanding what that cost — is the correct person to investigate a murder that has been staged to produce a false verdict." A pause. "That was Edmund\'s logic. He explained it to me. I agreed with it. A man who knows what a manufactured verdict looks like from the inside will recognise one when he\'s standing in it."',
            unlocks: 'BC3',
            grants_node: 'prior_case_selection_criterion',
          },
          'BC3': {
            text:     '"Did you know the prior case was manufactured."',
            type:     'focused_follow_up',
            cost:     15,
            response_composed:   'She looks at Callum directly. For the first time this evening. "I knew three months ago." A pause. "I told Edmund. He said: that is exactly why." She is quiet for a moment. "I have been deciding since then whether that makes it better or worse." She does not offer a conclusion. She has been deciding for three months. She does not have one yet.',
            grants_node: 'lady_ashworth_knew_prior_case_manufactured',
            cross_links: [{ char: 'compact_sovereign', branch: 'q4_unlock' }],
          },
        },
      },
    },

    contamination: {
      'baron': 'She glances toward the direction of the Smoking Room. "The Baron understands this building better than he admits." She says it to the garden.',
      'surgeon': 'She is slightly more still. "The Surgeon was in this building an hour before he claimed." She says it without being asked. "Edmund noted it."',
    },

    cognitive_load_response: '"Edmund." While watching you write. "He chose the Rite. He chose the Register. He chose —" She stops. "He chose the audience. He needed witnesses." A pause she didn\'t plan. "He needed you specifically."',

  },

  // ── THE SURGEON ────────────────────────────────────────────
  'surgeon': {
    counter_strategy:  'perform',
    optimal_technique: 'record',
    composure_floor:   40,   // Never fully fractures — trained for this
    fracture_threshold: 40,

    baseline: {
      text:         'He is helpful. This is not accidental. He arrived an hour before anyone else and solved every room before the investigation began.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'He uses the Curator\'s exact word. "Detectable." In the exact context. From a man who should have no reason to know the Curator\'s specific vocabulary.',
    },

    composure_variants: {
      'Q1': {
        // "What did you do tonight?"
        // Composed: most helpful response in the building. Three observations all pointing away.
        composed:   '"I arrived for the Rite at the appointed time. Before the proceedings I spoke to the Curator — he had some concerns about procedural matters involving the Register. I stopped briefly in the Library with Sir Greaves, who had stationed himself there. I was near the south entrance when Lord Ashworth collapsed. I moved to assist Dr. Crane." A pause. "Three things may be useful to you: the Viscount was wearing gloves he removed and replaced. Dr. Crane arrived with a prepared bag. And the Steward covered the south corridor at seven fifty-eight."',
        controlled: '"I arrived at the appointed time. Spoke to the Curator about the Register — he mentioned certain amendments were, in his word, detectable. Brief stop in the Library with Greaves. South entrance at eight-oh-one. I moved toward Lord Ashworth when he collapsed." A pause. "Dr. Crane was there before me. Her examination was thorough."',
        strained:   '"I was here for the evening. Spoke to several members before the Rite. South entrance at eight-oh-one. Offered what assistance I could to Dr. Crane." A pause. "The Curator told me the Register amendments were detectable. I passed that to Pemberton-Hale when I saw him in the Ballroom, because it seemed the relevant information to share."',
      },
      'Q2': {
        // "Are you a doctor?"
        composed:   '"I am. Cardiac specialist, principally — twenty-two years of practice. I maintain consultancy relationships with several institutions. The Compact has been one for the past four years. Medical consultancy. I find the work valuable." He says this with the warmth of a man who means it. "Is there a specific medical question I can help you with tonight?"',
        controlled: '"Was is slightly more accurate. Active clinical practice — I stepped back eighteen months ago to focus on consultancy work. The Compact engagement. Some research." A pause. "I maintain my credentials. The skills are intact. I apply them in a different context now."',
        strained:   '"Was is more accurate." A pause. "Eighteen months ago I stepped back from active practice. Consultancy since. The Compact work. Some private arrangements." Another pause. "Still credentialed. The skills haven\'t diminished."',
      },
      'Q3': {
        composed:   '"The Register alterations are visible to anyone examining the ink timing carefully." He says this helpfully. "I noticed at approximately seven forty-two."',
        controlled: '"The alterations are — detectable." He uses the Curator\'s word. In the exact context.',
        strained:   '"Detectable." He says it. Then a half-second pause that wasn\'t there before. "The Curator used that word. I had occasion to hear it."',
        fractured:  '"Detectable." A pause. "The Curator told me at seven forty-two. I needed to know how much he\'d seen." The first true thing he has said.',
        snapback:   '"I noted the Register condition when I passed the Ballroom. That is the extent of my observation." Completely controlled. Immediately.',
      },
      'Q4': {
        // "Where were you at seven fifty-eight?"
        // Composed: committed statement on arrival time — deliberately casual.
        // SUE inconsistency (northcott-notebook) fires later against this statement.
        // No fragment sentences — floor is 40, controlled is the minimum register.
        composed:   '"At seven fifty-eight I was in the south corridor, moving toward the Ballroom. I\'d stopped in the Library earlier in the evening — Greaves had stationed himself there, as he does. By seven-fifty I was already moving. Eight minutes from the south corridor to the entrance at a measured pace. I was in position near the south entrance at eight-oh-one when Lord Ashworth collapsed. The timeline is straightforward." He says this easily. He has said it before, or something very like it, in his head.',
        controlled: '"South corridor at seven fifty-eight. I\'d looked in on Greaves earlier — he was settled." A pause. "South entrance at eight-oh-one. That is the sequence."',
        strained:   '"South corridor. Seven fifty-eight." A pause. "Eight minutes to the south entrance. Eight-oh-one in position." Another pause. "That is the account."',
      },
      'Q5': {
        // "The compound — you know what it is."
        // Requires evidence chain. No fragments at any level — floor is 40.
        // Q5b at depth 4 already written — do not overwrite.
        composed:   '"Cardiac sensitising compounds are a known class. Several variants exist for legitimate medical applications — post-operative management, certain arrhythmia protocols. A physician with my background would be familiar with the class." A pause. "If you are asking whether the compound used tonight is consistent with a cardiac sensitising agent, the answer is yes. Dr. Crane will have made the same assessment from her examination. I would weight her clinical findings above mine."',
        controlled: '"The compound class — yes, I am familiar with it. The specific formulation used tonight is consistent with a referral I assisted in facilitating six months ago." A pause. "I provided a colleague with a referral for an assisted dying case. I verified the credentials. I believed the channel was sound."',
        strained:   '"I arranged for the compound to reach the appropriate channel. Through a physician I trusted. The intended use was not this." A pause. "The channel was real. The credentials were real. I was not the final point of delivery." Another pause. "That is the accounting I can give you at this time."',
      },
    },

    silence_fill: 'He looks at you. "You\'ve been to the Compact." Not a question. A pause. "What did they tell you about the compound?" He is asking what you know. This is the first time he has asked you anything.',
    silence_tell: 'The silence goes on. He waits. He is better at waiting than anyone else in the building. Then: "You found the tunnel." Still not a question. "And you found what was in Archive Case 3." A pause. "Then you know most of it." A longer pause. "Ask me the question you came here to ask."',

    word_tell: {
      trigger:    'detectable',
      context:    'Register alterations discussion',
      surface_on: ['pressure', 'approach'],
      text:       'He used the word "detectable." The Curator\'s exact word. In the exact context. From a man who should have no reason to know the Curator\'s specific vocabulary about a specific subject. That word. In that context. Is the thread.',
    },

    approach_response: '"You\'re building a narrative of what I knew and when I knew it." He says it pleasantly. "That is correct methodology." He pauses. "Some of the narrative is accurate. Some is not. I\'ll correct the inaccurate portions."',

    pressure_response: {
      indignation: null,  // He doesn\'t get indignant — he manages
      management: '"That\'s a serious proposition." He says it the way you\'d say "interesting weather." "I\'d want to understand what evidence leads you there." He picks up a document. He already knows what evidence leads you there. He needs to know how much of it you have.',
    },

    direct_confrontation_response: '"You\'re better at this than I expected." He says it like a professional assessment. His composure hasn\'t moved. That is the tell. A man who was innocent would have moved.',

    committed_statement_triggers: {
      'Q_timing': {
        topic:     'arrival_time',
        statement: 'I arrived for the Rite. As all members do.',
        truth:     'He arrived at 5:47PM. The Rite began at 7:30PM.',
      },
    },

    sue_inconsistency: {
      'northcott-notebook': {
        committed_after:    'Q_timing',
        reveal_response:    '"Five forty-seven." He says it. A pause. "I arrived early to ensure the study arrangements were in order." He has an explanation ready. The explanation is smooth. It is also the first explanation he has given for anything this evening.',
        inconsistency_note: 'He committed to arriving "for the Rite." The notebook shows 5:47PM. An hour before he claimed. He had an explanation ready immediately.',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The Compact embedding',
        unlock_condition: { composure_lte: 70, or_after: 'Q3' },
        questions: {
          'SA1': {
            text:     '"You\'ve been with the Compact for four years."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"The Compact required medical expertise. I provided it. Four years is accurate."',
            response_strained:   '"Four years. Yes." A pause. "The Sovereign was cautious at first. He had reason to be." Another pause. "I gave him no reason to remain cautious. That was deliberate."',
            unlocks: 'SA2',
          },
          'SA2': {
            text:     '"The Sovereign didn\'t know about the method."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   '"He wanted Ashworth alive and acknowledged. I considered that an insufficient outcome." He says it with complete calm.',
            response_strained:   '"He wanted correction. Not elimination." A pause. "I used the infrastructure he built for something he didn\'t authorise." Another pause. "That is accurate."',
            response_fractured:  '"He didn\'t know." The flattest thing he has said. "I built it inside what he built. He had no way to see it." A pause. "He trusted me for four years because I gave him nothing to distrust." A longer pause. "That was a significant piece of work."',
            grants_node: 'surgeon_compact_sovereign',
          },
          'SA3': {
            text:     '"Who gave the instruction."',
            type:     'direct_confrontation',
            cost:     20,
            response_composed:   'A very long pause. This is the only pause he has produced all evening. He looks at Callum. He looks — for the first time since Callum entered the room — somewhere that is not Callum. At the wall. At nothing particular on the wall. "The Architect." He says it simply, without weight, without drama. "The office, not the person. The instruction came through the office." A pause. "I don\'t know who holds it currently. I have never known." Another pause. "That is the correct architecture for this kind of work. I designed aspects of it myself. It should be unknowable from my position." He looks back at Callum. The warmth has not left. Nothing has left. He is still at peace. "You will have to find it from a different position."',
            grants_node: 'architect_office_named',
            cross_links: [{ char: 'ep2', branch: 'monastery_arc' }],
          },
        },
      },
    },

    contamination: {
      'crane': '"Dr. Crane was thorough." He says it before you mention her. "She is a precise practitioner. Her notes will be accurate." He is telling you her notes will hold up. He is also telling you he has already considered what her notes will say.',
      'baron': '"The Baron is a careful observer." He says it with professional appreciation. "He notices things he doesn\'t report." A pause. "I respect that quality."',
    },

    cognitive_load_response: '"Administered." He uses the exact clinical word while watching your pen. Then: "The compound was administered through — contact." A pause he didn\'t intend. "Direct contact." He has used "administered" where he should have said "used." The precision of the word is itself the tell.',

  },

  // ── DR. CRANE ──────────────────────────────────────────────
  'crane': {
    counter_strategy:  'fragment',
    optimal_technique: 'account',
    composure_floor:   25,
    fracture_threshold: 45,

    baseline: {
      text:         'She looks at her medical bag as she speaks. The bag is already open. She prepared it before she was called.',
      sentence_avg: 'medium',
      formality:    'high',
      tell:         'She says "arrangement." Not contract. Not employment. She knows exactly what she is here.',
    },

    composure_variants: {
      'Q1': {
        // "You arrived quickly."
        approach_response: '"The implied timeline is incorrect. I arrived at six-thirty. The Rite began at seven forty-five. The bag was prepared before I arrived. I\'ll correct those two points."',
        composed:   '"I maintain a medical availability arrangement for the Estate during formal events. It is a discretionary arrangement I have held for several years. I was here at six-thirty. I had my bag with me. That is standard practice for an engagement of this kind."',
        controlled: '"I arrived at six-thirty. Bag already prepared before arrival." A pause. "This is routine for Estate medical availability. I have maintained this arrangement for several years without incident."',
        strained:   '"I prepared the bag before I came." A pause. "I always prepare before Estate events of this formality. I was called this afternoon." Another pause. "I prepared my bag. That is routine. It was routine."',
        fractured:  '"He called me this afternoon." A beat. "The Surgeon called me." Another beat. "He said I might want to be available. I prepared my bag."',
        snapback:   '"My arrangement with the Estate is documented. The preparation is standard practice."',
      },
      'Q2': {
        // "The prepared bag."
        composed:   '"Standard medical availability kit. Cardiac support materials — the Estate membership demographic warrants that as a baseline. Diagnostic instruments. Documentation materials. Nothing unusual for an engagement of this kind. The bag\'s contents are available for inspection."',
        controlled: '"Cardiac materials, primarily." A pause. "The demographic — age, the physical demands of formal Rite proceedings — makes cardiac preparation standard for this membership." A pause. "I carry what a physician should carry when she knows the kind of evening it will be."',
        strained:   '"I carry what I need to carry." A pause. "The cardiac preparation was appropriate given the — given the demographic. The bag was ready." Another pause. "That is accurate. That is all of it."',
        fractured:  '"I knew something cardiac was possible." A beat. "I prepared for a contingency." Another beat. "The contingency was more specific than I will say on this question."',
        snapback:   '"The bag\'s contents are consistent with standard medical availability practice."',
      },
      'Q3': {
        composed:   '"I provide assessments when requested. My professional expertise extends to a range of pharmaceutical applications." She does not blink.',
        controlled: '"A compound. Yes." She says it carefully. "There are compounds with cardiac applications." She stops there.',
        strained:   '"A compound was used. I know the presentation." She is giving you pieces. Not the whole.',
        fractured:  '"The compound is consistent with what I provided six months ago." A pause that is the sound of a twenty-year career reaching a decision. "I didn\'t know it was for him."',
        snapback:   '"I\'ve said what I can say within my professional obligations. I\'d appreciate if you\'d note that in your record." Completely controlled. She has rebuilt something.',
      },
      'Q4': {
        // "A Compact contact six months ago."
        composed:   '"I maintain referral relationships with medical contacts across several networks — the Compact-adjacent channel is one of several I use professionally. Six months ago a request came through that channel for a cardiac sensitising compound. The request was presented as an assisted dying case. I asked three questions. I received three satisfactory answers. I verified the credentials. I provided the compound."',
        controlled: '"Six months ago. The channel." A pause. "The request was for an assisted dying case — that is how it was presented. I asked the questions I am trained to ask." A pause. "I provided the compound. The channel was clean. The credentials were verified."',
        strained:   '"I provided a compound six months ago." A pause. "Through a channel I trusted. A referral. I asked three questions and received satisfactory answers." Another pause. "I didn\'t verify the condition independently. I trusted the channel."',
        fractured:  '"I provided the compound." A beat. "Six months ago." Another beat. "I trusted the channel. I didn\'t verify independently."',
        snapback:   '"The referral chain is documented. I will provide everything I have."',
      },
      'Q5_CROSS': {
        // "Ashworth attended a private appointment — under a different name."
        // requires_item: 'appointment-book'
        // composure_required: 45
        composed:   '"If Lord Ashworth attended a private appointment under a pseudonym six months ago, I was not made aware that the patient was Lord Ashworth. The record I hold for that appointment period does not carry that name." A pause. "If the appointment book establishes that he was present — then the compound I provided six months ago was administered to him directly. Not to an anonymous case. To him." She does not blink. For the first time this evening, she blinks.',
        controlled: '"Under a different name." A pause. "If that appointment is in the book then I examined Lord Ashworth six months before his death and I did not know it was him." A pause. "And the compound I provided through the referral channel — it was for him. The Surgeon provided it for him." Another pause. "Find him."',
        strained:   '"If the appointment book shows that —" A pause. "Six months ago I saw a patient I believed was a referral case." Another pause. "If that patient was Lord Ashworth then I helped someone design a murder that looked like an assisted death and I said the words a physician says when a patient cannot be saved." A pause. "Find him."',
        fractured:  '"The appointment book." A beat. "If it shows him —" Another beat. "Twenty years." A beat. "Find him."',
        snapback:   '"The appointment record is available. Everything I have will go to the investigation."',
      },
    },

    silence_fill: 'She looks at the medical bag. "I arrived before I was summoned. I prepared the bag before the Rite began." She says it to the bag. "Those are facts. I will not tell you what they mean."',
    silence_tell: 'A very long silence. Then she looks at you directly. "The Steward asked me three months ago whether a cardiac compound could be introduced through sealed packaging." A pause. "I told him I wasn\'t in a position to discuss hypotheticals." Another pause. "He thanked me. He left. I\'ve been thinking about that conversation since eight-oh-one."',

    word_tell: null,

    committed_statement_triggers: {
      'Q4': {
        topic:     'compound_provision',
        statement: 'Patient confidentiality is — I\'m not able to discuss private consultations.',
        truth:     'She provided the compound. She knows she provided it.',
      },
    },

    sue_inconsistency: {
      'operational-brief': {
        committed_after:    'Q4',
        reveal_response:    '"My name isn\'t in that document. But the compound is. I confirmed the collection. Lord Ashworth. Three months ago." A pause. "He knew exactly what he was collecting." The commitment to patient confidentiality and this statement cannot both be complete.',
        inconsistency_note: 'She cited confidentiality then immediately confirmed the specific collection. The committed statement has been overtaken.',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The request six months ago',
        unlock_condition: { composure_lte: 70 },
        questions: {
          'CA1': {
            text:     '"Someone asked you for the compound. Not Ashworth."',
            type:     'partial_claim',
            cost:     8,
            response_composed:   '"Medical requests come through various channels. I assess each on its merits."',
            response_strained:   '"A contact. Through a referral network I have used before. The credentials were genuine." She says it carefully.',
            response_fractured:  '"He gave me a name. A patient choosing their own death. Assisted dying. A request I had navigated before." A pause. "The credentials were real. Everything was real except the patient."',
            unlocks: 'CA2',
          },
          'CA2': {
            text:     '"You asked three questions and were satisfied."',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '"I conduct appropriate due diligence." She says it formally.',
            response_strained:   '"Three questions. Three answers." A pause. "They were good answers." Another pause. "I have been a physician for twenty years. I have never been given a better set of lies."',
            response_fractured:  '"I asked about the patient\'s condition. His prognosis. His expressed wishes." A pause that costs her. "I received answers that satisfied every clinical criterion." She looks at her hands. "They were designed to."',
            unlocks: 'CA3',
            grants_node: 'surgeon_crane_request',
          },
          'BA1': {
            text:     '"Who gave you the referral six months ago."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'She has six years of work here. The pause is the length of someone measuring that weight. "A Compact-adjacent medical contact. I had used the channel before." She says it the way a physician states a protocol — factually, not defensively. "Clean record. Full documentation. The referral came with everything I would require to assess legitimacy." A pause. "I had used the channel before and the channel had been clean before."',
            unlocks: 'BA2',
            grants_node: 'crane_compact_adjacent_referral_channel',
          },
          'BA2': {
            text:     '"Did you verify the patient independently."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'She asked three questions. "Standard protocol for assisted dying referrals — patient identity, condition confirmed, requesting physician co-signature." A pause. "I received three satisfactory answers." She does not blink. She has not blinked once since this question began. "I did not speak to the patient directly. The channel indicated the patient had requested no direct physician contact — this is a common request made for dignity reasons in these cases. I accepted it." Another pause. "Standard protocol. I followed it."',
            unlocks: 'BA3',
            grants_node: 'crane_did_not_verify_patient_directly',
          },
          'CA3': {
            text:             '"Who was the contact."',
            type:             'focused_follow_up',
            cost:             25,
            composure_required: 45,
            response_fractured: '"I have been a physician for twenty years. I have never lost a patient I wasn\'t supposed to lose." A pause. The longest of the evening. "The contact\'s name is the Surgeon. Dr. Edmund Voss. He is embedded in the Compact as a medical advisor." She doesn\'t ask what happens to her. "Find him."',
            triggers_fracture:  true,
            closes_conversation: true,
            grants_node:        'compound_stage1_administered',
            grants_item_eligible: 'operational-brief',
          },
          'BA3': {
            text:     '"Who contacted you this afternoon before you prepared the bag."',
            type:     'direct_confrontation',
            cost:     20,
            response_composed:   'A pause. It costs her everything and she knows it costs her everything and she gives it anyway because there is nothing else left. "The Surgeon called." She says it the way a physician delivers a terminal diagnosis — precisely, without sentiment, to the face of the person who needs to hear it. "He said there might be a cardiac event at the Estate this evening. He said I might want to be available." A pause. "He said it as a colleague. I prepared my bag as a colleague." She looks at her hands. "Twenty years." A pause. "I have been a physician for twenty years. I know what I should have asked." Another pause. "I didn\'t ask it."',
            grants_node: 'surgeon_called_crane_this_afternoon',
            cross_links: [{ char: 'surgeon', branch: 'q5_compound_unlock' }],
          },
        },
      },
    },

    contamination: {
      'baron': '"The Baron has been very careful tonight." She says it before you mention him. A pause. "He saw me leave the Smoking Room. He knows something shifted. He\'s deciding whether you\'re safe."',
      'surgeon': 'She is very still. "The Surgeon visited this building before the Rite." She says it quietly. "He told me he was confirming arrangements." A pause. "He was confirming something."',
    },

    cognitive_load_response: '"Cardiac." While watching your hands. "The presentation is consistent with a two-stage cardiac compound." A pause she didn\'t plan. "Stage one administered weeks before. Stage two at contact." She has just given you the mechanism without being asked.',

  },

  // ── THE BARON ──────────────────────────────────────────────
  'baron': {
    counter_strategy:  'fragment',
    optimal_technique: 'wait',
    composure_floor:   20,
    fracture_threshold: 35,

    baseline: {
      text:         'His drink is untouched. He has picked it up four times and put it back down. He is deciding something.',
      sentence_avg: 'short',
      formality:    'low',
      tell:         'He said "I didn\'t need to" not "I wouldn\'t." He had a method. He chose not to use it. Those are different things.',
    },

    composure_variants: {
      'Q1': {
        // "What can you tell me about tonight?" / the eight refusals
        approach_response: 'Before Callum finishes the question. "I didn\'t need to." He sets the drink down. "That\'s the answer to the question you\'re building toward. Not wouldn\'t. Didn\'t need to. Those are different things."',
        composed:   'He picks up the drink. Sets it down without drinking. "Eight refusals. No hesitation." A pause. "I have had a method available for three years. I chose not to use it. That is the complete answer to the question of whether I killed Lord Ashworth. If you have a different question I will answer that one instead."',
        controlled: 'He picks up the drink again. Sets it down. "I didn\'t need to." A pause. "Three years. I had the means. The method. I chose not to use it." A pause. "That\'s the answer."',
        strained:   '"Didn\'t need to." He picks the drink up and doesn\'t put it down yet. "Three years of information. I had leverage. I chose not to use it." A pause. "I don\'t kill people." He sets the drink down.',
        fractured:  '"Didn\'t need to." A beat. "Never would." Another beat. "Next question."',
        snapback:   '"The question of whether I killed Lord Ashworth has an answer. The answer is no."',
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
        composed:   '"No." A pause. "I didn\'t need to." He looks at the ashtray. "Crane came to see me at six-thirty. She didn\'t say what she wanted. Sat for twelve minutes. Said she needed to think about something." He pauses. "I\'ve been thinking about that twelve minutes since."',
        controlled: '"No." A pause. "I didn\'t need to." He leaves it there. Doesn\'t explain the distinction.',
        strained:   '"No." He picks up the drink. Puts it down. "I had a method. I decided it wasn\'t necessary." A pause. "I was deciding whether that was a cowardly decision or a good one."',
        fractured:  '"No." A pause. "I knew someone else was going to do it. I didn\'t know how. I didn\'t know when." He picks up the drink. This time he takes it. "That is the thing I have been sitting with."',
        snapback:   '"I did not kill Lord Ashworth. That is my complete statement." He picks up the drink. Puts it down. Returns to his previous register.',
      },
      'Q4': {
        composed:   'He picks up the drink. Puts it down. "I don\'t name people." A pause. "But I\'ll tell you this — it\'s not the most interesting question."',
        controlled: '"The most interesting question is why tonight." He says it before you ask what he means.',
        strained:   '"Someone with medical training and Compact access." He says it to the ashtray. "That narrows it considerably."',
        fractured:  '"The Surgeon." He says it quietly. "I\'ve been sitting here for three hours deciding whether to say that." He looks at the untouched drink. "I decided."',
        snapback:   '"I\'ve said what I know. The rest is for you to establish." He picks up the book. Returns to the window.',
      },
    },

    silence_fill: 'He picks up the drink. Puts it down. "I\'ve been in the Compact\'s arrangements for three years. I stopped three months ago." A pause. "Something changed in the questions they were asking. The precision of them." He doesn\'t explain further.',
    silence_tell: 'The longest pause of the evening. He picks up the drink. Actually takes it. Sets it down empty. "The Surgeon was here before the Rite." He says it to the ashtray. "I saw him leave the study at six-fifteen. He was carrying nothing. He looked satisfied." Another pause. "I\'ve been trying to decide what that means since six-sixteen."',

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
            response_fractured:  '"They asked about the corridor. The time. Who covered it. Whether I knew the Steward\'s arrangements." A pause. "I didn\'t answer. I stopped all of it." He picks up the drink. Puts it down. "I should have said something to someone."',
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
            response_composed:   '"She came to the Smoking Room at six-thirty. Sat. Left without explaining." He looks at the ashtray.',
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
            response_composed:   'He has been thinking about that since six-thirty. "She was deciding whether to tell me something." A pause. "She decided not to." He picks up the ashtray. Sets it down. "Whatever she was deciding about — the Steward\'s route tells me it involved the Physicians room. And the Physicians room is where she keeps her bag when she attends Estate functions." He is quiet for a moment. "She didn\'t come back. But she made her decision during those twelve minutes." Another pause. "I think she decided to proceed with whatever she had come to tell me she had already decided to proceed with."',
            grants_node: 'crane_decided_to_proceed_physicians_room',
          },
        },
      },
    },

    contamination: {
      'crane': '"She told you something." He says it. Not a question. "She looked like she would." He picks up the drink. Puts it down.',
      'surgeon': 'He is very still. "The Surgeon was here an hour before he said he was. I saw him leave the study." He says it before you ask. "I assumed it was a medical visit. I was probably wrong about that."',
    },

    cognitive_load_response: '"Six-fifteen." While watching your pen. "He left the study at six-fifteen." A pause he didn\'t plan. "He had been in there since five-forty-seven." He stops. "I didn\'t write that down. I\'m telling you now."',

  },

  // ── THE CURATOR ────────────────────────────────────────────
  'curator': {
    counter_strategy:  'withhold',
    optimal_technique: 'approach',
    composure_floor:   55,
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
        // Fractured: 7:42PM decision. No drama. That absence is the fracture.
        composed:   '"Lord Ashworth requested a meeting outside the scheduled calendar. Six weeks ago. We met in the study. He told me he had been observing a pattern in the Estate\'s operations for eighteen months that had the texture of external management." A pause. "His word: texture. I found it precise. I told him what I had noticed independently. We agreed not to record the meeting. Recording it would have told whoever was watching that we had spoken."',
        controlled: '"He had noticed the same pattern I had. Separately." A pause. "Two people in the same institution seeing the same thing without coordination is either paranoia or evidence. We concluded it was the latter. He told me he intended to address it at the Rite. He asked me to arrange for someone outside the building to be present." A pause. "I did that."',
        strained:   '"I told him something was watching the Estate. I didn\'t have a name. I had a pattern." A pause. "He thanked me. He said he would be careful. He was not careful enough." A pause. "I warned him and it was not sufficient."',
        fractured:  '"I thought the crisis would be the alterations." A beat. "At seven forty-two I looked at the Register and I thought: tonight is the night this becomes visible." Another beat. "I didn\'t know it had already happened in a different room."',
        snapback:   '"I made the arrangements Lord Ashworth requested. That is the accurate accounting of my role."',
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
            response_fractured:  '"I thought the Register alterations, exposed at the Rite, would force the reckoning the Estate needed." A pause. "I did not know Ashworth would die. I thought the crisis would be the alterations." Another pause. "I was catastrophically wrong about which crisis."',
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
      'pemberton-hale': 'He is slightly more careful. "Pemberton-Hale\'s Register alterations are what they are." He says it with the precision of someone who has been asked about it.',
      'surgeon': 'A pause before his next answer that wasn\'t there before. "The Surgeon was in the building at seven forty-two." He says it. "I saw him leave the study. He was walking in the direction of the Ballroom entrance."',
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

        ballroom: {
          'Q1': {
            composed:   '"Pemberton-Hale was wearing gloves when he arrived. He removed them at supper. He put them back on after supper. That is a departure from his habit." A pause. "What he was anticipating doing with his hands is the question."',
            controlled: '"The gloves went back on after supper. Departure from routine." A pause. "The Viscount was anticipating something."',
            strained:   '"Gloves. Back on after supper." A pause. "He was preparing for something."',
            fractured:  '"Gloves. After supper. He was preparing."',
          },
          'Q2': {
            composed:   '"Dr. Crane arrived at six-thirty. Her bag was prepared before she arrived. A physician who prepares for a routine availability call does so on arrival. A physician who prepares for a specific anticipated event does so hours before." A pause. "The order of preparation is the intelligence."',
            controlled: '"The bag was ready before she arrived." A pause. "She knew before she came through the door."',
            strained:   '"Prepared bag. Before arrival." A pause. "She knew."',
            fractured:  '"Bag. Ready before arrival. She knew."',
          },
          'Q3': {
            composed:   '"The Steward controlled the serving schedule tonight. He changed the candelabras twice — once on schedule, once outside it. He covered the south corridor at seven fifty-eight." A pause. "That position, at that time, places him between Lord Ashworth and the south entrance. The timing is precise."',
            controlled: '"South corridor. Seven fifty-eight. The Steward." A pause. "The serving schedule. The candle changes. The corridor. Three true facts."',
            strained:   '"Seven fifty-eight. South corridor. The Steward. That is the position, the time, and the person."',
            fractured:  '"Seven fifty-eight. Corridor. Steward."',
          },
        },

        library: {
          // Engine selects by gameState.verdictTracker.top_suspect.
          // Default targets PH. Alternates provided for Crane/Steward losing traction.
          'Q1': {
            composed:          '"The immunity clause in the Register was added eighteen months ago. The ink is newer than the surrounding entries." A pause. "Eighteen months is not tonight\'s preparation. It is a year and a half of anticipating something specific. The question is what he was anticipating."',
            controlled:        '"Eighteen months. The immunity clause. The ink." A pause. "He was preparing for something specific. The clause is the tell."',
            strained:          '"Eighteen months. The immunity clause." A pause. "Preparation for something specific."',
            fractured:         '"Immunity clause. Eighteen months. Preparation."',
            composed_crane:    '"Dr. Crane arrived forty-five minutes before the Rite began. She was the first medical professional in the building. She examined Lord Ashworth for four minutes and said the words a physician says when a patient cannot be saved." A pause. "Those four minutes will tell you everything if you ask her about the compound."',
            composed_steward:  '"The Bond is eight years old. The Steward signed something he believed was a property arrangement witness form. The distinction between what he believed he signed and what he actually signed is the investigation\'s most important legal fact." A pause. "He has been deciding all evening how much to give you."',
          },
          // Specifically designed to keep Callum away from asking Greaves about the hedge path.
          'Q2': {
            composed:   '"Greaves has a clear alibi. The Library door was locked from the inside. Whatever he may have observed from the window is framed by the fact that he never left the room. An alibi witness\'s peripheral observations are interesting." A pause. "They don\'t change the primary record."',
            controlled: '"Greaves was in the Library. Locked from inside." A pause. "What he may have seen from the window is secondary to his alibi position."',
            strained:   '"The hedge path isn\'t the productive direction tonight." A pause. "The Register. The compound. The corridor. Those are the lines."',
            fractured:  '"The hedge path leads nowhere useful. The main building is where this happened."',
          },
          'Q3': {
            composed:   '"Three conversations will move the investigation forward. The Baron — he knows more about Crane\'s visit than he has said. The Curator — the seven forty-two conversation is the timeline\'s pivot. And Pemberton-Hale again, specifically the immunity clause and the unsigned letter." A pause. "Those three. In that order."',
            controlled: '"Baron. Curator. Pemberton-Hale again." A pause. "In that sequence."',
            strained:   '"Baron. Curator. Pemberton-Hale. That order."',
            fractured:  '"Baron. Curator. Pemberton-Hale."',
          },
        },

        vault: {
          'Q1': {
            composed:   '"You are close to a verdict. Three candidates remain viable. The Register evidence points toward the Viscount. The pharmaceutical chain points toward Dr. Crane. The corridor position points toward the Steward. Each is supported by evidence that is real, documented, and available." A pause. "The question is which chain you find most complete."',
            controlled: '"Three viable candidates. Real evidence on all three." A pause. "One of them is right."',
            strained:   '"Three candidates. All three with real evidence." A pause. "Pick the strongest chain."',
            fractured:  '"Three candidates. Real evidence. Pick one."',
          },
          'Q2': {
            composed:   '"The immunity clause is the most documented irregularity in the building tonight. Eighteen months of preparation. A Register altered incrementally over eight years. A specific protective clause added when the operation was becoming concrete." A pause. "The Viscount\'s composure, if you have applied pressure, will have reflected the weight of that. The Register chain is the strongest."',
            controlled: '"The Register. The immunity clause. The Viscount." A pause. "That is the strongest chain."',
            strained:   '"The Register chain. Documented." A pause. "Strongest."',
            fractured:  '"Register. Viscount. That\'s the chain."',
          },
          'Q3': {
            composed:   '"Whatever you have found tonight — you have found it because you were the right investigator for this specific building on this specific evening. The wound. The case before this. The year in the wilderness. Those things made you suited for this room." A pause. "I do not say that as a comfort. I say it because it is accurate."',
            controlled: '"You were selected for this specifically. The wound. The case. The specific year." A pause. "You were the right fit for this room."',
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

    silence_fill: '"Pemberton-Hale had motive. Means. Opportunity." He says it to the room. "All of those are true." A pause. "Crane had access. Knowledge. Timing." All of those are also true. He is giving you two suspects. He has not said who he thinks did it.',
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
            response_fractured:  '"I\'ve been keeping Pemberton-Hale viable. Crane viable. The Steward viable." A pause. "You were never supposed to look at the Compact connection." He says it without heat. "The cellar was not in the plan."',
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

    contamination: {
      'crane': 'He is very slightly more careful. "Dr. Crane is thorough." He says it. "Whatever she told you will be accurate." He is confirming her reliability. He needs you to trust her account because he has been steering you toward her as a suspect.',
      'pemberton-hale': '"Pemberton-Hale is exactly as guilty as he appears." A pause. "That is both a true statement and a misleading one." He doesn\'t explain which part.',
    },

    cognitive_load_response: '"The Surgeon." While watching your hands. He says it. Then: "The Surgeon arrived at five forty-seven." A pause. "I know this because I was watching the garden at five forty-seven." He stops. Looks at you. The first and only time he has told you something he didn\'t intend to tell you.',
  },

  // ── GREAVES ────────────────────────────────────────────────
  'greaves': {
    counter_strategy:  'cooperate',
    optimal_technique: 'account',
    composure_floor:   60,
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
        composed:   '"The Library window faces the east garden. It has a view along the hedge path toward the service entrance. At six-thirty, while I was settling in before locking the door, I observed a figure moving along the hedge path in the direction of the east gate. The movement was purposeful. The figure carried something." A pause. "The note told me not to involve myself in what happened outside. I did not involve myself."',
        controlled: '"Six-thirty. A figure on the hedge path." A pause. "Moving toward the gate. I noted it and I did nothing. The note said not to involve myself. It was clear about that." A pause. "I have been deciding since eight-oh-one whether the instruction applied here."',
        strained:   '"I saw someone. Six-thirty." A pause. "Hedge path, moving east, toward the gap in the hedge. There\'s a gap — at the far end. I didn\'t know what it led to." Another pause. "I wrote the time in the margin of the chess notation. Six-thirty. Figure through the gap. I didn\'t report it."',
        fractured:  '"Six-thirty." A beat. "The gap in the hedge." Another beat. "They went through it. I said nothing." A beat. "I should have said something at six-thirty."',
        snapback:   '"I have told you what I observed. The time and location are accurate."',
      },
      'Q4': {
        // "The Library — locked from the inside."
        composed:   '"From seven until the Gavel. My key. I engaged the interior lock at three minutes past seven — I checked my watch. The door did not open until I opened it after the Gavel. No one entered. No one exited." A pause. "I made notes on a correspondence chess game during the interval. The margins have timestamps. White to move. I hadn\'t moved. I was attending to the window."',
        controlled: '"Locked from seven. No one in or out." A pause. "The chess notation has times in the margin. A habit. If you need a minute-by-minute account of my position, the notation gives it."',
        strained:   '"I was in there alone from seven." A pause. "I know what I saw from the window and I know I was in the Library for everything that followed." Another pause. "Those two things are all I have."',
        fractured:  '"Locked." A beat. "From seven." Another beat. "What I saw at six-thirty is what matters. I know that now."',
        snapback:   '"The Library was locked from the inside from seven until the Gavel. That is the accurate and complete account of my position."',
      },
    },

    silence_fill: 'He describes the chess position without being asked. White queen to E4. He was considering the knight counter. He has not moved since six forty-five. He has been looking at the board and at the window alternately.',
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
            text:     '"The figure on the hedge path at six-thirty. What were they carrying."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   '"A case. Medical-sized — the proportions of a physician\'s bag, but longer. Flatter." A pause. "Moving quickly. Not running. The deliberate pace of someone who knows the route and is not uncertain about being seen because they have already decided the risk is acceptable." He is looking at the chess table. "Six-thirty. Still light. I had a clear line from the window. I noted the time at six-thirty-two."',
            unlocks: 'GA2',
            grants_node: 'greaves_saw_medical_case_hedge_path',
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
            response_composed:   '"Medium height. Precise movement — the particular economy of someone who has decided in advance exactly how far to walk and at what angle." A pause. "The case had markings I recognised as medical equipment labels. Not baggage. Medical supply labelling." A pause. "I wrote a description in the chess notation margin at six-thirty-two. I had the habit from the note — record, don\'t act." He looks at the margin. Then at the door. "I didn\'t know what I was watching at six-thirty." Another pause. "I know now. And I wrote it down." He is quiet for a moment. "That is the most useful thing I have done this evening."',
            grants_node: 'greaves_written_description_exists',
            cross_links: [{ char: 'surgeon', branch: 'q4_timeline_inconsistency' }],
          },
        },
      },
    },

    contamination: {
      'curator': 'He is very slightly more settled. "The Curator arranged things carefully." He says it. "Whatever he arranged, he arranged it to get to the right verdict." He closes the book. "I trust that."',
    },

    cognitive_load_response: '"At six-thirty." While watching your pen. "The figure in the garden was moving from the building." A pause. "They were moving away from the garden entrance. Toward the hedge gap." He stops. "There is a gap in the hedge. I noted it. I didn\'t include it in my observation because I wasn\'t asked about the hedge."',

  },

  // ── MISS VOSS ──────────────────────────────────────────────
  'voss': {
    counter_strategy:  'fragment',
    optimal_technique: 'wait',
    composure_floor:   30,
    fracture_threshold: 45,

    baseline: {
      text:         'She looks at Archive Case 3 as she speaks. It has been broken into tonight. She noticed at seven. She decided to see who would come back for it.',
      sentence_avg: 'short',
      formality:    'medium',
      tell:         'She uses "already." She was already here. The Steward already looks at the archive. The word "already" means she tracks sequences — who arrived in what order relative to what.',
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
        controlled: '"Seven o\'clock. I marked the time." A pause. "The seal was already broken when I noticed — I cannot say precisely when it was done. Someone broke it between six-thirty and seven. After seven, nobody touched it." A pause. "Whatever they needed, they already had it."',
        strained:   '"Seven. I made a note." A pause. "Nobody came back. The document that was placed in it six months ago may still be inside." A pause. "I have the delivery log. The name on the log is the question you need to ask next."',
        fractured:  '"Seven o\'clock." A beat. "Nobody came back." Another beat. "The log has a name on it."',
        snapback:   '"The log is documented. I will give you what you need in the correct order."',
      },
      'Q3': {
        // "The delivery log — the name on it."
        // Fractured: Callum's name. Six months ready. Complete precision.
        composed:   '"The delivery log for Case 3 records a single item received six months ago. The courier\'s name is on it. The timestamp is on it. The item is listed as supplementary medical documentation." A pause. "I have kept the log separate from the standard archive since I received it. The name on it does not correspond to any registered Estate courier."',
        controlled: '"Six months ago. The log." A pause. "The name isn\'t someone I know from the usual channels. I checked against the register twice. The name doesn\'t appear in Estate personnel records." A pause. "It appears in a different context. I have been trying to identify that context for six months."',
        strained:   '"I already know the name. I\'ve known it for six months." A pause. "The difficulty is — the name is not from the Estate. Not from any channel I have a record for." A pause. "I have been waiting for someone to arrive who would recognise it when I said it."',
        fractured:  '"The name on the log is yours." A beat. "Six months ago." Another beat. "You delivered a pharmaceutical document to Archive Case 3 and you don\'t know you did it."',
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
    },

    silence_fill: '"Case 3 was accessed at approximately six forty-five." She says it to the archive. "The contents were examined. Something was removed and returned." A pause. "The document that was returned is not the document that was removed."',
    silence_tell: '"The delivery log names the courier." She says it. "Six months ago. The courier believed they were delivering correspondence." She looks at you. "The name is in the delivery record. The timestamp matches the Case 3 access. The seal on the package matched the Vault door." She says it with complete precision. She has been ready to say it for six months.',

    backstory_chain: {
      'A': {
        label:            'Six years of documentation',
        unlock_condition: { composure_lte: 65 },
        questions: {
          'VOX_A1': {
            text:     '"You\'ve been documenting irregularities."',
            type:     'narrative_statement',
            cost:     5,
            response_composed:   '"I document what I observe. That is my function." She looks at Case 1.',
            response_strained:   '"For six years. Yes." She looks at Case 1. "My documentation is in Case 1 behind the Ashworth file. The Curator knows where to look." A pause. "He hasn\'t looked."',
            response_fractured:  '"Six years of irregularities. Documented. Filed. In Case 1." A pause. "And two years ago I told the Curator exactly where to look. He thanked me." Another pause. "For my diligence." She says the last two words with a precise kind of weight.',
            unlocks: 'VOX_A2',
          },
          'VOX_A2': {
            text:     '"The Steward didn\'t look at the archive tonight."',
            type:     'narrative_statement',
            cost:     3,
            response_composed:   '"He always looks. Tonight he didn\'t." She says it without elaborating.',
            response_strained:   '"He passed at six-fifteen. He didn\'t look." A pause. "He always looks. In fourteen years I have never seen him pass without looking." Another pause. "Tonight he walked past like he already knew what was in it."',
            grants_node: 'crane_arrived_before_called',
          },
          'BA1': {
            text:     '"Who gave you the package six months ago."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'She has six years of documented irregularities and she gives this carefully. "A courier I had not used before." A pause. "Clean credentials. Sealed package. Formal correspondence notation — the kind used for inter-archive transfers between institutions." She says it with the precision of a woman who logs things as a principle, not a habit. "I logged it at the time. I log everything."',
            unlocks: 'BA2',
            grants_node: 'unknown_courier_six_months',
          },
          'BA2': {
            text:     '"What did the package contain."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'She didn\'t open it. A statement of fact, not defence. "I logged it. Timestamp, credentials, seal impression — all of it in the delivery record. That is what I do. The log has been in the cabinet behind me since March." A pause. "I noticed the Case 3 seal broken at seven o\'clock tonight. I have been looking at those two things in relation to each other since seven-oh-two."',
            unlocks: 'BA3',
            grants_node: 'voss_delivery_log_exists',
          },
          'BA3': {
            text:     '"Whose seal was on the package."',
            type:     'direct_confrontation',
            cost:     15,
            response_composed:   'She looks at Callum with the precision of someone who has been waiting for exactly this question to arrive. "The impression in the log matches the one on the Vault door." A pause. "I noticed that six months ago when I filed it. I did not know what it meant." Another pause, shorter. "I think I know now what it means." She does not say what it means. She is a record-keeper. She records. The meaning is not her function.',
            grants_node: 'vault_seal_matches_delivery_seal',
            cross_links: [{ char: 'witness_map', branch: 'observation_4' }],
          },
        },
      },
    },

    contamination: {
      'curator': 'She is very careful. "The Curator has been thorough tonight." She says it without elaborating. A pause. "He looked at Case 3 before answering one of your questions. I saw him look." She says it quietly.',
    },

    cognitive_load_response: '"The document." While watching your hands. "Case 3. It was substituted." A pause she didn\'t intend. "The document that was returned is pharmaceutical documentation, not the Bond correspondence that was removed." She stops. Has just told you what was in Case 3.',

  },

  // ── PEMBERTON-HALE ─────────────────────────────────────────
  'pemberton-hale': {
    counter_strategy:  'perform',
    optimal_technique: 'record',
    composure_floor:   45,
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
        // Composed: entirely rehearsed. Performance visible at Observant difficulty.
        composed:   '"I arrived at six forty-five — I have a longstanding preference for early arrival at formal Estate events, it allows one to compose oneself before proceedings begin. I spent the hour before the Rite in the Ballroom. I spoke to the Curator at approximately seven forty-two, briefly, regarding a procedural matter. I was in the Ballroom when Lord Ashworth collapsed. I remained at the scene until the investigation was under way. I am entirely at your disposal."',
        controlled: '"Six forty-five arrival. Ballroom from seven. I spoke to the Curator at seven forty-two — a procedural matter, brief." A pause. "In the Ballroom at eight-oh-one. I\'ve been here since. I don\'t think I can add more detail."',
        strained:   '"Six forty-five. Ballroom. The Curator at seven forty-two — it was seven forty-two, I\'m certain of that." A pause. "Back to the Ballroom by seven-fifty. In the Ballroom at eight-oh-one." Another pause. "I haven\'t moved."',
        fractured:  '"Six forty-five. Ballroom. Curator at seven forty-two. Ballroom. Eight-oh-one." A beat. "That\'s the sequence."',
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
        composed:   '"The Register is a document I have worked with closely for eight years as a senior member. If there are structural questions about certain entries, the Curator is the correct authority. I will say that when I passed the Register this evening, I noted that certain amendments — I would describe them as amendments, not alterations — were, if one understood the Register\'s structural conventions, detectable. The Curator is better placed to speak to the full picture."',
        controlled: '"I noticed the entries in question over time." A pause. "They were — detectable, if one understood the conventions. I had a conversation with the Curator this evening — he indicated he was aware. I understood the matter was being handled." A pause. "I had no reason to escalate."',
        strained:   '"I spoke to the Curator at seven forty-two. He said the alterations were detectable." A pause. "His word. I understood what that meant. I had forty minutes." Another pause. "I decided to let the Rite surface it. That decision looked different at eight-oh-three."',
        fractured:  '"Detectable. The Curator\'s word." A beat. "I made them. I know they were detectable." Another beat. "Forty minutes and I decided not to act."',
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
        composed:   '"I was in the Ballroom. I have said this. Near the east entrance when Lord Ashworth collapsed — approximately twelve feet. Dr. Crane moved before I did, I will say that. She was faster. I remained at the scene. I did not touch the body. I did not leave the Ballroom until the investigation was under way."',
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
    counter_strategy:  null,
    optimal_technique: null,
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
        extended:  'He looks at the empty chair. "That was the intention. I have been sitting with what became of the intention since eight-oh-one. I have been assembling this for forty years. The Surgeon had been in place for four." A very long pause. "Four years against forty. I do not know how to account for that arithmetic."',
      },
      'Q3': {
        composed:  'He is quiet for a moment. Not withholding — assembling. "She was the Compact\'s founding partner\'s representative in the Estate\'s operations for eleven years. She was the relationship that made the two organisations possible as a mutual project rather than as competitors. She was executed forty-three years ago on my order, on the basis of evidence I believed was sound." A pause. "I did not know the evidence was false for thirty years."',
        extended:  '"When I found out, I spent the following decade building proof of what had actually happened. What I built is in the Register. What I built is what tonight was supposed to surface." He looks at the chair. "The chair was hers. I kept it because removing it felt like deciding she had been wrong to trust us. She had not been wrong. The betrayal was not hers and it was not mine. It was manufactured by a third party and we both died from it without knowing." A pause. "I have been sitting with that for forty years."',
      },
      'Q4': {
        composed:  '"Seven hundred years of unbroken operation under a rotating office. The Architect is a title, not a person. The original organisation was a peaceable scholarly body. That body was corrupted incrementally over three centuries into its current function. We identified the Seal\'s presence in our operations six years ago, working backward from the Correspondent\'s fabrication."',
        extended:  '"Identifying the presence is not the same thing as being able to prove it to a standard that ends it. That standard requires what is in the safe. That is why tonight mattered. That is why it was worth Lord Ashworth\'s risk." He stops. "That is why it was not my risk to take. I designed an operation that required someone else to carry the exposure. I have been a leader for forty years. I know what that means. I know what I owe the person who carried it."',
      },
      'Q5': {
        composed:  '"Find the safe. You have or you will have the combination — the Heir can help you assemble it if you have not already done so. What is inside the safe is what Edmund prepared for tonight. It is complete. It is evidenced. It names the Surgeon, the Correspondent, the Seal\'s routing architecture."',
        extended:  '"And it names the operational function that placed you in this building. That last document is yours. Edmund wanted you to have it. He believed you had the right to know what you were before you decided what to do with that knowledge." A pause. "The rest belongs to both organisations equally. Make the record. Name the names. The Estate\'s Rite should have done this tonight." He looks at the empty chair one final time. "You will have to do it instead."',
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
            response_composed:   'He looks at the empty chair one final time. "The record corrected. Both records — the Estate\'s and ours. That is the minimum." A pause. "The Architect identified. That is what comes after the minimum." Another pause. "And the person standing in this room given the full account of what they were positioned to be — before they decide what to do with that account." He looks at Callum. Not at the chair. At Callum. "That is why Edmund wanted you specifically. Not because you are the best investigator available." A pause. "Because you are the one with the right to know."',
            grants_node: 'sovereign_wants_record_corrected_and_architect_named',
          },
        },
      },
    },

    silence_fill: 'He looks at the empty chair. A long time. Then: "I have been having this conversation in my mind for forty years." He says it to the chair. "It arrives differently in the actual." He is quiet again.',
    silence_tell: 'The silence continues. He does not fill it. Then: "Isabelle trusted us completely. That is the thing I have never been able to put down." A pause. "The evidence was presented to her before she was executed. She saw it. She died believing it was real." He looks at Callum. "That is what I ordered. I ordered it on the basis of a lie I was given. I have been sitting with that since I found out." Another pause. "Forty years is not enough time to sit with it."',

  },

  // ── THE HEIR ────────────────────────────────────────────────
  // Compact warmth rule applies. No strained or fractured variants.
  'heir': {
    is_compact:        true,
    counter_strategy:  null,
    optimal_technique: null,
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'Twenty-six. Exact. Eight months of planning made precise. Tonight precision was not enough. They are asking Callum for permission to believe the operation was right — permission they cannot give themselves.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'They account for everything in numbers. Seventeen variables. Eight months. Four observations. The number they cannot account for is one.',
    },

    composure_variants: {
      'Q1': {
        composed:  '"Eight months. We had seventeen variables accounted for — Lord Ashworth\'s position in the Rite, the Register\'s location, the correct procedural moment for the presentation, the cross-referencing witnesses, the investigator\'s placement, the Envoy\'s confirmation run." A pause that is not evasion but arithmetic. "The Surgeon\'s method of delivery was not one of the seventeen."',
        extended:  '"I have been auditing the list since eight-oh-one. I have been asking myself which of the remaining sixteen would have changed the outcome if we had identified the seventeenth in time." A pause. "I have not found it. I am not certain that is a useful exercise." A pause. "I am doing it anyway."',
      },
      'Q2': {
        composed:  '"Twenty-six and I have been the operational lead on this project for eight months because the Sovereign trusted the planning to the person who could spend twelve hours a day on it without running out of attention." A pause. "I do not say that as a credential."',
        extended:  '"I say it because tonight has asked me whether precision is the same thing as wisdom. The answer is that it is not. I was precise about sixteen things. I missed the seventeenth." They look at the testimony wall. "The people on that wall were precise too. Precision did not protect them either."',
      },
      'Q3': {
        composed:  '"The fourth account. From memory." They do not pause before reciting it. "A physician\'s assistant, name redacted, October, forty-three years ago. States that the compound presented as cardiac medication was not in the formulary for the patient\'s documented condition. The discrepancy was filed and not pursued."',
        extended:  '"I have recited that account to myself for eight months as a reminder of what \'not pursued\' costs across forty-three years." A pause. "That account is the earliest evidence we have of the Seal using pharmaceutical channels for an operation inside both organisations. It predates the Correspondent\'s fabrication by six months." Another pause. "I do not find that comforting. I find it clarifying."',
      },
      'Q4': {
        composed:  '"Complete the Witness Map. You have at least two of the four observations already — possibly three if you spoke to Northcott and to Lady Ashworth. The Sovereign can give you the fourth from the correspondence records. When you have all four, bring them here. I will help you assemble them." A pause. "The map produces a combination. The combination opens the safe in the Vault."',
        extended:  '"When you open the safe, read your own document last. Not because the others are more important. Because you should have the full picture before you have the picture of yourself." They look at the testimony wall and then back at Callum. "Edmund requested that specifically. He was very precise about it." A pause. "Tell me what you found." Another pause. "Not what I told you. What you found."',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The seventeenth variable',
        unlock_condition: { after: 'Q2' },
        questions: {
          'HA1': {
            text:     '"What would you have done differently."',
            type:     'focused_follow_up',
            cost:     5,
            response_composed:   'They are quiet for a moment. Not composure — consideration. "We would have moved the Rite." A pause. "If we had known the Surgeon was embedded at the operational level rather than the observational level — if we had known the precise mechanism rather than the general threat category — we would have moved to a date outside his window." They look at the testimony wall. "The Rite was the anchor. Everything depended on the Rite. That was the variable we didn\'t move."',
            unlocks: 'HA2',
          },
          'HA2': {
            text:     '"How was the Surgeon missed."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'They pull a document from the testimony wall. Not quickly — deliberately, the way someone retrieves a specific file they have been thinking about all evening. "The operational record shows him as a medical consultant. No flag. No Seal designation. No routing architecture visible from our position." A pause. "He was four years embedded and the record shows a medical consultant." They set the document down. "We were watching for the Architect\'s pattern. The Surgeon doesn\'t have that pattern. He has a different one." Another pause. "I have been building the profile since eight-oh-one. The methodology has the gap named now. It will not happen again."',
            unlocks: 'HA3',
            grants_node: 'surgeon_missed_because_wrong_pattern',
          },
          'HA3': {
            text:     '"What do you need from me specifically."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'They look at the testimony wall. All thirty-one testimonies. The ones they can recite from memory. "Tell me what you found." A pause. "Not what I told you — what you found. What an investigator who came in from the outside, who didn\'t know the history, who had forty-three years of architecture working against them — what did that investigator find that we missed in eight months?" They look at Callum. "Because whatever that is — that is the gap in our methodology. And I need to know what it is before we build the next operation."',
            grants_node: 'heir_wants_callums_independent_findings',
          },
        },
      },
    },

    silence_fill: 'They look at the testimony wall. "Twenty-six accounts from people who were certain they had planned for everything." A pause. "They had not planned for everything." They say it without self-pity. They are including themselves.',
    silence_tell: 'The silence holds. They let it. Then: "I keep coming back to the seventeenth variable." A pause. "Not what it was. We know what it was. I keep coming back to the fact that there was a seventeenth variable we didn\'t know to look for." Another pause. "That means there may be an eighteenth. And a nineteenth." They look at Callum. "That is what I need you to help me account for. Before the next operation. Before we build the next thing."',

  },

  // ── THE ENVOY ───────────────────────────────────────────────
  // Compact warmth rule applies. No strained or fractured variants.
  // Q4 slip is the centrepiece — 1.5 second pause, acknowledgement, "You noticed."
  'envoy': {
    is_compact:        true,
    counter_strategy:  null,
    optimal_technique: null,
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'Fifteen years. Accent impossible to place. First visit without a cover story. He was here before Callum arrived and does not appear to have been waiting. That is because he has done this before in other tunnels.',
      sentence_avg: 'short',
      formality:    'medium',
      tell:         'The slip: "I know because I placed it there." His only field error in fifteen years. He processes it. He acknowledges it. He does not apologise. He finds it professionally interesting that it happened at all.',
    },

    composure_variants: {
      'Q1': {
        composed:  '"Confirmation run. Six months ago. I verified that the pharmaceutical formulation had been placed in Archive Case 3 through the courier specified in the operational plan. The placement was correct. The timestamp matched the window. The seal was intact on confirmation." A pause. "My confirmation report was filed with the Compact\'s operational record."',
        extended:  '"A copy of that report, through the Surgeon\'s access to our internal communications, was filed with the Seal. I did my job correctly." A pause. "My job was used against what I was doing my job for. I have been working out how I feel about that for approximately an hour." He stands in the same position he was in when Callum entered. He was here before Callum arrived. He does not appear to have been waiting.',
      },
      'Q2': {
        composed:  '"Through the courier specified in the operational plan. The courier was listed by name and confirmed by credentials through two independent channels. I ran the confirmation six months ago and the placement was verified."',
        extended:  '"The courier\'s name is in the delivery log. Miss Voss will have it." A pause. "I know the name because I placed the document there myself, using the courier\'s credentials as cover. The placement was made directly to ensure the chain of custody was complete." He processes what he has just said. A pause — 1.5 seconds, not performed. "That is the first error in fifteen years of field communication. I am not going to qualify it."',
      },
      'Q3': {
        composed:  '"Four years. He joined the medical consultancy at the Sovereign\'s invitation as a credentialed cardiac specialist with verifiable references. All four years of his records are clean. The Compact\'s internal review has no anomalies on his file prior to tonight."',
        extended:  '"Four years is long enough to learn a communications channel in sufficient detail to route a copy of my confirmation report to an outside party." He turns slightly — not away, but to the angle of someone thinking rather than deflecting. "I have been in this work for fifteen years. I know how long that takes. He was patient. More patient than the operation required. That patience is a specific kind of signature."',
      },
      'Q4': {
        // Q4 slip — the centrepiece.
        composed:  '"Yes." Nothing before the word and nothing after it for two seconds. "My confirmation report on this operation also served as my confirmation report on you. Six months ago I verified your placement in the courier chain and filed a report on your suitability as an asset for this operation." A pause. "That report reached the Sovereign."',
        extended:  '"It also reached the Seal. Through the Surgeon\'s channel. The report that placed you in this building as the Compact\'s chosen investigator also placed you in the Seal\'s operational record as a recruited asset. Both records are accurate. Both describe the same action. They were written for different readers." A pause. "I did not know, when I wrote mine, that it would have two." He is more affected by this than he expected. That is visible. He does not apologise for it being visible. He looks at Callum. "You noticed."',
      },
    },

    backstory_chain: {
      'A': {
        label:            'The fifteen years',
        unlock_condition: { after: 'Q4_slip' },
        questions: {
          'EA1': {
            text:     '"You said you placed it there."',
            type:     'partial_claim',
            cost:     3,
            response_composed:   'He pauses exactly 1.5 seconds. Then: "Yes." He says it the way a field professional acknowledges an error — directly, without apology, as a statement of fact about a fact. "I placed the document in Archive Case 3 six months ago. I used a courier identity. The identity was clean. The delivery was clean." A pause. "The error was the slip just now." He looks at Callum with something that is not quite warmth and not quite assessment — something between the two, more considered than either. "In fifteen years that is my first field error of that kind."',
            unlocks: 'EA2',
            grants_node: 'envoy_placed_document_case3_six_months',
          },
          'EA2': {
            text:     '"What was the document."',
            type:     'focused_follow_up',
            cost:     8,
            response_composed:   'The routing record. The original. The one that places the Correspondent in the Estate\'s Archive two weeks before Isabelle\'s evidence surfaced. "The Compact has held it for forty-three years." A pause. "It was placed in Case 3 so the Estate\'s own Rite would surface it through the Estate\'s own record. Not presented from outside — found inside." He says the distinction with the precision of someone for whom institutional distinctions are operational, not rhetorical. "Edmund understood that distinction. He asked for the document specifically. He understood that the Estate receiving its own evidence would carry a weight that any external presentation would not."',
            unlocks: 'EA3',
            grants_node: 'routing_record_placed_for_internal_discovery',
          },
          'EA3': {
            text:     '"Do you regret the slip."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'He considers this. Not quickly. With the precision of someone for whom field errors are a professional category, not an emotional event. "The slip produced a conversation that will likely result in the correct verdict." A pause. "In outcome terms the slip was neutral." Another pause, shorter. "In methodology terms it was unacceptable." He looks at Callum with something that is not quite warmth and not quite amusement. They are close neighbours and he is standing precisely between them. "I find I am not entirely able to separate those two assessments. That is unusual for me."',
            grants_node: 'envoy_cannot_separate_outcome_from_method',
          },
        },
      },
    },

    silence_fill: 'He stands in the same position he has stood in since Callum arrived. "Confirmation is a clean discipline." He says it to the middle distance. "You verify the placement. You file the report. The report describes what happened." A pause. "It does not describe what the report will be used for." He is not defending himself. He is describing the architecture.',
    silence_tell: 'The silence. He is comfortable in it in a way that most people are not. Then: "My report on you was accurate." A pause. "Everything I filed was accurate. The placement was real. Your function was real. I described what I observed." He looks at Callum. "I did not know I was describing it for two different readers." Another pause. "That is the only sentence I have produced in fifteen years that I cannot fully account for." He says it with the precision of someone identifying a structural flaw. Not distress. Precision.',

  },

  // ── THE ARCHIVIST ────────────────────────────────────────────
  // Compact warmth rule applies. No strained or fractured variants.
  'archivist': {
    is_compact:        true,
    counter_strategy:  null,
    optimal_technique: null,
    composure_floor:   100,
    fracture_threshold: null,

    baseline: {
      text:         'Twelve years of records. Opens the relevant volume without looking up the page number. Hands very steady. Wanted to be ready for this moment. Finds they are not, quite, ready.',
      sentence_avg: 'medium',
      formality:    'medium',
      tell:         'The volume is already open. The page is already marked. They pulled it before Callum arrived. They have been ready for twelve years. They find they are not, quite, ready.',
    },

    composure_variants: {
      'Q1': {
        // Opens the Register without being asked. Volume already pulled. Page already marked.
        composed:  'They open the relevant volume without looking up the page number. "Records of every formal operation the Compact has undertaken since its founding. Correspondence — incoming and outgoing, including copies of letters the Estate never sent us but that we sent them. Personnel files. The Black Register. Bond documentation for every asset the Compact has verified — active, inactive, and unwitting."',
        extended:  'They look at Callum and then back at the volume. "Yours is in the third column of volume forty. November. I wrote the entry myself. I wanted to be ready for when you asked about it." A pause. "I find I am not quite ready. I thought being ready for a moment and the moment arriving were the same thing." A pause. "They are not."',
      },
      'Q2': {
        composed:  '"Volume forty. Third column. November." They have been ready to say this for twelve years. "Your name. Your signature — you signed it believing it was a correspondence intake form for a private investigation firm that no longer exists. The form was administered by a Seal front. The Compact copied the document through our Seal monitoring channel and filed it."',
        extended:  '"The operational functions listed on the form correspond to four actions you performed over the following fourteen months without knowing you were performing them." They turn the page to the correct entry and do not hand it to Callum yet. "The four functions are listed precisely. Edmund Ashworth reviewed this entry personally six years ago. He wrote one note in the margin." A pause. "The note says: he doesn\'t know. Make sure he knows before he decides anything else."',
      },
      'Q3': {
        composed:  '"The Black Register is the record of what the Compact observed the Estate doing when the Estate believed it was unobserved. Tonight\'s date is at the top. Lord Ashworth\'s name is at the bottom of the operational list — the last entry before the record closes."',
        extended:  '"The Register shows forty years of an organisation keeping precise records of a separation it knew was manufactured and waiting for the institutional moment to correct it. Tonight was the institutional moment. The record was ready. The correction was designed." They close the Register. "The Surgeon was present at five forty-seven and the record did not account for him because the record accounts for what the Compact observed, not for what it didn\'t observe." A pause. "That gap is ours. I have been sitting with it since eight-oh-one."',
      },
      'Q4': {
        composed:  '"The Witness Map requires four observations. You likely have two or three already. The observation you may be missing — if you have not yet spoken to the Sovereign about the correspondence — is this: in the Compact\'s record of Lord Ashworth\'s correspondence with the Sovereign over six years, there is a specific phrase that appears in both the Compact\'s copy and in the Estate\'s burned fragments."',
        extended:  '"That phrase is the fourth observation. It places both organisations at the same point simultaneously. The point is the combination." They write the phrase on a small card and hold it out. "The Heir has the map. When all four observations are assembled the map produces four numbers. The numbers open the safe. The safe is in the Vault." A pause. "Read the entries in order. Read yours last. Edmund asked for that specifically." Another pause. "He said: make sure he has the full picture before he has the picture of himself."',
      },
    },

    backstory_chain: {
      'A': {
        label:            'Volume forty',
        unlock_condition: { after: 'Q2' },
        questions: {
          'BA1': {
            text:     '"Volume forty. Third column. November. My entry."',
            type:     'partial_claim',
            cost:     5,
            response_composed:   'They do not look surprised. They have not looked surprised this evening. "I wondered when you would arrive at that page." A pause. "The entry is factual. It records your operational function as it was designed by the routing architecture. It records the case that preceded tonight — the specific circumstances, the outcome, the personnel involved." A pause. "It records the Seal\'s assessment of the outcome." They look at the Register. "The assessment is that the outcome was satisfactory from their position."',
            unlocks: 'BA2',
            grants_node: 'callums_entry_exists_volume_forty',
          },
          'BA2': {
            text:     '"What was the Seal\'s assessment."',
            type:     'focused_follow_up',
            cost:     10,
            response_composed:   'The Archivist opens the Register. Volume forty. Third column. November. They set it in front of Callum. They do not read it aloud. The entry is twelve lines. The last line reads: asset confirmed viable, redemption arc proceeding on schedule, Estate placement authorised. They close the Register. "You were not a mistake." A pause. "You were a test. The false case was the audition. Tonight was the placement." Another pause. "That is what the record shows."',
            unlocks: 'BA3',
            grants_node: 'callum_was_auditioned_for_estate_placement',
          },
          'BA3': {
            text:     '"Did you know before tonight."',
            type:     'focused_follow_up',
            cost:     12,
            response_composed:   '"I knew when you arrived at the gate. Your name is in volume forty." A pause. "I have been keeping this record for twelve years. I keep it because someone has to keep it and because the keeping is the argument against the Seal\'s operation — that it can be documented, that documentation survives, that what survives can be used." They close the Register. The gesture is complete. Final. "You are the first person the record describes who has also read the record." A pause. "I have been waiting twelve years for that to happen." Another pause. "Edmund said it would." They look at Callum directly. "He was right about most things."',
            grants_node: 'archivist_waited_twelve_years_for_callum',
            cross_links: [{ char: 'witness_map', branch: 'observation_4_final' }],
          },
        },
      },
    },

    silence_fill: 'They open the Register to a page that is not volume forty. An earlier volume. They read a line without reading it aloud. Then close it. "Every entry describes a person who did not know they were being described." A pause. "That has been true for twelve years. Tonight it stopped being true." They close the Register.',
    silence_tell: 'The silence is very long. The Archivist does not mind silence. Then: "Edmund wrote one note in the margin of your entry. I have read it many times." A pause. "It says: he doesn\'t know. Make sure he knows before he decides anything else." Another pause. "He wrote it six years ago. He has been making sure you would know since six years ago." They look at Callum. "You are the first person the record describes who has also read the record. I have been waiting twelve years for that sentence to be true." A pause. "It is true now."',

  },

};

// ── ACTIVE SESSION STATE ──────────────────────────────────────

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
  if (!data) {
    // Character not in interrogation system — open normally
    if (typeof window._openConversationDirect === 'function') {
      window._openConversationDirect(charId);
    }
    return;
  }

  _interrogationState.activeChar = charId;

  // Build technique selector — portrait top, baseline middle, choices bottom
  const overlay = document.createElement('div');
  overlay.id = 'technique-selector';
  overlay.style.cssText = [
    'position:absolute',
    'inset:0',
    'z-index:500',
    'background:#080503',
    'display:flex',
    'flex-direction:column',
    'overflow:hidden',
    'font-family:var(--font-ui)',
  ].join(';');

  // Portrait zone — top third
  const portraitZone = document.createElement('div');
  portraitZone.style.cssText = [
    'flex:0 0 32%',
    'position:relative',
    'overflow:hidden',
    'border-bottom:1px solid rgba(42,37,28,0.4)',
  ].join(';');
  const portraitUrl = typeof getCharPortrait === 'function' ? getCharPortrait(charId) : '';
  if (portraitUrl) {
    portraitZone.style.backgroundImage = `url(${portraitUrl})`;
    portraitZone.style.backgroundSize = 'cover';
    portraitZone.style.backgroundPosition = 'center top';
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

  // Baseline — scrollable middle
  const baseline = data.baseline;
  const baselineEl = document.createElement('div');
  baselineEl.style.cssText = [
    'flex:1 1 auto',
    'overflow-y:auto',
    '-webkit-overflow-scrolling:touch',
    'padding:14px 20px',
    'font-size:12px',
    'color:rgba(180,165,130,0.75)',
    'line-height:1.6',
    'font-style:italic',
    'border-bottom:1px solid rgba(42,37,28,0.3)',
    'min-height:0',
  ].join(';');
  baselineEl.textContent = baseline.text;
  overlay.appendChild(baselineEl);

  // Five choices — pinned to bottom
  const choicesWrap = document.createElement('div');
  choicesWrap.style.cssText = [
    'flex-shrink:0',
    'padding:0 20px 4px',
    'background:#080503',
  ].join(';');

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
    callumLine.textContent = `"${tech.callum_line}"`;
    btn.appendChild(callumLine);

    btn.onclick = () => {
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

  if (typeof updateComposureState === 'function') {
    updateComposureState(charId);
  }

  // Check fracture
  const threshold = data ? data.fracture_threshold : 40;
  if (newComposure <= threshold && current > threshold) {
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

  // Close conversation after delay
  setTimeout(() => {
    const panel = document.getElementById('conversation-panel');
    if (panel) panel.classList.remove('open');
    if (typeof saveGame === 'function') saveGame();
  }, 4000);
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
      setTimeout(() => {
        resp.textContent = data.silence_tell;
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
    if (typeof renderWordByWord === 'function') {
      renderWordByWord(resp, response, 60);
    } else {
      resp.textContent = response;
    }
  }

  // Snapback
  if (q.snapback && charState.composure <= 45) {
    setTimeout(() => {
      const snapResp = document.getElementById('char-response');
      if (snapResp && q.snapback) {
        snapResp.textContent = q.snapback;
        NocturneEngine.emit('snapbackFired', { charId });
      }
    }, 3500);
  }

  // Grant information node
  if (q.grants_node && typeof window._markNode === 'function') {
    window._markNode(q.grants_node);
  }
  if (q.grants_node) {
    NocturneEngine.emit('questionAnswered', { charId, qId: `branch_${branchId}_${qId}`, qType: q.type });
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

const _originalRenderQuestions = window.renderQuestions;
window.renderQuestions = function(charId) {
  _originalRenderQuestions(charId);
  renderBranchQuestions(charId);

  // Add cognitive load button for eligible chars
  _addCognitiveLoadOption(charId);

  // Add technique switch button if conversation in progress
  _addTechniqueSwitchButton(charId);
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
