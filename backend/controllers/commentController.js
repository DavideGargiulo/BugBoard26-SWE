import { Commento, Allegato, Utente, Issue } from '../data/remote/Database.js';
import fs from 'node:fs';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

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
    const id = Number.parseInt(req.params.issueId, 10);
    if (Number.isNaN(id)) {
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
          required: false
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

    if (!req.user || !req.user.sub) {
      throw new Error("Utente non autenticato o token non valido.");
    }
    const keycloakId = req.user.sub;

    if (!testo || !id_issue) {
      throw new Error("Campi obbligatori mancanti: 'testo' e 'id_issue' sono richiesti.");
    }

    const user = await Utente.findOne({ where: { keycloak_id: keycloakId } });
    if (!user) {
      throw new Error("Utente non trovato nel database locale.");
    }

    const issue = await Issue.findByPk(id_issue);
    if (!issue) {
      throw new Error("Issue non trovata.");
    }

    const newComment = await Commento.create({
      testo,
      id_utente: user.id,
      id_issue: Number.parseInt(id_issue, 10)
    });

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
          id_issue: null,
          id_commento: newComment.id
        });
      });

      allegatiCreati = await Promise.all(allegatoPromises);
    }

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

    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        unlinkFile(file.path).catch(err => console.error('Errore pulizia file:', err));
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Errore nella creazione del commento'
    });
  }
};