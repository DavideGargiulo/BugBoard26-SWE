import axios from 'axios';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM;
const CLIENT_ID = process.env.KEYCLOAK_BACKEND_CLIENT_ID;
const CLIENT_SECRET = process.env.KEYCLOAK_BACKEND_CLIENT_SECRET;

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const USERINFO_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
const LOGOUT_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;

/**
 * Login con username/email e password
 * Keycloak supporta il "Resource Owner Password Credentials Grant"
 */
export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono obbligatori' });
  }

  try {
    console.log('Tentativo di login per:', email);

    // Richiesta token a Keycloak usando Direct Access Grant (password grant)
    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username: email, // Keycloak accetta sia username che email
        password: password,
        scope: 'openid profile email'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    console.log('Login effettuato con successo per:', email);

    // Salva i token in cookie httpOnly
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: false, // Metti true in produzione con HTTPS
      sameSite: 'lax',
      maxAge: expires_in * 1000 // Converti secondi in millisecondi
    });

    const refresh_token_maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 giorni o 1 giorno

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

    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Credenziali non valide' });
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
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    // Richiedi info utente a Keycloak
    const response = await axios.get(USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return res.json({
      authenticated: true,
      user: response.data
    });

  } catch (error) {
    console.error('Errore verifica autenticazione:', error.response?.data || error.message);

    // Se il token è scaduto, prova a fare refresh
    if (error.response?.status === 401) {
      const refreshToken = req.cookies.refresh_token;

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            TOKEN_URL,
            new URLSearchParams({
              grant_type: 'refresh_token',
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

          // Riprova a ottenere le info utente
          const userResponse = await axios.get(USERINFO_URL, {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          });

          return res.json({
            authenticated: true,
            user: userResponse.data
          });

        } catch (refreshError) {
          console.error('Errore refresh token:', refreshError.response?.data || refreshError.message);
          return res.status(401).json({ authenticated: false });
        }
      }
    }

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
      // Revoca il token su Keycloak
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
    // Continua comunque a cancellare i cookie
  }

  // Cancella i cookie
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  return res.json({
    success: true,
    message: 'Logout effettuato'
  });
};