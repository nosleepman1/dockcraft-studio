# DockCraft Studio

**Visual Docker & Infrastructure Studio** avec **Backend Go (Golang 1.26)** ultra-robuste et **Frontend React 18 / Vite** avec **6 Thèmes Dynamiques** (dont **Noir OLED Pur `#000000`** et **Blanc Épuré**).

---

## Structure du Monorepo

* **`backend/`** : Moteur Go haute performance
  * Interaction directe avec le CLI Docker (`docker compose up / down / ps / logs`)
  * Streaming temps réel des logs en **WebSockets (`ws://localhost:8080/ws/logs`)**
  * Persistance des projets en SQLite / JSON
  * Recherche Docker Hub en direct via l'API officielle
  * Linter de sécurité et générateur de spécifications Compose
  * Tests unitaires Go (`go test ./tests/...`)
* **`frontend/`** : Interface React / TypeScript
  * Canvas interactif de topologie avec auto-câblage intelligent (React Flow v12)
  * **6 Thèmes au choix** : Pure OLED Black `#000000`, Blanc Épuré, Midnight Slate, Cyberpunk Neon, Nordic Frost, Emerald Matrix
  * Console de terminal en direct pour observer le déploiement des conteneurs
  * Bibliothèque de 30+ services et templates prêts à l'emploi
  * Tests unitaires Vitest (`npm test`)
* **`scripts/`** : Scripts de lancement 1-clic pour Windows, macOS et Linux

---

## Démarrage Rapide

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

## Exécution des Tests

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
