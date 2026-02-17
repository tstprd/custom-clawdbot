// CV Jules Mudès - Version Anthropic v15
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 1.6cm, y: 1.3cm), paper: "a4")
#set text(font: "Segoe UI", size: 8.5pt, fill: rgb("#2d3748"))

#let primary = rgb("#1a365d")
#let accent = rgb("#2b6cb0")
#let gray = rgb("#718096")

// Header
#align(center)[
  #text(size: 22pt, weight: "bold", fill: primary)[JULES MUDÈS]
  #v(0.2cm)
  #text(size: 11pt, fill: gray)[Ingénieur Architecte Solutions & Innovation · Transformation Supply Chain]
  #v(0.3cm)
  #text(size: 9pt, fill: gray)[
    Rennes, France  ·  jmudes76000\@gmail.com  ·  linkedin.com/in/jules-mudès-0a444992
  ]
]

#v(0.35cm)
#line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
#v(0.2cm)

// Profile
#text(size: 10pt, weight: "bold", fill: primary)[PROFIL]
#v(0.12cm)

Architecte solutions avec 9 ans d'expérience en transformation Supply Chain et déploiement de systèmes d'entreprise pour des clients grands comptes français dans le luxe, le retail et l'industrie. Expert des solutions WMS et TMS, j'ai une expertise IT et je gère également les sujets business dans les projets de déploiement. Par association, je collabore régulièrement avec les départements Finance, Contrôle de gestion et Achats.

J'interviens sur le cadrage des projets : architecture fonctionnelle, environnement technique IT, interfaçage, sujets d'infrastructure et organisation des tâches et des acteurs. J'accélère le projet en développant des outils et scripts (notamment Python) qui permettent de réduire les tâches répétitives et de permettre aux équipes de se concentrer sur le déploiement et les tâches à plus haute valeur ajoutée.

Passionné par les avancées technologiques, je me tiens constamment informé des nouveaux concepts et techniques pour exploiter les LLMs et l'IA. J'ai créé une académie GenAI et Agentic AI chez Capgemini qui propose une partie théorique ainsi qu'une session pratique que j'ai conçue. L'environnement d'expérimentation permet d'appeler des LLMs et de tester des comportements agentiques avec un agent qui interagit avec des ERP/WMS — les outils que nos équipes utilisent au quotidien.

#v(0.3cm)

// Experience
#text(size: 10pt, weight: "bold", fill: primary)[EXPÉRIENCE PROFESSIONNELLE — CAPGEMINI]
#text(size: 9pt, fill: gray)[ · Architecte Solutions & Innovation · 9 ans]
#v(0.08cm)
#text(fill: gray, size: 8pt, style: "italic")[Équipe Supply Chain de ~100 consultants spécialisés · Fonctionnement agile · Exposition à de multiples environnements d'entreprise]
#v(0.15cm)

// Role AVV - with left border to show it's parallel
#block(
  inset: (left: 8pt),
  stroke: (left: 2pt + accent),
)[
  #grid(
    columns: (1fr, auto),
    text(weight: "bold")[Contributeur Avant-Vente — Practice Supply Chain],
    text(fill: gray, size: 8.5pt)[2022 — Présent]
  )
  #text(fill: gray, size: 8pt, style: "italic")[En parallèle des missions de delivery · Réponses à appels d'offres grands comptes]
  #v(0.06cm)
  - Conception de solutions sur-mesure et chiffrages techniques
  - Construction de démonstrations et preuves de concept
  - Présentations et soutenances auprès de décideurs (C-level, DSI)
  - *Innovation :* Démo basée sur l'Agent SDK Anthropic pour automatiser la saisie de tarifs transport — gain 5x, projet remporté
]

#v(0.2cm)

// Role 0 - Current Adeo
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Architecte Solutions — Cadrage transformation WMS],
  text(fill: gray, size: 8.5pt)[Nov 2025 — Présent]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : leader européen du bricolage · Définition roadmap et alignement stratégique]
#v(0.06cm)
- Définition de la roadmap d'industrialisation et suivi de sa réalisation — création d'outils pour accélérer le projet
- Conception d'outils automatisant la configuration, la migration de données, le testing et la formation utilisateurs
- Présentations pédagogiques aux responsables de BU : bénéfices du projet, évolutions de la solution

#v(0.2cm)

// Role 1 - Retail
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Architecte Solutions — Programme WMS],
  text(fill: gray, size: 8.5pt)[Juin 2024 — Oct 2025]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : grand groupe du retail français · 100+ sites en France · Équipe de 15 personnes]
#v(0.06cm)
- Définition de la liste des outils à créer pour industrialiser le programme
- Supervision du développement de ces outils et contribution directe via GitHub Copilot et Claude Code
- Pilotage de l'équipe de développement des interfaces (50 flux d'intégration)

#v(0.2cm)

// Role 1.5 - Stellantis benchmark
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Consultant Senior — Benchmark et choix de solution WMS],
  text(fill: gray, size: 8.5pt)[Juin 2024 — Oct 2024]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : groupe automobile français · Cadrage stratégique avec la DSI]
#v(0.06cm)
- Benchmark et sélection de solution WMS en intégrant les contraintes IT
- Alignement des besoins IT et métier avec les parties prenantes
- Présentation des conclusions et recommandations à la DSI

#v(0.2cm)

// Role 2
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Expert Technique-Fonctionnel WMS],
  text(fill: gray, size: 8.5pt)[Jan 2023 — Juin 2024]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : grande maison du luxe français · 2 sites France & Italie · Projet en anglais]
#v(0.06cm)
- Conception et spécification des interfaces projet (50+ demi-interfaces) pour plateforme iPaaS
- Conception du processus de synchronisation d'inventaire et de la solution technique
- Pilotage de la stratégie de cutover et coordination de la migration de données

#v(0.2cm)

// Roles 3-5 merged
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Chef d'équipe & Responsable Technique WMS],
  text(fill: gray, size: 8.5pt)[Oct 2019 — Déc 2022]
)
#text(fill: gray, size: 8pt, style: "italic")[Clients : retailers et maisons du luxe français · Programmes internationaux en anglais]
#v(0.06cm)
- Définition des processus de tests de non-régression et management des équipes de recette
- Cadrage projet et conception de solutions avec l'éditeur Manhattan
- Pilotage des phases de test, plans de cutover et coordination des migrations de données
- Animation des sessions de recette utilisateur, optimisation d'algorithmes (colisage)

#v(0.2cm)

// Role 6
#text(fill: gray, size: 8.5pt, style: "italic")[2017 — 2019 : Chef de projet intégration (client luxe français), pilotage des tests de recette, support au démarrage]

#v(0.3cm)

// Skills in 2 columns
#text(size: 10pt, weight: "bold", fill: primary)[COMPÉTENCES]
#v(0.12cm)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.8cm,
  [
    *Technique*
    - WMS/TMS : Manhattan, Hardis Reflex, Blue Yonder
    - Python, SQL/PL-SQL, Bash, HTML/CSS
    - Cloud : GCP, Azure, SAP
    - Outils IA : GitHub Copilot, Claude Code, Codex
  ],
  [
    *Relation client & Avant-vente*
    - Conception de solutions sur-mesure
    - Spécifications techniques-fonctionnelles
    - Réponses à appels d'offres et chiffrages
    - Démonstrations et preuves de concept
    - Animation d'ateliers avec parties prenantes
  ]
)

#v(0.3cm)

// Projects & Interests merged
#text(size: 10pt, weight: "bold", fill: primary)[PROJETS PERSONNELS & CENTRES D'INTÉRÊT]
#v(0.12cm)

- *Domotique & IA :* J'utilise le projet Home Assistant et j'ai connecté Claude Code à ce projet pour surveiller ma consommation électrique et automatiser le chauffage selon présence/absence. Appel aux modèles LLM pour l'automatisation de mes tâches administratives personnelles
- *Bricolage électronique :* Arduino, Raspberry Pi — projets d'arrosage automatique des plantes, surveillance température maison
- *Sport :* Squash (compétition) · Volley (loisir)

#v(0.3cm)

// Footer
#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.8cm,
  [
    #text(size: 10pt, weight: "bold", fill: primary)[FORMATION]
    #v(0.1cm)
    Ingénieur Généraliste — HEI Lille (2016)
    #text(fill: gray, size: 8pt)[Spécialité Conception Mécanique]
  ],
  [
    #text(size: 10pt, weight: "bold", fill: primary)[LANGUES]
    #v(0.1cm)
    Français (natif) · Anglais (courant, projets internationaux) · Italien (notions)
  ]
)
