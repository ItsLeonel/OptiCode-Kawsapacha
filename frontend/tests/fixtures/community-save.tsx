import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import CommunityForm from '../../src/features/communities/CommunityForm'
import '../../src/styles.css'
import '../../src/features/communities/communities.css'

let attempts = 0
function SaveHarness() {
  const [done, setDone] = useState(false)
  return done ? <p role="status">Guardado confirmado</p> : <CommunityForm community={null} onClose={() => {}} onSave={async () => {
    attempts++
    if (attempts === 1) throw new Error('Fallo de almacenamiento simulado')
    setDone(true)
  }}/>
}
createRoot(document.getElementById('root')!).render(<SaveHarness/>)
