import emoGameModel from "../../models/emoGameModel.js";

/**
 * GET /api/emoGame/:id/sessions/:childId
 * Restituisce tutte le sessioni di gioco di un bambino per un dato EmoGame.
 * Usato dal genitore per vedere il recap punteggi.
 */
export const getEmoGameSessions = async (req, res) => {
    try {
        const { id, childId } = req.params;

        const emoGame = await emoGameModel.findById(id);
        if (!emoGame) {
            return res.status(404).json({ success: false, message: 'EmoGame non trovato' });
        }

        // Filtra le sessioni per il bambino specifico
        const sessions = (emoGame.emotionGameSessions || [])
            .filter(s => s.childUserId === childId)
            .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));

        // Calcola il punteggio massimo possibile dall'EmoGame
        let maxPossibleScore = 0;
        for (const p of emoGame.paragraphs || []) {
            const opts = p.strangeStoryTest?.options || [];
            const correctOpt = opts.find(o => o.isCorrect === true);
            if (correctOpt && correctOpt.score != null) {
                maxPossibleScore += correctOpt.score;
            }
        }

        res.json({
            success: true,
            sessions,
            maxPossibleScore,
            totalQuestions: emoGame.paragraphs?.length || 0,
            emoGameTitle: emoGame.title
        });
    } catch (error) {
        console.error('Errore getEmoGameSessions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
