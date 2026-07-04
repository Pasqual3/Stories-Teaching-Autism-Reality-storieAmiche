import React, { useState } from 'react';

const CATEGORY_ICONS = {
  "Tutte": "🌈", "Socialità": "🧩", "Emozioni": "😊",
  "Igiene": "🧼", "Salute": "🩺", "Routine": "📅",
  "Scuola": "🏫", "Autonomia": "🚲", "Sicurezza": "⚠️",
  "Altro": "✨", "Social Story": "📖",
};
const getCatIcon = (cat) => CATEGORY_ICONS[cat] || "✨";

const SegmentBtn = ({ id, label, current, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(id)}
    className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
      current === id
        ? 'bg-purple-600 text-white shadow-sm'
        : 'text-purple-700 hover:bg-purple-100/50'
    }`}
  >
    {label}
  </button>
);

const CatPill = ({ cat, current, onChange }) => {
  const isActive = current === cat;
  return (
    <button
      type="button"
      onClick={() => onChange(cat)}
      className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all border-2 flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
        isActive
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
          : 'bg-white text-indigo-700 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/30 shadow-sm'
      }`}
    >
      {getCatIcon(cat)} {cat}
    </button>
  );
};

export const SearchFilters = ({
  searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory,
  selectedType, setSelectedType,
  selectedStoryKind, setSelectedStoryKind,
  selectedGame, setSelectedGame,
  selectedDifficulty, setSelectedDifficulty,
  sortBy, setSortBy,
  categories,
  activeFiltersCount,
  filteredTotal,
  onReset,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Deriva il "tipo attività" attivo per evidenziare il tab giusto
  // Se è una storia + storyKind === 'Strange Story', mostriamo il tab "Strange Story" attivo
  const currentActivityType =
    selectedType === 'story' && selectedStoryKind === 'Strange Story'
      ? 'strangeStory'
      : selectedType;

  const handleTypeChange = (val) => {
    if (val === 'all') {
      setSelectedType('all');
      if (setSelectedStoryKind) setSelectedStoryKind('Tutte');
      if (setSelectedGame) setSelectedGame('Tutti');
      setSelectedDifficulty('all');
    } else if (val === 'story') {
      setSelectedType('story');
      setSelectedDifficulty('all');
      if (setSelectedStoryKind) setSelectedStoryKind('Tutte');
      if (setSelectedGame) setSelectedGame('Tutti');
    } else if (val === 'emoGame') {
      setSelectedType('emoGame');
      setSelectedDifficulty('all');
      if (setSelectedStoryKind) setSelectedStoryKind('Tutte');
      if (setSelectedGame) setSelectedGame('Tutti');
    } else if (val === 'adaptiveStory') {
      setSelectedType('adaptiveStory');
      setSelectedDifficulty('all');
      if (setSelectedStoryKind) setSelectedStoryKind('Tutte');
      if (setSelectedGame) setSelectedGame('Tutti');
    } else if (val === 'strangeStory') {
      setSelectedType('story');
      setSelectedDifficulty('all');
      if (setSelectedStoryKind) setSelectedStoryKind('Strange Story');
      if (setSelectedGame) setSelectedGame('Tutti');
    }
  };

  const showDifficultyFilter = selectedType !== 'story';
  const showStoryKindFilter  = selectedType !== 'emoGame' && selectedType !== 'adaptiveStory' && !(selectedType === 'story' && selectedStoryKind === 'Strange Story');
  const showGameFilter       = selectedType !== 'emoGame' && selectedType !== 'adaptiveStory';

  return (
    <div className="w-full max-w-4xl mb-10">
      <div className="w-full bg-white/80 backdrop-blur-md rounded-3xl px-6 pt-6 pb-5 shadow-xl border border-purple-100 flex flex-col gap-5 text-left">

        {/* ── Riga ricerca + pulsante filtri ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-purple-400 group-focus-within:text-purple-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cerca per titolo o descrizione..."
              className="w-full pl-12 pr-10 py-3.5 bg-white/95 border-2 border-purple-100 focus:border-purple-400 rounded-2xl shadow-inner text-base font-bold outline-none transition-all placeholder:text-gray-300 focus:ring-2 focus:ring-purple-100 text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg font-black transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Pulsante espandi */}
          <button
            onClick={() => setExpanded(prev => !prev)}
            aria-expanded={expanded}
            className={`relative flex items-center gap-2 px-4 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all border-2 whitespace-nowrap ${
              expanded
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-purple-700 border-purple-100 hover:border-purple-300'
            }`}
          >
            {expanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h18M6 9h12M9 14h6" />
              </svg>
            )}
            Filtri
            {activeFiltersCount > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                expanded ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'
              }`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Pannello espandibile (grid approach) ── */}
        <div
          className={`grid transition-[grid-template-rows] duration-[450ms] ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden min-h-0">
            <div className={`flex flex-col gap-5 pt-2 border-t border-purple-50 transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0'}`}>

              {/* Contatore + reset */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
                  {filteredTotal} {filteredTotal === 1 ? 'risultato' : 'risultati'}
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={onReset}
                    className="text-xs text-red-400 font-black hover:text-red-600 transition-colors"
                  >
                    ✕ Resetta tutto
                  </button>
                )}
              </div>

              {/* Griglia 3 colonne */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Tipo attività — 4 tab */}
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest ml-1">🎮 Tipo Attività</label>
                  <div className="flex bg-purple-50/50 p-1 rounded-xl border border-purple-100 w-full">
                    <SegmentBtn id="all"           label="Tutte"          current={currentActivityType} onChange={handleTypeChange} />
                    <SegmentBtn id="story"         label="Storie"         current={currentActivityType} onChange={handleTypeChange} />
                    <SegmentBtn id="emoGame"       label="Giochi"         current={currentActivityType} onChange={handleTypeChange} />
                    <SegmentBtn id="adaptiveStory" label="Adaptive Story" current={currentActivityType} onChange={handleTypeChange} />
                    <SegmentBtn id="strangeStory"  label="Strange Story"  current={currentActivityType} onChange={handleTypeChange} />
                  </div>
                </div>

                {/* Difficoltà EmoGame */}
                <div className={`flex flex-col gap-2 transition-opacity duration-300 ${!showDifficultyFilter ? 'opacity-30 pointer-events-none' : ''}`}>
                  <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest ml-1">⭐ Difficoltà EmoGame</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    disabled={!showDifficultyFilter}
                    className="w-full p-2.5 text-xs font-bold border-2 border-purple-100 focus:border-purple-400 rounded-xl outline-none bg-white text-purple-900 cursor-pointer shadow-sm"
                  >
                    <option value="all">Tutti i livelli</option>
                    <option value="DifI">Livello 1 — Emoji</option>
                    <option value="DifII">Livello 2 — Immagini</option>
                    <option value="DifIII">Livello 3 — Video</option>
                  </select>
                </div>

                {/* Ordinamento */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest ml-1">📅 Ordina per</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold border-2 border-purple-100 focus:border-purple-400 rounded-xl outline-none bg-white text-purple-900 cursor-pointer shadow-sm"
                  >
                    <option value="newest">🕐 Più recenti</option>
                    <option value="oldest">📅 Meno recenti</option>
                    <option value="alpha_asc">🔤 Alfabetico (A-Z)</option>
                    <option value="alpha_desc">🔤 Alfabetico (Z-A)</option>
                    <option value="mine_first">⭐ Prima le mie creazioni</option>
                    <option value="tom_first">🧠 Prima i Test ToM</option>
                    <option value="difficulty_asc">📈 Difficoltà crescente</option>
                    <option value="difficulty_desc">📉 Difficoltà decrescente</option>
                  </select>
                </div>
              </div>

              {/* Tipo storia — nascosto se è già selezionato Strange Story dal tab principale */}
              {showStoryKindFilter && setSelectedStoryKind && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest ml-1">🧠 Tipo di Storia</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 'Tutte', label: '📚 Tutte' },
                      { val: 'Social Story', label: '📖 Social Story' },
                      { val: 'Strange Story', label: '🧠 Strange Story (Teoria della Mente)' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedStoryKind(val)}
                        className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all border-2 flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                          selectedStoryKind === val
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                            : 'bg-white text-orange-700 border-orange-100 hover:border-orange-300 hover:bg-orange-50/30 shadow-sm'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gioco incluso */}
              {showGameFilter && setSelectedGame && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest ml-1">🎯 Gioco incluso</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 'Tutti', label: '🎮 Tutti' },
                      { val: 'Sequencing', label: '🔢 Sequencing' },
                      { val: 'Emotion', label: '😊 Emozioni' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedGame(val)}
                        className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all border-2 flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                          selectedGame === val
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                            : 'bg-white text-emerald-700 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-sm'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorie */}
              <div className="flex flex-col gap-3 border-t border-purple-50 pt-4">
                <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest ml-1">🧩 Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <CatPill key={cat} cat={cat} current={selectedCategory} onChange={setSelectedCategory} />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};