import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { pollAudioJob } from './useAudioPolling';

export const useAudioManager = (backendUrl, getUserData, isLoggedinRef) => {
    const [activeGenerations, setActiveGenerations] = useState([]);
    const [generationProgressMap, setGenerationProgressMap] = useState({});

    const updateGenerationProgress = useCallback((id, progress = {}) => {
        setGenerationProgressMap(prev => {
            const next = { ...prev };
            next[id] = { ...(next[id] || {}), ...progress };
            return next;
        });
    }, []);

    const removeGenerationProgress = useCallback((id) => {
        setGenerationProgressMap(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const withGenerationLock = useCallback((generationId, fn, silent) => {
        if (activeGenerations.includes(generationId)) {
            if (!silent) toast.warning('Generazione già in corso. Attendi il completamento.');
            return Promise.resolve(null);
        }
        setActiveGenerations(prev => [...prev, generationId]);
        return Promise.resolve()
            .then(fn)
            .finally(() => {
                setActiveGenerations(prev => prev.filter(g => g !== generationId));
                removeGenerationProgress(generationId);
            });
    }, [activeGenerations, removeGenerationProgress]);

    const executeAudioJob = useCallback(async ({
        generationId, storyId, audioConfig, silent, onProgress,
        payloadBuilder, toastMessages, skipStartRequest = false, existingJobId = null,
    }) => {
        return withGenerationLock(generationId, async () => {
            updateGenerationProgress(generationId, { scene_done: 0, scene_total: null, status: 'queued' });
            const toastId = toast.info(toastMessages.start, { autoClose: false });

            let jobId = existingJobId;
            try {
                if (!skipStartRequest) {
                    const { data } = await axios.post(`${backendUrl}/api/story/generate-audio`, audioConfig, { timeout: 30000 });
                    if (!data.success || !data.jobId) {
                        toast.update(toastId, { render: '❌ Errore avvio: ' + (data.message || ''), type: 'error', autoClose: 5000 });
                        return null;
                    }
                    jobId = data.jobId;
                }

                const statusUrl = `${backendUrl}/api/story/audio-status/${jobId}`;
                await pollAudioJob(jobId, statusUrl, {
                    isLoggedinRef,
                    onDone: async (statusData, timeStr) => {
                        const payload = payloadBuilder(statusData);
                        const formData = new FormData();
                        Object.entries(payload).forEach(([k, v]) => v != null && formData.append(k, v));
                        const updateRes = await axios.put(`${backendUrl}/api/story/update/${storyId}`, formData);
                        if (updateRes.data.success) {
                            updateGenerationProgress(generationId, { scene_done: statusData.scene_done, scene_total: statusData.scene_total, status: 'done' });
                            onProgress?.({ scene_done: statusData.scene_done, scene_total: statusData.scene_total, status: 'done' });
                            toast.update(toastId, { render: toastMessages.done(timeStr), type: 'success', autoClose: 5000 });
                            getUserData();
                        }
                    },
                    onError: (statusData) => {
                        onProgress?.({ status: 'error' });
                        toast.update(toastId, { render: '❌ Errore: ' + (statusData.message || ''), type: 'error', autoClose: 5000 });
                    },
                    onExpired: toastMessages.onExpired ? () => {
                        onProgress?.({ status: 'expired' });
                        toast.update(toastId, { render: toastMessages.onExpired, type: 'warning', autoClose: 7000 });
                    } : undefined,
                    onProgress: (statusData, timeStr) => {
                        const sceneDone = statusData.scene_done ?? null;
                        const sceneTotal = statusData.scene_total ?? null;
                        onProgress?.({ scene_done: sceneDone, scene_total: sceneTotal, status: statusData.status });
                        updateGenerationProgress(generationId, { scene_done: sceneDone, scene_total: sceneTotal, status: statusData.status });

                        const label = toastMessages.getProgressLabel
                            ? toastMessages.getProgressLabel(statusData, timeStr)
                            : statusData.status === 'queued'
                                ? `⏳ In coda (pos. ${statusData.position || '?'}) — ${timeStr}`
                                : sceneDone !== null && sceneTotal !== null
                                    ? `🎙️ Generazione: Scena ${sceneDone} di ${sceneTotal} — ${timeStr}`
                                    : `🎙️ Generazione in corso... — ${timeStr}`;

                        toast.update(toastId, { render: label, type: 'info', autoClose: false });
                    },
                    onTimeout: () => {
                        toast.update(toastId, { render: '⏱️ Timeout — riprova.', type: 'error', autoClose: 5000 });
                    },
                });
            } catch (error) {
                console.error(`executeAudioJob error (${generationId})`, error);
                const errMsg = error?.response?.data?.message || error?.message || String(error);
                toast.update(toastId, { render: `❌ Errore critico: ${errMsg}`, type: 'error', autoClose: 8000 });
                onProgress?.({ status: 'error', message: errMsg });
                return null;
            }
        }, silent);
    }, [backendUrl, getUserData, isLoggedinRef, withGenerationLock, updateGenerationProgress]);

    const generateAudioInBackground = useCallback(async (storyId, audioConfig, silent = false, onProgress = null) => {
        if (!storyId) return;
        return executeAudioJob({
            generationId: storyId,
            storyId,
            audioConfig,
            silent,
            onProgress,
            payloadBuilder: (statusData) => {
                const payload = { narrationUrls: JSON.stringify(statusData.audioUrls || []) };
                if (statusData.audioUrls?.[0]) payload.narrationUrl = statusData.audioUrls[0];
                if (audioConfig.intendedStatus) payload.status = audioConfig.intendedStatus;
                return payload;
            },
            toastMessages: {
                start: "🎧 L'IA sta generando il parlato in background...",
                done: (timeStr) => `🎧 Audio generato in ${timeStr} — collegato alla storia!`,
            },
        });
    }, [executeAudioJob]);

    const generateSceneAudioInBackground = useCallback(async (storyId, sceneIndex, audioConfig, silent = false) => {
        if (!storyId) return null;
        const processingMessages = [
            "🎧 L'IA sta leggendo la scena...",
            '🎙️ Generazione voce in corso...',
            '🔊 Elaborazione audio...',
            '⏳ Quasi pronto, ancora un momento...',
            '🎵 Sto dando voce alla scena...',
            '🤖 Il modello AI sta lavorando...',
        ];
        let msgIndex = 0;

        return executeAudioJob({
            generationId: `${storyId}:${sceneIndex}`,
            storyId,
            audioConfig: { ...audioConfig, singleScene: true },
            silent,
            payloadBuilder: (statusData) => {
                const narrationUrls = Array(sceneIndex).fill('');
                narrationUrls.push(statusData.audioUrls?.[0] || '');
                const payload = { narrationUrls: JSON.stringify(narrationUrls) };
                if (audioConfig.intendedStatus) payload.status = audioConfig.intendedStatus;
                return payload;
            },
            toastMessages: {
                start: "🎧 L'IA sta generando l'audio della scena in background...",
                done: (timeStr) => `🎧 Audio scena ${sceneIndex + 1} generato in ${timeStr}!`,
                getProgressLabel: (statusData, timeStr) => {
                    if (statusData.status === 'queued') {
                        return `⏳ In coda (pos. ${statusData.position || '?'}) — ${timeStr}`;
                    }
                    const msg = processingMessages[msgIndex % processingMessages.length];
                    msgIndex++;
                    return `${msg} — ${timeStr}`;
                },
            },
        });
    }, [executeAudioJob]);

    const resumeAudioJob = useCallback(async (storyId, jobId, intendedStatus = null, silent = false, onProgress = null) => {
        if (!storyId || !jobId) return null;
        return executeAudioJob({
            generationId: `resume:${jobId}`,
            storyId,
            audioConfig: {},
            silent,
            onProgress,
            skipStartRequest: true,
            existingJobId: jobId,
            payloadBuilder: (statusData) => {
                const payload = { narrationUrls: JSON.stringify(statusData.audioUrls || []) };
                if (statusData.audioUrls?.[0]) payload.narrationUrl = statusData.audioUrls[0];
                if (intendedStatus) payload.status = intendedStatus;
                return payload;
            },
            toastMessages: {
                start: '🎧 Ripristino generazione audio in corso...',
                done: (timeStr) => `🎧 Audio ripristinato e completato in ${timeStr}`,
                onExpired: "⚠️ Generazione audio precedente scaduta. La storia è tornata in bozza — puoi rigenerare l'audio.",
                getProgressLabel: (statusData, timeStr) => {
                    const sceneDone = statusData.scene_done ?? null;
                    const sceneTotal = statusData.scene_total ?? null;
                    return statusData.status === 'queued'
                        ? `⏳ In coda (pos. ${statusData.position || '?'}) — ${timeStr}`
                        : `🎙️ Ripristino audio: Scena ${sceneDone ?? '?'} di ${sceneTotal ?? '?'} — ${timeStr}`;
                },
            },
        });
    }, [executeAudioJob]);

    return {
        activeGenerations,
        generationProgressMap,
        generateAudioInBackground,
        generateSceneAudioInBackground,
        resumeAudioJob,
    };
};