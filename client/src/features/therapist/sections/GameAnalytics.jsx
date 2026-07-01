// src/components/therapist/sections/GameAnalytics.jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// I dati arrivano dal componente padre (TherapistAnalytics) — nessuna fetch autonoma
const GameAnalytics = ({ gameSessions = [], allStories = [] }) => {
    const [selectedGame, setSelectedGame] = useState('all');
    const [expandedSession, setExpandedSession] = useState(null);
    const [expandedStory, setExpandedStory] = useState(null);

    // Filters
    const [dateFilter, setDateFilter] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, completed, incomplete
    const [limitFilter, setLimitFilter] = useState('all');

    const getStoryTitle = (storyId) => {
        if (!allStories || Object.keys(allStories).length === 0) return 'Caricamento...';
        const story = allStories[storyId];
        return story ? story.title : 'Storia sconosciuta';
    };

    if (gameSessions.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <span className="text-4xl block mb-3">🎮</span>
                <h3 className="text-lg font-bold text-gray-700">Nessun dato di gioco</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Il bambino non ha ancora completato giochi di sequencing o emotion matching.
                </p>
            </div>
        );
    }

    // Filtra tutte le sessioni
    let filteredSessions = [...gameSessions];

    // 1. Tipo Gioco
    if (selectedGame !== 'all') {
        filteredSessions = filteredSessions.filter(s => s.gameType === selectedGame);
    }

    // 2. Filtro Data
    const now = new Date();
    if (dateFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredSessions = filteredSessions.filter(s => new Date(s.playedAt) >= startOfDay);
    } else if (dateFilter === 'week') {
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredSessions = filteredSessions.filter(s => new Date(s.playedAt) >= startOfWeek);
    } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredSessions = filteredSessions.filter(s => new Date(s.playedAt) >= startOfMonth);
    } else if (dateFilter === 'custom' && customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        filteredSessions = filteredSessions.filter(s => {
            const date = new Date(s.playedAt);
            return date >= start && date <= end;
        });
    }

    // 3. Filtro Stato
    if (statusFilter === 'completed') {
        filteredSessions = filteredSessions.filter(s => s.completed === true);
    } else if (statusFilter === 'incomplete') {
        filteredSessions = filteredSessions.filter(s => s.completed === false);
    }

    // Raggruppamento in Cartelle (per storia)
    const storyGroups = (() => {
        const groups = {};
        filteredSessions.forEach(s => {
            if (!groups[s.storyId]) groups[s.storyId] = [];
            groups[s.storyId].push(s);
        });

        let finalGroups = Object.entries(groups).map(([storyId, sessions]) => {
            const sortedSessions = sessions.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
            return {
                storyId,
                sessions: sortedSessions,
                lastActivity: sortedSessions[0]?.playedAt || new Date(),
                avgAccuracy: Math.round(sortedSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sortedSessions.length)
            };
        }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        // 4. Limite Storie
        if (limitFilter !== 'all') {
            finalGroups = finalGroups.slice(0, parseInt(limitFilter));
        }

        return finalGroups;
    })();

    // Statistiche aggregate
    const sequencingSessions = gameSessions.filter(s => s.gameType === 'sequencing');
    const emotionSessions = gameSessions.filter(s => s.gameType === 'emotion_matching');

    const avgSequencingAccuracy = sequencingSessions.length > 0
        ? Math.round(sequencingSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sequencingSessions.length)
        : 0;

    const avgEmotionAccuracy = emotionSessions.length > 0
        ? Math.round(emotionSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / emotionSessions.length)
        : 0;

    // Dati per grafico trend
    const timelineData = filteredSessions
        .sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt))
        .map((s, i) => ({
            session: `G${i + 1}`,
            date: new Date(s.playedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
            accuracy: s.accuracy || 0,
            duration: Math.round((s.totalDuration || 0) / 60), // minuti
            hesitation: Math.round((s.avgHesitationTime || 0) / 1000), // secondi
            gameType: s.gameType === 'sequencing' ? 'Sequencing' : 'Emozioni'
        }));

    // Dati per grafico a barre per gioco
    const gameComparison = [
        {
            name: 'Sequencing',
            sessions: sequencingSessions.length,
            accuracy: avgSequencingAccuracy,
            avgDuration: sequencingSessions.length > 0
                ? Math.round(sequencingSessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0) / sequencingSessions.length / 60)
                : 0,
            color: '#f59e0b'
        },
        {
            name: 'Emotion Matching',
            sessions: emotionSessions.length,
            accuracy: avgEmotionAccuracy,
            avgDuration: emotionSessions.length > 0
                ? Math.round(emotionSessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0) / emotionSessions.length / 60)
                : 0,
            color: '#3b82f6'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-800">🎮 Analisi Giochi Terapeutici</h2>
                    <p className="text-sm text-gray-500 mt-1">Performance nei giochi di sequencing e riconoscimento emozioni</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'sequencing', 'emotion_matching'].map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedGame(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedGame === type
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {type === 'all' ? 'Tutti' : type === 'sequencing' ? 'Sequencing' : 'Emozioni'}
                        </button>
                    ))}
                </div>
            </div>

            {/* FILTRI */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end border border-gray-100 shadow-sm">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Periodo</label>
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">A</label>
                            <input 
                                type="date" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stato Gioco</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Tutti</option>
                        <option value="completed">Solo Completati</option>
                        <option value="incomplete">Solo Incompleti</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Limite Storie</label>
                    <select 
                        value={limitFilter} 
                        onChange={(e) => setLimitFilter(e.target.value)}
                        className="text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Tutte</option>
                        <option value="10">10 Storie</option>
                        <option value="50">50 Storie</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">🧩</div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase">Sequencing</p>
                            <p className="text-2xl font-black text-gray-800">{avgSequencingAccuracy}%</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Precisione media • {sequencingSessions.length} sessioni</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🎭</div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase">Emotion Matching</p>
                            <p className="text-2xl font-black text-gray-800">{avgEmotionAccuracy}%</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Precisione media • {emotionSessions.length} sessioni</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">⏱️</div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase">Hesitation Time</p>
                            <p className="text-2xl font-black text-gray-800">
                                {filteredSessions.length > 0
                                    ? Math.round(filteredSessions.reduce((sum, s) => sum + (s.avgHesitationTime || 0), 0) / filteredSessions.length / 1000)
                                    : 0}s
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Tempo medio prima della prima mossa</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">✅</div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase">Completamento</p>
                            <p className="text-2xl font-black text-gray-800">
                                {filteredSessions.filter(s => s.completed).length}/{filteredSessions.length}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Sessioni completate</p>
                </div>
            </div>

            {/* Grafici */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend precisione */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-black text-gray-700 mb-4">📈 Trend Precisione</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={timelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`${value}%`, 'Precisione']}
                            />
                            <Line
                                type="monotone"
                                dataKey="accuracy"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Confronto giochi */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-black text-gray-700 mb-4">📊 Confronto Giochi</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={gameComparison} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={100} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Bar dataKey="accuracy" name="Precisione %" radius={[0, 8, 8, 0]}>
                                {gameComparison.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabella dettaglio sessioni a Cartelle */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-700">📋 Dettaglio per Storia</h3>
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 flex items-center">
                        {filteredSessions.length} Partite in {storyGroups.length} Storie
                    </span>
                </div>

                <div className="space-y-4">
                    {storyGroups.map((group) => {
                        const isExpanded = expandedStory === group.storyId;

                        return (
                            <div key={group.storyId} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                {/* LIVELLO STORIA */}
                                <button
                                    onClick={() => setExpandedStory(isExpanded ? null : group.storyId)}
                                    className={`w-full flex items-center justify-between p-5 transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isExpanded ? 'bg-white/20' : 'bg-white'}`}>
                                            📚
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-black uppercase tracking-tight text-sm md:text-base truncate max-w-[200px] md:max-w-md">{getStoryTitle(group.storyId)}</h3>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isExpanded ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {group.sessions.length} partite • Precisione media: {group.avgAccuracy}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{isExpanded ? '📖' : '📁'}</span>
                                    </div>
                                </button>

                                {/* LIVELLO SESSIONI (GIOCHI) */}
                                {isExpanded && (
                                    <div className="p-4 bg-gray-50/50">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs bg-white rounded-xl shadow-sm border border-gray-100">
                                                <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider">
                                                    <tr>
                                                        <th className="p-3 text-left rounded-tl-lg">Data</th>
                                                        <th className="p-3 text-left">Gioco</th>
                                                        <th className="p-3 text-left">Precisione</th>
                                                        <th className="p-3 text-left">Mosse</th>
                                                        <th className="p-3 text-left">Corrette</th>
                                                        <th className="p-3 text-left">Hesitation</th>
                                                        <th className="p-3 text-left">Durata</th>
                                                        <th className="p-3 text-left rounded-tr-lg">Stato</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {group.sessions.map((session, idx) => (
                                                        <React.Fragment key={session._id || idx}>
                                                            <tr 
                                                                onClick={() => setExpandedSession(expandedSession === session._id ? null : session._id)}
                                                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                                            >
                                                                <td className="p-3 font-medium text-gray-700">
                                                                    {new Date(session.playedAt).toLocaleDateString('it-IT')}
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${session.gameType === 'sequencing'
                                                                            ? 'bg-amber-100 text-amber-700'
                                                                            : 'bg-blue-100 text-blue-700'
                                                                        }`}>
                                                                        {session.gameType === 'sequencing' ? '🧩 Seq' : '🎭 Emo'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full rounded-full transition-all"
                                                                                style={{
                                                                                    width: `${session.accuracy || 0}%`,
                                                                                    backgroundColor: session.accuracy > 70 ? '#22c55e' : session.accuracy > 40 ? '#f59e0b' : '#ef4444'
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="font-bold text-gray-700">{session.accuracy}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-gray-600 font-medium">{session.totalMoves || '-'}</td>
                                                                <td className="p-3 text-green-600 font-bold">{session.correctMoves || '-'}</td>
                                                                <td className="p-3 text-gray-600">
                                                                    {session.avgHesitationTime ? `${Math.round(session.avgHesitationTime / 1000)}s` : '-'}
                                                                </td>
                                                                <td className="p-3 text-gray-600">
                                                                    {session.totalDuration ? `${Math.round(session.totalDuration / 60)}min` : '-'}
                                                                </td>
                                                                <td className="p-3 flex items-center justify-between">
                                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${session.completed
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : 'bg-amber-100 text-amber-700'
                                                                        }`}>
                                                                        {session.completed ? 'Completo' : 'Incompleto'}
                                                                    </span>
                                                                    <span className="text-gray-300 group-hover:text-indigo-400 transition-colors ml-2">
                                                                        {expandedSession === session._id ? '▲' : '▼'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            
                                                            {/* DETTAGLIO MOSSE */}
                                                            {expandedSession === session._id && (
                                                                <tr className="bg-indigo-50/50">
                                                                    <td colSpan="8" className="p-4">
                                                                        <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm">
                                                                            <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-4">Analisi Dettagliata Mosse</h4>
                                                                            {session.moves && session.moves.length > 0 ? (
                                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                                                    {session.moves.map((move, mIdx) => (
                                                                                        <div key={mIdx} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center shadow-sm">
                                                                                            <p className="text-[9px] text-gray-400 font-black mb-2 tracking-wider">MOSSA {mIdx + 1}</p>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${move.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                                                    {move.isCorrect ? '✅' : '❌'}
                                                                                                </div>
                                                                                                <span className="text-xs font-black text-gray-700">
                                                                                                    {(move.moveDuration / 1000).toFixed(1)}s
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-center py-4 bg-gray-50 rounded-xl">
                                                                                    <p className="text-xs text-gray-400 font-bold italic">Dettagli mosse non disponibili per questa partita.</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
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
            </div>

            {/* Insight clinici sui giochi */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-6">
                <h3 className="text-sm font-black text-indigo-800 mb-4">🔍 Insight Clinici - Giochi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {avgSequencingAccuracy < 50 && sequencingSessions.length >= 3 && (
                        <div className="bg-white rounded-xl p-4 border-l-4 border-red-400 shadow-sm">
                            <p className="text-sm font-bold text-red-700 mb-1">⚠️ Difficoltà Sequencing</p>
                            <p className="text-xs text-gray-600">
                                Precisione media solo {avgSequencingAccuracy}% nel sequencing. Il bambino potrebbe avere difficoltà con la comprensione della sequenza temporale o della narrazione.
                            </p>
                        </div>
                    )}

                    {avgEmotionAccuracy < 50 && emotionSessions.length >= 3 && (
                        <div className="bg-white rounded-xl p-4 border-l-4 border-red-400 shadow-sm">
                            <p className="text-sm font-bold text-red-700 mb-1">⚠️ Difficoltà Riconoscimento Emozioni</p>
                            <p className="text-xs text-gray-600">
                                Precisione {avgEmotionAccuracy}% nel riconoscimento emozioni. Considerare esercizi mirati sulle espressioni facciali.
                            </p>
                        </div>
                    )}

                    {filteredSessions.length > 0 &&
                        filteredSessions.every(s => (s.avgHesitationTime || 0) > 5000) && (
                            <div className="bg-white rounded-xl p-4 border-l-4 border-amber-400 shadow-sm">
                                <p className="text-sm font-bold text-amber-700 mb-1">⏱️ Tempo di Reazione Elevato</p>
                                <p className="text-xs text-gray-600">
                                    Hesitation time consistentemente alto. Il bambino impiega molto tempo prima di interagire, possibile indicatore di difficoltà decisionali o ansia da performance.
                                </p>
                            </div>
                        )}

                    {filteredSessions.filter(s => !s.completed).length > filteredSessions.length * 0.5 && (
                        <div className="bg-white rounded-xl p-4 border-l-4 border-orange-400 shadow-sm">
                            <p className="text-sm font-bold text-orange-700 mb-1">🛑 Abbandoni Frequenti</p>
                            <p className="text-xs text-gray-600">
                                Più del 50% delle sessioni non completate. Le storie/giochi potrebbero essere troppo lunghi o poco coinvolgenti.
                            </p>
                        </div>
                    )}

                    {avgSequencingAccuracy > 80 && avgEmotionAccuracy > 80 && (
                        <div className="bg-white rounded-xl p-4 border-l-4 border-green-400 shadow-sm">
                            <p className="text-sm font-bold text-green-700 mb-1">✅ Ottime Competenze</p>
                            <p className="text-xs text-gray-600">
                                Il bambino mostra ottime capacità sia nel sequencing che nel riconoscimento emotivo. Considerare aumento della difficoltà.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameAnalytics;
