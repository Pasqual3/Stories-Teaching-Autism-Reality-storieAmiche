import React from 'react';

/**
 * Marcatori "invisibili" usati solo per la generazione audio (TTS).
 * Non vanno MAI mostrati a schermo: vengono semplicemente rimossi dal testo
 * prima del rendering.
 */
const AUDIO_ONLY_MARKERS = [
    /\{\{\s*PAUSA_CORTA\s*\}\}/gi,
    /\{\{\s*PAUSA_LUNGA\s*\}\}/gi,
    /\{\{\s*ENFASI\s*\}\}/gi,
];

/**
 * Marcatori di formattazione "a coppia" che vanno convertiti in vero
 * grassetto/corsivo invece di essere mostrati come testo grezzo.
 * Aggiungere qui eventuali nuovi tag (es. UNDERLINE) in futuro.
 */
const PAIRED_TAGS = [
    { open: '{{BOLD}}', close: '{{/BOLD}}', Tag: 'strong' },
    { open: '{{B}}', close: '{{/B}}', Tag: 'strong' },
    { open: '{{ITALIC}}', close: '{{/ITALIC}}', Tag: 'em' },
    { open: '{{I}}', close: '{{/I}}', Tag: 'em' },
];

/**
 * Rimuove i marcatori riservati al TTS (pause/enfasi) da un testo.
 * Da usare PRIMA di qualsiasi split per parole (es. evidenziazione testo
 * durante la lettura) così i marcatori non vengono mai contati come parole.
 */
export const stripAudioMarkers = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    let cleaned = text;
    AUDIO_ONLY_MARKERS.forEach((re) => { cleaned = cleaned.replace(re, ' '); });
    return cleaned.replace(/\s{2,}/g, ' ').trim();
};

/**
 * Come stripAudioMarkers, ma rimuove anche i tag di formattazione (BOLD/ITALIC)
 * mantenendo il testo contenuto al loro interno. Utile per contesti dove non
 * è possibile applicare lo stile reale (es. evidenziazione parola-per-parola
 * durante la lettura) ma serve comunque eliminare i marcatori grezzi.
 */
export const stripAllMarkersKeepText = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    let cleaned = stripAudioMarkers(text);
    PAIRED_TAGS.forEach(({ open, close }) => {
        cleaned = cleaned.replace(new RegExp(escapeRegex(open), 'gi'), '');
        cleaned = cleaned.replace(new RegExp(escapeRegex(close), 'gi'), '');
    });
    // rimuove eventuali tag residui/non riconosciuti
    cleaned = cleaned.replace(/\{\{\/?[A-Z_]+\}\}/gi, '');
    return cleaned.replace(/\s{2,}/g, ' ').trim();
};

/**
 * Trasforma un testo contenente marcatori {{BOLD}}...{{/BOLD}} / {{ITALIC}}...{{/ITALIC}}
 * (e rimuove eventuali marcatori audio-only) in un array di nodi React pronti
 * da renderizzare, con il grassetto/corsivo realmente applicato invece di
 * mostrare i tag come testo.
 *
 * Esempio:
 *   renderFormattedText('Ciao {{BOLD}}mondo{{/BOLD}}!')
 *   -> ['Ciao ', <strong>mondo</strong>, '!']
 */
export const renderFormattedText = (text) => {
    if (!text || typeof text !== 'string') return text;

    const cleaned = stripAudioMarkers(text);

    // Costruisce una regex unica che intercetta qualunque blocco {{TAG}}...{{/TAG}} noto
    const pattern = PAIRED_TAGS
        .map(({ open, close }) => `${escapeRegex(open)}([\\s\\S]*?)${escapeRegex(close)}`)
        .join('|');
    const regex = new RegExp(pattern, 'gi');

    const nodes = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(cleaned)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(cleaned.slice(lastIndex, match.index));
        }

        // Trova quale gruppo (quindi quale tag) ha matchato
        const groupValue = match.slice(1).find((g) => g !== undefined);
        const tagIndex = match.slice(1).findIndex((g) => g !== undefined);
        const { Tag } = PAIRED_TAGS[tagIndex] || { Tag: 'span' };

        nodes.push(React.createElement(Tag, { key: `fmt-${key++}` }, groupValue));
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < cleaned.length) {
        nodes.push(cleaned.slice(lastIndex));
    }

    // Pulizia finale: eventuali tag orfani/non riconosciuti non devono comparire
    return nodes.map((n) => (typeof n === 'string' ? n.replace(/\{\{\/?[A-Z_]+\}\}/gi, '') : n));
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Analizza il testo per la modalità Karaoke (lettura parola per parola).
 * Rimuove i marcatori audio, mantiene lo stato di formattazione (grassetto/corsivo)
 * e restituisce un array di oggetti: { text: "parola", isBold: true/false, isItalic: true/false }.
 */
export const parseTextForKaraoke = (text) => {
    if (!text || typeof text !== 'string') return [];
    
    const withoutAudio = stripAudioMarkers(text);
    // Split by markers or whitespace, preserving markers as distinct tokens
    const tokens = withoutAudio.split(/(\{\{.*?\}\}|\s+)/).filter(Boolean);
    
    const words = [];
    let isBold = false;
    let isItalic = false;
    
    for (const token of tokens) {
        if (token.match(/^\s+$/)) continue; // salta spazi bianchi puri
        
        const tUpper = token.toUpperCase();
        if (tUpper === '{{BOLD}}' || tUpper === '{{B}}') { isBold = true; continue; }
        if (tUpper === '{{/BOLD}}' || tUpper === '{{/B}}') { isBold = false; continue; }
        if (tUpper === '{{ITALIC}}' || tUpper === '{{I}}') { isItalic = true; continue; }
        if (tUpper === '{{/ITALIC}}' || tUpper === '{{/I}}') { isItalic = false; continue; }
        
        // Se è un token di testo (non un marcatore noto), ripuliamolo da marcatori residui e aggiungiamolo
        const cleanWord = token.replace(/\{\{\/?[A-Z_]+\}\}/gi, '');
        if (cleanWord) {
            words.push({ text: cleanWord, isBold, isItalic });
        }
    }
    
    return words;
};

/**
 * Mappa di fallback: alcune storie più vecchie hanno salvato nel campo "emoji"
 * un'etichetta testuale (es. "Felice", "Sospetto") invece del carattere emoji
 * vero e proprio. Qui la convertiamo nell'emoji corrispondente così non
 * compare mai testo grezzo al posto dell'icona.
 */
const LABEL_TO_EMOJI = {
    felice: '😊', contento: '😊', contenta: '😊', gentile: '😊', educato: '😊', educata: '😊',
    triste: '😢',
    arrabbiato: '😡', arrabbiata: '😡',
    spaventato: '😨', spaventata: '😨', paura: '😨',
    sorpreso: '😲', sorpresa: '😲',
    disgustato: '🤢', disgustata: '🤢',
    pensieroso: '🤔', pensierosa: '🤔', pensa: '🤔',
    sospetto: '🤨', sospettoso: '🤨', sospettosa: '🤨', dubbio: '🤨', dubbioso: '🤨',
    silenzio: '🤐', silenzioso: '🤐', silenziosa: '🤐', segreto: '🤐',
    imbarazzato: '😳', imbarazzata: '😳',
    confuso: '😕', confusa: '😕',
    curioso: '🧐', curiosa: '🧐',
    annoiato: '😑', annoiata: '😑',
    orgoglioso: '😌', orgogliosa: '😌',
    deluso: '😞', delusa: '😞',
    nervoso: '😬', nervosa: '😬',
    bugia: '🤥', mentire: '🤥', finto: '🎭', finta: '🎭',
};

/**
 * Restituisce un'emoji "vera" da mostrare per un'opzione, gestendo sia il
 * caso corretto (carattere emoji salvato) sia il caso legacy (parola
 * testuale salvata al posto dell'emoji). Se non si riconosce nulla, ritorna
 * il fallback di default (💭) invece del testo grezzo.
 */
export const resolveEmoji = (value, fallback = '💭') => {
    if (!value || typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    // Contiene già un vero carattere emoji (pittografico) -> usalo come è
    if (/\p{Extended_Pictographic}/u.test(trimmed)) return trimmed;

    // Etichetta testuale legacy (es. "Felice") -> mappa sull'emoji corrispondente
    const key = trimmed
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // rimuove accenti
    if (LABEL_TO_EMOJI[key]) return LABEL_TO_EMOJI[key];

    return fallback;
};
