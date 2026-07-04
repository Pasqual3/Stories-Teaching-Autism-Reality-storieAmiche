import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { appContext } from '../../../context/appContext';
import ProgressBar from '../../../shared/components/ProgressBar';
import useSessionTracker from '../../../shared/hooks/useSessionTracker';
import Navbar from '../../../shared/components/Navbar';
import { Helmet } from 'react-helmet-async';

const optimizeCloudinaryUrl = (url, width = 800) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
        return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
    return url;
};

const getEmotionEmoji = (text) => {
    if (!text) return '💭';
    const cleanText = text.trim().toLowerCase();
    if (cleanText.includes('felice') || cleanText === 'felicità') return '😊';
    if (cleanText.includes('triste') || cleanText === 'tristezza') return '😢';
    if (cleanText.includes('arrabbiat') || cleanText === 'rabbia') return '😠';
    if (cleanText.includes('sorpres') || cleanText === 'sorpresa') return '😲';
    if (cleanText.includes('spaventat') || cleanText === 'paura') return '😨';
    if (cleanText.includes('eccitat') || cleanText === 'eccitazione') return '🤩';
    if (cleanText.includes('disgustat') || cleanText === 'disgusto') return '🤢';
    if (cleanText.includes('neutr')) return '😐';
    return '💭';
};

const ViewEmoGame = () => {
    const { backendUrl, userData, activeChild, setSessionExitHandler } = useContext(appContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);
    const [isScenePlaying, setIsScenePlaying] = useState(false);
    const [currentScene, setCurrentScene] = useState(0);

    const [risposteLibere, setRisposteLibere] = useState({});
    const [risposteMultiple, setRisposteMultiple] = useState({});
    const [showError, setShowError] = useState(false);
    const [testFeedback, setTestFeedback] = useState(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [showRecapScreen, setShowRecapScreen] = useState(false);
    const [analiticsUrl] = useState(`${backendUrl}/api/analytics`);

    const lastSavedRef = useRef({});
    const scoreTracker = useRef({});  // {sceneIndex: score} — punteggio per scena
    const sessionStartTimeRef = useRef(Date.now());
    const sceneStartTimeRef = useRef(Date.now());
    const cumulativeReactionTimeRef = useRef(0);
    const firstChoiceLatencyRef = useRef({});
    const [strangeSessionId] = useState(`ss-${sessionStartTimeRef.current}-${Math.floor(Math.random() * 1000)}`);
    const textareaRef = useRef(null);

    // Gestione tentativi multipli ed esito sessione
    const firstChoiceCorrectRef = useRef({});
    const isCompletedRef = useRef(false);
    const [allAttempts, setAllAttempts] = useState({});

    const rispostaLibera = risposteLibere[currentScene] ?? '';
    const rispostaMultipla = risposteMultiple[currentScene] ?? null;
    const setRispostaLibera = (val) => setRisposteLibere(prev => ({ ...prev, [currentScene]: val }));
    const setRispostaMultipla = (val) => setRisposteMultiple(prev => ({ ...prev, [currentScene]: val }));

    const getChildInfo = () => {
        if (activeChild?.childId) return activeChild;
        const stored = localStorage.getItem('activeChild');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { console.error(e); }
        }
        if (userData?.isChildActive && userData?.activeChildId) {
            return { childId: userData.activeChildId, parentId: userData._id, childName: userData.name };
        }
        return null;
    };

    const childInfo = getChildInfo();
    const childId = childInfo?.childId || null;
    const parentId = childInfo?.parentId || userData?._id || null;

    const { onSlideChange, endSession } = useSessionTracker({
        childId,
        storyId: id,
        parentId,
        totalSlides: story?.paragraphs?.length || 0,
        enabled: !!childId && userData?.isChildActive === true,
        sessionType: 'emoGame'
    });

    useEffect(() => {
        if (endSession && (activeChild?.childId || userData?.isChildActive)) {
            setSessionExitHandler(() => () => { endSession(currentScene, false); });
        }
        return () => setSessionExitHandler(null);
    }, [endSession, currentScene, userData?.isChildActive, setSessionExitHandler]);

    // Traccia l'abbandono immediato se il bambino chiude senza fare tentativi
    useEffect(() => {
        return () => {
            if (userData?.isChildActive && childId && !isCompletedRef.current) {
                const hasSavedAnswers = Object.keys(lastSavedRef.current).length > 0;
                if (!hasSavedAnswers) {
                    saveAnswer(0, '[Abbandonato]', null, true);
                }
            }
        };
    }, [childId, userData?.isChildActive]);

    useEffect(() => {
        const preloadImages = (paragraphs) => {
            if (!paragraphs) return;
            paragraphs.forEach(p => {
                if (p.mediaUrl && p.mediaType !== 'video' && p.mediaType !== 'audio' && p.mediaType !== 'none') {
                    const img = new Image();
                    img.src = optimizeCloudinaryUrl(p.mediaUrl, 800);
                }
                if (p.strangeStoryTest?.options) {
                    p.strangeStoryTest.options.forEach(opt => {
                        if (opt.imageUrl) {
                            const img = new Image();
                            img.src = optimizeCloudinaryUrl(opt.imageUrl, 200);
                        }
                    });
                }
            });
        };

        const fetchStory = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/emoGame/${id}`);
                if (data.success) {
                    setStory(data.story);
                    preloadImages(data.story.paragraphs);
                } else {
                    toast.error(data.message);
                    navigate('/profile');
                }
            } catch (error) {
                toast.error("Errore nel caricamento dell'EmoGame");
                navigate('/profile');
            } finally {
                setLoading(false);
            }
        };
        fetchStory();
    }, [backendUrl, id, navigate]);

    const pageBgColor = story?.backgroundColor || '#f0f4ff';
    const currentParagraph = story?.paragraphs[currentScene];
    const words = currentParagraph?.text.split(/\s+/).filter(Boolean) || [];
    const hasTest = currentParagraph?.strangeStoryTest?.active === true;

    const [audioDuration, setAudioDuration] = useState(0);

    const getCharsNoSpaces = (txt) => {
        const w = (txt || '').split(/\s+/).filter(Boolean);
        return w.reduce((acc, word) => acc + word.length, 0);
    };

    const currentSceneChars = getCharsNoSpaces(currentParagraph?.text);
    const estimatedCharsSpoken = audioDuration > 0 ? (currentTime / audioDuration) * currentSceneChars : 0;

    let accumulatedChars = 0;
    let currentWordIndexInScene = 0;
    for (let i = 0; i < words.length; i++) {
        accumulatedChars += words[i].length;
        if (estimatedCharsSpoken <= accumulatedChars) { currentWordIndexInScene = i; break; }
        currentWordIndexInScene = i;
    }

    const stopAllAudio = () => {
        const narrationAudio = document.getElementById('scene-narration-audio');
        const sceneAudio = document.getElementById('scene-audio');
        if (narrationAudio) { narrationAudio.pause(); narrationAudio.currentTime = 0; setIsGlobalPlaying(false); }
        if (sceneAudio) { sceneAudio.pause(); sceneAudio.currentTime = 0; setIsScenePlaying(false); }
    };

    const saveAnswer = async (sceneIndex, risposta, opzioneSelezionata = null, isFinalPlaceholder = false) => {
        const scena = story?.paragraphs?.[sceneIndex];
        const test = scena?.strangeStoryTest;

        if (!childId) return;
        if (!isFinalPlaceholder && (!test?.active || !risposta || risposta.trim() === '')) return;

        if (lastSavedRef.current[sceneIndex] === risposta) return;

        // Impostiamo subito per evitare invii multipli concorrenti
        lastSavedRef.current[sceneIndex] = risposta;

        // Traccia il punteggio dell'opzione scelta (solo al primo tentativo)
        const optScore = opzioneSelezionata?.score ?? null;
        if (optScore != null && scoreTracker.current[sceneIndex] === undefined) {
            scoreTracker.current[sceneIndex] = optScore;
        }

        // Calcola la latenza del primo tentativo e il timestamp virtuale
        if (firstChoiceLatencyRef.current[sceneIndex] === undefined) {
            firstChoiceLatencyRef.current[sceneIndex] = Date.now() - sceneStartTimeRef.current;
        }
        const latency = firstChoiceLatencyRef.current[sceneIndex];
        const virtualPlayedAt = new Date(sessionStartTimeRef.current + cumulativeReactionTimeRef.current + latency).toISOString();

        // Determina la correttezza basandoci sul primo tentativo
        let isCorretta = null;
        if (isFinalPlaceholder) {
            isCorretta = risposta === '[Completato]';
        } else if (test && test.type !== 'libera') {
            if (firstChoiceCorrectRef.current[sceneIndex] !== undefined) {
                isCorretta = firstChoiceCorrectRef.current[sceneIndex];
            } else {
                isCorretta = opzioneSelezionata ? Boolean(opzioneSelezionata.isCorrect) : false;
                firstChoiceCorrectRef.current[sceneIndex] = isCorretta;
            }
        }

        // Ricava il nome dell'emozione target direttamente dalla configurazione della scena.
        // Viene inviato al backend e salvato nel DB così da non dover ricostruire
        // euriscamente quale emozione rappresentava quella scena (fix "Perché piace dormire a Marco").
        const sceneTargetEmotion = (() => {
            if (isFinalPlaceholder) return '';
            // Priorità 1: campo emotion esplicito sulla scena
            if (scena?.emotion) return scena.emotion;
            // Priorità 2: testo dell'opzione marcata isCorrect === true
            const correctOpt = scena?.strangeStoryTest?.options?.find(o => o.isCorrect === true);
            if (correctOpt?.text) return correctOpt.text;
            return '';
        })();

        try {
            await axios.post(`${analiticsUrl}/strange-story`, {
                childId, storyId: id, parentId,
                sessionId: strangeSessionId,
                sceneIndex,
                domanda: isFinalPlaceholder ? 'Stato sessione' : (test.question || ''),
                tipo: isFinalPlaceholder ? 'libera' : (test.type || 'blocchi_immagine'),
                risposta,
                rispostaCorretta: isFinalPlaceholder ? '' : (test.correctAnswer || ''),
                rispostaImageUrl: opzioneSelezionata?.imageUrl || '',
                isCorrettaPerOpzione: isCorretta,
                score: scoreTracker.current[sceneIndex] ?? optScore,
                gameType: 'emoGame',
                targetEmotion: sceneTargetEmotion,
                playedAt: virtualPlayedAt
            });
        } catch (e) {
            console.warn('Risposta non salvata:', e.message);
        }
    };

    // Salva la sessione di gioco a fine partita o parziale su errore
    const saveGameSession = async (isCompleted = false) => {
        if (!childId || !story) return;
        try {
            const totalScore = Object.values(scoreTracker.current).reduce((sum, s) => sum + (s ?? 0), 0);
            const totalQuestions = story.paragraphs.length;

            const results = story.paragraphs.map((p, i) => ({
                sceneIndex: i,
                question: p.strangeStoryTest?.question || p.text,
                score: scoreTracker.current[i] ?? 0
            }));

            await axios.post(`${backendUrl}/api/emoGame/${id}/session`, {
                childUserId: childId,
                score: totalScore,
                total: totalQuestions,
                results,
                completed: isCompleted
            });
        } catch (e) {
            console.warn('Sessione non salvata:', e.message);
        }
    };

    const handleNext = () => {
        stopAllAudio();

        // Accumuliamo il tempo speso sulla scena corrente
        const lat = firstChoiceLatencyRef.current[currentScene] || (Date.now() - sceneStartTimeRef.current);
        cumulativeReactionTimeRef.current += lat;

        // Scene a bivio (Narrazione Adattiva): la scelta del bambino determina
        // quale scena arriva dopo, invece del semplice currentScene + 1.
        const currentParagraph = story.paragraphs[currentScene];
        const selectedOption = risposteMultiple[currentScene];
        let nextScene = currentScene + 1;

        if (currentParagraph?.isBranching && selectedOption && typeof selectedOption.nextSceneIndex === 'number') {
            const target = selectedOption.nextSceneIndex;
            if (target >= 0 && target < story.paragraphs.length) {
                nextScene = target;
            }
        }

        if (nextScene < story.paragraphs.length) {
            onSlideChange(nextScene, 'next');
            setCurrentScene(nextScene);
            sceneStartTimeRef.current = Date.now();
            setShowError(false);
            setTestFeedback(null);
            setIsFeedbackOpen(false);
            setRisposteMultiple(prev => ({ ...prev, [nextScene]: null }));
        }
    };

    const handlePrev = () => {
        stopAllAudio();

        // Accumuliamo il tempo speso sulla scena corrente
        const lat = firstChoiceLatencyRef.current[currentScene] || (Date.now() - sceneStartTimeRef.current);
        cumulativeReactionTimeRef.current += lat;

        if (currentScene > 0) {
            const prevScene = currentScene - 1;
            onSlideChange(prevScene, 'prev');
            setCurrentScene(prevScene);
            sceneStartTimeRef.current = Date.now();
            setShowError(false);
            setTestFeedback(null);
            setIsFeedbackOpen(false);
        }
    };

    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
            } else if (type === 'wrong') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
            textareaRef.current.style.height = newHeight + 'px';
        }
    }, [rispostaLibera, currentScene]);

    const handleSelectOption = (opzione) => {
        setRispostaMultipla(opzione);
        setShowError(false);

        // Aggiungiamo questa scelta all'elenco dei tentativi della scena per la confusion matrix
        const currentAttempts = allAttempts[currentScene] || [];
        if (!currentAttempts.includes(opzione.text)) {
            currentAttempts.push(opzione.text);
            setAllAttempts(prev => ({ ...prev, [currentScene]: currentAttempts }));
        }

        const combinedAnswer = currentAttempts.join(', ');
        saveAnswer(currentScene, combinedAnswer, opzione);

        let feedbackType = null;
        if (opzione.isCorrect === true) {
            feedbackType = 'correct';
        } else if (opzione.isCorrect === false) {
            feedbackType = 'wrong';
        } else {
            const correctAnswer = currentParagraph?.strangeStoryTest?.correctAnswer;
            if (correctAnswer) {
                feedbackType = opzione.text === correctAnswer ? 'correct' : 'wrong';
            }
        }

        // Se la risposta è sbagliata, salva subito una sessione parziale
        if (feedbackType === 'wrong') {
            saveGameSession(false);
        }

        setTestFeedback({ type: feedbackType, option: opzione });
        setIsFeedbackOpen(true);
        if (feedbackType) {
            playSound(feedbackType);
            if (feedbackType === 'wrong' && navigator.vibrate) navigator.vibrate(100);
        }
    };

    const handleTextChange = (e) => {
        const value = e.target.value;
        setRispostaLibera(value);
        setShowError(false);

        clearTimeout(window.textSaveTimeout);
        window.textSaveTimeout = setTimeout(() => {
            saveAnswer(currentScene, value);
        }, 1500);
    };

    const toggleGlobalPlay = () => {
        const narrationAudio = document.getElementById('scene-narration-audio');
        if (narrationAudio) {
            if (isGlobalPlaying) {
                narrationAudio.pause();
                setIsGlobalPlaying(false);
            } else {
                narrationAudio.play();
                setIsGlobalPlaying(true);
            }
        }
    };

    const handleTimeUpdate = (e) => {
        setCurrentTime(e.target.currentTime);
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <ProgressBar progress={70} label="Caricamento..." animate />
        </div>
    );
    if (!story) return null;

    const isVideo = currentParagraph?.mediaType === 'video';
    const isAudio = currentParagraph?.mediaType === 'audio';
    const hasMedia = currentParagraph?.mediaUrl && currentParagraph?.mediaType !== 'none';
    const isFirstStep = currentScene === 0;
    const isLastStep = currentScene === story.paragraphs.length - 1;

    let testOptions = [];
    let gridCols = 'grid-cols-1 sm:grid-cols-2';
    if (hasTest && currentParagraph.strangeStoryTest.type === 'blocchi_immagine') {
        testOptions = currentParagraph.strangeStoryTest.options.filter(o => o.text || o.imageUrl).slice(0, 6);
    }

    const feedbackOpzione = testFeedback?.option ?? null;
    const feedbackType = testFeedback?.type ?? null;

    const getFeedbackExplanation = () => {
        if (!feedbackOpzione) return null;
        if (feedbackOpzione.explanation && feedbackOpzione.explanation.trim()) {
            return feedbackOpzione.explanation;
        }
        if (feedbackType === 'correct' && currentParagraph?.strangeStoryTest?.explanation) {
            return currentParagraph.strangeStoryTest.explanation;
        }
        return null;
    };

    const feedbackExplanation = getFeedbackExplanation();

    return (
        <div
            style={{ backgroundColor: pageBgColor, fontFamily: "'Nunito', sans-serif" }}
            className="h-screen w-screen flex flex-col overflow-hidden text-gray-800"
        >
            <Helmet>
                <title>{story?.title ? `${story.title} — EmoGame` : 'Visualizza EmoGame — Storie Amiche'}</title>
            </Helmet>
            <div className="shrink-0">
                <Navbar />
            </div>

            <main className="flex-1 min-h-0 flex flex-col p-2 md:p-4 gap-3 overflow-y-auto">
                {showRecapScreen ? (
                    <div className="flex-1 max-w-3xl mx-auto w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-gray-200 flex flex-col overflow-hidden max-h-full">
                        <div className="text-center mb-6 flex-shrink-0">
                            <span className="text-6xl md:text-7xl block mb-2 animate-bounce">🏆</span>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800">Bravissimo! Gioco Completato!</h2>
                            <p className="text-gray-500 text-sm md:text-base mt-1 font-bold">Ecco un riepilogo di come hai risposto alle domande della storia.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-6">
                            {story.paragraphs.map((scena, idx) => {
                                const test = scena.strangeStoryTest;
                                if (!test?.active) return null;

                                const isLibera = test.type === 'libera';
                                const rispostaData = isLibera ? risposteLibere[idx] : risposteMultiple[idx]?.text;

                                // Verifica correttezza
                                let isCorretta = false;
                                if (isLibera) {
                                    isCorretta = true;
                                } else {
                                    const opzioneSelezionata = risposteMultiple[idx];
                                    if (opzioneSelezionata?.isCorrect === true) {
                                        isCorretta = true;
                                    } else if (opzioneSelezionata?.isCorrect === false) {
                                        isCorretta = false;
                                    } else {
                                        isCorretta = opzioneSelezionata?.text === test.correctAnswer;
                                    }
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between ${isLibera
                                                ? 'bg-purple-50/50 border-purple-100'
                                                : isCorretta
                                                    ? 'bg-green-50/60 border-green-200'
                                                    : 'bg-red-50/60 border-red-200'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isLibera
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : isCorretta
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    Domanda {idx + 1}
                                                </span>
                                                <span className="text-xs font-black text-gray-400 truncate uppercase tracking-wider">
                                                    {isLibera ? 'Risposta Libera' : 'Scelta Multipla'}
                                                </span>
                                            </div>
                                            <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-1 leading-snug">
                                                {test.question}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-500 font-bold leading-relaxed italic">
                                                Risposta data: <span className={isLibera ? 'text-purple-700 font-black' : isCorretta ? 'text-green-700 font-black' : 'text-red-600 font-black'}>"{rispostaData || 'Non risposto'}"</span>
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            {!isLibera && (
                                                <span className={`text-2xl font-black w-8 h-8 rounded-full flex items-center justify-center text-white ${isCorretta ? 'bg-green-500' : 'bg-red-500'
                                                    }`}>
                                                    {isCorretta ? '✓' : '✕'}
                                                </span>
                                            )}
                                            {isLibera && (
                                                <span className="text-2xl font-black w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                                    📝
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="text-center flex-shrink-0">
                            <button
                                onClick={() => navigate(childId ? '/child-dashboard' : '/profile')}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full font-black text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 border-none cursor-pointer"
                            >
                                Prosegui alla Bacheca ➔
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 bg-white rounded-3xl border-2 border-gray-200 shadow-xl overflow-hidden flex flex-col md:flex-row">

                        {/* COLONNA SINISTRA: Scenario / Media */}
                        <div className="md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50 p-4 md:p-6 justify-center items-center min-h-[220px] md:min-h-0">
                            {hasMedia ? (
                                <div className="w-full max-w-lg h-full max-h-[320px] md:max-h-[460px] rounded-3xl overflow-hidden border-4 border-white shadow-lg flex items-center justify-center bg-white relative">
                                    {isVideo ? (
                                        <video
                                            src={currentParagraph.mediaUrl}
                                            controls
                                            className="w-full h-full object-contain"
                                        />
                                    ) : isAudio ? (
                                        <div className="w-full p-6 flex flex-col items-center bg-gradient-to-br from-indigo-50 to-white">
                                            <div className="text-5xl mb-2">🎵</div>
                                            <audio
                                                src={currentParagraph.mediaUrl}
                                                controls
                                                className="w-full"
                                            />
                                        </div>
                                    ) : (
                                        <img
                                            src={optimizeCloudinaryUrl(currentParagraph.mediaUrl, 800)}
                                            alt="Quesito"
                                            className="w-full h-full object-contain"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-lg font-bold flex flex-col items-center gap-2">
                                    <span className="text-5xl">🤔</span>
                                    Nessun media configurato
                                </div>
                            )}
                        </div>

                        {/* COLONNA DESTRA: Domanda e Opzioni */}
                        <div className="md:w-1/2 flex flex-col p-4 md:p-6 justify-between overflow-y-auto gap-4">

                            {/* Sezione Domanda */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    {currentParagraph?.narrationUrl && (
                                        <>
                                            <audio
                                                id="scene-narration-audio"
                                                src={currentParagraph.narrationUrl}
                                                onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                                                onTimeUpdate={handleTimeUpdate}
                                                onPlay={() => setIsGlobalPlaying(true)}
                                                onPause={() => setIsGlobalPlaying(false)}
                                                onEnded={() => { setIsGlobalPlaying(false); setCurrentTime(0); }}
                                            />
                                            <button
                                                onClick={toggleGlobalPlay}
                                                className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xl shadow hover:scale-105 active:scale-95 transition-transform shrink-0 border-none cursor-pointer"
                                                aria-label={isGlobalPlaying ? 'Pausa' : 'Ascolta'}
                                            >
                                                {isGlobalPlaying ? '❚❚' : '▶'}
                                            </button>
                                        </>
                                    )}
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                                        Quesito {currentScene + 1} di {story.paragraphs.length}
                                    </span>
                                </div>

                                {/* Testo Domanda */}
                                <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200">
                                    <p className="text-lg md:text-xl font-extrabold text-amber-950 leading-snug break-words">
                                        {words.map((word, i) => {
                                            const isHighlighted = isGlobalPlaying && i === currentWordIndexInScene;
                                            return (
                                                <span
                                                    key={i}
                                                    className={`inline-block mr-1.5 mb-0.5 ${isHighlighted ? 'bg-yellow-200 text-yellow-900 rounded px-1 transition-colors duration-300' : ''}`}
                                                >
                                                    {word}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Sezione Risposte */}
                            <div className="flex-1 flex flex-col justify-center min-h-0">
                                {showError && (
                                    <div className="bg-red-100 border-2 border-red-400 rounded-xl p-3 flex items-center gap-2 text-red-700 font-bold text-base mb-3 shrink-0">
                                        <span className="text-xl shrink-0">☝️</span>
                                        <span>Tocca una risposta per sceglierla!</span>
                                    </div>
                                )}

                                {currentParagraph.strangeStoryTest.type === 'libera' ? (
                                    <textarea
                                        ref={textareaRef}
                                        value={rispostaLibera}
                                        onChange={handleTextChange}
                                        placeholder="Scrivi qui la tua risposta..."
                                        className="w-full p-4 border-2 border-gray-300 rounded-xl text-base font-bold text-amber-950 placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none resize-none min-h-[120px] overflow-y-auto break-words"
                                    />
                                ) : (
                                    <div className={`grid ${gridCols} gap-3 md:gap-4 overflow-y-auto content-start py-2`}>
                                        {testOptions.map((opzione, i) => {
                                            const isSelected = rispostaMultipla?.text === opzione.text;
                                            const isSelectedCorrect = isSelected && testFeedback?.type === 'correct';
                                            const isSelectedWrong = isSelected && testFeedback?.type === 'wrong';

                                            let borderColor = 'border-gray-200 hover:border-purple-300';
                                            let bgColor = 'bg-white';

                                            if (isSelectedCorrect) {
                                                borderColor = 'border-green-500';
                                                bgColor = 'bg-green-50';
                                            } else if (isSelectedWrong) {
                                                borderColor = 'border-red-400';
                                                bgColor = 'bg-red-50';
                                            } else if (isSelected) {
                                                borderColor = 'border-purple-400';
                                                bgColor = 'bg-purple-50';
                                            }

                                            const hasImage = !!opzione.imageUrl;
                                            const emojiToShow = opzione.emoji || getEmotionEmoji(opzione.text);
                                            const showIconBox = !story?.difficulty || story?.difficulty === 'DifI';

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSelectOption(opzione)}
                                                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${borderColor} ${bgColor} hover:scale-[1.01] active:scale-[0.99] transition-all text-left cursor-pointer shadow-sm min-h-[76px] overflow-hidden`}
                                                >
                                                    {showIconBox && (
                                                        <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                                                            {hasImage ? (
                                                                <img
                                                                    src={optimizeCloudinaryUrl(opzione.imageUrl, 200)}
                                                                    alt=""
                                                                    className="w-full h-full object-cover object-top"
                                                                />
                                                            ) : (
                                                                <span className="text-xl">{emojiToShow}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <span className="text-sm md:text-base font-bold text-gray-800 leading-tight break-words w-full">
                                                        {opzione.text}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* Barra di Navigazione Inferiore */}
                {!showRecapScreen && (
                    <div className="shrink-0 flex items-center justify-between px-1 md:px-2 h-16">
                        <button
                            onClick={handlePrev}
                            disabled={isFirstStep}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 text-white shadow-lg flex items-center justify-center text-2xl md:text-3xl font-black disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-transform cursor-pointer border-none"
                            aria-label="Indietro"
                        >
                            ←
                        </button>

                        <div className="flex gap-2 md:gap-3">
                            {story.paragraphs.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-colors duration-300 ${i === currentScene ? 'bg-amber-500' : 'bg-gray-300'}`}
                                />
                            ))}
                        </div>

                        {!isLastStep ? (
                            <button
                                onClick={handleNext}
                                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg flex items-center justify-center text-2xl md:text-3xl font-black hover:scale-105 active:scale-95 transition-transform cursor-pointer border-none"
                                aria-label="Avanti"
                            >
                                →
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    isCompletedRef.current = true;
                                    await saveAnswer(9999, '[Completato]', null, true);
                                    endSession(currentScene);
                                    await saveGameSession(true);
                                    setShowRecapScreen(true);
                                }}
                                className="px-5 h-14 md:h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white font-extrabold text-sm md:text-base shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer border-none flex items-center justify-center gap-1.5"
                            >
                                Fine 🏆
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* POPUP POP-IN DI FEEDBACK */}
            {isFeedbackOpen && testFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div
                        className={`w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-4 transform transition-all duration-300 scale-100`}
                        style={{
                            borderColor: testFeedback.type === 'correct' ? '#22c55e' : testFeedback.type === 'wrong' ? '#f87171' : '#a78bfa',
                            animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        }}
                    >
                        {/* Header con gradiente */}
                        <div
                            className={`p-6 text-white text-center flex flex-col items-center gap-2 ${testFeedback.type === 'correct'
                                    ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                                    : testFeedback.type === 'wrong'
                                        ? 'bg-gradient-to-br from-red-400 to-rose-600'
                                        : 'bg-gradient-to-br from-purple-400 to-indigo-600'
                                }`}
                        >
                            <span className="text-5xl animate-bounce">
                                {testFeedback.type === 'correct' ? '🌟' : testFeedback.type === 'wrong' ? '💡' : '✨'}
                            </span>
                            <h3 className="text-2xl font-black tracking-tight">
                                {testFeedback.type === 'correct' ? 'Ottimo lavoro!' : testFeedback.type === 'wrong' ? 'Quasi! Riprova!' : 'Risposta registrata!'}
                            </h3>
                        </div>

                        {/* Corpo del Feedback */}
                        <div className="p-6 flex flex-col gap-4">
                            <p className="text-gray-700 text-lg font-bold text-center leading-relaxed">
                                {feedbackExplanation || (testFeedback.type === 'correct' ? 'Hai risposto correttamente!' : testFeedback.type === 'wrong' ? 'Scegli un\'altra opzione.' : 'La tua risposta è stata registrata.')}
                            </p>

                            {/* Azioni popup */}
                            <div className="mt-2 flex flex-col gap-3">
                                {testFeedback.type === 'correct' || testFeedback.type === null ? (
                                    <button
                                        onClick={async () => {
                                            setIsFeedbackOpen(false);
                                            if (isLastStep) {
                                                isCompletedRef.current = true;
                                                await saveAnswer(9999, '[Completato]', null, true);
                                                endSession(currentScene);
                                                await saveGameSession(true);
                                                setShowRecapScreen(true);
                                            } else {
                                                handleNext();
                                            }
                                        }}
                                        className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                                    >
                                        {isLastStep ? (
                                            <>Completa Gioco 🏆</>
                                        ) : (
                                            <>Prossimo Quesito ➡️</>
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsFeedbackOpen(false);
                                                setRispostaMultipla(null);
                                                setTestFeedback(null);
                                            }}
                                            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                                        >
                                            Riprova 🔄
                                        </button>
                                        {!isLastStep && (
                                            <button
                                                onClick={() => {
                                                    setIsFeedbackOpen(false);
                                                    handleNext();
                                                }}
                                                className="w-full py-2 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                                            >
                                                Vai avanti comunque →
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.85); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ViewEmoGame;