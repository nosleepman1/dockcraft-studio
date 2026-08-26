package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"dockcraft-backend/api"
	"dockcraft-backend/services"
)

func TestFSHandlers(t *testing.T) {
	// Initialize engine
	tmpDir, err := os.MkdirTemp("", "dockcraft-fs-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	_, _ = services.InitDockerEngine(tmpDir)

	// 1. Test Get Roots
	t.Run("Get Roots", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/fs/roots", nil)
		w := httptest.NewRecorder()
		api.GetFSRootsHandler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var roots []api.DirEntry
		if err := json.NewDecoder(w.Body).Decode(&roots); err != nil {
			t.Fatalf("Failed to decode roots JSON: %v", err)
		}

		if len(roots) == 0 {
			t.Errorf("Expected at least 1 root, got 0")
		}
	})

	// 2. Test Browse FS
	t.Run("Browse FS", func(t *testing.T) {
		// Create subfolders in tmpDir
		sub1 := filepath.Join(tmpDir, "subfolder1")
		sub2 := filepath.Join(tmpDir, "subfolder2")
		_ = os.MkdirAll(sub1, 0755)
		_ = os.MkdirAll(sub2, 0755)

		req := httptest.NewRequest("GET", "/api/fs/browse?path="+tmpDir, nil)
		w := httptest.NewRecorder()
		api.BrowseFSHandler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var resp struct {
			CurrentPath string         `json:"currentPath"`
			Entries     []api.DirEntry `json:"entries"`
		}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("Failed to decode browse JSON: %v", err)
		}

		foundSub1 := false
		for _, e := range resp.Entries {
			if e.Name == "subfolder1" {
				foundSub1 = true
			}
		}
		if !foundSub1 {
			t.Errorf("Expected subfolder1 in browse results")
		}
	})

	// 3. Test Write Stack To Disk
	t.Run("Write Stack To Disk", func(t *testing.T) {
		destDir := filepath.Join(tmpDir, "my-target-project")

		payload := api.WriteStackRequest{
			TargetPath: destDir,
			Files: []api.DiskFilePayload{
				{
					RelativePath: "docker-compose.yml",
					Content:      "services:\n  web:\n    image: nginx\n",
				},
				{
					RelativePath: "backend/Dockerfile",
					Content:      "FROM node:20\nWORKDIR /app\n",
				},
				{
					RelativePath: ".env",
					Content:      "PORT=8080\n",
				},
			},
		}

		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/fs/write-stack", bytes.NewBuffer(bodyBytes))
		w := httptest.NewRecorder()
		api.WriteStackToDiskHandler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d, body: %s", w.Code, w.Body.String())
		}

		// Verify files exist on disk
		if _, err := os.Stat(filepath.Join(destDir, "docker-compose.yml")); err != nil {
			t.Errorf("docker-compose.yml was not written to disk: %v", err)
		}
		if _, err := os.Stat(filepath.Join(destDir, "backend", "Dockerfile")); err != nil {
			t.Errorf("backend/Dockerfile was not written to disk: %v", err)
		}
		if _, err := os.Stat(filepath.Join(destDir, ".env")); err != nil {
			t.Errorf(".env was not written to disk: %v", err)
		}
	})
}
