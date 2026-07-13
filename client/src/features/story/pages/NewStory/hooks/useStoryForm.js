import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { appContext } from '../../../../../context/appContext';

const DEFAULT_SCENE = {
    id: 1,
    text: '',
    media: null,
    rawFile: null,
    mediaType: 'none',
    color: 'bg-white',
    isKeyStep: false,
    gameText: '',
    emotion: ''
};

const COLORS = [
    { name: 'White', value: 'bg-white' },
    { name: 'Blue', value: 'bg-blue-300' },
    { name: 'Green', value: 'bg-green-300' },
    { name: 'Yellow', value: 'bg-yellow-300' },
    { name: 'Pink', value: 'bg-pink-300' },
    { name: 'Purple', value: 'bg-purple-300' },
];

export const useStoryForm = (storyId = null) => {
    const { userData, getUserData, backendUrl } = useContext(appContext);

    // --- METADATA ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Socialità');
    const [isPublic, setIsPublic] = useState(true);

    // --- GAME OPTIONS ---
    const [isSequencingGameActive, setIsSequencingGameActive] = useState(false);
    const [isEmotionGameActive, setIsEmotionGameActive] = useState(false);
    const [isStrangeStoryActive, setIsStrangeStoryActive] = useState(false);

    // --- AUDIO META ---
    const [narrationUrl, setNarrationUrl] = useState('');
    const [narrationSyncData, setNarrationSyncData] = useState(null);
    const [storyStatus, setStoryStatus] = useState('PENDING');
    const [audioJobId, setAudioJobId] = useState('');
    const [audioCompletionStatus, setAudioCompletionStatus] = useState('');

    // --- SCENES ---
    const [paragraphs, setParagraphs] = useState([{ ...DEFAULT_SCENE }]);

    // Load user data
    useEffect(() => {
        if (!userData) getUserData();
    }, [userData, getUserData]);

    // --- FETCH EXISTING STORY (o reset se nuova storia) ---
    useEffect(() => {
        const fetchStory = async () => {
            if (!storyId) {
                // Reset completo per nuova storia
                setTitle('');
                setDescription('');
                setCategory('Socialità');
                setIsPublic(true);
                setIsSequencingGameActive(false);
                setIsEmotionGameActive(false);
                setIsStrangeStoryActive(false);
                setParagraphs([{ ...DEFAULT_SCENE, id: Date.now() }]);
                setNarrationUrl('');
                setNarrationSyncData(null);
                setStoryStatus('PENDING');
                setAudioJobId('');
                setAudioCompletionStatus('');
                return;
            }
            try {
                const { data } = await axios.get(`${backendUrl}/api/story/${storyId}`);
                if (data.success) {
                    const s = data.story;
                    setTitle(s.title || '');
                    setDescription(s.description || '');
                    setCategory(s.category || 'Socialità');
                    setIsPublic(s.isPublic !== false);
                    setIsSequencingGameActive(s.isSequencingGameActive || false);
                    setIsEmotionGameActive(s.isEmotionGameActive || false);
                    setIsStrangeStoryActive(s.isStrangeStoryActive || false);

                    if (s.paragraphs && s.paragraphs.length > 0) {
                        setParagraphs(s.paragraphs.map((p, idx) => ({
                            id: p._id || idx,
                            text: p.text || '',
                            media: p.mediaUrl || null,
                            mediaType: p.mediaType || 'none',
                            color: p.color || 'bg-white',
                            isKeyStep: p.isKeyStep || false,
                            gameText: p.gameText || '',
                            emotion: p.emotion || '',
                            narrationUrl: p.narrationUrl || null,
                            strangeStoryTest: p.strangeStoryTest ? {
                                ...p.strangeStoryTest,
                                options: (p.strangeStoryTest.options || []).map(o => ({
                                    text: o.text || '',
                                    emoji: o.emoji || '',
                                    imageUrl: o.imageUrl || '',
                                    rawFile: null,
                                    isCorrect: o.isCorrect ?? null,
                                    score: o.score ?? null,
                                    explanation: o.explanation || ''
                                }))
                            } : { active: false, question: '', type: 'libera', options: [], correctAnswer: '', explanation: '' }
                        })));
                    }

                    setNarrationUrl(s.narrationUrl || '');
                    setNarrationSyncData(s.narrationSyncData || null);
                    setStoryStatus(s.status || 'PENDING');
                    setAudioJobId(s.audioJobId || '');
                    setAudioCompletionStatus(s.audioCompletionStatus || '');
                }
            } catch (error) {
                console.error("Errore caricamento storia:", error);
            }
        };
        fetchStory();
    }, [storyId, backendUrl]);

    // --- SCENE CRUD ---
    const addParagraph = useCallback(() => {
        setParagraphs(prev => [...prev, {
            ...DEFAULT_SCENE,
            id: Date.now()
        }]);
    }, []);

    const removeParagraph = useCallback((id) => {
        setParagraphs(prev => prev.filter(p => p.id !== id));
    }, []);

    const updateParagraph = useCallback((id, field, value) => {
        setParagraphs(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    }, []);

    const handleMediaChange = useCallback((id, file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        const mediaType = file.type.startsWith('image') ? 'image'
            : file.type.startsWith('video') ? 'video'
                : file.type.startsWith('audio') ? 'audio'
                    : 'none';

        updateParagraph(id, 'media', previewUrl);
        updateParagraph(id, 'rawFile', file);
        updateParagraph(id, 'mediaType', mediaType);
    }, [updateParagraph]);

    const handleKeyStepToggle = useCallback((id, isChecked) => {
        updateParagraph(id, 'isKeyStep', isChecked);
    }, [updateParagraph]);

    // --- STATS ---
    const validParagraphs = paragraphs.filter(p => p.text.trim().length > 0);
    const totalCharacters = paragraphs.reduce((acc, p) => acc + p.text.trim().length, 0);
    const canGenerateAudio = validParagraphs.length >= 2 && totalCharacters >= 100;

    const getStoryText = useCallback(() => {
        return validParagraphs.map(p => p.text.trim());
    }, [validParagraphs]);

    const validateStrangeStory = useCallback(() => {
        if (!isStrangeStoryActive) return { isValid: true };

        const activeTests = validParagraphs.filter(p => p.strangeStoryTest?.active);
        if (activeTests.length === 0) {
            return { isValid: false, message: "Hai attivato 'Strange Story' ma non hai configurato alcun test nelle scene." };
        }

        for (let i = 0; i < activeTests.length; i++) {
            const p = activeTests[i];
            const test = p.strangeStoryTest;
            const sceneNum = paragraphs.indexOf(p) + 1;

            if (!test.question?.trim()) {
                return { isValid: false, message: `Manca la domanda nel test della Scena ${sceneNum}.` };
            }

            if (test.type === 'blocchi_immagine') {
                const validOptions = (test.options || []).filter(o => o.text?.trim());
                if (validOptions.length < 2) {
                    return { isValid: false, message: `Il test della Scena ${sceneNum} deve avere almeno 2 opzioni con testo.` };
                }
                // correctAnswer non più obbligatorio: si usa isCorrect per-opzione
            } else if (test.type === 'libera') {
                if (!test.correctAnswer?.trim()) {
                    return { isValid: false, message: `Inserisci una risposta attesa (nota clinica) per il test libero della Scena ${sceneNum}.` };
                }
            }
        }
        return { isValid: true };
    }, [isStrangeStoryActive, validParagraphs, paragraphs]);

    const buildFormData = useCallback((status) => {
        const formData = new FormData();
        formData.append('title', title || '');
        formData.append('description', description);
        formData.append('category', category);
        formData.append('isPublic', isPublic);
        formData.append('isSequencingGameActive', isSequencingGameActive);
        formData.append('isEmotionGameActive', isEmotionGameActive);
        formData.append('isStrangeStoryActive', isStrangeStoryActive);
        formData.append('status', status);

        const paragraphsData = validParagraphs.map(p => ({
            text: p.text.trim(),
            isKeyStep: p.isKeyStep,
            gameText: p.gameText,
            emotion: p.emotion || '',
            mediaType: p.mediaType || 'none',
            mediaUrl: (p.media && p.media.startsWith('http')) ? p.media : null,
            color: p.color,
            narrationUrl: p.narrationUrl || null,
            strangeStoryTest: p.strangeStoryTest || { active: false, question: '', type: 'libera', options: [], correctAnswer: '', explanation: '' }
        }));
        formData.append('paragraphs', JSON.stringify(paragraphsData));

        validParagraphs.forEach((p, index) => {
            if (p.rawFile) {
                formData.append(`media_${index}`, p.rawFile);
            }
            // Aggiungi immagini per le opzioni del test "Strange Story"
            if (p.strangeStoryTest?.type === 'blocchi_immagine' && p.strangeStoryTest.options) {
                p.strangeStoryTest.options.forEach((opt, optIdx) => {
                    if (opt.rawFile) {
                        formData.append(`strange_media_${index}_${optIdx}`, opt.rawFile);
                    }
                });
            }
        });

        return formData;
    }, [title, description, category, isPublic, isSequencingGameActive, isEmotionGameActive, isStrangeStoryActive, validParagraphs]);

    return {
        // Metadata
        title, setTitle,
        description, setDescription,
        category, setCategory,
        isPublic, setIsPublic,
        // Games
        isSequencingGameActive, setIsSequencingGameActive,
        isEmotionGameActive, setIsEmotionGameActive,
        isStrangeStoryActive, setIsStrangeStoryActive,
        // Scenes
        paragraphs, setParagraphs,
        colors: COLORS,
        addParagraph, removeParagraph, updateParagraph,
        handleMediaChange, handleKeyStepToggle,
        validateStrangeStory,
        // Audio
        narrationUrl,
        narrationSyncData,
        storyStatus, setStoryStatus,
        audioJobId,
        audioCompletionStatus,
        // Stats
        validParagraphs, totalCharacters, canGenerateAudio,
        getStoryText, buildFormData,
        // User
        userData
    };
};