import storyModel from "../../models/storyModel.js";
import { logger } from '../../utils/logger.js';

/**
 * POST /api/story/:id/emotion-results
 * Salva i risultati di una partita al Gioco delle Emozioni.
 * Dati salvati nel sotto-documento `emotionGameSessions` della storia.
 * Usati dal terapeuta nella schermata Analytics.
 */
export const saveEmotionResults = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { results, score, total, playedAt } = req.body;

        if (!results || !Array.isArray(results)) {
            return res.json({ success: false, message: 'Dati risultati non validi' });
        }

        const story = await storyModel.findById(id);
        if (!story) {
            return res.json({ success: false, message: 'Storia non trovata' });
        }

        // Inizializza l'array se non esiste ancora
        if (!story.emotionGameSessions) {
            story.emotionGameSessions = [];
        }

        story.emotionGameSessions.push({
            childUserId: userId,
            playedAt: playedAt ? new Date(playedAt) : new Date(),
            score,
            total,
            results // [{ emotion, chosen, correct }]
        });

        // Manteniamo solo le ultime 50 sessioni per non far crescere il documento
        if (story.emotionGameSessions.length > 50) {
            story.emotionGameSessions = story.emotionGameSessions.slice(-50);
        }

        await story.save();

        logger.info("Risultati gioco emozioni salvati", { storyId: id, userId, score, total });
        res.json({ success: true, message: 'Risultati salvati' });

    } catch (error) {
        logger.error("Errore saveEmotionResults", { error: error.message });
        res.json({ success: false, message: 'Impossibile salvare i risultati' });
    }
};