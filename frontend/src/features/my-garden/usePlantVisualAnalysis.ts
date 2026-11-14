import { useEffect, useState } from 'react'
import { analyzePlantPhoto } from './plant-photo-analysis'
import type { PlantVisualProfile } from './plant-visual-profile'

export type PlantAnalysisState = {
  status: 'idle' | 'analyzing' | 'ready' | 'uncertain' | 'unavailable'
  profile: PlantVisualProfile | null
}

export function usePlantVisualAnalysis(photo: Blob | null | undefined): PlantAnalysisState {
  const [state, setState] = useState<PlantAnalysisState>({ status: 'idle', profile: null })
  useEffect(() => {
    let live = true
    if (!photo) {
      setState({ status: 'idle', profile: null })
      return () => { live = false }
    }
    setState({ status: 'analyzing', profile: null })
    void analyzePlantPhoto(photo).then(profile => {
      if (!live) return
      setState(profile
        ? { status: profile.confidence === 'low' ? 'uncertain' : 'ready', profile }
        : { status: 'unavailable', profile: null })
    }).catch(() => { if (live) setState({ status: 'unavailable', profile: null }) })
    return () => { live = false }
  }, [photo])
  return state
}
