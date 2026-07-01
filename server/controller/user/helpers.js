import { sendEmail } from '../../utils/emailClient.js';
import { removeFromCloudinary } from "../../utils/cloudinaryHelper.js";

export const clearAuthCookie = (res, name = 'token') => {
    res.clearCookie(name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });
};

export const setAuthCookie = (res, name, token, maxAge) => {
    res.cookie(name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge
    });
};

export const sendConnectionEmail = async (to, subject, html) => {
    const { transporter } = await import('../../utils/emailClient.js');
    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to,
        subject,
        html
    });
};

export const cleanupChildAvatar = async (avatar) => {
    if (avatar?.includes('cloudinary.com')) {
        await removeFromCloudinary(avatar);
    }
};

export const avatarEmojis = {
    'FaChild': '👶',
    'FaRocket': '🚀',
    'FaCat': '🐱',
    'FaDog': '🐶',
    'FaHeart': '❤️',
    'FaStar': '⭐',
    'FaCar': '🚗',
    'FaTree': '🌳'
};