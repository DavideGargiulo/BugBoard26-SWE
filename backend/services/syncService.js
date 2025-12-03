import { Utente } from '../data/remote/Database.js';

class SyncService {
  /**
   * Sincronizza un singolo utente Keycloak nel database locale
   */
  async syncSingleUser(keycloakUser) {
    try {
      const email = keycloakUser.email || keycloakUser.username;

      if (!email) {
        console.warn('Utente senza email, impossibile sincronizzare');
        return { success: false, reason: 'no_email' };
      }

      console.log(`Sincronizzazione utente: ${email}`);

      // Controlla se l'utente esiste già nel DB
      const dbUser = await Utente.findOne({ where: { email } });

      const ruolo = this.extractRuolo(keycloakUser);
      const userData = {
        keycloak_id: keycloakUser.id,
        nome: keycloakUser.firstName || 'Nome',
        cognome: keycloakUser.lastName || 'Cognome',
        email: email,
        ruolo: ruolo,
        ultimo_sync: new Date()
      };

      if (!dbUser) {
        // Crea nuovo utente
        await Utente.create(userData);
        console.log(`Utente creato nel database locale`);
        return { success: true, action: 'created' };
      } else if (!dbUser.keycloak_id) {
        // Aggiorna utente esistente con keycloak_id
        await dbUser.update(userData);
        console.log(`Utente aggiornato con Keycloak ID`);
        return { success: true, action: 'updated' };
      } else {
        // Utente già sincronizzato, aggiorna comunque i dati
        await dbUser.update(userData);
        console.log(`Utente già sincronizzato, dati aggiornati`);
        return { success: true, action: 'refreshed' };
      }

    } catch (error) {
      console.error('Errore sincronizzazione utente:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Estrae il ruolo dall'utente Keycloak
   */
  extractRuolo(keycloakUser) {
    const ruoloAttribute = keycloakUser.attributes?.ruolo?.[0] || 'Standard';
    return ruoloAttribute === 'Amministratore' ? 'Amministratore' : 'Standard';
  }

  /**
   * Sincronizza un utente dato solo l'ID Keycloak
   * (recupera prima i dati da Keycloak)
   */
  async syncUserById(keycloakId, kcAdminClient, realm) {
    try {
      console.log(`Recupero dati utente da Keycloak (ID: ${keycloakId})...`);
      const keycloakUser = await kcAdminClient.users.findOne({
        realm: realm,
        id: keycloakId
      });

      if (!keycloakUser) {
        console.error('Utente non trovato su Keycloak');
        return { success: false, reason: 'not_found' };
      }

      return await this.syncSingleUser(keycloakUser);

    } catch (error) {
      console.error('Errore recupero utente da Keycloak:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new SyncService();