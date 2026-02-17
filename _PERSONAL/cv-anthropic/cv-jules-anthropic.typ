// CV Jules Mudès - Version Anthropic
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 1.8cm, y: 1.5cm), paper: "a4")
#set text(font: "Segoe UI", size: 9.5pt, fill: rgb("#2d3748"))

#let primary = rgb("#1a365d")
#let accent = rgb("#2b6cb0")
#let gray = rgb("#718096")

// Header
#align(center)[
  #text(size: 22pt, weight: "bold", fill: primary)[JULES MUDÈS]
  #v(0.2cm)
  #text(size: 11pt, fill: gray)[Solutions Architect · Supply Chain & AI]
  #v(0.3cm)
  #text(size: 9pt, fill: gray)[
    📍 Rennes, France  ·  ✉️ jmudes76000\@gmail.com  ·  🔗 linkedin.com/in/julesmudes
  ]
]

#v(0.5cm)
#line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
#v(0.3cm)

// Profile
#text(size: 11pt, weight: "bold", fill: primary)[PROFIL]
#v(0.2cm)

Architecte solutions avec 8 ans d'expérience en transformation digitale et systèmes d'entreprise. Expert en intégration de solutions complexes pour clients grands comptes. Activité régulière d'avant-vente depuis 4 ans : conception de solutions, construction de démos, et présentations clients. Passionné par l'IA appliquée — j'utilise les LLMs au quotidien pour automatiser et innover.

#v(0.4cm)

// Experience
#text(size: 11pt, weight: "bold", fill: primary)[EXPÉRIENCE PROFESSIONNELLE]
#v(0.2cm)

#grid(
  columns: (1fr, auto),
  [#text(weight: "bold", size: 10pt)[Capgemini] #h(0.3cm) #text(fill: gray, size: 9pt)[Retail & Consumer Goods · Practice Supply Chain]],
  text(fill: gray, size: 9pt)[2017 — Présent]
)
#v(0.3cm)

// Current role
#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Solution Architect — Programme de migration internationale],
  text(fill: gray, size: 9pt)[2024 — Présent]
)
#text(fill: gray, size: 9pt, style: "italic")[100+ sites · Budget multi-millions · Équipe 15+ personnes]
#v(0.1cm)
- Définition de la roadmap technique et pilotage de l'industrialisation du déploiement
- Lead de l'équipe interfaces : design et mapping de 50+ flux d'intégration (iPaaS)
- Développement d'outils d'automatisation en Python pour accélérer les migrations
- *Avant-vente :* Construction d'une démo basée sur l'Agent SDK (Anthropic) pour automatiser la saisie de tarifs transport → gain 5x, projet remporté

#v(0.3cm)

#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Expert Technique & Fonctionnel — Migrations WMS],
  text(fill: gray, size: 9pt)[2021 — 2024]
)
#text(fill: gray, size: 9pt, style: "italic")[Rollout 44 sites puis migration 2 sites France/Italie]
#v(0.1cm)
- Spécification de 50+ interfaces techniques (API REST, iPaaS)
- Lead des phases de cutover et migration de données
- Management d'une équipe de testeurs, mise en place des processus TNR end-to-end
- *Avant-vente :* Chiffrages techniques, réponses RFP, soutenances clients

#v(0.3cm)

#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Technical Lead — Entrepôt mécanisé (Chanel)],
  text(fill: gray, size: 9pt)[2019 — 2020]
)
#text(fill: gray, size: 9pt, style: "italic")[4 systèmes WCS intégrés · Environnement haute disponibilité]
#v(0.1cm)
- Conception d'algorithmes de colisage et gestion des écarts de stock
- Intégration multi-systèmes et gestion des environnements de versioning
- *Avant-vente :* Démonstrations techniques et ateliers de conception avec le client

#v(0.3cm)

#grid(
  columns: (1fr, auto),
  text(weight: "bold")[Consultant Intégration & Tests],
  text(fill: gray, size: 9pt)[2017 — 2019]
)
#v(0.1cm)
- Pilotage des campagnes de tests UAT et support au démarrage
- Développement de scripts de migration et validation de données

#v(0.4cm)

// Skills in 2 columns
#text(size: 11pt, weight: "bold", fill: primary)[COMPÉTENCES]
#v(0.2cm)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 1cm,
  [
    *Technique*
    - Python (scripting, automatisation, IA)
    - API REST, iPaaS, intégrations enterprise
    - SQL / PL-SQL, migration de données
    - Architectures cloud et WMS (Manhattan)
    - LLMs : Claude API, Agent SDK, prompting
  ],
  [
    *Client & Avant-vente*
    - Conception de solutions sur-mesure
    - Réponses RFP et chiffrages
    - Démos et PoC techniques
    - Présentations C-level
    - Ateliers de découverte et co-design
  ]
)

#v(0.4cm)

// Projects
#text(size: 11pt, weight: "bold", fill: primary)[PROJETS PERSONNELS — IA APPLIQUÉE]
#v(0.2cm)

*Automatisation domestique avec LLMs*
- Utilisation quotidienne de Claude pour automatiser tâches administratives et domotique
- Intégration Home Assistant : scripts de détection de présence basés sur la consommation électrique
- Contribution à des projets open-source utilisant les modèles Anthropic

#v(0.4cm)

// Footer: Education & Languages
#grid(
  columns: (1fr, 1fr),
  column-gutter: 1cm,
  [
    #text(size: 11pt, weight: "bold", fill: primary)[FORMATION]
    #v(0.15cm)
    *Ingénieur Généraliste* — HEI Lille (2016)
  ],
  [
    #text(size: 11pt, weight: "bold", fill: primary)[LANGUES]
    #v(0.15cm)
    Français (natif) · Anglais (courant) · Italien (notions)
  ]
)
