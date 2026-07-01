import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI non definita!');
    process.exit(1);
}

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Analytics Service connesso a MongoDB');
    } catch (err) {
        console.error('❌ Errore connessione MongoDB:', err);
        process.exit(1);
    }
};