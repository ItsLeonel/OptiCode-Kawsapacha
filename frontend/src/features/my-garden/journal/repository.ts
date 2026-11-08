import { applyJournalCommand, emptyJournal, validateJournal, type GardenJournal, type JournalCommand } from './journal'

export type JournalPhoto = { id: string; blob: Blob }
export interface GardenRepository {
  load(): Promise<GardenJournal>
  commit(command: JournalCommand, photos?: JournalPhoto[]): Promise<GardenJournal>
  close(): void
}
const transactionDone = (transaction: IDBTransaction) => {
  const done = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar en este navegador.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('El guardado fue cancelado; se conservaron los datos anteriores.'))
  })
  // A request can reject first. Keep the transaction's rejection observed too.
  void done.catch(() => {})
  return done
}
const requestValue = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })

function photoIds(journal: GardenJournal): string[] {
  return [...new Set([...journal.plants.flatMap(plant => [plant.photoId, ...(plant.evidences ?? []).map(item => item.photoId)]), ...journal.activities.flatMap(item => item.photoIds)].filter((id): id is string => Boolean(id)))]
}
function persisted(journal: GardenJournal): GardenJournal {
  return { ...journal, plants: journal.plants.map(plant => ({ ...plant, photo: '', evidences: plant.evidences?.map(evidence => ({ ...evidence, photo: undefined })) })), activities: journal.activities.map(activity => ({ ...activity, photos: undefined })) }
}

/** Local, single-browser adapter. Transactions keep photos and metadata atomic. No invented API. */
export class IndexedDbGardenRepository implements GardenRepository {
  private database: Promise<IDBDatabase> | null = null
  private urls = new Map<string, string>()
  private closed = false
  constructor(private name = 'kawsapacha-living-garden-v1') {}

  private open() {
    if (this.closed) return Promise.reject(new Error('El almacenamiento de esta vista ya está cerrado.'))
    if (!this.database) this.database = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error('Este navegador no permite IndexedDB. No se guardarán datos solo en memoria.')); return }
      const request = indexedDB.open(this.name, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('journal')) request.result.createObjectStore('journal')
        if (!request.result.objectStoreNames.contains('photos')) request.result.createObjectStore('photos', { keyPath: 'id' })
      }
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result) }
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento local.'))
      request.onblocked = () => reject(new Error('Otra pestaña bloquea el almacenamiento. Cierra la versión antigua y vuelve a intentarlo.'))
    })
    return this.database
  }

  async load() {
    const database = await this.open()
    const transaction = database.transaction('journal', 'readwrite')
    const done = transactionDone(transaction)
    const store = transaction.objectStore('journal')
    const stored = await requestValue(store.get('current')) as GardenJournal | undefined
    const journal = stored ?? emptyJournal()
    if (!stored) store.add(journal, 'current')
    await done
    validateJournal(journal)
    return this.hydrate(journal)
  }

  async commit(command: JournalCommand, photos: JournalPhoto[] = []) {
    for (const photo of photos) {
      if (!photo.id || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.blob.type) || !photo.blob.size || photo.blob.size > 3 * 1024 * 1024) throw new Error('La fotografía debe ser JPG, PNG o WebP de hasta 3 MB.')
    }
    const database = await this.open()
    const journal = await new Promise<GardenJournal>((resolve, reject) => {
      const transaction = database.transaction(['journal', 'photos'], 'readwrite')
      const store = transaction.objectStore('journal'), media = transaction.objectStore('photos')
      let next: GardenJournal | undefined, failure: unknown
      const recordRequest = store.get('current'), keysRequest = media.getAllKeys()
      let stored: GardenJournal | undefined, keys: IDBValidKey[] | undefined, loaded = false
      function write() {
        if (!loaded || !keys) return
        try {
          const current = stored ?? emptyJournal()
          next = applyJournalCommand(current, command)
          if (next === current) return
          if (photos.some(photo => keys!.includes(photo.id))) throw new Error('La identificación de una foto ya existe. No se sobrescribirá la fotografía original.')
          const available = new Set([...keys, ...photos.map(photo => photo.id)])
          if (photoIds(next).some(id => !available.has(id))) throw new Error('Falta una fotografía asociada. Se canceló el cambio para conservar el registro anterior.')
          const referenced = new Set(photoIds(next))
          for (const photo of photos) if (referenced.has(photo.id)) media.add(photo)
          store.put(persisted(next), 'current')
        } catch (cause) { failure = cause; transaction.abort() }
      }
      recordRequest.onsuccess = () => { stored = recordRequest.result; loaded = true; write() }
      keysRequest.onsuccess = () => { keys = keysRequest.result; write() }
      transaction.oncomplete = () => next ? resolve(next) : reject(new Error('No se pudo completar el guardado.'))
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Guardado cancelado. Los datos anteriores se conservaron.'))
      transaction.onerror = () => { failure ??= transaction.error }
    })
    return this.hydrate(journal)
  }

  private async hydrate(journal: GardenJournal) {
    const database = await this.open()
    const ids = photoIds(journal)
    if (ids.length) {
      const transaction = database.transaction('photos', 'readonly'), done = transactionDone(transaction)
      const media = await Promise.all(ids.filter(id => !this.urls.has(id)).map(id => requestValue(transaction.objectStore('photos').get(id)) as Promise<JournalPhoto | undefined>))
      await done
      if (this.closed) throw new Error('La vista se cerró durante la recuperación de fotografías.')
      for (const photo of media) {
        if (!photo?.blob) throw new Error('No se encontró una fotografía guardada. Los metadatos se conservaron; vuelve a intentar abrir el almacenamiento.')
        this.urls.set(photo.id, URL.createObjectURL(photo.blob))
      }
    }
    return { ...journal, plants: journal.plants.map(plant => ({ ...plant, photo: plant.photoId ? this.urls.get(plant.photoId) ?? '' : '', evidences: plant.evidences?.map(evidence => ({ ...evidence, photo: evidence.photoId ? this.urls.get(evidence.photoId) : undefined })) })), activities: journal.activities.map(activity => ({ ...activity, photos: activity.photoIds.map(id => this.urls.get(id)!).filter(Boolean) })) }
  }

  close() { this.closed = true; this.urls.forEach(url => URL.revokeObjectURL(url)); this.urls.clear(); void this.database?.then(database => database.close()).catch(() => {}) }
}
