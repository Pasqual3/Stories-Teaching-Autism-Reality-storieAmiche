import storyModel from "../../models/storyModel.js";
import { storiesCache } from "./getStories.js";

export const toggleVisibility = async (req, res) => {
    try {
        const { storyId, isPublic } = req.body;

        const story = await storyModel.findOneAndUpdate(
            { _id: storyId, userId: req.userId },
            { isPublic },
            { new: true }
        );

        if (!story) {
            return res.json({ success: false, message: "Storia non trovata o non autorizzato" });
        }

        storiesCache.invalidate();
        res.json({ success: true, message: "Visibilità aggiornata", story });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};