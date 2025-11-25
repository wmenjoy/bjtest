import React, { useState } from 'react';
import { WorkflowStep } from './UpstreamOutputTree';
import { UpstreamOutputTree } from './UpstreamOutputTree';
import { CurrentInputsList } from './CurrentInputsList';
import { MappingLine, DataMapper } from './MappingLine';

interface DataMappingPanelProps {
  currentStep: WorkflowStep;
  previousSteps: WorkflowStep[];
  onChange: (step: WorkflowStep) => void;
}

/**
 * DataMappingPanel Component
 *
 * Three-column drag-and-drop data mapping panel:
 * - Left: Upstream step outputs (drag source)
 * - Middle: Mapping relationships
 * - Right: Current step inputs (drop target)
 *
 * Enables visual configuration of data flow between workflow steps.
 */
export const DataMappingPanel: React.FC<DataMappingPanelProps> = ({
  currentStep,
  previousSteps,
  onChange
}) => {
  const [dragData, setDragData] = useState<{
    sourceStep: string;
    sourcePath: string;
  } | null>(null);

  /**
   * Handle drag start - store source information
   */
  const handleDragStart = (sourceStep: string, sourcePath: string) => {
    setDragData({ sourceStep, sourcePath });
  };

  /**
   * Handle drop - create new data mapper
   */
  const handleDrop = (targetParam: string) => {
    if (!dragData) return;

    const newMapper: DataMapper = {
      id: `mapper-${Date.now()}`,
      sourceStep: dragData.sourceStep,
      sourcePath: dragData.sourcePath,
      targetParam: targetParam,
    };

    onChange({
      ...currentStep,
      dataMappers: [...(currentStep.dataMappers || []), newMapper]
    });

    setDragData(null);
  };

  /**
   * Delete a data mapper
   */
  const deleteMapper = (mapperId: string) => {
    onChange({
      ...currentStep,
      dataMappers: currentStep.dataMappers?.filter(m => m.id !== mapperId)
    });
  };

  /**
   * Update a data mapper (e.g., change transform function)
   */
  const updateMapper = (mapperId: string, updated: DataMapper) => {
    onChange({
      ...currentStep,
      dataMappers: currentStep.dataMappers?.map(m =>
        m.id === mapperId ? updated : m
      )
    });
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-700">Data Flow Mapping</h3>
        <p className="text-xs text-slate-500 mt-1">
          Drag upstream outputs to current inputs to create data mappings
        </p>
      </div>

      {/* Three-column layout */}
      <div className="flex h-96">
        {/* Left column: Upstream outputs */}
        <div className="w-1/3 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
              Upstream Outputs
            </h4>
            {previousSteps.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No previous steps
              </div>
            ) : (
              previousSteps.map(step => (
                <UpstreamOutputTree
                  key={step.id}
                  step={step}
                  onDragStart={handleDragStart}
                />
              ))
            )}
          </div>
        </div>

        {/* Middle column: Mapping relationships */}
        <div className="w-1/3 border-r border-slate-200 bg-slate-50 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
              Mapping Relations
            </h4>
            {!currentStep.dataMappers || currentStep.dataMappers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No mappings yet.<br/>Drag fields to create mappings.
              </div>
            ) : (
              currentStep.dataMappers.map(mapper => (
                <MappingLine
                  key={mapper.id}
                  mapper={mapper}
                  onDelete={() => deleteMapper(mapper.id)}
                  onChange={(updated) => updateMapper(mapper.id, updated)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right column: Current inputs */}
        <div className="w-1/3 bg-white overflow-y-auto">
          <div className="p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
              Current Inputs
            </h4>
            <CurrentInputsList
              step={currentStep}
              onDrop={handleDrop}
              isDragging={!!dragData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMappingPanel;
