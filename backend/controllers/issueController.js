import { Issue, Progetto, Utente, Allegato, database } from '../data/remote/Database.js';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';

const readFile = promisify(fs.readFile);

const getProjectIdByName = async (projectName) => {
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

    res.status(200).json(issues);
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

    res.status(200).json(issues);
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

    // Validazione campi obbligatori
    if (!titolo || !descrizione || !tipo || !progetto) {
      return res.status(400).json({
        message: 'Campi obbligatori mancanti',
        required: ['titolo', 'descrizione', 'tipo', 'progetto']
      });
    }

    // Ottieni l'ID del progetto dal nome
    const projectId = await getProjectIdByName(progetto);

    if (!projectId) {
      return res.status(404).json({ message: 'Progetto non trovato' });
    }

    // Crea la nuova issue
    const newIssue = await Issue.create({
      titolo,
      descrizione,
      tipo,
      stato: 'TODO',
      priorita: priorita || null,
      id_creatore,
      id_progetto: projectId
    });

    // Gestione degli allegati
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
    const { titolo, descrizione, tipo, stato, priorita } = req.body;

    // Trova l'issue
    const issue = await Issue.findByPk(issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue non trovata' });
    }

    // Prepara i dati da aggiornare
    const updateData = {};

    if (titolo !== undefined) updateData.titolo = titolo;
    if (descrizione !== undefined) updateData.descrizione = descrizione;
    if (tipo !== undefined) {
      const tipiValidi = ['Question', 'Bug', 'Documentation', 'Feature'];
      if (!tipiValidi.includes(tipo)) {
        return res.status(400).json({
          message: 'Tipo non valido',
          validTypes: tipiValidi
        });
      }
      updateData.tipo = tipo;
    }
    if (stato !== undefined) {
      const statiValidi = ['TODO', 'In-Progress', 'Done'];
      if (!statiValidi.includes(stato)) {
        return res.status(400).json({
          message: 'Stato non valido',
          validStates: statiValidi
        });
      }
      updateData.stato = stato;
    }
    if (priorita !== undefined) {
      if (priorita !== null) {
        const prioritaValide = ['Alta', 'Media', 'Bassa'];
        if (!prioritaValide.includes(priorita)) {
          return res.status(400).json({
            message: 'Priorità non valida',
            validPriorities: prioritaValide
          });
        }
      }
      updateData.priorita = priorita;
    }

    // Aggiorna l'issue
    await issue.update(updateData);

    res.status(200).json({
      message: 'Issue aggiornata con successo',
      issue: issue
    });

  } catch (error) {
    res.status(500).json({
      message: 'Errore nell\'aggiornamento della issue',
      error: error.message
    });
  }
};