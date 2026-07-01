/**
 * validators.js
 * Regole di validazione input per tutte le rotte dell'applicazione.
 * Usa express-validator per controllare e sanitizzare i dati in entrata.
 * 
 * COME FUNZIONA:
 * 1. Ogni array di regole viene passato come middleware nella route
 * 2. Il controller chiama `handleValidation(req, res)` per verificare se ci sono errori
 * 
 * ESEMPIO USO NELLA ROUTE:
 *   authRouter.post('/register', validateRegister, register);
 * 
 * ESEMPIO NEL CONTROLLER:
 *   if (!handleValidation(req, res)) return;
 */

import { body, validationResult } from 'express-validator';

// ============================================================
// HELPER: Controlla gli errori di validazione
// Mettilo all'inizio di ogni controller che usa la validazione
// ============================================================
export const handleValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: errors.array()[0].msg // Mostra solo il primo errore
        });
        return false; // Segnala al controller di fermarsi
    }
    return true; // Tutto ok, continua
};

// ============================================================
// AUTH — REGISTER
// ============================================================
export const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Il nome è obbligatorio')
        .isLength({ min: 2, max: 50 }).withMessage('Il nome deve essere tra 2 e 50 caratteri')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Il nome contiene caratteri non validi'),

    body('surname')
        .trim()
        .notEmpty().withMessage('Il cognome è obbligatorio')
        .isLength({ min: 2, max: 50 }).withMessage('Il cognome deve essere tra 2 e 50 caratteri')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Il cognome contiene caratteri non validi'),

    body('email')
        .trim()
        .notEmpty().withMessage("L'email è obbligatoria")
        .isEmail().withMessage('Formato email non valido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La password è obbligatoria')
        .isLength({ min: 8 }).withMessage('La password deve essere di almeno 8 caratteri')
        .matches(/[A-Z]/).withMessage('La password deve contenere almeno una lettera maiuscola')
        .matches(/[0-9]/).withMessage('La password deve contenere almeno un numero'),

    body('userType')
        .trim()
        .notEmpty().withMessage('Il tipo utente è obbligatorio')
        .isIn(['adulto', 'terapeuta']).withMessage('Tipo utente non valido')
];

// ============================================================
// AUTH — LOGIN
// ============================================================
export const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage("L'email è obbligatoria")
        .isEmail().withMessage('Formato email non valido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La password è obbligatoria')
];

// ============================================================
// AUTH — RESET PASSWORD
// ============================================================
export const validateResetPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage("L'email è obbligatoria")
        .isEmail().withMessage('Formato email non valido')
        .normalizeEmail(),

    body('otp')
        .trim()
        .notEmpty().withMessage('Il codice OTP è obbligatorio')
        .isLength({ min: 6, max: 6 }).withMessage('Il codice OTP deve essere di 6 cifre')
        .isNumeric().withMessage('Il codice OTP deve contenere solo numeri'),

    body('newPassword')
        .notEmpty().withMessage('La nuova password è obbligatoria')
        .isLength({ min: 8 }).withMessage('La password deve essere di almeno 8 caratteri')
        .matches(/[A-Z]/).withMessage('La password deve contenere almeno una lettera maiuscola')
        .matches(/[0-9]/).withMessage('La password deve contenere almeno un numero')
];

// ============================================================
// AUTH — VERIFY OTP (verifica account o reset)
// ============================================================
export const validateOtp = [
    body('otp')
        .trim()
        .notEmpty().withMessage('Il codice OTP è obbligatorio')
        .isLength({ min: 6, max: 6 }).withMessage('Il codice OTP deve essere di 6 cifre')
        .isNumeric().withMessage('Il codice OTP deve contenere solo numeri')
];

// ============================================================
// AUTH — SEND OTP (solo email)
// ============================================================
export const validateEmail = [
    body('email')
        .trim()
        .notEmpty().withMessage("L'email è obbligatoria")
        .isEmail().withMessage('Formato email non valido')
        .normalizeEmail()
];

// ============================================================
// STORY — GENERA AUDIO
// singleScene=true → validazione scena singola (>=1 testo, >=10 caratteri)
// singleScene=false (default) → validazione storia completa (>=2 scene, >=100 caratteri)
// ============================================================
export const validateGenerateAudio = [
    body('texts')
        .isArray().withMessage('I testi delle scene devono essere forniti come array')
        .custom((value, { req }) => {
            const isSingleScene = req.body.singleScene === true || req.body.singleScene === 'true';
            const nonEmpty = value.filter(txt => txt && txt.trim().length > 0);

            if (isSingleScene) {
                if (nonEmpty.length < 1) {
                    throw new Error('Il testo della scena è obbligatorio.');
                }
                const len = nonEmpty.reduce((acc, txt) => acc + txt.trim().length, 0);
                if (len < 10) {
                    throw new Error('Il testo della scena deve essere di almeno 10 caratteri.');
                }
            } else {
                if (nonEmpty.length < 2) {
                    throw new Error('La storia deve avere almeno 2 scene con testo per la generazione audio.');
                }
                const totalLen = value.reduce((acc, txt) => acc + (txt ? txt.trim().length : 0), 0);
                if (totalLen < 100) {
                    throw new Error('Il testo totale della storia deve essere di almeno 100 caratteri.');
                }
                if (totalLen > 5000) {
                    throw new Error('Il testo totale della storia non può superare i 5000 caratteri.');
                }
            }
            return true;
        }),

    body('speakerName')
        .trim()
        .notEmpty().withMessage('La voce è obbligatoria'),

    body('speed')
        .optional()
        .isFloat({ min: 0.5, max: 2.0 }).withMessage('La velocità deve essere tra 0.5 e 2.0')
];

// ============================================================
// STORY — CREAZIONE / AGGIORNAMENTO
// ============================================================
export const validateStory = [
    body('title')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Il titolo può avere massimo 100 caratteri'),
    // .escape() rimosso: converte ' in &#x27; corrompendo titoli con apostrofi.
    // L'escape XSS va fatto in output (React), non in input.

    body('description')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 }).withMessage('La descrizione può avere massimo 500 caratteri'),
    // .escape() rimosso: stessa ragione del title.

    body('category')
        .optional()
        .trim()
        .isIn(['Socialità', 'Emozioni', 'Igiene', 'Salute', 'Routine', 'Scuola', 'Autonomia', 'Sicurezza', 'Altro']).withMessage('Categoria non valida'),

    body('isPublic')
        .optional(),

    body('paragraphs')
        .optional({ checkFalsy: true })
];