import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import BackToDashboardButton from '@/components/BackToDashboardButton'

const prisma = new PrismaClient()

type Props = {
  params: { slug: string }
  searchParams: { hotelId: string }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const post = await prisma.post.findFirst({
    where: {
      slug: params.slug,
      hotelId: searchParams.hotelId,
      publishedAt: { not: undefined }
    }
  })

  if (!post) return {}

  return {
    title: post.title,
    description: post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.content.slice(0, 160),
      images: post.imageUrl ? [post.imageUrl] : []
    }
  }
}

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = params
  const { hotelId } = searchParams

  const post = await prisma.post.findFirst({
    where: {
      slug,
      hotelId,
      publishedAt: { not: undefined }
    },
    include: {
      hotel: true,
      author: {
        select: {
          email: true
        }
      }
    }
  })

  if (!post) return notFound()

  // Registrar visualização (comentado pois PostView não existe no schema)
  // await prisma.postView.create({
  //   data: { postId: post.id }
  // })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Botão de voltar */}
        <div className="mb-8">
          <BackToDashboardButton />
        </div>

        {/* Artigo */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Imagem de destaque */}
          {post.imageUrl && (
            <div className="aspect-video w-full overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
              />
            </div>
          )}

          {/* Conteúdo */}
          <div className="p-8 lg:p-12">
            {/* Cabeçalho do post */}
            <header className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>
              
              {/* Metadados */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{post.author.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{post.hotel.city}, {post.hotel.state}</span>
                </div>
              </div>
            </header>

            {/* Conteúdo do post */}
            <div 
              className="prose prose-lg prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-blockquote:border-blue-200 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-900" 
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>

          {/* Rodapé */}
          <footer className="px-8 lg:px-12 pb-8">
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Publicado em {new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {post.hotel.name}
                </div>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </div>
  )
}