import { GameChoice } from '../../shared/ui/game-ui/GameUI'
import { COMMUNITY_TYPES } from './community-art'
import type { CommunityType } from './communities'
import CommunityTypeEmblem from './CommunityTypeEmblem'

export default function CommunityTypeStep({ value, onChange }: { value: CommunityType; onChange: (type: CommunityType) => void }) {
  return <section className="cw-type-adventure" aria-labelledby="cw-type-title">
    <h3 id="cw-type-title" data-step-heading tabIndex={-1} className="cw-step-label">Tipo de comunidad</h3>
    <div className="cw-illustrated-types" role="group" aria-label="Tipo de comunidad">
      {COMMUNITY_TYPES.map(type => <GameChoice key={type.value} selected={value === type.value} className="cw-illustrated-choice" onClick={() => onChange(type.value)} data-community-autofocus={value === type.value || undefined}>
        <span className="cw-type-medallion" aria-hidden="true"><CommunityTypeEmblem type={type.value}/></span>
        <span className="cw-type-ribbon"><strong>{type.label}{type.value === 'personal' && <> <small>1 persona</small></>}</strong></span>
        <span className="cw-selection-seal" aria-hidden="true">{value === type.value ? '✓' : '❧'}</span>
      </GameChoice>)}
    </div>
  </section>
}
