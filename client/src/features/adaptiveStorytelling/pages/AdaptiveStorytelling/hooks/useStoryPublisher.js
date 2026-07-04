import { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appContext } from '../../../../../context/appContext';

export const useStoryPublisher = () => {
    const { userData, saveEmoGameInBackground } = useContext(appContext);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const publishStory = useCallback(async ({
        storyId = null,
        forceStatus = null,
        navigateAway = true,
        buildFormData,
        setIsSubmitting: setParentSubmitting,
        title,
    }) => {
        if (!userData || !userData._id) {
            toast.error("Utente non identificato. Effettua il login.");
            return null;
        }

        const intendedStatus = forceStatus || (userData.tipo_utente === 'terapeuta' ? 'APPROVED' : 'PENDING');

        if (intendedStatus !== 'DRAFT' && !title.trim()) {
            toast.error("Il titolo è obbligatorio!");
            return null;
        }

        let formData = buildFormData(intendedStatus);
        formData.append('userId', userData._id);

        if (navigateAway) {
            toast.success(storyId ? "✅ Modifiche inviate!" : "✅ EmoGame inviato! Il salvataggio continua in background.", { autoClose: 3000 });
            navigate('/profile');
        }

        const resultId = await saveEmoGameInBackground(formData, storyId, navigateAway);

        if (!resultId && !storyId) {
            setIsSubmitting(false);
            setParentSubmitting?.(false);
            return null;
        }

        const savedId = resultId || storyId;

        if (!navigateAway) {
            if (!storyId && savedId) {
                navigate(`/edit-emoGame/${savedId}`, { replace: true });
                toast.success("✅ Bozza EmoGame creata! Ora puoi continuare a modificarla.");
            } else {
                toast.success("✅ Bozza EmoGame aggiornata.");
            }
        }

        setIsSubmitting(false);
        setParentSubmitting?.(false);
        return savedId;
    }, [userData, saveEmoGameInBackground, navigate]);

    return { isSubmitting, setIsSubmitting, publishStory };
};