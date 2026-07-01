import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());
app.use(cors());

// =============================================
// SCHEMA DEI LOG SU MONGODB
// =============================================
const logSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    level: { type: String, required: true, enum: ['info', 'warn', 'error', 'debug'] },
    service: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} }
});

const Log = mongoose.model('Log', logSchema);

// =============================================
// CONNESSIONE AL DATABASE
// =============================================
if (!MONGODB_URI) {
    console.error('❌ ERRORE: MONGODB_URI non definita nelle variabili d\'ambiente!');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Monitoring Service connesso a MongoDB'))
    .catch(err => console.error('❌ Errore connessione MongoDB (Monitoring):', err));

// =============================================
// ENDPOINTS
// =============================================

// Healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'monitoring-service' });
});

// Ricezione Log
app.post('/log', async (req, res) => {
    try {
        const { level, service, message, metadata } = req.body;

        if (!level || !service || !message) {
            return res.status(400).json({ success: false, message: 'Dati log incompleti' });
        }

        const newLog = new Log({ level, service, message, metadata });
        await newLog.save();

        // Stampiamo anche sulla console di Docker per visibilità immediata
        const emoji = level === 'error' ? '🔴' : (level === 'warn' ? '🟡' : '🔵');
        console.log(`${emoji} [${service.toUpperCase()}] ${message}`);

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Errore salvataggio log:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/logs', async (req, res) => {
    try {
        const { level } = req.query;
        const filter = level ? { level } : {};
        const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Monitoring Service in esecuzione su: http://localhost:${PORT}`);
});
