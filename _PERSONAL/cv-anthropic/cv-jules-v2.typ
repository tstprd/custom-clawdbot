// CV Jules Mudès - Version 2 - Detailed
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 1.4cm, y: 1.3cm), paper: "a4")
#set text(font: "Segoe UI", size: 9pt, fill: rgb("#333"))
#set par(justify: true)

// Colors
#let accent = rgb("#2563eb")
#let lightgray = rgb("#f3f4f6")
#let darkgray = rgb("#4b5563")

// Section header
#let section(title) = {
  v(0.3cm)
  text(size: 11pt, weight: "bold", fill: accent)[#title]
  v(0.05cm)
  line(length: 100%, stroke: 1pt + accent)
  v(0.15cm)
}

// Mission entry (sub-role)
#let mission(role, dates, ctx, items) = {
  grid(
    columns: (1fr, auto),
    text(weight: "semibold", size: 9.5pt)[#role],
    text(size: 8.5pt, fill: darkgray)[#dates]
  )
  text(size: 8.5pt, style: "italic", fill: darkgray)[#ctx]
  v(0.05cm)
  for item in items {
    text(size: 8.5pt)[• #item]
    linebreak()
  }
  v(0.2cm)
}

// Skill tag
#let skill(name) = {
  box(fill: lightgray, radius: 3pt, inset: (x: 5pt, y: 2pt), text(size: 8pt)[#name])
  h(3pt)
}

// ========== HEADER ==========
#align(center)[
  #text(size: 22pt, weight: "bold", fill: accent)[Jules Mudès]
  #v(0.15cm)
  #text(size: 10.5pt, fill: darkgray)[Senior Supply Chain Consultant • Solution Architect • WMS Expert]
  #v(0.15cm)
  #text(size: 8.5pt)[
    📍 Rennes, France  •  ✉ jmudes76000\@gmail.com  •  🔗 linkedin.com/in/julesmudes  •  📱 +33 6 XX XX XX XX
  ]
]

#v(0.2cm)

// ========== SUMMARY ==========
#section("Profil")
Ingénieur et consultant senior avec *8+ années d'expérience* en transformation Supply Chain et systèmes WMS. Expert reconnu sur *Manhattan Active MAWM* (architecture, intégration, industrialisation). Capacité à piloter des programmes complexes (100+ sites), manager des équipes techniques, et faire le pont entre métier et IT. Membre de l'équipe *AVV (Avant-Vente)* depuis 3 ans : contribution aux réponses RFP clients et soutenance de propositions commerciales. Solide background technique (Python, SQL, APIs) au service de l'excellence opérationnelle.

// ========== KEY SKILLS ==========
#section("Compétences")
#grid(
  columns: (1fr, 1fr),
  gutter: 0.4cm,
  [
    *Expertise Technique*\
    #skill("Manhattan MAWM")
    #skill("WMOS")
    #skill("API REST/SOAP")
    #skill("Python")
    #skill("SQL/PL-SQL")
    #skill("Bash")
    #skill("iPaaS")
    #skill("Data Migration")
    #skill("Git")
  ],
  [
    *Expertise Métier & Management*\
    #skill("Supply Chain Design")
    #skill("WCS Integration")
    #skill("Test Strategy (TNR/UAT)")
    #skill("Cutover Planning")
    #skill("Team Leadership")
    #skill("Workshop Facilitation")
    #skill("Réponse RFP / Avant-Vente")
    #skill("Specifications")
  ]
)

// ========== EXPERIENCE ==========
#section("Expérience Professionnelle")

// CAPGEMINI HEADER
#grid(
  columns: (auto, 1fr, auto),
  column-gutter: 8pt,
  text(size: 12pt, weight: "bold")[Capgemini],
  line(length: 100%, stroke: 0.5pt + darkgray),
  text(size: 9pt, fill: darkgray)[2017 — Présent (8 ans)]
)
#text(size: 9pt, fill: darkgray)[Division Retail & Consumer Goods • Practice Supply Chain]
#v(0.25cm)

// AVV Team
#box(
  fill: rgb("#eff6ff"),
  radius: 4pt,
  inset: 8pt,
  width: 100%,
)[
  #grid(
    columns: (1fr, auto),
    text(weight: "semibold", size: 9.5pt)[🎯 Membre Équipe AVV (Avant-Vente)],
    text(size: 8.5pt, fill: darkgray)[2022 — Présent (3 ans)]
  )
  #text(size: 8.5pt)[
    • Contribution aux réponses RFP clients sur le périmètre Supply Chain / WMS \
    • Rédaction des sections techniques et chiffrages associés \
    • Participation aux soutenances commerciales et démonstrations solutions
  ]
]
#v(0.25cm)

#mission(
  "Solution Architect — Programme Migration MAWM",
  "Juin 2024 — Présent",
  "Client: Grand Distributeur • Programme de migration vers Manhattan Active (100+ sites internationaux)",
  (
    "Définition de la roadmap d'industrialisation pour accélérer les migrations multi-sites",
    "Pilotage de l'équipe de développement interfaces (50 flux entrants/sortants)",
    "Conception d'outils d'automatisation : configuration bulk, migration données, reporting",
    "Suivi et optimisation du ROI des outils d'industrialisation développés",
    "Coordination avec les équipes Manhattan et les intégrateurs locaux",
  )
)

#mission(
  "Expert Technique-Fonctionnel MAWM",
  "Janvier 2023 — Juin 2024",
  "Client: Luxe & Retail • Migration MAWM (2 sites France & Italie, décommissionnement WMOS)",
  (
    "Design et rédaction des spécifications de 50+ demi-interfaces pour plateforme iPaaS",
    "Conception et validation des extensions MAWM (customisations solution)",
    "Architecture du processus de synchronisation inventaire et solution technique associée",
    "Lead sur la stratégie de cutover : planification, dry-runs, go/no-go",
    "Coordination et expertise sur la migration des données (master data, stocks, historiques)",
    "Contribution au stream Reporting : KPIs opérationnels, dashboards métier",
  )
)

#mission(
  "Team Leader Factory & Expert Programme MAWM",
  "Octobre 2021 — Décembre 2022",
  "Programme International • Déploiement de 44 entrepôts sous Manhattan Active MAWM",
  (
    "Management d'équipe : rédaction scripts de test, exécution campagnes, formation",
    "Définition des processus End-to-End TNR (Tests de Non-Régression) pour le programme",
    "Conception et déploiement de l'outil de gestion des tests",
    "Cadrage et design des outils : migration données, configuration bulk, mises à jour en masse",
    "Contribution aux processus de gestion des rôles et autorisations MAWM",
  )
)

#mission(
  "WMS Integration Manager & Référent Technique",
  "Septembre 2020 — Septembre 2021",
  "Client: Retail • Migration vers WMOS (1 site, décommissionnement INFOLOG WMS)",
  (
    "Cadrage projet et co-design de la solution avec l'éditeur Manhattan",
    "Définition des stratégies de test et pilotage des phases de recette",
    "Élaboration et gestion du plan de cutover (bascule production)",
    "Responsable du stream Reporting : tableaux de bord, indicateurs de suivi",
  )
)

#mission(
  "Team Leader & Technical Lead",
  "Octobre 2019 — Mars 2020",
  "Client: Chanel • Entrepôt central PB, hautement mécanisé (4 WCS)",
  (
    "Préparation et animation des sessions de test et UAT avec les métiers",
    "Mise en place du versioning de code et coordination des environnements techniques",
    "Analyse et amélioration de l'algorithme de colisage (packing optimization)",
    "Analyse, correction et prévention des écarts de stock WMS/ERP/WCS",
  )
)

#mission(
  "Chef de Projet Intégration & Tests",
  "2017 — 2019",
  "Plusieurs missions : intégration convoyeurs (Pulse 2 & 3), support démarrage, UAT",
  (
    "Référent technique-fonctionnel projet, responsable refonte reporting",
    "Rédaction et exécution des campagnes de tests d'intégration",
    "Formation des équipes support, assistance au démarrage et gestion des incidents",
  )
)

// ========== EDUCATION ==========
#section("Formation")
#grid(
  columns: (1fr, auto),
  [*Diplôme d'Ingénieur Généraliste* — HEI (Hautes Études d'Ingénieur), Lille],
  [2011 — 2016]
)
Spécialisations : Mécanique, Production Industrielle, Logistique
#linebreak()
#text(size: 8.5pt, fill: darkgray)[Semestre d'échange à Vilnius (Lituanie)]

// ========== LANGUAGES ==========
#section("Langues")
*Français* (langue maternelle) • *Anglais* (courant / professionnel) • *Italien* (notions)
