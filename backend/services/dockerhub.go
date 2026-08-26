package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type hubResponse struct {
	Results []struct {
		Name        string `json:"name"`
		RepoName    string `json:"repo_name"`
		ShortDescription string `json:"short_description"`
		Description string `json:"description"`
		StarCount   int    `json:"star_count"`
		IsOfficial  bool   `json:"is_official"`
		PullCount   string `json:"pull_count"`
	} `json:"results"`
}

// SearchDockerHub searches the official Docker Hub catalog
func SearchDockerHub(query string) ([]DockerHubResult, error) {
	if query == "" {
		return []DockerHubResult{}, nil
	}

	apiURL := fmt.Sprintf("https://hub.docker.com/v2/search/repositories/?query=%s&page_size=15", url.QueryEscape(query))
	client := &http.Client{Timeout: 5 * time.Second}

	resp, err := client.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("docker hub api returned status %d", resp.StatusCode)
	}

	var hubRes hubResponse
	if err := json.NewDecoder(resp.Body).Decode(&hubRes); err != nil {
		return nil, err
	}

	var results []DockerHubResult
	for _, r := range hubRes.Results {
		name := r.RepoName
		if name == "" {
			name = r.Name
		}
		desc := r.ShortDescription
		if desc == "" {
			desc = r.Description
		}

		results = append(results, DockerHubResult{
			Name:        name,
			Description: desc,
			StarCount:   r.StarCount,
			IsOfficial:  r.IsOfficial,
			PullCount:   r.PullCount,
		})
	}

	return results, nil
}
