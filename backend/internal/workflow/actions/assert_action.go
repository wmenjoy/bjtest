package actions

import (
	"encoding/json"
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/tidwall/gjson"
)

// AssertAction performs assertions on data
type AssertAction struct {
	Assertions []Assertion `json:"assertions"`
}

// Assertion represents a single assertion
type Assertion struct {
	Type     string      `json:"type"`     // equals, notEquals, contains, notContains, regex, jsonPath, exists, greaterThan, lessThan, arrayLength
	Actual   interface{} `json:"actual"`   // actual value or expression
	Expected interface{} `json:"expected"` // expected value
	Path     string      `json:"path"`     // JSON path for complex data
	Message  string      `json:"message"`  // custom error message
}

// AssertActionContext wraps action execution context
type AssertActionContext struct {
	Variables   map[string]interface{}
	StepOutputs map[string]interface{}
	Logger      interface{}
}

// Execute executes the assert action
func (a *AssertAction) Execute(ctx *AssertActionContext) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	var failedAssertions []string
	passedCount := 0

	for i, assertion := range a.Assertions {
		err := a.executeAssertion(&assertion, ctx)
		if err != nil {
			failedMsg := fmt.Sprintf("Assertion %d failed: %v", i+1, err)
			if assertion.Message != "" {
				failedMsg = fmt.Sprintf("Assertion %d (%s) failed: %v", i+1, assertion.Message, err)
			}
			failedAssertions = append(failedAssertions, failedMsg)
		} else {
			passedCount++
		}
	}

	result["totalAssertions"] = len(a.Assertions)
	result["passedAssertions"] = passedCount
	result["failedAssertions"] = len(failedAssertions)
	result["success"] = len(failedAssertions) == 0

	if len(failedAssertions) > 0 {
		result["failures"] = failedAssertions
		return result, fmt.Errorf("%d assertion(s) failed: %s", len(failedAssertions), strings.Join(failedAssertions, "; "))
	}

	return result, nil
}

// executeAssertion executes a single assertion
func (a *AssertAction) executeAssertion(assertion *Assertion, ctx *AssertActionContext) error {
	actual := assertion.Actual
	expected := assertion.Expected

	// Helper function to interpolate template strings
	interpolateValue := func(value interface{}) interface{} {
		if valStr, ok := value.(string); ok {
			if strings.HasPrefix(valStr, "{{") && strings.HasSuffix(valStr, "}}") {
				// Extract variable name
				varName := strings.TrimSpace(valStr[2 : len(valStr)-2])

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
								return result.Value()
							}
						}
					} else if varValue, exists := ctx.Variables[stepName]; exists {
						// Also try Variables with dotted path
						varJSON, err := json.Marshal(varValue)
						if err == nil {
							result := gjson.GetBytes(varJSON, fieldPath)
							if result.Exists() {
								return result.Value()
							}
						}
					}
				} else {
					// Simple variable name without dots
					// Try to get from variables first
					if val, exists := ctx.Variables[varName]; exists {
						return val
					} else if val, exists := ctx.StepOutputs[varName]; exists {
						return val
					}
				}
			}
		}
		return value
	}

	// Interpolate both actual and expected values
	actual = interpolateValue(actual)
	expected = interpolateValue(expected)

	// If path is specified, extract value using JSON path
	if assertion.Path != "" {
		actualJSON, err := json.Marshal(actual)
		if err != nil {
			return fmt.Errorf("failed to marshal actual value: %w", err)
		}
		result := gjson.GetBytes(actualJSON, assertion.Path)
		if !result.Exists() {
			return fmt.Errorf("path '%s' not found in data", assertion.Path)
		}
		actual = result.Value()
	}

	// Perform assertion based on type
	switch strings.ToLower(assertion.Type) {
	case "equals", "equal", "eq":
		return a.assertEquals(actual, expected)

	case "notequals", "notequal", "ne":
		if reflect.DeepEqual(actual, expected) {
			return fmt.Errorf("expected %v not to equal %v", actual, expected)
		}
		return nil

	case "contains":
		return a.assertContains(actual, expected)

	case "notcontains":
		err := a.assertContains(actual, expected)
		if err == nil {
			return fmt.Errorf("expected %v not to contain %v", actual, expected)
		}
		return nil

	case "regex", "regexp", "matches":
		return a.assertRegex(actual, expected)

	case "exists":
		if actual == nil {
			return fmt.Errorf("expected value to exist but got nil")
		}
		return nil

	case "notexists", "null":
		if actual != nil {
			return fmt.Errorf("expected value to be nil but got %v", actual)
		}
		return nil

	case "greaterthan", "gt":
		return a.assertGreaterThan(actual, expected)

	case "lessthan", "lt":
		return a.assertLessThan(actual, expected)

	case "greaterthanorequal", "gte":
		err := a.assertGreaterThan(actual, expected)
		if err != nil {
			return a.assertEquals(actual, expected)
		}
		return nil

	case "lessthanorequal", "lte":
		err := a.assertLessThan(actual, expected)
		if err != nil {
			return a.assertEquals(actual, expected)
		}
		return nil

	case "arraylength", "length":
		return a.assertArrayLength(actual, expected)

	case "typeof", "type":
		return a.assertType(actual, expected)

	default:
		return fmt.Errorf("unsupported assertion type: %s", assertion.Type)
	}
}

// assertEquals asserts equality
func (a *AssertAction) assertEquals(actual, expected interface{}) error {
	// Convert to comparable types
	actualStr := fmt.Sprintf("%v", actual)
	expectedStr := fmt.Sprintf("%v", expected)

	if actualStr != expectedStr {
		return fmt.Errorf("expected %v (type: %T) but got %v (type: %T)", expected, expected, actual, actual)
	}
	return nil
}

// assertContains asserts containment
func (a *AssertAction) assertContains(actual, expected interface{}) error {
	actualStr := fmt.Sprintf("%v", actual)
	expectedStr := fmt.Sprintf("%v", expected)

	if !strings.Contains(actualStr, expectedStr) {
		return fmt.Errorf("expected %v to contain %v", actual, expected)
	}
	return nil
}

// assertRegex asserts regex match
func (a *AssertAction) assertRegex(actual, expected interface{}) error {
	actualStr := fmt.Sprintf("%v", actual)
	pattern := fmt.Sprintf("%v", expected)

	matched, err := regexp.MatchString(pattern, actualStr)
	if err != nil {
		return fmt.Errorf("invalid regex pattern %s: %w", pattern, err)
	}

	if !matched {
		return fmt.Errorf("expected %v to match pattern %v", actual, pattern)
	}
	return nil
}

// assertGreaterThan asserts greater than
func (a *AssertAction) assertGreaterThan(actual, expected interface{}) error {
	actualNum, err := toFloat64(actual)
	if err != nil {
		return fmt.Errorf("actual value is not a number: %w", err)
	}

	expectedNum, err := toFloat64(expected)
	if err != nil {
		return fmt.Errorf("expected value is not a number: %w", err)
	}

	if actualNum <= expectedNum {
		return fmt.Errorf("expected %v to be greater than %v", actual, expected)
	}
	return nil
}

// assertLessThan asserts less than
func (a *AssertAction) assertLessThan(actual, expected interface{}) error {
	actualNum, err := toFloat64(actual)
	if err != nil {
		return fmt.Errorf("actual value is not a number: %w", err)
	}

	expectedNum, err := toFloat64(expected)
	if err != nil {
		return fmt.Errorf("expected value is not a number: %w", err)
	}

	if actualNum >= expectedNum {
		return fmt.Errorf("expected %v to be less than %v", actual, expected)
	}
	return nil
}

// assertArrayLength asserts array length
func (a *AssertAction) assertArrayLength(actual, expected interface{}) error {
	// Try to get length
	v := reflect.ValueOf(actual)
	if v.Kind() != reflect.Slice && v.Kind() != reflect.Array {
		return fmt.Errorf("expected array/slice but got %T", actual)
	}

	expectedLen, err := toInt(expected)
	if err != nil {
		return fmt.Errorf("expected length is not a number: %w", err)
	}

	actualLen := v.Len()
	if actualLen != expectedLen {
		return fmt.Errorf("expected array length %d but got %d", expectedLen, actualLen)
	}
	return nil
}

// assertType asserts type
func (a *AssertAction) assertType(actual, expected interface{}) error {
	expectedType := fmt.Sprintf("%v", expected)
	actualType := reflect.TypeOf(actual).String()

	// Normalize type names
	expectedType = strings.ToLower(expectedType)
	actualType = strings.ToLower(actualType)

	if !strings.Contains(actualType, expectedType) {
		return fmt.Errorf("expected type %s but got %s", expectedType, actualType)
	}
	return nil
}

// toFloat64 converts value to float64
func toFloat64(val interface{}) (float64, error) {
	switch v := val.(type) {
	case int:
		return float64(v), nil
	case int64:
		return float64(v), nil
	case float32:
		return float64(v), nil
	case float64:
		return v, nil
	case string:
		var f float64
		_, err := fmt.Sscanf(v, "%f", &f)
		return f, err
	default:
		return 0, fmt.Errorf("cannot convert %T to float64", val)
	}
}

// toInt converts value to int
func toInt(val interface{}) (int, error) {
	switch v := val.(type) {
	case int:
		return v, nil
	case int64:
		return int(v), nil
	case float64:
		return int(v), nil
	case string:
		var i int
		_, err := fmt.Sscanf(v, "%d", &i)
		return i, err
	default:
		return 0, fmt.Errorf("cannot convert %T to int", val)
	}
}

// Validate validates the action configuration
func (a *AssertAction) Validate() error {
	if len(a.Assertions) == 0 {
		return fmt.Errorf("at least one assertion is required")
	}

	for i, assertion := range a.Assertions {
		if assertion.Type == "" {
			return fmt.Errorf("assertion %d: type is required", i)
		}
	}

	return nil
}

// ToJSON converts action to JSON
func (a *AssertAction) ToJSON() ([]byte, error) {
	return json.Marshal(a)
}

// FromJSON creates action from JSON
func (a *AssertAction) FromJSON(data []byte) error {
	return json.Unmarshal(data, a)
}
