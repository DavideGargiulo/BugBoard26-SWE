import KeycloakService from '../services/KeycloakService.js';
import { database, Utente } from '../data/remote/Database.js';
import 'dotenv/config';

async function importFromKeycloak() {
  console.log('🚀 Importazione utenti da Keycloak a PostgreSQL\n');

  try {
    await database.authenticate();
    console.log('Connesso al database PostgreSQL\n');

    // Recupera tutti gli utenti da Keycloak
    await KeycloakService.authenticate();
    const kcClient = KeycloakService.kcAdminClient;

    const keycloakUsers = await kcClient.users.find({
      realm: process.env.KEYCLOAK_REALM,
      max: 1000
    });

    if (keycloakUsers.length === 0) {
      console.log('Nessun utente da importare');
      await closeGracefully();
      return;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const kcUser of keycloakUsers) {
      try {
        const email = kcUser.email || kcUser.username;

        if (!email) {
          console.log(`Utente senza email, saltato (ID: ${kcUser.id})`);
          skipped++;
          continue;
        }

        console.log(`Elaborazione: ${email}`);

        let dbUser = await Utente.findOne({ where: { email } });

        const ruolo = kcUser.attributes?.ruolo?.[0] || 'Standard';

        if (!dbUser) {
          dbUser = await Utente.create({
            keycloak_id: kcUser.id,
            nome: kcUser.firstName || 'Nome',
            cognome: kcUser.lastName || 'Cognome',
            email: email,
            ruolo: ruolo === 'Amministratore' ? 'Amministratore' : 'Standard',
            ultimo_sync: new Date()
          });

          console.log(`Creato nel database\n`);
          created++;
        } else if (!dbUser.keycloak_id) {
          await dbUser.update({
            keycloak_id: kcUser.id,
            nome: kcUser.firstName || dbUser.nome,
            cognome: kcUser.lastName || dbUser.cognome,
            ruolo: ruolo === 'Amministratore' ? 'Amministratore' : 'Standard',
            ultimo_sync: new Date()
          });

          console.log(`Aggiornato con Keycloak ID\n`);
          updated++;
        } else {
          console.log(`Già sincronizzato\n`);
          skipped++;
        }

      } catch (error) {
        console.error(`Errore: ${error.message}\n`);
        errors++;
      }
    }

    console.log('Risultati importazione:');
    console.log(`Creati: ${created}`);
    console.log(`Aggiornati: ${updated}`);
    console.log(`Saltati: ${skipped}`);
    console.log(`Errori: ${errors}`);

    await closeGracefully();
    process.exit(errors > 0 ? 1 : 0);

  } catch (error) {
    console.error('Errore fatale:', error.message);
    await closeGracefully();
    process.exit(1);
  }
}

async function closeGracefully() {
  try {
    await database.connectionManager.close();

    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
  }
}

importFromKeycloak();