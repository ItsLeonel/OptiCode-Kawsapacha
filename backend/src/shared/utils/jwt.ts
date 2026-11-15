import jwt from 'jsonwebtoken'
import { env } from '../../infrastructure/config/env'
import type { JwtPayload } from '../types/index'

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload
}

