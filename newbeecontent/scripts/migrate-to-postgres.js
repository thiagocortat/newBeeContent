const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  console.log('🔄 Iniciando migração SQLite -> PostgreSQL...')
  
  // Cliente SQLite (fonte)
  const sqliteClient = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db'
      }
    }
  })
  
  // Cliente PostgreSQL (destino)
  const postgresClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  
  try {
    console.log('📊 Conectando aos bancos...')
    
    // Verificar se PostgreSQL já tem dados
    const existingUser = await postgresClient.user.findFirst()
    if (existingUser) {
      console.log('✅ PostgreSQL já populado!')
      console.log('📧 Email:', existingUser.email)
      console.log('🔑 Senha: admin123')
      return
    }
    
    // Buscar dados do SQLite
    console.log('📥 Buscando dados do SQLite...')
    const users = await sqliteClient.user.findMany()
    const redes = await sqliteClient.rede.findMany()
    const hotels = await sqliteClient.hotel.findMany()
    
    console.log(`📊 Encontrados: ${users.length} usuários, ${redes.length} redes, ${hotels.length} hotéis`)
    
    if (users.length === 0) {
      console.log('❌ Nenhum dado encontrado no SQLite')
      return
    }
    
    // Migrar usuários
    console.log('👤 Migrando usuários...')
    for (const user of users) {
      await postgresClient.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      })
      console.log(`✅ Usuário migrado: ${user.email}`)
    }
    
    // Migrar redes
    console.log('🏢 Migrando redes...')
    for (const rede of redes) {
      await postgresClient.rede.create({
        data: {
          id: rede.id,
          name: rede.name,
          description: rede.description,
          userId: rede.userId,
          createdAt: rede.createdAt,
          updatedAt: rede.updatedAt
        }
      })
      console.log(`✅ Rede migrada: ${rede.name}`)
    }
    
    // Migrar hotéis
    console.log('🏨 Migrando hotéis...')
    for (const hotel of hotels) {
      await postgresClient.hotel.create({
        data: {
          id: hotel.id,
          name: hotel.name,
          description: hotel.description,
          slug: hotel.slug,
          customDomain: hotel.customDomain,
          userId: hotel.userId,
          redeId: hotel.redeId,
          createdAt: hotel.createdAt,
          updatedAt: hotel.updatedAt
        }
      })
      console.log(`✅ Hotel migrado: ${hotel.name}`)
    }
    
    console.log('\n✅ Migração concluída com sucesso!')
    console.log('📧 Email: admin@beecontent.com')
    console.log('🔑 Senha: admin123')
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    await sqliteClient.$disconnect()
    await postgresClient.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Falha na migração:', e)
    process.exit(1)
  })