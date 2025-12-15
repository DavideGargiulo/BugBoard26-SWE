import jwt from 'jsonwebtoken';
import axios from 'axios';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL?.trim();
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM?.trim();
const CLIENT_ID = process.env.KEYCLOAK_BACKEND_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.KEYCLOAK_BACKEND_CLIENT_SECRET?.trim();

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

/**
 * Funzione helper per rinnovare il token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(
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

    return {
      success: true,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    };
  } catch (error) {
    console.error('Errore refresh token:', error.response?.data || error.message);
    return { success: false };
  }
};

/**
 * Estrae il token dal cookie
 */
export const extractTokenFromCookie = (req, res, next) => {
  const token = req.cookies['access_token'];
  if (token) {
    req.headers['authorization'] = `Bearer ${token}`;
    req.accessToken = token;
  }
  next();
};

/**
 * Middleware di protezione: valida il token JWT e lo rinnova se scaduto
 */
export const protect = async (req, res, next) => {
  let token = null;

  // Estrai il token da varie sorgenti
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.cookies['access_token']) {
    token = req.cookies['access_token'];
  }

  if (!token && req.accessToken) {
    token = req.accessToken;
  }

  if (!token) {
    // Se non c'è access token ma c'è refresh token, prova a rinnovare
    const refreshToken = req.cookies['refresh_token'];

    if (refreshToken) {
      console.log('Access token mancante, provo refresh automatico...');
      const refreshResult = await refreshAccessToken(refreshToken);

      if (refreshResult.success) {
        // Aggiorna i cookie
        res.cookie('access_token', refreshResult.access_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: refreshResult.expires_in * 1000
        });

        res.cookie('refresh_token', refreshResult.refresh_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });

        token = refreshResult.access_token;
        req.accessToken = token;
        console.log('✅ Token rinnovato con successo (token mancante)');
      } else {
        console.error('❌ Refresh token non valido o scaduto');
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return res.status(401).json({ error: 'Sessione scaduta, effettua nuovamente il login' });
      }
    } else {
      console.error('Nessun token trovato');
      return res.status(401).json({ error: 'Token mancante' });
    }
  }

  // Ora valida il token
  try {
    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new Error('Token non decodificabile');
    }

    const now = Math.floor(Date.now() / 1000);

    // Se il token è scaduto o sta per scadere (< 30 secondi), prova a rinnovarlo
    if (decoded.exp && decoded.exp < now + 30) {
      console.log('Token scaduto o in scadenza, provo refresh...');

      const refreshToken = req.cookies['refresh_token'];

      if (!refreshToken) {
        throw new Error('Token scaduto e nessun refresh token disponibile');
      }

      const refreshResult = await refreshAccessToken(refreshToken);

      if (refreshResult.success) {
        // Aggiorna i cookie
        res.cookie('access_token', refreshResult.access_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: refreshResult.expires_in * 1000
        });

        res.cookie('refresh_token', refreshResult.refresh_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });

        // Usa il nuovo token
        token = refreshResult.access_token;
        req.accessToken = token;
        req.user = jwt.decode(token);
        console.log('✅ Token rinnovato con successo (token scaduto)');

        return next();
      } else {
        console.error('❌ Impossibile rinnovare il token');
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return res.status(401).json({ error: 'Sessione scaduta, effettua nuovamente il login' });
      }
    }

    // Token valido, procedi normalmente
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Errore validazione token:', error.message);

    // In caso di errore, cancella i cookie e richiedi nuovo login
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
};

/**
 * Middleware per il controllo dei RUOLI
 */
export const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    // Se protect() non è stato chiamato prima, decodifica il token
    if (!req.user) {
      const token = req.cookies['access_token'] || req.accessToken;
      if (!token) {
        return res.status(401).json({ error: 'Token mancante' });
      }

      req.user = jwt.decode(token);
      if (!req.user) {
        return res.status(401).json({ error: 'Token non valido' });
      }
    }

    // Cerca ruoli in TUTTE le posizioni
    const realmRoles = req.user.realm_access?.roles || [];
    const resourceAccess = req.user.resource_access || {};

    // Estrai ruoli da TUTTI i client
    const allClientRoles = [];
    for (const [clientId, clientData] of Object.entries(resourceAccess)) {
      console.log(`  Client "${clientId}":`, clientData.roles);
      if (clientData.roles) {
        allClientRoles.push(...clientData.roles);
      }
    }

    const allRoles = [...realmRoles, ...allClientRoles];

    if (allRoles.includes(requiredRole)) {
      console.log('✅✅✅ Accesso CONSENTITO ✅✅✅');
      return next();
    } else {
      return res.status(403).json({
        error: `Accesso negato. Ruolo '${requiredRole}' non trovato.`,
        rolesFound: allRoles,
        realmRoles: realmRoles,
        clientRoles: allClientRoles
      });
    }
  };
};