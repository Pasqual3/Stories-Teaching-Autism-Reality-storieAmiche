import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import transporter from './config/nodemailer.js';
import * as ENUM_TEMPLATES from './config/emailTemplates.js';

const app = express();
const PORT = process.env.PORT || 5008;
const MONITORING_SERVICE_URL = process.env.MONITORING_SERVICE_URL || 'http://monitoring-service:5005';

app.use(express.json());
app.use(cors());

// Healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'email-service' });
});

// Utility per i log centralizzati
const sendLog = async (level, message, metadata = {}) => {
    try {
        await fetch(`${MONITORING_SERVICE_URL}/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level, service: 'email-service', message, metadata })
        });
    } catch (e) {
        console.log("⚠️ Errore comunicazione monitoraggio:", e.message);
    }
};

// Endpoint per inviare email asincrone
app.post('/send', async (req, res) => {
    try {
        const { to, subject, templateName, templateData, customHtml } = req.body;

        if (!to || !subject) {
            return res.status(400).json({ success: false, message: 'Destinatario e Oggetto mancanti.' });
        }

        let html = customHtml || "";

        // Gestione Template
        if (templateName && ENUM_TEMPLATES[templateName]) {
            html = ENUM_TEMPLATES[templateName];
            if (templateData && typeof templateData === 'object') {
                for (const [key, value] of Object.entries(templateData)) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    html = html.replace(regex, value);
                }
            }
        }

        const mailOption = {
            from: process.env.SENDER_EMAIL || process.env.SMTP_USER || 'no-reply@storieamiche.com',
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOption);
        
        await sendLog('info', `Email inviata a ${to}`, { subject, messageId: info.messageId });

        return res.json({ success: true, message: 'Email inviata con successo!', messageId: info.messageId });

    } catch (error) {
        await sendLog('error', `Fallimento invio email a ${req.body?.to}`, { error: error.message });
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    sendLog('info', `Email Service avviato correttamente sulla porta ${PORT}`);
});
