package tests

import (
	"testing"

	"dockcraft-backend/services"
)

func TestDockerStats_Functionality(t *testing.T) {
	// Should not crash even if docker daemon is idle/mocked
	stats, err := services.GetContainerMetrics()
	if err != nil {
		t.Fatalf("GetContainerMetrics failed: %v", err)
	}

	if stats == nil {
		t.Errorf("Expected stats slice (even if empty), got nil")
	}
}
