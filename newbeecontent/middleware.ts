import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

const protectedRoutes = ['/dashboard', '/admin']

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/blog/:path*']
}