# Historique Debug & Discoveries

*Infos techniques découvertes au fil des sessions — à préserver.*

---

## 🔧 Pi-hole (configuré 1er fév 2026)

- **IP** : 192.168.1.89 (raspberry5)
- **DHCP** : Géré par Pi-hole (pas la box SFR — impossible de changer DNS sur box SFR)
- **Range DHCP** : 192.168.1.20 - 192.168.1.100
- **IPv6** : Désactivé
- **Dashboard** : http://192.168.1.89/admin
- **Blocklists** : Firebog (toutes les vertes) ~1M+ domaines
- **Rate limit** : 2000 req/60s (augmenté pour répéteur wifi device 79)

### SSH
```powershell
ssh emile@192.168.1.89
# mdp: galettesaucisse (clé SSH configurée depuis ce PC)
```

---

## 🤖 Home Assistant

- **IP** : 192.168.1.98
- **API Token** : dans `.env.homeassistant`
- **Script** : `pnpm tsx skills/homeassistant/scripts/ha.ts <command>`
- **Présences** : `input_boolean.presence_jules_*` / `input_boolean.presence_anne_laure_*`

### Simulateur aube (bug identifié 4 fév)
- **Automation** : `automation.simulateur_aube_gradient_reveil_automatique`
- **Bug** : Si le capteur alarme change APRÈS l'heure du trigger passée, HA ne reprogramme pas
- **Capteur** : `sensor.pixel_9_pro_next_alarm`
- **Solution** : Utiliser un template trigger au lieu de time trigger avec offset

---

## 📱 Tokens & Auth

### gog CLI (Google)
- **Config** : `C:\Users\jules\AppData\Roaming\gogcli\config.json`
- **Comptes** : jmudes76000@gmail.com, alejmurot@gmail.com
- **alejmurot** : Token souvent expiré → `gog auth login --account alejmurot@gmail.com`

### Transcription vocale
- **Outil** : faster-whisper (local, pas d'API)
- **Modèle** : base, device=cpu, langue=fr
- **Usage** : Toujours transcrire les messages vocaux avant de répondre

---

## 🖼️ Médias & Images

### Memes Dwight (imgflip)
- URL directe : `https://i.imgflip.com/<ID>.jpg`
- Envoi Telegram : `message action=send media=<URL>`

### Navigateur Clawdbot
- Profil isolé : `profile="clawd"`
- Chrome extension : `profile="chrome"`

---

## 📊 Crons perdus (à recréer si besoin)

### Quotidiens (non restaurés)
| Nom | Heure | Description |
|-----|-------|-------------|
| Dwight Wisdom + Italien | 13h | Meme Dwight imgflip + 3 mots italiens |
| Surveillance marchés | 9h + 18h | CAP.PA, BTC, ETH - alerte si >±5% |

### Hebdomadaires (non restaurés)
| Nom | Jour/Heure | Description |
|-----|------------|-------------|
| Sorties cinéma | Mer 10h | Allocine + Masque et la Plume |
| Sorties Rennes | Mer 12h | jds.fr événements weekend |
| Rappel sauna | Mar 19h | Aqua Tonic pour mercredi midi |

### Désactivés volontairement
| Nom | Raison |
|-----|--------|
| Dashboard Cast | Allumait la TV la nuit (cast Chromecast) |

---

## 💼 Projets Jules

### LinkedIn GenAI
- Rythme : bi-hebdomadaire (14 jours)
- Style : dense, technique, pas d'emojis, pas de bullshit corporate
- Assets : `_PERSONAL/linkedin-genai/`, Obsidian `Projects/LinkedIn-GenAI-Strategy.md`

### Maintenance Bot
- Stack : sql.js, Telegram, faster-whisper
- Sécurité : ClientScopedDB (isolation par client_id)
- Verticales : MotoBot, AutoBot, MaisonBot
- Fichiers : `_PERSONAL/business-ideas/maintenance-bot/`

### Candidature Anthropic (jan 2026)
- Poste : Solutions Architect, Applied AI (Industries) - Paris
- Salaire : 190-200K€

---

## 🎯 Préférences Jules (découvertes)

### Sorties/Événements
✅ Jeux de société, Gastronomie, Science, Plantes, Danse moderne, Politique, Humour intelligent

### Cinéma
✅ SF épique (Nolan, Villeneuve), Tarantino, Thrillers, Films d'auteur, Critique 4+/5
❌ Comédies françaises

### Produits d'hygiène
Grand format, sans perturbateurs endocriniens (Dr. Bronner's, Logona, savon d'Alep)

---

*Dernière mise à jour : 4 février 2026*
