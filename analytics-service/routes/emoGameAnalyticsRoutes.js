import express from 'express';
import { saveEmoGameResponse } from '../controllers/emoGameAnalyticsController.js';

const router = express.Router();

router.post('/response', saveEmoGameResponse); // Ingestione singola risposta bambino

export default router;
