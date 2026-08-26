package tests

import (
	"testing"

	"dockcraft-backend/services"
)

func TestAuditServices_PortCollision(t *testing.T) {
	servicesWithCollision := []services.DockerService{
		{
			ID:          "s1",
			Name:        "web_app",
			DisplayName: "Web App 1",
			Ports:       []services.PortMapping{{HostPort: 8080, ContainerPort: 80}},
		},
		{
			ID:          "s2",
			Name:        "api_service",
			DisplayName: "API Service 2",
			Ports:       []services.PortMapping{{HostPort: 8080, ContainerPort: 4000}},
		},
	}

	issues := services.AuditServices(servicesWithCollision)

	hasCollision := false
	for _, issue := range issues {
		if issue.Level == "critical" && issue.ID == "port_collision_8080" {
			hasCollision = true
			break
		}
	}

	if !hasCollision {
		t.Errorf("Expected critical port collision on port 8080")
	}
}

func TestAuditServices_MissingDBVolume(t *testing.T) {
	dbWithoutVolume := []services.DockerService{
		{
			ID:          "s_db",
			Name:        "postgres_db",
			DisplayName: "Postgres",
			Category:    services.CategoryDatabase,
			Volumes:     []services.VolumeMapping{}, // Missing!
		},
	}

	issues := services.AuditServices(dbWithoutVolume)

	hasVolumeWarning := false
	for _, issue := range issues {
		if issue.Level == "warning" && issue.AutoFixable {
			hasVolumeWarning = true
			break
		}
	}

	if !hasVolumeWarning {
		t.Errorf("Expected warning for database without volume")
	}
}
