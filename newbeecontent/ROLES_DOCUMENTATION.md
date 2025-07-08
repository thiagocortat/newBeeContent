# Estrutura de Roles - BeeContent

Este documento descreve a nova estrutura hierárquica de roles implementada no BeeContent.

## Estrutura de Roles

| Role         | Nível de atuação | Permissões principais                                                                 |
| ------------ | ---------------- | ------------------------------------------------------------------------------------- |
| `superadmin` | sistema global   | Gerencia todas as redes, usuários, conteúdo, domínios, temas, etc.                    |
| `admin`      | por rede         | Cria/edita/exclui hotéis da rede, gerencia usuários da rede, visualiza todos os posts |
| `editor`     | por hotel        | Cria/edita/publica posts do hotel, agenda, gera com IA, vê analytics                  |
| `viewer`     | por hotel        | Acesso só leitura ao dashboard e analytics                                            |

## Modelos do Banco de Dados

### UserRedeRole
Gerencia permissões de usuários por rede:
- `userId`: ID do usuário
- `redeId`: ID da rede
- `role`: 'admin' (administrador da rede)

### UserHotelRole
Gerencia permissões de usuários por hotel:
- `userId`: ID do usuário
- `hotelId`: ID do hotel
- `role`: 'editor' ou 'viewer'

## Funcionalidades de Permissão

O arquivo `lib/permissions.ts` contém as seguintes funções:

### Funções Principais
- `getUserFromToken(req)`: Extrai informações do usuário do token JWT
- `isSuperAdmin(user)`: Verifica se o usuário é superadmin
- `canManageRede(user, redeId)`: Verifica se pode gerenciar uma rede
- `canViewRede(user, redeId)`: Verifica se pode visualizar uma rede
- `canManageHotel(user, hotelId, redeId?)`: Verifica se pode gerenciar um hotel
- `canViewHotel(user, hotelId, redeId?)`: Verifica se pode visualizar um hotel
- `canCreatePosts(user, hotelId, redeId?)`: Verifica se pode criar posts
- `canViewAnalytics(user, hotelId, redeId?)`: Verifica se pode ver analytics
- `hasPermission(user, action, resource, resourceId, redeId?)`: Função genérica de verificação

## APIs Atualizadas

### `/api/admin/redes`
- Agora requer role `superadmin`
- Lista todas as redes do sistema para administradores

### `/api/redes`
- Lista redes baseadas nas permissões do usuário
- Superadmin vê todas as redes
- Outros usuários veem apenas redes onde são proprietários ou admins

### `/api/hotels`
- Verifica permissões antes de criar hotéis
- Usuário deve poder gerenciar a rede para criar hotéis

## Migração de Dados

O script `scripts/migrate-roles.js` foi executado para:
1. Converter usuários com role 'admin' para 'superadmin'
2. Criar roles de admin para redes que o usuário possui
3. Criar roles de editor para hotéis que o usuário possui

## Como Usar

### Verificar Permissões em APIs
```typescript
import { getUserFromToken, canManageRede } from '../../../lib/permissions'

export async function POST(req: NextRequest) {
  const user = await getUserFromToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  
  if (!canManageRede(user, redeId)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  
  // Continuar com a lógica...
}
```

### Verificar Permissões em Componentes
```typescript
import { useEffect, useState } from 'react'

const [userPermissions, setUserPermissions] = useState(null)

useEffect(() => {
  // Buscar permissões do usuário via API
  fetchUserPermissions()
}, [])

// Renderizar baseado nas permissões
if (userPermissions?.canManageRede) {
  // Mostrar botões de gerenciamento
}
```

## Próximos Passos

1. Implementar interface para gerenciar roles de usuários
2. Adicionar middleware de autenticação automática
3. Criar sistema de convites para usuários
4. Implementar auditoria de ações por role
5. Adicionar notificações baseadas em permissões