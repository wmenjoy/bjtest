import React, { useState } from 'react';

/**
 * Filter state interface
 */
interface FilterState {
    priorities: string[];
    statuses: string[];
    tags: string[];
    successRateMin: number;
    successRateMax: number;
}

/**
 * Component props interface
 */
interface AdvancedFilterPanelProps {
    onFilterChange: (filters: FilterState) => void;
    onClose: () => void;
}

/**
 * AdvancedFilterPanel Component
 *
 * Provides advanced filtering options for test cases including:
 * - Priority selection (P0, P1, P2, P3)
 * - Status selection (Draft, Active, Deprecated)
 * - Success rate range slider
 */
export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
    onFilterChange,
    onClose
}) => {
    // Initialize filter state
    const [filters, setFilters] = useState<FilterState>({
        priorities: [] as string[],
        statuses: [] as string[],
        tags: [] as string[],
        successRateMin: 0,
        successRateMax: 100
    });

    /**
     * Handle priority checkbox toggle
     */
    const handlePriorityToggle = (priority: string) => {
        setFilters(prev => ({
            ...prev,
            priorities: prev.priorities.includes(priority)
                ? prev.priorities.filter(p => p !== priority)
                : [...prev.priorities, priority]
        }));
    };

    /**
     * Handle status checkbox toggle
     */
    const handleStatusToggle = (status: string) => {
        setFilters(prev => ({
            ...prev,
            statuses: prev.statuses.includes(status)
                ? prev.statuses.filter(s => s !== status)
                : [...prev.statuses, status]
        }));
    };

    /**
     * Reset all filters to default values
     */
    const handleReset = () => {
        setFilters({
            priorities: [],
            statuses: [],
            tags: [],
            successRateMin: 0,
            successRateMax: 100
        });
    };

    /**
     * Apply filters and trigger callback
     */
    const handleApply = () => {
        onFilterChange(filters);
    };

    return (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 animate-slide-down">
            {/* Priority Filter */}
            <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">
                    优先级
                </label>
                <div className="flex space-x-2">
                    {['P0', 'P1', 'P2', 'P3'].map(p => (
                        <label
                            key={p}
                            className="flex items-center space-x-1 text-sm cursor-pointer hover:text-slate-800 transition-colors"
                        >
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={filters.priorities.includes(p)}
                                onChange={() => handlePriorityToggle(p)}
                            />
                            <span className="text-slate-700">{p}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Status Filter */}
            <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">
                    状态
                </label>
                <div className="flex space-x-2">
                    {['Draft', 'Active', 'Deprecated'].map(s => (
                        <label
                            key={s}
                            className="flex items-center space-x-1 text-sm cursor-pointer hover:text-slate-800 transition-colors"
                        >
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={filters.statuses.includes(s)}
                                onChange={() => handleStatusToggle(s)}
                            />
                            <span className="text-slate-700">{s}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Success Rate Range Filter */}
            <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">
                    成功率范围: {filters.successRateMin}% - {filters.successRateMax}%
                </label>
                <div className="space-y-2">
                    {/* Min Range Slider */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-600 w-8">最小</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.successRateMin}
                            onChange={(e) => {
                                const newMin = Number(e.target.value);
                                setFilters(prev => ({
                                    ...prev,
                                    successRateMin: Math.min(newMin, prev.successRateMax)
                                }));
                            }}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs text-slate-700 font-semibold w-10 text-right">
                            {filters.successRateMin}%
                        </span>
                    </div>

                    {/* Max Range Slider */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-600 w-8">最大</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.successRateMax}
                            onChange={(e) => {
                                const newMax = Number(e.target.value);
                                setFilters(prev => ({
                                    ...prev,
                                    successRateMax: Math.max(newMax, prev.successRateMin)
                                }));
                            }}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs text-slate-700 font-semibold w-10 text-right">
                            {filters.successRateMax}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                    重置
                </button>
                <button
                    onClick={handleApply}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    应用
                </button>
            </div>
        </div>
    );
};

export default AdvancedFilterPanel;
