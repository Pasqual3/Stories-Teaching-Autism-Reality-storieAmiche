import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import { userModel } from '../models/userModel.js';
import { sendEmail } from '../utils/emailClient.js';

// Hash leggero per OTP (non serve bcrypt lento — SHA-256 è sufficiente per codici a 6 cifre con scadenza breve)
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// ============================================================
// REGISTRAZIONE
// ============================================================
export const register = async (req, res) => {
    const { name, surname, email, password, userType } = req.body;

    if (!name || !surname || !email || !password || !userType) {
        return res.status(400).json({ success: false, error: "Dettagli mancanti." });
    }

    try {
        const existingUser = await userModel.findOne({ 'anagrafica.email': email });
        if (existingUser) {
            return res.status(409).json({ success: false, error: "Email già registrata" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = new userModel({
            tipo_utente: userType.toLowerCase(),
            anagrafica: { nome: name, cognome: surname, email: email },
            login: { password: hashedPassword, nuovo_utente: true },
            profilo: { livello: 1, punti_totali: 0, avatar: "" },
            isAccountVerified: false,
            verifyOtp: '', verifyOtpExpireAt: 0,
            resetOtp: '', resetOtpExpireAt: 0,
            deleteOtp: '', deleteOtpExpireAt: 0
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Fire-and-forget: l'email di benvenuto NON blocca la risposta.
        // Se il provider SMTP è giù, l'utente ha già il cookie valido e
        // l'account creato — non deve vedere un errore 500 né ritrovarsi
        // con "account già esistente" al secondo tentativo.
        sendEmail({
            to: email,
            subject: "Benvenuto in Storie Amiche!",
            customHtml: `<h2>Ciao ${name}, il tuo account è pronto!</h2>`
        }).catch((err) => {
            console.error('[register] Invio email di benvenuto fallito (non critico):', err.message);
        });

        return res.status(201).json({ success: true, message: "Registrazione completata!" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// LOGIN
// ============================================================
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ 'anagrafica.email': email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Credenziali errate" });
        }

        const isMatch = await bcryptjs.compare(password, user.login.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Credenziali errate" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            message: "Login effettuato",
            user: {
                name: user.anagrafica.nome,
                email: user.anagrafica.email,
                tipo_utente: user.tipo_utente
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// LOGOUT
// ============================================================
export const logOut = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });
        return res.json({ success: true, message: "Logout effettuato" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// INVIO OTP VERIFICA ACCOUNT
// ============================================================
export const sendVerifyOtp = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Utente non trovato" });
        }
        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account già verificato" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = hashOtp(otp);
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const emailResult = await sendEmail({
            to: user.anagrafica.email,
            subject: "Codice Verifica Account",
            templateName: 'EMAIL_VERIFY_TEMPLATE',
            templateData: { otp, email: user.anagrafica.email }
        });

        if (!emailResult || !emailResult.success) {
            // Se l'invio fallisce, resettiamo l'OTP nel DB così da evitare stati incoerenti
            user.verifyOtp = '';
            user.verifyOtpExpireAt = 0;
            await user.save();
            return res.status(500).json({ success: false, message: "Invio email fallito. Servizio temporaneamente non disponibile." });
        }

        res.json({ success: true, message: "OTP inviato!" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// VERIFICA ACCOUNT (OTP)
// ============================================================
export const verifyOtp = async (req, res) => {
    const { otp } = req.body;

    try {
        const user = await userModel.findById(req.userId);
        if (!user || user.verifyOtp !== hashOtp(otp) || user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP non valido o scaduto" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        res.json({ success: true, message: "Account verificato!" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// CHECK AUTH STATUS
// ============================================================
export const isUserAuthenticate = async (req, res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// VERIFICA PIN TERAPEUTA
// BUG5 FIX: usa la password di login del terapeuta (confronto bcrypt)
// ============================================================
export const verifyPin = async (req, res) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'Password mancante' });

    try {
        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });

        // Confronta la password inserita con quella hashata nel DB
        const isMatch = await bcryptjs.compare(pin, user.login.password);
        if (isMatch) {
            return res.json({ success: true, message: 'Accesso autorizzato' });
        }

        return res.status(401).json({ success: false, message: 'Password non valida' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// INVIO OTP RESET PASSWORD
// ============================================================
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email mancante" });
    }

    try {
        const user = await userModel.findOne({ 'anagrafica.email': email });
        if (!user) {
            return res.status(404).json({ success: false, message: "Utente non trovato" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = hashOtp(otp);
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
        await user.save();

        const emailResult = await sendEmail({
            to: email,
            subject: "Reset Password",
            templateName: 'PASSWORD_RESET_TEMPLATE',
            templateData: { otp, email }
        });

        if (!emailResult || !emailResult.success) {
            // Se l'invio fallisce, resettiamo l'OTP nel DB così da evitare stati incoerenti
            user.resetOtp = '';
            user.resetOtpExpireAt = 0;
            await user.save();
            return res.status(500).json({ success: false, message: "Invio email fallito. Servizio temporaneamente non disponibile." });
        }

        res.json({ success: true, message: "OTP reset inviato!" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// VERIFICA OTP RESET
// ============================================================
export const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Dettagli mancanti" });
    }

    try {
        const user = await userModel.findOne({ 'anagrafica.email': email });
        if (!user || user.resetOtp !== hashOtp(otp) || user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP non valido o scaduto" });
        }

        res.json({ success: true, message: "OTP verificato correttamente" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// RESET PASSWORD (FINALE)
// ============================================================
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Dettagli mancanti" });
    }

    try {
        const user = await userModel.findOne({ 'anagrafica.email': email });
        if (!user || user.resetOtp !== hashOtp(otp) || user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "Richiesta non valida" });
        }

        user.login.password = await bcryptjs.hash(newPassword, 10);
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;
        await user.save();

        res.json({ success: true, message: "Password aggiornata!" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};