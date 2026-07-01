export const EMAIL_VERIFY_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Verifica Email</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
    .otp-box {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 700;
      color: #15803d;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 0;
    }
    .otp-label {
      font-size: 13px;
      color: #16a34a;
      margin: 8px 0 0 0;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-box {
      background-color: #f8fafc;
      border-left: 4px solid #4f46e5;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .info-text {
      font-size: 14px;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      margin: 8px 0;
      box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .otp-code {
        font-size: 28px;
        letter-spacing: 4px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">🔐 Verifica Account</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Verifica il tuo indirizzo email</h2>
              <p class="text">Sei a un passo dal completare la verifica del tuo account associato a <span class="highlight">{{email}}</span>.</p>
              <p class="text" style="font-weight: 600; color: #334155;">Utilizza il codice OTP qui sotto per confermare la tua identità:</p>
              
              <div class="otp-box">
                <p class="otp-code">{{otp}}</p>
                <p class="otp-label">Codice di verifica</p>
              </div>
              
              <div class="info-box">
                <p class="info-text">⏰ Questo codice è valido per <strong>24 ore</strong>. Non condividerlo con nessuno.</p>
              </div>
              
              <p class="text" style="margin-top: 24px; font-size: 13px; color: #64748b;">
                Se non hai richiesto questa verifica, puoi ignorare questa email in tutta sicurezza.
              </p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PASSWORD_RESET_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Reset Password</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
    .otp-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 700;
      color: #b45309;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 0;
    }
    .otp-label {
      font-size: 13px;
      color: #d97706;
      margin: 8px 0 0 0;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .warning-text {
      font-size: 14px;
      color: #991b1b;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .otp-code {
        font-size: 28px;
        letter-spacing: 4px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">🔑 Recupero Password</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Password dimenticata?</h2>
              <p class="text">Abbiamo ricevuto una richiesta di reset della password per l'account associato a <span class="highlight">{{email}}</span>.</p>
              <p class="text" style="font-weight: 600; color: #334155;">Usa il codice OTP qui sotto per reimpostare la tua password:</p>
              
              <div class="otp-box">
                <p class="otp-code">{{otp}}</p>
                <p class="otp-label">Codice di reset</p>
              </div>
              
              <div class="warning-box">
                <p class="warning-text">⏱️ Questo codice scade tra <strong>15 minuti</strong>. Se non l'hai richiesto tu, ignora questa email.</p>
              </div>
              
              <p class="text" style="margin-top: 24px; font-size: 13px; color: #64748b;">
                Per motivi di sicurezza, non condividere mai questo codice con nessuno.
              </p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PROFILE_UPDATE_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Profilo Aggiornato</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .success-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-radius: 50%;
      margin: 0 auto 24px;
      text-align: center;
      line-height: 64px;
      font-size: 32px;
    }
    .details-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;
      margin: 24px 0;
    }
    .detail-row {
      font-size: 14px;
      color: #475569;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-weight: 600;
      color: #334155;
    }
    .alert-box {
      background-color: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .alert-text {
      font-size: 14px;
      color: #9a3412;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">👤 Aggiornamento Profilo</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <div class="success-icon">✅</div>
              <h2 class="title" style="text-align: center;">Profilo Aggiornato con Successo</h2>
              <p class="text" style="text-align: center;">Ciao <strong>{{name}}</strong>,</p>
              <p class="text" style="text-align: center;">Le modifiche al tuo profilo sono state salvate correttamente.</p>
              
              <div class="details-box">
                <p class="detail-row"><span class="detail-label">Email associata:</span> {{email}}</p>
                <p class="detail-row"><span class="detail-label">Data modifica:</span> {{date}}</p>
              </div>
              
              <div class="alert-box">
                <p class="alert-text">🔒 <strong>Non hai effettuato tu questa modifica?</strong> Contatta immediatamente il nostro supporto per proteggere il tuo account.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const STORY_CREATED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Nuova Storia Creata</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .story-box {
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
      border: 1px solid #e9d5ff;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
    }
    .story-title {
      font-size: 18px;
      font-weight: 700;
      color: #6b21a8;
      margin: 0 0 12px 0;
    }
    .story-detail {
      font-size: 14px;
      color: #7c3aed;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .story-detail:last-child {
      margin-bottom: 0;
    }
    .badge {
      display: inline-block;
      background-color: #f3e8ff;
      color: #7c3aed;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cta-box {
      text-align: center;
      margin: 28px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">📖 Nuova Storia</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Storia Pubblicata!</h2>
              <p class="text">Ciao <strong>{{name}}</strong>,</p>
              <p class="text">La tua storia è stata creata e pubblicata con successo. Ecco i dettagli:</p>
              
              <div class="story-box">
                <p class="story-title">"{{title}}"</p>
                <p class="story-detail"><strong>Descrizione:</strong> {{description}}</p>
                <p class="story-detail"><span class="badge">{{visibility}}</span></p>
              </div>
              
              <p class="text" style="text-align: center; font-size: 14px; color: #64748b;">
                ✨ Continua a creare storie meravigliose per i tuoi bambini!
              </p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const STORY_UPDATED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Storia Modificata</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .update-box {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
    }
    .update-title {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
      margin: 0 0 12px 0;
    }
    .update-detail {
      font-size: 14px;
      color: #b45309;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .update-detail:last-child {
      margin-bottom: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">✏️ Modifica Storia</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Storia Aggiornata</h2>
              <p class="text">Ciao <strong>{{name}}</strong>,</p>
              <p class="text">Le modifiche alla tua storia sono state salvate con successo.</p>
              
              <div class="update-box">
                <p class="update-title">"{{title}}"</p>
                <p class="update-detail"><strong>Data aggiornamento:</strong> {{date}}</p>
                <p class="update-detail"><strong>Stato:</strong> In attesa di revisione</p>
              </div>
              
              <p class="text" style="font-size: 14px; color: #64748b;">
                La storia verrà nuovamente sottoposta al terapista per approvazione.
              </p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const DELETE_OTP_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Eliminazione Account</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .danger-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-radius: 50%;
      margin: 0 auto 24px;
      text-align: center;
      line-height: 64px;
      font-size: 32px;
    }
    .otp-box {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 700;
      color: #b91c1c;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 0;
    }
    .otp-label {
      font-size: 13px;
      color: #dc2626;
      margin: 8px 0 0 0;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 20px;
      border-radius: 0 10px 10px 0;
      margin: 24px 0;
    }
    .warning-title {
      font-size: 16px;
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 8px 0;
    }
    .warning-text {
      font-size: 14px;
      color: #7f1d1d;
      margin: 0;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .otp-code {
        font-size: 28px;
        letter-spacing: 4px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">⚠️ Eliminazione Account</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <div class="danger-icon">🗑️</div>
              <h2 class="title" style="text-align: center;">Conferma Eliminazione Profilo</h2>
              <p class="text">Ciao <strong>{{name}}</strong>,</p>
              <p class="text">Hai richiesto l'eliminazione permanente del tuo profilo. Per confermare questa operazione, usa il codice seguente:</p>
              
              <div class="otp-box">
                <p class="otp-code">{{otp}}</p>
                <p class="otp-label">Codice di conferma • Valido 15 minuti</p>
              </div>
              
              <div class="warning-box">
                <p class="warning-title">⚠️ ATTENZIONE: Azione Irreversibile</p>
                <p class="warning-text">Una volta eliminato il profilo, <strong>tutti i tuoi dati</strong> (storie, bambini, progressi) saranno persi definitivamente e non potranno essere recuperati.</p>
              </div>
              
              <p class="text" style="margin-top: 24px; font-size: 13px; color: #64748b;">
                Se non hai richiesto questa operazione, <strong>ignora questa email</strong> e il tuo account rimarrà al sicuro.
              </p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const CHILD_ADDED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Nuovo Bambino Aggiunto</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .child-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .child-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .child-name {
      font-size: 20px;
      font-weight: 700;
      color: #065f46;
      margin: 0;
    }
    .child-label {
      font-size: 13px;
      color: #059669;
      margin: 4px 0 0 0;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-box {
      background-color: #f8fafc;
      border-left: 4px solid #10b981;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .info-text {
      font-size: 14px;
      color: #475569;
      margin: 0;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">👶 Nuovo Esploratore</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Profilo Bambino Aggiunto!</h2>
              <p class="text">Ciao,</p>
              <p class="text">È stato aggiunto un nuovo profilo bambino al tuo account. Ora può accedere alla piattaforma in modo semplificato!</p>
              
              <div class="child-box">
                <div class="child-icon">🚀</div>
                <p class="child-name">{{childName}}</p>
                <p class="child-label">Nuovo esploratore</p>
              </div>
              
              <div class="info-box">
                <p class="info-text">🔒 <strong>Sicurezza:</strong> Se non hai effettuato tu questa operazione, contattaci immediatamente per proteggere il tuo account.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const THERAPIST_ADDED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Richiesta Collaborazione</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .invitation-box {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
    }
    .invitation-title {
      font-size: 16px;
      font-weight: 600;
      color: #3730a3;
      margin: 0 0 12px 0;
    }
    .invitation-detail {
      font-size: 14px;
      color: #4338ca;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .invitation-detail:last-child {
      margin-bottom: 0;
    }
    .cta-box {
      text-align: center;
      margin: 28px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">🤝 Collaborazione</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Nuova Richiesta di Collaborazione</h2>
              <p class="text">Ciao <strong>{{therapistName}}</strong>,</p>
              <p class="text">Un genitore ti ha invitato a seguire il percorso dei suoi bambini sulla nostra piattaforma.</p>
              
              <div class="invitation-box">
                <p class="invitation-title">Dettagli del genitore:</p>
                <p class="invitation-detail"><strong>Nome:</strong> {{parentName}}</p>
                <p class="invitation-detail"><strong>Email:</strong> {{parentEmail}}</p>
              </div>
              
              <p class="text">Accettando l'invito, potrai:</p>
              <p class="text" style="margin-left: 20px; font-size: 14px; color: #64748b;">
                • Visualizzare i progressi dei bambini<br>
                • Revisionare e approvare le storie create<br>
                • Collaborare attivamente con il genitore
              </p>
              
              <div class="cta-box">
                <a href="{{dashboardUrl}}" class="button">Vai alla Dashboard</a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const INVITATION_ACCEPTED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Invito Accettato</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .success-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .success-text {
      font-size: 18px;
      font-weight: 700;
      color: #065f46;
      margin: 0;
    }
    .success-detail {
      font-size: 14px;
      color: #059669;
      margin: 8px 0 0 0;
    }
    .features-box {
      background-color: #f8fafc;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .feature-item {
      font-size: 14px;
      color: #475569;
      margin: 0 0 8px 0;
      padding-left: 24px;
      position: relative;
      line-height: 1.5;
    }
    .feature-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">✅ Collaborazione Attiva</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Invito Accettato!</h2>
              <p class="text">Ciao <strong>{{parentName}}</strong>,</p>
              <p class="text">Ottime notizie! Il terapista ha accettato il tuo invito di collaborazione.</p>
              
              <div class="success-box">
                <div class="success-icon">🎉</div>
                <p class="success-text">{{therapistName}}</p>
                <p class="success-detail">Ora fa parte del tuo team di supporto</p>
              </div>
              
              <div class="features-box">
                <p class="feature-item">Visualizza i progressi dei tuoi bambini</p>
                <p class="feature-item">Revisione attiva delle storie create</p>
                <p class="feature-item">Supporto professionale dedicato</p>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const INVITATION_REJECTED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Invito Non Accettato</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .info-box {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .info-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .info-text {
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
      margin: 0;
    }
    .info-detail {
      font-size: 14px;
      color: #b45309;
      margin: 8px 0 0 0;
    }
    .cta-box {
      text-align: center;
      margin: 28px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">⏳ Invito in Attesa</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Invito Non Accettato</h2>
              <p class="text">Ciao <strong>{{parentName}}</strong>,</p>
              <p class="text">Ti informiamo che il terapista <strong>{{therapistName}}</strong> non ha potuto accettare la tua richiesta di collaborazione in questo momento.</p>
              
              <div class="info-box">
                <div class="info-icon">🤔</div>
                <p class="info-text">Nessun problema!</p>
                <p class="info-detail">Puoi cercare un altro professionista dalla lista dei terapisti disponibili.</p>
              </div>
              
              <div class="cta-box">
                <a href="{{therapistsUrl}}" class="button">Trova un Terapista</a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const STORY_PENDING_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Storia da Revisionare</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .pending-box {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
    }
    .pending-title {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
      margin: 0 0 12px 0;
    }
    .pending-detail {
      font-size: 14px;
      color: #b45309;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .pending-detail:last-child {
      margin-bottom: 0;
    }
    .cta-box {
      text-align: center;
      margin: 28px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">⏳ Revisione</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Nuova Storia da Revisionare</h2>
              <p class="text">Ciao <strong>{{therapistName}}</strong>,</p>
              <p class="text">Una nuova storia è in attesa della tua approvazione. Ecco i dettagli:</p>
              
              <div class="pending-box">
                <p class="pending-title">"{{storyTitle}}"</p>
                <p class="pending-detail"><strong>Creata da:</strong> {{parentName}}</p>
                <p class="pending-detail"><strong>Stato:</strong> In attesa di revisione</p>
              </div>
              
              <div class="cta-box">
                <a href="{{dashboardUrl}}" class="button">Vai alla Dashboard</a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const STORY_APPROVED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Storia Approvata</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .approved-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 32px 24px;
      margin: 24px 0;
      text-align: center;
    }
    .approved-icon {
      font-size: 56px;
      margin-bottom: 16px;
    }
    .approved-title {
      font-size: 24px;
      font-weight: 700;
      color: #065f46;
      margin: 0 0 8px 0;
    }
    .story-name {
      font-size: 18px;
      font-weight: 600;
      color: #059669;
      margin: 0 0 12px 0;
      font-style: italic;
    }
    .approved-detail {
      font-size: 14px;
      color: #047857;
      margin: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
      .approved-title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">✅ Approvazione</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Storia Approvata!</h2>
              <p class="text">Ciao <strong>{{parentName}}</strong>,</p>
              <p class="text">Ottime notizie! La tua storia è stata revisionata e approvata dal terapista.</p>
              
              <div class="approved-box">
                <div class="approved-icon">🎉</div>
                <p class="approved-title">Approvata con Successo</p>
                <p class="story-name">"{{storyTitle}}"</p>
                <p class="approved-detail">Ora è visibile al bambino e può essere letta!</p>
              </div>
              
              <p class="text" style="text-align: center; font-size: 14px; color: #64748b;">
                Continua a creare storie meravigliose per i tuoi bambini.
              </p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const STORY_REJECTED_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Storia Non Approvata</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }
    .main-content {
      padding: 40px;
      color: #1e293b;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .rejected-box {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
    }
    .rejected-title {
      font-size: 18px;
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 12px 0;
    }
    .rejected-detail {
      font-size: 14px;
      color: #7f1d1d;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .rejected-detail:last-child {
      margin-bottom: 0;
    }
    .reason-box {
      background-color: #ffffff;
      border-left: 4px solid #dc2626;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 16px 0 0 0;
    }
    .reason-text {
      font-size: 14px;
      color: #991b1b;
      margin: 0;
      line-height: 1.6;
      font-style: italic;
    }
    .cta-box {
      text-align: center;
      margin: 28px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 20px 16px;
      }
      .main-content {
        padding: 32px 24px;
      }
      .header {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <table class="container" width="560" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 class="header-title">❌ Revisione</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <h2 class="title">Storia Non Approvata</h2>
              <p class="text">Ciao <strong>{{parentName}}</strong>,</p>
              <p class="text">Il terapista ha revisionato la tua storia ma ha richiesto alcune modifiche prima dell'approvazione.</p>
              
              <div class="rejected-box">
                <p class="rejected-title">"{{storyTitle}}"</p>
                <p class="rejected-detail"><strong>Stato:</strong> Richiesta revisione</p>
                <div class="reason-box">
                  <p class="reason-text"><strong>Motivo:</strong> {{rejectionReason}}</p>
                </div>
              </div>
              
              <p class="text">Puoi modificare la storia tenendo conto del feedback e inviarla nuovamente per l'approvazione.</p>
              
              <div class="cta-box">
                <a href="{{editUrl}}" class="button">Modifica Storia</a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">Email inviata automaticamente • Non rispondere a questo messaggio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;