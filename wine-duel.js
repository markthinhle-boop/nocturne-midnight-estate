// ============================================================================
// NOCTURNE — WINE DUEL · wine-duel.js
// The Steward. White and red wine. Free tier. No gating.
// ============================================================================

window.WINE_DUEL = (function() {

  // ==========================================================================
  // INJECT STYLES
  // ==========================================================================

  (function() {
    if (document.getElementById('wine-duel-styles')) return;
    const s = document.createElement('style');
    s.id = 'wine-duel-styles';
    s.textContent = `
/* ============================================================
   WINE DUEL STYLES
============================================================ */

.wd-overlay {
  position:fixed; inset:0;
  background:rgba(10,7,5,0.97);
  display:flex; align-items:center; justify-content:center;
  z-index:200; font-family:'Cormorant Garamond',serif;
}

.wd-panel {
  width:min(92vw,580px); max-height:88vh; overflow-y:auto;
  background:linear-gradient(180deg,#1f1812 0%,#150e0a 100%);
  border:1px solid #3a2e1f; border-radius:4px;
  padding:32px 36px; color:#ebd9b8;
  box-shadow:0 24px 80px rgba(0,0,0,0.7);
}

.wd-scene {
  font-style:italic; color:#8b7855; font-size:14px;
  border-left:2px solid #3a2e1f; padding-left:14px;
  margin:14px 0; line-height:1.65;
}

.wd-steward { font-size:16px; line-height:1.65; color:#ebd9b8; margin-bottom:12px; }
.wd-steward::before { content:'— '; color:#d9c79a; }
.wd-figure  { font-size:16px; line-height:1.65; color:#ebd9b8; margin-bottom:12px; }
.wd-figure::before  { content:'— '; color:#8b7855; }

.wd-region-name {
  font-size:24px; font-style:italic; color:#d9c79a; margin-bottom:4px;
}
.wd-victorian-name {
  font-size:11px; letter-spacing:0.2em; text-transform:uppercase;
  color:#8b7855; margin-bottom:18px;
}
.wd-dim-label {
  font-size:10px; letter-spacing:0.2em; text-transform:uppercase;
  color:#8b7855; margin-bottom:7px; margin-top:16px;
}

.wd-btn {
  background:transparent; border:1px solid #d9c79a; color:#d9c79a;
  font-family:'Cormorant Garamond',serif; font-size:13px;
  letter-spacing:0.12em; text-transform:uppercase;
  padding:9px 20px; cursor:pointer; margin-top:22px;
  transition:background 0.3s,color 0.3s;
}
.wd-btn:hover { background:#d9c79a; color:#1a1410; }
.wd-btn-row { display:flex; justify-content:space-between; align-items:center; margin-top:22px; }

.wd-dots { display:flex; gap:7px; }
.wd-dot { width:7px; height:7px; border-radius:50%; background:#3a2e1f; transition:background 0.4s; }
.wd-dot.done { background:#8b7855; }
.wd-dot.current { background:#d9c79a; box-shadow:0 0 5px #d9c79a; }

/* Map */
.wd-map-wrap {
  position:fixed; inset:0;
  background:#1a1410;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  z-index:200;
}
.wd-map-title {
  font-family:'Cormorant Garamond',serif;
  font-size:20px; font-style:italic; color:#d9c79a;
  margin-bottom:28px; letter-spacing:0.04em;
}
.wd-map-regions { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; max-width:640px; }
.wd-map-region {
  padding:12px 18px; border:1px solid #3a2e1f; border-radius:2px;
  font-family:'Cormorant Garamond',serif; font-size:15px; font-style:italic;
  color:#8b7855; cursor:pointer; text-align:center;
  transition:border-color 0.4s,color 0.4s,box-shadow 0.4s;
}
.wd-map-region:hover:not(.visited) { border-color:#8b7855; color:#d9c79a; }
.wd-map-region.visited {
  border-color:#d9c79a; color:#d9c79a;
  box-shadow:0 0 10px rgba(217,199,154,0.2);
}
.wd-map-region.visited.red { border-color:#a83838; color:#c98787; box-shadow:0 0 10px rgba(168,56,56,0.2); }
.wd-map-progress {
  font-family:'Cormorant Garamond',serif;
  font-size:13px; color:#8b7855; margin-top:20px; letter-spacing:0.08em;
}
.wd-map-cta {
  margin-top:28px;
}

/* Duel */
.wd-glass-number {
  font-size:11px; letter-spacing:0.22em; text-transform:uppercase;
  color:#8b7855; margin-bottom:14px;
}
.wd-pour {
  font-style:italic; color:#8b7855; font-size:14px;
  border-left:2px solid #3a2e1f; padding-left:14px;
  margin-bottom:18px; line-height:1.65;
}
.wd-hint { font-size:15px; line-height:1.65; color:#d9c79a; margin-bottom:22px; }
.wd-hint::before { content:'— '; }

.wd-q-label {
  font-size:10px; letter-spacing:0.2em; text-transform:uppercase;
  color:#8b7855; margin-bottom:9px; margin-top:18px;
}
.wd-options { display:flex; flex-wrap:wrap; gap:8px; }
.wd-option {
  padding:7px 12px;
  border:1px solid #2a1f15;
  border-radius:2px;
  font-family:'Cormorant Garamond',serif;
  font-size:13px;
  color:#8b7855;
  background:rgba(0,0,0,0.2);
  cursor:pointer;
  text-align:left;
  letter-spacing:0.04em;
  transition:border-color 0.25s, color 0.25s, background 0.25s;
  position:relative;
}
.wd-option::before {
  content:'';
  position:absolute;
  left:0; top:0; bottom:0;
  width:0;
  background:#d9c79a;
  transition:width 0.25s;
  border-radius:1px 0 0 1px;
}
.wd-option:hover {
  border-color:#3a2e1f;
  color:#c4b48a;
  background:rgba(217,199,154,0.04);
}
.wd-option.sel {
  border-color:#d9c79a;
  color:#d9c79a;
  background:rgba(217,199,154,0.08);
}
.wd-option.sel::before { width:2px; }

.wd-submit {
  width:100%;
  background:transparent;
  border:1px solid #3a2e1f;
  color:#8b7855;
  font-family:'Cormorant Garamond',serif;
  font-size:12px;
  letter-spacing:0.18em;
  text-transform:uppercase;
  padding:12px 0;
  cursor:pointer;
  transition:border-color 0.3s, color 0.3s, background 0.3s;
}
.wd-submit:not(:disabled):hover {
  border-color:#d9c79a;
  color:#d9c79a;
  background:rgba(217,199,154,0.06);
}
.wd-submit:disabled {
  opacity:0.35;
  cursor:default;
}

/* Dispute options */
.wd-dispute-opt {
  padding:14px 16px;
  border:1px solid #2a1f15;
  border-radius:2px;
  cursor:pointer;
  margin-bottom:10px;
  background:rgba(0,0,0,0.2);
  transition:border-color 0.3s, background 0.3s;
}
.wd-dispute-opt:hover {
  border-color:#d9c79a;
  background:rgba(217,199,154,0.06);
}
.wd-dispute-opt-label {
  font-family:'Cormorant Garamond',serif;
  font-size:16px;
  font-style:italic;
  color:#d9c79a;
  margin-bottom:4px;
}
.wd-dispute-opt-desc {
  font-size:12px;
  color:#8b7855;
  letter-spacing:0.04em;
}

.wd-reaction {
  font-size:15px; line-height:1.65; color:#ebd9b8;
  margin-top:18px; padding-top:16px;
  border-top:1px solid #3a2e1f;
}

/* Scoring card */
.wd-card {
  width:min(92vw,520px);
  background:#ebd9b8;
  background-image:radial-gradient(ellipse at center,rgba(255,248,232,0.3) 0%,transparent 70%);
  border:1px solid #6b5435;
  box-shadow:0 24px 60px rgba(0,0,0,0.6);
  font-family:'Cormorant Garamond',serif;
  color:#2a1f15; padding:36px 32px 28px; position:relative;
}
.wd-card::before,.wd-card::after {
  content:''; position:absolute; width:18px; height:18px; border:1px solid #6b5435;
}
.wd-card::before { top:7px; left:7px; border-right:none; border-bottom:none; }
.wd-card::after  { bottom:7px; right:7px; border-left:none; border-top:none; }

.wd-card-header { text-align:center; border-bottom:1px solid rgba(74,40,24,0.3); padding-bottom:14px; margin-bottom:18px; }
.wd-card-crest { font-size:18px; color:#4a2818; margin-bottom:5px; }
.wd-card-title { font-size:20px; font-style:italic; color:#1a1410; margin-bottom:3px; }
.wd-card-sub { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#6b5435; margin-bottom:5px; }
.wd-card-date { font-size:12px; font-style:italic; color:#6b5435; }

.wd-card-score { font-size:38px; font-style:italic; text-align:center; color:#1a1410; margin:12px 0 4px; }
.wd-card-max { font-size:20px; color:#8b7855; }
.wd-card-band { text-align:center; font-size:12px; letter-spacing:0.16em; text-transform:uppercase; margin-bottom:14px; }
.wd-band-perfect { color:#6b1f1f; font-weight:600; }
.wd-band-gold    { color:#8b6914; font-weight:600; }
.wd-band-silver  { color:#4a2818; }
.wd-band-bronze  { color:#6b3a20; }
.wd-band-fail    { color:#6b5435; font-style:italic; }

.wd-card-closing {
  margin:16px 0 10px; padding:12px 14px;
  background:rgba(74,40,24,0.06); border-left:2px solid #4a2818;
  font-size:13px; line-height:1.65;
}
.wd-card-closing-attr { font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:#6b5435; margin-bottom:3px; }
.wd-card-closing-text { font-style:italic; color:#1a1410; }

.wd-card-seal { text-align:center; font-size:28px; color:#8b1a1a; opacity:0.6; margin:10px 0 5px; }
.wd-card-footer { text-align:center; font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:#6b5435; font-style:italic; }

.wd-card-actions { margin-top:18px; display:flex; justify-content:center; gap:12px; }
.wd-card-btn {
  background:transparent; border:1px solid #4a2818; color:#2a1f15;
  font-family:'Cormorant Garamond',serif; font-size:12px; font-style:italic;
  letter-spacing:0.1em; padding:8px 18px; cursor:pointer;
  transition:background 0.3s,color 0.3s;
}
.wd-card-btn:hover { background:#4a2818; color:#ebd9b8; }

@media(max-width:600px) {
  .wd-panel { padding:22px 18px; }
  .wd-card  { padding:26px 18px 22px; }
  .wd-map-regions { gap:8px; }
  .wd-map-region { padding:10px 14px; font-size:14px; }
}
    `;
    document.head.appendChild(s);
  })();

  // ==========================================================================
  // STATE
  // ==========================================================================

  const STATE = {
    revealed: false,           // masked figure → Steward reveal
    act1WhiteComplete: false,
    act1RedComplete: false,
    duelStarted: false,
    duelComplete: false,
    bestScore: 0,
    bestBand: null,
    _save: function() {
      try { localStorage.setItem('nd_wineduel', JSON.stringify({
        revealed:this.revealed,
        act1WhiteComplete:this.act1WhiteComplete,
        act1RedComplete:this.act1RedComplete,
        duelComplete:this.duelComplete,
        bestScore:this.bestScore,
        bestBand:this.bestBand
      })); } catch(e) {}
    },
    _load: function() {
      try {
        const s = JSON.parse(localStorage.getItem('nd_wineduel')||'null');
        if (s) Object.assign(this, s);
      } catch(e) {}
    },
    reset: function() {
      this.revealed=false; this.act1WhiteComplete=false; this.act1RedComplete=false;
      this.duelStarted=false; this.duelComplete=false; this.bestScore=0; this.bestBand=null;
      try { localStorage.removeItem('nd_wineduel'); } catch(e) {}
    }
  };

  // ==========================================================================
  // ACT 1 — TEACHING REGIONS
  // ==========================================================================

  const REGIONS = {

    // WHITE WINES
    rhine: {
      id:'rhine', domain:'white', displayName:'The Rhine Valley', victorianName:'Hock',
      dims: [
        { label:'Origin', text:'Hock takes its name from Hochheim — a village on the Main, just before it joins the Rhine. The English shortened it. By Her Majesty\'s accession it had been Hock for a hundred years. Her Majesty drinks it. That is the reason it sits in every serious collection in England.', masked:'Hock takes its name from Hochheim — a village on the Main, just before it joins the Rhine. The English shortened it. By Her Majesty\'s accession it had been Hock for a hundred years and no one remembered it had once been a place.' },
        { label:'When It Is Served', text:'Fish course only, sir. Not before, not after. The glass for Hock is the Roemer — green stem, brown bowl. The bowl colour conceals what the eye does not need to see. Lord Ashworth used his. I polish them on Wednesdays.', masked:'Fish course only. Not before, not after. The glass for Hock is the Roemer — green stem, brown bowl. The bowl colour conceals what the eye does not need to see.' },
        { label:'How It Is Made', text:'Slate, sir. The Rhine grows on slate. Slate holds the heat of the sun through the night. Lord Ashworth said Hock tasted like an argument. He said this to a German baron. He had to explain. The conversation took time to recover.', masked:'Slate. The Rhine grows on slate. Slate holds the heat of the sun through the night. The grape ripens slowly because the climate is unkind, but the slate refuses to let the cold finish what it intended.' }
      ],
      closing: 'That is the Rhine, sir.', closingMasked: 'That is the Rhine.'
    },

    moselle: {
      id:'moselle', domain:'white', displayName:'The Moselle', victorianName:'Moselle',
      dims: [
        { label:'Origin', text:'Moselle comes by river — it joins the Rhine at Koblenz. The bottles are green. The Moselle merchants agreed two hundred years ago that green glass was theirs. The Rhine merchants agreed on brown. They have kept both promises. Lord Ashworth admired them for it.', masked:'Moselle comes by river — it joins the Rhine at Koblenz. The bottles are green. The Moselle merchants agreed two hundred years ago that green glass was theirs. The Rhine merchants agreed on brown. They have kept both promises for two hundred years.' },
        { label:'When It Is Served', text:'Afternoon wine, sir. Second-bottle wine. The wine for difficult conversations. Lighter on the palate. A man can speak honestly over a Moselle in a way he cannot over a Hock. Hock asks too much of him. Moselle asks nothing.', masked:'Afternoon wine. Second-bottle wine. The wine for difficult conversations. Lighter on the palate. A man can speak honestly over a Moselle in a way he cannot over a Hock. Hock asks too much of him. Moselle asks nothing.' },
        { label:'How It Is Made', text:'Slate again, sir, but the river is colder. Lord Ashworth said Moselle tasted like the Rhine after the Rhine had stopped trying to convince you of anything. He said this once. I wrote it down. It is mine.', masked:'Slate again, but the river is colder and the vineyards face differently. The same conversation between grape and soil, given a different sentence to finish. What this produces is something more delicate than Hock.' }
      ],
      closing: 'That is the Moselle, sir. Lighter than the Rhine.', closingMasked: 'That is the Moselle. Lighter than the Rhine.'
    },

    sauternes: {
      id:'sauternes', domain:'white', displayName:'Sauternes', victorianName:'Sauterne',
      dims: [
        { label:'Origin', text:'Sauterne — no final \'s\', which was the English usage. In 1855 Château d\'Yquem received a category no other wine received: Premier Cru Supérieur. Above the first growths. There are five bottles of 1847 Yquem in this house. One was opened twenty years ago, in this room. I poured. I did not drink. I remember the smell.', masked:'Sauterne — no final \'s\', which was the English usage. In 1855 Château d\'Yquem received a category no other wine received: Premier Cru Supérieur. Above the first growths. There are five bottles of 1847 Yquem in this house. One was opened in this room once. I was present. I remember the smell.' },
        { label:'When It Is Served', text:'The sweet course, sir. Always. A Sauterne at any other moment is a service error or a deliberate statement. I have not seen the deliberate statement at this Estate.', masked:'The sweet course. Always. A Sauterne at any other moment in the meal is a service error or a deliberate statement.' },
        { label:'How It Is Made', text:'Noble rot, sir. Botrytis cinerea. A fungus attacks the grape — the water evaporates, what remains is concentrated. Lord Ashworth said this was the only wine made by accepting damage. He said most things in life were the same.', masked:'Noble rot. Botrytis cinerea. A fungus attacks the grape — the water evaporates, what remains is concentrated. It is the only wine made by accepting damage. Most things worth having are the same.' }
      ],
      closing: 'That is Sauterne, sir. Five bottles of 1847 remain. I will not be the one to open the sixth.', closingMasked: 'That is Sauterne. Five bottles of 1847 remain in this house.'
    },

    champagne: {
      id:'champagne', domain:'white', displayName:'Champagne', victorianName:'Champagne',
      dims: [
        { label:'Origin', text:'Champagne was not always what it is now. The bubbles were a defect. In 1816 a widow named Clicquot perfected the riddling process — a way to clear dead yeast from the bottle without losing the pressure. After her, the defect became the style.', masked:'Champagne was not always what it is now. The bubbles were a defect. In 1816 a widow named Clicquot perfected the riddling process — a way to clear dead yeast from the bottle without losing the pressure. After her, the defect became the style.' },
        { label:'When It Is Served', text:'Arrival only, sir. Three fingers in a coupe. Lord Ashworth noticed deviation immediately. I poured two and a quarter fingers for a guest once. He said: it is fine. It is not. I never made the error again.', masked:'Arrival only. Three fingers in a coupe. The pour height is fixed. The moment is fixed. Deviation is a service error.' },
        { label:'How It Is Made', text:'Fermented twice, sir. The second fermentation happens in the bottle under pressure. The Widow\'s riddling removes the dead yeast by turning the bottle slowly, over weeks. Every Champagne you drink is a small miracle of patience.', masked:'Fermented twice. The second fermentation happens in the bottle under pressure. The riddling process removes the dead yeast by turning the bottle slowly, over weeks. Every Champagne you drink is a small miracle of patience.' }
      ],
      closing: 'That is Champagne, sir. The first glass of every gathering here. There will be no more poured tonight.', closingMasked: 'That is Champagne. The first glass of every gathering.'
    },

    madeira: {
      id:'madeira', domain:'white', displayName:'Madeira', victorianName:'Madeira',
      dims: [
        { label:'Origin', text:'Madeira comes from an island, sir. Portuguese, in the Atlantic. English ships stopped there and loaded the wine. The wine sat in the holds — heat, rocking, weeks. It was better when it arrived than when it left. There is one bottle in this house I cannot date. I date it by colour. There is a disagreement about it that has not been resolved in twelve years.', masked:'Madeira comes from an island. Portuguese, in the Atlantic. English ships stopped there and loaded the wine. The wine sat in the holds — heat, rocking, weeks. It was better when it arrived than when it left. There is one bottle in this house that cannot be dated. There is a disagreement about it.' },
        { label:'When It Is Served', text:'After dinner now, sir. The fashion changed under Her Majesty. Lord Ashworth served it twice in nineteen years — both times to guests who knew what they were being given. Both times the conversation that followed was unusually frank.', masked:'After dinner. The fashion for Madeira at the table has largely passed. It survives in serious houses as a wine for guests who know what they are being given.' },
        { label:'How It Is Made', text:'Fortified wine, sir. Then heat: wooden barrels in attic rooms under tile roofs, baked by the sun for years. The finest process is called canteiro. Lord Ashworth said the Madeira in this house was a finite quantity in the world and we had a duty to it. I have not opened one since he said it.', masked:'Fortified wine. Then heat: wooden barrels in attic rooms under tile roofs, baked by the sun for years. The finest process is called canteiro. The supply is finite and will not increase. The vine disease of 1852 and phylloxera of 1872 saw to that.' }
      ],
      closing: 'That is Madeira, sir. The undated bottle remains undated.', closingMasked: 'That is Madeira. There is a bottle in this house that cannot be dated. The disagreement about it continues.'
    },

    // RED WINES
    bordeaux: {
      id:'bordeaux', domain:'red', displayName:'Bordeaux', victorianName:'Claret',
      dims: [
        { label:'Origin', text:'Bordeaux is the Victorian red, sir. When an Englishman said wine at table he meant Claret. The 1855 Classification organised it into five growths, ranked by price. For the first growths the assumption that price tracked quality was not wrong. Lord Ashworth organised this entire side of the table around Claret.', masked:'Bordeaux is the Victorian red. When an Englishman said wine at table he meant Claret. The 1855 Classification organised it into five growths, ranked by price. The assumption that price tracked quality was not wrong for the first growths.' },
        { label:'When It Is Served', text:'Meat course, sir. The primary red. A formal dinner without Claret is either a statement of poverty or a statement of principle. Lord Ashworth served Claret at every dinner in this house. He made no statements of either kind.', masked:'Meat course. The primary red. A formal dinner without Claret is either a statement of poverty or a statement of principle.' },
        { label:'How It Is Made', text:'The left bank of Bordeaux builds on gravel, sir. Cabernet Sauvignon dominates because only Cabernet can push roots deep enough through gravel to find water in a dry summer. The soil selects the grape. The grape produces the wine the soil decided it would produce.', masked:'The left bank of Bordeaux builds on gravel. Cabernet Sauvignon dominates because only Cabernet can push roots deep enough through gravel to find water in a dry summer. The soil selects the grape.' }
      ],
      closing: 'That is Bordeaux, sir. The primary red. The one by which all others in this country are judged.', closingMasked: 'That is Bordeaux. The primary red.'
    },

    burgundy: {
      id:'burgundy', domain:'red', displayName:'Burgundy', victorianName:'Burgundy',
      dims: [
        { label:'Origin', text:'Burgundy is harder to source than Bordeaux and more variable, sir. Smaller plots. The Victorians considered this difficulty a mark of seriousness. There are three bottles of Burgundy in this house. I know their exact position. I have not moved them. They were placed here by Lord Ashworth\'s predecessor and I consider them still his property in the only sense that matters.', masked:'Burgundy is harder to source than Bordeaux and more variable. Smaller plots. The Victorians considered this difficulty a mark of seriousness. There are three bottles of Burgundy in this house that have not been moved since they were placed here.' },
        { label:'When It Is Served', text:'Special occasion wine, sir. Not every dinner. A Burgundy on the table signals the host has decided this evening is worth more than the standard. It has been opened twice in this house in the past twenty-three years. Both occasions are in the record with more detail than the entry usually warrants.', masked:'Special occasion wine. Not every dinner. A Burgundy on the table signals the host has decided this evening is worth more than the standard.' },
        { label:'How It Is Made', text:'Burgundy is Pinot Noir, sir. One grape, across a narrow strip of hillside called the Côte d\'Or. The grape is thin-skinned and difficult. It reflects what the year gave it without amendment. A great Burgundy vintage is great because the weather was kind. The winemaker has less room than he would like to admit.', masked:'Burgundy is Pinot Noir. One grape, across a narrow strip of hillside called the Côte d\'Or. The grape is thin-skinned and difficult. It reflects what the year gave it without amendment.' }
      ],
      closing: 'That is Burgundy, sir. Rarer here than the Claret. More demanding of the person who opens it.', closingMasked: 'That is Burgundy. Rarer than the Claret. More demanding of the person who opens it.'
    },

    rhone: {
      id:'rhone', domain:'red', displayName:'The Rhône', victorianName:'Hermitage',
      dims: [
        { label:'Origin', text:'The Victorians knew the northern Rhône as Hermitage, sir. It was used, for much of the century, to strengthen Claret — the practice was called Hermitaging. The négociants considered it improvement. Later generations considered it adulteration. The châteaux who requested it declined to discuss the subject publicly.', masked:'The Victorians knew the northern Rhône as Hermitage. It was used, for much of the century, to strengthen Claret — the practice was called Hermitaging. The négociants considered it improvement. Later generations considered it adulteration.' },
        { label:'When It Is Served', text:'Served alone it is a serious and unusual choice, sir. Its presence at a Victorian table indicated either a guest with specific knowledge or a host making a point. At this Estate it has been served alone on two occasions. I was present for one. I was not consulted on the other.', masked:'Served alone it is a serious and unusual choice. Its presence at a Victorian table indicated either a guest with specific knowledge or a host making a point.' },
        { label:'How It Is Made', text:'Hermitage is Syrah, sir. The grape produces a wine of exceptional density and tannin — more structured than Claret, less accommodating in youth, capable of extraordinary longevity. The patience it requires is, in my opinion, the correct amount of patience for something worth having.', masked:'Hermitage is Syrah. The grape produces a wine of exceptional density and tannin — more structured than Claret, less accommodating in youth, capable of extraordinary longevity.' }
      ],
      closing: 'That is Hermitage, sir. Used here more often as an ingredient than as a subject. Both roles are legitimate.', closingMasked: 'That is Hermitage. Used more often as an ingredient than as a subject. Both roles are legitimate.'
    },

    douro: {
      id:'douro', domain:'red', displayName:'The Douro', victorianName:'Port',
      dims: [
        { label:'Origin', text:'Port is the English gentleman\'s wine by treaty as much as by taste, sir. The Methuen Treaty of 1703 gave Portuguese wine preferential English tariffs. The English wine trade turned to Portugal during the wars with France. They found the Douro Valley. They fortified the wine for shipping. They found the fortification improved it. They kept the practice after the wars ended.', masked:'Port is the English gentleman\'s wine by treaty as much as by taste. The Methuen Treaty of 1703 gave Portuguese wine preferential English tariffs. The English wine trade turned to Portugal and found the Douro Valley. They fortified the wine for shipping. They found the fortification improved it.' },
        { label:'When It Is Served', text:'After dinner, sir. The gentlemen\'s room. In the Victorian convention this house maintained, the women withdrew and the Port appeared. I served it. I was never present for the conversation it accompanied. There were conversations at this table I was not meant to hear. I did not hear them.', masked:'After dinner. The gentlemen\'s room. In the Victorian convention, the women withdrew and the Port appeared. There were conversations at this table that were not meant to be heard. They were not heard.' },
        { label:'How It Is Made', text:'Fortification stops fermentation, sir. Grape spirit added to the fermenting wine kills the yeast before all the sugar converts. What remains is sweetness the yeast never reached. Vintage Port ages in bottle; Tawny Port ages in barrel. The two styles share a name and a river and very little else.', masked:'Fortification stops fermentation. Grape spirit kills the yeast before all the sugar converts. What remains is sweetness the yeast never reached. Vintage Port ages in bottle — deep ruby, decanted. Tawny Port ages in barrel — faded toward amber, no decanting needed.' }
      ],
      closing: 'That is Port, sir. The most consumed wine in this house by volume. The conversations it accompanied are not in any record I keep.', closingMasked: 'That is Port. The most consumed wine in this house by volume.'
    },

    tokaj: {
      id:'tokaj', domain:'red', displayName:'Tokaj', victorianName:'Tokay',
      dims: [
        { label:'Origin', text:'Tokay is Hungarian, sir. The Aszú grape, attacked by botrytis, measured in Puttonyos. Five Puttonyos means five hods of Aszú paste per barrel — a specific sweetness that became a language. The Pope received it. The Tsar received it. The Victorians considered its presence in a house a mark of serious intent. There is one bottle of it here. I have been asked to remove it twice. I declined both times.', masked:'Tokay is Hungarian. The Aszú grape, attacked by botrytis, measured in Puttonyos. Five Puttonyos means five hods of Aszú paste per barrel — a specific sweetness that became a language. The Victorians considered its presence in a house a mark of serious intent.' },
        { label:'When It Is Served', text:'After dinner, sir. Considered medicinal as well as pleasurable. Physicians prescribed it in earlier centuries. In Victorian England its service was a mark of distinction — a host who had been somewhere and brought something back. It has never been served at this Estate in my time here. I have poured from the bottle twice for assessment. The second time I did not write it down.', masked:'After dinner. Considered medicinal as well as pleasurable. In Victorian England its service was a mark of distinction — a host who had been somewhere and brought something back.' },
        { label:'How It Is Made', text:'Botrytis concentrates the grape, sir. The dried Aszú berries are collected individually over weeks, mashed into a paste, added to barrels of base wine. The number of Puttonyos determines the sweetness. Tokay ages for centuries. There are authenticated bottles in Hungarian state collections from the seventeenth century that are still alive. I find this fact more consoling than I expected to.', masked:'Botrytis concentrates the grape. The dried Aszú berries are collected individually, mashed into a paste, added to barrels of base wine. The number of Puttonyos determines the sweetness. Tokay ages for centuries. There are authenticated bottles from the seventeenth century that are still alive.' }
      ],
      closing: 'That is Tokay, sir. One bottle. Not to be opened tonight. Perhaps not to be opened at all.', closingMasked: 'That is Tokay. One bottle in this house. The disagreement about whether to open it continues.'
    },

    jerez: {
      id:'jerez', domain:'red', displayName:'Jerez', victorianName:'Sherry',
      dims: [
        { label:'Origin', text:'Sherry is an English corruption of Jerez — Jerez de la Frontera, a town in southern Spain, sir. The English could not pronounce Jerez. They produced Sherry. The Spanish accepted the situation. The wine trade has always been more practical than philological. This Estate kept both dry and sweet expressions. The dry is mine to serve. The sweet is also mine. I manage both sides of it.', masked:'Sherry is an English corruption of Jerez — Jerez de la Frontera, a town in southern Spain. The English could not pronounce Jerez. They produced Sherry. The Spanish accepted the situation. The wine trade has always been more practical than philological.' },
        { label:'When It Is Served', text:'Dry Sherry is the aperitif, sir — before dinner, in a copita, chilled. Sweet Sherry is post-dinner, room temperature, smaller pour. The confusion between these moments is the most reliable indicator of a household that has not thought carefully about its wine service.', masked:'Dry Sherry is the aperitif — before dinner, in a copita, chilled. Sweet Sherry is post-dinner, room temperature, smaller pour. The confusion between these moments is the most reliable indicator of a household that has not thought carefully about its wine service.' },
        { label:'How It Is Made', text:'Sherry ages under flor, sir — a layer of yeast that forms on the surface of Fino and Manzanilla, protecting them from oxidation. Oloroso is fortified to a higher level, killing the flor, and ages oxidatively. The two styles are made from the same grape in the same region by allowing or preventing the same biological process. They arrive at opposite ends of the flavour spectrum.', masked:'Sherry ages under flor — a layer of yeast that forms on the surface of Fino and Manzanilla, protecting from oxidation. Oloroso is fortified to a higher level, killing the flor, and ages oxidatively. The two styles are made from the same grape by allowing or preventing the same biological process.' }
      ],
      closing: 'That is Sherry, sir. Two wines in one name. The distinction matters more than most people allow.', closingMasked: 'That is Sherry. Two wines in one name. The distinction matters more than most people allow.'
    }
  };

  const WHITE_IDS = ['rhine','moselle','sauternes','champagne','madeira'];
  const RED_IDS   = ['bordeaux','burgundy','rhone','douro','tokaj','jerez'];
  const ALL_IDS   = [...WHITE_IDS, ...RED_IDS];

  // ==========================================================================
  // DUEL — 10 GLASSES (5 WHITE + 5 RED, MIXED)
  // ==========================================================================

  const GLASSES = [
    { id:'g1', truth:{ region:'rhine',     style:'hock',         occasion:'fish-course',  appearance:'pale-gold'  },
      pour:'Roemer. Brown bowl, green stem. Pale gold, slow legs.',
      hint:'The brown bowl tells you what the glass was made for, sir. The legs are slow but not heavy. The temperature was set before you arrived.',
      reactions:{ all_correct:'1868 Rüdesheimer Apostelwein. The colour, the legs, the bottle behind the glass. You read all of it. Lord Ashworth would have nodded.', partial:'The Rhine, sir. Hock. The brown bowl exists for one wine. Some of what I told you, you retained.', wrong:'Hock, sir. The Rhine. The brown bowl alone should have placed it within fifty miles. I told you this. Retain it now.' }
    },
    { id:'g2', truth:{ region:'bordeaux',  style:'claret',       occasion:'meat-course',  appearance:'ruby'       },
      pour:'Standard claret glass. Ruby with garnet at the rim. Slow legs.',
      hint:'The standard glass of this table, sir. Not a Roemer, not a coupe. The garnet at the rim tells you the wine is not young. The moment it belongs to is the most formal moment of any dinner.',
      reactions:{ all_correct:'1864 Léoville-Barton. Second growth Saint-Julien. You read the garnet edge correctly — it places this in the 1860s without the label. Lord Ashworth acquired twelve bottles in 1871. Eight remain.', partial:'Claret, sir. Bordeaux. The garnet edge and the standard glass together told you the region and the occasion.', wrong:'Claret, sir. Bordeaux. The standard glass was the first indication. Not a Roemer, not a coupe. The standard glass is for the wine that needs no ceremony because it is already the most important wine on the table.' }
    },
    { id:'g3', truth:{ region:'sauternes', style:'sauternes',    occasion:'sweet-course', appearance:'deep-gold'  },
      pour:'Small footed Sauterne glass. Deep gold. The legs roll slow and heavy.',
      hint:'The glass has changed, sir. This one is smaller and footed. The wine is sweet — you will know that when you taste it. The colour is gold at the depth that means concentration. The course it accompanies is fixed. There is one course. There is no second possibility.',
      reactions:{ all_correct:'1864 d\'Yquem. The vintage before the comet. The 1865 is what the world remembers. The 1864 is what a serious house keeps. I did not expect this on the third glass.', partial:'Sauterne, sir. Above the first growths. The small footed glass should have placed the style before the colour did.', wrong:'Sauterne, sir. The small footed glass exists for one wine at this table. The viscosity and the depth of colour confirmed it. You did not read either.' }
    },
    { id:'g4', truth:{ region:'douro',     style:'port',         occasion:'after-dinner', appearance:'deep-ruby'  },
      pour:'Port glass — narrow. Decanted first. Deep ruby, almost opaque.',
      hint:'The decanting before the pour, sir. The narrow glass. The depth of the colour. Three indications before I say a word. This wine has been in bottle for over twenty years.',
      reactions:{ all_correct:'1863 Graham\'s. A vintage Port of the kind that justifies the entire category. You identified the decanting, the glass, the depth of colour, and the moment correctly.', partial:'Port, sir. Douro. The decanting alone should have placed it — most wines at this table are not decanted. Port almost always is.', wrong:'Port, sir. Douro. The decanting procedure, the narrow glass, the depth of colour — all three indications. I told you Vintage Port is decanted. Tawny is not. You did not separate them.' }
    },
    { id:'g5', truth:{ region:'champagne', style:'champagne',    occasion:'arrival',      appearance:'pale-gold'  },
      pour:'Coupe — wide, shallow. Wired cork. Fine persistent bubbles. Pale gold, green at rim.',
      hint:'The coupe and the wired cork tell you the style before I pour, sir. Three fingers. The green at the rim tells you the wine is not old. The moment this belongs to is the first moment of any evening.',
      reactions:{ all_correct:'1874 Veuve Clicquot. The widow\'s house. Pour height correct, glass correct, moment correct. I am pouring you a second glass on principle.', partial:'Champagne, sir. The bubbles and the coupe alone should have placed it. There is no other wine that arrives this way.', wrong:'Champagne, sir. The wired cork, the coupe, the bubbles. Three indications. I told you Champagne is the arrival wine. It does not appear at any other moment by design.' }
    },
    { id:'g6', truth:{ region:'moselle',   style:'moselle',      occasion:'luncheon',     appearance:'pale-gold'  },
      pour:'Clear narrow glass. Green bottle. Pale gold, almost silver at the rim.',
      hint:'The bottle has changed colour, sir. So has the glass. Green bottle, clear glass — both for reasons I have already given you. The silver at the rim tells you the wine has aged. Older Moselle silvers. That tells you the decade.',
      reactions:{ all_correct:'1857 Bernkasteler Doctor. Moselle of the kind that justifies the river having a name of its own. You read it correctly — the silver at the rim told you the decade. The green bottle told you the river.', partial:'Moselle, sir. The green bottle and the clear glass were both telling you. The silver at the rim told you the age.', wrong:'Moselle, sir. Not Hock. The clear glass and the green bottle were both telling you. The Rhine arrives in a brown bottle in a brown-bowled Roemer. The Moselle does not.' }
    },
    { id:'g7', truth:{ region:'rhone',     style:'hermitage',    occasion:'meat-course',  appearance:'deep-ruby'  },
      pour:'Standard red glass. Deep ruby — darker than the Claret. Heavy legs. No decanting.',
      hint:'The colour is deeper than the Claret we tasted earlier, sir. The legs are heavier. No decanting procedure. The weight of colour comes from the grape itself, not fortification. I described a practice that used this wine as an ingredient in something else. This glass is what it is without that amendment.',
      reactions:{ all_correct:'1865 Paul Jaboulet Aîné La Chapelle. Hermitage. The depth of colour above Claret told you Syrah. The comet year on the Rhône. You followed the thread correctly.', partial:'Hermitage, sir. The Rhône. The depth of colour placed it above the Claret. Syrah extracts more pigment than Cabernet. The difference is visible.', wrong:'Hermitage, sir. The Rhône. I told you this wine was used to strengthen Claret. The colour is darker than anything Bordeaux produces in a standard vintage. You had three pieces of information and did not assemble them.' }
    },
    { id:'g8', truth:{ region:'madeira',   style:'madeira',      occasion:'after-dinner', appearance:'amber'      },
      pour:'Small narrow crystal glass. Squat dark bottle with dust. Amber — not gold. Heavy legs.',
      hint:'The colour has changed entirely, sir. This is not gold, not ruby — it is amber. The bottle is squat and dark. The glass is cut crystal. The wine has been heated, deliberately, for many years. The occasion for this wine has shifted in this reign. I told you where it now belongs.',
      reactions:{ all_correct:'1827 d\'Oliveira Verdelho. Older than I am, served the way Lord Ashworth\'s father served it before me. I have served this wine to four people in my career. You are now the fourth.', partial:'Madeira, sir. The island. The amber colour ruled out everything we tasted before it. None of the dry whites reach this. None of the reds either.', wrong:'Madeira, sir. The amber colour alone should have separated it from everything else on this table tonight. I told you the colour is the heat working over decades. You did not read the heat in it.' }
    },
    { id:'g9', truth:{ region:'burgundy',  style:'red-burgundy', occasion:'meat-course',  appearance:'ruby'       },
      pour:'Wider-bowl glass. Ruby — lighter than the Claret, translucent at the edge.',
      hint:'The bowl of this glass is wider than the Claret glass, sir. The colour is lighter — hold it to the light. Translucent at the edge. I told you about the grape that produces this. Thinner skin than Cabernet. Less colour extraction. The difference is in the glass right now.',
      reactions:{ all_correct:'Romanée-Conti. 1858. 1.8 hectares in the Côte de Nuits. One vineyard, one owner, one wine. I opened this bottle tonight for three reasons. The first is that you came this far. The second is that Lord Ashworth would have done the same. The third is mine.', partial:'Burgundy, sir. The lighter ruby and the translucent edge — Pinot Noir. The wider bowl confirmed the style. You found part of what the glass was telling you.', wrong:'Burgundy, sir. I told you no Claret of any serious vintage is this transparent. Pinot Noir extracts less colour than Cabernet. The translucence at the edge is the reading. You did not make it.' }
    },
    { id:'g10', isDisputed:true,
      truth:{ region:null, style:null, occasion:'after-dinner', appearance:'amber' },
      pour:'Small narrow glass. A bottle with no readable label. The wine pours amber-deep, viscous, ancient. Older than anything poured tonight.',
      hint:'This is the bottle I mentioned when I taught you Madeira, sir. The one I cannot date. I date it by colour and say it is Madeira — vinho da roda, wine that crossed the Atlantic twice. There is another view. Tonight you will be the one to decide.',
      disputePrompt:'Two possibilities. Which do you believe?',
      disputeOptions:[
        { id:'madeira', label:'Madeira — vinho da roda', desc:'Colour and body suggest a wine of the round trip.' },
        { id:'tokay',   label:'Tokay — pre-phylloxera', desc:'Bottle shape is pre-1850. The amber runs cool, not warm.' }
      ],
      reactions:{
        chose_madeira:'You have sided with my reading, sir. The colour told me. The warm amber of estufagem is not the same as the cooler amber of oxidative aging. I have been looking at this bottle for twelve years. I believe I am right. I note that believing oneself right is not the same as being right. The bottle remains undated.',
        chose_tokay:'You have sided against me, sir. The Tokay reading is defensible — the bottle shoulder is unusual for Portuguese glass. I have not changed my position in twelve years. I do not intend to change it tonight. But I note your reading. You are not the first to make it.'
      }
    }
  ];

  // ==========================================================================
  // SCORING
  // ==========================================================================

  const MAX_PER_GLASS = 12;
  const GLASS_COUNT   = GLASSES.length - 1; // disputed glass scores 0
  const MAX_TOTAL     = GLASS_COUNT * MAX_PER_GLASS; // 108

  function scoreGlass(truth, answers) {
    let total = 0;
    const d = {};
    const appr = answers.appearance === truth.appearance;
    d.appearance = { correct:appr, points:appr?2:0 }; total += d.appearance.points;
    const adj = truth.region
      ? (answers.region===truth.region ? 'exact' : (REGIONS[truth.region]?.adjacentTo||[]).includes?.(answers.region) ? 'adjacent' : 'wrong')
      : 'wrong';
    const rp = adj==='exact'?3:adj==='adjacent'?1:0;
    d.region = { score:adj, points:rp }; total += rp;
    const sty = answers.style===truth.style;
    d.style = { correct:sty, points:sty?4:0 }; total += d.style.points;
    const occ = answers.occasion===truth.occasion;
    d.occasion = { correct:occ, points:occ?3:0 }; total += d.occasion.points;
    return { total, detail:d };
  }

  function band(total) {
    const p = total/MAX_TOTAL;
    if (total===MAX_TOTAL) return 'perfect';
    if (p>=0.82) return 'gold';
    if (p>=0.70) return 'silver';
    if (p>=0.60) return 'bronze';
    return 'fail';
  }

  // ==========================================================================
  // CLOSING LINES
  // ==========================================================================

  const CLOSING = {
    fail:    { attr:'— The Steward', text:'Sir. The wines are still here. They will be here when you return. I will be here when you return. Lord Ashworth taught me that a man who is willing to learn is more valuable than a man who already knows. You are willing. Come back when you are ready.' },
    bronze:  { attr:'— The Steward', text:'Sir. You passed. Not by much. Lord Ashworth would have said that the line between knowing and not knowing is exactly where you stood tonight. He would have said this with respect. Not all who cross that line do.' },
    silver:  { attr:'— The Steward', text:'Sir. A serious result. You read more than most guests of this Estate ever did. Lord Ashworth would have asked who taught you. I would have said: he did. He would not have argued.' },
    gold:    { attr:'— The Steward', text:'Sir. I have served at this table for thirty years. I have seen four guests read this many wines correctly. You are the fifth. I note this without ceremony. Lord Ashworth would have noted it the same way. He would have poured another glass and said nothing. So will I.' },
    perfect: { attr:'— The Steward', text:'Sir. I am going to say something I have not said in service in nineteen years. You have just done what Lord Ashworth himself could not do on his last attempt. He missed the 1862 Schloss Johannisberg — he insisted it was a Moselle until I poured a second glass. He laughed for the first time in two months. He said: someone will surpass me one evening. I hope I am the one to pour for them. Sir. I think he was you.' }
  };

  // ==========================================================================
  // DUEL RUNNER
  // ==========================================================================

  const DUEL = {
    _idx: 0,
    _results: [],
    _total: 0,
    _answers: {},

    start: function() {
      this._idx = 0;
      this._results = [];
      this._total = 0;
      this._answers = {};
      STATE.duelStarted = true;
    },

    current: function() { return GLASSES[this._idx] || null; },

    setAnswer: function(question, value) { this._answers[question] = value; },

    submit: function() {
      const g = this.current();
      if (!g) return null;

      if (g.isDisputed) {
        const choice = this._answers.disputeChoice;
        const reaction = g.reactions[`chose_${choice}`] || '';
        this._results.push({ id:g.id, isDisputed:true, choice, total:0 });
        this._idx++;
        this._answers = {};
        return { isDisputed:true, choice, reaction, last:this._idx >= GLASSES.length };
      }

      const score = scoreGlass(g.truth, this._answers);
      const allC = score.detail.appearance.correct && score.detail.region.score==='exact' && score.detail.style.correct && score.detail.occasion.correct;
      const allW = !score.detail.appearance.correct && score.detail.region.score==='wrong' && !score.detail.style.correct && !score.detail.occasion.correct;
      const reaction = allC ? g.reactions.all_correct : allW ? g.reactions.wrong : g.reactions.partial;

      this._total += score.total;
      this._results.push({ id:g.id, total:score.total, detail:score.detail, truth:g.truth });
      this._idx++;
      this._answers = {};

      return { score, reaction, truth:g.truth, last:this._idx >= GLASSES.length };
    },

    finish: function() {
      const total = this._total;
      const b = band(total);
      const passed = total >= MAX_TOTAL * 0.60;
      if (passed) {
        STATE.duelComplete = true;
        if (total > STATE.bestScore) { STATE.bestScore = total; STATE.bestBand = b; }
        STATE._save();
      }
      return { total, max:MAX_TOTAL, band:b, passed, closing:CLOSING[b]||CLOSING.fail, results:this._results };
    }
  };

  // ==========================================================================
  // REVEAL BEAT
  // ==========================================================================

  const REVEAL = {
    beat: [
      { type:'scene', text:'The masked figure at the table sets down their glass and removes their mask.' },
      { type:'steward', text:'Sir. You have been asking me questions all evening. You did not ask the right ones here.' },
      { type:'scene', text:'It is the Steward. The man you have been questioning since you arrived.' }
    ],
    trigger: function() {
      STATE.revealed = true;
      STATE._save();
    }
  };

  // ==========================================================================
  // ADJACENCY (for region scoring)
  // ==========================================================================

  const ADJACENCY = {
    rhine:     ['moselle'],
    moselle:   ['rhine'],
    sauternes: ['bordeaux'],
    champagne: [],
    madeira:   [],
    bordeaux:  ['sauternes','burgundy'],
    burgundy:  ['bordeaux','rhone'],
    rhone:     ['burgundy'],
    douro:     ['jerez'],
    tokaj:     [],
    jerez:     ['douro']
  };

  // Patch adjacency into scoreGlass
  const _orig = scoreGlass;
  const scoreGlassFinal = function(truth, answers) {
    let total = 0;
    const d = {};
    const appr = answers.appearance === truth.appearance;
    d.appearance = { correct:appr, points:appr?2:0 }; total += d.appearance.points;
    let adj = 'wrong';
    if (truth.region) {
      if (answers.region === truth.region) adj = 'exact';
      else if ((ADJACENCY[truth.region]||[]).includes(answers.region)) adj = 'adjacent';
    }
    const rp = adj==='exact'?3:adj==='adjacent'?1:0;
    d.region = { score:adj, points:rp }; total += rp;
    const sty = answers.style === truth.style;
    d.style = { correct:sty, points:sty?4:0 }; total += d.style.points;
    const occ = answers.occasion === truth.occasion;
    d.occasion = { correct:occ, points:occ?3:0 }; total += d.occasion.points;
    return { total, detail:d };
  };
  DUEL.submit = function() {
    const g = this.current();
    if (!g) return null;
    if (g.isDisputed) {
      const choice = this._answers.disputeChoice;
      const reaction = g.reactions[`chose_${choice}`] || '';
      this._results.push({ id:g.id, isDisputed:true, choice, total:0 });
      this._idx++;
      this._answers = {};
      return { isDisputed:true, choice, reaction, last:this._idx >= GLASSES.length };
    }
    const score = scoreGlassFinal(g.truth, this._answers);
    const allC = score.detail.appearance.correct && score.detail.region.score==='exact' && score.detail.style.correct && score.detail.occasion.correct;
    const allW = !score.detail.appearance.correct && score.detail.region.score==='wrong' && !score.detail.style.correct && !score.detail.occasion.correct;
    const reaction = allC ? g.reactions.all_correct : allW ? g.reactions.wrong : g.reactions.partial;
    this._total += score.total;
    this._results.push({ id:g.id, total:score.total, detail:score.detail, truth:g.truth });
    this._idx++;
    this._answers = {};
    return { score, reaction, truth:g.truth, last:this._idx >= GLASSES.length };
  };

  // ==========================================================================
  // SCORING CARD RENDERER
  // ==========================================================================

  const CARD = {
    show: function(result) {
      this.dismiss();
      const date = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      const bandLabel = { fail:'Did not pass', bronze:'Bronze', silver:'Silver', gold:'Gold', perfect:'Perfect' }[result.band];
      const o = document.createElement('div');
      o.id = 'wd-card-overlay';
      o.className = 'wd-overlay';
      o.innerHTML = `<div class="wd-card">
        <div class="wd-card-header">
          <div class="wd-card-crest">❦</div>
          <div class="wd-card-title">The Ashworth Estate</div>
          <div class="wd-card-sub">Private Cellar Assessment</div>
          <div class="wd-card-date">${date}</div>
        </div>
        <div class="wd-card-score">${result.total} <span class="wd-card-max">of ${result.max}</span></div>
        <div class="wd-card-band wd-band-${result.band}">${bandLabel}</div>
        <div class="wd-card-closing">
          <div class="wd-card-closing-attr">${result.closing.attr}</div>
          <div class="wd-card-closing-text">"${result.closing.text}"</div>
        </div>
        <div class="wd-card-seal">✦</div>
        <div class="wd-card-footer">The Ashworth Estate · The Dining Room</div>
        <div class="wd-card-actions">
          <button class="wd-card-btn" onclick="window.WINE_DUEL.card.dismiss()">Close</button>
          ${!result.passed ? '<button class="wd-card-btn" onclick="window.WINE_DUEL.retry()">Try Again</button>' : ''}
        </div>
      </div>`;
      document.body.appendChild(o);
      setTimeout(() => o.style.opacity='1', 50);
    },
    dismiss: function() {
      const o = document.getElementById('wd-card-overlay');
      if (o) o.remove();
    }
  };

  // ==========================================================================
  // LOAD STATE
  // ==========================================================================

  STATE._load();

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  return {
    state:   STATE,
    regions: REGIONS,
    whites:  WHITE_IDS,
    reds:    RED_IDS,
    all:     ALL_IDS,
    glasses: GLASSES,
    duel:    DUEL,
    reveal:  REVEAL,
    card:    CARD,

    // Helpers
    isRevealed:  function() { return STATE.revealed; },
    dimText:     function(dim) { return (!STATE.revealed && dim.masked) ? dim.masked : dim.text; },
    speakerType: function() { return STATE.revealed ? 'steward' : 'figure'; },
    act1Done:    function() { return STATE.act1WhiteComplete && STATE.act1RedComplete; },
    markWhiteDone: function() { STATE.act1WhiteComplete = true; STATE._save(); },
    markRedDone:   function() { STATE.act1RedComplete   = true; STATE._save(); },

    retry: function() {
      CARD.dismiss();
      DUEL.start();
    },

    devReset: function() {
      STATE.reset();
      DUEL._idx=0; DUEL._results=[]; DUEL._total=0; DUEL._answers={};
      CARD.dismiss();
    },
    devSkipTeaching: function() {
      STATE.act1WhiteComplete = true;
      STATE.act1RedComplete   = true;
      STATE.revealed          = true;
      STATE._save();
    }
  };

})();
