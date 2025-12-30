import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL?.trim();
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM?.trim();
const CLIENT_ID = process.env.KEYCLOAK_BACKEND_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.KEYCLOAK_BACKEND_CLIENT_SECRET?.trim();

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const JWKS_URI = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

const jwksClientInstance = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxAge: 86400000,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

const AUTH_ERRORS = {
  LOGIN_REQUIRED: 'Autenticazione richiesta',
  SESSION_EXPIRED: 'Sessione scaduta, effettua nuovamente il login',
  INVALID_TOKEN: 'Token non valido'
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
};

const buildUserFromDecoded = (decoded) => ({
  id: decoded.sub,
  email: decoded.email,
  username: decoded.preferred_username,
  name: decoded.name,
  given_name: decoded.given_name,
  family_name: decoded.family_name,
  realm_access: decoded.realm_access,
  resource_access: decoded.resource_access,
  ...decoded
});

const verifyAndSetUser = async (req, token) => {
  const decoded = await verifyKeycloakToken(token);

  if (!decoded?.sub || !decoded?.exp) {
    const e = new Error('Token payload non valido');
    e.name = 'InvalidTokenPayload';
    throw e;
  }

  req.user = buildUserFromDecoded(decoded);
  return decoded;
};

const refreshAndGetToken = async (req, res, reason) => {
  const refreshToken = req.cookies['refresh_token'];
  if (!refreshToken) return null;

  const result = await handleTokenRefresh(req, res, refreshToken, reason);
  return result.success ? result.token : null;
};

const ensureAccessToken = async (req, res) => {
  const token = extractToken(req);
  if (token) return token;

  if (!req.cookies['refresh_token']) {
    const e = new Error(AUTH_ERRORS.LOGIN_REQUIRED);
    e.code = 'NO_REFRESH';
    throw e;
  }

  const refreshed = await refreshAndGetToken(req, res, 'Access token mancante');
  if (refreshed) return refreshed;

  const e = new Error(AUTH_ERRORS.SESSION_EXPIRED);
  e.code = 'REFRESH_FAILED';
  throw e;
};

const respondUnauthorized = (res, message, err) => {
  const body = { error: message };
  if (process.env.NODE_ENV === 'development' && err) body.details = err.message;
  return res.status(401).json(body);
};

const handleExpiredTokenFlow = async (req, res, next) => {
  const refreshed = await refreshAndGetToken(req, res, 'Token scaduto');

  if (!refreshed) {
    clearAuthCookies(res);
    return respondUnauthorized(res, AUTH_ERRORS.SESSION_EXPIRED);
  }

  try {
    await verifyAndSetUser(req, refreshed);
    return next();
  } catch (e) {
    clearAuthCookies(res);
    return respondUnauthorized(res, AUTH_ERRORS.INVALID_TOKEN, e);
  }
};

const handleAuthFailure = (err, req, res, next) => {
  console.error('Errore validazione token:', err.message);

  if (err?.name === 'TokenExpiredError') {
    return handleExpiredTokenFlow(req, res, next);
  }

  if (err?.code === 'NO_REFRESH') {
    return res.status(401).json({ error: AUTH_ERRORS.LOGIN_REQUIRED });
  }

  // firma non valida, issuer/audience errati, payload invalido, ecc.
  clearAuthCookies(res);
  return respondUnauthorized(res, AUTH_ERRORS.INVALID_TOKEN, err);
};

/**
 * Ottiene la chiave pubblica di Keycloak per verificare il token
 */
const getKeycloakPublicKey = (header, callback) => {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Errore recupero chiave pubblica:', err.message);
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

/**
 * Verifica il token JWT con la chiave pubblica di Keycloak
 */
const verifyKeycloakToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKeycloakPublicKey,
      {
        algorithms: ['RS256'],
        issuer: [
          `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
          `http://localhost:8080/realms/${KEYCLOAK_REALM}`
        ],
        audience: CLIENT_ID
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
};

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
    secure: process.env.NODE_ENV === 'production', // Usa secure in production
    sameSite: 'lax',
    maxAge: expiresIn * 1000
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Usa secure in production
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
  console.log('Token rinnovato con successo');

  return { success: true, token: refreshResult.access_token };
};

/**
 * Middleware di protezione: verifica il token JWT con Keycloak
 */
export const protect = async (req, res, next) => {
  try {
    const token = await ensureAccessToken(req, res);
    await verifyAndSetUser(req, token);
    return next();
  } catch (err) {
    return handleAuthFailure(err, req, res, next);
  }
};

/**
 * Middleware per il controllo dei RUOLI (usa token VERIFICATO)
 */
export const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    if (!req.user) {
      console.error('checkRole chiamato senza protect() - VULNERABILITÀ DI SICUREZZA');
      return res.status(401).json({
        error: 'Errore di configurazione: autenticazione non verificata'
      });
    }

    const realmRoles = req.user.realm_access?.roles || [];
    const resourceAccess = req.user.resource_access || {};

    const allClientRoles = [];
    for (const [clientId, clientData] of Object.entries(resourceAccess)) {
      console.log(`  Client "${clientId}":`, clientData.roles);
      if (clientData.roles) {
        allClientRoles.push(...clientData.roles);
      }
    }

    const allRoles = [...realmRoles, ...allClientRoles];

    console.log('Controllo ruolo:', {
      required: requiredRole,
      userRoles: allRoles
    });

    if (allRoles.includes(requiredRole)) {
      console.log('Accesso CONSENTITO');
      return next();
    } else {
      console.log('Accesso NEGATO - Ruolo mancante');
      return res.status(403).json({
        error: `Accesso negato. Ruolo '${requiredRole}' non trovato.`,
        rolesFound: allRoles,
        realmRoles: realmRoles,
        clientRoles: allClientRoles
      });
    }
  };
};

/**
 * Middleware opzionale: verifica multipli ruoli (OR logic)
 */
export const checkAnyRole = (...requiredRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      console.error('checkAnyRole chiamato senza protect()');
      return res.status(401).json({
        error: 'Errore di configurazione: autenticazione non verificata'
      });
    }

    const realmRoles = req.user.realm_access?.roles || [];
    const resourceAccess = req.user.resource_access || {};

    const allClientRoles = [];
    for (const clientData of Object.values(resourceAccess)) {
      if (clientData.roles) {
        allClientRoles.push(...clientData.roles);
      }
    }

    const allRoles = [...realmRoles, ...allClientRoles];
    const hasAnyRole = requiredRoles.some(role => allRoles.includes(role));

    if (hasAnyRole) {
      console.log('Accesso consentito con uno dei ruoli:', requiredRoles);
      return next();
    } else {
      console.log('Accesso negato - Nessuno dei ruoli richiesti trovato');
      return res.status(403).json({
        error: `Accesso negato. Richiesto uno dei ruoli: ${requiredRoles.join(', ')}`,
        rolesFound: allRoles
      });
    }
  };
};

/**
 * Middleware opzionale: verifica multipli ruoli (AND logic)
 */
export const checkAllRoles = (...requiredRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      console.error('checkAllRoles chiamato senza protect()');
      return res.status(401).json({
        error: 'Errore di configurazione: autenticazione non verificata'
      });
    }

    const realmRoles = req.user.realm_access?.roles || [];
    const resourceAccess = req.user.resource_access || {};

    const allClientRoles = [];
    for (const clientData of Object.values(resourceAccess)) {
      if (clientData.roles) {
        allClientRoles.push(...clientData.roles);
      }
    }

    const allRoles = [...realmRoles, ...allClientRoles];
    const hasAllRoles = requiredRoles.every(role => allRoles.includes(role));

    if (hasAllRoles) {
      console.log('Accesso consentito con tutti i ruoli:', requiredRoles);
      return next();
    } else {
      const missingRoles = requiredRoles.filter(role => !allRoles.includes(role));
      console.log('Accesso negato - Ruoli mancanti:', missingRoles);
      return res.status(403).json({
        error: `Accesso negato. Mancano i ruoli: ${missingRoles.join(', ')}`,
        rolesFound: allRoles,
        missingRoles
      });
    }
  };
};