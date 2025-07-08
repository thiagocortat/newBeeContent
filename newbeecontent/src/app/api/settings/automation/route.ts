import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/database'
import { canEditAutomation, canViewAutomation } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      hotelId: decoded.hotelId,
      redeId: decoded.redeId
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Para superadmin, buscar hotel específico via query param ou usar o primeiro disponível
    let targetHotelId = user.hotelId
    
    if (user.role === 'superadmin' && !targetHotelId) {
      // Para superadmin sem hotel específico, buscar o primeiro hotel disponível
      const url = new URL(req.url)
      const hotelIdParam = url.searchParams.get('hotelId')
      
      if (hotelIdParam) {
        targetHotelId = hotelIdParam
      } else {
        // Buscar o primeiro hotel disponível
        const firstHotel = await prisma.hotel.findFirst({
          select: { id: true }
        })
        
        if (firstHotel) {
          targetHotelId = firstHotel.id
        } else {
          return NextResponse.json({ 
            error: 'No hotels found',
            autoGeneratePosts: false,
            postFrequency: 'weekly',
            maxMonthlyPosts: 8,
            themePreferences: ''
          }, { status: 200 })
        }
      }
    }

    if (!targetHotelId) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const hotel = await prisma.hotel.findUnique({ 
      where: { id: targetHotelId },
      select: {
        id: true,
        redeId: true,
        autoGeneratePosts: true,
        postFrequency: true,
        maxMonthlyPosts: true,
        themePreferences: true
      }
    })

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    if (!canViewAutomation(user, hotel)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      autoGeneratePosts: hotel.autoGeneratePosts,
      postFrequency: hotel.postFrequency || 'weekly',
      maxMonthlyPosts: hotel.maxMonthlyPosts || 8,
      themePreferences: hotel.themePreferences || ''
    })
  } catch (error) {
    console.error('Error fetching automation settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      hotelId: decoded.hotelId,
      redeId: decoded.redeId
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let targetHotelId = user.hotelId
    
    if (user.role === 'superadmin' && !targetHotelId) {
      // Para superadmin sem hotel específico, buscar o primeiro hotel disponível
      const url = new URL(req.url)
      const hotelIdParam = url.searchParams.get('hotelId')
      
      if (hotelIdParam) {
        targetHotelId = hotelIdParam
      } else {
        // Buscar o primeiro hotel disponível
        const firstHotel = await prisma.hotel.findFirst({
          select: { id: true }
        })
        
        if (firstHotel) {
          targetHotelId = firstHotel.id
        } else {
          return NextResponse.json({ error: 'No hotels found' }, { status: 404 })
        }
      }
    }

    if (!targetHotelId) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const hotel = await prisma.hotel.findUnique({ 
      where: { id: targetHotelId },
      select: {
        id: true,
        redeId: true
      }
    })

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    if (!canEditAutomation(user, hotel)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await req.json()
    const { autoGeneratePosts, postFrequency, maxMonthlyPosts, themePreferences } = data

    await prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        autoGeneratePosts: autoGeneratePosts,
        postFrequency,
        maxMonthlyPosts,
        themePreferences
      }
    })

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating automation settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}