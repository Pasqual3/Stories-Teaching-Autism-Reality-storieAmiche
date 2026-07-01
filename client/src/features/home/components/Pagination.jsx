import React from 'react';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-6 mt-20">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={`px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 border-4 border-white ${
          currentPage === 1
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-white text-gray-800 hover:bg-gray-800 hover:text-white transform hover:-translate-x-2'
        }`}
      >
        ←
      </button>

      <div className="flex items-center gap-3">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl font-black transition-all border-2 ${
              currentPage === page
                ? 'bg-gray-800 text-white border-gray-800 shadow-inner'
                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 border-4 border-white ${
          currentPage === totalPages
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-white text-gray-800 hover:bg-gray-800 hover:text-white transform hover:translate-x-2'
        }`}
      >
        →
      </button>
    </div>
  );
};