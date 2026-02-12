package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"test-management-service/internal/handler"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
	"test-management-service/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestTenantProjectAPI_FullFlow(t *testing.T) {
	db, router := setupTenantProjectTestEnvironment(t)
	defer cleanupTestEnvironment(db)

	// Step 1: Create tenant
	t.Run("CreateTenant", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"tenantId":    "tenant-001",
			"name":        "Acme Corp",
			"displayName": "Acme Corp",
		})
		req, _ := http.NewRequest("POST", "/api/v2/tenants", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, "tenant-001", resp["tenantId"])
	})

	// Step 2: List tenants
	t.Run("ListTenants", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v2/tenants", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, float64(1), resp["total"])
	})

	// Step 3: Get tenant
	t.Run("GetTenant", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v2/tenants/tenant-001", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, "tenant-001", resp["tenantId"])
	})

	// Step 4: Update tenant
	t.Run("UpdateTenant", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"name": "Acme Corp Updated",
		})
		req, _ := http.NewRequest("PUT", "/api/v2/tenants/tenant-001", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, "Acme Corp Updated", resp["name"])
	})

	// Step 5: Suspend tenant and verify active list
	t.Run("SuspendTenant", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/v2/tenants/tenant-001/suspend", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		req, _ = http.NewRequest("GET", "/api/v2/tenants/active", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, float64(0), resp["total"])
	})

	// Step 6: Activate tenant and verify active list
	t.Run("ActivateTenant", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/v2/tenants/tenant-001/activate", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		req, _ = http.NewRequest("GET", "/api/v2/tenants/active", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, float64(1), resp["total"])
	})

	// Step 7: Create project
	t.Run("CreateProject", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"projectId": "project-001",
			"tenantId":  "tenant-001",
			"name":      "API Testing",
		})
		req, _ := http.NewRequest("POST", "/api/v2/projects", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, "project-001", resp["projectId"])
	})

	// Step 8: List projects (all + tenant scoped)
	t.Run("ListProjects", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/v2/projects", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, float64(1), resp["total"])

		req, _ = http.NewRequest("GET", "/api/v2/tenants/tenant-001/projects", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, float64(1), resp["total"])
	})

	// Step 9: Archive project and verify active list
	t.Run("ArchiveProject", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/v2/projects/project-001/archive", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		req, _ = http.NewRequest("GET", "/api/v2/tenants/tenant-001/projects/active", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, float64(0), resp["total"])
	})

	// Step 10: Activate project and verify active list
	t.Run("ActivateProject", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/v2/projects/project-001/activate", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		req, _ = http.NewRequest("GET", "/api/v2/tenants/tenant-001/projects/active", nil)
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.Equal(t, float64(1), resp["total"])
	})
}

func setupTenantProjectTestEnvironment(t *testing.T) (*gorm.DB, *gin.Engine) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}

	err = db.AutoMigrate(
		&models.Tenant{},
		&models.Project{},
		&models.TenantMember{},
		&models.ProjectMember{},
	)
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)

	tenantService := service.NewTenantService(tenantRepo)
	projectService := service.NewProjectService(projectRepo, tenantRepo)

	tenantHandler := handler.NewTenantHandler(tenantService, projectService)
	projectHandler := handler.NewProjectHandler(projectService)

	gin.SetMode(gin.TestMode)
	router := gin.New()

	tenantHandler.RegisterRoutes(router)
	projectHandler.RegisterRoutes(router)

	return db, router
}
