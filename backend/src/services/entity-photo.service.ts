import { randomUUID } from 'crypto'
import { mkdir, writeFile, unlink } from 'fs/promises'
import path from 'path'

export const uploadsRoot = path.resolve(process.env['UPLOADS_DIR'] || path.resolve(__dirname, '../../uploads'))
export const PHOTO_MAX_BYTES = 3 * 1024 * 1024
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
type PhotoFolder = 'communities' | 'gardens'

function photoExtension(file: Express.Multer.File) {
  const bytes = file.buffer
  const png = bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR'
  const jpeg = bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217
  const webp = bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))
  const extension = file.mimetype === 'image/png' && png ? 'png' : file.mimetype === 'image/jpeg' && jpeg ? 'jpg' : file.mimetype === 'image/webp' && webp ? 'webp' : null
  if (!extension || !file.size || file.size > PHOTO_MAX_BYTES) {
    throw Object.assign(new Error('Selecciona una imagen JPG, PNG o WebP válida de hasta 3 MB.'), { code: 'INVALID_PHOTO' })
  }
  return extension
}

async function removeStoredPhoto(folder: PhotoFolder, url: string | null | undefined) {
  const prefix = `/uploads/${folder}/`
  if (!url?.startsWith(prefix)) return
  const filename = url.slice(prefix.length)
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(filename)) return
  await unlink(path.join(uploadsRoot, folder, filename)).catch(error => {
    if (error.code !== 'ENOENT') console.warn('No se pudo retirar una fotografía anterior del almacenamiento.')
  })
}

/** Called only after authorization. A failed DB write removes the new file;
 * the previous photo is retired only after the new reference is committed. */
export async function withEntityPhoto<T>(folder: PhotoFolder, file: Express.Multer.File | undefined, remove: boolean | undefined, previous: string | null | undefined, save: (photoUrl: string | null | undefined) => Promise<T>): Promise<T> {
  let photoUrl: string | null | undefined = remove ? null : undefined
  if (file) {
    const extension = photoExtension(file)
    const filename = `${randomUUID()}.${extension}`
    photoUrl = `/uploads/${folder}/${filename}`
    try {
      await mkdir(path.join(uploadsRoot, folder), { recursive: true })
      await writeFile(path.join(uploadsRoot, folder, filename), file.buffer, { flag: 'wx' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') await removeStoredPhoto(folder, photoUrl)
      throw new Error('No se pudo almacenar la fotografía. Inténtalo de nuevo.')
    }
  }
  let result: T
  try { result = await save(photoUrl) }
  catch (error) {
    if (file) await removeStoredPhoto(folder, photoUrl)
    throw error
  }
  if (photoUrl !== undefined && previous !== photoUrl) await removeStoredPhoto(folder, previous)
  return result
}
