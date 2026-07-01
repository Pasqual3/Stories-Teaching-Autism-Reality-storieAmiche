import React from 'react';
import MetricCard from '../ui/MetricCard';

const BehavioralOverview = ({ sessions, baseline }) => {
    if (!sessions || sessions.length === 0) return null;

    const lastSession = sessions[0];
    const prevSession = sessions.length > 1 ? sessions[1] : null;

    // Calcoli
    const avgCompletion = Math.round(sessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / sessions.length);
    const avgTimePerSlide = Math.round(sessions.reduce((sum, s) => {
        const time = (s.totalDuration || 0) / Math.max(s.totalSlides || 1, 1);
        return sum + time;
    }, 0) / sessions.length);

    const totalClicks = sessions.reduce((sum, s) => sum + (s.totalClicks || 0), 0);
    const totalRandom = sessions.reduce((sum, s) => sum + (s.totalRandomClicks || 0), 0);
    const totalMiss = sessions.reduce((sum, s) => sum + (s.totalMissClicks || 0), 0);
    const pertinenceRate = totalClicks > 0 ? ((totalClicks - totalRandom - totalMiss) / totalClicks * 100).toFixed(0) : 100;

    const avgHesitation = Math.round(sessions.reduce((sum, s) => sum + (s.avgHesitationTime || 0), 0) / sessions.length / 1000);

    const totalRage = sessions.reduce((sum, s) => sum + (s.totalRageClicks || 0), 0);
    const totalReversals = sessions.reduce((sum, s) => sum + (s.totalPageReversals || 0), 0);

    // Trend helper
    const getTrend = (current, previous) => {
        if (!previous) return null;
        const diff = current - previous;
        if (Math.abs(diff) < 5) return { trend: 'stable', value: 'stabile' };
        return {
            trend: diff > 0 ? 'up' : 'down',
            value: `${Math.abs(diff)}%`
        };
    };

    const completionTrend = getTrend(lastSession?.completionRate, prevSession?.completionRate);
    const stressTrend = getTrend(lastSession?.stressIndex, prevSession?.stressIndex);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* BLOCCO INTERAZIONE */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Interazione
                </h3>
                <MetricCard
                    title="Completamento Medio"
                    value={`${avgCompletion}%`}
                    subtitle="Storie lette fino in fondo"
                    icon="✅"
                    color="emerald"
                    {...completionTrend}
                />
                <MetricCard
                    title="Tempo Medio / Scena"
                    value={`${avgTimePerSlide}s`}
                    subtitle={baseline ? `Baseline: ${Math.round(baseline.avgTimePerSlide || 0)}s` : 'Nessuna baseline'}
                    icon="⏱️"
                    color="blue"
                />
                <MetricCard
                    title="Click Pertinenti"
                    value={`${pertinenceRate}%`}
                    subtitle={`${totalRandom} random + ${totalMiss} miss su ${totalClicks} totali`}
                    icon="🎯"
                    color="indigo"
                    alert={pertinenceRate < 60}
                />
            </div>

            {/* BLOCCO STRESS E FRUSTRAZIONE */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Stress & Frustrazione
                </h3>
                <MetricCard
                    title="Stress Index"
                    value={`${lastSession?.stressIndex || 0}/100`}
                    subtitle="Ultima sessione"
                    icon="🧠"
                    color={lastSession?.stressIndex > 50 ? 'red' : 'indigo'}
                    {...stressTrend}
                />
                <MetricCard
                    title="Rage Click Totali"
                    value={totalRage}
                    subtitle="Click di frustrazione"
                    icon="😤"
                    color={totalRage > 5 ? 'red' : 'amber'}
                    alert={totalRage > 5}
                />
                <MetricCard
                    title="Page Reversals"
                    value={totalReversals}
                    subtitle="Tornato indietro per rassicurazione"
                    icon="↩️"
                    color={totalReversals > 3 ? 'amber' : 'indigo'}
                />
            </div>

            {/* BLOCCO ATTENZIONE */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Attenzione & Coinvolgimento
                </h3>
                <MetricCard
                    title="Hesitation Time"
                    value={`${avgHesitation}s`}
                    subtitle="Primo click dopo cambio slide"
                    icon="⏳"
                    color={avgHesitation > 5 ? 'amber' : 'indigo'}
                />
                <MetricCard
                    title="Context Switches"
                    value={sessions.reduce((sum, s) => sum + (s.pageVisibilitySwitches || 0), 0)}
                    subtitle="Uscite dalla finestra"
                    icon="👀"
                    color="indigo"
                />
                <MetricCard
                    title="Sessioni Totali"
                    value={sessions.length}
                    subtitle={`Ultima: ${lastSession ? new Date(lastSession.createdAt).toLocaleDateString('it-IT') : 'N/A'}`}
                    icon="📊"
                    color="blue"
                />
            </div>
        </div>
    );
};

export default BehavioralOverview;
