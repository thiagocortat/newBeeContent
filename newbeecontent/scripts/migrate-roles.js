const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateRoles() {
  console.log('Iniciando migração de roles...')
  
  try {
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      include: {
        redes: true,
        hotels: true
      }
    })
    
    console.log(`Encontrados ${users.length} usuários para migrar`)
    
    for (const user of users) {
      console.log(`Migrando usuário: ${user.email}`)
      
      // Se o usuário tem role 'admin', transformar em 'superadmin'
      if (user.role === 'admin') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'superadmin' }
        })
        console.log(`  - Usuário ${user.email} atualizado para superadmin`)
      }
      
      // Para cada rede que o usuário possui, criar um role de admin
      for (const rede of user.redes) {
        try {
          await prisma.userRedeRole.create({
            data: {
              userId: user.id,
              redeId: rede.id,
              role: 'admin'
            }
          })
          console.log(`  - Role de admin criado para rede: ${rede.name}`)
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`  - Role já existe para rede: ${rede.name}`)
          } else {
            throw error
          }
        }
      }
      
      // Para cada hotel que o usuário possui, criar um role de editor
      for (const hotel of user.hotels) {
        try {
          await prisma.userHotelRole.create({
            data: {
              userId: user.id,
              hotelId: hotel.id,
              role: 'editor'
            }
          })
          console.log(`  - Role de editor criado para hotel: ${hotel.name}`)
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`  - Role já existe para hotel: ${hotel.name}`)
          } else {
            throw error
          }
        }
      }
    }
    
    console.log('Migração concluída com sucesso!')
  } catch (error) {
    console.error('Erro durante a migração:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateRoles()