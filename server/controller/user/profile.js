import jwt from 'jsonwebtoken';
import { userModel } from "../../models/userModel.js";
import bcryptjs from 'bcryptjs';
import { sendEmail } from '../../utils/emailClient.js';

export const getUserData = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const isChildActive = !!req.cookies.childToken;
        let name = user.anagrafica.nome;
        let avatar = user.profilo?.avatar || "";

        if (isChildActive) {
            try {
                const decoded = jwt.verify(req.cookies.childToken, process.env.JWT_SECRET);
                const child = user.children.id(decoded.childId);
                if (child) {
                    name = child.name;
                    avatar = child.avatar;
                }
            } catch (err) {
                console.error("Errore decodifica childToken:", err);
            }
        }

        res.json({
            success: true,
            userData: {
                _id: user._id,
                name,
                surname: user.anagrafica.cognome,
                email: user.anagrafica.email,
                avatar,
                isAccountVerified: user.isAccountVerified,
                tipo_utente: user.tipo_utente || "Non Definito",
                isChildActive,
                activeChildId: isChildActive
                    ? (jwt.verify(req.cookies.childToken, process.env.JWT_SECRET)?.childId || null)
                    : null,
                therapistInfo: user.therapistInfo
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, surname, email, password, currentPassword, specialization, maxChildren } = req.body;
        const user = await userModel.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utente non trovato.' });
        }

        // ✅ AGGIORNAMENTO PROTETTO: Aggiorna solo i campi effettivamente inviati nel form
        if (name !== undefined) user.anagrafica.nome = name;
        if (surname !== undefined) user.anagrafica.cognome = surname;

        // Se l'email cambia, richiede la password attuale come conferma
        if (email && email !== user.anagrafica.email) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Inserisci la password attuale per cambiare email.' });
            }
            const isMatch = await bcryptjs.compare(currentPassword, user.login.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Password attuale non corretta.' });
            }
            // Verifica che la nuova email non sia già usata da un altro account
            const existing = await userModel.findOne({ 'anagrafica.email': email, _id: { $ne: req.userId } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Email già in uso da un altro account.' });
            }
            user.anagrafica.email = email;
            user.isAccountVerified = false; // La nuova email va ri-verificata
        }

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ success: false, message: 'La password deve avere almeno 8 caratteri.' });
            }
            user.login.password = await bcryptjs.hash(password, 10);
        }

        if (user.tipo_utente === 'terapeuta') {
            if (specialization !== undefined) user.therapistInfo.specialization = specialization;
            if (maxChildren !== undefined) user.therapistInfo.maxChildren = maxChildren;
        }

        await user.save();

        try {
            await sendEmail({
                to: user.anagrafica.email,
                subject: "Profilo Aggiornato",
                templateName: 'PROFILE_UPDATE_TEMPLATE',
                templateData: { name: user.anagrafica.nome, email: user.anagrafica.email }
            });
        } catch (emailError) {
            console.log("Errore invio email:", emailError);
        }

        res.json({ success: true, message: 'Profilo aggiornato con successo' });
    } catch (error) {
        console.error("Errore salvataggio profilo:", error); // Questo ti mostrerà il log sul server in caso di problemi
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verifica la password dell'utente loggato (usato dal PIN gate della dashboard clinica)
export const verifyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password mancante.' });
        }
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utente non trovato.' });
        }
        const isMatch = await bcryptjs.compare(password, user.login.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password non corretta.' });
        }
        res.json({ success: true, message: 'Password verificata.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};