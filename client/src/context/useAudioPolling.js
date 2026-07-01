// ─── useAudioPolling — Utility per il polling dello stato di un job audio ─────
// Non è un hook React nel senso stretto (nessuno useState/useEffect):
// è una funzione asincrona pura che astrae il loop di polling condiviso
// tra le 3 funzioni di generazione audio in appContext.jsx.
//
// Uso:
//   const result = await pollAudioJob(jobId, { ... });

import axios from 'axios';

const POLL_INTERVAL = 8000;       // ms tra ogni check
const MAX_WAIT_MS   = 20 * 60 * 1000; // 20 minuti di timeout massimo

/**
 * Esegue il loop di polling per un job audio già avviato sul backend.
 *
 * @param {string}   jobId            - ID del job (restituito dal backend all'avvio)
 * @param {string}   statusUrl        - URL completo per GET /audio-status/:jobId
 * @param {object}   opts
 * @param {React.MutableRefObject<boolean>} opts.isLoggedinRef - Ref al flag di login (ferma il loop al logout)
 * @param {function} opts.onDone      - Chiamata con `statusData` quando status === 'done'
 * @param {function} opts.onError     - Chiamata con `statusData` quando status === 'error'
 * @param {function} [opts.onExpired] - Chiamata quando status === 'expired' (solo resumeJob)
 * @param {function} opts.onProgress  - Chiamata ad ogni tick con { scene_done, scene_total, status, timeStr }
 * @param {function} opts.onTimeout   - Chiamata quando si supera MAX_WAIT_MS
 * @returns {Promise<'done'|'error'|'expired'|'timeout'|'logout'>}
 */
export const pollAudioJob = async (jobId, statusUrl, {
    isLoggedinRef,
    onDone,
    onError,
    onExpired,
    onProgress,
    onTimeout,
}) => {
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_WAIT_MS && isLoggedinRef.current) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL));

        // Interrotto per logout — fermati silenziosamente
        if (!isLoggedinRef.current) return 'logout';

        const elapsedSec    = Math.round((Date.now() - startTime) / 1000);
        const elapsedMin    = Math.floor(elapsedSec / 60);
        const elapsedSecRem = elapsedSec % 60;
        const timeStr       = elapsedMin > 0
            ? `${elapsedMin}m ${elapsedSecRem}s`
            : `${elapsedSec}s`;

        const { data: statusData } = await axios.get(statusUrl, { timeout: 15000 });

        if (statusData.status === 'done' && statusData.success) {
            await onDone(statusData, timeStr);
            return 'done';
        }

        if (statusData.status === 'error') {
            onError(statusData, timeStr);
            return 'error';
        }

        if (statusData.status === 'expired' && onExpired) {
            onExpired(statusData, timeStr);
            return 'expired';
        }

        // Tick intermedio: delega il calcolo del label e l'aggiornamento del toast al caller
        onProgress(statusData, timeStr);
    }

    if (!isLoggedinRef.current) return 'logout';

    onTimeout?.();
    return 'timeout';
};
