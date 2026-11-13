import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import PhaserGardenPoc from '../../src/features/my-garden/phaser-poc/PhaserGardenPoc'
import type { GardenKind, RealGarden, SoilType } from '../../src/features/real-gardens/real-garden'
import { GARDEN_FEATURE_OPTIONS, type GardenFeatures } from '../../src/features/real-gardens/garden-characteristics'

// Explicit test fixture, outside both application build entries and visit records.
const params = new URLSearchParams(location.search)
const presets: Record<string, Partial<GardenFeatures>> = {
  ...Object.fromEntries((['beds', 'furrows', 'raisedBeds', 'terraces'] as const).map(design => [`design-${design}`, {
    groundDesigns: [design], fences: ['natural'], waterSources: ['stored', 'well'],
    irrigationMethods: ['drip', 'sprinkler'], naturalFertilizers: ['compost'],
  }])),
  stored: { waterSources: ['stored'] }, well: { waterSources: ['well'] }, channel: { waterSources: ['channel'] }, rain: { waterSources: ['rain'] },
  manual: { irrigationMethods: ['manual'] }, hose: { irrigationMethods: ['hose'] }, sprinkler: { irrigationMethods: ['sprinkler'] }, drip: { irrigationMethods: ['drip'] },
  'fence-living': { fences: ['living'] }, 'fence-natural': { fences: ['natural'] }, 'fence-recycled': { fences: ['recycled'] }, 'fence-metal': { fences: ['metal'] }, 'fence-conventional': { fences: ['conventional'] },
  'fert-leaves': { naturalFertilizers: ['leaves'] }, 'fert-remains': { naturalFertilizers: ['plantRemains'] }, 'fert-compost': { naturalFertilizers: ['compost'] }, fallow: { naturalFertilizers: ['fallow'] },
  combination: { waterSources: ['stored', 'channel', 'rain'], irrigationMethods: ['drip', 'sprinkler', 'hose'], fences: ['living', 'natural', 'recycled', 'metal', 'conventional'], naturalFertilizers: ['leaves', 'plantRemains', 'compost', 'fallow'] },
}

function ArtFixture() {
  const [kind, setKind] = useState<GardenKind>((params.get('kind') ?? 'ground') as GardenKind)
  const [province, setProvince] = useState(params.get('province') ?? 'Imbabura')
  const [soil, setSoil] = useState<SoilType>('loam')
  const [features, setFeatures] = useState(params.get('features') ?? 'common')
  const [area, setArea] = useState(params.get('area') ?? '25')
  const [activated, setActivated] = useState<number | null>(null)
  const characteristics = features === 'none' ? undefined : features === 'all'
    ? Object.fromEntries(Object.entries(GARDEN_FEATURE_OPTIONS).map(([key, values]) => [key, Object.keys(values)])) as GardenFeatures
    : features === 'common'
      ? { groundDesigns: ['furrows', 'beds', 'raisedBeds', 'terraces'], fences: ['natural'], waterSources: ['stored'], irrigationMethods: ['drip'], naturalFertilizers: ['compost'] } as GardenFeatures
      : { groundDesigns: [], fences: [], waterSources: [], irrigationMethods: [], naturalFertilizers: [], ...presets[features] } as GardenFeatures
  const garden: RealGarden = {
    name: 'Huerto de prueba visual', kind, areaM2: Number(area),
    location: { province, provinceCode: '10', canton: '', cantonCode: null, parish: '', parishCode: null, reference: '', coordinates: null },
    soilType: soil, irrigationAvailability: 'unknown', communityName: null,
    characteristics: characteristics ? Object.fromEntries(Object.entries(characteristics).map(([key, values]) => [key, [...values]])) as GardenFeatures : undefined,
  }
  return <div style={{ maxWidth: 1400, margin: '0 auto' }}>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8, color: 'white' }}>
      <label>Modalidad <select aria-label="Modalidad" value={kind} onChange={event => setKind(event.target.value as GardenKind)}>{['ground', 'pots', 'vertical', 'hanging'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Provincia <select aria-label="Provincia" value={province} onChange={event => setProvince(event.target.value)}>{['Imbabura', 'Manabí', 'Napo', 'Galápagos'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Suelo <select aria-label="Suelo" value={soil} onChange={event => setSoil(event.target.value as SoilType)}>{['loam', 'clay', 'sand', 'silt', 'marl', 'heavyClay', 'marsh', 'other', 'unknown'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Superficie <select aria-label="Superficie" value={area} onChange={event => setArea(event.target.value)}>{['10', '25', '50', '100'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Características <select aria-label="Características" value={features} onChange={event => setFeatures(event.target.value)}>{['common', 'all', 'none', ...Object.keys(presets)].map(value => <option key={value}>{value}</option>)}</select></label>
      <output aria-label="Zona activada">{activated}</output>
    </div>
    <PhaserGardenPoc realGarden={garden} plants={[]} selectedPlot={null} interactionBlocked={false} renderer={params.get('renderer') === 'canvas' ? 'canvas' : 'auto'} onRegister={setActivated} onSelect={() => {}}/>
  </div>
}

createRoot(document.getElementById('root')!).render(<ArtFixture/>)
