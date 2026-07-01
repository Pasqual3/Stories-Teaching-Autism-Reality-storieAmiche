import jwt from 'jsonwebtoken';

export const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Non autorizzato. Token mancante."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.id) {
            req.userId = decoded.id;
        } else {
            return res.status(401).json({
                success: false,
                message: "Token non valido. Effettua di nuovo il login."
            });
        }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};