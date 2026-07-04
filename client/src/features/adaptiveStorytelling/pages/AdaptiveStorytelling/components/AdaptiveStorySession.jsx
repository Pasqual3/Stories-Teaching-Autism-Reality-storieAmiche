import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { appContext } from '../../../../../context/appContext';

// Toast dedicato: avvisa che la narrazione è stata generata dall'IA e va rivista.
// Usa lo stesso ToastContainer globale (in alto a destra di default).
const notifyAiGenerated = () => {
    toast.info('🤖 Questa narrazione adattiva è stata generata dall\'intelligenza artificiale. Dai un\'occhiata prima di pubblicare!', {
        autoClose: 8000,
    });
};

// Set delle emozioni iniziali selezionabili per avviare la sessione.
// Le stesse emozioni/emoji usate altrove nell'app (EmotionMatchingGame, StoryMetadataForm)
// per restare coerenti con il resto della piattaforma.
const INITIAL_EMOTIONS = [
    { value: 'agitato', label: 'Agitato', emoji: '😣' },
    { value: 'frustrato', label: 'Frustrato', emoji: '😤' },
    { value: 'triste', label: 'Triste', emoji: '😢' },
    { value: 'arrabbiato', label: 'Arrabbiato', emoji: '😡' },
    { value: 'ansioso', label: 'Ansioso', emoji: '😰' },
    { value: 'calmo', label: 'Calmo', emoji: '😌' },
    { value: 'felice', label: 'Felice', emoji: '😄' },
];

const AdaptiveStorySession = ({ onAvviaSessione }) => {
    const { backendUrl, userData, activeChild } = useContext(appContext);

    const [children, setChildren] = useState([]);
    const [loadingChildren, setLoadingChildren] = useState(true);

    const [selectedChildId, setSelectedChildId] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState('');
    const [topic, setTopic] = useState('');
    const [isStarting, setIsStarting] = useState(false);

    // Carica la lista dei bambini associati al genitore/terapeuta loggato.
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/user/children`);
                if (data.success) {
                    setChildren(data.children || []);
                }
            } catch (error) {
                // Silenzioso: la sezione resta comunque utilizzabile, semplicemente senza opzioni precaricate.
                console.error('Errore nel caricamento dei bambini:', error);
            } finally {
                setLoadingChildren(false);
            }
        };

        if (userData) fetchChildren();
        else setLoadingChildren(false);
    }, [backendUrl, userData]);

    useEffect(() => {
        if (!selectedChildId && !loadingChildren) {
            if (activeChild?.id || activeChild?._id) {
                setSelectedChildId(activeChild.id || activeChild._id);
                return;
            }
            if (children.length === 1) {
                setSelectedChildId(children[0]._id);
            }
        }
    }, [children, loadingChildren, selectedChildId, activeChild]);

    const canAvviare = selectedChildId && selectedEmotion && topic.trim().length > 0;

    const handleGeneraNarrazione = async () => {
        if (!selectedChildId) {
            toast.error('Seleziona prima un bambino.');
            return;
        }
        if (!selectedEmotion) {
            toast.error("Seleziona l'emozione iniziale del bambino.");
            return;
        }
        if (!topic.trim()) {
            toast.error("Inserisci l'argomento della storia.");
            return;
        }

        setIsStarting(true);
        toast.info('Generazione storia adattiva in corso... Attendi qualche secondo.');

        try {
            const { data } = await axios.post(`${backendUrl}/api/emoGame/adaptive-story`, {
                childId: selectedChildId,
                initialEmotion: selectedEmotion,
                topic: topic.trim(),
            });

            if (data.success && Array.isArray(data.scenes) && data.scenes.length > 0) {
                notifyAiGenerated();
                if (onAvviaSessione) {
                    // Passiamo l'intero payload (non solo le scene) così il componente
                    // padre può precompilare anche titolo e descrizione generati dall'IA,
                    // oltre alle scene.
                    onAvviaSessione({
                        scenes: data.scenes,
                        title: data.title || '',
                        description: data.description || '',
                    });
                }
            } else {
                toast.error(data.message || 'Impossibile generare la narrazione adattiva.');
            }
        } catch (error) {
            console.error('Errore generazione narrazione adattiva:', error);
            toast.error(error.response?.data?.message || 'Errore durante la generazione della storia. Riprova.');
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-inner">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🌈</span>
                <h2 className="text-xl font-bold text-indigo-700">Narrazione Adattiva</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
                Una storia interattiva che si adatta all'emozione del bambino e alle sue scelte.
            </p>

            {/* Seleziona bambino */}
            <div className="mb-6 p-4 bg-white rounded-xl border border-indigo-100">
                <label className="block text-sm font-bold text-gray-700 mb-3">Seleziona bambino</label>
                <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    disabled={loadingChildren}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium bg-gray-50 disabled:opacity-60"
                >
                    <option value="">-- {loadingChildren ? 'Caricamento...' : 'Scegli'} --</option>
                    {children.map((child) => (
                        <option key={child._id} value={child._id}>{child.name}</option>
                    ))}
                </select>
                {!loadingChildren && children.length === 0 && (
                    <p className="text-xs text-gray-400 italic mt-2">Nessun profilo bambino trovato.</p>
                )}
            </div>

            {/* Emozione iniziale */}
            <div className="mb-6 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">Emozione iniziale</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {INITIAL_EMOTIONS.map((emo) => (
                        <button
                            key={emo.value}
                            type="button"
                            onClick={() => setSelectedEmotion(emo.value)}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedEmotion === emo.value
                                ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200'
                                : 'border-gray-100 bg-white hover:border-indigo-300 shadow-sm'
                                }`}
                        >
                            <span className="text-3xl">{emo.emoji}</span>
                            <span className="font-bold text-gray-800 text-xs text-center leading-tight">{emo.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Argomento della storia */}
            <div className="mb-6 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">Argomento della storia</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Es. Una gita al parco"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                />
            </div>

            <button
                type="button"
                onClick={handleGeneraNarrazione}
                disabled={!canAvviare || isStarting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${(!canAvviare || isStarting)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-105'
                    }`}
            >
                {isStarting ? (
                    <span>✨ Sto scrivendo la storia...</span>
                ) : (
                    <>
                        <span className="text-xl">✨</span>
                        <span>Genera storia adattiva</span>
                    </>
                )}
            </button>

            {isStarting && (
                <p className="text-xs text-center text-gray-400 mt-3 italic">
                    Può richiedere qualche secondo: sto adattando la storia in base all'emozione scelta e allo storico del bambino.
                </p>
            )}
        </div>
    );
};

export default AdaptiveStorySession;