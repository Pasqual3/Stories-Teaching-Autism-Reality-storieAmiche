/**
 * useSessionTracker.js
 * Hook React per il tracciamento comportamentale del bambino
 *
 * CLICK TYPES:
 * - totalClicks:       tutti i click (contatore generale)
 * - totalMissClicks:   click su aree vuote/non interattive (niente button/a/input ecc.)
 *                      → indica confusione, frustrazione o ricerca di elementi
 * - totalRandomClicks: click su elementi interattivi NON pertinenti alla storia
 *                      (nav, avatar, dropdown, breadcrumb ecc.) — click "a caso"
 *                      su cose cliccabili ma non collegate all'avanzamento della storia
 * - totalRageClicks:   3+ click in meno di 1 secondo nella stessa area → frustrazione/impazienza
 */

import { useEffect, useRef, useCallback } from 'react';

const GATEWAY_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
    return 'desktop';
};

// Selettori degli elementi "di storia" — click qui sono intenzionali
const STORY_INTERACTIVE_SELECTORS = [
    'button[data-story-nav]',   // bottoni next/prev della storia (aggiungi data-story-nav="true")
    '[data-story-action]',       // qualsiasi elemento azione storia
    'audio',
    'video',
    '.story-word',               // parole cliccabili nella storia
    '.story-image',              // immagini storia
];

// Selettori degli elementi UI NON pertinenti alla storia
const NON_STORY_UI_SELECTORS = [
    'nav',
    '[data-navbar]',
    '.navbar',
    '[class*="navbar"]',
    '[data-dropdown]',
    '[data-avatar]',
];

const useSessionTracker = ({ childId, storyId, parentId, totalSlides, enabled = true, sessionType = 'strangeStory' }) => {

    const sessionStartTime = useRef(Date.now());
    const slideStartTime = useRef(Date.now());
    const firstClickTime = useRef(null);
    const hasFirstClick = useRef(false);

    const totalClicks = useRef(0);
    const totalMissClicks = useRef(0);       // click su aree vuote
    const totalRandomClicks = useRef(0);     // ✨ NUOVO: click su UI non pertinente
    const totalRageClicks = useRef(0);
    const totalPageReversals = useRef(0);
    const pageVisibilitySwitches = useRef(0); // ✨ NUOVO: cambi di tab/finestra
    const hesitationTimes = useRef([]);

    // ✨ REF per totalSlides: evita di ricaricare l'effetto cleanup quando cambia da 0 a N
    const totalSlidesRef = useRef(totalSlides);
    useEffect(() => {
        if (totalSlides > 0) {
            totalSlidesRef.current = totalSlides;
        }
    }, [totalSlides]);

    const slideDataMap = useRef({});
    const currentSlideRef = useRef(0);

    // Rage click tracking
    const recentClicks = useRef([]);
    const RAGE_CLICK_THRESHOLD = 3;
    const RAGE_CLICK_WINDOW = 1000;

    // Rage click position tracking (per distinguere rage click localizzati)
    const recentClickPositions = useRef([]);
    const RAGE_AREA_RADIUS = 60; // px — se i click sono entro 60px, sono nello stesso posto

    const hasSent = useRef(false);



    const initSlide = (slideIndex) => {
        if (!slideDataMap.current[slideIndex]) {
            slideDataMap.current[slideIndex] = {
                slideIndex,
                timeSpent: 0,
                clicks: 0,
                missClicks: 0,
                randomClicks: 0,
                rageClicks: 0,
                hesitationTime: 0,
                dwellTime: 0,
                pageVisibilitySwitches: 0,
                reversedFrom: false
            };
        }
    };

    const onSlideChange = useCallback((newSlideIndex, direction) => {
        if (!enabled) {
            return;
        }

        const prevSlide = currentSlideRef.current;
        const timeOnSlide = Math.round((Date.now() - slideStartTime.current) / 1000);

        initSlide(prevSlide);
        slideDataMap.current[prevSlide].timeSpent = timeOnSlide;

        if (direction === 'prev') {
            totalPageReversals.current += 1;
            initSlide(prevSlide);
            slideDataMap.current[prevSlide].reversedFrom = true;
        }

        currentSlideRef.current = newSlideIndex;
        slideStartTime.current = Date.now();
        firstClickTime.current = null;
        hasFirstClick.current = false;

        // Reset rage click buffer al cambio slide
        recentClicks.current = [];
        recentClickPositions.current = [];

        initSlide(newSlideIndex);
    }, [enabled]);

    const buildPayload = useCallback((lastSlideReached, isCompleted = false) => {
        const timeOnLastSlide = Math.round((Date.now() - slideStartTime.current) / 1000);
        initSlide(currentSlideRef.current);
        slideDataMap.current[currentSlideRef.current].timeSpent = timeOnLastSlide;

        const totalDuration = Math.round((Date.now() - sessionStartTime.current) / 1000);
        const avgHesitationTime = hesitationTimes.current.length > 0
            ? Math.round(hesitationTimes.current.reduce((a, b) => a + b, 0) / hesitationTimes.current.length)
            : 0;

        const payload = {
            childId,
            storyId,
            parentId,
            deviceType: getDeviceType(),
            totalSlides: totalSlidesRef.current,
            lastSlideReached,
            totalClicks: totalClicks.current,
            totalMissClicks: totalMissClicks.current,
            totalRandomClicks: totalRandomClicks.current,   // ✨ NUOVO
            totalRageClicks: totalRageClicks.current,
            totalPageReversals: totalPageReversals.current,
            pageVisibilitySwitches: pageVisibilitySwitches.current, // ✨ NUOVO
            avgHesitationTime,
            totalDuration,
            slideData: Object.values(slideDataMap.current),
            completedStory: isCompleted,
            sessionType
        };


        return payload;
    }, [childId, storyId, parentId]); // rimosso totalSlides dalle dipendenze

    const sendSession = useCallback((payload) => {
        if (hasSent.current) {
            return;
        }

        // VALIDAZIONE: Non inviare se non abbiamo slide caricate (evita errore 400)
        if (!payload.totalSlides || payload.totalSlides < 1) {
            return;
        }

        hasSent.current = true;

        // Salva in localStorage come backup
        localStorage.setItem('pendingAnalyticsSession', JSON.stringify({
            payload,
            timestamp: Date.now()
        }));

        // INVIO ASINCRONO — NON BLOCCA
        (async () => {
            try {
                const response = await fetch(`${GATEWAY_URL}/api/analytics/session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });

                if (response.ok) {
                    localStorage.removeItem('pendingAnalyticsSession');
                    return;
                }

                const errorText = await response.text();
                throw new Error(`Gateway error ${response.status}: ${errorText}`);

            } catch (gatewayError) {
                // Fail silently or handle with telemetry
            }
        })();
    }, []);

    const endSession = useCallback((lastSlideReached, isCompleted = false) => {
        if (!enabled || !childId || !storyId || !parentId) {
            return;
        }

        if (hasSent.current) {
            return;
        }

        const payload = buildPayload(lastSlideReached, isCompleted);
        sendSession(payload);
    }, [enabled, childId, storyId, parentId, buildPayload, sendSession]);

    // RETRY PENDING ALL'AVVIO
    useEffect(() => {
        const pending = localStorage.getItem('pendingAnalyticsSession');
        if (!pending) return;

        const { payload, timestamp } = JSON.parse(pending);
        const isRecent = (Date.now() - timestamp) < 24 * 60 * 60 * 1000;

        if (!isRecent) {
            localStorage.removeItem('pendingAnalyticsSession');
            return;
        }

        fetch(`${GATEWAY_URL}/api/analytics/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        }).then(res => {
            if (res.ok) {
                localStorage.removeItem('pendingAnalyticsSession');
            } else if (res.status === 400) {
                localStorage.removeItem('pendingAnalyticsSession');
            }
        }).catch(() => {
            // Retry later
        });
    }, []);

    // LISTENER CLICK
    useEffect(() => {
        if (!enabled) {
            return;
        }

        initSlide(0);
        slideStartTime.current = Date.now();
        sessionStartTime.current = Date.now();

        const handleClick = (e) => {
            const now = Date.now();
            const slideIndex = currentSlideRef.current;
            initSlide(slideIndex);

            // --- HESITATION (primo click per slide) ---
            if (!hasFirstClick.current) {
                const hesitation = now - slideStartTime.current;
                hesitationTimes.current.push(hesitation);
                slideDataMap.current[slideIndex].hesitationTime = hesitation;
                hasFirstClick.current = true;
            }

            totalClicks.current += 1;
            slideDataMap.current[slideIndex].clicks += 1;

            const target = e.target;
            const x = e.clientX;
            const y = e.clientY;

            // --- CLASSIFICAZIONE DEL CLICK ---
            const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], audio, video');

            if (!isInteractive) {
                // MISS CLICK: click su area completamente vuota / non cliccabile
                totalMissClicks.current += 1;
                slideDataMap.current[slideIndex].missClicks += 1;
            } else {
                // È cliccabile, ma è un elemento UI non pertinente alla storia?
                const isNonStoryUI = NON_STORY_UI_SELECTORS.some(sel => target.closest(sel));
                if (isNonStoryUI) {
                    totalRandomClicks.current += 1;
                    slideDataMap.current[slideIndex].randomClicks += 1;
                }
            }

            // --- RAGE CLICK DETECTION ---
            // Considera sia la frequenza temporale che la vicinanza spaziale
            recentClicks.current.push(now);
            recentClickPositions.current.push({ x, y, t: now });

            // Pulisci vecchi click fuori dalla finestra temporale
            recentClicks.current = recentClicks.current.filter(t => now - t < RAGE_CLICK_WINDOW);
            recentClickPositions.current = recentClickPositions.current.filter(p => now - p.t < RAGE_CLICK_WINDOW);

            if (recentClicks.current.length >= RAGE_CLICK_THRESHOLD) {
                // Verifica se i click sono nello stesso posto (rage click localizzato)
                const positions = recentClickPositions.current;
                const isLocalized = positions.every(p =>
                    Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) <= RAGE_AREA_RADIUS
                );

                totalRageClicks.current += 1;
                slideDataMap.current[slideIndex].rageClicks += 1;
                recentClicks.current = [];
                recentClickPositions.current = [];
            }
        };

        let dwellTimer = null;
        const handleMouseEnter = (e) => {
            if (e.target.tagName === 'IMG') {
                dwellTimer = setInterval(() => {
                    const slideIndex = currentSlideRef.current;
                    initSlide(slideIndex);
                    slideDataMap.current[slideIndex].dwellTime += 500;
                }, 500);
            }
        };

        const handleMouseLeave = (e) => {
            if (e.target.tagName === 'IMG') {
                clearInterval(dwellTimer);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // L'utente ha cambiato scheda o minimizzato
                pageVisibilitySwitches.current += 1;

                const slideIndex = currentSlideRef.current;
                initSlide(slideIndex);
                slideDataMap.current[slideIndex].pageVisibilitySwitches += 1;
            }
        };

        document.addEventListener('click', handleClick);
        document.addEventListener('mouseenter', handleMouseEnter, true);
        document.addEventListener('mouseleave', handleMouseLeave, true);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('mouseenter', handleMouseEnter, true);
            document.removeEventListener('mouseleave', handleMouseLeave, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(dwellTimer);
        };
    }, [enabled]);

    // ✨ SALVATAGGIO IN USCITA IMPROVVISA (Safe Exit)
    useEffect(() => {
        return () => {
            if (enabled && childId && storyId && !hasSent.current) {
                const payload = buildPayload(currentSlideRef.current, false);
                sendSession(payload);
            }
        };
    }, [enabled, childId, storyId, buildPayload, sendSession]);

    return { onSlideChange, endSession };
};

export default useSessionTracker;