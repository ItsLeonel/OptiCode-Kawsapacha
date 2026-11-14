/**
 * Perfiles VISUALES esquemáticos para las 30 entradas del catálogo regional.
 * No identifican la especie a partir de la foto ni certifican taxonomía.
 * Los grupos "sp." y Orchidaceae se representan de forma genérica.
 */
export type PlantHabit = 'herb' | 'shrub' | 'tree' | 'vine' | 'rosette' | 'tuft' | 'orchid'
export type LeafSilhouette = 'needle' | 'oval' | 'serrated' | 'lance' | 'round' | 'heart' | 'grass' | 'lobed' | 'palmate'
export type BloomSilhouette = 'spike' | 'cluster' | 'star' | 'daisy' | 'bell' | 'orchid' | 'cotton' | 'tiny'
export type SpeciesArt = Readonly<{
  habit: PlantHabit
  leaf: LeafSilhouette
  bloom: BloomSilhouette
  green: number
  light: number
  blossom: number
}>

const ART: Record<string, SpeciesArt> = {
  romero:          { habit: 'shrub', leaf: 'needle',   bloom: 'spike',   green: 0x33724d, light: 0x9dbb72, blossom: 0x9b9fe3 },
  manzanilla:      { habit: 'herb',  leaf: 'needle',   bloom: 'daisy',   green: 0x4f9251, light: 0x9ccf68, blossom: 0xfffaf1 },
  menta:           { habit: 'herb',  leaf: 'serrated', bloom: 'spike',   green: 0x36845a, light: 0x89d17b, blossom: 0xc6a7dc },
  toronjil:        { habit: 'herb',  leaf: 'heart',    bloom: 'tiny',    green: 0x499451, light: 0xa7d983, blossom: 0xf8f2d7 },
  hierbabuena:     { habit: 'herb',  leaf: 'serrated', bloom: 'spike',   green: 0x2e8562, light: 0x7ab98b, blossom: 0xc9b5d9 },
  lavanda:         { habit: 'shrub', leaf: 'needle',   bloom: 'spike',   green: 0x637f67, light: 0xb1c29b, blossom: 0x9474cb },
  oregano:         { habit: 'herb',  leaf: 'oval',     bloom: 'cluster', green: 0x557943, light: 0xa3c66a, blossom: 0xe5a2bb },
  llanten:         { habit: 'rosette',leaf:'oval',    bloom: 'spike',   green: 0x44854b, light: 0x9bc56a, blossom: 0xb7b58c },
  achiote:         { habit: 'shrub', leaf: 'heart',    bloom: 'star',    green: 0x478348, light: 0xa1cc67, blossom: 0xe9a7bc },
  albahaca:        { habit: 'herb',  leaf: 'oval',     bloom: 'spike',   green: 0x34834a, light: 0x8fd272, blossom: 0xf5e6d3 },
  jengibre:        { habit: 'tuft',  leaf: 'lance',    bloom: 'spike',   green: 0x37804b, light: 0xa4cf6c, blossom: 0xd0a65e },
  tomillo:         { habit: 'shrub', leaf: 'needle',   bloom: 'cluster', green: 0x4f8a58, light: 0xa5bd78, blossom: 0xe3bad3 },
  algodon:         { habit: 'shrub', leaf: 'lobed',    bloom: 'cotton',  green: 0x487a4e, light: 0xa0bc75, blossom: 0xfff4dc },
  cafe:            { habit: 'shrub', leaf: 'oval',     bloom: 'star',    green: 0x315e45, light: 0x7fa667, blossom: 0xfff6e7 },
  ceibo:           { habit: 'tree',  leaf: 'palmate',  bloom: 'bell',    green: 0x56834e, light: 0xa5b770, blossom: 0xf7ccac },
  orquideas:       { habit: 'orchid',leaf: 'lance',   bloom: 'orchid',  green: 0x378a66, light: 0x9fcd6e, blossom: 0xc69cdb },
  matico:          { habit: 'shrub', leaf: 'lance',    bloom: 'spike',   green: 0x47794b, light: 0x96c777, blossom: 0xdad5b2 },
  dientedeleon:    { habit: 'rosette',leaf:'lobed',   bloom: 'daisy',   green: 0x4e8b49, light: 0xa6d56a, blossom: 0xf3d53e },
  ortiga:          { habit: 'herb',  leaf: 'serrated', bloom: 'cluster', green: 0x387c50, light: 0x9ec480, blossom: 0xc6cf9d },
  violeta:         { habit: 'rosette',leaf:'heart',   bloom: 'star',    green: 0x39804d, light: 0x9fcc87, blossom: 0x8870d4 },
  escancel:        { habit: 'shrub', leaf: 'oval',     bloom: 'tiny',    green: 0x793d6c, light: 0xb57b9e, blossom: 0xf5ddc9 },
  chilca:          { habit: 'shrub', leaf: 'lance',    bloom: 'cluster', green: 0x528657, light: 0xa4bf77, blossom: 0xe5e1c0 },
  aguacate:        { habit: 'tree',  leaf: 'oval',     bloom: 'cluster', green: 0x32644b, light: 0x8cb769, blossom: 0xd8d79a },
  borraja:         { habit: 'herb',  leaf: 'oval',     bloom: 'star',    green: 0x4c8b55, light: 0xa8cf7b, blossom: 0x7299d9 },
  guayusa:         { habit: 'tree',  leaf: 'lance',    bloom: 'cluster', green: 0x286947, light: 0x7aa47b, blossom: 0xe9efe0 },
  ajosacha:        { habit: 'vine',  leaf: 'oval',     bloom: 'bell',    green: 0x3d8059, light: 0xa0cd7a, blossom: 0xc1a6da },
  unadegato:       { habit: 'vine',  leaf: 'oval',     bloom: 'tiny',    green: 0x3c704a, light: 0x99c37c, blossom: 0xf3e4c0 },
  ishpingo:        { habit: 'tree',  leaf: 'lance',    bloom: 'cluster', green: 0x2f694e, light: 0x96b079, blossom: 0xe2c98f },
  hierbaluisa:     { habit: 'tuft',  leaf: 'grass',    bloom: 'spike',   green: 0x4a914e, light: 0xb0d66b, blossom: 0xcdbb95 },
  valeriana:       { habit: 'herb',  leaf: 'lance',    bloom: 'cluster', green: 0x43764f, light: 0x98c17b, blossom: 0xe5cee2 },
}

const SCIENTIFIC: Record<string, string> = {
  'salvia rosmarinus':'romero', 'matricaria chamomilla':'manzanilla',
  'mentha sp.':'menta', 'mentha spicata':'hierbabuena', 'melissa officinalis':'toronjil',
  'lavandula sp.':'lavanda', 'origanum vulgare':'oregano', 'plantago major':'llanten',
  'bixa orellana':'achiote', 'ocimum basilicum':'albahaca',
  'zingiber officinale':'jengibre', 'thymus vulgaris':'tomillo',
  'gossypium sp.':'algodon', 'coffea arabica':'cafe', 'ceiba trichistandra':'ceibo',
  'orchidaceae':'orquideas', 'piper aduncum':'matico', 'taraxacum officinale':'dientedeleon',
  'urtica dioica':'ortiga', 'viola odorata':'violeta', 'iresine herbstii':'escancel',
  'baccharis latifolia':'chilca', 'persea americana':'aguacate', 'borago officinalis':'borraja',
  'ilex guayusa':'guayusa', 'mansoa alliacea':'ajosacha', 'uncaria tomentosa':'unadegato',
  'ocotea quixos':'ishpingo', 'cymbopogon citratus':'hierbaluisa', 'valeriana sp.':'valeriana',
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

/** No clasifica fotografías: usa SOLO la especie elegida/registrada por el usuario. */
export function resolveSpeciesArt(name: string, latin: string): SpeciesArt | null {
  const commonKey = normalize(name)
  if (ART[commonKey]) return ART[commonKey]
  const scienceKey = latin.trim().toLowerCase().replace(/\s+/g, ' ')
  const registered = SCIENTIFIC[scienceKey]
  return registered ? ART[registered] : null
}

export const SPECIES_ART_COUNT = Object.keys(ART).length
