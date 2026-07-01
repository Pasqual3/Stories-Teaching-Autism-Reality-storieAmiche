import storyModel from "../../models/storyModel.js";
import { userModel } from "../../models/userModel.js";
import { sendEmail } from '../../utils/emailClient.js';
import { uploadFile } from '../../utils/storageClient.js';
import { STORY_STATUS, USER_TYPES } from '../../utils/constants.js';
import {
    determineInitialStatus,
    notifyTherapistsPending,
    notifyStoryCreated
} from './helpers.js';
import { logger } from '../../utils/logger.js';
import { handleValidation } from '../../middleware/validators.js';
import { storiesCache } from "./getStories.js";

export const createStory = async (req, res) => {
    // --- Validazione express-validator ---
    if (!handleValidation(req, res)) return;

    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        const isTherapist = user?.tipo_utente === USER_TYPES.THERAPIST;

        // --- Parsing dati ---
        const status = req.body.status || STORY_STATUS.PENDING;
        const title = (status === STORY_STATUS.DRAFT && !req.body.title)
            ? 'Bozza senza titolo'
            : req.body.title;

        let paragraphs = [];
        try {
            paragraphs = JSON.parse(req.body.paragraphs);
        } catch {
            return res.json({ success: false, message: 'Formato paragrafi non valido' });
        }

        let narrationSyncData = null;
        if (req.body.narrationSyncData) {
            try {
                narrationSyncData = JSON.parse(req.body.narrationSyncData);
            } catch (e) {
                logger.error("Errore parsing narrationSyncData", { error: e.message });
            }
        }

        let narrationUrl = req.body.narrationUrl || '';

        // --- Gestione file ---
        if (req.files?.length > 0) {
            for (const file of req.files) {
                if (file.fieldname === 'narrationAudio') {
                    const uploadRes = await uploadFile(file.buffer, file.mimetype, 'storie_amiche/narrazioni');
                    if (uploadRes.success) {
                        narrationUrl = uploadRes.url;
                        narrationSyncData = null;
                    }
                    continue;
                }

                const parts = file.fieldname.split('_');
                if (parts[0] === 'strange') {
                    // Formato: strange_media_paraIndex_optIndex
                    const pIdx = parseInt(parts[2]);
                    const oIdx = parseInt(parts[3]);
                    if (!isNaN(pIdx) && !isNaN(oIdx) && paragraphs[pIdx] && paragraphs[pIdx].strangeStoryTest?.options?.[oIdx]) {
                        const uploadRes = await uploadFile(file.buffer, file.mimetype, 'storie_amiche/strange_stories');
                        if (uploadRes.success) {
                            paragraphs[pIdx].strangeStoryTest.options[oIdx].imageUrl = uploadRes.url;
                        }
                    }
                    continue;
                }

                const index = parseInt(file.fieldname.split('_')[1]);
                if (isNaN(index) || !paragraphs[index]) continue;

                const uploadRes = await uploadFile(file.buffer, file.mimetype, 'storie_amiche/media');
                if (!uploadRes.success) continue;

                paragraphs[index].mediaUrl = uploadRes.url;
                paragraphs[index].mediaType = file.mimetype.startsWith('video') ? 'video'
                    : file.mimetype.startsWith('audio') ? 'audio'
                        : 'image';
            }
        }

        // --- Validazione ---
        // Controlla che ci sia almeno una scena con testo non vuoto (non basta lunghezza > 0)
        const hasValidScene = paragraphs.some(p => p.text && p.text.trim().length > 0);
        if (status !== STORY_STATUS.DRAFT && (!title || !hasValidScene)) {
            const msg = !title
                ? 'Il titolo è obbligatorio'
                : 'La storia deve avere almeno una scena con del testo';
            return res.json({ success: false, message: msg });
        }

        // --- Creazione ---
        const newStory = new storyModel({
            userId,
            title,
            description: req.body.description,
            category: req.body.category || 'Socialità',
            paragraphs: paragraphs.map(p => ({
                text: p.text,
                isKeyStep: p.isKeyStep || false,
                gameText: p.gameText || '',
                mediaType: p.mediaType || 'none',
                color: p.color,
                mediaUrl: p.mediaUrl,
                emotion: p.emotion || '',
                narrationUrl: p.narrationUrl || '',
                strangeStoryTest: {
                    active: p.strangeStoryTest?.active || false,
                    question: p.strangeStoryTest?.question || '',
                    type: p.strangeStoryTest?.type || 'libera',
                    options: (p.strangeStoryTest?.options || []).map(opt => ({
                        text: opt.text || '',
                        emoji: opt.emoji || '',
                        imageUrl: opt.imageUrl || '',
                        isCorrect: opt.isCorrect ?? null,
                        score: opt.score ?? null,
                        explanation: opt.explanation || ''
                    })),
                    correctAnswer: p.strangeStoryTest?.correctAnswer || '',
                    explanation: p.strangeStoryTest?.explanation || ''
                }
            })),
            isPublic: status === STORY_STATUS.DRAFT ? false : (req.body.isPublic !== undefined ? (req.body.isPublic === 'true' || req.body.isPublic === true) : true),
            isSequencingGameActive: req.body.isSequencingGameActive === 'true' || req.body.isSequencingGameActive === true,
            isEmotionGameActive: req.body.isEmotionGameActive === 'true' || req.body.isEmotionGameActive === true,
            isStrangeStoryActive: req.body.isStrangeStoryActive === 'true' || req.body.isStrangeStoryActive === true,
            backgroundColor: req.body.backgroundColor,
            narrationUrl,
            narrationSyncData,
            status: determineInitialStatus(isTherapist, status),
            createdAt: new Date()
        });

        await newStory.save();

        // --- Notifiche email ---
        if (status !== 'GENERATING_AUDIO' && status !== 'DRAFT') {
            try {
                if (isTherapist) {
                    await sendEmail({
                        to: user.anagrafica.email,
                        subject: "Storia Creata e Pubblicata!",
                        customHtml: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #4F46E5;">✅ Storia Pubblicata con Successo</h2>
                                <p>Ciao ${user.anagrafica.nome},</p>
                                <p>La tua storia "<strong>${title}</strong>" è stata creata e pubblicata automaticamente.</p>
                                <p style="color: #6B7280; font-size: 14px;">Come terapista, le tue storie sono approvate automaticamente.</p>
                            </div>
                        `
                    });
                } else {
                    await notifyStoryCreated(user, { title, description: req.body.description, isPublic: req.body.isPublic === 'true' });
                    await notifyTherapistsPending(user, title);
                }
            } catch (emailError) {
                logger.warn("Errore invio email creazione storia", { error: emailError.message });
            }
        }

        storiesCache.invalidate();
        res.json({
            success: true,
            message: isTherapist
                ? 'Storia creata e pubblicata con successo!'
                : 'Storia creata con successo! In attesa di approvazione.',
            story: newStory
        });

    } catch (error) {
        logger.error("Errore createStory", { error: error.message, details: error.errors });
        if (error.name === 'ValidationError') {
            const missing = Object.values(error.errors || {}).map(e => e.path).join(', ');
            const extra = missing ? ` Campi mancanti: ${missing}.` : '';
            return res.json({ success: false, message: `Assicurati che ogni scena della storia abbia un testo.${extra}` });
        }
        res.json({ success: false, message: 'Impossibile creare la storia' });
    }
};