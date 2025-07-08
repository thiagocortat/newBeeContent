import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { prisma } from '../../../../../lib/database'
import Link from 'next/link'
import Image from 'next/image'

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
    travelType: string
    audience: string
    season: string
    events: string
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
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: theme.fontFamily }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href={`/${post.hotel.rede.slug}`} className="hover:text-gray-700">
              {post.hotel.rede.name}
            </Link>
            <span>/</span>
            <Link href={`/${post.hotel.rede.slug}/${post.hotel.slug}`} className="hover:text-gray-700">
              {post.hotel.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Post</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              {theme.logoUrl && (
                <div className="mb-4">
                  <Image
                    src={theme.logoUrl}
                    alt={`${post.hotel.name} logo`}
                    width={100}
                    height={50}
                    className="object-contain"
                  />
                </div>
              )}
              <h1 className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
                {post.hotel.name}
              </h1>
              <p className="text-gray-600 text-sm">
                {post.hotel.city}, {post.hotel.state}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {post.views.length} {post.views.length === 1 ? 'visualização' : 'visualizações'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post */}
        <article className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          {/* Imagem do Post */}
          <div className="aspect-video relative">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Conteúdo do Post */}
          <div className="p-8">
            {/* Meta informações */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span>{new Date(post.publishedAt!).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
              <span className="mx-2">•</span>
              <span>{post.views.length} {post.views.length === 1 ? 'visualização' : 'visualizações'}</span>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>

            {/* Conteúdo */}
            <div className="prose prose-lg prose-slate max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:marker:text-blue-500">
              <ReactMarkdown>
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Informações do Hotel */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.primaryColor }}>
                  Sobre o {post.hotel.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Localização:</span>
                    <p className="text-gray-600">{post.hotel.city}, {post.hotel.state}, {post.hotel.country}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tipo de Viagem:</span>
                    <p className="text-gray-600">{post.hotel.travelType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Público-alvo:</span>
                    <p className="text-gray-600">{post.hotel.audience}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Melhor Época:</span>
                    <p className="text-gray-600">{post.hotel.season}</p>
                  </div>
                </div>
                {post.hotel.events && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Eventos Locais:</span>
                    <p className="text-gray-600">{post.hotel.events}</p>
                  </div>
                )}
                <div className="mt-4">
                  <Link
                    href={`/${post.hotel.rede.slug}/${post.hotel.slug}`}
                    className="inline-flex items-center text-sm font-medium hover:underline"
                    style={{ color: theme.primaryColor }}
                  >
                    Ver todos os posts do {post.hotel.name} →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Posts Relacionados */}
        {relatedPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Outros Posts do {post.hotel.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost: { id: string; title: string; imageUrl: string; slug: string; publishedAt: Date | null }) => (
                <article key={relatedPost.id} className="group">
                  <Link href={`/${post.hotel.rede.slug}/${post.hotel.slug}/${relatedPost.slug}`}>
                    <div className="aspect-video relative mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={relatedPost.imageUrl}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(relatedPost.publishedAt!).toLocaleDateString('pt-BR')}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
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