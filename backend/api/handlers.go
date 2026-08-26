package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"dockcraft-backend/services"
)

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// HealthHandler returns API health status
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"service":   "DockCraft Go Engine",
		"version":   "1.0.0",
		"timestamp": time.Now(),
	})
}

// SystemStatusHandler checks local Docker daemon
func SystemStatusHandler(w http.ResponseWriter, r *http.Request) {
	engine := services.GetDockerEngine()
	if engine == nil {
		writeError(w, http.StatusInternalServerError, "Docker engine uninitialized")
		return
	}
	status := engine.CheckStatus()
	writeJSON(w, http.StatusOK, status)
}

// ProjectsHandler handles list & create for projects
func ProjectsHandler(w http.ResponseWriter, r *http.Request) {
	storage := services.GetStorage()
	if storage == nil {
		writeError(w, http.StatusInternalServerError, "Storage uninitialized")
		return
	}

	if r.Method == http.MethodGet {
		projects := storage.ListProjects()
		writeJSON(w, http.StatusOK, projects)
		return
	}

	if r.Method == http.MethodPost {
		var p services.Project
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid project JSON payload")
			return
		}
		saved, err := storage.SaveProject(p)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to save project: "+err.Error())
			return
		}
		writeJSON(w, http.StatusCreated, saved)
		return
	}

	writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
}

// ProjectDetailHandler handles GET and DELETE by ID
func ProjectDetailHandler(w http.ResponseWriter, r *http.Request) {
	storage := services.GetStorage()
	if storage == nil {
		writeError(w, http.StatusInternalServerError, "Storage uninitialized")
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/projects/")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Missing project ID")
		return
	}

	if r.Method == http.MethodGet {
		p, exists := storage.GetProject(id)
		if !exists {
			writeError(w, http.StatusNotFound, "Project not found")
			return
		}
		writeJSON(w, http.StatusOK, p)
		return
	}

	if r.Method == http.MethodDelete {
		success := storage.DeleteProject(id)
		if !success {
			writeError(w, http.StatusNotFound, "Project not found")
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"success": true})
		return
	}

	writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
}

// GenerateComposeHandler generates YAML from services payload
func GenerateComposeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Services []services.DockerService `json:"services"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	yamlContent := services.GenerateDockerComposeYAML(req.Services)
	envContent, envExample := services.GenerateEnvFiles(req.Services)

	writeJSON(w, http.StatusOK, map[string]string{
		"composeYaml": yamlContent,
		"env":         envContent,
		"envExample":  envExample,
	})
}

// AuditHandler runs security analysis on stack
func AuditHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Services []services.DockerService `json:"services"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	issues := services.AuditServices(req.Services)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"issues": issues,
		"count":  len(issues),
	})
}

// DockerHubSearchHandler queries Docker Hub
func DockerHubSearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		writeJSON(w, http.StatusOK, []services.DockerHubResult{})
		return
	}

	results, err := services.SearchDockerHub(query)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Docker Hub search failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, results)
}

// DeployHandler runs docker compose up
func DeployHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Services []services.DockerService `json:"services"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	engine := services.GetDockerEngine()
	if engine == nil {
		writeError(w, http.StatusInternalServerError, "Docker engine not initialized")
		return
	}

	if err := engine.DeployStack(req.Services); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to deploy: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Deployment initiated. Follow live logs via WebSocket.",
	})
}

// StopHandler runs docker compose down
func StopHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	engine := services.GetDockerEngine()
	if engine == nil {
		writeError(w, http.StatusInternalServerError, "Docker engine not initialized")
		return
	}

	if err := engine.StopStack(); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to stop: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Stack stop initiated.",
	})
}

// DockerPSHandler returns running container status
func DockerPSHandler(w http.ResponseWriter, r *http.Request) {
	engine := services.GetDockerEngine()
	if engine == nil {
		writeError(w, http.StatusInternalServerError, "Docker engine not initialized")
		return
	}

	out, err := engine.GetContainerStatus()
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"running": false,
			"raw":     "",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"running": true,
		"raw":     out,
	})
}
