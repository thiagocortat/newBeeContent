# 🐝 BeeContent

**Sistema de blogs automatizados para hotéis com IA integrada**

Uma plataforma completa para hotéis criarem e gerenciarem blogs automaticamente, com geração de conteúdo por IA, domínios personalizados e design moderno.

## ✨ Funcionalidades

- 🤖 **Geração automática de posts** com IA (Groq)
- 🎨 **Geração de imagens** com IA (Replicate ou Runware)
- 🌐 **Multi-tenant** com domínios personalizados
- 📱 **Design responsivo** e moderno
- 🔐 **Sistema de autenticação** completo
- 📊 **Analytics** e métricas de posts
- 🗄️ **Suporte a SQLite e PostgreSQL**

## 🚀 Início Rápido

### Configuração Automática (Recomendado)

```bash
# 1. Clonar o repositório
git clone <repository-url>
cd newbeecontent

# 2. Instalar dependências
npm install

# 3. Configurar ambiente de desenvolvimento
npm run setup:dev

# 4. Configurar banco de dados
npm run db:push

# 5. Popular com dados iniciais
npm run seed

# 6. Iniciar servidor
npm run dev
```

### Configuração Manual

```bash
# 1. Copiar arquivo de ambiente
cp .env.example .env

# 2. Editar .env com suas configurações
# 3. Configurar banco de dados
npm run db:generate
npm run db:push
npm run seed

# 4. Iniciar desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 🌍 Configuração de Ambiente

O BeeContent suporta **dois ambientes**:

- **🔧 Desenvolvimento**: SQLite (zero configuração)
- **🚀 Produção**: PostgreSQL (recomendado)

### Scripts Disponíveis

```bash
npm run setup:dev      # Configurar desenvolvimento
npm run setup:prod     # Configurar produção
npm run db:studio      # Abrir Prisma Studio
npm run deploy:check   # Verificar configurações
```

📖 **Documentação completa**: [ENVIRONMENT.md](./ENVIRONMENT.md)

## 🏗️ Tecnologias

- **Framework**: Next.js 15 com App Router
- **Banco de Dados**: Prisma + SQLite/PostgreSQL
- **Autenticação**: JWT
- **IA**: Groq (texto) + Replicate/Runware (imagens)
- **Estilo**: Tailwind CSS
- **Deploy**: Vercel

## 📁 Estrutura do Projeto

```
src/
├── app/                 # App Router (Next.js 15)
│   ├── api/            # API Routes
│   ├── dashboard/      # Painel administrativo
│   ├── blog/           # Páginas públicas do blog
│   └── all-posts/      # Lista de todos os posts
├── components/         # Componentes reutilizáveis
└── lib/               # Utilitários e configurações

prisma/
├── schema.prisma      # Schema do banco de dados
└── seed.ts           # Dados iniciais

scripts/
├── setup-environment.js  # Configurador de ambiente
└── test-deploy.js        # Verificador de deploy
```

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# 1. Configurar produção
npm run setup:prod

# 2. Verificar configurações
npm run deploy:check

# 3. Deploy
npx vercel --prod
```

📖 **Guia completo de deploy**: [DEPLOY.md](./DEPLOY.md)

## 🔧 Desenvolvimento

### Comandos Úteis

```bash
# Banco de dados
npm run db:studio      # Interface visual do banco
npm run db:reset       # Resetar banco + seed

# Desenvolvimento
npm run dev            # Servidor de desenvolvimento
npm run build          # Build para produção
npm run lint           # Verificar código
```

### Variáveis de Ambiente

```env
# Obrigatórias
DATABASE_URL="file:./dev.db"
JWT_SECRET="seu-jwt-secret"

# Opcionais (para IA)
GROQ_API_KEY="sua-chave-groq"

# Geração de imagens (escolha um ou ambos)
REPLICATE_API_TOKEN="seu-token-replicate"
RUNWARE_API_KEY="sua-chave-runware"
IMAGE_PROVIDER="replicate"  # ou "runware"
```

## 📚 Documentação

- [🌍 Configuração de Ambiente](./ENVIRONMENT.md)
- [🚀 Guia de Deploy](./DEPLOY.md)
- [📖 Next.js Documentation](https://nextjs.org/docs)
- [🔧 Prisma Documentation](https://www.prisma.io/docs)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**💡 Dica**: Use `npm run setup:dev` para configuração rápida!
