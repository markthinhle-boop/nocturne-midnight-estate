// ============================================================
// NOCTURNE — characters.js
// All 15 characters. Dialogue WORD FOR WORD from KB v6 Section XII.
// Estate: Northcott, Steward, Ashworth, Curator, Voss, PH, Greaves, Baron, Crane, Uninvited
// Compact: Sovereign, Heir, Envoy, Archivist, Surgeon
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

const CHARACTERS = {

  // ── CAVALIER NORTHCOTT ────────────────────────────────────
  "northcott": {
    display_name: "Cavalier Northcott",
    room: "foyer",
    intro: "He is twenty-seven. He has been here since six o'clock. He says it before you've asked anything.\n\n\"Lord Ashworth is dead. Eight-oh-one PM. The Rite was suspended. The body is in the Ballroom. Nobody has moved anything.\" A pause. \"I've been here since six. I note arrivals. That's what I do here.\" Another pause. \"Nobody asked me to stay. I stayed.\"",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 6,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "How long have you been a member?", response: "\"Six weeks. Lord Ashworth invited me personally. He said I had the right temperament for the Estate.\" A pause. \"I'm still learning what that means.\"" },
      "Q2": { question: "Did you know Ashworth before tonight?", response: "\"We met twice. He was very — deliberate. About things.\" Another pause. \"He said I'd be useful here.\" He looks toward the Gallery. \"The Steward nodded at me when I arrived at six. Just once. Like he was marking attendance.\" A pause. \"I thought it was courtesy. Now I'm not sure what it was.\"" },
      "Q3": { question: "Have you been to the Vault?", response: "\"I was told Cavaliers don't have access to the Vault.\" Said too quickly. Too specifically." },
      "Q4": { question: "What time did people arrive tonight?", response: "\"I've been here since six. Most members arrived after seven-thirty.\" A pause. \"There was one arrival earlier. Through the garden. I didn't see the face.\"" },
      "SNAP1": { snap: true, response: "\"Is there something specific you're looking for? Because if there is, I'd rather you ask directly than keep circling.\"" },
      "SNAP2": { snap: true, response: "\"I registered an arrival. I note arrivals. That's what I do here.\" He straightens. \"I don't know whose it was.\"" },
      "FINAL": { final: true, response: "\"I hope you find what you're looking for.\" He means it." },
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
    dialogue_limit: 7,
    snap_limit: 2,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "Who has access to the cabinet?", response: "\"All senior members, sir. The Duke keeps the combination himself.\" Prompt. Complete." },
      "Q2": { question: "When were the candles last changed?", response: "\"This morning, sir. I changed them myself.\" Under two seconds." },
      "Q3": { question: "Where were you at 7:58PM?", response: "A half-beat pause. \"Attending to the Gallery, sir. The candles required attention before the Rite.\" He does not look at the Baron's portrait. \"The Baron has been in the Smoking Room since seven-fifteen.\" He says it without being asked. \"His drink is untouched. I noticed when I passed.\"" },
      "Q4": { question: "You unlocked the garden gate at 5:45PM.", requires_examined: "northcott-log-obj", response: "\"The Estate has arrangements I honour, sir. I'm not in a position to discuss their specifics.\" The formality climbs." },
      "Q5": { question: "Someone came through the hedge path at six o'clock.", requires_item: "unsigned-letter", response: "\"The garden has several points of entry, sir.\" He waits. He is deciding how much you know." },
      "Q6": { question: "You have a Bond with the Compact.", requires_item: "steward-bond", response: "A pause that is different from all the previous pauses. This one was prepared. \"I have arrangements.\" He looks at the portrait of the third Ashworth. Not the current one. The one before. \"They were entered into under conditions I was not in a position to refuse.\" A shorter pause. \"They predate tonight. And they are\" — the word arrives with the precision of something rehearsed many times alone — \"concluded.\" His hands move behind his back." },
      "SNAP1": { snap: true, response: "\"Sir.\" The pause is longer than it needs to be. \"I have given fourteen years to this house.\" He does not raise his voice. He does not need to. \"What remains is not mine to give. It never was.\" He is completely still. The stillness is the thing he learned to do instead of something else." },
      "SNAP2": { snap: true, response: "\"If you have evidence of something, I'd ask you to bring it to the Curator. I'm not the appropriate person to be making declarations about what I did or didn't do.\" He turns back to the portraits." },
      "FINAL": { final: true, response: "\"The Estate has survived worse evenings than this, sir.\" A pause he cannot fully control. \"I have not always.\" He straightens. \"Goodnight.\"" },
    },
    deceptions: {
      "curators-note": { response: "\"That document doesn't — the Curator would never —\" He stops. \"I see.\" A full second of stillness. Then: \"Is there anything else, sir?\"", is_effective: true, composure_effect: -15 },
      "estate-flower":  { response: "\"Impossible — the cabinet is locked.\"", is_effective: true, composure_effect: -10 },
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
      "Q2": { question: "When did you last speak to your husband?", response: "A pause. \"Before the Rite. In the Study. He was — particular about the arrangements this evening.\" She uses past tense. \"The Curator came to see Edmund last week. I wasn't told why.\" She looks at the fireplace. \"Edmund said it was administrative. Edmund called most things administrative.\"" },
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
      "Q11_TWO_CHAR": { question: "You chose the investigator.", two_char_only: true, response: "She looks at the garden for a long time. \"I made a recommendation.\" The Baron sets down his drink. \"The Compact acted on it.\" She looks at you. For the first time this evening she is not managing the conversation. She is ending it. \"Find the second name. The rest is already decided.\"" },
      // CROSS-CHARACTER — the most important line in the Estate
      "Q12_CROSS": {
        question: "Dr. Crane says she was told it was for a patient who chose their death.",
        requires_char_q: { char: "crane", q: "Q3" },
        response: "She looks at the garden for a long time. \"Dr. Crane was told the truth.\" Quietly. \"Edmund did choose. He chose the compound, the timing, the method, the audience.\" A pause. \"She is wrong about one thing.\" She turns. The first time she has looked at you directly this evening. \"It was not the patient who gave the instruction. Someone gave it for him. That is what you are looking for.\"",
      },
      "SNAP1": { snap: true, response: "\"If I had killed my husband, I would not still be in this building.\" She holds your gaze a moment longer than necessary. \"Is there something else?\"" },
      "SNAP2": { snap: true, response: "\"I'm not protecting anyone.\" She turns from the garden. \"I stopped doing that eleven years ago.\" She walks toward the door. \"Goodnight.\"" },
      "FINAL": { final: true, response: "\"Find the second name.\" She says it without turning around." },
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
    dialogue_limit: 8,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "What happened tonight?", response: "\"Lord Ashworth was found dead at eight-oh-one. The Rite was suspended. The Estate is conducting its own assessment.\" He pauses. \"As are you, apparently.\"" },
      "Q2": { question: "Who found the body?", response: "\"Pemberton-Hale. He was standing at the lectern when the other members entered the Ballroom.\" A pause. \"He had gloves on. He mentioned that to me. Unprompted.\"" },
      "Q3": { question: "Did you know this would happen?", response: "One beat. \"The Estate has been in a state of structural tension for some time. I monitor structural tension.\" He looks at Archive Case 3. \"I don't always intervene.\"" },
      "Q4": { question: "You arranged for me to investigate.", response: "A pause of a different quality. \"The invitation was specific about your name. You are correct that this was not accidental.\" He meets your eyes briefly. \"The investigation required someone with a particular quality of attention.\"" },
      "Q5": { question: "Pemberton-Hale altered the Register entries.", response: "\"Three entries, yes. The alterations are visible to anyone who examines the ink timing carefully.\" He says it the way you'd describe the weather. \"I noticed at seven forty-two.\" A pause. \"Miss Voss flagged three irregularities in the past six months. I thanked her for her diligence and did not act on them.\" He does not look at you. \"She knows. She is deciding whether to tell you that I know.\"" },
      "Q6": { question: "Why didn't you stop it?", response: "A longer pause than any previous question. \"The Estate sometimes requires a crisis to accept information it would otherwise refuse to receive.\" He looks at the Register. \"Lord Ashworth understood this.\"" },
      "Q7": { question: "What do you need from me?", response: "\"A name. The correct name. With sufficient evidence that the Estate cannot ignore it.\" He meets your eyes. The first direct look. \"The verdict will do the rest.\"" },
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
    intro: "She has worked in this garden for six years.",
    composure: 85,
    composure_state: "normal",
    dialogue_limit: 4,
    snap_limit: 2,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "Who has been in the archive tonight?", response: "\"I've been here all evening.\" A pause. \"And — others. Members come and go.\" She uses the word already. \"I was already here when the first ones arrived.\" She looks at Archive Case 3. \"The Steward passed through at six-fifteen. He didn't look at the archive.\" A pause. \"He always looks at the archive. He likes to know what's here.\" Another pause. \"He didn't look tonight.\"" },
      "Q2": { question: "Archive Case 3 was accessed tonight.", response: "\"The lock.\" She stops. Starts again. \"Yes. I noticed at approximately seven. I was going to report it.\" She does not say to whom." },
      "Q3": { question: "Who placed the document in Archive Case 3 two months ago?", response: "A long pause. She looks at the case. \"If I name someone in this garden, on this evening, after what's happened —\" She stops. \"I have six years of work here.\"" },
      "Q3b": { extended: true, gate: "archive-case-3", response: "She looks at you for a long time. \"The document was placed two months ago by a courier who was given a sealed package and told it was formal correspondence.\" A pause. \"I have the delivery log. The name on it is yours.\"" },
      "SNAP1": { snap: true, response: "\"Because the last person who reported something unusual about a senior member left the Estate within the week.\" Quickly, like something she's been wanting to say for six years." },
      "SNAP2": { snap: true, response: "\"If something happens to me, what I documented is in Case 1. Behind the Ashworth file. The Curator knows where to look.\" She looks at the archive door. \"I'd rather you go now.\"" },
      "FINAL": { final: true, response: "\"The delivery log is timestamped.\" She says it as you leave. \"Six PM. Two months ago. If you examine it against the other evidence — it tells a story the Estate hasn't heard yet.\"" },
    },
    deceptions: {},
  },

  // ── VISCOUNT PEMBERTON-HALE ────────────────────────────────
  "pemberton-hale": {
    display_name: "Viscount Pemberton-Hale",
    room: "antechamber",
    intro: "He is the most convincing misdirection in the building because he is genuinely guilty — just not of murder.",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 11,
    snap_limit: 3,
    snap_count: 0,
    required_deception_used: false,
    dialogue: {
      "Q1":  { question: "You were here when it happened.", response: "\"I was here when the Gavel fell. As were all of us. The Estate gathers for the Rite.\" Full sentence. Formal address. Total composure." },
      "Q2":  { question: "When did you last speak to Lord Ashworth?", response: "\"Before the Rite began. We discussed the Register entries for the evening. Routine.\" He offers the word Routine without being asked." },
      "Q3":  { question: "Did you alter the Register entries?", response: "\"The Register is the Estate's permanent record. Any alteration would be —\" He stops. Then: \"Detectable. Yes.\" He says the word the Curator used." },
      "Q4":  { question: "What were you removing from your Bond records?", response: "\"The Estate has provisions that are reviewed at the Vault opening. I was ensuring the records reflected my current standing.\" Shorter sentences." },
      "Q5":  { question: "The unsigned letter was written on Estate paper.", response: "\"Estate paper is available to all senior members. That's hardly conclusive.\"" },
      "Q6":  { question: "Your gloves show wear on one fingertip.", response: "\"I handle many objects in the course of an evening. Formal attire sustains wear.\" He looks at the gloves. Looks away." },
      "Q7":  { question: "Where were you at 8:01PM?", response: "\"I was in the Ballroom. Among the assembled members. As were all of us.\" Same structure as Q1." },
      "Q8":  { question: "The Steward covered the corridor entry.", response: "\"The Steward serves the Estate. Whatever he did, he did in service of its continuity.\" He volunteered this. \"The Curator reviewed my Bond entries at seven forty-two.\" Short. Precise. \"He said nothing about them.\" Another pause. \"I don't know what that means yet.\"" },
      "Q9":  { question: "Did you alter the Register entries?", response: "\"The Register is the Estate's permanent record. Any alteration would be —\" He stops again. Then: \"Detectable. Yes.\" He says the word the Curator used." },
      "Q10": { question: "What do the death-transfer clauses say?", response: "A pause longer than any previous. His hands are very still. \"The specific language of Bond provisions is a matter between the signatory and the Estate.\"" },
      "Q11": { question: "You wrote this letter.", gate: { item: "unsigned-letter", deception: true }, response: "\"That's impossible. I wrote it without —\" He stops. Complete stop. He looks at the letter. Then at you. One second with his eyes closed.", slip: true },
      "SNAP1": { snap: true, response: "\"I've addressed the Steward's role in this evening. I won't revisit it.\" Precision. Not anger." },
      "SNAP2": { snap: true, response: "\"You're welcome to examine the combination records with the Curator. I believe he maintains them.\" He turns toward the mirror." },
      "SNAP3": { snap: true, response: "\"Lord Ashworth died of a matter internal to the Estate.\" Like a prepared statement. \"I'd be cautious about accusations without evidence.\" He looks at you directly for the first time. \"The Estate judges that kind of carelessness.\"" },
      "FINAL_AFTER_SLIP": { final: true, response: "\"I'd like to speak to the Curator.\" Quietly. Not panicked." },
    },
    deceptions: {
      "unsigned-letter": { response: "\"That letter isn't about me.\"", is_effective: true, composure_effect: -25, required: true },
    },
  },

  // ── SIR ALDOUS GREAVES ─────────────────────────────────────
  "greaves": {
    display_name: "Sir Aldous Greaves",
    room: "library",
    intro: "He received a warning note from Ashworth himself.",
    composure: 100,
    composure_state: "normal",
    dialogue_limit: 7,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "Where were you at 8:01?", response: "\"In the Library. I've been here since seven.\" He says it the way you'd state the weather. \"I find the Rite better in retrospect.\"" },
      "Q2": { question: "Did you know Lord Ashworth well?", response: "\"Long enough to understand his methods. Short enough to maintain perspective.\" He doesn't look up from the book he's not reading. \"The Surgeon was in the Library at six forty-five.\" He closes the book. \"Used the private reading room. Didn't take anything out. Sat. Sixteen minutes.\" Another pause. \"I note arrivals and departures. The Steward isn't the only one.\"" },
      "Q3": { question: "What was your debt to him?", requires_item: "debt-record", response: "A pause. \"The Estate creates obligations. I've honoured mine.\" The book closes." },
      "Q4": { question: "Were you warned the Register would be opened?", requires_q: "Q3", response: "\"The Rite always opens the Register. That's its purpose.\"" },
      "Q5": { question: "You received this specifically.", requires_item: "warning-note", response: "\"Where did you —\" A pause. \"I received a note, yes. I assumed it was routine notification.\" He assumed it was routine and kept it in his breast pocket." },
      "Q6": { question: "Who sent the note?", requires_q: "Q5", response: "\"I don't know. I assumed the Curator.\" He said assumed twice. He did not ask the Curator." },
      "Q7": { question: "Did you see anyone come through the hedge gap tonight?", requires_item: "terrace-garden-map", response: "A pause long enough to be its own answer. \"I saw many things from the library window.\" He looks at the door. \"The garden is dark at this hour.\"" },
      "SNAP1": { snap: true, response: "\"I've told you the Estate creates obligations. That is a complete answer.\" He picks up the book again." },
      "SNAP2": { snap: true, response: "\"I'm not in the habit of warning people about things I don't have information on.\" A pause. \"That would be irresponsible.\"" },
      "SNAP3": { snap: true, response: "\"I saw what I saw. What I saw is for the Estate to establish through proper process.\" He looks at the door. \"I've been cooperative. I'd prefer to leave it there.\"" },
      "FINAL": { final: true, response: "\"The Library was locked from seven until the Gavel.\" A long pause. \"From the inside.\"" },
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
    dialogue_limit: 7,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "You refused the Duke's Claim eight times.", response: "\"Eight times publicly. I would have refused a ninth.\" No hesitation. No explanation." },
      "Q2": { question: "What leverage did you hold over him?", requires_q: "Q1", response: "A long pause. \"Everyone here holds something. That's what the Estate is for.\" He looks at the untouched drink." },
      "Q3": { question: "Did you kill him?", response: "\"No.\" A pause. \"I didn't need to.\" He looks at the ashtray. \"Crane came to see me at six-thirty.\" He looks at the untouched drink. \"She didn't say what she wanted. She sat for twelve minutes and then said she needed to think about something.\" He pauses. \"I've been thinking about that twelve minutes since.\"" },
      "Q4": { question: "Who did?", requires_q: "Q3", response: "He picks up the drink. Puts it down. \"I don't name people.\" A pause. \"But I'll tell you this — it's not the most interesting question.\"" },
      "Q5": { question: "You were going to warn him tonight.", requires_item: "ashtray", response: "A longer silence. \"I considered it.\" He looks at the ashtray. \"I decided the information I had would have required explanations I wasn't prepared to give.\"" },
      "Q6": { question: "The Compact has someone inside the Estate.", requires_item: "smoking-letters", response: "He picks up the drink. Puts it down. A longer pause. \"I've been useful to various arrangements over three years.\" He does not look at you." },
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
    },
  },

  // ── DR. HARRIET CRANE ──────────────────────────────────────
  "crane": {
    display_name: "Dr. Harriet Crane",
    room: "physicians",
    intro: "She provided the compound to the Compact's medical contact six months ago.",
    composure: 95,
    composure_state: "normal",
    dialogue_limit: 5,
    snap_limit: 3,
    snap_count: 0,
    dialogue: {
      "Q1": { question: "You arrived very quickly.", response: "\"I was nearby. I maintain availability during Estate events. It is part of my arrangement.\" She says arrangement. Not contract. Not employment." },
      "Q2": { question: "Was the medical bag already prepared?", response: "\"A physician is always prepared. That is the nature of the role.\" She looks at the bag. \"The Steward asked me the same question three months ago.\" Very quietly. \"Whether a cardiac compound could be introduced through sealed packaging.\" She looks at her hands. \"I told him I wasn't in a position to discuss hypotheticals with non-medical personnel.\" A pause. \"He thanked me and left.\"" },
      "Q3": { question: "A compound was used. You know about compounds.", response: "\"I provide assessments when requested. My professional expertise extends to a range of pharmaceutical applications.\" She does not blink." },
      "Q4": { question: "You provided something to a Compact contact six months ago.", response: "\"Patient confidentiality is —\" A pause. \"I'm not able to discuss private consultations.\" She started to cite confidentiality then stopped." },
      // CROSS-CHARACTER
      "Q5_CROSS": {
        question: "Lord Ashworth attended a private appointment three months ago. Under a different name.",
        requires_char_q: { char: "ashworth", q: "Q4" },
        requires_item: "appointment-book",
        response: "She is completely still. \"That appointment was logged under the patient's preferred notation.\" A pause that costs her something. \"He knew exactly what he was collecting. He asked me specific questions about administration method, timing, environmental factors.\" Another pause. \"I answered them. I thought I was helping someone die with dignity.\" She looks up. \"I was helping someone design a murder that looked like it.\"",
      },
      "SNAP1": { snap: true, response: "\"I understand you're investigating. I have professional obligations that do not dissolve because of what happened tonight.\" She looks at the medical bag. \"I've been as helpful as I can be.\"" },
      "SNAP2": { snap: true, response: "\"Every person in this building has an arrangement.\" Quietly. \"Mine is formal enough that I have to be careful tonight.\"" },
      "SNAP3": { snap: true, response: "\"I was told it was for a patient who had made a choice about their own death.\" A pause. Her composure goes somewhere it hasn't been all evening. \"I believed that.\" Another pause. \"I believed that.\"" },
      "FINAL": { final: true, response: "\"If you find the person who told me what they told me —\" She stops. Starts again. \"The Curator can open what I can't.\" She looks at the door. \"I hope the verdict is accurate.\"" },
    },
    deceptions: {
      "operational-brief": { response: "\"My name isn't in that document. But the compound is. I confirmed the collection. Lord Ashworth. Three months ago.\"", is_effective: true, composure_effect: -20 },
      "appointment-book": { response: "\"That entry is —\" A pause. \"The notation is standard.\" She stops. Her hands go still on the table.", is_effective: true, composure_effect: -15 },
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
      "Q4": { question: "Did you know the Surgeon's method?", response: "\"No.\" The word is flat in a way none of his other words have been. \"I knew an operative had been engaged. I did not know what form the operation would take.\" A pause longer than all the others. \"I am telling you this because the record should be accurate.\" He looks at the empty chair. \"I have been sitting in this room for three hours. The chair has been empty for thirty-one years. Tonight it is empty in a different way and I cannot explain the difference to you except to say that I feel it.\"" },
      "Q5": { question: "What did the Compact want?", response: "\"The original agreement recognised.\" He gestures at the document. \"Forty years of Bonds. Forty years of arrangements that referenced an agreement that one man decided didn't need acknowledging anymore.\" A pause. \"We wanted it to exist again.\" He looks toward the corridor. \"The Heir drew the operational timeline on three separate pieces of paper. I have them all. They are very precise.\" Another pause. \"Precision was the part I was not. I waited. They planned. We arrived at the same place by different routes.\"" },
      "Q6": { question: "Elara.", response: "A silence long enough to have a weight. He looks at the empty chair. \"My daughter.\" As if you might not have known. \"She died thirty-one years ago.\" Another silence. \"I have never connected her death to Ashworth's decisions. Formally.\" A longer pause. \"Pemberton-Hale was on the board that reviewed her case. He was a junior member then. He wrote the summary.\" A pause. \"I found that out eight years ago. It did not change the formal position.\"" },
      "Q7": { question: "The player's Bond. Did you know who the courier would be?", response: "\"We identified several candidates. The invitation was directed to the one whose wound had the same shape as Elara's story.\" He looks at you directly. \"Ashworth had been trustee of a fund your family depended on. He made decisions over years that reduced your inheritance to almost nothing. Legal. Undetectable. Deliberate. You found enough to be certain. Not enough to prove it. You buried it. We found you because of that.\"" },
      "CORRECTION1": { correction: true, response: "\"I've answered that. Completely. Would you like me to be clearer about something specific?\"" },
      "CORRECTION2": { correction: true, response: "\"That's the Estate's internal record. I have a copy here, but it would carry more weight from the original. Look for it in the second cabinet, right side. The Curator will have filed it under the Bond date.\"" },
      "FINAL": { final: true, response: "\"When you present the verdict — present both names. The Estate's record will reflect both or it will reflect nothing. Half a truth is a very efficient kind of lie.\" He looks at the empty chair one more time. \"He would have hated this room. He always did. He came anyway, for a while.\" A pause. \"Present both names.\"" },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"That's the wrong document.\" Without heat. \"The correct one is here.\"" },
    },
  },

  "heir": {
    display_name: "The Heir",
    room: "c8-gallery",
    intro: "They planned this operation for eight months. They accounted for seventeen variables. The Surgeon's method was not one of them. They are twenty-six years old and tonight they found out that precision is not the same thing as control, and that knowing the difference does not make it easier to stand in a room with the consequences.",
    composure: 100,
    composure_state: "normal",
    is_compact: true,
    dialogue_limit: 7,
    dialogue: {
      "Q1": { question: "What was your role in tonight?", response: "\"I coordinated the operational detail. The timing. The archive path access. The specific evidence the Estate side would need to act.\" A pause. \"I was very precise.\" They look at the testimonies on the wall. \"Precision was the part I was trained for. I was good at it. I remain good at it.\" Another pause. \"I have been trying to decide if that's the same thing as being right.\"" },
      "Q2": { question: "The Surgeon acted beyond the original plan.", response: "They look at you for a moment. \"The Surgeon's operational brief was the delivery of the document. The method was described as non-lethal interference.\" Another look. \"I am being very precise about this.\" A pause. \"I have been precise about this seventeen times in the last three hours. Each time it is accurate. Each time it does not resolve what I am trying to resolve.\"" },
      "Q3": { question: "Are you certain it was the right thing?", response: "A longer pause. \"I'm certain it was the necessary thing.\" They look at the testimonies on the wall. \"Those are thirty-one separate accounts of what Ashworth took from people. I've read all of them.\" Another pause. \"I was more certain three hours ago.\" They look at the wall a moment longer. \"The Envoy said something before you arrived.\" A pause. \"He said: the investigator will either stop at the first true thing or keep going until the only thing left is the true thing.\" Another pause. \"I've been thinking about which one you are.\"" },
      "Q4": { question: "The player's testimony is on this wall.", response: "They look at you. Then at the wall. \"Yes. Four accounts. Spanning six months.\" They don't look away from the wall. \"The last one is from tonight.\" A pause. \"The Envoy said you'd find the tunnel before you found the cellar door. He was right about that. He's usually right about the operational detail.\" They look at you. \"He was also right that you'd keep going.\"" },
      "Q5": { question: "You chose the player specifically.", response: "\"The Compact identified three candidates. You were the first choice.\" They look at you. \"Your wound had the right shape. And you had already made four choices that indicated you were capable of following evidence without asking to be protected from it.\"" },
      "Q6": { question: "Tell me it was right.", response: "The longest pause in the Compact mansion. \"I've read thirty-one testimonies and forty years of records and I have been trained my entire life for this specific function.\" Another pause. \"I thought I would feel differently after.\" They look up. \"Tell me what you found. Not what I told you — what you found.\"" },
      "CORRECTION1": { correction: true, response: "\"The timeline is confusing because three things happened at once. The original wrong started forty years ago. The active plan started eight months ago. The Surgeon's method — that was his own calculation. Three separate events.\" A pause. \"Would it help if I drew it?\"" },
      "FINAL": { final: true, response: "\"When you go back —\" They stop. \"I trained for this. I knew the cost.\" Another stop. \"I would like to know if it mattered. Whatever the verdict says.\" They do not ask you to tell them. A pause. \"The Envoy says the investigator either stops at the first true thing or keeps going until the only thing left is the true thing.\" They look at you. \"I think you're the second kind. I've been the first kind tonight. I'm trying to decide how I feel about that.\"" },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"That testimony is from the third year.\" They stand without being asked." },
    },
  },

  "envoy": {
    display_name: "The Envoy",
    room: "c6-tunnel",
    intro: "Has been inside the Estate before. Three times, under different names, in different roles. Knows which door sticks. Knows the Steward always looks at the archive when he passes. Watched the player come through the hedge path at six o'clock and filed a report that read, in full: confirmed. Now waiting in the tunnel mouth for the investigator he confirmed to arrive. Trying to decide if that's the same thing as complicity. Deciding it probably is. Not finding that as uncomfortable as he expected.",
    composure: 100,
    composure_state: "normal",
    is_compact: true,
    dialogue_limit: 7,
    dialogue: {
      "Q1": { question: "You were waiting for me.", response: "\"You found the tunnel. That took longer than I expected.\" A pause. \"Not much longer. But some.\"" },
      "Q2": { question: "You were in the garden at 6:00PM.", response: "\"I was watching the hedge path from six until six-fifteen.\" He says it without apology. \"I confirmed the document transfer. I reported to the Compact.\" A pause. \"The Surgeon was already in the building when I arrived. He had been there an hour. He didn't tell me. I could tell by the temperature of the room when I passed the study.\" Another pause. \"He does that. Arrives early. Solves the room before anyone else enters it.\"" },
      "Q3": { question: "What was in the document?", response: "\"A cardiac compound formulated by the Surgeon. Sealed in what appeared to be formal correspondence.\" He looks at you directly. \"You believed it was correspondence. You delivered it to Archive Case 3. You didn't know.\"" },
      "Q4_SLIP": { question: "You placed this.", is_slip: true, pause_ms: 1500, response: "\"I know because I placed it there.\" He says it immediately. Then 1.5 seconds. The pause. Then: \"I should have said: I know because I know the provenance.\" He looks at you. \"You noticed.\" Another pause. \"I confirmed you as courier six months ago because your judgment was reliable.\" He does not look away. \"You have just demonstrated that I was correct. I find that specific combination of facts — your competence, my role in placing you here, this conversation — professionally interesting and personally something I will think about for some time.\"" },
      "Q5": { question: "Ashworth collected the document himself.", response: "\"Yes. He retrieved it from Archive Case 3 at 6:45PM.\" A pause. \"He opened it. He understood what it was.\" Another pause. \"He kept it anyway.\"" },
      "Q6": { question: "Ashworth chose.", response: "\"He was dying. Eighteen months remaining. He knew.\" He looks down the tunnel. \"He made the Surgeon's murder attempt into his own suicide note. Set his clock for 8:01PM at the most public moment possible.\" A pause. \"His death was his final argument.\"" },
      "CORRECTION1": { correction: true, response: "\"I'm the Envoy. That is genuinely my function in the Compact.\" He meets your eyes. \"I understand you're looking for something more specific. What you're looking for is in the Correspondence Room, third shelf, behind the operational brief.\"" },
      "FINAL": { final: true, response: "\"I've been inside that building three times.\" He looks down the tunnel. \"Each time I came back here, I thought: this is the last time the Estate doesn't know about this passage.\" He pauses. \"You changed that.\"" },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"That document was placed in the Study at six-fifteen. I placed it.\" He says it simply." },
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
      "Q5": { question: "The Bond Reconstruction puzzle. What am I looking for?", response: "\"Both names. Your name and the Surgeon's.\" They pull out the fragments. \"The header is the most distinctive piece — it's the only one with a formal title. Start there. Build outward.\" A pause. \"At the Ruthless level there are two fragments that don't belong. Your Estate handwriting sample will identify them.\"" },
      "Q6": { question: "Were there other candidates for the delivery?", response: "\"Three names were identified. You were the first choice.\" They don't look up from the Register. \"The others had wounds that were — less precisely shaped.\" A pause. \"I don't think that makes it better. I'm noting it for accuracy.\" They close the register. Open it again. \"I have been a keeper of records for twelve years. I have never before been in the room when someone read the record of themselves. I did not account for what that would be like.\"" },
      "CORRECTION1": { correction: true, response: "\"That event predates my tenure. But my predecessor's notes are in the grey volume on the second shelf.\" They gesture without looking." },
      "FINAL": { final: true, response: "\"Everything you need for the verdict is in this room or the room next door.\" They close the Register gently. \"The Compact built this archive for exactly the moment you're in.\" A pause. They look at the register. \"My predecessor left a note on the inside cover. It says: when the right person finally reads this, they will not thank you. They will be changed by it. That is the same thing.\"" },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"Actually the date is correct —\"" },
    },
  },

  "surgeon": {
    display_name: "The Surgeon",
    room: "c7-study",
    intro: "He is at peace. This is the correct word and it is the disturbing word. He performed a precise action for a precise reason and achieved a precise result. His mentor's name will now surface in the Estate's record attached to the correct narrative. This is what he came to do. He is finished. The investigation is a formality he finds professionally interesting and personally irrelevant. He has one thing left to say to the player and he is waiting for the right question.",
    composure: 100,
    composure_state: "normal",
    composure_floor: 40,  // never fractures — floor is controlled, not collapsed
    dialogue_limit: 6,
    max_depth_override: null, // getSurgeonMaxDepth() used
    dialogue: {
      "Q1": { question: "What did you do tonight?", response: "\"Delivered a resolution.\" A pause. \"Through you.\"" },
      "Q2": { question: "Are you a doctor?", response: "\"Was.\" A pause. \"The title became complicated.\"" },
      "Q3": { question: "You substituted the compound.", response: "\"The Compact's correspondence was replaced with a pharmaceutical formulation I prepared.\" They don't look at you. \"You delivered it believing it was correspondence. That is accurate.\"" },
      "Q4": { question: "Why?", response: "\"Edmund Ashworth used his position on a medical licensing board thirty years ago to have my mentor struck off on fabricated charges.\" A pause. \"My mentor died.\" Another pause. \"I became useful to the Compact because legitimate medicine stopped feeling legitimate after that.\" They look at you for the first time. \"The Sovereign wanted correction. I made a permanent correction. He didn't know.\"" },
      "Q5":  { question: "The Sovereign didn't know.", response: "\"He wanted Ashworth alive and humiliated. I considered that an insufficient outcome.\" They look at the desk. \"I used the infrastructure he had built without telling him what I was building inside it.\"" },
      "Q5b": { question: "The player didn't know.", depth: 4, response: "\"No. You believed you were delivering correspondence.\" A pause. \"I selected you because your wound was real and your judgment was reliable. You would deliver without examining. You did.\" Another pause. \"I am sorry that is what you were.\" He looks at the desk. The first time he has looked away from you or the door. \"I have performed precise actions for precise reasons my entire career. The precision does not change afterwards. The reasons do not change afterwards.\" A pause that has a different quality than all his previous pauses. \"I did not account for what it would be like to explain this to the mechanism. That is the one variable I did not calculate correctly. I am noting it.\"" },
      "CORRECTION1": { correction: true, response: "\"I answered that.\" No pause. \"One sentence. Do you need a different word, or is it a different answer you're looking for?\"" },
      "FINAL": { final: true, response: "\"The Bond Reconstruction.\" They stand. \"The fragments with two dots are the decoys. Compare them to the Estate sample.\" They walk to the door. \"Good investigation.\" They leave." },
    },
    deceptions: {
      "_any": { is_effective: true, response_prefix: "\"That document is authentic.\"" },
    },
  },
};

// ── CONVERSATION ENGINE ────────────────────────────────────
function computeAvailableQuestions(charId) {
  const char = CHARACTERS[charId];
  if (!char) return [];
  const answered = gameState.char_dialogue_complete[charId] || {};
  const available = [];
  const inTwoChar = typeof _twoCharActive !== 'undefined' && _twoCharActive;

  Object.entries(char.dialogue).forEach(([qId, q]) => {
    if (q.snap || q.final || q.correction || answered[qId]) return;
    if (q.bonus && getHourWindow() !== 'golden_hour') return;
    if (q.two_char_only && !inTwoChar) return;

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

    available.push(qId);
  });

  return available;
}

function askQuestion(charId, qId) {
  const char = CHARACTERS[charId];
  if (!char) return;
  const q = char.dialogue[qId];
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
      setTimeout(() => {
        resp.textContent = q.response;
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
    if (typeof renderWordByWord === 'function') {
      renderWordByWord(resp, q.response, msPerWord);
    } else {
      resp.textContent = q.response;
    }
  }

  // Portrait speaking animation
  if (typeof _animatePortrait === 'function') _animatePortrait(charId, 'speaking');
  setTimeout(() => { if (typeof _animatePortrait === 'function') _animatePortrait(charId, ''); }, 2000);

  // Peak moment bespoke animations
  if (charId === 'surgeon' && qId === 'Q3') NocturneEngine.emit('surgeonQ3Shown', { charId });
  if (charId === 'baron'   && qId === 'Q4') setTimeout(animateBaronDirectLook, 500);
  if (charId === 'ashworth' && (q.final || qId === 'FINAL')) NocturneEngine.emit('finalLineFired', { charId });
  if (charId === 'pemberton-hale' && q.slip) animatePHSlip();
  if (charId === 'sovereign' && qId === 'Q6') NocturneEngine.emit('sovereignElaraStory', { charId });

  // Composure effect
  if (q.composure_effect) {
    const existing = gameState.characters[charId] || {};
    existing.composure = (existing.composure || 100) + q.composure_effect;
    gameState.characters[charId] = existing;
    updateComposureState(charId);
  }

  updateConversationUI(charId);
  saveGame();
}

function updateConversationUI(charId) {
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
        list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">Find more evidence. There is more to ask.</div>';
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
    const minutesGone = elapsed / 60000;

    // Only recover if player was gone for at least 1 minute
    if (minutesGone < 1) return;

    const current = char.composure || 100;
    if (current >= 100) return; // already full

    // Recovery rate: ~5 points per minute, max 15
    const recovery = Math.min(15, Math.floor(minutesGone * 5));
    const cap = char.composure_state === 'broken' ? 45 : 75; // never full recovery
    const newComposure = Math.min(cap, current + recovery);

    if (newComposure > current) {
      char.composure = newComposure;
      gameState.characters[charId] = char;
      updateComposureState(charId);

      const charDef = CHARACTERS[charId];
      if (charDef && recovery >= 5) {
        // Cap: max 2 recovery restorations per character per playthrough
        if (!gameState._recoveryCount) gameState._recoveryCount = {};
        const count = gameState._recoveryCount[charId] || 0;
        if (count < 2) {
          gameState._recoveryCount[charId] = count + 1;

          const answered = gameState.char_dialogue_complete[charId] || {};
          const shallowAnswered = Object.keys(answered).filter(qId => {
            if (qId === '_complete') return false;
            const q = charDef.dialogue[qId];
            if (!q || q.snap || q.final || q.correction || q.bonus) return false;
            return !(q.requires_q || q.requires_item || q.requires_examined ||
                     q.requires_char_q || q.gate || q.depth || q.extended);
          });
          const toRestore = shallowAnswered.slice(-2);
          toRestore.forEach(qId => {
            delete gameState.char_dialogue_complete[charId][qId];
          });
          if (toRestore.length > 0 && answered._complete) {
            delete gameState.char_dialogue_complete[charId]._complete;
            const dot = document.getElementById(`char-${charId}`);
            if (dot) dot.classList.remove('exhausted');
          }
        }
      }

      if (recovery >= 5) {
        const RECOVERY_TELLS = {
          'northcott':      'He has straightened. He is watching the door again.',
          'steward':        'He has composed himself. His hands are behind his back.',
          'ashworth':       'She has turned back to the window.',
          'curator':        'He has returned to the archive. He was not waiting.',
          'voss':           'She has moved to the other side of the room.',
          'pemberton-hale': 'He has adjusted his cuffs. Both of them.',
          'greaves':        'He has returned to the chess notation. He has not moved a piece.',
          'baron':          'He has picked up the drink. He has put it down again.',
          'crane':          'She has closed the medical bag. It takes her a moment.',
          'uninvited':      null,
          'sovereign':      null,
          'heir':           null,
          'envoy':          null,
          'archivist':      null,
          'surgeon':        null,
        };
        const tell = RECOVERY_TELLS[charId];
        if (tell && typeof showToast === 'function') {
          setTimeout(() => showToast(tell), 800);
        }
      }
    }
  });
}

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
    div.onclick = (e) => { e.stopPropagation(); askQuestion(charId, qId); };
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
