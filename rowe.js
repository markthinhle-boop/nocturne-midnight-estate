// ── EDMUND ROWE ENGINE ─────────────────────────────────────────
// rowe.js — simplified. Duel engine removed.
// Flow: intro → any Q1-Q4 dialogue → close conversation → ballroom cutscene fires.
// KB v6.0 · Nocturne Studios LLC · MMXXVI

'use strict';

// ── STATE ──────────────────────────────────────────────────────
const ROWE_STATE = {
  choice_made:  false,  // any Q1-Q4 answered
  visit_count:  0,
};

function initRowe() {
  ROWE_STATE.choice_made = false;
  ROWE_STATE.visit_count  = 0;
}

// Called from interrogation.js when player picks a dialogue option.
// Any Q1-Q4 tap → mark choice_made → emit roweDuelComplete so prologue.js
// arms the ballroom cinematic. Player closes conversation, navigates, cutscene fires.
function onRoweTalk(dialogueKey, gameState) {
  if (['Q1','Q2','Q3','Q4'].includes(dialogueKey)) {
    ROWE_STATE.choice_made = true;
    // Emit immediately — prologue.js intercepts next navigateTo and fires cinematic.
    if (window.NocturneEngine && typeof window.NocturneEngine.emit === 'function') {
      window.NocturneEngine.emit('roweDuelComplete', { outcome: 'dialogue' });
    }
  }
}

function getRoweDialogueState() {
  return {
    choice_made:         ROWE_STATE.choice_made,
    // Kept for compatibility with ui.js checks
    funnel_fired:        ROWE_STATE.choice_made,
    duel_complete:       ROWE_STATE.choice_made,
    post_duel_unlocked:  ROWE_STATE.choice_made,
  };
}

function shouldFireFunnel()  { return false; }
function shouldFireDuel()    { return false; }

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
