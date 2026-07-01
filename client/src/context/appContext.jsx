import axios from "axios";
import { createContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CACHE_KEY } from '../features/home/utils/storyCache';
import { pollAudioJob } from './useAudioPolling';

export const appContext = createContext();

export const AppContextProvider = (props) => {

  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserdata] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Ref sincronizzato con isLoggedin — usato dai loop di polling (closure altrimenti stale)
  // per fermarsi non appena l'utente non è più autenticato.
  const isLoggedinRef = useRef(isLoggedin);
  useEffect(() => {
    isLoggedinRef.current = isLoggedin;
  }, [isLoggedin]);

  // Flag per logout volontario: dice all'interceptor 401/403 di non mostrare
  // "Sessione scaduta" per richieste in-volo (es. polling audio) finite dopo il logout.
  const intentionalLogoutRef = useRef(false);

  // =============================================
  // STATO BAMBINO ATTIVO — persiste nel localStorage
  // così sopravvive ai refresh della pagina
  // =============================================
  const [activeChild, setActiveChild] = useState(() => {
    try {
      const saved = localStorage.getItem('activeChild');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isExitChildModalOpen, setIsExitChildModalOpen] = useState(false);
  const [exitChildError, setExitChildError] = useState("");
  const [isExitChildSubmitting, setIsExitChildSubmitting] = useState(false);

  // Wrapper che salva sempre nel localStorage
  const setActiveChildPersisted = (child) => {
    if (child) {
      localStorage.setItem('activeChild', JSON.stringify(child));
    } else {
      localStorage.removeItem('activeChild');
    }
    setActiveChild(child);
  };

  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/data");
      if (data.success) {
        setUserdata(data.userData);

        // HEAL: Se il backend dice che il bambino è attivo ma noi non lo abbiamo nel context/localStorage
        if (data.userData.isChildActive && data.userData.activeChildId && (!activeChild || !activeChild.childId)) {
          const healedChild = {
            childId: data.userData.activeChildId,
            parentId: data.userData._id,
            childName: data.userData.name
          };
          setActiveChildPersisted(healedChild);
        } else if (!data.userData.isChildActive && activeChild) {
          setActiveChildPersisted(null);
        }

        return data.userData; // Return for immediate use
      } else {
        setUserdata(null);
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const getAuthState = async () => {
    setIsCheckingAuth(true);
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth");
      if (data.success) {
        setIsLoggedin(true);
        await getUserData();
      } else {
        setIsLoggedin(false);
        setUserdata(null);
        // Only clear if we are sure the session is gone
        if (activeChild) setActiveChildPersisted(null);
      }
    } catch (error) {
      // Nessuna sessione valida (cookie assente/scaduto): è la condizione normale
      // per un visitatore non loggato o al primo controllo dopo un refresh.
      // Niente toast/redirect qui: lo fa solo l'interceptor per richieste fatte DURANTE l'uso.
      setIsLoggedin(false);
      setUserdata(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    const authErrorPaths = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/logout",
      "/api/auth/is-auth"
    ];

    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";
        const isAuthRequest = authErrorPaths.some(path => requestUrl.includes(path));

        if (status === 401 || status === 403) {
          if (isAuthRequest) {
            return Promise.reject(error);
          }

          // Logout volontario in corso: il cookie è già stato invalidato di proposito,
          // un 401 di una richiesta in-volo (es. polling audio) non è una sessione scaduta.
          if (intentionalLogoutRef.current) {
            return Promise.reject(error);
          }

          setIsLoggedin(false);
          setUserdata(null);
          setActiveChildPersisted(null);
          navigate("/login");
          toast.warning("⚠️ Sessione scaduta. Effettua di nuovo il login.");
        } else if (status === 429) {
          toast.error("⚠️ Troppe richieste! Per favore, riprova tra 15 minuti.");
        } else if (status >= 500) {
          // Errore server: usa il messaggio specifico del backend se presente, altrimenti il messaggio generico
          const backendMsg = error.response?.data?.message || error.response?.data?.error;
          toast.error(backendMsg || "❌ Si è verificato un errore del server. Riprova più tardi.");
        }

        return Promise.reject(error);
      }
    );

    getAuthState();

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const [isBackgroundSaving, setIsBackgroundSaving] = useState(false);
  const [savingStoryIds, setSavingStoryIds] = useState([]);
  const [activeGenerations, setActiveGenerations] = useState([]);
  const [generationProgressMap, setGenerationProgressMap] = useState({});
  const [sessionExitHandler, setSessionExitHandler] = useState(null);

  const updateGenerationProgress = (generationId, progress = {}) => {
    setGenerationProgressMap(prev => {
      const next = { ...prev };
      next[generationId] = { ...(next[generationId] || {}), ...progress };
      return next;
    });
  };

  const removeGenerationProgress = (generationId) => {
    setGenerationProgressMap(prev => {
      const next = { ...prev };
      delete next[generationId];
      return next;
    });
  };

  const saveStoryInBackground = async (formData, storyId = null, silent = false) => {
    setIsBackgroundSaving(true);
    if (storyId) setSavingStoryIds(prev => [...prev, storyId]);

    let toastId = null;
    if (!silent) {
      toastId = toast.info("Salvataggio storia in corso... ⏳", { autoClose: false, closeButton: false });
    }

    try {
      axios.defaults.withCredentials = true;
      const url = storyId
        ? `${backendUrl}/api/story/update/${storyId}`
        : `${backendUrl}/api/story/create`;

      const method = storyId ? 'put' : 'post';
      const { data } = await axios[method](url, formData);

      if (data.success) {
        if (toastId) {
          toast.update(toastId, {
            render: "✅ Storia salvata con successo!",
            type: "success",
            autoClose: 3000,
            closeButton: true
          });
        }
        // Invalida la cache delle storie in home così la nuova storia
        // compare subito alla prossima visita alla pagina home
        try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignored */ }
        getUserData();
        return data.story?._id || storyId;
      } else {
        if (toastId) {
          toast.update(toastId, {
            render: "❌ Errore: " + data.message,
            type: "error",
            autoClose: 5000,
            closeButton: true
          });
        }
        return null;
      }
    } catch (error) {
      if (toastId) {
        toast.update(toastId, {
          render: "❌ Errore durante il salvataggio in background.",
          type: "error",
          autoClose: 5000,
          closeButton: true
        });
      } else {
        toast.error("❌ Errore salvataggio rapido");
      }
      return null;
    } finally {
      setIsBackgroundSaving(false);
      if (storyId) setSavingStoryIds(prev => prev.filter(id => id !== storyId));
    }
  };

  /**
   * saveEmoGameInBackground
   *
   * Versione dedicata per gli EmoGame: punta a /api/emoGame/create e /api/emoGame/update/:id
   * invece di /api/story/*.
   * Il backend inietterà gameType:'emoGame' tramite middleware, ma il client
   * usa comunque un endpoint separato per maggiore chiarezza e separazione.
   */
  const saveEmoGameInBackground = async (formData, emoGameId = null, silent = false) => {
    setIsBackgroundSaving(true);
    if (emoGameId) setSavingStoryIds(prev => [...prev, emoGameId]);

    let toastId = null;
    if (!silent) {
      toastId = toast.info("Salvataggio EmoGame in corso... ⏳", { autoClose: false, closeButton: false });
    }

    try {
      axios.defaults.withCredentials = true;
      const url = emoGameId
        ? `${backendUrl}/api/emoGame/update/${emoGameId}`
        : `${backendUrl}/api/emoGame/create`;

      const method = emoGameId ? 'put' : 'post';
      const { data } = await axios[method](url, formData);

      if (data.success) {
        if (toastId) {
          toast.update(toastId, {
            render: "✅ EmoGame salvato con successo!",
            type: "success",
            autoClose: 3000,
            closeButton: true
          });
        }
        getUserData();
        return data.story?._id || emoGameId;
      } else {
        if (toastId) {
          toast.update(toastId, {
            render: "❌ Errore: " + data.message,
            type: "error",
            autoClose: 5000,
            closeButton: true
          });
        }
        return null;
      }
    } catch (error) {
      if (toastId) {
        toast.update(toastId, {
          render: "❌ Errore durante il salvataggio in background.",
          type: "error",
          autoClose: 5000,
          closeButton: true
        });
      } else {
        toast.error("❌ Errore salvataggio rapido EmoGame");
      }
      return null;
    } finally {
      setIsBackgroundSaving(false);
      if (emoGameId) setSavingStoryIds(prev => prev.filter(id => id !== emoGameId));
    }
  };

  const generateAudioInBackground = async (storyId, audioConfig, silent = false, onProgress = null) => {
    // Sistema a coda: avvia job e fa polling ogni 8 secondi
    if (!storyId) return;
    if (activeGenerations.includes(storyId)) {
      if (!silent) {
        toast.warning("Generazione audio già in corso per questa storia. Attendi il completamento.");
      }
      return null;
    }

    setActiveGenerations(prev => [...prev, storyId]);
    // Inizializza progresso globale per questa generazione
    updateGenerationProgress(storyId, { scene_done: 0, scene_total: null, status: 'queued' });
    const toastId = toast.info("🎧 L'IA sta generando il parlato in background...", { autoClose: false });

    try {
      // 1. Avvia il job — risponde subito con jobId, nessun timeout
      const { data } = await axios.post(`${backendUrl}/api/story/generate-audio`, audioConfig, { timeout: 30000 });

      if (!data.success || !data.jobId) {
        toast.update(toastId, { render: "❌ Errore avvio generazione audio: " + (data.message || ""), type: "error", autoClose: 5000 });
        return null;
      }

      // 2. Polling ogni 8 secondi finché non è pronto (max 20 minuti)
      const jobId = data.jobId;
      const statusUrl = `${backendUrl}/api/story/audio-status/${jobId}`;

      await pollAudioJob(jobId, statusUrl, {
        isLoggedinRef,
        onDone: async (statusData, timeStr) => {
          const payload = { narrationUrls: JSON.stringify(statusData.audioUrls || []) };
          if (statusData.audioUrls?.length > 0 && statusData.audioUrls[0]) payload.narrationUrl = statusData.audioUrls[0];
          if (audioConfig.intendedStatus) payload.status = audioConfig.intendedStatus;
          const formData = new FormData();
          formData.append('narrationUrls', payload.narrationUrls);
          if (payload.narrationUrl) formData.append('narrationUrl', payload.narrationUrl);
          if (payload.status) formData.append('status', payload.status);
          const updateRes = await axios.put(`${backendUrl}/api/story/update/${storyId}`, formData);
          if (updateRes.data.success) {
            updateGenerationProgress(storyId, { scene_done: statusData.scene_done, scene_total: statusData.scene_total, status: 'done' });
            onProgress?.({ scene_done: statusData.scene_done, scene_total: statusData.scene_total, status: 'done' });
            toast.update(toastId, { render: `🎧 Audio generato in ${timeStr} — collegato alla storia!`, type: 'success', autoClose: 5000 });
            getUserData();
          }
        },
        onError: (statusData) => {
          onProgress?.({ status: 'error' });
          toast.update(toastId, { render: '❌ Errore generazione audio: ' + (statusData.message || ''), type: 'error', autoClose: 5000 });
        },
        onProgress: (statusData, timeStr) => {
          const sceneDone  = statusData.scene_done  ?? null;
          const sceneTotal = statusData.scene_total ?? null;
          onProgress?.({ scene_done: sceneDone, scene_total: sceneTotal, status: statusData.status });
          updateGenerationProgress(storyId, { scene_done: sceneDone, scene_total: sceneTotal, status: statusData.status });
          const statusLabel = statusData.status === 'queued'
            ? `⏳ In coda (pos. ${statusData.position || '?'}) — ${timeStr}`
            : sceneDone !== null && sceneTotal !== null
              ? `🎙️ Generazione audio: Scena ${sceneDone} di ${sceneTotal} — ${timeStr}`
              : `🎙️ Generazione audio in corso... — ${timeStr}`;
          toast.update(toastId, { render: statusLabel, type: 'info', autoClose: false });
        },
        onTimeout: () => {
          toast.update(toastId, { render: '⏱️ Timeout generazione audio — riprova.', type: 'error', autoClose: 5000 });
        },
      });
    } catch (error) {
      // Log dettagliato per debug (visualizzabile nella console browser)
      console.error('generateAudioInBackground - critical error', error);
      const errMsg = error?.response?.data?.message || error?.message || String(error);
      // Notifica l'utente con dettaglio dell'errore e aggiorna il caller
      toast.update(toastId, { render: `❌ Errore critico generazione audio in background: ${errMsg}`, type: "error", autoClose: 8000 });
      onProgress?.({ status: 'error', message: errMsg });
      return null;
    } finally {
      setActiveGenerations(prev => prev.filter(id => id !== storyId));
      removeGenerationProgress(storyId);
    }
  };

  const resumeAudioJob = async (storyId, jobId, intendedStatus = null, silent = false, onProgress = null) => {
    if (!storyId || !jobId) return null;
    const generationId = `resume:${jobId}`;
    if (activeGenerations.includes(generationId)) {
      if (!silent) {
        toast.warning("Ripresa generazione audio già in corso. Attendi il completamento.");
      }
      return null;
    }

    setActiveGenerations(prev => [...prev, generationId]);
    updateGenerationProgress(generationId, { scene_done: 0, scene_total: null, status: 'queued' });
    const toastId = silent ? null : toast.info("🎧 Ripristino generazione audio in corso...", { autoClose: false });

    try {
      const statusUrl = `${backendUrl}/api/story/audio-status/${jobId}`;

      await pollAudioJob(jobId, statusUrl, {
        isLoggedinRef,
        onDone: async (statusData, timeStr) => {
          const payload = { narrationUrls: JSON.stringify(statusData.audioUrls || []) };
          if (statusData.audioUrls?.[0]) payload.narrationUrl = statusData.audioUrls[0];
          if (intendedStatus) payload.status = intendedStatus;
          const formData = new FormData();
          formData.append('narrationUrls', payload.narrationUrls);
          if (payload.narrationUrl) formData.append('narrationUrl', payload.narrationUrl);
          if (payload.status) formData.append('status', payload.status);
          const updateRes = await axios.put(`${backendUrl}/api/story/update/${storyId}`, formData);
          if (updateRes.data.success) {
            updateGenerationProgress(generationId, { scene_done: statusData.scene_done, scene_total: statusData.scene_total, status: 'done' });
            onProgress?.({ scene_done: statusData.scene_done, scene_total: statusData.scene_total, status: 'done' });
            if (toastId) toast.update(toastId, { render: `🎧 Audio ripristinato e completato in ${timeStr}`, type: 'success', autoClose: 5000 });
            getUserData();
          }
        },
        onError: (statusData) => {
          onProgress?.({ status: 'error' });
          if (toastId) toast.update(toastId, { render: '❌ Errore ripristino generazione audio.', type: 'error', autoClose: 5000 });
        },
        onExpired: () => {
          onProgress?.({ status: 'expired' });
          if (toastId) toast.update(toastId, { render: "⚠️ Generazione audio precedente scaduta. La storia è tornata in bozza — puoi rigenerare l'audio.", type: 'warning', autoClose: 7000 });
        },
        onProgress: (statusData, timeStr) => {
          const sceneDone  = statusData.scene_done  ?? null;
          const sceneTotal = statusData.scene_total ?? null;
          onProgress?.({ scene_done: sceneDone, scene_total: sceneTotal, status: statusData.status });
          updateGenerationProgress(generationId, { scene_done: sceneDone, scene_total: sceneTotal, status: statusData.status });
          const statusLabel = statusData.status === 'queued'
            ? `⏳ In coda (pos. ${statusData.position || '?'}) — ${timeStr}`
            : `🎙️ Ripristino audio: Scena ${sceneDone ?? '?'} di ${sceneTotal ?? '?'} — ${timeStr}`;
          if (toastId) toast.update(toastId, { render: statusLabel, type: 'info', autoClose: false });
        },
        onTimeout: () => {
          if (toastId) toast.update(toastId, { render: '⏱️ Timeout ripristino generazione audio — riprova.', type: 'error', autoClose: 5000 });
        },
      });
      return null;
    } catch (error) {
      console.error('resumeAudioJob - critical error', error);
      const errMsg = error?.response?.data?.message || error?.message || String(error);
      if (toastId) {
        toast.update(toastId, { render: `❌ Errore critico ripristino audio: ${errMsg}`, type: 'error', autoClose: 8000 });
      }
      onProgress?.({ status: 'error', message: errMsg });
      return null;
    } finally {
      setActiveGenerations(prev => prev.filter(id => id !== generationId));
      removeGenerationProgress(generationId);
    }
  };

  const generateSceneAudioInBackground = async (storyId, sceneIndex, audioConfig, silent = false) => {
    if (!storyId) return null;
    const generationId = `${storyId}:${sceneIndex}`;
    if (activeGenerations.includes(generationId)) {
      if (!silent) {
        toast.warning("Generazione audio già in corso per questa scena. Attendi il completamento.");
      }
      return null;
    }

    setActiveGenerations(prev => [...prev, generationId]);
    // Inizializza progresso per la scena specifica
    updateGenerationProgress(generationId, { scene_done: 0, scene_total: null, status: 'queued' });
    const toastId = toast.info("🎧 L'IA sta generando l'audio della scena in background...", { autoClose: false });

    try {
      const { data } = await axios.post(`${backendUrl}/api/story/generate-audio`, { ...audioConfig, singleScene: true }, { timeout: 30000 });

      if (!data.success || !data.jobId) {
        toast.update(toastId, { render: "❌ Errore avvio generazione audio: " + (data.message || ""), type: "error", autoClose: 5000 });
        return null;
      }

      const jobId = data.jobId;
      const statusUrl = `${backendUrl}/api/story/audio-status/${jobId}`;
      const processingMessages = [
        "🎧 L'IA sta leggendo la scena...",
        "🎙️ Generazione voce in corso...",
        "🔊 Elaborazione audio...",
        "⏳ Quasi pronto, ancora un momento...",
        "🎵 Sto dando voce alla scena...",
        "🤖 Il modello AI sta lavorando...",
      ];
      let msgIndex = 0;

      await pollAudioJob(jobId, statusUrl, {
        isLoggedinRef,
        onDone: async (statusData, timeStr) => {
          const narrationUrls = Array(sceneIndex).fill('');
          narrationUrls.push(statusData.audioUrls?.[0] || '');
          const payload = { narrationUrls: JSON.stringify(narrationUrls) };
          if (audioConfig.intendedStatus) payload.status = audioConfig.intendedStatus;
          const formData = new FormData();
          formData.append('narrationUrls', payload.narrationUrls);
          if (payload.status) formData.append('status', payload.status);
          const updateRes = await axios.put(`${backendUrl}/api/story/update/${storyId}`, formData);
          if (updateRes.data.success) {
            updateGenerationProgress(generationId, { scene_done: statusData.scene_done ?? 1, scene_total: statusData.scene_total ?? 1, status: 'done' });
            toast.update(toastId, { render: `🎧 Audio scena ${sceneIndex + 1} generato in ${timeStr}!`, type: 'success', autoClose: 5000 });
            getUserData();
          }
        },
        onError: (statusData) => {
          toast.update(toastId, { render: '❌ Errore generazione audio: ' + (statusData.message || ''), type: 'error', autoClose: 5000 });
        },
        onProgress: (statusData, timeStr) => {
          const statusLabel = statusData.status === 'queued'
            ? `⏳ In coda (pos. ${statusData.position || '?'}) — ${timeStr}`
            : `${processingMessages[msgIndex % processingMessages.length]} — ${timeStr}`;
          msgIndex++;
          toast.update(toastId, { render: statusLabel, type: 'info', autoClose: false });
        },
        onTimeout: () => {
          toast.update(toastId, { render: '⏱️ Timeout generazione audio — riprova.', type: 'error', autoClose: 5000 });
        },
      });
      return null;
    } catch (error) {
      console.error(`generateSceneAudioInBackground error (storyId=${storyId}, sceneIndex=${sceneIndex})`, error);
      const errMsg = error?.response?.data?.message || error?.message || String(error);
      toast.update(toastId, { render: `❌ Errore critico generazione audio in background: ${errMsg}`, type: "error", autoClose: 8000 });
      return null;
    } finally {
      setActiveGenerations(prev => prev.filter(id => id !== generationId));
      removeGenerationProgress(generationId);
    }
  };

  const submitExitChildPassword = async (password) => {
    setIsExitChildSubmitting(true);
    setExitChildError("");
    try {
      const { data } = await axios.post(backendUrl + "/api/user/logout-child", { password });
      if (data.success) {
        setIsExitChildModalOpen(false);
        setActiveChildPersisted(null);
        await getUserData();
        navigate("/");
        toast.success(data.message || "Uscito dall'Area Bimbi");
        return true;
      } else {
        setExitChildError(data.message || "Password errata. Riprova.");
        return false;
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || "Errore di connessione.";
      setExitChildError(errMsg);
      return false;
    } finally {
      setIsExitChildSubmitting(false);
    }
  };

  const logoutAction = async () => {
    try {
      axios.defaults.withCredentials = true;
      if (userData?.isChildActive) {
        setExitChildError("");
        setIsExitChildModalOpen(true);
        return;
      }
      intentionalLogoutRef.current = true;
      const { data } = await axios.post(backendUrl + "/api/auth/logout");
      if (data.success) {
        setIsLoggedin(false);
        setUserdata(null);
        setActiveChildPersisted(null);
        navigate("/");
        toast.info("Logout effettuato");
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setIsLoggedin(false);
        setUserdata(null);
        setActiveChildPersisted(null);
        navigate("/");
        toast.info("Logout effettuato");
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      // Piccola finestra di tolleranza per le richieste già in volo (es. polling audio)
      // che potrebbero ricevere un 401 a logout appena avvenuto.
      setTimeout(() => { intentionalLogoutRef.current = false; }, 3000);
    }
  };

  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserdata,
    getUserData,
    isBackgroundSaving,
    savingStoryIds,
    saveStoryInBackground,
    saveEmoGameInBackground,
    generateAudioInBackground,
    resumeAudioJob,
    generateSceneAudioInBackground,
    activeGenerations,
    generationProgressMap,
    isCheckingAuth,
    // --- BAMBINO ATTIVO (persiste nel localStorage) ---
    activeChild,
    setActiveChild: setActiveChildPersisted,
    sessionExitHandler,
    setSessionExitHandler,
    logoutAction,
    // --- MODALE USCITA BAMBINO ---
    isExitChildModalOpen,
    setIsExitChildModalOpen,
    exitChildError,
    setExitChildError,
    isExitChildSubmitting,
    submitExitChildPassword
  };

  return (
    <appContext.Provider value={value}>{props.children}</appContext.Provider>
  );
};