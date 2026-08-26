package api

import (
	"log"
	"net/http"
	"time"

	"dockcraft-backend/services"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

// HandleLogsWebSocket streams live Docker and stack events to connected clients
func HandleLogsWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	engine := services.GetDockerEngine()
	if engine == nil {
		_ = conn.WriteJSON(map[string]string{"type": "error", "message": "Docker engine not initialized"})
		return
	}

	logChan := make(chan string, 100)
	engine.SubscribeLogs(logChan)
	defer engine.UnsubscribeLogs(logChan)

	// Send initial connection greeting
	_ = conn.WriteJSON(map[string]interface{}{
		"type":      "system",
		"timestamp": time.Now().Format(time.RFC3339),
		"message":   "Connected to DockCraft Live Log Stream",
	})

	for logLine := range logChan {
		msg := map[string]interface{}{
			"type":      "log",
			"timestamp": time.Now().Format(time.RFC3339),
			"content":   logLine,
		}
		if err := conn.WriteJSON(msg); err != nil {
			break
		}
	}
}
