const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupDevData() {
  try {
    console.log('Verificando dados de desenvolvimento...')
    
    // Verificar se já existe o usuário de desenvolvimento
    let user = await prisma.user.findUnique({
      where: { id: 'user-dev-123' }
    })
    
    if (!user) {
      console.log('Criando usuário de desenvolvimento...')
      user = await prisma.user.create({
        data: {
          id: 'user-dev-123',
          email: 'dev@example.com',
          password: 'dev123',
          role: 'admin'
        }
      })
      console.log('Usuário criado:', user.email)
    } else {
      console.log('Usuário de desenvolvimento já existe:', user.email)
    }
    
    // Verificar se já existe o hotel de desenvolvimento
    let hotel = await prisma.hotel.findFirst({
      where: { ownerId: 'user-dev-123' }
    })
    
    if (!hotel) {
      console.log('Criando hotel de desenvolvimento...')
      hotel = await prisma.hotel.create({
        data: {
          id: 'hotel-dev-1',
          name: 'Hotel Desenvolvimento',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil',
          travelType: 'negócios',
          audience: 'executivos',
          season: 'ano todo',
          events: 'eventos corporativos',
          ownerId: 'user-dev-123'
        }
      })
      console.log('Hotel criado:', hotel.name)
    } else {
      console.log('Hotel de desenvolvimento já existe:', hotel.name)
    }
    
    console.log('\nDados de desenvolvimento configurados com sucesso!')
    console.log('User ID:', user.id)
    console.log('Hotel ID:', hotel.id)
    
  } catch (error) {
    console.error('Erro ao configurar dados de desenvolvimento:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDevData()