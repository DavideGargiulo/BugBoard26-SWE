import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { createUtenteModel } from './models/utente.js';
import { createIssueModel } from './models/issue.js';
import { createProgettoModel } from './models/progetto.js';
import { createCommentoModel } from './models/commento.js';
import { createAllegatoModel } from './models/allegato.js';

import 'dotenv/config';

if (!process.env.DB_CONNECTION_URI) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const possibleEnvPaths = [
    join(__dirname, '../../../.env'),  // Root del progetto
    join(__dirname, '../../.env'),     // Backend folder
  ];

  for (const envPath of possibleEnvPaths) {
    if (existsSync(envPath)) {
      config({ path: envPath });
      break;
    }
  }
}

console.log('DB_CONNECTION_URI in Database.js:', process.env.DB_CONNECTION_URI ? 'OK' : 'MISSING');

export const database = new Sequelize(process.env.DB_CONNECTION_URI, {
  dialect: process.env.DIALECT || 'postgres',
  logging: false,
  dialectOptions: {
    // Opzioni per PostgreSQL
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Inizializzazione Modelli
createProgettoModel(database);
createUtenteModel(database);
createIssueModel(database);
createCommentoModel(database);
createAllegatoModel(database);

export const {
  utente: Utente,
  progetto: Progetto,
  issue: Issue,
  commento: Commento,
  allegato: Allegato
} = database.models;

// Creazione Associazioni
createAssociations();

setUpTriggers();

try {
  await database.sync();
  console.log('Database sincronizzato con successo.');
} catch (err) {
  console.error('Errore sincronizzazione DB:', err);
}

function setUpTriggers() {
  console.log("Setting up database triggers...");
}

function createAssociations() {
  // Utente-Issue (creatore) 1:N
  Issue.belongsTo(Utente, {
    as: 'Creatore',
    foreignKey: { name: 'id_creatore', allowNull: false },
    onDelete: 'CASCADE'
  });
  Utente.hasMany(Issue, {
    as: 'IssueCreati',
    foreignKey: { name: 'id_creatore', allowNull: false },
    onDelete: 'CASCADE'
  });

  // Progetto-Issue 1:N
  Issue.belongsTo(Progetto, {
    foreignKey: { name: 'id_progetto', allowNull: false },
    onDelete: 'CASCADE'
  });
  Progetto.hasMany(Issue, {
    foreignKey: { name: 'id_progetto', allowNull: false },
    onDelete: 'CASCADE'
  });

  // Utente-Commento 1:N
  Commento.belongsTo(Utente, {
    foreignKey: { name: 'id_utente', allowNull: false },
    onDelete: 'CASCADE'
  });
  Utente.hasMany(Commento, {
    foreignKey: { name: 'id_utente', allowNull: false },
    onDelete: 'CASCADE'
  });

  // Issue-Commento 1:N
  Commento.belongsTo(Issue, {
    foreignKey: { name: 'id_issue', allowNull: false },
    onDelete: 'CASCADE'
  });
  Issue.hasMany(Commento, {
    foreignKey: { name: 'id_issue', allowNull: false },
    onDelete: 'CASCADE'
  });

  // Commento-Allegato 1:N
  Allegato.belongsTo(Commento, {
    foreignKey: { name: 'id_commento', allowNull: true },
    onDelete: 'CASCADE'
  });
  Commento.hasMany(Allegato, {
    as: 'allegati',
    foreignKey: { name: 'id_commento', allowNull: true },
    onDelete: 'CASCADE'
  });

  // Issue-Allegato 1:N
  Allegato.belongsTo(Issue, {
    as: 'IssueAllegato',
    foreignKey: { name: 'id_issue', allowNull: true },
    onDelete: 'CASCADE'
  });
  Issue.hasMany(Allegato, {
    foreignKey: { name: 'id_issue', allowNull: true },
    onDelete: 'CASCADE'
  });
}