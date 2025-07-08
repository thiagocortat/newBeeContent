import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()

export interface UserWithRoles {
  id: string
  email: string
  role: string
  redeRoles: Array<{ redeId: string; role: string }>
  hotelRoles: Array<{ hotelId: string; role: string }>
}

// Função para extrair informações do usuário do token JWT
export async function getUserFromToken(req: NextRequest): Promise<UserWithRoles | null> {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        redeRoles: {
          select: {
            redeId: true,
            role: true
          }
        },
        hotelRoles: {
          select: {
            hotelId: true,
            role: true
          }
        }
      }
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      redeRoles: user.redeRoles,
      hotelRoles: user.hotelRoles
    }
  } catch {
    return null
  }
}

// Verificar se o usuário é superadmin
export function isSuperAdmin(user: UserWithRoles): boolean {
  return user.role === 'superadmin'
}

// Verificar se o usuário pode gerenciar uma rede específica
export function canManageRede(user: UserWithRoles, redeId: string): boolean {
  // Superadmin pode gerenciar qualquer rede
  if (isSuperAdmin(user)) return true
  
  // Verificar se é admin da rede específica
  return user.redeRoles.some(role => 
    role.redeId === redeId && role.role === 'admin'
  )
}

// Verificar se o usuário pode visualizar uma rede
export function canViewRede(user: UserWithRoles, redeId: string): boolean {
  // Superadmin pode ver qualquer rede
  if (isSuperAdmin(user)) return true
  
  // Admin da rede pode ver
  if (canManageRede(user, redeId)) return true
  
  // Verificar se tem acesso a algum hotel da rede
  return user.hotelRoles.length > 0 // Simplificado - seria necessário verificar se o hotel pertence à rede
}

// Verificar se o usuário pode gerenciar um hotel específico
export function canManageHotel(user: UserWithRoles, hotelId: string, redeId?: string): boolean {
  // Superadmin pode gerenciar qualquer hotel
  if (isSuperAdmin(user)) return true
  
  // Admin da rede pode gerenciar hotéis da rede
  if (redeId && canManageRede(user, redeId)) return true
  
  // Editor do hotel pode gerenciar
  return user.hotelRoles.some(role => 
    role.hotelId === hotelId && role.role === 'editor'
  )
}

// Verificar se o usuário pode visualizar um hotel
export function canViewHotel(user: UserWithRoles, hotelId: string, redeId?: string): boolean {
  // Superadmin pode ver qualquer hotel
  if (isSuperAdmin(user)) return true
  
  // Admin da rede pode ver hotéis da rede
  if (redeId && canManageRede(user, redeId)) return true
  
  // Editor ou viewer do hotel pode ver
  return user.hotelRoles.some(role => 
    role.hotelId === hotelId && (role.role === 'editor' || role.role === 'viewer')
  )
}

// Verificar se o usuário pode criar posts para um hotel
export function canCreatePosts(user: UserWithRoles, hotelId: string, redeId?: string): boolean {
  // Superadmin pode criar posts em qualquer hotel
  if (isSuperAdmin(user)) return true
  
  // Admin da rede pode criar posts em hotéis da rede
  if (redeId && canManageRede(user, redeId)) return true
  
  // Editor do hotel pode criar posts
  return user.hotelRoles.some(role => 
    role.hotelId === hotelId && role.role === 'editor'
  )
}

// Verificar se o usuário pode visualizar analytics
export function canViewAnalytics(user: UserWithRoles, hotelId: string, redeId?: string): boolean {
  // Mesmas permissões que visualizar hotel
  return canViewHotel(user, hotelId, redeId)
}

// Verificar se o usuário pode gerenciar usuários de uma rede
export function canManageRedeUsers(user: UserWithRoles, redeId: string): boolean {
  // Superadmin pode gerenciar usuários de qualquer rede
  if (isSuperAdmin(user)) return true
  
  // Admin da rede pode gerenciar usuários da rede
  return canManageRede(user, redeId)
}

// Verificar se o usuário pode gerenciar usuários de um hotel
export function canManageHotelUsers(user: UserWithRoles, hotelId: string, redeId?: string): boolean {
  // Superadmin pode gerenciar usuários de qualquer hotel
  if (isSuperAdmin(user)) return true
  
  // Admin da rede pode gerenciar usuários dos hotéis da rede
  if (redeId && canManageRede(user, redeId)) return true
  
  return false
}

// Função para verificar se o usuário tem acesso a uma funcionalidade específica
export function hasPermission(
  user: UserWithRoles, 
  action: 'view' | 'manage' | 'create_posts' | 'view_analytics' | 'manage_users',
  resource: 'rede' | 'hotel',
  resourceId: string,
  redeId?: string
): boolean {
  switch (resource) {
    case 'rede':
      switch (action) {
        case 'view':
          return canViewRede(user, resourceId)
        case 'manage':
          return canManageRede(user, resourceId)
        case 'manage_users':
          return canManageRedeUsers(user, resourceId)
        default:
          return false
      }
    case 'hotel':
      switch (action) {
        case 'view':
          return canViewHotel(user, resourceId, redeId)
        case 'manage':
          return canManageHotel(user, resourceId, redeId)
        case 'create_posts':
          return canCreatePosts(user, resourceId, redeId)
        case 'view_analytics':
          return canViewAnalytics(user, resourceId, redeId)
        case 'manage_users':
          return canManageHotelUsers(user, resourceId, redeId)
        default:
          return false
      }
    default:
      return false
  }
}