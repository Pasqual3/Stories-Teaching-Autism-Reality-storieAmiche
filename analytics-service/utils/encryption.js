import crypto from 'crypto';

// SICUREZZA: chiave di cifratura DEDICATA, separata da JWT_SECRET.
// JWT_SECRET firma token di sessione; ENCRYPTION_KEY cifra dati clinici.
// Ruotare uno NON deve invalidare l'altro.
//
// Generare ENCRYPTION_KEY (una sola volta):
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// Aggiungere il risultato al .env e ai secret del deployment.

const rawKey  = process.env.ENCRYPTION_KEY;
const rawSalt = process.env.ENCRYPTION_SALT;

if (!rawKey || !rawSalt) {
    // Fail-fast: crash rumoroso e' meglio che cifrare dati clinici
    // di bambini con credenziali note su GitHub.
    throw new Error(
        '[encryption] ENCRYPTION_KEY e/o ENCRYPTION_SALT non impostati. ' +
        "Aggiungili al file .env e alle variabili d'ambiente del container" +
        ' prima di avviare il servizio.'
    );
}

const ENCRYPTION_KEY = crypto.scryptSync(rawKey, rawSalt, 32);
const IV_LENGTH = 16;

// encrypt() -- FAIL CLOSED
// Se la cifratura fallisce, lancia eccezione invece di restituire
// il testo in chiaro. Il try/catch del controller rispondera' HTTP 500.
export function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// decrypt() -- tollerante per dati pre-cifratura (record vecchi in chiaro).
export function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        // Record legacy o chiave ruotata: logga ma non interrompere il rendering.
        console.warn('[encryption] decrypt fallito -- possibile record pre-cifratura o chiave ruotata:', e.message);
        return text;
    }
}

export function encryptNumber(value) {
    if (value === null || value === undefined) return value;
    return encrypt(String(value));
}

export function decryptNumber(value) {
    if (value === null || value === undefined) return value;
    const decrypted = decrypt(String(value));
    const num = parseFloat(decrypted);
    return isNaN(num) ? 0 : num;
}

export function encryptJson(value) {
    if (value === null || value === undefined) return value;
    return encrypt(JSON.stringify(value));
}

export function decryptJson(value) {
    if (!value) return value;
    try {
        return JSON.parse(decrypt(value));
    } catch {
        return value;
    }
}
