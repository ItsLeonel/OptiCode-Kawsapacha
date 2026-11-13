// backend/src/controllers/garden.controller.ts
import type { Response } from 'express'
import { createGarden, listGardens, getGardenById, updateGarden } from '../services/garden.service'
import { ok, fail } from '../utils/response'
import type { AuthRequest } from '../types'

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const b = req.body as Record<string, unknown>

  if (!b['name'] || String(b['name']).trim().length < 3)
    return void fail(res, 'VALIDATION_ERROR', 'El nombre del huerto debe tener al menos 3 caracteres.', 400, { name: 'Mínimo 3 caracteres.' })
  if (!b['province'])
    return void fail(res, 'VALIDATION_ERROR', 'Selecciona una provincia de Ecuador.', 400, { province: 'La provincia es obligatoria.' })
  if (!b['kind'])
    return void fail(res, 'VALIDATION_ERROR', 'Selecciona el tipo de huerto.', 400, { kind: 'El tipo de huerto es obligatorio.' })
  const area = Number(b['areaM2'])
  if (!Number.isFinite(area) || area < 0.01)
    return void fail(res, 'VALIDATION_ERROR', 'Indica una superficie de al menos 0,01 m².', 400, { areaM2: 'Superficie inválida.' })

  try {
    const coords = parseCoordinates(b['coordinates'])
    const garden = await createGarden({
      name: String(b['name']).trim(),
      kind: String(b['kind']),
      areaM2: area,
      province: String(b['province']),
      provinceCode: String(b['provinceCode'] ?? ''),
      canton: String(b['canton'] ?? ''),
      cantonCode: b['cantonCode'] ? String(b['cantonCode']) : null,
      parish: String(b['parish'] ?? ''),
      parishCode: b['parishCode'] ? String(b['parishCode']) : null,
      reference: String(b['reference'] ?? '').slice(0, 300),
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      irrigationAvailability: String(b['irrigationAvailability'] ?? 'unknown'),
      soilType: b['soilType'] ? String(b['soilType']) : null,
      characteristics: b['characteristics']
        ? (typeof b['characteristics'] === 'object' ? JSON.stringify(b['characteristics']) : String(b['characteristics']))
        : null,
      communityId: b['communityId'] ? String(b['communityId']) : null,
      createdById: req.user.userId,
      file: req.file,
    })
    ok(res, { garden }, 'Huerto registrado exitosamente.', 201)
  } catch (err: any) {
    if (err?.code === 'INVALID_PHOTO' || err instanceof SyntaxError) return void fail(res, 'VALIDATION_ERROR', err.message, 400)
    if (err?.code === 'FORBIDDEN') return void fail(res, err.code, err.message, 403)
    fail(res, 'INTERNAL_ERROR', err?.message || 'Error al registrar el huerto.', 500)
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const communityId = req.query['communityId'] ? String(req.query['communityId']) : undefined
    const gardens = await listGardens(req.user.userId, communityId)
    ok(res, { gardens }, 'Listado de huertos.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener los huertos.', 500)
  }
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const garden = await getGardenById(String(req.params['id'] ?? ''))
    if (!garden) return void fail(res, 'NOT_FOUND', 'Huerto no encontrado.', 404)
    ok(res, { garden }, 'Detalle del huerto.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener el huerto.', 500)
  }
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const id = String(req.params['id'] ?? '')
  const b = req.body as Record<string, unknown>

  try {
    const coords = parseCoordinates(b['coordinates'])
    const updated = await updateGarden(id, req.user.userId, {
      name: b['name'] ? String(b['name']) : undefined,
      kind: b['kind'] ? String(b['kind']) : undefined,
      areaM2: b['areaM2'] !== undefined ? Number(b['areaM2']) : undefined,
      province: b['province'] ? String(b['province']) : undefined,
      provinceCode: b['provinceCode'] ? String(b['provinceCode']) : undefined,
      canton: b['canton'] !== undefined ? String(b['canton'] ?? '') : undefined,
      cantonCode: b['cantonCode'] !== undefined ? (b['cantonCode'] ? String(b['cantonCode']) : null) : undefined,
      parish: b['parish'] !== undefined ? String(b['parish'] ?? '') : undefined,
      parishCode: b['parishCode'] !== undefined ? (b['parishCode'] ? String(b['parishCode']) : null) : undefined,
      reference: b['reference'] !== undefined ? String(b['reference'] ?? '').slice(0, 300) : undefined,
      latitude: b['coordinates'] !== undefined ? coords?.latitude ?? null : (b['latitude'] !== undefined ? Number(b['latitude']) : undefined),
      longitude: b['coordinates'] !== undefined ? coords?.longitude ?? null : (b['longitude'] !== undefined ? Number(b['longitude']) : undefined),
      irrigationAvailability: b['irrigationAvailability'] ? String(b['irrigationAvailability']) : undefined,
      soilType: b['soilType'] !== undefined ? (b['soilType'] ? String(b['soilType']) : null) : undefined,
      characteristics: b['characteristics'] !== undefined
        ? (typeof b['characteristics'] === 'object' ? JSON.stringify(b['characteristics']) : (b['characteristics'] ? String(b['characteristics']) : null))
        : undefined,
      communityId: b['communityId'] !== undefined ? (b['communityId'] ? String(b['communityId']) : null) : undefined,
      file: req.file,
      removePhoto: b['removePhoto'] === true || b['removePhoto'] === 'true',
    })
    ok(res, { garden: updated }, 'Huerto actualizado.')
  } catch (err: any) {
    if (err?.code === 'INVALID_PHOTO' || err instanceof SyntaxError) return void fail(res, 'VALIDATION_ERROR', err.message, 400)
    if (err?.code === 'FORBIDDEN') {
      fail(res, 'FORBIDDEN', err.message || 'Solo el creador o Responsable puede modificar el huerto.', 403)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al actualizar el huerto.', 500)
    }
  }
}

function parseCoordinates(value: unknown): { latitude: number; longitude: number } | null {
  const coords = (typeof value === 'string' && value ? JSON.parse(value) : value) as { latitude?: number; longitude?: number } | null | undefined
  if (coords == null || value === '') return null
  if (typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number' || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude) || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
    throw new SyntaxError('Indica coordenadas válidas para el terreno.')
  }
  return { latitude: coords.latitude, longitude: coords.longitude }
}
