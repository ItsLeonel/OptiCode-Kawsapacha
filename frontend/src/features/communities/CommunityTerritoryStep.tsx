import EcuadorMap from '../../EcuadorMap'
import { GamePanel, gameRegionAssets } from '../../shared/ui/game-ui/GameUI'
import TerritorySelect from '../real-gardens/TerritorySelect'
import { cantonsForProvince, parishesForCanton, provinceForName } from '../real-gardens/territory'
import { regionForProvince } from '../real-gardens/garden-region'
import { communityTerritoryLabels, type CommunityTerritory } from './community-territory'

export function CommunityTerritorySummary({ values, compact = false }: { values: CommunityTerritory; compact?: boolean }) {
  const labels = communityTerritoryLabels(values)
  return <dl className={`cw-territory-summary ${compact ? 'is-compact' : ''}`} aria-label="Resumen territorial">
    {([['Provincia', labels.province], ['Cantón', labels.canton], ['Parroquia', labels.parish], ['Sector', labels.sector], ['Región', labels.region]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || (label === 'Sector' ? 'Sin especificar' : 'Por elegir')}</dd></div>)}
  </dl>
}

export default function CommunityTerritoryStep({ values, errors, onChange }: {
  values: CommunityTerritory; errors: Record<string, string>
  onChange: <K extends keyof CommunityTerritory>(field: K, value: CommunityTerritory[K]) => void
}) {
  const province = provinceForName(values.province)
  const regional = gameRegionAssets[regionForProvince(values.province)]
  return <>
    <section className="cw-map-area" aria-label="Ubicación de la comunidad">
      <h3 data-step-heading tabIndex={-1} className="cw-map-heading">Encuentra el lugar de tu comunidad</h3>
      <EcuadorMap variant="game" value={values.province} onChange={value => onChange('province', value)} selectId="cw-province" selectLabel="Provincia de la comunidad" required invalid={Boolean(errors['cw-province'])} describedBy={errors['cw-province'] ? 'cw-province-error' : undefined}/>
      {errors['cw-province'] && <p className="cw-field-error" id="cw-province-error">{errors['cw-province']}</p>}
      <p className="cw-map-selection-help">Contorno azul: explorando · Pin y contorno dorado: provincia elegida</p>
    </section>
    <GamePanel className="cw-territory cw-territory-picker">
      <div className="cw-territory-landscape" style={{backgroundImage:`url("${regional.background}")`}}><span>TU LUGAR EN ECUADOR</span><h3>{values.province || 'Encuentra tus raíces'}</h3><strong className="kg-region-chip">{values.province ? `Región: ${regional.label}` : 'Cuatro regiones por descubrir'}</strong></div>
      <div className="cw-territory-controls">
        <TerritorySelect key={`canton-${values.province}`} id="cw-cantonCode" label="Cantón" required value={values.cantonCode} options={cantonsForProvince(province?.code ?? '')} disabled={!province} placeholder={province ? 'Buscar cantón…' : 'Primero elige provincia'} error={errors['cw-cantonCode']} onChange={code => onChange('cantonCode', code)}/>
        <TerritorySelect key={`parish-${values.cantonCode}`} id="cw-parishCode" label="Parroquia" required value={values.parishCode} options={parishesForCanton(values.cantonCode)} disabled={!values.cantonCode} placeholder={values.cantonCode ? 'Buscar parroquia…' : 'Primero elige cantón'} error={errors['cw-parishCode']} onChange={code => onChange('parishCode', code)}/>
        <label className="cw-sector-field" htmlFor="cw-sector">Sector o barrio <span>(opcional)</span><input id="cw-sector" maxLength={120} disabled={!province} value={values.sector} onChange={event => onChange('sector', event.target.value)} placeholder="El rincón donde cultivarán" aria-invalid={Boolean(errors['cw-sector'])} aria-describedby={errors['cw-sector'] ? 'cw-sector-error' : undefined}/></label>
        {errors['cw-sector'] && <p id="cw-sector-error" className="cw-field-error">{errors['cw-sector']}</p>}
      </div>
      <CommunityTerritorySummary values={values}/>
    </GamePanel>
  </>
}
