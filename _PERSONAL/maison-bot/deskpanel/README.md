# Phone Dashboard

Dashboard sur vieux téléphone Android pour contrôle maison + terminal Claude.

## Specs écran

| Téléphone | Résolution | Paysage | Dashboard |
|-----------|------------|---------|-----------|
| Xiaomi 11 Lite 5G | 2400 × 1080 | 1080 × 2400 | index.html |
| Pixel 9 | 2424 × 1080 | 1080 × 2424 | index-pixel9.html |
| **Samsung S10e** | 2280 × 1080 | 1080 × 2280 | index-s10e.html |

### Samsung Galaxy S10e (actuel)
- **Résolution physique** : 2280 × 1080 px
- **Viewport CSS (landscape)** : ~760 × 360 px (DPR ~3.0)
- **Encoche** : caméra punch-hole à droite en landscape
- Dashboard optimisé : `index-s10e.html`

## Installation sur Raspberry Pi

```bash
# SSH sur le Pi
ssh emile@192.168.1.89

# Créer le dossier
mkdir -p ~/phone-dashboard
cd ~/phone-dashboard

# Copier les fichiers (depuis Windows)
# scp -r _PERSONAL/maison-bot/phone-dashboard/* emile@192.168.1.89:~/phone-dashboard/

# Installer dépendances
npm install

# Lancer (test)
node server.js

# Lancer en service permanent
pm2 start server.js --name dashboard
pm2 save
```

## Configuration téléphone (Fully Kiosk Browser)

1. **Installer** [Fully Kiosk Browser](https://play.google.com/store/apps/details?id=de.ozerov.fully)

2. **Configurer** :
   - URL : `http://192.168.1.89:3333`
   - Settings → Web Content Settings → Autoplay Videos : ON
   - Settings → Device Management → Keep Screen On : ON
   - Settings → Device Management → Screen Brightness : ajuster
   - Settings → Kiosk Mode → Enable Kiosk Mode : ON (optionnel, lock le téléphone)
   - Settings → Remote Administration → Enable : ON (pour contrôle remote)

3. **Mode paysage** :
   - Settings → Web Content Settings → Force Orientation : Landscape

## Pousser du contenu

### Option 1 : Modifier content.json (le plus simple)

```bash
# SSH sur le Pi
ssh emile@192.168.1.89

# Modifier le message
echo '{"message":{"text":"Hello depuis Claude!","time":"12:34"}}' > /tmp/update.json
jq -s '.[0] * .[1]' ~/phone-dashboard/content.json /tmp/update.json > /tmp/merged.json
mv /tmp/merged.json ~/phone-dashboard/content.json
```

Le serveur détecte automatiquement les changements et push aux clients.

### Option 2 : API HTTP

```bash
# Pousser un message
curl -X POST http://192.168.1.89:3333/api/message \
  -H "Content-Type: application/json" \
  -d '{"text":"Message depuis curl!"}'

# Mettre à jour l'état complet
curl -X POST http://192.168.1.89:3333/api/state \
  -H "Content-Type: application/json" \
  -d '{"stats":{"tasks":5,"unread":3}}'

# Lire l'état actuel
curl http://192.168.1.89:3333/api/state
```

### Option 3 : Webhook OpenClaw

Ajouter dans la config OpenClaw un webhook qui POST vers :
```
http://192.168.1.89:3333/webhook/openclaw
```

## Intégration Home Assistant

Définir les variables d'environnement avant de lancer :

```bash
export HA_URL="http://192.168.1.89:8123"
export HA_TOKEN="ton_token_long_lived"
node server.js
```

Le serveur va fetch les températures toutes les 30s.

### Créer un token HA

1. Profil → Long-Lived Access Tokens → Create Token
2. Copier le token
3. L'ajouter dans `~/.bashrc` ou le service pm2

## Contrôle remote Fully Kiosk

Si Remote Administration est activé, tu peux :

```bash
# Allumer l'écran
curl "http://PHONE_IP:2323/?cmd=screenOn&password=xxx"

# Éteindre l'écran
curl "http://PHONE_IP:2323/?cmd=screenOff&password=xxx"

# Recharger la page
curl "http://PHONE_IP:2323/?cmd=loadStartUrl&password=xxx"

# Obtenir les infos (dont batterie)
curl "http://PHONE_IP:2323/?cmd=deviceInfo&password=xxx"
```

## Mode présence (auto on/off)

Ajouter dans Home Assistant une automation :

```yaml
automation:
  - alias: "Dashboard ON quand Jules présent"
    trigger:
      - platform: state
        entity_id: input_boolean.presence_jules_bureau
        to: "on"
    action:
      - service: rest_command.dashboard_screen_on

  - alias: "Dashboard OFF quand Jules absent"
    trigger:
      - platform: state
        entity_id: input_boolean.presence_jules_bureau
        to: "off"
    action:
      - service: rest_command.dashboard_screen_off

rest_command:
  dashboard_screen_on:
    url: "http://PHONE_IP:2323/?cmd=screenOn&password=xxx"
  dashboard_screen_off:
    url: "http://PHONE_IP:2323/?cmd=screenOff&password=xxx"
```

## Structure

```
phone-dashboard/
├── index.html      # Dashboard (s'adapte au contenu reçu)
├── server.js       # Serveur Node (WebSocket + API)
├── content.json    # État actuel (modifiable pour push)
├── package.json
└── README.md
```

## Pour que Claude/Dwight puisse push

Depuis n'importe où avec accès SSH au Pi :

```bash
ssh emile@192.168.1.89 'curl -X POST http://localhost:3333/api/message -H "Content-Type: application/json" -d "{\"text\":\"Message de Dwight!\"}"'
```
