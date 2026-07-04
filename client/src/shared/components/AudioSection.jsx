import React from 'react';
import ProgressBar from './ProgressBar';

const AudioSection = ({
    voices, selectedVoice, setSelectedVoice,
    selectedSpeed, setSelectedSpeed,
    isGeneratingAudio, generationProgress,
    sceneDone, sceneTotal,
    audioUrl, manualAudioPreview,
    handleGenerateAudio, handleManualAudioChange, clearManualAudio,
    canGenerateAudio, totalCharacters, validParagraphsCount
    , adaptiveIllustration
}) => {
    const hasAudio = audioUrl || manualAudioPreview;

    const isFemaleVoice = (voiceName) => {
        if (!voiceName) return false;
        return /serena|sara|female|woman|girl|valentina/i.test(voiceName);
    };

    const selectedVoiceMeta = voices.find((v) => v.id === selectedVoice);
    const selectedVoiceName = selectedVoiceMeta?.name || selectedVoice;

    const selectedVoiceIcon = isFemaleVoice(selectedVoiceName) ? '👩' : '👨';

    let computedProgress = generationProgress;
    if ((computedProgress === undefined || computedProgress === null) && typeof sceneTotal === 'number') {
        computedProgress = (sceneTotal > 0) ? Math.round((sceneDone / sceneTotal) * 100) : 0;
    }
    if (computedProgress === undefined || computedProgress === null) computedProgress = 0;

    return (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-indigo-200 shadow-inner">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎧</span>
                <h2 className="text-xl font-bold text-indigo-700">Audio Narrato della Storia</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Genera una versione audio della tua storia che i bambini possono ascoltare.<br />
                <span className="font-semibold text-indigo-600">Requisiti: Minimo 2 scene e 100 caratteri totali.</span>
            </p>

            {adaptiveIllustration && (
                <div className="mt-4 flex justify-center">
                    <img src={adaptiveIllustration} alt="Illustrazione Adaptive" className="max-h-40 w-auto rounded-lg shadow-sm" />
                </div>
            )}

            <div className="mb-6 p-4 bg-white rounded-xl border border-indigo-100">
                <label className="block text-sm font-bold text-gray-700 mb-3">🎤 Seleziona il narratore:</label>
                <div className="flex flex-wrap justify-center gap-4">
                    {voices.length > 0 ? voices.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVoice(v.id)}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 min-w-[200px] ${selectedVoice === v.id
                                ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200'
                                : 'border-gray-100 bg-white hover:border-indigo-300 shadow-sm'
                                }`}
                        >
                            <span className="text-4xl">{isFemaleVoice(v.name) ? '👩' : '👨'}</span>
                            <span className="font-extrabold text-gray-800 text-base text-center line-clamp-1">{v.name}</span>
                            {selectedVoice === v.id && (
                                <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">✓ Scelto</div>
                            )}
                        </button>
                    )) : (
                        <div className="col-span-full py-4 text-center text-gray-400 italic bg-gray-50 rounded-lg">
                            Caricamento voci disponibili...
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">⏳ Velocità della voce:</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {[0.8, 1.0, 1.2].map((speed) => (
                        <button
                            key={speed}
                            type="button"
                            onClick={() => setSelectedSpeed(speed)}
                            className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all text-sm ${selectedSpeed === speed ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {speed === 0.8 ? 'Lenta (0.8x)' : speed === 1.0 ? 'Normale' : 'Veloce (1.2x)'}
                        </button>
                    ))}
                </div>
            </div>

            {isGeneratingAudio ? (
                <div className="w-full bg-white/50 p-4 rounded-xl border border-indigo-200">
                    <ProgressBar progress={computedProgress} label="Generazione in corso..." color="bg-gradient-to-r from-blue-500 to-indigo-600" height="h-6" />
                    {typeof sceneTotal === 'number' && sceneTotal > 0 ? (
                        <p className="text-[12px] text-indigo-700 mt-2 text-center font-bold">🎧 Scena {sceneDone} di {sceneTotal} — {computedProgress}%</p>
                    ) : (
                        <p className="text-[12px] text-indigo-600 mt-2 text-center font-semibold">🎧 Audio in generazione in corso...</p>
                    )}
                    <p className="text-[10px] text-indigo-400 mt-2 text-center font-bold animate-pulse">QUASI PRONTO - L'IA STA ELABORANDO IL TESTO</p>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${isGeneratingAudio
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-105'
                        }`}
                >
                    <span className="text-2xl">🎤</span>
                    <span>{hasAudio ? 'Rigenera Audio Narrato' : 'Genera Audio Narrato'}</span>
                </button>
            )}

            <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
                L'audio viene generato scena per scena. Una volta completata la generazione, troverai un player per ogni scena direttamente nell'editor.
            </div>

            {manualAudioPreview && (
                <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-800 text-xs rounded-r-xl">
                    <strong>Nota Bene:</strong> Caricando un audio personale, le parole non verranno evidenziate durante la lettura (effetto karaoke), poiché la sincronizzazione è possibile solo con le voci generate dall'IA.
                </div>
            )}

            <div className="mt-6 flex justify-center">
                <label className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl font-bold cursor-pointer hover:bg-indigo-50 transition-all shadow-sm">
                    <span className="text-xl">📁</span>
                    <span>Carica una tua Registrazione (MP3)</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleManualAudioChange(e.target.files[0])} />
                </label>
            </div>

            <div className="mt-8 text-xs bg-white/70 p-5 rounded-xl border border-indigo-100 shadow-sm">
                <strong className="text-gray-700 text-sm flex items-center gap-2 mb-3"><span>📊</span> Statistiche Story Narrator:</strong>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-500 block mb-1">Scene totali:</span>
                        <span className={`text-lg font-black ${validParagraphsCount >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>{validParagraphsCount}</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-500 block mb-1">Caratteri:</span>
                        <span className={`text-lg font-black ${totalCharacters >= 100 ? 'text-indigo-600' : 'text-gray-400'}`}>{totalCharacters}</span>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <p className="font-bold text-indigo-800 mb-2 text-[10px] uppercase tracking-wider">Requisiti per Generazione IA:</p>
                    <ul className="space-y-1">
                        <li className={`flex items-center gap-2 ${validParagraphsCount >= 2 ? 'text-green-600' : 'text-red-500'}`}>
                            {validParagraphsCount >= 2 ? '✅' : '❌'} Minimo 2 scene con testo
                        </li>
                        <li className={`flex items-center gap-2 ${totalCharacters >= 100 ? 'text-green-600' : 'text-red-500'}`}>
                            {totalCharacters >= 100 ? '✅' : '❌'} Minimo 100 caratteri totali
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AudioSection;
