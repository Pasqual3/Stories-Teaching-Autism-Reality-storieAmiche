/**
 * storageClient.js
 * Helper per comunicare con lo storage-service.
 * Il server principale NON parla più direttamente con Cloudinary:
 * delega tutto allo storage-service dedicato.
 */

import FormData from 'form-data';
import fetch from 'node-fetch';

const STORAGE_SERVICE_URL = process.env.STORAGE_SERVICE_URL || 'http://storage-service:5006';

/**
 * Carica un file (buffer) su Cloudinary tramite lo storage-service.
 * @param {Buffer} fileBuffer - Il file in memoria
 * @param {string} mimetype - Il tipo MIME del file
 * @param {string} folder - La cartella di destinazione su Cloudinary
 * @returns {{ success, url, publicId }}
 */
export const uploadFile = async (fileBuffer, mimetype, folder = 'storie_amiche') => {
    const formData = new FormData();
    formData.append('file', fileBuffer, { contentType: mimetype, filename: 'upload' });
    formData.append('folder', folder);

    const response = await fetch(`${STORAGE_SERVICE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
    });

    return await response.json();
};

/**
 * Carica un audio in formato base64 su Cloudinary tramite lo storage-service.
 * Usato per l'audio generato dall'AI service (TTS).
 * @param {string} base64Data - Audio codificato in base64
 * @param {string} folder - La cartella di destinazione
 * @param {string} format - Il formato audio (wav, mp3...)
 * @returns {{ success, url, publicId }}
 */
export const uploadAudioBase64 = async (base64Data, folder = 'storie_amiche/audio', format = 'wav') => {
    const response = await fetch(`${STORAGE_SERVICE_URL}/upload-base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, folder, format })
    });

    return await response.json();
};

/**
 * Elimina un file da Cloudinary tramite lo storage-service.
 * @param {string} url - L'URL completo del file Cloudinary da eliminare
 * @param {string} resourceType - 'image' o 'video' (audio = 'video' su Cloudinary)
 * @returns {{ success, message }}
 */
export const deleteFile = async (url, resourceType = null) => {
    if (!url) return { success: true };

    const response = await fetch(`${STORAGE_SERVICE_URL}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, resourceType })
    });

    return await response.json();
};

/**
 * Recupera i preset EmoGame direttamente da Cloudinary tramite lo storage-service.
 * @returns {{ success, presets: { [prefix]: Array<{publicId, url, type, format}> } }}
 */
export const getEmoGamePresets = async () => {
    const response = await fetch(`${STORAGE_SERVICE_URL}/presets`);
    return await response.json();
};
