import { useEffect, useState } from 'react'
import { catalogApi, normalizeCatalogSpecies, type CatalogSpecies } from '../../shared/api/client'
import regionalSpecies from './regional-species.json'

/** Catálogo remoto como fuente de verdad y respaldo regional durante carga/offline. */
export function useSpeciesCatalog() {
  const [speciesCatalog, setSpeciesCatalog] = useState<CatalogSpecies[]>(
    () => regionalSpecies.map(normalizeCatalogSpecies),
  )
  const [catalogServerLoaded, setCatalogServerLoaded] = useState(false)
  useEffect(() => {
    let mounted = true
    catalogApi.list()
      .then(items => {
        if (!mounted) return
        if (items && items.length > 0) {
          setSpeciesCatalog(items.map(normalizeCatalogSpecies))
          setCatalogServerLoaded(true)
        }
      })
      .catch(() => { if (mounted) setCatalogServerLoaded(false) })
    return () => { mounted = false }
  }, [])
  return { speciesCatalog, catalogServerLoaded }
}
