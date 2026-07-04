import React from 'react';
import { FaSave, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ActionButtons = ({ isSubmitting, onAddScene, onSaveDraft, onPublish }) => {
    const navigate = useNavigate();

    return (
        <div className="mt-10 flex flex-wrap justify-between items-center gap-4 pt-8 border-t border-gray-100">
            <button
                type="button"
                onClick={() => navigate('/profile')}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-all"
            >
                Annulla
            </button>

            <button
                type="button"
                onClick={onAddScene}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-200'
                    }`}
            >
                <FaPlus /> Aggiungi Quesito
            </button>

            <div className="flex flex-wrap gap-4">
                <button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg bg-white border-2 border-indigo-500 text-indigo-600 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:scale-105'
                        }`}
                >
                    <FaSave /> Salva Bozza
                </button>

                <button
                    type="button"
                    onClick={onPublish}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg text-white transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 hover:shadow-indigo-200/50'
                        }`}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Salvataggio...
                        </div>
                    ) : (
                        <>
                            <span>🚀</span>
                            <span>Pubblica EmoGame</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ActionButtons;
