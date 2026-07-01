// ─── EmoGameKPICards — 4 KPI cards cliniche ──────────────────────────────────
import React from 'react';

/**
 * Componente puro: riceve `clinicalKPIs` e renderizza le 4 card cliniche.
 * Tutta la logica di derivazione è in useEmoGameData.
 */
const EmoGameKPICards = ({ clinicalKPIs }) => {
    const InfoIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const KPICard = ({ label, tooltip, children }) => (
        <div className="bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col justify-between transform hover:scale-[1.02] transition-all duration-300 shadow-sm relative group">
            <div className="flex justify-between items-start">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">{label}</span>
                <div className="relative group/tooltip">
                    <button className="text-slate-300 hover:text-slate-500 transition-colors p-1 -m-1 focus:outline-none" aria-label="Informazioni">
                        <InfoIcon />
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-950 text-white text-[11px] p-3 rounded-2xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-bold border border-slate-800">
                        {tooltip}
                        <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-950" />
                    </div>
                </div>
            </div>
            {children}
        </div>
    );

    // ── Card 1: Accuratezza Globale ──────────────────────────────────────────
    const acc      = clinicalKPIs.globalAccuracy;
    const accColor = acc >= 75 ? 'text-emerald-600' : acc >= 50 ? 'text-amber-600' : 'text-rose-600';
    const accBadge = acc >= 75
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        : acc >= 50
            ? 'bg-amber-50 text-amber-700 border border-amber-100'
            : 'bg-rose-50 text-rose-700 border border-rose-100';
    const accLabel = acc >= 75 ? 'Ottimale 🎯' : acc >= 50 ? 'Moderato ⚠️' : 'Attenzione Clinica 🚨';

    // ── Card 2: Esitazione Media ─────────────────────────────────────────────
    const sec      = parseFloat(clinicalKPIs.avgHesitation);
    const hesColor = sec < 3.0 ? 'text-emerald-600' : sec < 5.5 ? 'text-amber-600' : 'text-rose-600';
    const hesBadge = sec < 3.0
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        : sec < 5.5
            ? 'bg-amber-50 text-amber-700 border border-amber-100'
            : 'bg-rose-50 text-rose-700 border border-rose-100';
    const hesLabel = sec < 3.0 ? 'Carico: Basso 🟢' : sec < 5.5 ? 'Carico: Moderato 🟡' : 'Carico: Alto 🔴';

    // ── Card 3: Indice Impulsività ───────────────────────────────────────────
    const imp      = clinicalKPIs.impulsivityIndex;
    const impColor = imp <= 20 ? 'text-emerald-600' : imp <= 45 ? 'text-amber-600' : 'text-rose-600';
    const impBadge = imp <= 20
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        : imp <= 45
            ? 'bg-amber-50 text-amber-700 border border-amber-100'
            : 'bg-rose-50 text-rose-700 border border-rose-100';
    const impLabel = imp <= 20 ? 'Riflessivo 🧠' : imp <= 45 ? 'Moderato ⚖️' : 'Impulsivo ⚡';

    // ── Card 4: Emozione più Critica ─────────────────────────────────────────
    const hasWorst   = clinicalKPIs.worstEmotion !== 'Nessuna';
    const worstColor = hasWorst ? 'text-rose-600' : 'text-emerald-600';
    const worstBadge = hasWorst
        ? 'bg-rose-50 text-rose-700 border border-rose-100'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    const worstLabel = hasWorst ? 'Deficit di Riconoscimento 🔎' : 'Nessuna Criticità 🎉';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Accuratezza Globale */}
            <KPICard label="Accuratezza Globale" tooltip="Percentuale di risposte corrette al primo colpo su tutti i tentativi di scelta dell'emozione.">
                <div className="my-3">
                    <span className={`text-4xl font-black ${accColor}`}>{acc}%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${accBadge}`}>{accLabel}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{clinicalKPIs.totalAnswers} risposte</span>
                </div>
            </KPICard>

            {/* Esitazione Media */}
            <KPICard label="Esitazione Media" tooltip="Tempo medio trascorso (in secondi) tra la comparsa della scena di gioco e la selezione dell'emozione.">
                <div className="my-3">
                    <span className={`text-4xl font-black ${hesColor}`}>{clinicalKPIs.avgHesitation}s</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${hesBadge}`}>{hesLabel}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Velocità risposte</span>
                </div>
            </KPICard>

            {/* Indice Impulsività */}
            <KPICard label="Indice Impulsività" tooltip="Frazione di risposte fornite frettolosamente (sotto i 2.5 secondi) che sono risultate non corrette.">
                <div className="my-3">
                    <span className={`text-4xl font-black ${impColor}`}>{imp}%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${impBadge}`}>{impLabel}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Risposte rapide errate</span>
                </div>
            </KPICard>

            {/* Emozione più Critica */}
            <KPICard label="Emozione più Critica" tooltip="L'emozione che registra la percentuale di risposte corrette al primo tentativo più bassa.">
                <div className="my-3">
                    <span className={`text-2xl font-black truncate block ${worstColor}`}>{clinicalKPIs.worstEmotion}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${worstBadge}`}>{worstLabel}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Accuratezza minore</span>
                </div>
            </KPICard>
        </div>
    );
};

export default EmoGameKPICards;
