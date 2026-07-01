import { userModel } from "../../models/userModel.js";
import { sendEmail } from '../../utils/emailClient.js';
import { deleteFile } from '../../utils/storageClient.js';
import { logger } from '../../utils/logger.js';
import { STORY_STATUS } from '../../utils/constants.js';

/**
 * Determina lo stato iniziale della storia in base al tipo utente
 */
export const determineInitialStatus = (isTherapist, requestedStatus) => {
    if (requestedStatus === STORY_STATUS.DRAFT) return STORY_STATUS.DRAFT;
    return isTherapist ? STORY_STATUS.APPROVED : STORY_STATUS.PENDING;
};

/**
 * Estrae i media URL da una storia per tracciamento pulizia
 */
export const extractMediaUrls = (story) => {
    const urls = [];
    if (story.coverImage) urls.push({ url: story.coverImage, type: 'image' });
    if (story.narrationUrl) urls.push({ url: story.narrationUrl, type: 'video' });
    story.paragraphs?.forEach(p => {
        if (p.mediaUrl) urls.push({ url: p.mediaUrl, type: p.mediaType === 'video' ? 'video' : 'image' });
        if (p.narrationUrl) urls.push({ url: p.narrationUrl, type: 'video' });
    });
    return urls;
};

/**
 * Determina il tipo di risorsa per la cancellazione
 */
export const getResourceType = (url) => {
    return (url.includes('/video/') || url.includes('/audio/')) ? 'video' : 'image';
};

/**
 * Pulisce i file media non più utilizzati
 */
export const cleanupOldMedia = async (oldUrls, newUrls) => {
    for (const old of oldUrls) {
        if (!newUrls.includes(old.url)) {
            try {
                await deleteFile(old.url, getResourceType(old.url));
            } catch (err) {
                logger.warn('⚠️ Errore pulizia file vecchio', { url: old.url, error: err.message });
            }
        }
    }
};

/**
 * Notifica i terapisti di una nuova storia in attesa
 */
export const notifyTherapistsPending = async (user, storyTitle) => {
    if (!user?.therapists?.length) return;

    for (const ref of user.therapists) {
        try {
            const therapist = await userModel.findById(ref.therapistId);
            if (!therapist) continue;

            await sendEmail({
                to: therapist.anagrafica.email,
                subject: "Nuova Storia da Revisionare",
                templateName: 'STORY_PENDING_TEMPLATE',
                templateData: {
                    therapistName: therapist.anagrafica.nome,
                    storyTitle,
                    parentName: `${user.anagrafica.nome} ${user.anagrafica.cognome}`
                }
            });
        } catch (e) {
            console.error("Errore notifica terapista:", e);
        }
    }
};

/**
 * Notifica il genitore della creazione storia
 */
export const notifyStoryCreated = async (user, storyData) => {
    await sendEmail({
        to: user.anagrafica.email,
        subject: "Nuova Storia Creata!",
        templateName: 'STORY_CREATED_TEMPLATE',
        templateData: {
            name: user.anagrafica.nome,
            title: storyData.title,
            description: storyData.description || "Nessuna descrizione",
            visibility: storyData.isPublic ? "Pubblica" : "Privata"
        }
    });
};

/**
 * Notifica il genitore della modifica storia
 */
export const notifyStoryUpdated = async (user, title) => {
    await sendEmail({
        to: user.anagrafica.email,
        subject: "Storia Modificata con Successo",
        templateName: 'STORY_UPDATED_TEMPLATE',
        templateData: {
            name: user.anagrafica.nome,
            title,
            date: new Date().toLocaleDateString('it-IT')
        }
    });
};

/**
 * Notifica il genitore che il terapista ha modificato la storia
 */
export const notifyTherapistEdit = async (parent, storyTitle) => {
    await sendEmail({
        to: parent.anagrafica.email,
        subject: "Storia Modificata dal Terapista",
        customHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Ciao ${parent.anagrafica.nome},</h2>
                <p>Il tuo terapista ha apportato modifiche alla storia "<strong>${storyTitle}</strong>".</p>
                <p>Accedi alla piattaforma per vedere le novità.</p>
            </div>
        `
    });
};

/**
 * Gestisce l'upload dei file media dei paragrafi
 */
export const processParagraphFiles = async (files, paragraphs) => {
    const { uploadFile } = await import('../../utils/storageClient.js');

    for (const file of files) {
        if (file.fieldname === 'narrationAudio') continue;

        // Gestione Strange Story Media
        if (file.fieldname.startsWith('strange_media_')) {
            const parts = file.fieldname.split('_');
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

        let index = -1;
        if (file.fieldname.includes('_')) {
            index = parseInt(file.fieldname.split('_')[1]);
        } else {
            const match = file.fieldname.match(/\[(\d+)\]/);
            if (match) index = parseInt(match[1]);
        }

        const uploadRes = await uploadFile(file.buffer, file.mimetype, 'storie_amiche/media');
        if (!uploadRes.success) continue;

        if (index > -1 && paragraphs[index]) {
            paragraphs[index].mediaUrl = uploadRes.url;
            paragraphs[index].mediaType = file.mimetype.startsWith('video') ? 'video'
                : file.mimetype.startsWith('audio') ? 'audio'
                    : 'image';
        }

        if (file.fieldname === 'coverImage') {
            return { coverImage: uploadRes.url };
        }
    }
    return {};
};

/**
 * Gestisce l'upload audio narrazione
 */
export const processNarrationAudio = async (file) => {
    const { uploadFile } = await import('../../utils/storageClient.js');
    const uploadRes = await uploadFile(file.buffer, file.mimetype, 'storie_amiche/narrazioni');
    return uploadRes.success ? { url: uploadRes.url, isManual: true } : null;
};