import emoGameModel from "../../models/emoGameModel.js";
import { userModel } from "../../models/userModel.js";
import { sendEmail } from '../../utils/emailClient.js';
import { uploadFile } from '../../utils/storageClient.js';
import { STORY_STATUS, USER_TYPES } from '../../utils/constants.js';
import {
    determineInitialStatus,
    notifyTherapistsPending,
    notifyStoryCreated
} from '../story/helpers.js';
import { logger } from '../../utils/logger.js';
import { handleValidation } from '../../middleware/validators.js';
import { storiesCache } from "../story/getStories.js";

export const createEmoGame = async (req, res) => {
    if (!handleValidation(req, res)) return;

    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        const isTherapist = user?.tipo_utente === USER_TYPES.THERAPIST;

        const status = req.body.status || STORY_STATUS.PENDING;
        const title = (status === STORY_STATUS.DRAFT && !req.body.title)
            ? 'Bozza senza titolo'
            : req.body.title;

        let paragraphs = [];
        try {
            paragraphs = JSON.parse(req.body.paragraphs);
        } catch {
            return res.json({ success: false, message: 'Formato scene non valido' });
        }

        // Gestione file media (solo immagini/video per scena, no narrationAudio)
        if (req.files?.length > 0) {
            for (const file of req.files) {
                // Gli EmoGame non hanno audio TTS — skippa eventuali file audio globali
                if (file.fieldname === 'narrationAudio') continue;

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

                // Se il paragrafo usa un preset Cloudinary, non ri-uploadare
                if (paragraphs[index].isPresetMedia) continue;

                const uploadRes = await uploadFile(file.buffer, file.mimetype, 'storie_amiche/emogame_media');
                if (!uploadRes.success) continue;

                paragraphs[index].mediaUrl = uploadRes.url;
                paragraphs[index].mediaType = file.mimetype.startsWith('video') ? 'video'
                    : file.mimetype.startsWith('audio') ? 'audio'
                        : 'image';
            }
        }

        if (status !== STORY_STATUS.DRAFT && (!title || !paragraphs.length)) {
            return res.json({ success: false, message: 'Titolo e scene sono obbligatori' });
        }

        const newEmoGame = new emoGameModel({
            userId,
            title,
            description: req.body.description,
            category: req.body.category || 'Emozioni',
            difficulty: req.body.difficulty || 'DifI',
            paragraphs: paragraphs.map(p => ({
                text: p.text,
                isKeyStep: p.isKeyStep || false,
                gameText: p.gameText || '',
                mediaType: p.mediaType || 'none',
                color: p.color || 'bg-white',
                mediaUrl: p.mediaUrl || '',
                emotion: p.emotion || '',
                imageSuggestion: p.imageSuggestion || '',
                isBranching: p.isBranching || false,
                strangeStoryTest: {
                    active: true, // Always true for EmoGames
                    question: p.strangeStoryTest?.question || '',
                    type: p.strangeStoryTest?.type || 'libera',
                    options: (p.strangeStoryTest?.options || []).map(opt => ({
                        text: opt.text || '',
                        emoji: opt.emoji || '',
                        imageUrl: opt.imageUrl || '',
                        isCorrect: opt.isCorrect ?? null,
                        score: opt.score ?? null,
                        explanation: opt.explanation || '',
                        nextSceneText: opt.nextSceneText || '',
                        nextSceneIndex: opt.nextSceneIndex ?? null
                    })),
                    correctAnswer: p.strangeStoryTest?.correctAnswer || '',
                    explanation: p.strangeStoryTest?.explanation || ''
                }
            })),
            isPublic: status === STORY_STATUS.DRAFT
                ? false
                : (req.body.isPublic !== undefined
                    ? (req.body.isPublic === 'true' || req.body.isPublic === true)
                    : true),
            isEmotionGameActive: false, // Force disabled
            isStrangeStoryActive: true, // Force enabled
            backgroundColor: req.body.backgroundColor,
            status: determineInitialStatus(isTherapist, status),
            createdAt: new Date()
        });

        await newEmoGame.save();
        storiesCache.invalidate();

        // Email — identica alla logica story
        if (status !== 'DRAFT') {
            try {
                if (isTherapist) {
                    await sendEmail({
                        to: user.anagrafica.email,
                        subject: "EmoGame Creato e Pubblicato!",
                        customHtml: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #7C3AED;">✅ EmoGame Pubblicato con Successo</h2>
                                <p>Ciao ${user.anagrafica.nome},</p>
                                <p>Il tuo EmoGame "<strong>${title}</strong>" è stato creato e pubblicato automaticamente.</p>
                                <p style="color: #6B7280; font-size: 14px;">Come terapista, i tuoi contenuti sono approvati automaticamente.</p>
                            </div>
                        `
                    });
                } else {
                    await notifyStoryCreated(user, { title, description: req.body.description });
                    await notifyTherapistsPending(user, title);
                }
            } catch (emailError) {
                logger.warn("Errore invio email creazione EmoGame", { error: emailError.message });
            }
        }

        res.json({
            success: true,
            message: isTherapist
                ? 'EmoGame creato e pubblicato con successo!'
                : 'EmoGame creato! In attesa di approvazione.',
            story: newEmoGame
        });

    } catch (error) {
        logger.error("Errore createEmoGame", { error: error.message, details: error.errors });
        if (error.name === 'ValidationError') {
            const missing = Object.values(error.errors || {}).map(e => e.path).join(', ');
            const extra = missing ? ` Campi mancanti: ${missing}.` : '';
            return res.json({ success: false, message: `Assicurati che ogni scena abbia un testo.${extra}` });
        }
        res.json({ success: false, message: 'Impossibile creare l\'EmoGame' });
    }
};