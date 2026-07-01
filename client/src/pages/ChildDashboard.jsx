import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appContext } from '../context/appContext';
import axios from 'axios';
import { FaBookOpen, FaHeart, FaUserMd, FaStar, FaGlobe, FaRocket, FaChild, FaCat, FaDog, FaCar, FaTree } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Navbar from '../shared/components/Navbar';
import { Helmet } from "react-helmet-async";

const ChildDashboard = () => {
    const { backendUrl, getUserData, setActiveChild } = useContext(appContext);
    const navigate = useNavigate();

    const [childData, setChildData] = useState(null);
    const [assignedStories, setAssignedStories] = useState([]); // Storie assegnate dai genitori
    const [otherStories, setOtherStories] = useState([]);       // Tutte le altre storie pubbliche
    const [assignedEmoGames, setAssignedEmoGames] = useState([]); // EmoGame assegnati
    const [assignedEmoLoading, setAssignedEmoLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stories');       // 'stories' | 'emogames'
    const [loading, setLoading] = useState(true);

    const avatarIcons = {
        FaChild, FaRocket, FaCat, FaDog, FaHeart, FaStar, FaCar, FaTree
    };

    const avatarColors = {
        FaChild: 'from-blue-300 to-blue-400',
        FaRocket: 'from-purple-300 to-purple-400',
        FaCat: 'from-orange-300 to-orange-400',
        FaDog: 'from-amber-300 to-amber-400',
        FaHeart: 'from-pink-300 to-pink-400',
        FaStar: 'from-yellow-300 to-yellow-400',
        FaCar: 'from-red-300 to-red-400',
        FaTree: 'from-green-300 to-green-400'
    };


    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            // 1. Prendi le storie assegnate specificamente al bambino
            const assignedRes = await axios.get(`${backendUrl}/api/story/child-stories`);

            let myAssigned = [];
            if (assignedRes.data.success) {
                myAssigned = assignedRes.data.stories;
                setAssignedStories(myAssigned);
                setChildData(assignedRes.data.child);
            }

            // 2. Pianifica il caricamento in background degli EmoGame assegnati
            setAssignedEmoLoading(true);
            try {
                const { runWhenIdle } = await import('../hooks/useIdleCallback');
                runWhenIdle(async () => {
                    try {
                        const assignedEmoRes = await axios.get(`${backendUrl}/api/emoGame/child-emogames`);
                        if (assignedEmoRes.data.success) {
                            const myAssignedEmo = assignedEmoRes.data.stories.map(g => ({ ...g, gameType: 'emoGame' }));
                            setAssignedEmoGames(myAssignedEmo);
                        }
                    } catch (emoErr) {
                        console.error("Errore caricamento EmoGames:", emoErr);
                    } finally {
                        setAssignedEmoLoading(false);
                    }
                }, { timeout: 2000 });
            } catch (e) {
                // If dynamic import fails, fallback to immediate fetch
                try {
                    const assignedEmoRes = await axios.get(`${backendUrl}/api/emoGame/child-emogames`);
                    if (assignedEmoRes.data.success) {
                        const myAssignedEmo = assignedEmoRes.data.stories.map(g => ({ ...g, gameType: 'emoGame' }));
                        setAssignedEmoGames(myAssignedEmo);
                    }
                } catch (emoErr) {
                    console.error("Errore caricamento EmoGames fallback:", emoErr);
                } finally {
                    setAssignedEmoLoading(false);
                }
            }

            // 3. Prendi TUTTE le storie pubbliche/disponibili
            const publicRes = await axios.get(`${backendUrl}/api/story/public-stories`);

            if (publicRes.data.success) {
                const allPublic = publicRes.data.stories;

                // schedule background filtering so UI is responsive
                try {
                    const { runWhenIdle } = await import('../hooks/useIdleCallback');
                    runWhenIdle(() => {
                        const assignedIds = new Set(myAssigned.map(s => s._id));
                        const filteredPublic = allPublic.filter(story => !assignedIds.has(story._id));
                        setOtherStories(filteredPublic);
                    }, { timeout: 2000 });
                } catch (e) {
                    // fallback immediate
                    const assignedIds = new Set(myAssigned.map(s => s._id));
                    const filteredPublic = allPublic.filter(story => !assignedIds.has(story._id));
                    setOtherStories(filteredPublic);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                <div className="text-2xl font-bold text-purple-600 animate-bounce">Caricamento le tue storie... 🎈</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 pb-20">
            <Helmet>
                <title>Dashboard Bambino — Storie Amiche</title>
                <meta name="description" content="Dashboard personale, dove puoi trovare le storie assegnate e giocare." />
            </Helmet>

            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* --- HEADER BAMBINO --- */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-10 text-center border-4 border-white relative overflow-hidden">
                    {/* Decorazioni sfondo header */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600"></div>

                    <div className="relative w-32 h-32 mx-auto mb-4">
                        <div className={`w-full h-full bg-gradient-to-br ${childData?.avatar && avatarColors[childData.avatar] ? avatarColors[childData.avatar] : 'from-orange-400 to-pink-500'} rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-lg overflow-hidden border-4 border-white`}>
                            {childData?.avatar && avatarIcons[childData.avatar] ? (
                                (() => {
                                    const IconComponent = avatarIcons[childData.avatar];
                                    return <IconComponent className="w-16 h-16 text-white" />;
                                })()
                            ) : childData?.avatar && childData.avatar.startsWith('http') ? (
                                <img src={childData.avatar} alt="Me" className="w-full h-full object-cover" />
                            ) : (
                                <span>👶</span>
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-yellow-400 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm animate-pulse">
                            <FaStar className="text-white text-xs" />
                        </div>
                    </div>

                    <h1 className="text-6xl font-black text-gray-800 mb-4 tracking-tight">
                        Ciao, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{childData?.name || 'Campione'}</span>! 👋
                    </h1>
                    <p className="text-gray-600 font-bold text-2xl mb-6">
                        {activeTab === 'stories' ? 'Cosa leggiamo oggi di bello?' : 'A cosa giochiamo oggi di bello?'}
                    </p>

                </div>

                {/* --- SELETTORE TAB --- */}
                <div className="flex justify-center gap-4 mb-10">
                    <button
                        onClick={() => setActiveTab('stories')}
                        className={`px-8 py-4 rounded-3xl font-black text-2xl shadow-md transition-all flex items-center gap-3 cursor-pointer border-4 ${
                            activeTab === 'stories'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-white scale-105'
                                : 'bg-white text-gray-500 border-transparent hover:border-blue-300'
                        }`}
                    >
                        📖 Storie Amiche
                    </button>
                    <button
                        onClick={() => setActiveTab('emogames')}
                        className={`px-8 py-4 rounded-3xl font-black text-2xl shadow-md transition-all flex items-center gap-3 cursor-pointer border-4 ${
                            activeTab === 'emogames'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-white scale-105'
                                : 'bg-white text-gray-500 border-transparent hover:border-purple-300'
                        }`}
                    >
                        🎮 I Tuoi EmoGame
                    </button>
                </div>

                {activeTab === 'stories' ? (
                    <>
                        {/* --- SEZIONE 1: STORIE ASSEGNATE (PRIORITÀ) --- */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="bg-white p-3 rounded-full shadow-md text-pink-500">
                                    <FaHeart size={24} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-gray-800">
                                        Scelte per te ❤️
                                    </h2>
                                    <p className="text-xl text-gray-500 font-bold mt-1">
                                        Le tue storie speciali
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {assignedStories.length === 0 ? (
                                    <div className="col-span-full text-center py-10 bg-white/50 rounded-3xl border-2 border-dashed border-pink-200">
                                        <p className="text-gray-500 font-bold">Nessuna storia assegnata ancora.</p>
                                    </div>
                                ) : (
                                    assignedStories.map(story => (
                                        <StoryCard key={story._id} story={story} navigate={navigate} isAssigned={true} childId={childData?.id} />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* --- SEZIONE 2: ALTRE STORIE (LIBRERIA PUBBLICA) --- */}
                        {otherStories.length > 0 && (
                            <div className="mb-6 animate-fadeIn">
                                <div className="flex items-center gap-3 mb-6 px-2 border-t border-gray-200 pt-8">
                                    <div className="bg-white p-3 rounded-full shadow-md text-blue-500">
                                        <FaGlobe size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black text-gray-800">
                                            Esplora altre storie 🌍
                                        </h2>
                                        <p className="text-xl text-gray-500 font-bold mt-1">
                                            Tante nuove avventure ti aspettano
                                        </p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {otherStories.map(story => (
                                        <StoryCard key={story._id} story={story} navigate={navigate} isAssigned={false} childId={childData?.id} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* --- SEZIONE EMOGAMES --- */
                    <div className="mb-12 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="bg-white p-3 rounded-full shadow-md text-purple-500">
                                <FaHeart size={24} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-gray-800">
                                    Giochi per te ❤️
                                </h2>
                                <p className="text-xl text-gray-500 font-bold mt-1">
                                    Allena le tue emozioni!
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {assignedEmoLoading ? (
                                <div className="col-span-full text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-purple-200">
                                    <p className="text-gray-500 font-bold text-xl mb-2">Caricamento giochi assegnati... 🎮</p>
                                    <p className="text-gray-400 text-base">Sto prendendo i tuoi giochi preferiti, un momento...</p>
                                </div>
                            ) : assignedEmoGames.length === 0 ? (
                                <div className="col-span-full text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-purple-200">
                                    <p className="text-gray-500 font-bold text-xl mb-2">Non ci sono EmoGame assegnati al momento. 🎈</p>
                                    <p className="text-gray-400 text-base">Chiedi al tuo genitore o terapeuta di assegnartene uno!</p>
                                </div>
                            ) : (
                                assignedEmoGames.map(story => (
                                    <StoryCard key={story._id} story={story} navigate={navigate} isAssigned={true} childId={childData?.id} />
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- Componente Card Estratto per pulizia codice ---
const StoryCard = ({ story, navigate, isAssigned, childId }) => {
    const isEmoGame = story.gameType === 'emoGame';
    
    // Controlla se il bambino ha completato questo EmoGame
    const hasCompleted = isEmoGame && (story.emotionGameSessions || []).some(
        session => String(session.childUserId) === String(childId) && session.completed === true
    );

    // Configurazione visuale in base al tipo di gioco
    const cardBorderColor = isEmoGame
        ? (isAssigned ? 'border-purple-100 ring-2 ring-purple-50' : 'border-gray-100')
        : (isAssigned ? 'border-pink-100 ring-2 ring-pink-50' : 'border-gray-100');

    const headerGradient = isEmoGame
        ? (isAssigned ? 'from-purple-500 to-indigo-500' : 'from-indigo-400 to-violet-400')
        : (isAssigned ? 'from-pink-400 to-purple-400' : 'from-blue-400 to-cyan-400');

    const labelBadge = isEmoGame
        ? (isAssigned ? <span className="text-purple-600 flex gap-1 items-center"><FaHeart /> Per Te</span> : <span className="text-indigo-600 flex gap-1 items-center"><FaRocket /> EmoGame</span>)
        : (isAssigned ? <span className="text-pink-600 flex gap-1 items-center"><FaHeart /> Per Te</span> : <span className="text-blue-600 flex gap-1 items-center"><FaRocket /> Esplora</span>);

    const floatingIcon = isEmoGame ? '🎮' : '📖';
    const descriptionFallback = isEmoGame ? 'Clicca per giocare a questo EmoGame!' : 'Clicca per leggere questa storia!';

    const buttonClass = isEmoGame
        ? (isAssigned ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-500 hover:bg-indigo-600')
        : (isAssigned ? 'bg-pink-500 hover:bg-pink-600' : 'bg-blue-500 hover:bg-blue-600');

    return (
        <div
            onClick={() => navigate(isEmoGame ? `/emoGame/${story._id}` : `/story/${story._id}`)}
            className={`
                relative bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden group border
                ${cardBorderColor}
            `}
        >
            {/* Intestazione Card Colorata */}
            <div className={`h-24 bg-gradient-to-r relative overflow-hidden ${headerGradient}`}>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    {labelBadge}
                </div>
                {hasCompleted && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-md border-2 border-white animate-pulse">
                        <span>✓ Giocato</span>
                    </div>
                )}
            </div>

            <div className="p-6 relative">
                {/* Icona fluttuante */}
                <div className="absolute -top-10 right-6 w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-4xl border-4 border-white group-hover:scale-110 transition-transform">
                    {floatingIcon}
                </div>

                <div className="mt-4">
                    <h3 className="font-black text-2xl text-gray-800 mb-3 leading-tight group-hover:text-purple-600 transition-colors line-clamp-2">
                        {story.title}
                    </h3>

                    {/* Mostra autore solo se disponibile e se è assegnata */}
                    {isAssigned && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg inline-flex w-full">
                            <FaUserMd className="text-blue-400" />
                            <span>
                                Da: <span className="font-bold text-gray-700">{story.authorName || 'Mamma/Papà'}</span>
                            </span>
                        </div>
                    )}

                    <p className="text-gray-600 text-base font-medium line-clamp-2 mb-6 h-12">
                        {story.description || descriptionFallback}
                    </p>

                    <button className={`
                        w-full text-white py-4 rounded-2xl font-black text-xl shadow-lg transition-all flex items-center justify-center gap-3
                        ${buttonClass}
                    `}>
                        {isEmoGame ? (
                            <>Gioca ora 🎮</>
                        ) : (
                            <>Leggi ora <FaBookOpen /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChildDashboard;