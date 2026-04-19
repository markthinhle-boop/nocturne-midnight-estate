// ============================================================
// NOCTURNE — verdict.js
// Four outcomes. Second name in SILVER (not gold, not white).
// Franchise record to localStorage after final line.
// KB v4.0 — Episode 2: The Monastery (not The Sanatorium)
// Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// Already handled by engine.js resolveAccusation() and deliverVerdict()
// This file wires the verdict screen UI movements

NocturneEngine.on('verdictDelivery', ({ outcome, verdictString, nis }) => {
  // Handled by handleVerdictDelivery in ui.js
});

NocturneEngine.on('franchiseRecordWritten', ({ record }) => {
  // Record already written to localStorage in engine.js writeFranchiseRecord()
  // Show final franchise thread hint if applicable
  // Fires at 28s — after NIS summary appears at 14s
  const finalEl = document.getElementById('verdict-final-line');
  if (finalEl && record.tunnel_first_crossing_complete) {
    setTimeout(() => {
      const threadLine = document.createElement('div');
      threadLine.style.cssText = 'margin-top:24px;font-size:11px;color:var(--cream-dim);text-align:center;letter-spacing:0.15em;opacity:0;transition:opacity 800ms;';
      threadLine.textContent = 'Episode 2 — The Monastery';
      finalEl.parentNode.appendChild(threadLine);
      setTimeout(() => { threadLine.style.opacity = '1'; }, 200);
    }, 28000);
  }
});

window.initVerdict = function() {
  // No-op — verdict is driven by engine events
};
