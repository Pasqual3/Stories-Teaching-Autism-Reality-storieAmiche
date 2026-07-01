// src/components/games/SequencingGame.jsx
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appContext } from '../../context/appContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../../shared/components/Navbar';
import useGameTracker from '../../shared/hooks/useGameTracker';
import { Helmet } from 'react-helmet-async';

const COLORS = [
    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
    { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
    { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
    { bg: '#ccfbf1', border: '#14b8a6', text: '#0f766e' },
    { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
];

const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const SequencingGame = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, userData, activeChild } = useContext(appContext);

    const [story, setStory] = useState(null);
    const [slots, setSlots] = useState([]);
    const [pool, setPool] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [loading, setLoading] = useState(true);
    const [placedCount, setPlacedCount] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    const { recordMove, endGame, initMove } = useGameTracker({
        childId: activeChild?.childId || userData?.childId || userData?._id,
        gameType: 'sequencing',
        storyId,
        enabled: true
    });

    useEffect(() => {
        const checkTouch = () => {
            setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };
        checkTouch();
        window.addEventListener('resize', checkTouch);
        return () => window.removeEventListener('resize', checkTouch);
    }, []);

    useEffect(() => { fetchStory(); }, [storyId]);

    const fetchStory = async () => {
        try {

            const { data } = await axios.get(`${backendUrl}/api/story/${storyId}`);
            if (data.success) {
                setStory(data.story);
                const numScenes = data.story.paragraphs.length;
                setSlots(new Array(numScenes).fill(null));
                const decorated = data.story.paragraphs.map((scene, idx) => ({
                    ...scene,
                    originalIndex: idx,
                    color: COLORS[idx % COLORS.length]
                }));
                setPool(shuffleArray(decorated));
                initMove();
            } else {
                toast.error("Storia non trovata");
                navigate('/');
            }
        } catch (error) {
            toast.error("Errore nel caricamento");
        } finally {
            setLoading(false);
        }
    };

    const [draggedItem, setDraggedItem] = useState(null);
    const [dragSource, setDragSource] = useState(null);

    const handleDragStart = (e, item, source, index) => {
        setDraggedItem({ item, index });
        setDragSource(source);
        e.dataTransfer.effectAllowed = 'move';
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        e.currentTarget.style.opacity = '0.6';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedItem(null);
        setDragSource(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropOnSlot = (e, targetIndex) => {
        e.preventDefault();
        if (!draggedItem) return;
        const { item, index: sourceIndex } = draggedItem;
        const newSlots = [...slots];
        if (dragSource === 'pool') {
            newSlots[targetIndex] = item;
            setPlacedCount(prev => prev + 1);
        } else if (dragSource === 'slot') {
            const temp = newSlots[targetIndex];
            newSlots[targetIndex] = item;
            newSlots[sourceIndex] = temp;
        }
        setSlots(newSlots);
        setDraggedItem(null);
        setDragSource(null);
        if (newSlots.filter(s => s !== null).length === slots.length) {
            setTimeout(() => checkOrder(newSlots), 400);
        }
    };

    const handleDropOnPool = (e) => {
        e.preventDefault();
        if (dragSource === 'slot' && draggedItem) {
            const newSlots = [...slots];
            newSlots[draggedItem.index] = null;
            setSlots(newSlots);
            setPlacedCount(prev => prev - 1);
        }
        setDraggedItem(null);
        setDragSource(null);
    };

    const handleTouchSelect = (item, source, index) => {
        if (isComplete) return;
        if (selectedItem && selectedItem.source === 'pool' && source === 'slot') {
            if (slots[index] === null) {
                const newSlots = [...slots];
                newSlots[index] = selectedItem.item;
                setSlots(newSlots);
                setPlacedCount(prev => prev + 1);
                setSelectedItem(null);
                if (newSlots.filter(s => s !== null).length === slots.length) {
                    setTimeout(() => checkOrder(newSlots), 400);
                }
            }
        } else if (selectedItem && selectedItem.source === 'slot' && source === 'pool') {
            const newSlots = [...slots];
            newSlots[selectedItem.index] = null;
            setSlots(newSlots);
            setPlacedCount(prev => prev - 1);
            setSelectedItem(null);
        } else if (selectedItem && selectedItem.source === 'slot' && source === 'slot') {
            const newSlots = [...slots];
            const temp = newSlots[index];
            newSlots[index] = selectedItem.item;
            newSlots[selectedItem.index] = temp;
            setSlots(newSlots);
            setSelectedItem(null);
        } else {
            setSelectedItem({ item, source, index });
        }
    };

    const handlePoolClick = (scene, index) => {
        if (isComplete) return;
        const isUsed = slots.some(s => s?.originalIndex === scene.originalIndex);
        if (isUsed) return;
        if (isTouchDevice) {
            handleTouchSelect(scene, 'pool', index);
            return;
        }
        const firstFree = slots.indexOf(null);
        if (firstFree !== -1) {
            const newSlots = [...slots];
            newSlots[firstFree] = scene;
            setSlots(newSlots);
            setPlacedCount(prev => prev + 1);
            if (newSlots.filter(s => s !== null).length === slots.length) {
                setTimeout(() => checkOrder(newSlots), 400);
            }
        }
    };

    const handleSlotClick = (index) => {
        if (isComplete) return;
        const scene = slots[index];
        if (isTouchDevice) {
            if (scene) {
                handleTouchSelect(scene, 'slot', index);
            } else if (selectedItem) {
                handleTouchSelect(null, 'slot', index);
            }
            return;
        }
        if (scene) {
            const newSlots = [...slots];
            newSlots[index] = null;
            setSlots(newSlots);
            setPlacedCount(prev => prev - 1);
        }
    };

    const checkOrder = (currentSlots) => {
        const allCorrect = currentSlots.every((scene, idx) => scene?.originalIndex === idx);
        setIsCorrect(allCorrect);
        setIsComplete(true);
        const wrongMoves = currentSlots.filter((scene, idx) => scene && scene.originalIndex !== idx).length;
        recordMove(allCorrect, { totalSlots: slots.length, wrongPlacements: wrongMoves });
        endGame(allCorrect ? 100 : Math.round(((slots.length - wrongMoves) / slots.length) * 100));
        if (allCorrect) toast.success("🌟 Ottimo lavoro!");
        else toast.info("🤔 Controlla ancora...");
    };

    const resetGame = () => {
        setSlots(new Array(story.paragraphs.length).fill(null));
        setPlacedCount(0);
        setIsComplete(false);
        setIsCorrect(false);
        setSelectedItem(null);
        setPool(prev => shuffleArray(prev.map(s => ({ ...s }))));
        initMove();
    };

    const renderSlot = (scene, index) => {
        const isEmpty = !scene;
        const isSelected = selectedItem?.source === 'slot' && selectedItem?.index === index;
        const isCorrectPlacement = isComplete && scene?.originalIndex === index;
        const isWrongPlacement = isComplete && scene && scene.originalIndex !== index;

        return (

            <div
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSlot(e, index)}
                onClick={() => handleSlotClick(index)}
                style={{
                    position: 'relative',
                    borderRadius: '16px',
                    border: isEmpty
                        ? '3px dashed #d4c5b0'
                        : isCorrectPlacement
                            ? '3px solid #22c55e'
                            : isWrongPlacement
                                ? '3px solid #ef4444'
                                : `3px solid ${scene.color.border}`,
                    backgroundColor: '#ffffff',
                    minWidth: '180px',
                    width: '100%',
                    maxWidth: '240px',
                    padding: '16px',
                    cursor: isEmpty ? 'pointer' : 'move',
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected
                        ? '0 0 0 4px #fbbf24, 0 4px 12px rgba(0,0,0,0.15)'
                        : scene ? '0 2px 8px rgba(0,0,0,0.1)' : 'inset 0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                }}
            >
                {/* Numero slot - NERO su sfondo bianco/grigio per massimo contrasto */}
                <div
                    style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '900',
                        backgroundColor: isEmpty ? '#f3f4f6' : '#1f2937',
                        color: isEmpty ? '#9ca3af' : '#ffffff',
                        border: `3px solid ${isEmpty ? '#d1d5db' : '#1f2937'}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    {index + 1}
                </div>

                {scene ? (
                    <>
                        {scene.mediaUrl && (
                            <img
                                src={scene.mediaUrl}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '120px',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    marginTop: '32px',
                                }}
                                draggable={false}
                            />
                        )}
                        <p
                            style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                textAlign: 'center',
                                lineHeight: '1.5',
                                color: scene.color.text,
                                margin: 0,
                                width: '100%',
                                wordBreak: 'break-word',
                            }}
                        >
                            {scene.text}
                        </p>

                        {isComplete && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    backgroundColor: isCorrectPlacement ? '#22c55e' : '#ef4444',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}
                            >
                                {isCorrectPlacement ? '✓' : '✕'}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '160px',
                    }}>
                        <span style={{
                            fontSize: '64px',
                            fontWeight: '900',
                            color: '#e5e7eb',
                        }}>
                            {index + 1}
                        </span>
                    </div>
                )}

                {!isEmpty && !isComplete && (
                    <div
                        draggable={!isTouchDevice}
                        onDragStart={(e) => handleDragStart(e, scene, 'slot', index)}
                        onDragEnd={handleDragEnd}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 10,
                            cursor: 'move',
                        }}
                    />
                )}
            </div>
        );
    };

    const renderPoolItem = (scene, index) => {
        const isUsed = slots.some(s => s?.originalIndex === scene.originalIndex);
        const isSelected = selectedItem?.item?.originalIndex === scene.originalIndex;

        return (

            <div
                key={index}
                onClick={() => handlePoolClick(scene, index)}
                style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: isUsed ? '#f3f4f6' : scene.color.bg,
                    border: `3px solid ${isSelected ? '#fbbf24' : isUsed ? '#d1d5db' : scene.color.border}`,
                    opacity: isUsed ? 0.4 : 1,
                    pointerEvents: isUsed ? 'none' : 'auto',
                    cursor: isUsed ? 'default' : 'pointer',
                    transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: isSelected
                        ? '0 0 0 4px #fbbf24, 0 4px 12px rgba(0,0,0,0.15)'
                        : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    width: '100%',
                }}
            >
                {/* Immagine a sinistra - più grande */}
                {scene.mediaUrl ? (
                    <div style={{
                        width: '120px',
                        minWidth: '120px',
                        flexShrink: 0,
                    }}>
                        <img
                            src={scene.mediaUrl}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '100px',
                                objectFit: 'cover',
                            }}
                            draggable={false}
                        />
                    </div>
                ) : (
                    <div style={{
                        width: '80px',
                        minWidth: '80px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: scene.color.border + '40',
                    }}>
                        <span style={{ fontSize: '32px', opacity: 0.4 }}>📝</span>
                    </div>
                )}

                {/* Testo a destra - più spazio */}
                <div style={{
                    flex: 1,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <p style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        lineHeight: '1.6',
                        color: isUsed ? '#9ca3af' : scene.color.text,
                        margin: 0,
                        wordBreak: 'break-word',
                    }}>
                        {scene.text}
                    </p>
                </div>

                {!isUsed && !isTouchDevice && (
                    <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, scene, 'pool', index)}
                        onDragEnd={handleDragEnd}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 10,
                            cursor: 'move',
                        }}
                    />
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fefce8',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        border: '4px solid #fde68a',
                        borderTopColor: '#f59e0b',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <p style={{ fontSize: '20px', fontWeight: '500', color: '#92400e' }}>
                        Preparando il gioco...
                    </p>
                </div>
            </div>
        );
    }

    const progressPercent = slots.length > 0 ? (placedCount / slots.length) * 100 : 0;

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#fefce8',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <Helmet>
                <title>Gioco: Sequenza Scene — Storie Amiche</title>
            </Helmet>
            <Navbar />

            {/* HEADER */}
            <header style={{
                flex: 'none',
                padding: '12px 24px',
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderBottom: '2px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        backgroundColor: '#fef3c7',
                    }}>
                        🧩
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#451a03', margin: 0 }}>
                            Metti in Ordine
                        </h1>
                        <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                            {story?.title}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '160px',
                        height: '12px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '6px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            borderRadius: '6px',
                            transition: 'width 0.5s ease',
                            width: `${progressPercent}%`,
                            backgroundColor: progressPercent === 100 ? '#22c55e' : '#f59e0b',
                        }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e', minWidth: '40px' }}>
                        {placedCount}/{slots.length}
                    </span>
                </div>
            </header>

            {/* ISTRUZIONI TOUCH */}
            {isTouchDevice && !isComplete && (
                <div style={{
                    flex: 'none',
                    padding: '8px 24px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                }}>
                    {selectedItem
                        ? `👆 ${selectedItem.source === 'pool' ? 'Pezzo' : 'Slot'} selezionato. Tocca dove vuoi metterlo`
                        : '👆 Tocca un pezzo per selezionarlo, poi tocca lo slot dove vuoi metterlo'
                    }
                </div>
            )}

            {/* LAYOUT PRINCIPALE - 50/50 */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
            }}>
                {/* AREA SLOT (sinistra) - 50% */}
                <div style={{
                    flex: '1 1 50%',
                    padding: '20px',
                    overflowY: 'auto',
                    minWidth: '400px',
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '3px dashed #fde68a',
                        borderRadius: '24px',
                        padding: '24px',
                        minHeight: '100%',
                    }}>
                        <h2 style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: '#92400e',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: 'white',
                                backgroundColor: '#f59e0b',
                            }}>
                                1
                            </span>
                            La tua sequenza
                        </h2>

                        {/* Griglia slot - orizzontale con wrap, gap stretto */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            justifyContent: 'center',
                            alignContent: 'flex-start',
                        }}>
                            {slots.map((scene, idx) => renderSlot(scene, idx))}
                        </div>
                    </div>
                </div>

                {/* AREA POOL (destra) - 50% */}
                <div
                    style={{
                        flex: '1 1 50%',
                        padding: '20px',
                        overflowY: 'auto',
                        backgroundColor: '#fffbeb',
                        borderLeft: '3px solid #fde68a',
                        minWidth: '400px',
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnPool}
                >
                    <h2 style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: '#92400e',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'white',
                            backgroundColor: '#3b82f6',
                        }}>
                            2
                        </span>
                        Pezzi disponibili
                    </h2>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}>
                        {pool.map((scene, idx) => renderPoolItem(scene, idx))}
                    </div>
                </div>
            </div>

            {/* OVERLAY RISULTATO */}
            {isComplete && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        maxWidth: '400px',
                        width: '100%',
                        borderRadius: '24px',
                        padding: '32px',
                        textAlign: 'center',
                        backgroundColor: 'white',
                        border: `4px solid ${isCorrect ? '#22c55e' : '#f59e0b'}`,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        animation: 'fadeInUp 0.4s ease-out',
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                            {isCorrect ? '🌟' : '🤔'}
                        </div>
                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: isCorrect ? '#166534' : '#92400e',
                        }}>
                            {isCorrect ? 'Ottimo lavoro!' : 'Ci siamo quasi!'}
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            marginBottom: '24px',
                            color: '#78716c',
                            lineHeight: '1.5',
                        }}>
                            {isCorrect
                                ? 'Hai messo tutto nel giusto ordine!'
                                : 'Alcuni pezzi sono da sistemare. Riprova!'
                            }
                        </p>
                        <button
                            onClick={resetGame}
                            style={{
                                padding: '14px 32px',
                                borderRadius: '16px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: isCorrect ? '#22c55e' : '#f59e0b',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            {isCorrect ? 'Gioca ancora' : 'Riprova'}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SequencingGame;
