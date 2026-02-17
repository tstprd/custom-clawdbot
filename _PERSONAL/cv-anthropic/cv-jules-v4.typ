// CV Jules Mudès - Version 4 - Elegant & Classy
#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (left: 0cm, right: 0cm, top: 0cm, bottom: 0cm), paper: "a4")
#set text(font: "Segoe UI", size: 9pt, fill: rgb("#2d3748"))

// Colors - Elegant palette
#let primary = rgb("#1a365d")    // Deep navy
#let secondary = rgb("#2b6cb0")  // Royal blue
#let accent = rgb("#ed8936")     // Warm gold
#let lightbg = rgb("#f7fafc")    // Soft gray
#let darktext = rgb("#1a202c")
#let graytext = rgb("#718096")

// ========== LAYOUT: SIDEBAR + MAIN ==========
#grid(
  columns: (6.5cm, 1fr),
  
  // ========== LEFT SIDEBAR ==========
  box(
    fill: primary,
    height: 100%,
    width: 100%,
    inset: (x: 0.8cm, y: 1cm),
  )[
    #set text(fill: white)
    
    // Photo placeholder / Initials
    #align(center)[
      #box(
        width: 3cm,
        height: 3cm,
        radius: 50%,
        fill: secondary,
        stroke: 3pt + accent,
      )[
        #align(center + horizon)[
          #text(size: 28pt, weight: "bold", fill: white)[JM]
        ]
      ]
    ]
    
    #v(0.6cm)
    
    // Name
    #align(center)[
      #text(size: 18pt, weight: "bold", tracking: 1pt)[JULES MUDÈS]
      #v(0.2cm)
      #text(size: 9pt, fill: rgb("#a0aec0"), tracking: 0.5pt)[
        SOLUTION ARCHITECT\
        SUPPLY CHAIN EXPERT
      ]
    ]
    
    #v(0.8cm)
    
    // Contact
    #text(size: 8pt, weight: "bold", fill: accent)[━━  CONTACT  ━━]
    #v(0.3cm)
    #text(size: 8.5pt)[
      📍 Rennes, France\
      #v(0.15cm)
      ✉️ jmudes76000\@gmail.com\
      #v(0.15cm)
      🔗 linkedin.com/in/julesmudes\
      #v(0.15cm)
      📱 +33 6 XX XX XX XX
    ]
    
    #v(0.7cm)
    
    // Technical Skills
    #text(size: 8pt, weight: "bold", fill: accent)[━━  EXPERTISE TECHNIQUE  ━━]
    #v(0.3cm)
    #let techskill(name, level) = {
      text(size: 8pt)[#name]
      h(1fr)
      box(width: 2.2cm, height: 4pt, radius: 2pt, fill: rgb("#4a5568"))[
        #box(width: level, height: 4pt, radius: 2pt, fill: accent)
      ]
      v(0.2cm)
    }
    #techskill("Manhattan MAWM", 100%)
    #techskill("WMOS", 95%)
    #techskill("Python", 85%)
    #techskill("SQL / PL-SQL", 90%)
    #techskill("API REST", 85%)
    #techskill("iPaaS Integration", 80%)
    #techskill("Data Migration", 90%)
    
    #v(0.7cm)
    
    // Business Skills
    #text(size: 8pt, weight: "bold", fill: accent)[━━  EXPERTISE MÉTIER  ━━]
    #v(0.3cm)
    #text(size: 8pt)[
      ▸ Supply Chain Design\
      ▸ WCS Integration\
      ▸ Test Strategy (TNR/UAT)\
      ▸ Cutover Planning\
      ▸ Team Leadership\
      ▸ RFP & Avant-Vente\
      ▸ Workshop Facilitation
    ]
    
    #v(0.7cm)
    
    // Languages
    #text(size: 8pt, weight: "bold", fill: accent)[━━  LANGUES  ━━]
    #v(0.3cm)
    #text(size: 8pt)[
      *Français* — Natif\
      *Anglais* — Courant\
      *Italien* — Notions
    ]
    
    #v(0.7cm)
    
    // Education
    #text(size: 8pt, weight: "bold", fill: accent)[━━  FORMATION  ━━]
    #v(0.3cm)
    #text(size: 8pt)[
      *Ingénieur Généraliste*\
      HEI Lille\
      #text(fill: rgb("#a0aec0"))[2011 — 2016]
    ]
    
    #v(0.7cm)
    
    // Personal Projects
    #text(size: 8pt, weight: "bold", fill: accent)[━━  PROJETS PERSO  ━━]
    #v(0.3cm)
    #text(size: 8pt)[
      *Domotique & IA*\
      Utilisation active de LLMs\
      pour automatisation maison\
      (Home Assistant, scripts,\
      agents conversationnels)
    ]
  ],
  
  // ========== MAIN CONTENT ==========
  box(
    inset: (x: 0.8cm, y: 0.8cm),
    height: 100%,
  )[
    // Profile
    #text(size: 11pt, weight: "bold", fill: primary)[PROFIL]
    #v(0.1cm)
    #box(width: 3cm, height: 3pt, fill: accent)
    #v(0.3cm)
    #text(size: 9pt, fill: graytext)[
      Consultant senior avec *8+ années d'expérience* en transformation Supply Chain et systèmes WMS. Expert reconnu sur *Manhattan Active MAWM*. Membre de l'équipe *Avant-Vente* depuis 3 ans. Leadership de programmes complexes (100+ sites) et management d'équipes techniques. Passionné d'IA appliquée (projets perso domotique avec LLMs).
    ]
    
    #v(0.5cm)
    
    // Experience header
    #text(size: 11pt, weight: "bold", fill: primary)[EXPÉRIENCE PROFESSIONNELLE]
    #v(0.1cm)
    #box(width: 3cm, height: 3pt, fill: accent)
    #v(0.4cm)
    
    // Company header
    #grid(
      columns: (auto, 1fr, auto),
      column-gutter: 10pt,
      align: horizon,
      text(size: 14pt, weight: "bold", fill: secondary)[Capgemini],
      line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0")),
      text(size: 9pt, fill: graytext)[8 ans]
    )
    #text(size: 8pt, fill: graytext)[Retail & Consumer Goods • Practice Supply Chain]
    #v(0.3cm)
    
    // AVV highlight
    #box(
      fill: rgb("#ebf8ff"),
      radius: 4pt,
      inset: 8pt,
      width: 100%,
      stroke: 1pt + rgb("#bee3f8")
    )[
      #text(size: 8pt, weight: "bold", fill: secondary)[🎯 Équipe AVV — Avant-Vente #h(1fr) #text(fill: graytext, weight: "regular")[2022 — Présent]]
      #v(0.1cm)
      #text(size: 8pt, fill: graytext)[Réponses RFP clients • Chiffrages techniques • Soutenances commerciales]
    ]
    #v(0.35cm)
    
    // Experience entries
    #let exp(title, period, scope, bullets) = {
      grid(
        columns: (auto, 1fr),
        column-gutter: 8pt,
        box(width: 6pt, height: 6pt, radius: 50%, fill: accent),
        [
          #text(size: 9pt, weight: "bold", fill: darktext)[#title]
          #h(1fr)
          #text(size: 8pt, fill: graytext)[#period]
          #v(0.05cm)
          #text(size: 8pt, style: "italic", fill: graytext)[#scope]
          #v(0.1cm)
          #text(size: 8pt, fill: rgb("#4a5568"))[
            #for b in bullets [• #b \ ]
          ]
        ]
      )
      v(0.25cm)
    }
    
    #exp(
      "Solution Architect — Migration MAWM",
      "2024 — Présent",
      "Programme 100+ sites internationaux",
      (
        "Roadmap industrialisation multi-sites",
        "Pilotage équipe interfaces (50 flux)",
        "Outils automatisation & ROI tracking",
      )
    )
    
    #exp(
      "Expert Technique-Fonctionnel MAWM",
      "2023 — 2024",
      "Migration 2 sites France & Italie",
      (
        "Specs 50+ interfaces iPaaS",
        "Extensions MAWM & sync inventaire",
        "Lead cutover & migration données",
      )
    )
    
    #exp(
      "Team Leader Factory & Expert MAWM",
      "2021 — 2022",
      "Rollout 44 entrepôts MAWM",
      (
        "Management équipe tests",
        "Processus TNR End-to-End",
        "Outils migration & config bulk",
      )
    )
    
    #exp(
      "WMS Integration Manager",
      "2020 — 2021",
      "Migration WMOS, décom. INFOLOG",
      (
        "Design solution avec Manhattan",
        "Stratégie test & cutover",
      )
    )
    
    #exp(
      "Technical Lead — Chanel",
      "2019 — 2020",
      "Entrepôt mécanisé (4 WCS)",
      (
        "Algo colisage & écarts stock",
        "Versioning & environnements",
      )
    )
    
    #text(size: 8pt, fill: graytext, style: "italic")[
      2017 — 2019 : Chef de projet intégration, tests UAT, support démarrage
    ]
  ]
)
