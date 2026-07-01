import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar';
import { Helmet } from "react-helmet-async";

/**
 * @page
 * PAGINA: GUIDA ALL'EMOGAME
 * Spiega cos'è l'EmoGame, a cosa serve e come si usa per insegnare
 * il riconoscimento delle emozioni ai bambini con autismo.
 */

const Section = ({ emoji, title, children, color = 'blue' }) => {
    const colors = {
        blue: 'from-blue-50 to-sky-100 border-blue-200',
        teal: 'from-teal-50 to-cyan-100 border-teal-200',
        pink: 'from-pink-50 to-rose-100 border-pink-200',
        green: 'from-green-50 to-emerald-100 border-green-200',
        violet: 'from-violet-50 to-purple-100 border-violet-200',
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

const EmotionCard = ({ emozione, descrizione, colore, emoji }) => {
    const [open, setOpen] = useState(false);
    const colors = {
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
        green: 'bg-green-500',
    };
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-3 shadow-sm">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className={`${colors[colore]} text-white text-lg px-3 py-1 rounded-full`}>{emoji}</span>
                    <span className="font-semibold text-gray-800">{emozione}</span>
                </div>
                <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="bg-gray-50 px-4 pb-4 pt-2 border-t border-gray-100">
                    <p className="text-gray-700 text-sm">{descrizione}</p>
                </div>
            )}
        </div>
    );
};

const Step = ({ numero, titolo, descrizione, nota }) => (
    <div className="flex gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow">
            {numero}
        </div>
        <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">{titolo}</h3>
            <p className="text-gray-600 text-sm mb-2">{descrizione}</p>
            {nota && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-800 italic">
                    💡 {nota}
                </div>
            )}
        </div>
    </div>
);

const EmoGameGuide = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100">
            <Navbar />
            <Helmet>
                <title>Storie Amiche — EmoGame Guide</title>
                <meta name="description" content="Cos'è l'EmoGame, come insegna il riconoscimento delle emozioni ai bambini con autismo e come usarlo su Storie Amiche." />
            </Helmet>

            <div className="max-w-3xl mx-auto px-4 py-10">

                {/* Hero */}
                <div className="text-center mb-10">
                    <span className="text-6xl mb-4 block">🎮</span>
                    <h1 className="text-4xl font-black text-blue-700 mb-3">EmoGame</h1>
                    <p className="text-gray-600 text-lg max-w-xl mx-auto">
                        Un gioco interattivo per insegnare ai bambini con autismo a
                        <strong> riconoscere e nominare le emozioni</strong>, passo dopo passo,
                        con immagini, storie e attività coinvolgenti.
                    </p>
                </div>

                {/* Cos'è l'EmoGame */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🔍</span> Cos'è l'EmoGame?
                    </h2>
                    <p className="text-gray-700 mb-3">
                        L'<strong>EmoGame</strong> è un modulo interattivo di <strong>Storie Amiche</strong> progettato per insegnare
                        il riconoscimento delle emozioni ai bambini con disturbo dello spettro autistico (DSA).
                        Il gioco usa scene tratte dalle Social Stories per stimolare la capacità del bambino
                        di identificare, etichettare e comprendere le espressioni emotive.
                    </p>
                    <p className="text-gray-700 mb-3">
                        Riconoscere le espressioni facciali è una competenza fondamentale per la vita sociale:
                        ci permette di capire le intenzioni degli altri, di entrare in relazione e di rispondere
                        in modo appropriato nelle situazioni quotidiane. I bambini neurotipici iniziano a
                        riconoscere espressioni come felicità e tristezza già tra i 3 e i 4 mesi di età.
                    </p>
                    <p className="text-gray-700">
                        Nei bambini con autismo, questa abilità può essere più difficile da sviluppare — ma la ricerca
                        mostra che attività strutturate e graduate possono migliorare significativamente
                        la competenza nel riconoscimento emotivo. L'EmoGame è progettato proprio per questo.
                    </p>
                </div>

                {/* Box evidenza scientifica */}
                <div className="bg-white border-l-4 border-blue-400 rounded-r-2xl px-5 py-4 mb-6 shadow-sm">
                    <h3 className="font-bold text-blue-700 mb-1">💡 Cosa dice la ricerca?</h3>
                    <p className="text-gray-700 text-sm">
                        Studi clinici dimostrano che attività graduate e strutturate per il riconoscimento
                        delle emozioni producono miglioramenti significativi nelle abilità emotive dei bambini
                        con autismo — incluso un migliore riconoscimento delle espressioni e una maggiore
                        appropriatezza emotiva nelle interazioni sociali. Interventi basati sul gioco aumentano
                        ulteriormente l'efficacia, sfruttando la motivazione naturale dei bambini.
                    </p>
                </div>

                {/* A cosa serve */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎯</span> A cosa serve l'EmoGame su Storie Amiche?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { emoji: '😊', titolo: 'Riconoscimento', testo: 'Il bambino impara ad abbinare espressioni facciali alle emozioni corrispondenti, partendo da quelle di base.' },
                            { emoji: '🏷️', titolo: 'Etichettatura', testo: 'Sviluppa il vocabolario emotivo: dalla comprensione ricettiva ("mostrami triste") a quella espressiva ("come si sente?").' },
                            { emoji: '📖', titolo: 'Contestualizzazione', testo: 'Le emozioni vengono legate alle scene delle storie, aiutando il bambino a capire i trigger emotivi in situazioni reali.' },
                            { emoji: '📈', titolo: 'Monitoraggio', testo: 'Il terapista può tracciare i progressi nel tempo, identificare le emozioni più difficili e personalizzare il percorso.' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 flex gap-3 items-start shadow-sm border border-teal-100">
                                <span className="text-2xl">{item.emoji}</span>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{item.titolo}</p>
                                    <p className="text-gray-600 text-xs mt-0.5">{item.testo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Le 6 emozioni di base */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="text-2xl">😄</span> Le 6 emozioni di base
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                        L'EmoGame si basa sulle <strong>6 emozioni universali</strong> identificate dallo psicologo
                        Paul Ekman — riconoscibili in tutte le culture. Clicca per saperne di più su ciascuna:
                    </p>
                    <EmotionCard
                        emozione="Felicità"
                        emoji="😊"
                        colore="yellow"
                        descrizione="L'emozione positiva più facilmente riconoscibile. Si manifesta con un sorriso, occhi socchiusi e guance alzate. È spesso la prima emozione che i bambini imparano a identificare e un ottimo punto di partenza per il percorso."
                    />
                    <EmotionCard
                        emozione="Tristezza"
                        emoji="😢"
                        colore="blue"
                        descrizione="Caratterizzata da angoli della bocca abbassati, sopracciglia inarcate verso l'interno e sguardo basso. Spesso emerge in risposta a una perdita o delusione. Insegnare la tristezza aiuta il bambino a riconoscere quando gli altri hanno bisogno di supporto."
                    />
                    <EmotionCard
                        emozione="Rabbia"
                        emoji="😠"
                        colore="red"
                        descrizione="Si riconosce da sopracciglia abbassate e ravvicinate, mascella tesa e bocca chiusa o aperta con denti stretti. È spesso legata a situazioni di frustrazione. Riconoscerla negli altri aiuta il bambino a navigare conflitti e tensioni sociali."
                    />
                    <EmotionCard
                        emozione="Paura"
                        emoji="😨"
                        colore="purple"
                        descrizione="Occhi spalancati, sopracciglia alzate e bocca aperta. Appare in risposta a pericoli percepiti o situazioni incerte. Riconoscere la paura è importante per capire le reazioni degli altri e per sviluppare empatia."
                    />
                    <EmotionCard
                        emozione="Sorpresa"
                        emoji="😲"
                        colore="orange"
                        descrizione="Simile alla paura ma di breve durata: sopracciglia alzate ad arco, bocca aperta, occhi spalancati. Di solito precede un'altra emozione (piacevole o spiacevole). Distinguerla dalla paura è un traguardo importante nel percorso di apprendimento."
                    />
                    <EmotionCard
                        emozione="Disgusto"
                        emoji="🤢"
                        colore="green"
                        descrizione="Naso arricciato, labbro superiore sollevato, occhi leggermente socchiusi. È tra le emozioni più complesse da riconoscere e viene generalmente introdotta nelle fasi avanzate del percorso, quando il bambino ha già acquisito le emozioni più semplici."
                    />
                </div>

                {/* Come funziona — 8 principi */}
                <Section emoji="🧩" title="Come impara il bambino con l'EmoGame?" color="violet">
                    <p className="text-gray-600 text-sm mb-5">
                        L'EmoGame segue 8 principi evidence-based per l'insegnamento delle emozioni ai bambini con autismo.
                        Ogni attività su <strong>Storie Amiche</strong> è progettata in linea con questi passaggi:
                    </p>
                    <Step
                        numero={1}
                        titolo="Attività adatte all'età di sviluppo"
                        descrizione="Le scene e le domande sono calibrate sul livello comunicativo del bambino — verbale, non verbale o con supporto AAC/PECS — e usano un linguaggio semplice e diretto."
                        nota="Anche i bambini non verbali possono partecipare: le domande possono essere risposte con immagini o strumenti aumentativi."
                    />
                    <Step
                        numero={2}
                        titolo="Un'emozione alla volta"
                        descrizione="Il gioco inizia da un'emozione sola (di solito la felicità) e ne aggiunge una nuova solo quando il bambino mostra sicurezza. Evitare di sovraccaricare è cruciale per un apprendimento efficace."
                    />
                    <Step
                        numero={3}
                        titolo="Immagini chiare e graduali"
                        descrizione="Si parte da espressioni semplificate ed esagerate (cartoon, emoji) e si procede verso volti reali di bambini. Le immagini mostrano solo il viso, per aiutare il bambino a focalizzarsi sugli elementi espressivi chiave."
                    />
                    <Step
                        numero={4}
                        titolo="Apprendimento basato sul gioco"
                        descrizione="Il formato di gioco attiva curiosità e motivazione. L'EmoGame usa domande interattive per trasformare il riconoscimento emotivo in un'esperienza divertente e coinvolgente."
                    />
                    <Step
                        numero={5}
                        titolo="Varietà di stimoli"
                        descrizione="Le scene variano per sfondo, personaggi e situazione. Praticare con stimoli diversi aiuta il bambino a generalizzare la competenza emotiva dalla storia alla vita reale."
                    />
                    <Step
                        numero={6}
                        titolo="Emozioni in contesto"
                        descrizione="Le immagini mostrano emozioni legate a situazioni concrete (una festa, un giocattolo rotto), aiutando il bambino a capire i trigger emotivi e a mettere le emozioni in relazione con gli eventi."
                        nota='Esempio: "Il bambino è triste perché ha perso il suo giocattolo preferito."'
                    />
                    <Step
                        numero={7}
                        titolo="Generalizzazione nella vita reale"
                        descrizione="Le scene delle storie rispecchiano situazioni quotidiane (scuola, famiglia, gioco) per trasferire la competenza emotiva all'ambiente naturale del bambino."
                    />
                    <Step
                        numero={8}
                        titolo="Dal linguaggio ricettivo a quello espressivo"
                        descrizione="Si parte dal riconoscimento passivo (il bambino indica l'emozione giusta) e si avanza verso la denominazione attiva (il bambino nomina l'emozione mostrata), praticando entrambe le modalità comunicative."
                    />
                </Section>

                {/* Come si crea un EmoGame */}
                <Section emoji="🖊️" title="Come si crea un EmoGame su Storie Amiche?" color="green">
                    <p className="text-gray-600 text-sm mb-5">
                        Segui questi passaggi per aggiungere l'EmoGame a una storia:
                    </p>
                    <Step
                        numero={1}
                        titolo="Crea o apri una Social Story"
                        descrizione="Vai su 'Nuovo EmoGame' e compila il titolo, la descrizione e le scene come faresti normalmente. Puoi anche abilitare l'EmoGame su una storia già esistente."
                    />
                    <Step
                        numero={2}
                        titolo="Attiva il modulo EmoGame"
                        descrizione="Nelle Opzioni Interattive, attiva il toggle '🎮 EmoGame'. In ogni scena comparirà una sezione dedicata alle domande sulle emozioni."
                        nota="Puoi attivarlo anche su storie già pubblicate, modificandole dalla tua libreria."
                    />
                    <Step
                        numero={3}
                        titolo="Configura le domande per ogni scena"
                        descrizione="Per ogni scena scegli: l'emozione da allenare, il tipo di domanda (ricettiva o espressiva), il livello di difficoltà e le opzioni di risposta tra cui il bambino potrà scegliere."
                    />
                    <Step
                        numero={4}
                        titolo="Pubblica e assegna la storia"
                        descrizione="Pubblica la storia e assegnala al profilo del bambino. Le risposte vengono registrate automaticamente durante la sessione di lettura."
                    />
                    <Step
                        numero={5}
                        titolo="Analizza i progressi"
                        descrizione="Nella sezione Analytics del terapista trovi i dati sull'EmoGame: emozioni riconosciute correttamente, errori frequenti, evoluzione nel tempo e confronto tra sessioni."
                    />
                </Section>

                {/* Cosa vede il terapista */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-200 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span> Cosa vede il terapista?
                    </h2>
                    <div className="space-y-3">
                        {[
                            { emoji: '📉', testo: 'Tasso di riconoscimento corretto per ciascuna delle 6 emozioni di base' },
                            { emoji: '📆', testo: 'Evoluzione nel tempo: come migliorano le risposte sessione dopo sessione' },
                            { emoji: '🔎', testo: 'Emozioni più difficili per il bambino, utili per personalizzare le storie successive' },
                            { emoji: '🔁', testo: 'Confronto tra linguaggio ricettivo ed espressivo per evidenziare le aree di intervento' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                                <span className="text-xl">{item.emoji}</span>
                                <span className="text-gray-700 text-sm">{item.testo}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regola d'oro */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white mb-8 shadow-lg">
                    <h2 className="text-xl font-black mb-2">✨ Il principio chiave</h2>
                    <p className="text-white/90 mb-2">
                        Inizia sempre da <strong>un'emozione alla volta</strong> — preferibilmente la felicità —
                        e aggiungi la successiva solo quando il bambino dimostra sicurezza.
                        Il ritmo del bambino è la guida.
                    </p>
                    <p className="text-white/80 text-sm">
                        Varia sempre i materiali: immagini diverse, scene diverse, contesti diversi.
                        La generalizzazione è l'obiettivo finale di ogni percorso.
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Pronto a creare il tuo primo EmoGame?</p>
                    <button
                        onClick={() => navigate('/newEmoGame')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform text-lg"
                    >
                        🎮 Crea un EmoGame
                    </button>
                    <button
                        onClick={() => navigate('/guide/social-stories')}
                        className="ml-4 bg-white text-purple-600 border-2 border-purple-300 font-bold px-6 py-4 rounded-full hover:bg-purple-50 transition-colors"
                    >
                        📖 Scopri le Social Stories →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmoGameGuide;