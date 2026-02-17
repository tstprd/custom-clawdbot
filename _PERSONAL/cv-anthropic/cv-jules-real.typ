// CV Jules Mudès - Clean Professional Template
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 1.5cm, y: 1.5cm), paper: "a4")
#set text(font: "Segoe UI", size: 9.5pt, fill: rgb("#333"))
#set par(justify: true)

// Colors
#let accent = rgb("#2563eb")
#let lightgray = rgb("#f3f4f6")
#let darkgray = rgb("#4b5563")

// Section header
#let section(title) = {
  v(0.4cm)
  text(size: 11pt, weight: "bold", fill: accent)[#title]
  v(0.1cm)
  line(length: 100%, stroke: 1pt + accent)
  v(0.2cm)
}

// Experience entry
#let exp(role, company, dates, items) = {
  grid(
    columns: (1fr, auto),
    text(weight: "bold", size: 10pt)[#role],
    text(size: 9pt, fill: darkgray)[#dates]
  )
  text(fill: darkgray)[#company]
  v(0.1cm)
  for item in items {
    [• #item \ ]
  }
  v(0.3cm)
}

// Skill tag
#let skill(name) = {
  box(
    fill: lightgray,
    radius: 3pt,
    inset: (x: 6pt, y: 3pt),
    text(size: 8pt)[#name]
  )
  h(4pt)
}

// ========== HEADER ==========
#align(center)[
  #text(size: 24pt, weight: "bold", fill: accent)[Jules Mudès]
  #v(0.2cm)
  #text(size: 11pt, fill: darkgray)[
    Senior Supply Chain Consultant • Solution Architect
  ]
  #v(0.2cm)
  #text(size: 9pt)[
    📍 Rennes, France  •  ✉ jmudes76000\@gmail.com  •  🔗 linkedin.com/in/julesmudes
  ]
]

#v(0.3cm)

// ========== SUMMARY ==========
#section("Profil")
Consultant senior avec *8+ ans d'expérience* en Supply Chain et WMS. Expert en intégration Manhattan Active (MAWM), industrialisation et migration de systèmes. Solide background technique (Python, SQL, API) combiné à une expertise fonctionnelle Supply Chain. Leadership d'équipes techniques et facilitation d'ateliers métier.

// ========== KEY SKILLS ==========
#section("Compétences Clés")
#grid(
  columns: (1fr, 1fr),
  gutter: 0.5cm,
  [
    *Technique :*\
    #skill("Manhattan MAWM/WMOS")
    #skill("Python")
    #skill("SQL/PL-SQL")
    #skill("API REST")
    #skill("Bash")
    #skill("Data Migration")
  ],
  [
    *Fonctionnel :*\
    #skill("Supply Chain Design")
    #skill("WCS Integration")
    #skill("Test Management")
    #skill("Workshop Facilitation")
    #skill("Specifications")
  ]
)

// ========== EXPERIENCE ==========
#section("Expérience Professionnelle")

#exp(
  "Solution Architect — MAWM Migration Program",
  "Capgemini • Client: Major Retail",
  "Juin 2024 — Présent",
  (
    "Architecture et roadmap d'industrialisation pour programme de migration (100+ sites)",
    "Pilotage de l'équipe développement interfaces (50 interfaces)",
    "Suivi ROI des outils d'industrialisation et automatisation",
  )
)

#exp(
  "Technical-Functional Expert MAWM",
  "Capgemini • Client: Luxury Retail",
  "Jan 2023 — Juin 2024",
  (
    "Design et spécifications de 50+ interfaces pour iPaaS",
    "Design des extensions MAWM et processus de synchronisation inventaire",
    "Lead sur la stratégie de cutover et coordination migration données",
  )
)

#exp(
  "Team Leader Factory & MAWM Expert",
  "Capgemini • Programme International",
  "Oct 2021 — Déc 2022",
  (
    "Management d'équipe (écriture scripts de test, exécution campagnes)",
    "Définition processus End-to-End TNR pour rollout 44 entrepôts",
    "Design outils de migration données et configuration bulk",
  )
)

#exp(
  "WMS Integration Manager",
  "Capgemini • Migration WMOS",
  "Sept 2020 — Sept 2021",
  (
    "Cadrage projet et design solution avec l'éditeur",
    "Définition stratégies de test et plan de cutover",
    "Management du stream reporting",
  )
)

#exp(
  "Technical Lead & Team Leader",
  "Capgemini • Chanel — Entrepôt Central",
  "Oct 2019 — Mars 2020",
  (
    "Entrepôt hautement mécanisé (4 WCS)",
    "Amélioration algorithme de colisage, gestion écarts stock WMS/ERP/WCS",
    "Mise en place versioning code et coordination environnements techniques",
  )
)

#text(size: 9pt, fill: darkgray)[
  _Expériences antérieures (2017-2019) : Chef de projet intégration, Tests UAT, Support démarrage_
]

// ========== EDUCATION ==========
#section("Formation")
#grid(
  columns: (1fr, auto),
  [*Diplôme d'Ingénieur* — HEI (Hautes Études d'Ingénieur)],
  [Lille, 2016]
)
Spécialisation : Mécanique, Production Industrielle, Logistique

// ========== LANGUAGES ==========
#section("Langues")
*Français* (natif) • *Anglais* (courant) • *Italien* (notions)
