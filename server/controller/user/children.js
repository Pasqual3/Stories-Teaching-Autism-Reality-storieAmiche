import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { userModel } from "../../models/userModel.js";
import { sendEmail } from '../../utils/emailClient.js';
import { setAuthCookie, clearAuthCookie, cleanupChildAvatar, avatarEmojis } from '../user/helpers.js';

export const addChild = async (req, res) => {
    try {
        const { name, pin } = req.body;
        let avatar = req.body.avatar || req.body.avatarIcon;

        if (req.file) avatar = req.file.path;
        else if (!avatar) avatar = 'FaChild';

        if (!name) {
            return res.json({ success: false, message: 'Nome bambino richiesto.' });
        }

        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.json({ success: false, message: 'Utente non trovato.' });
        }

        const hashedPin = pin ? await bcryptjs.hash(pin, 10) : '';

        user.children.push({ name, avatar, pin: hashedPin, createdAt: new Date() });
        await user.save();

        try {
            await sendEmail({
                to: user.anagrafica.email,
                subject: "Nuovo Profilo Bambino Creato!",
                templateName: 'CHILD_ADDED_TEMPLATE',
                templateData: {
                    parentName: user.anagrafica.nome,
                    childName: name,
                    avatar: avatarEmojis[avatar] || '👶'
                }
            });
        } catch (emailError) {
            console.log("Errore email:", emailError);
        }

        res.json({
            success: true,
            message: 'Profilo bambino aggiunto!',
            child: user.children[user.children.length - 1]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getChildren = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        res.json({ success: true, children: user?.children || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const editChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const { name, pin } = req.body;
        let avatar = req.body.avatar;
        if (req.file) avatar = req.file.path;

        const parent = await userModel.findById(req.userId);
        const child = parent.children.id(childId);
        if (!child) {
            return res.json({ success: false, message: 'Profilo bambino non trovato.' });
        }

        if (name) child.name = name;
        if (avatar && child.avatar !== avatar) {
            await cleanupChildAvatar(child.avatar);
            child.avatar = avatar;
        }
        if (pin !== undefined) child.pin = pin ? await bcryptjs.hash(pin, 10) : '';

        await parent.save();
        res.json({ success: true, message: 'Profilo aggiornato!', child });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const parent = await userModel.findById(req.userId);
        const child = parent.children.id(childId);

        if (child) {
            await cleanupChildAvatar(child.avatar);
            parent.children.pull(childId);
            await parent.save();
        }

        res.json({ success: true, message: 'Profilo bambino eliminato.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const switchToChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const { pin } = req.body;

        const user = await userModel.findById(req.userId);
        const child = user.children.id(childId);

        if (!child) {
            return res.json({ success: false, message: 'Profilo bambino non trovato.' });
        }

        if (child.pin && !(await bcryptjs.compare(pin || '', child.pin))) {
            return res.json({ success: false, message: 'PIN non corretto.' });
        }

        const childToken = jwt.sign(
            {
                parentId: req.userId,
                childId: child._id,
                childName: child.name,
                avatar: child.avatar,
                isChild: true
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        setAuthCookie(res, 'childToken', childToken, 7 * 24 * 60 * 60 * 1000);

        res.json({
            success: true,
            message: `Benvenuto ${child.name}!`,
            child: { id: child._id, name: child.name, avatar: child.avatar }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logoutChild = async (req, res) => {
    try {
        clearAuthCookie(res, 'childToken');
        res.json({ success: true, message: 'Logout bambino effettuato.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};