import React from 'react';

/**
 * ValueScore Props Interface
 * @property label - Display label for the score
 * @property value - Score value (0-100)
 * @property color - Color theme for the progress bar
 */
interface ValueScoreProps {
    label: string;
    value: number;
    color: 'green' | 'blue' | 'amber' | 'purple';
}

/**
 * Color class mappings for different score types
 * Maps color names to Tailwind CSS classes for background and text
 */
const colorClasses = {
    green: 'bg-green-500 text-green-700',
    blue: 'bg-blue-500 text-blue-700',
    amber: 'bg-amber-500 text-amber-700',
    purple: 'bg-purple-500 text-purple-700'
};

/**
 * ValueScore Component
 * Displays a labeled progress bar with numerical value
 * Used for showing test metrics, coverage scores, etc.
 *
 * @example
 * <ValueScore label="Coverage" value={85} color="green" />
 * <ValueScore label="Performance" value={72} color="blue" />
 */
export const ValueScore: React.FC<ValueScoreProps> = ({ label, value, color }) => {
    // Ensure value is within valid range
    const clampedValue = Math.max(0, Math.min(100, value));

    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{label}</span>
            <div className="flex items-center space-x-2">
                {/* Progress bar container */}
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    {/* Progress bar fill */}
                    <div
                        className={`h-full transition-all duration-300 ${colorClasses[color]}`}
                        style={{ width: `${clampedValue}%` }}
                    />
                </div>
                {/* Numerical value display */}
                <span className="text-xs font-semibold text-slate-700 w-8 text-right">
                    {clampedValue}
                </span>
            </div>
        </div>
    );
};

export default ValueScore;
