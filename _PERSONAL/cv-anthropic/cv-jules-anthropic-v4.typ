// CV Jules Mudès - Version Anthropic v4
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 1.6cm, y: 1.4cm), paper: "a4")
#set text(font: "Segoe UI", size: 9pt, fill: rgb("#2d3748"))

#let primary = rgb("#1a365d")
#let accent = rgb("#2b6cb0")
#let gray = rgb("#718096")

// Header
#align(center)[
  #text(size: 22pt, weight: "bold", fill: primary)[JULES MUDÈS]
  #v(0.2cm)
  #text(size: 11pt, fill: gray)[Architecte Solutions · Supply Chain & Intégration]
  #v(0.3cm)
  #text(size: 9pt, fill: gray)[
    📍 Rennes, France  ·  ✉️ jmudes76000\@gmail.com  ·  🔗 linkedin.com/in/julesmudes
  ]
]

#v(0.4cm)
#line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
#v(0.25cm)

// Profile
#text(size: 10pt, weight: "bold", fill: primary)[PROFIL]
#v(0.15cm)

Architecte solutions avec 8 ans d'expérience en transformation Supply Chain et intégration de systèmes d'entreprise pour des clients grands comptes français (luxe, retail, consumer goods). Expert Manhattan MAWM/WMOS et industrialisation (migration de données, automatisation, développement d'outils). Activité régulière d'avant-vente en parallèle des missions : conception de solutions, construction de démos, réponses RFP et présentations clients. Passionné par l'IA appliquée — utilisation quotidienne des LLMs pour automatiser et innover.

#v(0.35cm)

// Experience
#text(size: 10pt, weight: "bold", fill: primary)[EXPÉRIENCE PROFESSIONNELLE — CAPGEMINI]
#text(size: 9pt, fill: gray)[ · Retail & Consumer Goods · 8 ans]
#v(0.2cm)

// Role 1
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Architecte Solutions — Programme de migration MAWM],
  text(fill: gray, size: 9pt)[Juin 2024 — Présent]
)
#text(fill: gray, size: 8.5pt, style: "italic")[Client : grand groupe du retail français · 100+ sites internationaux · Équipe de 15 personnes]
#v(0.08cm)
- Définition de la roadmap d'industrialisation pour accompagner le programme de migration
- Pilotage de l'équipe de développement des interfaces (50 flux d'intégration)
- Suivi du ROI sur les outils d'industrialisation développés
- Développement d'outils d'automatisation en Python avec assistance IA (GitHub Copilot, Claude)
- *Avant-vente :* Conception et présentation d'une démo basée sur l'Agent SDK Anthropic pour automatiser la saisie de tarifs transport — gain de productivité 5x, projet remporté

#v(0.25cm)

// Role 2
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Expert Technique-Fonctionnel MAWM],
  text(fill: gray, size: 9pt)[Jan 2023 — Juin 2024]
)
#text(fill: gray, size: 8.5pt, style: "italic")[Client : grande maison du luxe français · 2 sites France & Italie · Décommissionnement WMOS]
#v(0.08cm)
- Conception et spécification des interfaces projet (50+ demi-interfaces) pour plateforme iPaaS
- Conception et validation des spécifications d'extensions MAWM
- Conception du processus de synchronisation d'inventaire et de la solution technique
- Pilotage de la stratégie de cutover et coordination de la migration de données
- *Avant-vente :* Chiffrages techniques, réponses RFP, soutenances clients

#v(0.25cm)

// Role 3
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Chef d'équipe Factory & Expert Programme MAWM],
  text(fill: gray, size: 9pt)[Oct 2021 — Déc 2022]
)
#text(fill: gray, size: 8.5pt, style: "italic")[Client : grand groupe du retail français · Programme international · Déploiement de 44 entrepôts]
#v(0.08cm)
- Définition des processus de tests de non-régression de bout en bout
- Management de l'équipe de rédaction des scripts de test et d'exécution des campagnes
- Cadrage et conception des outils de migration de données, configuration en masse
- Mise en place de l'outil de gestion des tests
- *Avant-vente :* Démonstrations techniques et animation d'ateliers de conception

#v(0.25cm)

// Role 4
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Responsable Intégration WMS & Référent Technique],
  text(fill: gray, size: 9pt)[Sept 2020 — Sept 2021]
)
#text(fill: gray, size: 8.5pt, style: "italic")[Client : grand groupe français du consumer goods · Migration vers WMOS · Décommissionnement INFOLOG]
#v(0.08cm)
- Cadrage projet et conception de la solution avec l'éditeur Manhattan
- Définition des stratégies et pilotage des phases de test
- Définition et gestion du plan de cutover

#v(0.25cm)

// Role 5
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Responsable Technique — Entrepôt mécanisé],
  text(fill: gray, size: 9pt)[Oct 2019 — Mars 2020]
)
#text(fill: gray, size: 8.5pt, style: "italic")[Client : grande maison du luxe français · Entrepôt central hautement mécanisé · 4 systèmes WCS]
#v(0.08cm)
- Préparation et animation des sessions de test et recette utilisateur
- Analyse et amélioration de l'algorithme de colisage
- Analyse et correction des écarts de stock WMS/ERP/WCS

#v(0.25cm)

// Role 6
#text(fill: gray, size: 9pt, style: "italic")[2017 — 2019 : Chef de projet intégration (client luxe français), pilotage des tests de recette, support au démarrage]

#v(0.35cm)

// Skills in 2 columns
#text(size: 10pt, weight: "bold", fill: primary)[COMPÉTENCES]
#v(0.15cm)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.8cm,
  [
    *Technique*
    - Manhattan MAWM, WMOS, API MAWM
    - Python, SQL/PL-SQL, Bash
    - Intégration iPaaS, API REST
    - Migration de données, automatisation
    - LLMs : Claude API, Agent SDK, prompting
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

#v(0.35cm)

// Projects
#text(size: 10pt, weight: "bold", fill: primary)[PROJETS PERSONNELS — IA APPLIQUÉE]
#v(0.15cm)

- Utilisation quotidienne de Claude pour automatiser tâches administratives et domotique
- Intégration Home Assistant avec scripts IA (détection de présence basée sur consommation électrique)
- Contribution à des projets open-source utilisant les modèles Anthropic

#v(0.35cm)

// Footer
#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.8cm,
  [
    #text(size: 10pt, weight: "bold", fill: primary)[FORMATION]
    #v(0.1cm)
    Ingénieur Généraliste — HEI Lille (2016)
  ],
  [
    #text(size: 10pt, weight: "bold", fill: primary)[LANGUES]
    #v(0.1cm)
    Français (natif) · Anglais (courant) · Italien (notions)
  ]
)
