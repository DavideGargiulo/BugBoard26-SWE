import axios from 'axios';
import KeycloakService from '../services/KeycloakService.js';
import jwt from 'jsonwebtoken';
import syncService from '../services/syncService.js';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL?.trim();
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM?.trim();
const CLIENT_ID = process.env.KEYCLOAK_BACKEND_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.KEYCLOAK_BACKEND_CLIENT_SECRET?.trim();

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const USERINFO_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
const LOGOUT_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;

function userHasRole(accessToken, requiredRole) {
  try {
    const decoded = jwt.decode(accessToken);
    const roles = decoded.realm_access?.roles || [];
    return roles.includes(requiredRole);
  } catch (err) {
    console.error("Errore decode token:", err);
    return false;
  }
}

/**
 * Funzione helper per verificare e rinnovare il token se necessario
 */
async function ensureValidToken(req, res) {
  let accessToken = req.cookies.access_token;

  if (!accessToken) {
    return { valid: false, accessToken: null };
  }

  try {
    // Decodifica il token per verificare la scadenza
    const decoded = jwt.decode(accessToken);
    const now = Math.floor(Date.now() / 1000);

    // Se il token è valido (scade tra più di 30 secondi), restituiscilo
    if (decoded.exp && decoded.exp > now + 30) {
      return { valid: true, accessToken };
    }
  } catch (error) {
    console.log('Errore decodifica token, provo refresh:', error.message);
  }

  // Token scaduto o in scadenza, prova a fare refresh
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return { valid: false, accessToken: null };
  }

  try {
    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const refreshResponse = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`
        }
      }
    );

    const { access_token, refresh_token: new_refresh_token, expires_in } = refreshResponse.data;

    // Aggiorna i cookie
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: expires_in * 1000
    });

    res.cookie('refresh_token', new_refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log('Token rinnovato con successo');
    return { valid: true, accessToken: access_token };

  } catch (refreshError) {
    console.error('Errore refresh token:', refreshError.response?.data || refreshError.message);
    return { valid: false, accessToken: null };
  }
}

/**
 * Login con username/email e password
 */
export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatori' });
  }

  try {
    console.log('Tentativo di login per:', email);

    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', email);
    params.append('password', password);
    params.append('scope', 'openid profile email');

    const response = await axios.post(
      TOKEN_URL,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`
        }
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    console.log('Login effettuato con successo per:', email);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: expires_in * 1000
    });

    const refresh_token_maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: refresh_token_maxAge
    });

    return res.json({
      success: true,
      message: 'Login effettuato!',
      expiresIn: expires_in
    });

  } catch (error) {
    console.error('Errore durante il login:', error.response?.data || error.message);

    if (error.response?.status === 401 || error.response?.data?.error === 'unauthorized_client') {
      return res.status(401).json({
        error: 'Credenziali non valide o errore di configurazione client',
        details: error.response?.data?.error_description
      });
    }

    return res.status(500).json({
      error: 'Errore interno del server durante il login',
      details: error.response?.data?.error_description || error.message
    });
  }
};

/**
 * Verifica lo stato di autenticazione e restituisce i dati dell'utente
 */
export const checkAuthStatus = async (req, res) => {
  const tokenCheck = await ensureValidToken(req, res);

  if (!tokenCheck.valid) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const response = await axios.get(USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${tokenCheck.accessToken}`
      }
    });

    return res.json({
      authenticated: true,
      user: response.data
    });

  } catch (error) {
    console.error('Errore verifica autenticazione:', error.response?.data || error.message);
    return res.status(401).json({ authenticated: false });
  }
};

/**
 * Logout: cancella i cookie e revoca il token su Keycloak
 */
export const logout = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  try {
    if (refreshToken) {
      await axios.post(
        LOGOUT_URL,
        new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    }
  } catch (error) {
    console.error('Errore durante il logout su Keycloak:', error.response?.data || error.message);
  }

  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  return res.json({
    success: true,
    message: 'Logout effettuato'
  });
};

/**
 * POST /api/auth/register
 * Crea un nuovo utente su Keycloak (Headless)
 */
export const register = async (req, res) => {
  // Verifica e rinnova il token se necessario
  const tokenCheck = await ensureValidToken(req, res);

  if (!tokenCheck.valid) {
    return res.status(401).json({ error: "Non autenticato" });
  }

  // Verifica il ruolo con il token valido
  if (!userHasRole(tokenCheck.accessToken, "Amministratore")) {
    return res.status(403).json({ error: "Non autorizzato" });
  }

  const { nome, cognome, email, ruolo } = req.body;

  if (!email || !nome || !cognome) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
  }

  try {
    const result = await KeycloakService.registerUser({
      username: email,
      email,
      firstName: nome,
      lastName: cognome,
      role: ruolo || 'Standard'
    });

    const syncResult = await syncService.syncUserById(
      result.userId,
      KeycloakService.kcAdminClient,
      process.env.KEYCLOAK_REALM
    );

    if (!syncResult.success) {
      console.warn('Utente creato su Keycloak ma sincronizzazione DB fallita:', syncResult);
    } else {
      console.log('Utente sincronizzato nel database locale');
    }

    return res.status(201).json({
      success: true,
      message: 'Utente creato con successo',
      userId: result.userId,
      password: result.password,
      temporaryPassword: result.password
    });
  } catch (error) {
    console.error("Errore registrazione:", error.message);
    return res.status(500).json({ error: error.message });
  }
};