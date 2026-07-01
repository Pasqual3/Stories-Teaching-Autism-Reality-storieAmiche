import express from 'express';
import { recordGameSession, getGameSessionsByChild } from '../controllers/gameController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

// Rotta per registrare i risultati (chiamata dal frontend gioco)
router.post('/', recordGameSession);

// Rotta per recuperare i risultati (usata nella dashboard)
router.get('/child/:childId', userAuth, getGameSessionsByChild);

export default router;
