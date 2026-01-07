# Release script - BTP Connect (novice-proof)
Set-Location $PSScriptRoot

# Stop any running app that can lock files
Get-Process "BTP Connect" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process "electron" -ErrorAction SilentlyContinue | Stop-Process -Force

# Ensure UI exists
New-Item -ItemType Directory -Force -Path ".\src" | Out-Null
if (!(Test-Path ".\src\index.html")) { throw "src\index.html manquant. Relance le script de génération UI." }

# Clean dist
if (Test-Path ".\dist") { Remove-Item ".\dist" -Recurse -Force }

# Build
npm run build *>&1 | Tee-Object -FilePath ".\build.log"

# Show results
Write-Host "`n=== EXE TROUVÉS ==="
Get-ChildItem ".\dist" -Recurse -Filter *.exe -ErrorAction SilentlyContinue | Select-Object FullName

# Open dist
explorer .\dist
