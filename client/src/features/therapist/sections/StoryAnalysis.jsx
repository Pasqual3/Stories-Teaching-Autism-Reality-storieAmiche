import React, { useState } from 'react';
import StressBadge from '../ui/StressBadge';

const StoryAnalysis = ({ sessions, allStories }) => {
    const [expandedStory, setExpandedStory] = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);

    // Raggruppa per storia
    const storyGroups = (() => {
        const groups = {};
        sessions.forEach(s => {
            if (!groups[s.storyId]) groups[s.storyId] = [];
            groups[s.storyId].push(s);
        });
        return Object.entries(groups)
            .map(([storyId, storySessions]) => ({
                storyId,
                sessions: [...storySessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                lastActivity: storySessions[storySessions.length - 1].createdAt,
                avgStress: Math.round(storySessions.reduce((sum, s) => sum + s.stressIndex, 0) / storySessions.length),
                avgCompletion: Math.round(storySessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / storySessions.length),
                totalRage: storySessions.reduce((sum, s) => sum + (s.totalRageClicks || 0), 0),
                totalReversals: storySessions.reduce((sum, s) => sum + (s.totalPageReversals || 0), 0),
            }))
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    })();

    const getTimeOfDay = (dateString) => {
        const hour = new Date(dateString).getHours();
        if (hour >= 6 && hour < 12) return { label: 'Mattina', color: 'bg-orange-50 text-orange-600' };
        if (hour >= 12 && hour < 18) return { label: 'Pomeriggio', color: 'bg-blue-50 text-blue-600' };
        if (hour >= 18 && hour < 22) return { label: 'Sera', color: 'bg-indigo-50 text-indigo-600' };
        return { label: 'Notte', color: 'bg-slate-800 text-slate-100' };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-black text-gray-800">📋 Analisi per Storia Sociale</h2>
                    <p className="text-sm text-gray-500 mt-1">Dettaglio per storia, sessione e scena</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                    {sessions.length} Sessioni
                </span>
            </div>

            <div className="space-y-4">
                {storyGroups.map((group) => {
                    const storyInfo = (allStories && allStories[group.storyId]) || { title: 'Storia Sconosciuta', slides: 6 };
                    const isExpanded = expandedStory === group.storyId;

                    return (
                        <div key={group.storyId} className="border border-gray-100 rounded-2xl overflow-hidden">
                            {/* LIVELLO STORIA */}
                            <button
                                onClick={() => setExpandedStory(isExpanded ? null : group.storyId)}
                                className={`w-full flex items-center justify-between p-5 transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isExpanded ? 'bg-white/20' : 'bg-white'}`}>
                                        📚
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black uppercase tracking-tight">{storyInfo.title}</h3>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isExpanded ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {group.sessions.length} sessioni • Completamento medio: {group.avgCompletion}% • Stress medio: {group.avgStress}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {group.totalRage > 0 && (
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isExpanded ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}>
                                            🚨 {group.totalRage} rage
                                        </span>
                                    )}
                                    <span className="text-xl">{isExpanded ? '📖' : '📁'}</span>
                                </div>
                            </button>

                            {/* LIVELLO SESSIONI */}
                            {isExpanded && (
                                <div className="p-4 space-y-3 bg-gray-50/50">
                                    {group.sessions.map((session) => {
                                        const isSessionExpanded = expandedSession === session._id;
                                        const timeOfDay = getTimeOfDay(session.createdAt);
                                        const sceneReached = (session.lastSlideReached || 0) + 1;

                                        return (
                                            <div key={session._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSession(isSessionExpanded ? null : session._id)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                            {formatDate(session.createdAt)}
                                                        </span>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${timeOfDay.color}`}>
                                                            {timeOfDay.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <StressBadge level={session.stressLevel} size="sm" />
                                                        {session.pageVisibilitySwitches > 0 && (
                                                            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-lg border border-purple-200 flex items-center gap-1 animate-pulse">
                                                                📺 {session.pageVisibilitySwitches} Switch
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500">
                                                            Scena {sceneReached}/{storyInfo.slides}
                                                        </span>
                                                        <span className={`transition-transform ${isSessionExpanded ? 'rotate-180' : ''}`}>
                                                            ▼
                                                        </span>
                                                    </div>
                                                </button>

                                                {/* LIVELLO SCENE */}
                                                {isSessionExpanded && (
                                                    <div className="p-4 border-t border-gray-100">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                                <p className="text-[10px] text-gray-400 font-black uppercase">Completamento</p>
                                                                <p className="text-lg font-bold text-emerald-600">{session.completionRate}%</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                                <p className="text-[10px] text-gray-400 font-black uppercase">Durata</p>
                                                                <p className="text-lg font-bold text-gray-700">{Math.round(session.totalDuration || 0)}s</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                                <p className="text-[10px] text-gray-400 font-black uppercase">Rage Click</p>
                                                                <p className={`text-lg font-bold ${session.totalRageClicks > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                                    {session.totalRageClicks || 0}
                                                                </p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                                <p className="text-[10px] text-gray-400 font-black uppercase">Reversals</p>
                                                                <p className="text-lg font-bold text-gray-700">{session.totalPageReversals || 0}</p>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider">
                                                                    <tr>
                                                                        <th className="p-3 text-left rounded-tl-lg">Scena</th>
                                                                        <th className="p-3 text-left">Tempo</th>
                                                                        <th className="p-3 text-left">Click</th>
                                                                        <th className="p-3 text-left">Miss</th>
                                                                        <th className="p-3 text-left">Random</th>
                                                                        <th className="p-3 text-left">Switch</th>
                                                                        <th className="p-3 text-left">Rage</th>
                                                                        <th className="p-3 text-left">Hesitation</th>
                                                                        <th className="p-3 text-left rounded-tr-lg">Dwell</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {session.slideData?.map((slide, idx) => (
                                                                        <tr
                                                                            key={idx}
                                                                            className={`${slide.rageClicks > 0 ? 'bg-red-50' : ''} hover:bg-gray-50 transition-colors`}
                                                                        >
                                                                            <td className="p-3 font-bold text-gray-700">#{slide.slideIndex + 1}</td>
                                                                            <td className="p-3">{Math.round(slide.timeSpent)}s</td>
                                                                            <td className="p-3">{slide.clicks}</td>
                                                                            <td className="p-3 text-amber-600">{slide.missClicks > 0 ? slide.missClicks : '-'}</td>
                                                                            <td className="p-3 text-purple-600">{slide.randomClicks > 0 ? slide.randomClicks : '-'}</td>
                                                                            <td className="p-3 text-indigo-600 font-bold">{slide.pageVisibilitySwitches > 0 ? `📺 ${slide.pageVisibilitySwitches}` : '-'}</td>
                                                                            <td className="p-3">
                                                                                {slide.rageClicks > 0 ? (
                                                                                    <span className="text-red-600 font-black">🚨 {slide.rageClicks}</span>
                                                                                ) : '-'}
                                                                            </td>
                                                                            <td className="p-3 text-gray-500">
                                                                                {slide.hesitationTime > 0 ? `${Math.round(slide.hesitationTime / 1000)}s` : '-'}
                                                                            </td>
                                                                            <td className="p-3 text-gray-500">
                                                                                {slide.dwellTime > 0 ? `${Math.round(slide.dwellTime / 1000)}s` : '-'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StoryAnalysis;
