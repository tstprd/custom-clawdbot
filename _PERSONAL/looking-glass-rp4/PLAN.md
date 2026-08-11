# Looking Glass Portrait RP4 RGB-D Live Plan

> Source principale lue : Linus Tech Tips, “This Holographic Photo Frame is CRAZY - Looking Glass Portrait”, https://www.youtube.com/watch?v=qTrfMHaI3Dk

## Ce que la vidéo confirme

- Le Looking Glass Portrait peut tourner en standalone grâce à un Raspberry Pi 4 intégré.
- Le Pi est un Raspberry Pi 4B 2 GB.
- Le Pi représente une grosse partie de l’épaisseur arrière.
- Le device a USB-C, HDMI in, audio jack, boutons tactiles, boutons power/status.
- Il y a une carte custom derrière qui route l’alimentation et HDMI vers l’écran.
- Il y a une carte fille avec stockage USB 16 GB, microSD 16 GB, et un autre processeur ARM.
- Le rendu holographique n’est pas une lentille numérique : c’est un stack optique/lenticulaire solide, calibré par device.
- Le logiciel officiel HoloPlay Studio accepte : portrait mode depth photo, RGB-D photo/video, quilt photo, light-field photo set.
- Le format Looking Glass utile à viser est donc soit RGB-D, soit quilt.
- Le display affiche entre 45 et 100 angles dans un cône de vision d’environ 58 degrés.
- Rendre du 60 FPS en 45-100 vues est coûteux GPU ; il ne faut pas demander au RP4 de synthétiser du multivue lourd en temps réel au début.

## Hypothèse technique

Le chemin le plus réaliste n’est pas de streamer directement une vidéo 3D brute vers le panneau. Il faut d’abord produire un format que le Looking Glass sait avaler :

1. RGB-D côté capture.
2. Transmission réseau vers le RP4.
3. Conversion RGB-D vers quilt ou format HoloPlay compatible.
4. Affichage plein écran / playlist / runtime Looking Glass sur le Portrait.

Pour un MVP live, on vise faible résolution + faible FPS, puis optimisation.

## Plan d’attaque

### Phase 0 — Accès et inventaire du RP4

Objectif : comprendre l’OS, les services et les chemins Looking Glass existants.

Actions :

1. Corriger/valider la clé SSH de `raspberry5` si c’est bien notre Pi.
2. SSH sur le Pi.
3. Relever :
   - OS : `uname -a`, `/etc/os-release`
   - réseau : `ip addr`, `tailscale status`
   - services : `systemctl --user list-units`, `systemctl list-units`
   - ports ouverts : `ss -ltnp`
   - stockage : `lsblk`, montages, microSD/USB
   - processus Looking Glass : `ps aux | grep -i 'looking\|holo\|quilt\|portrait'`
4. Trouver les dossiers logiciels : `/opt`, `~`, `/boot`, `/etc/systemd`, éventuels scripts de startup.

Livrable : `INVENTORY.md` avec les services, ports, binaires, chemins et méthode actuelle d’affichage.

### Phase 1 — Réactiver une couche réseau simple

Objectif : avoir un endpoint HTTP stable sur le Pi.

Actions :

1. Déployer un backend FastAPI minimal sur `0.0.0.0:8798`.
2. Ajouter endpoints :
   - `GET /health`
   - `POST /api/gateway/frame`
   - `POST /api/gateway/rgbd`
   - `POST /api/gateway/action`
3. Créer un service systemd user `looking-rgbd-gateway.service`.
4. Tester depuis le PC : `curl http://raspberry5:8798/health`.
5. Tester via Tailscale : `curl http://100.95.54.42:8798/health`.

Livrable : backend qui reçoit des images et écrit les derniers fichiers dans `/tmp/looking-rgbd/latest/`.

### Phase 2 — RGB simple en live lent

Objectif : prouver qu’on peut pousser une image réseau vers le Pi.

Actions :

1. Réutiliser `_PERSONAL/android-sensor-gateway` qui envoie déjà des JPEG vers `/api/gateway/frame`.
2. Baisser la fréquence au départ : 1 FPS.
3. Sur le Pi, sauvegarder `latest_rgb.jpg` et metadata JSON.
4. Créer une page web debug `http://raspberry5:8798/debug` qui affiche la dernière frame.
5. Valider depuis téléphone/PC que la frame arrive.

Livrable : aperçu live RGB dans navigateur.

### Phase 3 — Définir le payload RGB-D

Objectif : normaliser le transport depth avant de faire du rendu.

Payload multipart cible :

- `rgb`: JPEG ou WebP.
- `depth`: PNG 16-bit ou raw uint16 little-endian compressé.
- `meta`: JSON :
  - `ts`
  - `width`, `height`
  - `depth_width`, `depth_height`
  - `depth_scale_m`
  - `fx`, `fy`, `cx`, `cy` si connus
  - `source`: `android-arcore`, `realsense`, etc.

Actions :

1. Ajouter endpoint `POST /api/gateway/rgbd`.
2. Écrire chaque frame dans un dossier timestampé.
3. Écrire aussi un `latest_rgbd.json` pointant vers les derniers fichiers.
4. Faire un générateur de test côté PC qui pousse une image RGB + depth synthétique.

Livrable : réception RGB-D vérifiable sans capteur réel.

### Phase 4 — Choisir la source depth

Options :

A. Téléphone Android ARCore depth

- Avantage : pas de hardware supplémentaire.
- Inconvénient : depth bruité, APIs Android à intégrer.

B. iPhone LiDAR / portrait depth export

- Avantage : bonne qualité si device compatible.
- Inconvénient : moins direct si on veut streaming maison.

C. Intel RealSense / caméra depth USB

- Avantage : vraie RGB-D streamable.
- Inconvénient : drivers + puissance RP4/PC.

Décision recommandée : commencer avec RGB-D synthétique, puis Android ARCore si disponible, sinon RealSense depuis PC.

### Phase 5 — Conversion RGB-D vers quilt

Objectif : produire une image quilt compatible Looking Glass.

Approche MVP :

1. Prendre RGB + depth.
2. Générer N vues par reprojection simple : 8 à 16 vues d’abord, pas 45-100.
3. Composer une quilt image en grille.
4. Afficher cette quilt sur le Portrait via le chemin logiciel existant.

Important : la vidéo LTT indique que le coût GPU est le vrai piège. Sur RP4, viser d’abord :

- 512x512 ou 640x480 source max.
- 8-16 vues.
- 5-10 FPS.
- éventuellement calcul sur PC, RP4 seulement affichage.

Livrable : un script `rgbd_to_quilt.py` qui transforme un frame RGB-D en quilt statique.

### Phase 6 — Affichage sur le Looking Glass

Objectif : injecter notre quilt dans le rendu du Portrait.

Actions dépendantes de l’inventaire Phase 0 :

1. Identifier comment HoloPlay/standalone stocke la playlist.
2. Tester remplacement d’un asset quilt statique.
3. Tester refresh automatique.
4. Si playlist trop fermée, utiliser HDMI in depuis un PC qui rend avec HoloPlay SDK.
5. Si le Pi expose un runtime local, brancher notre pipeline directement.

Plan B robuste : utiliser un PC/GPU pour générer le quilt et envoyer le signal HDMI au Portrait. Le RP4 interne sert alors seulement de référence/standalone, pas de moteur live.

### Phase 7 — Streaming live propre

Objectif : passer de fichiers HTTP à vrai stream.

Chemins possibles :

1. WebSocket binaire : simple à contrôler, bon MVP.
2. GStreamer RTP : performant vidéo, plus complexe pour depth.
3. WebRTC : idéal latence/réseau, mais plus lourd.

Recommandation :

- MVP : HTTP multipart à 1-5 FPS.
- Prototype live : WebSocket RGB-D.
- Production : GStreamer/WebRTC selon latence.

### Phase 8 — Optimisation

Objectif : augmenter FPS et qualité.

Actions :

1. Remplacer JPEG par WebP ou H264 pour RGB.
2. Compresser depth en PNG16 ou zstd raw.
3. Ajouter buffer double/triple côté Pi.
4. Mesurer latence et CPU.
5. Décider où calculer le quilt : RP4, PC, ou téléphone.

## Ordre immédiat recommandé

1. Débloquer SSH vers `raspberry5`.
2. Inventorier le Pi et le logiciel Looking Glass installé.
3. Lancer `/health` sur `:8798`.
4. Faire arriver une JPEG depuis l’APK existante.
5. Ajouter `/api/gateway/rgbd` avec depth synthétique.
6. Générer une quilt statique depuis RGB-D.
7. Trouver comment l’afficher sur le Portrait.
8. Seulement ensuite tenter le live RGB-D.

## Risques principaux

- Le RP4 est probablement trop faible pour générer 45-100 vues à 60 FPS.
- Le runtime standalone Looking Glass peut être fermé ou calibré par device.
- Toucher aux partitions/stockages internes sans backup peut casser le Portrait.
- La calibration optique est device-specific : ne pas modifier la partie optique.

## Stratégie safe

- Ne pas modifier le système Looking Glass original avant backup.
- Lire uniquement au début.
- Dupliquer SD/USB si possible.
- Démarrer avec un service séparé sur port `8798`.
- Garder HDMI-in comme plan de secours si le standalone est verrouillé.
