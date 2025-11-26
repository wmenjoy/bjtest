package actions

import (
	"fmt"
	"testing"
)

func TestDatabaseAction_Validate(t *testing.T) {
	tests := []struct {
		name    string
		action  *DatabaseAction
		wantErr bool
	}{
		{
			name: "valid sqlite config",
			action: &DatabaseAction{
				Driver:    "sqlite3",
				DSN:       ":memory:",
				Query:     "SELECT 1",
				QueryType: "select",
			},
			wantErr: false,
		},
		{
			name: "missing driver",
			action: &DatabaseAction{
				DSN:       ":memory:",
				Query:     "SELECT 1",
				QueryType: "select",
			},
			wantErr: true,
		},
		{
			name: "missing dsn",
			action: &DatabaseAction{
				Driver:    "sqlite3",
				Query:     "SELECT 1",
				QueryType: "select",
			},
			wantErr: true,
		},
		{
			name: "missing query",
			action: &DatabaseAction{
				Driver:    "sqlite3",
				DSN:       ":memory:",
				QueryType: "select",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.action.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestScriptAction_Validate(t *testing.T) {
	tests := []struct {
		name    string
		action  *ScriptAction
		wantErr bool
	}{
		{
			name: "valid python script",
			action: &ScriptAction{
				Language: "python",
				Script:   "print('hello')",
			},
			wantErr: false,
		},
		{
			name: "valid javascript script",
			action: &ScriptAction{
				Language: "javascript",
				Script:   "console.log('hello')",
			},
			wantErr: false,
		},
		{
			name: "valid shell script",
			action: &ScriptAction{
				Language: "shell",
				Script:   "echo hello",
			},
			wantErr: false,
		},
		{
			name: "missing language",
			action: &ScriptAction{
				Script: "print('hello')",
			},
			wantErr: true,
		},
		{
			name: "missing script and file",
			action: &ScriptAction{
				Language: "python",
			},
			wantErr: true,
		},
		{
			name: "unsupported language",
			action: &ScriptAction{
				Language: "ruby",
				Script:   "puts 'hello'",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.action.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestAssertAction_Validate(t *testing.T) {
	tests := []struct {
		name    string
		action  *AssertAction
		wantErr bool
	}{
		{
			name: "valid assertions",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "equals", Actual: "test", Expected: "test"},
				},
			},
			wantErr: false,
		},
		{
			name: "empty assertions",
			action: &AssertAction{
				Assertions: []Assertion{},
			},
			wantErr: true,
		},
		{
			name: "assertion missing type",
			action: &AssertAction{
				Assertions: []Assertion{
					{Actual: "test", Expected: "test"},
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.action.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestAssertAction_Execute(t *testing.T) {
	tests := []struct {
		name    string
		action  *AssertAction
		ctx     *AssertActionContext
		wantErr bool
	}{
		{
			name: "equals assertion passes",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "equals", Actual: 42, Expected: 42},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: false,
		},
		{
			name: "equals assertion fails",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "equals", Actual: 42, Expected: 43},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: true,
		},
		{
			name: "contains assertion passes",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "contains", Actual: "hello world", Expected: "world"},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: false,
		},
		{
			name: "greaterThan assertion passes",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "greaterThan", Actual: 10, Expected: 5},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: false,
		},
		{
			name: "lessThan assertion passes",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "lessThan", Actual: 5, Expected: 10},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: false,
		},
		{
			name: "exists assertion passes",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "exists", Actual: "something"},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: false,
		},
		{
			name: "exists assertion fails",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "exists", Actual: nil},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: true,
		},
		{
			name: "regex assertion passes",
			action: &AssertAction{
				Assertions: []Assertion{
					{Type: "regex", Actual: "test@example.com", Expected: `^[a-z]+@[a-z]+\.[a-z]+$`},
				},
			},
			ctx:     &AssertActionContext{},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := tt.action.Execute(tt.ctx)
			if (err != nil) != tt.wantErr {
				t.Errorf("Execute() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr {
				if result["success"] != true {
					t.Errorf("Execute() success = %v, want true", result["success"])
				}
			}
		})
	}
}

func TestScriptAction_Execute_Python(t *testing.T) {
	action := &ScriptAction{
		Language: "python",
		Script:   "import json\nresult = {'message': 'Hello from Python', 'value': 42}\nprint(json.dumps(result))",
		Timeout:  5,
	}

	ctx := &ScriptActionContext{
		Variables:   map[string]interface{}{"test": "value"},
		StepOutputs: map[string]interface{}{},
	}

	result, err := action.Execute(ctx)
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}

	if result["success"] != true {
		t.Errorf("Execute() success = %v, want true", result["success"])
	}

	if result["exitCode"] != 0 {
		t.Errorf("Execute() exitCode = %v, want 0", result["exitCode"])
	}

	if output, ok := result["output"].(map[string]interface{}); ok {
		if output["message"] != "Hello from Python" {
			t.Errorf("Execute() output.message = %v, want 'Hello from Python'", output["message"])
		}
	} else {
		t.Error("Execute() output should be a map")
	}
}

func TestScriptAction_Execute_JavaScript(t *testing.T) {
	action := &ScriptAction{
		Language: "javascript",
		Script:   "const result = {message: 'Hello from JS', value: 42};\nconsole.log(JSON.stringify(result));",
		Timeout:  5,
	}

	ctx := &ScriptActionContext{
		Variables:   map[string]interface{}{"test": "value"},
		StepOutputs: map[string]interface{}{},
	}

	result, err := action.Execute(ctx)
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}

	if result["success"] != true {
		t.Errorf("Execute() success = %v, want true", result["success"])
	}

	if result["exitCode"] != 0 {
		t.Errorf("Execute() exitCode = %v, want 0", result["exitCode"])
	}
}

func TestDatabaseAction_Execute_SQLite(t *testing.T) {
	action := &DatabaseAction{
		Driver:    "sqlite3",
		DSN:       ":memory:",
		Query:     "SELECT 1 as num, 'test' as text",
		QueryType: "select",
	}

	ctx := &DatabaseActionContext{
		Variables:   map[string]interface{}{},
		StepOutputs: map[string]interface{}{},
	}

	result, err := action.Execute(ctx)
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}

	if result["success"] != true {
		t.Errorf("Execute() success = %v, want true", result["success"])
	}

	rows, ok := result["rows"].([]map[string]interface{})
	if !ok {
		t.Fatal("Execute() rows should be []map[string]interface{}")
	}

	if len(rows) != 1 {
		t.Errorf("Execute() row count = %v, want 1", len(rows))
	}

	// Note: SQLite returns integer as int64, not string
	numVal := fmt.Sprintf("%v", rows[0]["num"])
	if numVal != "1" {
		t.Errorf("Execute() rows[0][num] = %v, want '1'", rows[0]["num"])
	}

	if rows[0]["text"] != "test" {
		t.Errorf("Execute() rows[0][text] = %v, want 'test'", rows[0]["text"])
	}
}
