package tests

import (
	"os"
	"path/filepath"
	"testing"

	"dockcraft-backend/services"
)

func TestScanner_FullstackDetection(t *testing.T) {
	// Create mock monorepo structure
	tmpDir, err := os.MkdirTemp("", "dockcraft-scan-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create frontend folder with Next.js & Prisma
	frontDir := filepath.Join(tmpDir, "frontend")
	_ = os.MkdirAll(frontDir, 0755)
	pkgJSON := `{
		"name": "my-next-app",
		"dependencies": {
			"next": "^14.2.0",
			"react": "^18.3.0",
			"@prisma/client": "^5.14.0",
			"ioredis": "^5.4.0"
		}
	}`
	_ = os.WriteFile(filepath.Join(frontDir, "package.json"), []byte(pkgJSON), 0644)

	// Create backend folder with FastAPI & asyncpg
	backDir := filepath.Join(tmpDir, "backend")
	_ = os.MkdirAll(backDir, 0755)
	reqTxt := "fastapi==0.111.0\nuvicorn==0.30.0\nasyncpg==0.29.0\nredis==5.0.4\n"
	_ = os.WriteFile(filepath.Join(backDir, "requirements.txt"), []byte(reqTxt), 0644)

	// Scan project
	result, err := services.ScanProjectDirectory(tmpDir)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	if len(result.Services) < 3 {
		t.Errorf("Expected at least 3 services (Next.js, FastAPI, Postgres/Redis), got %d", len(result.Services))
	}

	// Verify Next.js detected
	foundNext := false
	foundFastAPI := false
	foundDB := false
	foundRedis := false

	for _, s := range result.Services {
		if s.DockerfileType == "nextjs" || s.Name == "frontend_next" {
			foundNext = true
		}
		if s.DockerfileType == "python-fastapi" || s.Name == "api_fastapi" {
			foundFastAPI = true
		}
		if s.Category == services.CategoryDatabase {
			foundDB = true
		}
		if s.Category == services.CategoryQueue || s.Name == "cache_redis" {
			foundRedis = true
		}
	}

	if !foundNext {
		t.Errorf("Expected Next.js service to be detected")
	}
	if !foundFastAPI {
		t.Errorf("Expected FastAPI service to be detected")
	}
	if !foundDB {
		t.Errorf("Expected Database (PostgreSQL) service to be detected")
	}
	if !foundRedis {
		t.Errorf("Expected Redis cache service to be detected")
	}
}

func TestScanner_PHPSpringBootDetection(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "dockcraft-scan-php-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create Laravel composer.json
	compJSON := `{
		"name": "laravel/laravel",
		"require": {
			"php": "^8.2",
			"laravel/framework": "^11.0"
		}
	}`
	_ = os.WriteFile(filepath.Join(tmpDir, "composer.json"), []byte(compJSON), 0644)

	result, err := services.ScanProjectDirectory(tmpDir)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	foundLaravel := false
	for _, s := range result.Services {
		if s.DockerfileType == "laravel" {
			foundLaravel = true
		}
	}

	if !foundLaravel {
		t.Errorf("Expected Laravel service to be detected")
	}
}
