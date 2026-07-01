import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar';
import { Helmet } from "react-helmet-async";

/**
 * @page
 * PAGINA: GUIDA ALLE STRANGE STORIES
 * Spiega cosa sono, a cosa servono e come funziona il test delle Strange Stories
 * integrato nelle Social Stories del sito.
 */

const InfoCard = ({ emoji, titolo, testo, color = 'orange' }) => {
    const colors = {
        orange: 'from-orange-50 to-amber-100 border-orange-200',
        teal: 'from-teal-50 to-cyan-100 border-teal-200',
        pink: 'from-pink-50 to-rose-100 border-pink-200',
        blue: 'from-blue-50 to-sky-100 border-blue-200',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex gap-4 items-start shadow-sm`}>
            <span className="text-3xl flex-shrink-0">{emoji}</span>
            <div>
                <h3 className="font-bold text-gray-800 mb-1">{titolo}</h3>
                <p className="text-gray-600 text-sm">{testo}</p>
            </div>
        </div>
    );
};

const ScenarioCard = ({ tipo, descrizione, esempio, bambino, adulto }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-2 border-orange-100 rounded-2xl overflow-hidden mb-4 shadow-sm">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-orange-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{tipo === 'Bugia Bianca' ? '😊' : tipo === 'Ironia' ? '🙃' : tipo === 'Finzione' ? '🎭' : tipo === 'Malinteso' ? '🤔' : '💭'}</span>
                    <span className="font-bold text-gray-800">{tipo}</span>
                </div>
                <span className="text-orange-400 text-lg">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="bg-orange-50 px-5 pb-5 pt-3 border-t border-orange-100">
                    <p className="text-gray-700 text-sm mb-3">{descrizione}</p>
                    <div className="bg-white rounded-xl p-4 border border-orange-200 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">📌 Esempio di scena:</p>
                        <p className="italic text-gray-600 mb-3">"{esempio}"</p>
                        {bambino && (
                            <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Possibili domande al bambino:</p>
                                <p className="text-orange-700 text-sm">• {bambino}</p>
                                {adulto && <p className="text-orange-700 text-sm">• {adulto}</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StepStrange = ({ numero, titolo, descrizione, nota }) => (
    <div className="flex gap-4 mb-5">
        <div className="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg shadow">
            {numero}
        </div>
        <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1">{titolo}</h3>
            <p className="text-gray-600 text-sm">{descrizione}</p>
            {nota && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800 italic">
                    💡 {nota}
                </div>
            )}
        </div>
    </div>
);

const StrangeStoryGuide = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
            <Navbar />
            <Helmet>
                <title>Storie Amiche — Strange Stories Guide</title>
                <meta name="description" content="Come usare le Strange Stories per sviluppare la Teoria della Mente nei bambini." />
            </Helmet>

            <div className="max-w-3xl mx-auto px-4 py-10">

                {/* Hero */}
                <div className="text-center mb-10">
                    <span className="text-6xl mb-4 block">🧠</span>
                    <h1 className="text-4xl font-black text-orange-700 mb-3">Le Strange Stories</h1>
                    <p className="text-gray-600 text-lg max-w-xl mx-auto">
                        Un test clinico trasformato in gioco: allena la <strong>Teoria della Mente</strong> dei bambini con autismo,
                        integrando domande nelle Social Stories.
                    </p>
                </div>

                {/* Cosa sono */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🔍</span> Cosa sono le Strange Stories?
                    </h2>
                    <p className="text-gray-700 mb-3">
                        Le <strong>Strange Stories</strong> sono brevi racconti con un finale inatteso, ideate da Francesca Happé nel 1994
                        come strumento di valutazione della <strong>Teoria della Mente (ToM)</strong> nei bambini con autismo.
                    </p>
                    <p className="text-gray-700 mb-3">
                        A differenza dei classici test "Falsa Credenza" (come il test di Sally e Anne), le Strange Stories presentano
                        situazioni più complesse e vicine alla vita reale, in cui i personaggi dicono cose
                        <em> non letteralmente vere</em> per ragioni socialmente comprensibili: bugie bianche, ironia, finzione, ecc.
                    </p>
                    <p className="text-gray-700">
                        Su <strong>Storie Amiche</strong>, le Strange Stories vengono integrate direttamente nelle Social Stories:
                        al termine di ogni scena, il bambino risponde a una domanda di comprensione sociale, e il terapista
                        può analizzare le risposte in modo approfondito.
                    </p>
                </div>

                {/* Teoria della mente box */}
                <div className="bg-white border-l-4 border-orange-400 rounded-r-2xl px-5 py-4 mb-6 shadow-sm">
                    <h3 className="font-bold text-orange-700 mb-1">💡 Cos'è la Teoria della Mente?</h3>
                    <p className="text-gray-700 text-sm">
                        La Teoria della Mente è la capacità di attribuire a se stessi e agli altri stati mentali
                        (pensieri, desideri, credenze, intenzioni) e di capire che questi possono differire dalla realtà.
                        È essenziale per comprendere il comportamento altrui e per comunicare in modo efficace.
                        Nei bambini con autismo, questo processo è spesso più difficile da sviluppare.
                    </p>
                </div>

                {/* A cosa servono */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎯</span> A cosa servono su Storie Amiche?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { emoji: '📊', titolo: 'Valutazione', testo: 'Misurano il livello di comprensione sociale e ToM del bambino nel tempo.' },
                            { emoji: '🧩', titolo: 'Allenamento', testo: 'Stimolano la riflessione sulle intenzioni e le emozioni dei personaggi.' },
                            { emoji: '📈', titolo: 'Monitoraggio', testo: 'Il terapista può tracciare i progressi sessione dopo sessione con grafici dettagliati.' },
                            { emoji: '🤝', titolo: 'Integrazione', testo: 'Le domande sono contestualizzate nella storia, rendendo il test più naturale e meno intimidatorio.' },
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

                {/* Tipi di storie */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="text-2xl">🎭</span> Tipi di situazioni nelle Strange Stories
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Happé ha identificato diverse categorie di situazioni sociali "non letterali". Clicca per espandere:
                    </p>
                    <ScenarioCard
                        tipo="Bugia Bianca"
                        descrizione="Un personaggio dice qualcosa di falso per non ferire i sentimenti dell'altro. Il bambino deve capire che la bugia era intenzionale ma gentile."
                        esempio="La nonna mostra a Marco il suo disegno. Marco non lo trova bello, ma dice: 'Che bel disegno, nonna!'"
                        bambino="Marco ha detto la verità? Perché l'ha detto?"
                    />
                    <ScenarioCard
                        tipo="Ironia / Sarcasmo"
                        descrizione="Un personaggio dice l'opposto di ciò che pensa, spesso con tono scherzoso o critico. Richiede di capire il contrasto tra parole e intenzione."
                        esempio="Inizia a piovere forte proprio mentre Lucia è in bicicletta. La mamma ride e dice: 'Che giornata meravigliosa!'"
                        bambino="La mamma pensa davvero che sia una bella giornata? Perché l'ha detto?"
                    />
                    <ScenarioCard
                        tipo="Finzione / Gioco di Ruolo"
                        descrizione="Un personaggio dice qualcosa che sa essere falso nell'ambito di un gioco o racconto immaginario."
                        esempio="Luca e Sara giocano ai pirati. Sara grida: 'Sono la regina dei mari!'"
                        bambino="Sara è davvero una regina? Perché lo ha detto?"
                    />
                    <ScenarioCard
                        tipo="Malinteso"
                        descrizione="Un personaggio crede qualcosa di falso a causa di informazioni incomplete, non per ingannare."
                        esempio="Il papà prepara la torta al cioccolato credendo che a Sofia piaccia, ma Sofia adesso preferisce la fragola."
                        bambino="Cosa pensa il papà? È vero?"
                    />
                    <ScenarioCard
                        tipo="Persuasione / Inganno"
                        descrizione="Un personaggio cerca deliberatamente di far credere all'altro qualcosa di falso per un proprio vantaggio."
                        esempio="Giulia vuole il biscotto di Tommaso. Dice: 'Guarda, c'è un cane fuori!' Mentre Tommaso guarda, lei prende il biscotto."
                        bambino="Giulia ha detto la verità? Perché lo ha fatto?"
                    />
                </div>

                {/* Come si crea */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <span className="text-2xl">🖊️</span> Come si aggiunge una Strange Story su Storie Amiche?
                    </h2>
                    <StepStrange
                        numero={1}
                        titolo="Crea o modifica una Social Story"
                        descrizione="Vai su 'Nuova Storia' e compila il titolo, la descrizione e le scene come faresti normalmente."
                    />
                    <StepStrange
                        numero={2}
                        titolo="Attiva il modulo Strange Stories"
                        descrizione="Nelle Opzioni Interattive, attiva il toggle '🧠 Strange Stories Test'. Comparirà una sezione dedicata in ogni scena."
                        nota="Puoi attivarlo anche su storie già esistenti modificandole."
                    />
                    <StepStrange
                        numero={3}
                        titolo="Aggiungi la situazione ad ogni scena"
                        descrizione="Per ogni scena che vuoi testare, inserisci: il tipo di situazione (bugia bianca, ironia, ecc.), la domanda da porre al bambino e la risposta attesa (aperta o con opzioni)."
                    />
                    <StepStrange
                        numero={4}
                        titolo="Pubblica e assegna la storia"
                        descrizione="Pubblica la storia e assegnala al profilo del bambino. Le risposte verranno raccolte automaticamente durante la lettura."
                    />
                    <StepStrange
                        numero={5}
                        titolo="Analizza i risultati"
                        descrizione="Nella sezione Analytics del terapista, trovi i grafici delle risposte alle Strange Stories: punteggi per tipo, progressi nel tempo e confronto tra scene."
                    />
                </div>

                {/* Cosa analizza il terapista */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span> Cosa vede il terapista?
                    </h2>
                    <div className="space-y-3">
                        {[
                            { emoji: '📉', testo: 'Punteggi di comprensione per ogni tipo di scenario (bugia bianca, ironia, ecc.)' },
                            { emoji: '📆', testo: 'Evoluzione nel tempo: come cambiano le risposte sessione dopo sessione' },
                            { emoji: '🔎', testo: 'Analisi dettagliata delle risposte testuali del bambino' },
                            { emoji: '🧩', testo: 'Identificazione delle categorie più difficili per personalizzare il percorso' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                                <span className="text-xl">{item.emoji}</span>
                                <span className="text-gray-700 text-sm">{item.testo}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Pronto ad aggiungere le Strange Stories alle tue storie?</p>
                    <button
                        onClick={() => navigate('/newStory')}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform text-lg mr-4"
                    >
                        🧠 Crea una storia con Strange Stories
                    </button>
                    <button
                        onClick={() => navigate('/guide/social-stories')}
                        className="bg-white text-purple-600 border-2 border-purple-300 font-bold px-6 py-4 rounded-full hover:bg-purple-50 transition-colors"
                    >
                        ← Torna alle Social Stories
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StrangeStoryGuide;