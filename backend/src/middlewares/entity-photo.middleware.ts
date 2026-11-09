import multer from 'multer'
import { PHOTO_MAX_BYTES, PHOTO_MIME_TYPES } from '../services/entity-photo.service'

// Buffer at most one bounded file. Services authorize before writing anything.
export const uploadEntityPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_MAX_BYTES, files: 1, fields: 30, fieldSize: 32 * 1024 },
  fileFilter: (_req, file, done) => PHOTO_MIME_TYPES.includes(file.mimetype)
    ? done(null, true)
    : done(new Error('Solo se permiten imágenes JPG, PNG o WebP.')),
}).single('picture')
