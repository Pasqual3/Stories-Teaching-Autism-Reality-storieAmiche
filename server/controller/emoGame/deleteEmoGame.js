import emoGameModel from "../../models/emoGameModel.js";
import { extractMediaUrls, getResourceType } from '../story/helpers.js';
import { deleteFile } from '../../utils/storageClient.js';
import { storiesCache } from "../story/getStories.js";

export const deleteEmoGame = async (req, res) => {
    try {
        const { id } = req.params;
        const emoGame = await emoGameModel.findById(id);

        if (!emoGame) {
            return res.json({ success: false, message: 'EmoGame non trovato' });
        }

        if (emoGame.userId.toString() !== req.userId) {
            return res.json({ success: false, message: 'Non autorizzato a eliminare questo EmoGame.' });
        }

        // Pulizia file media da Cloudinary
        const mediaToCleanup = extractMediaUrls(emoGame);
        for (const item of mediaToCleanup) {
            const rType = (item.url.includes('/video/') || item.url.includes('/audio/') || item.type === 'video')
                ? 'video'
                : 'image';
            await deleteFile(item.url, rType);
        }

        await emoGameModel.findByIdAndDelete(id);
        storiesCache.invalidate();
        res.json({ success: true, message: 'EmoGame eliminato con successo!' });

    } catch (error) {
        console.error("Errore deleteEmoGame:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};