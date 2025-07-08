import { notFound } from 'next/navigation'
import { prisma } from '../../../lib/database'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Building2, Users, Plane, Heart } from 'lucide-react'

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
  const postsByHotel = rede.hotels.map(hotel => ({
    hotel,
    posts: posts.filter(post => post.hotel.slug === hotel.slug)
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="relative h-96 bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="text-center w-full">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-serif font-bold text-white tracking-tight">
                {rede.name}
              </h1>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Descubra experiências únicas e momentos inesquecíveis em nossos destinos exclusivos
            </p>
            <div className="flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{rede.hotels.length} {rede.hotels.length === 1 ? 'Destino' : 'Destinos'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="font-medium">{posts.length} {posts.length === 1 ? 'História' : 'Histórias'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-20">
          {postsByHotel.map(({ hotel, posts: hotelPosts }) => {
            const theme = getThemeConfig(hotel)
            const categories = [hotel.city, hotel.state].filter(Boolean)
            
            return (
              <section key={hotel.slug} id={`hotel-${hotel.slug}`} className="scroll-mt-20">
                <div className="mb-12">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-gray-900 mb-3">
                        {hotel.name}
                      </h2>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{hotel.city}, {hotel.state}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <Badge key={category} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/${rede.slug}/${hotel.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plane className="w-4 h-4" />
                      Explorar Destino
                    </Link>
                  </div>
                </div>

                {hotelPosts.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {hotelPosts.map((post, index) => {
                      const isLarge = index === 0
                      return (
                        <Card key={post.id} className={`group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${isLarge ? 'lg:col-span-2' : ''}`}>
                          <CardContent className="p-0">
                            <Link href={`/${rede.slug}/${hotel.slug}/${post.slug}`}>
                              <div className={`flex ${isLarge ? 'flex-col' : 'flex-row'} h-full`}>
                                {post.imageUrl && (
                                  <div className={`relative overflow-hidden ${isLarge ? 'aspect-[21/9]' : 'w-1/3 aspect-square'}`}>
                                    <Image
                                      src={post.imageUrl}
                                      alt={post.title}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                  </div>
                                )}
                                <div className={`p-6 flex flex-col justify-between ${isLarge ? '' : 'flex-1'}`}>
                                  <div>
                                    <h3 className={`font-serif font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors ${isLarge ? 'text-2xl' : 'text-lg'} line-clamp-2`}>
                                      {post.title}
                                    </h3>
                                    <p className={`text-gray-600 mb-4 ${isLarge ? 'text-base' : 'text-sm'} ${isLarge ? 'line-clamp-3' : 'line-clamp-2'}`}>
                                      {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Calendar className="w-4 h-4" />
                                      <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all">
                                      <span>Ler mais</span>
                                      <Heart className="w-4 h-4" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
                
                {hotelPosts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum post disponível para este hotel ainda.</p>
                  </div>
                )}
              </section>
            )
          })}
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