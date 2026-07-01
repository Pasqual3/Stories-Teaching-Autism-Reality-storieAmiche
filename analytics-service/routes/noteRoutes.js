import express from 'express';
import {
    createNote,
    getNotes,
    deleteNote
} from '../controllers/noteController.js';
import {
    validateNote,
    validateNoteId
} from '../middleware/validate.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.post('/:therapistId/child/:childId', userAuth, validateNote, createNote);
router.get('/:therapistId/child/:childId', userAuth, getNotes);
router.delete('/:noteId', userAuth, validateNoteId, deleteNote);

export default router;