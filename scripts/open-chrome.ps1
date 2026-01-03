$server = 'http://127.0.0.1:3000'
$ok = $false
for ($i=0; $i -lt 120; $i++) {
  try {
    Invoke-WebRequest -Uri $server -UseBasicParsing -TimeoutSec 2 | Out-Null
    $ok = $true
    break
  } catch {}
  Start-Sleep -Seconds 1
}
if (-not $ok) {
  Write-Error "Server did not become reachable in time"
  exit 1
} else {
  Write-Output "Server reachable; opening Chrome"
  Start-Process -FilePath 'cmd' -ArgumentList '/c','start chrome http://localhost:3000'
}
