import React, { useState } from 'react';
import { usePatternAnalysis } from '../../hooks/usePatternAnalysis';
import InsightCard from '../../ui/InsightCard';

const PatternInsights = ({ sessions, baseline }) => {
    const [showRawData, setShowRawData] = useState(false);
    const insights = usePatternAnalysis(sessions, baseline);

    if (!sessions || sessions.length === 0) return null;

    return (
        <div className="space-y-6">
            {/* Header con toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-800">🔍 Pattern e Insight Clinici</h2>
                    <p className="text-sm text-gray-500 mt-1">Analisi automatica basata sui dati raccolti</p>
                </div>
                <button
                    onClick={() => setShowRawData(!showRawData)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${showRawData
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {showRawData ? '📊 Nascondi dati grezzi' : '📋 Visualizza dati grezzi'}
                </button>
            </div>

            {/* Insight Cards */}
            {!showRawData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.length === 0 ? (
                        <div className="col-span-2 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <span className="text-4xl block mb-2">📊</span>
                            <p className="text-gray-500">Dati insufficienti per generare insight automatici.</p>
                            <p className="text-sm text-gray-400 mt-1">Servono almeno 3 sessioni per l'analisi dei pattern.</p>
                        </div>
                    ) : (
                        insights.map((insight, i) => (
                            <InsightCard key={i} {...insight} />
                        ))
                    )}
                </div>
            )}

            {/* Dati Grezzi */}
            {showRawData && (
                <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto overflow-y-auto max-h-[600px] shadow-inner relative">
                    <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-900 py-2 z-10 border-b border-gray-800">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                            <span>📋</span> Dati Grezzi Sessioni
                        </h3>
                        <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-lg text-xs font-mono">{sessions.length} record totali</span>
                    </div>
                    <table className="w-full text-xs text-gray-300 relative">
                        <thead className="text-gray-500 uppercase tracking-wider sticky top-12 bg-gray-900 z-10 shadow-sm border-b border-gray-700">
                            <tr>
                                <th className="p-3 text-left">Data</th>
                                <th className="p-3 text-left">Ora</th>
                                <th className="p-3 text-left">Story</th>
                                <th className="p-3 text-left">Stress</th>
                                <th className="p-3 text-left">Compl%</th>
                                <th className="p-3 text-left">Durata</th>
                                <th className="p-3 text-left">Clicks</th>
                                <th className="p-3 text-left">Miss</th>
                                <th className="p-3 text-left">Random</th>
                                <th className="p-3 text-left">Rage</th>
                                <th className="p-3 text-left">Reversals</th>
                                <th className="p-3 text-left">Hesit(ms)</th>
                                <th className="p-3 text-left">ContextSw</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 font-mono">
                            {[...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((s, i) => (
                                <tr key={i} className="hover:bg-gray-800 transition-colors">
                                    <td className="p-3 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString('it-IT')}</td>
                                    <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-3 text-indigo-400">{s.storyId?.slice(-6)}</td>
                                    <td className="p-3">
                                        <span className={s.stressIndex > 50 ? 'text-red-400' : 'text-emerald-400'}>{s.stressIndex}</span>
                                    </td>
                                    <td className="p-3">{s.completionRate}%</td>
                                    <td className="p-3">{s.totalDuration}s</td>
                                    <td className="p-3">{s.totalClicks}</td>
                                    <td className="p-3 text-amber-400">{s.totalMissClicks || 0}</td>
                                    <td className="p-3 text-purple-400">{s.totalRandomClicks || 0}</td>
                                    <td className="p-3 text-red-400">{s.totalRageClicks || 0}</td>
                                    <td className="p-3">{s.totalPageReversals || 0}</td>
                                    <td className="p-3">{s.avgHesitationTime || 0}</td>
                                    <td className="p-3">{s.pageVisibilitySwitches || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PatternInsights;
