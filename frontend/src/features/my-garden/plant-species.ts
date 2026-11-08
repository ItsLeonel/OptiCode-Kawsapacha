// Existing demonstration catalogue. Selection is supplied by the user, never inferred from a photo.
export const PLANT_SPECIES = [
  { name: 'Romero', latin: 'Salvia rosmarinus', icon: '🌿' },
  { name: 'Manzanilla', latin: 'Matricaria chamomilla', icon: '🌼' },
  { name: 'Menta', latin: 'Mentha sp.', icon: '🌱' },
  { name: 'Toronjil', latin: 'Melissa officinalis', icon: '🍃' },
  { name: 'Hierbabuena', latin: 'Mentha spicata', icon: '🌿' },
  { name: 'Lavanda', latin: 'Lavandula sp.', icon: '💜' },
  { name: 'Orégano', latin: 'Origanum vulgare', icon: '🌱' },
  { name: 'Llantén', latin: 'Plantago major', icon: '🌾' },
] as const

export type PlantRegistration = {
  photo: Blob
  species: typeof PLANT_SPECIES[number]
  plot: number
  plantedOn?: string
  requestId?: string
  recordSowing?: boolean
  responsible?: string
}

export type PlantRegistrationResult = { ok: true } | { ok: false; error: string }
