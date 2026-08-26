package services

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

type DockerEngine struct {
	mu           sync.Mutex
	workspaceDir string
	activeCmd    *exec.Cmd
	cancelFunc   context.CancelFunc
	logChannel   chan string
	subscribers  map[chan string]bool
}

var globalEngine *DockerEngine

// InitDockerEngine initializes the Docker Bridge service
func InitDockerEngine(workspaceDir string) (*DockerEngine, error) {
	if err := os.MkdirAll(workspaceDir, 0755); err != nil {
		return nil, err
	}

	engine := &DockerEngine{
		workspaceDir: workspaceDir,
		logChannel:   make(chan string, 100),
		subscribers:  make(map[chan string]bool),
	}

	globalEngine = engine
	return engine, nil
}

// GetDockerEngine returns the singleton Docker Engine instance
func GetDockerEngine() *DockerEngine {
	return globalEngine
}

// CheckStatus verifies if the Docker daemon is accessible
func (e *DockerEngine) CheckStatus() SystemStatus {
	cmd := exec.Command("docker", "version", "--format", "{{.Server.Version}}")
	out, err := cmd.Output()

	status := SystemStatus{
		OS: runtime.GOOS,
	}

	if err == nil {
		status.DockerAvailable = true
		status.DockerVersion = strings.TrimSpace(string(out))
	} else {
		// Try without format
		cmdBasic := exec.Command("docker", "--version")
		if basicOut, basicErr := cmdBasic.Output(); basicErr == nil {
			status.DockerAvailable = true
			status.DockerVersion = strings.TrimSpace(string(basicOut))
		}
	}

	return status
}

// SubscribeLogs registers a subscriber for real-time logs
func (e *DockerEngine) SubscribeLogs(ch chan string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.subscribers[ch] = true
}

// UnsubscribeLogs removes a subscriber
func (e *DockerEngine) UnsubscribeLogs(ch chan string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	delete(e.subscribers, ch)
	close(ch)
}

func (e *DockerEngine) broadcast(logLine string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	for ch := range e.subscribers {
		select {
		case ch <- logLine:
		default:
		}
	}
}

// DeployStack writes compose files and executes `docker compose up -d`
func (e *DockerEngine) DeployStack(services []DockerService) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	// Write docker-compose.yml to workspace
	yamlContent := GenerateDockerComposeYAML(services)
	composePath := filepath.Join(e.workspaceDir, "docker-compose.yml")
	if err := os.WriteFile(composePath, []byte(yamlContent), 0644); err != nil {
		return fmt.Errorf("failed to write compose file: %w", err)
	}

	// Write .env
	envContent, _ := GenerateEnvFiles(services)
	envPath := filepath.Join(e.workspaceDir, ".env")
	_ = os.WriteFile(envPath, []byte(envContent), 0644)

	e.broadcast("[DockCraft Engine] 🚀 Initiating 'docker compose up -d'...")

	ctx, cancel := context.WithCancel(context.Background())
	e.cancelFunc = cancel

	cmd := exec.CommandContext(ctx, "docker", "compose", "up", "-d")
	cmd.Dir = e.workspaceDir

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		e.broadcast(fmt.Sprintf("[DockCraft Engine] ❌ Failed to start command: %v", err))
		return err
	}

	go e.streamPipe(stdout, "[stdout]")
	go e.streamPipe(stderr, "[stderr]")

	go func() {
		if err := cmd.Wait(); err != nil {
			e.broadcast(fmt.Sprintf("[DockCraft Engine] ❌ Process finished with status: %v", err))
		} else {
			e.broadcast("[DockCraft Engine] ✅ Stack successfully started and running!")
		}
	}()

	return nil
}

// StopStack executes `docker compose down`
func (e *DockerEngine) StopStack() error {
	e.broadcast("[DockCraft Engine] 🛑 Stopping stack with 'docker compose down'...")

	cmd := exec.Command("docker", "compose", "down")
	cmd.Dir = e.workspaceDir

	out, err := cmd.CombinedOutput()
	if err != nil {
		e.broadcast(fmt.Sprintf("[DockCraft Engine] ❌ Error stopping stack: %s", string(out)))
		return err
	}

	e.broadcast(fmt.Sprintf("[DockCraft Engine] ✅ Stack stopped:\n%s", string(out)))
	return nil
}

// GetContainerStatus queries `docker compose ps`
func (e *DockerEngine) GetContainerStatus() (string, error) {
	cmd := exec.Command("docker", "compose", "ps", "--format", "json")
	cmd.Dir = e.workspaceDir
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(out), nil
}

func (e *DockerEngine) BroadcastLog(line string) {
	e.broadcast(line)
}

// DeployAtPath executes docker compose up in a custom path
func (e *DockerEngine) DeployAtPath(targetPath string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.broadcast(fmt.Sprintf("[DockCraft Engine] 🚀 Initiating 'docker compose up -d' in %s...", targetPath))

	ctx, cancel := context.WithCancel(context.Background())
	e.cancelFunc = cancel

	cmd := exec.CommandContext(ctx, "docker", "compose", "up", "-d", "--build")
	cmd.Dir = targetPath

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		e.broadcast(fmt.Sprintf("[DockCraft Engine] ❌ Failed to start command: %v", err))
		return err
	}

	go e.streamPipe(stdout, "[stdout]")
	go e.streamPipe(stderr, "[stderr]")

	go func() {
		if err := cmd.Wait(); err != nil {
			e.broadcast(fmt.Sprintf("[DockCraft Engine] ❌ Deployment finished with status: %v", err))
		} else {
			e.broadcast(fmt.Sprintf("[DockCraft Engine] ✅ Stack successfully started in %s!", targetPath))
		}
	}()

	return nil
}

func (e *DockerEngine) streamPipe(r io.Reader, prefix string) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()
		e.broadcast(fmt.Sprintf("%s %s", prefix, line))
	}
}

