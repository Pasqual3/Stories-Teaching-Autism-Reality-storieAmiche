import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL del monitoring service
const MONITORING_URL = process.env.MONITORING_SERVICE_URL || 'http://monitoring-service:5005';

// Definizione del formato dei log
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Formato per la console (più leggibile con emoji)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        const emoji = level.includes('error') ? '🔴' : level.includes('warn') ? '🟡' : level.includes('debug') ? '⚪' : '🔵';
        let metaString = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
        return `${emoji} [${timestamp}] ${level}: ${message} ${stack || ''} ${metaString}`;
    })
);

// Creazione del logger Winston
const winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'server' },
    transports: [
        // Salvataggio degli errori su file
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Salvataggio di tutti i log su file
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Stampa su console
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

// Funzione helper per inviare log al monitoring service (non bloccante)
const notifyMonitoring = async (level, message, metadata) => {
    try {
        await fetch(`${MONITORING_URL}/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level, service: 'server', message, metadata }),
            signal: AbortSignal.timeout(2000)
        });
    } catch {
        // Ignorato se il monitoring è offline
    }
};

export const logger = {
    info: (message, metadata = {}) => {
        winstonLogger.info(message, metadata);
        notifyMonitoring('info', message, metadata);
    },
    warn: (message, metadata = {}) => {
        winstonLogger.warn(message, metadata);
        notifyMonitoring('warn', message, metadata);
    },
    error: (message, metadata = {}) => {
        winstonLogger.error(message, metadata);
        notifyMonitoring('error', message, metadata);
    },
    debug: (message, metadata = {}) => {
        winstonLogger.debug(message, metadata);
        notifyMonitoring('debug', message, metadata);
    },
};
