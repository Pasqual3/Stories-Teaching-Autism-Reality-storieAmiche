import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://server:4000';

/**
 * Chiama il Gateway per ottenere i genitori associati a un terapeuta.
 * Opzione B: Non accediamo più direttamente alla collection users.
 */
export const getTherapistParents = async (therapistId, token) => {
    try {
        const response = await axios.get(
            `${GATEWAY_URL}/api/user/therapist/${therapistId}/parents`,
            {
                headers: {
                    Cookie: `token=${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('❌ Errore chiamata Gateway per parents:', error.message);
        throw new Error('Impossibile recuperare i genitori associati');
    }
};

/**
 * Verifica che un terapeuta abbia accesso a un bambino specifico.
 */
export const verifyTherapistChildAccess = async (therapistId, childId, token) => {
    try {
        const response = await axios.get(
            `${GATEWAY_URL}/api/user/therapist/${therapistId}/child/${childId}/verify`,
            {
                headers: {
                    Cookie: `token=${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('❌ Errore verifica accesso terapeuta-bambino:', error.message);
        throw new Error('Accesso non autorizzato');
    }
};