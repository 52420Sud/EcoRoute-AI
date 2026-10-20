$data = Invoke-RestMethod 'https://storage.googleapis.com/flutter_infra_release/releases/releases_windows.json'
$stableHash = $data.current_release.stable
$rel = $data.releases | Where-Object { $_.hash -eq $stableHash } | Select-Object -First 1
$downloadUrl = "$($data.base_url)/$($rel.archive)"
Write-Host "FLUTTER_VERSION=$($rel.version)"
Write-Host "FLUTTER_DOWNLOAD_URL=$downloadUrl"
