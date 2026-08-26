#!/usr/bin/env bash
echo "=================================================="
echo "  🚀 Starting DockCraft Studio Monorepo..."
echo "=================================================="

(cd backend && go run main.go) &
(cd frontend && npm run dev) &

wait
