// backend/src/controllers/resource.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../types'
import { ok, fail } from '../utils/response'
import * as resourceService from '../services/resource.service'

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const communityId = String(req.params['id'] ?? '')
    const resources = await resourceService.listResources(communityId)
    ok(res, { resources }, 'Recursos de la comunidad.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al listar recursos.', 500)
  }
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const communityId = String(req.params['id'] ?? '')
  const { name, category, quantity, unit, status, description } = req.body as {
    name?: string
    category?: string
    quantity?: number
    unit?: string
    status?: string
    description?: string
  }

  if (!name?.trim()) return void fail(res, 'VALIDATION_ERROR', 'El nombre es obligatorio.', 400)
  if (!category?.trim()) return void fail(res, 'VALIDATION_ERROR', 'La categoría es obligatoria.', 400)

  try {
    const resource = await resourceService.createResource(communityId, {
      name: name.trim(),
      category: category.trim(),
      quantity: quantity ?? 1,
      unit: unit ?? 'unidades',
      status: status ?? 'DISPONIBLE',
      description: description ?? '',
    })
    ok(res, { resource }, 'Recurso creado.', 201)
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al crear recurso.', 500)
  }
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const resourceId = String(req.params['resourceId'] ?? '')
  const data = req.body as Partial<{
    name: string; category: string; quantity: number; unit: string; status: string; description: string
  }>

  try {
    const resource = await resourceService.updateResource(resourceId, data)
    ok(res, { resource }, 'Recurso actualizado.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al actualizar recurso.', 500)
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const resourceId = String(req.params['resourceId'] ?? '')

  try {
    await resourceService.deleteResource(resourceId)
    ok(res, {}, 'Recurso eliminado.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al eliminar recurso.', 500)
  }
}
