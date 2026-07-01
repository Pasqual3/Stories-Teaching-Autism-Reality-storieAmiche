import React, { memo } from 'react';

// Card singola: React.memo evita re-render se props non cambiano
const StoryCard = memo(({ story, onStoryClick, userData }) => {
  const isEmoGame = story.gameType === 'emoGame';

  // BUG1 FIX: usa il flag top-level isStrangeStoryActive salvato al momento della creazione della storia
  const hasTest = story.isStrangeStoryActive === true;

  const isOwnStory = userData && story.userId === userData._id;

  return (
    <div
      key={story._id}
      onClick={() => onStoryClick(story)}
      className={`${story.color} p-5 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer flex flex-col justify-between h-64 border-4 group relative text-left ${
        isOwnStory
          ? 'border-emerald-300/80 shadow-emerald-100/40'
          : isEmoGame
            ? 'border-purple-200/80 shadow-purple-100/40'
            : 'border-indigo-100 hover:border-indigo-200 shadow-indigo-100/30'
      }`}
    >
      {/* Header con Badge */}
      <div className="flex justify-between items-start w-full mb-2">
        {/* Own Creation Badge - LEFT */}
        {isOwnStory ? (
          <span className="text-[9px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border-2 border-emerald-600 flex items-center gap-1">
            ⭐ Mia Creazione
          </span>
        ) : (
          <div />
        )}
        
        {/* Tipo di Gioco Badge - RIGHT */}
        {isEmoGame ? (
          <div className="bg-purple-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-md border-2 border-purple-700 flex items-center gap-1 uppercase tracking-wider">
            ● EMOGAME
          </div>
        ) : (
          <div className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-md border-2 border-blue-700 flex items-center gap-1 uppercase tracking-wider">
            ● STORIA
          </div>
        )}
      </div>

      {/* Titolo Centrato */}
      <div className="flex-1 flex flex-col justify-center my-2">
        <h3 className="text-center text-lg font-black text-gray-800 leading-tight uppercase tracking-tight group-hover:text-purple-900 transition-colors break-words">
          {story.title}
        </h3>
      </div>

      {/* Footer con Metadati */}
      <div className="flex flex-col gap-2 w-full border-t border-black/10 pt-3 mt-auto">
        {/* Riga 1: Badge tipo e Data */}
        <div className="flex justify-between items-center w-full">
          <div>
            {isEmoGame ? (
              <span className="text-[8px] font-black bg-purple-100 text-purple-700 border-2 border-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                ⭐ {story.difficulty === 'DifI' ? 'Emoji' : story.difficulty === 'DifII' ? 'Immagini' : 'Video'}
              </span>
            ) : hasTest ? (
              <span className="text-[8px] font-black bg-orange-100 text-orange-700 border-2 border-orange-300 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                🧠 Con Test ToM
              </span>
            ) : (
              <span className="text-[8px] font-black bg-white text-gray-700 border-2 border-gray-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                📖 Social Story
              </span>
            )}
          </div>

          {story.createdAt && (
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-wider">
              {new Date(story.createdAt).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }).toUpperCase()}
            </span>
          )}
        </div>

        {/* Riga 2: Creatore */}
        {story.authorName && (
          <div className="text-[8px] font-black text-gray-700 flex items-center gap-1">
            <span className="text-gray-600">CREATORE:</span>
            <span className="text-gray-800">{story.authorName.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
});
StoryCard.displayName = 'StoryCard';

export const StoryGrid = ({ stories, isLoading, error, onRetry, onStoryClick, onResetFilters, userData }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 px-6 w-full max-w-7xl min-h-[400px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 animate-pulse p-8 rounded-3xl h-64 border-8 border-white flex flex-col justify-between"
          >
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="w-full space-y-3 mt-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 mb-6">
        <p className="text-red-500 text-center font-bold text-xl">⚠️ {error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-black text-sm uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-md"
        >
          🔄 Riprova
        </button>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="w-full max-w-7xl py-20 flex flex-col items-center animate-fadeIn">
        <span className="text-6xl mb-4">🔍</span>
        <p className="text-gray-400 font-bold text-2xl">Nessuna storia trovata con questi filtri.</p>
        <button
          onClick={onResetFilters}
          className="mt-6 text-indigo-600 font-black hover:underline underline-offset-4"
        >
          Resetta i filtri
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 px-6 w-full max-w-7xl min-h-[400px]">
      {stories.map((story) => (
        <StoryCard key={story._id} story={story} onStoryClick={onStoryClick} userData={userData} />
      ))}
    </div>
  );
};