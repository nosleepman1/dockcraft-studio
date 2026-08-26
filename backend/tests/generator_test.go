package tests

import (
	"strings"
	"testing"

	"dockcraft-backend/services"
)

func TestGenerateDockerComposeYAML(t *testing.T) {
	mockServices := []services.DockerService{
		{
			ID:          "svc_postgres",
			Name:        "db_postgres",
			DisplayName: "PostgreSQL Database",
			Category:    services.CategoryDatabase,
			Image:       "postgres",
			Tag:         "16-alpine",
			Ports: []services.PortMapping{
				{ID: "p1", HostPort: 5432, ContainerPort: 5432, Protocol: "tcp"},
			},
			Env: []services.EnvVariable{
				{ID: "e1", Key: "POSTGRES_DB", Value: "testdb"},
				{ID: "e2", Key: "POSTGRES_PASSWORD", Value: "secret123", IsSecret: true},
			},
			Volumes: []services.VolumeMapping{
				{ID: "v1", HostPath: "pg_data", ContainerPath: "/var/lib/postgresql/data", Type: "volume"},
			},
			HealthCheck: &services.HealthCheck{
				Enabled:  true,
				Test:     "pg_isready",
				Interval: "5s",
			},
		},
		{
			ID:          "svc_api",
			Name:        "backend_api",
			DisplayName: "FastAPI Backend",
			Category:    services.CategoryBackend,
			IsCustomBuild: true,
			BuildContext: "./backend",
			Ports: []services.PortMapping{
				{ID: "p2", HostPort: 8000, ContainerPort: 8000, Protocol: "tcp"},
			},
			DependsOn: []services.Dependency{
				{ServiceID: "svc_postgres", Condition: "service_healthy"},
			},
		},
	}

	yaml := services.GenerateDockerComposeYAML(mockServices)

	if !strings.Contains(yaml, "db_postgres:") {
		t.Errorf("Expected db_postgres service in YAML output")
	}

	if !strings.Contains(yaml, "image: postgres:16-alpine") {
		t.Errorf("Expected image postgres:16-alpine in YAML output")
	}

	if !strings.Contains(yaml, "condition: service_healthy") {
		t.Errorf("Expected dependency condition service_healthy in YAML output")
	}

	if !strings.Contains(yaml, "volumes:") || !strings.Contains(yaml, "pg_data:") {
		t.Errorf("Expected named volume pg_data defined in YAML output")
	}
}

func TestGenerateEnvFiles(t *testing.T) {
	mockServices := []services.DockerService{
		{
			ID:          "svc_1",
			Name:        "api",
			DisplayName: "API Server",
			Env: []services.EnvVariable{
				{Key: "APP_ENV", Value: "production"},
				{Key: "DB_PASS", Value: "mypassword", IsSecret: true},
			},
		},
	}

	env, example := services.GenerateEnvFiles(mockServices)

	if !strings.Contains(env, "APP_ENV=production") || !strings.Contains(env, "DB_PASS=mypassword") {
		t.Errorf(".env should contain real values")
	}

	if !strings.Contains(example, "DB_PASS=your_db_pass_here") {
		t.Errorf(".env.example should mask secrets")
	}
}
