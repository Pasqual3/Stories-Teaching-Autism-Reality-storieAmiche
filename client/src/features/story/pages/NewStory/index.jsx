import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../../../shared/components/Navbar';
import { useStoryForm } from './hooks/useStoryForm';
import { useAudioManager } from './hooks/useAudioManager';
import { useStoryPublisher } from './hooks/useStoryPublisher';
import { appContext } from '../../../../context/appContext';
import { toast } from 'react-toastify';

// Components
import StoryMetadataForm from './components/StoryMetadataForm';
import GameOptionsPanel from './components/GameOptionsPanel';
import AudioSection from './components/AudioSection';
import SceneEditor from './components/SceneEditor';
import ActionButtons from './components/ActionButtons';
import { Helmet } from "react-helmet-async";

const NewStory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isSubmitting, setIsSubmitting, publishStory } = useStoryPublisher();
    const { generateSceneAudioInBackground, resumeAudioJob, saveStoryInBackground, backendUrl } = useContext(appContext);

    // Form state
    const form = useStoryForm(id);

    // Audio state
    const audio = useAudioManager();
    const { setAudioUrl, setAudioSyncData } = audio;

    useEffect(() => {
        const firstParagraphAudio = form.paragraphs?.[0]?.narrationUrl;
        if (form.narrationUrl) {
            setAudioUrl(form.narrationUrl);
        } else if (firstParagraphAudio) {
            setAudioUrl(firstParagraphAudio);
        }

        if (form.narrationSyncData) {
            setAudioSyncData(form.narrationSyncData);
        }
    }, [form.narrationUrl, form.narrationSyncData, form.paragraphs, setAudioUrl, setAudioSyncData]);

    useEffect(() => {
        if (!id || audio.isGeneratingAudio) return;
        if (form.storyStatus !== 'GENERATING_AUDIO' || !form.audioJobId) return;

        // Prima controlla se il job esiste ancora, poi mostra la UI di generazione
        const tryResumeJob = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/story/audio-status/${form.audioJobId}`, { timeout: 8000 });
                if (!data || data.status === 'expired' || data.status === 'not_found' || !data.success && !['processing','queued','done'].includes(data.status)) {
                    // Job morto — resetta senza mostrare la UI di generazione
                    form.setStoryStatus?.('DRAFT');
                    return;
                }
                // Job vivo — ora mostra la UI e riprendi il polling
                audio.setIsGeneratingAudio(true);
                resumeAudioJob(id, form.audioJobId, form.audioCompletionStatus || null, true, (progressData) => {
                    audio.onProgress(progressData);
                }).then((result) => {
                    if (!result) form.setStoryStatus?.('DRAFT');
                    audio.finishProgress(result?.audioUrls || null, result?.syncData || null);
                    if (Array.isArray(result?.audioUrls)) {
                        form.setParagraphs(prev => prev.map((p, idx) => ({
                            ...p,
                            narrationUrl: result.audioUrls[idx] || p.narrationUrl
                        })));
                    }
                }).catch(() => {
                    form.setStoryStatus?.('DRAFT');
                    audio.finishProgress();
                });
            } catch {
                // Errore di rete — resetta silenziosamente
                form.setStoryStatus?.('DRAFT');
            }
        };

        tryResumeJob();
    }, [id, form.storyStatus, form.audioJobId]);

    const [sceneGeneratingId, setSceneGeneratingId] = useState(null);

    // --- HANDLER AUDIO GENERATION ---
    const handleGenerateAudioClick = () => {
        const storyText = form.getStoryText();
        const success = audio.handleGenerateAudio(storyText, form.title, () => {
            // Callback quando inizia la generazione
            publishStory({
                forceStatus: 'DRAFT',
                forceGenerateAudio: true,
                navigateAway: false,
                storyId: id,
                buildFormData: form.buildFormData,
                getStoryText: form.getStoryText,
                appendAudioToFormData: audio.appendAudioToFormData,
                selectedVoice: audio.selectedVoice,
                selectedSpeed: audio.selectedSpeed,
                title: form.title,
                setIsGeneratingAudio: audio.setIsGeneratingAudio,
                setIsSubmitting,
                startFakeProgress: audio.startFakeProgress,
                onProgress: audio.onProgress,
                finishProgress: (audioUrls, syncData) => {
                    audio.finishProgress(audioUrls, syncData);
                    if (Array.isArray(audioUrls)) {
                        form.setParagraphs(prev => prev.map((p, idx) => ({
                            ...p,
                            narrationUrl: audioUrls[idx] || p.narrationUrl
                        })));
                    }
                }
            });
        });

        if (success) {
            // La logica di pubblicazione è gestita nel callback sopra
        }
    };

    const handleRegenerateSceneAudio = async (paragraphId) => {
        if (!id) {
            toast.info("Salva prima come bozza per poter rigenerare l'audio di una scena.");
            return;
        }

        const paragraph = form.paragraphs.find((p) => p.id === paragraphId);
        if (!paragraph) return;

        const text = paragraph.text?.trim() || '';
        if (text.length < 10) {
            toast.error("Testo troppo corto per generare l'audio della scena.");
            return;
        }

        const sceneIndex = form.paragraphs.findIndex((p) => p.id === paragraphId);
        setSceneGeneratingId(paragraphId);

        const result = await generateSceneAudioInBackground(id, sceneIndex, {
            texts: [text],
            storyTitle: form.title || 'Bozza senza titolo',
            speakerName: audio.selectedVoice,
            speed: audio.selectedSpeed,
            // NON passiamo intendedStatus per non degradare lo stato della storia
        }, false);

        if (result?.audioUrls?.[0]) {
            const newUrl = result.audioUrls[0];
            form.setParagraphs(prev => prev.map((p) =>
                p.id === paragraphId ? { ...p, narrationUrl: newUrl } : p
            ));
        }

        setSceneGeneratingId(null);
    };

    // --- HANDLER PUBLISH ---
    const handlePublish = (e, forceStatus = null) => {
        if (e) e.preventDefault();

        if (forceStatus !== 'DRAFT') {
            const { isValid, message } = form.validateStrangeStory();
            if (!isValid) {
                toast.error(message);
                return;
            }
        }

        const intendedStatus = forceStatus || (form.userData?.tipo_utente === 'terapeuta' ? 'APPROVED' : 'PENDING');

        if (intendedStatus !== 'DRAFT' && !form.title.trim()) {
            toast.error("Il titolo è obbligatorio!");
            return;
        }

        if (intendedStatus !== 'DRAFT') {
            const firstScene = form.paragraphs?.[0];
            if (!firstScene?.text?.trim()) {
                toast.error("La prima scena deve avere almeno un testo prima di pubblicare!");
                return;
            }
        }

        // Naviga subito al profilo — il save avviene in background
        toast.success(
            intendedStatus === 'DRAFT'
                ? "✅ Bozza salvata!"
                : intendedStatus === 'APPROVED'
                    ? "✅ Storia pubblicata!"
                    : "✅ Storia inviata! In attesa di approvazione dal terapista.",
            { autoClose: 3000 }
        );
        navigate('/profile');

        // Save in background (non blocca la navigazione)
        setIsSubmitting(true);
        let formData = form.buildFormData(intendedStatus);
        formData.append('userId', form.userData._id);
        formData = audio.appendAudioToFormData(formData);
        saveStoryInBackground(formData, id || null, true).finally(() => setIsSubmitting(false));
    };

    // Loading state
    if (!form.userData) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-purple-50">
                <Navbar />
                <div className="text-xl font-bold text-gray-500 mt-10">Caricamento dati utente...</div>
                <button onClick={() => window.location.reload()} className="mt-4 text-blue-500 underline">Ricarica pagina</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 pb-20">
            <Helmet>
                <title>{id ? 'Modifica Storia' : 'Nuova Storia'} — Storie Amiche</title>
                <meta name="description" content="Crea o modifica le tue storie interattive con immagini e audio generato automaticamente." />
            </Helmet>

            <Navbar />


            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                        {id ? 'Modifica la tua Storia' : 'Crea la tua Nuova Storia'}
                    </h1>

                    {/* 1. METADATA */}
                    <StoryMetadataForm
                        title={form.title} setTitle={form.setTitle}
                        description={form.description} setDescription={form.setDescription}
                        category={form.category} setCategory={form.setCategory}
                        isPublic={form.isPublic} setIsPublic={form.setIsPublic}
                    />

                    {/* 2. GAME OPTIONS */}
                    <GameOptionsPanel
                        isSequencingGameActive={form.isSequencingGameActive}
                        setIsSequencingGameActive={form.setIsSequencingGameActive}
                        isEmotionGameActive={form.isEmotionGameActive}
                        setIsEmotionGameActive={form.setIsEmotionGameActive}
                        isStrangeStoryActive={form.isStrangeStoryActive}
                        setIsStrangeStoryActive={form.setIsStrangeStoryActive}
                    />

                    {/* 3. AUDIO SECTION */}
                    <AudioSection
                        voices={audio.voices}
                        selectedVoice={audio.selectedVoice}
                        setSelectedVoice={audio.setSelectedVoice}
                        selectedSpeed={audio.selectedSpeed}
                        setSelectedSpeed={audio.setSelectedSpeed}
                        isGeneratingAudio={audio.isGeneratingAudio}
                        sceneDone={audio.sceneDone}
                        sceneTotal={audio.sceneTotal}
                        audioUrl={audio.audioUrl}
                        manualAudioPreview={audio.manualAudioPreview}
                        handleGenerateAudio={handleGenerateAudioClick}
                        handleManualAudioChange={audio.handleManualAudioChange}
                        clearManualAudio={audio.clearManualAudio}
                        canGenerateAudio={form.canGenerateAudio}
                        totalCharacters={form.totalCharacters}
                        validParagraphsCount={form.validParagraphs.length}
                    />

                    <hr className="mb-8 border-gray-200" />

                    {/* 4. SCENES EDITOR */}
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Scene della Storia</h2>
                    <div className="space-y-6">
                        {form.paragraphs.map((paragraph, index) => (
                            <SceneEditor
                                key={paragraph.id}
                                paragraph={paragraph}
                                index={index}
                                colors={form.colors}
                                isSequencingGameActive={form.isSequencingGameActive}
                                isEmotionGameActive={form.isEmotionGameActive}
                                isStrangeStoryActive={form.isStrangeStoryActive}
                                onUpdate={form.updateParagraph}
                                onRemove={form.removeParagraph}
                                onMediaChange={form.handleMediaChange}
                                onKeyStepToggle={form.handleKeyStepToggle}
                                onRegenerateAudio={handleRegenerateSceneAudio}
                                isSceneRegenerating={sceneGeneratingId === paragraph.id}
                            />
                        ))}
                    </div>

                    {/* 5. ACTION BUTTONS */}
                    <ActionButtons
                        isSubmitting={isSubmitting}
                        onAddScene={form.addParagraph}
                        onSaveDraft={(e) => handlePublish(e, 'DRAFT')}
                        onPublish={(e) => handlePublish(e)}
                        firstSceneEmpty={!form.paragraphs?.[0]?.text?.trim()}
                    />
                </div>
            </div>

        </div>
    );
};

export default NewStory;