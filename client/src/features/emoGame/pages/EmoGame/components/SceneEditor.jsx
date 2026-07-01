import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { usePresets } from '../../../presets/config';

const SceneEditor = ({
    paragraph,
    index,
    colors,
    isSequencingGameActive,
    isEmotionGameActive,
    //isStrangeStoryActive,
    onUpdate,
    onRemove,
    onMediaChange,
    onKeyStepToggle,
    onRegenerateAudio,
    isSceneRegenerating,
    difficulty = 'DifI',
}) => {
    const [showPresetsModal, setShowPresetsModal] = React.useState(false);
    const { presets, isLoadingPresets } = usePresets();

    return (
        <div className={`p-6 rounded-2xl shadow-xl border transition-all ${paragraph.color === 'bg-white' ? 'border-gray-200' : 'border-gray-100'
            } ${paragraph.color}`}>

            {/* Header quesito */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-700">Quesito {index + 1}</h3>
                {index > 0 && (
                    <button onClick={() => onRemove(paragraph.id)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                        <FaTrash />
                    </button>
                )}
            </div>

            {/* Sezione Media (Immagine/Video/Audio) */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-purple-700 uppercase mb-2 tracking-wider">
                    🖼️ Contenuto Multimediale dello Scenario
                </label>

                {paragraph.media && paragraph.mediaType !== 'none' ? (
                    <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm flex flex-col items-center">
                        <span className="text-[10px] font-black text-purple-400 uppercase mb-2 tracking-wider">Anteprima Media Attivo</span>
                        <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-inner flex items-center justify-center bg-gray-50 p-2 border border-gray-100">
                            {paragraph.mediaType === 'image' && (
                                <img src={paragraph.media} alt={`Quesito ${index + 1}`} className="max-h-64 w-auto rounded-lg object-contain" />
                            )}
                            {paragraph.mediaType === 'video' && (
                                <video src={paragraph.media} controls className="max-h-64 w-full rounded-lg" />
                            )}
                            {paragraph.mediaType === 'audio' && (
                                <div className="w-full p-4 flex flex-col items-center">
                                    <span className="text-3xl mb-2">🎵</span>
                                    <audio src={paragraph.media} controls className="w-full" />
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex gap-3 flex-wrap justify-center">
                            <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-xs font-black transition-colors border border-purple-200 flex items-center">
                                <span>Cambia File</span>
                                <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => onMediaChange(paragraph.id, e.target.files[0])} />
                            </label>
                            
                            <button
                                type="button"
                                onClick={() => setShowPresetsModal(true)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black transition-colors border border-indigo-200"
                            >
                                Scegli da Preset
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onUpdate(paragraph.id, 'media', null);
                                    onUpdate(paragraph.id, 'rawFile', null);
                                    onUpdate(paragraph.id, 'mediaType', 'none');
                                }}
                                className="text-red-500 text-xs font-black hover:underline px-4 py-2"
                            >
                                Rimuovi Media
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/20 text-center">
                        <div className="flex gap-3 text-3xl mb-3 text-purple-400">
                            <span>🖼️</span>
                            <span>📹</span>
                            <span>🎵</span>
                        </div>
                        <span className="text-sm font-bold text-purple-900 mb-1">
                            Aggiungi il Contenuto Multimediale
                        </span>
                        <span className="text-xs text-purple-500 max-w-md px-4 leading-normal mb-4">
                            Questo sarà lo scenario visivo o sonoro che il bambino guarderà o ascolterà per comprendere la situazione ed indovinarne l'emozione corretta.
                        </span>
                        
                        <div className="flex flex-wrap gap-3 justify-center">
                            <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95">
                                <span>💻 Dal Dispositivo</span>
                                <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => onMediaChange(paragraph.id, e.target.files[0])} />
                            </label>
                            
                            <button
                                type="button"
                                onClick={() => setShowPresetsModal(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95"
                            >
                                🎨 Preset della Piattaforma
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Domanda da porre al bambino */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-purple-700 uppercase mb-2 tracking-wider">
                    ❓ Domanda da porre al bambino
                </label>
                <textarea
                    value={paragraph.text}
                    onChange={(e) => {
                        const val = e.target.value;
                        onUpdate(paragraph.id, 'text', val);
                        onUpdate(paragraph.id, 'strangeStoryTest', {
                            ...(paragraph.strangeStoryTest || {}),
                            question: val,
                            active: true,
                            type: 'blocchi_immagine',
                        });
                    }}
                    placeholder="Es: Cosa vedi nella scena? Quale emozione provano secondo te?"
                    className="w-full p-4 border border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/90 min-h-[100px] text-gray-700 font-medium resize-y shadow-sm"
                />
            </div>

            {/* Colore della Scheda */}
            <div className="flex gap-3 items-center justify-end bg-white/60 p-4 rounded-xl mb-6">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Colore della scheda:</span>
                <div className="flex gap-2 items-center">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => onUpdate(paragraph.id, 'color', color.value)}
                            className={`w-7 h-7 rounded-full border-2 ${color.value} ${paragraph.color === color.value ? 'ring-2 ring-purple-500' : ''
                                }`}
                            title={color.name}
                        />
                    ))}
                </div>
            </div>

            {/* Sezione Risposte dell'EmoGame (Scelta Multipla) */}
            <div className="mt-6 space-y-4">
                <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider">
                    📋 Opzioni di Risposta (Scelta Multipla)
                </label>
                <div className="space-y-4 p-5 bg-purple-50/30 rounded-2xl border border-purple-100 shadow-inner">
                    {(() => {
                        const hasCorrectAnswer = (paragraph.strangeStoryTest?.options || []).some(o => o.isCorrect === true);
                        return (paragraph.strangeStoryTest?.options || []).map((opt, optIdx) => {
                        const isCorrect = opt.isCorrect === true;
                        const isWrong = opt.isCorrect === false;
                        const anotherIsCorrect = hasCorrectAnswer && !isCorrect;
                        const borderColor = isCorrect ? 'border-green-300 bg-green-50/40' : isWrong ? 'border-red-200 bg-red-50/30' : 'border-purple-100';
                        return (
                            <div key={optIdx} className={`bg-white p-4 rounded-2xl border shadow-sm space-y-3 transition-all ${borderColor}`}>
                                {/* Riga testo + numero + elimina */}
                                <div className="flex items-center gap-3">
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm text-white ${isCorrect ? 'bg-green-500' : isWrong ? 'bg-red-400' : 'bg-purple-500'}`}>
                                        {optIdx + 1}
                                    </span>
                                    <div className="flex-1 flex flex-col">
                                        <input
                                            type="text"
                                            value={opt.text}
                                            required
                                            maxLength={120}
                                            onChange={(e) => {
                                                const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                    i === optIdx ? { ...o, text: e.target.value } : { ...o }
                                                );
                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                            }}
                                            placeholder="Inserisci il testo della risposta..."
                                            className={`w-full p-2 text-sm border-b outline-none transition-colors ${!opt.text ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-purple-400'}`}
                                        />
                                        <div className="text-[9px] text-right mt-1 font-bold text-purple-400 uppercase tracking-tighter">
                                            {opt.text?.length || 0} / 120 caratteri
                                        </div>
                                    </div>
                                    {paragraph.strangeStoryTest.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newOpts = paragraph.strangeStoryTest.options.filter((_, i) => i !== optIdx);
                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                            }}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Blocco valutazione: corretto/errato + punteggio + spiegazione */}
                                <div className="pl-10 pt-3 border-t border-purple-50 space-y-3">
                                    {/* Flag corretto / errato */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Valutazione:</span>
                                        <button
                                            type="button"
                                            disabled={anotherIsCorrect}
                                            onClick={() => {
                                                const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                    i === optIdx ? { ...o, isCorrect: isCorrect ? null : true } : { ...o }
                                                );
                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${isCorrect ? 'bg-green-500 border-green-500 text-white shadow-md' : anotherIsCorrect ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed' : 'bg-white border-green-200 text-green-500 hover:border-green-400'}`}
                                            title={anotherIsCorrect ? 'Esiste già una risposta corretta' : ''}
                                        >
                                            ✅ Corretta
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                    i === optIdx ? { ...o, isCorrect: isWrong ? null : false } : { ...o }
                                                );
                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${isWrong ? 'bg-red-400 border-red-400 text-white shadow-md' : 'bg-white border-red-200 text-red-400 hover:border-red-400'}`}
                                        >
                                            ❌ Errata
                                        </button>
                                        {opt.isCorrect === null || opt.isCorrect === undefined ? (
                                            <span className="text-[10px] text-gray-400 italic">Nessuna valutazione</span>
                                        ) : null}
                                    </div>

                                    {/* Punteggio */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Punteggio:</span>
                                        <select
                                            value={opt.score ?? ''}
                                            onChange={(e) => {
                                                const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                    i === optIdx ? { ...o, score: e.target.value === '' ? null : Number(e.target.value) } : { ...o }
                                                );
                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                            }}
                                            className="w-24 p-2 text-sm border border-purple-100 rounded-xl outline-none focus:border-purple-400 bg-white text-center font-bold text-gray-700 shadow-sm cursor-pointer"
                                        >
                                            <option value="">--</option>
                                            {[...Array(11)].map((_, i) => (
                                                <option key={i} value={i}>{i}</option>
                                            ))}
                                        </select>
                                        <span className="text-[10px] text-gray-400 italic">punti (opzionale)</span>
                                    </div>

                                    {/* Spiegazione per questa opzione */}
                                    <div>
                                        <label className="block text-[10px] font-black text-purple-600 uppercase mb-1 tracking-wider">Spiegazione (Il "Perché")</label>
                                        <textarea
                                            value={opt.explanation || ''}
                                            onChange={(e) => {
                                                const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                    i === optIdx ? { ...o, explanation: e.target.value } : { ...o }
                                                );
                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                            }}
                                            placeholder={isCorrect ? 'Es: Esatto! Marco è felice perché ha ricevuto un bel regalo!' : isWrong ? 'Es: Non proprio… pensa a come si sente il personaggio.' : 'Spiega perché questa risposta è corretta o errata…'}
                                            rows="2"
                                            className="w-full p-3 border border-purple-100 rounded-xl focus:border-purple-400 outline-none bg-white text-gray-700 shadow-inner resize-none text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 italic">
                                            {isCorrect ? 'Mostrato al bambino quando risponde correttamente.' : isWrong ? 'Mostrato al bambino come feedback su questa risposta errata.' : 'Mostrato al bambino come feedback dopo la risposta.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    });
                    })()}

                    {(paragraph.strangeStoryTest?.options?.length || 0) < 6 ? (
                        <button
                            type="button"
                            onClick={() => onUpdate(paragraph.id, 'strangeStoryTest', {
                                ...paragraph.strangeStoryTest,
                                options: [...(paragraph.strangeStoryTest.options || []), { text: '', imageUrl: '', emoji: '', rawFile: null, isCorrect: null, score: null, explanation: '' }]
                            })}
                            className="w-full py-3 border-2 border-dashed border-purple-200 rounded-2xl text-purple-500 font-bold text-sm hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center justify-center gap-2 bg-white"
                        >
                            <span>➕</span> Aggiungi un'altra opzione
                        </button>
                    ) : (
                        <div className="w-full py-3 border border-purple-100 bg-purple-50/50 rounded-2xl text-purple-400 font-bold text-xs text-center">
                            ⚠️ Hai raggiunto il limite massimo di 6 opzioni
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL SELEZIONE PRESET */}
            {showPresetsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-2xl border-4 border-purple-100 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                🎨 Preset di Storie Amiche
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold uppercase">
                                    {difficulty === 'DifI' ? 'Emoji' : difficulty === 'DifII' ? 'Immagini' : 'Video'}
                                </span>
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setShowPresetsModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold border-none bg-transparent cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="text-sm text-gray-500 my-3 leading-relaxed">
                            {difficulty === 'DifI' && "Seleziona una delle emoji stilizzate per impostarla come scenario visivo del quesito."}
                            {difficulty === 'DifII' && "Seleziona un'illustrazione della situazione da presentare al bambino."}
                            {difficulty === 'DifIII' && "Seleziona un breve filmato. Passa il cursore sul video per vederlo in riproduzione."}
                        </div>

                        {isLoadingPresets ? (
                            <div className="flex items-center justify-center py-12 text-purple-400 font-bold text-sm">
                                ⏳ Caricamento preset...
                            </div>
                        ) : (presets[difficulty] || []).length === 0 ? (
                            <div className="flex items-center justify-center py-12 text-gray-400 font-bold text-sm">
                                Nessun preset disponibile per questo livello.
                            </div>
                        ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto py-2 flex-1 min-h-0">
                            {(presets[difficulty] || []).map((preset) => {
                                const isSelected = paragraph.media === preset.url;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => {
                                            onUpdate(paragraph.id, 'media', preset.url);
                                            onUpdate(paragraph.id, 'mediaType', preset.type);
                                            onUpdate(paragraph.id, 'rawFile', null);
                                            setShowPresetsModal(false);
                                        }}
                                        className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all cursor-pointer bg-gray-50/50 hover:bg-white text-left ${
                                            isSelected 
                                                ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-200' 
                                                : 'border-gray-100 hover:border-purple-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="w-full flex-1 flex items-center justify-center min-h-[96px] bg-white rounded-xl p-1 overflow-hidden border border-gray-100">
                                            {difficulty === 'DifI' && (
                                                <img src={preset.url} alt={preset.name} className="w-16 h-16 object-contain" />
                                            )}
                                            {difficulty === 'DifII' && (
                                                <img src={preset.url} alt={preset.name} className="w-full h-24 object-cover rounded-lg" />
                                            )}
                                            {difficulty === 'DifIII' && (
                                                <video
                                                    src={preset.url}
                                                    muted
                                                    loop
                                                    playsInline
                                                    onMouseEnter={(e) => e.target.play().catch(() => {})}
                                                    onMouseLeave={(e) => {
                                                        e.target.pause();
                                                        e.target.currentTime = 0;
                                                    }}
                                                    className="w-full h-24 object-cover rounded-lg bg-black"
                                                />
                                            )}
                                        </div>
                                        <span className="text-xs font-black text-gray-700 mt-2 text-center w-full truncate">
                                            {preset.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowPresetsModal(false)}
                                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SceneEditor;