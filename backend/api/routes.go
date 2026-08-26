package api

import (
<<<<<<< HEAD
	"net/http"
)

// SetupRouter registers all HTTP routes with CORS support
=======
	"log"
	"net/http"
	"runtime/debug"
)

// SetupRouter registers all HTTP routes with security and CORS support
>>>>>>> 34d6cc3 (feat(backend): implement high-performance Go REST engine, security headers, scanner, docker stats & WebSocket log streamer)
func SetupRouter() http.Handler {
	mux := http.NewServeMux()

	// Base & System
	mux.HandleFunc("/api/health", HealthHandler)
	mux.HandleFunc("/api/system/status", SystemStatusHandler)

	// Projects
	mux.HandleFunc("/api/projects", ProjectsHandler)
	mux.HandleFunc("/api/projects/", ProjectDetailHandler)

<<<<<<< HEAD
	// Local File System Browser & Direct Disk Injection
=======
	// Local File System Browser, Disk Injection & Auto-Discovery Scanner
>>>>>>> 34d6cc3 (feat(backend): implement high-performance Go REST engine, security headers, scanner, docker stats & WebSocket log streamer)
	mux.HandleFunc("/api/fs/roots", GetFSRootsHandler)
	mux.HandleFunc("/api/fs/browse", BrowseFSHandler)
	mux.HandleFunc("/api/fs/create-dir", CreateFSDirHandler)
	mux.HandleFunc("/api/fs/write-stack", WriteStackToDiskHandler)
<<<<<<< HEAD
=======
	mux.HandleFunc("/api/fs/scan-project", ScanProjectHandler)
>>>>>>> 34d6cc3 (feat(backend): implement high-performance Go REST engine, security headers, scanner, docker stats & WebSocket log streamer)

	// Generation & Audit
	mux.HandleFunc("/api/generate/compose", GenerateComposeHandler)
	mux.HandleFunc("/api/audit", AuditHandler)

	// Docker Hub Search
	mux.HandleFunc("/api/hub/search", DockerHubSearchHandler)

<<<<<<< HEAD
	// Live Docker Bridge
=======
	// Live Docker Bridge & Container Performance Stats
>>>>>>> 34d6cc3 (feat(backend): implement high-performance Go REST engine, security headers, scanner, docker stats & WebSocket log streamer)
	mux.HandleFunc("/api/docker/deploy", DeployHandler)
	mux.HandleFunc("/api/docker/deploy-at-path", DeployAtPathHandler)
	mux.HandleFunc("/api/docker/stop", StopHandler)
	mux.HandleFunc("/api/docker/ps", DockerPSHandler)
<<<<<<< HEAD
=======
	mux.HandleFunc("/api/docker/stats", DockerStatsHandler)
	mux.HandleFunc("/api/docker/container/restart", RestartContainerHandler)
	mux.HandleFunc("/api/docker/container/logs", ContainerLogsHandler)
>>>>>>> 34d6cc3 (feat(backend): implement high-performance Go REST engine, security headers, scanner, docker stats & WebSocket log streamer)

	// WebSocket Log Stream
	mux.HandleFunc("/ws/logs", HandleLogsWebSocket)

<<<<<<< HEAD
	// Wrap with CORS Middleware
	return corsMiddleware(mux)
=======
	// Wrap with Security & CORS Middleware
	return securityMiddleware(corsMiddleware(mux))
}

func securityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Panic recovery
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("[CRITICAL PANIC RECOVERED] %v\nStack: %s", rec, string(debug.Stack()))
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_, _ = w.Write([]byte(`{"error":"Internal server error recovered"}`))
			}
		}()

		// Security Headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		next.ServeHTTP(w, r)
	})
>>>>>>> 34d6cc3 (feat(backend): implement high-performance Go REST engine, security headers, scanner, docker stats & WebSocket log streamer)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
