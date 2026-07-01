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
        print(f"[{level.upper()}] {message}")
        requests.post(f"{MONITORING_SERVICE_URL}/log", json={
            "level": level, "service": "ai-service",
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