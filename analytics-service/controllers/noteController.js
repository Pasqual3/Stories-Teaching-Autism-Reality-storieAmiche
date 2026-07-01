import { Note } from '../models/noteModel.js';
import { sendLog } from '../utils/logger.js';
import { encrypt, decrypt } from '../utils/encryption.js';

// ---- POST NOTA CLINICA ----
export const createNote = async (req, res) => {
    try {
        const { childId } = req.params;
        // FIX IDOR: usa sempre l'utente autenticato, non il parametro URL
        const therapistId = req.userId;
        const { content } = req.body;

        // Cifra il contenuto sensibile prima di salvarlo nel database (GDPR compliance)
        const encryptedContent = encrypt(content);

        const newNote = new Note({
            childId,
            therapistId,
            content: encryptedContent
        });

        await newNote.save();
        await sendLog('info', `Nota aggiunta per bambino ${childId} da terapeuta ${therapistId}`);
        
        // Ritorniamo il contenuto in chiaro alla dashboard
        const noteResponse = newNote.toObject();
        noteResponse.content = decrypt(noteResponse.content);
        
        res.json({ success: true, note: noteResponse });

    } catch (error) {
        await sendLog('error', 'Errore salvataggio nota', { message: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- GET TUTTE LE NOTE DI UN BAMBINO ----
export const getNotes = async (req, res) => {
    try {
        const { childId } = req.params;
        // FIX IDOR: usa sempre l'utente autenticato, non il parametro URL
        const therapistId = req.userId;

        const notes = await Note.find({ childId, therapistId })
            .sort({ createdAt: -1 });

        // Decifra le note al volo prima di inviarle al frontend
        const decryptedNotes = notes.map(note => {
            const noteObj = note.toObject();
            noteObj.content = decrypt(noteObj.content);
            return noteObj;
        });

        res.json({ success: true, notes: decryptedNotes });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---- DELETE NOTA CLINICA ----
export const deleteNote = async (req, res) => {
    try {
        const { noteId } = req.params;

        // Verifica che la nota appartenga al terapista autenticato
        const deleted = await Note.findOneAndDelete({ _id: noteId, therapistId: req.userId });
        if (!deleted) {
            return res.status(403).json({ success: false, message: 'Nota non trovata o non autorizzato.' });
        }

        res.json({ success: true, message: 'Nota eliminata con successo' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};