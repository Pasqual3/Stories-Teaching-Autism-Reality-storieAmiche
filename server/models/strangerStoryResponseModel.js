import mongoose from 'mongoose';

const strangeStoryResponseSchema = new mongoose.Schema({
    childId: { type: String, required: true },
    storyId: { type: String, required: true },
    parentId: { type: String, required: true },
    sceneIndex: { type: Number, required: true },       // quale scena (0, 1, 2...)
    domanda: { type: String, default: '' },             // testo della domanda (per storico)
    type: { type: String, enum: ['libera', 'multipla'] },
    response: { type: String, required: true },         // risposta del bambino
    correctAnswer: { type: String, default: '' },    // risposta corretta impostata dal terapista
    isCorrect: { type: Boolean, default: null },       // null = non valutata (libera), true/false per multipla
    playedAt: { type: Date, default: Date.now }
});

export default mongoose.model('StrangeStoryResponse', strangeStoryResponseSchema);