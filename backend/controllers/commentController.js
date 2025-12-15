import { Commento, Allegato, Utente, Issue } from '../data/remote/Database.js';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';

// Definiamo le versioni promise-based delle funzioni fs
const readFile = promisify(fs.readFile);
const unlinkFile = promisify(fs.unlink);

export const countCommentsByIssueId = async (issueId) => {
  try {
    const count = await Commento.count({
      where: { id_issue: issueId }
    });
    return count;
  }
  catch (error) {
    throw new Error(`Errore nel conteggio dei commenti: ${error.message}`);
  }
};

export const getCommentByIssueId = async (req, res) => {
  try {
    // Ensure issueId is an integer
    const id = parseInt(req.params.issueId, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID provided'
      });
    }

    const comments = await Commento.findAll({
      where: { id_issue: id },
      include: [
        {
          model: Allegato,
          required: false // LEFT JOIN: prende il commento anche se non ha allegati
        }
      ],
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Errore nel recupero dei commenti: ${error.message}`
    });
  }
};

export const createComment = async (req, res) => {
  const uploadedFiles = req.files || [];

  try {
    const { testo, id_issue } = req.body;

    // Controllo se l'utente è autenticato (req.user popolato dal middleware protect)
    if (!req.user || !req.user.sub) {
       throw new Error("Utente non autenticato o token non valido.");
    }
    const keycloakId = req.user.sub;

    // 1. Validazione input base
    if (!testo || !id_issue) {
      throw new Error("Campi obbligatori mancanti: 'testo' e 'id_issue' sono richiesti.");
    }

    // 2. Recupera l'utente locale (per avere l'ID numerico)
    const user = await Utente.findOne({ where: { keycloak_id: keycloakId } });
    if (!user) {
      throw new Error("Utente non trovato nel database locale.");
    }

    // 3. Verifica che l'issue esista
    const issue = await Issue.findByPk(id_issue);
    if (!issue) {
      throw new Error("Issue non trovata.");
    }

    // 4. Crea il Commento
    const newComment = await Commento.create({
      testo,
      id_utente: user.id,
      id_issue: parseInt(id_issue, 10)
    });

    // 5. Gestione Allegati (se presenti)
    let allegatiCreati = [];
    if (uploadedFiles.length > 0) {
      const allegatoPromises = uploadedFiles.map(async (file) => {
        const fileBuffer = await readFile(file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        return await Allegato.create({
          nome_file_originale: file.originalname,
          nome_file_storage: file.filename,
          percorso_relativo: file.path,
          tipo_mime: file.mimetype,
          dimensione_byte: file.size,
          hash_sha256: hash,
          id_issue: null,        // NULL perché è allegato a un commento
          id_commento: newComment.id
        });
      });

      allegatiCreati = await Promise.all(allegatoPromises);
    }

    // 6. Risposta successo
    res.status(201).json({
      success: true,
      message: 'Commento creato con successo',
      data: {
        ...newComment.toJSON(),
        allegati: allegatiCreati
      }
    });

  } catch (error) {
    console.error('Errore creazione commento:', error);

    // Rollback manuale file: se qualcosa fallisce, cancelliamo i file caricati
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        // Usa la funzione definita in alto (promisify)
        unlinkFile(file.path).catch(err => console.error('Errore pulizia file:', err));
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Errore nella creazione del commento'
    });
  }
};