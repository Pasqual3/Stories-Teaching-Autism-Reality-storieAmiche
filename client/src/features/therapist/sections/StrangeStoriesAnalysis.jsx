import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ANALYTICS_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/analytics`;

const StrangeStoriesAnalysis = ({ childId, therapistId, allStories = {} }) => {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedStory, setExpandedStory] = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);

    // Filters
    const [dateFilter, setDateFilter] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [correctnessFilter, setCorrectnessFilter] = useState('all');
    const [limitFilter, setLimitFilter] = useState('all');

    const getStoryTitle = (storyId) => {
        return allStories[storyId]?.title || 'Storia sconosciuta';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeOfDay = (dateString) => {
        const hour = new Date(dateString).getHours();
        if (hour >= 6 && hour < 12) return { label: 'Mattina', color: 'bg-orange-50 text-orange-600' };
        if (hour >= 12 && hour < 18) return { label: 'Pomeriggio', color: 'bg-blue-50 text-blue-600' };
        if (hour >= 18 && hour < 22) return { label: 'Sera', color: 'bg-indigo-50 text-indigo-600' };
        return { label: 'Notte', color: 'bg-slate-800 text-slate-100' };
    };

    const loadResponses = async () => {
        if (!childId) return;
        setLoading(true);
        try {
            const { data } = await axios.get(
                `${ANALYTICS_URL}/therapist/${therapistId}/child/${childId}/strange-story-responses?gameType=story`,
                { withCredentials: true }
            );
            if (data.success) {
                setResponses(data.responses);
            }
        } catch (err) {
            console.error('Errore caricamento Strange Stories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResponses();
    }, [childId, therapistId]);

    // Raggruppamento per Sessione (euristica: risposte entro 1 ora nella stessa storia)
    const groupResponsesIntoSessions = (storyResponses) => {
        const sorted = [...storyResponses].sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt));
        const sessions = [];
        if (sorted.length === 0) return sessions;

        let currentSession = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            const lastResp = currentSession[currentSession.length - 1];
            const currResp = sorted[i];
            
            const lastTime = new Date(lastResp.playedAt).getTime();
            const currTime = new Date(currResp.playedAt).getTime();
            
            // SEPARIAMO SE:
            // 1. Hanno sessionId diversi (se presenti entrambi)
            // 2. È passata più di un'ora (per vecchi record)
            // 3. L'indice della scena è inferiore o uguale a quello precedente (indicazione di nuovo inizio)
            
            const differentSessionId = currResp.sessionId && lastResp.sessionId && currResp.sessionId !== lastResp.sessionId;
            const timeGapTooLarge = currTime - lastTime > 60 * 60 * 1000;
            const sceneReset = currResp.sceneIndex <= lastResp.sceneIndex;

            if (differentSessionId || timeGapTooLarge || sceneReset) {
                sessions.push(currentSession);
                currentSession = [currResp];
            } else {
                currentSession.push(currResp);
            }
        }
        sessions.push(currentSession);
        return sessions.reverse(); // Più recenti prima
    };

    const storyGroups = (() => {
        // 1. Raggruppa per storia
        const groups = {};
        responses.forEach(r => {
            if (!groups[r.storyId]) groups[r.storyId] = [];
            groups[r.storyId].push(r);
        });

        // Date bounds sicuri (senza mutare l'oggetto now)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        let customStartDate = null;
        let customEndDate = null;
        if (dateFilter === 'custom' && customStart && customEnd) {
            customStartDate = new Date(customStart);
            customEndDate = new Date(customEnd);
            customEndDate.setHours(23, 59, 59, 999);
        }

        let finalGroups = Object.entries(groups).map(([storyId, storyResponses]) => {
            let sessions = groupResponsesIntoSessions(storyResponses);
            
            // 2. Filtro Data sulle Sessioni
            if (dateFilter !== 'all') {
                sessions = sessions.filter(session => {
                    const sessionDate = new Date(session[0].playedAt);
                    if (dateFilter === 'today') return sessionDate >= startOfDay;
                    if (dateFilter === 'week') return sessionDate >= startOfWeek;
                    if (dateFilter === 'month') return sessionDate >= startOfMonth;
                    if (dateFilter === 'custom' && customStartDate && customEndDate) {
                        return sessionDate >= customStartDate && sessionDate <= customEndDate;
                    }
                    return true;
                });
            }

            // 3. Filtro Esito sulle Sessioni
            if (correctnessFilter === 'correct') {
                // Solo sessioni perfette (100% corrette)
                sessions = sessions.filter(session => session.every(r => r.isCorretta === true));
            } else if (correctnessFilter === 'wrong') {
                // Sessioni che contengono almeno un errore
                sessions = sessions.filter(session => session.some(r => r.isCorretta === false));
            }

            return {
                storyId,
                sessions,
                lastActivity: sessions[0]?.[0]?.playedAt || new Date(0)
            };
        })
        .filter(group => group.sessions.length > 0) // Rimuoviamo le storie senza sessioni dopo i filtri
        .map(group => {
            const allFilteredResponses = group.sessions.flat();
            const accuracy = allFilteredResponses.length > 0
                ? Math.round((allFilteredResponses.filter(r => r.isCorretta).length / allFilteredResponses.length) * 100)
                : 0;
            return {
                ...group,
                totalResponses: allFilteredResponses.length,
                accuracy
            };
        })
        .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        // 4. Filtro Limite Storie
        if (limitFilter !== 'all') {
            finalGroups = finalGroups.slice(0, parseInt(limitFilter));
        }

        return finalGroups;
    })();

    if (loading) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 mt-2 text-sm">Caricamento risposte Strange Stories...</p>
            </div>
        );
    }

    if (responses.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <span className="text-4xl block mb-3">🤔</span>
                <h3 className="text-lg font-bold text-gray-700">Nessun test Strange Story</h3>
                <p className="text-sm text-gray-500 mt-1">Il bambino non ha ancora risposto a domande di comprensione sociale.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        🤔 Analisi Strange Stories
                        <button 
                            onClick={loadResponses}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors group"
                            title="Aggiorna dati"
                        >
                            <span className="text-sm block group-hover:rotate-180 transition-transform duration-500">🔄</span>
                        </button>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Dettaglio risposte per storia e sessione</p>
                </div>
                <div className="flex gap-2">
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold border border-amber-100 flex items-center">
                        {storyGroups.reduce((acc, g) => acc + g.totalResponses, 0)} Risposte
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 flex items-center">
                        {storyGroups.length} Storie Mostrate
                    </span>
                </div>
            </div>

            {/* FILTRI */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end border border-gray-100 shadow-sm">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Periodo</label>
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">Sempre</option>
                        <option value="today">Oggi</option>
                        <option value="week">Ultimi 7 gg</option>
                        <option value="month">Ultimo Mese</option>
                        <option value="custom">Personalizzato</option>
                    </select>
                </div>

                {dateFilter === 'custom' && (
                    <div className="flex items-end gap-2 animate-fadeIn">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Da</label>
                            <input 
                                type="date" 
                                value={customStart} 
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">A</label>
                            <input 
                                type="date" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Esito</label>
                    <select 
                        value={correctnessFilter} 
                        onChange={(e) => setCorrectnessFilter(e.target.value)}
                        className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">Tutte le risposte</option>
                        <option value="correct">Solo Corrette</option>
                        <option value="wrong">Solo Errate</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Limite Storie</label>
                    <select 
                        value={limitFilter} 
                        onChange={(e) => setLimitFilter(e.target.value)}
                        className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">Tutte</option>
                        <option value="10">10 Storie</option>
                        <option value="50">50 Storie</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {storyGroups.map((group) => {
                    const storyInfo = allStories[group.storyId] || { title: 'Storia Sconosciuta' };
                    const isExpanded = expandedStory === group.storyId;

                    return (
                        <div key={group.storyId} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            {/* LIVELLO STORIA */}
                            <button
                                onClick={() => setExpandedStory(isExpanded ? null : group.storyId)}
                                className={`w-full flex items-center justify-between p-5 transition-all ${isExpanded ? 'bg-amber-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isExpanded ? 'bg-white/20' : 'bg-white'}`}>
                                        🧩
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black uppercase tracking-tight text-sm md:text-base">{storyInfo.title}</h3>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isExpanded ? 'text-amber-100' : 'text-gray-400'}`}>
                                            {group.sessions.length} sessioni • Precisione media: {group.accuracy}%
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{isExpanded ? '📖' : '📁'}</span>
                                </div>
                            </button>

                            {/* LIVELLO SESSIONI */}
                            {isExpanded && (
                                <div className="p-4 space-y-3 bg-gray-50/50">
                                    {group.sessions.map((session, sIdx) => {
                                        const sessionKey = `${group.storyId}-${sIdx}`;
                                        const isSessionExpanded = expandedSession === sessionKey;
                                        const firstResp = session[0];
                                        const timeOfDay = getTimeOfDay(firstResp.playedAt);
                                        const correctInSession = session.filter(r => r.isCorretta).length;

                                        return (
                                            <div key={sessionKey} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => setExpandedSession(isSessionExpanded ? null : sessionKey)}
                                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                            {formatDate(firstResp.playedAt)}
                                                        </span>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${timeOfDay.color}`}>
                                                            {timeOfDay.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${correctInSession === session.length ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {correctInSession}/{session.length} Corrette
                                                        </span>
                                                        <span className={`transition-transform text-gray-400 ${isSessionExpanded ? 'rotate-180' : ''}`}>
                                                            ▼
                                                        </span>
                                                    </div>
                                                </button>

                                                {/* LIVELLO RISPOSTE (DETTAGLIO) */}
                                                {isSessionExpanded && (
                                                    <div className="p-5 border-t border-gray-50 space-y-6 animate-fadeIn">
                                                        {session.map((resp, rIdx) => (
                                                            <div key={rIdx} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded uppercase tracking-wider">Scena {resp.sceneIndex + 1}</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{resp.tipo?.replace('_', ' ')}</span>
                                                                </div>
                                                                
                                                                <div className="mb-4">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Domanda</p>
                                                                    <p className="text-sm font-bold text-gray-800 leading-snug break-words whitespace-normal">{resp.domanda}</p>
                                                                </div>

                                                                <div className="grid md:grid-cols-2 gap-4">
                                                                    <div className={`rounded-lg p-3 border ${resp.isCorretta ? 'bg-emerald-50 border-emerald-100' : resp.isCorretta === false ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                                                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Risposta Bambino</p>
                                                                        <div className="flex items-start gap-2">
                                                                            {resp.rispostaImageUrl ? (
                                                                                <img
                                                                                    src={resp.rispostaImageUrl}
                                                                                    alt="Opzione scelta"
                                                                                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-lg leading-none shrink-0">{resp.isCorretta ? '✅' : resp.isCorretta === false ? '❌' : '💬'}</span>
                                                                            )}
                                                                            <div className="min-w-0">
                                                                                {resp.rispostaImageUrl && (
                                                                                    <span className="text-base leading-none mr-1">{resp.isCorretta ? '✅' : resp.isCorretta === false ? '❌' : ''}</span>
                                                                                )}
                                                                                <p className={`text-sm font-black leading-tight break-words whitespace-normal ${resp.isCorretta ? 'text-emerald-700' : resp.isCorretta === false ? 'text-red-700' : 'text-gray-800'}`}>
                                                                                    {resp.risposta}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {resp.rispostaCorretta && (
                                                                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                                                                            <p className="text-[9px] font-black text-amber-500 uppercase mb-2">Risposta Target</p>
                                                                            <p className="text-sm font-bold text-gray-600 italic leading-tight break-words whitespace-normal">"{resp.rispostaCorretta}"</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
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

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default StrangeStoriesAnalysis;