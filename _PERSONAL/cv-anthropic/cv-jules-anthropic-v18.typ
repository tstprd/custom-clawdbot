// CV Jules Mudès - Version Anthropic v18
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 1.5cm, y: 1.2cm), paper: "a4")
#set text(font: "Segoe UI", size: 8.5pt, fill: rgb("#2d3748"))

#let primary = rgb("#1a365d")
#let accent = rgb("#3182ce")
#let lightbg = rgb("#f7fafc")
#let gray = rgb("#718096")

// Header with subtle color background
#block(
  fill: lightbg,
  inset: (x: 12pt, y: 14pt),
  radius: 4pt,
  width: 100%,
)[
  #align(center)[
    #text(size: 22pt, weight: "bold", fill: primary)[JULES MUDÈS]
    #v(0.15cm)
    #text(size: 11pt, fill: accent)[Architecte Solutions & Innovation · Supply Chain]
    #v(0.25cm)
    #text(size: 9pt, fill: gray)[Rennes, France (déplacement Paris régulier — 1h30 TGV)]
    #v(0.05cm)
    #text(size: 9pt, fill: gray)[06 61 03 01 64  ·  jmudes76000\@gmail.com]
    #v(0.05cm)
    #link("https://linkedin.com/in/jules-mudès-0a444992")[#text(size: 9pt, fill: accent)[linkedin.com/in/jules-mudès-0a444992]]
  ]
]

#v(0.3cm)

// Profile
#text(size: 10pt, weight: "bold", fill: primary)[PROFIL]
#v(0.1cm)

Architecte solutions avec 9 ans d'expérience en transformation Supply Chain et déploiement de systèmes d'entreprise pour des clients grands comptes français (luxe, retail, industrie). Expert _WMS/TMS_, je gère les sujets IT et business, et collabore régulièrement avec Finance, Contrôle de gestion et Achats.

J'ai une vraie curiosité pour comprendre le fonctionnement de mes clients et concevoir des solutions qui leur permettent d'opérer plus efficacement. C'est pour cela que je me plais dans le consulting : la diversité des clients, industries et modes de fonctionnement me stimule.

J'interviens sur toutes les phases d'un projet de déploiement, du cadrage à la mise en production. Depuis plusieurs années, je me concentre sur l'accélération de nos déploiements multi-sites en concevant des outils Python utilisant la _GenAI_ et interagissant avec les _WMS/TMS_.

Passionné par l'IA, j'ai créé une académie _GenAI_ et _Agentic AI_ chez Capgemini avec l'ambition de former 30 collaborateurs. J'ai conçu un environnement d'expérimentation qui leur permet de tester des comportements agentiques sur des _mocks_ d'ERP/_WMS_ que j'ai développés.

#v(0.25cm)

// Experience
#text(size: 10pt, weight: "bold", fill: primary)[EXPÉRIENCE PROFESSIONNELLE — CAPGEMINI]
#text(size: 9pt, fill: gray)[ · 9 ans]
#v(0.12cm)

// Role AVV
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Contributeur Avant-Vente — Équipe _Solutionning_, Practice Supply Chain],
  text(fill: gray, size: 8.5pt)[2022 — Présent]
)
#text(fill: gray, size: 8pt, style: "italic")[En parallèle des missions · Réponses à appels d'offres grands comptes]
#v(0.05cm)
- Suivi des phases de l'avant-vente : réponse RFP/RFI, démonstrations, négociations, définition RACI
- Conception de solutions et chiffrages — _avec commerce interne et acheteurs client_
- Recueil des besoins depuis le RFP — _avec responsables IT et métier client_
- Présentations et soutenances — _auprès des décideurs business et IT client_
- Exemple : Chatbot _Agent SDK Anthropic_ pour charger automatiquement les grilles tarifaires transport — gain 5x, projet remporté

#v(0.15cm)

// Role Adeo
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Architecte Solutions — Migration _WMS_],
  text(fill: gray, size: 8.5pt)[Nov 2025 — Présent]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : leader européen du bricolage · 40 entrepôts en Europe]
#v(0.05cm)
- Définition _roadmap_ d'industrialisation — _basée sur prérequis IT, validée avec engineering team centrale_
- Conception outils automatisant configuration, migration, testing, formation — _besoins validés avec métier et IT_
- Supervision développement et contribution via _GitHub Copilot_ et _Claude Code_
- Présentations aux décideurs BU — _responsables métier et IT_

#v(0.15cm)

// Role Retail
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Architecte Solutions — Programme _WMS_],
  text(fill: gray, size: 8.5pt)[Juin 2024 — Oct 2025]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : grand groupe retail français · 100+ sites · Équipe de 15 personnes]
#v(0.05cm)
- Définition des outils pour industrialiser le programme — _avec engineering team centrale_
- Supervision développement et contribution via _GitHub Copilot_ et _Claude Code_
- Pilotage équipe interfaces (50 flux) — _coordination avec IT systèmes adjacents (ERP, OMS, TMS)_

#v(0.15cm)

// Role Stellantis
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Consultant Senior — Benchmark et choix solution _WMS_],
  text(fill: gray, size: 8.5pt)[Juin 2024 — Oct 2024]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : groupe automobile français · Cadrage stratégique]
#v(0.05cm)
- _Benchmark_ et sélection solution _WMS_ — _avec DSI et architectes IT_
- Alignement besoins IT et métier — _avec responsables logistique et IT_
- Présentation conclusions — _à la DSI et comité de direction_

#v(0.15cm)

// Role Luxe
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Consultant Senior Interface],
  text(fill: gray, size: 8.5pt)[Jan 2023 — Juin 2024]
)
#text(fill: gray, size: 8pt, style: "italic")[Client : grande maison du luxe français · 2 sites mécanisés · Projet en anglais]
#v(0.05cm)
- Conception interfaces (50+ demi-interfaces) — _avec interface team et éditeurs systèmes adjacents_
- Processus synchronisation inventaire — _validé avec métier entrepôt et IT centrale_
- Pilotage stratégie _cutover_ — _coordination IT, métier et éditeur WMS_

#v(0.15cm)

// Role 2017-2022
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Chef d'équipe & Responsable Technique _WMS_],
  text(fill: gray, size: 8.5pt)[Sept 2017 — Déc 2022]
)
#text(fill: gray, size: 8pt, style: "italic")[Multi-clients : retailers et maisons du luxe français · Projets internationaux en anglais]
#v(0.05cm)
- Définition processus de tests et management équipes recette — _avec key users métier_
- Cadrage et conception solutions — _avec éditeur Manhattan et IT client_
- Pilotage tests et migrations de données — _avec IT et métier_
- Support utilisateurs solution _WMS_ — _auprès des opérationnels entrepôt_

#v(0.25cm)

// Skills in 2 columns
#text(size: 10pt, weight: "bold", fill: primary)[COMPÉTENCES]
#v(0.1cm)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.6cm,
  [
    *Technique*
    - _WMS/TMS_ : Manhattan, Hardis Reflex, Blue Yonder, Reply, Infolog
    - ERP : SAP S/4HANA
    - Python, SQL/PL-SQL, Bash, HTML/CSS
    - Cloud : GCP, Azure, SAP BTP
    - Outils IA : _GitHub Copilot_, _Claude Code_, _Codex_
  ],
  [
    *Relation client & Avant-vente*
    - Conception solutions sur-mesure
    - Spécifications techniques-fonctionnelles
    - Réponses appels d'offres et chiffrages
    - Démonstrations et preuves de concept
    - Animation ateliers parties prenantes
  ]
)

#v(0.25cm)

// Projects & Interests
#text(size: 10pt, weight: "bold", fill: primary)[PROJETS PERSONNELS & CENTRES D'INTÉRÊT]
#v(0.1cm)

- *Domotique & IA :* _Home Assistant_ + _skill Claude Code_ pour surveiller consommation électrique, automatiser chauffage selon présence. Projets _open source_ pour gestion administrative personnelle.
- *Électronique :* Arduino, Raspberry Pi — arrosage automatique, surveillance température
- *Sport :* Squash (compétition) · Volley (loisir)

#v(0.25cm)

// Footer
#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.6cm,
  [
    #text(size: 10pt, weight: "bold", fill: primary)[FORMATION]
    #v(0.08cm)
    Ingénieur Généraliste — HEI Lille (2016)
    #text(fill: gray, size: 8pt)[Spécialité Conception Mécanique]
  ],
  [
    #text(size: 10pt, weight: "bold", fill: primary)[LANGUES]
    #v(0.08cm)
    Français (natif) · Anglais (courant — projets livrés en anglais avec équipes internationales) · Italien (notions)
  ]
)
