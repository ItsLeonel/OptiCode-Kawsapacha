import type { Response } from 'express'
import { createGarden, listGardens, getGardenById } from '../services/garden.service'
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
    const coords = b['coordinates'] as { latitude: number; longitude: number } | null
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
      communityId: b['communityId'] ? String(b['communityId']) : null,
      createdById: req.user.userId,
    })
    ok(res, { garden }, 'Huerto registrado exitosamente.', 201)
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al registrar el huerto.', 500)
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const communityId = req.query['communityId'] ? String(req.query['communityId']) : undefined
    const gardens = await listGardens(communityId)
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
