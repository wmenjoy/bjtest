import React from 'react';
import { LineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendChartProps {
    type: 'line' | 'area';
    title: string;
    data: any[];
    dataKey: string;
    color?: string;
    height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    type,
    title,
    data,
    dataKey,
    color = '#3b82f6',
    height = 200
}) => {
    const ChartComponent = type === 'line' ? LineChart : AreaChart;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                <ChartComponent data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        tick={{ fill: '#64748b' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tick={{ fill: '#64748b' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                        }}
                    />
                    <Legend />
                    {type === 'line' ? (
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ) : (
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fill={color}
                            fillOpacity={0.3}
                        />
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
};
