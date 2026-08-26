@echo off
title DockCraft Studio Launcher
echo ==================================================
echo   Launching DockCraft Studio Monorepo...
echo ==================================================

start "DockCraft Backend (Go)" cmd /k "cd backend && go run main.go"
start "DockCraft Frontend (React)" cmd /k "cd frontend && npm run dev"

echo.
echo Both services launched!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080
echo.
