package workflow

import (
	"fmt"
	"regexp"
	"strings"
)

// VariableResolver handles variable interpolation in workflow configurations
// Supports {{variableName}} syntax for variable references
type VariableResolver struct {
	// varPattern matches {{variableName}} references
	varPattern *regexp.Regexp
}

// NewVariableResolver creates a new VariableResolver instance
func NewVariableResolver() *VariableResolver {
	return &VariableResolver{
		varPattern: regexp.MustCompile(`\{\{([^}]+)\}\}`),
	}
}

// Resolve resolves variable references in a string
// Supports both simple variables ({{var}}) and nested paths ({{step.field}})
// Returns the resolved value as interface{} to preserve type information
func (r *VariableResolver) Resolve(input string, ctx *ExecutionContext) interface{} {
	// Find all {{variable}} references
	matches := r.varPattern.FindAllStringSubmatch(input, -1)

	if len(matches) == 0 {
		// No variable references found, return original value
		return input
	}

	// If the entire string is a single variable reference, return the actual value (preserve type)
	if len(matches) == 1 && matches[0][0] == input {
		varName := strings.TrimSpace(matches[0][1])
		value := r.getVariableValue(varName, ctx)
		if value != nil {
			return value
		}
		return ""
	}

	// Multiple references or mixed content - do string substitution
	result := input
	for _, match := range matches {
		placeholder := match[0] // "{{variable}}"
		varName := strings.TrimSpace(match[1])     // "variable"

		// Get variable value from context
		value := r.getVariableValue(varName, ctx)
		if value == nil {
			value = ""
		}

		// Replace placeholder with string representation of value
		result = strings.ReplaceAll(result, placeholder, fmt.Sprintf("%v", value))
	}

	return result
}

// ResolveMap recursively resolves variables in a map
func (r *VariableResolver) ResolveMap(config map[string]interface{}, ctx *ExecutionContext) map[string]interface{} {
	if config == nil {
		return nil
	}

	result := make(map[string]interface{})
	for key, value := range config {
		result[key] = r.ResolveValue(value, ctx)
	}

	return result
}

// ResolveValue recursively resolves variables in any value type
func (r *VariableResolver) ResolveValue(value interface{}, ctx *ExecutionContext) interface{} {
	switch v := value.(type) {
	case string:
		// Resolve string variables
		return r.Resolve(v, ctx)
	case map[string]interface{}:
		// Recursively resolve map values
		return r.ResolveMap(v, ctx)
	case []interface{}:
		// Recursively resolve array elements
		result := make([]interface{}, len(v))
		for i, item := range v {
			result[i] = r.ResolveValue(item, ctx)
		}
		return result
	default:
		// Return non-string values as-is
		return value
	}
}

// getVariableValue retrieves a variable value from the execution context
// Supports dotted paths like "step.field.subfield"
func (r *VariableResolver) getVariableValue(varName string, ctx *ExecutionContext) interface{} {
	// Check if it's a dotted path (e.g., stepName.field.subfield)
	if strings.Contains(varName, ".") {
		parts := strings.SplitN(varName, ".", 2)
		stepName := parts[0]
		fieldPath := parts[1]

		// Try to get from StepOutputs first
		if stepOutput, exists := ctx.StepOutputs[stepName]; exists {
			return navigatePath(stepOutput, fieldPath)
		}

		// Then try Variables
		if varValue, exists := ctx.Variables[stepName]; exists {
			return navigatePath(varValue, fieldPath)
		}

		return nil
	}

	// Simple variable name without dots
	// Check Variables first
	if val, exists := ctx.Variables[varName]; exists {
		return val
	}

	// Then check StepOutputs
	if val, exists := ctx.StepOutputs[varName]; exists {
		return val
	}

	return nil
}

// navigatePath navigates a nested structure using dot notation
// e.g., navigatePath({"user": {"id": 123}}, "user.id") returns 123
func navigatePath(data interface{}, path string) interface{} {
	parts := strings.Split(path, ".")
	current := data

	for _, part := range parts {
		switch v := current.(type) {
		case map[string]interface{}:
			var exists bool
			current, exists = v[part]
			if !exists {
				return nil
			}
		default:
			return nil
		}
	}

	return current
}
