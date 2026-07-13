import React, { useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import { usePresets } from '../../../presets/config';
import TextFormatToolbar from '../../../../../shared/components/TextFormatToolbar';
import { renderFormattedText } from '../../../../../shared/utils/textFormat';

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
    const textareaRef = useRef(null);

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

            {/* Badge scena branching (bivio narrativo generato dalla narrazione adattiva) */}
            {paragraph.isBranching && (
                <div className="mb-4 p-3 rounded-xl border border-indigo-200 bg-indigo-50 flex items-center gap-2 text-indigo-700 text-xs font-bold">
                    <span className="text-lg">🌿</span>
                    <span>Scena a bivio: le opzioni cambiano il seguito della storia</span>
                </div>
            )}

            {/* Sezione immagine della scena */}
            <div className="mb-6 p-4 rounded-2xl border border-purple-100 bg-white shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3">Aggiungi un'immagine alla scena</p>
                {paragraph.media && paragraph.mediaType === 'image' ? (
                    <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={paragraph.media} alt={`Quesito ${index + 1}`} className="w-full object-contain" />
                    </div>
                ) : null}
                {paragraph.imageSuggestion && !paragraph.media && (
                    <div className="mb-3 px-3 py-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-800 text-xs flex items-start gap-2">
                        <span className="text-base leading-none">💡</span>
                        <span><span className="font-bold">Immagine suggerita:</span> {paragraph.imageSuggestion}</span>
                    </div>
                )}
                <label className="flex items-center justify-between gap-3 cursor-pointer rounded-xl border border-dashed border-purple-200 bg-purple-50 px-4 py-3 text-purple-700 hover:bg-purple-100 transition-colors">
                    <span className="font-bold text-sm">{paragraph.media && paragraph.mediaType === 'image' ? 'Cambia immagine' : 'Aggiungi immagine'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onMediaChange(paragraph.id, e.target.files[0])} />
                </label>
                {paragraph.media && paragraph.mediaType === 'image' && (
                    <button
                        type="button"
                        onClick={() => {
                            onUpdate(paragraph.id, 'media', null);
                            onUpdate(paragraph.id, 'rawFile', null);
                            onUpdate(paragraph.id, 'mediaType', 'none');
                        }}
                        className="mt-3 text-sm text-red-500 hover:underline"
                    >
                        Rimuovi immagine
                    </button>
                )}
            </div>

            {/* Testo narrato della scena (usato per l'audio narrato) */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-purple-700 uppercase mb-2 tracking-wider">
                    📖 Testo narrato della scena
                </label>
                <TextFormatToolbar
                    textareaRef={textareaRef}
                    value={paragraph.text}
                    onChange={(newVal) => onUpdate(paragraph.id, 'text', newVal)}
                />
                <textarea
                    ref={textareaRef}
                    value={paragraph.text}
                    onChange={(e) => onUpdate(paragraph.id, 'text', e.target.value)}
                    placeholder="Es: Aurora esce di casa con la mamma per andare al parco. Il sole splende e lei è felice."
                    className="w-full p-4 border border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/90 min-h-[100px] text-gray-700 font-mono text-sm resize-y shadow-sm"
                />
                {/\{\{(?:BOLD|ITALIC|B|I)[^}]*\}\}/i.test(paragraph.text) && (
                    <div className="mt-2 px-4 py-3 rounded-xl border border-purple-100 bg-purple-50/50 text-sm text-gray-800 leading-relaxed">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Anteprima formattata</span>
                        <span>{renderFormattedText(paragraph.text)}</span>
                    </div>
                )}
                <p className="text-[10px] text-gray-400 mt-1 italic">Questo testo viene letto ad alta voce nell'audio narrato della scena.</p>
            </div>

            {/* Domanda da porre al bambino */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-purple-700 uppercase mb-2 tracking-wider">
                    ❓ Domanda da porre al bambino
                </label>
                <textarea
                    value={paragraph.strangeStoryTest?.question || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        onUpdate(paragraph.id, 'strangeStoryTest', {
                            ...(paragraph.strangeStoryTest || {}),
                            question: val,
                            active: true,
                            type: 'blocchi_immagine',
                        });
                    }}
                    placeholder="Es: Cosa vedi nella scena? Quale emozione provano secondo te?"
                    className="w-full p-4 border border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/90 min-h-[80px] text-gray-700 font-medium resize-y shadow-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Questa è la domanda mostrata al bambino sotto la scena, con le opzioni di risposta qui sotto.</p>
            </div>

            {paragraph.text.trim().length > 0 && (
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => onRegenerateAudio?.(paragraph.id)}
                        disabled={isSceneRegenerating}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold transition-all ${isSceneRegenerating
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-[1.01]'
                        }`}
                    >
                        {paragraph.narrationUrl ? '🔄 Rigenera audio scena' : '🎤 Genera audio scena'}
                    </button>

                    {paragraph.text.trim().length < 100 && (
                        <div className="w-full sm:w-auto p-4 rounded-2xl border border-yellow-300 bg-yellow-50 text-sm text-yellow-800 flex items-start gap-3">
                            <span className="text-xl mt-0.5">⚠️</span>
                            <div>
                                <p className="font-semibold">Testo corto</p>
                                <p className="text-xs leading-snug">Consigliato argomentare un po' di più: le tracce audio molto corte possono perdere qualità. In alternativa, caricare una tua registrazione audio.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {paragraph.narrationUrl && (
                <div className="mb-6 p-4 rounded-2xl border border-green-200 bg-green-50 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div>
                            <p className="text-sm font-bold text-green-700">Audio narrato disponibile</p>
                            <p className="text-xs text-green-600">Ascolta l’audio generato per questa scena.</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">Quesito {index + 1}</div>
                    </div>
                    <audio controls src={paragraph.narrationUrl} className="w-full rounded-xl" />
                </div>
            )}

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

                                {/* Blocco valutazione: corretto/errato + punteggio + spiegazione (solo scene quiz) */}
                                <div className="pl-10 pt-3 border-t border-purple-50 space-y-3">
                                    {/* Flag corretto / errato — non applicabile alle scene a bivio */}
                                    {!paragraph.isBranching && (
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
                                    )}
                                    {opt.imageSuggestion ? (
                                        <div className="pl-10 text-xs text-gray-500 italic">
                                            💡 Immagine suggerita: {opt.imageSuggestion}
                                        </div>
                                    ) : null}
                                    {paragraph.isBranching && typeof opt.nextSceneIndex === 'number' && opt.nextSceneIndex !== null ? (
                                        <div className="pl-10 text-[10px] text-indigo-600 uppercase tracking-wider font-bold mt-2">
                                            🌿 Se scelta, va a scena {opt.nextSceneIndex + 1}
                                        </div>
                                    ) : null}
                                    {/* carica immagine */}
                                    <div className="space-y-3 rounded-3xl border border-purple-100 bg-purple-50/60 p-4">
                                        <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider font-black text-purple-600">
                                            <span>Scegli un solo tipo di media per questa opzione</span>
                                            <span className="text-gray-400">Emoji o Immagine</span>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Emoji</span>
                                                    <span className="text-[10px] text-gray-400">Opzionale</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={opt.emoji || ''}
                                                    maxLength={16}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                            i === optIdx ? { ...o, emoji: value, rawFile: null, imageUrl: '' } : { ...o }
                                                        );
                                                        onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                    }}
                                                    placeholder="Es: 😊🎉💫"
                                                    className="w-full p-2 border border-purple-100 rounded-xl outline-none focus:border-purple-400 bg-white text-sm text-gray-700"
                                                />
                                                <p className="text-[10px] text-gray-400 italic">Scrivi qui una o più emoji; se aggiungi emoji, l'immagine verrà rimossa.</p>
                                                {opt.emoji ? (
                                                    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2 text-2xl">{opt.emoji}</div>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Immagine</span>
                                                    <span className="text-[10px] text-gray-400">Opzionale</span>
                                                </div>
                                                <label className="flex items-center justify-between gap-3 cursor-pointer rounded-xl border border-dashed border-purple-200 bg-purple-50 px-4 py-3 text-purple-700 hover:bg-purple-100 transition-colors">
                                                    <span className="text-sm font-bold">{opt.imageUrl ? 'Cambia immagine' : 'Aggiungi immagine'}</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const previewUrl = URL.createObjectURL(file);
                                                        const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                            i === optIdx ? { ...o, rawFile: file, imageUrl: previewUrl, emoji: '' } : { ...o }
                                                        );
                                                        onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                    }} />
                                                </label>
                                                <p className="text-[10px] text-gray-400 italic">Carica un'immagine. Se scegli un'immagine, le emoji verranno cancellate.</p>
                                                {opt.imageUrl ? (
                                                    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                                                        <img src={opt.imageUrl} alt={`Opzione ${optIdx + 1}`} className="w-full object-cover max-h-40" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                                    i === optIdx ? { ...o, rawFile: null, imageUrl: '' } : { ...o }
                                                                );
                                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                                                        >
                                                            Rimuovi immagine
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Punteggio — non applicabile alle scene a bivio */}
                                    {!paragraph.isBranching && (
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
                                    )}

                                    {/* Continuazione della storia — solo scene a bivio */}
                                    {paragraph.isBranching && (
                                        <div>
                                            <label className="block text-[10px] font-black text-indigo-600 uppercase mb-1 tracking-wider">🌿 Continuazione se scelta questa opzione</label>
                                            <textarea
                                                value={opt.nextSceneText || ''}
                                                onChange={(e) => {
                                                    const newOpts = paragraph.strangeStoryTest.options.map((o, i) =>
                                                        i === optIdx ? { ...o, nextSceneText: e.target.value } : { ...o }
                                                    );
                                                    onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                }}
                                                placeholder="Cosa succede nella storia se il bambino sceglie questa opzione..."
                                                rows="2"
                                                className="w-full p-3 border border-indigo-100 rounded-xl focus:border-indigo-400 outline-none bg-white text-gray-700 shadow-inner resize-none text-sm"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 italic">
                                                Il ramo narrativo mostrato al bambino prima che la storia prosegua con la scena successiva.
                                            </p>
                                        </div>
                                    )}

                                    {/* Spiegazione per questa opzione — solo scene quiz */}
                                    {!paragraph.isBranching && (
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
                                    )}
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