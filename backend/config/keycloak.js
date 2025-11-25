import KeycloakConnect from 'keycloak-connect';

const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM,
  'auth-server-url': process.env.KEYCLOAK_URL,
  'ssl-required': 'none',
  resource: process.env.KEYCLOAK_BACKEND_CLIENT_ID,
  credentials: {
    secret: process.env.KEYCLOAK_BACKEND_CLIENT_SECRET
  },
  'confidential-port': 0,
  'bearer-only': true // Il backend accetta solo Bearer token
};

let keycloak;

export const initKeycloak = (memoryStore) => {
  keycloak = new KeycloakConnect({ store: memoryStore }, keycloakConfig);
  return keycloak;
};

export const getKeycloak = () => {
  if (!keycloak) {
    throw new Error('Keycloak non è stato inizializzato');
  }
  return keycloak;
};

export default keycloakConfig;