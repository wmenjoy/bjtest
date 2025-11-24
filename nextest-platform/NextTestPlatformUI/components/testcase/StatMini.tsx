import React from 'react';

/**
 * StatMini Props Interface
 * @property label - Display label for the statistic
 * @property value - Statistic value (can be string or number)
 */
interface StatMiniProps {
    label: string;
    value: string | number;
}

/**
 * StatMini Component
 * Displays a compact statistic card with label and value
 * Used for showing test counts, execution times, and other metrics
 *
 * Design:
 * - Light background with subtle border
 * - Compact padding for dense information display
 * - Bold value for emphasis
 * - Responsive to container width
 *
 * @example
 * <StatMini label="Total Tests" value={245} />
 * <StatMini label="Last Run" value="2h ago" />
 * <StatMini label="Pass Rate" value="94.2%" />
 */
export const StatMini: React.FC<StatMiniProps> = ({ label, value }) => {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div className="flex flex-col space-y-1">
                {/* Label */}
                <span className="text-xs text-slate-600">
                    {label}
                </span>
                {/* Value */}
                <span className="text-sm font-bold text-slate-900">
                    {value}
                </span>
            </div>
        </div>
    );
};

export default StatMini;
