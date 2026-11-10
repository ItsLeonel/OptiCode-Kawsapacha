export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'
export function validatePhoto(file: File): string {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Selecciona una imagen JPG, PNG o WebP.'
  if (!file.size || file.size > 3 * 1024 * 1024) return 'La fotografía debe tener contenido y no superar los 3 MB.'
  return ''
}
