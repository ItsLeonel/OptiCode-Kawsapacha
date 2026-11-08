import personal from '../../assets/kawsapacha-comunidad/tipos-v2/personal.webp'
import familiar from '../../assets/kawsapacha-comunidad/tipos-v2/familiar.webp'
import condominio from '../../assets/kawsapacha-comunidad/tipos-v2/condominio.webp'
import barrial from '../../assets/kawsapacha-comunidad/tipos-v2/barrial.webp'
import type { CommunityType } from './communities'

export const COMMUNITY_TYPES: { value: CommunityType; label: string; description: string; image: string }[] = [
  { value: 'personal', label: 'Personal', description: '1 persona · Una semilla también es comunidad.', image: personal },
  { value: 'familiar', label: 'Familiar', description: 'Raíces que crecen en familia.', image: familiar },
  { value: 'condominio', label: 'Condominio', description: 'Un espacio compartido entre vecinos.', image: condominio },
  { value: 'barrial', label: 'Barrial', description: 'Todo un barrio para cultivar juntos.', image: barrial },
]
export const communityTypeArt = { personal, familiar, condominio, barrial }
