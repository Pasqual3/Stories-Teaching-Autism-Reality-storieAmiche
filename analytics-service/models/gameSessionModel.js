import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  childId: { type: String, required: true },
  storyId: { type: String, required: true },
  gameType: { type: String, enum: ['sequencing', 'emotion_matching'], required: true },
  totalMoves: { type: Number, default: 0 },
  correctMoves: { type: Number, default: 0 },
  wrongMoves: { type: Number, default: 0 },
  
  accuracy: { type: String, default: "" },
  
  avgHesitationTime: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  finalScore: { type: Number, default: 0 },
  deviceType: String,
  
  moves: { type: String, default: "" },
  
  playedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('GameSession', gameSessionSchema);