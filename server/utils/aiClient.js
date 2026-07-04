/**
 * aiClient.js
 * Helper per comunicare con il microservizio AI (ai-service).
 * Il server principale NON lancia più Python direttamente:
 * delega tutto al microservizio dedicato tramite HTTP.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

/**
 * Genera audio tramite il microservizio ai-service (VibeVoice).
 * @param {Object} options
 * @param {Array<string>} options.texts   - Testi da convertire in audio per ogni scena
 * @param {string} options.storyTitle    - Titolo della storia (per log)
 * @param {string} options.speakerName   - Voce da usare (es. 'it-Spk0_woman')
 * @param {number} options.speed         - Velocità di lettura (es. 1.0)
 * @returns {Object} { success, jobId }
 */
export const generateAudio = async ({ texts, emotions, storyTitle, speakerName, speed }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2 * 60 * 1000); // 2 min — timeout per la richiesta di avvio job
    
    try {
        const response = await fetch(`${AI_SERVICE_URL}/generate-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts, emotions: emotions || [], storyTitle, speakerName, speed }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `AI Service ha risposto con status ${response.status}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
};

/**
 * Controlla se il microservizio AI è online e VibeVoice è configurato.
 * @returns {Object} { status, vibevoice_found }
 */
export const checkAIHealth = async () => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/health`, { method: 'GET' });
        return await response.json();
    } catch (error) {
        return { status: 'offline', error: error.message };
    }
};

/**
 * Ottiene la lista delle voci disponibili dal microservizio AI.
 * @returns {Object} { success, voices }
 */
export const getVoices = async () => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/voices`, {
            method: 'GET'
        });
        return await response.json();
    } catch (error) {
        console.error("Errore recupero voci AI:", error);
        return { success: false, voices: [] };
    }
};

/**
 * Controlla lo stato di un job audio in corso.
 * @param {string} jobId
 */
export const pollAudioJob = async (jobId) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/audio-status/${jobId}`, { method: 'GET' });
        return await response.json();
    } catch (error) {
        return { success: false, status: 'error', message: error.message };
    }
};

/**
 * Genera una narrazione adattiva (5 scene) tramite il microservizio ai-service (OpenRouter),
 * tenendo conto della baseline/stress del bambino calcolata dall'analytics-service.
 * @param {Object} options
 * @param {string} options.topic          - Argomento della storia
 * @param {string} options.initialEmotion - Emozione iniziale selezionata per il bambino
 * @param {string} [options.childName]    - Nome del bambino (opzionale)
 * @param {string} [options.stressLevel]  - Livello di stress calcolato (calm/mild/moderate/high)
 * @param {number} [options.stressIndex]  - Indice numerico di stress (0-100)
 * @returns {Object} { success, scenes, title, description, source }
 */
export const generateAdaptiveStory = async ({ topic, initialEmotion, childName, stressLevel, stressIndex }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60 * 1000); // 1 min

    try {
        const response = await fetch(`${AI_SERVICE_URL}/adaptive-story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, initialEmotion, childName, stressLevel, stressIndex }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `AI Service ha risposto con status ${response.status}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
};