import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

// Contesto globale per condividere lo stato di autenticazione in tutta l'app
export const appContext = createContext();

export const AppContextProvider = (props) => {
  // 1. CONFIGURAZIONE AXIOS GLOBALE
  // Impostiamo `withCredentials = true` di default.
  // Questo è FONDAMENTALE perché permette al browser di inviare automaticamente
  // i cookie (che contengono il token JWT) ad ogni richiesta verso il backend.
  axios.defaults.withCredentials = true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  // Stato: L'utente è loggato?
  const [isLoggedin, setIsLoggedin] = useState(false);

  // Stato: Dati dell'utente (Nome, Email, Tipo, ecc.)
  // Usiamo null inizialmente per distinguere "caricamento" da "nessun dato"
  const [userData, setUserdata] = useState(null);

  // --- FUNZIONE: SCARICA I DATI UTENTE ---
  // Chiamata dopo il login o al refresh se c'è una sessione attiva
  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/data");
      if (data.success) {
        setUserdata(data.userData);
        console.log("✅ Dati utente caricati:", data.userData);
      } else {
        // Se il token è scaduto o non valido, resettiamo lo stato
        setUserdata(null);
      }
    } catch (error) {
      console.error("Errore recupero dati utente:", error.message);
    }
  };

  // --- FUNZIONE: CONTROLLA SESSIONE ATTIVA ---
  // Eseguita una volta sola all'avvio dell'applicazione (useEffect)
  const getAuthState = async () => {
    try {
      // Chiediamo al backend: "Ho un cookie valido?"
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth");

      if (data.success) {
        // SÌ: Impostiamo stato login e scarichiamo i dettagli utente
        setIsLoggedin(true);
        getUserData();
      } else {
        // NO: Resettiamo tutto (utente ospite)
        setIsLoggedin(false);
        setUserdata(null);
      }
    } catch (error) {
      console.error("Check Auth fallito:", error.message);
      setIsLoggedin(false);
      setUserdata(null);
    }
  };

  // Eseguiamo il controllo appena l'app viene montata
  useEffect(() => {
    getAuthState();
  }, []);

  // Valori esposti a tutti i componenti figli
  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserdata,
    getUserData,
  };

  return (
    <appContext.Provider value={value}>{props.children}</appContext.Provider>
  );
};