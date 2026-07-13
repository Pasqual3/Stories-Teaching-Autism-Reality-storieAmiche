import { generateAudio as aiGenerateAudio, checkAIHealth, pollAudioJob } from '../../utils/aiClient.js';
import { uploadAudioBase64, deleteFile } from '../../utils/storageClient.js';
import { logger } from '../../utils/logger.js';
import { handleValidation } from '../../middleware/validators.js';
import storyModel from '../../models/storyModel.js';

export const generateAudio = async (req, res) => {
    try {
        if (!handleValidation(req, res)) return;

        const { texts, storyTitle, speakerName, speed } = req.body;

        const health = await checkAIHealth();
        if (health.status === 'offline' || !health.status) {
            return res.status(503).json({ success: false, message: 'Microservizio AI non raggiungibile.' });
        }

        // Recupera emozioni dal DB se storyId presente
        let emotions = [];
        if (req.body.storyId) {
            try {
                const story = await storyModel.findById(req.body.storyId).select('paragraphs.emotion').lean();
                if (story?.paragraphs) {
                    emotions = story.paragraphs.map(p => p.emotion || null);
                }
            } catch (e) {
                logger.warn('Impossibile recuperare emozioni dal DB, uso NLP fallback', { storyId: req.body.storyId });
            }
        }

        // Avvia job in background
        const aiResult = await aiGenerateAudio({
            texts,
            emotions,
            storyTitle,
            speakerName: speakerName || 'sara',
            speed: speed || 0.9
        });

        if (!aiResult.success || !aiResult.jobId) {
            return res.status(500).json({ success: false, message: aiResult.message || 'Errore avvio generazione audio' });
        }

        if (req.body.storyId) {
            try {
                const story = await storyModel.findById(req.body.storyId);
                if (story) {
                    story.status = 'GENERATING_AUDIO';
                    story.audioJobId = aiResult.jobId;
                    story.audioCompletionStatus = req.body.intendedStatus || '';
                    await story.save();
                }
            } catch (error) {
                logger.error('Errore aggiornamento story audioJobId', { error: error.message, storyId: req.body.storyId });
            }
        }

        return res.json({ success: true, jobId: aiResult.jobId, status: 'queued' });

    } catch (error) {
        logger.error('Errore generateAudio', { error: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAudioStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await pollAudioJob(jobId);

        // Riporta la storia a bozza dopo un fallimento irreversibile (es. upload Cloudinary),
        // così l'utente può rigenerare l'audio invece di restare bloccato su GENERATING_AUDIO.
        const resetStoryToDraft = async () => {
            try {
                await storyModel.updateOne(
                    { audioJobId: jobId },
                    { $set: { status: 'DRAFT', audioJobId: '', audioCompletionStatus: '' } }
                );
            } catch (dbErr) {
                logger.error('Errore reset story dopo fallimento upload', { error: dbErr.message, jobId });
            }
        };

        // Job scaduto — reset story
        if (!result.success && result.status === 'not_found') {
            try {
                await storyModel.updateOne(
                    { audioJobId: jobId },
                    { $set: { status: 'DRAFT', audioJobId: '', audioCompletionStatus: '' } }
                );
            } catch (dbErr) {
                logger.error('Errore reset story dopo job expired', { error: dbErr.message });
            }
            return res.json({ success: false, status: 'expired', message: 'Job scaduto o non trovato. La storia è stata reimpostata a bozza.' });
        }

        if (!result.success && result.status !== 'processing' && result.status !== 'queued') {
            return res.status(500).json(result);
        }

        if (result.status === 'done') {
            // ── FALLBACK BROWSER TTS: crediti ElevenLabs esauriti ─────────────
            if (result.use_browser_tts) {
                try {
                    await storyModel.updateOne(
                        { audioJobId: jobId },
                        { $set: { status: 'DRAFT', audioJobId: '', audioCompletionStatus: '' } }
                    );
                } catch (dbErr) {
                    logger.error('Errore reset story per browser TTS', { error: dbErr.message });
                }
                return res.json({ success: true, status: 'done', use_browser_tts: true,
                                  message: result.message || 'Crediti ElevenLabs esauriti.' });
            }

            // ── MODALITÀ ELEVENLABS: file audio unico ──────────────────────────
            if (result.mode === 'single' && result.audioData) {
                try {
                    const uploadResponse = await uploadAudioBase64(result.audioData);

                    return res.json({
                        success:         true,
                        status:          'done',
                        mode:            'single',
                        audioUrls:       [uploadResponse.url],
                        sceneTimestamps: result.sceneTimestamps || [],
                        syncDataArray:   result.syncDataArray   || []
                    });
                } catch (uploadErr) {
                    logger.error('Errore upload Cloudinary (single)', { error: uploadErr.message, jobId });
                    await resetStoryToDraft();
                    return res.status(502).json({
                        success: false,
                        status:  'error',
                        message: `Audio generato ma upload su Cloudinary fallito: ${uploadErr.message}`
                    });
                }
            }

            // ── MODALITÀ ELEVENLABS: file audio splittati per scena ────────────
            if (result.mode === 'split' && result.audioDataArray) {
                try {
                    const uploadPromises = result.audioDataArray.map(base64Data => uploadAudioBase64(base64Data));
                    const uploadResponses = await Promise.all(uploadPromises);
                    const audioUrls = uploadResponses.map(r => r.url);

                    return res.json({
                        success:         true,
                        status:          'done',
                        mode:            'split',
                        audioUrls:       audioUrls,
                        sceneTimestamps: result.sceneTimestamps || [],
                        syncDataArray:   result.syncDataArray   || []
                    });
                } catch (uploadErr) {
                    logger.error('Errore upload Cloudinary (split)', { error: uploadErr.message, jobId });
                    await resetStoryToDraft();
                    return res.status(502).json({
                        success: false,
                        status:  'error',
                        message: `Audio generato ma upload su Cloudinary fallito: ${uploadErr.message}`
                    });
                }
            }
        }

        // Ancora in elaborazione
        return res.json({
            success:     true,
            status:      result.status,
            scene_done:  result.scene_done  ?? null,
            scene_total: result.scene_total ?? null,
            position:    result.position    ?? null
        });

    } catch (error) {
        logger.error('Errore getAudioStatus', { error: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAvailableVoices = async (req, res) => {
    try {
        const { getVoices: aiGetVoices } = await import('../../utils/aiClient.js');
        const data = await aiGetVoices();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Impossibile recuperare le voci AI' });
    }
};