import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar';
import { Helmet } from "react-helmet-async";

/**
 * @page
 * PAGINA: GUIDA ALLE SOCIAL STORIES
 * Spiega cosa sono, a cosa servono e come si scrivono le Social Stories.
 */

const Section = ({ emoji, title, children, color = 'purple' }) => {
    const colors = {
        purple: 'from-purple-50 to-purple-100 border-purple-200',
        pink: 'from-pink-50 to-pink-100 border-pink-200',
        green: 'from-green-50 to-green-100 border-green-200',
        blue: 'from-blue-50 to-blue-100 border-blue-200',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6 mb-6`}>
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">{emoji}</span> {title}
            </h2>
            {children}
        </div>
    );
};

const TypeCard = ({ tipo, descrizione, esempio, percentuale, color }) => {
    const [open, setOpen] = useState(false);
    const colors = {
        purple: 'bg-purple-600',
        pink: 'bg-pink-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        orange: 'bg-orange-500',
    };
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-3 shadow-sm">
            <Helmet>
                <title>Storie Amiche — Social Stories Guide</title>
                <meta name="description" content="Cos'è una Social Story, a cosa serve, come si scrive e le 5 tipologie di frasi" />
            </Helmet>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className={`${colors[color]} text-white text-xs font-bold px-2 py-1 rounded-full`}>{percentuale}</span>
                    <span className="font-semibold text-gray-800">{tipo}</span>
                </div>
                <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="bg-gray-50 px-4 pb-4 pt-2 border-t border-gray-100">
                    <p className="text-gray-700 text-sm mb-2">{descrizione}</p>
                    {esempio && (
                        <div className="bg-white border-l-4 border-purple-400 pl-3 py-2 rounded-r-lg text-sm italic text-gray-600">
                            "{esempio}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Step = ({ numero, titolo, descrizione, esempio }) => (
    <div className="flex gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow">
            {numero}
        </div>
        <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">{titolo}</h3>
            <p className="text-gray-600 text-sm mb-2">{descrizione}</p>
            {esempio && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-800 italic">
                    💡 Esempio: "{esempio}"
                </div>
            )}
        </div>
    </div>
);

const SocialStoryGuide = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-purple-200">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Hero */}
                <div className="text-center mb-10">
                    <span className="text-6xl mb-4 block">📖</span>
                    <h1 className="text-4xl font-black text-purple-800 mb-3">Le Social Stories</h1>
                    <p className="text-gray-600 text-lg max-w-xl mx-auto">
                        Uno strumento narrativo per aiutare i bambini con autismo a comprendere
                        il mondo e affrontare le situazioni quotidiane con sicurezza.
                    </p>
                </div>

                {/* Cosa sono */}
                <Section emoji="🌟" title="Cosa sono le Social Stories?" color="purple">
                    <p className="text-gray-700 mb-3">
                        Le <strong>Social Stories</strong> sono brevi racconti personalizzati, inventati da Carol Gray nel 1991,
                        pensati per spiegare ai bambini con disturbo dello spettro autistico (DSA) come comportarsi
                        in situazioni sociali, scolastiche o quotidiane.
                    </p>
                    <p className="text-gray-700">
                        Ogni storia descrive una situazione specifica dal punto di vista del bambino, usando un linguaggio
                        semplice, concreto e rassicurante. L'obiettivo non è correggere un comportamento sbagliato,
                        ma <strong>condividere informazioni utili</strong> per capire cosa accade e cosa ci si aspetta.
                    </p>
                </Section>

                {/* A cosa servono */}
                <Section emoji="🎯" title="A cosa servono?" color="pink">
                    <ul className="space-y-3">
                        {[
                            { icon: '😌', testo: 'Ridurre l\'ansia legata a situazioni nuove o insolite' },
                            { icon: '🤝', testo: 'Insegnare abilità sociali e comportamenti appropriati' },
                            { icon: '📅', testo: 'Preparare il bambino a eventi imminenti (dentista, scuola, gite)' },
                            { icon: '💬', testo: 'Spiegare le regole implicite della comunicazione sociale' },
                            { icon: '🌈', testo: 'Valorizzare i punti di forza e aumentare l\'autostima' },
                            { icon: '🧩', testo: 'Aiutare a capire le emozioni proprie e altrui (teoria della mente)' },
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-gray-700">{item.testo}</span>
                            </li>
                        ))}
                    </ul>
                </Section>

                {/* I tipi di frasi */}
                <Section emoji="✍️" title="I tipi di frasi in una Social Story" color="blue">
                    <p className="text-gray-600 text-sm mb-4">
                        Carol Gray ha definito 5 tipologie di frasi. Clicca su ciascuna per scoprirla:
                    </p>
                    <TypeCard
                        tipo="Frasi Descrittive"
                        percentuale="50%+"
                        descrizione="Descrivono la situazione in modo obiettivo: dove, quando, chi, cosa e perché accade. Sono il nucleo della storia e devono essere la maggior parte."
                        esempio="Quando arrivo a scuola, metto il mio zaino nel mio posto e mi siedo al banco."
                        color="purple"
                    />
                    <TypeCard
                        tipo="Frasi Prospettiche"
                        percentuale="Variabile"
                        descrizione="Descrivono le reazioni e i pensieri degli altri, aiutando il bambino a sviluppare la prospettiva altrui."
                        esempio="I miei compagni sono contenti quando arrivo puntuale e siamo tutti insieme."
                        color="blue"
                    />
                    <TypeCard
                        tipo="Frasi Direttive"
                        percentuale="Max 1 ogni 2-5 descrittive"
                        descrizione="Suggeriscono un comportamento da adottare in modo positivo. Non devono essere troppo numerose."
                        esempio="Posso provare ad alzare la mano per parlare con la maestra."
                        color="green"
                    />
                    <TypeCard
                        tipo="Frasi Affermative"
                        percentuale="Libero"
                        descrizione="Rafforzano il valore di ciò che viene detto, esprimendo un principio condiviso o una rassicurazione."
                        esempio="Questo è importante per stare bene insieme agli altri."
                        color="orange"
                    />
                    <TypeCard
                        tipo="Frasi di Controllo"
                        percentuale="Opzionale"
                        descrizione="Scritte dal bambino stesso: strategie personali per ricordare come comportarsi."
                        esempio="Penso che fare una respirazione profonda mi aiuta a calmarmi."
                        color="pink"
                    />
                </Section>

                {/* Come si scrive */}
                <Section emoji="🖊️" title="Come si scrive una Social Story?" color="green">
                    <p className="text-gray-600 text-sm mb-5">
                        Segui questi passaggi per creare una storia efficace su <strong>Storie Amiche</strong>:
                    </p>
                    <Step
                        numero={1}
                        titolo="Scegli la situazione"
                        descrizione="Individua una situazione concreta e specifica che il bambino trova difficile o nuova. Evita temi troppo astratti."
                        esempio="Andare dal medico per una visita"
                    />
                    <Step
                        numero={2}
                        titolo="Raccogli informazioni"
                        descrizione="Parla con genitori, insegnanti e il bambino stesso per capire cosa succede esattamente in quella situazione e cosa genera difficoltà."
                    />
                    <Step
                        numero={3}
                        titolo="Scrivi dal punto di vista del bambino"
                        descrizione="Usa la prima persona ('Io...') o la terza ('Mario...') in modo coerente. Il tono deve essere positivo e rassicurante."
                        esempio="Quando vado dal dottore, lui mi guarda per capire come sto."
                    />
                    <Step
                        numero={4}
                        titolo="Inserisci le immagini"
                        descrizione="Aggiungi immagini semplici e chiare per ogni scena: illustrazioni, foto o simboli. Le immagini aiutano la comprensione e rendono la storia più coinvolgente."
                    />
                    <Step
                        numero={5}
                        titolo="Testa e adatta"
                        descrizione="Leggi la storia insieme al bambino. Osserva le sue reazioni e modifica le parti che non capisce o che lo mettono in difficoltà."
                    />
                </Section>

                {/* Regola d'oro */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white mb-8 shadow-lg">
                    <h2 className="text-xl font-black mb-2">✨ La regola d'oro</h2>
                    <p className="text-white/90 mb-2">
                        Per ogni frase direttiva, aggiungi almeno <strong>2–5 frasi descrittive o prospettiche</strong>.
                        La storia deve <em>informare</em>, non solo prescrivere comportamenti.
                    </p>
                    <p className="text-white/80 text-sm">
                        Una buona Social Story risponde alle domande: <strong>Dove? Quando? Chi? Cosa? Come? Perché?</strong>
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Pronto a creare la tua prima storia?</p>
                    <button
                        onClick={() => navigate('/newStory')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform text-lg"
                    >
                        📖 Crea una Social Story
                    </button>
                    <button
                        onClick={() => navigate('/guide/strange-stories')}
                        className="ml-4 bg-white text-orange-600 border-2 border-orange-300 font-bold px-6 py-4 rounded-full hover:bg-orange-50 transition-colors"
                    >
                        🧠 Scopri le Strange Stories →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocialStoryGuide;