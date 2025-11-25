import React, { useState } from 'react';
import { DataMapper } from './datamapper/DataMapper';
import { DataBinding } from '../../types';

/**
 * DataMapper Demo Component
 *
 * This component demonstrates how to use the DataMapper component
 * to visually configure data bindings between test steps.
 */
export const DataMapperDemo: React.FC = () => {
  const [showMapper, setShowMapper] = useState(false);
  const [bindings, setBindings] = useState<DataBinding[]>([]);

  // Example: Login step outputs
  const loginOutputs = [
    {
      name: 'userId',
      path: 'response.body.userId',
      type: 'number',
      value: 12345
    },
    {
      name: 'authToken',
      path: 'response.body.token',
      type: 'string',
      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    {
      name: 'email',
      path: 'response.body.email',
      type: 'string',
      value: 'test@example.com'
    },
    {
      name: 'role',
      path: 'response.body.role',
      type: 'string',
      value: 'admin'
    }
  ];

  // Example: Get Profile step inputs
  const profileInputs = [
    {
      name: 'userId',
      type: 'number'
    },
    {
      name: 'auth',
      type: 'string'
    },
    {
      name: 'userEmail',
      type: 'string'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Data Mapper Demo
        </h1>
        <p className="text-slate-600">
          Visual data flow configuration between test steps
        </p>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Source Step */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Step 1: Login</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              Completed
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-600">
              <strong>Method:</strong> POST /api/auth/login
            </div>
            <div className="text-sm text-slate-600">
              <strong>Status:</strong> 200 OK
            </div>
            <div className="text-sm text-slate-600 mt-4">
              <strong>Outputs:</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded text-xs font-mono">
              {JSON.stringify({
                userId: 12345,
                token: 'eyJhbGc...',
                email: 'test@example.com',
                role: 'admin'
              }, null, 2)}
            </div>
          </div>
        </div>

        {/* Target Step */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Step 2: Get Profile</h3>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
              Pending
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-600">
              <strong>Method:</strong> GET /api/profile
            </div>
            <div className="text-sm text-slate-600 mt-4">
              <strong>Required Inputs:</strong>
            </div>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>userId (number)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>auth (string)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span>userEmail (string) - optional</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setShowMapper(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Open Data Mapper
        </button>
        {bindings.length > 0 && (
          <button
            onClick={() => setBindings([])}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
          >
            Clear Bindings
          </button>
        )}
      </div>

      {/* Current Bindings */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          Current Bindings ({bindings.length})
        </h3>
        {bindings.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No bindings configured. Click "Open Data Mapper" to create bindings.
          </div>
        ) : (
          <div className="space-y-3">
            {bindings.map(binding => (
              <div
                key={binding.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <div className="font-medium text-slate-700 mb-1">
                      {binding.targetParam}
                    </div>
                    <div className="text-xs text-slate-500">
                      Target parameter
                    </div>
                  </div>
                  <div className="text-slate-400">←</div>
                  <div className="text-sm">
                    <div className="font-mono text-slate-700 mb-1">
                      {binding.sourcePath}
                    </div>
                    <div className="text-xs text-slate-500">
                      Source path
                    </div>
                  </div>
                </div>
                {binding.transform && (
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                    Transform: {binding.transform.function || binding.transform.template}
                  </div>
                )}
                {binding.sourceType && binding.targetType && (
                  <div className="text-xs text-slate-500">
                    {binding.sourceType} → {binding.targetType}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated Code Preview */}
      {bindings.length > 0 && (
        <div className="mt-8 bg-slate-900 rounded-lg p-6 text-white">
          <h3 className="font-semibold mb-4">Generated Code</h3>
          <pre className="text-sm overflow-x-auto">
            <code>
{`// Step 2 configuration with data bindings
{
  id: "step-2",
  name: "Get Profile",
  type: "http",
  config: {
    method: "GET",
    url: "/api/profile"
  },
  inputs: {
${bindings.map(b => `    "${b.targetParam}": "{{${b.sourcePath}}}"`).join(',\n')}
  },
  dataBindings: ${JSON.stringify(bindings, null, 2)}
}`}
            </code>
          </pre>
        </div>
      )}

      {/* DataMapper Modal */}
      {showMapper && (
        <DataMapper
          sourceStepId="step-1"
          sourceStepName="Login"
          sourceOutputs={loginOutputs}
          targetStepId="step-2"
          targetStepName="Get Profile"
          targetInputs={profileInputs}
          bindings={bindings}
          onBindingsChange={setBindings}
          onClose={() => setShowMapper(false)}
        />
      )}

      {/* Usage Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">How to Use</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>1. Click "Open Data Mapper" to open the visual mapper</li>
          <li>2. Click a source field (left panel), then click a target field (right panel) to create a binding</li>
          <li>3. Use "Auto Map" to automatically match fields with the same name</li>
          <li>4. Click the X button on a binding to remove it</li>
          <li>5. Click "Done" to save and close the mapper</li>
        </ol>
      </div>
    </div>
  );
};

export default DataMapperDemo;
