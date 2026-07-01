import emoGameModel from "../../models/emoGameModel.js";
import { userModel } from "../../models/userModel.js";
import { STORY_STATUS, USER_TYPES } from '../../utils/constants.js';
import { uploadFile } from '../../utils/storageClient.js';
import {
    extractMediaUrls,
    cleanupOldMedia,
    processParagraphFiles,
    notifyTherapistEdit,
    notifyStoryUpdated,
    notifyTherapistsPending
} from '../story/helpers.js';
import { logger } from '../../utils/logger.js';
import { handleValidation } from '../../middleware/validators.js';
import { storiesCache } from "../story/getStories.js";

const checkAuthorization = async (emoGame, userId) => {
    if (emoGame.userId.toString() === userId) {
        return { isAuthorized: true, isTherapistEdit: false };
    }

    const therapistUser = await userModel.findById(userId);
    if (therapistUser?.tipo_utente !== USER_TYPES.THERAPIST) {
        return { isAuthorized: false };
    }

    const parentUser = await userModel.findById(emoGame.userId);
    const isAssigned = parentUser?.therapists?.some(t =>
        t.therapistId?.toString() === userId
    );

    return { isAuthorized: isAssigned, isTherapistEdit: isAssigned };
};

export const updateEmoGame = async (req, res) => {
    if (!handleValidation(req, res)) return;

    try {
        const { id } = req.params;
        const userId = req.userId;

        const emoGame = await emoGameModel.findById(id);
        if (!emoGame) {
            return res.json({ success: false, message: 'EmoGame non trovato' });
        }

        const oldMediaUrls = extractMediaUrls(emoGame);

        const { isAuthorized, isTherapistEdit } = await checkAuthorization(emoGame, userId);
        if (!isAuthorized) {
            return res.json({ success: false, message: 'Non autorizzato a modificare questo EmoGame.' });
        }

        const oldStatus = emoGame.status;
        const status = req.body.status !== undefined ? req.body.status : emoGame.status;
        const title = (status === STORY_STATUS.DRAFT && !req.body.title)
            ? (emoGame.title || 'Bozza senza titolo')
            : (req.body.title || emoGame.title);

        let paragraphs = emoGame.paragraphs;
        if (req.body.paragraphs) {
            try {
                paragraphs = JSON.parse(req.body.paragraphs);
            } catch {
                return res.json({ success: false, message: 'Formato scene non valido' });
            }
        }

        // Gestione file media (no narrationAudio per EmoGame)
        let coverImage = emoGame.coverImage;
        if (req.files?.length > 0) {
            for (const file of req.files) {
                if (file.fieldname === 'narrationAudio') continue; // ignorato

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

                const paraResult = await processParagraphFiles([file], paragraphs);
                if (paraResult.coverImage) coverImage = paraResult.coverImage;
            }
        }

        const mappedParagraphs = paragraphs.map(p => ({
            _id: p._id || p.id,
            text: p.text,
            isKeyStep: p.isKeyStep || false,
            gameText: p.gameText || '',
            mediaType: p.mediaType || 'none',
            color: p.color || 'bg-white',
            mediaUrl: p.mediaUrl || '',
            emotion: p.emotion || '',
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
                    explanation: opt.explanation || ''
                })),
                correctAnswer: p.strangeStoryTest?.correctAnswer || '',
                explanation: p.strangeStoryTest?.explanation || ''
            }
        }));

        Object.assign(emoGame, {
            title,
            description: req.body.description !== undefined ? req.body.description : emoGame.description,
            category: req.body.category !== undefined ? req.body.category : emoGame.category,
            difficulty: req.body.difficulty !== undefined ? req.body.difficulty : emoGame.difficulty,
            paragraphs: mappedParagraphs,
            isPublic: status === 'DRAFT'
                ? false
                : (req.body.isPublic !== undefined
                    ? (req.body.isPublic === 'true' || req.body.isPublic === true)
                    : emoGame.isPublic),
            isEmotionGameActive: false, // Force disabled
            isStrangeStoryActive: true, // Force enabled
            backgroundColor: req.body.backgroundColor || emoGame.backgroundColor,
            coverImage,
            status: req.body.status || emoGame.status
        });

        // Notifiche
        if (status !== 'DRAFT') {
            if (isTherapistEdit) {
                const parent = await userModel.findById(emoGame.userId);
                if (parent && oldStatus !== status) await notifyTherapistEdit(parent, title);
            } else {
                const user = await userModel.findById(userId);
                if (user?.therapists?.length > 0 && status === STORY_STATUS.PENDING) {
                    emoGame.status = STORY_STATUS.PENDING;
                    emoGame.rejectionReason = '';
                    emoGame.reviewedBy = null;
                    if (oldStatus !== STORY_STATUS.PENDING) {
                        await notifyTherapistsPending(user, title);
                    }
                }
                if (user && oldStatus !== status) await notifyStoryUpdated(user, title);
            }
        }

        if (!emoGame.status || !['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'].includes(emoGame.status)) {
            emoGame.status = STORY_STATUS.PENDING;
        }

        await emoGame.save();
        storiesCache.invalidate();

        const newMediaUrls = extractMediaUrls(emoGame).map(m => m.url);
        await cleanupOldMedia(oldMediaUrls, newMediaUrls);

        res.json({ success: true, message: 'EmoGame aggiornato con successo!', story: emoGame });

    } catch (error) {
        logger.error("Errore updateEmoGame", { error: error.message, stack: error.stack });
        if (error.name === 'ValidationError') {
            const missing = Object.values(error.errors || {}).map(e => e.path).join(', ');
            const extra = missing ? ` Campi mancanti: ${missing}.` : '';
            return res.json({ success: false, message: `Assicurati che ogni scena abbia un testo.${extra}` });
        }
        res.json({ success: false, message: 'Impossibile aggiornare l\'EmoGame' });
    }
};