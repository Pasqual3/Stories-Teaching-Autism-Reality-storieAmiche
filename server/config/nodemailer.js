import nodemailer from "nodemailer";

// La porta determina automaticamente se usare SSL o STARTTLS:
// - Porta 465 → secure: true  (SSL diretto)
// - Porta 587 → secure: false (STARTTLS, si aggiorna automaticamente)
const port = parseInt(process.env.SMTP_PORT) || 587;
const secure = port === 465;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export default transporter;