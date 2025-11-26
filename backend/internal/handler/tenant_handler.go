package handler

import (
	"net/http"

	"test-management-service/internal/service"

	"github.com/gin-gonic/gin"
)

// TenantHandler handles HTTP requests for tenant management
type TenantHandler struct {
	tenantService  service.TenantService
	projectService service.ProjectService
}

// NewTenantHandler creates a new tenant handler
func NewTenantHandler(tenantService service.TenantService, projectService service.ProjectService) *TenantHandler {
	return &TenantHandler{
		tenantService:  tenantService,
		projectService: projectService,
	}
}

// RegisterRoutes registers all tenant-related routes
func (h *TenantHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v2/tenants")
	{
		// Tenant CRUD operations
		api.POST("", h.CreateTenant)
		api.GET("", h.ListTenants)
		api.GET("/active", h.ListActiveTenants)
		api.GET("/:tenantId", h.GetTenant)
		api.PUT("/:tenantId", h.UpdateTenant)
		api.DELETE("/:tenantId", h.DeleteTenant)

		// Tenant management operations
		api.POST("/:tenantId/suspend", h.SuspendTenant)
		api.POST("/:tenantId/activate", h.ActivateTenant)

		// Tenant associations
		api.GET("/:tenantId/projects", h.ListTenantProjects)
		api.GET("/:tenantId/projects/active", h.ListActiveTenantProjects)
		api.GET("/:tenantId/members", h.GetTenantWithMembers)
	}
}

// ===== Tenant Handlers =====

// CreateTenant creates a new tenant
// POST /api/v2/tenants
func (h *TenantHandler) CreateTenant(c *gin.Context) {
	var req service.CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenant, err := h.tenantService.CreateTenant(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tenant)
}

// ListTenants lists all tenants
// GET /api/v2/tenants
func (h *TenantHandler) ListTenants(c *gin.Context) {
	tenants, err := h.tenantService.ListTenants()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  tenants,
		"total": len(tenants),
	})
}

// ListActiveTenants lists all active tenants
// GET /api/v2/tenants/active
func (h *TenantHandler) ListActiveTenants(c *gin.Context) {
	tenants, err := h.tenantService.ListActiveTenants()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  tenants,
		"total": len(tenants),
	})
}

// GetTenant retrieves a specific tenant by ID
// GET /api/v2/tenants/:tenantId
func (h *TenantHandler) GetTenant(c *gin.Context) {
	tenantID := c.Param("tenantId")

	tenant, err := h.tenantService.GetTenant(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if tenant == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

// UpdateTenant updates an existing tenant
// PUT /api/v2/tenants/:tenantId
func (h *TenantHandler) UpdateTenant(c *gin.Context) {
	tenantID := c.Param("tenantId")

	var req service.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenant, err := h.tenantService.UpdateTenant(tenantID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

// DeleteTenant deletes a tenant (soft delete)
// DELETE /api/v2/tenants/:tenantId
func (h *TenantHandler) DeleteTenant(c *gin.Context) {
	tenantID := c.Param("tenantId")

	if err := h.tenantService.DeleteTenant(tenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "tenant deleted successfully"})
}

// SuspendTenant suspends a tenant
// POST /api/v2/tenants/:tenantId/suspend
func (h *TenantHandler) SuspendTenant(c *gin.Context) {
	tenantID := c.Param("tenantId")

	if err := h.tenantService.SuspendTenant(tenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "tenant suspended successfully"})
}

// ActivateTenant activates a tenant
// POST /api/v2/tenants/:tenantId/activate
func (h *TenantHandler) ActivateTenant(c *gin.Context) {
	tenantID := c.Param("tenantId")

	if err := h.tenantService.ActivateTenant(tenantID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "tenant activated successfully"})
}

// GetTenantWithProjects retrieves a tenant with all its projects
// GET /api/v2/tenants/:tenantId/projects
func (h *TenantHandler) GetTenantWithProjects(c *gin.Context) {
	tenantID := c.Param("tenantId")

	tenant, err := h.tenantService.GetTenantWithProjects(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if tenant == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

// GetTenantWithMembers retrieves a tenant with all its members
// GET /api/v2/tenants/:tenantId/members
func (h *TenantHandler) GetTenantWithMembers(c *gin.Context) {
	tenantID := c.Param("tenantId")

	tenant, err := h.tenantService.GetTenantWithMembers(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if tenant == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

// ListTenantProjects lists all projects for a specific tenant
// GET /api/v2/tenants/:tenantId/projects
func (h *TenantHandler) ListTenantProjects(c *gin.Context) {
	tenantID := c.Param("tenantId")

	projects, err := h.projectService.ListProjects(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  projects,
		"total": len(projects),
	})
}

// ListActiveTenantProjects lists all active projects for a specific tenant
// GET /api/v2/tenants/:tenantId/projects/active
func (h *TenantHandler) ListActiveTenantProjects(c *gin.Context) {
	tenantID := c.Param("tenantId")

	projects, err := h.projectService.ListActiveProjects(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  projects,
		"total": len(projects),
	})
}
