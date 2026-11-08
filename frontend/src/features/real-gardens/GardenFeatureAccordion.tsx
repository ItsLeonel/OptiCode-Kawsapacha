import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import GardenIcon from '../my-garden/GardenIcon'
import './garden-feature-accordion.css'

export type GardenFeatureStep = {
  id: string
  title: string
  icon: ReactNode
  selected: number
  required?: boolean
  error?: string
  notApplicable?: boolean
  content: ReactNode
}

export default function GardenFeatureAccordion({ steps, registrationMode = false }: { steps: GardenFeatureStep[]; registrationMode?: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(() => (steps.find(step => !step.selected && !step.notApplicable) ?? steps[0])?.id ?? null)
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({})
  const errorId = steps.find(step => step.error)?.id
  const expandedId = activeId && !steps.some(step => step.id === activeId) ? steps[0]?.id : activeId
  const completed = steps.filter(step => step.notApplicable || step.selected > 0).length
  const activeIndex = steps.findIndex(step => step.id === expandedId)
  const activeStep = steps[activeIndex]
  const nextStep = steps[activeIndex + 1]

  useLayoutEffect(() => {
    if (errorId) setActiveId(errorId)
  }, [errorId, steps])

  function advance(index: number) {
    const next = steps[index + 1]
    setActiveId(next?.id ?? null)
    requestAnimationFrame(() => buttons.current[next?.id ?? steps[index].id]?.focus())
  }

  return <div className={`rg-feature-accordion${registrationMode ? ' rg-feature-accordion--registration' : ''}`}>
    {registrationMode ? <div className="rg-feature-progress" role="status" aria-live="polite"><progress value={completed} max={steps.length} aria-label="Avance de las características"/><span>{completed} de {steps.length} secciones listas</span></div> : <p className="rg-feature-progress" role="status" aria-live="polite">{completed} de {steps.length} secciones completadas</p>}
    <ol>{steps.map((step, index) => {
      const expanded = expandedId === step.id
      const complete = !step.notApplicable && step.selected > 0
      return <li key={step.id} data-complete={complete} data-expanded={expanded} data-error={Boolean(step.error)} data-not-applicable={Boolean(step.notApplicable)}>
        <h3><button type="button" id={`${step.id}-heading`} ref={element => { buttons.current[step.id] = element }} aria-expanded={expanded} aria-controls={`${step.id}-panel`} onClick={() => setActiveId(registrationMode ? step.id : expanded ? null : step.id)}>
          <span className="rg-feature-number">{index + 1}</span>{step.icon}
          <span className="rg-feature-heading-copy"><span className="rg-feature-title">{step.title}</span><span className="rg-feature-status">{step.notApplicable ? 'No aplica' : step.error ? 'Revisar' : complete ? '✓ Completado' : step.required ? 'Pendiente' : 'Opcional'}</span></span>
          <span className="rg-feature-chevron" aria-hidden="true">⌄</span>
        </button></h3>
        <div className="rg-feature-panel" id={`${step.id}-panel`} role="region" aria-labelledby={`${step.id}-heading`} hidden={!expanded}>
          {step.content}
          {!registrationMode && <div className="rg-feature-advance"><span>{complete ? `${step.selected} ${step.selected === 1 ? 'opción seleccionada' : 'opciones seleccionadas'}` : step.required ? 'Selecciona una opción para continuar.' : 'Puedes continuar sin seleccionar.'}</span><button type="button" className="rg-outline-button" disabled={Boolean(step.required && !complete)} onClick={() => advance(index)}>{index === steps.length - 1 ? 'Listo' : !complete && !step.required ? 'Continuar sin seleccionar' : 'Siguiente'}<GardenIcon name="arrow"/></button></div>}
        </div>
      </li>
    })}</ol>
    {registrationMode && activeStep && <div className="rg-registration-advance"><button type={nextStep ? 'button' : 'submit'} className="rg-primary-button" disabled={Boolean(activeStep.required && !activeStep.selected)} onClick={nextStep ? () => advance(activeIndex) : undefined}>{nextStep ? `Siguiente: ${nextStep.title}` : 'Guardar mi terreno'}<GardenIcon name="arrow"/></button></div>}
  </div>
}
