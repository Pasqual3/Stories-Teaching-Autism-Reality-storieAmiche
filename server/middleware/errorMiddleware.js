/**
 * errorMiddleware.js
 * Gestione centralizzata degli errori.
 * Deve essere l'ULTIMO middleware registrato in server.js
 */

import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Errore interno del server';

    // Logghiamo l'errore nel monitoring service
    logger.error(`❌ ${req.method} ${req.path} - ${message}`, {
        statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Errore interno del server' : message
    });
};
