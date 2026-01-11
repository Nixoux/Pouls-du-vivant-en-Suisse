// ---------------- Setup ----------------

let W = 1200; //W/H = taille fixe du SVG
let H = 360;
let margin = { top: 24, right: 24, bottom: 24, left: 24 };
let innerW = W - margin.left - margin.right; //innerW/innerH = zone utile (sans marges)
let innerH = H - margin.top - margin.bottom;


let N = 520;               // Nombre de points visible à un instant donné
let POINTS_PER_TICK = 2;   // (combien de points ajoutés par frame)
let TARGET_FPS = 60;
let MS_PER_FRAME = 1500 / TARGET_FPS; //Finalement, si je ne me trompe pas, on est plutôt autour des 40fps comme ça


let minAmp = 8; // minAmp / maxAmp = amplitude min et max du “battement”
let maxAmp = innerH * 0.42;
let baselineY = innerH * 0.5; //baselineY = ligne de base du signal ( qui n'est pas visible pour l'instant)





//        ----------------  UTILITAIRES ----------------


function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); } //évite de sortir des limites, ex: force une valeur à rester entre 0 et 1. Conseillé par CHATGPT 5.2 après que j'ai essayé de travailler sans. 




//RNG déterministe : même seed => même séquence "random", merci minecraft <3
//utile pour que l’animation se répète identiquement à chaque reload 
//  https://github.com/cprosche/mulberry32

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; 
  };
}



//Permet de mélanger events toujours de la même façon (si seed identique), J'ai demandé de l'aide à une IA (ChatGPT 5.2 Thinking) pour cette fonction.
// J'ai appris après coup qu'il s'agit d'un shuffle Fisher-Yates : https://dev.to/tanvir_azad/fisher-yates-shuffle-the-right-way-to-randomize-an-array-4d2p

function shuffleInPlaceSeeded(arr, seed=12345){ 
  let rng = mulberry32(seed);

  for (let i = arr.length - 1; i > 0; i--){
    let j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


// ---------------- Traitement des données ----------------


let events = []; //à la fin du JS, je charge le CSV. Ce tableau est celui dans lequel je récupère chaque ligne (espèce)



// MAPPING DES LABEL DE MENACES -> convertit des codes en un label + extinctionLevel est utilisé pour l’amplitude du signal (plus grave => plus haut )
let MENACE_MAP = {
  "EX":    { label: "éteint", extinctionLevel: 5 },
  "EW":    { label: "éteint à l'état sauvage", extinctionLevel: 5 },
  "RE":    { label: "éteint en Suisse", extinctionLevel: 5 },
  "CR(PE)":{ label: "disparu, probablement éteint en Suisse", extinctionLevel: 5 },

  "CR":    { label: "en danger critique", extinctionLevel: 4 },
  "EN":    { label: "en danger", extinctionLevel: 3 },

  "VU":    { label: "vulnérable", extinctionLevel: 2 },
  "NT":    { label: "potentiellement menacé", extinctionLevel: 2 },

  "LC":    { label: "non menacé", extinctionLevel: 1 },

  "DD":    { label: "données insuffisantes", extinctionLevel: null },
  "NA":    { label: "non applicable au niveau régional", extinctionLevel: null },
  "NE":    { label: "non évalué au niveau régional", extinctionLevel: null },

  "NONE":  { label: "aucune information disponible", extinctionLevel: null },
};

// Normalise ce qui vient du CSV pour se débarasser des "(exp)"" essentiellement qui ne change rien à la visualisation.
function normalizeMenace(raw){
  if (raw == null) return "NONE"; //Gère cas imprévus
  let s = String(raw).trim();
  if (!s || s.toLowerCase() === "none") return "NONE";

  let upper = s.toUpperCase();
  if (upper.startsWith("CR(PE)")) return "CR(PE)"; // garde CR(PE) tel quel

  let m = upper.match(/^(EX|EW|RE|CR|EN|VU|NT|LC|DD|NA|NE)/); //match avec un préfix connu
  if (m) {
    return m[1];
  } else {
    return "NONE";
  }

}

//MAPPING DES LABEL D'URGENCE
let URGENCE_MAP = {
  "1":  "urgent",
  "2":  "nécessaire et important",
  "3":  "souhaitable et utile",
  "99": "connaissances insuffisantes",
  "N/A":"non-applicable (Niveau d'action concernant l'utilisation respectueuse de la biodiversité sur l'ensemble du territoire)",
  "NA": "non-applicable (Niveau d'action concernant l'utilisation respectueuse de la biodiversité sur l'ensemble du territoire)",
  "NULL":"Pas de données.",
  "":   "Pas de données."
};

//Même idée que pour menace (généré avec CHATGPT 5.2)
function formatUrgence(raw){
  if (raw == null) return "Pas de données.";
  let s = String(raw).trim();
  if (!s) return "Pas de données.";
  let maj = s.toUpperCase();
  return URGENCE_MAP[s] ?? URGENCE_MAP[maj] ?? s; 
}


//Cantons:
//   - le CSV contient des colonnes CANT_AG, CANT_AI, ...
//   - normalizeCantonVal garde uniquement les valeurs A/B/C/N du tableau (sinon null)
//   - extractCantons collecte les cantons présents pour une espèce
// 
let CANTON_CODES = {
  "AG": "Argovie",
  "AI": "Appenzell Rhodes-Intérieures",
  "AR": "Appenzell Rhodes-Extérieures",
  "BE": "Berne",
  "BL": "Bâle-Campagne",
  "BS": "Bâle-Ville",
  "FR": "Fribourg",
  "GE": "Genève",
  "GL": "Glaris",
  "GR": "Grisons",
  "JU": "Jura",
  "LU": "Lucerne",
  "NE": "Neuchâtel",
  "NW": "Nidwald",
  "OW": "Obwald",
  "SG": "Saint-Gall",
  "SH": "Schaffhouse",
  "SO": "Soleure",
  "SZ": "Schwytz",
  "TG": "Thurgovie",
  "TI": "Tessin",
  "UR": "Uri",
  "VD": "Vaud",
  "VS": "Valais",
  "ZG": "Zoug",
  "ZH": "Zurich"
};

//Même idée que pour menace (généré avec CHATGPT 5.2)
function normalizeCantonVal(v){
  if (v == null) return null;
  let s = String(v).trim().toUpperCase();
  if (!s || s === "NONE" || s === "NULL") return null;
  if (["A","B","C","N"].includes(s)) return s;
  return null; // tout le reste = absent
}

function extractCantons(row){
  let found = []; // ex: [{code:"VD", cat:"A"}]
  for (let code of Object.keys(CANTON_CODES)){ //vu que canton n'est pas un array , object.keys est utiliser. 
    let col = `CANT_${code}`;
    let cat = normalizeCantonVal(row[col]);
    if (cat) found.push({ code, cat });
  }
  return found;
}


// Mapping des valeurs de surveillance
let SURV_MAP = {
  "1":  "insuffisant",
  "2":  "suffisant",
  "99": "non-évalué",
  "NULL": "non-évalué",
  "":   "non-évalué"
};

//Même idée que pour menace (généré avec CHATGPT 5.2)
function formatSurveillance(raw){
  if (raw == null) return "non-évalué";
  let s = String(raw).trim();
  if (!s) return "non-évalué";
  let up = s.toUpperCase();
  return SURV_MAP[s] ?? SURV_MAP[up] ?? s;
}


//Transforme une ligne du CSV en objet consommable par le graphe, j'ai été assisté par CHATGPT pour assurer que la cohérence.

function csvIntoObject(d, i){
  let name = (d["Nom scientifique"]).trim();
  let group = (d["GrouOrg"]).trim();
  let menaceRaw = d["Menace"];
  let lien = (d["Lien à la page espèces du centre de données (de, fr)"]).trim();
  let gbif = (d["Etat des données GBIF Suisse"]).trim();
  let urgenceRaw = d["Urgence"];

  let code = normalizeMenace(menaceRaw);
  let info = MENACE_MAP[code];
  let level = info.extinctionLevel;

  let cantons = extractCantons(d);
  let survRaw = d["Surveillance des populations"];

  return { //Retourne l'objet final utilisé partout (signal, tooltips, panneau détails)
    id: `${(name || `Inconnu_${i}`)}_${i}`,
    label: name || "",
    group: group || "—",

    
    counts: { extinctionLevel: level }, //calcule l’amplitude

    // affichage tooltip/détails
    menaceCode: code,
    menaceLabel: info.label,

    lienEspece: lien || null,
    gbifEtat: gbif || "—",
    urgence: formatUrgence(urgenceRaw),
    cantons,
    surveillance: formatSurveillance(survRaw),
  };
}



// ---------------  Beat generator  ---------------


//  Génère le battement pour une espèce donnée en liste de points.
//  Chaque point contient:
//   - y (valeur du signal)
//   - meta (l’event associé: sert au tooltip/détails)
//   - kind (type: base/dip/rebound/...)
 
function beatForEspèce(ev){
  let rawLevel = ev.counts.extinctionLevel;

  let sev = 0;
  if (rawLevel != null) {
    sev = clamp((rawLevel - 1) / 4, 0, 1); // modifier le 4 est la clé pour avoir des élévations différentes (en gros la valeur la plus haute de extinctionLevel - 1)
  }


  let amp = minAmp + sev * (maxAmp - minAmp);

  
  
  //wiggle = mini oscillation autour de la baseline -> évite d’avoir une ligne parfaitement plate entre deux “pics”
  let wiggle = (k=1) => baselineY + (Math.sin((tCounter + k) * 0.6) * 0.6);


  // y-scale est inversé
  let dipY     = baselineY - amp;        // DOWNNN with the sickness
  let reboundY = baselineY + amp * 0.4;  

  //Petit plateau entre battements
  let SPACE = 4;
  let gap = d3.range(SPACE).map(() => ({
    y: baselineY,
    meta: ev,
    kind: "gap"
  }));

  return [
    { y: wiggle(1), meta: ev, kind: "base" },
    { y: wiggle(2), meta: ev, kind: "base" },

    
    { y: dipY,      meta: ev, kind: "dip" }, //  "dip" sert aussi de marker plus tard
    { y: reboundY,  meta: ev, kind: "rebound" },

    { y: wiggle(3), meta: ev, kind: "tail" },
    { y: wiggle(4), meta: ev, kind: "tail" },
    ...gap
  ];
}



// ------------------- Break aka les grands plateaux -------------------


function breakEntreBatch(){
  let Plateau = 60; // durée de la pause

  let seg = [];
  for (let i = 0; i < Plateau * 2; i++){ //identité propre à ces points (pour qu'il soit indépendant)
    seg.push({ y: baselineY, meta: { id: "__break__", label: "Break" }, kind: "flat" });
  }
  return seg;
}


// ---------------------- Etape avant le dessin + markers ----------------------


let tCounter = 0;

let points = d3.range(N).map((_, i) => ({
  t: tCounter++, //Ordre chronologique des points dans l'ECG
  y: null,
  meta: null,
  kind: "seed"
}));


let markers = []; //liste des points interactifs (les dips)


// ------------- Scales + line -------------

//  Utilisé ChatGPT 5.2 Thinking pour cette section. Convertit le signal en position dans le SVG.
//  Sépare la logique du rendu.

let x = d3.scaleLinear() // x = Position X du point dans le tableau points
  .domain([0, N-1])
  .range([margin.left, margin.left + innerW]);

let y = d3.scaleLinear() // Amplitude du point d.y
  .domain([0, innerH])
  .range([margin.top + innerH, margin.top]);


let line = d3.line() //line() dessine  les points définis 
  .defined(d => d.y !== null)
  .x((d, i) => x(i))
  .y(d => y(d.y))
  .curve(d3.curveLinear); //Choix du look de la courbe : https://d3js.org/d3-shape/curve#curveLinear







//   --------------- SVG setup ---------------

let svg = d3.select("#viz");

// Image de fond (placée derrière tout)
svg.insert("image", ":first-child")
  .attr("href", "./Background-DataViz-VarJaune.PNG")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", W)
  .attr("height", H)
  .attr("preserveAspectRatio", "xMidYMid slice")
  .style("pointer-events", "none"); // ne doit pas bloquer hover

// Ligne baseline (référence devenu transparente maintenant) 
svg.append("line")
  .attr("class", "baseline")
  .attr("x1", margin.left)
  .attr("x2", margin.left + innerW)
  .attr("y1", y(baselineY))
  .attr("y2", y(baselineY));

// chemin principal du signal
let path = svg.append("path")
  .attr("class", "line")
  .attr("d", line(points));

// Création des éléments au survol : Aka le curseur  et tooltip
let cursorG = svg.append("g").style("display", "none");
let cursorLine = cursorG.append("line")
  .attr("class", "cursor-line")
  .attr("y1", margin.top)
  .attr("y2", margin.top + innerH);

let tooltipG = svg.append("g")
  .style("display", "none");

let ttBox = tooltipG.append("rect")
  .attr("class", "tooltip")
  .attr("rx", 8).attr("ry", 8);

let ttTitle = tooltipG.append("text").attr("class", "tooltip-text");
let ttLine1 = tooltipG.append("text").attr("class", "tooltip-muted");
let ttLine2 = tooltipG.append("text").attr("class", "tooltip-muted");





//  ------------------ Pause (hover + bouton) ------------------


// L’animation est "paused" bouton activé OU souris sur un marker // aussi pour la page info
let pausedByButton = false;
let pausedByHover = false;
let pausedByInfo = false;
let isPaused = () => pausedByButton || pausedByHover || pausedByInfo;


let pauseBtn = document.getElementById("pauseBtn");
function updatePauseBtn(){
  if (pausedByButton) {
    pauseBtn.textContent = "Play";
    return;
  }
  pauseBtn.textContent = "Pause";
}

pauseBtn.addEventListener("click", () => {
  pausedByButton = !pausedByButton;
  updatePauseBtn();
});
updatePauseBtn();

//Class CSS des markers. Cette fonction et son usage vient de CHATGPT 5.2 Thinking.
function markerClass(ev){
  return "marker";
}




//  --------------------- Panneau d'information (bouton près du titre) sur recommendation de Florian Rieder, Théo Rochat et Nicolas Bovet. ---------------------------


let infoBtn = document.getElementById("infoBtn");
let infoDialog = document.getElementById("infoDialog");
let closeInfo = document.getElementById("closeInfo");

function openInfo(){
  if (!infoDialog) return;
  infoDialog.hidden = false;
  pausedByInfo = true;
}

function closeinfoDialog(){
  if (!infoDialog) return;
  infoDialog.hidden = true;
  pausedByInfo = false;
}

function toggleInfo(){
  if (!infoDialog) return;
  if (infoDialog.hidden) {
    openInfo();
  } else {
    closeinfoDialog();
  }
}


infoBtn.addEventListener("click", toggleInfo);
closeInfo.addEventListener("click", closeinfoDialog);

// clic sur le fond (backdrop) => ferme
infoDialog.addEventListener("click", (e) => {
  if (e.target && e.target.dataset && e.target.dataset.close === "1") {
    closeinfoDialog();
  }
});

// Escape => ferme
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeinfoDialog();
});



// Tooltip: place les textes, calcule la bbox, taille le rect, puis "repositionne" si ça dépasse des bords du SVG.

function showTooltip(mx, my, ev){
  tooltipG.style("display", null);
  tooltipG.attr("transform", null);

  let sciName = (ev.label).trim();
  let group = ev.group;
  let menace = ev.menaceLabel;

  ttTitle.text(`Nom scientifique : ${sciName || "—"}`);
  ttLine1.text(`Groupe : ${group}`);
  ttLine2.text(`Degrée de menace : ${menace}`);

  // position initiale (près du point)
  let x0 = mx + 14;
  let y0 = my - 40;

  ttTitle.attr("x", x0).attr("y", y0);
  ttLine1.attr("x", x0).attr("y", y0 + 18);
  ttLine2.attr("x", x0).attr("y", y0 + 34);

  let pad = 10;

  // On attend le prochain frame pour que getBBox() reflète les textes mis à jour --> recommandé par CHATGPT 5.2
  requestAnimationFrame(() => {
    let textBBoxes = [ttTitle, ttLine1, ttLine2].map(s => s.node().getBBox());
    let minX = d3.min(textBBoxes, b => b.x);
    let minY = d3.min(textBBoxes, b => b.y);
    let maxX = d3.max(textBBoxes, b => b.x + b.width);
    let maxY = d3.max(textBBoxes, b => b.y + b.height);

    let width = (maxX - minX) + pad * 2;
    let height = (maxY - minY) + pad * 2;

    // rect du tooltip autour du texte
    ttBox
      .attr("x", minX - pad)
      .attr("y", minY - pad)
      .attr("width", width)
      .attr("height", height);

    // Correction si le tooltip dépasse les marges
    let dx = 0, dy = 0;

    let boxLeft = (minX - pad);
    let boxTop = (minY - pad);
    let boxRight = boxLeft + width;
    let boxBottom = boxTop + height;

    if (boxRight > W - margin.right) dx = (W - margin.right) - boxRight;
    if (boxLeft < margin.left) dx = Math.max(dx, margin.left - boxLeft);

    if (boxTop < margin.top) dy = margin.top - boxTop;
    if (boxBottom > H - margin.bottom) dy = (H - margin.bottom) - boxBottom;

    tooltipG.attr("transform", `translate(${dx},${dy})`);
  });
}

function hideTooltip(){
  tooltipG.style("display", "none").attr("transform", null);
}





// Panneau “détails” (click marker)
// cette section va remplir innerHTML avec les champs de l'espèce





let detailsEl = document.getElementById("details");
let detailsTitle = document.getElementById("detailsTitle");
let detailsBody = document.getElementById("detailsBody");
let closeDetails = document.getElementById("closeDetails");

function openDetails(ev){
  if (!detailsEl || !detailsTitle || !detailsBody) return;

  let sciName = ((ev && ev.label)).trim() || "—";
  let group = (ev && ev.group);
  let menace = (ev && ev.menaceLabel);
  //let code = (ev && ev.menaceCode);

  let urgence = (ev && ev.urgence);
  let gbifEtat = (ev && ev.gbifEtat)
  let lien = (ev && ev.lienEspece);

  detailsTitle.textContent = "Détails";

  let lienHtml = "—";
  if (lien) {
    lienHtml = '<a href="' + lien + '" target="_blank" rel="noopener noreferrer">Ouvrir la page espèce</a>';
  }


  let CANTON_CAT_LABEL = {
    "A": "> 1999",
    "B": "1980–1999",
    "C": "< 1980",
    "N": "allochtone"
  };

  // rend la liste cantons lisible et utilise les labels --> recommandé par ChatGPT 5.2
  let cantonsText = (ev.cantons && ev.cantons.length)
    ? ev.cantons
        .map(c => `${CANTON_CODES[c.code] ?? c.code} (${CANTON_CAT_LABEL[c.cat] || c.cat})`)
        .join(", ")
    : "—";


  let surveillance = (ev && ev.surveillance);

  detailsBody.innerHTML =
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items:start;">' +
      '<div>' +
        '<div><strong>Nom scientifique :</strong> ' + sciName + '</div>' +
        '<div><strong>Groupe :</strong> ' + group + '</div>' +
      '</div>' +
      '<div>' +
        '<div><strong>Degrée de menace :</strong> ' + menace + '</div>' +
        "<div><strong>Besoin d'action à l'échelle nationale : </strong> " + urgence + "</div>" +
      '</div>' +
    '</div>' +
    '<hr style="border:0; border-top:1px solid rgba(255,255,255,0.10); margin:12px 0;">' +
    '<div style="display:grid; gap: 8px;">' +
      '<div><strong>Présence dans les cantons :</strong> ' + cantonsText + '</div>' +
      '<div><strong>Surveillance des populations :</strong> ' + surveillance + '</div>' +
      '<div><strong>Etat des données GBIF Suisse :</strong> ' + gbifEtat + '</div>' +
      '<div><strong>Lien :</strong> ' + lienHtml + '</div>' +
    '</div>';

  detailsEl.style.display = "block";
}

function closeDetailsPanel(){
  detailsEl.style.display = "none";
}
closeDetails.addEventListener("click", closeDetailsPanel);







//     ---------------  Render ---------------

function updateMarkersFromPoints(){
  let newMarkers = []; // liste temporaire des markers reconstruite à chaque render
  
  for (let i=0; i<points.length; i++){  //   parcourt points[]
    let p = points[i];
    
    if (p.kind === "dip" && p.meta.id && p.meta.id !== "__break__") {  //  prend uniquement les points "dip" et on ignore les points spéciaux de pause "__break__". // les p.meta.id viennent de chatGPT 5.2
      
      newMarkers.push({ // On fabrique un objet "marker" prêt pour le rendu (position SVG + données associées)
        id: p.meta.id + "_" + p.t, // identifiant unique et stable pour le data-join D3 (cette ligne vient de CHATGPT 5.2)
        idx: i,
        t: p.t,
        x: x(i),
        y: y(p.y),
        meta: p.meta

      });
    }
  }

  newMarkers.sort((a,b) => a.t - b.t);
  
  markers = newMarkers.slice(Math.max(0, newMarkers.length - 120));  // Ne garde que les 120 derniers markers (les plus récents) pour limiter le nombre de <circle> dans le SVG --> recommandé par CHATGPT 5.2
}


// Cette fonction va:
//  - mettre à jour le chemin du signal
//  - calculer les markers
//  - faire un data join D3 pour créer/mettre à jour/supprimer les cercles

function render(){
  path.attr("d", line(points));

  updateMarkersFromPoints();

  let sel = svg.selectAll("circle.marker")
    .data(markers, d => d.id);

  sel.join(
    enter => enter.append("circle")
      .attr("class", "marker")
      .attr("r", 4.2)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("class", d => markerClass(d.meta))

      // Hover => pause + curseur + tooltip
      .on("mouseenter", (event, d) => {
        pausedByHover = true;

        cursorG.style("display", null);
        cursorLine.attr("x1", d.x).attr("x2", d.x);

        showTooltip(d.x, d.y, d.meta);
        tooltipG.raise(); // devant les points
      })
      .on("mouseleave", () => {
        pausedByHover = false;

        cursorG.style("display", "none");
        hideTooltip();
      })

      // Click => panneau détails
      .on("click", (event, d) => {
        openDetails(d.meta);
      }),

    // Update (positions si le buffer bouge)
    update => update
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("class", d => markerClass(d.meta)),

    exit => exit.remove()
  );
}


// ---------- Looping ----------

let cycle = []; // séquence de points à écrire (beats + break)
let cycleIndex = 0; // où on en est dans ce cycle
let BATCH_SIZE = 9;
//let BATCHES_PER_RUN = 3; // (actuellement pas utilisé dans le code, c'est un reste d'un autre temps)
let eventCursor = 0;


 
let writeIndex = 0; // Future position dans points[]

let SWEEP_GAP = 25; // Rolling Thunder ! C'est l'effaceur. Aka le rolling sweep.




// Construit la séquence à jouer, trouvé à force d'expérimenter: 9 beats (9 espèces) puis un break
function buildSequence(){
  if (eventCursor >= events.length) eventCursor = 0;

  let seq = [];
  for (let i = 0; i < BATCH_SIZE; i++){
    let ev = events[eventCursor % events.length];
    eventCursor++;
    seq.push(...beatForEspèce(ev));
  }
  seq.push(...breakEntreBatch());

  cycle = seq;
  cycleIndex = 0;
}



function avanceECGSweep(){

  if (cycleIndex >= cycle.length) buildSequence();   // Si on a fini la séquence (beats + break), on reconstruit un nouveau cycle

  let b = cycle[cycleIndex++]; // Point suivant à écrire

  points[writeIndex] = { // Écrit le point à la position actuelle d’écriture
    t: tCounter++,
    y: b.y,
    meta: b.meta,
    kind: b.kind
  };

  // Efface après le curseur => aspect “sweep”
  for (let g = 1; g <= SWEEP_GAP; g++){
    let j = (writeIndex + g) % N;
    points[j] = { t: tCounter++, y: null, meta: null, kind: "sweep-gap" };
  }

  writeIndex = (writeIndex + 1) % N; // Avance le curseur d’écriture

  // Si on revient au début, relance un nouveau cycle
  if (writeIndex === 0) {
    cycle = [];
    cycleIndex = 0;
    buildSequence();
  }
}



// -------------  Animation -------------

let lastFrame = 0;

function start(){
  render(); //Rendu initial

  d3.timer((elapsed) => { //https://d3js.org/d3-timer
    if (elapsed - lastFrame < MS_PER_FRAME) return; //Viens de ChatGPT 5.2, le but est de sauter les ticks trop rapproché
    lastFrame = elapsed;

    if (!isPaused()) { // si l'animation n'est pas en pause, on écrit de nouveaux points + on met à jour l'affichage
      for (let k=0; k<POINTS_PER_TICK; k++){
        avanceECGSweep();
      }
      render();
    }
  });
}



//  --------------- CHARGÉ !  CHARGÉ ! CHARGÉ ! ... et start() ------------------------

d3.dsv(";", "./liste-der-prioritaeren-arten-TIDY.csv").then(raw => { //mon csv est délimiter par des ;, je ne sais pas vraiment pourquoi c'est des virgules mais du coup j'ai fait avec.
  events = raw.map(csvIntoObject); //map events
  shuffleInPlaceSeeded(events, 42); // seeded shuffle

  if (!events.length) {
    console.log("json.json loaded but empty."); //oui j'avais un json.json lors de mes phases de test.
    return;
  }

  buildSequence(); 
  cursorG.style("display", null);
  start(); //commence animation

});
