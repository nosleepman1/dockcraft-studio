package services

import (
	"fmt"
	"strings"
)

// AuditServices runs a comprehensive security and architecture audit on services
func AuditServices(services []DockerService) []SecurityIssue {
	var issues []SecurityIssue

	// 1. Port Collisions
	portMap := make(map[string][]string)
	for _, s := range services {
		for _, p := range s.Ports {
			if p.HostPort != nil && fmt.Sprintf("%v", p.HostPort) != "0" {
				portStr := fmt.Sprintf("%v", p.HostPort)
				portMap[portStr] = append(portMap[portStr], s.DisplayName)
			}
		}
	}

	for port, svcs := range portMap {
		if len(svcs) > 1 {
			issues = append(issues, SecurityIssue{
				ID:            fmt.Sprintf("port_collision_%s", port),
				Level:         "critical",
				Title:         fmt.Sprintf("Port Conflict on Host Port %s", port),
				Message:       fmt.Sprintf("Services [%s] are competing for host port %s.", strings.Join(svcs, ", "), port),
				FixSuggestion: "Change the host port of one container to avoid binding conflict.",
			})
		}
	}

	// 2. Missing Volumes on Databases
	for _, s := range services {
		if s.Category == CategoryDatabase && s.Name != "redis" {
			hasVolume := false
			for _, v := range s.Volumes {
				if v.Type == "volume" || strings.Contains(v.ContainerPath, "data") || strings.Contains(v.ContainerPath, "db") {
					hasVolume = true
					break
				}
			}
			if !hasVolume {
				issues = append(issues, SecurityIssue{
					ID:            fmt.Sprintf("missing_db_volume_%s", s.ID),
					ServiceID:     s.ID,
					Level:         "warning",
					Title:         fmt.Sprintf("Missing Persistent Volume for %s", s.DisplayName),
					Message:       fmt.Sprintf("%s has no persistent volume mounted. Data will be lost when recreated.", s.DisplayName),
					FixSuggestion: fmt.Sprintf("Add a named volume like '%s_data:/var/lib/%s/data'.", s.Name, s.Name),
					AutoFixable:   true,
				})
			}
		}
	}

	// 3. Weak passwords
	weakPasswords := map[string]bool{
		"admin": true, "root": true, "password": true, "123456": true, "postgres": true, "secret": true, "pass": true,
	}
	for _, s := range services {
		for _, e := range s.Env {
			if e.IsSecret || strings.Contains(strings.ToLower(e.Key), "password") || strings.Contains(strings.ToLower(e.Key), "secret") {
				if weakPasswords[strings.ToLower(strings.TrimSpace(e.Value))] {
					issues = append(issues, SecurityIssue{
						ID:            fmt.Sprintf("weak_pass_%s_%s", s.ID, e.Key),
						ServiceID:     s.ID,
						Level:         "warning",
						Title:         fmt.Sprintf("Weak Default Password (%s) in %s", e.Key, s.DisplayName),
						Message:       fmt.Sprintf("The environment variable '%s' uses a known insecure password.", e.Key),
						FixSuggestion: "Generate a strong randomized token.",
					})
				}
			}
		}
	}

	// 4. Missing Healthcheck on depends_on target
	for _, s := range services {
		for _, dep := range s.DependsOn {
			if dep.Condition == "service_healthy" {
				for _, target := range services {
					if target.ID == dep.ServiceID {
						if target.HealthCheck == nil || !target.HealthCheck.Enabled {
							issues = append(issues, SecurityIssue{
								ID:            fmt.Sprintf("missing_health_%s_%s", s.ID, target.ID),
								ServiceID:     s.ID,
								Level:         "warning",
								Title:         fmt.Sprintf("Missing Healthcheck on Dependency %s", target.DisplayName),
								Message:       fmt.Sprintf("%s depends on %s with condition 'service_healthy', but no healthcheck is active.", s.DisplayName, target.DisplayName),
								FixSuggestion: fmt.Sprintf("Enable healthcheck on %s.", target.DisplayName),
							})
						}
						break
					}
				}
			}
		}
	}

	if len(issues) == 0 && len(services) > 0 {
		issues = append(issues, SecurityIssue{
			ID:      "stack_healthy",
			Level:   "success",
			Title:   "Stack Verified & Secure",
			Message: fmt.Sprintf("All %d services pass security and network integrity checks.", len(services)),
		})
	}

	return issues
}
