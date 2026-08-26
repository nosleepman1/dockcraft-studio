package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

var validContainerNameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$`)

// ContainerStat represents real-time CPU, RAM, Network and I/O metrics for a container
type ContainerStat struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CPUPerc   string    `json:"cpuPerc"`
	MemUsage  string    `json:"memUsage"`
	MemPerc   string    `json:"memPerc"`
	NetIO     string    `json:"netIO"`
	BlockIO   string    `json:"blockIO"`
	PIDs      string    `json:"pids"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

// ValidateContainerName verifies that a container name or ID adheres to strict character rules
func ValidateContainerName(name string) error {
	clean := strings.TrimSpace(name)
	if clean == "" {
		return fmt.Errorf("container name cannot be empty")
	}
	if !validContainerNameRegex.MatchString(clean) {
		return fmt.Errorf("invalid container name '%s': contains illegal characters", clean)
	}
	return nil
}

// GetContainerMetrics queries the Docker daemon for live performance stats
func GetContainerMetrics() ([]ContainerStat, error) {
	cmd := exec.Command("docker", "stats", "--no-stream", "--format", "{{json .}}")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		// Return empty list if docker is not running or has no active containers
		return []ContainerStat{}, nil
	}

	var stats []ContainerStat
	lines := strings.Split(strings.TrimSpace(stdout.String()), "\n")

	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}

		var raw struct {
			ID       string `json:"ID"`
			Name     string `json:"Name"`
			CPUPerc  string `json:"CPUPerc"`
			MemUsage string `json:"MemUsage"`
			MemPerc  string `json:"MemPerc"`
			NetIO    string `json:"NetIO"`
			BlockIO  string `json:"BlockIO"`
			PIDs     string `json:"PIDs"`
		}

		if err := json.Unmarshal([]byte(line), &raw); err == nil {
			stats = append(stats, ContainerStat{
				ID:        raw.ID,
				Name:      raw.Name,
				CPUPerc:   raw.CPUPerc,
				MemUsage:  raw.MemUsage,
				MemPerc:   raw.MemPerc,
				NetIO:     raw.NetIO,
				BlockIO:   raw.BlockIO,
				PIDs:      raw.PIDs,
				Status:    "running",
				Timestamp: time.Now(),
			})
		}
	}

	return stats, nil
}

// RestartContainer executes docker restart on the specified container safely
func RestartContainer(containerNameOrID string) error {
	cleanName := strings.TrimSpace(containerNameOrID)
	if err := ValidateContainerName(cleanName); err != nil {
		return err
	}

	cmd := exec.Command("docker", "restart", cleanName)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to restart container %s: %s (%v)", cleanName, string(out), err)
	}

	engine := GetDockerEngine()
	if engine != nil {
		engine.BroadcastLog(fmt.Sprintf("[DockCraft Daemon] 🔄 Restarted container: %s", cleanName))
	}

	return nil
}

// GetContainerSpecificLogs fetches trailing logs from a single container safely
func GetContainerSpecificLogs(containerNameOrID string, tail int) (string, error) {
	cleanName := strings.TrimSpace(containerNameOrID)
	if err := ValidateContainerName(cleanName); err != nil {
		return "", err
	}
	if tail <= 0 {
		tail = 100
	}
	if tail > 2000 {
		tail = 2000
	}

	cmd := exec.Command("docker", "logs", "--tail", fmt.Sprintf("%d", tail), cleanName)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("error reading logs: %v", err)
	}

	return string(out), nil
}
