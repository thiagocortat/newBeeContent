# 🚀 Deploy BeeContent com Domínios Próprios

## 📋 Pré-requisitos

- Conta no Vercel
- Domínios configurados pelos hotéis
- Variáveis de ambiente configuradas

## 1. 🔧 Configuração de Variáveis de Ambiente

No painel da Vercel, configure as seguintes variáveis:

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="seu-jwt-secret-super-seguro"
GROQ_API_KEY="sua-chave-groq"
REPLICATE_API_TOKEN="seu-token-replicate"
```

## 2. 🌐 Deploy no Vercel

```bash
# Instalar Vercel CLI (se necessário)
npm i -g vercel@latest

# Deploy
npx vercel --prod
```

## 3. 🏨 Configuração de Domínios por Hotel

### 3.1 No Dashboard do Hotel

Cada hotel deve configurar seu `customDomain` no banco de dados:

```sql
UPDATE Hotel 
SET customDomain = 'blog.seuhotel.com.br' 
WHERE id = 'hotel-id';
```

### 3.2 Configuração DNS do Hotel

O hotel deve criar um CNAME no seu provedor de DNS:

| Subdomínio | Tipo  | Valor                    |
|------------|-------|-------------------------|
| `blog`     | CNAME | `newbeecontent.vercel.app` |

### 3.3 Adicionar Domínio no Vercel

1. Acesse o painel da Vercel
2. Vá em **Settings > Domains**
3. Clique em **Add Domain**
4. Adicione: `blog.seuhotel.com.br`
5. Siga as instruções de verificação

## 4. 🔄 Como Funciona o Multi-Tenant

### Middleware Automático

O `middleware.ts` já está configurado para:

```typescript
// Captura o host da requisição
const host = req.headers.get('host')?.toLowerCase() || ''

// Busca o hotel pelo customDomain
const hotel = await prisma.hotel.findFirst({
  where: { customDomain: host }
})

// Reescreve a URL com o hotelId
if (hotel) {
  url.searchParams.set('hotelId', hotel.id)
  return NextResponse.rewrite(url)
}
```

### Fluxo de Requisição

1. **Usuário acessa**: `https://blog.pousadaluar.com.br/blog`
2. **Middleware captura**: `blog.pousadaluar.com.br`
3. **Busca no banco**: Hotel com `customDomain = 'blog.pousadaluar.com.br'`
4. **Reescreve URL**: Adiciona `?hotelId=hotel-id-encontrado`
5. **Página renderiza**: Apenas posts deste hotel específico

## 5. 🎯 Resultado Final

### ✅ Funcionalidades Ativas

- **Blog em domínio próprio**: `https://blog.seuhotel.com.br/blog`
- **Multi-tenant automático**: Cada domínio mostra apenas seu conteúdo
- **SEO otimizado**: Cada hotel tem seu próprio domínio
- **Zero configuração manual**: Middleware resolve automaticamente

### 🔍 URLs de Exemplo

| Hotel | Domínio Próprio | Conteúdo |
|-------|----------------|----------|
| Pousada Luar | `blog.pousadaluar.com.br` | Apenas posts da Pousada Luar |
| Hotel Sol | `blog.hotelsol.com.br` | Apenas posts do Hotel Sol |
| Resort Mar | `blog.resortmar.com.br` | Apenas posts do Resort Mar |

## 6. 🛠️ Troubleshooting

### Domínio não funciona
1. Verifique se o CNAME está correto
2. Confirme se o `customDomain` está no banco
3. Aguarde propagação DNS (até 24h)

### Deploy falha
1. Verifique variáveis de ambiente
2. Confirme se o banco está acessível
3. Teste localmente primeiro

### Middleware não resolve
1. Verifique se o matcher está correto
2. Confirme se o hotel existe no banco
3. Teste com `console.log` no middleware

## 7. 📈 Próximos Passos

- [ ] Configurar SSL automático
- [ ] Implementar cache por domínio
- [ ] Adicionar analytics por hotel
- [ ] Criar dashboard de domínios

---

**🎉 Pronto! Cada hotel agora tem seu próprio blog em domínio personalizado!**