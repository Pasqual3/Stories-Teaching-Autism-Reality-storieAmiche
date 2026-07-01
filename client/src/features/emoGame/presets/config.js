/**
 * presets/config.js
 *
 * I preset vengono caricati dal backend (API Gateway → storage-service → Cloudinary).
 * Il client NON conosce l'esistenza dello storage-service.
 *
 * Endpoint: GET /api/emoGame/presets  (protetto da userAuth)
 * Risposta: { success: true, presets: { DifI: [...], DifII: [...], DifIII: [...] } }
 *
 * Esporta:
 *   usePresets()  → hook React per usare i preset in un componente
 *   getPresets()  → funzione async per caricarli fuori da React
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// =============================================
// CACHE IN MEMORIA (dura per tutta la sessione)
// =============================================
let _cachedPresets = null;
let _fetchPromise = null;

/**
 * Carica i preset dal backend.
 * Il risultato è tenuto in memoria: chiamate successive
 * restituiscono la cache senza fare rete.
 */
export const getPresets = async () => {
    if (_cachedPresets) return _cachedPresets;

    // Se c'è già una richiesta in volo, aspettiamo quella (evita doppio fetch)
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = axios
        .get(`${BACKEND_URL}/api/emoGame/presets`, { withCredentials: true })
        .then(res => {
            if (!res.data.success) throw new Error(res.data.message || 'Errore fetch preset');
            _cachedPresets = res.data.presets; // { DifI: [...], DifII: [...], DifIII: [...] }
            _fetchPromise = null;
            return _cachedPresets;
        })
        .catch(err => {
            _fetchPromise = null;
            console.error('❌ Impossibile caricare i preset:', err.message);
            return { DifI: [], DifII: [], DifIII: [] };
        });

    return _fetchPromise;
};

/**
 * Hook React per usare i preset in un componente.
 *
 * Uso:
 *   const { presets, isLoadingPresets } = usePresets();
 *   const items = presets[difficulty] || [];
 */
export const usePresets = () => {
    const [presets, setPresets] = useState(_cachedPresets || { DifI: [], DifII: [], DifIII: [] });
    const [isLoadingPresets, setIsLoadingPresets] = useState(!_cachedPresets);

    useEffect(() => {
        if (_cachedPresets) return; // già in cache, niente da fare

        let cancelled = false;
        setIsLoadingPresets(true);

        getPresets().then(data => {
            if (!cancelled) {
                setPresets(data);
                setIsLoadingPresets(false);
            }
        });

        return () => { cancelled = true; };
    }, []);

    return { presets, isLoadingPresets };
};