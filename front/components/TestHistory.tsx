
import React, { useState } from 'react';
import { TestRun } from '../types';
import { RunList } from './history/RunList';
import { RunDetail } from './history/RunDetail';

interface TestHistoryProps {
  runs: TestRun[];
}

export const TestHistory: React.FC<TestHistoryProps> = ({ runs }) => {
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  return (
    <div className="flex h-full bg-white rounded-xl overflow-hidden border border-slate-200">
      <RunList runs={runs} selectedRunId={selectedRun?.id} onSelect={setSelectedRun} />
      <RunDetail run={selectedRun} />
    </div>
  );
};
