import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../../shared/components/Navbar';
import { useStoryForm } from './hooks/useStoryForm';
import { useStoryPublisher } from './hooks/useStoryPublisher';
import { appContext } from '../../../../context/appContext';
import { toast } from 'react-toastify';

import StoryMetadataForm from './components/StoryMetadataForm';
import SceneEditor from './components/SceneEditor';
import ActionButtons from './components/ActionButtons';
import { Helmet } from "react-helmet-async";

const NewEmoGame = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isSubmitting, setIsSubmitting } = useStoryPublisher();
    const { saveEmoGameInBackground } = useContext(appContext); // ← saveEmoGame, non saveStory

    const form = useStoryForm(id);

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

                    <hr className="mb-8 border-gray-200" />

                    {/* 2. SCENES EDITOR */}
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Quesiti dell'EmoGame</h2>
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
                                isSceneRegenerating={false}
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

export default NewEmoGame;