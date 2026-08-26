package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"dockcraft-backend/api"
	"dockcraft-backend/services"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize local storage directory
	userHome, _ := os.UserHomeDir()
	dataDir := filepath.Join(userHome, ".dockcraft")
	if _, err := services.InitStorage(dataDir); err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	// Initialize Docker workspace directory
	workspaceDir := filepath.Join(dataDir, "workspace")
	if _, err := services.InitDockerEngine(workspaceDir); err != nil {
		log.Fatalf("Failed to initialize Docker engine: %v", err)
	}

	router := api.SetupRouter()

	fmt.Println("==================================================")
	fmt.Println("  🚀 DockCraft Go Backend Engine running on port " + port)
	fmt.Println("  📍 REST API:     http://localhost:" + port + "/api/health")
	fmt.Println("  📍 WebSocket WS: ws://localhost:" + port + "/ws/logs")
	fmt.Println("==================================================")

	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
