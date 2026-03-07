# La Table des Savoirs - Tracking 🏆

Quiz quotidien d'Émilien (12 Coups de Midi) : [latabledessavoirs.fr](https://latabledessavoirs.fr)

## Pseudo

**Serial76** (Jules)

## Données

Les CSV/parquet sont scrappés depuis le classement public.

```
data/
├── 2026-03-04.csv
├── 2026-03-05.csv
├── 2026-03-06.csv ← dernière snapshot
└── backup_*.csv   ← sauvegardes horodatées
```

**Format:**

```csv
rank,pseudo,points,level,date
737,Serial76,1888,Abordable,2026-03-06
312,Serial76,1324,Expert,2026-03-06
```

## Cron

**Windows Task Scheduler** : `TableSavoirs_Scraper`

- **Horaire** : 12h30 tous les jours (après reset midi)
- **Script** : `C:\Users\jules\scripts\table_savoirs_scraper\run.bat`

## Scraper source

```
C:\Users\jules\scripts\table_savoirs_scraper\
├── scraper.py      ← script principal
├── daily_run.py    ← wrapper pour notifs
├── run.bat         ← lanceur Windows
└── data/           ← données (copiées ici)
```

## Commandes rapides

```powershell
# Lancer manuellement le scraper
cd C:\Users\jules\scripts\table_savoirs_scraper
.\venv\Scripts\Activate.ps1
python scraper.py

# Chercher Serial76 dans les données
Select-String -Path "data\*.csv" -Pattern "Serial76"
```

## Pour Dwight

Quand Jules parle de :

- "quiz" / "table des savoirs" / "classement" / "Serial76"
- → Regarder ici : `_PERSONAL/table-des-savoirs/`
- → Site live : https://latabledessavoirs.fr/classements
- → Comparer avec les CSV pour voir l'évolution
