import { useState } from 'react'
import { GameButton, gameRegionAssets } from '../../shared/ui/game-ui/GameUI'
import { regionForProvince } from '../real-gardens/garden-region'
import { COMMUNITY_TYPES, communityTypeArt } from './community-art'
import { CommunityTerritorySummary } from './CommunityTerritoryStep'
import type { CommunityTerritory } from './community-territory'
import type { Community, CommunityMember, CommunityType } from './communities'
import GardenIcon from '../my-garden/GardenIcon'
import CommunityCoverPhoto from './CommunityCoverPhoto'
import { userApi, memberApi } from '../../services/api'

export type CommunityEditor = 'identity' | 'responsible' | 'members' | null
type BuilderValues = Pick<Community, 'id' | 'name' | 'responsible' | 'description' | 'location' | 'coverPhoto' | 'photoUrl' | 'removePhoto'> & CommunityTerritory & {
  type: CommunityType; contact: { phone: string; email: string }; members: CommunityMember[]
}

export default function CommunityBuilderStep({ values, errors, editor, editingMember, onEditorChange, onMemberEdit, onMemberAdd, onMemberRemove, onMemberChange, onChange, onTerritory }: {
  values: BuilderValues; errors: Record<string, string>; editor: CommunityEditor; editingMember: string | null
  onEditorChange: (editor: CommunityEditor) => void; onMemberEdit: (id: string | null) => void
  onMemberAdd: () => void; onMemberRemove: (id: string) => void
  onMemberChange: (id: string, fieldOrUpdates: keyof CommunityMember | Partial<CommunityMember>, value?: any) => void
  onChange: <K extends keyof BuilderValues>(field: K, value: BuilderValues[K]) => void
  onTerritory: () => void
}) {
  const guide = gameRegionAssets[regionForProvince(values.province)]
  const type = COMMUNITY_TYPES.find(item => item.value === values.type)!
  const member = values.members.find(item => item.id === editingMember)
  const [lookingUp, setLookingUp] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [lookupFeedback, setLookupFeedback] = useState<{ id: string; type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const fieldError = (id: string) => errors[id] && <p className="cw-field-error" id={`${id}-error`}>{errors[id]}</p>
  const invalid = (id: string) => ({ 'aria-invalid': Boolean(errors[id]), 'aria-describedby': errors[id] ? `${id}-error` : undefined })

  async function handleLookup(targetMember: CommunityMember) {
    const email = (targetMember.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLookupFeedback({ id: targetMember.id, type: 'error', text: 'Escribe un correo electrónico válido antes de consultar.' })
      return
    }
    setLookingUp(true)
    setLookupFeedback(null)
    try {
      const res = await userApi.lookup(email, values.id)
      if (res.found && res.user) {
        let nextStatus: CommunityMember['inviteStatus'] = 'verified'
        if (res.isMember) {
          nextStatus = 'already_member'
          setLookupFeedback({ id: targetMember.id, type: 'info', text: `ℹ ${res.user.name} ya es miembro activo de esta comunidad (${res.roleInCommunity || 'MIEMBRO'}). Quítalo de la lista de invitaciones para continuar.` })
        } else if (res.isPending) {
          nextStatus = 'pending'
          setLookupFeedback({ id: targetMember.id, type: 'info', text: `⏳ ${res.user.name} ya tiene una invitación pendiente (${res.roleInCommunity || 'PARTICIPANTE'}). Quítalo de la lista para continuar.` })
        } else {
          setLookupFeedback({ id: targetMember.id, type: 'success', text: `✓ Usuario verificado en Kawsapacha: ${res.user.name} (${res.user.email}). Nombre autocompletado.` })
        }

        onMemberChange(targetMember.id, {
          name: res.user.name,
          inviteStatus: nextStatus,
        })
      } else {
        onMemberChange(targetMember.id, 'inviteStatus', 'not_found')
        setLookupFeedback({ id: targetMember.id, type: 'error', text: '✕ No existe un usuario registrado con este correo. Debe registrarse previamente en Kawsapacha.' })
      }
    } catch (err: unknown) {
      setLookupFeedback({ id: targetMember.id, type: 'error', text: err instanceof Error ? err.message : 'Error al consultar el usuario.' })
    } finally {
      setLookingUp(false)
    }
  }

  async function handleSendInvite(targetMember: CommunityMember) {
    const email = (targetMember.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLookupFeedback({ id: targetMember.id, type: 'error', text: 'Escribe un correo válido para enviar la solicitud.' })
      return
    }
    if (values.id) {
      setInviting(true)
      try {
        await memberApi.invite(values.id, email, targetMember.role || 'PARTICIPANTE')
        onMemberChange(targetMember.id, 'inviteStatus', 'sent')
        setLookupFeedback({ id: targetMember.id, type: 'success', text: `✓ ¡Solicitud enviada a ${email}! El usuario la recibirá en su campana de notificaciones.` })
      } catch (err: unknown) {
        setLookupFeedback({ id: targetMember.id, type: 'error', text: err instanceof Error ? err.message : 'Error al enviar la solicitud.' })
      } finally {
        setInviting(false)
      }
    } else {
      onMemberChange(targetMember.id, 'inviteStatus', 'ready_to_send')
      setLookupFeedback({
        id: targetMember.id,
        type: 'success',
        text: `✓ Solicitud preparada para ${email} (${targetMember.role === 'RESPONSABLE' ? 'Responsable 👑' : 'Participante 🌱'}). Se enviará automáticamente al confirmar y crear la comunidad.`
      })
    }
  }
  function openEditor(next: Exclude<CommunityEditor, null>) {
    onEditorChange(editor === next ? null : next)
    if (editor !== next) requestAnimationFrame(() => document.getElementById(next === 'identity' ? 'community-name' : next === 'responsible' ? 'community-responsible' : 'cw-add-member')?.focus())
  }
  return <section className="cw-builder" aria-labelledby="cw-builder-title">
    <h3 id="cw-builder-title" data-step-heading tabIndex={-1} className="cw-step-label">Construye tu comunidad</h3>
    <div className="cw-builder-cards">
      <article className="cw-story-card" data-open={editor === 'identity'}>
        <button type="button" id="cw-identity-card" aria-label="Editar identidad" aria-expanded={editor === 'identity'} aria-controls={editor === 'identity' ? 'cw-community-editor' : undefined} onClick={() => openEditor('identity')}>
          <div className="cw-story-painting"><CommunityCoverPhoto photo={values.coverPhoto} photoUrl={values.removePhoto ? undefined : values.photoUrl} fallback={guide.background}/></div>
          <span className="cw-story-title"><span className="cw-card-medallion"><GardenIcon name="leaf"/></span> Identidad de la comunidad</span>
          <span className="cw-story-summary"><strong>{values.name.trim() || 'El nombre de nuestras raíces'}</strong></span>
        </button>
      </article>
      <article className="cw-story-card" data-open={editor === 'responsible'}>
        <button type="button" id="cw-responsible-card" aria-label="Editar responsable" aria-expanded={editor === 'responsible'} aria-controls={editor === 'responsible' ? 'cw-community-editor' : undefined} onClick={() => openEditor('responsible')}>
          <span className="cw-story-painting cw-story-guide"><img src={guide.guide} alt=""/></span>
          <span className="cw-story-title"><span className="cw-card-medallion"><GardenIcon name="community"/></span> Responsable</span>
          <span className="cw-story-summary"><strong>{values.responsible.trim() || '¿Quién acompaña estas raíces?'}</strong></span>
        </button>
      </article>
      <article className="cw-story-card" data-open={editor === 'members'}>
        <button type="button" id="cw-members-card" aria-label="Gestionar integrantes" aria-expanded={editor === 'members'} aria-controls={editor === 'members' ? 'cw-community-editor' : undefined} onClick={() => openEditor('members')}>
          <span className="cw-story-painting"><img src={values.type === 'barrial' ? communityTypeArt.barrial : communityTypeArt.familiar} alt="" width="800" height="600"/></span>
          <span className="cw-story-title"><span className="cw-card-medallion"><GardenIcon name="community"/></span> Integrantes</span>
          <span className="cw-story-summary"><strong>{values.members.length + 1} {values.members.length ? 'personas' : 'persona'}</strong></span>
        </button>
        {editor !== 'members' && <button className="cw-quick-add" type="button" id="cw-add-member" aria-label="+ Añadir integrante" title="Añadir integrante" onClick={onMemberAdd}>+ Añadir integrante</button>}
      </article>
    </div>
    {editor && <section className="cw-card-editor" id="cw-community-editor" aria-labelledby={`cw-${editor}-card`}>
      <header><span>{editor === 'identity' ? 'Identidad' : editor === 'responsible' ? 'Responsable' : 'Integrantes'}</span><small>Privado</small></header>
      {editor === 'identity' && <div className="cw-fields cw-identity-fields">
        <label>Nombre de la comunidad *<input id="community-name" required minLength={3} maxLength={80} value={values.name} onChange={event => onChange('name', event.target.value)} placeholder="Ej. Raíces de mi tierra" {...invalid('community-name')}/>{fieldError('community-name')}<small className="cw-selected-type">Comunidad {type.label.toLocaleLowerCase('es-EC')}</small></label>
        <label>Acerca de la comunidad (opcional)<textarea id="community-description" rows={2} maxLength={500} value={values.description} onChange={event => onChange('description', event.target.value)} placeholder="¿Qué les une y qué quieren cultivar?" {...invalid('community-description')}/><small>{values.description.length} de 500 caracteres</small>{fieldError('community-description')}</label>
        <CommunityCoverPhoto photo={values.coverPhoto} photoUrl={values.removePhoto ? undefined : values.photoUrl} fallback={guide.background} onChange={photo => onChange('coverPhoto', photo)}/>
      </div>}
      {editor === 'responsible' && <div className="cw-fields cw-responsible-fields">
        <label>Persona responsable *<input id="community-responsible" required maxLength={80} autoComplete="name" value={values.responsible} onChange={event => onChange('responsible', event.target.value)} placeholder="Su nombre" {...invalid('community-responsible')}/>{fieldError('community-responsible')}</label>
        <label>Teléfono (opcional)<input id="community-phone" type="tel" autoComplete="tel" maxLength={24} value={values.contact.phone} onChange={event => onChange('contact', {...values.contact,phone:event.target.value})} {...invalid('community-phone')}/>{fieldError('community-phone')}</label>
        <label>Correo electrónico (opcional)<input id="community-email" type="email" autoComplete="email" maxLength={254} value={values.contact.email} onChange={event => onChange('contact', {...values.contact,email:event.target.value})} {...invalid('community-email')}/>{fieldError('community-email')}</label>
      </div>}
      {editor === 'members' && <>
        <div className="cw-team-heading">
          <p>La persona responsable ya cuenta como integrante. Invita más personas por correo o añade integrantes a la lista.</p>
          <GameButton id="cw-add-member" type="button" variant="secondary" onClick={onMemberAdd}>+ Añadir integrante</GameButton>
        </div>
        {values.members.length > 0 && (
          <ul className="cw-member-roster">
            {values.members.map((person, index) => (
              <li key={person.id}>
                <span className="cw-member-avatar" aria-hidden="true">
                  {person.name.trim() ? person.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('es-EC') : '❧'}
                </span>
                <span>
                  <strong>{person.name || person.email || `Integrante ${index + 1}`}</strong>
                  <small>
                    {person.email ? `${person.email} · ` : ''}
                    <span style={{ fontWeight: 600 }}>{person.role === 'RESPONSABLE' ? 'Responsable 👑' : 'Participante 🌱'}</span>
                    {` · ${person.experience} (Nivel declarado)`}
                  </small>
                  {person.inviteStatus === 'sent' && (
                    <small style={{ color: '#2e6b20', fontWeight: 600 }}>✓ Solicitud enviada (Campana 🔔)</small>
                  )}
                  {person.inviteStatus === 'ready_to_send' && (
                    <small style={{ color: '#2e6b20', fontWeight: 600 }}>✓ Solicitud preparada para envío</small>
                  )}
                  {person.inviteStatus === 'verified' && (
                    <small style={{ color: '#2e6b20', fontWeight: 600 }}>✓ Usuario verificado (Pendiente mandar solicitud)</small>
                  )}
                  {person.inviteStatus === 'not_found' && (
                    <small style={{ color: '#8e271a', fontWeight: 600 }}>✕ Cuenta no registrada en Kawsapacha</small>
                  )}
                  {person.inviteStatus === 'already_member' && (
                    <small style={{ color: '#1d547f', fontWeight: 600 }}>ℹ Miembro activo</small>
                  )}
                  {person.inviteStatus === 'pending' && (
                    <small style={{ color: '#976212', fontWeight: 600 }}>⏳ Invitación pendiente</small>
                  )}
                </span>
                <button type="button" aria-label={`Editar integrante ${index + 1}`} onClick={() => onMemberEdit(person.id)}>Editar</button>
                <button type="button" aria-label={`Quitar integrante ${index + 1}`} onClick={() => onMemberRemove(person.id)}>Quitar</button>
              </li>
            ))}
          </ul>
        )}
        {member && (
          <fieldset className="cw-member-editor">
            <legend>Ficha de integrante · {member.name || member.email || 'Nuevo integrante'}</legend>
            <div className="cw-fields">
              <label>
                Correo electrónico para invitar *
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <input
                    id={`member-${member.id}-email`}
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    value={member.email || ''}
                    onChange={event => {
                      onMemberChange(member.id, {
                        email: event.target.value,
                        ...(member.inviteStatus && member.inviteStatus !== 'idle' ? { inviteStatus: 'idle' } : {}),
                      })
                    }}
                    placeholder="usuario@kawsapacha.ec"
                    {...invalid(`member-${member.id}-email`)}
                    style={{ flex: 1 }}
                  />
                  <GameButton
                    type="button"
                    variant="secondary"
                    disabled={lookingUp || !member.email?.trim()}
                    onClick={() => handleLookup(member)}
                    title="Consultar si el correo está registrado en la base de datos"
                  >
                    {lookingUp ? 'Buscando…' : '🔍 Consultar'}
                  </GameButton>
                </div>
                {fieldError(`member-${member.id}-email`)}
                <small>Verifica si la persona ya tiene cuenta en Kawsapacha para recibir la solicitud.</small>
              </label>

              {lookupFeedback && lookupFeedback.id === member.id && (
                <div
                  className={`cw-lookup-feedback cw-lookup-feedback--${lookupFeedback.type}`}
                  style={{
                    gridColumn: '1 / -1',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    margin: '4px 0',
                    background: lookupFeedback.type === 'success' ? '#eef7e6' : lookupFeedback.type === 'info' ? '#e9f3fb' : '#fdf0ed',
                    color: lookupFeedback.type === 'success' ? '#2e6b20' : lookupFeedback.type === 'info' ? '#1d547f' : '#8e271a',
                    border: `1px solid ${lookupFeedback.type === 'success' ? '#b6e2a1' : lookupFeedback.type === 'info' ? '#a5cbe8' : '#f0b2a8'}`,
                  }}
                >
                  {lookupFeedback.text}
                </div>
              )}

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center', margin: '4px 0 8px', flexWrap: 'wrap' }}>
                <GameButton
                  type="button"
                  disabled={inviting || !member.email?.trim() || member.inviteStatus === 'not_found' || member.inviteStatus === 'already_member' || member.inviteStatus === 'pending'}
                  onClick={() => handleSendInvite(member)}
                  title={member.inviteStatus === 'already_member' ? 'Este usuario ya es miembro activo de esta comunidad' : member.inviteStatus === 'pending' ? 'Ya tiene una invitación pendiente' : values.id ? 'Enviar solicitud por correo inmediatamente' : 'Preparar la solicitud para enviarla al crear la comunidad'}
                >
                  {inviting ? 'Enviando…' : member.inviteStatus === 'already_member' ? 'Ya es miembro activo' : member.inviteStatus === 'pending' ? 'Invitación pendiente' : values.id ? '📨 Mandar solicitud de invitación' : '📨 Mandar solicitud (preparar envío)'}
                </GameButton>
                {member.inviteStatus === 'sent' && (
                  <span style={{ fontSize: '11px', color: '#2e6b20', fontWeight: 600 }}>✓ Solicitud enviada a la campana del usuario</span>
                )}
                {member.inviteStatus === 'ready_to_send' && (
                  <span style={{ fontSize: '11px', color: '#2e6b20', fontWeight: 600 }}>✓ Solicitud preparada para el guardado</span>
                )}
                {member.inviteStatus === 'already_member' && (
                  <span style={{ fontSize: '11px', color: '#1d547f', fontWeight: 600 }}>ℹ Ya es miembro activo (Quítalo de la lista)</span>
                )}
                {member.inviteStatus === 'pending' && (
                  <span style={{ fontSize: '11px', color: '#976212', fontWeight: 600 }}>⏳ Ya tiene invitación pendiente (Quítalo de la lista)</span>
                )}
                {member.inviteStatus === 'not_found' && (
                  <span style={{ fontSize: '11px', color: '#8e271a', fontWeight: 600 }}>✕ Debes corregir el correo o quitar este integrante</span>
                )}
              </div>

              <label>
                Nombre del integrante
                <input
                  id={`member-${member.id}-name`}
                  maxLength={80}
                  value={member.name}
                  onChange={event => onMemberChange(member.id, 'name', event.target.value)}
                  placeholder="Se autocompleta al consultar el correo"
                  {...invalid(`member-${member.id}-name`)}
                />
                {fieldError(`member-${member.id}-name`)}
                <small>Nombre público del participante.</small>
              </label>

              <label>
                Rol en el sistema
                <select
                  id={`member-${member.id}-role`}
                  value={member.role || 'PARTICIPANTE'}
                  onChange={event => onMemberChange(member.id, 'role', event.target.value as any)}
                >
                  <option value="PARTICIPANTE">Participante 🌱 (Sembrar, cuidar y cosechar)</option>
                  <option value="RESPONSABLE">Responsable 👑 (Administración total)</option>
                </select>
                <small>Permisos asignados en la base de datos de la comunidad.</small>
              </label>

              <label className="cw-wide">
                Nivel de saberes declarado
                <select
                  id={`member-${member.id}-experience`}
                  value={member.experience}
                  onChange={event => onMemberChange(member.id, 'experience', event.target.value as any)}
                >
                  {['Aprendiz', 'Oficial', 'Maestro'].map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <small>Nivel de saberes comunitarios tradicionales (no altera los roles de permisos del sistema).</small>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="cw-text-button"
                style={{ color: '#8e271a', borderBottom: '1px solid #8e271a', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  onMemberRemove(member.id)
                  onMemberEdit(null)
                }}
              >
                🗑️ Quitar este integrante de la lista
              </button>
              <button className="cw-text-button" type="button" onClick={() => onMemberEdit(null)}>
                Volver a la lista de integrantes
              </button>
            </div>
          </fieldset>
        )}
      </>}
      <div className="cw-editor-actions"><button className="cw-text-button" type="button" onClick={()=>onEditorChange(null)}>Cerrar edición</button></div>
    </section>}
    <aside className="cw-location-readonly" aria-label="Territorio elegido"><div><span className="cw-location-mark" aria-hidden="true">⌖</span><div><strong>Nuestras raíces en Ecuador</strong><CommunityTerritorySummary values={values} compact/></div></div><button type="button" onClick={onTerritory}>Cambiar territorio →</button></aside>
  </section>
}
