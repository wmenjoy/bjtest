package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"test-management-service/internal/models"
	"test-management-service/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&models.Tenant{}, &models.Project{})
	require.NoError(t, err)

	// Create default tenant
	defaultTenant := &models.Tenant{
		TenantID:     "default",
		Name:         "Default Tenant",
		DisplayName:  "Default Tenant",
		Status:       models.TenantStatusActive,
		MaxProjects:  10,
		MaxUsers:     50,
		MaxTestCases: 1000,
	}
	err = db.Create(defaultTenant).Error
	require.NoError(t, err)

	// Create default project
	defaultProject := &models.Project{
		ProjectID:   "default",
		TenantID:    "default",
		Name:        "Default Project",
		DisplayName: "Default Project",
		Status:      models.ProjectStatusActive,
	}
	err = db.Create(defaultProject).Error
	require.NoError(t, err)

	// Create test tenant
	testTenant := &models.Tenant{
		TenantID:     "test-tenant",
		Name:         "Test Tenant",
		DisplayName:  "Test Tenant",
		Status:       models.TenantStatusActive,
		MaxProjects:  20,
		MaxUsers:     100,
		MaxTestCases: 5000,
	}
	err = db.Create(testTenant).Error
	require.NoError(t, err)

	// Create test project
	testProject := &models.Project{
		ProjectID:   "test-project",
		TenantID:    "test-tenant",
		Name:        "Test Project",
		DisplayName: "Test Project",
		Status:      models.ProjectStatusActive,
	}
	err = db.Create(testProject).Error
	require.NoError(t, err)

	// Create inactive tenant
	inactiveTenant := &models.Tenant{
		TenantID:     "inactive-tenant",
		Name:         "Inactive Tenant",
		DisplayName:  "Inactive Tenant",
		Status:       models.TenantStatusSuspended,
		MaxProjects:  10,
		MaxUsers:     50,
		MaxTestCases: 1000,
	}
	err = db.Create(inactiveTenant).Error
	require.NoError(t, err)

	return db
}

func TestValidateTenantAndProject_Success(t *testing.T) {
	db := setupTestDB(t)
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	middleware := NewTenantContext(tenantRepo, projectRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ValidateTenantAndProject())
	router.GET("/test", func(c *gin.Context) {
		tenantID := GetTenantID(c)
		projectID := GetProjectID(c)
		c.JSON(http.StatusOK, gin.H{
			"tenant_id":  tenantID,
			"project_id": projectID,
		})
	})

	// Test with headers
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Tenant-ID", "test-tenant")
	req.Header.Set("X-Project-ID", "test-project")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "test-tenant")
	assert.Contains(t, w.Body.String(), "test-project")
}

func TestValidateTenantAndProject_DefaultValues(t *testing.T) {
	db := setupTestDB(t)
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	middleware := NewTenantContext(tenantRepo, projectRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ValidateTenantAndProject())
	router.GET("/test", func(c *gin.Context) {
		tenantID := GetTenantID(c)
		projectID := GetProjectID(c)
		c.JSON(http.StatusOK, gin.H{
			"tenant_id":  tenantID,
			"project_id": projectID,
		})
	})

	// Test without headers (should use defaults)
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "default")
}

func TestValidateTenantAndProject_TenantNotFound(t *testing.T) {
	db := setupTestDB(t)
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	middleware := NewTenantContext(tenantRepo, projectRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ValidateTenantAndProject())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Tenant-ID", "non-existent")
	req.Header.Set("X-Project-ID", "default")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "tenant not found")
	assert.Contains(t, w.Body.String(), "TENANT_NOT_FOUND")
}

func TestValidateTenantAndProject_ProjectNotFound(t *testing.T) {
	db := setupTestDB(t)
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	middleware := NewTenantContext(tenantRepo, projectRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ValidateTenantAndProject())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Tenant-ID", "test-tenant")
	req.Header.Set("X-Project-ID", "non-existent")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "project not found")
	assert.Contains(t, w.Body.String(), "PROJECT_NOT_FOUND")
}

func TestValidateTenantAndProject_ProjectTenantMismatch(t *testing.T) {
	db := setupTestDB(t)
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	middleware := NewTenantContext(tenantRepo, projectRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ValidateTenantAndProject())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Try to access test-project with default tenant
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Tenant-ID", "default")
	req.Header.Set("X-Project-ID", "test-project") // Belongs to test-tenant
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "project does not belong to tenant")
	assert.Contains(t, w.Body.String(), "PROJECT_TENANT_MISMATCH")
}

func TestValidateTenantAndProject_InactiveTenant(t *testing.T) {
	db := setupTestDB(t)
	tenantRepo := repository.NewTenantRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	middleware := NewTenantContext(tenantRepo, projectRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ValidateTenantAndProject())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Tenant-ID", "inactive-tenant")
	req.Header.Set("X-Project-ID", "default")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "tenant is not active")
	assert.Contains(t, w.Body.String(), "TENANT_INACTIVE")
}

func TestGetTenantID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	// Test without context
	assert.Equal(t, "default", GetTenantID(c))

	// Test with context
	c.Set(TenantIDKey, "test-tenant")
	assert.Equal(t, "test-tenant", GetTenantID(c))
}

func TestGetProjectID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	// Test without context
	assert.Equal(t, "default", GetProjectID(c))

	// Test with context
	c.Set(ProjectIDKey, "test-project")
	assert.Equal(t, "test-project", GetProjectID(c))
}

func TestRequireTenant(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(RequireTenant())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Test without tenant
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "tenant ID is required")
}

func TestRequireProject(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(RequireProject())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Test without project
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "project ID is required")
}
