import express from 'express';
import { userAuth } from '../middleware/userAuth.js';
import {
    getPendingStories,
    approveStory,
    rejectStory,
    getAssignedChildren,
    getPendingInvitations,
    respondToInvitation
} from '../controller/approvalController.js';

const approvalRouter = express.Router();

// Therapist approval routes
/**
 * @openapi
 * /api/approval/pending-stories:
 *   get:
 *     summary: Elenca le storie in attesa di revisione (solo Terapisti)
 *     tags: [Therapist]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista storie pendenti
 */
approvalRouter.get('/pending-stories', userAuth, getPendingStories);

/**
 * @openapi
 * /api/approval/approve/{storyId}:
 *   post:
 *     summary: Approva una storia (solo Terapisti)
 *     tags: [Therapist]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Storia approvata
 */
approvalRouter.post('/approve/:storyId', userAuth, approveStory);

/**
 * @openapi
 * /api/approval/reject/{storyId}:
 *   post:
 *     summary: Rifiuta una storia con motivazione (solo Terapisti)
 *     tags: [Therapist]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Storia rifiutata
 */
approvalRouter.post('/reject/:storyId', userAuth, rejectStory);

approvalRouter.get('/assigned-children', userAuth, getAssignedChildren);

/**
 * @openapi
 * /api/approval/invitations:
 *   get:
 *     summary: Elenca gli inviti pendenti per il terapista
 *     tags: [Therapist]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista inviti
 */
approvalRouter.get('/invitations', userAuth, getPendingInvitations);

/**
 * @openapi
 * /api/approval/respond-invitation:
 *   post:
 *     summary: Accetta o rifiuta un invito (solo Terapisti)
 *     tags: [Therapist]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Risposta inviata
 */
approvalRouter.post('/respond-invitation', userAuth, respondToInvitation);

export default approvalRouter;
