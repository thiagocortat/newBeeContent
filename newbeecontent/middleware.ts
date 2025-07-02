import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'

const prisma = new PrismaClient()
const protectedRoutes = ['/dashboard']

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  
  // Verificar se é uma rota protegida
  const isProtected = protectedRoutes.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtected) {
    const token = req.cookies.get('token')?.value

    if (!token) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    try {
      verify(token, process.env.JWT_SECRET!)
    } catch {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Multi-tenant logic para blog
  const host = req.headers.get('host')?.toLowerCase() || ''

  const hotel = await prisma.hotel.findFirst({
    where: {
      customDomain: host
    }
  })

  if (hotel) {
    url.searchParams.set('hotelId', hotel.id)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/blog/:path*']
}