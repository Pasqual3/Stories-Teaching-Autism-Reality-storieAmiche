import { useState } from 'react';
import { FaEye, FaPen, FaChild, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import EmoGameRecapModal from '../components/EmoGameRecapModal';

const ParentStories = ({
  stories,
  gameType = 'story',
  savingStoryIds,
  activeGenerations,
  onToggleVisibility,
  onDeleteStory,
  onAssign,
  myChildren = [],
}) => {
  const navigate = useNavigate();
  const isEmoGame = gameType === 'emoGame';
  const [recapEmoGame, setRecapEmoGame] = useState(null);

  if (stories.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm text-center text-gray-500">
        {isEmoGame ? 'Non hai ancora creato EmoGame.' : 'Non hai ancora creato storie.'}
        <button
          onClick={() => navigate(isEmoGame ? '/newEmoGame' : '/newStory')}
          className={`mt-4 text-white px-6 py-2 rounded-full transition-all font-bold block mx-auto w-fit ${isEmoGame ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isEmoGame ? 'Crea un EmoGame' : 'Crea una storia'}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        {stories.map(story => {
          const isDraft = story.status === 'DRAFT';
          const isPending = story.status === 'PENDING';
          const isApproved = story.status === 'APPROVED';
          const isRejected = story.status === 'REJECTED';

          const editRoute = isEmoGame
            ? `/edit-emoGame/${story._id}`
            : `/edit-story/${story._id}`;

          return (
            <div
              key={story._id}
              className={`bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative border-2 ${isDraft ? 'border-orange-300' :
                isPending ? 'border-yellow-200' :
                  isApproved ? 'border-green-200' :
                    'border-red-200'
                }`}
            >
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                {isEmoGame && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[11px] font-black px-2 py-1 rounded-full border border-purple-200">
                    🎮 EmoGame
                  </span>
                )}
                {isDraft && <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-1 rounded-full border border-orange-300">✏️ BOZZA</span>}
                {isPending && <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[11px] font-black px-2 py-1 rounded-full border border-yellow-300">⏳ In Attesa</span>}
                {isApproved && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[11px] font-black px-2 py-1 rounded-full border border-green-300"><FaCheck size={9} /> Approvata</span>}
                {isRejected && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[11px] font-black px-2 py-1 rounded-full border border-red-300"><FaTimes size={9} /> Rifiutata</span>}
              </div>

              <h3 className="font-bold text-lg mb-1 truncate pr-24">{story.title}</h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{story.description}</p>

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => onToggleVisibility(story)}
                  title={isDraft ? 'Non puoi pubblicare una bozza' : ''}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${isDraft ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                    : story.isPublic ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {isDraft ? '🚫 Non pubbl.' : story.isPublic ? '🌍 Pubblica' : '🔒 Privata'}
                </button>
              </div>

              {isRejected && story.rejectionReason && (
                <div className="bg-red-50 p-2 rounded text-xs text-red-700 mb-3 border border-red-100">
                  <strong>Motivo rifiuto:</strong> {story.rejectionReason}
                </div>
              )}

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(editRoute)}
                    disabled={activeGenerations.includes(story._id) || savingStoryIds.includes(story._id)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${activeGenerations.includes(story._id) || savingStoryIds.includes(story._id)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDraft
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : isEmoGame
                          ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                  >
                    {isDraft ? <><FaPen size={12} /> Riprendi</> : 'Modifica'}
                  </button>
                  <button
                    onClick={() => navigate(isEmoGame ? `/emoGame/${story._id}` : `/story/${story._id}`)}
                    className="bg-white border border-gray-200 text-gray-600 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <FaEye />
                  </button>
                </div>

                {!isDraft && (
                  <button
                    onClick={() => onAssign(story)}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${isEmoGame
                      ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                  >
                    <FaChild /> Assegna ai Figli
                  </button>
                )}

                {/* Pulsante Recap Punteggi — solo per EmoGame non bozza */}
                {isEmoGame && !isDraft && (
                  <button
                    onClick={() => setRecapEmoGame(story)}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    📊 Punteggi
                  </button>
                )}

                <button
                  onClick={() => onDeleteStory(story._id, story.title, gameType)}
                  className="w-full bg-red-50 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                >
                  <FaTrash /> {isEmoGame ? 'Elimina EmoGame' : 'Elimina Storia'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modale Recap Punteggi */}
      {recapEmoGame && (
        <EmoGameRecapModal
          emoGame={recapEmoGame}
          children={myChildren}
          onClose={() => setRecapEmoGame(null)}
        />
      )}
    </>
  );
};

export default ParentStories;