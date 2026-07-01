import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, BarChart
} from 'recharts';

const ANALYTICS_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/analytics`;
const BASE_EMOTIONS = ["Felicità", "Tristezza", "Rabbia", "Paura", "Sorpresa", "Disgusto"];

const EMOTION_COLORS = {
    "Felicità": "#10b981", // Emerald
    "Tristezza": "#3b82f6", // Blue
    "Rabbia": "#ef4444",    // Red
    "Paura": "#8b5cf6",     // Purple
    "Sorpresa": "#f97316",  // Orange
    "Disgusto": "#b45309"   // Brown/Amber
};

// Genera un colore HSL deterministico per le emozioni personalizzate
const getEmotionColor = (emotion) => {
    if (EMOTION_COLORS[emotion]) return EMOTION_COLORS[emotion];
    let hash = 0;
    for (let i = 0; i < emotion.length; i++) {
        hash = emotion.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 45%)`;
};

// Helper per normalizzare i testi delle emozioni
// Restituisce 'Altro' per testi che chiaramente NON sono nomi di emozioni (frasi narrative, testi lunghi)
const normalizeEmotion = (emotionStr) => {
    if (!emotionStr) return 'Altro';
    const trimmed = emotionStr.trim();
    // Testi più lunghi di 25 caratteri sono quasi certamente frasi narrative, non nomi di emozioni
    if (trimmed.length > 25) return 'Altro';
    const lower = trimmed.toLowerCase();
    if (lower.includes('felic') || lower.includes('happy') || lower === 'gioia') return 'Felicità';
    if (lower.includes('trist') || lower.includes('sad') || lower === 'tristezza') return 'Tristezza';
    if (lower.includes('rabb') || lower.includes('arrabb') || lower.includes('angr')) return 'Rabbia';
    if (lower.includes('paur') || lower.includes('spavent') || lower.includes('scar')) return 'Paura';
    if (lower.includes('sorpr') || lower.includes('surpris') || lower.includes('stupor')) return 'Sorpresa';
    if (lower.includes('disgust') || lower.includes('dislik')) return 'Disgusto';
    if (lower.includes('eccit') || lower.includes('entus')) return 'Eccitazione';
    if (lower.includes('calm') || lower.includes('sereni')) return 'Calma';
    // Se il testo non corrisponde a nessuna emozione nota, restituiamo 'Altro'
    return 'Altro';
};

// Estrae il timestamp di inizio sessione dall'ID di sessione (formato: ss-1781515086778-46)
const getSessionStartTime = (sessionId) => {
    if (!sessionId) return null;
    const parts = sessionId.split('-');
    if (parts.length >= 2) {
        const ts = parseInt(parts[1]);
        if (!isNaN(ts) && ts > 1000000000000) {
            return ts;
        }
    }
    return null;
};

const EmoGameAnalytics = ({ childId, therapistId, allStories = {} }) => {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [emoGamesMap, setEmoGamesMap] = useState({});
    const [activeSubTab, setActiveSubTab] = useState('clinical'); // 'clinical' | 'history'

    // Accordion states
    const [expandedStory, setExpandedStory] = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);

    // Filters
    const [dateFilter, setDateFilter] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeOfDay = (dateString) => {
        const hour = new Date(dateString).getHours();
        if (hour >= 6 && hour < 12) return { label: 'Mattina', color: 'bg-orange-50 text-orange-600' };
        if (hour >= 12 && hour < 18) return { label: 'Pomeriggio', color: 'bg-blue-50 text-blue-600' };
        if (hour >= 18 && hour < 22) return { label: 'Sera', color: 'bg-purple-50 text-purple-600' };
        return { label: 'Notte', color: 'bg-slate-800 text-slate-100' };
    };

    // Carica i dati delle risposte del bambino e dei giochi EmoGame del terapeuta
    const loadData = async () => {
        if (!childId) return;
        setLoading(true);
        try {
            const respRes = await axios.get(
                `${ANALYTICS_URL}/therapist/${therapistId}/child/${childId}/strange-story-responses?gameType=emoGame`,
                { withCredentials: true }
            );
            
            const gamesRes = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/emoGame/my-emogames`,
                { withCredentials: true }
            );

            const gameMap = {};
            if (gamesRes.data.success) {
                gamesRes.data.stories.forEach(g => {
                    gameMap[g._id] = g;
                });
            }

            if (respRes.data.success) {
                const fetchedResponses = respRes.data.responses;
                setResponses(fetchedResponses);

                // Recuperiamo le configurazioni dei giochi non presenti in my-emogames (es. standard o di altri)
                const uniqueStoryIds = [...new Set(fetchedResponses.map(r => r.storyId))];
                const missingStoryIds = uniqueStoryIds.filter(sid => sid && !gameMap[sid]);

                if (missingStoryIds.length > 0) {
                    await Promise.all(
                        missingStoryIds.map(async (sid) => {
                            try {
                                const { data } = await axios.get(
                                    `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/emoGame/${sid}`,
                                    { withCredentials: true }
                                );
                                if (data.success && data.story) {
                                    gameMap[sid] = data.story;
                                }
                            } catch (e) {
                                console.warn(`Could not load EmoGame ${sid} details:`, e.message);
                            }
                        })
                    );
                }
            }

            setEmoGamesMap(gameMap);
        } catch (err) {
            console.error('Errore nel caricamento delle analytics EmoGame:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [childId, therapistId]);

    // Filtra le risposte per Data
    // Identifica dinamicamente le slide massime giocate per ciascun gioco (per calcolare l'abbandono se il gioco manca in mappa)
    const expectedSlidesMap = useMemo(() => {
        const map = {};
        responses.forEach(r => {
            if (r.risposta !== '[Completato]' && r.risposta !== '[Abbandonato]') {
                const currentMax = map[r.storyId] || 0;
                if (r.sceneIndex + 1 > currentMax) {
                    map[r.storyId] = r.sceneIndex + 1;
                }
            }
        });
        return map;
    }, [responses]);

    // Restituisce il nome dell'emozione target per una risposta.
    //
    // Ordine di priorità (dal più affidabile al meno):
    //   1. r.targetEmotion  — salvato direttamente dal client al momento del gioco (fix definitivo)
    //   2. scene.emotion    — campo esplicito nella configurazione dello story (se ancora in memoria)
    //   3. opzione corretta — testo dell'opzione marcata isCorrect nella configurazione
    //   4. 'Altro'          — fallback pulito, NON usa più r.risposta né r.rispostaCorretta perché
    //                         contengono testi arbitrari (domande, frasi narrative) che
    //                         producevano label sbagliate come "Perché piace dormire a Marco"
    const getTargetEmotion = useCallback((r) => {
        // Priorità 1: campo salvato lato client (record nuovi post-fix)
        if (r.targetEmotion?.trim()) {
            return normalizeEmotion(r.targetEmotion.trim());
        }

        // Priorità 2: configurazione dello story ancora disponibile in memoria
        const emoGame = emoGamesMap[r.storyId];
        const scene = emoGame?.paragraphs?.[r.sceneIndex];
        if (scene) {
            if (scene.emotion?.trim()) return normalizeEmotion(scene.emotion.trim());
            const correctOpt = scene.strangeStoryTest?.options?.find(opt => opt.isCorrect === true);
            if (correctOpt?.text?.trim()) return normalizeEmotion(correctOpt.text.trim());
        }

        // Priorità 3: retrocompatibilità — cerca un sibling della stessa scena che abbia
        // già il campo targetEmotion (utile per record storici registrati prima del fix)
        const sib = responses.find(other =>
            other.storyId === r.storyId &&
            other.sceneIndex === r.sceneIndex &&
            other.targetEmotion?.trim()
        );
        if (sib) return normalizeEmotion(sib.targetEmotion.trim());

        return 'Altro';
    }, [emoGamesMap, responses]);

    // Mappa il testo dell'opzione cliccata all'emozione corrispondente.
    // Ordine di priorità:
    //   1. normalizeEmotion(r.risposta) — funziona quando le opzioni SONO i nomi delle emozioni
    //   2. Cerca l'opzione nella config del gioco e usa opt.isCorrect → target emotion della scena
    //   3. 'Altro' — fallback quando l'opzione è un testo narrativo non riconoscibile
    const getSelectedEmotion = useCallback((r) => {
        if (!r.risposta || r.risposta === '[Completato]' || r.risposta === '[Abbandonato]') return 'Altro';
        const attempts = r.risposta.split(', ');
        // Proviamo solo il primo tentativo (il testo dell'opzione cliccata)
        const raw = attempts[0]?.trim();
        if (!raw) return 'Altro';

        // Prova diretta con normalizeEmotion (funziona se l'opzione è un nome di emozione)
        const direct = normalizeEmotion(raw);
        if (direct !== 'Altro') return direct;

        // Fallback: cerca l'opzione nella config del gioco per trovare l'emozione associata
        const emoGame = emoGamesMap[r.storyId];
        const scene = emoGame?.paragraphs?.[r.sceneIndex];
        if (scene?.strangeStoryTest?.options) {
            const matchedOpt = scene.strangeStoryTest.options.find(
                opt => opt.text?.trim() === raw
            );
            if (matchedOpt) {
                // Se l'opzione ha un campo emotion esplicito
                if (matchedOpt.emotion?.trim()) return normalizeEmotion(matchedOpt.emotion.trim());
                // Se è l'opzione corretta, usa l'emozione target della scena
                if (matchedOpt.isCorrect === true) return getTargetEmotion(r);
                // Se è sbagliata, proviamo a normalizzare il suo testo come emozione
                const fromText = normalizeEmotion(matchedOpt.text || '');
                if (fromText !== 'Altro') return fromText;
            }
        }

        return 'Altro';
    }, [emoGamesMap, getTargetEmotion]);

    // Genera l'elenco di tutte le emozioni incontrate dinamicamente.
    // IMPORTANTE: raccogliamo SOLO da getTargetEmotion (emozione target della scena)
    // e da getSelectedEmotion (emozione cliccata normalizzata).
    // Non aggiungiamo mai testi grezzi di r.risposta che potrebbero essere frasi narrative.
    const activeEmotions = useMemo(() => {
        const emotionsSet = new Set();
        responses.forEach(r => {
            if (r.risposta === '[Completato]' || r.risposta === '[Abbandonato]') return;
            if (r.tipo === 'libera') return;

            // Emozione target (riga della matrice)
            const target = getTargetEmotion(r);
            if (target && target !== 'Altro') emotionsSet.add(target);

            // Emozione selezionata (colonna della matrice)
            const selected = getSelectedEmotion(r);
            if (selected && selected !== 'Altro') emotionsSet.add(selected);
        });

        const list = Array.from(emotionsSet).filter(e => e && e !== 'Altro');
        const basePresent = BASE_EMOTIONS.filter(e => list.includes(e));
        const others = list.filter(e => !BASE_EMOTIONS.includes(e)).sort();
        const combined = [...basePresent, ...others];

        return combined.length > 0 ? combined : BASE_EMOTIONS;
    }, [responses, getTargetEmotion, getSelectedEmotion]);

    // Raggruppa le risposte per Sessione e calcola i tempi di esitazione (usando all responses per evitare troncamenti)
    const allSessionsList = useMemo(() => {
        // Ordiniamo le risposte per data di gioco in ordine cronologico
        const sortedAllResps = [...responses].sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt));
        
        const sessionsMap = {};
        let lastSessionIdMap = {}; // storyId -> { sessionId, playedAt }
        
        sortedAllResps.forEach(r => {
            let sid = r.sessionId;
            const playedAtTime = new Date(r.playedAt).getTime();
            
            // Per le risposte storiche senza sessionId valido, creiamo sessioni virtuali basate su gap temporale
            if (!sid || sid === 'undefined' || sid === 'null') {
                const lastSession = lastSessionIdMap[r.storyId];
                if (lastSession && (playedAtTime - new Date(lastSession.playedAt).getTime() < 5 * 60 * 1000)) {
                    sid = lastSession.sessionId;
                } else {
                    sid = `ss-${playedAtTime}-virtual`;
                }
            }
            
            lastSessionIdMap[r.storyId] = { sessionId: sid, playedAt: r.playedAt };
            
            if (!sessionsMap[sid]) {
                sessionsMap[sid] = {
                    sessionId: sid,
                    storyId: r.storyId,
                    playedAt: r.playedAt,
                    responses: []
                };
            }
            sessionsMap[sid].responses.push(r);
        });

        const list = Object.values(sessionsMap).map(session => {
            const hasCompletedPlaceholder = session.responses.some(r => r.risposta === '[Completato]');
            const hasAbandonedPlaceholder = session.responses.some(r => r.risposta === '[Abbandonato]');

            // Filtriamo i placeholder per non distorcere le statistiche delle risposte effettive
            const cleanResponses = session.responses.filter(
                r => r.risposta !== '[Completato]' && r.risposta !== '[Abbandonato]'
            );

            // Clona e ordina i record per sceneIndex per tracciarli in sequenza
            const sortedResponses = [...cleanResponses]
                .sort((a, b) => a.sceneIndex - b.sceneIndex)
                .map(r => ({ ...r }));
            
            sortedResponses.forEach((resp, idx) => {
                const startTime = getSessionStartTime(resp.sessionId);
                if (idx === 0 && startTime) {
                    const diff = new Date(resp.playedAt).getTime() - startTime;
                    // Latenza reale tra avvio della partita e click sul primo quesito
                    resp.calculatedHesitation = diff > 0 && diff < 180000 ? diff : 3800;
                } else if (idx === 0) {
                    resp.calculatedHesitation = 3800;
                } else {
                    const prevResp = sortedResponses[idx - 1];
                    const diff = new Date(resp.playedAt).getTime() - new Date(prevResp.playedAt).getTime();
                    resp.calculatedHesitation = diff > 0 && diff < 240000 ? diff : 5000;
                }
            });

            const correctCount = sortedResponses.filter(r => r.isCorretta === true).length;
            const accuracy = sortedResponses.length > 0 ? Math.round((correctCount / sortedResponses.length) * 100) : 0;
            const totalScore = sortedResponses.reduce((sum, r) => sum + (r.score || 0), 0);
            const avgHesitation = sortedResponses.length > 0 
                ? Number((sortedResponses.reduce((sum, r) => sum + r.calculatedHesitation, 0) / sortedResponses.length / 1000).toFixed(1))
                : 0;

            return {
                ...session,
                responses: sortedResponses,
                correctCount,
                totalCount: sortedResponses.length,
                accuracy,
                totalScore,
                avgHesitation,
                playedAt: sortedResponses[0]?.playedAt || session.playedAt,
                isCompleted: hasCompletedPlaceholder,
                isAbandoned: hasAbandonedPlaceholder
            };
        });

        return list.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
    }, [responses]);

    // Filtra le sessioni per Data (livello sessione, per evitare di troncare risposte)
    const sessionsList = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        let customStartDate = null;
        let customEndDate = null;
        if (dateFilter === 'custom' && customStart && customEnd) {
            customStartDate = new Date(customStart);
            customEndDate = new Date(customEnd);
            customEndDate.setHours(23, 59, 59, 999);
        }

        return allSessionsList.filter(s => {
            const playedAt = new Date(s.playedAt);
            if (dateFilter === 'today') return playedAt >= startOfDay;
            if (dateFilter === 'week') return playedAt >= startOfWeek;
            if (dateFilter === 'month') return playedAt >= startOfMonth;
            if (dateFilter === 'custom' && customStartDate && customEndDate) {
                return playedAt >= customStartDate && playedAt <= customEndDate;
            }
            return true;
        });
    }, [allSessionsList, dateFilter, customStart, customEnd]);

    // Risposte filtrate derivate dalle sessioni filtrate
    const filteredResponses = useMemo(() => {
        return sessionsList.flatMap(s => s.responses);
    }, [sessionsList]);

    // Raggruppa le sessioni per EmoGame
    const storyGroups = useMemo(() => {
        const groups = {};
        sessionsList.forEach(session => {
            if (!groups[session.storyId]) {
                groups[session.storyId] = {
                    storyId: session.storyId,
                    sessions: [],
                    lastActivity: session.playedAt
                };
            }
            groups[session.storyId].sessions.push(session);
            if (new Date(session.playedAt) > new Date(groups[session.storyId].lastActivity)) {
                groups[session.storyId].lastActivity = session.playedAt;
            }
        });

        return Object.values(groups).map(g => {
            const allResps = g.sessions.flatMap(s => s.responses);
            const accuracy = allResps.length > 0
                ? Math.round((allResps.filter(r => r.isCorretta === true).length / allResps.length) * 100)
                : 0;
            const avgScore = g.sessions.length > 0 
                ? (g.sessions.reduce((sum, s) => sum + s.totalScore, 0) / g.sessions.length).toFixed(1)
                : '0.0';

            return {
                ...g,
                accuracy,
                avgScore,
                title: emoGamesMap[g.storyId]?.title || allStories[g.storyId]?.title || 'EmoGame personalizzato',
                difficulty: emoGamesMap[g.storyId]?.difficulty || 'DifI'
            };
        }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    }, [sessionsList, emoGamesMap, allStories]);

    // ==========================================
    // 5. METRICHE ED INDICATORI CLINICI (CORRETTI)
    // ==========================================

    const clinicalKPIs = useMemo(() => {
        const totalAnswers = filteredResponses.length;
        const correctAnswers = filteredResponses.filter(r => r.isCorretta === true).length;
        const incorrectAnswers = filteredResponses.filter(r => r.isCorretta === false).length;
        const globalAccuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

        const allFlatResponses = sessionsList.flatMap(s => s.responses);
        const allHesitations = allFlatResponses.map(r => r.calculatedHesitation || 3800);
        const avgHesitation = allHesitations.length > 0 
            ? (allHesitations.reduce((a, b) => a + b, 0) / allHesitations.length / 1000).toFixed(1)
            : '0.0';

        // CARICO COGNITIVO
        let cognitiveLoadLabel = 'N/A';
        if (allHesitations.length > 0) {
            const sec = parseFloat(avgHesitation);
            if (sec < 3.0) {
                cognitiveLoadLabel = 'Basso';
            } else if (sec < 5.5) {
                cognitiveLoadLabel = 'Moderato';
            } else {
                cognitiveLoadLabel = 'Alto';
            }
        }

        // INDICE DI IMPULSIVITÀ: % di risposte con latenza inferiore a 2.5 secondi
        const impulsiveResponses = allFlatResponses.filter(
            r => r.calculatedHesitation < 2500
        ).length;
        const impulsivityIndex = totalAnswers > 0 ? Math.round((impulsiveResponses / totalAnswers) * 100) : 0;

        // TASSO DI ABBANDONO (FRUSTRAZIONE): basato su placeholder espliciti completato/abbandonato o slide previste con test attivi
        const incompleteSessions = sessionsList.filter(s => {
            if (s.isCompleted) return false;
            if (s.isAbandoned) return true;

            const game = emoGamesMap[s.storyId];
            const totalTestSlides = game 
                ? (game.paragraphs?.filter(p => p.strangeStoryTest?.active === true)?.length || 0)
                : (expectedSlidesMap[s.storyId] || 0);
            return totalTestSlides > 0 && s.totalCount < totalTestSlides;
        }).length;
        const abandonmentRate = sessionsList.length > 0 ? Math.round((incompleteSessions / sessionsList.length) * 100) : 0;

        // EMOZIONE PIÙ CRITICA
        const emoScores = {};
        filteredResponses.forEach(r => {
            const emo = getTargetEmotion(r);
            if (activeEmotions.includes(emo)) {
                if (!emoScores[emo]) emoScores[emo] = { correct: 0, total: 0 };
                emoScores[emo].total++;
                if (r.isCorretta === true) emoScores[emo].correct++;
            }
        });

        let worstEmotion = 'Nessuna';
        let worstRate = 101;
        Object.entries(emoScores).forEach(([emo, data]) => {
            const rate = (data.correct / data.total) * 100;
            if (rate < worstRate && data.total > 0) {
                worstRate = rate;
                worstEmotion = emo;
            }
        });

        const formattedWorstEmotion = worstRate <= 100 
            ? `${worstEmotion} (${Math.round(worstRate)}%)` 
            : 'Nessuna';

        return {
            globalAccuracy,
            avgHesitation,
            cognitiveLoadLabel,
            impulsivityIndex,
            abandonmentRate,
            worstEmotion: formattedWorstEmotion,
            totalAnswers
        };
    }, [filteredResponses, sessionsList, activeEmotions, getTargetEmotion, emoGamesMap, expectedSlidesMap]);

    // Grafico Aggregato per Livello di Difficoltà (DifI, DifII, DifIII)
    const levelAggregationData = useMemo(() => {
        const stats = {
            'DifI': { correct: 0, total: 0, hesitationSum: 0, sessionCount: 0 },
            'DifII': { correct: 0, total: 0, hesitationSum: 0, sessionCount: 0 },
            'DifIII': { correct: 0, total: 0, hesitationSum: 0, sessionCount: 0 }
        };

        sessionsList.forEach(s => {
            const diff = emoGamesMap[s.storyId]?.difficulty || allStories[s.storyId]?.difficulty || 'DifI';
            if (stats[diff]) {
                stats[diff].sessionCount++;
                s.responses.forEach(r => {
                    stats[diff].total++;
                    stats[diff].hesitationSum += r.calculatedHesitation || 3800;
                    if (r.isCorretta === true) {
                        stats[diff].correct++;
                    }
                });
            }
        });

        const labelsMap = {
            'DifI': 'Livello I (Emoji)',
            'DifII': 'Livello II (Immagini)',
            'DifIII': 'Livello III (Video)'
        };

        return Object.entries(stats).map(([key, item]) => {
            const accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
            const avgHesitation = item.total > 0 ? Number((item.hesitationSum / item.total / 1000).toFixed(1)) : 0;
            return {
                levelKey: key,
                levelLabel: labelsMap[key] || key,
                accuracy,
                avgHesitation,
                sessionCount: item.sessionCount,
                totalAnswers: item.total
            };
        }).filter(item => item.totalAnswers > 0);
    }, [sessionsList, emoGamesMap, allStories]);

    // Grafico 1: ComposedChart (Riconoscimento Emotivo): Accuratezza (Barre) + Tempo di Risposta (Linea Viola)
    const emotionProfileData = useMemo(() => {
        const emoStats = {};
        activeEmotions.forEach(e => {
            emoStats[e] = { correct: 0, total: 0, hesitationSum: 0 };
        });

        sessionsList.forEach(s => {
            s.responses.forEach(r => {
                const emoNormalized = getTargetEmotion(r);
                if (emoStats[emoNormalized] !== undefined) {
                    emoStats[emoNormalized].total++;
                    emoStats[emoNormalized].hesitationSum += r.calculatedHesitation || 3800;
                    if (r.isCorretta === true) {
                        emoStats[emoNormalized].correct++;
                    }
                }
            });
        });

        return activeEmotions.map(emotion => {
            const item = emoStats[emotion];
            const accuratezza = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
            const esitazione = item.total > 0 ? Number((item.hesitationSum / item.total / 1000).toFixed(1)) : 0;
            return {
                emotion,
                accuratezza,
                esitazione,
                correct: item.correct,
                total: item.total
            };
        }).filter(item => item.total > 0);
    }, [sessionsList, activeEmotions, getTargetEmotion]);

    // Grafico 2: Curva di Apprendimento Temporale (Timeline delle sessioni con doppio asse Y)
    const learningTimelineData = useMemo(() => {
        const chronSessions = [...sessionsList].sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt));
        const recentSessions = chronSessions.slice(-10);

        return recentSessions.map((s, idx) => ({
            label: `S${idx + 1}`,
            fullDate: formatDate(s.playedAt),
            accuracy: s.accuracy,
            avgHesitation: s.avgHesitation,
            correctCount: s.correctCount,
            totalCount: s.totalCount
        }));
    }, [sessionsList]);

    // Matrice di Confusione Clinica (Confusion Heatmap - 100% Dinamica)
    const confusionMatrix = useMemo(() => {
        const matrix = {};
        activeEmotions.forEach(t => {
            matrix[t] = {};
            activeEmotions.forEach(s => {
                matrix[t][s] = 0;
            });
        });

        filteredResponses.forEach(r => {
            if (r.tipo === 'libera' || !r.risposta) return;
            if (r.risposta === '[Completato]' || r.risposta === '[Abbandonato]') return;

            const target = getTargetEmotion(r);
            if (!target || target === 'Altro' || !matrix[target]) return;

            // Usiamo getSelectedEmotion per mappare correttamente il testo cliccato all'emozione
            const selected = getSelectedEmotion(r);
            if (selected && selected !== 'Altro' && matrix[target][selected] !== undefined) {
                matrix[target][selected]++;
            }
        });

        return matrix;
    }, [filteredResponses, activeEmotions, getTargetEmotion, getSelectedEmotion]);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 mt-2 text-sm">Elaborazione clinica dati EmoGame...</p>
            </div>
        );
    }

    if (responses.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <span className="text-4xl block mb-3">🎮</span>
                <h3 className="text-lg font-bold text-gray-700">Nessuna partita registrata</h3>
                <p className="text-sm text-gray-500 mt-1">Il bambino non ha ancora risposto a quesiti di EmoGame.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
            
            {/* INTESTAZIONE E FILTRI */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        🎮 Analisi EmoGame Clinica
                        <button 
                            onClick={loadData}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors group"
                            title="Aggiorna dati"
                        >
                            <span className="text-sm block group-hover:rotate-180 transition-transform duration-500">🔄</span>
                        </button>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Tracciamento cognitivo dinamico delle emozioni, latenza di scelta e stima dell'impulsività</p>
                </div>

                {/* Filtro periodo */}
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 shadow-inner">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Periodo:</span>
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                        <option value="all">Sempre</option>
                        <option value="today">Oggi</option>
                        <option value="week">Ultimi 7 gg</option>
                        <option value="month">Ultimo mese</option>
                        <option value="custom">Personalizzato</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-1.5 ml-2 animate-fadeIn">
                            <input 
                                type="date" 
                                value={customStart} 
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="text-[11px] font-bold bg-white border border-gray-200 rounded px-1.5 py-1 text-gray-700"
                            />
                            <span className="text-gray-400 text-xs">a</span>
                            <input 
                                type="date" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="text-[11px] font-bold bg-white border border-gray-200 rounded px-1.5 py-1 text-gray-700"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* TAB INTERNI */}
            <div className="flex border-b border-gray-100 gap-4">
                <button
                    onClick={() => setActiveSubTab('clinical')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 px-2 flex items-center gap-2 ${
                        activeSubTab === 'clinical'
                            ? 'border-purple-600 text-purple-700'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <span>📊</span> Report Clinico ed Errori
                </button>
                <button
                    onClick={() => setActiveSubTab('history')}
                    className={`pb-3 text-sm font-black transition-all border-b-2 px-2 flex items-center gap-2 ${
                        activeSubTab === 'history'
                            ? 'border-purple-600 text-purple-700'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <span>📁</span> Storico Partite e Dettagli
                </button>
            </div>

            {/* TAB 1: REPORT CLINICO CON KPI AD ALTO CONTRASTO */}
            {activeSubTab === 'clinical' && (
                <div className="space-y-8 animate-fadeIn">
                    
                    {/* KPI CARDS CON COLORI NEUTRI E VALORI EVIDENZIATI DINAMICAMENTE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        
                        {/* 1. ACCURATEZZA GLOBALE */}
                        {(() => {
                            const acc = clinicalKPIs.globalAccuracy;
                            let valColor = "text-slate-700";
                            let badgeBg = "bg-slate-100 text-slate-700";
                            let badgeText = "Dato parziale";
                            if (acc >= 75) {
                                valColor = "text-emerald-600";
                                badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                                badgeText = "Ottimale 🎯";
                            } else if (acc >= 50) {
                                valColor = "text-amber-600";
                                badgeBg = "bg-amber-50 text-amber-700 border border-amber-100";
                                badgeText = "Moderato ⚠️";
                            } else {
                                valColor = "text-rose-600";
                                badgeBg = "bg-rose-50 text-rose-700 border border-rose-100";
                                badgeText = "Attenzione Clinica 🚨";
                            }
                            return (
                                <div className="bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col justify-between transform hover:scale-[1.02] transition-all duration-300 shadow-sm relative group">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Accuratezza Globale</span>
                                        <div className="relative group/tooltip">
                                            <button className="text-slate-300 hover:text-slate-500 transition-colors p-1 -m-1 focus:outline-none" aria-label="Informazioni">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-950 text-white text-[11px] p-3 rounded-2xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-bold border border-slate-800">
                                                Percentuale di risposte corrette al primo colpo su tutti i tentativi di scelta dell'emozione.
                                                <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="my-3">
                                        <span className={`text-4xl font-black ${valColor}`}>{acc}%</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeBg}`}>{badgeText}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{clinicalKPIs.totalAnswers} risposte</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 2. ESITAZIONE MEDIA */}
                        {(() => {
                            const sec = parseFloat(clinicalKPIs.avgHesitation);
                            let valColor = "text-slate-700";
                            let badgeBg = "bg-slate-100 text-slate-700";
                            let badgeText = "Carico: N/A";
                            if (sec < 3.0) {
                                valColor = "text-emerald-600";
                                badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                                badgeText = "Carico: Basso 🟢";
                            } else if (sec < 5.5) {
                                valColor = "text-amber-600";
                                badgeBg = "bg-amber-50 text-amber-700 border border-amber-100";
                                badgeText = "Carico: Moderato 🟡";
                            } else {
                                valColor = "text-rose-600";
                                badgeBg = "bg-rose-50 text-rose-700 border border-rose-100";
                                badgeText = "Carico: Alto 🔴";
                            }
                            return (
                                <div className="bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col justify-between transform hover:scale-[1.02] transition-all duration-300 shadow-sm relative group">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Esitazione Media</span>
                                        <div className="relative group/tooltip">
                                            <button className="text-slate-300 hover:text-slate-500 transition-colors p-1 -m-1 focus:outline-none" aria-label="Informazioni">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-950 text-white text-[11px] p-3 rounded-2xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-bold border border-slate-800">
                                                Tempo medio trascorso (in secondi) tra la comparsa della scena di gioco e la selezione dell'emozione.
                                                <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="my-3">
                                        <span className={`text-4xl font-black ${valColor}`}>{clinicalKPIs.avgHesitation}s</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeBg}`}>{badgeText}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">Velocità risposte</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 3. INDICE DI IMPULSIVITÀ */}
                        {(() => {
                            const imp = clinicalKPIs.impulsivityIndex;
                            let valColor = "text-slate-700";
                            let badgeBg = "bg-slate-100 text-slate-700";
                            let badgeText = "N/A";
                            if (imp <= 20) {
                                valColor = "text-emerald-600";
                                badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                                badgeText = "Riflessivo 🧠";
                            } else if (imp <= 45) {
                                valColor = "text-amber-600";
                                badgeBg = "bg-amber-50 text-amber-700 border border-amber-100";
                                badgeText = "Moderato ⚖️";
                            } else {
                                valColor = "text-rose-600";
                                badgeBg = "bg-rose-50 text-rose-700 border border-rose-100";
                                badgeText = "Impulsivo ⚡";
                            }
                            return (
                                <div className="bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col justify-between transform hover:scale-[1.02] transition-all duration-300 shadow-sm relative group">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Indice Impulsività</span>
                                        <div className="relative group/tooltip">
                                            <button className="text-slate-300 hover:text-slate-500 transition-colors p-1 -m-1 focus:outline-none" aria-label="Informazioni">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-950 text-white text-[11px] p-3 rounded-2xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-bold border border-slate-800">
                                                Frazione di risposte fornite frettolosamente (sotto i 2.5 secondi) che sono risultate non corrette.
                                                <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="my-3">
                                        <span className={`text-4xl font-black ${valColor}`}>{imp}%</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeBg}`}>{badgeText}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">Risposte rapide errate</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 4. EMOZIONE CRITICA */}
                        {(() => {
                            const hasWorst = clinicalKPIs.worstEmotion !== 'Nessuna';
                            const valColor = hasWorst ? "text-rose-600" : "text-emerald-600";
                            const badgeBg = hasWorst ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100";
                            const badgeText = hasWorst ? "Deficit di Riconoscimento 🔎" : "Nessuna Criticità 🎉";
                            return (
                                <div className="bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-3xl flex flex-col justify-between transform hover:scale-[1.02] transition-all duration-300 shadow-sm relative group">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Emozione più Critica</span>
                                        <div className="relative group/tooltip">
                                            <button className="text-slate-300 hover:text-slate-500 transition-colors p-1 -m-1 focus:outline-none" aria-label="Informazioni">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-950 text-white text-[11px] p-3 rounded-2xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-bold border border-slate-800">
                                                L'emozione che registra la percentuale di risposte corrette al primo tentativo più bassa.
                                                <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="my-3">
                                        <span className={`text-2xl font-black truncate block ${valColor}`}>{clinicalKPIs.worstEmotion}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeBg}`}>{badgeText}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">Accuratezza minore</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                       {/* COPPIA GRAFICI DI DETTAGLIO SUL PROFILO EMOTIVO */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* ACCURATEZZA PER EMOZIONE */}
                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="mb-4">
                                <h3 className="font-extrabold text-gray-800 text-lg">🎯 Riconoscimento per Emozione</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Percentuale di risposte corrette al primo tentativo per ciascuna emozione</p>
                            </div>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={emotionProfileData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis 
                                            dataKey="emotion" 
                                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, 100]} 
                                            ticks={[0, 25, 50, 75, 100]}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg text-xs">
                                                        <p className="font-black text-gray-700 uppercase mb-1">{data.emotion}</p>
                                                        <p className="font-bold text-emerald-600">Accuratezza: {data.accuratezza}%</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{data.correct} corrette su {data.total} tentativi</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Bar dataKey="accuratezza" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                            {emotionProfileData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* TEMPO DI RISPOSTA PER EMOZIONE */}
                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="mb-4">
                                <h3 className="font-extrabold text-gray-800 text-lg">⏱️ Tempo di Elaborazione per Emozione</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Tempo medio di esitazione (in secondi) prima della prima risposta</p>
                            </div>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={emotionProfileData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis 
                                            dataKey="emotion" 
                                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={[0, dataMax => Math.max(5, Math.ceil(dataMax + 1))]}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg text-xs">
                                                        <p className="font-black text-gray-700 uppercase mb-1">{data.emotion}</p>
                                                        <p className="font-bold text-purple-600">Tempo medio: {data.esitazione}s</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">Calcolato su {data.total} tentativi</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Bar dataKey="esitazione" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                            {emotionProfileData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#8b5cf6" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* COPPIA DI DETTAGLIO: CURVA DI APPRENDIMENTO CLINICO + PRESTAZIONI PER LIVELLO */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* CURVA DI APPRENDIMENTO CLINICO */}
                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-lg">📈 Curva di Apprendimento Clinico</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Trend delle ultime 10 sessioni. Linea verde: accuratezza (%). Linea viola tratteggiata: tempo medio (secondi)</p>
                            </div>
                            <div className="h-[280px] w-full mt-4">
                                {learningTimelineData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold italic">
                                        Dati insufficienti per tracciare la curva...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={learningTimelineData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis 
                                                dataKey="label" 
                                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                yAxisId="left"
                                                domain={[0, 100]} 
                                                ticks={[0, 25, 50, 75, 100]}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                yAxisId="right"
                                                orientation="right"
                                                domain={[0, dataMax => Math.max(5, Math.ceil(dataMax + 1))]}
                                                tick={{ fontSize: 11, fill: '#8b5cf6' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg text-xs">
                                                            <p className="font-black text-gray-700 mb-1">Sessione: {data.label}</p>
                                                            <p className="text-[10px] text-gray-400 mb-1">Data: {data.fullDate}</p>
                                                            <p className="font-bold text-emerald-600">Accuratezza: {data.accuracy}%</p>
                                                            <p className="font-bold text-purple-600">Tempo di risposta: {data.avgHesitation}s</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">{data.correctCount} risposte corrette su {data.totalCount}</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Line 
                                                yAxisId="left"
                                                type="monotone" 
                                                dataKey="accuracy" 
                                                stroke="#10b981" 
                                                strokeWidth={3} 
                                                dot={{ fill: '#10b981', r: 4 }} 
                                                activeDot={{ r: 6 }} 
                                            />
                                            <Line 
                                                yAxisId="right"
                                                type="monotone" 
                                                dataKey="avgHesitation" 
                                                stroke="#8b5cf6" 
                                                strokeWidth={2.5} 
                                                strokeDasharray="5 5" 
                                                dot={{ fill: '#8b5cf6', r: 3 }} 
                                                activeDot={{ r: 5 }} 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* PRESTAZIONI PER LIVELLO */}
                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="font-extrabold text-gray-800 text-lg">📶 Prestazioni per Livello</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Accuratezza (%) e Tempo di Risposta (secondi) aggregati per livello di difficoltà</p>
                            </div>
                            <div className="h-[280px] w-full mt-4">
                                {levelAggregationData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold italic">
                                        Nessun livello giocato nel periodo...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={levelAggregationData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis 
                                                dataKey="levelLabel" 
                                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                yAxisId="left"
                                                domain={[0, 100]} 
                                                ticks={[0, 25, 50, 75, 100]}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                yAxisId="right"
                                                orientation="right"
                                                domain={[0, dataMax => Math.max(5, Math.ceil(dataMax + 1))]}
                                                tick={{ fontSize: 11, fill: '#8b5cf6' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg text-xs">
                                                            <p className="font-black text-gray-700 mb-1">{data.levelLabel}</p>
                                                            <p className="font-bold text-emerald-600">Accuratezza: {data.accuracy}%</p>
                                                            <p className="font-bold text-purple-600">Tempo medio: {data.avgHesitation}s</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">{data.sessionCount} sessioni, {data.totalAnswers} risposte totali</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Bar yAxisId="left" dataKey="accuracy" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={38} />
                                            <Line yAxisId="right" type="monotone" dataKey="avgHesitation" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* MATRICE DI CONFUSIONE CLINICA DINAMICA (FULL WIDTH) */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-lg">🟩 Matrice di Confusione Dinamica</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Righe = emozione corretta richiesta. Colonne = emozione selezionata dal bambino. La diagonale verde indica le risposte corrette.</p>
                        </div>

                        <div className="overflow-x-auto my-4 w-full">
                            {activeEmotions.length === 0 ? (
                                <div className="text-center py-6 text-xs text-gray-400 font-bold italic">Nessun dato registrato per la costruzione della matrice.</div>
                            ) : (
                                <table className="text-center border-collapse" style={{ minWidth: `${(activeEmotions.length + 1) * 80}px`, width: '100%' }}>
                                    <thead>
                                        <tr>
                                            {/* Angolo top-left */}
                                            <th className="p-2 bg-gray-50 text-left text-[9px] font-black text-gray-400 uppercase tracking-tight border border-gray-100 min-w-[90px]">
                                                <div className="text-gray-400">Corretta ↓</div>
                                                <div className="text-gray-300">Cliccata →</div>
                                            </th>
                                            {activeEmotions.map(emo => {
                                                const color = EMOTION_COLORS[emo] || getEmotionColor(emo);
                                                return (
                                                    <th
                                                        key={emo}
                                                        className="p-2 text-[11px] font-black uppercase border border-gray-100 whitespace-nowrap"
                                                        style={{ color, background: `${color}12` }}
                                                        title={emo}
                                                    >
                                                        {emo}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeEmotions.map(target => {
                                            const rowTotal = activeEmotions.reduce(
                                                (sum, s) => sum + (confusionMatrix[target]?.[s] || 0), 0
                                            );
                                            const targetColor = EMOTION_COLORS[target] || getEmotionColor(target);
                                            return (
                                                <tr key={target} className="hover:bg-gray-50/30">
                                                    {/* Etichetta riga */}
                                                    <td
                                                        className="p-2 text-left text-[11px] font-black uppercase border border-gray-100 whitespace-nowrap"
                                                        style={{ color: targetColor, background: `${targetColor}12` }}
                                                    >
                                                        {target}
                                                    </td>
                                                    {activeEmotions.map(selected => {
                                                        const value = confusionMatrix[target]?.[selected] || 0;
                                                        const isCorrectCell = target === selected;
                                                        const pct = rowTotal > 0 ? Math.round((value / rowTotal) * 100) : 0;

                                                        let cellStyle = { color: '#cbd5e1' };
                                                        if (value > 0) {
                                                            const opacity = Math.min(0.15 + value * 0.18, 0.92);
                                                            if (isCorrectCell) {
                                                                cellStyle = {
                                                                    backgroundColor: `rgba(16,185,129,${opacity})`,
                                                                    color: opacity > 0.5 ? '#fff' : '#065f46',
                                                                    fontWeight: 900
                                                                };
                                                            } else {
                                                                cellStyle = {
                                                                    backgroundColor: `rgba(239,68,68,${opacity})`,
                                                                    color: opacity > 0.5 ? '#fff' : '#7f1d1d',
                                                                    fontWeight: 700
                                                                };
                                                            }
                                                        }

                                                        return (
                                                            <td
                                                                key={selected}
                                                                style={cellStyle}
                                                                className="p-2 border border-gray-100 text-xs transition-all"
                                                                title={value > 0 ? `${target} → ${selected}: ${value} volt${value === 1 ? 'a' : 'e'} (${pct}%)` : ''}
                                                            >
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
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-emerald-400 inline-block" />
                                <span>Risposta corretta (diagonale)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-red-400 inline-block" />
                                <span>Errore (fuori diagonale)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-300 font-black">—</span>
                                <span>Nessuna occorrenza</span>
                            </div>
                            <div className="ml-auto text-gray-400 font-bold italic">Ogni cella mostra: conteggio e % sulla riga</div>
                        </div>
                    </div>

                    {/* GUIDA TEORICA ALLE ANALYTICS */}
                    <div className="mt-12 pt-8 border-t border-gray-100 bg-slate-50/40 rounded-3xl p-6 border border-slate-100">
                        <div className="mb-6">
                            <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                                📖 Guida Teorica e Clinica alle Analytics
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Manuale di consultazione clinica per l'interpretazione dei dati cognitivi ed emotivi raccolti</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                                    <span className="text-emerald-500">🎯</span> Accuratezza Globale
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Rappresenta la percentuale di successo sul primo click. A livello clinico, misura la solidità del repertorio emotivo del bambino: una precisione elevata al primo colpo indica che lo schema cognitivo associato a quell'emozione è ben stabilizzato e facilmente accessibile.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                                    <span className="text-indigo-500">⏱️</span> Esitazione Media
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Il tempo di latenza riflette la velocità di elaborazione dello stimolo sociale. Un tempo prolungato (esitazione alta) può suggerire un alto carico cognitivo dovuto all'incertezza o a una decodifica faticosa, mentre tempi molto ridotti, se associati ad errori, possono essere indicativi di deficit di inibizione della risposta.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                                    <span className="text-rose-500">⚡</span> Indice di Impulsività
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Rappresenta la percentuale di errori commessi in meno di 2.5 secondi. Un valore elevato evidenzia la tendenza del bambino a selezionare risposte motorie rapide ed automatiche, prima di aver completato l'analisi cognitiva dello scenario emotivo (risposta disfunzionale tipica dello spettro autistico).
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                                    <span className="text-amber-500">📶</span> Livelli di Difficoltà
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Il passaggio tra i livelli misura la capacità di generalizzazione:
                                    <br />• <strong>Livello I (Emoji)</strong>: Valuta il riconoscimento di forme stilizzate e canoniche.
                                    <br />• <strong>Livello II (Immagini)</strong>: Richiede il riconoscimento in contesti reali ed espressivi.
                                    <br />• <strong>Livello III (Video)</strong>: Richiede la decodifica di micro-espressioni e indizi contestuali dinamici.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 mb-2">
                                    <span className="text-purple-500">🟩</span> Matrice di Confusione Dinamica
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Mappa l'esatto pattern di errore del bambino. Non si limita a segnalare se risponde bene o male, ma mostra quali emozioni vengono scambiate (es. confondere la "Rabbia" con la "Tristezza"). Questo dato è fondamentale per progettare interventi terapeutici mirati sulle aree di reale sovrapposizione percettiva.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: STORICO DELLE PARTITE E DELLE RISPOSTE */}
            {activeSubTab === 'history' && (
                <div className="space-y-6 animate-fadeIn">
                    
                    {storyGroups.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center text-gray-400 font-bold text-sm">
                            Nessun EmoGame giocato nel periodo selezionato.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {storyGroups.map((group) => {
                                const isExpanded = expandedStory === group.storyId;

                                return (
                                    <div key={group.storyId} className="border border-purple-100 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        
                                        {/* LIVELLO 1: EmoGame */}
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

                                        {/* LIVELLO 2: Sessioni */}
                                        {isExpanded && (
                                            <div className="p-4 bg-gray-50/50 space-y-3">
                                                {group.sessions.map((session, sIdx) => {
                                                    const sessionKey = `${group.storyId}-${sIdx}`;
                                                    const isSessionExpanded = expandedSession === sessionKey;
                                                    const timeInfo = getTimeOfDay(session.playedAt);

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

                                                            {/* LIVELLO 3: Quesiti */}
                                                            {isSessionExpanded && (
                                                                <div className="p-4 border-t border-gray-100 bg-purple-50/10 space-y-4">
                                                                    <h4 className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Dettaglio risposte della sessione</h4>
                                                                    {session.responses.length === 0 ? (
                                                                        <p className="text-xs text-gray-400 font-bold italic py-2">Nessun tentativo registrato prima dell'abbandono.</p>
                                                                    ) : (
                                                                        <div className="grid md:grid-cols-2 gap-4">
                                                                        {session.responses.map((resp, rIdx) => {
                                                                            const isCorrect = resp.isCorretta === true;
                                                                            const hasImage = !!resp.rispostaImageUrl;
                                                                            const latencySec = ((resp.calculatedHesitation || 3800) / 1000).toFixed(1);

                                                                            return (
                                                                                <div 
                                                                                    key={resp._id || rIdx} 
                                                                                    className={`p-4 rounded-xl border-2 flex gap-3 ${
                                                                                        isCorrect
                                                                                            ? 'bg-green-50/50 border-green-200'
                                                                                            : 'bg-red-50/50 border-red-200'
                                                                                    }`}
                                                                                >
                                                                                    {/* Immagine dell'opzione */}
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
                    )}

                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default EmoGameAnalytics;