import axios from 'axios'

interface PostContent {
  title: string
  content: string
  seoDescription: string
  slug: string
}

interface ArticleSuggestion {
  title: string
  description: string
  keywords: string[]
  estimatedReadTime: string
}

interface HotelData {
  name: string
  city: string
  state: string
  country: string
  travelType: string
  audience: string
  season: string
  events: string
}

/**
 * Gera conteúdo estruturado para um post de blog.
 * @param baseContent Conteúdo base fornecido pelo usuário
 * @returns Objeto com título, conteúdo, descrição SEO e slug
 */
export async function generatePostIdeas(baseContent: string): Promise<PostContent> {
  const prompt = `Com base no conteúdo fornecido abaixo, gere um post completo para blog seguindo EXATAMENTE este formato JSON:

{
  "title": "Título atrativo e otimizado para SEO",
  "content": "Conteúdo completo do post formatado em **Markdown** com títulos (##), subtítulos (###), listas com marcadores (-), negritos (**texto**) e parágrafos bem separados. Mínimo 300 palavras. NÃO use HTML.",
  "seoDescription": "Meta descrição para SEO entre 150-160 caracteres",
  "slug": "slug-amigavel-para-url"
}

Formate o conteúdo em **Markdown** com:
- Títulos com ## 
- Subtítulos com ###
- Listas com marcadores usando -
- Negritos para trechos importantes usando **texto**
- Parágrafos separados por linha em branco
- NÃO use HTML diretamente

CONTEÚDO BASE:
${baseContent}

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional antes ou depois.`

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )

  // Verificar se a resposta tem a estrutura esperada
  if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
    console.error('Resposta inválida do Groq:', response.data)
    throw new Error('Resposta inválida da API do Groq')
  }

  try {
    const content = response.data.choices[0].message.content?.trim()
    if (!content) {
      throw new Error('Conteúdo vazio na resposta do Groq')
    }
    
    // Remove possíveis marcadores de código e caracteres de controle
    let cleanContent = content.replace(/```json\n?|```\n?/g, '').trim()
    // Remove caracteres de controle que podem quebrar o JSON
    cleanContent = cleanContent.replace(/[\x00-\x1F\x7F]/g, '')
    // Remove quebras de linha dentro de strings JSON
    cleanContent = cleanContent.replace(/\n(?=\s*["'}])/g, ' ')
    
    console.log('Conteúdo limpo para parsing:', cleanContent)
    const parsedContent = JSON.parse(cleanContent)
    
    // Validar se todos os campos necessários estão presentes
    if (!parsedContent.title || !parsedContent.content || !parsedContent.seoDescription || !parsedContent.slug) {
      throw new Error('Resposta incompleta do Groq')
    }
    
    return {
      title: parsedContent.title,
      content: parsedContent.content,
      seoDescription: parsedContent.seoDescription,
      slug: parsedContent.slug
    }
  } catch (error) {
    console.error('Erro ao parsear resposta do Groq:', error)
    
    // Fallback em caso de erro de parsing
    const messageContent = response.data.choices[0]?.message?.content
    if (!messageContent) {
      // Se não há conteúdo, retornar valores padrão baseados no input
      return {
        title: 'Post sobre ' + baseContent.slice(0, 50),
        content: baseContent,
        seoDescription: baseContent.slice(0, 160),
        slug: baseContent
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60) || 'post'
      }
    }
    
    const lines = messageContent.split('\n').filter((line: string) => line.trim())
    
    return {
      title: lines[0] || 'Título gerado automaticamente',
      content: lines.slice(1).join('\n') || baseContent,
      seoDescription: baseContent.slice(0, 160),
      slug: (lines[0] || 'post')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60)
    }
  }
}

/**
 * Gera sugestões de artigos baseadas nos dados do hotel.
 * @param hotelData Dados do hotel para contextualizar as sugestões
 * @returns Array com 10 sugestões de artigos
 */
export async function generateArticleSuggestions(hotelData: HotelData): Promise<ArticleSuggestion[]> {
  const prompt = `Com base nos dados do hotel fornecidos abaixo, gere 10 sugestões de artigos para blog seguindo EXATAMENTE este formato JSON:

[
  {
    "title": "Título atrativo do artigo",
    "description": "Breve descrição do que o artigo abordará (máximo 100 caracteres)",
    "keywords": ["palavra-chave1", "palavra-chave2", "palavra-chave3"],
    "estimatedReadTime": "5 min"
  }
]

DADOS DO HOTEL:
- Nome: ${hotelData.name}
- Localização: ${hotelData.city}, ${hotelData.state}, ${hotelData.country}
- Tipo de viagem: ${hotelData.travelType}
- Público-alvo: ${hotelData.audience}
- Estação do ano: ${hotelData.season}
- Eventos locais: ${hotelData.events}

Crie sugestões variadas que incluam:
- Guias de viagem locais
- Dicas sobre a estação do ano
- Atividades para o tipo de público
- Eventos e festivais locais
- Gastronomia regional
- Pontos turísticos
- Experiências únicas
- Dicas de hospedagem
- Roteiros personalizados
- Cultura local

IMPORTANTE: Responda APENAS com o array JSON válido, sem texto adicional antes ou depois.`

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )

  // Verificar se a resposta tem a estrutura esperada
  if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
    console.error('Resposta inválida do Groq:', response.data)
    throw new Error('Resposta inválida da API do Groq')
  }

  try {
    const content = response.data.choices[0].message.content?.trim()
    if (!content) {
      throw new Error('Conteúdo vazio na resposta do Groq')
    }
    
    // Remove possíveis marcadores de código e caracteres de controle
    let cleanContent = content.replace(/```json\n?|```\n?/g, '').trim()
    // Remove caracteres de controle que podem quebrar o JSON
    cleanContent = cleanContent.replace(/[\x00-\x1F\x7F]/g, '')
    
    console.log('Conteúdo limpo para parsing (sugestões):', cleanContent)
    const parsedContent = JSON.parse(cleanContent)
    
    // Validar se é um array
    if (!Array.isArray(parsedContent)) {
      throw new Error('Resposta não é um array válido')
    }
    
    // Validar cada sugestão
    const validSuggestions = parsedContent.filter(suggestion => 
      suggestion.title && 
      suggestion.description && 
      Array.isArray(suggestion.keywords) &&
      suggestion.estimatedReadTime
    )
    
    if (validSuggestions.length === 0) {
      throw new Error('Nenhuma sugestão válida encontrada')
    }
    
    return validSuggestions.slice(0, 10) // Garantir máximo de 10 sugestões
  } catch (error) {
    console.error('Erro ao parsear sugestões do Groq:', error)
    
    // Fallback com sugestões padrão baseadas nos dados do hotel
    return [
      {
        title: `Guia Completo de ${hotelData.city}: O que Fazer e Onde Ficar`,
        description: `Descubra os melhores pontos turísticos e dicas de hospedagem em ${hotelData.city}`,
        keywords: [hotelData.city, 'turismo', 'hospedagem'],
        estimatedReadTime: '8 min'
      },
      {
        title: `${hotelData.season}: A Melhor Época para Visitar ${hotelData.city}`,
        description: `Por que ${hotelData.season} é perfeita para sua viagem para ${hotelData.city}`,
        keywords: [hotelData.season, hotelData.city, 'viagem'],
        estimatedReadTime: '6 min'
      },
      {
        title: `Viagem ${hotelData.travelType} em ${hotelData.city}: Roteiro Completo`,
        description: `Planeje sua viagem ${hotelData.travelType} perfeita em ${hotelData.city}`,
        keywords: [hotelData.travelType, hotelData.city, 'roteiro'],
        estimatedReadTime: '10 min'
      }
    ]
  }
}

/**
 * Gera conteúdo de post em Markdown estruturado a partir de um título.
 * @param title Título do post a ser gerado
 * @param hotel Dados do hotel para contextualizar o conteúdo
 * @returns Conteúdo do post formatado em Markdown
 */
export async function generateMarkdownPostFromTitle(title: string, hotel: any): Promise<string> {
  const prompt = `
Gere um post de blog com aproximadamente 600 palavras com o seguinte título:

"${title}"

O post deve ser escrito no idioma português e seguir rigorosamente o formato Markdown, com a seguinte estrutura:

## Introdução
- Comece com uma introdução breve e envolvente sobre o tema.

## Destaques do Destino / Dica Principal
- Liste as principais atrações, curiosidades ou argumentos centrais.
- Use subtítulos com ### se necessário.
- Utilize listas com - ou * quando fizer sentido.

## Experiências e Benefícios
- Descreva o que o visitante pode esperar vivenciar.
- Use **negrito** para destacar palavras-chave ou benefícios relevantes.

## Eventos ou Atividades Locais
- Mencione festividades, datas comemorativas ou atividades turísticas relacionadas ao hotel ou região.

## Conclusão com CTA (Call to Action)
- Finalize incentivando o leitor a reservar, conhecer o hotel ou entrar em contato.
- Seja direto, mas natural.

Importante:
- Use parágrafos separados por uma linha em branco.
- Não utilize HTML.
- Não adicione introduções fora da estrutura.
- Retorne apenas o conteúdo em Markdown, sem comentários adicionais.

Informações úteis para o contexto:
- Hotel: ${hotel.name}
- Cidade: ${hotel.city}, ${hotel.state}
- Tipo de público: ${hotel.audience}
- Estação atual: ${hotel.season}
- Eventos: ${hotel.events}
  `

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
    console.error('Resposta inválida do Groq:', response.data)
    throw new Error('Resposta inválida da API do Groq')
  }

  const content = response.data.choices[0].message.content?.trim()
  if (!content) {
    throw new Error('Conteúdo vazio na resposta do Groq')
  }

  return content
}