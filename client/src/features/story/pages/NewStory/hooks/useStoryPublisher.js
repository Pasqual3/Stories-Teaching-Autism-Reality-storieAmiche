import { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appContext } from '../../../../../context/appContext';

export const useStoryPublisher = () => {
    const { userData, saveStoryInBackground, generateAudioInBackground } = useContext(appContext);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const publishStory = useCallback(async ({
        storyId = null,
        forceStatus = null,
        forceGenerateAudio = false,
        navigateAway = true,
        buildFormData,
        getStoryText,
        appendAudioToFormData,
        selectedVoice,
        selectedSpeed,
        title,
        setIsGeneratingAudio,
        setIsSubmitting: setParentSubmitting,
        startFakeProgress,
        finishProgress,
        onProgress
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

        // Se stiamo per generare l'audio e la stiamo "pubblicando", salviamo inizialmente in stato "GENERATING_AUDIO"
        // così il backend NON invia l'email al terapista fino a quando l'audio non è pronto.
        const initialStatus = (forceGenerateAudio && intendedStatus !== 'DRAFT') ? 'GENERATING_AUDIO' : intendedStatus;

        let formData = buildFormData(initialStatus);
        formData.append('userId', userData._id);
        formData = appendAudioToFormData(formData);

        // Naviga subito alla pagina profilo se richiesto
        if (navigateAway) {
            toast.success(storyId ? "✅ Modifiche inviate!" : "✅ Storia inviata! Il salvataggio continua in background.", { autoClose: 3000 });
            navigate('/profile');
        }

        const shouldSuppressSaveToasts = forceGenerateAudio && !navigateAway;

        // Il salvataggio avviene in background (l'utente è già sul profilo)
        const resultId = await saveStoryInBackground(formData, storyId, shouldSuppressSaveToasts);

        if (!resultId && !storyId) {
            // Se il salvataggio fallisce e non era un update, l'utente è già stato navigato
            // Il toast di errore viene mostrato da saveStoryInBackground
            setIsSubmitting(false);
            setParentSubmitting?.(false);
            setIsGeneratingAudio?.(false);
            return null;
        }

        const savedId = resultId || storyId;

        if (!navigateAway) {
            if (!shouldSuppressSaveToasts) {
                if (!storyId && savedId) {
                    navigate(`/edit-story/${savedId}`, { replace: true });
                    toast.success("✅ Bozza creata! Ora puoi continuare a modificarla.");
                } else {
                    toast.success("✅ Bozza aggiornata.");
                }
            } else if (!storyId && savedId) {
                navigate(`/edit-story/${savedId}`, { replace: true });
            }
        }

        // Generazione audio in background (indipendente dalla navigazione)
        if (forceGenerateAudio && savedId) {
            const scenesTexts = getStoryText(); // Array of strings
            startFakeProgress?.();
            generateAudioInBackground(savedId, {
                storyId: savedId,
                texts: scenesTexts,
                storyTitle: title || "Bozza senza titolo",
                speakerName: selectedVoice,
                speed: selectedSpeed,
                intendedStatus: intendedStatus !== 'DRAFT' ? intendedStatus : null
            }, true, (progressData) => {
                onProgress?.(progressData);
            }).then((result) => {
                finishProgress?.(result?.audioUrls || null, result?.syncData || null);
            }).catch(() => {
                finishProgress?.();
            });
            // Non aspettiamo - è fire-and-forget
        } else {
            setIsGeneratingAudio?.(false);
        }

        setIsSubmitting(false);
        setParentSubmitting?.(false);
        return savedId;
    }, [userData, saveStoryInBackground, generateAudioInBackground, navigate]);

    return { isSubmitting, setIsSubmitting, publishStory };
};