import express from 'express';
import {
    createSession,
    validateSession,
    getSessionsByChild,
    getBaseline,
    getSessionsByParent
} from '../controllers/sessionController.js';
import {
    validateSession as validateSessionBody,
    validateSessionId
} from '../middleware/validate.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

// Pubbliche (chiamate dal frontend durante la lettura)
router.post('/', validateSessionBody, createSession);

// Protette
router.get('/child/:childId', userAuth, getSessionsByChild);
router.get('/baseline/:childId', userAuth, getBaseline);
router.get('/parent/:parentId', userAuth, getSessionsByParent);

// Validazione terapeuta
router.put('/:sessionId/validate', userAuth, validateSessionId, validateSession);

export default router;