import express from 'express';
import { uploader } from '../data/local/multerStorage/uploader.js';

const router = express.Router();

// Test upload singolo
router.post('/test-upload', (req, res) => {
  uploader.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Errore durante il caricamento del file'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File caricato con successo',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      }
    });
  });
});

router.post('/test-upload-multiple', (req, res) => {
  uploader.array('files', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Errore durante il caricamento dei file'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
    }

    res.status(200).json({
      success: true,
      message: `${req.files.length} file caricati con successo`,
      files: req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }))
    });
  });
});

export default router;