import { useRef, useState, type FormEvent } from 'react'
import { GameButton, GameGuide, GamePanel, GameWorld, gameRegionAssets } from '../../shared/ui/game-ui/GameUI'
import { regionForProvince } from '../real-gardens/garden-region'
import GardenIcon from '../my-garden/GardenIcon'
import CommunityDialog from './CommunityDialog'
import CommunityIcon from './CommunityIcon'
import { type Community, type CommunityMember, type CommunitySave, type CommunityType } from './communities'
import './community-wizard.css'
import './community-experience-v2.css'
import './community-v3.css'
import CommunityTypeStep from './CommunityTypeStep'
import CommunityTerritoryStep from './CommunityTerritoryStep'
import CommunityBuilderStep, { type CommunityEditor } from './CommunityBuilderStep'
import CommunityCoverPhoto from './CommunityCoverPhoto'
import { COMMUNITY_TYPES as TYPES } from './community-art'
import { communityLocation, communityProvince, communityTerritoryLabels, validateCommunityTerritory, type CommunityTerritory } from './community-territory'
import { regionalLandscapes } from '../../shared/regional-landscapes'

type Values = Community & CommunityTerritory & { type: CommunityType; contact: { phone: string; email: string }; members: CommunityMember[] }
type Errors = Record<string, string>

export default function CommunityForm({ community, acceptedMembersCount, onSave, onClose }: {
  community: Community | null; acceptedMembersCount?: number; onSave: CommunitySave; onClose: () => void
}) {
  const [values, setValues] = useState<Values>(() => ({
    id: community?.id,
    name: '', responsible: '', description: '', ...community,
    // A province-only payload is not an additional locality. Keep it derived on edit.
    location: community?.location === community?.province ? '' : community?.location ?? '',
    type: community?.type ?? 'personal',
    province: communityProvince(community),
    cantonCode: community?.cantonCode ?? '', parishCode: community?.parishCode ?? '', sector: community?.sector ?? '',
    contact: community?.contact ?? { phone: '', email: '' }, members: community?.members ?? [],
  }))
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editor, setEditor] = useState<CommunityEditor>(null)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const nextMember = useRef(0)
  const region = regionForProvince(values.province)
  const regional = { ...gameRegionAssets[region], background: regionalLandscapes[region] }
  const territorial = communityTerritoryLabels(values)

  function update<K extends keyof Values>(field: K, value: Values[K]) {
    setValues(current => ({ ...current, [field]: value,
      ...(field === 'province' && value !== current.province ? { cantonCode: '', parishCode: '', sector: '', location: '' } : {}),
      ...(field === 'cantonCode' && value !== current.cantonCode ? { parishCode: '' } : {}),
      ...(field === 'coverPhoto' ? { removePhoto: !value } : {}),
    }))
    setErrors({}); setSaveError('')
  }
  function updateMember(id: string, fieldOrUpdates: keyof CommunityMember | Partial<CommunityMember>, value?: any) {
    setValues(current => ({
      ...current,
      members: current.members.map(member => {
        if (member.id !== id) return member
        if (typeof fieldOrUpdates === 'string') {
          return { ...member, [fieldOrUpdates]: value }
        }
        return { ...member, ...fieldOrUpdates }
      }),
    }))
    setErrors({})
    setSaveError('')
  }
  function addMember() {
    const id = `local-${Date.now()}-${++nextMember.current}`
    update('members', [
      ...values.members,
      {
        id,
        name: '',
        email: '',
        role: 'PARTICIPANTE',
        birthDate: '',
        gender: '',
        certifiedTalents: '',
        experience: 'Aprendiz',
        inviteStatus: 'idle',
      },
    ])
    setEditor('members'); setEditingMember(id)
    requestAnimationFrame(() => document.getElementById(`member-${id}-email`)?.focus())
  }
  function removeMember(id: string) {
    update('members', values.members.filter(member => member.id !== id))
    if (editingMember === id) setEditingMember(null)
  }
  function validate(target: number): Errors {
    const result: Errors = {}
    if (target === 1) return validateCommunityTerritory(values)
    if (target === 2) {
      if (values.name.trim().length < 3 || values.name.trim().length > 80) result['community-name'] = 'Escribe un nombre de entre 3 y 80 caracteres, sin contar espacios al inicio o al final.'
      if (values.responsible.trim().length < 2 || values.responsible.trim().length > 80) result['community-responsible'] = 'Escribe el nombre de la persona responsable (entre 2 y 80 caracteres).'
      const phoneDigits = values.contact.phone.replace(/\D/g, '')
      if (values.contact.phone && (!/^\+?[\d\s()-]{7,24}$/.test(values.contact.phone.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15)) result['community-phone'] = 'Escribe un teléfono válido, con 7 a 15 dígitos.'
      if (values.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact.email.trim())) result['community-email'] = 'Escribe un correo electrónico válido.'
      if (values.description.length > 500) result['community-description'] = 'Usa hasta 500 caracteres para la descripción.'
      values.members.forEach(member => {
        const email = (member.email || '').trim().toLowerCase()
        if (!email) {
          result[`member-${member.id}-email`] = `Ingresa el correo para invitar a ${member.name.trim() || 'este integrante'}, o quítalo de la lista.`
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          result[`member-${member.id}-email`] = 'Escribe un correo electrónico válido.'
        } else if (member.inviteStatus === 'not_found') {
          result[`member-${member.id}-email`] = `No existe una cuenta registrada con el correo "${email}". Debe registrarse en Kawsapacha primero o quita al integrante de la lista.`
        } else if (member.inviteStatus === 'already_member') {
          result[`member-${member.id}-email`] = `"${member.name || email}" ya es miembro registrado en esta comunidad. Quítalo de la lista con el botón "Quitar este integrante" para continuar.`
        } else if (member.inviteStatus === 'pending') {
          result[`member-${member.id}-email`] = `"${member.name || email}" ya tiene una invitación pendiente en esta comunidad. Quítalo de la lista con el botón "Quitar este integrante" para continuar.`
        } else if (!['sent', 'ready_to_send'].includes(member.inviteStatus || '')) {
          result[`member-${member.id}-email`] = `Debes consultar el correo y presionar "Mandar solicitud" para ${email} antes de continuar, o quita al integrante de la lista.`
        }
        if (member.name && member.name.trim().length > 80) {
          result[`member-${member.id}-name`] = 'El nombre del integrante no debe superar los 80 caracteres.'
        }
      })
    }
    return result
  }
  function focusStep(target: number, nextErrors: Errors = {}) {
    setStep(target); setErrors(nextErrors)
    if (target === 2 && Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0]
      if (first.startsWith('member-')) {
        setEditor('members')
        setEditingMember(values.members.find(member => first.startsWith(`member-${member.id}-`))?.id ?? null)
      } else setEditor(first === 'community-name' || first === 'community-description' ? 'identity' : 'responsible')
    }
    requestAnimationFrame(() => {
      const errorId = Object.keys(nextErrors)[0]
      if (errorId) formRef.current?.querySelector<HTMLElement>(`[id="${errorId}"]`)?.focus()
      else formRef.current?.querySelector<HTMLElement>('[data-step-heading]')?.focus({ preventScroll: true })
    })
  }
  function navigate(target: number) {
    if (saving) return
    if (target > step) {
      for (let index = 0; index < target; index++) {
        const nextErrors = validate(index)
        if (Object.keys(nextErrors).length) { focusStep(index, nextErrors); return }
      }
    }
    focusStep(target)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (step < 3) { navigate(step + 1); return }
    for (const index of [1, 2]) {
      const nextErrors = validate(index)
      if (Object.keys(nextErrors).length) { focusStep(index, nextErrors); return }
    }
    setSaving(true); setSaveError('')
    try {
      await onSave({ ...values, name: values.name.trim(), responsible: values.responsible.trim(),
        location: communityLocation(values), sector: values.sector.trim(), description: values.description.trim(),
        contact: { phone: values.contact.phone.trim(), email: values.contact.email.trim() },
        members: values.members
          .filter(member => ['sent', 'ready_to_send'].includes(member.inviteStatus || ''))
          .map(member => ({
            ...member,
            name: member.name.trim() || member.email?.trim().toLowerCase() || 'Integrante',
            email: member.email?.trim().toLowerCase() || undefined,
            role: member.role || 'PARTICIPANTE',
            inviteStatus: member.inviteStatus,
          })),
      })
    } catch {
      setSaveError('No se pudo guardar la comunidad. Tus datos siguen aquí; vuelve a intentarlo.')
      setSaving(false)
    }
  }

  return <CommunityDialog className="community-wizard game-v3" title={step === 2 ? 'Datos de tu Comunidad' : step === 3 ? 'Confirma tu Comunidad' : community ? 'Editar tu Comunidad' : 'Crear tu Comunidad'} description="Un lugar para echar raíces y cultivar juntos." onClose={() => { if (!saving) onClose() }} artwork={<GameWorld region={region} background={regional.background} className="cw-world">{null}</GameWorld>}>
    <form ref={formRef} onSubmit={submit} noValidate className="cw-form" aria-label={community ? 'Editar comunidad' : 'Crear comunidad'} aria-describedby="cw-temporary" aria-busy={saving}>
      <div className={`cw-stage cw-stage--${step}`}>
        <GameGuide region={region} message={step === 0 ? '¿Qué comunidad quieres crear?' : step === 1 ? '¡Ubica tu comunidad y elige su provincia!' : step === 2 ? 'Tres tarjetas, una historia compartida.' : '¡Revisa las raíces de tu comunidad!'}/>
        {step === 0 && <CommunityTypeStep value={values.type} onChange={value => update('type', value)}/>}
        {step === 1 && <CommunityTerritoryStep values={values} errors={errors} onChange={update}/>}
        {step === 2 && <CommunityBuilderStep values={values} errors={errors} editor={editor} editingMember={editingMember} onEditorChange={setEditor} onMemberEdit={id => { setEditor('members'); setEditingMember(id) }} onMemberAdd={addMember} onMemberRemove={removeMember} onMemberChange={updateMember} onChange={update} onTerritory={() => navigate(1)}/>}
        {step === 3 && <GamePanel className="cw-confirm"><h3 className="cw-step-label" data-step-heading tabIndex={-1}>Así comienzan tus raíces</h3><div className="cw-summary-banner" style={{ backgroundImage: `linear-gradient(0deg,#092e24ed,#092e2470),url("${regional.background}")` }}><CommunityCoverPhoto photo={values.coverPhoto} photoUrl={values.removePhoto ? undefined : values.photoUrl} fallback={regional.background} onChange={photo => update('coverPhoto', photo)}/><div className="cw-summary-identity"><GardenIcon name="community"/><strong>{values.name}</strong><span>{values.province} · {regional.label}</span></div></div>
          <dl className="cw-summary">
            <div className="cw-confirm-card cw-confirm-card--community"><dt><GardenIcon name="community"/>Comunidad</dt><dd>{TYPES.find(type => type.value === values.type)?.label}</dd><button type="button" onClick={() => navigate(0)}>Editar tipo</button></div>
            <div className="cw-confirm-card cw-confirm-card--territory"><dt><GardenIcon name="map"/>Territorio</dt><dd className="cw-confirm-territory"><span>Provincia: {territorial.province}</span><span>Cantón: {territorial.canton}</span><span>Parroquia: {territorial.parish}</span><span>Sector: {territorial.sector || 'Sin especificar'}</span><span>Región: {territorial.region}</span></dd><button type="button" onClick={() => navigate(1)}>Editar ubicación</button></div>
            <div className="cw-confirm-card cw-confirm-card--responsible"><dt><CommunityIcon name="person"/>Responsable</dt><dd>{values.responsible}</dd><button type="button" onClick={() => { setEditor('responsible'); navigate(2) }}>Editar datos</button></div>
            <div className="cw-confirm-card cw-confirm-card--members">
              <dt><GardenIcon name="community"/>Integrantes</dt>
              <dd>
                {(() => {
                  const newInvitations = values.members.filter(m =>
                    ['sent', 'ready_to_send'].includes(m.inviteStatus || '')
                  )
                  const baseCount = acceptedMembersCount ?? 1
                  const totalCount = baseCount + newInvitations.length
                  return (
                    <>
                      {totalCount} {totalCount === 1 ? 'persona (Responsable)' : 'personas'} · {newInvitations.length ? `${newInvitations.length} nueva(s) invitación(es)` : 'Sin nuevas invitaciones'} · Datos privados
                      {newInvitations.length > 0 && (
                        <span style={{ display: 'block', fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
                          {newInvitations.map(m => `${m.name || 'Integrante'}${m.email ? ` (${m.email})` : ''} [${m.role === 'RESPONSABLE' ? 'Responsable 👑' : 'Participante 🌱'}]`).join(', ')}
                        </span>
                      )}
                    </>
                  )
                })()}
              </dd>
            </div>
          </dl>
          {values.description && <p className="cw-confirm-description">{values.description}</p>}<p className="cw-soft-note">Tu comunidad, lista para echar raíces.</p>
        </GamePanel>}
      </div>
      {Object.keys(errors).length > 0 && <p className="cw-validation" role="alert">{Object.values(errors)[0]}</p>}
      {saveError && <p className="cw-validation" role="alert">{saveError}</p>}
      <footer className="cw-footer"><GameButton variant="secondary" type="button" disabled={saving} onClick={() => step ? navigate(step - 1) : onClose()}>{step ? '← Atrás' : 'Cancelar'}</GameButton><div className="cw-footer-meta"><p id="cw-temporary">Guardado local · Sin sincronización</p>{step > 0 && <button className="cw-cancel" type="button" onClick={onClose} disabled={saving}>Cancelar</button>}</div><GameButton type="submit" disabled={saving}>{saving ? 'Guardando…' : step === 3 ? community ? 'Guardar cambios' : 'Crear comunidad' : 'Continuar →'}</GameButton></footer>
    </form>
  </CommunityDialog>
}
