# VTech Baby Monitor - Recherche

## Contexte

- **Modèle acheté** : VM924 (79.58€) - PAS d'app Android
- **Modèle cible** : VM901 - Compatible app Android ✅

## VM901 - Confirmé compatible

### App officielle

- **App** : MyVTech Baby 1080p (Android & iOS)
- **Google Play** : https://play.google.com/store/apps/details?id=com.vtech.app.plus
- **Fonctionnalités** : Vidéo 1080p FHD, pan/tilt/zoom, audio bidirectionnel, notifications

### Sources

- Manuel app mobile VM901 : https://vt.vtp-media.com/wms-temp/vm901/mobile/guides/interactive/en/
- Support VTech : https://vtech.zendesk.com/hc/en-us/articles/900002122266-Add-baby-unit-to-mobile-app-Android-iOS-VM901-VM901-1W
- Tutoriel YouTube : https://www.youtube.com/watch?v=mqU6cu34UK8
- Amazon US : https://www.amazon.com/VTech-Upgraded-Detection-Notifications-Pan-Tilt-Zoom/dp/B07WCV632L

## Home Assistant Bridge (GitHub)

### Repo : Royrdan/ha_addons

- **URL** : https://github.com/Royrdan/ha_addons
- **Description** : Bridge VTech P2P Camera to RTSP using TUTK IOTC
- **Protocole** : TUTK IOTC P2P (utilisé par MyVTech Baby app)
- **Output** : Stream RTSP `rtsp://<home-assistant-ip>:8554/vtech`

### Compatibilité VM901

✅ **OUI** - Le VM901 utilise le même protocole TUTK IOTC via l'app MyVTech Baby 1080p.

### Configuration requise

1. Installer l'add-on dans Home Assistant
2. Récupérer `UID` et `Auth Key` via capture réseau (HttpCanary sur Android)
3. Configurer l'add-on avec ces credentials
4. Intégrer le stream RTSP dans HA via Generic Camera

### Récupération credentials (GET_CREDENTIALS.md)

```
Méthode 1: Packet Capture (recommandée)
- Android: HttpCanary ou Packet Capture
- Capturer le trafic pendant ouverture de l'app VTech
- Chercher les requêtes vers /api/account ou /api/devices
- Extraire "uid" et "auth_key" du JSON

Méthode 2: Script Python (si Client ID/Secret connus)
- API VTech: https://www.vtechplanet.com
- Endpoints: /oauth/token, /api/v1/devices
```

## Comparaison VM924 vs VM901

| Feature        | VM924  | VM901                 |
| -------------- | ------ | --------------------- |
| Écran parent   | ✅ 5"  | ✅ 5" HD              |
| App Android    | ❌ Non | ✅ MyVTech Baby 1080p |
| Résolution     | 720p   | 1080p FHD             |
| Home Assistant | ❌     | ✅ via RTSP bridge    |
| Prix Amazon FR | ~80€   | ~100€                 |

## Décision

**Échanger VM924 → VM901** pour avoir l'accès app + intégration Home Assistant.

## Date de recherche

2026-02-15
