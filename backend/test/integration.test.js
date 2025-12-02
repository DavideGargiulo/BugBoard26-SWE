import { Sequelize } from 'sequelize';
// Importiamo le primitive di test da Vitest
import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';

// Import dei tuoi modelli (percorsi mantenuti come da tuo file)
import { createUtenteModel } from '../data/remote/models/utente.js';
import { createProgettoModel } from '../data/remote/models/progetto.js';
import { createIssueModel } from '../data/remote/models/issue.js';
import { createCommentoModel } from '../data/remote/models/commento.js';
import { createAllegatoModel } from '../data/remote/models/allegato.js';

// ==========================================
// 1. CONFIGURAZIONE DATABASE
// ==========================================
// Nota: Vitest esegue i test in parallelo tra file diversi, ma sequenzialmente nello stesso file.
// Poiché usi un DB reale (Postgres), assicurati che l'istanza sia attiva su localhost.
const testDb = new Sequelize('bugboard', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: console.log, // Disabilita i log SQL per tenere pulito l'output dei test
});

// Inizializza i modelli
const Utente = createUtenteModel(testDb);
const Progetto = createProgettoModel(testDb);
const Issue = createIssueModel(testDb);
const Commento = createCommentoModel(testDb);
const Allegato = createAllegatoModel(testDb);

// ==========================================
// 2. DEFINIZIONE ASSOCIAZIONI
// ==========================================
function setupAssociations() {
  // Utente - Issue
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

  // Progetto - Issue
  Issue.belongsTo(Progetto, {
    foreignKey: { name: 'id_progetto', allowNull: false },
    onDelete: 'CASCADE'
  });
  Progetto.hasMany(Issue, {
    foreignKey: { name: 'id_progetto', allowNull: false },
    onDelete: 'CASCADE'
  });

  // Utente - Commento
  Commento.belongsTo(Utente, {
    foreignKey: { name: 'id_utente', allowNull: false },
    onDelete: 'CASCADE'
  });
  Utente.hasMany(Commento, {
    foreignKey: { name: 'id_utente', allowNull: false },
    onDelete: 'CASCADE'
  });

  // Issue - Commento
  Commento.belongsTo(Issue, {
    foreignKey: { name: 'id_issue', allowNull: false },
    onDelete: 'CASCADE'
  });
  Issue.hasMany(Commento, {
    foreignKey: { name: 'id_issue', allowNull: false },
    as: 'Commenti',
    onDelete: 'CASCADE'
  });

  // Commento - Allegato
  Allegato.belongsTo(Commento, {
    foreignKey: { name: 'id_commento', allowNull: true },
    onDelete: 'CASCADE'
  });
  Commento.hasMany(Allegato, {
    foreignKey: { name: 'id_commento', allowNull: true },
    onDelete: 'CASCADE'
  });

  // Issue - Allegato
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

// ==========================================
// 3. SETUP E TEARDOWN GLOBALE
// ==========================================
beforeAll(async () => {
  setupAssociations();
  // Sync force: true distrugge e ricrea le tabelle su Postgres
  try {
    await testDb.authenticate();
    await testDb.sync({ force: true });
  } catch (error) {
    console.error('Impossibile connettersi al DB di test:', error);
    throw error;
  }
});

afterAll(async () => {
  await testDb.close();
});

afterEach(async () => {
  // Pulizia dati: Truncate è spesso più veloce di destroy su Postgres per pulizia massiva,
  // ma destroy rispetta gli hook di Sequelize se ne avessi. Qui usiamo destroy come da tuo codice.
  await Allegato.destroy({ where: {}, force: true });
  await Commento.destroy({ where: {}, force: true });
  await Issue.destroy({ where: {}, force: true });
  await Progetto.destroy({ where: {}, force: true });
  await Utente.destroy({ where: {}, force: true });
});

// ==========================================
// 4. TEST BASE
// ==========================================

describe('Modello Utente (Base)', () => {
  test('Crea un utente correttamente', async () => {
    const utente = await Utente.create({
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'mario.rossi@example.com',
      password: 'password123',
      ruolo: 'Standard'
    });

    console.log('👀 UTENTE CREATO:', utente.toJSON());

    expect(utente.id).toBeDefined();
    expect(utente.nome).toBe('Mario');
    expect(utente.password).not.toBe('password123'); // hash check (assumendo hook nel modello)
  });
});

describe('Modello Progetto (Base)', () => {
  test('Crea un progetto correttamente', async () => {
    const progetto = await Progetto.create({ nome: 'Progetto Test' });
    expect(progetto.id).toBeDefined();
  });

  test('Nome progetto deve essere unico', async () => {
    await Progetto.create({ nome: 'Progetto Unico' });
    await expect(
      Progetto.create({ nome: 'Progetto Unico' })
    ).rejects.toThrow();
  });
});

describe('Modello Issue (Base)', () => {
  let utente, progetto;

  beforeEach(async () => {
    utente = await Utente.create({
      nome: 'Test', cognome: 'User', email: 'test@example.com', password: 'pwd', ruolo: 'Standard'
    });
    progetto = await Progetto.create({ nome: 'Progetto Test' });
  });

  test('Crea un\'issue correttamente', async () => {
    const issue = await Issue.create({
      titolo: 'Bug', descrizione: 'Desc', tipo: 'Bug', stato: 'TODO',
      id_creatore: utente.id, id_progetto: progetto.id
    });
    expect(issue.id).toBeDefined();
  });

  test('Relazione con Utente funziona', async () => {
    const issue = await Issue.create({
      titolo: 'Test', descrizione: 'Desc', tipo: 'Feature', stato: 'TODO',
      id_creatore: utente.id, id_progetto: progetto.id
    });

    const issueConCreatore = await Issue.findByPk(issue.id, {
      include: [{ model: Utente, as: 'Creatore' }]
    });

    expect(issueConCreatore.Creatore.email).toBe('test@example.com');
  });
});

describe('Modello Commento (Base)', () => {
  let utente, progetto, issue;

  beforeEach(async () => {
    utente = await Utente.create({
      nome: 'Test', cognome: 'User', email: 'test@example.com', password: 'pwd', ruolo: 'Standard'
    });
    progetto = await Progetto.create({ nome: 'Progetto Test' });
    issue = await Issue.create({
      titolo: 'Issue', descrizione: 'Desc', tipo: 'Bug', stato: 'TODO',
      id_creatore: utente.id, id_progetto: progetto.id
    });
  });

  test('Relazione Commento-Issue funziona', async () => {
    await Commento.create({ testo: 'C1', id_utente: utente.id, id_issue: issue.id });
    await Commento.create({ testo: 'C2', id_utente: utente.id, id_issue: issue.id });

    const issueConCommenti = await Issue.findByPk(issue.id, {
      include: [{ model: Commento, as: 'Commenti' }]
    });

    expect(issueConCommenti.Commenti.length).toBe(2);
  });
});

// ==========================================
// 5. NUOVI TEST AVANZATI
// ==========================================

describe('Test Avanzati Utente: Classi di Equivalenza', () => {
  test('CE-Valid: Accetta ruoli validi (Amministratore, Standard)', async () => {
    const ruoliValidi = ['Amministratore', 'Standard'];

    for (const ruolo of ruoliValidi) {
      const user = await Utente.create({
        nome: 'Test', cognome: 'Role', email: `test.${ruolo}@example.com`,
        password: 'pass', ruolo: ruolo
      });
      expect(user.ruolo).toBe(ruolo);
    }
  });

  test('CE-Invalid: Rifiuta ruolo non in whitelist', async () => {
    await expect(Utente.create({
      nome: 'Hacker', cognome: 'Man', email: 'hacker@example.com',
      password: 'pass', ruolo: 'SuperUser'
    })).rejects.toThrow();
  });

  test('CE-Invalid: Rifiuta email duplicata (Unique Constraint)', async () => {
    await Utente.create({
      nome: 'Mario', cognome: 'Rossi', email: 'univoca@example.com',
      password: 'pass', ruolo: 'Standard'
    });

    await expect(Utente.create({
      nome: 'Luigi', cognome: 'Verdi', email: 'univoca@example.com',
      password: 'pass', ruolo: 'Standard'
    })).rejects.toThrow();
  });
});

describe('Test Avanzati Allegato: Boundary Value & XOR Logic', () => {
  let issue, commento;

  beforeEach(async () => {
    const utente = await Utente.create({ nome: 'U', cognome: 'S', email: 'utente.allegato@example.com', password: 'p', ruolo: 'Standard' });
    const progetto = await Progetto.create({ nome: 'P1' });
    issue = await Issue.create({ titolo: 'I1', descrizione: 'D', tipo: 'Bug', stato: 'TODO', id_creatore: utente.id, id_progetto: progetto.id });
    commento = await Commento.create({ testo: 'C1', id_utente: utente.id, id_issue: issue.id });
  });

  // --- BOUNDARY VALUE ANALYSIS SULLA DIMENSIONE ---

  test('Boundary-Max: Accetta file di esattamente 5MB (5242880 bytes)', async () => {
    const allegato = await Allegato.create({
      nome_file_originale: 'limite.txt', nome_file_storage: 'limite.txt', percorso_relativo: '/p', tipo_mime: 'text/plain',
      dimensione_byte: 5242880,
      id_issue: issue.id
    });
    expect(allegato.id).toBeDefined();
  });

  test('Boundary-Over: Rifiuta file di 5MB + 1 byte (5242881 bytes)', async () => {
    await expect(Allegato.create({
      nome_file_originale: 'over.txt', nome_file_storage: 'over.txt', percorso_relativo: '/p', tipo_mime: 'text/plain',
      dimensione_byte: 5242881,
      id_issue: issue.id
    })).rejects.toThrow();
  });

  // --- LOGICA XOR (Associazione Esclusiva) ---

  test('XOR-Valid: Solo Issue', async () => {
    await expect(Allegato.create({
      nome_file_originale: 'f1.txt', nome_file_storage: 'f1.txt', percorso_relativo: '/p', tipo_mime: 't', dimensione_byte: 100,
      id_issue: issue.id,
      id_commento: null
    })).resolves.not.toThrow();
  });

  test('XOR-Valid: Solo Commento', async () => {
    await expect(Allegato.create({
      nome_file_originale: 'f2.txt', nome_file_storage: 'f2.txt', percorso_relativo: '/p', tipo_mime: 't', dimensione_byte: 100,
      id_issue: null,
      id_commento: commento.id
    })).resolves.not.toThrow();
  });

  test('XOR-Invalid: Entrambi presenti', async () => {
    await expect(Allegato.create({
      nome_file_originale: 'f3.txt', nome_file_storage: 'f3.txt', percorso_relativo: '/p', tipo_mime: 't', dimensione_byte: 100,
      id_issue: issue.id,
      id_commento: commento.id
    })).rejects.toThrow(/associato O a un commento O a un'issue/);
  });

  test('XOR-Invalid: Entrambi assenti (Orfano)', async () => {
    await expect(Allegato.create({
      nome_file_originale: 'f4.txt', nome_file_storage: 'f4.txt', percorso_relativo: '/p', tipo_mime: 't', dimensione_byte: 100,
      id_issue: null,
      id_commento: null
    })).rejects.toThrow(/associato O a un commento O a un'issue/);
  });
});

describe('Test Integrità Referenziale (Deep Cascade)', () => {
  test('Cancellare Progetto elimina Issue -> Commenti -> Allegati', async () => {
    const utente = await Utente.create({ nome: 'U', cognome: 'S', email: 'cascade@test.com', password: 'p', ruolo: 'Standard' });
    const progetto = await Progetto.create({ nome: 'Progetto Effimero' });

    const issue = await Issue.create({ titolo: 'I', descrizione: 'D', tipo: 'Bug', stato: 'TODO', id_creatore: utente.id, id_progetto: progetto.id });
    const commento = await Commento.create({ testo: 'C', id_utente: utente.id, id_issue: issue.id });

    await Allegato.create({
      nome_file_originale: 'f.txt', nome_file_storage: 'del.txt', percorso_relativo: '/p', tipo_mime: 't', dimensione_byte: 10,
      id_commento: commento.id
    });

    await progetto.destroy();

    const issueCount = await Issue.count({ where: { id: issue.id } });
    const commentoCount = await Commento.count({ where: { id: commento.id } });
    const allegatoCount = await Allegato.count({ where: { nome_file_storage: 'del.txt' } });

    expect(issueCount).toBe(0);
    expect(commentoCount).toBe(0);
    expect(allegatoCount).toBe(0);
  });
});

describe('Test Edge Cases & Robustezza', () => {
  test('TDD - Email: Deve rifiutare formati non validi', async () => {
    const emailErrate = ['mario', 'mario@', '@gmail.com', 'mario.gmail.com', 'mario@gmail.', ''];

    for (const mail of emailErrate) {
      await expect(Utente.create({
        nome: 'Test', cognome: 'Fail', email: mail,
        password: 'pass', ruolo: 'Standard'
      })).rejects.toThrow();
    }
  });

  test('Boundary - Stringhe: Rifiuta input > 255 caratteri', async () => {
    const nomeLunghissimo = 'a'.repeat(256);
    await expect(Progetto.create({ nome: nomeLunghissimo })).rejects.toThrow();
  });

  test('Boundary - Stringhe: Accetta input esattamente 255 caratteri', async () => {
    const nomeLimite = 'a'.repeat(255);
    const progetto = await Progetto.create({ nome: nomeLimite });
    expect(progetto.nome).toBe(nomeLimite);
  });

  test('Edge Case - Empty String: Rifiuta nome vuoto', async () => {
     await expect(Utente.create({
       nome: '',
       cognome: 'Rossi', email: 'vuoto@test.com', password: 'p', ruolo: 'Standard'
     })).rejects.toThrow();
  });

  test('Integrity - Foreign Key: Non posso assegnare issue a utente inesistente', async () => {
    const progetto = await Progetto.create({ nome: 'P_FK' });
    await expect(Issue.create({
      titolo: 'Ghost User', descrizione: 'D', tipo: 'Bug', stato: 'TODO',
      id_creatore: 999999,
      id_progetto: progetto.id
    })).rejects.toThrow();
  });

  test('Data Type - UTF8: Accetta emoji e caratteri speciali', async () => {
    const progetto = await Progetto.create({
      nome: 'Progetto 🚀 Space & Kebab-case @#!!'
    });
    expect(progetto.nome).toBe('Progetto 🚀 Space & Kebab-case @#!!');
  });
});