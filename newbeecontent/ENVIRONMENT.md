# 🌍 Configuração de Ambiente - BeeContent

## 📋 Visão Geral

O BeeContent suporta **dois ambientes distintos** com configurações de banco de dados diferentes:

- **🔧 Desenvolvimento**: SQLite (local, sem configuração)
- **🚀 Produção**: PostgreSQL (recomendado para Vercel)

## 🚀 Configuração Rápida

### Para Desenvolvimento Local

```bash
# 1. Configurar ambiente automaticamente
npm run setup:dev

# 2. Instalar dependências
npm install

# 3. Configurar banco de dados
npm run db:push

# 4. Popular com dados iniciais
npm run seed

# 5. Iniciar servidor
npm run dev
```

### Para Produção (Vercel)

```bash
# 1. Configurar ambiente interativamente
npm run setup:prod

# 2. Atualizar schema para PostgreSQL
# Edite prisma/schema.prisma:
# provider = "postgresql"

# 3. Deploy
npx vercel --prod
```

## 🔧 Configuração Manual

### 1. Criar Arquivo de Ambiente

```bash
cp .env.example .env
```

### 2. Configurar Variáveis

#### Desenvolvimento (SQLite)
```env
NODE_ENV="development"
DATABASE_URL="file:./dev.db"
JWT_SECRET="seu-jwt-secret-aqui"
```

#### Produção (PostgreSQL)
```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@host:port/db"
JWT_SECRET="jwt-secret-super-seguro-32-chars"
GROQ_API_KEY="sua-chave-groq"

# Geração de imagens (escolha um ou configure ambos)
REPLICATE_API_TOKEN="seu-token-replicate"
RUNWARE_API_KEY="sua-chave-runware"
IMAGE_PROVIDER="replicate"  # ou "runware"

NEXTAUTH_URL="https://seudominio.com"
```

## 🤖 Configuração de IA

### Provedores de Geração de Conteúdo

#### Groq (Geração de Texto)
- **Obrigatório** para geração automática de posts
- Modelos: Llama 3, Mixtral, Gemma
- **Como obter**: [console.groq.com](https://console.groq.com)

```env
GROQ_API_KEY="sua-chave-groq"
```

### Provedores de Geração de Imagens

O BeeContent suporta **dois provedores** para geração de imagens:

#### Replicate
- **Modelos**: Google Imagen, SDXL, Flux
- **Qualidade**: Excelente
- **Velocidade**: Moderada
- **Como obter**: [replicate.com](https://replicate.com)

```env
REPLICATE_API_TOKEN="seu-token-replicate"
IMAGE_PROVIDER="replicate"
```

#### Runware
- **Modelos**: Stable Diffusion, Custom Models
- **Qualidade**: Excelente
- **Velocidade**: Rápida
- **Como obter**: [runware.ai](https://runware.ai)

```env
RUNWARE_API_KEY="sua-chave-runware"
IMAGE_PROVIDER="runware"
```

#### Configuração Híbrida
Você pode configurar **ambos os provedores** para ter fallback automático:

```env
# Configurar ambos
REPLICATE_API_TOKEN="seu-token-replicate"
RUNWARE_API_KEY="sua-chave-runware"

# Escolher o principal
IMAGE_PROVIDER="runware"  # Usará Runware, com Replicate como backup
```

📋 **Comparação de Provedores:**

| Característica | Replicate | Runware |
|----------------|-----------|----------|
| **Velocidade** | 🟡 Moderada | 🟢 Rápida |
| **Qualidade** | 🟢 Excelente | 🟢 Excelente |
| **Modelos** | 🟢 Muitos | 🟡 Bons |
| **Preço** | 🟡 Moderado | 🟢 Competitivo |
| **Estabilidade** | 🟢 Alta | 🟡 Boa |

## 🗄️ Configuração de Banco de Dados

### SQLite (Desenvolvimento)

✅ **Vantagens:**
- Zero configuração
- Arquivo local simples
- Ideal para desenvolvimento
- Backup fácil

❌ **Limitações:**
- Não suporta múltiplas conexões
- Não recomendado para produção
- Sem escalabilidade

### PostgreSQL (Produção)

✅ **Vantagens:**
- Suporte completo a múltiplas conexões
- Escalável e robusto
- Suporte nativo na Vercel
- Recursos avançados

📋 **Provedores Recomendados:**

| Provedor | Plano Gratuito | Integração Vercel |
|----------|----------------|-------------------|
| **Vercel Postgres** | ✅ Sim | 🟢 Nativa |
| **Supabase** | ✅ Sim | 🟡 Fácil |
| **Railway** | ✅ Sim | 🟡 Fácil |
| **Neon** | ✅ Sim | 🟡 Fácil |

## 🛠️ Scripts Disponíveis

### Configuração de Ambiente
```bash
npm run setup:dev      # Configurar desenvolvimento
npm run setup:prod     # Configurar produção
npm run setup:env      # Configurar interativo
```

### Banco de Dados
```bash
npm run db:generate    # Gerar cliente Prisma
npm run db:push        # Aplicar schema ao banco
npm run db:studio      # Abrir Prisma Studio
npm run db:reset       # Resetar banco + seed
```

### Deploy
```bash
npm run deploy:check   # Verificar configurações
npm run build          # Build para produção
```

## 🔄 Migração Entre Ambientes

### De SQLite para PostgreSQL

1. **Backup dos dados** (se necessário):
   ```bash
   npm run db:studio  # Exportar dados manualmente
   ```

2. **Atualizar schema**:
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"  // Alterar de "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Configurar nova DATABASE_URL**:
   ```env
   DATABASE_URL="postgresql://user:pass@host:port/db"
   ```

4. **Aplicar schema**:
   ```bash
   npm run db:push
   npm run seed  # Se necessário
   ```

### De PostgreSQL para SQLite

1. **Atualizar schema**:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Configurar DATABASE_URL**:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Aplicar schema**:
   ```bash
   npm run db:push
   npm run seed
   ```

## 🔍 Verificação de Configuração

### Verificar Ambiente Atual
```bash
node -e "console.log('Environment:', process.env.NODE_ENV || 'development')"
node -e "console.log('Database:', process.env.DATABASE_URL || 'Not configured')"
```

### Testar Configuração
```bash
npm run deploy:check
```

### Verificar Banco de Dados
```bash
npm run db:studio
```

## 🚨 Troubleshooting

### Erro: "Environment variable not found: DATABASE_URL"
```bash
# Verificar se .env existe
ls -la .env

# Recriar se necessário
npm run setup:dev
```

### Erro: "Can't reach database server"
```bash
# Verificar URL do PostgreSQL
echo $DATABASE_URL

# Testar conexão
npx prisma db push
```

### Erro: "JWT_SECRET is required"
```bash
# Adicionar ao .env
echo 'JWT_SECRET="seu-jwt-secret-aqui"' >> .env
```

## 📚 Recursos Adicionais

- [Prisma Database Connectors](https://www.prisma.io/docs/concepts/database-connectors)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

---

**💡 Dica**: Use `npm run setup:dev` para configuração rápida de desenvolvimento!