import mongoose from 'mongoose';

// Puoi lasciare definito slideDataSchema nel caso ti serva in altre parti del microservizio,
// ma all'interno della Sessione ora salveremo la stringa cifrata.
const slideDataSchema = new mongoose.Schema({
    slideIndex: { type: Number },
    timeSpent: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    missClicks: { type: Number, default: 0 },
    rageClicks: { type: Number, default: 0 },
    hesitationTime: { type: Number, default: 0 },
    dwellTime: { type: Number, default: 0 },
    reversedFrom: { type: Boolean, default: false },
    totalRandomClicks: { type: Number, default: 0 },
    randomClicks: { type: Number, default: 0 },
    pageVisibilitySwitches: { type: Number, default: 0 }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
    childId: { type: String, required: true },
    storyId: { type: String, required: true },
    parentId: { type: String, required: true },
    deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
    timeOfDay: { type: String },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    totalDuration: { type: Number, default: 0 },
    totalSlides: { type: Number, required: true },
    lastSlideReached: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    completedStory: { type: Boolean, default: false },
    dropOffSlide: { type: Number, default: null },
    totalClicks: { type: Number, default: 0 },
    totalMissClicks: { type: Number, default: 0 },
    totalRageClicks: { type: Number, default: 0 },
    totalPageReversals: { type: Number, default: 0 },
    avgHesitationTime: { type: Number, default: 0 },
    totalRandomClicks: { type: Number, default: 0 },
    pageVisibilitySwitches: { type: Number, default: 0 },
    slideData: { type: String, default: "" },
    stressIndex: { type: String, default: "" },
    stressLevel: { type: String, default: "" },
    stressBreakdown: { type: String, default: "" },
    therapistValidated: { type: Boolean, default: false },
    therapistNotes: { type: String, default: '' },
    isCalibrationSession: { type: Boolean, default: false },
    sessionType: { type: String, enum: ['strangeStory', 'emoGame'], default: 'strangeStory' }
}, { timestamps: true });

export const Session = mongoose.model('Session', sessionSchema);