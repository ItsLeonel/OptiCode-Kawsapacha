export interface RegisterPlantInput {
  realGardenId: string
  speciesId: string
  plotIndex: number
  customName: string
  notes: string
  plantedOn?: string
  growthStage?: string
  registeredById: string
  file: Express.Multer.File
}

export interface UpdatePlantInput {
  plantId: string
  requestingUserId: string
  customName?: string
  plantingDate?: string
  notes?: string
  observedState?: string
  growthStage?: string
  plotIndex?: number
  heightCm?: number
  file?: Express.Multer.File
}
