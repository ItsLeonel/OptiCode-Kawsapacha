import type { Response } from 'express'
import { prisma } from '../config/prisma'
import { ok, fail } from '../utils/response'
import type { AuthRequest } from '../types'

/**
 * Consulta si un correo electrónico corresponde a un usuario registrado en el sistema.
 * Opcionalmente verifica si ya es miembro o tiene invitación pendiente en una comunidad.
 */
export async function lookupUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)

  const rawEmail = String(req.query['email'] ?? '').trim()
  const communityId = String(req.query['communityId'] ?? '').trim()

  if (!rawEmail) {
    return void fail(res, 'VALIDATION_ERROR', 'El correo electrónico es obligatorio.', 400)
  }

  const cleanEmail = rawEmail.toLowerCase()

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: rawEmail },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return void ok(res, {
        found: false,
        message: 'No existe ningún usuario registrado con este correo.',
      })
    }

    let isMember = false
    let isPending = false
    let roleInCommunity: string | null = null

    if (communityId) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: user.id,
          },
        },
      })

      if (membership) {
        roleInCommunity = membership.roleInCommunity
        if (membership.status === 'ACCEPTED') {
          isMember = true
        } else if (membership.status === 'PENDING') {
          isPending = true
        }
      } else {
        const pendingInvite = await prisma.communityInvitation.findFirst({
          where: {
            communityId,
            OR: [
              { email: cleanEmail },
              { email: user.email },
            ],
            status: 'PENDING',
          },
        })
        if (pendingInvite) {
          isPending = true
          roleInCommunity = pendingInvite.role
        }
      }
    }

    ok(res, {
      found: true,
      user,
      isMember,
      isPending,
      roleInCommunity,
    }, 'Usuario consultado con éxito.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al consultar el usuario.', 500)
  }
}
