$code = $args[0]
$CLIENT_ID = "484497112812-dri1evcvplisrrjva48rr71i03g69egd.apps.googleusercontent.com"
$CLIENT_SECRET = "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"
$REDIRECT_URI = "http://localhost:3000/oauth2callback"

$body = @{
    code = $code
    client_id = $CLIENT_ID
    client_secret = $CLIENT_SECRET
    redirect_uri = $REDIRECT_URI
    grant_type = "authorization_code"
}

try {
    $response = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
    
    $tokenData = @{
        access_token = $response.access_token
        refresh_token = $response.refresh_token
        expiry_date = [int64](Get-Date).AddSeconds($response.expires_in).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalMilliseconds
        token_type = $response.token_type
        scope = $response.scope
        account = "jmudes76000@gmail.com"
    }
    
    $tokenData | ConvertTo-Json -Depth 10 | Out-File -FilePath ".clawdbot-google-tokens-jmudes.json" -Encoding UTF8
    
    $result = "✅ Authentification réussie pour jmudes76000@gmail.com!`n`nTokens sauvegardés`n`nScopes: $($response.scope)"
    Write-Output $result
    $result | Out-File -FilePath "ha-output.txt" -Encoding UTF8
    
} catch {
    $error = "❌ Erreur: $($_.Exception.Message)"
    Write-Output $error
    $error | Out-File -FilePath "ha-output.txt" -Encoding UTF8
    exit 1
}
