import React, { useState, useRef } from 'react';
import { FaTrash } from 'react-icons/fa';
import TextFormatToolbar from '../../../../../shared/components/TextFormatToolbar';
import { renderFormattedText } from '../../../../../shared/utils/textFormat';

const SceneEditor = ({
    paragraph,
    index,
    colors,
    isSequencingGameActive,
    isEmotionGameActive,
    isStrangeStoryActive,
    onUpdate,
    onRemove,
    onMediaChange,
    onKeyStepToggle,
    onRegenerateAudio,
    isSceneRegenerating,
}) => {
    const [showMediaOptions, setShowMediaOptions] = useState(false);
    const textareaRef = useRef(null);
    const strangeStoryRef = useRef(null);

    return (
        <div className={`p-6 rounded-2xl shadow-xl border transition-all ${paragraph.color === 'bg-white' ? 'border-gray-200' : 'border-gray-100'
            } ${paragraph.color}`}>

            {/* Header scena */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-700">Scena {index + 1}</h3>
                {index > 0 && (
                    <button onClick={() => onRemove(paragraph.id)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                        <FaTrash />
                    </button>
                )}
            </div>

            {/* Media Preview */}
            {paragraph.media && paragraph.mediaType !== 'none' && (
                <div className="mb-4 p-4 rounded-xl bg-white shadow-lg flex flex-col items-center">
                    <p className="text-sm font-semibold mb-3 text-gray-600">Anteprima Media</p>
                    {paragraph.mediaType === 'image' && (
                        <img src={paragraph.media} alt={`Scena ${index + 1}`} className="max-h-64 w-auto rounded-lg" />
                    )}
                    {paragraph.mediaType === 'video' && (
                        <video src={paragraph.media} controls className="max-h-64 w-full max-w-md rounded-lg" />
                    )}
                    {paragraph.mediaType === 'audio' && (
                        <audio src={paragraph.media} controls className="w-full max-w-md" />
                    )}
                    <button
                        onClick={() => {
                            onUpdate(paragraph.id, 'media', null);
                            onUpdate(paragraph.id, 'rawFile', null);
                            onUpdate(paragraph.id, 'mediaType', 'none');
                        }}
                        className="mt-3 text-red-500 text-sm hover:underline"
                    >
                        Rimuovi Media
                    </button>
                </div>
            )}

            {/* Testo scena */}
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
                    placeholder="Scrivi qui il testo della scena..."
                    className="w-full p-4 mb-2 border border-gray-200 rounded-xl focus:border-purple-400 bg-white/80 min-h-[100px] resize-y font-mono text-sm text-gray-500"
                />
                {/* Anteprima formattata — mostra grassetto/corsivo reali */}
                {/\{\{(?:BOLD|ITALIC|B|I)[^}]*\}\}/i.test(paragraph.text) && (
                    <div className="mb-3 px-4 py-3 rounded-xl border border-purple-100 bg-purple-50/50 text-sm text-gray-800 leading-relaxed">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-1">Anteprima formattata</span>
                        <span>{renderFormattedText(paragraph.text)}</span>
                    </div>
                )}
            </div>

            {paragraph.text.trim().length > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

            {/* Audio generato per la scena */}
            {paragraph.narrationUrl && (
                <div className="mb-4 p-4 rounded-2xl border border-green-200 bg-green-50 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div>
                            <p className="text-sm font-bold text-green-700">Audio narrato disponibile</p>
                            <p className="text-xs text-green-600">Ascolta l’audio generato per questa scena.</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">Scena {index + 1}</div>
                    </div>
                    <audio controls src={paragraph.narrationUrl} className="w-full rounded-xl" />
                </div>
            )}

            {/* Controlli Media + Colore */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white/60 p-4 rounded-xl">
                {/* 🆕 GRUPPO PULSANTI MEDIA */}
                <div className="flex gap-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg font-bold transition-colors">
                        <span>{paragraph.rawFile ? 'Cambia Media' : 'Aggiungi Media'}</span>
                        <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => onMediaChange(paragraph.id, e.target.files[0])} />
                    </label>
                </div>

                {/* Colori */}
                <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-gray-600 hidden sm:inline">Colore:</span>
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => onUpdate(paragraph.id, 'color', color.value)}
                            className={`w-8 h-8 rounded-full border-2 ${color.value} ${paragraph.color === color.value ? 'ring-2 ring-purple-500' : ''
                                }`}
                            title={color.name}
                        />
                    ))}
                </div>
            </div>

            {/* Opzioni Gioco */}
            {isSequencingGameActive && (
                <div className="mt-4 p-3 border border-dashed border-purple-300 rounded-lg bg-purple-50/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={paragraph.isKeyStep}
                            onChange={(e) => onKeyStepToggle(paragraph.id, e.target.checked)}
                            className="h-5 w-5"
                        />
                        <span className="font-medium text-purple-700">Passo Chiave per il Gioco</span>
                    </label>
                </div>
            )}

            {isEmotionGameActive && (
                <div className="mt-3 p-3 border border-dashed border-teal-300 rounded-lg bg-teal-50/50">
                    <label className="block mb-1 text-sm font-medium text-teal-700">😊 Emozione di questa scena</label>
                    <select
                        value={paragraph.emotion || ''}
                        onChange={(e) => onUpdate(paragraph.id, 'emotion', e.target.value)}
                        className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                        <option value="">— Non partecipa al gioco —</option>
                        <option value="Felice">😊 Felice</option>
                        <option value="Triste">😢 Triste</option>
                        <option value="Arrabbiato">😠 Arrabbiato</option>
                        <option value="Sorpreso">😲 Sorpreso</option>
                        <option value="Spaventato">😨 Spaventato</option>
                        <option value="Eccitato">🤩 Eccitato</option>
                    </select>
                </div>
            )}

            {isStrangeStoryActive && (
                <div className="mt-4 p-5 border-2 border-orange-200 rounded-2xl bg-orange-50/40 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🧠</span>
                            <h4 className="font-bold text-orange-800">Theory of Mind (Strange Story)</h4>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1 rounded-full border border-orange-200 shadow-sm">
                            <input
                                type="checkbox"
                                checked={paragraph.strangeStoryTest?.active || false}
                                onChange={(e) => onUpdate(paragraph.id, 'strangeStoryTest', {
                                    ...(paragraph.strangeStoryTest || {}),
                                    active: e.target.checked
                                })}
                                className="h-5 w-5 accent-orange-500"
                            />
                            <span className="text-xs font-black text-orange-600 uppercase">
                                {paragraph.strangeStoryTest?.active ? 'Attivo' : 'Disattivo'}
                            </span>
                        </label>
                    </div>

                    {paragraph.strangeStoryTest?.active && (
                        <div className="space-y-4 animate-fadeIn">
                            {/* Domanda */}
                            <div>
                                <label className="block text-[10px] font-black text-orange-600 uppercase mb-1 tracking-wider">Domanda per il bambino</label>
                                <TextFormatToolbar
                                    textareaRef={strangeStoryRef}
                                    value={paragraph.strangeStoryTest?.question || ''}
                                    onChange={(newVal) => onUpdate(paragraph.id, 'strangeStoryTest', {
                                        ...(paragraph.strangeStoryTest || {}),
                                        question: newVal
                                    })}
                                />
                                <textarea
                                    ref={strangeStoryRef}
                                    value={paragraph.strangeStoryTest?.question || ''}
                                    onChange={(e) => onUpdate(paragraph.id, 'strangeStoryTest', {
                                        ...(paragraph.strangeStoryTest || {}),
                                        question: e.target.value
                                    })}
                                    placeholder="Es: Perché secondo te il personaggio ha detto questa cosa?"
                                    className="w-full p-4 border-2 border-orange-100 rounded-xl focus:border-orange-400 outline-none bg-white text-gray-700 shadow-inner resize-none mt-2"
                                    rows="2"
                                />
                            </div>

                            {/* Tipo di risposta */}
                            <div>
                                <label className="block text-[10px] font-black text-orange-600 uppercase mb-2 tracking-wider">Tipo di risposta</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'libera', label: '✍️ Risposta Libera', icon: '📝' },
                                        { id: 'blocchi_immagine', label: '🖼️ Opzioni con Immagine', icon: '🖼️' }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => onUpdate(paragraph.id, 'strangeStoryTest', {
                                                ...(paragraph.strangeStoryTest || {}),
                                                type: t.id,
                                                options: t.id === 'libera' ? [] : (paragraph.strangeStoryTest?.options?.length ? paragraph.strangeStoryTest.options : [{ text: '', imageUrl: '', rawFile: null }, { text: '', imageUrl: '', rawFile: null }])
                                            })}
                                            className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${(paragraph.strangeStoryTest?.type || 'libera') === t.id
                                                ? 'border-orange-500 bg-orange-100 text-orange-700 shadow-md scale-[1.02]'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-orange-200'
                                                }`}
                                        >
                                            <span className="text-2xl">{t.icon}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Opzioni (Blocchi) */}
                            {paragraph.strangeStoryTest?.type === 'blocchi_immagine' && (
                                <div className="space-y-4 p-5 bg-white/60 rounded-2xl border-2 border-orange-100 shadow-inner">
                                    <label className="block text-[10px] font-black text-orange-600 uppercase mb-2 tracking-wider">Configura le opzioni</label>
                                    {(paragraph.strangeStoryTest?.options || []).map((opt, optIdx) => {
                                        const isCorrect = opt.isCorrect === true;
                                        const isWrong = opt.isCorrect === false;
                                        const borderColor = isCorrect ? 'border-green-300 bg-green-50/40' : isWrong ? 'border-red-200 bg-red-50/30' : 'border-orange-100';
                                        return (
                                        <div key={optIdx} className={`bg-white p-4 rounded-2xl border-2 shadow-sm space-y-3 transition-all ${borderColor}`}>
                                            {/* Riga testo + numero + elimina */}
                                            <div className="flex items-center gap-3">
                                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm text-white ${isCorrect ? 'bg-green-500' : isWrong ? 'bg-red-400' : 'bg-orange-500'}`}>{optIdx + 1}</span>
                                                <div className="flex-1 flex flex-col">
                                                    <input
                                                        type="text"
                                                        value={opt.text}
                                                        required
                                                        maxLength={120}
                                                        onChange={(e) => {
                                                            const newOpts = [...paragraph.strangeStoryTest.options];
                                                            newOpts[optIdx].text = e.target.value;
                                                            onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                        }}
                                                        placeholder="Testo obbligatorio..."
                                                        className={`w-full p-2 text-sm border-b-2 outline-none transition-colors ${!opt.text ? 'border-red-200 focus:border-red-400' : 'border-gray-100 focus:border-orange-400'}`}
                                                    />
                                                    <div className="text-[9px] text-right mt-1 font-bold text-orange-400 uppercase tracking-tighter">
                                                        {opt.text?.length || 0} / 120 caratteri
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newOpts = paragraph.strangeStoryTest.options.filter((_, i) => i !== optIdx);
                                                        onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>

                                            {/* Immagine + Emoji */}
                                            <div className="flex items-center gap-4 pl-10">
                                                <div className="relative group">
                                                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-orange-400">
                                                        {opt.imageUrl ? (
                                                            <img src={opt.imageUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-2xl text-orange-300">🖼️</span>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const previewUrl = URL.createObjectURL(file);
                                                                    const newOpts = [...paragraph.strangeStoryTest.options];
                                                                    newOpts[optIdx].imageUrl = previewUrl;
                                                                    newOpts[optIdx].rawFile = file;
                                                                    onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    {opt.imageUrl ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newOpts = [...paragraph.strangeStoryTest.options];
                                                                newOpts[optIdx].imageUrl = '';
                                                                newOpts[optIdx].rawFile = null;
                                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md hover:bg-red-600 transition-colors z-10"
                                                        >
                                                            ✕
                                                        </button>
                                                    ) : (
                                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-orange-100 text-[8px] font-black text-orange-500 group-hover:bg-orange-500 group-hover:text-white">
                                                            + CARICA
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-black text-orange-600 uppercase mb-1 tracking-wider">Emoji / Icona</label>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={opt.emoji || ''}
                                                            onChange={(e) => {
                                                                const newOpts = [...paragraph.strangeStoryTest.options];
                                                                newOpts[optIdx].emoji = e.target.value;
                                                                onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                            }}
                                                            className="p-2 border border-orange-200 rounded-lg outline-none text-xl bg-white focus:border-orange-400"
                                                        >
                                                            <option value="">Nessuna</option>
                                                            <option value="😊">😊 Felice</option>
                                                            <option value="😢">😢 Triste</option>
                                                            <option value="😡">😡 Arrabbiato</option>
                                                            <option value="😨">😨 Spaventato</option>
                                                            <option value="😲">😲 Sorpreso</option>
                                                            <option value="🤢">🤢 Disgustato</option>
                                                            <option value="🤔">🤔 Pensieroso</option>
                                                        </select>
                                                        <div className="text-[10px] text-gray-400 leading-tight">
                                                            <p className="font-bold text-gray-500 mb-1">Mostrata se non c'è immagine</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Blocco valutazione: corretto/errato + punteggio + spiegazione ── */}
                                            <div className="pl-10 pt-3 border-t border-orange-100 space-y-3">
                                                {/* Flag corretto / errato */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Valutazione:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newOpts = [...paragraph.strangeStoryTest.options];
                                                            newOpts[optIdx].isCorrect = isCorrect ? null : true;
                                                            onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                        }}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all ${isCorrect ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-white border-green-200 text-green-500 hover:border-green-400'}`}
                                                    >
                                                        ✅ Corretta
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newOpts = [...paragraph.strangeStoryTest.options];
                                                            newOpts[optIdx].isCorrect = isWrong ? null : false;
                                                            onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                        }}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all ${isWrong ? 'bg-red-400 border-red-400 text-white shadow-md' : 'bg-white border-red-200 text-red-400 hover:border-red-400'}`}
                                                    >
                                                        ❌ Errata
                                                    </button>
                                                    {opt.isCorrect === null || opt.isCorrect === undefined ? (
                                                        <span className="text-[10px] text-gray-400 italic">Nessuna valutazione</span>
                                                    ) : null}
                                                </div>

                                                {/* Punteggio */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Punteggio:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={opt.score ?? ''}
                                                        onChange={(e) => {
                                                            const newOpts = [...paragraph.strangeStoryTest.options];
                                                            newOpts[optIdx].score = e.target.value === '' ? null : Number(e.target.value);
                                                            onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                        }}
                                                        placeholder="es. 10"
                                                        className="w-20 p-2 text-sm border-2 border-orange-100 rounded-xl outline-none focus:border-orange-400 bg-white text-center font-bold text-gray-700"
                                                    />
                                                    <span className="text-[10px] text-gray-400 italic">punti (opzionale)</span>
                                                </div>

                                                {/* Spiegazione per questa opzione */}
                                                <div>
                                                    <label className="block text-[10px] font-black text-orange-600 uppercase mb-1 tracking-wider">Spiegazione (Il "Perché")</label>
                                                    <textarea
                                                        value={opt.explanation || ''}
                                                        onChange={(e) => {
                                                            const newOpts = [...paragraph.strangeStoryTest.options];
                                                            newOpts[optIdx].explanation = e.target.value;
                                                            onUpdate(paragraph.id, 'strangeStoryTest', { ...paragraph.strangeStoryTest, options: newOpts });
                                                        }}
                                                        placeholder={isCorrect ? 'Es: Esatto! Marco è felice perché ha ricevuto un bel regalo!' : isWrong ? 'Es: Non proprio… pensa a come si sente il personaggio.' : 'Spiega perché questa risposta è corretta o errata…'}
                                                        rows="2"
                                                        className="w-full p-3 border-2 border-orange-100 rounded-xl focus:border-orange-400 outline-none bg-white text-gray-700 shadow-inner resize-none text-sm"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                                        {isCorrect ? 'Mostrato al bambino quando risponde correttamente.' : isWrong ? 'Mostrato al bambino come feedback su questa risposta errata.' : 'Mostrato al bambino come feedback dopo la risposta.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}

                                    { (paragraph.strangeStoryTest.options?.length || 0) < 6 ? (
                                        <button
                                            type="button"
                                            onClick={() => onUpdate(paragraph.id, 'strangeStoryTest', {
                                                ...paragraph.strangeStoryTest,
                                                options: [...(paragraph.strangeStoryTest.options || []), { text: '', imageUrl: '', rawFile: null, isCorrect: null, score: null, explanation: '' }]
                                            })}
                                            className="w-full py-3 border-2 border-dashed border-orange-200 rounded-2xl text-orange-400 font-bold text-sm hover:bg-orange-50 hover:border-orange-400 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>➕</span> Aggiungi un'altra opzione
                                        </button>
                                    ) : (
                                        <div className="w-full py-3 border-2 border-orange-100 bg-orange-50/50 rounded-2xl text-orange-300 font-bold text-xs text-center">
                                            ⚠️ Hai raggiunto il limite massimo di 6 opzioni
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Risposta corretta per libera */}
                            {paragraph.strangeStoryTest?.type === 'libera' && (
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-orange-600 uppercase tracking-wider">📋 Risposta attesa (Nota Clinica)</label>
                                    <input
                                        type="text"
                                        value={paragraph.strangeStoryTest?.correctAnswer || ''}
                                        onChange={(e) => onUpdate(paragraph.id, 'strangeStoryTest', {
                                            ...(paragraph.strangeStoryTest || {}),
                                            correctAnswer: e.target.value
                                        })}
                                        placeholder="Es: Il protagonista stava scherzando..."
                                        className="w-full p-4 border-2 border-orange-100 rounded-2xl focus:border-orange-400 outline-none bg-white text-gray-700 shadow-inner"
                                    />
                                    <p className="text-[10px] text-gray-400 italic">Questa nota aiuterà il terapista a valutare la risposta libera del bambino.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SceneEditor;