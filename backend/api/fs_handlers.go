package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"time"

	"dockcraft-backend/services"
)

// DirEntry represents a folder on the local machine
type DirEntry struct {
	Name     string    `json:"name"`
	Path     string    `json:"path"`
	IsDir    bool      `json:"isDir"`
	ModTime  time.Time `json:"modTime"`
	IsParent bool      `json:"isParent,omitempty"`
}

// WriteStackRequest represents the payload to write files to the target disk path
type WriteStackRequest struct {
	TargetPath string            `json:"targetPath"`
	Files      []DiskFilePayload `json:"files"`
}

// DiskFilePayload represents a file to be written on the local file system
type DiskFilePayload struct {
	RelativePath string `json:"relativePath"`
	Content      string `json:"content"`
}

// DeployAtPathRequest represents a request to run docker compose up at a specific folder
type DeployAtPathRequest struct {
	TargetPath string `json:"targetPath"`
}

// GetFSRootsHandler returns root drives / home paths
func GetFSRootsHandler(w http.ResponseWriter, r *http.Request) {
	var roots []DirEntry

	home, err := os.UserHomeDir()
	if err == nil {
		roots = append(roots, DirEntry{
			Name:  "Home (" + filepath.Base(home) + ")",
			Path:  home,
			IsDir: true,
		})

		desktop := filepath.Join(home, "Desktop")
		if _, err := os.Stat(desktop); err == nil {
			roots = append(roots, DirEntry{Name: "Desktop (Bureau)", Path: desktop, IsDir: true})
		}

		documents := filepath.Join(home, "Documents")
		if _, err := os.Stat(documents); err == nil {
			roots = append(roots, DirEntry{Name: "Documents", Path: documents, IsDir: true})
		}
	}

	if runtime.GOOS == "windows" {
		for _, drive := range []string{"C", "D", "E", "F"} {
			drivePath := drive + `:\`
			if _, err := os.Stat(drivePath); err == nil {
				roots = append(roots, DirEntry{
					Name:  "Local Disk (" + drive + ":)",
					Path:  drivePath,
					IsDir: true,
				})
			}
		}
	} else {
		roots = append(roots, DirEntry{
			Name:  "Root (/)",
			Path:  "/",
			IsDir: true,
		})
	}

	writeJSON(w, http.StatusOK, roots)
}

// BrowseFSHandler lists subdirectories in the specified path
func BrowseFSHandler(w http.ResponseWriter, r *http.Request) {
	targetPath := r.URL.Query().Get("path")
	if targetPath == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			targetPath = "."
		} else {
			targetPath = home
		}
	}

	targetPath = filepath.Clean(targetPath)

	info, err := os.Stat(targetPath)
	if err != nil || !info.IsDir() {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Directory does not exist or is inaccessible: %s", targetPath))
		return
	}

	entries, err := os.ReadDir(targetPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to read directory: %v", err))
		return
	}

	var results []DirEntry

	// Add parent directory link
	parent := filepath.Dir(targetPath)
	if parent != targetPath && parent != "" {
		results = append(results, DirEntry{
			Name:     ".. (Parent Directory)",
			Path:     parent,
			IsDir:    true,
			IsParent: true,
		})
	}

	for _, e := range entries {
		name := e.Name()
		if e.IsDir() && !strings.HasPrefix(name, ".") && name != "node_modules" {
			info, _ := e.Info()
			modTime := time.Now()
			if info != nil {
				modTime = info.ModTime()
			}
			results = append(results, DirEntry{
				Name:    name,
				Path:    filepath.Join(targetPath, name),
				IsDir:   true,
				ModTime: modTime,
			})
		}
	}

	sort.Slice(results, func(i, j int) bool {
		if results[i].IsParent {
			return true
		}
		if results[j].IsParent {
			return false
		}
		return strings.ToLower(results[i].Name) < strings.ToLower(results[j].Name)
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"currentPath": targetPath,
		"entries":     results,
	})
}

// CreateFSDirHandler creates a new directory in the parent path
func CreateFSDirHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ParentPath string `json:"parentPath"`
		DirName    string `json:"dirName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid payload")
		return
	}

	cleanDirName := filepath.Clean(strings.TrimSpace(req.DirName))
	fullPath := filepath.Join(req.ParentPath, cleanDirName)

	if err := os.MkdirAll(fullPath, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create directory: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"path":    fullPath,
	})
}

// WriteStackToDiskHandler physically writes generated files to disk
func WriteStackToDiskHandler(w http.ResponseWriter, r *http.Request) {
	var req WriteStackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid payload")
		return
	}

	if req.TargetPath == "" {
		writeError(w, http.StatusBadRequest, "Target path cannot be empty")
		return
	}

	targetBase := filepath.Clean(req.TargetPath)
	if err := os.MkdirAll(targetBase, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to ensure target directory: %v", err))
		return
	}

	var writtenFiles []string

	for _, file := range req.Files {
		rel := filepath.Clean(file.RelativePath)
		destPath := filepath.Join(targetBase, rel)

		dir := filepath.Dir(destPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create directory %s: %v", dir, err))
			return
		}

		if err := os.WriteFile(destPath, []byte(file.Content), 0644); err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to write file %s: %v", destPath, err))
			return
		}

		writtenFiles = append(writtenFiles, rel)
	}

	engine := services.GetDockerEngine()
	if engine != nil {
		engine.BroadcastLog(fmt.Sprintf("[DockCraft Engine] ⚡ Successfully injected %d files into: %s", len(writtenFiles), targetBase))
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"targetPath":   targetBase,
		"writtenFiles": writtenFiles,
		"count":        len(writtenFiles),
	})
}

// DeployAtPathHandler starts docker compose in target path
func DeployAtPathHandler(w http.ResponseWriter, r *http.Request) {
	var req DeployAtPathRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid payload")
		return
	}

	targetPath := filepath.Clean(req.TargetPath)
	composePath := filepath.Join(targetPath, "docker-compose.yml")
	if _, err := os.Stat(composePath); err != nil {
		writeError(w, http.StatusBadRequest, "docker-compose.yml not found in target path. Please inject stack first.")
		return
	}

	engine := services.GetDockerEngine()
	if engine == nil {
		writeError(w, http.StatusInternalServerError, "Docker engine not initialized")
		return
	}

	if err := engine.DeployAtPath(targetPath); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to deploy: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":     "deploying",
		"targetPath": targetPath,
	})
}
