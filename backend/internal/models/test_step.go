package models

// TestStep represents a single test step with support for control flow (loops, branches)
// This structure is used within TestCase.Steps as JSON
type TestStep struct {
	// Basic identification
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"` // http, command, assert, branch, group

	// Step configuration - content depends on Type
	Config JSONB `json:"config,omitempty"`

	// Data flow - variable mappings
	Inputs  map[string]string `json:"inputs,omitempty"`  // Input variable mappings: source -> stepVar
	Outputs map[string]string `json:"outputs,omitempty"` // Output variable mappings: stepOutput -> targetVar

	// Control flow - conditional execution
	Condition string `json:"condition,omitempty"` // Expression that must be true to execute this step

	// Control flow - loop configuration
	Loop *LoopConfig `json:"loop,omitempty"`

	// Control flow - branching (for type: "branch")
	Branches []BranchConfig `json:"branches,omitempty"`

	// Nested steps (for loops with multiple steps or branch bodies)
	Children []TestStep `json:"children,omitempty"`

	// Step dependencies for DAG execution
	DependsOn []string `json:"dependsOn,omitempty"` // IDs of steps that must complete before this one

	// Error handling
	OnError      string `json:"onError,omitempty"`      // abort, continue, retry
	RetryCount   int    `json:"retryCount,omitempty"`   // Number of retry attempts
	RetryDelay   int    `json:"retryDelay,omitempty"`   // Delay between retries in milliseconds
	Timeout      int    `json:"timeout,omitempty"`      // Step timeout in seconds
	ContinueOnFail bool `json:"continueOnFail,omitempty"` // Continue to next step if this one fails

	// Metadata
	Description string   `json:"description,omitempty"` // Human-readable description
	Tags        []string `json:"tags,omitempty"`        // Tags for filtering and organization
	Disabled    bool     `json:"disabled,omitempty"`    // If true, skip this step during execution
}

// LoopConfig defines loop behavior for a test step
type LoopConfig struct {
	// Loop type: forEach, while, count
	Type string `json:"type"`

	// ForEach loop configuration
	Source   string `json:"source,omitempty"`   // Variable expression containing array to iterate: "{{userList}}"
	ItemVar  string `json:"itemVar,omitempty"`  // Variable name for current item: "item"
	IndexVar string `json:"indexVar,omitempty"` // Variable name for current index: "i"

	// While loop configuration
	Condition string `json:"condition,omitempty"` // Expression that must be true to continue: "{{hasMore}} == true"

	// Count loop configuration
	Count interface{} `json:"count,omitempty"` // Number of iterations: 5 or "{{retryCount}}"

	// Safety limits
	MaxIterations int `json:"maxIterations,omitempty"` // Maximum iterations allowed (default: 100)

	// Loop control
	BreakCondition    string `json:"breakCondition,omitempty"`    // Condition to break out of loop early
	ContinueCondition string `json:"continueCondition,omitempty"` // Condition to skip current iteration

	// Parallel execution within loop
	Parallel    bool `json:"parallel,omitempty"`    // Execute iterations in parallel
	Concurrency int  `json:"concurrency,omitempty"` // Max concurrent iterations when parallel is true
}

// BranchConfig defines a conditional branch in a branch step
type BranchConfig struct {
	// Condition to match this branch
	// Use "default" or empty string for the default branch
	Condition string `json:"condition"`

	// Human-readable label for this branch
	Label string `json:"label,omitempty"`

	// Steps to execute when this branch is selected
	Children []TestStep `json:"children"`

	// Branch priority (lower number = higher priority)
	Priority int `json:"priority,omitempty"`
}

// TestStepArray is a custom type for JSON array serialization of TestStep slices
// This allows GORM to properly serialize/deserialize TestStep arrays in database
type TestStepArray []TestStep

// StepType constants define the available step types
const (
	StepTypeHTTP    = "http"    // HTTP request step
	StepTypeCommand = "command" // Shell command step
	StepTypeAssert  = "assert"  // Assertion step
	StepTypeBranch  = "branch"  // Conditional branching step
	StepTypeGroup   = "group"   // Group of steps (for loops or organization)
	StepTypeDelay   = "delay"   // Delay/wait step
	StepTypeScript  = "script"  // Custom script execution step
	StepTypeGRPC    = "grpc"    // gRPC request step
	StepTypeSQL     = "sql"     // Database query step
)

// LoopType constants define the available loop types
const (
	LoopTypeForEach = "forEach" // Iterate over array
	LoopTypeWhile   = "while"   // Continue while condition is true
	LoopTypeCount   = "count"   // Fixed number of iterations
)

// OnErrorAction constants define error handling actions
const (
	OnErrorAbort    = "abort"    // Stop execution immediately
	OnErrorContinue = "continue" // Continue with next step
	OnErrorRetry    = "retry"    // Retry the failed step
)

// DefaultMaxIterations is the default safety limit for loops
const DefaultMaxIterations = 100

// HTTPStepConfig defines configuration for HTTP request steps
type HTTPStepConfig struct {
	Method  string            `json:"method"`            // GET, POST, PUT, DELETE, etc.
	URL     string            `json:"url"`               // Request URL (can contain variables)
	Headers map[string]string `json:"headers,omitempty"` // Request headers
	Body    interface{}       `json:"body,omitempty"`    // Request body (string or object)
	Auth    *AuthConfig       `json:"auth,omitempty"`    // Authentication configuration
	Timeout int               `json:"timeout,omitempty"` // Request timeout in seconds
}

// AuthConfig defines authentication configuration
type AuthConfig struct {
	Type   string `json:"type"`             // bearer, basic, api_key
	Token  string `json:"token,omitempty"`  // Bearer token or API key
	User   string `json:"user,omitempty"`   // Basic auth username
	Pass   string `json:"pass,omitempty"`   // Basic auth password
	Header string `json:"header,omitempty"` // Header name for API key
}

// CommandStepConfig defines configuration for command execution steps
type CommandStepConfig struct {
	Command    string            `json:"command"`              // Command to execute
	Args       []string          `json:"args,omitempty"`       // Command arguments
	WorkDir    string            `json:"workDir,omitempty"`    // Working directory
	Env        map[string]string `json:"env,omitempty"`        // Environment variables
	Shell      string            `json:"shell,omitempty"`      // Shell to use (bash, sh, etc.)
	Timeout    int               `json:"timeout,omitempty"`    // Command timeout in seconds
	IgnoreExit bool              `json:"ignoreExit,omitempty"` // Ignore non-zero exit codes
}

// AssertStepConfig defines configuration for assertion steps
type AssertStepConfig struct {
	Target   string      `json:"target"`             // Variable or expression to check
	Operator string      `json:"operator"`           // equals, notEquals, contains, exists, etc.
	Expected interface{} `json:"expected,omitempty"` // Expected value
	Message  string      `json:"message,omitempty"`  // Custom error message
}

// DelayStepConfig defines configuration for delay steps
type DelayStepConfig struct {
	Duration int    `json:"duration"`          // Delay duration in milliseconds
	Unit     string `json:"unit,omitempty"`    // ms, s, m (default: ms)
	Jitter   int    `json:"jitter,omitempty"`  // Random jitter to add (+/- milliseconds)
}
