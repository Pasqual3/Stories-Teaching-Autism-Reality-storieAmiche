import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { appContext } from '../../context/appContext';

export const useAudioManager = () => {
    const { backendUrl } = useContext(appContext);

    const [audioUrl, setAudioUrl] = useState(null);
    const [audioSyncData, setAudioSyncData] = useState(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    const [sceneDone, setSceneDone] = useState(0);
    const [sceneTotal, setSceneTotal] = useState(0);

    const generationProgress = useMemo(() => {
        if (!sceneTotal || sceneTotal === 0) return 0;
        return Math.round((sceneDone / sceneTotal) * 100);
    }, [sceneDone, sceneTotal]);

    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [selectedSpeed, setSelectedSpeed] = useState(1.0);
    const [manualAudioFile, setManualAudioFile] = useState(null);
    const [manualAudioPreview, setManualAudioPreview] = useState('');

    useEffect(() => {
        const fetchVoices = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/story/voices`);
                if (data.success && data.voices.length > 0) {
                    setVoices(data.voices);
                    setSelectedVoice(data.voices[0].id);
                }
            } catch (err) {
                // Silently fail voice loading
                toast.error('Errore nel caricamento delle voci di narrazione. Alcune funzionalità potrebbero non essere disponibili.');
            }
        };
        fetchVoices();
    }, [backendUrl]);

    const onProgress = useCallback((progressData) => {
        if (!progressData) return;
        if (progressData.scene_done !== null && progressData.scene_done !== undefined) {
            setSceneDone(progressData.scene_done);
        }
        if (progressData.scene_total !== null && progressData.scene_total !== undefined) {
            setSceneTotal(progressData.scene_total);
        }
    }, []);

    const startRealProgress = useCallback((totalScenes = 0) => {
        setSceneDone(0);
        setSceneTotal(totalScenes);
    }, []);

    const finishProgress = useCallback((audioUrls = null, syncData = null) => {
        if (audioUrls) {
            const singleUrl = Array.isArray(audioUrls) ? audioUrls[0] : audioUrls;
            setAudioUrl(singleUrl);
            setAudioSyncData(syncData);
        }
        setIsGeneratingAudio(false);
        setSceneDone(0);
        setSceneTotal(0);
    }, []);

    const startFakeProgress = useCallback(() => {
        // No-op for compatibility
    }, []);

    const handleManualAudioChange = useCallback((file) => {
        if (!file) return;
        if (!file.type.startsWith('audio')) {
            toast.error('Per favore, carica un file audio valido (MP3, WAV, etc.)');
            return;
        }
        setManualAudioFile(file);
        setManualAudioPreview(URL.createObjectURL(file));
        setAudioUrl(null);
        setAudioSyncData(null);
        toast.info('Audio personale caricato! Ricorda che l\'effetto karaoke non sarà disponibile.');
    }, []);

    const clearManualAudio = useCallback(() => {
        setManualAudioFile(null);
        setManualAudioPreview('');
    }, []);

    const handleGenerateAudio = useCallback((storyText, storyTitle, onStartGeneration) => {
        const MIN_CHARACTERS = 100;
        const MIN_SCENES = 2;
        const MAX_CHARACTERS = 5000;

        const scenesArray = Array.isArray(storyText) ? storyText : (storyText ? [storyText] : []);
        const validScenes = scenesArray.filter(txt => txt && txt.trim().length > 0);
        const textLength = validScenes.reduce((acc, txt) => acc + txt.length, 0);

        if (isGeneratingAudio) {
            toast.warning('Audio già in elaborazione... attendi il completamento prima di richiedere di nuovo.');
            return false;
        }

        if (validScenes.length < MIN_SCENES || textLength < MIN_CHARACTERS) {
            toast.error(`⚠️ Testo o scene insufficienti! Per generare l'audio servono almeno ${MIN_SCENES} scene e ${MIN_CHARACTERS} caratteri totali. Attualmente: ${validScenes.length} scene e ${textLength} caratteri.`);
            return false;
        }
        if (textLength > MAX_CHARACTERS) {
            toast.warning(`⚠️ Testo troppo lungo! Massimo ${MAX_CHARACTERS} caratteri. Attualmente: ${textLength}`);
            return false;
        }

        setIsGeneratingAudio(true);
        startRealProgress(validScenes.length);
        onStartGeneration?.();
        return true;
    }, [isGeneratingAudio, startRealProgress]);

    const resetAudio = useCallback(() => {
        setAudioUrl(null);
        setAudioSyncData(null);
        setIsGeneratingAudio(false);
        setSceneDone(0);
        setSceneTotal(0);
    }, []);

    const appendAudioToFormData = useCallback((formData) => {
        if (audioUrl) {
            formData.append('narrationUrl', audioUrl);
            if (audioSyncData) {
                formData.append('narrationSyncData', JSON.stringify(audioSyncData));
            }
        }
        if (manualAudioFile) {
            formData.append('narrationAudio', manualAudioFile);
        }
        return formData;
    }, [audioUrl, audioSyncData, manualAudioFile]);

    return {
        audioUrl, setAudioUrl,
        audioSyncData, setAudioSyncData,
        isGeneratingAudio, setIsGeneratingAudio,
        sceneDone, sceneTotal, generationProgress,
        voices, selectedVoice, setSelectedVoice,
        selectedSpeed, setSelectedSpeed,
        manualAudioFile, manualAudioPreview,
        handleManualAudioChange, clearManualAudio,
        handleGenerateAudio, resetAudio,
        appendAudioToFormData,
        startFakeProgress, finishProgress,
        onProgress
    };
};
