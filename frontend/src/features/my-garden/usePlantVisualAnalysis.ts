import { useEffect, useState } from 'react'
import { analyzePlantPhoto } from './plant-photo-analysis'
import type { PlantVisualProfile } from './plant-visual-profile'

export type PlantAnalysisState = {
  status: 'idle' | 'analyzing' | 'ready' | 'uncertain' | 'unavailable'
  profile: PlantVisualProfile | null
}

export function usePlantVisualAnalysis(photo: Blob | null | undefined): PlantAnalysisState {
  const [state, setState] = useState<{ photo: Blob | null | undefined; result: PlantAnalysisState }>({ photo: undefined, result: { status: 'idle', profile: null } })
  useEffect(() => {
    let live = true
    if (!photo) {
      setState({ photo, result: { status: 'idle', profile: null } })
      return () => { live = false }
    }
    setState({ photo, result: { status: 'analyzing', profile: null } })
    void analyzePlantPhoto(photo).then(profile => {
      if (!live) return
      setState({ photo, result: profile
        ? { status: profile.confidence === 'low' ? 'uncertain' : 'ready', profile }
        : { status: 'unavailable', profile: null } })
    }).catch(() => { if (live) setState({ photo, result: { status: 'unavailable', profile: null } }) })
    return () => { live = false }
  }, [photo])
  // Nunca asociar por accidente el perfil de la foto A a la foto B recién elegida.
  return state.photo === photo ? state.result : { status: photo ? 'analyzing' : 'idle', profile: null }
}
