import React, { useState } from 'react';
import { DataMappingPanel } from './DataMappingPanel';
import { WorkflowStep } from './UpstreamOutputTree';

/**
 * DataMappingPanelDemo Component
 *
 * Demonstration of the DataMappingPanel with sample workflow steps.
 * This shows how to integrate the component into a workflow editor.
 */
export const DataMappingPanelDemo: React.FC = () => {
  // Sample workflow with multiple steps
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-login',
      name: 'User Login',
      type: 'http',
      config: {
        method: 'POST',
        url: '/api/auth/login',
        body: {
          username: 'test@example.com',
          password: 'secret'
        }
      },
      outputs: {
        'response.body.token': 'authToken',
        'response.body.userId': 'userId',
        'response.body.refreshToken': 'refreshToken'
      }
    },
    {
      id: 'step-get-product',
      name: 'Get Product Info',
      type: 'http',
      dependsOn: ['step-login'],
      config: {
        method: 'GET',
        url: '/api/products/123'
      },
      outputs: {
        'response.body.id': 'productId',
        'response.body.name': 'productName',
        'response.body.price': 'productPrice'
      }
    },
    {
      id: 'step-create-order',
      name: 'Create Order',
      type: 'http',
      dependsOn: ['step-login', 'step-get-product'],
      dataMappers: [],
      config: {
        method: 'POST',
        url: '/api/orders'
      },
      inputs: {
        Authorization: '',
        userId: '',
        productId: '',
        quantity: 1
      }
    }
  ]);

  const [selectedStepId, setSelectedStepId] = useState<string>('step-create-order');

  const currentStep = steps.find(s => s.id === selectedStepId);
  const previousSteps = steps.filter(s =>
    currentStep?.dependsOn?.includes(s.id)
  );

  const handleStepChange = (updatedStep: WorkflowStep) => {
    setSteps(steps.map(s => s.id === updatedStep.id ? updatedStep : s));
  };

  if (!currentStep) {
    return <div>No step selected</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Data Mapping Panel - Demo
          </h1>
          <p className="text-slate-600">
            Demonstration of visual data flow mapping between workflow steps.
          </p>
        </div>

        {/* Step selector */}
        <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Select Step to Configure</h2>
          <div className="flex space-x-2">
            {steps.map(step => (
              <button
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStepId === step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {step.name}
              </button>
            ))}
          </div>
        </div>

        {/* Data Mapping Panel */}
        <DataMappingPanel
          currentStep={currentStep}
          previousSteps={previousSteps}
          onChange={handleStepChange}
        />

        {/* Current mappings (JSON preview) */}
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Current Mappings (JSON)</h2>
          <pre className="text-xs bg-slate-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(currentStep.dataMappers || [], null, 2)}
          </pre>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Select "Create Order" step (should be pre-selected)</li>
            <li>Click on "User Login" or "Get Product Info" in the left column to expand outputs</li>
            <li>Drag an output field (e.g., "authToken") from the left column</li>
            <li>Drop it onto an input parameter (e.g., "Authorization") in the right column</li>
            <li>The mapping will appear in the middle column</li>
            <li>Click the transform dropdown to apply transformations (uppercase, trim, etc.)</li>
            <li>Hover over a mapping and click the trash icon to delete it</li>
          </ol>
        </div>

        {/* Expected behavior */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-green-900 mb-2">Expected Behavior</h3>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Previous steps (dependencies) appear in left column</li>
            <li>Each step shows inferred outputs (e.g., response.body.token for HTTP)</li>
            <li>Current step inputs appear in right column with type hints</li>
            <li>Drag-and-drop creates DataMapper objects</li>
            <li>Mappings have priority over manual variable references</li>
            <li>Backend variable resolver uses DataMappers to resolve step inputs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataMappingPanelDemo;
