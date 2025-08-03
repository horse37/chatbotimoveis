import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface CorretorPayload {
  id: number
  nome: string
  email: string
  role: string
}

export function verifyToken(token: string): CorretorPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CorretorPayload
    return decoded
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export async function requireAuth(request: NextRequest): Promise<{ success: boolean; userId?: number; role?: string; error?: string }> {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { success: false, error: 'Token não fornecido' }
  }
  
  const payload = verifyToken(token)
  if (!payload) {
    return { success: false, error: 'Token inválido' }
  }
  
  return { success: true, userId: payload.id, role: payload.role }
}