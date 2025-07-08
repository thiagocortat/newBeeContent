/**
 * Configuração de ambiente para BeeContent
 * Centraliza todas as variáveis de ambiente e configurações
 */

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    // Detecta automaticamente se é SQLite ou PostgreSQL
    isPostgreSQL: process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('prisma+postgres://') || false,
    isSQLite: !process.env.DATABASE_URL?.startsWith('postgresql://') && !process.env.DATABASE_URL?.startsWith('prisma+postgres://'),
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-development-only',
    jwtExpiresIn: '7d',
  },

  // AI Services
  ai: {
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      enabled: !!process.env.GROQ_API_KEY,
    },
    replicate: {
      apiToken: process.env.REPLICATE_API_TOKEN,
      enabled: !!process.env.REPLICATE_API_TOKEN,
    },
    runware: {
      apiKey: process.env.RUNWARE_API_KEY,
      enabled: !!process.env.RUNWARE_API_KEY,
    },
    // Provedor de imagens: 'replicate' ou 'runware'
    imageProvider: (process.env.IMAGE_PROVIDER as 'replicate' | 'runware') || 'replicate',
  },

  // Application
  app: {
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    name: 'BeeContent',
    version: '1.0.0',
  },

  // Upload
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    uploadDir: 'public/uploads',
  },

  // Posts
  posts: {
    defaultPageSize: 10,
    maxPageSize: 50,
  },

  // Validation helpers
  validate: {
    hasRequiredEnvVars(): { valid: boolean; missing: string[] } {
      const required = ['JWT_SECRET']
      const missing = required.filter(key => !process.env[key])
      
      return {
        valid: missing.length === 0,
        missing
      }
    },

    hasAIServices(): { groq: boolean; replicate: boolean; runware: boolean; hasImageProvider: boolean } {
      const groq = !!process.env.GROQ_API_KEY
      const replicate = !!process.env.REPLICATE_API_TOKEN
      const runware = !!process.env.RUNWARE_API_KEY
      
      return {
        groq,
        replicate,
        runware,
        hasImageProvider: replicate || runware
      }
    },

    isDatabaseConfigured(): boolean {
      return !!process.env.DATABASE_URL
    }
  }
}

// Validação automática no startup (apenas em desenvolvimento)
if (config.isDevelopment) {
  const validation = config.validate.hasRequiredEnvVars()
  if (!validation.valid) {
    console.warn('⚠️  Variáveis de ambiente faltando:', validation.missing)
    console.warn('📝 Copie .env.example para .env e configure as variáveis')
  }

  const aiServices = config.validate.hasAIServices()
  if (!aiServices.groq) {
    console.warn('⚠️  GROQ_API_KEY não configurada - Geração de conteúdo desabilitada')
  }
  
  if (!aiServices.hasImageProvider) {
    console.warn('⚠️  Nenhum provedor de imagem configurado - Geração de imagens desabilitada')
    console.warn('📝 Configure REPLICATE_API_TOKEN ou RUNWARE_API_KEY')
  } else {
    console.log(`✅ Provedor de imagens ativo: ${config.ai.imageProvider.toUpperCase()}`)
    if (!aiServices.replicate) {
      console.warn('⚠️  REPLICATE_API_TOKEN não configurada')
    }
    if (!aiServices.runware) {
      console.warn('⚠️  RUNWARE_API_KEY não configurada')
    }
  }
}

export default config