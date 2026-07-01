import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STRESS_COLORS = {
    calm: '#10b981',     // Emerald 500
    mild: '#f59e0b',     // Amber 500
    moderate: '#f97316', // Orange 500
    high: '#ef4444'      // Red 500
};

const StressDistribution = ({ sessions }) => {
    const counts = { calm: 0, mild: 0, moderate: 0, high: 0 };
    sessions.forEach(s => {
        if (counts[s.stressLevel] !== undefined) counts[s.stressLevel]++;
    });

    const data = Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
            name: key === 'calm' ? 'Calmo' : key === 'mild' ? 'Lieve' : key === 'moderate' ? 'Moderato' : 'Alto',
            value,
            color: STRESS_COLORS[key]
        }));

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
                <h2 className="text-xl font-black text-gray-800">🧁 Distribuzione Stress</h2>
                <p className="text-sm text-gray-500 mt-1">Consistenza dei livelli emotivi nel tempo</p>
            </div>

            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            dataKey="value"
                            paddingAngle={4}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value, name) => [`${value} sessioni`, name]}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-300">
                    Nessun dato disponibile
                </div>
            )}
        </div>
    );
};

export default StressDistribution;

