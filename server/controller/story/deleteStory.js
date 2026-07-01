import storyModel from "../../models/storyModel.js";
import { extractMediaUrls, getResourceType } from './helpers.js';
import { deleteFile } from '../../utils/storageClient.js';
import { storiesCache } from "./getStories.js";

export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await storyModel.findById(id);

        if (!story) {
            return res.json({ success: false, message: 'Storia non trovata' });
        }

        if (story.userId.toString() !== req.userId) {
            return res.json({ success: false, message: 'Non autorizzato a eliminare questa storia.' });
        }

        // Pulizia file
        const mediaToCleanup = extractMediaUrls(story);
        for (const item of mediaToCleanup) {
            const rType = (item.url.includes('/video/') || item.url.includes('/audio/') || item.type === 'video')
                ? 'video'
                : 'image';
            await deleteFile(item.url, rType);
        }

        await storyModel.findByIdAndDelete(id);
        storiesCache.invalidate();
        res.json({ success: true, message: 'Storia eliminata con successo!' });

    } catch (error) {
        console.error("Errore deleteStory:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};