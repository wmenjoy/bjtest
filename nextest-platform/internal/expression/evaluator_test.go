package expression

import (
	"strings"
	"testing"
)

func TestEvaluateString(t *testing.T) {
	tests := []struct {
		name      string
		expr      string
		variables map[string]interface{}
		want      string
		wantErr   bool
	}{
		{
			name: "simple variable substitution",
			expr: "Hello {{name}}!",
			variables: map[string]interface{}{
				"name": "World",
			},
			want:    "Hello World!",
			wantErr: false,
		},
		{
			name: "multiple variables",
			expr: "{{baseUrl}}/api/users/{{userId}}",
			variables: map[string]interface{}{
				"baseUrl": "https://api.example.com",
				"userId":  "123",
			},
			want:    "https://api.example.com/api/users/123",
			wantErr: false,
		},
		{
			name: "nested field access",
			expr: "User email: {{user.profile.email}}",
			variables: map[string]interface{}{
				"user": map[string]interface{}{
					"profile": map[string]interface{}{
						"email": "alice@example.com",
					},
				},
			},
			want:    "User email: alice@example.com",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evaluator := NewEvaluator(tt.variables, nil)
			got, err := evaluator.EvaluateString(tt.expr)
			if (err != nil) != tt.wantErr {
				t.Errorf("EvaluateString() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("EvaluateString() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestEvaluateBool(t *testing.T) {
	tests := []struct {
		name      string
		expr      string
		variables map[string]interface{}
		want      bool
		wantErr   bool
	}{
		{
			name: "equality check - true",
			expr: "{{userType === 'admin'}}",
			variables: map[string]interface{}{
				"userType": "admin",
			},
			want:    true,
			wantErr: false,
		},
		{
			name: "equality check - false",
			expr: "{{userType === 'admin'}}",
			variables: map[string]interface{}{
				"userType": "guest",
			},
			want:    false,
			wantErr: false,
		},
		{
			name: "greater than - true",
			expr: "{{amount > 100}}",
			variables: map[string]interface{}{
				"amount": 150,
			},
			want:    true,
			wantErr: false,
		},
		{
			name: "less than - false",
			expr: "{{amount < 100}}",
			variables: map[string]interface{}{
				"amount": 150,
			},
			want:    false,
			wantErr: false,
		},
		{
			name: "AND operator - true",
			expr: "{{amount > 10000 && userLevel === 'vip'}}",
			variables: map[string]interface{}{
				"amount":    15000,
				"userLevel": "vip",
			},
			want:    true,
			wantErr: false,
		},
		{
			name: "OR operator - true",
			expr: "{{userType === 'admin' || userType === 'manager'}}",
			variables: map[string]interface{}{
				"userType": "manager",
			},
			want:    true,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evaluator := NewEvaluator(tt.variables, nil)
			got, err := evaluator.EvaluateBool(tt.expr)
			if (err != nil) != tt.wantErr {
				t.Errorf("EvaluateBool() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("EvaluateBool() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestEvaluateToArray(t *testing.T) {
	tests := []struct {
		name      string
		expr      string
		variables map[string]interface{}
		wantLen   int
		wantErr   bool
	}{
		{
			name: "array variable",
			expr: "{{productIds}}",
			variables: map[string]interface{}{
				"productIds": []interface{}{"P001", "P002", "P003"},
			},
			wantLen: 3,
			wantErr: false,
		},
		{
			name: "empty array",
			expr: "{{items}}",
			variables: map[string]interface{}{
				"items": []interface{}{},
			},
			wantLen: 0,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evaluator := NewEvaluator(tt.variables, nil)
			got, err := evaluator.EvaluateToArray(tt.expr)
			if (err != nil) != tt.wantErr {
				t.Errorf("EvaluateToArray() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if len(got) != tt.wantLen {
				t.Errorf("EvaluateToArray() got length = %v, want %v", len(got), tt.wantLen)
			}
		})
	}
}

func TestBuiltinFunctions(t *testing.T) {
	evaluator := NewEvaluator(nil, nil)

	// Test $uuid()
	t.Run("$uuid", func(t *testing.T) {
		result, err := evaluator.Evaluate("{{$uuid()}}")
		if err != nil {
			t.Errorf("$uuid() error = %v", err)
		}
		uuid, ok := result.(string)
		if !ok {
			t.Errorf("$uuid() should return string, got %T", result)
		}
		if len(uuid) != 36 {
			t.Errorf("$uuid() length should be 36, got %d", len(uuid))
		}
	})

	// Test $now()
	t.Run("$now", func(t *testing.T) {
		result, err := evaluator.Evaluate("{{$now()}}")
		if err != nil {
			t.Errorf("$now() error = %v", err)
		}
		_, ok := result.(string)
		if !ok {
			t.Errorf("$now() should return string, got %T", result)
		}
	})

	// Test $isEmpty()
	t.Run("$isEmpty", func(t *testing.T) {
		evaluatorWithVar := NewEvaluator(map[string]interface{}{
			"emptyString": "",
			"nonEmpty":    "hello",
		}, nil)

		result, err := evaluatorWithVar.EvaluateBool("{{$isEmpty(emptyString)}}")
		if err != nil {
			t.Errorf("$isEmpty() error = %v", err)
		}
		if !result {
			t.Errorf("$isEmpty('') should return true")
		}

		result2, err := evaluatorWithVar.EvaluateBool("{{$isEmpty(nonEmpty)}}")
		if err != nil {
			t.Errorf("$isEmpty() error = %v", err)
		}
		if result2 {
			t.Errorf("$isEmpty('hello') should return false")
		}
	})
}

func TestNodeOutputReference(t *testing.T) {
	nodeOutputs := map[string]interface{}{
		"step1": map[string]interface{}{
			"status": 200,
			"user": map[string]interface{}{
				"id":   "123",
				"name": "Alice",
			},
		},
	}

	evaluator := NewEvaluator(nil, nodeOutputs)

	tests := []struct {
		name    string
		expr    string
		want    interface{}
		wantErr bool
	}{
		{
			name:    "simple node output",
			expr:    "{{nodes.step1.status}}",
			want:    200,
			wantErr: false,
		},
		{
			name:    "nested node output",
			expr:    "{{nodes.step1.user.name}}",
			want:    "Alice",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := evaluator.Evaluate(tt.expr)
			if (err != nil) != tt.wantErr {
				t.Errorf("Evaluate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("Evaluate() got = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestNodeOutputDotNotation tests that node outputs can be accessed with dot notation
// This test is for the fix where evaluateVariableReference now checks nodeOutputs
func TestNodeOutputDotNotation(t *testing.T) {
	nodeOutputs := map[string]interface{}{
		"createGroup": map[string]interface{}{
			"id":     "group-123",
			"status": 200,
			"data": map[string]interface{}{
				"name": "Test Group",
			},
		},
		"createUser": map[string]interface{}{
			"userId": "user-456",
			"email":  "test@example.com",
		},
	}

	variables := map[string]interface{}{
		"baseUrl": "http://localhost:8090",
	}

	evaluator := NewEvaluator(variables, nodeOutputs)

	tests := []struct {
		name    string
		expr    string
		want    interface{}
		wantErr bool
	}{
		{
			name:    "access step output with dot notation",
			expr:    "{{createGroup.status}}",
			want:    200,
			wantErr: false,
		},
		{
			name:    "access nested step output",
			expr:    "{{createGroup.data.name}}",
			want:    "Test Group",
			wantErr: false,
		},
		{
			name:    "access step output in string",
			expr:    "Status: {{createGroup.status}}",
			want:    "Status: 200",
			wantErr: false,
		},
		{
			name:    "multiple step outputs in string",
			expr:    "{{baseUrl}}/groups/{{createGroup.id}}",
			want:    "http://localhost:8090/groups/group-123",
			wantErr: false,
		},
		{
			name:    "access different step output",
			expr:    "{{createUser.email}}",
			want:    "test@example.com",
			wantErr: false,
		},
		{
			name:    "step output root",
			expr:    "{{createGroup.id}}",
			want:    "group-123",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var got interface{}
			var err error

			// Use EvaluateString for strings with multiple {{}} or text outside {{}}
			// Use Evaluate for single {{expression}}
			if strings.Count(tt.expr, "{{") > 1 {
				// Multiple variable references - use EvaluateString
				got, err = evaluator.EvaluateString(tt.expr)
			} else if strings.HasPrefix(tt.expr, "{{") && strings.HasSuffix(tt.expr, "}}") && strings.Count(tt.expr, "{{") == 1 {
				// Single variable reference wrapped in {{}} - use Evaluate
				got, err = evaluator.Evaluate(tt.expr)
			} else {
				// Text with embedded variables - use EvaluateString
				got, err = evaluator.EvaluateString(tt.expr)
			}

			if (err != nil) != tt.wantErr {
				t.Errorf("Evaluate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !deepEqualValues(got, tt.want) {
				t.Errorf("Evaluate() got = %v (type %T), want %v (type %T)", got, got, tt.want, tt.want)
			}
		})
	}
}

// deepEqualValues helper for comparing values
func deepEqualValues(a, b interface{}) bool {
	// Handle numeric comparisons
	switch va := a.(type) {
	case int:
		if vb, ok := b.(int); ok {
			return va == vb
		}
		if vb, ok := b.(float64); ok {
			return float64(va) == vb
		}
	case float64:
		if vb, ok := b.(float64); ok {
			return va == vb
		}
		if vb, ok := b.(int); ok {
			return va == float64(vb)
		}
	}
	return a == b
}

