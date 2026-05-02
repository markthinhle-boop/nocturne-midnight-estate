// ============================================================
// NOCTURNE — ui.js
// All UI panels: examine, popup, inventory, stage, map, verdict
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// ── STATE ──────────────────────────────────────────────────
let _activeObjectId = null;
const _seenRoomDescriptions = new Set();
let _activePedestalId = null;
let _activeCharId = null;
Object.defineProperty(window, '_activeCharId', { get: () => _activeCharId });
let _slowDragObjectId = null;
let _slowDragComplete = false;
let _currentTab = 'estate';

// ── INIT ───────────────────────────────────────────────────
let _uiInitialized = false;
function initUI() {
  if (_uiInitialized) return;
  _uiInitialized = true;
  // Engine events → UI responses
  NocturneEngine.on('showPopup',           handleShowPopup);
  NocturneEngine.on('openExaminePanel',    handleOpenExaminePanel);
  NocturneEngine.on('openItemExaminePanel', handleOpenItemExaminePanel);
  NocturneEngine.on('openSlowDrag',        handleOpenSlowDrag);
  NocturneEngine.on('closeExaminePanel',   () => closeExaminePanel());
  NocturneEngine.on('openInlineDropSelector', handleOpenInlineDropSelector);
  NocturneEngine.on('closeInlineDropSelector', closeInlineDropSelector);
  NocturneEngine.on('itemEmergeAnimation', handleItemEmerge);
  NocturneEngine.on('inventoryChanged',    () => {
    updateInventoryCounter();
    // Re-render inventory grid if open to update glows
    const panel = document.getElementById('inventory-panel');
    if (panel && panel.classList.contains('open')) renderInventoryGrid();
  });
  NocturneEngine.on('itemDropped', handleItemDropped);
  // When item dropped, hide original room object hotspot
  NocturneEngine.on('itemDropped', ({ itemId, roomId }) => {
    const obj = window.ROOM_OBJECTS && Object.entries(window.ROOM_OBJECTS).find(([,o]) => o.item_id === itemId);
    if (obj) {
      const hs = document.getElementById(`hs-${obj[0]}`);
      if (hs) {
        hs.style.pointerEvents = 'none';
        // Hide entirely when dropped in origin room — prevents double dot
        if (obj[1].room === roomId) hs.style.display = 'none';
      }
    }
  });
  // When item collected back from the floor, re-enable original hotspot ONLY if it was dropped
  NocturneEngine.on('itemCollected', ({ itemId }) => {
    const wasDropped = document.getElementById(`hs-dropped-${itemId}`) !== null;
    if (!wasDropped) return; // picked up directly from object — leave hotspot hidden
    const obj = window.ROOM_OBJECTS && Object.entries(window.ROOM_OBJECTS).find(([,o]) => o.item_id === itemId);
    if (obj) {
      const hs = document.getElementById(`hs-${obj[0]}`);
      if (hs) {
        hs.style.pointerEvents = '';
        hs.style.display = '';
      }
    }
  });
  NocturneEngine.on('itemCollected',       () => updateInventoryCounter());
  NocturneEngine.on('itemCollected', ({ itemId }) => {
    if (window.ROOM_OBJECTS) {
      const entry = Object.entries(window.ROOM_OBJECTS).find(([,o]) => o.item_id === itemId);
      if (entry) {
        const hs = document.getElementById(`hs-${entry[0]}`);
        if (hs) {
          hs.classList.add('item-collected');
          hs.style.display = 'none';
          hs.style.pointerEvents = 'none';
        }
      }
    }
    // Remove dropped hotspot if this item was on the floor
    const droppedHs = document.getElementById(`hs-dropped-${itemId}`);
    if (droppedHs) droppedHs.remove();
    _renderingDropped.delete(itemId);
    // Record origin hotspot position for this item (always, from direct pickup)
    if (window.ROOM_OBJECTS && window.gameState) {
      const originEntry = Object.values(window.ROOM_OBJECTS).find(o => o.item_id === itemId);
      if (originEntry && originEntry.hotspot && originEntry.room) {
        _originPosMemory[itemId] = {
          pos: { left: originEntry.hotspot.left, top: originEntry.hotspot.top },
          room: originEntry.room,
        };
      }
    }
    // Remember slot + room so a re-drop in the same room restores position
    if (_dropSlots[itemId] !== undefined && _dropSlots[itemId] !== -1) {
      _dropSlotMemory[itemId] = {
        slot: _dropSlots[itemId],
        room: window.gameState ? window.gameState.currentRoom : null,
      };
    }
    delete _dropSlots[itemId];
    // Show deception item reminder on pickup
    const item = window.ITEMS && window.ITEMS[itemId];
    if (item && item.is_deception_item) {
      setTimeout(() => _showDeceptionItemReminder(itemId), 400);
    }
  });
  NocturneEngine.on('showDropTray',        handleShowDropTray);
  NocturneEngine.on('roomEntered',         handleRoomEntered);
  NocturneEngine.on('roomVisited',         handleRoomVisited);
  NocturneEngine.on('secretRoomRevealed',  handleSecretRoomRevealed);
  NocturneEngine.on('roomCompleted',       handleRoomCompleted);
  NocturneEngine.on('mapUpdate',           handleMapUpdate);
  NocturneEngine.on('mapRevealCompact',    revealCompactMap);
  NocturneEngine.on('allPedestalsFilled',  enableConfirmButton);
  NocturneEngine.on('pedestalsFilledMixed', () => {
    showToast('The evidence does not point to a single name. The three pedestals must agree.');
    const btn = document.getElementById('btn-confirm-accusation');
    if (btn) { btn.classList.remove('enabled'); btn.disabled = true; }
  });
  NocturneEngine.on('activateFourthPedestal', activateRecordPedestal);
  NocturneEngine.on('activateAccomplicePedestal', activateAccomplicePedestal);
  NocturneEngine.on('discoveryFired',      handleDiscoveryFired);
  NocturneEngine.on('combinationFailed',   handleCombinationFailed);
  NocturneEngine.on('partialDiscovery',    handlePartialDiscovery);
  NocturneEngine.on('openPuzzle',          handleOpenPuzzle);
  NocturneEngine.on('verdictDelivery',     handleVerdictDelivery);
  NocturneEngine.on('accusationCorrect',   handleAccusationCorrect);
  NocturneEngine.on('accusationWrongFinal', handleAccusationWrongFinal);
  NocturneEngine.on('essentialGlowOn',     ({objectId}) => setEssentialGlow(objectId, true));
  NocturneEngine.on('essentialGlowOff',    ({objectId}) => setEssentialGlow(objectId, false));
  NocturneEngine.on('vaultDoorOpened',     () => showToast('The Vault door opens.'));
  NocturneEngine.on('navigateAllowed',     ({ roomId }) => {
    setTimeout(() => {
      navigateTo(roomId);
      renderCurrentRoom();
      renderRoomNav();
    }, 400); // brief delay so momentReveal text lands first
  });
  NocturneEngine.on('vaultDoorLocked',     ({message}) => showToast(message));
  NocturneEngine.on('vaultCaseLocked',     ({message}) => showToast(message));
  NocturneEngine.on('vaultSafeLocked',     ({message}) => showToast(message));
  NocturneEngine.on('vaultSafeAlreadyOpen',() => showToast('The shelf is already open. The documents are in your inventory.'));
  NocturneEngine.on('wineRackOpen',        () => showToast('Stone stairs descend into darkness.'));
  NocturneEngine.on('tunnelDoorLocked',    ({message}) => showToast(message));
  NocturneEngine.on('characterAvailable',  handleCharacterAvailable);
  NocturneEngine.on('deceptionResponse',   handleDeceptionResponse);
  NocturneEngine.on('credibilityChanged',  handleCredibilityChanged);
  NocturneEngine.on('composureChanged',    ({ charId }) => {
    if (_activeCharId === charId) updateComposureLabel(charId);
  });

  // Gallery token appeared — ashworth-seal silently added to inventory.
  // No prompt. No blackout. No missing time. Just update the counter.
  // The room description carries the atmosphere. Trust the writing.
  NocturneEngine.on('galleryTokenAppeared', () => {
    updateInventoryCounter();
  });
}

// ── SCREEN MANAGEMENT ──────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  const s = document.getElementById(id);
  if (s) {
    // rAF ensures the browser registers the removal before adding active
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        s.classList.add('active');
      });
    });
  }
}

// ── TOAST ──────────────────────────────────────────────────
let _toastTimeout;
function showToast(message) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(10,10,10,0.95);border:1px solid var(--border);padding:10px 20px;font-size:12px;color:var(--cream-dim);z-index:100;letter-spacing:0.05em;text-align:center;max-width:280px;pointer-events:none;opacity:0;transition:opacity 200ms;';
    document.body.appendChild(t);
  }
  clearTimeout(_toastTimeout);
  t.textContent = message;
  t.style.opacity = '1';
  _toastTimeout = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ── ROOM EVENTS ────────────────────────────────────────────
function handleRoomEntered({ roomId, hourWindow }) {
  // Suppress all standard UI during train sequence
  const isTrain = roomId.startsWith('train-');

  const body = document.body;
  body.className = body.className.replace(/hour-\w+/g, '');
  if (!isTrain) body.classList.add(`hour-${hourWindow}`);

  // Room description — suppressed on train, shown only on first visit per session
  if (!isTrain) {
    const roomDesc = window.ROOM_DESCRIPTIONS && window.ROOM_DESCRIPTIONS[roomId];
    if (roomDesc && !_seenRoomDescriptions.has(roomId)) {
      _seenRoomDescriptions.add(roomId);
      const el = document.getElementById('room-description-text');
      if (el) {
        el.textContent = roomDesc;
        const tapHint = document.createElement('div');
        tapHint.style.cssText = 'margin-top:16px;font-size:9px;color:rgba(100,90,70,0.45);letter-spacing:0.2em;text-transform:uppercase;font-family:var(--font-ui);text-align:center;';
        tapHint.textContent = 'Tap to continue';
        el.appendChild(tapHint);
      }
      const panel = document.getElementById('room-description');
      if (panel) {
        panel.classList.remove('visible');
        setTimeout(() => panel.classList.add('visible'), 400);
        setTimeout(() => {
          const _dismiss = () => {
            panel.classList.remove('visible');
            document.removeEventListener('click', _dismiss, true);
          };
          document.addEventListener('click', _dismiss, true);
        }, 600);
      }
    }
  }

  // Top bar — hidden during train
  const topBar = document.getElementById('top-bar');
  if (topBar) topBar.style.display = isTrain ? 'none' : '';

  // Room nav — hidden during train
  const roomNav = document.getElementById('room-nav');
  if (roomNav) roomNav.style.display = isTrain ? 'none' : '';

  updateInventoryCounter();
}

function handleRoomVisited({ roomId }) {
  updateMapRoom(roomId);
  if (roomId.startsWith('c')) _revealCompactCorridorsIfReady();
}
function handleSecretRoomRevealed({ roomId }) { updateMapRoom(roomId); }
function handleRoomCompleted({ roomId }) { updateMapRoom(roomId); }

// ROOM_DESCRIPTIONS lives in manor.js — accessed via window.ROOM_DESCRIPTIONS

// ── POPUP ──────────────────────────────────────────────────
function handleShowPopup({ objectId, tapX, tapY, alreadyHave }) {
  // Hotspots neutered until player enters the antechamber
  if (!gameState.antechamberGateOpen) return;
  _activeObjectId = objectId;
  const popup = document.getElementById('tap-popup');
  const examineBtn = document.getElementById('popup-examine');
  const pickupBtn  = document.getElementById('popup-pickup');
  const dropBtn    = document.getElementById('popup-drop');

  if (alreadyHave) {
    examineBtn.style.display = 'block';
    pickupBtn.style.display  = 'none';
    dropBtn.style.display    = 'block';
  } else {
    examineBtn.style.display = 'block';
    pickupBtn.style.display  = 'block';
    dropBtn.style.display    = 'none';
  }

  // Position near tap — account for #app offset on desktop
  const appRect = document.getElementById('app')?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth };
  const left = Math.min(tapX, appRect.left + appRect.width - 160);
  const top  = Math.max(tapY - 80, appRect.top + 60);
  popup.style.left = `${left}px`;
  popup.style.top  = `${top}px`;
  popup.classList.add('visible');

  // Close on outside tap
  setTimeout(() => {
    document.addEventListener('touchstart', closePopupOnOutside, { once: true });
    document.addEventListener('click', closePopupOnOutside, { once: true });
  }, 100);
}

function closePopupOnOutside(e) {
  const popup = document.getElementById('tap-popup');
  if (!popup.contains(e.target)) closePopup();
}

function closePopup() {
  document.getElementById('tap-popup').classList.remove('visible');
}

function handlePopupExamine() {
  closePopup();
  if (_activeObjectId) {
    if (_activeObjectId.startsWith('dropped-')) {
      const itemId = _activeObjectId.replace('dropped-', '');
      _openDroppedItemExamine(itemId);
      return;
    }
    handleOpenExaminePanel({ objectId: _activeObjectId });
  }
}

function _openDroppedItemExamine(itemId) {
  const item = window.ITEMS && window.ITEMS[itemId];
  if (!item) return;
  const text = item.examine_1 || item.name;
  document.getElementById('examine-text').textContent = text;
  const visual = document.getElementById('examine-visual');
  const thumbUrl = typeof getItemThumb === 'function'
    ? getItemThumb(itemId)
    : `${ASSET_BASE}items/nocturne-item-${itemId}.png`;
  visual.innerHTML = `<img src="${thumbUrl}" onerror="this.style.display='none'" alt="" style="max-height:80px;max-width:100%;">`;
  document.getElementById('examine-more').style.display = 'none';
  // Show pick up + close, no drop (it's already dropped)
  document.getElementById('btn-examine-keep').style.display = 'block';
  document.getElementById('btn-examine-keep').textContent = 'PICK UP';
  document.getElementById('btn-examine-keep').onclick = () => {
    collectItem(itemId);
    NocturneEngine.emit('itemEmergeAnimation', { itemId });
    const hs = document.getElementById(`hs-dropped-${itemId}`);
    if (hs) hs.remove();
    NocturneEngine.emit('closeExaminePanel', {});
  };
  document.getElementById('btn-examine-drop').style.display = 'none';
  document.getElementById('btn-examine-close').style.display = 'block';
  document.getElementById('examine-panel').classList.add('open');
}

function handlePopupPickUp() {
  closePopup();
  if (_activeObjectId) {
    if (_activeObjectId.startsWith('dropped-')) {
      const itemId = _activeObjectId.replace('dropped-', '');
      // Call collectItem directly — item was already owned, bypass full check
      collectItem(itemId);
      NocturneEngine.emit('itemEmergeAnimation', { itemId });
      const hs = document.getElementById(`hs-dropped-${itemId}`);
      if (hs) hs.remove();
      return;
    }
    const obj = ROOM_OBJECTS[_activeObjectId];
    if (obj && obj.item_id) handlePickUp(obj.item_id);
  }
}

function handlePopupDrop() {
  closePopup();
  if (_activeObjectId) {
    const obj = ROOM_OBJECTS[_activeObjectId];
    if (obj && obj.item_id) {
      dropItem(obj.item_id);
      NocturneEngine.emit('closeExaminePanel', {});
    }
  }
}

// ── EXAMINE PANEL ──────────────────────────────────────────
function handleOpenExaminePanel({ objectId }) {
  _activeObjectId = objectId;
  const obj = ROOM_OBJECTS[objectId];
  if (!obj) return;

  const taps     = gameState.object_taps[objectId] || 0;
  const maxDepth = getObjectMaxDepth(obj);
  const text     = obj[`tap_${Math.min(taps + 1, maxDepth)}`] || obj.tap_1;
  const hasMore  = (taps + 1) < maxDepth;
  const alreadyHave = obj.item_id && hasItem(obj.item_id);
  const producesItem = obj.item_id && !alreadyHave;
  const examineOnly = !obj.item_id;

  // Increment taps
  gameState.object_taps[objectId] = taps + 1;
  if (!gameState.examined_objects.includes(objectId)) {
    gameState.examined_objects.push(objectId);
  }

  // Set content
  document.getElementById('examine-text').textContent = text;

  const visual = document.getElementById('examine-visual');
  if (obj.item_id) {
    const thumbUrl = typeof getItemThumb === 'function'
      ? getItemThumb(obj.item_id)
      : `${ASSET_BASE}items/nocturne-item-${obj.item_id}.png`;
    visual.innerHTML = `<img src="${thumbUrl}" onerror="this.style.display='none'" alt="" style="max-height:80px;max-width:100%;">`;
  } else if (typeof PROP_ASSET_MAP !== 'undefined' && PROP_ASSET_MAP[objectId]) {
    const propUrl = `${ASSET_BASE}${PROP_ASSET_MAP[objectId]}`;
    visual.innerHTML = `<img src="${propUrl}" onerror="this.style.display='none'" alt="" style="max-height:80px;max-width:100%;opacity:0.7;">`;
  } else {
    visual.innerHTML = '';
  }

  const moreEl = document.getElementById('examine-more');
  moreEl.style.display = hasMore ? 'block' : 'none';

  // Buttons
  const keepBtn  = document.getElementById('btn-examine-keep');
  const dropBtn  = document.getElementById('btn-examine-drop');
  const closeBtn = document.getElementById('btn-examine-close');

  if (examineOnly) {
    keepBtn.style.display  = 'none';
    dropBtn.style.display  = 'none';
    closeBtn.style.display = 'block';
  } else if (alreadyHave) {
    keepBtn.style.display  = 'none';
    dropBtn.style.display  = 'block';
    closeBtn.style.display = 'block';
  } else {
    keepBtn.style.display  = 'block';
    dropBtn.style.display  = 'block';
    closeBtn.style.display = 'none';
  }

  // Dying clue
  if (objectId === 'register' && taps >= 1) trackDyingClue(false);

  const _ep = document.getElementById('examine-panel');
  _ep.dataset.obj = objectId;
  _ep.classList.add('open');
}

function handleExamineMore() {
  if (_activeObjectId) {
    handleOpenExaminePanel({ objectId: _activeObjectId });
  }
}

function handleExamineKeep() {
  if (!_activeObjectId) return;
  const obj = ROOM_OBJECTS[_activeObjectId];
  if (obj && obj.item_id) handleKeep(obj.item_id);
}

function handleExamineDrop() {
  if (!_activeObjectId) return;
  const obj = ROOM_OBJECTS[_activeObjectId];
  if (obj && obj.item_id) {
    dropItem(obj.item_id);
    closeExaminePanel();
  }
}

function closeExaminePanel() {
  const closingObject = _activeObjectId;
  document.getElementById('examine-panel').classList.remove('open');
  _activeObjectId = null;
  NocturneEngine.emit('examinePanel_closed', {});
  // Vault panel: closing the examine panel IS the trigger — auto-descend to cellar
  if (closingObject === 'vault-panel' && !gameState._cellarMomentFired) {
    setTimeout(() => NocturneEngine.emit('vaultPanelTap', {}), 200);
  }
}

// ── INVENTORY ITEM EXAMINE PANEL ───────────────────────────
// Fires when player taps an inventory item twice. Shows depth text.
function handleOpenItemExaminePanel({ itemId, text, hasMore, taps }) {
  const item = ITEMS[itemId];
  if (!item) return;

  // Reuse examine panel — swap content for item mode
  document.getElementById('examine-text').textContent = text;

  const visual = document.getElementById('examine-visual');
  const thumbUrl = typeof getItemThumb === 'function'
    ? getItemThumb(itemId)
    : `${ASSET_BASE}items/nocturne-item-${itemId}.png`;
  visual.innerHTML = `<img src="${thumbUrl}" onerror="this.style.display='none'" alt="" style="max-height:80px;max-width:100%;opacity:0.85;">`;

  const moreEl = document.getElementById('examine-more');
  moreEl.style.display = hasMore ? 'block' : 'none';
  if (hasMore) {
    moreEl.textContent = 'Tap again to look closer.';
    moreEl.onclick = () => openItemExaminePanel(itemId);
  }

  // Item mode buttons — EXAMINE again or DROP
  const keepBtn  = document.getElementById('btn-examine-keep');
  const dropBtn  = document.getElementById('btn-examine-drop');
  const closeBtn = document.getElementById('btn-examine-close');

  keepBtn.style.display  = 'none';
  closeBtn.style.display = 'block';
  closeBtn.textContent   = 'Done';

  if (item.is_droppable) {
    dropBtn.style.display  = 'block';
    dropBtn.textContent    = 'DROP';
    dropBtn.onclick = () => {
      dropItem(itemId);
      closeExaminePanel();
      closeInventory();
    };
  } else {
    dropBtn.style.display = 'none';
  }

  // Set _activeObjectId to null — this is item mode not object mode
  _activeObjectId = null;

  document.getElementById('examine-panel').classList.add('open');
  closeInventory();
}

// ── INLINE DROP SELECTOR ───────────────────────────────────
function handleOpenInlineDropSelector({ incomingItemId, currentInventory }) {
  const panel = document.getElementById('drop-selector-panel');
  const grid  = document.getElementById('drop-selector-grid');
  const incoming = document.getElementById('drop-selector-incoming');

  grid.innerHTML = '';

  // Header
  const incomingItem = ITEMS[incomingItemId];
  incoming.innerHTML = '';
  const header = document.createElement('div');
  header.style.cssText = 'padding:12px 16px 8px;font-size:11px;color:var(--gold-dim);letter-spacing:0.15em;text-transform:uppercase;border-bottom:1px solid var(--border);';
  header.textContent = 'Inventory full. Drop one to continue.';
  incoming.appendChild(header);

  const incomingLabel = document.createElement('div');
  incomingLabel.style.cssText = 'padding:8px 16px 12px;font-size:13px;color:var(--cream);font-style:italic;';
  incomingLabel.textContent = `"${incomingItem ? incomingItem.name : incomingItemId}"`;
  incoming.appendChild(incomingLabel);

  // Inventory items — with thumbnail if available
  currentInventory.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item || !item.is_droppable) return; // ashworth-seal never droppable
    const card = document.createElement('div');
    card.className = 'drop-card';
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(42,37,32,0.5);cursor:pointer;';

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.style.cssText = 'width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;';
    const thumbUrl = typeof getItemThumb === 'function' ? getItemThumb(itemId) : '';
    if (thumbUrl) {
      thumb.innerHTML = `<img src="${thumbUrl}" style="max-width:32px;max-height:32px;object-fit:contain;" onerror="this.style.display='none'">`;
    }
    card.appendChild(thumb);

    // Name
    const name = document.createElement('div');
    name.style.cssText = 'flex:1;font-size:12px;color:var(--cream-dim);';
    name.textContent = item.name;
    card.appendChild(name);

    // Drop label
    const dropLabel = document.createElement('div');
    dropLabel.style.cssText = 'font-size:10px;color:var(--gold-dim);letter-spacing:0.1em;text-transform:uppercase;';
    dropLabel.textContent = 'DROP';
    card.appendChild(dropLabel);

    card.onclick = () => {
      card.style.opacity = '0.4';
      setTimeout(() => executeInlineDrop(itemId, incomingItemId), 200);
    };
    grid.appendChild(card);
  });

  // Leave It — don't collect, dismiss
  const leaveBtn = document.createElement('div');
  leaveBtn.style.cssText = 'padding:14px 16px;font-size:11px;color:var(--cream-dim);text-align:center;letter-spacing:0.1em;cursor:pointer;border-top:1px solid var(--border);';
  leaveBtn.textContent = 'Leave it. Continue investigating.';
  leaveBtn.onclick = closeInlineDropSelector;
  grid.appendChild(leaveBtn);

  panel.classList.add('open');
}

function closeInlineDropSelector() {
  document.getElementById('drop-selector-panel').classList.remove('open');
}

// ── ITEM EMERGE ANIMATION ─────────────────────────────────
function handleItemEmerge({ itemId }) {
  const bagIcon = document.getElementById('inventory-counter');
  if (!bagIcon) return;
  const rect = bagIcon.getBoundingClientRect();
  const emerge = document.getElementById('item-emerge');
  const panel  = document.getElementById('examine-panel');
  const panelRect = panel.getBoundingClientRect();

  emerge.style.left = `${panelRect.left + panelRect.width / 2 - 30}px`;
  emerge.style.top  = `${panelRect.top + 20}px`;
  emerge.style.width = '60px';
  emerge.style.height = '60px';
  emerge.style.setProperty('--emerge-x', `${rect.left - panelRect.left - 30}px`);
  emerge.style.setProperty('--emerge-y', `${rect.top - panelRect.top - 20}px`);
  emerge.style.background = 'var(--bg-surface)';
  emerge.style.border = '1px solid var(--gold-dim)';

  emerge.classList.remove('animating');
  void emerge.offsetWidth;
  emerge.classList.add('animating');

  setTimeout(() => {
    emerge.classList.remove('animating');
    // Bag pulse
    if (bagIcon) {
      bagIcon.style.transform = 'scale(1.2)';
      setTimeout(() => { bagIcon.style.transform = 'scale(1)'; }, 300);
    }
    updateInventoryCounter();
  }, 700);
}

// ── INVENTORY COUNTER ──────────────────────────────────────
function updateInventoryCounter() {
  const el  = document.getElementById('inventory-counter');
  if (!el) return;
  const count = gameState.inventory.length;
  const limit = inventoryLimit();
  el.textContent = `${count}/${limit}`;
  el.className = '';
  if (count >= limit) el.classList.add('red');
  else if (count >= limit - 2) el.classList.add('amber');
}

// ── INVENTORY PANEL ────────────────────────────────────────
function openInventory() {
  gameState._checkedItems = gameState._checkedItems || [];
  renderInventoryGrid();
  document.getElementById('inventory-panel').classList.add('open');
}

function closeInventory() {
  document.getElementById('inventory-panel').classList.remove('open');
  gameState.selectedItem = null;
  gameState._checkedItems = [];
}

function renderInventoryGrid() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';

  if (!gameState._checkedItems) gameState._checkedItems = [];

  if (gameState.inventory.length === 0) {
    grid.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:var(--text-dim);">Nothing collected yet.</div>';
    return;
  }

  // ── CHAIN GLOW — matching pairs glow same colour ───────────
  const CHAIN_COLORS = {
    'cipher-trigger':               '#b8860b', // dark gold
    'bond-reconstruction-trigger':  '#8b6b8b', // muted purple
    'chronology-trigger':           '#8b7355', // warm brown
    'bilateral-seal-trigger':       '#4a7a8a', // steel blue
    'correspondence-thread-trigger':'#8b4a4a', // muted red
    'ink-comparison-trigger':       '#7a7a5a', // olive
    'witness-map-trigger':          '#5a6a7a', // slate
    'ink-reveal-trigger':           '#7a5a6a', // mauve
  };

  // Build map of itemId → chain colour (only if both items in inventory)
  const itemGlowColor = {};
  (window.COMBINATION_CHAINS || []).forEach(chain => {
    if (gameState.fired_chains.includes(chain.id)) return;
    const hasA = gameState.inventory.includes(chain.item_a);
    const hasB = gameState.inventory.includes(chain.item_b);
    if (hasA && hasB) {
      const color = CHAIN_COLORS[chain.id] || '#888';
      itemGlowColor[chain.item_a] = color;
      itemGlowColor[chain.item_b] = color;
    }
  });

  gameState.inventory.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item) return;

    const div = document.createElement('div');
    div.className = 'inv-item';
    if (itemGlowColor[itemId]) {
      div.style.borderColor = itemGlowColor[itemId];
      div.style.boxShadow = `0 0 6px ${itemGlowColor[itemId]}88`;
    }

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'inv-checkbox';
    cb.checked = gameState._checkedItems.includes(itemId);
    cb.disabled = !cb.checked && gameState._checkedItems.length >= 2;
    cb.onclick = (e) => {
      e.stopPropagation();
      if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick();
      if (cb.checked) {
        if (gameState._checkedItems.length < 2) {
          gameState._checkedItems.push(itemId);
        }
      } else {
        gameState._checkedItems = gameState._checkedItems.filter(id => id !== itemId);
      }
      renderInventoryGrid();
    };

    const nameEl = document.createElement('div');
    nameEl.className = 'inv-name';
    nameEl.textContent = item.name;
    nameEl.onclick = () => openItemExaminePanel(itemId);

    const actions = document.createElement('div');
    actions.className = 'inv-actions';

    if (item.is_droppable) {
      const dropBtn = document.createElement('button');
      dropBtn.className = 'inv-action-btn drop-btn';
      dropBtn.textContent = 'DROP';
      dropBtn.onclick = (e) => {
        e.stopPropagation();
        gameState._checkedItems = gameState._checkedItems.filter(id => id !== itemId);
        dropItem(itemId);
        renderInventoryGrid();
      };
      actions.appendChild(dropBtn);
    }

    div.appendChild(cb);
    div.appendChild(nameEl);
    div.appendChild(actions);
    grid.appendChild(div);
  });

  // Formulate Puzzle button
  let formulateBtn = document.getElementById('formulate-puzzle-btn');
  if (!formulateBtn) {
    formulateBtn = document.createElement('button');
    formulateBtn.id = 'formulate-puzzle-btn';
    formulateBtn.style.cssText = `
      width:100%;margin-top:16px;padding:14px;
      background:transparent;border:1px solid var(--gold);
      color:var(--gold);font-family:var(--font-ui);
      font-size:10px;letter-spacing:0.25em;text-transform:uppercase;
      cursor:pointer;opacity:0.4;transition:opacity 300ms;
    `;
    formulateBtn.textContent = 'Formulate Puzzle';
    grid.parentElement.appendChild(formulateBtn);
  }

  const ready = gameState._checkedItems.length === 2;
  formulateBtn.style.opacity = ready ? '1' : '0.4';
  formulateBtn.disabled = !ready;
  formulateBtn.onclick = ready ? handleFormulatePuzzle : null;
}

function handleFormulatePuzzle() {
  const [itemA, itemB] = gameState._checkedItems;
  gameState._checkedItems = [];
  renderInventoryGrid();

  const result = attemptCombineWithStatus(itemA, itemB);

  if (result.status === 'fired') {
    closeInventory();
  } else if (result.status === 'locked') {
    showToast(result.hint);
  } else {
    showToast('No connection found.');
  }
}

window.handleFormulatePuzzle = handleFormulatePuzzle;

// ── DROP TRAY ──────────────────────────────────────────────
function handleShowDropTray({ roomId, items }) {
  if (!items || items.length === 0) return;
  const tray  = document.getElementById('drop-tray');
  const container = document.getElementById('drop-tray-items');
  container.innerHTML = '';
  items.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item) return;
    const div = document.createElement('div');
    div.className = 'tray-item';
    div.innerHTML = `<div class="tray-item-name">${item.name}</div>`;
    div.onclick = () => {
      collectItem(itemId);
      hideTray();
    };
    container.appendChild(div);
  });
  tray.classList.add('visible');
  setTimeout(() => tray.classList.remove('visible'), 5000);
}

function hideTray() {
  document.getElementById('drop-tray').classList.remove('visible');
}

function handleItemDropped({ itemId, roomId }) {
  updateInventoryCounter();
  addMapDropDot(roomId);
  _renderDroppedItemHotspot(itemId, roomId);
}

const _DROP_POSITIONS = [
  { left: 22, top: 58 }, { left: 72, top: 57 }, { left: 20, top: 63 },
  { left: 75, top: 62 }, { left: 25, top: 52 }, { left: 78, top: 55 },
  { left: 20, top: 68 }, { left: 74, top: 67 }, { left: 23, top: 45 },
  { left: 76, top: 48 }, { left: 21, top: 72 }, { left: 77, top: 70 },
  { left: 24, top: 55 }, { left: 73, top: 60 }, { left: 22, top: 42 },
];

let _dropCounter = {};
const _dropSlots = {};        // itemId → slot index (active drop)
const _dropSlotMemory = {};   // itemId → { slot, room } (remembered after floor pickup)
const _originPosMemory = {};  // itemId → { pos: {left,top}, room } (origin hotspot — always snaps back)

function _getItemOriginHotspot(itemId, roomId) {
  // Find the source object for this item in this room
  if (!window.ROOM_OBJECTS) return null;
  const entry = Object.values(window.ROOM_OBJECTS).find(o => o.item_id === itemId && o.room === roomId);
  if (!entry || !entry.hotspot) return null;
  return { left: entry.hotspot.left, top: entry.hotspot.top };
}

const _renderingDropped = new Set(); // atomic lock — prevents race-condition clones

function _renderDroppedItemHotspot(itemId, roomId) {
  const layer = document.getElementById(`hotspots-${roomId}`);
  if (!layer) return;
  // Already in DOM — never duplicate
  if (document.getElementById(`hs-dropped-${itemId}`)) return;
  // Currently being rendered by another call — skip
  if (_renderingDropped.has(itemId)) return;
  // Item is in inventory — don't render a floor hotspot
  if (window.gameState && window.gameState.inventory.includes(itemId)) return;
  // Item is not actually on the floor in this room — stale dropped_items entry
  if (window.gameState && !(window.gameState.dropped_items[roomId] || []).includes(itemId)) return;
  _renderingDropped.add(itemId);
  const item = window.ITEMS && window.ITEMS[itemId];
  if (!item) return;

  // Determine position
  let pos;
  // 1. Origin room — always snap back to the object's hotspot position
  const originMem = _originPosMemory[itemId];
  if (originMem && originMem.room === roomId) {
    pos = originMem.pos;
    _dropSlots[itemId] = -1; // sentinel — origin position, no slot index
  // 2. Same-room re-drop after pickup from floor — restore saved slot
  } else if (_dropSlots[itemId] === undefined && _dropSlotMemory[itemId] && _dropSlotMemory[itemId].room === roomId) {
    _dropSlots[itemId] = _dropSlotMemory[itemId].slot;
    delete _dropSlotMemory[itemId];
    pos = _DROP_POSITIONS[_dropSlots[itemId]];
  } else if (_dropSlots[itemId] !== undefined && _dropSlots[itemId] !== -1) {
    pos = _DROP_POSITIONS[_dropSlots[itemId]];
  } else {
    // 3. Check live origin hotspot for this room
    const originPos = _getItemOriginHotspot(itemId, roomId);
    if (originPos) {
      pos = originPos;
      _dropSlots[itemId] = -1; // sentinel
    } else {
      // 4. Different room — assign next available slot
      if (!_dropCounter[roomId]) _dropCounter[roomId] = 0;
      _dropSlots[itemId] = _dropCounter[roomId] % _DROP_POSITIONS.length;
      _dropCounter[roomId]++;
      pos = _DROP_POSITIONS[_dropSlots[itemId]];
    }
  }

  const hs = document.createElement('div');
  hs.className = 'hotspot dropped-item-hotspot';
  hs.id = `hs-dropped-${itemId}`;
  hs.style.cssText = `left:${pos.left}%;top:${pos.top}%;width:6%;height:6%;position:absolute;z-index:31;`;

  hs.addEventListener('click', e => {
    e.stopPropagation();
    const rect = hs.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    window._droppedPickupTarget = itemId;
    NocturneEngine.emit('showPopup', {
      objectId: `dropped-${itemId}`,
      tapX: cx, tapY: cy,
      alreadyHave: false,
    });
  });

  layer.appendChild(hs);
  _renderingDropped.delete(itemId);
}

NocturneEngine.on('roomEntered', ({ roomId }) => {
  const dropped = (window.gameState && window.gameState.dropped_items[roomId]) || [];
  dropped.forEach(itemId => _renderDroppedItemHotspot(itemId, roomId));
});

// ── CELLAR DRIP VISUAL ─────────────────────────────────────
NocturneEngine.on('roomEntered', ({ roomId }) => {
  const existing = document.getElementById('cellar-drip-overlay');
  if (existing) existing.remove();

  if (roomId !== 'wine-cellar') return;

  // Inject keyframes once
  if (!document.getElementById('cellar-drip-style')) {
    const style = document.createElement('style');
    style.id = 'cellar-drip-style';
    style.textContent = `
      @keyframes cellar-drip {
        0%   { transform: translateY(0);    opacity: 0; }
        8%   { opacity: 1; }
        88%  { opacity: 1; }
        100% { transform: translateY(105vh); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = 'cellar-drip-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden;';

  // 8-12 drip streams, randomised position, timing, size
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const drip = document.createElement('div');
    const x        = 4 + Math.random() * 92;
    const delay    = Math.random() * 10;
    const duration = 2.2 + Math.random() * 3.0;
    const height   = 10 + Math.random() * 30;
    const opacity  = 0.12 + Math.random() * 0.22;
    const width    = 0.8 + Math.random() * 1.4;
    drip.style.cssText = [
      'position:absolute',
      `left:${x}%`,
      `top:-${height}px`,
      `width:${width}px`,
      `height:${height}px`,
      `background:linear-gradient(to bottom,transparent,rgba(170,195,215,${opacity}))`,
      'border-radius:0 0 50% 50%',
      `animation:cellar-drip ${duration}s ${delay}s infinite linear`,
    ].join(';');
    overlay.appendChild(drip);
  }

  const appEl = document.getElementById('app') || document.body;
  appEl.appendChild(overlay);
});

// ── ESSENTIAL GLOW ─────────────────────────────────────────
function setEssentialGlow(objectId, on) {
  const hs = document.getElementById(`hs-${objectId}`);
  if (!hs) return;
  if (on) hs.classList.add('essential-left');
  else hs.classList.remove('essential-left');
}

// ── SLOW DRAG ──────────────────────────────────────────────
function handleOpenSlowDrag({ objectId }) {
  _slowDragObjectId = objectId;
  _slowDragComplete = false;
  const obj = ROOM_OBJECTS[objectId];
  const panel = document.getElementById('slow-drag-panel');
  const instr = document.getElementById('slow-drag-instruction');
  const textEl = document.getElementById('slow-drag-text');
  const actions = document.getElementById('drag-complete-actions');
  const surface = document.getElementById('slow-drag-surface');
  const reveal  = document.getElementById('slow-drag-reveal');

  instr.textContent = obj.slow_drag_text || 'Drag slowly.';
  textEl.style.opacity = '0';
  textEl.textContent = '';
  actions.style.display = 'none';
  reveal.style.transform = 'scaleX(1)';
  reveal.style.transition = 'none';

  panel.classList.add('open');

  // Touch/mouse drag
  let startX = null, startTime = null;
  const threshold = 40; // px to start reveal

  function onDragStart(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    startX = x;
    startTime = Date.now();
    surface.addEventListener('touchmove', onDragMove, { passive: false });
    surface.addEventListener('mousemove', onDragMove);
  }

  function onDragMove(e) {
    if (e.cancelable) e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = Math.max(0, x - startX);
    const progress = Math.min(delta / (surface.offsetWidth * 0.8), 1);

    // Reveal: shrink the overlay from right
    reveal.style.transition = 'none';
    reveal.style.transform = `scaleX(${1 - progress})`;
    reveal.style.transformOrigin = 'right';

    if (progress > 0.3) {
      textEl.style.opacity = String(Math.min((progress - 0.3) / 0.4, 1));
    }

    if (progress >= 0.95 && !_slowDragComplete) {
      completeDrag();
    }
  }

  function onDragEnd() {
    surface.removeEventListener('touchmove', onDragMove);
    surface.removeEventListener('mousemove', onDragMove);
    if (!_slowDragComplete) {
      // Spring back if not complete
      reveal.style.transition = 'transform 400ms ease-out';
      reveal.style.transform = 'scaleX(1)';
      textEl.style.opacity = '0';
    }
  }

  function completeDrag() {
    _slowDragComplete = true;
    surface.removeEventListener('touchstart', onDragStart);
    surface.removeEventListener('mousedown', onDragStart);
    surface.removeEventListener('touchend', onDragEnd);
    surface.removeEventListener('mouseup', onDragEnd);

    reveal.style.transition = 'transform 300ms ease-out';
    reveal.style.transform = 'scaleX(0)';
    textEl.style.opacity = '1';

    // Set reveal text
    const taps = gameState.object_taps[objectId] || 0;
    const maxDepth = getObjectMaxDepth(obj);
    const text = obj[`tap_${Math.min(taps + 1, maxDepth)}`] || obj.tap_1;
    textEl.textContent = text;
    gameState.object_taps[objectId] = taps + 1;

    // Special triggers
    if (objectId === 'wine-rack') {
      setTimeout(() => completeWineRackDrag(), 1500);
    }

    actions.style.display = 'flex';

    // If essential left without being dragged fully
    if (obj.is_essential && !hasItem(obj.item_id)) {
      markHotspotEssentialLeft(objectId);
    }
  }

  surface.addEventListener('touchstart', onDragStart, { passive: true });
  surface.addEventListener('mousedown', onDragStart);
  surface.addEventListener('touchend', onDragEnd);
  surface.addEventListener('mouseup', onDragEnd);
}

function handleDragKeep() {
  if (!_slowDragObjectId) return;
  const obj = ROOM_OBJECTS[_slowDragObjectId];
  if (obj && obj.item_id) handleKeep(obj.item_id);
  closeSlowDragPanel();
}

function handleDragDrop() {
  if (!_slowDragObjectId) return;
  const obj = ROOM_OBJECTS[_slowDragObjectId];
  if (obj && obj.item_id) dropItem(obj.item_id);
  closeSlowDragPanel();
}

function closeSlowDragPanel() {
  document.getElementById('slow-drag-panel').classList.remove('open');
  _slowDragObjectId = null;
  _slowDragComplete = false;
}

// ── MAP ────────────────────────────────────────────────────
function initMapUI() {
  Object.keys(gameState.rooms).forEach(roomId => {
    updateMapRoom(roomId);
  });
  updateCurrentRoomOnMap();

  // Wire map close button
  const closeBtn = document.getElementById('map-close');
  if (closeBtn && !closeBtn._wired) {
    closeBtn._wired = true;
    closeBtn.addEventListener('click', closeMap);
  }

  // Secret rooms — ensure they're hidden on init
  const secretsToHide = ['wine-cellar'];
  secretsToHide.forEach(roomId => {
    const el = document.getElementById(`mr-${roomId}`);
    if (el && !gameState.rooms[roomId]?.state || gameState.rooms[roomId]?.state === 'undiscovered') {
      el.style.display = 'none';
    }
  });

  // Reveal wine-cellar if already found (loading saved game)
  if (gameState.cellarFound) {
    const el = document.getElementById('mr-wine-cellar');
    if (el) el.style.display = 'block';
  }

  // Map is non-interactive — navigation via bottom room tabs only
}

function openMap() {
  updateCurrentRoomOnMap();
  // Re-draw cellar connector line if wine-cellar discovered (map now visible, rects valid)
  if (gameState.vaultDoorOpen) {
    const svg = document.getElementById('map-svg-estate');
    if (svg) {
      svg._cellarLineDrawn = false; // reset so it redraws with correct rects
      updateMapRoom('wine-cellar');
    }
  }
  const isCompact = gameState.currentRoom?.startsWith('c') && gameState.tunnelFound;
  if (isCompact) switchMapTab('compact');
  const panel = document.getElementById('map-panel');
  panel.classList.add('open');

  // Wire close button
  const closeBtn = document.getElementById('map-close');
  if (closeBtn) closeBtn.onclick = closeMap;

  // Inject a CLOSE box if not already present
  if (!document.getElementById('map-close-box')) {
    const box = document.createElement('div');
    box.id = 'map-close-box';
    box.textContent = 'CLOSE';
    box.style.cssText = [
      'position:absolute', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
      'padding:10px 32px', 'border:1px solid rgba(180,122,48,0.5)',
      'color:var(--gold,#B47A30)', 'font-size:10px', 'letter-spacing:0.25em',
      'cursor:pointer', 'z-index:200', 'background:rgba(0,0,0,0.6)',
      'text-transform:uppercase'
    ].join(';');
    box.onclick = closeMap;
    panel.appendChild(box);
  }

  NocturneEngine.emit('mapOpened', {});
}

function closeMap() {
  document.getElementById('map-panel').classList.remove('open');
  renderRoomNav();
}

function switchMapTab(tab) {
  _currentTab = tab;
  document.getElementById('map-tab-estate').classList.toggle('active', tab === 'estate');
  document.getElementById('map-tab-compact').classList.toggle('active', tab === 'compact');
  const estateEl = document.getElementById('map-svg-estate');
  const compactEl = document.getElementById('map-svg-compact');
  if (estateEl) estateEl.style.display = tab === 'estate' ? 'block' : 'none';
  if (compactEl) compactEl.style.display = tab === 'compact' ? 'block' : 'none';
  const titleEl = document.getElementById('map-title');
  if (titleEl) titleEl.textContent = tab === 'estate' ? 'Midnight Estate' : 'The Sovereign Compact';
}

function updateMapRoom(roomId) {
  // tunnel-passage never appears on estate map
  if (roomId === 'tunnel-passage') return;
  // Train rooms have no map nodes
  if (roomId.startsWith('train-')) return;

  const el = document.getElementById(`mr-${roomId}`);
  if (!el) return;
  const room = gameState.rooms[roomId];
  if (!room) return;

  // Wine cellar — hidden until discovered via vault panel
  if (roomId === 'wine-cellar') {
    if (room.state === 'undiscovered') {
      el.style.display = 'none';
      return;
    } else {
      el.style.display = 'block';
      // Draw connector line from vault to wine-cellar if not already drawn
      const svg = document.getElementById('map-svg-estate');
      if (svg && !svg._cellarLineDrawn) {
        svg._cellarLineDrawn = true;
        const vaultEl = document.getElementById('mr-vault');
        const cellarEl = document.getElementById('mr-wine-cellar');
        if (vaultEl && cellarEl) {
          const svgRect = svg.getBoundingClientRect();
          const vRect   = vaultEl.getBoundingClientRect();
          const cRect   = cellarEl.getBoundingClientRect();
          const x1 = (vRect.left + vRect.width / 2)  - svgRect.left;
          const y1 = (vRect.top  + vRect.height)      - svgRect.top;
          const x2 = (cRect.left + cRect.width / 2)   - svgRect.left;
          const y2 = cRect.top                         - svgRect.top;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1); line.setAttribute('y1', y1);
          line.setAttribute('x2', x2); line.setAttribute('y2', y2);
          line.setAttribute('stroke', 'rgba(180,122,48,0.35)');
          line.setAttribute('stroke-width', '1');
          line.setAttribute('stroke-dasharray', '4,4');
          svg.insertBefore(line, svg.firstChild);
        }
      }
    }
  }

  const isCurrent = roomId === gameState.currentRoom;
  let cls = `map-room ${room.state}`;
  if (el.classList.contains('map-secret')) cls += ' map-secret';
  if (isCurrent) cls += ' current';
  el.setAttribute('class', cls);

  // Pure fog of war — hide undiscovered rooms entirely (except secrets which handle their own visibility above)
  if (roomId !== 'wine-cellar' && roomId !== 'hedge-path') {
    el.style.display = (room.state === 'undiscovered') ? 'none' : '';
  }
}

function updateCurrentRoomOnMap() {
  Object.keys(gameState.rooms).forEach(roomId => updateMapRoom(roomId));
  _revealEstateCorridorsIfReady();
  _revealCompactCorridorsIfReady();
}

function handleMapUpdate({ roomId, special }) {
  if (roomId) {
    updateMapRoom(roomId);
    addMapDropDot(roomId);
    if (roomId.startsWith('c')) _revealCompactCorridorsIfReady();
    else _revealEstateCorridorsIfReady();
  }
}

function addMapDropDot(roomId) {
  const dropped = gameState.dropped_items[roomId] || [];
  if (dropped.length === 0) return;
  // Choose correct SVG layer
  const isCompact = roomId.startsWith('c');
  const svg = document.getElementById(isCompact ? 'map-drop-dots-compact' : 'map-drop-dots-estate');
  if (!svg) return;
  const roomEl = document.getElementById(`mr-${roomId}`);
  if (!roomEl) return;
  const rect = roomEl.querySelector('rect');
  if (!rect) return;
  const x = parseFloat(rect.getAttribute('x')) + parseFloat(rect.getAttribute('width')) - 7;
  const y = parseFloat(rect.getAttribute('y')) + 7;
  let dot = document.getElementById(`drop-dot-${roomId}`);
  if (!dot) {
    dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.id = `drop-dot-${roomId}`;
    dot.setAttribute('class', 'map-drop-dot');
    dot.setAttribute('r', '4');
    svg.appendChild(dot);
  }
  dot.setAttribute('cx', x);
  dot.setAttribute('cy', y);
  if (dropped.length >= 3) dot.classList.add('pulse');
}

function revealCompactMap() {
  const tab = document.getElementById('map-tab-compact');
  if (tab) {
    tab.classList.add('revealed');
    tab.style.display = 'block';
  }
  // Show compact SVG, keep estate default
  const compactSvg = document.getElementById('map-svg-compact');
  if (compactSvg) compactSvg.style.display = 'none'; // stays hidden until tab switched
  // Reveal corridors once at least one compact room is visited
  _revealCompactCorridorsIfReady();
}

function _revealCompactCorridorsIfReady() {
  // Each corridor line reveals only when BOTH endpoint rooms are known (not undiscovered)
  const CORRIDOR_LINES = [
    { id: 'mcl-c6-c1',  a: 'c6-tunnel',         b: 'c1-arrival'        },
    { id: 'mcl-c1-c3',  a: 'c1-arrival',         b: 'c3-original'       },
    { id: 'mcl-c1-c7',  a: 'c1-arrival',         b: 'c7-study'          },
    { id: 'mcl-c1-c5',  a: 'c1-arrival',         b: 'c5-correspondence' },
    { id: 'mcl-c1-c8',  a: 'c1-arrival',         b: 'c8-gallery'        },
    { id: 'mcl-c3-c5',  a: 'c3-original',        b: 'c5-correspondence' },
    { id: 'mcl-c7-c8',  a: 'c7-study',           b: 'c8-gallery'        },
  ];
  CORRIDOR_LINES.forEach(({ id, a, b }) => {
    const line = document.getElementById(id);
    if (!line) return;
    const stateA = gameState.rooms[a]?.state;
    const stateB = gameState.rooms[b]?.state;
    const bothKnown = stateA && stateA !== 'undiscovered' && stateB && stateB !== 'undiscovered';
    line.style.display = bothKnown ? '' : 'none';
  });
}

function _revealEstateCorridorsIfReady() {
  // Estate corridors — each line visible only when BOTH endpoint rooms are discovered.
  // Pure fog of war: nothing connects to rooms the player hasn't reached.
  const CORRIDOR_LINES = [
    { id: 'mle-foyer-gallery',              a: 'foyer',        b: 'gallery' },
    { id: 'mle-foyer-study',                a: 'foyer',        b: 'study' },
    { id: 'mle-gallery-terrace',            a: 'gallery',      b: 'terrace' },
    { id: 'mle-terrace-ballroom',           a: 'terrace',      b: 'ballroom' },
    { id: 'mle-terrace-maids-quarters',     a: 'terrace',      b: 'maids-quarters' },
    { id: 'mle-terrace-groundskeeper-cottage', a: 'terrace',   b: 'groundskeeper-cottage' },
    { id: 'mle-ballroom-stage',             a: 'ballroom',     b: 'stage' },
    { id: 'mle-ballroom-balcony',           a: 'ballroom',     b: 'balcony' },
    { id: 'mle-ballroom-antechamber',       a: 'ballroom',     b: 'antechamber' },
    { id: 'mle-antechamber-library',        a: 'antechamber',  b: 'library' },
    { id: 'mle-antechamber-physicians',     a: 'antechamber',  b: 'physicians' },
    { id: 'mle-library-smoking',            a: 'library',      b: 'smoking' },
    { id: 'mle-physicians-archive-path',    a: 'physicians',   b: 'archive-path' },
    { id: 'mle-smoking-archive-path',       a: 'smoking',      b: 'archive-path' },
    { id: 'mle-smoking-vault',              a: 'smoking',      b: 'vault' },
    { id: 'mle-study-map-room',             a: 'study',        b: 'map-room' },
    { id: 'mle-map-room-dining-room',       a: 'map-room',     b: 'dining-room' },
    { id: 'mle-map-room-trophy-room',       a: 'map-room',     b: 'trophy-room' },
    { id: 'mle-dining-room-billiard-room',  a: 'dining-room',  b: 'conservatory' },
    { id: 'mle-trophy-room-weapons-room',   a: 'trophy-room',  b: 'weapons-room' },
    { id: 'mle-billiard-room-conservatory', a: 'conservatory', b: 'billiard-room' },
    { id: 'mle-weapons-room-conservatory',  a: 'weapons-room', b: 'billiard-room' },
  ];
  CORRIDOR_LINES.forEach(({ id, a, b }) => {
    const line = document.getElementById(id);
    if (!line) return;
    const stateA = gameState.rooms[a]?.state;
    const stateB = gameState.rooms[b]?.state;
    const bothKnown = stateA && stateA !== 'undiscovered' && stateB && stateB !== 'undiscovered';
    line.style.display = bothKnown ? '' : 'none';
  });
}

// ── STAGE ──────────────────────────────────────────────────
function openStage() {
  // Gate: at least one suspect must have motive + means + moment covered in inventory.
  // Quality and timeline are enforced by the board on pedestal fill — not here.
  const suspectCoverage = {};
  gameState.inventory.forEach(id => {
    const item = ITEMS[id];
    if (!item || !item.accusation_target || !item.pedestal_category) return;
    const t = item.accusation_target;
    if (!suspectCoverage[t]) suspectCoverage[t] = { motive: false, means: false, moment: false };
    item.pedestal_category.forEach(cat => {
      if (cat === 'motive' || cat === 'means' || cat === 'moment') {
        suspectCoverage[t][cat] = true;
      }
    });
  });

  const hasMOM = Object.values(suspectCoverage).some(cov => cov.motive && cov.means && cov.moment);

  if (!hasMOM) {
    _showStageGateLocked();
    return;
  }

  const hasRecord = gameState.inventory.some(id =>
    ITEMS[id]?.pedestal_category?.includes('record')
  );

  _showStageGateOpen(hasRecord);
}

function _showStageGateLocked() {
  const overlay = document.createElement('div');
  overlay.className = 'stage-gate-overlay';
  overlay.innerHTML = `
    <div class="stage-gate-card">
      <div class="stage-gate-seal">&#9670;</div>
      <div class="stage-gate-title">THE ESTATE IS NOT YET SATISFIED</div>
      <div class="stage-gate-body">The case is incomplete. Motive, means, and moment must point to the same name before the Estate will hear it.</div>
      <button class="stage-gate-btn-secondary" onclick="this.closest('.stage-gate-overlay').remove()">— Withdraw —</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));
}


function _showStageGateOpen(hasRecord) {
  const overlay = document.createElement('div');
  overlay.className = 'stage-gate-overlay';
  const recordLine = (hasRecord && gameState.vaultOpen && gameState.tunnelFound)
    ? '<div class="stage-gate-record">A fourth pedestal awaits. The record may yet speak.</div>'
    : '';
  overlay.innerHTML = `
    <div class="stage-gate-card ${hasRecord ? 'stage-gate-card--deep' : ''}">
      <div class="stage-gate-seal">&#9670;</div>
      <div class="stage-gate-title">THE STAGE</div>
      <div class="stage-gate-body">Three hundred years of verdicts have been recorded in this building. Each one required evidence placed before the pedestals. Each one required a name. Each one stood.</div>
      <div class="stage-gate-body" style="margin-top:10px;font-size:11px;opacity:0.7;">The investigation ends when you present the case. The record does not reopen.</div>
      ${recordLine}
      <div class="stage-gate-warning">What you name here will stand.</div>
      <button class="stage-gate-btn-primary" onclick="_enterStage(this)">Enter the Stage</button>
      <button class="stage-gate-btn-secondary" onclick="this.closest('.stage-gate-overlay').remove()">— The investigation continues —</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));
}

function _enterStage(btn) {
  const overlay = btn.closest('.stage-gate-overlay');
  overlay.classList.remove('visible');
  setTimeout(() => {
    overlay.remove();
    updateStagePedestals();
    document.getElementById('stage-screen').classList.add('active');
  }, 500);
  haptic([80, 30, 80]);
}

function closeStage() {
  // If investigation is closed (verdict delivered), don't return items
  if (!gameState.investigation_closed) {
    const ev = gameState.stage_evidence;
    ['motive','means','moment','accomplice','record'].forEach(p => {
      if (ev[p]) {
        if (!gameState.inventory.includes(ev[p])) {
          gameState.inventory.push(ev[p]);
        }
        ev[p] = null;
      }
    });
    NocturneEngine.emit('inventoryUpdated', {});
  }
  document.getElementById('stage-screen').classList.remove('active');
}

function confirmAccusation() {
  // One shot. No retries. The player must sit with what they have built.
  const ev = gameState.stage_evidence;
  const lines = [];

  if (ev.motive)     lines.push(`Motive — ${ITEMS[ev.motive]?.name || ev.motive}`);
  if (ev.means)      lines.push(`Means — ${ITEMS[ev.means]?.name || ev.means}`);
  if (ev.moment)     lines.push(`Moment — ${ITEMS[ev.moment]?.name || ev.moment}`);
  if (ev.accomplice) lines.push(`Accomplice — ${ITEMS[ev.accomplice]?.name || ev.accomplice}`);
  if (ev.record)     lines.push(`The Record — ${ITEMS[ev.record]?.name || ev.record}`);

  const overlay = document.createElement('div');
  overlay.id = 'accusation-confirm-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:95;
    background:rgba(8,6,4,0.98);
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    padding:48px 36px;gap:16px;
    opacity:0;transition:opacity 800ms ease;
  `;

  // Estate eyebrow
  const eyebrow = document.createElement('div');
  eyebrow.style.cssText = 'font-size:9px;color:var(--gold-dim);letter-spacing:0.45em;text-transform:uppercase;font-family:var(--font-ui);text-align:center;';
  eyebrow.textContent = 'The Estate Record';
  overlay.appendChild(eyebrow);

  // Title
  const title = document.createElement('div');
  title.style.cssText = 'font-size:13px;color:var(--cream);letter-spacing:0.2em;text-transform:uppercase;font-family:var(--font-ui);text-align:center;margin-top:2px;';
  title.textContent = 'The case assembled';
  overlay.appendChild(title);

  // Rule
  const rule = document.createElement('div');
  rule.style.cssText = 'width:36px;height:1px;background:var(--gold-dim);margin:12px auto 4px;';
  overlay.appendChild(rule);

  // Evidence lines — fade in sequentially, read like a record being entered
  const caseEl = document.createElement('div');
  caseEl.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:100%;max-width:300px;';
  lines.forEach((line, i) => {
    const el = document.createElement('div');
    el.style.cssText = `
      font-size:12px;color:var(--cream-dim);
      padding:10px 16px;
      border-left:2px solid var(--gold-dim);
      line-height:1.6;font-style:italic;
      opacity:0;transition:opacity 500ms ease ${300 + i * 300}ms;
    `;
    el.textContent = line;
    caseEl.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));
  });
  overlay.appendChild(caseEl);

  // Estate judgment line — appears after all evidence
  const totalDelay = 300 + lines.length * 300 + 400;
  const warning = document.createElement('div');
  warning.style.cssText = `
    font-size:11px;color:var(--cream-dim);font-style:italic;
    letter-spacing:0.06em;text-align:center;
    max-width:260px;line-height:1.9;margin-top:12px;
    opacity:0;transition:opacity 700ms ease ${totalDelay}ms;
  `;
  warning.textContent = '"The record is permanent. What you name here will stand."';
  overlay.appendChild(warning);
  requestAnimationFrame(() => requestAnimationFrame(() => { warning.style.opacity = '1'; }));

  // Button row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:12px;width:100%;max-width:300px;margin-top:20px;';

  // Confirm — disabled until the player has sat with the decision
  const confirmDelay = totalDelay + 800;
  const confirmBtn = document.createElement('button');
  confirmBtn.style.cssText = `
    flex:1;padding:15px;
    border:1px solid rgba(180,150,80,0.3);background:transparent;
    color:rgba(180,150,80,0.3);
    font-family:var(--font-ui);font-size:9px;
    letter-spacing:0.3em;text-transform:uppercase;
    cursor:not-allowed;
    transition:border-color 600ms ease, color 600ms ease;
  `;
  confirmBtn.textContent = 'Submit to the Record';
  confirmBtn.disabled = true;

  // Enable after all lines have faded in + pause
  setTimeout(() => {
    confirmBtn.disabled = false;
    confirmBtn.style.borderColor = 'var(--gold)';
    confirmBtn.style.color = 'var(--gold)';
    confirmBtn.style.cursor = 'pointer';
  }, confirmDelay);

  confirmBtn.onclick = () => {
    if (confirmBtn.disabled) return;
    haptic([40, 20, 40, 20, 80]);
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      resolveAccusation();
    }, 700);
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = `
    flex:1;padding:15px;
    border:1px solid var(--border);background:transparent;
    color:var(--cream-dim);font-family:var(--font-ui);
    font-size:9px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;
  `;
  cancelBtn.textContent = 'The investigation continues';
  cancelBtn.onclick = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
  };

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  overlay.appendChild(btnRow);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}

window.confirmAccusation = confirmAccusation;

function updateStagePedestals() {
  ['motive','means','moment','record'].forEach(p => {
    const itemId = gameState.stage_evidence[p];
    const itemEl = document.getElementById(`pedestal-${p}-item`);
    const ped    = document.getElementById(`pedestal-${p}`);
    if (!itemEl || !ped) return;
    if (itemId) {
      itemEl.innerHTML = ITEMS[itemId] ? ITEMS[itemId].name : itemId;
      ped.classList.add('filled');
    } else {
      itemEl.innerHTML = `<span class="pedestal-empty">${getPedestalPlaceholder(p)}</span>`;
      ped.classList.remove('filled');
    }
  });
  checkConfirmButton();
}

function getPedestalPlaceholder(p) {
  return {
    motive:     'A reason.',
    means:      'How it was done.',
    moment:     'When and where.',
    accomplice: 'Who knew.',
    record:     'What the Estate does not know.',
  }[p] || '';
}

function tapPedestal(pedestalId) {
  _activePedestalId = pedestalId;
  const filtered = filterInventoryForPedestal(pedestalId);
  if (filtered.length === 0) {
    showToast('Nothing in your inventory fits this pedestal.');
    return;
  }
  // Show selection modal
  showPedestalSelector(pedestalId, filtered);
}

function showPedestalSelector(pedestalId, items) {
  let modal = document.getElementById('pedestal-selector');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pedestal-selector';
    modal.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:75;background:rgba(10,10,10,0.98);border-top:1px solid var(--border);max-height:60vh;overflow-y:auto;transform:translateY(0);';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">
      <span style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);">${pedestalId}</span>
      <span onclick="closePedestalSelector()" style="cursor:pointer;color:var(--cream-dim);">×</span>
    </div>
    ${items.map(id => `<div onclick="selectPedestalItem('${id}')" style="padding:14px 20px;border-bottom:1px solid var(--border);font-size:13px;color:var(--cream);cursor:pointer;">${ITEMS[id].name}</div>`).join('')}
    ${gameState.stage_evidence[pedestalId] ? `<div onclick="clearPedestal('${pedestalId}')" style="padding:14px 20px;font-size:12px;color:var(--amber);cursor:pointer;border-top:1px solid var(--border);">Clear this pedestal</div>` : ''}
  `;
}

function selectPedestalItem(itemId) {
  if (_activePedestalId) {
    placeEvidenceOnPedestal(_activePedestalId, itemId);
    updateStagePedestals();
    closePedestalSelector();
  }
}

function clearPedestal(pedestalId) {
  const itemId = gameState.stage_evidence[pedestalId];
  if (itemId && !gameState.inventory.includes(itemId)) {
    gameState.inventory.push(itemId);
    NocturneEngine.emit('inventoryUpdated', {});
  }
  gameState.stage_evidence[pedestalId] = null;
  updateStagePedestals();
  closePedestalSelector();
}

function closePedestalSelector() {
  const m = document.getElementById('pedestal-selector');
  if (m) m.remove();
  _activePedestalId = null;
}

function activateRecordPedestal() {
  const ped = document.getElementById('pedestal-record');
  if (ped) ped.classList.remove('hidden');
}

function activateAccomplicePedestal() {
  const ped = document.getElementById('pedestal-accomplice');
  if (ped) ped.classList.remove('hidden');
}

function enableConfirmButton() {
  const btn = document.getElementById('btn-confirm-accusation');
  if (btn) btn.classList.add('enabled');
}

function checkConfirmButton() {
  const required = ['motive','means','moment'];
  // accomplice + record are optional depth pedestals — not required to confirm
  const allFilled = required.every(p => gameState.stage_evidence[p]);
  const btn = document.getElementById('btn-confirm-accusation');
  if (btn) {
    btn.classList.toggle('enabled', allFilled);
    btn.disabled = !allFilled;
  }
}

// ── ACCUSATION OUTCOMES ────────────────────────────────────
function handleAccusationCorrect({ deep }) {
  closeStage();
  const depth = gameState._verdictDepth;
  if (depth === 'deep_political') {
    showToast('The complete account. The Estate has not seen this before.');
  } else if (depth === 'deep_human') {
    showToast('Two names. The Estate records both.');
  } else {
    showToast('The Estate has its answer.');
  }
}

function handleAccusationWrongFinal({ accused }) {
  const WRONG_VERDICT_TEXT = {
    "pemberton-hale": "Viscount Pemberton-Hale altered the Register. He added an immunity clause eighteen months ago. He removed his own name from a chain of instruction he wanted no part of. He was at the lectern at seven forty when Lord Ashworth was still alive and the balcony above was still occupied by someone whose mask was about to drop.\n\nHe was not on the balcony at seven forty-five. He was twelve feet from the body when the assembly found it. He was wearing gloves because he wears gloves to Estate events and has worn gloves to Estate events for eight years. He altered the Register to protect himself. He did not alter the railing.\n\nThe Estate has accepted your evidence. The Viscount's conduct is now on record. He prepared for a verdict that was not his to receive and has received it anyway. He will not attend another Rite.\n\nHe was guilty of covering himself. He was not guilty of being on that balcony at seven forty-five.\n\nThe investigation is closed. The person who pushed Lord Ashworth from that railing, dragged the body to the lectern, staged the candle iron with their sleeve, and obtained a new mask from the groundskeeper at seven forty-eight — that person is still in this building.\n\nNot everyone who was in this building tonight is accounted for.",

    "crane": "Dr. Crane went upstairs at six-fifteen. She established that the balcony floor was clear. Lord Ashworth was alive. She came back downstairs. She visited the Baron in the Smoking Room at six-thirty. She was not on the balcony at seven forty-five.\n\nShe found the Surgeon's mask when she went back upstairs after eight-oh-one. She said nothing. That silence is its own record and the Estate will weigh it. But silence after the fact is not the same as a hand on a man's back at seven forty-five.\n\nThe Estate has accepted your evidence. Dr. Crane's preparation for tonight, her knowledge of the balcony level, her silence after discovery — all of it is now documented. She will not practice medicine at this Estate again.\n\nShe was not on that balcony when Lord Ashworth went over the railing. The person who was — who staged the candle iron, moved the body, placed the dead hand at the Register, and ran maskless to the groundskeeper cottage — that person is not on this record.\n\nThe investigation is closed.\n\nNot everyone who was in this building tonight is accounted for.",

    "baron": "The Baron knew something was going to happen at eight-oh-one. He had been in the Smoking Room since seven-thirty with an unfinished cigarette and an untouched drink and the particular stillness of a man who has decided the evening is already decided.\n\nHe watched someone leave the study at six-fifteen. He did not ask why. He saw something above the terrace at seven forty-five — his cigarette went out — and he said nothing. That is its own verdict. It is not murder.\n\nThe Estate has accepted your evidence. The Baron's three years of arrangements with the Compact are now on record. His refusals. His silences. His decision to remain in that room while the evening proceeded without him. He will not sit there again.\n\nAt seven forty-five the Baron was in the Smoking Room. Lord Ashworth went over the railing on the balcony above. The person who pushed him, staged the scene, and was running maskless toward the groundskeeper cottage at seven forty-eight — that person was not the Baron.\n\nThe investigation is closed. The person who was on that balcony is still in this building.\n\nNot everyone who was in this building tonight is accounted for.",

    "steward": "The Steward covered the south corridor at seven fifty-eight. He was at a specific position because someone with authority over his Bond required him to be there. He has served two obligations every day for fourteen years — the Estate's and the one written in the margin of a document he signed under conditions he was not in a position to refuse.\n\nLord Ashworth went over the railing at seven forty-five. The Steward was not on the balcony at seven forty-five. The south corridor and the balcony are separated by thirteen minutes and a building. He cleared a path. He was not the person who used it.\n\nThe Estate has accepted your evidence. The Steward's Bond is now part of the record. Fourteen years of service. One evening of complicity. The Estate will weigh them in the order the Estate weighs things.\n\nThe person who pushed Lord Ashworth, dragged the body to the lectern, placed the candle iron with their sleeve so there would be no prints, and ran to the groundskeeper cottage for a new mask at seven forty-eight — that person is not on this record. The door has been excommunicated in their place.\n\nThe investigation is closed.\n\nNot everyone who was in this building tonight is accounted for.",

    "ashworth": "Lady Ashworth knew her husband was in danger. He told her six weeks ago. She asked him not to attend the Rite. He said he could not cancel. She came tonight anyway — not to stop him but to be present. She changed both sets of candles. She had a key to his private study. She was the last person to speak to him before the assembly convened.\n\nShe did not push him from the balcony. She was in the study when the balcony was occupied by someone else entirely — someone who arrived at the Estate at five forty-seven through the garden entrance and was on the balcony level before the assembly assembled.\n\nThe Estate has accepted your evidence. Lady Ashworth's knowledge, her access, her silence about the danger she knew was coming — all of it is now on record. She will not attend another Rite.\n\nShe loved a man who believed the truth was worth dying for. She disagreed. She came tonight to prove him wrong and was wrong herself about what form the danger would take.\n\nThe investigation is closed. The person who was on that balcony at seven forty-five is still in this building.\n\nNot everyone who was in this building tonight is accounted for.",

    "northcott": "Northcott has been in this building since six o'clock. Lord Ashworth placed him in the Foyer six weeks ago, gave him a notebook, and told him arrivals would matter. He kept the record with complete accuracy. He circled the five forty-seven entry himself. He told you everything he knew the moment you asked.\n\nHe did not arrive at five forty-seven. The five forty-seven entry is in his own handwriting and records someone else — someone who came through the garden entrance before any other member and went directly toward the study and the balcony above it. Northcott was recording that arrival, not making it.\n\nThe Estate has accepted your evidence. Northcott's placement, his control of the arrival record, his choices about what to mark — all of it is now documented. He will not be asked to keep another record for this Estate.\n\nLord Ashworth placed him here because he needed an unimpeachable witness. The Estate has found a way around that. Northcott has been excommunicated from a Society he was never admitted to, for recording the killer's arrival with complete accuracy on the instruction of the man the killer was about to push from a balcony.\n\nThe record shows a name. The name is the wrong one. The notebook knows the difference.\n\nNot everyone who was in this building tonight is accounted for.",
  };

  const text = WRONG_VERDICT_TEXT[accused] || "The Estate has acted on what you gave it. The accused has been excommunicated. The record will show a name. Whether it is the right name is a question the Estate considers closed. The investigation is over. Not everyone who was in this building tonight is accounted for.";

  closeStage();
  NocturneEngine.emit('momentReveal', {
    type: 'wrong-final',
    text,
    haptic: [50, 30, 50],
    screenDim: true,
  });
  setTimeout(() => deliverVerdict?.(), 6000);
}
// ── CONVERSATION ───────────────────────────────────────────
// ── CONVERSATION ROUTING ───────────────────────────────────
// _openConversationDirect: the raw opener — interrogation.js calls this
// after technique is selected. Also used for train, compact, and
// any character where technique selector should not fire.
function _openConversationDirect(charId) {
  _activeCharId = charId;
  const panel    = document.getElementById('conversation-panel');
  const charData = window.CHARACTERS && window.CHARACTERS[charId];
  if (!charData) return;

  // ROWE DUEL — hide Close button during intro/duel (one-way street)
  const dismissBtn = document.getElementById('btn-dismiss-conv');
  if (charId === 'rowe' && dismissBtn) {
    dismissBtn.style.display = 'none';
  } else if (dismissBtn) {
    dismissBtn.style.display = '';
  }

  // Clear inline display:none set by train sequence
  panel.style.display = '';
  document.getElementById('conv-portrait-zone').style.display = '';

  // Stop any running silence timer
  if (typeof window._stopSilenceSystem === 'function') window._stopSilenceSystem();

  // Hide estate portrait cards — bleed through conversation panel
  document.querySelectorAll('.estate-portrait-zone').forEach(z => {
    z.style.visibility = 'hidden';
    z.style.pointerEvents = 'none';
  });

  // Build portrait zone
  const zone = document.getElementById('conv-portrait-zone');
  zone.innerHTML = '';
  const roomId    = gameState.currentRoom;
  const roomChars = _getRoomCharacters(roomId);
  if (roomChars.length > 1) {
    roomChars.forEach(cId => {
      const card = _buildConvCard(cId, roomChars.length);
      zone.appendChild(card);
    });
    _activateConvCard(charId, roomChars);
  } else {
    const card = _buildConvCard(charId, 1);
    zone.appendChild(card);
  }

  const introText = (charData.surface_gate && typeof _isSurfaceGateMet === 'function' && !_isSurfaceGateMet(charData))
    ? (charData.intro_surface || charData.intro || '')
    : (charData.intro || '');
  document.getElementById('char-response').textContent = introText;
  const _introEl = document.getElementById('char-response'); if (_introEl) _introEl.scrollTop = 0;

  // Hale — initialise session and clear any stale Callum read block
  if (charId === 'pemberton-hale') {
    if (typeof window.initHaleSession === 'function') window.initHaleSession();
    const s = window.getHaleSession ? window.getHaleSession() : null;
    if (s && s.openingAsked) {
      // Return visit — reset active selection only
      // usedTechniques, completedLines, flags, gateState, pencil all preserved
      s.lineSelected      = null;
      s.techniqueSelected = null;
      s.followupAsked     = null;
      s.diversionQueue    = [];
      s.lastTechnique     = null;
    }
    const stale = document.getElementById('hale-callum-read');
    if (stale) stale.remove();
    const staleFlash = document.getElementById('hale-pencil-flash');
    if (staleFlash) staleFlash.remove();
  }
  if (typeof window.applyPivotBonus === 'function') window.applyPivotBonus(charId);
  renderQuestions(charId);
  updateDeceptionButton();
  const state = gameState.characters[charId]?.composure_state || 'normal';
  panel.className = `composure-${state}`;
  panel.classList.add('open');

  // Composure state label — sits between portrait and dialogue
  let stateLabel = document.getElementById('composure-state-label');
  if (!stateLabel) {
    stateLabel = document.createElement('div');
    stateLabel.id = 'composure-state-label';
    const charResponse = document.getElementById('char-response');
    if (charResponse) {
      panel.insertBefore(stateLabel, charResponse);
    } else {
      panel.appendChild(stateLabel);
    }
  }
  updateComposureLabel(charId);

  // ── TELL (#1) ────────────────────────────────────────────
  // Show one observational tell above the intro, once per open.
  // Rotates across plays. Skips characters without a tell pool
  // (rowe/uninvited treated per pool presence).
  try {
    // Always clear any prior Tell element first — prevents the prior
    // character's Tell from persisting when a character without a Tell
    // (or a character whose getCharacterTell returns null) is opened.
    const existingTell = document.getElementById('char-tell-line');
    if (existingTell) existingTell.remove();

    if (typeof window.getCharacterTell === 'function') {
      const tellText = window.getCharacterTell(charId);
      if (tellText) {
        const tellEl = document.createElement('div');
        tellEl.id = 'char-tell-line';
        tellEl.textContent = tellText;
        tellEl.style.cssText = 'padding:6px 14px 6px 12px;font-size:10.5px;font-style:italic;color:rgba(170,140,90,0.72);letter-spacing:0.02em;line-height:1.5;border-left:1px solid rgba(170,140,90,0.25);margin:4px 14px 4px;';
        const charResponse = document.getElementById('char-response');
        if (charResponse && charResponse.parentNode) {
          charResponse.parentNode.insertBefore(tellEl, charResponse);
        }
      }
    }
  } catch(e) { /* non-fatal */ }

  // ── PORTRAIT LAYER 1 — start ambient breathing ─────────────────
  // Initialize breath class based on current composure. Runs for the
  // life of the conversation; subsequent composure changes swap class
  // via applyPortraitBreath() called from _applyComposureCost.
  try {
    if (typeof applyPortraitBreath === 'function') {
      // Use rAF so the portrait element is definitely in the DOM
      requestAnimationFrame(() => applyPortraitBreath(charId));
    }
  } catch(e) { /* non-fatal */ }
}

// openConversation: public entry point.
// Routes through technique selector if interrogation system is loaded.
// Falls back to direct open if not.
function dismissRoomDescription() {
  const panel = document.getElementById('room-description');
  if (panel) panel.classList.remove('visible');
}

function openConversation(charId) {
  dismissRoomDescription();
  const charData = window.CHARACTERS && window.CHARACTERS[charId];
  if (!charData) return;

  // Compact characters skip technique selector — warmth rule, no composure decay.
  // Hale skips it too — new line-of-questioning system handles technique selection inline.
  // Train characters are handled by train.js directly — never reach here.
  const skipSelector = charData.is_compact === true || charId === 'pemberton-hale';

  if (!skipSelector && typeof window.openTechniqueSelector === 'function') {
    window.openTechniqueSelector(charId);
  } else {
    _openConversationDirect(charId);
  }
}

function _buildConvCard(charId, totalChars) {
  const charData  = window.CHARACTERS && window.CHARACTERS[charId];
  const assetPath = (typeof getCharAsset === 'function') ? getCharAsset(charId) : '';

  const card = document.createElement('div');
  card.className = 'conv-npc-card';
  card.id = `conv-card-${charId}`;
  card.onclick = () => {
    _activeCharId = charId;
    const roomChars = _getRoomCharacters(gameState.currentRoom);
    _activateConvCard(charId, roomChars);
    document.getElementById('char-response').textContent = '';
    renderQuestions(charId);
    updateDeceptionButton();
  };

  const portrait = document.createElement('div');
  portrait.className = 'conv-npc-portrait';
  portrait.id = `conv-portrait-${charId}`;
  portrait.style.backgroundImage = `url(${assetPath})`;
  card.appendChild(portrait);

  // Mouth overlay for lip sync
  const mouth = document.createElement('div');
  mouth.className = 'mouth-overlay';
  card.appendChild(mouth);

  const nameLabel = document.createElement('div');
  nameLabel.className = 'conv-npc-name-label';
  nameLabel.textContent = (charData?.display_name || charId).toUpperCase();
  card.appendChild(nameLabel);

  return card;
}

function _activateConvCard(charId, roomChars) {
  roomChars.forEach(cId => {
    const card = document.getElementById(`conv-card-${cId}`);
    if (!card) return;
    if (cId === charId) {
      card.classList.remove('inactive');
      card.classList.add('active');
    } else {
      card.classList.remove('active');
      card.classList.add('inactive');
    }
  });
}

function _getRoomCharacters(roomId) {
  if (!window.ROOM_CHARACTERS) return [_activeCharId].filter(Boolean);
  return window.ROOM_CHARACTERS[roomId] || [_activeCharId].filter(Boolean);
}

function updateComposureLabel(charId) {
  const label = document.getElementById('composure-state-label');
  if (!label) return;
  const composure = (gameState.characters[charId] || {}).composure;
  label.className = '';
  if (composure === undefined || composure > 70) {
    label.textContent = 'COMPOSED';
  } else if (composure > 55) {
    label.textContent = 'CONTROLLED';
    label.classList.add('state-controlled');
  } else if (composure > 40) {
    label.textContent = 'STRAINED';
    label.classList.add('state-strained');
  } else {
    label.textContent = 'FRACTURED';
    label.classList.add('state-fractured');
  }
}

function closeConversation() {
  // ── DEBRIEF (#6) ──────────────────────────────────────────
  // Fire once per character per case when a real interrogation
  // has taken place (at least one question answered AND technique
  // was selected). Teaches the player the archetype mid-run.
  try {
    const charId = _activeCharId;
    if (charId
        && typeof window.getSuspectDebrief === 'function'
        && !window._debriefShown?.[charId]) {
      // For Hale — pull technique from haleSession
      let techUsed = (window._interrogationState?.techniqueHistory || {})[charId]
                     || gameState.character_technique_history?.[charId];
      if (charId === 'pemberton-hale' && !techUsed) {
        const hs = window.getHaleSession ? window.getHaleSession() : null;
        if (hs && hs.techniqueSelected) techUsed = hs.techniqueSelected;
      }
      const answered = charId === 'pemberton-hale'
        ? (window.getHaleSession ? (window.getHaleSession().openingAsked ? 1 : 0) : 0)
        : Object.keys(gameState.char_dialogue_complete?.[charId] || {}).filter(k => !k.startsWith('_')).length;
      if (techUsed && answered >= 1) {
        const debrief = window.getSuspectDebrief(charId);
        const meta    = (window.CHAR_META || {})[charId] || {};
        if (debrief) {
          window._debriefShown = window._debriefShown || {};
          window._debriefShown[charId] = true;
          _showSuspectDebriefOverlay(charId, debrief, meta, techUsed);
          return;
        }
      }
    }
  } catch(e) { /* non-fatal, fall through to normal close */ }

  _closeConversationPanel();
}

function _closeConversationPanel() {
  document.getElementById('conversation-panel').classList.remove('open');

  // ── PORTRAIT — clear all reaction classes ────────────────────
  // Breath + reactions + signatures all cleared on close so next
  // conversation opens clean. state-broken does NOT persist across
  // conversations — each session is a fresh read of the suspect.
  try {
    if (_activeCharId && typeof clearPortraitReactions === 'function') {
      clearPortraitReactions(_activeCharId);
    }
  } catch(e) { /* non-fatal */ }

  const UNINVITED_ROOMS = ['ballroom', 'library', 'vault', 'wine-cellar'];
  const curRoom = gameState && gameState.currentRoom;

  // If closing from an Uninvited room — mark dismissed so he never re-arms
  if (UNINVITED_ROOMS.includes(curRoom) && _activeCharId === null) {
    if (typeof closeUninvitedEncounter === 'function') {
      closeUninvitedEncounter(curRoom);
    } else {
      if (gameState) {
        if (!gameState.char_dialogue_complete['uninvited']) gameState.char_dialogue_complete['uninvited'] = {};
        gameState.char_dialogue_complete['uninvited'][curRoom + '_dismissed'] = true;
        if (typeof saveGame === 'function') saveGame();
      }
    }
  }

  // Ballroom: Uninvited fades out on dismiss
  if (curRoom === 'ballroom') {
    const zone = document.getElementById('char-zone-ballroom');
    if (zone) {
      zone.style.transition = 'opacity 600ms ease';
      zone.style.opacity = '0';
      setTimeout(() => { zone.style.display = 'none'; }, 620);
    }
  }

  // Library: clear Uninvited portrait only, Greaves stays
  if (curRoom === 'library') {
    const zone = document.getElementById('conv-portrait-zone');
    if (zone) zone.innerHTML = '';
  }

  _activeCharId = null;
  document.querySelectorAll('.estate-portrait-zone').forEach(z => {
    z.style.visibility = '';
    z.style.pointerEvents = '';
  });
}

function _showSuspectDebriefOverlay(charId, debrief, meta, techUsed) {
  const existing = document.getElementById('suspect-debrief-overlay');
  if (existing) existing.remove();

  const charData = (window.CHARACTERS || {})[charId] || {};
  const displayName = charData.display_name || charId;

  const TECH_LABELS = {
    account:  'The Account',
    record:   'The Record',
    approach: 'The Approach',
    wait:     'The Wait',
    pressure: 'The Pressure',
  };
  const techLabel    = TECH_LABELS[techUsed] || techUsed;
  const optimalLabel = debrief.optimal_label || TECH_LABELS[meta.optimal_technique] || '—';
  const matchedOptimal = meta.optimal_technique === techUsed;

  const overlay = document.createElement('div');
  overlay.id = 'suspect-debrief-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(4,3,2,0.88);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 400ms ease;padding:24px;box-sizing:border-box;';

  const card = document.createElement('div');
  card.style.cssText = 'width:min(460px,96vw);max-height:90vh;overflow-y:auto;background:#0f0d09;border:1px solid rgba(180,155,90,0.28);padding:28px 28px 22px;box-shadow:0 8px 40px rgba(0,0,0,0.7);';

  const header = document.createElement('div');
  header.style.cssText = 'font-size:9px;letter-spacing:0.32em;color:var(--gold,#c9a84c);text-transform:uppercase;opacity:0.85;margin-bottom:14px;';
  header.textContent = 'Interrogation Notes';
  card.appendChild(header);

  const name = document.createElement('div');
  name.style.cssText = 'font-size:18px;letter-spacing:0.15em;color:var(--cream,#e8dcc8);text-transform:uppercase;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid rgba(180,155,90,0.18);';
  name.textContent = displayName;
  card.appendChild(name);

  const mkRow = (label, value) => {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:14px;';
    const l = document.createElement('div');
    l.style.cssText = 'font-size:9px;letter-spacing:0.22em;color:var(--gold-dim,#9a7c3a);text-transform:uppercase;margin-bottom:4px;opacity:0.8;';
    l.textContent = label;
    const v = document.createElement('div');
    v.style.cssText = 'font-size:13px;color:var(--cream-dim,#b8a98a);line-height:1.55;letter-spacing:0.02em;';
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    return row;
  };

  card.appendChild(mkRow('Counter-strategy', debrief.strategy_label));
  const stratBeat = document.createElement('div');
  stratBeat.style.cssText = 'font-size:12px;color:rgba(190,170,130,0.72);font-style:italic;margin:-8px 0 16px;line-height:1.6;';
  stratBeat.textContent = debrief.strategy_line;
  card.appendChild(stratBeat);

  // Hale — show line of questioning in debrief
  if (charId === 'pemberton-hale') {
    const hs = window.getHaleSession ? window.getHaleSession() : null;
    if (hs && hs.lineSelected) {
      const lineLabels = { register: 'The Register', ashworth: 'Lord Ashworth', others: 'The Others' };
      card.appendChild(mkRow('Line of questioning', lineLabels[hs.lineSelected] || hs.lineSelected));
    }
  }

  card.appendChild(mkRow('Technique used', techLabel));
  card.appendChild(mkRow('Optimal technique', optimalLabel));

  const matchRow = document.createElement('div');
  matchRow.style.cssText = 'margin:10px 0 18px;padding:10px 12px;border-left:2px solid ' + (matchedOptimal ? 'rgba(180,155,90,0.7)' : 'rgba(170,90,80,0.6)') + ';background:rgba(20,14,8,0.45);font-size:12px;color:var(--cream-dim,#b8a98a);line-height:1.6;font-style:italic;letter-spacing:0.02em;';
  matchRow.textContent = debrief.coaching_line;
  card.appendChild(matchRow);

  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'display:block;margin:14px auto 0;background:transparent;border:1px solid rgba(180,155,90,0.35);color:var(--gold,#c9a84c);padding:8px 28px;font-size:10px;letter-spacing:0.24em;cursor:pointer;text-transform:uppercase;font-family:inherit;';
  closeBtn.textContent = 'Continue';
  closeBtn.onclick = () => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      _closeConversationPanel();
    }, 400);
  };
  card.appendChild(closeBtn);

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}


// ── AUTO-SCROLL CHAR-RESPONSE TO TOP ON EVERY RESPONSE ──────────
// One observer catches all response updates globally — Hale, all other
// characters, deceptions, snaps, gate responses, branch responses.
(function _initResponseScrollObserver() {
  const _observe = () => {
    const el = document.getElementById('char-response');
    if (!el) { setTimeout(_observe, 500); return; }
    new MutationObserver(() => { el.scrollTop = 0; })
      .observe(el, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _observe);
  } else {
    _observe();
  }
})();

// ═══════════════════════════════════════════════════════════
// HALE LINE-OF-QUESTIONING UI
// ═══════════════════════════════════════════════════════════

const HALE_LINE_LABELS = {
  register: "Walk me through your evening. From arrival to now.",
  ashworth: "Tell me about your history with Lord Ashworth.",
  others:   "Who in this building knows more than they've said tonight.",
};

const HALE_TECH_META = {
  wait:     { name: 'Wait',     desc: 'patience' },
  account:  { name: 'Account',  desc: 'narrative' },
  approach: { name: 'Approach', desc: 'conversation' },
  pressure: { name: 'Pressure', desc: 'confrontation' },
};

function _renderHaleQuestions(list) {
  const s = window.getHaleSession ? window.getHaleSession() : null;
  if (!s) {
    // Session not ready — show loading state
    list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">Loading...</div>';
    return;
  }
  const char = window.CHARACTERS && window.CHARACTERS['pemberton-hale'];
  if (!char || !char.opening) {
    list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">Character data unavailable.</div>';
    return;
  }
  // Ensure minimum height for 3 items on mobile
  list.style.minHeight = '144px';

  // Step 0 — Opening question
  if (!s.openingAsked) {
    const btn = document.createElement('div');
    btn.className = 'question-item';
    btn.textContent = char.opening.question;
    btn.onclick = () => {
      if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick();
      _haleFireOpening();
    };
    list.appendChild(btn);
    return;
  }

  // ── SEQUENTIAL BRANCH SELECTION ──────────────────────────────
  // Register always available first. Ashworth unlocks after Register exhausted.
  // Others unlocks after Ashworth exhausted. Player clicks the branch to enter it.
  if (!s.lineSelected) {
    const BRANCH_ORDER = ['register', 'ashworth', 'others'];
    const completed = s.completedLines || [];
    const used = s.usedTechniques || {};
    BRANCH_ORDER.forEach((lineId, idx) => {
      const text = HALE_LINE_LABELS[lineId];
      const isDone = completed.includes(lineId);
      // Branch is available if all previous branches are exhausted
      const prevDone = BRANCH_ORDER.slice(0, idx).every(b => completed.includes(b));
      const isAvailable = idx === 0 || prevDone;
      const btn = document.createElement('div');
      btn.className = 'question-item' + (isDone ? ' question-asked' : '') + (!isAvailable ? ' question-locked' : '');
      btn.style.opacity = isDone ? '0.35' : !isAvailable ? '0.35' : '1';
      btn.style.cursor = (isDone || !isAvailable) ? 'default' : 'pointer';
      btn.textContent = text;
      if (isAvailable && !isDone) {
        btn.onclick = () => {
          if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick();
          // Others fires immediately
          if (lineId === 'others') {
            window.haleSelectLine(lineId);
            _haleFireOthers();
            return;
          }
          window.haleSelectLine(lineId);
          renderQuestions('pemberton-hale');
        };
      }
      list.appendChild(btn);
    });
    return;
  }

  // Technique selection — only show when no technique has fired yet this cycle
  if (!s.techniqueSelected && !s.lastTechnique) {
    const techniques = char.line_techniques[s.lineSelected] || {};
    const used = (s.usedTechniques && s.usedTechniques[s.lineSelected]) || [];
    const remaining = ['wait','account','approach','pressure'].filter(t => !used.includes(t));
    const note = document.createElement('div');
    note.style.cssText = 'padding:10px 16px;font-size:12px;color:var(--text-dim);font-style:italic;';
    note.textContent = used.length === 0 ? 'Choose how you ask.' : remaining.length > 0 ? `${remaining.length} approach${remaining.length !== 1 ? 'es' : ''} remaining.` : 'All approaches used.';
    list.appendChild(note);
    ['wait', 'account', 'approach', 'pressure'].forEach(techId => {
      const tech = techniques[techId];
      if (!tech) return;
      const isUsed = used.includes(techId);
      const btn = document.createElement('div');
      btn.className = 'question-item hale-technique-btn' + (isUsed ? ' question-asked' : '');
      btn.style.opacity = isUsed ? '0.35' : '1';
      btn.style.cursor = isUsed ? 'default' : 'pointer';
      btn.innerHTML = `<span class="hale-tech-name">${HALE_TECH_META[techId].name}${isUsed ? ' ✓' : ''}</span>
        <span class="hale-tech-desc">${HALE_TECH_META[techId].desc}</span>
        ${!isUsed ? `<span class="hale-callum-q">${tech.callum_question}</span>` : ''}`;
      if (!isUsed) {
        btn.onclick = () => {
          if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick();
          _haleFireLineTechnique(s.lineSelected, techId);
        };
      }
      list.appendChild(btn);
    });
    return;
  }

  // Step 3 — Follow-up questions (mutually exclusive pair)
  if (!s.followupAsked && s.lastTechnique) {
    const pool = (char.followups[s.lineSelected] || {})[s.lastTechnique] || [];
    if (pool.length > 0) {
      pool.forEach(fq => {
        const btn = document.createElement('div');
        btn.className = 'question-item';
        btn.textContent = fq.text;
        btn.onclick = () => {
          if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick();
          _haleFireFollowup(fq.id);
        };
        list.appendChild(btn);
      });
      return;
    }
  }

  // Step 4 — Gate question (if available)
  if (window.haleGateAvailable && window.haleGateAvailable('gate1')) {
    const gate = char.gates.gate1;
    const btn = document.createElement('div');
    btn.className = 'question-item question-gate';
    btn.textContent = gate.question;
    btn.onclick = () => {
      if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick();
      _haleOpenGate('gate1');
    };
    list.appendChild(btn);
  }

  // Exhausted
  if (list.children.length === 0) {
    list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">The conversation has been exhausted.</div>';
  }
}

function _injectHaleForwardArrow() {
  const existing = document.getElementById('hale-forward-arrow');
  if (existing) existing.remove();
  const resp = document.getElementById('char-response');
  if (!resp) return;
  const btn = document.createElement('button');
  btn.id = 'hale-forward-arrow';
  btn.style.cssText = 'display:flex;align-items:center;justify-content:center;margin:14px auto 0;background:rgba(20,16,10,0.75);border:1px solid rgba(180,155,90,0.4);border-radius:50%;width:36px;height:36px;cursor:pointer;color:#c9a84c;font-size:18px;';
  btn.innerHTML = '›';
  btn.onclick = () => {
    btn.remove();
    renderQuestions('pemberton-hale');
    // Scroll questions list into view on mobile
    const list = document.getElementById('questions-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  resp.appendChild(btn);
}

function _haleFireOthers() {
  const char = window.CHARACTERS && window.CHARACTERS['pemberton-hale'];
  if (!char || !char.others_techniques) return;
  const tech = char.others_techniques['wait'];
  if (!tech) return;
  const resp = document.getElementById('char-response');
  if (resp) {
    resp.innerHTML = '';
    resp.textContent = tech.response;
    if (tech.callum) _showHaleCallumRead(tech.callum);
  }
  renderQuestions('pemberton-hale');
}

function _injectHaleSnapback(branch) {
  const snap = window.HALE_SNAPBACK && window.HALE_SNAPBACK[branch];
  if (!snap) return;
  const resp = document.getElementById('char-response');
  if (!resp) return;
  // Snapback question block
  const snapEl = document.createElement('div');
  snapEl.id = 'hale-snapback';
  snapEl.style.cssText = 'margin-top:16px;padding:12px 16px;background:rgba(20,16,10,0.8);border-left:2px solid rgba(180,155,90,0.6);';
  // Question
  const qEl = document.createElement('div');
  qEl.style.cssText = 'font-size:15px;color:var(--text);font-style:italic;margin-bottom:12px;line-height:1.6;';
  qEl.textContent = snap.question.replace(/"/g, '');
  snapEl.appendChild(qEl);
  // Three options
  snap.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.style.cssText = 'display:block;width:100%;text-align:left;background:rgba(30,24,14,0.8);border:1px solid rgba(180,155,90,0.25);color:var(--text-dim);font-size:13px;padding:9px 12px;margin-bottom:6px;cursor:pointer;font-style:italic;line-height:1.45;';
    btn.textContent = `"${opt.text}"`;
    btn.onclick = () => {
      snapEl.remove();
      const result = window.haleSnapbackAnswer(branch, opt.id);
      if (!result) return;
      // Show result response
      const resultEl = document.createElement('div');
      resultEl.style.cssText = 'margin-top:12px;padding:10px 14px;background:rgba(20,16,10,0.7);border-left:2px solid ' + (result.kind === 'correct' ? 'rgba(107,138,74,0.8)' : result.kind === 'wrong' ? 'rgba(160,74,58,0.8)' : 'rgba(180,155,90,0.4)') + ';font-size:14px;color:var(--text);font-style:italic;line-height:1.6;';
      resultEl.textContent = result.text;
      resp.appendChild(resultEl);
      // Wrong — show branch locked message then big arrow
      if (result.kind === 'wrong') {
        const lockEl = document.createElement('div');
        lockEl.style.cssText = 'margin-top:8px;font-size:11px;color:rgba(160,74,58,0.8);font-family:var(--sans);letter-spacing:0.1em;text-transform:uppercase;text-align:center;';
        lockEl.textContent = 'Branch closed this visit';
        resp.appendChild(lockEl);
        _injectHaleBigArrow();
      } else {
        _injectHaleMiniArrow();
        renderQuestions('pemberton-hale');
      }
    };
    snapEl.appendChild(btn);
  });
  resp.appendChild(snapEl);
}

function _injectHaleMiniArrow() {
  // Mini arrow — cycles to remaining techniques in current branch
  const existing = document.getElementById('hale-mini-arrow');
  if (existing) existing.remove();
  const s = window.getHaleSession ? window.getHaleSession() : null;
  if (!s) return;
  const allTechs = ['wait','account','approach','pressure'];
  const used = (s.usedTechniques && s.usedTechniques[s.lineSelected]) || [];
  const remaining = allTechs.filter(t => !used.includes(t));
  if (remaining.length === 0) {
    _injectHaleBigArrow();
    return;
  }
  const resp = document.getElementById('char-response');
  if (!resp) return;
  const btn = document.createElement('button');
  btn.id = 'hale-mini-arrow';
  btn.style.cssText = 'display:flex;align-items:center;justify-content:center;margin:12px auto 0;background:rgba(20,16,10,0.75);border:1px solid rgba(180,155,90,0.35);border-radius:50%;width:32px;height:32px;cursor:pointer;color:#c9a84c;font-size:16px;';
  btn.innerHTML = '›';
  btn.title = `${remaining.length} approach${remaining.length !== 1 ? 'es' : ''} remaining`;
  btn.onclick = () => {
    btn.remove();
    const s2 = window.getHaleSession ? window.getHaleSession() : null;
    if (s2) { s2.techniqueSelected = null; s2.lastTechnique = null; }
    renderQuestions('pemberton-hale');
  };
  resp.appendChild(btn);
}

function _injectHaleBigArrow() {
  // Big arrow — advances to next branch
  const existing = document.getElementById('hale-big-arrow');
  if (existing) existing.remove();
  const s = window.getHaleSession ? window.getHaleSession() : null;
  if (!s) return;
  const BRANCH_ORDER = ['register', 'ashworth', 'others'];
  const completed = s.completedLines || [];
  const nextBranch = BRANCH_ORDER.find(b => !completed.includes(b) && b !== s.lineSelected);
  if (!nextBranch) return;
  const resp = document.getElementById('char-response');
  if (!resp) return;
  const btn = document.createElement('button');
  btn.id = 'hale-big-arrow';
  btn.style.cssText = 'display:flex;align-items:center;justify-content:center;margin:14px auto 0;background:rgba(180,155,90,0.15);border:1px solid rgba(180,155,90,0.6);border-radius:50%;width:42px;height:42px;cursor:pointer;color:#c9a84c;font-size:22px;';
  btn.innerHTML = '›';
  btn.title = 'Continue investigation';
  btn.onclick = () => {
    btn.remove();
    if (!s.completedLines) s.completedLines = [];
    if (!s.completedLines.includes(s.lineSelected)) s.completedLines.push(s.lineSelected);
    s.lineSelected = null;
    s.techniqueSelected = null;
    s.followupAsked = null;
    s.lastTechnique = null;
    renderQuestions('pemberton-hale');
    const list = document.getElementById('questions-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  resp.appendChild(btn);
}

function _haleFireOpening() {
  const char = window.CHARACTERS && window.CHARACTERS['pemberton-hale'];
  if (!char || !char.opening) return;
  const resp = document.getElementById('char-response');
  if (resp) {
    resp.innerHTML = '';
    resp.textContent = char.opening.response;
    _showHaleCallumRead(char.opening.callum);
  }
  window.haleOpeningAsked();
  renderQuestions('pemberton-hale');
}

function _haleFireLineTechnique(lineId, techId) {
  const char = window.CHARACTERS && window.CHARACTERS['pemberton-hale'];
  if (!char) return;
  const tech = (char.line_techniques[lineId] || {})[techId];
  if (!tech) return;
  const resp = document.getElementById('char-response');
  if (resp) {
    resp.innerHTML = '';
    resp.textContent = tech.response;
    if (tech.callum) _showHaleCallumRead(tech.callum);
  }
  window.haleSelectTechnique(techId);
  const s = window.getHaleSession ? window.getHaleSession() : null;
  if (s) s.techniqueSelected = null;
  // Inject snapback or mini arrow
  if (s && s.snapbackPending) {
    _injectHaleSnapback(lineId);
  } else {
    _injectHaleMiniArrow();
  }
  // Render follow-ups directly in question list — do NOT call renderQuestions
  // which would re-render all 4 techniques
  const list = document.getElementById('questions-list');
  if (!list) return;
  list.innerHTML = '';
  const pool = (char.followups[lineId] || {})[techId] || [];
  if (pool.length > 0) {
    document.getElementById('action-title') && (document.getElementById('action-title').textContent = 'Follow-up');
    pool.forEach(fq => {
      const btn = document.createElement('div');
      btn.className = 'question-item';
      btn.textContent = fq.text;
      btn.onclick = () => {
        if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick();
        _haleFireFollowup(fq.id);
      };
      list.appendChild(btn);
    });
  }
}

function _haleFireFollowup(followupId) {
  const fq = window.haleAskFollowup(followupId);
  if (!fq) return;
  const resp = document.getElementById('char-response');
  if (resp) {
    resp.innerHTML = '';
    resp.textContent = fq.response;
    if (fq.callum) _showHaleCallumRead(fq.callum);
  }
  // Reset so next technique can show its own follow-ups
  const s = window.getHaleSession ? window.getHaleSession() : null;
  if (s) { s.followupAsked = null; s.lastTechnique = null; }
  // Flash pencil for timeline node
  if (fq.pencil_flash && window.gameState && window.gameState.halePencilFlashPending) {
    if (typeof window.flashPencilForTimeline === 'function') {
      window.flashPencilForTimeline(fq.pencil_node || window.gameState.halePencilNode);
    }
  }
  // Inject mini arrow — tapping it brings back remaining techniques
  _injectHaleMiniArrow();
  // Clear question list — nothing shows until mini arrow tapped
  const list = document.getElementById('questions-list');
  if (list) list.innerHTML = '';
}

function _haleOpenGate(gateId) {
  // Show technique panel for gate
  const char = window.CHARACTERS && window.CHARACTERS['pemberton-hale'];
  if (!char) return;
  const gate = char.gates[gateId];
  if (!gate) return;
  // Fire existing technique selector with gate context
  if (typeof window.openTechniqueSelector === 'function') {
    window.openTechniqueSelector('pemberton-hale', gateId, (techId) => {
      const result = window.halePickGateTechnique(gateId, techId);
      if (!result) return;
      const resp = document.getElementById('char-response');
      if (resp) resp.textContent = result.response;
      if (result.callum) _showHaleCallumRead(result.callum);
      // Slip animation
      if (window.gameState.phSlipFired && typeof animatePHSlip === 'function') {
        animatePHSlip();
        window.gameState.phSlipFired = false;
      }
      renderQuestions('pemberton-hale');
    });
  }
}

function _showHaleCallumRead(text) {
  const existing = document.getElementById('hale-callum-read');
  if (existing) existing.remove();
  if (!text) return;
  const resp = document.getElementById('char-response');
  if (!resp) return;
  const el = document.createElement('div');
  el.id = 'hale-callum-read';
  el.style.cssText = 'margin-top:10px;padding:8px 12px;background:rgba(20,16,10,0.6);border-left:2px solid rgba(180,155,90,0.3);font-size:11px;color:var(--text-dim);font-style:italic;line-height:1.5;overflow-y:auto;max-height:30vh;';
  // Use only the first paragraph on mobile to keep it tight
  const paragraphs = text.split('\n\n').filter(Boolean);
  el.innerHTML = paragraphs.map(p => `<p style="margin:0 0 6px">${p}</p>`).join('');
  resp.appendChild(el);
}

function _injectHalePencilFlash() {
  // Flash the pencil icon on the Callum read div — pulses until tapped
  const callumEl = document.getElementById('hale-callum-read');
  if (!callumEl) return;
  const existing = document.getElementById('hale-pencil-flash');
  if (existing) return; // already injected
  const btn = document.createElement('button');
  btn.id = 'hale-pencil-flash';
  btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:rgba(20,16,10,0.75);border:1px solid rgba(180,155,90,0.5);border-radius:4px;color:#c9a84c;padding:5px 10px;cursor:pointer;font-size:12px;animation:hale-pencil-pulse 1.2s ease-in-out infinite;';
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 14L5 12.5L13 4.5L14 5.5L6 13.5L4.5 15L3 14Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/><path d="M11.5 3L15 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  btn.onclick = () => {
    btn.style.animation = 'none';
    btn.style.color = '#6b8a4a';
    btn.onclick = null;
    if (typeof window.haleCapturePencil === 'function') window.haleCapturePencil();
    if (typeof window.saveNoteForChar === 'function') {
      const label = 'Confirmed entries with Curator at 7:42. Standard procedural review.';
      window.saveNoteForChar('pemberton-hale', label);
    }
    // After capture, show forward arrow
    _injectHaleForwardArrow();
  };
  // Inject keyframe animation if not already present
  if (!document.getElementById('hale-pencil-style')) {
    const style = document.createElement('style');
    style.id = 'hale-pencil-style';
    style.textContent = '@keyframes hale-pencil-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.35;transform:scale(0.88)}}';
    document.head.appendChild(style);
  }
  callumEl.appendChild(btn);
}

function renderQuestions(charId) {
  const list = document.getElementById('questions-list');
  list.innerHTML = '';

  // ── HALE LINE-OF-QUESTIONING SYSTEM ──────────────────────────
  if (charId === 'pemberton-hale') {
    _renderHaleQuestions(list);
    return;
  }

  if (!window.computeAvailableQuestions) return;
  const available = computeAvailableQuestions(charId);
  
  // ROWE — restore Close button after duel completes
  if (charId === 'rowe') {
    const dismissBtn = document.getElementById('btn-dismiss-conv');
    const roweState = typeof window.getRoweDialogueState === 'function' ? window.getRoweDialogueState() : null;
    if (dismissBtn && roweState && roweState.duel_complete) {
      dismissBtn.style.display = '';
    }
  }
  
  available.forEach(qId => {
    const charData = window.CHARACTERS && window.CHARACTERS[charId];
    if (!charData) return;
    const q = charData.dialogue[qId];
    if (!q) return;
    const div = document.createElement('div');
    div.className = 'question-item';
    div.textContent = q.question;
    div.onclick = () => { if (typeof NocturneSound !== 'undefined') NocturneSound.playUIClick(); askQuestion(charId, qId); };
    list.appendChild(div);
  });
  if (available.length === 0) {
    list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);font-style:italic;">The conversation has been exhausted.</div>';
  }
}

function updateDeceptionButton() {
  const btn = document.getElementById('btn-show-evidence');
  const remaining = gameState.deceptions_remaining;
  if (remaining <= 0) {
    btn.textContent = 'No deceptions remaining.';
    btn.classList.add('empty');
  } else {
    btn.textContent = 'Show Evidence';
    btn.classList.remove('empty');
  }
}

// ── DECEPTION UI ───────────────────────────────────────────
function openDeceptionSelector() {
  if (gameState.deceptions_remaining <= 0) return;
  const panel = document.getElementById('deception-panel');
  const list  = document.getElementById('deception-items-list');
  const counter = document.getElementById('deception-slot-counter');
  const presentBtn = document.getElementById('btn-present-it');
  const backBtn    = document.getElementById('btn-put-back');

  counter.textContent = `${gameState.deceptions_remaining} slot${gameState.deceptions_remaining===1?'':'s'} remaining`;
  panel.dataset.item = '';
  presentBtn.style.display = 'none';
  backBtn.style.display = 'none';

  list.innerHTML = '';
  const eligible = gameState.inventory.filter(id => ITEMS[id] && ITEMS[id].is_deception_item);
  eligible.forEach(itemId => {
    const div = document.createElement('div');
    div.className = 'deception-item-card';
    div.textContent = ITEMS[itemId].name;
    div.onclick = () => selectDeceptionItem(itemId);
    list.appendChild(div);
  });

  if (eligible.length === 0) {
    list.innerHTML = '<div style="padding:14px 20px;font-size:12px;color:var(--text-dim);">No deception items available.</div>';
  }

  panel.classList.add('open');
}

function selectDeceptionItem(itemId) {
  document.querySelectorAll('.deception-item-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`dec-card-${itemId}`);
  if (card) card.classList.add('selected');

  const panel = document.getElementById('deception-panel');
  panel.dataset.item = itemId;

  const presentBtn = document.getElementById('btn-present-it');
  const backBtn    = document.getElementById('btn-put-back');
  const remaining  = gameState.deceptions_remaining;
  presentBtn.textContent = `Present It — ${remaining} slot${remaining===1?'':'s'} remaining`;
  presentBtn.style.display = 'block';
  backBtn.style.display = 'block';
}

function presentDeception() {
  const panel = document.getElementById('deception-panel');
  const itemId = panel.dataset.item;
  const slot = panel; // alias for animation code below
  if (!itemId || !_activeCharId) return;

  // Item travel animation — slot → portrait
  const slotEl = slot;
  const portrait = document.getElementById('char-portrait');
  if (slotEl && portrait) {
    const slotRect    = slotEl.getBoundingClientRect();
    const portraitRect = portrait.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position:fixed;
      left:${slotRect.left + slotRect.width/2}px;
      top:${slotRect.top + slotRect.height/2}px;
      width:32px;height:32px;margin:-16px;
      background:var(--gold-dim);border-radius:4px;border:1px solid var(--gold);
      font-size:10px;color:var(--cream);display:flex;align-items:center;justify-content:center;
      z-index:200;pointer-events:none;
      transition:left 300ms ease-in,top 300ms ease-in,opacity 300ms;
    `;
    ghost.textContent = (ITEMS[itemId]?.name || '').substring(0,6);
    document.body.appendChild(ghost);

    // Slight delay then travel
    setTimeout(() => {
      ghost.style.left = `${portraitRect.left + portraitRect.width/2}px`;
      ghost.style.top  = `${portraitRect.top  + portraitRect.height/2}px`;
      ghost.style.opacity = '0';
      // Portrait recoil on arrival
      if (portrait) {
        setTimeout(() => {
          portrait.style.transform = 'translateX(-2px) scale(0.98)';
          portrait.style.transition = 'transform 80ms ease-out';
          setTimeout(() => {
            portrait.style.transform = '';
            portrait.style.transition = 'transform 150ms ease-in';
          }, 150);
        }, 280);
      }
    }, 30);

    setTimeout(() => { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 400);
  }

  setTimeout(() => {
    fireDeception(_activeCharId, itemId);
    closeDeceptionPanel();
    updateDeceptionButton();
    // Delay renderQuestions so it doesn't overwrite the deception moment
    setTimeout(() => renderQuestions(_activeCharId), 2000);
  }, 320);
}

function putDeceptionBack() {
  document.querySelectorAll('.deception-item-card').forEach(c => c.classList.remove('selected'));
  const panel = document.getElementById('deception-panel');
  panel.dataset.item = '';
  document.getElementById('btn-present-it').style.display = 'none';
  document.getElementById('btn-put-back').style.display = 'none';
}

function closeDeceptionPanel() {
  document.getElementById('deception-panel').classList.remove('open');
}

function handleDeceptionResponse({ charId, text, is_effective }) {
  const resp = document.getElementById('char-response');
  const panel = document.getElementById('conversation-panel');
  if (!resp) return;

  if (!is_effective) {
    panel && panel.classList.add('deception-wasted');
    resp.style.color = 'rgba(160,60,40,0.9)';
    resp.textContent = 'A slot wasted. They noticed.';
    let _flashOn = true;
    const _flashTimer = setInterval(() => {
      _flashOn = !_flashOn;
      resp.style.opacity = _flashOn ? '1' : '0.3';
    }, 400);
    setTimeout(() => {
      clearInterval(_flashTimer);
      resp.style.opacity = '';
      panel && panel.classList.remove('deception-wasted');
      resp.style.color = '';
      resp.textContent = text;
    }, 5000);
    return;
  }

  // Effective — portrait dims, 800ms silence, then word by word
  resp.textContent = '';
  resp.style.opacity = '0.15';
  const activePortrait = document.querySelector('.conv-npc-portrait');
  if (activePortrait) {
    activePortrait.style.transition = 'filter 400ms';
    activePortrait.style.filter = 'brightness(0.4)';
  }
  setTimeout(() => {
    if (activePortrait) {
      activePortrait.style.filter = '';
      activePortrait.style.transition = 'filter 200ms';
    }
    resp.style.opacity = '';
    resp.style.transition = 'opacity 300ms';
    resp.style.color = 'rgba(200,180,120,1)';
    _typeDeceptionResponse(resp, text, 825);
    setTimeout(() => { resp.style.transition = ''; resp.style.color = ''; }, 600);
  }, 800);
}

function _typeDeceptionResponse(el, text, intervalMs) {
  const words = text.split(' ');
  let i = 0;
  el.textContent = '';
  const timer = setInterval(() => {
    if (i >= words.length) { clearInterval(timer); return; }
    el.textContent += (i === 0 ? '' : ' ') + words[i];
    i++;
  }, intervalMs);
}

function handleCredibilityChanged({ state, strikes }) {
  // Show brief notification
  const msgs = {
    noted: 'Your methods have been noted.',
    compromised: 'Your credibility is compromised.',
    discredited: 'You are discredited. Questions are closing.',
  };
  if (msgs[state]) showToast(msgs[state]);
}

// ── DISCOVERY ──────────────────────────────────────────────
function handleDiscoveryFired({ text, result_item }) {
  showToast(text || 'Discovery.');
  closeInventory();
}

function handleCombinationFailed() {
  // Brief visual shake on inventory — handled by CSS
  showToast('No connection between these items.');
}

function handlePartialDiscovery({ text }) {
  showToast(text || 'A third element is required.');
}

// ── PUZZLE ─────────────────────────────────────────────────
function handleOpenPuzzle({ puzzleType, chain }) {
  closeInventory();
  if (!window.openPuzzlePanel) { showToast(`Puzzle: ${puzzleType}`); return; }

  const discoveryText = chain.discovery_text_double || chain.discovery_text_single || null;

  if (discoveryText) {
    const overlay = document.createElement('div');
    overlay.id = 'puzzle-discovery-overlay';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:80',
      'background:#0a0805',
      'display:flex','flex-direction:column',
      'align-items:center','justify-content:center',
      'padding:40px 32px',
      'opacity:0','transition:opacity 600ms ease',
    ].join(';');

    const line = document.createElement('div');
    line.style.cssText = [
      'font-size:15px','line-height:1.8',
      'color:var(--cream-dim)',
      'text-align:center','max-width:320px',
      'font-family:Georgia,serif',
      'letter-spacing:0.02em',
    ].join(';');
    line.textContent = discoveryText;

    const puzzleSpec = window.PUZZLE_SPECS && window.PUZZLE_SPECS[puzzleType];
    const puzzleName = document.createElement('div');
    puzzleName.style.cssText = [
      'margin-top:32px',
      'font-size:10px','letter-spacing:0.35em',
      'text-transform:uppercase',
      'color:var(--gold-dim)',
      'font-family:var(--font-ui)',
      'opacity:0','transition:opacity 600ms ease',
    ].join(';');
    puzzleName.textContent = puzzleSpec?.title || puzzleType;

    overlay.appendChild(line);
    overlay.appendChild(puzzleName);
    document.body.appendChild(overlay);

    haptic([40]);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        setTimeout(() => { puzzleName.style.opacity = '1'; }, 800);
      });
    });

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        openPuzzlePanel(puzzleType, chain);
      }, 600);
    }, 2800);

  } else {
    openPuzzlePanel(puzzleType, chain);
  }
}

function closePuzzle() {
  document.getElementById('puzzle-panel').classList.remove('open');
}

function activateWalkthrough() {
  if (window._activePuzzleId) takeWalkthrough(window._activePuzzleId);
  document.getElementById('puzzle-walkthrough-btn').classList.remove('visible');
}

// ── PAYWALL ────────────────────────────────────────────────
function openPaywall() {
  const priceEl = document.getElementById('paywall-price');
  if (priceEl) priceEl.textContent = `£${NocturneConfig.PRICE_ESTATE.toFixed(2)}`;
  document.getElementById('paywall-screen').classList.add('active');
}

function closePaywall() {
  document.getElementById('paywall-screen').classList.remove('active');
}

function handlePurchase() {
  gameSettings.paidTierUnlocked = true;
  gameState.paidTierUnlocked = true;
  closePaywall();
  if (typeof initPaidTier === 'function') initPaidTier();
  if (typeof onProloguePaywallSuccess === 'function') {
    onProloguePaywallSuccess();
  } else {
    navigateTo('foyer');
    saveGame();
  }
}

function handlePaywallDecline() {
  closePaywall();
  if (typeof onProloguePaywallDecline === 'function') {
    onProloguePaywallDecline();
  } else {
    localStorage.clear();
    location.reload();
  }
}

// ── VERDICT DELIVERY ───────────────────────────────────────
function handleVerdictDelivery({ outcome, verdictString, nis }) {
  const screen = document.getElementById('verdict-screen');
  screen.classList.add('active');

  const isWrong       = !gameState.verdictTracker.first_accusation_correct && gameState.verdictTracker.investigation_closed;
  const isDeepPolitical = outcome === 'deep_political';
  const isDeepHuman   = outcome === 'deep_human';
  const isDeep        = isDeepPolitical || isDeepHuman;

  const curatorLine = isDeepPolitical
    ? '"The complete account. The Estate has not seen this before."'
    : isDeepHuman
    ? '"Two names. The Estate records both."'
    : isWrong
    ? '"The Estate has recorded a name. The record is now closed."'
    : '"The Estate has reached its verdict."';

  // Movement I — cast assembles (0ms)
  const cast = document.getElementById('verdict-cast');
  const dots = Array(10).fill(0).map(() => {
    const d = document.createElement('div');
    d.className = 'verdict-char-dot';
    return d;
  });
  cast.innerHTML = '';
  dots.forEach(d => cast.appendChild(d));
  setTimeout(() => cast.classList.add('visible'), 200);

  // Movement II — Curator (2000ms)
  const curEl = document.getElementById('verdict-curator-line');
  curEl.textContent = curatorLine;
  setTimeout(() => curEl.classList.add('visible'), 2000);

  // Movement III — name (5000ms)
  const nameEl = document.getElementById('verdict-name');
  const accusedId = gameState.verdictTracker.accused_target;
  const accusedChar = window.CHARACTERS && window.CHARACTERS[accusedId];
  nameEl.textContent = accusedChar ? accusedChar.display_name : (accusedId || 'The Surgeon');
  setTimeout(() => {
    nameEl.classList.add('visible');
    haptic([300]);
  }, 5000);

  // Movement IV — evidence (7000ms)
  const evEl = document.getElementById('verdict-evidence');
  const motiveItem = ITEMS[gameState.stage_evidence.motive];
  const meansItem  = ITEMS[gameState.stage_evidence.means];
  const momentItem = ITEMS[gameState.stage_evidence.moment];
  evEl.innerHTML = [
    motiveItem ? `Motive: ${motiveItem.name}` : null,
    meansItem  ? `Means: ${meansItem.name}`   : null,
    momentItem ? `Moment: ${momentItem.name}` : null,
  ].filter(Boolean).join('<br>');
  setTimeout(() => evEl.classList.add('visible'), 7000);

  // Movement V — verdict string (9000ms)
  const toneEl = document.getElementById('verdict-tone-text');
  toneEl.textContent = `"${verdictString}"`;
  setTimeout(() => toneEl.classList.add('visible'), 9000);

  // Final line (12000ms)
  const finalEl = document.getElementById('verdict-final-line');
  finalEl.textContent = getFinalLine(outcome, nis);
  setTimeout(() => finalEl.classList.add('visible'), 12000);
}

function getFinalLine(outcome, nis) {
  if (outcome === 'deep_political') return "The complete account. The killer named. The accomplice named. The organisation named. The manufactured betrayal named. Lord Ashworth built this investigation from his own death. The Estate has now completed it.";
  if (outcome === 'deep_human')     return "What lies beyond the Vault is not in this record.";
  if (outcome === 'surface')        return "The killer is named. Something sent him. The investigation is closed and the Estate has chosen not to ask who.";
  if (outcome === 'wrong' || outcome.startsWith('wrong_')) return "The truth does not cease to exist because it was not found. It waits.";
  return '';
}


// ── CHARACTER AVAILABLE ────────────────────────────────────
function handleCharacterAvailable({ charId, roomId, available }) {
  const dot = document.getElementById(`char-${charId}`);
  if (!dot) return;
  if (!available) dot.classList.add('clock-gated');
  else dot.classList.remove('clock-gated');
}

// ── NAVIGATION HELPERS ─────────────────────────────────────
function goToRoom(roomId) {
  if (roomId === 'stage') { openStage(); return; }
  navigateTo(roomId);
  renderCurrentRoom();
}

function renderCurrentRoom() {
  // Hide all rooms, show current
  document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
  const cur = document.getElementById(`room-${gameState.currentRoom}`);
  if (cur) cur.classList.add('active');
  // Update map
  updateCurrentRoomOnMap();
  // Update characters availability
  if (window.updateCharacterDots) updateCharacterDots(gameState.currentRoom);
}

// Expose
window.openMap = openMap;
window.closeMap = closeMap;
window.switchMapTab = switchMapTab;
window.openInventory = openInventory;
window.closeInventory = closeInventory;
window.openStage = openStage;
window.closeStage = closeStage;
window.tapPedestal = tapPedestal;
window.selectPedestalItem = selectPedestalItem;
window.clearPedestal = clearPedestal;
window.closePedestalSelector = closePedestalSelector;
window.openConversation        = openConversation;
window._openConversationDirect = _openConversationDirect;
window.closeConversation       = closeConversation;
window.updateComposureLabel    = updateComposureLabel;
window.openDeceptionSelector = openDeceptionSelector;
window.presentDeception = presentDeception;
window.putDeceptionBack = putDeceptionBack;
window.handleDragKeep = handleDragKeep;
window.handleDragDrop = handleDragDrop;
window.closeSlowDragPanel = closeSlowDragPanel;
window.closePuzzle = closePuzzle;
window.activateWalkthrough = activateWalkthrough;
window.openPaywall = openPaywall;
window.closePaywall = closePaywall;
window.handlePurchase = handlePurchase;
window.handlePaywallDecline = handlePaywallDecline;
window.closeExaminePanel = closeExaminePanel;
window.handleExamineMore = handleExamineMore;
window.handleExamineKeep = handleExamineKeep;
window.handleExamineDrop = handleExamineDrop;
window.handlePopupExamine = handlePopupExamine;
window.handlePopupPickUp = handlePopupPickUp;
window.handlePopupDrop = handlePopupDrop;
window.showToast = showToast;
window.showScreen = showScreen;
window.initMapUI = initMapUI;
window.initUI = initUI;
window.goToRoom = goToRoom;
window.renderCurrentRoom = renderCurrentRoom;
window.updateInventoryCounter = updateInventoryCounter;

// ── ASSET HELPERS ──────────────────────────────────────────
function getItemAsset(itemId) {
  const map = window.ITEM_ASSET_MAP || {};
  const file = map[itemId] || ('nocturne-item-' + itemId + '.png');
  return ASSET_BASE + 'items/' + file;
}

function getCharAsset(charId) {
  const map = window.CHAR_ASSET_MAP || {};
  const file = map[charId];
  if (file) return ASSET_BASE + file;
  return ASSET_BASE + 'characters/nocturne-char-' + charId + '-portrait.png';
}

function getPuzzleAsset(puzzleType) {
  const map = window.PUZZLE_ASSET_MAP || {};
  const file = map[puzzleType] || ('nocturne-puzzle-' + puzzleType + '.png');
  return ASSET_BASE + 'puzzles/' + file;
}

function getPropAsset(propId) {
  return ASSET_BASE + 'props/nocturne-prop-' + propId + '.png';
}

window.getItemAsset = getItemAsset;
window.getCharAsset = getCharAsset;
window.getPuzzleAsset = getPuzzleAsset;
window.getPropAsset = getPropAsset;

// ── ROOM NAVIGATION BAR ────────────────────────────────────
const ROOM_NAMES = {
  'train-compartment': 'The Compartment',
  'train-dining':      'The Dining Car',
  'train-rear':        'The Rear Car',
  'foyer': 'Foyer', 'gallery': 'Gallery', 'study': 'Study',
  'archive-path': 'Archive', 'lectern': 'Lectern', 'terrace': 'Terrace',
  'ballroom': 'Ballroom', 'antechamber': 'Antechamber', 'stage': 'Stage',
  'library': 'Library', 'physicians': 'Physicians', 'smoking': 'Smoking Room',
  'vault': 'Vault', 'wine-cellar': 'Wine Cellar', 'hedge-path': 'Hedge Path',
  'tunnel-passage': 'Tunnel',
  'maids-quarters': "Maid's Quarters",
  'groundskeeper-cottage': 'Groundskeeper Cottage',
  'map-room': 'Map Room',
  'dining-room': 'Dining Room',
  'trophy-room': 'Trophy Room',
  'billiard-room': 'Billiard Room',
  'weapons-room': 'Armory',
  'conservatory': 'Conservatory',
  'c1-arrival': 'Arrival', 'c3-original': 'Original Chamber',
  'c4-register': 'The Register', 'c5-correspondence': 'Letters',
  'c6-tunnel': 'Tunnel Mouth', 'c7-study': 'The Study',
  'c8-gallery': 'The Gallery',
};

const PAID_ROOMS = ['library','physicians','smoking','archive-path','vault'];
// antechamber + stage + balcony moved to free tier (paywall after antechamber, not before)
// wine-cellar excluded — only reachable via vault panel drag, already past paywall

// ── MAP-MIRRORING NAV LAYOUT ───────────────────────────────
// Each room defines how its adjacent rooms are grouped into rows,
// matching the visual tree on the map (top→bottom, left→right axis).
const NAV_LAYOUT = {
  // Each entry: { rows: [[...],[...]], split: N }
  // split = insert current room label after row index N (0 = before all rows, 1 = after first row, etc.)
  // ── ESTATE ─────────────────────────────────────────────────
  'foyer':        { rows: [['gallery', 'study']],                                                    split: 0 },
  'gallery':      { rows: [['foyer'], ['terrace']],                                                   split: 1 },
  'study':        { rows: [['foyer'], ['map-room']],                                                 split: 1 },
  // ── EAST WING — symmetric chain matches the map layout ──
  'map-room':     { rows: [['study'], ['dining-room', 'trophy-room']],                               split: 1 },
  'dining-room':  { rows: [['map-room'], ['conservatory']],                                          split: 1 },
  'trophy-room':  { rows: [['map-room'], ['weapons-room']],                                          split: 1 },
  'conservatory': { rows: [['dining-room'], ['billiard-room']],                                      split: 1 },
  'weapons-room': { rows: [['trophy-room'], ['billiard-room']],                                      split: 1 },
  'billiard-room':{ rows: [['conservatory', 'weapons-room']],                                        split: 0 },
  'archive-path': { rows: [['physicians', 'smoking']],                                                split: 0 },
  'terrace':      { rows: [['gallery'], ['ballroom'], ['maids-quarters', 'groundskeeper-cottage']], split: 1 },
  'maids-quarters': { rows: [['terrace'], ['groundskeeper-cottage']], split: 1 },
  'groundskeeper-cottage': { rows: [['terrace'], ['maids-quarters']], split: 1 },
  'ballroom':     { rows: [['terrace'], ['stage', 'balcony'], ['antechamber']],                      split: 1 },
  'antechamber':  { rows: [['ballroom'], ['library', 'physicians']],                                 split: 1 },
  'stage':        { rows: [['ballroom']],                                                            split: 1 },
  'balcony':      { rows: [['ballroom']],                                                            split: 1 },
  'library':      { rows: [['antechamber'], ['smoking']],                                            split: 1 },
  'physicians':   { rows: [['antechamber'], ['archive-path']],                                       split: 1 },
  'smoking':      { rows: [['library', 'archive-path'], ['vault']],                                  split: 1 },
  'vault':        { rows: [['smoking'], ['wine-cellar']],                                            split: 1 },
  'wine-cellar':  { rows: [['vault']],                                                               split: 1 },
  // ── COMPACT ────────────────────────────────────────────────
  'c6-tunnel':         { rows: [['c1-arrival']],                                                     split: 0 },
  'c1-arrival':        { rows: [['c6-tunnel'], ['c3-original', 'c7-study'], ['c5-correspondence', 'c8-gallery']], split: 1 },
  'c3-original':       { rows: [['c1-arrival'], ['c5-correspondence']],                              split: 1 },
  'c7-study':          { rows: [['c1-arrival']],                                                     split: 1 },
  'c5-correspondence': { rows: [['c3-original', 'c1-arrival'], []],                                  split: 1 },
  'c8-gallery':        { rows: [['c7-study', 'c1-arrival'], []],                                     split: 1 },
};

function renderRoomNav() {
  const nav = document.getElementById('room-nav');
  if (!nav) return;

  const trainScreen = document.getElementById('train-screen');
  const gameScreen  = document.getElementById('screen-game');
  if (trainScreen && trainScreen.style.display !== 'none') { nav.innerHTML = ''; return; }
  if (gameScreen && !gameScreen.classList.contains('active')) { nav.innerHTML = ''; return; }

  // Snapshot existing newly-discovered buttons before clearing —
  // reusing them preserves the running CSS animation (no restart).
  const _savedNewly = {};
  nav.querySelectorAll('.room-nav-btn.newly-discovered[data-room-id]').forEach(btn => {
    _savedNewly[btn.dataset.roomId] = btn;
  });

  nav.innerHTML = '';

  const current  = gameState.currentRoom;
  const adjacent = (window.ROOM_ADJACENCY && ROOM_ADJACENCY[current]) || [];
  const currentRoom = gameState.rooms[current];

  const essentials    = (window.ROOM_ESSENTIAL_OBJECTS && ROOM_ESSENTIAL_OBJECTS[current]) || [];
  const examinedHere  = essentials.filter(id => gameState.examined_objects.includes(id));
  const canLeave = examinedHere.length >= 1 || essentials.length === 0 || currentRoom?.completed;

  // Build label element — will be inserted at split position
  const labelRow = document.createElement('div');
  labelRow.style.cssText = 'width:100%;display:flex;justify-content:center;margin-bottom:4px;';
  const label = document.createElement('div');
  label.style.cssText = 'font-size:9px;color:var(--gold);letter-spacing:0.2em;text-transform:uppercase;padding:4px 0;';
  label.textContent = ROOM_NAMES[current] || current;
  labelRow.appendChild(label);

  if (!canLeave) {
    nav.appendChild(labelRow);
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:10px;color:var(--cream-dim);font-style:italic;padding:4px;letter-spacing:0.05em;';
    hint.textContent = 'Examine the room.';
    nav.appendChild(hint);
    NocturneEngine.emit('roomNavRendered', { roomId: current });
    return;
  }

  // Filter adjacent to only discovered rooms
  const visible = adjacent.filter(id => {
    if (id === 'vault' && !gameState.vaultDoorOpen) return false;
    if (id === 'wine-cellar' && !gameState.vaultDoorOpen) return false;
    const r = gameState.rooms[id];
    return r && r.state !== 'undiscovered';
  });

  if (visible.length === 0) {
    nav.appendChild(labelRow);
    NocturneEngine.emit('roomNavRendered', { roomId: current });
    return;
  }

  // Build rows from NAV_LAYOUT, insert current room label at split point
  const layoutDef = NAV_LAYOUT[current];
  const layoutRows = layoutDef ? layoutDef.rows : null;
  const splitAt = layoutDef ? layoutDef.split : 0;
  let rows;
  if (layoutRows && layoutRows.length > 0) {
    rows = layoutRows.map(row => row.filter(id => visible.includes(id))).filter(r => r.length > 0);
    const inLayout = layoutRows.flat();
    const extras = visible.filter(id => !inLayout.includes(id));
    if (extras.length > 0) rows.push(extras);
    if (rows.length === 0) rows = [visible];
  } else {
    rows = [visible];
  }

  // Render rows, inserting the current room label at splitAt index
  let labelInserted = false;
  rows.forEach((rowIds, idx) => {
    if (!labelInserted && idx >= splitAt) {
      nav.appendChild(labelRow);
      labelInserted = true;
    }
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:5px;justify-content:center;margin-bottom:4px;flex-wrap:wrap;';

    rowIds.forEach(roomId => {
      const roomState = (gameState.rooms[roomId] || {}).state;

      if (roomState === 'adjacent') {
        let btn = _savedNewly[roomId];
        if (!btn) {
          btn = document.createElement('button');
          btn.className = 'room-nav-btn newly-discovered';
          btn.dataset.roomId = roomId;
          btn.textContent = ROOM_NAMES[roomId] || roomId;
        }
        btn.onclick = () => {
          navigateTo(roomId);
          renderCurrentRoom();
          renderRoomNav();
        };
        row.appendChild(btn);
        return;
      }

      if (roomState !== 'visited' && roomState !== 'completed') return;

      const isPaid = PAID_ROOMS.includes(roomId) && !gameState.paidTierUnlocked;
      const btn = document.createElement('button');
      btn.className = 'room-nav-btn' + (isPaid ? ' locked' : '');
      btn.textContent = (ROOM_NAMES[roomId] || roomId) + (isPaid ? ' ·' : '');
      if (isPaid) btn.title = 'Paid tier required';
      btn.onclick = () => {
        if (isPaid) {
          if (gameState.prologueActive) {
            const haleAnswered = (gameState.char_dialogue_complete || {})['pemberton-hale'];
            const hasTalkedToHale = haleAnswered && Object.keys(haleAnswered).length > 0;
            if (!hasTalkedToHale) {
              if (typeof showToast === 'function') showToast('That room is not accessible.');
              return;
            }
          }
          openPaywall();
          return;
        }
        if (roomId === 'stage' || roomId === 'balcony') {
          if (gameState.prologueActive) {
            if (typeof showToast === 'function') showToast('That room is not accessible.');
            return;
          }
        }
        if (roomId === 'stage') { openStage(); return; }
        navigateTo(roomId);
        renderCurrentRoom();
        renderRoomNav();
      };
      row.appendChild(btn);
    });

    nav.appendChild(row);
  });

  if (!labelInserted) nav.appendChild(labelRow);

  NocturneEngine.emit('roomNavRendered', { roomId: current });
}

// Wire room nav to room changes and object examination

// ── ANTECHAMBER GATE ───────────────────────────────────────
// HUD icons hidden until player enters antechamber.
// Hotspots are always active (no popup gate).
// When antechamber entered: show all [data-hud-gate] elements,
// ensure Hale is in ROOM_CHARACTERS for the antechamber.

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (!gameState.antechamberGateOpen) {
      document.querySelectorAll('[data-hud-gate]').forEach(function(el) {
        el.style.display = 'none';
      });
    }
  }, 100);
});

NocturneEngine.on('roomEntered', function(payload) {
  const roomId = payload && payload.roomId;
  if (roomId !== 'antechamber') return;

  // Ensure Hale is in ROOM_CHARACTERS every time antechamber is entered
  if (window.ROOM_CHARACTERS) {
    const ac = window.ROOM_CHARACTERS['antechamber'] || [];
    if (!ac.includes('pemberton-hale')) {
      window.ROOM_CHARACTERS['antechamber'] = ['pemberton-hale'].concat(ac);
    }
  }
  // Also restore Hale's room field directly in case patches left it stale
  if (window.CHARACTERS && window.CHARACTERS['pemberton-hale']) {
    window.CHARACTERS['pemberton-hale'].room = 'antechamber';
  }
  // Rebuild character cards so portrait appears
  if (typeof window.rebuildCharCards === 'function') window.rebuildCharCards();
  if (typeof window.updateCharacterDots === 'function') window.updateCharacterDots('antechamber');

  // HUD reveal — one time only
  if (gameState.antechamberGateOpen) return;
  gameState.antechamberGateOpen = true;
  const _hudEls = document.querySelectorAll('[data-hud-gate]');
  _hudEls.forEach(function(el) { el.style.display = ''; });

  const _timers = new Map();

  function _pulseEl(el) {
    if (!el._pulsing) return;
    el.style.transition = 'opacity 350ms';
    el.style.opacity = '0.15';
    _timers.set(el, setTimeout(function() {
      if (!el._pulsing) return;
      el.style.opacity = '1';
      _timers.set(el, setTimeout(function() { _pulseEl(el); }, 500));
    }, 350));
  }

  function _stopEl(el) {
    el._pulsing = false;
    clearTimeout(_timers.get(el));
    el.style.transition = '';
    el.style.opacity = '1';
  }

  _hudEls.forEach(function(el) {
    el._pulsing = true;
    el.addEventListener('click', function() { _stopEl(el); }, { once: true });
    setTimeout(function() { _pulseEl(el); }, 200);
  });

  NocturneEngine.on('roomLeft', function _stopOnLeave(payload) {
    if (payload && payload.roomId === 'antechamber') {
      _hudEls.forEach(_stopEl);
      NocturneEngine.off('roomLeft', _stopOnLeave);
    }
  });

  if (typeof saveGame === 'function') saveGame();
});

// On paywall decline: re-hide icons, clear gate
// onProloguePaywallDecline defined in prologue.js — do not redefine here

NocturneEngine.on('roomEntered',   () => renderRoomNav());
NocturneEngine.on('objectExamined', () => renderRoomNav()); // unlock nav after examination
NocturneEngine.on('itemCollected',  () => renderRoomNav());
NocturneEngine.on('roomCompleted',  () => renderRoomNav());

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(renderRoomNav, 500);

  // Prevent clicks inside conversation panel content from reaching estate portrait cards
  ['char-response', 'questions-list', 'composure-state-label', 'conv-bottom-bar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => e.stopPropagation());
  });

  // Deception slot — first tap shows tutorial
  const decSlot = document.getElementById('deception-slot');
  if (decSlot) {
    decSlot.style.cursor = 'pointer';
    decSlot.addEventListener('click', () => {
      _showDeceptionTutorial();
    });
  }

  // Settings btn — touchend for instant mobile response
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('touchend', e => {
      e.preventDefault();
      _showResetMenu();
    }, { passive: false });
  }
});

function _showDeceptionTutorial() {
  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'deception-tutorial-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:90;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:32px;';

  const box = document.createElement('div');
  box.style.cssText = 'background:#0d0b07;border:1px solid rgba(184,150,12,0.4);padding:28px 24px;max-width:320px;text-align:center;';

  box.innerHTML = `
    <div style="font-size:10px;letter-spacing:0.3em;color:rgba(184,150,12,0.8);text-transform:uppercase;margin-bottom:16px;">Deception</div>
    <div style="font-size:13px;color:rgba(200,184,154,0.9);line-height:1.7;margin-bottom:24px;">
      You have three deception charges. During an interrogation, you may show a character misleading evidence. Their reaction will tell you something — but each use is permanent. Three charges. Once gone, they are gone.
    </div>
    <button style="padding:10px 28px;border:1px solid rgba(184,150,12,0.45);background:transparent;color:rgba(184,150,12,0.9);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;cursor:pointer;font-family:inherit;" id="dec-tutorial-close">Understood</button>
  `;

  overlay.appendChild(box);
  document.getElementById('app').appendChild(overlay);

  document.getElementById('dec-tutorial-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}


const _DECEPTION_ITEM_HINTS = {
  'estate-flower':        "Lady Ashworth left this. Shown during an interrogation, someone might find it meaningful — or incriminating.",
  'unsigned-letter':      "No signature. Shown to the right person, it could mean anything — or confirm everything.",
  'barons-incomplete-file': "Three pages are missing. A character who knows what's gone will react to what remains.",
  'operational-brief':    "A document that shouldn't exist here. Showing it tells a character you know more than you should.",
  'smoking-letters':      "Three years of correspondence. The tone changes at eighteen months. Someone will notice.",
  'study-decanter':       "One glass used. One untouched. A character who knows this evening will understand what that means.",
};

function _showDeceptionItemReminder(itemId) {
  const hint = _DECEPTION_ITEM_HINTS[itemId];
  if (!hint) return;
  const item = window.ITEMS && window.ITEMS[itemId];
  const name = item ? item.name : itemId;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;z-index:90;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;padding:32px;';

  const box = document.createElement('div');
  box.style.cssText = 'background:#0d0b07;border:1px solid rgba(184,150,12,0.4);padding:28px 24px;max-width:320px;text-align:center;';

  box.innerHTML = `
    <div style="font-size:9px;letter-spacing:0.3em;color:rgba(184,150,12,0.6);text-transform:uppercase;margin-bottom:8px;">Deception Item</div>
    <div style="font-size:12px;letter-spacing:0.1em;color:rgba(184,150,12,0.9);text-transform:uppercase;margin-bottom:16px;">${name}</div>
    <div style="font-size:13px;color:rgba(200,184,154,0.9);line-height:1.7;margin-bottom:24px;">${hint}</div>
    <button style="padding:10px 28px;border:1px solid rgba(184,150,12,0.45);background:transparent;color:rgba(184,150,12,0.9);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;cursor:pointer;font-family:inherit;" id="dec-item-close">Understood</button>
  `;

  overlay.appendChild(box);
  document.getElementById('app').appendChild(overlay);

  document.getElementById('dec-item-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
// ── SLOT PIP UPDATERS ──────────────────────────────────────
function updateEavesdropPips() {
  const remaining = gameState.eavesdrop_slots_remaining ?? 3;
  for (let i = 1; i <= 3; i++) {
    const pip = document.getElementById(`ear-pip-${i}`);
    if (!pip) continue;
    pip.className = 'slot-pip ' + (i <= remaining ? 'active' : 'spent');
  }
}

function updateDeceptionPips() {
  const remaining = gameState.deceptions_remaining ?? 3;
  for (let i = 1; i <= 3; i++) {
    const pip = document.getElementById(`dec-pip-${i}`);
    if (!pip) continue;
    pip.className = 'slot-pip ' + (i <= remaining ? 'active' : 'spent');
  }
}

// Wire to engine events
NocturneEngine.on('engineReady',      () => { updateEavesdropPips(); updateDeceptionPips(); });
NocturneEngine.on('deceptionUsed',    () => updateDeceptionPips());
NocturneEngine.on('eavesdropUsed',    () => updateEavesdropPips());
NocturneEngine.on('gameLoaded',       () => { updateEavesdropPips(); updateDeceptionPips(); });

// Also update after ask question (deceptions fire via fireDeception)
NocturneEngine.on('deceptionResponse', () => updateDeceptionPips());

window.updateEavesdropPips = updateEavesdropPips;
window.updateDeceptionPips = updateDeceptionPips;

// Hamburger — one tap shows lock/unlock state based on session_start timer
function openSettings() {
  _showResetMenu();
}
window.openSettings = openSettings;

const _RESET_COOLDOWN_MS = 30 * 1000; // 30 seconds for testing — change to 30 * 60 * 1000 for production
let _resetCountdownInterval = null;


function _formatResetTime(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m + ':' + s.toString().padStart(2, '0');
}

function _showResetMenu() {
  if (document.getElementById('reset-menu-overlay')) return;
  if (_resetCountdownInterval) { clearInterval(_resetCountdownInterval); _resetCountdownInterval = null; }

  // Timer starts from session_start (set at train haptics confirmation)
  const sessionStart = (window.gameState && window.gameState.verdictTracker && window.gameState.verdictTracker.session_start) || 0;
  const elapsed = Date.now() - sessionStart;
  const remaining = _RESET_COOLDOWN_MS - elapsed;
  const locked = sessionStart > 0 && remaining > 0;

  const overlay = document.createElement('div');
  overlay.id = 'reset-menu-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:95;background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;';

  const box = document.createElement('div');
  box.style.cssText = 'background:#0d0b07;border:1px solid rgba(184,150,12,0.3);padding:36px 28px;max-width:300px;width:100%;text-align:center;';

  function _close() {
    if (_resetCountdownInterval) { clearInterval(_resetCountdownInterval); _resetCountdownInterval = null; }
    overlay.remove();
  }

  if (locked) {
    // LOCKED — show countdown
    box.innerHTML =
      '<div style="font-size:36px;margin-bottom:16px;">🔒</div>' +
      '<div id="reset-countdown" style="font-size:32px;color:rgba(184,150,12,0.85);letter-spacing:0.08em;margin-bottom:8px;">' + _formatResetTime(remaining) + '</div>' +
      '<div style="font-size:11px;color:rgba(200,184,154,0.4);letter-spacing:0.1em;margin-bottom:28px;">until Begin Again is available</div>' +
      '<button id="reset-close-btn" style="padding:10px 28px;border:1px solid rgba(100,90,70,0.3);background:transparent;color:rgba(140,120,80,0.7);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;font-family:inherit;">Close</button>';

    overlay.appendChild(box);
    document.getElementById('app').appendChild(overlay);
    document.getElementById('reset-close-btn').addEventListener('click', _close);
    overlay.addEventListener('click', e => { if (e.target === overlay) _close(); });

    // Update display every second from the already-running background timer
    _resetCountdownInterval = setInterval(() => {
      const sess = (window.gameState && window.gameState.verdictTracker && window.gameState.verdictTracker.session_start) || 0;
      const rem = _RESET_COOLDOWN_MS - (Date.now() - sess);
      const el = document.getElementById('reset-countdown');
      if (rem <= 0) {
        clearInterval(_resetCountdownInterval);
        _resetCountdownInterval = null;
        overlay.remove();
        _showResetMenu();
        return;
      }
      if (el) el.textContent = _formatResetTime(rem);
    }, 1000);

  } else {
    // UNLOCKED — show unlock icon, tap to get warning
    box.innerHTML =
      '<div style="font-size:36px;margin-bottom:16px;">🔓</div>' +
      '<div style="font-size:13px;color:rgba(200,184,154,0.8);letter-spacing:0.05em;margin-bottom:28px;">Begin Again</div>' +
      '<button id="reset-begin-btn" style="width:100%;padding:13px;border:1px solid rgba(184,150,12,0.45);background:transparent;color:rgba(184,150,12,0.9);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;cursor:pointer;font-family:inherit;margin-bottom:10px;">Begin Again</button>' +
      '<button id="reset-close-btn2" style="width:100%;padding:10px;border:1px solid rgba(100,90,70,0.2);background:transparent;color:rgba(140,120,80,0.6);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;font-family:inherit;">Cancel</button>';

    overlay.appendChild(box);
    document.getElementById('app').appendChild(overlay);
    document.getElementById('reset-close-btn2').addEventListener('click', _close);
    overlay.addEventListener('click', e => { if (e.target === overlay) _close(); });

    document.getElementById('reset-begin-btn').addEventListener('click', () => {
      // Show warning confirmation
      box.innerHTML =
        '<div style="font-size:32px;margin-bottom:16px;">⚠️</div>' +
        '<div style="font-size:13px;color:rgba(200,184,154,0.9);line-height:1.7;margin-bottom:10px;">This will reset the entire investigation.</div>' +
        '<div style="font-size:11px;color:rgba(200,184,154,0.5);line-height:1.7;margin-bottom:8px;">All rooms, evidence, and interrogations are cleared.</div>' +
        '<div style="font-size:11px;color:rgba(184,150,12,0.6);line-height:1.7;margin-bottom:24px;">Your verdict record is permanent and will not be affected.</div>' +
        '<div style="display:flex;gap:12px;">' +
          '<button id="reset-confirm-btn" style="flex:1;padding:12px;border:1px solid rgba(184,150,12,0.5);background:transparent;color:rgba(184,150,12,0.9);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;font-family:inherit;">Confirm</button>' +
          '<button id="reset-cancel-btn" style="flex:1;padding:12px;border:1px solid rgba(100,90,70,0.3);background:transparent;color:rgba(140,120,80,0.7);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;font-family:inherit;">Cancel</button>' +
        '</div>';

      document.getElementById('reset-confirm-btn').addEventListener('click', () => {
        const verdict = localStorage.getItem('nocturne_franchise_record');
        localStorage.clear();
        if (verdict) localStorage.setItem('nocturne_franchise_record', verdict);
        location.reload();
      });
      document.getElementById('reset-cancel-btn').addEventListener('click', _close);
    });
  }
}

// ── MOMENT REVEAL — full screen, no chrome, word by word ───
// Fires on hedge gap discovery and wine cellar descend.
// The most important text in the game deserves its own canvas.
NocturneEngine.on('momentReveal', ({ type, text, haptic: hap, screenDim }) => {
  if (hap && hap.length && typeof haptic === 'function') haptic(hap);

  const overlay = document.createElement('div');
  overlay.id = 'moment-reveal-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:90;
    background:rgba(8,6,4,0);
    display:flex;align-items:center;justify-content:center;
    padding:48px 40px;
    transition:background 1500ms ease;
    pointer-events:none;
  `;

  const textEl = document.createElement('div');
  textEl.style.cssText = `
    max-width:300px;
    font-size:15px;
    color:rgba(212,201,168,0);
    line-height:1.9;
    font-style:italic;
    letter-spacing:0.03em;
    text-align:center;
    font-family:var(--font-body);
    transition:color 800ms ease;
  `;
  overlay.appendChild(textEl);
  document.body.appendChild(overlay);

  // Dim to near-black first
  requestAnimationFrame(() => {
    overlay.style.background = screenDim
      ? 'rgba(8,6,4,0.97)'
      : 'rgba(8,6,4,0.92)';
  });

  // Then text appears word by word
  setTimeout(() => {
    overlay.style.pointerEvents = 'auto';
    textEl.style.color = 'rgba(212,201,168,0.9)';

    if (typeof renderWordByWord === 'function') {
      renderWordByWord(textEl, text, 70);
    } else {
      textEl.textContent = text;
    }

    // Tap anywhere to dismiss after text completes
    const wordCount = text.split(' ').length;
    const readTime = Math.max(3000, wordCount * 70 + 1500);

    setTimeout(() => {
      const dismiss = () => {
        overlay.style.background = 'rgba(8,6,4,0)';
        textEl.style.color = 'rgba(212,201,168,0)';
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          // Vault and cellar: Uninvited appears after moment fades
          if (type === 'vault-door' || type === 'wine-cellar') {
            const roomId = type === 'wine-cellar' ? 'wine-cellar' : 'vault';
            if (typeof _uninvitedEncounter === 'function') _uninvitedEncounter(roomId);
          }
        }, 1000);
        overlay.removeEventListener('click', dismiss);
        overlay.removeEventListener('touchstart', dismiss);
      };
      overlay.addEventListener('click', dismiss, { once: true });
      overlay.addEventListener('touchstart', dismiss, { once: true });
    }, readTime);
  }, 800);
});



