import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import PhaserGardenPoc from '../../src/features/my-garden/phaser-poc/PhaserGardenPoc'
import type { GardenKind, RealGarden, SoilType } from '../../src/features/real-gardens/real-garden'
import { GARDEN_FEATURE_OPTIONS } from '../../src/features/real-gardens/garden-characteristics'

// Explicit test fixture, outside both application build entries and visit records.
const params = new URLSearchParams(location.search)
function ArtFixture() {
  const [kind, setKind] = useState<GardenKind>((params.get('kind') ?? 'ground') as GardenKind)
  const [province, setProvince] = useState(params.get('province') ?? 'Imbabura')
  const [soil, setSoil] = useState<SoilType>('loam')
  const [features, setFeatures] = useState(params.get('features') ?? 'common')
  const [activated, setActivated] = useState<number | null>(null)
  const characteristics = features === 'none' ? undefined : features === 'rain' ? { groundDesigns: [], fences: [], waterSources: ['rain'], irrigationMethods: [], naturalFertilizers: [] } as RealGarden['characteristics'] : features === 'all' ? Object.fromEntries(Object.entries(GARDEN_FEATURE_OPTIONS).map(([key, values]) => [key, Object.keys(values)])) as RealGarden['characteristics'] : {
    groundDesigns: ['furrows', 'beds', 'raisedBeds', 'terraces'] as const,
    fences: ['natural'] as const, waterSources: ['stored'] as const,
    irrigationMethods: ['drip'] as const, naturalFertilizers: ['compost'] as const,
  }
  const garden: RealGarden = {
    name: 'Huerto de prueba visual', kind, areaM2: 25,
    location: { province, provinceCode: '10', canton: '', cantonCode: null, parish: '', parishCode: null, reference: '', coordinates: null },
    soilType: soil, irrigationAvailability: 'unknown', communityName: null,
    characteristics: characteristics ? Object.fromEntries(Object.entries(characteristics).map(([key, values]) => [key, [...values]])) as RealGarden['characteristics'] : undefined,
  }
  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8, color: 'white' }}>
      <label>Modalidad <select aria-label="Modalidad" value={kind} onChange={event => setKind(event.target.value as GardenKind)}>{['ground', 'pots', 'vertical', 'hanging'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Provincia <select aria-label="Provincia" value={province} onChange={event => setProvince(event.target.value)}>{['Imbabura', 'Manabí', 'Napo', 'Galápagos'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Suelo <select aria-label="Suelo" value={soil} onChange={event => setSoil(event.target.value as SoilType)}>{['loam', 'clay', 'sand', 'silt', 'marl', 'heavyClay', 'marsh', 'other', 'unknown'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Características <select aria-label="Características" value={features} onChange={event => setFeatures(event.target.value)}>{['common', 'all', 'none', 'rain'].map(value => <option key={value}>{value}</option>)}</select></label>
      <output aria-label="Zona activada">{activated}</output>
    </div>
    <PhaserGardenPoc realGarden={garden} plants={[]} selectedPlot={null} interactionBlocked={false} renderer={params.get('renderer') === 'canvas' ? 'canvas' : 'auto'} onRegister={setActivated} onSelect={() => {}}/>
  </div>
}
createRoot(document.getElementById('root')!).render(<ArtFixture/>)
