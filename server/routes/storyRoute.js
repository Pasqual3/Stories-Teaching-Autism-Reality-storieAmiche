import express from 'express';
import {
    createStory,
    getAllStories,
    getUserStories,
    getStoryById,
    toggleVisibility,
    updateStory,
    deleteStory,
    assignStoryToChildren,
    getChildStories,
    getPublicStories,
    generateAudio,
    getAudioStatus,
    getAvailableVoices
} from '../controller/storyController.js';
import { saveEmotionResults } from '../controller/story/saveEmotionResults.js';
import { userAuth } from '../middleware/userAuth.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { audioLimiter } from '../middleware/rateLimiter.js';
import { validateGenerateAudio, validateStory } from '../middleware/validators.js';

const storyRouter = express.Router();

// =============================================
// 1. ROTTE SPECIFICHE (PATH FISSI)
// =============================================

/**
 * @openapi
 * /api/story/create:
 *   post:
 *     summary: Crea una nuova storia
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Storia creata con successo
 */
storyRouter.post('/create', userAuth, upload.any(), validateStory, createStory);

/**
 * @openapi
 * /api/story/all:
 *   get:
 *     summary: Recupera tutte le storie pubbliche approvate
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: Elenco di tutte le storie pubbliche
 */
storyRouter.get('/all', getAllStories);

/**
 * @openapi
 * /api/story/my-stories:
 *   get:
 *     summary: Ottiene le storie dell'utente loggato
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista storie dell'utente
 */
storyRouter.get('/my-stories', userAuth, getUserStories);

/**
 * @openapi
 * /api/story/generate-audio:
 *   post:
 *     summary: Genera audio tramite AI
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Audio generato con successo
 */
storyRouter.post('/generate-audio', userAuth, audioLimiter, validateGenerateAudio, generateAudio);

/**
 * @openapi
 * /api/story/audio-status/{jobId}:
 *   get:
 *     summary: Controlla lo stato di un job di generazione audio
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stato del job audio
 */
storyRouter.get('/audio-status/:jobId', userAuth, getAudioStatus);

/**
 * @openapi
 * /api/story/voices:
 *   get:
 *     summary: Recupera le voci AI disponibili
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: Lista delle voci disponibili
 */
storyRouter.get('/voices', getAvailableVoices);

/**
 * @openapi
 * /api/story/child-stories:
 *   get:
 *     summary: Recupera le storie assegnate al bambino attivo
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: Lista storie del bambino
 */
storyRouter.get('/child-stories', getChildStories);

/**
 * @openapi
 * /api/story/public-stories:
 *   get:
 *     summary: Recupera storie pubbliche con nome autore
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: Lista storie pubbliche con autore
 */
storyRouter.get('/public-stories', getPublicStories);

/**
 * @openapi
 * /api/story/toggle-visibility:
 *   put:
 *     summary: Cambia visibilità (pubblica/privata) della storia
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Stato visibilità aggiornato
 */
storyRouter.put('/toggle-visibility', userAuth, toggleVisibility);

/**
 * @openapi
 * /api/story/assign-to-children:
 *   post:
 *     summary: Assegna una storia a specifici bambini
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Storia assegnata con successo
 */
storyRouter.post('/assign-to-children', userAuth, assignStoryToChildren);

// =============================================
// 2. ROTTE CON PARAMETRI SPECIFICI
// =============================================

/**
 * @openapi
 * /api/story/update/{id}:
 *   put:
 *     summary: Aggiorna una storia esistente
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Storia aggiornata
 */
storyRouter.put('/update/:id', userAuth, upload.any(), validateStory, updateStory);

/**
 * @openapi
 * /api/story/delete/{id}:
 *   delete:
 *     summary: Elimina una storia
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Storia eliminata con successo
 */
storyRouter.delete('/delete/:id', userAuth, deleteStory);

/**
 * @openapi
 * /api/story/{id}/emotion-results:
 *   post:
 *     summary: Salva i risultati del Gioco delle Emozioni
 *     tags: [Stories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Risultati salvati
 */
storyRouter.post('/:id/emotion-results', userAuth, saveEmotionResults);

// =============================================
// 3. ROTTA DINAMICA GENERICA — DEVE ESSERE ULTIMA
// =============================================

/**
 * @openapi
 * /api/story/{id}:
 *   get:
 *     summary: Ottiene i dettagli di una singola storia
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dati della storia recuperati
 */
storyRouter.get('/:id', userAuth, getStoryById);

export default storyRouter;