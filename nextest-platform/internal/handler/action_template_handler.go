package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"test-management-service/internal/middleware"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
	"test-management-service/internal/service"
)

type ActionTemplateHandler struct {
	service service.ActionTemplateService
}

func NewActionTemplateHandler(service service.ActionTemplateService) *ActionTemplateHandler {
	return &ActionTemplateHandler{
		service: service,
	}
}

// RegisterRoutes registers action template routes
func (h *ActionTemplateHandler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/action-templates", h.Create)
	rg.GET("/action-templates/:id", h.GetByID)
	rg.GET("/action-templates", h.List)
	rg.GET("/action-templates/accessible", h.GetAccessibleTemplates)
	rg.PUT("/action-templates/:id", h.Update)
	rg.DELETE("/action-templates/:id", h.Delete)
	rg.POST("/action-templates/:templateId/copy", h.CopyToTenant)
	rg.POST("/action-templates/:templateId/usage", h.RecordUsage)
}

// Create creates a new action template
// POST /api/v2/action-templates
func (h *ActionTemplateHandler) Create(c *gin.Context) {
	var template models.ActionTemplate

	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Get tenant_id from context (set by auth middleware)
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found in context"})
		return
	}
	template.TenantID = tenantID

	if err := h.service.Create(c.Request.Context(), &template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, template)
}

// GetByID retrieves an action template by ID
// GET /api/v2/action-templates/:id
func (h *ActionTemplateHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	template, err := h.service.GetByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, template)
}

// List retrieves action templates with filtering
// GET /api/v2/action-templates?category=Network&type=http&scope=system&page=1&pageSize=20
func (h *ActionTemplateHandler) List(c *gin.Context) {
	filter := repository.ActionTemplateFilter{
		Category: c.Query("category"),
		Type:     c.Query("type"),
		Scope:    c.Query("scope"),
		Search:   c.Query("search"),
		Page:     1,
		PageSize: 20,
	}

	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			filter.Page = page
		}
	}

	if pageSizeStr := c.Query("pageSize"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil {
			filter.PageSize = pageSize
		}
	}

	if isPublicStr := c.Query("isPublic"); isPublicStr != "" {
		isPublic := isPublicStr == "true"
		filter.IsPublic = &isPublic
	}

	// Parse tags (comma-separated)
	if tagsStr := c.Query("tags"); tagsStr != "" {
		filter.Tags = strings.Split(tagsStr, ",")
	}

	templates, total, err := h.service.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list templates", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":     templates,
		"total":    total,
		"page":     filter.Page,
		"pageSize": filter.PageSize,
	})
}

// GetAccessibleTemplates retrieves templates accessible to current tenant
// GET /api/v2/action-templates/accessible?category=Network&page=1
func (h *ActionTemplateHandler) GetAccessibleTemplates(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found in context"})
		return
	}

	filter := repository.ActionTemplateFilter{
		Category: c.Query("category"),
		Type:     c.Query("type"),
		Search:   c.Query("search"),
		Page:     1,
		PageSize: 20,
	}

	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			filter.Page = page
		}
	}

	if pageSizeStr := c.Query("pageSize"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil {
			filter.PageSize = pageSize
		}
	}

	// Parse tags (comma-separated)
	if tagsStr := c.Query("tags"); tagsStr != "" {
		filter.Tags = strings.Split(tagsStr, ",")
	}

	templates, total, err := h.service.GetAccessibleTemplates(c.Request.Context(), tenantID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get accessible templates", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":     templates,
		"total":    total,
		"page":     filter.Page,
		"pageSize": filter.PageSize,
	})
}

// Update updates an action template
// PUT /api/v2/action-templates/:id
func (h *ActionTemplateHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	var template models.ActionTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	template.ID = uint(id)

	if err := h.service.Update(c.Request.Context(), &template); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update template", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, template)
}

// Delete soft deletes an action template
// DELETE /api/v2/action-templates/:id
func (h *ActionTemplateHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid template ID"})
		return
	}

	if err := h.service.Delete(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete template", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template deleted successfully"})
}

// CopyToTenant copies a template to tenant scope
// POST /api/v2/action-templates/:templateId/copy
// Body: {"newName": "My Custom Template"}
func (h *ActionTemplateHandler) CopyToTenant(c *gin.Context) {
	templateID := c.Param("templateId")

	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found in context"})
		return
	}

	var req struct {
		NewName string `json:"newName" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	newTemplate, err := h.service.CopyToTenant(c.Request.Context(), templateID, tenantID, req.NewName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to copy template", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, newTemplate)
}

// RecordUsage increments the usage count
// POST /api/v2/action-templates/:templateId/usage
func (h *ActionTemplateHandler) RecordUsage(c *gin.Context) {
	templateID := c.Param("templateId")

	if err := h.service.RecordUsage(c.Request.Context(), templateID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record usage", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usage recorded successfully"})
}
