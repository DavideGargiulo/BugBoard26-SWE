import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createIssue } from '../controllers/issueController.js';
import { Utente, Issue, Allegato, Progetto } from '../data/remote/Database.js';

const fsMocks = vi.hoisted(() => ({
  unlink: vi.fn(),
  readFile: vi.fn()
}));

vi.mock('node:fs', () => ({
  promises: fsMocks,
  default: { ...fsMocks, promises: fsMocks }
}));

vi.mock('fs/promises', () => ({
  ...fsMocks,
  default: fsMocks
}));

vi.mock('../data/remote/Database.js', () => ({
  Utente: { findOne: vi.fn() },
  Progetto: { findOne: vi.fn() },
  Issue: { create: vi.fn() },
  Allegato: { create: vi.fn() }
}));

vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('mocked-hash-123')
  },
  createHash: vi.fn().mockReturnThis()
}));

describe('createIssue', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { sub: 'keycloak-uuid-123' },
      body: {
        titolo: 'Titolo Issue',
        descrizione: 'Descrizione Issue',
        tipo: 'Bug',
        progetto: 'Progetto Alpha',
        priorita: 'Alta'
      },
      files: []
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  it('dovrebbe restituire 400 se l\'utente non esiste nel DB locale', async () => {
    Utente.findOne.mockResolvedValue(null);

    await createIssue(req, res);

    expect(Utente.findOne).toHaveBeenCalledWith({ where: { keycloak_id: 'keycloak-uuid-123' } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Utente non trovato nel DB locale"
    }));
  });

  it('dovrebbe restituire 400 se manca il titolo obbligatorio', async () => {
    Utente.findOne.mockResolvedValue({ id: 1 });

    req.body.titolo = '';

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Campi obbligatori mancanti',
      required: ['titolo', 'descrizione', 'tipo', 'priorita', 'progetto']
    });
  });

  it('dovrebbe restituire 400 se manca la descrizione obbligatoria', async () => {
    Utente.findOne.mockResolvedValue({ id: 1 });

    req.body.descrizione = '';

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Campi obbligatori mancanti',
      required: ['titolo', 'descrizione', 'tipo', 'priorita', 'progetto']
    });
  });

  it('dovrebbe restituire 400 se manca il tipo obbligatorio', async () => {
    Utente.findOne.mockResolvedValue({ id: 1 });

    req.body.tipo = '';

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Campi obbligatori mancanti',
      required: ['titolo', 'descrizione', 'tipo', 'priorita', 'progetto']
    });
  });

  it('dovrebbe restituire 400 se manca il progetto obbligatorio', async () => {
    Utente.findOne.mockResolvedValue({ id: 1 });

    req.body.progetto = '';

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Campi obbligatori mancanti',
      required: ['titolo', 'descrizione', 'tipo', 'priorita', 'progetto']
    });
  });

  it('dovrebbe restituire 400 se manca la priorita obbligatoria', async () => {
    Utente.findOne.mockResolvedValue({ id: 1 });

    req.body.priorita = '';

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Campi obbligatori mancanti',
      required: ['titolo', 'descrizione', 'tipo', 'priorita', 'progetto']
    });
  });

  it('dovrebbe restituire 404 se il progetto non viene trovato', async () => {
    Utente.findOne.mockResolvedValue({ id: 1 });
    Progetto.findOne.mockResolvedValue(null);

    await createIssue(req, res);

    expect(Progetto.findOne).toHaveBeenCalledWith({ where: { nome: 'Progetto Alpha' } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Progetto non trovato' });
  });

  it('dovrebbe creare una issue con successo senza allegati', async () => {
    const mockUser = { id: 10 };
    const mockProject = { id: 50, nome: 'Progetto Alpha' };
    const mockCreatedIssue = {
      id: 99,
      titolo: req.body.titolo,
      toJSON: () => ({ id: 99 })
    };

    Utente.findOne.mockResolvedValue(mockUser);
    Progetto.findOne.mockResolvedValue(mockProject);
    Issue.create.mockResolvedValue(mockCreatedIssue);

    await createIssue(req, res);

    expect(Issue.create).toHaveBeenCalledWith({
      titolo: 'Titolo Issue',
      descrizione: 'Descrizione Issue',
      tipo: 'Bug',
      stato: 'TODO',
      priorita: 'Alta',
      id_creatore: 10,
      id_progetto: 50
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Issue creata con successo',
      issue: mockCreatedIssue,
      allegati: 0
    }));
  });

  it('dovrebbe creare una issue con successo con allegati', async () => {
    const mockUser = { id: 10 };
    const mockProject = { id: 50 };
    const mockCreatedIssue = { id: 99 };

    req.files = [
      {
        originalname: 'test.pdf',
        filename: 'storage-123.pdf',
        path: 'uploads/storage-123.pdf',
        mimetype: 'application/pdf',
        size: 500
      }
    ];

    Utente.findOne.mockResolvedValue(mockUser);
    Progetto.findOne.mockResolvedValue(mockProject);
    Issue.create.mockResolvedValue(mockCreatedIssue);
    fsMocks.readFile.mockResolvedValue(Buffer.from('file-content'));
    Allegato.create.mockImplementation(data => Promise.resolve({ ...data, id: 777 }));

    await createIssue(req, res);

    expect(fsMocks.readFile).toHaveBeenCalledWith('uploads/storage-123.pdf');

    expect(Allegato.create).toHaveBeenCalledWith(expect.objectContaining({
      nome_file_originale: 'test.pdf',
      nome_file_storage: 'storage-123.pdf',
      hash_sha256: 'mocked-hash-123',
      id_issue: 99
    }));

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      allegati: 1,
      allegatiDettagli: expect.arrayContaining([
        expect.objectContaining({ id: 777, nome_originale: 'test.pdf' })
      ])
    }));
  });

  it('dovrebbe restituire 500 ed eliminare i file se si verifica un errore durante la creazione', async () => {
    req.files = [{ path: 'uploads/temp.jpg' }];

    Utente.findOne.mockResolvedValue({ id: 1 });
    Progetto.findOne.mockResolvedValue({ id: 1 });
    Issue.create.mockRejectedValue(new Error('DB Insert Failed'));

    fsMocks.unlink.mockResolvedValue();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await createIssue(req, res);

    expect(fsMocks.unlink).toHaveBeenCalledWith('uploads/temp.jpg');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Errore nella creazione della issue',
      error: 'DB Insert Failed'
    });

    consoleSpy.mockRestore();
  });

  it('dovrebbe gestire il fallimento della pulizia dei file (unlink) senza crashare', async () => {
    req.files = [{ path: 'uploads/temp.jpg' }];

    Utente.findOne.mockResolvedValue({ id: 1 });
    Progetto.findOne.mockResolvedValue({ id: 1 });
    Issue.create.mockRejectedValue(new Error('Errore Iniziale'));

    fsMocks.unlink.mockRejectedValue(new Error('Impossibile eliminare file'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await createIssue(req, res);

    // Deve comunque restituire 500 per l'errore originale
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Errore nella creazione della issue',
      error: 'Errore Iniziale'
    }));

    consoleSpy.mockRestore();
  });
});