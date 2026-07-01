// src/components/therapist/sections/ClickAnalysis.jsx
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ClickAnalysis = ({ sessions }) => {
    const data = sessions.map((s, i) => ({
        session: `S${i + 1}`,
        date: new Date(s.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        normali: Math.max((s.totalClicks || 0) - (s.totalRageClicks || 0) - (s.totalMissClicks || 0) - (s.totalRandomClicks || 0), 0),
        miss: s.totalMissClicks || 0,
        random: s.totalRandomClicks || 0,
        rabbiosi: s.totalRageClicks || 0,
    }));

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
                <h2 className="text-xl font-black text-gray-800">🖱️ Analisi Click</h2>
                <p className="text-sm text-gray-500 mt-1">Qualità e tipo di interazioni per sessione</p>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar dataKey="normali" name="Click Pertinenti" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="random" name="Click Random (UI)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="miss" name="Miss Click" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rabbiosi" name="Rage Click" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ClickAnalysis;
