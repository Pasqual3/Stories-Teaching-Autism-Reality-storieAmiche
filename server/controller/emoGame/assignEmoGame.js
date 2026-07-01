import emoGameModel from "../../models/emoGameModel.js";
import { storiesCache } from "../story/getStories.js";

export const assignEmoGameToChildren = async (req, res) => {
    try {
        const { storyId, childrenIds } = req.body;

        if (!storyId || !Array.isArray(childrenIds)) {
            return res.json({ success: false, message: 'Dati mancanti o non validi' });
        }

        // Cerca l'EmoGame per ID senza vincolo userId,
        // poi verifica che l'utente sia il creatore OPPURE il terapista che l'ha approvato
        const emoGame = await emoGameModel.findById(storyId);
        if (!emoGame) {
            return res.json({ success: false, message: 'EmoGame non trovato' });
        }

        const isCreator = emoGame.userId === req.userId;
        const isReviewer = emoGame.reviewedBy && emoGame.reviewedBy.toString() === req.userId;

        if (!isCreator && !isReviewer) {
            return res.json({ success: false, message: 'Non sei autorizzato ad assegnare questo EmoGame' });
        }

        const existing = emoGame.assignedChildren?.map(id => id.toString()) || [];
        emoGame.assignedChildren = [...new Set([...existing, ...childrenIds])];
        await emoGame.save();

        res.json({
            success: true,
            message: 'EmoGame assegnato ai bambini selezionati!',
            assignedChildren: emoGame.assignedChildren
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleEmoGameVisibility = async (req, res) => {
    try {
        const { storyId, isPublic } = req.body;

        const emoGame = await emoGameModel.findOneAndUpdate(
            { _id: storyId, userId: req.userId },
            { isPublic },
            { new: true }
        );

        if (!emoGame) {
            return res.json({ success: false, message: "EmoGame non trovato o non autorizzato" });
        }

        storiesCache.invalidate();

        res.json({ success: true, message: "Visibilità aggiornata", story: emoGame });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};