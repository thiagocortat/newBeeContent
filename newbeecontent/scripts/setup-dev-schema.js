const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

console.log('🔧 Configurando schema para DESENVOLVIMENTO (SQLite)');

// Ler o schema atual
let schema = fs.readFileSync(schemaPath, 'utf8');

// Configurar para SQLite em desenvolvimento
schema = schema.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
);

console.log('✅ Schema configurado para SQLite (desenvolvimento)');

// Escrever o schema atualizado
fs.writeFileSync(schemaPath, schema);
console.log('🎉 Schema de desenvolvimento configurado com sucesso!');