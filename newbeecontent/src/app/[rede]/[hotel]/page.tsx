import { notFound } from 'next/navigation'
import { prisma } from '../../../../lib/database'
import Link from 'next/link'
import Image from 'next/image'

interface PageProps {
  params: {
    rede: string
    hotel: string
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
  author: {
    email: string
  }
}

interface HotelData {
  id: string
  name: string
  slug: string
  city: string
  state: string
  country: string
  travelType: string
  audience: string
  season: string
  events: string
  themeConfig: string | null
  rede: {
    name: string
    slug: string
  }
  posts: Post[]
}

async function getHotelData(redeSlug: string, hotelSlug: string): Promise<HotelData | null> {
  try {
    const hotel = await prisma.hotel.findFirst({
      where: {
        slug: hotelSlug,
        rede: {
          slug: redeSlug
        }
      },
      include: {
        rede: {
          select: {
            name: true,
            slug: true
          }
        },
        posts: {
          where: {
            publishedAt: {
              not: null
            }
          },
          include: {
            author: {
              select: {
                email: true
              }
            }
          },
          orderBy: {
            publishedAt: 'desc'
          }
        }
      }
    })

    return hotel
  } catch (error) {
    console.error('Erro ao buscar dados do hotel:', error)
    return null
  }
}

function getThemeConfig(hotel: { themeConfig: string | null }) {
  if (!hotel.themeConfig) {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      fontFamily: 'Inter',
      logoUrl: null
    }
  }

  try {
    const config = JSON.parse(hotel.themeConfig)
    return {
      primaryColor: config.primaryColor || '#3B82F6',
      secondaryColor: config.secondaryColor || '#1E40AF',
      fontFamily: config.fontFamily || 'Inter',
      logoUrl: config.logoUrl || null
    }
  } catch {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      fontFamily: 'Inter',
      logoUrl: null
    }
  }
}

export default async function HotelPage({ params }: PageProps) {
  const hotel = await getHotelData(params.rede, params.hotel)

  if (!hotel) {
    notFound()
  }

  const theme = getThemeConfig(hotel)

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: theme.fontFamily }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href={`/${hotel.rede.slug}`} className="hover:text-gray-700 hover:underline">
              🏢 {hotel.rede.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">🏨 {hotel.name}</span>
          </nav>

          <div className="text-center">
            {theme.logoUrl && (
              <div className="mb-6 flex justify-center">
                <Image
                  src={theme.logoUrl}
                  alt={`${hotel.name} logo`}
                  width={120}
                  height={60}
                  className="object-contain"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold mb-3" style={{ color: theme.primaryColor }}>
              🏨 Blog do Hotel {hotel.name}
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              {hotel.city}, {hotel.state} • {hotel.travelType}
            </p>
            <p className="text-gray-500 mb-4">
              {hotel.audience} • {hotel.season}
            </p>
            <div className="text-sm text-gray-500">
              {hotel.posts.length} {hotel.posts.length === 1 ? 'post publicado' : 'posts publicados'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Informações do Hotel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: theme.primaryColor }}>
            Sobre o Hotel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Localização:</span>
              <p className="text-gray-600">{hotel.city}, {hotel.state}, {hotel.country}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tipo de Viagem:</span>
              <p className="text-gray-600">{hotel.travelType}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Público-alvo:</span>
              <p className="text-gray-600">{hotel.audience}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Melhor Época:</span>
              <p className="text-gray-600">{hotel.season}</p>
            </div>
          </div>
          {hotel.events && (
            <div className="mt-4">
              <span className="font-medium text-gray-700">Eventos Locais:</span>
              <p className="text-gray-600">{hotel.events}</p>
            </div>
          )}
        </div>

        {/* Lista de posts */}
        <div className="space-y-6">
          {hotel.posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Blog do {hotel.name}</h2>
              <p className="text-gray-600 text-lg">Nenhum post publicado ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Os posts aparecerão aqui quando forem publicados.</p>
            </div>
          ) : (
            hotel.posts.map((post) => (
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
                        <span>{hotel.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{hotel.city}, {hotel.state}</span>
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                      <Link href={`/${hotel.rede.slug}/${hotel.slug}/${post.slug}`}>{post.title}</Link>
                    </h2>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                    </p>
                    
                    <Link 
                      href={`/${hotel.rede.slug}/${hotel.slug}/${post.slug}`}
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
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const hotel = await getHotelData(params.rede, params.hotel)
  
  if (!hotel) {
    return {
      title: 'Hotel não encontrado'
    }
  }

  return {
    title: `${hotel.name} - ${hotel.rede.name}`,
    description: `Confira os posts e novidades do ${hotel.name} em ${hotel.city}, ${hotel.state}. ${hotel.travelType} • ${hotel.audience}`
  }
}