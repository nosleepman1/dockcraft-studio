package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Storage struct {
	mu       sync.RWMutex
	filePath string
	projects map[string]Project
}

var globalStorage *Storage

// InitStorage initializes the project repository
func InitStorage(dataDir string) (*Storage, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}

	filePath := filepath.Join(dataDir, "dockcraft_projects.json")
	s := &Storage{
		filePath: filePath,
		projects: make(map[string]Project),
	}

	// Load existing projects if file exists
	if data, err := os.ReadFile(filePath); err == nil {
		var list []Project
		if err := json.Unmarshal(data, &list); err == nil {
			for _, p := range list {
				s.projects[p.ID] = p
			}
		}
	}

	globalStorage = s
	return s, nil
}

// GetStorage returns the singleton storage instance
func GetStorage() *Storage {
	return globalStorage
}

// SaveProject creates or updates a project
func (s *Storage) SaveProject(p Project) (Project, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p.ID == "" {
		p.ID = fmt.Sprintf("proj_%d", time.Now().UnixNano())
		p.CreatedAt = time.Now()
	}
	p.UpdatedAt = time.Now()

	s.projects[p.ID] = p
	if err := s.persist(); err != nil {
		return p, err
	}

	return p, nil
}

// ListProjects returns all saved projects
func (s *Storage) ListProjects() []Project {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []Project
	for _, p := range s.projects {
		list = append(list, p)
	}
	return list
}

// GetProject returns a single project by ID
func (s *Storage) GetProject(id string) (Project, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, exists := s.projects[id]
	return p, exists
}

// DeleteProject removes a project by ID
func (s *Storage) DeleteProject(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.projects[id]; exists {
		delete(s.projects, id)
		_ = s.persist()
		return true
	}
	return false
}

func (s *Storage) persist() error {
	var list []Project
	for _, p := range s.projects {
		list = append(list, p)
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.filePath, data, 0644)
}
