package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"test-management-service/internal/models"
	"test-management-service/internal/repository"
	"test-management-service/internal/testcase"
)

// TestService 测试服务接口
type TestService interface {
	// Test Case operations
	CreateTestCase(ctx context.Context, tenantID, projectID string, req *CreateTestCaseRequest) (*models.TestCase, error)
	UpdateTestCase(ctx context.Context, testID, tenantID, projectID string, req *UpdateTestCaseRequest) (*models.TestCase, error)
	DeleteTestCase(ctx context.Context, testID, tenantID, projectID string) error
	GetTestCase(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error)
	ListTestCases(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestCase, int64, error)
	SearchTestCases(ctx context.Context, tenantID, projectID, query string) ([]models.TestCase, error)

	// Test Group operations
	CreateTestGroup(ctx context.Context, tenantID, projectID string, req *CreateTestGroupRequest) (*models.TestGroup, error)
	UpdateTestGroup(ctx context.Context, groupID, tenantID, projectID string, req *UpdateTestGroupRequest) (*models.TestGroup, error)
	DeleteTestGroup(ctx context.Context, groupID, tenantID, projectID string) error
	GetTestGroup(ctx context.Context, groupID, tenantID, projectID string) (*models.TestGroup, error)
	GetTestGroupTree(ctx context.Context, tenantID, projectID string) ([]models.TestGroup, error)

	// Test execution
	ExecuteTest(ctx context.Context, testID, tenantID, projectID string) (*models.TestResult, error)
	ExecuteTestGroup(ctx context.Context, groupID, tenantID, projectID string) (*models.TestRun, error)

	// Test results
	GetTestResult(ctx context.Context, id uint, tenantID, projectID string) (*models.TestResult, error)
	GetTestHistory(ctx context.Context, testID, tenantID, projectID string, limit int) ([]models.TestResult, error)

	// Test runs
	GetTestRun(ctx context.Context, runID, tenantID, projectID string) (*models.TestRun, error)
	ListTestRuns(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestRun, int64, error)

	// Advanced search and analytics
	AdvancedSearch(ctx context.Context, tenantID string, filter repository.TestCaseFilter) ([]*models.TestCase, int64, error)
	GetStatistics(ctx context.Context, tenantID string, currentUserID string) (*repository.TestStatistics, error)
	GetFlakyTests(ctx context.Context, tenantID string) ([]*models.TestCase, error)
}

type testService struct {
	caseRepo   repository.TestCaseRepository
	groupRepo  repository.TestGroupRepository
	resultRepo repository.TestResultRepository
	runRepo    repository.TestRunRepository
	executor   *testcase.UnifiedTestExecutor
	// workflowCaseRepo provides access to advanced workflow test case methods
	// This is optional and can be nil if not needed
	workflowCaseRepo *repository.WorkflowTestCaseRepository
}

// NewTestService creates a new test service
func NewTestService(
	caseRepo repository.TestCaseRepository,
	groupRepo repository.TestGroupRepository,
	resultRepo repository.TestResultRepository,
	runRepo repository.TestRunRepository,
	executor *testcase.UnifiedTestExecutor,
) TestService {
	return &testService{
		caseRepo:   caseRepo,
		groupRepo:  groupRepo,
		resultRepo: resultRepo,
		runRepo:    runRepo,
		executor:   executor,
		// workflowCaseRepo is nil by default, can be set via SetWorkflowCaseRepo
	}
}

// SetWorkflowCaseRepo sets the workflow test case repository for advanced features
// This is an optional dependency that enables AdvancedSearch, GetStatistics, and GetFlakyTests
func (s *testService) SetWorkflowCaseRepo(repo *repository.WorkflowTestCaseRepository) {
	s.workflowCaseRepo = repo
}

// ===== Request/Response DTOs =====

type CreateTestCaseRequest struct {
	TestID        string                 `json:"testId" binding:"required"`
	GroupID       string                 `json:"groupId" binding:"required"`
	Name          string                 `json:"name" binding:"required"`
	Type          string                 `json:"type" binding:"required"` // Now includes "workflow"
	Priority      string                 `json:"priority"`
	Status        string                 `json:"status"`
	Objective     string                 `json:"objective"`
	Timeout       int                    `json:"timeout"`

	// Workflow integration (NEW)
	WorkflowID    string                 `json:"workflowId,omitempty"`    // Mode 1: Reference workflow
	WorkflowDef   map[string]interface{} `json:"workflowDef,omitempty"`   // Mode 2: Embedded workflow

	// Test steps with control flow support (NEW)
	Steps         []interface{}          `json:"steps"`                   // Array of TestStep with loop/branch/children support

	// Existing fields
	HTTP          map[string]interface{} `json:"http"`
	Command       map[string]interface{} `json:"command"`
	Integration   map[string]interface{} `json:"integration"`
	Assertions    []interface{}          `json:"assertions"`
	Tags          []interface{}          `json:"tags"`
	SetupHooks    []interface{}          `json:"setupHooks"`
	TeardownHooks []interface{}          `json:"teardownHooks"`
}

type UpdateTestCaseRequest struct {
	Name          string                 `json:"name"`
	Priority      string                 `json:"priority"`
	Status        string                 `json:"status"`
	Objective     string                 `json:"objective"`
	Timeout       int                    `json:"timeout"`

	// Workflow integration (NEW)
	WorkflowID    string                 `json:"workflowId,omitempty"`
	WorkflowDef   map[string]interface{} `json:"workflowDef,omitempty"`

	// Test steps with control flow support (NEW)
	Steps         []interface{}          `json:"steps"`                   // Array of TestStep with loop/branch/children support

	HTTP          map[string]interface{} `json:"http"`
	Command       map[string]interface{} `json:"command"`
	Assertions    []interface{}          `json:"assertions"`
	Tags          []interface{}          `json:"tags"`
	SetupHooks    []interface{}          `json:"setupHooks"`
	TeardownHooks []interface{}          `json:"teardownHooks"`
}

type CreateTestGroupRequest struct {
	GroupID     string `json:"groupId" binding:"required"`
	Name        string `json:"name" binding:"required"`
	ParentID    string `json:"parentId"`
	Description string `json:"description"`
	TargetHost  string `json:"targetHost"` // 测试目标服务地址
}

type UpdateTestGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	TargetHost  string `json:"targetHost"` // 测试目标服务地址
}

// ===== Test Case Operations =====

func (s *testService) CreateTestCase(ctx context.Context, tenantID, projectID string, req *CreateTestCaseRequest) (*models.TestCase, error) {
	// Validate workflow test configuration
	if req.Type == "workflow" {
		if req.WorkflowID == "" && req.WorkflowDef == nil {
			return nil, fmt.Errorf("workflow test must have either workflowId or workflowDef")
		}
		if req.WorkflowID != "" && req.WorkflowDef != nil {
			return nil, fmt.Errorf("workflow test cannot have both workflowId and workflowDef")
		}
	}

	tc := &models.TestCase{
		TestID:    req.TestID,
		TenantID:  tenantID,
		ProjectID: projectID,
		GroupID:   req.GroupID,
		Name:      req.Name,
		Type:      req.Type,
		Priority:  req.Priority,
		Status:    req.Status,
		Objective: req.Objective,
		Timeout:   req.Timeout,
	}

	// Test steps with control flow
	if req.Steps != nil {
		tc.Steps = req.Steps
	}

	if req.HTTP != nil {
		tc.HTTPConfig = req.HTTP
	}
	if req.Command != nil {
		tc.CommandConfig = req.Command
	}
	if req.Integration != nil {
		tc.IntegrationConfig = req.Integration
	}
	if req.Assertions != nil {
		tc.Assertions = req.Assertions
	}
	if req.Tags != nil {
		tc.Tags = req.Tags
	}
	if req.SetupHooks != nil {
		tc.SetupHooks = req.SetupHooks
	}
	if req.TeardownHooks != nil {
		tc.TeardownHooks = req.TeardownHooks
	}

	// Workflow integration
	if req.WorkflowID != "" {
		tc.WorkflowID = req.WorkflowID
	}
	if req.WorkflowDef != nil {
		tc.WorkflowDef = models.JSONB(req.WorkflowDef)
	}

	if err := s.caseRepo.CreateWithTenant(ctx, tc); err != nil {
		return nil, fmt.Errorf("failed to create test case: %w", err)
	}

	return tc, nil
}

func (s *testService) UpdateTestCase(ctx context.Context, testID, tenantID, projectID string, req *UpdateTestCaseRequest) (*models.TestCase, error) {
	tc, err := s.caseRepo.FindByIDWithTenant(ctx, testID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find test case: %w", err)
	}
	if tc == nil {
		return nil, fmt.Errorf("test case not found: %s", testID)
	}

	if req.Name != "" {
		tc.Name = req.Name
	}
	if req.Priority != "" {
		tc.Priority = req.Priority
	}
	if req.Status != "" {
		tc.Status = req.Status
	}
	if req.Objective != "" {
		tc.Objective = req.Objective
	}
	if req.Timeout > 0 {
		tc.Timeout = req.Timeout
	}
	// Test steps with control flow
	if req.Steps != nil {
		tc.Steps = req.Steps
	}
	if req.HTTP != nil {
		tc.HTTPConfig = req.HTTP
	}
	if req.Command != nil {
		tc.CommandConfig = req.Command
	}
	if req.Assertions != nil {
		tc.Assertions = req.Assertions
	}
	if req.Tags != nil {
		tc.Tags = req.Tags
	}
	if req.SetupHooks != nil {
		tc.SetupHooks = req.SetupHooks
	}
	if req.TeardownHooks != nil {
		tc.TeardownHooks = req.TeardownHooks
	}

	// Workflow integration
	if req.WorkflowID != "" {
		tc.WorkflowID = req.WorkflowID
	}
	if req.WorkflowDef != nil {
		tc.WorkflowDef = models.JSONB(req.WorkflowDef)
	}

	if err := s.caseRepo.UpdateWithTenant(ctx, tc); err != nil {
		return nil, fmt.Errorf("failed to update test case: %w", err)
	}

	return tc, nil
}

func (s *testService) DeleteTestCase(ctx context.Context, testID, tenantID, projectID string) error {
	return s.caseRepo.DeleteWithTenant(ctx, testID, tenantID, projectID)
}

func (s *testService) GetTestCase(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error) {
	return s.caseRepo.FindByIDWithTenant(ctx, testID, tenantID, projectID)
}

func (s *testService) ListTestCases(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestCase, int64, error) {
	return s.caseRepo.FindAllWithTenant(ctx, tenantID, projectID, limit, offset)
}

func (s *testService) SearchTestCases(ctx context.Context, tenantID, projectID, query string) ([]models.TestCase, error) {
	return s.caseRepo.SearchWithTenant(ctx, tenantID, projectID, query)
}

// ===== Test Group Operations =====

func (s *testService) CreateTestGroup(ctx context.Context, tenantID, projectID string, req *CreateTestGroupRequest) (*models.TestGroup, error) {
	group := &models.TestGroup{
		GroupID:     req.GroupID,
		TenantID:    tenantID,
		ProjectID:   projectID,
		Name:        req.Name,
		ParentID:    req.ParentID,
		Description: req.Description,
		TargetHost:  req.TargetHost,
	}

	if err := s.groupRepo.CreateWithTenant(ctx, group); err != nil {
		return nil, fmt.Errorf("failed to create test group: %w", err)
	}

	return group, nil
}

func (s *testService) UpdateTestGroup(ctx context.Context, groupID, tenantID, projectID string, req *UpdateTestGroupRequest) (*models.TestGroup, error) {
	group, err := s.groupRepo.FindByIDWithTenant(ctx, groupID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find test group: %w", err)
	}
	if group == nil {
		return nil, fmt.Errorf("test group not found: %s", groupID)
	}

	if req.Name != "" {
		group.Name = req.Name
	}
	if req.Description != "" {
		group.Description = req.Description
	}
	// Allow clearing targetHost by setting to empty string
	group.TargetHost = req.TargetHost

	if err := s.groupRepo.UpdateWithTenant(ctx, group); err != nil {
		return nil, fmt.Errorf("failed to update test group: %w", err)
	}

	return group, nil
}

func (s *testService) DeleteTestGroup(ctx context.Context, groupID, tenantID, projectID string) error {
	return s.groupRepo.DeleteWithTenant(ctx, groupID, tenantID, projectID)
}

func (s *testService) GetTestGroup(ctx context.Context, groupID, tenantID, projectID string) (*models.TestGroup, error) {
	return s.groupRepo.FindByIDWithTenant(ctx, groupID, tenantID, projectID)
}

func (s *testService) GetTestGroupTree(ctx context.Context, tenantID, projectID string) ([]models.TestGroup, error) {
	return s.groupRepo.GetTreeWithTenant(ctx, tenantID, projectID)
}

// ===== Test Execution =====

func (s *testService) ExecuteTest(ctx context.Context, testID, tenantID, projectID string) (*models.TestResult, error) {
	// Get test case from database with tenant isolation
	tc, err := s.caseRepo.FindByIDWithTenant(ctx, testID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find test case: %w", err)
	}
	if tc == nil {
		return nil, fmt.Errorf("test case not found: %s", testID)
	}

	// Get the test group to check for custom target host
	executor := s.executor
	if tc.GroupID != "" {
		group, err := s.groupRepo.FindByIDWithTenant(ctx, tc.GroupID, tenantID, projectID)
		if err == nil && group != nil && group.TargetHost != "" {
			// Use group-specific target host
			executor = testcase.NewExecutor(group.TargetHost)
		}
	}

	// Convert to executor format
	execTC := s.convertToExecutorTestCase(tc)

	// Execute test
	result := executor.Execute(execTC)

	// Convert result to model and save
	dbResult := s.convertToModelResult(result)
	dbResult.TenantID = tenantID
	dbResult.ProjectID = projectID
	if err := s.resultRepo.CreateWithTenant(ctx, dbResult); err != nil {
		return nil, fmt.Errorf("failed to save test result: %w", err)
	}

	return dbResult, nil
}

func (s *testService) ExecuteTestGroup(ctx context.Context, groupID, tenantID, projectID string) (*models.TestRun, error) {
	// Get all tests in group with tenant isolation
	tests, err := s.caseRepo.FindByGroupIDWithTenant(ctx, groupID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find tests in group: %w", err)
	}

	// Get the test group to check for custom target host
	executor := s.executor
	group, err := s.groupRepo.FindByIDWithTenant(ctx, groupID, tenantID, projectID)
	if err == nil && group != nil && group.TargetHost != "" {
		// Use group-specific target host
		executor = testcase.NewExecutor(group.TargetHost)
	}

	// Create test run
	runID := fmt.Sprintf("run-%d", time.Now().Unix())
	run := &models.TestRun{
		RunID:     runID,
		TenantID:  tenantID,
		ProjectID: projectID,
		Total:     len(tests),
		StartTime: time.Now(),
		Status:    "running",
	}

	if err := s.runRepo.CreateWithTenant(ctx, run); err != nil {
		return nil, fmt.Errorf("failed to create test run: %w", err)
	}

	// Execute each test
	for _, tc := range tests {
		execTC := s.convertToExecutorTestCase(&tc)
		result := executor.Execute(execTC)

		dbResult := s.convertToModelResult(result)
		dbResult.RunID = runID
		dbResult.TenantID = tenantID
		dbResult.ProjectID = projectID

		if err := s.resultRepo.CreateWithTenant(ctx, dbResult); err != nil {
			fmt.Printf("failed to save result for test %s: %v\n", tc.TestID, err)
			continue
		}

		// Update run statistics
		switch result.Status {
		case "passed":
			run.Passed++
		case "failed":
			run.Failed++
		case "error":
			run.Errors++
		}
	}

	// Update run status
	run.EndTime = time.Now()
	run.Duration = int(run.EndTime.Sub(run.StartTime).Milliseconds())
	run.Status = "completed"

	if err := s.runRepo.UpdateWithTenant(ctx, run); err != nil {
		return nil, fmt.Errorf("failed to update test run: %w", err)
	}

	return run, nil
}

// ===== Test Results =====

func (s *testService) GetTestResult(ctx context.Context, id uint, tenantID, projectID string) (*models.TestResult, error) {
	// Note: TestResult doesn't have FindByIDWithTenant, using FindByID for now
	// TODO: May need to add tenant validation here
	return s.resultRepo.FindByID(id)
}

func (s *testService) GetTestHistory(ctx context.Context, testID, tenantID, projectID string, limit int) ([]models.TestResult, error) {
	return s.resultRepo.FindByTestIDWithTenant(ctx, testID, tenantID, projectID, limit)
}

// ===== Test Runs =====

func (s *testService) GetTestRun(ctx context.Context, runID, tenantID, projectID string) (*models.TestRun, error) {
	return s.runRepo.FindByIDWithTenant(ctx, runID, tenantID, projectID)
}

func (s *testService) ListTestRuns(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestRun, int64, error) {
	return s.runRepo.FindAllWithTenant(ctx, tenantID, projectID, limit, offset)
}

// ===== Helper Methods =====

func (s *testService) convertToExecutorTestCase(tc *models.TestCase) *testcase.TestCase {
	execTC := &testcase.TestCase{
		ID:      tc.TestID,
		Name:    tc.Name,
		Type:    tc.Type,
		GroupID: tc.GroupID,
	}

	// Workflow integration
	execTC.WorkflowID = tc.WorkflowID
	if tc.WorkflowDef != nil {
		execTC.WorkflowDef = tc.WorkflowDef
	}

	// Convert HTTP config - supports both old format (HTTPConfig) and new format (Steps[0].Config)
	httpConfig := tc.HTTPConfig

	// Fallback: If HTTPConfig is nil, try to extract from first step's config
	if httpConfig == nil && len(tc.Steps) > 0 {
		if stepMap, ok := tc.Steps[0].(map[string]interface{}); ok {
			stepType, _ := stepMap["type"].(string)
			if stepType == "http" {
				if config, ok := stepMap["config"].(map[string]interface{}); ok {
					httpConfig = config
				}
			}
		}
	}

	if httpConfig != nil {
		execTC.HTTP = &testcase.HTTPTest{}
		if method, ok := httpConfig["method"].(string); ok {
			execTC.HTTP.Method = method
		}
		// Support both "path" (old format) and "url" (new format)
		if path, ok := httpConfig["path"].(string); ok {
			execTC.HTTP.Path = path
		} else if url, ok := httpConfig["url"].(string); ok {
			execTC.HTTP.Path = url
		}
		if headers, ok := httpConfig["headers"].(map[string]interface{}); ok {
			execTC.HTTP.Headers = make(map[string]string)
			for k, v := range headers {
				if str, ok := v.(string); ok {
					execTC.HTTP.Headers[k] = str
				}
			}
		}
		if body, ok := httpConfig["body"].(map[string]interface{}); ok {
			execTC.HTTP.Body = body
		}
	}

	// Convert Command config - supports both old format (CommandConfig) and new format (Steps[0].Config)
	cmdConfig := tc.CommandConfig

	// Fallback: If CommandConfig is nil, try to extract from first step's config
	if cmdConfig == nil && len(tc.Steps) > 0 {
		if stepMap, ok := tc.Steps[0].(map[string]interface{}); ok {
			stepType, _ := stepMap["type"].(string)
			if stepType == "command" {
				if config, ok := stepMap["config"].(map[string]interface{}); ok {
					cmdConfig = config
				}
			}
		}
	}

	if cmdConfig != nil {
		execTC.Command = &testcase.CommandTest{}
		if cmd, ok := cmdConfig["cmd"].(string); ok {
			execTC.Command.Cmd = cmd
		}
		if args, ok := cmdConfig["args"].([]interface{}); ok {
			for _, arg := range args {
				if str, ok := arg.(string); ok {
					execTC.Command.Args = append(execTC.Command.Args, str)
				}
			}
		}
		if timeout, ok := cmdConfig["timeout"].(float64); ok {
			execTC.Command.Timeout = int(timeout)
		}
	}

	// Convert Assertions
	if tc.Assertions != nil {
		for _, a := range tc.Assertions {
			if assertMap, ok := a.(map[string]interface{}); ok {
				assertion := testcase.Assertion{}
				if aType, ok := assertMap["type"].(string); ok {
					assertion.Type = aType
				}
				if path, ok := assertMap["path"].(string); ok {
					assertion.Path = path
				}
				if expected := assertMap["expected"]; expected != nil {
					assertion.Expected = expected
				}
				if operator, ok := assertMap["operator"].(string); ok {
					assertion.Operator = operator
				}
				execTC.Assertions = append(execTC.Assertions, assertion)
			}
		}
	}

	// Convert Setup Hooks
	if tc.SetupHooks != nil {
		for _, h := range tc.SetupHooks {
			if hookMap, ok := h.(map[string]interface{}); ok {
				hook := testcase.Hook{}
				if hType, ok := hookMap["type"].(string); ok {
					hook.Type = hType
				}
				if name, ok := hookMap["name"].(string); ok {
					hook.Name = name
				}
				if saveResponse, ok := hookMap["saveResponse"].(string); ok {
					hook.SaveResponse = saveResponse
				}
				if runOnFailure, ok := hookMap["runOnFailure"].(bool); ok {
					hook.RunOnFailure = runOnFailure
				}
				if continueOnError, ok := hookMap["continueOnError"].(bool); ok {
					hook.ContinueOnError = continueOnError
				}

				// Convert HTTP config for hook
				if httpConfig, ok := hookMap["http"].(map[string]interface{}); ok {
					hook.HTTP = &testcase.HTTPTest{}
					if method, ok := httpConfig["method"].(string); ok {
						hook.HTTP.Method = method
					}
					if path, ok := httpConfig["path"].(string); ok {
						hook.HTTP.Path = path
					}
					if headers, ok := httpConfig["headers"].(map[string]interface{}); ok {
						hook.HTTP.Headers = make(map[string]string)
						for k, v := range headers {
							if str, ok := v.(string); ok {
								hook.HTTP.Headers[k] = str
							}
						}
					}
					if body, ok := httpConfig["body"].(map[string]interface{}); ok {
						hook.HTTP.Body = body
					}
				}

				// Convert Command config for hook
				if cmdConfig, ok := hookMap["command"].(map[string]interface{}); ok {
					hook.Command = &testcase.CommandTest{}
					if cmd, ok := cmdConfig["cmd"].(string); ok {
						hook.Command.Cmd = cmd
					}
					if args, ok := cmdConfig["args"].([]interface{}); ok {
						for _, arg := range args {
							if str, ok := arg.(string); ok {
								hook.Command.Args = append(hook.Command.Args, str)
							}
						}
					}
					if timeout, ok := cmdConfig["timeout"].(float64); ok {
						hook.Command.Timeout = int(timeout)
					}
				}

				execTC.SetupHooks = append(execTC.SetupHooks, hook)
			}
		}
	}

	// Convert Teardown Hooks
	if tc.TeardownHooks != nil {
		for _, h := range tc.TeardownHooks {
			if hookMap, ok := h.(map[string]interface{}); ok {
				hook := testcase.Hook{}
				if hType, ok := hookMap["type"].(string); ok {
					hook.Type = hType
				}
				if name, ok := hookMap["name"].(string); ok {
					hook.Name = name
				}
				if saveResponse, ok := hookMap["saveResponse"].(string); ok {
					hook.SaveResponse = saveResponse
				}
				if runOnFailure, ok := hookMap["runOnFailure"].(bool); ok {
					hook.RunOnFailure = runOnFailure
				}
				if continueOnError, ok := hookMap["continueOnError"].(bool); ok {
					hook.ContinueOnError = continueOnError
				}

				// Convert HTTP config for hook
				if httpConfig, ok := hookMap["http"].(map[string]interface{}); ok {
					hook.HTTP = &testcase.HTTPTest{}
					if method, ok := httpConfig["method"].(string); ok {
						hook.HTTP.Method = method
					}
					if path, ok := httpConfig["path"].(string); ok {
						hook.HTTP.Path = path
					}
					if headers, ok := httpConfig["headers"].(map[string]interface{}); ok {
						hook.HTTP.Headers = make(map[string]string)
						for k, v := range headers {
							if str, ok := v.(string); ok {
								hook.HTTP.Headers[k] = str
							}
						}
					}
					if body, ok := httpConfig["body"].(map[string]interface{}); ok {
						hook.HTTP.Body = body
					}
				}

				// Convert Command config for hook
				if cmdConfig, ok := hookMap["command"].(map[string]interface{}); ok {
					hook.Command = &testcase.CommandTest{}
					if cmd, ok := cmdConfig["cmd"].(string); ok {
						hook.Command.Cmd = cmd
					}
					if args, ok := cmdConfig["args"].([]interface{}); ok {
						for _, arg := range args {
							if str, ok := arg.(string); ok {
								hook.Command.Args = append(hook.Command.Args, str)
							}
						}
					}
					if timeout, ok := cmdConfig["timeout"].(float64); ok {
						hook.Command.Timeout = int(timeout)
					}
				}

				execTC.TeardownHooks = append(execTC.TeardownHooks, hook)
			}
		}
	}

	return execTC
}

func (s *testService) convertToModelResult(result *testcase.TestResult) *models.TestResult {
	dbResult := &models.TestResult{
		TestID:    result.TestID,
		Status:    result.Status,
		StartTime: result.StartTime,
		EndTime:   result.EndTime,
		Duration:  int(result.Duration.Milliseconds()),
		Error:     result.Error,
	}

	if result.Failures != nil {
		dbResult.Failures = make([]interface{}, len(result.Failures))
		for i, f := range result.Failures {
			dbResult.Failures[i] = f
		}
	}

	// Store request/response as JSON
	if result.Request != nil {
		if data, err := json.Marshal(result.Request); err == nil {
			var m map[string]interface{}
			json.Unmarshal(data, &m)
			dbResult.Metrics = m
		}
	}

	return dbResult
}

// ===== Advanced Search and Analytics =====

// AdvancedSearch performs multi-condition search with pagination
func (s *testService) AdvancedSearch(ctx context.Context, tenantID string, filter repository.TestCaseFilter) ([]*models.TestCase, int64, error) {
	// Check if workflowCaseRepo is available
	if s.workflowCaseRepo != nil {
		return s.workflowCaseRepo.AdvancedSearch(ctx, tenantID, filter)
	}

	// Fallback: this should not happen in practice as we use WorkflowTestCaseRepository
	return nil, 0, fmt.Errorf("advanced search not supported by current repository implementation")
}

// GetStatistics returns aggregated statistics for test cases
func (s *testService) GetStatistics(ctx context.Context, tenantID string, currentUserID string) (*repository.TestStatistics, error) {
	// Check if workflowCaseRepo is available
	if s.workflowCaseRepo != nil {
		return s.workflowCaseRepo.GetStatistics(ctx, tenantID, currentUserID)
	}

	// Fallback: this should not happen in practice
	return nil, fmt.Errorf("statistics not supported by current repository implementation")
}

// GetFlakyTests returns tests identified as flaky
// Default flaky score threshold is 70 (out of 100)
func (s *testService) GetFlakyTests(ctx context.Context, tenantID string) ([]*models.TestCase, error) {
	// Check if workflowCaseRepo is available
	if s.workflowCaseRepo != nil {
		// Default flaky score threshold: 70
		return s.workflowCaseRepo.GetFlakyTests(ctx, tenantID, 70)
	}

	// Fallback: this should not happen in practice
	return nil, fmt.Errorf("flaky test detection not supported by current repository implementation")
}
