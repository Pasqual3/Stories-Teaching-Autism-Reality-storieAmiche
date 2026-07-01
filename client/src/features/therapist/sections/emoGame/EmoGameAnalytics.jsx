// ─── EmoGameAnalytics — Orchestratore ────────────────────────────────────────
// Questo file è intenzionalmente snello: delega il fetch al hook e il rendering
// ai sub-componenti, gestendo solo i tab e i filtri di periodo.
import React, { useState } from 'react';
import { useEmoGameData } from './useEmoGameData';
import EmoGameKPICards   from './EmoGameKPICards';
import EmoGameCharts     from './EmoGameCharts';
import EmoGameConfusion  from './EmoGameConfusion';
import EmoGameHistory    from './EmoGameHistory';

const DATE_FILTERS = [
    { value: 'all',    label: 'Tutti' },
    { value: 'today',  label: 'Oggi' },
    { value: 'week',   label: 'Settimana' },
    { value: 'month',  label: 'Mese' },
    { value: 'custom', label: 'Personalizzato' },
];

const EmoGameAnalytics = ({ childId, therapistId, allStories = {} }) => {
    const [activeSubTab, setActiveSubTab] = useState('analytics');

    const {
        loading,
        responses,
        dateFilter, setDateFilter,
        customStart, setCustomStart,
        customEnd,   setCustomEnd,
        sessionsList,
        storyGroups,
        activeEmotions,
        clinicalKPIs,
        levelAggregationData,
        emotionProfileData,
        learningTimelineData,
        confusionMatrix,
    } = useEmoGameData({ childId, therapistId, allStories });

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                <p className="font-bold text-sm animate-pulse">Caricamento dati EmoGame...</p>
            </div>
        );
    }

    // ── Empty state ──────────────────────────────────────────────────────────
    if (responses.length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🎮</div>
                <h3 className="text-xl font-black text-gray-700 mb-2">Nessun EmoGame registrato</h3>
                <p className="text-gray-400 text-sm">Questo paziente non ha ancora completato sessioni di EmoGame.</p>
            </div>
        );
    }

    // ── Root ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8">

            {/* ── Header + Filtri ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-800">🎮 EmoGame Analytics</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {sessionsList.length} sessioni analizzate • {clinicalKPIs.totalAnswers} risposte totali
                    </p>
                </div>

                {/* Filtri periodo */}
                <div className="flex flex-wrap gap-2 items-center">
                    {DATE_FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setDateFilter(value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                dateFilter === value
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}

                    {/* Range date custom */}
                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2 mt-2 lg:mt-0">
                            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 focus:border-purple-400 focus:outline-none"
                            />
                            <span className="text-gray-400 font-bold">→</span>
                            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 focus:border-purple-400 focus:outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tab Switcher ── */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner w-fit">
                {[
                    { value: 'analytics', label: '📊 Analytics Cliniche' },
                    { value: 'history',   label: '🗂️ Storico Partite' },
                ].map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => setActiveSubTab(value)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeSubTab === value
                                ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── TAB 1: Analytics Cliniche ── */}
            {activeSubTab === 'analytics' && (
                <div className="space-y-8 animate-fadeIn">
                    {/* 4 KPI cards */}
                    <EmoGameKPICards clinicalKPIs={clinicalKPIs} />

                    {/* 4 Grafici */}
                    <EmoGameCharts
                        emotionProfileData={emotionProfileData}
                        learningTimelineData={learningTimelineData}
                        levelAggregationData={levelAggregationData}
                    />

                    {/* Matrice di confusione + guida teorica */}
                    <EmoGameConfusion
                        confusionMatrix={confusionMatrix}
                        activeEmotions={activeEmotions}
                    />
                </div>
            )}

            {/* ── TAB 2: Storico Partite ── */}
            {activeSubTab === 'history' && (
                <div className="space-y-6 animate-fadeIn">
                    <EmoGameHistory storyGroups={storyGroups} />
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default EmoGameAnalytics;
