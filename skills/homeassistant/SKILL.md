# Home Assistant Skill

Control Home Assistant via REST API using TypeScript.

## Setup

Config loaded from `C:\Users\jules\repo\claude-home\.env`:
- `HA_API_URL` - Home Assistant URL
- `HA_API_TOKEN` - Long-lived access token

## Usage

Run from clawdbot directory, output goes to `ha-output.txt`:

```bash
cd C:\Users\jules\repo\clawdbot
pnpm tsx skills/homeassistant/scripts/ha.ts <command> [args]
type ha-output.txt
```

## Commands

### Search & Get States

```bash
# Search by domain and/or pattern
pnpm tsx skills/homeassistant/scripts/ha.ts search --domain light
pnpm tsx skills/homeassistant/scripts/ha.ts search --pattern salon
pnpm tsx skills/homeassistant/scripts/ha.ts search --domain light --pattern salon

# Get specific entity
pnpm tsx skills/homeassistant/scripts/ha.ts entity light.salon

# All states (large output)
pnpm tsx skills/homeassistant/scripts/ha.ts states
```

### Control Devices

```bash
# Turn on/off
pnpm tsx skills/homeassistant/scripts/ha.ts on light.salon
pnpm tsx skills/homeassistant/scripts/ha.ts off light.salon

# Set light color
pnpm tsx skills/homeassistant/scripts/ha.ts color light.salon blue
# Colors: red, green, blue, white, yellow, orange, purple, pink, cyan, warm, cool

# Set brightness (0-100%)
pnpm tsx skills/homeassistant/scripts/ha.ts brightness light.salon 50
```

### Call Any Service

```bash
pnpm tsx skills/homeassistant/scripts/ha.ts service light turn_on --data '{"entity_id":"light.salon","brightness":255}'
pnpm tsx skills/homeassistant/scripts/ha.ts service notify mobile_app_pixel --data '{"message":"Hello!","title":"Test"}'
```

### Areas

```bash
# List all areas
pnpm tsx skills/homeassistant/scripts/ha.ts areas

# Get entities in area
pnpm tsx skills/homeassistant/scripts/ha.ts area-entities Salon
```

## Quick Examples

```bash
# Allumer le salon
pnpm tsx skills/homeassistant/scripts/ha.ts on light.salon

# Mettre en bleu
pnpm tsx skills/homeassistant/scripts/ha.ts color light.salon blue

# Baisser la luminosité à 30%
pnpm tsx skills/homeassistant/scripts/ha.ts brightness light.salon 30

# Chercher les thermostats
pnpm tsx skills/homeassistant/scripts/ha.ts search --domain climate

# Éteindre
pnpm tsx skills/homeassistant/scripts/ha.ts off light.salon
```

## Gestion Présence & Chauffage

### Booléens de présence par jour

```bash
# Jules
input_boolean.presence_jules_lundi
input_boolean.presence_jules_mardi
input_boolean.presence_jules_mercredi
input_boolean.presence_jules_jeudi
input_boolean.presence_jules_vendredi
input_boolean.presence_jules_samedi
input_boolean.presence_jules_dimanche

# Anne-Laure
input_boolean.presence_anne_laure_lundi
input_boolean.presence_anne_laure_mardi
input_boolean.presence_anne_laure_mercredi
input_boolean.presence_anne_laure_jeudi
input_boolean.presence_anne_laure_vendredi
input_boolean.presence_anne_laure_samedi
input_boolean.presence_anne_laure_dimanche
```

### Modifier la présence (ajuste automatiquement le chauffage)

```bash
# Désactiver présence Jules pour un jour
pnpm tsx skills/homeassistant/scripts/ha.ts off input_boolean.presence_jules_mardi

# Activer présence Anne-Laure pour un jour
pnpm tsx skills/homeassistant/scripts/ha.ts on input_boolean.presence_anne_laure_mardi
```

**Important :** Les automations Home Assistant ajustent le chauffage automatiquement quand les booléens de présence changent. Pas besoin d'appeler de script de MAJ.

### Scripts de vacances

```bash
# Départ vacances
script.depart_vacances_tous
script.depart_vacances_jules
script.depart_vacances_al

# Retour de vacances
script.retour_vacances

# Activer/désactiver vacances individuelles
script.activer_vacances_jules
script.desactiver_vacances_jules
script.activer_vacances_anne_laure
script.desactiver_vacances_anne_laure
script.activer_vacances_anne_laure_et_jules
```

**Important :** Ne JAMAIS modifier les thermostats individuellement. Toujours passer par les booléens de présence + script de MAJ.

## Notes

- Output is written to `ha-output.txt` in the clawdbot directory
- Read result with `type ha-output.txt` after each command
- API timeout: 15 seconds
