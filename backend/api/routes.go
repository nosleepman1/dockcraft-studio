package api

import (
	"net/http"
)

// SetupRouter registers all HTTP routes with CORS support
func SetupRouter() http.Handler {
	mux := http.NewServeMux()

	// Base & System
	mux.HandleFunc("/api/health", HealthHandler)
	mux.HandleFunc("/api/system/status", SystemStatusHandler)

	// Projects
	mux.HandleFunc("/api/projects", ProjectsHandler)
	mux.HandleFunc("/api/projects/", ProjectDetailHandler)

	// Local File System Browser & Direct Disk Injection
	mux.HandleFunc("/api/fs/roots", GetFSRootsHandler)
	mux.HandleFunc("/api/fs/browse", BrowseFSHandler)
	mux.HandleFunc("/api/fs/create-dir", CreateFSDirHandler)
	mux.HandleFunc("/api/fs/write-stack", WriteStackToDiskHandler)

	// Generation & Audit
	mux.HandleFunc("/api/generate/compose", GenerateComposeHandler)
	mux.HandleFunc("/api/audit", AuditHandler)

	// Docker Hub Search
	mux.HandleFunc("/api/hub/search", DockerHubSearchHandler)

	// Live Docker Bridge
	mux.HandleFunc("/api/docker/deploy", DeployHandler)
	mux.HandleFunc("/api/docker/deploy-at-path", DeployAtPathHandler)
	mux.HandleFunc("/api/docker/stop", StopHandler)
	mux.HandleFunc("/api/docker/ps", DockerPSHandler)

	// WebSocket Log Stream
	mux.HandleFunc("/ws/logs", HandleLogsWebSocket)

	// Wrap with CORS Middleware
	return corsMiddleware(mux)
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
