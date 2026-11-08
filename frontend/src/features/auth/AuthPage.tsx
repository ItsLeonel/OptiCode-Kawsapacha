import { useRef, useState, type KeyboardEvent } from 'react'
import AuthForm from './AuthForm'
import AuthIcon from './AuthIcon'
import PlantIllustration from './PlantIllustration'
import { AUTH_FIELDS, type AuthMode, type AuthSubmitHandler } from './auth'
import './auth.css'

const EDUCATION = [
  { icon: 'mountain', title: 'Aprende', text: 'Saberes del territorio' },
  { icon: 'people', title: 'Comparte', text: 'Experiencias reales' },
  { icon: 'sprout', title: 'Cultiva', text: 'Huertos saludables y sostenibles' },
] as const

export default function AuthPage({ onExploreDemo, onSubmit, onAuthenticated }: { onExploreDemo: (destination?: 'Inicio' | 'Comunidades') => void; onSubmit?: AuthSubmitHandler; onAuthenticated?: () => void }) {
  const [mode, setMode] = useState<AuthMode>('register')
  const [validFields, setValidFields] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const totalFields = AUTH_FIELDS[mode].length
  const stage = validFields === totalFields ? 2 : validFields > 0 ? 1 : 0
  const stageNames = ['Semilla', 'Brote', 'Planta']

  function selectMode(next: AuthMode) {
    if (next === mode) return
    setValidFields(0)
    setMode(next)
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') nextIndex = 1 - index
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = 1
    else return
    event.preventDefault()
    selectMode(nextIndex === 0 ? 'register' : 'login')
    tabRefs.current[nextIndex]?.focus()
  }

  return <main className="auth-page" id="auth-welcome">
    <div className="auth-landscape" aria-hidden="true"/>
    <div className="auth-warm-light" aria-hidden="true"/>
    <a href="#auth-panel" className="auth-skip-link">Ir al formulario</a>
    <header className="auth-header">
      <a className="auth-brand" href="#auth-welcome" aria-label="Kawsapacha, bienvenida">
        <span className="auth-brand-symbol"><AuthIcon name="leaf"/></span>
        <span><strong>Kawsapacha</strong><small>MI HUERTO VIVO</small></span>
      </a>
      <nav className="auth-navigation" aria-label="Navegación de bienvenida">
        <a href="#auth-welcome" aria-current="page">Inicio</a>
        <button type="button" onClick={() => onExploreDemo('Comunidades')}>Comunidad</button>
        <a href="#auth-education">Aprende</a>
        <a href="#auth-journey">Tu camino</a>
      </nav>
    </header>

    <div className="auth-layout">
      <section className="auth-story" aria-labelledby="auth-story-title">
        <div className="auth-story-copy">
          <p className="auth-welcome"><AuthIcon name="sprout"/> Bienvenido a Kawsapacha</p>
          <h1 id="auth-story-title"><span className="auth-title-ancestral">Saberes ancestrales</span>{' '}<span className="auth-title-continuation">que siguen cultivando</span>{' '}<em>vida<AuthIcon name="leaf"/></em></h1>
          <p className="auth-story-description">Nuestras raíces guardan la sabiduría de generaciones. Honremos ese legado, compartamos nuestros saberes y cultivemos juntos un futuro donde nuestras tradiciones sigan floreciendo.</p>
          <div className="auth-public-access">
            <button className="auth-discover" type="button" onClick={() => onExploreDemo()} aria-describedby="auth-public-hint">Descubrir Kawsapacha <AuthIcon name="arrow"/></button>
            <p id="auth-public-hint">Explora sin registrarte</p>
          </div>
        </div>
        <div className="auth-education" id="auth-education">
          {EDUCATION.map(card => <article key={card.title}><span className="auth-education-icon"><AuthIcon name={card.icon}/></span><h2>{card.title}</h2><p>{card.text}</p></article>)}
        </div>
        <p className="auth-origin"><AuthIcon name="mountain"/> Raíces ecuatorianas · Futuro compartido</p>
      </section>

      <section className="auth-panel" id="auth-panel" aria-label="Acceso a Kawsapacha" tabIndex={-1}>
        <div className="auth-tabs" role="tablist" aria-label="Opciones de acceso">
          {(['register', 'login'] as const).map((tabMode, index) => <button key={tabMode} id={`auth-tab-${tabMode}`} type="button" role="tab"
            aria-selected={mode === tabMode} aria-controls={`auth-tabpanel-${tabMode}`} tabIndex={mode === tabMode ? 0 : -1}
            ref={element => { tabRefs.current[index] = element }} onClick={() => selectMode(tabMode)} onKeyDown={event => handleTabKey(event, index)}>
            <AuthIcon name={tabMode === 'register' ? 'leaf' : 'user'}/>{tabMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>)}
        </div>
        <div className="auth-panel-content" role="tabpanel" id={`auth-tabpanel-${mode}`} aria-labelledby={`auth-tab-${mode}`}>
          <div className="auth-panel-heading">
            <h2><AuthIcon name="sprout"/>{mode === 'register' ? 'Siembra tu cuenta' : 'Vuelve a tu huerto'}</h2>
            <p>{mode === 'register' ? 'Únete a una comunidad que cultiva un Ecuador más sano y sostenible.' : 'Ingresa tus datos y continúa tu camino en Kawsapacha.'}</p>
          </div>
          <div className="auth-form-layout">
            <AuthForm key={mode} mode={mode} onProgress={setValidFields} onSubmit={onSubmit} onAuthenticated={onAuthenticated}/>
            <aside className="auth-growth" aria-label="Crecimiento según los campos válidos">
              <div className="auth-growth-illustration"><PlantIllustration stage={stage}/></div>
              <div className="auth-growth-details">
                <div className="auth-growth-summary"><p>Crece contigo</p><small>{validFields} de {totalFields} campos</small></div>
                <ol className="auth-growth-stages" aria-label="Etapas de crecimiento">{stageNames.map((label, index) => <li key={label} aria-current={stage === index ? 'step' : undefined} className={stage > index ? 'is-complete' : undefined}><span aria-hidden="true"/>{label}</li>)}</ol>
                <div className="auth-progress-track" role="progressbar" aria-label="Campos completados correctamente" aria-valuemin={0} aria-valuemax={totalFields} aria-valuenow={validFields} aria-valuetext={`${stageNames[stage]}: ${validFields} de ${totalFields} campos válidos`}><span style={{ width: `${validFields / totalFields * 100}%` }}/></div>
                <p className="auth-sr-only" role="status" aria-live="polite" aria-atomic="true">{stageNames[stage]}: {validFields} de {totalFields} campos válidos.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>

    <footer className="auth-journey" id="auth-journey">
      <h2><AuthIcon name="sprout"/> Tu camino en Kawsapacha <AuthIcon name="leaf"/></h2>
      <ol aria-label="Tu recorrido"><li><span className="auth-journey-number">1</span><div><strong>Descubre</strong><small>Conoce el proyecto</small></div></li>
        <li aria-current="step"><span className="auth-journey-number">2</span><div><strong>Siembra</strong><small>Crea tu cuenta</small></div></li>
        <li><span className="auth-journey-number">3</span><div><strong>Cultiva</strong><small>Explora tu jardín</small></div></li></ol>
      <span className="auth-journey-signature">Hecho para crecer en comunidad · Ecuador</span>
    </footer>
  </main>
}
