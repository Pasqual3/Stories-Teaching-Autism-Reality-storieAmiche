import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dati non validi',
            errors: errors.array()
        });
    }
    next();
};

// Validatori sessione
export const validateSession = [
    body('childId').notEmpty().withMessage('childId obbligatorio'),
    body('storyId').notEmpty().withMessage('storyId obbligatorio'),
    body('parentId').notEmpty().withMessage('parentId obbligatorio'),
    body('totalSlides').isInt({ min: 1 }).withMessage('totalSlides deve essere >= 1'),
    handleValidationErrors
];

export const validateSessionId = [
    param('sessionId').isMongoId().withMessage('sessionId non valido'),
    handleValidationErrors
];

// Validatori note
export const validateNote = [
    param('therapistId').notEmpty().withMessage('therapistId obbligatorio'),
    param('childId').notEmpty().withMessage('childId obbligatorio'),
    body('content').notEmpty().withMessage('Contenuto nota obbligatorio'),
    handleValidationErrors
];

export const validateNoteId = [
    param('noteId').isMongoId().withMessage('noteId non valido'),
    handleValidationErrors
];

// Validatori terapeuta
export const validateTherapistId = [
    param('therapistId').notEmpty().withMessage('therapistId obbligatorio'),
    handleValidationErrors
];

export const validateChildAccess = [
    param('therapistId').notEmpty().withMessage('therapistId obbligatorio'),
    param('childId').notEmpty().withMessage('childId obbligatorio'),
    handleValidationErrors
];