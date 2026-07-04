import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    register,
    login,
    logOut,
    sendVerifyOtp,
    verifyOtp,
    isUserAuthenticate,
    sendResetOtp,
    verifyResetOtp,
    resetPassword
    ,verifyPin
} from '../controllers/authController.js';
import { userAuth } from '../middleware/userAuth.js';

// Limite login/register: 20 tentativi / 15 min per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "⚠️ Troppi tentativi di accesso! Riprova tra 15 minuti." },
    skip: () => process.env.NODE_ENV === 'development'
});

// Limite OTP: 10 tentativi / 15 min per IP
// Protegge da brute-force su codici a 6 cifre
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "⚠️ Troppi tentativi OTP! Riprova tra 15 minuti." },
    skip: () => process.env.NODE_ENV === 'development'
});

export const authRouter = express.Router();

// --- 1. ROTTE DI ACCESSO E USCITA (PUBBLICHE) ---
authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.post('/logout', logOut);

// --- 2. ROTTE DI VERIFICA ACCOUNT (PROTETTE) ---
authRouter.post('/send-verify-otp', userAuth, otpLimiter, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, otpLimiter, verifyOtp);

// --- 3. ROTTA DI CONTROLLO STATO (PROTETTA) ---
authRouter.get('/is-auth', userAuth, isUserAuthenticate);

// Verifica PIN per accesso a sezioni sensibili (es. Analytics)
authRouter.post('/verify-pin', userAuth, verifyPin);

// --- 4. ROTTE RECUPERO PASSWORD (PUBBLICHE) ---
authRouter.post('/send-reset-otp', otpLimiter, sendResetOtp);
authRouter.post('/verify-reset-otp', otpLimiter, verifyResetOtp);
authRouter.post('/reset-password', otpLimiter, resetPassword);