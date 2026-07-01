// src/components/therapist/ui/MetricCard.jsx
import React from 'react';

const MetricCard = ({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    icon,
    color = 'indigo',
    alert = false
}) => {
    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        red: 'bg-red-50 text-red-700 border-red-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100'
    };

    return (
        <div className={`bg-white rounded-2xl border p-5 ${alert ? 'border-red-300 shadow-red-100' : 'border-gray-100'} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colorMap[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-red-100 text-red-700' :
                            trend === 'down' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-black text-gray-800">{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );
};

export default MetricCard;
