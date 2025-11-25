# Step Editor Components

Visual data mapping components for workflow step configuration.

## Components

### DataMappingPanel

Main three-column panel for visual data flow mapping between workflow steps.

**Features:**
- Left column: Upstream step outputs (drag source)
- Middle column: Mapping relationships with transform functions
- Right column: Current step inputs (drop targets)
- Drag-and-drop interface for creating mappings
- Transform function support (uppercase, lowercase, trim, parseInt, parseFloat)

**Usage:**

```typescript
import { DataMappingPanel } from './stepEditor';

const StepEditor = ({ currentStep, allSteps, onStepChange }) => {
  // Get previous steps (steps that currentStep depends on)
  const previousSteps = allSteps.filter(s => 
    currentStep.dependsOn?.includes(s.id)
  );

  return (
    <div>
      <h2>Configure Step: {currentStep.name}</h2>
      
      {/* Data Mapping Panel */}
      <DataMappingPanel
        currentStep={currentStep}
        previousSteps={previousSteps}
        onChange={onStepChange}
      />
    </div>
  );
};
```

### UpstreamOutputTree

Displays outputs from an upstream step in a collapsible tree structure.

**Features:**
- Collapsible step groups
- Auto-inferred outputs based on step type (http, command)
- Draggable output fields
- Type hints for each output

### CurrentInputsList

Displays current step's input parameters as drop targets.

**Features:**
- Required/optional field indicators
- Type information
- Drop zone visual feedback
- Auto-inferred inputs based on step type

### MappingLine

Displays a single data mapping relationship.

**Features:**
- Source → Target visualization
- Transform function selector
- Delete mapping button
- Hover effects

## Data Structures

### WorkflowStep

```typescript
interface WorkflowStep {
  id: string;
  name?: string;
  type: string;                    // 'http', 'command', etc.
  config?: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, string>;
  dataMappers?: DataMapper[];
  dependsOn?: string[];
  // ... other fields
}
```

### DataMapper

```typescript
interface DataMapper {
  id: string;
  sourceStep: string;    // Source step ID
  sourcePath: string;    // JSONPath expression (e.g., 'response.body.token')
  targetParam: string;   // Target parameter name
  transform?: string;    // Optional transform: 'uppercase', 'lowercase', etc.
}
```

## Example Workflow

```typescript
const workflow = {
  steps: [
    {
      id: 'step-login',
      name: 'User Login',
      type: 'http',
      config: {
        method: 'POST',
        url: '/api/login',
        body: { username: 'test', password: 'secret' }
      },
      outputs: {
        'response.body.token': 'authToken',
        'response.body.userId': 'userId'
      }
    },
    {
      id: 'step-get-profile',
      name: 'Get User Profile',
      type: 'http',
      dependsOn: ['step-login'],
      dataMappers: [
        {
          id: 'mapper-1',
          sourceStep: 'step-login',
          sourcePath: 'authToken',
          targetParam: 'Authorization',
          transform: 'uppercase'  // Optional
        }
      ],
      config: {
        method: 'GET',
        url: '/api/profile'
      }
    }
  ]
};
```

## Transform Functions

Supported transform functions:

- `uppercase` - Convert string to uppercase
- `lowercase` - Convert string to lowercase
- `trim` - Remove leading/trailing whitespace
- `parseInt` - Convert to integer
- `parseFloat` - Convert to floating-point number

## Integration

To integrate into a workflow editor:

```typescript
import { DataMappingPanel } from './components/testcase/stepEditor';

const WorkflowEditor = () => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  const handleStepChange = (updatedStep: WorkflowStep) => {
    setSteps(steps.map(s => s.id === updatedStep.id ? updatedStep : s));
  };

  const getPreviousSteps = (step: WorkflowStep) => {
    return steps.filter(s => step.dependsOn?.includes(s.id));
  };

  return (
    <div>
      {/* Step list */}
      <div>
        {steps.map(step => (
          <div key={step.id} onClick={() => setSelectedStep(step)}>
            {step.name}
          </div>
        ))}
      </div>

      {/* Step editor */}
      {selectedStep && (
        <DataMappingPanel
          currentStep={selectedStep}
          previousSteps={getPreviousSteps(selectedStep)}
          onChange={handleStepChange}
        />
      )}
    </div>
  );
};
```

## Styling

Components use Tailwind CSS classes. Ensure Tailwind is configured in your project.

Required icons from lucide-react:
- ChevronRight
- Database
- Target
- ArrowRight
- Trash2
- Zap

## Backend Integration

Data mappers are resolved by the backend variable resolver. See:
- `/docs/DATAMAPPER_IMPLEMENTATION.md`
- `/internal/workflow/variable_resolver.go`

The backend resolves mappers in this priority:
1. DataMappers (visual configuration) - Highest priority
2. Inputs (manual variable references) - Fallback

## Future Enhancements

- [ ] JSONPath builder with syntax highlighting
- [ ] Schema-based output inference from Action Templates
- [ ] Custom transform functions
- [ ] Conditional mappings
- [ ] Array mapping with element-wise transforms
- [ ] Validation and error highlighting
- [ ] Preview resolved values with sample data
