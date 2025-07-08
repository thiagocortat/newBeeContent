const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Detectar ambiente de produção de forma mais robusta
const isProduction = 
  process.env.NODE_ENV === 'production' || 
  process.env.VERCEL_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  process.argv.includes('--production');

console.log('🔍 Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('Args:', process.argv);
console.log(`🔧 Configurando schema para ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);

// Ler o schema atual
let schema = fs.readFileSync(schemaPath, 'utf8');

if (isProduction) {
  // Configurar para PostgreSQL em produção
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  );
  console.log('✅ Schema configurado para PostgreSQL (produção)');
} else {
  // Configurar para SQLite em desenvolvimento
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );
  console.log('✅ Schema configurado para SQLite (desenvolvimento)');
}

// Escrever o schema atualizado
fs.writeFileSync(schemaPath, schema);
console.log('🎉 Schema atualizado com sucesso!');