package actions

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

// ScriptAction executes scripts in various languages
type ScriptAction struct {
	Language string                 `json:"language"` // python, javascript, shell
	Script   string                 `json:"script"`   // script content
	File     string                 `json:"file"`     // script file path (alternative to Script)
	Args     []string               `json:"args"`     // script arguments
	Env      map[string]string      `json:"env"`      // environment variables
	Timeout  int                    `json:"timeout"`  // timeout in seconds (default: 30)
	Context  map[string]interface{} `json:"context"`  // context variables to inject
}

// ScriptActionContext wraps action execution context
type ScriptActionContext struct {
	Variables   map[string]interface{}
	StepOutputs map[string]interface{}
	Logger      interface{}
}

// Execute executes the script action
func (a *ScriptAction) Execute(ctx *ScriptActionContext) (map[string]interface{}, error) {
	// Set default timeout
	timeout := a.Timeout
	if timeout == 0 {
		timeout = 30
	}

	var cmd *exec.Cmd
	var cleanup func()

	switch strings.ToLower(a.Language) {
	case "python", "python3":
		cmd, cleanup = a.preparePythonScript(ctx)
	case "javascript", "js", "node":
		cmd, cleanup = a.prepareJavaScriptScript(ctx)
	case "shell", "bash", "sh":
		cmd, cleanup = a.prepareShellScript()
	default:
		return nil, fmt.Errorf("unsupported language: %s", a.Language)
	}

	if cleanup != nil {
		defer cleanup()
	}

	// Set environment variables
	if a.Env != nil {
		for k, v := range a.Env {
			cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
		}
	}
	// Inherit current environment
	cmd.Env = append(cmd.Env, os.Environ()...)

	// Capture output
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Start command with timeout
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start script: %w", err)
	}

	// Wait with timeout
	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	select {
	case err := <-done:
		// Command completed
		result := make(map[string]interface{})
		result["stdout"] = stdout.String()
		result["stderr"] = stderr.String()
		result["success"] = err == nil

		if err != nil {
			result["error"] = err.Error()
			if exitErr, ok := err.(*exec.ExitError); ok {
				result["exitCode"] = exitErr.ExitCode()
			}
		} else {
			result["exitCode"] = 0
		}

		// Try to parse stdout as JSON
		stdoutStr := strings.TrimSpace(stdout.String())
		if stdoutStr != "" && (strings.HasPrefix(stdoutStr, "{") || strings.HasPrefix(stdoutStr, "[")) {
			var jsonOutput interface{}
			if json.Unmarshal([]byte(stdoutStr), &jsonOutput) == nil {
				result["output"] = jsonOutput
			}
		}

		return result, nil

	case <-time.After(time.Duration(timeout) * time.Second):
		// Timeout
		cmd.Process.Kill()
		return nil, fmt.Errorf("script execution timeout after %d seconds", timeout)
	}
}

// preparePythonScript prepares Python script execution
func (a *ScriptAction) preparePythonScript(ctx *ScriptActionContext) (*exec.Cmd, func()) {
	if a.File != "" {
		// Use existing file
		cmd := exec.Command("python3", append([]string{a.File}, a.Args...)...)
		return cmd, nil
	}

	// Create temporary file
	tmpFile, err := os.CreateTemp("", "script-*.py")
	if err != nil {
		return nil, nil
	}
	tmpPath := tmpFile.Name()

	// Inject context variables
	script := a.injectContext(a.Script, ctx)

	tmpFile.WriteString(script)
	tmpFile.Close()

	cmd := exec.Command("python3", append([]string{tmpPath}, a.Args...)...)
	cleanup := func() { os.Remove(tmpPath) }

	return cmd, cleanup
}

// prepareJavaScriptScript prepares JavaScript script execution
func (a *ScriptAction) prepareJavaScriptScript(ctx *ScriptActionContext) (*exec.Cmd, func()) {
	if a.File != "" {
		// Use existing file
		cmd := exec.Command("node", append([]string{a.File}, a.Args...)...)
		return cmd, nil
	}

	// Create temporary file
	tmpFile, err := os.CreateTemp("", "script-*.js")
	if err != nil {
		return nil, nil
	}
	tmpPath := tmpFile.Name()

	// Inject context variables
	script := a.injectContext(a.Script, ctx)

	tmpFile.WriteString(script)
	tmpFile.Close()

	cmd := exec.Command("node", append([]string{tmpPath}, a.Args...)...)
	cleanup := func() { os.Remove(tmpPath) }

	return cmd, cleanup
}

// prepareShellScript prepares shell script execution
func (a *ScriptAction) prepareShellScript() (*exec.Cmd, func()) {
	if a.File != "" {
		// Use existing file
		cmd := exec.Command("bash", append([]string{a.File}, a.Args...)...)
		return cmd, nil
	}

	// Create temporary file
	tmpFile, err := os.CreateTemp("", "script-*.sh")
	if err != nil {
		return nil, nil
	}
	tmpPath := tmpFile.Name()

	tmpFile.WriteString(a.Script)
	tmpFile.Close()

	// Make executable
	os.Chmod(tmpPath, 0755)

	cmd := exec.Command("bash", append([]string{tmpPath}, a.Args...)...)
	cleanup := func() { os.Remove(tmpPath) }

	return cmd, cleanup
}

// injectContext injects context variables into script
func (a *ScriptAction) injectContext(script string, ctx *ScriptActionContext) string {
	if ctx == nil {
		return script
	}

	// Combine variables and step outputs
	allVars := make(map[string]interface{})
	if ctx.Variables != nil {
		for k, v := range ctx.Variables {
			allVars[k] = v
		}
	}
	if ctx.StepOutputs != nil {
		for k, v := range ctx.StepOutputs {
			allVars[k] = v
		}
	}

	// For Python, inject as JSON
	if strings.ToLower(a.Language) == "python" || strings.ToLower(a.Language) == "python3" {
		contextJSON, _ := json.Marshal(allVars)
		injection := fmt.Sprintf("import json\ncontext = json.loads('%s')\n", string(contextJSON))
		return injection + script
	}

	// For JavaScript, inject as JSON
	if strings.ToLower(a.Language) == "javascript" || strings.ToLower(a.Language) == "js" || strings.ToLower(a.Language) == "node" {
		contextJSON, _ := json.Marshal(allVars)
		injection := fmt.Sprintf("const context = %s;\n", string(contextJSON))
		return injection + script
	}

	return script
}

// Validate validates the action configuration
func (a *ScriptAction) Validate() error {
	if a.Language == "" {
		return fmt.Errorf("language is required")
	}

	if a.Script == "" && a.File == "" {
		return fmt.Errorf("either script or file must be provided")
	}

	if a.File != "" {
		// Check if file exists
		if _, err := os.Stat(a.File); os.IsNotExist(err) {
			return fmt.Errorf("script file not found: %s", a.File)
		}
	}

	// Validate language
	supportedLanguages := []string{"python", "python3", "javascript", "js", "node", "shell", "bash", "sh"}
	found := false
	for _, lang := range supportedLanguages {
		if strings.ToLower(a.Language) == lang {
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("unsupported language: %s (supported: %v)", a.Language, supportedLanguages)
	}

	return nil
}

// ToJSON converts action to JSON
func (a *ScriptAction) ToJSON() ([]byte, error) {
	return json.Marshal(a)
}

// FromJSON creates action from JSON
func (a *ScriptAction) FromJSON(data []byte) error {
	return json.Unmarshal(data, a)
}
