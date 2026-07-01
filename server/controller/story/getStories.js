import storyModel from "../../models/storyModel.js";
import emoGameModel from "../../models/emoGameModel.js";
import { userModel } from "../../models/userModel.js";
import jwt from 'jsonwebtoken';

// Cache in-memory per le storie pubbliche approvate (home pubblica)
// Si invalida automaticamente ogni 5 minuti oppure quando viene approvata una storia
const storiesCache = {
    data: null,
    timestamp: 0,
    TTL_MS: 5 * 60 * 1000,

    isValid() {
        return this.data !== null && (Date.now() - this.timestamp) < this.TTL_MS;
    },

    set(stories) {
        this.data = stories;
        this.timestamp = Date.now();
    },

    invalidate() {
        this.data = null;
        this.timestamp = 0;
    }
};

export { storiesCache };

/**
 * GET /api/story/all
 *
 * Logica:
 * - Se l'utente NON è loggato (nessun token valido) → solo storie pubbliche APPROVED
 * - Se l'utente È loggato → storie pubbliche APPROVED  +  le proprie storie (qualsiasi status)
 *
 * Questo risolve il caso in cui il genitore crea una storia che finisce in PENDING
 * (perché ha un terapista collegato) e non la vede nella home.
 */
export const getAllStories = async (req, res) => {
    try {
        // --- Prova a identificare l'utente dal cookie (opzionale, no errore se assente) ---
        let currentUserId = null;
        const token = req.cookies?.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                currentUserId = decoded.id;
            } catch {
                // Token non valido o scaduto → trattato come non loggato
            }
        }

        // Helper: aggiunge authorName a ogni storia
        const addAuthorNames = async (stories) => {
            return Promise.all(stories.map(async (story) => {
                try {
                    const obj = story.toObject ? story.toObject() : story;
                    if (obj.authorName) return obj; // già popolato
                    const author = await userModel.findById(obj.userId).select('anagrafica');
                    return {
                        ...obj,
                        authorName: author
                            ? `${author.anagrafica.nome} ${author.anagrafica.cognome}`
                            : 'Anonimo'
                    };
                } catch {
                    return { ...(story.toObject ? story.toObject() : story), authorName: 'Anonimo' };
                }
            }));
        };

        // --- Utente non loggato: usa cache e ritorna solo storie pubbliche approvate ---
        if (!currentUserId) {
            if (storiesCache.isValid()) {
                return res.json({ success: true, stories: storiesCache.data, fromCache: true });
            }

            const [stories, emoGames] = await Promise.all([
                storyModel.find({ isPublic: true, status: 'APPROVED' }).sort({ createdAt: -1 }),
                emoGameModel.find({ isPublic: true, status: 'APPROVED' }).sort({ createdAt: -1 })
            ]);

            const [storiesWithAuthor, emoGamesWithAuthor] = await Promise.all([
                addAuthorNames(stories),
                addAuthorNames(emoGames)
            ]);

            const combined = [
                ...storiesWithAuthor.map((s) => ({ ...s, gameType: 'story' })),
                ...emoGamesWithAuthor.map((g) => ({ ...g, gameType: 'emoGame' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            storiesCache.set(combined);
            return res.json({ success: true, stories: combined });
        }

        // --- Utente loggato: solo storie pubbliche APPROVED ---
        // Le storie PENDING/GENERATING_AUDIO dell'utente non appaiono in home:
        // sono visibili esclusivamente nel profilo tramite getUserStories.
        const [stories, emoGames] = await Promise.all([
            storyModel.find({ isPublic: true, status: 'APPROVED' }).sort({ createdAt: -1 }),
            emoGameModel.find({ isPublic: true, status: 'APPROVED' }).sort({ createdAt: -1 })
        ]);

        // Deduplicazione: se una storia è sia pubblica che dell'utente, appare una volta sola
        const uniqueStories = Array.from(
            new Map(stories.map(s => [s._id.toString(), s])).values()
        );
        const uniqueEmoGames = Array.from(
            new Map(emoGames.map(g => [g._id.toString(), g])).values()
        );

        const [storiesWithAuthor, emoGamesWithAuthor] = await Promise.all([
            addAuthorNames(uniqueStories),
            addAuthorNames(uniqueEmoGames)
        ]);

        const combined = [
            ...storiesWithAuthor.map((s) => ({ ...s, gameType: 'story' })),
            ...emoGamesWithAuthor.map((g) => ({ ...g, gameType: 'emoGame' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({ success: true, stories: combined });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserStories = async (req, res) => {
    try {
        const stories = await storyModel.find({ userId: req.userId })
            .sort({ createdAt: -1 });
        res.json({ success: true, stories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStoryById = async (req, res) => {
    try {
        const story = await storyModel.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ success: false, message: 'Storia non trovata' });
        }

        const isOwner = story.userId.toString() === req.userId;
        const isPublicApproved = story.isPublic && story.status === 'APPROVED';

        if (!isPublicApproved && !isOwner) {
            const therapistUser = await userModel.findById(req.userId).select('tipo_utente');
            if (therapistUser?.tipo_utente === 'terapeuta') {
                const parent = await userModel.findOne({
                    _id: story.userId,
                    'therapists.therapistId': req.userId,
                    'therapists.status': 'accepted'
                });
                if (!parent) {
                    return res.status(403).json({ success: false, message: 'Non autorizzato.' });
                }
            } else {
                return res.status(403).json({ success: false, message: 'Non autorizzato.' });
            }
        }

        res.json({ success: true, story });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPublicStories = async (req, res) => {
    try {
        const stories = await storyModel.find({ isPublic: true, status: 'APPROVED' })
            .sort({ createdAt: -1 });

        const storiesWithAuthor = await Promise.all(
            stories.map(async (story) => {
                try {
                    const author = await userModel.findById(story.userId);
                    return {
                        ...story.toObject(),
                        authorName: author
                            ? `${author.anagrafica.nome} ${author.anagrafica.cognome}`
                            : 'Anonimo'
                    };
                } catch {
                    return { ...story.toObject(), authorName: 'Anonimo' };
                }
            })
        );

        res.json({ success: true, stories: storiesWithAuthor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getChildStories = async (req, res) => {
    try {
        const childToken = req.cookies.childToken;
        if (!childToken) {
            return res.status(401).json({ success: false, message: 'Sessione bambino non trovata.' });
        }

        const decoded = jwt.verify(childToken, process.env.JWT_SECRET);
        const parent = await userModel.findById(decoded.parentId);
        const child = parent?.children.id(decoded.childId);

        // 🌟 ALLINEAMENTO: Legge l'array delle storie direttamente dal profilo del bambino
        const assignedStoryIds = child?.stories || [];

        // Carica dal database solo le storie i cui ID sono presenti nell'array del bambino
        const stories = await storyModel.find({
            _id: { $in: assignedStoryIds }, // Filtra solo gli ID assegnati
            status: 'APPROVED'
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            stories,
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