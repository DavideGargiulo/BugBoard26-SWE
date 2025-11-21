import express from 'express';
import cors from 'cors';
import pg from 'pg';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware base
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:9000'],
  credentials: true
}));
app.use(express.json());

// Configurazione Database
const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => console.log('✅ Connesso a PostgreSQL con successo'))
  .catch(err => console.error('❌ Errore connessione DB:', err));

// -------------------------------------------------------
//   CONFIGURAZIONE AUTHENTIK
// -------------------------------------------------------

const AUTHENTIK_BASE_URL = process.env.AUTHENTIK_URL || 'http://authentik-server:9000';
const CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET;
const REDIRECT_URI = process.env.AUTHENTIK_REDIRECT_URI || 'http://localhost:4200/auth/callback';

// Endpoints Authentik
const AUTHENTIK_ENDPOINTS = {
  authorize: `${AUTHENTIK_BASE_URL}/application/o/authorize/`,
  token: `${AUTHENTIK_BASE_URL}/application/o/token/`,
  userinfo: `${AUTHENTIK_BASE_URL}/application/o/userinfo/`,
  logout: `${AUTHENTIK_BASE_URL}/application/o/revoke/`
};

console.log('🔐 Configurazione Authentik:');
console.log('   - Base URL:', AUTHENTIK_BASE_URL);
console.log('   - Client ID:', CLIENT_ID);
console.log('   - Redirect URI:', REDIRECT_URI);

// -------------------------------------------------------
//   ROUTES AUTENTICAZIONE
// -------------------------------------------------------

/**
 * GET /login
 * Reindirizza l'utente alla pagina di login di Authentik
 * (Utile per test diretti, ma in headless il frontend gestisce il redirect)
 */
app.get('/login', (req, res) => {
  const authUrl = `${AUTHENTIK_ENDPOINTS.authorize}?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=openid profile email`;

  console.log('🔗 Redirect a Authentik:', authUrl);
  res.redirect(authUrl);
});

/**
 * POST /api/auth/token
 * Endpoint headless: Il frontend invia il code, il backend lo scambia per token
 */
app.post('/api/auth/token', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: 'Codice di autorizzazione mancante',
      message: 'Il parametro "code" è obbligatorio'
    });
  }

  console.log('🔄 Scambio code per token...');

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    });

    const tokenResponse = await axios.post(
      AUTHENTIK_ENDPOINTS.token,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in, token_type } = tokenResponse.data;

    console.log('✅ Token ricevuto con successo');

    const userResponse = await axios.get(AUTHENTIK_ENDPOINTS.userinfo, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    console.log('👤 User info:', userResponse.data.email);

    res.json({
      success: true,
      access_token,
      refresh_token,
      expires_in,
      token_type,
      user: userResponse.data
    });

  } catch (error) {
    console.error('❌ Errore scambio token:', error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      error: 'Autenticazione fallita',
      message: error.response?.data?.error_description || error.message,
      details: error.response?.data
    });
  }
});

/**
 * GET /api/auth/get-authorization-url
 * Restituisce l'URL per ottenere il code (helper per test)
 */
app.get('/api/auth/get-authorization-url', (req, res) => {
  const authUrl = `${AUTHENTIK_ENDPOINTS.authorize}?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=openid profile email`;

  res.json({
    authorization_url: authUrl,
    instructions: [
      '1. Copia questo URL e aprilo nel browser',
      '2. Effettua il login con le tue credenziali',
      '3. Dopo il redirect, copia il parametro "code" dall\'URL',
      '4. Chiama POST /api/auth/token con il code ottenuto'
    ]
  });
});

/**
 * POST /api/auth/headless-login
 * Login completamente headless simulando il flusso OAuth2
 * Questo bypassa il browser usando le API interne di Authentik
 */
app.post('/api/auth/headless-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Credenziali mancanti',
      message: 'Username e password sono obbligatori'
    });
  }

  console.log('🔐 Login headless per:', username);

  try {
    // Step 1: Ottieni il CSRF token e session cookie
    console.log('📝 Step 1: Ottengo CSRF token...');
    const loginPageResponse = await axios.get(
      `${AUTHENTIK_BASE_URL}/flows/executor/default-authentication-flow/`,
      {
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      }
    );

    const cookies = loginPageResponse.headers['set-cookie'] || [];
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    // Estrai CSRF token dalla pagina HTML
    const csrfMatch = loginPageResponse.data.match(/csrfmiddlewaretoken['"]\s*value=['"]([^'"]+)['"]/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;

    if (!csrfToken) {
      console.log('⚠️ CSRF token non trovato, provo senza...');
    }

    // Step 2: Effettua il login
    console.log('🔑 Step 2: Effettuo login...');
    const loginData = new URLSearchParams({
      uid_field: username,
      password: password,
      csrfmiddlewaretoken: csrfToken || ''
    });

    const loginResponse = await axios.post(
      `${AUTHENTIK_BASE_URL}/flows/executor/default-authentication-flow/`,
      loginData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieHeader,
          'Referer': `${AUTHENTIK_BASE_URL}/flows/executor/default-authentication-flow/`
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      }
    );

    // Step 3: Ottieni authorization code
    console.log('🎫 Step 3: Ottengo authorization code...');
    const authUrl = `${AUTHENTIK_ENDPOINTS.authorize}?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=openid profile email`;

    const updatedCookies = [...cookies, ...(loginResponse.headers['set-cookie'] || [])];
    const updatedCookieHeader = updatedCookies.map(c => c.split(';')[0]).join('; ');

    const authorizeResponse = await axios.get(authUrl, {
      headers: {
        'Cookie': updatedCookieHeader
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status < 400
    });

    // Estrai il code dal redirect
    const locationHeader = authorizeResponse.headers.location;
    if (!locationHeader) {
      throw new Error('Redirect location non trovato');
    }

    const codeMatch = locationHeader.match(/code=([^&]+)/);
    if (!codeMatch) {
      throw new Error('Authorization code non trovato nel redirect');
    }

    const code = codeMatch[1];
    console.log('✅ Code ottenuto:', code.substring(0, 10) + '...');

    // Step 4: Scambia il code per token
    console.log('🔄 Step 4: Scambio code per token...');
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    });

    const tokenResponse = await axios.post(
      AUTHENTIK_ENDPOINTS.token,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in, token_type } = tokenResponse.data;

    // Step 5: Recupera le informazioni utente
    console.log('👤 Step 5: Recupero info utente...');
    const userResponse = await axios.get(AUTHENTIK_ENDPOINTS.userinfo, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    console.log('✅ Login headless completato con successo!');

    res.json({
      success: true,
      access_token,
      refresh_token,
      expires_in,
      token_type,
      user: userResponse.data
    });

  } catch (error) {
    console.error('❌ Errore login headless:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    res.status(error.response?.status || 500).json({
      error: 'Login fallito',
      message: 'Username o password non validi, oppure problema nel flusso di autenticazione',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/direct-login
 * Login diretto usando le API interne di Authentik
 */
app.post('/api/auth/direct-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Credenziali mancanti',
      message: 'Username e password sono obbligatori'
    });
  }

  console.log('🔐 Login diretto per:', username);

  try {
    // Prova a usare l'API /api/v3/flows/executor/ di Authentik
    console.log('📡 Tentativo con API Flows Executor...');

    // Step 1: Inizia il flow
    const flowInitResponse = await axios.get(
      `${AUTHENTIK_BASE_URL}/api/v3/flows/instances/default-authentication-flow/execute/`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const flowPlan = flowInitResponse.data;
    console.log('✅ Flow inizializzato:', flowPlan.flow_info?.title);

    // Step 2: Invia le credenziali
    const loginResponse = await axios.post(
      `${AUTHENTIK_BASE_URL}/api/v3/flows/executor/default-authentication-flow/`,
      {
        uid_field: username,
        password: password
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-authentik-flow-slug': 'default-authentication-flow'
        }
      }
    );

    console.log('Login response:', loginResponse.data);

    // Se arriviamo qui, continua con OAuth2 flow...
    res.status(501).json({
      error: 'Work in progress',
      message: 'Il flusso API è ancora in sviluppo. Usa il metodo browser per ora.',
      flow_response: loginResponse.data
    });

  } catch (error) {
    console.error('❌ Errore API flow:', error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      error: 'Login fallito',
      message: 'Impossibile autenticare tramite API',
      details: error.response?.data || error.message
    });
  }
});

/**
 * POST /api/auth/simple-login
 * Metodo semplificato: Crea un service account token per test
 */
app.post('/api/auth/simple-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Credenziali mancanti'
    });
  }

  // IMPORTANTE: Questa è una soluzione temporanea per development
  // In produzione NON dovresti mai gestire le password direttamente

  res.status(501).json({
    error: 'Metodo non implementato',
    message: 'Authentik non supporta ROPC. Soluzioni alternative:',
    alternatives: [
      {
        method: 'Authorization Code Flow',
        description: 'Usa il browser per ottenere il code, poi chiamare /api/auth/token',
        steps: [
          '1. Apri: http://localhost:9000/application/o/authorize/?client_id=' + CLIENT_ID + '&response_type=code&redirect_uri=http://localhost:4200/auth/callback&scope=openid%20profile%20email',
          '2. Login con username/password',
          '3. Copia il code dall\'URL di redirect',
          '4. POST /api/auth/token con {"code": "..."}'
        ]
      },
      {
        method: 'Service Account Token',
        description: 'Crea un token permanente in Authentik per test',
        steps: [
          '1. Vai su http://localhost:9000',
          '2. Admin → Directory → Tokens',
          '3. Crea nuovo token con l\'utente',
          '4. Usa il token direttamente nelle richieste'
        ]
      }
    ]
  });
});

/**
 * POST /api/auth/refresh
 * Rinnova l'access token usando il refresh token
 */
app.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: 'Refresh token mancante'
    });
  }

  console.log('🔄 Refresh token in corso...');

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });

    const tokenResponse = await axios.post(
      AUTHENTIK_ENDPOINTS.token,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Token rinnovato con successo');

    res.json({
      success: true,
      access_token: tokenResponse.data.access_token,
      expires_in: tokenResponse.data.expires_in,
      token_type: tokenResponse.data.token_type
    });

  } catch (error) {
    console.error('❌ Errore refresh token:', error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      error: 'Refresh token fallito',
      message: error.response?.data?.error_description || error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login headless con username e password (ROPC flow)
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Credenziali mancanti',
      message: 'Username e password sono obbligatori'
    });
  }

  console.log('🔐 Login headless per:', username);

  try {
    // Usa Resource Owner Password Credentials Grant
    const params = new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'openid profile email'
    });

    // Richiesta token ad Authentik
    const tokenResponse = await axios.post(
      AUTHENTIK_ENDPOINTS.token,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in, token_type } = tokenResponse.data;

    console.log('✅ Login effettuato con successo');

    // Recupera le informazioni utente
    const userResponse = await axios.get(AUTHENTIK_ENDPOINTS.userinfo, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    console.log('👤 User:', userResponse.data.email);

    // Risposta con token e user info
    res.json({
      success: true,
      access_token,
      refresh_token,
      expires_in,
      token_type,
      user: userResponse.data
    });

  } catch (error) {
    console.error('❌ Errore login:', error.response?.data || error.message);

    res.status(error.response?.status || 401).json({
      error: 'Autenticazione fallita',
      message: error.response?.data?.error_description || 'Username o password non validi',
      details: error.response?.data
    });
  }
});

/**
 * POST /api/auth/logout
 * Revoca il token (logout)
 */
app.post('/api/auth/logout', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Token mancante'
    });
  }

  console.log('🚪 Logout in corso...');

  try {
    const params = new URLSearchParams({
      token: token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });

    await axios.post(
      AUTHENTIK_ENDPOINTS.logout,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Logout effettuato');

    res.json({
      success: true,
      message: 'Logout effettuato con successo'
    });

  } catch (error) {
    console.error('❌ Errore logout:', error.response?.data || error.message);

    // Anche se c'è un errore, consideriamo il logout valido lato client
    res.json({
      success: true,
      message: 'Logout effettuato (con warning)'
    });
  }
});

/**
 * GET /api/auth/userinfo
 * Recupera le informazioni dell'utente corrente
 */
app.get('/api/auth/userinfo', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token mancante',
      message: 'Header Authorization non presente o malformato'
    });
  }

  const token = authHeader.substring(7);

  try {
    const userResponse = await axios.get(AUTHENTIK_ENDPOINTS.userinfo, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    res.json({
      success: true,
      user: userResponse.data
    });

  } catch (error) {
    console.error('❌ Errore recupero userinfo:', error.response?.data || error.message);

    res.status(error.response?.status || 401).json({
      error: 'Token non valido o scaduto',
      message: error.response?.data?.error || error.message
    });
  }
});

// -------------------------------------------------------
//   MIDDLEWARE AUTENTICAZIONE
// -------------------------------------------------------

/**
 * Middleware per proteggere le route
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Non autorizzato',
      message: 'Token di autenticazione mancante'
    });
  }

  const token = authHeader.substring(7);

  try {
    // Valida il token con Authentik
    const userResponse = await axios.get(AUTHENTIK_ENDPOINTS.userinfo, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Aggiungi i dati utente alla request
    req.user = userResponse.data;
    next();

  } catch (error) {
    return res.status(401).json({
      error: 'Token non valido',
      message: 'Il token è scaduto o non è valido'
    });
  }
}

// -------------------------------------------------------
//   ROUTES APPLICAZIONE
// -------------------------------------------------------

// Rotta pubblica
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Backend Express BugBoard attivo!",
    version: "1.0.0",
    authentik: {
      configured: !!CLIENT_ID,
      baseUrl: AUTHENTIK_BASE_URL
    }
  });
});

// Rotta protetta di esempio
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({
    message: "✅ Rotta protetta raggiunta con successo!",
    user: {
      sub: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      preferred_username: req.user.preferred_username
    }
  });
});

// Rotta protetta: Ottieni profilo utente
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    success: true,
    profile: req.user
  });
});

// -------------------------------------------------------
//   GESTIONE ERRORI
// -------------------------------------------------------

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trovato',
    path: req.path
  });
});

// Error handler globale
app.use((err, req, res, next) => {
  console.error('❌ Errore non gestito:', err);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Si è verificato un errore'
  });
});

// -------------------------------------------------------
//   AVVIO SERVER
// -------------------------------------------------------

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Endpoints Autenticazione:');
  console.log('   POST /api/auth/token      - Scambio code per token');
  console.log('   POST /api/auth/refresh    - Rinnova access token');
  console.log('   POST /api/auth/logout     - Logout utente');
  console.log('   GET  /api/auth/userinfo   - Info utente corrente');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 Endpoints Applicazione:');
  console.log('   GET  /                    - Health check');
  console.log('   GET  /api/protected       - Esempio rotta protetta');
  console.log('   GET  /api/profile         - Profilo utente');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});