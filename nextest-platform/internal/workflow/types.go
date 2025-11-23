package workflow

import (
	"time"

	"test-management-service/internal/models"
	"test-management-service/internal/testcase"
)

// WorkflowExecutor executes workflows
type WorkflowExecutor interface {
	Execute(workflowID string, workflowDef interface{}) (*WorkflowResult, error)
}

// WorkflowResult represents workflow execution result
type WorkflowResult struct {
	RunID          string
	Status         string // success, failed, cancelled
	StartTime      time.Time
	EndTime        time.Time
	Duration       int
	TotalSteps     int
	CompletedSteps int
	FailedSteps    int
	StepExecutions []testcase.StepExecution
	Context        map[string]interface{}
	Error          string
}

// Action interface for workflow steps
type Action interface {
	Execute(ctx *ActionContext) (*ActionResult, error)
	Validate() error
}

// ActionContext contains execution context for actions
type ActionContext struct {
	StepID          string
	Variables       map[string]interface{} // Global variables
	StepOutputs     map[string]interface{} // Step outputs
	TestCaseRepo    TestCaseRepository
	UnifiedExecutor *testcase.UnifiedTestExecutor
	Logger          StepLogger
}

// ActionResult represents action execution result
type ActionResult struct {
	Status   string // success, failed
	Output   map[string]interface{}
	Duration int
	Error    error
}

// StepLogger for step-level logging
type StepLogger interface {
	Debug(stepID, message string)
	Info(stepID, message string)
	Warn(stepID, message string)
	Error(stepID, message string)
}

// TestCaseRepository for loading test cases
type TestCaseRepository interface {
	GetTestCase(testID string) (*models.TestCase, error)
}

// WorkflowRepository for loading workflows
type WorkflowRepository interface {
	GetWorkflow(workflowID string) (*models.Workflow, error)
}

// ExecutionContext tracks workflow execution state
type ExecutionContext struct {
	RunID       string
	Variables   map[string]interface{}
	StepOutputs map[string]interface{}
	StepResults map[string]*StepExecutionResult
	Logger      StepLogger
	VarTracker  VariableChangeTracker

	// === 新增：表达式求值器 ===
	Evaluator   interface{} // *expression.Evaluator (使用interface避免循环依赖)
}

// StepExecutionResult tracks individual step results
type StepExecutionResult struct {
	Status   string
	Duration int
	Output   map[string]interface{}
	Error    string
}

// VariableChangeTracker tracks variable mutations
type VariableChangeTracker interface {
	Track(stepID, varName string, oldValue, newValue interface{}, changeType string)
}

// WorkflowStep represents a workflow step definition
type WorkflowStep struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Type      string                 `json:"type"` // http, command, test-case, loop, condition
	Config    map[string]interface{} `json:"config"`
	Input     map[string]interface{} `json:"input,omitempty"`
	Output    map[string]string      `json:"output,omitempty"`
	DependsOn []string               `json:"dependsOn,omitempty"`

	// === 条件执行 ===
	When      string                 `json:"when,omitempty"` // Condition expression

	// === 循环执行 ===
	LoopOver      string   `json:"loopOver,omitempty"`      // 循环集合表达式: "{{productIds}}"
	LoopVar       string   `json:"loopVar,omitempty"`       // 循环变量名: "currentProduct"
	LoopCondition string   `json:"loopCondition,omitempty"` // While循环条件: "{{hasMore}}"
	MaxIterations int      `json:"maxIterations,omitempty"` // 最大循环次数（安全限制）
	Parallel      bool     `json:"parallel,omitempty"`      // 是否并行执行循环
	MaxConcurrency int     `json:"maxConcurrency,omitempty"` // 最大并发数

	// === 树形结构（用于条件分支） ===
	Children     []string   `json:"children,omitempty"`     // 子节点（then分支）
	ElseChildren []string   `json:"elseChildren,omitempty"` // else分支

	// === 其他配置 ===
	Retry     *RetryConfig           `json:"retry,omitempty"`
	OnError   string                 `json:"onError,omitempty"` // abort, continue
}

// RetryConfig for retry logic
type RetryConfig struct {
	MaxAttempts int `json:"maxAttempts"`
	Interval    int `json:"interval"` // milliseconds
}

// WorkflowDefinition represents complete workflow
type WorkflowDefinition struct {
	Name      string                    `json:"name"`
	Version   string                    `json:"version"`
	Variables map[string]interface{}    `json:"variables"`
	Steps     map[string]*WorkflowStep  `json:"steps"`
}
