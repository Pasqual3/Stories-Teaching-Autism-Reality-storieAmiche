import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { appContext } from '../../../context/appContext';

export const useProfileData = () => {
  const { userData, backendUrl, getUserData, savingStoryIds, activeGenerations, setActiveChild } = useContext(appContext);
  const navigate = useNavigate();

  // Stato
  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState([]);

  const [myChildren, setMyChildren] = useState([]);
  const [myTherapists, setMyTherapists] = useState([]);
  const [therapistsList, setTherapistsList] = useState([]);
  const [searchTherapistModalOpen, setSearchTherapistModalOpen] = useState(false);
  const [assignChildrenModalOpen, setAssignChildrenModalOpen] = useState(false);
  const [selectedStoryForAssign, setSelectedStoryForAssign] = useState(null);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

  const [pendingStories, setPendingStories] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [assignedFamilies, setAssignedFamilies] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedStoryIdForReject, setSelectedStoryIdForReject] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState(null);

  // Fetch
  useEffect(() => {
    if (userData) {
      userData.tipo_utente === 'terapeuta' ? fetchTherapistData() : fetchParentData();
    }
  }, [userData, backendUrl]);

  // A
  const fetchParentData = async () => {
    try {
      setIsLoading(true);
      const [s, eg, c, t] = await Promise.all([
        axios.get(`${backendUrl}/api/story/my-stories`),
        axios.get(`${backendUrl}/api/emoGame/my-emogames`),
        axios.get(`${backendUrl}/api/user/children`),
        axios.get(`${backendUrl}/api/user/therapists`)
      ]);
      const storie = s.data.success ? s.data.stories : [];
      const emoGames = eg.data.success ? eg.data.stories : [];
      setStories([...storie, ...emoGames]);
      if (c.data.success) setMyChildren(c.data.children);
      if (t.data.success) setMyTherapists(t.data.therapists);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // A
  const fetchTherapistData = async () => {
    try {
      setIsLoading(true);
      // Una sola chiamata: pending-stories senza filtri restituisce già sia
      // storie normali che emoGame — la seconda chiamata creava duplicati.
      const [p, ch, i, m, mEmo] = await Promise.all([
        axios.get(`${backendUrl}/api/approval/pending-stories`),
        axios.get(`${backendUrl}/api/approval/assigned-children`),
        axios.get(`${backendUrl}/api/approval/invitations`),
        axios.get(`${backendUrl}/api/story/my-stories`),
        axios.get(`${backendUrl}/api/emoGame/my-emogames`)
      ]);
      const allPending = p.data.success ? p.data.stories : [];
      setPendingStories(allPending);
      if (ch.data.success) {
        const families = ch.data.families || [];
        setAssignedFamilies(families);
        const therapistChildren = [];
        families.forEach(fam => {
          (fam.children || []).forEach(child => {
            therapistChildren.push({
              ...child,
              parentName: fam.parentName
            });
          });
        });
        setMyChildren(therapistChildren);
      }
      if (i.data.success) setPendingInvitations(i.data.invitations || []);

      const storie = m.data.success ? m.data.stories : [];
      const emoGames = mEmo.data.success ? mEmo.data.stories : [];
      setStories([...storie, ...emoGames]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    if (!userData) return;
    userData.tipo_utente === 'terapeuta' ? fetchTherapistData() : fetchParentData();
  };

  // Azioni Genitore
  const handleSearchTherapists = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/search-therapists`);
      if (data.success) {
        setTherapistsList(data.therapists);
        setSearchTherapistModalOpen(true);
      }
    } catch {
      toast.error('Errore ricerca terapeuti');
    }
  };

  const addTherapist = async (email) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/add-therapist`, { therapistEmail: email });
      if (data.success) {
        toast.success(data.message);
        setSearchTherapistModalOpen(false);
        refresh();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Errore aggiunta terapista');
    }
  };

  const handleChildSwitch = async (child) => {
    let pin = '';
    if (child.pin) {
      const entered = prompt(`Inserisci il PIN per ${child.name}:`);
      if (!entered) return;
      pin = entered;
    }
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/switch-child/${child._id}`, { pin });
      if (data.success) {
        toast.success(data.message);

        // Aggiorna lo stato utente e il bambino attivo prima di navigare per attivare la protezione
        const freshUserData = await getUserData();
        const childInfo = {
          childId: child._id,
          parentId: freshUserData?._id || userData?._id || 'unknown',
          childName: child.name
        };

        if (typeof setActiveChild === 'function') {
          setActiveChild(childInfo);
        }

        navigate('/child-dashboard');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Errore durante lo switch');
    }
  };

  const handleDeleteChild = async (child) => {
    if (!window.confirm(`Eliminare profilo di ${child.name}?`)) return;
    try {
      await axios.delete(`${backendUrl}/api/user/delete-child/${child._id}`);
      toast.success('Eliminato');
      refresh();
    } catch {
      toast.error('Errore eliminazione');
    }
  };

  // Azioni Terapeuta
  const handleApprove = async (storyId) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/approval/approve/${storyId}`);
      if (data.success) { toast.success(data.message); refresh(); }
      else toast.error(data.message);
    } catch { toast.error('Errore approvazione'); }
  };

  const handleReject = async (storyId) => {
    if (!rejectReason) return toast.warning('Motivazione richiesta');
    try {
      const { data } = await axios.post(`${backendUrl}/api/approval/reject/${storyId}`, { reason: rejectReason });
      if (data.success) {
        toast.success(data.message);
        setRejectReason('');
        setSelectedStoryIdForReject(null);
        refresh();
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Errore rifiuto'); }
  };

  const handleRespondInvitation = async (parentId, action) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/approval/respond-invitation`, { parentId, action });
      if (data.success) {
        toast.success(data.message);
        refresh();
        getUserData();
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Errore gestione invito'); }
  };

  // Azioni Comuni
  const handleRemoveConnection = async (targetId, name) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere il collegamento con ${name}?`)) return;
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/remove-connection`, { targetId });
      if (data.success) { toast.success(data.message); refresh(); }
      else toast.error(data.message);
    } catch { toast.error('Errore disconnessione'); }
  };

  // A
  const handleDeleteStory = async (storyId, title, gameType = 'story') => {
    if (!window.confirm(`Eliminare definitivamente "${title}"?`)) return;
    try {
      const endpoint = gameType === 'emoGame'
        ? `${backendUrl}/api/emoGame/delete/${storyId}`
        : `${backendUrl}/api/story/delete/${storyId}`;
      const { data } = await axios.delete(endpoint);
      if (data.success) { toast.success(data.message); refresh(); }
      else toast.error(data.message);
    } catch { toast.error('Errore eliminazione storia'); }
  };

  // A
  const handleToggleVisibility = async (story) => {
    if (story.status === 'DRAFT') {
      return toast.warning('⚠️ Non puoi cambiare la visibilità di una bozza. Prima completa e invia la storia!');
    }
    try {
      const endpoint = story.gameType === 'emoGame'
        ? `${backendUrl}/api/emoGame/toggle-visibility`
        : `${backendUrl}/api/story/toggle-visibility`;
      const { data } = await axios.put(endpoint, {
        storyId: story._id,
        isPublic: !story.isPublic
      });
      if (data.success) {
        toast.success(story.isPublic ? 'Storia resa privata' : 'Storia resa pubblica');
        refresh();
      } else {
        toast.error(data.message);
      }
    } catch { toast.error('Errore cambio visibilità'); }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`);
      navigate('/');
      window.location.reload();
    } catch { toast.error('Logout error'); }
  };

  return {
    // Dati
    userData,
    isLoading,
    isTherapist: userData?.tipo_utente === 'terapeuta',
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

    // Setters modali
    setIsEditModalOpen,
    setIsDeleteModalOpen,
    setIsAddChildModalOpen,
    setSearchTherapistModalOpen,
    setAssignChildrenModalOpen,
    setSelectedStoryForAssign,
    setCurrentPlayingAudio,
    setSelectedStoryIdForReject,
    setRejectReason,

    // Azioni
    refresh,
    handleSearchTherapists,
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

    // Stati modali aperti (per lettura in index)
    isEditModalOpen,
    isDeleteModalOpen,
    isAddChildModalOpen,
    searchTherapistModalOpen,
    assignChildrenModalOpen,

    backendUrl,
    getUserData,
  };
};