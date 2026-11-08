import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { emptyJournal, projectPlants, type GardenJournal, type JournalCommand } from './journal'
import { IndexedDbGardenRepository, type JournalPhoto } from './repository'

export function useGardenJournal() {
  const [data, setData] = useState<GardenJournal>(emptyJournal)
  const [loading, setLoading] = useState(true), [failure, setFailure] = useState(''), [saving, setSaving] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const repository = useRef<IndexedDbGardenRepository | null>(null)
  const channel = useRef<BroadcastChannel | null>(null)
  const accept = useCallback((next: GardenJournal) => setData(current => next.revision >= current.revision ? next : current), [])
  useEffect(() => {
    let active = true
    const store = new IndexedDbGardenRepository(); repository.current = store
    const connection = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('kawsapacha-living-garden-v1'); channel.current = connection
    setLoading(true); setFailure('')
    store.load().then(next => { if (active) { accept(next); setReady(true); setLoading(false) } }).catch(cause => { if (active) { setFailure(cause instanceof Error ? cause.message : 'No se pudo recuperar el jardín guardado.'); setLoading(false) } })
    if (connection) connection.onmessage = () => { store.load().then(next => { if (active) accept(next) }).catch(cause => { if (active) setFailure(cause instanceof Error ? cause.message : 'No se pudo actualizar el jardín de esta pestaña.') }) }
    return () => { active = false; connection?.close(); store.close(); if (repository.current === store) repository.current = null }
  }, [attempt, accept])
  const commit = useCallback(async (command: JournalCommand, photos?: JournalPhoto[]) => {
    if (!repository.current) throw new Error('Espera a que termine de abrirse el jardín guardado.')
    setSaving(count => count + 1)
    try { const next = await repository.current.commit(command, photos); accept(next); channel.current?.postMessage(next.revision); setFailure(''); return next }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : 'No se pudo guardar el cambio.'); throw cause }
    finally { setSaving(count => count - 1) }
  }, [accept])
  const plants = useMemo(() => projectPlants(data), [data])
  return { data, plants, loading, ready, saving: saving > 0, failure, commit, retry: () => setAttempt(value => value + 1) }
}
