import mongoose from 'mongoose';

const baselineSchema = new mongoose.Schema({
    childId: { type: String, required: true, unique: true },
    avgTimePerSlide: { type: Number, default: 0 },
    avgClicksPerSlide: { type: Number, default: 0 },
    avgMissClicksPerSlide: { type: Number, default: 0 },
    avgRageClicksPerSlide: { type: Number, default: 0 },
    avgHesitationTime: { type: Number, default: 0 },
    totalCalibrationSessions: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

export const Baseline = mongoose.model('Baseline', baselineSchema);