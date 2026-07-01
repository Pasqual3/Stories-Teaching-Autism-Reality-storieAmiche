// IMPORTAZIONI PRINCIPALI
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

import { connectDB } from './config/mongoDbConnection.js';
import userRouter from './routes/userRoute.js';
import storyRouter from './routes/storyRoute.js';
import approvalRouter from './routes/approvalRoute.js';
import emoGameRouter from './routes/emoGameRoute.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Connessione DB
connectDB().then(async () => {
  logger.info("📡 Connessione a MongoDB stabilita con successo.");
  try {
    const mongoose = await import('mongoose');
    await mongoose.connection.collection('users').dropIndex('email_1');
  } catch (e) {
    // Ignoriamo l'errore se l'indice non esiste già
  }
}).catch(err => {
  logger.error("❌ Fallimento connessione MongoDB:", { error: err.message });
});

// =============================================
// SICUREZZA
// =============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(mongoSanitize());
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost')) return callback(null, true);
    const allowedOrigins = [
      process.env.FRONTEND_URL
    ].filter(Boolean);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));

// =============================================
// RATE LIMITING
// =============================================
app.use(generalLimiter);
app.use('/uploads', express.static('uploads'));

// =============================================
// API ENDPOINTS
// =============================================
app.get('/', (req, res) => {
  res.send('<h1>API Gateway — Storie Amiche! 🌈</h1>');
});


// =============================================
// PROXY AUTH → auth-service:5009
// PRIMA di express.json()!
// =============================================
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente (Genitore o Terapista)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Registrazione completata
 * /api/auth/login:
 *   post:
 *     summary: Effettua il login
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login effettuato (cookie impostato)
 * /api/auth/logout:
 *   post:
 *     summary: Effettua il logout
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout effettuato
 */
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:5009',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
  on: { proxyReq: fixRequestBody },
}));

// =============================================
// PROXY ANALYTICS → analytics-service:5007
// =============================================
app.use('/api/analytics', createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:5007',
  changeOrigin: true,
  pathRewrite: { '^/api/analytics': '' },
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('x-internal-api-key', process.env.INTERNAL_API_KEY);
      // Forward the raw cookie header so userAuth in analytics-service can read the JWT token
      if (req.headers.cookie) {
        proxyReq.setHeader('cookie', req.headers.cookie);
      }
      fixRequestBody(proxyReq, req, res);
    }
  },
  cookieDomainRewrite: '',
}));

// =============================================
// PROXY AI → ai-service:5001
// =============================================
app.use('/api/ai', createProxyMiddleware({
  target: process.env.AI_SERVICE_URL || 'http://ai-service:5001',
  changeOrigin: true,
  pathRewrite: { '^/api/ai': '' },
  on: { proxyReq: fixRequestBody },
  cookieDomainRewrite: '',
}));

// =============================================
// EXPRESS.JSON() — SOLO DOPO IL PROXY
// =============================================
app.use(express.json({ limit: '10mb' }));

// =============================================
// ROTTE INTERNE
// =============================================
app.use('/api/user', userRouter);
app.use('/api/story', storyRouter);
app.use('/api/approval', approvalRouter);
app.use('/api/emoGame', emoGameRouter);

// =============================================
// ERROR HANDLER
// =============================================
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`🚀 API Gateway in esecuzione su: http://localhost:${PORT}`);
  server.timeout = 15 * 60 * 1000; // 15 minuti — necessario per generazione audio AI
  server.keepAliveTimeout = 15 * 60 * 1000;
});