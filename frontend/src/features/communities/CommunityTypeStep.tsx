import { GameChoice } from '../../shared/ui/game-ui/GameUI'
import { COMMUNITY_TYPES } from './community-art'
import type { CommunityType } from './communities'

export default function CommunityTypeStep({ value, onChange }: { value: CommunityType; onChange: (type: CommunityType) => void }) {
  return <section className="cw-type-adventure" aria-labelledby="cw-type-title">
    <div className="cw-adventure-heading"><span>01 · ELIGE TUS RAÍCES</span><h3 id="cw-type-title" data-step-heading tabIndex={-1}>Toda comunidad empieza con una semilla</h3><p>¿Con quién quieres cultivar esta historia?</p></div>
    <div className="cw-illustrated-types" role="group" aria-label="Tipo de comunidad">
      {COMMUNITY_TYPES.map(type => <GameChoice key={type.value} selected={value === type.value} className="cw-illustrated-choice" onClick={() => onChange(type.value)} data-community-autofocus={value === type.value || undefined}>
        <img src={type.image} alt="" width="800" height="600" className="cw-type-painting"/>
        <span className="cw-type-ribbon"><strong>{type.label}{type.value === 'personal' && <small>1 persona</small>}</strong></span>
        <span className="cw-type-description">{type.description}</span>
        <span className="cw-selection-seal" aria-hidden="true">{value === type.value ? '✓' : '❧'}</span>
        <span className="cw-type-action" aria-hidden="true">{value === type.value ? 'Elegida para tu historia' : 'Elegir comunidad'} <span>→</span></span>
      </GameChoice>)}
    </div>
    <p className="cw-type-help">❧ Puedes comenzar por ti. Una comunidad personal no necesita integrantes adicionales.</p>
  </section>
}
