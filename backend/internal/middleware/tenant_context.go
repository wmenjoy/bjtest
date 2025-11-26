package middleware

import (
	"net/http"

	"test-management-service/internal/models"
	"test-management-service/internal/repository"

	"github.com/gin-gonic/gin"
)

// TenantContext provides middleware for tenant and project context management
type TenantContext struct {
	tenantRepo  repository.TenantRepository
	projectRepo repository.ProjectRepository
}

// NewTenantContext creates a new tenant context middleware
func NewTenantContext(tenantRepo repository.TenantRepository, projectRepo repository.ProjectRepository) *TenantContext {
	return &TenantContext{
		tenantRepo:  tenantRepo,
		projectRepo: projectRepo,
	}
}

// Context keys for tenant and project
const (
	TenantIDKey  = "tenant_id"
	ProjectIDKey = "project_id"
	TenantKey    = "tenant"
	ProjectKey   = "project"
)

// ValidateTenantAndProject validates tenant and project from headers or query parameters
func (tc *TenantContext) ValidateTenantAndProject() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract tenant ID from header or query parameter
		tenantID := c.GetHeader("X-Tenant-ID")
		if tenantID == "" {
			tenantID = c.Query("tenant_id")
		}
		if tenantID == "" {
			tenantID = "default" // Use default tenant if not specified
		}

		// Extract project ID from header or query parameter
		projectID := c.GetHeader("X-Project-ID")
		if projectID == "" {
			projectID = c.Query("project_id")
		}
		if projectID == "" {
			projectID = "default" // Use default project if not specified
		}

		// Validate tenant exists and is active
		tenant, err := tc.tenantRepo.FindByID(tenantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to query tenant",
				"code":  "TENANT_QUERY_ERROR",
			})
			c.Abort()
			return
		}
		if tenant == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "tenant not found",
				"code":  "TENANT_NOT_FOUND",
			})
			c.Abort()
			return
		}

		if tenant.Status != models.TenantStatusActive {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "tenant is not active",
				"code":  "TENANT_INACTIVE",
			})
			c.Abort()
			return
		}

		// Validate project exists and belongs to tenant
		project, err := tc.projectRepo.FindByID(projectID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to query project",
				"code":  "PROJECT_QUERY_ERROR",
			})
			c.Abort()
			return
		}
		if project == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "project not found",
				"code":  "PROJECT_NOT_FOUND",
			})
			c.Abort()
			return
		}

		if project.TenantID != tenantID {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "project does not belong to tenant",
				"code":  "PROJECT_TENANT_MISMATCH",
			})
			c.Abort()
			return
		}

		if project.Status != models.ProjectStatusActive {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "project is not active",
				"code":  "PROJECT_INACTIVE",
			})
			c.Abort()
			return
		}

		// Set tenant and project context
		c.Set(TenantIDKey, tenantID)
		c.Set(ProjectIDKey, projectID)
		c.Set(TenantKey, tenant)
		c.Set(ProjectKey, project)

		c.Next()
	}
}

// GetTenantID retrieves tenant ID from context
func GetTenantID(c *gin.Context) string {
	tenantID, exists := c.Get(TenantIDKey)
	if !exists {
		return "default"
	}
	return tenantID.(string)
}

// GetProjectID retrieves project ID from context
func GetProjectID(c *gin.Context) string {
	projectID, exists := c.Get(ProjectIDKey)
	if !exists {
		return "default"
	}
	return projectID.(string)
}

// GetTenant retrieves tenant from context
func GetTenant(c *gin.Context) *models.Tenant {
	tenant, exists := c.Get(TenantKey)
	if !exists {
		return nil
	}
	return tenant.(*models.Tenant)
}

// GetProject retrieves project from context
func GetProject(c *gin.Context) *models.Project {
	project, exists := c.Get(ProjectKey)
	if !exists {
		return nil
	}
	return project.(*models.Project)
}

// RequireTenant middleware ensures tenant context is present
func RequireTenant() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get(TenantIDKey)
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "tenant ID is required",
				"code":  "TENANT_REQUIRED",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequireProject middleware ensures project context is present
func RequireProject() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get(ProjectIDKey)
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "project ID is required",
				"code":  "PROJECT_REQUIRED",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
