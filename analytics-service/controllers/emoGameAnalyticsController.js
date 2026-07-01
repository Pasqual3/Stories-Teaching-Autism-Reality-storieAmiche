import EmoGameResponse from '../models/emoGameResponseModel.js';
import { verifyTherapistChildAccess } from '../services/userService.js';
import { sendLog } from '../utils/logger.js';

/**
 * Salva la singola interazione (risposta) del bambino in EmoGame.
 * Effettua un upsert per evitare duplicati in caso di reinvio dello stesso step.
 */
export const saveEmoGameResponse = async (req, res) => {
    try {
        const {
            childId,
            storyId,
            parentId,
            sessionId,
            sceneIndex,
            targetEmotion,
            selectedEmotion,
            questionMode,
            levelOfAbstraction,
            hesitationTime,
            score,
            isCorrect
        } = req.body;

        // Validazione minima
        if (
            !childId || 
            !storyId || 
            !parentId || 
            !sessionId || 
            sceneIndex === undefined || 
            !targetEmotion || 
            !selectedEmotion || 
            !questionMode || 
            !levelOfAbstraction || 
            hesitationTime === undefined || 
            score === undefined || 
            isCorrect === undefined
        ) {
            return res.status(400).json({ 
                success: false, 
                message: 'Campi obbligatori mancanti per il tracciamento dell\'interazione EmoGame' 
            });
        }

        // Gestione Upsert su sessionId, storyId, sceneIndex
        let response = await EmoGameResponse.findOne({ sessionId, storyId, sceneIndex });

        if (response) {
            response.targetEmotion = targetEmotion;
            response.selectedEmotion = selectedEmotion;
            response.questionMode = questionMode;
            response.levelOfAbstraction = levelOfAbstraction;
            response.hesitationTime = hesitationTime;
            response.score = score;
            response.isCorrect = isCorrect;
            response.playedAt = new Date();
            
            await response.save();
            await sendLog('info', `Risposta EmoGame aggiornata: sessione ${sessionId}, scena ${sceneIndex}`);
            return res.json({ success: true, response, updated: true });
        }

        response = new EmoGameResponse({
            childId,
            storyId,
            parentId,
            sessionId,
            sceneIndex,
            targetEmotion,
            selectedEmotion,
            questionMode,
            levelOfAbstraction,
            hesitationTime,
            score,
            isCorrect
        });

        await response.save();
        await sendLog('info', `Nuova risposta EmoGame salvata: sessione ${sessionId}, scena ${sceneIndex}`);
        res.status(201).json({ success: true, response });

    } catch (error) {
        console.error('❌ Errore salvataggio risposta EmoGame:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Raggruppa e aggrega i dati dell'EmoGame per restituire i KPI clinici al terapista.
 */
export const getEmoGameAnalytics = async (req, res) => {
    try {
        const { therapistId, childId } = req.params;
        const token = req.cookies.token;

        await sendLog('info', `Richiesta analytics EmoGame per bambino ${childId} da parte del terapeuta ${therapistId}`);

        // Verifica accesso terapista-bambino
        const accessCheck = await verifyTherapistChildAccess(therapistId, childId, token);
        if (!accessCheck.success) {
            return res.status(403).json({
                success: false,
                message: 'Non hai i permessi per visualizzare questo bambino'
            });
        }

        // Recupera tutte le risposte in ordine cronologico
        const responses = await EmoGameResponse.find({ childId }).sort({ playedAt: 1 });

        const baseEmotions = ["Felicità", "Tristezza", "Rabbia", "Paura", "Sorpresa", "Disgusto"];

        if (!responses || responses.length === 0) {
            return res.json({
                success: true,
                message: 'Nessun dato registrato per la modalità EmoGame per questo bambino',
                data: {
                    scoreTrend: [],
                    recognitionRates: baseEmotions.reduce((acc, emotion) => {
                        acc[emotion] = 0;
                        return acc;
                    }, {}),
                    communicationGap: {
                        ricettiva: 0,
                        espressiva: 0
                    },
                    confusionMatrix: {},
                    temporalEvolution: []
                }
            });
        }

        // 1. Raggruppa per sessione per calcolare andamento e evoluzione temporale
        const sessionMap = {};
        responses.forEach(r => {
            const sId = r.sessionId;
            if (!sessionMap[sId]) {
                sessionMap[sId] = {
                    sessionId: sId,
                    storyId: r.storyId,
                    playedAt: r.playedAt,
                    responses: []
                };
            }
            sessionMap[sId].responses.push(r);
            if (r.playedAt > sessionMap[sId].playedAt) {
                sessionMap[sId].playedAt = r.playedAt;
            }
        });

        const sortedSessions = Object.values(sessionMap).sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt));

        // KPI 1: Andamento dei punteggi (evoluzione e media nel tempo)
        const scoreTrend = sortedSessions.map(s => {
            const totalScore = s.responses.reduce((sum, r) => sum + r.score, 0);
            const averageScore = s.responses.length > 0 ? (totalScore / s.responses.length) : 0;
            return {
                sessionId: s.sessionId,
                storyId: s.storyId,
                playedAt: s.playedAt,
                totalScore,
                averageScore: Number(averageScore.toFixed(2)),
                questionCount: s.responses.length
            };
        });

        // KPI 5: Evoluzione temporale (trend dei tassi di successo)
        const temporalEvolution = sortedSessions.map(s => {
            const correctCount = s.responses.filter(r => r.isCorrect).length;
            const successRate = s.responses.length > 0 ? (correctCount / s.responses.length) * 100 : 0;
            return {
                sessionId: s.sessionId,
                playedAt: s.playedAt,
                successRate: Number(successRate.toFixed(2)),
                totalQuestions: s.responses.length
            };
        });

        // KPI 2: Tassi di riconoscimento (successo isolato per ciascuna delle 6 emozioni)
        const recognitionRatesData = {};
        baseEmotions.forEach(e => {
            recognitionRatesData[e] = { correct: 0, total: 0 };
        });

        responses.forEach(r => {
            const emotionNormalized = baseEmotions.find(e => e.toLowerCase() === r.targetEmotion.toLowerCase());
            
            // Registriamo solo le emozioni riconosciute come base o gestite
            const emotionKey = emotionNormalized || r.targetEmotion;
            
            if (!recognitionRatesData[emotionKey]) {
                recognitionRatesData[emotionKey] = { correct: 0, total: 0 };
            }
            
            recognitionRatesData[emotionKey].total++;
            if (r.isCorrect) {
                recognitionRatesData[emotionKey].correct++;
            }
        });

        const recognitionRates = {};
        Object.keys(recognitionRatesData).forEach(e => {
            const item = recognitionRatesData[e];
            recognitionRates[e] = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
        });

        // KPI 3: Gap comunicativo (ricettivo vs espressivo)
        const commGapData = {
            ricettiva: { correct: 0, total: 0 },
            espressiva: { correct: 0, total: 0 }
        };

        responses.forEach(r => {
            const mode = r.questionMode?.toLowerCase(); // 'ricettiva' o 'espressiva'
            if (commGapData[mode]) {
                commGapData[mode].total++;
                if (r.isCorrect) {
                    commGapData[mode].correct++;
                }
            }
        });

        const communicationGap = {
            ricettiva: commGapData.ricettiva.total > 0 ? Math.round((commGapData.ricettiva.correct / commGapData.ricettiva.total) * 100) : 0,
            espressiva: commGapData.espressiva.total > 0 ? Math.round((commGapData.espressiva.correct / commGapData.espressiva.total) * 100) : 0
        };

        // KPI 4: Matrice di confusione / Error mapping (mappatura degli errori più frequenti)
        const confusionMatrix = {};
        responses.forEach(r => {
            if (!r.isCorrect) {
                // Selezioniamo e normalizziamo le chiavi delle emozioni per accuratezza clinica
                const target = baseEmotions.find(e => e.toLowerCase() === r.targetEmotion.toLowerCase()) || r.targetEmotion;
                const selected = baseEmotions.find(e => e.toLowerCase() === r.selectedEmotion.toLowerCase()) || r.selectedEmotion;

                if (!confusionMatrix[target]) {
                    confusionMatrix[target] = {};
                }
                if (!confusionMatrix[target][selected]) {
                    confusionMatrix[target][selected] = 0;
                }
                confusionMatrix[target][selected]++;
            }
        });

        res.json({
            success: true,
            data: {
                scoreTrend,
                recognitionRates,
                communicationGap,
                confusionMatrix,
                temporalEvolution
            }
        });

    } catch (error) {
        await sendLog('error', 'Errore recupero analytics EmoGame', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: error.message });
    }
};
