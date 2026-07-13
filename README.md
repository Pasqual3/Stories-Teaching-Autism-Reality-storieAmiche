# Storie Amiche 🌈
> **Piattaforma Web per Interventi Terapeutici a Supporto di Bambini con Disturbo dello Spettro Autistico (DSA)**
> *Progettata per terapisti, educatori e genitori: consente la creazione e l'assegnazione di storie sociali personalizzate e giochi educativi, mentre il sistema raccoglie silenziosamente metriche comportamentali e calcola un indice di stress clinico per ogni sessione.*
---

## Indice

1. [Visione del Progetto](#1-visione-del-progetto)
2. [Architettura del Sistema](#2-architettura-del-sistema)
3. [Pilastri Tecnici di Sicurezza: Zero Trust](#3-pilastri-tecnici-di-sicurezza-zero-trust)
4. [Microservizi](#4-microservizi)
5. [Funzionalità Principali](#5-funzionalità-principali)
6. [Stack Tecnologico](#6-stack-tecnologico)
7. [Pipeline CI/CD](#7-pipeline-cicd)
8. [Sicurezza](#8-sicurezza)
9. [Prerequisiti](#9-prerequisiti)
10. [Deployment](#10-deployment)
11. [Variabili d'Ambiente](#11-variabili-dambiente)
12. [Documentazione API](#12-documentazione-api)
13. [Contribuire al Progetto](#13-contribuire-al-progetto)

---

## 1. Visione del Progetto

**Storie Amiche** è una piattaforma web terapeutica progettata per supportare bambini con Disturbo dello Spettro Autistico attraverso storie sociali interattive e giochi educativi mirati. Il sistema non si limita a presentare contenuti: raccoglie in background dati comportamentali granulari (clic, esitazioni, inversioni di pagina) per calcolare un **indice di stress clinico** per ogni sessione, fornendo ai terapisti uno strumento di analisi longitudinale basato su dati oggettivi.

L'architettura è stata progettata secondo il principio **Security by Design**, isolando ogni responsabilità in un microservizio dedicato e garantendo che i dati clinici sensibili riguardanti i minori siano accessibili esclusivamente agli operatori autorizzati.

---

## 2. Architettura del Sistema

Il sistema è costruito come **architettura a microservizi** orchestrata con Docker Compose. Un unico **API Gateway** costituisce il solo punto d'ingresso pubblico: tutti gli altri servizi sono isolati nella rete interna Docker e non sono mai raggiungibili direttamente dall'esterno.

```
Browser
  └── Client (React 18 / Vite)  :80
        └── API Gateway (Express 4)  :4000
              ├── /api/auth      → Auth Service      :5009
              ├── /api/analytics → Analytics Service :5007
              ├── /api/ai        → AI Service        :5001
              ├── /api/user      → (logica interna gateway)
              ├── /api/story     → (logica interna gateway)
              └── /api/approval  → (logica interna gateway)

Servizi di supporto (solo rete interna):
  ├── Storage Service    :5006  →  Cloudinary CDN
  ├── Email Service      :5008  →  SMTP
  └── Monitoring Service :5005  →  MongoDB (raccolta log)

Database: MongoDB 7.0  :27017
```

<p align="center">
<img width="700" height="806" alt="storie_amiche_architettura_v2(1)" src="https://github.com/user-attachments/assets/56372ab1-2747-40ac-be4d-4b8a8996640d" />
</p>

### 2.2 Albero Directory del Progetto

L'organizzazione del codice sorgente rispetta il principio di **Separazione delle Responsabilità**. La struttura è modulare e separa nettamente il codice applicativo dai servizi di supporto e dalla configurazione infrastrutturale, facilitando la manutenibilità e la sicurezza del deployment.

```
storie-amiche/
├── 📂 client/                        # [FRONTEND] React 18 SPA servita da Nginx
│   ├── src/
│   │   ├── pages/                    # Viste principali (Home, Story, Dashboard)
│   │   ├── components/               # Componenti riutilizzabili
│   │   ├── context/                  # React Context (AuthContext, ChildContext)
│   │   └── utils/
│   │       └── storyCache.js         # Cache custom per ridurre chiamate API
│   ├── public/                       # Asset statici
│   ├── nginx.conf                    # Configurazione Nginx per produzione
│   └── package.json                  # Dipendenze Node.js
│
├── 📂 server/                        # [API GATEWAY] Express 4 — porta 4000
│   ├── routes/                       # Route: story, user, approval, ai
│   ├── middleware/                   # Auth JWT, rate limiter, sanitize
│   ├── controllers/                  # Business logic CRUD storie e utenti
│   └── swagger/                      # Definizioni Swagger UI
│
├── 📂 auth-service/                  # [AUTH] Identità e sessioni — porta 5009
│   ├── controllers/                  # Register, login, OTP, reset password
│   ├── models/                       # Schema utente MongoDB
│   └── utils/                        # Generazione OTP, invio email
│
├── 📂 analytics-service/             # [ANALYTICS] Dati comportamentali — porta 5007
│   ├── controllers/                  # Sessioni, baseline, Strange Stories
│   ├── models/                       # Session, GameSession, Baseline, Note
│   └── utils/
│       └── stressIndex.js            # Algoritmo indice di stress (Baseline Deviation)
│
├── 📂 ai-service/                    # [AI/TTS] Sintesi vocale ElevenLabs — porta 5001
│   ├── app.py                        # Flask app, job queue, polling endpoint
│   ├── elevenlabs_client.py          # Wrapper API ElevenLabs
│   ├── keys.json                     # ⚠️ Chiavi API (NON committare)
│   └── requirements.txt              # Dipendenze Python
│
├── 📂 storage-service/               # [STORAGE] Cloudinary CDN — porta 5006
│   ├── controllers/                  # Upload, upload-base64, delete
│   └── utils/                        # Cloudinary SDK wrapper
│
├── 📂 email-service/                 # [EMAIL] SMTP transazionale — porta 5008
│   ├── controllers/                  # Endpoint POST /send
│   └── templates/                    # Template HTML email (benvenuto, OTP)
│
├── 📂 monitoring-service/            # [LOG] Raccolta log centralizzata — porta 5005
│   ├── controllers/                  # POST /log, GET /logs
│   └── models/                       # Schema log MongoDB
│
├── 📄 docker-compose.yml             # Orchestrazione sviluppo locale
├── 📄 docker-compose-server.yml      # Orchestrazione produzione (porta DB non esposta)
├── 📄 .env.example                   # Template variabili d'ambiente
└── 📄 .github/workflows/
    └── docker-publish.yml            # Pipeline CI/CD GitHub Actions → GHCR
```

---

## 3. Pilastri Tecnici di Sicurezza: Zero Trust

Il sistema assume che la rete sia "ostile" e protegge i dati e le risorse a livello applicativo, invece di affidarsi solo al firewall perimetrale. Di seguito i principi che rendono **Zero Trust** Storie Amiche:

### 3.1 "Never Trust, Always Verify" (Verifica Continua)

Il Backend **non si fida implicitamente** del Frontend o della rete locale. Ogni singola richiesta HTTP verso le API viene intercettata dal middleware di autenticazione e validata crittograficamente. Se il token JWT non è valido, non è firmato correttamente o è scaduto, la richiesta viene respinta istantaneamente con `401 Unauthorized` o `403 Forbidden`, anche se proviene dall'interno della rete Docker protetta.

### 3.2 Principio del Privilegio Minimo (Least Privilege)

È stato implementato un controllo degli accessi granulare basato su ruoli:

- **Isolamento per ruolo:** un utente `adulto` non può accedere alle route `/api/analytics` riservate ai terapisti; un profilo `bambino` accede solo alla modalità lettura delle storie assegnate.
- **Isolamento per paziente:** un terapista può accedere esclusivamente ai dati dei bambini esplicitamente assegnati dai genitori. Il tentativo di accedere a dati di un bambino non assegnato viene bloccato con `403 Forbidden`.

### 3.3 Micro-Segmentazione e Compartimentazione

L'identità è gestita centralmente dall'Auth Service. Non esistono "utenti anonimi" o credenziali hardcoded nel codice che possano bypassare i controlli. I servizi di supporto (MongoDB, Storage, Email) sono isolati nella rete interna Docker e non espongono porte verso l'esterno, riducendo la superficie d'attacco laterale.

### 3.4 Protezione dei Dati (Data Protection)

- **In transito:** tutto il traffico tra client e Gateway è forzato su HTTPS. Le comunicazioni inter-servizio avvengono esclusivamente sulla rete interna Docker, non esposta a Internet.
- **A riposo:** i dati clinici sensibili (sessioni comportamentali, note del diario terapista) vengono cifrati con **AES-256-CBC** prima della persistenza su MongoDB. Nemmeno un accesso diretto al database consente la lettura del contenuto senza la chiave di decifratura gestita applicativamente.

---

## 4. Microservizi

### Client — `./client` · porta 80

Una **Single Page Application React 18 + Vite** servita in produzione da Nginx. Espone tre interfacce distinte in base al ruolo dell'utente:

- **Genitore / utente standard** — sfoglia le storie pubbliche, crea e modifica le proprie storie, gestisce i sotto-profili bambino (stile Netflix) e assegna storie ai figli.
- **Modalità bambino** — interfaccia semplificata e ottimizzata per il tocco, attivabile con PIN opzionale. Le storie vengono visualizzate a schermo intero con narrazione audio. Tutte le interazioni (clic, tempo di esitazione, inversioni di pagina) vengono tracciate in background.
- **Terapista** — accede alla dashboard clinica con cronologia delle sessioni per bambino, andamento dell'indice di stress, performance nei giochi e diario clinico privato.

Il client comunica esclusivamente con l'API Gateway. Un modulo `storyCache.js` implementa una strategia di caching custom per ridurre le chiamate ridondanti sulla home page.

---

### API Gateway — `./server` · porta 4000

Un servizio **Node.js 18 / Express 4** che funge da unico punto d'ingresso per tutte le richieste client. Le sue responsabilità sono:

- **Reverse proxy** — instrada `/api/auth` verso Auth Service e `/api/analytics` verso Analytics Service tramite `http-proxy-middleware`, iniettando l'header `x-internal-api-key` sulle chiamate analytics per l'autenticazione inter-servizio.
- **Business logic** — gestisce direttamente le operazioni CRUD sulle storie, i workflow di approvazione, l'orchestrazione degli upload multimediali, la gestione dei job di generazione audio AI e la gestione di utenti e bambini.
- **Middleware di sicurezza** — applica `helmet`, `express-mongo-sanitize`, validazione JWT via cookie e rate limiting differenziato (generale: 200 req/15 min · autenticazione: 40 req/10 min · generazione audio: 15 req/ora).
- **Swagger UI** — espone la documentazione interattiva delle API su `/api-docs`.

Il gateway coordina il flusso asincrono di generazione audio: avvia un job sull'AI Service, restituisce immediatamente un `jobId` al client, che esegue polling su `/api/story/audio-status/:jobId` fino a completamento. Questo pattern evita i timeout HTTP su operazioni TTS di lunga durata.

---

### Auth Service — `./auth-service` · porta 5009

Un microservizio **Node.js / Express** dedicato esclusivamente alla gestione delle identità:

- **Registrazione** — hashing delle password con `bcryptjs` (10 round), creazione del documento utente e invio email di benvenuto tramite Email Service.
- **Login** — validazione delle credenziali ed emissione di un **JWT** firmato, conservato come cookie `httpOnly`, `secure`, `sameSite` con scadenza a 7 giorni. Il cookie non è mai accessibile da JavaScript.
- **Verifica email** — generazione di un OTP a tempo limitato inviato all'inbox dell'utente; l'account viene contrassegnato `isAccountVerified: true` dopo la conferma.
- **Reset password** — flusso OTP: richiesta → ricezione OTP via email → invio nuova password.
- **Eliminazione account** — anch'essa protetta da OTP per prevenire eliminazioni accidentali o non autorizzate.

Il servizio mantiene una propria connessione MongoDB e un proprio rate limiter, separati dal gateway.

---

### Analytics Service — `./analytics-service` · porta 5007

Un microservizio **Node.js / Express** che riceve, conserva ed elabora tutti i dati comportamentali di sessione. È protetto dall'header `x-internal-api-key` iniettato esclusivamente dal Gateway: le chiamate dirette dal client vengono rifiutate.

**Metriche tracciate per sessione:**

| Metrica | Descrizione |
|---|---|
| `totalClicks` | Numero totale di interazioni |
| `totalMissClicks` | Clic fuori dagli elementi interattivi |
| `totalRageClicks` | Clic rapidi e ripetuti sullo stesso elemento |
| `totalPageReversals` | Numero di volte in cui il bambino ha navigato all'indietro |
| `avgHesitationTime` | Pausa media prima di ogni interazione |
| `completionRate` | Percentuale della storia completata |
| `slideData` | Breakdown per diapositiva di tutte le metriche sopra |

**Algoritmo dell'Indice di Stress** — calcolato a fine sessione con un modello a *Deviazione dalla Baseline*:

- **Senza baseline** (meno di 3 sessioni di calibrazione): utilizza soglie assolute su rage-click ratio, miss-click ratio e inversioni di pagina per produrre un punteggio 0–100.
- **Con baseline**: calcola la deviazione percentuale dalle medie personali del bambino per clic-per-diapositiva e tempo-per-diapositiva, aggiungendo fattori ponderati per rage-click e inversioni. Il risultato si mappa su quattro livelli: `calmo` · `lieve` · `moderato` · `alto`.

Il servizio gestisce anche le risposte al test **Strange Stories** (valutazione della Teoria della Mente) e gli endpoint di analytics per i terapisti, che aggregano i dati di sessione tra tutti i bambini assegnati.

---

### AI Service — `./ai-service` · porta 5001

Un microservizio **Python 3.10+ / Flask** che delega la sintesi vocale in lingua italiana alle API cloud di **ElevenLabs**. Questo approccio elimina il peso di un modello locale e garantisce una qualità audio di livello professionale senza dipendenze da GPU o librerie di deep learning pesanti nel container.

**Flusso asincrono di generazione audio:**

1. Il Gateway invia una `POST /generate-audio` con i testi delle scene, le etichette emozionali per scena, la voce selezionata e il parametro di velocità.
2. Il servizio inserisce il job in una coda in-memory e restituisce immediatamente un `jobId` (nessun rischio di timeout).
3. Per ogni scena, il servizio invoca l'API ElevenLabs con il testo e i parametri vocali appropriati, applicando facoltativamente aggiustamenti in base all'etichetta emozionale (es. ritmo più lento per scene `triste`).
4. Il Gateway esegue polling su `GET /audio-status/:jobId` ogni 8 secondi. La risposta include i contatori di avanzamento `scene_done` / `scene_total` visualizzati in tempo reale nell'UI.
5. Quando lo stato è `done`, il Gateway recupera i buffer audio restituiti da ElevenLabs, li carica su Cloudinary tramite Storage Service e salva i risultanti URL nel documento della storia.

In caso di riavvio del server durante la generazione, il job in-memory viene perso: il Gateway rileva lo stato `not_found` e ripristina automaticamente la storia in `DRAFT`. La lista delle voci disponibili è servita da `GET /voices` e rispecchia le voci configurate sull'account ElevenLabs.

> **Configurazione chiavi API:** il microservizio richiede un file `keys.json` nella root di `./ai-service` contenente le credenziali ElevenLabs. Questo file **non deve mai essere committato** nel repository. Crearlo manualmente prima di avviare il servizio:
>
> ```json
> {
>   "ELEVENLABS_API_KEY": "la_tua_api_key_elevenlabs"
> }
> ```
>
> Il servizio carica `keys.json` all'avvio e inietta la chiave nelle chiamate HTTP verso l'API ElevenLabs. In assenza del file, il servizio si avvia ma tutte le richieste di generazione audio falliscono con errore di autenticazione.

---

### Storage Service — `./storage-service` · porta 5006

Un microservizio **Node.js / Express** che centralizza tutte le operazioni su file verso **Cloudinary**. Né il Gateway né nessun altro servizio possiede credenziali Cloudinary — sono conservate esclusivamente in questo servizio.

**Endpoint:**

- `POST /upload` — riceve un file `multipart/form-data` (immagine, video o audio, max 50 MB), lo carica dalla RAM (senza mai toccare disco) sulla cartella Cloudinary specificata e restituisce `secure_url` e `publicId`.
- `POST /upload-base64` — riceve un buffer audio in base64 (usato dal flusso AI Service) e lo carica come risorsa Cloudinary `video`.
- `DELETE /delete` — estrae il `public_id` da un URL Cloudinary ed elimina definitivamente l'asset.

Il servizio utilizza `multer` con `memoryStorage()` così i file vengono elaborati interamente in RAM e non vengono mai scritti sul filesystem del container.

---

### Email Service — `./email-service` · porta 5008

Un microservizio **Node.js / Express** che gestisce tutta la posta elettronica transazionale tramite **Nodemailer** e un provider SMTP configurabile (default Gmail con App Password).

Espone un unico endpoint `POST /send` che accetta indirizzo destinatario, oggetto e corpo in testo semplice o template HTML personalizzato. L'Auth Service chiama questo endpoint per le email di benvenuto, la consegna OTP e le notifiche di reset password.

Isolare l'invio email in un servizio dedicato significa che le credenziali SMTP sono compartimentate, e la logica di invio può essere aggiornata o sostituita (es. da Gmail a SendGrid) senza toccare nessun altro servizio.

---

### Monitoring Service — `./monitoring-service` · porta 5005

Un microservizio **Node.js / Express** che funge da raccoglitore centralizzato di log. Tutti gli altri servizi inviano qui le voci di log strutturate via HTTP invece di scrivere solo su file o stdout.

Ogni voce di log è conservata in MongoDB con lo schema: `timestamp`, `level` (`info` · `warn` · `error` · `debug`), `service` (nome del microservizio originante), `message` e un oggetto `metadata` opzionale.

**Endpoint:**

- `POST /log` — riceve e persiste una voce di log.
- `GET /logs?level=error` — restituisce le 100 voci più recenti, filtrabili per livello.
- `GET /health` — health check standard.

Il servizio fa eco di ogni voce sullo stdout di Docker con un prefisso emoji colorato (`🔵` info · `🟡` warn · `🔴` error), rendendo `docker compose logs monitoring-service` immediatamente leggibile durante il debug.

---

### MongoDB — porta 27017

Un'istanza **MongoDB 7.0** con volume Docker nominato (`mongodb_data`) per la persistenza dei dati tra i riavvii dei container. La porta non è esposta all'host nel `docker-compose-server.yml` di produzione: l'accesso è limitato esclusivamente alla rete interna Docker.

**Collezioni principali:**

| Collezione | Servizio | Descrizione |
|---|---|---|
| `users` | Gateway + Auth | Account utenti, sotto-profili bambino, info terapista |
| `stories` | Gateway | Documenti storia con array scene, URL audio, stato |
| `sessions` | Analytics | Dati comportamentali per sessione e indice di stress (cifrati AES-256-CBC) |
| `gamesessions` | Analytics | Tracking mossa per mossa per ogni gioco |
| `baselines` | Analytics | Medie di calibrazione personali per il modello di stress |
| `notes` | Analytics | Voci del diario clinico del terapista (cifrate AES-256-CBC) |
| `strangestoryresponses` | Analytics | Risposte al test Strange Stories |
| `logs` | Monitoring | Voci di log dell'applicazione |
| `emogames` | Gateway | Documenti EmoGame: scene, emozione target, livello di difficoltà e sessioni di gioco |
| `strangestoryresponses` (`gameType: emoGame`) | Analytics | Risposte e tentativi registrati durante le partite EmoGame |

---

### EmoGame — Estensione Multi-Servizio

L'**EmoGame** non introduce un nuovo microservizio: è una funzionalità trasversale che riutilizza l'infrastruttura esistente estendendone tre livelli, nel rispetto del principio di isolamento dei servizi.

- **API Gateway** (`./server`) — nuovo modello `emoGameModel`, rotte `/api/emoGame` e controller dedicati per creazione, modifica, eliminazione, assegnazione, salvataggio della sessione di gioco e recupero delle sessioni.
- **Analytics Service** (`./analytics-service`) — controller `emoGameAnalyticsController` e discriminante `gameType` per separare le risposte EmoGame dalle Strange Stories classiche, con calcolo aggregato di KPI clinici e matrice di confusione.
- **Client** (`./client`) — feature `emoGame` (editor `newEmoGame`, riproduttore `viewEmoGame`) e dashboard `EmoGameAnalytics` per il terapista.

Il dettaglio funzionale e clinico è descritto nella sezione [5.1 EmoGame](#51-emogame--riconoscimento-emotivo-multilivello).

---

## 5. Funzionalità Principali

- **Editor Storie Sociali** — costruttore di storie multi-diapositiva con testo ricco, upload immagini/video, temi cromatici per scena, tag emozionali, embedding del test Strange Stories e narrazione TTS generata da AI con tracking del progresso in tempo reale.
- **Modalità bambino** — sotto-profili protetti da PIN con selezione avatar; lettore di storie a schermo intero con riproduzione audio sincronizzata e tracciamento comportamentale in background, invisibile al bambino.
- **Dashboard Terapista** — vista di analisi clinica con linea temporale dell'indice di stress, panoramica comportamentale, analisi del coinvolgimento per storia, metriche di performance nei giochi, risultati Strange Stories, analisi della heatmap dei clic e diario clinico privato con CRUD note.
- **Giochi Terapeutici** — *Gioco di Sequenziamento* (riordinare le scene della storia nell'ordine corretto) e *Gioco di Abbinamento Emozionale* (abbinare scene alle etichette emozionali); entrambi registrano dati granulari mossa per mossa inviati all'Analytics Service.
- **Workflow di Approvazione** — le storie inviate per la pubblicazione passano attraverso una coda di revisione; i terapisti possono accettare, rifiutare (con motivazione) o richiedere modifiche prima che una storia diventi visibile pubblicamente.
- **Controllo degli Accessi Basato su Ruoli** — tre ruoli (`adulto` / `terapeuta` / `bambino`) con protezione a livello di route sia nel frontend che nel backend; i terapisti possono accedere solo ai dati dei pazienti esplicitamente assegnati loro dai genitori.
- **EmoGame — Riconoscimento Emotivo Multilivello** — modalità di gioco dedicata alla decodifica delle espressioni facciali, articolata su tre livelli di astrazione crescente (emoji → fotografie reali → video dinamici). Ogni partita traccia latenze di risposta, ordine dei tentativi e tasso di abbandono, alimentando una dashboard clinica con **matrice di confusione** delle emozioni.

---

### 5.1 EmoGame — Riconoscimento Emotivo Multilivello *

L'**EmoGame** estende le Storie Sociali con un percorso strutturato di allenamento al riconoscimento delle emozioni, pensato per misurare in modo oggettivo la competenza socio-cognitiva del bambino e la sua capacità di generalizzazione dallo stimolo reale.

**Tre livelli di difficoltà** — ogni gioco è etichettato con un livello che ne determina il tipo di stimolo visivo:

| Livello | Stimolo | Obiettivo clinico |
|---|---|---|
| **`DifI`** | Emoji stilizzate | Riconoscimento di espressioni iconiche e schematiche |
| **`DifII`** | Fotografie di volti reali | Generalizzazione del riconoscimento su persone reali |
| **`DifIII`** | Video dinamici | Decodifica di micro-espressioni e indizi di contesto in movimento |

**Modello dati** — il modello `EmoGame` deriva da quello delle storie e aggiunge: il campo `difficulty` (`DifI` / `DifII` / `DifIII`), il campo `emotion` (emozione target di scena), la configurazione `strangeStoryTest` abilitata di default su ogni scena (con opzioni testo / emoji / immagine, punteggi e spiegazioni personalizzate) e l'array `emotionGameSessions`, che archivia il riepilogo di fine partita per ogni bambino (`score`, `total`, `completed`, risultati). Le risposte confluiscono nella collezione delle Strange Stories con un discriminante `gameType` (`story` | `emoGame`), preservando la separazione logica delle statistiche.

**Editor e riproduttore (Client)** — l'interfaccia autoriale (`features/emoGame/pages/newEmoGame`) consente a terapisti e genitori di comporre un EmoGame definendo, per ogni scena, l'emozione target, gli stimoli e le opzioni di risposta. Il riproduttore (`viewEmoGame.jsx`) ospita il motore interattivo: sincronizzazione *karaoke* del testo con l'audio TTS, calcolo della **latenza alla prima scelta**, tracciamento dell'ordine esatto dei tentativi, registrazione degli stati finali (`[Completato]` / `[Abbandonato]`) e blocco dell'invio in modalità anteprima per non inquinare i dati clinici.

**Dashboard clinica EmoGame (Terapista)** — un pannello dedicato (`features/therapist/sections/EmoGameAnalytics.jsx`) aggrega le risposte grezze in indicatori e grafici:

- **KPI clinici** — Accuratezza Globale (% di risposte corrette al primo clic), Esitazione Media, **Indice di Impulsività** (% di errori forniti in meno di 2.5 s), Tasso di Abbandono ed Emozione più Critica.
- **Grafici (Recharts)** — riconoscimento per emozione, tempo di elaborazione per emozione, **Curva di Apprendimento Clinico** (trend di accuratezza ed esitazione sulle ultime 10 sessioni, con doppio asse Y) e prestazioni per livello di difficoltà, per valutare la capacità di generalizzazione.
- **Matrice di Confusione Dinamica** — heatmap che incrocia l'emozione target (righe) con quella selezionata dal bambino (colonne): la diagonale verde evidenzia i successi, le celle rosse fuori diagonale gli scambi percettivi sistematici (es. *Paura* confusa con *Sorpresa*), isolando i bias cognitivi su cui orientare l'intervento.

---

## 6. Stack Tecnologico

| Layer | Tecnologia | Versione |
|---|---|---|
| **Frontend** | React | 18.3 |
| | Vite | 5.x |
| | Tailwind CSS | 3.x |
| | React Router | v6 |
| | react-helmet-async | 2.x |
| **API Gateway** | Node.js | 18+ |
| | Express | 4.x |
| | Mongoose | 8.x |
| | Multer | 1.x |
| | http-proxy-middleware | 3.x |
| **Autenticazione** | JWT (cookie httpOnly) | — |
| | bcryptjs | 2.x |
| | express-rate-limit | 7.x |
| **AI / TTS** | Python | 3.10+ |
| | Flask | 3.x |
| | ElevenLabs API | v1 |
| **Storage** | Cloudinary (immagini, video, audio) | SDK v2 |
| **Email** | Nodemailer | 6.x |
| | SMTP (Gmail / qualsiasi provider) | — |
| **Database** | MongoDB | 7.0 |
| **Container** | Docker | 24+ |
| | Docker Compose | v2 |
| **CI/CD** | GitHub Actions + GHCR | — |
| **Documentazione API** | Swagger UI (swagger-jsdoc + swagger-ui-express) | — |
| **Logging** | Winston (strutturato) → Monitoring Service → MongoDB | 3.x |
| **Data Visualization** | Recharts (grafici clinici EmoGame)| 2.x |

### 6.1 Protocolli Crittografici

| Ambito | Standard / Algoritmo | Note |
|---|---|---|
| **Data in Transit** | HTTPS / TLS | Traffico client-server forzato su HTTPS. Le comunicazioni inter-servizio avvengono sulla rete interna Docker isolata. |
| **Data at Rest** | **AES-256-CBC** | Cifratura simmetrica dei dati clinici sensibili (sessioni, note diario) prima della persistenza su MongoDB. |
| **Password Hashing** | **bcrypt** (10 round) | Hashing adattivo con salt casuale per ogni utente, gestito dall'Auth Service tramite `bcryptjs`. |
| **Token Autenticazione** | **JWT** (HS256) | Token firmati con `JWT_SECRET`, trasmessi esclusivamente via cookie `httpOnly` + `secure` + `sameSite`. |
| **Chiave Interna Inter-Servizio** | Header HMAC-like | Header `x-internal-api-key` condiviso tra Gateway e Analytics Service per prevenire chiamate dirette non autorizzate. |

---

## 7. Pipeline CI/CD

Ogni push sul branch `main` attiva automaticamente il workflow GitHub Actions (`.github/workflows/docker-publish.yml`):

1. **Checkout** — clona il repository su un runner `ubuntu-latest`.
2. **Normalizzazione nome repo** — converte il nome dell'immagine in lowercase per rispettare le regole di naming GHCR.
3. **Login su GHCR** — autenticazione tramite il `GITHUB_TOKEN` automatico (nessun segreto manuale richiesto).
4. **Build & push × 8** — costruisce e pubblica un'immagine Docker per ogni servizio (`ai-service`, `server`, `client`, `auth-service`, `analytics-service`, `monitoring-service`, `storage-service`, `email-service`) con tag `:latest` su `ghcr.io/{owner}/{repo}/{servizio}:latest`. La build del client riceve `VITE_BACKEND_URL` come argomento di build dalle variabili del repository GitHub.

**Deploy in produzione** (step manuale sul proprio server):

```bash
docker compose pull
docker compose up -d
```

---

## 8. Sicurezza

La piattaforma gestisce dati clinici sensibili riguardanti minori. Misure di sicurezza principali:

| Minaccia / Requisito | Implementazione Tecnica |
|---|---|
| **Furto token via XSS** | **JWT in cookie httpOnly** — i token non sono mai accessibili da JavaScript. |
| **Accesso non autorizzato per ruolo** | **Protezione route basata su ruolo** — il middleware valida il campo `tipo_utente` dell'utente prima di concedere accesso alle route terapista o bambino. |
| **Accesso cross-terapista ai dati** | **Isolamento dati terapista** — gli endpoint analytics e del diario clinico verificano che il bambino richiesto sia esplicitamente assegnato al terapista richiedente. |
| **Chiamate dirette dal client all'Analytics** | **Chiave API interna** — l'Analytics Service rifiuta qualsiasi richiesta priva del corretto header `x-internal-api-key`. |
| **Brute force ed attacchi volumetrici** | **Rate limiting differenziato** — auth: 40 req/10 min · API generale: 200 req/15 min · generazione audio: 15 req/ora. |
| **Injection MongoDB** | **Sanitizzazione input** — `express-mongo-sanitize` rimuove i pattern di MongoDB operator injection da tutti i body delle richieste. |
| **Vulnerabilità HTTP comuni** | **Helmet** — header di sicurezza (`Content-Security-Policy`, `X-Frame-Options`, `HSTS`, ecc.) applicati su ogni servizio. |
| **Protezione dati clinici a riposo** | **Cifratura AES-256-CBC** — sessioni comportamentali e note del diario terapista vengono cifrate prima della persistenza su MongoDB. L'accesso diretto al database non espone dati leggibili. |

---

## 9. Prerequisiti

- Docker e Docker Compose (v2+)
- Node.js 18+ (per lo sviluppo locale fuori Docker)
- Python 3.10+ (per lo sviluppo locale dell'AI Service — non necessario se si usa solo Docker)
- Account ElevenLabs con API Key attiva (necessaria per la generazione audio TTS)

---

## 10. Deployment

Il progetto è ottimizzato per il deployment containerizzato a basso footprint. I Dockerfile utilizzano **build multi-stage** e `--omit=dev` per minimizzare le dimensioni delle immagini. L'AI Service non richiede PyTorch né modelli locali — si appoggia interamente all'API ElevenLabs, mantenendo il container leggero.

```bash
# 1. Clona il repository
git clone https://github.com/your-org/storie-amiche.git
cd storie-amiche

# 2. Crea il file di ambiente
cp .env.example .env
# Modifica .env con i tuoi valori reali

# 3. Crea il file delle chiavi API per l'AI Service
cat > ai-service/keys.json << 'EOF'
{
  "ELEVENLABS_API_KEY": "la_tua_api_key_elevenlabs"
}
EOF

# 4. Build e avvio di tutti i servizi
docker compose up --build
```

### Punti di accesso

| Servizio | URL |
|---|---|
| Applicazione web | http://localhost:80 |
| Server di sviluppo Vite | http://localhost:5173 |
| Documentazione API (Swagger) | http://localhost:4000/api-docs |

---

## 11. Variabili d'Ambiente

Copia il template qui sotto in un file `.env` nella root del progetto. **Non committare mai questo file.**

```env

# =============================================
# FILE .env - VARIABILI D'AMBIENTE
# NON condividere mai questo file pubblicamente!
# =============================================

# ---- Server ----
PORT=4000
NODE_ENV=development
# NODE_ENV=production

# ---- MongoDB ----
# Con Docker, usa questa stringa di connessione:
MONGODB_URI=mongodb://mongodb:27017/storieamiche

FRONTEND_URL=frontend_url

# ---- JWT (Sicurezza Token) ----
JWT_SECRET=sostituisci_con_stringa_lunga_e_casuale
INTERNAL_API_KEY=sostituisci_con_stringa_lunga_e_casuale
# Chiave DEDICATA per la cifratura AES-256 dei dati clinici.
# SEPARATA da JWT_SECRET: ruotare l'uno non invalida l'altro.
ENCRYPTION_KEY=sostituisci_con_stringa_lunga_e_casuale
ENCRYPTION_SALT=sostituisci_con_stringa_lunga_e_casuale

# ---- Email (Nodemailer) ----
# Indirizzo email per l'autenticazione SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
# Indirizzo email per l'autenticazione SMTP
SMTP_USER=tua_email@gmail.com
# Password applicativa per l'invio sicuro (Gmail App Password)
SMTP_PASS=tua_app_password_google
# Email visualizzata come mittente
SENDER_EMAIL=tua_email@gmail.com

# ---- Microservizi URL (Interni a Docker) ----
EMAIL_SERVICE_URL=http://email-service:5008
AI_SERVICE_URL=http://ai-service:5001
STORAGE_SERVICE_URL=http://storage-service:5006
MONITORING_SERVICE_URL=http://monitoring-service:5005
AUTH_SERVICE_URL=http://auth-service:5009
ANALYTICS_SERVICE_URL=http://analytics-service:5007
GATEWAY_URL=http://server:4000

#--- CREDENZIALI cloudinary (IMMAGINI/VIDEO/AUDIO)
CLOUDINARY_CLOUD_NAME=tua_cloud_name
CLOUDINARY_API_KEY=tua_api_key
CLOUDINARY_API_SECRET=tua_api_secret
# --- FINE CONFIGURAZIONE ---

#--- CREDENZIALI openrouter (AI) per generazione narrazione e sintesi vocale
OPENROUTER_API_KEY=la_tua_chiave_openrouter
# --- FINE CONFIGURAZIONE ---

VITE_BACKEND_URL=http://localhost:4000

```

> **Nota per la produzione** — imposta `NODE_ENV=production`, sostituisci `FRONTEND_URL` con il tuo dominio reale e genera valori casuali robusti per `JWT_SECRET` e `INTERNAL_API_KEY`.

---

## 12. Documentazione API

La Swagger UI interattiva è disponibile su **http://localhost:4000/api-docs** quando il gateway è in esecuzione. Documenta gli endpoint pubblici di storie, utenti e approvazione. Gli endpoint auth sono proxati verso l'Auth Service e documentati anche lì.

---

## 13. Contribuire al Progetto

I contributi sono benvenuti. Se trovi un bug o vuoi proporre una nuova funzionalità, apri una issue o invia una pull request. Assicurati che le modifiche rispettino i pattern architetturali esistenti (struttura a cartelle per feature nel frontend, isolamento dei servizi nel backend) e non introducano accessi diretti cross-servizio al database — tutta la comunicazione inter-servizio deve avvenire tramite HTTP.
