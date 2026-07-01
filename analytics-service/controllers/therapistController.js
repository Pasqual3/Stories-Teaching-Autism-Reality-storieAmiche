import { Session } from '../models/sessionModel.js';
import { Baseline } from '../models/baselineModel.js';
import { Note } from '../models/noteModel.js';
import { getTherapistParents, verifyTherapistChildAccess } from '../services/userService.js';
import { sendLog } from '../utils/logger.js';

// Importiamo gli helper di crittografia
import { encrypt, decrypt, decryptNumber, decryptJson } from '../utils/encryption.js';

// Helper ultra-sicuro per decifrare le sessioni senza mai generare crash
const decryptSession = (sessionObj) => {
    try {
        return {
            ...sessionObj,
            childId: decrypt(sessionObj.childId),
            stressIndex: decryptNumber(sessionObj.stressIndex),
            stressLevel: decrypt(sessionObj.stressLevel),
            stressBreakdown: decryptJson(sessionObj.stressBreakdown),
            slideData: decryptJson(sessionObj.slideData) || [],
            therapistNotes: sessionObj.therapistNotes ? decrypt(sessionObj.therapistNotes) : ''
        };
    } catch (err) {
        console.warn("⚠️ Avviso decrittografia sessione (dato vecchio o non cifrato):", err.message);
        return {
            ...sessionObj,
            childId: sessionObj.childId ? (sessionObj.childId.includes(':') ? decrypt(sessionObj.childId) : sessionObj.childId) : '',
            stressIndex: typeof sessionObj.stressIndex === 'number' ? sessionObj.stressIndex : 0,
            stressLevel: typeof sessionObj.stressLevel === 'string' && !sessionObj.stressLevel.includes(':') ? sessionObj.stressLevel : 'calm',
            stressBreakdown: typeof sessionObj.stressBreakdown === 'object' ? sessionObj.stressBreakdown : {},
            slideData: Array.isArray(sessionObj.slideData) ? sessionObj.slideData : [],
            therapistNotes: sessionObj.therapistNotes || ''
        };
    }
};

// ---- GET LISTA BAMBINI CON RIEPILOGO ----
export const getTherapistChildren = async (req, res) => {
    try {
        const { therapistId } = req.params;
        const token = req.cookies.token;

        await sendLog('info', `Richiesta elenco bambini per terapeuta: ${therapistId}`);

        const parentsData = await getTherapistParents(therapistId, token);

        if (!parentsData.success || parentsData.parents.length === 0) {
            await sendLog('info', `Nessun genitore associato al terapeuta: ${therapistId}`);
            return res.json({ success: true, children: [] });
        }

        const parentIdsStr = parentsData.parents.map(p => p._id.toString());

        // Raccoglie TUTTI i bambini assegnati (anche senza sessioni)
        const allChildrenData = [];
        parentsData.parents.forEach(p => {
            if (p.children && Array.isArray(p.children)) {
                p.children.forEach(c => {
                    const id = c._id?.toString() || c.id?.toString();
                    if (id && c.name) {
                        allChildrenData.push({ id, fullName: c.name });
                    }
                });
            }
        });

        // Costruisce mappa sigla univoca per ogni bambino
        const childInfoMap = {};
        allChildrenData.forEach(currentChild => {
            const parts = currentChild.fullName.split(' ').filter(p => p.length > 0);
            const firstName = parts[0] || '';
            const surnameInitial = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() : '';

            let prefixLength = 1;
            let isUnique = false;
            while (!isUnique && prefixLength <= firstName.length) {
                const currentPrefix = firstName.substring(0, prefixLength).toLowerCase();
                const conflicts = allChildrenData.filter(other => {
                    if (other.id === currentChild.id) return false;
                    const otherFirstName = other.fullName.split(' ')[0] || '';
                    return otherFirstName.toLowerCase().startsWith(currentPrefix);
                });
                if (conflicts.length === 0) isUnique = true;
                else prefixLength++;
            }
            const finalPrefix = firstName.substring(0, prefixLength);
            const formattedName = finalPrefix.charAt(0).toUpperCase() + finalPrefix.slice(1).toLowerCase();
            childInfoMap[currentChild.id] = surnameInitial
                ? `${formattedName}-${surnameInitial}`
                : formattedName;
        });

        // Carica le sessioni esistenti per arricchire i dati
        const allSessions = await Session.find({ parentId: { $in: parentIdsStr } }).sort({ createdAt: -1 });
        const decryptedSessions = allSessions.map(s => decryptSession(s.toObject()));

        // Raggruppa sessioni per childId decifrato (solo strangeStory, non emoGame)
        const sessionsByChild = {};
        decryptedSessions.forEach(session => {
            const cid = session.childId;
            if (cid && (session.sessionType === 'strangeStory' || !session.sessionType)) {
                if (!sessionsByChild[cid]) sessionsByChild[cid] = [];
                sessionsByChild[cid].push(session);
            }
        });

        // Costruisce riepilogo per TUTTI i bambini assegnati (con o senza sessioni)
        const childrenSummary = allChildrenData.map(({ id: childId }) => {
            const childSessions = sessionsByChild[childId] || [];
            const totalSessions = childSessions.length;
            const lastSession = childSessions[0] || null;

            const avgStress = totalSessions > 0
                ? Math.round(childSessions.reduce((sum, s) => sum + (s.stressIndex || 0), 0) / totalSessions)
                : 0;
            const avgCompletion = totalSessions > 0
                ? Math.round(childSessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / totalSessions)
                : 0;

            return {
                childId,
                initials: childInfoMap[childId] || '??',
                totalSessions,
                avgStressIndex: avgStress,
                avgCompletionRate: avgCompletion,
                lastSessionDate: lastSession?.createdAt || null,
                lastStressLevel: lastSession?.stressLevel || 'n/a',
                lastStressIndex: lastSession?.stressIndex || 0
            };
        });

        await sendLog('info', `Caricati ${childrenSummary.length} bambini per terapeuta: ${therapistId}`);
        res.json({ success: true, children: childrenSummary });

    } catch (error) {
        await sendLog('error', 'Errore get children per terapeuta', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: error.message });
    }
};


// ---- GET SESSIONI COMPLETE DI UN BAMBINO ----
export const getChildSessions = async (req, res) => {
    try {
        const { therapistId, childId } = req.params;
        const { limit = 100, startDate, endDate } = req.query;
        const token = req.cookies.token;

        await sendLog('info', `Richiesta sessioni per bambino ${childId} da terapeuta ${therapistId}`);

        // 1. Verifica comunque i permessi di accesso del terapista al bambino
        const accessCheck = await verifyTherapistChildAccess(therapistId, childId, token);
        if (!accessCheck.success) {
            return res.status(403).json({
                success: false,
                message: 'Non hai i permessi per visualizzare questo bambino'
            });
        }

        // 2. 🌟 RISOLTO: Recuperiamo i parentIds usando lo stesso servizio sicuro della lista iniziale
        const parentsData = await getTherapistParents(therapistId, token);
        if (!parentsData.success || parentsData.parents.length === 0) {
            await sendLog('info', `Nessun genitore associato al terapeuta: ${therapistId}`);
            return res.json({ success: true, sessions: [], totalSessions: 0 });
        }

        const parentIdsStr = parentsData.parents.map(p => p._id.toString());

        // Costruzione query sicura usando parentId (non cifrato)
        const query = { parentId: { $in: parentIdsStr } };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const sessions = await Session.find(query).sort({ createdAt: -1 });

        // Decifriamo tutte le sessioni in memoria
        const decryptedSessions = sessions.map(s => decryptSession(s.toObject()));

        // 🌟 FILTRIAMO IN MEMORIA: Teniamo solo le sessioni del bambino desiderato (evita bug di cifratura)
        // e solo le sessioni di tipo strangeStory (non emoGame)
        const filteredSessions = decryptedSessions.filter(s =>
            String(s.childId) === String(childId) &&
            (s.sessionType === 'strangeStory' || !s.sessionType)
        );

        // Limitiamo i risultati al valore richiesto (default 100)
        const limitedSessions = filteredSessions.slice(0, parseInt(limit));

        const baseline = await Baseline.findOne({ childId: String(childId) });

        await sendLog('info', `Trovate ${limitedSessions.length} sessioni`);
        res.json({
            success: true,
            sessions: limitedSessions, // Inviamo l'array decifrato, filtrato e limitato!
            baseline,
            totalSessions: limitedSessions.length
        });

    } catch (error) {
        await sendLog('error', 'Errore get sessioni bambino', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- NOTE CLINICHE ----

export const getChildNotes = async (req, res) => {
    try {
        const { childId } = req.params;
        // FIX IDOR: usa sempre l'utente autenticato, non il parametro URL
        const therapistId = req.userId;
        const notes = await Note.find({ therapistId, childId }).sort({ createdAt: -1 });
        res.json({ success: true, notes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createChildNote = async (req, res) => {
    try {
        const { childId } = req.params;
        // FIX IDOR: usa sempre l'utente autenticato, non il parametro URL
        const therapistId = req.userId;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Contenuto nota mancante' });
        }

        const newNote = new Note({
            therapistId,
            childId,
            content
        });

        await newNote.save();
        res.json({ success: true, note: newNote });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteChildNote = async (req, res) => {
    try {
        const { childId, noteId } = req.params;
        // FIX IDOR: usa sempre l'utente autenticato, non il parametro URL
        const therapistId = req.userId;
        const result = await Note.findOneAndDelete({ _id: noteId, therapistId, childId });

        if (!result) {
            return res.status(404).json({ success: false, message: 'Nota non trovata' });
        }

        res.json({ success: true, message: 'Nota eliminata' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};