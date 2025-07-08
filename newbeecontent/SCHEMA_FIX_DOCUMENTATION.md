# Correção do Erro: `The column Hotel.nextScheduledAt does not exist`

## Problema Identificado

O erro `P2022` persistia em produção devido à incompatibilidade entre:
- **Desenvolvimento**: SQLite com migrations específicas
- **Produção**: PostgreSQL sem as colunas `nextScheduledAt` e `nextSuggestedTitle`

## Soluções Implementadas

### 1. Migration PostgreSQL Específica
- **Arquivo**: `prisma/migrations/20250708_192908_postgres_schema_sync/migration.sql`
- **Função**: Cria todas as tabelas com tipos PostgreSQL corretos
- **Inclui**: Coluna `nextScheduledAt` como `TIMESTAMP(3)`

### 2. Scripts de Correção

#### `scripts/force-postgres-migration.js`
- Força aplicação das migrations PostgreSQL
- Reseta estado das migrations se necessário
- Verifica estrutura da tabela após aplicação

#### `scripts/verify-production-schema.js`
- Verifica conectividade com banco PostgreSQL
- Detecta colunas ausentes automaticamente
- Aplica correções SQL diretas se necessário
- Testa queries com `nextScheduledAt`

### 3. Deploy Automatizado

#### `scripts/deploy-production.js` (Atualizado)
1. Configura schema para PostgreSQL
2. Gera Prisma Client com Accelerate
3. **NOVO**: Executa verificação de schema
4. Aplica migrations/correções se necessário
5. Faz build da aplicação

### 4. Comandos NPM Adicionados

```json
{
  "db:force-postgres": "node scripts/force-postgres-migration.js"
}
```

### 5. Configuração de Lock de Migration

**Arquivo**: `prisma/migrations/migration_lock.toml`
```toml
provider = "postgresql"
```

## Como Usar em Caso de Problemas

### Em Desenvolvimento
```bash
npm run dev  # Configura SQLite automaticamente
```

### Em Produção (Vercel)
```bash
npm run build  # Executa verificação automática
```

### Correção Manual (se necessário)
```bash
npm run db:force-postgres  # Força migração PostgreSQL
```

## Verificação de Funcionamento

### Script de Teste
```bash
node scripts/test-production-api.js
```

### Verificação Manual
1. Deploy realizado com sucesso ✅
2. API responde com status 401 (autenticação) ✅
3. Sem erros de schema ✅

## Estrutura Final da Tabela Hotel (PostgreSQL)

```sql
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    -- ... outros campos ...
    "nextScheduledAt" TIMESTAMP(3),      -- ✅ ADICIONADO
    "nextSuggestedTitle" TEXT,            -- ✅ ADICIONADO
    "autoGeneratePosts" BOOLEAN NOT NULL DEFAULT false,
    -- ... campos restantes ...
    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);
```

## Prevenção de Problemas Futuros

1. **Migrations Específicas**: Sempre criar migrations para cada provedor
2. **Verificação Automática**: Script de verificação no deploy
3. **Fallbacks**: Múltiplas estratégias de correção
4. **Documentação**: Este arquivo para referência

## Status

✅ **RESOLVIDO**: O erro `P2022` foi corrigido com sucesso
✅ **TESTADO**: Deploy em produção funcionando
✅ **DOCUMENTADO**: Soluções implementadas e documentadas