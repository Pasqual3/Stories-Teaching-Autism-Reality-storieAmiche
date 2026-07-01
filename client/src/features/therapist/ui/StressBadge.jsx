import React from 'react';

const STRESS_CONFIG = {
    calm: {
        label: 'Calmo',
        color: 'bg-emerald-500 text-white border-emerald-600',
        dot: 'bg-white',
        range: '0-19'
    },
    mild: {
        label: 'Lieve',
        color: 'bg-amber-400 text-amber-950 border-amber-500',
        dot: 'bg-white',
        range: '20-44'
    },
    moderate: {
        label: 'Moderato',
        color: 'bg-orange-500 text-white border-orange-600',
        dot: 'bg-white',
        range: '45-69'
    },
    high: {
        label: 'Alto',
        color: 'bg-red-600 text-white border-red-700',
        dot: 'bg-white',
        range: '70-100'
    }
};

const StressBadge = ({ level, showRange = false, size = 'md' }) => {
    const config = STRESS_CONFIG[level] || STRESS_CONFIG.calm;
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base font-bold'
    };

    return (
        <span className={`inline-flex items-center gap-2 rounded-full border ${config.color} ${sizeClasses[size]}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} ${size === 'lg' ? 'w-3 h-3' : ''}`} />
            {config.label}
            {showRange && <span className="opacity-60 text-xs">({config.range})</span>}
        </span>
    );
};

export default StressBadge;
