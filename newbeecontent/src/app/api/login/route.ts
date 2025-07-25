import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário no banco com roles relacionados
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
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

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    // Verificar senha
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: 'Senha inválida' },
        { status: 401 }
      )
    }

    // Determinar hotelId e redeId principais baseado nos roles
    const primaryRedeId = user.redeRoles.length > 0 ? user.redeRoles[0].redeId : null
    const primaryHotelId = user.hotelRoles.length > 0 ? user.hotelRoles[0].hotelId : null

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        hotelId: primaryHotelId,
        redeId: primaryRedeId
      }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '7d' }
    )

    // Definir cookie httpOnly
    const cookieStore = await cookies()
    cookieStore.set('token', token, { 
      httpOnly: true, 
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return NextResponse.json(
      { 
        message: 'Login realizado com sucesso',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          hotelId: primaryHotelId,
          redeId: primaryRedeId
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}