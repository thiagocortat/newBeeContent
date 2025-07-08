import { notFound } from 'next/navigation'
import { prisma } from '../../../lib/database'
import Link from 'next/link'
import Image from 'next/image'

interface PageProps {
  params: {
    rede: string
  }
}

interface Post {
  id: string
  title: string
  content: string
  imageUrl: string
  slug: string
  publishedAt: Date | null
  createdAt: Date
  hotel: {
    name: string
    slug: string
    city: string
    state: string
    themeConfig: string | null
  }
  author: {
    email: string
  }
}

interface Rede {
  id: string
  name: string
  slug: string
  hotels: {
    name: string
    slug: string
    city: string
    state: string
    themeConfig: string | null
  }[]
}

async function getRedeData(redeSlug: string): Promise<{ rede: Rede; posts: Post[] } | null> {
  try {
    const rede = await prisma.rede.findUnique({
      where: { slug: redeSlug },
      include: {
        hotels: {
          select: {
            name: true,
            slug: true,
            city: true,
            state: true,
            themeConfig: true
          }
        }
      }
    })

    if (!rede) return null

    // Buscar todos os posts de todos os hotéis da rede
    const posts = await prisma.post.findMany({
      where: {
        hotel: {
          redeId: rede.id
        },
        publishedAt: {
          not: null
        }
      },
      include: {
        hotel: {
          select: {
            name: true,
            slug: true,
            city: true,
            state: true,
            themeConfig: true
          }
        },
        author: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    return { rede, posts }
  } catch (error) {
    console.error('Erro ao buscar dados da rede:', error)
    return null
  }
}

function getThemeConfig(hotel: { themeConfig: string | null }) {
  if (!hotel.themeConfig) {
    return {
      primaryColor: '#3B82F6',
      fontFamily: 'Inter',
      logoUrl: null
    }
  }

  try {
    return JSON.parse(hotel.themeConfig)
  } catch {
    return {
      primaryColor: '#3B82F6',
      fontFamily: 'Inter',
      logoUrl: null
    }
  }
}

export default async function RedePage({ params }: PageProps) {
  const data = await getRedeData(params.rede)

  if (!data) {
    notFound()
  }

  const { rede, posts } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-6">
        {/* Cabeçalho */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Blog da Rede {rede.name}</h1>
          </div>
          <p className="text-gray-600 text-lg">Descubra as novidades e experiências dos nossos hotéis</p>
          <div className="mt-4 text-sm text-gray-500">
            {rede.hotels.length} {rede.hotels.length === 1 ? 'hotel' : 'hotéis'} • {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </div>
        </div>
        {/* Lista de Hotéis */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nossos Hotéis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rede.hotels.map((hotel) => {
              const theme = getThemeConfig(hotel)
              return (
                <Link
                  key={hotel.slug}
                  href={`/${rede.slug}/${hotel.slug}`}
                  className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border"
                  style={{ borderColor: theme.primaryColor + '20' }}
                >
                  <h3 className="font-semibold text-gray-900" style={{ color: theme.primaryColor }}>
                    {hotel.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {hotel.city}, {hotel.state}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Lista de posts */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Blog da Rede {rede.name}</h2>
              <p className="text-gray-600 text-lg">Nenhum post publicado ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Os posts aparecerão aqui quando forem publicados.</p>
            </div>
          ) : (
            posts.map((post) => {
              const theme = getThemeConfig(post.hotel)
              return (
                <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-150">
                  <div className="md:flex">
                    {/* Imagem */}
                    {post.imageUrl && (
                      <div className="md:w-1/3">
                        <div className="aspect-video md:aspect-square w-full overflow-hidden">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            width={400}
                            height={300}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Conteúdo */}
                    <div className={`p-6 ${post.imageUrl ? 'md:w-2/3' : 'w-full'}`}>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{post.hotel.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{post.hotel.city}, {post.hotel.state}</span>
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                        <Link href={`/${rede.slug}/${post.hotel.slug}/${post.slug}`}>{post.title}</Link>
                      </h2>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                      
                      <Link 
                        href={`/${rede.slug}/${post.hotel.slug}/${post.slug}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Ler artigo completo
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const data = await getRedeData(params.rede)
  
  if (!data) {
    return {
      title: 'Rede não encontrada'
    }
  }

  return {
    title: `${data.rede.name} - Blog da Rede`,
    description: `Confira os últimos posts e novidades da rede ${data.rede.name}`
  }
}