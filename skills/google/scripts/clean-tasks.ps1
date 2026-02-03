$TOKEN_PATH = ".clawdbot-google-tokens-jmudes.json"
$tokenData = Get-Content $TOKEN_PATH | ConvertFrom-Json

$headers = @{
    "Authorization" = "Bearer $($tokenData.access_token)"
    "Content-Type" = "application/json"
}

try {
    # Get task list
    $listsResponse = Invoke-RestMethod -Uri "https://tasks.googleapis.com/tasks/v1/users/@me/lists" -Headers $headers
    $listId = $listsResponse.items[0].id
    
    # Get all tasks
    $tasksResponse = Invoke-RestMethod -Uri "https://tasks.googleapis.com/tasks/v1/lists/$listId/tasks?showCompleted=false&showHidden=false" -Headers $headers
    
    $result = "🧹 Nettoyage des doublons:`n"
    
    # Group by title
    $taskGroups = $tasksResponse.items | Group-Object -Property title
    
    foreach ($group in $taskGroups) {
        if ($group.Count -gt 1) {
            $result += "`n📝 $($group.Name): $($group.Count) doublons`n"
            
            # Keep first, delete rest
            for ($i = 1; $i -lt $group.Count; $i++) {
                $taskId = $group.Group[$i].id
                Invoke-RestMethod -Uri "https://tasks.googleapis.com/tasks/v1/lists/$listId/tasks/$taskId" -Method Delete -Headers $headers
                $result += "  🗑️ Doublon supprimé`n"
            }
            
            # Update Mabilais task
            if ($group.Name -eq "Devis claustra Mabilais") {
                $taskId = $group.Group[0].id
                $vendredi = "2026-01-10T23:59:59.000Z"
                
                $update = @{
                    title = "Devis claustra Mabilais"
                    notes = "Parler à Anne-Laure vendredi pour valider ensemble"
                    due = $vendredi
                } | ConvertTo-Json
                
                Invoke-RestMethod -Uri "https://tasks.googleapis.com/tasks/v1/lists/$listId/tasks/$taskId" -Method Patch -Headers $headers -Body $update -ContentType "application/json"
                $result += "  ✏️ Mise à jour: échéance vendredi 10 janvier`n"
            }
        }
    }
    
    $result += "`n✨ Nettoyage terminé!"
    $result | Out-File -FilePath "ha-output.txt" -Encoding UTF8
    Write-Output $result
    
} catch {
    $error = "❌ Erreur: $($_.Exception.Message)"
    $error | Out-File -FilePath "ha-output.txt" -Encoding UTF8
    Write-Output $error
}
