// ─── Hook: tutta la logica di fetch e derivazione dati per EmoGame Analytics ──
import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    BASE_EMOTIONS,
    normalizeEmotion,
    getSessionStartTime
} from './emoGameUtils';

const ANALYTICS_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/analytics`;
const BACKEND_URL   = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const useEmoGameData = ({ childId, therapistId, allStories = {} }) => {
    const [responses,   setResponses]   = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [emoGamesMap, setEmoGamesMap] = useState({});

    // Filtri periodo
    const [dateFilter,   setDateFilter]   = useState('all');
    const [customStart,  setCustomStart]  = useState('');
    const [customEnd,    setCustomEnd]    = useState('');

    // ── Fetch dati ──────────────────────────────────────────────────────────
    const loadData = async () => {
        if (!childId) return;
        setLoading(true);
        try {
            const respRes = await axios.get(
                `${ANALYTICS_URL}/therapist/${therapistId}/child/${childId}/strange-story-responses?gameType=emoGame`,
                { withCredentials: true }
            );

            const gamesRes = await axios.get(
                `${BACKEND_URL}/api/emoGame/my-emogames`,
                { withCredentials: true }
            );

            const gameMap = {};
            if (gamesRes.data.success) {
                gamesRes.data.stories.forEach(g => { gameMap[g._id] = g; });
            }

            if (respRes.data.success) {
                const fetchedResponses = respRes.data.responses;
                setResponses(fetchedResponses);

                // Carica configurazioni mancanti (es. giochi standard o di altri terapeuti)
                const uniqueStoryIds  = [...new Set(fetchedResponses.map(r => r.storyId))];
                const missingStoryIds = uniqueStoryIds.filter(sid => sid && !gameMap[sid]);

                if (missingStoryIds.length > 0) {
                    await Promise.all(
                        missingStoryIds.map(async (sid) => {
                            try {
                                const { data } = await axios.get(
                                    `${BACKEND_URL}/api/emoGame/${sid}`,
                                    { withCredentials: true }
                                );
                                if (data.success && data.story) gameMap[sid] = data.story;
                            } catch (e) {
                                console.warn(`Could not load EmoGame ${sid}:`, e.message);
                            }
                        })
                    );
                }
            }

            setEmoGamesMap(gameMap);
        } catch (err) {
            console.error('Errore caricamento analytics EmoGame:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [childId, therapistId]);

    // ── Helper: emozione target della scena ─────────────────────────────────
    const getTargetEmotion = useCallback((r) => {
        // 1. Campo salvato lato client (record nuovi post-fix)
        if (r.targetEmotion?.trim()) return normalizeEmotion(r.targetEmotion.trim());

        // 2. Configurazione dello story in memoria
        const emoGame = emoGamesMap[r.storyId];
        const scene   = emoGame?.paragraphs?.[r.sceneIndex];
        if (scene) {
            if (scene.emotion?.trim()) return normalizeEmotion(scene.emotion.trim());
            const correctOpt = scene.strangeStoryTest?.options?.find(opt => opt.isCorrect === true);
            if (correctOpt?.text?.trim()) return normalizeEmotion(correctOpt.text.trim());
        }

        // 3. Retrocompatibilità: sibling della stessa scena con targetEmotion
        const sib = responses.find(other =>
            other.storyId === r.storyId &&
            other.sceneIndex === r.sceneIndex &&
            other.targetEmotion?.trim()
        );
        if (sib) return normalizeEmotion(sib.targetEmotion.trim());

        return 'Altro';
    }, [emoGamesMap, responses]);

    // ── Helper: emozione selezionata dal bambino ─────────────────────────────
    const getSelectedEmotion = useCallback((r) => {
        if (!r.risposta || r.risposta === '[Completato]' || r.risposta === '[Abbandonato]') return 'Altro';
        const raw = r.risposta.split(', ')[0]?.trim();
        if (!raw) return 'Altro';

        const direct = normalizeEmotion(raw);
        if (direct !== 'Altro') return direct;

        const emoGame = emoGamesMap[r.storyId];
        const scene   = emoGame?.paragraphs?.[r.sceneIndex];
        if (scene?.strangeStoryTest?.options) {
            const matchedOpt = scene.strangeStoryTest.options.find(opt => opt.text?.trim() === raw);
            if (matchedOpt) {
                if (matchedOpt.emotion?.trim()) return normalizeEmotion(matchedOpt.emotion.trim());
                if (matchedOpt.isCorrect === true) return getTargetEmotion(r);
                const fromText = normalizeEmotion(matchedOpt.text || '');
                if (fromText !== 'Altro') return fromText;
            }
        }

        return 'Altro';
    }, [emoGamesMap, getTargetEmotion]);

    // ── Slide massime per gioco (fallback abbandono) ──────────────────────────
    const expectedSlidesMap = useMemo(() => {
        const map = {};
        responses.forEach(r => {
            if (r.risposta !== '[Completato]' && r.risposta !== '[Abbandonato]') {
                const currentMax = map[r.storyId] || 0;
                if (r.sceneIndex + 1 > currentMax) map[r.storyId] = r.sceneIndex + 1;
            }
        });
        return map;
    }, [responses]);

    // ── Emozioni attive (unione dinamica target + selezionate) ───────────────
    const activeEmotions = useMemo(() => {
        const set = new Set();
        responses.forEach(r => {
            if (r.risposta === '[Completato]' || r.risposta === '[Abbandonato]') return;
            if (r.tipo === 'libera') return;
            const target   = getTargetEmotion(r);
            const selected = getSelectedEmotion(r);
            if (target   && target   !== 'Altro') set.add(target);
            if (selected && selected !== 'Altro') set.add(selected);
        });
        const list        = Array.from(set).filter(e => e && e !== 'Altro');
        const basePresent = BASE_EMOTIONS.filter(e => list.includes(e));
        const others      = list.filter(e => !BASE_EMOTIONS.includes(e)).sort();
        const combined    = [...basePresent, ...others];
        return combined.length > 0 ? combined : BASE_EMOTIONS;
    }, [responses, getTargetEmotion, getSelectedEmotion]);

    // ── Sessioni derivate (con tempi di esitazione calcolati) ────────────────
    const allSessionsList = useMemo(() => {
        const sortedAllResps = [...responses].sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt));
        const sessionsMap    = {};
        let lastSessionIdMap = {};

        sortedAllResps.forEach(r => {
            let sid = r.sessionId;
            const playedAtTime = new Date(r.playedAt).getTime();

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
                sessionsMap[sid] = { sessionId: sid, storyId: r.storyId, playedAt: r.playedAt, responses: [] };
            }
            sessionsMap[sid].responses.push(r);
        });

        const list = Object.values(sessionsMap).map(session => {
            const hasCompletedPlaceholder = session.responses.some(r => r.risposta === '[Completato]');
            const hasAbandonedPlaceholder = session.responses.some(r => r.risposta === '[Abbandonato]');
            const cleanResponses = session.responses.filter(
                r => r.risposta !== '[Completato]' && r.risposta !== '[Abbandonato]'
            );
            const sortedResponses = [...cleanResponses]
                .sort((a, b) => a.sceneIndex - b.sceneIndex)
                .map(r => ({ ...r }));

            sortedResponses.forEach((resp, idx) => {
                const startTime = getSessionStartTime(resp.sessionId);
                if (idx === 0 && startTime) {
                    const diff = new Date(resp.playedAt).getTime() - startTime;
                    resp.calculatedHesitation = diff > 0 && diff < 180000 ? diff : 3800;
                } else if (idx === 0) {
                    resp.calculatedHesitation = 3800;
                } else {
                    const diff = new Date(resp.playedAt).getTime() - new Date(sortedResponses[idx - 1].playedAt).getTime();
                    resp.calculatedHesitation = diff > 0 && diff < 240000 ? diff : 5000;
                }
            });

            const correctCount    = sortedResponses.filter(r => r.isCorretta === true).length;
            const accuracy        = sortedResponses.length > 0 ? Math.round((correctCount / sortedResponses.length) * 100) : 0;
            const totalScore      = sortedResponses.reduce((sum, r) => sum + (r.score || 0), 0);
            const avgHesitation   = sortedResponses.length > 0
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

    // ── Filtra sessioni per periodo ──────────────────────────────────────────
    const sessionsList = useMemo(() => {
        const now          = new Date();
        const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        let customStartDate = null;
        let customEndDate   = null;
        if (dateFilter === 'custom' && customStart && customEnd) {
            customStartDate = new Date(customStart);
            customEndDate   = new Date(customEnd);
            customEndDate.setHours(23, 59, 59, 999);
        }

        return allSessionsList.filter(s => {
            const playedAt = new Date(s.playedAt);
            if (dateFilter === 'today')  return playedAt >= startOfDay;
            if (dateFilter === 'week')   return playedAt >= startOfWeek;
            if (dateFilter === 'month')  return playedAt >= startOfMonth;
            if (dateFilter === 'custom' && customStartDate && customEndDate) {
                return playedAt >= customStartDate && playedAt <= customEndDate;
            }
            return true;
        });
    }, [allSessionsList, dateFilter, customStart, customEnd]);

    // ── Risposte filtrate derivate dalle sessioni filtrate ───────────────────
    const filteredResponses = useMemo(() => sessionsList.flatMap(s => s.responses), [sessionsList]);

    // ── Gruppi per EmoGame ───────────────────────────────────────────────────
    const storyGroups = useMemo(() => {
        const groups = {};
        sessionsList.forEach(session => {
            if (!groups[session.storyId]) {
                groups[session.storyId] = { storyId: session.storyId, sessions: [], lastActivity: session.playedAt };
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

    // ── KPI Clinici ──────────────────────────────────────────────────────────
    const clinicalKPIs = useMemo(() => {
        const totalAnswers   = filteredResponses.length;
        const correctAnswers = filteredResponses.filter(r => r.isCorretta === true).length;
        const globalAccuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

        const allFlatResponses = sessionsList.flatMap(s => s.responses);
        const allHesitations   = allFlatResponses.map(r => r.calculatedHesitation || 3800);
        const avgHesitation    = allHesitations.length > 0
            ? (allHesitations.reduce((a, b) => a + b, 0) / allHesitations.length / 1000).toFixed(1)
            : '0.0';

        const sec = parseFloat(avgHesitation);
        const cognitiveLoadLabel = allHesitations.length === 0 ? 'N/A'
            : sec < 3.0 ? 'Basso' : sec < 5.5 ? 'Moderato' : 'Alto';

        const impulsiveResponses = allFlatResponses.filter(r => r.calculatedHesitation < 2500).length;
        const impulsivityIndex   = totalAnswers > 0 ? Math.round((impulsiveResponses / totalAnswers) * 100) : 0;

        const incompleteSessions = sessionsList.filter(s => {
            if (s.isCompleted) return false;
            if (s.isAbandoned) return true;
            const game           = emoGamesMap[s.storyId];
            const totalTestSlides = game
                ? (game.paragraphs?.filter(p => p.strangeStoryTest?.active === true)?.length || 0)
                : (expectedSlidesMap[s.storyId] || 0);
            return totalTestSlides > 0 && s.totalCount < totalTestSlides;
        }).length;
        const abandonmentRate = sessionsList.length > 0 ? Math.round((incompleteSessions / sessionsList.length) * 100) : 0;

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
        let worstRate    = 101;
        Object.entries(emoScores).forEach(([emo, data]) => {
            const rate = (data.correct / data.total) * 100;
            if (rate < worstRate && data.total > 0) { worstRate = rate; worstEmotion = emo; }
        });
        const formattedWorstEmotion = worstRate <= 100 ? `${worstEmotion} (${Math.round(worstRate)}%)` : 'Nessuna';

        return { globalAccuracy, avgHesitation, cognitiveLoadLabel, impulsivityIndex, abandonmentRate, worstEmotion: formattedWorstEmotion, totalAnswers };
    }, [filteredResponses, sessionsList, activeEmotions, getTargetEmotion, emoGamesMap, expectedSlidesMap]);

    // ── Aggregazione per livello di difficoltà ───────────────────────────────
    const levelAggregationData = useMemo(() => {
        const stats = {
            'DifI':   { correct: 0, total: 0, hesitationSum: 0, sessionCount: 0 },
            'DifII':  { correct: 0, total: 0, hesitationSum: 0, sessionCount: 0 },
            'DifIII': { correct: 0, total: 0, hesitationSum: 0, sessionCount: 0 }
        };
        sessionsList.forEach(s => {
            const diff = emoGamesMap[s.storyId]?.difficulty || allStories[s.storyId]?.difficulty || 'DifI';
            if (stats[diff]) {
                stats[diff].sessionCount++;
                s.responses.forEach(r => {
                    stats[diff].total++;
                    stats[diff].hesitationSum += r.calculatedHesitation || 3800;
                    if (r.isCorretta === true) stats[diff].correct++;
                });
            }
        });
        const labelsMap = { 'DifI': 'Livello I (Emoji)', 'DifII': 'Livello II (Immagini)', 'DifIII': 'Livello III (Video)' };
        return Object.entries(stats).map(([key, item]) => ({
            levelKey:      key,
            levelLabel:    labelsMap[key] || key,
            accuracy:      item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
            avgHesitation: item.total > 0 ? Number((item.hesitationSum / item.total / 1000).toFixed(1)) : 0,
            sessionCount:  item.sessionCount,
            totalAnswers:  item.total
        })).filter(item => item.totalAnswers > 0);
    }, [sessionsList, emoGamesMap, allStories]);

    // ── Profilo emotivo (accuratezza + esitazione per emozione) ─────────────
    const emotionProfileData = useMemo(() => {
        const emoStats = {};
        activeEmotions.forEach(e => { emoStats[e] = { correct: 0, total: 0, hesitationSum: 0 }; });
        sessionsList.forEach(s => {
            s.responses.forEach(r => {
                const emo = getTargetEmotion(r);
                if (emoStats[emo] !== undefined) {
                    emoStats[emo].total++;
                    emoStats[emo].hesitationSum += r.calculatedHesitation || 3800;
                    if (r.isCorretta === true) emoStats[emo].correct++;
                }
            });
        });
        return activeEmotions.map(emotion => {
            const item = emoStats[emotion];
            return {
                emotion,
                accuratezza: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
                esitazione:  item.total > 0 ? Number((item.hesitationSum / item.total / 1000).toFixed(1)) : 0,
                correct: item.correct,
                total:   item.total
            };
        }).filter(item => item.total > 0);
    }, [sessionsList, activeEmotions, getTargetEmotion]);

    // ── Curva di apprendimento (ultime 10 sessioni) ──────────────────────────
    const learningTimelineData = useMemo(() => {
        const formatDateLocal = (dateStr) => !dateStr ? 'N/A' : new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        const chronSessions  = [...sessionsList].sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt));
        return chronSessions.slice(-10).map((s, idx) => ({
            label:          `S${idx + 1}`,
            fullDate:       formatDateLocal(s.playedAt),
            accuracy:       s.accuracy,
            avgHesitation:  s.avgHesitation,
            correctCount:   s.correctCount,
            totalCount:     s.totalCount
        }));
    }, [sessionsList]);

    // ── Matrice di confusione ────────────────────────────────────────────────
    const confusionMatrix = useMemo(() => {
        const matrix = {};
        activeEmotions.forEach(t => {
            matrix[t] = {};
            activeEmotions.forEach(s => { matrix[t][s] = 0; });
        });
        filteredResponses.forEach(r => {
            if (r.tipo === 'libera' || !r.risposta) return;
            if (r.risposta === '[Completato]' || r.risposta === '[Abbandonato]') return;
            const target = getTargetEmotion(r);
            if (!target || target === 'Altro' || !matrix[target]) return;
            const selected = getSelectedEmotion(r);
            if (selected && selected !== 'Altro' && matrix[target][selected] !== undefined) {
                matrix[target][selected]++;
            }
        });
        return matrix;
    }, [filteredResponses, activeEmotions, getTargetEmotion, getSelectedEmotion]);

    return {
        // Stato grezzo
        loading,
        responses,
        // Filtri (esposti per il controllo UI)
        dateFilter, setDateFilter,
        customStart, setCustomStart,
        customEnd,   setCustomEnd,
        // Dati derivati pronti per la UI
        sessionsList,
        filteredResponses,
        storyGroups,
        activeEmotions,
        clinicalKPIs,
        levelAggregationData,
        emotionProfileData,
        learningTimelineData,
        confusionMatrix,
        // Azione manuale di refresh
        loadData
    };
};
