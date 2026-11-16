import { gameRegionAssets, type GameRegion } from './ui/game-ui/game-region-assets'

/** Served as static files; only URLs enter JavaScript. Costa keeps its approved artwork. */
export const regionalLandscapes: Record<GameRegion, string> = {
  costa: gameRegionAssets.costa.background,
  sierra: `${import.meta.env.BASE_URL}regional-backgrounds/Paisaje Andino con Volcán Nevado-2.png`,
  oriente: `${import.meta.env.BASE_URL}regional-backgrounds/Paraíso Amazónico con Cabaña y Cascada-3.png`,
  galapagos: `${import.meta.env.BASE_URL}regional-backgrounds/Paisaje volcánico de las Galápagos-1.png`,
}
