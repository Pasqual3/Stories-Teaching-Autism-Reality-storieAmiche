// ─── EmoGameHistory — Tab Storico Partite (accordion 3 livelli) ──────────────
import React, { useState } from 'react';
import { formatDate, getTimeOfDay } from './emoGameUtils';

/**
 * Componente che gestisce il proprio stato di accordion (story → session → risposte).
 * Riceve `storyGroups` già calcolati dal hook.
 */
const EmoGameHistory = ({ storyGroups }) => {
    const [expandedStory,   setExpandedStory]   = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);

    if (storyGroups.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center text-gray-400 font-bold text-sm">
                Nessun EmoGame giocato nel periodo selezionato.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {storyGroups.map((group) => {
                const isExpanded = expandedStory === group.storyId;

                return (
                    <div key={group.storyId} className="border border-purple-100 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">

                        {/* ── LIVELLO 1: EmoGame ── */}
                        <button
                            onClick={() => setExpandedStory(isExpanded ? null : group.storyId)}
                            className={`w-full flex items-center justify-between p-5 transition-all text-left ${
                                isExpanded ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white' : 'bg-purple-50/50 hover:bg-purple-50 text-gray-800'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isExpanded ? 'bg-white/20' : 'bg-purple-100 text-purple-700'}`}>
                                    🎮
                                </div>
                                <div>
                                    <h3 className="font-extrabold uppercase tracking-tight text-sm md:text-base">{group.title}</h3>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isExpanded ? 'text-purple-200' : 'text-purple-600'}`}>
                                        Livello: {group.difficulty} • Partite: {group.sessions.length} • Risposte Corrette: {group.accuracy}% • Punti Medi: {group.avgScore}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${isExpanded ? 'bg-white/20 text-white' : 'bg-purple-200/50 text-purple-800'}`}>
                                    {group.sessions.length} {group.sessions.length === 1 ? 'partita' : 'partite'}
                                </span>
                                <span className="text-lg">{isExpanded ? '📖' : '📁'}</span>
                            </div>
                        </button>

                        {/* ── LIVELLO 2: Sessioni ── */}
                        {isExpanded && (
                            <div className="p-4 bg-gray-50/50 space-y-3">
                                {group.sessions.map((session, sIdx) => {
                                    const sessionKey       = `${group.storyId}-${sIdx}`;
                                    const isSessionExpanded = expandedSession === sessionKey;
                                    const timeInfo         = getTimeOfDay(session.playedAt);

                                    return (
                                        <div key={session.sessionId || sIdx} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">

                                            {/* Header Sessione */}
                                            <button
                                                onClick={() => setExpandedSession(isSessionExpanded ? null : sessionKey)}
                                                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 text-left hover:bg-purple-50/20 transition-all gap-2"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                        {formatDate(session.playedAt)}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${timeInfo.color}`}>
                                                        {timeInfo.label}
                                                    </span>
                                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                                        session.isCompleted
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : session.isAbandoned
                                                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                        {session.isCompleted ? '🏆 Gioco Completato' : session.isAbandoned ? '❌ Abbandonato' : `Parziale (${session.accuracy}%)`}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-400 font-extrabold uppercase leading-none">Punti Totali</p>
                                                            <p className="text-base font-black text-purple-700">{session.totalScore} pts</p>
                                                        </div>
                                                        <div className="text-right border-l pl-4 border-gray-100">
                                                            <p className="text-[10px] text-gray-400 font-extrabold uppercase leading-none">Esitazione Media</p>
                                                            <p className="text-base font-black text-gray-700">{session.avgHesitation}s</p>
                                                        </div>
                                                        <div className="text-right border-l pl-4 border-gray-100">
                                                            <p className="text-[10px] text-gray-400 font-extrabold uppercase leading-none">Quesiti</p>
                                                            <p className="text-base font-black text-gray-700">{session.totalCount}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-400 transition-transform duration-300">
                                                        {isSessionExpanded ? '▲' : '▼'}
                                                    </span>
                                                </div>
                                            </button>

                                            {/* ── LIVELLO 3: Quesiti ── */}
                                            {isSessionExpanded && (
                                                <div className="p-4 border-t border-gray-100 bg-purple-50/10 space-y-4">
                                                    <h4 className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Dettaglio risposte della sessione</h4>
                                                    {session.responses.length === 0 ? (
                                                        <p className="text-xs text-gray-400 font-bold italic py-2">Nessun tentativo registrato prima dell'abbandono.</p>
                                                    ) : (
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            {session.responses.map((resp, rIdx) => {
                                                                const isCorrect    = resp.isCorretta === true;
                                                                const hasImage     = !!resp.rispostaImageUrl;
                                                                const latencySec   = ((resp.calculatedHesitation || 3800) / 1000).toFixed(1);

                                                                return (
                                                                    <div
                                                                        key={resp._id || rIdx}
                                                                        className={`p-4 rounded-xl border-2 flex gap-3 ${
                                                                            isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'
                                                                        }`}
                                                                    >
                                                                        <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl overflow-hidden shrink-0 border">
                                                                            {hasImage ? (
                                                                                <img src={resp.rispostaImageUrl} alt="Opzione scelta" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <span>💭</span>
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                                                                                    Scena {resp.sceneIndex + 1} • {resp.tipo === 'libera' ? 'Espressiva' : 'Ricettiva'}
                                                                                </span>
                                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                                                                    isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                                                                }`}>
                                                                                    {isCorrect ? `Esatta (+${resp.score || 0} pts)` : `Errata (0 pts)`}
                                                                                </span>
                                                                            </div>

                                                                            <p className="text-xs font-extrabold text-gray-600 mb-2 leading-tight">
                                                                                {resp.domanda || 'Domanda non registrata'}
                                                                            </p>

                                                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                                                <div className="bg-white p-2 rounded-lg border border-gray-100 text-xs">
                                                                                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Risposta data:</span>
                                                                                    <p className="font-extrabold text-gray-800 mt-0.5">{resp.risposta}</p>
                                                                                </div>
                                                                                <div className="bg-white p-2 rounded-lg border border-gray-100 text-xs">
                                                                                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Esitazione:</span>
                                                                                    <p className="font-extrabold text-gray-800 mt-0.5">{latencySec} secondi</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
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
    );
};

export default EmoGameHistory;
