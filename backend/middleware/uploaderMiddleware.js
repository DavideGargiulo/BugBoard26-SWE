import multer from 'multer';
import { uploader } from '../data/local/multerStorage/uploader.js';

/**
 * Middleware per gestire l'upload di file con validazione errori
 * @param {string} fieldName - Nome del campo file nel form (default: 'images')
 * @param {number} maxFiles - Numero massimo di file consentiti (default: 3)
 */
export const handleFileUpload = (fieldName = 'images', maxFiles = 3) => {
  return (req, res, next) => {
    uploader.array(fieldName, maxFiles)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Errori di Multer (limiti superati)
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return res.status(413).json({
              message: 'File troppo grande. Massimo 5MB per file.'
            });

          case 'LIMIT_FILE_COUNT':
            return res.status(400).json({
              message: `Troppi file. Massimo ${maxFiles} file consentiti.`
            });

          case 'LIMIT_UNEXPECTED_FILE':
            return res.status(400).json({
              message: `Campo file non valido. Usa il campo '${fieldName}'.`
            });

          case 'LIMIT_FIELD_COUNT':
            return res.status(400).json({
              message: 'Troppi campi nella richiesta.'
            });

          case 'LIMIT_PART_COUNT':
            return res.status(400).json({
              message: 'Richiesta troppo complessa.'
            });

          default:
            return res.status(400).json({
              message: `Errore upload: ${err.message}`
            });
        }
      } else if (err) {
        // Errori dal fileFilter (tipo file non valido, estensione non corrispondente)
        return res.status(400).json({
          message: err.message
        });
      }

      // Nessun errore, procedi al prossimo middleware
      next();
    });
  };
};

/**
 * Middleware preconfigurato per upload file issue (max 3 file)
 */
export const uploadImages = handleFileUpload('images', 3);