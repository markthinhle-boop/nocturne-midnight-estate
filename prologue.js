// ============================================================
// NOCTURNE — prologue.js
// Free-tier pre-murder mingle. 7:00–7:15PM (narrative).
// Foyer arrival → mingle → Rowe in billiard-room → cinematic →
// post-murder ballroom → Hale interrogation → paywall.
//
// ARCHITECTURE: prologue patches the existing CHARACTERS data
// store with prologue intros + Tier 1 dialogue, sets is_compact
// to bypass the technique selector, and routes through the same
// openConversation() pipeline used post-paywall. Same UI, same
// portrait, same notepad/board/map. Only the dialogue content
// differs. On paywall success, originals are restored.
//
// Paid: drop into foyer, post-paywall engine takes over.
// Declined: bounce to train-screen, infinite loop.
// KB v10-final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── STATE ──────────────────────────────────────────────────
window.PROLOGUE_STATE = {
  active:                false,
  phase:                 'mingle',
  rowe_duel_done:        false,
  cinematic_armed:       false,
  cinematic_played:      false,
  hale_dialogue_opened:  false,
  hale_dialogue_closed:  false,
  patches_applied:       false,
  _originals:            {},
};

// ── ROOM ACCESS ────────────────────────────────────────────
const PROLOGUE_FREE_ROOMS = [
  'foyer','gallery','study','terrace','maids-quarters','groundskeeper-cottage',
  'map-room','dining-room','trophy-room','billiard-room','weapons-room','conservatory'
];

// ── PROLOGUE NPC ROOMS ─────────────────────────────────────
window.PROLOGUE_NPC_POSITIONS = {
  'foyer':                  ['curator'],
  'gallery':                ['crane','greaves'],
  'study':                  ['baron'],
  'terrace':                ['vivienne','hatch'],
  'maids-quarters':         [],
  'groundskeeper-cottage':  [],
  'map-room':               ['surgeon'],
  'dining-room':            ['steward'],
  'trophy-room':            ['pemberton-hale'],
  'billiard-room':          ['rowe'],
  'weapons-room':           ['northcott'],
  'conservatory':           ['ashworth'],
};

// ── TIER 1 DIALOGUE PATCHES ─────────────────────────────────
// Each entry replaces the character's dialogue/intro/room for the
// prologue. Schema matches CHARACTERS schema so existing renderQuestions
// and askQuestion work as-is. No gates on these questions.
// Rowe is NOT patched — his existing engine (intro→FUNNEL→duel) handles him.
const PROLOGUE_PATCHES = {

  // ── THE CURATOR ─────────────────────────────────────────────────
  // ENGINE: gnomic / aphoristic. Carved sentences. Almost no qualifiers.
  // Lines feel like proverbs. The opposite of nervous chatter.
  'curator': {
    room: 'foyer',
    intro: 'The grandfather clock has just declared seven. The Foyer is otherwise still.\n\nHe is unmasked. He inclines his head a fraction as you cross the threshold.\n\n"Mr. Grey. Welcome to the Estate. The Rite begins at eight."',
    dialogue: {
      'Q1': { question: 'You were expecting me.',          type: 'choice', response: '"The Estate generally is. It has not, in two centuries, been wrong about who would arrive." A small gesture at the room. "Lord Ashworth thought it appropriate that a first-time visitor be received by the ceremonial part of the evening. I am the ceremonial part. The Rite is the rest."' },
      'Q2': { question: 'What is the Rite, exactly?',      type: 'choice', response: '"At eight, Lord Ashworth opens the Black Register before the assembled membership. The Register has not been opened in public in living memory." A breath. "Most of the people in this house have been preparing for that fact in one form or another. The Register, when it opens, will have things to say about a great many of them."' },
      'Q3': { question: 'What kind of man is Lord Ashworth?', type: 'choice', response: '"Meticulous." The word lands the way a bricklayer sets a brick. "Forty years on this Estate. He has not, in those years, misplaced a record, a name, or a debt." A pause. "He has been preparing for tonight for six years. When a man spends six years preparing to say a thing in public, what he intends to say is generally either very true or very dangerous. With Ashworth it tends to be both."' },
      'Q4': { question: 'Why am I the only one without a mask?', type: 'choice', response: '"Because you are not yet a member. The mask is a courtesy. The Estate has always preferred its formal evenings discreet." A measured nod. "You are the exception tonight. Most people would rather be hidden than seen. The Society has been good business for the maskmakers of this country for two centuries."' },
      'Q5': { question: 'Where should I go until eight?',  type: 'choice', response: '"Anywhere that is not the Ballroom. The grounds are open. The guests are masked. They will not introduce themselves. Read it as architecture."' },
    },
  },

  // ── NORTHCOTT (masked) ──────────────────────────────────────────
  // ENGINE: self-correcting / parenthetical. Restarts sentences mid-air.
  // Lots of "that is —" and "well, no, more —". NOT WITTY. Earnest awkwardness.
  'northcott': {
    room: 'weapons-room',
    intro: 'A small sherry rests on the side-table among the mounted sabres. It has not been drunk, or refilled, or moved by even the smallest inadvertent inch. The young masked figure beside it is putting genuine effort into not touching it.\n\nA leather-bound notebook is tucked under his arm. He looks up sharply when you enter.',
    dialogue: {
      'Q1': { question: 'Admiring the swords?',           type: 'choice', response: '"Yes. That is — no, that is not exactly — I was looking at them. I have been told it is appropriate to know the building one is asked to be in." A pause. "They are decorative. None of them have an edge. I checked. Not because — I just wanted to confirm. They are decorative."' },
      'Q2': { question: 'You don\'t look like you\'re enjoying yourself.', type: 'choice', response: '"I am." Said immediately, which is the wrong way to answer the question. He hears himself. "That is — I am attempting to. The sherry is — the sherry is excellent, I am sure. I have not — the rooms are warm. The rooms are very warm." A glance at the door.' },
      'Q3': { question: 'What\'s the notebook for?',       type: 'choice', response: '"Notes. It is a — a house book. The Estate keeps one. I write down — the things one writes down. Who arrived, mostly. Who I have spoken to. The candles, I have noted twice — I am not certain why I have noted them twice but they are noted." He glances at the notebook. "It is a record. Records are — the Estate likes records."' },
      'Q4': { question: 'Who told you you had the right temperament?', type: 'choice', response: '"Lord Ashworth. He — he did not specify which temperament. I have been — I have been examining various of mine since." A pause. He hears how this sounds. "He is not the sort of man one asks twice. About anything. So I have not asked."' },
    },
  },

  // ── THE STEWARD (masked) [form-break] ───────────────────────────
  // ENGINE: minimalist / weighted. 3-4 word sentences. Long silences.
  // Strip elaboration. The economy of someone saving words.
  'steward': {
    room: 'dining-room',
    intro: 'The dining room has been set for sixty.\n\nThe masked figure is at the head of the table. Not at the candelabra, where one would expect him. At the head, where one would not. His hands are clasped behind his back. He is reviewing the seating. He has been doing it for some time.\n\nHe is aware of you. He is choosing not to be.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: 'Only then does he turn, and only by degrees. "Good evening." The hands stay behind the back. "Candles at quarter to. Until then, the room rests."' },
      'Q2': { question: 'You weren\'t at the candelabra.', type: 'choice', response: '"No." A pause. "The seating." Another. "Three weeks finalised. One confirms."' },
      'Q3': { question: 'You\'ve been here a long time.',  type: 'choice', response: '"Long enough." A pause. "The house has not required me to count." A longer one. "Three presidents. Four chefs. The chefs were the harder loss."' },
      'Q4': { question: 'What are you watching for?',      type: 'choice', response: '"The candles." A pause. "South window. Draught since 1881." A second pause, shorter. "It is the thing one watches for."' },
      'Q5': { question: 'See you at the Rite.',            type: 'choice', response: '"At the Rite. Good evening." He returns his attention to the table.' },
    },
  },

  // ── THE BARON (masked) ──────────────────────────────────────────
  // ENGINE: sprawling, Wodehousian. KEEP WITTY — armor.
  // Long elaborate constructions, embedded clauses, deliberately overwrought.
  'baron': {
    room: 'study',
    intro: 'The leather armchair by the fire. The cigar, trailing a thin unhurried line of smoke toward the ceiling. The brandy on the side-table, which has not been full for some time. The clock on the mantel, reading seven minutes past, which he has not consulted and does not need to.\n\nAnd then, at the centre of these arrangements, a masked figure who has decided this chair will be his and would not be sorry if anyone tried to contest the claim.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Is it." Not a question. A small slow exhale. "The evening is presently producing cigars, brandy, and the general absence of obligation, all three of which I have always considered to be the cardinal virtues of evenings, in roughly that order. It is also producing, I am told, a great deal of small talk in the adjacent rooms, which I am tolerating from the considerable distance afforded by this chair." The faintest gesture of the cigar. "I am, against my own expectations and a not inconsiderable body of historical evidence, having quite a nice time."' },
      'Q2': { question: 'You don\'t enjoy these things.',  type: 'choice', response: '"I have a personal and long-standing objection to wearing a face I did not choose, in a room arranged by men I did not invite, on the schedule of a clock I do not own, in pursuit of an outcome I have not been consulted about and would, if consulted, almost certainly have advised against." A pause for effect, which he is enjoying enormously. "Apart from those four small reservations, the evening is going beautifully."' },
      'Q3': { question: 'What should I know about Lord Ashworth?', type: 'choice', response: '"Ashworth." The cigar pauses. "There are perhaps four men alive who have any idea what he is about to do tonight. He is one. I am another." The cigar resumes its line, slowly. "Beyond that I am, as we say in this miserable little Society of ours, not at liberty — and you would not, I suspect, thank me for the parts I am at liberty about. Ashworth has the gift, vanishing in our class, of meaning rather precisely what he says. It is one of his less endearing qualities, and the principal reason I have always found him bearable."' },
      'Q4': { question: 'Why are you in here, not out there?', type: 'choice', response: '"Two reasons, the names of which are also their reasons." He raises the cigar. "This. And —" he raises the glass. "This. The Estate, in its institutional wisdom, prefers its members to mingle in the period before a Rite. I have always taken the contrary and, I venture, the more efficient view, which is that mingling is best done by sitting absolutely motionless in the most comfortable chair available and waiting for the more interesting half of the room to come and find you." The glass tips a fraction toward you, in something not quite a toast. "Tonight — the system has worked."' },
    },
  },

  // ── LADY ASHWORTH (masked) ──────────────────────────────────────
  // ENGINE: wistful / displaced. Talks to objects and absences instead of player.
  // Half her sentences addressed to no one. Distracted, melancholy.
  // Cutting accidentally, not constructively.
  'ashworth': {
    room: 'conservatory',
    intro: 'The lamps are kept low here. They have always been kept low here. The orchids have the slightly louche posture of plants that have been listening to too many conversations. A single candle on the wrought-iron table has burned an inch lower than the others.\n\nThe masked woman among them holds a folded letter loosely in her gloved fingers. She does not appear to be reading it. She also does not appear to want to put it down.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Good evening, Mr. Grey." The letter folds once, neatly. She is not looking at you when she says it. She is looking at one of the orchids. "They have been told you are aware," she says, to the orchid. Then, to the letter: "They have been told a great many things this evening."' },
      'Q2': { question: 'Are you waiting for someone?',    type: 'choice', response: '"Eight o\'clock," she says. To the candle. "I have spoken to it three times this evening. It has been entirely unmoved." A small pause. "My husband can be similar. Eight o\'clock and my husband. The two of them are related, I think, by temperament." The letter is unfolded. The letter is refolded.' },
      'Q3': { question: 'You don\'t seem nervous about tonight.', type: 'choice', response: '"My husband does not arrange evenings he is uncertain about. He learns the names. The seals. The silver. The proximity of the doors." She is addressing the glass panels now, not you. "By the time an evening of his arrives, the evening has very little say in the matter." The amusement, when it comes, is not for the player. "He has not arranged my nervousness for tonight. He has arranged everything else."' },
      'Q4': { question: 'I\'ll let you wait.',             type: 'choice', response: '"Thank you." She does not look up. "You have been a kindness. The orchids had run out of new things to say." A pause, for the orchids. "They will think of more. They always do."' },
    },
  },

  // ── CRANE (masked) ──────────────────────────────────────────────
  // ENGINE: clinical / appraising. Subject-verb-judgment. No softeners.
  // Funny because of the absence of social cushioning.
  'crane': {
    room: 'gallery',
    intro: 'The Gallery is the longest room in the house and the quietest. From the far end, very faintly, the murmur of the Foyer can be heard.\n\nA masked woman stands close to one of the portraits — closer than the convention of the room suggests. The lamp picks up the small glint of a glass in her left hand. Sherry. Slightly less of it than there was.',
    dialogue: {
      'Q1': { question: 'A friend of yours?',              type: 'choice', response: '"He died in 1804. The brushwork is excellent. The face is appalling." A fractional tilt. "The painters of two centuries ago rendered their subjects accurately. The trick has been lost. Modern portraiture is a flattery service. One can no longer tell the bankers from the bishops."' },
      'Q2': { question: 'You attend these often?',         type: 'choice', response: '"More than I would choose. Less than I am asked." A sip. "Lord Ashworth runs a tight Society and a generous bar. In that order. One tolerates the first for the second." Another sip. "Tonight is meant to be more interesting. I have been instructed to expect it."' },
      'Q3': { question: 'Why are you in here, not in the drawing room?', type: 'choice', response: '"The drawing room contains the Hon. Charles Allerton. The Gallery does not. This is sufficient." Another sip. "The orangery contains Mrs. Allerton, who has been performing the same service for thirty-one years. It is a more difficult job. She is paid in sympathy and house wine."' },
      'Q4': { question: 'You don\'t look like a woman doing her best.', type: 'choice', response: 'The wit does not arrive. She looks at the glass. "No." Quietly. "I am better at it on other evenings." A small shake of the head. "The sherry is excellent. The admiral is dead. I have what I need."' },
      'Q5': { question: 'See you at the Rite.',            type: 'choice', response: '"Eight o\'clock. Ballroom. Third row, left side, near the door." The glass rises, not quite to you. "The portraits will still be here afterward. So will the admiral."' },
    },
  },

  // ── VIVIENNE (masked) ───────────────────────────────────────────
  // ENGINE: sensual / unhurried. Short present-tense observations.
  // Voice does the work, not the wordplay. Direct, not witty.
  'vivienne': {
    room: 'terrace',
    intro: 'A masked woman is at the balustrade. She is not doing anything. The not-doing has the particular completeness of a person who is exactly where she means to be. The terrace lamps are warm; the gardens behind her are not. She is half in each.\n\nShe turns — unhurried, at the moment of her choosing.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Bonsoir." She looks at you. She keeps looking. "You are the one without a mask." A pause. "I had heard." Another. "I had not been told you would arrive on the terrace. I had been told you would arrive in the Foyer." The smile is in the voice. "The terrace is better."' },
      'Q2': { question: 'You\'ve been watching me.',       type: 'choice', response: '"I have been watching the room. You crossed the room." A pause. "There is a difference." Her eyes are still on yours. "Curiosity. And then, recreation. Tonight has not given me much in the way of recreation."' },
      'Q3': { question: 'You know the Estate well?',       type: 'choice', response: 'For a moment the warmth is set down somewhere, like a glass on a railing. The look that replaces it is calm and considering. "I know what the Estate tells me." Then the warmth comes back. "Houses are not unlike men. The ones worth knowing reveal themselves slowly. Never to anyone in a hurry."' },
      'Q4': { question: 'Why are you out here alone?',     type: 'choice', response: '"I am not alone. You are here." A fact, observed. "The Foyer was full of men. The drawing room was full of women." A pause. "The terrace was empty. I have a rule about empty terraces. I keep them company."' },
      'Q5': { question: 'What do you do here?',            type: 'choice', response: 'A pause longer than the question expects. "Tonight? I am decorating a terrace." Her eyes do not move from yours. "On other evenings I do other things. The Estate is good at finding occupations. I have, on the whole, been willing."' },
      'Q6': { question: 'I should let you enjoy the evening.', type: 'choice', response: '"Should you." Not quite a question. The gardens go unattended. "Eight o\'clock — the Rite. After eight — well." A breath. "Houses tell more after eight o\'clock. So do their guests. So, occasionally, do I." The smallest inclination of her head. "Bonne soirée, Mr. Grey. The terrace will still be here."' },
    },
  },

  // ── HATCH (masked) ──────────────────────────────────────────────
  // ENGINE: plain / weather-spoken. Working-man speech. NO flourishes.
  // The architect-of-ale line was MINE not his — cut.
  'hatch': {
    room: 'terrace',
    intro: 'A masked man is at the far end of the terrace, near the low wall that drops to the rose beds. He is unhurried in the way weather is unhurried.\n\nA pewter mug rests on the stone beside him, half-full. It has been half-full the entire time you have been on the terrace.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Mr. Grey." A nod. "Lord Ashworth said you\'d come on the seven o\'clock train. He didn\'t say much else. He doesn\'t." A pause. "Saves his words for rooms with chairs."' },
      'Q2': { question: 'You\'re not at the assembly?',    type: 'choice', response: '"Not tonight. Grounds want attending to." A nod toward the dark gardens. "Always do. After thirty years a man learns where the Estate wants him and where it doesn\'t."' },
      'Q3': { question: 'What\'s the ale like?',           type: 'choice', response: 'He looks at the mug. "Not what it was." A pause. "New brewer. Old habits. The two don\'t always meet well."' },
      'Q4': { question: 'Anything been odd tonight?',      type: 'choice', response: 'A long unhurried look at the gardens. "Quieter than usual. Deer haven\'t come down to the lower lawn." A pause. "Not unusual on its own. Worth noting all the same."' },
      'Q5': { question: 'See you later.',                  type: 'choice', response: '"Likely. Terrace, gardens, the lower walk." The mug rises a half-inch. "Old habit. Quiet evenings deserve company."' },
    },
  },

  // ── THE SURGEON (masked) ────────────────────────────────────────
  // ENGINE: warm / question-returning. Bends statements into questions.
  // Most of his lines should END turning the inquiry back on the player.
  'surgeon': {
    room: 'map-room',
    intro: 'The map-room is warm. The lamps are turned up higher than the rooms before it. The maps on the long table catch the light the way old paper does, which is to say expensively.\n\nThe masked figure leans over the table, one gloved finger resting lightly on a coastline that has been redrawn at least twice in the last century. He looks up the moment you enter, as if he had been mildly looking forward to the interruption.\n\nThe warmth is the first thing one notices about him.',
    dialogue: {
      'Q1': { question: 'Planning a journey?',             type: 'choice', response: '"Studying an old one. These maps predate the modern borders by some distance." The smile in the voice is gentle. "I find the changes instructive. Don\'t you? People are very confident about borders until one shows them an older map."' },
      'Q2': { question: 'You collect maps?',               type: 'choice', response: '"I read them. Are you a reader, Mr. Grey?" A pause. "Lord Ashworth maintains a remarkable collection. One does not encounter this room twice in a lifetime — though I suspect you knew that already, or you would not have entered it."' },
      'Q3': { question: 'Have you been here before?',      type: 'choice', response: '"Tonight is my first formal evening at the Estate. And yours, if I have it right?" He smiles, warmly. "Lord Ashworth has the reputation of a man who curates his guests. What did he tell you, when he asked you to come? I am curious which version of the evening he gave you."' },
      'Q4': { question: 'You walked the whole building?',  type: 'choice', response: '"Did I? I walked the corridors. Whether that counts as the building — I will leave to you." A small, warm pause. "I have been wondering what kind of man, after forty years, decides this is the evening on which to be public about a private matter. What is your view? You are the only person in the building tonight without a stake in the answer."' },
      'Q5': { question: 'Looking forward to the Rite?',    type: 'choice', response: '"With what I would call professional interest. Are you?" Another small smile. "You are at an unusual evening, Mr. Grey. I am paying close attention to it. I imagine you are too. Forgive me — I find I am more interested in your evening than my own."' },
    },
  },

  // ── GREAVES (masked) ────────────────────────────────────────────
  // ENGINE: taxonomic / categorizing. Sorts. Grades. KEEP WITTY in the appraisal shape.
  'greaves': {
    room: 'gallery',
    intro: 'The portrait of Lord Ashworth at the far end of the long Gallery is fifteen years old. Lord Ashworth, on the evidence of the portrait, was already a man one would not wish to disappoint. Lord Ashworth, on the evidence of the present evening, has spent the intervening years confirming the painter\'s instinct.\n\nThe masked figure standing before the portrait is comparing the painted version against the original.',
    dialogue: {
      'Q1': { question: 'A good likeness.',                type: 'choice', response: '"Of two kinds. The painter\'s competence: high. The subject\'s patience for being rendered as he was rather than as he wished: also high — a rarer combination than the National Gallery would have you believe. Most contemporary portraiture sorts into one of three categories: flattery, evasion, and accident. This is the fourth and least fashionable: accuracy."' },
      'Q2': { question: 'You know him well?',              type: 'choice', response: '"There are three kinds of acquaintance with Ashworth. The first kind has spoken to him once and remembers it. The second has spoken to him often and remembers very little. The third has known him long enough to understand that the first kind is the lucky kind." A small pause. "I am the third. Which I rate, on balance, somewhere between an honour and a sentence."' },
      'Q3': { question: 'You don\'t sound entertained.',   type: 'choice', response: '"On the contrary. There are two states one can occupy at a Society function: bored, and the rarer, finer state of bored with an audience. You have promoted me from the first to the second — for which the customary remuneration is good company, which I am attempting to provide."' },
      'Q4': { question: 'See you at eight.',               type: 'choice', response: '"The Ballroom. Eight. There are two ways to attend a Rite: as a participant, or as a man who has already understood it. I aim, with whatever good fortune the evening provides, for the second."' },
    },
  },

  // ── PEMBERTON-HALE (masked) ─────────────────────────────────────
  // ENGINE: self-promotional. Lists credentials. The player laughs AT him, not WITH him.
  // Strip the wit. Leave the vanity exposed.
  'pemberton-hale': {
    room: 'trophy-room',
    intro: 'The Trophy Room contains the heads of animals he did not kill, the cases of objects he did not earn, and a tall masked figure whose posture has been worked on, whose shoes have been worked on, whose mask has been more carefully made than any other in the building tonight.\n\nHe is listening. The corridor outside delivers, very faintly, the sound of footsteps — not the ones he is waiting for. He registers them, dismisses them, returns to the listening.',
    dialogue: {
      'Q1': { question: 'Quite a collection.',             type: 'choice', response: '"Indeed. None of it earned, of course. Lord Ashworth does not hunt. The pieces were acquired — primarily through the Hampshire estate sale of \'eighty-nine, several through the Northumberland transfer of \'ninety-three, and two of the larger cases through the Carmichael bequest, on which I happened to sit as junior trustee." The smallest possible smile. "My family advised on the placement."' },
      'Q2': { question: 'You know your way around.',       type: 'choice', response: '"My family has been in the Society for four generations." The precise modesty of a man who very much wants you to know it. "My great-grandfather was elected in eighteen seventy-two. My grandfather chaired the Petitions Committee. My father held the second seat on the Bond. I have been a member in my own right for nineteen years and currently sit on three of the Estate\'s standing committees."' },
      'Q3': { question: 'You\'re looking forward to the Rite.', type: 'choice', response: '"Considerably. The Black Register is the Estate\'s permanent record. I have, in advance, read the precedents on Register openings — there have been four in the last century, two of them within my membership. I have prepared accordingly." The phrase is chosen carefully. "There will not be another Rite of this magnitude in our lifetimes, Mr. Grey. Or, with respect, in yours."' },
      'Q4': { question: 'You sound very prepared.',        type: 'choice', response: '"I prefer to be. I have read the precedents, the standing orders, the protocol notes from the last Register opening, and the relevant correspondence held in the Secretariat archive." A pause. The voice goes thinner. "My father attended one of these and was not. He did not — he found himself unable to attend another." The vanity smooths back over. "I do not intend to share his evening. It only requires that one care."' },
    },
  },

};

// ── PATCH APPLICATION ──────────────────────────────────────
function _applyPatches() {
  if (PROLOGUE_STATE.patches_applied) return;
  if (!window.CHARACTERS) {
    console.warn('[prologue] CHARACTERS not loaded yet');
    return;
  }
  Object.entries(PROLOGUE_PATCHES).forEach(([charId, patch]) => {
    const c = window.CHARACTERS[charId];
    if (!c) {
      console.warn('[prologue] No CHARACTERS entry for', charId);
      return;
    }
    PROLOGUE_STATE._originals[charId] = {
      dialogue:         c.dialogue,
      intro:            c.intro,
      room:             c.room,
      is_compact:       c.is_compact,
      surface_dialogue: c.surface_dialogue,
      surface_gate:     c.surface_gate,
      dialogue_limit:   c.dialogue_limit,
      snap_count:       c.snap_count,
      snap_limit:       c.snap_limit,
      composure:        c.composure,
      composure_state:  c.composure_state,
      deceptions:       c.deceptions,
      // Stash the full INTERROGATION_DATA entry so post-paywall lines
      // (composure_variants, backstory_chain, snapbacks, consequence_echoes)
      // CANNOT fire during prologue. Pre-murder gating safety net.
      interrogation_data: window.INTERROGATION_DATA && window.INTERROGATION_DATA[charId]
                          ? window.INTERROGATION_DATA[charId]
                          : undefined,
    };
    c.dialogue         = patch.dialogue;
    c.intro            = patch.intro;
    c.room             = patch.room;
    c.is_compact       = true;
    c.surface_dialogue = undefined;
    c.surface_gate     = undefined;
    c.dialogue_limit   = 99;
    c.snap_limit       = 0;
    c.snap_count       = 0;
    c.composure        = 100;
    c.composure_state  = 'normal';
    c.deceptions       = undefined;
    // Replace INTERROGATION_DATA[charId] with a fully neutered entry. Any code path
    // that consults composure variants, backstory chains, snapbacks, echoes, deception
    // responses, etc. during prologue will find empty/safe values and exit safely.
    if (window.INTERROGATION_DATA && window.INTERROGATION_DATA[charId]) {
      const orig = window.INTERROGATION_DATA[charId];
      const neutered = {};
      // Walk every field on the original; replace each with a type-appropriate empty.
      // This is exhaustive by construction — any field that exists, post-paywall or
      // post-launch additions, becomes safe during the prologue.
      Object.keys(orig).forEach(key => {
        const val = orig[key];
        if (val === null || val === undefined)         neutered[key] = val;
        else if (typeof val === 'string')              neutered[key] = '';
        else if (typeof val === 'number')              neutered[key] = key === 'composure_floor' ? 100
                                                                      : key === 'fracture_threshold' ? 0
                                                                      : 0;
        else if (typeof val === 'boolean')             neutered[key] = false;
        else if (Array.isArray(val))                   neutered[key] = [];
        else if (typeof val === 'object')              neutered[key] = {};
        else                                            neutered[key] = undefined;
      });
      // A handful of fields need stable defaults that the engine reads:
      neutered.counter_strategy   = 'cooperate';
      neutered.optimal_technique  = 'account';
      neutered.composure_floor    = 100;
      neutered.fracture_threshold = 0;
      neutered.baseline           = { text: '', sentence_avg: 'medium', formality: 'medium', tell: '' };
      window.INTERROGATION_DATA[charId] = neutered;
    }
    if (gameState.char_dialogue_complete) {
      gameState.char_dialogue_complete[charId] = {};
    }
  });
  PROLOGUE_STATE.patches_applied = true;
}

function _restorePatches() {
  if (!PROLOGUE_STATE.patches_applied) return;
  Object.entries(PROLOGUE_STATE._originals).forEach(([charId, orig]) => {
    const c = window.CHARACTERS[charId];
    if (!c) return;
    c.dialogue         = orig.dialogue;
    c.intro            = orig.intro;
    c.room             = orig.room;
    c.is_compact       = orig.is_compact;
    c.surface_dialogue = orig.surface_dialogue;
    c.surface_gate     = orig.surface_gate;
    c.dialogue_limit   = orig.dialogue_limit;
    c.snap_count       = orig.snap_count;
    c.snap_limit       = orig.snap_limit;
    c.composure        = orig.composure;
    c.composure_state  = orig.composure_state;
    c.deceptions       = orig.deceptions;
    // Restore the original INTERROGATION_DATA entry.
    if (window.INTERROGATION_DATA && orig.interrogation_data !== undefined) {
      window.INTERROGATION_DATA[charId] = orig.interrogation_data;
    }
    if (gameState.char_dialogue_complete) {
      gameState.char_dialogue_complete[charId] = {};
    }
  });
  PROLOGUE_STATE._originals = {};
  PROLOGUE_STATE.patches_applied = false;
}

// ── ACCESS GATE (called from engine.navigateTo) ────────────
window.isPrologueRoomAccessible = function(roomId) {
  if (!PROLOGUE_STATE.active) return true;

  if (PROLOGUE_STATE.phase === 'mingle' || PROLOGUE_STATE.phase === 'awaiting_cinematic') {
    return PROLOGUE_FREE_ROOMS.includes(roomId);
  }

  if (PROLOGUE_STATE.phase === 'post_murder' || PROLOGUE_STATE.phase === 'awaiting_paywall') {
    if (roomId === 'ballroom' || roomId === 'antechamber') return true;
    if (PROLOGUE_FREE_ROOMS.includes(roomId)) return true;
    return false;
  }

  return true;
};

// ── ENTRY POINT ────────────────────────────────────────────
window.startPrologue = function() {
  PROLOGUE_STATE.active            = true;
  PROLOGUE_STATE.phase             = 'mingle';
  PROLOGUE_STATE.rowe_duel_done    = false;
  PROLOGUE_STATE.cinematic_armed   = false;
  PROLOGUE_STATE.cinematic_played  = false;
  PROLOGUE_STATE.hale_dialogue_opened = false;
  PROLOGUE_STATE.hale_dialogue_closed = false;
  gameState.prologueActive         = true;

  // Hide board UI during prologue — board is post-paywall only
  // 1. Hide board HUD icon (next to notepad icon)
  setTimeout(() => {
    const hudIcon = document.getElementById('board-hud-icon');
    if (hudIcon) hudIcon.style.display = 'none';
  }, 100);
  // 2. Hide board button inside notepad (runs when notepad opens)
  setTimeout(() => {
    const npBtn = document.getElementById('np-board-btn');
    if (npBtn) npBtn.style.display = 'none';
  }, 100);

  // Clear stale progress from any prior save state — prologue is always fresh.
  // _applyPatches will further wipe per-character dialogue history for patched chars.
  gameState.char_dialogue_complete = {};
  gameState.examined_objects       = [];
  gameState.inventory              = [];
  gameState.fired_chains           = [];
  gameState.node_inventory         = {};
  gameState.dropped_items          = {};
  gameState.object_taps            = {};
  gameState.item_taps              = {};
  gameState.hotspots_pulsed        = {};
  gameState.essential_left         = {};
  gameState.puzzles_solved         = [];
  gameState.puzzle_states          = {};
  gameState.characters             = {};
  gameState.deceptions_remaining   = 3;
  gameState.investigation_closed   = false;
  gameState.last_talked_to         = null;

  _applyPatches();
  if (typeof window.rebuildCharCards === 'function') {
    window.rebuildCharCards();
  }

  if (typeof navigateTo === 'function') {
    navigateTo('foyer');
  }
  if (typeof saveGame === 'function') saveGame();
};

// ── HALE PAYWALL TRIGGER ───────────────────────────────────
// Paywall fires when player leaves the antechamber post-cinematic.
// They can talk to Hale freely, close his dialogue, walk around,
// re-open him — paywall doesn't fire until they actually exit the room.
NocturneEngine.on('roomLeft', function(payload) {
  if (!PROLOGUE_STATE.active) return;
  if (PROLOGUE_STATE.phase !== 'post_murder' && PROLOGUE_STATE.phase !== 'awaiting_paywall') return;
  if (!payload || payload.roomId !== 'antechamber') return;
  // Only fire if player has actually entered Hale's dialogue at least once
  const haleAnswered = (gameState.char_dialogue_complete || {})['pemberton-hale'];
  const hasTalkedToHale = haleAnswered && Object.keys(haleAnswered).length > 0;
  if (!hasTalkedToHale) return;
  if (PROLOGUE_STATE.hale_dialogue_closed) return;
  PROLOGUE_STATE.hale_dialogue_closed = true;
  PROLOGUE_STATE.phase = 'awaiting_paywall';
  setTimeout(_firePaywall, 600);
});

// ── ROWE DUEL COMPLETION → ARM CINEMATIC ───────────────────
NocturneEngine.on('roweDuelComplete', function() {
  if (!PROLOGUE_STATE.active) return;
  if (PROLOGUE_STATE.phase !== 'mingle') return;
  PROLOGUE_STATE.rowe_duel_done   = true;
  PROLOGUE_STATE.cinematic_armed  = true;
  PROLOGUE_STATE.phase            = 'awaiting_cinematic';
});

// ── ROOM TRANSITION → FIRE CINEMATIC IF ARMED ──────────────
NocturneEngine.on('roomEntered', function(payload) {
  if (!PROLOGUE_STATE.active) return;
  if (!PROLOGUE_STATE.cinematic_armed) return;
  if (PROLOGUE_STATE.cinematic_played) return;
  if (PROLOGUE_STATE.phase !== 'awaiting_cinematic') return;

  PROLOGUE_STATE.cinematic_armed = false;
  PROLOGUE_STATE.phase           = 'cinematic';
  setTimeout(_playMurderCinematic, 200);
});

// ── CINEMATIC (TEXT PLACEHOLDER) ───────────────────────────
function _playMurderCinematic() {
  PROLOGUE_STATE.cinematic_played = true;

  let overlay = document.getElementById('prologue-cinematic');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'prologue-cinematic';
  overlay.style.cssText = [
    'position:fixed','top:0','left:0','right:0','bottom:0',
    'background:#000','z-index:99999',
    'display:flex','align-items:center','justify-content:center',
    'flex-direction:column','padding:40px','text-align:center',
    'opacity:0','transition:opacity 1.2s ease',
    'color:#d4c5a0','font-family:Georgia,serif',
  ].join(';');

  const time = document.createElement('div');
  time.style.cssText = 'font-size:14px;letter-spacing:0.4em;color:#8a7a5c;margin-bottom:32px;text-transform:uppercase;';
  time.textContent = '— 8:01 PM —';
  overlay.appendChild(time);

  const line1 = document.createElement('div');
  line1.style.cssText = 'font-size:18px;line-height:1.8;max-width:560px;margin-bottom:24px;font-style:italic;';
  line1.textContent = '[ Placeholder — murder scene at the Ballroom. ]';
  overlay.appendChild(line1);

  const line2 = document.createElement('div');
  line2.style.cssText = 'font-size:15px;line-height:1.7;max-width:560px;color:#a89878;';
  line2.textContent = 'The Rite was supposed to begin at eight. Something else began first.';
  overlay.appendChild(line2);

  const line3 = document.createElement('div');
  line3.style.cssText = 'margin-top:48px;font-size:11px;letter-spacing:0.3em;color:#6a5d44;text-transform:uppercase;';
  line3.textContent = 'Tap to continue';
  overlay.appendChild(line3);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  let advanced = false;
  const advance = function() {
    if (advanced) return;
    advanced = true;
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      _onCinematicComplete();
    }, 1200);
  };
  overlay.addEventListener('click', advance);
  setTimeout(advance, 8000);
}

function _onCinematicComplete() {
  PROLOGUE_STATE.phase = 'post_murder';
  // Restore originals NOW so post-murder ballroom + Hale show real interrogation content.
  // The paywall is the gate, not the dialogue change. Hale's full post-paywall interrogation
  // is the FIRST taste of the real game. Then paywall when player leaves the antechamber.
  _restorePatches();
  // Reposition NPCs to post-paywall positions (Hale → antechamber, Curator → archive-path, etc.)
  if (typeof window.rebuildCharCards === 'function') {
    window.rebuildCharCards();
  }
  if (typeof navigateTo === 'function') navigateTo('ballroom');
  if (typeof saveGame === 'function') saveGame();
}

// ── PAYWALL TRIGGER ────────────────────────────────────────
function _firePaywall() {
  const reflection = document.getElementById('paywall-curator-text');
  if (reflection) {
    reflection.textContent =
      'You have seen the body. You have heard the man in the Antechamber. You have noticed what he wanted you to notice and you have noticed one or two things he did not. The investigation does not end here. It begins here. The Estate has set a price for the truth.';
  }
  if (typeof openPaywall === 'function') openPaywall();
}

// ── PAYWALL OUTCOMES ───────────────────────────────────────
window.onProloguePaywallSuccess = function() {
  PROLOGUE_STATE.active   = false;
  PROLOGUE_STATE.phase    = 'complete';
  gameState.prologueActive = false;
  
  // Restore board UI post-paywall
  setTimeout(() => {
    const hudIcon = document.getElementById('board-hud-icon');
    if (hudIcon) hudIcon.style.display = 'flex';
    const npBtn = document.getElementById('np-board-btn');
    if (npBtn) npBtn.style.display = 'block';
  }, 100);
  
  _restorePatches();
  if (typeof window.rebuildCharCards === 'function') {
    window.rebuildCharCards();
  }
  if (typeof navigateTo === 'function') navigateTo('foyer');
  if (typeof saveGame === 'function') saveGame();
};

window.onProloguePaywallDecline = function() {
  _restorePatches();
  PROLOGUE_STATE.active = false;
  PROLOGUE_STATE.phase  = 'mingle';
  PROLOGUE_STATE.rowe_duel_done   = false;
  PROLOGUE_STATE.cinematic_armed  = false;
  PROLOGUE_STATE.cinematic_played = false;
  PROLOGUE_STATE.hale_dialogue_opened = false;
  PROLOGUE_STATE.hale_dialogue_closed = false;
  gameState.prologueActive = false;

  const gameScreen = document.getElementById('screen-game');
  if (gameScreen) gameScreen.classList.remove('active');
  if (typeof startTrainSequence === 'function') {
    startTrainSequence();
  }
};

// ── INIT ───────────────────────────────────────────────────
window.initPrologue = function() {};

// Compatibility stub — old code path; route to real openConversation
window.openPrologueDialogue = function(charId) {
  if (typeof window.openConversation === 'function') {
    window.openConversation(charId);
  }
};
