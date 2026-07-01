const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;

export const sendEmail = async ({ to, subject, templateName, templateData, customHtml }) => {
    try {
        const response = await fetch(`${EMAIL_SERVICE_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, templateName, templateData, customHtml })
        });
        return await response.json();
    } catch (error) {
        console.error('Errore chiamata Email-Service:', error.message);
        return { success: false, error: error.message };
    }
};