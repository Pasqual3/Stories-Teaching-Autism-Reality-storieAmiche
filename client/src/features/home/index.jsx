import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appContext } from '../../context/appContext';
import { useStories } from './hooks/useStories';
import { SearchFilters } from './components/SearchFilters';
import { StoryGrid } from './components/StoryGrid';
import { Pagination } from './components/Pagination';

const Header = () => {
  const navigate = useNavigate();
  const { userData, backendUrl } = useContext(appContext);

  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return localStorage.getItem('hide_home_disclaimer') !== 'true';
  });

  const handleDismissDisclaimer = () => {
    localStorage.setItem('hide_home_disclaimer', 'true');
    setShowDisclaimer(false);
  };

  const {
    displayedStories,
    totalResults,
    categories,
    totalPages,
    isLoading,
    error,
    currentPage,
    searchTerm,
    selectedCategory,
    selectedType,
    selectedStoryKind,
    setSelectedStoryKind,
    selectedGame,
    setSelectedGame,
    selectedDifficulty,
    setSelectedDifficulty,
    sortBy,
    setSortBy,
    setCurrentPage,
    setSearchTerm,
    setSelectedCategory,
    setSelectedType,
    fetchStories,
  } = useStories(backendUrl, userData);

  const handleStoryClick = (story) => {
    const route = story.gameType === 'emoGame' ? `/emoGame/${story._id}` : `/story/${story._id}`;
    if (userData) {
      navigate(route);
    } else {
      navigate('/login', { state: { from: route } });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Tutte");
    setSelectedType("all");
    setSelectedStoryKind("Tutte");
    setSelectedGame("Tutti");
    setSelectedDifficulty("all");
    setSortBy("newest");
  };

  return (
    <div className="w-full">
      <section className="text-center flex flex-col items-center w-full py-16 pb-10 px-4">
        {/* HERO HEADER */}
        <div className="mb-10 max-w-3xl flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight uppercase bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-none">
            Storie Amiche Platform
          </h1>
          <p className="text-gray-600 mt-2 font-semibold text-lg max-w-2xl leading-relaxed">
            Scopri, leggi e gioca con strumenti terapeutici innovativi creati per stimolare l'autonomia,
            le relazioni e il riconoscimento delle emozioni nei bambini con autismo.
          </p>
        </div>

        {/* DISCLAIMER PUBBLICO */}
        {showDisclaimer && (
          <div className="w-full max-w-4xl mb-8 bg-gradient-to-r from-amber-50/95 to-orange-50/95 backdrop-blur-md border border-amber-200 rounded-3xl p-5 shadow-md flex items-start gap-4 text-left relative animate-fadeIn transition-all">
            <span className="text-3xl select-none">📢</span>
            <div className="flex-1 pr-6">
              <h4 className="text-sm font-black text-amber-800 uppercase tracking-wider mb-1">
                Libreria Pubblica - Nota Informativa
              </h4>
              <p className="text-xs text-amber-700/90 font-medium leading-relaxed">
                Questa sezione raccoglie le Storie Sociali e gli EmoGame condivisi pubblicamente dai professionisti clinici e dai genitori della community. 
                Si consiglia la supervisione di un adulto e una valutazione clinica preventiva per selezionare i contenuti più idonei e allineati con gli obiettivi terapeutici individuali di ciascun bambino.
              </p>
            </div>
            <button
              onClick={handleDismissDisclaimer}
              className="absolute top-4 right-4 text-amber-500 hover:text-amber-700 hover:scale-110 active:scale-95 transition-all p-1 rounded-full hover:bg-amber-100/60 cursor-pointer"
              title="Nascondi avviso"
              aria-label="Chiudi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* RICERCA E FILTRI */}
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedStoryKind={selectedStoryKind}
          setSelectedStoryKind={setSelectedStoryKind}
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          sortBy={sortBy}
          setSortBy={setSortBy}
          activeFiltersCount={
            (selectedCategory !== 'Tutte' ? 1 : 0) +
            (selectedType !== 'all' ? 1 : 0) +
            (selectedStoryKind !== 'Tutte' ? 1 : 0) +
            (selectedGame !== 'Tutti' ? 1 : 0) +
            (selectedDifficulty !== 'all' ? 1 : 0)
          }
          filteredTotal={totalResults}
          onReset={handleResetFilters}
        />

        {/* GRIGLIA */}
        <StoryGrid
          stories={displayedStories}
          isLoading={isLoading}
          error={error}
          onRetry={() => fetchStories(true)}
          onStoryClick={handleStoryClick}
          onResetFilters={handleResetFilters}
          userData={userData}
        />

        {/* PAGINAZIONE */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
};

export default Header;