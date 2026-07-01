import { userModel } from "../../models/userModel.js";
import {
    findParentsByTherapist,
    formatParentInfo,
    canAcceptMorePatients,
    acceptInvitation,
    rejectInvitation,
    notifyInvitationResponse
} from './helpers.js';

export const getPendingInvitations = async (req, res) => {
    try {
        const parents = await findParentsByTherapist(req.userId, 'pending');

        const invitations = parents.map(parent => ({
            ...formatParentInfo(parent),
            invitedAt: parent.therapists.find(t =>
                t.therapistId.toString() === req.userId
            )?.addedAt
        }));

        res.json({ success: true, invitations });

    } catch (error) {
        console.error("Errore getPendingInvitations:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const respondToInvitation = async (req, res) => {
    try {
        const { parentId, action } = req.body;

        if (!['accept', 'reject'].includes(action)) {
            return res.json({ success: false, message: "Azione non valida." });
        }

        const parent = await userModel.findById(parentId);
        if (!parent) {
            return res.json({ success: false, message: "Genitore non trovato." });
        }

        const therapist = await userModel.findById(req.userId);
        const therapistIndex = parent.therapists.findIndex(t =>
            t.therapistId.toString() === req.userId
        );

        if (therapistIndex === -1) {
            return res.json({ success: false, message: "Invito non trovato." });
        }

        if (action === 'accept') {
            if (!canAcceptMorePatients(therapist, parent.children.length)) {
                return res.json({ success: false, message: "Limite massimo pazienti raggiunto." });
            }

            await acceptInvitation(parent, therapist, therapistIndex);
            await notifyInvitationResponse(parent, therapist, 'INVITATION_ACCEPTED_TEMPLATE');

            return res.json({ success: true, message: "Invito accettato!" });
        }

        // reject
        await rejectInvitation(parent, therapistIndex);
        await notifyInvitationResponse(parent, therapist, 'INVITATION_REJECTED_TEMPLATE');

        res.json({ success: true, message: "Invito rifiutato." });

    } catch (error) {
        console.error("Errore respondToInvitation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};