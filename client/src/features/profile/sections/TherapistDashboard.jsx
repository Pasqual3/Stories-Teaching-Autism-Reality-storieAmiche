import { useState, useContext } from 'react';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaCheck, FaTimes, FaChild, FaLock, FaUnlock, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appContext } from '../../../context/appContext';

// ── Funzione di cifratura deterministica (hash a 4 cifre dal parentId + indice) ──
const getPatientCode = (parentId, childIndex) => {
  let hash = 0;
  const str = String(parentId) + String(childIndex);
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  }
  return String(hash).padStart(4, '0');
};

// ── Componente modal per inserire la password e sbloccare i dati ──
const UnlockModal = ({ onClose, onSuccess }) => {
  const { backendUrl } = useContext(appContext);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/user/verify-password`,
        { password },
        { withCredentials: true }
      );
      if (res.data.success) {
        onSuccess();
      } else {
        setError(res.data.message || 'Password non corretta.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password non corretta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-100">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-5 text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-white font-black text-lg">Sblocca Dati Pazienti</h2>
          <p className="text-indigo-200 text-xs mt-1">Inserisci la tua password per visualizzare i dati in chiaro.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              placeholder="La tua password di accesso..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl px-4 py-2.5">
              <FaTimes size={12} /> {error}
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-sm font-black shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer border-none"
            >
              {loading ? '...' : '🔓 Sblocca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TherapistDashboard = ({
  pendingInvitations = [], // <-- Aggiunto default per prevenire errori undefined
  pendingStories = [],     // <-- Aggiunto default
  stories = [],            // <-- Aggiunto default
  assignedFamilies = [],   // <-- Aggiunto default
  currentPlayingAudio,
  selectedStoryIdForReject,
  rejectReason,
  savingStoryIds = [],     // <-- Aggiunto default
  activeGenerations = [],  // <-- Aggiunto default
  onSetCurrentPlayingAudio,
  onSetSelectedStoryIdForReject,
  onSetRejectReason,
  onApprove,
  onReject,
  onRespondInvitation,
  onRemoveConnection,
  onDeleteStory,
  onToggleVisibility,
  onAssignStory,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stories');

  // ── Privacy: dati sbloccati ──
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const pendingRegularStories = pendingStories.filter(s => !s.gameType || s.gameType === 'story');
  const pendingEmoGames = pendingStories.filter(s => s.gameType === 'emoGame');

  const regularStories = stories.filter(s => (!s.gameType || s.gameType === 'story') && s.status !== 'DRAFT');
  const emoGames = stories.filter(s => s.gameType === 'emoGame' && s.status !== 'DRAFT' && !s.isAdaptive);
  const adaptiveStories = stories.filter(s => s.gameType === 'emoGame' && s.status !== 'DRAFT' && s.isAdaptive);

  const getEditRoute = (item) => item.gameType === 'emoGame' ? `/edit-emoGame/${item._id}` : `/edit-story/${item._id}`;

  // ── Helper per mostrare il nome cifrato o in chiaro ──
  const displayName = (realName, parentId, childIndex) =>
    isUnlocked ? realName : `Paziente #${getPatientCode(parentId, childIndex)}`;

  const displayParentName = (realName, parentId) =>
    isUnlocked ? realName : `Famiglia #${getPatientCode(parentId, 0)}`;

  const displayEmail = (email) =>
    isUnlocked ? email : '••••••@••••••.••';

  return (
    <div className="grid lg:grid-cols-3 gap-8">

      {/* MODAL SBLOCCO */}
      {showUnlockModal && (
        <UnlockModal
          onClose={() => setShowUnlockModal(false)}
          onSuccess={() => { setIsUnlocked(true); setShowUnlockModal(false); }}
        />
      )}

      {/* COLONNA SINISTRA */}
      <div className="lg:col-span-2 space-y-8">
        {/* Inviti */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            📩 Inviti in Attesa <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{pendingInvitations.length}</span>
          </h2>
          {pendingInvitations.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center text-gray-500 shadow-sm">Nessun nuovo invito da famiglie.</div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map(inv => (
                <div key={inv.parentId} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{inv.parentName}</h3>
                    <p className="text-sm text-gray-500">{inv.parentEmail}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Ricevuto il: {new Date(inv.invitedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onRespondInvitation(inv.parentId, 'reject')} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50">Rifiuta</button>
                    <button onClick={() => onRespondInvitation(inv.parentId, 'accept')} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md">Accetta</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attività da approvare */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            ⏳ Attività da Approvare{' '}
            <span className="text-sm bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
              {pendingRegularStories.length}
            </span>
          </h2>
          {pendingRegularStories.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center text-gray-500 shadow-sm">
              Nessuna attività in attesa di approvazione.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRegularStories.map(story => {
                const sceneAudios = (story.paragraphs || [])
                  .map((p, i) => p.narrationUrl ? { url: p.narrationUrl, label: `Scena ${i + 1}` } : null)
                  .filter(Boolean);
                const hasAudio = sceneAudios.length > 0 || story.narrationUrl;
                const isAudioOpen = currentPlayingAudio === story._id;

                return (
                  <div key={story._id} className="bg-white p-5 rounded-2xl shadow-sm border border-yellow-100 flex flex-col md:flex-row gap-4 relative">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{story.title}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">da {story.authorName || 'Genitore'}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                      <button onClick={() => navigate(`/story/${story._id}`)} className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1"><FaEye /> Leggi Storia</button>
                    </div>
                    <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                      <button onClick={() => onApprove(story._id)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-200 flex items-center justify-center gap-2"><FaCheck /> Approva</button>
                      <button onClick={() => onSetSelectedStoryIdForReject(story._id === selectedStoryIdForReject ? null : story._id)} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center justify-center gap-2"><FaTimes /> Rifiuta</button>
                      {hasAudio && (
                        <button onClick={() => onSetCurrentPlayingAudio(isAudioOpen ? null : story._id)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 flex items-center justify-center gap-2">
                          <span>🎧</span> {isAudioOpen ? 'Stop Audio' : 'Ascolta Audio'}
                        </button>
                      )}
                    </div>
                    {isAudioOpen && (
                      <div className="w-full mt-2 bg-blue-50 p-3 rounded-xl animate-fadeIn space-y-2">
                        <p className="text-xs font-bold text-blue-500 uppercase mb-2">🎧 Audio per scena ({sceneAudios.length})</p>
                        {sceneAudios.length === 0 && story.narrationUrl ? (
                          <audio controls src={story.narrationUrl} autoPlay className="w-full" />
                        ) : (
                          sceneAudios.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-blue-100">
                              <span className="text-xs font-black text-blue-400 uppercase tracking-wider min-w-[60px]">{item.label}</span>
                              <audio controls src={item.url} className="flex-1 h-8" style={{ minWidth: 0 }} />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {selectedStoryIdForReject === story._id && (
                      <div className="w-full bg-white border border-red-200 p-3 rounded-xl shadow-lg z-10 mt-2">
                        <textarea className="w-full border rounded p-2 text-sm mb-2" placeholder="Motivo del rifiuto..." value={rejectReason} onChange={(e) => onSetRejectReason(e.target.value)} />
                        <button onClick={() => onReject(story._id)} className="w-full bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600">Conferma Rifiuto</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EmoGame da approvare */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            🎮 EmoGame da Approvare{' '}
            <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {pendingEmoGames.length}
            </span>
          </h2>
          {pendingEmoGames.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center text-gray-500 shadow-sm">
              Nessun EmoGame in attesa di approvazione.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEmoGames.map(story => {
                const isAudioOpen = currentPlayingAudio === story._id;

                return (
                  <div key={story._id} className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex flex-col md:flex-row gap-4 relative">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{story.title}</h3>
                        <span className="text-xs bg-purple-100 px-2 py-1 rounded-full text-purple-700">EmoGame</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">da {story.authorName || 'Genitore'}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                      <button onClick={() => navigate(`/emoGame/${story._id}`)} className="text-purple-600 text-sm font-semibold hover:underline flex items-center gap-1"><FaEye /> Visualizza EmoGame</button>
                    </div>
                    <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                      <button onClick={() => onApprove(story._id)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-200 flex items-center justify-center gap-2"><FaCheck /> Approva</button>
                      <button onClick={() => onSetSelectedStoryIdForReject(story._id === selectedStoryIdForReject ? null : story._id)} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center justify-center gap-2"><FaTimes /> Rifiuta</button>
                    </div>
                    {selectedStoryIdForReject === story._id && (
                      <div className="w-full bg-white border border-red-200 p-3 rounded-xl shadow-lg z-10 mt-2">
                        <textarea className="w-full border rounded p-2 text-sm mb-2" placeholder="Motivo del rifiuto..." value={rejectReason} onChange={(e) => onSetRejectReason(e.target.value)} />
                        <button onClick={() => onReject(story._id)} className="w-full bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600">Conferma Rifiuto</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Le tue attività */}
        <div className="mt-10 pt-10 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                ✨ Le Tue Attività
              </h2>
              <p className="text-sm text-gray-500 mt-1">Gestisci le tue storie sociali e le attività EmoGame create per i pazienti.</p>
            </div>
            
            {/* Tab Switcher & Creation Buttons */}
            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner">
                <button
                  onClick={() => setActiveTab('stories')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === 'stories'
                      ? 'bg-indigo-600 text-white shadow-md scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
                  }`}
                >
                  <span>📖</span> Le Tue Storie
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    activeTab === 'stories' ? 'bg-indigo-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {regularStories.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('emogames')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === 'emogames'
                      ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
                  }`}
                >
                  <span>🎮</span> I Tuoi EmoGame
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    activeTab === 'emogames' ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {emoGames.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('adaptive')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === 'adaptive'
                      ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'
                  }`}
                >
                  <span>📖</span> Adaptive Story
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    activeTab === 'adaptive' ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {adaptiveStories.length}
                  </span>
                </button>
              </div>

              {activeTab === 'stories' ? (
                <button
                  onClick={() => navigate('/newStory')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none"
                >
                  Nuova Storia ➕
                </button>
              ) : activeTab === 'adaptive' ? (
                <button
                  onClick={() => navigate('/adaptiveNarration')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none"
                >
                  Nuova Adaptive Story ➕
                </button>
              ) : (
                <button
                  onClick={() => navigate('/newEmoGame')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none"
                >
                  Nuovo EmoGame ➕
                </button>
              )}
            </div>
          </div>

          {/* List display */}
          {activeTab === 'stories' ? (
            regularStories.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm text-center text-gray-500">
                Non hai ancora creato storie definitive.
                <button onClick={() => navigate('/newStory')} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-all font-bold block mx-auto w-fit">Crea una storia</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {regularStories.map(story => (
                  <div key={story._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow relative">
                    <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-green-100">
                      <span className="text-green-600 flex items-center gap-1"><FaCheck size={10} /> Approvata</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 truncate pr-24">{story.title}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{story.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => onToggleVisibility(story)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${story.isPublic ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {story.isPublic ? '🌍 Pubblica' : '🔒 Privata'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(getEditRoute(story))} disabled={activeGenerations.includes(story._id) || savingStoryIds.includes(story._id)} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${activeGenerations.includes(story._id) || savingStoryIds.includes(story._id) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                        <FaEdit size={12} /> Modifica
                      </button>
                      {onAssignStory && (
                        <button onClick={() => onAssignStory(story)} className="bg-purple-50 text-purple-700 px-3 rounded-lg hover:bg-purple-100" title="Assegna ai pazienti"><FaChild /></button>
                      )}
                      <button onClick={() => navigate(`/story/${story._id}`)} className="bg-white border border-gray-200 text-gray-600 px-3 rounded-lg hover:bg-gray-50"><FaEye /></button>
                      <button onClick={() => onDeleteStory(story._id, story.title, 'story')} className="bg-red-50 text-red-600 px-3 rounded-lg hover:bg-red-100"><FaTrash size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'emogames' ? (
            emoGames.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm text-center text-gray-500">
                Non hai ancora creato EmoGame definitivi.
                <button onClick={() => navigate('/newEmoGame')} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-all font-bold block mx-auto w-fit">Crea un EmoGame</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {emoGames.map(story => (
                  <div key={story._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow relative">
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                        🎮 EmoGame
                      </span>
                      <div className="text-xs font-bold px-2 py-1 rounded bg-green-100">
                        <span className="text-green-600 flex items-center gap-1"><FaCheck size={10} /> Approvata</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 truncate pr-24">{story.title}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{story.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => onToggleVisibility(story)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${story.isPublic ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {story.isPublic ? '🌍 Pubblica' : '🔒 Privata'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(getEditRoute(story))} disabled={activeGenerations.includes(story._id) || savingStoryIds.includes(story._id)} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${activeGenerations.includes(story._id) || savingStoryIds.includes(story._id) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
                        <FaEdit size={12} /> Modifica
                      </button>
                      {onAssignStory && (
                        <button onClick={() => onAssignStory(story)} className="bg-orange-50 text-orange-700 px-3 rounded-lg hover:bg-orange-100" title="Assegna ai pazienti"><FaChild /></button>
                      )}
                      <button onClick={() => navigate(`/emoGame/${story._id}`)} className="bg-white border border-gray-200 text-gray-600 px-3 rounded-lg hover:bg-gray-50"><FaEye /></button>
                      <button onClick={() => onDeleteStory(story._id, story.title, 'emoGame')} className="bg-red-50 text-red-600 px-3 rounded-lg hover:bg-red-100"><FaTrash size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            adaptiveStories.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm text-center text-gray-500">
                Non hai ancora creato Adaptive Story.
                <button onClick={() => navigate('/adaptiveNarration')} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-all font-bold block mx-auto w-fit">Crea un Adaptive Story</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {adaptiveStories.map(story => (
                  <div key={story._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow relative">
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                        📖 Adaptive Story
                      </span>
                      <div className="text-xs font-bold px-2 py-1 rounded bg-green-100">
                        <span className="text-green-600 flex items-center gap-1"><FaCheck size={10} /> Approvata</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 truncate pr-24">{story.title}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{story.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => onToggleVisibility(story)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${story.isPublic ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {story.isPublic ? '🌍 Pubblica' : '🔒 Privata'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(getEditRoute(story))} disabled={activeGenerations.includes(story._id) || savingStoryIds.includes(story._id)} className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${activeGenerations.includes(story._id) || savingStoryIds.includes(story._id) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
                        <FaEdit size={12} /> Modifica
                      </button>
                      {onAssignStory && (
                        <button onClick={() => onAssignStory(story)} className="bg-orange-50 text-orange-700 px-3 rounded-lg hover:bg-orange-100" title="Assegna ai pazienti"><FaChild /></button>
                      )}
                      <button onClick={() => navigate(`/emoGame/${story._id}`)} className="bg-white border border-gray-200 text-gray-600 px-3 rounded-lg hover:bg-gray-50"><FaEye /></button>
                      <button onClick={() => onDeleteStory(story._id, story.title, 'emoGame')} className="bg-red-50 text-red-600 px-3 rounded-lg hover:bg-red-100"><FaTrash size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Bozze */}
          {stories.some(s => s.status === 'DRAFT') && (
            <div className="mt-8 p-6 bg-orange-50/50 rounded-3xl border-2 border-dashed border-orange-200">
              <h2 className="text-xl font-bold text-orange-700 flex items-center gap-2 mb-4">📝 Bozze In Sospeso</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {stories.filter(s => s.status === 'DRAFT').map(draft => (
                  <div key={draft._id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded border border-orange-200">BOZZA</div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{draft.title || 'Bozza senza titolo'}</h3>
                        <p className="text-[10px] text-gray-400 italic">Creata il {new Date(draft.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(getEditRoute(draft))} disabled={activeGenerations.includes(draft._id) || savingStoryIds.includes(draft._id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeGenerations.includes(draft._id) || savingStoryIds.includes(draft._id) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>Continua Modifica</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div> 
      </div> {/* <--- QUESTO E' IL DIV CHE MANCAVA! Chiude "lg:col-span-2 space-y-8" */}

      {/* COLONNA DESTRA: Famiglie */}
      <div>
        {/* Header con toggle privacy */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Le Tue Famiglie</h2>
          <button
            onClick={() => isUnlocked ? setIsUnlocked(false) : setShowUnlockModal(true)}
            title={isUnlocked ? 'Nascondi dati reali' : 'Sblocca dati reali con password'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isUnlocked
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {isUnlocked ? <><FaUnlock size={11} /> Dati visibili</> : <><FaLock size={11} /> Dati cifrati</>}
          </button>
        </div>

        {/* Banner Privacy */}
        {!isUnlocked && assignedFamilies.length > 0 && (
          <div className="mb-4 flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
            <FaShieldAlt className="text-indigo-400 mt-0.5 shrink-0" size={14} />
            <p className="text-xs text-indigo-600 font-bold leading-snug">
              I dati dei pazienti sono cifrati per proteggerne la privacy. Clicca su <em>Dati cifrati</em> per sbloccarne la visualizzazione.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {assignedFamilies.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm text-center text-gray-400">Nessuna famiglia assegnata.</div>
          ) : (
            assignedFamilies.map((family) => (
              <div key={family.parentId} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 flex justify-between items-center border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {displayParentName(family.parentName, family.parentId)}
                    </h3>
                    <p className="text-xs text-gray-500">{displayEmail(family.parentEmail)}</p>
                  </div>
                  <button onClick={() => onRemoveConnection(family.parentId, family.parentName)} className="text-red-400 hover:text-red-600 bg-white p-2 rounded-full shadow-sm" title="Rimuovi Famiglia"><FaTrash size={12} /></button>
                </div>
                <div className="p-4 bg-white grid gap-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bambini</p>
                  {family.children.length === 0 && <p className="text-xs text-gray-400 italic">Nessun bambino profilato.</p>}
                  {family.children.map((child, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-indigo-50/50 rounded-xl border border-indigo-50">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg overflow-hidden border border-indigo-100 shadow-sm">
                        {isUnlocked && child.avatar && child.avatar.startsWith('http')
                          ? <img src={child.avatar} alt="" className="w-full h-full object-cover" />
                          : <FaChild className="text-indigo-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800">
                          {displayName(child.name, family.parentId, i)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          PIN: {isUnlocked ? (child.pin || '—') : '••••'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;