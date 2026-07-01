import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import EmailVerify from '../../auth/components/EmailVerify';

const AccountSettings = ({ userData, backendUrl }) => {
  const navigate = useNavigate();
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleSendVerify = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp');
      if (data.success) {
        toast.success("Email di verifica inviata! Controlla la posta.");
        navigate('/email-verify');
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      if (!e.response) {
        toast.error("Errore di rete. Controlla la tua connessione.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(backendUrl + '/api/auth/logout');
      window.location.reload();
    } catch (e) {
      toast.error("Errore logout");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-8 border-red-500">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Account Non Verificato</h1>
        <p className="text-gray-600 mb-6">
          Ciao {userData.name}, per accedere alla tua dashboard e utilizzare la piattaforma devi verificare il tuo indirizzo email.
        </p>
        <p className="text-sm text-gray-400 bg-gray-100 p-3 rounded mb-6">
          Controlla la tua casella di posta: <strong>{userData.email}</strong>
        </p>

        <button
          onClick={handleSendVerify}
          className="w-full bg-indigo-600 text-white py-3 rounded-full font-bold hover:bg-indigo-700 transition"
        >
          Invia Nuova Email di Verifica
        </button>

        <div className="mt-6 border-t pt-4">
          <button onClick={() => navigate('/')} className="text-gray-500 text-sm hover:underline">Torna alla Home</button>
          <span className="mx-2 text-gray-300">|</span>
          <button onClick={handleLogout} className="text-gray-500 text-sm hover:underline">Logout</button>
        </div>

        {showOtpModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn relative">
              <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">✕</button>
              <EmailVerify isModal={true} onVerified={() => setShowOtpModal(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;