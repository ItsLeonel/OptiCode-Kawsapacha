import type { RealGardenDraft } from './real-garden'

export const draftKey = (draft: RealGardenDraft) =>
  JSON.stringify({ ...draft, photo: draft.photo ? [draft.photo.name, draft.photo.size, draft.photo.lastModified] : null })

