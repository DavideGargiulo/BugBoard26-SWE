import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateIssue } from '../controllers/issueController.js';
import { Issue, Allegato } from '../data/remote/Database.js';
import crypto from 'node:crypto';

const fsMocks = vi.hoisted(() => ({
  unlink: vi.fn(),
  readFile: vi.fn()
}));

vi.mock('node:fs', () => ({
  promises: fsMocks,
  default: {
    ...fsMocks,
    promises: fsMocks
  }
}));

vi.mock('fs/promises', () => ({
  ...fsMocks,
  default: fsMocks
}));

vi.mock('../data/remote/Database.js', () => ({
  Issue: {
    findByPk: vi.fn()
  },
  Allegato: {
    count: vi.fn(),
    create: vi.fn()
  }
}));

vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('mocked-hash')
  },
  createHash: vi.fn().mockReturnThis()
}));

describe('Test metodo UpdateIssue', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: { id: '1' },
      body: {},
      files: null
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  it('dovrebbe restituire errore 400 se la descrizione è vuota', async () => {
    req.body = { descrizione: '' };

    await updateIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Devi fornire almeno una descrizione per aggiornare l'issue"
    });
  });

  it('dovrebbe restituire errore 400 se la descrizione contiene solo spazi', async () => {
    req.body = { descrizione: '   ' };

    await updateIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Devi fornire almeno una descrizione per aggiornare l'issue"
    });
  });

  it('dovrebbe restituire errore 404 se l\'issue non viene trovata', async () => {
    req.body = { descrizione: 'Nuova descrizione' };
    Issue.findByPk.mockResolvedValue(null);

    await updateIssue(req, res);

    expect(Issue.findByPk).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Issue non trovata' });
  });

  it('dovrebbe eliminare i file caricati se l\'issue non viene trovata', async () => {
    req.body = { descrizione: 'Nuova descrizione' };
    req.files = [
      { path: '/uploads/file1.jpg' },
      { path: '/uploads/file2.jpg' }
    ];

    Issue.findByPk.mockResolvedValue(null);
    fsMocks.unlink.mockResolvedValue();

    await updateIssue(req, res);

    expect(fsMocks.unlink).toHaveBeenCalledTimes(2);
    expect(fsMocks.unlink).toHaveBeenCalledWith('/uploads/file1.jpg');
    expect(fsMocks.unlink).toHaveBeenCalledWith('/uploads/file2.jpg');
  });

  it('dovrebbe restituire errore 400 se si supera il limite di 3 allegati', async () => {
    req.body = { descrizione: 'Nuova descrizione' };
    req.files = [
      { path: '/uploads/file1.jpg' },
      { path: '/uploads/file2.jpg' }
    ];

    const mockIssue = { id: 1 };
    Issue.findByPk.mockResolvedValue(mockIssue);
    Allegato.count.mockResolvedValue(2);
    fsMocks.unlink.mockResolvedValue();

    await updateIssue(req, res);

    expect(Allegato.count).toHaveBeenCalledWith({
      where: {
        id_issue: '1',
        id_commento: null
      }
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Limite superato. L'issue ha già 2 allegati e ne stai inviando 2. Il massimo totale consentito è 3."
    });
    expect(fsMocks.unlink).toHaveBeenCalledTimes(2);
  });

  it('dovrebbe aggiornare l\'issue con successo con solo descrizione', async () => {
    req.body = { descrizione: 'Nuova descrizione' };

    const mockIssue = {
      id: 1,
      descrizione: 'Descrizione esistente',
      update: vi.fn().mockResolvedValue()
    };

    const mockUpdatedIssue = {
      id: 1,
      descrizione: 'Descrizione esistente<br><br><strong>22/12/2024, 10:30:</strong><br>Nuova descrizione',
      allegati: []
    };

    Issue.findByPk
      .mockResolvedValueOnce(mockIssue)
      .mockResolvedValueOnce(mockUpdatedIssue);

    Allegato.count.mockResolvedValue(0);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-22T10:30:00'));

    await updateIssue(req, res);

    expect(mockIssue.update).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Issue aggiornata con successo',
      issue: mockUpdatedIssue
    });

    vi.useRealTimers();
  });

  it('dovrebbe aggiornare l\'issue con descrizione e allegati', async () => {
    req.body = { descrizione: 'Nuova descrizione' };
    req.files = [
      {
        originalname: 'test.jpg',
        filename: 'test-123.jpg',
        path: '/uploads/test-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      }
    ];

    const mockIssue = {
      id: 1,
      descrizione: 'Descrizione esistente',
      update: vi.fn().mockResolvedValue()
    };

    const mockUpdatedIssue = {
      id: 1,
      descrizione: 'Descrizione aggiornata',
      allegati: [{ id: 1, nome_file_originale: 'test.jpg' }]
    };

    Issue.findByPk
      .mockResolvedValueOnce(mockIssue)
      .mockResolvedValueOnce(mockUpdatedIssue);

    Allegato.count.mockResolvedValue(0);
    Allegato.create.mockResolvedValue({ id: 1 });

    fsMocks.readFile.mockResolvedValue(Buffer.from('test'));

    const mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('abc123')
    };
    crypto.createHash.mockReturnValue(mockHash);

    await updateIssue(req, res);

    expect(Allegato.create).toHaveBeenCalledWith({
      nome_file_originale: 'test.jpg',
      nome_file_storage: 'test-123.jpg',
      percorso_relativo: '/uploads/test-123.jpg',
      tipo_mime: 'image/jpeg',
      dimensione_byte: 1024,
      hash_sha256: 'abc123',
      id_issue: '1',
      id_commento: null
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Issue aggiornata con successo',
      issue: mockUpdatedIssue
    });
  });

  it('dovrebbe aggiungere l\'header con timestamp quando la descrizione è vuota', async () => {
    req.body = { descrizione: 'Prima descrizione' };

    const mockIssue = {
      id: 1,
      descrizione: '',
      update: vi.fn().mockResolvedValue()
    };

    Issue.findByPk.mockResolvedValue(mockIssue);
    Allegato.count.mockResolvedValue(0);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-22T10:30:00'));

    await updateIssue(req, res);

    const expectedDescription = '<br><br><strong>22/12/2024, 10:30:</strong><br>Prima descrizione';
    expect(mockIssue.update).toHaveBeenCalledWith({ descrizione: expectedDescription });

    vi.useRealTimers();
  });

  it('dovrebbe gestire errori generici e pulire i file caricati', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    req.body = { descrizione: 'Nuova descrizione' };
    req.files = [{ path: '/uploads/file1.jpg' }];

    Issue.findByPk.mockRejectedValue(new Error('Database error'));
    fsMocks.unlink.mockResolvedValue();

    await updateIssue(req, res);

    expect(fsMocks.unlink).toHaveBeenCalledWith('/uploads/file1.jpg');
    expect(res.status).toHaveBeenCalledWith(500);

    consoleSpy.mockRestore();
  });

  it('dovrebbe gestire errori durante l\'eliminazione dei file', async () => {
    req.body = { descrizione: 'Nuova descrizione' };
    req.files = [{ path: '/uploads/file1.jpg' }];

    Issue.findByPk.mockResolvedValue(null);
    fsMocks.unlink.mockRejectedValue(new Error('Unlink error'));

    await updateIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('dovrebbe processare multipli file contemporaneamente', async () => {
    req.body = { descrizione: 'Nuova descrizione' };
    req.files = [
      {
        originalname: 'test1.jpg',
        filename: 'test1-123.jpg',
        path: '/uploads/test1-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      },
      {
        originalname: 'test2.pdf',
        filename: 'test2-456.pdf',
        path: '/uploads/test2-456.pdf',
        mimetype: 'application/pdf',
        size: 2048
      }
    ];

    const mockIssue = {
      id: 1,
      descrizione: '',
      update: vi.fn().mockResolvedValue()
    };

    Issue.findByPk.mockResolvedValue(mockIssue);
    Allegato.count.mockResolvedValue(0);
    Allegato.create.mockResolvedValue({ id: 1 });

    fsMocks.readFile.mockResolvedValue(Buffer.from('test'));

    const mockHash = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('abc123')
    };
    crypto.createHash.mockReturnValue(mockHash);

    await updateIssue(req, res);

    expect(Allegato.create).toHaveBeenCalledTimes(2);
    expect(fsMocks.readFile).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});