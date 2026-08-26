# ==============================================================================
# Run Full Test Suite (Go Tests + Vitest Frontend Tests)
# ==============================================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🧪 Running All DockCraft Unit & Integration Tests" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$RootPath = Split-Path -Parent $PSScriptRoot
if (-not $RootPath) { $RootPath = Get-Location }

# 1. Run Go Tests
Write-Host "`n[1/2] ⚙️ Running Backend Go Tests..." -ForegroundColor Yellow
Set-Location "$RootPath\backend"
<<<<<<< HEAD
=======
$env:GOTMPDIR = "$RootPath\backend\.tmp"
if (-not (Test-Path "$RootPath\backend\.tmp")) { New-Item -ItemType Directory -Force -Path "$RootPath\backend\.tmp" | Out-Null }
>>>>>>> b01d9dd (chore: initial project structure and repository scaffolding)
go test -v ./tests/...
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend Go tests failed!" -ForegroundColor Red
    Exit 1
}
Write-Host "✅ All Go tests passed!" -ForegroundColor Green

# 2. Run Frontend Vitest Tests
Write-Host "`n[2/2] 🎨 Running Frontend Vitest Tests..." -ForegroundColor Yellow
Set-Location "$RootPath\frontend"
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend tests failed!" -ForegroundColor Red
    Exit 1
}
Write-Host "✅ All Frontend tests passed!" -ForegroundColor Green

Write-Host "`n🎉 All tests passed successfully across Backend and Frontend!" -ForegroundColor Cyan
