const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSamplePosts() {
  try {
    console.log('🌱 Criando posts de exemplo...')
    
    // Buscar o hotel e usuário existentes
    const hotel = await prisma.hotel.findFirst()
    const user = await prisma.user.findFirst()
    
    if (!hotel || !user) {
      console.error('❌ Hotel ou usuário não encontrado. Execute o seed primeiro.')
      return
    }
    
    console.log('📝 Hotel encontrado:', hotel.name)
    console.log('👤 Usuário encontrado:', user.email)
    
    // Criar posts de exemplo
    const posts = [
      {
        title: 'Bem-vindos ao nosso hotel!',
        content: 'Estamos muito felizes em recebê-los em nosso hotel. Aqui você encontrará o melhor em hospitalidade e conforto.',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        slug: 'bem-vindos-ao-nosso-hotel',
        hotelId: hotel.id,
        authorId: user.id,
        publishedAt: new Date()
      },
      {
        title: 'Nossas suítes de luxo',
        content: 'Conheça nossas incríveis suítes de luxo com vista para a cidade. Cada detalhe foi pensado para proporcionar máximo conforto.',
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        slug: 'nossas-suites-de-luxo',
        hotelId: hotel.id,
        authorId: user.id,
        publishedAt: new Date()
      },
      {
        title: 'Restaurante premiado',
        content: 'Nosso restaurante foi premiado pela excelência gastronômica. Venha experimentar pratos únicos preparados por chefs renomados.',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        slug: 'restaurante-premiado',
        hotelId: hotel.id,
        authorId: user.id,
        publishedAt: new Date()
      },
      {
        title: 'Spa e bem-estar',
        content: 'Relaxe e renove suas energias em nosso spa completo. Oferecemos massagens, tratamentos faciais e muito mais.',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
        slug: 'spa-e-bem-estar',
        hotelId: hotel.id,
        authorId: user.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Agendado para amanhã
      },
      {
        title: 'Eventos corporativos',
        content: 'Nosso hotel é o local perfeito para seus eventos corporativos. Salas modernas e equipadas com a melhor tecnologia.',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        slug: 'eventos-corporativos',
        hotelId: hotel.id,
        authorId: user.id
        // Sem publishedAt nem scheduledAt = rascunho
      }
    ]
    
    for (const postData of posts) {
      const existingPost = await prisma.post.findUnique({
        where: { slug: postData.slug }
      })
      
      if (!existingPost) {
        const post = await prisma.post.create({
          data: postData
        })
        console.log('✅ Post criado:', post.title)
      } else {
        console.log('⚠️  Post já existe:', postData.title)
      }
    }
    
    console.log('\n🎉 Posts de exemplo criados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao criar posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSamplePosts()