import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    tipo_utente: {
        type: String,
        required: true,
        default: 'adulto',
        enum: ['bambino', 'adulto', 'terapeuta']
    },
    seguito_da: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    anagrafica: {
        nome: { type: String, required: true },
        cognome: { type: String, required: true },
        codice_fiscale: { type: String, unique: true, sparse: true },
        eta: { type: Number },
        telefono: { type: String },
        email: { type: String, required: true, unique: true }
    },
    login: {
        password: { type: String, required: true },
        nuovo_utente: { type: Boolean, default: true }
    },
    profilo: {
        livello: { type: Number, default: 1 },
        punti_totali: { type: Number, default: 0 },
        avatar: { type: String, default: "" }
    },
    isAccountVerified: { type: Boolean, default: false },
    verificationWarningSent: { type: Boolean, default: false },
    verifyOtp: { type: String, default: '' },
    verifyOtpExpireAt: { type: Number, default: 0 },
    resetOtp: { type: String, default: '' },
    resetOtpExpireAt: { type: Number, default: 0 },
    deleteOtp: { type: String, default: '' },
    deleteOtpExpireAt: { type: Number, default: 0 },
    children: [{
        name: { type: String, required: true },
        avatar: { type: String, default: 'FaChild' },
        pin: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    }],
    therapistInfo: {
        specialization: { type: String, default: '' },
        maxChildren: { type: Number, default: 10 },
        currentChildren: { type: Number, default: 0 },
        pin: { type: String, default: '' }
    },
    therapists: [{
        therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted'], default: 'pending' }
    }]
}, { timestamps: true });

export const userModel = mongoose.model("User", userSchema);