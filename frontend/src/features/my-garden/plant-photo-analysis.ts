import { visualLevel, type PlantVisualProfile } from './plant-visual-profile'

/**
 * Segmentación local sin servicio externo. Detecta una masa verde principal
 * próxima al centro; no identifica especies, flores de forma fiable ni centímetros.
 * Si el fondo contiene vegetación se reduce la confianza.
 */
export async function analyzePlantPhoto(photo: Blob): Promise<PlantVisualProfile | null> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size === 0 || photo.size > 3 * 1024 * 1024) return null
  const url = URL.createObjectURL(photo)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) return null
    const width = Math.max(1, Math.round(image.naturalWidth / Math.max(image.naturalWidth, image.naturalHeight) * 160))
    const height = Math.max(1, Math.round(image.naturalHeight / Math.max(image.naturalWidth, image.naturalHeight) * 160))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    context.drawImage(image, 0, 0, width, height)
    const rgba = context.getImageData(0, 0, width, height).data
    return analyzePlantPixels(rgba, width, height)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Parte determinista, comprobable con matrices de píxeles sin cámara ni red. */
export function analyzePlantPixels(rgba: Uint8ClampedArray, width: number, height: number): PlantVisualProfile | null {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length !== width * height * 4) return null
    const count = width * height
    const mask = new Uint8Array(count)
    for (let i = 0; i < count; i++) {
      const k = i * 4
      const r = rgba[k], g = rgba[k + 1], b = rgba[k + 2]
      // Verde visible, no todos los verdes del mundo ni el fondo garantizado.
      if (rgba[k + 3] > 150 && g > 32 && g > r * 1.12 && g > b * 1.07 && g - r > 10) mask[i] = 1
    }

    // Conservar la componente vegetal coherente más próxima al centro.
    const visited = new Uint8Array(count)
    let best: number[] = [], bestScore = -1
    for (let i = 0; i < count; i++) {
      if (!mask[i] || visited[i]) continue
      const queue = [i]
      visited[i] = 1
      let sumX = 0, sumY = 0
      for (let q = 0; q < queue.length; q++) {
        const item = queue[q], x = item % width, y = Math.floor(item / width)
        sumX += x
        sumY += y
        const neighbors = [x > 0 ? item - 1 : -1, x < width - 1 ? item + 1 : -1, y > 0 ? item - width : -1, y < height - 1 ? item + width : -1]
        for (const next of neighbors) if (next >= 0 && mask[next] && !visited[next]) { visited[next] = 1; queue.push(next) }
      }
      if (queue.length < Math.max(8, count * .005)) continue
      const dx = sumX / queue.length / width - .5, dy = sumY / queue.length / height - .5
      const score = queue.length * (1 - Math.min(.8, Math.hypot(dx, dy)))
      if (score > bestScore) { best = queue; bestScore = score }
    }
    if (best.length < Math.max(25, count * .012)) return null
    let minX = width, maxX = 0, minY = height, maxY = 0, sumX = 0, sumY = 0
    let rSum = 0, gSum = 0, bSum = 0, upperX = 0, upperCount = 0, lowerX = 0, lowerCount = 0
    let edgeCount = 0
    const greenSet = new Uint8Array(count)
    for (const i of best) greenSet[i] = 1
    for (const i of best) {
      const x = i % width, y = Math.floor(i / width), k = i * 4
      minX = Math.min(x, minX); maxX = Math.max(x, maxX)
      minY = Math.min(y, minY); maxY = Math.max(y, maxY)
      sumX += x; sumY += y
      rSum += rgba[k]; gSum += rgba[k + 1]; bSum += rgba[k + 2]
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) edgeCount++
    }
    for (const i of best) {
      const x = i % width, y = Math.floor(i / width)
      if (y < minY + (maxY - minY) / 3) { upperX += x; upperCount++ }
      if (y > minY + (maxY - minY) * 2 / 3) { lowerX += x; lowerCount++ }
    }
    const widthRatio = (maxX - minX + 1) / width
    const heightRatio = (maxY - minY + 1) / height
    const coverage = best.length / count
    const density = best.length / ((maxX - minX + 1) * (maxY - minY + 1))
    const borderFraction = edgeCount / best.length
    const centerX = Math.max(0, Math.min(1, sumX / best.length / width))
    const greenMean = gSum / best.length
    const mean = (n: number) => Math.max(0, Math.min(255, Math.round(n / best.length))).toString(16).padStart(2, '0')
    const color = '#' + mean(rSum) + mean(gSum) + mean(bSum)
    const orientationDiff = upperCount && lowerCount ? upperX / upperCount - lowerX / lowerCount : 0
    const orientation = orientationDiff < -width * .10 ? 'left' : orientationDiff > width * .10 ? 'right' : 'upright'
    const margin = 3, lx = Math.max(0, minX - margin), ux = Math.min(width - 1, maxX + margin), ly = Math.max(0, minY - margin), uy = Math.min(height - 1, maxY + margin)
    let highlights = 0
    for (let y = ly; y <= uy; y++) for (let x = lx; x <= ux; x++) {
      const i = y * width + x
      if (greenSet[i]) continue
      // Los colores claros cerca de follaje son solo una pista, NO flores confirmadas.
      if (![i - 1, i + 1, i - width, i + width].some(n => n >= 0 && n < count && greenSet[n])) continue
      const k = i * 4, r = rgba[k], g = rgba[k + 1], b = rgba[k + 2]
      if ((r > 170 && g > 160 && b > 150) || (r > 150 && g > 115 && b < 110) || (r > 100 && b > 125 && b > g * 1.15)) highlights++
    }
    const confidence = borderFraction > .11 || coverage > .7 || centerX < .2 || centerX > .8 || widthRatio > .96
      ? 'low' : coverage > .045 && borderFraction < .04 ? 'high' : 'medium'
    return {
      version: 1, analyzer: 'canvas-foliage-v1', confidence,
      coverage: Number(coverage.toFixed(4)),
      heightRatio: Number(heightRatio.toFixed(4)),
      widthRatio: Number(widthRatio.toFixed(4)),
      centerX: Number(centerX.toFixed(4)),
      heightLevel: visualLevel(heightRatio),
      densityLevel: visualLevel(density),
      spreadLevel: visualLevel(widthRatio),
      foliageColor: color,
      leafTone: greenMean >= 135 ? 'light' : greenMean >= 80 ? 'medium' : 'dark',
      orientation,
      floweringHint: highlights > best.length * .03 && highlights >= 7 ? 'possible' : 'not-detected',
    }
}
