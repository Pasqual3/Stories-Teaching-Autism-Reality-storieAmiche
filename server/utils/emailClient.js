/**
 * emailClient.js
 * Helper per inviare email tramite il microservizio email-service.
 * Il server principale NON usa più Nodemailer direttamente:
 * delega tutto al microservizio dedicato tramite HTTP.
 */

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:5008';

/**
 * Invia una email tramite il microservizio email-service.
 * @param {Object} options
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Oggetto dell'email
 * @param {string} [options.templateName] - Nome del template esportato (es. 'EMAIL_VERIFY_TEMPLATE')
 * @param {Object} [options.templateData] - Variabili da sostituire nel template (es. { name: 'Mario', otp: '123456' })
 * @param {string} [options.customHtml] - HTML grezzo da usare se non si usa un template predefinito
 */
export const sendEmail = async ({ to, subject, templateName, templateData, customHtml }) => {
    try {
        const response = await fetch(`${EMAIL_SERVICE_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, templateName, templateData, customHtml })
        });

        const data = await response.json();

        if (!data.success) {
            console.error('Email-service ha risposto con errore:', data.error || data.message);
        } else {
            console.log(`Email inviata a ${to} (${subject})`);
        }

        return data;

    } catch (error) {
        // L'invio email è sempre "non bloccante": logghiamo l'errore ma non blocchiamo il flusso
        console.error('Errore di rete verso email-service:', error.message);
        return { success: false, error: error.message };
    }
};
