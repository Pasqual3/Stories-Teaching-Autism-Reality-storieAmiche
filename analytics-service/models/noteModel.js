import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    childId: { type: String, required: true },
    therapistId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Note = mongoose.model('Note', noteSchema);