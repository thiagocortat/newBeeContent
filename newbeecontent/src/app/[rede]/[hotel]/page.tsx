import { notFound } from 'next/navigation'
import { prisma } from '../../../../lib/database'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Users, Plane, Heart, Building2, Globe, Star, ExternalLink } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href={`/${hotel.rede.slug}`} className="text-blue-600 hover:underline">
            ← Voltar para {hotel.rede.name}
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4">{hotel.name}</h1>
          <p className="text-gray-600 mb-4">{hotel.city}, {hotel.state} - {hotel.country}</p>
          <p className="text-gray-700">Rede: {hotel.rede.name}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Artigos sobre {hotel.name}</h2>
          
          {hotel.posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Em breve, novas histórias sobre {hotel.name}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotel.posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Link href={`/${hotel.rede.slug}/${hotel.slug}/${post.slug}`}>
                      <div className="block">
                        {post.imageUrl && (
                          <div className="relative h-48">
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {post.content.substring(0, 150)}...
                          </p>
                          {post.publishedAt && (
                            <p className="text-gray-500 text-xs mt-2">
                              {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
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
    description: `Descubra histórias e experiências sobre ${hotel.name} em ${hotel.city}, ${hotel.state}.`
  }
}