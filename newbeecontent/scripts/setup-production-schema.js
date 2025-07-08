const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

console.log('🔧 Forçando configuração do schema para PRODUÇÃO');

// Ler o schema atual
let schema = fs.readFileSync(schemaPath, 'utf8');

// Configurar para PostgreSQL em produção
schema = schema.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

console.log('✅ Schema configurado para PostgreSQL (produção)');

// Escrever o schema atualizado
fs.writeFileSync(schemaPath, schema);
console.log('🎉 Schema de produção configurado com sucesso!');