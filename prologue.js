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
  // Unmasked. Host. Stillness. The ceremony intact.
  'curator': {
    room: 'foyer',
    intro: 'The grandfather clock by the staircase has just declared seven, and is taking its time about being believed. The Foyer is otherwise still — the kind of stillness a room produces only when someone has been standing in it long enough to teach the room how.\n\nHe is, of course, unmasked. He inclines his head a fraction as you cross the threshold — the fraction owed to a guest of the house.\n\n"Mr. Grey. Welcome to the Estate. The Rite begins at eight."',
    dialogue: {
      'Q1': { question: 'You were expecting me.',          type: 'choice', response: '"The Estate generally is. It is one of the few institutions in the country that has not had to revise the assumption." A small gesture at the room. "Lord Ashworth thought it appropriate that a first-time visitor be received by someone whose duties this evening are largely ceremonial. I am the ceremonial part. The Rite is the rest."' },
      'Q2': { question: 'What is the Rite, exactly?',      type: 'choice', response: '"A ceremony. That is not a useful answer; let me try again." A breath. "At eight, Lord Ashworth will open the Black Register before the assembled membership. The Register has not been opened in public in living memory. Most of the people in this house tonight have been preparing for that fact in one form or another. The Register, when it opens, will have things to say about a great many of them."' },
      'Q3': { question: 'What kind of man is Lord Ashworth?', type: 'choice', response: '"Meticulous." The word lands the way a bricklayer sets a brick. "He has run this Estate for forty years. He has, in that time, declined to misplace a record, a name, or a debt." A pause. "He has been preparing for tonight for six years. When a man spends six years preparing to say a thing in public, what he intends to say is generally either very true or very dangerous. With Ashworth it tends to be both. That is the work of the evening."' },
      'Q4': { question: 'Why am I the only one without a mask?', type: 'choice', response: '"Because you are not yet a member. The mask is a courtesy the Estate extends to its members on formal evenings. The Estate has always preferred its formal evenings discreet. Tonight is no exception." A measured nod. "You may take some comfort in being the exception. Most people, in my experience, do not. Most people would rather be hidden than seen. The Society has been good business for the maskmakers of this country for two centuries."' },
      'Q5': { question: 'Where should I go until eight?',  type: 'choice', response: '"Anywhere that is not the Ballroom. The grounds are open. The guests are masked, and they will not introduce themselves. Try not to read this as rudeness. Read it as architecture."' },
    },
  },

  // ── NORTHCOTT (masked) ──────────────────────────────────────────
  // Detail intro: the sherry he isn't drinking.
  'northcott': {
    room: 'weapons-room',
    intro: 'A small sherry rests on the side-table among the mounted sabres. It has been there for some time. It has not been drunk, or refilled, or moved by even the smallest inadvertent inch. The young masked figure beside it is putting genuine effort into not touching it.\n\nA leather-bound notebook is tucked under his arm. He looks up sharply when you enter, caught between a polite nod and an outright salute, and committing fully to neither.',
    dialogue: {
      'Q1': { question: 'Admiring the swords?',           type: 'choice', response: '"They are decorative. None of them have an edge — I checked, not because I expected them to, just to confirm." A pause. He looks faintly betrayed by his own observation. "Not that one would want them otherwise. The Estate prefers its weapons in the other sense — historical, well-mounted, and absolutely none of one\'s business. I have been told that. I have written it down."' },
      'Q2': { question: 'You don\'t look like you\'re enjoying yourself.', type: 'choice', response: '"I am." Said immediately, which is the wrong way to answer the question. He hears himself. "That is — I am attempting to. The sherry is — the sherry is excellent, I have not yet drunk it but I am sure it is excellent. The rooms are warm. The masks —" he glances at the door, "the masks have a remarkable capacity to look at you for longer than you have planned to be looked at."' },
      'Q3': { question: 'What\'s the notebook for?',       type: 'choice', response: 'He straightens. The next sentence comes out at half its previous warmth: "It\'s a — well, a house book. The Estate keeps one. I write down — the things one writes down. Who arrived. Who I spoke to. What the candles did, twice, although I am not certain why I noted them twice." He glances at it as if he is not entirely sure he wants to be holding it. "The Estate is fond of paper. So is, I gather, my career."' },
      'Q4': { question: 'Who told you you had the right temperament?', type: 'choice', response: '"Lord Ashworth." With the small helpless pride of a man not certain whether he was praised or recruited. "He did not specify which temperament. He is not, by reputation, the sort of man one asks twice. I have been examining various of mine since, looking for the responsible one. So far, no luck."' },
    },
  },

  // ── THE STEWARD (masked) [form-break] ───────────────────────────
  // FORM-BREAK: not at candelabra. At head of table. Looking at one place card.
  'steward': {
    room: 'dining-room',
    intro: 'The dining room has been set for sixty. Glassware, place cards, the slight catastrophe of perfectly arranged flowers. The candles are not yet lit; that comes at quarter to.\n\nThe masked figure is at the head of the table. Not at the candelabra, where one would expect him. At the head, where one would not. His hands are clasped behind his back, precisely. He is reviewing the seating, on what appears to be the third or fourth occasion of the evening. He has been doing it for some time.\n\nHe is aware of you. He is choosing not to be.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: 'Only then does he turn, and only by degrees. "Good evening." The hands stay behind the back. The seating is not commented on. "The candles will be lit at quarter to. Until then the room is — resting. I find rooms appreciate the courtesy."' },
      'Q2': { question: 'You weren\'t at the candelabra.', type: 'choice', response: '"No. I was attending to the seating. The placements were finalised three weeks ago, but one — confirms." His eyes do not return to the table. They have been instructed not to. "It is the kind of work one does when one has done it a great many years. The work has stopped requiring the head and continued requiring the hands."' },
      'Q3': { question: 'You\'ve been here a long time.',  type: 'choice', response: '"Long enough. The house has not required me to count." A pause — and then, the small permission of an evening before any harm has been done: "I have outlasted three presidents of the Society and four chefs. The chefs were the harder loss."' },
      'Q4': { question: 'What are you watching for?',      type: 'choice', response: 'The hands stay behind the back, precisely. "The candles. They burn unevenly in this room because of a draught from the south window which has been there since 1881 and which the Estate has, in three separate budgets, declined to address." A second pause, shorter. "It is the thing one watches for."' },
      'Q5': { question: 'See you at the Rite.',            type: 'choice', response: '"At the Rite. Good evening." He returns his attention to the table. The candles will be lit at quarter to. Until then, the room will continue to rest.' },
    },
  },

  // ── THE BARON (masked) ──────────────────────────────────────────
  // Inhabited-object intro: the chair, the smoke, the glass — he is the last item on the list.
  'baron': {
    room: 'study',
    intro: 'The leather armchair by the fire. The cigar, trailing a thin unhurried line of smoke toward the ceiling. The brandy on the side-table, which has not been full for some time. The clock on the mantel, reading seven minutes past, which he has not consulted and does not need to.\n\nAnd then, at the centre of these arrangements, a masked figure who has decided this chair will be his and would not be sorry if anyone tried to contest the claim.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Is it." Not a question. A small slow exhale. "The evening is presently producing cigars, brandy, and the general absence of obligation, all of which I approve of. It is also producing a great deal of small talk in adjacent rooms, which I do not approve of, but which I am tolerating from a distance." The faintest gesture of the cigar. "I am, against all evidence, having quite a nice time."' },
      'Q2': { question: 'You don\'t enjoy these things.',  type: 'choice', response: '"I have a personal objection to wearing a face I did not choose, in a room arranged by men I did not invite, on the schedule of a clock I do not own." A pause for effect, which he is enjoying. "Apart from that, the evening is going beautifully. The brandy is older than two of the people drinking it, and the cigars were rolled by someone with strong opinions about geography. I have no complaints to register that cannot wait until tomorrow."' },
      'Q3': { question: 'What should I know about Lord Ashworth?', type: 'choice', response: '"Ashworth." The cigar pauses. "There are perhaps four men alive who have any idea what he is about to do tonight. He is one. I am another." The cigar resumes its line, slowly. "Beyond that I am not at liberty, and you would not thank me for the parts I am at liberty about. Ashworth has the gift, vanishing in our class, of meaning precisely what he says. It is one of his less endearing qualities, and the reason I have always found him bearable."' },
      'Q4': { question: 'Why are you in here, not out there?', type: 'choice', response: '"Two reasons." He raises the cigar. "This. And —" he raises the glass. "This. The Estate prefers its members to mingle before a Rite. I have always taken the view that mingling is best done by sitting absolutely still and letting the more interesting half of the room come and find me." The glass tips a fraction toward you, in something not quite a toast. "Tonight — the system has worked."' },
    },
  },

  // ── LADY ASHWORTH (masked) ──────────────────────────────────────
  // Listing intro: the conservatory inventoried, then her, last.
  'ashworth': {
    room: 'conservatory',
    intro: 'The lamps are kept low here. They have always been kept low here. The orchids have the slightly louche posture of plants that have been listening to too many conversations. A single candle on the wrought-iron table has burned an inch lower than the others in the room.\n\nThe masked woman among them holds a folded letter loosely in her gloved fingers. She does not appear to be reading it. She also does not appear to want to put it down.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Good evening, Mr. Grey." The letter folds once, neatly. "You are very brave to have entered the conservatory. Most of the gentlemen are too frightened of the orchids. They have been told the orchids are aware." A small smile in the voice. "They are. But not of them."' },
      'Q2': { question: 'Are you waiting for someone?',    type: 'choice', response: '"For my husband. For the Rite. For eight o\'clock." Her gaze has settled on the candle, not on you. "Eight o\'clock has been very stubborn about arriving. I have spoken to it three times this evening." She addresses the candle directly, as one addresses a guest who is being deliberately slow: "It has been entirely unmoved." A pause. To you, almost: "My husband can be similar. It is one of the things we have in common."' },
      'Q3': { question: 'You don\'t seem nervous about tonight.', type: 'choice', response: '"Should I be?" The slightly amused curiosity of a woman asked a thing she has not, herself, thought to ask. "My husband does not arrange evenings he is uncertain about. He learns the names of the members, the press of every house seal, the weight of the silver, the proximity of the doors. By the time an evening of his arrives, the evening has very little say in the matter." The amusement slips, briefly, before she catches it. "He has not arranged my nervousness for tonight. He has arranged everything else."' },
      'Q4': { question: 'I\'ll let you wait.',             type: 'choice', response: '"Thank you." She does not look up. The letter is unfolded and refolded along the same crease. "You have been a kindness." Then, to the orchids, by way of explanation: "He has spared us all a difficult half-hour. You had run out of new things to say. I had been preparing to invent some on your behalf."' },
    },
  },

  // ── CRANE (masked) ──────────────────────────────────────────────
  // Acoustic intro: what she hears from where she is.
  'crane': {
    room: 'gallery',
    intro: 'The Gallery is the longest room in the house and the quietest. From the far end, very faintly, the murmur of the Foyer can be heard. It has been a little louder in the last few minutes than it was when she came in.\n\nA masked woman stands close to one of the portraits — closer than the convention of the room suggests. The lamp picks up the small glint of a glass in her left hand. Sherry. Slightly less of it than there was.',
    dialogue: {
      'Q1': { question: 'A friend of yours?',              type: 'choice', response: '"Mercifully, no. He died in 1804, of a hubris one can still see from across the room." A fractional tilt. "The brushwork is excellent. The face is appalling. The painters of two centuries ago had the courage to render their subjects accurately. We have lost the trick. Modern portraiture is so flattering one can no longer tell the bankers from the bishops."' },
      'Q2': { question: 'You attend these often?',         type: 'choice', response: '"More than I would choose. Less than I am asked." A small dry pause. "Lord Ashworth runs a tight Society and a generous bar, in that order, and one tolerates the first for the second. Most evenings here pass off with no greater incident than someone\'s opinions about Wagner." A sip, considered. "Tonight is meant to be more interesting. I have been instructed to expect interest. I am doing my best."' },
      'Q3': { question: 'Why are you in here, not in the drawing room?', type: 'choice', response: '"Because the drawing room contains the Hon. Charles Allerton, who has, twice this evening, attempted to explain the law of contract to me — and the orangery contains his wife, who in fairness has been doing the more difficult job for thirty-one years." Another sip. "The Gallery contains an admiral and you. By some distance, the best company in the building."' },
      'Q4': { question: 'You don\'t look like a woman doing her best.', type: 'choice', response: 'The wit does not arrive. She looks at the glass. "No." Quietly. "I am better at it on other evenings." A small shake of the head. The professional composure rolls back in. "The sherry is excellent. The admiral is dead. I have what I need."' },
      'Q5': { question: 'See you at the Rite.',            type: 'choice', response: '"Eight o\'clock. The Ballroom. Third row from the front, on the left, in the chair I have selected for its proximity to the door, the bar, and the door again." The glass rises, not quite to you. "The portraits will still be here afterward. So will the admiral. I take some comfort in that and you should too."' },
    },
  },

  // ── VIVIENNE (masked) ───────────────────────────────────────────
  // Not-doing intro. Voice direction (ElevenLabs): French (Lyon), low, unhurried.
  'vivienne': {
    room: 'terrace',
    intro: 'A masked woman is at the balustrade. She is not doing anything. The not-doing has the particular completeness of a person who is exactly where she means to be. The terrace lamps are warm; the gardens behind her are not. She is half in each.\n\nThe windows behind you have been growing busier in the last few minutes. The terrace has not. She turns — unhurried, at the moment of her choosing.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Bonsoir." She looks at you slightly longer than the greeting requires. "You are the one without a mask. I had heard." A small pause. "I had not been told you would arrive on the terrace at —" she glances briefly at the windows, "seven minutes past." The smile is in the voice. "I had been told you would arrive in the Foyer, which is where serious men go. The terrace is for the other kind. I am pleased to have been wrong about you, Mr. Grey."' },
      'Q2': { question: 'You\'ve been watching me.',       type: 'choice', response: '"I have been watching the room. You crossed the room." A pause, unhurried. "There is a difference. The first is curiosity. The second is — recreation. Tonight has not given me much in the way of recreation. I take what the evening provides."' },
      'Q3': { question: 'You know the Estate well?',       type: 'choice', response: 'For a moment the warmth is set down somewhere out of sight, like a glass on a railing. The look that replaces it is calm and considering. "I know what the Estate tells me. The Estate is generous, if one is patient." Then the warmth is picked back up, lightly. "Houses are not unlike men in this regard. The ones worth knowing reveal themselves slowly, and never to anyone in a hurry."' },
      'Q4': { question: 'Why are you out here alone?',     type: 'choice', response: '"I am not alone. You are here." A fact, observed. "Before that — the Foyer was full of men explaining the Rite to each other in voices designed to be overheard. The drawing room was full of women pretending not to listen." A pause. "The terrace was empty. I have a rule about empty terraces on warm evenings. I keep them company. They are grateful."' },
      'Q5': { question: 'What do you do here?',            type: 'choice', response: 'A pause longer than the question expects. "Tonight? I am decorating a terrace. The terrace was previously undecorated. I am told it is an improvement." Her eyes do not move from yours. "On other evenings I do other things. The Estate is good at finding occupations for those who are willing to be — useful. I have, on the whole, been willing."' },
      'Q6': { question: 'I should let you enjoy the evening.', type: 'choice', response: '"Should you." Not quite a question. The gardens go unattended. "Eight o\'clock — the Rite. After eight o\'clock — well." A breath. "Houses tell more after eight o\'clock. So do their guests. So, occasionally, do I." Her head inclines, the smallest fraction. "Bonne soirée, Mr. Grey. The terrace is here when you find your way back to it. I generally am too."' },
    },
  },

  // ── HATCH (masked) ──────────────────────────────────────────────
  // Weather intro: the man as a weather pattern.
  'hatch': {
    room: 'terrace',
    intro: 'A masked man is at the far end of the terrace, near the low wall that drops to the rose beds. He is not still in the way the Steward is still. He is still in the way weather is still — the patience of something that has decided when it will move next, and has not yet been asked.\n\nA pewter mug rests on the stone beside him, half-full. It has been half-full the entire time you have been on the terrace.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Mr. Grey." A nod. "Lord Ashworth said a man named Grey would arrive on the seven o\'clock train. He did not say much else. He never does. He saves his words for rooms with chairs." A slow smile in the voice. "This is not one."' },
      'Q2': { question: 'You\'re not at the assembly?',    type: 'choice', response: '"Not tonight. The grounds want attending to. The grounds always want attending to, and tonight they are kind enough to want it loudly." A nod toward the dark gardens. "There are rooms in this house I am not required to be in. After thirty years one learns to take the Estate up on its kindnesses."' },
      'Q3': { question: 'What\'s the ale like?',           type: 'choice', response: 'He looks at the mug. Considers it. "Brewed short. Hopped against the season. Bottled by a man who knows his trade well enough to know he is letting it slide." The mug is set down. "It is not what it was. The Estate spent more on candles tonight than it has spent on ale this year. I will not bore you with the comparison." A small pause. "I have made it. The ale has not come out well."' },
      'Q4': { question: 'Anything been odd tonight?',      type: 'choice', response: 'A long unhurried look at the gardens, then at you. "Quieter than usual. The deer have been confused by the lamps and have stayed up by the rose-walk longer than they should. Tonight they have not committed to the lower lawn at all." A small dry note. "I would be a poor groundsman if I did not at least notice."' },
      'Q5': { question: 'See you later.',                  type: 'choice', response: '"Likely. I will be on the terrace. I will be in the gardens. The grounds want a hand on them after dark — they always have." The mug rises a half-inch. "Old habit. Quiet evenings deserve company."' },
    },
  },

  // ── THE SURGEON (masked) ────────────────────────────────────────
  // Warmth intro: the room, then him, then the warmth. Whole scene IS the misdirect.
  'surgeon': {
    room: 'map-room',
    intro: 'The map-room is warm. The lamps are turned up higher than the rooms before it, and the maps on the long table catch the light the way old paper does, which is to say expensively.\n\nThe masked figure leans over the table, one gloved finger resting lightly on a coastline that has been redrawn at least twice in the last century. He looks up the moment you enter — not startled, not summoned, simply available, as if he had been mildly looking forward to the interruption and you have been kind enough to provide it.\n\nThe warmth is the first thing one notices about him.',
    dialogue: {
      'Q1': { question: 'Planning a journey?',             type: 'choice', response: '"Studying an old one." The smile in the voice is gentle, professional. "These maps predate the modern borders by some distance. Whole countries have been politely renamed since the cartographer set down his pen. I find the changes instructive — don\'t you? People are very confident about borders, in my experience, until one shows them an older map. Then they become quieter. It is one of the more useful things a map can do. Have you a country of your own you are particularly confident about, Mr. Grey?"' },
      'Q2': { question: 'You collect maps?',               type: 'choice', response: '"I read them. Collecting implies one keeps them, and I do not, generally, keep things." The magnifier sets down with the small care of a man who has handled more delicate instruments than this. "I have an interest in the spaces I am asked to be in. Lord Ashworth maintains a remarkable collection. One does not encounter this room twice in a lifetime — and you, Mr. Grey? Are you a man who reads, or a man who keeps?"' },
      'Q3': { question: 'Have you been here before?',      type: 'choice', response: '"Tonight is my first formal evening at the Estate." A pause that does not feel like hesitation. "Lord Ashworth has the reputation of a man who curates his guests. I would not insult the curation by arriving without curiosity." He smiles, warmly, the way he says everything. "Have I answered your question, Mr. Grey? Or were you asking something else?"' },
      'Q4': { question: 'You walked the whole building?',  type: 'choice', response: '"Something I have been turning over." A small, warm pause. "Lord Ashworth opens the Register tonight. I have been wondering what kind of man, after forty years of caretaking, decides this is the evening on which to be public about a private matter. There are few good answers. What is your view, Mr. Grey? You are the only person in this building tonight without a stake in the answer — which makes you, by my reckoning, the only person worth asking."' },
      'Q5': { question: 'Looking forward to the Rite?',    type: 'choice', response: '"With what I would call professional interest. Are you?" Another small smile. "Lord Ashworth has prepared something significant. I have been told it will be memorable. I prefer to arrive at memorable evenings already paying attention — it saves a great deal of effort later on. And I do find I am paying rather close attention this evening. Thank you for asking."' },
    },
  },

  // ── GREAVES (masked) ────────────────────────────────────────────
  // Comparison intro: the painted Ashworth, judged against the absent one.
  'greaves': {
    room: 'gallery',
    intro: 'The portrait of Lord Ashworth at the far end of the long Gallery is fifteen years old. Lord Ashworth, on the evidence of the portrait, was already a man one would not wish to disappoint. Lord Ashworth, on the evidence of the present evening, has spent the intervening years confirming the painter\'s instinct.\n\nThe masked figure standing before the portrait is comparing the painted version against the original. The corridor beyond him has gone quieter in the last little while. He has noticed. He has not commented.',
    dialogue: {
      'Q1': { question: 'A good likeness.',                type: 'choice', response: '"Of two kinds. Fifteen years ago — the painter was competent, in the particular old-fashioned sense, which is to say willing to render his subject as he found him rather than as the subject had hoped to be found." A pause. "Modern portraiture sorts into three categories: flattery, evasion, and accident. This is the rare fourth and least fashionable: accuracy. It survives in attics and Society galleries, and very few other places."' },
      'Q2': { question: 'You know him well?',              type: 'choice', response: '"Long enough to recognise the work, sufficient to attend the Rite, insufficient to be surprised by anything that happens in it." A small observational pause. "Most members of this Society arrange their lives in such a way that their convictions and their conveniences never have to meet in public. Ashworth is the rare exception." The faintest amusement. "I have spent thirty years watching him refuse, with tremendous good manners, to be more comfortable than he is correct. Tonight is the cumulative bill for that refusal."' },
      'Q3': { question: 'You don\'t sound entertained.',   type: 'choice', response: '"On the contrary. You are early. I have been here some time and you are the first person to address me in any of it." A small unguarded note — gone before you can decide it was there. "Either I am better-disguised than I had hoped, or the company is worse. I will not press for which."' },
      'Q4': { question: 'See you at eight.',               type: 'choice', response: '"The Ballroom. Eight o\'clock. I shall sit somewhere to the rear and let the senior members do the senior work. It is a division of labour the Society has been operating for a very long time, and I see no reason to spoil it." A small real nod. "Until then, the portrait."' },
    },
  },

  // ── PEMBERTON-HALE (masked) ─────────────────────────────────────
  // Listening intro: the footsteps he is waiting for.
  'pemberton-hale': {
    room: 'trophy-room',
    intro: 'The Trophy Room contains the heads of animals he did not kill, the cases of objects he did not earn, and a tall masked figure whose posture has been worked on, whose shoes have been worked on, whose mask has been more carefully made than any other in the building tonight.\n\nHe is listening. The corridor outside delivers, very faintly, the sound of footsteps — not the ones he is waiting for. He registers them, dismisses them, returns to the listening. He turns at your approach with a smooth practised rotation, which is, on review, the only kind he produces.',
    dialogue: {
      'Q1': { question: 'Quite a collection.',             type: 'choice', response: '"It is. None of it earned, of course — Lord Ashworth does not hunt. The pieces were acquired: primarily through the Hampshire estate sale of \'eighty-nine, several through the Northumberland transfer of \'ninety-three, and two of the larger cases through the Carmichael bequest, on which I sat as junior trustee." The smallest possible smile, well-rehearsed. "They are decorative. The Estate is fond of decoration that communicates something. Routine, by the standards of houses of this kind."' },
      'Q2': { question: 'You know your way around.',       type: 'choice', response: '"My family has been in the Society for four generations." The precise modesty of a man who very much wants you to know it. "I have been a member in my own right for nineteen years. I sit on three of the Estate\'s standing committees, including the one most likely to be referenced this evening. I prefer to be prepared. The unprepared find these evenings rather longer than they need to be."' },
      'Q3': { question: 'You\'re looking forward to the Rite.', type: 'choice', response: '"Considerably. Lord Ashworth will open the Black Register at eight. The Register is the Estate\'s permanent record. Whatever is read into it tonight becomes — formally — part of the Estate." The phrase is chosen carefully. He likes the way it sits. "It is, by the standards of the Society, a significant evening. There will not be another like it in our lifetimes, Mr. Grey. Or, with respect, in yours."' },
      'Q4': { question: 'You sound very prepared.',        type: 'choice', response: '"I prefer to be prepared. I have read the precedents. I have reviewed the standing orders. I know which of the senior members is likely to speak and in what order." The voice goes thinner for a single sentence: "My father attended one of these and was not. He has not, since, attended another. I do not intend to share his evening." The vanity smooths back over. "It is not difficult. It only requires that one care."' },
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
      neutered.engine             = 'prologue'; // tells openTechniqueSelector to skip overlay → _openConversationDirect
      window.INTERROGATION_DATA[charId] = neutered;
    }
    if (gameState.char_dialogue_complete) {
      gameState.char_dialogue_complete[charId] = {};
    }
  });
  PROLOGUE_STATE.patches_applied = true;

  // ── LOAD-ORDER GUARD ────────────────────────────────────────
  // interrogation.js runs `window.INTERROGATION_DATA = INTERROGATION_DATA` at the
  // bottom of the file (line 5229). If it loads AFTER prologue.js has already
  // neutered the per-character entries, that assignment overwrites the neutered
  // data with the original post-paywall content — restoring every leak we cleared.
  //
  // Fix: intercept the assignment using a property descriptor trap. If the prologue
  // is still active when interrogation.js tries to set window.INTERROGATION_DATA,
  // we let the assignment proceed (so everything else in interrogation.js works)
  // but immediately re-neutralize the patched characters on the new object.
  try {
    let _interrogationDataValue = window.INTERROGATION_DATA;
    Object.defineProperty(window, 'INTERROGATION_DATA', {
      configurable: true,
      enumerable:   true,
      get: function() { return _interrogationDataValue; },
      set: function(newVal) {
        _interrogationDataValue = newVal;
        // If prologue is still active, immediately re-neutralize patched chars.
        if (PROLOGUE_STATE.patches_applied && newVal) {
          Object.keys(PROLOGUE_PATCHES).forEach(function(charId) {
            if (!newVal[charId]) return;
            const orig = newVal[charId];
            const neutered = {};
            Object.keys(orig).forEach(function(key) {
              const val = orig[key];
              if (val === null || val === undefined)    neutered[key] = val;
              else if (typeof val === 'string')         neutered[key] = '';
              else if (typeof val === 'number')         neutered[key] = (key === 'composure_floor') ? 100
                                                                       : (key === 'fracture_threshold') ? 0 : 0;
              else if (typeof val === 'boolean')        neutered[key] = false;
              else if (Array.isArray(val))              neutered[key] = [];
              else if (typeof val === 'object')         neutered[key] = {};
              else                                      neutered[key] = undefined;
            });
            neutered.counter_strategy   = 'cooperate';
            neutered.optimal_technique  = 'account';
            neutered.composure_floor    = 100;
            neutered.fracture_threshold = 0;
            neutered.baseline           = { text: '', sentence_avg: 'medium', formality: 'medium', tell: '' };
            neutered.engine             = 'prologue'; // skip technique overlay → _openConversationDirect
            // Also stash the original so _restorePatches can put it back correctly.
            if (PROLOGUE_STATE._originals[charId]) {
              PROLOGUE_STATE._originals[charId].interrogation_data = orig;
            }
            newVal[charId] = neutered;
          });
        }
      }
    });
  } catch(e) {
    // Object.defineProperty failed (e.g. already non-configurable). Log and continue —
    // the earlier neutralization pass is still the first line of defence.
    console.warn('[prologue] Could not install INTERROGATION_DATA guard:', e);
  }
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

  // ── TEAR DOWN LOAD-ORDER GUARD ───────────────────────────────
  // Remove the property descriptor trap now that prologue is over.
  // The setter checked PROLOGUE_STATE.patches_applied (now false), so it would
  // no longer re-neutralize anyway — but clean removal prevents any edge cases
  // if interrogation.js reloads or is reassigned during the post-paywall game.
  try {
    const currentVal = window.INTERROGATION_DATA;
    Object.defineProperty(window, 'INTERROGATION_DATA', {
      configurable: true,
      enumerable:   true,
      writable:     true,
      value:        currentVal,
    });
  } catch(e) {
    console.warn('[prologue] Could not remove INTERROGATION_DATA guard:', e);
  }
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

  // Reset NPC positions to mingle-phase state (may have been mutated by a prior run)
  if (window.PROLOGUE_NPC_POSITIONS) {
    window.PROLOGUE_NPC_POSITIONS['trophy-room'] = ['pemberton-hale'];
    delete window.PROLOGUE_NPC_POSITIONS['antechamber'];
  }

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

// Black out on roomLeft the moment cinematic is armed — before next room renders
NocturneEngine.on('roomLeft', function() {
  if (!PROLOGUE_STATE.active) return;
  if (!PROLOGUE_STATE.cinematic_armed) return;
  if (PROLOGUE_STATE.cinematic_played) return;
  if (PROLOGUE_STATE.phase !== 'awaiting_cinematic') return;
  let blocker = document.getElementById('prologue-cinematic');
  if (blocker) return; // already up
  blocker = document.createElement('div');
  blocker.id = 'prologue-cinematic';
  blocker.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#000;z-index:99999;opacity:1;';
  document.body.appendChild(blocker);
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
  // Reposition NPCs: Hale moves trophy-room → antechamber for post-murder phase.
  if (window.PROLOGUE_NPC_POSITIONS) {
    window.PROLOGUE_NPC_POSITIONS['trophy-room'] = [];
    window.PROLOGUE_NPC_POSITIONS['antechamber'] = ['pemberton-hale'];
  }
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
