import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { appContext } from '../../../context/appContext';

const EmoGameRecapModal = ({ emoGame, children, onClose }) => {
    const { backendUrl } = useContext(appContext);
    const [selectedChild, setSelectedChild] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [maxPossibleScore, setMaxPossibleScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [loading, setLoading] = useState(false);
    const [expandedSession, setExpandedSession] = useState(null);

    // Filtra i figli assegnati a questo emoGame
    const assignedChildren = (children || []).filter(c =>
        (emoGame.assignedChildren || []).some(id => String(id) === String(c._id))
    );

    const fetchSessions = async (childId) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/emoGame/${emoGame._id}/sessions/${childId}`);
            if (data.success) {
                setSessions(data.sessions || []);
                setMaxPossibleScore(data.maxPossibleScore || 0);
                setTotalQuestions(data.totalQuestions || 0);
            }
        } catch (e) {
            console.error('Errore fetch sessioni:', e);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChild = (child) => {
        setSelectedChild(child);
        setExpandedSession(null);
        fetchSessions(child._id);
    };

    useEffect(() => {
        if (assignedChildren.length === 1) {
            handleSelectChild(assignedChildren[0]);
        }
    }, []);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getScoreColor = (score, max) => {
        if (max === 0) return 'text-gray-500';
        const pct = score / max;
        if (pct >= 0.8) return 'text-green-600';
        if (pct >= 0.5) return 'text-amber-600';
        return 'text-red-500';
    };

    const getScoreBg = (score, max) => {
        if (max === 0) return 'bg-gray-100';
        const pct = score / max;
        if (pct >= 0.8) return 'bg-green-50 border-green-200';
        if (pct >= 0.5) return 'bg-amber-50 border-amber-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">📊 Recap Punteggi</h2>
                            <p className="text-purple-200 text-sm mt-1 font-bold">{emoGame.title}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xl font-bold transition-colors cursor-pointer border-none"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Selettore figlio */}
                    {assignedChildren.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="text-4xl block mb-3">👶</span>
                            <p className="text-gray-500 font-bold">Nessun figlio assegnato a questo EmoGame.</p>
                            <p className="text-gray-400 text-sm mt-1">Assegna prima l'EmoGame a un figlio per vedere i punteggi.</p>
                        </div>
                    ) : (
                        <>
                            {assignedChildren.length > 1 && (
                                <div className="mb-6">
                                    <label className="block text-xs font-black text-purple-700 uppercase mb-2 tracking-wider">
                                        Seleziona Figlio
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {assignedChildren.map(child => (
                                            <button
                                                key={child._id}
                                                onClick={() => handleSelectChild(child)}
                                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 cursor-pointer ${
                                                    selectedChild?._id === child._id
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                                        : 'bg-white text-purple-700 border-purple-200 hover:border-purple-400'
                                                }`}
                                            >
                                                👤 {child.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contenuto sessioni */}
                            {!selectedChild ? (
                                <div className="text-center py-10 text-gray-400 font-bold">
                                    <span className="text-4xl block mb-3">👆</span>
                                    Seleziona un figlio per vedere i punteggi
                                </div>
                            ) : loading ? (
                                <div className="text-center py-10">
                                    <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                                    <p className="text-gray-500 mt-3 font-bold">Caricamento...</p>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-10">
                                    <span className="text-4xl block mb-3">🎮</span>
                                    <p className="text-gray-500 font-bold">{selectedChild.name} non ha ancora giocato questo EmoGame.</p>
                                    <p className="text-gray-400 text-sm mt-1">I punteggi appariranno qui dopo la prima partita.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Riepilogo veloce */}
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
                                            <span className="text-2xl font-black text-purple-700">{sessions.length}</span>
                                            <p className="text-[10px] font-bold text-purple-500 uppercase mt-1">Partite</p>
                                        </div>
                                        <div className={`rounded-2xl p-4 text-center border ${getScoreBg(sessions[0]?.score ?? 0, maxPossibleScore)}`}>
                                            <span className={`text-2xl font-black ${getScoreColor(sessions[0]?.score ?? 0, maxPossibleScore)}`}>
                                                {sessions[0]?.score ?? 0}/{maxPossibleScore}
                                            </span>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Ultimo Punteggio</p>
                                        </div>
                                        <div className="bg-indigo-50 rounded-2xl p-4 text-center border border-indigo-100">
                                            <span className="text-2xl font-black text-indigo-700">
                                                {Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length)}
                                            </span>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Media Punti</p>
                                        </div>
                                    </div>

                                    {/* Lista sessioni */}
                                    <h3 className="text-xs font-black text-gray-600 uppercase tracking-wider">Storico Partite</h3>
                                    {sessions.map((session, idx) => (
                                        <div
                                            key={session.sessionId || idx}
                                            className={`bg-white border-2 rounded-2xl transition-all ${
                                                expandedSession === idx ? 'border-purple-300 shadow-md' : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            <button
                                                onClick={() => setExpandedSession(expandedSession === idx ? null : idx)}
                                                className="w-full flex items-center justify-between p-4 cursor-pointer bg-transparent border-none text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm ${
                                                        idx === 0 ? 'bg-purple-500' : 'bg-gray-400'
                                                    }`}>
                                                        {idx === 0 ? '🏆' : `#${idx + 1}`}
                                                    </span>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-800">{formatDate(session.playedAt)}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                session.completed
                                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                {session.completed ? 'Completata' : 'Risposta Errata'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {session.total || totalQuestions} quesiti
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-black ${getScoreColor(session.score ?? 0, maxPossibleScore)}`}>
                                                        {session.score ?? 0}
                                                        <span className="text-sm text-gray-400 font-bold">/{maxPossibleScore}</span>
                                                    </span>
                                                    <span className={`text-gray-400 transition-transform ${expandedSession === idx ? 'rotate-180' : ''}`}>
                                                        ▼
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Dettaglio espanso */}
                                            {expandedSession === idx && session.results && (
                                                <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                                                    {session.results.map((r, ri) => (
                                                        <div key={ri} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                                                                    {(r.sceneIndex ?? ri) + 1}
                                                                </span>
                                                                <span className="text-sm text-gray-700 font-medium truncate max-w-[250px]">
                                                                    {r.question || `Quesito ${(r.sceneIndex ?? ri) + 1}`}
                                                                </span>
                                                            </div>
                                                            <span className={`text-sm font-black ${r.score > 0 ? 'text-green-600' : 'text-red-400'}`}>
                                                                {r.score ?? 0} pt
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmoGameRecapModal;
