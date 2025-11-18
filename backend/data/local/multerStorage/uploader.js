import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
})

const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

export const uploader = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb({ status: 400, message: 'Unsupported file type' }, false);
    }

    const extension = file.originalname.toLowerCase();
    if (!(extension.endsWith('.jpg') || extension.endsWith('.jpeg') || extension.endsWith('.png') || extension.endsWith('.pdf'))) {
      return cb({ status: 400, message: 'File extension does not match MIME type' }, false);
    }

    cb(null, true);
  }
});