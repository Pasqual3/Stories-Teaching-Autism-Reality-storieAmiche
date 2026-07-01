import React, { useState, useContext, useEffect, useRef } from 'react';
import { appContext } from '../context/appContext';
import { FaLock, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

const ExitChildModal = () => {
    const {
        isExitChildModalOpen,
        setIsExitChildModalOpen,
        exitChildError,
        setExitChildError,
        isExitChildSubmitting,
        submitExitChildPassword
    } = useContext(appContext);

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isExitChildModalOpen) {
            setPassword('');
            setShowPassword(false);
            setExitChildError('');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isExitChildModalOpen, setExitChildError]);

    if (!isExitChildModalOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setExitChildError('Inserisci la password prima di continuare.');
            return;
        }
        await submitExitChildPassword(password);
    };

    const handleClose = () => {
        if (isExitChildSubmitting) return;
        setIsExitChildModalOpen(false);
        setPassword('');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fadeIn">
            {/* Modal Card */}
            <div 
                className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-amber-300 relative p-6 sm:p-8 flex flex-col gap-6"
                style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    disabled={isExitChildSubmitting}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Chiudi"
                >
                    <FaTimes size={18} />
                </button>

                {/* Header / Security Badge */}
                <div className="text-center mt-2">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner mb-4 animate-lockBounce">
                        <FaLock />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">
                        Controllo Genitori
                    </h3>
                    <p className="text-gray-500 font-bold text-sm sm:text-base mt-2 px-2 leading-relaxed">
                        Per uscire dall'Area Bimbi e tornare alla dashboard genitore, inserisci la tua password.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                            Password Genitore
                        </label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (exitChildError) setExitChildError('');
                                }}
                                disabled={isExitChildSubmitting}
                                placeholder="Inserisci la password"
                                className="w-full px-5 py-4 border-3 border-amber-100 focus:border-amber-400 outline-none rounded-2xl transition-all pr-12 text-base font-bold text-gray-800 bg-gray-50/50 focus:bg-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isExitChildSubmitting}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center p-1"
                            >
                                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Error Box */}
                    {exitChildError && (
                        <div 
                            className="bg-red-50 border-2 border-red-200 text-red-600 rounded-2xl p-3.5 text-sm font-bold text-center flex items-center justify-center gap-2"
                            style={{ animation: 'shake 0.4s ease-in-out' }}
                        >
                            <span>⚠️</span>
                            <span>{exitChildError}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            type="submit"
                            disabled={isExitChildSubmitting}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 text-base sm:text-lg border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExitChildSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Verifica in corso...
                                </>
                            ) : (
                                <>Verifica ed Esci 🚪</>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isExitChildSubmitting}
                            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all flex items-center justify-center text-sm sm:text-base border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Rimani in Area Bimbi 👶
                        </button>
                    </div>
                </form>
            </div>

            {/* CSS Keyframe Animations */}
            <style>{`
                @keyframes scaleIn {
                    0% { opacity: 0; transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes lockBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-6px); }
                    75% { transform: translateX(6px); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                .animate-lockBounce {
                    animation: lockBounce 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default ExitChildModal;
