Set-Location C:\Users\jules\repo\clawdbot

Write-Host "=== Backup changements locaux ===" -ForegroundColor Cyan
git diff skills/homeassistant/SKILL.md | Out-File -FilePath ha-skill-changes-backup.txt

Write-Host "`n=== Commit changements locaux ===" -ForegroundColor Cyan
git add skills/homeassistant/SKILL.md
git commit -m "HA skill: ajout gestion presence + chauffage (pre-update)"

Write-Host "`n=== Status avant pull ===" -ForegroundColor Cyan
$beforeCommit = git rev-parse HEAD
Write-Host "Current commit: $beforeCommit"

Write-Host "`n=== Git Pull ===" -ForegroundColor Cyan
git pull --rebase origin main 2>&1 | Tee-Object -FilePath git-pull-result.txt

Write-Host "`n=== Status après pull ===" -ForegroundColor Cyan
$afterCommit = git rev-parse HEAD
Write-Host "After commit: $afterCommit"

if ($beforeCommit -ne $afterCommit) {
    Write-Host "`n=== Changements détectés - Liste des commits ===" -ForegroundColor Green
    git log --oneline "${beforeCommit}..${afterCommit}" | Tee-Object -FilePath new-commits.txt
    
    Write-Host "`n=== Fichiers modifiés ===" -ForegroundColor Green
    git diff --name-only "${beforeCommit}..${afterCommit}" | Tee-Object -FilePath changed-files.txt
} else {
    Write-Host "`n=== Aucun changement - Déjà à jour ===" -ForegroundColor Yellow
}

Write-Host "`n=== Vérification fichiers personnels ===" -ForegroundColor Cyan
$files = @("IDENTITY.md", "USER.md", "SOUL.md", "TOOLS.md", "HEARTBEAT.md")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "[OK] $file" -ForegroundColor Green
    } else {
        Write-Host "[MANQUANT] $file" -ForegroundColor Red
    }
}

Write-Host "`n=== Terminé ===" -ForegroundColor Cyan
