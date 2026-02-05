# DeskPanel Style Guide

## Philosophie

**Minimalisme fonctionnel** — Chaque élément a une raison d'être. Pas de décoration superflue.

## Couleurs

```css
--bg: #0a0a0a;           /* Fond principal */
--bg-card: #141414;      /* Cartes et conteneurs */
--bg-hover: #1a1a1a;     /* États hover */
--border: #222;          /* Bordures subtiles */

--text: #fff;            /* Texte principal */
--text-dim: #666;        /* Texte secondaire */
--text-muted: #444;      /* Texte tertiaire */

--accent: #0070AD;       /* Action principale */
--accent-light: #0090DD; /* Hover accent */
--success: #00A86B;      /* Positif, actif, sport */
--warning: #F5A623;      /* Attention */
--danger: #FF4757;       /* Erreur, off */
```

## Typographie

- **Font** : `-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif`
- **Titres** : 600 weight, pas de uppercase sauf labels
- **Corps** : 400 weight, 15px base
- **Labels** : 12px, uppercase, letter-spacing 0.5px, couleur `--text-dim`
- **Chiffres** : `font-variant-numeric: tabular-nums` pour alignement

## Icônes

**Phosphor Icons** — Style `ph` (regular) par défaut
- CDN : `https://unpkg.com/@phosphor-icons/web@2.1.1`
- Taille sidebar : 26px
- Taille cards : 24px
- Taille boutons contrôle : 32px

```html
<i class="ph ph-house"></i>
<i class="ph ph-thermometer"></i>
<i class="ph ph-fire"></i>
```

## Espacements

- **Padding cards** : 20-24px
- **Gap grilles** : 16px
- **Border-radius cards** : 16px (grand), 12px (moyen), 8px (petit)
- **Border-radius boutons** : 20px (gros), 12px (moyen)

## Composants

### Cards
```css
background: var(--bg-card);
border-radius: 16px;
padding: 20px;
/* Pas de bordure visible - utiliser le contraste de fond */
```

### Boutons
```css
/* Inactif */
background: var(--bg-card);
color: var(--text);

/* Actif */
background: linear-gradient(135deg, var(--accent) 0%, #005a8c 100%);
color: white;

/* Hover */
transform: translateY(-2px);
```

### Overlays (sur images)
```css
background: rgba(0,0,0,0.75);
backdrop-filter: blur(8px);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 12px;
```

### Heatmap (style GitHub)
```css
/* Grille */
gap: 3px;
.day { width: 13-14px; height: 13-14px; border-radius: 2-3px; }

/* Niveaux */
.level-0 { background: #161b22; }  /* Rien */
.level-1 { background: rgba(0,112,173,0.4); }  /* Léger */
.level-2 { background: rgba(0,112,173,0.7); }  /* Moyen */
.level-3 { background: var(--accent); }  /* Fort */

/* Sports */
.squash { teinte bleue --accent }
.volley { teinte verte --success }
```

## Principes

1. **Pas de bordures visibles** — Utiliser le contraste de fond ou ombres subtiles
2. **Hiérarchie par taille** — Pas par couleur (sauf accent pour actions)
3. **Max 2 couleurs vives** — Accent + Success, le reste en niveaux de gris
4. **Animations subtiles** — 0.2s transitions, pas de bounce
5. **Touch-friendly** — Zones cliquables min 44px
6. **Espacement généreux** — Laisser respirer

## Responsive (tablette 2400x1080)

- Sidebar fixe 88px
- Contenu fluide avec flex
- Grilles CSS grid pour contrôles
- Pas de scroll horizontal

## Dark Mode Only

Pas de thème clair. Le fond sombre économise la batterie sur OLED et réduit la fatigue visuelle.
