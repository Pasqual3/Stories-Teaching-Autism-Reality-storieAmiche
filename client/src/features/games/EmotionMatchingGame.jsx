import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appContext } from '../../context/appContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../shared/components/Navbar';
import useGameTracker from '../../shared/hooks/useGameTracker';
import useResponsiveLayout from '../../shared/hooks/useResponsiveLayout';
import { Helmet } from "react-helmet-async";

const EmotionMatchingGame = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, userData, activeChild } = useContext(appContext);
    const { isLandscape, isTablet, touchEnabled } = useResponsiveLayout();

    const { recordMove, endGame, initMove } = useGameTracker({
        childId: activeChild?.childId || userData?.childId || userData?._id,
        gameType: 'emotion_matching',
        storyId,
        enabled: true
    });

    const [story, setStory] = useState(null);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [selectedEmotion, setSelectedEmotion] = useState(null);
    const [score, setScore] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
    const [gameResults, setGameResults] = useState([]);

    const emotions = [
        { name: 'Felice', emoji: '😊', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { name: 'Triste', emoji: '😢', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { name: 'Arrabbiato', emoji: '😠', color: 'bg-red-50 text-red-700 border-red-200' },
        { name: 'Sorpreso', emoji: '😲', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { name: 'Spaventato', emoji: '😨', color: 'bg-slate-50 text-slate-700 border-slate-200' },
        { name: 'Eccitato', emoji: '🤩', color: 'bg-pink-50 text-pink-700 border-pink-200' }
    ];

    useEffect(() => {
        fetchStory();
    }, [storyId]);

    const fetchStory = async () => {
        try {

            const { data } = await axios.get(`${backendUrl}/api/story/${storyId}`);
            if (data.success) {
                setStory(data.story);
            } else {
                toast.error("Storia non trovata");
                navigate(userData?.isChildActive ? '/child-dashboard' : '/profile');
            }
        } catch (error) {
            toast.error("Errore nel caricamento del gioco");
        } finally {
            setLoading(false);
        }
    };

    const gameScenes = story?.paragraphs?.filter(p => p.emotion) || [];
    const currentScene = gameScenes[currentSceneIndex];

    const handleEmotionSelect = (emotion) => {
        if (showFeedback) return;

        setSelectedEmotion(emotion.name);
        const expectedEmotion = currentScene.emotion;
        const correct = emotion.name === expectedEmotion;

        setIsCorrectAnswer(correct);
        setShowFeedback(true);

        const newResult = {
            sceneIndex: currentSceneIndex,
            emotion: expectedEmotion,
            chosen: emotion.name,
            correct: correct
        };
        const updatedResults = [...gameResults, newResult];
        setGameResults(updatedResults);

        if (correct) {
            setScore(score + 1);
        }

        setTimeout(async () => {
            if (currentSceneIndex < gameScenes.length - 1) {
                setCurrentSceneIndex(currentSceneIndex + 1);
                setSelectedEmotion(null);
                setShowFeedback(false);
                recordMove(correct, { sceneIndex: currentSceneIndex });
            } else {
                setIsComplete(true);
                recordMove(correct, { sceneIndex: currentSceneIndex });
                const finalScore = correct ? score + 1 : score;
                endGame(Math.round((finalScore / gameScenes.length) * 100));

                try {
                    await axios.post(`${backendUrl}/api/story/${storyId}/emotion-results`, {
                        results: updatedResults,
                        score: finalScore,
                        total: gameScenes.length,
                        playedAt: new Date()
                    }, { withCredentials: true });
                } catch (err) {
                    console.error("Errore salvataggio risultati:", err);
                }
            }
        }, 1500);
    };

    const resetGame = () => {
        setCurrentSceneIndex(0);
        setScore(0);
        setGameResults([]);
        setIsComplete(false);
        setSelectedEmotion(null);
        setShowFeedback(false);
        initMove();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-indigo-50">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-2xl text-indigo-700 font-bold">Caricamento emozioni...</p>
                </div>
            </div>
        );
    }

    if (gameScenes.length === 0) {
        return (
            <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-6 text-center">
                <Navbar />
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-indigo-100 max-w-md">
                    <p className="text-6xl mb-4">⚙️</p>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Gioco non configurato</h2>
                    <p className="text-gray-500 mb-6">Non sono state ancora impostate le emozioni per questa storia.</p>
                    <button onClick={() => navigate(-1)} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all">Torna indietro</button>
                </div>
            </div>
        );
    }

    const renderEmotionButton = (emotion) => (
        <button
            key={emotion.name}
            onClick={() => handleEmotionSelect(emotion)}
            disabled={showFeedback}
            className={`
                relative p-2 sm:p-3 md:p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1
                ${emotion.color}
                ${showFeedback
                    ? (selectedEmotion === emotion.name
                        ? (isCorrectAnswer ? 'border-green-400 bg-green-50 scale-105 shadow-lg z-10' : 'border-red-300 bg-red-50 opacity-100')
                        : 'opacity-40 grayscale-[0.5]')
                    : 'hover:scale-105 border-transparent shadow-sm hover:shadow-md active:scale-95'
                }
            `}
        >
            {/* Emoji ridimensionata con clamp responsive */}
            <span className="text-3xl sm:text-4xl md:text-5xl leading-none">{emotion.emoji}</span>
            <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight mt-1">{emotion.name}</span>

            {showFeedback && selectedEmotion === emotion.name && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce text-xs sm:text-sm
                    ${isCorrectAnswer ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isCorrectAnswer ? '✓' : '✕'}
                </div>
            )}
        </button>
    );

    return (
        <div className="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden flex flex-col font-lexend">
            <Helmet>
                <title>Storie Amiche — Emotion Matching Game</title>
                <meta name="description" content="Gioco delle emozioni per bambini con autismo." />
            </Helmet>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap');
                .font-lexend { font-family: 'Lexend', sans-serif; }
            `}</style>

            <Navbar />

            {/* HEADER - PROGRESS BAR */}
            <div className="flex-none px-4 py-2 bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl flex-none">🎭</span>
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-base font-black text-gray-800 leading-tight">Gioco delle Emozioni</h1>
                            <p className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-[220px]">"{story?.title}"</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-none">
                        <div className="hidden sm:block w-32 md:w-48 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${((currentSceneIndex) / gameScenes.length) * 100}%` }}
                            />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scena</span>
                            <span className="text-base font-black text-indigo-600">{currentSceneIndex + 1}/{gameScenes.length}</span>
                        </div>
                        <div className="flex flex-col items-end border-l pl-3 border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stelle</span>
                            <span className="text-base font-black text-yellow-500">⭐ {score}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN LAYOUT */}
            {!isComplete ? (
                /*
                 * DESKTOP / LANDSCAPE → riga: [scena | emozioni]
                 * MOBILE PORTRAIT      → colonna: [immagine + testo] poi [emozioni]
                 *
                 * Su mobile l'intero contenuto scorre verticalmente dentro un unico
                 * overflow-y-auto, così nulla si sovrappone.
                 */
                <div className={`flex-1 min-h-0 ${isLandscape ? 'flex flex-row overflow-hidden' : 'overflow-y-auto'}`}>

                    {/* ───── COLONNA SINISTRA: scena ───── */}
                    <div className={`
                        ${isLandscape
                            ? 'flex-[3] flex flex-col overflow-hidden p-4'
                            : 'p-4 pb-0'}
                    `}>
                        <div className={`
                            bg-white/60 backdrop-blur rounded-3xl border-2 border-dashed border-indigo-200 p-4 shadow-inner
                            ${isLandscape ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : ''}
                        `}>
                            <h2 className="flex-none text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[9px]">1</span>
                                Guarda e Leggi
                            </h2>

                            {/* IMMAGINE
                                - Su desktop/landscape: occupa lo spazio flessibile rimanente ma non oltre
                                  un max-height calcolato così da lasciare spazio al testo
                                - Su mobile: altezza fissa ragionevole (max 45vw o 220px)
                            */}
                            <div className={`
                                w-full bg-white rounded-2xl border-2 border-white shadow-sm flex items-center justify-center overflow-hidden
                                ${isLandscape
                                    ? 'flex-1 min-h-0'
                                    : 'h-[min(25vw,160px)]'}
                            `}>
                                {currentScene?.mediaUrl && currentScene.mediaType === 'image' ? (
                                    <img
                                        src={currentScene.mediaUrl}
                                        alt="Scena"
                                        className="max-w-full max-h-full object-contain animate-fade-in"
                                    />
                                ) : (
                                    <div className="text-6xl sm:text-8xl animate-bounce">📖</div>
                                )}
                            </div>

                            {/* TESTO — sempre visibile sotto l'immagine */}
                            {currentScene?.text && (
                                <div className="flex-none mt-3 bg-white/80 rounded-2xl px-4 py-3 text-center border border-indigo-50/50">
                                    <p className="text-sm sm:text-base md:text-lg font-bold text-gray-700 leading-relaxed italic">
                                        "{currentScene.text}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ───── COLONNA DESTRA: emozioni ───── */}
                    <div className={`
                        ${isLandscape
                            ? 'flex-[2] border-l border-white/50 overflow-y-auto p-4'
                            : 'p-4 pt-3'}
                        bg-white/30
                    `}>
                        <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-[9px]">2</span>
                            Come si sente?
                        </h2>

                        {/* Griglia emozioni:
                            - Sempre 2 colonne su mobile portrait (emoji piccole)
                            - 3 colonne su sm+ portrait
                            - 2 colonne in landscape (colonna destra più stretta)
                        */}
                        <div className={`grid gap-2 sm:gap-3 md:gap-4 ${isLandscape ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {emotions.map(emotion => renderEmotionButton(emotion))}
                        </div>
                    </div>
                </div>
            ) : (
                /* COMPLETION SCREEN */
                <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="max-w-2xl w-full bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl border border-indigo-50 text-center animate-scale-up relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-100/50 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -z-10" />

                        <div className="text-7xl mb-6 animate-bounce">🏆</div>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-3">Super!</h2>
                        <p className="text-base md:text-xl text-gray-500 mb-8 font-medium">Hai capito tutte le emozioni dei protagonisti!</p>

                        <div className="bg-indigo-50/50 rounded-[2rem] p-6 mb-8 border border-indigo-100 inline-block px-10">
                            <p className="text-xs text-indigo-400 font-black uppercase tracking-widest mb-2">Punteggio Finale</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-5xl font-black text-indigo-600">{score}</span>
                                <span className="text-2xl font-bold text-indigo-300">/ {gameScenes.length}</span>
                                <span className="text-3xl ml-2">⭐</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={resetGame}
                                className="px-8 py-4 bg-white text-gray-600 rounded-full font-black text-base border-2 border-gray-100 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                            >
                                🔄 RIGIOCA
                            </button>
                            <button
                                onClick={() => navigate(userData?.isChildActive ? '/child-dashboard' : '/profile')}
                                className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-black text-base hover:shadow-xl transition-all shadow-lg active:scale-95"
                            >
                                PROSEGUI ➔
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scale-up {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
                .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}</style>
        </div>
    );
};

export default EmotionMatchingGame;