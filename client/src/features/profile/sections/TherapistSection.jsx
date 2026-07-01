import { FaUserMd, FaTimes, FaSearch } from 'react-icons/fa';

const TherapistSection = ({ myTherapists, onRemoveConnection, onSearchTherapists }) => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        👨‍⚕️ I Tuoi Terapisti
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {myTherapists.map((t, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-blue-100 flex items-center justify-between gap-4 group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl">
                <FaUserMd />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800">{t.name}</p>
                  {t.status === 'pending' ? (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">In Attesa</span>
                  ) : (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Attivo</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{t.email}</p>
                <p className="text-xs text-blue-500 font-medium">{t.specialization}</p>
              </div>
            </div>
            <button
              onClick={() => onRemoveConnection(t.id, t.name)}
              className="text-red-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Rimuovi Terapeuta"
            >
              <FaTimes />
            </button>
          </div>
        ))}

        <button
          onClick={onSearchTherapists}
          className="border-2 border-dashed border-blue-200 rounded-xl p-4 flex items-center justify-center text-blue-400 hover:text-blue-600 hover:border-blue-400 transition-colors bg-blue-50/50"
        >
          <FaSearch /> Cerca Terapista
        </button>
      </div>
    </section>
  );
};

export default TherapistSection;