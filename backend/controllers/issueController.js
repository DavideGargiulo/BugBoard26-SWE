import { Issue, Progetto, Utente, Allegato, Commento, database } from '../data/remote/Database.js';
import { countCommentsByIssueId } from './commentController.js';
import fs from 'node:fs';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const readFile = promisify(fs.readFile);

export const getProjectIdByName = async (projectName) => {
  try {
    const project = await Progetto.findOne({
      where: { nome: projectName }
    });

    if (!project) {
      return null;
    }

    return project.id;
  } catch (error) {
    throw new Error(`Errore nel recupero del progetto: ${error.message}`);
  }
};

export const getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.findAll({
      attributes: { exclude: ['id_creatore'] },
      include: [
        {
          model: Utente,
          as: 'Creatore',
          attributes: [
            [database.fn('CONCAT', database.col('nome'), ' ', database.col('cognome')), 'nome'],
            'email'
          ]
        }
      ]
    });

    const issuesWithCount = await Promise.all(
      issues.map(async (issue) => {
        const numeroCommenti = await countCommentsByIssueId(issue.id);
        return {
          ...issue.toJSON(),
          numeroCommenti
        };
      })
    );

    res.status(200).json(issuesWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle issue', error: error.message });
  }
};

export const getIssuesByProject = async (req, res) => {
  try {
    const { projectName } = req.params;

    const projectId = await getProjectIdByName(projectName);

    if (!projectId) {
      return res.status(404).json({ message: 'Progetto non trovato' });
    }

    const issues = await Issue.findAll({
      where: { id_progetto: projectId },
      attributes: { exclude: ['id_creatore'] },
      include: [
        {
          model: Utente,
          as: 'Creatore',
          attributes: [
            [database.fn('CONCAT', database.col('nome'), ' ', database.col('cognome')), 'nome'],
            'email'
          ]
        }
      ]
    });

    const issuesWithCount = await Promise.all(
      issues.map(async (issue) => {
        const numeroCommenti = await countCommentsByIssueId(issue.id);
        return {
          ...issue.toJSON(),
          numeroCommenti
        };
      })
    );

    res.status(200).json(issuesWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Errore nel recupero delle issue', error: error.message });
  }
};

export const createIssue = async (req, res) => {
  try {
    const { titolo, descrizione, tipo, priorita, progetto } = req.body;

    const keycloakId = req.user.sub;

    const user = await Utente.findOne({ where: { keycloak_id: keycloakId } });

    if (!user) {
      return res.status(400).json({
        message: "Utente non trovato nel DB locale",
        keycloakId
      });
    }

    const id_creatore = user.id;

    if (!titolo || !descrizione || !tipo || !progetto) {
      return res.status(400).json({
        message: 'Campi obbligatori mancanti',
        required: ['titolo', 'descrizione', 'tipo', 'progetto']
      });
    }

    const projectId = await getProjectIdByName(progetto);

    if (!projectId) {
      return res.status(404).json({ message: 'Progetto non trovato' });
    }

    const newIssue = await Issue.create({
      titolo,
      descrizione,
      tipo,
      stato: 'TODO',
      priorita: priorita || null,
      id_creatore,
      id_progetto: projectId
    });

    let allegatiCreati = [];
    if (req.files && req.files.length > 0) {
      const allegatoPromises = req.files.map(async (file) => {
        const fileBuffer = await readFile(file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        return await Allegato.create({
          nome_file_originale: file.originalname,
          nome_file_storage: file.filename,
          percorso_relativo: file.path,
          tipo_mime: file.mimetype,
          dimensione_byte: file.size,
          hash_sha256: hash,
          id_issue: newIssue.id,
          id_commento: null
        });
      });

      allegatiCreati = await Promise.all(allegatoPromises);
    }

    res.status(201).json({
      message: 'Issue creata con successo',
      issue: newIssue,
      createdBy: id_creatore,
      allegati: allegatiCreati.length,
      allegatiDettagli: allegatiCreati.map(a => ({
        id: a.id,
        nome_originale: a.nome_file_originale,
        tipo: a.tipo_mime,
        dimensione: a.dimensione_byte
      }))
    });

  } catch (error) {
    console.error('Errore nella creazione della issue:', error);
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Errore nell\'eliminazione del file:', err);
        });
      });
    }

    res.status(500).json({
      message: 'Errore nella creazione della issue',
      error: error.message
    });
  }
};

export const updateIssue = async (req, res) => {
  try {
    const issueId = req.params.id;
    const { descrizione } = req.body;

    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(404).json({ message: 'Issue non trovata' });
    }

    const existingAttachmentsCount = await Allegato.count({
      where: {
        id_issue: issueId,
        id_commento: null
      }
    });

    const newFilesCount = req.files ? req.files.length : 0;

    if (existingAttachmentsCount + newFilesCount > 3) {
      if (req.files) {
        req.files.forEach(file => fs.unlink(file.path, () => {}));
      }
      return res.status(400).json({
        message: `Limite superato. L'issue ha già ${existingAttachmentsCount} allegati e ne stai inviando ${newFilesCount}. Il massimo totale consentito è 3.`
      });
    }

    if (req.files && req.files.length > 0) {
      const allegatoPromises = req.files.map(async (file) => {
        const fileBuffer = await readFile(file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        return Allegato.create({
          nome_file_originale: file.originalname,
          nome_file_storage: file.filename,
          percorso_relativo: file.path,
          tipo_mime: file.mimetype,
          dimensione_byte: file.size,
          hash_sha256: hash,
          id_issue: issueId,
          id_commento: null
        });
      });

      await Promise.all(allegatoPromises);
    }

    if (descrizione && descrizione.trim() !== '') {
      const now = new Date();
      const timestamp = now.toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const updateHeader = `
        <br>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;">
        <p><strong>🔄 Aggiornamento del ${timestamp}:</strong></p>
      `;

      const oldDescription = issue.descrizione || '';
      const finalDescription = oldDescription
        ? `${oldDescription}${updateHeader}${descrizione}`
        : `${updateHeader}${descrizione}`;

      await issue.update({ descrizione: finalDescription });
    }

    const updatedIssue = await Issue.findByPk(issueId, {
       include: [{
         model: Allegato,
         as: 'allegati',
         where: { id_commento: null },
         required: false
       }]
    });

    res.status(200).json({
      message: 'Issue aggiornata con successo',
      issue: updatedIssue
    });

  } catch (error) {
    console.error('Errore update:', error);
    if (req.files) {
      req.files.forEach(file => fs.unlink(file.path, () => {}).catch(() => {}));
    }
    res.status(500).json({
      message: 'Errore nell\'aggiornamento della issue',
      error: error.message
    });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const issueId = req.params.id;

    const issue = await Issue.findByPk(issueId, {
      attributes: { exclude: ['id_creatore'] },
      include: [
        {
          model: Utente,
          as: 'Creatore',
          attributes: [
            [database.fn('CONCAT', database.col('Creatore.nome'), ' ', database.col('Creatore.cognome')), 'nome'],
            'email'
          ]
        },
        {
          model: Progetto,
          as: 'progetto',
          attributes: ['id', 'nome']
        }
      ]
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue non trovata' });
    }

    const commenti = await Commento.findAll({
      where: { id_issue: issueId },
      include: [
        {
          model: Utente,
          as: 'utente',
          attributes: [
            [database.fn('CONCAT', database.col('utente.nome'), ' ', database.col('utente.cognome')), 'nome'],
            'email'
          ]
        },
        {
          model: Allegato,
          as: 'allegati',
          required: false,
          attributes: ['id', 'nome_file_originale', 'tipo_mime', 'dimensione_byte', 'percorso_relativo']
        }
      ],
      order: [['id', 'ASC']]
    });

    const allegatiIssue = await Allegato.findAll({
      where: {
        id_issue: issueId,
        id_commento: null
      },
      attributes: ['id', 'nome_file_originale', 'tipo_mime', 'dimensione_byte', 'percorso_relativo']
    });

    const issueDettagliata = {
      ...issue.toJSON(),
      allegati: allegatiIssue,
      numeroCommenti: commenti.length,
      commenti: commenti.map(commento => ({
        id: commento.id,
        testo: commento.testo,
        autore: commento.utente,
        allegati: commento.allegati || []
      }))
    };

    res.status(200).json(issueDettagliata);

  } catch (error) {
    console.error('Errore nel recupero dei dettagli dell\'issue:', error);
    res.status(500).json({
      message: 'Errore nel recupero dei dettagli dell\'issue',
      error: error.message
    });
  }
};

export const completeIssue = async (req, res) => {
  try {
    const issueId = req.params.id;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue non trovata'
      });
    }

    if (issue.stato === 'Done') {
      return res.status(400).json({
        message: 'Issue già completata'
      });
    }

    await issue.update({
      stato: 'Done'
    });

    res.status(200).json({
      message: 'Issue completata con successo',
      issue
    });

  } catch (error) {
    res.status(500).json({
      message: 'Errore nel completamento della issue',
      error: error.message
    });
  }
};