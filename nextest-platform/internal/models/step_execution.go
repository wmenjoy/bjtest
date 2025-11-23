package models

import (
	"time"
)

// StepExecution represents the execution state and results of a single test step
// This structure tracks runtime information including loops and branches
type StepExecution struct {
	// Step identification
	StepID   string `json:"stepId"`
	StepName string `json:"stepName"`
	StepType string `json:"stepType,omitempty"` // http, command, assert, branch, group

	// Execution status
	Status string `json:"status"` // pending, running, passed, failed, skipped, cancelled

	// Timing information
	StartTime time.Time  `json:"startTime"`
	EndTime   *time.Time `json:"endTime,omitempty"`
	Duration  int64      `json:"duration,omitempty"` // Duration in milliseconds

	// Data flow
	Inputs  map[string]interface{} `json:"inputs,omitempty"`  // Resolved input values
	Outputs map[string]interface{} `json:"outputs,omitempty"` // Captured output values

	// Request/Response details (for HTTP steps)
	Request  *RequestSnapshot  `json:"request,omitempty"`
	Response *ResponseSnapshot `json:"response,omitempty"`

	// Loop execution details (when step has loop configuration)
	Loop *LoopExecution `json:"loop,omitempty"`

	// Branch execution details (when step is type: branch)
	Branch *BranchExecution `json:"branch,omitempty"`

	// Child step executions (for groups, loops, and branches)
	Children []StepExecution `json:"children,omitempty"`

	// Retry information
	RetryCount   int `json:"retryCount,omitempty"`   // Number of retries attempted
	RetryAttempt int `json:"retryAttempt,omitempty"` // Current retry attempt (0-based)

	// Error details
	Error     string `json:"error,omitempty"`     // Error message if failed
	ErrorType string `json:"errorType,omitempty"` // Type of error: timeout, assertion, network, etc.

	// Assertions results (for assert steps or inline assertions)
	Assertions []AssertionResult `json:"assertions,omitempty"`

	// Metadata
	Logs []StepLog `json:"logs,omitempty"` // Step-level log entries
}

// LoopExecution tracks the execution state of a loop
type LoopExecution struct {
	// Loop progress
	TotalIterations   int `json:"totalIterations"`   // Expected total iterations (may be unknown for while loops)
	CurrentIteration  int `json:"currentIteration"`  // Current iteration index (0-based)
	CompletedIterations int `json:"completedIterations"` // Number of completed iterations

	// Iteration results
	Iterations []IterationExecution `json:"iterations"`

	// Statistics
	PassedIterations  int `json:"passedIterations"`
	FailedIterations  int `json:"failedIterations"`
	SkippedIterations int `json:"skippedIterations"`

	// Loop exit information
	ExitReason string `json:"exitReason,omitempty"` // completed, break, maxIterations, error
	ExitValue  interface{} `json:"exitValue,omitempty"` // Value that caused exit (e.g., break condition)
}

// IterationExecution represents a single iteration within a loop
type IterationExecution struct {
	Index int `json:"index"` // Iteration index (0-based)

	// Loop variable values for this iteration
	ItemValue  interface{} `json:"itemValue,omitempty"`  // Current item value (forEach)
	IndexValue interface{} `json:"indexValue,omitempty"` // Current index value

	// Execution status
	Status    string     `json:"status"` // pending, running, passed, failed, skipped
	StartTime time.Time  `json:"startTime"`
	EndTime   *time.Time `json:"endTime,omitempty"`
	Duration  int64      `json:"duration,omitempty"` // Duration in milliseconds

	// Child step executions within this iteration
	Children []StepExecution `json:"children"`

	// Error information
	Error string `json:"error,omitempty"`

	// Variables captured during this iteration
	Variables map[string]interface{} `json:"variables,omitempty"`
}

// BranchExecution tracks which branch was selected and why
type BranchExecution struct {
	// Decision information
	Condition      string      `json:"condition"`               // The evaluated condition expression
	EvaluatedValue interface{} `json:"evaluatedValue,omitempty"` // The actual value that was evaluated

	// Selected branch
	SelectedBranch      string `json:"selectedBranch"`      // ID or label of selected branch
	SelectedBranchIndex int    `json:"selectedBranchIndex"` // Index of selected branch (0-based)
	IsDefaultBranch     bool   `json:"isDefaultBranch"`     // Whether default branch was selected

	// All evaluated conditions (for debugging)
	EvaluatedConditions []ConditionEvaluation `json:"evaluatedConditions,omitempty"`
}

// ConditionEvaluation represents the evaluation result of a single condition
type ConditionEvaluation struct {
	BranchLabel string      `json:"branchLabel"`
	Condition   string      `json:"condition"`
	Result      bool        `json:"result"`
	Value       interface{} `json:"value,omitempty"` // Actual value evaluated
	Error       string      `json:"error,omitempty"` // Error if evaluation failed
}

// AssertionResult represents the result of a single assertion
type AssertionResult struct {
	ID       string      `json:"id,omitempty"`
	Name     string      `json:"name,omitempty"`
	Type     string      `json:"type"`              // equals, notEquals, contains, exists, etc.
	Target   string      `json:"target"`            // Expression being checked
	Expected interface{} `json:"expected,omitempty"` // Expected value
	Actual   interface{} `json:"actual,omitempty"`   // Actual value
	Passed   bool        `json:"passed"`
	Message  string      `json:"message,omitempty"` // Error message if failed
}

// RequestSnapshot captures HTTP request details for debugging
type RequestSnapshot struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers,omitempty"`
	Body    interface{}       `json:"body,omitempty"`
	Size    int64             `json:"size,omitempty"` // Body size in bytes
}

// ResponseSnapshot captures HTTP response details for debugging
type ResponseSnapshot struct {
	StatusCode int               `json:"statusCode"`
	Status     string            `json:"status"`
	Headers    map[string]string `json:"headers,omitempty"`
	Body       interface{}       `json:"body,omitempty"`
	Size       int64             `json:"size,omitempty"` // Body size in bytes
	Time       int64             `json:"time,omitempty"` // Response time in milliseconds
}

// StepLog represents a log entry during step execution
type StepLog struct {
	Level     string    `json:"level"`     // debug, info, warn, error
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Data      JSONB     `json:"data,omitempty"` // Additional structured data
}

// StepExecutionStatus constants define the possible step execution statuses
const (
	StepStatusPending   = "pending"   // Step not yet started
	StepStatusRunning   = "running"   // Step currently executing
	StepStatusPassed    = "passed"    // Step completed successfully
	StepStatusFailed    = "failed"    // Step failed
	StepStatusSkipped   = "skipped"   // Step skipped (condition not met)
	StepStatusCancelled = "cancelled" // Step cancelled
	StepStatusTimeout   = "timeout"   // Step timed out
)

// LoopExitReason constants define reasons for loop termination
const (
	LoopExitCompleted      = "completed"      // All iterations completed
	LoopExitBreak          = "break"          // Break condition met
	LoopExitMaxIterations  = "maxIterations"  // Maximum iterations reached
	LoopExitError          = "error"          // Error during execution
	LoopExitConditionFalse = "conditionFalse" // While condition became false
)

// ErrorType constants for categorizing errors
const (
	ErrorTypeAssertion = "assertion" // Assertion failed
	ErrorTypeTimeout   = "timeout"   // Operation timed out
	ErrorTypeNetwork   = "network"   // Network error
	ErrorTypeScript    = "script"    // Script execution error
	ErrorTypeSystem    = "system"    // System error
	ErrorTypeUnknown   = "unknown"   // Unknown error type
)

// StepExecutionArray is a custom type for JSON array serialization
type StepExecutionArray []StepExecution

// TestCaseExecution represents the complete execution state of a test case
// This aggregates all step executions for a single test run
type TestCaseExecution struct {
	// Test identification
	TestID   string `json:"testId"`
	TestName string `json:"testName"`
	RunID    string `json:"runId"`

	// Overall status
	Status string `json:"status"` // pending, running, passed, failed, cancelled

	// Timing
	StartTime time.Time  `json:"startTime"`
	EndTime   *time.Time `json:"endTime,omitempty"`
	Duration  int64      `json:"duration,omitempty"` // Total duration in milliseconds

	// Step executions
	Steps []StepExecution `json:"steps"`

	// Global variables state
	Variables map[string]interface{} `json:"variables,omitempty"`

	// Summary statistics
	TotalSteps   int `json:"totalSteps"`
	PassedSteps  int `json:"passedSteps"`
	FailedSteps  int `json:"failedSteps"`
	SkippedSteps int `json:"skippedSteps"`

	// Error summary
	Errors []StepError `json:"errors,omitempty"`
}

// StepError represents an error that occurred during step execution
type StepError struct {
	StepID    string `json:"stepId"`
	StepName  string `json:"stepName"`
	Error     string `json:"error"`
	ErrorType string `json:"errorType"`
	Iteration int    `json:"iteration,omitempty"` // Loop iteration if applicable (-1 if not in loop)
}

// NewStepExecution creates a new StepExecution with default values
func NewStepExecution(stepID, stepName, stepType string) *StepExecution {
	return &StepExecution{
		StepID:   stepID,
		StepName: stepName,
		StepType: stepType,
		Status:   StepStatusPending,
		Inputs:   make(map[string]interface{}),
		Outputs:  make(map[string]interface{}),
	}
}

// Start marks the step execution as started
func (se *StepExecution) Start() {
	se.Status = StepStatusRunning
	se.StartTime = time.Now()
}

// Complete marks the step execution as completed with the given status
func (se *StepExecution) Complete(status string) {
	now := time.Now()
	se.EndTime = &now
	se.Status = status
	se.Duration = now.Sub(se.StartTime).Milliseconds()
}

// Fail marks the step execution as failed with an error message
func (se *StepExecution) Fail(err string, errType string) {
	se.Complete(StepStatusFailed)
	se.Error = err
	se.ErrorType = errType
}

// AddLog adds a log entry to the step execution
func (se *StepExecution) AddLog(level, message string, data JSONB) {
	se.Logs = append(se.Logs, StepLog{
		Level:     level,
		Message:   message,
		Timestamp: time.Now(),
		Data:      data,
	})
}

// NewLoopExecution creates a new LoopExecution
func NewLoopExecution(totalIterations int) *LoopExecution {
	return &LoopExecution{
		TotalIterations: totalIterations,
		CurrentIteration: 0,
		Iterations:      make([]IterationExecution, 0, totalIterations),
	}
}

// NewIterationExecution creates a new IterationExecution
func NewIterationExecution(index int, itemValue interface{}) *IterationExecution {
	return &IterationExecution{
		Index:     index,
		ItemValue: itemValue,
		Status:    StepStatusPending,
		Children:  make([]StepExecution, 0),
		Variables: make(map[string]interface{}),
	}
}
