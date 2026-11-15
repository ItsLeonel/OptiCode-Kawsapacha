export const PHOTO_ACCEPT = 'image/*'
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024
const SAFE_TARGET_BYTES = Math.floor(2.8 * 1024 * 1024)
const DIRECT_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|avif|bmp|gif)$/i

export function isAcceptedImageInput(file: File | Blob): boolean {
  const mime = (file.type || '').toLowerCase()
  if (mime.startsWith('image/')) return true
  if (!mime && file instanceof File) return IMAGE_EXTENSIONS.test(file.name)
  return false
}

export function validatePhoto(file: File): string {
  const mime = (file.type || '').toLowerCase()
  if (!DIRECT_MIMES.has(mime) && !isAcceptedImageInput(file)) {
    return 'Selecciona una imagen JPG, PNG o WebP.'
  }
  if (!file.size || file.size > MAX_PHOTO_BYTES) {
    return 'La fotografía debe tener contenido y no superar los 3 MB.'
  }
  return ''
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image decode failed'))
    img.src = url
  })
}

async function decodeDrawable(file: File | Blob): Promise<{
  source: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadHtmlImage(url)
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (width > 0 && height > 0) {
      return { source: img, width, height, cleanup: () => URL.revokeObjectURL(url) }
    }
    throw new Error('Empty dimensions')
  } catch (err) {
    URL.revokeObjectURL(url)
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      }
    }
    throw err
  }
}

function normalizedBaseName(file: File | Blob, fallback: string): string {
  const raw = file instanceof File && file.name ? file.name.replace(/\.[^/.]+$/, '') : ''
  const clean = raw.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return clean || fallback
}

/**
 * Normaliza y comprime fotografías capturadas desde cámara o galería móvil
 * para asegurar compatibilidad MIME (image/jpeg) y un peso menor a 3 MB.
 */
export async function optimizeMobilePhoto(file: File | Blob, fallbackName = 'evidencia'): Promise<File> {
  if (!file.size) throw new Error('Empty image file')
  if (!isAcceptedImageInput(file)) throw new Error('Unsupported image type')

  const mime = (file.type || '').toLowerCase()
  const baseName = normalizedBaseName(file, fallbackName)
  const extForMime = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const normalizedMime = mime === 'image/jpg' ? 'image/jpeg' : mime

  // Si ya cumple tipo directo y cabe cómodamente, conservar (corrigiendo image/jpg -> image/jpeg)
  if (DIRECT_MIMES.has(mime) && file.size <= SAFE_TARGET_BYTES) {
    if (file instanceof File && file.type === normalizedMime && /\.[a-z0-9]+$/i.test(file.name)) {
      return file
    }
    return new File([file], `${baseName}.${extForMime}`, { type: normalizedMime || 'image/jpeg' })
  }

  // Fallback si no hay DOM/canvas (tests unitarios en Node) y pesa <= 3 MB
  if (typeof document === 'undefined') {
    if (file.size <= MAX_PHOTO_BYTES) {
      return new File([file], `${baseName}.${extForMime}`, { type: DIRECT_MIMES.has(mime) ? normalizedMime : 'image/jpeg' })
    }
    throw new Error('La fotografía supera los 3 MB.')
  }

  const decoded = await decodeDrawable(file)
  try {
    const passes: Array<[number, number]> = [
      [1920, 0.84],
      [1440, 0.72],
      [1080, 0.6],
    ]
    let bestBlob: Blob | null = null
    for (const [maxDim, quality] of passes) {
      const scale = Math.min(1, maxDim / Math.max(decoded.width, decoded.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(decoded.width * scale))
      canvas.height = Math.max(1, Math.round(decoded.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D unavailable')
      ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (!blob) continue
      bestBlob = blob
      if (blob.size <= SAFE_TARGET_BYTES) break
    }
    if (!bestBlob) throw new Error('Compression failed')
    if (bestBlob.size > MAX_PHOTO_BYTES) throw new Error('Oversized after compression')
    return new File([bestBlob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } finally {
    decoded.cleanup()
  }
}
