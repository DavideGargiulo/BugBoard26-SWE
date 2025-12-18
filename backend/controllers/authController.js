import axios from 'axios';
import crypto from 'crypto';
import KeycloakService from '../services/KeycloakService.js';
import syncService from '../services/syncService.js';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL?.trim();
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM?.trim();
const CLIENT_ID = process.env.KEYCLOAK_BACKEND_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.KEYCLOAK_BACKEND_CLIENT_SECRET?.trim();

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const USERINFO_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
const LOGOUT_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;

/**
 * Genera una password sicura
 * @param {number} length - Lunghezza della password (default: 16)
 * @returns {string} Password sicura generata
 */
const generateSecurePassword = (length = 16) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;

  // Assicuriamoci di avere almeno un carattere di ogni tipo
  let password = '';
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];

  // Riempi il resto della password
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Mescola i caratteri per randomizzare la posizione
  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
};

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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    };

    res.cookie('access_token', access_token, {
      ...cookieOptions,
      maxAge: expires_in * 1000
    });

    const refresh_token_maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    res.cookie('refresh_token', refresh_token, {
      ...cookieOptions,
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
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const accessToken = req.cookies.access_token || req.accessToken;

    const response = await axios.get(USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return res.json({
      authenticated: true,
      user: response.data,
      roles: {
        realm: req.user.realm_access?.roles || [],
        client: req.user.resource_access?.[CLIENT_ID]?.roles || []
      }
    });

  } catch (error) {
    console.error('Errore verifica autenticazione:', error.response?.data || error.message);

    return res.json({
      authenticated: true,
      user: {
        sub: req.user.sub,
        email: req.user.email,
        preferred_username: req.user.preferred_username,
        name: req.user.name,
        given_name: req.user.given_name,
        family_name: req.user.family_name
      },
      roles: {
        realm: req.user.realm_access?.roles || [],
        client: req.user.resource_access?.[CLIENT_ID]?.roles || []
      }
    });
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
      console.log('Logout su Keycloak completato');
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
 * NOTA: Protetto da protect() e checkRole('Amministratore') middleware
 */
export const register = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Non autenticato" });
  }

  const { nome, cognome, email, ruolo } = req.body;

  if (!email || !nome || !cognome) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
  }

  try {
    console.log(`Amministratore ${req.user.email} sta creando utente ${email}`);

    const securePassword = generateSecurePassword(16);

    const result = await KeycloakService.registerUser({
      username: email,
      email,
      firstName: nome,
      lastName: cognome,
      role: ruolo || 'Standard',
      password: securePassword
    });

    const syncResult = await syncService.syncUserById(
      result.userId,
      KeycloakService.kcAdminClient,
      process.env.KEYCLOAK_REALM
    );

    if (syncResult.success) {
      console.log('Utente sincronizzato nel database locale');
    } else {
      console.warn('Utente creato su Keycloak ma sincronizzazione DB fallita:', syncResult);
    }

    return res.status(201).json({
      success: true,
      message: 'Utente creato con successo',
      userId: result.userId,
      password: securePassword,
      createdBy: req.user.email
    });

  } catch (error) {
    console.error("Errore registrazione:", error.message);
    return res.status(500).json({
      error: error.message || 'Errore durante la creazione dell\'utente'
    });
  }
};