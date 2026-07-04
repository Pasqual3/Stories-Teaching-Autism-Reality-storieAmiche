import React, { useContext, useState, useRef, useEffect } from "react";
import { assets } from "../../assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { appContext } from "../../context/appContext";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaChild, FaRocket, FaCat, FaDog, FaHeart, FaStar,
  FaCar, FaTree, FaUserCircle, FaBars, FaTimes
} from 'react-icons/fa';

const Navbar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const guideTimeoutRef = useRef(null);
  const activitiesTimeoutRef = useRef(null);

  const avatarIcons = {
    FaChild, FaRocket, FaCat, FaDog, FaHeart, FaStar, FaCar, FaTree
  };

  const {
    userData,
    backendUrl,
    logoutAction,
    sessionExitHandler,
    getUserData,
    generationProgressMap
  } = useContext(appContext);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);

  // STATO PER IL MENU MOBILE (HAMBURGER)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calcolo progressi generazione
  const generationEntries = Object.entries(generationProgressMap || {});
  let aggregatedGen = null;
  if (generationEntries.length > 0) {
    let totalDone = 0;
    let totalScenes = 0;
    generationEntries.forEach(([id, v]) => {
      totalDone += Number(v?.scene_done) || 0;
      totalScenes += Number(v?.scene_total) || 0;
    });
    const percent = totalScenes > 0 ? Math.round((totalDone / totalScenes) * 100) : null;
    aggregatedGen = { totalDone, totalScenes, percent };
  }

  useEffect(() => {
    const handlePopState = () => {
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      if (getUserData) getUserData().catch(() => { });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getUserData]);

  const handleProtectedAction = (actionType, destination) => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (sessionExitHandler) {
      try {
        sessionExitHandler();
        toast.info('💾 Salvataggio in corso...', { autoClose: 1000 });
      } catch (e) { console.error(e); }
    }
    if (actionType === 'navigate') navigate(destination);
    else if (actionType === 'logout') logoutAction();
  };

  const sendVerificationOtp = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const { data } = await axios.post(backendUrl + "/api/auth/send-verify-otp");
      if (data.success) {
        navigate("/email-verify");
        toast.success(data.message);
      } else toast.error(data.message);
    } catch (error) {
      if (!error.response) {
        toast.error("Errore di rete. Controlla la tua connessione.");
      }
    }
    finally { setIsSubmitting(false); }
  };

  const isReadingStory = location.pathname.startsWith('/story/');
  const showChildMode = userData?.isChildActive === true;

  // Funzione helper per chiudere il menu mobile durante la navigazione
  const navMobile = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Banner Verifica Email */}
      {userData && !userData.isAccountVerified && !showChildMode && (
        <div className="w-full bg-red-500 text-white text-center text-xs sm:text-sm py-1.5 font-bold z-[200]">
          ⚠️ Account non verificato. <button onClick={sendVerificationOtp} className="underline">Reinvia email</button>
        </div>
      )}

      {/* NAVBAR PRINCIPALE - Padding ridotto (px-4 lg:px-8) per non schiacciare al centro */}
      <div className={`w-full flex justify-between items-center px-4 lg:px-8 h-20 z-[100] relative ${showChildMode ? 'bg-gradient-to-r from-orange-300 to-pink-400 border-b-4 border-white/30' : 'bg-gradient-to-r from-pink-300 to-purple-400 shadow-md'
        }`}>

        {/* LATO SINISTRO: Logo e Menu Desktop (Vicinissimi) */}
        <div className="flex items-center gap-4 lg:gap-8">

          {/* LOGO */}
          <div onClick={() => navigate(showChildMode ? '/child-dashboard' : '/')} className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
            <span className="text-2xl sm:text-3xl">🌈</span>
            <span className="text-white text-lg sm:text-2xl font-black whitespace-nowrap tracking-tight">STORIE AMICHE</span>
          </div>

          {/* MENU DESKTOP (Nascosto su Mobile) */}
          {userData && (
            <ul className="hidden md:flex gap-4 lg:gap-6 items-center m-0 p-0">
              {!showChildMode ? (
                <>
                  {/* Dropdown Nuove Attività */}
                  <li
                    className="relative"
                    onMouseEnter={() => { if (activitiesTimeoutRef.current) clearTimeout(activitiesTimeoutRef.current); setIsActivitiesOpen(true); }}
                    onMouseLeave={() => { activitiesTimeoutRef.current = setTimeout(() => setIsActivitiesOpen(false), 300); }}
                  >
                    <span className="text-white hover:text-purple-100 cursor-pointer font-medium select-none whitespace-nowrap flex items-center gap-1">
                      Nuove Attività <span className="text-xs">▼</span>
                    </span>
                    {isActivitiesOpen && (
                      <ul className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                        <li
                          onClick={() => { navigate('/newStory'); setIsActivitiesOpen(false); }}
                          className="py-2.5 px-4 hover:bg-purple-50 rounded-lg text-sm font-bold text-gray-800 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          📝 Nuova Storia
                        </li>
                        <li
                          onClick={() => { navigate('/newEmoGame'); setIsActivitiesOpen(false); }}
                          className="py-2.5 px-4 hover:bg-purple-50 rounded-lg text-sm font-bold text-gray-800 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          🎮 Nuovo EmoGame
                        </li>
                        <li
                          onClick={() => { navigate('/adaptiveNarration'); setIsActivitiesOpen(false); }}
                          className="py-2.5 px-4 hover:bg-purple-50 rounded-lg text-sm font-bold text-gray-800 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          📖 Adaptive Story
                        </li>
                      </ul>
                    )}
                  </li>

                  {/* Dropdown Guide Desktop */}
                  <li
                    className="relative"
                    onMouseEnter={() => { if (guideTimeoutRef.current) clearTimeout(guideTimeoutRef.current); setIsGuideOpen(true); }}
                    onMouseLeave={() => { guideTimeoutRef.current = setTimeout(() => setIsGuideOpen(false), 300); }}
                  >
                    <span className="text-white hover:text-purple-100 cursor-pointer font-medium select-none whitespace-nowrap flex items-center gap-1">
                      📖 Guide <span className="text-xs">▼</span>
                    </span>
                    {isGuideOpen && (
                      <ul className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                        <li onClick={() => { navigate('/guide/social-stories'); setIsGuideOpen(false); }} className="py-2 px-4 hover:bg-purple-50 rounded-lg text-sm font-bold text-gray-800 cursor-pointer">📖 Social Stories</li>
                        <li onClick={() => { navigate('/guide/strange-stories'); setIsGuideOpen(false); }} className="py-2 px-4 hover:bg-orange-50 rounded-lg text-sm font-bold text-gray-800 cursor-pointer">🧠 Strange Stories</li>
                        <li onClick={() => { navigate('/guide/emo-guide'); setIsGuideOpen(false); }} className="py-2 px-4 hover:bg-orange-50 rounded-lg text-sm font-bold text-gray-800 cursor-pointer">🎮 EmoGame</li>
                      </ul>
                    )}
                  </li>

                  {/* Pulsante di Azione Specifica */}
                  {userData.tipo_utente === 'terapeuta' ? (
                    <li onClick={() => navigate('/therapist-analytics')} className="text-white hover:text-purple-100 cursor-pointer font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors">
                      📊 Analytics
                    </li>
                  ) : (
                    <li onClick={() => navigate('/child-select')} className="bg-green-200 text-green-800 px-3.5 py-1.5 rounded-full font-bold text-sm cursor-pointer hover:scale-105 transition-all whitespace-nowrap shadow-sm">
                      👶 Area Bambini
                    </li>
                  )}
                </>
              ) : (
                !location.pathname.startsWith('/child-dashboard') && (
                  <li onClick={() => handleProtectedAction('navigate', '/child-dashboard')} className="bg-white/60 text-gray-800 px-4 py-1.5 rounded-full font-black text-sm cursor-pointer hover:scale-105 transition-all whitespace-nowrap">🏠 Bacheca</li>
                )
              )}
              {children}
            </ul>
          )}
        </div>

        {/* LATO DESTRO: Progresso, Avatar e Hamburger Menu */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Progresso Audio (Visibile solo da tablet in su) */}
          {aggregatedGen && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <div className="text-white text-[10px] sm:text-xs font-bold flex items-center gap-1">
                <span>🎧 Audio {aggregatedGen.percent}%</span>
              </div>
              <div className="w-24 sm:w-32 h-1.5 bg-white/30 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-green-300 transition-all" style={{ width: `${aggregatedGen.percent}%` }}></div>
              </div>
            </div>
          )}

          {/* MENU HAMBURGER (Visibile solo su Mobile) */}
          {userData && (
            <button
              className="md:hidden text-white text-2xl p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          )}

          {/* AVATAR + DROPDOWN PROFILO */}
          {userData ? (
            <div
              onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setIsDropdownOpen(true); }}
              onMouseLeave={() => { timeoutRef.current = setTimeout(() => setIsDropdownOpen(false), 300); }}
              onClick={() => { if (!showChildMode) navigate('/profile'); }}
              className="relative z-[120]"
            >
              {!showChildMode ? (
                /* Premium Button for Therapist & Family Dashboard */
                <div className="flex items-center gap-2.5 bg-white/20 hover:bg-white/30 text-white pl-4 pr-2.5 py-1.5 rounded-full border border-white/40 shadow-md transition-all hover:scale-105 cursor-pointer select-none">
                  <span className="font-bold text-sm tracking-wide">La mia dashboard</span>
                  <div className="w-8 h-8 rounded-full bg-purple-900 border border-white/60 flex items-center justify-center font-black text-sm text-purple-100 shadow-inner">
                    {userData.name?.[0]?.toUpperCase()}
                  </div>
                </div>
              ) : (
                /* Standard Circle Avatar */
                <div className={`flex justify-center items-center text-white cursor-pointer font-black rounded-full shadow-lg transition-all hover:scale-105 ${showChildMode ? 'w-12 h-12 sm:w-14 sm:h-14 text-2xl bg-orange-500 border-[3px] border-white' : 'w-9 h-9 sm:w-10 sm:h-10 text-xl bg-purple-900 border-2 border-white/50'}`}>
                  {showChildMode && userData?.avatar && avatarIcons[userData.avatar] ? (
                    React.createElement(avatarIcons[userData.avatar], { className: "w-6 h-6 sm:w-8 sm:h-8" })
                  ) : (
                    userData.name?.[0]?.toUpperCase()
                  )}
                </div>
              )}

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 animate-in fade-in duration-200">
                  <ul className="bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 overflow-hidden font-bold list-none p-1 m-0">

                    {/* Sezione Profilo */}
                    {!showChildMode && (
                      <li
                        onClick={(e) => { e.stopPropagation(); navigate('/profile'); setIsDropdownOpen(false); }}
                        className="py-3 px-4 hover:bg-purple-50 text-purple-700 cursor-pointer text-sm flex items-center gap-2 border-b border-gray-50 m-0"
                      >
                        <FaUserCircle className="text-lg" /> Il mio Profilo
                      </li>
                    )}

                    {/* Verifica Email */}
                    {!userData.isAccountVerified && !showChildMode && (
                      <li onClick={(e) => { e.stopPropagation(); sendVerificationOtp(); }} className="py-2.5 px-4 hover:bg-yellow-50 text-yellow-700 cursor-pointer text-xs">
                        Verifica Account
                      </li>
                    )}

                    {/* Azioni di uscita */}
                    {(!isReadingStory || !showChildMode) ? (
                      <li
                        onClick={(e) => { e.stopPropagation(); showChildMode ? handleProtectedAction('logout') : logoutAction(); }}
                        className="py-3 px-4 hover:bg-red-50 text-red-600 cursor-pointer text-sm flex items-center gap-2"
                      >
                        {showChildMode ? 'Esci dall\'Area Bimbi' : 'Logout'}
                      </li>
                    ) : (
                      <li className="py-3 px-4 text-gray-400 text-[10px] text-center italic">
                        Finisci la storia per uscire
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/login")} className="bg-white text-gray-800 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold hover:scale-105 transition-all shadow-md flex items-center gap-2 text-sm sm:text-base">
              Login <img src={assets.arrow_icon} alt="" className="w-3" />
            </button>
          )}
        </div>
      </div>

      {/* DROPDOWN MENU MOBILE (Visibile solo se isMobileMenuOpen è true su schermi piccoli) */}
      {isMobileMenuOpen && userData && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white shadow-xl z-[90] border-t border-gray-100">
          <ul className="flex flex-col p-4 gap-4 font-bold text-gray-700">
            {!showChildMode ? (
              <>
                <li className="p-2">
                  <span className="text-gray-400 text-xs uppercase mb-2 block font-semibold">Attività</span>
                  <div className="flex flex-col gap-2 pl-2">
                    <span onClick={() => navMobile('/newStory')} className="text-sm hover:text-purple-600 cursor-pointer flex items-center gap-2">📝 Nuova Storia</span>
                    <span onClick={() => navMobile('/newEmoGame')} className="text-sm hover:text-purple-600 cursor-pointer flex items-center gap-2">🎮 Nuovo EmoGame</span>
                    <span onClick={() => navMobile('/adaptiveNarration')} className="text-sm hover:text-purple-600 cursor-pointer flex items-center gap-2">📖 Adaptive Story</span>
                  </div>
                </li>

                <li className="p-2 border-t border-gray-100">
                  <span className="text-gray-400 text-xs uppercase mb-2 block font-semibold">Guide</span>
                  <div className="flex flex-col gap-2 pl-2">
                    <span onClick={() => navMobile('/guide/social-stories')} className="text-sm hover:text-purple-600 cursor-pointer">📖 Social Stories</span>
                    <span onClick={() => navMobile('/guide/strange-stories')} className="text-sm hover:text-orange-600 cursor-pointer">🧠 Strange Stories</span>
                    <span onClick={() => navMobile('/guide/emo-guide')} className="text-sm hover:text-orange-600 cursor-pointer">🎮 EmoGame</span>
                  </div>
                </li>

                <li className="pt-2 border-t border-gray-100 flex flex-col gap-3">
                  {userData.tipo_utente === 'terapeuta' ? (
                    <button onClick={() => navMobile('/therapist-analytics')} className="w-full text-left p-3 bg-indigo-50 text-indigo-700 rounded-lg font-bold flex items-center gap-2 animate-in fade-in duration-200">📊 Analytics</button>
                  ) : (
                    <button onClick={() => navMobile('/child-select')} className="w-full text-left p-3 bg-green-50 text-green-700 rounded-lg font-bold flex items-center gap-2 animate-in fade-in duration-200">👶 Area Bambini</button>
                  )}
                  <button onClick={() => navMobile('/profile')} className="w-full text-left p-3 bg-purple-50 text-purple-700 rounded-lg font-bold flex items-center gap-2">👤 La mia dashboard</button>
                  <button onClick={() => { logoutAction(); setIsMobileMenuOpen(false); }} className="w-full text-left p-3 bg-red-50 text-red-700 rounded-lg font-bold flex items-center gap-2">🚪 Logout</button>
                </li>
              </>
            ) : (
              !location.pathname.startsWith('/child-dashboard') && (
                <li onClick={() => { handleProtectedAction('navigate', '/child-dashboard'); setIsMobileMenuOpen(false); }} className="p-3 bg-orange-100 text-orange-800 rounded-lg text-center cursor-pointer">
                  🏠 Torna alla mia Bacheca
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </>
  );
};

export default Navbar;