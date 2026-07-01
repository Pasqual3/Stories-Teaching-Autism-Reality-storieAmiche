import { FaEdit, FaTrash, FaSignOutAlt, FaUserPlus, FaUserMd } from 'react-icons/fa';

const ProfileHeader = ({ userData, isTherapist, onEdit, onAddChild, onSearchTherapist, onDelete, onLogout }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-6 w-full md:w-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-md">
          {userData.name ? userData.name[0].toUpperCase() : 'U'}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ciao, {userData.name}!</h1>
          <p className="text-gray-500">{userData.email}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${isTherapist ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
            {isTherapist ? '👨‍⚕️ Terapeuta' : '👪 Genitore'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center md:justify-end w-full md:w-auto">
        <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-all">
          <FaEdit /> Modifica Profilo
        </button>

        {!isTherapist && (
          <>
            <button onClick={onAddChild} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md transition-all">
              <FaUserPlus /> Aggiungi Bambino
            </button>
            <button onClick={onSearchTherapist} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md transition-all">
              <FaUserMd /> Trova Terapista
            </button>
          </>
        )}

        <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all">
          <FaTrash /> Elimina
        </button>

        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 shadow-md transition-all">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;