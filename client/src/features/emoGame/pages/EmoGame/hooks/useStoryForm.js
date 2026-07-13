import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { appContext } from '../../../../../context/appContext';

const createDefaultScene = (id) => ({
    id: id || 1,
    text: '',
    media: null,
    rawFile: null,
    mediaType: 'none',
    color: 'bg-white',
    isKeyStep: false,
    gameText: '',
    emotion: '',
    strangeStoryTest: {
        active: true,
        question: '',
        type: 'blocchi_immagine',
        options: [
            { text: '', emoji: '', imageUrl: '', rawFile: null, isCorrect: null, score: null, explanation: '' },
            { text: '', emoji: '', imageUrl: '', rawFile: null, isCorrect: null, score: null, explanation: '' }
        ],
        correctAnswer: '',
        explanation: ''
    }
});

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
    const [category, setCategory] = useState('Emozioni');
    const [isPublic, setIsPublic] = useState(true);

    // --- DIFFICULTY (specifico EmoGame) ---
    const [difficulty, setDifficulty] = useState('DifI');

    // --- GAME OPTIONS (solo quelli rilevanti per EmoGame) ---
    const [isEmotionGameActive] = useState(false);
    const [isStrangeStoryActive] = useState(true);

    // --- STATUS ---
    const [storyStatus, setStoryStatus] = useState('PENDING');

    // --- SCENES ---
    const [paragraphs, setParagraphs] = useState([createDefaultScene(1)]);

    useEffect(() => {
        if (!userData) getUserData();
    }, [userData, getUserData]);

    // --- FETCH EXISTING EMOGAME (o reset se nuovo) ---
    useEffect(() => {
        const fetchEmoGame = async () => {
            if (!storyId) {
                setTitle('');
                setDescription('');
                setCategory('Emozioni');
                setIsPublic(true);
                setDifficulty('DifI');
                setParagraphs([createDefaultScene(Date.now())]);
                setStoryStatus('PENDING');
                return;
            }
            try {
                // Livello 3: chiama l'endpoint dedicato /api/emoGame/:id
                const { data } = await axios.get(`${backendUrl}/api/emoGame/${storyId}`);
                if (data.success) {
                    const s = data.story;
                    setTitle(s.title || '');
                    setDescription(s.description || '');
                    setCategory(s.category || 'Emozioni');
                    setIsPublic(s.isPublic !== false);
                    setDifficulty(s.difficulty || 'DifI');
                    setStoryStatus(s.status || 'PENDING');

                    if (s.paragraphs && s.paragraphs.length > 0) {
                        setParagraphs(s.paragraphs.map((p, idx) => {
                            let mappedOptions = [];
                            if (p.strangeStoryTest?.options && p.strangeStoryTest.options.length > 0) {
                                mappedOptions = p.strangeStoryTest.options.map(o => ({
                                    text: o.text || '',
                                    emoji: o.emoji || '',
                                    imageUrl: o.imageUrl || '',
                                    rawFile: null,
                                    isCorrect: o.isCorrect ?? null,
                                    score: o.score ?? null,
                                    explanation: o.explanation || ''
                                }));
                            } else {
                                mappedOptions = [
                                    { text: '', emoji: '', imageUrl: '', rawFile: null, isCorrect: null, score: null, explanation: '' },
                                    { text: '', emoji: '', imageUrl: '', rawFile: null, isCorrect: null, score: null, explanation: '' }
                                ];
                            }

                            return {
                                id: p._id || idx,
                                text: p.text || '',
                                media: p.mediaUrl || null,
                                mediaType: p.mediaType || 'none',
                                color: p.color || 'bg-white',
                                isKeyStep: p.isKeyStep || false,
                                gameText: p.gameText || '',
                                emotion: p.emotion || '',
                                strangeStoryTest: {
                                    active: true,
                                    question: p.strangeStoryTest?.question || p.text || '',
                                    type: 'blocblocks_immagine', // will force/fallback to blocchi_immagine
                                    ...p.strangeStoryTest,
                                    type: 'blocchi_immagine', // Always override to blocchi_immagine
                                    options: mappedOptions
                                }
                            };
                        }));
                    }
                }
            } catch (error) {
                console.error("Errore caricamento EmoGame:", error);
            }
        };
        fetchEmoGame();
    }, [storyId, backendUrl]);

    // --- SCENE CRUD ---
    const addParagraph = useCallback(() => {
        setParagraphs(prev => [...prev, createDefaultScene(Date.now())]);
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

    const validateStrangeStory = useCallback(() => {
        const activeTests = validParagraphs.filter(p => p.strangeStoryTest?.active);
        if (activeTests.length === 0) {
            return { isValid: false, message: "Non hai configurato alcun quesito." };
        }

        for (let i = 0; i < activeTests.length; i++) {
            const p = activeTests[i];
            const test = p.strangeStoryTest;
            const sceneNum = paragraphs.indexOf(p) + 1;

            if (!test.question?.trim()) {
                return { isValid: false, message: `Manca la domanda nel test del Quesito ${sceneNum}.` };
            }

            if (test.type === 'blocchi_immagine') {
                const validOptions = (test.options || []).filter(o => o.text?.trim());
                if (validOptions.length < 2) {
                    return { isValid: false, message: `Il test del Quesito ${sceneNum} deve avere almeno 2 opzioni con testo.` };
                }
            } else if (test.type === 'libera') {
                if (!test.correctAnswer?.trim()) {
                    return { isValid: false, message: `Inserisci una risposta attesa (nota clinica) per il test libero del Quesito ${sceneNum}.` };
                }
            }
        }
        return { isValid: true };
    }, [validParagraphs, paragraphs]);

    const buildFormData = useCallback((status) => {
        const formData = new FormData();
        formData.append('title', title || '');
        formData.append('description', description);
        formData.append('category', category);
        formData.append('difficulty', difficulty);
        formData.append('isPublic', isPublic);
        formData.append('isEmotionGameActive', false);
        formData.append('isStrangeStoryActive', true);
        formData.append('status', status);

        const paragraphsData = validParagraphs.map(p => ({
            text: p.text.trim(),
            isKeyStep: p.isKeyStep,
            gameText: p.gameText,
            emotion: p.emotion || '',
            mediaType: p.mediaType || 'none',
            color: p.color,
            // Se c'è un rawFile da caricare, NON inviare il blob URL: il server assegnerà l'URL Cloudinary.
            // Se invece è già un URL Cloudinary (nessun rawFile), mantienilo per non cancellare le immagini esistenti.
            mediaUrl: p.rawFile ? '' : (p.media || ''),
            strangeStoryTest: p.strangeStoryTest ? {
                ...p.strangeStoryTest,
                active: true,
                // Stessa logica per le immagini delle opzioni
                options: (p.strangeStoryTest.options || []).map(opt => ({
                    ...opt,
                    imageUrl: opt.rawFile ? '' : (opt.imageUrl || ''),
                }))
            } : { active: true, question: '', type: 'libera', options: [], correctAnswer: '', explanation: '' }
        }));
        formData.append('paragraphs', JSON.stringify(paragraphsData));

        validParagraphs.forEach((p, index) => {
            if (p.rawFile) {
                formData.append(`media_${index}`, p.rawFile);
            }
            if (p.strangeStoryTest?.type === 'blocchi_immagine' && p.strangeStoryTest.options) {
                p.strangeStoryTest.options.forEach((opt, optIdx) => {
                    if (opt.rawFile) {
                        formData.append(`strange_media_${index}_${optIdx}`, opt.rawFile);
                    }
                });
            }
        });

        return formData;
    }, [title, description, category, difficulty, isPublic, validParagraphs]);

    return {
        // Metadata
        title, setTitle,
        description, setDescription,
        category, setCategory,
        isPublic, setIsPublic,
        // Difficulty (specifico EmoGame)
        difficulty, setDifficulty,
        // Games
        isEmotionGameActive,
        isStrangeStoryActive,
        // Scenes
        paragraphs, setParagraphs,
        colors: COLORS,
        addParagraph, removeParagraph, updateParagraph,
        handleMediaChange, handleKeyStepToggle,
        validateStrangeStory,
        // Stats
        validParagraphs, totalCharacters,
        buildFormData,
        storyStatus, setStoryStatus,
        // User
        userData
    };
};