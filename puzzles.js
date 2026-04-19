// ── PUZZLES.JS ─────────────────────────────────────────────
// All 9 puzzle UIs for Nocturne: Midnight Estate
// Injected into #puzzle-body by openPuzzlePanel()
// Called from ui.js after discovery overlay completes

'use strict';

// ── FORENSIC MECHANICS ────────────────────────────────────────────────────────
// Victorian-era forensic gestures. Swipe to dust. Hold to reveal. Tilt to light.
// All use standard pointer/touch events — no libraries needed.

function createDustLayer(parent, onRevealed) {
  // Canvas-based dust layer. Swiping finger removes dust particles to reveal evidence.
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;cursor:crosshair;touch-action:none;';
  parent.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let revealed = false;
  let sweepPct = 0;

  function resize() {
    canvas.width = canvas.offsetWidth || parent.offsetWidth;
    canvas.height = canvas.offsetHeight || parent.offsetHeight;
    drawDust();
  }

  function drawDust() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Aged dust — warm grey with noise
    ctx.fillStyle = 'rgba(40,32,18,0.88)';
    ctx.fillRect(0, 0, w, h);
    // Dust particle noise
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${120 + Math.random()*60},${100 + Math.random()*40},${60 + Math.random()*30},${Math.random() * 0.6})`;
      ctx.fill();
    }
    // Hint text
    ctx.fillStyle = 'rgba(180,150,80,0.5)';
    ctx.font = '10px var(--font-ui, sans-serif)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.3em';
    ctx.fillText('SWIPE TO REVEAL', w / 2, h / 2);
  }

  function sweep(x, y, radius) {
    ctx.globalCompositeOperation = 'destination-out';
    // Soft brush
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.7)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Check how much is revealed
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++;
    }
    sweepPct = transparent / (canvas.width * canvas.height);
    if (sweepPct > 0.45 && !revealed) {
      revealed = true;
      // Fade out remaining dust
      canvas.style.transition = 'opacity 600ms ease';
      canvas.style.opacity = '0';
      setTimeout(() => { canvas.remove(); if (onRevealed) onRevealed(); }, 620);
    }
  }

  let active = false;
  canvas.addEventListener('pointerdown', e => {
    active = true;
    canvas.setPointerCapture(e.pointerId);
    const r = canvas.getBoundingClientRect();
    sweep(e.clientX - r.left, e.clientY - r.top, 32);
    if (typeof haptic === 'function') haptic([8]);
  });
  canvas.addEventListener('pointermove', e => {
    if (!active) return;
    const r = canvas.getBoundingClientRect();
    sweep(e.clientX - r.left, e.clientY - r.top, 28);
  });
  canvas.addEventListener('pointerup', () => { active = false; });

  setTimeout(resize, 50);
  window.addEventListener('resize', resize);
  return canvas;
}

function createFingerprintReveal(parent, onRevealed) {
  // Hold finger for 1.5s to develop fingerprint — like iodine fuming
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;z-index:5;cursor:pointer;touch-action:none;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;';

  // Aged paper texture
  overlay.style.background = 'rgba(30,22,10,0.85)';

  const hint = document.createElement('div');
  hint.style.cssText = 'font-family:var(--font-ui,sans-serif);font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(180,150,80,0.5);text-align:center;';
  hint.textContent = 'PRESS & HOLD TO DEVELOP';
  overlay.appendChild(hint);

  // Progress ring
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('width', '60');
  ring.setAttribute('height', '60');
  ring.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-60px);';
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '30');
  circle.setAttribute('cy', '30');
  circle.setAttribute('r', '24');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'rgba(180,150,80,0.2)');
  circle.setAttribute('stroke-width', '2');
  const progress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  progress.setAttribute('cx', '30');
  progress.setAttribute('cy', '30');
  progress.setAttribute('r', '24');
  progress.setAttribute('fill', 'none');
  progress.setAttribute('stroke', 'rgba(180,150,80,0.8)');
  progress.setAttribute('stroke-width', '2');
  progress.setAttribute('stroke-dasharray', '150.8');
  progress.setAttribute('stroke-dashoffset', '150.8');
  progress.setAttribute('stroke-linecap', 'round');
  progress.setAttribute('transform', 'rotate(-90 30 30)');
  ring.appendChild(circle);
  ring.appendChild(progress);
  overlay.appendChild(ring);
  parent.appendChild(overlay);

  let holdTimer = null;
  let holdStart = null;
  let rafId = null;

  function startHold() {
    holdStart = Date.now();
    if (typeof haptic === 'function') haptic([10]);
    rafId = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - holdStart;
      const pct = Math.min(elapsed / 1500, 1);
      const offset = 150.8 * (1 - pct);
      progress.setAttribute('stroke-dashoffset', offset);
      // Color shifts as it develops — from dim to gold
      progress.setAttribute('stroke', `rgba(${180 + pct * 21},${150 + pct * 18},${80 + pct * 12},${0.5 + pct * 0.5})`);
      if (pct < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Developed
        if (typeof haptic === 'function') haptic([20, 10, 20]);
        overlay.style.transition = 'opacity 700ms ease';
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.remove(); if (onRevealed) onRevealed(); }, 720);
      }
    });
  }

  function cancelHold() {
    if (rafId) cancelAnimationFrame(rafId);
    holdStart = null;
    progress.setAttribute('stroke-dashoffset', '150.8');
    progress.setAttribute('stroke', 'rgba(180,150,80,0.8)');
  }

  overlay.addEventListener('pointerdown', startHold);
  overlay.addEventListener('pointerup', cancelHold);
  overlay.addEventListener('pointerleave', cancelHold);
  overlay.addEventListener('pointercancel', cancelHold);

  return overlay;
}

function createTiltLighting(element, onTiltCorrect) {
  // Device tilt reveals hidden watermark — using deviceorientation
  // Target: tilt phone ~30 degrees to one side
  let tiltHandled = false;
  const TARGET_GAMMA = 30; // degrees
  const TOLERANCE = 12;

  const hint = document.createElement('div');
  hint.style.cssText = 'position:absolute;bottom:90px;left:0;right:0;text-align:center;font-family:var(--font-ui,sans-serif);font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(180,150,80,0.4);z-index:6;pointer-events:none;';
  hint.textContent = 'TILT TO CATCH THE LIGHT';
  element.appendChild(hint);

  // Shimmer overlay — only visible when tilt is correct
  const shimmer = document.createElement('div');
  shimmer.style.cssText = 'position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;transition:opacity 300ms;background:linear-gradient(135deg,rgba(255,220,120,0.0) 0%,rgba(255,220,120,0.15) 50%,rgba(255,220,120,0.0) 100%);';
  element.appendChild(shimmer);

  function handleOrientation(e) {
    if (tiltHandled) return;
    const gamma = e.gamma || 0; // left/right tilt
    const diff = Math.abs(Math.abs(gamma) - TARGET_GAMMA);
    const strength = Math.max(0, 1 - diff / 30);
    shimmer.style.opacity = strength * 0.8;

    if (diff < TOLERANCE) {
      tiltHandled = true;
      shimmer.style.opacity = '1';
      hint.style.opacity = '0';
      if (typeof haptic === 'function') haptic([15, 8, 15]);
      setTimeout(() => {
        shimmer.style.transition = 'opacity 600ms';
        shimmer.style.opacity = '0';
        if (onTiltCorrect) onTiltCorrect();
      }, 800);
    }
  }

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleOrientation);
    // Cleanup after 30s
    setTimeout(() => window.removeEventListener('deviceorientation', handleOrientation), 30000);
  } else {
    // Desktop fallback — mousemove simulates tilt
    hint.textContent = 'MOVE MOUSE TO CATCH THE LIGHT';
    element.addEventListener('mousemove', (e) => {
      if (tiltHandled) return;
      const rect = element.getBoundingClientRect();
      const gamma = ((e.clientX - rect.left) / rect.width) * 60 - 30;
      const diff = Math.abs(Math.abs(gamma) - TARGET_GAMMA);
      const strength = Math.max(0, 1 - diff / 30);
      shimmer.style.opacity = strength * 0.8;
      if (diff < TOLERANCE) {
        tiltHandled = true;
        shimmer.style.opacity = '1';
        hint.style.opacity = '0';
        setTimeout(() => {
          shimmer.style.opacity = '0';
          if (onTiltCorrect) onTiltCorrect();
        }, 800);
      }
    });
  }
}

function createWaxSealBreak(parent, onBroken) {
  // Swipe gesture breaks a wax seal before content is revealed
  const sealEl = document.createElement('div');
  sealEl.style.cssText = 'position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:rgba(20,14,6,0.82);';

  const sealCircle = document.createElement('div');
  sealCircle.style.cssText = 'width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(120,20,20,0.9),rgba(80,10,10,0.95));border:2px solid rgba(180,80,80,0.4);display:flex;align-items:center;justify-content:center;font-size:28px;transition:transform 300ms;';
  sealCircle.textContent = '✦';

  const hint = document.createElement('div');
  hint.style.cssText = 'font-family:var(--font-ui,sans-serif);font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(180,80,80,0.5);';
  hint.textContent = 'SWIPE TO BREAK SEAL';

  sealEl.appendChild(sealCircle);
  sealEl.appendChild(hint);
  parent.appendChild(sealEl);

  let startX = null;

  sealEl.addEventListener('pointerdown', e => {
    startX = e.clientX;
    sealEl.setPointerCapture(e.pointerId);
  });
  sealEl.addEventListener('pointermove', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    sealCircle.style.transform = `rotate(${dx * 2}deg) scale(${1 + Math.abs(dx) * 0.002})`;
    if (Math.abs(dx) > 60) {
      startX = null;
      sealCircle.style.transform = 'rotate(180deg) scale(1.3)';
      sealCircle.style.background = 'radial-gradient(circle,rgba(60,10,10,0.4),rgba(30,5,5,0.2))';
      if (typeof haptic === 'function') haptic([30, 10, 20]);
      sealEl.style.transition = 'opacity 500ms';
      sealEl.style.opacity = '0';
      setTimeout(() => { sealEl.remove(); if (onBroken) onBroken(); }, 520);
    }
  });
  sealEl.addEventListener('pointerup', () => {
    if (startX !== null) {
      startX = null;
      sealCircle.style.transform = 'rotate(0deg) scale(1)';
    }
  });
}

function createRubReveal(element, onRevealed) {
  // Brass-rubbing gesture — rub back and forth to reveal impression
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;cursor:crosshair;touch-action:none;';
  element.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let revealed = false;

  function resize() {
    canvas.width = canvas.offsetWidth || element.offsetWidth;
    canvas.height = canvas.offsetHeight || element.offsetHeight;
    // Dark overlay with impression hint
    ctx.fillStyle = 'rgba(25,18,8,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(180,150,80,0.3)';
    ctx.font = '9px var(--font-ui, sans-serif)';
    ctx.textAlign = 'center';
    ctx.fillText('RUB TO REVEAL IMPRESSION', canvas.width / 2, canvas.height / 2);
  }

  function rub(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 22);
    grad.addColorStop(0, 'rgba(0,0,0,0.9)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++;
    }
    const pct = transparent / (canvas.width * canvas.height);
    if (pct > 0.5 && !revealed) {
      revealed = true;
      canvas.style.transition = 'opacity 600ms';
      canvas.style.opacity = '0';
      setTimeout(() => { canvas.remove(); if (onRevealed) onRevealed(); }, 620);
    }
  }

  let active = false;
  canvas.addEventListener('pointerdown', e => {
    active = true;
    canvas.setPointerCapture(e.pointerId);
    const r = canvas.getBoundingClientRect();
    rub(e.clientX - r.left, e.clientY - r.top);
    if (typeof haptic === 'function') haptic([5]);
  });
  canvas.addEventListener('pointermove', e => {
    if (!active) return;
    const r = canvas.getBoundingClientRect();
    rub(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('pointerup', () => { active = false; });

  setTimeout(resize, 50);
  return canvas;
}

// ── PUZZLE SPECS ───────────────────────────────────────────
window.PUZZLE_SPECS = {
  'balcony-reconstruction': {
    title: 'THE RECONSTRUCTION',
    instruction: 'Arrange the four observations into the correct sequence.',
  },
  'seal-match': {
    title: 'THE MASK',
    instruction: 'Compare the two masks to identify the exterior one.',
  },
  'bond-reconstruction': {
    title: 'THE BOND',
    instruction: 'Arrange the torn sections into the correct order.',
  },
  'motive-reconstruction': {
    title: 'THE THIRTY YEARS',
    instruction: 'Order the events from earliest to latest.',
  },
  'chronology': {
    title: 'THE CHRONOLOGY',
    instruction: 'Order the events from earliest to latest.',
  },
  'bilateral-seal': {
    title: 'THE BILATERAL SEAL',
    instruction: 'Align the two seals until the marks resolve into one.',
  },
  'ink-comparison': {
    title: 'THE INK',
    instruction: 'Identify the section written in a different hand.',
  },
  'correspondence-thread': {
    title: 'THE CORRESPONDENCE',
    instruction: 'Arrange the letters into the correct sequence.',
  },
  'witness-map': {
    title: 'THE HISTORY',
    instruction: 'Match each cause to its effect.',
  },
  'ink-reveal': {
    title: 'THE ANNOTATION',
    instruction: 'Tilt the document to reveal what is written beneath.',
  },
};

// ── HELPERS ────────────────────────────────────────────────
function puzzleAsset(name) {
  return (window.ASSET_BASE || './assets/') + 'puzzles/' + name;
}

function puzzleEl(tag, styles, attrs = {}) {
  const el = document.createElement(tag);
  if (styles) el.style.cssText = styles;
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  });
  return el;
}

function puzzleBtn(text, onClick, extra = '') {
  const btn = puzzleEl('button', `
    padding: 12px 28px;
    background: transparent;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: var(--font-ui);
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 300ms;
    ${extra}
  `);
  btn.textContent = text;
  btn.onclick = onClick;
  return btn;
}

// ── REWARD CINEMATIC ───────────────────────────────────────
// Per-puzzle cinematic lines — what the player reads as the item emerges
const PUZZLE_REWARD_LINES = {
  'balcony-reconstruction': 'Four moments assembled in sequence.\nThe mask fell during the push.\nThe body was projected, not dropped.',
  'seal-match':             'Two masks. One estate-issued.\nOne brought from outside.\nThe plain mask was prepared before the evening began.',
  'bond-reconstruction':    'The Bond is reconstructed.\nThe second hand was added six years after signing.\nThe incident is Article I.\nClara is not named in it.',
  'motive-reconstruction':  'Thirty years assembled in order.\nA board. A signature. A career ended.\nThe man who built a new identity\nand spent four years waiting for tonight.',
  'chronology':             'Forty years assembled in order.\nThe sequence that one man decided\nno longer needed acknowledging.',
  'bilateral-seal':         'Two seals. One mark.\nBuilt into the architecture\nbefore either organisation knew it would matter.',
  'ink-comparison':         'A different hand.\nA different instruction.\nAdded to a document that was already signed.',
  'correspondence-thread':  'Forty years of letters.\nOne that was never sent.\nThe final argument. Written the night before.',
  'witness-map':            'Four causes.\nFour effects.\nThe history of two organisations\nseparated by a single manufactured act.',
  'ink-reveal':             'A third hand.\nIn the margin of a document\nthat was never supposed to be read twice.',
};

function fireRewardCinematic(puzzleType, chain) {
  const resultItemId = chain && chain.result_item;
  const hasItem = !!(resultItemId && window.ITEMS && window.ITEMS[resultItemId]);
  const line = PUZZLE_REWARD_LINES[puzzleType] || 'The puzzle is resolved.';

  // Full-screen cinematic overlay
  const cin = document.createElement('div');
  cin.style.cssText = [
    'position:fixed','inset:0','z-index:200',
    'background:#060504',
    'display:flex','flex-direction:column',
    'align-items:center','justify-content:center',
    'padding:48px 32px',
    'opacity:0','transition:opacity 500ms ease',
  ].join(';');

  // Item image — only if result item exists
  if (hasItem) {
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = [
      'width:120px','height:120px',
      'margin-bottom:32px',
      'opacity:0','transform:translateY(20px)',
      'transition:opacity 800ms ease, transform 800ms ease',
    ].join(';');
    const imgSrc = (window.ASSET_BASE || './assets/') +
      'items/nocturne-item-' + resultItemId + '.png';
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    img.onerror = () => { imgWrap.style.display = 'none'; };
    imgWrap.appendChild(img);
    cin.appendChild(imgWrap);
    cin._imgWrap = imgWrap;
  }

  // Cinematic text
  const txt = document.createElement('div');
  txt.style.cssText = [
    'font-family:Georgia,serif',
    'font-size:14px','line-height:2',
    'color:#8A7F6A',
    'text-align:center','max-width:300px',
    'white-space:pre-line',
    'opacity:0','transition:opacity 700ms ease',
    'margin-bottom:40px',
  ].join(';');
  txt.textContent = line;
  cin.appendChild(txt);
  cin._txt = txt;

  document.body.appendChild(cin);

  // Animate in
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cin.style.opacity = '1';
    setTimeout(() => {
      txt.style.opacity = '1';
      if (cin._imgWrap) {
        cin._imgWrap.style.opacity = '1';
        cin._imgWrap.style.transform = 'translateY(0)';
      }
    }, 400);
  }));

  if (typeof window.haptic === 'function') window.haptic([30, 20, 30, 20, 80]);

  // After 2.8s — transition to item panel or just close
  setTimeout(() => {
    cin.style.opacity = '0';
    setTimeout(() => {
      cin.remove();
      if (hasItem) {
        _openPuzzleRewardPanel(resultItemId, puzzleType, chain);
      } else {
        // No item — just close puzzle panel
        window.puzzleSolved && window.puzzleSolved(puzzleType, chain && chain.result_item || null);
        window.closePuzzle && window.closePuzzle();
      }
    }, 500);
  }, 2800);
}

function _openPuzzleRewardPanel(itemId, puzzleType, chain) {
  const item = window.ITEMS && window.ITEMS[itemId];
  const itemName = item ? item.name : itemId;
  const examineText = item ? (item.examine_1 || item.name) : itemId;
  const imgSrc = (window.ASSET_BASE || './assets/') + 'items/nocturne-item-' + itemId + '.png';

  // Slide-up reward panel
  const panel = document.createElement('div');
  panel.id = 'puzzle-reward-panel';
  panel.style.cssText = [
    'position:fixed','inset:0','z-index:190',
    'background:rgba(6,5,4,0.96)',
    'display:flex','flex-direction:column',
    'align-items:center','justify-content:flex-end',
    'padding-bottom:48px',
    'transform:translateY(100%)','transition:transform 500ms ease',
  ].join(';');

  // Item card
  const card = document.createElement('div');
  card.style.cssText = [
    'width:100%','max-width:340px',
    'padding:32px 28px 24px',
    'display:flex','flex-direction:column',
    'align-items:center','gap:16px',
  ].join(';');

  // Item image
  const imgWrap = document.createElement('div');
  imgWrap.style.cssText = 'width:100px;height:100px;margin-bottom:8px;';
  const img = document.createElement('img');
  img.src = imgSrc;
  img.style.cssText = 'width:100%;height:100%;object-fit:contain;opacity:0.9;';
  img.onerror = () => { imgWrap.style.display = 'none'; };
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);

  // Item name
  const name = document.createElement('div');
  name.style.cssText = [
    'font-family:var(--font-ui,Arial,sans-serif)',
    'font-size:10px','letter-spacing:0.35em',
    'text-transform:uppercase','color:#B8960C',
    'text-align:center',
  ].join(';');
  name.textContent = itemName;
  card.appendChild(name);

  // Divider
  const div = document.createElement('div');
  div.style.cssText = 'width:60px;height:1px;background:#2A2520;margin:4px 0;';
  card.appendChild(div);

  // Examine text
  const examTxt = document.createElement('div');
  examTxt.style.cssText = [
    'font-family:Georgia,serif',
    'font-size:12px','line-height:1.8',
    'color:#8A7F6A','text-align:center',
    'max-width:280px',
  ].join(';');
  examTxt.textContent = examineText;
  card.appendChild(examTxt);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.style.cssText = [
    'display:flex','gap:16px',
    'margin-top:24px','width:100%',
    'justify-content:center',
  ].join(';');

  function closeAll() {
    panel.style.transform = 'translateY(100%)';
    setTimeout(() => {
      panel.remove();
      window.closePuzzle && window.closePuzzle();
    }, 500);
  }

  // KEEP button
  const keepBtn = document.createElement('button');
  keepBtn.style.cssText = [
    'flex:1','max-width:140px','padding:14px',
    'background:transparent',
    'border:1px solid #B8960C',
    'color:#B8960C',
    'font-family:var(--font-ui,Arial,sans-serif)',
    'font-size:9px','letter-spacing:0.3em',
    'text-transform:uppercase','cursor:pointer',
  ].join(';');
  keepBtn.textContent = 'KEEP';
  keepBtn.onclick = () => {
    window.puzzleSolved && window.puzzleSolved(puzzleType, itemId);
    closeAll();
  };

  // DROP button
  const dropBtn = document.createElement('button');
  dropBtn.style.cssText = [
    'flex:1','max-width:140px','padding:14px',
    'background:transparent',
    'border:1px solid #2A2520',
    'color:#6A6055',
    'font-family:var(--font-ui,Arial,sans-serif)',
    'font-size:9px','letter-spacing:0.3em',
    'text-transform:uppercase','cursor:pointer',
  ].join(';');
  dropBtn.textContent = 'DROP';
  dropBtn.onclick = () => {
    // Mark puzzle solved but drop item in room
    window.puzzleSolved && window.puzzleSolved(puzzleType, null);
    if (typeof window.dropItem === 'function') {
      // Item would have been produced by engine — drop it
      const currentRoom = window.gameState && window.gameState.currentRoom || 'foyer';
      if (window.gameState && !window.gameState.inventory.includes(itemId)) {
        // Engine hasn't produced it yet — produce then drop
        window.puzzleSolved && window.puzzleSolved(puzzleType, itemId);
      }
      window.dropItem && window.dropItem(itemId);
    }
    closeAll();
  };

  btnRow.appendChild(keepBtn);
  btnRow.appendChild(dropBtn);
  card.appendChild(btnRow);
  panel.appendChild(card);
  document.body.appendChild(panel);

  // Slide up
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.style.transform = 'translateY(0)';
  }));
}

function puzzleSuccess(message, _onComplete) {
  // onComplete is now ignored — reward cinematic handles the flow
  const body = document.getElementById('puzzle-body');
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:absolute','inset:0','z-index:20',
    'background:rgba(10,8,5,0.85)',
    'display:flex','flex-direction:column',
    'align-items:center','justify-content:center',
    'gap:20px',
    'opacity:0','transition:opacity 600ms ease',
  ].join(';');
  const msg = document.createElement('div');
  msg.style.cssText = [
    'font-size:12px','letter-spacing:0.25em',
    'text-transform:uppercase',
    'color:#B8960C',
    'font-family:var(--font-ui,Arial,sans-serif)',
    'text-align:center','max-width:280px',
    'line-height:2',
  ].join(';');
  msg.textContent = message;
  overlay.appendChild(msg);
  body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));
  if (typeof window.haptic === 'function') window.haptic([100, 40, 100, 40, 200]);
  // Auto-remove after 1.6s — cinematic fires from each puzzle's success callback
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 600);
  }, 1600);
}

function puzzleFail(message) {
  const body = document.getElementById('puzzle-body');
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:absolute','inset:0','z-index:20',
    'background:rgba(60,0,0,0.5)',
    'display:flex','align-items:center','justify-content:center',
    'opacity:0','transition:opacity 400ms ease',
    'pointer-events:none',
  ].join(';');
  const msg = document.createElement('div');
  msg.style.cssText = [
    'font-size:11px','letter-spacing:0.2em',
    'text-transform:uppercase','color:#cc4444',
    'font-family:var(--font-ui,Arial,sans-serif)',
  ].join(';');
  msg.textContent = message || 'Not correct.';
  overlay.appendChild(msg);
  body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 400);
  }, 1200);
}

// ── MAIN ENTRY POINT ───────────────────────────────────────
window.openPuzzlePanel = function(puzzleType, chain) {
  const panel = document.getElementById('puzzle-panel');
  const body  = document.getElementById('puzzle-body');
  const title = document.getElementById('puzzle-title');

  if (!panel || !body) return;

  // Set title
  const spec = window.PUZZLE_SPECS[puzzleType];
  if (title) title.textContent = spec ? spec.title : puzzleType.toUpperCase();

  // Clear previous content
  body.innerHTML = '';

  // Build puzzle
  const builders = {
    'balcony-reconstruction': buildBalconyReconstruction,
    'seal-match':             buildSealMatch,
    'bond-reconstruction':    buildBondReconstruction,
    'motive-reconstruction':  buildMotiveReconstruction,
    'chronology':             buildChronology,
    'bilateral-seal':         buildBilateralSeal,
    'ink-comparison':         buildInkComparison,
    'correspondence-thread':  buildCorrespondenceThread,
    'witness-map':            buildWitnessMap,
    'ink-reveal':             buildInkReveal,
  };

  const builder = builders[puzzleType];
  if (builder) {
    builder(body, chain);
  } else {
    body.innerHTML = `<div style="color:var(--cream-dim);padding:40px;text-align:center;font-family:var(--font-ui);font-size:12px;letter-spacing:0.2em;">${puzzleType.toUpperCase()}</div>`;
  }

  // Open panel
  panel.classList.add('open');
  window._activePuzzleId = puzzleType;
};

// ── 1. BALCONY RECONSTRUCTION ──────────────────────────────
// Four observations assembled in correct sequence
// Correct order: mask found → railing disturbed → Crane departs → Surgeon rejoins assembly
// Player drags cards into order. All four must be correct.
function buildBalconyReconstruction(body, chain) {
  // FORENSIC: Swipe dust away to reveal the balcony evidence before sequencing
  const dustContainer = puzzleEl('div', 'position:absolute;inset:0;');
  body.appendChild(dustContainer);
  createDustLayer(dustContainer, () => {
    // Dust cleared — now show the sequence puzzle
    _buildBalconySequence(body, chain);
  });
  return;
}
function _buildBalconySequence(body, chain) {
  const OBSERVATIONS = [
    { id: 1, text: 'The Surgeon stands at the railing with Lord Ashworth. The assembly has not yet entered the balcony.' },
    { id: 2, text: 'Lord Ashworth goes over the railing. The Surgeon\'s mask falls in the movement. He moves the body to the lectern.' },
    { id: 3, text: 'Dr. Crane reaches the balcony. She finds the mask. She finds the case. She understands what she is looking at. She runs.' },
    { id: 4, text: 'The Surgeon re-enters the Ballroom wearing a different mask. Northcott notes the entry. Lady Ashworth observes the mask.' },
  ];
  const CORRECT = [1, 2, 3, 4];

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-balcony.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.62);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Order the observations.' });
  body.appendChild(instr);

  // Shuffle
  const shuffled = [...OBSERVATIONS].sort(() => Math.random() - 0.5);

  const container = puzzleEl('div', `
    position: absolute;
    top: 110px; bottom: 80px; left: 16px; right: 16px;
    display: flex; flex-direction: column; gap: 8px;
    overflow-y: auto;
  `);
  body.appendChild(container);

  let dragSrc = null;

  shuffled.forEach(obs => {
    const row = puzzleEl('div', `
      padding: 12px 14px;
      background: rgba(16,12,6,0.92);
      border: 1px solid var(--gold-dim);
      border-left: 3px solid rgba(184,150,12,0.3);
      font-family: var(--font); font-size: 11px;
      color: var(--cream-dim); line-height: 1.65;
      cursor: grab; user-select: none;
      transition: border-color 300ms;
      display: flex; align-items: flex-start; gap: 12px;
    `);
    row.dataset.id = obs.id;
    row.setAttribute('draggable', 'true');

    const textEl = puzzleEl('div', 'flex:1;', { text: obs.text });
    const handle = puzzleEl('div', `
      color: var(--gold-dim); font-size: 16px;
      flex-shrink: 0; padding-top: 2px;
    `, { text: '⋮⋮' });

    row.appendChild(textEl);
    row.appendChild(handle);

    row.addEventListener('dragstart', () => { dragSrc = row; row.style.opacity = '0.4'; });
    row.addEventListener('dragend', () => { row.style.opacity = '1'; });
    row.addEventListener('dragover', e => { e.preventDefault(); row.style.borderColor = 'var(--gold)'; });
    row.addEventListener('dragleave', () => { row.style.borderColor = 'var(--gold-dim)'; });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.style.borderColor = 'var(--gold-dim)';
      if (dragSrc && dragSrc !== row) {
        const srcIdx = Array.from(container.children).indexOf(dragSrc);
        const tgtIdx = Array.from(container.children).indexOf(row);
        if (srcIdx < tgtIdx) container.insertBefore(dragSrc, row.nextSibling);
        else container.insertBefore(dragSrc, row);
      }
    });

    container.appendChild(row);
  });

  const submitWrap = puzzleEl('div', `
    position: absolute; bottom: 24px; left: 0; right: 0;
    display: flex; justify-content: center;
  `);
  const submit = puzzleBtn('Confirm Sequence', () => {
    const order = Array.from(container.children).map(el => parseInt(el.dataset.id));
    const correct = order.every((id, i) => id === CORRECT[i]);
    if (correct) {
      Array.from(container.children).forEach(row => {
        row.style.borderLeftColor = 'var(--gold)';
        row.style.background = 'rgba(184,150,12,0.08)';
      });
      puzzleSuccess('The sequence holds.\nThe push is confirmed.');
      setTimeout(() => fireRewardCinematic('balcony-reconstruction', chain), 2200);
    } else {
      // Show which cards are misplaced — wrong ones darken, correct ones stay
      const CONSEQUENCES = [
        'The body cannot reach the lectern before the mask is lost.',
        'The mask falls before the push is complete. The sequence breaks here.',
        'She arrives before the staging is done. Impossible.',
        'He re-enters before Crane has left. The timing does not hold.',
      ];
      Array.from(container.children).forEach((row, i) => {
        const id = parseInt(row.dataset.id);
        if (id !== CORRECT[i]) {
          row.style.background = 'rgba(60,20,10,0.6)';
          row.style.borderLeftColor = '#884444';
          // Show consequence note
          let note = row.querySelector('.balcony-note');
          if (!note) {
            note = puzzleEl('div', `
              font-size: 9px; font-style: italic; color: #cc6644;
              margin-top: 6px; line-height: 1.4;
            `);
            note.className = 'balcony-note';
            row.appendChild(note);
          }
          note.textContent = CONSEQUENCES[i] || 'This position does not hold.';
        } else {
          row.style.borderLeftColor = 'rgba(184,150,12,0.4)';
        }
      });
      setTimeout(() => {
        Array.from(container.children).forEach(row => {
          row.style.background = 'rgba(16,12,6,0.92)';
          row.style.borderLeftColor = 'rgba(184,150,12,0.3)';
          const note = row.querySelector('.balcony-note');
          if (note) note.remove();
        });
      }, 2000);
      if (typeof window.puzzleFailed === 'function') window.puzzleFailed('balcony-reconstruction');
    }
  });
  submitWrap.appendChild(submit);
  body.appendChild(submitWrap);
}

// ── 2. SEAL MATCH — MASK COMPARISON ───────────────────────
// Two masks displayed side by side — one Estate-commissioned, one plain exterior
// Player examines four details and selects which mask is not Estate-issued
// Correct answer: RIGHT mask (the plain one, no maker's mark)
function buildSealMatch(body, chain) {
  // FORENSIC: Press & hold to develop the seal impression like iodine fuming
  createFingerprintReveal(body, () => {
    _buildSealMatchInner(body, chain);
  });
  return;
}
function _buildSealMatchInner(body, chain) {
  let solved = false;
  let incorrectTaps = 0;

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-masks.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.55);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: (chain && chain.puzzle_content && chain.puzzle_content.instruction) || 'Identify the exterior mask.' });
  body.appendChild(instr);

  // Detail comparison panel — four attributes, one column per mask
  const panel = puzzleEl('div', `
    position: absolute;
    top: 110px; left: 16px; right: 16px;
    display: flex; flex-direction: column; gap: 6px;
  `);
  body.appendChild(panel);

  // Header row
  const header = puzzleEl('div', `
    display: flex; gap: 8px;
    font-family: var(--font-ui); font-size: 9px;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--gold-dim);
  `);
  const hLabel = puzzleEl('div', 'flex:1.4;', { text: 'Detail' });
  const hLeft  = puzzleEl('div', 'flex:1; text-align:center;', { text: 'Mask A' });
  const hRight = puzzleEl('div', 'flex:1; text-align:center;', { text: 'Mask B' });
  header.appendChild(hLabel);
  header.appendChild(hLeft);
  header.appendChild(hRight);
  panel.appendChild(header);

  // Divider
  panel.appendChild(puzzleEl('div', 'height:1px;background:rgba(184,150,12,0.15);margin:2px 0;'));

  // Four comparison rows — field notes reveal progressively on wrong tap
  const DETAILS = [
    {
      label: 'Maker\'s mark',
      a: 'Present — impressed inner banding',
      b: 'Absent — interior is plain',
      note: 'Estate masks carry a maker\'s impression on the inner band. This one does not.',
    },
    {
      label: 'Commission type',
      a: 'Personal — specific to one member',
      b: 'Generic — no designation',
      note: 'No member designation. This mask was not made for anyone in particular.',
    },
    {
      label: 'Wax seal residue',
      a: 'Estate wax on left temple',
      b: 'None',
      note: 'Estate wax seals its own pieces at the temple on issue. This one was never issued.',
    },
    {
      label: 'Wear pattern',
      a: 'Consistent with regular use',
      b: 'Consistent with single use',
      note: 'Worn once. Whoever used this mask had not worn it before tonight.',
    },
  ];

  // Field notes panel — notes revealed after wrong tap
  const notesPanel = puzzleEl('div', `
    position: absolute; top: 300px; left: 16px; right: 16px;
    font-family: var(--font); font-size: 10px; font-style: italic;
    color: rgba(184,150,12,0.6); line-height: 1.7;
    opacity: 0; transition: opacity 400ms ease;
    text-align: center;
  `);
  body.appendChild(notesPanel);
  let noteIndex = 0;

  DETAILS.forEach(detail => {
    const row = puzzleEl('div', `
      display: flex; gap: 8px;
      padding: 9px 0;
      border-bottom: 1px solid rgba(184,150,12,0.07);
      font-family: var(--font); font-size: 10px;
      color: var(--cream-dim); line-height: 1.5;
    `);
    const lbl = puzzleEl('div', `
      flex:1.4; color: var(--gold-dim);
      font-family: var(--font-ui); font-size: 9px;
      letter-spacing: 0.1em; text-transform: uppercase;
    `, { text: detail.label });
    const valA = puzzleEl('div', 'flex:1; text-align:center; font-size:10px;', { text: detail.a });
    const valB = puzzleEl('div', 'flex:1; text-align:center; font-size:10px;', { text: detail.b });
    row.appendChild(lbl);
    row.appendChild(valA);
    row.appendChild(valB);
    panel.appendChild(row);
  });

  function revealNextNote() {
    if (noteIndex >= DETAILS.length) return;
    notesPanel.textContent = DETAILS[noteIndex].note;
    notesPanel.style.opacity = '1';
    noteIndex++;
  }

  // Two selection buttons
  const btnRow = puzzleEl('div', `
    position: absolute; bottom: 24px; left: 16px; right: 16px;
    display: flex; gap: 12px; justify-content: center;
  `);

  function makeMaskBtn(label, isCorrect, puzzleId) {
    const btn = puzzleEl('button', `
      flex: 1; max-width: 160px; padding: 14px 8px;
      background: transparent;
      border: 1px solid var(--gold-dim);
      color: var(--cream-dim);
      font-family: var(--font-ui); font-size: 9px;
      letter-spacing: 0.25em; text-transform: uppercase;
      cursor: pointer; transition: border-color 300ms, color 300ms;
    `);
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (solved) return;
      if (isCorrect) {
        solved = true;
        btn.style.borderColor = 'var(--gold)';
        btn.style.color = 'var(--gold)';
        puzzleSuccess('Mask B.\nNo maker\'s mark.\nBrought from outside.');
        setTimeout(() => fireRewardCinematic('seal-match', chain), 2200);
      } else {
        btn.style.borderColor = '#884444';
        btn.style.color = '#884444';
        setTimeout(() => {
          btn.style.borderColor = 'var(--gold-dim)';
          btn.style.color = 'var(--cream-dim)';
        }, 900);
        revealNextNote();
        incorrectTaps++;
        if (typeof window.puzzleFailed === 'function') window.puzzleFailed('seal-match');
      }
    });
    return btn;
  }

  btnRow.appendChild(makeMaskBtn('Mask A — Estate', false));
  btnRow.appendChild(makeMaskBtn('Mask B — Exterior', true));
  body.appendChild(btnRow);
}

// ── 3. BOND RECONSTRUCTION ─────────────────────────────────
// Five torn strips of parchment, player orders them top to bottom
// Correct order: 3, 1, 4, 2, 5 (mixed)
function buildBondReconstruction(body, chain) {
  // FORENSIC: Rub to reveal the torn bond fragments — like recovering a damaged document
  const rubContainer = puzzleEl('div', 'position:absolute;inset:0;');
  body.appendChild(rubContainer);
  createRubReveal(rubContainer, () => {
    _buildBondSequence(body, chain);
  });
  return;
}
function _buildBondSequence(body, chain) {
  const CORRECT_ORDER = (chain && chain.puzzle_content && chain.puzzle_content.correct_order) || [3, 1, 4, 2, 5];
  const LABELS = (chain && chain.puzzle_content && chain.puzzle_content.labels) || [
    'Compact & Estate — Original Agreement',
    'Article I — Duration and Renewal',
    'Article II — Bond Obligations',
    'Signatory Record — Steward',
    'Witness Annotation — Second Hand',
  ];

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-bond-complete.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.55);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Order the sections.' });
  body.appendChild(instr);

  // Strips container — scrollable list
  const container = puzzleEl('div', `
    position: absolute;
    top: 110px; bottom: 80px; left: 20px; right: 20px;
    display: flex; flex-direction: column; gap: 8px;
    overflow-y: auto;
  `);
  body.appendChild(container);

  // Shuffle for display — never show in natural order
  const shuffled = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
  const strips = shuffled.map(n => {
    const strip = puzzleEl('div', `
      padding: 12px 16px;
      background: rgba(30,25,15,0.85);
      border: 1px solid var(--gold-dim);
      border-left: 3px solid var(--gold-dim);
      font-family: var(--font); font-size: 11px;
      color: var(--cream-dim); line-height: 1.5;
      cursor: grab; user-select: none;
      transition: border-color 300ms, background 300ms;
      display: flex; align-items: center; justify-content: space-between;
    `);
    strip.dataset.n = n;

    const numSpan = puzzleEl('span', `
      font-family: var(--font-ui); font-size: 9px; color: var(--gold);
      min-width: 20px; opacity: 0; transition: opacity 300ms;
      letter-spacing: 0.1em;
    `);
    numSpan.className = 'bond-num';
    const label = puzzleEl('span', 'flex:1;', { text: LABELS[n - 1] });
    const handle = puzzleEl('span', `
      color: var(--gold-dim); font-size: 16px; margin-left: 12px;
    `, { text: '⋮⋮' });

    strip.appendChild(numSpan);
    strip.appendChild(label);
    strip.appendChild(handle);
    return strip;
  });

  let dragSrc = null;

  strips.forEach(strip => {
    strip.addEventListener('dragstart', () => {
      dragSrc = strip;
      strip.style.opacity = '0.5';
    });
    strip.addEventListener('dragend', () => {
      strip.style.opacity = '1';
    });
    strip.addEventListener('dragover', e => {
      e.preventDefault();
      strip.style.borderColor = 'var(--gold)';
    });
    strip.addEventListener('dragleave', () => {
      strip.style.borderColor = 'var(--gold-dim)';
    });
    strip.addEventListener('drop', e => {
      e.preventDefault();
      strip.style.borderColor = 'var(--gold-dim)';
      if (dragSrc && dragSrc !== strip) {
        // Swap positions
        const parent = container;
        const srcIdx = Array.from(parent.children).indexOf(dragSrc);
        const tgtIdx = Array.from(parent.children).indexOf(strip);
        if (srcIdx < tgtIdx) {
          parent.insertBefore(dragSrc, strip.nextSibling);
        } else {
          parent.insertBefore(dragSrc, strip);
        }
      }
    });
    strip.setAttribute('draggable', 'true');
    container.appendChild(strip);
  });

  // Submit
  const submitWrap = puzzleEl('div', `
    position: absolute; bottom: 24px; left: 0; right: 0;
    display: flex; justify-content: center;
  `);
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const submit = puzzleBtn('Confirm Order', () => {
    const current = Array.from(container.children).map(el => parseInt(el.dataset.n));
    const correct = current.every((n, i) => n === CORRECT_ORDER[i]);

    if (correct) {
      // Show all Roman numerals then fire cinematic
      Array.from(container.children).forEach((el, i) => {
        if (!el) return;
        const numEl = el.querySelector('.bond-num');
        if (numEl) { numEl.textContent = ROMAN[i]; numEl.style.opacity = '1'; numEl.style.color = 'var(--gold)'; }
        el.style.borderLeftColor = 'var(--gold)';
      });
      puzzleSuccess('The Bond is reconstructed.\nThe second hand is visible.');
      setTimeout(() => fireRewardCinematic('bond-reconstruction', chain), 2200);
    } else {
      // Show Roman numerals — breaks glow amber so player sees exactly where order fails
      let lastCorrect = -1;
      current.forEach((n, i) => {
        const el = container.children[i] || null;
        const numEl = el ? el.querySelector('.bond-num') : null;
        if (numEl) {
          numEl.textContent = ROMAN[i];
          numEl.style.opacity = '1';
        }
        if (el && n !== CORRECT_ORDER[i] && lastCorrect !== i) {
          // First break point
          el.style.borderLeftColor = '#B8860B';
          el.style.borderColor = '#B8860B';
          lastCorrect = i;
        }
      });
      setTimeout(() => {
        Array.from(container.children).forEach(el => {
          if (!el) return;
          el.style.borderLeftColor = 'var(--gold-dim)';
          el.style.borderColor = 'var(--gold-dim)';
          const numEl = el.querySelector('.bond-num');
          if (numEl) { numEl.textContent = ''; numEl.style.opacity = '0'; }
        });
      }, 1400);
      if (typeof window.puzzleFailed === 'function') window.puzzleFailed('bond-reconstruction');
    }
  });
  submitWrap.appendChild(submit);
  body.appendChild(submitWrap);
}

// ── 4. CHRONOLOGY ──────────────────────────────────────────
// Six events, player orders them earliest to latest
// Correct: Compact founded → Agreement signed → Isabelle executed → Ashworth withdraws → Surgeon placed → Tonight
// ── MOTIVE RECONSTRUCTION ──────────────────────────────────
// The thirty-year sequence. Six events drag-ordered earliest to latest.
// Uses the same drag mechanic as chronology.
// Player orders the events that connect the licensing board to tonight.
function buildMotiveReconstruction(body, chain) {
  // FORENSIC: Dust sweep reveals the burned fragments before reconstruction
  const dustWrap = puzzleEl('div', 'position:absolute;inset:0;');
  body.appendChild(dustWrap);
  createDustLayer(dustWrap, () => {
    _buildMotiveInner(body, chain);
  });
  return;
}
function _buildMotiveInner(body, chain) {
  // Use chain-specific content if provided, else Surgeon default
  const EVENTS = (chain && chain.puzzle_content && chain.puzzle_content.events) || [
    { id: 1, text: 'A physician trained. The kind of precision that makes institutions uncomfortable.' },
    { id: 2, text: 'A licensing board convened. Three senior members. Lord Ashworth in the chair.' },
    { id: 3, text: 'A determination signed. Credentials revoked. No appeal permitted.' },
    { id: 4, text: 'A physician left practice. The work continued in a different form.' },
    { id: 5, text: 'A new identity built. Four years inside the Compact. Access to the Estate.' },
    { id: 6, text: 'The Rite convened. The Register opened. Lord Ashworth at the railing.' },
  ];
  const CORRECT = (chain && chain.puzzle_content && chain.puzzle_content.correct) || [1, 2, 3, 4, 5, 6];

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-chronology.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.65);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Order earliest to latest.' });
  body.appendChild(instr);

  const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);

  const container = puzzleEl('div', `
    position: absolute;
    top: 110px; bottom: 80px; left: 20px; right: 20px;
    display: flex; flex-direction: column; gap: 6px;
    overflow-y: auto;
  `);
  body.appendChild(container);

  let dragSrc = null;

  shuffled.forEach(evt => {
    const row = puzzleEl('div', `
      padding: 11px 14px;
      background: rgba(20,16,8,0.9);
      border: 1px solid var(--gold-dim);
      font-family: var(--font); font-size: 11px;
      color: var(--cream-dim); line-height: 1.5;
      cursor: grab; user-select: none;
      display: flex; align-items: center; justify-content: space-between;
      transition: border-color 300ms;
    `);
    row.dataset.id = evt.id;
    row.setAttribute('draggable', 'true');

    const txt = puzzleEl('span', 'flex:1;', { text: evt.text });
    const hdl = puzzleEl('span', `color:var(--gold-dim);font-size:16px;margin-left:12px;`, { text: '⋮⋮' });
    row.appendChild(txt);
    row.appendChild(hdl);

    row.addEventListener('dragstart', () => { dragSrc = row; row.style.opacity = '0.4'; });
    row.addEventListener('dragend',   () => { row.style.opacity = '1'; });
    row.addEventListener('dragover',  e => { e.preventDefault(); row.style.borderColor = 'var(--gold)'; });
    row.addEventListener('dragleave', () => { row.style.borderColor = 'var(--gold-dim)'; });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.style.borderColor = 'var(--gold-dim)';
      if (dragSrc && dragSrc !== row) {
        const srcIdx = Array.from(container.children).indexOf(dragSrc);
        const tgtIdx = Array.from(container.children).indexOf(row);
        if (srcIdx < tgtIdx) container.insertBefore(dragSrc, row.nextSibling);
        else container.insertBefore(dragSrc, row);
      }
    });

    container.appendChild(row);
  });

  const submitWrap = puzzleEl('div', `
    position: absolute; bottom: 24px; left: 0; right: 0;
    display: flex; justify-content: center;
  `);

  const submitBtn = puzzleEl('button', `
    padding: 10px 32px;
    background: rgba(20,16,8,0.95);
    border: 1px solid var(--gold-dim);
    color: var(--gold); font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; cursor: pointer;
  `, { text: 'CONFIRM SEQUENCE' });

  submitBtn.addEventListener('click', () => {
    const order = Array.from(container.children).map(r => parseInt(r.dataset.id));
    const correct = order.every((id, i) => id === CORRECT[i]);
    if (correct) {
      fireRewardCinematic('motive-reconstruction', chain);
    } else {
      window.puzzleFailed && window.puzzleFailed('motive-reconstruction');
      submitBtn.style.borderColor = 'rgba(200,60,40,0.6)';
      setTimeout(() => { submitBtn.style.borderColor = 'var(--gold-dim)'; }, 800);
    }
  });

  submitWrap.appendChild(submitBtn);
  body.appendChild(submitWrap);
}

// ── CHRONOLOGY ─────────────────────────────────────────────
function buildChronology(body, chain) {
  // Mechanic: player taps events in the order they believe they occurred.
  // Each tap locks a position. Correct = card locks gold with sequence number.
  // Wrong sequence = the broken card pulses red and ejects from sequence.
  // Player can see exactly which events they placed correctly. Progressive.

  const EVENTS = [
    { id: 1, text: 'Isabelle Voss is executed on fabricated evidence. The separation begins.' },
    { id: 2, text: 'Ashworth finds the fabrication in the Estate archive. He does not act on it.' },
    { id: 3, text: 'Ashworth ceases attending the Compact. No explanation given.' },
    { id: 4, text: 'The operative enters the Compact on Estate instruction.' },
    { id: 5, text: 'Ashworth begins burning documents in the study fireplace.' },
    { id: 6, text: 'The Envoy places the routing record in Archive Case 3.' },
  ];
  // Correct order: execution → ceases attending → finds fabrication → operative placed → burning → routing record
  const CORRECT = [1, 3, 2, 4, 5, 6];

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-chronology.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.6);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Tap in chronological order.' });
  body.appendChild(instr);

  const progress = puzzleEl('div', `
    position: absolute; top: 92px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 8px; letter-spacing: 0.2em;
    color: var(--gold-dim);
  `);
  body.appendChild(progress);

  const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
  const container = puzzleEl('div', `
    position: absolute;
    top: 110px; bottom: 24px; left: 16px; right: 16px;
    display: flex; flex-direction: column; gap: 6px;
    overflow-y: auto;
  `);
  body.appendChild(container);

  let sequence = [];     // ids tapped so far
  let locked = new Set(); // ids confirmed correct
  let solved = false;

  const cards = {};

  shuffled.forEach(evt => {
    const card = puzzleEl('div', `
      padding: 11px 14px;
      background: rgba(20,16,8,0.9);
      border: 1px solid var(--gold-dim);
      border-left: 3px solid transparent;
      font-family: var(--font); font-size: 11px;
      color: var(--cream-dim); line-height: 1.5;
      cursor: pointer; user-select: none;
      display: flex; align-items: center; gap: 12px;
      transition: border-color 300ms, background 300ms, opacity 300ms;
    `);

    const num = puzzleEl('div', `
      font-family: var(--font-ui); font-size: 11px;
      color: var(--gold); min-width: 18px;
      opacity: 0; transition: opacity 300ms;
      font-weight: bold;
    `);
    const txt = puzzleEl('div', 'flex:1;', { text: evt.text });
    card.appendChild(num);
    card.appendChild(txt);
    card.dataset.id = evt.id;
    cards[evt.id] = { el: card, num };

    card.addEventListener('click', () => {
      if (solved || locked.has(evt.id)) return;

      sequence.push(evt.id);
      const pos = sequence.length; // 1-indexed position player is claiming
      const correctAtPos = CORRECT[pos - 1];

      if (evt.id === correctAtPos) {
        // Correct — lock it
        locked.add(evt.id);
        card.style.borderLeftColor = 'var(--gold)';
        card.style.background = 'rgba(184,150,12,0.08)';
        card.style.cursor = 'default';
        num.textContent = pos;
        num.style.opacity = '1';
        if (typeof haptic === 'function') haptic([20, 10, 20]);

        progress.textContent = pos + ' / ' + CORRECT.length + ' placed';

        if (locked.size === CORRECT.length) {
          solved = true;
          progress.textContent = '';
          puzzleSuccess('The sequence is confirmed.\nForty years assembled in order.');
          setTimeout(() => fireRewardCinematic('chronology', chain), 2200);
        }
      } else {
        // Wrong — eject this card from sequence, show it broke
        sequence.pop();
        card.style.borderLeftColor = '#884444';
        card.style.borderColor = '#884444';
        if (typeof haptic === 'function') haptic([40, 20, 40]);
        setTimeout(() => {
          card.style.borderLeftColor = 'transparent';
          card.style.borderColor = 'var(--gold-dim)';
        }, 700);
        if (typeof window.puzzleFailed === 'function') window.puzzleFailed('chronology');
      }
    });

    container.appendChild(card);
  });

  progress.textContent = '0 / ' + CORRECT.length + ' placed';
}
// ── 5. BILATERAL SEAL ──────────────────────────────────────
// Two seals — Estate (red) and Compact (blue) — player rotates each
// Until both align at correct angles: Estate 0°, Compact 180°
function buildBilateralSeal(body, chain) {
  const TARGET = { estate: 0, compact: 180 };
  const TOLERANCE = 15;
  let angles = { estate: 45, compact: 120 };
  let solved = false;

  // Background
  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-seal-compact.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.5);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Align the two seals.' });
  body.appendChild(instr);

  // Two seal discs — Estate left, Compact right
  const sealsWrap = puzzleEl('div', `
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    display: flex; gap: 32px; align-items: center;
  `);
  body.appendChild(sealsWrap);

  function makeSeal(key, label, color) {
    const wrap = puzzleEl('div', `
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    `);

    const disc = puzzleEl('div', `
      width: 110px; height: 110px;
      border-radius: 50%;
      border: 2px solid ${color};
      background: rgba(10,8,5,0.7);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-ui); font-size: 10px;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: ${color};
      cursor: pointer;
      user-select: none;
      transition: transform 300ms ease;
      position: relative;
    `);

    // Indicator line to show rotation
    const indicator = puzzleEl('div', `
      position: absolute; top: 8px; left: 50%;
      transform: translateX(-50%);
      width: 2px; height: 20px;
      background: ${color};
      border-radius: 1px;
    `);
    disc.appendChild(indicator);
    disc.appendChild(puzzleEl('span', 'z-index:1;', { text: label }));

    const lbl = puzzleEl('div', `
      font-family: var(--font-ui); font-size: 8px;
      letter-spacing: 0.25em; text-transform: uppercase;
      color: var(--cream-dim);
    `, { text: key === 'estate' ? 'Estate' : 'Compact' });

    // Rotate CW on tap
    disc.addEventListener('click', () => {
      if (solved) return;
      angles[key] = (angles[key] + 30) % 360;
      disc.style.transform = `rotate(${angles[key]}deg)`;
      checkAlignment();
    });

    wrap.appendChild(disc);
    wrap.appendChild(lbl);
    sealsWrap.appendChild(wrap);
    return disc;
  }

  const estateDisc  = makeSeal('estate', 'E', '#C87A7A');
  const compactDisc = makeSeal('compact', 'C', '#7A9AC8');

  // Set initial visual rotation
  estateDisc.style.transform  = `rotate(${angles.estate}deg)`;
  compactDisc.style.transform = `rotate(${angles.compact}deg)`;

  function checkAlignment() {
    const eDiff = Math.abs(angles.estate  - TARGET.estate);
    const cDiff = Math.abs(angles.compact - TARGET.compact);
    if (eDiff <= TOLERANCE && cDiff <= TOLERANCE) {
      solved = true;
      puzzleSuccess('The marks resolve.\nTwo seals. One origin.');
      setTimeout(() => fireRewardCinematic('bilateral-seal', chain), 2200);
    }
  }

  const hint = puzzleEl('div', `
    position: absolute; bottom: 80px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 8px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--text-dim);
  `, { text: 'Tap each seal to rotate.' });
  body.appendChild(hint);
}

// ── 6. INK COMPARISON ──────────────────────────────────────
// Document shown with 5 paragraphs — player taps the one in a different hand
// Correct: paragraph 3 (the margin annotations added after signing)
function buildInkComparison(body, chain) {
  // FORENSIC: Tilt phone to catch light on the ink — reveals the anomalous entry
  // After tilt reveals, the normal magnifier puzzle starts
  createTiltLighting(body, () => {
    // Tilt done — show instruction update
    const tiltDone = puzzleEl('div', `
      position:absolute;top:72px;left:0;right:0;text-align:center;
      font-family:var(--font-ui);font-size:9px;letter-spacing:0.25em;
      text-transform:uppercase;color:rgba(180,150,80,0.7);z-index:7;
    `, { text: 'Anomaly detected. Locate the entry.' });
    body.appendChild(tiltDone);
    setTimeout(() => { tiltDone.style.transition='opacity 400ms'; tiltDone.style.opacity='0'; setTimeout(()=>tiltDone.remove(),420); }, 1800);
  });
  // Mechanic: two-column paragraph comparison with a sliding magnifier.
  // The correct paragraph has subtly different ink weight — revealed by the act of comparison.
  // Player drags the magnifier across the text. The anomalous paragraph reacts.
  // Tapping a paragraph selects it. Wrong = magnifier pulse. Correct = ink shifts gold.

  const CORRECT_TEXT = 'The Steward shall provide corridor access upon receipt of sealed instruction, without requirement for additional verification.';
  const PARAGRAPHS_RAW = [
    'The undersigned parties agree to the terms set forth in the original compact, and affirm their continued obligations thereunder.',
    'Bond obligations shall renew annually unless formally dissolved by both parties in writing, witnessed by the Estate Curator.',
    'The Steward shall provide corridor access upon receipt of sealed instruction, without requirement for additional verification.',
    'All parties acknowledge the terms of this agreement as binding and enforceable within the laws of the Estate.',
    'Signed this day in the presence of the following witnesses, whose names appear on the attached record.',
  ];
  const PARAGRAPHS = [...PARAGRAPHS_RAW].sort(() => Math.random() - 0.5);

  let selected = null;
  let solved = false;

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-ink-comparison.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.6);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Find the different hand. Tap to select.' });
  body.appendChild(instr);

  // Magnifier bar — draggable horizontal line that sweeps across paragraphs
  const magnifier = puzzleEl('div', `
    position: absolute; left: 0; right: 0; height: 2px;
    background: rgba(184,150,12,0.35);
    top: 115px; cursor: ns-resize; z-index: 10;
    transition: background 200ms;
    box-shadow: 0 0 8px rgba(184,150,12,0.2);
  `);
  body.appendChild(magnifier);

  // Drag magnifier
  let dragging = false;
  magnifier.addEventListener('pointerdown', e => { dragging = true; magnifier.setPointerCapture(e.pointerId); });
  function moveMagnifier(clientY) {
    if (!dragging) return;
    const bodyRect = body.getBoundingClientRect();
    const y = Math.max(110, Math.min(clientY - bodyRect.top, bodyRect.height - 80));
    magnifier.style.top = y + 'px';
    // Highlight paragraph under magnifier
    paras.forEach(({ el, isCorrect }) => {
      const rect = el.getBoundingClientRect();
      const elY = rect.top - bodyRect.top;
      const hit = y >= elY && y <= elY + rect.height;
      if (hit && isCorrect && !solved) {
        el.style.borderColor = 'rgba(184,150,12,0.5)';
        el.style.color = 'rgba(255,245,220,0.9)';
      } else if (!hit || solved) {
        if (el._selected) return;
        el.style.borderColor = 'var(--gold-dim)';
        el.style.color = 'var(--cream-dim)';
      }
    });
  }
  document.addEventListener('pointermove', e => moveMagnifier(e.clientY));
  document.addEventListener('touchmove', e => { if (dragging) moveMagnifier(e.touches[0].clientY); }, { passive: true });
  document.addEventListener('pointerup', () => { dragging = false; });
  document.addEventListener('touchend', () => { dragging = false; });

  const container = puzzleEl('div', `
    position: absolute;
    top: 120px; bottom: 40px; left: 16px; right: 16px;
    display: flex; flex-direction: column; gap: 8px;
    overflow-y: auto;
  `);
  body.appendChild(container);

  const paras = [];

  PARAGRAPHS.forEach((text) => {
    const isCorrect = text === CORRECT_TEXT;
    const para = puzzleEl('div', `
      padding: 12px 14px;
      background: rgba(20,16,8,0.85);
      border: 1px solid var(--gold-dim);
      border-left: 3px solid transparent;
      font-family: var(--font); font-size: 11px;
      color: var(--cream-dim); line-height: 1.7;
      cursor: pointer;
      transition: background 300ms, border-color 300ms, color 300ms;
    `);
    para.textContent = text;
    para._selected = false;

    para.addEventListener('click', () => {
      if (solved) return;
      if (isCorrect) {
        solved = true;
        para.style.borderLeftColor = 'var(--gold)';
        para.style.borderColor = 'var(--gold)';
        para.style.background = 'rgba(184,150,12,0.12)';
        para.style.color = 'var(--gold)';
        setTimeout(() => {
          puzzleSuccess('A different hand.\nA different year.\nA different instruction.');
          setTimeout(() => fireRewardCinematic('ink-comparison', chain), 2200);
        }, 400);
      } else {
        // Wrong — pulse red, magnifier shifts gold briefly, no "wrong" text
        para.style.background = 'rgba(80,20,20,0.35)';
        para.style.borderColor = '#884444';
        magnifier.style.background = 'rgba(180,60,60,0.5)';
        setTimeout(() => {
          para.style.background = 'rgba(20,16,8,0.85)';
          para.style.borderColor = 'var(--gold-dim)';
          magnifier.style.background = 'rgba(184,150,12,0.35)';
          para._selected = false;
        }, 900);
        if (typeof window.puzzleFailed === 'function') window.puzzleFailed('ink-comparison');
      }
    });

    paras.push({ el: para, isCorrect });
    container.appendChild(para);
  });
}
// ── 7. CORRESPONDENCE THREAD ───────────────────────────────
// Six letters, player orders them by date — earliest to latest
// Correct: 1, 2, 3, 4, 5, 6 — representing 40 years of correspondence
function buildCorrespondenceThread(body, chain) {
  // FORENSIC: Swipe to break the wax seal before the letters are revealed
  createWaxSealBreak(body, () => {
    _buildCorrespondenceInner(body, chain);
  });
  return;
}
function _buildCorrespondenceInner(body, chain) {
  const LETTERS = (chain && chain.puzzle_content && chain.puzzle_content.letters) || [
    { id: 1, date: '12 March, 1983', excerpt: 'The agreement stands regardless of what the Estate chooses to acknowledge publicly.' },
    { id: 2, date: '7 November, 1991', excerpt: 'I will not attend again. Do not write to this address.' },
    { id: 3, date: '3 June, 2004', excerpt: 'You are aware what the Register contains. You have been aware for twenty years.' },
    { id: 4, date: '14 September, 2016', excerpt: 'If the Rite proceeds as planned, the Register will be read. You know this.' },
    { id: 5, date: '22 January, 2023', excerpt: 'I do not expect a reply. I am informing you of what will happen.' },
    { id: 6, date: 'The night of the Rite', excerpt: '(Unsealed. Never sent.)' },
  ];
  const CORRECT = (chain && chain.puzzle_content && chain.puzzle_content.correct) || [1, 2, 3, 4, 5, 6];

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-correspondence-thread.png'), draggable: 'false' });
  body.appendChild(img);

  const overlay = puzzleEl('div', `
    position: absolute; inset: 0; background: rgba(10,8,5,0.58);
  `);
  body.appendChild(overlay);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Order earliest to latest.' });
  body.appendChild(instr);

  const shuffled = [...LETTERS].sort(() => Math.random() - 0.5);

  const container = puzzleEl('div', `
    position: absolute;
    top: 110px; bottom: 80px; left: 16px; right: 16px;
    display: flex; flex-direction: column; gap: 6px;
    overflow-y: auto;
  `);
  body.appendChild(container);

  let dragSrc = null;

  shuffled.forEach(letter => {
    const row = puzzleEl('div', `
      padding: 10px 14px;
      background: rgba(20,16,8,0.88);
      border: 1px solid var(--gold-dim);
      font-family: var(--font); font-size: 10px;
      color: var(--cream-dim); line-height: 1.6;
      cursor: grab; user-select: none;
      transition: border-color 300ms, transform 300ms;
    `);
    row.dataset.id = letter.id;
    row.setAttribute('draggable', 'true');

    const excerpt = puzzleEl('div', 'font-style:italic; line-height:1.7;', { text: letter.excerpt });
    row.appendChild(excerpt);

    row.addEventListener('dragstart', () => { dragSrc = row; row.style.opacity = '0.4'; });
    row.addEventListener('dragend', () => { row.style.opacity = '1'; });
    row.addEventListener('dragover', e => { e.preventDefault(); row.style.borderColor = 'var(--gold)'; });
    row.addEventListener('dragleave', () => { row.style.borderColor = 'var(--gold-dim)'; });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.style.borderColor = 'var(--gold-dim)';
      if (dragSrc && dragSrc !== row) {
        const srcIdx = Array.from(container.children).indexOf(dragSrc);
        const tgtIdx = Array.from(container.children).indexOf(row);
        if (srcIdx < tgtIdx) container.insertBefore(dragSrc, row.nextSibling);
        else container.insertBefore(dragSrc, row);
      }
    });

    container.appendChild(row);
  });

  // Seal stamp button — "seal and send"
  const sealWrap = puzzleEl('div', `
    position: absolute; bottom: 16px; left: 0; right: 0;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  `);

  const sealBtn = puzzleEl('div', `
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(184,150,12,0.08);
    border: 1px solid rgba(184,150,12,0.35);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; user-select: none;
    transition: background 300ms, border-color 300ms;
    font-size: 22px;
  `, { text: '⊕' });

  const sealLabel = puzzleEl('div', `
    font-family: var(--font-ui); font-size: 7px;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(184,150,12,0.4);
  `, { text: 'Seal & Send' });

  sealBtn.addEventListener('click', () => {
    const order = Array.from(container.children).map(el => parseInt(el.dataset.id));
    const correct = order.every((id, i) => id === CORRECT[i]);

    if (correct) {
      sealBtn.textContent = '✦';
      sealBtn.style.background = 'rgba(184,150,12,0.2)';
      sealBtn.style.borderColor = 'var(--gold)';
      puzzleSuccess('Forty years.\nA thread that was never answered.');
      setTimeout(() => fireRewardCinematic('correspondence-thread', chain), 2200);
    } else {
      // Crack — find first break and slide that letter out slightly
      let cracked = false;
      Array.from(container.children).forEach((row, i) => {
        const id = parseInt(row.dataset.id);
        if (!cracked && id !== CORRECT[i]) {
          cracked = true;
          // Only slide if not currently being dragged
          if (dragSrc !== row) {
            row.style.transform = 'translateX(8px)';
            row.style.borderColor = '#884444';
            setTimeout(() => {
              row.style.transform = 'translateX(0)';
              row.style.borderColor = 'var(--gold-dim)';
            }, 1000);
          }
        }
      });
      sealBtn.textContent = '✕';
      sealBtn.style.borderColor = '#884444';
      setTimeout(() => {
        sealBtn.textContent = '⊕';
        sealBtn.style.borderColor = 'rgba(184,150,12,0.35)';
      }, 900);
      if (typeof window.puzzleFailed === 'function') window.puzzleFailed('correspondence-thread');
    }
  });

  sealWrap.appendChild(sealBtn);
  sealWrap.appendChild(sealLabel);
  body.appendChild(sealWrap);
}

// ── 8. WITNESS MAP ─────────────────────────────────────────
// Floor plan map — 4 observation pins to place at correct rooms
// Produces safe combination: four room numbers in order
// Correct positions: foyer(5:47), gallery(6:15), physicians(7:58), vault(8:01)
function buildWitnessMap(body, chain) {
  // Cause-and-effect matching puzzle.
  // Tests whether the player absorbed the deep history from all four Compact NPCs.
  // Four causes (left column) must be matched to four effects (right column).
  // Drag on mobile, click-to-select on desktop.

  const PAIRS = [
    {
      id: 'routing',
      cause:  'Someone entered the Estate\'s archive two weeks before the fabricated evidence against Isabelle surfaced.',
      effect: 'The Compact held proof the separation was manufactured — but could not name the actor to the Estate.',
    },
    {
      id: 'execution',
      cause:  'The Sovereign ordered Isabelle\'s execution on the basis of evidence he believed was sound.',
      effect: 'Forty-three years of separation between two organisations that were once the same thing.',
    },
    {
      id: 'fragments',
      cause:  'Ashworth found the fabrication from the Estate\'s own records and destroyed his working documents before the Rite.',
      effect: 'The burned fragments in the study — the methodology gone, the conclusion preserved.',
    },
    {
      id: 'placement',
      cause:  'The Envoy placed the routing record in Archive Case 3 six months before tonight.',
      effect: 'Tonight was the first time the Estate could have received its own proof of the fabrication from inside its own process.',
    },
  ];

  // Shuffle effects independently so they don't line up with causes
  const shuffledEffects = [...PAIRS].sort(() => {
    // Fixed shuffle — always same order so walkthrough works
    return 0.5 - Math.random();
  });
  // Use a seeded-ish shuffle — deterministic per session
  const effectOrder = [2, 0, 3, 1]; // effect indices mapped to display positions
  const displayEffects = effectOrder.map(i => PAIRS[i]);

  let selected = { cause: null, effect: null };
  let matched = {}; // causeId -> true
  let solved = false;

  // Background
  body.style.background = '#080503';

  // Header
  const header = puzzleEl('div', `
    position: absolute; top: 16px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 8px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--gold-dim);
  `, { text: 'Match each cause to its consequence.' });
  body.appendChild(header);

  // Two-column layout
  const layout = puzzleEl('div', `
    position: absolute;
    top: 52px; bottom: 60px; left: 0; right: 0;
    display: flex; gap: 0;
  `);
  body.appendChild(layout);

  // Left column — Causes
  const leftCol = puzzleEl('div', `
    flex: 1;
    display: flex; flex-direction: column; gap: 6px;
    padding: 0 6px 0 12px;
    overflow-y: auto;
  `);
  layout.appendChild(leftCol);

  // Divider
  const divider = puzzleEl('div', `
    width: 1px;
    background: rgba(184,150,12,0.15);
    margin: 0;
    flex-shrink: 0;
  `);
  layout.appendChild(divider);

  // Right column — Effects
  const rightCol = puzzleEl('div', `
    flex: 1;
    display: flex; flex-direction: column; gap: 6px;
    padding: 0 12px 0 6px;
    overflow-y: auto;
  `);
  layout.appendChild(rightCol);

  // Column labels
  const causeLabel = puzzleEl('div', `
    font-family: var(--font-ui); font-size: 7px;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(184,150,12,0.35); margin-bottom: 4px;
  `, { text: 'CAUSE' });
  leftCol.appendChild(causeLabel);

  const effectLabel = puzzleEl('div', `
    font-family: var(--font-ui); font-size: 7px;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(184,150,12,0.35); margin-bottom: 4px;
  `, { text: 'CONSEQUENCE' });
  rightCol.appendChild(effectLabel);

  function cardStyle(active, matched_done) {
    return `
      padding: 10px 12px;
      background: ${matched_done ? 'rgba(40,55,35,0.7)' : active ? 'rgba(184,150,12,0.12)' : 'rgba(20,16,8,0.85)'};
      border: 1px solid ${matched_done ? 'rgba(100,160,80,0.4)' : active ? 'var(--gold)' : 'rgba(184,150,12,0.2)'};
      border-radius: 2px;
      font-family: var(--font); font-size: 10px;
      color: ${matched_done ? 'rgba(180,200,160,0.7)' : 'var(--cream-dim)'};
      line-height: 1.55;
      cursor: ${matched_done ? 'default' : 'pointer'};
      user-select: none;
      transition: border-color 200ms, background 200ms;
      opacity: ${matched_done ? '0.6' : '1'};
    `;
  }

  // Build cause cards
  const causeCards = {};
  PAIRS.forEach(pair => {
    const card = puzzleEl('div', cardStyle(false, false), { text: pair.cause });
    card.dataset.id = pair.id;
    card.dataset.type = 'cause';

    card.addEventListener('click', () => {
      if (solved || matched[pair.id]) return;
      if (selected.cause === pair.id) {
        // Deselect
        selected.cause = null;
        card.style.cssText = cardStyle(false, false);
      } else {
        // Select this cause
        if (selected.cause) causeCards[selected.cause].style.cssText = cardStyle(false, false);
        selected.cause = pair.id;
        card.style.cssText = cardStyle(true, false);
        // If effect also selected — check match
        if (selected.effect) checkMatch();
      }
    });

    causeCards[pair.id] = card;
    leftCol.appendChild(card);
  });

  // Build effect cards
  const effectCards = {};
  displayEffects.forEach(pair => {
    const card = puzzleEl('div', cardStyle(false, false), { text: pair.effect });
    card.dataset.id = pair.id;
    card.dataset.type = 'effect';

    card.addEventListener('click', () => {
      if (solved || matched[pair.id]) return;
      if (selected.effect === pair.id) {
        selected.effect = null;
        card.style.cssText = cardStyle(false, false);
      } else {
        if (selected.effect) effectCards[selected.effect].style.cssText = cardStyle(false, false);
        selected.effect = pair.id;
        card.style.cssText = cardStyle(true, false);
        if (selected.cause) checkMatch();
      }
    });

    effectCards[pair.id] = card;
    rightCol.appendChild(card);
  });

  function checkMatch() {
    const cId = selected.cause;
    const eId = selected.effect;
    if (!cId || !eId) return;

    if (cId === eId) {
      // Correct match
      matched[cId] = true;
      causeCards[cId].style.cssText = cardStyle(false, true);
      effectCards[eId].style.cssText = cardStyle(false, true);
      selected = { cause: null, effect: null };
      haptic([20, 10, 20]);

      // Check if all matched
      if (Object.keys(matched).length === PAIRS.length) {
        solved = true;
        setTimeout(() => {
          puzzleSuccess('Four causes.\nFour consequences.\nThe history of the separation\nassembled from both sides.');
          setTimeout(() => fireRewardCinematic('witness-map', chain), 2200);
        }, 600);
      }
    } else {
      // Wrong match — flash red, reset selection
      causeCards[cId].style.cssText = cardStyle(false, false);
      causeCards[cId].style.borderColor = '#884444';
      effectCards[eId].style.cssText = cardStyle(false, false);
      effectCards[eId].style.borderColor = '#884444';
      selected = { cause: null, effect: null };
      haptic([40, 20, 40]);
      if (typeof window.puzzleFailed === 'function') window.puzzleFailed('witness-map');

      setTimeout(() => {
        if (causeCards[cId]) causeCards[cId].style.borderColor = 'rgba(184,150,12,0.2)';
        if (effectCards[eId]) effectCards[eId].style.borderColor = 'rgba(184,150,12,0.2)';
      }, 900);
    }
  }

  // Hint
  const hint = puzzleEl('div', `
    position: absolute; bottom: 18px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 8px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--text-dim);
  `, { text: 'Select one from each column.' });
  body.appendChild(hint);
}

// ── 9. INK REVEAL ──────────────────────────────────────────
// Device tilt (gyroscope) or slider reveals hidden annotation
// Annotation: The Uninvited's channel mark — a third hand on the operational brief
function buildInkReveal(body, chain) {
  let revealed = false;
  let sliderValue = 0;

  const img = puzzleEl('img', `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  `, { src: puzzleAsset('nocturne-puzzle-ink-reveal.png'), draggable: 'false' });
  body.appendChild(img);

  // Hidden annotation layer — revealed by tilt/slider
  const annotationLayer = puzzleEl('div', `
    position: absolute; inset: 0;
    background: rgba(10,8,5,0);
    display: flex; align-items: center; justify-content: center;
    transition: none;
  `);
  body.appendChild(annotationLayer);

  const annotation = puzzleEl('div', `
    position: absolute;
    top: 38%; left: 12%; right: 12%;
    font-family: 'Georgia', serif;
    font-size: 13px; line-height: 1.9;
    color: rgba(184,150,12,0);
    transition: color 400ms;
    text-align: center;
    font-style: italic;
    letter-spacing: 0.03em;
    transform: rotate(-1.5deg);
    pointer-events: none;
  `, { text: 'This channel was not the Compact\'s.\nA third party has read this document.\nThe investigator is also being investigated.' });
  annotationLayer.appendChild(annotation);

  const instr = puzzleEl('div', `
    position: absolute; top: 72px; left: 0; right: 0;
    text-align: center; font-family: var(--font-ui);
    font-size: 9px; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--cream-dim);
  `, { text: 'Tilt to reveal.' });
  body.appendChild(instr);

  // Slider fallback — always available
  const sliderWrap = puzzleEl('div', `
    position: absolute; bottom: 80px; left: 32px; right: 32px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  `);
  const sliderLabel = puzzleEl('div', `
    font-family: var(--font-ui); font-size: 8px;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--text-dim);
  `, { text: 'Angle' });
  const slider = puzzleEl('input', `
    width: 100%; accent-color: var(--gold);
    cursor: pointer;
  `, { type: 'range', min: '0', max: '100', value: '0' });

  slider.addEventListener('input', () => {
    sliderValue = parseInt(slider.value);
    updateReveal(sliderValue / 100);
  });

  sliderWrap.appendChild(sliderLabel);
  sliderWrap.appendChild(slider);
  body.appendChild(sliderWrap);

  // Gyroscope — if available
  let gyroAvailable = false;
  if (typeof DeviceOrientationEvent !== 'undefined') {
    const requestGyro = () => {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(p => {
          if (p === 'granted') gyroAvailable = true;
        }).catch(() => {});
      } else {
        gyroAvailable = true;
      }
    };
    requestGyro();

    window.addEventListener('deviceorientation', (e) => {
      if (!gyroAvailable) return;
      // beta = front-back tilt (-180 to 180)
      const beta = e.beta || 0;
      // Map 60-90 degrees to 0-1 reveal
      const normalised = Math.max(0, Math.min(1, (beta - 60) / 30));
      updateReveal(normalised);
      slider.value = Math.round(normalised * 100);
    });
  }

  function updateReveal(amount) {
    // Amount 0→1
    const opacity = amount;
    annotation.style.color = `rgba(184,150,12,${opacity})`;
    annotationLayer.style.background = `rgba(10,8,5,${amount * 0.3})`;

    if (amount >= 0.85 && !revealed) {
      revealed = true;
      setTimeout(() => {
        puzzleSuccess('A third hand.\nThis document has been read before.');
        setTimeout(() => fireRewardCinematic('ink-reveal', chain), 2200);
      }, 800);
    }
  }
}

console.log('[puzzles.js] All 9 puzzles loaded.');
