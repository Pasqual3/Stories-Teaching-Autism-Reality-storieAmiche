import StrangeStoryResponse from '../models/strangeStoryResponseModel.js';
import { encrypt, decrypt, encryptJson, decryptJson } from '../utils/encryption.js';

// Helper: decifra una risposta prima di inviarla al frontend
const decryptResponse = (obj) => ({
    ...obj,
    childId:   decrypt(obj.childId),
    risposta:  obj.risposta  ? decrypt(obj.risposta)  : obj.risposta,
    isCorretta: obj.isCorretta !== null && obj.isCorretta !== undefined
                    ? (decrypt(String(obj.isCorretta)) === 'true')
                    : null
    // targetEmotion e gameType NON sono cifrati: sono metadati clinici non sensibili
});

// Salva la risposta del bambino a una scena
export const saveResponse = async (req, res) => {
    try {
        const {
            childId, storyId, parentId, sessionId,
            sceneIndex, domanda, tipo,
            risposta, rispostaCorretta,
            rispostaImageUrl,
            isCorrettaPerOpzione,
            targetEmotion,  // ← NUOVO: nome emozione target della scena
            gameType        // ← NUOVO: 'emoGame' | '' per distinguere i tipi
        } = req.body;

        if (!childId) {
            return res.status(400).json({ 
                success: false, 
                message: "Errore di routing: ID Bambino (childId) mancante nel corpo della richiesta." 
            });
        }

        let isCorretta = null;
        if (tipo === 'libera') {
            isCorretta = null;
        } else if (isCorrettaPerOpzione !== undefined && isCorrettaPerOpzione !== null) {
            isCorretta = Boolean(isCorrettaPerOpzione);
        } else if (rispostaCorretta !== undefined && rispostaCorretta !== null && risposta !== undefined && risposta !== null) {
            const respStr = String(risposta).trim().toLowerCase();
            const corrStr = String(rispostaCorretta).trim().toLowerCase();
            isCorretta = respStr === corrStr;
        }

        const encryptedChildId = encrypt(String(childId));

        let existingResponse = null;
        if (sessionId) {
            existingResponse = await StrangeStoryResponse.findOne({ sessionId, sceneIndex });
        } else {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            existingResponse = await StrangeStoryResponse.findOne({
                childId: encryptedChildId, storyId, sceneIndex,
                playedAt: { $gte: oneHourAgo }
            });
        }

        if (existingResponse) {
            existingResponse.risposta         = risposta ? encrypt(String(risposta)) : '';
            existingResponse.rispostaImageUrl = rispostaImageUrl || '';
            existingResponse.isCorretta       = isCorretta !== null ? encrypt(String(isCorretta)) : null;
            existingResponse.playedAt         = new Date();
            // Aggiorna anche i nuovi campi se arrivano (upsert sicuro)
            if (targetEmotion) existingResponse.targetEmotion = String(targetEmotion).trim();
            if (gameType)      existingResponse.gameType      = String(gameType).trim();
            await existingResponse.save();
            return res.json({ success: true, response: decryptResponse(existingResponse.toObject()), updated: true });
        }

        const response = new StrangeStoryResponse({
            childId:          encryptedChildId,
            storyId, parentId, sessionId,
            sceneIndex, domanda, tipo,
            risposta:          risposta ? encrypt(String(risposta)) : '',
            rispostaImageUrl:  rispostaImageUrl || '',
            rispostaCorretta:  rispostaCorretta ? String(rispostaCorretta) : '',
            isCorretta:        isCorretta !== null ? encrypt(String(isCorretta)) : null,
            targetEmotion:     targetEmotion ? String(targetEmotion).trim() : '',
            gameType:          gameType      ? String(gameType).trim()      : ''
        });

        await response.save();
        res.status(201).json({ success: true, response: decryptResponse(response.toObject()) });
    } catch (error) {
        console.error('Errore salvataggio risposta nel microservizio:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Recupera tutte le risposte di un bambino (per il terapista)
export const getResponsesByChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const { storyId } = req.query;

        if (!childId) {
            return res.status(400).json({ success: false, message: "ID Bambino mancante." });
        }

        const query = { childId: encrypt(String(childId)) };
        if (storyId) query.storyId = storyId;

        const responses = await StrangeStoryResponse.find(query).sort({ playedAt: -1 });

        const decrypted = responses.map(r => decryptResponse(r.toObject()));

        res.json({ success: true, responses: decrypted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};