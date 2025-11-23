package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"test-management-service/internal/expression"
	"test-management-service/internal/models"
	"test-management-service/internal/testcase"
	"test-management-service/internal/websocket"
	"test-management-service/internal/workflow/actions"

	"github.com/google/uuid"
	"github.com/tidwall/gjson"
	"gorm.io/gorm"
)

// VariableInjector interface for injecting environment variables
type VariableInjector interface {
	GetActiveEnvironmentVariables(ctx context.Context, tenantID, projectID string) (map[string]string, error)
}

// ExecutionParams contains tenant context for workflow execution
type ExecutionParams struct {
	TenantID  string
	ProjectID string
}

// WorkflowExecutorImpl implements WorkflowExecutor
type WorkflowExecutorImpl struct {
	db               *gorm.DB
	actionRegistry   *ActionRegistry
	testCaseRepo     TestCaseRepository
	workflowRepo     WorkflowRepository
	unifiedExecutor  *testcase.UnifiedTestExecutor
	hub              *websocket.Hub
	variableInjector VariableInjector
}

// NewWorkflowExecutor creates a new workflow executor
func NewWorkflowExecutor(
	db *gorm.DB,
	testCaseRepo TestCaseRepository,
	workflowRepo WorkflowRepository,
	unifiedExecutor *testcase.UnifiedTestExecutor,
	hub *websocket.Hub,
	variableInjector VariableInjector,
) *WorkflowExecutorImpl {
	executor := &WorkflowExecutorImpl{
		db:               db,
		actionRegistry:   NewActionRegistry(),
		testCaseRepo:     testCaseRepo,
		workflowRepo:     workflowRepo,
		unifiedExecutor:  unifiedExecutor,
		hub:              hub,
		variableInjector: variableInjector,
	}

	// Register built-in actions
	executor.registerBuiltinActions()

	return executor
}

func (e *WorkflowExecutorImpl) registerBuiltinActions() {
	// HTTP and Command actions will be registered here
	// TestCaseAction is registered separately
}

// Execute runs a workflow with tenant context
func (e *WorkflowExecutorImpl) Execute(workflowID string, workflowDef interface{}, params *ExecutionParams) (*WorkflowResult, error) {
	// Step 1: Parse workflow definition
	workflow, err := e.parseWorkflowDefinition(workflowID, workflowDef)
	if err != nil {
		return nil, fmt.Errorf("failed to parse workflow: %w", err)
	}

	// Step 2: Validate workflow (check for cycles)
	if err := e.validateWorkflow(workflow); err != nil {
		return nil, fmt.Errorf("workflow validation failed: %w", err)
	}

	// Step 3: Create run record
	runID := uuid.New().String()
	run := &models.WorkflowRun{
		RunID:      runID,
		WorkflowID: workflowID,
		Status:     "running",
		StartTime:  time.Now(),
	}
	if err := e.db.Create(run).Error; err != nil {
		return nil, fmt.Errorf("failed to create run record: %w", err)
	}

	// Step 4: Initialize execution context
	ctx := &ExecutionContext{
		RunID:       runID,
		Variables:   workflow.Variables,
		StepOutputs: make(map[string]interface{}),
		StepResults: make(map[string]*StepExecutionResult),
		Logger:      NewBroadcastStepLogger(e.db, runID, e.hub),
		VarTracker:  NewDatabaseVariableChangeTracker(e.db, runID),
	}

	// Initialize variables map if nil
	if ctx.Variables == nil {
		ctx.Variables = make(map[string]interface{})
	}

	// Merge environment variables into workflow variables
	// Environment variables serve as base, workflow variables override them
	if e.variableInjector != nil && params != nil {
		envVars, err := e.variableInjector.GetActiveEnvironmentVariables(context.Background(), params.TenantID, params.ProjectID)
		if err == nil && envVars != nil {
			// Create a new merged map with environment variables as base
			mergedVars := make(map[string]interface{})

			// First, add all environment variables
			for key, value := range envVars {
				mergedVars[key] = value
			}

			// Then, overlay workflow variables (these take precedence)
			for key, value := range ctx.Variables {
				mergedVars[key] = value
			}

			ctx.Variables = mergedVars
		}
	}

	// === 初始化表达式求值器 ===
	ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

	// Step 5: Build DAG and get execution order
	layers, err := e.buildDAG(workflow.Steps)
	if err != nil {
		e.updateRunStatus(run, "failed", err.Error())
		return nil, fmt.Errorf("failed to build DAG: %w", err)
	}

	// Step 6: Execute steps layer by layer
	var execError error
	for _, layer := range layers {
		if err := e.executeLayer(ctx, layer, workflow.Steps); err != nil {
			execError = err
			break
		}
	}

	// Step 7: Finalize run record
	run.EndTime = time.Now()
	run.Duration = int(run.EndTime.Sub(run.StartTime).Milliseconds())

	if execError != nil {
		run.Status = "failed"
		run.Error = execError.Error()
	} else {
		run.Status = "success"
	}

	// Save context as JSON
	run.Context = models.JSONB{"variables": ctx.Variables, "outputs": ctx.StepOutputs}
	e.db.Save(run)

	// Step 8: Build result
	return e.buildWorkflowResult(ctx, run), nil
}

// parseWorkflowDefinition parses workflow from various formats
func (e *WorkflowExecutorImpl) parseWorkflowDefinition(workflowID string, workflowDef interface{}) (*WorkflowDefinition, error) {
	var workflow WorkflowDefinition

	switch def := workflowDef.(type) {
	case *WorkflowDefinition:
		// Direct WorkflowDefinition pointer (from tests)
		return def, nil
	case map[string]interface{}:
		// Direct map (from JSONB)
		data, err := json.Marshal(def)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(data, &workflow); err != nil {
			return nil, err
		}
	case models.JSONB:
		// JSONB type
		data, err := json.Marshal(def)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(data, &workflow); err != nil {
			return nil, err
		}
	case string:
		// JSON string
		if err := json.Unmarshal([]byte(def), &workflow); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unsupported workflow definition type: %T", workflowDef)
	}

	if workflow.Name == "" {
		workflow.Name = workflowID
	}

	return &workflow, nil
}

// validateWorkflow checks for cycles and missing dependencies
func (e *WorkflowExecutorImpl) validateWorkflow(workflow *WorkflowDefinition) error {
	// Check all dependencies exist
	for stepID, step := range workflow.Steps {
		for _, dep := range step.DependsOn {
			if _, exists := workflow.Steps[dep]; !exists {
				return fmt.Errorf("step '%s' depends on non-existent step '%s'", stepID, dep)
			}
		}
	}

	// Check for cycles using DFS
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	var hasCycle func(stepID string) bool
	hasCycle = func(stepID string) bool {
		visited[stepID] = true
		recStack[stepID] = true

		step := workflow.Steps[stepID]
		for _, dep := range step.DependsOn {
			if !visited[dep] {
				if hasCycle(dep) {
					return true
				}
			} else if recStack[dep] {
				return true
			}
		}

		recStack[stepID] = false
		return false
	}

	for stepID := range workflow.Steps {
		if !visited[stepID] {
			if hasCycle(stepID) {
				return fmt.Errorf("workflow contains cyclic dependency involving step '%s'", stepID)
			}
		}
	}

	return nil
}

// buildDAG creates execution layers using topological sort
func (e *WorkflowExecutorImpl) buildDAG(steps map[string]*WorkflowStep) ([][]string, error) {
	// Calculate in-degrees
	inDegree := make(map[string]int)
	for stepID := range steps {
		inDegree[stepID] = 0
	}
	for _, step := range steps {
		for range step.DependsOn {
			inDegree[step.ID]++
		}
	}

	// Build layers using Kahn's algorithm
	var layers [][]string
	remaining := len(steps)

	for remaining > 0 {
		// Find all steps with no dependencies
		var layer []string
		for stepID, degree := range inDegree {
			if degree == 0 {
				layer = append(layer, stepID)
			}
		}

		if len(layer) == 0 {
			return nil, fmt.Errorf("unable to resolve dependencies")
		}

		// Remove processed steps
		for _, stepID := range layer {
			delete(inDegree, stepID)
			remaining--

			// Reduce in-degree of dependent steps
			for _, step := range steps {
				for _, dep := range step.DependsOn {
					if dep == stepID {
						inDegree[step.ID]--
					}
				}
			}
		}

		layers = append(layers, layer)
	}

	return layers, nil
}

// executeLayer executes all steps in a layer (in parallel)
func (e *WorkflowExecutorImpl) executeLayer(ctx *ExecutionContext, layer []string, steps map[string]*WorkflowStep) error {
	var wg sync.WaitGroup
	errorsChan := make(chan error, len(layer))

	for _, stepID := range layer {
		step := steps[stepID]
		if step == nil {
			continue
		}

		// Check condition
		if step.When != "" && !e.evaluateCondition(step.When, ctx) {
			ctx.Logger.Info(stepID, fmt.Sprintf("Step skipped due to condition: %s", step.When))
			// 记录跳过状态
			ctx.StepResults[stepID] = &StepExecutionResult{
				Status: "skipped",
			}
			continue
		}

		wg.Add(1)
		go func(s *WorkflowStep) {
			defer wg.Done()

			// 使用循环包装器执行（如果配置了循环）
			var err error
			if s.LoopOver != "" || s.LoopCondition != "" {
				err = e.executeWithLoop(ctx, s)
			} else {
				err = e.executeStep(ctx, s)
			}

			if err != nil {
				errorsChan <- fmt.Errorf("step %s failed: %w", s.ID, err)
			}
		}(step)
	}

	wg.Wait()
	close(errorsChan)

	// Return first error
	for err := range errorsChan {
		return err
	}

	return nil
}

// executeStep executes a single step
func (e *WorkflowExecutorImpl) executeStep(ctx *ExecutionContext, step *WorkflowStep) error {
	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting step: %s", step.Name))

	// Broadcast step start event
	if e.hub != nil {
		e.hub.Broadcast(ctx.RunID, "step_start", map[string]interface{}{
			"stepId":   step.ID,
			"stepName": step.Name,
		})
	}

	// Create step execution record
	stepExec := &models.WorkflowStepExecution{
		RunID:     ctx.RunID,
		StepID:    step.ID,
		StepName:  step.Name,
		Status:    "running",
		StartTime: time.Now(),
	}

	// Save input data (before interpolation)
	stepExec.InputData = models.JSONB{"input": step.Input, "config": step.Config}
	e.db.Create(stepExec)

	// Interpolate variables in step config
	interpolatedConfig, err := e.interpolateConfig(step.Config, ctx.Variables, ctx.StepOutputs)
	if err != nil {
		stepExec.Status = "failed"
		stepExec.Error = fmt.Sprintf("variable interpolation failed: %v", err)
		stepExec.EndTime = time.Now()
		stepExec.Duration = int(stepExec.EndTime.Sub(stepExec.StartTime).Milliseconds())
		e.db.Save(stepExec)
		return err
	}
	step.Config = interpolatedConfig

	// Get action
	action, err := e.getActionForStep(step)
	if err != nil {
		stepExec.Status = "failed"
		stepExec.Error = err.Error()
		stepExec.EndTime = time.Now()
		stepExec.Duration = int(stepExec.EndTime.Sub(stepExec.StartTime).Milliseconds())
		e.db.Save(stepExec)
		return err
	}

	// Build action context
	actionCtx := &ActionContext{
		StepID:          step.ID,
		Variables:       ctx.Variables,
		StepOutputs:     ctx.StepOutputs,
		TestCaseRepo:    e.testCaseRepo,
		UnifiedExecutor: e.unifiedExecutor,
		Logger:          ctx.Logger,
	}

	// Execute with retry
	var result *ActionResult
	maxAttempts := 1
	if step.Retry != nil && step.Retry.MaxAttempts > 0 {
		maxAttempts = step.Retry.MaxAttempts
	}

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		result, err = action.Execute(actionCtx)
		if err == nil && result.Status == "success" {
			break
		}
		if attempt < maxAttempts {
			ctx.Logger.Warn(step.ID, fmt.Sprintf("Attempt %d failed, retrying...", attempt))
			if step.Retry != nil && step.Retry.Interval > 0 {
				time.Sleep(time.Duration(step.Retry.Interval) * time.Millisecond)
			}
		}
	}

	// Update execution record
	stepExec.EndTime = time.Now()
	stepExec.Duration = int(stepExec.EndTime.Sub(stepExec.StartTime).Milliseconds())

	if err != nil || (result != nil && result.Status == "failed") {
		stepExec.Status = "failed"
		if err != nil {
			stepExec.Error = err.Error()
		} else if result.Error != nil {
			stepExec.Error = result.Error.Error()
		}
		e.db.Save(stepExec)

		// Store step result
		ctx.StepResults[step.ID] = &StepExecutionResult{
			Status:   "failed",
			Duration: stepExec.Duration,
			Error:    stepExec.Error,
		}

		// Handle error strategy
		if step.OnError == "continue" {
			ctx.Logger.Warn(step.ID, "Step failed but continuing due to onError=continue")
			return nil
		}
		return fmt.Errorf("step execution failed")
	}

	// Success - save output
	stepExec.Status = "success"
	if result != nil && result.Output != nil {
		stepExec.OutputData = models.JSONB(result.Output)

		// Save to step outputs
		ctx.StepOutputs[step.ID] = result.Output

		// Map output variables
		if step.Output != nil {
			for varName, outputPath := range step.Output {
				if value, exists := result.Output[outputPath]; exists {
					oldValue := ctx.Variables[varName]
					ctx.Variables[varName] = value
					ctx.VarTracker.Track(step.ID, varName, oldValue, value, "update")
				}
			}
		}
	}
	e.db.Save(stepExec)

	// Store step result
	ctx.StepResults[step.ID] = &StepExecutionResult{
		Status:   "success",
		Duration: stepExec.Duration,
		Output:   result.Output,
	}

	// Broadcast step complete event
	if e.hub != nil {
		e.hub.Broadcast(ctx.RunID, "step_complete", map[string]interface{}{
			"stepId":   step.ID,
			"stepName": step.Name,
			"status":   stepExec.Status,
			"duration": stepExec.Duration,
		})
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("Step completed in %dms", stepExec.Duration))
	return nil
}

// interpolateConfig recursively interpolates variables in config map
func (e *WorkflowExecutorImpl) interpolateConfig(config map[string]interface{}, variables map[string]interface{}, stepOutputs map[string]interface{}) (map[string]interface{}, error) {
	if config == nil {
		return nil, nil
	}

	// Create evaluator for variable substitution
	evaluator := expression.NewEvaluator(variables, stepOutputs)

	// Recursively interpolate all values
	result := make(map[string]interface{})
	for key, value := range config {
		interpolatedValue, err := e.interpolateValue(value, evaluator)
		if err != nil {
			return nil, fmt.Errorf("failed to interpolate key '%s': %w", key, err)
		}
		result[key] = interpolatedValue
	}

	return result, nil
}

// interpolateValue recursively interpolates a single value
func (e *WorkflowExecutorImpl) interpolateValue(value interface{}, evaluator *expression.Evaluator) (interface{}, error) {
	switch v := value.(type) {
	case string:
		// Interpolate string values that contain {{...}}
		interpolated, err := evaluator.EvaluateString(v)
		if err != nil {
			return nil, err
		}
		return interpolated, nil

	case map[string]interface{}:
		// Recursively interpolate map values
		result := make(map[string]interface{})
		for key, val := range v {
			interpolatedVal, err := e.interpolateValue(val, evaluator)
			if err != nil {
				return nil, fmt.Errorf("failed to interpolate map key '%s': %w", key, err)
			}
			result[key] = interpolatedVal
		}
		return result, nil

	case []interface{}:
		// Recursively interpolate array elements
		result := make([]interface{}, len(v))
		for i, item := range v {
			interpolatedItem, err := e.interpolateValue(item, evaluator)
			if err != nil {
				return nil, fmt.Errorf("failed to interpolate array index %d: %w", i, err)
			}
			result[i] = interpolatedItem
		}
		return result, nil

	default:
		// Return non-string values as-is
		return value, nil
	}
}

// getActionForStep returns the appropriate action for a step
func (e *WorkflowExecutorImpl) getActionForStep(step *WorkflowStep) (Action, error) {
	switch step.Type {
	case "test-case":
		// Create TestCaseAction from config
		testID, ok := step.Config["testId"].(string)
		if !ok {
			return nil, fmt.Errorf("testId not specified for test-case step")
		}
		return &TestCaseActionWrapper{
			TestID: testID,
			Input:  step.Input,
		}, nil
	case "http":
		return &HTTPActionWrapper{Config: step.Config}, nil
	case "command":
		return &CommandActionWrapper{Config: step.Config}, nil
	case "database":
		return &DatabaseActionWrapper{Config: step.Config}, nil
	case "script":
		return &ScriptActionWrapper{Config: step.Config}, nil
	case "assert":
		return &AssertActionWrapper{Config: step.Config}, nil
	default:
		return nil, fmt.Errorf("unknown step type: %s", step.Type)
	}
}

// evaluateCondition evaluates a condition expression using the expression engine
func (e *WorkflowExecutorImpl) evaluateCondition(expr string, ctx *ExecutionContext) bool {
	if expr == "" {
		return true
	}

	// 获取表达式求值器
	evaluator, ok := ctx.Evaluator.(*expression.Evaluator)
	if !ok {
		ctx.Logger.Error("", fmt.Sprintf("Invalid evaluator type"))
		return false
	}

	// 更新求值器的变量和输出（可能在执行过程中发生变化）
	evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

	// 求值布尔表达式
	result, err := evaluator.EvaluateBool(expr)
	if err != nil {
		ctx.Logger.Error("", fmt.Sprintf("Condition evaluation error: %v", err))
		return false
	}

	return result
}

// updateRunStatus updates the run status
func (e *WorkflowExecutorImpl) updateRunStatus(run *models.WorkflowRun, status, errorMsg string) {
	run.Status = status
	run.Error = errorMsg
	run.EndTime = time.Now()
	run.Duration = int(run.EndTime.Sub(run.StartTime).Milliseconds())
	e.db.Save(run)
}

// buildWorkflowResult builds the result from execution context
func (e *WorkflowExecutorImpl) buildWorkflowResult(ctx *ExecutionContext, run *models.WorkflowRun) *WorkflowResult {
	var stepExecutions []testcase.StepExecution
	var completedSteps, failedSteps int

	for stepID, result := range ctx.StepResults {
		stepExecutions = append(stepExecutions, testcase.StepExecution{
			StepID:     stepID,
			Status:     result.Status,
			Duration:   result.Duration,
			OutputData: result.Output,
			Error:      result.Error,
		})
		if result.Status == "success" {
			completedSteps++
		} else {
			failedSteps++
		}
	}

	// Build context with both variables and step outputs
	contextData := map[string]interface{}{
		"variables": ctx.Variables,
		"outputs":   ctx.StepOutputs,
	}

	return &WorkflowResult{
		RunID:          run.RunID,
		Status:         run.Status,
		StartTime:      run.StartTime,
		EndTime:        run.EndTime,
		Duration:       run.Duration,
		TotalSteps:     len(ctx.StepResults),
		CompletedSteps: completedSteps,
		FailedSteps:    failedSteps,
		StepExecutions: stepExecutions,
		Context:        contextData,
		Error:          run.Error,
	}
}

// Action wrappers for different step types

// TestCaseActionWrapper wraps test case execution
type TestCaseActionWrapper struct {
	TestID string
	Input  map[string]interface{}
}

func (a *TestCaseActionWrapper) Execute(ctx *ActionContext) (*ActionResult, error) {
	// Delegate to TestCaseAction in actions package
	ctx.Logger.Info(ctx.StepID, fmt.Sprintf("Executing test case: %s", a.TestID))

	// Load test case
	tc, err := ctx.TestCaseRepo.GetTestCase(a.TestID)
	if err != nil {
		return nil, err
	}

	// Convert to testcase.TestCase and execute
	testCase := &testcase.TestCase{
		ID:   tc.TestID,
		Name: tc.Name,
		Type: tc.Type,
	}

	// Apply HTTP/Command config based on type
	switch tc.Type {
	case "http":
		var httpConfig testcase.HTTPTest
		data, _ := json.Marshal(tc.HTTPConfig)
		json.Unmarshal(data, &httpConfig)
		testCase.HTTP = &httpConfig
	case "command":
		var cmdConfig testcase.CommandTest
		data, _ := json.Marshal(tc.CommandConfig)
		json.Unmarshal(data, &cmdConfig)
		testCase.Command = &cmdConfig
	}

	// Execute
	result := ctx.UnifiedExecutor.Execute(testCase)

	if result.Status != "passed" {
		return &ActionResult{
			Status: "failed",
			Error:  fmt.Errorf("test failed: %s", result.Error),
		}, nil
	}

	return &ActionResult{
		Status: "success",
		Output: map[string]interface{}{
			"status":   result.Status,
			"response": result.Response,
			"duration": result.Duration.Milliseconds(),
		},
		Duration: int(result.Duration.Milliseconds()),
	}, nil
}

func (a *TestCaseActionWrapper) Validate() error {
	if a.TestID == "" {
		return fmt.Errorf("testId is required")
	}
	return nil
}

// HTTPActionWrapper wraps HTTP execution
type HTTPActionWrapper struct {
	Config map[string]interface{}
}

func (a *HTTPActionWrapper) Execute(ctx *ActionContext) (*ActionResult, error) {
	// Handle nil UnifiedExecutor (for testing)
	if ctx.UnifiedExecutor == nil {
		return &ActionResult{
			Status: "success",
			Output: map[string]interface{}{"status": 200, "mock": true},
		}, nil
	}

	// Create HTTP test case and execute via UnifiedExecutor
	testCase := &testcase.TestCase{
		ID:   ctx.StepID,
		Name: ctx.StepID,
		Type: "http",
	}

	var httpConfig testcase.HTTPTest
	data, _ := json.Marshal(a.Config)
	json.Unmarshal(data, &httpConfig)
	testCase.HTTP = &httpConfig

	result := ctx.UnifiedExecutor.Execute(testCase)

	if result.Status != "passed" {
		return &ActionResult{
			Status: "failed",
			Error:  fmt.Errorf("HTTP request failed: %s", result.Error),
		}, nil
	}

	return &ActionResult{
		Status: "success",
		Output: map[string]interface{}{
			"status":   result.Status,
			"response": result.Response,
		},
		Duration: int(result.Duration.Milliseconds()),
	}, nil
}

func (a *HTTPActionWrapper) Validate() error {
	return nil
}

// CommandActionWrapper wraps command execution
type CommandActionWrapper struct {
	Config map[string]interface{}
}

func (a *CommandActionWrapper) Execute(ctx *ActionContext) (*ActionResult, error) {
	// Handle nil UnifiedExecutor (for testing)
	if ctx.UnifiedExecutor == nil {
		return &ActionResult{
			Status: "success",
			Output: map[string]interface{}{"exitCode": 0, "mock": true},
		}, nil
	}

	testCase := &testcase.TestCase{
		ID:   ctx.StepID,
		Name: ctx.StepID,
		Type: "command",
	}

	var cmdConfig testcase.CommandTest
	data, _ := json.Marshal(a.Config)
	json.Unmarshal(data, &cmdConfig)
	testCase.Command = &cmdConfig

	result := ctx.UnifiedExecutor.Execute(testCase)

	if result.Status != "passed" {
		return &ActionResult{
			Status: "failed",
			Error:  fmt.Errorf("command failed: %s", result.Error),
		}, nil
	}

	return &ActionResult{
		Status: "success",
		Output: map[string]interface{}{
			"status":   result.Status,
			"response": result.Response,
		},
		Duration: int(result.Duration.Milliseconds()),
	}, nil
}

func (a *CommandActionWrapper) Validate() error {
	return nil
}

// DatabaseActionWrapper wraps database action execution
type DatabaseActionWrapper struct {
	Config map[string]interface{}
}

func (a *DatabaseActionWrapper) Execute(ctx *ActionContext) (*ActionResult, error) {
	// Import the actions package types
	driver, _ := a.Config["driver"].(string)
	dsn, _ := a.Config["dsn"].(string)
	query, _ := a.Config["query"].(string)
	queryType, _ := a.Config["queryType"].(string)

	// For SQLite, convert relative paths to absolute paths
	if driver == "sqlite3" && dsn != "" {
		// Check if path is relative
		if !strings.HasPrefix(dsn, "/") && !strings.Contains(dsn, ":") {
			// Try to get absolute path
			cwd, err := os.Getwd()
			if err == nil {
				absPath := dsn
				if !strings.HasPrefix(dsn, "/") {
					absPath = cwd + "/" + strings.TrimPrefix(dsn, "./")
				}
				dsn = absPath
				ctx.Logger.Info(ctx.StepID, fmt.Sprintf("Resolved SQLite DSN to absolute path: %s", dsn))
			}
		}
	}

	// Create database action context
	dbCtx := &actions.DatabaseActionContext{
		Variables:   ctx.Variables,
		StepOutputs: ctx.StepOutputs,
		Logger:      ctx.Logger,
	}

	// Create and execute database action
	dbAction := &actions.DatabaseAction{
		Driver:    driver,
		DSN:       dsn,
		Query:     query,
		QueryType: queryType,
	}

	// Get args if present
	if args, ok := a.Config["args"].([]interface{}); ok {
		// Interpolate variables in args
		interpolatedArgs := make([]interface{}, len(args))
		for i, arg := range args {
			if argStr, ok := arg.(string); ok {
				// Check if it's a variable reference like {{varName}} or {{step.path}}
				if strings.HasPrefix(argStr, "{{") && strings.HasSuffix(argStr, "}}") {
					varName := strings.TrimSpace(argStr[2 : len(argStr)-2])

					// Check if it's a dotted path (e.g., stepName.field.subfield)
					if strings.Contains(varName, ".") {
						parts := strings.SplitN(varName, ".", 2)
						stepName := parts[0]
						fieldPath := parts[1]

						// Try to get from StepOutputs first
						if stepOutput, exists := ctx.StepOutputs[stepName]; exists {
							// Use gjson to navigate the path
							stepJSON, err := json.Marshal(stepOutput)
							if err == nil {
								result := gjson.GetBytes(stepJSON, fieldPath)
								if result.Exists() {
									interpolatedArgs[i] = result.Value()
									continue
								}
							}
						} else if varValue, exists := ctx.Variables[stepName]; exists {
							// Also try Variables with dotted path
							varJSON, err := json.Marshal(varValue)
							if err == nil {
								result := gjson.GetBytes(varJSON, fieldPath)
								if result.Exists() {
									interpolatedArgs[i] = result.Value()
									continue
								}
							}
						}
					} else {
						// Simple variable name without dots
						if val, exists := ctx.Variables[varName]; exists {
							interpolatedArgs[i] = val
							continue
						} else if val, exists := ctx.StepOutputs[varName]; exists {
							interpolatedArgs[i] = val
							continue
						}
					}
				}
			}
			// If no interpolation happened, keep original value
			interpolatedArgs[i] = arg
		}
		dbAction.Args = interpolatedArgs
	}

	result, err := dbAction.Execute(dbCtx)
	if err != nil {
		return &ActionResult{
			Status: "failed",
			Error:  err,
		}, nil
	}

	return &ActionResult{
		Status: "success",
		Output: result,
	}, nil
}

func (a *DatabaseActionWrapper) Validate() error {
	return nil
}

// ScriptActionWrapper wraps script action execution
type ScriptActionWrapper struct {
	Config map[string]interface{}
}

func (a *ScriptActionWrapper) Execute(ctx *ActionContext) (*ActionResult, error) {
	language, _ := a.Config["language"].(string)
	script, _ := a.Config["script"].(string)
	file, _ := a.Config["file"].(string)
	timeout, _ := a.Config["timeout"].(float64)

	// Create script action context
	scriptCtx := &actions.ScriptActionContext{
		Variables:   ctx.Variables,
		StepOutputs: ctx.StepOutputs,
		Logger:      ctx.Logger,
	}

	// Create and execute script action
	scriptAction := &actions.ScriptAction{
		Language: language,
		Script:   script,
		File:     file,
		Timeout:  int(timeout),
	}

	// Get args if present
	if args, ok := a.Config["args"].([]interface{}); ok {
		strArgs := make([]string, len(args))
		for i, arg := range args {
			strArgs[i] = fmt.Sprintf("%v", arg)
		}
		scriptAction.Args = strArgs
	}

	// Get env if present
	if env, ok := a.Config["env"].(map[string]interface{}); ok {
		envMap := make(map[string]string)
		for k, v := range env {
			envMap[k] = fmt.Sprintf("%v", v)
		}
		scriptAction.Env = envMap
	}

	result, err := scriptAction.Execute(scriptCtx)
	if err != nil {
		return &ActionResult{
			Status: "failed",
			Error:  err,
		}, nil
	}

	return &ActionResult{
		Status: "success",
		Output: result,
	}, nil
}

func (a *ScriptActionWrapper) Validate() error {
	return nil
}

// AssertActionWrapper wraps assert action execution
type AssertActionWrapper struct {
	Config map[string]interface{}
}

func (a *AssertActionWrapper) Execute(ctx *ActionContext) (*ActionResult, error) {
	// Create assert action context
	assertCtx := &actions.AssertActionContext{
		Variables:   ctx.Variables,
		StepOutputs: ctx.StepOutputs,
		Logger:      ctx.Logger,
	}

	// Parse assertions
	assertionsData, ok := a.Config["assertions"].([]interface{})
	if !ok {
		return &ActionResult{
			Status: "failed",
			Error:  fmt.Errorf("assertions configuration is missing or invalid"),
		}, nil
	}

	assertions := make([]actions.Assertion, len(assertionsData))
	for i, assertData := range assertionsData {
		assertMap, ok := assertData.(map[string]interface{})
		if !ok {
			continue
		}

		assertion := actions.Assertion{
			Type:     fmt.Sprintf("%v", assertMap["type"]),
			Actual:   assertMap["actual"],
			Expected: assertMap["expected"],
		}

		// Only set Path and Message if they are not nil
		if path, ok := assertMap["path"]; ok && path != nil {
			assertion.Path = fmt.Sprintf("%v", path)
		}
		if message, ok := assertMap["message"]; ok && message != nil {
			assertion.Message = fmt.Sprintf("%v", message)
		}

		assertions[i] = assertion
	}

	// Create and execute assert action
	assertAction := &actions.AssertAction{
		Assertions: assertions,
	}

	result, err := assertAction.Execute(assertCtx)
	if err != nil {
		return &ActionResult{
			Status: "failed",
			Error:  err,
			Output: result,
		}, nil
	}

	return &ActionResult{
		Status: "success",
		Output: result,
	}, nil
}

func (a *AssertActionWrapper) Validate() error {
	return nil
}

