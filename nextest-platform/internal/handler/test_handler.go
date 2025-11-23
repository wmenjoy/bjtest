package handler

import (
	"errors"
	"net/http"
	"strconv"

	apierrors "test-management-service/internal/errors"
	"test-management-service/internal/middleware"
	"test-management-service/internal/service"

	"github.com/gin-gonic/gin"
)

// TestHandler HTTP处理器
type TestHandler struct {
	service service.TestService
}

// NewTestHandler 创建处理器
func NewTestHandler(service service.TestService) *TestHandler {
	return &TestHandler{service: service}
}

// RegisterRoutes 注册路由
func (h *TestHandler) RegisterRoutes(rg *gin.RouterGroup) {
	// Test cases
	rg.POST("/tests", h.CreateTestCase)
	rg.PUT("/tests/:id", h.UpdateTestCase)
	rg.DELETE("/tests/:id", h.DeleteTestCase)
	rg.GET("/tests/:id", h.GetTestCase)
	rg.GET("/tests", h.ListTestCases)
	rg.GET("/tests/search", h.SearchTestCases)
	rg.GET("/tests/stats", h.GetTestStats)

	// Test tree (for Web UI)
	rg.GET("/test-tree", h.GetTestTree)

	// Test groups
	rg.POST("/groups", h.CreateTestGroup)
	rg.PUT("/groups/:id", h.UpdateTestGroup)
	rg.DELETE("/groups/:id", h.DeleteTestGroup)
	rg.GET("/groups/:id", h.GetTestGroup)
	rg.GET("/groups/tree", h.GetTestGroupTree)

	// Test execution
	rg.POST("/tests/:id/execute", h.ExecuteTest)
	rg.POST("/groups/:id/execute", h.ExecuteTestGroup)

	// Test results
	rg.GET("/results/:id", h.GetTestResult)
	rg.GET("/tests/:id/history", h.GetTestHistory)

	// Test runs
	rg.GET("/runs/:id", h.GetTestRun)
	rg.GET("/runs", h.ListTestRuns)
}

// ===== Test Case Handlers =====

func (h *TestHandler) CreateTestCase(c *gin.Context) {
	// Extract tenant context from middleware
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	var req service.CreateTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	testCase, err := h.service.CreateTestCase(c.Request.Context(), tenantID, projectID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, testCase)
}

func (h *TestHandler) UpdateTestCase(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")

	var req service.UpdateTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	testCase, err := h.service.UpdateTestCase(c.Request.Context(), testID, tenantID, projectID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, testCase)
}

func (h *TestHandler) DeleteTestCase(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")

	if err := h.service.DeleteTestCase(c.Request.Context(), testID, tenantID, projectID); err != nil {
		// Check if it's a NotFound error
		if errors.Is(err, apierrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "test case not found"})
			return
		}
		// Other errors are internal server errors
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "test case deleted"})
}

func (h *TestHandler) GetTestCase(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")

	testCase, err := h.service.GetTestCase(c.Request.Context(), testID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if testCase == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test case not found"})
		return
	}

	c.JSON(http.StatusOK, testCase)
}

func (h *TestHandler) ListTestCases(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	testCases, total, err := h.service.ListTestCases(c.Request.Context(), tenantID, projectID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   testCases,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *TestHandler) SearchTestCases(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	testCases, err := h.service.SearchTestCases(c.Request.Context(), tenantID, projectID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, testCases)
}

// ===== Test Group Handlers =====

func (h *TestHandler) CreateTestGroup(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	var req service.CreateTestGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group, err := h.service.CreateTestGroup(c.Request.Context(), tenantID, projectID, &req)
	if err != nil {
		// Check if it's an AlreadyExists error
		if errors.Is(err, apierrors.ErrAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "group already exists"})
			return
		}
		// Other errors are internal server errors
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, group)
}

func (h *TestHandler) UpdateTestGroup(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	groupID := c.Param("id")

	var req service.UpdateTestGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group, err := h.service.UpdateTestGroup(c.Request.Context(), groupID, tenantID, projectID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, group)
}

func (h *TestHandler) DeleteTestGroup(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	groupID := c.Param("id")

	if err := h.service.DeleteTestGroup(c.Request.Context(), groupID, tenantID, projectID); err != nil {
		// Check if it's a NotFound error
		if errors.Is(err, apierrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "test group not found"})
			return
		}
		// Other errors are internal server errors
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "test group deleted"})
}

func (h *TestHandler) GetTestGroup(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	groupID := c.Param("id")

	group, err := h.service.GetTestGroup(c.Request.Context(), groupID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if group == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test group not found"})
		return
	}

	c.JSON(http.StatusOK, group)
}

func (h *TestHandler) GetTestGroupTree(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	tree, err := h.service.GetTestGroupTree(c.Request.Context(), tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tree)
}

// ===== Test Execution Handlers =====

func (h *TestHandler) ExecuteTest(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")

	result, err := h.service.ExecuteTest(c.Request.Context(), testID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *TestHandler) ExecuteTestGroup(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	groupID := c.Param("id")

	run, err := h.service.ExecuteTestGroup(c.Request.Context(), groupID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, run)
}

// ===== Test Result Handlers =====

func (h *TestHandler) GetTestResult(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	idStr := c.Param("id")

	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid result id"})
		return
	}

	result, err := h.service.GetTestResult(c.Request.Context(), uint(id), tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if result == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test result not found"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *TestHandler) GetTestHistory(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	testID := c.Param("id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	history, err := h.service.GetTestHistory(c.Request.Context(), testID, tenantID, projectID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}

// ===== Test Run Handlers =====

func (h *TestHandler) GetTestRun(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	runID := c.Param("id")

	run, err := h.service.GetTestRun(c.Request.Context(), runID, tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if run == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test run not found"})
		return
	}

	c.JSON(http.StatusOK, run)
}

func (h *TestHandler) ListTestRuns(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	runs, total, err := h.service.ListTestRuns(c.Request.Context(), tenantID, projectID, limit, offset)
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

// ===== Web UI Specific Handlers =====

// GetTestTree returns the complete test tree with groups and tests
func (h *TestHandler) GetTestTree(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	tree, err := h.service.GetTestGroupTree(c.Request.Context(), tenantID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Enrich tree with test cases for each group
	allTests, _, err := h.service.ListTestCases(c.Request.Context(), tenantID, projectID, 10000, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Organize tests by group
	for i := range tree {
		for _, test := range allTests {
			if test.GroupID == tree[i].GroupID {
				tree[i].TestCases = append(tree[i].TestCases, test)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"tree": tree,
		},
	})
}

// GetTestStats returns test statistics
func (h *TestHandler) GetTestStats(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	projectID := middleware.GetProjectID(c)

	// Get all test cases
	tests, total, err := h.service.ListTestCases(c.Request.Context(), tenantID, projectID, 10000, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Calculate statistics
	stats := gin.H{
		"total":  total,
		"active": 0,
		"p0":     0,
		"p1":     0,
		"p2":     0,
	}

	for _, test := range tests {
		if test.Status == "active" {
			stats["active"] = stats["active"].(int) + 1
		}
		switch test.Priority {
		case "P0":
			stats["p0"] = stats["p0"].(int) + 1
		case "P1":
			stats["p1"] = stats["p1"].(int) + 1
		case "P2":
			stats["p2"] = stats["p2"].(int) + 1
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
