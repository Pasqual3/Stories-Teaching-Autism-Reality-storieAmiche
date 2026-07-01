import cloudinary from '../config/cloudinary.js';

/**
 * Estrae il public_id di Cloudinary da un URL.
 * Esempio: "https://res.cloudinary.com/demo/image/upload/v1234/storie/audio.wav" -> "storie/audio"
 */
export const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1]; // "audio.wav"
    const fileName = lastPart.split('.')[0];   // "audio"

    // Cerchiamo se c'è una cartella (es. 'storie') prima del nome file
    // Cloudinary include spesso folder_name/public_id
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
        // Se ci sono sottocartelle dopo 'upload/v...'
        const folderParts = parts.slice(uploadIndex + 2, parts.length - 1);
        if (folderParts.length > 0) {
            return [...folderParts, fileName].join('/');
        }
    }

    return fileName;
};

/**
 * Rimuove un file da Cloudinary dato il suo URL.
 */
export const removeFromCloudinary = async (url) => {
    if (!url) return;
    try {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
            console.log(`Eliminazione da Cloudinary: ${publicId}`);

            // Determiniamo il resource_type (audio, video o image) dall'estensione
            let resourceType = 'image';
            if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) resourceType = 'video'; // Cloudinary tratta l'audio come 'video'

            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        }
    } catch (error) {
        console.error('Errore durante la rimozione da Cloudinary:', error.message);
    }
};
