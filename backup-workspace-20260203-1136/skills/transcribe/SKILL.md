# Transcribe Skill

Transcription audio → texte via **faster-whisper** (local, CPU).

## Usage

```bash
python skills/transcribe/transcribe.py <fichier_audio> [--model small|medium|large-v3]
```

## Modèles

| Modèle | Taille | Vitesse | Qualité |
|--------|--------|---------|---------|
| `tiny` | 75 MB | Très rapide | Basique |
| `small` | 500 MB | Rapide | Bon (défaut) |
| `medium` | 1.5 GB | Moyen | Très bon |
| `large-v3` | 3 GB | Lent | Excellent |

## Formats supportés

- MP3, WAV, M4A, OGG, FLAC, WEBM
- Fichiers audio Telegram (OGG/OPUS)

## Premier lancement

Le modèle est téléchargé automatiquement au premier usage (~500 MB pour `small`).

## Exemple

```bash
python skills/transcribe/transcribe.py message_vocal.ogg
# Output: "Bonjour, ceci est un test de transcription..."
```
