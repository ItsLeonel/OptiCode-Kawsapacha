// backend/src/controllers/community.controller.ts
import type { Response } from 'express'
import { createCommunity, listCommunities, getCommunityById, updateCommunity } from '../services/community.service'
import { ok, fail } from '../utils/response'
import type { AuthRequest } from '../types'

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const { name, responsible, location, description, type } = req.body as Record<string, string>

  if (typeof name !== 'string' || !name.trim()) return void fail(res, 'VALIDATION_ERROR', 'El nombre de la comunidad es obligatorio.', 400, { name: 'El nombre es obligatorio.' })
  if (typeof responsible !== 'string' || !responsible.trim()) return void fail(res, 'VALIDATION_ERROR', 'El nombre del responsable es obligatorio.', 400, { responsible: 'El responsable es obligatorio.' })
  if (typeof location !== 'string' || !location.trim()) return void fail(res, 'VALIDATION_ERROR', 'La ubicación es obligatoria.', 400, { location: 'La ubicación es obligatoria.' })

  try {
    const community = await createCommunity({
      name: name.trim(),
      responsible: responsible.trim(),
      location: location.trim(),
      description: (description ?? '').trim(),
      type: type ? type.trim() : undefined,
      ...territoryFields(req.body),
      file: req.file,
      creatorId: req.user.userId,
    })
    ok(res, { community }, 'Comunidad creada exitosamente.', 201)
  } catch (err: any) {
    if (err?.code === 'INVALID_PHOTO') return void fail(res, err.code, err.message, 400)
    if (err?.code === 'COMMUNITY_LIMIT_REACHED') {
      fail(res, 'LIMIT_REACHED', err.message || 'Cada usuario puede crear como máximo una comunidad propia.', 400)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al crear la comunidad.', 500)
    }
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const communities = await listCommunities(req.user.userId)
    ok(res, { communities }, 'Listado de comunidades.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener las comunidades.', 500)
  }
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const community = await getCommunityById(String(req.params['id'] ?? ''))
    if (!community) return void fail(res, 'NOT_FOUND', 'Comunidad no encontrada.', 404)
    ok(res, { community }, 'Detalle de comunidad.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener la comunidad.', 500)
  }
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const { name, responsible, location, description, type } = req.body as Record<string, string>
  try {
    const community = await updateCommunity(
      String(req.params['id'] ?? ''),
      req.user.userId,
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(responsible !== undefined && { responsible: responsible.trim() }),
        ...(location !== undefined && { location: location.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(type !== undefined && { type: type.trim() }),
        ...territoryFields(req.body),
        file: req.file,
        removePhoto: req.body.removePhoto === true || req.body.removePhoto === 'true',
      }
    )
    ok(res, { community }, 'Comunidad actualizada.')
  } catch (err: any) {
    if (err?.code === 'INVALID_PHOTO') return void fail(res, err.code, err.message, 400)
    if (err?.code === 'FORBIDDEN') {
      fail(res, 'FORBIDDEN', err.message || 'Solo el Responsable puede modificar la comunidad.', 403)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al actualizar la comunidad.', 500)
    }
  }
}

function territoryFields(body: Record<string, unknown>) {
  return Object.fromEntries(['province', 'cantonCode', 'parishCode', 'sector'].filter(key => body[key] !== undefined)
    .map(key => [key, String(body[key] ?? '').trim().slice(0, 120)]))
}
