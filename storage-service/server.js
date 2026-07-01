/**
 * storage-service
 * Microservizio dedicato alla gestione dei file su Cloudinary.
 * Tutti gli upload e le eliminazioni passano da qui.
 * Il server principale NON parla più direttamente con Cloudinary.
 */

import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5006;

app.use(express.json({ limit: '50mb' })); // 50mb per audio/video base64

// =============================================
// CONFIGURAZIONE CLOUDINARY
// =============================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// =============================================
// MULTER — memoria temporanea (NO disco locale)
// =============================================
const upload = multer({
    storage: multer.memoryStorage(), // File in RAM, mai su disco
    limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/', 'video/', 'audio/'];
        if (allowed.some(type => file.mimetype.startsWith(type))) {
            cb(null, true);
        } else {
            cb(new Error('Formato file non supportato'), false);
        }
    }
});

// =============================================
// HELPER: estrae public_id da URL Cloudinary
// =============================================
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Salta la versione (es. v1234567890)
    const afterUpload = parts.slice(uploadIndex + 1);
    const startIndex = afterUpload[0]?.match(/^v\d+$/) ? 1 : 0;
    const pathParts = afterUpload.slice(startIndex);

    // Rimuove l'estensione dall'ultimo segmento
    pathParts[pathParts.length - 1] = pathParts[pathParts.length - 1].split('.')[0];
    return pathParts.join('/');
};

// =============================================
// ENDPOINTS
// =============================================

// Healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'storage-service' });
});

// Upload file (immagine, video, audio) — riceve multipart/form-data
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nessun file ricevuto' });
        }

        const folder = req.body.folder || 'storie_amiche';
        const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

        // Upload da buffer in memoria — zero file locali
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder, resource_type: resourceType },
                (error, result) => error ? reject(error) : resolve(result)
            ).end(req.file.buffer);
        });

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type
        });

    } catch (error) {
        console.error('❌ Errore upload:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload audio base64 (usato dal TTS dell'AI service)
app.post('/upload-base64', async (req, res) => {
    try {
        const { base64Data, folder, format } = req.body;

        if (!base64Data) {
            return res.status(400).json({ success: false, message: 'Dati base64 mancanti' });
        }

        const result = await cloudinary.uploader.upload(
            `data:audio/${format || 'wav'};base64,${base64Data}`,
            { folder: folder || 'storie_amiche/audio', resource_type: 'video' }
        );

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        });

    } catch (error) {
        console.error('❌ Errore upload base64:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================================
// ENDPOINT: Lista preset EmoGame da Cloudinary
// Interroga la Cloudinary API e restituisce gli URL reali
// =============================================
app.get('/presets', async (req, res) => {
    try {
        const prefixes = [
            'emogame_media/presets/level1',
            'emogame_media/presets/level2',
            'emogame_media/presets/level3',
        ];

        const results = {};

        for (const prefix of prefixes) {
            // level3 contiene video
            const resourceType = prefix.includes('level3') ? 'video' : 'image';

            const response = await cloudinary.api.resources({
                type: 'upload',
                prefix,
                resource_type: resourceType,
                max_results: 50,
            });

            results[prefix] = (response.resources || []).map(r => ({
                publicId: r.public_id,
                url: r.secure_url,
                type: resourceType === 'video' ? 'video' : 'image',
                format: r.format,
            }));
        }

        res.json({ success: true, presets: results });

    } catch (error) {
        console.error('❌ Errore fetch preset:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================================
// ENDPOINT: Upload preset su Cloudinary
// Usato una sola volta per migrare i file da client/public/presets
// Riceve multipart/form-data con field "file" e body "level" e "id"
// Esempio: level="level1", id="happy"
// =============================================
app.post('/presets/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nessun file ricevuto' });
        }

        const { level, id } = req.body;
        if (!level || !id) {
            return res.status(400).json({ success: false, message: 'Parametri "level" e "id" obbligatori' });
        }

        // Valida il livello
        const allowedLevels = ['level1', 'level2', 'level3'];
        if (!allowedLevels.includes(level)) {
            return res.status(400).json({ success: false, message: `Livello non valido. Ammessi: ${allowedLevels.join(', ')}` });
        }

        const folder = `emogame_media/presets/${level}`;
        // level3 = video (mp4), level1/level2 = immagini
        const resourceType = level === 'level3' ? 'video' : 'image';

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: resourceType,
                    public_id: id,           // Nome file = id preset (es. "happy", "gift")
                    overwrite: true,         // Sovrascrive se già caricato (idempotente)
                    use_filename: false,
                },
                (error, result) => error ? reject(error) : resolve(result)
            ).end(req.file.buffer);
        });

        console.log(`✅ Preset caricato: ${folder}/${id} → ${result.secure_url}`);

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            level,
            id,
        });

    } catch (error) {
        console.error('❌ Errore upload preset:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Elimina file da Cloudinary tramite URL
app.delete('/delete', async (req, res) => {
    try {
        const { url, resourceType } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: 'URL mancante' });
        }

        const publicId = getPublicIdFromUrl(url);
        if (!publicId) {
            return res.status(400).json({ success: false, message: 'URL Cloudinary non valido' });
        }

        // Determina resource_type automaticamente se non fornito
        const rType = resourceType || (url.match(/\.(mp3|wav|ogg|m4a|mp4)$/i) ? 'video' : 'image');

        await cloudinary.uploader.destroy(publicId, { resource_type: rType });

        res.json({ success: true, message: 'File eliminato' });

    } catch (error) {
        console.error('❌ Errore eliminazione:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🗄️ Storage Service in esecuzione su: http://localhost:${PORT}`);
});