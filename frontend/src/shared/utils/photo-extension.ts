export function photoExtension(blob: Blob): string {
  const mime = (blob.type || '').toLowerCase()
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}
