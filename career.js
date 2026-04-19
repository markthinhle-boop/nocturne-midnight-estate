// ============================================================
// NOCTURNE — career.js
// Career view UI. Debrief generator. NIS report renderer.
// Fires after verdict. Reads from NIR via behavioral_logger.js.
// KB v5.0 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── DIMENSION LABELS — NOCTURNE BRANDED ──────────────────────
// These are the ONLY labels shown to the player.
// Methodology mapping is internal — institutional PDF only.
// Professionals decode these through their training.
// Competitors see eight estate-themed dimension names.

const DIM_LABELS = {
  AP:  'The Approach',
  SQ:  'The Sequence',
  RV:  'The Reveal',
  MT:  'The Method',
  YD:  'The Yield',
  BS:  'The Blindspot',
  ST:  'The Standard',
  PC:  'The Picture',
};

// Internal methodology references — NEVER shown in game UI.
// Used only in institutional pitch deck and methodology PDF.
const DIM_REFS_INTERNAL = {
  AP:  'ORBIT · RBI-SF · HIG Rapport',
  SQ:  'PEACE Account · HIG Funnel · CI',
  RV:  'SUE · Scharff · HIG Evidence',
  MT:  'PEACE Adaptability · RBI-SF',
  YD:  'IYA · ORBIT Yield Assessment',
  BS:  'HIG Bias Research · FBI LEB',
  ST:  'Méndez Principles · PEACE Ethics',
  PC:  'FLETC Judgment · HIG Synthesis',
};

const CASE_NAMES = {
  ep1: 'The Estate',
  ep2: 'The Monastery',
  ep3: 'The War',
};

// ── DEBRIEF GENERATION ────────────────────────────────────────
// Produces the full post-verdict debrief text.
// Called by nis.js after scores are computed.

function generateDebrief(episodeKey, caseData, scores, tier) {
  const bl    = caseData.behavioral_log;
  const chars = bl.characters || {};
  const hyp   = bl.hypothesis;

  const lines = [];

  // ── Header ─────────────────────────────────────────────────
  lines.push(`NOCTURNE INVESTIGATIVE STANDARD`);
  lines.push(`Case: ${CASE_NAMES[episodeKey] || episodeKey}`);
  lines.push(`NIS Composite: ${caseData.nis.composite} — ${tier.label}`);
  lines.push('');
  lines.push('─'.repeat(48));

  // ── RE ─────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE APPROACH: ${scores.AP} — ${_tier(scores.AP)}`);
  lines.push('');

  const totalChars       = Object.keys(chars).length;
  const approachComplete = Object.values(chars).filter(c => c.approach_completed).length;
  const skipped          = Object.values(chars).filter(c => c.approach_skipped).length;
  const openFirst        = Object.values(chars).filter(c => c.open_before_targeted === true).length;

  if (approachComplete === totalChars && totalChars > 0) {
    lines.push(`Approach phase completed for all ${totalChars} characters — baseline established before each conversation. This is the correct professional sequence.`);
  } else if (approachComplete > 0) {
    lines.push(`Approach phase completed for ${approachComplete} of ${totalChars} characters. ${skipped > 0 ? `${skipped} conversation${skipped > 1 ? 's' : ''} began with a question before baseline was established.` : ''}`);
  } else {
    lines.push(`Approach phase was not completed for any character. Baseline behavior was unavailable — composure readings are therefore less diagnostic.`);
  }

  if (openFirst < totalChars && totalChars > 0) {
    const earlyPressure = totalChars - openFirst;
    lines.push(`${earlyPressure} conversation${earlyPressure > 1 ? 's' : ''} opened with a targeted question before free narrative was established. This is the pattern HIG training identifies as reducing unexpected information disclosure.`);
  }

  if (bl.wait_technique_used) {
    lines.push(`The Wait technique was employed — demonstrating patience consistent with ORBIT's highest rapport behaviors.`);
  }

  lines.push(`Reference: ORBIT ≥ 2.5/4 = RE ≥ 70. Current: ${scores.AP}.`);

  // ── FSA ────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE SEQUENCE: ${scores.SQ} — ${_tier(scores.SQ)}`);
  lines.push('');

  const funnelCorrect  = Object.values(chars).filter(c => c.open_before_targeted === true).length;
  const funnelViolated = Object.values(chars).filter(c => c.open_before_targeted === false).length;
  const revCorrect     = Object.values(chars).filter(c => c.reverse_order_used && c.reverse_order_timing === 'after_forward').length;
  const revWrong       = Object.values(chars).filter(c => c.reverse_order_used && c.reverse_order_timing === 'before_forward').length;

  if (funnelCorrect > 0) {
    lines.push(`Open narrative questions were used as first questions in ${funnelCorrect} of ${totalChars} conversations — correct funnel sequencing.`);
  }
  if (funnelViolated > 0) {
    lines.push(`${funnelViolated} conversation${funnelViolated > 1 ? 's' : ''} opened with targeted questions before free narrative. HIG: "if the questions start broadly and gradually narrow, the team stands a better chance of collecting additional and unexpected information."`);
  }
  if (revCorrect > 0) {
    lines.push(`Reverse order questioning was applied correctly ${revCorrect} time${revCorrect > 1 ? 's' : ''} — after the full forward account was established. This is correct Cognitive Interview protocol.`);
  }
  if (revWrong > 0) {
    lines.push(`Reverse order questioning was attempted before the forward account was complete — this reduces its diagnostic value.`);
  }

  // ── ES ─────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE REVEAL: ${scores.RV} — ${_tier(scores.RV)}`);
  lines.push('');

  let sueCorrect = 0, sueWrong = 0, inconsistencies = 0, scharffCorrections = 0;
  Object.values(chars).forEach(cl => {
    Object.values(cl.evidence_timing || {}).forEach(t => {
      if (t === 'after_question')  sueCorrect++;
      if (t === 'before_question') sueWrong++;
    });
    inconsistencies      += cl.inconsistency_branches_unlocked || 0;
    scharffCorrections   += cl.scharff_corrections             || 0;
  });

  if (sueCorrect > 0) {
    lines.push(`SUE sequencing applied correctly in ${sueCorrect} evidence presentation${sueCorrect > 1 ? 's' : ''} — evidence withheld until after the character's account was taken. Committed statements were obtained before contradiction.`);
  }
  if (sueWrong > 0) {
    lines.push(`${sueWrong} evidence item${sueWrong > 1 ? 's' : ''} revealed before questioning on the same topic — early disclosure. The inconsistency branch was not available as a result.`);
  }
  if (inconsistencies > 0) {
    lines.push(`${inconsistencies} inconsistency branch${inconsistencies > 1 ? 'es' : ''} unlocked through correct SUE application.`);
  }
  if (scharffCorrections > 0) {
    lines.push(`${scharffCorrections} Scharff correction${scharffCorrections > 1 ? 's' : ''} received — characters volunteered corrections to narrative statements, revealing information without being directly asked.`);
  }
  if (bl.deceptions_wasted > 0) {
    lines.push(`${bl.deceptions_wasted} deception${bl.deceptions_wasted > 1 ? 's' : ''} produced credibility strikes. Each reckless deception narrows subsequent investigative access.`);
  }

  // ── TSA ────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE METHOD: ${scores.MT} — ${_tier(scores.MT)}`);
  lines.push('');

  const compat   = window.TECHNIQUE_COMPATIBILITY || {};
  const charMeta = window.CHAR_META || {};

  const mismatches = Object.values(chars).filter(cl => {
    if (!cl.technique_selected || !cl.counter_strategy) return false;
    const row   = compat[cl.technique_selected];
    const score = row ? (row[cl.counter_strategy] || 0) : 0;
    return score < 0;
  });

  const optimalMatches = Object.values(chars).filter(cl => cl.technique_match === true).length;

  if (optimalMatches > 0) {
    lines.push(`Optimal technique selected for ${optimalMatches} character${optimalMatches > 1 ? 's' : ''}.`);
  }

  mismatches.forEach(cl => {
    const techName = _techLabel(cl.technique_selected);
    const stratName = cl.counter_strategy;
    lines.push(`${_charDisplayName(cl.char_id)}: ${techName} was selected against a ${stratName} counter-strategy — a technique mismatch. ${_mismatchNote(cl.technique_selected, cl.counter_strategy)}`);
  });

  const techniquesUsed = new Set(Object.values(chars).map(c => c.technique_selected).filter(Boolean));
  if (techniquesUsed.size >= 3) {
    lines.push(`${techniquesUsed.size} distinct techniques deployed — demonstrating the adaptive flexibility the RBI-SF identifies as the highest-order interviewing skill.`);
  } else if (techniquesUsed.size === 1) {
    lines.push(`A single technique was applied across all conversations. The PEACE model and HIG training both emphasise adaptability — different counter-strategies require different approaches.`);
  }

  lines.push(`Reference: RBI-SF adaptability item — the single most theoretically significant interviewing skill.`);

  // ── IY ─────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE YIELD: ${scores.YD} — ${_tier(scores.YD)}`);
  lines.push('');

  const nodes    = window.INFORMATION_NODES || {};
  const completed = bl.information_nodes || {};
  let byCategory = { people: [0,0], locations: [0,0], actions: [0,0], times: [0,0] };

  Object.entries(nodes).forEach(([id, meta]) => {
    const cat = meta.category;
    if (!byCategory[cat]) return;
    byCategory[cat][1]++;
    if (completed[id]) byCategory[cat][0]++;
  });

  lines.push(`Information assembled by category:`);
  lines.push(`  People:    ${byCategory.people[0]}/${byCategory.people[1]}`);
  lines.push(`  Locations: ${byCategory.locations[0]}/${byCategory.locations[1]}`);
  lines.push(`  Actions:   ${byCategory.actions[0]}/${byCategory.actions[1]}`);
  lines.push(`  Times:     ${byCategory.times[0]}/${byCategory.times[1]} (weighted 1.5×)`);

  const totalFound = Object.values(completed).filter(Boolean).length;
  const totalNodes = Object.keys(nodes).length;
  lines.push(`Total: ${totalFound}/${totalNodes} nodes assembled.`);

  if (byCategory.times[0] < byCategory.times[1]) {
    const missing = byCategory.times[1] - byCategory.times[0];
    lines.push(`${missing} specific timestamp${missing > 1 ? 's' : ''} not assembled. Timestamps are weighted 1.5× — they are the hardest nodes to surface and the most investigatively precise.`);
  }

  lines.push(`Reference: IYA professional standard ≥ 65. Current: ${scores.YD}.`);

  // ── CBR ────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE BLINDSPOT: ${scores.BS} — ${_tier(scores.BS)}`);
  lines.push('');

  if (!hyp.formed) {
    lines.push(`No working hypothesis was formed during this investigation. The investigation proceeded without commitment to a single suspect.`);
  } else {
    const charsAfter       = (hyp.characters_visited_after || []).length;
    const contradicting    = hyp.contradicting_branches_after || 0;
    const supporting       = hyp.supporting_branches_after    || 0;

    lines.push(`Working hypothesis formed at conversation ${hyp.formed_at_conversation_number}${hyp.initial_suspect ? ` (${_charDisplayName(hyp.initial_suspect)})` : ''}.`);

    if (charsAfter === 0) {
      lines.push(`No additional characters were investigated after hypothesis formation. HIG research: "when a person generates a specific hypothesis early, their attention becomes focused on information that confirms their hypothesis."`);
    } else {
      lines.push(`${charsAfter} additional character${charsAfter > 1 ? 's' : ''} investigated after hypothesis formation.`);
    }

    if (contradicting > 0) {
      lines.push(`${contradicting} branch${contradicting > 1 ? 'es' : ''} completed on characters that contradicted the working hypothesis — demonstrating hypothesis-resistant investigation.`);
    } else if (supporting > 2) {
      lines.push(`Branches completed after hypothesis formation were predominantly confirming. No contradicting branches completed. This is the pattern associated with confirmation bias.`);
    }

    if (hyp.revised) {
      lines.push(`Hypothesis revised ${hyp.revision_count} time${hyp.revision_count > 1 ? 's' : ''} — demonstrating evidence-driven updating rather than commitment anchoring.`);
    } else {
      lines.push(`Hypothesis was not revised. ${hyp.final_suspect === 'surgeon' ? 'The final verdict was correct.' : 'The working hypothesis persisted to the final accusation.'}`);
    }
  }

  lines.push(`Reference: HIG forensic confirmation bias research. Post-hypothesis breadth predicts case quality.`);

  // ── EC ─────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE STANDARD: ${scores.ST} — ${_tier(scores.ST)}`);
  lines.push('');

  if (bl.confrontations_on_innocent > 0) {
    lines.push(`${bl.confrontations_on_innocent} direct confrontation${bl.confrontations_on_innocent > 1 ? 's' : ''} applied to innocent character${bl.confrontations_on_innocent > 1 ? 's' : ''} — branches permanently closed as a result.`);
  } else {
    lines.push(`No confrontations applied to innocent characters.`);
  }

  if (bl.deceptions_wasted === 0) {
    lines.push(`Deception resources used without credibility cost.`);
  }

  if (bl.patience_moments > 0) {
    lines.push(`Silence_tell elicited ${bl.patience_moments} time${bl.patience_moments > 1 ? 's' : ''} through the Wait technique — the most restrained information-gathering approach available.`);
  }

  if (bl.walkthroughs_taken > 0) {
    lines.push(`${bl.walkthroughs_taken} walkthrough${bl.walkthroughs_taken > 1 ? 's' : ''} used — investigation shortcuts reduce the evidential weight of assembled information.`);
  }

  lines.push(`Reference: Méndez Principles (UN 2021). EC ≥ 85 = compliant practice.`);

  // ── IS ─────────────────────────────────────────────────────
  lines.push('');
  lines.push(`THE PICTURE: ${scores.PC} — ${_tier(scores.PC)}`);
  lines.push('');

  const verdict  = caseData.verdict_outcome || caseData.verdict;

  if (verdict === 'deep') {
    lines.push(`Deep ending reached — the full account assembled. The vault opened, the tunnel crossed, both records corrected. The manufactured betrayal named. This is the complete investigative outcome.`);
  } else if (verdict === 'surface') {
    lines.push(`Correct verdict reached — the Surgeon named. The vault was not opened. The full account exists but was not assembled. The Estate holds a partial truth.`);
  } else if (verdict === 'wrong') {
    lines.push(`Incorrect verdict recorded — the wrong suspect named. The case is closed. The real perpetrator was not identified. Evidence sufficient for the correct verdict was available in this investigation.`);
  }

  lines.push(`Reference: FLETC judgment and decision-making. A correct conviction on incorrect reasoning is professionally a failure under HIG standards.`);

  // ── Footer ─────────────────────────────────────────────────
  lines.push('');
  lines.push('─'.repeat(48));
  lines.push('');
  lines.push(`This debrief maps to:`);
  lines.push(`ORBIT — Alison & Alison, University of Liverpool / FBI HIG (2020)`);
  lines.push(`PEACE Five-Tier Framework — UK Home Office / College of Policing`);
  lines.push(`HIG Best Practices — FBI (2016)`);
  lines.push(`Interview Yield Assessment — ORBIT framework`);
  lines.push(`Méndez Principles — UN Human Rights Council (2021)`);
  lines.push('');
  lines.push(`NIS scores reflect performance on a simulated scenario.`);
  lines.push(`They are not diagnostic tools for real investigations.`);

  return lines.join('\n');
}

// ── FORMATTING HELPERS ────────────────────────────────────────

function _formatTimestamp(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  const date = d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
  return `${date} · ${time}`;
}

function _formatDuration(ms) {
  if (!ms) return '—';
  const totalMin = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hrs > 0) return `${hrs}h ${min}m`;
  return `${min}m`;
}

function _outcomeLabel(outcome) {
  return { deep:'Deep Ending', surface:'Surface Ending', wrong:'Wrong Verdict' }[outcome] || '—';
}

// ── CAREER VIEW UI ────────────────────────────────────────────

function renderCareerView() {
  const nir = window.getNIR ? window.getNIR() : null;
  if (!nir) return;

  let container = document.getElementById('nis-career-view');
  if (!container) {
    container = document.createElement('div');
    container.id = 'nis-career-view';
    container.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:200',
      'background:#080503',
      'overflow-y:auto',
      'padding:0 0 60px',
      'box-sizing:border-box',
      'font-family:var(--font-ui)',
      'color:var(--cream)',
      '-webkit-overflow-scrolling:touch',
    ].join(';');
    document.body.appendChild(container);
  }
  container.innerHTML = '';

  // ── Close ─────────────────────────────────────────────────
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = [
    'position:fixed','top:16px','right:20px','z-index:201',
    'background:transparent','border:none',
    'color:rgba(184,150,12,0.5)','font-size:28px',
    'cursor:pointer','padding:4px 8px','line-height:1',
    'font-family:var(--font-ui)',
  ].join(';');
  closeBtn.onclick = () => container.remove();
  container.appendChild(closeBtn);

  // ── Header ────────────────────────────────────────────────
  const header = document.createElement('div');
  header.style.cssText = 'padding:36px 24px 20px;border-bottom:1px solid rgba(42,37,28,0.5);';

  const nirLabel = document.createElement('div');
  nirLabel.style.cssText = 'font-size:8px;color:rgba(184,150,12,0.4);letter-spacing:0.35em;text-transform:uppercase;margin-bottom:6px;';
  nirLabel.textContent = 'NOCTURNE INVESTIGATIVE RECORD';
  header.appendChild(nirLabel);

  const invId = document.createElement('div');
  invId.style.cssText = 'font-size:9px;color:rgba(100,90,70,0.35);letter-spacing:0.12em;';
  invId.textContent = nir.investigator_id || '—';
  header.appendChild(invId);
  container.appendChild(header);

  // ── Episode blocks ────────────────────────────────────────
  const EPISODES = [
    { key:'ep1', volume:'VOLUME 1', name:'THE ESTATE'    },
    { key:'ep2', volume:'VOLUME 2', name:'THE MONASTERY' },
    { key:'ep3', volume:'VOLUME 3', name:'THE WAR'       },
  ];

  EPISODES.forEach(({ key, volume, name }) => {
    const cd  = nir.cases[key];
    const blk = document.createElement('div');
    blk.style.cssText = 'border-bottom:1px solid rgba(42,37,28,0.4);padding:24px 24px 28px;';

    // Volume + name header
    const epHeader = document.createElement('div');
    epHeader.style.cssText = 'display:flex;align-items:baseline;gap:10px;margin-bottom:4px;';

    const volEl = document.createElement('div');
    volEl.style.cssText = 'font-size:8px;color:rgba(184,150,12,0.35);letter-spacing:0.3em;text-transform:uppercase;';
    volEl.textContent = volume;

    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-size:13px;color:rgba(160,145,110,0.9);letter-spacing:0.12em;text-transform:uppercase;';
    nameEl.textContent = name;

    epHeader.appendChild(volEl);
    epHeader.appendChild(nameEl);
    blk.appendChild(epHeader);

    if (!cd.completed) {
      // Not yet played
      const pending = document.createElement('div');
      pending.style.cssText = 'font-size:10px;color:rgba(100,90,70,0.3);letter-spacing:0.1em;margin-top:10px;';
      pending.textContent = '— Not yet investigated —';
      blk.appendChild(pending);
      container.appendChild(blk);
      return;
    }

    // ── Case metadata row ──────────────────────────────────
    const meta = document.createElement('div');
    meta.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;margin-top:10px;margin-bottom:18px;';

    const metaItems = [
      { label:'Completed', value: _formatTimestamp(cd.completed_at) },
      { label:'Duration',  value: _formatDuration(cd.session_duration_ms) },
      { label:'Verdict',   value: _outcomeLabel(cd.verdict_outcome || cd.verdict) },
    ];

    metaItems.forEach(({ label, value }) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:7px;color:rgba(100,90,70,0.4);letter-spacing:0.2em;text-transform:uppercase;';
      lbl.textContent = label;
      const val = document.createElement('div');
      val.style.cssText = 'font-size:10px;color:rgba(160,145,110,0.8);letter-spacing:0.05em;';
      val.textContent = value;
      item.appendChild(lbl);
      item.appendChild(val);
      meta.appendChild(item);
    });
    blk.appendChild(meta);

    // ── NIS tier + composite ───────────────────────────────
    if (cd.nis && cd.nis.composite !== null) {
      const scoreBlock = document.createElement('div');
      scoreBlock.style.cssText = [
        'display:flex',
        'align-items:center',
        'gap:16px',
        'padding:14px 16px',
        'border:1px solid rgba(42,37,28,0.6)',
        'margin-bottom:18px',
        'background:rgba(12,9,5,0.6)',
      ].join(';');

      const compositeEl = document.createElement('div');
      compositeEl.style.cssText = 'font-size:32px;color:var(--cream);letter-spacing:0.02em;line-height:1;min-width:48px;';
      compositeEl.textContent = cd.nis.composite;

      const tierBlock = document.createElement('div');
      const tierEl = document.createElement('div');
      tierEl.style.cssText = 'font-size:11px;color:rgba(184,150,12,0.8);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:3px;';
      tierEl.textContent = cd.nis.tier || '—';
      const nisLbl = document.createElement('div');
      nisLbl.style.cssText = 'font-size:7px;color:rgba(100,90,70,0.4);letter-spacing:0.2em;text-transform:uppercase;';
      nisLbl.textContent = 'NIS COMPOSITE';
      tierBlock.appendChild(tierEl);
      tierBlock.appendChild(nisLbl);

      scoreBlock.appendChild(compositeEl);
      scoreBlock.appendChild(tierBlock);
      blk.appendChild(scoreBlock);

      // ── Dimension bars ─────────────────────────────────
      const dims = document.createElement('div');
      dims.style.cssText = 'display:flex;flex-direction:column;gap:7px;';

      Object.entries(DIM_LABELS).forEach(([key, label]) => {
        const score = cd.nis[key];
        if (score === null || score === undefined) return;

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;';

        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size:8px;color:rgba(120,108,80,0.7);letter-spacing:0.08em;min-width:90px;text-transform:uppercase;';
        lbl.textContent = label;

        const track = document.createElement('div');
        track.style.cssText = 'flex:1;height:3px;background:rgba(42,37,28,0.6);position:relative;';

        const fill = document.createElement('div');
        const pct  = Math.round(score);
        const col  = score >= 80 ? 'rgba(184,150,12,0.7)'
                   : score >= 60 ? 'rgba(140,120,70,0.6)'
                   : score >= 40 ? 'rgba(100,85,50,0.5)'
                   :               'rgba(140,60,40,0.5)';
        fill.style.cssText = `position:absolute;left:0;top:0;height:100%;width:${pct}%;background:${col};transition:width 600ms ease;`;
        track.appendChild(fill);

        const scoreEl = document.createElement('div');
        scoreEl.style.cssText = 'font-size:8px;color:rgba(120,108,80,0.6);min-width:24px;text-align:right;';
        scoreEl.textContent = pct;

        row.appendChild(lbl);
        row.appendChild(track);
        row.appendChild(scoreEl);
        dims.appendChild(row);
      });

      blk.appendChild(dims);
    }

    container.appendChild(blk);
  });

  // ── Career summary (2+ cases) ─────────────────────────────
  const career = nir.career;
  if (career.cases_completed >= 2) {
    const summaryBlk = document.createElement('div');
    summaryBlk.style.cssText = 'padding:24px 24px;border-bottom:1px solid rgba(42,37,28,0.4);';

    const sumTitle = document.createElement('div');
    sumTitle.style.cssText = 'font-size:8px;color:rgba(184,150,12,0.35);letter-spacing:0.3em;text-transform:uppercase;margin-bottom:14px;';
    sumTitle.textContent = 'CAREER SUMMARY';
    summaryBlk.appendChild(sumTitle);

    const sumItems = [
      { label:'Cases completed',   value: career.cases_completed },
      { label:'Strongest dimension', value: career.strongest_dimension ? DIM_LABELS[career.strongest_dimension] || career.strongest_dimension : '—' },
      { label:'Weakest dimension',   value: career.weakest_dimension   ? DIM_LABELS[career.weakest_dimension]   || career.weakest_dimension   : '—' },
      { label:'Dominant technique',  value: career.dominant_technique  ? _techLabelShort(career.dominant_technique) : '—' },
    ];

    sumItems.forEach(({ label, value }) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px solid rgba(42,37,28,0.2);';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:9px;color:rgba(100,90,70,0.5);letter-spacing:0.1em;';
      lbl.textContent = label;
      const val = document.createElement('div');
      val.style.cssText = 'font-size:10px;color:rgba(160,145,110,0.8);letter-spacing:0.05em;';
      val.textContent = value;
      row.appendChild(lbl);
      row.appendChild(val);
      summaryBlk.appendChild(row);
    });

    container.appendChild(summaryBlk);
  }

  // ── Debrief (most recent case) ────────────────────────────
  const latestEp = ['ep3','ep2','ep1'].find(ep => nir.cases[ep].completed);
  if (latestEp && nir.cases[latestEp].nis && nir.cases[latestEp].nis.debrief) {
    _renderDebriefSection(container, nir.cases[latestEp], latestEp);
  }

  // ── Footnote ──────────────────────────────────────────────
  const footnote = document.createElement('div');
  footnote.style.cssText = [
    'padding:24px 24px',
    'font-size:8px',
    'color:rgba(100,90,70,0.25)',
    'letter-spacing:0.08em',
    'line-height:1.9',
  ].join(';');
  footnote.innerHTML = [
    'THE NOCTURNE INVESTIGATIVE STANDARD',
    'A Society of Night · Est. Houston · MMXXVI',
    ' ',
    'NIS scores reflect investigative conduct within this case only.',
    'They are not diagnostic tools for real investigations.',
  ].join('<br>');
  container.appendChild(footnote);
}

function _techLabelShort(t) {
  return { account:'The Account', pressure:'The Pressure', approach:'The Approach', record:'The Record', wait:'The Wait' }[t] || t;
}

function _addTableRow(tbody, label, nir, dim, isComposite) {
  const row = document.createElement('tr');

  // Label cell
  const labelCell = document.createElement('td');
  labelCell.textContent = label;
  labelCell.style.cssText = [
    'padding:6px 8px',
    'color:' + (isComposite ? 'var(--cream)' : 'rgba(160,145,110,0.7)'),
    'font-size:' + (isComposite ? '11px' : '10px'),
    'font-weight:' + (isComposite ? 'normal' : 'normal'),
    'white-space:nowrap',
    isComposite ? 'border-bottom:1px solid rgba(42,37,28,0.3);' : '',
  ].join(';');
  row.appendChild(labelCell);

  // Score cells
  ['ep1','ep2','ep3'].forEach((ep, epIdx) => {
    const td   = document.createElement('td');
    const data = nir.cases[ep];
    let   val  = null;

    if (data.completed && data.nis) {
      val = dim === 'composite' ? data.nis.composite : data.nis[dim];
    }

    td.textContent = val !== null && val !== undefined ? String(val) : '—';
    td.style.cssText = [
      'padding:6px 8px',
      'text-align:center',
      'color:' + _scoreColor(val, isComposite),
      'font-size:' + (isComposite ? '11px' : '10px'),
      isComposite ? 'border-bottom:1px solid rgba(42,37,28,0.3);' : '',
    ].join(';');

    // Arrow for improvement/regression (ep2/ep3 only)
    if (epIdx > 0 && val !== null) {
      const prevEp  = epIdx === 1 ? 'ep1' : 'ep2';
      const prevData = nir.cases[prevEp];
      if (prevData.completed && prevData.nis) {
        const prevVal = dim === 'composite' ? prevData.nis.composite : prevData.nis[dim];
        if (prevVal !== null && prevVal !== undefined) {
          const diff = val - prevVal;
          if (diff >= 5) {
            td.textContent += ' ↑';
            td.style.color = 'rgba(120,180,100,0.8)';
          } else if (diff <= -5) {
            td.textContent += ' ↓';
            td.style.color = 'rgba(180,80,60,0.8)';
          }
        }
      }
    }

    row.appendChild(td);
  });

  tbody.appendChild(row);
}

function _renderDebriefSection(container, caseData, epKey) {
  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'border-top:1px solid rgba(42,37,28,0.4)',
    'padding-top:20px',
    'margin-top:8px',
  ].join(';');

  const debriefTitle = document.createElement('div');
  debriefTitle.style.cssText = 'font-size:9px;color:rgba(184,150,12,0.4);letter-spacing:0.25em;text-transform:uppercase;margin-bottom:14px;';
  debriefTitle.textContent = `Debrief — ${CASE_NAMES[epKey] || epKey}`;
  wrap.appendChild(debriefTitle);

  const debriefText = document.createElement('pre');
  debriefText.style.cssText = [
    'font-family:var(--font-ui)',
    'font-size:9px',
    'color:rgba(160,145,110,0.6)',
    'line-height:1.7',
    'white-space:pre-wrap',
    'word-break:break-word',
    'margin:0',
    'letter-spacing:0.03em',
  ].join(';');
  debriefText.textContent = caseData.nis.debrief || '';
  wrap.appendChild(debriefText);

  container.appendChild(wrap);
}

// ── HELPERS ───────────────────────────────────────────────────

function _tier(score) {
  const tiers = window.NIS_TIERS || [];
  const t = tiers.find(t => score >= t.min);
  return t ? t.label : 'Below Standard';
}

function _scoreColor(score, isBold) {
  if (score === null || score === undefined) return 'rgba(100,90,70,0.35)';
  if (score >= 80) return isBold ? 'var(--cream)' : 'rgba(180,165,130,0.9)';
  if (score >= 70) return 'rgba(160,145,110,0.8)';
  if (score >= 60) return 'rgba(140,125,90,0.7)';
  return 'rgba(180,80,60,0.7)';
}

function _charDisplayName(charId) {
  const chars = window.CHARACTERS || {};
  const c = chars[charId];
  return c ? c.display_name : charId;
}

function _techLabel(technique) {
  const labels = {
    account:  'The Account',
    pressure: 'The Pressure',
    approach: 'The Approach',
    record:   'The Record',
    wait:     'The Wait',
  };
  return labels[technique] || technique;
}

function _mismatchNote(technique, strategy) {
  const notes = {
    'pressure:cooperate': 'Cooperative characters respond better to Account or Record — The Pressure risks closing branches.',
    'pressure:fragment':  'Fragment characters need space to volunteer. The Pressure fragments the fragments.',
    'account:perform':    'The Account gives perform-strategy characters the most comfortable space. The Record or Pressure surfaces what they are managing.',
    'account:withhold':   'Withholding characters give minimum under Account. The Approach or Record applies more diagnostic pressure.',
    'wait:cooperate':     'Cooperative characters give their best information under direct questions, not silence.',
  };
  const key = `${technique}:${strategy}`;
  return notes[key] || 'Consider matching technique to the character\'s counter-strategy.';
}

// ── EVENT WIRING ──────────────────────────────────────────────

NocturneEngine.on('nisComputed', ({ episodeKey, scores, composite, tier }) => {
  // NIS scores are ready. Debrief has been generated.
  // Show the NIS summary as part of the verdict flow.
  // The full career view is accessible via the hamburger menu.
  setTimeout(() => {
    _showNISSummary(episodeKey, composite, tier);
  }, 14000); // After verdict text and Episode 2 hint
});

function _showNISSummary(episodeKey, composite, tier) {
  const nir     = window.getNIR ? window.getNIR() : null;
  const cd      = nir ? nir.cases[episodeKey] : null;
  const volName = { ep1:'VOLUME 1 · THE ESTATE', ep2:'VOLUME 2 · THE MONASTERY', ep3:'VOLUME 3 · THE WAR' }[episodeKey] || episodeKey;
  const outcome = cd ? _outcomeLabel(cd.verdict_outcome || cd.verdict) : '—';
  const ts      = cd ? _formatTimestamp(cd.completed_at) : '—';

  const summary = document.createElement('div');
  summary.id = 'nis-summary';
  summary.style.cssText = [
    'position:fixed',
    'bottom:80px',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:150',
    'background:rgba(8,5,3,0.97)',
    'border:1px solid rgba(42,37,28,0.5)',
    'padding:20px 24px',
    'font-family:var(--font-ui)',
    'text-align:center',
    'min-width:260px',
    'max-width:340px',
    'opacity:0',
    'transition:opacity 800ms',
  ].join(';');

  // Volume label
  const volEl = document.createElement('div');
  volEl.style.cssText = 'font-size:7px;color:rgba(184,150,12,0.35);letter-spacing:0.3em;text-transform:uppercase;margin-bottom:14px;';
  volEl.textContent = volName;
  summary.appendChild(volEl);

  // Score
  const scoreEl = document.createElement('div');
  scoreEl.style.cssText = 'font-size:36px;color:var(--cream);letter-spacing:0.02em;line-height:1;margin-bottom:6px;';
  scoreEl.textContent = String(composite);
  summary.appendChild(scoreEl);

  // Tier
  const tierEl = document.createElement('div');
  tierEl.style.cssText = 'font-size:10px;color:rgba(184,150,12,0.75);letter-spacing:0.25em;text-transform:uppercase;margin-bottom:16px;';
  tierEl.textContent = tier.label;
  summary.appendChild(tierEl);

  // Meta — outcome + timestamp
  const metaEl = document.createElement('div');
  metaEl.style.cssText = [
    'display:flex',
    'justify-content:space-between',
    'padding:10px 0',
    'border-top:1px solid rgba(42,37,28,0.4)',
    'border-bottom:1px solid rgba(42,37,28,0.4)',
    'margin-bottom:16px',
  ].join(';');

  [{ label:'Verdict', value: outcome }, { label:'Completed', value: ts }].forEach(({ label, value }) => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;flex-direction:column;gap:3px;';
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:7px;color:rgba(100,90,70,0.4);letter-spacing:0.2em;text-transform:uppercase;';
    lbl.textContent = label;
    const val = document.createElement('div');
    val.style.cssText = 'font-size:9px;color:rgba(160,145,110,0.8);letter-spacing:0.05em;';
    val.textContent = value;
    item.appendChild(lbl);
    item.appendChild(val);
    metaEl.appendChild(item);
  });
  summary.appendChild(metaEl);

  // Buttons
  const viewBtn = document.createElement('button');
  viewBtn.textContent = 'VIEW FULL DEBRIEF';
  viewBtn.style.cssText = [
    'border:1px solid rgba(184,150,12,0.25)',
    'background:transparent',
    'color:rgba(184,150,12,0.6)',
    'font-family:var(--font-ui)',
    'font-size:9px',
    'letter-spacing:0.2em',
    'padding:10px 16px',
    'cursor:pointer',
    'display:block',
    'width:100%',
    'margin-bottom:8px',
  ].join(';');
  viewBtn.onclick = () => { summary.remove(); renderCareerView(); };
  summary.appendChild(viewBtn);

  const dismissBtn = document.createElement('button');
  dismissBtn.textContent = 'DISMISS';
  dismissBtn.style.cssText = [
    'background:transparent',
    'border:none',
    'color:rgba(100,90,70,0.35)',
    'font-family:var(--font-ui)',
    'font-size:8px',
    'letter-spacing:0.15em',
    'padding:6px 0 0',
    'cursor:pointer',
    'display:block',
    'width:100%',
  ].join(';');
  dismissBtn.onclick = () => { summary.style.opacity = '0'; setTimeout(() => summary.remove(), 400); };
  summary.appendChild(dismissBtn);

  document.body.appendChild(summary);
  requestAnimationFrame(() => { summary.style.opacity = '1'; });
}

// Wire career view to hamburger menu
NocturneEngine.on('engineReady', () => {
  const hamburger = document.getElementById('btn-menu');
  if (hamburger) {
    hamburger.addEventListener('longpress', () => {
      renderCareerView();
    });
  }
});

// ── EXPOSE ────────────────────────────────────────────────────

window.generateDebrief  = generateDebrief;
window.renderCareerView = renderCareerView;
