import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const TherapistPinModal = ({ backendUrl, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) return toast.warning('Inserisci la password');
    
    try {
      setLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/auth/verify-pin`, { pin });
      if (data.success) {
        toast.success('Accesso autorizzato');
        onSuccess();
      } else {
        toast.error(data.message || 'Password non valida');
      }
    } catch (err) {
      toast.error('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 
          SFONDO BLUR: 
          Questo div prende tutto lo schermo e applica il blur 
          sulla Dashboard che sta sotto.
      */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/10 transition-all duration-500" />

      {/* 
          MODAL:
          Un box bianco molto pulito che si staglia sullo sfondo sfocato.
      */}
      <div className="relative bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-8 w-full max-w-sm border border-white/60">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="text-5xl mb-3">🌈</div>
          <h1 className="text-xl font-black text-gray-800 uppercase tracking-widest">Storie Amiche</h1>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Clinica</h2>
          <p className="text-sm text-gray-500 mt-2">
            Inserisci la tua <strong>password</strong> per visualizzare i dati sensibili dei pazienti.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-gray-800 transition-all bg-white"
              placeholder="••••••••"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl py-4 text-white font-black text-lg shadow-xl shadow-indigo-200 transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? 'Verifica in corso...' : '🔐 Sblocca Dashboard'}
          </button>
        </form>

        <p className="mt-6 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
          Area protetta crittografata
        </p>
      </div>
    </div>
  );
};

export default TherapistPinModal;