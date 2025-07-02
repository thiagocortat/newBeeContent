import { NextRequest, NextResponse } from 'next/server'
import { generatePostIdeas } from '../../../../lib/groq'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 }
      )
    }

    const postContent = await generatePostIdeas(prompt)

    return NextResponse.json({ postContent })
  } catch (error) {
    console.error('Erro ao gerar ideias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}