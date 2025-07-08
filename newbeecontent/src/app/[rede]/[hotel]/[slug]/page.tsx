import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { prisma } from '../../../../../lib/database'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, User, Globe, Heart, ExternalLink, Share2, Mail, Plane, Users } from 'lucide-react'

interface PageProps {
  params: {
    rede: string
    hotel: string
    slug: string
  }
}

interface PostData {
  id: string
  title: string
  content: string
  imageUrl: string
  slug: string
  publishedAt: Date | null
  createdAt: Date
  views: { id: string }[]
  hotel: {
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
  }
  author: {
    email: string
  }
}

async function getPostData(redeSlug: string, hotelSlug: string, postSlug: string): Promise<PostData | null> {
  try {
    const post = await prisma.post.findFirst({
      where: {
        slug: postSlug,
        hotel: {
          slug: hotelSlug,
          rede: {
            slug: redeSlug
          }
        },
        publishedAt: {
          not: null
        }
      },
      include: {
        hotel: {
          include: {
            rede: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        },
        author: {
          select: {
            email: true
          }
        },
        views: {
          select: {
            id: true
          }
        }
      }
    })

    // Registrar visualização
    if (post) {
      await prisma.postView.create({
        data: {
          postId: post.id
        }
      })
    }

    return post
  } catch (error) {
    console.error('Erro ao buscar dados do post:', error)
    return null
  }
}

async function getRelatedPosts(hotelId: string, currentPostId: string, limit: number = 3) {
  try {
    return await prisma.post.findMany({
      where: {
        hotelId,
        id: {
          not: currentPostId
        },
        publishedAt: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        slug: true,
        publishedAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error('Erro ao buscar posts relacionados:', error)
    return []
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

export default async function PostPage({ params }: PageProps) {
  const post = await getPostData(params.rede, params.hotel, params.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.hotel.id, post.id)
  const theme = getThemeConfig(post.hotel)

  return (
    <div className="min-h-screen bg-neutral-50" style={{ fontFamily: theme.fontFamily }}>
      {/* Hero Image */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Breadcrumb flutuante */}
        <nav className="absolute top-6 left-6 z-10">
          <div className="flex items-center space-x-2 text-sm text-white/90 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
            <Link href={`/${post.hotel.rede.slug}`} className="hover:text-white transition-colors">
              {post.hotel.rede.name}
            </Link>
            <span>/</span>
            <Link href={`/${post.hotel.rede.slug}/${post.hotel.slug}`} className="hover:text-white transition-colors">
              {post.hotel.name}
            </Link>
          </div>
        </nav>

        {/* Título e meta informações sobrepostas */}
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <MapPin className="w-3 h-3 mr-1" />
                {post.hotel.city}, {post.hotel.state}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(post.publishedAt!).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">Por {post.hotel.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{post.views.length} {post.views.length === 1 ? 'visualização' : 'visualizações'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Artigo Principal */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          {/* Conteúdo do Post */}
          <div className="p-8 lg:p-12">
            {/* Conteúdo com tipografia elegante */}
            <div className="prose lg:prose-xl prose-neutral max-w-none prose-headings:font-serif prose-headings:text-neutral-900 prose-headings:leading-tight prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:tracking-wide prose-strong:text-neutral-900 prose-ul:text-neutral-700 prose-ol:text-neutral-700 prose-li:marker:text-indigo-500 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:italic prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown>
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Separador elegante */}
            <div className="flex items-center justify-center my-12">
              <div className="flex items-center gap-2">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-neutral-300"></div>
                <Globe className="w-5 h-5 text-neutral-400" />
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-neutral-300"></div>
              </div>
            </div>

            {/* Card do Hotel */}
            <Card className="bg-gradient-to-br from-indigo-50 to-amber-50 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
                      Sobre o {post.hotel.name}
                    </h3>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span>{post.hotel.city}, {post.hotel.state}, {post.hotel.country}</span>
                    </div>
                  </div>
                  {theme.logoUrl && (
                    <Image
                      src={theme.logoUrl}
                      alt={`${post.hotel.name} logo`}
                      width={80}
                      height={40}
                      className="object-contain"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Plane className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">País</p>
                        <p className="text-neutral-600 text-sm">{post.hotel.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">Rede</p>
                        <p className="text-neutral-600 text-sm">{post.hotel.rede.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="flex-1" style={{ backgroundColor: theme.primaryColor }}>
                    <Link href={`/${post.hotel.rede.slug}/${post.hotel.slug}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver mais histórias
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Globe className="w-4 h-4 mr-2" />
                    Visitar site do hotel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Compartilhamento */}
            <div className="mt-8 text-center">
              <h4 className="text-lg font-serif font-semibold text-neutral-900 mb-4">
                Gostou do conteúdo? Compartilhe!
              </h4>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Instagram
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>
          </div>
        </article>

        {/* Artigos Relacionados */}
        {relatedPosts.length > 0 && (
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
                  Mais Histórias do {post.hotel.name}
                </h2>
                <p className="text-neutral-600">Continue explorando nossos destinos e experiências</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost: { id: string; title: string; imageUrl: string; slug: string; publishedAt: Date | null }) => (
                  <Card key={relatedPost.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Link href={`/${post.hotel.rede.slug}/${post.hotel.slug}/${relatedPost.slug}`}>
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <Image
                          src={relatedPost.imageUrl}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-500">
                            {new Date(relatedPost.publishedAt!).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-lg text-neutral-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                          {relatedPost.title}
                        </h3>
                        <div className="mt-4 flex items-center text-indigo-600 group-hover:text-indigo-700 transition-colors">
                          <span className="text-sm font-medium">Ler história</span>
                          <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const post = await getPostData(params.rede, params.hotel, params.slug)
  
  if (!post) {
    return {
      title: 'Post não encontrado'
    }
  }

  const description = post.content.replace(/<[^>]*>/g, '').substring(0, 160)

  return {
    title: `${post.title} - ${post.hotel.name}`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: [post.imageUrl],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.email]
    }
  }
}