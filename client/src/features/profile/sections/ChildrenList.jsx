import { FaChild, FaTrash, FaUserPlus } from 'react-icons/fa';

const ChildrenList = ({ myChildren, onChildSwitch, onDeleteChild, onAddChild }) => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        👶 I Tuoi Bambini
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {myChildren.map(child => (
          <div
            key={child._id}
            onClick={() => onChildSwitch(child)}
            className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 relative group cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl overflow-hidden">
              {child.avatar && child.avatar.startsWith('http') ? (
                <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
              ) : (
                <FaChild className="text-orange-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-800">{child.name}</p>
              <p className="text-xs text-gray-500">PIN: {child.pin ? 'Reimposta' : 'Nessuno'}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChild(child);
              }}
              className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Elimina bambino"
            >
              <FaTrash size={12} />
            </button>
          </div>
        ))}

        <button
          onClick={onAddChild}
          className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-400 transition-colors"
        >
          <FaUserPlus /> Aggiungi
        </button>
      </div>
    </section>
  );
};

export default ChildrenList;