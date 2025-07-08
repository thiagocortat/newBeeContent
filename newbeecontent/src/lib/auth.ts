import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export interface UserToken {
  userId: string
  email: string
  role: string
  hotelId?: string | null
  redeId?: string | null
}

export async function getUserFromToken(): Promise<UserToken | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    
    if (!token) return null
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserToken
    return decoded
  } catch (error) {
    return null
  }
}

export function canEditAutomation(user: UserToken, targetHotel: any): boolean {
  if (user.role === 'superadmin') return true
  if (user.role === 'admin' && user.redeId === targetHotel.redeId) return true
  if (user.role === 'editor' && user.hotelId === targetHotel.id) return true
  return false
}

export function canViewAutomation(user: UserToken, targetHotel: any): boolean {
  if (user.role === 'superadmin') return true
  if (user.role === 'admin' && user.redeId === targetHotel.redeId) return true
  if (user.role === 'editor' && user.hotelId === targetHotel.id) return true
  if (user.role === 'viewer' && user.hotelId === targetHotel.id) return true
  return false
}

export function canAccessAutomationMenu(role: string): boolean {
  return ['superadmin', 'admin', 'editor'].includes(role)
}

export function isReadOnlyAccess(user: UserToken, targetHotel: any): boolean {
  if (user.role === 'viewer') return true
  if (user.role === 'editor' && user.hotelId !== targetHotel.id) return true
  return false
}