// Configuracao do Prisma (versao 7 em diante).
// Aqui ficam o caminho do schema, o endereco do banco e o comando que
// popula o banco com dados de exemplo.

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  // ATENCAO: este arquivo e lido SO pela ferramenta de linha de comando do
  // Prisma (migrate, seed, studio). Quem conecta com a API no ar e o
  // PrismaService, que le a DATABASE_URL por conta propria.
  //
  // Por isso aqui usamos a DIRECT_URL: migrations precisam de uma conexao que
  // aguente DDL e travas, enquanto a API pode ir pelo pooler. Local as duas
  // apontam para o mesmo Postgres do Docker e a diferenca some.
  datasource: {
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },

  migrations: {
    path: 'prisma/migrations',
    // Comando do `pnpm db:seed`: enche o banco com o restaurante de exemplo.
    seed: 'node --import tsx prisma/seed.ts',
  },
});
