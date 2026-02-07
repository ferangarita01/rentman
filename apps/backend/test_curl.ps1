$token = gcloud auth print-access-token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$project = "agent-gen-1"
$models = @("gemini-2.5-flash")
$regions = @("us-central1")

$body = @{
    contents = @(
        @{
            role = "user"
            parts = @(@{ text = "Hello" })
        }
    )
} | ConvertTo-Json -Depth 4

foreach ($region in $regions) {
    foreach ($model in $models) {
        $url = "https://$region-aiplatform.googleapis.com/v1beta1/projects/$project/locations/$region/publishers/google/models/$($model):streamGenerateContent"
        Write-Host " Testing $model in $region (Project: $project)..." -NoNewline
        try {
            $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ErrorAction Stop
            Write-Host " ✅ OK"
            break 
        } catch {
            Write-Host " ❌ $($_.Exception.Message)"
        }
    }
}
