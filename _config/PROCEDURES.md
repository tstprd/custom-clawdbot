# Procédures de maintenance

## 🔄 Mise à jour OpenClaw

### Méthode 1 : Via le gateway (recommandé)
```
Demande à Dwight : "mets à jour OpenClaw"
```
Utilise l'outil `gateway action=update.run` — redémarre automatiquement après.

### Méthode 2 : NPM global
```powershell
npm install -g openclaw@latest
openclaw gateway restart
```

### Méthode 3 : Depuis les sources (dev)
```powershell
cd C:\Users\jules\repo\clawdbot
git pull origin main
pnpm install
pnpm build
```

---

## 🔧 Restauration des crons

Si les crons sont perdus après un reset :

1. **Lire le backup** : `_config/crons-backup.json`
2. **Demander à Dwight** : "restaure les crons depuis le backup"

Le backup est mis à jour chaque nuit à 2h.

---

## 📋 Recréer les crons manuellement

### Briefs
| Nom | Horaire | Cron |
|-----|---------|------|
| Morning (semaine) | 8h40 Lu-Ve | `40 8 * * 1-5` |
| Morning (weekend) | 10h Sa-Di | `0 10 * * 0,6` |
| Evening (semaine) | 18h30 Lu-Ve | `30 18 * * 1-5` |

### Backup quotidien
| Nom | Horaire | Cron |
|-----|---------|------|
| Daily Backup | 2h | `0 2 * * *` |

---

## 🏠 Home Assistant (Pi)

### Accès SSH
```powershell
ssh emile@192.168.1.89
# mdp: galettesaucisse
```
Clé SSH configurée — pas besoin de mot de passe depuis ce PC.

### Pi-hole
- IP : 192.168.1.89
- Rate limit : 2000 req/60s (augmenté pour répéteur wifi)

---

## 📱 Tokens expirés

### Gmail (gog CLI)
```powershell
gog auth login --account <email>
```

### Home Assistant
Vérifier `.env.homeassistant` pour le token API.

---

## 🆘 En cas de problème

1. **Gateway ne répond plus** : `openclaw gateway restart`
2. **Crons disparus** : Lire `_config/crons-backup.json` et recréer
3. **Brief pas reçu** : Vérifier `cron action=list` et les logs
4. **SSH Pi échoue** : Vérifier que le Pi est up (`ping 192.168.1.89`)
