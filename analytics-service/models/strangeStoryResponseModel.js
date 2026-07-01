import mongoose from 'mongoose';

const strangeStoryResponseSchema = new mongoose.Schema({
    childId:          { type: String, required: true },
    storyId:          { type: String, required: true },
    parentId:         { type: String, required: true },
    sceneIndex:       { type: Number, required: true },
    sessionId:        { type: String },
    domanda:          { type: String, default: '' },
    tipo:             { type: String, enum: ['libera', 'blocchi_testo', 'blocchi_immagine'] },
    risposta:         { type: String, required: true },
    rispostaImageUrl: { type: String, default: '' },
    rispostaCorretta: { type: String, default: '' },
    isCorretta:       { type: String, default: null },
    targetEmotion:    { type: String, default: '' },
    gameType:         { type: String, default: '' },

    playedAt: { type: Date, default: Date.now }
});

export default mongoose.model('StrangeStoryResponse', strangeStoryResponseSchema);