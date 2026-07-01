import mongoose from "mongoose";

// --- SOTTO-SCHEMA: PARAGRAFO (o SCENA) ---
// Ogni storia è composta da una serie di paragrafi scuri, ciascuno con testo, media opzionali e giochi
const paragraphSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    // Gestione Immagini/Audio/Video per singolo paragrafo
    mediaUrl: {
        type: String, // URL del file caricato (da /uploads/...)
        default: ""
    },
    mediaType: {
        type: String,
        enum: ['image', 'video', 'audio', 'none'],
        default: 'none'
    },
    altText: {
        type: String, // Testo alternativo per accessibilità (importantissimo per lettori di schermo)
        default: ""
    },
    // --- STILE VISIVO ---
    color: {
        type: String, // Colore di sfondo della scheda (default bianco)
        default: 'bg-white'
    },
    // --- GIOCO DI SEQUENZE ---
    isKeyStep: {
        type: Boolean, // Se True, questo paragrafo è una tappa fondamentale del 'Gioco di Riordino'
        default: false
    },
    gameText: {
        type: String, // Testo semplificato mostrato durante il gioco
        default: ""
    },
    // --- GIOCO DELLE EMOZIONI ---
    emotion: {
        type: String, // Emozione associata alla scena (Felice, Triste, ecc.)
        default: ""
    },
    // --- STRANGE STORIES TEST (Theory of Mind) ---
    strangeStoryTest: {
        active: {
            type: Boolean,
            default: false
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
            explanation: { type: String, default: '' }     // feedback per questa opzione
        }],
        correctAnswer: {
            type: String,
            default: ''
        },
        explanation: {
            type: String,
            default: ''
        }
    },
    // --- AUDIO NARRAZIONE (VibeVoice) SCENA PER SCENA ---
    narrationUrl: {
        type: String,
        default: ""
    }
});

// --- SCHEMA PRINCIPALE: STORIA ---
const storySchema = new mongoose.Schema({
    // --- PROPRIETARIO ---
    userId: {
        type: String, // ID del genitore o terapeuta che ha creato la storia
        required: true
    },
    // A quali PROFILI BAMBINO è assegnata questa storia?
    assignedChildren: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
        default: []
    },

    // --- METADATI STORIA ---
    title: {
        type: String,
        required: true
    },
    description: {
        type: String, // Breve riassunto per la card in dashboard
        default: ""
    },
    category: {
        type: String, // Es: "Emozioni", "Routine", "Scuola"
        default: "Social Story"
    },
    isPublic: {
        type: Boolean, // Se True, visibile a tutti nella Library pubblica
        default: true
    },

    // --- CONFIGURAZIONE GIOCO ---
    isSequencingGameActive: {
        type: Boolean, // Attiva o disattiva la modalità gioco per questa storia
        default: false
    },
    isEmotionGameActive: {
        type: Boolean, // Attiva o disattiva il gioco delle emozioni per questa storia
        default: false
    },
    isStrangeStoryActive: {
        type: Boolean, // Attiva o disattiva il test Strange Stories (Theory of Mind)
        default: false
    },

    // --- STILE GENERALE ---
    backgroundColor: {
        type: String,
        default: "#FFFFFF"
    },
    coverImage: {
        type: String, // Immagine di anteprima nella lista storie
        default: ''
    },

    // --- FLUSSO APPROVAZIONE (Per Terapeuti) ---
    // PENDING: Creata da genitore, in attesa di revisione
    // APPROVED: Approvata dal terapeuta (o creata da lui)
    // REJECTED: Rimandata indietro con modifiche
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'GENERATING_AUDIO'],
        default: 'PENDING'
    },
    rejectionReason: {
        type: String, // Messaggio del terapeuta se rifiuta
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },

    // --- CONTENUTO (Array di scene) ---
    paragraphs: [paragraphSchema],

    // --- AUDIO NARRAZIONE (VibeVoice) ---
    narrationUrl: {
        type: String, // File audio unico generato dall'IA
        default: ""
    },
    narrationSyncData: {
        type: Object, // Dati JSON per evidenziare le parole (Karaoke style)
        default: null
    },
    audioJobId: {
        type: String,
        default: ""
    },
    audioCompletionStatus: {
        type: String,
        default: ""
    },
    // --- SESSIONI DI GIOCO (Analytics) ---
    emotionGameSessions: [
        {
            childUserId: String,
            playedAt: { type: Date, default: Date.now },
            score: Number,
            total: Number,
            results: Array // Contiene [{ emotion, chosen, correct }]
        }
    ]
}, { timestamps: true });

// Controllo per evitare OverwriteModelError durante il riavvio del server
const storyModel = mongoose.models.story || mongoose.model("story", storySchema);

export default storyModel;