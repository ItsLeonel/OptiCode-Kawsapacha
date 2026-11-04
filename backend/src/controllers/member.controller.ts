// backend/src/controllers/member.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../types'
import { ok, fail } from '../utils/response'
import * as memberService from '../services/member.service'

export async function invite(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const communityId = String(req.params['id'] ?? '')
  const { email, role } = req.body as { email?: string; role?: string }

  if (!email?.trim()) return void fail(res, 'VALIDATION_ERROR', 'El email es obligatorio.', 400)
  if (!role?.trim()) return void fail(res, 'VALIDATION_ERROR', 'El rol es obligatorio.', 400)

  try {
    const invitation = await memberService.inviteMember(communityId, email.trim(), role.trim(), req.user.userId)
    ok(res, { invitation }, 'Invitación enviada.', 201)
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al invitar miembro.', 500)
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const communityId = String(req.params['id'] ?? '')
    const members = await memberService.listMembers(communityId)
    ok(res, { members }, 'Miembros de la comunidad.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al listar miembros.', 500)
  }
}

export async function updateRole(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const communityId = String(req.params['id'] ?? '')
  const memberId = String(req.params['userId'] ?? '')
  const { role } = req.body as { role?: string }

  if (!role?.trim()) return void fail(res, 'VALIDATION_ERROR', 'El rol es obligatorio.', 400)

  try {
    const member = await memberService.updateMemberRole(communityId, memberId, role.trim())
    ok(res, { member }, 'Rol actualizado.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al actualizar rol.', 500)
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const communityId = String(req.params['id'] ?? '')
  const memberId = String(req.params['userId'] ?? '')

  try {
    await memberService.removeMember(communityId, memberId)
    ok(res, {}, 'Miembro eliminado.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al eliminar miembro.', 500)
  }
}
