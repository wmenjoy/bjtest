/**
 * DataFlowEditor Usage Example
 *
 * This file demonstrates how to use the new DataFlowEditor component
 * with the WorkflowView toggle functionality.
 */

import React, { useState } from 'react';
import { WorkflowView } from './WorkflowView';
import { WorkflowStep } from '../../../types';

// Sample workflow steps with data flow
const sampleSteps: WorkflowStep[] = [
  {
    id: 'step1',
    name: 'Login',
    type: 'http',
    config: {
      method: 'POST',
      url: 'https://api.example.com/login',
      body: {
        username: 'testuser',
        password: 'testpass',
      },
    },
    outputs: {
      'response.body.token': 'authToken',
      'response.body.userId': 'userId',
    },
  },
  {
    id: 'step2',
    name: 'Get User Profile',
    type: 'http',
    config: {
      method: 'GET',
      url: 'https://api.example.com/users/{{userId}}',
      headers: {
        Authorization: '{{authToken}}',
      },
    },
    inputs: {
      userId: '{{step1.userId}}',
      authToken: '{{step1.authToken}}',
    },
    outputs: {
      'response.body.email': 'userEmail',
      'response.body.name': 'userName',
    },
  },
  {
    id: 'step3',
    name: 'Update Profile',
    type: 'http',
    config: {
      method: 'PUT',
      url: 'https://api.example.com/users/{{userId}}',
      headers: {
        Authorization: '{{authToken}}',
      },
      body: {
        name: 'Updated Name',
      },
    },
    inputs: {
      userId: '{{step1.userId}}',
      authToken: '{{step1.authToken}}',
    },
    outputs: {
      'response.status': 'updateStatus',
    },
  },
];

export const DataFlowEditorExample: React.FC = () => {
  const [steps, setSteps] = useState<WorkflowStep[]>(sampleSteps);

  const handleStepsChange = (updatedSteps: WorkflowStep[]) => {
    setSteps(updatedSteps);
    console.log('Steps updated:', updatedSteps);
  };

  const handleStepClick = (step: WorkflowStep) => {
    console.log('Step clicked:', step);
  };

  return (
    <div className="h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white rounded-xl shadow-lg p-6 h-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Data Flow Editor Demo
          </h1>
          <p className="text-slate-600 mb-6">
            Toggle between List View and Data Flow view to see the interactive
            editor. Drag connections between step outputs and inputs to create
            variable bindings.
          </p>

          <div className="h-[calc(100%-120px)]">
            <WorkflowView
              steps={steps}
              onStepClick={handleStepClick}
              onStepsChange={handleStepsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataFlowEditorExample;
