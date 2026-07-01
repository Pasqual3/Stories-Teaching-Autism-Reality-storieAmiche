/**
 * Algoritmo: Calcolo Indice di Stress
 * Modello Baseline Deviation (Z-score semplificato)
 */

export const calculateStressIndex = (sessionData, baseline) => {
    const hasBaseline = baseline && baseline.totalCalibrationSessions >= 3;

    if (!hasBaseline) {
        // Senza baseline: soglie assolute conservative
        const rageClickRatio = sessionData.totalRageClicks / Math.max(sessionData.totalSlides, 1);
        const missClickRatio = sessionData.totalMissClicks / Math.max(sessionData.totalClicks, 1);

        let score = 0;
        score += Math.min(rageClickRatio * 20, 40);
        score += Math.min(missClickRatio * 30, 30);
        score += Math.min(sessionData.totalPageReversals * 5, 30);

        return {
            stressIndex: Math.round(Math.min(score, 100)),
            breakdown: {
                clickDeviation: 0,
                timeDeviation: 0,
                rageClickFactor: Math.min(rageClickRatio * 20, 40),
                reversalFactor: Math.min(sessionData.totalPageReversals * 5, 30)
            }
        };
    }

    // Con baseline: calcolo deviazione percentuale
    const avgClicksPerSlide = sessionData.totalClicks / Math.max(sessionData.totalSlides, 1);
    const avgTimePerSlide = sessionData.totalDuration / Math.max(sessionData.totalSlides, 1);

    const clickDeviation = baseline.avgClicksPerSlide > 0
        ? ((avgClicksPerSlide - baseline.avgClicksPerSlide) / baseline.avgClicksPerSlide) * 100
        : 0;

    const timeDeviation = baseline.avgTimePerSlide > 0
        ? ((avgTimePerSlide - baseline.avgTimePerSlide) / baseline.avgTimePerSlide) * 100
        : 0;

    const rageClickFactor = Math.min(sessionData.totalRageClicks * 10, 40);
    const reversalFactor = Math.min(sessionData.totalPageReversals * 5, 20);

    let score = 0;
    if (clickDeviation > 0) score += Math.min((clickDeviation / 300) * 30, 30);
    if (timeDeviation > 0) score += Math.min((timeDeviation / 150) * 15, 15);
    score += rageClickFactor;
    score += reversalFactor;

    return {
        stressIndex: Math.round(Math.min(score, 100)),
        breakdown: {
            clickDeviation: Math.round(clickDeviation),
            timeDeviation: Math.round(timeDeviation),
            rageClickFactor,
            reversalFactor
        }
    };
};

export const getStressLevel = (index) => {
    if (index < 20) return 'calm';
    if (index < 45) return 'mild';
    if (index < 70) return 'moderate';
    return 'high';
};

export const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
};