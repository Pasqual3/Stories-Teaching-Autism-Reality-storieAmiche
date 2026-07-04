"""
ai-service — ElevenLabs TTS con rotazione automatica delle API key.

Le chiavi vengono lette da keys.json (prima) e dalla variabile d'ambiente
ELEVENLABS_API_KEY (poi, come fallback/aggiunta extra).
Quando una chiave restituisce 401 o 429 si passa automaticamente alla
successiva. Solo quando tutte le chiavi sono esaurite si restituisce
use_browser_tts=True e il frontend usa la Web Speech API del browser.
"""

from flask import Flask, request, jsonify
import os, json, base64, time, uuid, threading, requests, traceback, re
from pathlib import Path

app = Flask(__name__)

MONITORING_SERVICE_URL = os.environ.get('MONITORING_SERVICE_URL', 'http://monitoring-service:5005')
ELEVENLABS_MODEL       = "eleven_multilingual_v2"

# ── Marcatori inseribili dall'utente ────────────────────────────────────────
MARKER_BREAK_SHORT = "{{PAUSA_CORTA}}"
MARKER_BREAK_LONG  = "{{PAUSA_LUNGA}}"
MARKER_EMPHASIS    = "{{ENFASI}}"

ELEVENLABS_VOICES = {
    "sara":   {"id": "XrExE9yKIg1WjnnlVkGX", "name": "Sara"},
    "nicola": {"id": "TX3LPaxmHKxFdv7VOQHJ", "name": "Nicola"},
}

PORT = int(os.environ.get('PORT', 5001))


# ════════════════════════════════════════════════════════════════════════════
# LOGGING — definita prima di KeyManager che la chiama nel __init__
# ════════════════════════════════════════════════════════════════════════════

def _log(level, message, metadata=None):
    try:
        normalized_level = 'warn' if level == 'warning' else level
        print(f"[{normalized_level.upper()}] {message}")
        requests.post(f"{MONITORING_SERVICE_URL}/log", json={
            "level": normalized_level, "service": "ai-service",
            "message": message, "metadata": metadata or {}
        }, timeout=2)
    except:
        pass


# ════════════════════════════════════════════════════════════════════════════
# KEY MANAGER — carica e ruota le API key
# ════════════════════════════════════════════════════════════════════════════

class KeyManager:
    """
    Gestisce un pool di API key ElevenLabs.
    - Le legge da keys.json (campo "elevenlabs_keys")
    - Aggiunge anche ELEVENLABS_API_KEY dall'env se presente e non duplicata
    - keep_index punta alla chiave corrente
    - exhausted tiene traccia delle chiavi bruciate nella sessione corrente
    - reset_at: timestamp Unix a cui resettare exhausted (mezzanotte successiva,
      approssimata a 24h dalla prima esaurizione) per riprovare le chiavi
      nel caso i crediti si siano ricaricati
    """

    _KEYS_FILE = Path(__file__).parent / "keys.json"

    def __init__(self):
        self._lock      = threading.Lock()
        self._keys      = []
        self._index     = 0
        self._exhausted = set()   # indici chiavi con crediti esauriti
        self._reset_at  = None    # timestamp reset automatico
        self._load()

    def _load(self):
        keys = []

        # 1. Da keys.json
        if self._KEYS_FILE.exists():
            try:
                raw = self._KEYS_FILE.read_text(encoding="utf-8")
                clean = re.sub(r'//[^\n]*', '', raw)   # elimina tutto ciò che va da // a fine riga
                data = json.loads(clean)
                
                for k in data.get("elevenlabs_keys", []):
                    k = k.strip()
                    if k and not k.startswith("sk_mia_") and k not in keys:
                        keys.append(k)
            except Exception as e:
                _log("warning", f"KeyManager: impossibile leggere keys.json — {e}")

        # 2. Da variabile d'ambiente (aggiunta se non già presente)
        env_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
        if env_key and env_key not in keys:
            keys.append(env_key)

        self._keys = keys
        self._index = 0
        _log("info", f"KeyManager: {len(self._keys)} chiave/i caricata/e.")

    def reload(self):
        """Ricarica keys.json a caldo (utile se l'utente aggiunge chiavi senza riavviare)."""
        with self._lock:
            self._load()
            self._exhausted.clear()
            self._reset_at = None

    @property
    def available(self) -> bool:
        with self._lock:
            return len(self._keys) > 0

    def current_key(self) -> str | None:
        """Restituisce la chiave attiva (quella corrente, se non esaurita)."""
        with self._lock:
            self._maybe_reset()
            # Cerca la prima chiave non esaurita a partire dall'indice corrente
            for offset in range(len(self._keys)):
                idx = (self._index + offset) % len(self._keys)
                if idx not in self._exhausted:
                    self._index = idx
                    return self._keys[idx]
            return None   # tutte esaurite

    def mark_exhausted(self, key: str):
        """Segna una chiave come esaurita e avanza all'indice successivo."""
        with self._lock:
            try:
                idx = self._keys.index(key)
                self._exhausted.add(idx)
                _log("warning", f"KeyManager: chiave #{idx + 1} esaurita. "
                                 f"Rimanenti: {len(self._keys) - len(self._exhausted)}/{len(self._keys)}")
                # Pianifica reset automatico tra 24h (se non già pianificato)
                if self._reset_at is None:
                    self._reset_at = time.time() + 86400
                # Avanza l'indice
                self._index = (idx + 1) % len(self._keys)
            except ValueError:
                pass

    def _maybe_reset(self):
        """Reset automatico delle chiavi esaurite dopo 24h."""
        if self._reset_at and time.time() >= self._reset_at:
            n = len(self._exhausted)
            self._exhausted.clear()
            self._reset_at = None
            _log("info", f"KeyManager: reset automatico — {n} chiave/i di nuovo disponibile/i.")

    def status(self) -> dict:
        with self._lock:
            self._maybe_reset()
            return {
                "total":     len(self._keys),
                "exhausted": len(self._exhausted),
                "active":    len(self._keys) - len(self._exhausted),
                "all_done":  len(self._exhausted) >= len(self._keys) > 0,
                "reset_at":  self._reset_at
            }


key_manager = KeyManager()


# ════════════════════════════════════════════════════════════════════════════
# JOB QUEUE
# ════════════════════════════════════════════════════════════════════════════

_jobs      = {}
_jobs_lock = threading.Lock()

def job_create(job_id, scene_total):
    with _jobs_lock:
        _jobs[job_id] = {
            "status": "queued", "scene_done": 0, "scene_total": scene_total,
            "audioData": None, "sceneTimestamps": [], "syncDataArray": [],
            "use_browser_tts": False, "message": "", "created_at": time.time()
        }

def job_update(job_id, **kwargs):
    with _jobs_lock:
        if job_id in _jobs:
            _jobs[job_id].update(kwargs)

def job_get(job_id):
    with _jobs_lock:
        return dict(_jobs.get(job_id, {}))

def job_cleanup():
    cutoff = time.time() - 7200
    with _jobs_lock:
        for jid in [k for k, v in _jobs.items() if v["created_at"] < cutoff]:
            del _jobs[jid]


# ════════════════════════════════════════════════════════════════════════════
# LOGGING
# ════════════════════════════════════════════════════════════════════════════

def _log(level, message, metadata=None):
    try:
        print(f"[{level.upper()}] {message}")
        requests.post(f"{MONITORING_SERVICE_URL}/log", json={
            "level": level, "service": "ai-service",
            "message": message, "metadata": metadata or {}
        }, timeout=2)
    except:
        pass


# ════════════════════════════════════════════════════════════════════════════
# TESTO: marker → SSML + correzioni
# ════════════════════════════════════════════════════════════════════════════

def _markers_to_ssml(text: str) -> str:
    # eleven_multilingual_v2 supporta SOLO i tag <break> SSML.
    # Tutti gli altri marcatori espressivi vengono rimossi dal testo
    # (non vengono letti ad alta voce grazie al re.sub finale).
    text = text.replace("{{PAUSA_CORTA}}", '<break time="300ms"/>')
    text = text.replace("{{PAUSA_LUNGA}}", '<break time="700ms"/>')

    # Marcatori non supportati da v2 → rimossi silenziosamente
    text = re.sub(r'\{\{/?[A-Z_]+\}\}', '', text)
    return text.strip()

# ════════════════════════════════════════════════════════════════════════════
# GESTIONE VOCI — fetch dinamico da ElevenLabs
# ════════════════════════════════════════════════════════════════════════════

_VOICES_CACHE = {}
_VOICES_LOCK  = __import__("threading").Lock()

def _fetch_voices_from_api(api_key: str) -> dict:
    """Chiama GET /v1/voices e costruisce slug → {id, name}."""
    try:
        resp = requests.get(
            "https://api.elevenlabs.io/v1/voices",
            headers={"xi-api-key": api_key},
            timeout=10
        )
        if resp.status_code != 200:
            return {}
        result = {}
        for v in resp.json().get("voices", []):
            slug = re.sub(r"[^a-z0-9]", "_", v["name"].lower()).strip("_")
            result[slug] = {"id": v["voice_id"], "name": v["name"]}
        _log("info", f"Voci caricate da ElevenLabs: {len(result)}")
        return result
    except Exception as e:
        _log("warning", f"Impossibile recuperare voci ElevenLabs: {e}")
        return {}

def get_voices_dict() -> dict:
    """Cache delle voci — si popola al primo accesso."""
    global _VOICES_CACHE
    with _VOICES_LOCK:
        if not _VOICES_CACHE:
            key = key_manager.current_key()
            if key:
                _VOICES_CACHE = _fetch_voices_from_api(key)
            if not _VOICES_CACHE:
                return ELEVENLABS_VOICES
    return _VOICES_CACHE

def resolve_voice_id(voice_key: str) -> str:
    """
    Risolve voice_key → voice_id ElevenLabs.
    Accetta: slug generato dal nome, ID diretto, o parte del nome.
    """
    # ID diretto (stringa alfanumerica > 15 char)
    if len(voice_key) > 15 and re.match(r"^[a-zA-Z0-9]+$", voice_key):
        return voice_key
    voices = get_voices_dict()
    # Slug esatto
    if voice_key in voices:
        return voices[voice_key]["id"]
    # Ricerca parziale nel nome
    for slug, v in voices.items():
        if voice_key.lower() in slug or voice_key.lower() in v["name"].lower():
            return v["id"]
    # Prima voce disponibile come fallback
    if voices:
        first = next(iter(voices.values()))
        _log("warning", f"Voce '{voice_key}' non trovata, uso '{first['name']}'")
        return first["id"]
    _log("warning", "Nessuna voce trovata, uso fallback hardcoded")
    return "XrExE9yKIg1WjnnlVkGX"  # Sara fallback


def _apply_basic_fixes(text: str) -> str:
    DIZIONARIO = {"passeggino": "passeggìno", "scivolo": "scìvolo", "giostra": "giòstra"}
    for wrong, correct in DIZIONARIO.items():
        text = re.sub(rf'\b{wrong}\b', correct, text, flags=re.IGNORECASE)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    result = []
    for s in sentences:
        words = s.split()
        if len(words) > 18:
            mid = len(words) // 2
            s = ' '.join(words[:mid]) + ', ' + ' '.join(words[mid:])
        result.append(s)
    return ' '.join(result)


# ════════════════════════════════════════════════════════════════════════════
# ELEVENLABS API — con retry su chiave multipla
# ════════════════════════════════════════════════════════════════════════════

class KeyExhaustedError(Exception):
    """Tutte le chiavi disponibili sono esaurite."""
    pass

def _call_elevenlabs(text: str, voice_id: str, speed: float = 1.0) -> dict:
    """
    Prova le chiavi disponibili in sequenza.
    Se una chiave restituisce 401/429 la segna come esaurita e passa alla
    successiva. Se nessuna funziona, lancia KeyExhaustedError.
    """
    tried = set()

    while True:
        key = key_manager.current_key()

        if key is None or key in tried:
            raise KeyExhaustedError("Tutte le API key ElevenLabs sono esaurite o non valide.")

        tried.add(key)
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"

        try:
            resp = requests.post(url, json={
                "text": text,
                "model_id": ELEVENLABS_MODEL,
                "voice_settings": {
                    "stability": 0.45, "similarity_boost": 0.80,
                    "style": 0.30, "use_speaker_boost": True, "speed": speed
                }
            }, headers={"xi-api-key": key, "Content-Type": "application/json"}, timeout=120)

        except requests.RequestException as e:
            raise Exception(f"Errore di rete ElevenLabs: {e}")

        if resp.status_code in (401, 403, 429):
            _log("warning", f"Chiave ElevenLabs esaurita/non valida (HTTP {resp.status_code}) — passo alla successiva.")
            key_manager.mark_exhausted(key)
            continue   # riprova con la prossima chiave

        if resp.status_code != 200:
            raise Exception(f"ElevenLabs HTTP {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        return {
            "audio_base64":          data.get("audio_base64", ""),
            "characters":            data.get("alignment", {}).get("characters", []),
            "character_start_times": data.get("alignment", {}).get("character_start_times_seconds", []),
            "character_end_times":   data.get("alignment", {}).get("character_end_times_seconds", [])
        }


# ════════════════════════════════════════════════════════════════════════════
# HELPERS TIMESTAMPS / SYNC
# ════════════════════════════════════════════════════════════════════════════

def _build_scene_timestamps(separator_positions, char_end_times, scene_count):
    timestamps = []
    for pos in separator_positions:
        idx = max(0, pos - 1)
        timestamps.append(round(char_end_times[idx], 3) if idx < len(char_end_times) else 0.0)
    timestamps.append(round(char_end_times[-1], 3) if char_end_times else 0.0)
    while len(timestamps) < scene_count:
        timestamps.append(timestamps[-1] if timestamps else 0.0)
    return timestamps[:scene_count]

def _build_word_sync(characters, char_starts, char_ends):
    sync, word, word_start = [], "", 0.0
    for i, ch in enumerate(characters):
        if ch in (' ', '\n', '\t'):
            if word.strip():
                sync.append({"word": word.strip(), "start": round(word_start, 3),
                             "end": round(char_ends[i-1] if i > 0 else 0.0, 3)})
            word = ""
        else:
            if not word:
                word_start = char_starts[i] if i < len(char_starts) else 0.0
            word += ch
    if word.strip() and char_ends:
        sync.append({"word": word.strip(), "start": round(word_start, 3), "end": round(char_ends[-1], 3)})
    return sync


# ════════════════════════════════════════════════════════════════════════════
# WORKER — una chiamata ElevenLabs per scena (no split, no disallineamento)
# ════════════════════════════════════════════════════════════════════════════

def _generate_worker(job_id, texts, voice_id, speed, emotions=None):
    job_update(job_id, status="processing")
    try:
        scene_count = len(texts)
        audio_clips_b64  = []
        scene_timestamps = []
        sync_data_array  = []

        for i, text in enumerate(texts):
            # Testo vuoto → clip silenziosa pre-calcolata + sync vuoto
            if not text or not text.strip():
                # Questa è una stringa Base64 reale di un minuscolo file MP3 di silenzio
                silence_b64 = "//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
                
                audio_clips_b64.append(silence_b64)
                scene_timestamps.append(0.1)
                sync_data_array.append([])
                job_update(job_id, scene_done=i + 1)
                continue

            processed = _apply_basic_fixes(_markers_to_ssml(text.strip()))
            _log("info", f"[job={job_id}] Scena {i+1}/{scene_count} — {len(processed)} caratteri")

            result = _call_elevenlabs(processed, voice_id, speed=float(speed))

            audio_b64   = result["audio_base64"]
            characters  = result["characters"]
            char_starts = result["character_start_times"]
            char_ends   = result["character_end_times"]

            word_sync = _build_word_sync(characters, char_starts, char_ends)

            # Durata totale della clip = fine dell'ultima parola
            clip_end = round(char_ends[-1], 3) if char_ends else 0.0

            audio_clips_b64.append(audio_b64)
            scene_timestamps.append(clip_end)
            sync_data_array.append(word_sync)

            # Aggiorna il progresso in tempo reale
            job_update(job_id, scene_done=i + 1)

        job_update(job_id, status="done", scene_done=scene_count,
                   audioDataArray=audio_clips_b64, sceneTimestamps=scene_timestamps,
                   syncDataArray=sync_data_array)
        _log("info", f"[job={job_id}] Completato — {scene_count} tracce separate.")

    except KeyExhaustedError as e:
        _log("warning", f"[job={job_id}] Tutte le chiavi esaurite → fallback browser TTS.")
        job_update(job_id, status="done", use_browser_tts=True,
                   scene_done=len(texts), message=str(e))

    except Exception as e:
        _log("error", f"[job={job_id}] Errore: {e}", {"trace": traceback.format_exc()})
        job_update(job_id, status="error", message=str(e))

    finally:
        job_cleanup()


# ════════════════════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════════════════════
# NARRAZIONE ADATTIVA — generazione storia via LLM (OpenRouter) con fallback
# ════════════════════════════════════════════════════════════════════════════

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '').strip()
OPENROUTER_MODEL   = os.environ.get('OPENROUTER_MODEL', 'nvidia/nemotron-3-nano-30b-a3b:free')
# Modello di riserva SENZA reasoning: usato se il modello principale esaurisce
# il budget di token "pensando" e non produce mai il JSON finale (vedi
# _call_openrouter_adaptive). Un modello instruction-following semplice non
# spreca token in chain-of-thought e per uno schema fisso come questo va benissimo.
OPENROUTER_FALLBACK_MODEL = os.environ.get('OPENROUTER_FALLBACK_MODEL', 'meta-llama/llama-3.3-70b-instruct:free')
OPENROUTER_URL     = "https://openrouter.ai/api/v1/chat/completions"

# Le 5 scene fisse della narrazione adattiva.
# La scena "choices" (indice 1) è un bivio: in base all'opzione scelta dal
# bambino, il player (viewEmoGame) salta alla scena indicata da nextSceneIndex
# invece di procedere semplicemente alla scena successiva.
ADAPTIVE_PHASES = ["opening", "choices", "resolution", "educator_suggestion", "finale"]

EMOTION_LABELS = {
    "agitato": "agitato/frustrato", "triste": "triste", "arrabbiato": "arrabbiato",
    "ansioso": "ansioso", "calmo": "calmo", "felice": "felice",
}

STRESS_LABELS = {
    "calm":     "calma (nessun segnale particolare di stress nelle sessioni precedenti)",
    "mild":     "lieve tensione (qualche piccolo segnale di difficoltà nelle sessioni precedenti)",
    "moderate": "stress moderato (segnali di affaticamento/frustrazione nelle sessioni precedenti)",
    "high":     "stress elevato (segnali importanti di disagio: procedere con cautela, tono molto rassicurante)",
}

ADAPTIVE_SYSTEM_PROMPT = """IMPORTANTE: rispondi SOLO ED ESCLUSIVAMENTE con l'oggetto JSON richiesto. NON scrivere alcun ragionamento, spiegazione, premessa o commento prima o dopo il JSON. Il tuo output deve iniziare con il carattere { e finire con il carattere }. Nessun testo fuori dal JSON, nessun blocco di pensiero, nessun tag <think>.

Sei un assistente esperto in Storie Sociali per bambini nello spettro autistico, e scrivi in ITALIANO SEMPLICE e CHIARO, con frasi brevi e concrete.

Genera UNA storia interattiva adattiva composta da esattamente 5 o piu scene scene, in quest'ordine fisso:
0. "opening" — apertura: presenta la situazione e il protagonista.
1. "choices" — un bivio: il bambino sceglie come reagire in una situazione sociale. Le opzioni portano a scene DIVERSE (vedi regole nextSceneIndex).
2. "resolution" — cosa succede se si sceglie la via più serena/adeguata al bivio (raggiunta direttamente).
3. "educator_suggestion" — un suggerimento gentile e mai giudicante, mostrato se si sceglie la via più difficile al bivio: aiuta a capire un modo migliore di reagire.
4. "finale" — chiusura positiva, valida per entrambi i percorsi.

REGOLE FERREE per "options" di OGNI scena:
- ALMENO 2 opzioni per scena. MAI una singola opzione.
- Ogni opzione ha: "text" (breve, max 120 caratteri), "emoji" (1-2 emoji coerenti), "isCorrect" (true/false/null: null se la scena non è un vero quiz), "score" (0-10 o null), "explanation" (breve, mostrata come feedback), "imageSuggestion" (breve descrizione ITALIANA dell'immagine utile per illustrare l'opzione, es: "Un bambino sorride al parco con altri bambini"), "nextSceneIndex" (indice della scena a cui saltare se scelta, o null se semplicemente la scena dopo).
- SOLO nella scena "choices" (indice 1): l'opzione/le opzioni con la reazione più adeguata → "nextSceneIndex": 2. L'opzione/le opzioni con la reazione più difficile → "nextSceneIndex": 3.
- Nelle scene 2 e 3: tutte le opzioni → "nextSceneIndex": 4 (convergono sul finale).
- Nelle scene 0 e 4: "nextSceneIndex": null su tutte le opzioni.

RICORDA: rispondi SOLO con l'oggetto JSON qui sotto, senza alcun testo, ragionamento o commento prima o dopo. Nessun blocco markdown, nessun backtick:
{
  "title": "Titolo breve",
  "description": "Una frase che descrive la storia",
  "scenes": [
    {
      "phase": "opening",
      "text": "Testo narrato, 2-4 frasi semplici",
      "question": "Domanda da porre al bambino su questa scena",
      "options": [
        {"text": "...", "emoji": "...", "isCorrect": null, "score": null, "explanation": "...", "imageSuggestion": "...", "nextSceneIndex": null}
      ]
    }
  ]
}"""


def _build_adaptive_user_prompt(topic, initial_emotion, child_name, stress_level, stress_index):
    emotion_label = EMOTION_LABELS.get(initial_emotion, initial_emotion or "non specificata")
    child_part = f"Il bambino si chiama {child_name}. " if child_name else ""

    if stress_level:
        stress_part = (
            f"Dalla sessione precedente risulta un livello di stress: {STRESS_LABELS.get(stress_level, stress_level)} "
            f"(indice numerico: {stress_index if stress_index is not None else 'n/d'}). "
            f"Adatta il tono della storia di conseguenza: se lo stress è moderato o elevato, usa un ritmo più lento, "
            f"frasi più rassicuranti e un bivio meno impegnativo."
        )
    else:
        stress_part = "Non ci sono sessioni precedenti registrate per questo bambino: usa un tono neutro e accogliente."

    return (
        f"Argomento della storia: {topic}.\n"
        f"Emozione iniziale del bambino: {emotion_label}.\n"
        f"{child_part}{stress_part}\n"
        f"Genera ora la storia adattiva completa seguendo esattamente la struttura e le regole indicate."
    )


def _extract_json_object(raw_text):
    """Estrae un oggetto JSON da un testo, tollerando eventuali blocchi ```json ... ```
    residui e testo di ragionamento ("reasoning") che alcuni modelli scrivono
    prima della risposta finale, anche quando il prompt chiede di rispondere
    con il solo JSON.

    Strategia: individua tutte le sottostringhe che sono oggetti JSON top-level
    bilanciati (contando le graffe, ignorando quelle dentro stringhe) e prova a
    fare il parsing partendo dall'ULTIMA trovata, perché il JSON vero è quasi
    sempre l'ultimo blocco scritto dal modello dopo l'eventuale ragionamento.
    Se nessuna delle candidate è valida, l'errore riportato è quello relativo
    all'ultimo (più probabile) candidato.
    """
    text = raw_text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)

    candidates = []
    depth = 0
    start_idx = None
    in_string = False
    escape = False

    for i, ch in enumerate(text):
        if in_string:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == '{':
            if depth == 0:
                start_idx = i
            depth += 1
        elif ch == '}':
            if depth > 0:
                depth -= 1
                if depth == 0 and start_idx is not None:
                    candidates.append(text[start_idx:i + 1])

    if not candidates:
        raise ValueError("Nessun oggetto JSON trovato nella risposta del modello.")

    last_error = None
    for candidate in reversed(candidates):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as e:
            last_error = e
            continue

    raise last_error


def _clean_option(opt, scene_count, fallback_next):
    """Normalizza un'opzione, forzando tipi e vincolando nextSceneIndex a un indice scena valido."""
    next_idx = opt.get('nextSceneIndex')
    try:
        next_idx = int(next_idx) if next_idx is not None else None
    except (TypeError, ValueError):
        next_idx = None
    if next_idx is not None and not (0 <= next_idx < scene_count):
        next_idx = None

    score = opt.get('score')
    try:
        score = int(score) if score is not None and str(score).strip() != '' else None
    except (TypeError, ValueError):
        score = None
    if score is not None:
        score = max(0, min(10, score))

    is_correct = opt.get('isCorrect')
    if is_correct not in (True, False):
        is_correct = None

    return {
        "text": str(opt.get('text') or '').strip()[:120] or "Continua",
        "emoji": str(opt.get('emoji') or '').strip()[:16],
        "isCorrect": is_correct,
        "score": score,
        "explanation": str(opt.get('explanation') or '').strip(),
        "imageSuggestion": str(opt.get('imageSuggestion') or '').strip(),
        "nextSceneIndex": next_idx if next_idx is not None else fallback_next,
    }


def _validate_and_clean_story(raw):
    """Valida la struttura restituita dal modello e la rende sicura per il frontend/DB.

    IMPORTANTE: se una scena arriva senza testo o senza domanda (es. il modello
    ha troncato la risposta o ha "saltato" dei campi su una scena intermedia),
    la funzione solleva un errore invece di restituire silenziosamente una
    storia incompleta. Prima non c'era questo controllo: scene con
    text/question vuoti passavano comunque con success:true, e il problema
    si scopriva solo dopo, in fase di pubblicazione ("Manca la domanda nel
    Quesito 3"). Sollevare l'errore qui permette al chiamante (vedi
    adaptive_story) di far scattare il retry sul modello di fallback invece
    di consegnare una storia a metà.
    """
    scenes_in = raw.get('scenes')
    if not isinstance(scenes_in, list) or len(scenes_in) == 0:
        raise ValueError("Il modello non ha restituito alcuna scena.")

    scene_count = len(scenes_in)
    scenes_out = []
    incomplete = []

    for i, s in enumerate(scenes_in):
        if not isinstance(s, dict):
            incomplete.append(f"scena {i + 1}: formato non valido")
            continue

        text = str(s.get('text') or '').strip()
        question = str(s.get('question') or '').strip()

        options_in = s.get('options')
        if not isinstance(options_in, list):
            options_in = []

        # Conta solo le opzioni con un testo reale scritto dal modello (non il
        # placeholder "Continua" che aggiungiamo sotto per completare a 2).
        real_options = [o for o in options_in if isinstance(o, dict) and str(o.get('text') or '').strip()]

        phase_label = s.get('phase') or (ADAPTIVE_PHASES[i] if i < len(ADAPTIVE_PHASES) else f"scena_{i}")
        if not text:
            incomplete.append(f"scena {i + 1} ({phase_label}): manca il testo narrato")
        if not question:
            incomplete.append(f"scena {i + 1} ({phase_label}): manca la domanda")
        if len(real_options) < 2:
            incomplete.append(f"scena {i + 1} ({phase_label}): meno di 2 opzioni valide")

        # Garantisce SEMPRE almeno 2 opzioni (mai una singola, come richiesto)
        if len(options_in) < 2:
            options_in = options_in + [{"text": "Continua"}] * (2 - len(options_in))

        fallback_next = (i + 1) if i < scene_count - 1 else None
        options_out = [_clean_option(o, scene_count, fallback_next) for o in options_in]

        scenes_out.append({
            "phase": phase_label,
            "text": text,
            "question": question,
            "options": options_out,
        })

    if incomplete:
        raise ValueError("Storia incompleta restituita dal modello: " + "; ".join(incomplete))

    return {
        "title": str(raw.get('title') or '').strip() or "Narrazione Adattiva",
        "description": str(raw.get('description') or '').strip(),
        "scenes": scenes_out,
    }


def _call_openrouter_adaptive(system_prompt, user_prompt, model=None):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://storieamiche.app",
        "X-Title": "Storie Amiche - Narrazione Adattiva",
    }
    body = {
        "model": model or OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.8,
        # Alzato rispetto a prima: i modelli "reasoning" (es. nemotron)
        # spendono centinaia/migliaia di token in ragionamento interno prima
        # di iniziare a scrivere il JSON. Con un tetto troppo basso il
        # ragionamento consuma tutto il budget e il JSON non viene mai emesso
        # (raw_text finisce troncato a metà "pensiero" -> JSONDecodeError).
        "max_tokens": 6000,
        # Limita esplicitamente quanti token il modello può usare per
        # "pensare" prima di rispondere, invece di lasciarlo libero.
        # "exclude": true da solo NASCONDE il reasoning nella risposta ma non
        # ne limita la lunghezza: il modello può comunque esaurire tutto il
        # budget pensando, senza mai emettere contenuto. Con un tetto basso
        # (500 token) lo si costringe a passare alla risposta finale.
        "reasoning": {"max_tokens": 500, "exclude": True},
    }
    resp = requests.post(OPENROUTER_URL, headers=headers, data=json.dumps(body), timeout=60)
    if resp.status_code != 200:
        raise Exception(f"OpenRouter HTTP {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise Exception(f"Risposta OpenRouter inattesa: {json.dumps(data)[:300]}")


def _offline_adaptive_story(topic, initial_emotion, child_name):
    """Storia adattiva statica in italiano, usata quando l'IA non è disponibile o fallisce."""
    nome = child_name or "il protagonista"
    return {
        "title": f"Una storia su: {topic}"[:80],
        "description": f"Narrazione adattiva generata offline sul tema \"{topic}\".",
        "scenes": [
            {
                "phase": "opening",
                "text": f"Oggi {nome} si trova davanti a una situazione nuova: {topic}. "
                        f"È un momento importante, e ci sono diverse cose che si possono provare.",
                "question": "Come si sente il protagonista in questo momento?",
                "options": [
                    {"text": "Curioso", "emoji": "🙂", "isCorrect": None, "score": None,
                     "explanation": "È normale essere curiosi davanti a qualcosa di nuovo.",
                     "imageSuggestion": "Un bambino che osserva con interesse una nuova situazione.",
                     "nextSceneIndex": 1},
                    {"text": "Un po' preoccupato", "emoji": "😟", "isCorrect": None, "score": None,
                     "explanation": "Va bene anche sentirsi un po' preoccupati: è una situazione nuova.",
                     "imageSuggestion": "Un bambino pensieroso che si guarda intorno.",
                     "nextSceneIndex": 1},
                ],
            },
            {
                "phase": "choices",
                "text": "Ora bisogna decidere come comportarsi.",
                "question": "Cosa scegli di fare?",
                "options": [
                    {"text": "Fare un respiro e provare con calma", "emoji": "😌", "isCorrect": True, "score": 10,
                     "explanation": "Ottima scelta! Fare un respiro aiuta a sentirsi più sereni.",
                     "imageSuggestion": "Un bambino che respira profondamente e sorride.",
                     "nextSceneIndex": 2},
                    {"text": "Agitarsi e volersene andare subito", "emoji": "😣", "isCorrect": False, "score": 4,
                     "explanation": "È comprensibile sentirsi così, ma c'è un modo che può aiutare di più.",
                     "imageSuggestion": "Un bambino agitato che si copre le orecchie.",
                     "nextSceneIndex": 3},
                ],
            },
            {
                "phase": "resolution",
                "text": f"Grazie alla calma, {nome} riesce ad affrontare {topic} un passo alla volta, "
                        f"e le cose vanno meglio di quanto pensasse.",
                "question": "Come si sente adesso il protagonista?",
                "options": [
                    {"text": "Orgoglioso di sé", "emoji": "😄", "isCorrect": None, "score": None,
                     "explanation": "È bello sentirsi orgogliosi quando si affronta qualcosa di nuovo!",
                     "imageSuggestion": "Un bambino sorridente con il pollice in su.",
                     "nextSceneIndex": 4},
                    {"text": "Ancora un po' stanco ma sereno", "emoji": "😊", "isCorrect": None, "score": None,
                     "explanation": "Va benissimo anche essere stanchi: l'importante è essersi impegnati.",
                     "imageSuggestion": "Un bambino sereno che si riposa dopo uno sforzo.",
                     "nextSceneIndex": 4},
                ],
            },
            {
                "phase": "educator_suggestion",
                "text": "Un piccolo consiglio: quando ci si sente agitati, si può provare a contare fino a 5 "
                        "e fare un respiro profondo, oppure chiedere aiuto a un adulto di fiducia.",
                "question": "Cosa si può fare la prossima volta per sentirsi più tranquilli?",
                "options": [
                    {"text": "Contare fino a 5 e respirare", "emoji": "🧘", "isCorrect": True, "score": 10,
                     "explanation": "Esatto! Respirare aiuta il corpo e la mente a calmarsi.",
                     "imageSuggestion": "Un bambino che chiude gli occhi e respira lentamente.",
                     "nextSceneIndex": 4},
                    {"text": "Chiedere aiuto a un adulto", "emoji": "🤝", "isCorrect": True, "score": 10,
                     "explanation": "Ottima idea, chiedere aiuto non è mai sbagliato.",
                     "imageSuggestion": "Un bambino che parla con un adulto sorridente.",
                     "nextSceneIndex": 4},
                ],
            },
            {
                "phase": "finale",
                "text": f"Alla fine, {nome} ha imparato qualcosa di importante su come affrontare "
                        f"{topic} con più serenità la prossima volta.",
                "question": "Cosa porta con sé il protagonista da questa esperienza?",
                "options": [
                    {"text": "Che può farcela", "emoji": "🌈", "isCorrect": None, "score": None,
                     "explanation": "Ogni piccolo passo conta ed è un successo.",
                     "imageSuggestion": "Un bambino felice sotto un arcobaleno.",
                     "nextSceneIndex": None},
                    {"text": "Che va bene chiedere aiuto", "emoji": "💛", "isCorrect": None, "score": None,
                     "explanation": "Chiedere aiuto è sempre una scelta saggia.",
                     "imageSuggestion": "Un bambino che sorride tenendo la mano di un adulto.",
                     "nextSceneIndex": None},
                ],
            },
        ],
    }


@app.route('/adaptive-story', methods=['POST'])
def adaptive_story():
    """
    Genera una narrazione adattiva di 5 scene (opening → choices → resolution/
    educator_suggestion → finale) in base ad argomento, emozione iniziale e
    baseline/stress del bambino calcolata lato Node dall'analytics-service.
    Body atteso: { topic, initialEmotion, childName?, stressLevel?, stressIndex? }
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        topic = str(data.get('topic') or '').strip()
        if not topic:
            return jsonify({"success": False, "message": "Argomento della storia mancante"}), 400

        initial_emotion = str(data.get('initialEmotion') or '').strip()
        child_name = str(data.get('childName') or '').strip()
        stress_level = data.get('stressLevel')
        stress_index = data.get('stressIndex')

        if not OPENROUTER_API_KEY:
            _log("warn", "adaptive_story: OPENROUTER_API_KEY assente, uso fallback offline")
            _log("debug", f"adaptive_story request body: {data}")
            story = _offline_adaptive_story(topic, initial_emotion, child_name)
            return jsonify({"success": True, "scenes": story["scenes"], "title": story["title"],
                             "description": story["description"], "source": "offline"})

        try:
            _log("debug", f"adaptive_story request body: {data}")
            _log("debug", f"OPENROUTER_API_KEY present: {bool(OPENROUTER_API_KEY)}")
            user_prompt = _build_adaptive_user_prompt(topic, initial_emotion, child_name, stress_level, stress_index)

            # Primo tentativo: modello principale (configurabile via env).
            # Se non produce un JSON valido (es. un modello "reasoning" che
            # esaurisce il budget pensando, senza mai scrivere la risposta),
            # si ritenta UNA volta con un modello di riserva senza reasoning
            # prima di arrendersi al fallback offline statico.
            models_to_try = [OPENROUTER_MODEL]
            if OPENROUTER_FALLBACK_MODEL and OPENROUTER_FALLBACK_MODEL != OPENROUTER_MODEL:
                models_to_try.append(OPENROUTER_FALLBACK_MODEL)

            last_ai_error = None
            story = None
            for attempt_model in models_to_try:
                try:
                    raw_text = _call_openrouter_adaptive(ADAPTIVE_SYSTEM_PROMPT, user_prompt, model=attempt_model)
                    _log("debug", f"adaptive_story raw model output [{attempt_model}] (first 500 chars): {raw_text[:500]}")
                    raw_json = _extract_json_object(raw_text)
                    story = _validate_and_clean_story(raw_json)
                    break
                except Exception as attempt_error:
                    last_ai_error = attempt_error
                    _log("warn", f"adaptive_story: tentativo fallito con modello {attempt_model}",
                         {"error": f"{type(attempt_error).__name__}: {attempt_error}"})
                    continue

            if story is None:
                raise last_ai_error

            return jsonify({"success": True, "scenes": story["scenes"], "title": story["title"],
                             "description": story["description"], "source": "ai"})
        except Exception as ai_error:
            print(f"[ADAPTIVE_STORY_ERROR] {type(ai_error).__name__}: {ai_error}")
            traceback.print_exc()
            _log("warn", "adaptive_story: generazione IA fallita, uso fallback offline",
                 {"error": f"{type(ai_error).__name__}: {ai_error}"})
            story = _offline_adaptive_story(topic, initial_emotion, child_name)
            return jsonify({"success": True, "scenes": story["scenes"], "title": story["title"],
                             "description": story["description"], "source": "offline"})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Errore generazione narrazione adattiva: {e}"}), 500


# ════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@app.route('/health', methods=['GET'])
def health():
    st = key_manager.status()
    # Restituisce sempre 'ok' se il container è vivo.
    # Il campo 'keys' indica quante chiavi sono disponibili:
    # il controller decide se procedere con ElevenLabs o fallback browser.
    return jsonify({
        'status':  'ok',
        'service': 'ai-service-elevenlabs',
        'keys':    st
    })


@app.route('/voices', methods=['GET'])
def get_voices():
    if request.args.get('refresh') == '1':
        global _VOICES_CACHE
        with _VOICES_LOCK:
            _VOICES_CACHE = {}
    voices_dict = get_voices_dict()
    voices = [{"id": slug, "name": v["name"], "voice_id": v["id"]}
              for slug, v in voices_dict.items()]
    return jsonify({"success": True, "voices": voices})


@app.route('/keys/reload', methods=['POST'])
def reload_keys():
    """Ricarica keys.json senza riavviare il container."""
    key_manager.reload()
    return jsonify({"success": True, "keys": key_manager.status()})


@app.route('/keys/status', methods=['GET'])
def keys_status():
    return jsonify({"success": True, "keys": key_manager.status()})


@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    try:
        data      = request.get_json()
        texts     = data.get('texts', [])
        emotions  = data.get('emotions', [])
        voice_key = data.get('speakerName', 'sara')
        speed     = float(data.get('speed', 1.0))

        if not texts and data.get('text'):
            texts = [data['text']]
        if not texts:
            return jsonify({'success': False, 'message': 'Nessun testo ricevuto'}), 400

        # Nessuna chiave disponibile → fallback browser immediato
        if not key_manager.available or key_manager.current_key() is None:
            job_id = str(uuid.uuid4())
            job_create(job_id, len(texts))
            job_update(job_id, status="done", use_browser_tts=True,
                       scene_done=len(texts),
                       message="Nessuna API key ElevenLabs disponibile.")
            return jsonify({'success': True, 'jobId': job_id, 'status': 'queued'})

        voice_id = resolve_voice_id(voice_key)
        job_id   = str(uuid.uuid4())
        job_create(job_id, len(texts))
        _log("info", f"Nuovo job={job_id} — {len(texts)} scene, voice={voice_key}")

        t = threading.Thread(target=_generate_worker,
                             args=(job_id, texts, voice_id, speed, emotions), daemon=True)
        t.start()
        return jsonify({'success': True, 'jobId': job_id, 'status': 'queued'})

    except Exception as e:
        _log("error", f"Errore avvio job: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/audio-status/<job_id>', methods=['GET'])
def audio_status(job_id):
    job = job_get(job_id)
    if not job:
        return jsonify({'success': False, 'status': 'not_found',
                        'message': f'Job {job_id} non trovato o scaduto'}), 200

    if job['status'] == 'error':
        return jsonify({'success': False, 'status': 'error',
                        'message': job.get('message', 'Errore sconosciuto')}), 500

    if job['status'] == 'done':
        if job.get('use_browser_tts'):
            return jsonify({'success': True, 'status': 'done',
                            'use_browser_tts': True, 'message': job.get('message', ''),
                            'keys_status': key_manager.status()})
        return jsonify({'success': True, 'status': 'done', 'mode': 'split',
                        'scene_done':      job['scene_done'],
                        'scene_total':     job['scene_total'],
                        'audioDataArray':  job.get('audioDataArray', []),
                        'sceneTimestamps': job.get('sceneTimestamps', []),
                        'syncDataArray':   job.get('syncDataArray', [])})

    return jsonify({'success': True, 'status': job['status'],
                    'scene_done': job['scene_done'], 'scene_total': job['scene_total']})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=False)