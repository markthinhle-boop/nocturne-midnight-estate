// ============================================================
// NOCTURNE — notepad.js
// Investigator's notepad. Pencil icon on char-response.
// Notepad icon in HUD right of deception slots.
// Victorian full-screen pad. Per-suspect pages. Swipe to navigate.
// Unlimited scroll. Notes saved to localStorage via gameState.
// KB v10 · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── STATE ──────────────────────────────────────────────────
let _notepadInitialized = false;
let _askQuestionPatched = false;
let _padOpen            = false;
let _padCurrentIndex    = 0;
let _padSuspects        = [];
let _swipeStartX        = null;
let _lastQuestion       = ''; // stores the question text for context

function _getNotes() {
  if (!window.gameState) return {};
  if (!window.gameState.notepad) window.gameState.notepad = {};
  return window.gameState.notepad;
}

function _getCharNotes(charId) {
  const notes = _getNotes();
  if (!notes[charId]) notes[charId] = [];
  return notes[charId];
}

// ── SAVE A NOTE ────────────────────────────────────────────
function saveNoteForChar(charId, text) {
  if (!charId || !text || !text.trim()) return;
  const notes = _getCharNotes(charId);
  // Prevent duplicate — don't save if last note has identical text
  if (notes.length > 0 && notes[notes.length - 1].text === text.trim()) return;
  const entry = {
    id:        Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    text:      text.trim(),
    timestamp: Date.now(),
  };
  notes.push(entry);
  _getNotes()[charId] = notes;
  if (typeof saveGame === 'function') saveGame();
  _showSaveFlash();
}

function deleteNote(charId, noteId) {
  const notes = _getCharNotes(charId);
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx !== -1) notes.splice(idx, 1);
  if (typeof saveGame === 'function') saveGame();
  renderNotepadPage(_padCurrentIndex);
}

// ── OPEN / CLOSE ───────────────────────────────────────────
function openNotepad() {
  _refreshSuspectList();
  _padOpen = true;
  const panel = document.getElementById('notepad-panel');
  if (!panel) return;
  panel.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => panel.classList.add('visible'));
  });
  renderNotepadPage(_padCurrentIndex);
  if (typeof haptic === 'function') haptic([30]);
}

function closeNotepad() {
  _padOpen = false;
  const panel = document.getElementById('notepad-panel');
  if (!panel) return;
  panel.classList.remove('visible');
  setTimeout(() => { panel.style.display = 'none'; }, 350);
}

// ── SUSPECT LIST ───────────────────────────────────────────
function _refreshSuspectList() {
  const notes = _getNotes();
  const existingSet = new Set(_padSuspects);
  Object.keys(notes).forEach(charId => {
    if (!existingSet.has(charId) && notes[charId].length > 0) {
      _padSuspects.push(charId);
    }
  });
  _padSuspects = _padSuspects.filter(id => notes[id] && notes[id].length > 0);
  if (_padCurrentIndex >= _padSuspects.length) {
    _padCurrentIndex = Math.max(0, _padSuspects.length - 1);
  }
}

// ── RENDER PAGE ────────────────────────────────────────────
function renderNotepadPage(index) {
  _refreshSuspectList();

  const nameEl    = document.getElementById('np-suspect-name');
  const notesEl   = document.getElementById('np-notes-body');
  const counterEl = document.getElementById('np-page-counter');
  const prevBtn   = document.getElementById('np-prev');
  const nextBtn   = document.getElementById('np-next');
  const emptyEl   = document.getElementById('np-empty-state');

  if (!nameEl || !notesEl) return;

  if (_padSuspects.length === 0) {
    nameEl.textContent    = '—';
    notesEl.innerHTML     = '';
    counterEl.textContent = '';
    if (prevBtn) prevBtn.style.opacity = '0.2';
    if (nextBtn) nextBtn.style.opacity = '0.2';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const charId   = _padSuspects[index];
  const charData = (window.CHARACTERS && window.CHARACTERS[charId])
                || (window.COMPACT_CHARACTERS && window.COMPACT_CHARACTERS[charId]);
  
  const charName = charData ? (charData.display_name || charData.name || charId) : charId;
  
  const notes    = _getCharNotes(charId);

  nameEl.textContent    = charName.toUpperCase();
  counterEl.textContent = `${index + 1} / ${_padSuspects.length}`;

  if (prevBtn) prevBtn.style.opacity = index > 0 ? '1' : '0.2';
  if (nextBtn) nextBtn.style.opacity = index < _padSuspects.length - 1 ? '1' : '0.2';

  notesEl.innerHTML = '';

  notes.forEach((note, i) => {
    const entry = document.createElement('div');
    entry.className = 'np-note-entry';
    entry.style.animationDelay = `${i * 60}ms`;

    // Split Q: prefix from response if present
    const lines  = note.text.split('\n\n');
    const hasQ   = lines.length > 1 && lines[0].startsWith('Q:');
    const qLine  = hasQ ? lines[0].replace('Q: ', '') : null;
    const body   = hasQ ? lines.slice(1).join('\n\n') : note.text;

    if (qLine) {
      const qEl = document.createElement('div');
      qEl.className   = 'np-note-question';
      qEl.textContent = qLine;
      entry.appendChild(qEl);
    }

    const textEl = document.createElement('div');
    textEl.className   = 'np-note-text';
    textEl.textContent = body;

    const meta = document.createElement('div');
    meta.className = 'np-note-meta';
    // Game clock: session_start = gate entry (~8:45PM)
    // Calculate elapsed real minutes since session_start, add to 20:45
    const sessionStart = window.gameState && window.gameState.verdictTracker && window.gameState.verdictTracker.session_start;
    let timeStr;
    if (sessionStart) {
      const elapsedMs  = note.timestamp - sessionStart;
      const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
      const gameMinutes = (45 + elapsedMin) % 60;
      const gameHours   = 20 + Math.floor((45 + elapsedMin) / 60);
      timeStr = `${gameHours}:${gameMinutes.toString().padStart(2,'0')}`;
    } else {
      const d = new Date(note.timestamp);
      timeStr = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    }
    meta.textContent = `— ${timeStr}`;

    const del = document.createElement('button');
    del.className   = 'np-note-delete';
    del.textContent = '×';
    del.title       = 'Remove note';
    del.onclick = (e) => {
      e.stopPropagation();
      entry.style.opacity = '0';
      setTimeout(() => deleteNote(charId, note.id), 200);
    };

    entry.appendChild(textEl);
    entry.appendChild(meta);
    entry.appendChild(del);
    notesEl.appendChild(entry);
  });

  notesEl.scrollTop = 0;
}

// ── NAVIGATE ───────────────────────────────────────────────
function padNavigate(dir) {
  const newIndex = _padCurrentIndex + dir;
  if (newIndex < 0 || newIndex >= _padSuspects.length) return;

  const page = document.getElementById('np-notes-body');
  if (page) {
    page.style.transition = 'opacity 150ms, transform 150ms';
    page.style.opacity    = '0';
    page.style.transform  = `translateX(${dir * 30}px)`;
  }

  setTimeout(() => {
    _padCurrentIndex = newIndex;
    renderNotepadPage(_padCurrentIndex);
    if (page) {
      page.style.transform = `translateX(${-dir * 30}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          page.style.opacity   = '1';
          page.style.transform = 'translateX(0)';
        });
      });
    }
  }, 150);
}

// ── PENCIL ICON ────────────────────────────────────────────
function injectPencilIcon() {
  const existing = document.getElementById('np-pencil-btn');
  if (existing) existing.remove();

  // Gate: hide until antechamber unlocked (matches HUD icon gating)
  if (!window.gameState || !window.gameState.antechamberGateOpen) return;

  const resp   = document.getElementById('char-response');
  const charId = window._activeCharId;
  if (!resp || !charId) return;

  const text = resp.textContent.trim();
  if (!text || text === 'A slot wasted. They noticed.') return;

  const btn     = document.createElement('button');
  btn.id        = 'np-pencil-btn';
  btn.className = 'np-pencil-btn';
  btn.title     = 'Save to notepad';
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 14L5 12.5L13 4.5L14 5.5L6 13.5L4.5 15L3 14Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
    <path d="M11.5 3L15 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M3 15L3.5 13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

  btn.onclick = (e) => {
    e.stopPropagation();
    if (btn.dataset.saved) return; // already saved this response
    const clone = resp.cloneNode(true);
    const btnClone = clone.querySelector('#np-pencil-btn');
    if (btnClone) btnClone.remove();
    const responseText = clone.textContent.trim();
    if (!responseText || responseText === 'A slot wasted. They noticed.') return;
    const fullNote = _lastQuestion
      ? `Q: ${_lastQuestion}\n\n${responseText}`
      : responseText;
    saveNoteForChar(charId, fullNote);
    // Capture the timeline node armed by surfaceNode — promotes into node_inventory + captured_nodes.
    if (btn.dataset.timelineNode && typeof window.captureNode === 'function') {
      window.captureNode(btn.dataset.timelineNode);
    }
    btn.dataset.saved = 'true';
    btn.classList.add('saved');
    setTimeout(() => btn.classList.remove('saved'), 1200);
  };

  resp.style.position = 'relative';
  resp.appendChild(btn);
}

// ── SAVE FLASH ─────────────────────────────────────────────
function _showSaveFlash() {
  const icon = document.getElementById('np-hud-icon');
  if (!icon) return;
  icon.classList.add('pulse');
  setTimeout(() => icon.classList.remove('pulse'), 800);
}

// ── SWIPE ──────────────────────────────────────────────────
function _initSwipe() {
  const panel = document.getElementById('notepad-panel');
  if (!panel) return;
  panel.addEventListener('touchstart', e => {
    _swipeStartX = e.touches[0].clientX;
  }, { passive: true });
  panel.addEventListener('touchend', e => {
    if (_swipeStartX === null) return;
    const dx = e.changedTouches[0].clientX - _swipeStartX;
    _swipeStartX = null;
    if (Math.abs(dx) < 50) return;
    padNavigate(dx < 0 ? 1 : -1);
  }, { passive: true });
}

// ── HUD ICON ───────────────────────────────────────────────
function _injectHudIcon() {
  const _doInject = () => {
    if (document.getElementById('np-hud-icon')) return;

    // Try multiple anchor points — deception-slot, stage-icon, hamburger
    let anchor = document.getElementById('deception-slot')
               || document.getElementById('btn-stage')
               || document.getElementById('btn-hamburger')
               || document.querySelector('.hud-right')
               || document.querySelector('#hud');
    if (!anchor) return;

    const btn     = document.createElement('div');
    btn.id        = 'np-hud-icon';
    btn.className = 'np-hud-icon';
    btn.title     = "Investigator's Record";
    btn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:32px;height:32px;color:#b8a98a;cursor:pointer;opacity:0.7;flex-shrink:0;margin-left:4px;';
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2.5" y="1.5" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/>
      <path d="M5 5H10" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M5 7.5H10" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M5 10H8" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M4.5 1.5L4.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M7.5 1.5L7.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M10.5 1.5L10.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
    btn.onclick = openNotepad;

    // Insert after anchor
    anchor.insertAdjacentElement('afterend', btn);

    // Gate: hide until antechamber unlocked
    btn.setAttribute('data-hud-gate', '');
    if (!window.gameState || !window.gameState.antechamberGateOpen) {
      btn.style.display = 'none';
    }
  };

  // Try immediately, then on room entry, then poll
  _doInject();
  if (window.NocturneEngine) NocturneEngine.on('roomEntered', _doInject);
  setTimeout(_doInject, 500);
  setTimeout(_doInject, 1500);
  setTimeout(_doInject, 3000);
}

function _injectCSS() {
  if (document.getElementById('np-styles')) return;
  const s = document.createElement('style');
  s.id = 'np-styles';
  s.textContent = `
    .np-hud-icon{display:flex;align-items:center;justify-content:center;width:32px;height:32px;color:var(--cream-dim,#b8a98a);cursor:pointer;opacity:0.7;transition:opacity 200ms,color 200ms;flex-shrink:0;}
    .np-hud-icon:hover,.np-hud-icon:active{opacity:1;color:var(--gold,#c9a84c);}
    .np-hud-icon.pulse{animation:np-hud-pulse 600ms ease-out;}
    @keyframes np-hud-pulse{0%{color:var(--gold,#c9a84c);transform:scale(1.3);opacity:1}60%{color:var(--cream-dim,#b8a98a);transform:scale(1)}100%{opacity:0.7}}

    .np-pencil-btn{position:absolute;bottom:8px;right:8px;background:rgba(20,16,10,0.75);border:1px solid rgba(180,155,90,0.3);border-radius:4px;color:var(--gold,#c9a84c);opacity:0.85;cursor:pointer;padding:5px 7px;line-height:1;transition:opacity 200ms,transform 150ms;z-index:10;}
    .np-pencil-btn:hover,.np-pencil-btn:active{opacity:1;transform:scale(1.1);}
    .np-pencil-btn.saved{animation:np-pencil-saved 1000ms ease-out forwards;}
    @keyframes np-pencil-saved{0%{transform:scale(1.4) rotate(-8deg);opacity:1}50%{transform:scale(1.1) rotate(0deg)}100%{transform:scale(1);opacity:0.85}}

    #notepad-panel{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;opacity:0;transition:opacity 300ms ease;}
    #notepad-panel.visible{opacity:1;}
    #np-backdrop{position:absolute;inset:0;background:rgba(4,3,2,0.88);backdrop-filter:blur(3px);}

    #np-book{position:relative;z-index:1;width:min(420px,96vw);max-height:88vh;display:flex;flex-direction:column;background:#0f0d09;border:1px solid rgba(180,155,90,0.22);border-left:none;box-shadow:4px 0 24px rgba(0,0,0,0.7),inset 0 0 60px rgba(0,0,0,0.4);transform:translateY(24px);transition:transform 300ms cubic-bezier(.22,.8,.4,1);overflow:hidden;}
    #notepad-panel.visible #np-book{transform:translateY(0);}

    #np-spine{position:absolute;left:0;top:0;bottom:0;width:14px;background:linear-gradient(to right,rgba(100,75,30,0.55) 0%,rgba(60,45,15,0.3) 60%,transparent 100%);border-right:1px solid rgba(180,155,90,0.1);pointer-events:none;}
    #np-spine::before{content:'';position:absolute;left:3px;top:12%;bottom:12%;width:3px;background:repeating-linear-gradient(to bottom,rgba(180,155,90,0.18) 0px,rgba(180,155,90,0.18) 2px,transparent 2px,transparent 14px);border-radius:1px;}

    #np-header{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px 26px;}
    #np-header-title{font-size:9px;letter-spacing:0.32em;color:var(--gold,#c9a84c);text-transform:uppercase;opacity:0.9;}
    #np-close-btn{background:rgba(30,24,14,0.9);border:1px solid rgba(180,155,90,0.4);border-radius:4px;color:var(--gold,#c9a84c);font-size:20px;cursor:pointer;padding:2px 12px 4px;line-height:1;transition:opacity 150ms;}
    #np-close-btn:hover{opacity:1;background:rgba(50,38,18,0.9);}

    .np-rule{height:1px;background:linear-gradient(to right,transparent 0%,rgba(180,155,90,0.25) 15%,rgba(180,155,90,0.25) 85%,transparent 100%);margin:0 20px 0 26px;}
    .np-rule-thin{opacity:0.5;}

    #np-suspect-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px 26px;gap:8px;}
    .np-nav-btn{background:transparent;border:none;color:var(--cream-dim,#b8a98a);cursor:pointer;padding:6px;opacity:0.6;transition:opacity 150ms,transform 100ms;flex-shrink:0;}
    .np-nav-btn:hover{opacity:1;transform:scale(1.1);}
    #np-suspect-name-wrap{flex:1;text-align:center;}
    #np-suspect-label{font-size:8px;letter-spacing:0.3em;color:var(--gold-dim,#9a7c3a);text-transform:uppercase;margin-bottom:4px;}
    #np-suspect-name{font-size:15px;letter-spacing:0.2em;color:var(--cream,#e8dcc8);text-transform:uppercase;}
    #np-page-counter{text-align:center;font-size:9px;letter-spacing:0.15em;color:var(--gold-dim,#9a7c3a);padding-bottom:10px;opacity:0.7;}

    #np-notes-body{flex:1;overflow-y:auto;padding:6px 20px 16px 26px;scroll-behavior:smooth;background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent 27px,rgba(180,155,90,0.055) 27px,rgba(180,155,90,0.055) 28px);background-attachment:local;}
    #np-notes-body::-webkit-scrollbar{width:3px;}
    #np-notes-body::-webkit-scrollbar-thumb{background:rgba(180,155,90,0.2);border-radius:2px;}

    .np-note-entry{position:relative;padding:12px 28px 12px 0;border-bottom:1px solid rgba(180,155,90,0.07);animation:np-entry-in 280ms ease both;transition:opacity 200ms;}
    .np-note-entry:last-child{border-bottom:none;}
    @keyframes np-entry-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .np-note-question{font-size:9px;letter-spacing:0.15em;color:var(--gold-dim,#9a7c3a);text-transform:uppercase;margin-bottom:5px;opacity:0.8;}
    .np-note-text{font-size:12.5px;line-height:1.75;color:var(--cream-dim,#b8a98a);letter-spacing:0.02em;}
    .np-note-meta{font-size:9px;letter-spacing:0.12em;color:var(--gold-dim,#9a7c3a);opacity:0.6;margin-top:5px;font-style:italic;}
    .np-note-delete{position:absolute;top:12px;right:0;background:transparent;border:none;color:var(--cream-dim,#b8a98a);font-size:14px;cursor:pointer;opacity:0;transition:opacity 150ms;line-height:1;padding:2px 4px;}
    .np-note-entry:hover .np-note-delete{opacity:0.4;}
    .np-note-delete:hover{opacity:0.9!important;color:rgba(200,80,60,0.9);}

    #np-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 32px;gap:14px;color:var(--cream-dim,#b8a98a);opacity:0.4;text-align:center;}
    #np-empty-title{font-size:13px;letter-spacing:0.15em;text-transform:uppercase;}
    #np-empty-sub{font-size:11px;letter-spacing:0.04em;line-height:1.7;font-style:italic;opacity:0.8;}

    #np-footer{display:flex;align-items:center;gap:12px;padding:10px 20px 14px 26px;flex-shrink:0;}
    .np-footer-line{flex:1;height:1px;background:rgba(180,155,90,0.12);}
    #np-footer-text{font-size:7.5px;letter-spacing:0.28em;color:var(--gold-dim,#9a7c3a);opacity:0.45;text-transform:uppercase;white-space:nowrap;}
  `;  document.head.appendChild(s);
}

// ── PATCH askQuestion — ONCE ONLY ──────────────────────────
function _patchAskQuestion() {
  if (_askQuestionPatched) return;
  _askQuestionPatched = true;

  const _prev = window.askQuestion;
  if (!_prev) return;

  window.askQuestion = function(charId, qId) {
    // Store question text before calling original
    const char = window.CHARACTERS && window.CHARACTERS[charId];
    const q    = char && char.dialogue && char.dialogue[qId];
    _lastQuestion = q ? (q.question || '') : '';

    _prev(charId, qId);

    const text      = q ? (q.response || '') : '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const msPerWord = charId === 'surgeon' ? 80 : 60;
    // Inject at 60% through the render — response is readable, not fully done
    const delay = Math.min(wordCount * msPerWord * 0.6, 2000);
    setTimeout(injectPencilIcon, Math.max(delay, 400));
  };

  // Patch renderQuestions to re-inject pencil after question list rebuilds
  const _prevRender = window.renderQuestions;
  if (_prevRender) {
    window.renderQuestions = function(charId) {
      _prevRender(charId);
      const resp = document.getElementById('char-response');
      if (resp && resp.textContent.trim()) {
        setTimeout(injectPencilIcon, 100);
      }
    };
  }

  if (window.NocturneEngine) {
    NocturneEngine.on('deceptionResponse', ({ text }) => {
      if (!text) return;
      _lastQuestion = '';
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      setTimeout(injectPencilIcon, Math.min(800 + wordCount * 825 + 300, 8000));
    });

    // ── RETURN ECHO SYSTEM ──────────────────────────────────
    // When player re-enters a character's room, check if any
    // timeline_critical questions were answered but not saved to notepad.
    // If so, the question reinserts itself randomly into the available list.
    // This is handled by interrogation.js computeAvailableQuestions reading
    // gameState._missedTimelines[charId] — we set that flag here.
    NocturneEngine.on('roomEntered', ({ roomId }) => {
      _checkMissedTimelines(roomId);
    });
  }
}

// ── MISSED TIMELINE DETECTION ──────────────────────────────
function _checkMissedTimelines(roomId) {
  if (!window.CHARACTERS || !window.gameState) return;
  // Find which character is in this room
  const charId = Object.keys(window.CHARACTERS).find(id => {
    const c = window.CHARACTERS[id];
    return c.room === roomId || c.room_second === roomId;
  });
  if (!charId) return;

  const char     = window.CHARACTERS[charId];
  const answered = (window.gameState.char_dialogue_complete || {})[charId] || {};
  const notes    = _getCharNotes(charId);
  const notedTexts = new Set(notes.map(n => n.text));

  // Find all timeline_critical questions that were answered
  // but whose response text is not in the notepad
  const missed = [];
  if (!window.INTERROGATION_DATA || !window.INTERROGATION_DATA[charId]) return;
  const iData = window.INTERROGATION_DATA[charId];
  const variants = iData.composure_variants || {};

  // Check spine questions
  Object.entries(char.dialogue || {}).forEach(([qId, q]) => {
    if (!q.timeline_critical) return;
    if (!answered[qId]) return; // not answered yet
    // Check if saved — look for question text in notes
    const alreadySaved = notes.some(n => n.text.includes(q.question || ''));
    if (!alreadySaved) {
      missed.push(qId);
    }
  });

  // Check branch questions
  Object.entries(iData.backstory_chain || {}).forEach(([branchId, branch]) => {
    Object.entries(branch.questions || {}).forEach(([qId, q]) => {
      if (!q.timeline_critical) return;
      const branchKey = `branch_${branchId}_${qId}`;
      if (!answered[branchKey]) return;
      const alreadySaved = notes.some(n => n.text.includes(q.text || ''));
      if (!alreadySaved) {
        missed.push(branchKey);
      }
    });
  });

  if (missed.length > 0) {
    if (!window.gameState._missedTimelines) window.gameState._missedTimelines = {};
    window.gameState._missedTimelines[charId] = missed;
  }
}

// ── BUILD PANEL ────────────────────────────────────────────
function _buildNotepadPanel() {
  if (document.getElementById('notepad-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'notepad-panel';
  panel.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;';

  panel.innerHTML = `
    <div id="np-backdrop" onclick="closeNotepad()" style="position:absolute;inset:0;background:rgba(4,3,2,0.88);backdrop-filter:blur(3px);"></div>
    <div id="np-book">
      <div id="np-spine"></div>
      <div id="np-header">
        <div id="np-header-title">INVESTIGATOR'S RECORD</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="np-board-btn" onclick="closeNotepad();openBoard();" style="background:rgba(30,24,14,0.8);border:1px solid rgba(180,155,90,0.3);border-radius:4px;color:#c9a84c;font-size:9px;letter-spacing:0.2em;cursor:pointer;padding:5px 10px;text-transform:uppercase;opacity:0.8;">Board</button>
          <button id="np-close-btn" onclick="closeNotepad()">×</button>
        </div>
      </div>
      <div class="np-rule"></div>
      <div id="np-suspect-bar">
        <button id="np-prev" class="np-nav-btn" onclick="padNavigate(-1)">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M8 2L2 7L8 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div id="np-suspect-name-wrap">
          <div id="np-suspect-label">SUBJECT</div>
          <div id="np-suspect-name">—</div>
        </div>
        <button id="np-next" class="np-nav-btn" onclick="padNavigate(1)">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M2 2L8 7L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div id="np-page-counter"></div>
      <div class="np-rule np-rule-thin"></div>
      <div id="np-notes-body"></div>
      <div id="np-empty-state">
        <svg width="32" height="38" viewBox="0 0 32 38" fill="none">
          <rect x="3" y="2" width="26" height="34" rx="2" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.3"/>
          <path d="M9 12H23" stroke="currentColor" stroke-width="0.8" opacity="0.3"/>
          <path d="M9 17H23" stroke="currentColor" stroke-width="0.8" opacity="0.3"/>
          <path d="M9 22H18" stroke="currentColor" stroke-width="0.8" opacity="0.3"/>
          <path d="M11 2L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          <path d="M16 2L16 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
          <path d="M21 2L21 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
        </svg>
        <div id="np-empty-title">No notes recorded.</div>
        <div id="np-empty-sub">During an interrogation, tap the pencil<br>to save what matters.</div>
      </div>
      <div id="np-footer">
        <div class="np-footer-line"></div>
        <div id="np-footer-text">NOCTURNE — THE ESTATE</div>
        <div class="np-footer-line"></div>
      </div>
    </div>
  `;

  const appEl = document.getElementById('app') || document.body;
  appEl.appendChild(panel);
}

// ── INIT — ONCE ONLY ───────────────────────────────────────
function initNotepad() {
  if (_notepadInitialized) {
    // Already initialized but check if icon got wiped — re-inject if missing
    if (!document.getElementById('np-hud-icon')) _injectHudIcon();
    return;
  }
  _notepadInitialized = true;
  _injectCSS();
  _injectHudIcon();
  _buildNotepadPanel();
  _initSwipe();
  _patchAskQuestion();
}

// ── EXPOSE ─────────────────────────────────────────────────
window.initNotepad      = initNotepad;
window.openNotepad      = openNotepad;
window.closeNotepad     = closeNotepad;
window.padNavigate      = padNavigate;
window.saveNoteForChar  = saveNoteForChar;
window.deleteNote       = deleteNote;
window.injectPencilIcon = injectPencilIcon;

// ── AUTO-INIT ──────────────────────────────────────────────
// Fire as soon as DOM is ready — no manual call needed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotepad);
} else {
  initNotepad();
}

// ── BOARD ICON GATE ────────────────────────────────────────
// board-hud-icon is injected by board.js after DOM ready.
// Poll briefly to catch it and hide if gate not yet open.
(function _gateBoardIcon() {
  function _check() {
    const icon = document.getElementById('board-hud-icon');
    if (!icon) return;
    icon.setAttribute('data-hud-gate', '');
    // Fix vertical alignment to match other HUD icons
    icon.style.verticalAlign = 'middle';
    icon.style.display = (!window.gameState || !window.gameState.antechamberGateOpen) ? 'none' : (icon.style.display || '');
  }
  _check();
  setTimeout(_check, 500);
  setTimeout(_check, 1500);
  setTimeout(_check, 3000);
  if (window.NocturneEngine) NocturneEngine.on('roomEntered', _check);
})();
