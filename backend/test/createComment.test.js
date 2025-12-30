import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComment } from '../controllers/commentController.js';
import { Commento, Allegato, Utente, Issue } from '../data/remote/Database.js';

// 1. Setup Mock per FS
const fsMocks = vi.hoisted(() => ({
  unlink: vi.fn(),
  readFile: vi.fn()
}));

// Mock 'node:fs' - Importante: deve ritornare un default export per 'import fs from ...'
vi.mock('node:fs', () => ({
  default: fsMocks
}));

// Mock 'node:util' per bypassare la logica dei callback di promisify
// Facciamo in modo che promisify ritorni la funzione stessa, così possiamo
// mockare fs.readFile e fs.unlink affinché ritornino direttamente Promise.
vi.mock('node:util', () => ({
  promisify: (fn) => fn
}));

// 2. Mock Database
vi.mock('../data/remote/Database.js', () => ({
  Utente: { findOne: vi.fn() },
  Issue: { findByPk: vi.fn() },
  Commento: { create: vi.fn() },
  Allegato: { create: vi.fn() }
}));

// 3. Mock Crypto
vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('mocked-hash-comment')
  },
  createHash: vi.fn().mockReturnThis()
}));

describe('createComment', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup base request
    req = {
      user: { sub: 'keycloak-uuid-123' },
      body: {
        testo: 'Questo è un commento di test',
        id_issue: '10'
      },
      files: []
    };

    // Setup response
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  // --- Test di Validazione e Autenticazione ---

  it('dovrebbe restituire 500 se l\'utente non è autenticato (req.user mancante)', async () => {
    req.user = null;

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Utente non autenticato')
    }));
  });

  it('dovrebbe restituire 500 se mancano campi obbligatori (testo)', async () => {
    req.body.testo = '';

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining("Campi obbligatori mancanti")
    }));
  });

  it('dovrebbe restituire 500 se mancano campi obbligatori (id_issue)', async () => {
    req.body.id_issue = '';

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining("Campi obbligatori mancanti")
    }));
  });

  // --- Test Logica di Business (Utente/Issue non trovati) ---

  it('dovrebbe restituire 500 se l\'utente non viene trovato nel DB locale', async () => {
    Utente.findOne.mockResolvedValue(null);

    await createComment(req, res);

    expect(Utente.findOne).toHaveBeenCalledWith({ where: { keycloak_id: 'keycloak-uuid-123' } });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Utente non trovato nel database locale."
    }));
  });

  it('dovrebbe restituire 500 se l\'issue non viene trovata', async () => {
    Utente.findOne.mockResolvedValue({ id: 1 });
    Issue.findByPk.mockResolvedValue(null);

    await createComment(req, res);

    expect(Issue.findByPk).toHaveBeenCalledWith('10'); // Verifica stringa passata
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Issue non trovata."
    }));
  });

  // --- Test Successo ---

  it('dovrebbe creare un commento con successo senza allegati', async () => {
    const mockUser = { id: 5 };
    const mockIssue = { id: 10 };
    const mockComment = {
      id: 100,
      testo: 'Testo',
      toJSON: () => ({ id: 100, testo: 'Testo' })
    };

    Utente.findOne.mockResolvedValue(mockUser);
    Issue.findByPk.mockResolvedValue(mockIssue);
    Commento.create.mockResolvedValue(mockComment);

    await createComment(req, res);

    expect(Commento.create).toHaveBeenCalledWith({
      testo: 'Questo è un commento di test',
      id_utente: 5,
      id_issue: 10 // Verifica conversione parseInt
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Commento creato con successo',
      data: {
        id: 100,
        testo: 'Testo',
        allegati: []
      }
    });
  });

  it('dovrebbe creare un commento con successo con allegati', async () => {
    const mockUser = { id: 5 };
    const mockIssue = { id: 10 };
    const mockComment = { id: 100, toJSON: () => ({ id: 100 }) };

    req.files = [
      {
        originalname: 'img.png',
        filename: 'hash123.png',
        path: 'uploads/hash123.png',
        mimetype: 'image/png',
        size: 1024
      }
    ];

    Utente.findOne.mockResolvedValue(mockUser);
    Issue.findByPk.mockResolvedValue(mockIssue);
    Commento.create.mockResolvedValue(mockComment);

    // Poiché abbiamo mockato promisify per ritornare la funzione stessa,
    // mockiamo readFile come una funzione che ritorna una Promise (async)
    fsMocks.readFile.mockResolvedValue(Buffer.from('fake-image-data'));

    Allegato.create.mockImplementation(data => Promise.resolve({ ...data, id: 500 }));

    await createComment(req, res);

    // Verifiche
    expect(fsMocks.readFile).toHaveBeenCalledWith('uploads/hash123.png');
    expect(Allegato.create).toHaveBeenCalledWith(expect.objectContaining({
      nome_file_originale: 'img.png',
      hash_sha256: 'mocked-hash-comment',
      id_commento: 100,
      id_issue: null
    }));

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        allegati: expect.arrayContaining([expect.objectContaining({ id: 500 })])
      })
    }));
  });

  // --- Test Gestione Errori e Pulizia (Cleanup) ---

  it('dovrebbe eliminare i file caricati se si verifica un errore (es. DB fallisce)', async () => {
    req.files = [{ path: 'uploads/to-delete.jpg' }];

    Utente.findOne.mockResolvedValue({ id: 5 });
    Issue.findByPk.mockResolvedValue({ id: 10 });

    // Simuliamo errore durante la creazione del commento
    Commento.create.mockRejectedValue(new Error('DB Error'));

    fsMocks.unlink.mockResolvedValue(); // Unlink ok

    // Silenzia console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await createComment(req, res);

    expect(fsMocks.unlink).toHaveBeenCalledWith('uploads/to-delete.jpg');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB Error'
    });

    consoleSpy.mockRestore();
  });

  it('dovrebbe gestire l\'errore di req.files undefined', async () => {
    req.files = undefined; // Simuliamo caso limite

    Utente.findOne.mockResolvedValue({ id: 5 });
    Issue.findByPk.mockResolvedValue({ id: 10 });
    const mockComment = { id: 100, toJSON: () => ({}) };
    Commento.create.mockResolvedValue(mockComment);

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });

  it('dovrebbe non crashare se la pulizia (unlink) fallisce', async () => {
    req.files = [{ path: 'uploads/fail-delete.jpg' }];
    Utente.findOne.mockRejectedValue(new Error('Errore Iniziale')); // Errore che triggera il catch

    // Unlink fallisce
    fsMocks.unlink.mockRejectedValue(new Error('Unlink fallito'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await createComment(req, res);

    // Deve loggare l'errore di pulizia ma rispondere con l'errore originale
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Errore Iniziale'
    }));

    // Verifica che console.error sia stato chiamato per l'unlink
    expect(consoleSpy).toHaveBeenCalledWith('Errore pulizia file:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});