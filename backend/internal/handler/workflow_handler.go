package handler

import (
	"net/http"
	"strconv"

	"test-management-service/internal/middleware"
	"test-management-service/internal/service"

	"github.com/gin-gonic/gin"
)

// WorkflowHandler handles workflow HTTP requests
type WorkflowHandler struct {
	service service.WorkflowService
}

// NewWorkflowHandler creates a new workflow handler
func NewWorkflowHandler(service service.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{service: service}
}

// RegisterRoutes registers workflow routes
func (h *WorkflowHandler) RegisterRoutes(rg *gin.RouterGroup) {
	// Workflow CRUD
	rg.POST("/workflows", h.CreateWorkflow)
	rg.PUT("/workflows/:id", h.UpdateWorkflow)
	rg.DELETE("/workflows/:id", h.DeleteWorkflow)
	rg.GET("/workflows/:id", h.GetWorkflow)
	rg.GET("/workflows", h.ListWorkflows)

	// Workflow execution
	rg.POST("/workflows/:id/execute", h.ExecuteWorkflow)
	rg.GET("/workflows/:id/runs", h.ListWorkflowRuns)

	// Workflow run details
	rg.GET("/workflows/runs/:runId", h.GetWorkflowRun)
	rg.GET("/workflows/runs/:runId/steps", h.GetStepExecutions)
	rg.GET("/workflows/runs/:runId/logs", h.GetStepLogs)

	// Workflow relationships
	rg.GET("/workflows/:id/test-cases", h.GetWorkflowTestCases)
}

// CreateWorkflow creates a new workflow
func (h *WorkflowHandler) CreateWorkflow(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	var req service.CreateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workflow, err := h.service.CreateWorkflow(c.Request.Context(), tenantID, projectID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, workflow)
}

// UpdateWorkflow updates an existing workflow
func (h *WorkflowHandler) UpdateWorkflow(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	workflowID := c.Param("id")

	var req service.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workflow, err := h.service.UpdateWorkflow(c.Request.Context(), workflowID, tenantID, projectID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, workflow)
}

// DeleteWorkflow deletes a workflow
func (h *WorkflowHandler) DeleteWorkflow(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	workflowID := c.Param("id")

	if err := h.service.DeleteWorkflow(c.Request.Context(), workflowID, tenantID, projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "workflow deleted"})
}

// GetWorkflow retrieves a workflow by ID
func (h *WorkflowHandler) GetWorkflow(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	workflowID := c.Param("id")

	workflow, err := h.service.GetWorkflow(c.Request.Context(), workflowID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, workflow)
}

// ListWorkflows lists all workflows
func (h *WorkflowHandler) ListWorkflows(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var isTestCase *bool
	if tc := c.Query("isTestCase"); tc != "" {
		val := tc == "true"
		isTestCase = &val
	}

	workflows, total, err := h.service.ListWorkflows(c.Request.Context(), tenantID, projectID, isTestCase, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   workflows,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ExecuteWorkflow executes a workflow
func (h *WorkflowHandler) ExecuteWorkflow(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	workflowID := c.Param("id")

	var req service.ExecuteWorkflowRequest
	c.ShouldBindJSON(&req)

	run, err := h.service.ExecuteWorkflow(c.Request.Context(), workflowID, tenantID, projectID, req.Variables)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, run)
}

// GetWorkflowRun retrieves workflow run details
func (h *WorkflowHandler) GetWorkflowRun(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	runID := c.Param("runId")

	run, err := h.service.GetWorkflowRun(c.Request.Context(), runID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, run)
}

// ListWorkflowRuns lists workflow execution runs
func (h *WorkflowHandler) ListWorkflowRuns(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	workflowID := c.Param("id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	runs, total, err := h.service.ListWorkflowRuns(c.Request.Context(), workflowID, tenantID, projectID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   runs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetStepExecutions retrieves step executions for a run
func (h *WorkflowHandler) GetStepExecutions(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	runID := c.Param("runId")

	steps, err := h.service.GetStepExecutions(c.Request.Context(), runID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, steps)
}

// GetStepLogs retrieves logs for a workflow run
func (h *WorkflowHandler) GetStepLogs(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	runID := c.Param("runId")

	var stepID *string
	if sid := c.Query("stepId"); sid != "" {
		stepID = &sid
	}

	var level *string
	if lvl := c.Query("level"); lvl != "" {
		level = &lvl
	}

	logs, err := h.service.GetStepLogs(c.Request.Context(), runID, tenantID, projectID, stepID, level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// GetWorkflowTestCases retrieves test cases referencing this workflow
func (h *WorkflowHandler) GetWorkflowTestCases(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	workflowID := c.Param("id")

	testCases, err := h.service.GetWorkflowTestCases(c.Request.Context(), workflowID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, testCases)
}
