<# scripts/run-dev.ps1
   Windows helper: adds firewall rule for the chosen port (default 3000) and runs Node helper.
   Run in an elevated PowerShell prompt to allow automatic firewall changes.
#>
param(
  [int]$Port = 3000
)

function Ensure-FirewallRule {
  param([int]$p)
  $ruleName = "Vite Dev $p"
  $exists = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
  if (-not $exists) {
    Write-Host "Adding firewall rule: $ruleName for port $p"
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $p | Out-Null
  } else {
    Write-Host "Firewall rule $ruleName already exists."
  }
}

# Require admin
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
  Write-Host "Please run this script as Administrator to allow automatic firewall changes. Falling back to running without adding firewall rule." -ForegroundColor Yellow
  & node "./scripts/dev-server.cjs" --port $Port
  exit $LASTEXITCODE
}

try {
  Ensure-FirewallRule -p $Port
} catch {
  Write-Host "Failed to ensure firewall rule: $_" -ForegroundColor Red
}

# Run the Node helper
node "./scripts/dev-server.cjs" --port $Port
