'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

interface ChartData {
    name: string;
    value: number;
}

interface GradientChartProps {
    data: ChartData[];
    color?: string;
    height?: number | string;
    valuePrefix?: string;
}

export default function GradientChart({
    data,
    color = 'var(--brand-primary)',
    height = 300,
    valuePrefix = '',
}: GradientChartProps) {
    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickFormatter={(value) => `${valuePrefix}${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(23, 23, 23, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                        }}
                        itemStyle={{ color: color }}
                        formatter={(value: number | undefined) => [
                            value !== undefined ? `${valuePrefix}${value.toLocaleString('pt-BR')}` : '',
                            'Valor'
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
