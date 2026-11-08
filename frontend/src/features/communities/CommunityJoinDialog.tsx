import CommunityDialog from './CommunityDialog'
import GardenIcon from '../my-garden/GardenIcon'

export default function CommunityJoinDialog({ onClose, onCreate, onHome }: {
  onClose: () => void
  onCreate: () => void
  onHome: () => void
}) {
  return <CommunityDialog title="Únete a una comunidad" description="Encuentra a las personas con quienes quieres cultivar." onClose={onClose}>
    <div className="community-space-empty">
      <span className="community-space-symbol"><GardenIcon name="community"/></span>
      <h3>La unión a comunidades aún no está disponible</h3>
      <p>Necesitamos conectar el directorio y la gestión de integrantes. Por ahora no puedes buscar comunidades ni enviar una solicitud para unirte.</p>
      <p>Puedes recorrer la demostración creando una comunidad propia, incluso una personal de una sola persona.</p>
      <button className="community-primary-button" type="button" onClick={onCreate}>Crear mi comunidad<GardenIcon name="arrow"/></button>
      <button className="community-secondary-button" type="button" onClick={onHome}>Volver a Mi Jardín</button>
    </div>
  </CommunityDialog>
}
