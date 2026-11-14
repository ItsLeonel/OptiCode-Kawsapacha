/** Normaliza coordenadas escalares heredadas sin perder la latitud 0 (ecuador terrestre). */
export type GardenCoordinatesLegacy = { latitude: number; longitude: number }
export function legacyGardenCoordinates(record: {
  latitude?: number | null
  longitude?: number | null
}): GardenCoordinatesLegacy | null {
  return typeof record.latitude === 'number' && Number.isFinite(record.latitude) &&
    typeof record.longitude === 'number' && Number.isFinite(record.longitude)
    ? { latitude: record.latitude, longitude: record.longitude }
    : null
}
