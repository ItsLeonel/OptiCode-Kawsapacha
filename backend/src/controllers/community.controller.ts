// backend/src/controllers/community.controller.ts
import type { Response } from 'express'
import { createCommunity, listCommunities, getCommunityById, updateCommunity } from '../services/community.service'
import { ok, fail } from '../utils/response'
import type { AuthRequest } from '../types'

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const { name, responsible, location, description } = req.body as Record<string, string>

  if (!name?.trim()) return void fail(res, 'VALIDATION_ERROR', 'El nombre de la comunidad es obligatorio.', 400, { name: 'El nombre es obligatorio.' })
  if (!responsible?.trim()) return void fail(res, 'VALIDATION_ERROR', 'El nombre del responsable es obligatorio.', 400, { responsible: 'El responsable es obligatorio.' })
  if (!location?.trim()) return void fail(res, 'VALIDATION_ERROR', 'La ubicación es obligatoria.', 400, { location: 'La ubicación es obligatoria.' })

  try {
    const community = await createCommunity({
      name: name.trim(),
      responsible: responsible.trim(),
      location: location.trim(),
      description: (description ?? '').trim(),
      creatorId: req.user.userId,
    })
    ok(res, { community }, 'Comunidad creada exitosamente.', 201)
  } catch (err: any) {
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
  const { name, responsible, location, description } = req.body as Record<string, string>
  try {
    const community = await updateCommunity(
      String(req.params['id'] ?? ''),
      req.user.userId,
      { name, responsible, location, description }
    )
    ok(res, { community }, 'Comunidad actualizada.')
  } catch (err: any) {
    if (err?.code === 'FORBIDDEN') {
      fail(res, 'FORBIDDEN', err.message || 'Solo el Responsable puede modificar la comunidad.', 403)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al actualizar la comunidad.', 500)
    }
  }
}
