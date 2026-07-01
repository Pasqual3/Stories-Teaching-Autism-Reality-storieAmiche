import storyModel from "../../models/storyModel.js";
import emoGameModel from "../../models/emoGameModel.js";
import {
    findParentsByTherapist,
    findStoryForTherapist,
    formatParentInfo,
    updateStoryStatus,
    notifyStoryStatus
} from './helpers.js';
import { storiesCache } from '../story/getStories.js';

export const getPendingStories = async (req, res) => {
    try {
        const parents = await findParentsByTherapist(req.userId, 'accepted');
        const parentIds = parents.map(p => p._id.toString());

        // Support query param gameType=emoGame to request only EmoGames
        const { gameType } = req.query || {};

        if (gameType === 'emoGame') {
            const pendingEmo = await emoGameModel
                .find({ userId: { $in: parentIds }, status: 'PENDING' })
                .sort({ createdAt: -1 });

            const emoWithParent = await Promise.all(
                pendingEmo.map(async (story) => {
                    const parent = parents.find(p => p._id.toString() === story.userId.toString());
                    return {
                        ...story.toObject(),
                        ...formatParentInfo(parent || {})
                    };
                })
            );

            // mark as emoGame for the frontend
            const marked = emoWithParent.map(s => ({ ...s, gameType: 'emoGame' }));
            return res.json({ success: true, stories: marked });
        }

        // Default: return both pending stories and pending emoGames
        const [pendingStoriesRes, pendingEmo] = await Promise.all([
            storyModel.find({ userId: { $in: parentIds }, status: 'PENDING' }).sort({ createdAt: -1 }),
            emoGameModel.find({ userId: { $in: parentIds }, status: 'PENDING' }).sort({ createdAt: -1 })
        ]);

        const storiesWithParent = await Promise.all(
            pendingStoriesRes.map(async (story) => {
                const parent = parents.find(p => p._id.toString() === story.userId.toString());
                return {
                    ...story.toObject(),
                    ...formatParentInfo(parent || {})
                };
            })
        );

        const emoWithParent = await Promise.all(
            pendingEmo.map(async (story) => {
                const parent = parents.find(p => p._id.toString() === story.userId.toString());
                return {
                    ...story.toObject(),
                    ...formatParentInfo(parent || {})
                };
            })
        );

        const combined = [
            ...storiesWithParent.map(s => ({ ...s, gameType: 'story' })),
            ...emoWithParent.map(g => ({ ...g, gameType: 'emoGame' }))
        ];

        res.json({ success: true, stories: combined });

    } catch (error) {
        console.error("Errore getPendingStories:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const approveStory = async (req, res) => {
    try {
        const story = await findStoryForTherapist(req.params.storyId, req.userId);
        if (!story) {
            return res.json({ success: false, message: 'Storia non trovata.' });
        }

        await updateStoryStatus(story, 'APPROVED', req.userId);
        await notifyStoryStatus(story, 'STORY_APPROVED_TEMPLATE');

        // Invalida la cache: la nuova storia deve apparire subito in home
        storiesCache.invalidate();

        res.json({ success: true, message: 'Storia approvata con successo!' });

    } catch (error) {
        console.error("Errore approveStory:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectStory = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.json({ success: false, message: 'Motivazione richiesta.' });
        }

        const story = await findStoryForTherapist(req.params.storyId, req.userId);
        if (!story) {
            return res.json({ success: false, message: 'Storia non trovata.' });
        }

        await updateStoryStatus(story, 'REJECTED', req.userId, reason);
        await notifyStoryStatus(story, 'STORY_REJECTED_TEMPLATE', { rejectionReason: reason });

        storiesCache.invalidate();
        res.json({ success: true, message: 'Storia rifiutata.' });

    } catch (error) {
        console.error("Errore rejectStory:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};