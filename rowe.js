// ── EDMUND ROWE ENGINE ─────────────────────────────────────────
// rowe.js — standalone engine. Not part of composure/technique system.
// Flow: intro → choice (Q1-Q4, any one) → FUNNEL auto-fires → duel → result → Q5/Q6 unlock
// Rowe sits at 94th percentile — beatable, not comfortably.
// KB v5.0 · Nocturne Studios LLC · MMXXVI

'use strict';

// ── STATE ──────────────────────────────────────────────────────
const ROWE_STATE = {
  choice_made:        false,   // any Q1-Q4 answered
  funnel_fired:       false,   // FUNNEL shown
  duel_complete:      false,   // duel finished
  duel_outcome:       null,    // 'player_wins' | 'rowe_wins' | 'draw'
  duel_score_player:  0,
  duel_score_rowe:    0,
  reveal_triggered:   false,
  visit_count:        0,
  iq_score:           null,    // from duel: 0-3
};

// ── ROWE DUEL DIALOGUE BANK ────────────────────────────────────
// 270 lines. Per-round margin commentary × 10 cycles.
// Final score × 10 cycles. Replay offer × 10 cycles.
// Margin tiers: crushed | edged | photo | close_loss | comfortable_loss | had_time | timeout
// All lines calibrated to Alistair Rowe: precise, dry, never generic.

const ROWE_ROUND_LINES = {

  // ── TIER 1: CRUSHED HIM (beat by 3s+) ─────────────────────
  crushed: [
    [ // Round 1
      "Three seconds. In the first round. I don't know whether to be impressed or suspicious.",
      "You found it before I finished forming the question. That's either instinct or luck and I intend to find out which.",
      "Round one and you beat me by three seconds. I'm recalibrating.",
      "That was fast. Uncomfortably fast. I'll be paying closer attention.",
      "Three seconds ahead of me. In round one. I haven't been three seconds behind anyone in four years.",
      "You crushed round one. I notice I'm slightly annoyed about that. Professional hazard.",
      "That margin in the first round means either you've seen this pattern before or you think differently from most people. Both are interesting.",
      "Round one goes to you — significantly. I'll need to see if that holds.",
      "Three seconds. I was still identifying the rule when you finished. That doesn't happen often.",
      "You beat me by three seconds in round one. I'm going to be watching your eyes on round two.",
    ],
    [ // Round 2
      "Again. You beat me again — by more than two seconds. I'm beginning to revise my entire morning.",
      "Round two. Same margin. Either you're consistent or I'm having an unusually slow evening.",
      "You found it faster in round two than round one. You're warming up. So am I. Round three will be interesting.",
      "Two rounds. Two margins in your favour. I'm not going to pretend that's comfortable.",
      "Twice now. Three seconds each time. There's a pattern here and I don't mean the puzzle.",
      "Round two and you beat me again. I would like the record to show I identified the correct answer.",
      "You're accelerating. That's the interesting part. You got faster. Most people slow down.",
      "Round two goes to you — convincingly. I'm reconsidering whether this was a good idea.",
      "Two consecutive rounds by significant margins. I'm either having a bad night or you're having a very good one.",
      "You beat me twice by meaningful margins. I've assessed forty-three investigators this year. You're the third to do that.",
    ],
    [ // Round 3
      "Three for three. By significant margins. I owe you an explanation of everything I've found since six-forty and I intend to give it completely.",
      "You swept me. All three rounds, all comfortable margins. I find I'm not upset about it. I'm interested.",
      "Three rounds. Three margins in your favour. Whatever Ashworth saw in you — I understand it now.",
      "You beat me in all three rounds. I've been doing this for eleven years. That is a very short list of people.",
      "Three for three. I'm going to need a moment to absorb that. Take it as a compliment that I need the moment.",
      "Swept. Comprehensively. I was at ninety-four percent and you made it look comfortable. That's not nothing.",
      "All three. By meaningful margins. I said I'd tell you everything if you beat me. I'm a man of my word.",
      "Three rounds. Three losses. Each comfortable. I'm revising my entire model of this evening.",
      "You beat me in every round by significant margins. Either this was a uniquely bad performance from me or a uniquely good one from you. Possibly both.",
      "Three for three. I've been assessed myself, once, by someone I considered exceptional. You remind me of that experience.",
    ],
  ],

  // ── TIER 2: EDGED HIM (beat by 1-3s) ──────────────────────
  edged: [
    [ // Round 1
      "One round to you. One and a half seconds. That's close enough to be meaningful.",
      "You got there first. By a small margin. Round one tells me you can find the pattern. It doesn't tell me how reliably.",
      "Round one goes to you — narrowly. I had it half a second later. Small margins compound.",
      "A second and change. You edged me in round one. I'll note that without making too much of it.",
      "Round one: you first, me second, less than two seconds between us. That's a good round.",
      "You found it before I did. Not by much. Round one is yours.",
      "Narrow win for you in round one. I was close. Close matters.",
      "You beat me in round one. The margin was small enough that I'm not embarrassed and large enough that I'm paying attention.",
      "One point, one second and change. Round one to you. Let's see if that holds.",
      "You edged round one. I was right behind you. That's the interesting part — not that you won, but how close I was.",
    ],
    [ // Round 2
      "Two rounds. Both close. You're consistently slightly ahead of me and I find that more unsettling than if you'd crushed me.",
      "Round two also goes to you. Still a small margin. You're not getting faster and neither am I. We're matched.",
      "Two narrow wins. You're working at my level. That's a specific kind of compliment.",
      "You edged round two as well. The margins are similar. You have a consistent advantage that I cannot currently explain.",
      "Round two to you. Again close. Again real. Two close wins in sequence is a pattern, not luck.",
      "Two rounds, two small margins in your favour. I'm slightly behind you and I know it.",
      "You beat me again. Close again. I notice I'm solving faster trying to catch up. That's your doing.",
      "Two for two by small margins. Most people who beat me in round one slow down in round two. You didn't.",
      "Round two: yours. Similar margin to round one. You're frustratingly consistent.",
      "Two consecutive close wins. You're running slightly ahead of me. I respect that more than a blowout.",
    ],
    [ // Round 3
      "Three close wins. You beat me in every round by a second or two. That's not luck — that's a reliable advantage.",
      "Three rounds, three narrow margins in your favour. You're consistently just ahead of me. I find that impressive.",
      "You edged all three. Never by much, always enough. That's the most difficult thing to do — maintain a small advantage.",
      "Three for three, all close. You were never dominant and never behind. That's a very controlled performance.",
      "You beat me in every round. The margins were small. The consistency wasn't. Well done.",
      "Three rounds. All yours. All close. I was right behind you the entire time and couldn't close the gap.",
      "Three close wins. You had something like a one-second advantage in each round. Maintained across all three. Remarkable.",
      "All three rounds, all narrow. You beat me without ever pulling away. That requires a kind of steady precision I don't often see.",
      "Three for three. Close margins, consistent result. You're slightly faster than me at this and you stayed that way. I'll remember that.",
      "You edged me in all three rounds. I've been beaten before. I haven't been beaten this specifically before.",
    ],
  ],

  // ── TIER 3: PHOTO FINISH (within 1s either way) ───────────
  photo: [
    [ // Round 1
      "Half a second. In either direction that round could have gone differently. Noted.",
      "Round one: a coin flip, effectively. We found it at almost exactly the same moment.",
      "That was close. Within a second. Round one is mine by the thinnest margin.",
      "We were simultaneous, practically. Round one. The next one will tell us more.",
      "Less than a second between us in round one. That's a genuine contest.",
      "Round one came down to fractions of a second. That's not luck on either side — that's two people working at the same speed.",
      "Within a second. Round one. I'll take it but I won't pretend it was decisive.",
      "Photo finish in round one. We found the same pattern at nearly the same moment. Interesting.",
      "Round one: mine, barely. You were right there. Right there.",
      "Half a second separated us in round one. Thirty more milliseconds and this round would be yours.",
    ],
    [ // Round 2
      "Two photo finishes. We're evenly matched. I find that both flattering and inconvenient.",
      "Round two also within a second. We're working at the same pace. This round three will actually determine something.",
      "Another coin flip. Round two. We're genuinely neck and neck.",
      "Two rounds, two fractions-of-a-second margins. You are exactly as fast as I am. I wasn't expecting that.",
      "Round two: close again. I'm starting to think we think the same way. That's either reassuring or alarming.",
      "We found it at almost the same moment again. Round two. I'm beginning to enjoy this.",
      "Two rounds, both within a second. You're matching my pace. That's the correct word — matching.",
      "Another photo finish. Round two. The margin is so small I'm not sure it means anything other than we're equal.",
      "Round two: mine by half a breath. You were right there again.",
      "Two consecutive photo finishes. We're operating at nearly identical speeds. Round three decides everything.",
    ],
    [ // Round 3
      "Three photo finishes. Three rounds decided by fractions of a second. I've been doing this for eleven years and that's never happened.",
      "All three rounds within a second of each other. You matched my pace across the entire duel. That's extraordinary.",
      "Three rounds, all within a breath. You're as fast as I am. I find that I need a moment to absorb.",
      "Every round within a second. You weren't lucky — you were precise. That's a different thing.",
      "Three photo finishes. All three. I don't know what to make of you and I find that's a very good sign.",
      "All three decided by fractions of a second. We found the same patterns at the same pace. We think similarly. That will be useful or dangerous.",
      "Three rounds, three margins of under a second. You ran exactly with me the entire time. I was not expecting this.",
      "Photo finish across all three rounds. You matched me. Precisely. I respect that more than a win.",
      "Three rounds. All within a second in either direction. I came here to assess you. I appear to have found a peer.",
      "All three within a breath. Every single round. I don't revise my estimates often. I'm revising this one completely.",
    ],
  ],

  // ── TIER 4: CLOSE LOSS (lost by 1-3s) ─────────────────────
  close_loss: [
    [ // Round 1
      "Round one to me. You were close — within two seconds. That's respectable for a first round.",
      "I had round one. You were right behind me. Less than three seconds. That's not a gap — that's a margin.",
      "One round to me, two seconds ahead of you. You found the pattern. You were just slightly slower finding it.",
      "Round one: mine. You got there. You were close. Two seconds in round one means nothing about round three.",
      "I finished round one about two seconds before you. You were working. You had the right instinct.",
      "Round one goes to me — narrowly enough that I'm not comfortable about it. You're close.",
      "Two second margin in round one. You found the correct answer. The gap is time, not accuracy.",
      "Round one: my win, your close loss. That's a meaningful distinction. You were right — just not quite first.",
      "I got round one by about two seconds. You weren't far behind. The distance between us in round one is closeable.",
      "Round one to me. Close. You have the right instincts. The speed will follow the instincts.",
    ],
    [ // Round 2
      "Two rounds to me. Both close. You're consistently just behind me and I mean just.",
      "Round two also mine. Similar margin. You're keeping pace with me — just fractionally behind.",
      "I won round two as well. By about the same margin as round one. You're not falling behind — you're maintaining a consistent gap.",
      "Two close losses. You're running just behind me across both rounds. That's a specific thing.",
      "Round two: mine again. The margin was similar. You're consistently two seconds behind me. That's almost the same as being level.",
      "Two rounds, both close, both mine. You're not losing badly — you're losing narrowly. There's a difference.",
      "I'm two for two. You're close both times. I'd rather have a close competitor than no competition.",
      "Round two goes to me. You were right there again. Two seconds is a very small window.",
      "Two consecutive close losses. You're matching my accuracy. The gap is speed and it's small.",
      "Two rounds, both mine, both narrow. You're working at my pace — just slightly behind the beat.",
    ],
    [ // Round 3
      "Three rounds, all mine, all close. You were within two seconds every time. That's not a loss — that's a near miss three times over.",
      "I won all three. None of them comfortably. You were close in every round. I'll tell you what I found — you earned it.",
      "Three rounds to me, all by small margins. You found the correct answer each time. You were simply not first.",
      "All three rounds mine. All three close. You lost by a narrow margin three consecutive times. That requires a specific kind of stamina.",
      "Three close losses. You were never far behind me. You were never ahead. That's a consistent performance at a high level.",
      "I took all three. None easily. You were right behind me each time. I find I'm more impressed by that than I would be by someone who didn't compete.",
      "Three rounds, three small margins in my favour. You matched my accuracy. You're slightly slower. The accuracy matters more.",
      "All three mine — barely. You were within two seconds every round. That's close enough that on a different evening the result might be different.",
      "Three consecutive close losses. You were always close. You were never first. I'll tell you what I found because you came close enough to earn it.",
      "Three rounds to me, all narrow. You competed in every one. The margins were small. What you did well was stay within range.",
    ],
  ],

  // ── TIER 5: COMFORTABLE LOSS (lost by 3-8s) ───────────────
  comfortable_loss: [
    [ // Round 1
      "Round one to me. You got there — eventually. The gap was a few seconds. Enough to be meaningful.",
      "I won round one by about five seconds. You found the pattern. The finding was correct. The pace was slower.",
      "Round one: mine, comfortably. You're working in the right direction. The speed is the question.",
      "Five seconds in round one. I had time to notice I had it before you confirmed you did.",
      "Round one goes to me by a comfortable margin. You weren't lost — you were late.",
      "I finished round one well ahead of you. You got there. You were working correctly. Just not quickly.",
      "Round one: mine. About five seconds. You were solving correctly — just at a different pace.",
      "I won round one by enough that I had time to watch you finish. You found the right answer.",
      "Round one to me. Comfortable margin. You didn't guess — you solved. The speed is a separate issue.",
      "Five second margin in round one. You had the method. The method was just slower.",
    ],
    [ // Round 2
      "Two rounds to me. Both comfortable. You're solving correctly but the pace isn't there yet.",
      "Round two: mine again, similar margin. You're consistent. Consistently behind, but consistent.",
      "I'm two for two by comfortable margins. You're finding the correct answers. You're not finding them quickly.",
      "Round two goes to me. About five seconds. Same story as round one — correct method, slower execution.",
      "Two rounds, both mine, both five-ish seconds. You have the accuracy. The speed is the gap.",
      "I won both rounds by enough to be comfortable. You weren't panicking — you were thinking. Thinking takes time.",
      "Two comfortable wins for me. You're solving correctly. You're just not solving quickly.",
      "Round two: mine. Similar to round one. The pattern in your solving pattern is that it's accurate but unhurried.",
      "Two rounds, five seconds each. You have the right instincts. The execution is the part to work on.",
      "I'm two for two. The margins are consistent. You're working correctly — just not at pace.",
    ],
    [ // Round 3
      "Three rounds, all mine, all comfortable. You solved every pattern correctly. You weren't fast, but you were right.",
      "All three rounds to me by five-second margins. You were accurate across the entire duel. You were just slower than me.",
      "Three comfortable wins. You found the right answer every time. The gap was speed, not accuracy. Speed is improvable.",
      "I took all three. None of them close. You were always correct. You were never first. The correct part is the hard part.",
      "Three rounds, three comfortable margins. You solved everything right. The pace is a different skill and it comes with exposure.",
      "All three mine by meaningful margins. You didn't guess once — you solved. That's the important part.",
      "Three comfortable losses for you. You were accurate. You were patient. You were slow. Two of those three things are good.",
      "I won all three rounds. You got the right answer every time. The question was always just how long it took.",
      "Three rounds to me. You were never wrong, just never first. That's a different kind of result than it might look like.",
      "All three comfortable margins. You solved correctly across the entire duel. The speed isn't there yet. The thinking is.",
    ],
  ],

  // ── TIER 6: HE HAD TIME (lost by 8s+) ────────────────────
  had_time: [
    [ // Round 1
      "Round one: I had time to identify the answer, watch you work, and form an opinion about your method before you finished.",
      "I won round one by enough that I had time to be bored. Not by your effort — by the waiting.",
      "Round one. I finished with eight seconds to spare. That's a significant gap in a twenty-second window.",
      "I had round one comfortably. Very comfortably. You found the answer eventually. The gap was the whole point.",
      "Round one to me — significantly. You were working. The work was correct. It was just very deliberate.",
      "I finished round one, thought about something else briefly, and watched you complete it. That's a large margin.",
      "Round one: mine by eight or so seconds. You were methodical. Methodical is a virtue. Speed is also a virtue.",
      "I finished round one with time to note that you were still working. You got there. Eventually.",
      "Eight second margin in round one. You weren't guessing — you were thinking step by step. That's correct. It's also slow.",
      "Round one to me. I had time after I finished to form an initial theory about your solving method. It's thorough.",
    ],
    [ // Round 2
      "Two large margins. You're solving correctly but at a pace that gives me time to narrate.",
      "Round two: mine again, by a lot. You finished. The gap was enough that I was ready to move on before you were.",
      "Two rounds, both large margins. You're not guessing — you're working. The work is correct. The pace is the issue.",
      "I won round two by eight seconds as well. You have a consistent method. It's consistently deliberate.",
      "Two comfortable wins with room to spare. You found the right answer both times. I found it significantly first.",
      "Round two goes to me. Significantly. You're solving step by step. That's one way to do it.",
      "Two large margins. You're accurate. You're methodical. You're not fast. Two out of three isn't bad.",
      "Round two: mine. I had time after finishing to consider what I'd say to you about round three.",
      "I won both rounds by eight-plus seconds. You were right both times. The pace is the only problem.",
      "Two rounds, two large margins. You find the pattern eventually. The eventually is the gap.",
    ],
    [ // Round 3
      "Three rounds. All large margins. You found the correct answer every single time. You were never fast. You were never wrong.",
      "All three mine by eight-plus seconds. You solved every puzzle correctly. The pace was the only variable.",
      "Three comfortable wins. You were right in every round. You were just very deliberately right.",
      "I took all three by significant margins. You weren't guessing. You were thinking. Careful thinking is good. Fast careful thinking is better.",
      "Three large margins. You never missed. You never hurried. I respect the accuracy. The speed is a separate skill.",
      "All three rounds, all significant margins. You were methodical throughout. The method worked. The clock disagreed.",
      "Three rounds, all mine. You got every answer right. You were just working at a pace that gave me time to write notes.",
      "I won all three by comfortable margins. You were never lost — you were just thorough. Thoroughness is valuable. Not in timed competitions, but generally.",
      "Three rounds, three large margins. You solved everything correctly. The gap between correct and fast is exactly what you should work on.",
      "All three mine. Significantly. You were right every time. I was right faster every time. One of those matters more here.",
    ],
  ],

  // ── TIER 7: TIMEOUT ────────────────────────────────────────
  timeout: [
    [ // Round 1
      "The clock got you in round one. You were working — I could see the method. The method needed more time than the clock allowed.",
      "Round one to me — by default. The clock ran out before you finished. I noticed you were on the right track.",
      "Timeout in round one. You weren't lost. You were taking the long route to the right answer.",
      "The clock beat you in round one. Not me — the clock. That's a different kind of loss.",
      "Round one: time. You were working correctly when the clock ended. The answer you were approaching was the right one.",
      "Timeout. Round one. I finished with time to spare. You were still working. The working looked right.",
      "The clock took round one. You were moving toward the correct answer. You just needed more track.",
      "Round one — timeout. You had the right instinct. The clock didn't care about the instinct.",
      "The timer ran out on round one. I watched you working. You were solving correctly. Slowly, but correctly.",
      "Timeout in round one. I had it at five seconds. You were at twelve when the clock ended. The answer you were building was correct.",
    ],
    [ // Round 2
      "Two timeouts. The clock has beaten you twice. Your method is right. The clock doesn't reward method — it rewards speed.",
      "Round two also timeout. You're working correctly in both rounds. The clock is simply faster than your method.",
      "Timed out again. Round two. You were still building the answer when the clock ended. The building was correct.",
      "Two rounds, two timeouts. You haven't been wrong — you've been late. Those are different problems.",
      "Round two: clock wins again. You're solving correctly, methodically, and too slowly for a twenty-second window.",
      "Timeout twice. You're not guessing. You're solving. The solving is just at a pace the clock won't accommodate.",
      "Two consecutive timeouts. Your accuracy is fine. Your speed is the issue. Specifically, the absence of it.",
      "Round two also timed out. I finished. You were working. The working was going the right direction.",
      "Two timeouts. The clock is not your friend tonight. Your method isn't the problem. The pace is.",
      "Timed out again in round two. Your approach is correct. The approach needs to happen faster.",
    ],
    [ // Round 3
      "Three timeouts. The clock took all three rounds. You were working correctly in every one. You simply needed more time than twenty seconds.",
      "All three timeouts. You never gave a wrong answer — you never gave a completed answer. That's a specific kind of performance.",
      "Three rounds, three timeouts. You were building the right answer every time. The building process is correct. The pace is the only problem.",
      "The clock beat you three times. Not me. You were never wrong. You were just never finished before the timer.",
      "Three timeouts. You had the correct instinct in each round. The instinct needed more runway than twenty seconds.",
      "All three timed out. You weren't guessing — you were methodically solving. The method is sound. The speed needs work.",
      "Three rounds. Three times the clock ended before you did. Every time you were moving toward the right answer. The clock doesn't care.",
      "Three consecutive timeouts. Your accuracy rate is perfect if we ignore the fact that you never completed an answer. Which we cannot.",
      "All three timed out. You were right every time you were working. The work just took longer than twenty seconds.",
      "Three timeouts. I watched you work through three rounds correctly. The clock watched you work more briefly than you needed.",
    ],
  ],
};

// ── FINAL SCORE LINES ──────────────────────────────────────────
// Keyed by exact score: p_score-r_score e.g. '3-0', '2-1', '1-2', '0-3', 'draw'

const ROWE_FINAL_LINES = {

  '3-0': [ // Player sweep
    "Three for three. By comfortable margins. Whatever Ashworth saw in you — I understand it now. Ask me anything.",
    "You swept me. All three rounds. I've assessed forty-three investigators this year. You're the fourth to sweep a duel.",
    "Three rounds, three wins. None of them luck. I owe you the complete report from six-forty. You earned it.",
    "You beat me in every round. I find I'm not upset about it. I'm interested. That's a better response.",
    "Three for three. I was at ninety-four percent tonight. You made it comfortable. That is a very short list of people.",
    "Swept. I'm going to be thinking about this for a while. Not competitively — analytically. You did something specific.",
    "All three rounds. All yours. I said I'd tell you everything if you beat me. I'm a man of my word and you beat me.",
    "Three wins. No close calls. You weren't lucky and you weren't showing off. You were just faster. Every time.",
    "You swept the duel. I've been doing this for eleven years. I have been swept twice. You're the second.",
    "Three for three. I'm revising my estimate of this evening. And of you. Ask me what I found.",
  ],

  '2-1': [ // Player 2-1
    "Two to one. You won the duel. Narrowly enough that I'm not embarrassed and conclusively enough that it counts.",
    "You won. Two rounds to my one. That's a real result. I'll give you everything I have.",
    "Two wins, one loss. You beat me overall. I'll note which round I won and think about why.",
    "Two to one in your favour. You won the duel. The one round I took was real. So were your two.",
    "You beat me two to one. Close enough to be honest, conclusive enough to mean something.",
    "Two rounds to you, one to me. You won. Marginally and genuinely. I'll tell you what I found.",
    "Two to one. You won the duel. I won one round. I'm choosing to treat that as data rather than consolation.",
    "You won two to one. I competed in every round. You were better. That's the complete summary.",
    "Two wins for you, one for me. You won the duel. The one I took doesn't change the result — it just tells me something.",
    "Two to one, your favour. You won. Genuinely. I'm going to tell you what I found and you're going to use it better than I would have.",
  ],

  '1-2': [ // Rowe 2-1
    "Two to one in my favour. I won the duel. You won a round. That round was real.",
    "I took it two to one. You won a round — a real round, not a gift. The other two were mine.",
    "Two rounds to me, one to you. I won the duel. The round you took tells me something about you.",
    "Two to one. Mine. You competed genuinely and won a round. The other two I won genuinely.",
    "I won two to one. You won a round by finding the pattern. That's the part I'm paying attention to.",
    "Two rounds to me, one to you. I'll still tell you what I found. You won a round and you came close in the others.",
    "Two to one, my favour. Close enough that I'm interested. Not so close I need to pretend.",
    "I won the duel two to one. The round you took — I want to know how you found it that fast.",
    "Two to one. Mine. You beat me in one round. That's on the record and I'm glad it's there.",
    "Two rounds for me, one for you. You won a real round. The duel goes to me. Both things are true.",
  ],

  '0-3': [ // Rowe sweep
    "Three rounds to me. All of them. I won't pretend that's anything other than what it is.",
    "I swept the duel. All three rounds. You were working in the right direction — you just weren't fast enough.",
    "Three for three — my three. You found every correct answer. You just found them after I did.",
    "All three rounds to me. You competed in every one. The result is the result.",
    "I took all three. None easily — you made me work. The work went to me.",
    "Three rounds, all mine. You were right every time. You were just slower every time. One of those things is fixable.",
    "Three for three, my favour. I'll still tell you what I found. You were never wrong — just never first.",
    "All three rounds mine. You weren't guessing. You were solving correctly. The speed is the gap.",
    "I swept you. Three rounds, three wins. You have the right instincts. The execution needs work.",
    "Three to zero. Mine. You found the pattern every time. I found it first every time. That's the complete record.",
  ],

  'draw': [ // Draw (various splits)
    "One apiece and a draw. We think similarly. I find that both flattering and inconvenient.",
    "Even. Which means my model of you is accurate and my model of myself is accurate. We're matched.",
    "Draw. One each and a split. We're operating at the same level. I wasn't expecting that.",
    "Even result. We each won a round and the third was a wash. I find that interesting rather than frustrating.",
    "A draw. We're genuinely matched. That's the most informative result I could have gotten.",
    "One all. Tied. Which means neither of us is clearly better and both of us are clearly capable. That's useful information.",
    "Even. I came here to assess you. The answer appears to be: comparable to me. That's a better answer than I expected.",
    "Draw. We split the rounds. I find I respect the result even though it doesn't give me a clear picture.",
    "Even result. We're matched. On a different evening the rounds might have gone differently. I'll note that.",
    "One all and a draw. You're exactly at my level. I wasn't built to handle that as information. I'm working on it.",
  ],
};

// ── REPLAY OFFER LINES ─────────────────────────────────────────
// Keyed to replay count (1-10), then cycles.

const ROWE_REPLAY_LINES = [
  "Again? I'm amenable. The second round tells me more than the first.",
  "You want another. Good. I was hoping you'd say that.",
  "Round two. I'm ready when you are. I've had time to think about what you did.",
  "You're coming back. Most people don't. That's a data point.",
  "Again. I notice I'm pleased about that. Professional hazard.",
  "You want to run it again. Yes. Let's run it again.",
  "Round three — of our sessions, I mean. I'm tracking. Are you tracking?",
  "Again. How many times are you going to make me say I'm impressed before you're satisfied.",
  "You're still here. Good. I wasn't finished either.",
  "Again. We've done this nine times. I find I'm looking forward to ten. That's new.",
];

// Gets replay line by count (1-indexed), cycles after 10
function getReplayLine(replayCount) {
  const idx = (replayCount - 1) % ROWE_REPLAY_LINES.length;
  return ROWE_REPLAY_LINES[idx];
}

// Gets round line by tier, round (0-indexed), cycle (0-indexed, mod 10)
function getRoundLine(tier, round, cycle) {
  const tierLines = ROWE_ROUND_LINES[tier];
  if (!tierLines) return null;
  const roundLines = tierLines[round];
  if (!roundLines) return null;
  return roundLines[cycle % 10];
}

// Gets final line by score key, cycle (0-indexed, mod 10)
function getFinalLine(scoreKey, cycle) {
  const lines = ROWE_FINAL_LINES[scoreKey];
  if (!lines) return null;
  return lines[cycle % 10];
}

// Determine margin tier from time gap in ms
// positive gap = player faster (beat Rowe), negative = Rowe faster
function getMarginTier(gapMs) {
  if (gapMs === null) return 'timeout';
  if (gapMs > 3000)   return 'crushed';
  if (gapMs > 1000)   return 'edged';
  if (gapMs > -1000)  return 'photo';
  if (gapMs > -3000)  return 'close_loss';
  if (gapMs > -8000)  return 'comfortable_loss';
  return 'had_time';
}

// Determine final score key
function getFinalScoreKey(playerScore, roweScore) {
  if (playerScore === 3 && roweScore === 0) return '3-0';
  if (playerScore === 2 && roweScore === 1) return '2-1';
  if (playerScore === 2 && roweScore === 0) return '2-1'; // timeout round
  if (playerScore === 1 && roweScore === 2) return '1-2';
  if (playerScore === 0 && roweScore === 2) return '1-2'; // timeout round
  if (playerScore === 0 && roweScore === 3) return '0-3';
  if (playerScore === 1 && roweScore === 0) return '2-1'; // partial timeout
  if (playerScore === 0 && roweScore === 1) return '1-2'; // partial timeout
  if (playerScore === roweScore) return 'draw';
  return playerScore > roweScore ? '2-1' : '1-2';
}


// ── DUEL PUZZLES — ESTATE THEMED ──────────────────────────────
const DUEL_PUZZLE_BANK = [
  // ── ROTATION PATTERNS ─────────────────────────────────────
  {
    hint: 'Each row cycles the same three objects',
    grid: ['🕯️','🗝️','🎭', '🕯️','🗝️','🎭', '🕯️','🗝️', null],
    ans: '🎭', opts: ['🎭','🔔','📜','🪞'],
    roweMs: 5200, roweSays: ["Rotation. Column three repeats.", "Third column. Same every row."]
  },
  {
    hint: 'Each row cycles the same three objects',
    grid: ['📜','🔔','🗝️', '📜','🔔','🗝️', '📜','🔔', null],
    ans: '🗝️', opts: ['🗝️','🕯️','🎭','🪞'],
    roweMs: 5000, roweSays: ["Same cycle. Third position.", "Key ends every row."]
  },
  {
    hint: 'Each row cycles the same three objects',
    grid: ['🪞','📜','🔔', '🪞','📜','🔔', '🪞','📜', null],
    ans: '🔔', opts: ['🔔','🗝️','🕯️','🎭'],
    roweMs: 5100, roweSays: ["Mirror, scroll, bell. Every row.", "Third column is always the bell."]
  },
  // ── QUANTITY RULES ────────────────────────────────────────
  {
    hint: 'Quantity increases left to right',
    grid: ['🕯️','🕯️🕯️','🕯️🕯️🕯️', '🗝️','🗝️🗝️','🗝️🗝️🗝️', '🎭','🎭🎭', null],
    ans: '🎭🎭🎭', opts: ['🎭🎭🎭','🎭','🎭🎭','📜📜📜'],
    roweMs: 6800, roweSays: ["One, two, three. Column multiplies.", "Third column is always three."]
  },
  {
    hint: 'Quantity increases left to right',
    grid: ['🔔','🔔🔔','🔔🔔🔔', '📜','📜📜','📜📜📜', '🗝️','🗝️🗝️', null],
    ans: '🗝️🗝️🗝️', opts: ['🗝️🗝️🗝️','🗝️','🗝️🗝️','🔔🔔🔔'],
    roweMs: 6500, roweSays: ["Quantity rule again.", "Three keys. Column three completes it."]
  },
  {
    hint: 'Count the pattern across columns',
    grid: ['🪞','🪞🪞','🪞🪞🪞', '🕯️','🕯️🕯️','🕯️🕯️🕯️', '🎭','🎭🎭', null],
    ans: '🎭🎭🎭', opts: ['🎭🎭🎭','🎭🎭','🎭','📜📜📜'],
    roweMs: 6600, roweSays: ["Column three. Always three.", "The quantity rule holds."]
  },
  // ── LATIN SQUARES ─────────────────────────────────────────
  {
    hint: 'No symbol repeats in any row or column',
    grid: ['🕯️','🗝️','📜', '🗝️','📜','🕯️', '📜', null,'🗝️'],
    ans: '🕯️', opts: ['🕯️','🎭','📜','🗝️'],
    roweMs: 7500, roweSays: ["Latin square. One of each per row.", "No repeats. Row three needs the candle."]
  },
  {
    hint: 'No symbol repeats in any row or column',
    grid: ['🔔','🪞','📜', '🪞','📜','🔔', '📜', null,'🔔'],
    ans: '🪞', opts: ['🪞','🔔','📜','🗝️'],
    roweMs: 7800, roweSays: ["No repeats. Row three column two.", "Mirror completes the square."]
  },
  {
    hint: 'No symbol repeats in any row or column',
    grid: ['🎭','🕯️','🗝️', '🗝️','🎭','🕯️', null,'🗝️','🎭'],
    ans: '🕯️', opts: ['🕯️','🎭','🗝️','🔔'],
    roweMs: 7600, roweSays: ["Column one. Each symbol once.", "Candle. Row three column one."]
  },
  {
    hint: 'No symbol repeats in any row or column',
    grid: ['🪞','🔔','🎭', '🎭','🪞','🔔', '🔔', null,'🪞'],
    ans: '🎭', opts: ['🎭','🔔','🪞','📜'],
    roweMs: 7700, roweSays: ["Three symbols. None repeating.", "Row three column two. Masks."]
  },
  // ── DIAGONAL RULES ────────────────────────────────────────
  {
    hint: 'The diagonal carries a pattern',
    grid: ['🕯️','🔔','🔔', '🔔','🕯️','🔔', '🔔','🔔', null],
    ans: '🕯️', opts: ['🕯️','🔔','🎭','🗝️'],
    roweMs: 8200, roweSays: ["Diagonal. Top-left to bottom-right.", "The candle runs along the diagonal."]
  },
  {
    hint: 'The diagonal carries a pattern',
    grid: ['🗝️','📜','📜', '📜','🗝️','📜', '📜','📜', null],
    ans: '🗝️', opts: ['🗝️','📜','🔔','🪞'],
    roweMs: 8000, roweSays: ["Same diagonal rule.", "Key on the diagonal. Always."]
  },
  // ── COLUMN RULES ──────────────────────────────────────────
  {
    hint: 'Each column contains only one symbol',
    grid: ['🕯️','🗝️','🎭', '🕯️','🗝️','🎭', null,'🗝️','🎭'],
    ans: '🕯️', opts: ['🕯️','🗝️','🎭','🔔'],
    roweMs: 5800, roweSays: ["Column one is always candles.", "Each column owns one symbol."]
  },
  {
    hint: 'Each column contains only one symbol',
    grid: ['🔔','📜','🪞', '🔔','📜','🪞', null,'📜','🪞'],
    ans: '🔔', opts: ['🔔','📜','🪞','🗝️'],
    roweMs: 5600, roweSays: ["Column one. Bell every time.", "Same symbol owns each column."]
  },
  // ── ODD ONE OUT ───────────────────────────────────────────
  {
    hint: 'Two match — find what completes the third',
    grid: ['🕯️','🕯️','🗝️', '🎭','🎭','📜', '🔔','🔔', null],
    ans: '🪞', opts: ['🪞','🔔','🕯️','🗝️'],
    roweMs: 8500, roweSays: ["Each row: two same, one different.", "Third row needs the odd one."]
  },
  {
    hint: 'Two match — find what completes the third',
    grid: ['🗝️','🗝️','🕯️', '📜','📜','🔔', '🪞','🪞', null],
    ans: '🎭', opts: ['🎭','🪞','📜','🗝️'],
    roweMs: 8300, roweSays: ["Pair plus different. Row three.", "The mask completes the pattern."]
  },
  // ── MIRROR RULES ──────────────────────────────────────────
  {
    hint: 'Each row mirrors itself',
    grid: ['🕯️','🗝️','🕯️', '🎭','📜','🎭', '🔔', null,'🔔'],
    ans: '🗝️', opts: ['🗝️','🔔','🕯️','🎭'],
    roweMs: 7200, roweSays: ["Row mirrors. First equals third.", "Column two is the centre. Key."]
  },
  {
    hint: 'Each row mirrors itself',
    grid: ['🪞','🔔','🪞', '📜','🗝️','📜', '🎭', null,'🎭'],
    ans: '🕯️', opts: ['🕯️','🎭','🪞','🔔'],
    roweMs: 7400, roweSays: ["Centre column. Mirror rule.", "First and third match. Centre varies."]
  },
  // ── SUM RULES ─────────────────────────────────────────────
  {
    hint: 'The pattern shifts one position each row',
    grid: ['🕯️','🗝️','🎭', '🗝️','🎭','🕯️', '🎭','🕯️', null],
    ans: '🗝️', opts: ['🗝️','🕯️','🎭','🔔'],
    roweMs: 8800, roweSays: ["Rotates left each row.", "Shift pattern. Row three ends with key."]
  },
  {
    hint: 'The pattern shifts one position each row',
    grid: ['🔔','📜','🪞', '📜','🪞','🔔', '🪞','🔔', null],
    ans: '📜', opts: ['📜','🔔','🪞','🗝️'],
    roweMs: 8600, roweSays: ["Left shift every row.", "Scroll ends row three."]
  },
];

// ── SPEED PUZZLE BANK ─────────────────────────────────────
// type:'speed' — tap all matching symbols before Rowe does
// target: symbol to tap, grid: 9 symbols, roweMs: how fast Rowe finishes

const SPEED_PUZZLE_BANK = [
  { type:'speed', hint:'Tap every candle before Rowe does', target:'🕯️',
    grid:['🕯️','🗝️','🎭','🕯️','📜','🔔','🗝️','🕯️','🪞'], count:3,
    roweMs:3800, roweSays:["Three candles. Found them.","Speed is the only variable here."] },
  { type:'speed', hint:'Tap every key before Rowe does', target:'🗝️',
    grid:['🕯️','🗝️','🎭','🗝️','📜','🔔','🗝️','🕯️','🪞'], count:3,
    roweMs:3600, roweSays:["Three keys.","Speed round. I finished."] },
  { type:'speed', hint:'Tap every mask before Rowe does', target:'🎭',
    grid:['🎭','🗝️','🎭','🕯️','📜','🎭','🗝️','🕯️','🪞'], count:3,
    roweMs:3700, roweSays:["Three masks. Done.","Masks. Found all three."] },
  { type:'speed', hint:'Tap every scroll before Rowe does', target:'📜',
    grid:['🕯️','📜','🎭','🗝️','📜','🔔','🗝️','📜','🪞'], count:3,
    roweMs:3900, roweSays:["Three scrolls.","Speed is the discipline."] },
  { type:'speed', hint:'Tap every bell before Rowe does', target:'🔔',
    grid:['🔔','🗝️','🎭','🕯️','🔔','📜','🗝️','🔔','🪞'], count:3,
    roweMs:3500, roweSays:["Bells. Three of them.","Done."] },
  { type:'speed', hint:'Tap every mirror before Rowe does', target:'🪞',
    grid:['🕯️','🪞','🎭','🗝️','📜','🪞','🕯️','🔔','🪞'], count:3,
    roweMs:4000, roweSays:["Three mirrors.","Mirror. Mirror. Mirror."] },
  { type:'speed', hint:'Tap every candle — four hidden this time', target:'🕯️',
    grid:['🕯️','🗝️','🕯️','🎭','🔔','🕯️','🪞','📜','🕯️'], count:4,
    roweMs:4200, roweSays:["Four candles. Faster this time.","Found all four."] },
  { type:'speed', hint:'Tap every key — four hidden this time', target:'🗝️',
    grid:['🗝️','🕯️','🗝️','🎭','🔔','🗝️','🪞','📜','🗝️'], count:4,
    roweMs:4100, roweSays:["Four keys.","Every key. Done."] },
  { type:'speed', hint:'Tap every mask — four hidden this time', target:'🎭',
    grid:['🎭','🕯️','🗝️','🎭','🔔','🎭','🪞','📜','🎭'], count:4,
    roweMs:4300, roweSays:["Four masks.","Speed and accuracy."] },
  { type:'speed', hint:'Tap every scroll — four hidden', target:'📜',
    grid:['📜','🕯️','🗝️','🎭','📜','🔔','📜','🪞','📜'], count:4,
    roweMs:4400, roweSays:["Four scrolls. Found them.","Accuracy matters here."] },
  { type:'speed', hint:'Tap every bell — four hidden', target:'🔔',
    grid:['🔔','🕯️','🔔','🎭','🗝️','🔔','🪞','📜','🔔'], count:4,
    roweMs:4000, roweSays:["Four bells.","Ring them all."] },
  { type:'speed', hint:'Tap every mirror — four hidden', target:'🪞',
    grid:['🪞','🕯️','🗝️','🪞','🔔','🎭','🪞','📜','🪞'], count:4,
    roweMs:4500, roweSays:["Four mirrors.","All four. Done."] },
  { type:'speed', hint:'Tap every candle — five this time', target:'🕯️',
    grid:['🕯️','🕯️','🗝️','🕯️','🔔','🕯️','🪞','📜','🕯️'], count:5,
    roweMs:4800, roweSays:["Five candles. The pace increases.","Found five."] },
  { type:'speed', hint:'Tap every key — five hidden', target:'🗝️',
    grid:['🗝️','🗝️','🕯️','🗝️','🔔','🗝️','🪞','📜','🗝️'], count:5,
    roweMs:4700, roweSays:["Five keys.","Speed and focus."] },
  { type:'speed', hint:'Tap every mask — five hidden', target:'🎭',
    grid:['🎭','🎭','🗝️','🎭','🔔','🎭','🪞','📜','🎭'], count:5,
    roweMs:4900, roweSays:["Five masks.","All five."] },
  { type:'speed', hint:'Tap every scroll — five hidden', target:'📜',
    grid:['📜','📜','🗝️','📜','🔔','📜','🪞','🕯️','📜'], count:5,
    roweMs:5000, roweSays:["Five scrolls.","The pace is the test."] },
  { type:'speed', hint:'Tap every bell — five hidden', target:'🔔',
    grid:['🔔','🔔','🗝️','🔔','🕯️','🔔','🪞','📜','🔔'], count:5,
    roweMs:4600, roweSays:["Five bells.","Ring every one."] },
  { type:'speed', hint:'Tap every mirror — five hidden', target:'🪞',
    grid:['🪞','🪞','🗝️','🪞','🕯️','🪞','🔔','📜','🪞'], count:5,
    roweMs:5100, roweSays:["Five mirrors.","Every mirror. Done."] },
  { type:'speed', hint:'Tap every candle — move fast', target:'🕯️',
    grid:['🕯️','🗝️','🕯️','🔔','🕯️','🪞','🎭','🕯️','📜'], count:4,
    roweMs:3800, roweSays:["Four candles. Spread across the grid.","Found them all."] },
  { type:'speed', hint:'Tap every key — move fast', target:'🗝️',
    grid:['🗝️','🕯️','🗝️','🔔','🗝️','🪞','🎭','🗝️','📜'], count:4,
    roweMs:3700, roweSays:["Four keys. Scattered.","Speed is the only discipline here."] },
];

// ── MEMORY PUZZLE BANK ────────────────────────────────────
// type:'memory' — memorise sequence, reconstruct in order
// sequence: ordered array to remember
// showMs: time to display before going dark
// roweMs: time for Rowe to reconstruct

const MEMORY_PUZZLE_BANK = [
  // ── EASY — 3 items ────────────────────────────────────
  { type:'memory', hint:'Memorise the sequence', difficulty:'easy',
    sequence:['🕯️','🗝️','🎭'], showMs:4000, roweMs:4500,
    roweSays:["Three items. Straightforward.","Sequence of three. Done."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'easy',
    sequence:['🔔','📜','🪞'], showMs:4000, roweMs:4500,
    roweSays:["Bell, scroll, mirror.","Three items. Recalled."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'easy',
    sequence:['🗝️','🎭','🕯️'], showMs:4000, roweMs:4200,
    roweSays:["Key, mask, candle.","Three. Recalled in order."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'easy',
    sequence:['🪞','🔔','📜'], showMs:4000, roweMs:4300,
    roweSays:["Mirror, bell, scroll.","Three items. Simple."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'easy',
    sequence:['🎭','🕯️','🔔'], showMs:4000, roweMs:4600,
    roweSays:["Mask, candle, bell.","Three. Clean sequence."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'easy',
    sequence:['📜','🪞','🗝️'], showMs:4000, roweMs:4400,
    roweSays:["Scroll, mirror, key.","Three items. Done."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'easy',
    sequence:['🕯️','🔔','🪞'], showMs:4000, roweMs:4500,
    roweSays:["Candle, bell, mirror.","Three. Recalled."] },
  // ── MEDIUM — 4 items ───────────────────────────────────
  { type:'memory', hint:'Memorise the sequence', difficulty:'medium',
    sequence:['🕯️','🗝️','🎭','🔔'], showMs:5000, roweMs:6500,
    roweSays:["Four items. The sequence matters.","Candle, key, mask, bell. Recalled."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'medium',
    sequence:['🔔','📜','🪞','🕯️'], showMs:5000, roweMs:6800,
    roweSays:["Four. The order is the answer.","Bell, scroll, mirror, candle."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'medium',
    sequence:['🗝️','🎭','🔔','📜'], showMs:5000, roweMs:6600,
    roweSays:["Four items. I have them.","Key, mask, bell, scroll."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'medium',
    sequence:['🪞','🕯️','🗝️','🎭'], showMs:5000, roweMs:6400,
    roweSays:["Four. Mirror leads.","Mirror, candle, key, mask. Done."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'medium',
    sequence:['🎭','🔔','🪞','🗝️'], showMs:5000, roweMs:6700,
    roweSays:["Four items. Mask leads.","Mask, bell, mirror, key."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'medium',
    sequence:['📜','🕯️','🔔','🪞'], showMs:5000, roweMs:6500,
    roweSays:["Four. Scroll, candle, bell, mirror.","The sequence. Recalled."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'medium',
    sequence:['🕯️','🪞','📜','🔔'], showMs:5000, roweMs:6900,
    roweSays:["Four items. Candle leads.","Candle, mirror, scroll, bell."] },
  // ── HARD — 5 items ─────────────────────────────────────
  { type:'memory', hint:'Memorise the sequence', difficulty:'hard',
    sequence:['🕯️','🗝️','🎭','🔔','📜'], showMs:6000, roweMs:8500,
    roweSays:["Five items. This is the real test.","Five. The sequence is everything."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'hard',
    sequence:['🔔','📜','🪞','🕯️','🗝️'], showMs:6000, roweMs:8800,
    roweSays:["Five. The order matters more than the items.","Bell leads. Five items recalled."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'hard',
    sequence:['🗝️','🎭','🔔','📜','🪞'], showMs:6000, roweMs:8600,
    roweSays:["Five items. Key leads.","Five. Recalled in sequence."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'hard',
    sequence:['🪞','🕯️','🗝️','🎭','🔔'], showMs:6000, roweMs:8400,
    roweSays:["Five. Mirror, candle, key, mask, bell.","Five items. The sequence holds."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'hard',
    sequence:['🎭','🔔','🪞','🗝️','🕯️'], showMs:6000, roweMs:8700,
    roweSays:["Five. Mask leads. Five items.","Mask, bell, mirror, key, candle."] },
  { type:'memory', hint:'Memorise the sequence', difficulty:'hard',
    sequence:['📜','🕯️','🔔','🪞','🎭'], showMs:6000, roweMs:8500,
    roweSays:["Five items. Scroll leads.","Five. The hardest sequence."] },
];

// ── COMBINED BANK ──────────────────────────────────────────
const DUEL_ALL_PUZZLES = [...DUEL_PUZZLE_BANK, ...SPEED_PUZZLE_BANK, ...MEMORY_PUZZLE_BANK];

// Pick 3 random puzzles from combined bank, no repeats
function _selectDuelPuzzles() {
  const bank = DUEL_ALL_PUZZLES.slice();
  const selected = [];
  while (selected.length < 3) {
    const idx = Math.floor(Math.random() * bank.length);
    selected.push(bank.splice(idx, 1)[0]);
  }
  return selected;
}

const DUEL_PUZZLES = _selectDuelPuzzles();

// ── ROWE COMMENTARY — see ROWE_ROUND_LINES / ROWE_FINAL_LINES above ──
const ROWE_WORKING = ["Interesting...","I see it.","...yes.","One moment.","Almost."];

// ── DUEL UI ────────────────────────────────────────────────────
// Injects into existing Nocturne UI layer.

function launchDuel(onComplete) {
  const overlay = document.createElement('div');
  overlay.id = 'rowe-duel-overlay';
  overlay.innerHTML = `
<style>
#rowe-duel-overlay{position:fixed;inset:0;z-index:500;background:#09060380;display:flex;align-items:center;justify-content:center;font-family:var(--font-ui,'Georgia'),serif;}
#rowe-duel-box{background:#0a0804;border:1px solid rgba(184,150,12,.2);width:min(96vw,480px);max-height:90vh;overflow:hidden;position:relative;color:#d4c49a;}
.rd-head{display:flex;align-items:center;justify-content:space-between;padding:13px 16px 9px;border-bottom:1px solid rgba(184,150,12,.12);}
.rd-title{font-size:9px;letter-spacing:.35em;color:rgba(184,150,12,.38);}
.rd-pips{display:flex;align-items:center;gap:10px;}
.pip-row{display:flex;gap:4px;}
.pip{width:7px;height:7px;border-radius:50%;border:1px solid rgba(184,150,12,.22);transition:background .35s;}
.pip.fp{background:#b8960c;border-color:#b8960c;}
.pip.fr{background:#7a5a4a;border-color:#7a5a4a;}
.rd-vs{font-size:8px;color:rgba(184,150,12,.18);letter-spacing:.12em;}
.rd-bar{height:2px;background:rgba(184,150,12,.08);}
.rd-fill{height:100%;background:rgba(184,150,12,.4);transition:width .15s linear;}
.rd-ri{text-align:center;padding:6px 0 0;font-size:9px;color:rgba(184,150,12,.2);letter-spacing:.2em;}
.rd-arena{display:grid;grid-template-columns:1fr 1px 1fr;padding:12px 0 0;}
.rd-dv{background:rgba(184,150,12,.09);}
.rd-side{padding:0 13px 12px;}
.rd-sl{font-size:8px;letter-spacing:.25em;color:rgba(184,150,12,.28);margin-bottom:7px;display:flex;align-items:center;gap:6px;}
.rd-ind{width:5px;height:5px;border-radius:50%;background:rgba(184,150,12,.32);}
.rd-ind.r{background:rgba(122,90,74,.48);}
.rd-mx{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:9px;}
.rd-cell{aspect-ratio:1;border:1px solid rgba(184,150,12,.16);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:19px;background:rgba(184,150,12,.025);}
.rd-miss{border:1.5px dashed rgba(184,150,12,.38)!important;background:rgba(184,150,12,.065)!important;}
.rd-rmiss{border:1.5px dashed rgba(122,90,74,.32)!important;background:rgba(122,90,74,.055)!important;}
.rd-rfill{border-color:rgba(122,90,74,.48)!important;background:rgba(122,90,74,.09)!important;}
.rd-ok{border-color:rgba(90,160,60,.65)!important;background:rgba(90,160,60,.1)!important;}
.rd-bad{border-color:rgba(180,65,45,.65)!important;background:rgba(180,65,45,.1)!important;}
.rd-dta{border-color:rgba(184,150,12,.6)!important;background:rgba(184,150,12,.13)!important;}
.rd-hint{font-size:8px;color:rgba(184,150,12,.19);letter-spacing:.1em;margin-bottom:6px;min-height:13px;}
.rd-ol{font-size:8px;color:rgba(184,150,12,.26);letter-spacing:.1em;margin-bottom:5px;}
.rd-opts{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;}
.rd-opt{aspect-ratio:1;border:1px solid rgba(184,150,12,.2);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:17px;background:rgba(184,150,12,.04);cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;transition:border-color .15s,opacity .2s;}
.rd-opt:hover{border-color:rgba(184,150,12,.48);}
.rd-opt.dg{opacity:.3;}
.rd-opt.used{opacity:.15;pointer-events:none;}
.rd-rs{font-size:10px;font-style:italic;color:rgba(122,90,74,.55);min-height:17px;margin-top:2px;line-height:1.4;}
.rd-ov{position:absolute;inset:0;background:rgba(8,5,3,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .4s;padding:18px;text-align:center;}
.rd-ov.show{opacity:1;pointer-events:all;}
.rd-rw{font-size:18px;letter-spacing:.15em;color:#b8960c;margin-bottom:9px;}
.rd-rq{font-style:italic;font-size:12px;color:rgba(212,196,154,.7);line-height:1.6;max-width:260px;margin-bottom:16px;}
.rd-btn{font-size:8px;letter-spacing:.28em;color:rgba(184,150,12,.52);background:transparent;border:1px solid rgba(184,150,12,.2);padding:8px 18px;cursor:pointer;font-family:inherit;transition:border-color .2s,color .2s;}
.rd-btn:hover{border-color:rgba(184,150,12,.48);color:rgba(184,150,12,.88);}
.rd-fs{display:flex;gap:28px;margin-bottom:16px;}
.rd-fsi{text-align:center;}
.rd-fsn{font-size:26px;color:#b8960c;line-height:1;margin-bottom:3px;}
.rd-fsn.rv{color:#7a5a4a;}
.rd-fsl{font-size:8px;letter-spacing:.22em;color:rgba(184,150,12,.28);}
.rd-ghost{position:fixed;pointer-events:none;z-index:9999;font-size:24px;transform:translate(-50%,-50%);display:none;}
.rd-round-badge{font-size:8px;letter-spacing:.25em;color:rgba(184,150,12,.35);text-align:center;padding:4px 0;}
</style>
<div id="rowe-duel-box">
  <div class="rd-head">
    <div class="rd-title">The Rowe Duel</div>
    <div class="rd-pips">
      <div class="pip-row" id="rd-ppips"></div>
      <div class="rd-vs">vs</div>
      <div class="pip-row" id="rd-rpips"></div>
    </div>
  </div>
  <button id="rd-dev-skip" onclick="window._roweDevSkip&&window._roweDevSkip()" style="position:absolute;top:8px;right:8px;background:rgba(180,150,12,0.15);border:1px solid rgba(180,150,12,0.35);color:rgba(200,170,80,0.8);font-size:9px;letter-spacing:0.18em;padding:4px 9px;cursor:pointer;border-radius:2px;font-family:var(--font-ui,'Georgia'),serif;text-transform:uppercase;z-index:10;">DEV WIN</button>
  <div class="rd-bar"><div class="rd-fill" id="rd-tf" style="width:100%"></div></div>
  <div class="rd-round-badge" id="rd-badge"></div>
  <div class="rd-ri" id="rd-ri"></div>
  <div class="rd-arena">
    <div class="rd-side">
      <div class="rd-sl"><span class="rd-ind"></span>You</div>
      <div class="rd-mx" id="rd-pmx"></div>
      <div class="rd-hint" id="rd-hint"></div>
      <div class="rd-ol" id="rd-ol">Drag to complete</div>
      <div class="rd-opts" id="rd-opts"></div>
    </div>
    <div class="rd-dv"></div>
    <div class="rd-side">
      <div class="rd-sl"><span class="rd-ind r"></span>Rowe</div>
      <div class="rd-mx" id="rd-rmx"></div>
      <div class="rd-rs" id="rd-rst">Studying the pattern...</div>
    </div>
  </div>
  <div class="rd-ov" id="rd-rov">
    <div class="rd-rw" id="rd-rword"></div>
    <div class="rd-rq" id="rd-rquote"></div>
    <button class="rd-btn" id="rd-rbtn">Next</button>
  </div>
  <div class="rd-ov" id="rd-roundov">
    <div class="rd-rw" id="rd-roundword"></div>
    <div class="rd-rq" id="rd-roundquote"></div>
    <button class="rd-btn" id="rd-roundbtn">Continue</button>
  </div>
  <div class="rd-ov" id="rd-fov">
    <div style="font-size:8px;letter-spacing:.3em;color:rgba(184,150,12,.32);margin-bottom:11px;">Assessment Complete</div>
    <div style="font-size:22px;font-weight:500;color:#d4c49a;margin-bottom:7px;letter-spacing:.07em;" id="rd-fverd"></div>
    <div class="rd-fs">
      <div class="rd-fsi"><div class="rd-fsn" id="rd-fps"></div><div class="rd-fsl">You</div></div>
      <div class="rd-fsi"><div class="rd-fsn rv" id="rd-frs"></div><div class="rd-fsl">Rowe</div></div>
    </div>
    <div class="rd-rq" id="rd-fquote"></div>
    <button class="rd-btn" id="rd-fdone">Close</button>
  </div>
</div>
<div class="rd-ghost" id="rd-ghost"></div>
`;
  document.body.appendChild(overlay);

  // ── DUEL STATE ─────────────────────────────────────────────
  // 3 rounds: matrix, speed, memory — randomized order
  // Each round: 3 puzzles from that type's pool, best of 3
  // Round winner gets 1 point. Best of 3 rounds wins duel.

  const ROUND_TYPES = ['matrix','speed','memory'];
  // Shuffle round order
  for(let i=ROUND_TYPES.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [ROUND_TYPES[i],ROUND_TYPES[j]]=[ROUND_TYPES[j],ROUND_TYPES[i]];
  }

  const ROUND_LABELS = { matrix:'Pattern Recognition', speed:'Processing Speed', memory:'Working Memory' };
  const ROUND_WIN_LINES = {
    matrix: [
      "Pattern recognition. I had the rules first. That round is mine.",
      "The matrix. I found the structure before you did.",
      "I was faster on the pattern. Round to me.",
      "Pattern round. I had it. You were close — not close enough.",
      "The rule was there. I found it first. That's the round.",
      "Matrix. Mine. You were working in the right direction — just slower.",
      "I read the pattern before you did. That's what this round measures.",
      "Pattern recognition. I had the advantage. Round to me.",
      "The structure was visible. I found it faster. Round mine.",
      "I finished the pattern. You were still identifying the rule. My round.",
    ],
    speed: [
      "Processing speed. Mine was higher. That round is mine.",
      "Speed round. I finished first. The margin tells me something.",
      "Faster hands tonight. My round.",
      "Speed. The gap between us was measurable. Round to me.",
      "I tapped faster. That's not a skill — it's a measure. Round mine.",
      "Processing speed round. I had the advantage. Noted.",
      "Speed was the variable. Mine was higher. Round to me.",
      "I finished the speed round first. The margin was real.",
      "Hands. Mine were faster. Round mine.",
      "Speed round. I had it. You weren't far behind — far enough.",
    ],
    memory: [
      "The sequence. I had it. Memory round is mine.",
      "Working memory. Mine was stronger. Round to me.",
      "I recalled it faster. Memory round mine.",
      "The sequence held for me. It didn't hold for you in time. My round.",
      "Memory. I reconstructed faster. Round mine.",
      "Working memory round. I had the sequence. You were building it — I was done.",
      "I held all of them. In order. Faster. Round to me.",
      "Memory round. The sequence was there when I needed it. Mine.",
      "I recalled the full sequence before you did. That's the round.",
      "Working memory. Mine was the stronger variable tonight. Round mine.",
    ],
  };
  const ROUND_LOSE_LINES = {
    matrix: [
      "You found the rules faster. Pattern round to you.",
      "Pattern recognition. You had it before I did. That round is yours.",
      "I was a half-step behind on the matrix. Your round.",
      "You read the structure faster than I did. Round to you.",
      "Pattern round. Yours. I had it — you had it first.",
      "You found the pattern. I was still working when you finished. Your round.",
      "Matrix round to you. You found the rule before I did. I'll note that.",
      "You had the pattern. I was a fraction behind. Round yours.",
      "I found it eventually. You found it first. Pattern round to you.",
      "Pattern recognition. You were faster. Round is yours. I'm revising my model.",
    ],
    speed: [
      "Your hands were faster. I'll note that. Speed round to you.",
      "Speed. Yours was higher. Round to you.",
      "You tapped faster. Speed round is yours.",
      "Processing speed. You had the advantage. Round to you.",
      "Speed round. Yours. The margin was real.",
      "Faster hands. Your round. I don't often lose on speed.",
      "You finished the speed round first. That's a specific data point.",
      "Speed round to you. I was half a second behind. That's the round.",
      "You were faster. Speed round yours. I'll factor that in.",
      "Processing speed. Yours was higher. Round to you. Noted.",
    ],
    memory: [
      "You held the sequence. I underestimated your recall. Your round.",
      "Memory round. Yours. You reconstructed it faster than I expected.",
      "You recalled it faster. Memory round to you.",
      "The sequence held for you. It held for me too — you were just faster. Your round.",
      "Working memory round. Yours. You had the full sequence before I finished.",
      "You reconstructed the sequence faster. Memory round to you. Well done.",
      "Memory round. I had it. You had it first. Round yours.",
      "You held all of them in order and you were faster. Memory round to you.",
      "Working memory. Yours was the stronger variable this round.",
      "You recalled the full sequence first. Memory round to you. I'll remember that.",
    ],
  };
  const ROUND_DRAW_LINES = [
    "Even. That round was exactly even. The next one won't be.",
    "Split round. We matched each other. I find that more interesting than a win.",
    "Even on that round. Neither of us had a clear advantage.",
    "That round was a draw. Which tells me we're matched more closely than I thought.",
    "Split. One each. The round is a draw. The information is useful.",
    "Even round. I don't draw often. This is the second time tonight.",
    "That round ended level. The next one determines something.",
    "Split round. You matched me. I matched you. No advantage gained.",
    "Even. That's the most inconclusive result available. Onward.",
    "Draw on that round. Neither of us blinked. The next round will.",
  ];

  let roundIdx=0;        // which of 3 rounds we're on (0,1,2)
  let roundPs=0;         // player score this round (0-3)
  let roundRs=0;         // rowe score this round (0-3)
  let puzzleIdx=0;       // which puzzle within round (0-2)
  let overallPs=0;       // overall rounds won by player
  let overallRs=0;       // overall rounds won by rowe
  let sessionCycle=0;
  let replayCount=0;
  let active=false;
  let rTimer=null;
  let tInt=null;
  let drag=null;
  let roundStartTime=0;
  let currentRoundPuzzles=[];

  // ── HELPERS ───────────────────────────────────────────────
  function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

  function pickRoundPuzzles(type){
    const pool = type==='matrix' ? DUEL_PUZZLE_BANK
               : type==='speed'  ? SPEED_PUZZLE_BANK
               : MEMORY_PUZZLE_BANK;
    const bank=pool.slice();
    const out=[];
    while(out.length<3){
      const i=Math.floor(Math.random()*bank.length);
      out.push(bank.splice(i,1)[0]);
    }
    return out;
  }

  function pips(){
    ['rd-ppips','rd-rpips'].forEach((id,si)=>{
      const el=document.getElementById(id);
      el.innerHTML='';
      const score=si===0?overallPs:overallRs;
      for(let i=0;i<3;i++){
        const p=document.createElement('div');
        p.className='pip'+(i<score?(si===0?' fp':' fr'):'');
        el.appendChild(p);
      }
    });
  }

  function updateRoundInfo(){
    const type=ROUND_TYPES[roundIdx];
    document.getElementById('rd-badge').textContent=ROUND_LABELS[type].toUpperCase();
    document.getElementById('rd-ri').textContent=`Round ${roundIdx+1} of 3  ·  Puzzle ${puzzleIdx+1} of 3  ·  ${roundPs}-${roundRs}`;
  }

  // ── START ROUND ───────────────────────────────────────────
  function startRound(){
    const type=ROUND_TYPES[roundIdx];
    currentRoundPuzzles=pickRoundPuzzles(type);
    roundPs=0; roundRs=0; puzzleIdx=0;
    startPuzzle();
  }

  // ── START PUZZLE ──────────────────────────────────────────
  function startPuzzle(){
    const pz=currentRoundPuzzles[puzzleIdx];
    active=true;
    roundStartTime=Date.now();
    document.getElementById('rd-hint').textContent=pz.hint.toUpperCase();
    document.getElementById('rd-rst').textContent='Studying...';
    document.getElementById('rd-rov').classList.remove('show');
    document.getElementById('rd-roundov').classList.remove('show');
    updateRoundInfo();
    pips();

    // Timer bar
    const RTIME=20000;
    let el=0;
    const fill=document.getElementById('rd-tf');
    fill.style.width='100%';
    clearInterval(tInt);
    tInt=setInterval(()=>{
      el+=120;
      fill.style.width=Math.max(0,100-(el/RTIME)*100)+'%';
      if(el>=RTIME&&active){
        clearInterval(tInt); active=false; clearTimeout(rTimer);
        roundRs++;
        showPuzzleResult('timeout',null);
      }
    },120);

    if(pz.type==='speed'){startSpeedRound(pz);return;}
    if(pz.type==='memory'){startMemoryRound(pz);return;}

    // Matrix puzzle
    const ol=document.getElementById('rd-ol');
    if(ol) ol.textContent='Drag to complete';
    const mi=pz.grid.indexOf(null);
    mkMx('rd-pmx',pz.grid,mi,false);
    mkMx('rd-rmx',pz.grid,mi,true);
    mkOpts(pz.opts,pz.ans);

    const cmts=ROWE_WORKING.slice();
    let ci=0;
    const cInt=setInterval(()=>{
      if(!active){clearInterval(cInt);return;}
      if(ci<cmts.length) document.getElementById('rd-rst').textContent=cmts[ci++];
    },pz.roweMs/(cmts.length+1));

    clearTimeout(rTimer);
    rTimer=setTimeout(()=>{
      clearInterval(cInt); clearInterval(tInt);
      if(!active)return;
      active=false;
      fill.style.width='0%';
      const rdrop=document.getElementById('rd-rmxdrop');
      if(rdrop){
        rdrop.textContent=pz.ans;
        rdrop.style.fontSize=pz.ans.length>2?'12px':'19px';
        rdrop.classList.remove('rd-rmiss');
        rdrop.classList.add('rd-rfill');
      }
      document.getElementById('rd-rst').textContent=pick(pz.roweSays);
      roundRs++;
      setTimeout(()=>showPuzzleResult('rowe',-(Date.now()-roundStartTime-pz.roweMs)),700);
    },pz.roweMs);
  }

  // ── PUZZLE RESULT ─────────────────────────────────────────
  function showPuzzleResult(winner, gapMs){
    clearInterval(tInt); clearTimeout(rTimer);
    const ov=document.getElementById('rd-rov');
    const wd=document.getElementById('rd-rword');
    const qt=document.getElementById('rd-rquote');
    const tier=getMarginTier(winner==='timeout'?null:gapMs);
    const line=getRoundLine(tier, puzzleIdx, sessionCycle);

    if(winner==='player'){
      wd.textContent='You found it'; wd.style.color='#b8960c';
    } else if(winner==='rowe'){
      wd.textContent='Rowe first'; wd.style.color='#7a5a4a';
    } else {
      wd.textContent='Time'; wd.style.color='#7a5a4a';
    }
    qt.textContent=line||'';
    ov.classList.add('show');

    document.getElementById('rd-rbtn').onclick=()=>{
      ov.classList.remove('show');
      puzzleIdx++;

      // Check if round is over (3 puzzles done or someone won 2)
      if(puzzleIdx>=3||roundPs>=2||roundRs>=2){
        endRound();
      } else {
        startPuzzle();
      }
    };
  }

  // ── END ROUND ─────────────────────────────────────────────
  function endRound(){
    const type=ROUND_TYPES[roundIdx];
    const rov=document.getElementById('rd-roundov');
    const rword=document.getElementById('rd-roundword');
    const rquote=document.getElementById('rd-roundquote');

    let roundWinner;
    if(roundPs>roundRs){roundWinner='player';overallPs++;}
    else if(roundRs>roundPs){roundWinner='rowe';overallRs++;}
    else{roundWinner='draw';}

    pips();

    if(roundWinner==='player'){
      rword.textContent=ROUND_LABELS[type];
      rword.style.color='#b8960c';
      rquote.textContent=ROUND_LOSE_LINES[type][sessionCycle % ROUND_LOSE_LINES[type].length];
    } else if(roundWinner==='rowe'){
      rword.textContent=ROUND_LABELS[type];
      rword.style.color='#7a5a4a';
      rquote.textContent=ROUND_WIN_LINES[type][sessionCycle % ROUND_WIN_LINES[type].length];
    } else {
      rword.textContent='Even';
      rword.style.color='rgba(184,150,12,.6)';
      rquote.textContent=ROUND_DRAW_LINES[sessionCycle % ROUND_DRAW_LINES.length];
    }

    rov.classList.add('show');
    document.getElementById('rd-roundbtn').onclick=()=>{
      rov.classList.remove('show');
      roundIdx++;
      if(roundIdx>=3||overallPs>=2||overallRs>=2){
        showFinal();
      } else {
        startRound();
      }
    };
  }

  // ── FINAL ─────────────────────────────────────────────────
  function showFinal(){
    document.getElementById('rd-fps').textContent=overallPs;
    document.getElementById('rd-frs').textContent=overallRs;
    let outcome,verd;
    if(overallPs>overallRs){outcome='player_wins';verd='Above Standard';}
    else if(overallRs>overallPs){outcome='rowe_wins';verd='Noted';}
    else{outcome='draw';verd='Even';}
    const scoreKey=getFinalScoreKey(overallPs,overallRs);
    document.getElementById('rd-fverd').textContent=verd;
    document.getElementById('rd-fquote').textContent=getFinalLine(scoreKey,sessionCycle)||'Ask me anything.';
    document.getElementById('rd-fov').classList.add('show');

    ROWE_STATE.duel_complete=true;
    ROWE_STATE.duel_outcome=outcome;
    ROWE_STATE.duel_score_player=overallPs;
    ROWE_STATE.duel_score_rowe=overallRs;
    ROWE_STATE.iq_score=overallPs;

    // PROLOGUE — emit so prologue can arm the cinematic on next room transition.
    // Prologue handler is guarded by phase, so replays of the duel are no-ops after first emit.
    if(window.NocturneEngine && typeof window.NocturneEngine.emit==='function'){
      window.NocturneEngine.emit('roweDuelComplete',{outcome:outcome});
    }

    if(document.getElementById('rd-replay-btn')) document.getElementById('rd-replay-btn').remove();
    const replayBtn=document.createElement('button');
    replayBtn.id='rd-replay-btn';
    replayBtn.className='rd-btn';
    replayBtn.style.marginTop='10px';
    replayBtn.textContent='Again';
    replayBtn.onclick=()=>{
      replayCount++; sessionCycle++;
      const replayLine=getReplayLine(replayCount);
      roundIdx=0; overallPs=0; overallRs=0;
      ROWE_STATE.duel_complete=false;
      // Re-shuffle round order
      for(let i=ROUND_TYPES.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ROUND_TYPES[i],ROUND_TYPES[j]]=[ROUND_TYPES[j],ROUND_TYPES[i]];
      }
      document.getElementById('rd-fquote').textContent=replayLine;
      document.getElementById('rd-fov').classList.add('show');
      setTimeout(()=>{
        document.getElementById('rd-fov').classList.remove('show');
        pips(); startRound();
      },2200);
    };
    document.getElementById('rd-fov').appendChild(replayBtn);

    document.getElementById('rd-fdone').onclick=()=>{
      overlay.remove();
      if(typeof onComplete==='function') onComplete(outcome);
    };
  }

  // ── MATRIX HELPERS ────────────────────────────────────────
  function mkMx(id,grid,missIdx,isr){
    const el=document.getElementById(id);
    el.innerHTML='';
    el.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:9px;';
    grid.forEach((sym,i)=>{
      const c=document.createElement('div');
      if(i===missIdx){
        c.className='rd-cell rd-miss'+(isr?' rd-rmiss':'');
        c.id=id+'drop';
        if(!isr){
          c.addEventListener('pointerenter',()=>{if(drag)c.classList.add('rd-dta');});
          c.addEventListener('pointerleave',()=>c.classList.remove('rd-dta'));
        }
      } else {
        c.className='rd-cell';
        c.textContent=sym||'';
        c.style.fontSize=(sym&&sym.length>2)?'12px':'19px';
      }
      el.appendChild(c);
    });
  }

  function mkOpts(opts,ans){
    const el=document.getElementById('rd-opts');
    el.innerHTML='';
    const ol=document.getElementById('rd-ol');
    if(ol) ol.textContent='Drag to complete';
    opts.forEach(o=>{
      const d=document.createElement('div');
      d.className='rd-opt';
      d.textContent=o;
      d.style.fontSize=o.length>2?'11px':'17px';
      d.dataset.v=o; d.dataset.a=ans;
      d.addEventListener('pointerdown',startDrag);
      el.appendChild(d);
    });
  }

  function startDrag(e){
    if(!active)return;
    const src=e.currentTarget;
    if(src.classList.contains('used'))return;
    e.preventDefault();
    drag=src; drag.classList.add('dg');
    const g=document.getElementById('rd-ghost');
    g.textContent=drag.textContent;
    g.style.fontSize=drag.textContent.length>2?'16px':'24px';
    g.style.display='block';
    moveG(e.clientX,e.clientY);
    document.addEventListener('pointermove',moveDrag);
    document.addEventListener('pointerup',endDrag);
  }

  function moveDrag(e){
    moveG(e.clientX,e.clientY);
    const drop=document.getElementById('rd-pmxdrop');
    if(!drop)return;
    const r=drop.getBoundingClientRect();
    const over=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    drop.classList.toggle('rd-dta',over&&!!drag);
  }

  function moveG(x,y){
    const g=document.getElementById('rd-ghost');
    g.style.left=x+'px'; g.style.top=y+'px';
  }

  function endDrag(e){
    document.removeEventListener('pointermove',moveDrag);
    document.removeEventListener('pointerup',endDrag);
    document.getElementById('rd-ghost').style.display='none';
    const drop=document.getElementById('rd-pmxdrop');
    if(drag&&drop){
      const r=drop.getBoundingClientRect();
      const over=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
      if(over){
        drop.classList.remove('rd-dta');
        const val=drag.dataset.v, ans=drag.dataset.a;
        drag.classList.add('used'); drag.classList.remove('dg');
        doAnswer(val,ans,drop); drag=null; return;
      }
    }
    if(drag){drag.classList.remove('dg');drag=null;}
    if(drop)drop.classList.remove('rd-dta');
  }

  function doAnswer(val,ans,cell){
    if(!active)return;
    active=false; clearTimeout(rTimer); clearInterval(tInt);
    const correct=val===ans;
    cell.textContent=val; cell.style.fontSize=val.length>2?'12px':'19px';
    cell.classList.remove('rd-miss','rd-dta');
    cell.classList.add(correct?'rd-ok':'rd-bad');
    if(correct)roundPs++;
    document.getElementById('rd-tf').style.width='0%';
    const roweExpected=currentRoundPuzzles[puzzleIdx]?currentRoundPuzzles[puzzleIdx].roweMs:6000;
    const gapMs=roweExpected-(Date.now()-roundStartTime);
    setTimeout(()=>showPuzzleResult(correct?'player':null,gapMs),650);
  }

  // ── SPEED ROUND ───────────────────────────────────────────
  function startSpeedRound(pz){
    const pmx=document.getElementById('rd-pmx');
    pmx.innerHTML='';
    pmx.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:9px;';
    const ol=document.getElementById('rd-ol');
    if(ol) ol.textContent='';
    document.getElementById('rd-opts').innerHTML='';
    document.getElementById('rd-hint').textContent=`TAP: ${pz.target}`;

    let playerTaps=0;
    const needed=pz.count;

    pz.grid.forEach(sym=>{
      const c=document.createElement('div');
      c.className='rd-cell';
      c.textContent=sym;
      c.style.fontSize='22px';
      c.style.cursor='pointer';
      if(sym===pz.target){
        c.addEventListener('pointerdown',()=>{
          if(!active||c.dataset.tapped)return;
          c.dataset.tapped='1';
          c.style.background='rgba(184,150,12,0.3)';
          c.style.borderColor='rgba(184,150,12,0.7)';
          playerTaps++;
          if(playerTaps>=needed){
            const gapMs=pz.roweMs-(Date.now()-roundStartTime);
            active=false; clearInterval(tInt); clearTimeout(rTimer);
            document.getElementById('rd-tf').style.width='0%';
            roundPs++;
            setTimeout(()=>showPuzzleResult('player',gapMs),400);
          }
        });
      } else {
        c.addEventListener('pointerdown',()=>{
          if(!active)return;
          c.style.background='rgba(180,60,40,0.2)';
          setTimeout(()=>c.style.background='',300);
        });
      }
      pmx.appendChild(c);
    });

    const rmx=document.getElementById('rd-rmx');
    rmx.innerHTML='';
    rmx.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:120px;';
    const roweCount=document.createElement('div');
    roweCount.style.cssText='font-size:32px;color:rgba(122,90,74,0.5);line-height:1;';
    roweCount.textContent='0';
    rmx.appendChild(roweCount);

    const tapInterval=pz.roweMs/needed;
    let roweTapped=0;
    const roweTapTimer=setInterval(()=>{
      if(!active){clearInterval(roweTapTimer);return;}
      roweTapped++;
      roweCount.textContent=roweTapped;
      if(roweTapped>=needed) clearInterval(roweTapTimer);
    },tapInterval);
  }

  // ── MEMORY ROUND ─────────────────────────────────────────
  function startMemoryRound(pz){
    const pmx=document.getElementById('rd-pmx');
    const opts=document.getElementById('rd-opts');
    const ol=document.getElementById('rd-ol');
    opts.innerHTML='';
    if(ol) ol.textContent='';

    const seq=pz.sequence;
    const allSyms=['🕯️','🗝️','🎭','🔔','📜','🪞'];
    let playerProgress=0;
    let phase='show';

    function buildGrid(){
      pmx.innerHTML='';
      pmx.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:9px;';
      allSyms.forEach(sym=>{
        const c=document.createElement('div');
        c.className='rd-cell';
        c.textContent=sym;
        c.style.fontSize='20px';
        c.style.cursor='pointer';
        c.addEventListener('pointerdown',()=>handleMemTap(sym,c));
        pmx.appendChild(c);
      });
    }

    function showSequence(){
      phase='show';
      pmx.innerHTML='';
      pmx.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:130px;gap:6px;';
      const label=document.createElement('div');
      label.style.cssText='font-size:8px;letter-spacing:.2em;color:rgba(184,150,12,.3);margin-bottom:8px;';
      label.textContent='MEMORISE';
      pmx.appendChild(label);
      const seqRow=document.createElement('div');
      seqRow.style.cssText='display:flex;gap:8px;font-size:26px;';
      seq.forEach(s=>{const sp=document.createElement('span');sp.textContent=s;seqRow.appendChild(sp);});
      pmx.appendChild(seqRow);
      const diff=document.createElement('div');
      diff.style.cssText='font-size:8px;letter-spacing:.15em;color:rgba(184,150,12,.25);margin-top:6px;';
      diff.textContent=pz.difficulty.toUpperCase();
      pmx.appendChild(diff);

      setTimeout(()=>{
        if(!active)return;
        phase='dark';
        pmx.innerHTML='';
        pmx.style.cssText='display:flex;align-items:center;justify-content:center;min-height:130px;';
        const dark=document.createElement('div');
        dark.style.cssText='font-size:9px;letter-spacing:.2em;color:rgba(184,150,12,.2);';
        dark.textContent='RECONSTRUCT';
        pmx.appendChild(dark);
        setTimeout(()=>{if(!active)return;phase='input';buildGrid();},500);
      },pz.showMs);
    }

    function handleMemTap(sym,cell){
      if(phase!=='input'||!active)return;
      const expected=seq[playerProgress];
      if(sym===expected){
        cell.style.background='rgba(184,150,12,0.25)';
        cell.style.borderColor='rgba(184,150,12,0.6)';
        playerProgress++;
        if(playerProgress>=seq.length){
          const gapMs=pz.roweMs-(Date.now()-roundStartTime);
          active=false; clearInterval(tInt); clearTimeout(rTimer);
          document.getElementById('rd-tf').style.width='0%';
          roundPs++;
          setTimeout(()=>showPuzzleResult('player',gapMs),400);
        }
      } else {
        cell.style.background='rgba(180,60,40,0.25)';
        cell.style.borderColor='rgba(180,60,40,0.5)';
        setTimeout(()=>{cell.style.background='';cell.style.borderColor='';},400);
      }
    }

    const rmx=document.getElementById('rd-rmx');
    rmx.innerHTML='';
    rmx.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:130px;gap:4px;';
    const roweLbl=document.createElement('div');
    roweLbl.style.cssText='font-size:8px;letter-spacing:.2em;color:rgba(122,90,74,.3);';
    roweLbl.textContent='ROWE';
    rmx.appendChild(roweLbl);
    const roweSeq=document.createElement('div');
    roweSeq.style.cssText='display:flex;gap:6px;font-size:22px;min-height:32px;';
    rmx.appendChild(roweSeq);

    const roweRevealInterval=(pz.roweMs-pz.showMs)/seq.length;
    let roweRevealed=0;
    setTimeout(()=>{
      const roweRevTimer=setInterval(()=>{
        if(!active){clearInterval(roweRevTimer);return;}
        if(roweRevealed<seq.length){
          const sp=document.createElement('span');
          sp.textContent=seq[roweRevealed];
          sp.style.opacity='0';
          sp.style.transition='opacity 0.3s';
          roweSeq.appendChild(sp);
          setTimeout(()=>sp.style.opacity='0.5',50);
          roweRevealed++;
          if(roweRevealed>=seq.length) clearInterval(roweRevTimer);
        }
      },roweRevealInterval);
    },pz.showMs);

    showSequence();
  }

  pips();
  startRound();

  // ── DEV SHORTCUT — remove before launch ───────────────────
  window._roweDevSkip = function() {
    // Force player win — kill all pending timers, then jump to showFinal
    active = false;           // stops cInt / roweTapTimer interval guards
    clearTimeout(rTimer);     // stops Rowe's pending answer timer
    clearInterval(tInt);      // stops countdown bar interval
    overallPs = 3;
    overallRs = 0;
    const box = document.getElementById('rowe-duel-box');
    if (box) {
      const arena = box.querySelector('.rd-arena');
      if (arena) arena.style.visibility = 'hidden';
      const bar = document.getElementById('rd-tf');
      if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; }
    }
    showFinal();
  };
}

// ── ROWE ENGINE API ────────────────────────────────────────────

function initRowe(){
  ROWE_STATE.choice_made=false;
  ROWE_STATE.funnel_fired=false;
  ROWE_STATE.duel_complete=false;
  ROWE_STATE.duel_outcome=null;
  ROWE_STATE.visit_count=0;
}

function onRoweTalk(dialogueKey, gameState){
  if(['Q1','Q2','Q3','Q4'].includes(dialogueKey)){
    ROWE_STATE.choice_made=true;
  }
  if(dialogueKey==='FUNNEL'){
    ROWE_STATE.funnel_fired=true;
  }
}

function shouldFireFunnel(gameState){
  return ROWE_STATE.choice_made && !ROWE_STATE.funnel_fired;
}

function shouldFireDuel(){
  return ROWE_STATE.funnel_fired && !ROWE_STATE.duel_complete;
}

function getRoweDialogueState(){
  return {
    choice_made:    ROWE_STATE.choice_made,
    funnel_fired:   ROWE_STATE.funnel_fired,
    duel_complete:  ROWE_STATE.duel_complete,
    duel_outcome:   ROWE_STATE.duel_outcome,
    post_duel_unlocked: ROWE_STATE.duel_complete,
  };
}

// ── PROGRESS MIRROR ────────────────────────────────────────────
// Return visits after duel — Rowe responds to what player found.

const ROWE_PROGRESS = [
  {
    id: 'surgeon_solved',
    requires_nodes: ['vivienne_push_witnessed','greaves_maskless_witness','hatch_mask_admission'],
    response: "\"You found Vivienne. You found Greaves. You found Hatch.\" A pause. \"And at some point in the last hour you stopped looking for who did it and started building the case. I know because the questions you were asking changed shape.\" Another pause. \"I had the mask. I didn't have Vivienne. I found her unconvincing.\" He looks at you. \"You were right and I was wrong. I'll note that. It won't happen often.\"",
  },
  {
    id: 'surgeon_partial',
    requires_nodes: ['greaves_maskless_witness'],
    excludes_nodes: ['vivienne_push_witnessed'],
    response: "\"Greaves. Good. The maskless figure at the base of the stairs.\" A pause. \"You don't have the witness yet. There is one. She was on the terrace at seven forty-five and she has been waiting for someone to ask her the specific question that unlocks the only sentence that matters.\" He looks at you. \"I'm not telling you who she is. But she talks a great deal. The useful thing is buried under considerable performance.\"",
  },
  {
    id: 'vault_found',
    requires_state: 'vaultOpen',
    response: "\"The vault opened.\" He says it immediately. \"I can tell by the way you're walking.\" A pause. \"There's a specific quality to the gait of a person who has found the room nobody else found.\" He looks at you. \"What was in the safe.\"",
  },
  {
    id: 'compact_found',
    requires_state: 'compactAccessible',
    response: "\"You found the tunnel.\" Not a question. \"I didn't. I was waiting for Northcott to show me the notebook.\" A pause. \"What's past the wine cellar.\" He stops himself. \"Don't tell me. I want to work it out from your expression when you come back.\"",
  },
  {
    id: 'default',
    response: "\"You went to the ballroom first. Most people do.\" A pause. \"I went to the gallery. The candles told me more than the body did. The body tells you what happened. The candles tell you when someone was somewhere they shouldn't have been.\" He looks at you. \"What did you find that surprised you.\"",
  },
];

function getRoweProgressResponse(gameState){
  const ni = gameState.node_inventory || {};
  for(const prog of ROWE_PROGRESS){
    if(prog.requires_nodes && !prog.requires_nodes.every(n=>ni[n])) continue;
    if(prog.excludes_nodes && prog.excludes_nodes.some(n=>ni[n])) continue;
    if(prog.requires_state && !gameState[prog.requires_state]) continue;
    return prog;
  }
  return ROWE_PROGRESS.find(p=>p.id==='default');
}

// ── EP2/3 MEMORY ──────────────────────────────────────────────

function getRoweMemoryGreeting(episode){
  const nir = window.getNIR ? window.getNIR() : null;
  if(!nir) return null;
  const ep1 = nir.cases.ep1 || {};
  const ep2 = nir.cases.ep2 || {};
  const rowe1 = (ep1.behavioral_log||{}).rowe || {};

  if(episode==='ep2'){
    if(rowe1.deep_ending_reached)
      return "\"The Monastery.\" He says it without surprise. \"You found the tunnel. You found the vault. You got the full account.\" A pause. \"I didn't. I had the mask and I stopped there.\" He looks at you. \"You didn't stop there. I'm going to be more careful about where I stop this time.\"";
    if(rowe1.first_accusation_correct===false)
      return "\"You named the wrong man first.\" He says it directly. Not unkindly. \"So did I — in my head — before the mask surfaced. The difference is I didn't say it aloud.\" A pause. \"This place will give you more opportunity to say things aloud before you're certain. I'd recommend patience.\"";
    if(rowe1.iq_score>=2)
      return "\"You beat me on at least one round in the foyer.\" He says it. \"I've been waiting to see if that was a good day or a pattern.\" A pause. \"I'm going to find out.\"";
    return "\"The Estate.\" He looks at you. \"You came back.\" A pause. \"I wasn't entirely certain you would. I'm glad you did. There are things here that require someone who doesn't stop.\"";
  }

  if(episode==='ep3'){
    const rowe2 = (ep2.behavioral_log||{}).rowe || {};
    if(rowe1.deep_ending_reached && rowe2.deep_ending_reached)
      return "\"Twice.\" One word. A pause. \"You found the full account twice. Both buildings.\" He does not look at you. \"I found it once. By the time I arrived at the second you had already built the case I was building.\" Another pause. \"This is the last one. I'm not arriving second this time.\"";
    return "\"You know why I'm here.\" Not a question. The wit is present but something underneath it has changed. \"I reached a different conclusion from the same evidence. That's not personal.\" A pause. \"It is, a little. But primarily it's professional.\"";
  }
  return null;
}

// ── EXPOSE ────────────────────────────────────────────────────
// Expose to window for interrogation.js wiring
window.ROWE_STATE  = ROWE_STATE;
window.launchDuel  = launchDuel;
window.initRowe    = initRowe;

if(typeof module!=='undefined') module.exports={
  initRowe, onRoweTalk, shouldFireFunnel, shouldFireDuel,
  getRoweDialogueState, getRoweProgressResponse,
  getRoweMemoryGreeting, launchDuel, ROWE_STATE,
};
