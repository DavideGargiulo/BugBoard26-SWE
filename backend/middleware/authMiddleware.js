import jwt from 'jsonwebtoken';

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
 * Middleware di protezione: valida il token JWT
 */
export const protect = async (req, res, next) => {
  const token = req.cookies['access_token'] || req.accessToken;

  if (!token) {
    console.error('Nessun token trovato');
    return res.status(401).json({ error: 'Token mancante' });
  }

  try {
    // Decodifica senza verifica (per ora)
    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new Error('Token non decodificabile');
    }

    // Verifica manualmente la scadenza
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Token scaduto');
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error('Errore validazione token:', error.message);
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
      const token = req.cookies['access_token'];
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