# 🚀 DockCraft Studio

**Visual Docker & Infrastructure Studio** avec **Backend Go (Golang 1.23+)** ultra-robuste et **Frontend React 18 / Vite** avec **6 Thèmes Dynamiques** (dont **Noir OLED Pur `#000000`** et **Blanc Épuré**).

[![Go Version](https://img.shields.io/badge/Go-1.23%2B-00ADD8?style=flat&logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen.svg)]()

---

## 🏛️ Structure du Monorepo

* **`backend/`** : Moteur Go haute performance
  * Interaction directe avec le CLI Docker (`docker compose up / down / ps / logs`)
  * Streaming temps réel des logs en **WebSockets (`ws://localhost:8080/ws/logs`)**
  * Auto-Discovery Scanner de projets locaux (`package.json`, `pom.xml`, `go.mod`, `Cargo.toml`, etc.)
  * Live Container Metrics (CPU%, RAM, Network I/O) et redémarrage sécurisé par Regex
  * Persistance des projets en JSON local
  * Recherche Docker Hub en direct via l'API officielle
  * Linter de sécurité et générateur de spécifications Compose
  * Tests unitaires Go (`go test ./tests/...`)
* **`frontend/`** : Interface React / TypeScript
  * Canvas interactif de topologie avec auto-câblage intelligent bidirectionnel (React Flow v12)
  * **6 Thèmes au choix** : Pure OLED Black `#000000`, Blanc Épuré, Midnight Slate, Cyberpunk Neon, Nordic Frost, Emerald Matrix
  * Coffre-fort de secrets cryptographiques avec synchronisation relationnelle
  * Générateur Zero-Code Production Deployment Pack (`docker-compose.prod.yml`, Nginx HTTP/2 SSL, CI/CD GitHub Actions, scripts 1-clic)
  * Console de terminal en direct pour observer le déploiement et les métriques des conteneurs
  * Bibliothèque de 30+ services et templates prêts à l'emploi
  * Tests unitaires Vitest (`npm test`)
* **`scripts/`** : Scripts de lancement 1-clic pour Windows, macOS et Linux

---

## ⚡ Démarrage Rapide

### Option 1 : Lancement 1-Clic (Windows PowerShell)
```powershell
.\scripts\start-dev.ps1
```

### Option 2 : Lancement 1-Clic (Windows CMD)
```cmd
.\scripts\start-dev.bat
```

### Option 3 : Lancement Manuel
**Dans un terminal (Backend Go) :**
```bash
cd backend
go run main.go
# Écoute sur http://localhost:8080
```

**Dans un second terminal (Frontend React) :**
```bash
cd frontend
npm run dev
# Interface disponible sur http://localhost:3000
```

---

## 🧪 Exécution des Tests

```powershell
# Exécute tous les tests (Go + Vitest)
.\scripts\test-all.ps1
```
Ou individuellement :
```bash
# Tests Backend Go
cd backend && go test -v ./tests/...

# Tests Frontend Vitest
cd frontend && npm test
```
