// Configuracao do Prisma (versao 7 em diante).
// Aqui ficam o caminho do schema, o endereco do banco e o comando que
// popula o banco com dados de exemplo.

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  // Le a DATABASE_URL do arquivo .env. Na fase de deploy, e so trocar o
  // valor no .env pela string do Supabase — nada aqui muda.
  datasource: {
    url: env('DATABASE_URL'),
  },

  migrations: {
    path: 'prisma/migrations',
    // Comando do `pnpm db:seed`: enche o banco com o restaurante de exemplo.
    seed: 'node --import tsx prisma/seed.ts',
  },
});
