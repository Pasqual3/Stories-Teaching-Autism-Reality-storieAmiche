import emoGameModel from "../../models/emoGameModel.js";
import jwt from 'jsonwebtoken';
import { userModel } from "../../models/userModel.js";

export const getUserEmoGames = async (req, res) => {
    try {
        const emoGames = await emoGameModel
            .find({ userId: req.userId })
            .sort({ createdAt: -1 });
        // A
        res.json({
            success: true,
            stories: emoGames.map(g => ({ ...g.toObject(), gameType: 'emoGame' }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getEmoGameById = async (req, res) => {
    try {
        const emoGame = await emoGameModel.findById(req.params.id);
        if (!emoGame) {
            return res.status(404).json({ success: false, message: 'EmoGame non trovato' });
        }
        res.json({ success: true, story: emoGame });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Per uso futuro: bambino che gioca agli EmoGame assegnati
export const getChildEmoGames = async (req, res) => {
    try {
        const childToken = req.cookies.childToken;
        if (!childToken) {
            return res.status(401).json({ success: false, message: 'Sessione bambino non trovata.' });
        }

        const decoded = jwt.verify(childToken, process.env.JWT_SECRET);
        const parent = await userModel.findById(decoded.parentId);
        const child = parent?.children.id(decoded.childId);

        // Return emoGames assigned to the child regardless of approval status
        const emoGames = await emoGameModel.find({
            assignedChildren: decoded.childId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            stories: emoGames,
            child: {
                name: child?.name || decoded.childName,
                id: decoded.childId,
                avatar: child?.avatar || decoded.avatar || 'FaChild'
            }
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Sessione bambino scaduta.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};