$TOKEN_PATH = ".clawdbot-google-tokens-jmudes.json"
$tokenData = Get-Content $TOKEN_PATH | ConvertFrom-Json

$headers = @{
    "Authorization" = "Bearer $($tokenData.access_token)"
    "Content-Type" = "application/json"
}

try {
    $result = "🗑️ Suppression (jmudes76000@gmail.com):`n"
    
    # Delete "Travaux Maison" list
    $listId = "WVE5b0FNTTlqWFhheV84RQ"
    
    Invoke-RestMethod -Uri "https://tasks.googleapis.com/tasks/v1/users/@me/lists/$listId" -Method Delete -Headers $headers
    
    $result += "`n✅ Liste 'Travaux Maison' supprimée"
    $result += "`n`n✨ Terminé!"
    
    $result | Out-File -FilePath "ha-output.txt" -Encoding UTF8
    Write-Output $result
    
} catch {
    $error = "❌ Erreur: $($_.Exception.Message)"
    $error | Out-File -FilePath "ha-output.txt" -Encoding UTF8
    Write-Output $error
}
