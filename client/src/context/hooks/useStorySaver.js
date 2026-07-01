import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CACHE_KEY } from '../../features/home/utils/storyCache';

export const useStorySaver = (backendUrl, getUserData) => {
    const [isBackgroundSaving, setIsBackgroundSaving] = useState(false);
    const [savingStoryIds, setSavingStoryIds] = useState([]);

    const saveEntity = useCallback(async (basePath, formData, entityId, silent, messages) => {
        setIsBackgroundSaving(true);
        if (entityId) setSavingStoryIds(prev => [...prev, entityId]);

        let toastId = null;
        if (!silent) {
            toastId = toast.info(messages.pending, { autoClose: false, closeButton: false });
        }

        try {
            axios.defaults.withCredentials = true;
            const url = entityId ? `${backendUrl}${basePath}/${entityId}` : `${backendUrl}${basePath}`;
            const method = entityId ? 'put' : 'post';
            const { data } = await axios[method](url, formData);

            if (data.success) {
                if (toastId) {
                    toast.update(toastId, { render: messages.success, type: 'success', autoClose: 3000, closeButton: true });
                }
                if (basePath.includes('/story')) {
                    try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignored */ }
                }
                getUserData();
                return data.story?._id || entityId;
            }

            if (toastId) {
                toast.update(toastId, { render: messages.error + data.message, type: 'error', autoClose: 5000, closeButton: true });
            }
            return null;
        } catch (error) {
            if (toastId) {
                toast.update(toastId, { render: messages.critical, type: 'error', autoClose: 5000, closeButton: true });
            } else if (!silent) {
                toast.error(messages.criticalShort);
            }
            return null;
        } finally {
            setIsBackgroundSaving(false);
            if (entityId) setSavingStoryIds(prev => prev.filter(id => id !== entityId));
        }
    }, [backendUrl, getUserData]);

    const saveStoryInBackground = useCallback((formData, storyId = null, silent = false) =>
        saveEntity('/api/story', formData, storyId, silent, {
            pending: 'Salvataggio storia in corso... ⏳',
            success: '✅ Storia salvata con successo!',
            error: '❌ Errore: ',
            critical: '❌ Errore durante il salvataggio in background.',
            criticalShort: '❌ Errore salvataggio rapido',
        }), [saveEntity]);

    const saveEmoGameInBackground = useCallback((formData, emoGameId = null, silent = false) =>
        saveEntity('/api/emoGame', formData, emoGameId, silent, {
            pending: 'Salvataggio EmoGame in corso... ⏳',
            success: '✅ EmoGame salvato con successo!',
            error: '❌ Errore: ',
            critical: '❌ Errore durante il salvataggio in background.',
            criticalShort: '❌ Errore salvataggio rapido EmoGame',
        }), [saveEntity]);

    return {
        isBackgroundSaving,
        savingStoryIds,
        saveStoryInBackground,
        saveEmoGameInBackground,
    };
};