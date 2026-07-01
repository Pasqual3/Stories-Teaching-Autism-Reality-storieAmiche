import express from 'express';
import { saveResponse, getResponsesByChild } from '../controllers/strangeStoryController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.post('/', saveResponse);                              // chiamata dal frontend bambino
router.get('/child/:childId', userAuth, getResponsesByChild); // chiamata dal terapista

export default router;