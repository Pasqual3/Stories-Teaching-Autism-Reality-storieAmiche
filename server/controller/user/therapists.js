import { userModel } from "../../models/userModel.js";
import { sendEmail } from '../../utils/emailClient.js';
import { sendConnectionEmail } from './helpers.js';

export const addTherapist = async (req, res) => {
    try {
        const { therapistEmail } = req.body;
        if (!therapistEmail) {
            return res.json({ success: false, message: 'Email terapista richiesta.' });
        }

        const therapist = await userModel.findOne({
            'anagrafica.email': therapistEmail,
            tipo_utente: 'terapeuta'
        });

        if (!therapist) {
            return res.json({ success: false, message: 'Terapista non trovato.' });
        }

        if (therapist.therapistInfo.currentChildren >= therapist.therapistInfo.maxChildren) {
            return res.json({ success: false, message: 'Terapista ha raggiunto il limite massimo.' });
        }

        const parent = await userModel.findById(req.userId);
        const alreadyAdded = parent.therapists.some(t =>
            t.therapistId.toString() === therapist._id.toString()
        );

        if (alreadyAdded) {
            return res.json({ success: false, message: 'Terapista già aggiunto.' });
        }

        parent.therapists.push({
            therapistId: therapist._id,
            addedAt: new Date(),
            status: 'pending'
        });
        await parent.save();

        try {
            await sendEmail({
                to: therapist.anagrafica.email,
                subject: "Nuovo Genitore Assegnato",
                templateName: 'THERAPIST_ADDED_TEMPLATE',
                templateData: {
                    therapistName: therapist.anagrafica.nome,
                    parentName: `${parent.anagrafica.nome} ${parent.anagrafica.cognome}`,
                    parentEmail: parent.anagrafica.email
                }
            });
        } catch (emailError) {
            console.log("Errore email:", emailError);
        }

        res.json({ success: true, message: 'Terapista aggiunto con successo!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTherapists = async (req, res) => {
    try {
        const parent = await userModel.findById(req.userId).populate('therapists.therapistId');

        const therapists = parent.therapists.map(t => ({
            id: t.therapistId._id,
            name: `${t.therapistId.anagrafica.nome} ${t.therapistId.anagrafica.cognome}`,
            email: t.therapistId.anagrafica.email,
            specialization: t.therapistId.therapistInfo?.specialization || 'Generale',
            addedAt: t.addedAt,
            status: t.status
        }));

        res.json({ success: true, therapists });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeConnection = async (req, res) => {
    try {
        const { targetId } = req.body;
        const currentUser = await userModel.findById(req.userId);

        if (currentUser.tipo_utente === 'terapeuta') {
            await handleTherapistRemoval(currentUser, targetId, res);
        } else {
            await handleParentRemoval(currentUser, targetId, res);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleTherapistRemoval = async (therapist, parentId, res) => {
    const parent = await userModel.findById(parentId);
    if (!parent) return res.json({ success: false, message: "Genitore non trovato" });

    parent.therapists = parent.therapists.filter(t => t.therapistId.toString() !== therapist._id.toString());

    if (therapist.therapistInfo.currentChildren > 0) {
        therapist.therapistInfo.currentChildren = Math.max(0,
            therapist.therapistInfo.currentChildren - parent.children.length);
        await therapist.save();
    }
    await parent.save();

    try {
        await sendConnectionEmail(
            parent.anagrafica.email,
            "Interruzione collaborazione con Terapista",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e53e3e;">Collaborazione Terminata</h2>
                <p>Ciao ${parent.anagrafica.nome},</p>
                <p>Il terapista <strong>${therapist.anagrafica.nome} ${therapist.anagrafica.cognome}</strong> ha rimosso il collegamento.</p>
            </div>`
        );
    } catch (e) { console.error("Email error:", e); }

    res.json({ success: true, message: "Genitore rimosso e notificato." });
};

const handleParentRemoval = async (parent, therapistId, res) => {
    parent.therapists = parent.therapists.filter(t => t.therapistId.toString() !== therapistId);

    const therapist = await userModel.findById(therapistId);
    if (therapist) {
        therapist.therapistInfo.currentChildren = Math.max(0,
            therapist.therapistInfo.currentChildren - parent.children.length);
        await therapist.save();

        try {
            await sendConnectionEmail(
                therapist.anagrafica.email,
                "Un Genitore ha rimosso la connessione",
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e53e3e;">Collaborazione Terminata</h2>
                    <p>Ciao ${therapist.anagrafica.nome},</p>
                    <p>Il genitore <strong>${parent.anagrafica.nome} ${parent.anagrafica.cognome}</strong> ha rimosso il collegamento.</p>
                </div>`
            );
        } catch (e) { console.error("Email error:", e); }
    }

    await parent.save();
    res.json({ success: true, message: "Terapista rimosso e notificato." });
};

export const searchTherapists = async (req, res) => {
    try {
        const therapists = await userModel.find({ tipo_utente: 'terapeuta' })
            .select('anagrafica.nome anagrafica.cognome anagrafica.email therapistInfo');

        const formatted = therapists.map(t => ({
            id: t._id,
            name: `${t.anagrafica.nome} ${t.anagrafica.cognome}`,
            email: t.anagrafica.email,
            specialization: t.therapistInfo?.specialization || 'Generale',
            maxChildren: t.therapistInfo?.maxChildren,
            currentChildren: t.therapistInfo?.currentChildren
        }));

        res.json({ success: true, therapists: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};