// CV Jules Mudès - Version Anthropic v17
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 1.6cm, y: 1.3cm), paper: "a4")
#set text(font: "Segoe UI", size: 8.5pt, fill: rgb("#2d3748"))

#let primary = rgb("#1a365d")
#let accent = rgb("#2b6cb0")
#let gray = rgb("#718096")

// Header - with line breaks between parts
#align(center)[
  #text(size: 22pt, weight: "bold", fill: primary)[JULES MUDÈS]
  #v(0.2cm)
  #text(size: 11pt, fill: gray)[Ingénieur Architecte Solutions & Innovation · Transformation Supply Chain]
  #v(0.3cm)
  #text(size: 9pt, fill: gray)[Rennes, France (déplacement Paris régulier — 1h30 TGV)]
  #v(0.08cm)
  #text(size: 9pt, fill: gray)[06 61 03 01 64  ·  jmudes76000\@gmail.com]
  #v(0.08cm)
  #text(size: 9pt, fill: gray)[linkedin.com/in/jules-mudès-0a444992]
]

#v(0.35cm)
#line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
#v(0.2cm)

// Profile
#text(size: 10pt, weight: "bold", fill: primary)[PROFIL]
#v(0.12cm)

Architecte solutions avec 9 ans d'expérience en transformation Supply Chain et déploiement de systèmes d'entreprise pour des clients grands comptes français dans le luxe, le retail et l'industrie. Expert des solutions _WMS_ et _TMS_, j'ai une expertise IT et je gère également les sujets business dans les projets de déploiement. Par association, je collabore régulièrement avec les départements Finance, Contrôle de gestion et Achats.

Grâce à mon expertise _WMS_, je conçois la configuration des solutions pour implémenter les processus business. Je conseille les clients grâce à ma connaissance métier acquise au fil de mes missions chez une multitude de clients de différents secteurs.

J'interviens sur toutes les phases d'un projet de déploiement, du cadrage à la mise en production : architecture fonctionnelle, environnement technique IT, interfaçage, sujets d'infrastructure, testing, _cutover_. Depuis plusieurs années, je me concentre sur comment accélérer nos déploiements, notamment quand notre équipe déploie un projet d'envergure avec plusieurs dizaines de sites logistiques. Pour cela, je conçois et développe des outils et scripts (notamment Python) qui permettent de décupler l'action de nos équipes en réduisant les tâches répétitives et en permettant de se concentrer sur les tâches à plus haute valeur ajoutée.

Passionné par les avancées technologiques, je me tiens constamment informé des nouveaux concepts et techniques pour exploiter les _LLMs_ et l'IA. J'ai créé une académie _GenAI_ et _Agentic AI_ chez Capgemini qui propose une partie théorique ainsi qu'une session pratique que j'ai conçue. L'environnement d'expérimentation permet d'appeler des _LLMs_ et de tester des comportements agentiques avec un agent qui interagit dans un environnement proche de celui de nos clients. Pour cela, j'ai créé des _mocks_ d'ERP et _WMS_ grâce aux outils _GenAI_ et conçu des situations proches de la réalité que les consultants doivent améliorer avec une solution _Agentic AI_.

#v(0.3cm)

// Experience
#text(size: 10pt, weight: "bold", fill: primary)[EXPÉRIENCE PROFESSIONNELLE — CAPGEMINI]
#text(size: 9pt, fill: gray)[ · Architecte Solutions & Innovation · 9 ans]
#v(0.15cm)

// Role AVV - with left border to show it's parallel
#block(
  inset: (left: 8pt),
  stroke: (left: 2pt + accent),
)[
  #grid(
    columns: (1fr, auto),
    text(weight: "bold")[Contributeur Avant-Vente — Équipe _Solutionning_, Practice Supply Chain],
    text(fill: gray, size: 8.5pt)[2022 — Présent]
  )
  #text(fill: gray, size: 8pt, style: "italic")[En parallèle des missions de delivery · Réponses à appels d'offres grands comptes]
  #v(0.06cm)
  - Conception de solutions sur-mesure et chiffrages techniques
  - Construction de démonstrations et preuves de concept
  - Présentations et soutenances auprès de décideurs (C-level, DSI)
  - Exemple d'innovation : Solution basée sur _l'Agent SDK Anthropic_ pour automatiser la saisie de tarifs transporteur — gain de temps estimé 5x, projet remporté grâce à cette démo
]

#v(0.2cm)

// Role 0 - Current Adeo
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Architecte Solutions — Migration _WMS_],
  text(fill: gray, size: 8.5pt)[Nov 2025 — Présent]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : leader européen du bricolage · 40 entrepôts logistiques en Europe]
#v(0.06cm)
- Définition de la _roadmap_ d'industrialisation et suivi de sa réalisation — création d'outils pour accélérer le projet
- Conception d'outils automatisant la configuration, la migration de données, le testing et la formation utilisateurs
- Supervision du développement des outils et contribution directe via _GitHub Copilot_ et _Claude Code_
- Présentations aux décideurs BU : bénéfices du projet, évolutions de la solution, alignement stratégique

#v(0.2cm)

// Role 1 - Retail
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Architecte Solutions — Programme _WMS_],
  text(fill: gray, size: 8.5pt)[Juin 2024 — Oct 2025]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : grand groupe du retail français · 100+ sites en France · Équipe de 15 personnes]
#v(0.06cm)
- Définition de la liste des outils à créer pour industrialiser le programme
- Supervision du développement de ces outils et contribution directe via _GitHub Copilot_ et _Claude Code_
- Pilotage de l'équipe de développement des interfaces (50 flux d'intégration)

#v(0.2cm)

// Role 1.5 - Stellantis benchmark
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Consultant Senior — Benchmark et choix de solution _WMS_],
  text(fill: gray, size: 8.5pt)[Juin 2024 — Oct 2024]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : groupe automobile français · Cadrage stratégique avec la DSI]
#v(0.06cm)
- _Benchmark_ et sélection de solution _WMS_ en intégrant les contraintes IT
- Alignement des besoins IT et métier avec les parties prenantes
- Présentation des conclusions et recommandations à la DSI

#v(0.2cm)

// Role 2
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Consultant Senior Interface],
  text(fill: gray, size: 8.5pt)[Jan 2023 — Juin 2024]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : grande maison du luxe français · Déploiement de 2 sites mécanisés · Projet en anglais]
#v(0.06cm)
- Conception et spécification des interfaces projet (50+ demi-interfaces) pour plateforme _iPaaS_
- Conception du processus de synchronisation d'inventaire et de la solution technique
- Pilotage de la stratégie de _cutover_ et coordination de la migration de données

#v(0.2cm)

// Roles 3-6 merged (2017-2022)
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Chef d'équipe & Responsable Technique _WMS_],
  text(fill: gray, size: 8.5pt)[Sept 2017 — Déc 2022]
)
#text(fill: gray, size: 8pt, style: "italic")[Multi-clients : retailers et maisons du luxe français · Programmes internationaux en anglais]
#v(0.06cm)
- Définition des processus de tests de non-régression et management des équipes de recette
- Cadrage projet et conception de solutions avec l'éditeur Manhattan
- Pilotage des phases de test, plans de _cutover_ et coordination des migrations de données
- Support utilisateurs sur la solution _WMS_ et processus métier

#v(0.3cm)

// Skills in 2 columns
#text(size: 10pt, weight: "bold", fill: primary)[COMPÉTENCES]
#v(0.12cm)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.8cm,
  [
    *Technique*
    - _WMS/TMS_ : Manhattan, Hardis Reflex, Blue Yonder, Reply, Infolog
    - ERP : SAP S/4HANA
    - Python, SQL/PL-SQL, Bash, HTML/CSS
    - Cloud : GCP, Azure, SAP BTP
    - Outils IA : _GitHub Copilot_, _Claude Code_, _Claude Cowork_, _Codex_
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

- *Domotique & IA :* J'utilise le projet _Home Assistant_ pour gérer mon appartement. J'ai créé un _skill Claude Code_ pour interagir avec mon instance et notamment : surveiller ma consommation électrique, automatiser le chauffage selon présence/absence, déclencher des alertes lors d'anomalies. J'utilise des projets _open source_ pour gérer mon administratif personnel.
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
