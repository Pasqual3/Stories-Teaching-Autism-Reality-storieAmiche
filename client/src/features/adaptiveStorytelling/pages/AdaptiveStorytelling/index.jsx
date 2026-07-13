import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../../shared/components/Navbar';
import { useStoryForm } from './hooks/useStoryForm';
import { useAudioManager } from '../../../../shared/hooks/useAudioManager';
import { useStoryPublisher } from './hooks/useStoryPublisher';
import { appContext } from '../../../../context/appContext';
import { toast } from 'react-toastify';
import { assets } from '../../../../assets/assets';

import StoryMetadataForm from './components/StoryMetadataForm';
import AudioSection from '../../../../shared/components/AudioSection';
import AdaptiveStorySession from './components/AdaptiveStorySession';
import SceneEditor from './components/SceneEditor';
import ActionButtons from './components/ActionButtons';
import { Helmet } from "react-helmet-async";

const adaptiveStorytelling = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isSubmitting, setIsSubmitting } = useStoryPublisher();
    const { saveEmoGameInBackground, generateSceneAudioInBackground } = useContext(appContext); // ← saveEmoGame, non saveStory

    const form = useStoryForm(id);
    const audio = useAudioManager();
    const [sceneGeneratingId, setSceneGeneratingId] = useState(null);

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
        }, false, '/api/emoGame/update');

        if (result?.audioUrls?.[0]) {
            const newUrl = result.audioUrls[0];
            form.setParagraphs(prev => prev.map((p) =>
                p.id === paragraphId ? { ...p, narrationUrl: newUrl } : p
            ));
        }

        setSceneGeneratingId(null);
    };

    // Riceve { scenes, title, description } generati da Flask (narrazione adattiva)
    // e li converte nel formato paragraphs usato dal form, sostituendo le scene esistenti.
    const handleAdaptiveStoryGenerated = (payload) => {
        const scenes = payload?.scenes;
        if (!Array.isArray(scenes) || scenes.length === 0) return;

        const mapped = scenes.map((scene, idx) => {
            const isBranching = scene.phase === 'choices';
            const baseId = Date.now() + idx;

            const options = (scene.options || []).map(opt => ({
                text: opt.text || '',
                emoji: opt.emoji || '',
                imageUrl: '',
                rawFile: null,
                isCorrect: isBranching ? null : (opt.isCorrect ?? null),
                score: isBranching ? null : (opt.score ?? null),
                explanation: isBranching ? '' : (opt.explanation || ''),
                // Per le scene a bivio, l'IA restituisce in "explanation" il breve
                // testo di continuazione della storia per questa scelta: lo usiamo
                // come nextSceneText, il campo mostrato nell'editor per il branching.
                nextSceneText: isBranching ? (opt.explanation || '') : '',
                nextSceneIndex: typeof opt.nextSceneIndex === 'number' ? opt.nextSceneIndex : null
            }));

            return {
                id: baseId,
                text: scene.text || '',
                narrationUrl: '',
                media: null,
                rawFile: null,
                mediaType: 'none',
                color: 'bg-white',
                isKeyStep: false,
                gameText: '',
                emotion: '',
                imageSuggestion: (scene.options || []).map(o => o.imageSuggestion).find(Boolean) || '',
                isBranching,
                strangeStoryTest: {
                    active: true,
                    question: scene.question || '',
                    type: 'blocchi_immagine',
                    options: options.length >= 2 ? options : [
                        { text: '', emoji: '', imageUrl: '', rawFile: null, isCorrect: null, score: null, explanation: '', nextSceneText: '', nextSceneIndex: null },
                        { text: '', emoji: '', imageUrl: '', rawFile: null, isCorrect: null, score: null, explanation: '', nextSceneText: '', nextSceneIndex: null }
                    ],
                    correctAnswer: '',
                    explanation: ''
                }
            };
        });

        form.setParagraphs(mapped);

        // Precompila titolo/descrizione con quelli suggeriti dall'IA, ma solo se
        // il terapeuta/genitore non ha già scritto qualcosa di suo (non sovrascriviamo).
        if (!form.title.trim() && payload?.title) {
            form.setTitle(payload.title);
        }
        if (!form.description.trim() && payload?.description) {
            form.setDescription(payload.description);
        }
    };

    const handlePublish = (e, forceStatus = null) => {
        if (e) e.preventDefault();

        const intendedStatus = forceStatus || (form.userData?.tipo_utente === 'terapeuta' ? 'APPROVED' : 'PENDING');

        if (intendedStatus !== 'DRAFT') {
            if (!form.title.trim()) {
                toast.error("Il titolo è obbligatorio!");
                return;
            }
            const validation = form.validateStrangeStory();
            if (!validation.isValid) {
                toast.error(validation.message);
                return;
            }
        }

        toast.success(
            intendedStatus === 'DRAFT'
                ? "✅ Bozza salvata!"
                : intendedStatus === 'APPROVED'
                    ? "✅ EmoGame pubblicato!"
                    : "✅ EmoGame inviato! In attesa di approvazione dal terapista.",
            { autoClose: 3000 }
        );
        navigate('/profile');

        setIsSubmitting(true);
        const formData = form.buildFormData(intendedStatus);
        formData.append('userId', form.userData._id);
        formData.append('isAdaptive', true);

        saveEmoGameInBackground(formData, id || null, true)
            .finally(() => setIsSubmitting(false));
    };

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
                <title>{id ? 'Modifica EmoGame' : 'Nuovo EmoGame'} — Storie Amiche</title>
                <meta name="description" content="Crea o modifica un EmoGame per il tuo bambino." />
            </Helmet>

            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                        {id ? 'Modifica EmoGame' : 'Crea nuovo EmoGame'}
                    </h1>

                    {/* 1. METADATA — passa anche difficulty e setDifficulty */}
                    <StoryMetadataForm
                        title={form.title} setTitle={form.setTitle}
                        description={form.description} setDescription={form.setDescription}
                        category={form.category} setCategory={form.setCategory}
                        isPublic={form.isPublic} setIsPublic={form.setIsPublic}
                        difficulty={form.difficulty} setDifficulty={form.setDifficulty}
                    />

                    <AudioSection
                        voices={audio.voices}
                        selectedVoice={audio.selectedVoice}
                        setSelectedVoice={audio.setSelectedVoice}
                        selectedSpeed={audio.selectedSpeed}
                        setSelectedSpeed={audio.setSelectedSpeed}
                        isGeneratingAudio={audio.isGeneratingAudio}
                        generationProgress={audio.generationProgress}
                        sceneDone={audio.sceneDone}
                        sceneTotal={audio.sceneTotal}
                        audioUrl={audio.audioUrl}
                        manualAudioPreview={audio.manualAudioPreview}
                        handleGenerateAudio={() => audio.handleGenerateAudio(
                            form.paragraphs.map((p) => p.text || ''),
                            form.title,
                            () => {}
                        )}
                        handleManualAudioChange={audio.handleManualAudioChange}
                        clearManualAudio={audio.clearManualAudio}
                        canGenerateAudio={form.totalCharacters >= 100 && form.validParagraphs.length >= 2}
                        totalCharacters={form.totalCharacters}
                        validParagraphsCount={form.validParagraphs.length}
                        adaptiveIllustration={assets.person_icon}
                    />

                    <AdaptiveStorySession onAvviaSessione={handleAdaptiveStoryGenerated} />

                    <hr className="mb-8 border-gray-200" />

                    {/* 2. SCENES EDITOR */}
                    <h2 id="quesiti-emogame" className="text-xl font-bold text-gray-700 mb-4">Quesiti dell'EmoGame</h2>
                    <div className="space-y-6">
                        {form.paragraphs.map((paragraph, index) => (
                            <SceneEditor
                                key={paragraph.id}
                                paragraph={paragraph}
                                index={index}
                                colors={form.colors}
                                isEmotionGameActive={form.isEmotionGameActive}
                                isSequencingGameActive={false}
                                isStrangeStoryActive={true}
                                onUpdate={form.updateParagraph}
                                onRemove={form.removeParagraph}
                                onMediaChange={form.handleMediaChange}
                                onKeyStepToggle={form.handleKeyStepToggle}
                                onRegenerateAudio={handleRegenerateSceneAudio}
                                isSceneRegenerating={sceneGeneratingId === paragraph.id}
                                difficulty={form.difficulty}
                            />
                        ))}
                    </div>

                    {/* 4. ACTION BUTTONS */}
                    <ActionButtons
                        isSubmitting={isSubmitting}
                        onAddScene={form.addParagraph}
                        onSaveDraft={(e) => handlePublish(e, 'DRAFT')}
                        onPublish={(e) => handlePublish(e)}
                    />
                </div>
            </div>
        </div>
    );
};

export default adaptiveStorytelling;