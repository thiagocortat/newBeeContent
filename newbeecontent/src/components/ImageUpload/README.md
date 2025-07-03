# ImageUpload Component

Um componente React reutilizável para upload e exibição de imagens com funcionalidades avançadas.

## 🚀 Funcionalidades

- ✅ Upload de arquivos via drag & drop ou clique
- ✅ Validação de tipo e tamanho de arquivo
- ✅ Suporte a múltiplos formatos (WEBP, JPG, PNG, GIF, SVG)
- ✅ Estados de carregamento e erro
- ✅ Lazy loading para performance
- ✅ Acessibilidade completa (ARIA labels)
- ✅ Responsivo e customizável
- ✅ TypeScript com tipagem completa

## 📦 Instalação

```bash
npm install
```

## 🔧 Uso Básico

```tsx
import ImageUpload from '@/components/ImageUpload'

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('')

  return (
    <ImageUpload
      value={imageUrl}
      onChange={setImageUrl}
    />
  )
}
```

## 🎛️ Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string` | - | URL da imagem atual |
| `onChange` | `(url: string) => void` | - | Callback chamado quando a URL muda |
| `maxSize` | `number` | `5242880` | Tamanho máximo em bytes (5MB) |
| `className` | `string` | `''` | Classes CSS adicionais |

## 🎨 Exemplos Avançados

### Com validação customizada

```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  maxSize={2 * 1024 * 1024} // 2MB
  className="my-custom-class"
/>
```

### Com hook customizado

```tsx
import { useImageUpload } from '../../hooks/useImageUpload'

function AdvancedUpload() {
  const { uploadFile, uploading, error } = useImageUpload({
    maxSize: 10 * 1024 * 1024 // 10MB
  })
  
  const handleFileSelect = async (file: File) => {
    const result = await uploadFile(file)
    if (result) {
      console.log('Upload successful:', result.url)
    }
  }

  return (
    <div>
      {uploading && <p>Uploading...</p>}
      {error && <p>Error: {error}</p>}
      {/* Your upload UI */}
    </div>
  )
}
```

## 🔧 Utilitários

### Validação de imagens

```tsx
import { isValidImageUrl, formatFileSize } from '../../utils/imageUtils'

// Verificar se URL é válida
const isValid = isValidImageUrl('https://example.com/image.webp')

// Formatar tamanho do arquivo
const size = formatFileSize(1024000) // "1000 KB"
```

### Compressão de imagens

```tsx
import { compressImage } from '../../utils/imageUtils'

const compressedFile = await compressImage(originalFile, 0.8)
```

## 🎯 Estados do Componente

### Estado de Upload
- **Idle**: Aguardando seleção de arquivo
- **Uploading**: Upload em progresso
- **Success**: Upload concluído com sucesso
- **Error**: Erro durante upload ou carregamento

### Estados Visuais
- **Empty**: Nenhuma imagem selecionada
- **Loading**: Imagem carregando
- **Loaded**: Imagem carregada com sucesso
- **Error**: Erro ao carregar imagem

## 🔒 Validações

### Tamanho de Arquivo
- Padrão: 5MB máximo
- Customizável via prop `maxSize`
- Mensagem de erro amigável

### Tipos de Arquivo
- Suportados: `image/*`, `.webp`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`
- Validação no frontend e backend
- Fallback para tipos não suportados

## ♿ Acessibilidade

- **ARIA Labels**: Todos os elementos interativos têm labels descritivos
- **Keyboard Navigation**: Totalmente navegável via teclado
- **Screen Readers**: Compatível com leitores de tela
- **Focus Management**: Estados de foco bem definidos

## 🧪 Validação

### Cenários Validados
- ✅ Renderização com e sem imagem
- ✅ Upload de arquivo válido
- ✅ Validação de tamanho e tipo
- ✅ Estados de erro e carregamento
- ✅ Remoção de imagem
- ✅ Acessibilidade

## 🎨 Customização

### CSS Classes

```css
/* Customizar área de upload */
.image-upload-area {
  border: 2px dashed #e5e7eb;
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.image-upload-area:hover {
  border-color: #9ca3af;
}

/* Customizar imagem */
.uploaded-image {
  max-height: 16rem;
  object-fit: cover;
  border-radius: 0.5rem;
}
```

### Temas

```tsx
// Tema escuro
<ImageUpload
  className="dark:bg-gray-800 dark:border-gray-600"
  value={imageUrl}
  onChange={setImageUrl}
/>
```

## 🔧 API Backend

O componente espera uma API em `/api/upload` que:

```typescript
// POST /api/upload
// Content-Type: multipart/form-data

// Response
{
  "url": "https://example.com/uploads/image.webp",
  "filename": "image.webp",
  "size": 1024000,
  "mimeType": "image/webp"
}
```

## 🐛 Troubleshooting

### Imagem não aparece
1. Verificar se a URL está acessível
2. Verificar CORS headers
3. Verificar formato do arquivo

### Upload falha
1. Verificar tamanho do arquivo
2. Verificar endpoint da API
3. Verificar permissões do servidor

### Performance
1. Usar lazy loading
2. Comprimir imagens grandes
3. Implementar cache de imagens

## 📚 Recursos Relacionados

- [Hook useImageUpload](../../hooks/useImageUpload.ts)
- [Utilitários de Imagem](../../utils/imageUtils.ts)
- [Tipos TypeScript](../../types/image.ts)
- [Componente ImageUpload](../ImageUpload.tsx)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Adicione testes para novas funcionalidades
4. Execute os testes existentes
5. Submeta um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.