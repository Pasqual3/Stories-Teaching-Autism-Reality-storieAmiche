/**
 * rateLimiter.js
 * Middleware di protezione contro abusi e attacchi brute-force.
 * Usa express-rate-limit per limitare le richieste per IP.
 */

import rateLimit from 'express-rate-limit';

// ============================================================
// LIMITE GENERALE (tutte le rotte)
// 100 richieste ogni 15 minuti per IP
// ============================================================
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "⚠️ Troppe richieste! Per favore, riprova tra 15 minuti." },
    skip: () => process.env.NODE_ENV === 'development'
});

// ============================================================
// LIMITE AUTH (login, register, OTP)
// 10 tentativi ogni 15 minuti per IP — protegge da brute-force
// ============================================================
export const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "⚠️ Troppi tentativi di accesso! Per favore, riprova tra 15 minuti." },
    skip: () => process.env.NODE_ENV === 'development'
});

// ============================================================
// LIMITE GENERAZIONE AUDIO
// 15 generazioni ogni ora per IP — è un'operazione costosa
// ============================================================
export const audioLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "⚠️ Limite generazioni audio raggiunto! Per favore, riprova tra 1 ora." },
    skip: () => process.env.NODE_ENV === 'development'
});


// Limite OTP: 10 tentativi / 15 min per IP
// Impedisce brute-force su codici a 6 cifre (1.000.000 combinazioni)
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "⚠️ Troppi tentativi OTP! Per favore, riprova tra 15 minuti." },
    skip: () => process.env.NODE_ENV === 'development'
});
 
