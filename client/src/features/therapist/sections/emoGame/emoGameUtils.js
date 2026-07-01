// ─── Costanti ed helper puri per EmoGame Analytics ───────────────────────────
// Questo file non ha dipendenze React: è importabile sia da hooks che da componenti UI.

export const BASE_EMOTIONS = ["Felicità", "Tristezza", "Rabbia", "Paura", "Sorpresa", "Disgusto"];

export const EMOTION_COLORS = {
    "Felicità": "#10b981",
    "Tristezza": "#3b82f6",
    "Rabbia":    "#ef4444",
    "Paura":     "#8b5cf6",
    "Sorpresa":  "#f97316",
    "Disgusto":  "#b45309"
};

/**
 * Genera un colore HSL deterministico per le emozioni personalizzate
 * (quelle non presenti in EMOTION_COLORS).
 */
export const getEmotionColor = (emotion) => {
    if (EMOTION_COLORS[emotion]) return EMOTION_COLORS[emotion];
    let hash = 0;
    for (let i = 0; i < emotion.length; i++) {
        hash = emotion.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 45%)`;
};

/**
 * Normalizza il testo di un'emozione verso le etichette canoniche.
 * Restituisce 'Altro' per testi chiaramente narrativi (troppo lunghi o non riconosciuti).
 */
export const normalizeEmotion = (emotionStr) => {
    if (!emotionStr) return 'Altro';
    const trimmed = emotionStr.trim();
    if (trimmed.length > 25) return 'Altro';
    const lower = trimmed.toLowerCase();
    if (lower.includes('felic') || lower.includes('happy') || lower === 'gioia') return 'Felicità';
    if (lower.includes('trist') || lower.includes('sad')   || lower === 'tristezza') return 'Tristezza';
    if (lower.includes('rabb')  || lower.includes('arrabb') || lower.includes('angr')) return 'Rabbia';
    if (lower.includes('paur')  || lower.includes('spavent') || lower.includes('scar')) return 'Paura';
    if (lower.includes('sorpr') || lower.includes('surpris') || lower.includes('stupor')) return 'Sorpresa';
    if (lower.includes('disgust') || lower.includes('dislik')) return 'Disgusto';
    if (lower.includes('eccit') || lower.includes('entus')) return 'Eccitazione';
    if (lower.includes('calm')  || lower.includes('sereni')) return 'Calma';
    return 'Altro';
};

/**
 * Estrae il timestamp di inizio sessione dall'ID di sessione.
 * Formato atteso: "ss-<timestamp_ms>-<suffix>"
 */
export const getSessionStartTime = (sessionId) => {
    if (!sessionId) return null;
    const parts = sessionId.split('-');
    if (parts.length >= 2) {
        const ts = parseInt(parts[1]);
        if (!isNaN(ts) && ts > 1000000000000) return ts;
    }
    return null;
};

/** Formatta una data ISO in formato italiano compatto con ora. */
export const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('it-IT', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
};

/** Restituisce il momento della giornata (Mattina / Pomeriggio / Sera / Notte) con colori CSS. */
export const getTimeOfDay = (dateString) => {
    const hour = new Date(dateString).getHours();
    if (hour >= 6  && hour < 12) return { label: 'Mattina',    color: 'bg-orange-50 text-orange-600' };
    if (hour >= 12 && hour < 18) return { label: 'Pomeriggio', color: 'bg-blue-50 text-blue-600' };
    if (hour >= 18 && hour < 22) return { label: 'Sera',       color: 'bg-purple-50 text-purple-600' };
    return { label: 'Notte', color: 'bg-slate-800 text-slate-100' };
};
