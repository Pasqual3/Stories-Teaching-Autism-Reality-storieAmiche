import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';

const DeleteProfileModal = ({ isOpen, onClose, backendUrl, onDeleteSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await axios.delete(`${backendUrl}/api/auth/delete-account`);
      if (data.success) {
        toast.success("Account eliminato");
        onDeleteSuccess();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Errore eliminazione account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <FaTimes />
        </button>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Elimina Account</h2>
        <p className="text-gray-600 mb-6">
          Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione non può essere annullata.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg font-bold hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Eliminazione...' : 'Conferma Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProfileModal;