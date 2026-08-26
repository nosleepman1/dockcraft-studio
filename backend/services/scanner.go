package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ScanResult contains detected services, project metadata, and summary
type ScanResult struct {
	ProjectName       string          `json:"projectName"`
	RootPath          string          `json:"rootPath"`
	DetectedStack     string          `json:"detectedStack"`
	DetectedLanguages []string        `json:"detectedLanguages"`
	DetectedDatabases []string        `json:"detectedDatabases"`
	Services          []DockerService `json:"services"`
	TotalFilesScanned int             `json:"totalFilesScanned"`
}

// PackageJSON represents minimal fields of package.json
type PackageJSON struct {
	Name            string            `json:"name"`
	Dependencies    map[string]string `json:"dependencies"`
	DevDependencies map[string]string `json:"devDependencies"`
	Scripts         map[string]string `json:"scripts"`
}

// ComposerJSON represents minimal fields of composer.json
type ComposerJSON struct {
	Name    string            `json:"name"`
	Require map[string]string `json:"require"`
}

// ScanProjectDirectory scans a local folder and extracts microservices, databases, and configuration
func ScanProjectDirectory(rootPath string) (*ScanResult, error) {
	cleanPath := filepath.Clean(rootPath)
	info, err := os.Stat(cleanPath)
	if err != nil || !info.IsDir() {
		return nil, fmt.Errorf("invalid directory path: %s", cleanPath)
	}

	projectName := filepath.Base(cleanPath)
	if projectName == "." || projectName == "/" || projectName == "\\" {
		projectName = "scanned-architecture"
	}

	result := &ScanResult{
		ProjectName:       projectName,
		RootPath:          cleanPath,
		DetectedLanguages: []string{},
		DetectedDatabases: []string{},
		Services:          []DockerService{},
	}

	var totalFiles int
	detectedDBMap := make(map[string]bool)
	detectedLangMap := make(map[string]bool)

	// Traverse up to 3 levels deep, skipping ignored directories
	err = filepath.Walk(cleanPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		rel, _ := filepath.Rel(cleanPath, path)
		depth := len(strings.Split(rel, string(os.PathSeparator)))
		if depth > 4 {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		name := info.Name()
		if info.IsDir() {
			if strings.HasPrefix(name, ".") || name == "node_modules" || name == "vendor" ||
				name == "dist" || name == "build" || name == "target" || name == ".git" || name == "venv" || name == ".venv" {
				return filepath.SkipDir
			}
			return nil
		}

		totalFiles++

		// Check manifests
		switch name {
		case "package.json":
			detectedLangMap["TypeScript/JavaScript"] = true
			scanNodeManifest(path, cleanPath, result, detectedDBMap)

		case "requirements.txt", "Pipfile", "pyproject.toml":
			detectedLangMap["Python"] = true
			scanPythonManifest(path, cleanPath, result, detectedDBMap)

		case "composer.json":
			detectedLangMap["PHP"] = true
			scanPHPManifest(path, cleanPath, result, detectedDBMap)

		case "pom.xml", "build.gradle", "build.gradle.kts":
			detectedLangMap["Java"] = true
			scanJavaManifest(path, cleanPath, result, detectedDBMap)

		case "go.mod":
			detectedLangMap["Go"] = true
			scanGoManifest(path, cleanPath, result, detectedDBMap)

		case "Cargo.toml":
			detectedLangMap["Rust"] = true
			scanRustManifest(path, cleanPath, result, detectedDBMap)

		case "schema.prisma":
			scanPrismaSchema(path, detectedDBMap)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	result.TotalFilesScanned = totalFiles

	// Convert detected languages map to slice
	for lang := range detectedLangMap {
		result.DetectedLanguages = append(result.DetectedLanguages, lang)
	}

	// Add detected databases / caches as real docker services
	for db := range detectedDBMap {
		result.DetectedDatabases = append(result.DetectedDatabases, db)
		addDatabaseServiceIfMissing(db, result)
	}

	// Auto-wire dependencies between services
	wireScannedServices(result)

	// Determine stack summary title
	if len(result.Services) > 0 {
		var names []string
		for _, s := range result.Services {
			names = append(names, s.DisplayName)
		}
		result.DetectedStack = strings.Join(names, " + ")
	} else {
		// If no manifest found, create a generic custom service
		result.DetectedStack = "Generic Monorepo"
		result.Services = append(result.Services, DockerService{
			ID:            "svc_app",
			Name:          "app_service",
			DisplayName:   "App Service",
			Category:      CategoryCustom,
			IsCustomBuild: true,
			BuildContext:  ".",
			DockerfilePath: "./Dockerfile",
			DockerfileType: "custom",
			Ports:         []PortMapping{{ID: "p1", HostPort: 8080, ContainerPort: 8080, Protocol: "tcp"}},
			Expose:        []int{8080},
			Networks:      []string{"app-network"},
			Env:           []EnvVariable{{ID: "e1", Key: "PORT", Value: "8080"}},
			Volumes:       []VolumeMapping{},
			DependsOn:     []Dependency{},
			Restart:       "unless-stopped",
		})
	}

	return result, nil
}

// -------------------------------------------------------------
// Manifest Parsers
// -------------------------------------------------------------

func scanNodeManifest(filePath, rootPath string, result *ScanResult, dbMap map[string]bool) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}

	var pkg PackageJSON
	_ = json.Unmarshal(data, &pkg)

	dir := filepath.Dir(filePath)
	relFolder, _ := filepath.Rel(rootPath, dir)
	if relFolder == "." {
		relFolder = "frontend"
	}

	allDeps := make(map[string]bool)
	for k := range pkg.Dependencies {
		allDeps[strings.ToLower(k)] = true
	}
	for k := range pkg.DevDependencies {
		allDeps[strings.ToLower(k)] = true
	}

	// Check DB libraries
	if allDeps["pg"] || allDeps["postgres"] || allDeps["@prisma/client"] || allDeps["typeorm"] {
		dbMap["postgres"] = true
	}
	if allDeps["mysql"] || allDeps["mysql2"] {
		dbMap["mysql"] = true
	}
	if allDeps["mongodb"] || allDeps["mongoose"] {
		dbMap["mongodb"] = true
	}
	if allDeps["redis"] || allDeps["ioredis"] {
		dbMap["redis"] = true
	}

	// Detect Framework
	if allDeps["next"] {
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_next_%d", len(result.Services)+1),
			Name:           "frontend_next",
			DisplayName:    "Next.js App",
			Category:       CategoryFrontend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "nextjs",
			Ports:          []PortMapping{{ID: "p1", HostPort: 3000, ContainerPort: 3000, Protocol: "tcp"}},
			Expose:         []int{3000},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{{ID: "e1", Key: "NODE_ENV", Value: "production"}, {ID: "e2", Key: "PORT", Value: "3000"}},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	} else if allDeps["@nestjs/core"] {
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_nest_%d", len(result.Services)+1),
			Name:           "api_nest",
			DisplayName:    "NestJS API",
			Category:       CategoryBackend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "nestjs",
			Ports:          []PortMapping{{ID: "p1", HostPort: 3000, ContainerPort: 3000, Protocol: "tcp"}},
			Expose:         []int{3000},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{{ID: "e1", Key: "NODE_ENV", Value: "production"}, {ID: "e2", Key: "PORT", Value: "3000"}},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	} else if allDeps["@angular/core"] {
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_angular_%d", len(result.Services)+1),
			Name:           "frontend_angular",
			DisplayName:    "Angular SPA",
			Category:       CategoryFrontend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "angular",
			Ports:          []PortMapping{{ID: "p1", HostPort: 4200, ContainerPort: 80, Protocol: "tcp"}},
			Expose:         []int{80},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	} else if allDeps["vue"] {
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_vue_%d", len(result.Services)+1),
			Name:           "frontend_vue",
			DisplayName:    "Vue 3 App",
			Category:       CategoryFrontend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "vuejs",
			Ports:          []PortMapping{{ID: "p1", HostPort: 5174, ContainerPort: 80, Protocol: "tcp"}},
			Expose:         []int{80},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	} else if allDeps["react"] {
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_react_%d", len(result.Services)+1),
			Name:           "frontend_react",
			DisplayName:    "React SPA",
			Category:       CategoryFrontend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "react-vite",
			Ports:          []PortMapping{{ID: "p1", HostPort: 5173, ContainerPort: 80, Protocol: "tcp"}},
			Expose:         []int{80},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	} else {
		// Generic Node/Express
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_node_%d", len(result.Services)+1),
			Name:           "api_node",
			DisplayName:    "Node.js API",
			Category:       CategoryBackend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "nodejs",
			Ports:          []PortMapping{{ID: "p1", HostPort: 4000, ContainerPort: 4000, Protocol: "tcp"}},
			Expose:         []int{4000},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{{ID: "e1", Key: "NODE_ENV", Value: "production"}, {ID: "e2", Key: "PORT", Value: "4000"}},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	}
}

func scanPythonManifest(filePath, rootPath string, result *ScanResult, dbMap map[string]bool) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	content := strings.ToLower(string(data))

	dir := filepath.Dir(filePath)
	relFolder, _ := filepath.Rel(rootPath, dir)
	if relFolder == "." {
		relFolder = "backend"
	}

	if strings.Contains(content, "psycopg") || strings.Contains(content, "asyncpg") {
		dbMap["postgres"] = true
	}
	if strings.Contains(content, "pymysql") || strings.Contains(content, "mysqlclient") {
		dbMap["mysql"] = true
	}
	if strings.Contains(content, "pymongo") || strings.Contains(content, "motor") {
		dbMap["mongodb"] = true
	}
	if strings.Contains(content, "redis") || strings.Contains(content, "celery") {
		dbMap["redis"] = true
	}
	if strings.Contains(content, "qdrant") {
		dbMap["qdrant"] = true
	}

	if strings.Contains(content, "django") {
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_django_%d", len(result.Services)+1),
			Name:           "api_django",
			DisplayName:    "Django API",
			Category:       CategoryBackend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "django",
			Ports:          []PortMapping{{ID: "p1", HostPort: 8000, ContainerPort: 8000, Protocol: "tcp"}},
			Expose:         []int{8000},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{{ID: "e1", Key: "PYTHONUNBUFFERED", Value: "1"}},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	} else {
		// Default to FastAPI
		result.Services = append(result.Services, DockerService{
			ID:             fmt.Sprintf("svc_fastapi_%d", len(result.Services)+1),
			Name:           "api_fastapi",
			DisplayName:    "FastAPI Server",
			Category:       CategoryBackend,
			IsCustomBuild:  true,
			BuildContext:   "./" + filepath.ToSlash(relFolder),
			DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
			DockerfileType: "python-fastapi",
			Ports:          []PortMapping{{ID: "p1", HostPort: 8000, ContainerPort: 8000, Protocol: "tcp"}},
			Expose:         []int{8000},
			Networks:       []string{"app-network"},
			Env:            []EnvVariable{{ID: "e1", Key: "ENVIRONMENT", Value: "production"}, {ID: "e2", Key: "PORT", Value: "8000"}},
			Volumes:        []VolumeMapping{},
			DependsOn:      []Dependency{},
			Restart:        "unless-stopped",
		})
	}
}

func scanPHPManifest(filePath, rootPath string, result *ScanResult, dbMap map[string]bool) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}

	var comp ComposerJSON
	_ = json.Unmarshal(data, &comp)

	dir := filepath.Dir(filePath)
	relFolder, _ := filepath.Rel(rootPath, dir)
	if relFolder == "." {
		relFolder = "backend"
	}

	dbMap["postgres"] = true
	dbMap["redis"] = true

	result.Services = append(result.Services, DockerService{
		ID:             fmt.Sprintf("svc_laravel_%d", len(result.Services)+1),
		Name:           "api_laravel",
		DisplayName:    "Laravel 11 API",
		Category:       CategoryBackend,
		IsCustomBuild:  true,
		BuildContext:   "./" + filepath.ToSlash(relFolder),
		DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
		DockerfileType: "laravel",
		Ports:          []PortMapping{{ID: "p1", HostPort: 9000, ContainerPort: 9000, Protocol: "tcp"}},
		Expose:         []int{9000},
		Networks:       []string{"app-network"},
		Env:            []EnvVariable{{ID: "e1", Key: "APP_ENV", Value: "production"}, {ID: "e2", Key: "DB_CONNECTION", Value: "pgsql"}},
		Volumes:        []VolumeMapping{},
		DependsOn:      []Dependency{},
		Restart:        "unless-stopped",
	})
}

func scanJavaManifest(filePath, rootPath string, result *ScanResult, dbMap map[string]bool) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	content := strings.ToLower(string(data))

	dir := filepath.Dir(filePath)
	relFolder, _ := filepath.Rel(rootPath, dir)
	if relFolder == "." {
		relFolder = "backend"
	}

	if strings.Contains(content, "postgres") {
		dbMap["postgres"] = true
	}
	if strings.Contains(content, "mysql") {
		dbMap["mysql"] = true
	}
	if strings.Contains(content, "redis") {
		dbMap["redis"] = true
	}

	result.Services = append(result.Services, DockerService{
		ID:             fmt.Sprintf("svc_spring_%d", len(result.Services)+1),
		Name:           "api_spring",
		DisplayName:    "Spring Boot 3",
		Category:       CategoryBackend,
		IsCustomBuild:  true,
		BuildContext:   "./" + filepath.ToSlash(relFolder),
		DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
		DockerfileType: "springboot",
		Ports:          []PortMapping{{ID: "p1", HostPort: 8080, ContainerPort: 8080, Protocol: "tcp"}},
		Expose:         []int{8080},
		Networks:       []string{"app-network"},
		Env:            []EnvVariable{{ID: "e1", Key: "SPRING_PROFILES_ACTIVE", Value: "prod"}},
		Volumes:        []VolumeMapping{},
		DependsOn:      []Dependency{},
		Restart:        "unless-stopped",
	})
}

func scanGoManifest(filePath, rootPath string, result *ScanResult, dbMap map[string]bool) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	content := string(data)

	dir := filepath.Dir(filePath)
	relFolder, _ := filepath.Rel(rootPath, dir)
	if relFolder == "." {
		relFolder = "backend"
	}

	if strings.Contains(content, "postgres") || strings.Contains(content, "pgx") {
		dbMap["postgres"] = true
	}
	if strings.Contains(content, "mysql") {
		dbMap["mysql"] = true
	}
	if strings.Contains(content, "redis") {
		dbMap["redis"] = true
	}

	result.Services = append(result.Services, DockerService{
		ID:             fmt.Sprintf("svc_go_%d", len(result.Services)+1),
		Name:           "api_go",
		DisplayName:    "Go REST Microservice",
		Category:       CategoryBackend,
		IsCustomBuild:  true,
		BuildContext:   "./" + filepath.ToSlash(relFolder),
		DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
		DockerfileType: "go",
		Ports:          []PortMapping{{ID: "p1", HostPort: 8080, ContainerPort: 8080, Protocol: "tcp"}},
		Expose:         []int{8080},
		Networks:       []string{"app-network"},
		Env:            []EnvVariable{{ID: "e1", Key: "PORT", Value: "8080"}},
		Volumes:        []VolumeMapping{},
		DependsOn:      []Dependency{},
		Restart:        "unless-stopped",
	})
}

func scanRustManifest(filePath, rootPath string, result *ScanResult, dbMap map[string]bool) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	content := string(data)

	dir := filepath.Dir(filePath)
	relFolder, _ := filepath.Rel(rootPath, dir)
	if relFolder == "." {
		relFolder = "backend"
	}

	if strings.Contains(content, "postgres") || strings.Contains(content, "sqlx") {
		dbMap["postgres"] = true
	}
	if strings.Contains(content, "redis") {
		dbMap["redis"] = true
	}

	result.Services = append(result.Services, DockerService{
		ID:             fmt.Sprintf("svc_rust_%d", len(result.Services)+1),
		Name:           "api_rust",
		DisplayName:    "Rust Axum API",
		Category:       CategoryBackend,
		IsCustomBuild:  true,
		BuildContext:   "./" + filepath.ToSlash(relFolder),
		DockerfilePath: "./" + filepath.ToSlash(relFolder) + "/Dockerfile",
		DockerfileType: "rust",
		Ports:          []PortMapping{{ID: "p1", HostPort: 3001, ContainerPort: 3001, Protocol: "tcp"}},
		Expose:         []int{3001},
		Networks:       []string{"app-network"},
		Env:            []EnvVariable{{ID: "e1", Key: "SERVER_PORT", Value: "3001"}},
		Volumes:        []VolumeMapping{},
		DependsOn:      []Dependency{},
		Restart:        "unless-stopped",
	})
}

func scanPrismaSchema(filePath string, dbMap map[string]bool) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	content := strings.ToLower(string(data))
	if strings.Contains(content, `"postgresql"`) {
		dbMap["postgres"] = true
	} else if strings.Contains(content, `"mysql"`) {
		dbMap["mysql"] = true
	} else if strings.Contains(content, `"mongodb"`) {
		dbMap["mongodb"] = true
	}
}

// -------------------------------------------------------------
// Database Injection & Service Auto-Wiring
// -------------------------------------------------------------

func addDatabaseServiceIfMissing(dbType string, result *ScanResult) {
	switch dbType {
	case "postgres":
		result.Services = append(result.Services, DockerService{
			ID:          "svc_postgres",
			Name:        "db_postgres",
			DisplayName: "PostgreSQL",
			Category:    CategoryDatabase,
			Image:       "postgres",
			Tag:         "16-alpine",
			Icon:        "Database",
			Color:       "#336791",
			Description: "Relational database system",
			Ports:       []PortMapping{{ID: "p_db", HostPort: 5432, ContainerPort: 5432, Protocol: "tcp"}},
			Expose:      []int{5432},
			Networks:    []string{"app-network"},
			Env: []EnvVariable{
				{ID: "e1", Key: "POSTGRES_DB", Value: "app_db"},
				{ID: "e2", Key: "POSTGRES_USER", Value: "postgres"},
				{ID: "e3", Key: "POSTGRES_PASSWORD", Value: "postgres_secure_pass_123", IsSecret: true},
			},
			Volumes: []VolumeMapping{
				{ID: "v1", HostPath: "postgres_data", ContainerPath: "/var/lib/postgresql/data", Type: "volume"},
			},
			DependsOn: []Dependency{},
			Restart:   "unless-stopped",
		})

	case "redis":
		result.Services = append(result.Services, DockerService{
			ID:          "svc_redis",
			Name:        "cache_redis",
			DisplayName: "Redis",
			Category:    CategoryQueue,
			Image:       "redis",
			Tag:         "7.2-alpine",
			Icon:        "Radio",
			Color:       "#DC382D",
			Description: "In-memory caching and message store",
			Ports:       []PortMapping{{ID: "p_redis", HostPort: 6379, ContainerPort: 6379, Protocol: "tcp"}},
			Expose:      []int{6379},
			Networks:    []string{"app-network"},
			Env:         []EnvVariable{},
			Volumes: []VolumeMapping{
				{ID: "v1", HostPath: "redis_data", ContainerPath: "/data", Type: "volume"},
			},
			DependsOn: []Dependency{},
			Restart:   "unless-stopped",
		})

	case "mongodb":
		result.Services = append(result.Services, DockerService{
			ID:          "svc_mongo",
			Name:        "db_mongo",
			DisplayName: "MongoDB",
			Category:    CategoryDatabase,
			Image:       "mongo",
			Tag:         "7.0",
			Icon:        "Leaf",
			Color:       "#13AA52",
			Ports:       []PortMapping{{ID: "p_mongo", HostPort: 27017, ContainerPort: 27017, Protocol: "tcp"}},
			Expose:      []int{27017},
			Networks:    []string{"app-network"},
			Env: []EnvVariable{
				{ID: "e1", Key: "MONGO_INITDB_ROOT_USERNAME", Value: "admin"},
				{ID: "e2", Key: "MONGO_INITDB_ROOT_PASSWORD", Value: "admin_secret_pass", IsSecret: true},
			},
			Volumes: []VolumeMapping{
				{ID: "v1", HostPath: "mongo_data", ContainerPath: "/data/db", Type: "volume"},
			},
			DependsOn: []Dependency{},
			Restart:   "unless-stopped",
		})

	case "mysql":
		result.Services = append(result.Services, DockerService{
			ID:          "svc_mysql",
			Name:        "db_mysql",
			DisplayName: "MySQL",
			Category:    CategoryDatabase,
			Image:       "mysql",
			Tag:         "8.4",
			Icon:        "Database",
			Color:       "#00758F",
			Ports:       []PortMapping{{ID: "p_mysql", HostPort: 3306, ContainerPort: 3306, Protocol: "tcp"}},
			Expose:      []int{3306},
			Networks:    []string{"app-network"},
			Env: []EnvVariable{
				{ID: "e1", Key: "MYSQL_DATABASE", Value: "app_db"},
				{ID: "e2", Key: "MYSQL_USER", Value: "app_user"},
				{ID: "e3", Key: "MYSQL_PASSWORD", Value: "app_pass_secret", IsSecret: true},
			},
			Volumes: []VolumeMapping{
				{ID: "v1", HostPath: "mysql_data", ContainerPath: "/var/lib/mysql", Type: "volume"},
			},
			DependsOn: []Dependency{},
			Restart:   "unless-stopped",
		})
	}
}

func wireScannedServices(result *ScanResult) {
	var backends []*DockerService
	var frontends []*DockerService
	var databases []*DockerService

	for i := range result.Services {
		s := &result.Services[i]
		if s.Category == CategoryBackend {
			backends = append(backends, s)
		} else if s.Category == CategoryFrontend {
			frontends = append(frontends, s)
		} else if s.Category == CategoryDatabase || s.Category == CategoryQueue {
			databases = append(databases, s)
		}
	}

	// Connect Backends -> Databases
	for _, b := range backends {
		for _, db := range databases {
			b.DependsOn = append(b.DependsOn, Dependency{ServiceID: db.ID, Condition: "service_started"})
			if db.Name == "db_postgres" {
				b.Env = append(b.Env, EnvVariable{
					ID:            fmt.Sprintf("e_db_%s", db.ID),
					Key:           "DATABASE_URL",
					Value:         fmt.Sprintf("postgresql://postgres:postgres_secure_pass_123@%s:5432/app_db", db.Name),
					AutoGenerated: true,
				})
			} else if db.Name == "cache_redis" {
				b.Env = append(b.Env, EnvVariable{
					ID:            fmt.Sprintf("e_redis_%s", db.ID),
					Key:           "REDIS_URL",
					Value:         fmt.Sprintf("redis://%s:6379", db.Name),
					AutoGenerated: true,
				})
			}
		}
	}

	// Connect Frontends -> Backends
	for _, f := range frontends {
		for _, b := range backends {
			f.DependsOn = append(f.DependsOn, Dependency{ServiceID: b.ID, Condition: "service_started"})
			port := 8000
			if len(b.Ports) > 0 {
				if p, ok := b.Ports[0].HostPort.(int); ok {
					port = p
				} else if p, ok := b.Ports[0].HostPort.(float64); ok {
					port = int(p)
				}
			}
			f.Env = append(f.Env, EnvVariable{
				ID:            fmt.Sprintf("e_api_%s", b.ID),
				Key:           "NEXT_PUBLIC_API_URL",
				Value:         fmt.Sprintf("http://%s:%d", b.Name, port),
				AutoGenerated: true,
			})
		}
	}
}
