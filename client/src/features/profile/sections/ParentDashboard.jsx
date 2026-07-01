import { useState } from 'react';
import ChildrenList from './ChildrenList';
import ParentStories from './ParentStories';
import TherapistSection from './TherapistSection';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = ({
  myChildren,
  stories,
  myTherapists,
  savingStoryIds,
  activeGenerations,
  onChildSwitch,
  onDeleteChild,
  onAddChild,
  onToggleVisibility,
  onDeleteStory,
  onAssignStory,
  onRemoveConnection,
  onSearchTherapists,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stories');

  const regularStories = stories.filter(s => !s.gameType || s.gameType === 'story');
  const emoGames = stories.filter(s => s.gameType === 'emoGame');

  return (
    <div className="flex flex-col gap-10">
      <ChildrenList
        myChildren={myChildren}
        onChildSwitch={onChildSwitch}
        onDeleteChild={onDeleteChild}
        onAddChild={onAddChild}
      />

      <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              ✨ Le Tue Attività
            </h2>
            <p className="text-sm text-gray-500 mt-1">Gestisci le tue storie sociali e le attività EmoGame create per i bambini.</p>
            
            {/* Pulsante Crea dinamico sotto la descrizione dell'attività */}
            <div className="flex mt-3">
              {activeTab === 'stories' ? (
                <button
                  onClick={() => navigate('/newStory')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>➕</span> Crea Storia
                </button>
              ) : (
                <button
                  onClick={() => navigate('/newEmoGame')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>➕</span> Crea EmoGame
                </button>
              )}
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-2xl self-start md:self-auto shadow-inner">
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
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'stories' ? (
            <ParentStories
              stories={regularStories}
              gameType="story"
              savingStoryIds={savingStoryIds}
              activeGenerations={activeGenerations}
              onToggleVisibility={onToggleVisibility}
              onDeleteStory={onDeleteStory}
              onAssign={onAssignStory}
            />
          ) : (
            <ParentStories
              stories={emoGames}
              gameType="emoGame"
              savingStoryIds={savingStoryIds}
              activeGenerations={activeGenerations}
              onToggleVisibility={onToggleVisibility}
              onDeleteStory={onDeleteStory}
              onAssign={onAssignStory}
              myChildren={myChildren}
            />
          )}
        </div>
      </section>

      <TherapistSection
        myTherapists={myTherapists}
        onRemoveConnection={onRemoveConnection}
        onSearchTherapists={onSearchTherapists}
      />
    </div>
  );
};

export default ParentDashboard;