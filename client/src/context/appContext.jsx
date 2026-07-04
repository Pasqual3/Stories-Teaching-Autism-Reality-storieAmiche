import axios from 'axios';
import { createContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from './hooks/useAuth';
import { useChildSession } from './hooks/useChildSession';
import { useStorySaver } from './hooks/useStorySaver';
import { useAudioManager } from './hooks/useAudioManager';

export const appContext = createContext();

export const AppContextProvider = (props) => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  axios.defaults.withCredentials = true;

  const auth = useAuth(backendUrl);
  const child = useChildSession(backendUrl, auth.getUserData);
  const saver = useStorySaver(backendUrl, auth.getUserData);
  const audio = useAudioManager(backendUrl, auth.getUserData, auth.isLoggedinRef);

  const { userData, getAuthState, clearAuth, intentionalLogoutRef } = auth;
  const { healChildState, setActiveChildPersisted } = child;

  // Heal child state quando userData arriva dal server
  useEffect(() => {
    if (userData) {
      healChildState(userData);
    }
  }, [userData, healChildState]);

  // Interceptor globale (deve vedere auth + child + navigate)
  useEffect(() => {
    const authErrorPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout',
      '/api/auth/is-auth',
    ];

    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const isAuthRequest = authErrorPaths.some(path => requestUrl.includes(path));

        if (status === 401 || status === 403) {
          if (isAuthRequest) return Promise.reject(error);
          if (intentionalLogoutRef.current) return Promise.reject(error);

          clearAuth();
          setActiveChildPersisted(null);
          navigate('/login');
          toast.warning('⚠️ Sessione scaduta. Effettua di nuovo il login.');
        } else if (status === 429) {
          toast.error('⚠️ Troppe richieste! Per favore, riprova tra 15 minuti.');
        } else if (status >= 500) {
          const backendMsg = error.response?.data?.message || error.response?.data?.error;
          toast.error(backendMsg || '❌ Si è verificato un errore del server. Riprova più tardi.');
        }

        return Promise.reject(error);
      }
    );

    getAuthState();

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [getAuthState, clearAuth, intentionalLogoutRef, setActiveChildPersisted, navigate]);

  // Logout wrapper: se è attiva la modalità bambino, apre la modale invece di fare logout diretto
  const logoutAction = useCallback(async () => {
    if (auth.userData?.isChildActive) {
      child.setExitChildError('');
      child.setIsExitChildModalOpen(true);
      return;
    }
    await auth.logoutAction();
  }, [auth, child]);

  const value = {
    backendUrl,
    isLoggedin: auth.isLoggedin,
    setIsLoggedin: auth.setIsLoggedin,
    userData: auth.userData,
    setUserdata: auth.setUserdata,
    getUserData: auth.getUserData,
    isCheckingAuth: auth.isCheckingAuth,

    isBackgroundSaving: saver.isBackgroundSaving,
    savingStoryIds: saver.savingStoryIds,
    saveStoryInBackground: saver.saveStoryInBackground,
    saveEmoGameInBackground: saver.saveEmoGameInBackground,

    activeGenerations: audio.activeGenerations,
    generationProgressMap: audio.generationProgressMap,
    generateAudioInBackground: audio.generateAudioInBackground,
    resumeAudioJob: audio.resumeAudioJob,
    generateSceneAudioInBackground: audio.generateSceneAudioInBackground,

    activeChild: child.activeChild,
    setActiveChild: child.setActiveChild,
    sessionExitHandler: child.sessionExitHandler,
    setSessionExitHandler: child.setSessionExitHandler,

    logoutAction,

    isExitChildModalOpen: child.isExitChildModalOpen,
    setIsExitChildModalOpen: child.setIsExitChildModalOpen,
    exitChildError: child.exitChildError,
    setExitChildError: child.setExitChildError,
    isExitChildSubmitting: child.isExitChildSubmitting,
    submitExitChildPassword: child.submitExitChildPassword,
  };

  return (
    <appContext.Provider value={value}>{props.children}</appContext.Provider>
  );
};