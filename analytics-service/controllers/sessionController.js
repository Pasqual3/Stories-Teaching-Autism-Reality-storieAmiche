import { Session } from '../models/sessionModel.js';
import { Baseline } from '../models/baselineModel.js';
import { calculateStressIndex, getStressLevel, getTimeOfDay } from '../utils/stressCalculator.js';
import { sendLog } from '../utils/logger.js';
import { encrypt, decrypt, encryptNumber, decryptNumber, encryptJson, decryptJson } from '../utils/encryption.js';

// Decifra una sessione prima di inviarla al frontend
// NOTA: childId NON è cifrato (vedi createSession) perché deve restare
// interrogabile con una query di uguaglianza; encrypt() usa un IV casuale
// quindi non è mai adatto come chiave di ricerca. decrypt() qui è comunque
// tollerante e restituisce il valore invariato se non è nel formato cifrato,
// quindi resta sicuro anche su eventuali record legacy già cifrati.
const decryptSession = (sessionObj) => ({
    ...sessionObj,
    childId: decrypt(sessionObj.childId),
    stressIndex: decryptNumber(sessionObj.stressIndex),
    stressLevel: decrypt(sessionObj.stressLevel),
    stressBreakdown: decryptJson(sessionObj.stressBreakdown),
    slideData: decryptJson(sessionObj.slideData) || [],
    therapistNotes: sessionObj.therapistNotes ? decrypt(sessionObj.therapistNotes) : ''
});

// ---- SALVA SESSIONE COMPLETA ----
export const createSession = async (req, res) => {
    try {
        const {
            childId, storyId, parentId, deviceType,
            totalSlides, lastSlideReached, slideData,
            totalClicks, totalMissClicks, totalRageClicks,
            totalPageReversals, avgHesitationTime, totalDuration,
            totalRandomClicks, pageVisibilitySwitches,
            sessionType
        } = req.body;

        // 🌟 SAFETY CHECK 1: Evita crash se childId è nullo o mancante
        if (!childId) {
            return res.status(400).json({
                success: false,
                message: "Errore di routing: ID Bambino (childId) mancante nel salvataggio della sessione."
            });
        }

        // 🌟 SAFETY CHECK 2: Impostiamo fallback numerici sicuri per evitare divisioni per zero o valori NaN
        const slides = Number(totalSlides) || 1;
        const reached = Number(lastSlideReached) || 0;
        const clicks = Number(totalClicks) || 0;
        const missClicks = Number(totalMissClicks) || 0;
        const rageClicks = Number(totalRageClicks) || 0;
        const reversals = Number(totalPageReversals) || 0;
        const duration = Number(totalDuration) || 1;

        const completionRate = Math.round(((reached + 1) / slides) * 100);
        const completedStory = reached >= slides - 1;
        const dropOffSlide = completedStory ? null : reached;

        // Ricerca sicura della baseline convertendo l'ID in stringa
        const baseline = await Baseline.findOne({ childId: String(childId) });

        // Calcoliamo lo stress index usando i dati ripuliti e sicuri
        const { stressIndex, breakdown } = calculateStressIndex({
            totalClicks: clicks,
            totalMissClicks: missClicks,
            totalRageClicks: rageClicks,
            totalPageReversals: reversals,
            totalSlides: slides,
            totalDuration: duration
        }, baseline);

        // Se lo stressIndex calcolato è un valore non valido (NaN), lo forziamo a 0
        const safeStressIndex = isNaN(stressIndex) ? 0 : stressIndex;

        const session = new Session({
            // childId in chiaro: deve restare interrogabile (vedi getSessionsByChild).
            // encrypt() usa un IV casuale ad ogni chiamata quindi due cifrature
            // dello stesso childId non sono mai uguali tra loro: usarlo come
            // filtro di query restituirebbe sempre zero risultati.
            childId: String(childId),
            storyId: storyId ? String(storyId) : undefined,
            parentId: parentId ? String(parentId) : undefined,
            deviceType: deviceType || 'desktop',
            timeOfDay: getTimeOfDay(),
            totalSlides: slides,
            lastSlideReached: reached,
            completionRate, completedStory, dropOffSlide,
            totalClicks: clicks,
            totalMissClicks: missClicks,
            totalRageClicks: rageClicks,
            totalPageReversals: reversals,
            avgHesitationTime: Number(avgHesitationTime) || 0,
            totalDuration: duration,
            slideData: encryptJson(slideData || []),
            totalRandomClicks: Number(totalRandomClicks) || 0,
            pageVisibilitySwitches: Number(pageVisibilitySwitches) || 0,
            stressIndex: encryptNumber(safeStressIndex),
            stressLevel: encrypt(getStressLevel(safeStressIndex)),
            stressBreakdown: encryptJson(breakdown || {}),
            endedAt: new Date(),
            sessionType: sessionType === 'emoGame' ? 'emoGame' : 'strangeStory'
        });

        await session.save();

        await sendLog('info', `Sessione salvata per bambino ${childId}`, {
            completionRate
        });

        res.json({
            success: true,
            sessionId: session._id,
            stressIndex: safeStressIndex,
            stressLevel: getStressLevel(safeStressIndex)
        });

    } catch (error) {
        console.error("Errore salvataggio sessione nel microservizio:", error);
        await sendLog('error', 'Errore salvataggio sessione', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- VALIDA SESSIONE (Terapista) ----
export const validateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { isCalibrationSession, therapistNotes } = req.body;

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Sessione non trovata' });
        }

        session.therapistValidated = true;
        session.isCalibrationSession = isCalibrationSession;
        session.therapistNotes = encrypt(therapistNotes || '');
        await session.save();

        if (isCalibrationSession) {
            await updateBaseline(session.childId);
        }

        await sendLog('info', `Sessione ${sessionId} validata dal terapista`);
        res.json({ success: true, message: 'Sessione validata' });

    } catch (error) {
        await sendLog('error', `Errore validazione sessione ${req.params.sessionId}`, {
            message: error.message
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- GET SESSIONI PER BAMBINO ----
export const getSessionsByChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const { limit = 20 } = req.query;

        const sessions = await Session.find({ childId: String(childId) })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const decryptedSessions = sessions.map(s => decryptSession(s.toObject()));

        res.json({ success: true, sessions: decryptedSessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- GET BASELINE BAMBINO ----
export const getBaseline = async (req, res) => {
    try {
        const baseline = await Baseline.findOne({ childId: req.params.childId });
        res.json({ success: true, baseline: baseline || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- GET SESSIONI PER GENITORE ----
export const getSessionsByParent = async (req, res) => {
    try {
        const sessions = await Session.find({ parentId: req.params.parentId })
            .sort({ createdAt: -1 })
            .limit(50);

        const decryptedSessions = sessions.map(s => decryptSession(s.toObject()));

        res.json({ success: true, sessions: decryptedSessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- AGGIORNA BASELINE (funzione interna) ----
const updateBaseline = async (childId) => {
    const calibrationSessions = await Session.find({
        childId,
        isCalibrationSession: true,
        therapistValidated: true
    });

    if (calibrationSessions.length === 0) return;

    const avgTimePerSlide = calibrationSessions.reduce((sum, s) =>
        sum + (s.totalDuration / Math.max(s.totalSlides, 1)), 0) / calibrationSessions.length;

    const avgClicksPerSlide = calibrationSessions.reduce((sum, s) =>
        sum + (s.totalClicks / Math.max(s.totalSlides, 1)), 0) / calibrationSessions.length;

    const avgMissClicksPerSlide = calibrationSessions.reduce((sum, s) =>
        sum + (s.totalMissClicks / Math.max(s.totalSlides, 1)), 0) / calibrationSessions.length;

    const avgRageClicksPerSlide = calibrationSessions.reduce((sum, s) =>
        sum + (s.totalRageClicks / Math.max(s.totalSlides, 1)), 0) / calibrationSessions.length;

    const avgHesitationTime = calibrationSessions.reduce((sum, s) =>
        sum + s.avgHesitationTime, 0) / calibrationSessions.length;

    await Baseline.findOneAndUpdate(
        { childId },
        {
            avgTimePerSlide,
            avgClicksPerSlide,
            avgMissClicksPerSlide,
            avgRageClicksPerSlide,
            avgHesitationTime,
            totalCalibrationSessions: calibrationSessions.length,
            lastUpdated: new Date()
        },
        { upsert: true, new: true }
    );

    await sendLog('info', `Baseline aggiornata per bambino: ${childId}`, {
        sessionsUsed: calibrationSessions.length
    });
};