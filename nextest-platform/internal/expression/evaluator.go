package expression

import (
	"encoding/json"
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Evaluator evaluates expressions with variable substitution
type Evaluator struct {
	variables   map[string]interface{}
	nodeOutputs map[string]interface{}
}

// NewEvaluator creates a new evaluator
func NewEvaluator(variables, nodeOutputs map[string]interface{}) *Evaluator {
	if variables == nil {
		variables = make(map[string]interface{})
	}
	if nodeOutputs == nil {
		nodeOutputs = make(map[string]interface{})
	}
	return &Evaluator{
		variables:   variables,
		nodeOutputs: nodeOutputs,
	}
}

// EvaluateString replaces {{}} placeholders in a string
func (e *Evaluator) EvaluateString(expr string) (string, error) {
	// 正则匹配 {{expression}}
	re := regexp.MustCompile(`\{\{([^}]+)\}\}`)

	result := re.ReplaceAllStringFunc(expr, func(match string) string {
		// 提取表达式内容
		innerExpr := strings.TrimSpace(match[2 : len(match)-2])

		// 求值
		value, err := e.evaluateExpression(innerExpr)
		if err != nil {
			return match // 保持原样如果求值失败
		}

		// 转换为字符串
		return fmt.Sprintf("%v", value)
	})

	return result, nil
}

// Evaluate evaluates an expression and returns the value
func (e *Evaluator) Evaluate(expr string) (interface{}, error) {
	// 如果没有{{}}包裹，直接尝试求值
	expr = strings.TrimSpace(expr)

	if strings.HasPrefix(expr, "{{") && strings.HasSuffix(expr, "}}") {
		innerExpr := strings.TrimSpace(expr[2 : len(expr)-2])
		return e.evaluateExpression(innerExpr)
	}

	// 如果包含{{}}，执行字符串替换
	if strings.Contains(expr, "{{") {
		return e.EvaluateString(expr)
	}

	// 否则返回原始字符串
	return expr, nil
}

// EvaluateBool evaluates an expression as boolean
func (e *Evaluator) EvaluateBool(expr string) (bool, error) {
	result, err := e.Evaluate(expr)
	if err != nil {
		return false, err
	}

	// 转换为布尔值
	switch v := result.(type) {
	case bool:
		return v, nil
	case string:
		return v == "true" || v == "1", nil
	case int, int64, float64:
		return v != 0, nil
	default:
		return false, fmt.Errorf("cannot convert %T to bool", result)
	}
}

// evaluateExpression evaluates a single expression (without {{}})
func (e *Evaluator) evaluateExpression(expr string) (interface{}, error) {
	expr = strings.TrimSpace(expr)

	// 1. 内置函数
	if strings.HasPrefix(expr, "$") {
		return e.evaluateBuiltinFunction(expr)
	}

	// 2. 节点输出引用: nodes.nodeId.output.field
	if strings.HasPrefix(expr, "nodes.") {
		return e.evaluateNodeOutput(expr)
	}

	// 3. 上一节点输出: $prev.field
	if strings.HasPrefix(expr, "$prev.") {
		return e.evaluatePrevOutput(expr)
	}

	// 4. 循环变量: $loopIndex, $loopCount, etc
	if strings.HasPrefix(expr, "$loop") {
		return e.evaluateLoopVariable(expr)
	}

	// 5. 简单变量引用
	if !strings.Contains(expr, " ") && !strings.Contains(expr, "(") {
		return e.evaluateVariableReference(expr)
	}

	// 6. 复杂表达式（包含运算符）
	return e.evaluateComplexExpression(expr)
}

// evaluateBuiltinFunction evaluates built-in functions
func (e *Evaluator) evaluateBuiltinFunction(funcCall string) (interface{}, error) {
	// 移除参数的括号
	funcName := funcCall
	args := ""
	if idx := strings.Index(funcCall, "("); idx != -1 {
		funcName = funcCall[:idx]
		args = funcCall[idx+1 : len(funcCall)-1]
	}

	switch funcName {
	case "$now":
		return time.Now().Format(time.RFC3339), nil
	case "$uuid":
		return uuid.New().String(), nil
	case "$timestamp":
		return time.Now().Unix(), nil
	case "$isEmpty":
		if args == "" {
			return true, nil
		}
		val, err := e.evaluateExpression(args)
		if err != nil {
			return false, err
		}
		return isEmptyValue(val), nil
	case "$isNotEmpty":
		if args == "" {
			return false, nil
		}
		val, err := e.evaluateExpression(args)
		if err != nil {
			return false, err
		}
		return !isEmptyValue(val), nil
	default:
		return nil, fmt.Errorf("unknown function: %s", funcName)
	}
}

// evaluateNodeOutput evaluates node output reference
func (e *Evaluator) evaluateNodeOutput(expr string) (interface{}, error) {
	// Format: nodes.nodeId.output.field.subfield
	parts := strings.Split(expr, ".")
	if len(parts) < 3 {
		return nil, fmt.Errorf("invalid node output reference: %s", expr)
	}

	nodeID := parts[1]
	nodeOutput, exists := e.nodeOutputs[nodeID]
	if !exists {
		return nil, fmt.Errorf("node output not found: %s", nodeID)
	}

	// 遍历剩余路径
	return navigatePath(nodeOutput, parts[2:])
}

// evaluatePrevOutput evaluates previous node output
func (e *Evaluator) evaluatePrevOutput(expr string) (interface{}, error) {
	// Format: $prev.field.subfield
	prevOutput, exists := e.variables["$prev"]
	if !exists {
		return nil, fmt.Errorf("no previous output available")
	}

	if expr == "$prev" {
		return prevOutput, nil
	}

	parts := strings.Split(expr, ".")[1:]
	return navigatePath(prevOutput, parts)
}

// evaluateLoopVariable evaluates loop-specific variables
func (e *Evaluator) evaluateLoopVariable(expr string) (interface{}, error) {
	if val, exists := e.variables[expr]; exists {
		return val, nil
	}
	return nil, fmt.Errorf("loop variable not found: %s", expr)
}

// evaluateVariableReference evaluates simple variable reference
func (e *Evaluator) evaluateVariableReference(varName string) (interface{}, error) {
	// 支持嵌套字段访问: user.profile.email
	if strings.Contains(varName, ".") {
		parts := strings.Split(varName, ".")
		rootVar := parts[0]

		// Try variables first
		if val, exists := e.variables[rootVar]; exists {
			return navigatePath(val, parts[1:])
		}

		// Try node outputs second
		if val, exists := e.nodeOutputs[rootVar]; exists {
			return navigatePath(val, parts[1:])
		}

		return nil, fmt.Errorf("variable not found: %s", rootVar)
	}

	// 简单变量 - try variables first
	if val, exists := e.variables[varName]; exists {
		return val, nil
	}

	// Try node outputs second
	if val, exists := e.nodeOutputs[varName]; exists {
		return val, nil
	}

	return nil, fmt.Errorf("variable not found: %s", varName)
}

// evaluateComplexExpression evaluates expressions with operators
func (e *Evaluator) evaluateComplexExpression(expr string) (interface{}, error) {
	// 运算符优先级顺序（从低到高）
	// 先处理低优先级运算符
	operatorGroups := [][]string{
		{"||"},        // 逻辑或（最低优先级）
		{"&&"},        // 逻辑与
		{"===", "!==", "==", "!="}, // 相等性比较
		{">=", "<=", ">", "<"},     // 关系比较
	}

	for _, operators := range operatorGroups {
		for _, op := range operators {
			// 使用更智能的分割方法，避免拆分引号内的内容
			if index := findOperatorIndex(expr, op); index != -1 {
				return e.evaluateBinaryOperation(expr, op)
			}
		}
	}

	// 如果没有运算符，尝试作为变量引用
	return e.evaluateVariableReference(expr)
}

// findOperatorIndex finds the index of an operator, ignoring quoted strings
func findOperatorIndex(expr, operator string) int {
	inSingleQuote := false
	inDoubleQuote := false

	for i := 0; i < len(expr); i++ {
		char := expr[i]

		// 跟踪引号状态
		if char == '\'' && (i == 0 || expr[i-1] != '\\') {
			inSingleQuote = !inSingleQuote
			continue
		}
		if char == '"' && (i == 0 || expr[i-1] != '\\') {
			inDoubleQuote = !inDoubleQuote
			continue
		}

		// 如果不在引号内，检查是否匹配运算符
		if !inSingleQuote && !inDoubleQuote {
			if i+len(operator) <= len(expr) && expr[i:i+len(operator)] == operator {
				return i
			}
		}
	}

	return -1
}

// evaluateBinaryOperation evaluates binary operations
func (e *Evaluator) evaluateBinaryOperation(expr, operator string) (interface{}, error) {
	// 使用findOperatorIndex找到运算符位置
	index := findOperatorIndex(expr, operator)
	if index == -1 {
		return nil, fmt.Errorf("operator not found: %s", operator)
	}

	leftStr := strings.TrimSpace(expr[:index])
	rightStr := strings.TrimSpace(expr[index+len(operator):])

	// 处理字符串字面量（单引号或双引号）
	left, err := e.evaluateOperand(leftStr)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate left operand: %w", err)
	}

	right, err := e.evaluateOperand(rightStr)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate right operand: %w", err)
	}

	// 执行运算
	switch operator {
	case "===", "==":
		return compareEqual(left, right), nil
	case "!==", "!=":
		return !compareEqual(left, right), nil
	case ">":
		return compareGreater(left, right)
	case "<":
		return compareLess(left, right)
	case ">=":
		return compareGreaterOrEqual(left, right)
	case "<=":
		return compareLessOrEqual(left, right)
	case "&&":
		leftBool := toBool(left)
		rightBool := toBool(right)
		return leftBool && rightBool, nil
	case "||":
		leftBool := toBool(left)
		rightBool := toBool(right)
		return leftBool || rightBool, nil
	default:
		return nil, fmt.Errorf("unsupported operator: %s", operator)
	}
}

// evaluateOperand evaluates a single operand (variable or literal)
func (e *Evaluator) evaluateOperand(operand string) (interface{}, error) {
	operand = strings.TrimSpace(operand)

	// 字符串字面量（单引号）
	if strings.HasPrefix(operand, "'") && strings.HasSuffix(operand, "'") {
		return operand[1 : len(operand)-1], nil
	}

	// 字符串字面量（双引号）
	if strings.HasPrefix(operand, "\"") && strings.HasSuffix(operand, "\"") {
		return operand[1 : len(operand)-1], nil
	}

	// 数字字面量
	if num, err := strconv.ParseFloat(operand, 64); err == nil {
		return num, nil
	}

	// 布尔字面量
	if operand == "true" {
		return true, nil
	}
	if operand == "false" {
		return false, nil
	}

	// null字面量
	if operand == "null" {
		return nil, nil
	}

	// 否则作为表达式求值
	return e.evaluateExpression(operand)
}

// navigatePath navigates nested object/map by path
func navigatePath(obj interface{}, path []string) (interface{}, error) {
	current := obj

	for _, key := range path {
		// Check if key contains array index notation like "rows[0]"
		if strings.Contains(key, "[") && strings.HasSuffix(key, "]") {
			// Split field name and array index
			openBracket := strings.Index(key, "[")
			fieldName := key[:openBracket]
			indexStr := key[openBracket+1 : len(key)-1]

			// First navigate to the field
			switch v := current.(type) {
			case map[string]interface{}:
				val, exists := v[fieldName]
				if !exists {
					return nil, fmt.Errorf("field not found: %s", fieldName)
				}
				current = val
			default:
				// 使用反射访问结构体字段
				val := reflect.ValueOf(current)
				if val.Kind() == reflect.Ptr {
					val = val.Elem()
				}
				if val.Kind() != reflect.Struct {
					return nil, fmt.Errorf("cannot access field %s on type %T", fieldName, current)
				}

				field := val.FieldByName(fieldName)
				if !field.IsValid() {
					return nil, fmt.Errorf("field not found: %s", fieldName)
				}
				current = field.Interface()
			}

			// Then handle the array index
			index, err := strconv.Atoi(indexStr)
			if err != nil {
				return nil, fmt.Errorf("invalid array index: %s", indexStr)
			}

			// 转换为slice
			val := reflect.ValueOf(current)
			if val.Kind() != reflect.Slice && val.Kind() != reflect.Array {
				return nil, fmt.Errorf("not an array: %T", current)
			}

			if index < 0 || index >= val.Len() {
				return nil, fmt.Errorf("array index out of bounds: %d", index)
			}

			current = val.Index(index).Interface()
			continue
		}

		// 处理数组索引 (standalone like "[0]")
		if strings.HasPrefix(key, "[") && strings.HasSuffix(key, "]") {
			indexStr := key[1 : len(key)-1]
			index, err := strconv.Atoi(indexStr)
			if err != nil {
				return nil, fmt.Errorf("invalid array index: %s", key)
			}

			// 转换为slice
			val := reflect.ValueOf(current)
			if val.Kind() != reflect.Slice && val.Kind() != reflect.Array {
				return nil, fmt.Errorf("not an array: %T", current)
			}

			if index < 0 || index >= val.Len() {
				return nil, fmt.Errorf("array index out of bounds: %d", index)
			}

			current = val.Index(index).Interface()
			continue
		}

		// 处理对象字段
		switch v := current.(type) {
		case map[string]interface{}:
			val, exists := v[key]
			if !exists {
				return nil, fmt.Errorf("field not found: %s", key)
			}
			current = val
		default:
			// 使用反射访问结构体字段
			val := reflect.ValueOf(current)
			if val.Kind() == reflect.Ptr {
				val = val.Elem()
			}
			if val.Kind() != reflect.Struct {
				return nil, fmt.Errorf("cannot access field %s on type %T", key, current)
			}

			field := val.FieldByName(key)
			if !field.IsValid() {
				return nil, fmt.Errorf("field not found: %s", key)
			}
			current = field.Interface()
		}
	}

	return current, nil
}

// Helper functions for comparison
func compareEqual(a, b interface{}) bool {
	// 特殊处理字符串和数字
	aStr := fmt.Sprintf("%v", a)
	bStr := fmt.Sprintf("%v", b)
	return aStr == bStr
}

func compareGreater(a, b interface{}) (bool, error) {
	aNum, err := toNumber(a)
	if err != nil {
		return false, err
	}
	bNum, err := toNumber(b)
	if err != nil {
		return false, err
	}
	return aNum > bNum, nil
}

func compareLess(a, b interface{}) (bool, error) {
	aNum, err := toNumber(a)
	if err != nil {
		return false, err
	}
	bNum, err := toNumber(b)
	if err != nil {
		return false, err
	}
	return aNum < bNum, nil
}

func compareGreaterOrEqual(a, b interface{}) (bool, error) {
	aNum, err := toNumber(a)
	if err != nil {
		return false, err
	}
	bNum, err := toNumber(b)
	if err != nil {
		return false, err
	}
	return aNum >= bNum, nil
}

func compareLessOrEqual(a, b interface{}) (bool, error) {
	aNum, err := toNumber(a)
	if err != nil {
		return false, err
	}
	bNum, err := toNumber(b)
	if err != nil {
		return false, err
	}
	return aNum <= bNum, nil
}

func toNumber(val interface{}) (float64, error) {
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
		return strconv.ParseFloat(v, 64)
	default:
		return 0, fmt.Errorf("cannot convert %T to number", val)
	}
}

func toBool(val interface{}) bool {
	switch v := val.(type) {
	case bool:
		return v
	case int, int64, float64:
		return v != 0
	case string:
		return v != "" && v != "false" && v != "0"
	default:
		return false
	}
}

func isEmptyValue(val interface{}) bool {
	if val == nil {
		return true
	}

	switch v := val.(type) {
	case string:
		return v == ""
	case []interface{}:
		return len(v) == 0
	case map[string]interface{}:
		return len(v) == 0
	default:
		return false
	}
}

// EvaluateToArray evaluates an expression that should return an array
func (e *Evaluator) EvaluateToArray(expr string) ([]interface{}, error) {
	result, err := e.Evaluate(expr)
	if err != nil {
		return nil, err
	}

	switch v := result.(type) {
	case []interface{}:
		return v, nil
	case []string:
		// 转换string数组
		arr := make([]interface{}, len(v))
		for i, s := range v {
			arr[i] = s
		}
		return arr, nil
	case string:
		// 尝试解析JSON数组
		var arr []interface{}
		if err := json.Unmarshal([]byte(v), &arr); err != nil {
			return nil, fmt.Errorf("cannot convert string to array: %w", err)
		}
		return arr, nil
	default:
		return nil, fmt.Errorf("expression does not evaluate to array: %T", result)
	}
}
