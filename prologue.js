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
  // Unmasked. Host. Ceremony intact. The relaxed version of him.
  'curator': {
    room: 'foyer',
    intro: 'He is in the Foyer when you cross the threshold, unmasked, hands folded behind his back in the precise attitude of a man who has been standing exactly so for forty minutes and intends to stand exactly so for forty more. He inclines his head a fraction — the fraction owed to a guest of the house.\n\n"Mr. Grey. You are six minutes early." A small, dry pause. "Don\'t worry. We have absorbed worse."',
    dialogue: {
      'Q1': { question: 'You were expecting me.',          type: 'choice', response: '"The Estate was. The Estate is generally expecting someone — it is one of the few institutions in the country that has not yet had to revise the assumption." He gestures, mildly, at the room. "Tonight it happens to be you. Lord Ashworth thought it appropriate that a first-time visitor be received by someone whose duties this evening are largely ceremonial. I am the ceremonial part. The Rite is the rest."' },
      'Q2': { question: 'What is the Rite, exactly?',      type: 'choice', response: '"A ceremony." A pause that is, for him, almost a smile. "I appreciate that this is not a useful answer. Let me try again. Lord Ashworth will open the Black Register before the assembled membership at eight o\'clock. The Register has not been opened in public in living memory, and most of the people in this building tonight have been preparing for that fact in one form or another for some time." Another pause. "A few of them have been preparing in ways the Register itself will eventually describe."' },
      'Q3': { question: 'What kind of man is Lord Ashworth?', type: 'choice', response: '"Meticulous. He has run this Estate for forty years and has, in that time, declined to misplace anything. A record. A name. A debt." His tone shifts — the smallest amount, the warmth of an old loyalty briefly visible. "He has been preparing for tonight for six years. When a man spends six years preparing to say a thing in public, what he intends to say is usually either very true or very dangerous. With Lord Ashworth it tends to be both. That is the work of the evening."' },
      'Q4': { question: 'Why am I the only one without a mask?', type: 'choice', response: '"Because you are not yet a member. The mask is a courtesy the Estate extends to those it has reason to conceal. Tonight, the Estate has reason to conceal nearly everyone." He almost smiles. "You may take some comfort in being the exception. Most people, in my experience, do not. Most people would rather be hidden than seen, and tonight is the kind of evening that proves them right."' },
      'Q5': { question: 'Where should I go until eight?',  type: 'choice', response: '"Anywhere that is not the Ballroom. The Ballroom is closed until the assembly convenes, and I am, between you and me, glad of it. The Ballroom has the worst acoustic in the building and has been spared the worst conversations of the evening only because no one has yet been allowed inside it." A small, formal nod. "The grounds are open. The guests are masked. They will not, as a rule, introduce themselves. Try not to read this as rudeness. Read it as architecture."' },
    },
  },

  // ── NORTHCOTT (masked) ──────────────────────────────────────────
  // Twenty-seven, six weeks in, overdressed, nervous in a PARTY way.
  // Funnier than he means to be.
  'northcott': {
    room: 'weapons-room',
    intro: 'A young masked figure stands among the mounted sabres with the upright posture of a man who has been told to be somewhere and has decided to be there exactly. A leather-bound notebook is tucked under one arm. There is a small sherry on the side-table beside him, untouched, and the way he is not touching it suggests he is concentrating quite hard on not touching it. He looks up sharply when you enter — caught between a polite nod, an outright salute, and possibly a curtsey, and committing fully to none of the three.',
    dialogue: {
      'Q1': { question: 'Admiring the swords?',           type: 'choice', response: '"They are decorative. None of them have an edge. I checked." A small pause. He looks faintly betrayed by his own sentence. "Not because I expected them to. I am told it is appropriate to know the building one is asked to be in, and I have been — thorough about it. I have also looked behind the curtains. Nothing was behind the curtains. I am writing it down."' },
      'Q2': { question: 'You don\'t look like you\'re enjoying yourself.', type: 'choice', response: '"I am." He says it immediately, which is the wrong way to answer the question. He hears himself. "That is — I am attempting to. The sherry is excellent. The rooms are warm. The masks are — the masks are uniformly intimidating in a way I had not anticipated." He glances at the door. "My mother said it would be like a wedding. It is not like a wedding."' },
      'Q3': { question: 'What\'s the notebook for?',       type: 'choice', response: '"Notes." He says it. He appears to find this insufficient. "I have been asked to keep a record this evening. Times of arrival, mostly. I am to record anything that strikes me as wrong." A short pause. "I have been six weeks attempting to determine what wrong looks like in advance. I have determined that wrong, when it arrives, is generally well-dressed and apologises before it does anything. That is as far as I have got."' },
      'Q4': { question: 'Who told you you had the right temperament?', type: 'choice', response: '"Lord Ashworth." He says it with the small, helpless pride of a man who is still not sure whether he was praised or recruited. "Six weeks ago. He did not specify which temperament. He is not, by reputation, the sort of man one asks twice. I have been examining various of my temperaments since, looking for the responsible one. So far, no luck."' },
    },
  },

  // ── THE STEWARD (masked) ────────────────────────────────────────
  // Fourteen years. Permitted ONE dry observation tonight. Then snaps shut.
  'steward': {
    room: 'dining-room',
    intro: 'A masked figure stands at the long table, adjusting a silver candelabra by a fraction so small it cannot be necessary. The dining room has been set for sixty — glassware, place cards, the slight catastrophe of perfectly arranged flowers — and the room smells faintly of beeswax and cold roses. He turns when you enter, slowly, in the manner of a man who has heard you approach and has chosen the precise pace of his turn.',
    dialogue: {
      'Q1': { question: 'Quiet so far.',                   type: 'choice', response: '"It will not remain so, sir." He inclines his head. "There are sixty places set. Most of the chairs have not yet decided whose backside they are obliged to flatter. After eight o\'clock the chairs will not have a choice and the room will become considerably louder. I have always preferred the room as it is now. The room before the room."' },
      'Q2': { question: 'You\'ve been here a long time.',  type: 'choice', response: '"Long enough, sir. The house has not required me to count." A pause — and then, the small permission of an evening before any harm has been done, something almost confiding: "I have outlasted three sovereigns of the Society and four chefs. The chefs were the harder loss."' },
      'Q3': { question: 'What are you watching for?',      type: 'choice', response: 'A pause. The almost-confiding has gone. The hands return behind his back, precisely. "The candles, sir. They burn unevenly in this room because of a draught from the south window which has been there since 1881 and which the Estate has, in three separate budgets, declined to address." Another pause. "It is the thing one watches for. Among others."' },
      'Q4': { question: 'See you at the Rite.',            type: 'choice', response: '"At the Rite, sir. Good evening." He returns to the candelabra. The fraction it required is still being attended to. It will be attended to until eight.' },
    },
  },

  // ── THE BARON (masked) ──────────────────────────────────────────
  // Three glasses in. No consequences yet. The funny version of the man.
  'baron': {
    room: 'study',
    intro: 'A masked figure occupies one of the leather armchairs by the fire with the proprietary air of a man who has already decided this chair will be his for the evening and would not be sorry if someone tried to contest the claim. Cigar smoke trails toward the ceiling in a thin, unhurried blue line. There is a glass on the side-table. The glass is not full. The glass has not been full for some time. The mask is heavy — feathered, expensive, the sort that announces itself by trying not to.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Is it." Not a question. A small, slow exhale of smoke. "The evening is presently producing cigars, brandy, and the general absence of obligation, all of which I approve of. It is also producing a great deal of small talk in adjacent rooms, which I do not approve of, but which I am tolerating from this distance." The faintest gesture of the cigar. "I am, against expectation, having quite a nice time."' },
      'Q2': { question: 'You don\'t enjoy these things.',  type: 'choice', response: '"I have a personal objection to wearing a face I did not choose, in a room arranged by men I did not invite, on the schedule of a clock I do not own." A pause for effect, which he is enjoying. "Apart from that, the evening is going beautifully. The brandy is older than two of the people drinking it, and the cigars were rolled by someone with strong opinions about geography. I have no complaints to register that cannot wait until tomorrow."' },
      'Q3': { question: 'What should I know about Lord Ashworth?', type: 'choice', response: 'For a moment something behind the mask sharpens. Then he takes a sip and the moment is laid to rest. "Ashworth is meticulous. He has been preparing for tonight for six years. When a man spends six years preparing to say a thing in public, what he intends to say is generally either very true or very dangerous. Ashworth tends to manage both." Another exhale. "It is one of his less endearing qualities, and the reason I have always found him bearable."' },
      'Q4': { question: 'Why are you in here, not out there?', type: 'choice', response: '"Two reasons." He raises the cigar. "This. And —" he raises the glass. "This. The Estate prefers its members to mingle before a Rite. I have always taken the view that mingling is best done by sitting absolutely still and waiting for the more interesting half of the room to come and find me. Tonight —" he tips the glass slightly toward you, in something not quite a toast, "the system has worked."' },
    },
  },

  // ── LADY ASHWORTH (masked) ──────────────────────────────────────
  // Almost charming. The past-tense has not claimed her. Closest to flirtation she ever produces.
  'ashworth': {
    room: 'conservatory',
    intro: 'A masked woman stands among the glass and the trailing greenery of the conservatory, a folded letter held loosely between gloved fingers. The lamps are low here — they have always been low here — and the orchids have the slightly louche posture of plants that have been listening to too many conversations. She does not appear surprised to see you. She does not appear delighted, either. She appears, briefly, to be in a good mood, which is not a thing one would say of her at any other point in the evening that follows.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Good evening, Mr. Grey." She folds the letter once, neatly. "You are very brave to have entered the conservatory. Most of the gentlemen are too frightened of the orchids. They have been told the orchids are aware." A small smile, audible if not visible. "They are. But not of them."' },
      'Q2': { question: 'Are you waiting for someone?',    type: 'choice', response: '"For my husband. For the Rite. For eight o\'clock." She tilts her head a fraction. "Eight o\'clock has been very stubborn about arriving. I have spoken to it three times this evening and it has been entirely unmoved." A pause. "My husband can be similar. It is one of the things we have in common."' },
      'Q3': { question: 'You don\'t seem nervous about tonight.', type: 'choice', response: '"Should I be?" The question is not defensive. It is curious — the slightly amused curiosity of a woman who has been asked a thing she has not, herself, thought to ask. "My husband has prepared for tonight for six years. In that time he has learned the names of every member, the seal-press of every house, and the precise weight of three centuries of Society silver. Tonight will go exactly as he has arranged. It would not occur to me to be nervous about a thing my husband has prepared." A small pause. "It would occur to me to be nervous about other things. But not that."' },
      'Q4': { question: 'I\'ll let you wait.',             type: 'choice', response: '"Thank you." She unfolds the letter and folds it again, the same crease. "I am not unhappy to have been disturbed. The orchids have run out of new things to say and I had been preparing to invent some on their behalf. You have spared us all a difficult half-hour."' },
    },
  },

  // ── CRANE (masked) ──────────────────────────────────────────────
  // Witty, slightly drunk on sherry. The version of her that has not been called to a body.
  'crane': {
    room: 'gallery',
    intro: 'A masked woman stands close to one of the portraits in the long Gallery — closer than the convention of the room suggests, near enough that the lamp on the wall picks up the small glint of a glass in her left hand. The glass has, at some point in the recent past, contained sherry. It contains slightly less of it now. She does not turn when you arrive. She has been examining the portrait of an eighteenth-century admiral with the studious, mildly contemptuous attention of a person who has decided that the admiral, on balance, deserved it.',
    dialogue: {
      'Q1': { question: 'A friend of yours?',              type: 'choice', response: '"Mercifully, no. He died in 1804, of a hubris one can still see from across the room." She tilts her head a fraction. "The brushwork is excellent. The face is appalling. There is a great deal to be said for the painters of two centuries ago — they had the courage to render their subjects accurately. We have lost the trick. Modern portraiture is so flattering one can no longer tell the bankers from the bishops."' },
      'Q2': { question: 'You attend these often?',         type: 'choice', response: '"More than I would choose. Less than I am asked." A small, dry pause. "Lord Ashworth runs a tight Society and a generous bar, in that order, and one tolerates the first for the second. Most evenings here pass off with no greater incident than someone\'s opinions about Wagner. Tonight —" she sips, considers, "tonight is meant to be more interesting. I have been instructed to expect interest. I am doing my best."' },
      'Q3': { question: 'Why are you in here, not in the drawing room?', type: 'choice', response: '"Because the drawing room contains the Hon. Charles Allerton, who has, in the last forty minutes, twice attempted to explain the law of contract to me — and the orangery contains his wife, who in fairness has been doing the more difficult job for thirty-one years." Another sip. "The Gallery contains an admiral and you. It is, by some distance, the best company in the building."' },
      'Q4': { question: 'See you at the Rite.',            type: 'choice', response: '"Eight o\'clock. The Ballroom. I shall be the third row from the front, on the left, in the chair I have selected for its proximity to the only door I trust." She raises the glass — not quite to you. "The portraits, of course, will still be here afterward. So will the admiral. I take some comfort in that and you should too."' },
    },
  },

  // ── VIVIENNE (masked) ───────────────────────────────────────────
  // The flirt of the cast. Sophisticated, never crude. Eroticism in the pace.
  // Voice direction (ElevenLabs): French (Lyon), low register, unhurried.
  // She lets pauses sit. The sentences end where they want to end.
  'vivienne': {
    room: 'terrace',
    intro: 'A masked woman is at the balustrade. She is not doing anything. The not-doing has the particular completeness of a person who is exactly where she means to be. The terrace lamps are warm; the gardens behind her are not. She is half in each.\n\nShe does not turn when you arrive. She has heard you. She is letting the silence go on because she has decided the silence is worth the going-on.\n\nThen, at the moment of her choosing, she turns.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Bonsoir." She looks at you for slightly longer than the greeting requires. "You are the one without a mask. I had heard." A small pause. "I had not been told you would arrive on the terrace at —" she glances, briefly, at the windows, "seven minutes past." A small smile, audible if not visible. "I had been told you would arrive in the Foyer, which is where serious men go. The terrace is for the other kind. I am pleased to be wrong about you, Mr. Grey."' },
      'Q2': { question: 'You\'ve been watching me.',       type: 'choice', response: '"I have been watching the room. You crossed the room." A pause, unhurried. "There is a difference. The first is curiosity. The second is — recreation. Tonight has not given me much in the way of recreation. I take what the evening provides."' },
      'Q3': { question: 'You know the Estate well?',       type: 'choice', response: '"I know what the Estate tells me." She turns a fraction more toward you. The angle of her attention has shifted — not the body, the listening. "The Estate is generous with what it tells, if one is patient. If one stands very still in the right rooms. Houses are not unlike men in this regard. The ones worth knowing reveal themselves slowly, and never to anyone in a hurry."' },
      'Q4': { question: 'Why are you out here alone?',     type: 'choice', response: '"I am not alone. You are here." It is a fact, observed. Not coy. "Before that — the Foyer was full of men explaining the Rite to one another in voices designed to be overheard. The drawing room was full of women pretending not to listen." A pause. "The terrace was empty. I have a rule about empty terraces on warm evenings. I keep them company. They are grateful."' },
      'Q5': { question: 'What do you do here?',            type: 'choice', response: 'A pause longer than the question expects. "I am asked, and I answer. I am told, and I remember." Her eyes do not move from yours. "I am not — at present — being asked, or told. So I am doing the thing one does in the spaces between. I am paying attention." A smaller pause. "Tonight that is a more interesting occupation than usual."' },
      'Q6': { question: 'I should let you enjoy the evening.', type: 'choice', response: '"Should you." Not quite a question. She does not turn back to the gardens. Not yet. "Eight o\'clock — the Rite. After eight o\'clock — well." A breath. "Houses tell more after eight o\'clock. So do their guests. So, occasionally, do I." She inclines her head, the smallest fraction. "Bonne soirée, Mr. Grey. The terrace is here when you find your way back to it. I generally am too."' },
    },
  },

  // ── HATCH (masked) ──────────────────────────────────────────────
  // Half a beer in. Off-duty. Three-word answers but warm.
  'hatch': {
    room: 'terrace',
    intro: 'A masked man stands at the far end of the terrace, near the low wall that drops to the rose beds. He is unhurried in the absolute way of a man who has worked outdoors for thirty years and has acquired, in that time, the patience of weather. A pewter mug rests on the stone beside him. It is, at present, half-full. It has been half-full for the entire time you have been on the terrace, which suggests either that he is sipping very slowly or that the Estate\'s ale is not what it was.',
    dialogue: {
      'Q1': { question: 'Good evening.',                   type: 'choice', response: '"Mr. Grey." A nod. "Lord Ashworth said a man named Grey would arrive on the seven o\'clock train. He did not say much else. He never does. He saves his words for rooms with chairs." A small, slow smile in the voice. "This is not one."' },
      'Q2': { question: 'You\'re not at the assembly?',    type: 'choice', response: '"Not tonight. The grounds want attending to. The grounds always want attending to, and tonight they are kind enough to want it loudly." He nods toward the dark gardens. "There are rooms in this house I am not required to be in. After thirty years one learns to take the Estate up on its kindnesses."' },
      'Q3': { question: 'What\'s the ale like?',           type: 'choice', response: 'He looks at the mug. He considers it. He looks at you. "It is the ale of an Estate that has spent more on candles tonight than it has spent on ale this year." A pause. "I will not bore you with the comparison. But I have made it, and the ale has not come out well."' },
      'Q4': { question: 'See you later.',                  type: 'choice', response: '"Likely." Another nod. "I will be on the terrace. I will be in the gardens. I will be near the gate at eight, in case any guests have come without their masks and require — redirection. Mostly I will be here." He raises the mug a half-inch. "Old habit. Quiet evenings deserve company."' },
    },
  },

  // ── THE SURGEON (masked) ────────────────────────────────────────
  // Weaponized warmth. Charming on purpose. Replay value: this becomes horrifying.
  'surgeon': {
    room: 'map-room',
    intro: 'A masked figure leans over the map-room table, one gloved finger resting lightly on a coastline that has been redrawn at least twice in the last century. He looks up the moment you enter — not startled, not summoned, simply available, as if he had been mildly looking forward to the interruption and you have been kind enough to provide it. The room is warm. He is warm. The warmth is the first thing one notices about him.',
    dialogue: {
      'Q1': { question: 'Planning a journey?',             type: 'choice', response: '"Studying an old one." The smile is in the voice — gentle, professional. "These maps predate the modern borders by some distance. Whole countries have been politely renamed since the cartographer set down his pen. I find the changes instructive. People are very confident about borders, in my experience, until one shows them an older map. Then they become quieter. It is one of the more useful things a map can do."' },
      'Q2': { question: 'You collect maps?',               type: 'choice', response: '"I read them. Collecting implies one keeps them, and I do not, generally, keep things." He sets the magnifier down with the small care of a man who has handled more delicate instruments than this. "I have an interest in the spaces I am asked to be in. Lord Ashworth maintains a remarkable collection. One does not encounter this room twice in a lifetime, and I am not the kind of man who wastes the first encounter."' },
      'Q3': { question: 'Have you been here before?',      type: 'choice', response: '"Tonight is my first formal evening at the Estate." A pause that does not feel like hesitation. "I walked the building when I arrived. I like to understand a house before I am asked to spend an evening in it. Old habit. The hands like to know where the doors are." He smiles. The smile is warm. He says everything warmly. "Have I answered your question, Mr. Grey? Or were you asking something else?"' },
      'Q4': { question: 'Looking forward to the Rite?',    type: 'choice', response: '"With what I would call professional interest." Another small smile. "Lord Ashworth has prepared something significant. I have been told it will be memorable. I prefer to arrive at memorable evenings already paying attention — it saves a great deal of effort later on. And I do find I am paying rather close attention, this evening. Thank you for asking."' },
    },
  },

  // ── GREAVES (masked) ────────────────────────────────────────────
  // Genuinely amused by the room. The world's most tolerable cynic.
  'greaves': {
    room: 'gallery',
    intro: 'A masked figure stands before a portrait of Lord Ashworth at the far end of the long Gallery, head tilted at the small judicial angle of a man comparing the painted version against the original and finding both, on balance, instructive. He does not turn when you approach. He has, however, registered it — the line of his shoulders adjusts a fraction without acknowledgement, which is, in his case, a form of acknowledgement.',
    dialogue: {
      'Q1': { question: 'A good likeness.',                type: 'choice', response: '"It was, fifteen years ago. The painter was competent — competent in the particular old-fashioned sense, which is to say willing to render his subject as he found him rather than as the subject had hoped to be found. The result is honest. Honesty is not, as you may have noticed, the prevailing aesthetic of contemporary portraiture. It survives in attics and Society galleries, and very few other places."' },
      'Q2': { question: 'You know him well?',              type: 'choice', response: '"Long enough to recognise the work, sufficient to attend the Rite, insufficient to be surprised by anything that happens in it." A small observational pause. "Lord Ashworth has been preparing for tonight for six years. I have learned, in the course of an unremarkable life, to take six-year preparations seriously. Three years one might dismiss as stubbornness. Four is excessive. Six is a position." He almost smiles. "And Lord Ashworth has never, in my acquaintance, taken a position he did not intend to defend."' },
      'Q3': { question: 'You don\'t sound entertained.',   type: 'choice', response: '"On the contrary. I am entertained at precisely the level the evening currently provides, which is to say, modestly. The Rite is at eight. Most of the interesting behaviour in this building waits until then to identify itself." A pause that has, for the first time, something like real pleasure in it. "You, however, are early. I have been admiring the portrait for forty minutes and you are the first person to address me in that time. Either I am better-disguised than I had hoped, or the company is worse. I will not press for which."' },
      'Q4': { question: 'See you at eight.',               type: 'choice', response: '"The Ballroom. Eight o\'clock. I shall be there in the capacity of an attentive observer — the only capacity I have ever been any good at, and the one I have made, over the course of a quiet career, into something approaching a profession. Find me afterward, Mr. Grey. The interesting conversations begin once the formal one is over. They always have."' },
    },
  },

  // ── PEMBERTON-HALE (masked) ─────────────────────────────────────
  // Peacocking. Vain. Has nothing to hide YET.
  'pemberton-hale': {
    room: 'trophy-room',
    intro: 'A tall masked figure stands among the cases and mounted heads of the Trophy Room with the proprietorial air of a man who is not the proprietor but feels he could have been. His gloved hands are clasped behind his back. His posture has been worked on. His shoes have been worked on. The mask itself, on closer look, is more carefully made than any other mask in the building tonight. He turns at your approach with the smooth, slightly practised rotation of a man who has not yet learned that being noticed is sometimes a disadvantage.',
    dialogue: {
      'Q1': { question: 'Quite a collection.',             type: 'choice', response: '"It is. None of it earned, of course — Lord Ashworth does not hunt. The pieces were acquired. Most through estate sales, a few through the Society itself, one or two through means the Estate is now too dignified to remember." The smallest possible smile, well-rehearsed. "They are decorative. The Estate is fond of decoration that communicates something. Routine, by the standards of houses of this kind."' },
      'Q2': { question: 'You know your way around.',       type: 'choice', response: '"My family has been in the Society for four generations." Said with the precise modesty of a man who very much wants you to know it. "I have been a member in my own right for nineteen years. I sit on three of the Estate\'s standing committees, including the one that is, I am informed, most likely to be referenced this evening." A pause. "I prefer to be prepared. The unprepared tend to find these evenings rather longer than they need to be."' },
      'Q3': { question: 'You\'re looking forward to the Rite.', type: 'choice', response: '"Considerably. Lord Ashworth will open the Black Register at eight o\'clock. The Register is the Estate\'s permanent record. Whatever is read into it tonight becomes — formally — part of the Estate." He chooses the formality of the phrase carefully. He likes the way it sits. "It is, by the standards of the Society, a significant evening. I am pleased to be present for it. There will not be another like it in our lifetimes, Mr. Grey. Or, with respect, in yours."' },
      'Q4': { question: 'You sound very prepared.',        type: 'choice', response: '"I prefer to be prepared." The smallest preen. "I have read the precedents. I have reviewed the standing orders. I know which of the senior members is likely to speak and in what order, and I know which of them will pretend, afterward, to have spoken sooner." A pause that has, for once, no anxiety in it. "It is not difficult. It only requires that one care. Most of the men in this building tonight do not care. That is the small advantage I have been cultivating for nineteen years."' },
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
