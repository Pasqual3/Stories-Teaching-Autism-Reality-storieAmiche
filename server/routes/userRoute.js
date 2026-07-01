import express from 'express';
import {
    getUserData,
    updateProfile,
    verifyPassword,
    requestDeleteOtp,
    verifyDeleteAndDelete,
    addChild,
    getChildren,
    editChild,
    deleteChild,
    switchToChild,
    logoutChild,
    addTherapist,
    getTherapists,
    removeConnection,
    searchTherapists,
    getTherapistParents,
    verifyTherapistChildAccess
} from '../controller/userController.js';
import { userAuth } from '../middleware/userAuth.js';
import { upload } from '../middleware/uploadMiddleware.js';

const userRouter = express.Router();

// =============================================
// PROFILO UTENTE
// =============================================

/**
 * @openapi
 * /api/user/data:
 *   get:
 *     summary: Recupera i dati dell'utente autenticato
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dati utente recuperati con successo
 */
userRouter.get('/data', userAuth, getUserData);

/**
 * @openapi
 * /api/user/update-profile:
 *   put:
 *     summary: Aggiorna il profilo dell'utente
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profilo aggiornato
 */
userRouter.put('/update-profile', userAuth, upload.single('avatar'), updateProfile);

// FIX: Alias per compatibilità frontend che chiama /api/user/update
userRouter.put('/update', userAuth, upload.single('avatar'), updateProfile);

/**
 * @openapi
 * /api/user/request-delete-otp:
 *   post:
 *     summary: Richiede OTP per eliminazione account
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OTP inviato via email
 */
userRouter.post('/request-delete-otp', userAuth, requestDeleteOtp);

/**
 * @openapi
 * /api/user/delete-account:
 *   post:
 *     summary: Elimina l'account con verifica OTP
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account eliminato
 */
userRouter.post('/delete-account', userAuth, verifyDeleteAndDelete);

// =============================================
// GESTIONE BAMBINI
// =============================================

/**
 * @openapi
 * /api/user/add-child:
 *   post:
 *     summary: Aggiunge un profilo bambino
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Bambino aggiunto
 */
userRouter.post('/add-child', userAuth, upload.single('avatar'), addChild);

/**
 * @openapi
 * /api/user/children:
 *   get:
 *     summary: Recupera i profili bambino dell'utente
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista bambini
 */
userRouter.get('/children', userAuth, getChildren);

/**
 * @openapi
 * /api/user/edit-child/{childId}:
 *   put:
 *     summary: Modifica un profilo bambino
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bambino aggiornato
 */
userRouter.put('/edit-child/:childId', userAuth, upload.single('avatar'), editChild);

/**
 * @openapi
 * /api/user/delete-child/{childId}:
 *   delete:
 *     summary: Elimina un profilo bambino
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bambino eliminato
 */
userRouter.delete('/delete-child/:childId', userAuth, deleteChild);

/**
 * @openapi
 * /api/user/switch-child/{childId}:
 *   post:
 *     summary: Passa alla sessione bambino
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sessione bambino attivata
 */
userRouter.post('/switch-child/:childId', userAuth, switchToChild);

/**
 * @openapi
 * /api/user/logout-child:
 *   post:
 *     summary: Esce dalla sessione bambino
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sessione bambino terminata
 */
userRouter.post('/logout-child', userAuth, logoutChild);

// =============================================
// GESTIONE TERAPISTI
// =============================================

/**
 * @openapi
 * /api/user/add-therapist:
 *   post:
 *     summary: Aggiunge un terapista
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Terapista aggiunto
 */
userRouter.post('/add-therapist', userAuth, addTherapist);

/**
 * @openapi
 * /api/user/therapists:
 *   get:
 *     summary: Recupera i terapisti collegati
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista terapisti
 */
userRouter.get('/therapists', userAuth, getTherapists);

/**
 * @openapi
 * /api/user/remove-connection/{therapistId}:
 *   delete:
 *     summary: Rimuove connessione con terapista
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: therapistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Connessione rimossa
 */
userRouter.delete('/remove-connection/:therapistId', userAuth, removeConnection);

/**
 * @openapi
 * /api/user/search-therapists:
 *   get:
 *     summary: Cerca terapisti disponibili
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista terapisti trovati
 */
userRouter.get('/search-therapists', userAuth, searchTherapists);

// FIX: Supporto POST per compatibilità frontend
userRouter.post('/search-therapists', userAuth, searchTherapists);

// =============================================
// ANALYTICS (TERAPISTA)
// =============================================

/**
 * @openapi
 * /api/user/therapist/{therapistId}/parents:
 *   get:
 *     summary: Recupera i genitori collegati al terapista
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: therapistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista genitori
 */
userRouter.get('/therapist/:therapistId/parents', userAuth, getTherapistParents);

/**
 * @openapi
 * /api/user/therapist/{therapistId}/child/{childId}/verify:
 *   get:
 *     summary: Verifica accesso terapista al bambino
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: therapistId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Accesso verificato
 */
userRouter.get('/therapist/:therapistId/child/:childId/verify', userAuth, verifyTherapistChildAccess);

// PIN gate: verifica la password del terapista per accedere alla dashboard clinica
userRouter.post('/verify-password', userAuth, verifyPassword);

export default userRouter;