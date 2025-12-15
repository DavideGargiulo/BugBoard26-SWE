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
 * Helper: Estrae il token da diverse sorgenti
 */
const extractToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return req.cookies['access_token'] || req.accessToken || null;
};

/**
 * Helper: Imposta i cookie per access e refresh token
 */
const setCookies = (res, accessToken, refreshToken, expiresIn) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: expiresIn * 1000
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
};

/**
 * Helper: Gestisce il refresh del token
 */
const handleTokenRefresh = async (req, res, refreshToken, reason) => {
  console.log(`${reason}, provo refresh...`);

  const refreshResult = await refreshAccessToken(refreshToken);

  if (!refreshResult.success) {
    console.error('❌ Impossibile rinnovare il token');
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: false };
  }

  setCookies(res, refreshResult.access_token, refreshResult.refresh_token, refreshResult.expires_in);
  req.accessToken = refreshResult.access_token;
  console.log('✅ Token rinnovato con successo');

  return { success: true, token: refreshResult.access_token };
};

/**
 * Helper: Verifica se il token è scaduto o in scadenza
 */
const isTokenExpired = (decoded) => {
  if (!decoded.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now + 30;
};

/**
 * Middleware di protezione: valida il token JWT e lo rinnova se scaduto
 */
export const protect = async (req, res, next) => {
  let token = extractToken(req);

  // Se manca il token, prova il refresh
  if (!token) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      console.error('Nessun token trovato');
      return res.status(401).json({ error: 'Token mancante' });
    }

    const result = await handleTokenRefresh(req, res, refreshToken, 'Access token mancante');

    if (!result.success) {
      return res.status(401).json({ error: 'Sessione scaduta, effettua nuovamente il login' });
    }

    token = result.token;
  }

  // Valida il token
  try {
    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new Error('Token non decodificabile');
    }

    // Se il token è scaduto, prova il refresh
    if (isTokenExpired(decoded)) {
      const refreshToken = req.cookies['refresh_token'];

      if (!refreshToken) {
        throw new Error('Token scaduto e nessun refresh token disponibile');
      }

      const result = await handleTokenRefresh(req, res, refreshToken, 'Token scaduto o in scadenza');

      if (!result.success) {
        return res.status(401).json({ error: 'Sessione scaduta, effettua nuovamente il login' });
      }

      req.user = jwt.decode(result.token);
      return next();
    }

    // Token valido
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Errore validazione token:', error.message);
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