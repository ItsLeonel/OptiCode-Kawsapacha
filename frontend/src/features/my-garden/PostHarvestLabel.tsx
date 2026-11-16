import type { GardenPlant } from './garden'
import type { ActivityDetails } from './journal/activities'
import { botanicalSignage } from './BotanicalSignage'
import './postharvest-label.css'

/** Una etiqueta impresa NO significa que el MSP autorizó el uso del lote. */
export default function PostHarvestLabel({ details, plant }: {
  details: ActivityDetails; plant?: GardenPlant
}) {
  if (!details.batchCode || !details.packageDate || !details.expiryDate) return null
  const botanical = plant ? botanicalSignage(plant) : null
  return <section className="postharvest-label-wrapper" aria-label="Etiqueta de lote documentado">
    <div className="postharvest-label-toolbar">
      <strong>Etiqueta del lote</strong>
      <button type="button" className="bv-secondary-button" onClick={() => window.print()}>Imprimir etiqueta</button>
    </div>
    <div className="postharvest-label-print">
      <header>KAWSAPACHA · REGISTRO DE POSCOSECHA</header>
      <h3>{botanical?.name ?? 'Especie de cosecha por confirmar'}</h3>
      {botanical?.latin && <em>{botanical.latin}</em>}
      <p className="postharvest-label-lot">Lote: <strong>{details.batchCode}</strong></p>
      <dl>
        {botanical?.family && <div><dt>Familia botánica</dt><dd>{botanical.family}</dd></div>}
        <div><dt>Empaquetado</dt><dd>{details.packageDate}</dd></div>
        <div><dt>Caducidad declarada</dt><dd>{details.expiryDate}</dd></div>
        {details.quantity !== undefined && details.unit && <div><dt>Cantidad medida</dt><dd>{details.quantity} {details.unit}</dd></div>}
        <div><dt>Cualidad tradicional</dt><dd>{botanical?.classification === 'hot' ? 'Caliente' : botanical?.classification === 'cold' ? 'Fresca/fría' : 'Por documentar'}</dd></div>
      </dl>
      <p className="postharvest-label-safety"><strong>Indicaciones y precauciones declaradas:</strong> {details.storageLabel}</p>
      <p className="postharvest-label-safety"><strong>Dosificación:</strong> no determinada ni autorizada por esta aplicación.</p>
      <footer>Etiqueta educativa elaborada con datos declarados por la comunidad. Verificar su exactitud y seguridad con personal competente antes de distribuir o consumir.</footer>
    </div>
  </section>
}
