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
  
  const cleanEmail = email.trim().toLowerCase()
  const targetRole = role?.trim() === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE'

  try {
    const invitation = await memberService.inviteMember(communityId, cleanEmail, targetRole, req.user.userId)
    ok(res, { invitation }, 'Invitación enviada exitosamente.', 201)
  } catch (err: any) {
    if (err?.code === 'FORBIDDEN') {
      fail(res, 'FORBIDDEN', err.message || 'Solo el Responsable puede enviar invitaciones.', 403)
    } else if (err?.code === 'USER_NOT_FOUND') {
      fail(res, 'USER_NOT_FOUND', err.message || 'No existe ningún usuario registrado con el correo ingresado', 404)
    } else if (err?.code === 'ALREADY_MEMBER') {
      fail(res, 'CONFLICT', err.message || 'El usuario ya es miembro de esta comunidad.', 409)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al invitar miembro.', 500)
    }
  }
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  try {
    const communityId = String(req.params['id'] ?? '')
    const members = await memberService.listMembers(communityId)
    ok(res, { members }, 'Miembros de la comunidad.')
  } catch (err: any) {
    fail(res, 'INTERNAL_ERROR', err?.message || 'Error al listar miembros.', 500)
  }
}

export async function updateRole(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const communityId = String(req.params['id'] ?? '')
  const memberId = String(req.params['userId'] ?? '')
  const { role } = req.body as { role?: string }

  const targetRole = role?.trim() === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE'

  try {
    const member = await memberService.updateMemberRole(communityId, memberId, targetRole, req.user.userId)
    ok(res, { member }, 'Rol actualizado.')
  } catch (err: any) {
    if (err?.code === 'FORBIDDEN') {
      fail(res, 'FORBIDDEN', err.message || 'Solo el Responsable puede modificar roles.', 403)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al actualizar rol.', 500)
    }
  }
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const communityId = String(req.params['id'] ?? '')
  const memberId = String(req.params['userId'] ?? '')

  try {
    await memberService.removeMember(communityId, memberId, req.user.userId)
    ok(res, {}, 'Miembro eliminado.')
  } catch (err: any) {
    if (err?.code === 'FORBIDDEN') {
      fail(res, 'FORBIDDEN', err.message || 'Solo el Responsable puede eliminar miembros.', 403)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al eliminar miembro.', 500)
    }
  }
}
