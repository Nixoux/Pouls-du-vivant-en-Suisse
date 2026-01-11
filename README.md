
  

# Visualisation de données sur la biodiversité suisse

![Capture d'écran](img/Capture%20d'écran.png)


  

Ce travail a été réalisé par **Nicolas Verdes** dans le cadre du cours **« Visualisation de données »** donné par **Isaac Pante (UNIL)**.

L’objectif de ce projet est d’illustrer, à l’aide de **l’art génératif**, une donnée issue de la biodiversité suisse : **le degré de menace** pesant sur les espèces.

  

Plutôt que de chercher une représentation strictement “neutre”, ce travail assume une mise en scène : transformer un indicateur statistique en formes, rythmes et tensions visuelles, afin de questionner notre manière de percevoir et de ressentir l’état du vivant en Suisse.

  


  

## Contexte

L’image de la Suisse est souvent celle d’un pays “vert”, porté par ses montagnes, ses lacs, ses forêts et ses paysages emblématiques. Pourtant, cette image cohabite avec une réalité plus fragile : de nombreuses espèces voient leurs populations diminuer, certaines deviennent rares, d’autres disparaissent localement. Entre pressions humaines, fragmentation des habitats et transformations rapides des milieux, la biodiversité se retrouve sous contrainte.

  

Dans ce contexte, les données publiques (listes rouges, estimations d’experts, besoins d’action, état de la surveillance) jouent un rôle essentiel : elles permettent de mesurer, comparer et prioriser. Mais elles restent souvent perçues comme des tableaux distants, difficiles à lire et à relier à une expérience sensible.

  

Ce projet part de cette tension : comment donner une forme lisible et mémorable à ces chiffres, sans perdre leur signification ?

  


  
  

## Les données

  
  

Les données proviennent de l’**Office fédéral de la statistique (OFS)** et sont accessibles ici :

*Données datant du 14 juillet 2025.*
<https://www.bafu.admin.ch/fr/aides-execution-biodiversite> *(consulté le 03.01.2026)*.

  

Ces données proviennent elles-mêmes de différentes instances pour en citer quelques-unes :

  

- OFEV

- InfoSpecies

- InfoFlora

- Station ornithologique suisse

- Swissbryophytes

- SwissFungi

- SwissLichens

  

Le fichier Excel original a ensuite été **mis au propre** : suppression de lignes superflues (ou qui empêchaient de le considérer comme du *Tidy Data*), et insertion d’une valeur `NULL` là où des cellules étaient restées vides. Il a enfin été **converti en CSV** pour faciliter son exploitation dans les visualisations.

  
  


  

## Liste des variables utilisées et définitions

  
  

-  **GrouOrg** : Groupe d’organismes

-  **Menace** : Degré de menace au niveau national (liste rouge ou estimation d’experts)

-  **Urgence** : Besoin d’action à l’échelle nationale

-  **Nom scientifique** : Nom scientifique

-  **Surveillance des populations** : État de la surveillance des populations

  
  

-  **CANT_AG** : Canton d’Argovie

-  **CANT_AI** : Canton d’Appenzell Rhodes-Intérieures

-  **CANT_AR** : Canton d’Appenzell Rhodes-Extérieures

-  **CANT_BE** : Canton de Berne

-  **CANT_BL** : Canton de Bâle-Campagne

-  **CANT_BS** : Canton de Bâle-Ville

-  **CANT_FR** : Canton de Fribourg

-  **CANT_GE** : Canton de Genève

-  **CANT_GL** : Canton de Glaris

-  **CANT_GR** : Canton des Grisons

-  **CANT_JU** : Canton du Jura

-  **CANT_LU** : Canton de Lucerne

-  **CANT_NE** : Canton de Neuchâtel

-  **CANT_NW** : Canton de Nidwald

-  **CANT_OW** : Canton d’Obwald

-  **CANT_SG** : Canton de Saint-Gall

-  **CANT_SH** : Canton de Schaffhouse

-  **CANT_SO** : Canton de Soleure

-  **CANT_SZ** : Canton de Schwytz

-  **CANT_TG** : Canton de Thurgovie

-  **CANT_TI** : Canton du Tessin

-  **CANT_UR** : Canton d’Uri

-  **CANT_VD** : Canton de Vaud

-  **CANT_VS** : Canton du Valais

-  **CANT_ZG** : Canton de Zoug

-  **CANT_ZH** : Canton de Zurich

  

-  **État des données GBIF Suisse** : État des données selon le Système mondial d’information sur la biodiversité (GBIF) Suisse

-  **Lien à la page espèces du centre de données (de, fr)** : Lien vers la page de l'espèce du centre de données correspondant.

  

  
  

## Visualisation principale | Pouls du vivant en Suisse

  

Cette visualisation cherche volontairement à se placer **à la frontière entre l’art génératif et la visualisation de données**, en s’appuyant sur **d3.js**.

  

La donnée **« Menace »** est utilisée pour mettre en scène un **électrocardiogramme (ECG) inversé** : chaque **pic descendant** représente une **espèce distincte** de la biodiversité suisse. La **profondeur** de ces pics est déterminée par la **gravité de la situation** pour l’espèce concernée. Pour renforcer l’illusion d’un véritable tracé médical, un **« rebond »** est calculé après chaque pic, afin de donner davantage l’impression d’un rythme cardiaque.

Afin de traduire la gravité de manière cohérente, j’ai associé à chaque code de menace un **`extinctionLevel`** (niveau numérique). Les statuts décrivant une **extinction** (_éteint_, _éteint à l’état sauvage_, _éteint en Suisse_, _probablement éteint_) partagent ainsi le niveau **5**. Ensuite, j’ai hiérarchisé les autres catégories : _en danger critique_ (**4**), _en danger_ (**3**), _vulnérable_ et _potentiellement menacé_ (**2**), et _non menacé_ (**1**), tandis que les cas sans information fiable restent à **null**. Ce regroupement crée des **équivalences visuelles** : des statuts proches produisent un rendu comparable

Chaque espèce est matérialisée par un **petit cercle blanc** et s’accompagne d’interactions :

- au **survol**, des informations succinctes sont transmises ;

- au **clic**, une fenêtre s’ouvre avec davantage de détails pour permettre d’en lire plus sur l’espèce.

  

La ligne est tracée en **rouge**, afin d’appuyer l’idée d’une **« arythmie »** : le rythme est déréglé.

  

### Illustration de fond

  

L’illustration en arrière-plan a été réalisée par moi-même sur **Procreate**, à l’aide d’un **iPad**. Elle répond à quatre intentions, à la fois visuelles et symboliques.

  

1.  **Situer la donnée** : placer cet ECG dans un **paysage suisse** pour ancrer la visualisation dans un contexte immédiat (montagnes, forêt à peine visible, ville, lac).

2.  **Montrer la domination de l’humain** : la **ville** (l’humain) est l’objet qui domine ce paysage, non seulement par sa longueur mais aussi par sa hauteur. Certains immeubles s’élève au-dessus même des montagnes.

3.  **Insister sur la notion de reflet** : le **lac** agit comme un miroir du paysage, renforçant l’idée de **reflet de notre mode de vie** et de son impact sur le vivant.

4.  **Placer l’ECG sur l’horizon** : c’est la raison principale de l’agencement. L’ECG suit la ligne d’horizon, ce qui renforce l’idée que notre mode de vie a un impact et que celui-ci **se perçoit déjà à l’horizon**.

  

### Limitations

  

Cette visualisation présente cependant quelques limites.

  

-  **La lecture** : malgré les éléments interactifs, la lecture de l’ensemble des données reste **compliquée**, et rend une lecture globale des enjeux difficile. L’intention était de rendre **l’individu (l’espèce)** plus lisible ; mais en se focalisant sur l’individu, on **perd** une partie de la vision d’ensemble.

  

-  **Un biais de présentation** : On peut deviner un certain **militantisme** dans le choix de la métaphore (un ECG) et dans l’esthétique volontairement sombre d’une Suisse qui ne “rayonne” pas par ses couleurs : l’information est déjà orientée, avant même toute lecture détaillée. Ce biais est renforcé par la façon dont la variable **`extinctionLevel`** est construite : les statuts d’extinction (_éteint_, _éteint à l’état sauvage_, _éteint en Suisse_, _probablement éteint_) sont volontairement placés au niveau le plus élevé, ce qui produit des pics plus marqués et dramatise visuellement ces cas. 
Autrement dit, la visualisation ne se contente pas de représenter des catégories : elle les hiérarchise et les met en scène.

  

-  **Compréhension au premier regard** : il est possible qu’au premier coup d’œil, on ne comprenne pas immédiatement le sujet. La nature n’est pas volontairement la focale de l’image de fond. De plus, certaines personnes peuvent passer à côté de l’interactivité si elles ne survolent ou ne cliquent pas sur une espèce. C'est pourquoi le bouton informatif à vu le jour.

  

C’est pour répondre à ces limites que j’ai voulu y remédier avec une seconde visualisation, plus simple à comprendre, qui supprime les biais précédent, et est plus directe à manipuler.

  


  

## Visualisation 2 | Les Donuts

![Capture d'écran](img/Capture%20d'écran%20Donuts.png)

 Les Donuts voient le jour lorsque je réalise les limites de ma visualisation principale. Ainsi, c'est pour y répondre et pour avoir un message plus clair (et large) de la situation que je me décide à les faire.  

Cette visualisation met en avant **trois informations** que je trouve parmi les plus intéressantes pour chaque **groupe d’organismes** :

  

- le **degré de menace** (selon la liste rouge ou une estimation d’experts),

- le **besoin d’action** à l’échelle nationale,

- la **surveillance des populations**.

  

Un menu permet de choisir un groupe d’organismes et génère **trois donuts**, chacun illustrant l’une de ces informations. À côté des légendes, le chiffre affiché correspond au **nombre d’espèces concernées**. Au survol du donut, un **pourcentage** apparaît pour la portion sur laquelle on se trouve.

Cette visualisation offre une lecture **plus globale** (ce qui était l’objectif), mais elle a une limite importante : elle **sépare** les dimensions au lieu de les **relier**. On peut constater qu’un groupe contient beaucoup d’espèces menacées et qu’il affiche un besoin d’action élevé, sans savoir si ce sont **les mêmes espèces** qui expliquent ces deux constats. En bref, les donuts répondent bien à la question **« combien ? »** (répartition par catégories), mais pas à **« comment ces informations se combinent-elles ? »** ni à **« quel parcours suivent les espèces d’une catégorie à l’autre ? »**. C’est ce manque de relation qui a motivé la création de la troisième visualisation.

  


  

## Visualisation 3 | Flux

![Capture d'écran](img/Capture%20d'écran%20Flux.png)

Ainsi, **Flux** voit le jour. C’est en me baladant sur Observable que je suis tombé sur des visualisations de type **Sankey**, et l’idée m’a immédiatement intéressé : ce format donne la possibilité de **représenter des trajectoires**, c’est-à-dire de suivre le passage d’un groupe d’organismes à travers plusieurs catégories successives.

**Flux** est donc né comme une tentative de **mettre en relation** les informations que les donuts ne peuvent pas croiser : le **groupe d’organisme**, le **degré de menace**, le **besoin d’action** et l’**état de la surveillance**. La visualisation propose les mêmes principes d’interaction que les précédentes : on peut filtrer par groupe.

En revanche, ce choix de visualisation fonctionne moins bien, à mon avis, d’un point de vue **global** : la lecture est difficile, parfois confuse. Ce qui m'a été corroborer par la plupart des gens à qui j'ai montré ce travail. La quantité de lien peut rendre la lecture de l'ensemble confus. C'est ainsi que voit arriver l'option de fixer un seuil minimum. Ce réglage sert à réduire le “bruit” visuel: plus le seuil est élevé, moins il reste de liens et la lecture est plus claire. En contrepartie, **les petits groupes ou les cas rares disparaissent**, car leurs flux n’atteignent pas le nombre d’espèces requis pour être affichés.

Mais il permet tout de même de mettre en lumière certains aspects. L’exemple des **libellules** en est un bon : la surveillance de la population de cigales est principalement **insuffisante**. Cette visualisation permet surtout d’illustrer que les espèces de libellules  **en danger critique d’extinction** et nécessitant une **action urgente** sont, en réalité, **toutes** en surveillance insuffisante.

Néanmoins, c’est la visualisation que j’aime le moins, et je pense que cela vient du fait qu’à quelques exceptions près (cigales, libellules, etc.), elle peine à transmettre les relations entre catégories comme je l’aurais souhaité. Elle est difficile à lire : elle crée bien des flux entre les différents nœuds, mais dès qu’on passe à l’étape suivante, on perd rapidement le lien avec le groupe d’origine que l’on suivait. Pour remédier à ça, il serait intéressant de pouvoir **suivre un flux de bout en bout**. Par exemple, sélectionner le bloc **« en danger critique »** et observer sa trajectoire complète à travers les étapes, du début à la fin.

## En conclusion

Ainsi, ce projet explore trois approches complémentaires pour représenter une même réalité : la pression qui s’exerce sur la biodiversité suisse. 
Ces visualisations fonctionnent finalement comme un ensemble : l’une met l’accent sur l’impact et l’individu au travers d'un biais assumé, la seconde sur une synthèse plus globale, et la troisième sur les relations entre catégories. Elles rappellent surtout qu’il n’existe pas forcément de représentation “parfaite”, mais plutôt des choix de mise en scène et de lisibilité, chacun avec ses compromis.


## Usage de LLMs
Au cours de ce projet, j’ai utilisé des LLMs (ChatGPT 5.2 Thinking) comme outil d’assistance.  J’ai tout d'abord sollicité le modèle après le brainstorming, une fois l’idée défini et l'angle choisi, afin de structurer les étapes de réalisation et identifier les éléments techniques à implémenter. Exemple de prompt utilisé: Par quelles étapes dois je passer pour faire ce fonctionnement: Une ligne qui est dessiné et qui "bouge" comme un éléctrocardiogramme. Cette ligne ayant des piques différents selon les risques d'extinctions. et en survolant un point la ligne arrête d'avancer mais continue si on survole plus le point.

Le CSS a été principalement généré avec, puis ajusté pour correspondre à l’identité visuelle du projet.

Enfin, pour le JavaScript/D3, ChatGPT m’a aidé ponctuellement sur des fonctions utilitaires et des choix d’implémentation (ex. clamp, shuffle déterministe/Fisher-Yates, correction d'erreur et aide à la compréhension), tandis que la logique globale, l’intégration des données et la direction artistique restent basées sur mes propres décisions et itérations. Exemple de prompt utilisé: Peut tu me créer un bouton information près du titre? [+ tout le code lui a été fourni]

## Remerciement
Je voulais surtout remercier Florian Rieder, Nicolas Bovet, Valentine Cuenot, Chloé Chaudet et Théo Rochat pour leurs retours lors de la réalisation de ce travail.