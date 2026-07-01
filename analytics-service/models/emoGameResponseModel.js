import mongoose from 'mongoose';

const emoGameResponseSchema = new mongoose.Schema({
    childId: { type: String, required: true, index: true },
    storyId: { type: String, required: true },
    parentId: { type: String, required: true },
    sessionId: { type: String, required: true, index: true }, // ID della sessione per raggruppamento
    sceneIndex: { type: Number, required: true },
    targetEmotion: { type: String, required: true }, // Emozione target (es: Felicità, Paura...)
    selectedEmotion: { type: String, required: true }, // Emozione inserita/cliccata dal bambino
    questionMode: { type: String, enum: ['ricettiva', 'espressiva'], required: true }, // Tipo di domanda
    levelOfAbstraction: { type: String, required: true }, // Livello (es: DifI, DifII, DifIII)
    hesitationTime: { type: Number, required: true }, // Tempo di esitazione (in millisecondi)
    score: { type: Number, required: true }, // Punteggio assegnato alla risposta (0-10)
    isCorrect: { type: Boolean, required: true }, // Indica se la risposta è corretta
    playedAt: { type: Date, default: Date.now, index: true }
});

// Indice composto per ottimizzare le interrogazioni cliniche e gli upsert
emoGameResponseSchema.index({ sessionId: 1, storyId: 1, sceneIndex: 1 }, { unique: true });

export default mongoose.model('EmoGameResponse', emoGameResponseSchema);
