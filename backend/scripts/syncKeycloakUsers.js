import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';

const CONFIG = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    database: process.env.DB_NAME || 'bugboard',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
  },
  keycloak: {
    baseUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'bugboard-realm',
    adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin123',
  }
};

let sequelize;
let Utente;

function initDatabase() {
  console.log('CONFIGURAZIONE DATABASE:');
  console.log(`  Host:     ${CONFIG.database.host}:${CONFIG.database.port}`);
  console.log(`  Database: ${CONFIG.database.database}`);

  sequelize = new Sequelize(
    CONFIG.database.database,
    CONFIG.database.username,
    CONFIG.database.password,
    {
      host: CONFIG.database.host,
      port: CONFIG.database.port,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

  Utente = sequelize.define('utente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    keycloak_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cognome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    ruolo: {
      type: DataTypes.ENUM('Amministratore', 'Standard'),
      allowNull: false
    },
    ultimo_sync: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'utente',
    timestamps: true
  });
}

let kcAdminClient;

function initKeycloak() {
  console.log('\nCONFIGURAZIONE KEYCLOAK:');
  console.log(`  URL:   ${CONFIG.keycloak.baseUrl}`);
  console.log(`  Realm: ${CONFIG.keycloak.realm}`);

  kcAdminClient = new KcAdminClient({
    baseUrl: CONFIG.keycloak.baseUrl,
    realmName: 'master'
  });
}

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connessione al database: OK');
    return true;
  } catch (error) {
    console.error('Errore connessione database:', error.message);
    throw error;
  }
}

async function authenticateKeycloak() {
  try {
    await kcAdminClient.auth({
      grantType: 'password',
      clientId: 'admin-cli',
      username: CONFIG.keycloak.adminUsername,
      password: CONFIG.keycloak.adminPassword,
    });

    console.log('Autenticazione Keycloak: OK');
    return true;
  } catch (error) {
    console.error('Errore autenticazione Keycloak:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Dettagli:', error.response.data);
    }
    throw error;
  }
}

async function fetchKeycloakUsers() {
  try {
    kcAdminClient.setConfig({ realmName: CONFIG.keycloak.realm });

    const users = await kcAdminClient.users.find({
      max: 1000,
      briefRepresentation: false
    });

    console.log(`Trovati ${users.length} utenti su Keycloak`);
    return users;
  } catch (error) {
    console.error('Errore recupero utenti da Keycloak:', error.message);
    throw error;
  }
}

function determineRole(kcUser) {
  if (kcUser.attributes?.ruolo) {
    const ruolo = Array.isArray(kcUser.attributes.ruolo)
      ? kcUser.attributes.ruolo[0]
      : kcUser.attributes.ruolo;

    if (ruolo === 'Amministratore') {
      return 'Amministratore';
    }
  }

  if (kcUser.realmRoles?.includes('Amministratore')) {
    return 'Amministratore';
  }

  return 'Standard';
}

async function syncUser(kcUser) {
  const email = kcUser.email || kcUser.username;

  if (!email) {
    console.log(`Saltato utente ${kcUser.id}: nessuna email`);
    return { status: 'skipped' };
  }

  try {
    const ruolo = determineRole(kcUser);
    const userData = {
      keycloak_id: kcUser.id,
      nome: kcUser.firstName || 'Nome',
      cognome: kcUser.lastName || 'Cognome',
      email: email,
      ruolo: ruolo,
      ultimo_sync: new Date()
    };

    const existingUser = await Utente.findOne({ where: { email } });

    if (existingUser) {
      await existingUser.update(userData);
      console.log(`Aggiornato: ${email} [${ruolo}]`);
      return { status: 'updated', email, ruolo };
    } else {
      await Utente.create(userData);
      console.log(`Creato: ${email} [${ruolo}]`);
      return { status: 'created', email, ruolo };
    }
  } catch (error) {
    console.error(`Errore su ${email}:`, error.message);
    return { status: 'error', email, error: error.message };
  }
}

async function syncAllUsers(keycloakUsers) {
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  console.log('\nInizio sincronizzazione...\n');

  for (const kcUser of keycloakUsers) {
    const result = await syncUser(kcUser);

    switch (result.status) {
      case 'created':
        stats.created++;
        break;
      case 'updated':
        stats.updated++;
        break;
      case 'skipped':
        stats.skipped++;
        break;
      case 'error':
        stats.errors++;
        break;
    }
  }

  return stats;
}

function printStats(stats) {
  console.log('\n' + '='.repeat(50));
  console.log('RIEPILOGO SINCRONIZZAZIONE');
  console.log('='.repeat(50));
  console.log(`Creati:     ${stats.created}`);
  console.log(`Aggiornati: ${stats.updated}`);
  console.log(`Saltati:    ${stats.skipped}`);
  console.log(`Errori:     ${stats.errors}`);
  console.log('='.repeat(50));
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('SINCRONIZZAZIONE UTENTI KEYCLOAK → DATABASE');
  console.log('='.repeat(50) + '\n');

  try {
    initDatabase();
    initKeycloak();

    await connectDatabase();

    await authenticateKeycloak();

    const keycloakUsers = await fetchKeycloakUsers();

    if (keycloakUsers.length === 0) {
      console.log('\nNessun utente trovato su Keycloak');
      process.exit(0);
    }

    const stats = await syncAllUsers(keycloakUsers);

    printStats(stats);

    await sequelize.close();
    console.log('\nSincronizzazione completata con successo\n');

    process.exit(stats.errors > 0 ? 1 : 0);

  } catch (error) {
    console.error('\nERRORE FATALE:', error.message);

    if (sequelize) {
      await sequelize.close();
    }

    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error('Errore nello script di sincronizzazione:', err);
  process.exit(1);
}