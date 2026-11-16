export type Screen = 'Bienvenida' | 'Inicio' | 'Usuarios' | 'Comunidades' | 'Mi terreno' | 'Plantas medicinales' | 'Mis plantas' | 'Bitácora' | 'Mi historia' | 'Mi camino verde'

export const SCREEN_PATHS: Record<Screen, string> = {
  Bienvenida: '#bienvenida',
  Inicio: '#mi-jardin',
  Usuarios: '#usuarios',
  Comunidades: '#comunidades',
  'Mi terreno': '#mi-jardin/terreno',
  'Plantas medicinales': '#plantas',
  'Mis plantas': '#mis-plantas',
  'Bitácora': '#bitacora',
  'Mi historia': '#mi-historia',
  'Mi camino verde': '#progreso',
}

export function currentScreen(): Screen {
  if (window.location.hash.startsWith('#plantas/')) return 'Plantas medicinales'
  if (window.location.hash === '#huerto-real') return 'Mi terreno'
  return (Object.keys(SCREEN_PATHS) as Screen[]).find(key => SCREEN_PATHS[key] === window.location.hash) ?? 'Bienvenida'
}

