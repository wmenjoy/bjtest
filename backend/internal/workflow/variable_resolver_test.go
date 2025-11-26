package workflow

import (
	"testing"
)

// TestBuiltInTransforms tests all built-in transformation functions
func TestBuiltInTransforms(t *testing.T) {
	tests := []struct {
		name      string
		transform string
		input     interface{}
		expected  interface{}
	}{
		{
			name:      "uppercase string",
			transform: "uppercase",
			input:     "hello world",
			expected:  "HELLO WORLD",
		},
		{
			name:      "lowercase string",
			transform: "lowercase",
			input:     "HELLO WORLD",
			expected:  "hello world",
		},
		{
			name:      "trim whitespace",
			transform: "trim",
			input:     "  hello  ",
			expected:  "hello",
		},
		{
			name:      "parseInt from string",
			transform: "parseInt",
			input:     "123",
			expected:  123,
		},
		{
			name:      "parseInt from float",
			transform: "parseInt",
			input:     123.45,
			expected:  123,
		},
		{
			name:      "parseFloat from string",
			transform: "parseFloat",
			input:     "123.45",
			expected:  123.45,
		},
		{
			name:      "parseFloat from int",
			transform: "parseFloat",
			input:     123,
			expected:  float64(123),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			transformFunc, ok := builtInTransforms[tt.transform]
			if !ok {
				t.Fatalf("Transform function %s not found", tt.transform)
			}

			result := transformFunc(tt.input)
			if result != tt.expected {
				t.Errorf("Transform %s(%v) = %v, want %v", tt.transform, tt.input, result, tt.expected)
			}
		})
	}
}

// TestResolveDataMapper tests DataMapper resolution with JSONPath
func TestResolveDataMapper(t *testing.T) {
	resolver := NewVariableResolver()

	// Create a mock execution context with step results
	ctx := &ExecutionContext{
		StepResults: map[string]*StepExecutionResult{
			"step-login": {
				Status:   "success",
				Duration: 100,
				Output: map[string]interface{}{
					"response": map[string]interface{}{
						"body": map[string]interface{}{
							"token":  "abc123xyz",
							"userId": "user-001",
						},
						"status": 200,
					},
				},
			},
		},
	}

	tests := []struct {
		name        string
		mapper      DataMapper
		expected    interface{}
		expectError bool
	}{
		{
			name: "extract token without transform",
			mapper: DataMapper{
				ID:          "mapper-1",
				SourceStep:  "step-login",
				SourcePath:  "output.response.body.token",
				TargetParam: "authToken",
			},
			expected:    "abc123xyz",
			expectError: false,
		},
		{
			name: "extract token with uppercase transform",
			mapper: DataMapper{
				ID:          "mapper-2",
				SourceStep:  "step-login",
				SourcePath:  "output.response.body.token",
				TargetParam: "authToken",
				Transform:   "uppercase",
			},
			expected:    "ABC123XYZ",
			expectError: false,
		},
		{
			name: "extract status code with parseInt",
			mapper: DataMapper{
				ID:          "mapper-3",
				SourceStep:  "step-login",
				SourcePath:  "output.response.status",
				TargetParam: "statusCode",
				Transform:   "parseInt",
			},
			expected:    200,
			expectError: false,
		},
		{
			name: "non-existent source step",
			mapper: DataMapper{
				ID:          "mapper-4",
				SourceStep:  "step-nonexistent",
				SourcePath:  "output.token",
				TargetParam: "token",
			},
			expectError: true,
		},
		{
			name: "non-existent path",
			mapper: DataMapper{
				ID:          "mapper-5",
				SourceStep:  "step-login",
				SourcePath:  "output.nonexistent.path",
				TargetParam: "value",
			},
			expectError: true,
		},
		{
			name: "unknown transform function",
			mapper: DataMapper{
				ID:          "mapper-6",
				SourceStep:  "step-login",
				SourcePath:  "output.response.body.token",
				TargetParam: "token",
				Transform:   "unknown",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := resolver.resolveDataMapper(&tt.mapper, ctx)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			if result != tt.expected {
				t.Errorf("resolveDataMapper() = %v (type %T), want %v (type %T)",
					result, result, tt.expected, tt.expected)
			}
		})
	}
}

// TestResolveStepInputs tests step input resolution with DataMapper priority
func TestResolveStepInputs(t *testing.T) {
	resolver := NewVariableResolver()

	// Create execution context
	ctx := &ExecutionContext{
		Variables: map[string]interface{}{
			"baseURL": "https://api.example.com",
		},
		StepOutputs: map[string]interface{}{},
		StepResults: map[string]*StepExecutionResult{
			"step-login": {
				Status: "success",
				Output: map[string]interface{}{
					"response": map[string]interface{}{
						"body": map[string]interface{}{
							"token": "secret-token-123",
						},
					},
				},
			},
		},
	}

	// Create a step with both DataMappers and Inputs
	step := &WorkflowStep{
		ID:   "step-api-call",
		Name: "API Call",
		Type: "http",
		DataMappers: []DataMapper{
			{
				ID:          "mapper-1",
				SourceStep:  "step-login",
				SourcePath:  "output.response.body.token",
				TargetParam: "authToken",
				Transform:   "uppercase",
			},
		},
		Inputs: map[string]string{
			"url":       "{{baseURL}}/users",
			"authToken": "{{fallbackToken}}", // Should be overridden by DataMapper
			"method":    "GET",
		},
	}

	resolved, err := resolver.ResolveStepInputs(step, ctx)
	if err != nil {
		t.Fatalf("ResolveStepInputs failed: %v", err)
	}

	// Check that DataMapper takes priority
	if resolved["authToken"] != "SECRET-TOKEN-123" {
		t.Errorf("authToken = %v, want SECRET-TOKEN-123 (DataMapper should override Inputs)", resolved["authToken"])
	}

	// Check that Inputs are resolved when no DataMapper exists
	if resolved["url"] != "https://api.example.com/users" {
		t.Errorf("url = %v, want https://api.example.com/users", resolved["url"])
	}

	if resolved["method"] != "GET" {
		t.Errorf("method = %v, want GET", resolved["method"])
	}
}

// TestStepExecutionResultJSON tests JSON conversion of StepExecutionResult
func TestStepExecutionResultJSON(t *testing.T) {
	result := &StepExecutionResult{
		Status:   "success",
		Duration: 150,
		Output: map[string]interface{}{
			"response": map[string]interface{}{
				"body": map[string]interface{}{
					"message": "Hello World",
					"count":   42,
				},
				"status": 200,
			},
		},
		Error: "",
	}

	jsonStr, err := result.JSON()
	if err != nil {
		t.Fatalf("JSON() failed: %v", err)
	}

	// Verify JSON contains expected fields
	expectedFields := []string{
		`"status":"success"`,
		`"duration":150`,
		`"message":"Hello World"`,
		`"count":42`,
	}

	for _, field := range expectedFields {
		if !contains(jsonStr, field) {
			t.Errorf("JSON output missing expected field: %s\nGot: %s", field, jsonStr)
		}
	}
}

// TestExecutionContextGetStepResult tests GetStepResult method
func TestExecutionContextGetStepResult(t *testing.T) {
	ctx := &ExecutionContext{
		StepResults: map[string]*StepExecutionResult{
			"step-1": {
				Status:   "success",
				Duration: 100,
			},
			"step-2": {
				Status:   "failed",
				Duration: 50,
				Error:    "Connection timeout",
			},
		},
	}

	// Test existing step
	result := ctx.GetStepResult("step-1")
	if result == nil {
		t.Errorf("GetStepResult(step-1) returned nil")
	} else if result.Status != "success" {
		t.Errorf("GetStepResult(step-1).Status = %s, want success", result.Status)
	}

	// Test non-existent step
	result = ctx.GetStepResult("step-nonexistent")
	if result != nil {
		t.Errorf("GetStepResult(step-nonexistent) should return nil, got %v", result)
	}

	// Test nil StepResults map
	emptyCtx := &ExecutionContext{}
	result = emptyCtx.GetStepResult("step-1")
	if result != nil {
		t.Errorf("GetStepResult on empty context should return nil, got %v", result)
	}
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
