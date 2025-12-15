import multer from 'multer'
import crypto from 'crypto'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex')
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
})

const allowedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploader = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 3
  },
  fileFilter: function (req, file, cb) {
    if (!allowedTypes.has(file.mimetype)) {
      return cb(new Error(`Tipo di file non supportato: ${file.mimetype}. Sono permessi solo JPEG, PNG e PDF.`), false);
    }

    const extension = file.originalname.toLowerCase();
    if (!(extension.endsWith('.jpg') || extension.endsWith('.jpeg') || extension.endsWith('.png') || extension.endsWith('.pdf'))) {
      return cb(new Error(`Estensione file non valida. L'estensione non corrisponde al tipo MIME.`), false);
    }

    cb(null, true);
  }
});