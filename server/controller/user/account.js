import { userModel } from "../../models/userModel.js";
import { sendEmail } from '../../utils/emailClient.js';
import { clearAuthCookie } from './helpers.js';
import crypto from 'crypto';

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

export const requestDeleteOtp = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.json({ success: false, message: 'Utente non trovato.' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.deleteOtp = hashOtp(otp);
        user.deleteOtpExpireAt = Date.now() + 15 * 60 * 1000;
        await user.save();

        await sendEmail({
            to: user.anagrafica.email,
            subject: "⚠️ Conferma Eliminazione Profilo",
            templateName: 'DELETE_OTP_TEMPLATE',
            templateData: { name: user.anagrafica.nome, otp }
        });

        res.json({ success: true, message: 'OTP inviato via email.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyDeleteAndDelete = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.json({ success: false, message: 'OTP mancante.' });
        }

        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.json({ success: false, message: 'Utente non trovato.' });
        }

        if (user.deleteOtp !== hashOtp(otp)) {
            return res.json({ success: false, message: 'OTP non valido.' });
        }

        if (user.deleteOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP scaduto.' });
        }

        await userModel.findByIdAndDelete(req.userId);
        clearAuthCookie(res);

        res.json({ success: true, message: 'Profilo eliminato con successo.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};