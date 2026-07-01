import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { appContext } from '../../context/appContext';
import Navbar from '../../shared/components/Navbar';
import { Helmet } from 'react-helmet-async';

// Sections — raggruppate per dominio (clinical / behavioral / stress / stories / emoGame)
import ClinicalHeader       from './sections/clinical/ClinicalHeader';
import ClinicalDiary        from './sections/clinical/ClinicalDiary';
import BehavioralOverview   from './sections/behavioral/BehavioralOverview';
import PatternInsights      from './sections/behavioral/PatternInsights';
import ClickAnalysis        from './sections/behavioral/ClickAnalysis';
import StressTimeline       from './sections/stress/StressTimeline';
import StressDistribution   from './sections/stress/StressDistribution';
import StoryAnalysis        from './sections/stories/StoryAnalysis';
import StrangeStoriesAnalysis from './sections/stories/StrangeStoriesAnalysis';
import EmoGameAnalytics     from './sections/emoGame/EmoGameAnalytics';
import TherapistPinModal    from './components/TherapistPinModal';

const TherapistAnalytics = () => {
    const { userData, backendUrl, logoutAction } = useContext(appContext);
    
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [gameSessions, setGameSessions] = useState([]);
    const [baseline, setBaseline] = useState(null);
    const [allStories, setAllStories] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isDiaryOpen, setIsDiaryOpen] = useState(false);
    const [analyticsTab, setAnalyticsTab] = useState('stories');
    const [authorized, setAuthorized] = useState(false);

    // 1. Carica elenco bambini
    const fetchChildren = useCallback(async () => {
        if (!userData?._id) return;
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendUrl}/api/analytics/therapist/${userData._id}/children`);
            if (data.success) {
                setChildren(data.children);
            }
        } catch (error) {
            toast.error("Errore caricamento elenco pazienti");
        } finally {
            setLoading(false);
        }
    }, [userData?._id, backendUrl]);

    // 2. Carica storie (per avere i titoli)
    const fetchStories = useCallback(async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/story/all`);
            if (data.success) {
                const storyMap = {};
                data.stories.forEach(s => {
                    storyMap[s._id] = {
                        title: s.title,
                        slides: s.paragraphs?.length || 0,
                        category: s.category
                    };
                });
                setAllStories(storyMap);
            }
        } catch (error) {
            console.error("Errore fetch storie:", error);
        }
    }, [backendUrl]);

    useEffect(() => {
        if (!authorized) return;
        fetchChildren();
        fetchStories();
    }, [authorized, fetchChildren, fetchStories]);

    // Richiesta password: mostra la modale a schermo intero con sfondo gradient
    // BUG5 FIX: nessun wrapper grigio — il modal gestisce il proprio sfondo
    if (!authorized) {
        return (
            <TherapistPinModal backendUrl={backendUrl} onSuccess={() => setAuthorized(true)} />
        );
    }

    // 3. Carica dettagli bambino selezionato
    const handleSelectChild = async (child) => {
        setSelectedChild(child);
        setLoadingDetails(true);
        try {
            // Sessioni principali
            const sessRes = await axios.get(`${backendUrl}/api/analytics/therapist/${userData._id}/child/${child.childId}/sessions`);
            if (sessRes.data.success) {
                setSessions(sessRes.data.sessions);
                setBaseline(sessRes.data.baseline);
            }

            // Sessioni di gioco (emozioni/sequenze)
            const gameRes = await axios.get(`${backendUrl}/api/analytics/therapist/${userData._id}/child/${child.childId}/game-sessions`);
            if (gameRes.data.success) {
                setGameSessions(gameRes.data.sessions);
            }
        } catch (error) {
            toast.error("Errore caricamento dati clinici");
        } finally {
            setLoadingDetails(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Caricamento pazienti...</div>;

    // --- VISTA SELEZIONE PAZIENTE ---
    if (!selectedChild) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black text-gray-800">📊 Dashboard Clinica</h1>
                        <p className="text-gray-500 mt-2">Seleziona un paziente per analizzarne i progressi e gli indici di stress.</p>
                    </div>

                    {children.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                            <p className="text-gray-400 text-lg">Nessun dato analitico disponibile per i tuoi pazienti.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {children.map(child => (
                                <button
                                    key={child.childId}
                                    onClick={() => handleSelectChild(child)}
                                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {child.initials}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                            child.lastStressLevel === 'calm' ? 'bg-emerald-100 text-emerald-700' :
                                            child.lastStressLevel === 'agitated' ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {child.lastStressLevel}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800">Paziente {child.initials}</h3>
                                    <p className="text-xs text-gray-400 mb-4">ID: {child.childId.slice(-8)}</p>
                                    
                                    <div className="space-y-3 pt-4 border-t border-gray-50">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Stress Medio</span>
                                            <span className="font-bold text-gray-700">{child.avgStressIndex}/100</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Completamento</span>
                                            <span className="font-bold text-gray-700">{child.avgCompletionRate}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Sessioni</span>
                                            <span className="font-bold text-gray-700">{child.totalSessions}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VISTA DETTAGLIO CLINICO ---
    const avgStress = sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + s.stressIndex, 0) / sessions.length)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Helmet>
                <title>Analisi Terapeuta — Storie Amiche</title>
            </Helmet>
            <ClinicalHeader 
                selectedChild={selectedChild}
                sessions={sessions}
                lastSession={sessions[0]}
                avgStress={avgStress}
                onBack={() => setSelectedChild(null)}
                onLogout={logoutAction}
                onOpenDiary={() => setIsDiaryOpen(true)}
                isEmoGame={analyticsTab === 'emogame'}
            />

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {loadingDetails ? (
                    <div className="py-20 text-center text-gray-400 font-bold animate-pulse">
                        Caricamento dati clinici in corso...
                    </div>
                ) : (
                    <>
                        {/* Tab Switcher per separare Analytics */}
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner mb-8 w-fit">
                            <button
                                onClick={() => setAnalyticsTab('stories')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                    analyticsTab === 'stories'
                                        ? 'bg-amber-600 text-white shadow-md scale-[1.02]'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
                                }`}
                            >
                                <span>🤔</span> Strange Stories
                            </button>
                            <button
                                onClick={() => setAnalyticsTab('emogame')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                    analyticsTab === 'emogame'
                                        ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
                                }`}
                            >
                                <span>🎮</span> EmoGame
                            </button>
                        </div>

                        {analyticsTab === 'stories' ? (
                            <>
                                {/* Panoramica Comportamentale */}
                                <BehavioralOverview sessions={sessions} baseline={baseline} />

                                {/* Timeline Stress & Distribuzione */}
                                <div className="grid lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <StressTimeline sessions={sessions} allStories={allStories} />
                                    </div>
                                    <div>
                                        <StressDistribution sessions={sessions} />
                                    </div>
                                </div>

                                {/* Analisi Pattern AI */}
                                <PatternInsights sessions={sessions} baseline={baseline} />

                                {/* Analisi per Storia, Click e Comprensione */}
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <StoryAnalysis sessions={sessions} allStories={allStories} />
                                    <ClickAnalysis sessions={sessions} />
                                </div>

                                <StrangeStoriesAnalysis 
                                    childId={selectedChild.childId}
                                    therapistId={userData._id}
                                    allStories={allStories}
                                />
                            </>
                        ) : (
                            <>
                                {/* Analisi EmoGame */}
                                <EmoGameAnalytics 
                                    childId={selectedChild.childId} 
                                    therapistId={userData._id}
                                    allStories={allStories} 
                                />
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Modale Diario Clinico */}
            {isDiaryOpen && (
                <ClinicalDiary 
                    childId={selectedChild.childId}
                    initials={selectedChild.initials}
                    onClose={() => setIsDiaryOpen(false)}
                />
            )}
        </div>
    );
};

export default TherapistAnalytics;