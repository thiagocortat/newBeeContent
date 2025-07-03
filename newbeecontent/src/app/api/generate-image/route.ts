import { NextRequest, NextResponse } from 'next/server'
import { generateBlogImage } from '../../../../lib/image-service'
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

    console.log('Iniciando geração de imagem com prompt:', prompt)
    
    let imageUrl: string
    
    try {
      // Gerar imagem usando o provedor configurado (Replicate ou Runware)
      imageUrl = await generateBlogImage(prompt)
      console.log('Imagem gerada com sucesso:', imageUrl)
    } catch (imageError: any) {
      console.warn('Falha na geração de imagem, usando placeholder:', imageError.message)
      // Fallback para placeholder em caso de erro
      imageUrl = `https://via.placeholder.com/800x450/4F46E5/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 50))}`
    }
    
    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('Erro detalhado ao gerar imagem:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    })
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    )
  }
}