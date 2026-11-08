import { createRoot } from 'react-dom/client'
import App from '../../src/App'
import '../../src/styles.css'

// Adaptador exclusivo de pruebas. No forma parte del punto de entrada de la aplicación.
const params = new URLSearchParams(window.location.search)
createRoot(document.getElementById('root')!).render(<App onAuthenticate={async () => {
  await new Promise(resolve => setTimeout(resolve, Number(params.get('delay') ?? 0)))
  document.documentElement.dataset.authAdapterResolved = 'true'
  if (params.get('result') === 'error') throw new Error('Fallo del adaptador de prueba')
  return { message: 'Respuesta del adaptador de prueba.', authenticated: params.get('result') === 'confirmed' }
}}/>)
