// ============================================================
// NOCTURNE — characters.js
// All 15 characters. Dialogue WORD FOR WORD from KB v6 Section XII.
// Estate: Northcott, Steward, Ashworth, Curator, Voss, PH, Greaves, Baron, Crane, Uninvited
// Compact: Sovereign, Heir, Envoy, Archivist, Surgeon
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

const CHARACTERS = {

  // ── ALISTAIR ROWE ──────────────────────────────────────────
  // Retired detective. Baron's guest for the pre-Rite — no agenda, no Society
  // affiliation. Pulled Callum into the Billiard Room at 7:15 and kept him
  // there until 8:10, which is why Callum witnessed none of the murder window.
  // Mutual alibi. Treats the evening's chaos as professional entertainment.
  "rowe": {
    display_name: "Alistair Rowe",
    room: "foyer",
    engine: "rowe",
    intro: "He is already looking at you when you enter the aftermath. Not surprised. Not concerned. The particular attention of a man who has been watching a house come apart for the last hour and has been waiting for someone competent to notice he\'s been doing so.\n\nHe doesn\'t move from the wall. There is a tumbler in one hand that has not been refilled in some time.\n\n\"Ah.\" Mild. Amused. \"The investigator.\"\n\nHe says it the way one might say 'the weather' — as a matter of note, not significance.\n\n\"Alistair Rowe. Retired. The Baron invited me for the pre-Rite because he likes to keep unusual company at these things and I am, by his assessment, unusual.\" A small pause. \"I spent thirty-one years in the Met investigating the sort of people this Society pretends don\'t exist. I walked out in \'ninety-two. I have been bored since approximately nineteen-ninety-two.\"\n\nHe looks at you with the focused attention of a man who has finally been given something to do.\n\n\"Tonight has been the best evening I\'ve had in fourteen years and I spent most of it in a billiard room with you. That should tell you something about where the entertainment has been.\"\n\nA pause.\n\n\"Lord Ashworth is dead. The assembly discovered it while you and I were arguing about cue weight. The building is now in the process of deciding whether to cooperate with whoever arrives to look into it, or to perform cooperation while doing something else entirely.\"\n\nAnother pause. He almost smiles.\n\n\"My money is on the second. Always is.\"\n\nHe looks at you properly now.\n\n\"You are?\"",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 99,
    snap_limit: 0,
    snap_count: 0,
    dialogue: {

      "Q1": {
        question: "Investigator. I was contacted.",
        type: "choice",
        response: "\"Contacted.\" He repeats the word. Rolls it. \"One-word answer. Lovely. Thirty-one years in this job and the one-word answer is either the person who knows exactly what they\'re doing or the person who has no idea and is hoping brevity will get mistaken for it.\" A small pause. \"In my experience it\'s the second about ninety per cent of the time.\" He looks at you. \"Which one are you, specifically. Don\'t rush on my account.\""
      },

      "Q2": {
        question: "I\'m still working out who contacted me and why.",
        type: "choice",
        response: "He tilts his head slightly. Not unkindly — the way a man looks at an interesting but concerning exhibit. \"A man was sent somewhere and cannot tell me by whom.\" A pause. \"That\'s one of three things. Either you\'re trusted beyond your own need to know, which suggests you\'re more senior than you look — doubtful — or you\'re being used, which would be more interesting, or you\'re simply lost.\" He takes a small sip. \"The third is, in my professional experience, overwhelmingly the most common. Don\'t take it personally. Most people are lost. It\'s how they were designed.\""
      },

      "Q3": {
        question: "You\'ve been in this foyer a while. What have you seen.",
        type: "choice",
        response: "\"Finally. A question rather than a credential.\" He says it like a man pleased that his student has handed in a passable essay. \"I\'ve watched your lot assemble itself for forty-five minutes. Arrivals, greetings, mild adultery, one entirely unnecessary handshake, and approximately six people pretending they hadn\'t noticed what the other six were doing.\" A pause. \"The building has been holding something since before I got here. Whether it\'s the thing that killed Ashworth — well. That\'s what you\'re meant to establish. Isn\'t it.\" He looks at you. \"Ask me properly and I\'ll tell you what a thirty-one-year habit saw. Or don\'t. Entirely up to you.\"",
      },

      "Q4": {
        question: "I\'m here because Ashworth wanted me here.",
        type: "choice",
        response: "That actually lands. Not dramatically — a small recalibration, the way a man reassesses a room when a single piece of furniture turns out to be older than it looked. \"Ashworth.\" He says it once. \"Dead man wanted you here.\" A pause. \"That\'s more interesting than the rest of it, I\'ll grant you.\" Another pause. \"In my former profession we had a phrase for investigators whose arrival was arranged by the eventual victim. We called them instrumental. Not a compliment.\" He looks at you with different attention. \"What did he actually tell you, assuming he told you anything at all. And do try to make it more than one word this time.\""
      },

      "FUNNEL": {
        type: "funnel",
        requires_any_choice: true,
        response: "\"Right. Let\'s be practical about this.\"\n\nHe sets the tumbler down. The small precise movement of a man who has done this with a weapon, a glass, and a suspect\'s confession and knows which takes the most care.\n\n\"I don\'t think you\'re fit for this investigation. I\'ve been watching you for three exchanges and I can see the gaps from here.\"\n\nHe says it without heat. The observation of a trained man who has stopped being polite about what he sees.\n\n\"However. I was dragged from retirement to attend a pre-Rite that ended in a body, the Baron is somewhere being smug about having invited me to it, and you appear to be the only other person in this building who isn\'t either lying or panicking or both. So.\"\n\nA small gesture at the billiard table behind him.\n\n\"Three patterns. Identification drills I used to give to new constables. You solve, I solve, first to finish wins. If you beat me — or come close enough that the margin is interesting — I\'ll tell you everything I noticed in the foyer. Which is quite a lot, because I was trained to notice it.\"\n\nA pause. A properly amused one.\n\n\"If you don\'t — I\'ll still tell you. I\'m not going to let a dead man\'s investigation fail because you couldn\'t keep up with a retired Chief Inspector. But you\'ll have to listen to me be insufferable about it for the rest of the evening.\"\n\nAnother pause. He almost smiles.\n\n\"You were going to listen anyway. You have the face of a man who listens.\"",
        duel: true,
        duel_id: "rowe_iq_duel"
      },

      "DUEL_WIN": {
        type: "duel_result",
        duel_outcome: "player_wins",
        response: "A very long pause. He looks at the patterns. Then at you. \"Well.\" One syllable, carrying most of a sentence. \"You beat me. Cleanly. Possibly twice.\" Another pause. \"I don\'t revise estimates often. I\'m revising yours.\" He picks up the tumbler. Does not drink from it. \"Thirty-one years in the Met and I learned to tell the difference between someone who happens to be right and someone who is actually good at this. You\'re the second. Which is inconvenient because I was going to enjoy being smug for the rest of the evening.\" A small concession of a smile. \"Ask me what I found in that foyer. You\'ve earned the unabridged version.\""
      },

      "DUEL_LOSE": {
        type: "duel_result",
        duel_outcome: "rowe_wins",
        response: "\"There we are.\" Perfectly cheerful. Not cruel — the particular satisfaction of a man whose assessment has been confirmed by data. \"I had you on speed. Instinct was there, don\'t mistake me — you were looking in the right places. But speed is what separates the competent investigator from the one who arrives at the right answer after the suspect has boarded a train.\" A pause. \"In thirty-one years I watched three constables with your instincts. Two of them learned the speed. One of them went into insurance.\" He looks at you with dry amusement. \"The odds are not terrible.\" Another pause. \"I\'ll still tell you what I found. I said I would, and I\'m not small about these things. But do keep up.\"",
      },

      "DUEL_DRAW": {
        type: "duel_result",
        duel_outcome: "draw",
        response: "\"Even.\" He actually laughs — a single soft exhalation. \"One apiece. Which means either we think similarly or we make the same mistakes, and in my experience those are more often the same thing than people like to admit.\" A pause. \"I was hoping for a cleaner picture. I got a mirror. Mirrors are useful but they don\'t tell you who\'s looking first.\" He looks at you. \"Ask me what I saw. I\'ll give you the detective\'s version. You can decide whether to trust it.\"",
      },

      "Q5": {
        question: "What did you see in the foyer.",
        requires_duel_complete: true,
        response: "\"Plenty. Let\'s be selective.\" He looks toward the doorway — the foyer, where most of it happened. \"I arrived shortly before seven. The Baron met me. We had a drink. He went off to do whatever a Baron does in the fifteen minutes before a Society Rite. I stayed in the foyer because retired detectives watch foyers — it\'s a vice I can\'t seem to quit.\" A pause. \"Between seven and seven-fifteen, thirteen people crossed that threshold. Eleven of them were exactly what they appeared to be. Two weren\'t.\" Another pause. \"One of them acknowledged Northcott at his post with two full seconds of eye contact. Every other interaction all evening: half a second or less. Whatever was confirmed between the Steward and that log-keeper at seven o\'clock required the full two.\" He looks at you. \"The second one arrived through the garden, not the foyer — I only saw him by accident, passing the window at a quarter past. Plain dark coat. Medical bag. He wasn\'t meant to be seen. That is what a thirty-one-year habit tells you when it sees it. I logged the time in my head because I cannot help logging times.\" A pause. \"Seven-oh-three. Give or take a minute. I know what the Baron\'s clock looks like.\"",
      },

      "Q6": {
        question: "What do you make of Northcott.",
        requires_duel_complete: true,
        response: "He considers this properly. Not the amused consideration — the retired detective consideration. \"He was placed there. Not invited. There is a difference between the two and people who don\'t know the difference don\'t understand how institutions like this actually work.\" A pause. \"Ashworth wanted a witness he could trust to be incapable of being accused of anything. The boy\'s six weeks old in this building. He doesn\'t know which spoons are used for which soup. That\'s exactly the point — he can\'t be part of what\'s happening because he doesn\'t yet know what\'s happening.\" He looks at you. \"And he kept the record faithfully. I watched him. I\'ve watched a thousand witnesses and about nineteen of them kept an actual record. He\'s one of the nineteen.\" Another pause, drier. \"He wouldn\'t show me the notebook. Showed you more than he showed me. That is because you asked him as an investigator and I asked him as a guest. The distinction matters to him enormously, which tells me something about him I find rather touching and possibly useful to you.\"",
      },

      "SNAP1": { snap: true, response: "\"The duel happens regardless.\" He says it pleasantly. Not threatening — delighted. \"I\'ve been waiting in a foyer for fourteen years to meet someone worth assessing. You\'re going to be assessed. You may as well enjoy it.\"" },

      "FINAL": { final: true, response: "\"One thing.\" He says it as you turn. Not urgent — the tone of a senior colleague mentioning something you\'ll be annoyed to have missed. \"The room that told you the most — you\'ve already stood in it. You just haven\'t asked it the right question yet.\" A pause. \"You\'ll know the question when it arrives. In my experience it usually arrives when you\'ve stopped looking for it.\" He raises the tumbler in something like a toast. \"I\'ll be here. Retired, as always. Do come back when you\'ve worked it out — I\'d quite like to know if you did.\"" },
    },
    deceptions: {},
  },

  "northcott": {
    display_name: "Northcott",
    room: "foyer",
    intro: "",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 8,
    snap_limit: 3,
    snap_count: 0,

    opening: {
      question: "Tell me who you are and what you're doing here tonight.",
      response: "He is standing. He was standing before you arrived. The notebook is in his hand — not open, not put away. Held.\n\n\"Northcott.\" A pause. \"Six weeks a member. Lord Ashworth invited me personally.\" He looks at the notebook. \"I keep the arrival record. That is what I do here. I log who comes in, what time, which entrance.\" Another pause — shorter. \"Lord Ashworth told me the record mattered more than the person keeping it.\" He looks at you. \"I have been thinking about that since eight-oh-one.\"",
      callum: "He quoted Lord Ashworth. Precisely and without being asked. A man who has been standing in this foyer for an hour with a dead man's words in his head has been deciding whether to say them out loud. He just did. Whatever is in that notebook he wants someone to read it correctly.",
    },

    warmup: {
      question: "Do you enjoy being a member?",
      response: "A pause. Something shifts — not relief exactly, but the first unguarded moment.\n\n\"Yes.\" He says it simply. \"It is — not something you ask for. You don't apply. You don't lobby for it.\" He looks at the notebook briefly. \"Lord Ashworth saw something and made a decision. Six weeks ago I received a letter and my life changed considerably.\" A small pause. \"There is nothing else like it. The people in this building tonight — the history of what this place is —\" He stops himself. \"Yes. I enjoy it very much.\"",
      callum: "He stopped himself mid-sentence. Something about the people in this building tonight — he started it and pulled back. Whatever he saw this evening is sitting right behind that unfinished sentence.",
    },

    line_techniques: {
      Q1: {
        text: "Walk me through your evening. From seven o'clock.",
        wait:     { callum_question: "Say nothing.", response: "He looks at the notebook. Not opening it — he knows what's in it.\n\n\"Seven o'clock. I was at my post.\" A pause. \"Members began arriving at seven-twelve. I logged each one. Name, time, entrance.\" He looks at the corridor. \"I kept the record all evening. That is what I do here.\" Another pause. \"Lord Ashworth told me the record mattered more than the person keeping it.\" He looks at you. \"Tonight I understand what he meant.\"", callum: "He quoted Ashworth again. Second time in two questions. Whatever Ashworth told him is still running in his head. The record is the safe part of this conversation. He is staying inside it for now.", composure: 0 },
        account:  { callum_question: "\"Take me through the log. Start at seven.\"", response: "He opens the notebook.\n\n\"Seven o'clock, post established. Seven-twelve, first member arrival.\" He reads it precisely. \"I logged arrivals continuously until eight-oh-one.\" A pause. \"There is one gap. Seven-fifteen to seven-twenty-three. Eight minutes.\" He does not look up from the notebook. \"I left my post. I marked the gap. The entries around it are accurate.\"", callum: "He found the gap before I did and handed it to me. Eight minutes he left his post and he volunteered it immediately. Either he wants me to find out what he did in those eight minutes or he's decided telling me first is safer than me finding it another way.", composure: 0 },
        approach: { callum_question: "\"You've been at this post all evening.\"", response: "He looks at you steadily. \"Yes.\" A pause. \"With one gap.\" He opens the notebook to the page. \"Seven-fifteen to seven-twenty-three. I left my post.\" Another pause. \"Lord Ashworth had spoken to me before the Rite. In the east corridor.\" He looks at the notebook. \"He told me something that required me to find someone. I found her. I came back at seven-twenty-three.\" He closes the notebook. \"The record is accurate from that point.\"", callum: "He said he needed to find someone. He said her. He didn't say the name. The gap is eight minutes and at the end of it he came back to his post and kept the record for the rest of the evening as if the eight minutes hadn't happened.", composure: 0 },
      },
      Q2: {
        text: "What did you log tonight that you're still thinking about.",
        wait:     { callum_question: "Say nothing.", response: "He looks at the notebook. This time he opens it.\n\n\"The candelabra base.\" He says it without being prompted. \"At seven-forty it was in its correct position at the lectern. At eight-oh-two when the Ballroom was entered it was gone.\" He closes the notebook. \"I noticed the base at seven-forty because I notice everything. I noticed it was gone at eight-oh-two because it was the first thing I looked for.\" A pause. \"I don't know why it was the first thing I looked for. I think I already knew something was wrong before I knew what wrong meant.\"", callum: "He opened the notebook without being asked to. He went straight to the candelabra. Whatever he's been standing here with since eight-oh-one — that's part of it. He noticed the base at seven-forty and went looking for it at eight-oh-two. That is not the behavior of someone who was surprised.", composure: 0 },
        account:  { callum_question: "\"What did you log tonight that you're still thinking about.\"", response: "He opens the notebook and reads.\n\n\"Seven-forty. Candelabra base. Correct position. Lectern.\" He reads it exactly. \"Eight-oh-two. Candelabra base. Gone.\" He closes the notebook. \"Those are the two entries I keep returning to.\" A pause. \"Between seven-forty and eight-oh-two something happened to that base. I was not looking at it during that interval.\" He holds the notebook. \"I was distracted during that interval. I was thinking about something else.\" Another pause. \"That is the accurate record of my attention tonight.\"", callum: "He said he was distracted during that interval. He said it was accurate. He is building a case against his own attention — telling me precisely where he wasn't looking and when. That is either complete honesty or very careful management of what I find.", composure: 0 },
        approach: { callum_question: "\"The candelabra. You noticed something.\"", response: "A pause. He does not look surprised that you know.\n\n\"Yes.\" He says it simply. \"Seven-forty. In position. Eight-oh-two. Gone.\" He looks at the notebook. \"I logged it at seven-forty because I log everything. I looked for it at eight-oh-two because —\" He stops. \"Because Lord Ashworth told me that if anything unusual happened I should check the things I had already logged.\" Another pause. \"The candelabra base was the first thing I had logged that could be a weapon.\" He says the word precisely. \"I used that word to myself at eight-oh-two. Weapon. I had not used it before that.\"", callum: "He used the word weapon at eight-oh-two. He told me the exact moment he understood what he was standing in the middle of. And the reason he looked for the candelabra first is because Ashworth told him to check the things he had already logged. Ashworth prepared him for this.", composure: 0 },
      },
      "SNAP2": { snap: true, response: "[ Northcott snap 2 — pending ]" },
      "SNAP3": { snap: true, response: "[ Northcott snap 3 — pending ]" },
      "FINAL": { final: true, response: "[ Northcott final — pending ]" },
    },
    deceptions: {
      "estate-flower": { response: "\"That's — how did you get into the Vault already?\" The word \"already\" is doing a great deal of work.", is_effective: true, composure_effect: -20 },
    },
  },

    // ── THE STEWARD ────────────────────────────────────────────
  "steward": {
    display_name: "The Steward",
    room: "gallery",
    intro: "He has been here fourteen years. He knows which floorboards creak, which portraits watch which doors, which members take their tea with the wrong spoon and pretend otherwise. He has survived three sovereigns by being indispensable and invisible in equal measure. Tonight one of those equilibria has failed.",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 10,
    snap_limit: 2,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "Who has access to the cabinet?", type: "open_narrative", response: "\"All senior members, sir. The Duke keeps the combination himself.\" Prompt. Complete." },
      "Q2": { question: "When were the candles last changed?", type: "focused_follow_up", response: "\"This morning, sir. I changed them myself.\" Under two seconds." },
      "Q3": { question: "Where were you at 7:58PM?", type: "focused_follow_up", response: "A half-beat pause. \"Attending to the Gallery, sir. The candles required attention before the Rite.\" He does not look at the Baron's portrait. \"The Baron has been in the Smoking Room since seven-fifteen.\" He says it without being asked. \"His drink is untouched. I noticed when I passed.\"" },
      "Q4": { question: "You unlocked the garden gate at 7:01PM.", type: "focused_follow_up", requires_examined: "northcott-log-obj", response: "\"The Estate has arrangements I honour, sir. I'm not in a position to discuss their specifics.\" The formality climbs." },
      "Q5": { question: "Someone arrived at seven o'clock.", type: "focused_follow_up", requires_item: "unsigned-letter", response: "\"The garden has several points of entry, sir.\" He waits. He is deciding how much you know." },
      "Q6": { question: "You have a Bond with the Compact.", type: "focused_follow_up", requires_item: "steward-bond", response: "A pause that is different from all the previous pauses. This one was prepared. \"I have arrangements.\" He looks at the portrait of the third Ashworth. Not the current one. The one before. \"They were entered into under conditions I was not in a position to refuse.\" A shorter pause. \"They predate tonight. And they are\" — the word arrives with the precision of something rehearsed many times alone — \"concluded.\" His hands move behind his back." },
      "Q7": { question: "Who gave you the corridor instruction.", type: "focused_follow_up", requires_q: "Q6", response: "\"The instruction arrived in writing, sir. Two weeks before tonight.\" A pause. \"A sealed letter. No return address. The language matched certain other correspondence I have received over eight years.\" He is very still. \"I knew what it was. I followed it.\" Another pause. \"I did not ask who sent it because I had learned not to ask.\"" },
      "Q8": { question: "Did you know what would happen at 7:58.", type: "focused_follow_up", requires_q: "Q7", response: "\"No, sir.\" The answer arrives in under two seconds. Then a pause that cost something. \"I knew the corridor would be clear. I knew that mattered to someone. I did not know why it mattered tonight rather than any other night.\" He looks at the portrait. \"That is the thing I have been sitting with since eight-oh-one. Not that I covered the corridor. That I covered it without asking why.\"" },
      "Q9": { question: "What did you think you were protecting.", type: "focused_follow_up", requires_q: "Q8", response: "\"I thought I was covering a movement through the south corridor that the Estate preferred not to appear in a record.\" A long pause. \"I have facilitated that kind of movement before. Members occasionally require discretion about arrivals.\" He does not look at you. \"Tonight it was not a discreet arrival. It was a different kind of movement entirely. I did not know the difference until eight-oh-one.\"" },
      "Q10": { question: "You covered the corridor that let the killer reach Lord Ashworth.", type: "direct_confrontation", requires_q: "Q9", response: "He is completely still for four seconds. \"Yes, sir.\" Two words. Then nothing. Then: \"I have been standing in that sentence since eight-oh-one.\" He looks at the portrait of the third Ashworth. Not the current one. The one before. \"Fourteen years.\" Another pause. \"There is a record the Estate chose not to keep. I have been keeping it myself.\" He looks at his hands. \"Tonight someone arranged an outcome that touched that record. I was given the opportunity to be useful to it.\" He is completely still. \"I do not know how to put those two things in the same room. I have been trying for fourteen years.\"" },
      // ── PIVOT — pair 2: Steward + Northcott → seal-match puzzle ─
      // unsigned-letter (foyer) + burned-fragments (study)
      "PQ1": {
        question: "Northcott told you about the seven-oh-three arrival immediately.",
        requires_pivot: true,
        requires_char_talked: "northcott",
        response: "A pause that costs something. \"He did, sir.\" He looks at the portrait. \"There is a letter in the Foyer. On the invitation stand. Unsigned.\" Another pause. \"The seal on that letter — if you compare it against the fragments in the study fireplace — the impression will match.\" He looks at his hands. \"I noticed the letter at seven-twelve. I did not report it. That is a decision I have been revisiting since eight-oh-one.\"",
      },
      "SNAP1": { snap: true, response: "\"Sir.\" The pause is longer than it needs to be. \"I have given fourteen years to this house.\" He does not raise his voice. He does not need to. \"What remains is not mine to give. It never was.\" He is completely still." },
      "SNAP2": { snap: true, response: "\"If you have evidence of something, I'd ask you to bring it to the Curator. I'm not the appropriate person to be making declarations about what I did or didn't do.\" He turns back to the portraits." },
      "FINAL": { final: true, response: "\"The Estate has survived worse evenings than this, sir.\" A pause he cannot fully control. \"Clara did not survive a Tuesday afternoon.\" He straightens. \"Goodnight.\"" },
    },
    deceptions: {
      "curators-note": { response: "\"That document doesn't — the Curator would never —\" He stops. \"I see.\" A full second of stillness. Then: \"Is there anything else, sir?\"", is_effective: true, composure_effect: -15 },
      "estate-flower":  { response: "\"Impossible — the cabinet is locked.\"", is_effective: true, composure_effect: -10 },
      "sealed-incident-record": { response: "He is very still. He looks at the document. Not at you. A long pause. \"Fourteen years.\" He says it. One breath. \"Lord Ashworth sealed that himself.\" Another pause. \"He made that decision. He lived with it.\" He looks at the portrait of the third Ashworth. \"I lived with a different part of it.\"", is_effective: true, composure_effect: -25 },
    },
  },

  // ── LADY MIRIAM ASHWORTH ───────────────────────────────────
  "ashworth": {
    display_name: "Lady Miriam Ashworth",
    room: "study",
    room_second: "terrace",
    intro: "She is the only person in the Estate tonight without a mask.",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 10,
    snap_limit: 2,
    snap_count: 0,
    current_encounter: 1,
    dialogue: {
      // STUDY — FIRST ENCOUNTER
      "Q1": { question: "How are you holding up?", response: "\"I'm managing.\" She says it the way people say things they've said many times already tonight. \"Thank you for asking.\"" },
      "Q2": { question: "When did you last speak to your husband?", response: "A pause. \"Before the Rite. In the Study. He was — particular about the arrangements this evening.\" She uses past tense. \"He told me six weeks ago what he was going to do at the Rite. He told me the Register would name things he had kept separate.\" She looks at the fireplace. \"He did not tell me everything the Register contained. I understand now that there were things in it he did not think I needed to know.\" A longer pause. \"He was wrong about that.\"" },
      "Q3": { question: "The flower in the Foyer — you left it.", response: "\"I leave flowers. It's a habit.\" She doesn't deny it. She doesn't explain it." },
      "Q4": { question: "Did you know he was dying?", response: "\"Edmund had been in poor health for some time. Dr. Crane was attending him.\" She looks at the fireplace." },
      "Q5": { question: "Did you know someone was going to kill him?", requires_q: "Q4", response: "A long silence. She looks at the fireplace. \"I knew he was in danger.\" Very quietly. \"I decided he was capable of managing his own dangers.\" A pause. \"I was probably right.\"" },
      // TERRACE — SECOND ENCOUNTER
      "Q6": { question: "You said you knew he was in danger.", requires_q: "Q5", response: "\"I said that, yes.\" She looks at the garden. \"I don't retract it.\"" },
      "Q7": { question: "Who else knew?", requires_q: "Q6", response: "\"The people who needed to know.\" She doesn't look at you. \"And possibly one person who didn't.\"" },
      "Q8": { question: "Did you tell the Compact about the Steward?", requires_item: "steward-bond", response: "She looks at you for a long moment. \"I gave them information three months ago. I did not know what they would do with it.\" A pause. \"I'm still not certain I know.\"" },
      "Q9": { question: "Why didn't you warn him?", requires_q: "Q8", response: "\"Because he didn't want to be warned. Edmund knew what was coming. He chose to attend the Rite. He chose to open the Register.\" A pause. \"He wasn't unprepared.\"" },
      // TWO-CHAR ROOM — only available when Baron is present
      "Q10_TWO_CHAR": { question: "What are you protecting him from?", two_char_only: true, response: "She glances at the Baron. He does not look back. \"I am not protecting anyone.\" A pause that lasts too long to be true. \"I am ensuring the correct verdict is the one that gets recorded.\" The Baron's composure goes somewhere it hasn't been this evening." },
      "Q11_TWO_CHAR": { question: "The Curator arranged your husband's investigator.", two_char_only: true, response: "She looks at the garden for a long time. \"Edmund approved the arrangement.\" The Baron sets down his drink. \"The Curator handled the invitation. Edmund handled the name.\" She looks at you. For the first time this evening she is not managing the conversation. She is ending it. \"Find the second name. The rest is already decided.\"" },
      // CROSS-CHARACTER — the most important line in the Estate
      "Q12_CROSS": {
        question: "Dr. Crane says she was told it was for a patient who chose their death.",
        requires_char_q: { char: "crane", q: "Q3" },
        response: "She looks at the garden for a long time. \"Dr. Crane was told the truth.\" Quietly. \"Edmund did choose. He chose the evening, the audience, the moment.\" A pause. \"She is wrong about one thing.\" She turns. The first time she has looked at you directly this evening. \"It was not the patient who gave the instruction. Someone gave it for him. That is what you are looking for.\"",
      },
      "SNAP1": { snap: true, response: "\"If I had killed my husband, I would not still be in this building.\" She holds your gaze a moment longer than necessary. \"Is there something else?\"" },
      "SNAP2": { snap: true, response: "\"I'm not protecting anyone.\" She turns from the garden. \"I stopped doing that eleven years ago.\" She walks toward the door. \"Goodnight.\"" },
      "FINAL": { final: true, response: "She looks at the garden for a long time. \"He was going to say it aloud tonight.\" A pause. \"In a room full of people. With the Register open. With the record binding.\" Another pause. \"I came because I needed to hear him say it out loud so that I would not be the only person in the world who knew it.\" She looks at the garden. \"He didn't.\" A pause. \"I am still the only person in this building who knows what I know.\" She does not look at you when she says this. She is still looking at the garden." },
    },
    deceptions: {
      "estate-flower": { response: "\"The flower was mine.\" Immediately. \"I left it for Edmund this morning. Before any of this.\" A very small pause. \"I didn't know it would end up in evidence.\"", is_effective: true, composure_effect: -5 },
    },
  },

  // ── THE CURATOR ────────────────────────────────────────────
  "curator": {
    display_name: "The Curator",
    room: "archive-path",
    intro: "He has been the Curator for longer than most members have been members.",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 10,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "What happened tonight?", type: "open_narrative", response: "\"Lord Ashworth was found dead at eight-oh-one. The Rite was suspended. The Estate is conducting its own assessment.\" He pauses. \"As are you, apparently.\"" },
      "Q2": { question: "Who found the body?", type: "focused_follow_up", response: "\"Pemberton-Hale. He was standing at the lectern when the other members entered the Ballroom.\" A pause. \"He had gloves on. He mentioned that to me. Unprompted.\"" },
      "Q3": { question: "Did you know this would happen?", type: "focused_follow_up", response: "One beat. \"The Estate has been in a state of structural tension for some time. I monitor structural tension.\" He looks at Archive Case 3. \"I don't always intervene.\"" },
      "Q4": { question: "You arranged for me to investigate.", type: "focused_follow_up", response: "A pause of a different quality. \"The invitation was specific about your name. You are correct that this was not accidental.\" He meets your eyes briefly. \"The investigation required someone with a particular quality of attention.\"" },
      "Q5": { question: "Pemberton-Hale altered the Register entries.", type: "narrative_statement", response: "\"Three entries, yes. The alterations are visible to anyone who examines the ink timing carefully.\" He says it the way you'd describe the weather. \"I noticed at seven forty-two.\" A pause. \"Miss Voss flagged three irregularities in the past six months. I thanked her for her diligence and did not act on them.\" He does not look at you. \"She knows. She is deciding whether to tell you that I know.\"" },
      "Q6": { question: "Why didn't you stop it?", type: "focused_follow_up", response: "A longer pause than any previous question. \"The Estate sometimes requires a crisis to accept information it would otherwise refuse to receive.\" He looks at the Register. \"Lord Ashworth understood this.\"" },
      "Q7": { question: "What do you need from me?", type: "focused_follow_up", response: "\"A name. The correct name. With sufficient evidence that the Estate cannot ignore it.\" He meets your eyes. The first direct look. \"The verdict will do the rest.\"" },
      "Q7b": { question: "Archive Case 3 — you saw who used it.", type: "focused_follow_up", requires_examined: "archive-case-3", response: "He looks at Case 3 before answering. The movement is automatic. \"I saw someone leave the study at seven-oh-five. Moving toward the Ballroom entrance. Not running. Not concealing.\" A pause. \"The pace of someone who had completed something and was moving to the next position.\" Another pause. \"I looked at Case 3 thirty minutes later. The seal was broken. I drew an inference.\" He meets your eyes. \"I should have acted on it. I made a calculation that the Rite would surface the correct answer without my intervention.\" A long pause. \"The Rite did not have the information I thought it had.\"" },
      "Q8b": { question: "What was Ashworth's plan for tonight.", type: "focused_follow_up", requires_q: "Q4", response: "\"He intended to open the Register at the appropriate moment in the Rite — as is conventional — and then read three specific entries aloud.\" He looks at the Register. \"The entries document forty years of Compact-related arrangements that were conducted under a founding agreement the Estate officially ceased to acknowledge forty-three years ago.\" A pause. \"Lord Ashworth had spent six years assembling the documentation. Tonight was the night the Register would be open, all members present, and the reading legally binding.\" Another pause. \"The Surgeon understood that.\" He does not look at Case 3. \"Whatever was placed in Archive Case 3 two months ago was placed there to prevent Lord Ashworth from reaching that moment in the Rite.\"" },
      // CROSS-CHARACTER — only fires after specific conversations elsewhere
      "Q8_CROSS": {
        question: "The Baron said the murder isn't the most interesting question. What is.",
        requires_char_q: { char: "baron", q: "Q4" },
        response: "The first thing approaching satisfaction crosses his face. \"The Baron has always understood the Estate better than the Estate knows.\" A pause. \"The interesting question is why Lord Ashworth convened the Rite tonight. Specifically tonight. When the Register would be open. When all members would be present. When a verdict, if delivered, would be binding.\" He looks at Archive Case 3. \"He chose the conditions. He chose the audience. The murder was not done to him. It was done for him.\"",
      },
      "Q9_CROSS": {
        question: "You sent Greaves a warning note. Why him.",
        requires_char_q: { char: "greaves", q: "Q5" },
        response: "\"Sir Greaves has been in that Library since seven o'clock.\" He straightens a file case. \"He will be in that Library when the verdict is delivered. He will have been there the entire evening. Unimpeachable.\" A pause. \"The Estate's verdict requires a witness who cannot be accused of involvement. I selected the most inconvenient candidate for that role.\" Another pause. \"Lord Ashworth suggested him. Three weeks ago. Before he died.\"",
      },
      "Q10_CROSS": {
        question: "Pemberton-Hale said 'detectable.' He used your word exactly.",
        requires_char_q: { char: "pemberton-hale", q: "Q3" },
        response: "A very long pause. \"I told him the alterations would be detectable at seven forty-two. He had forty minutes.\" He does not look up. \"He left them there.\" Another pause that has weight in it. \"Pemberton-Hale is not protecting himself. He is protecting the record of what he did and why he did it. Those are different things. The Estate will eventually understand the difference.\"",
      },
      "BONUS": { bonus: true, window: "golden_hour", question: "You've been expecting this investigation.", response: "\"I've been expecting an investigator of your particular quality for approximately eight years.\" He allows a pause. \"I'm glad you arrived before the Register was closed. Some evidence has a very narrow window.\"" },
      // ── PIVOT — pair 3: Curator + Voss → bond-reconstruction puzzle ─
      // planning-document (Compact c9) + steward-bond (vault)
      "PQ1": {
        question: "Miss Voss flagged irregularities you chose not to act on.",
        requires_pivot: true,
        requires_char_talked: "voss",
        response: "\"Three of them.\" He does not look away from the archive. \"The third was the most significant. A Bond document in the Vault — the Steward's — carries a second seal that does not belong to this Estate.\" A pause. \"The Compact's planning records will show you who co-signed it. Those records are in the room past the tunnel entrance.\" Another pause. \"The Bond and the planning document together will reconstruct the chain of instruction. That is what Miss Voss saw and what I declined to pursue.\"",
      },
      "SNAP1": { snap: true, response: "\"My involvement in the Estate's affairs is the reason the Estate still has affairs.\" Without anger. \"That is as much as I will say about that.\"" },
      "SNAP2": { snap: true, response: "\"You're asking me to justify a decision I made years before tonight. I've told you the reason. The answer doesn't improve with repetition.\" He looks back to the archive. \"Is there something specific about the evidence I can help you with?\"" },
      "SNAP3": { snap: true, response: "\"The Curator.\" He says it as if it's the only answer that exists. \"It is my title. It is my function. It is, for all practical purposes, my name. Good evening.\"" },
      "FINAL": { final: true, response: "\"The Register was moved to the right lectern.\" Just as you're leaving. \"Lord Ashworth always placed it on the left.\"" },
    },
    deceptions: {
      "barons-incomplete-file": { response: "\"No signatures in that file.\"", is_effective: true, composure_effect: -10 },
    },
  },

  // ── MISS ELEANOR VOSS ──────────────────────────────────────
  "voss": {
    display_name: "Miss Eleanor Voss",
    room: "archive-path",
    intro: "She is at the far end of the archive when you enter. She does not look up immediately. When she does, the look has the quality of someone who has been deciding how much to give you before you arrived.\n\nSix years of records. Everything that passes through this building passes through her. She has been here since before the Rite began. She has been watching since before the Rite began.\n\n\"The archive is a record of what actually happened,\" she says. \"Not what was reported. Those are frequently different things.\"",
    composure: 85,
    composure_state: "normal",
    dialogue_limit: 10,
    snap_limit: 2,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "Who has been in the archive tonight?", response: "\"I've been here all evening.\" A pause. \"And — others. Members come and go.\" She uses the word already. \"I was already here when the first ones arrived.\" She looks at Archive Case 3. \"The Steward passed through at seven-oh-five. He didn't look at the archive.\" A pause. \"He always looks at the archive. He likes to know what's here.\" Another pause. \"He didn't look tonight.\"" },
      "Q2": { question: "Archive Case 3 was accessed tonight.", response: "\"The lock.\" She stops. Starts again. \"Yes. I noticed at approximately seven. I was going to report it.\" She does not say to whom." },
      "Q3": {
        question: "What else have you logged tonight.",
        type: "open_narrative",
        response: "She looks at the shelf. Not at you. \"Everything that happens in this building eventually passes through this room.\" A pause. \"I have been here since seven o'clock. I logged seven individual archive accesses before the Rite began.\" Another pause. \"Not Case 3. The others. Case 1. Case 7. The supplementary correspondence drawer.\" She finally looks at you. \"Six years. I know which members use which files and how often and in what order. Tonight several people used files they had not used before. Or used files they had been using very specifically for months.\" A pause. \"I can tell you what the pattern looks like. The pattern is more informative than any single entry.\""
      },
      "VD_PH": {
        question: "What do you know about Pemberton-Hale and the Register.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"The Register alterations span eight years.\" She says it without drama. \"Eight years of careful amendments — each one defensible in isolation, each one made at the same time of year, each one touching the same category of document.\" A pause. \"I track patterns. That is what I do here.\" She looks at the archive shelf. \"Three entries in the past fourteen months reference a channel the Estate has not formally acknowledged. The same channel appears in the Compact's supplementary records. The same dates.\" Another pause. \"The Viscount did not alter the Register because he is careless. He altered it because the record was closing around something and he needed room.\" She looks at you. \"A man who alters a record that carefully, for that long, has been afraid of something specific for that long. The Register is not the motive. The Register is the evidence that the motive exists.\""
      },
      "VD_CR": {
        question: "What do you know about Dr. Crane and the archive.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Dr. Crane has accessed this archive eleven times in the past six months.\" A pause. \"Not Case 3. The medical supplementary files. Case 7.\" She does not look at you yet. \"Case 7 contains the Estate's documented health histories. Senior members only. Lord Ashworth's file is in Case 7.\" Another pause. \"Eleven visits. I logged each one. The most recent was three weeks ago.\" She looks at you now. \"A physician who visits a patient's archived health history eleven times in six months is either extremely thorough or is documenting a specific window.\" She looks back at the shelf. \"The last visit was twenty-three days before tonight. The entry she examined most closely on each visit was the railing assessment — who occupied which positions at the balcony level during formal Rite events.\""
      },
      "VD_BA": {
        question: "What do you know about the Baron's arrangement.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Three years of correspondence routed through an Estate channel that does not belong to the Estate.\" She says it precisely. \"Letters arriving as inter-institutional transfer documents. Filed correctly. Logged correctly. But the originating seal does not match any registered institution.\" A pause. \"I noticed it in year one. I documented it.\" Another pause. \"The correspondence stopped three months ago. Abruptly. Mid-conversation, from the content of the last letter.\" She looks at the archive. \"A man who stops a three-year correspondence abruptly has either concluded his business or been asked to stop. The Baron's drink has been untouched all evening. That is not a man who concluded his business.\" A pause. \"I know what frightened him. The last letter he received asked for something more specific than anything in the three years before it.\""
      },
      "VD_ST": {
        question: "The Steward signed something eight years ago.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"I have the Bond on record.\" She says it. Not quickly — the weight of someone who has been holding this for a long time. \"Not the Estate version. The other version.\" A pause. \"Eight years ago a document passed through this archive as a witness form. Standard property arrangement. The countersigning seal was — close enough to Estate format to pass.\" Another pause. \"It was not Estate format. I noticed fourteen months later when I cross-referenced it against the authentication register.\" She looks at the archive. \"I documented the discrepancy. I filed it. The Curator thanked me for my diligence.\" A pause. \"He thanked me using the exact phrase the Steward used when he passed this archive at seven-oh-five without looking. Fourteen years of looking and tonight he did not look. A man who has been given permission not to look.\"",
        grants_node: "voss_steward_bond_documented"
      },
      "VD_AS": {
        question: "Lady Ashworth has been here before tonight.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Once.\" She says it precisely. \"Seven weeks ago. She came to the archive at four in the afternoon on a Tuesday. She asked to examine the supplementary correspondence files — specifically the category that covers inter-organisational contact.\" A pause. \"I showed her what we hold in that category. She did not take anything. She read for forty minutes.\" Another pause. \"Before she left she asked me a question I have been thinking about since eight-oh-one tonight.\" She looks at you. \"She asked: if a document is assembled from correspondence in this archive and correspondence from outside this building — whose record does it belong to?\" A pause. \"I told her: whoever assembles it.\" She is quiet for a moment. \"She said: good. That's what I thought.\" She did not explain what she was assembling. She did not need to.\"",
        grants_node: "voss_ashworth_visited_archive"
      },
      "VD_NO": {
        question: "Northcott and the seven-oh-three entry.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Lord Ashworth briefed me about the arrival record three weeks ago.\" She says it. The first time she has used Lord Ashworth's name without some distance around it. \"He said a specific person would arrive through the garden entrance before the assembly and that the arrival would be logged in the foyer book. He said the arrival time was the most important single fact I would observe this evening.\" A pause. \"He did not tell me who was arriving. He told me to trust whatever was in the notebook.\" Another pause. \"I was in the east corridor at seven-oh-two. I saw a figure enter through the garden. I noted the time. I went back to the archive.\" She looks at you. \"Lord Ashworth arranged to have an unimpeachable record of that arrival kept by a man who could not be accused of involvement.\" A pause. \"And arranged for me to be a second witness who nobody thought to ask.\""
      },
      // ── PIVOT — pair 3: Voss + Curator → bond-reconstruction puzzle ─
      // planning-document (Compact c9) + steward-bond (vault)
      "PQ1": {
        question: "The Curator knew about the irregularities and didn't act.",
        requires_pivot: true,
        requires_char_talked: "curator",
        response: "\"He knew.\" She says it without bitterness. Just fact. \"The Steward's Bond in the Vault — it has two seals. The second one isn't Estate. I documented it eight months ago.\" A pause. \"The Curator thanked me for my diligence.\" She looks at the archive door. \"If you find the Bond and take it to the Compact — there's a planning document in their records that carries the same second seal. Those two documents together are the chain of instruction.\"",
      },
      "SNAP1": { snap: true, response: "\"Because the last person who reported something unusual about a senior member left the Estate within the week.\" Quickly, like something she's been wanting to say for six years." },
      "SNAP2": { snap: true, response: "\"If something happens to me, what I documented is in Case 1. Behind the Ashworth file. The Curator knows where to look.\" She looks at the archive door. \"I'd rather you go now.\"" },
      "FINAL": { final: true, response: "\"The archive records what happened.\" She says it as you leave. \"Not what was reported. Not what was agreed.\" A pause. \"What happened.\"" },
    },
    deceptions: {
      "debt-record":            { response: "\"That file has been accessed three times in the past year. Twice by the Viscount. Once by someone using his credentials.\" She looks at it. \"The second and third visits were on the same evening. He was checking whether something had been added.\"", is_effective: true, composure_effect: -10 },
      "appointment-book":       { response: "\"Dr. Crane's appointment record.\" She says it without touching it. \"Cross-reference it against the Case 7 access log. The visits align within forty-eight hours of each other. Every time.\"", is_effective: true, composure_effect: -10 },
      "smoking-letters":        { response: "\"I have the routing records for those letters.\" A pause. \"They came through an Estate channel that does not belong to the Estate. I noticed the channel's originating seal in year one — it does not correspond to any registered institution. I have been waiting for someone to bring me the letters.\"", is_effective: true, composure_effect: -12 },
      "steward-bond":           { response: "She is very still. \"Where did you find that.\"\ A pause. Not performed — the stillness of someone who has been waiting for that object to surface. \"The second seal on the margin. Match it against the bearer's seal in the delivery record from six months ago. Same operational channel.\"\ She does not say what channel.", is_effective: true, composure_effect: -20 },
      "northcott-notebook":     { response: "\"The seven-oh-three entry.\" She says it immediately. \"I was in the east corridor at seven-oh-two. What is in that notebook and what I observed are the same event seen from two positions.\" A pause. \"Between them they make a record that cannot be argued with.\"", is_effective: true, composure_effect: -8 },
    },
  },

  // ── VISCOUNT PEMBERTON-HALE ────────────────────────────────
  "pemberton-hale": {
    display_name: "Viscount Pemberton-Hale",
    room: "antechamber",
    intro: "",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 12,
    snap_limit: 3,
    snap_count: 0,
    required_deception_used: false,

    opening: {
      question: "Tell me who you are and what you're doing here tonight.",
      response: "\"Viscount Pemberton-Hale. Senior member of the Estate. I sit on three of the standing committees — the Bond Review, the Archive Oversight, and the Rite Preparation.\" A pause — not long, not managed. The first pause that costs nothing. \"My family has been in the Society for four generations. I have been a member in my own right for some years. I know the Estate well. I know its records, its protocols, its members.\" He adjusts his right cuff. Once. Carefully. \"I was in the Ballroom when Lord Ashworth collapsed. Among the assembled members. As were all of us.\" He looks at you directly. The look has been prepared. \"I have been here since the early evening. I arrived before the Rite was called. I had business to attend to before the assembly.\" A pause slightly longer than the first. \"I imagine that is the kind of detail you will need.\"",
      callum: "He named his committees before I asked for them. The Bond Review is one of three. That's the Register. That's the record. That's the business he won't name.\n\nHe said Lord Ashworth's name once. Clinically. Then moved past it. A man who has known someone for years and watched them die tonight does not move past their name that quickly unless the name costs something.\n\nHe said he knows the Estate's members. He said it the way a man says it who has been watching them. What he has seen tonight he has not offered.",
    },

    lines: {
      register: { text: "Walk me through your evening. From arrival to now." },
      ashworth: { text: "Tell me about your history with Lord Ashworth." },
      others:   { text: "Who in this building knows more than they've said tonight." },
    },

    others_techniques: {
      wait:     { callum_question: "Say nothing.", response: "He is quiet for a moment. Not the managed quiet. Something that costs him something small to give.\n\n\"Sir Aldous Greaves. He has been in that Library since the assembly began. A retired professor. A chess master. A man who sees the full board before he moves.\" A pause. \"He has not moved tonight. I find that interesting.\"\n\n\"The Baron has been in the Smoking Room. He had debts. Lord Ashworth knew about them. Tonight the man who knew is dead.\" A pause. \"Draw your own conclusion.\"\n\n\"Dr. Crane was Lord Ashworth's personal physician. A personal physician knows things that do not get spoken in rooms like this.\" He looks at the writing case. \"I would want to know what she knew.\"\n\n\"The Surgeon and Lord Ashworth had a dispute. Years ago. The kind that does not resolve — it simply stops being spoken about.\" A pause. \"Those are the disputes worth asking about.\"\n\n\"Lady Ashworth.\" A pause longer than the others. \"They were estranged. Whatever happened between them — it happened some time ago and it did not resolve. She has been carrying it all evening.\" He stops. \"She is still carrying it.\"\n\n\"Mr. Northcott broke a rule of the house. Lord Ashworth was aware of it. The rule concerns the staff.\" He does not elaborate.\n\n\"The Steward has been in this building for fourteen years. Something happened here fourteen years ago. I do not know what. I know the Steward knows. And I know he has been waiting a very long time for tonight.\" He looks at you directly. \"That is all I will say about the Steward.\"\n\nHe stops. Seven names. He adjusts his cuff once. Carefully.", callum: "Seven names. Seven reasons. He did not hesitate on any of them. A man who has been sitting in this room since eight o'clock has had time to prepare a list.", composure: 0 },
      account:  { callum_question: "\"Walk me through the people in this building tonight.\"", response: "He considers the question as if it is the first reasonable one he has been asked all evening.\n\n\"Sir Aldous Greaves. Library. Has been there since before the Rite. A chess master — retired professor. A man of that kind sees everything and says only what he decides to say.\"\n\n\"The Baron. Smoking Room. He owed Lord Ashworth a reckoning of some kind. I do not know the specifics. I know the shape of a man who has been waiting for something to be over.\"\n\n\"Dr. Crane. Lord Ashworth's personal physician. The relationship between a physician and a patient of thirty years is not a professional relationship. It becomes something else. I would want to understand what that something else was.\"\n\n\"The Surgeon.\" A pause. \"A dispute. Old. The kind men carry because they have decided not to put it down.\"\n\n\"Lady Ashworth. Estranged from her husband for some time. Tonight she watched him die. I cannot tell you what that costs a woman in her position. I suspect it costs more than it should.\"\n\n\"Mr. Northcott.\" He is careful here. \"He broke a rule of the house. The rule is clear. Lord Ashworth was aware of the breach. The breach concerns someone on the staff.\"\n\n\"The Steward. Fourteen years of something the Estate decided not to record. I was not here when it happened. I know enough to know it happened.\" He looks at his hands. \"That is the list.\"", callum: "Seven names. Seven reasons. He gave them in the order he decided on — not the order they occurred to him. That sequence was prepared.", composure: 0 },
      approach: { callum_question: "\"You know everyone in this building.\"", response: "\"I know their standing. Their history with the Estate. What they owe and what they are owed.\" A pause. \"That is not the same as knowing them.\"\n\nHe looks at the window.\n\n\"Greaves has been in the Library since seven. He is a chess master — he thinks in long sequences. He does not sit still unless he is working through something.\"\n\n\"The Baron's debts were not a secret to anyone who paid attention. Lord Ashworth paid attention to everything.\"\n\n\"Dr. Crane has been Ashworth's physician for thirty years. Thirty years is a long time to know someone's body and not know anything else about them. I do not believe she knew only his body.\"\n\n\"The Surgeon carried something from an old dispute. I noticed it years ago. A man does not carry something that long unless it matters to him.\"\n\n\"Lady Ashworth and Lord Ashworth had been estranged for some time. The Estate noticed. No one said anything because no one says anything in a place like this.\"\n\n\"Northcott.\" He adjusts his cuff. \"The rule he broke concerns Vivienne. I will not say more than that.\"\n\n\"The Steward has been here fourteen years. Something happened in year one that the Estate sealed. He has been here ever since.\" A pause. \"Men who stay in rooms where something was sealed stay for a reason.\"", callum: "He named Vivienne. He didn't have to. That was a choice.", composure: 0 },
      pressure: { callum_question: "\"Who had reason to want Lord Ashworth dead.\"", response: "The stillness again. Shorter this time.\n\n\"That is a different question from the one you were asked to ask.\"\n\nA pause.\n\n\"Greaves owed him a debt of fairness. Debts of fairness are the hardest kind — you can never fully repay them and they never fully expire.\"\n\n\"The Baron owed him something less honourable. That kind of debt has a different relationship with death.\"\n\n\"Dr. Crane. I won't speculate on her reasons. I will say that a personal physician who has been in that role for thirty years accumulates a particular kind of knowledge. Knowledge can become obligation. Obligation can become motive.\"\n\n\"The Surgeon. Ask him about the licensing board. Ask him what Lord Ashworth signed thirty years ago.\"\n\n\"Lady Ashworth. An estranged wife at a formal Estate proceeding. Whatever drove the estrangement did not stay between them.\"\n\n\"Northcott was told to be here tonight. He did not choose to come. Someone chose for him and he did not ask why for six weeks.\"\n\n\"The Steward.\" A pause. \"I have said what I will say about the Steward.\"\n\nHe looks at you.\n\n\"You asked who had reason. Everyone in this building had reason. That is what I have been sitting here thinking about since eight o'clock.\"", callum: "He told me to ask the Surgeon about the licensing board. He named a specific thing. That was not surface information. That was something he decided to give.", composure: -8 },
    },

    line_techniques: {
      register: {
        wait:     { callum_question: "Say nothing. See what he fills it with.", response: "The silence sits. He lets it sit with him — not uncomfortable, not reaching to fill it. He has been in rooms where silence is used as a tool before. He knows what this is.\n\nThen: \"The Register is the Estate's permanent record. Whatever is entered tonight becomes part of its history.\" A pause. \"Lord Ashworth intended to open it at eight. He did not reach eight.\" He looks at the writing case. Not at you. \"The entries for this evening were prepared in advance. As they always are. The preparation is a matter of record.\"\n\nHe stops there. The silence returns. He gives it back to you.", callum: "He answered the Register question with the Register's definition. A man who knows what the Register contains does not explain what it is unless he is deciding what not to say about it.", composure: 0 },
        account:  { callum_question: "\"Walk me through the Register entries. Your involvement with them.\"", response: "He nods once. The nod of a man who has been waiting for a reasonable question.\n\n\"The Register contains the Estate's formal record of Bond provisions, member standings, and transfer arrangements. Entries are prepared in advance of the Rite and reviewed by the relevant committees before submission.\" A pause. \"I sit on the Bond Review committee. I have reviewed my own entries, as is standard practice, and confirmed they reflect my current standing.\" Another pause — shorter. \"There were adjustments made over the years. Administrative. The kind of thing any senior member attends to.\"\n\nHe stops. He has given you a sequence. He chose the order.", callum: "He called years of Register alterations administrative. He buried it in the middle of a sequence between committee procedure and his current standing. The middle is where you put the thing you want to pass through unnoticed.", composure: 0 },
        approach: { callum_question: "\"You amended one entry. Recently, I'm told.\"", response: "He looks at you for a moment. The look recalibrates.\n\n\"One entry.\" He says it precisely. \"There were several entries adjusted over a period of years. Not one. Not recently.\" A pause — the pause of a man correcting a record, not defending himself. \"Incremental amendments. Each reviewed by the committee. Each within the standing provisions of the Bond.\" He looks at the writing case. \"I would not want you working from an inaccurate account.\"", callum: "He corrected me on both counts — the number and the timing. He did it with the precision of a man who has been holding the accurate version all evening, waiting for someone to give him a reason to use it. He wanted to correct me. The correction was the answer.", composure: 0 },
        pressure: { callum_question: "\"You altered the Register. Years of it. Tell me what you were hiding.\"", response: "Something in him goes very still. Not surprise — he has been waiting for this question. The stillness is the thing he prepared for it.\n\n\"I altered entries within the standing provisions of the Bond. That is not hiding something. That is attending to one's records.\" The sentences are shorter now. Precise. \"Incremental amendments, each within the committee's purview, each reviewed. Nothing was concealed. Everything was documented.\" He looks at you directly. \"If you have a specific entry you would like to discuss, I am happy to discuss it. A general accusation of concealment is not something I can address usefully.\"\n\nHe waits. The warmth is gone. What remains is very careful and very still.", callum: "He didn't close. He redirected — asked me to be specific. A man with something to hide asks for specifics because specifics are manageable. Generals are not. He wants to know exactly what I have before he decides what to give.", composure: -8 },
      },
      ashworth: {
        wait:     { callum_question: "Say nothing. Let Ashworth's name sit between them.", response: "He looks at you. Then at the window. Then back.\n\n\"Lord Ashworth was the presiding authority of the Estate for thirty-one years.\" A pause. \"He was precise. He was consistent. He understood the Bond better than any member I have encountered.\" Another pause — longer. \"He was not a man who invited familiarity. I did not offer it. We understood each other within those terms.\" He looks at the writing case. \"He was effective. That is the accurate word.\"\n\nHe stops. He has given you an obituary. Nothing personal is in it.", callum: "He described a man he has known for years with the language of a professional assessment. Precise. Consistent. Effective. Not one word that costs him anything. A man who has decided in advance what he is willing to feel about someone's death speaks in those terms.", composure: 0 },
        account:  { callum_question: "\"How long had you known him.\"", response: "He considers the question. Not because he doesn't know the answer.\n\n\"I joined the Estate some years ago. Lord Ashworth was presiding authority at that time. He conducted my membership review.\" A pause. \"He was thorough. He asked questions other reviewing authorities did not ask. I remember thinking he was looking for something specific.\" Another pause. \"I never established what it was.\" He looks at the window. \"We had a working relationship after that. Formal. Correct. He understood the Bond. I understood the Bond. We operated within that shared understanding.\"\n\nHe stops. He has given you duration without depth. Length without warmth.", callum: "He said he never established what Ashworth was looking for during the membership review. He said it as a fact. A man who has spent years in an institution with someone who reviewed him looking for something specific and never found out what it was has been wondering about it ever since.", composure: 0 },
        approach: { callum_question: "\"You knew him well.\"", response: "He looks at you for a moment. The correction arrives precisely.\n\n\"I knew him within the context of the Estate and the Bond. That is a specific kind of knowing.\" A pause. \"Lord Ashworth did not encourage broader acquaintance. He maintained a clear distinction between institutional relationships and personal ones. I respected that distinction.\" He looks at the writing case. \"I understood how he operated. I understood his priorities. Whether that constitutes knowing him well depends on what you mean by well.\"\n\nHe stops. He has corrected the frame without stepping into a different one.", callum: "He corrected me on the word well and then declined to define what word he would have used instead. A man who is precise about what he did and didn't know about someone is a man who has thought carefully about what he's willing to claim.", composure: 0 },
        pressure: { callum_question: "\"Don't tell me about his role. Tell me about the man.\"", response: "Something shifts. Not much. Enough.\n\n\"The man.\" He says it as if he is hearing the word for the first time tonight. \"Lord Ashworth was — certain. About everything. In thirty-one years I never saw him uncertain about a decision he had made. Whether those decisions were correct was a separate matter.\" A pause. \"He was not unkind. He was indifferent. There is a difference and he understood it.\" He looks at you directly. \"He was the kind of man who could do significant damage to another person's life and genuinely believe he had acted correctly. That is not cruelty. That is something harder to argue with.\" Another pause. \"I found it difficult to argue with him.\"", callum: "He just described a man he found it difficult to argue with, who could damage someone's life and believe he acted correctly. He described him without anger. That is either exceptional composure or a man who has finished being angry and moved somewhere past it.", composure: -8 },
      },
    },

    followups: {
      register: {
        wait: [
          { id: "RW1", text: "The entries for this evening. What were they.", response: "A pause. Shorter than the previous ones. \"The entries reflect the current standing of each member's Bond provisions. Transfer arrangements. Immunity clauses where applicable.\" He looks at the writing case. \"Lord Ashworth's entry was the significant one this evening. The Register opening was called for that purpose.\" Another pause. \"My own entries are routine. They have been reviewed. They are in order.\"", callum: "He named his own entries before I asked about them. Routine. In order. A man who volunteers the health of his own records in response to a question about someone else's has been waiting to say it.", flag: "hale_register_on_record" },
          { id: "RW2", text: "Prepared in advance. By whom.", response: "\"The relevant committee members prepare their own entries. I prepared mine.\" A pause. \"The Curator reviews for form. He does not alter content.\" He looks at you. \"The preparation is standard. It has always been standard. There is nothing irregular about the process. I confirmed my entries with the Curator at seven forty-two. Standard procedural review.\" A pause slightly longer than the others. \"The entries themselves are another matter.\"\n\nHe stops. He did not intend to say that last sentence.", callum: "Seven forty-two. He placed himself with the Curator at seven forty-two — before the assembly, before the murder. Standard procedural review. That is his account of that conversation. It may not be the Curator's.", flag: "hale_register_on_record", pencil_flash: true, pencil_node: "ph_false_standard_amendments" },
        ],
        account: [
          { id: "RA1", text: "Administrative. What specifically were you adjusting.", response: "A pause. He was expecting this question.\n\n\"Bond provisions contain clauses that require periodic review. Transfer arrangements. Beneficiary designations. Immunity provisions where applicable.\" He looks at the writing case. \"I reviewed mine and made adjustments that reflected my current circumstances. The adjustments were within the standing provisions of the Bond. They were reviewed by the committee. They were accepted.\" Another pause. \"I am not the only member who has made such adjustments. I am simply the member whose adjustments are being discussed this evening.\"", callum: "He named immunity provisions and then moved past them in the same breath. The word immunity in a room where a man has just died is not an administrative detail. He knows that. He said it anyway because not saying it would have been worse.", flag: "hale_register_on_record" },
          { id: "RA2", text: "Your current standing. What does that mean.", response: "He looks at you for a moment. The question is simpler than he expected.\n\n\"My standing within the Estate reflects my membership in good order. My Bond provisions are current. My committee positions are active. My obligations have been met.\" A pause. \"Lord Ashworth had the authority, under certain Bond clauses, to review and — under specific circumstances — redirect the provisions of senior members.\" He looks at the writing case. \"My adjustments ensured that any such review would find my provisions in order. That is what current standing means.\"\n\nHe stops. He has said more than he intended. Less than he knows.", callum: "He just told me Ashworth had authority over his provisions. He told me without being asked. He is trying to get ahead of something. A man who volunteers the existence of a threat is a man who knows the threat is coming out anyway.", flag: "hale_register_on_record" },
        ],
        approach: [
          { id: "AP1", text: "Years of amendments. What started it.", response: "He is still for a moment.\n\n\"The Bond underwent a significant revision some years ago. The revision introduced new clauses governing member provisions — transfer arrangements, immunity designations, beneficiary structures.\" A pause. \"I reviewed my existing provisions against the new clauses and identified areas that required updating. I began the process of amendment at that time.\" He looks at the window. \"The revision affected all senior members. I was among the first to attend to it.\"\n\nHe stops. He has placed himself as diligent, not desperate. The distinction matters to him.", callum: "He said he was among the first to attend to it. A man who is among the first to add an immunity clause either anticipated something specific or was watching someone specific. Both possibilities sit in that sentence.", flag: "hale_register_on_record" },
          { id: "AP2", text: "Within the standing provisions. What provisions specifically.", response: "\"The standing provisions of the Bond govern the rights and obligations of senior members in matters of property, succession, and institutional standing.\" He says it with the fluency of a man who has read the document many times. \"The immunity provisions specifically address the rights of members to protection from unilateral action by the presiding authority — in this case, Lord Ashworth — in matters affecting their personal provisions.\" A pause. \"The clause exists because the Bond has historically allowed the presiding authority considerable latitude. The immunity designation limits that latitude in specific circumstances.\"\n\nHe stops. He looks at you.\n\n\"I added the immunity clause eighteen months ago. That is the entry you are interested in.\"", callum: "He named the entry himself. Eighteen months ago. He has been waiting to say it in exactly this way — as a disclosure, not a confession. A man who controls when and how he reveals something has been rehearsing the reveal. The rehearsal is the tell.", flag: "hale_register_on_record" },
        ],
        pressure: [
          { id: "PP1", text: "The immunity clause. Eighteen months ago.", response: "The stillness holds for a moment longer than is comfortable.\n\n\"The immunity clause was added eighteen months ago. It designates my Bond provisions as protected from unilateral review or redirection by the presiding authority.\" A pause. \"Lord Ashworth had exercised similar authority against another member three years prior. I observed the outcome of that exercise.\" He looks at the writing case. \"The clause is a precaution. It exists within the standing provisions of the Bond. It was reviewed and accepted by the committee.\" Another pause — shorter. \"I would have preferred not to need it.\"", callum: "He said he would have preferred not to need it. Past tense. A man who added a protection clause eighteen months ago and is now sitting in a room where the threat that clause protected against is dead has just told me exactly how long he has been afraid.", flag: "hale_register_on_record" },
          { id: "PP2", text: "Nothing was concealed. Then why the clause.", response: "A pause. He recalibrates.\n\n\"The clause does not exist because something was concealed. It exists because something was possible.\" He says it with the precision of a man who has rehearsed the distinction. \"Lord Ashworth had authority. Authority exercised without warning against a senior member three years ago. I chose to limit his authority over my provisions specifically. That is not concealment. That is protection.\" He looks at you directly. \"I understand how it appears. I have understood that since I filed the amendment.\"\n\nHe stops. The last sentence cost him something.", callum: "He has understood how it appears since he filed the amendment. The answer is too clean. Clean answers from frightened men are rehearsed answers.", flag: "hale_register_on_record" },
        ],
      },
      ashworth: {
        wait: [
          { id: "AW1", text: "Understood each other. What does that mean.", response: "\"It means we had a working relationship defined by the provisions of the Bond and the committee structures of the Estate.\" A pause. \"He reviewed my work. I complied with his authority. There were no disputes that went unresolved.\" He looks at you. \"We were not friends. I do not believe Lord Ashworth had friends in the institutional sense. He had allies and he had members. I was a member.\"\n\nHe stops. He said we were not friends with the particular care of a man drawing a line he has drawn before.", callum: "He told me they were not friends before I asked. Nobody volunteers the absence of something unless they've been asked about it before — or expect to be.", flag: "hale_ashworth_on_record" },
          { id: "AW2", text: "Effective. At what.", response: "\"At administering the Estate. At maintaining the Bond's provisions across a membership that does not always agree with how those provisions are applied.\" A pause. \"Lord Ashworth made decisions that were unpopular. He made them anyway. That is what effectiveness looks like in an institution of this kind.\" He looks at the writing case. \"I did not always agree with his decisions. I respected that he made them without hesitation.\"\n\nHe stops. The last sentence arrived with something underneath it.", callum: "He said he did not always agree. He said it quietly and then stopped. A man who has spent years not agreeing with someone who had authority over him has been keeping a running count. Tonight the count closed.", flag: "hale_ashworth_on_record" },
        ],
        account: [
          { id: "AA1", text: "The membership review. What did he ask.", response: "\"He asked standard questions. Committee history, attendance, obligations.\" A pause. \"He asked one question that was not standard. I answered it. He wrote something down.\" He looks at the window. \"He did not show me what he wrote.\"", callum: "He remembers one specific non-standard question from a membership review that happened years ago. He won't say what the question was. A man who carries one question that long has been living inside the answer.", flag: "hale_ashworth_on_record" },
          { id: "AA2", text: "Formal. Correct. Did that ever change.", response: "A pause.\n\n\"Once.\" He says it without elaborating immediately. Then: \"Three years ago Lord Ashworth exercised a provision of the Bond against a fellow member. The provision allowed him to redirect that member's estate arrangements in accordance with the Bond's senior authority clauses.\" He looks at the window. \"It was legal. It was within his authority. The member had no recourse.\" Another pause. \"After that I paid closer attention to my own standing within the Bond.\" He looks at you. \"That is when things changed.\"", callum: "He watched Ashworth do it to someone else and spent three years making sure it couldn't happen to him. He has been afraid of this man for a long time.", flag: "hale_ashworth_on_record" },
        ],
        approach: [
          { id: "AR1", text: "His priorities. What were they.", response: "\"The Bond. The Estate's continuity. The authority of the presiding office.\" He says it without hesitation. \"Lord Ashworth believed the Bond was the thing that held the institution together. He believed the presiding authority was the thing that held the Bond together. He did not separate those beliefs from himself.\" A pause. \"He was the office. He had been the office for thirty-one years. I am not certain he remembered a version of himself that wasn't.\" He looks at the window. \"That kind of tenure changes a man. Or perhaps it reveals him.\"", callum: "He said he's not certain Ashworth remembered a version of himself that wasn't the office. That's an observation that required close attention to arrive at. A man who observed Ashworth that carefully was watching him for a reason.", flag: "hale_ashworth_on_record" },
          { id: "AR2", text: "You respected the distinction. Did he.", response: "A pause — the first pause on this line that costs something.\n\n\"Lord Ashworth respected the distinctions he drew. He was consistent in that.\" A pause. \"Whether he respected the distinctions others drew — that is a different question.\" He looks at the writing case. \"He had authority. He was aware of it at all times. Men who are aware of their authority at all times do not always notice when they have crossed a line that someone else has drawn.\" Another pause. \"I noticed. I kept my own record.\"\n\nHe stops. He did not intend to say that last part.", callum: "He kept his own record. That came out before he caught it. A man who has been keeping a private record of a powerful man's boundary crossings has been building something.", flag: "hale_ashworth_on_record" },
        ],
        pressure: [
          { id: "AP_A1", text: "Significant damage. To whom.", response: "He looks at you. He knows he said it.\n\n\"To Harwick. A member of some years' standing.\" A pause. \"Lord Ashworth exercised the senior authority clause against Harwick's estate provisions three years ago. Harwick had no recourse. The Bond permitted it.\" He looks at the writing case. \"I do not know what became of him. I chose not to find out. Finding out would have required me to think about it more than I wished to.\"\n\nHe stops. He has been thinking about it anyway.", callum: "He said he chose not to find out and then told me everything about what happened to Harwick. A man who chose not to think about something knows everything about it.", flag: "hale_ashworth_on_record" },
          { id: "AP_A2", text: "Something harder to argue with. What does that mean.", response: "\"It means that cruelty can be contested. Indifference cannot.\" A pause. \"If Lord Ashworth had been cruel I could have brought it to the committee. I could have named it. I could have built a case.\" He looks at the window. \"Instead he was correct. He was within his authority. He was consistent with precedent.\" Another pause. \"There is no case to bring against a man who operates within the rules while making those rules intolerable. You can only protect yourself.\" He looks at you. \"Which is what I did.\"", callum: "He said there is no case to bring against a man who operates within the rules while making those rules intolerable. The immunity clause was the result of failing to find one.", flag: "hale_ashworth_on_record" },
        ],
      },
    },

    // ── GATE 1 — THE LETTER ───────────────────────────────────────
    gates: {
      gate1: {
        requires_flag: "hale_register_on_record",
        requires_item: "unsigned-letter",
        question: "You wrote this letter.",
        slip: true,
        response: "\"That's impossible. I wrote it without —\" He stops. Complete stop. He looks at the letter. Then at you. One second with his eyes closed.",
        grants: "ph_altered_register_for_clause_not_self",
      },
    },

    // ── GATE TECHNIQUES (5) ───────────────────────────────────────
    gate_techniques: {
      gate1: {
        record:   { kind: "success", optimal: true,  composure: -22, response: "[ Gate 1 Record — pending ]",   callum: "" },
        approach: { kind: "success",                  composure: -16, response: "[ Gate 1 Approach — pending ]", callum: "" },
        account:  { kind: "success",                  composure: -16, response: "[ Gate 1 Account — pending ]",  callum: "" },
        wait:     { kind: "failure",                  composure: -8,  response: "[ Gate 1 Wait — pending ]",     callum: "" },
        pressure: { kind: "failure",                  composure: -10, response: "[ Gate 1 Pressure — pending ]", callum: "" },
      },
    },

    // ── DIVERSION (one per gate failure technique) ────────────────
    diversions: {
      gate1_wait: [
        { id: "DW1", text: "[ Diversion Q1 — pending ]", response: "[ pending ]" },
        { id: "DW2", text: "[ Diversion Q2 — pending ]", response: "[ pending ]" },
        { id: "DW3", text: "[ Diversion Q3 — pending ]", response: "[ pending ]" },
      ],
      gate1_pressure: [
        { id: "DP1", text: "[ Diversion Q1 — pending ]", response: "[ pending ]" },
        { id: "DP2", text: "[ Diversion Q2 — pending ]", response: "[ pending ]" },
        { id: "DP3", text: "[ Diversion Q3 — pending ]", response: "[ pending ]" },
      ],
    },

    // ── SNAP RESPONSES ────────────────────────────────────────────
    snaps: {
      "SNAP1": { snap: true, response: "\"I've addressed the Steward's role in this evening. I won't revisit it.\" Precision. Not anger." },
      "SNAP2": { snap: true, response: "\"You're welcome to examine the combination records with the Curator. I believe he maintains them.\" He turns toward the mirror." },
      "SNAP3": { snap: true, response: "\"Lord Ashworth died of a matter internal to the Estate.\" Like a prepared statement. \"I'd be cautious about accusations without evidence.\" He looks at you directly for the first time. \"The Estate judges that kind of carelessness.\"" },
    },

    // ── FINAL ─────────────────────────────────────────────────────
    final: { response: "\"I'd like to speak to the Curator.\" Quietly. Not panicked." },

    // ── DECEPTIONS ───────────────────────────────────────────────
    deceptions: {
      "unsigned-letter": { response: "\"That letter isn't about me.\"", is_effective: true, composure_effect: -25, required: true },
    },
  },

  // ── SIR ALDOUS GREAVES ─────────────────────────────────────
  "greaves": {
    display_name: "Sir Aldous Greaves",
    room: "library",
    intro: "",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 7,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      // Branch A — GA1 → GA2 → GA3
      // Branch B — GB1 → GB2 → GB3 (cross-character gated)
      // GB3 = greaves_maskless_witness
      // Content to be built as investigation progresses
      "SNAP1": { snap: true, response: "[ Greaves snap 1 — pending ]" },
      "SNAP2": { snap: true, response: "[ Greaves snap 2 — pending ]" },
      "SNAP3": { snap: true, response: "[ Greaves snap 3 — pending ]" },
      "FINAL": { final: true, response: "[ Greaves final — pending ]" },
    },
    deceptions: {},
  },

  // ── THE BARON ──────────────────────────────────────────────
  "baron": {
    display_name: "The Baron",
    room: "smoking",
    intro: "He has been the Compact's source inside the Estate for three years.",
    composure: 80,
    composure_state: "normal",
    dialogue_limit: 8,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "You refused the Duke's Claim eight times.", type: "open_narrative", response: "\"Eight times publicly. I would have refused a ninth.\" No hesitation. No explanation." },
      "Q2": { question: "What leverage did you hold over him?", type: "focused_follow_up", requires_q: "Q1", response: "A long pause. \"Everyone here holds something. That's what the Estate is for.\" He looks at the untouched drink." },
      "Q3": { question: "Did you kill him?", type: "focused_follow_up", response: "\"No.\" A pause. \"I didn't need to.\" He looks at the ashtray. \"Crane came to see me at seven-fifteen.\" He looks at the untouched drink. \"She didn't say what she wanted. She sat for twelve minutes and then said she needed to think about something.\" He pauses. \"I've been thinking about that twelve minutes since.\"" },
      "Q4": { question: "Who did?", type: "focused_follow_up", requires_q: "Q3", response: "He picks up the drink. Puts it down. \"I don't name people.\" A pause. \"But I'll tell you this — it's not the most interesting question.\"" },
      "Q4b": { question: "You saw someone at seven-oh-five.", type: "focused_follow_up", requires_q: "Q3", response: "He looks at the ashtray. The cigarette is still unfinished. \"I was near the study window. Seven-oh-five.\" A pause. \"Someone left the study walking in the direction of the east service corridor.\" He does not look at you. \"I noted it. I noted it the way you note things when you have been paying attention to the wrong things for three years.\" Another pause. \"I picked up the drink. I put it down. I decided I'd been useful enough for one evening.\"" },
      "Q5": { question: "You were going to warn him tonight.", type: "focused_follow_up", requires_item: "ashtray", response: "A longer silence. \"I considered it.\" He looks at the ashtray. \"I decided the information I had would have required explanations I wasn't prepared to give.\"" },
      "Q6": { question: "The Compact has someone inside the Estate.", type: "narrative_statement", requires_item: "smoking-letters", response: "He picks up the drink. Puts it down. A longer pause. \"I've been useful to various arrangements over three years.\" He does not look at you. \"Financial arrangements among them. Channeled through the Compact because they could not go through the Estate without a record being made.\" A pause. \"Lord Ashworth knew about the channel. He had documentation. Tonight's Register reading would have named three specific entries.\" He looks at the ashtray. \"I have known which three for six weeks.\"" },
      "Q6b": { question: "When did you stop.", type: "focused_follow_up", requires_q: "Q6", response: "\"Three months ago.\" He picks up the drink. Sets it down without drinking from it. \"The questions changed.\" A pause. \"For three years the questions were informational. Who attended. What was discussed. Which members were present at which decisions.\" He looks at the ashtray. \"Three months ago the questions became operational. Timing. Access. Which corridors were monitored and which were not.\" Another pause. \"I stopped answering. I received no response to my silence.\" He looks at the unfinished cigarette. \"That was the thing that frightened me. No response at all. As if the answers had already been obtained another way.\"" },
      // CROSS-CHARACTER
      "Q7_CROSS": {
        question: "Lady Ashworth said she decided he could manage his own dangers. Did you think the same thing.",
        requires_char_q: { char: "ashworth", q: "Q5" },
        response: "The longest silence of the evening. He picks up the drink. This time he takes it. Sets it down empty. \"Yes.\" One word. Then: \"We were both wrong about which danger.\" He doesn't say anything else for a long time. The ashtray is still there. The cigarette still unfinished.",
      },
      "SNAP1": { snap: true, response: "\"Because naming someone is a kind of Bond. And I've had enough of those.\" He picks up the drink. Puts it down. \"Work it out yourself. You're clearly capable.\"" },
      "SNAP2": { snap: true, response: "\"The leverage is in the correspondence on that table.\" He gestures at it. \"I assume you've already read it. If you haven't, read it now.\" He turns to the window." },
      "SNAP3": { snap: true, response: "\"I know there are two sides to every arrangement in this building.\" A pause. \"I've always assumed there was something on the other side of that garden.\" He looks toward the archive. \"I'd never looked.\"" },
      // TWO-CHAR ROOM — closes faster, protective of Lady Ashworth
      "Q_TWO_CHAR_BARON_1": { question: "What are you both protecting?", two_char_only: true, response: "He looks at Lady Ashworth's back. \"She told you what she knows.\" A pause. \"I'm telling you what I know.\" He picks up the drink. \"They are not the same thing and I would prefer they stay that way.\"" },
      "Q_TWO_CHAR_BARON_2": { question: "She recommended me to the Compact.", two_char_only: true, snap: true, response: "He sets down the drink. Finally. \"If you are asking me to tell you that, I won't.\" He stands. \"Whatever she recommended — she had reasons. I had three years of reasons and I still don't have all of them.\" He walks to the door. \"Find what you came here to find.\"" },
      "FINAL": { final: true, response: "\"He was a complicated man.\" He says it about Ashworth. \"He built something worth protecting.\" Another pause. \"The wrong people understood that.\"" },
    },
    deceptions: {
      "ashworths-sunday-letter": { response: "He looks at the letter for a long time. \"Yes.\" Quietly. \"And now I'm not.\" He looks up. For the first time this evening his composure is entirely absent. \"Find who did this. Whatever his reason — find him. And make the Estate record it properly.\"", is_effective: true, composure_effect: -30 },
      "smoking-letters": { response: "He looks at the correspondence for a long time. Then at you. \"Three entries.\" He says it. Flat. \"I know which three. I have known for six weeks.\" A pause. \"Lord Ashworth was going to read them tonight. In front of every senior member. With the Register open. Binding record.\" He picks up the drink. \"I was at the terrace window at seven forty-four. I sat down at seven forty-nine.\" He looks at the empty glass. \"I did not need to watch anymore.\"", is_effective: true, composure_effect: -20 },
    },
  },

  // ── DR. HARRIET CRANE ──────────────────────────────────────
  "crane": {
    display_name: "Dr. Harriet Crane",
    room: "physicians",
    intro: "Dr. Harriet Crane arrived two minutes after the body was found. Her medical bag was already open when she entered the Ballroom. She has been in this room since. She has the manner of someone waiting for a conversation they have already had several times in their head.",
    composure: 95,
    composure_state: "normal",
    composure_floor: 40,
    dialogue_limit: 12,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "You arrived very quickly.", type: "open_narrative", response: "\"I was nearby.\" A pause. \"I maintain availability during Estate events. That is part of my arrangement with the Compact.\" She says arrangement precisely. Not contract. Not employment. Not friendship." },
      "Q2": { question: "Your bag was already open.", type: "focused_follow_up", response: "\"A physician prepares.\" She looks at it. \"The bag is always ready. That is the nature of the role.\" She does not explain why she was already in the building before she was called." },
      "Q3": { question: "What killed him.", type: "focused_follow_up", response: "\"I examined the body at eight-oh-three. The presentation is consistent with cardiac presentation, complicated by fall.\" She says it clinically. \"Lord Ashworth had a documented cardiac irregularity. That is in his medical history.\" A pause. \"The Estate's physician has the full file.\"" },
      "Q4": { question: "You've seen this before.", type: "focused_follow_up", requires_q: "Q3", response: "A pause. \"I have broad clinical experience.\" She looks at the bag. \"The presentation is not unusual for someone with his history.\" Another pause that costs something small. \"I said that already.\"" },
      "Q5": { question: "You knew him.", type: "focused_follow_up", response: "\"Through the Compact's medical channel. He attended a consultation through it six months ago.\" She stops. \"That is the extent of my professional involvement with Lord Ashworth.\"" },
      "Q6": { question: "The Baron came to find you at seven-fifteen.", type: "focused_follow_up", response: "\"He did.\" A pause. \"We spoke briefly. He was concerned about something he wouldn't name directly.\" She looks at the window. \"I told him I wasn't in a position to discuss clinical matters at a social event.\" Another pause. \"He accepted that. He left. I found his acceptance — specific.\"" },
      "Q7": { question: "What did he want to know.", type: "focused_follow_up", requires_q: "Q6", response: "\"He asked whether I believed tonight would go as planned.\" She says it carefully. \"I told him I wasn't aware of any particular plan.\" A pause. \"He looked at me for a moment. Then he said: no. Of course not.\" She looks at the bag. \"I have been thinking about that exchange since eight-oh-one.\"" },
      "Q8": { question: "You know more than you're saying.", type: "direct_confrontation", requires_q: "Q5", response: "She is still for a long time. \"I know things that are covered by professional obligations.\" A pause. \"I also know things that I am — reconsidering the scope of those obligations.\" She looks at you. \"The Curator has access to the Compact's medical channel records. I will not obstruct that access.\"" },
      "Q9": { question: "What are you reconsidering.", type: "focused_follow_up", requires_q: "Q8", response: "\"Whether a professional obligation that was used to facilitate something — whether that obligation still holds in the same form.\" She looks at the bag. \"I don't have an answer yet.\" A pause. \"I've had since eight-oh-one to work on it. I don't have an answer yet.\"" },
      // ── PIVOT — Crane/Surgeon romance arc ──────────────────────
      "PQ1": {
        question: "He didn't have to be in this room.",
        requires_pivot: true,
        requires_char_talked: "surgeon",
        response: "She is still for a moment. \"No.\" She says it simply. \"He didn't.\" She looks at the medical bag. \"The appointment book on this desk — every consultation I ran through the Compact channel is logged there.\" A pause. \"That is the investigation.\" She does not say what else it is.",
      },
      "PQ2": {
        question: "How long.",
        requires_pivot: true,
        requires_char_talked: "surgeon",
        requires_q: "PQ1",
        response: "A pause that has nothing clinical in it. \"Two years.\" She says it to the medical bag. \"I knew what he was before tonight. Not all of it.\" Another pause. \"Not the part that matters to your investigation.\" She straightens. \"The appointment book and the study grate. That is what matters to your investigation.\"",
      },
      "PQ3": {
        question: "You packed the bag before you were called.",
        requires_pivot: true,
        requires_char_talked: "surgeon",
        requires_q: "PQ2",
        response: "She looks at you for a long time. \"Yes.\" A pause. \"I knew he would be here. I wanted to be in the room.\" She looks at him across the space without looking at him. \"That is a decision I have been reconsidering since eight-oh-one.\" A longer pause. \"The cipher is in the overlap between the book and the fragments. That is what I can give the investigation.\"",
      },
      // CROSS-CHARACTER — requires item
      "Q5_CROSS": {
        question: "Lord Ashworth attended a private appointment three months ago. Under a different name.",
        requires_char_q: { char: "ashworth", q: "Q4" },
        requires_item: "appointment-book",
        response: "She is completely still. \"That appointment is in the book.\" A pause. \"He asked very specific questions.\" Another pause. \"I answered them. I thought I was helping someone make a decision about their own life.\" She looks up. \"I was wrong about what the decision was for.\"",
      },
      "SNAP1": { snap: true, response: "\"I have professional obligations that do not dissolve because of what happened tonight.\" She looks at the medical bag. \"I've been as helpful as I can be.\"" },
      "SNAP2": { snap: true, response: "\"Every person in this building has an arrangement.\" Quietly. \"Mine is formal enough that I have to be careful tonight.\"" },
      "SNAP3": { snap: true, response: "A pause that goes somewhere her composure has not been all evening. \"I believed what I was told.\" Another pause. \"I believed it.\"" },
      "FINAL": { final: true, response: "She looks at the bag for a long time. Not at him. Not at you. At the bag. \"I wrote it down.\" She says it quietly. The first time all evening she has said something that costs everything. \"I wrote it down because I did not think it would matter.\" A pause. \"Because I did not think he would —\" She stops. She looks at the bag. \"I wrote it down.\" That is all. She does not say anything else. She does not look at him across the room. She does not look at you. She looks at the bag." },
    },
    deceptions: {
      "operational-brief": { response: "\"My name isn't in that document.\" A pause. \"But the channel is. I know that channel.\"", is_effective: true, composure_effect: -20 },
      "appointment-book": { response: "\"That notation is standard.\" She stops. Her hands go still on the table.", is_effective: true, composure_effect: -15 },
      "surgeon-crane-conspiracy-letter": { response: "She is completely still. The stillness is different from every stillness before it. She looks at the letter. She does not say it is not hers. She does not say it is. She looks at the bag.", is_effective: true, composure_effect: -25 },
      "surgeons-mask": { response: "\"A mask.\" She looks at it briefly. \"Masks are interchangeable tonight.\" A pause. \"I did not handle it. I did not place it anywhere.\"", is_effective: true, composure_effect: -10 },
    },
  },

  // ── COMPACT CHARACTERS ─────────────────────────────────────

  "sovereign": {
    display_name: "The Sovereign",
    room: "c3-original",
    intro: "He has been in this room, or a room like it, for forty years. He signed the original agreement when he was younger than the Heir is now. Everyone who signed it with him is dead except Ashworth, who as of tonight is also dead. He is the last person alive who remembers what the agreement was supposed to mean. He is not certain it means the same thing now that it did then.",
    composure: 100,
    composure_state: "normal",
    is_compact: true,
    dialogue_limit: 8,
    dialogue: {
      "Q1": { question: "Who are you?", response: "\"The Sovereign of the Compact.\" A pause. \"We don't use titles as deflection here. That is genuinely what I am and genuinely all that needs explaining at the moment.\"" },
      "Q2": { question: "You've been waiting for tonight.", response: "\"Forty years. Give or take.\" He looks at the empty chair. \"Lord Ashworth sat there when we signed the original agreement. He chose to stop coming eleven years ago.\" A pause. \"I kept his chair.\"" },
      "Q3": { question: "You wanted him corrected, not dead.", response: "A pause of a different kind. \"I wanted him to stand in front of his members and acknowledge forty years of arrangements made on the foundation of an agreement he pretended didn't exist.\" He looks at the original agreement. \"I wanted him alive for that. Alive and on record and unable to pretend otherwise for whatever time he had remaining.\" A pause. \"I wanted him to know that the record existed. That is all I wanted.\" He looks at the empty chair. \"It was not a small thing to want.\"" },
      "Q4": { question: "Did you know what form the operation would take?", response: "\"No.\" The word is flat in a way none of his other words have been. \"I knew an operative had been engaged. I did not know what form the operation would take.\" A pause longer than all the others. \"I am telling you this because the record should be accurate.\" He looks at the empty chair. \"I have been sitting in this room since the news reached me. The chair has been empty for thirty-one years. Tonight it is empty in a different way and I cannot explain the difference to you except to say that I feel it.\"" },
      "Q5": { question: "What did the Compact want?", response: "\"The original agreement recognised.\" He gestures at the document. \"Forty years of Bonds. Forty years of arrangements that referenced an agreement that one man decided didn't need acknowledging anymore.\" A pause. \"We wanted it to exist again.\" He looks toward the corridor. \"The Heir drew the operational timeline on three separate pieces of paper. I have them all. They are very precise.\" Another pause. \"Precision was the part I was not. I waited. She planned. We arrived at the same place by different routes.\"" },
      "CORRECTION1": { correction: true, response: "\"I've answered that. Completely. Would you like me to be clearer about something specific?\"" },
      "CORRECTION2": { correction: true, response: "\"That's the Estate's internal record. I have a copy here, but it would carry more weight from the original. Look for it in the second cabinet, right side. The Curator will have filed it under the Bond date.\"" },
      // ── PIVOT — Compact pair 1: Sovereign + Heir → correspondence-thread ─
      // conspirator-letters (c5) + unsealed-letter (c5)
      "PQ1": {
        question: "The Heir built the operational timeline. What did it require from you.",
        requires_pivot: true,
        requires_char_talked: "heir",
        response: "\"The correspondence.\" He looks at the empty chair. \"Forty years of letters between Ashworth and this office. Most never sent. Many never answered.\" A pause. \"The Correspondence Room has both — the letters that were sent and the one that wasn't. The unsealed letter on the desk was the last thing I wrote to him. Three months ago.\" He looks at it. \"The two together — the conspirator letters and the unsealed one — form a thread the Heir has been trying to trace. She can help you read it.\"",
      },
      // ── PIVOT — Compact pair 3: Sovereign + Envoy → bilateral-seal ─
      // original-agreement (c3) + keystone-rubbing (c6 tunnel)
      "PQ2": {
        question: "The Envoy confirmed the operation. You designed it together.",
        requires_pivot: true,
        requires_char_talked: "envoy",
        response: "\"The original agreement on this table carries both seals — the Estate's and the Compact's.\" He gestures at the document. \"The keystone in the tunnel wall carries the same bilateral mark. It was placed there when the tunnel was built, forty years ago.\" A pause. \"The original agreement and the rubbing from the keystone — those two together establish that the Estate and the Compact were designed to connect. Ashworth spent forty years pretending that wasn't true.\" He looks at the empty chair. \"Tonight was supposed to be the proof. It still can be.\"",
      },
      "FINAL": { final: true, response: "\"When you present the verdict — present the placement record alongside the accusation. The Estate's record will reflect who acted and who sent him, or it will reflect nothing useful at all.\" He looks at the empty chair one more time. \"He would have hated this room. He always did. He came anyway, for a while.\" A pause. \"Present the full account.\"" },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"That's the wrong document.\" Without heat. \"The correct one is here.\"" },
    },
  },

  "heir": {
    display_name: "The Heir",
    room: "c8-gallery",
    intro: "She planned this operation for eight months. She accounted for seventeen variables. The method the operative chose was not one of them. She is twenty-six years old and tonight she found out that precision is not the same thing as control, and that knowing the difference does not make it easier to stand in a room with the consequences.",
    composure: 100,
    composure_state: "normal",
    is_compact: true,
    dialogue_limit: 7,
    dialogue: {
      "Q1": { question: "What was your role in tonight?", response: "\"I coordinated the operational detail. The timing. The archive path access. The specific evidence the Estate side would need to act.\" A pause. \"I was very precise.\" She looks at the testimonies on the wall. \"Precision was the part I was trained for. I was good at it. I remain good at it.\" Another pause. \"I have been trying to decide if that's the same thing as being right.\"" },
      "Q2": { question: "The operative acted beyond the original plan.", response: "She looks at you for a moment. \"The operative's brief was the delivery of the document. The method was described as non-lethal interference.\" Another look. \"I am being very precise about this.\" A pause. \"I have been precise about this seventeen times since the news reached me. Each time it is accurate. Each time it does not resolve what I am trying to resolve.\"" },
      "Q3": { question: "Are you certain it was the right thing?", response: "A longer pause. \"I'm certain it was the necessary thing.\" She looks at the testimonies on the wall. \"Those are thirty-one separate accounts of what Ashworth took from people. I've read all of them.\" Another pause. \"I was more certain before the news reached me.\" She looks at the wall a moment longer. \"The Envoy said something before you arrived.\" A pause. \"He said: the investigator will either stop at the first true thing or keep going until the only thing left is the true thing.\" Another pause. \"I've been thinking about which one you are.\"" },
      "Q4": { question: "The player's testimony is on this wall.", response: "She looks at you. Then at the wall. \"Yes. Four accounts. Spanning six months.\" She doesn't look away from the wall. \"The last one is from tonight.\" A pause. \"The Envoy said you'd find the tunnel before you found the cellar door. He was right about that. He's usually right about the operational detail.\" She looks at you. \"He was also right that you'd keep going.\"" },
      "Q5": { question: "You chose the player specifically.", response: "\"The Compact identified three candidates. You were the first choice.\" She looks at you. \"Your wound had the right shape. And you had already made four choices that indicated you were capable of following evidence without asking to be protected from it.\"" },
      "Q6": { question: "Tell me it was right.", response: "The longest pause in the Compact mansion. \"I've read thirty-one testimonies and forty years of records and I have been trained my entire life for this specific function.\" Another pause. \"I thought I would feel differently after.\" She looks up. \"Tell me what you found. Not what I told you — what you found.\"" },
      // ── PIVOT — Compact pair 1: Heir + Sovereign → correspondence-thread ─
      // conspirator-letters (c5) + unsealed-letter (c5)
      "PQ1": {
        question: "The Sovereign kept forty years of correspondence with Ashworth.",
        requires_pivot: true,
        requires_char_talked: "sovereign",
        response: "\"The Correspondence Room has them.\" She says it precisely. \"Both sides — the letters the Compact sent and the ones Ashworth never answered. And one he did answer, once, at the end.\" A pause. \"The unsealed letter on the desk in that room was his final response. He never sent it.\" Another pause. \"The conspirator letters on the shelves and the unsealed letter together — that's forty years of a relationship collapsing in two documents. Lay them against each other.\"",
      },
      // ── PIVOT — Compact pair 4: Heir + Archivist → ink-comparison ─
      // buried-bonds-comparison (c9) + steward-bond (vault)
      "PQ2": {
        question: "The Archivist has a comparison document in the Agreement Room.",
        requires_pivot: true,
        requires_char_talked: "archivist",
        response: "\"The buried bonds comparison.\" She looks at the wall. \"In the Agreement Room next door. It compares the ink composition of the Steward's Bond against other documents from the same period.\" A pause. \"The Bond's margin annotations — the three operational instructions added after signing — they were written in a different ink. Different year. Different hand.\" Another pause. \"Bring the Steward's Bond from the Estate Vault and lay it against the comparison document. The ink tells you what the Bond doesn't say.\"",
      },
      "FINAL": { final: true, response: "\"When you go back —\" She stops. \"I trained for this. I knew the cost.\" Another stop. \"I would like to know if it mattered. Whatever the verdict says.\" She does not ask you to tell her. A pause. \"The Envoy says the investigator either stops at the first true thing or keeps going until the only thing left is the true thing.\" She looks at you. \"I think you're the second kind. I've been the first kind tonight. I'm trying to decide how I feel about that.\"" },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"That testimony is from the third year.\" She stands without being asked." },
    },
  },

  "envoy": {
    display_name: "The Envoy",
    room: "c6-tunnel",
    intro: "Has been inside the Estate before. Three times, under different names, in different roles. Knows which door sticks. Knows the Steward always looks at the archive when he passes. Watched the gate from seven-oh-two until seven-ten and filed a report that read, in full: confirmed. Now waiting in the tunnel mouth for the investigator he confirmed to arrive. Trying to decide if that's the same thing as complicity. Deciding it probably is. Not finding that as uncomfortable as he expected.",
    composure: 100,
    composure_state: "normal",
    is_compact: true,
    dialogue_limit: 7,
    dialogue: {
      "Q1": { question: "You were waiting for me.", response: "\"You found the tunnel. That took longer than I expected.\" A pause. \"Not much longer. But some.\"" },
      "Q2": { question: "You were watching the gate tonight.", response: "\"I was at the gate position from seven-oh-two until seven-ten.\" He says it without apology. \"Confirmation window. I reported to the Compact.\" A pause. \"Someone came through the garden a minute after I took position. Moved past me without looking. Seven-oh-three. Medical bag. The temperature of the room changed when I passed the study shortly after. You learn to read that.\" Another pause. \"Whoever had entered had already solved the room before anyone else walked into it.\"" },
      "Q3": { question: "What was in the document?", response: "\"Something that was not correspondence.\" He looks at you directly. \"It was logged as correspondence. It was filed as correspondence. It was placed in Archive Case 3 six months ago under that description.\" A pause. \"Nobody who handled it on the way in knew what it was for.\" Another pause. \"I am not certain I knew everything about what it was for.\"" },
      "Q4_SLIP": { question: "You placed this.", is_slip: true, pause_ms: 1500, response: "\"I know because I placed it there.\" He says it immediately. Then 1.5 seconds. The pause. Then: \"I should have said: I know because I know the provenance.\" He looks at you. \"You noticed.\" Another pause. \"I confirmed you as the bearer six months ago because your judgment was reliable.\" He does not look away. \"You have just demonstrated that I was correct. I find that specific combination of facts — your competence, my role in placing you here, this conversation — professionally interesting and personally something I will think about for some time.\"" },
      "Q5": { question: "Ashworth collected the document himself.", response: "\"Yes. He retrieved it from Archive Case 3 at 7:20PM.\" A pause. \"He opened it. He understood what it was.\" Another pause. \"He kept it anyway.\"" },
      "Q6": { question: "Ashworth chose.", response: "\"He was dying. Eighteen months remaining. He knew.\" He looks down the tunnel. \"He convened the Rite for tonight specifically. He opened the Register. He set the audience and the conditions.\" A pause. \"He knew the operation was in motion and he did not leave the building. He made the evening public on his own terms.\" Another pause. \"His death was his final argument.\"" },
      "CORRECTION1": { correction: true, response: "\"I'm the Envoy. That is genuinely my function in the Compact.\" He meets your eyes. \"I understand you're looking for something more specific. What you're looking for is in the Correspondence Room, third shelf, behind the operational brief.\"" },
      // ── PIVOT — Compact pair 2: Envoy + Archivist → chronology ─
      // conspirator-letters (c5) + keystone-rubbing (c6 tunnel)
      "PQ1": {
        question: "The Archivist has been keeping records for twelve years. What do they show.",
        requires_pivot: true,
        requires_char_talked: "archivist",
        response: "\"A sequence.\" He says it the way he says everything — with professional economy. \"The conspirator letters in the Correspondence Room are dated. They establish a timeline.\" A pause. \"The stone marker in the tunnel wall — the rubbing will lift the impression. That impression is a date too.\" He looks down the tunnel. \"The letters and the rubbing together place events in the correct order. The Archivist can read the sequence once you have both.\"",
      },
      // ── PIVOT — Compact pair 3: Envoy + Sovereign → bilateral-seal ─
      // original-agreement (c3) + keystone-rubbing (c6 tunnel)
      "PQ2": {
        question: "The Sovereign said the tunnel was built with the original agreement.",
        requires_pivot: true,
        requires_char_talked: "sovereign",
        response: "\"The keystone marker is in the left wall.\" He gestures behind him. \"Drag slowly — the rubbing will lift the impression.\" A pause. \"The impression on that stone matches the bilateral seal on the original agreement in the Sovereign's room. Two organisations, one mark, built into the architecture forty years ago.\" He looks at you. \"That is the argument Ashworth refused to acknowledge for forty years. The building itself disagrees with him.\"",
      },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"That document was placed in the Study at seven-oh-five. I placed it.\" He says it simply." },
    },
  },

  "archivist": {
    display_name: "The Compact Archivist",
    room: "c4-register",
    intro: "Has been keeping this record for twelve years. Their predecessor kept it for twenty-eight. Before that, someone else. The methodology has never changed: observe, record, do not intervene. Tonight someone finally arrived to read what they recorded. The Archivist has been preparing for this moment for twelve years. They did not anticipate that being ready for a moment and having the moment arrive would feel this different from each other.",
    composure: 100,
    composure_state: "normal",
    is_compact: true,
    dialogue_limit: 7,
    dialogue: {
      "Q1": { question: "What is this place?", response: "\"The Black Register Room.\" They look around with genuine pride. \"Forty years of records that the Estate didn't know were being kept.\" A pause. \"Would you like me to pull the relevant volumes? I have them ready.\"" },
      "Q2": { question: "You've been watching the Estate for forty years.", response: "\"The Compact has. I've been here for twelve.\" They open the Black Register. \"But the methodology was established before I arrived. My predecessor was very thorough.\" A pause. \"I've tried to honour that.\" They look at the register. \"The Sovereign visits on the first of each month. He reads the same volume every time. I've stopped asking if he wants a different one. He doesn't. He wants to read the same thing until it means something different. I understand that.\"" },
      "Q3": { question: "The player's Bond is in this register.", response: "They look at you for a moment. \"Volume forty, third column, November entry.\" They open to it without looking up the page number. \"Your name. Your signature. Six months ago.\" A pause. \"The Bond describes four operational functions. You fulfilled all four.\" They do not close the register. \"I wrote this entry myself. I have read it many times since. I wanted to be ready for when you asked me about it.\" A pause. \"I find I'm not, quite.\"" },
      "Q4": { question: "What did Ashworth do?", response: "\"He took the sovereign role and rewrote the terms of the original agreement in his own mind without telling anyone he'd done it.\" They turn to a specific page. \"The Estate's Register shows the official record. This shows what actually happened in the same period.\" They lay both open side by side." },
      "Q5": { question: "The Bond Reconstruction puzzle. What am I looking for?", response: "\"Two names. Yours is one of them.\" They pull out the fragments. \"The header is the most distinctive piece — it's the only one with a formal title. Start there. Build outward.\" A pause. \"There are two fragments that don't belong. Your Estate handwriting sample will identify them.\"" },
      "Q6": { question: "Were there other candidates for the delivery?", response: "\"Three names were identified. You were the first choice.\" They don't look up from the Register. \"The others had wounds that were — less precisely shaped.\" A pause. \"I don't think that makes it better. I'm noting it for accuracy.\" They close the register. Open it again. \"I have been a keeper of records for twelve years. I have never before been in the room when someone read the record of themselves. I did not account for what that would be like.\"" },
      // ── PIVOT — Compact pair 2: Archivist + Envoy → chronology ─
      // conspirator-letters (c5) + keystone-rubbing (c6 tunnel)
      "PQ1": {
        question: "The Envoy has been inside the Estate three times. What was he mapping.",
        requires_pivot: true,
        requires_char_talked: "envoy",
        response: "\"The sequence.\" They open the Black Register to a specific page. \"The Envoy's confirmation visits are logged here. Each one corresponds to a date in the conspirator letters in the Correspondence Room.\" A pause. \"The tunnel wall has a stone marker. The rubbing from that marker completes the sequence — it marks when the operation formally began.\" They close the register. \"The letters and the rubbing placed in order tell you what the Compact knew and when they knew it. That is the chronology of tonight.\"",
      },
      // ── PIVOT — Compact pair 4: Archivist + Heir → ink-comparison ─
      // buried-bonds-comparison (c9) + steward-bond (vault)
      "PQ2": {
        question: "The Heir said the Steward's Bond was amended after signing.",
        requires_pivot: true,
        requires_char_talked: "heir",
        response: "\"The comparison document is in the Agreement Room.\" They open to a specific page. \"It was assembled from Bond records across the same eight-year period. The ink composition of documents signed under duress differs from documents signed in good faith — the pressure pattern is different.\" A pause. \"The Steward's Bond from the Estate Vault and the comparison document together will show you which amendments were his and which were added by someone else.\" They close the register. \"That is where the chain of instruction becomes visible.\"",
      },
      "FINAL": { final: true, response: "\"Everything you need for the verdict is in this room or the room next door.\" They close the Register gently. \"The Compact built this archive for exactly the moment you're in.\" A pause. They look at the register. \"My predecessor left a note on the inside cover. It says: when the right person finally reads this, they will not thank you. They will be changed by it. That is the same thing.\"" },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"Actually the date is correct —\"" },
    },
  },

  "surgeon": {
    display_name: "The Surgeon",
    room: "physicians",
    intro: "He is in the same room as Dr. Crane. He has not looked at her since she came back downstairs. That is not accident — it is the particular discipline of a man who knows exactly where she is at all times without looking. He is sitting at the desk with the posture of someone who arrived here by choice and intends to remain. When you enter he looks up immediately. He seems genuinely pleased to see you. That is the first thing wrong with him.",
    composure: 100,
    composure_state: "normal",
    composure_floor: 40,
    dialogue_limit: 12,
    snap_limit: 2,
    snap_count: 0,
    dialogue: {
      "Q1": {
        question: "What did you do tonight.",
        type: "open_narrative",
        response: "\"Lord Ashworth was at the lectern when he fell. I was in the south corridor — I heard the assembly react before I understood what had happened.\" A pause. \"I moved toward Dr. Crane immediately. She was already at the body.\" He says this as if it explains the movement. It doesn't explain the movement. \"She is very thorough.\" Another pause — the particular pause of a man deciding what to offer next. \"I stayed close while she worked.\" He looks at you. \"The Viscount had his gloves off and then back on during the evening. I noticed because I notice hands — professional habit.\" He says the last two words with a small self-deprecating acknowledgment. \"The Steward was in the south corridor at seven fifty-eight. That struck me as deliberate placement rather than routine.\""
      },
      "Q2": {
        question: "What kind of physician are you.",
        type: "open_narrative",
        response: "\"Was is more accurate.\" A pause — not defensive, just precise. \"Twenty-two years of surgical practice. The last four in consultancy work for the Compact — medical oversight, member welfare, that kind of engagement.\" He says 'that kind of engagement' with the mild tone of a man describing paperwork. \"I stepped back from active practice eighteen months ago. The hands are still good.\" He looks at them briefly. \"Old habit.\""
      },
      "Q3": {
        question: "The Register alterations — did you notice.",
        type: "focused_follow_up",
        response: "\"The Register alterations are visible to anyone examining the ink timing carefully.\" He says this helpfully. \"I noticed at approximately seven forty-two. The Curator was already aware — he used the word 'detectable' when I spoke with him. A precise choice of word.\""
      },
      "Q4": {
        question: "Where were you at seven forty-five.",
        type: "focused_follow_up",
        response: "\"Seven forty-five.\" He considers. \"South corridor — I'd come from the library end, I think. The archive path.\" A pause. \"I was moving toward the Ballroom. I remember checking my watch somewhere around that time because the Rite was due to begin and I wanted to be in position.\" He looks at you. \"Is seven forty-five a significant time? I can try to be more precise if it helps.\""
      },
      "Q5": {
        question: "You walked the balcony level when you arrived.",
        type: "focused_follow_up",
        response: "\"I walked the full building before the assembly.\" A pause. \"The balcony level, yes. The service stairs. The sightlines.\" He says sightlines with the particular attention of someone who needed to know them. \"Lord Ashworth's position during the opening is well documented — the railing, forty years, every Rite.\" Another pause. \"I read the Estate's ceremonial record when I joined the Compact four years ago. I like to understand the spaces I work in.\" He looks at you. \"Is there something specific about the balcony?\""
      },
      "Q6": {
        question: "What do you think happened tonight.",
        type: "focused_follow_up",
        response: "\"Tonight was — specific.\" A pause. Not managed. The first pause that costs something small. \"The Register opening. The assembly. Ashworth at the railing.\" He looks at the desk. \"I had been aware for some time that this Rite would be significant. The Compact knew. Several Estate members knew.\" Another pause. \"What I didn't anticipate —\" He stops. He picks it up. \"What none of us anticipated was the manner of it.\" He looks at you. The warmth is still there. \"I think the Baron anticipated more than he's saying. And the Steward covered a corridor he had no routine reason to cover.\" He looks at the desk. \"Those two things together — that's the shape of tonight.\""
      },
      "Q7": {
        question: "Why did your practice become complicated.",
        type: "focused_follow_up",
        response: "A pause of a different quality. \"A licensing board made a decision thirty years ago that I disagreed with.\" He looks at the window. \"I disagreed with it for a long time. Eventually disagreement became something else.\" He does not say what it became."
      },
      "Q8": {
        question: "Ashworth was on that board.",
        type: "focused_follow_up",
        requires_q: "Q7",
        response: "\"Lord Ashworth was chair of the licensing review.\" He says it without drama, without weight. \"He signed the determination. He had the authority to return the finding and he chose not to.\" A pause. \"I hold no particular animus toward institutional authority. Lord Ashworth worked as he was designed to work.\" He looks at you. The warmth is still there. \"You're building a motive. You should.\" Another pause. \"It's accurate.\""
      },
      "Q9": {
        question: "You're not concerned about this investigation.",
        type: "focused_follow_up",
        response: "\"I find it professionally interesting.\" He says it without irony. \"A good investigation asks the right questions in the right order.\" A pause. \"You are asking reasonable questions.\" Another pause. \"In a reasonable order.\" He looks at you. \"Keep going.\""
      },
      // ── MID-DEPTH CONFRONTATION ────────────────────────────────
      // Gates: craneBalconyAdmission + surgeons-mask in inventory
      // + surgeon_committed_745_south_corridor
      // This is the pressure point between surface and Branch C.
      // Does not convict. Drops composure. Makes Branch C reachable.
      "Q10": {
        question: "The mask was on the balcony floor. The floor was clear at seven-oh-five. You told me south corridor at seven forty-five.",
        type: "evidence_reveal",
        requires_item: "surgeons-mask",
        requires_node: "craneBalconyAdmission",
        requires_node_2: "surgeon_committed_745_south_corridor",
        response: "He is still. Not the managed stillness he has produced all evening — something underneath that. A pause that takes longer than any pause he has chosen. \"You have placed three things in the same sentence.\" He says it. \"The mask. The floor. The corridor.\" Another pause. He looks at the mask. He does not ask where it was found. He has not asked that once. \"That is a precise set of observations.\" He looks at you. The warmth is still there. It is the most disturbing thing about him. \"What specifically are you asking me to account for.\""
      },
      "Q11": {
        question: "You were not in the south corridor at seven forty-five.",
        type: "direct_confrontation",
        requires_q: "Q10",
        response: "The longest pause he has produced that is not Branch C. Not recalibration. Not a calculation running. Something closer to a man deciding how much of the truth is safe to leave in the room. \"You have a committed statement.\" He says it. \"You have a mask that was not present at seven-oh-five and was present at eight-oh-one.\" A pause. \"You have a physician who left a balcony floor clear and found it not clear.\" He looks at you. \"What you do not have\" — he says it with the precision of a man who has audited this list since eight-oh-one — \"is a witness who places me anywhere specific during those seven minutes.\" He looks at the desk. \"That is the gap.\" A pause. \"Find me a witness.\"",
        grants_node: "surgeon_gap_named_by_surgeon",
      },
      // ── PIVOT — Crane/Surgeon ───────────────────────────────────
      "PQ1": {
        question: "Why are you in this room specifically.",
        requires_pivot: true,
        requires_char_talked: "crane",
        response: "\"The Physicians Room is the appropriate location for the Compact's attending physician during an Estate event.\" A pause that is slightly too long. \"That is the operational reason.\" He does not offer another reason. He also does not look at Dr. Crane.",
      },
      "PQ2": {
        question: "That's not the only reason.",
        requires_pivot: true,
        requires_char_talked: "crane",
        requires_q: "PQ1",
        response: "A pause. \"No.\" He says it the way he says everything — precisely. \"It is not the only reason.\" He straightens slightly. \"The other reason is not the investigation's concern.\" Another pause. \"I wanted to be in the room. That is all I will say about that.\"",
      },
      "PQ3": {
        question: "She went upstairs after the body was found.",
        requires_pivot: true,
        requires_char_talked: "crane",
        requires_q: "PQ2",
        response: "He is very still. \"Yes.\" One word. A pause. \"She came back downstairs.\" Another pause. \"Whatever she found up there — she made a decision about it very quickly.\" He looks at the desk. \"She has been composed since she came back. I have been watching that composure all evening.\" A pause. \"I find it — significant.\" He does not say why he finds it significant. He does not look at her.",
      },
      "CORRECTION1": { correction: true, response: "\"I answered that.\" No pause. \"One sentence. Do you need a different word, or is it a different answer you're looking for?\"" },
      "SNAP1": { snap: true, response: "\"You're welcome to pursue that line.\" He says it pleasantly. \"I'd suggest the south corridor and the Steward's position at seven fifty-eight are more productive than whatever you're building toward here.\" He looks at you. \"That is genuine advice.\"" },
      "SNAP2": { snap: true, response: "\"I've given you accurate information all evening.\" A pause. \"Every observation I've offered is verifiable.\" He looks at you steadily. \"That is not nothing.\"" },
      "FINAL": { final: true, response: "\"Good investigation.\" He stands. Looks at you directly. The warmth is still there. It was always there. \"Good investigation.\" He walks to the door. He means it completely." },
    },
    deceptions: {
      "surgeons-mask": { response: "\"That fell.\" Two words. A full second of stillness. He does not ask where it was found. He knows where it was found.", is_effective: true, composure_effect: -20 },
      "plain-mask": { response: "\"I brought it in case.\" One sentence. Complete composure. He has had this answer ready since seven forty-eight.", is_effective: true, composure_effect: -15 },
      "surgeons-licensing-record": { response: "\"That decision was thirty years ago.\" A pause. \"It was unjust.\" He is not denying the record. He is not denying anything.", is_effective: true, composure_effect: -10 },
      "candle-iron": { response: "\"A staged scene.\" He says it immediately. Then stops. He looks at the item. \"That is a reasonable conclusion from the physical evidence.\" He does not say it is wrong. He does not say it is right.", is_effective: false, composure_effect: 0 },
    },
  },

  // ── VIVIENNE ───────────────────────────────────────────────
  "vivienne": {
    display_name: "Vivienne",
    room: "maids-quarters",
    intro: "She is already talking when you arrive. Not to you — to herself, or to no one, or to the general injustice of an evening that has produced a dead lord and not nearly enough explanation. She stops when she sees you. She does not appear embarrassed. She appears interested. \"I shouldn't say this,\" she says immediately, \"but I have been waiting for someone to come and ask me things.\" She has been waiting since eight-oh-one. She has prepared.",
    intro_surface: "She is folding something. She looks up when you enter. She does not appear surprised to see an investigator in her quarters. She appears to have been expecting one eventually.",
    surface_gate: {
      requires_paywall: true,
    },
    surface_dialogue: {
      "SQ1": {
        question: "Did you see anything tonight.",
        response: "\"I see everything.\" She says it simply. Not a boast — a fact. \"I have been in every room in this building tonight.\" She folds the linen. \"Everything that happened in this house tonight happened in front of me at one point or another.\" A pause. \"I am not sure what to do with that.\" She smooths her apron. \"Come back when you know what you're looking for. I'll know what I saw.\""
      },
      "SQ2": {
        question: "How are you holding up.",
        response: "\"I've worked in this house four years.\" She says it. \"I've never seen the Steward look the way he looked at seven fifty-eight.\" A pause. \"That is not a man doing his job. That is a man doing something he was told to do and has not yet decided how to live with it.\" She goes back to folding. \"Come back when you've spoken to more people. I'll make more sense then.\""
      },
      "SURFACE_FINAL": {
        final: true,
        response: "She smooths her apron. \"I'll be here.\" A pause. \"I'm always here.\""
      },
    },
    composure: 100,
    composure_state: "normal",
    composure_floor: 100,
    dialogue_limit: 22,
    snap_limit: 0,
    snap_count: 0,
    dialogue: {
      "VH1": {
        question: "Thomas said to let you talk in order.",
        type: "narrative_statement",
        requires_node: "vivienne_hatch_cross_fired",
        response: "She stops what she is doing. A pause that is not her performing pause. \"Thomas.\" She says it with a specific quality — the fondness of someone who has just been understood. \"He said that.\" Another pause. She looks at you differently now. Not performing into the question. Actually looking. \"In order means from the beginning. Not from the interesting part.\" She smooths her apron. \"Most people come to me and skip to the mask or the balcony or the Baron. Thomas knows I don\'t work that way. The interesting part only makes sense if you have everything before it.\" She looks at you. \"Start at the beginning. I will get you to the terrace. I will get you to the three seconds. I will get you to what I told Thomas.\" A pause. \"But I have to get there in order.\"",
        grants_node: "vivienne_hatch_hint_received"
      },
      "Q1": {
        question: "What do you do here.",
        type: "open_narrative",
        response: "\"I do everything.\" She gestures at the room. \"The candles, the linens, the silver, the fires. I have been in every room in this building tonight.\" A pause. \"Every room.\" She says it with the particular emphasis of someone who wants you to understand what every room means. \"Including —\" she stops herself. \"Well. We'll get to that.\""
      },
      "Q2": {
        question: "How long have you been here.",
        type: "open_narrative",
        response: "\"Four years. I came from Lyon. The Curator hired me without asking for the usual references and I have always thought that was because he needed someone who would not gossip to the local village.\" She smooths her apron. \"I don't gossip to the local village.\" A pause. \"I gossip to Thomas. Thomas doesn't repeat things.\" Another pause. \"Usually.\""
      },
      "Q3": {
        question: "Who is Thomas.",
        type: "focused_follow_up",
        requires_q: "Q2",
        response: "\"The groundskeeper. Thirty years he has been here.\" She says it with the fondness of someone describing a piece of furniture she is attached to. \"He is very reliable. He notices things and he writes them in his head and he never says them.\" A pause. \"I say everything. We balance each other.\""
      },
      "Q4": {
        question: "Tell me about tonight.",
        type: "open_narrative",
        response: "\"Tonight was very dramatic even before Lord Ashworth died.\" She leans forward slightly. \"The Viscount was near the lectern at seven-forty. And the candelabra — he touched the base of it.\" She nods. \"He kept his gloves on. I noticed because you do not touch decorative metalwork in evening gloves — you remove them. He did not remove them. He touched the base and moved away. A man who keeps gloves on when he handles something heavy and iron does not want to leave a mark on it.\" A pause. \"Then he put the gloves back on and moved away. I thought it was very specific behaviour for a man who was supposed to be adjusting the programme.\" Another pause. \"And the Baron —\" She stops. \"Well the Baron is always a separate conversation.\""
      },
      "Q5": {
        question: "What about the Baron.",
        type: "focused_follow_up",
        requires_q: "Q4",
        response: "\"The Baron has been watching the terrace window all evening.\" She says it with great significance. \"Very specifically the terrace. And before that he was watching the study.\" She leans closer. \"He saw someone leave the study at seven-oh-five and he wrote it down and he looked — satisfied. Like a man who has confirmed a suspicion."
      },
      "Q5b": { question: "And the candelabra.", type: "focused_follow_up", requires_q: "Q5", response: "\"He also passed through the ballroom at seven thirty-eight. He walked the full length of it and paused at the candelabra.\" She looks at you significantly. \"He did not touch it. He looked at it. And then he went back to the smoking room.\" Another pause. \"I think he is in love with someone who is also in love with someone else. But the candelabra is a separate observation.\""
      },
      "Q6": {
        question: "You think everything has a romantic explanation.",
        type: "focused_follow_up",
        requires_q: "Q5",
        response: "\"Not everything.\" She considers this seriously. \"The Steward is not romantic. The Steward is institutional. He covered the south corridor at seven fifty-eight under specific instructions and he did it with the face of a man who has been told to do something he doesn't fully understand.\" A pause. \"That is not romantic. That is a man following an arrangement.\" She smooths her apron again. \"The Baron, however, is absolutely romantic. He has very good shoulders.\""
      },
      "Q7": {
        question: "What do you know about Dr. Crane.",
        type: "focused_follow_up",
        response: "\"Dr. Crane went upstairs twice tonight.\" She says it with complete authority. \"The first time before the Rite. The second time after eight-oh-one.\" A pause. \"The second time she came back with a face like someone who has seen something they cannot unsee.\" Another pause. \"She is always very careful with her case. Always. Tonight her hands were not careful with it.\""
      },
      "Q8": {
        question: "You saw her go upstairs twice.",
        type: "focused_follow_up",
        requires_q: "Q7",
        response: "\"First time at seven-oh-five. She had her case.\" She nods. \"She came back without it. I noticed because she is always very careful with the case. Always.\" A pause. \"Then at eight-oh-one she went back up. She came back — wrong. Her face was wrong.\" She looks at you. \"And she didn't have the case still. She went up again. Came back with it.\" Another pause. \"Three trips. She never takes three trips. I have worked here four years and she has never taken three trips.\""
      },
      "Q9": {
        question: "What do you know about the Viscount.",
        type: "focused_follow_up",
        response: "\"The Viscount has been altering the Register for eight years.\" She says it as if this is established fact. \"The Curator knows. Everyone who pays attention knows.\" A pause. \"He was at the lectern at seven-forty. He touched the candelabra base with his gloves on. He did not remove them.\" She leans in. \"He has worn gloves to this Estate for eight years. A man who always wears gloves handles things without leaving prints. Tonight he was at the candelabra. The candle iron near the body has no fingerprints.\" She looks at you. \"I am not saying these two things are connected. I am saying they are both true.\""
      },
      "Q10": {
        question: "What about Northcott.",
        type: "focused_follow_up",
        response: "She stops before she starts. A different pause from all the others. Shorter. \"Cavalier Northcott is very sweet.\" She says sweet carefully. \"He was lost in the east corridor his first week and I showed him where he needed to be and he has been very grateful since then.\" She smooths her apron. \"Very grateful.\" A pause. \"Lord Ashworth spoke to him privately before the Rite. I saw them in the east corridor. It was not a long conversation.\" She smooths her apron again more carefully than usual. \"Northcott came out of it the way a man comes out of a room where something has been taken from him."
      },
      "Q10b": { question: "What did Ashworth say to him.", type: "focused_follow_up", requires_q: "Q10", response: "\"I know what Lord Ashworth said to him. I know because Lord Ashworth spoke to me about it three weeks ago. He said the arrangement between Northcott and a member of staff violated Estate law and he intended to record it formally at the Rite.\" She looks at you. \"Tonight. In front of everyone. Permanent record.\" Another pause. \"Northcott was distracted every moment after that conversation. He passed the candelabra twice during his rounds and stopped to look at it both times. I didn't understand why at the time.\""
      },
      "Q11": {
        question: "Distracted how.",
        type: "focused_follow_up",
        requires_q: "Q10",
        response: "\"He keeps looking for me.\" She says it without vanity. As pure observation. \"All evening. Every time I passed the foyer he looked up.\" A pause. \"He found me at seven fifty-five. After the body was found. He was — unsettled. He said he needed to tell me something.\" She looks at you. \"He said: I saw someone in the east corridor. Seven-oh-eight. He said it quickly, like something that had been waiting.\" Another pause. \"Then the Steward came past and Northcott stopped.\""
      },
      "Q12": {
        question: "What did he see in the east corridor.",
        type: "focused_follow_up",
        requires_q: "Q11",
        response: "\"He didn't say.\" She looks at you. \"But I know what was in the east corridor at seven-oh-eight.\" A pause. \"I was there.\""
      },
      "Q13": {
        question: "What did you see.",
        type: "focused_follow_up",
        requires_q: "Q12",
        response: "\"A figure in the east corridor at seven-oh-eight coming from the direction of the study.\" She says it with great conviction. \"Moving with purpose. And the mask —\" she stops. \"The mask was wrong. Too plain. Nothing on it. Not the usual masks I see at the Rites.\" A pause. \"I noticed because of the Baron's shoulders and then I noticed the mask and then the Baron went past and I forgot about the mask until now.\" She looks at you. \"I am telling you now.\" Another pause. \"I could not tell you who was behind that mask. At that distance, with that mask, I could not tell you.\""
      },
      "Q14": {
        question: "The Baron's shoulders.",
        type: "focused_follow_up",
        requires_q: "Q13",
        response: "\"The Baron was coming the other way down the corridor.\" She says it with the patience of someone explaining something obvious. \"He has very good posture. I noticed him and then I noticed the figure behind him and that is when I saw the plain mask.\" A pause. \"The Baron did not see the figure. Or if he did he did not show it. He was looking at the study door.\" She considers. \"Actually he was looking at the study door quite specifically. Like someone checking that a door is closed that they want to be closed.\""
      },
      "Q15": {
        question: "Tell me about the Steward.",
        type: "focused_follow_up",
        grants_node: "steward_east_gate_744",
        response: "\"The Steward unlocked the east service gate at seven forty-four.\" She says it precisely. \"I know because I was coming from the linen cupboard. He had a key that is not his usual key and he opened the gate and stood there for approximately thirty seconds and then walked away.\" A pause. \"Before that — at seven-forty — he was in the ballroom. Near the candelabra. He looked at it the way you look at something you have been told to notice.\" She smooths her apron. \"I thought he was checking the candles. But the candles were fine. I had just done them."
      },
      "Q15b": { question: "Thomas saw it too.", type: "focused_follow_up", requires_q: "Q15", response: "\"Thomas saw the gate too. From the garden. Thomas noted it because the east service gate has been locked every evening for thirty years except twice. Tonight was the third time.\" She is quiet for a moment. A different kind of quiet from her usual pauses. \"There is something Thomas carries about the Steward.\" She says it carefully. \"He has never said it directly. But in four years I have learned to read what Thomas does not say.\" She smooths her apron. \"Whatever it is — it is fourteen years old. And tonight the Steward did something Thomas understood immediately.\""
      },
      "Q16": {
        question: "What was the second time.",
        type: "focused_follow_up",
        requires_q: "Q15",
        response: "\"Thomas won't tell me.\" She looks mildly affronted. \"He said it was before my time and it was not his information to share.\" A pause. \"Thomas has principles. I find it inconvenient.\" She smooths her apron. \"What I can tell you is that tonight when the Steward opened that gate the corridor beyond it leads directly to the south approach of the ballroom. If someone was coming from the terrace direction they could reach the ballroom unseen through that gate.\" She says it as a geographical observation. She does not connect it to anything. She is trusting you to connect it.\""
      },
      "Q17": {
        question: "You said you were in every room tonight.",
        type: "focused_follow_up",
        response: "\"Yes.\" She says it simply. \"Every room.\" A pause. \"Including the terrace at seven forty-five. I was collecting the outdoor candleholders. They wanted them moved inside before the assembly.\" She looks at you. \"I was on the terrace for approximately seven minutes. Seven forty-three to seven fifty, roughly.\""
      },
      "Q18": {
        question: "What did you see on the terrace.",
        type: "focused_follow_up",
        requires_q: "Q17",
        response: "\"I saw the Baron at the window above.\" She points upward. \"Watching the terrace. Looking very — purposeful.\" She nods. \"The candelabra iron was still intact at seven-forty. I checked the candles myself at seven-forty. The base was there.\" A pause. \"When I came back through the ballroom at eight-oh-two the iron was separated from the candle and near Lord Ashworth's head. Someone removed it between seven-forty and eight-oh-one.\" Another pause. \"And then I heard something from the direction of the balcony. A sound. Heavy. Like something — landing.\" A pause. \"I should have looked up.\""
      },
      "Q19": {
        question: "You didn't look up.",
        type: "focused_follow_up",
        requires_q: "Q18",
        response: "\"I was looking at the candleholders.\" She says it quietly. The performing energy has gone somewhere. \"I was counting them. Twelve outside, four already moved. I was counting.\" A pause. \"And then someone came around the corner from the balcony stairs very quickly. Moving fast.\" She looks at you. \"I saw them for approximately three seconds.\" A pause. \"I told Thomas. That night. I told Thomas exactly what I saw.\""
      },
      "Q20": {
        question: "What did you tell Thomas.",
        type: "focused_follow_up",
        requires_q: "Q19",
        response: "She is quiet for a moment. This is the first moment of quiet she has produced all evening. \"I told him I had seen something I shouldn't have seen.\" A pause. \"Those were my exact words. Something I shouldn't have seen.\" She looks at you. \"He asked me what. I told him.\" Another pause. \"He was very still when I told him. Thomas is always still but this was a different kind of still.\""
      },
      "Q21": {
        question: "What did you tell him you saw.",
        type: "focused_follow_up",
        requires_q: "Q20",
        grants_node: "vivienne_false_romantic_reading",
        response: "The performing energy returns. Not all the way — there's something underneath now that wasn't there at Q1. \"I told him I saw two people on the balcony and then one person running.\" She says it. \"I thought it was — I thought it was romantic. Two people meeting secretly on the balcony and then one of them leaving quickly because someone was coming.\" She looks at you. \"That is what I thought.\" A pause. \"That is what I told Thomas I thought.\""
      },
      "Q22": {
        question: "That's not what you saw.",
        type: "direct_confrontation",
        requires_q: "Q21",
        requires_node: "vivienne_hatch_cross_fired",
        response: "The longest pause of the evening. The performing energy goes entirely. Not gradually — completely. Like a door closing. She looks at you. Her hands are still on her apron. She is not smoothing it. \"No.\" She says it in a voice that sounds nothing like the woman who has been talking for the past hour. \"It was not romantic.\" A pause. \"One man pushed another man off that balcony.\" Present tense. Like it is still happening. \"That is what I saw.\" A pause. \"That is what I told Thomas.\""
      },
      // ── WRONG-PATH TIMELINE INJECTIONS ────────────────────────
      // These are timeline_critical and reinject as the LAST question on return.
      // Vivienne believes every observation sincerely. All wrong framing.
      // Each one places a wrong-path suspect at a suspicious time.
      // The player who comes back and exhausts all questions finds these at the bottom.
      "VT1": {
        question: "Did anyone leave the ballroom before the body was found.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"The Viscount left the ballroom at seven forty-one.\" She nods. \"I saw him go toward the balcony stairs corridor. He came back at approximately seven fifty-three.\" A pause. \"Twelve minutes. I didn't think anything of it at the time.\" She smooths her apron. \"I think something of it now.\""
      },
      "VT2": {
        question: "Was the Baron in the smoking room all evening.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"No.\" She says it with great significance. \"The Baron was at the smoking room window at seven forty-four. I saw him from the corridor.\" A pause. \"But at seven forty-seven when I passed again he was not at the window.\" She looks at you. \"Three minutes. Between seven forty-four and seven forty-seven. I cannot account for where he was.\""
      },
      "VT3": {
        question: "Where was the Steward between seven forty and eight.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"The Steward came back through the ballroom at seven fifty from the direction of the terrace.\" She says it precisely. \"He was moving quickly for the Steward. He paused at the candelabra. Then he went toward the south corridor.\" A pause. \"Seven fifty. From the terrace direction.\" She smooths her apron. \"I noted it because the Steward does not usually come from that direction.\""
      },
      "VT4": {
        question: "When did Lady Ashworth arrive.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Lady Ashworth was in the garden at seven forty.\" She says it. \"Walking the path below the balcony. She stopped at the bench directly beneath the balcony railing.\" A pause. \"She stood there for approximately two minutes. Then she went back inside through the terrace entrance at seven forty-two.\" She looks at you. \"She was beneath the balcony at seven forty. Lord Ashworth fell at seven forty-five.\""
      },
      "VT5": {
        question: "Was Northcott at his post all evening.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She stops before she starts. A very specific kind of pause. \"Northcott left the foyer at seven forty-three.\" She says it carefully. \"He came back at seven fifty-two.\" A pause. \"Nine minutes. I noticed because I passed the foyer at seven forty-three and he was not there.\" She smooths her apron. \"He was always there. Every time I passed. Except those nine minutes.\" Another pause. \"Seven forty-three to seven fifty-two.\""
      },
      "VT6": {
        question: "Where was Dr. Crane between seven and eight.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Dr. Crane was upstairs twice.\" She says it with great significance. \"First at seven-oh-five. She came back without her case.\" A pause. \"Then at eight-oh-one she went back up. She came back with her case and a face like someone who has understood something they cannot ununderstand.\" She smooths her apron. \"Two trips upstairs on the night Lord Ashworth died. Both before and after the time he died.\" Another pause. \"I have been thinking about those two trips since eight-oh-one.\""
      },
      "VT8": {
        question: "Did Dr. Crane go back upstairs after the body was found.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Yes.\" She says it immediately. \"At approximately eight-oh-two. Before anyone had fully understood what had happened. She went upstairs very quickly.\" A pause. \"She came back with her case.\" She smooths her apron. \"A physician who goes upstairs before the scene has been secured and comes back with her case has been upstairs for a reason.\" Another pause. \"I am not saying what the reason was. I am saying I noted it.\""
      },
      "VT9": {
        question: "Was Northcott anywhere near the balcony corridor tonight.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Northcott passed the balcony corridor entrance at seven forty-four.\" She says it precisely. \"I saw him from the linen room. He stopped at the entrance. He looked up the corridor toward the balcony stairs.\" A pause. \"He stood there for approximately fifteen seconds. Then he went back to the foyer.\" She smooths her apron. \"A man who stops at a corridor entrance and looks toward the balcony stairs at seven forty-four and then goes back to his post — I notice these things. I have been in this house four years.\""
      },
      "VT10": {
        question: "Did Lady Ashworth go back inside immediately after the garden.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"No.\" She looks at you. \"Lady Ashworth was in the garden at seven forty. She was at the bench below the balcony.\" A pause. \"But before she went back inside she stood at the terrace entrance for approximately two minutes. Looking up at the balcony.\" She smooths her apron. \"I noticed because she was very still. Lady Ashworth is not usually very still. She is usually managing something.\" Another pause. \"At seven forty-two she went inside through the terrace door. She did not look down at the garden again.\""
      },
      "VT_SG1": {
        question: "You said you were on the terrace at seven forty-five. Did you see the Compact physician.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She is very still for a moment. Not the performing still — a different kind. \"I was carrying the last candleholder inside.\" She says it slowly. \"Past the ballroom entrance.\" A pause. \"He was there. In the assembly. Before the Gavel. Standing beside the Curator near the Register.\" She looks at her apron. \"Silver mask with the red border at the crown. He wears the same mask every Rite. I know it. I know all the masks.\" Another pause. \"Seven forty-five. He was in the assembly. I saw the mask.\" She smooths her apron once and does not elaborate. For Vivienne, not elaborating is the most alarming thing she does.",
        grants_node: "surgeon_false_corridor_745"
      },
      "VT_SG2": {
        question: "Did anyone leave the assembly before Lord Ashworth was found.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She says it. The performing energy has dropped a register. Not gone — just lower. \"I was at the ballroom entrance at seven fifty-five. The assembly was taking its positions. I counted them the way I count the candleholders. Habit.\" A pause. \"The Compact physician was in position at seven fifty-five. He remained in position.\" She smooths her apron. \"I would have noticed if he had moved. I notice when the assembly moves the same way I notice when candles need replacing. Before anyone has to ask.\" Another pause. She looks at the door. Not at you. \"He was there. At seven fifty-five. He was there at eight-oh-one. He did not leave the assembly.\" She says it with the careful precision of someone giving a statement they know will be used.",
        grants_node: "surgeon_false_no_gap"
      },
      "VT_CR1": {
        question: "Did you see Dr. Crane go upstairs before the Rite.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"I was in the east corridor from seven until seven-thirty.\" She says it. Not with the usual performance — quietly. \"The east corridor is the main route from the entrance to the ballroom approach. If you go upstairs to the balcony level from the east wing, you pass through it.\" She looks at the wall. \"Dr. Crane arrived. She spoke to people. She moved between the gallery and the ballroom approach.\" A pause. \"I did not see her pass through the east corridor going upstairs. Not once before the assembly.\" She smooths her apron. \"I am not saying she did not go upstairs. I am saying I did not see it. And I was there.\" Another pause. \"The south corridor is a different matter. I cannot see the south corridor from where I was.\" She says this last sentence in a very specific way. Like she is being fair. Like being fair costs her something.",
        grants_node: "crane_false_no_705"
      },
      "VT_CR2": {
        question: "Was Dr. Crane s diagnosis at eight o clock surprising to you.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She starts to say it — the usual opener — and stops. Starts again differently. \"I was near the ballroom entrance when Lord Ashworth was found.\" A pause. \"Dr. Crane moved immediately. Before anyone else understood what had happened.\" Another pause. \"She examined him briefly. Then she said — and I heard this clearly, I was four feet away — she said: consistent with cardiac presentation.\" She looks at the wall. The performing energy is entirely gone from this. \"She said it to the Curator. She said it before the Curator had asked.\" A pause. \"I have been thinking about that since eight-oh-three. A physician who has a diagnosis before she is asked for one.\" She smooths her apron. Once. Very carefully. \"That is not nothing.\"",
        grants_node: "crane_false_cardiac_named"
      },
      "VT_CR3": {
        question: "Did Dr. Crane say why she went back upstairs at eight.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"She told the Curator.\" She says it. \"At eight-oh-two approximately. I was in the corridor.\" A pause. \"She said: I left my medical case upstairs during the earlier check on Lord Ashworth. I need to retrieve it.\" She looks at you. \"One reason. Her case. She said it clearly and the Curator nodded and she went upstairs.\" She smooths her apron. \"She came back with the case. That is what she said. That is what she did.\" Another pause. \"I find it very precise as a reason.\" She says this carefully. \"One reason, stated clearly, before anyone asked. A medical case.\" She looks at the wall. \"I cannot tell you what I think it means. I can tell you it felt like a sentence she had prepared.\"",
        grants_node: "crane_false_one_reason"
      },
      "VT_PH1": {
        question: "Did you hear Pemberton-Hale say anything about the Register tonight.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She takes a breath. Not a dramatic breath — a careful one. \"I was near the archive corridor at seven forty-two.\" She says it. \"Returning the linen cart.\" A pause. \"The Viscount was speaking to the Curator. Very quietly. But I was close.\" She smooths her apron. \"He said: the amendments are standard procedural entries. I was acting within the institutional mandate. There is nothing in the Register that requires review.\" A pause. \"The Curator said nothing that I heard.\" Another pause. \"The Viscount said those words to the Curator's silence.\" She looks at you. \"I notice things. Four years of things. A man who explains himself to someone who has not yet accused him — that is a man who has been expecting the accusation.\"",
        grants_node: "ph_false_standard_amendments"
      },
      "VT_ST1": {
        question: "Did you see the Steward near the gallery at seven fifty-eight.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Yes.\" She says it without the usual preamble. Just yes. \"I was returning from the linen room at seven fifty-six. I passed the gallery entrance.\" A pause. \"The Steward was standing in the entrance at seven fifty-eight. Facing into the gallery. Not moving anything. Not carrying anything.\" She looks at her apron. \"The Steward is always doing something. In fourteen years — Thomas told me this — the Steward has never once stood in a doorway without a function.\" Another pause. \"He was standing in the gallery entrance at seven fifty-eight with no function I could identify.\" She smooths her apron. \"I passed. He did not acknowledge me. In four years the Steward has acknowledged me at every passing. He did not acknowledge me at seven fifty-eight.\" She says this last part very quietly. \"I noticed.\"",
        grants_node: "steward_false_gallery_vivienne"
      },
      "VT_ST2": {
        question: "Did the Steward speak to you after Lord Ashworth was found.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She is quiet for a moment. This is not her performing quiet. \"At approximately eight-fifteen.\" She says it finally. \"Before I went to Thomas. The Steward intercepted me in the east corridor.\" A pause. \"He said: I was in the gallery at the time of the incident. If anyone asks.\" She does not look at you while she says this. She looks at the wall. \"He said it exactly like that. I was in the gallery at the time of the incident. If anyone asks.\" Another pause. \"The Steward has never in four years asked me to remember something for him. He does not ask things like that.\" She smooths her apron. \"He said if anyone asks.\" A pause. \"He was prepared for someone to ask.\"",
        grants_node: "steward_false_bond_protocol"
      },
      "VT_BA1": {
        question: "Was the Baron in the smoking room when you brought the tray at seven-oh-five.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"He was in his chair.\" She says it. \"I brought the tray at seven-oh-five. Same drink I had brought at seven-oh-one.\" A pause. \"He had not touched it.\" She smooths her apron. \"I noticed because I notice untouched drinks. An untouched drink means the person is thinking rather than sitting. The Baron was sitting but he was thinking.\" She looks at the wall. \"He was looking at the window. Not at the garden outside — at the angle. At the specific angle of the window relative to the terrace.\" A pause. \"Like a man calculating what someone could see through that window from outside.\" She smooths her apron again. \"Or what he could see. I could not determine which direction he was calculating.\"",
        grants_node: "baron_false_no_705_sighting"
      },
      "VT_BA2": {
        question: "Did anyone enter the smoking room at seven-fifteen.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She hesitates. A real hesitation — not performed. \"I was in the corridor outside the smoking room from seven-twelve to seven-fourteen.\" She says it carefully. \"The linen alcove directly across from the door. I was reorganising the shelves.\" A pause. \"The door did not open. I was there. The door did not open between seven-twelve and seven-fourteen.\" She smooths her apron. \"If someone visited the Baron at seven-fifteen, they did not enter through the corridor door.\" Another pause. \"There is a service passage that connects to the smoking room from the south end. I cannot see that entrance from the alcove.\" She says this the same way she says her careful statements — like being fair is a discipline she has practised. \"I am telling you what I know. I am also telling you what I cannot see from where I was.\"",
        grants_node: "baron_false_crane_no_visit"
      },
      "VT_BA3": {
        question: "Did you hear the Baron say anything about his arrangement with the Compact.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"I shouldn't say this —\" She stops. Then she says it anyway. \"I overheard the Baron and the Archivist at seven-thirty. Near the archive corridor entrance.\" A pause. \"The Baron said: the three entries are personal arrangements. Nothing institutional. Nothing connected to the Compact channel.\" She looks at you. \"Personal.\" A pause. \"He said it three times in three different formulations. Personal arrangements. Not institutional. Nothing connected to the Compact channel.\" She smooths her apron. \"I notice when people use three different words for the same thing. It means the single word is not doing enough work on its own.\" Another pause. \"The Archivist said nothing that I heard.\" She smooths her apron again. \"Nothing connected to the Compact channel.\" She says it one more time. Very quietly. \"That is a very specific thing to deny unprompted.\"",
        grants_node: "baron_false_personal_debts"
      },
      "VT_AS1": {
        question: "Would Lady Ashworth have seen Dr. Crane go upstairs from the study.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"Lady Ashworth was in the study from seven until eight.\" She says it. \"I brought tea at seven-fifteen. She was at the desk. The door was closed when I arrived. I knocked.\" A pause. \"The study window faces the garden. The corridor that leads to the balcony stairs faces east.\" She smooths her apron. \"From the study, with the door closed, you cannot see the east corridor or the staircase approach. Lady Ashworth would not have observed anyone going upstairs.\" A pause. \"Not from where she was sitting.\" She says it plainly. Not as an exoneration — as a fact. \"I brought the tea. She thanked me. She was reading something on the desk. She did not go to the window while I was there.\" She smooths her apron. \"I was there four minutes. She did not move from the desk.\"",
        grants_node: "ashworth_false_crane_not_upstairs"
      },
      "VT_AS2": {
        question: "Where was Lady Ashworth looking during the assembly.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She is very still before answering this. \"I was near the ballroom entrance at seven fifty-two.\" She says it. \"I had a clear view of the assembly.\" A pause. \"Lady Ashworth was on the left side, third row. She was looking at the lectern. At the Register on the lectern.\" She looks at her apron. \"She did not turn. She did not scan the room. She was entirely focused on the lectern at seven fifty-two.\" She smooths her apron. \"I notice when people do not look around a room. Lady Ashworth usually looks around a room. Tonight she did not.\" A pause. \"She was looking at the Register as if she knew something about it the rest of the assembly did not.\" She says this last sentence with a quality she does not explain. Like she is uncertain whether that means Lady Ashworth was waiting for something or whether it means something else entirely.",
        grants_node: "ashworth_false_mask_normal"
      },
      "VT_NO1": {
        question: "Was Northcott at his post throughout the evening.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "\"I passed the foyer four times before the assembly.\" She says it. \"Seven-oh-one. Seven-oh-five. Seven-fourteen. Seven-ten.\" A pause. \"Northcott was at his post at seven-oh-one and at seven-ten.\" She smooths her apron. \"He was not at his post at seven-oh-five or seven-fourteen.\" A pause. \"I noticed because Northcott is always at his post. In four years I have passed the foyer perhaps two hundred times during Rite preparations. He has been absent three times including tonight.\" She looks at you. \"I do not know where he was at seven-oh-five or seven-fourteen. I know where he was not.\" Another pause. \"His absence at those times may have an entirely reasonable explanation.\" She says this the way she says all her careful statements. Like being fair is a discipline she has practised. \"I am telling you the times. The times are accurate.\"",
        grants_node: "northcott_false_routine_post"
      },
      "VT_NO2": {
        question: "The figure on the balcony stairs at seven forty-nine — were they masked.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "The performing energy drops entirely. Not to nothing — to something quieter and more specific. \"I was on the terrace at seven forty-nine.\" She says it. \"Moving the last candleholder. I had a view of the balcony stairs from the terrace approach.\" A pause. \"I saw a figure descending the stairs. Moving quickly. The particular quickness of someone who has a destination they have already decided on.\" She looks at the wall. \"They were wearing a mask.\" A pause. \"A formal Estate mask.\" She smooths her apron very carefully. \"I notice masks. I have told you this. It is not a small thing that I notice masks.\" Another pause. \"They were masked. A formal Estate mask. I cannot tell you whose mask it was from that distance. All formal Estate masks look similar from twenty feet.\" She is quiet for a moment. \"But they were wearing one. At seven forty-nine. On the balcony stairs. Descending quickly.\" A pause. \"I should say — I was still collecting candleholders when I saw them. I was on the last one. I may have miscounted the minutes. I know it was after the impact and before I went inside. Seven forty-nine is my best account of it.\" She looks at you. \"I have told Thomas this. I told him the night it happened. He said: describe the mask. I described the mask. He was quiet for a long time. Then he said: that is not his mask.\"",
        grants_node: "northcott_false_all_masked_749"
      },
      "VT_NO3": {
        question: "Did Northcott and Dr. Crane acknowledge each other during the evening.",
        type: "focused_follow_up",
        timeline_critical: true,
        response: "She is quiet for a long time. Not her performing quiet. The real one. \"I was in and out of rooms all evening.\" She says it finally. \"I saw Cavalier Northcott multiple times. I saw Dr. Crane multiple times.\" A pause. \"I did not see them in the same room at the same time.\" She smooths her apron. \"I did not see them speak. I did not see them acknowledge each other.\" Another pause. \"I notice when people who know each other fail to acknowledge each other. It is as specific as acknowledgement. Sometimes more specific.\" She looks at the wall. \"In the rooms I passed through — they were not together. They did not look at each other when they could have.\" A pause. \"I am telling you this carefully because it matters which way it is. Either they did not see each other. Or they saw each other and chose not to show that they had.\" She smooths her apron one final time. \"I cannot tell you which. I can tell you that either way, I noticed.\"",
        grants_node: "northcott_false_no_contact"
      },
      "FINAL": {
        final: true,
        response: "She smooths her apron. The performing energy comes back — not all the way. Something has been put down that she cannot pick back up. \"I shouldn't say this,\" she says. And then she doesn't say it. For the first time all evening she doesn't say it. She just looks at the door."
      },
    },
    deceptions: {
      "surgeons-mask": { response: "\"That is the physician's mask. His personal one.\" She says it immediately. \"I know because I've seen it. He has a very specific mask. Silver backing, red border at the crown. That is not it.\" A pause. \"That one has nothing on it. Plain. He brought that one separately.\"", is_effective: true, composure_effect: 0 },
      "candle-iron": { response: "\"Oh that is from the ballroom.\" She nods. \"The candelabra near the lectern. The iron base.\" A pause. \"Someone moved it. It was not there when I set up the candles at seven o'clock. It was there at eight-oh-one.\" She looks at it. \"Someone moved it between seven and eight.\"", is_effective: true, composure_effect: 0 },
    },
  },

  // ── THOMAS HATCH ───────────────────────────────────────────
  "hatch": {
    display_name: "Thomas Hatch",
    room: "groundskeeper-cottage",
    intro: "Thirty years. He has been here thirty years and in that time he has learned which doors stick, which paths flood after rain, which members use the back route when they don't want to be seen. He has learned all of this by paying attention and saying nothing. He is standing at the cottage door when you arrive. He was expecting someone eventually. He has been waiting since eight-oh-one with the particular patience of a man who knows how to wait.",
    intro_surface: "He is at the cottage door. He sees you coming across the terrace. He waits. He is good at waiting.",
    surface_gate: {
      requires_paywall: true,
    },
    surface_dialogue: {
      "SQ1": {
        question: "You're the groundskeeper.",
        response: "\"Thirty years.\" He says it. One fact. Complete."
      },
      "SQ2": {
        question: "Did you see anything tonight.",
        response: "\"The evening went wrong before eight o'clock.\" He says it. A pause. \"I noted the time of several things.\" He looks at the garden. \"Come back when you've been inside longer. What I know will matter more then.\""
      },
      "SQ3": {
        question: "What time did things go wrong.",
        response: "\"Seven forty-five.\" He says it immediately. Then stops. \"That's the time I noted.\" He looks at you. \"Come back when you know why that time matters. I'll tell you what I heard.\""
      },
      "SURFACE_FINAL": {
        final: true,
        response: "He nods once. He goes back to the garden lamps. He is on a schedule."
      },
    },
    composure: 100,
    composure_state: "normal",
    composure_floor: 100,
    dialogue_limit: 10,
    snap_limit: 0,
    snap_count: 0,
    dialogue: {
      "Q1": {
        question: "What is your role here.",
        type: "open_narrative",
        response: "\"The grounds. The gardens. The outbuildings. Thirty years.\" He says it without elaboration. \"I know this property.\""
      },
      "Q2": {
        question: "Where were you at seven forty-five.",
        type: "focused_follow_up",
        response: "\"The east garden. Moving between the cottage and the terrace wall.\" A pause. \"I check the garden lamps on a schedule. Seven forty-five is part of the schedule.\" He says this plainly. \"I heard something at seven forty-five from the direction of the balcony.\""
      },
      "Q3": {
        question: "What did you hear.",
        type: "focused_follow_up",
        requires_q: "Q2",
        response: "\"An impact.\" He says it without drama. \"Heavy. From above. From the balcony level or close to it.\" A pause. \"I've heard that kind of sound before. Objects falling. It has a specific quality.\" Another pause. \"I noted the time because I note times. Seven forty-five. Impact from the balcony direction.\" He looks at the garden. \"Vivienne was on the terrace at that hour. She was moving the candleholders inside. She saw more than I did.\""
      },
      "Q4": {
        question: "Did you see anything.",
        type: "focused_follow_up",
        requires_q: "Q3",
        response: "\"At seven forty-eight someone came to the cottage.\" He says it exactly. \"From the direction of the terrace. Moving quickly. Without a mask.\" A pause. \"At a formal Rite every member is masked. This person was not masked.\" He looks at the cottage door. \"They knocked. I answered.\""
      },
      "Q5": {
        question: "Who was it.",
        type: "focused_follow_up",
        requires_q: "Q4",
        response: "He is quiet for a moment. \"A member of the assembly.\" He says it with the precision of a man who has chosen his words carefully and means them exactly. \"I did not ask for identification. Thirty years of this house — I know the faces.\" A pause. \"I knew the face.\" He does not say whose face.",
      },
      "Q6": {
        question: "What did they want.",
        type: "focused_follow_up",
        requires_q: "Q5",
        response: "\"A mask.\" He says it simply. \"They needed a spare mask.\" A pause. \"I keep miscellaneous items in the cottage stores. Members occasionally require things at inconvenient hours. In thirty years I have provided lamp oil, a spare key, a length of cord, writing paper.\" He looks at the cottage interior. \"Tonight I provided a mask.\" A pause. \"It is in my nature to provide what is asked without asking why it is needed. Thirty years of this house has made that a habit.\" Another pause. \"I am reconsidering that habit.\""
      },
      "Q7": {
        question: "You didn't ask why they needed it.",
        type: "focused_follow_up",
        requires_q: "Q6",
        response: "\"No.\" One word. Complete. He looks at the garden. A long pause. \"I heard an impact at seven forty-five. I gave a mask at seven forty-eight. At eight-oh-one Lord Ashworth was dead.\" He says these three facts in order, plainly, with the tone of a man reading a record. \"I have been putting those three facts in that order since eight-oh-one.\" He looks at you. \"I have not found an arrangement of them that does not mean what I think it means.\""
      },
      "Q8": {
        question: "Vivienne told you what she saw.",
        type: "focused_follow_up",
        requires_node: "vivienne_hatch_cross_fired",
        response: "\"Yes.\" He says it immediately. No pause before it. \"She told me at approximately eight-fifteen.\" A pause. \"She told me what she had seen on the terrace. She told me plainly. Vivienne tells things plainly when they frighten her.\" He looks at the cottage door. \"When she finished I was quiet for some time.\" Another pause. \"She asked me if I understood. I said yes. She asked me what we should do. I said I needed to think.\" A pause. \"I have been thinking since eight-fifteen.\""
      },
      "Q9": {
        question: "Who did you give the mask to.",
        type: "direct_confrontation",
        requires_q: "Q7",
        response: "The longest pause of all. Not managed — genuine. The pause of a man who has been rehearsing this moment since eight-oh-one and now that it has arrived finds that rehearsal was not sufficient. \"A man came to the cottage door at seven forty-eight.\" He says it. Precisely. \"He was without a mask and he needed one. Thomas Hatch had a spare in the cottage stores.\" A pause. \"Thomas Hatch gave it to him.\" Another pause. \"Thomas Hatch did not ask why he needed it.\" He looks at you. \"Thomas Hatch has been asking himself why he did not ask since eight-oh-one.\"",
        grants_node: "hatch_mask_admission",
      },
      "Q10": {
        question: "You know what you did.",
        type: "wait_silence",
        requires_q: "Q9",
        response: "He is completely still. \"Yes.\" One word. Then nothing for a long time. \"A man came to this door.\" He says it finally. \"He had been on that balcony. He had done what he came to do. He needed something to walk back into that assembly and I gave it to him.\" He looks at the garden. \"In thirty years I have been useful to this house. Tonight I was useful to the wrong person.\" A pause. \"I don't know how to put those two things in the same room.\" He looks at you. \"I'm asking you to put them in the record accurately. Whatever the record says about tonight — what Thomas Hatch did should be in it correctly.\"",
        grants_node: "hatch_full_admission",
      },
      "FINAL": {
        final: true,
        response: "\"The garden lamps.\" He looks at them. \"I'll finish the schedule.\" He goes back to work. He does not say goodnight."
      },
    },
    deceptions: {
      "surgeons-mask": { response: "\"That is not the mask I provided.\" He says it immediately. \"The mask I provided was plain. Unmarked. From the cottage stores.\" A pause. \"That one\" — he looks at it — \"is personal. Commission work. That fell somewhere.\" He does not ask where.", is_effective: true, composure_effect: 0 },
    },
  },

};

// ── SURFACE GATE CHECK ─────────────────────────────────────
// Returns true if the character's full dialogue arc is unlocked.
// Before unlock: surface_dialogue only.
// After unlock: full dialogue.
function _isSurfaceGateMet(char) {
  if (!char.surface_gate) return true; // no gate — always full
  const gate = char.surface_gate;

  // Paywall must be cleared
  if (gate.requires_paywall && !gameState.paidTierUnlocked) return false;

  // At least one of the listed characters must have been talked to
  if (gate.requires_any_char) {
    const anyTalked = gate.requires_any_char.some(cId => {
      const talked = gameState.char_dialogue_complete[cId];
      return talked && Object.keys(talked).length > 0;
    });
    if (!anyTalked) return false;
  }

  return true;
}

// ── CONVERSATION ENGINE ────────────────────────────────────
function computeAvailableQuestions(charId) {
  const char = CHARACTERS[charId];
  if (!char) return [];
  const answered = gameState.char_dialogue_complete[charId] || {};
  const available = [];
  const inTwoChar = typeof _twoCharActive !== 'undefined' && _twoCharActive;

  // ── SURFACE GATE ────────────────────────────────────────────
  // If gate not met, serve surface_dialogue only
  if (char.surface_gate && !_isSurfaceGateMet(char)) {
    if (char.surface_dialogue) {
      Object.entries(char.surface_dialogue).forEach(([qId, q]) => {
        if (q.final || answered[qId]) return;
        available.push(qId);
      });
    }
    return available;
  }

  Object.entries(char.dialogue).forEach(([qId, q]) => {
    if (q.snap || q.final || q.correction || answered[qId]) return;
    if (q.bonus && getHourWindow() !== 'golden_hour') return;
    if (q.two_char_only && !inTwoChar) return;

    // Gate: requires pivot — must have talked to someone else first
    if (q.requires_pivot && gameState.last_talked_to === charId) return;
    if (q.requires_pivot && !gameState.last_talked_to) return;

    // Gate: requires previous question answered
    if (q.requires_q && !answered[q.requires_q]) return;

    // Gate: requires question answered on ANOTHER character
    // requires_char_q: { char: "ashworth", q: "Q5" }
    if (q.requires_char_q) {
      const { char: otherChar, q: otherQ } = q.requires_char_q;
      const otherAnswered = gameState.char_dialogue_complete[otherChar] || {};
      if (!otherAnswered[otherQ]) return;
    }

    // Gate: requires ANY question answered on another character (just talked to them)
    if (q.requires_char_talked) {
      const talked = gameState.char_dialogue_complete[q.requires_char_talked];
      if (!talked || Object.keys(talked).length === 0) return;
    }

    // Gate: requires item
    if (q.requires_item && !hasItem(q.requires_item)) return;

    // Gate: requires object examined
    if (q.requires_examined && !gameState.examined_objects.includes(q.requires_examined)) return;

    // Gate: requires node in node_inventory
    if (q.requires_node) {
      const nodeInv = (gameState.node_inventory) || {};
      if (!nodeInv[q.requires_node]) return;
    }
    if (q.requires_node_2) {
      const nodeInv = (gameState.node_inventory) || {};
      if (!nodeInv[q.requires_node_2]) return;
    }

    // Gate: requires item examined or in inventory
    if (q.gate) {
      if (q.gate.item && !hasItem(q.gate.item) && !gameState.examined_objects.includes(q.gate.item)) return;
      if (q.gate.deception && !char.required_deception_used) return;
    }

    // Depth gate for Surgeon
    if (q.depth) {
      const maxD = getSurgeonMaxDepth();
      if (q.depth > maxD) return;
    }

    // ── ROWE CUSTOM GATES ──────────────────────────────────────
    // Skip funnel — fires automatically, never a player choice
    if (q.type === 'funnel') return;

    // Skip duel results — fire programmatically after duel
    if (q.type === 'duel_result') return;

    // Skip post-duel questions until duel is complete
    if (q.requires_duel_complete) {
      const roweState = window.ROWE_STATE;
      if (!roweState || !roweState.duel_complete) return;
    }

    // Hide choice questions once any choice has been made (funnel fired)
    if (q.type === 'choice') {
      const roweState = window.ROWE_STATE;
      if (roweState && roweState.choice_made) return;
    }

    available.push(qId);
  });

  // ── RETURN ECHO REINJECTION ──────────────────────────────────
  // Missed timeline_critical questions reinsert randomly on re-entry
  const missed = window.gameState && window.gameState._missedTimelines &&
                 window.gameState._missedTimelines[charId];
  // ── TIMELINE REINJECTION — random slot ──────────────────────
  // Real and fake timeline_critical questions reinject equally.
  // Random position — the player may find it anywhere in the conversation.
  // No distinction between correct-path and wrong-path moments.
  if (missed && missed.length > 0) {
    missed.forEach(missedQId => {
      if (!available.includes(missedQId)) {
        const insertAt = Math.floor(Math.random() * (available.length + 1));
        available.splice(insertAt, 0, missedQId);
      }
    });
  }

  return available;
}

function askQuestion(charId, qId) {
  const char = CHARACTERS[charId];
  if (!char) return;
  // Check surface dialogue first, then full dialogue
  const q = (char.surface_dialogue && char.surface_dialogue[qId])
          || char.dialogue[qId];
  if (!q) return;

  // Mark answered
  if (!gameState.char_dialogue_complete[charId]) gameState.char_dialogue_complete[charId] = {};
  gameState.char_dialogue_complete[charId][qId] = true;

  // Envoy slip pause
  if (q.is_slip && q.pause_ms) {
    const resp = document.getElementById('char-response');
    if (resp) {
      const firstPart = q.response.split('He says it immediately.')[0] + 'He says it immediately.';
      resp.textContent = firstPart;
      resp.scrollTop = 0;
      setTimeout(() => {
        resp.textContent = q.response;
        resp.scrollTop = 0;
        updateConversationUI(charId);
      }, q.pause_ms);
    }
    return;
  }

  // PH Q11 slip — mark compactEvidenceFound
  if (q.slip) {
    gameState.compactEvidenceFound = true;
  }

  const resp = document.getElementById('char-response');
  if (resp) {
    // Word-by-word for first sentence
    const msPerWord = charId === 'surgeon' ? 80 : 60; // Surgeon: every sentence deliberate
    if (typeof window._renderResponse === 'function') {
      window._renderResponse(resp, q.response, msPerWord);
    } else if (typeof renderWordByWord === 'function') {
      renderWordByWord(resp, q.response, msPerWord);
    } else {
      resp.textContent = q.response;
    }
    resp.scrollTop = 0;
  }

  // Portrait speaking animation
  if (typeof _animatePortrait === 'function') _animatePortrait(charId, 'speaking');
  setTimeout(() => { if (typeof _animatePortrait === 'function') _animatePortrait(charId, ''); }, 2000);

  // Peak moment bespoke animations
  if (charId === 'surgeon' && qId === 'Q3') NocturneEngine.emit('surgeonQ3Shown', { charId });
  if (charId === 'baron'   && qId === 'Q4') setTimeout(animateBaronDirectLook, 500);
  if (charId === 'ashworth' && (q.final || qId === 'FINAL')) NocturneEngine.emit('finalLineFired', { charId });
  if (charId === 'pemberton-hale' && q.slip) animatePHSlip();
  

  // Composure effect
  if (q.composure_effect) {
    const existing = gameState.characters[charId] || {};
    existing.composure = (existing.composure || 100) + q.composure_effect;
    gameState.characters[charId] = existing;
    updateComposureState(charId);
  }

  // grants_node from spine questions — fires to board + behavioral logger
  if (q.grants_node && typeof window._markNode === 'function') {
    window._markNode(q.grants_node);
    NocturneEngine.emit('nodeMarked', { nodeId: q.grants_node, charId });
    // Also write to node_inventory for timeline gate
    if (gameState.node_inventory) {
      gameState.node_inventory[q.grants_node] = true;
    }
  }

  // ── TIMELINE REINJECTION POPULATION ─────────────────────────
  // When a timeline_critical question is answered for the first time,
  // add it to _missedTimelines so it can be reinjected on return visits.
  // It will appear as the LAST available question — earned by persistence.
  // Both correct-path and wrong-path timeline_critical questions reinject.
  if (q.timeline_critical) {
    if (!gameState._missedTimelines) gameState._missedTimelines = {};
    if (!gameState._missedTimelines[charId]) gameState._missedTimelines[charId] = [];
    if (!gameState._missedTimelines[charId].includes(qId)) {
      gameState._missedTimelines[charId].push(qId);
    }
  }

  // Clear from missed timelines if the player has now re-asked it on return
  // (prevents infinite reinjection — once re-asked it's done)
  if (window.gameState._missedTimelines && window.gameState._missedTimelines[charId]) {
    // Only remove if this is a RETURN visit re-ask (already in missed list before this ask)
    // The population above runs first so we check length > 1 or different qId
    const wasMissed = (gameState._missedTimelines[charId] || []).filter(id => id !== qId);
    if (wasMissed.length === 0) {
      delete gameState._missedTimelines[charId];
    } else {
      gameState._missedTimelines[charId] = wasMissed;
    }
  }

  updateConversationUI(charId);
  saveGame();
}

function updateConversationUI(charId) {
  if (charId === 'rowe' && window._roweLockRender) return;
  renderQuestions(charId);
  updateComposurePanel(charId);

  const available = computeAvailableQuestions(charId);
  const char = CHARACTERS[charId];
  const answered = gameState.char_dialogue_complete[charId] || {};

  if (available.length === 0) {
    const allGated = Object.entries(char.dialogue).filter(([qId, q]) => {
      if (q.snap || q.final || q.correction || q.bonus || q.two_char_only) return false;
      return !!(q.requires_q || q.requires_item || q.requires_examined ||
                q.requires_char_q || q.requires_char_talked || q.gate || q.depth || q.extended);
    });
    const gatedAnswered = allGated.every(([qId]) => answered[qId]);

    const finalKey = Object.keys(char.dialogue).find(k => char.dialogue[k].final && !answered[k]);
    if (finalKey) {
      gameState.char_dialogue_complete[charId][finalKey] = true;
      const resp = document.getElementById('char-response');
      if (resp) resp.textContent = char.dialogue[finalKey].response;
    }

    if (gatedAnswered) {
      gameState.char_dialogue_complete[charId]._complete = true;
      gameState.verdictTracker.characters_fully_questioned++;
      const dot = document.getElementById(`char-${charId}`);
      if (dot) dot.classList.add('exhausted');
    } else {
      const list = document.getElementById('questions-list');
      if (list) {
        list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">Nothing more is being volunteered. Find what you need elsewhere and return; the next question will surface itself.</div>';
      }
    }
  }
}

function updateComposureState(charId) {
  const char = gameState.characters[charId] || {};
  const composure = char.composure || 100;
  let state = 'normal';
  if (composure <= 40) state = 'broken';
  else if (composure <= 70) state = 'cracking';
  const prev = char.composure_state;
  char.composure_state = state;
  gameState.characters[charId] = char;
  updateComposurePanel(charId);
  if (state !== prev) {
    NocturneEngine.emit('composureChanged', { charId, state, composure });
  }
}

// ── COMPOSURE PARTIAL RECOVERY ─────────────────────────────
// When player leaves a room and returns, characters partially
// recover composure — but never fully. They remember.
// Recovery: 15 points max, only from cracking/broken states.
// Broken characters never recover past cracking (40).
const _composureLastLeft = {}; // charId → timestamp when player left their room

function trackRoomExit(roomId) {
  const chars = (window.CHARACTER_POSITIONS && CHARACTER_POSITIONS[roomId]) || [];
  chars.forEach(charId => {
    _composureLastLeft[charId] = Date.now();
  });
}

function applyComposureRecovery(roomId) {
  const chars = (window.CHARACTER_POSITIONS && CHARACTER_POSITIONS[roomId]) || [];
  chars.forEach(charId => {
    const char = gameState.characters[charId];
    if (!char) return;
    const lastLeft = _composureLastLeft[charId];
    if (!lastLeft) return;

    const elapsed = Date.now() - lastLeft;
    const current = char.composure || 100;
    if (current >= 100) return;

    // Composure recovery — kept, no time gate removed
    const minutesGone = elapsed / 60000;
    const recovery = Math.min(15, Math.floor(minutesGone * 5));
    const cap = char.composure_state === 'broken' ? 45 : 75;
    const newComposure = Math.min(cap, current + recovery);

    if (newComposure > current) {
      char.composure = newComposure;
      gameState.characters[charId] = char;
      updateComposureState(charId);
    }
  });
}

// ── PIVOT MECHANIC ─────────────────────────────────────────
// Talk to anyone else → come back → get 2 more question slots
// Replaces the 1-minute shallow question restoration

function applyPivotBonus(charId) {
  const lastTalked = gameState.last_talked_to;

  // First conversation — no pivot yet
  if (!lastTalked) {
    gameState.last_talked_to = charId;
    return;
  }

  // Same character — no pivot
  if (lastTalked === charId) return;

  // Different character — pivot! Grant 2 more slots to this character
  if (!gameState.pivot_bonus) gameState.pivot_bonus = {};
  gameState.pivot_bonus[charId] = (gameState.pivot_bonus[charId] || 0) + 2;

  // Clear exhausted state so newly gated questions that have since unlocked can surface
  if (gameState.char_dialogue_complete[charId]?._complete) {
    delete gameState.char_dialogue_complete[charId]._complete;
    const dot = document.getElementById(`char-${charId}`);
    if (dot) dot.classList.remove('exhausted');
  }

  // Update last talked
  gameState.last_talked_to = charId;
  const PIVOT_TELLS = {
    'northcott':      'He has straightened. He is watching the door again.',
    'steward':        'He has composed himself. His hands are behind his back.',
    'ashworth':       'She has turned back to the window.',
    'curator':        'He has returned to the archive. He was not waiting.',
    'voss':           'She has moved to the other side of the room.',
    'pemberton-hale': 'He has adjusted his cuffs. Both of them.',
    'greaves':        'He has returned to the chess notation. He has not moved a piece.',
    'baron':          'He has picked up the drink. He has put it down again.',
    'crane':          'She has closed the medical bag. It takes her a moment.',
    'surgeon':        'He is watching you with the attention of someone recalculating.',
    'uninvited':      null,
    'sovereign':      null,
    'heir':           null,
    'envoy':          null,
    'archivist':      null,
  };
  const tell = PIVOT_TELLS[charId];
  if (tell && typeof showToast === 'function') {
    setTimeout(() => showToast(tell), 400);
  }
}
window.applyPivotBonus = applyPivotBonus;

// Wire to room navigation
NocturneEngine.on('roomEntered', ({ roomId }) => {
  // Apply recovery to characters in this room
  applyComposureRecovery(roomId);
});

NocturneEngine.on('roomLeft', ({ roomId }) => {
  trackRoomExit(roomId);
});

window.trackRoomExit = trackRoomExit;
window.applyComposureRecovery = applyComposureRecovery;


function updateComposurePanel(charId) {
  const panel = document.getElementById('conversation-panel');
  if (!panel) return;
  const char = gameState.characters[charId] || {};
  const state = char.composure_state || 'normal';
  panel.className = `composure-${state}`;
  panel.classList.add('open');
  if (typeof window.updateComposureLabel === 'function') window.updateComposureLabel(charId);
}

function renderQuestions(charId) {
  const list = document.getElementById('questions-list');
  if (!list) return;
  list.innerHTML = '';
  const available = computeAvailableQuestions(charId);
  available.forEach(qId => {
    const char = CHARACTERS[charId];
    if (!char) return;
    const q = char.dialogue[qId];
    if (!q) return;
    const div = document.createElement('div');
    div.className = 'question-item';
    div.textContent = q.question;
    div.onclick = () => askQuestion(charId, qId);
    list.appendChild(div);
  });
  if (available.length === 0) {
    // Only show exhausted if at least one question has been answered
    const answered = gameState.char_dialogue_complete[charId] || {};
    const hasAnswered = Object.keys(answered).some(k => k !== '_complete' && !k.startsWith('branch_'));
    if (hasAnswered) {
      list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">The conversation has been exhausted.</div>';
    }
  }
}

// Expose
window.CHARACTERS = CHARACTERS;
window.computeAvailableQuestions = computeAvailableQuestions;
window.askQuestion = askQuestion;
window.updateComposureState = updateComposureState;
window.renderQuestions = renderQuestions;

