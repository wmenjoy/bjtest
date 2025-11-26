import React, { useState } from 'react';
import { AtomicAssertion, Operator } from '../../../types';
import { Plus, AlertCircle } from 'lucide-react';
import { AssertionCard } from './AssertionCard';

interface AssertionEditorProps {
  /** Array of assertions to display and edit */
  assertions: AtomicAssertion[];

  /** Callback when assertions change */
  onChange: (assertions: AtomicAssertion[]) => void;

  /** Available variables for autocomplete suggestions */
  availableVariables?: string[];

  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * AssertionEditor - Phase 1 Implementation
 *
 * A simplified assertion editor component for creating and managing
 * atomic assertions with 10 common operators.
 *
 * Features:
 * - Add, edit, delete assertions
 * - Reorder assertions (drag and drop)
 * - Variable suggestions for target field
 * - Visual operator selection
 * - Advanced options (severity, continue on failure)
 */
export const AssertionEditor: React.FC<AssertionEditorProps> = ({
  assertions,
  onChange,
  availableVariables = [],
  readOnly = false
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Generate unique ID for new assertion
  const generateId = () => `assertion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add new assertion
  const handleAdd = () => {
    const newAssertion: AtomicAssertion = {
      id: generateId(),
      type: 'value',
      target: '',
      operator: 'equals',
      expected: '',
      severity: 'error',
      continueOnFailure: false
    };

    onChange([...assertions, newAssertion]);

    // Auto-expand the new card
    setExpandedCards(prev => new Set(prev).add(newAssertion.id));
  };

  // Update specific assertion
  const handleUpdate = (id: string, updated: AtomicAssertion) => {
    onChange(assertions.map(a => a.id === id ? updated : a));
  };

  // Delete assertion
  const handleDelete = (id: string) => {
    onChange(assertions.filter(a => a.id !== id));
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Duplicate assertion
  const handleDuplicate = (assertion: AtomicAssertion) => {
    const duplicate: AtomicAssertion = {
      ...assertion,
      id: generateId()
    };
    onChange([...assertions, duplicate]);
  };

  // Move assertion up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newAssertions = [...assertions];
    [newAssertions[index - 1], newAssertions[index]] =
      [newAssertions[index], newAssertions[index - 1]];
    onChange(newAssertions);
  };

  // Move assertion down
  const handleMoveDown = (index: number) => {
    if (index === assertions.length - 1) return;
    const newAssertions = [...assertions];
    [newAssertions[index], newAssertions[index + 1]] =
      [newAssertions[index + 1], newAssertions[index]];
    onChange(newAssertions);
  };

  // Toggle card expansion
  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-semibold text-slate-700">
            Assertions
          </h4>
          {assertions.length > 0 && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {assertions.length}
            </span>
          )}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus size={14} />
            <span>Add Assertion</span>
          </button>
        )}
      </div>

      {/* Assertion List */}
      {assertions.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-slate-400" size={24} />
          <p className="text-sm text-slate-500">
            No assertions defined
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Click "Add Assertion" to create validation rules
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assertions.map((assertion, index) => (
            <AssertionCard
              key={assertion.id}
              assertion={assertion}
              index={index}
              isExpanded={expandedCards.has(assertion.id)}
              onToggleExpand={() => toggleExpanded(assertion.id)}
              onChange={(updated) => handleUpdate(assertion.id, updated)}
              onDelete={() => handleDelete(assertion.id)}
              onDuplicate={() => handleDuplicate(assertion)}
              onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
              onMoveDown={index < assertions.length - 1 ? () => handleMoveDown(index) : undefined}
              availableVariables={availableVariables}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {assertions.length > 0 && (
        <div className="flex items-center space-x-4 text-xs text-slate-500 pt-2">
          <span>
            {assertions.filter(a => a.severity === 'error').length} error-level
          </span>
          <span>
            {assertions.filter(a => a.severity === 'warning').length} warning-level
          </span>
          <span>
            {assertions.filter(a => a.continueOnFailure).length} continue on failure
          </span>
        </div>
      )}
    </div>
  );
};
