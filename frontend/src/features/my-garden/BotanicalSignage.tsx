import catalog from '../medicinal-catalog/regional-species.json'
import type { GardenPlant } from './garden'
import './botanical-signage.css'

type Classification = 'hot' | 'cold' | null
const MSP_2017: Record<string, Classification> = {
  romero: 'hot', manzanilla: 'hot', menta: 'hot', toronjil: 'hot',
  hierbabuena: 'hot', oregano: 'hot', llanten: 'cold',
}
const key = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()

/**
 * La fuente MSP 2017 documenta siete clasificaciones tradicionales en su Anexo 5.
 * No completar las otras especies por analogía ni extrapolar a otras comunidades.
 */
export function botanicalSignage(plant: Pick<GardenPlant, 'name' | 'latin' | 'plot'>) {
  const entry = catalog.find(item => key(item.name) === key(plant.name) || key(item.latinName) === key(plant.latin))
  const source = key(entry?.name ?? plant.name)
  const temperature = Object.hasOwn(MSP_2017, source) ? MSP_2017[source] : null
  return {
    name: plant.name, latin: plant.latin || entry?.latinName || '',
    family: entry?.family || 'No documentada',
    plot: plant.plot + 1, classification: temperature,
    sourceLabel: temperature ? 'MSP Ecuador, Lineamientos de huertos medicinales (2017), Anexo 5' : 'Clasificación tradicional pendiente de documentación',
    commonNames: entry?.otherNames ? (() => { try { return JSON.parse(entry.otherNames) as string[] } catch { return [] } })() : [],
  }
}

export default function BotanicalSignage({ plant }: { plant: GardenPlant }) {
  const label = botanicalSignage(plant)
  const color = label.classification === 'hot' ? 'hot' : label.classification === 'cold' ? 'cold' : 'unknown'
  return <section className="botanical-signage" aria-label="Señalética educativa de la planta">
    <div className="botanical-signage-toolbar">
      <div>
        <h3>Señalética del huerto</h3>
        <p>Ficha para identificar la planta en el espacio físico.</p>
      </div>
      <button type="button" className="rg-outline-button" onClick={() => window.print()}>Imprimir señalética</button>
    </div>
    <div className="botanical-signage-print" data-classification={color}>
      <header>
        <span>KAWSAPACHA · HUERTO MEDICINAL</span>
        <span>ESPACIO {label.plot}</span>
      </header>
      <h4>{label.name}</h4>
      {label.latin && <p className="botanical-signage-latin">{label.latin}</p>}
      <dl>
        <div><dt>Familia botánica</dt><dd>{label.family}</dd></div>
        {label.commonNames.length > 0 && <div><dt>Otros nombres</dt><dd>{label.commonNames.join(', ')}</dd></div>}
        <div><dt>Cualidad tradicional</dt><dd>{label.classification === 'hot' ? 'Caliente' : label.classification === 'cold' ? 'Fresca / fría' : 'No documentada'}</dd></div>
      </dl>
      <footer>
        <small>{label.sourceLabel}</small>
        <small>Identificación educativa. No constituye indicación de tratamiento ni dosis médica.</small>
      </footer>
    </div>
    <p className="botanical-signage-note">Puedes registrar la instalación de esta señal en la Bitácora → «Señalética medicinal». La impresión no confirma que haya sido instalada.</p>
  </section>
}
