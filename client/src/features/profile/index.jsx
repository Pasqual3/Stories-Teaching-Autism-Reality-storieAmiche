import { Helmet } from 'react-helmet-async';
import { FaTimes } from 'react-icons/fa';
import Navbar from '../../shared/components/Navbar';
import { useProfileData } from './hooks/useProfileData';

import ProfileHeader from './sections/ProfileHeader';
import AccountSettings from './sections/AccountSettings';
import TherapistDashboard from './sections/TherapistDashboard';
import ParentDashboard from './sections/ParentDashboard';

import EditProfileModal from './components/EditProfileModal';
import DeleteProfileModal from './components/DeleteProfileModal';
import AddChildModal from '../../components/AddChildModal';
import AssignChildrenForm from '../../components/AssignChildrenForm';

const Profile = () => {
  const {
    userData,
    isLoading,
    isTherapist,
    stories,
    myChildren,
    myTherapists,
    therapistsList,
    pendingStories,
    pendingInvitations,
    assignedFamilies,
    rejectReason,
    selectedStoryIdForReject,
    currentPlayingAudio,
    selectedStoryForAssign,
    savingStoryIds,
    activeGenerations,
    isEditModalOpen,
    isDeleteModalOpen,
    isAddChildModalOpen,
    searchTherapistModalOpen,
    assignChildrenModalOpen,
    setIsEditModalOpen,
    setIsDeleteModalOpen,
    setIsAddChildModalOpen,
    setSearchTherapistModalOpen,
    setAssignChildrenModalOpen,
    setSelectedStoryForAssign,
    setCurrentPlayingAudio,
    setSelectedStoryIdForReject,
    setRejectReason,
    addTherapist,
    handleChildSwitch,
    handleDeleteChild,
    handleApprove,
    handleReject,
    handleRespondInvitation,
    handleRemoveConnection,
    handleDeleteStory,
    handleToggleVisibility,
    handleLogout,
    getUserData,
    backendUrl,
    handleSearchTherapists,
  } = useProfileData();

  // Loading & Verifica
  if (!userData || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userData.isAccountVerified) {
    return <AccountSettings userData={userData} backendUrl={backendUrl} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Helmet>
        <title>Profilo — Storie Amiche</title>
        <meta name="description" content="Visualizza e gestisci il tuo profilo utente." />
      </Helmet>
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ProfileHeader
          userData={userData}
          isTherapist={isTherapist}
          onEdit={() => setIsEditModalOpen(true)}
          onAddChild={() => setIsAddChildModalOpen(true)}
          onSearchTherapist={handleSearchTherapists}
          onDelete={() => setIsDeleteModalOpen(true)}
          onLogout={handleLogout}
        />

        {isTherapist ? (
          <TherapistDashboard
            pendingInvitations={pendingInvitations}
            pendingStories={pendingStories}
            stories={stories}
            assignedFamilies={assignedFamilies}
            currentPlayingAudio={currentPlayingAudio}
            selectedStoryIdForReject={selectedStoryIdForReject}
            rejectReason={rejectReason}
            savingStoryIds={savingStoryIds}
            activeGenerations={activeGenerations}
            onSetCurrentPlayingAudio={setCurrentPlayingAudio}
            onSetSelectedStoryIdForReject={setSelectedStoryIdForReject}
            onSetRejectReason={setRejectReason}
            onApprove={handleApprove}
            onReject={handleReject}
            onRespondInvitation={handleRespondInvitation}
            onRemoveConnection={handleRemoveConnection}
            onDeleteStory={handleDeleteStory}
            onToggleVisibility={handleToggleVisibility}
            onAssignStory={(story) => { setSelectedStoryForAssign(story); setAssignChildrenModalOpen(true); }}
          />
        ) : (
          <ParentDashboard
            myChildren={myChildren}
            stories={stories}
            myTherapists={myTherapists}
            savingStoryIds={savingStoryIds}
            activeGenerations={activeGenerations}
            onChildSwitch={handleChildSwitch}
            onDeleteChild={handleDeleteChild}
            onAddChild={() => setIsAddChildModalOpen(true)}
            onToggleVisibility={handleToggleVisibility}
            onDeleteStory={handleDeleteStory}
            onAssignStory={(story) => { setSelectedStoryForAssign(story); setAssignChildrenModalOpen(true); }}
            onRemoveConnection={handleRemoveConnection}
            onSearchTherapists={() => handleSearchTherapists()}
          />
        )}
      </div>

      {/* MODALI */}
      {isEditModalOpen && (
        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} currentUser={userData} onUpdateSuccess={() => { getUserData(); setIsEditModalOpen(false); }} />
      )}
      {isDeleteModalOpen && (
        <DeleteProfileModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} backendUrl={backendUrl} onDeleteSuccess={() => { window.location.href = '/'; }} />
      )}
      {isAddChildModalOpen && (
        <AddChildModal isOpen={isAddChildModalOpen} onClose={() => setIsAddChildModalOpen(false)} backendUrl={backendUrl} onChildAdded={() => { }} />
      )}

      {/* Cerca Terapista */}
      {searchTherapistModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Trova un Terapista</h2>
              <button onClick={() => setSearchTherapistModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={24} /></button>
            </div>
            <div className="space-y-4">
              {therapistsList.map(t => (
                <div key={t.id} className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full border flex items-center justify-center text-2xl">👨‍⚕️</div>
                    <div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <p className="text-sm text-gray-600">{t.specialization} • Max {t.maxChildren} bimbi</p>
                      <p className="text-xs text-gray-400">{t.email}</p>
                    </div>
                  </div>
                  <button onClick={() => addTherapist(t.email)} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 shadow-md transition-all whitespace-nowrap">Invia Richiesta</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assegna Storia */}
      {assignChildrenModalOpen && selectedStoryForAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{isTherapist ? '👨‍⚕️ Assegna Attività ai Pazienti' : '👶 Assegna Storia ai Tuoi Figli'}</h2>
              <button onClick={() => { setAssignChildrenModalOpen(false); setSelectedStoryForAssign(null); }} className="text-gray-400 hover:text-gray-600"><FaTimes size={24} /></button>
            </div>
            <div className="mb-6 p-4 bg-purple-50 rounded-xl">
              <h3 className="font-bold text-purple-800 mb-1">{selectedStoryForAssign.title}</h3>
              <p className="text-xs text-purple-600">{selectedStoryForAssign.description}</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">{isTherapist ? 'Seleziona i pazienti a cui assegnare questa attività:' : 'Seleziona i bambini che potranno leggere questa storia:'}</p>
            {myChildren.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Non hai ancora aggiunto bambini.</p>
              </div>
            ) : (
              <AssignChildrenForm
                children={myChildren}
                storyId={selectedStoryForAssign._id}
                gameType={selectedStoryForAssign.gameType}
                backendUrl={backendUrl}
                onSuccess={() => { setAssignChildrenModalOpen(false); setSelectedStoryForAssign(null); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;