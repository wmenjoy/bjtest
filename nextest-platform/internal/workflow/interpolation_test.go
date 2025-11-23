package workflow

import (
	"testing"

	"test-management-service/internal/expression"
)

// TestInterpolateValue tests the interpolateValue method
func TestInterpolateValue(t *testing.T) {
	executor := &WorkflowExecutorImpl{}

	variables := map[string]interface{}{
		"baseUrl": "http://localhost:8090/api/v2",
		"dbPath":  "./data/test.db",
		"userId":  "test-user-001",
	}
	stepOutputs := map[string]interface{}{
		"createUser": map[string]interface{}{
			"id":     "user-123",
			"status": "created",
		},
	}

	evaluator := expression.NewEvaluator(variables, stepOutputs)

	tests := []struct {
		name     string
		input    interface{}
		expected interface{}
		wantErr  bool
	}{
		{
			name:     "Simple string variable",
			input:    "{{baseUrl}}",
			expected: "http://localhost:8090/api/v2",
			wantErr:  false,
		},
		{
			name:     "String with variable in middle",
			input:    "URL: {{baseUrl}}/users",
			expected: "URL: http://localhost:8090/api/v2/users",
			wantErr:  false,
		},
		{
			name:     "Multiple variables",
			input:    "{{baseUrl}}/users/{{userId}}",
			expected: "http://localhost:8090/api/v2/users/test-user-001",
			wantErr:  false,
		},
		{
			name:     "Step output reference",
			input:    "{{createUser.id}}",
			expected: "user-123",
			wantErr:  false,
		},
		{
			name:     "Non-string value (number)",
			input:    42,
			expected: 42,
			wantErr:  false,
		},
		{
			name:     "Non-string value (bool)",
			input:    true,
			expected: true,
			wantErr:  false,
		},
		{
			name:     "String without variables",
			input:    "plain text",
			expected: "plain text",
			wantErr:  false,
		},
		{
			name: "Map with variables",
			input: map[string]interface{}{
				"url":    "{{baseUrl}}/users",
				"userId": "{{userId}}",
				"count":  10,
			},
			expected: map[string]interface{}{
				"url":    "http://localhost:8090/api/v2/users",
				"userId": "test-user-001",
				"count":  10,
			},
			wantErr: false,
		},
		{
			name: "Array with variables",
			input: []interface{}{
				"{{userId}}",
				"{{dbPath}}",
				42,
			},
			expected: []interface{}{
				"test-user-001",
				"./data/test.db",
				42,
			},
			wantErr: false,
		},
		{
			name: "Nested map and array",
			input: map[string]interface{}{
				"config": map[string]interface{}{
					"url":  "{{baseUrl}}",
					"args": []interface{}{"{{userId}}", 123},
				},
			},
			expected: map[string]interface{}{
				"config": map[string]interface{}{
					"url":  "http://localhost:8090/api/v2",
					"args": []interface{}{"test-user-001", 123},
				},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := executor.interpolateValue(tt.input, evaluator)
			if (err != nil) != tt.wantErr {
				t.Errorf("interpolateValue() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !deepEqual(result, tt.expected) {
				t.Errorf("interpolateValue() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// TestInterpolateConfig tests the interpolateConfig method
func TestInterpolateConfig(t *testing.T) {
	executor := &WorkflowExecutorImpl{}

	variables := map[string]interface{}{
		"baseUrl": "http://localhost:8090/api/v2",
		"dbPath":  "./data/test.db",
		"groupId": "test-group-001",
	}
	stepOutputs := map[string]interface{}{}

	tests := []struct {
		name     string
		config   map[string]interface{}
		expected map[string]interface{}
		wantErr  bool
	}{
		{
			name: "HTTP action config",
			config: map[string]interface{}{
				"method": "POST",
				"url":    "{{baseUrl}}/groups",
				"headers": map[string]interface{}{
					"Content-Type": "application/json",
				},
				"body": map[string]interface{}{
					"group_id": "{{groupId}}",
					"name":     "Test Group",
				},
			},
			expected: map[string]interface{}{
				"method": "POST",
				"url":    "http://localhost:8090/api/v2/groups",
				"headers": map[string]interface{}{
					"Content-Type": "application/json",
				},
				"body": map[string]interface{}{
					"group_id": "test-group-001",
					"name":     "Test Group",
				},
			},
			wantErr: false,
		},
		{
			name: "Database action config",
			config: map[string]interface{}{
				"driver":    "sqlite3",
				"dsn":       "{{dbPath}}",
				"queryType": "select",
				"query":     "SELECT * FROM test_groups WHERE group_id = ?",
				"args":      []interface{}{"{{groupId}}"},
			},
			expected: map[string]interface{}{
				"driver":    "sqlite3",
				"dsn":       "./data/test.db",
				"queryType": "select",
				"query":     "SELECT * FROM test_groups WHERE group_id = ?",
				"args":      []interface{}{"test-group-001"},
			},
			wantErr: false,
		},
		{
			name:     "Nil config",
			config:   nil,
			expected: nil,
			wantErr:  false,
		},
		{
			name:     "Empty config",
			config:   map[string]interface{}{},
			expected: map[string]interface{}{},
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := executor.interpolateConfig(tt.config, variables, stepOutputs)
			if (err != nil) != tt.wantErr {
				t.Errorf("interpolateConfig() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !deepEqual(result, tt.expected) {
				t.Errorf("interpolateConfig() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// deepEqual compares two values recursively
func deepEqual(a, b interface{}) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}

	switch va := a.(type) {
	case map[string]interface{}:
		vb, ok := b.(map[string]interface{})
		if !ok {
			return false
		}
		if len(va) != len(vb) {
			return false
		}
		for key, valA := range va {
			valB, exists := vb[key]
			if !exists {
				return false
			}
			if !deepEqual(valA, valB) {
				return false
			}
		}
		return true

	case []interface{}:
		vb, ok := b.([]interface{})
		if !ok {
			return false
		}
		if len(va) != len(vb) {
			return false
		}
		for i := range va {
			if !deepEqual(va[i], vb[i]) {
				return false
			}
		}
		return true

	default:
		return a == b
	}
}
