/**
 * Genera insight clinici automatici basati sui dati delle sessioni
 */
export const usePatternAnalysis = (sessions, baseline) => {
    if (!sessions || sessions.length === 0) return [];

    const insights = [];
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const recentSessions = sortedSessions.slice(-5); // ultime 5
    const lastSession = sortedSessions[sortedSessions.length - 1];

    // 1. TREND STRESS INDEX
    if (sortedSessions.length >= 3) {
        const stressValues = sortedSessions.map(s => s.stressIndex);
        const avgRecent = stressValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const avgPrevious = stressValues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3 || avgRecent;

        const stressDelta = avgRecent - avgPrevious;
        if (stressDelta > 15) {
            insights.push({
                type: 'stress',
                severity: 'warning',
                title: 'Aumento significativo dello stress',
                description: `L'indice di stress è aumentato del ${Math.round(stressDelta)}% nelle ultime 3 sessioni rispetto alla media precedente. Considerare una valutazione del contesto ambientale o delle storie proposte.`
            });
        } else if (stressDelta < -15) {
            insights.push({
                type: 'stress',
                severity: 'positive',
                title: 'Riduzione dello stress',
                description: `Buon segno: l'indice di stress è diminuito del ${Math.round(Math.abs(stressDelta))}% nelle ultime sessioni. Il bambino sta mostrando maggiore tranquillità.`
            });
        }
    }

    // 2. RAGE CLICK PATTERN
    const rageClicksRecent = recentSessions.reduce((sum, s) => sum + (s.totalRageClicks || 0), 0);
    if (rageClicksRecent > 0) {
        const rageBySession = recentSessions.map(s => s.totalRageClicks || 0);
        const avgRage = rageBySession.reduce((a, b) => a + b, 0) / rageBySession.length;

        if (avgRage > 2) {
            insights.push({
                type: 'frustration',
                severity: 'critical',
                title: 'Pattern di frustrazione ricorrente',
                description: `Rilevati in media ${avgRage.toFixed(1)} rage click per sessione nelle ultime 5 attività. Questo indica frustrazione o impazienza persistente. Verificare la difficoltà delle storie proposte o la presenza di stimoli disturbanti.`
            });
        } else {
            insights.push({
                type: 'frustration',
                severity: 'warning',
                title: 'Segnali di frustrazione presenti',
                description: `Sono stati rilevati ${rageClicksRecent} rage click nelle ultime sessioni. Monitorare se si concentrano su slide specifiche (trigger identificabili).`
            });
        }
    }

    // 3. PAGE REVERSALS (ANSIA/Rassicurazione)
    const reversalsRecent = recentSessions.reduce((sum, s) => sum + (s.totalPageReversals || 0), 0);
    if (reversalsRecent > 3) {
        insights.push({
            type: 'anxiety',
            severity: 'warning',
            title: 'Comportamento di rassicurazione frequente',
            description: `${reversalsRecent} inversioni di pagina rilevate recentemente. Il bambino torna frequentemente indietro, possibile indicatore di ansia o bisogno di rivedere contenuti per sentirsi sicuro.`
        });
    }

    // 4. COMPLETAMENTO STORIE
    const completionRates = sortedSessions.map(s => s.completionRate || 0);
    const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

    if (avgCompletion < 50) {
        insights.push({
            type: 'engagement',
            severity: 'warning',
            title: 'Basso tasso di completamento',
            description: `Il bambino completa in media solo il ${Math.round(avgCompletion)}% delle storie. Le storie potrebbero essere troppo lunghe o poco coinvolgenti. Valutare storie più brevi o con contenuti più adatti ai suoi interessi.`
        });
    } else if (avgCompletion > 85) {
        insights.push({
            type: 'engagement',
            severity: 'positive',
            title: 'Eccellente coinvolgimento',
            description: `Tasso di completamento medio del ${Math.round(avgCompletion)}%. Il bambino mostra alta attenzione e persistenza nelle attività proposte.`
        });
    }

    // 5. ANALISI TEMPORALE (FASCIA ORARIA)
    const hourGroups = { morning: [], afternoon: [], evening: [] };
    sortedSessions.forEach(s => {
        const hour = new Date(s.createdAt).getHours();
        if (hour >= 6 && hour < 12) hourGroups.morning.push(s);
        else if (hour >= 12 && hour < 18) hourGroups.afternoon.push(s);
        else hourGroups.evening.push(s);
    });

    const avgStressByTime = {};
    Object.entries(hourGroups).forEach(([time, sess]) => {
        if (sess.length > 0) {
            avgStressByTime[time] = sess.reduce((sum, s) => sum + s.stressIndex, 0) / sess.length;
        }
    });

    const timeEntries = Object.entries(avgStressByTime);
    if (timeEntries.length > 1) {
        const maxStressTime = timeEntries.reduce((a, b) => a[1] > b[1] ? a : b);
        const minStressTime = timeEntries.reduce((a, b) => a[1] < b[1] ? a : b);

        if (maxStressTime[1] - minStressTime[1] > 20) {
            const timeLabels = { morning: 'mattina', afternoon: 'pomeriggio', evening: 'sera' };
            insights.push({
                type: 'temporal',
                severity: 'info',
                title: 'Pattern orario identificato',
                description: `Lo stress è significativamente più alto durante la ${timeLabels[maxStressTime[0]]} (${Math.round(maxStressTime[1])}/100) rispetto alla ${timeLabels[minStressTime[0]]} (${Math.round(minStressTime[1])}/100). Considerare programmare le sessioni più impegnative nella fascia più tranquilla.`
            });
        }
    }

    // 6. HESITATION TIME (PRIMO CLICK)
    const avgHesitation = sortedSessions.reduce((sum, s) => sum + (s.avgHesitationTime || 0), 0) / sortedSessions.length;
    if (avgHesitation > 5000) {
        insights.push({
            type: 'attention',
            severity: 'warning',
            title: 'Tempo di reazione elevato',
            description: `Il bambino impiega in media ${Math.round(avgHesitation / 1000)} secondi prima di interagire con una nuova slide. Questo potrebbe indicare difficoltà di elaborazione visiva o scarsa familiarità con l'interfaccia.`
        });
    }

    // 7. BASELINE DEVIATION (se disponibile)
    if (baseline && lastSession) {
        const baselineStress = baseline.avgStressIndex || baseline.stressIndex;
        if (baselineStress && lastSession.stressIndex > baselineStress * 1.5) {
            insights.push({
                type: 'baseline',
                severity: 'critical',
                title: 'Deviazione critica dalla baseline',
                description: `L'indice di stress dell'ultima sessione (${lastSession.stressIndex}) è superiore del 50% rispetto alla baseline stabilita (${baselineStress}). Richiede attenzione immediata.`
            });
        }
    }

    // 8. RANDOM CLICK (se disponibile)
    const totalRandom = sortedSessions.reduce((sum, s) => sum + (s.totalRandomClicks || 0), 0);
    const totalClicks = sortedSessions.reduce((sum, s) => sum + (s.totalClicks || 1), 0);
    const pertinenceRate = ((totalClicks - totalRandom) / totalClicks * 100).toFixed(1);

    if (pertinenceRate < 70) {
        insights.push({
            type: 'interaction',
            severity: 'info',
            title: 'Interazione non mirata',
            description: `Solo il ${pertinenceRate}% dei click sono pertinenti alla storia. Il bambino esplora elementi UI esterni (navbar, menu) o clicca aree vuote. Potrebbe indicare confusione o ricerca di stimoli.`
        });
    }

    return insights.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2, positive: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
};

export default usePatternAnalysis;