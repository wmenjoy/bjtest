package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"test-management-service/internal/config"
	"test-management-service/internal/handler"
	"test-management-service/internal/middleware"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
	"test-management-service/internal/service"
	"test-management-service/internal/testcase"
	"test-management-service/internal/websocket"
	"test-management-service/internal/workflow"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// Load configuration
	configPath := os.Getenv("CONFIG_FILE")
	if configPath == "" {
		configPath = "config.toml"
	}

	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := initDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Auto migrate models
	// Note: ActionTemplate is managed by manual migrations (005_add_action_templates.sql)
	// TestCase extensions are managed by manual migrations (006_extend_test_cases.sql)
	if err := db.AutoMigrate(
		&models.Tenant{},
		&models.Project{},
		&models.TenantMember{},
		&models.ProjectMember{},
		&models.TestGroup{},
		&models.TestCase{},
		&models.TestResult{},
		&models.TestRun{},
		&models.Environment{},
		&models.EnvironmentVariable{},
		&models.Workflow{},
		&models.WorkflowRun{},
		&models.WorkflowStepExecution{},
		&models.WorkflowStepLog{},
		&models.WorkflowVariableChange{},
		&models.User{},
		&models.Role{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize repositories
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	caseRepo := repository.NewTestCaseRepository(db)
	groupRepo := repository.NewTestGroupRepository(db)
	resultRepo := repository.NewTestResultRepository(db)
	runRepo := repository.NewTestRunRepository(db)
	envRepo := repository.NewEnvironmentRepository(db)
	envVarRepo := repository.NewEnvironmentVariableRepository(db)
	workflowRepo := repository.NewWorkflowRepository(db)
	workflowRunRepo := repository.NewWorkflowRunRepository(db)
	stepExecRepo := repository.NewStepExecutionRepository(db)
	stepLogRepo := repository.NewStepLogRepository(db)
	actionTemplateRepo := repository.NewActionTemplateRepository(db)
	roleRepo := repository.NewRoleRepository(db)

	// Initialize environment service and variable injector
	envService := service.NewEnvironmentService(envRepo, envVarRepo)
	variableInjector := service.NewVariableInjector(envService)

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize unified test executor (for workflow HTTP/Command steps)
	unifiedExecutor := testcase.NewExecutorWithInjector(cfg.Test.TargetHost, nil, caseRepo, nil, variableInjector)

	// Initialize workflow executor with unified executor
	workflowExecutor := workflow.NewWorkflowExecutor(db, caseRepo, workflowRepo, unifiedExecutor, hub, variableInjector, actionTemplateRepo)

	// Initialize executor with variable injection (for test service)
	executor := testcase.NewExecutorWithInjector(cfg.Test.TargetHost, nil, caseRepo, nil, variableInjector)

	// Initialize services
	tenantService := service.NewTenantService(tenantRepo)
	projectService := service.NewProjectService(projectRepo, tenantRepo)
	testService := service.NewTestService(caseRepo, groupRepo, resultRepo, runRepo, executor)

	// Initialize workflow test case repository for advanced features (statistics, flaky detection)
	workflowCaseRepo := repository.NewWorkflowTestCaseRepository(db)
	// Type assert to access SetWorkflowCaseRepo method
	if ts, ok := testService.(interface{ SetWorkflowCaseRepo(*repository.WorkflowTestCaseRepository) }); ok {
		ts.SetWorkflowCaseRepo(workflowCaseRepo)
	}

	workflowService := service.NewWorkflowService(workflowRepo, workflowRunRepo, stepExecRepo, stepLogRepo, nil, workflowExecutor)
	actionTemplateService := service.NewActionTemplateService(actionTemplateRepo)

	// Initialize TenantContext middleware for multi-tenancy support
	tenantContext := middleware.NewTenantContext(tenantRepo, projectRepo)

	// Initialize handlers
	tenantHandler := handler.NewTenantHandler(tenantService, projectService)
	projectHandler := handler.NewProjectHandler(projectService)
	testHandler := handler.NewTestHandler(testService)
	envHandler := handler.NewEnvironmentHandler(envService)
	workflowHandler := handler.NewWorkflowHandler(workflowService)
	wsHandler := handler.NewWebSocketHandler(hub)
	userService := service.NewUserService(roleRepo)
	userHandler := handler.NewUserHandler(userService)
	actionTemplateHandler := handler.NewActionTemplateHandler(actionTemplateService)

	// Setup Gin router
	r := gin.Default()

	// Enable CORS
	r.Use(corsMiddleware())

	// Public routes (no tenant isolation required)
	tenantHandler.RegisterRoutes(r)
	projectHandler.RegisterRoutes(r)

	// User and role routes (v2 API)
	v2 := r.Group("/api/v2")
	{
		v2.GET("/users", userHandler.ListUsers)
		v2.GET("/users/current", userHandler.GetCurrentUser)
		v2.GET("/roles", userHandler.ListRoles)
	}

	// API routes with multi-tenant isolation
	api := r.Group("/api")
	api.Use(tenantContext.ValidateTenantAndProject())
	{
		// TODO: Update handlers to use tenant-aware methods
		testHandler.RegisterRoutes(api)
		envHandler.RegisterRoutes(api)
		workflowHandler.RegisterRoutes(api)
		wsHandler.RegisterRoutes(api)
		actionTemplateHandler.RegisterRoutes(api)
	}

	// Serve static files (Web UI)
	r.Static("/web", "./web")
	r.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/web/app.html")
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "test-management-service",
		})
	})

	// Start server
	addr := cfg.Server.GetAddr()
	log.Printf("Starting test management service on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func initDatabase(cfg *config.Config) (*gorm.DB, error) {
	switch cfg.Database.Type {
	case "sqlite":
		// Ensure data directory exists
		dbPath := cfg.Database.DSN
		dbDir := filepath.Dir(dbPath)
		if err := os.MkdirAll(dbDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create data directory: %w", err)
		}

		db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
		if err != nil {
			return nil, fmt.Errorf("failed to open sqlite database: %w", err)
		}
		return db, nil

	default:
		return nil, fmt.Errorf("unsupported database type: %s", cfg.Database.Type)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
