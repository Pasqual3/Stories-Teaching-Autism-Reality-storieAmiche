import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { appContext } from '../../../context/appContext';
import ProgressBar from '../../../shared/components/ProgressBar';
import useSessionTracker from '../../../shared/hooks/useSessionTracker';
import Navbar from '../../../shared/components/Navbar';
import { Helmet } from 'react-helmet-async';
import { renderFormattedText, resolveEmoji, stripAllMarkersKeepText, parseTextForKaraoke } from '../../../shared/utils/textFormat';

const optimizeCloudinaryUrl = (url, width = 800) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
        return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
    return url;
};

const ViewStory = () => {
    const { backendUrl, userData, activeChild, setSessionExitHandler } = useContext(appContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);
    const [isScenePlaying, setIsScenePlaying] = useState(false);
    const [currentScene, setCurrentScene] = useState(0);
    const [phase, setPhase] = useState('reading');

    const [risposteLibere, setRisposteLibere] = useState({});
    const [risposteMultiple, setRisposteMultiple] = useState({});
    const [showError, setShowError] = useState(false);
    // testFeedback ora contiene: null | { type: 'correct'|'wrong', option: opzione selezionata }
    const [testFeedback, setTestFeedback] = useState(null);
    const [analiticsUrl] = useState(`${backendUrl}/api/analytics`);

    const lastSavedRef = useRef({});
    const [strangeSessionId] = useState(`ss-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    const textareaRef = useRef(null);

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
        enabled: !!childId && userData?.isChildActive === true
    });

    useEffect(() => {
        if (endSession && (activeChild?.childId || userData?.isChildActive)) {
            setSessionExitHandler(() => () => { endSession(currentScene, false); });
        }
        return () => setSessionExitHandler(null);
    }, [endSession, currentScene, userData?.isChildActive, setSessionExitHandler]);

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
                const { data } = await axios.get(`${backendUrl}/api/story/${id}`);
                if (data.success) {
                    setStory(data.story);
                    preloadImages(data.story.paragraphs);
                } else {
                    toast.error(data.message);
                    navigate('/profile');
                }
            } catch (error) {
                toast.error("Errore nel caricamento");
                navigate('/profile');
            } finally {
                setLoading(false);
            }
        };
        fetchStory();
    }, [backendUrl, id, navigate]);

    const pageBgColor = story?.backgroundColor || '#f0f4ff';
    const currentParagraph = story?.paragraphs[currentScene];
    const karaokeWords = parseTextForKaraoke(currentParagraph?.text);
    const hasTest = currentParagraph?.strangeStoryTest?.active === true;

    const [audioDuration, setAudioDuration] = useState(0);

    const currentSceneChars = karaokeWords.reduce((acc, w) => acc + w.text.length, 0);
    const estimatedCharsSpoken = audioDuration > 0 ? (currentTime / audioDuration) * currentSceneChars : 0;

    let accumulatedChars = 0;
    let currentWordIndexInScene = 0;
    for (let i = 0; i < karaokeWords.length; i++) {
        accumulatedChars += karaokeWords[i].text.length;
        if (estimatedCharsSpoken <= accumulatedChars) { currentWordIndexInScene = i; break; }
        currentWordIndexInScene = i;
    }

    const stopAllAudio = () => {
        const narrationAudio = document.getElementById('scene-narration-audio');
        const sceneAudio = document.getElementById('scene-audio');
        if (narrationAudio) { narrationAudio.pause(); narrationAudio.currentTime = 0; setIsGlobalPlaying(false); }
        if (sceneAudio) { sceneAudio.pause(); sceneAudio.currentTime = 0; setIsScenePlaying(false); }
    };

    // opzioneSelezionata: oggetto opzione completo (per blocchi_immagine), null per libera
    const saveAnswer = async (sceneIndex, risposta, opzioneSelezionata = null) => {
        const scena = story.paragraphs[sceneIndex];
        const test = scena.strangeStoryTest;

        if (!childId) return;
        if (!test?.active || !risposta || risposta.trim() === '') return;
        if (lastSavedRef.current[sceneIndex] === risposta) return;

        try {
            await axios.post(`${analiticsUrl}/strange-story`, {
                childId, storyId: id, parentId,
                sessionId: strangeSessionId,
                sceneIndex,
                domanda: test.question,
                tipo: test.type,
                risposta,
                rispostaCorretta: test.correctAnswer || '',
                rispostaImageUrl: opzioneSelezionata?.imageUrl || '',
                isCorrettaPerOpzione: opzioneSelezionata ? opzioneSelezionata.isCorrect : undefined,
                gameType: 'story'
            });
            lastSavedRef.current[sceneIndex] = risposta;
        } catch (e) {
            console.warn('Risposta non salvata:', e.message);
        }
    };

    const handleNext = () => {
        stopAllAudio();

        if (phase === 'reading') {
            if (hasTest) {
                setPhase('test');
            } else {
                if (currentScene < story.paragraphs.length - 1) {
                    const nextScene = currentScene + 1;
                    onSlideChange(nextScene, 'next');
                    setCurrentScene(nextScene);
                }
            }
        } else {
            if (hasTest) {
                const test = currentParagraph.strangeStoryTest;
                const risposta = test.type === 'libera' ? rispostaLibera : rispostaMultipla?.text;
                if (!risposta || risposta.trim() === '') {
                    setShowError(true);
                    setTimeout(() => setShowError(false), 3000);
                    return;
                }
                saveAnswer(currentScene, risposta);
            }

            if (currentScene < story.paragraphs.length - 1) {
                const nextScene = currentScene + 1;
                onSlideChange(nextScene, 'next');
                setCurrentScene(nextScene);
                setPhase('reading');
                setShowError(false);
                setTestFeedback(null);
            }
        }
    };

    const handlePrev = () => {
        stopAllAudio();

        if (phase === 'test') {
            setPhase('reading');
            setShowError(false);
            setTestFeedback(null);
        } else {
            if (currentScene > 0) {
                const prevScene = currentScene - 1;
                onSlideChange(prevScene, 'prev');
                setCurrentScene(prevScene);
                const prevHasTest = story.paragraphs[prevScene]?.strangeStoryTest?.active === true;
                setPhase(prevHasTest ? 'test' : 'reading');
                setShowError(false);
                setTestFeedback(null);
            }
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
        if (textareaRef.current && phase === 'test') {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
            textareaRef.current.style.height = newHeight + 'px';
        }
    }, [rispostaLibera, phase, currentScene]);

    // ── Gestione selezione opzione (blocchi_immagine) ──
    // Usa isCorrect per opzione se disponibile, altrimenti fallback su correctAnswer globale
    const handleSelectOption = (opzione) => {
        setRispostaMultipla(opzione);
        setShowError(false);
        saveAnswer(currentScene, opzione.text, opzione);

        // Determina correttezza: prima per-opzione (isCorrect), poi fallback su correctAnswer globale
        let feedbackType = null;
        if (opzione.isCorrect === true) {
            feedbackType = 'correct';
        } else if (opzione.isCorrect === false) {
            feedbackType = 'wrong';
        } else {
            // fallback: confronto con correctAnswer globale (vecchia logica)
            const correctAnswer = currentParagraph?.strangeStoryTest?.correctAnswer;
            if (correctAnswer) {
                feedbackType = opzione.text === correctAnswer ? 'correct' : 'wrong';
            }
        }

        if (feedbackType) {
            setTestFeedback({ type: feedbackType, option: opzione });
            playSound(feedbackType);
            if (feedbackType === 'wrong' && navigator.vibrate) navigator.vibrate(100);
        } else {
            // Nessuna valutazione configurata: seleziona senza feedback
            setTestFeedback({ type: null, option: opzione });
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
    const isFirstStep = currentScene === 0 && phase === 'reading';
    const isLastStep = currentScene === story.paragraphs.length - 1 && (phase === 'test' || !hasTest);
    const showGameButtons = isLastStep && userData?.isChildActive;

    let testOptions = [];
    let gridCols = '';
    if (phase === 'test' && hasTest && currentParagraph.strangeStoryTest.type === 'blocchi_immagine') {
        testOptions = currentParagraph.strangeStoryTest.options.filter(o => o.text || o.imageUrl).slice(0, 6);
        gridCols = testOptions.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }

    // Calcola il feedback da mostrare in fondo (spiegazione dell'opzione selezionata)
    const feedbackOpzione = testFeedback?.option ?? null;
    const feedbackType = testFeedback?.type ?? null;

    // Spiegazione: prima cerca la spiegazione per-opzione, poi fallback su explanation globale (solo per corrette)
    const getFeedbackExplanation = () => {
        if (!feedbackOpzione) return null;
        if (feedbackOpzione.explanation && feedbackOpzione.explanation.trim()) {
            return feedbackOpzione.explanation;
        }
        // Fallback: explanation globale solo se corretta
        if (feedbackType === 'correct' && currentParagraph?.strangeStoryTest?.explanation) {
            return currentParagraph.strangeStoryTest.explanation;
        }
        return null;
    };

    const feedbackExplanation = getFeedbackExplanation();

    return (
        <div
            style={{ backgroundColor: pageBgColor, fontFamily: "'Nunito', sans-serif" }}
            className="h-screen w-screen flex flex-col overflow-hidden"
        >
            <Helmet>
                <title>{story?.title ? `${story.title} — Storie Amiche` : 'Visualizza Storia — Storie Amiche'}</title>
            </Helmet>
            <div className="shrink-0">
                <Navbar />
            </div>

            <main className="flex-1 min-h-0 flex flex-col p-2 md:p-3 gap-2">

                <div className="flex-1 min-h-0 bg-white rounded-3xl border-2 border-gray-200 shadow-lg overflow-hidden flex flex-col">

                    {/* ═══════════════════════════════════════
                        FASE 1: LETTURA
                    ═══════════════════════════════════════ */}
                    {phase === 'reading' && (
                        <div className={`flex-1 min-h-0 flex flex-col ${!isVideo ? 'md:flex-row' : ''}`}>

                            {currentParagraph?.narrationUrl && (
                                <audio
                                    id="scene-narration-audio"
                                    src={currentParagraph.narrationUrl}
                                    onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                                    onTimeUpdate={handleTimeUpdate}
                                    onPlay={() => { setIsGlobalPlaying(true); const s = document.getElementById('scene-audio'); if (s) s.pause(); }}
                                    onPause={() => setIsGlobalPlaying(false)}
                                    onEnded={() => { setIsGlobalPlaying(false); setCurrentTime(0); }}
                                />
                            )}

                            {isVideo && (
                                <div className="shrink-0 h-40 bg-black flex items-center justify-center">
                                    <video
                                        src={currentParagraph.mediaUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                        onPlay={() => { const a = document.getElementById('scene-narration-audio'); if (a) a.pause(); }}
                                    />
                                </div>
                            )}

                            <div className="flex-1 min-h-0 flex flex-col p-3 md:p-5 min-w-0">
                                <div className="flex items-center gap-3 mb-2 shrink-0">
                                    <button
                                        onClick={toggleGlobalPlay}
                                        disabled={!currentParagraph?.narrationUrl}
                                        className={`w-14 h-14 rounded-full ${currentParagraph?.narrationUrl ? 'bg-blue-300 text-blue-900 cursor-pointer hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} flex items-center justify-center text-2xl shadow-md transition-transform shrink-0 border-none`}
                                        aria-label={isGlobalPlaying ? 'Pausa' : 'Ascolta'}
                                    >
                                        {isGlobalPlaying
                                            ? <span className="font-black text-lg tracking-widest">❚❚</span>
                                            : <span className="ml-1">▶</span>}
                                    </button>
                                    <span className="text-sm font-extrabold text-blue-400 uppercase tracking-wide">
                                        Ascolta la scena
                                    </span>
                                </div>

                                <div className="flex-1 flex items-center min-h-0">
                                    <p className="text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-snug">
                                        {karaokeWords.map((wordObj, i) => {
                                            const isHighlighted = isGlobalPlaying && i === currentWordIndexInScene;
                                            return (
                                                <span
                                                    key={i}
                                                    className={`inline-block mr-1.5 mb-1 ${wordObj.isBold ? 'font-black' : ''} ${wordObj.isItalic ? 'italic' : ''} ${isHighlighted ? 'bg-yellow-200 text-yellow-900 rounded-md px-1 py-0.5 transition-colors duration-300' : ''}`}
                                                >
                                                    {wordObj.text}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                            </div>

                            {hasMedia && !isVideo && (
                                <div className="shrink-0 h-36 md:h-auto md:w-2/5 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex items-center justify-center p-2 overflow-hidden">
                                    <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-md flex items-center justify-center bg-white">
                                        {isAudio ? (
                                            <div className="w-full p-4 flex flex-col items-center bg-gradient-to-br from-indigo-50 to-white">
                                                <div className="text-4xl mb-2">🎵</div>
                                                <audio
                                                    id="scene-audio"
                                                    src={currentParagraph.mediaUrl}
                                                    controls
                                                    className="w-full"
                                                    onPlay={() => { setIsScenePlaying(true); const a = document.getElementById('scene-narration-audio'); if (a) a.pause(); }}
                                                    onPause={() => setIsScenePlaying(false)}
                                                    onEnded={() => setIsScenePlaying(false)}
                                                />
                                            </div>
                                        ) : (
                                            <img
                                                src={optimizeCloudinaryUrl(currentParagraph.mediaUrl, 800)}
                                                alt="Illustrazione della scena"
                                                className="w-full h-full object-contain"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════
                        FASE 2: TEST
                    ═══════════════════════════════════════ */}
                    {phase === 'test' && hasTest && (
                        <div className="flex-1 min-h-0 flex flex-col p-3 md:p-5 gap-3 overflow-hidden">

                            <div className="flex items-center gap-2 min-w-0 shrink-0">
                                <span className="text-2xl md:text-3xl shrink-0">🤔</span>
                                <h2 className="text-lg md:text-xl font-black text-amber-900 truncate">Fermati un momento!</h2>
                            </div>

                            {/* DOMANDA */}
                            <div className="bg-amber-50 rounded-xl p-3 md:p-4 border-2 border-amber-200 shrink-0">
                                <p className="text-xl md:text-2xl font-black text-amber-950 text-center leading-snug break-words">
                                    {renderFormattedText(currentParagraph.strangeStoryTest.question)}
                                </p>
                            </div>

                            {showError && (
                                <div className="bg-red-100 border-2 border-red-400 rounded-xl p-3 flex items-center gap-2 text-red-700 font-bold text-base shrink-0">
                                    <span className="text-xl shrink-0">☝️</span>
                                    <span className="break-words">
                                        {currentParagraph.strangeStoryTest.type === 'libera'
                                            ? 'Scrivi la tua risposta prima di continuare!'
                                            : 'Tocca una risposta per sceglierla!'}
                                    </span>
                                </div>
                            )}

                            {/* RISPOSTA LIBERA */}
                            {currentParagraph.strangeStoryTest.type === 'libera' && (
                                <textarea
                                    ref={textareaRef}
                                    value={rispostaLibera}
                                    onChange={handleTextChange}
                                    placeholder="Scrivi qui la tua risposta..."
                                    className="w-full p-3 md:p-4 border-2 border-gray-300 rounded-xl text-base md:text-lg font-bold text-amber-950 placeholder-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none resize-none min-h-[80px] max-h-[220px] overflow-y-auto break-words"
                                    rows={1}
                                />
                            )}

                            {/* OPZIONI CON IMMAGINE */}
                            {currentParagraph.strangeStoryTest.type === 'blocchi_immagine' && testOptions.length > 0 && (
                                <div className={`grid ${gridCols} gap-3 md:gap-4 flex-1 min-h-0 overflow-y-auto content-start`}>
                                    {testOptions.map((opzione, i) => {
                                        const isSelected = rispostaMultipla?.text === opzione.text;
                                        const thisFeedbackType = isSelected ? feedbackType : null;

                                        let borderColor = 'border-gray-200';
                                        let bgColor = 'bg-white';

                                        if (isSelected && thisFeedbackType === 'correct') {
                                            borderColor = 'border-green-500';
                                            bgColor = 'bg-green-50';
                                        } else if (isSelected && thisFeedbackType === 'wrong') {
                                            borderColor = 'border-red-400';
                                            bgColor = 'bg-red-50';
                                        } else if (isSelected && thisFeedbackType === null && feedbackOpzione) {
                                            // selezionata ma senza valutazione
                                            borderColor = 'border-amber-500';
                                            bgColor = 'bg-amber-50';
                                        }

                                        // Mostra il badge emoji/icona: usa immagine se presente, altrimenti emoji configurata
                                        const hasImage = !!opzione.imageUrl;
                                        const emojiToShow = resolveEmoji(opzione.emoji);

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleSelectOption(opzione)}
                                                className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl border-2 ${borderColor} ${bgColor} hover:border-amber-400 transition-colors active:scale-95 text-left cursor-pointer shadow-sm min-h-[80px] overflow-hidden`}
                                            >
                                                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                                                    {hasImage ? (
                                                        <img
                                                            src={optimizeCloudinaryUrl(opzione.imageUrl, 200)}
                                                            alt=""
                                                            className="w-full h-full object-cover object-top"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl md:text-3xl">{emojiToShow}</span>
                                                    )}
                                                </div>
                                                <span className="text-base md:text-lg font-bold text-amber-950 leading-tight break-words w-full">
                                                    {renderFormattedText(opzione.text)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── FEEDBACK DOPO LA SELEZIONE ── */}
                            {feedbackOpzione && feedbackExplanation && (
                                <div className={`shrink-0 p-3 md:p-4 rounded-xl flex gap-3 items-start border-2 ${
                                    feedbackType === 'correct'
                                        ? 'bg-green-50 border-green-200'
                                        : feedbackType === 'wrong'
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-amber-50 border-amber-200'
                                }`}>
                                    <span className="text-2xl shrink-0">
                                        {feedbackType === 'correct' ? '🌟' : feedbackType === 'wrong' ? '💡' : '💬'}
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`font-extrabold text-base mb-0.5 ${
                                            feedbackType === 'correct' ? 'text-green-800' : feedbackType === 'wrong' ? 'text-red-700' : 'text-amber-800'
                                        }`}>
                                            {feedbackType === 'correct' ? 'Ottimo lavoro!' : feedbackType === 'wrong' ? 'Riprova!' : 'Ecco la spiegazione:'}
                                        </p>
                                        <p className={`font-bold text-base md:text-lg leading-snug break-words ${
                                            feedbackType === 'correct' ? 'text-green-700' : feedbackType === 'wrong' ? 'text-red-600' : 'text-amber-700'
                                        }`}>
                                            {renderFormattedText(feedbackExplanation)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
                    ) : showGameButtons ? (
                        <div className="flex gap-2 md:gap-3">
                            {(story.isSequencingGameActive === true || story.isSequencingGameActive === 'true') && (
                                <button
                                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-200 to-green-400 text-2xl md:text-3xl shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center border-none"
                                    onClick={() => {
                                        const resp = currentParagraph?.strangeStoryTest?.type === 'libera' ? rispostaLibera : rispostaMultipla?.text;
                                        if (hasTest && resp) saveAnswer(currentScene, resp);
                                        endSession(currentScene);
                                        navigate(`/games/sequencing/${story._id}`);
                                    }}
                                    title="Gioco Sequenze"
                                    aria-label="Gioco Sequenze"
                                >🧩</button>
                            )}
                            {(story.isEmotionGameActive === true || story.isEmotionGameActive === 'true') && (
                                <button
                                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-teal-200 to-teal-400 text-2xl md:text-3xl shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center border-none"
                                    onClick={() => {
                                        const resp = currentParagraph?.strangeStoryTest?.type === 'libera' ? rispostaLibera : rispostaMultipla?.text;
                                        if (hasTest && resp) saveAnswer(currentScene, resp);
                                        endSession(currentScene);
                                        navigate(`/games/emotions/${story._id}`);
                                    }}
                                    title="Gioco Emozioni"
                                    aria-label="Gioco Emozioni"
                                >😊</button>
                            )}
                        </div>
                    ) : <div className="w-14 md:w-16" />}
                </div>
            </main>

            <style>{`
                @keyframes sceneFade {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ViewStory;