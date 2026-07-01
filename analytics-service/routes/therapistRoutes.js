import express from 'express';
import {
    getTherapistChildren,
    getChildSessions,
    getChildNotes,
    createChildNote,
    deleteChildNote
} from '../controllers/therapistController.js';
import {
    validateTherapistId,
    validateChildAccess
} from '../middleware/validate.js';
import { userAuth } from '../middleware/userAuth.js';
import GameSession from '../models/gameSessionModel.js';
import StrangeStoryResponse from '../models/strangeStoryResponseModel.js';
import { decrypt, decryptNumber, decryptJson } from '../utils/encryption.js';

// ─── HELPER ────────────────────────────────────────────────────────────────────
// NOTA: encrypt() usa IV casuale → non si può usare per query MongoDB.
// Si deve caricare tutto e filtrare DOPO la decifratura in memoria (come gameController.js).

const decryptStrangeResponse = (obj) => ({
    ...obj,
    childId:    decrypt(obj.childId),
    risposta:   obj.risposta   ? decrypt(obj.risposta)   : obj.risposta,
    isCorretta: obj.isCorretta !== null && obj.isCorretta !== undefined
                    ? (decrypt(String(obj.isCorretta)) === 'true')
                    : null
});
// ───────────────────────────────────────────────────────────────────────────────

const router = express.Router();

router.get('/:therapistId/children', userAuth, validateTherapistId, getTherapistChildren);
router.get('/:therapistId/child/:childId/sessions', userAuth, validateChildAccess, getChildSessions);

// ─── GAME SESSIONS ─────────────────────────────────────────────────────────────
// Carica TUTTI i giochi e filtra in memoria dopo decrypt (IV casuale impedisce query diretta)
router.get('/:therapistId/child/:childId/game-sessions', userAuth, validateChildAccess, async (req, res) => {
    try {
        const { childId } = req.params;

        console.log(`🎮 [game-sessions] Richiesta per childId: ${childId}`);

        const all = await GameSession.find({}).sort({ playedAt: -1 });
        console.log(`🎮 [game-sessions] Totale record nel DB: ${all.length}`);

        const decrypted = [];
        for (const s of all) {
            const obj = s.toObject();
            try {
                const decryptedChildId = decrypt(obj.childId);
                if (String(decryptedChildId).trim() === String(childId).trim()) {
                    decrypted.push({
                        ...obj,
                        childId: decryptedChildId,
                        accuracy: Number(decryptNumber(obj.accuracy)) || 0,
                        moves:    decryptJson(obj.moves) || []
                    });
                }
            } catch (err) {
                console.warn(`⚠️ [game-sessions] Errore decrypt record: ${err.message}`);
                // Fallback: confronto diretto (record non cifrati)
                if (String(obj.childId).trim() === String(childId).trim()) {
                    decrypted.push({
                        ...obj,
                        accuracy: typeof obj.accuracy === 'number' ? obj.accuracy : 0,
                        moves: Array.isArray(obj.moves) ? obj.moves : []
                    });
                }
            }
        }

        console.log(`🎮 [game-sessions] Trovate ${decrypted.length} sessioni per childId: ${childId}`);
        res.json({ success: true, sessions: decrypted });
    } catch (error) {
        console.error('❌ [game-sessions] Errore:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── NOTE CLINICHE ─────────────────────────────────────────────────────────────
router.get('/:therapistId/child/:childId/notes', userAuth, validateChildAccess, getChildNotes);
router.post('/:therapistId/child/:childId/note', userAuth, validateChildAccess, createChildNote);
router.delete('/:therapistId/child/:childId/note/:noteId', userAuth, validateChildAccess, deleteChildNote);

// ─── STRANGE STORY RESPONSES ───────────────────────────────────────────────────
// Stessa logica: carica tutto e filtra in memoria dopo decrypt
router.get('/:therapistId/child/:childId/strange-story-responses', userAuth, validateChildAccess, async (req, res) => {
    try {
        const { childId } = req.params;
        const { gameType } = req.query;

        console.log(`🤔 [strange-stories] Richiesta per childId: ${childId}${gameType ? `, filtro gameType: ${gameType}` : ''}`);

        const all = await StrangeStoryResponse.find({}).sort({ playedAt: -1 });
        console.log(`🤔 [strange-stories] Totale record nel DB: ${all.length}`);

        const decrypted = [];
        for (const r of all) {
            const obj = r.toObject();
            try {
                const decryptedChildId = decrypt(obj.childId);
                if (String(decryptedChildId).trim() !== String(childId).trim()) continue;
                if (gameType && obj.gameType && obj.gameType !== gameType) continue;

                decrypted.push(decryptStrangeResponse(obj));
            } catch (err) {
                console.warn(`⚠️ [strange-stories] Errore decrypt record: ${err.message}`);
                if (String(obj.childId).trim() === String(childId).trim()) {
                    if (!gameType || !obj.gameType || obj.gameType === gameType) {
                        decrypted.push({ ...obj, childId: obj.childId, isCorretta: null });
                    }
                }
            }
        }

        console.log(`🤔 [strange-stories] Trovate ${decrypted.length} risposte per childId: ${childId}`);
        res.json({ success: true, responses: decrypted });
    } catch (error) {
        console.error('❌ [strange-stories] Errore:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;