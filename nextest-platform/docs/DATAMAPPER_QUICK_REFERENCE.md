# DataMapper Quick Reference Guide

## For Backend Developers

### Basic Usage

```go
import "test-management-service/internal/workflow"

// In your workflow step execution
resolver := NewVariableResolver()
resolvedInputs, err := resolver.ResolveStepInputs(step, ctx)
if err != nil {
    return fmt.Errorf("input resolution failed: %w", err)
}

// Use resolved inputs
for key, value := range resolvedInputs {
    step.Config[key] = value
}
```

### DataMapper JSON Structure

```json
{
  "id": "unique-mapper-id",
  "sourceStep": "step-login",
  "sourcePath": "output.response.body.token",
  "targetParam": "authToken",
  "transform": "uppercase"
}
```

### Available Transformations

```go
// String transformations
"uppercase"  // "hello" → "HELLO"
"lowercase"  // "HELLO" → "hello"
"trim"       // "  hi  " → "hi"

// Type conversions
"parseInt"   // "123" → 123 (int)
"parseFloat" // "123.45" → 123.45 (float64)
```

### JSONPath Examples

```javascript
// Simple field
"output.token"

// Nested fields
"output.response.body.user.id"

// Array index
"output.items.0.name"

// Array query (gjson syntax)
"output.users.#(age>25).name"  // All users over 25
```

## For Frontend Developers

### DataMapper Component Props

```typescript
interface DataMapperProps {
  id: string;
  sourceStep: string;      // Select from previous steps
  sourcePath: string;      // JSONPath builder
  targetParam: string;     // Input field
  transform?: TransformFunction;
}

type TransformFunction =
  | "uppercase"
  | "lowercase"
  | "trim"
  | "parseInt"
  | "parseFloat";
```

### Visual Builder Flow

```
1. User selects source step (dropdown of previous steps)
   ↓
2. System shows available output fields (from step schema)
   ↓
3. User selects field or builds JSONPath
   ↓
4. User optionally selects transformation function
   ↓
5. User enters target parameter name
   ↓
6. DataMapper is added to step configuration
```

### Example React Component

```tsx
function DataMapperBuilder({ step, availableSteps }: Props) {
  const [mappers, setMappers] = useState<DataMapper[]>(step.dataMappers || []);

  const addMapper = () => {
    const newMapper: DataMapper = {
      id: generateId(),
      sourceStep: "",
      sourcePath: "",
      targetParam: "",
      transform: undefined
    };
    setMappers([...mappers, newMapper]);
  };

  return (
    <div>
      <h3>Data Mappings</h3>
      {mappers.map(mapper => (
        <DataMapperRow
          key={mapper.id}
          mapper={mapper}
          availableSteps={availableSteps}
          onChange={(updated) => updateMapper(mapper.id, updated)}
        />
      ))}
      <Button onClick={addMapper}>Add Mapping</Button>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Token Extraction

```json
{
  "sourceStep": "step-login",
  "sourcePath": "output.response.body.token",
  "targetParam": "Authorization"
}
```

### Pattern 2: ID Extraction with Transformation

```json
{
  "sourceStep": "step-create-user",
  "sourcePath": "output.response.body.userId",
  "targetParam": "userId",
  "transform": "parseInt"
}
```

### Pattern 3: Multiple Mappers

```json
{
  "dataMappers": [
    {
      "id": "mapper-token",
      "sourceStep": "step-auth",
      "sourcePath": "output.token",
      "targetParam": "authToken"
    },
    {
      "id": "mapper-user-id",
      "sourceStep": "step-auth",
      "sourcePath": "output.userId",
      "targetParam": "userId",
      "transform": "parseInt"
    }
  ]
}
```

## Debugging

### Check Step Results

```go
// Get step result
result := ctx.GetStepResult("step-id")
if result == nil {
    log.Error("Step result not found")
}

// Convert to JSON for inspection
jsonStr, _ := result.JSON()
log.Info("Step output:", jsonStr)
```

### Test JSONPath Extraction

```go
// Test path extraction
import "github.com/tidwall/gjson"

jsonStr := `{"output": {"response": {"body": {"token": "abc123"}}}}`
value := gjson.Get(jsonStr, "output.response.body.token")
fmt.Println(value.String()) // "abc123"
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "source step not found" | Step hasn't executed yet | Check dependencies |
| "path not found" | Incorrect JSONPath | Use JSON viewer to verify structure |
| "unknown transform" | Typo in transform name | Use exact names: uppercase, lowercase, trim, parseInt, parseFloat |

## Testing

### Unit Test Template

```go
func TestMyDataMapper(t *testing.T) {
    resolver := NewVariableResolver()

    ctx := &ExecutionContext{
        StepResults: map[string]*StepExecutionResult{
            "step-1": {
                Status: "success",
                Output: map[string]interface{}{
                    "token": "test-token",
                },
            },
        },
    }

    mapper := &DataMapper{
        SourceStep:  "step-1",
        SourcePath:  "output.token",
        TargetParam: "auth",
        Transform:   "uppercase",
    }

    result, err := resolver.resolveDataMapper(mapper, ctx)
    assert.NoError(t, err)
    assert.Equal(t, "TEST-TOKEN", result)
}
```

## Best Practices

1. **Use DataMappers for visual workflows** - Easier to maintain and visualize
2. **Use Inputs for dynamic references** - When source isn't a step output
3. **Apply transforms at extraction** - Rather than in downstream steps
4. **Validate paths early** - Use schema validation in the builder
5. **Document complex paths** - Add comments for non-obvious JSONPath queries

## Performance Tips

1. **Minimize DataMappers** - Combine related mappings when possible
2. **Cache step results** - Already done by ExecutionContext
3. **Use simple paths** - Complex gjson queries add overhead
4. **Avoid deep nesting** - Flatten output structures when possible

## Further Reading

- Complete Documentation: `docs/DATAMAPPER_IMPLEMENTATION.md`
- Implementation: `internal/workflow/variable_resolver.go`
- Tests: `internal/workflow/variable_resolver_test.go`
- Example Workflow: `examples/datamapper_example.json`
- gjson Documentation: https://github.com/tidwall/gjson
