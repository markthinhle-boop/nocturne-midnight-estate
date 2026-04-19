// ============================================================
// NOCTURNE — nis.js
// Nocturne Investigative Standard scoring engine.
// Runs once at verdict. Reads behavioral log. Produces 8 scores.
// Maps to: ORBIT (Alison & Alison 2020), PEACE Five-Tier,
//          HIG Best Practices (FBI 2016), IYA framework.
// KB v5.0 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── DIMENSION WEIGHTS ─────────────────────────────────────────
// Internal dimension codes — Nocturne-branded.
// Real-world framework mapping lives in methodology PDF only.
// Sum = 1.00

const NIS_WEIGHTS = {
  AP:  0.12,   // The Approach    (internal: Rapport Establishment)
  SQ:  0.13,   // The Sequence    (internal: Funnel Structure Adherence)
  RV:  0.15,   // The Reveal      (internal: Evidence Strategy)
  MT:  0.15,   // The Method      (internal: Technique Selection Accuracy)
  YD:  0.18,   // The Yield       (internal: Information Yield)
  BS:  0.12,   // The Blindspot   (internal: Confirmation Bias Resistance)
  ST:  0.08,   // The Standard    (internal: Ethical Compliance)
  PC:  0.07,   // The Picture     (internal: Investigative Synthesis)
};

// ── METHODOLOGY MAPPING — INTERNAL ONLY ───────────────────────
// NEVER rendered in game UI. Lives in methodology PDF and
// institutional pitch deck only.
// AP  → ORBIT / RBI-SF / HIG Rapport
// SQ  → PEACE Five-Tier Account / HIG Funnel / Cognitive Interview
// RV  → Strategic Use of Evidence (SUE) / Scharff
// MT  → PEACE Adaptability / RBI-SF Technique Selection
// YD  → Information Yield Assessment (IYA) / ORBIT
// BS  → HIG Bias Research / FBI Law Enforcement Bulletin
// ST  → Méndez Principles / PEACE Ethics
// PC  → FLETC Judgment / HIG Synthesis

// ── TIER THRESHOLDS ───────────────────────────────────────────
// Nocturne Estate labels — visible in game.
// Internal framework references kept for institutional PDF only.

const NIS_TIERS = [
  { min: 90, id: 'the_architect',  label: 'THE ARCHITECT', internal: 'PEACE Tier 5 / HIG Certified' },
  { min: 80, id: 'the_seal',       label: 'THE SEAL',      internal: 'PEACE Tier 4 / Advanced FLETC' },
  { min: 70, id: 'the_compact',    label: 'THE COMPACT',   internal: 'PEACE Tier 3 / Standard Professional' },
  { min: 60, id: 'the_estate',     label: 'THE ESTATE',    internal: 'PEACE Tier 2 / Post-Basic Training' },
  { min: 50, id: 'the_register',   label: 'THE REGISTER',  internal: 'PEACE Tier 1 / New Investigator' },
  { min: 40, id: 'the_gate',       label: 'THE GATE',      internal: 'Remediation Indicated' },
  { min: 0,  id: 'the_wilderness', label: 'THE WILDERNESS',internal: 'Intensive Remediation Required' },
];

// ── INFORMATION NODE WEIGHTS ──────────────────────────────────
// Imported from behavioral_logger.js via window.INFORMATION_NODES

function _getNodes() {
  return window.INFORMATION_NODES || {};
}

// ── MAIN ENTRY ────────────────────────────────────────────────

function computeNIS(episodeKey, nir) {
  if (!nir || !nir.cases[episodeKey]) {
    console.warn('[NIS] No case data for', episodeKey);
    return;
  }

  const caseData = nir.cases[episodeKey];
  const bl       = caseData.behavioral_log;
  const chars    = bl.characters || {};

  // Compute all 8 dimensions — internal codes
  const AP = _scoreRE(chars, bl);
  const SQ = _scoreFSA(chars, bl);
  const RV = _scoreES(chars, bl);
  const MT = _scoreTSA(chars, bl);
  const YD = _scoreIY(bl);
  const BS = _scoreCBR(bl);
  const ST = _scoreEC(chars, bl);
  const PC = _scoreIS(caseData, YD);

  // Clamp all to 0–100
  const scores = { AP, SQ, RV, MT, YD, BS, ST, PC };
  Object.keys(scores).forEach(k => {
    scores[k] = Math.max(0, Math.min(100, Math.round(scores[k])));
  });

  // Composite
  const composite = Math.round(
    Object.entries(NIS_WEIGHTS).reduce((sum, [dim, w]) => sum + (scores[dim] * w), 0)
  );

  // Tier
  const tier = NIS_TIERS.find(t => composite >= t.min) || NIS_TIERS[NIS_TIERS.length - 1];

  // Write scores
  caseData.nis = {
    ...scores,
    composite,
    tier:           tier.label,      // estate label — shown in career UI
    tier_id:        tier.id,
    tier_internal:  tier.internal,   // never exposed in UI
    debrief: null,
  };

  // Update career view
  _updateCareer(nir, episodeKey, scores, composite);

  // Save
  try {
    localStorage.setItem(window.NIR_KEY || 'nocturne_nir', JSON.stringify(nir));
  } catch(e) {}

  // Generate debrief
  if (typeof generateDebrief === 'function') {
    caseData.nis.debrief = generateDebrief(episodeKey, caseData, scores, tier);
    try {
      localStorage.setItem(window.NIR_KEY || 'nocturne_nir', JSON.stringify(nir));
    } catch(e) {}
  }

  // Surface to game
  NocturneEngine.emit('nisComputed', {
    episodeKey,
    scores,
    composite,
    tier,
  });

  return caseData.nis;
}

// ── DIMENSION 1 — RAPPORT ESTABLISHMENT (RE) ──────────────────
// Maps to: ORBIT rapport coding, RBI-SF reflective listening,
//          HIG "secure cooperation" principle.
// Benchmark: ORBIT ≥ 2.5/4 = RE ≥ 70.

function _scoreRE(chars, bl) {
  let score = 60; // Base — assumes minimal rapport behavior

  const totalChars = Object.keys(chars).length;
  if (totalChars === 0) return score;

  let approachCompleted   = 0;
  let openFirstQuestions  = 0;
  let earlyPressures      = 0;
  let earlyConfrontations = 0;

  Object.values(chars).forEach(cl => {
    if (cl.approach_completed)  approachCompleted++;
    if (cl.open_before_targeted === true)  openFirstQuestions++;
    if (cl.open_before_targeted === false) earlyPressures++;
    if (cl.direct_confrontation_used && cl.total_questions_asked <= 2) earlyConfrontations++;
  });

  // Approach completion rate
  const approachRate = approachCompleted / totalChars;
  score += approachRate * 20;          // Up to +20 for full approach compliance

  // Open-first question rate
  const openRate = openFirstQuestions / totalChars;
  score += openRate * 15;              // Up to +15

  // Penalties
  score -= earlyPressures     * 10;    // −10 per targeted-first conversation
  score -= earlyConfrontations * 15;   // −15 per early confrontation
  score -= bl.pressure_on_cooperate * 8; // −8 per pressure on cooperative char

  // Bonus: used Wait at least once (demonstrates patience/rapport awareness)
  if (bl.wait_technique_used) score += 8;

  return score;
}

// ── DIMENSION 2 — FUNNEL STRUCTURE ADHERENCE (FSA) ────────────
// Maps to: PEACE Account phase, HIG funnel approach,
//          Cognitive Interview open-to-focused sequence.
// Benchmark: HIG "questions start broadly and gradually narrow."

function _scoreFSA(chars, bl) {
  let score = 50;

  const scored = Object.values(chars).filter(cl => cl.total_questions_asked > 0);
  if (scored.length === 0) return score;

  let correctFunnels    = 0;
  let incorrectFunnels  = 0;
  let reverseOrderCorrect = 0;
  let reverseOrderWrong   = 0;

  scored.forEach(cl => {
    // Correct funnel: open narrative before targeted
    if (cl.open_before_targeted === true)  correctFunnels++;
    if (cl.open_before_targeted === false) incorrectFunnels++;

    // Reverse order: should come after full forward account
    if (cl.reverse_order_used) {
      if (cl.reverse_order_timing === 'after_forward')  reverseOrderCorrect++;
      if (cl.reverse_order_timing === 'before_forward') reverseOrderWrong++;
    }
  });

  const correctRate = correctFunnels / scored.length;
  score += correctRate * 35;          // Up to +35 for full funnel compliance

  score -= (incorrectFunnels / scored.length) * 25; // Penalty for violations

  // Reverse order
  score += reverseOrderCorrect * 12;  // Bonus for correct cognitive technique
  score -= reverseOrderWrong   * 15;  // Penalty for premature reverse order

  // Bonus: asked free narrative then focused follow-up in sequence
  scored.forEach(cl => {
    const seq = cl.question_sequence;
    if (seq.length >= 2 &&
        seq[0] === 'open_narrative' &&
        seq[1] === 'focused_follow_up') {
      score += 5;
    }
  });

  return score;
}

// ── DIMENSION 3 — EVIDENCE STRATEGY (ES) ─────────────────────
// Maps to: SUE technique, HIG strategic evidence use,
//          Scharff confirmation/disconfirmation.
// Benchmark: Late disclosure maximises statement-evidence inconsistencies
//            (Hartwig et al. 2005).

function _scoreES(chars, bl) {
  let score = 55;

  let sueCorrect   = 0;  // Evidence withheld, asked, then revealed
  let sueWrong     = 0;  // Evidence revealed before questioning
  let inconsistencies_unlocked = 0;
  let cooperation_unlocked     = 0;
  let scharffCorrections       = 0;
  let narrativeStatements      = 0;
  let deceptionsEffective      = bl.deceptions_effective || 0;
  let deceptionsWasted         = bl.deceptions_wasted    || 0;

  Object.values(chars).forEach(cl => {
    // SUE timing
    Object.values(cl.evidence_timing || {}).forEach(timing => {
      if (timing === 'after_question')  { sueCorrect++; }
      if (timing === 'before_question') { sueWrong++;   }
    });
    inconsistencies_unlocked += cl.inconsistency_branches_unlocked || 0;
    cooperation_unlocked     += cl.cooperation_branches_unlocked   || 0;
    scharffCorrections       += cl.scharff_corrections             || 0;
    narrativeStatements      += cl.narrative_statements_used       || 0;
  });

  // SUE scoring
  score += sueCorrect          * 15;   // +15 per correct SUE application
  score -= sueWrong            * 8;    // −8 per early disclosure
  score += inconsistencies_unlocked * 12; // +12 per inconsistency branch
  score += cooperation_unlocked     * 5;  // +5 per cooperation branch (valid but lower yield)

  // Scharff scoring
  score += scharffCorrections  * 8;    // +8 per received correction (Scharff working)
  score += Math.min(narrativeStatements * 5, 20); // Capped at +20

  // Deception scoring
  score += deceptionsEffective * 8;    // +8 per effective deception
  score -= deceptionsWasted    * 15;   // −15 per wasted deception

  return score;
}

// ── DIMENSION 4 — TECHNIQUE SELECTION ACCURACY (TSA) ─────────
// Maps to: PEACE adaptability, HIG "individualized, flexible" approach,
//          ORBIT adaptability item (highest-order skill).
// Benchmark: RBI-SF adaptability item — single most theoretically
//            significant skill in investigative interviewing.

function _scoreTSA(chars, bl) {
  let score = 50;

  const compat    = window.TECHNIQUE_COMPATIBILITY || {};
  const charMeta  = window.CHAR_META || {};

  let techniqueScores    = [];
  let optimalMatches     = 0;
  let suboptimalMatches  = 0;
  let poorMatches        = 0;
  let optimalSwitches    = 0;
  let poorSwitches       = 0;

  Object.values(chars).forEach(cl => {
    if (!cl.technique_selected || !cl.counter_strategy) return;

    const strategy = cl.counter_strategy;
    const technique = cl.technique_selected;
    const compatRow = compat[technique];
    const compatScore = compatRow ? (compatRow[strategy] || 0) : 0;

    techniqueScores.push(compatScore);

    if (compatScore >= 15)       optimalMatches++;
    else if (compatScore >= 0)   suboptimalMatches++;
    else                         poorMatches++;

    // Technique switch evaluation
    if (cl.technique_switched) {
      if (cl.switch_was_optimal) optimalSwitches++;
      else                       poorSwitches++;
    }
  });

  if (techniqueScores.length === 0) return score;

  // Average compatibility score (-30 to +25 range → normalise to 0–100)
  const avgCompat = techniqueScores.reduce((a, b) => a + b, 0) / techniqueScores.length;
  score += avgCompat * 1.5;   // Scale: +25 avg → +37.5, -30 avg → -45

  // Match rate bonuses/penalties
  score += optimalMatches    * 8;
  score -= poorMatches       * 12;

  // Switch evaluation
  score += optimalSwitches * 15;  // +15 for correct adaptive switch
  score -= poorSwitches    * 12;  // −12 for switching away from optimal

  // Bonus: used multiple different techniques (demonstrates flexibility)
  const techniquesUsed = new Set(Object.values(chars)
    .map(cl => cl.technique_selected)
    .filter(Boolean)
  ).size;
  if (techniquesUsed >= 3) score += 10;
  if (techniquesUsed >= 4) score += 8;
  if (techniquesUsed >= 5) score += 7;

  return score;
}

// ── DIMENSION 5 — INFORMATION YIELD (IY) ─────────────────────
// Maps to: IYA (Interview Yield Assessment) — ORBIT framework.
// Categories: People / Locations / Actions / Times (1.5× weight).
// Benchmark: Professional standard ≥ 65. Expert ≥ 85.

function _scoreIY(bl) {
  const nodes      = _getNodes();
  const completed  = bl.information_nodes || {};

  let totalWeight   = 0;
  let earnedWeight  = 0;

  Object.entries(nodes).forEach(([nodeId, meta]) => {
    const w = meta.weight || 1.0;
    totalWeight += w;
    if (completed[nodeId]) earnedWeight += w;
  });

  if (totalWeight === 0) return 50;

  return Math.round((earnedWeight / totalWeight) * 100);
}

// ── DIMENSION 6 — CONFIRMATION BIAS RESISTANCE (CBR) ─────────
// Maps to: HIG forensic confirmation bias research,
//          FBI Law Enforcement Bulletin on hypothesis formation.
// Benchmark: Post-hypothesis investigation breadth predicts case quality.

function _scoreCBR(bl) {
  const hyp = bl.hypothesis;

  // If hypothesis never formed — neutral (can't measure resistance to
  // something that didn't happen; also means they didn't commit early)
  if (!hyp || !hyp.formed) return 70;

  let score = 60; // Base after hypothesis formation

  // Positive: Characters visited after hypothesis formation
  const charsAfter = (hyp.characters_visited_after || []).length;
  score += Math.min(charsAfter * 8, 24);   // Up to +24 for visiting 3+ other chars

  // Positive: Contradicting branches completed after hypothesis
  score += (hyp.contradicting_branches_after || 0) * 15;

  // Positive: Hypothesis revised
  if (hyp.revised) {
    score += 25;
    score += (hyp.revision_count - 1) * 5; // Bonus for multiple revisions
  }

  // Negative: Only supporting branches completed after hypothesis
  const totalAfter = (hyp.branches_completed_after || []).length;
  const contradicting = hyp.contradicting_branches_after || 0;
  const supporting    = hyp.supporting_branches_after    || 0;
  if (totalAfter > 2 && contradicting === 0) {
    score -= 20; // Strong confirmation bias — only sought confirming evidence
  }

  // Negative: Stopped investigating quickly after hypothesis
  if (charsAfter === 0 && hyp.formed_at_conversation_number !== null) {
    score -= 25; // Investigation stopped after hypothesis formed
  }

  // Positive: Used Account technique on a character that contradicts hypothesis
  // (measured by technique match on non-hypothesis chars after hypothesis formed)
  const nonHypocharsVisited = charsAfter;
  if (nonHypocharsVisited >= 2) score += 10;

  return score;
}

// ── DIMENSION 7 — ETHICAL COMPLIANCE (EC) ────────────────────
// Maps to: Méndez Principles (UN 2021), PEACE ethical standards,
//          HIG non-coercive mandate, ORBIT maladaptive interviewing coding.
// Benchmark: EC ≥ 85 = Méndez-compliant practice.

function _scoreEC(chars, bl) {
  let score = 80; // High base — Nocturne doesn't expose full coercive toolkit

  // Penalties
  score -= (bl.confrontations_on_innocent || 0) * 15; // −15 per wrong confrontation
  score -= (bl.pressure_on_cooperate      || 0) * 10; // −10 per pressure/cooperate mismatch
  score -= (bl.pressure_on_fragment       || 0) * 8;  // −8 per pressure/fragment mismatch
  score -= (bl.deceptions_wasted          || 0) * 8;  // −8 per reckless deception
  score -= (bl.walkthroughs_taken         || 0) * 5;  // −5 per walkthrough (shortcut)
  score -= (bl.credibility_strikes        || 0) * 5;  // −5 per credibility strike

  // Bonuses
  if (bl.wait_technique_used)              score += 8;  // Demonstrated patience
  if (bl.full_backstory_via_rapport > 0)   score += 12; // Earned full backstory through rapport
  if (bl.patience_moments > 0)             score += 8;  // Waited for silence_tell
  if ((bl.deceptions_wasted || 0) === 0)   score += 5;  // No reckless deceptions

  // No confrontations at all = restraint bonus
  const anyConfrontation = Object.values(chars).some(cl => cl.direct_confrontation_used);
  if (!anyConfrontation) score += 5;

  return score;
}

// ── DIMENSION 8 — INVESTIGATIVE SYNTHESIS (IS) ────────────────
// Maps to: FLETC judgment and decision-making,
//          HIG information-driven interrogation,
//          case clearance quality.
// A correct conviction on bad evidence is a failure.

function _scoreIS(caseData, IYscore) {
  const bl      = caseData.behavioral_log;
  const outcome = caseData.verdict_outcome || caseData.verdict;

  let base = 40;

  // Verdict outcomes
  if (outcome === 'deep') {
    base = 85;
  } else if (outcome === 'surface') {
    base = 62;
  } else if (outcome === 'wrong') {
    // Partial credit for good process
    const partial = (bl.hypothesis && bl.hypothesis.revised ? 15 : 0) +
                    ((bl.hypothesis && bl.hypothesis.contradicting_branches_after || 0) * 5);
    base = 10 + partial;
  }

  // IY modifier: performance above/below professional standard (65)
  const IYmodifier = Math.round((IYscore - 65) * 0.3);
  base += IYmodifier;

  // Deep content bonuses
  if (caseData.conspiracy_found) base += 8;
  if (caseData.tunnel_found)     base += 5;

  return base;
}

// ── COMPOSITE ─────────────────────────────────────────────────

function _computeComposite(scores) {
  return Math.round(
    Object.entries(NIS_WEIGHTS).reduce((sum, [dim, w]) => sum + (scores[dim] * w), 0)
  );
}

// ── CAREER UPDATE ─────────────────────────────────────────────

function _updateCareer(nir, episodeKey, scores, composite) {
  const career   = nir.career;
  const epIndex  = { ep1: 0, ep2: 1, ep3: 2 }[episodeKey];

  // Ensure arrays are right length
  ['composite', 'AP', 'SQ', 'RV', 'MT', 'YD', 'BS', 'ST', 'PC'].forEach(dim => {
    if (!career.nis_by_case[dim]) career.nis_by_case[dim] = [];
    while (career.nis_by_case[dim].length <= epIndex) {
      career.nis_by_case[dim].push(null);
    }
    career.nis_by_case[dim][epIndex] = dim === 'composite' ? composite : scores[dim];
  });

  career.cases_completed = Object.values(nir.cases).filter(c => c.completed).length;

  if (career.cases_completed >= 2) {
    _analyseCareerPatterns(nir);
  }
}

function _analyseCareerPatterns(nir) {
  const career   = nir.career;
  const dims     = ['AP', 'SQ', 'RV', 'MT', 'YD', 'BS', 'ST', 'PC'];
  const completed = (career.nis_by_case['composite'] || []).filter(s => s !== null);

  if (completed.length < 2) return;

  // Average per dimension
  const avgByDim = {};
  dims.forEach(d => {
    const vals = (career.nis_by_case[d] || []).filter(s => s !== null);
    avgByDim[d] = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
  });

  // Strongest / weakest
  const sorted = [...dims].sort((a,b) => avgByDim[b] - avgByDim[a]);
  career.strongest_dimension = sorted[0];
  career.weakest_dimension   = sorted[sorted.length - 1];

  // Confirmation bias trend
  const bsVals = (career.nis_by_case['BS'] || []).filter(s => s !== null);
  if (bsVals.length >= 2) {
    const diff = bsVals[bsVals.length-1] - bsVals[0];
    career.confirmation_bias_trend = diff > 5 ? 'improving' : diff < -5 ? 'worsening' : 'stable';
  }

  career.pattern_notes = _generatePatternNotes(career, avgByDim);
}

function _generatePatternNotes(career, avgByDim) {
  const notes = [];
  const dimLabels = window.DIM_LABELS || {
    AP:'The Approach', SQ:'The Sequence', RV:'The Reveal',
    MT:'The Method',   YD:'The Yield',    BS:'The Blindspot',
    ST:'The Standard', PC:'The Picture',
  };

  if (career.strongest_dimension) {
    const lbl = dimLabels[career.strongest_dimension] || career.strongest_dimension;
    notes.push(`Strongest: ${lbl} (${Math.round(avgByDim[career.strongest_dimension])} avg)`);
  }
  if (career.weakest_dimension) {
    const lbl = dimLabels[career.weakest_dimension] || career.weakest_dimension;
    notes.push(`Developing: ${lbl} (${Math.round(avgByDim[career.weakest_dimension])} avg)`);
  }
  if (career.dominant_technique) {
    const techLabels = { account:'The Account', pressure:'The Pressure', approach:'The Approach', record:'The Record', wait:'The Wait' };
    notes.push(`Default technique: ${techLabels[career.dominant_technique] || career.dominant_technique}`);
  }
  if (career.confirmation_bias_trend === 'improving') {
    notes.push('The Blindspot improving across cases.');
  }
  if (career.confirmation_bias_trend === 'worsening') {
    notes.push('The Blindspot declining — review hypothesis management.');
  }

  return notes;
}

// ── TIER LOOKUP ───────────────────────────────────────────────

function getNISTier(score) {
  return NIS_TIERS.find(t => score >= t.min) || NIS_TIERS[NIS_TIERS.length - 1];
}

// ── EXPOSE ────────────────────────────────────────────────────

window.computeNIS   = computeNIS;
window.getNISTier   = getNISTier;
window.NIS_WEIGHTS  = NIS_WEIGHTS;
window.NIS_TIERS    = NIS_TIERS;
