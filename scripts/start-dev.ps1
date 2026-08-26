# ==============================================================================
# DockCraft Studio - Fullstack Dev Runner (Windows PowerShell)
# Starts Go Backend (port 8080) and React Frontend (port 3000)
# ==============================================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🚀 Launching DockCraft Studio Monorepo..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$RootPath = Split-Path -Parent $PSScriptRoot
if (-not $RootPath) { $RootPath = Get-Location }

# 1. Start Go Backend
Write-Host "⚙️ Starting Go Backend Engine on http://localhost:8080..." -ForegroundColor Green
$BackendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath\backend'; go run main.go" -PassThru

# 2. Start Frontend
Write-Host "🎨 Starting React Frontend on http://localhost:3000..." -ForegroundColor Green
$FrontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath\frontend'; npm run dev" -PassThru

Write-Host "`n✅ Both services started in separate processes!" -ForegroundColor Cyan
Write-Host "📍 Frontend URL: http://localhost:3000" -ForegroundColor Yellow
Write-Host "📍 Backend REST: http://localhost:8080/api/health" -ForegroundColor Yellow
Write-Host "📍 WebSocket:    ws://localhost:8080/ws/logs" -ForegroundColor Yellow
