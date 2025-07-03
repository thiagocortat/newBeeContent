/**
 * Configuração e utilitários para banco de dados
 * Detecta automaticamente o tipo de banco e configura adequadamente
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { config } from './config'

// Singleton do Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

// Configurações específicas por tipo de banco
const getDatabaseConfig = (): Prisma.PrismaClientOptions => {
  const dbUrl = config.database.url
  
  if (config.database.isPostgreSQL) {
    return {
      datasources: {
        db: {
          url: dbUrl
        }
      },
      log: config.isDevelopment ? ['query', 'error', 'warn'] as Prisma.LogLevel[] : ['error'] as Prisma.LogLevel[],
    }
  }
  
  // SQLite configuration
  return {
    datasources: {
      db: {
        url: dbUrl
      }
    },
    log: config.isDevelopment ? ['query', 'error', 'warn'] as Prisma.LogLevel[] : ['error'] as Prisma.LogLevel[],
  }
}

// Criar instância do Prisma com configuração adequada
const createPrismaClient = () => {
  const client = new PrismaClient(getDatabaseConfig())
  
  // Se estiver usando Prisma Accelerate (URL começa com prisma:// ou prisma+postgres://), aplicar extensão
  if (config.database.url.startsWith('prisma://') || config.database.url.startsWith('prisma+postgres://')) {
    return client.$extends(withAccelerate())
  }
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient() as any

if (config.isDevelopment) {
  globalForPrisma.prisma = prisma
}

// Utilitários para verificação de banco
export const database = {
  /**
   * Verifica se a conexão com o banco está funcionando
   */
  async isConnected(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  },

  /**
   * Retorna informações sobre o banco de dados
   */
  getInfo() {
    return {
      type: config.database.isPostgreSQL ? 'PostgreSQL' : 'SQLite',
      url: config.database.url.replace(/\/\/.*@/, '//***:***@'), // Mascarar credenciais
      isProduction: config.isProduction,
      isDevelopment: config.isDevelopment
    }
  },

  /**
   * Executa verificações de saúde do banco
   */
  async healthCheck() {
    const info = this.getInfo()
    const isConnected = await this.isConnected()
    
    return {
      ...info,
      connected: isConnected,
      timestamp: new Date().toISOString()
    }
  },

  /**
   * Fecha a conexão com o banco (útil para testes)
   */
  async disconnect() {
    await prisma.$disconnect()
  }
}

// Log de inicialização (apenas em desenvolvimento)
if (config.isDevelopment) {
  console.log('🗄️  Database initialized:', database.getInfo())
}

export default prisma