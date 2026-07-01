import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import 'dotenv/config';

import { authRouter } from './routes/authRoutes.js';
import { runCleanupJob } from './services/cleanupService.js';

const app = express();
const PORT = process.env.PORT || 5009;
const MONGODB_URI = process.env.MONGODB_URI;

// =============================================
// SICUREZZA — HELMET
// =============================================
app.use(helmet());

// =============================================
// RATE LIMITING
// =============================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: "⚠️ Troppe richieste! Per favore, riprova tra 15 minuti." }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: "⚠️ Troppi tentativi di accesso! Per favore, riprova tra 15 minuti." }
});

app.use(generalLimiter);

// =============================================
// MIDDLEWARES
// =============================================
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

// CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.startsWith('http://localhost')) return callback(null, true);
        callback(null, true);
    },
    credentials: true
}));

// =============================================
// CONNESSIONE DATABASE
// =============================================
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Auth-Service connesso a MongoDB'))
    .catch(err => console.error('❌ Errore MongoDB (Auth):', err));

// =============================================
// ROTTE
// =============================================
app.use('/', authRouter);

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

// =============================================
// AVVIO SERVER
// =============================================
app.listen(PORT, () => {
    console.log(`🚀 Auth-Service in esecuzione sulla porta ${PORT}`);
    
    // Avvia il job di pulizia per account non verificati:
    // prima esecuzione 1 minuto dopo lo startup del server, poi ogni 12 ore.
    setTimeout(() => {
        runCleanupJob().catch(err => console.error('[cleanup-job-startup] Errore:', err.message));
    }, 60 * 1000);

    setInterval(() => {
        runCleanupJob().catch(err => console.error('[cleanup-job-interval] Errore:', err.message));
    }, 12 * 60 * 60 * 1000);
});