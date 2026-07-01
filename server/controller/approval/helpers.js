import { userModel } from "../../models/userModel.js";
import storyModel from "../../models/storyModel.js";
import emoGameModel from "../../models/emoGameModel.js";
import { sendEmail } from '../../utils/emailClient.js';

/**
 * Trova tutti i genitori associati a un terapista con uno specifico stato
 */
export const findParentsByTherapist = async (therapistId, status = null) => {
    const query = {
        therapists: {
            $elemMatch: { therapistId, ...(status && { status }) }
        }
    };
    return await userModel.find(query);
};

/**
 * Trova una storia e verifica che appartenga a un genitore del terapista
 */
export const findStoryForTherapist = async (storyId, therapistId) => {
    // Try to find in stories collection first, then in emoGames
    let story = await storyModel.findById(storyId);
    if (!story) {
        story = await emoGameModel.findById(storyId);
    }
    if (!story) return null;

    const parent = await userModel.findOne({
        _id: story.userId,
        'therapists.therapistId': therapistId,
        'therapists.status': 'accepted'
    });

    return parent ? story : null;
};

/**
 * Formatta i dati del genitore per le risposte
 */
export const formatParentInfo = (parent) => ({
    parentId: parent._id,
    parentName: `${parent.anagrafica.nome} ${parent.anagrafica.cognome}`,
    parentEmail: parent.anagrafica.email
});

/**
 * Formatta i dati dei bambini di un genitore
 */
export const formatChildren = (children = []) =>
    children.map(child => ({
        _id: child._id,
        name: child.name,
        avatar: child.avatar,
        pin: child.pin
    }));

/**
 * Aggiorna lo stato di una storia
 */
export const updateStoryStatus = async (story, status, reviewerId, reason = null) => {
    story.status = status;
    story.reviewedBy = reviewerId;
    story.reviewedAt = new Date();
    if (reason !== null) story.rejectionReason = reason;
    await story.save();
    return story;
};

/**
 * Notifica il genitore del cambio stato storia
 */
export const notifyStoryStatus = async (story, templateName, extraData = {}) => {
    try {
        const parent = await userModel.findById(story.userId);
        if (!parent) return;

        await sendEmail({
            to: parent.anagrafica.email,
            subject: templateName.includes('APPROVED') ? "Storia Approvata!" : "Storia Non Approvata",
            templateName,
            templateData: {
                parentName: parent.anagrafica.nome,
                storyTitle: story.title,
                ...extraData
            }
        });
    } catch (e) {
        console.log("Errore email (non bloccante):", e);
    }
};

/**
 * Verifica che il terapista possa accettare altri pazienti
 */
export const canAcceptMorePatients = (therapist, childrenCount) =>
    therapist.therapistInfo.currentChildren + childrenCount <= therapist.therapistInfo.maxChildren;

/**
 * Accetta un invito: aggiorna stato e contatori
 */
export const acceptInvitation = async (parent, therapist, therapistIndex) => {
    parent.therapists[therapistIndex].status = 'accepted';
    await parent.save();

    therapist.therapistInfo.currentChildren += parent.children.length;
    await therapist.save();
};

/**
 * Rifiuta un invito: rimuove la richiesta
 */
export const rejectInvitation = async (parent, therapistIndex) => {
    parent.therapists.splice(therapistIndex, 1);
    await parent.save();
};

/**
 * Notifica genitore dell'esito invito
 */
export const notifyInvitationResponse = async (parent, therapist, templateName) => {
    try {
        await sendEmail({
            to: parent.anagrafica.email,
            subject: templateName.includes('ACCEPTED') ? "Invito Accettato!" : "Aggiornamento Richiesta",
            templateName,
            templateData: {
                parentName: parent.anagrafica.nome,
                therapistName: `${therapist.anagrafica.nome} ${therapist.anagrafica.cognome}`
            }
        });
    } catch (e) {
        console.error(e);
    }
};