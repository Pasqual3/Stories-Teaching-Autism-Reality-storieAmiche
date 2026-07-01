import mongoose from 'mongoose';
import storyModel from "../../models/storyModel.js";
import { userModel } from "../../models/userModel.js";
import { STORY_STATUS, USER_TYPES } from '../../utils/constants.js';
import {
    extractMediaUrls,
    cleanupOldMedia,
    processParagraphFiles,
    processNarrationAudio,
    notifyTherapistEdit,
    notifyStoryUpdated,
    notifyTherapistsPending
} from './helpers.js';
import { logger } from '../../utils/logger.js';
import { handleValidation } from '../../middleware/validators.js';
import { storiesCache } from "./getStories.js";

const checkAuthorization = async (story, userId) => {
    if (story.userId.toString() === userId) {
        return { isAuthorized: true, isTherapistEdit: false };
    }

    const therapistUser = await userModel.findById(userId);
    if (therapistUser?.tipo_utente !== USER_TYPES.THERAPIST) {
        return { isAuthorized: false };
    }

    const parentUser = await userModel.findById(story.userId);
    const isAssigned = parentUser?.therapists?.some(t =>
        t.therapistId?.toString() === userId
    );

    return {
        isAuthorized: isAssigned,
        isTherapistEdit: isAssigned
    };
};

export const updateStory = async (req, res) => {
    // --- Validazione express-validator ---
    if (!handleValidation(req, res)) return;

    try {
        const { id } = req.params;
        const userId = req.userId;

        const story = await storyModel.findById(id);
        if (!story) {
            return res.json({ success: false, message: 'Storia non trovata' });
        }

        // Traccia media vecchi per pulizia
        const oldMediaUrls = extractMediaUrls(story);

        // Controllo autorizzazione
        const { isAuthorized, isTherapistEdit } = await checkAuthorization(story, userId);
        if (!isAuthorized) {
            return res.json({ success: false, message: 'Non autorizzato a modificare questa storia.' });
        }

        // Parsing dati
        const oldStatus = story.status;
        const status = req.body.status !== undefined ? req.body.status : story.status;
        const title = (status === STORY_STATUS.DRAFT && !req.body.title)
            ? (story.title || 'Bozza senza titolo')
            : (req.body.title || story.title);

        let paragraphs = story.paragraphs;
        if (req.body.paragraphs) {
            try {
                paragraphs = JSON.parse(req.body.paragraphs);
            } catch {
                return res.json({ success: false, message: 'Formato paragrafi non valido' });
            }
        }

        // ... (resto della logica parsing)
        let narrationUrls = [];
        if (req.body.narrationUrls) {
            try {
                narrationUrls = JSON.parse(req.body.narrationUrls);
                // Applica gli URL alle singole scene senza sovrascrivere con stringhe vuote
                for (let i = 0; i < paragraphs.length && i < narrationUrls.length; i++) {
                    if (narrationUrls[i]) {
                        paragraphs[i].narrationUrl = narrationUrls[i];
                    }
                }
            } catch (e) {
                logger.error("Errore parsing narrationUrls update", { error: e.message });
            }
        }

        let narrationSyncData = story.narrationSyncData;
        if (req.body.narrationSyncData !== undefined) {
            try {
                narrationSyncData = req.body.narrationSyncData ? JSON.parse(req.body.narrationSyncData) : null;
            } catch (e) {
                logger.error("Errore parsing narrationSyncData update", { error: e.message });
            }
        }

        // Gestione file
        let coverImage = story.coverImage;
        if (req.files?.length > 0) {
            for (const file of req.files) {
                if (file.fieldname === 'narrationAudio') {
                    const result = await processNarrationAudio(file);
                    if (result) {
                        story.narrationUrl = result.url;
                    }
                    continue;
                }

                const paraResult = await processParagraphFiles([file], paragraphs);
                if (paraResult.coverImage) coverImage = paraResult.coverImage;
            }
        }

        // Aggiornamento campi
        let audioJobId = story.audioJobId;
        let audioCompletionStatus = story.audioCompletionStatus;
        if (status !== 'GENERATING_AUDIO') {
            audioJobId = '';
            audioCompletionStatus = '';
        } else {
            if (req.body.audioJobId !== undefined) {
                audioJobId = req.body.audioJobId;
            }
            if (req.body.audioCompletionStatus !== undefined) {
                audioCompletionStatus = req.body.audioCompletionStatus;
            }
        }

        Object.assign(story, {
            title,
            description: req.body.description !== undefined ? req.body.description : story.description,
            category: req.body.category !== undefined ? req.body.category : story.category,
            paragraphs,
            isPublic: status === 'DRAFT' ? false : (req.body.isPublic !== undefined ? (req.body.isPublic === 'true' || req.body.isPublic === true) : story.isPublic),
            isSequencingGameActive: req.body.isSequencingGameActive !== undefined ? (req.body.isSequencingGameActive === 'true' || req.body.isSequencingGameActive === true) : story.isSequencingGameActive,
            isEmotionGameActive: req.body.isEmotionGameActive !== undefined ? (req.body.isEmotionGameActive === 'true' || req.body.isEmotionGameActive === true) : story.isEmotionGameActive,
            isStrangeStoryActive: req.body.isStrangeStoryActive !== undefined ? (req.body.isStrangeStoryActive === 'true' || req.body.isStrangeStoryActive === true) : story.isStrangeStoryActive,
            backgroundColor: req.body.backgroundColor || story.backgroundColor,
            narrationUrl: req.body.narrationUrl !== undefined ? req.body.narrationUrl : story.narrationUrl,
            narrationSyncData,
            coverImage,
            status: req.body.status || story.status,
            audioJobId,
            audioCompletionStatus
        });

        // Logica notifiche
        if (status !== 'GENERATING_AUDIO' && status !== 'DRAFT') {
            if (isTherapistEdit) {
                const parent = await userModel.findById(story.userId);
                if (parent && oldStatus !== status) await notifyTherapistEdit(parent, title);
            } else {
                const user = await userModel.findById(userId);

                if (user?.therapists?.length > 0) {
                    if (status === STORY_STATUS.PENDING) {
                        story.status = STORY_STATUS.PENDING;
                        story.rejectionReason = '';
                        story.reviewedBy = null;
                        if (oldStatus !== STORY_STATUS.PENDING) {
                            await notifyTherapistsPending(user, title);
                        }
                    }
                }

                if (user && oldStatus !== status) await notifyStoryUpdated(user, title);
            }
        }

        // Ensure `status` is present and valid before saving to avoid ValidationError
        if (!story.status) {
            story.status = STORY_STATUS.PENDING;
        } else if (!Object.values(STORY_STATUS).includes(story.status)) {
            story.status = STORY_STATUS.PENDING;
        }

        await story.save();

        // Pulizia file vecchi (esterna al DB, non può essere annullata dalla transazione)
        const newMediaUrls = extractMediaUrls(story).map(m => m.url);
        await cleanupOldMedia(oldMediaUrls, newMediaUrls);

        logger.info("Storia aggiornata con successo", { storyId: id, userId });
        storiesCache.invalidate();
        res.json({ success: true, message: 'Storia aggiornata con successo!', story });

    } catch (error) {
        logger.error("Errore updateStory", { error: error.message, stack: error.stack, details: error.errors });

        if (error.name === 'ValidationError') {
            const missing = Object.values(error.errors || {}).map(e => e.path).join(', ');
            const extra = missing ? ` Campi mancanti: ${missing}.` : '';
            return res.json({ success: false, message: `Assicurati che ogni scena della storia abbia un testo.${extra}` });
        }
        res.json({ success: false, message: 'Impossibile aggiornare la storia' });
    }
};