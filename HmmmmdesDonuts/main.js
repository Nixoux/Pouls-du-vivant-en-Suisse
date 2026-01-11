// -------- MAPPINGS (copié collé de la visualisation principale (pouls)) -------------

// MAPPING DES LABEL DE MENACES -> convertit des codes en un label + extinctionLevel est utilisé pour l’amplitude du signal (plus grave => plus haut )
let MENACE_MAP = {
  "EX":    { label: "éteint", extinctionLevel: 4 }, //extinctionlevel n'est pas utilisé dans ce code.
  "EW":    { label: "éteint à l'état sauvage", extinctionLevel: 4 },
  "RE":    { label: "éteint en Suisse", extinctionLevel: 4 },
  "CR(PE)":{ label: "disparu, probablement éteint en Suisse", extinctionLevel: 4 },

  "CR":    { label: "en danger critique", extinctionLevel: 3 },
  "EN":    { label: "en danger", extinctionLevel: 3 },

  "VU":    { label: "vulnérable", extinctionLevel: 2 },
  "NT":    { label: "potentiellement menacé", extinctionLevel: 2 },

  "LC":    { label: "non menacé", extinctionLevel: 1 },

  "DD":    { label: "données insuffisantes", extinctionLevel: null },
  "NA":    { label: "non applicable au niveau régional", extinctionLevel: null },
  "NE":    { label: "non évalué au niveau régional", extinctionLevel: null },

  "NONE":  { label: "aucune information disponible", extinctionLevel: null },
};


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


function formatUrgence(raw){
  if (raw == null) return "Pas de données.";
  let s = String(raw).trim();
  if (!s) return "Pas de données.";
  let maj = s.toUpperCase();
  return URGENCE_MAP[s] ?? URGENCE_MAP[maj] ?? s; 
}


let SURV_MAP = {
  "1":  "insuffisant",
  "2":  "suffisant",
  "99": "non-évalué",
  "NULL": "non-évalué",
  "":   "non-évalué"
};

function formatSurveillance(raw){
  if (raw == null) return "non-évalué";
  let s = String(raw).trim();
  if (!s) return "non-évalué";
  let up = s.toUpperCase();
  return SURV_MAP[s] ?? SURV_MAP[up] ?? s;
}




// -----------Traitement des données------------------



let events = []; 


//Transforme une ligne du CSV en objet consommable par le graphe, j'ai été assisté par CHATGPT pour assurer que la cohérence.
//en partie repris de l'autre code.

function csvIntoObject(d, i){
  let group = (d["GrouOrg"]).trim(); 

  let menaceCode = normalizeMenace(d["Menace"]);
  let menaceLabel = (MENACE_MAP[menaceCode].label);
  let urgenceLabel = formatUrgence(d["Urgence"]); 
  let survLabel = formatSurveillance(d["Surveillance des populations"]);

  return {
    id: i,                
    group,                // clé de filtre
    menaceLabel,          
    urgenceLabel,         
    survLabel             
  };
}








// -------------- DONUT RENDER -----------------


// Palette de couleurs D3 "Tableau 10"
let COLORS = d3.schemeTableau10;

//Le compteur pour chaque catégories
function compteur(arr, accessor){
  let counts = {}; 

  for (let d of arr){
    let k = accessor(d);
    if (counts[k] !== undefined) {
      counts[k] = counts[k] + 1;
    } else {
      counts[k] = 1;
    }
  }

  // Convertit l'objet en tableau et trie (plus gros en premier) //difficulté avec cette partie, effectué à l'aide de ChatGPT 5.2.
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a,b) => b.value - a.value);
}


// Rend la légende HTML associée au donut //section assistée par ChatGPT 5.2
function renderLegend(legendEl, data){
  legendEl.innerHTML = ""; // reset

  data.forEach((d, i) => {
    let item = document.createElement("div");
    item.className = "legendItem";

    let left = document.createElement("div");
    left.className = "leftLegend";

    let sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = COLORS[i % COLORS.length]; // couleur calée sur l’index (comme les arcs)

    let lab = document.createElement("span");
    lab.className = "label";
    lab.textContent = d.label;

    let val = document.createElement("span");
    val.className = "val";
    val.textContent = d.value;

    left.appendChild(sw);
    left.appendChild(lab);
    item.appendChild(left);
    item.appendChild(val);
    legendEl.appendChild(item);
  });
}


// Rend un donut dans un SVG + met à jour la légende à côté  // les classes et autres choix de styles on été géré à l'aide de chatGPT 5.2.
function renderDonut(svgSel, legendEl, data, centerTitle){
  let svg = d3.select(svgSel);

  // Nettoyage après séléction de filtre
  svg.selectAll("*").remove();

  // Dimensions du donut
  let W = 320, H = 320;
  let cx = W / 2, cy = H / 2;

  // Total pour les pourcentages
  let total = d3.sum(data, d => d.value) || 0;

  //dessiné autour du centre
  let g = svg.append("g")
    .attr("transform", `translate(${cx},${cy})`);

  // Transforme data en angles (startAngle/endAngle)
  let pie = d3.pie()
    .sort(null)            // garde l'ordre de data (déjà trié par value)
    .value(d => d.value);

  // Rayons du donut (extérieur / trou)
  let outerR = 120;
  let innerR = 72;

  // Générateur d’arcs SVG
  let arc = d3.arc()
    .innerRadius(innerR)
    .outerRadius(outerR);

  let arcs = pie(data);  // [{data:{label,value}, startAngle, endAngle}, ...]

  let tooltip = d3.select("#tooltip");

  // Formateur de % en format français (virgule) //reco ChatGPT.
  let fmtpourcentage = (p) => (p * 100).toFixed(1).replace(".", ",") + " %";

  // Dessin des segments
  g.selectAll("path.arc")
    .data(arcs)
    .join("path")
    .attr("class", "arc")
    .attr("d", arc)                                   // calcule la forme
    .attr("fill", (d,i) => COLORS[i % COLORS.length]) // couleur stable par index
    .attr("stroke", "rgba(0,0,0,0.35)")
    .attr("stroke-width", 1)

    // Hover 
    .on("mouseenter", (event, d) => {
      let pourcentage;
      if (total) {
        pourcentage = d.data.value / total;
      } else {
        pourcentage = 0;
      }

      tooltip
        .style("display", "block")
        .html(
          `<div><strong>${d.data.label}</strong></div>
           <div>${fmtpourcentage(pourcentage)}</div>`
        );

      d3.select(event.currentTarget).attr("opacity", 0.75);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.clientX + 12) + "px")
        .style("top",  (event.clientY + 12) + "px");
    })
    .on("mouseleave", (event) => {
      tooltip.style("display", "none");
      d3.select(event.currentTarget).attr("opacity", 1);
    });

  // Texte central (titre + total)
  g.append("text")
    .attr("class", "centerText")
    .attr("y", -4)
    .text(centerTitle);

  
  let centerText = "0";

  if (total) {
    centerText = `${total} espèces `;
  }

  g.append("text")
    .attr("class", "centerSub")
    .attr("y", 14)
    .text(centerText);

  // Légende alignée sur les arcs
  renderLegend(legendEl, data);
}




// ------------- Filtre par groupe ----------------
let groupSelect = document.getElementById("groupSelect");


// Remplit le <select> 
function FiltreOptions(groups){
  groupSelect.innerHTML = "";

  let optAll = document.createElement("option");
  optAll.value = "__ALL__";
  optAll.textContent = "Tous";
  groupSelect.appendChild(optAll);

  groups.forEach(g => {
    let opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    groupSelect.appendChild(opt);
  });
}


// Met à jour toute la viz selon le groupe sélectionné 
function update(){
  let sel = groupSelect.value;

  //  filtre events
  let filtered;

  if (sel === "__ALL__") {
    filtered = events;
  } else {
    filtered = events.filter(d => d.group === sel);
  }

//  agrège catégorie
  let menace = compteur(filtered, d => d.menaceLabel);
  let urgence = compteur(filtered, d => d.urgenceLabel);
  let surv = compteur(filtered, d => d.survLabel);

  //  render les 3 donuts
  renderDonut("#donutMenace",  document.getElementById("legendMenace"),  menace,  "Degré de menace");
  renderDonut("#donutUrgence", document.getElementById("legendUrgence"), urgence, "Urgence");
  renderDonut("#donutSurv",    document.getElementById("legendSurv"),    surv,    "Surveillance");
}


// Au changement de sélection => re-render complet
groupSelect.addEventListener("change", update);




//  --------------- Chargement du CSV ------------------
d3.dsv(";", "liste-der-prioritaeren-arten-TIDY.csv").then(raw => {
  events = raw.map(csvIntoObject); // conversion CSV -> objets UI

  // Liste des groupes uniques,triée alphabétiquement --> assisté par CHATGPT 5.2
  let groups = Array.from(new Set(events.map(d => d.group)))
    .filter(g => g && g !== "—")
    .sort((a,b) => a.localeCompare(b, "fr"));

  FiltreOptions(groups); 
  update();               
});
