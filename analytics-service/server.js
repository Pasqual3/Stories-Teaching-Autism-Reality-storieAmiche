import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv/config';
import { connectDB } from './config/db.js';
import sessionRoutes from './routes/sessionRoutes.js';
import therapistRoutes from './routes/therapistRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import strangeStoryRoutes from './routes/strangeStoryRoutes.js';
import emoGameAnalyticsRoutes from './routes/emoGameAnalyticsRoutes.js';

const app = express();
const PORT = process.env.PORT || 5007;

// =============================================
// SICUREZZA
// =============================================
app.use(helmet());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Troppe richieste, riprova più tardi.' },
    skip: () => process.env.NODE_ENV === 'development'
});
app.use(generalLimiter);
app.use(mongoSanitize());

// =============================================
// MIDDLEWARES
// =============================================
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.startsWith('http://localhost')) return callback(null, true);
        const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true
}));

// =============================================
// CONNESSIONE DB
// =============================================
connectDB();

// =============================================
// ENDPOINTS
// =============================================

// Healthcheck — pubblico
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'analytics-service', timestamp: new Date().toISOString() });
});

// Route Strange Story — il POST deve essere pubblico per il frontend del bambino
app.use('/strange-story', strangeStoryRoutes);

// Tutte le route seguenti richiedono x-internal-api-key
app.use((req, res, next) => {
    const key = req.headers['x-internal-api-key'];
    if (!key || key !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({ success: false, message: 'Non autorizzato' });
    }
    next();
});

app.use('/session', sessionRoutes);
app.use('/therapist', therapistRoutes);
app.use('/note', noteRoutes);
app.use('/game', gameRoutes);
app.use('/emo-game', emoGameAnalyticsRoutes);

// =============================================
// ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
    console.error('❌ Errore non gestito:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
});

app.listen(PORT, () => {
    console.log(`📊 Analytics Service in esecuzione su: http://localhost:${PORT}`);
});