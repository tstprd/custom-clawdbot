# Design System - Schémas LinkedIn

*Style épuré pour visualisations techniques*

---

## Palette de couleurs

| Usage | Hex | Nom |
|-------|-----|-----|
| **Accent principal** | `#0070AD` | Bleu Capgemini/corporate |
| **Succès/Résultat** | `#00A86B` | Vert émeraude |
| **Neutre fond** | `#FAFAFA` | Gris très clair |
| **Neutre bordure** | `#E0E0E0` | Gris bordure |
| **Texte principal** | `#333333` | Gris foncé |
| **Texte secondaire** | `#666666` | Gris moyen |
| **Texte désactivé** | `#999999` | Gris clair |

### Variantes de fond
- **Highlight (bleu)** : `#F0F7FB` avec bordure `#0070AD`
- **Succès (vert)** : `#F0FBF5` avec bordure `#00A86B`
- **Neutre** : `#FAFAFA` avec bordure `#E0E0E0`

---

## Typographie

- **Font** : `'Segoe UI', Arial, sans-serif`
- **Code** : `'Consolas', 'Courier New', monospace`

| Élément | Taille | Poids | Style |
|---------|--------|-------|-------|
| Header/Titre section | 13px | 600 | uppercase, letter-spacing: 2px |
| Contenu principal | 14px | 400 | normal |
| Labels (box-title) | 10px | 600 | uppercase, letter-spacing: 1px |
| Code | 11px | 400 | monospace |
| Notes/Pain points | 12px | 400 | italic |

---

## Composants

### Box standard
```css
.box {
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
  background: #FAFAFA;
}
```

### Box highlight (accent)
```css
.box.highlight {
  border-color: #0070AD;
  background: #F0F7FB;
}
```

### Box résultat (succès)
```css
.box.result {
  border-color: #00A86B;
  background: #F0FBF5;
}
```

### Flèche de transition
```css
.arrow {
  font-size: 20px;
  color: #0070AD;
  margin: 6px 0;
  text-align: center;
}
/* Caractère : ↓ */
```

### Divider vertical (entre colonnes)
```css
.divider {
  width: 2px;
  background: linear-gradient(180deg, #E0E0E0 0%, #0070AD 50%, #E0E0E0 100%);
}
```

---

## Structure type : Avant/Après

```
┌─────────────────┐   │   ┌─────────────────┐
│  AVANT · Label  │   │   │  APRÈS · Label  │
├─────────────────┤   │   ├─────────────────┤
│    [Box 1]      │   │   │  [Box 1 accent] │
│       ↓         │   │   │       ↓         │
│    [Box 2]      │   │   │  [Box 2 accent] │
│       ↓         │   │   │       ↓         │
│    [Box 3]      │   │   │  [Box 3 vert]   │
│  note italique  │   │   │  note succès    │
└─────────────────┘   │   └─────────────────┘
                      │
              (divider gradient)
```

---

## Structure type : Échelle/Niveaux

```
┌───┬──────────────────────────────────┐
│ 1 │ Titre niveau         [TAG]       │
│   │ Description courte               │
├───┼──────────────────────────────────┤
│ 2 │ Titre niveau                     │
│   │ Description courte               │
├───┼──────────────────────────────────┤
│...│ ...                              │
└───┴──────────────────────────────────┘

- Numéro : fond coloré (gris → orange → bleu → vert)
- Contenu : fond pastel assorti
- Tags : pill badges arrondis
```

---

## Principes

1. **Minimalisme** : Pas d'ombres, pas de gradients complexes, bordures fines
2. **Hiérarchie claire** : Titres uppercase + spacing, contenu normal
3. **Couleur = sens** : Bleu = action/nouveau, Vert = résultat/succès, Gris = ancien/neutre
4. **Espacement généreux** : padding 20px, gaps 12px minimum
5. **Lisibilité mobile** : Fonctionne en 340px de large par colonne

---

## Signature

```html
<div class="footer">
  <em>Schéma généré par agent IA</em>
</div>
```

Style :
```css
.footer {
  text-align: center;
  margin-top: 30px;
  font-size: 11px;
  color: #999;
  font-style: italic;
}
```

---

*Design system créé pour posts LinkedIn GenAI - Jules Mudes*
