export const PLOT_COUNT = 6

export type GardenPlant = {
  id: string
  name: string
  latin: string
  photo: string
  date: string
  plot: number
}

export type GardenDestination = 'garden' | 'community' | 'plants' | 'history'
export type GardenAction = 'register' | 'logbook' | 'real-garden' | 'passport'
