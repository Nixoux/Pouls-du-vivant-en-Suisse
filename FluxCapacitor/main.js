
//L'idée m'est venu en tombant sur ces pages:
//https://github.com/d3/d3-san
//https://observablehq.com/@d3/sankey-component


//Une partie du code viens des Donuts
// ---------- MAPPING --------------

let MENACE_MAP = { //J'ai eu des soucis avec le mapping ici, il a été revu par CHATGPT 5.2 et la fonction formatmenace a vu le jour comme ça.
  "EX": "éteint",
  "EW": "éteint à l'état sauvage",
  "RE": "éteint en Suisse",
  "CR(PE)": "disparu, probablement éteint en Suisse",
  "CR": "en danger critique",
  "EN": "en danger",
  "VU": "vulnérable",
  "NT": "potentiellement menacé",
  "LC": "non menacé",
  "DD": "données insuffisantes",
  "NA": "non applicable (niveau régional)",
  "NE": "non évalué (niveau régional)",
  "NONE": "aucune information disponible"
};

function formatMenace(raw){
  let code = normalizeMenace(raw);
  return MENACE_MAP[code]; 
}

//à partir d'ici jusqu'à la fin de cette partie c'est un copié collé de donuts.
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



// ---------- UI ------------

let svg = d3.select("#sankey");
let tooltip = d3.select("#tooltip");


//    récupère les éléments HTML pour dessiner
let groupSelect = document.getElementById("groupFilter");   // filtre par groupe
let minLinkValueInput = document.getElementById("minFlow"); // seuil min d'un lien
let LeSummary = document.getElementById("countBadge");      // résumé texte


let format = d3.format(",d"); // Formatage d'entiers pour les tooltips recomandé par ChatGPT 5.2



let events = []; // Contient les donéées du CSV

//même idée que pour les deux autres codes. Ajusté avec ChatGPT 5.2.
function csvIntoObject(r){
  return {
    group: (r["GrouOrg"]).trim(),
    menace: formatMenace(r["Menace"]),
    urgence: formatUrgence(r["Urgence"]),
    surv: formatSurveillance(r["Surveillance des populations"])
  };
}

 








// ------------ Sankey ----------------

//l'entièreté de cette fonction a été retravaillé par ChatGPT 5.2 a de nombreuses reprises.  
//J'ai rencontré de nombreux soucis d'affichage et de compréhension de ma part.
// Ce que j'ai compris c'est que d3-sankey attend des links avec source/target pointant vers des nodes (souvent via index). On construit donc ces index.
// J'ai commenté le code pour pouvoir mieux le comprendre moi même.

function buildGraph(eventsFilteredByGrouOrg, minValue){
 
  let nodeByKey = new Map(); // stocke les noeuds uniques (une catégorie = 1 noeud)
  let linkByKey = new Map();   // idem (une transition = 1 lien)

  
  let key = (stage, name) => `${stage}|${name}`; // Clé unique d'un noeud = colonne + libellé

  // internNode -->  “donne-moi l’unique objet pour cette clé”
  function internNode(stage, name){
    let k = key(stage, name);
    if (!nodeByKey.has(k)) nodeByKey.set(k, { key: k, stage, name });
    return nodeByKey.get(k);
  }

  // internLink --> incrémente un compteur pour le lien source->target
  // en gros: “Combien d’espèces passent de A vers B ?”
  function internLink(source, target, value = 1){
    let k = `${source.key}→${target.key}`;
    linkByKey.set(k, (linkByKey.get(k) ?? 0) + value);
  }


  // transforme chaque espèce en un chemin à travers les colonnes
  for (let d of eventsFilteredByGrouOrg){


  // GrouOrg -> Menace -> Urgence -> Surveillance
    let columns = [
      { stage: "GrouOrg",      name: d.group   },
      { stage: "Menace",       name: d.menace  },
      { stage: "Urgence",      name: d.urgence },
      { stage: "Surveillance", name: d.surv    }
    ].filter(c => c.name);

    
    let path = columns.map(c => internNode(c.stage, c.name)); // Chaque étape est convertit en objets noeuds uniques

    for (let i = 0; i < path.length - 1; i++){  // Crée un lien pour ces noeuds et incrémente une valeur pour déterminer l'épaisseur du ruban.
      internLink(path[i], path[i + 1], 1);
    }
  }

  // ----- ici on converti vers le format attendu par d3-sankey -----
    let nodes = Array.from(nodeByKey.values());  // On passe du Map -> Array pour la sortie

    let indexByKey = new Map(nodes.map((n, i) => [n.key, i]));  // d3-sankey accepte source/target sous forme d'index | on construit donc key -> index

    // On transforme chaque lien "k" en {source, target, value}
    // puis on applique le seuil minValue (minFlow)
    let links = Array.from(linkByKey, ([k, value]) => {
      let [src, tgt] = k.split("→");
      return { source: indexByKey.get(src), target: indexByKey.get(tgt), value };
    }).filter(l => l.value >= minValue);
  // ------------------------------------------------------------

  // Après filtrage, certains noeuds peuvent devenir “orphelins”. Pour éviter de les afficher (et éviter des trous), on conserve uniquement les noeuds touchés par au moins un lien.
  let used = new Set();
  for (let l of links){ used.add(l.source); used.add(l.target); }

  // keptNodes : noeuds réellement nécessaires
  // remap : ancien index -> nouvel index (compactage)
  let keptNodes = [];
  let remap = new Map();
  for (let i = 0; i < nodes.length; i++){
    if (used.has(i)){
      remap.set(i, keptNodes.length);
      keptNodes.push(nodes[i]);
    }
  }

  // On remappe les liens vers les nouveaux index
  let keptLinks = links.map(l => ({
    source: remap.get(l.source),
    target: remap.get(l.target),
    value: l.value
  })).filter(l => l.source != null && l.target != null);


  return { nodes: keptNodes, links: keptLinks }; // Résultat final
}









// -------- Couleurs --------


//Ancienne manière de faire
let PALETTES = {
  "GrouOrg": d3.scaleOrdinal([
    "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"
  ])
  //Finit par faire tout les following choix manuellement: 
  //"Menace": d3.scaleOrdinal([  
  //"#fecdd3", // rose très clair
  //"#fb7185", // rose
 // "#f43f5e", // rouge clair
  //"#be123c", // rouge sombre
  //"#4c0519"  // bordeaux très sombre (plus contrasté)
  //]),
  //"Urgence": d3.scaleOrdinal([
  //  "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9"
  //]),
  //"Surveillance": d3.scaleOrdinal([
  //  "#60a5fa", "#93c5fd", "#3b82f6", "#1d4ed8", "#0ea5e9"
  //])
};

//choix manuel de couleurs
let OVERRIDE_COLORS = {
  Urgence: {
    "urgent": "#CCFBF1",                    
    "nécessaire et important": "#5EEAD4",   
    "souhaitable et utile": "#14B8A6",      
    "non-applicable (Niveau d'action GL)": "#0F766E" 
  },

  Menace: {
    "disparu, probablement éteint en Suisse" : "#4c0519",  
    "en danger critique" : "#be123c", 
    "en danger" : "#f43f5e", 
    "vulnérable" : "#fb7185", 
    "potentiellement menacé" : "#fecdd3", 
    "non menacé" : "#FBCFE8", 
    "données insuffisantes" : "#000000ff",
    "non évalué (niveau régional)" :"#000000ff"

  },

  Surveillance: {
    insuffisant: "#1E293B", 
    suffisant:   "#FEF3C7", 
  }
};

function color(node){
  let forced;

  if (OVERRIDE_COLORS[node.stage] !== undefined && OVERRIDE_COLORS[node.stage] !== null) {
    forced = OVERRIDE_COLORS[node.stage][node.name];
  } else {
    forced = undefined;
  }

  if (forced) {
    return forced;
  } else {
    let scale = PALETTES[node.stage];

    if (scale) {
      return scale(node.name);
    } else {
      return "#7dd3fc";
    }
  }
}





// ------------- Render ---------------

function render(){
  if (!events.length) return;

  let selectedGroup = groupSelect.value;

  let minValue = Math.max(1, parseInt(minLinkValueInput.value || "1", 10));  // minValue >= 1 (sécurité si input vide / invalide) --> recommandé par ChatGPT 5.2

  // Filtrage des données “ligne par ligne”
  let eventsFilteredByGrouOrg;
  if (selectedGroup === "__ALL__") {
    eventsFilteredByGrouOrg = events;
  } else {
    eventsFilteredByGrouOrg = events.filter(d => d.group === selectedGroup);
  }


  let input = buildGraph(eventsFilteredByGrouOrg, minValue);  // Construction du graphe agrégé (catégories + flux)


    
  let width = Math.max(1100, 320 + 200 * 4); // Dimensions


  let sankeyHeight = Math.max(560, 140 + input.nodes.length * 16); // hauteur "utile" du sankey 


  let TITLE_BAND = 70; // bande réservée pour la légende (C'est un peu foiré comme solution mais j'ai pas trouvé autre chose) (augmente si 3 lignes)

  let height = sankeyHeight + TITLE_BAND;
  let margin = { top: 18, right: 24, bottom: 18, left: 24 };

  // SVG
  svg.attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);
  svg.selectAll("*").remove();

  // Sankey commence PLUS BAS, sous la bande
  let sankey = d3.sankey()
    .nodeWidth(28)
    .nodePadding(12)
    .extent([
      [margin.left, margin.top + TITLE_BAND],
      [width - margin.right, height - margin.bottom]
    ])
    //.nodeSort(null)
    //.linkSort(null);

  let graph = sankey({
    nodes: input.nodes.map(d => ({ ...d })),
    links: input.links.map(d => ({ ...d }))
  });

    /*
      let width = Math.max(1100, 320 + 200 * 4);
      let height = Math.max(560, 140 + input.nodes.length * 12);
      let margin = { top: 54, right: 24, bottom: 18, left: 24 }; // + de place pour les titres (qui sont venu plus tard.)


    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    let sankey = d3.sankey()
      .nodeWidth(18)
      .nodePadding(10)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .nodeSort(null)
      .linkSort(null);

    let graph = sankey({
      nodes: input.nodes.map(d => ({ ...d })),
      links: input.links.map(d => ({ ...d }))
    });
    */


  // ------------- TITRES DE COLONNES  -----------------
  let stageLabel = {
    "GrouOrg": "Groupe d’organismes",
    "Menace": "Degré de menace",
    "Urgence": "Besoin d’action",
    "Surveillance": "Surveillance"
  };


  //Cette fonction n'existait pas auparavant. Les légendes au dessus du graphique étaient coupé par le SVG et j'arrivais pas à trouver de solution. J'ai demandé à CHATGPT 5.2 Thinking de m'assister et cette fonction est née de cette interaction. 
  function wrapSvgText(textSel, maxWidth){
    textSel.each(function(){
      let text = d3.select(this);
      let words = text.text().split(/\s+/).filter(Boolean);
      text.text(null);

      let line = [];
      let lineNumber = 0;
      let lineHeight = 1.15; // em
      let y = +text.attr("y");
      let x = +text.attr("x");

      let tspan = text.append("tspan")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0em");

      for (let w of words){
        line.push(w);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1){
          line.pop();
          tspan.text(line.join(" "));
          line = [w];
          tspan = text.append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", (++lineNumber * lineHeight) + "em")
            .text(w);
        }
      }
    });
  }



  let stageOrder = ["GrouOrg", "Menace", "Urgence", "Surveillance"];  // Ordre des colonnes

  let legendY = margin.top + 18; // dans la bande dédié pour les légendes
  let stageLegend = svg.append("g").attr("class", "stageLegend");

  for (let stage of stageOrder) {
    let nodesOfStage = graph.nodes.filter(n => n.stage === stage);
    if (!nodesOfStage.length) continue;

    // centre X de la colonne = moyenne entre minX0 et maxX1
    let minX0 = d3.min(nodesOfStage, n => n.x0);
    let maxX1 = d3.max(nodesOfStage, n => n.x1);
    let xMid = (minX0 + maxX1) / 2;

    //stageLegend.append("text")
    //  .attr("class", "stageLegendText")
    //  .attr("x", xMid)
    //  .attr("y", legendY)
    //  .attr("text-anchor", "middle")
    //  .text(stageLabel[stage] ?? stage);

  let valeureux = stageLabel[stage];

  if (valeureux === null || valeureux === undefined) {
    valeureux = stage;
  }

  let labelText = stageLegend.append("text")
    .attr("class", "stageLegendText")
    .attr("x", xMid)
    .attr("y", legendY)
    .attr("text-anchor", "middle")
    .text(valeureux);

  wrapSvgText(labelText, Math.max(40, (maxX1 - minX0) - 12)); // largeur max = largeur de colonne - un peu de padding

  }


  let total = d3.sum(graph.links, d => d.value) || 0;  // somme des valeurs des liens pour tooltip
  LeSummary.textContent = `${format(eventsFilteredByGrouOrg.length)} espèces • ${format(total)} flux (min ${minValue})`;



  // --------- Rubans / Liens -------

  let link = svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(graph.links)
    .join("path")
      .attr("class", "link")
      .attr("d", d3.sankeyLinkHorizontal()) // génère le path SVG entre source et target
      .attr("stroke", d => color(d.source))
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke-opacity", 0.35)        // état par défaut (on le modifie au hover)
      .on("mouseenter", (event, d) => {
        // Tooltip de lien : montre source, target, value
        tooltip.style("display", "block").html(
        `<div style="font-weight:650;margin-bottom:4px;">Flux</div>
          <div><strong>${d.source.stage}:</strong> ${d.source.name}</div>
          <div><strong>${d.target.stage}:</strong> ${d.target.name}</div>
          <div style="margin-top:4px;"><strong>Nombre:</strong> ${format(d.value)}</div>`
        );

        // on atténue tout, puis on met en avant le lien survolé
        //ink.attr("stroke-opacity", 0.08); 
        //ça marche pas mdr.
        //d3.select(event.currentTarget).attr("stroke-opacity", 0.75);
      })

      
      .on("mousemove", (event) => {

        tooltip.style("left", (event.clientX + 12) + "px")       // Position du tooltip près du curseur
                .style("top", (event.clientY + 12) + "px");
      })
      .on("mouseleave", () => {
        tooltip.style("display", "none");
        link.attr("stroke-opacity", 0.35);
      });


  // -------- Noeuds (rectangles) ----------

  let node = svg.append("g")
    .selectAll("g.node")
    .data(graph.nodes)
    .join("g")
      .attr("class", "node");

  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => Math.max(1, d.y1 - d.y0))
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d))
    .attr("opacity", 0.95)
    .on("mouseenter", (event, d) => {

      
      tooltip.style("display", "block").html(     // Tooltip de noeud 
      `<div style="font-weight:650;margin-bottom:4px;">${d.stage}</div>
        <div>${d.name}</div>
        <div style="margin-top:4px;"><strong>Total:</strong> ${format(d.value)}</div>`
      );

      
      node.selectAll("rect").attr("opacity", n => {
        if (n === d) {
          return 1;
        } else {
          return 0.35;
        }
      }); // Atténue les autres noeuds pour un effet "focus" (J'ai pas réussi à faire pareil par les liens. Je suspecte une erreur de logique - duh)
    })

    .on("mousemove", (event) => {
      tooltip.style("left", (event.clientX + 12) + "px")
              .style("top", (event.clientY + 12) + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("display", "none");
      link.attr("stroke-opacity", 0.35);
      node.selectAll("rect").attr("opacity", 0.95);
    });


  // --- Labels ----
  node.append("text") // si le noeud est à gauche, on met le texte à droite du rectangle sinon à gauche (sinon ça sort du SVG) c'est le cas pour le dernier.
    .attr("x", d => {
        if (d.stage === "Surveillance") {
          return d.x0 - 8;
        } else {
          return d.x1 + 8;
        }
      })
    .attr("y", d => (d.y0 + d.y1) / 2)
    .attr("text-anchor", d => {
        if (d.stage === "Surveillance") {
          return "end";
        } else {
          return "start";
        }
      })
    .attr("fill", "rgba(255,255,255,0.85)")
    .attr("font-size", 11)
    .attr("dominant-baseline", "middle")
    .text(d => d.name);

} //Fin de render ici



// --------- Filtre -----------

// Copié collé de donuts
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

// Redraw quand l'utilisateur change le groupe / le seuil
groupSelect.addEventListener("change", render);
minLinkValueInput.addEventListener("input", render);




//  --------------- Chargement du CSV ------------------

// Copié collé de donuts
d3.dsv(";", "liste-der-prioritaeren-arten-TIDY.csv").then(raw => {

  events = raw.map(csvIntoObject);

  let groups = Array.from(new Set(events.map(d => d.group)))
    .filter(g => g && g !== "—")
    .sort((a, b) => a.localeCompare(b, "fr"));

  FiltreOptions(groups);
  render();
});
