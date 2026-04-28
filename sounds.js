// ============================================================
// NOCTURNE — sounds.js
// Web Audio API. D minor Estate. F major Compact.
// Zero impact on game outcome. Rewards headphone players.
// KB v6 Final · Section XXVII · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

const NocturneSound = (() => {
  let _ctx = null;
  let _masterGain = null;
  let _ambientNode = null;
  let _musicNode = null;
  let _chopinNode = null;
  let _ambientVolume = 0.15;
  let _chopinPlaying = false;

  function getCtx() {
    if (!_ctx) {
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
        _masterGain = _ctx.createGain();
        _masterGain.gain.value = 1.0;
        _masterGain.connect(_ctx.destination);
      } catch(e) { return null; }
    }
    return _ctx;
  }

  function resume() {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') return ctx.resume();
    return Promise.resolve();
  }

  function loadAudio(url) {
    return new Promise((resolve, reject) => {
      const ctx = getCtx();
      if (!ctx) return reject('No audio context');
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => ctx.decodeAudioData(buf))
        .then(resolve)
        .catch(reject);
    });
  }

  function playBuffer(buffer, loop, gainValue, destination) {
    const ctx = getCtx();
    if (!ctx || !buffer) return null;
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    source.buffer = buffer;
    source.loop = loop;
    gainNode.gain.value = gainValue;
    source.connect(gainNode);
    gainNode.connect(destination || _masterGain);
    source.start(0);
    return { source, gainNode };
  }

  function fadeGain(gainNode, targetValue, durationMs) {
    if (!gainNode) return;
    const ctx = getCtx();
    if (!ctx) return;
    gainNode.gain.setTargetAtTime(targetValue, ctx.currentTime, durationMs / 1000 / 3);
  }

  // ── AMBIENT ────────────────────────────────────────────────
  let _ambientSilenceTimer = null;
  let _ambientBuffer = null;
  let _ambientIsCompact = false;

  function _clearAmbientTimers() {
    if (_ambientSilenceTimer) { clearTimeout(_ambientSilenceTimer); _ambientSilenceTimer = null; }
  }

  function _playAmbientOnce(fade) {
    if (!_ambientBuffer) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (_ambientNode) {
      fadeGain(_ambientNode.gainNode, 0, 500);
      setTimeout(() => { try { _ambientNode.source.stop(); } catch(e) {} }, 600);
    }
    _ambientNode = playBuffer(_ambientBuffer, false, 0, _masterGain); // NOT looping
    if (_ambientNode) {
      fadeGain(_ambientNode.gainNode, _ambientVolume, fade ? 2000 : 200);
      // When this play ends, schedule silence then replay
      const durationMs = _ambientBuffer.duration * 1000;
      _ambientSilenceTimer = setTimeout(() => {
        // Silence gap: 18–35 seconds
        const silenceMs = 18000 + Math.random() * 17000;
        if (_ambientNode) fadeGain(_ambientNode.gainNode, 0, 1500);
        _ambientSilenceTimer = setTimeout(() => {
          _playAmbientOnce(true);
        }, silenceMs);
      }, durationMs - 1500); // start fading 1.5s before end
    }
  }

  async function playAmbient(roomId) {
    resume();
    const ctx = getCtx();
    if (!ctx) return;

    const isCompact = roomId && roomId.startsWith('c');
    _clearAmbientTimers();

    // Only reload buffer if switching Estate ↔ Compact
    if (!_ambientBuffer || isCompact !== _ambientIsCompact) {
      _ambientIsCompact = isCompact;
      const ambientUrl = isCompact
        ? `${ASSET_BASE}audio/nocturne-ambient-compact.ogg`
        : `${ASSET_BASE}audio/nocturne-ambient-estate.ogg`;
      try {
        _ambientBuffer = await loadAudio(ambientUrl);
      } catch(e) { return; }
    }

    _playAmbientOnce(true);
  }

  // ── TUNNEL TRANSITION — 30 seconds D minor → F major ──────
  async function playTunnelTransition() {
    resume();
    const ctx = getCtx();
    if (!ctx) return;

    // Movement I — Estate ambient fades over 3 seconds (stone absorbs sound)
    if (_ambientNode) {
      fadeGain(_ambientNode.gainNode, 0, 3000);
      setTimeout(() => {
        try { if (_ambientNode) _ambientNode.source.stop(); } catch(e) {}
        _ambientNode = null;
      }, 3200);
    }

    // Movement II — Tunnel music loads (D minor, stone echo, single lantern crackle)
    // Seconds 0-30: D minor drone, barely audible, builds
    const tunnelUrl = `${ASSET_BASE}audio/nocturne-music-tunnel.ogg`;
    try {
      const buffer = await loadAudio(tunnelUrl);
      _musicNode = playBuffer(buffer, false, 0, _masterGain);
      if (_musicNode) {
        // Start silent
        _musicNode.gainNode.gain.value = 0;
        // Fade in over first 8 seconds
        fadeGain(_musicNode.gainNode, 0.2, 8000);
        // Peak at 15 seconds
        setTimeout(() => fadeGain(_musicNode.gainNode, 0.35, 5000), 15000);
        // Begin F major shift at 22 seconds — warmth enters
        setTimeout(() => fadeGain(_musicNode.gainNode, 0.25, 8000), 22000);
      }
    } catch(e) { /* Silent tunnel — still works */ }

    // Movement III — At 27 seconds: warmth starts (Compact ambient begins low)
    setTimeout(async () => {
      const compactUrl = `${ASSET_BASE}audio/nocturne-ambient-compact.ogg`;
      try {
        const buffer = await loadAudio(compactUrl);
        const node = playBuffer(buffer, true, 0, _masterGain);
        if (node) {
          node.gainNode.gain.value = 0;
          fadeGain(node.gainNode, 0.08, 3000); // barely there at tunnel end
          _ambientNode = node; // becomes the new ambient
        }
      } catch(e) {}
    }, 27000);
  }

  // ── COMPACT ARRIVAL — Chopin fires once, never again ───────
  async function playChopin() {
    if (_chopinPlaying) return;
    _chopinPlaying = true;
    resume();
    const ctx = getCtx();

    // Compact ambient rises as Chopin begins
    if (_ambientNode) fadeGain(_ambientNode.gainNode, 0.03, 2000); // quieter under piano

    if (!ctx) {
      if (typeof triggerArchivistScene === 'function') triggerArchivistScene();
      return;
    }

    const url = `${ASSET_BASE}audio/nocturne-music-chopin-op55-no1.ogg`;
    try {
      const buffer = await loadAudio(url);
      _chopinNode = playBuffer(buffer, false, 0, _masterGain);
      if (_chopinNode) {
        // Begins almost inaudible — player discovers it
        _chopinNode.gainNode.gain.value = 0.06;
        // Rises to 15% over 8 seconds — the room comes alive
        fadeGain(_chopinNode.gainNode, 0.15, 8000);

        // Trigger Archivist scene — he's already playing when you arrive
        setTimeout(() => {
          if (typeof triggerArchivistScene === 'function') triggerArchivistScene();
        }, 800);

        // Chopin ends naturally — don't loop, don't restart
        // When it ends: ambient rises back
        _chopinNode.source.onended = () => {
          _chopinNode = null;
          if (_ambientNode) fadeGain(_ambientNode.gainNode, 0.15, 3000);
        };
      }
    } catch(e) {
      if (typeof triggerArchivistScene === 'function') triggerArchivistScene();
    }
  }

  function fadeChopin() {
    if (!_chopinNode) return;
    fadeGain(_chopinNode.gainNode, 0, 3000);
    setTimeout(() => {
      try { if (_chopinNode) _chopinNode.source.stop(); } catch(e) {}
      _chopinNode = null;
      // Compact ambient rises as Chopin fades
      if (_ambientNode) fadeGain(_ambientNode.gainNode, 0.15, 2000);
    }, 3200);
  }

  // ── ELARA'S LETTER — single sustained violin ───────────────
  // Warm. High. Sustains while letter is open. Fades on close.
  let _elaraNode = null;

  async function playElaraViolin() {
    resume();
    const ctx = getCtx();
    if (!ctx) return;
    const url = `${ASSET_BASE}audio/nocturne-sfx-elara-letter.ogg`;
    try {
      const buffer = await loadAudio(url);
      _elaraNode = playBuffer(buffer, true, 0, _masterGain); // loop while open
      if (_elaraNode) {
        _elaraNode.gainNode.gain.value = 0;
        fadeGain(_elaraNode.gainNode, 0.18, 1500); // warm fade in
      }
    } catch(e) {}
  }

  function fadeElaraViolin() {
    if (!_elaraNode) return;
    fadeGain(_elaraNode.gainNode, 0, 2000);
    setTimeout(() => {
      try { if (_elaraNode) _elaraNode.source.stop(); } catch(e) {}
      _elaraNode = null;
    }, 2200);
  }

  // ── VAULT SILENCE ──────────────────────────────────────────
  function dropAmbientForVault() {
    // Vault: ambient drops 30% — room holds its breath
    if (_ambientNode) fadeGain(_ambientNode.gainNode, _ambientVolume * 0.7, 2000);
  }

  function restoreAmbientFromVault() {
    // Vault opens: silence breaks, room breathes again
    if (_ambientNode) fadeGain(_ambientNode.gainNode, _ambientVolume, 2000);
  }

  // ── DEEP NIGHT ─────────────────────────────────────────────
  function dropAmbientDeepNight() {
    // 2-6AM: ambient drops to 5% — near silence, building at its most still
    if (_ambientNode) fadeGain(_ambientNode.gainNode, 0.05, 5000);
  }

  // ── SFX ────────────────────────────────────────────────────
  async function playSFX(name, volume) {
    resume();
    const ctx = getCtx();
    if (!ctx) return;
    const url = `${ASSET_BASE}audio/${name}.ogg`;
    try {
      const buffer = await loadAudio(url);
      playBuffer(buffer, false, volume || 0.6, _masterGain);
    } catch(e) { /* No SFX — silent */ }
  }

  // ── TRAIN AMBIENCE ─────────────────────────────────────
  // Synthesised train: low engine rumble + rhythmic wheel clickety-clack
  // Starts when train sequence begins. Fades on scene change to foyer.
  let _trainAmbientNode = null;
  let _trainRumbleTimer = null;
  let _trainActive = false;

  async function startTrainAmbience() {
    getCtx();
    await resume();
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch(e) {}
    }
    if (ctx.state !== 'running') return;

    _trainActive = true;

    // ── LAYER 1 — DEEP ENGINE RUMBLE ──────────────────────
    // Three oscillators detuned for thickness — diesel locomotive character
    const rumbleOsc1 = ctx.createOscillator();
    const rumbleOsc2 = ctx.createOscillator();
    const rumbleOsc3 = ctx.createOscillator();
    const rumbleFilter = ctx.createBiquadFilter();
    const rumbleGain = ctx.createGain();

    rumbleOsc1.type = 'sawtooth'; rumbleOsc1.frequency.value = 42;
    rumbleOsc2.type = 'sawtooth'; rumbleOsc2.frequency.value = 47;
    rumbleOsc3.type = 'sine';     rumbleOsc3.frequency.value = 28; // sub-bass presence

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 140;
    rumbleFilter.Q.value = 0.6;

    rumbleOsc1.connect(rumbleFilter);
    rumbleOsc2.connect(rumbleFilter);
    rumbleOsc3.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(_masterGain);
    rumbleGain.gain.value = 0;
    rumbleOsc1.start(); rumbleOsc2.start(); rumbleOsc3.start();
    rumbleGain.gain.setTargetAtTime(0.06, ctx.currentTime, 2.5); // was 0.14

    // ── LAYER 2 — WHEEL RHYTHM ────────────────────────────
    // Authentic rail joint rhythm — pairs of clicks, slight swing
    // British steam-era spacing: approximately every 3.2 seconds at speed
    let _clickLoop = null;
    let _clickQuiet = false;

    function _fireWheelClick(volume, pitch) {
      const ctx2 = getCtx();
      if (!ctx2 || !_trainActive) return;

      // Noise burst — the actual impact
      const bufSize = Math.floor(ctx2.sampleRate * 0.055);
      const buf = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        // Exponential decay — sharp attack, quick die-off
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.8);
      }
      const noise = ctx2.createBufferSource();
      noise.buffer = buf;

      // Bandpass — mid-range clunk, not tinny
      const clickFilter = ctx2.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.value = pitch || 220;
      clickFilter.Q.value = 0.9;

      // Second filter — low shelf adds body to the impact
      const bodyFilter = ctx2.createBiquadFilter();
      bodyFilter.type = 'lowshelf';
      bodyFilter.frequency.value = 180;
      bodyFilter.gain.value = 6;

      const clickGain = ctx2.createGain();
      clickGain.gain.value = volume;

      noise.connect(clickFilter);
      clickFilter.connect(bodyFilter);
      bodyFilter.connect(clickGain);
      clickGain.connect(_masterGain);
      noise.start();
    }

    function scheduleWheelPair() {
      if (!_trainActive) return;
      const vol = _clickQuiet ? 0.01 : 0.09; // was 0.03 / 0.22

      // First bogie
      _fireWheelClick(vol, 210);
      // Second bogie 95-115ms later — slight variation per pass
      setTimeout(() => {
        if (!_trainActive) return;
        _fireWheelClick(vol * 0.78, 195 + Math.random() * 30);
      }, 95 + Math.random() * 20);

      // Occasional third echo — carriage coupling rattle
      if (Math.random() > 0.65) {
        setTimeout(() => {
          if (!_trainActive) return;
          _fireWheelClick(vol * 0.28, 320 + Math.random() * 80);
        }, 180 + Math.random() * 60);
      }

      // Next pair: 2.8–4.0 seconds — slight swing, not metronomic
      const gap = 2800 + Math.random() * 1200;
      _clickLoop = setTimeout(scheduleWheelPair, gap);
    }

    scheduleWheelPair();

    // ── LAYER 3 — CARRIAGE CREAK ──────────────────────────
    // Occasional low wooden groan — the carriage flexing on curves
    let _creakTimer = null;

    function _fireCarriageCreak() {
      const ctx2 = getCtx();
      if (!ctx2 || !_trainActive) return;

      const osc = ctx2.createOscillator();
      const gainNode = ctx2.createGain();
      const filter = ctx2.createBiquadFilter();

      // Wood creak — FM-style frequency wobble
      osc.type = 'sine';
      const baseFreq = 180 + Math.random() * 120;
      osc.frequency.setValueAtTime(baseFreq, ctx2.currentTime);
      osc.frequency.linearRampToValueAtTime(
        baseFreq * (0.85 + Math.random() * 0.3),
        ctx2.currentTime + 0.4 + Math.random() * 0.6
      );

      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 2.0;

      gainNode.gain.setValueAtTime(0, ctx2.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.015 + Math.random() * 0.01, ctx2.currentTime + 0.12); // was 0.035
      gainNode.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.5 + Math.random() * 0.8);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(_masterGain);
      osc.start(ctx2.currentTime);
      osc.stop(ctx2.currentTime + 1.5);
    }

    function scheduleCreak() {
      if (!_trainActive) return;
      const wait = 8000 + Math.random() * 18000;
      _creakTimer = setTimeout(() => {
        if (!_trainActive) return;
        _fireCarriageCreak();
        scheduleCreak();
      }, wait);
    }
    scheduleCreak();

    // ── LAYER 4 — WIND RUSH ───────────────────────────────
    // Continuous high-frequency noise — air moving past the carriage
    const windBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const windData = windBuf.getChannelData(0);
    for (let i = 0; i < windData.length; i++) windData[i] = Math.random() * 2 - 1;

    const windSrc = ctx.createBufferSource();
    windSrc.buffer = windBuf;
    windSrc.loop = true;

    const windFilter1 = ctx.createBiquadFilter();
    windFilter1.type = 'highpass';
    windFilter1.frequency.value = 2800;
    windFilter1.Q.value = 0.5;

    const windFilter2 = ctx.createBiquadFilter();
    windFilter2.type = 'lowpass';
    windFilter2.frequency.value = 6000;

    const windGain = ctx.createGain();
    windGain.gain.value = 0;

    windSrc.connect(windFilter1);
    windFilter1.connect(windFilter2);
    windFilter2.connect(windGain);
    windGain.connect(_masterGain);
    windSrc.start();
    windGain.gain.setTargetAtTime(0.02, ctx.currentTime, 3); // was 0.055

    // ── LAYER 5 — DISTANT STEAM HISS (occasional) ─────────
    // Periodic pressure release — the locomotive breathing
    let _steamTimer = null;

    function _fireSteamHiss() {
      const ctx2 = getCtx();
      if (!ctx2 || !_trainActive) return;

      const bufSize = ctx2.sampleRate * (0.8 + Math.random() * 1.2);
      const buf = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      const src = ctx2.createBufferSource();
      src.buffer = buf;

      const hp = ctx2.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 1800;

      const lp = ctx2.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 5000;

      const g = ctx2.createGain();
      const duration = buf.duration;
      g.gain.setValueAtTime(0, ctx2.currentTime);
      g.gain.linearRampToValueAtTime(0.04, ctx2.currentTime + 0.08);
      g.gain.linearRampToValueAtTime(0.025, ctx2.currentTime + duration * 0.5);
      g.gain.linearRampToValueAtTime(0, ctx2.currentTime + duration);

      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(_masterGain);
      src.start();
    }

    function scheduleSteam() {
      if (!_trainActive) return;
      const wait = 15000 + Math.random() * 35000;
      _steamTimer = setTimeout(() => {
        if (!_trainActive) return;
        _fireSteamHiss();
        scheduleSteam();
      }, wait);
    }
    scheduleSteam();

    // ── PERIODIC VOLUME DIPS — train passes through cuttings ─
    let _dipTimer = null;
    function scheduleDip() {
      if (!_trainActive) return;
      const waitMs = 20000 + Math.random() * 25000;
      _dipTimer = setTimeout(() => {
        if (!_trainActive) return;
        const dipDuration = 3000 + Math.random() * 6000;
        // Sound muffles in a cutting — rumble drops, wind too
        rumbleGain.gain.setTargetAtTime(0.015, ctx.currentTime, 1.0);
        windGain.gain.setTargetAtTime(0.005, ctx.currentTime, 1.0);
        _clickQuiet = true;
        setTimeout(() => {
          if (!_trainActive) return;
          rumbleGain.gain.setTargetAtTime(0.06, ctx.currentTime, 1.5);
          windGain.gain.setTargetAtTime(0.02, ctx.currentTime, 1.5);
          _clickQuiet = false;
          scheduleDip();
        }, dipDuration);
      }, waitMs);
    }
    scheduleDip();

    _trainAmbientNode = {
      stop: () => {
        _trainActive = false;
        clearTimeout(_clickLoop);
        clearTimeout(_creakTimer);
        clearTimeout(_dipTimer);
        clearTimeout(_steamTimer);
        rumbleGain.gain.setTargetAtTime(0, ctx.currentTime, 2.0);
        windGain.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
        setTimeout(() => {
          try { rumbleOsc1.stop(); rumbleOsc2.stop(); rumbleOsc3.stop(); windSrc.stop(); } catch(e) {}
        }, 5000);
      }
    };
  }

  // ── TRAIN DEPARTURE — station sounds ──────────────────────
  // Fires once at the very start of the sequence before movement begins
  async function playTrainDeparture() {
    const ctx = getCtx();
    if (!ctx) return;

    // Guard's whistle — synthesised
    function _whistle(freq, duration, gain) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const vib = ctx.createOscillator(); // vibrato LFO
      const vibGain = ctx.createGain();

      vib.frequency.value = 6.5;
      vibGain.gain.value = freq * 0.012;
      vib.connect(vibGain);
      vibGain.connect(osc.frequency);

      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.04);
      g.gain.setValueAtTime(gain, ctx.currentTime + duration - 0.08);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      osc.connect(g); g.connect(_masterGain);
      vib.start(); osc.start();
      vib.stop(ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    }

    // Short blast — guard's whistle
    _whistle(2800, 0.35, 0.18);
    // Second harmonic gives it body
    setTimeout(() => _whistle(5600, 0.28, 0.06), 0);

    // 1.2s later — longer departing whistle from the locomotive
    setTimeout(() => {
      _whistle(1900, 0.9, 0.22);
      setTimeout(() => _whistle(3800, 0.7, 0.07), 0);
    }, 1200);

    // Platform noise — brief crowd murmur (pink noise burst)
    const platBuf = ctx.createBuffer(1, ctx.sampleRate * 2.5, ctx.sampleRate);
    const platData = platBuf.getChannelData(0);
    for (let i = 0; i < platData.length; i++) platData[i] = Math.random() * 2 - 1;
    const platSrc = ctx.createBufferSource();
    platSrc.buffer = platBuf;
    const platFilter = ctx.createBiquadFilter();
    platFilter.type = 'bandpass'; platFilter.frequency.value = 800; platFilter.Q.value = 0.4;
    const platGain = ctx.createGain();
    platGain.gain.setValueAtTime(0.06, ctx.currentTime);
    platGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
    platSrc.connect(platFilter); platFilter.connect(platGain); platGain.connect(_masterGain);
    platSrc.start();
  }

  function stopTrainAmbience() {
    _trainActive = false;
    if (_trainAmbientNode) {
      _trainAmbientNode.stop();
      _trainAmbientNode = null;
    }
    _stopTrainRumble();
  }


  // 1 — departure (2s after sequence starts)
  // 2 — mid-journey, Car 2 (25s in)
  // 3 — pulling into station (fires from gateSceneShown)
  function _scheduleTrainRumble() {
    if (!_trainActive) return;
    // Moment 1 — departure thump
    _trainRumbleTimer = setTimeout(() => {
      if (!_trainActive) return;
      if (typeof haptic === 'function') haptic([120, 60, 120]);
      // Moment 2 — mid-journey
      _trainRumbleTimer = setTimeout(() => {
        if (!_trainActive) return;
        if (typeof haptic === 'function') haptic([80, 40, 80]);
      }, 23000);
    }, 2000);
  }

  function _stopTrainRumble() {
    clearTimeout(_trainRumbleTimer);
    _trainRumbleTimer = null;
  }

  // ── UI CLICK — synthesised, no file needed ─────────────────
  // Fires on every tap, button, checkbox, icon press
  // Warm dry transient — quality pen clicking on felt
  function playUIClick() {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 120;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.03);
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(hp); hp.connect(g); g.connect(_masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch(e) {}
  }


  const OUTDOOR_ROOMS = ['terrace', 'wine-cellar'];
  let _outdoorActive = false;
  let _outdoorNodes = [];
  let _cricketTimers = [];
  let _rainNode = null;
  let _rainActive = false;
  let _outdoorMasterGain = null; // single kill switch for all outdoor sounds

  let _rainStartTimer = null;

  function _stopOutdoor() {
    _outdoorActive = false;
    // Cancel any pending rain start
    if (_rainStartTimer) { clearTimeout(_rainStartTimer); _rainStartTimer = null; }
    // Clear all scheduled timers
    _cricketTimers.forEach(t => clearTimeout(t));
    _cricketTimers = [];
    // Disconnect master outdoor gain from audio graph IMMEDIATELY
    if (_outdoorMasterGain) {
      try { _outdoorMasterGain.disconnect(); } catch(e) {}
      _outdoorMasterGain = null;
    }
    // Stop looping source nodes
    _outdoorNodes.forEach(n => {
      try { n.source.stop(); } catch(e) {}
    });
    _outdoorNodes = [];
    // Stop rain
    if (_rainActive) stopRain();
  }

  function startOutdoorAmbient(withCrickets = false) {
    const ctx = getCtx();
    if (!ctx || _outdoorActive) return;
    _outdoorActive = true;

    // Master gain for ALL outdoor sounds — single kill switch
    _outdoorMasterGain = ctx.createGain();
    _outdoorMasterGain.gain.value = 1.0;
    _outdoorMasterGain.connect(_masterGain);

    // ── Night air texture ──────────────────────────────────
    const airBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const airData = airBuf.getChannelData(0);
    for (let i = 0; i < airData.length; i++) airData[i] = Math.random() * 2 - 1;
    const airSrc = ctx.createBufferSource();
    airSrc.buffer = airBuf; airSrc.loop = true;
    const airHp = ctx.createBiquadFilter();
    airHp.type = 'highpass'; airHp.frequency.value = 3800;
    const airLp = ctx.createBiquadFilter();
    airLp.type = 'lowpass'; airLp.frequency.value = 7500;
    const airGain = ctx.createGain();
    airGain.gain.value = 0;
    airSrc.connect(airHp); airHp.connect(airLp); airLp.connect(airGain);
    airGain.connect(_outdoorMasterGain); // → master outdoor gain, not _masterGain directly
    airSrc.start();
    airGain.gain.setTargetAtTime(0.018, ctx.currentTime, 2.5);
    _outdoorNodes.push({ source: airSrc, gain: airGain });

    // ── Cricket chorus + owl + rain — terrace only ─────────
    if (withCrickets) {
      // ── Cricket chorus ──────────────────────────────────
      function _fireCricket() {
        const ctx2 = getCtx();
        if (!ctx2 || !_outdoorActive || !_outdoorMasterGain) return;
        const freq = 3800 + Math.random() * 400;
        const pulseCount = 3 + Math.floor(Math.random() * 5);
        const pulseGap = 26 + Math.random() * 16;
        function _pulse(i) {
          if (!_outdoorActive || i >= pulseCount || !_outdoorMasterGain) return;
          const osc = ctx2.createOscillator();
          const g = ctx2.createGain();
          osc.type = 'sine'; osc.frequency.value = freq;
          g.gain.setValueAtTime(0, ctx2.currentTime);
          g.gain.linearRampToValueAtTime(0.025 + Math.random() * 0.015, ctx2.currentTime + 0.006);
          g.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.018);
          osc.connect(g); g.connect(_outdoorMasterGain);
          osc.start(); osc.stop(ctx2.currentTime + 0.022);
          _cricketTimers.push(setTimeout(() => _pulse(i + 1), pulseGap));
        }
        _pulse(0);
      }
      function scheduleCrickets() {
        if (!_outdoorActive) return;
        _fireCricket();
        _cricketTimers.push(setTimeout(scheduleCrickets, 600 + Math.random() * 2400));
      }
      _cricketTimers.push(setTimeout(scheduleCrickets, 2000));

      // ── Distant owl ──────────────────────────────────────
      function _fireOwl() {
        const ctx2 = getCtx();
        if (!ctx2 || !_outdoorActive || !_outdoorMasterGain) return;
        function _owlNote(freq, delayMs, dur) {
          _cricketTimers.push(setTimeout(() => {
            if (!_outdoorActive || !_outdoorMasterGain) return;
            const osc = ctx2.createOscillator();
            const vib = ctx2.createOscillator();
            const vibG = ctx2.createGain();
            const g = ctx2.createGain();
            vib.frequency.value = 5; vibG.gain.value = freq * 0.012;
            vib.connect(vibG); vibG.connect(osc.frequency);
            osc.type = 'sine'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0, ctx2.currentTime);
            g.gain.linearRampToValueAtTime(0.038, ctx2.currentTime + 0.15);
            g.gain.setValueAtTime(0.038, ctx2.currentTime + dur - 0.18);
            g.gain.linearRampToValueAtTime(0, ctx2.currentTime + dur);
            osc.connect(g); g.connect(_outdoorMasterGain);
            vib.start(); osc.start();
            vib.stop(ctx2.currentTime + dur);
            osc.stop(ctx2.currentTime + dur);
          }, delayMs));
        }
        _owlNote(375, 0, 0.65);
        _owlNote(308, 950, 0.85);
      }
      function scheduleOwl() {
        if (!_outdoorActive) return;
        _cricketTimers.push(setTimeout(() => {
          if (!_outdoorActive) return;
          _fireOwl();
          scheduleOwl();
        }, 45000 + Math.random() * 75000));
      }
      scheduleOwl();

      // ── Rain — controlled by 1/3 chance roll in roomEntered, not here ──
    }
  }

  // ── RAIN SYSTEM ────────────────────────────────────────────
  function startRain(intensity = 0.45) {
    const ctx = getCtx();
    if (!ctx || _rainActive) return;
    _rainActive = true;

    const rainBuf = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
    const d = rainBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = rainBuf; rainSrc.loop = true;

    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 600;
    const peak = ctx.createBiquadFilter(); peak.type = 'peaking';
    peak.frequency.value = 2200; peak.gain.value = 5; peak.Q.value = 0.65;

    const rainGain = ctx.createGain(); rainGain.gain.value = 0;
    rainSrc.connect(lp); lp.connect(hp); hp.connect(peak); peak.connect(rainGain);
    // Rain connects through outdoor master gain if active, otherwise direct
    const dest = (_outdoorMasterGain || _masterGain);
    rainGain.connect(dest);
    rainSrc.start();
    rainGain.gain.setTargetAtTime(intensity * 0.32, ctx.currentTime, 3.5);
    _rainNode = { source: rainSrc, gain: rainGain };

    function _fireThunder() {
      const ctx2 = getCtx();
      if (!ctx2 || !_rainActive) return;
      const dur = 1.5 + Math.random() * 2.5;
      const buf = ctx2.createBuffer(1, ctx2.sampleRate * dur, ctx2.sampleRate);
      const td = buf.getChannelData(0);
      for (let i = 0; i < td.length; i++) {
        const env = Math.sin((i / td.length) * Math.PI);
        td[i] = (Math.random() * 2 - 1) * env;
      }
      const src = ctx2.createBufferSource(); src.buffer = buf;
      const f = ctx2.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 140;
      const g = ctx2.createGain(); g.gain.value = 0.35 + Math.random() * 0.25;
      src.connect(f); f.connect(g);
      g.connect(_outdoorMasterGain || _masterGain);
      src.start();
    }

    function scheduleThunder() {
      if (!_rainActive) return;
      setTimeout(() => {
        if (!_rainActive) return;
        _fireThunder();
        scheduleThunder();
      }, 30000 + Math.random() * 90000);
    }
    scheduleThunder();
  }

  function stopRain() {
    _rainActive = false;
    if (_rainNode) {
      const ctx = getCtx();
      // Zero gain immediately — kills any buffered audio
      if (ctx && _rainNode.gain) {
        _rainNode.gain.gain.cancelScheduledValues(ctx.currentTime);
        _rainNode.gain.gain.setValueAtTime(0, ctx.currentTime);
      }
      try { _rainNode.source.stop(0); } catch(e) {}
      try { _rainNode.gain.disconnect(); } catch(e) {}
      _rainNode = null;
    }
  }

  // ── CELLAR DRIPS ───────────────────────────────────────────
  let _dripActive = false;
  let _dripTimers = [];
  let _dripGain = null;

  function startCellarDrips() {
    const ctx = getCtx();
    if (!ctx || _dripActive) return;
    _dripActive = true;

    _dripGain = ctx.createGain();
    _dripGain.gain.value = 1.0;
    _dripGain.connect(_masterGain);

    function _fireDrip() {
      const ctx2 = getCtx();
      if (!ctx2 || !_dripActive || !_dripGain) return;

      const bufSize = Math.floor(ctx2.sampleRate * 0.06);
      const buf = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 4);
      }
      const src = ctx2.createBufferSource();
      src.buffer = buf;

      const bp = ctx2.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 800 + Math.random() * 400;
      bp.Q.value = 2.5;

      const res = ctx2.createBiquadFilter();
      res.type = 'peaking';
      res.frequency.value = 1200;
      res.gain.value = 4;
      res.Q.value = 8;

      const g = ctx2.createGain();
      g.gain.value = 0.12 + Math.random() * 0.08;

      src.connect(bp); bp.connect(res); res.connect(g);
      g.connect(_dripGain);
      src.start();

      // Occasional puddle echo — second softer drop
      if (Math.random() > 0.55) {
        setTimeout(() => {
          if (!_dripActive || !_dripGain) return;
          const buf2 = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
          const d2 = buf2.getChannelData(0);
          for (let i = 0; i < bufSize; i++) d2[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 5);
          const src2 = ctx2.createBufferSource(); src2.buffer = buf2;
          const bp2 = ctx2.createBiquadFilter();
          bp2.type = 'bandpass'; bp2.frequency.value = 600 + Math.random() * 200; bp2.Q.value = 3;
          const g2 = ctx2.createGain(); g2.gain.value = 0.05 + Math.random() * 0.04;
          src2.connect(bp2); bp2.connect(g2); g2.connect(_dripGain);
          src2.start();
        }, 80 + Math.random() * 120);
      }
    }

    function scheduleDrip() {
      if (!_dripActive) return;
      const wait = 2000 + Math.random() * 6000; // 2–8 seconds between drips
      _dripTimers.push(setTimeout(() => {
        if (!_dripActive) return;
        _fireDrip();
        scheduleDrip();
      }, wait));
    }
    scheduleDrip();
  }

  function stopCellarDrips() {
    _dripActive = false;
    _dripTimers.forEach(t => clearTimeout(t));
    _dripTimers = [];
    if (_dripGain) {
      try { _dripGain.disconnect(); } catch(e) {}
      _dripGain = null;
    }
  }


  function _initSoundsInternal() {

    // Room ambient — Estate/Compact. Outdoor rooms get cricket layer on top.
    NocturneEngine.on('roomEntered', ({ roomId, hourWindow }) => {
      const isTerrace    = roomId === 'terrace';
      const isOutdoor    = isTerrace;

      // Wine cellar — dripping water, not outdoor ambient
      if (roomId === 'wine-cellar') {
        startCellarDrips();
      } else {
        stopCellarDrips();
      }

      if (isOutdoor) {
        if (!_outdoorActive) startOutdoorAmbient(isTerrace); // true = crickets
      } else {
        if (_outdoorActive) _stopOutdoor();
      }
      playAmbient(roomId);
      if (hourWindow === 'deep_night') dropAmbientDeepNight();

      // Terrace — 1 in 3 chance of rain; disables telescope hotspot if raining
      // Terrace rain audio — ambient.js owns the rain decision
      // Follow window._terraceRaining set by ambient.js
      if (isTerrace) {
        setTimeout(() => {
          if (window._terraceRaining && _outdoorActive) startRain(0.55);
        }, 400);
      }
    });

    // Tunnel — the signature moment
    NocturneEngine.on('tunnelEntered', () => {
      playTunnelTransition();
    });

    // Compact arrival — Chopin, once, never again
    NocturneEngine.on('compactUnlocked', () => {
      setTimeout(() => playChopin(), 2000); // brief pause before piano begins
    });

    // Chopin fades when player moves away from c1
    NocturneEngine.on('roomEntered', ({ roomId }) => {
      if (_chopinNode && roomId !== 'c1-arrival') fadeChopin();
    });

    // Elara's letter — violin sustains while open
    NocturneEngine.on('elaraLetterOpened', () => playElaraViolin());
    NocturneEngine.on('elaraLetterClosed', () => fadeElaraViolin());
    NocturneEngine.on('examinePanel_closed', () => fadeElaraViolin());

    // Vault — ambient drops, then breathes again
    NocturneEngine.on('vaultEntered',     () => dropAmbientForVault());
    NocturneEngine.on('vaultDoorOpened',  () => {
      restoreAmbientFromVault();
      playSFX('nocturne-sfx-vault-open', 0.5);
    });
    NocturneEngine.on('vaultOpened', () => {
      // Player's vault — heavier haptic, slightly different sound
      playSFX('nocturne-sfx-vault-open-player', 0.6);
    });

    // Hedge gap — the game doubles
    // Branches parting, faint wind, something on the other side
    // Then ambient drops — darker, the path ahead unknown
    NocturneEngine.on('hedgeGapFound', async () => {
      resume();
      const ctx = getCtx();

      // Estate ambient drops — the world just got larger
      if (_ambientNode) fadeGain(_ambientNode.gainNode, 0.04, 2000);

      // Branches parting SFX
      playSFX('nocturne-sfx-hedge-gap', 0.5);

      if (!ctx) return;

      // Single low sustained tone — almost subsonic
      // Something older. Something that was here before the Estate was.
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + 4);
      oscGain.gain.setValueAtTime(0, ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.2);
      oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5);
      osc.connect(oscGain);
      oscGain.connect(_masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 5.5);

      // Ambient returns — slightly darker than before
      setTimeout(() => {
        if (_ambientNode) fadeGain(_ambientNode.gainNode, _ambientVolume * 0.75, 4000);
      }, 5000);
    });

    // Wine rack / wine cellar — stone mechanism, cold descent
    // [0] — silence is the sensation
    NocturneEngine.on('wineRackOpen', async () => {
      resume();
      const ctx = getCtx();

      // Ambient cuts to silence
      if (_ambientNode) fadeGain(_ambientNode.gainNode, 0, 800);

      if (!ctx) return;

      // Stone mechanism — low rumble, fades as stairs are revealed
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.5);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 100; // deep stone only
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(_masterGain);
      noise.start(ctx.currentTime);

      // Cold underground silence settles — then ambient returns muted
      setTimeout(() => {
        if (_ambientNode) fadeGain(_ambientNode.gainNode, _ambientVolume * 0.45, 3000);
      }, 2500);
    });

    // SFX
    NocturneEngine.on('uiTap',                  () => playUIClick());
    NocturneEngine.on('itemCollected',          () => playSFX('nocturne-sfx-item-collect', 0.35));
    NocturneEngine.on('puzzleSolved',           () => playSFX('nocturne-sfx-puzzle-solve', 0.5));
    NocturneEngine.on('credibilityChanged',     () => playSFX('nocturne-sfx-credibility-strike', 0.25));
    NocturneEngine.on('ballroomApproachComplete', () => playSFX('nocturne-sfx-gavel-falls', 0.7));
    NocturneEngine.on('mapOpened',              () => playSFX('nocturne-sfx-map-open', 0.3));
    NocturneEngine.on('inventoryOpened',        () => playSFX('nocturne-sfx-inventory-open', 0.3));
    NocturneEngine.on('paywallCleared',         () => playSFX('nocturne-sfx-paywall-open', 0.5));
    NocturneEngine.on('deceptionUsed',          () => playSFX('nocturne-sfx-deception', 0.3));

    // Verdict — ambient cuts to silence, Estate holds its breath
    NocturneEngine.on('verdictBegin', () => {
      if (_ambientNode) fadeGain(_ambientNode.gainNode, 0, 1500);
    });

    NocturneEngine.on('trainSequenceStarted', async () => {
      getCtx();
      await resume();
      const ctx = getCtx();
      if (ctx && ctx.state === 'suspended') {
        try { await ctx.resume(); } catch(e) {}
      }
      // Train ambience starts immediately — no departure whistle on load
      startTrainAmbience();
      _scheduleTrainRumble();
    });

    NocturneEngine.on('trainSceneChanged', () => {
      // Only stop when leaving to foyer — keep going between train cars
    });

    NocturneEngine.on('trainSequenceEnded', () => {
      stopTrainAmbience();
      // Also cut gate audio if still playing
      if (_gateAmbientNode) {
        fadeGain(_gateAmbientNode.gainNode, 0, 800);
        setTimeout(() => {
          try { if (_gateAmbientNode) _gateAmbientNode.source.stop(); } catch(e) {}
          _gateAmbientNode = null;
        }, 900);
      }
    });

    // ── GATE AMBIENT — lux aeterna dark fog ───────────────
    let _gateAmbientNode = null;

    NocturneEngine.on('gateSceneShown', async () => {
      // Moment 3 — pulling into station
      if (typeof haptic === 'function') haptic([100, 50, 180]);
      // Force context creation synchronously — we're in a button click handler
      getCtx();
      await resume();
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state !== 'running') {
        try { await ctx.resume(); } catch(e) {}
      }

      // Stop train ambience at gate — silence before the fog
      stopTrainAmbience();

      // Try multiple paths — covers dev server subpath and production
      const urls = [
        `/nocturne-midnight-estate/audio/lux-aeterna-dark-fog-ambient-442531.mp3`,
        `/audio/lux-aeterna-dark-fog-ambient-442531.mp3`,
        `./audio/lux-aeterna-dark-fog-ambient-442531.mp3`,
        `${ASSET_BASE}audio/lux-aeterna-dark-fog-ambient-442531.mp3`,
      ];
      for (const url of urls) {
        try {
          const buffer = await loadAudio(url);
          _gateAmbientNode = playBuffer(buffer, true, 0, _masterGain);
          if (_gateAmbientNode) {
            _gateAmbientNode.gainNode.gain.value = 0;
            fadeGain(_gateAmbientNode.gainNode, 0.35, 3000);
          }
          break; // worked — stop trying
        } catch(e) {
          console.warn('Gate audio failed at', url, e.message || e);
        }
      }
    });

    NocturneEngine.on('gateSceneEnded', () => {
      if (_gateAmbientNode) {
        fadeGain(_gateAmbientNode.gainNode, 0, 800);
        setTimeout(() => {
          try { if (_gateAmbientNode) _gateAmbientNode.source.stop(); } catch(e) {}
          _gateAmbientNode = null;
        }, 900);
      }
    });

    // Resume on every interaction — AudioContext can re-suspend after backgrounding
    document.addEventListener('touchstart', () => resume());
    document.addEventListener('click',      () => resume());
  }

  return {
    _initSoundsInternal,
    playAmbient,
    playTunnelTransition,
    playChopin,
    fadeChopin,
    playElaraViolin,
    fadeElaraViolin,
    dropAmbientForVault,
    restoreAmbientFromVault,
    playSFX,
    playUIClick,
    resume,
    startTrainAmbience,
    stopTrainAmbience,
    playTrainDeparture,
    startOutdoorAmbient,
    startRain,
    stopRain,
  };
})();

function initSounds() {
  NocturneSound._initSoundsInternal();
}

window.NocturneSound = NocturneSound;
window.initSounds = initSounds;

// Self-initialize — runs after NocturneSound is fully assigned
initSounds();
