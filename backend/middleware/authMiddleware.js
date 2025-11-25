import { getKeycloak } from '../config/keycloak.js';

/**
 * Middleware che sposta il token dal cookie all'header Authorization
 * così che keycloak-connect possa leggerlo.
 */
export const extractTokenFromCookie = (req, res, next) => {
  const token = req.cookies['access_token'];

  if (token) {
    req.headers['authorization'] = `Bearer ${token}`;
  }

  next();
};

export const protect = (req, res, next) => {
  const keycloak = getKeycloak();

  // Eseguiamo prima l'estrazione, poi la protezione
  extractTokenFromCookie(req, res, () => {
    return keycloak.protect()(req, res, next);
  });
};

export const checkRole = (role) => {
  const keycloak = getKeycloak();

  return (req, res, next) => {
    extractTokenFromCookie(req, res, () => {
      return keycloak.protect(role)(req, res, next);
    });
  };
};