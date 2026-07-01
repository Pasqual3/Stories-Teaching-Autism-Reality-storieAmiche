import axios from 'axios';

const MONITORING_SERVICE_URL = process.env.MONITORING_SERVICE_URL || 'http://monitoring-service:5005';

export const sendLog = async (level, message, metadata = {}) => {
    try {
        console.log(`[${level.toUpperCase()}] ${message}`);
        await axios.post(`${MONITORING_SERVICE_URL}/log`, {
            level,
            service: 'analytics-service',
            message,
            metadata
        });
    } catch (error) {
        console.error('❌ Impossibile inviare log al monitoring-service:', error.message);
    }
};