import React from 'react';

// Aggiunto: difficulty e setDifficulty come prop (prima era un placeholder disconnesso)
const StoryMetadataForm = ({
    title, setTitle,
    description, setDescription,
    category, setCategory,
    isPublic, setIsPublic,
    difficulty, setDifficulty
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Titolo</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Es: Riconoscere le emozioni"
                    className="w-full text-xl font-semibold p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Descrizione (Opzionale)</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrizione dell'attività..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 h-24 resize-none"
                />
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Categoria</label>
                <div className="flex gap-2">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                    >
                        <option value="">Scegli una categoria</option>
                        <option value="Socialità">Socialità</option>
                        <option value="Emozioni">Emozioni</option>
                        <option value="Igiene">Igiene</option>
                        <option value="Salute">Salute</option>
                        <option value="Routine">Routine</option>
                        <option value="Scuola">Scuola</option>
                        <option value="Autonomia">Autonomia</option>
                        <option value="Sicurezza">Sicurezza</option>
                        <option value="Altro">Altro (scrivi sotto)</option>
                    </select>
                    {category === "Altro" && (
                        <input
                            type="text"
                            placeholder="Categoria personalizzata..."
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    )}
                </div>
            </div>

            {/* Difficoltà — ora collegato a stato reale */}
            <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Difficoltà</label>
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                >
                    <option value="DifI">Difficoltà 1 — Emoji</option>
                    <option value="DifII">Difficoltà 2 — Immagini</option>
                    <option value="DifIII">Difficoltà 3 — Video</option>
                </select>
            </div>

            <div className="flex items-center justify-start mt-2">
                <label className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${isPublic ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isPublic ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-gray-700 font-medium">{isPublic ? 'EmoGame Pubblico' : 'EmoGame Privato'}</div>
                </label>
            </div>
        </div>
    );
};

export default StoryMetadataForm;