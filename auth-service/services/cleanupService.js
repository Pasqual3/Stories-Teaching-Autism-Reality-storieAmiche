import mongoose from 'mongoose';
import { userModel } from '../models/userModel.js';
import { sendEmail } from '../utils/emailClient.js';

export const runCleanupJob = async () => {
    console.log('[cleanup-job] Avvio del processo di pulizia utenti non verificati...');

    try {
        // Threshold temporali
        const now = Date.now();
        const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
        const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

        const warningThreshold = new Date(now - tenDaysMs);
        const deletionThreshold = new Date(now - fifteenDaysMs);

        // -------------------------------------------------------------
        // FASE 1: Invio email di avviso (Utenti non verificati da 10-15 giorni)
        // -------------------------------------------------------------
        const usersToWarn = await userModel.find({
            isAccountVerified: false,
            verificationWarningSent: { $ne: true },
            createdAt: { $lt: warningThreshold, $gt: deletionThreshold }
        });

        console.log(`[cleanup-job] Trovati ${usersToWarn.length} utenti da avvisare.`);

        for (const user of usersToWarn) {
            try {
                console.log(`[cleanup-job] Invio avviso a: ${user.anagrafica.email}`);
                
                await sendEmail({
                    to: user.anagrafica.email,
                    subject: "Azione richiesta: Verifica il tuo account Storie Amiche",
                    customHtml: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; rounded: 8px;">
                            <h2 style="color: #8b5cf6;">Ciao ${user.anagrafica.nome}, verifica il tuo account!</h2>
                            <p>Ti ricordiamo che l'account registrato su <strong>Storie Amiche</strong> non è ancora stato verificato.</p>
                            <p style="background-color: #fff3cd; color: #856404; padding: 12px; border-left: 4px solid #ffc107; font-weight: bold;">
                                ⚠️ ATTENZIONE: Se non completi la verifica dell'account entro 5 giorni, l'account e tutti i dati registrati verranno eliminati definitivamente per motivi di sicurezza e tutela della privacy.
                            </p>
                            <p>Per confermare il tuo account, effettua l'accesso e inserisci il codice di verifica OTP inviato via email.</p>
                            <br/>
                            <p>Un cordiale saluto,<br/><strong>Il Team di Storie Amiche</strong></p>
                        </div>
                    `
                });

                // Segna come avvisato nel database
                user.verificationWarningSent = true;
                await user.save();
                
            } catch (err) {
                console.error(`[cleanup-job] Errore invio avviso a ${user.anagrafica.email}:`, err.message);
            }
        }

        // -------------------------------------------------------------
        // FASE 2: Eliminazione utenti non verificati (oltre 15 giorni)
        // -------------------------------------------------------------
        const usersToDelete = await userModel.find({
            isAccountVerified: false,
            createdAt: { $lt: deletionThreshold }
        });

        console.log(`[cleanup-job] Trovati ${usersToDelete.length} utenti da eliminare definitivamente.`);

        for (const user of usersToDelete) {
            try {
                const userIdStr = user._id.toString();
                console.log(`[cleanup-job] Eliminazione definitiva utente: ${user.anagrafica.email} (ID: ${userIdStr})`);

                // 1. Elimina i dati associati in cascata da tutte le collezioni del DB
                const db = mongoose.connection.db;
                
                // Rimuove sessioni cliniche, note e risposte ai giochi
                const collections = [
                    'sessions', 
                    'notes', 
                    'baselines', 
                    'gamesessions', 
                    'emogameresponses', 
                    'strangestoryresponses'
                ];

                for (const colName of collections) {
                    try {
                        const result = await db.collection(colName).deleteMany({ parentId: userIdStr });
                        if (result.deletedCount > 0) {
                            console.log(`[cleanup-job] Rimosse ${result.deletedCount} voci da '${colName}' per il parent ${userIdStr}`);
                        }
                    } catch (colErr) {
                        console.warn(`[cleanup-job] Avviso durante rimozione da '${colName}':`, colErr.message);
                    }
                }

                // 2. Elimina il record dell'utente stesso
                await userModel.deleteOne({ _id: user._id });
                console.log(`[cleanup-job] Utente ${user.anagrafica.email} eliminato con successo.`);

            } catch (err) {
                console.error(`[cleanup-job] Errore eliminazione utente ${user.anagrafica.email}:`, err.message);
            }
        }

        console.log('[cleanup-job] Processo di pulizia completato.');

    } catch (error) {
        console.error('[cleanup-job] Errore critico nel processo di pulizia:', error.message);
    }
};
