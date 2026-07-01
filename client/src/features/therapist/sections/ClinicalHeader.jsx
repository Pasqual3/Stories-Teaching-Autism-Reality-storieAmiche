import React from 'react';
import StressBadge from '../ui/StressBadge';

const ClinicalHeader = ({
    selectedChild,
    sessions,
    lastSession,
    avgStress,
    onBack,
    onLogout,
    onOpenDiary,
    isEmoGame
}) => {
    const lastActivity = lastSession ? new Date(lastSession.createdAt) : null;
    const now = new Date();
    const hoursSinceLast = lastActivity ? Math.round((now - lastActivity) / (1000 * 60 * 60)) : null;

    let activityStatus = 'Inattivo';
    let activityColor = 'text-gray-400';
    if (hoursSinceLast !== null) {
        if (hoursSinceLast < 1) { activityStatus = 'Attivo ora'; activityColor = 'text-emerald-600'; }
        else if (hoursSinceLast < 24) { activityStatus = `Ultima attività: ${hoursSinceLast}h fa`; activityColor = 'text-blue-600'; }
        else { activityStatus = `Inattivo da ${Math.round(hoursSinceLast / 24)} giorni`; activityColor = 'text-amber-600'; }
    }

    const activeAlerts = [];
    if (lastSession?.totalRageClicks > 0) activeAlerts.push({ label: 'Rage Click', count: lastSession.totalRageClicks, color: 'bg-red-100 text-red-700' });
    if (lastSession?.totalPageReversals > 0) activeAlerts.push({ label: 'Reversals', count: lastSession.totalPageReversals, color: 'bg-amber-100 text-amber-700' });
    if (lastSession?.stressIndex > 50) activeAlerts.push({ label: 'Stress Alto', count: lastSession.stressIndex, color: 'bg-orange-100 text-orange-700' });

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Profilo */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            ←
                        </button>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                            {selectedChild?.childId?.slice(-2).toUpperCase() || '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-black text-gray-800 whitespace-normal break-words">
                                Paziente #{selectedChild?.childId?.slice(-4).toUpperCase()} - {selectedChild?.initials}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500 flex-wrap gap-x-2">
                                <span className={`text-xs font-medium ${activityColor}`}>● {activityStatus}</span>
                                <span className="text-gray-300">|</span>
                                <span>{sessions.length} sessioni totali</span>
                            </div>
                        </div>
                    </div>

                    {/* Stress Index Live */}
                    {!isEmoGame && (
                        <div className="flex items-center gap-6 bg-gray-50 rounded-2xl px-6 py-3">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stress Index Medio</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-gray-800">{avgStress}</span>
                                    <span className="text-sm text-gray-400">/100</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-gray-200" />
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stato Attuale</p>
                                <StressBadge level={lastSession?.stressLevel || 'calm'} showRange size="md" />
                            </div>
                            {activeAlerts.length > 0 && (
                                <>
                                    <div className="h-10 w-px bg-gray-200" />
                                    <div className="flex gap-2">
                                        {activeAlerts.map((alert, i) => (
                                            <span key={i} className={`px-2 py-1 rounded-lg text-xs font-bold ${alert.color}`}>
                                                {alert.label}: {alert.count}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Azioni */}
                    <div className="flex gap-2">
                        <button
                            onClick={onOpenDiary}
                            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
                        >
                            📝 Diario
                        </button>
                        <button
                            onClick={onBack}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                        >
                            Cambia
                        </button>
                        <button
                            onClick={onBack}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                        >
                            Esci
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicalHeader;
