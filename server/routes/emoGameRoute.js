import express from 'express';
import { createEmoGame } from '../controller/emoGame/createEmoGame.js';
import { updateEmoGame } from '../controller/emoGame/updateEmoGame.js';
import { getUserEmoGames, getEmoGameById, getChildEmoGames } from '../controller/emoGame/getEmoGames.js';
import { deleteEmoGame } from '../controller/emoGame/deleteEmoGame.js';
import { assignEmoGameToChildren, toggleEmoGameVisibility } from '../controller/emoGame/assignEmoGame.js';
import { saveEmoGameSession } from '../controller/emoGame/saveEmoGameSession.js';
import { getEmoGameSessions } from '../controller/emoGame/getEmoGameSessions.js';
import { generateAdaptiveStory } from '../controller/emoGame/generateAdaptiveStory.js';
import { userAuth } from '../middleware/userAuth.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validateStory } from '../middleware/validators.js';
import { getEmoGamePresets } from '../utils/storageClient.js';

const emoGameRouter = express.Router();

// Endpoint che restituisce i preset EmoGame con URL reali da Cloudinary
emoGameRouter.get('/presets', userAuth, async (req, res) => {
    try {
        const result = await getEmoGamePresets();
        if (!result.success) {
            return res.status(500).json({ success: false, message: 'Impossibile recuperare i preset da Cloudinary' });
        }

        // Mappiamo i prefix Cloudinary alle difficoltà dell'app
        const DIFFICULTY_MAP = {
            'emogame_media/presets/level1': 'DifI',
            'emogame_media/presets/level2': 'DifII',
            'emogame_media/presets/level3': 'DifIII',
        };

        // Nomi "friendly" per i preset (fallback se non riconosciuto)
        const FRIENDLY_NAMES = {
            happy: 'Felice', sad: 'Triste', angry: 'Arrabbiato', scared: 'Spaventato',
            surprised: 'Sorpreso', disgusted: 'Disgustato',
            gift: 'Compleanno / Regalo', broken_toy: 'Giocattolo Rotto',
            dark_room: 'Stanza Buia', playing: 'Giocare Insieme',
            dislike_food: 'Cibo Sgradevole', party: 'Festa a Sorpresa',
            laughing: 'Bambino Felice', crying: 'Bambino Triste',
            angry_kid: 'Bambino Arrabbiato', scared_kid: 'Bambino Spaventato',
            surprised_kid: 'Bambino Sorpreso', disapproving_kid: 'Bambino che disapprova',
        };

        const presets = {};
        for (const [prefix, items] of Object.entries(result.presets)) {
            const difficulty = DIFFICULTY_MAP[prefix];
            if (!difficulty) continue;
            presets[difficulty] = items.map(item => {
                const slug = item.publicId.split('/').pop();
                return {
                    id: slug,
                    name: FRIENDLY_NAMES[slug] || slug,
                    publicId: item.publicId,
                    url: item.url,
                    type: item.type,
                    format: item.format,
                    isPreset: true,
                };
            });
        }

        res.json({ success: true, presets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

emoGameRouter.post('/adaptive-story', userAuth, generateAdaptiveStory);
emoGameRouter.post('/create', userAuth, upload.any(), validateStory, createEmoGame);
emoGameRouter.get('/my-emogames', userAuth, getUserEmoGames);
emoGameRouter.get('/child-emogames', getChildEmoGames);
emoGameRouter.put('/toggle-visibility', userAuth, toggleEmoGameVisibility);
emoGameRouter.post('/assign-to-children', userAuth, assignEmoGameToChildren);
emoGameRouter.put('/update/:id', userAuth, upload.any(), validateStory, updateEmoGame);
emoGameRouter.delete('/delete/:id', userAuth, deleteEmoGame);
emoGameRouter.post('/:id/session', saveEmoGameSession);               // salva sessione gioco bambino
emoGameRouter.get('/:id/sessions/:childId', userAuth, getEmoGameSessions); // recap per genitore
emoGameRouter.get('/:id', getEmoGameById); // ⚠️ sempre in fondo

export default emoGameRouter;