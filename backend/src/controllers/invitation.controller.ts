// backend/src/controllers/invitation.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../types'
import { ok, fail } from '../utils/response'
import * as invitationService from '../services/invitation.service'

export async function getMyInvitations(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const invitations = await invitationService.getPendingInvitationsForEmail(req.user.email)
    ok(res, { invitations }, 'Invitaciones pendientes.')
  } catch (err: any) {
    fail(res, 'INTERNAL_ERROR', err?.message || 'Error al obtener invitaciones.', 500)
  }
}

export async function accept(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const invitationId = String(req.params['id'] ?? '')
  try {
    const result = await invitationService.acceptInvitation(invitationId, req.user.userId, req.user.email)
    ok(res, result, 'Invitación aceptada exitosamente.')
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND') {
      fail(res, 'NOT_FOUND', err.message, 404)
    } else if (err?.code === 'ALREADY_PROCESSED') {
      fail(res, 'BAD_REQUEST', err.message, 400)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al aceptar invitación.', 500)
    }
  }
}

export async function reject(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const invitationId = String(req.params['id'] ?? '')
  try {
    const result = await invitationService.rejectInvitation(invitationId, req.user.userId, req.user.email)
    ok(res, result, 'Invitación rechazada.')
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND') {
      fail(res, 'NOT_FOUND', err.message, 404)
    } else {
      fail(res, 'INTERNAL_ERROR', err?.message || 'Error al rechazar invitación.', 500)
    }
  }
}

