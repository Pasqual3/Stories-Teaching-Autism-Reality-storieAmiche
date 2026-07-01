import GameSession from '../models/gameSessionModel.js';
import { encrypt, decrypt, encryptNumber, decryptNumber, encryptJson, decryptJson } from '../utils/encryption.js';

// ---- SALVA SESSIONE DI GIOCO ----
export const recordGameSession = async (req, res) => {
    try {
        const {
            childId, storyId, gameType,
            totalMoves, correctMoves, wrongMoves,
            accuracy, avgHesitationTime, totalDuration,
            completed, finalScore, deviceType, moves
        } = req.body;

        // 🌟 SAFETY CHECK: Evita il crash se childId è undefined
        if (!childId) {
            return res.status(400).json({ 
                success: false, 
                message: "Errore di routing: ID Bambino (childId) mancante nel salvataggio del gioco." 
            });
        }

        // Evitiamo che l'accuratezza arrivi come NaN
        const safeAccuracy = isNaN(accuracy) ? 0 : Number(accuracy);

        const gameSession = new GameSession({
            childId:          encrypt(String(childId)),
            storyId,
            gameType,
            totalMoves:       Number(totalMoves) || 0,
            correctMoves:     Number(correctMoves) || 0,
            wrongMoves:       Number(wrongMoves) || 0,
            accuracy:         encryptNumber(safeAccuracy),
            avgHesitationTime: Number(avgHesitationTime) || 0,
            totalDuration:    Number(totalDuration) || 0,
            completed:        Boolean(completed),
            finalScore:       Number(finalScore) || 0,
            deviceType:       deviceType || 'desktop',
            moves:            encryptJson(moves || []),
            playedAt:         new Date()
        });

        await gameSession.save();
        res.status(201).json({ success: true, session: gameSession });
    } catch (error) {
        console.error("Errore salvataggio sessione di gioco:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- RECUPERA SESSIONI DI GIOCO DEL BAMBINO (Con Log Diagnostico) ----
export const getGameSessionsByChild = async (req, res) => {
    try {
        const { childId } = req.params;
        
        if (!childId) {
            return res.status(400).json({ success: false, message: "ID Bambino mancante." });
        }

        console.log("=== 🎮 DIAGNOSTICA DETTAGLI GIOCO ===");
        console.log("ID Cercato dal frontend (Aurora):", childId);

        // Carichiamo tutti i giochi dal DB
        const sessions = await GameSession.find({}).sort({ playedAt: -1 });
        console.log("Totale sessioni di gioco trovate nel DB:", sessions.length);

        const decrypted = [];

        sessions.forEach((s, idx) => {
            const obj = s.toObject();
            try {
                const decryptedChildId = decrypt(obj.childId);
                console.log(`Gioco #${idx + 1} - ID Decifrato nel DB:`, decryptedChildId);
                
                // Confronto sicuro rimuovendo spazi e forzando a stringa
                if (String(decryptedChildId).trim().toLowerCase() === String(childId).trim().toLowerCase()) {
                    decrypted.push({
                        ...obj,
                        childId:  decryptedChildId,
                        accuracy: Number(decryptNumber(obj.accuracy)) || 0,
                        moves:    decryptJson(obj.moves) || []
                    });
                }
            } catch (err) {
                console.warn(`⚠️ Errore decrittografia gioco #${idx + 1}:`, err.message);
                if (String(obj.childId).trim().toLowerCase() === String(childId).trim().toLowerCase()) {
                    decrypted.push({
                        ...obj,
                        childId: obj.childId,
                        accuracy: typeof obj.accuracy === 'number' ? obj.accuracy : 0,
                        moves: Array.isArray(obj.moves) ? obj.moves : []
                    });
                }
            }
        });

        console.log("Giochi corrispondenti filtrati:", decrypted.length);
        console.log("=====================================");

        res.json({ success: true, sessions: decrypted });
    } catch (error) {
        console.error("Errore getGameSessionsByChild:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};