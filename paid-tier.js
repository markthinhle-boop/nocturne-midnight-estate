// ============================================================
// NOCTURNE — paid-tier.js
// Paid tier rooms: Ballroom through Wine Cellar
// Vault: two separate conditions (door=token, file=token+compactCaseAssembled)
// Ballroom approach: mandatory first-entry event
// KB v6 Final · Nocturne Studios LLC · MMXXVI
// ============================================================

'use strict';

// Paid room descriptions WORD FOR WORD from KB v6 Section XI
const PAID_ROOM_DESCRIPTIONS = {
  "ballroom": "The Rite was supposed to be the most important thing that happened tonight. It has been demoted.\n\nLord Edmund Ashworth is at the Register lectern with the expression of a man who has made his final point. His right hand is pointing at something. Nobody has moved it. Nobody is quite ready to decide what it means.\n\nTen masked figures stand in various arrangements of shock. The shock is real. What varies is what they are shocked about.",
  "antechamber": "Pemberton-Hale is here because here is where people go when they want to be seen waiting. He has been in this room for twenty minutes. He has a writing case and gloves and the expression of a man who has been patient for eight years and found it was worth it.\n\nThe mirror is positioned to show the corridor. He positioned it. He has been watching the corridor, through the mirror, for twenty minutes, with the patience of someone who knew what was coming and wanted to see it arrive.",
  "stage": "The Stage is the only room in the Estate with nothing in it. One chair. Three evidence pedestals. A ceiling that is slightly too high.\n\nIn a society built on performance, the room for judgment contains only what you brought into it.",
  "library": "Sir Greaves has been in this room since seven o'clock. He would like you to know this. He mentioned it before you asked.\n\nThe Library is the kind of room that belongs to a man who reads not for pleasure but for advantage. Everything on the shelves is useful. The chair faces the door.",
  "physicians": "Dr. Harriet Crane arrived two minutes after the body was found. Her medical bag was already open when she entered the Ballroom, which is either excellent preparation or advance knowledge, and the two are not as different as she would prefer.\n\nShe has been in this room since. She has the manner of someone waiting for a conversation they have already had several times in their head.",
  "smoking": "The Baron is here because there is nowhere else to go when you know who did it and cannot say so without explaining how you know.\n\nHis drink is untouched. He has picked it up four times and put it back down. He is deciding something. He has been deciding it since 8:01.",
  "vault": "The Vault is the room that everyone in this Estate has been managing their relationship with for eleven years. Some of them put things in it. Some of them would like things taken out. One of them killed a man to stop it being opened.\n\nIt is open now.",
  "wine-cellar": "The Wine Cellar is below the Vault, which is below the truth, which is below everything Ashworth built in forty years and two of his associates spent six of those years protecting.\n\nThe Uninvited is already here. He turns when he hears you on the stairs. He doesn't look surprised. He doesn't look like a man who gets surprised.",
};

function initPaidTier() {
  // Add room descriptions
  Object.assign(window.ROOM_DESCRIPTIONS || {}, PAID_ROOM_DESCRIPTIONS);

  // Set up vault interactions
  setupVaultInteractions();

  // Update room descriptions source
  if (window.ROOM_DESCRIPTIONS) {
    Object.assign(window.ROOM_DESCRIPTIONS, PAID_ROOM_DESCRIPTIONS);
  }

  NocturneEngine.emit('paidTierReady', {});
}

// ── BALLROOM FIRST ENTRY ───────────────────────────────────
// Body sting fires on first ballroom entry — handled by roomEntered event in engine
// No approach text — the room description carries the moment

// ── VAULT ──────────────────────────────────────────────────
function setupVaultInteractions() {
  // Override vault hotspots with correct two-layer behavior
  const vaultDoorHs = document.getElementById('hs-vault-door');
  if (vaultDoorHs) {
    vaultDoorHs.addEventListener('click', (e) => {
      e.stopPropagation();
      tapVaultDoor();
    });
  }

  const vaultFileCaseHs = document.getElementById('hs-vault-file-case');
  if (vaultFileCaseHs) {
    vaultFileCaseHs.addEventListener('click', (e) => {
      e.stopPropagation();
      tapVaultFileCase();
    });
  }
}

// ── NAVIGATE TO PAID ROOMS ─────────────────────────────────
function navigateToPaidRoom(roomId) {
  if (!gameState.paidTierUnlocked) {
    openPaywall();
    return;
  }
  navigateTo(roomId);
  if (typeof renderCurrentRoom === 'function') renderCurrentRoom();
}

// ── PAYWALL TRIGGER ────────────────────────────────────────
function checkPaywallTrigger(roomId) {
  const paidRooms = ["ballroom","antechamber","stage","library","physicians","smoking","vault","wine-cellar"];
  if (paidRooms.includes(roomId) && !gameState.paidTierUnlocked) {
    openPaywall();
    return true;
  }
  return false;
}

window.initPaidTier = initPaidTier;
window.navigateToPaidRoom = navigateToPaidRoom;
window.checkPaywallTrigger = checkPaywallTrigger;
window.PAID_ROOM_DESCRIPTIONS = PAID_ROOM_DESCRIPTIONS;
