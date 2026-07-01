import jwt from 'jsonwebtoken';

export const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ success: false, message: "Non autorizzato. Effettua il login." });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (tokenDecode.id) {
            req.userId = tokenDecode.id;
            next();
        } else {
            return res.status(401).json({ success: false, message: "Token non valido. Effettua il login." });
        }

    } catch (error) {
        // Token scaduto → 401. Manomesso → 403.
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Sessione scaduta. Effettua di nuovo il login." });
        }
        return res.status(403).json({ success: false, message: "Token non valido." });
    }
};