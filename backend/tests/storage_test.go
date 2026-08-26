package tests

import (
	"os"
	"testing"

	"dockcraft-backend/services"
)

func TestStorageCRUD(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "dockcraft_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	storage, err := services.InitStorage(tempDir)
	if err != nil {
		t.Fatalf("Failed to init storage: %v", err)
	}

	// 1. Create
	newProj := services.Project{
		Name:        "Test Fullstack Stack",
		Description: "A test project",
		Services: []services.DockerService{
			{ID: "svc_1", Name: "app"},
		},
	}

	saved, err := storage.SaveProject(newProj)
	if err != nil {
		t.Fatalf("Failed to save project: %v", err)
	}

	if saved.ID == "" {
		t.Errorf("Expected project to have generated ID")
	}

	// 2. Read
	fetched, exists := storage.GetProject(saved.ID)
	if !exists || fetched.Name != "Test Fullstack Stack" {
		t.Errorf("Expected to fetch project with name 'Test Fullstack Stack'")
	}

	// 3. List
	all := storage.ListProjects()
	if len(all) != 1 {
		t.Errorf("Expected 1 project in list, got %d", len(all))
	}

	// 4. Delete
	deleted := storage.DeleteProject(saved.ID)
	if !deleted {
		t.Errorf("Expected project to be deleted successfully")
	}

	if len(storage.ListProjects()) != 0 {
		t.Errorf("Expected 0 projects after deletion")
	}
}
