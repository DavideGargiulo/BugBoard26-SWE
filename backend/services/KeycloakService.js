import KcAdminClient from '@keycloak/keycloak-admin-client';
import crypto from 'node:crypto';

class KeycloakService {
  constructor() {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: process.env.KEYCLOAK_URL,
      realmName: process.env.KEYCLOAK_REALM
    });
    this.authenticated = false;
  }

  async authenticate() {
    if (this.authenticated) return;

    try {
      await this.kcAdminClient.auth({
        grantType: 'client_credentials',
        clientId: process.env.KEYCLOAK_BACKEND_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_BACKEND_CLIENT_SECRET
      });

      this.authenticated = true;
    } catch (error) {
      console.error('Errore autenticazione Keycloak:', error.message);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  generatePassword(length = 14) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!%*?&';
    let password = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % charset.length;
      password += charset[randomIndex];
    }
    return password;
  }

  async userExists(username, email) {
    if (!this.authenticated) await this.authenticate();

    const realm = process.env.KEYCLOAK_REALM;

    const byUsername = await this.kcAdminClient.users.find({
      realm,
      username,
      exact: true
    });
    if (byUsername.length > 0) return true;

    const byEmail = await this.kcAdminClient.users.find({
      realm,
      email,
      exact: true
    });
    return byEmail.length > 0;
  }

  /**
   * Crea un utente, imposta la password e assegna il ruolo.
   * Se password non viene passata, ne genera una automaticamente.
   */
  async registerUser(userData) {
    await this.authenticate();
    const realm = process.env.KEYCLOAK_REALM;

    if (await this.userExists(userData.username, userData.email)) {
      throw new Error('User already exists');
    }

    // Usa la password passata o genera una nuova
    const passwordToUse = userData.password || this.generatePassword();

    // Crea utente
    const createdUser = await this.kcAdminClient.users.create({
      realm,
      username: userData.email,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      enabled: true,
      emailVerified: true,
      attributes: { ruolo: [userData.role] }
    });

    // Imposta password (PERMANENTE)
    await this.kcAdminClient.users.resetPassword({
      realm,
      id: createdUser.id,
      credential: {
        type: 'password',
        value: passwordToUse,
        temporary: false
      }
    });

    // Assegna ruolo
    const roleName = userData.role;

    try {
      const role = await this.kcAdminClient.roles.findOneByName({
        realm,
        name: roleName
      });

      if (role) {
        await this.kcAdminClient.users.addRealmRoleMappings({
          realm,
          id: createdUser.id,
          roles: [{ id: role.id, name: role.name }]
        });
      } else {
        console.warn(`ATTENZIONE: Il ruolo '${roleName}' non esiste su Keycloak!`);
      }
    } catch (err) {
      console.error('Errore assegnazione ruolo:', err.message);
    }

    return {
      userId: createdUser.id
      // Non restituiamo la password qui, viene gestita dal controller
    };
  }

  async updateUser(keycloakId, userData) {
    if (!this.authenticated) await this.authenticate();

    try {
      await this.kcAdminClient.users.update(
        {
          realm: process.env.KEYCLOAK_REALM,
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

      console.log(`Utente aggiornato: ${userData.email}`);
    } catch (error) {
      console.error(`Errore aggiornamento utente:`, error.message);
      throw error;
    }
  }

  async deleteUser(keycloakId) {
    if (!this.authenticated) await this.authenticate();

    try {
      await this.kcAdminClient.users.del({
        realm: process.env.KEYCLOAK_REALM,
        id: keycloakId
      });

      console.log(`Utente eliminato`);
    } catch (error) {
      console.error(`Errore eliminazione utente:`, error.message);
      throw error;
    }
  }

  async getUserByEmail(email) {
    if (!this.authenticated) await this.authenticate();

    try {
      const users = await this.kcAdminClient.users.find({
        realm: process.env.KEYCLOAK_REALM,
        email,
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
      console.error(`Errore ricerca utente:`, error.message);
      return null;
    }
  }
}

export default new KeycloakService();