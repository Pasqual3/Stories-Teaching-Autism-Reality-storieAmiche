import emoGameModel from "../../models/emoGameModel.js";
import { userModel } from "../../models/userModel.js";
import { sendEmail } from "../../utils/emailClient.js";

/**
 * POST /api/emoGame/:id/session
 * Salva una sessione di gioco completata dal bambino.
 * Dati salvati nell'array `emotionGameSessions` dell'EmoGame.
 * Dopo il salvataggio, invia una notifica email al terapista associato.
 */
export const saveEmoGameSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { childUserId, score, total, results, completed } = req.body;

        if (!childUserId) {
            return res.json({ success: false, message: 'childUserId richiesto' });
        }

        const emoGame = await emoGameModel.findById(id);
        if (!emoGame) {
            return res.status(404).json({ success: false, message: 'EmoGame non trovato' });
        }

        // Inizializza l'array se non esiste
        if (!emoGame.emotionGameSessions) {
            emoGame.emotionGameSessions = [];
        }

        const newSession = {
            childUserId,
            playedAt: new Date(),
            score: score ?? 0,
            total: total ?? 0,
            results: results || [],
            completed: completed || false
        };

        emoGame.emotionGameSessions.push(newSession);

        // Manteniamo solo le ultime 100 sessioni per non far crescere il documento
        if (emoGame.emotionGameSessions.length > 100) {
            emoGame.emotionGameSessions = emoGame.emotionGameSessions.slice(-100);
        }

        await emoGame.save();

        res.json({ success: true, message: 'Sessione salvata' });

        // ── NOTIFICA EMAIL AL TERAPISTA (non bloccante) ────────────────────────
        // Eseguiamo in background dopo aver già risposto al client
        if (completed) {
            sendTherapistNotification({
                childUserId,
                emoGame,
                session: newSession,
                score: score ?? 0,
                total: total ?? 0,
                results: results || []
            }).catch(err => console.error('Errore notifica terapista:', err));
        }

    } catch (error) {
        console.error('Errore saveEmoGameSession:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Trova il terapista associato al bambino e gli invia l'email di report.
 */
async function sendTherapistNotification({ childUserId, emoGame, session, score, total, results }) {
    try {
        // Troviamo il genitore che ha questo childId
        const parent = await userModel.findOne({
            'children._id': childUserId,
            tipo_utente: 'adulto'
        }).populate({
            path: 'therapists.therapistId',
            select: 'anagrafica.nome anagrafica.cognome anagrafica.email'
        });

        if (!parent) return;

        // Troviamo il nome del bambino
        const childDoc = parent.children.id(childUserId);
        const childName = childDoc?.name || `Paziente #${String(childUserId).slice(-4).toUpperCase()}`;

        // Prendiamo i terapisti accettati
        const acceptedTherapists = (parent.therapists || []).filter(
            t => t.status === 'accepted' && t.therapistId
        );

        if (acceptedTherapists.length === 0) return;

        // Costruiamo il report testuale delle risposte
        const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
        const playedAt = new Date(session.playedAt).toLocaleString('it-IT');

        const risposteHtml = (results || []).map((r, i) => {
            const corretto = r.isCorrect === true;
            const color = corretto ? '#16a34a' : '#dc2626';
            const icon = corretto ? '✓' : '✗';
            return `
              <tr>
                <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; color:#555; font-size:13px;">
                  ${i + 1}. ${r.question || 'Domanda'}
                </td>
                <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; font-weight:bold; color:${color}; font-size:13px;">
                  ${icon} ${r.selectedOption || r.answer || '—'}
                </td>
              </tr>`;
        }).join('');

        const analyticsUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/analytics`;

        const emailHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6d28d9,#4f46e5);padding:32px 28px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🎮</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Sessione EmoGame Completata</h1>
      <p style="color:#c4b5fd;margin:6px 0 0;font-size:14px;">Notifica automatica da Storie Amiche</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        Il tuo paziente <strong style="color:#4f46e5;">${childName}</strong> ha completato una sessione dell'EmoGame
        <strong>"${emoGame.title || 'EmoGame'}"</strong>.
      </p>

      <!-- Score Card -->
      <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:12px;padding:20px 24px;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
        <div style="text-align:center;min-width:80px;">
          <div style="font-size:36px;font-weight:900;color:#6d28d9;">${score}/${total}</div>
          <div style="font-size:13px;color:#7c3aed;font-weight:bold;">${scorePercent}%</div>
        </div>
        <div style="border-left:2px solid #c4b5fd;padding-left:16px;flex:1;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Bambino</p>
          <p style="margin:0 0 8px;font-weight:bold;color:#1f2937;">${childName}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Giocato il</p>
          <p style="margin:0;font-weight:bold;color:#1f2937;">${playedAt}</p>
        </div>
      </div>

      <!-- Tabella Risposte -->
      ${risposteHtml ? `
      <h3 style="font-size:15px;font-weight:800;color:#374151;margin:0 0 12px;">📋 Dettaglio Risposte</h3>
      <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead>
          <tr style="background:#ede9fe;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6d28d9;font-weight:800;text-transform:uppercase;letter-spacing:.05em;">Domanda</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6d28d9;font-weight:800;text-transform:uppercase;letter-spacing:.05em;">Risposta</th>
          </tr>
        </thead>
        <tbody>${risposteHtml}</tbody>
      </table>` : ''}

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${analyticsUrl}" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:800;font-size:15px;letter-spacing:.02em;">
          📊 Vai alla Dashboard Analytics
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Storie Amiche — notifica automatica. Non rispondere a questa email.</p>
    </div>
  </div>
</body>
</html>`;

        // Mandiamo l'email a tutti i terapisti accettati
        for (const { therapistId } of acceptedTherapists) {
            const therapistEmail = therapistId?.anagrafica?.email;
            const therapistName = therapistId?.anagrafica?.nome || 'Terapista';
            if (!therapistEmail) continue;

            await sendEmail({
                to: therapistEmail,
                subject: `🎮 ${childName} ha completato un EmoGame — ${score}/${total} risposte corrette`,
                customHtml: emailHtml.replace('Terapista', therapistName)
            });
        }
    } catch (err) {
        console.error('sendTherapistNotification error:', err);
    }
}
