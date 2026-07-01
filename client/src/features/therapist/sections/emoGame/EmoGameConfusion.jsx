// ─── EmoGameConfusion — Matrice di confusione + Guida teorica ────────────────
import React from 'react';
import { EMOTION_COLORS, getEmotionColor } from './emoGameUtils';

/**
 * Componente puro: riceve `confusionMatrix` e `activeEmotions`.
 * Renderizza la tabella heatmap e la guida teorica clinica.
 */
const EmoGameConfusion = ({ confusionMatrix, activeEmotions }) => {
    return (
        <>
            {/* ── Matrice di Confusione ── */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <h3 className="font-extrabold text-gray-800 text-lg">🟩 Matrice di Confusione Dinamica</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Righe = emozione corretta richiesta. Colonne = emozione selezionata dal bambino. La diagonale verde indica le risposte corrette.</p>
                </div>

                <div className="overflow-x-auto my-4 w-full">
                    {activeEmotions.length === 0 ? (
                        <div className="text-center py-6 text-xs text-gray-400 font-bold italic">
                            Nessun dato registrato per la costruzione della matrice.
                        </div>
                    ) : (
                        <table className="text-center border-collapse" style={{ minWidth: `${(activeEmotions.length + 1) * 80}px`, width: '100%' }}>
                            <thead>
                                <tr>
                                    <th className="p-2 bg-gray-50 text-left text-[9px] font-black text-gray-400 uppercase tracking-tight border border-gray-100 min-w-[90px]">
                                        <div className="text-gray-400">Corretta ↓</div>
                                        <div className="text-gray-300">Cliccata →</div>
                                    </th>
                                    {activeEmotions.map(emo => {
                                        const color = EMOTION_COLORS[emo] || getEmotionColor(emo);
                                        return (
                                            <th key={emo} className="p-2 text-[11px] font-black uppercase border border-gray-100 whitespace-nowrap"
                                                style={{ color, background: `${color}12` }} title={emo}>
                                                {emo}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {activeEmotions.map(target => {
                                    const rowTotal     = activeEmotions.reduce((sum, s) => sum + (confusionMatrix[target]?.[s] || 0), 0);
                                    const targetColor  = EMOTION_COLORS[target] || getEmotionColor(target);
                                    return (
                                        <tr key={target} className="hover:bg-gray-50/30">
                                            <td className="p-2 text-left text-[11px] font-black uppercase border border-gray-100 whitespace-nowrap"
                                                style={{ color: targetColor, background: `${targetColor}12` }}>
                                                {target}
                                            </td>
                                            {activeEmotions.map(selected => {
                                                const value         = confusionMatrix[target]?.[selected] || 0;
                                                const isCorrectCell = target === selected;
                                                const pct           = rowTotal > 0 ? Math.round((value / rowTotal) * 100) : 0;

                                                let cellStyle = { color: '#cbd5e1' };
                                                if (value > 0) {
                                                    const opacity = Math.min(0.15 + value * 0.18, 0.92);
                                                    cellStyle = isCorrectCell
                                                        ? { backgroundColor: `rgba(16,185,129,${opacity})`, color: opacity > 0.5 ? '#fff' : '#065f46', fontWeight: 900 }
                                                        : { backgroundColor: `rgba(239,68,68,${opacity})`,  color: opacity > 0.5 ? '#fff' : '#7f1d1d', fontWeight: 700 };
                                                }

                                                return (
                                                    <td key={selected} style={cellStyle}
                                                        className="p-2 border border-gray-100 text-xs transition-all"
                                                        title={value > 0 ? `${target} → ${selected}: ${value} volt${value === 1 ? 'a' : 'e'} (${pct}%)` : ''}>
                                                        {value > 0 ? (
                                                            <span className="flex flex-col items-center leading-tight">
                                                                <span className="font-black text-sm">{value}</span>
                                                                {rowTotal > 0 && <span className="text-[9px] opacity-80">{pct}%</span>}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-200 text-xs">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-400 inline-block" /><span>Risposta corretta (diagonale)</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-400 inline-block" /><span>Errore (fuori diagonale)</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-gray-300 font-black">—</span><span>Nessuna occorrenza</span></div>
                    <div className="ml-auto text-gray-400 font-bold italic">Ogni cella mostra: conteggio e % sulla riga</div>
                </div>
            </div>

            {/* ── Guida Teorica ── */}
            <div className="mt-12 pt-8 border-t border-gray-100 bg-slate-50/40 rounded-3xl p-6 border border-slate-100">
                <div className="mb-6">
                    <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                        📖 Guida Teorica e Clinica alle Analytics
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Manuale di consultazione clinica per l'interpretazione dei dati cognitivi ed emotivi raccolti</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        {
                            icon: '🎯', color: 'text-emerald-500', title: 'Accuratezza Globale',
                            text: 'Rappresenta la percentuale di successo sul primo click. A livello clinico, misura la solidità del repertorio emotivo del bambino: una precisione elevata al primo colpo indica che lo schema cognitivo associato a quell\'emozione è ben stabilizzato e facilmente accessibile.'
                        },
                        {
                            icon: '⏱️', color: 'text-indigo-500', title: 'Esitazione Media',
                            text: 'Il tempo di latenza riflette la velocità di elaborazione dello stimolo sociale. Un tempo prolungato può suggerire un alto carico cognitivo, mentre tempi molto ridotti con errori possono essere indicativi di deficit di inibizione della risposta.'
                        },
                        {
                            icon: '⚡', color: 'text-rose-500', title: 'Indice di Impulsività',
                            text: 'Rappresenta la percentuale di errori commessi in meno di 2.5 secondi. Un valore elevato evidenzia la tendenza a selezionare risposte motorie rapide ed automatiche, prima di aver completato l\'analisi cognitiva dello scenario emotivo (risposta disfunzionale tipica dello spettro autistico).'
                        },
                        {
                            icon: '📶', color: 'text-amber-500', title: 'Livelli di Difficoltà',
                            text: 'Il passaggio tra i livelli misura la capacità di generalizzazione:\n• Livello I (Emoji): forme stilizzate e canoniche.\n• Livello II (Immagini): contesti reali ed espressivi.\n• Livello III (Video): micro-espressioni e indizi contestuali dinamici.'
                        },
                        {
                            icon: '🟩', color: 'text-purple-500', title: 'Matrice di Confusione Dinamica', span: true,
                            text: 'Mappa l\'esatto pattern di errore del bambino. Non si limita a segnalare se risponde bene o male, ma mostra quali emozioni vengono scambiate (es. confondere la "Rabbia" con la "Tristezza"). Questo dato è fondamentale per progettare interventi terapeutici mirati sulle aree di reale sovrapposizione percettiva.'
                        },
                    ].map(({ icon, color, title, text, span }) => (
                        <div key={title} className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm ${span ? 'lg:col-span-2' : ''}`}>
                            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                                <span className={color}>{icon}</span> {title}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default EmoGameConfusion;
