import KeycloakService from '../services/KeycloakService.js';
import { database, Utente } from '../data/remote/Database.js';
import 'dotenv/config';

async function importFromKeycloak() {
  try {
    await initializeConnection();
    const keycloakUsers = await fetchKeycloakUsers();

    if (keycloakUsers.length === 0) {
      console.log('Nessun utente da importare');
      await closeGracefully();
      return;
    }

    const stats = await processUsers(keycloakUsers);
    displayResults(stats);

    await closeGracefully();
    process.exit(stats.errors > 0 ? 1 : 0);

  } catch (error) {
    await handleFatalError(error);
  }
}

async function initializeConnection() {
  await database.authenticate();
  console.log('Connesso al database PostgreSQL\n');
  await KeycloakService.authenticate();
}

async function fetchKeycloakUsers() {
  const kcClient = KeycloakService.kcAdminClient;
  return await kcClient.users.find({
    realm: process.env.KEYCLOAK_REALM,
    max: 1000
  });
}

async function processUsers(keycloakUsers) {
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  for (const kcUser of keycloakUsers) {
    await processUser(kcUser, stats);
  }

  return stats;
}

async function processUser(kcUser, stats) {
  try {
    const email = getEmail(kcUser);

    if (!email) {
      handleSkippedUser(kcUser.id, stats);
      return;
    }

    console.log(`Elaborazione: ${email}`);
    await syncUserToDatabase(kcUser, email, stats);

  } catch (error) {
    console.error(`Errore: ${error.message}\n`);
    stats.errors++;
  }
}

function getEmail(kcUser) {
  return kcUser.email || kcUser.username;
}

function handleSkippedUser(userId, stats) {
  console.log(`Utente senza email, saltato (ID: ${userId})`);
  stats.skipped++;
}

async function syncUserToDatabase(kcUser, email, stats) {
  const dbUser = await Utente.findOne({ where: { email } });
  const ruolo = getRuolo(kcUser);

  if (!dbUser) {
    await createNewUser(kcUser, email, ruolo, stats);
  } else if (!dbUser.keycloak_id) {
    await updateExistingUser(dbUser, kcUser, ruolo, stats);
  } else {
    console.log(`Già sincronizzato\n`);
    stats.skipped++;
  }
}

function getRuolo(kcUser) {
  const ruoloAttribute = kcUser.attributes?.ruolo?.[0] || 'Standard';
  return ruoloAttribute === 'Amministratore' ? 'Amministratore' : 'Standard';
}

async function createNewUser(kcUser, email, ruolo, stats) {
  await Utente.create({
    keycloak_id: kcUser.id,
    nome: kcUser.firstName || 'Nome',
    cognome: kcUser.lastName || 'Cognome',
    email: email,
    ruolo: ruolo,
    ultimo_sync: new Date()
  });

  console.log(`Creato nel database\n`);
  stats.created++;
}

async function updateExistingUser(dbUser, kcUser, ruolo, stats) {
  await dbUser.update({
    keycloak_id: kcUser.id,
    nome: kcUser.firstName || dbUser.nome,
    cognome: kcUser.lastName || dbUser.cognome,
    ruolo: ruolo,
    ultimo_sync: new Date()
  });

  console.log(`Aggiornato con Keycloak ID\n`);
  stats.updated++;
}

function displayResults(stats) {
  console.log('Risultati importazione:');
  console.log(`Creati: ${stats.created}`);
  console.log(`Aggiornati: ${stats.updated}`);
  console.log(`Saltati: ${stats.skipped}`);
  console.log(`Errori: ${stats.errors}`);
}

async function handleFatalError(error) {
  console.error('Errore fatale:', error.message);
  await closeGracefully();
  process.exit(1);
}

async function closeGracefully() {
  try {
    await database.connectionManager.close();

    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
  }
}

importFromKeycloak();