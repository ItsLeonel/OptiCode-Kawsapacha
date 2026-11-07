import { GameButton, gameRegionAssets } from '../../shared/ui/game-ui/GameUI'
import { regionForProvince } from '../real-gardens/garden-region'
import { COMMUNITY_TYPES, communityTypeArt } from './community-art'
import { CommunityTerritorySummary } from './CommunityTerritoryStep'
import type { CommunityTerritory } from './community-territory'
import type { Community, CommunityMember, CommunityType } from './communities'

export type CommunityEditor = 'identity' | 'responsible' | 'members' | null
type BuilderValues = Pick<Community, 'name' | 'responsible' | 'description' | 'location'> & CommunityTerritory & {
  type: CommunityType; contact: { phone: string; email: string }; members: CommunityMember[]
}

export default function CommunityBuilderStep({ values, errors, editor, editingMember, birthdayMax, onEditorChange, onMemberEdit, onMemberAdd, onMemberRemove, onMemberChange, onChange, onTerritory }: {
  values: BuilderValues; errors: Record<string, string>; editor: CommunityEditor; editingMember: string | null; birthdayMax: string
  onEditorChange: (editor: CommunityEditor) => void; onMemberEdit: (id: string | null) => void
  onMemberAdd: () => void; onMemberRemove: (id: string) => void
  onMemberChange: (id: string, field: keyof CommunityMember, value: string) => void
  onChange: <K extends keyof BuilderValues>(field: K, value: BuilderValues[K]) => void
  onTerritory: () => void
}) {
  const guide = gameRegionAssets[regionForProvince(values.province)]
  const type = COMMUNITY_TYPES.find(item => item.value === values.type)!
  const member = values.members.find(item => item.id === editingMember)
  const fieldError = (id: string) => errors[id] && <p className="cw-field-error" id={`${id}-error`}>{errors[id]}</p>
  const invalid = (id: string) => ({ 'aria-invalid': Boolean(errors[id]), 'aria-describedby': errors[id] ? `${id}-error` : undefined })
  function openEditor(next: Exclude<CommunityEditor, null>) {
    onEditorChange(editor === next ? null : next)
    if (editor !== next) requestAnimationFrame(() => document.getElementById(next === 'identity' ? 'community-name' : next === 'responsible' ? 'community-responsible' : 'cw-add-member')?.focus())
  }
  return <section className="cw-builder" aria-labelledby="cw-builder-title">
    <div className="cw-adventure-heading"><span>03 · PERSONAS QUE CULTIVAN</span><h3 id="cw-builder-title" data-step-heading tabIndex={-1}>Construye tu comunidad</h3><p>Abre cada tarjeta y dale vida a esta historia.</p></div>
    <div className="cw-builder-cards">
      <article className="cw-story-card" data-open={editor === 'identity'}>
        <button type="button" id="cw-identity-card" aria-label="Editar identidad" aria-expanded={editor === 'identity'} aria-controls={editor === 'identity' ? 'cw-community-editor' : undefined} onClick={() => openEditor('identity')}>
          <span className="cw-story-painting"><img src={communityTypeArt.personal} alt="" width="800" height="600"/></span>
          <span className="cw-story-title"><small>A</small> Identidad de la comunidad</span>
          <span className="cw-story-summary"><strong>{values.name.trim() || 'El nombre de nuestras raíces'}</strong><span>{type.label} · {values.name.trim().length >= 3 ? 'Identidad preparada' : 'Dale un nombre y un propósito'}</span></span>
          <span className="cw-story-action">{editor === 'identity' ? 'Cerrar tarjeta ↑' : 'Escribir nuestra historia →'}</span>
        </button>
      </article>
      <article className="cw-story-card" data-open={editor === 'responsible'}>
        <button type="button" id="cw-responsible-card" aria-label="Editar responsable" aria-expanded={editor === 'responsible'} aria-controls={editor === 'responsible' ? 'cw-community-editor' : undefined} onClick={() => openEditor('responsible')}>
          <span className="cw-story-painting cw-story-guide"><img src={guide.guide} alt=""/></span>
          <span className="cw-story-title"><small>B</small> Responsable</span>
          <span className="cw-story-summary"><strong>{values.responsible.trim() || '¿Quién acompaña estas raíces?'}</strong><span>{values.responsible.trim().length >= 2 ? 'Responsable indicado' : 'Una persona para acompañarnos'}</span></span>
          <span className="cw-story-action">{editor === 'responsible' ? 'Cerrar tarjeta ↑' : 'Presentar al responsable →'}</span>
        </button>
      </article>
      <article className="cw-story-card" data-open={editor === 'members'}>
        <button type="button" id="cw-members-card" aria-label="Gestionar integrantes" aria-expanded={editor === 'members'} aria-controls={editor === 'members' ? 'cw-community-editor' : undefined} onClick={() => openEditor('members')}>
          <span className="cw-story-painting"><img src={values.type === 'barrial' ? communityTypeArt.barrial : communityTypeArt.familiar} alt="" width="800" height="600"/></span>
          <span className="cw-story-title"><small>C</small> Integrantes</span>
          <span className="cw-story-summary"><strong>{values.members.length + 1} {values.members.length ? 'personas para cultivar' : 'persona para comenzar'}</strong><span>{values.members.length ? `${values.members.length} integrante(s) adicional(es) · Datos privados` : 'Tú eres suficiente para comenzar'}</span></span>
          {editor === 'members' && <span className="cw-story-action">Cerrar tarjeta ↑</span>}
        </button>
        {editor !== 'members' && <button className="cw-quick-add" type="button" id="cw-add-member" onClick={onMemberAdd}>+ Añadir integrante</button>}
      </article>
    </div>
    {editor && <section className="cw-card-editor" id="cw-community-editor" aria-labelledby={`cw-${editor}-card`}>
      <header><span>{editor === 'identity' ? 'Una historia con nombre propio' : editor === 'responsible' ? 'La persona que nos acompaña' : 'Personas que comparten estas raíces'}</span><small>Privado · Solo esta visita</small></header>
      {editor === 'identity' && <div className="cw-fields cw-identity-fields">
        <label>Nombre de la comunidad *<input id="community-name" required minLength={3} maxLength={80} value={values.name} onChange={event => onChange('name', event.target.value)} placeholder="Ej. Raíces de mi tierra" {...invalid('community-name')}/>{fieldError('community-name')}<small className="cw-selected-type">Comunidad {type.label.toLocaleLowerCase('es-EC')}</small></label>
        <label>Acerca de la comunidad (opcional)<textarea id="community-description" rows={2} maxLength={500} value={values.description} onChange={event => onChange('description', event.target.value)} placeholder="¿Qué les une y qué quieren cultivar?" {...invalid('community-description')}/><small>{values.description.length} de 500 caracteres</small>{fieldError('community-description')}</label>
      </div>}
      {editor === 'responsible' && <div className="cw-fields cw-responsible-fields">
        <label>Persona responsable *<input id="community-responsible" required maxLength={80} autoComplete="name" value={values.responsible} onChange={event => onChange('responsible', event.target.value)} placeholder="Su nombre" {...invalid('community-responsible')}/>{fieldError('community-responsible')}</label>
        <label>Teléfono (opcional)<input id="community-phone" type="tel" autoComplete="tel" maxLength={24} value={values.contact.phone} onChange={event => onChange('contact', {...values.contact,phone:event.target.value})} {...invalid('community-phone')}/>{fieldError('community-phone')}</label>
        <label>Correo electrónico (opcional)<input id="community-email" type="email" autoComplete="email" maxLength={254} value={values.contact.email} onChange={event => onChange('contact', {...values.contact,email:event.target.value})} {...invalid('community-email')}/>{fieldError('community-email')}</label>
      </div>}
      {editor === 'members' && <>
        <div className="cw-team-heading"><p>La persona responsable ya cuenta como integrante. Añade más personas si lo deseas.</p><GameButton id="cw-add-member" type="button" variant="secondary" onClick={onMemberAdd}>+ Añadir integrante</GameButton></div>
        {values.members.length > 0 && <ul className="cw-member-roster">{values.members.map((person,index) => <li key={person.id}><span className="cw-member-avatar" aria-hidden="true">{person.name.trim() ? person.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase('es-EC') : '❧'}</span><span><strong>{person.name || `Integrante ${index + 1}`}</strong><small>{person.experience} · Nivel declarado</small></span><button type="button" aria-label={`Editar integrante ${index+1}`} onClick={() => onMemberEdit(person.id)}>Editar</button><button type="button" aria-label={`Quitar integrante ${index+1}`} onClick={() => onMemberRemove(person.id)}>Quitar</button></li>)}</ul>}
        {member && <fieldset className="cw-member-editor"><legend>Ficha privada · {member.name || 'Nuevo integrante'}</legend><div className="cw-fields">
          <label>Nombre del integrante *<input id={`member-${member.id}-name`} maxLength={80} value={member.name} onChange={event=>onMemberChange(member.id,'name',event.target.value)} {...invalid(`member-${member.id}-name`)}/>{fieldError(`member-${member.id}-name`)}</label>
          <label>Fecha de nacimiento (opcional)<input id={`member-${member.id}-birthDate`} type="date" min="1900-01-01" max={birthdayMax} value={member.birthDate} onChange={event=>onMemberChange(member.id,'birthDate',event.target.value)} {...invalid(`member-${member.id}-birthDate`)}/>{fieldError(`member-${member.id}-birthDate`)}</label>
          <label>Género (opcional)<input maxLength={60} value={member.gender} placeholder="Autodescripción; puedes dejarlo vacío" onChange={event=>onMemberChange(member.id,'gender',event.target.value)}/></label>
          <label>Nivel declarado<select value={member.experience} onChange={event=>onMemberChange(member.id,'experience',event.target.value)}>{['Aprendiz','Oficial','Maestro'].map(level=><option key={level}>{level}</option>)}</select></label>
          <label className="cw-wide">Talentos declarados (opcional)<input maxLength={300} value={member.certifiedTalents} onChange={event=>onMemberChange(member.id,'certifiedTalents',event.target.value)} aria-describedby="cw-talents-hint" placeholder="Talentos o certificaciones que indique la persona"/><small id="cw-talents-hint">Este texto no acredita certificaciones. Los niveles tampoco se verifican aquí.</small></label>
        </div><button className="cw-text-button" type="button" onClick={()=>onMemberEdit(null)}>Volver a las tarjetas de integrantes</button></fieldset>}
      </>}
      <div className="cw-editor-actions"><button className="cw-text-button" type="button" onClick={()=>onEditorChange(null)}>Cerrar edición</button></div>
    </section>}
    <aside className="cw-location-readonly" aria-label="Territorio elegido"><div><span className="cw-location-mark" aria-hidden="true">⌖</span><div><strong>Nuestras raíces en Ecuador</strong><CommunityTerritorySummary values={values} compact/></div></div><button type="button" onClick={onTerritory}>Cambiar territorio →</button></aside>
  </section>
}
