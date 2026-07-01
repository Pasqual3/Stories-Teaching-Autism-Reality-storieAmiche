// src/hooks/useGameTracker.js
import { useEffect, useRef, useCallback } from 'react';

const GATEWAY_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const useGameTracker = ({ childId, gameType, storyId, enabled = true }) => {
    const sessionStartTime = useRef(Date.now());
    const moveStartTime = useRef(Date.now());
    const totalMoves = useRef(0);
    const correctMoves = useRef(0);
    const wrongMoves = useRef(0);
    const hesitationTimes = useRef([]);
    const totalClicks = useRef(0);
    const rageClicks = useRef(0);
    const recentClicks = useRef([]);
    const moves = useRef([]); // ✨ NUOVO: Dettaglio mosse
    const hasFirstMove = useRef(false);
    const hasSent = useRef(false);

    const RAGE_CLICK_WINDOW = 1000;
    const RAGE_CLICK_THRESHOLD = 3;

    const initMove = () => {
        moveStartTime.current = Date.now();
        hasFirstMove.current = false;
    };

    const recordMove = useCallback((isCorrect, moveData = {}) => {
        if (!enabled) return;

        const now = Date.now();
        const moveDuration = now - moveStartTime.current;

        totalMoves.current += 1;
        if (isCorrect) correctMoves.current += 1;
        else wrongMoves.current += 1;

        // Registra mossa dettagliata
        moves.current.push({
            sceneIndex: moveData.sceneIndex !== undefined ? moveData.sceneIndex : totalMoves.current - 1,
            isCorrect,
            moveDuration,
            playedAt: new Date()
        });

        // Hesitation: tempo dal caricamento alla prima mossa
        if (!hasFirstMove.current) {
            hesitationTimes.current.push(moveDuration);
            hasFirstMove.current = true;
        }

        // Reset timer per la prossima mossa
        moveStartTime.current = now;

        console.log('🎮 Move recorded:', { isCorrect, moveDuration, ...moveData });
    }, [enabled]);

    const buildPayload = useCallback((isCompleted = false, finalScore = 0) => {
        const totalDuration = Math.round((Date.now() - sessionStartTime.current) / 1000);
        const avgHesitation = hesitationTimes.current.length > 0
            ? Math.round(hesitationTimes.current.reduce((a, b) => a + b, 0) / hesitationTimes.current.length)
            : 0;

        return {
            childId,
            storyId,
            gameType, // 'sequencing' | 'emotion_matching'
            totalMoves: totalMoves.current,
            correctMoves: correctMoves.current,
            wrongMoves: wrongMoves.current,
            accuracy: totalMoves.current > 0 ? Math.round((correctMoves.current / totalMoves.current) * 100) : 0,
            avgHesitationTime: avgHesitation,
            totalDuration,
            completed: isCompleted,
            finalScore,
            moves: moves.current, // ✨ Invia dettaglio mosse
            deviceType: /mobile|iphone|ipad|android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        };
    }, [childId, storyId, gameType]);

    const sendResults = useCallback((payload) => {
        if (hasSent.current) return;
        
        // ✨ VALIDAZIONE: Non salvare sessioni senza mosse (evita record vuoti)
        if (payload.totalMoves === 0) {
            console.log('ℹ️ Skipping game session: no moves recorded');
            return;
        }

        hasSent.current = true;

        localStorage.setItem('pendingGameSession', JSON.stringify({ payload, timestamp: Date.now() }));

        (async () => {
            try {
                const res = await fetch(`${GATEWAY_URL}/api/analytics/game`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include',
                    keepalive: true
                });
                if (res.ok) {
                    localStorage.removeItem('pendingGameSession');
                    console.log('✅ Game results saved');
                }
            } catch (err) {
                console.warn('⚠️ Failed to save game results:', err);
            }
        })();
    }, []);

    const endGame = useCallback((finalScore = 0) => {
        if (!enabled || !childId) return;
        const payload = buildPayload(true, finalScore);
        sendResults(payload);
    }, [enabled, childId, buildPayload, sendResults]);

    // Click tracking per rage click
    useEffect(() => {
        if (!enabled) return;

        const handleClick = () => {
            const now = Date.now();
            totalClicks.current += 1;
            recentClicks.current.push(now);
            recentClicks.current = recentClicks.current.filter(t => now - t < RAGE_CLICK_WINDOW);

            if (recentClicks.current.length >= RAGE_CLICK_THRESHOLD) {
                rageClicks.current += 1;
                recentClicks.current = [];
                console.log('😤 Rage click detected in game');
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [enabled]);

    // ✨ SALVATAGGIO IN USCITA IMPROVVISA (Safe Exit)
    useEffect(() => {
        return () => {
            if (enabled && childId && storyId && !hasSent.current && totalMoves.current > 0) {
                console.log('🛡️ Uscita dai giochi rilevata, invio dati parziali...');
                const payload = buildPayload(false, 0); // Non completato
                sendResults(payload);
            }
        };
    }, [enabled, childId, storyId, buildPayload, sendResults]);

    return { recordMove, endGame, initMove };
};

export default useGameTracker;