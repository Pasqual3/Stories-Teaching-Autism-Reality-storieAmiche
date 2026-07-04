import mongoose from "mongoose";

// --- SOTTO-SCHEMA: SCENA ---
// Versione ridotta rispetto a storyModel, ma ora con strangeStoryTest:
const emoGameSceneSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    mediaUrl: {
        type: String,
        default: ""
    },
    mediaType: {
        type: String,
        enum: ['image', 'video', 'audio', 'none'],
        default: 'none'
    },
    altText: {
        type: String,
        default: ""
    },
    gameType: {
        type: String,
        default: 'emoGame'
    },
    color: {
        type: String,
        default: 'bg-white'
    },
    isKeyStep: {
        type: Boolean,
        default: false
    },
    gameText: {
        type: String,
        default: ""
    },
    // Campo centrale dell'EmoGame: l'emozione associata alla scena
    emotion: {
        type: String,
        default: ""
    },
    // Suggerimento immagine generato dall'IA (Narrazione Adattiva), mostrato come badge nell'editor
    imageSuggestion: {
        type: String,
        default: ""
    },
    // Scena a bivio (Narrazione Adattiva): le opzioni cambiano il ramo della storia
    // invece di essere un quiz corretta/errata con punteggio
    isBranching: {
        type: Boolean,
        default: false
    },
    // --- STRANGE STORIES TEST (Theory of Mind) ---
    strangeStoryTest: {
        active: {
            type: Boolean,
            default: true // Always true for EmoGames
        },
        question: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            enum: ['libera', 'blocchi_testo', 'blocchi_immagine'],
            default: 'libera'
        },
        options: [{
            text: String,
            emoji: String,       // used for blocchi_testo
            imageUrl: String,    // used for blocchi_immagine (remote URL)
            isCorrect: { type: Boolean, default: null },   // null = non classificata
            score: { type: Number, default: null },        // punteggio opzionale
            explanation: { type: String, default: '' },    // feedback per questa opzione
            // --- Campi Narrazione Adattiva (scene a bivio) ---
            nextSceneText: { type: String, default: '' },  // testo del ramo mostrato se questa opzione è scelta
            nextSceneIndex: { type: Number, default: null } // indice scena a cui saltare (branching)
        }],
        correctAnswer: {
            type: String,
            default: ''
        },
        explanation: {
            type: String,
            default: ''
        }
    }
});

// --- SCHEMA PRINCIPALE: EMOGAME ---
const emoGameSchema = new mongoose.Schema({
    // --- PROPRIETARIO ---
    userId: {
        type: String,
        required: true
    },
    assignedChildren: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
        default: []
    },

    // --- METADATI ---
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: "Emozioni"
    },
    isPublic: {
        type: Boolean,
        default: true
    },

    // --- CAMPO SPECIFICO EMOGAME ---
    // DifI = Emoji, DifII = Immagini, DifIII = Video
    difficulty: {
        type: String,
        enum: ['DifI', 'DifII', 'DifIII'],
        default: 'DifI'
    },

    // --- CONFIGURAZIONE GIOCO ---
    isEmotionGameActive: {
        type: Boolean,
        default: false
    },
    isStrangeStoryActive: {
        type: Boolean,
        default: true
    },

    // --- STILE GENERALE ---
    backgroundColor: {
        type: String,
        default: "#FFFFFF"
    },
    coverImage: {
        type: String,
        default: ''
    },

    // --- FLUSSO APPROVAZIONE ---
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'],
        default: 'PENDING'
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },

    // --- SCENE ---
    paragraphs: [emoGameSceneSchema],

    // --- SESSIONI DI GIOCO (Analytics) ---
    emotionGameSessions: [
        {
            childUserId: String,
            playedAt: { type: Date, default: Date.now },
            score: Number,
            total: Number,
            results: Array,
            completed: { type: Boolean, default: false }
        }
    ]
}, { timestamps: true });

const emoGameModel = mongoose.models.emoGame || mongoose.model("emoGame", emoGameSchema);

export default emoGameModel;