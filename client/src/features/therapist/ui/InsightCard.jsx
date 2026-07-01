import React from 'react';

const InsightCard = ({ type, title, description, severity = 'info', data }) => {
    const severityConfig = {
        info: { border: 'border-blue-200', bg: 'bg-blue-50', icon: 'ℹ️', text: 'text-blue-800' },
        warning: { border: 'border-amber-200', bg: 'bg-amber-50', icon: '⚠️', text: 'text-amber-800' },
        critical: { border: 'border-red-200', bg: 'bg-red-50', icon: '🚨', text: 'text-red-800' },
        positive: { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: '✅', text: 'text-emerald-800' }
    };

    const config = severityConfig[severity];

    return (
        <div className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
            <div className="flex items-start gap-3">
                <span className="text-xl">{config.icon}</span>
                <div className="flex-1">
                    <h4 className={`font-bold text-sm ${config.text} mb-1`}>{title}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                    {data && (
                        <div className="mt-2 text-xs font-mono bg-white/60 rounded-lg p-2 text-gray-600">
                            {JSON.stringify(data, null, 2)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InsightCard;
