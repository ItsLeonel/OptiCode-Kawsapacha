import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../../../App'
import PhaserGardenPoc from './PhaserGardenPoc'
import '../../../styles.css'

const renderer = new URLSearchParams(window.location.search).get('renderer') === 'canvas' ? 'canvas' : 'auto'

createRoot(document.getElementById('root')!).render(<StrictMode>
  <div className="garden-poc-laboratory">
    <App renderGardenScene={props => <PhaserGardenPoc {...props} renderer={renderer}/>}/>
  </div>
</StrictMode>)
