import mongoose from 'mongoose';
import { userModel } from "../../models/userModel.js";

export const getTherapistParents = async (req, res) => {
    try {
        const { therapistId } = req.params;
        if (req.userId !== therapistId) {
            return res.status(403).json({ success: false, message: "Non autorizzato." });
        }

        const parents = await userModel.find({
            tipo_utente: 'adulto',
            "therapists": {
                $elemMatch: {
                    therapistId: new mongoose.Types.ObjectId(therapistId),
                    status: 'accepted'
                }
            }
        }).select('_id anagrafica.nome anagrafica.cognome anagrafica.email children');

        res.json({
            success: true,
            parents: parents.map(p => ({
                _id: p._id.toString(),
                nome: p.anagrafica.nome,
                cognome: p.anagrafica.cognome,
                email: p.anagrafica.email,
                children: (p.children || []).map(c => ({
                    _id: c._id?.toString(),
                    name: c.name,
                    avatar: c.avatar
                }))
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyTherapistChildAccess = async (req, res) => {
    try {
        const { therapistId, childId } = req.params;
        if (req.userId !== therapistId) {
            return res.status(403).json({ success: false, message: "Non autorizzato." });
        }

        const parents = await userModel.find({
            tipo_utente: 'adulto',
            "therapists": {
                $elemMatch: {
                    therapistId: new mongoose.Types.ObjectId(therapistId),
                    status: 'accepted'
                }
            }
        }).select('_id children');

        const parentIds = [];
        const authorizedChildIds = [];

        parents.forEach(parent => {
            parentIds.push(parent._id.toString());
            parent.children?.forEach(child => {
                authorizedChildIds.push(child._id?.toString(), child.name);
            });
        });

        const hasAccess = authorizedChildIds.includes(childId) || parentIds.length > 0;
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: "Accesso negato." });
        }

        res.json({ success: true, parentIds, message: "Accesso autorizzato" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};