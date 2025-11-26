import KcAdminClient from '@keycloak/keycloak-admin-client';

class KeycloakService {
  constructor() {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: process.env.KEYCLOAK_URL,
      realmName: process.env.KEYCLOAK_REALM
    });
    this.authenticated = false;
  }

  async authenticate() {
    try {
      await this.kcAdminClient.auth({
        username: process.env.KEYCLOAK_USER,
        password: process.env.KEYCLOAK_PASSWORD,
        grantType: 'password',
        clientId: 'admin-cli'
      });
      this.authenticated = true;
      console.log('Autenticato su Keycloak');
    } catch (error) {
      console.error('Errore autenticazione Keycloak:', error.message);
      throw error;
    }
  }

  async createUser(userData) {
    if (!this.authenticated) await this.authenticate();

    try {
      const newUser = await this.kcAdminClient.users.create({
        realm: process.env.KEYCLOAK_REALM || 'master',
        username: userData.email,
        email: userData.email,
        firstName: userData.nome,
        lastName: userData.cognome,
        enabled: true,
        emailVerified: false,
        attributes: {
          ruolo: [userData.ruolo]
        }
      });

      console.log(`Utente creato su Keycloak: ${userData.email}`);
      return newUser.id;
    } catch (error) {
      console.error(`Errore creazione utente:`, error.message);
      throw error;
    }
  }

  async updateUser(keycloakId, userData) {
    if (!this.authenticated) await this.authenticate();

    try {
      await this.kcAdminClient.users.update(
        {
          realm: process.env.KEYCLOAK_REALM || 'master',
          id: keycloakId
        },
        {
          email: userData.email,
          firstName: userData.nome,
          lastName: userData.cognome,
          attributes: {
            ruolo: [userData.ruolo]
          }
        }
      );

      console.log(`Utente aggiornato su Keycloak: ${userData.email}`);
    } catch (error) {
      console.error(`Errore aggiornamento utente:`, error.message);
      throw error;
    }
  }

  async deleteUser(keycloakId) {
    if (!this.authenticated) await this.authenticate();

    try {
      await this.kcAdminClient.users.del({
        realm: process.env.KEYCLOAK_REALM || 'master',
        id: keycloakId
      });

      console.log(`Utente eliminato da Keycloak`);
    } catch (error) {
      console.error(`Errore eliminazione utente:`, error.message);
      throw error;
    }
  }

  async getUserByEmail(email) {
    if (!this.authenticated) await this.authenticate();

    try {
      const users = await this.kcAdminClient.users.find({
        realm: process.env.KEYCLOAK_REALM || 'master',
        email: email,
        exact: true
      });

      if (!users || users.length === 0) return null;

      const user = users[0];
      return {
        keycloak_id: user.id,
        nome: user.firstName || '',
        cognome: user.lastName || '',
        email: user.email || '',
        ruolo: user.attributes?.ruolo?.[0] || 'Standard'
      };
    } catch (error) {
      console.error(`✗ Errore ricerca utente:`, error.message);
      return null;
    }
  }
}

export default new KeycloakService();