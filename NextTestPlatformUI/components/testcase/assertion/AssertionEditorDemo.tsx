import React, { useState } from 'react';
import { AssertionEditor } from './AssertionEditor';
import { AtomicAssertion } from '../../../types';

/**
 * AssertionEditorDemo - Example usage of AssertionEditor
 *
 * This demo shows how to integrate the AssertionEditor component
 * into a test step or test case editor.
 */
export const AssertionEditorDemo: React.FC = () => {
  // Example: Initial assertions for a login API test
  const [assertions, setAssertions] = useState<AtomicAssertion[]>([
    {
      id: 'assertion-1',
      type: 'value',
      target: '{{response.status}}',
      operator: 'equals',
      expected: 200,
      message: 'Expected HTTP 200 OK',
      severity: 'error',
      continueOnFailure: false
    },
    {
      id: 'assertion-2',
      type: 'structure',
      target: '{{response.body.token}}',
      operator: 'exists',
      message: 'Token should be present in response',
      severity: 'error',
      continueOnFailure: false
    },
    {
      id: 'assertion-3',
      type: 'pattern',
      target: '{{response.body.email}}',
      operator: 'matchesRegex',
      expected: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      message: 'Email should be in valid format',
      severity: 'warning',
      continueOnFailure: true
    }
  ]);

  // Example: Available variables from previous steps
  const availableVariables = [
    'response.status',
    'response.headers',
    'response.body',
    'response.body.token',
    'response.body.email',
    'response.body.user',
    'response.body.user.id',
    'response.body.user.name',
    'response.time',
    'previousStep.output',
    'globalVar.apiUrl'
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Assertion Editor Demo
          </h1>
          <p className="text-slate-600">
            Phase 1 implementation of the three-layer assertion system.
            This demo shows the atomic assertion editor with 10 common operators.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Step 1: Login API
          </h2>

          <div className="mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                HTTP Request
              </p>
              <div className="font-mono text-sm text-slate-700">
                <span className="font-semibold text-emerald-600">POST</span>{' '}
                /api/v2/auth/login
              </div>
            </div>
          </div>

          {/* Assertion Editor */}
          <AssertionEditor
            assertions={assertions}
            onChange={setAssertions}
            availableVariables={availableVariables}
            readOnly={false}
          />
        </div>

        {/* JSON Output for Debugging */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">
              JSON Output (for debugging)
            </h3>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(assertions, null, 2))}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Copy to Clipboard
            </button>
          </div>
          <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono">
            {JSON.stringify(assertions, null, 2)}
          </pre>
        </div>

        {/* Usage Guide */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">
            How to Use
          </h3>
          <ol className="space-y-2 text-sm text-blue-700">
            <li>1. Click "Add Assertion" to create a new validation rule</li>
            <li>2. Expand the assertion card to configure all fields</li>
            <li>3. Enter the target field using {'{{'} variable {'}'} syntax</li>
            <li>4. Select an operator from the dropdown</li>
            <li>5. Enter the expected value (if required by operator)</li>
            <li>6. Optionally customize message, severity, and failure behavior</li>
            <li>7. Use the up/down arrows to reorder assertions</li>
          </ol>
        </div>

        {/* Integration Example */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Integration Example
          </h3>
          <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono">
{`import { AssertionEditor } from './components/testcase/assertion/AssertionEditor';
import { AtomicAssertion } from './types';

// In your step editor component
const [step, setStep] = useState<TestStep>({
  id: 'step-1',
  type: 'http',
  config: {
    method: 'POST',
    url: '/api/login'
  },
  // Add assertions array
  assertions: [] as AtomicAssertion[]
});

// Render the assertion editor
<AssertionEditor
  assertions={step.assertions || []}
  onChange={(assertions) => setStep({ ...step, assertions })}
  availableVariables={['response.status', 'response.body']}
/>
`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AssertionEditorDemo;
