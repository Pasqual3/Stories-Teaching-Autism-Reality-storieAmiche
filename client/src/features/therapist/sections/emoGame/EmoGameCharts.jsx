// ─── EmoGameCharts — 4 grafici recharts ──────────────────────────────────────
import React from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LineChart, BarChart
} from 'recharts';
import { getEmotionColor } from './emoGameUtils';

/**
 * Componente puro: riceve i dati derivati dal hook e renderizza i 4 grafici:
 *   1. Accuratezza per emozione (BarChart)
 *   2. Tempo di elaborazione per emozione (BarChart)
 *   3. Curva di apprendimento clinico (LineChart a doppio asse)
 *   4. Prestazioni per livello di difficoltà (ComposedChart)
 */
const EmoGameCharts = ({ emotionProfileData, learningTimelineData, levelAggregationData }) => {
    const TooltipBox = ({ children }) => (
        <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg text-xs">{children}</div>
    );

    return (
        <>
            {/* ── Coppia 1: Profilo Emotivo ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Accuratezza per emozione */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-extrabold text-gray-800 text-lg">🎯 Riconoscimento per Emozione</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Percentuale di risposte corrette al primo tentativo per ciascuna emozione</p>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={emotionProfileData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="emotion" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <TooltipBox>
                                            <p className="font-black text-gray-700 uppercase mb-1">{d.emotion}</p>
                                            <p className="font-bold text-emerald-600">Accuratezza: {d.accuratezza}%</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{d.correct} corrette su {d.total} tentativi</p>
                                        </TooltipBox>
                                    );
                                }} />
                                <Bar dataKey="accuratezza" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                    {emotionProfileData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tempo di elaborazione per emozione */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-extrabold text-gray-800 text-lg">⏱️ Tempo di Elaborazione per Emozione</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Tempo medio di esitazione (in secondi) prima della prima risposta</p>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={emotionProfileData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="emotion" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, dataMax => Math.max(5, Math.ceil(dataMax + 1))]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <TooltipBox>
                                            <p className="font-black text-gray-700 uppercase mb-1">{d.emotion}</p>
                                            <p className="font-bold text-purple-600">Tempo medio: {d.esitazione}s</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Calcolato su {d.total} tentativi</p>
                                        </TooltipBox>
                                    );
                                }} />
                                <Bar dataKey="esitazione" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                    {emotionProfileData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill="#8b5cf6" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Coppia 2: Apprendimento + Livelli ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Curva di apprendimento clinico */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-lg">📈 Curva di Apprendimento Clinico</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Trend delle ultime 10 sessioni. Linea verde: accuratezza (%). Linea viola tratteggiata: tempo medio (secondi)</p>
                    </div>
                    <div className="h-[280px] w-full mt-4">
                        {learningTimelineData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold italic">
                                Dati insufficienti per tracciare la curva...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={learningTimelineData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, dataMax => Math.max(5, Math.ceil(dataMax + 1))]} tick={{ fontSize: 11, fill: '#8b5cf6' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <TooltipBox>
                                                <p className="font-black text-gray-700 mb-1">Sessione: {d.label}</p>
                                                <p className="text-[10px] text-gray-400 mb-1">Data: {d.fullDate}</p>
                                                <p className="font-bold text-emerald-600">Accuratezza: {d.accuracy}%</p>
                                                <p className="font-bold text-purple-600">Tempo di risposta: {d.avgHesitation}s</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{d.correctCount} risposte corrette su {d.totalCount}</p>
                                            </TooltipBox>
                                        );
                                    }} />
                                    <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="avgHesitation" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Prestazioni per livello */}
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-lg">📶 Prestazioni per Livello</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Accuratezza (%) e Tempo di Risposta (secondi) aggregati per livello di difficoltà</p>
                    </div>
                    <div className="h-[280px] w-full mt-4">
                        {levelAggregationData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold italic">
                                Nessun livello giocato nel periodo...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={levelAggregationData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="levelLabel" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, dataMax => Math.max(5, Math.ceil(dataMax + 1))]} tick={{ fontSize: 11, fill: '#8b5cf6' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <TooltipBox>
                                                <p className="font-black text-gray-700 mb-1">{d.levelLabel}</p>
                                                <p className="font-bold text-emerald-600">Accuratezza: {d.accuracy}%</p>
                                                <p className="font-bold text-purple-600">Tempo medio: {d.avgHesitation}s</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{d.sessionCount} sessioni, {d.totalAnswers} risposte totali</p>
                                            </TooltipBox>
                                        );
                                    }} />
                                    <Bar yAxisId="left" dataKey="accuracy" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={38} />
                                    <Line yAxisId="right" type="monotone" dataKey="avgHesitation" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmoGameCharts;
