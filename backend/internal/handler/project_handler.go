package handler

import (
	"net/http"

	"test-management-service/internal/service"

	"github.com/gin-gonic/gin"
)

// ProjectHandler handles HTTP requests for project management
type ProjectHandler struct {
	projectService service.ProjectService
}

// NewProjectHandler creates a new project handler
func NewProjectHandler(projectService service.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
	}
}

// RegisterRoutes registers all project-related routes
func (h *ProjectHandler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v2/projects")
	{
		// Project CRUD operations
		api.POST("", h.CreateProject)
		api.GET("", h.ListAllProjects)
		api.GET("/:projectId", h.GetProject)
		api.PUT("/:projectId", h.UpdateProject)
		api.DELETE("/:projectId", h.DeleteProject)

		// Project management operations
		api.POST("/:projectId/archive", h.ArchiveProject)
		api.POST("/:projectId/activate", h.ActivateProject)

		// Project associations
		api.GET("/:projectId/test-groups", h.GetProjectWithTestGroups)
		api.GET("/:projectId/test-cases", h.GetProjectWithTestCases)
		api.GET("/:projectId/members", h.GetProjectWithMembers)

		// Stats
		api.POST("/:projectId/update-stats", h.UpdateProjectStats)
	}
}

// ===== Project Handlers =====

// CreateProject creates a new project
// POST /api/v2/projects
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req service.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.projectService.CreateProject(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// ListAllProjects lists all projects across all tenants
// GET /api/v2/projects
func (h *ProjectHandler) ListAllProjects(c *gin.Context) {
	projects, err := h.projectService.ListAllProjects()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  projects,
		"total": len(projects),
	})
}

// ListProjects lists all projects for a specific tenant
// GET /api/v2/tenants/:tenantId/projects
func (h *ProjectHandler) ListProjects(c *gin.Context) {
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

// ListActiveProjects lists all active projects for a specific tenant
// GET /api/v2/tenants/:tenantId/projects/active
func (h *ProjectHandler) ListActiveProjects(c *gin.Context) {
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

// GetProject retrieves a specific project by ID
// GET /api/v2/projects/:projectId
func (h *ProjectHandler) GetProject(c *gin.Context) {
	projectID := c.Param("projectId")

	project, err := h.projectService.GetProject(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if project == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// UpdateProject updates an existing project
// PUT /api/v2/projects/:projectId
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	projectID := c.Param("projectId")

	var req service.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.projectService.UpdateProject(projectID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, project)
}

// DeleteProject deletes a project (soft delete)
// DELETE /api/v2/projects/:projectId
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	projectID := c.Param("projectId")

	if err := h.projectService.DeleteProject(projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "project deleted successfully"})
}

// ArchiveProject archives a project
// POST /api/v2/projects/:projectId/archive
func (h *ProjectHandler) ArchiveProject(c *gin.Context) {
	projectID := c.Param("projectId")

	if err := h.projectService.ArchiveProject(projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "project archived successfully"})
}

// ActivateProject activates a project
// POST /api/v2/projects/:projectId/activate
func (h *ProjectHandler) ActivateProject(c *gin.Context) {
	projectID := c.Param("projectId")

	if err := h.projectService.ActivateProject(projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "project activated successfully"})
}

// GetProjectWithTestGroups retrieves a project with all its test groups
// GET /api/v2/projects/:projectId/test-groups
func (h *ProjectHandler) GetProjectWithTestGroups(c *gin.Context) {
	projectID := c.Param("projectId")

	project, err := h.projectService.GetProjectWithTestGroups(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if project == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// GetProjectWithTestCases retrieves a project with all its test cases
// GET /api/v2/projects/:projectId/test-cases
func (h *ProjectHandler) GetProjectWithTestCases(c *gin.Context) {
	projectID := c.Param("projectId")

	project, err := h.projectService.GetProjectWithTestCases(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if project == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// GetProjectWithMembers retrieves a project with all its members
// GET /api/v2/projects/:projectId/members
func (h *ProjectHandler) GetProjectWithMembers(c *gin.Context) {
	projectID := c.Param("projectId")

	project, err := h.projectService.GetProjectWithMembers(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if project == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// UpdateProjectStats updates project statistics (test case count, test group count)
// POST /api/v2/projects/:projectId/update-stats
func (h *ProjectHandler) UpdateProjectStats(c *gin.Context) {
	projectID := c.Param("projectId")

	if err := h.projectService.UpdateProjectStats(projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "project stats updated successfully"})
}
