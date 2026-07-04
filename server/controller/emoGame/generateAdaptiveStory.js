import { userModel } from "../../models/userModel.js";
import { generateAdaptiveStory as callAdaptiveStoryAI } from '../../utils/aiClient.js';
import { logger } from '../../utils/logger.js';

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:5007';

// Recupera stressIndex/stressLevel dall'ultima sessione del bambino.
// NOTA: il modello Baseline (GET /session/baseline/:childId) contiene solo
// medie comportamentali grezze (click, tempo, esitazione): NON ha stressIndex
// né stressLevel. Quei due campi sono calcolati e salvati per-sessione
// (Session.stressIndex/stressLevel, cifrati) e vengono decifrati e restituiti
// da GET /session/child/:childId — qui prendiamo la sessione più recente.
// Richiede sia x-internal-api-key sia il cookie JWT (userAuth), quindi
// forwardiamo il cookie della richiesta originale.
const fetchChildLastStress = async (childId, cookieHeader) => {
    try {
        const response = await fetch(`${ANALYTICS_SERVICE_URL}/session/child/${childId}?limit=1`, {
            method: 'GET',
            headers: {
                'x-internal-api-key': process.env.INTERNAL_API_KEY,
                ...(cookieHeader ? { cookie: cookieHeader } : {})
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (!data?.success || !Array.isArray(data.sessions) || data.sessions.length === 0) return null;

        const lastSession = data.sessions[0];
        const stressIndex = Number(lastSession.stressIndex);

        return {
            stressLevel: lastSession.stressLevel || null,
            stressIndex: Number.isFinite(stressIndex) ? stressIndex : null
        };
    } catch (error) {
        logger.warn("Impossibile recuperare stress bambino per narrazione adattiva", { error: error.message, childId });
        return null;
    }
};

export const generateAdaptiveStory = async (req, res) => {
    try {
        const userId = req.userId;
        const { childId, initialEmotion, topic } = req.body;

        if (!childId || !initialEmotion || !topic || !String(topic).trim()) {
            return res.json({ success: false, message: 'Bambino, emozione iniziale e argomento sono obbligatori' });
        }

        const user = await userModel.findById(userId);
        const child = user?.children?.id ? user.children.id(childId) : user?.children?.find(c => c._id.toString() === childId);
        const childName = child?.name || '';

        // Stress opzionale: se non disponibile (nessuna sessione precedente), si
        // procede comunque con un tono neutro — gestito lato Flask.
        const lastStress = await fetchChildLastStress(childId, req.headers.cookie);

        const aiResult = await callAdaptiveStoryAI({
            topic: String(topic).trim(),
            initialEmotion,
            childName,
            stressLevel: lastStress?.stressLevel || null,
            stressIndex: lastStress?.stressIndex ?? null
        });

        if (!aiResult?.success || !Array.isArray(aiResult.scenes) || aiResult.scenes.length === 0) {
            return res.json({ success: false, message: aiResult?.message || 'Impossibile generare la narrazione adattiva' });
        }

        res.json({
            success: true,
            scenes: aiResult.scenes,
            title: aiResult.title || '',
            description: aiResult.description || '',
            source: aiResult.source || 'ai'
        });

    } catch (error) {
        logger.error("Errore generateAdaptiveStory", { error: error.message, stack: error.stack });
        res.json({ success: false, message: 'Errore durante la generazione della narrazione adattiva' });
    }
};