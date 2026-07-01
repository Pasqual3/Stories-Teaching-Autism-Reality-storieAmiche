import React, { useContext, useState } from "react";
import { assets } from "../../../assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { appContext } from "../../../context/appContext";
import axios from "axios";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";

const Login = () => {
  const { backendUrl, setIsLoggedin, getUserData } = useContext(appContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState("Login");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("Adulto");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [showGdprDetail, setShowGdprDetail] = useState(false);

  const onsubmitHandler = async (e) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);

      const targetPath = location.state?.from || "/";

      if (state === "Sign Up") {
        if (!gdprAccepted) {
          toast.error("Devi accettare l'informativa sulla privacy per registrarti.");
          setIsSubmitting(false);
          return;
        }
        const { data } = await axios.post(backendUrl + "/api/auth/register", {
          name,
          surname,
          email,
          password,
          userType,
        });

        if (data.success) {
          setIsLoggedin(true);
          await getUserData();
          navigate(targetPath);
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(backendUrl + "/api/auth/login", {
          email,
          password,
        });

        if (data.success) {
          setIsLoggedin(true);
          await getUserData();
          toast.success("Login effettuato con successo!");

          if (data.user && data.user.tipo_utente === 'bambino') {
            navigate('/child-select');
          } else {
            // BUG6 FIX: porta alla home invece che alla pagina profilo
            navigate('/');
          }
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message || error.response?.data?.error;

      if (status === 401) {
        toast.error(serverMessage || "Credenziali non valide. Controlla email e password.");
      } else if (status === 409) {
        toast.error(serverMessage || "Email già registrata.");
      } else {
        toast.error(serverMessage || "Si è verificato un errore. Riprova più tardi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-200 to-pink-400 min-w-screen min-h-screen flex flex-col font-sans">
      <Helmet>
        <title>Login / Registrazione — Storie Amiche</title>
        <meta name="description" content="Accedi o crea un account su Storie Amiche." />
      </Helmet>

      {/* LOGO CLICCABILE */}
      <div className="p-5 sm:p-8">
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 inline-flex"
        >
          <span className="text-3xl">🌈</span>
          <span className="text-white drop-shadow-md text-xl sm:text-2xl font-black tracking-tight">
            STORIE AMICHE
          </span>
        </div>
      </div>

      {/* BOX FORM CENTRATO */}
      <div className="flex-1 flex justify-center items-center pb-20 px-4">
        {/* MODIFICA PRINCIPALE: Sfondo bianco, testo scuro, ombra definita */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-2xl w-full sm:w-[450px] border border-white/50">
          
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
            {state === "Sign Up" ? "Crea Account" : "Bentornato!"}
          </h2>

          <p className="text-center text-sm mb-8 text-gray-500">
            {state === "Sign Up"
              ? "Compila i campi per iniziare"
              : "Accedi al tuo account"}
          </p>

          <form onSubmit={onsubmitHandler}>

            {/* CAMPI EXTRA SOLO PER 'SIGN UP' */}
            {state === "Sign Up" && (
              <>
                {/* MODIFICA INPUT: Sfondo grigio chiarissimo, bordo focus, testo scuro */}
                <div className="w-full mb-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                  <img src={assets.person_icon} alt="" className="w-5 h-5 opacity-60" />
                  <input
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    className="bg-transparent outline-none flex-1 text-gray-800 placeholder-gray-400"
                    type="text"
                    placeholder="Inserisci Nome"
                    required
                  />
                </div>

                <div className="w-full mb-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                  <img src={assets.person_icon} alt="" className="w-5 h-5 opacity-60" />
                  <input
                    onChange={(e) => setSurname(e.target.value)}
                    value={surname}
                    className="bg-transparent outline-none flex-1 text-gray-800 placeholder-gray-400"
                    type="text"
                    placeholder="Inserisci Cognome"
                    required
                  />
                </div>

                <div className="w-full mb-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                  <img src={assets.person_icon} alt="" className="w-5 h-5 opacity-60" />
                  <select
                    onChange={(e) => setUserType(e.target.value)}
                    value={userType}
                    className="bg-transparent outline-none w-full text-gray-800 cursor-pointer font-medium"
                  >
                    <option value="Adulto">Ruolo: Adulto</option>
                    <option value="Terapeuta">Ruolo: Terapeuta</option>
                  </select>
                </div>
              </>
            )}

            {/* CAMPI SEMPRE VISIBILI (EMAIL E PASSWORD) */}
            <div className="w-full mb-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
              <img src={assets.mail_icon} alt="" className="w-5 h-5 opacity-60" />
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="bg-transparent outline-none flex-1 text-gray-800 placeholder-gray-400"
                type="email"
                placeholder="Inserisci Email"
                required
              />
            </div>

            <div className="w-full mb-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
              <img src={assets.lock_icon} alt="" className="w-5 h-5 opacity-60" />
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="bg-transparent outline-none flex-1 text-gray-800 placeholder-gray-400"
                type={showPassword ? "text" : "password"}
                placeholder="Inserisci Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {state === 'Login' && (
              <p
                onClick={() => navigate("/reset-password")}
                className="mb-6 mt-2 text-sm text-right cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Password dimenticata?
              </p>
            )}

            {/* MODIFICA GDPR: Testo scuro su sfondo azzurrino */}
            {state === 'Sign Up' && (
              <div className="mb-6 mt-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-start gap-3">
                  <input
                    id="gdpr-consent"
                    type="checkbox"
                    checked={gdprAccepted}
                    onChange={(e) => setGdprAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600 rounded"
                    required
                  />
                  <label htmlFor="gdpr-consent" className="text-xs text-gray-700 leading-relaxed cursor-pointer select-none">
                    Ho letto e accetto il trattamento dei dati personali ai sensi degli{' '}
                    <span className="font-bold text-indigo-700">artt. 13 e 7 del GDPR</span>.
                    I dati raccolti saranno utilizzati esclusivamente per la piattaforma <em>Storie Amiche</em>.
                    {' '}
                    <button
                      type="button"
                      onClick={() => setShowGdprDetail(!showGdprDetail)}
                      className="underline text-indigo-600 hover:text-indigo-800 transition-colors font-bold ml-1"
                    >
                      {showGdprDetail ? 'Nascondi ▲' : 'Leggi tutto ▼'}
                    </button>
                  </label>
                </div>

                {showGdprDetail && (
                  <div className="mt-3 border-t border-indigo-200/50 pt-3 text-[11px] text-gray-600 leading-relaxed space-y-2">
                    <p><strong>🎯 Finalità:</strong> Erogazione di contenuti per bambini con ASD e report per terapeuti/genitori associati.</p>
                    <p><strong>🔒 Sicurezza (Privacy by Design):</strong> I dati clinici e identificativi dei minori (childId, sessioni, stress test) sono <strong>cifrati a riposo (AES-256)</strong>. Le connessioni sono forzate su HTTPS.</p>
                    <p><strong>🛡️ Accessi (RBAC):</strong> I terapeuti possono accedere esclusivamente ai dati dei minori esplicitamente assegnati dal genitore.</p>
                    <p><strong>⚖️ Diritti (Art. 17 e Art. 7):</strong> Diritto di revoca, accesso e cancellazione definitiva (Right to Erasure) garantita tramite procedura sicura via codice OTP via email.</p>
                    <p className="text-indigo-800 font-semibold bg-indigo-100/50 p-1 rounded mt-1 text-center">
                      I tuoi dati sono al sicuro. Non usiamo sistemi di profilazione o condivisione esterna.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl py-3.5 text-white font-bold text-lg shadow-lg transition-all ${isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Attendere...</span>
                </div>
              ) : (
                state === 'Login' ? 'Accedi' : 'Registrati'
              )}
            </button>
          </form>

          {/* TOGGLE REGISTRAZIONE / LOGIN */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            {state === "Sign Up" ? (
              <p className="text-sm text-gray-600">
                Hai già un account?{" "}
                <span
                  onClick={() => setState("Login")}
                  className="cursor-pointer font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Accedi qui
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Non hai un account?{" "}
                <span
                  onClick={() => setState("Sign Up")}
                  className="cursor-pointer font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Registrati ora
                </span>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;