import React from 'react';

const ConfirmModal = ({ isOpen, title, onConfirm, onCancel, confirmText = "Sì", cancelText = "No" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Overlay con sfocatura leggera */}
      <div 
        className="absolute inset-0 bg-white/20 backdrop-blur-md transition-opacity" 
        onClick={onCancel}
      ></div>

      {/* Box del Modal - Più piccolo, elegante e stile sito */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-white/50 transform transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Contenuto - Solo testo, niente icone */}
        <div className="p-8 text-center">
          <h3 className="text-xl font-bold text-gray-800 leading-snug">
            {title}
          </h3>
        </div>

        {/* Pulsanti - Riprendono i gradienti del sito */}
        <div className="flex flex-col gap-2 p-6 pt-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="w-full py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl font-black shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            {confirmText}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
