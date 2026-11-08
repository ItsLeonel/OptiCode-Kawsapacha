import GardenIcon from '../my-garden/GardenIcon'
import CommunityIcon from './CommunityIcon'
import forumImage from './assets/foro-v2.jpg'
import learningImage from './assets/aprender-v2.jpg'
import eventsImage from './assets/eventos-v2.jpg'
import type { CommunitySpace } from './communities'

const ACTIONS = [
  { space: 'conversations', title: 'Foro comunitario', description: 'Conversa, comparte preguntas y aprende con tu comunidad.', icon: 'chat', tone: 'purple', image: forumImage },
  { space: 'wisdom', title: 'Aprender juntos', description: 'Explora saberes ancestrales, guías y buenas prácticas.', icon: 'history', tone: 'teal', image: learningImage },
  { space: 'activities', title: 'Eventos y mingas', description: 'Un espacio para talleres, mingas y actividades de la comunidad.', icon: 'calendar', tone: 'orange', image: eventsImage },
] as const

export default function CommunityActions({ onOpen }: { onOpen: (space: CommunitySpace) => void }) {
  return <section className="community-actions" aria-label="Comparte, conversa y aprende en comunidad">
    {ACTIONS.map(action => <button className={`community-panel community-action community-action-${action.tone}`} type="button" key={action.space} onClick={() => onOpen(action.space)} aria-haspopup="dialog">
      <img className="community-action-image" src={action.image} alt="" aria-hidden="true" width="1536" height="1024" decoding="async"/>
      <span className="community-action-icon">{action.icon === 'history' ? <GardenIcon name="history"/> : <CommunityIcon name={action.icon}/>}</span>
      <span className="community-action-copy"><strong>{action.title}</strong><span>{action.description}</span></span>
      <span className="community-action-arrow" aria-hidden="true"><GardenIcon name="arrow"/></span>
    </button>)}
  </section>
}
